/**
 * Help View - Condensed in-app user guide ("Slik bruker du portalen").
 *
 * A deliberately compact companion to the full BRUKERVEILEDNING.md document.
 * Reachable via #hjelp (footer link, front-page banner, variable-selector hint).
 * All copy goes through t()/tpl() so it follows the active UI language; app and
 * source names come from AppConfig (never hard-coded), matching translations.js.
 */

// Canonical full guide. Points at the repo so it renders nicely on GitHub.
const HELP_FULL_GUIDE_URL =
  'https://github.com/avocodetoast/statistikkportalen/blob/main/BRUKERVEILEDNING.md';

function renderHelpView(container) {
  updatePageTitle([t('nav.help')]);

  const appName = AppConfig.app?.name || 'Statistikkportalen';
  const sourceName = AppConfig.source?.name || '';

  container.innerHTML = `
    <div class="view-container help-view">
      <div class="view-header">
        <button id="help-back-home" class="btn-secondary">${t('nav.home')}</button>
        <h2>${escapeHtml(tpl('help.title', appName))}</h2>
        <p class="view-description">${escapeHtml(tpl('help.intro', appName, sourceName))}</p>
      </div>

      <section class="help-section">
        <h3>${t('help.quickstart.title')}</h3>
        <p>${t('help.quickstart.intro')}</p>
        <ol class="help-steps">
          <li>${t('help.quickstart.s1')}</li>
          <li>${t('help.quickstart.s2')}</li>
          <li>${t('help.quickstart.s3')}</li>
          <li>${t('help.quickstart.s4')}</li>
          <li>${t('help.quickstart.s5')}</li>
        </ol>
      </section>

      <section class="help-section">
        <h3>${t('help.frontpage.title')}</h3>
        <p>${escapeHtml(tpl('help.frontpage.body', sourceName))}</p>
      </section>

      <section class="help-section">
        <h3>${t('help.glossary.title')}</h3>
        <p>${t('help.glossary.intro')}</p>
        <ul class="help-glossary">
          <li>${t('help.glossary.variable')}</li>
          <li>${t('help.glossary.metric')}</li>
          <li>${t('help.glossary.timegeo')}</li>
          <li>${t('help.glossary.cell')}</li>
          <li>${t('help.glossary.required')}</li>
        </ul>
      </section>

      <section class="help-section">
        <h3>${t('help.variables.title')}</h3>
        <p>${t('help.variables.select')}</p>
        <p>${t('help.variables.operators')}</p>
        <p>${t('help.variables.grouping')}</p>
        <p>${t('help.variables.fetch')}</p>
      </section>

      <section class="help-section">
        <h3>${t('help.read.title')}</h3>
        <p>${t('help.read.body')}</p>
      </section>

      <section class="help-section">
        <h3>${t('help.share.title')}</h3>
        <p>${t('help.share.body')}</p>
      </section>

      <section class="help-section help-advanced">
        <h3>${t('help.advanced.title')}</h3>
        <p>${escapeHtml(tpl('help.advanced.body', sourceName))}</p>
      </section>

      <p class="help-full-guide">
        <a href="${HELP_FULL_GUIDE_URL}" target="_blank" rel="noopener noreferrer">${t('help.fullGuide')} →</a>
      </p>
    </div>
  `;

  document.getElementById('help-back-home')?.addEventListener('click', () => {
    URLRouter.navigateTo('home', {});
    URLRouter.handleRoute();
  });
}

window.renderHelpView = renderHelpView;
