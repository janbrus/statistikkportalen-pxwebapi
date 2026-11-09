/**
 * Table Save Query - Save current query and present shareable links
 */

// Cache the last saved query so repeated clicks reuse the same ID
let _lastSavedQuery = null; // { fingerprint: string, id: string }

/**
 * Show dialog for saving the current query and presenting shareable links.
 * POSTs to the source's /savedqueries endpoint and displays the app's own
 * deep-link (#sq/{id}) and, when AppConfig.source.savedQueryUrl is set, a link
 * to the source's page for the query.
 */
async function showSaveQueryDialog() {
  if (!currentData || !AppState.selectedTable || !AppState.variableSelection) {
    showError(t('saveQuery.noActive'));
    return;
  }

  // Fingerprint the current selection so we can skip the POST if nothing changed
  const layout = AppState.tableLayout;
  const fingerprint = JSON.stringify({
    tableId: AppState.selectedTable.id,
    selection: AppState.variableSelection,
    codelistIds: AppState.activeCodelistIds || {},
    rows: layout ? layout.rows : [],
    columns: layout ? layout.columns : []
  });

  // Remove any existing dialog
  document.getElementById('save-query-dialog')?.remove();

  const needsLoading = !(_lastSavedQuery && _lastSavedQuery.fingerprint === fingerprint);

  const dialogHtml = `
    <div class="dialog-overlay" id="save-query-dialog">
      <div class="dialog-container" style="max-width: 540px;">
        <div class="dialog-header">
          <h3>${t('saveQuery.title')}</h3>
          <button class="dialog-close" id="save-query-close">&times;</button>
        </div>
        <div class="dialog-content" id="save-query-content">
          ${needsLoading ? '<p class="loading-message">' + escapeHtml(tpl('saveQuery.saving', AppConfig.source.name)) + '</p>' : ''}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', dialogHtml);

  const dialog = document.getElementById('save-query-dialog');
  const closeDialog = () => { dialog.remove(); removeEscape(); };
  const removeEscape = addEscapeHandler(closeDialog);

  document.getElementById('save-query-close')?.addEventListener('click', closeDialog);

  // Only close overlay click if the mousedown also started on the overlay —
  // prevents accidental close when dragging to select text in the inputs.
  let mouseDownOnOverlay = false;
  dialog.addEventListener('mousedown', (e) => {
    mouseDownOnOverlay = e.target === dialog;
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && mouseDownOnOverlay) closeDialog();
  });

  const showLinks = (id) => {
    // The source's own page for the query (AppConfig.source.savedQueryUrl);
    // without one, only the app's link is shown
    const sourceUrlTemplate = AppConfig.source?.savedQueryUrl;
    const ssbUrl = sourceUrlTemplate ? sourceUrlTemplate.replace('{id}', encodeURIComponent(id)) : null;
    const portalUrl = window.location.origin + window.location.pathname + '#sq/' + id;

    document.getElementById('save-query-content').innerHTML = `
      <p>${t('saveQuery.saved')}</p>

      <div class="form-group">
        <label class="form-label">${escapeHtml(tpl('saveQuery.portalLabel', AppConfig.app.name))}</label>
        <div class="save-query-link-row">
          <input type="text" class="save-query-link-input" readonly
                 id="portal-link-input" value="${escapeHtml(portalUrl)}">
          <button class="btn-secondary" id="copy-portal-link">${t('saveQuery.copy')}</button>
        </div>
      </div>
      ${ssbUrl ? `
      <div class="form-group">
        <label class="form-label">${escapeHtml(tpl('saveQuery.sourceLabel', AppConfig.source.name))}</label>
        <div class="save-query-link-row">
          <input type="text" class="save-query-link-input" readonly
                 id="ssb-link-input" value="${escapeHtml(ssbUrl)}">
          <button class="btn-secondary" id="copy-ssb-link">${t('saveQuery.copy')}</button>
        </div>
        <a href="${escapeHtml(ssbUrl)}" target="_blank" rel="noopener"
           style="display:inline-block; margin-top: 6px; font-size: 0.9em;">
          ${escapeHtml(tpl('saveQuery.openSource', AppConfig.source.name))} ↗
        </a>
      </div>` : ''}
    `;

    const makeCopyHandler = (inputId, btnId) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        const val = document.getElementById(inputId)?.value || '';
        navigator.clipboard.writeText(val).catch(() => {
          const input = document.getElementById(inputId);
          if (input) { input.select(); document.execCommand('copy'); }
        });
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.textContent = t('api.copied');
          setTimeout(() => { btn.textContent = t('saveQuery.copy'); }, 2000);
        }
      });
    };

    makeCopyHandler('portal-link-input', 'copy-portal-link');
    makeCopyHandler('ssb-link-input', 'copy-ssb-link');
  };

  // Reuse cached ID if the selection is unchanged
  if (!needsLoading) {
    showLinks(_lastSavedQuery.id);
    return;
  }

  try {
    const result = await api.saveSavedQuery(
      AppState.selectedTable.id,
      AppState.variableSelection,
      {
        stub: layout ? layout.rows : [],
        heading: layout ? layout.columns : [],
        codelistIds: AppState.activeCodelistIds || {},
        lang: getCurrentApiLang()
      }
    );

    const id = result.id || result.savedQuery?.id;
    if (!id) throw new Error(t('saveQuery.noIdInResponse'));

    _lastSavedQuery = { fingerprint, id };
    showLinks(id);

  } catch (e) {
    logger.error('[TableDisplay] Failed to save query:', e);
    document.getElementById('save-query-content').innerHTML =
      '<p class="error-message">' + tpl('saveQuery.failed', escapeHtml(e.message)) + '</p>';
  }
}
