/**
 * Configuration file for SSB Statistikkbank Alternative
 *
 * This file contains all configurable settings for the application.
 * Modify these values to change the API endpoint or other settings.
 */

const AppConfig = {
  /**
   * PxWebApi v2 base URL for the data source.
   * Default: https://data.ssb.no/api/pxwebapi/v2
   * For alternative environments, change this to the appropriate endpoint.
   */
  apiBaseUrl: 'https://data.ssb.no/api/pxwebapi/v2',

  /**
   * Instance-specific source information.
   * These values are used in the UI where the data source is named explicitly.
   */
  source: {
    name: 'SSB',
    nameFull: 'Statistisk sentralbyrå',
    url: 'https://www.ssb.no/',
    licenseUrl: 'https://www.ssb.no/diverse/lisens',
    licenseName: 'CC BY 4.0',

    // Base URL for the paths-derived "Om statistikken" fallback link
    // (<base><kortnavn>#om-statistikken), used only when the metadata
    // response has no root link.related. A { <ui language>: url } object or a
    // string; null for sources without the kortnavn URL convention — the
    // fallback row is then omitted.
    statisticsPageBase: {
      nb: 'https://www.ssb.no/',
      en: 'https://www.ssb.no/en/'
    },

    // The source's page of changed and removed tables, linked from the message
    // for a table the API says doesn't exist ("Non-existent table"). A
    // { <ui language>: url } object or a string; null for sources without such
    // a page, and the message then has no link.
    tableChangesUrl: {
      nb: 'https://www.ssb.no/statbank/hvordan-bruke-statistikkbanken/endringer-i-statistikkbanktabeller',
      en: 'https://www.ssb.no/en/statbank/hvordan-bruke-statistikkbanken/endringer-i-statistikkbanktabeller'
    },

    // The source's own page for a saved query, linked from «Få lenke»; {id}
    // is replaced by the query ID. null for sources without such a page: the
    // dialog then shows only the app's own #sq/ link.
    savedQueryUrl: 'https://www.ssb.no/statbank/sq/{id}'
  },

  /**
   * Application branding.
   */
  app: {
    name: 'Statistikkportalen',
    tagline: {
      nb: 'Et uoffisielt verktøy som gir deg bedre tilgang til SSBs åpne data.',
      en: 'An unofficial tool giving you better access to Statistics Norway\'s open data.'
    }
  },

  /**
   * Instance-specific web analytics (Umami).
   * Injected into <head> at startup by the snippet after config.js in index.html.
   * Set to null (or leave scriptUrl/websiteId empty) to turn analytics off,
   * e.g. for local development or an instance without tracking.
   *
   * Umami counts only on the hosts in `domains`. A separate deployment (another
   * domain, or another PxWebApi source such as SCB) points scriptUrl and
   * websiteId at its own Umami site.
   */
  analytics: {
    scriptUrl: 'https://stats.statistikkportalen.no/script.js',
    websiteId: 'e8e31e32-aa40-4865-8acb-3311b8a374e9',
    domains: 'statistikkportalen.no',
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
    { code: 'nb', apiLang: 'no', label: 'Norsk' },
    { code: 'en', apiLang: 'en', label: 'English' }
  ],

  /**
   * Default UI language code (must match a code in languages above).
   */
  defaultLanguage: 'nb',

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
    // Maximum cells per request. Overridden at runtime by config.maxDataCells from the /config endpoint.
    maxCells: 800000,

    // Warning threshold (cells). Overridden at runtime to 75% of config.maxDataCells from the /config endpoint.
    cellWarningThreshold: 600000,

    // Supported export formats. Null until populated at runtime from config.dataFormats via the /config endpoint.
    dataFormats: null,

    // Requested page size per /tables batch request. Large to minimise API
    // round-trips; pagination handles the case where the API returns fewer
    // rows than requested. Not an API-imposed limit.
    tablePageBatchSize: 10000,

    // Maximum GET URL length before warning (SSB recommends < 2000 chars)
    maxGetUrlLength: 2000,

    // The source's rate limit. SSB: 40 calls per 60 s (x-ratelimit-policy
    // header; its /config says 0). /config wins when it states a limit.
    rateLimit: { calls: 40, windowMs: 60000 },

    // Share of rateLimit the app uses, to be considerate towards the API:
    // half, so 20 calls per 60 s at SSB. Cache hits don't count.
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

    // Drop the time period many SSB titles end with in the table lists
    // (search, topics, front page): "Konsumprisindeks 2010-2025" →
    // "Konsumprisindeks". The period is in its own Tidsperiode column anyway.
    // Only a suffix that matches the table's first/last period is removed
    // (also ranges of ranges such as "(1990-2000)-(2024-2025)"). As in 1.4.5.
    hidePeriodInTableTitles: true,

    // Path levels shown as navigation cards in the topic view before the
    // table list: 2 for SSB (subject → subtopics → categories), 1 for a
    // shallower hierarchy such as SCB's. As in 1.4.5.
    topicCardDepth: 2
  },

  /**
   * Source update schedule (Norwegian time / Europe/Oslo for SSB).
   * Metadata updates at 05:00 and 11:30 daily.
   * Data (statistics) updates at 08:00 daily.
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
