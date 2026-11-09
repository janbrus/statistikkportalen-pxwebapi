/**
 * Variable Selection — Module State
 *
 * Shared mutable state used across all variable-select-*.js modules.
 * Must be loaded first in the variable-select file group.
 */

/**
 * Variable-select state, shared between all variable-select-*.js files.
 *
 * Fields:
 *   tableMetadata       — Full JSON-Stat2 metadata for the current table
 *   activeCodelists     — { DimCode: null | {
 *                            codelistId, elimination, isAggregated,
 *                            values: Array<{code, label, valueMap}>,
 *                            originalCodes: Set<string>
 *                          } }
 *                          When a codelist is active, the value list is re-rendered from
 *                          codelist data so values appear in the codelist's order. The
 *                          codelist's own elimination may override the dimension's default.
 *   dimensionValueOrder — { DimCode: ["code1","code2",...] }
 *                          Pre-loaded value ordering from the first codelist. Used by
 *                          renderValueList() so "Velg fritt" values follow codelist order
 *                          (codelist codes first, remaining after).
 *   lastClickedIndex    — { DimCode: N } anchor for shift-click range selection
 *   committedSelection  — { DimCode: Set<N> } picks made by plain click, Ctrl/Cmd-click
 *                          or drag, i.e. everything outside the current shift range.
 *                          Displayed selection = committed ∪ current shift range.
 *                          Both selection fields are positions (data-index) in the value
 *                          list as rendered, so they are only valid for that list: reset
 *                          them with setListState() whenever a list is re-rendered.
 *   urlUpdateTimer      — debounce timer ID for debouncedURLUpdate()
 */
const VarSelect = {
  tableMetadata: null,
  activeCodelists: {},
  dimensionValueOrder: {},
  lastClickedIndex: {},
  committedSelection: {},
  urlUpdateTimer: null,

  /**
   * Clear all per-table state. Called before a new table's metadata is loaded,
   * so nothing from the previous table (metadata, codelists, shift-click
   * anchors, a pending URL update) carries over.
   */
  reset() {
    clearTimeout(this.urlUpdateTimer);
    this.urlUpdateTimer = null;
    this.tableMetadata = null;
    this.dimensionValueOrder = {};
    this.resetSelections();
  },

  /**
   * Clear the user's picks (active codelists and the shift-click model) but
   * keep the table: tableMetadata and dimensionValueOrder stay. Used when the
   * cards are rebuilt from metadata to replace the selection («Fyll inn
   * standardvalg»).
   */
  resetSelections() {
    this.activeCodelists = {};
    this.lastClickedIndex = {};
    this.committedSelection = {};
  },

  /**
   * Set the shift-click model of one value list to match what it shows.
   * [] clears it (the list was re-rendered or emptied); otherwise the given
   * positions count as committed picks and the last one becomes the anchor,
   * as if the user had clicked them.
   *
   * @param {string} dimCode - Dimension code
   * @param {number[]} indices - data-index of the selected items, in list order
   */
  setListState(dimCode, indices) {
    if (indices.length === 0) {
      delete this.lastClickedIndex[dimCode];
      delete this.committedSelection[dimCode];
      return;
    }
    this.committedSelection[dimCode] = new Set(indices);
    this.lastClickedIndex[dimCode] = indices[indices.length - 1];
  },

  /**
   * Debounced URL update — avoids excessive history entries by batching
   * selection changes within 500ms into one navigateTo call.
   */
  debouncedURLUpdate() {
    clearTimeout(this.urlUpdateTimer);

    this.urlUpdateTimer = setTimeout(() => {
      // Guards: the user may have navigated away during the debounce window.
      // Without these, the timer would rewrite whatever route they just landed
      // on (front page, search, another table) with this table's encoded state.
      if (AppState.currentView !== 'variables') return;
      if (!AppState.selectedTable) return;
      const metaTableId = VarSelect.tableMetadata?.extension?.px?.tableid;
      if (metaTableId && metaTableId !== AppState.selectedTable.id) return;

      const params = {};

      const selection = getVariableSelection();
      if (selection && Object.keys(selection).length > 0) {
        params.v = URLRouter.encode(selection);
      }

      if (Object.keys(AppState.activeCodelistIds).length > 0) {
        params.c = URLRouter.encode(AppState.activeCodelistIds);
      }

      URLRouter.navigateTo(
        `variables/${AppState.selectedTable.id}`,
        params,
        false  // replaceState — don't create history entries per selection change
      );
    }, 500);
  }
};

/**
 * Whether a dimension plays the time role in the current table.
 * Prefers the JSON-Stat2 role.time declaration; falls back to a name
 * heuristic for tables that omit role metadata.
 *
 * @param {string} dimCode - Dimension code
 * @returns {boolean}
 */
function isTimeDimension(dimCode) {
  if (VarSelect.tableMetadata?.role?.time?.length) {
    return VarSelect.tableMetadata.role.time.includes(dimCode);
  }
  return dimCode === 'Tid' || dimCode.toLowerCase().includes('tid');
}
