/**
 * SSBApi - Wrapper for Statistics Norway PxWebApi v2
 *
 * Handles all communication with the SSB API including caching.
 * Base URL: https://data.ssb.no/api/pxwebapi/v2/
 *
 * Rate limit: SSB allows 40 calls per 60 s (the x-ratelimit-policy response
 * header, 40;w=60s; SSB's user guide says 30 per minute, and the header is
 * the current value). SSB's /config says maxCallsPerTimeWindow 0, and the
 * browser can't read the header (it isn't exposed through CORS), so the limit
 * is set in AppConfig.limits.rateLimit; /config wins when it states one (SCB:
 * 30 per 10 s). _throttledFetch keeps the app within half of it
 * (rateLimitShare), with each slot held 1 s longer than the window
 * (_rateMarginMs), and at least 100ms apart. A 429 shows t('error.rateLimit').
 */
/**
 * Whether a codelist ID is an aggregation codelist (agg_*) vs. a valueset (vs_*).
 * Queries send outputValues=aggregated for these, as the PxWebApi spec
 * describes. At SSB it has no effect: the codelist alone decides the sums
 * (same data with aggregated, single or no outputValues), so it is harmless,
 * not required.
 */
function isAggregationCodelistId(codelistId) {
  return typeof codelistId === 'string' && codelistId.toLowerCase().startsWith('agg_');
}

/**
 * How many HTTP requests a fetch() costs the source: 2 when the browser must
 * send a CORS preflight (OPTIONS) first, otherwise 1. A POST with a JSON body
 * needs one, and SSB counts the preflight against its limit too (checked
 * 2026-11-09: x-ratelimit-remaining drops for an OPTIONS, and there is no
 * Access-Control-Max-Age, so the browser rarely reuses one). The GETs here
 * only send safelisted headers (Accept, Accept-Language) and cost 1.
 *
 * @param {object} options - fetch() options
 * @returns {number}
 */
function _corsRequestCount(options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const type = String(options.headers?.['Content-Type'] || '').split(';')[0].trim().toLowerCase();
  const simple = method === 'GET' || method === 'HEAD' || (method === 'POST' &&
    ['', 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data'].includes(type));
  return simple ? 1 : 2;
}

/**
 * Wait ms milliseconds; resolves early when signal aborts.
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function _sleep(ms, signal) {
  return new Promise(resolve => {
    if (signal?.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', done, { once: true });
  });
}

class SSBApi {
  constructor() {
    this.baseUrl = AppConfig.apiBaseUrl;
    this.cache = new CacheManager();
    this._lastRequestTime = 0;
    // Send times of the calls inside the rate window, shared by every tab of
    // the app (same origin) through localStorage, so the budget holds for the
    // browser as a whole: SSB counts calls per client, not per tab. Not
    // ssb_-prefixed, so clearing the cache keeps it. Per API host, in case two
    // instances share an origin. _callTimes is the in-memory copy, and the
    // window itself when localStorage is unavailable.
    this._rateKey = 'rateWindow:' + (() => { try { return new URL(this.baseUrl).host; } catch { return this.baseUrl; } })();
    this._callTimes = [];
    // A slot stays in the window this much longer than the source's own window:
    // a request reaches the source a little after its slot is taken (a JSON POST
    // only after its preflight's round trip), so the source can see two requests
    // closer together than their slots were.
    this._rateMarginMs = 1000;
    // Calls in this tab waiting for a slot, each { until: ms since epoch }
    // (_announceRateWait tells the page; utils.js shows the notice)
    this._rateWaiters = new Set();
    // Promise chain that serialises the throttle bookkeeping across
    // concurrent _throttledFetch callers in this tab — see the method below.
    this._fetchChain = null;
  }

  /** The shared rate window: send times, oldest first. */
  _readRateWindow() {
    try {
      const stored = JSON.parse(localStorage.getItem(this._rateKey));
      if (Array.isArray(stored)) this._callTimes = stored;
    } catch (e) {
      // No localStorage (or unreadable): keep the in-memory window
    }
    return this._callTimes;
  }

  /** @param {number[]} times - Send times to store as the shared window */
  _writeRateWindow(times) {
    this._callTimes = times;
    try {
      localStorage.setItem(this._rateKey, JSON.stringify(times));
    } catch (e) {
      // No localStorage: the window stays in memory, for this tab only
    }
  }

  /**
   * Claim `cost` slots in the shared rate window, waiting while it is full.
   * The read-check-write runs under a Web Lock, so two tabs can't take the
   * same slot; the lock is released while waiting.
   *
   * @param {number} cost - Requests this call sends (_corsRequestCount)
   * @param {{calls: number, windowMs: number}} budget
   * @param {AbortSignal} [signal]
   * @returns {Promise<boolean>} - false when aborted while waiting (no slot used)
   */
  async _claimRateSlots(cost, budget, signal) {
    const tryClaim = () => {
      const now = Date.now();
      const held = budget.windowMs + this._rateMarginMs;   // how long a slot stays taken
      const times = this._readRateWindow().filter(time => now - time < held);
      if (times.length + cost <= budget.calls) {
        for (let i = 0; i < cost; i++) times.push(now);
        this._writeRateWindow(times);
        return 0;
      }
      this._writeRateWindow(times);
      return Math.max(1, times[0] + held - now);   // ms until a slot frees
    };
    const waiter = {};   // this call's entry in _rateWaiters while it waits
    try {
      while (!signal?.aborted) {
        const wait = navigator.locks?.request
          ? await navigator.locks.request(this._rateKey, tryClaim)
          : tryClaim();
        if (wait === 0) return true;
        waiter.until = Date.now() + wait;
        this._rateWaiters.add(waiter);
        this._announceRateWait();
        await _sleep(wait, signal);
      }
      return false;
    } finally {
      if (this._rateWaiters.delete(waiter)) this._announceRateWait();   // got its slot, or aborted
    }
  }

  /**
   * Tell the page whether calls are waiting for the rate window: a 'ratewait'
   * event on window, with detail.until = when the last waiting call should get
   * its slot (ms since epoch; an estimate, since other tabs share the window),
   * or null when none waits. utils.js turns it into the notice.
   */
  _announceRateWait() {
    const until = this._rateWaiters.size ? Math.max(...[...this._rateWaiters].map(w => w.until)) : null;
    window.dispatchEvent(new CustomEvent('ratewait', { detail: { until } }));
  }

  /**
   * The share of the source's rate limit the app may use: rateLimit.calls ×
   * rateLimitShare (AppConfig.limits; 0.5, so half), at least 1 call.
   * SSB: 40 per 60 s → 20 per 60 s. SCB: 30 per 10 s → 15 per 10 s.
   *
   * @returns {{calls: number, windowMs: number}|null} - null when no limit is set
   */
  _rateBudget() {
    const limit = AppConfig.limits?.rateLimit;
    if (!limit?.calls || !limit?.windowMs) return null;
    const share = AppConfig.limits.rateLimitShare ?? 1;
    return { calls: Math.max(1, Math.floor(limit.calls * share)), windowMs: limit.windowMs };
  }

  /** Returns the current API language code (e.g. 'no', 'en', 'sv'). */
  get defaultLang() {
    return typeof getCurrentApiLang === 'function' ? getCurrentApiLang() : 'no';
  }

  /**
   * Throttled fetch. Keeps at least 100ms between requests, and keeps the
   * calls within the rate budget (_rateBudget(): half of the source's limit):
   * when the window is full, the next call waits until the oldest one has left
   * it. Only calls that go to the network count; cache hits never get here. A
   * POST with JSON takes two slots, for its CORS preflight (_corsRequestCount).
   * The window is shared by all tabs (_claimRateSlots), so two tabs together
   * stay within the budget.
   *
   * Concurrency note: within a tab, the bookkeeping (gap, window, stamp) is
   * serialised through _fetchChain so two concurrent callers can't both claim
   * the same slot; across tabs, a Web Lock does the same. The fetch() itself
   * is NOT serialised — once a caller has claimed its slot, the next caller
   * can claim its own and fetch in parallel.
   *
   * options.signal (an AbortSignal) is passed on to fetch(). A call aborted
   * while it waits stops waiting at once, uses no slot, throws AbortError and
   * is never sent.
   */
  async _throttledFetch(url, options = {}) {
    const { signal } = options;
    const slot = (this._fetchChain || Promise.resolve()).then(async () => {
      const gap = Math.max(0, 100 - (Date.now() - this._lastRequestTime));
      if (gap) await _sleep(gap, signal);
      const budget = this._rateBudget();
      if (budget) {
        const cost = Math.min(_corsRequestCount(options), budget.calls);
        if (!await this._claimRateSlots(cost, budget, signal)) return;   // aborted: no slot used
      } else if (signal?.aborted) {
        return;
      }
      this._lastRequestTime = Date.now();
    });
    this._fetchChain = slot;
    await slot;
    signal?.throwIfAborted();
    return fetch(url, options);
  }

  /**
   * Build the cache key for a tables-list request. Centralised so getAllTables
   * and getTables can never drift on key shape — and so any future param
   * (filters, server-side sorts, etc.) lands in one place.
   *
   * Uses '|' as a delimiter — encodeURIComponent on the query escapes any
   * literal '|' to '%7C', so query strings can no longer collide with
   * adjacent fields (e.g. a query containing '_pd_5' no longer collides
   * with pastDays=5 the way the old underscored key did).
   */
  _buildTableListCacheKey({ lang, includeDiscontinued, pageSize, pageNumber = 1, query = '', pastDays = null }) {
    return 'tables|' + [
      lang,
      includeDiscontinued,
      pageSize,
      pageNumber > 1 ? pageNumber : '',
      query ? encodeURIComponent(query) : '',
      pastDays != null ? pastDays : ''
    ].join('|');
  }

  /**
   * Parse an error response and throw with a descriptive message.
   * SSB returns RFC 7807 Problem Detail JSON with a `detail` field
   * that contains specific, actionable error descriptions.
   *
   * @param {Response} response - The failed fetch response
   * @throws {Error} - The error from _buildApiError()
   */
  async _handleErrorResponse(response) {
    let body = null;
    if (response.status !== 429) {
      try {
        body = await response.json();
      } catch (e) {
        // Response wasn't JSON — _buildApiError falls back to a generic message
      }
    }
    throw this._buildApiError(response.status, response.statusText, body);
  }

  /**
   * Build the Error for a failed API response. Pure and synchronous, so
   * test.html can check it.
   * - 429 → t('error.rateLimit')
   * - otherwise the RFC 7807 `detail` or `title`, falling back to
   *   t('error.cellLimit') for 403 and "HTTP {status}: {statusText}"
   * - title "Non-existent table" (404 from /tables and /metadata, 400 from
   *   /data, the same for a removed table and a number that never existed)
   *   also sets tableNotFound, a translated userMessage that safeApiCall()
   *   shows, and helpUrl, the source's page of changed and removed tables
   *
   * @param {number} status - HTTP status
   * @param {string} statusText - HTTP status text
   * @param {object|null} body - Parsed JSON body, null if there was none
   * @returns {Error}
   */
  _buildApiError(status, statusText, body) {
    if (status === 429) return new Error(t('error.rateLimit'));

    const detail = body?.detail || body?.title || '';
    const error = new Error(detail ||
      (status === 403 ? t('error.cellLimit') : 'HTTP ' + status + ': ' + statusText));

    if (body?.title === 'Non-existent table') {
      error.tableNotFound = true;
      error.userMessage = t('error.tableNotFound');
      error.helpUrl = localized(AppConfig.source?.tableChangesUrl) || null;
    }
    return error;
  }

  /**
   * Fetch all tables across all pages and return a merged result.
   * Uses the same cache key as getTables() so cached results are shared.
   *
   * @param {object} options - Same options as getTables() (query, lang, includeDiscontinued, pastDays, useCache)
   * @returns {Promise<object>} - { tables: [...all tables] }
   */
  async getAllTables(options = {}) {
    const {
      query = '',
      includeDiscontinued = true,
      lang = null,
      pastDays = null,
      useCache = true
    } = options;
    const resolvedLang = lang || (typeof getCurrentApiLang === 'function' ? getCurrentApiLang() : 'no');
    const pageSize = AppConfig.limits.tablePageBatchSize || 10000;

    // Check cache first (same key as getTables would use for a single-page list).
    const cacheKey = this._buildTableListCacheKey({
      lang: resolvedLang, includeDiscontinued, pageSize, query, pastDays
    });
    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.log('[API] Using cached table list (' + (cached.tables ? cached.tables.length : 0) + ' tables)');
        return cached;
      }
    }

    // Fetch first page
    const firstPage = await this.getTables({ query, includeDiscontinued, lang: resolvedLang, pageSize, pastDays, useCache: false });
    const allTables = firstPage.tables ? [...firstPage.tables] : [];
    const totalPages = firstPage.page ? firstPage.page.totalPages : 1;

    logger.log('[API] Tables: page 1/' + totalPages + ', got ' + allTables.length + ' tables');

    // Fetch remaining pages if needed
    if (totalPages > 1) {
      for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {
        try {
          const pageResult = await this.getTables({
            query, includeDiscontinued, lang: resolvedLang, pageSize, pastDays, useCache: false,
            pageNumber
          });
          const batch = pageResult.tables || [];
          allTables.push(...batch);
          logger.log('[API] Tables: page ' + pageNumber + '/' + totalPages + ', got ' + batch.length + ' tables (total so far: ' + allTables.length + ')');
        } catch (error) {
          logger.error('[API] Pagination failed at page ' + pageNumber + '/' + totalPages +
                       ' (' + allTables.length + ' tables fetched before failure)');
          throw error;
        }
      }
    }

    // Include a synthetic page field so the merged blob is shape-compatible
    // with a single-page getTables() response — callers that cache-hit this
    // entry won't crash reading `.page.totalPages`.
    const result = {
      tables: allTables,
      page: { pageNumber: 1, totalPages: 1, pageSize: allTables.length }
    };
    await this.cache.set(cacheKey, result, AppConfig.cache.tableListTTL);
    logger.log('[API] Fetched all ' + allTables.length + ' tables across ' + totalPages + ' page(s)');
    return result;
  }

  /**
   * Get list of tables with optional search/filtering.
   * Results are cached for 24 hours (tableListTTL).
   *
   * @param {object} options - Search options
   * @param {string} options.query - Search query (searches titles, variables, values)
   * @param {boolean} options.includeDiscontinued - Include discontinued tables (default: true)
   * @param {string} options.lang - Language code (default: 'no')
   * @param {number} options.pageSize - Page size (default: tablePageBatchSize)
   * @param {number} options.pageNumber - Page number to fetch (default: 1)
   * @param {number} options.pastDays - Only include tables updated within this many days
   * @param {boolean} options.useCache - Whether to use cached data (default: true)
   * @returns {Promise<object>} - Table list response (single page)
   */
  async getTables(options = {}) {
    const {
      query = '',
      includeDiscontinued = true,
      lang = null,
      pageSize = AppConfig.limits.tablePageBatchSize || 10000,
      pageNumber = 1,
      pastDays = null,
      useCache = true
    } = options;
    const resolvedLang = lang || (typeof getCurrentApiLang === 'function' ? getCurrentApiLang() : 'no');

    // Build cache key from all parameters that affect the result.
    // pageNumber is included so that page-level entries don't collide;
    // getAllTables() bypasses per-page caching (useCache: false) and caches
    // only the final merged result under the page-1 key.
    const cacheKey = this._buildTableListCacheKey({
      lang: resolvedLang, includeDiscontinued, pageSize, pageNumber, query, pastDays
    });

    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.log('[API] Using cached table list (' + (cached.tables ? cached.tables.length : 0) + ' tables)');
        return cached;
      }
    }

    try {
      // Build URL with parameters
      const params = new URLSearchParams({
        lang: resolvedLang,
        pageSize: pageSize.toString(),
        includeDiscontinued: includeDiscontinued.toString()
      });

      // Add query if provided
      if (query && query.trim()) {
        params.append('query', query.trim());
      }

      // Filter by recent updates (pastDays=0 means "today only" — explicit null check).
      if (pastDays != null) {
        params.append('pastDays', pastDays.toString());
      }

      // Page number (1-indexed; omit for page 1 to keep URLs clean)
      if (pageNumber > 1) {
        params.append('pageNumber', pageNumber.toString());
      }

      const url = this.baseUrl + '/tables?' + params.toString();
      logger.log('[API] Fetching tables:', url);

      const response = await this._throttledFetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': resolvedLang
        }
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      const data = await response.json();
      logger.log('[API] Fetched ' + (data.tables ? data.tables.length : 0) + ' tables');

      // Cache the result
      await this.cache.set(cacheKey, data, AppConfig.cache.tableListTTL);

      return data;
    } catch (error) {
      logger.error('[API] Failed to fetch tables:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a specific table
   * @param {string} tableId - Table ID (e.g., "13760")
   * @param {boolean} useCache - Whether to use cached data
   * @param {string} lang - Language code (no/en)
   * @returns {Promise<object>} - Table metadata (JSON-Stat2 format)
   */
  async getTableMetadata(tableId, useCache = true, lang = this.defaultLang) {
    const cacheKey = 'table_' + tableId + '_' + lang;

    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = this.baseUrl + '/tables/' + tableId + '/metadata?lang=' + lang;
      logger.log('[API] Fetching metadata for table ' + tableId + ':', url);

      const response = await this._throttledFetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': lang
        }
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      const data = await response.json();
      logger.log('[API] Fetched metadata for table ' + tableId);

      // Cache for 7 days
      await this.cache.set(cacheKey, data, AppConfig.cache.metadataTTL);

      return data;
    } catch (error) {
      logger.error('[API] Failed to fetch metadata for table ' + tableId + ':', error);
      throw error;
    }
  }

  /**
   * Build POST request body from a valueCodes object.
   * Converts { Kjonn: ["0","1"], Tid: "top(3)" } to the POST JSON format:
   * { selection: [{ variableCode: "Kjonn", valueCodes: ["0","1"] }, ...] }
   *
   * @param {object} valueCodes - Dimension filters
   * @returns {object} - POST body object
   */
  buildPostBody(valueCodes, options = {}) {
    const codelistIds = options.codelistIds || {};

    const selection = Object.keys(valueCodes).map(dimension => {
      const values = valueCodes[dimension];
      const valueCodesArray = Array.isArray(values) ? values : [values];
      const entry = { variableCode: dimension, valueCodes: valueCodesArray };
      // Include codelist ID when a codelist is active for this dimension
      if (codelistIds[dimension]) {
        entry.codelist = codelistIds[dimension];
        // outputValues=aggregated for aggregation codelists (agg_*), as the
        // spec describes. Harmless but not load-bearing at SSB, where the
        // codelist decides the sums (see isAggregationCodelistId).
        if (isAggregationCodelistId(codelistIds[dimension])) {
          entry.outputValues = 'aggregated';
        }
      }
      return entry;
    });
    const body = { selection };

    // Add placement (stub/heading) if provided
    if (options.stub || options.heading) {
      body.placement = {};
      if (options.heading && options.heading.length > 0) body.placement.heading = options.heading;
      if (options.stub && options.stub.length > 0) body.placement.stub = options.stub;
    }

    return body;
  }

  /**
   * Get data for a specific table with dimension filters.
   * Uses POST to avoid URL length limits with large selections.
   *
   * Dimensions omitted from valueCodes are "eliminated" by the API —
   * the server aggregates across all values for that dimension.
   * Only dimensions with extension.elimination=true can be omitted.
   *
   * @param {string} tableId - Table ID (e.g., "13760")
   * @param {object} valueCodes - Dimension filters, e.g., { Kjonn: "0", Tid: "top(3)" }
   *   Supports: array of codes, "*" (all), "top(N)" (last N values)
   * @param {string} lang - Language code (no/en)
   * @param {object} codelistIds - Active codelist IDs per dimension (optional)
   * @param {object} [options]
   * @param {AbortSignal} [options.signal] - Cancels the request (renderGuard().signal)
   * @returns {Promise<object>} - Table data (JSON-Stat2 format)
   */
  async getTableData(tableId, valueCodes, lang = this.defaultLang, codelistIds = {}, { signal } = {}) {
    try {
      const url = this.baseUrl + '/tables/' + tableId + '/data?lang=' + lang;
      const body = this.buildPostBody(valueCodes, { codelistIds });

      logger.log('[API] Fetching data (POST) for table ' + tableId);
      logger.log('[API] POST body:', body);

      const response = await this._throttledFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': lang
        },
        body: JSON.stringify(body),
        signal
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      const data = await response.json();
      logger.log('[API] Fetched data for table ' + tableId);
      logger.log('[API] Data dimensions:', data.id);
      logger.log('[API] Data size:', data.size);
      logger.log('[API] Value count:', data.value ? data.value.length : 0);

      return data;
    } catch (error) {
      if (error?.name !== 'AbortError') logger.error('[API] Failed to fetch data for table ' + tableId + ':', error);
      throw error;
    }
  }

  /**
   * Fetch a codelist (valueset) from the API.
   *
   * Codelists define alternative groupings for a dimension's values.
   * For example, "Investeringsart" may have an aggregated and detailed codelist,
   * each containing a different subset of the dimension's value codes.
   *
   * Response format:
   *   { id, label, elimination, eliminationValueCode, type: "Valueset",
   *     values: [{ code, label, valueMap }, ...] }
   *
   * @param {string} codelistId - Codelist ID (e.g., "vs_NRInvArtAgg3")
   * @param {boolean} useCache - Whether to use cached data (default: true)
   * @param {string} lang - Language code (default: 'no')
   * @returns {Promise<object>} - Codelist data
   */
  async getCodeList(codelistId, useCache = true, lang = this.defaultLang) {
    const cacheKey = 'codelist_' + codelistId + '_' + lang;

    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = this.baseUrl + '/codeLists/' + codelistId + '?lang=' + lang;
      logger.log('[API] Fetching codelist ' + codelistId + ':', url);

      const response = await this._throttledFetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': lang
        }
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      const data = await response.json();
      logger.log('[API] Fetched codelist ' + codelistId + ': ' + (data.values ? data.values.length : 0) + ' values');

      // Cache for 7 days (same TTL as metadata)
      await this.cache.set(cacheKey, data, AppConfig.cache.codelistTTL);

      return data;
    } catch (error) {
      logger.error('[API] Failed to fetch codelist ' + codelistId + ':', error);
      throw error;
    }
  }

  /**
   * Trigger download of table data in specified format.
   * Downloads the file as a blob and saves it with a custom filename.
   *
   * @param {string} tableId - Table ID
   * @param {object} valueCodes - Dimension filters
   * @param {object} options - Export options
   * @param {string} options.format - Output format: 'csv', 'xlsx', 'px', 'html'
   * @param {string[]} options.stub - Dimensions to place in stub (rows)
   * @param {string[]} options.heading - Dimensions to place in heading (columns)
   * @param {string[]} options.formatParams - Output format parameters (e.g., 'IncludeTitle', 'UseTexts')
   * @param {string} options.lang - Language code (default: 'no')
   * @returns {Promise<void>}
   */
  async downloadTableData(tableId, valueCodes, options) {
    const format = options.format || 'csv';
    const lang = options.lang || this.defaultLang;

    const postParams = new URLSearchParams({ lang: lang });
    postParams.append('outputFormat', format);
    if (options.formatParams && options.formatParams.length > 0) {
      postParams.append('outputFormatParams', options.formatParams.join(','));
    }
    const postUrl = this.baseUrl + '/tables/' + tableId + '/data?' + postParams.toString();
    const body = this.buildPostBody(valueCodes, {
      stub: options.stub,
      heading: options.heading,
      codelistIds: options.codelistIds || {}
    });

    logger.log('[API] Downloading via POST:', postUrl);

    try {
      const response = await this._throttledFetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      const blob = await response.blob();

      // Generate custom filename: tablenum_yyyymmdd-hhmmss.format
      const timestamp = getTimestamp().replace('_', '-');
      const filename = tableId + '_' + timestamp + '.' + format;

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      logger.log('[API] Download complete:', filename);
    } catch (error) {
      logger.error('[API] Download failed:', error);
      throw error;
    }
  }

  /**
   * Save current query to SSB's saved queries service.
   *
   * @param {string} tableId - Table ID
   * @param {object} valueCodes - Dimension filters (same format as getTableData)
   * @param {object} options - { stub, heading, codelistIds, lang }
   * @returns {Promise<object>} - Response with id and savedQuery fields
   */
  async saveSavedQuery(tableId, valueCodes, options = {}) {
    const body = {
      id: '',
      tableId: tableId,
      outputFormat: 'json-stat2',
      outputFormatParams: [],
      selection: this.buildPostBody(valueCodes, {
        stub: options.stub,
        heading: options.heading,
        codelistIds: options.codelistIds || {}
      }),
      language: options.lang || (typeof getCurrentApiLang === 'function' ? getCurrentApiLang() : 'no')
    };

    const url = this.baseUrl + '/savedqueries';
    logger.log('[API] Saving query for table', tableId, ':', url);

    const response = await this._throttledFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await this._handleErrorResponse(response);
    }

    const data = await response.json();
    logger.log('[API] Saved query created, id:', data.id);
    return data;
  }

  /**
   * Fetch a saved query by ID.
   *
   * @param {string} id - Saved query ID (e.g. "30116027")
   * @returns {Promise<object>} - Saved query object
   */
  async getSavedQuery(id) {
    const url = this.baseUrl + '/savedqueries/' + encodeURIComponent(id);
    logger.log('[API] Fetching saved query', id, ':', url);

    const response = await this._throttledFetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      await this._handleErrorResponse(response);
    }

    return response.json();
  }

  /**
   * Execute a saved query and return its data directly.
   * Avoids re-building a POST body from the saved selection — the server
   * already has the selection and applies it server-side.
   *
   * @param {string} id - Saved query ID (e.g. "30116027")
   * @param {string} lang - Language code (default: current UI lang)
   * @returns {Promise<object>} - JSON-Stat2 data response
   */
  async getSavedQueryData(id, lang = this.defaultLang) {
    const url = this.baseUrl + '/savedqueries/' + encodeURIComponent(id) +
                '/data?lang=' + lang + '&outputFormat=json-stat2';
    logger.log('[API] Fetching saved query data', id, ':', url);

    const response = await this._throttledFetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      await this._handleErrorResponse(response);
    }

    return response.json();
  }

  /**
   * Fetch the recommended default selection for a table.
   * Returns the selection the table owner has configured as a sensible starting
   * point — useful for pre-populating variable selection on first open.
   *
   * @param {string} tableId - Table ID (e.g. "07459")
   * @param {string} lang - Language code (default: current UI lang)
   * @returns {Promise<object>} - Default selection object with a `selection` array
   *   of { variableCode, valueCodes, codelist? } entries
   */
  async getDefaultSelection(tableId, lang = this.defaultLang) {
    const url = this.baseUrl + '/tables/' + tableId + '/defaultselection?lang=' + lang;
    logger.log('[API] Fetching default selection for table ' + tableId + ':', url);

    const response = await this._throttledFetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      await this._handleErrorResponse(response);
    }

    return response.json();
  }

  /**
   * Fetch API configuration from the /config endpoint.
   * Updates AppConfig.limits with the server's maxDataCells value.
   * Cached for 24 hours (same as table list).
   *
   * @returns {Promise<object>} - Config response
   */
  async getConfig() {
    const cacheKey = 'api_config';
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this._applyConfig(cached);
      return cached;
    }

    try {
      const url = this.baseUrl + '/config';
      logger.log('[API] Fetching API config:', url);

      const response = await this._throttledFetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        logger.warn('[API] Could not fetch config, using defaults');
        return null;
      }

      const data = await response.json();
      logger.log('[API] API config: maxDataCells=' + data.maxDataCells +
                 ', maxCalls=' + data.maxCallsPerTimeWindow + '/' + data.timeWindow);

      this._applyConfig(data);
      await this.cache.set(cacheKey, data, AppConfig.cache.tableListTTL);
      return data;
    } catch (error) {
      logger.warn('[API] Failed to fetch config, using defaults:', error);
      return null;
    }
  }

  /**
   * Apply server config values to AppConfig.
   * @param {object} config - Config response from /config endpoint
   */
  _applyConfig(config) {
    // The source's own rate limit, when /config states one (SCB: 30 per 10 s).
    // SSB's says 0 (not in use), so its AppConfig value stays.
    if (config.maxCallsPerTimeWindow > 0 && config.timeWindow > 0) {
      AppConfig.limits.rateLimit = { calls: config.maxCallsPerTimeWindow, windowMs: config.timeWindow * 1000 };
    }
    if (config.maxDataCells != null) {
      AppConfig.limits.maxCells = config.maxDataCells;
      AppConfig.limits.cellWarningThreshold = Math.round(config.maxDataCells * 0.75);
    }
    // Stored for diagnostics and future use (e.g. version display in footer)
    if (config.apiVersion != null) {
      AppConfig.apiVersion = config.apiVersion;
    }
    // Stored for future use (e.g. export format validation / dynamic format picker)
    if (Array.isArray(config.dataFormats)) {
      AppConfig.limits.dataFormats = config.dataFormats;
    }
  }

  /**
   * Clear all cached data
   * @returns {Promise} - Resolves when both cache tiers are cleared
   */
  clearCache() {
    return this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clean up expired cache entries
   * @returns {number} - Number of entries removed
   */
  cleanupCache() {
    return this.cache.cleanup();
  }
}

// Create global API instance
const api = new SSBApi();
