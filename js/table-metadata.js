/**
 * Table Metadata - Build collapsible metadata section for table display
 */

/**
 * Convert a URN from link.describedby to a browsable URL.
 * Fallback only: SSB's metadata response has ready-made, labelled links in
 * link.related, which buildMetadataSection() uses first. Handles SSB Klass
 * (classification) and VarDok (variable definition) URNs, and gives the same
 * human-readable pages as link.related (not the Klass API's JSON).
 *
 * @param {string} href - URN or URL from the link.describedby entry
 * @returns {string|null} - Browsable URL, or null if unrecognised
 */
function _urnToUrl(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  const isEnglish = getCurrentApiLang() === 'en';

  const klassMatch = href.match(/^urn:ssb:classification:klass:(\d+)$/);
  if (klassMatch) {
    return 'https://www.ssb.no/' + (isEnglish ? 'en/' : '') + 'klass/klassifikasjoner/' + klassMatch[1];
  }

  const vardokMatch = href.match(/^urn:ssb:conceptvariable:vardok:(\d+)$/);
  if (vardokMatch) {
    return 'https://www.ssb.no/a/metadata/conceptvariable/vardok/' + vardokMatch[1] + '/' + (isEnglish ? 'en' : 'nb');
  }

  return null;
}

/**
 * Collect entries from a json-stat2 `link.related` array matching a relation.
 * SSB tags related links with extension.relation ("statistics-homepage",
 * "about-statistics", "definitions") and provides ready-made localized href
 * and label. Entries without a usable http(s) href are skipped.
 *
 * @param {object|undefined} linkObj - json-stat2 `link` object (root or dimension level)
 * @param {string} relation - extension.relation value to match
 * @returns {object[]} - Matching related entries, [] if none
 */
function _relatedByRelation(linkObj, relation) {
  const related = linkObj?.related;
  if (!Array.isArray(related)) return [];
  return related.filter(entry =>
    entry?.extension?.relation === relation &&
    typeof entry.href === 'string' && entry.href.startsWith('http')
  );
}

/**
 * Normalise link.describedby entries to a flat list of URN/URL strings.
 * Handles both shapes SSB has used: the old `{ href: "urn:..." }` and the
 * current `{ extension: { <varname-or-valuecode>: "urn:... urn:..." } }`
 * (multiple whitespace-separated URNs per key). Non-URN extension values
 * (seen on SCB, e.g. { "Kon": "Kön" }) are dropped silently.
 *
 * @param {Array|undefined} entries - link.describedby array
 * @returns {string[]}
 */
function _describedbyUrns(entries) {
  const urns = [];
  (entries || []).forEach(entry => {
    if (entry?.href) urns.push(entry.href);
    Object.values(entry?.extension || {}).forEach(value => {
      if (typeof value !== 'string') return;
      value.split(/\s+/).forEach(token => {
        if (token.startsWith('urn:')) urns.push(token);
      });
    });
  });
  return urns;
}

/**
 * The statistic's short name (kortnavn) from a table's `paths`, as used in
 * ssb.no URLs (e.g. ssb.no/folkemengde). The third node of a path is the short
 * name of a statistic the table is listed under. A cross-listed table has paths
 * under several statistics, and then no path says which one owns it (10484
 * lists kolltrans first but belongs to jernbane), so this only answers when
 * every path with 3+ nodes agrees. The metadata's link.related is the reliable
 * source; this is the fallback for responses without it.
 *
 * @param {Array|undefined} paths - `paths` from the /tables entry
 * @returns {string|null}
 */
function _shortNameFromPaths(paths) {
  if (!Array.isArray(paths)) return null;
  const names = new Set(
    paths.filter(path => Array.isArray(path) && path.length >= 3 && path[2]?.id).map(path => path[2].id)
  );
  return names.size === 1 ? [...names][0] : null;
}

/**
 * Resolve the short name (kortnavn) for a table from BrowserState.allTables.
 * Returns null if BrowserState is not loaded, the table is unknown, or its
 * paths disagree (see _shortNameFromPaths).
 *
 * @param {string} tableId
 * @returns {string|null}
 */
function _getStatisticShortName(tableId) {
  if (!tableId || typeof BrowserState === 'undefined') return null;
  const tables = BrowserState.allTables;
  if (!Array.isArray(tables)) return null;
  const table = tables.find(t => t.id === tableId);
  return table ? _shortNameFromPaths(table.paths) : null;
}

/**
 * A Statbank table page on ssb.no, as SSB's notes link to it
 * ("[tabell 03013](https://www.ssb.no/statbank/table/03013)"), also under
 * /en/; group 1 is the table ID. SSB-specific, like _urnToUrl.
 */
const STATBANK_TABLE_URL = /^https?:\/\/(?:www\.)?ssb\.no\/(?:en\/)?statbank\/table\/(\d+)\/?(?:[?#].*)?$/;

/**
 * Convert markdown-style links [text](url) to HTML anchor tags. A link to a
 * Statbank table opens that table in the app (#variables/{id}, class
 * app-table-link, handled by a delegated listener in index.html); other links
 * open in a new tab.
 * @param {string} text - Text with potential markdown links
 * @returns {string} - HTML with anchor tags
 */
function convertMarkdownLinks(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (match, label, url) => {
      const table = url.match(STATBANK_TABLE_URL);
      return table
        ? '<a href="#variables/' + table[1] + '" class="app-table-link">' + label + '</a>'
        : '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>';
    }
  );
}

/**
 * The table notes the source says must always accompany the figures.
 * extension.noteMandatory (PX keyword NOTEX) is keyed on the index in `note`:
 * { "1": true } (14700) means note[1], { "2": true, "3": true } (03013) means
 * two notes. Only root-level notes can be mandatory at SSB; the spec's
 * per-dimension noteMandatory/categoryNoteMandatory are never set.
 *
 * @param {object|null} meta - json-stat2 dataset (metadata or data response)
 * @returns {string[]} - Mandatory notes in `note` order, [] if none
 */
function getMandatoryNotes(meta) {
  const notes = meta?.note;
  const mandatory = meta?.extension?.noteMandatory;
  if (!Array.isArray(notes) || !mandatory) return [];
  return notes.filter((note, i) => mandatory[i] === true && typeof note === 'string' && note.trim());
}

/**
 * Build the always-visible box with the mandatory notes, shown below the table
 * or chart, so it doesn't take the eye off the figures. Tabellinfo still lists
 * every note. Reads the
 * full metadata and falls back to the data response, which carries the same
 * notes, so a failed metadata fetch doesn't hide them.
 *
 * @returns {string} - HTML string, '' if the table has no mandatory notes
 */
function buildMandatoryNotes() {
  const notes = getMandatoryNotes(currentFullMetadata || currentData);
  if (notes.length === 0) return '';
  return '<div class="info-message mandatory-notes" role="note">' +
    notes.map(note => '<p>' + convertMarkdownLinks(note) + '</p>').join('') +
    '</div>';
}

/**
 * Build the collapsible metadata section (Tabellinfo) HTML. The table view
 * passes nothing and gets currentFullMetadata; the variable view passes the
 * metadata it loaded, so the notes can be read before values are picked.
 * Wire it up with setupMetadataToggle() once it is in the DOM.
 *
 * @param {object|null} [meta] - json-stat2 metadata (default: currentFullMetadata)
 * @returns {string} - HTML string, '' without metadata
 */
function buildMetadataSection(meta = currentFullMetadata) {
  if (!meta) return '';

  // Format updated date in the UI language
  let updatedStr = '';
  if (meta.updated) {
    try {
      const locale = { nb: 'no-NO', en: 'en-GB', sv: 'sv-SE' }[currentLanguage] || 'no-NO';
      const date = new Date(meta.updated);
      updatedStr = date.toLocaleDateString(locale, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      updatedStr = meta.updated;
    }
  }

  // Build notes HTML
  let notesHtml = '';
  if (meta.note && Array.isArray(meta.note) && meta.note.length > 0) {
    notesHtml = '<dt>' + t('metadata.notes') + '</dt><dd>';
    meta.note.forEach(note => {
      notesHtml += '<p>' + convertMarkdownLinks(note) + '</p>';
    });
    notesHtml += '</dd>';
  }

  // Build contact HTML
  let contactHtml = '';
  if (meta.extension && meta.extension.contact && meta.extension.contact.length > 0) {
    contactHtml = '<dt>' + t('metadata.contact') + '</dt><dd>';
    meta.extension.contact.forEach(contact => {
      const parts = [];
      if (contact.name) parts.push(escapeHtml(contact.name));
      if (contact.phone) parts.push(t('metadata.phone') + ': ' + escapeHtml(contact.phone));
      if (contact.mail) {
        parts.push('<a href="mailto:' + escapeHtml(contact.mail) + '">' +
                   escapeHtml(contact.mail) + '</a>');
      }
      contactHtml += '<p>' + parts.join(', ') + '</p>';
    });
    contactHtml += '</dd>';
  }

  // Official statistics flag
  let officialHtml = '';
  if (meta.extension && meta.extension.px && meta.extension.px['official-statistics']) {
    officialHtml = '<dt>' + t('metadata.status') + '</dt><dd>' + t('metadata.official') + '</dd>';
  }

  // "Om statistikken"-lenker. Primary source: root link.related, where the
  // API provides ready-made localized hrefs and labels (statistics-homepage +
  // about-statistics), and names the statistic that owns the table. Fallback
  // for metadata without link.related (other PxWebApi instances): derive the
  // URL from the statistic's short name in `paths`, gated on
  // AppConfig.source.statisticsPageBase since the kortnavn URL convention is
  // SSB-specific.
  let aboutHtml = '';
  const aboutLinks = [
    ..._relatedByRelation(meta.link, 'statistics-homepage'),
    ..._relatedByRelation(meta.link, 'about-statistics')
  ];
  if (aboutLinks.length > 0) {
    aboutHtml = '<dt>' + t('metadata.about') + '</dt><dd>' + aboutLinks.map(entry =>
      '<p><a href="' + escapeHtml(entry.href) + '" target="_blank" rel="noopener">' +
      escapeHtml(entry.label || entry.href) + '</a></p>'
    ).join('') + '</dd>';
  } else if (AppConfig.source?.statisticsPageBase) {
    const kortnavn = _getStatisticShortName(AppState.selectedTable?.id);
    if (kortnavn) {
      const url = localized(AppConfig.source.statisticsPageBase) + encodeURIComponent(kortnavn) + '#om-statistikken';
      aboutHtml = '<dt>' + t('metadata.about') + '</dt><dd><a href="' + escapeHtml(url) +
                  '" target="_blank" rel="noopener">' + escapeHtml(url) + '</a></dd>';
    }
  }

  // Classification/definition links (Klass + VarDok), collected per scope
  // (dataset root, then each dimension). Primary source: link.related entries
  // with relation "definitions" (ready-made href + human-readable label),
  // supplemented by any link.describedby URNs not already covered.
  // Deduplication uses one shared set keyed on both canonical id
  // (related metaid === describedby URN) and final URL — the id is the stable
  // key, since localized related hrefs (e.g. /en/klass/...) can differ from
  // _urnToUrl output. Related entries are added first so the labeled ones win.
  let linksHtml = '';
  const seenKeys = new Set();
  const linkItems = [];

  const addScope = (linkObj, dimLabel) => {
    const prefix = dimLabel ? `<span class="metadata-dim-label">${escapeHtml(dimLabel)}:</span> ` : '';
    // keys: what identifies the link (URL plus metaid or URN); a link is
    // skipped when any of them has been seen
    const add = (keys, url, label) => {
      keys = keys.filter(Boolean);
      if (keys.some(key => seenKeys.has(key))) return;
      keys.forEach(key => seenKeys.add(key));
      linkItems.push(`<li>${prefix}<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a></li>`);
    };

    _relatedByRelation(linkObj, 'definitions').forEach(entry =>
      add([entry.href, entry.extension?.metaid], entry.href, entry.label || entry.href));

    _describedbyUrns(linkObj?.describedby).forEach(urn => {
      const url = _urnToUrl(urn);
      if (url) add([urn, url], url, urn);
    });
  };

  addScope(meta.link, null);
  if (meta.dimension) {
    Object.values(meta.dimension).forEach(dim => addScope(dim.link, dim.label));
  }

  if (linkItems.length > 0) {
    linksHtml = '<dt>' + t('metadata.definitions') + '</dt><dd><ul class="metadata-links">' +
                linkItems.join('') + '</ul></dd>';
  }

  return `
    <div class="table-metadata">
      <h4 class="metadata-toggle-btn" role="button" tabindex="0" aria-expanded="false">
        <span class="metadata-toggle-icon">&#9654;</span> ${t('metadata.title')}
      </h4>
      <div class="metadata-content" style="display: none;">
        <dl>
          ${meta.source ? '<dt>' + t('metadata.source') + '</dt><dd>' + escapeHtml(meta.source) + '</dd>' : ''}
          ${updatedStr ? '<dt>' + t('metadata.updated') + '</dt><dd>' + escapeHtml(updatedStr) + '</dd>' : ''}
          ${officialHtml}
          ${aboutHtml}
          ${notesHtml}
          ${contactHtml}
          ${linksHtml}
        </dl>
      </div>
    </div>
  `;
}

/**
 * Make the Tabellinfo heading in `container` open and close the section, by
 * click and by Enter/Space (the heading is a role="button" <h4>). Used by the
 * table view and the variable view.
 *
 * @param {HTMLElement|null} container - Element holding buildMetadataSection()'s HTML
 */
function setupMetadataToggle(container) {
  const metaToggle = container?.querySelector('.metadata-toggle-btn');
  if (!metaToggle) return;
  metaToggle.addEventListener('click', () => {
    const content = container.querySelector('.metadata-content');
    const icon = metaToggle.querySelector('.metadata-toggle-icon');
    const opening = content.style.display === 'none';
    content.style.display = opening ? 'block' : 'none';
    icon.innerHTML = opening ? '&#9660;' : '&#9654;';
    metaToggle.setAttribute('aria-expanded', String(opening));
  });
  metaToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      metaToggle.click();
    }
  });
}
