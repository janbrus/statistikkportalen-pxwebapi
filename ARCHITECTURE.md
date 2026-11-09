# Architecture

Statistikkportalen is a single-page application built with vanilla JavaScript — an alternative interface for browsing and downloading statistics from SSB (Statistics Norway). No build step, no bundler, no package manager. All modules are loaded via `<script>` tags in `index.html` and communicate through the shared global scope (top-level `const`s are reachable by name from other scripts, but only some are also assigned to `window`).

The app fetches the full table catalogue (~7 000 tables) from SSB's PxWebApi v2, lets users search, browse by topic, select variables, and view/export data — all in the browser with aggressive local caching.

## Load order and dependencies

Scripts are loaded in this exact order. Code that runs at load time can only use scripts above it; function bodies run later and can also use scripts below (`router.js` calls `BrowserState`, `browser-state.js` calls `SearchEnhanced`):

```
version.js          — VERSION constant (displayed in footer)
config.js           — AppConfig, logger
translations.js     — t(), tpl(), setLanguage(), getCurrentApiLang(); translation dictionary for all UI strings
cache.js            — CacheManager (IndexedDBCache + localStorage hybrid)
api.js              — SSBApi (uses CacheManager, AppConfig)
utils.js            — AppState, renderCurrentView(), helpers, addEscapeHandler()
router.js           — URLRouter, SSBURLMapper (uses AppState, BrowserState, render*; the app never calls SSBURLMapper)
subjects.js         — SubjectConfig: subjectGroups + subjectNames (instance-specific, swapped per data source)
menu-hierarchy.js   — MenuHierarchy class (uses SubjectConfig)
browser-state.js    — BrowserState (uses api, MenuHierarchy, SearchEnhanced, AppState)
menu-bar.js         — MenuBar: compact subject-group menu for the search and topic views
front-page.js       — renderFrontPage (uses BrowserState, URLRouter)
help-view.js        — renderHelpView (in-app #hjelp guide; uses t/tpl, AppConfig, URLRouter)
synonyms.js         — SearchSynonyms: synonym groups for enhanced search (instance-specific)
search-enhanced.js  — SearchEnhanced (uses SearchSynonyms; pure scoring/ranking, no side effects)
search-view.js      — renderSearchView (uses BrowserState, SearchEnhanced, api)
topic-view.js       — renderTopicView (uses BrowserState, URLRouter)
variable-select-state.js     ─┐
variable-select-status.js     │
variable-select-codelists.js  │  All share the VarSelect state object
variable-select-render.js     │  (tableMetadata, activeCodelists, etc.)
variable-select-events.js     │  defined in state.js
variable-select-api.js        │
variable-select.js           ─┘  Main entry: renderVariableSelection()
table-display.js    — renderTableDisplay, displayData, buildHtmlTable (uses api, AppState)
table-metadata.js   — buildMandatoryNotes, buildMetadataSection, setupMetadataToggle (table view: currentFullMetadata
                      from table-display; variable view: passes its own metadata to buildMetadataSection)
table-save-query.js — showSaveQueryDialog (uses currentData, AppState, api)
table-rotation.js   — openRotationDialog (uses AppState, re-calls displayData)
export.js           — showExportDialog, quickExportXlsx (uses api, AppState)
vendor/chart.umd.min.js  — Chart.js v4 UMD (exposes global Chart)
chart-view.js       — renderChart, destroyChart, buildChartData (uses Chart, AppState, table-display helpers)
```

## Global state objects

There are three primary state holders. Understanding what lives where is critical:

### `AppState` (utils.js)

Current session state for the active view. Nothing resets it automatically: only the back-to-browser buttons in the variable and table views call `resetTableState()`. `resetTableState()` clears the table fields; `reset()` also clears `topicPath`.

```
currentView         — 'home' | 'search' | 'topic' | 'variables' | 'table' | 'help'
selectedTable       — { id, label } or null
variableSelection   — { DimCode: ["val1","val2"] | "*" | "top(N)", ... }
activeCodelistIds   — { DimCode: "codelistId", ... }
tableData           — Pre-fetched JSON-Stat2 response from the saved-query route; loadTableData()
                       consumes and clears it (the displayed data lives in currentData)
tableLayout         — { rows: ["Tid"], columns: ["Kjonn","Region"] }
topicPath           — ["be","be02"] (current topic navigation)
navigationRef       — "topic/be/be02?disc=0" (for "back" button and breadcrumbs)
```

### `BrowserState` (browser-state.js)

Long-lived browsing state. Initialized once (lazy, on first use) and persists across views.

```
menuHierarchy       — MenuHierarchy instance (tree of subjects → topics → tables)
allTables           — Full array of ~7000+ table objects from API
recentTables        — Tables updated in the last 7 days (from pastDays=7 API call, used by front page)
isLoaded            — Whether init() has completed
searchFilters       — { query, includeDiscontinued, subjectFilter, frequencyFilter, updatedFilter, enhanced }
                      (enhanced: true by default, as in 1.4.5; searchFiltersToParams() writes enh=0 only
                       when it's off, and searchFiltersFromParams() reads anything but enh=0 as on)
topicFilters        — { includeDiscontinued, frequencyFilter, updatedFilter }
_searchIndex        — Lazily built normalized index for enhanced search
```

`reset()` (called by `setLanguage()`) clears everything including `_searchIndex`, so the table list is re-fetched and the search index rebuilt from the new language's labels.

### `VarSelect` (variable-select-state.js)

Variable-select state object, shared across all six `variable-select-*.js` files via global scope. Fields are accessed as `VarSelect.<name>`:

```
tableMetadata       — Full JSON-Stat2 metadata for current table
activeCodelists     — { DimCode: { codelistId, values, elimination, ... } }
dimensionValueOrder — { DimCode: ["code1","code2",...] } (ordering from first codelist)
lastClickedIndex    — { DimCode: N } shift-click anchor
committedSelection  — { DimCode: Set<N> } picks outside the current shift range
urlUpdateTimer      — debounce timer ID
reset()             — clears every field above; loadTableMetadata() calls it before each table load
resetSelections()   — clears only the picks (activeCodelists + the shift-click model), keeps the table
setListState(dim, indices) — sets one list's anchor + committed picks; [] clears them
debouncedURLUpdate() — method that updates URL hash with current selection (500ms debounce)
```

The displayed selection in a value list is `committedSelection ∪ current shift range`. Both selection fields are positions (`data-index`) in the list as rendered, so `setListState(dim, [])` runs wherever a list is re-rendered or loses its specific picks: `renderCodelistValues()`, `restoreOriginalValueList()`, and the Siste N / Velg alle / Opphev alle buttons. `restoreSelections()` calls it with the restored positions, so restored picks behave as if they had been clicked. The gesture state (`_dragState`, `_dragOccurred`, `_activeCard`, `_lastPointerWasTouch`) stays private to `variable-select-events.js`.

The live selection is held in the DOM: `getVariableSelection()` (`variable-select-status.js`) reads it from the `.variable-card` elements (`data-mode`, `.value-list-item.selected`). `AppState.variableSelection` is only a snapshot, written when restoring from the URL, when applying the default selection and in `handleFetchData()`.

`isTimeDimension(dimCode)` is also defined in this file as a free function — prefers `VarSelect.tableMetadata.role.time`, falls back to a name heuristic for tables without role metadata.

With `debug: true` in `config.js` when the page loads, `index.html` also assigns `VarSelect`, `AppState` and `api` to `window`. Setting the flag later from the console only turns on `logger`. In the DevTools console all three are reachable by name regardless, because top-level `const`s live in the global scope. `window.BrowserState` and `window.clearCache()` are always set.

### Module-level variables in table-display.js

`currentData` and `currentFullMetadata` are shared with `table-metadata.js`, `table-save-query.js`, `table-rotation.js` and `export.js`. `viewMode` is only used inside `table-display.js`, and `chart-view.js` receives its data as arguments:

```
currentData         — Raw JSON-Stat2 data response (the flat value array and dimensions)
currentFullMetadata — Full metadata for the current table (source, notes, contacts, etc.)
viewMode            — 'table' | 'chart' (selected via the 📈 toggle; reset to 'table' by the
                       back buttons in table-display.js, not by destroyChart(), and by
                       renderTableDisplay() when it renders another table than _viewModeTableId:
                       chart mode survives rotation and a language switch, but a table opened
                       from a note link or history starts as a table)
```

## What happens when...

### The user opens the app

```
DOMContentLoaded
  → api.cleanupCache()           // Remove expired localStorage entries (expired IndexedDB
                                 // entries are evicted when read)
  → URLRouter.handleRoute()      // Parse hash, dispatch to view
     or renderCurrentView()      // Default: home
```

### The front page loads

```
renderFrontPage()
  → BrowserState.init()                        // Lazy: awaits getConfig first (server limits
                                               // → AppConfig.limits.maxCells), then fetches
                                               // these two in parallel:
     1. Full table list (~7000 tables)          //   for subject grid and search
     2. api.getTables({ pastDays: 7 })          //   recently updated tables (small response)
                                               //   .catch → null on failure (front page falls
                                               //   back to walking the full hierarchy)
  → _collectRecentUpdateGroups(mh, recentTables)
     → Uses pre-fetched recentTables when available (avoids scanning all 7000 tables)
     → Groups by topic node path from each table's paths[] field
     → Buckets: "Oppdatert i dag", "I går"/"Fredag" (previous working day), "Tidligere siste 7 dager"
     → Falls back to walking the full hierarchy tree if pastDays call failed
  → Render: search input, 6-column subject grid, recently updated tables
```

### The user searches for "arbeidsledighet"

```
renderSearchView()
  → BrowserState.init()                    // Lazy: fetch all ~7000 tables, build MenuHierarchy
  → _searchPerformSearch()                 // On input (debounced 500ms) or Enter
     → BrowserState.filterTables()         // Client-side: filter allTables by query + filters
        → If enhanced: SearchEnhanced.buildIndex() (once), then filterAndRank()
           → _expandTokens() adds synonyms: "arbeidsledighet" → also tries "ledige", etc.
           → _scoreEntry() ranks: title start (30) > title contains (20) > ID (15) > variable (10) > path (8)
        → If standard: simple substring match on label, id, variableNames
     → _renderSearchResults()              // Show client results immediately
     → If enhanced:
        → api.getAllTables({ query: SearchEnhanced.getServerQuery(query) })
                                           // Server-side search (finds tables via VALUES not in local list)
        → Merge server extras with client results, re-render
     → If 0 client and 0 server results (either mode):
        → buildFuzzyQuery() → api.getAllTables({ query }) with ~1 (Lucene edit-distance)
```

### The user selects a table (e.g. table 09772)

```
BrowserState.selectTable("09772")
  → Captures navigationRef ("topic/be/be02" or "search?q=...")
  → sessionStorage.setItem('ssb_navRef', ...)    // Survives page refresh
  → AppState.setSelectedTable(table)
  → AppState.setView('variables')
     → renderVariableSelection()
        → BrowserState.init()
        → Read localStorage.varSelectLayout — if 'compact', add .compact to
          #variables-container so dimension cards render in an auto-fit grid
          (1/2/3 columns on wide screens). Toggle button in view-header
          reflects state via .btn-active + aria-pressed.
        → buildNavigationBreadcrumb()             // Show topic path leading to this table
        → setupApiBuilderEvents()                 // See "The user opens the API builder"
        → loadTableMetadata()
           → api.getTableMetadata("09772")        // Cached 7 days
           → buildMetadataSection(data) → #table-info-container, + setupMetadataToggle()
                                                  // Tabellinfo above the cards, closed, as in 1.4.5:
                                                  // the notes can be read before values are picked
           → displayVariables()
              → Look up roleByDim from VarSelect.tableMetadata.role (time/geo/metric)
              → Build a card for each dimension in metadata:
                 // Title, role badge (Tid/Geografi/Statistikkvariabel), elimination badge,
                 // selection mode buttons, value list. Time dimensions get a format hint as
                 // the filter placeholder (sampled from the latest period code, e.g. "Format: 2024M06")
              → setupVariableEvents()
                 → setupCodelistDropdowns()        // If dimension has extension.codelists[]
                 → Wire events: click, shift-click, Ctrl+click, Ctrl+A, filter input, mode buttons
                    // Touch/pen taps have no modifiers: a tap toggles a value in/out so
                    // multi-select works on iPad/mobile (a document-level pointerdown listener
                    // sets a touch flag read in the click handler; mouse/trackpad is unchanged —
                    // replace-on-click + Ctrl/Cmd-toggle + shift-range)
                    // Document-level listeners (touch flag, active-card tracking, Ctrl+A
                    // select-all) are registered ONCE at module level in variable-select-events.js
                    // — never in setupVariableEvents(), which runs on every render
                    // Mode buttons per dimension card:
                    //   "Velg alle"   → star mode: "*" (API wildcard, all values including future
                    //                   ones), or explicit codes when a codelist is active
                    //   "Opphev alle" → deselect all (specific mode, empty selection)
                    //   "Siste N"     → top(N) mode (time dimensions only)
              → restoreSelections()                // From AppState.variableSelection (URL state)
              → autoSelectSingleValueDimensions()  // Mandatory dimensions with only one value
              → updateSelectionStatus()            // Validate, show cell count, enable/disable "Hent data"
```

### The user opens the API builder

The API builder panel's markup is part of the variable selection view in `variable-select.js`, and `variable-select-api.js` holds its logic. It generates a live preview of the GET and POST URLs for the current selection, and is updated on every selection change.

```
updateQueryPreview()             // Called from updateSelectionStatus() on every selection change
  → Build GET URL with valueCodes[Dim]=... params
     → Time dimension optimisation, getTimeShortcut() in variable-select-api.js.
       Only for an unbroken run up to the newest period, otherwise the periods are listed:
        1 period   → top(1)
        2 periods  → top(2)
        >2 periods → from(firstPeriod)   // forward-looking: always fetches from fixed start
     → codelist[Dim]=id appended whenever a codelist is active
     → outputValues[Dim]=aggregated appended for agg_* codelists (per the spec; no effect at SSB)
     → URL shown decoded (plaintext) by default; the raw encoded URL is kept in
       #query-preview-url's dataset.rawUrl for copy and open, because the decoded
       variant is not a valid URL (a "105+" code would reach the server as "105 ")
  → api.buildPostBody()          // Constructs JSON POST body for display (POST mode)

setupApiBuilderEvents()          // Wires the panel's controls
  → Format selector: JSON-stat2 | CSV | Excel | PX | HTML | JSON-PX
     → On render, options not present in AppConfig.limits.dataFormats
       (populated from /config) are removed; the export dialog filters
       its radio group the same way
  → "Kopier URL" / "Åpne i nettleser" → use dataset.rawUrl (encoded)
  → "Kopier body" button → copies JSON POST body to clipboard
```

### The user clicks "Hent data"

```
handleFetchData()
  → getVariableSelection()                 // Read DOM state → { Dim: [codes] | "*" | "top(N)" }
     // Codelist handling in getVariableSelection():
     //   vs_ (filter) codelist active  → expand via valueMap (no-op: valueMap[0] === code)
     //   agg_ (aggregation) codelist active → keep aggregate codes as-is;
     //                                         API resolves them via codelist ID in POST body
     //   star mode with a codelist active  → explicit codes instead of "*"
     //                                         (vs_: original codes, agg_: aggregate codes)
  → AppState.variableSelection = selection
  → AppState.setView('table')
     → renderTableDisplay()
        → BrowserState.init()
        → buildNavigationBreadcrumb()      // Show topic path as breadcrumb
        → loadTableData()
           → AppState.tableData if pre-fetched (saved query route), otherwise
             api.getTableData("09772", selection, getCurrentApiLang(), AppState.activeCodelistIds)
                                           // POST, never cached
           → currentData = data; api.getTableMetadata() → currentFullMetadata
           → determineDefaultLayout(data)  // See "Default table layout" below
           → displayData()
              → buildMetadataSection()     // table-metadata.js: collapsible panel (source, contact, all notes,
                                           // "Om statistikken" from root link.related (statistics-homepage +
                                           // about-statistics, labels from the API); fallback without
                                           // related: kortnavn from paths, only when all paths agree
                                           // (_shortNameFromPaths), gated on source.statisticsPageBase.
                                           // Klass/VarDok links from link.related "definitions", plus any
                                           // link.describedby URN not covered, via _urnToUrl)
              → buildHtmlTable()
                 → buildDimensionCombinations(rowDims)    // Cartesian product of row values
                 → buildDimensionCombinations(colDims)    // Cartesian product of column values
                 → For each row × column:
                    → getDataValue() → calculateFlatIndex() → data.value[i]
                    → getDataStatus() → data.status code, if any
                    → value null + status   → the symbol (".", "..", ":"), styled .suppressed-value
                    → number + status ("*") → the number followed by the flag, statusLabel() as tooltip
              → buildMandatoryNotes()      // table-metadata.js: always-visible box BELOW the table or
                                           // chart (not above, so it doesn't take the eye off the
                                           // figures), with the notes extension.noteMandatory points to
                                           // (keyed on the index in note: {"1":true} = note[1]).
                                           // getMandatoryNotes() picks them; falls back to currentData,
                                           // which carries the same notes, when the metadata is missing
              → Wire: rotate button, export buttons, save query button
```

SSB never marks per-dimension or per-value notes as mandatory; Tabellinfo still lists every note.

### The user rotates the table

```
openRotationDialog()                       // table-rotation.js
  → Drag-and-drop UI: move dimension chips between "Rader" and "Kolonner"
  → Keyboard: chips are tabbable (tabindex="0"); ←/→ moves the focused chip to the
     opposite zone, ↑/↓ reorders within the zone. moveChip() keeps empty-zone
     messages, data-zone and focus in sync. The keydown listener is delegated on
     the overlay and intentionally NOT tied to dragDropAbortController (which is
     aborted on every preset) — it dies naturally with overlay.remove()
  → Preset buttons: Standard, Transponér and, with more than two dimensions,
     Alle som rader and Alle som kolonner
  → On apply:
     → AppState.tableLayout = { rows: [...], columns: [...] }
     → AppState._updateHash('table', false)   // Encode new layout into URL, replacing the
                                              // history entry so Back still leaves the table
     → displayData()                       // Re-render table with new layout
  → Escape key closes dialog (via addEscapeHandler)
```

### The user toggles the chart view (📈)

The chart toggle button is rendered by `displayData()` in `table-display.js` whenever `currentData.role?.time?.[0]` is set. Clicking it flips the module-level `viewMode` and calls `displayData()` again — which then dispatches to either `buildHtmlTable()` or the chart renderer.

```
#chart-toggle-btn click
  → viewMode = (viewMode === 'chart') ? 'table' : 'chart'
  → displayData()                          // table-display.js, full re-render
     → destroyChart()                      // safe no-op if no chart active
     → if (viewMode === 'chart' && hasTimeDim):
        → renderChart(canvas, currentData, AppState.tableLayout)   // chart-view.js
           → buildChartData(data, _layout)
              // _layout ignored — chart always puts time on x-axis
              → timeDim = data.role.time[0]
              → x-labels = data.dimension[timeDim].category.label,
                            sorted by category.index value (NOT alphabetical)
              → nonTimeDims × combos → one dataset per combination
              → seriesLabel = combo.codes.map(category.label).join(' · ')
                  // single-line fallback: cleaned extension.px.contents
              → For each combo, look up per-series decimals:
                  data.dimension[metricDim].category.unit[metricCode].decimals
                  // agg_ codelist on metric → fallback to extension.px.decimals
              → For each time period:
                  flatIdx = calculateFlatIndex(fullIndices, data.size)
                  data.value[flatIdx] null → null (gap, not 0); a status that flags a
                  number ("*") keeps the point, and the flag goes into the series'
                  statuses[] for the tooltip ("924 263 * (Foreløpig tall)")
                  spanGaps: false on the dataset → hulls render as hulls
           → Chart.js v4 line config (SSB's dataviz conventions, the ssb-chart skill):
              palette ranks 1–8 (#1A9D49 first), grey beyond
              plugins.title:     extension.px.contents (top)
              plugins.subtitle:  "Kilde: {AppConfig.source.name}, tabell {id}.
                                  Sist oppdatert: {YYYY-MM-DD}"  (bottom)
                                 // i18n via chart.source / chart.tableWord / chart.lastUpdated
              plugins.tooltip:   formatNumber(value, ctx.dataset.decimals ?? 0)
              scales.y.ticks:    formatNumber(v, Math.max(...d.decimals))
        → If lineCount > MAX_RECOMMENDED_LINES (12), show .chart-warning above canvas
     → else: buildHtmlTable()
```

`destroyChart()` MUST run before the canvas is removed from the DOM, otherwise Chart.js logs "Canvas is already in use" on the next render. `displayData()` calls it before every re-render, which covers the toggle and the rotation apply. The back-to-browser and back-to-variables handlers call it too, and so do `renderTableDisplay()` and `renderChart()` on entry. Other exits from the view (the header logo, browser back) don't call it, so a stale instance is only cleaned up on the next `renderTableDisplay()` or `renderChart()`.

### The user saves/shares a query

```
showSaveQueryDialog()                      // table-save-query.js
  → Fingerprint current selection (tableId + variables + codelists + layout)
  → If same fingerprint as last save → reuse cached query ID
  → Otherwise: POST to /savedqueries with selection + placement
  → Display dialog with two shareable links (all strings via t()/tpl(),
     brand names from AppConfig):
     → Statistikkportalen link: #sq/{id}
     → the source's link from AppConfig.source.savedQueryUrl ({id} replaced;
        SSB: https://www.ssb.no/statbank/sq/{id}); none when it is null (SCB)
  → Escape key closes dialog (via addEscapeHandler)
```

### The user exports data

```
quickExportXlsx()                          // One-click Excel download
  → api.downloadTableData(tableId, selection, { format: 'xlsx', stub, heading })
     → POST to /tables/{id}/data?outputFormat=xlsx
     → Response as blob → create <a download> → trigger click → cleanup

showExportDialog()                         // Full options dialog
  → User picks format, display format, separator, layout
  → executeExport()                        // Same API call with chosen options
  → Escape key closes dialog (via addEscapeHandler)
```

## Caching architecture

```
CacheManager (cache.js)
├── localStorage     — Items < 1MB (fast, synchronous read)
│   └── Key format: ssb_{cacheKey}
│       Value: JSON { value, expires, stored }
│
├── IndexedDB        — Items ≥ 1MB (table list is ~2-4MB)
│   └── Database: ssb_cache, Store: cache
│       + localStorage ref: ssb_{key}_ref → { storage: 'indexeddb', size }
│
└── Staleness check  — _isStaleBySSBSchedule(storedTimestamp)
    └── Compares stored timestamp against last SSB update
        SSB updates at 05:00, 08:00, 11:30 Norwegian time daily
        If stored before last update → stale → evict
```

What gets cached:

- **API config** (`api_config`): 24h TTL, ~1KB → localStorage
- **Table list** (`tables|no|true|10000|||`): 24h TTL, ~2-4MB → IndexedDB
- **Recent tables** (`tables|no|false|10000|||7`): 24h TTL, small → localStorage
- **Table metadata** (`table_{id}_no`): 7 day TTL, ~5-50KB → localStorage
- **Codelists** (`codelist_{id}_no`): 7 day TTL, ~1-20KB → localStorage
- **Query results**: Never cached (each user query is unique)
- **Server search results** (`tables|no|true|10000||{encoded-query}|`): 24h TTL

The table-list key shape is centralised in `api._buildTableListCacheKey(...)`.
Fields are pipe-separated in fixed order — `lang | includeDiscontinued |
pageSize | pageNumber | encodeURIComponent(query) | pastDays` — so a literal
`|` in user input can't collide with adjacent fields, and `getAllTables` and
`getTables(pageNumber=1)` share the same key for the full-list case.

### The user opens the in-app help (#hjelp)

**Table links in notes.** `convertMarkdownLinks()` (`table-metadata.js`) turns a note's link to a Statbank table page (`STATBANK_TABLE_URL`: `https://(www.)ssb.no/(en/)statbank/table/{id}`, optional trailing `/`, `?` or `#`) into `<a href="#variables/{id}" class="app-table-link">`, in the mandatory-notes box and in Tabellinfo alike. Other links keep `target="_blank"`. A delegated click listener in `index.html` calls `URLRouter.navigateTo('variables/{id}', {})` + `handleRoute()`, which starts the table with an empty selection. A modified click (Ctrl/Cmd, Shift, Alt) or another mouse button is left to the browser, and the `#variables/{id}` href then opens the app in a new tab or window. A table that no longer exists gets the «Tabellen finnes ikke» page (see Error handling).

`#hjelp` → `URLRouter._handleHelpRoute()` sets `AppState.currentView = 'help'` → `renderCurrentView()` → `renderHelpView()` (`help-view.js`). The view is a condensed, translatable companion (`help.*` keys, nb/en/sv) to the canonical `BRUKERVEILEDNING.md` at the repo root. The three entry points (footer link, front-page "Ny her?" banner, variable-selector hint) all carry the `app-help-link` class and are caught by one delegated click listener in `index.html`, which calls `URLRouter.navigateTo('hjelp', {})` + `handleRoute()`. App/source names come from `AppConfig` via `tpl()`, so the copy stays brand-neutral.

## URL state encoding

View state is encoded into the URL hash so views can be bookmarked and shared. The exception is `viewMode` (table or chart), which is never in the URL. A default layout isn't written to `l` either, since it's recalculated on load, but a rotation is. Rotating a table opened from `#sq/{id}` moves the URL to `#table/{id}`, because the view no longer matches the saved query.

```
#home
#search?q=bnp&disc=0&subj=nk&freq=Quarterly&upd=30&enh=0
#topic/be/be02?disc=0&freq=Monthly
#variables/09772?v={base64}&c={base64}
#table/09772?v={base64}&c={base64}&l={base64}
#sq/30116027
#hjelp
```

The `v`, `c`, and `l` parameters are JSON objects encoded as URL-safe Base64:

- Standard Base64, then `+`→`-`, `/`→`_`, `=`→`~`
- `v` = variableSelection: `{ "Kjonn": ["1","2"], "Tid": "top(5)" }`
- `c` = activeCodelistIds: `{ "Region": "vs_RegionKommune" }`
- `l` = tableLayout: `{ "rows": ["Tid"], "columns": ["Kjonn","Region"] }`

`URLRouter.navigateTo()` only updates history and never renders, so follow it with `URLRouter.handleRoute()` or `renderCurrentView()`. The app listens for `popstate`, not `hashchange`. `AppState.setView()` writes the hash only for `variables` and `table`; home, search and topic manage their own URLs. `handleRoute()` also accepts `#help` as an alias for `#hjelp`, redirects legacy `#browser*` routes, sends unknown routes home and treats a bare `#?q=…` as a search.

Pasted saved-query links are recognised by `detectSavedQueryId()` in `utils.js` (`/statbank/sq/{id}`, `?sq={id}`, `#sq/{id}`), called from the search inputs in `front-page.js` and `search-view.js`.

## SSB API integration

All API calls go through `SSBApi` (api.js) which enforces 100ms minimum spacing between requests. SSB allows 40 calls per 60 s: the `x-ratelimit-policy` response header says `40;w=60s` (2026-11-08), while SSB's user guide says 30 per minute, and the header is the current value. `/config` still has `maxCallsPerTimeWindow`/`timeWindow`, but they are `0` and no longer used (`0` doesn't mean "no limit"). The browser can't read the `x-ratelimit-*` headers (they aren't exposed through CORS), so the limit is set in `AppConfig.limits.rateLimit` (SSB `{ calls: 40, windowMs: 60000 }`). `_applyConfig()` replaces it when `/config` states one, as SCB's does (30 per 10 s).

**Rate budget.** The app uses at most `rateLimitShare` (0.5) of that, so 20 calls per 60 s at SSB and 15 per 10 s at SCB, to be considerate towards the API. `_throttledFetch` keeps a sliding window of send times, shared by all tabs on the origin: it lives in `localStorage` under `rateWindow:<API host>` (no `ssb_` prefix, so clearing the cache keeps it), and `_claimRateSlots()` reads, checks and writes it under a Web Lock of the same name, so two tabs can't take the same slot. Without `localStorage` the window stays in the tab (`_callTimes`); without Web Locks the claim runs unlocked. Headless Chrome's `--virtual-time-budget` stalls lock requests, so `test.html` hides `navigator.locks` in its rate suite, and `~/sp_test/live-tests/sharedwindow.mjs` checks the lock in real time. When the window is full, the next call waits until the oldest has left it, behind the loading indicator. A slot stays taken for the window + 1 s (`_rateMarginMs`): a request reaches the source a little after its slot is taken (a JSON POST only after its preflight's round trip), so without the margin the source could count one call too many in a window (measured once: 21 in 60 s). While a call waits, `_claimRateSlots` keeps it in `_rateWaiters`, and `_announceRateWait()` sends a `ratewait` event on `window` (`detail.until`: when the last waiting call should get its slot, or `null` when none waits). `updateRateWaitNotice()` (`utils.js`) shows `#rate-wait-notice` for a wait of 2 s or more, with a countdown; the notice is a live region that stays in the page, empty when nothing waits. A call aborted while it waits stops at once and uses no slot. Cache hits never reach `_throttledFetch`, so they don't count. A POST with a JSON body counts twice (`_corsRequestCount()`): the browser sends a CORS preflight (`OPTIONS`) first, SSB counts that against the limit too (checked 2026-11-09), and SSB sends no `Access-Control-Max-Age`, so a preflight is rarely reused. A 429 shows `t('error.rateLimit')`. The API follows the [PxWebApi v2 spec](https://github.com/PxTools/PxApiSpecs/blob/master/PxAPI-2.yml).

```
GET  /config                          — API limits and capabilities (cached 24h)
GET  /tables?lang=no&pageSize=10000&includeDiscontinued=true[&query=...][&pastDays=7]
GET  /tables/{id}/metadata?lang=no
GET  /tables/{id}/defaultselection?lang=no   — "Fyll inn standardvalg" (replaces the current picks:
                                               VarSelect.resetSelections() + displayVariables())
GET  /tables/{id}/data?lang=no&valueCodes[Dim]=codes[&codelist[Dim]=id][&outputFormat=...]
                                      — Only generated for the API builder preview
POST /tables/{id}/data?lang=no[&outputFormat=xlsx&outputFormatParams=...]
GET  /codeLists/{id}?lang=no
POST /savedqueries                    — Create saved query
GET  /savedqueries/{id}               — Fetch saved query
GET  /savedqueries/{id}/data?lang=no&outputFormat=json-stat2   — Fetch saved query's data
```

### Dynamic configuration

When `BrowserState.init()` first runs, it awaits `api.getConfig()`, which fetches the `/config` endpoint and updates `AppConfig.limits`: `maxCells` from the server's `maxDataCells` value, and `dataFormats`. This means the cell limit in the variable selection view adapts automatically if SSB changes their limits. The warning threshold is set to 75% of the max. If the `/config` call fails, the hardcoded defaults in `config.js` are used.

### Error handling

All API methods except `getConfig()`, which falls back to defaults instead, use `_handleErrorResponse()`. It reads the body and throws what the pure `_buildApiError(status, statusText, body)` returns (pure so `test.html` can check it). SSB returns RFC 7807 Problem Detail JSON with a `detail` field containing specific messages (e.g. "Value, xxx is not a valid value code for variable yyy"). Status codes:

- **429** — Rate limited. Always shows `t('error.rateLimit')`.
- **403** — Forbidden (query exceeds cell limit). Shows the API's `detail` or `title` if present, otherwise `t('error.cellLimit')`.
- **Anything else** (e.g. 400 for invalid value codes) — Shows the API's `detail` or `title` if present, otherwise `HTTP {status}: {statusText}`.
- **Title `"Non-existent table"`** — 404 from `/tables/{id}` and `/metadata`, 400 from `/data`, and the same for a removed table and a number that never existed (11038, 99999). The error also gets `tableNotFound: true`, `userMessage: t('error.tableNotFound')` and `helpUrl`, the source's page of changed and removed tables (`localized(AppConfig.source.tableChangesUrl)`, `null` when not configured).

```
safeApiCall(fn, errorMessage, viewContainer?)          // utils.js
  → catch: message = error.userMessage || errorMessage
     → showError(message, error)           // banner, auto-hides; link to error.helpUrl if set
     → showViewError(viewContainer, message, error)
                                           // the same message (and link) in place of the view's
                                           // loading text, so it stays after the banner hides.
                                           // tableNotFound: heading + tab title "Tabellen finnes
                                           // ikke", breadcrumb shows only the number, and the
                                           // view gets .table-not-found: main.css hides what has
                                           // nothing to act on (variable view: instructions,
                                           // «Fyll inn standardvalg», Kompaktvisning, API builder,
                                           // «Hent data»; table view: «Tilbake til variabelvalg»).
                                           // No-op when the container has left the page
loadTableMetadata → viewContainer = #variables-container
loadTableData     → viewContainer = #data-container
```

### Stale loads (`renderGuard()`)

Every `renderCurrentView()` call counts as a new render. `renderGuard()` (`utils.js`) returns a function that says whether the render current when it was called still is. The table and variable views take one at the top (before any `await`) and return after each `await` when it says false: `renderTableDisplay` / `loadTableData` (after `BrowserState.init()`, the data and the metadata), `renderVariableSelection` / `loadTableMetadata`, `displayVariables` (after the codelist preload and `restoreSelections()`), `restoreSelections` (after each codelist) and `handleLoadDefaultSelection`. `loadTableData` keeps the data and metadata local and writes `currentData`, `currentFullMetadata` and `AppState.tableLayout` only after both fetches, once the guard holds.

Without it, a load that finished after the user had moved on drew over the newer view. Repro (before 1.5.0): `setLanguage('en')` on `#table/07459` reloads that table; open 14700 while the reload is in flight, and the reload landed last. `currentData` became 07459 under `#table/14700` (the rotation and chart would then use the wrong table's figures), and with the other table's layout `buildHtmlTable` crashed with `TypeError … reading 'label'`. The variable view showed 07459's cards under `#variables/14700`.

**Cancelling the data download.** `renderCurrentView()` also aborts an `AbortController` and starts a new one, and `renderGuard()` hands out its signal as `.signal`. `loadTableData` passes it to `api.getTableData(…, { signal })`, the one call that is never cached and can be large (up to the cell limit). When the user moves on, the download stops. A request still waiting in `_throttledFetch` for its 100 ms slot throws `AbortError` and is never sent, and `safeApiCall()` returns `null` for an `AbortError` without a banner or a view message. A request already sent still counts against SSB's limit, so the saving is the download and the JSON parse, not the call. Metadata and codelists don't take the signal: they are small, and cancelling them would throw away a 7-day cache entry. The `isCurrent()` checks stay, because cached calls and `BrowserState.init()` don't take the signal.

### POST body for data requests

```json
{
  "selection": [
    { "variableCode": "Kjonn", "valueCodes": ["1","2"], "codelist": "vs_Kjonn" },
    { "variableCode": "Alder", "valueCodes": ["005","1014"], "codelist": "agg_FemAarigGruppering", "outputValues": "aggregated" },
    { "variableCode": "Tid", "valueCodes": ["top(5)"] }
  ],
  "placement": {
    "heading": ["Kjonn"],
    "stub": ["Tid"]
  }
}
```

`placement` is only sent by exports and saved queries. `getTableData()` omits it, and the table layout is applied client-side.

Dimensions omitted from `selection` are "eliminated" — the API aggregates across all values. Only dimensions with `extension.elimination=true` in metadata can be omitted.

**Codelist types and how they affect `valueCodes`:**

- **`vs_` (valueset/filter):** `valueCodes` contains original dimension codes. The codelist restricts which codes are valid; `valueMap` is a no-op (`valueMap[0] === code`).
- **`agg_` (aggregation):** `valueCodes` contains the codelist's own aggregate codes (e.g. `"005"` for "0–4 år"). The API uses the `codelist` field to resolve these to underlying values and return grouped totals. Sending expanded original codes here would be wrong. `buildPostBody()` also adds `"outputValues": "aggregated"` for any `agg_*` codelist, and the GET-URL preview emits the matching `outputValues[Dim]=aggregated` query parameter, as the PxWebApi spec describes. At SSB the parameter has no effect: the codelist alone decides the sums. 07459 with `agg_KommFylker` (`F-03`, `F-46`) gives the same values with `aggregated`, `single` or no `outputValues`, by GET and by POST (2026-08-30, rechecked 2026-11-08). It stays because the spec has it and it does no harm. Which codes a list sums comes from its `valueMap`, not from the `agg_` prefix.

## JSON-Stat2 response format

The API returns data in JSON-Stat2 format. Key structure:

```json
{
  "id": ["Region", "Kjonn", "Tid"],
  "size": [3, 2, 5],
  "dimension": {
    "Region": {
      "label": "region",
      "category": {
        "index": { "0301": 0, "1103": 1, "4601": 2 },
        "label": { "0301": "Oslo", "1103": "Stavanger", "4601": "Bergen" }
      }
    }
  },
  "value": [1234, 5678, ...],
  "status": { "7": ".", "15": ":" }
}
```

Values are stored in a flat array. To look up a specific cell:

```
flatIndex = Region_index × (size_Kjonn × size_Tid)
          + Kjonn_index × size_Tid
          + Tid_index
```

This is implemented in `calculateFlatIndex()` (table-display.js).

The optional `status` field maps flat indices (as strings) to SSB's standard symbols. Most of them stand in for a missing value, and `value` is `null` there:
- `"."` — not applicable (ikke mulig å oppgi tall)
- `".."` — not available (tallgrunnlag mangler)
- `":"` — confidential (konfidensielt)
- `"..."` — not yet available (oppgave mangler foreløpig; tables from before 2021)
- `"-"` — nil (null; tables from before 2021). Shown as `-`, never counted as 0

One is a flag on a number that exists:
- `"*"` — preliminary figure (foreløpig tall). 09842 has it on BNP per innbygger for the latest years, with the numbers in `value`

So a status code says nothing on its own about whether the cell has a number; `value` decides. For a missing value the table shows the symbol (`.suppressed-value`). For a flagged number it shows the number followed by the flag (`924 263 *`). Both get a tooltip from `statusLabel()`. The chart view (`chart-view.js`) maps only missing values to `null`, so Chart.js draws gaps (`spanGaps: false`): statistical integrity over visual smoothness. Flagged numbers stay as points, and the tooltip names the flag.

`chart-view.js` also reads `dimension[role.metric[0]].category.unit[metricCode].decimals` for per-series precision (Personer1 → 0, KpiIndMnd → 1, valutakurser → 4), instead of hardcoding a decimal count. Same field, different consumer than the data table's per-column formatting.

## Default table layout

`determineDefaultLayout(data)` in `table-display.js` picks the initial `rows`/`columns` split for a fresh table render. The rotation dialog's "Standard" preset delegates to the same function — single source of truth.

Two modes, switched on the product of selected non-time dimension sizes:

- **Compact mode** (`product < 16`) — every non-time dimension goes to columns, Statistikkvariabel (`role.metric[0]`) on top, the rest narrowest-first underneath. The time dimension is the only row. Each metric × breakdown combination gets its own column.
- **Standard mode** (`product ≥ 16`) — Statistikkvariabel and the narrowest non-time dimension go to columns; time + any wider non-time dimensions go to rows. Keeps the column count tractable on wide tables.

In both modes Statistikkvariabel is the first column entry, so it renders as the topmost `<th>` row (the column-header stack iterates `columns` top-down in `buildHtmlTable`).

Fallbacks: when `role.metric` is absent the narrowest non-time dim takes the top slot; when no row dimension is left (for example `role.time` is absent in compact mode), a degenerate-demote pops the last column entry, the widest non-metric dim, into rows so the table still has a vertical axis. Single-dim and zero-dim tables short-circuit early.

The "selected count" for each dimension is `data.size[i]` from the JSON-Stat2 response — the actual returned count, whether the user picked `*`, `top(N)`, or explicit codes.

## Dimension hierarchy in value labels

SSB uses the `¬` character to encode depth in value labels:

- `"Bygg og anlegg"` — depth 0
- `"¬ Boliger"` — depth 1 (child of above)
- `"¬¬ Eneboliger"` — depth 2

The UI strips these and converts to `padding-left` for visual indentation.

## Search architecture

Two search paths, selectable via the "Forbedret søk" checkbox. Enhanced search is on by default, as in 1.4.5; `enh=0` in the URL turns it off. For «bnp» it finds 24 tables against standard search's 2 (2026-11-08):

**Standard search** — Client-side substring matching. Only the fuzzy fallback below goes to the server:

```
query.toLowerCase() → match against table.label, table.id, table.variableNames
```

**Enhanced search** — Client-side scoring + server-side augmentation:

1. Build normalized index (once, cached on `BrowserState._searchIndex`)
2. Expand tokens via synonym groups (e.g. "bnp" → also try "bruttonasjonalprodukt")
3. Score each table: title start (30) > title contains (20) > ID (15) > variable (10) > path (8)
4. AND logic: every token must match somewhere
5. Server augmentation: API search finds tables by VALUE matches not in local list
6. Fuzzy fallback (in both search paths): if 0 results, retry with Lucene `~1` edit-distance

## Instansspesifikke filer

Tre filer byttes ut for å tilpasse appen til en annen PxWebApi v2-kilde (f.eks. SCB):

**SCB-instansen** ligger klar i `js/config-sv.js` og `js/subjects-sv.js`, som `index.html` ikke laster. Ved utrulling erstatter de `config.js` og `subjects.js`. Filnavnene blir de samme, så `?v=` gjelder fortsatt, og resten av appen er felles. `config-sv.js` har de samme feltene som `config.js`, og et nytt felt må inn i begge. `live-tests/scb.mjs` gjør det samme byttet i en kopi og kjører den mot SCBs API.

- **`config.js`** — `AppConfig`: API-URL, cache-TTL, cellebegrensninger, UI-innstillinger, publiseringstider (`sourceUpdateTimes`). Blant UI-innstillingene:
  - `ui.hidePeriodInTableTitles`: `BrowserState.stripTrailingPeriod()` fjerner perioden i slutten av titlene i tabellistene når den er lik første/siste periode i kolonnen Tidsperiode, slik SSB skriver titlene. Av for SCB, der titlene slutter på «År 2005-2025», så «År» ville blitt stående.
  - `ui.topicCardDepth`: hvor mange stinivåer emnevisningen viser som kort før tabellisten (`topic-view.js`, `MenuHierarchy.getChildrenForPath()`). 2 for SSB, 1 for SCBs grunnere hierarki.

  Også instansspesifikk branding:
  - **`source`** — Datakilde (navn, URL, lisens). Vises i footer. `tableChangesUrl` (`{ nb, en }`, eller `null`) er kildens side over endrede og fjernede tabeller, som meldingen om en tabell som ikke finnes lenker til. `savedQueryUrl` (med `{id}`, eller `null`) er kildens side for en lagret spørring i «Få lenke»; med `null` viser dialogen bare appens egen `#sq/`-lenke.
  - **`app`** — Appnavn og tagline (tagline kan være et `{ nb, en }`-objekt).
  - **`analytics`** — Umami (`scriptUrl`, `websiteId`, `domains`, `doNotTrack`). En snutt rett etter `config.js` i `index.html` legger skriptet inn i `<head>`. `null`, eller tom `scriptUrl`/`websiteId`, slår det av. Umami teller bare på vertene i `domains`, så en annen instans eller et annet domene trenger egen nettsted-ID.
  - **`languages`** — Array av `{ code, apiLang, label }`. `code` er UI-språknøkkel; `apiLang` sendes som `lang=` til API-et. Første oppføring er standard.
- **`subjects.js`** — `SubjectConfig`: `subjectGroups` (toppnivågruppering vist som fliser på forsiden) og `subjectNames` (emne-kode → visningsnavn). Gruppe- og emnenavn er `{ nb, en, sv }`-objekter, og filen registrerer dem i ordboka i `translations.js` som `subject.group.{id}` og `subject.name.{kode}` når den lastes (derfor etter `translations.js`). Visningene leser dem med `t()`. Emnenavnene hører altså til instansen og ligger bare her, ikke i `translations.js`. `MenuHierarchy` bruker `subjectGroups`.
- **`synonyms.js`** — `SearchSynonyms`: synonymgrupper for enhanced søk. Normaliserte termer (lowercase, uten diakritika).

De tre filene er ikke nok alene. Dette må også tilpasses:

- **Hardkodede SSB-lenker og -farger** — `table-metadata.js` (`_urnToUrl`, ssb.no-sidene for Klass/VarDok-URN-er, og `STATBANK_TABLE_URL`, som gjør lenker til `ssb.no/statbank/table/{id}` i notene om til tabellenker i appen) og `SSB_PALETTE` i `chart-view.js`. Hos en annen kilde gir de ingen feil: ukjente URN-er gir ingen lenke, andre lenker forblir eksterne, og diagrammet får SSBs farger. «Om statistikken» og definisjonslenkene kommer fra metadataens `link.related`, som SSB leverer ferdig. `_urnToUrl` og reserven fra `paths` (styrt av `source.statisticsPageBase` i `config.js`, `{ nb, en }` eller en streng, `null` slår den av) brukes bare når `link.related` mangler.
- **`test.html`** — asserter SSB-verdier (API-URL, emner, `ssb_`-prefiks) og Umami-oppsettet i `AppConfig.analytics`.

## Internationalisation (i18n)

`translations.js` is a self-contained i18n module loaded immediately after `config.js`. It manages all UI strings and the active language.

**Public API:**

- **`t(key)`** — returns the translation string for `key` in the current language, falling back to `nb` and then to the key itself
- **`tpl(key, ...args)`** — same as `t()`, but replaces `{0}`, `{1}`, … placeholders with positional `args`
- **`setLanguage(code)`** — switches the active language, persists the choice to `localStorage`, clears the API cache (all cached data is language-sensitive), resets `BrowserState` (including the enhanced-search index), and re-renders the current view
- **`getCurrentApiLang()`** — returns the `apiLang` value for the active language (sent as `lang=` to the API)

**Language codes:** UI codes (`'nb'`, `'en'`) are distinct from API codes (`'no'`, `'en'`). The mapping lives in `AppConfig.languages`. `translations.js` also has an `sv` dictionary, but this instance doesn't enable it in `AppConfig.languages`, so `setLanguage('sv')` is a no-op here. The SCB instance (`config-sv.js`) runs in `sv`, so `sv` must have every `nb` key; `test.html` checks that for `en` and `sv`.

**Language selector:** If `AppConfig.languages` contains more than one entry, `index.html` renders language toggle buttons inside `#header-lang`. Clicking a button calls `setLanguage()` then `applyTranslatableUI()` (an inline function in `index.html`) which re-applies all static UI strings (tagline, footer labels, cache-clear link) without a full re-render. On a phone the one-word title and the buttons don't fit on one line, so in the 768px block the header wraps and the buttons take a line of their own (`main.css`). `.header-content { flex: 1 1 0 }` lets the title, not the subtitle, decide when: it wraps only somewhere between 520 and 560px. Without the wrap, the page grew wider than the screen, and mobile Chrome then placed fixed elements (`#rate-wait-notice`, `#loading-indicator`) partly off the screen.

**Instance-specific strings** (app name, source name, URLs) are in `AppConfig`, not in the translation dictionary. Subject group and subject names live in `subjects.js` as `{ nb, en, sv }` objects. When it loads (after `translations.js`), `subjects.js` registers them in the dictionary as `subject.group.{id}` and `subject.name.{code}`, so views read them with `t()` and another data source only swaps `subjects.js`. A subject code from the API that `subjects.js` doesn't list is shown as its raw key.

## Stylesheets

CSS is split into three plain files (no preprocessor):

- **`css/main.css`** — Global layout, typography, header, footer, buttons, forms, and shared component styles. Defines all design tokens in `:root`.
- **`css/table.css`** — Styles specific to the data table display view: table container, controls bar, frozen headers, cell formatting, status symbols.
- **`css/menu-navigator.css`** — Styles for the front page, search view, topic browser, and navigation elements (subject grid, breadcrumbs, filter bar, search input, table lists, topic cards). Owns `.search-container`, `.search-input` (+ `:focus-visible`), `.filter-select`, `.no-results`, and `.info-message` — those selectors are intentionally defined only here even though they're not navigation-specific. `index.html` loads `menu-navigator.css` after `main.css`, so earlier duplicates in `main.css` were silently overridden until they were consolidated.

All three are loaded unconditionally via `<link>` tags in `index.html`.

### Design tokens

All design tokens live in `:root` in `main.css`:

- **Colors:** `--color-primary` (dark green, headers/fills), `--color-primary-light`, `--color-primary-dark`, `--color-secondary` (light green, active/interactive), `--color-accent`, `--color-background`, `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-text`, `--color-text-light`, `--color-error`, `--color-success`.
- **Spacing:** `--spacing-{xs,sm,md,lg,xl,xxl}` (0.25rem → 3rem).
- **Borders:** `--border-radius-sm` (3px), `--border-radius` (4px), `--border-radius-lg` (8px).
- **Typography:** `--font-family`, `--font-mono`, `--font-size-{base,sm,lg,xl,xxl}`.
- **Shadows:** `--shadow-{sm,md,lg}`.
- **Transitions:** `--transition-default` (`0.2s ease`).

### Konvensjoner

- Use `var(--color-*)` for colors. Hardcoded hex codes are reserved for one-off tints (e.g. `#fafafa` backgrounds) and badge accents outside the palette (`#ff9800` discontinued-badge, the role badges).
- Focus styles use `:focus-visible` (not `:focus`) so the outline appears only on keyboard navigation. The accent colour is `var(--color-secondary)`, consistent with other active/interactive states. Clickable cards (`.subtopic-card`, `.category-card`) and the rotation dialog's `.dimension-chip` are keyboard-focusable divs (`tabindex="0"`) with Enter/Space (cards) or arrow-key (chips) activation wired in JS, and carry the same `:focus-visible` outline.
- Transitions list animated properties explicitly — never `transition: all`. Use `var(--transition-default)` for timing.
- Media-query breakpoints are exactly two: **768px** (mobile) and **1100px** (narrow tablet). The convention is documented in a header comment in each CSS file.
- `!important` is avoided. The only remaining use is `.data-cell.highlighted` in `table.css` (needed to win over the `tr:nth-child(even)` zebra-stripe rule). State variants like `.btn-active` use chained pseudo-class selectors (`.btn-active, .btn-active:hover, .btn-active:focus-visible`) to win on specificity without `!important`.
- The data table sticky headers (`thead`, `.row-header`) rely on native `position: sticky` only — no `will-change`/`transform: translateZ(0)` hacks (which can break stickyness in nested scroll contexts).
- `main` has `max-width: 1700px` for all views; on the data table view it widens further to `1880px` (via `body[data-view="table"] main` in `table.css`) so wide tables can use more of a 1920+ screen. The `data-view` attribute is set on `<body>` by `renderCurrentView()` (`utils.js`) on every view transition. Components that benefit from being narrow (dialogs, the front-page search field) cap themselves locally.
- The table view also trims horizontal padding: `main` drops from `var(--spacing-xl)` (32px) to `var(--spacing-md)` (16px) and `.view-container` drops from `xl` to `lg` (24px), only when `data-view="table"`. Vertical padding is preserved. Effective table area on a 1920 screen ends up at ~1810px.
- Default data-cell padding is `var(--spacing-xs) var(--spacing-sm)` (4px vertical, 8px horizontal) — intentionally tight to let more data fit per row. `.data-table.compact` now differs only in `font-size`.
- Column headers wrap on long labels: `.col-header` doesn't set `white-space` (unlike `.row-header` and `.data-cell`, which use `nowrap`), and uses `max-width: 200px`, `overflow-wrap: break-word`, and `vertical-align: bottom`. The bottom-alignment keeps single-line and multi-line headers visually consistent across the same row. `min-width: 80px` is preserved so short headers ("År") don't collapse.
- The compact variable selector: `.variables-container.compact` lays the dimension cards out in an `auto-fit` grid (`minmax(380px, 1fr)`), giving 1, 2 or 3 columns by width without new breakpoints. The default is one card per row. The «Kompaktvisning» button toggles it, and the choice is kept in `localStorage` under `varSelectLayout` (`'compact'` or `'full'`), set on `#variables-container` at render and mirrored by `.btn-active` + `aria-pressed` on the button.
- The variable-card header: `.variable-name { flex: 1 }` takes the free space, and the role badge, «Må velges»/«Valgfri», the counter and «Definisjon» gather on the right with `gap`. `flex-wrap: wrap` moves them to a new line in narrow cards (compact view, mobile). Don't use `justify-content: space-between` here: it spread the items across the card and overflowed narrow cards. The role badges (`.role-time/geo/metric`) use their own hex accents, like `.badge-required`.

### Specificity pitfall — CSS dedup

When consolidating CSS rules, remember that the cascade merges properties across rules — not entire blocks. Two rules for the same selector may *each* contribute properties; removing one can drop properties that aren't redundant. The same applies in reverse to specificity: `.data-table .data-cell` (0,2,0) beats `.data-table td` (0,1,1), but plain `.data-cell` (0,1,0) does not. During the v1.4.2 cleanup, three regressions appeared from this: data-cell right-alignment, search-container margin-bottom, and info-message text-align/font-style. All are now resolved. Future dedups should: (a) enumerate properties of the rule being removed, (b) confirm each is either overridden elsewhere or genuinely unwanted, and (c) check the specificity of nearby rules that target overlapping elements.

## Shared utilities

`utils.js` provides several helpers used across views:

- **`safeApiCall(fn, errorMsg, viewContainer?)`** — Wraps an async API call: shows the loader, clears errors, calls `fn()`, hides the loader when done, and on failure shows `error.userMessage` when the error has one, else `errorMsg`. With `viewContainer`, the error also replaces that element's loading text through `showViewError()`, since the banner hides itself. Use it instead of bare `await api.*` calls in view code (see «Error handling»).
- **`showLoading(bool, msg?)`** / **`showError(msg, err?)`** / **`clearError()`** — The loading indicator and the error banner. `showError` adds a link when `err.helpUrl` is set.
- **`updateRateWaitNotice(until)`** — The notice while calls wait for the rate window; driven by the `ratewait` event from `api.js`, so views never call it.
- **`renderGuard()`** — Tells async view code whether the render it started in is still current (see «Stale loads»).
- **`addEscapeHandler(closeFn)`** — Registers a one-shot Escape key listener that closes a dialog. Returns a cleanup function. Used by the rotation dialog, export dialog, and save-query dialog.
- **`buildNavigationBreadcrumb(tableId, tableLabel)`** — Builds breadcrumb HTML from the topic path that led to the current table. Uses `AppState.navigationRef` (from topic navigation) or falls back to the table's first known path in the menu hierarchy.
- **`escapeHtml(text)`** — HTML-escapes user-supplied strings.
- **`formatNumber(value, decimals)`** — Formats numbers with Norwegian locale (space as thousands separator, comma as decimal).
- **`updatePageTitle(parts)`** — Sets the browser tab title dynamically per view.
