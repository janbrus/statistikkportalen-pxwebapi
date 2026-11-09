/**
 * Utility functions and global state management
 */

// ========== Loading Indicator ==========

function showLoading(show, message = t('loading.app')) {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.textContent = message;
    loader.style.display = show ? 'block' : 'none';
  }
}

// ========== Rate-limit wait notice ==========

const RATE_WAIT_NOTICE_MS = 2000;   // shorter waits look like ordinary loading
let _rateWaitUntil = null;
let _rateWaitTimer = null;

/**
 * Show or clear the notice that calls are waiting for the rate window
 * (api.js _claimRateSlots, the 'ratewait' event). It appears for a wait of at
 * least RATE_WAIT_NOTICE_MS, counts down to `until` and goes when no call
 * waits. #rate-wait-notice is a live region (role="status") that stays in the
 * page and is empty when nothing waits, so screen readers hear the message
 * when it is filled in; the countdown is aria-hidden, so they hear it once.
 *
 * @param {number|null} until - When the last waiting call should get its slot
 *   (ms since epoch), or null when none waits
 */
function updateRateWaitNotice(until) {
  const el = document.getElementById('rate-wait-notice');
  if (!el) return;
  const shown = el.firstChild !== null;
  if (until == null || (!shown && until - Date.now() < RATE_WAIT_NOTICE_MS)) {
    el.textContent = '';
    clearInterval(_rateWaitTimer);
    _rateWaitTimer = null;
    return;
  }
  _rateWaitUntil = until;
  if (!shown) {
    el.innerHTML = `${escapeHtml(tpl('loading.rateWait', AppConfig.source?.name ?? ''))} ` +
      '<span class="rate-wait-seconds" aria-hidden="true"></span>';
    _rateWaitTimer = setInterval(_tickRateWaitNotice, 1000);
  }
  _tickRateWaitNotice();
}

function _tickRateWaitNotice() {
  const seconds = document.querySelector('#rate-wait-notice .rate-wait-seconds');
  if (seconds) seconds.textContent = tpl('loading.rateWaitSeconds', Math.max(1, Math.ceil((_rateWaitUntil - Date.now()) / 1000)));
}

window.addEventListener('ratewait', (e) => updateRateWaitNotice(e.detail?.until ?? null));

// ========== Error Handling ==========

function showError(message, technicalError = null) {
  const errorDiv = document.getElementById('error-display');
  if (!errorDiv) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'error-message';

  const strong = document.createElement('strong');
  strong.textContent = t('error.prefix') + ' ';
  msgDiv.appendChild(strong);
  msgDiv.appendChild(document.createTextNode(message));

  const helpLink = _errorHelpLink(technicalError);
  if (helpLink) msgDiv.append(' ', helpLink);

  if (technicalError) {
    const btn = document.createElement('button');
    btn.textContent = t('error.details');
    btn.addEventListener('click', () => logger.log(window.lastError));
    msgDiv.appendChild(document.createTextNode(' '));
    msgDiv.appendChild(btn);

    window.lastError = technicalError;
    logger.error(message, technicalError);
  }

  errorDiv.innerHTML = '';
  errorDiv.appendChild(msgDiv);

  // Auto-hide after configured delay
  setTimeout(() => errorDiv.innerHTML = '', AppConfig.ui.errorAutoHideMs);
}

function clearError() {
  const errorDiv = document.getElementById('error-display');
  if (errorDiv) {
    errorDiv.innerHTML = '';
  }
}

/**
 * The help link an API error carries (error.helpUrl, set by
 * api._buildApiError() for a table that doesn't exist), or null.
 * @param {Error|null} error
 * @returns {HTMLAnchorElement|null}
 */
function _errorHelpLink(error) {
  if (!error?.helpUrl) return null;
  const link = document.createElement('a');
  link.href = error.helpUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('error.tableChangesLink');
  return link;
}

/**
 * Show an API error inside a view too, where it stays: the banner hides after
 * AppConfig.ui.errorAutoHideMs, and the view would otherwise keep its loading
 * text. For a table that doesn't exist, the heading and the tab title say so,
 * instead of the router's loading placeholder, and the view gets the class
 * table-not-found, which hides the controls that have nothing to act on (see
 * main.css). Does nothing when the container has left the page (the user has
 * moved on to another view).
 *
 * @param {HTMLElement|null} container - The view's content element to fill
 * @param {string} message
 * @param {Error|null} error - May carry helpUrl and tableNotFound
 */
function showViewError(container, message, error = null) {
  if (!container?.isConnected) return;
  const p = document.createElement('p');
  p.className = 'error-message';
  p.textContent = message;
  const helpLink = _errorHelpLink(error);
  if (helpLink) p.append(' ', helpLink);
  container.replaceChildren(p);

  if (error?.tableNotFound) {
    const view = container.closest('.view-container');
    view?.classList.add('table-not-found');
    const header = view?.querySelector('.view-header');
    const h2 = header?.querySelector('h2');
    if (h2) h2.textContent = t('error.tableNotFoundTitle');
    const crumb = header?.querySelector('.breadcrumb-current');
    if (crumb && AppState.selectedTable) crumb.textContent = AppState.selectedTable.id;
    updatePageTitle([t('error.tableNotFoundTitle')]);
  }
}

// ========== Safe API Call Wrapper ==========

/**
 * Run an API call with the loading indicator, and show its error on failure:
 * error.userMessage when the error has one (e.g. a table that doesn't exist),
 * otherwise errorMessage. Returns the result, or null on failure. A call
 * cancelled through renderGuard().signal (AbortError) returns null silently.
 *
 * @param {Function} apiFunction - Async function making the call
 * @param {string} errorMessage - Message for the error banner
 * @param {HTMLElement|null} [viewContainer] - Also show the error here, in
 *   place of the view's loading text (see showViewError)
 * @returns {Promise<*>}
 */
async function safeApiCall(apiFunction, errorMessage, viewContainer = null) {
  try {
    showLoading(true);
    clearError();
    const result = await apiFunction();
    showLoading(false);
    return result;
  } catch (error) {
    showLoading(false);
    // Cancelled because a newer render started (renderGuard().signal): nothing to report
    if (error?.name === 'AbortError') return null;
    const message = error?.userMessage || errorMessage;
    showError(message, error);
    showViewError(viewContainer, message, error);
    return null;
  }
}

// ========== Global Application State ==========

const AppState = {
  currentView: 'home', // 'home' | 'search' | 'topic' | 'variables' | 'table' | 'help'
  selectedTable: null,
  variableSelection: {},
  activeCodelistIds: {},
  tableData: null,
  tableLayout: { rows: [], columns: [] },
  topicPath: [], // Current topic navigation path (e.g., ['be', 'be02'])
  navigationRef: null, // Hash-path to navigate back to (e.g., 'topic/be/be02'), stored in sessionStorage

  setView(view) {
    this.currentView = view;
    this._updateHash(view);
    renderCurrentView();
  },

  setSelectedTable(table) {
    this.selectedTable = table;
    this.variableSelection = {};
    this.activeCodelistIds = {};
  },

  /**
   * Reset table-related state only (preserves browse state)
   */
  resetTableState() {
    this.selectedTable = null;
    this.variableSelection = {};
    this.activeCodelistIds = {};
    this.tableData = null;
    this.tableLayout = { rows: [], columns: [] };
    this.navigationRef = null;
    sessionStorage.removeItem('ssb_navRef');
  },

  /**
   * Full reset
   */
  reset() {
    this.resetTableState();
    this.topicPath = [];
  },

  /**
   * Update URL hash to reflect current view with encoded state parameters.
   * Only handles variables and table views.
   * Home/search/topic manage their own URLs.
   *
   * @param {string} view - View to encode ('variables' or 'table')
   * @param {boolean} shouldPush - false replaces the current history entry
   */
  _updateHash(view, shouldPush = true) {
    let route;
    const params = {};

    switch (view) {
      case 'variables':
        if (!this.selectedTable) return;

        route = `variables/${this.selectedTable.id}`;

        if (Object.keys(this.variableSelection).length > 0) {
          params.v = URLRouter.encode(this.variableSelection);
        }

        if (Object.keys(this.activeCodelistIds).length > 0) {
          params.c = URLRouter.encode(this.activeCodelistIds);
        }
        break;

      case 'table':
        if (!this.selectedTable) return;

        route = `table/${this.selectedTable.id}`;

        if (Object.keys(this.variableSelection).length > 0) {
          params.v = URLRouter.encode(this.variableSelection);
        }

        if (Object.keys(this.activeCodelistIds).length > 0) {
          params.c = URLRouter.encode(this.activeCodelistIds);
        }

        if (this.tableLayout && (this.tableLayout.rows.length > 0 || this.tableLayout.columns.length > 0)) {
          params.l = URLRouter.encode(this.tableLayout);
        }
        break;

      default:
        // Home/search/topic manage their own URLs
        return;
    }

    URLRouter.navigateTo(route, params, shouldPush);
  }
};

// ========== View Rendering Router ==========

// Counts renderCurrentView() calls; see renderGuard().
let _renderSeq = 0;
// Aborted and replaced by renderCurrentView(): renderGuard().signal of the
// render that is current
let _renderAbort = new AbortController();

/**
 * A check for async view code: the returned function tells whether the render
 * that was current when renderGuard() was called still is. Call it at the top
 * of a render function (before any await), and return after each await when
 * it says false. Otherwise a load that finishes after the user has moved on
 * draws over the newer view: a language switch reloads the table, the user
 * opens another one, and the reload lands last with the wrong table's data.
 *
 * The function also carries `.signal`, an AbortSignal that is aborted when
 * the next render starts. Pass it to an API call that is worth cancelling
 * (the uncached data download in loadTableData): the download stops, and a
 * call still waiting in the throttle is never sent. The check is still
 * needed after each await, since cached calls and BrowserState.init() don't
 * take the signal.
 *
 * @returns {function(): boolean} with a `signal` property
 */
function renderGuard() {
  const renderId = _renderSeq;
  const isCurrent = () => renderId === _renderSeq;
  isCurrent.signal = _renderAbort.signal;
  return isCurrent;
}

function renderCurrentView() {
  _renderSeq++;   // first, so every render request supersedes the earlier ones
  _renderAbort.abort();
  _renderAbort = new AbortController();

  const content = document.getElementById('content');
  if (!content) return;

  document.body.dataset.view = AppState.currentView;

  switch(AppState.currentView) {
    case 'home':
      updatePageTitle([]);
      renderFrontPage(content);
      break;
    case 'search':
      renderSearchView(content);
      break;
    case 'topic':
      renderTopicView(content);
      break;
    case 'variables':
      renderVariableSelection(content);
      break;
    case 'table':
      renderTableDisplay(content);
      break;
    case 'help':
      renderHelpView(content);
      break;
    default:
      content.innerHTML = '<p>' + t('error.unknownView') + '</p>';
  }
}

// ========== Hash Routing ==========

/**
 * Handle browser back/forward navigation via URL hash.
 *
 * Delegates to URLRouter for parsing and state restoration.
 * Hash formats:
 *   #home                                    -> front page
 *   #search?q=...&disc=1&subj=be&freq=...   -> search results
 *   #topic/be/be02?disc=1&freq=Monthly       -> topic navigation
 *   #variables/13760?v={enc}&c={enc}         -> variable selection
 *   #table/13760?v={enc}&c={enc}&l={enc}     -> table display
 */
function handleHashChange() {
  URLRouter.handleRoute();
}

// ========== Helper Functions ==========

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a number for display
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number
 */
function formatNumber(value, decimals = null) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return value.toString();
  }

  // ±Infinity slip past isNaN but produce the literal string "Infinity" via
  // toFixed, which would then leak into table cells. Treat them as the
  // missing-value sentinel like null/undefined above.
  if (!Number.isFinite(num)) {
    return '-';
  }

  // Auto-detect decimals if not specified: use the original precision
  if (decimals === null) {
    const str = String(value);
    const dotIndex = str.indexOf('.');
    decimals = dotIndex === -1 ? 0 : str.length - dotIndex - 1;
  }

  // Use Norwegian number formatting (space as thousands separator, comma as decimal)
  return num.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Generate a timestamp string for file names
 * @returns {string} - Timestamp in format YYYYMMDD_HHMMSS
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return year + month + day + '_' + hour + minute + second;
}

/**
 * Extract clean title from label (removes ID prefix like "13760: ")
 * @param {string} label - Table label
 * @returns {string} - Clean title
 */
function extractTableTitle(label) {
  if (!label) return t('table.unnamed');
  const match = label.match(/^\d+:\s*(.+)$/);
  return match ? match[1] : label;
}

/**
 * Update the browser tab title.
 * @param {string[]} parts - Title parts prepended before "Statistikkportalen"
 */
function updatePageTitle(parts) {
  document.title = [...parts, AppConfig.app?.name || 'Statistikkportalen'].join(' – ');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Register an Escape key handler that closes a dialog.
 * The handler removes itself when it fires. Call the returned function
 * to remove it early (e.g. when the dialog is closed by a button click).
 * @param {Function} closeFn - Function to call when Escape is pressed
 * @returns {Function} - Cleanup function to remove the listener
 */
function addEscapeHandler(closeFn) {
  const handler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handler);
      closeFn();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

// ========== Navigation Breadcrumb ==========

/**
 * Build breadcrumb HTML for variable-select and table-display views.
 * Shows the topic path that led to this table, plus the table itself as
 * the final (non-linked) crumb.
 *
 * - From topic navigation: uses the path recorded in AppState.navigationRef
 * - All other cases (search, direct URL, home): uses the table's first known
 *   path from BrowserState (requires BrowserState to be loaded first)
 *
 * Returns an empty string when no path context is available.
 *
 * @param {string} tableId    - Table ID (e.g. '09772')
 * @param {string} tableLabel - Human-readable table title (already extracted)
 * @returns {string} HTML string
 */
function buildNavigationBreadcrumb(tableId, tableLabel) {
  const mh = BrowserState && BrowserState.menuHierarchy;
  const ref = AppState.navigationRef;

  const tableCrumb = '<span class="breadcrumb-current">' +
    escapeHtml(tableId) + (tableLabel ? ' ' + escapeHtml(tableLabel) : '') +
    '</span>';

  function renderPathLinks(crumbs) {
    return crumbs.map((crumb, i) =>
      (i > 0 ? '<span class="breadcrumb-sep">/</span>' : '') +
      '<a href="#topic/' + crumb.path.join('/') + '" class="breadcrumb-link">' +
      escapeHtml(crumb.label) + '</a>'
    ).join('');
  }

  function wrapBreadcrumbs(innerHtml) {
    return '<div class="breadcrumbs">' + innerHtml +
      '<span class="breadcrumb-sep">/</span>' + tableCrumb + '</div>';
  }

  if (!mh) return '';

  // --- From topic navigation: use the exact path the user browsed ---
  if (ref && ref.startsWith('topic/')) {
    const pathStr = ref.replace('topic/', '').split('?')[0];
    const pathIds = pathStr.split('/').filter(p => p);
    if (pathIds.length > 0) {
      const crumbs = mh.getBreadcrumbs(pathIds);
      if (crumbs.length > 0) return wrapBreadcrumbs(renderPathLinks(crumbs));
    }
  }

  // --- All other cases: use table's first known path from BrowserState ---
  const tableObj = BrowserState.allTables.find(t => t.id === tableId);
  if (!tableObj || !tableObj.paths || tableObj.paths.length === 0) return '';
  const firstPathIds = tableObj.paths[0].map(p => p.id);
  const crumbs = mh.getBreadcrumbs(firstPathIds);
  if (crumbs.length === 0) return '';
  return wrapBreadcrumbs(renderPathLinks(crumbs));
}

/**
 * Detect if text is a saved-query URL and return the query ID.
 * Handles:
 *   https://www.ssb.no/statbank/sq/{id}          (SSB direct saved-query link)
 *   https://www.ssb.no/statbank/table/{id}?sq=N  (SSB table link with sq param)
 *   {any URL}?sq={id}                             (generic sq query param)
 *   {any URL}#sq/{id}                             (statistikkportalen deep-link)
 *
 * @param {string} text
 * @returns {string|null} - Numeric query ID, or null if not recognised
 */
function detectSavedQueryId(text) {
  if (!text) return null;
  const t = text.trim();
  // /statbank/sq/{id} path
  const pathMatch = t.match(/\/statbank\/sq\/(\d+)/);
  if (pathMatch) return pathMatch[1];
  // ?sq={id} or &sq={id} query parameter
  const paramMatch = t.match(/[?&]sq=(\d+)/);
  if (paramMatch) return paramMatch[1];
  // #sq/{id} hash (statistikkportalen deep-link)
  const hashMatch = t.match(/#sq\/(\d+)/);
  if (hashMatch) return hashMatch[1];
  return null;
}
