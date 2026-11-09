/**
 * Configuration file for using the application with SCB's PxWebApi
 * (Statistikportalen, Statistiska centralbyrån).
 *
 * Not loaded by index.html. To deploy the SCB instance, replace config.js with
 * this file and subjects.js with subjects-sv.js (same file names, so the ?v=
 * query strings in index.html still apply). Everything else is shared with the
 * SSB instance. Keep the fields in step with config.js.
 */

const AppConfig = {
  /**
   * PxWebApi v2 base URL for the data source.
   */
  apiBaseUrl: 'https://statistikdatabasen.scb.se/api/v2',

  /**
   * Instance-specific source information.
   * These values are used in the UI where the data source is named explicitly.
   */
  source: {
    name: 'SCB',
    nameFull: 'Statistiska centralbyrån',
    url: 'https://www.scb.se/',
    licenseUrl: 'https://www.scb.se/vara-tjanster/oppna-data/',
    licenseName: 'CC0',

    // SSB's kortnavn URL convention for "Om statistikken" doesn't apply to SCB,
    // so there is no fallback link when the metadata has no link.related.
    statisticsPageBase: null,

    // No page of changed and removed tables is configured for SCB: the message
    // for a table that doesn't exist then has no link.
    tableChangesUrl: null,

    // No SCB page for a saved query is configured: «Få lenke» shows only the
    // app's own #sq/ link.
    savedQueryUrl: null
  },

  /**
   * Application branding.
   */
  app: {
    name: 'Statistikportalen',
    tagline: {
      sv: 'Ett inofficiellt verktyg som ger dig bättre tillgång till SCB:s öppna data.',
      en: 'An unofficial tool giving you better access to SCB\'s open data.'
    }
  },

  /**
   * Instance-specific web analytics (Umami): the SCB instance's own site, as in
   * 1.4.5. Umami counts only on the hosts in `domains`. Set to null to turn it off.
   */
  analytics: {
    scriptUrl: 'https://stats.statistikkportalen.no/script.js',
    websiteId: '4625f0dc-ca98-4b4b-b189-b09e00907a41',
    domains: 'statistikportalen.se',
    doNotTrack: true
  },

  /**
   * Available UI languages.
   * code:    UI language code (used for translations.js lookup)
   * apiLang: Language code sent to the API (lang= parameter)
   * label:   Display name shown in the language selector
   *
   * The first entry is the default language.
   */
  languages: [
    { code: 'sv', apiLang: 'sv', label: 'Svenska' },
    { code: 'en', apiLang: 'en', label: 'English' }
  ],

  /**
   * Default UI language code (must match a code in languages above).
   */
  defaultLanguage: 'sv',

  /**
   * Cache time-to-live (TTL) in milliseconds
   */
  cache: {
    // Table list cache duration (24 hours)
    tableListTTL: 24 * 60 * 60 * 1000,

    // Table metadata cache duration (7 days)
    metadataTTL: 7 * 24 * 60 * 60 * 1000,

    // Codelist cache duration (7 days)
    codelistTTL: 7 * 24 * 60 * 60 * 1000
  },

  /**
   * API request limits
   */
  limits: {
    // Maximum cells per request. Overridden at runtime by config.maxDataCells
    // from the /config endpoint (150 000 at SCB, 2026-11-09).
    maxCells: 150000,

    // Warning threshold (cells). Overridden at runtime to 75% of config.maxDataCells.
    cellWarningThreshold: 112500,

    // Supported export formats. Null until populated at runtime from config.dataFormats via the /config endpoint.
    dataFormats: null,

    // Requested page size per /tables batch request. Large to minimise API
    // round-trips; pagination handles the case where the API returns fewer
    // rows than requested. Not an API-imposed limit.
    tablePageBatchSize: 10000,

    // Maximum GET URL length before warning
    maxGetUrlLength: 2000,

    // The source's rate limit. SCB's /config states 30 calls per 10 s
    // (2026-11-09) and overrides this at runtime.
    rateLimit: { calls: 30, windowMs: 10000 },

    // Share of rateLimit the app uses, to be considerate towards the API:
    // half, so 15 calls per 10 s at SCB. Cache hits don't count.
    rateLimitShare: 0.5
  },

  /**
   * Export default settings
   */
  export: {
    // Default output format: csv, xlsx, px
    defaultFormat: 'xlsx',

    // Default display format: UseCodes, UseTexts, UseCodesAndTexts
    defaultDisplayFormat: 'UseTexts',

    // Include table title by default
    includeTitle: true,

    // Default CSV separator: SeparatorTab, SeparatorSpace, SeparatorSemicolon
    defaultCsvSeparator: 'SeparatorSemicolon',

    // Default layout: 'as-shown' (current stub/heading) or 'pivot-friendly' (all in stub)
    defaultLayout: 'as-shown'
  },

  /**
   * UI settings
   */
  ui: {
    // Debounce delay for search inputs (milliseconds)
    searchDebounceMs: 500,

    // Debounce delay for value filter inputs (milliseconds)
    filterDebounceMs: 150,

    // Maximum values to display in value list before truncation
    maxDisplayValues: 500,

    // Error message auto-hide delay (milliseconds)
    errorAutoHideMs: 10000,

    // Show discontinued tables by default in search and topic views
    showDiscontinuedByDefault: false,

    // Off for SCB: its titles end with a frequency word before the period
    // ("… efter kön och ålder. År 2005-2025", "Månad 2001M01-2026M09"), so
    // dropping the period would leave "… och ålder. År".
    hidePeriodInTableTitles: false,

    // SCB's hierarchy is shallower than SSB's (subject → subtopic → tables),
    // so one level of navigation cards instead of two. As in 1.4.5.
    topicCardDepth: 1
  },

  /**
   * Source update schedule. The same as the SSB instance, as in 1.4.5;
   * SCB's own publishing times have not been checked.
   * Cache created before the most recent update is considered stale.
   */
  sourceUpdateTimes: [
    { hour: 5, minute: 0 },
    { hour: 8, minute: 0 },
    { hour: 11, minute: 30 }
  ],

  /**
   * Debug logging
   * Set to true to enable console logging throughout the application.
   */
  debug: false
};

// Expose globally
window.AppConfig = AppConfig;

/**
 * Logger — wraps console methods and respects AppConfig.debug.
 * Use logger.log/warn/error/etc. instead of console.* throughout the app.
 */
const logger = {
  log:            (...args) => { if (AppConfig.debug) console.log(...args); },
  warn:           (...args) => { if (AppConfig.debug) console.warn(...args); },
  error:          (...args) => { if (AppConfig.debug) console.error(...args); },
  info:           (...args) => { if (AppConfig.debug) console.info(...args); },
  debug:          (...args) => { if (AppConfig.debug) console.debug(...args); },
  group:          (...args) => { if (AppConfig.debug) console.group(...args); },
  groupEnd:       ()        => { if (AppConfig.debug) console.groupEnd(); },
  groupCollapsed: (...args) => { if (AppConfig.debug) console.groupCollapsed(...args); },
  time:           (label)   => { if (AppConfig.debug) console.time(label); },
  timeEnd:        (label)   => { if (AppConfig.debug) console.timeEnd(label); }
};

window.logger = logger;
