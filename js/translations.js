/**
 * Localization / i18n for the statistics browser.
 *
 * t(key)           — look up a UI string in the current language
 * tpl(key, ...args) — same, but replace {0}, {1}, … placeholders with args
 * setLanguage(code) — switch UI language and re-render; persisted in localStorage
 * getCurrentApiLang() — returns the API lang= parameter for the active language
 *
 * Language codes used here are UI codes ('nb', 'en', 'sv').
 * API language codes ('no', 'en', 'sv') are defined per-language in AppConfig.languages.
 *
 * NOTE: Instance-specific strings (source name, app name, URLs) live in AppConfig,
 * not here. Do not hard-code "SSB", "SCB", or any brand name in this file.
 */

// ---------------------------------------------------------------------------
// Translation dictionary
// ---------------------------------------------------------------------------

const translations = {

  // Norwegian Bokmål
  nb: {
    // Loading states
    'loading.app':       'Laster...',
    'loading.init':      'Initialiserer...',
    'loading.tables':    'Laster tabellliste...',
    'loading.metadata':  'Laster metadata...',
    'loading.data':      'Henter data...',
    'loading.file':      'Laster ned fil...',
    'loading.rateWait':  'Venter litt, så {0} ikke får for mange forespørsler.',
    'loading.rateWaitSeconds': 'Fortsetter om ca. {0} s.',

    // Errors
    'error.prefix':           'Feil:',
    'error.details':          'Se tekniske detaljer',
    'error.loadData':         'Kunne ikke laste data',
    'error.loadMetadata':     'Kunne ikke laste metadata for tabell ',
    'error.fetchData':        'Kunne ikke hente data fra API. Prøv igjen eller endre variabelvalget.',
    'error.noData':           'Ingen data funnet for valgt kombinasjon. Prøv å endre variabelvalget.',
    'error.buildTable':       'Kunne ikke bygge tabell',
    'error.noTable':          'Ingen tabell valgt',
    'error.noTableOrSel':     'Mangler tabell eller variabelvalg',
    'error.noDataExport':     'Ingen data å eksportere',
    'error.noDataRotate':     'Ingen data å rotere',
    'error.downloadFailed':   'Nedlastingen feilet',
    'error.downloadFailed2':  'Kunne ikke laste ned filen',
    'error.loadCodelist':     'Kunne ikke laste kodeliste',
    'error.defaultSelection': 'Kunne ikke laste standardvalg',
    'error.noTablesPath':     'Fant ingen tabeller for denne stien',
    'error.unknownView':      'Ukjent visning',
    'error.rateLimit':        'For mange forespørsler. Vennligst vent litt og prøv igjen.',
    'error.cellLimit':        'Spørringen ga for mange celler. Reduser utvalget og prøv igjen.',
    'error.tableNotFound':    'Tabellen finnes ikke. Den kan være fjernet eller erstattet av en ny tabell.',
    'error.tableNotFoundTitle': 'Tabellen finnes ikke',
    'error.tableChangesLink': 'Se oversikten over endrede og fjernede tabeller',

    // Navigation
    'nav.home':          'Forsiden',
    'nav.subjects':      'Emner',
    'nav.search':        'Søk',
    'nav.back.tables':   '\u2190 Tilbake til tabelloversikt',
    'nav.help':          'Hjelp',
    'nav.back.variables': '\u2190 Endre variabelvalg',

    // Help view (condensed in-app guide; full guide lives in BRUKERVEILEDNING.md).
    // {0}=app name, {1}=source name \u2014 filled via tpl() so no brand is hard-coded here.
    'help.title':               'Slik bruker du {0}',
    'help.intro':               '{0} er et uoffisielt, raskere grensesnitt til {1}s \u00e5pne data. Finn en tabell og plukk akkurat de tallene du vil ha. Se dem som tabell eller graf, last ned eller del.',
    'help.fullGuide':           'Les den fullstendige brukerveiledningen',
    'help.bannerText':          'Ny her? Se hvordan portalen fungerer',
    'help.variablesHint':       'Ny her? Slik velger du variabler',

    'help.quickstart.title':    'P\u00e5 1 minutt',
    'help.quickstart.intro':    'Den raske veien til et tall, f.eks. \u00abHvor mange bor i Oslo?\u00bb:',
    'help.quickstart.s1':       'S\u00f8k p\u00e5 et emne, f.eks. \u00abfolkemengde\u00bb, eller bla via emnene.',
    'help.quickstart.s2':       'Velg en tabell fra trefflisten.',
    'help.quickstart.s3':       'Velg verdiene du vil ha, f.eks. Oslo og siste \u00e5r.',
    'help.quickstart.s4':       'Klikk \u00abHent data\u00bb.',
    'help.quickstart.s5':       'Les tabellen. Bytt til graf (\ud83d\udcc8), roter eller last ned.',

    'help.frontpage.title':     'Forsiden',
    'help.frontpage.body':      'S\u00f8kefeltet finner tabeller p\u00e5 ID, tittel og variabler. Du kan ogs\u00e5 lime inn en delelenke fra {0}. Emneflisene lar deg bla fra emne til tabell, også med tastaturet (Tab + Enter). \u00abNylig oppdatert\u00bb viser ferske tall. Toppmenyen og spr\u00e5kvalget ligger \u00f8verst.',

    'help.glossary.title':      'Forst\u00e5 en statistikktabell',
    'help.glossary.intro':      'Noen ord g\u00e5r igjen. Kjenner du disse, blir resten lett:',
    'help.glossary.variable':   'Variabel (dimensjon): en egenskap du kan bryte tallene ned p\u00e5, f.eks. Tid, Geografi, Kj\u00f8nn eller Alder.',
    'help.glossary.metric':     'Statistikkvariabel: det som m\u00e5les, f.eks. antall, prosent, kroner eller indeks. Den har alltid en enhet.',
    'help.glossary.timegeo':    'Tid og Geografi er egne merker som forteller n\u00e5r og hvor tallene gjelder.',
    'help.glossary.cell':       'Celle: ett tall i tabellen. Jo flere verdier du velger, jo flere celler. API-et har en \u00f8vre grense, s\u00e5 hold utvalget stramt.',
    'help.glossary.required':   '\u00abM\u00e5 velges *\u00bb betyr obligatorisk. \u00abValgfri variabel\u00bb kan utelates og summeres da automatisk.',

    'help.variables.title':     'Velge variabler',
    'help.variables.select':    'Klikk for \u00e5 velge. Shift+klikk velger et omr\u00e5de, Ctrl/Cmd+klikk enkeltverdier, Ctrl+A alle synlige. Filterfeltet s\u00f8ker i verdiene. P\u00e5 ber\u00f8ringsskjerm: trykk for \u00e5 legge til eller fjerne.',
    'help.variables.operators': 'Snarveier: \u00abVelg alle\u00bb tar med alt. \u00abSiste\u00bb tar de nyeste periodene i tidsvariabelen, og du velger selv hvor mange.',
    'help.variables.grouping':  'Gruppering viser tallene p\u00e5 et annet niv\u00e5, f.eks. fylke i stedet for kommune. Aggregering skjer automatisk.',
    'help.variables.fetch':     'Statuslinjen viser hvor mange celler du har valgt. N\u00e5r alt obligatorisk er valgt, klikk \u00abHent data\u00bb.',

    'help.read.title':          'Lese og tilpasse',
    'help.read.body':           'Tabellen viser statistikkvariabelen \u00f8verst og tid nedover, med norske tallformater. Tomme celler har statuskoder: \u00ab.\u00bb = ikke aktuelt, \u00ab..\u00bb = ikke tilgjengelig, \u00ab:\u00bb = konfidensielt. Et tall med \u00ab*\u00bb etter seg er forel\u00f8pig og kan bli revidert. Roter tabellen ved \u00e5 dra dimensjoner mellom rader og kolonner, eller flytt dem med piltastene. Tidsserier kan vises som linjediagram (\ud83d\udcc8).',

    'help.share.title':         'Hente ut og dele',
    'help.share.body':          'Last ned som Excel, CSV eller PX. \u00abF\u00e5 lenke\u00bb gir en URL som gjenskaper hele utvalget. Lagrede sp\u00f8rringer kan deles og henter alltid ferske tall.',

    'help.advanced.title':      'For viderekomne',
    'help.advanced.body':       'API-byggeren lager GET- og POST-kall mot {0}s API, rett fra utvalget ditt og i flere formater. Vil du heller sp\u00f8rre med naturlig spr\u00e5k? Det finnes egne skills for AI-assistenter. Se den fullstendige veiledningen for detaljer.',

    // Table units (singular / plural)
    'unit.table.one':   'tabell',
    'unit.table.many':  'tabeller',
    'unit.value.one':   'verdi',
    'unit.value.many':  'verdier',
    'unit.cell.one':    'celle',
    'unit.cell.many':   'celler',

    // Date / update periods (front page)
    'date.updatedToday':    'Oppdatert i dag',
    'date.yesterday':       'I går',
    'date.friday':          'Fredag',
    'date.noTablesUpdated': 'Ingen tabeller oppdatert',
    'date.earlier7Days':    'Tidligere siste 7 dager',

    // Search view
    'search.placeholder':   'Søk etter tabell (ID, tittel, variabler...)',
    'search.heading':       'Søk i statistikkbanken',
    'search.instructions':  'Skriv inn søkeord eller bruk filtrene for å finne tabeller',
    'search.results':       'Søkeresultater',
    'search.fuzzyFallback': 'Ingen eksakte treff \u2013 viser omtrentlige treff (fuzzy søk)',
    'search.noResults':     'Ingen tabeller funnet',
    'search.showingFirst':  'Viser de første 100 av {0} resultater i denne gruppen',
    'search.includeStopped': 'Inkluder avsluttede tabeller',
    'search.enhanced':      'Forbedret søk',

    // Filters (shared between search and topic views)
    'filter.allSubjects':    'Alle emner',
    'filter.allFrequencies': 'Alle frekvenser',
    'filter.monthly':        'Månedlig',
    'filter.quarterly':      'Kvartalsvis',
    'filter.annual':         'Årlig',
    'filter.other':          'Annet',
    'filter.allPeriods':     'Alle perioder',
    'filter.lastDay':        'Oppdatert siste dag',
    'filter.lastWeek':       'Oppdatert siste uke',
    'filter.lastMonth':      'Oppdatert siste måned',
    'filter.lastYear':       'Oppdatert siste år',
    'filter.last2Years':     'Oppdatert siste to år',

    // Topic view
    'topic.unknownGroup': 'Ukjent emnegruppe',

    // Variable selector
    'variable.heading':         'Velg variabler',
    'variable.tablePrefix':     'Tabell',
    'variable.instructions':    'Velg verdier for hver variabel. Klikk for å velge, Shift+klikk for å velge et område, Ctrl/Cmd+klikk for å legge til enkelverdier, Ctrl+A for å velge alle synlige. På berøringsskjerm: trykk for å legge til eller fjerne verdier.',
    'variable.fetchData':       'Hent data',
    'variable.selectValues':    'Velg verdier for å se spørringen',
    'variable.selectValuesAll': 'Velg verdier for alle variabler',
    'variable.optional':        'Valgfri variabel',
    'variable.required':        'Må velges *',
    'variable.role.time':       'Tid',
    'variable.role.geo':        'Geografi',
    'variable.role.metric':     'Statistikkvariabel',
    'variable.timeFormatHint':  'Format: {0}',
    'variable.categorization':  'Gruppering:',
    'variable.freeChoice':      'Velg fritt blant alle verdier',
    'variable.filterPlaceholder': 'Filtrer verdier...',
    'variable.selected':        'Valgt',
    'variable.ofTotal':         'av totalt',
    'variable.withoutTitle':    'Uten tittel',
    'variable.withTitle':       'Med tittel',
    'variable.truncated':       'Viser {0} av {1} verdier. Bruk "Velg alle" for å inkludere alle.',
    'variable.defaultSelection':      'Fyll inn standardvalg',
    'variable.defaultSelectionTitle': 'Hent tabellens anbefalte standardutvalg. Erstatter valgene du har gjort',
    'variable.defaultSelectionLoading': 'Henter standardvalg...',
    'variable.defaultSelectionEmpty':   'Ingen standardvalg funnet',
    'variable.definitionLink':        'Definisjon',
    'variable.compactView':           'Kompaktvisning',
    'variable.compactViewTitle':      'Vis dimensjoner i et flerkolonners rutenett som utnytter brede skjermer',

    // Variable mode buttons
    'variable.btn.all':         'Alle (*)',
    'variable.btn.selectAll':   'Velg alle',
    'variable.btn.deselectAll': 'Opphev alle',
    'variable.btn.last':        'Siste',

    // Codelist dropdown
    'codelist.error':    'Kunne ikke laste kodeliste',
    'codelist.optional': 'Valgfri variabel',
    'codelist.required': 'Må velges *',

    // Selection status bar
    'status.all':          'alle',
    'status.last':         'siste ',
    'status.ready':        'Klar til å hente data',
    'status.selectRequired': 'Velg minst én verdi for alle obligatoriske variabler',
    'status.noValuesOpt':  'Ingen verdier valgt (variabelen utelates fra spørringen)',
    'status.noValues':     'Ingen verdier valgt',
    'status.allSelected':  'Alle verdier valgt',
    'status.topMode':      'siste {0}',
    'status.tooManyCells': 'For mange celler valgt \u2014 reduser utvalget',
    'status.cellsSelected': '{0} {1} valgt (av maks {2} mulige)',
    'status.exceedsLimit': '\u2014 overskrider API-grensen på 800\u202f000!',

    // API builder
    'api.builder':          'API-bygger',
    'api.method':           'Metode:',
    'api.format':           'Responsformat:',
    'api.display':          'Visning:',
    'api.displayText':      'Tekst',
    'api.displayCodes':     'Koder',
    'api.displayBoth':      'Koder og tekst',
    'api.tableTitle':       'Tabelltittel:',
    'api.separator':        'Skilletegn:',
    'api.separatorSemicolon': 'Semikolon',
    'api.separatorTab':     'Tabulator',
    'api.separatorSpace':   'Mellomrom',
    'api.layout':           'Tabellayout:',
    'api.layoutStandard':   'Standard',
    'api.layoutPivot':      'Pivotvennlig (alle i forspalte)',
    'api.dataUrl':          'Data-URL',
    'api.showPlaintext':    'Vis i klartekst',
    'api.decodedUrlTooltip': 'Vis URL med lesbare tegn i stedet for URL-koding',
    'api.copyUrl':          'Kopier URL',
    'api.openBrowser':      'Åpne i nettleser',
    'api.openNewTab':       'Åpne i ny fane',
    'api.copied':           'Kopiert!',
    'api.postBody':         'POST-body (JSON)',
    'api.copyBody':         'Kopier body',
    'api.metadataUrl':      'Metadata-URL',
    'api.copyMetadataUrl':  'Kopier metadata-URL',
    'api.openMetadata':     'Åpne metadata i ny fane',
    'api.urlTooLong':       'URL-en er {0} tegn \u2014 overskrider grensen på {1} tegn. Bruk POST-modus for store utvalg.',
    'api.getOnlyFeature':   'Kun tilgjengelig i GET-modus',

    // Table display
    'table.rotate':       '\u21BB Roter tabell',
    'table.download':     '\u2B07 Last ned i Excel-format',
    'table.moreOptions':  'Flere alternativer',
    'table.getLink':      '\uD83D\uDD17 Få lenke',
    'table.notAvailable': 'Ikke tilgjengelig',
    'table.confidential': 'Konfidensielt',
    'table.notApplicable': 'Ikke aktuelt',
    'table.notYetAvailable': 'Oppgave mangler forel\u00f8pig',
    'table.nil':          'Null',
    'table.preliminary':  'Forel\u00f8pig tall',

    // Tabellinfo (table-metadata.js)
    'metadata.title':       'Tabellinfo',
    'metadata.source':      'Kilde',
    'metadata.updated':     'Sist oppdatert',
    'metadata.status':      'Status',
    'metadata.official':    'Offisiell statistikk',
    'metadata.about':       'Om statistikken',
    'metadata.notes':       'Merknader',
    'metadata.contact':     'Kontakt',
    'metadata.phone':       'tlf',
    'metadata.definitions': 'Klassifikasjoner og definisjoner',

    'table.prefix':       'Tabell',
    'table.unnamed':      'Uten navn',

    // Chart view
    'chart.toggle':        '📈 Vis som diagram',
    'chart.toggleTitle':   'Vis tidsserien som linjediagram',
    'chart.tooManyLines':  'Diagrammet har {0} linjer — vurder å begrense utvalget for bedre lesbarhet.',
    'chart.source':        'Kilde',
    'chart.tableWord':     'tabell',
    'chart.lastUpdated':   'Sist oppdatert',
    'chart.series':        'Serie',

    // Table rotation dialog
    'rotation.title':        'Roter tabell',
    'rotation.instructions': 'Dra dimensjoner mellom rader og kolonner for å endre tabellens layout. Du kan også fokusere en dimensjon med Tab og flytte den med piltastene.',
    'rotation.rows':         'Rader',
    'rotation.columns':      'Kolonner',
    'rotation.presets':      'Hurtigvalg:',
    'rotation.standard':     'Standard',
    'rotation.transpose':    'Transponér',
    'rotation.allRows':      'Alle som rader',
    'rotation.allColumns':   'Alle som kolonner',
    'rotation.apply':        'Bruk layout',
    'rotation.cancel':       'Avbryt',
    'rotation.dropHere':     'Dra dimensjoner hit',
    'rotation.values':       'verdier',
    'rotation.allRequired':  'Alle dimensjoner må være enten i rader eller kolonner',
    'rotation.minOne':       'Tabellen må ha minst én dimensjon',

    // Save query dialog ("Få lenke")
    'saveQuery.noActive':       'Ingen aktiv spørring å lagre',
    'saveQuery.title':          'Få lenke til spørringen',
    'saveQuery.saving':         'Lagrer spørring hos {0}...',
    'saveQuery.saved':          'Spørringen er lagret. Bruk lenkene nedenfor for å dele eller gjenåpne den.',
    'saveQuery.portalLabel':    'Åpne i {0}:',
    'saveQuery.sourceLabel':    'Åpne i {0}s statistikkbank:',
    'saveQuery.openSource':     'Åpne i {0}s statistikkbank',
    'saveQuery.copy':           'Kopier',
    'saveQuery.noIdInResponse': 'Ingen ID i svar fra API',
    'saveQuery.failed':         'Kunne ikke lagre spørringen: {0}',

    // Saved query loading (#sq/ route)
    'sq.loadFailed': 'Kunne ikke laste spørringen ({0}): {1}',
    'sq.goHome':     'Gå til forsiden',

    // Export dialog
    'export.title':           'Last ned tabell',
    'export.format':          'Filformat:',
    'export.formatExcel':     'Excel (xlsx)',
    'export.formatCsv':       'CSV (semikolon-separert tekstfil)',
    'export.formatPx':        'PX (PC-Axis format)',
    'export.displayAs':       'Vis verdier som:',
    'export.displayStandard': 'Standard',
    'export.displayText':     'Tekst (f.eks. "Oslo")',
    'export.displayCodes':    'Koder (f.eks. "0301")',
    'export.displayBoth':     'Både koder og tekst (f.eks. "0301: Oslo")',
    'export.csvSeparator':    'CSV-separator:',
    'export.sepSemicolon':    'Semikolon (;) \u2013 Standard for norsk Excel',
    'export.sepTab':          'Tabulator',
    'export.sepSpace':        'Mellomrom',
    'export.layout':          'Tabelloppsett:',
    'export.layoutAsShown':   'Som vist på skjermen (heading: {0})',
    'export.layoutPivot':     'Pivotvennlig (alle variabler i stub, lettere å pivotere i Excel)',
    'export.includeTitle':    'Inkluder tabelltittel',
    'export.downloadInfo':    'Filen lastes ned direkte fra {0} sitt API.',
    'export.dataPoints':      'Tabellen inneholder {0} datapunkter.',
    'export.cancel':          'Avbryt',
    'export.download':        'Last ned',

    // Footer
    'footer.dataFrom':    'Data fra',

    // Cache
    'cache.clear':        'T\u00F8m hurtigbuffer',
    'cache.clearTooltip': 'T\u00F8m hurtigbuffer og last inn data p\u00E5 nytt',

    // Search
    'search.found': 'funnet',

    // Language selector
    'lang.label': 'Spr\u00E5k'
  },

  // -------------------------------------------------------------------------
  // English
  // -------------------------------------------------------------------------
  en: {
    'loading.app':       'Loading...',
    'loading.init':      'Initializing...',
    'loading.tables':    'Loading table list...',
    'loading.metadata':  'Loading metadata...',
    'loading.data':      'Fetching data...',
    'loading.file':      'Downloading file...',
    'loading.rateWait':  'Waiting a moment so that {0} doesn\'t get too many requests.',
    'loading.rateWaitSeconds': 'Continuing in about {0} s.',

    'error.prefix':           'Error:',
    'error.details':          'Show technical details',
    'error.loadData':         'Could not load data',
    'error.loadMetadata':     'Could not load metadata for table ',
    'error.fetchData':        'Could not fetch data from the API. Please try again or change your variable selection.',
    'error.noData':           'No data found for the selected combination. Try changing your variable selection.',
    'error.buildTable':       'Could not build table',
    'error.noTable':          'No table selected',
    'error.noTableOrSel':     'Missing table or variable selection',
    'error.noDataExport':     'No data to export',
    'error.noDataRotate':     'No data to rotate',
    'error.downloadFailed':   'Download failed',
    'error.downloadFailed2':  'Could not download the file',
    'error.loadCodelist':     'Could not load codelist',
    'error.defaultSelection': 'Could not load default selection',
    'error.noTablesPath':     'No tables found for this path',
    'error.unknownView':      'Unknown view',
    'error.rateLimit':        'Too many requests. Please wait a moment and try again.',
    'error.cellLimit':        'The query returned too many cells. Reduce your selection and try again.',
    'error.tableNotFound':    'The table does not exist. It may have been removed or replaced by a new table.',
    'error.tableNotFoundTitle': 'Table not found',
    'error.tableChangesLink': 'See the list of changed and removed tables',

    'nav.home':           'Home',
    'nav.subjects':       'Subjects',
    'nav.search':         'Search',
    'nav.help':           'Help',
    'nav.back.tables':    '\u2190 Back to table list',
    'nav.back.variables': '\u2190 Change variable selection',

    // Help view (condensed in-app guide; full guide lives in BRUKERVEILEDNING.md).
    // {0}=app name, {1}=source name \u2014 filled via tpl() so no brand is hard-coded here.
    'help.title':               'How to use {0}',
    'help.intro':               '{0} is an unofficial, faster interface to {1}\u2019s open data. Find a table and pick exactly the numbers you want. View them as a table or chart, then download or share.',
    'help.fullGuide':           'Read the full user guide',
    'help.bannerText':          'New here? See how the portal works',
    'help.variablesHint':       'New here? How to select variables',

    'help.quickstart.title':    'In 1 minute',
    'help.quickstart.intro':    'The quick path to a number, e.g. \u201cHow many people live in Oslo?\u201d:',
    'help.quickstart.s1':       'Search for a topic, e.g. \u201cpopulation\u201d, or browse by subject.',
    'help.quickstart.s2':       'Pick a table from the results.',
    'help.quickstart.s3':       'Select the values you want, e.g. Oslo and the latest year.',
    'help.quickstart.s4':       'Click \u201cFetch data\u201d.',
    'help.quickstart.s5':       'Read the table. Switch to a chart (\ud83d\udcc8), rotate or download.',

    'help.frontpage.title':     'The front page',
    'help.frontpage.body':      'The search field finds tables by ID, title and variables. You can also paste a share link from {0}. The subject tiles let you browse from subject to table, also with the keyboard (Tab + Enter). \u201cRecently updated\u201d shows fresh numbers. The top menu and language selector sit at the top.',

    'help.glossary.title':      'Understanding a statistics table',
    'help.glossary.intro':      'A few words recur. Know these and the rest is easy:',
    'help.glossary.variable':   'Variable (dimension): a property you can break the numbers down by, e.g. Time, Geography, Sex or Age.',
    'help.glossary.metric':     'Measure: what is counted, e.g. a number, percentage, amount or index. It always has a unit.',
    'help.glossary.timegeo':    'Time and Geography are roles that tell you when and where the numbers apply.',
    'help.glossary.cell':       'Cell: one number in the table. The more values you select, the more cells. The API has an upper limit, so keep your selection tight.',
    'help.glossary.required':   '\u201cRequired *\u201d means mandatory. An \u201cOptional variable\u201d can be omitted and is then aggregated automatically.',

    'help.variables.title':     'Selecting variables',
    'help.variables.select':    'Click to select. Shift+click selects a range, Ctrl/Cmd+click individual values, Ctrl+A all visible. The filter field searches the values. On a touch screen: tap to add or remove.',
    'help.variables.operators': 'Shortcuts: \u201cSelect all\u201d includes everything. \u201cLast\u201d takes the most recent periods of the time variable, and you choose how many.',
    'help.variables.grouping':  'Grouping shows the numbers at another level, e.g. by county instead of municipality. Aggregation happens automatically.',
    'help.variables.fetch':     'The status bar shows how many cells you have selected. When everything required is chosen, click \u201cFetch data\u201d.',

    'help.read.title':          'Reading and adjusting',
    'help.read.body':           'The table shows the measure on top and time going down. Empty cells use status codes: \u201c.\u201d = not applicable, \u201c..\u201d = not available, \u201c:\u201d = confidential. A number followed by \u201c*\u201d is preliminary and may be revised. Rotate the table by dragging dimensions between rows and columns, or move them with the arrow keys. Time series can be shown as a line chart (\ud83d\udcc8).',

    'help.share.title':         'Getting and sharing data',
    'help.share.body':          'Download as Excel, CSV or PX. \u201cGet link\u201d gives a URL that recreates your whole selection. Saved queries can be shared and always fetch fresh numbers.',

    'help.advanced.title':      'For advanced users',
    'help.advanced.body':       'The API builder creates GET and POST calls to {0}\u2019s API, straight from your selection and in several formats. Prefer natural language? Dedicated skills exist for AI assistants. See the full user guide for details.',

    'unit.table.one':   'table',
    'unit.table.many':  'tables',
    'unit.value.one':   'value',
    'unit.value.many':  'values',
    'unit.cell.one':    'cell',
    'unit.cell.many':   'cells',

    'date.updatedToday':    'Updated today',
    'date.yesterday':       'Yesterday',
    'date.friday':          'Friday',
    'date.noTablesUpdated': 'No tables updated',
    'date.earlier7Days':    'Earlier this week',

    'search.placeholder':    'Search for table (ID, title, variables...)',
    'search.heading':        'Search the statistics database',
    'search.instructions':   'Enter search terms or use the filters to find tables',
    'search.results':        'Search results',
    'search.fuzzyFallback':  'No exact matches \u2013 showing approximate matches (fuzzy search)',
    'search.noResults':      'No tables found',
    'search.showingFirst':   'Showing first 100 of {0} results in this group',
    'search.includeStopped': 'Include discontinued tables',
    'search.enhanced':       'Enhanced search',

    'filter.allSubjects':    'All subjects',
    'filter.allFrequencies': 'All frequencies',
    'filter.monthly':        'Monthly',
    'filter.quarterly':      'Quarterly',
    'filter.annual':         'Annual',
    'filter.other':          'Other',
    'filter.allPeriods':     'All periods',
    'filter.lastDay':        'Updated last day',
    'filter.lastWeek':       'Updated last week',
    'filter.lastMonth':      'Updated last month',
    'filter.lastYear':       'Updated last year',
    'filter.last2Years':     'Updated last 2 years',

    'topic.unknownGroup': 'Unknown subject group',

    'variable.heading':         'Select variables',
    'variable.tablePrefix':     'Table',
    'variable.instructions':    'Select values for each variable. Click to select, Shift+click to select a range, Ctrl/Cmd+click to add individual values, Ctrl+A to select all visible. On a touch screen: tap to add or remove values.',
    'variable.fetchData':       'Fetch data',
    'variable.selectValues':    'Select values to see the query',
    'variable.selectValuesAll': 'Select values for all variables',
    'variable.optional':        'Optional variable',
    'variable.required':        'Required *',
    'variable.role.time':       'Time',
    'variable.role.geo':        'Geography',
    'variable.role.metric':     'Measure',
    'variable.timeFormatHint':  'Format: {0}',
    'variable.categorization':  'Grouping:',
    'variable.freeChoice':      'Choose freely from all values',
    'variable.filterPlaceholder': 'Filter values...',
    'variable.selected':        'Selected',
    'variable.ofTotal':         'of total',
    'variable.withoutTitle':    'Without title',
    'variable.withTitle':       'With title',
    'variable.truncated':       'Showing {0} of {1} values. Use "Select all" to include all.',
    'variable.defaultSelection':      'Load default selection',
    'variable.defaultSelectionTitle': 'Fetch the table\'s recommended default selection. Replaces the choices you have made',
    'variable.defaultSelectionLoading': 'Loading default selection...',
    'variable.defaultSelectionEmpty':   'No default selection found',
    'variable.definitionLink':        'Definition',
    'variable.compactView':           'Compact view',
    'variable.compactViewTitle':      'Show dimensions in a multi-column grid that takes advantage of wide screens',

    'variable.btn.all':         'All (*)',
    'variable.btn.selectAll':   'Select all',
    'variable.btn.deselectAll': 'Deselect all',
    'variable.btn.last':        'Last',

    'codelist.error':    'Could not load codelist',
    'codelist.optional': 'Optional variable',
    'codelist.required': 'Required *',

    'status.all':          'all',
    'status.last':         'last ',
    'status.ready':        'Ready to fetch data',
    'status.selectRequired': 'Select at least one value for all required variables',
    'status.noValuesOpt':  'No values selected (variable will be excluded from query)',
    'status.noValues':     'No values selected',
    'status.allSelected':  'All values selected',
    'status.topMode':      'last {0}',
    'status.tooManyCells': 'Too many cells selected \u2014 reduce the selection',
    'status.cellsSelected': '{0} {1} selected (of max {2} possible)',
    'status.exceedsLimit': '\u2014 exceeds the API limit of 800,000!',

    'api.builder':          'API builder',
    'api.method':           'Method:',
    'api.format':           'Response format:',
    'api.display':          'Display:',
    'api.displayText':      'Text',
    'api.displayCodes':     'Codes',
    'api.displayBoth':      'Codes and text',
    'api.tableTitle':       'Table title:',
    'api.separator':        'Separator:',
    'api.separatorSemicolon': 'Semicolon',
    'api.separatorTab':     'Tab',
    'api.separatorSpace':   'Space',
    'api.layout':           'Table layout:',
    'api.layoutStandard':   'Standard',
    'api.layoutPivot':      'Pivot-friendly (all in stub)',
    'api.dataUrl':          'Data URL',
    'api.showPlaintext':    'Show plaintext',
    'api.decodedUrlTooltip': 'Show URL with readable characters instead of URL encoding',
    'api.copyUrl':          'Copy URL',
    'api.openBrowser':      'Open in browser',
    'api.openNewTab':       'Open in new tab',
    'api.copied':           'Copied!',
    'api.postBody':         'POST body (JSON)',
    'api.copyBody':         'Copy body',
    'api.metadataUrl':      'Metadata URL',
    'api.copyMetadataUrl':  'Copy metadata URL',
    'api.openMetadata':     'Open metadata in new tab',
    'api.urlTooLong':       'The URL is {0} characters \u2014 exceeds the {1} character limit. Use POST mode for large selections.',
    'api.getOnlyFeature':   'Only available in GET mode',

    'table.rotate':        '\u21BB Rotate table',
    'table.download':      '\u2B07 Download in Excel format',
    'table.moreOptions':   'More options',
    'table.getLink':       '\uD83D\uDD17 Get link',
    'table.notAvailable':  'Not available',
    'table.confidential':  'Confidential',
    'table.notApplicable': 'Not applicable',
    'table.notYetAvailable': 'Not yet available',
    'table.nil':          'Nil',
    'table.preliminary':  'Preliminary figure',

    // Table info (table-metadata.js)
    'metadata.title':       'Table info',
    'metadata.source':      'Source',
    'metadata.updated':     'Last updated',
    'metadata.status':      'Status',
    'metadata.official':    'Official statistics',
    'metadata.about':       'About the statistics',
    'metadata.notes':       'Notes',
    'metadata.contact':     'Contact',
    'metadata.phone':       'phone',
    'metadata.definitions': 'Classifications and definitions',

    'table.prefix':        'Table',
    'table.unnamed':       'Unnamed',

    // Chart view
    'chart.toggle':        '\uD83D\uDCC8 Show as chart',
    'chart.toggleTitle':   'Show the time series as a line chart',
    'chart.tooManyLines':  'The chart has {0} lines \u2014 consider narrowing your selection for readability.',
    'chart.source':        'Source',
    'chart.tableWord':     'table',
    'chart.lastUpdated':   'Last updated',
    'chart.series':        'Series',

    'rotation.title':        'Rotate table',
    'rotation.instructions': 'Drag dimensions between rows and columns to change the table layout. You can also focus a dimension with Tab and move it with the arrow keys.',
    'rotation.rows':         'Rows',
    'rotation.columns':      'Columns',
    'rotation.presets':      'Quick select:',
    'rotation.standard':     'Standard',
    'rotation.transpose':    'Transpose',
    'rotation.allRows':      'All as rows',
    'rotation.allColumns':   'All as columns',
    'rotation.apply':        'Apply layout',
    'rotation.cancel':       'Cancel',
    'rotation.dropHere':     'Drag dimensions here',
    'rotation.values':       'values',
    'rotation.allRequired':  'All dimensions must be either in rows or columns',
    'rotation.minOne':       'The table must have at least one dimension',

    // Save query dialog ("Get link")
    'saveQuery.noActive':       'No active query to save',
    'saveQuery.title':          'Get a link to the query',
    'saveQuery.saving':         'Saving query at {0}...',
    'saveQuery.saved':          'The query has been saved. Use the links below to share or reopen it.',
    'saveQuery.portalLabel':    'Open in {0}:',
    'saveQuery.sourceLabel':    'Open in {0}\u2019s statistics database:',
    'saveQuery.openSource':     'Open in {0}\u2019s statistics database',
    'saveQuery.copy':           'Copy',
    'saveQuery.noIdInResponse': 'No ID in API response',
    'saveQuery.failed':         'Could not save the query: {0}',

    // Saved query loading (#sq/ route)
    'sq.loadFailed': 'Could not load the query ({0}): {1}',
    'sq.goHome':     'Go to the front page',

    'export.title':           'Download table',
    'export.format':          'File format:',
    'export.formatExcel':     'Excel (xlsx)',
    'export.formatCsv':       'CSV (semicolon-separated text file)',
    'export.formatPx':        'PX (PC-Axis format)',
    'export.displayAs':       'Display values as:',
    'export.displayStandard': 'Standard',
    'export.displayText':     'Text (e.g. "Oslo")',
    'export.displayCodes':    'Codes (e.g. "0301")',
    'export.displayBoth':     'Both codes and text (e.g. "0301: Oslo")',
    'export.csvSeparator':    'CSV separator:',
    'export.sepSemicolon':    'Semicolon (;) \u2013 Standard for Nordic Excel',
    'export.sepTab':          'Tab',
    'export.sepSpace':        'Space',
    'export.layout':          'Table layout:',
    'export.layoutAsShown':   'As shown on screen (heading: {0})',
    'export.layoutPivot':     'Pivot-friendly (all variables in stub, easier to pivot in Excel)',
    'export.includeTitle':    'Include table title',
    'export.downloadInfo':    'The file is downloaded directly from the {0} API.',
    'export.dataPoints':      'The table contains {0} data points.',
    'export.cancel':          'Cancel',
    'export.download':        'Download',

    // Footer
    'footer.dataFrom':    'Data from',

    // Cache
    'cache.clear':        'Clear cache',
    'cache.clearTooltip': 'Clear cache and reload data',

    // Search
    'search.found': 'found',

    'lang.label': 'Language'
  },

  // -------------------------------------------------------------------------
  // Swedish
  // -------------------------------------------------------------------------
  sv: {
    'loading.app':       'Laddar...',
    'loading.init':      'Initierar...',
    'loading.tables':    'Laddar tabellista...',
    'loading.metadata':  'Laddar metadata...',
    'loading.data':      'H\u00E4mtar data...',
    'loading.file':      'Laddar ned fil...',
    'loading.rateWait':  'Väntar lite så att {0} inte får för många förfrågningar.',
    'loading.rateWaitSeconds': 'Fortsätter om cirka {0} s.',

    'error.prefix':           'Fel:',
    'error.details':          'Visa tekniska detaljer',
    'error.loadData':         'Kunde inte ladda data',
    'error.loadMetadata':     'Kunde inte ladda metadata f\u00F6r tabell ',
    'error.fetchData':        'Kunde inte h\u00E4mta data fr\u00E5n API:t. F\u00F6rs\u00F6k igen eller \u00E4ndra variabelurvalet.',
    'error.noData':           'Inga data hittades f\u00F6r vald kombination. F\u00F6rs\u00F6k \u00E4ndra variabelurvalet.',
    'error.buildTable':       'Kunde inte bygga tabellen',
    'error.noTable':          'Ingen tabell vald',
    'error.noTableOrSel':     'Saknar tabell eller variabelurval',
    'error.noDataExport':     'Inga data att exportera',
    'error.noDataRotate':     'Inga data att rotera',
    'error.downloadFailed':   'Nedladdningen misslyckades',
    'error.downloadFailed2':  'Kunde inte ladda ned filen',
    'error.loadCodelist':     'Kunde inte ladda kodlista',
    'error.defaultSelection': 'Kunde inte l\u00E4sa in standardval',
    'error.noTablesPath':     'Hittade inga tabeller f\u00F6r denna s\u00F6kv\u00E4g',
    'error.unknownView':      'Ok\u00E4nd vy',
    'error.rateLimit':        'F\u00F6r m\u00E5nga f\u00F6rfr\u00E5gningar. V\u00E4nta lite och f\u00F6rs\u00F6k igen.',
    'error.cellLimit':        'F\u00F6rfr\u00E5gan returnerade f\u00F6r m\u00E5nga celler. Minska urvalet och f\u00F6rs\u00F6k igen.',
    'error.tableNotFound':    'Tabellen finns inte. Den kan ha tagits bort eller ersatts av en ny tabell.',
    'error.tableNotFoundTitle': 'Tabellen finns inte',
    'error.tableChangesLink': 'Se listan \u00F6ver \u00E4ndrade och borttagna tabeller',

    'nav.home':           'Startsidan',
    'nav.subjects':       '\u00C4mnen',
    'nav.search':         'S\u00F6k',
    'nav.back.tables':    '\u2190 Tillbaka till tabell\u00F6versikt',
    'nav.back.variables': '\u2190 \u00C4ndra variabelurval',
    'nav.help':           'Hj\u00E4lp',

    // Help view (condensed in-app guide; full guide lives in BRUKERVEILEDNING.md).
    // {0}=app name, {1}=source name \u2014 filled via tpl() so no brand is hard-coded here.
    'help.title':               'S\u00E5 anv\u00E4nder du {0}',
    'help.intro':               '{0} \u00E4r ett inofficiellt, snabbare gr\u00E4nssnitt till {1}:s \u00F6ppna data. Hitta en tabell och v\u00E4lj precis de tal du vill ha. Se dem som tabell eller diagram, ladda ned eller dela.',
    'help.fullGuide':           'L\u00E4s den fullst\u00E4ndiga anv\u00E4ndarguiden',
    'help.bannerText':          'Ny h\u00E4r? Se hur portalen fungerar',
    'help.variablesHint':       'Ny h\u00E4r? S\u00E5 v\u00E4ljer du variabler',

    'help.quickstart.title':    'P\u00E5 1 minut',
    'help.quickstart.intro':    'Den snabba v\u00E4gen till ett tal, t.ex. \u201DHur m\u00E5nga bor i Stockholm?\u201D:',
    'help.quickstart.s1':       'S\u00F6k p\u00E5 ett \u00E4mne, t.ex. \u201Dfolkm\u00E4ngd\u201D, eller bl\u00E4ddra via \u00E4mnena.',
    'help.quickstart.s2':       'V\u00E4lj en tabell fr\u00E5n tr\u00E4fflistan.',
    'help.quickstart.s3':       'V\u00E4lj de v\u00E4rden du vill ha, t.ex. Stockholm och senaste \u00E5ret.',
    'help.quickstart.s4':       'Klicka \u201DH\u00E4mta data\u201D.',
    'help.quickstart.s5':       'L\u00E4s tabellen. Byt till diagram (\uD83D\uDCC8), rotera eller ladda ned.',

    'help.frontpage.title':     'Startsidan',
    'help.frontpage.body':      'S\u00F6kf\u00E4ltet hittar tabeller p\u00E5 ID, titel och variabler. Du kan ocks\u00E5 klistra in en del-l\u00E4nk fr\u00E5n {0}. \u00C4mnesrutorna l\u00E5ter dig bl\u00E4ddra fr\u00E5n \u00E4mne till tabell, \u00E4ven med tangentbordet (Tab + Enter). \u201DNyligen uppdaterade\u201D visar f\u00E4rska tal. Toppmenyn och spr\u00E5kvalet ligger \u00F6verst.',

    'help.glossary.title':      'F\u00F6rst\u00E5 en statistiktabell',
    'help.glossary.intro':      'N\u00E5gra ord \u00E5terkommer. K\u00E4nner du dessa blir resten l\u00E4tt:',
    'help.glossary.variable':   'Variabel (dimension): en egenskap du kan bryta ned talen p\u00E5, t.ex. Tid, Geografi, K\u00F6n eller \u00C5lder.',
    'help.glossary.metric':     'M\u00E5tt: det som m\u00E4ts, t.ex. antal, procent, kronor eller index. Det har alltid en enhet.',
    'help.glossary.timegeo':    'Tid och Geografi \u00E4r roller som talar om n\u00E4r och var talen g\u00E4ller.',
    'help.glossary.cell':       'Cell: ett tal i tabellen. Ju fler v\u00E4rden du v\u00E4ljer, desto fler celler. API:t har en \u00F6vre gr\u00E4ns, s\u00E5 h\u00E5ll urvalet stramt.',
    'help.glossary.required':   '\u201DM\u00E5ste v\u00E4ljas *\u201D betyder obligatorisk. En \u201Dvalfri variabel\u201D kan utel\u00E4mnas och summeras d\u00E5 automatiskt.',

    'help.variables.title':     'V\u00E4lja variabler',
    'help.variables.select':    'Klicka f\u00F6r att v\u00E4lja. Shift+klick v\u00E4ljer ett intervall, Ctrl/Cmd+klick enstaka v\u00E4rden, Ctrl+A alla synliga. Filterf\u00E4ltet s\u00F6ker i v\u00E4rdena. P\u00E5 peksk\u00E4rm: tryck f\u00F6r att l\u00E4gga till eller ta bort.',
    'help.variables.operators': 'Genv\u00E4gar: \u201DV\u00E4lj alla\u201D tar med allt. \u201DSenaste\u201D tar de senaste perioderna i tidsvariabeln, och du v\u00E4ljer sj\u00E4lv hur m\u00E5nga.',
    'help.variables.grouping':  'Gruppering visar talen p\u00E5 en annan niv\u00E5, t.ex. l\u00E4n i st\u00E4llet f\u00F6r kommun. Aggregering sker automatiskt.',
    'help.variables.fetch':     'Statusraden visar hur m\u00E5nga celler du har valt. N\u00E4r allt obligatoriskt \u00E4r valt, klicka \u201DH\u00E4mta data\u201D.',

    'help.read.title':          'L\u00E4sa och anpassa',
    'help.read.body':           'Tabellen visar m\u00E5ttet \u00F6verst och tid ned\u00E5t. Tomma celler anv\u00E4nder statuskoder: \u201D.\u201D = inte till\u00E4mpligt, \u201D..\u201D = inte tillg\u00E4ngligt, \u201D:\u201D = konfidentiellt. Ett tal f\u00F6ljt av \u201D*\u201D \u00E4r preliminärt och kan revideras. Rotera tabellen genom att dra dimensioner mellan rader och kolumner, eller flytta dem med piltangenterna. Tidsserier kan visas som linjediagram (\uD83D\uDCC8).',

    'help.share.title':         'H\u00E4mta och dela',
    'help.share.body':          'Ladda ned som Excel, CSV eller PX. \u201DF\u00E5 l\u00E4nk\u201D ger en URL som \u00E5terskapar hela ditt urval. Sparade fr\u00E5gor kan delas och h\u00E4mtar alltid f\u00E4rska tal.',

    'help.advanced.title':      'F\u00F6r avancerade anv\u00E4ndare',
    'help.advanced.body':       'API-byggaren skapar GET- och POST-anrop mot {0}:s API, direkt fr\u00E5n ditt urval och i flera format. Vill du hellre fr\u00E5ga p\u00E5 naturligt spr\u00E5k? Det finns egna skills f\u00F6r AI-assistenter. Se den fullst\u00E4ndiga anv\u00E4ndarguiden f\u00F6r detaljer.',

    'unit.table.one':   'tabell',
    'unit.table.many':  'tabeller',
    'unit.value.one':   'v\u00E4rde',
    'unit.value.many':  'v\u00E4rden',
    'unit.cell.one':    'cell',
    'unit.cell.many':   'celler',

    'date.updatedToday':    'Uppdaterad idag',
    'date.yesterday':       'Ig\u00E5r',
    'date.friday':          'Fredag',
    'date.noTablesUpdated': 'Inga tabeller uppdaterade',
    'date.earlier7Days':    'Tidigare senaste 7 dagarna',

    'search.placeholder':    'S\u00F6k efter tabell (ID, titel, variabler...)',
    'search.heading':        'S\u00F6k i statistikdatabasen',
    'search.instructions':   'Ange s\u00F6kord eller anv\u00E4nd filtren f\u00F6r att hitta tabeller',
    'search.results':        'S\u00F6kresultat',
    'search.fuzzyFallback':  'Inga exakta tr\u00E4ffar \u2013 visar ungef\u00E4rliga tr\u00E4ffar (fuzzy s\u00F6kning)',
    'search.noResults':      'Inga tabeller hittades',
    'search.showingFirst':   'Visar de f\u00F6rsta 100 av {0} resultat i denna grupp',
    'search.includeStopped': 'Inkludera avslutade tabeller',
    'search.enhanced':       'F\u00F6rb\u00E4ttrad s\u00F6kning',

    'filter.allSubjects':    'Alla \u00E4mnen',
    'filter.allFrequencies': 'Alla frekvenser',
    'filter.monthly':        'M\u00E5nadsvis',
    'filter.quarterly':      'Kvartalsvis',
    'filter.annual':         '\u00C5rlig',
    'filter.other':          '\u00D6vrigt',
    'filter.allPeriods':     'Alla perioder',
    'filter.lastDay':        'Uppdaterad senaste dygnet',
    'filter.lastWeek':       'Uppdaterad senaste veckan',
    'filter.lastMonth':      'Uppdaterad senaste m\u00E5naden',
    'filter.lastYear':       'Uppdaterad senaste \u00E5ret',
    'filter.last2Years':     'Uppdaterad senaste tv\u00E5 \u00E5ren',

    'topic.unknownGroup': 'Ok\u00E4nd \u00E4mnesgrupp',

    'variable.heading':         'V\u00E4lj variabler',
    'variable.tablePrefix':     'Tabell',
    'variable.instructions':    'V\u00E4lj v\u00E4rden f\u00F6r varje variabel. Klicka f\u00F6r att v\u00E4lja, Shift+klicka f\u00F6r att v\u00E4lja ett intervall, Ctrl/Cmd+klicka f\u00F6r att l\u00E4gga till enstaka v\u00E4rden, Ctrl+A f\u00F6r att v\u00E4lja alla synliga. På pekskärm: tryck för att lägga till eller ta bort värden.',
    'variable.fetchData':       'H\u00E4mta data',
    'variable.selectValues':    'V\u00E4lj v\u00E4rden f\u00F6r att se fr\u00E5gan',
    'variable.selectValuesAll': 'V\u00E4lj v\u00E4rden f\u00F6r alla variabler',
    'variable.optional':        'Valfri variabel',
    'variable.required':        'M\u00E5ste v\u00E4ljas *',
    'variable.role.time':       'Tid',
    'variable.role.geo':        'Geografi',
    'variable.role.metric':     'M\u00E5tt',
    'variable.timeFormatHint':  'Format: {0}',
    'variable.categorization':  'Gruppering:',
    'variable.freeChoice':      'V\u00E4lj fritt bland alla v\u00E4rden',
    'variable.filterPlaceholder': 'Filtrera v\u00E4rden...',
    'variable.selected':        'Vald',
    'variable.ofTotal':         'av totalt',
    'variable.withoutTitle':    'Utan titel',
    'variable.withTitle':       'Med titel',
    'variable.truncated':       'Visar {0} av {1} v\u00E4rden. Anv\u00E4nd "V\u00E4lj alla" f\u00F6r att inkludera alla.',
    'variable.defaultSelection':        'Fyll i standardval',
    'variable.defaultSelectionTitle':   'Hämta tabellens rekommenderade standardurval. Ersätter de val du har gjort',
    'variable.defaultSelectionLoading': 'Hämtar standardval...',
    'variable.defaultSelectionEmpty': 'Inget standardval hittades',
    'variable.definitionLink': 'Definition',
    'variable.compactView':           'Kompakt vy',
    'variable.compactViewTitle':      'Visa dimensionerna i ett rutnät med flera kolumner som utnyttjar breda skärmar',

    'variable.btn.all':         'Alla (*)',
    'variable.btn.selectAll':   'V\u00E4lj alla',
    'variable.btn.deselectAll': 'Avmarkera alla',
    'variable.btn.last':        'Senaste',

    'codelist.error':    'Kunde inte ladda kodlista',
    'codelist.optional': 'Valfri variabel',
    'codelist.required': 'M\u00E5ste v\u00E4ljas *',

    'status.all':          'alla',
    'status.last':         'senaste ',
    'status.ready':        'Redo att h\u00E4mta data',
    'status.selectRequired': 'V\u00E4lj minst ett v\u00E4rde f\u00F6r alla obligatoriska variabler',
    'status.noValuesOpt':  'Inga v\u00E4rden valda (variabeln utesluts fr\u00E5n fr\u00E5gan)',
    'status.noValues':     'Inga v\u00E4rden valda',
    'status.allSelected':  'Alla v\u00E4rden valda',
    'status.topMode':      'senaste {0}',
    'status.tooManyCells': 'F\u00F6r m\u00E5nga celler valda \u2014 minska urvalet',
    'status.cellsSelected': '{0} {1} valda (av max {2} m\u00F6jliga)',
    'status.exceedsLimit': '\u2014 \u00F6verskrider API-gr\u00E4nsen p\u00E5 800\u202F000!',

    'api.builder':          'API-byggare',
    'api.method':           'Metod:',
    'api.format':           'Svarsformat:',
    'api.display':          'Visning:',
    'api.displayText':      'Text',
    'api.displayCodes':     'Koder',
    'api.displayBoth':      'Koder och text',
    'api.tableTitle':       'Tabelltitel:',
    'api.separator':        'Avgr\u00E4nsare:',
    'api.separatorSemicolon': 'Semikolon',
    'api.separatorTab':     'Tabulator',
    'api.separatorSpace':   'Mellanslag',
    'api.layout':           'Tabelllayout:',
    'api.layoutStandard':   'Standard',
    'api.layoutPivot':      'Pivotvänlig (alla i stubb)',
    'api.dataUrl':          'Data-URL',
    'api.showPlaintext':    'Visa i klartext',
    'api.decodedUrlTooltip': 'Visa URL med l\u00E4sbara tecken ist\u00E4llet f\u00F6r URL-kodning',
    'api.copyUrl':          'Kopiera URL',
    'api.openBrowser':      '\u00D6ppna i webbl\u00E4sare',
    'api.openNewTab':       '\u00D6ppna i ny flik',
    'api.copied':           'Kopierat!',
    'api.postBody':         'POST-body (JSON)',
    'api.copyBody':         'Kopiera body',
    'api.metadataUrl':      'Metadata-URL',
    'api.copyMetadataUrl':  'Kopiera metadata-URL',
    'api.openMetadata':     '\u00D6ppna metadata i ny flik',
    'api.urlTooLong':       'URL:en \u00E4r {0} tecken \u2014 \u00F6verskrider gr\u00E4nsen p\u00E5 {1} tecken. Anv\u00E4nd POST-l\u00E4ge f\u00F6r stora urval.',
    'api.getOnlyFeature':   'Endast tillg\u00E4nglig i GET-l\u00E4ge',

    'table.rotate':        '\u21BB Rotera tabell',
    'table.download':      '\u2B07 Ladda ned i Excel-format',
    'table.moreOptions':   'Fler alternativ',
    'table.getLink':       '\uD83D\uDD17 F\u00E5 l\u00E4nk',
    'table.notAvailable':  'Inte tillg\u00E4nglig',
    'table.confidential':  'Konfidentiellt',
    'table.notApplicable': 'Inte till\u00E4mpligt',
    'table.notYetAvailable': 'Uppgift saknas tills vidare',
    'table.nil':          'Noll',
    'table.preliminary':  'Prelimin\u00E4r siffra',

    // Tabellinfo (table-metadata.js)
    'metadata.title':       'Tabellinfo',
    'metadata.source':      'K\u00E4lla',
    'metadata.updated':     'Senast uppdaterad',
    'metadata.status':      'Status',
    'metadata.official':    'Officiell statistik',
    'metadata.about':       'Om statistiken',
    'metadata.notes':       'Anm\u00E4rkningar',
    'metadata.contact':     'Kontakt',
    'metadata.phone':       'tfn',
    'metadata.definitions': 'Klassifikationer och definitioner',

    // Chart view
    'chart.toggle':        '\uD83D\uDCC8 Visa som diagram',
    'chart.toggleTitle':   'Visa tidsserien som linjediagram',
    'chart.tooManyLines':  'Diagrammet har {0} linjer \u2014 \u00F6verv\u00E4g att begr\u00E4nsa urvalet f\u00F6r b\u00E4ttre l\u00E4sbarhet.',
    'chart.source':        'K\u00E4lla',
    'chart.tableWord':     'tabell',
    'chart.lastUpdated':   'Senast uppdaterad',
    'chart.series':        'Serie',
    'table.prefix':        'Tabell',
    'table.unnamed':       'Utan namn',

    'rotation.title':        'Rotera tabell',
    'rotation.instructions': 'Dra dimensioner mellan rader och kolumner f\u00F6r att \u00E4ndra tabellens layout. Du kan ocks\u00E5 fokusera en dimension med Tab och flytta den med piltangenterna.',
    'rotation.rows':         'Rader',
    'rotation.columns':      'Kolumner',
    'rotation.presets':      'Snabbval:',
    'rotation.standard':     'Standard',
    'rotation.transpose':    'Transponera',
    'rotation.allRows':      'Alla som rader',
    'rotation.allColumns':   'Alla som kolumner',
    'rotation.apply':        'Till\u00E4mpa layout',
    'rotation.cancel':       'Avbryt',
    'rotation.dropHere':     'Dra dimensioner hit',
    'rotation.values':       'v\u00E4rden',
    'rotation.allRequired':  'Alla dimensioner m\u00E5ste vara antingen i rader eller kolumner',
    'rotation.minOne':       'Tabellen m\u00E5ste ha minst en dimension',

    // Save query dialog ("Fa lank")
    'saveQuery.noActive':       'Ingen aktiv fr\u00E5ga att spara',
    'saveQuery.title':          'F\u00E5 l\u00E4nk till fr\u00E5gan',
    'saveQuery.saving':         'Sparar fr\u00E5gan hos {0}...',
    'saveQuery.saved':          'Fr\u00E5gan har sparats. Anv\u00E4nd l\u00E4nkarna nedan f\u00F6r att dela eller \u00F6ppna den igen.',
    'saveQuery.portalLabel':    '\u00D6ppna i {0}:',
    'saveQuery.sourceLabel':    '\u00D6ppna i {0}:s statistikdatabas:',
    'saveQuery.openSource':     '\u00D6ppna i {0}:s statistikdatabas',
    'saveQuery.copy':           'Kopiera',
    'saveQuery.noIdInResponse': 'Inget ID i svar fr\u00E5n API',
    'saveQuery.failed':         'Kunde inte spara fr\u00E5gan: {0}',

    // Saved query loading (#sq/ route)
    'sq.loadFailed': 'Kunde inte ladda fr\u00E5gan ({0}): {1}',
    'sq.goHome':     'G\u00E5 till startsidan',

    'export.title':           'Ladda ned tabell',
    'export.format':          'Filformat:',
    'export.formatExcel':     'Excel (xlsx)',
    'export.formatCsv':       'CSV (semikolon-separerad textfil)',
    'export.formatPx':        'PX (PC-Axis format)',
    'export.displayAs':       'Visa v\u00E4rden som:',
    'export.displayStandard': 'Standard',
    'export.displayText':     'Text (t.ex. "Oslo")',
    'export.displayCodes':    'Koder (t.ex. "0301")',
    'export.displayBoth':     'B\u00E5de koder och text (t.ex. "0301: Oslo")',
    'export.csvSeparator':    'CSV-avgr\u00E4nsare:',
    'export.sepSemicolon':    'Semikolon (;) \u2013 Standard f\u00F6r nordisk Excel',
    'export.sepTab':          'Tabulator',
    'export.sepSpace':        'Mellanslag',
    'export.layout':          'Tabelloppsett:',
    'export.layoutAsShown':   'Som visat p\u00E5 sk\u00E4rmen (heading: {0})',
    'export.layoutPivot':     'Pivotvänlig (alla variabler i stub, lättare att pivotera i Excel)',
    'export.includeTitle':    'Inkludera tabelltitel',
    'export.downloadInfo':    'Filen laddas ned direkt fr\u00E5n {0}:s API.',
    'export.dataPoints':      'Tabellen inneh\u00E5ller {0} datapunkter.',
    'export.cancel':          'Avbryt',
    'export.download':        'Ladda ned',

    // Footer
    'footer.dataFrom':    'Data fr\u00E5n',

    // Cache
    'cache.clear':        'Rensa cache',
    'cache.clearTooltip': 'Rensa cache och ladda om data',

    // Search
    'search.found': 'hittade',

    'lang.label': 'Spr\u00E5k'
  }
};

// ---------------------------------------------------------------------------
// Language management
// ---------------------------------------------------------------------------

function _initLanguage() {
  const stored = localStorage.getItem('lang');
  const available = (AppConfig.languages || []).map(l => l.code);
  if (stored && available.includes(stored)) return stored;
  return AppConfig.defaultLanguage || 'nb';
}

let currentLanguage = _initLanguage();

/**
 * Look up a UI string by key. Falls back to 'nb' then the key itself.
 */
function t(key) {
  return translations[currentLanguage]?.[key]
    ?? translations['nb']?.[key]
    ?? key;
}

/**
 * Look up a UI string and replace {0}, {1}, … placeholders with args.
 */
function tpl(key, ...args) {
  let s = t(key);
  args.forEach((arg, i) => { s = s.replace(`{${i}}`, arg); });
  return s;
}

/**
 * The active language's value of an instance setting that is either a
 * { nb, en, … } object or a plain value (AppConfig.app.tagline,
 * AppConfig.source.tableChangesUrl). Falls back to nb, then ''.
 */
function localized(value) {
  if (value && typeof value === 'object') return value[currentLanguage] ?? value.nb ?? '';
  return value ?? '';
}

/**
 * Returns the API lang= parameter for the current UI language.
 */
function getCurrentApiLang() {
  return (AppConfig.languages || []).find(l => l.code === currentLanguage)?.apiLang ?? 'no';
}

/**
 * Switch the UI language, persist to localStorage, clear language-sensitive
 * metadata cache, and re-render the current view.
 */
function setLanguage(code) {
  const lang = (AppConfig.languages || []).find(l => l.code === code);
  if (!lang) return;
  currentLanguage = code;
  window.currentLanguage = code;
  localStorage.setItem('lang', code);
  // All cached data (table list, metadata, codelists) is language-sensitive.
  // Clear the entire cache so everything is re-fetched in the new language.
  if (typeof api !== 'undefined' && typeof api.clearCache === 'function') {
    api.clearCache();
  }
  // Reset BrowserState so the table list is re-fetched
  if (typeof BrowserState !== 'undefined' && typeof BrowserState.reset === 'function') {
    BrowserState.reset();
  }
  if (typeof renderCurrentView === 'function') renderCurrentView();
}

window.t = t;
window.tpl = tpl;
window.localized = localized;
window.getCurrentApiLang = getCurrentApiLang;
window.setLanguage = setLanguage;
window.currentLanguage = currentLanguage;
