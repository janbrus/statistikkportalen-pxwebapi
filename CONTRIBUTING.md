# Bidra til Statistikkportalen

> **English TL;DR.** Statistikkportalen is a vanilla-JS single-page app — no build
> step, no bundler, no package manager. **Setup:** clone, then open `index.html`
> (or serve the folder) and refresh to see changes. **Tests:** open `test.html` in
> a browser; every row must be green. **Two rules that bite:** (1) if you bump
> `VERSION` in `js/version.js`, update *every* `?v=` query string in `index.html` (scripts and CSS)
> to match; (2) versioning and releases are the maintainer's call — don't bump
> `VERSION` in a feature PR. Norwegian details below.

Takk for at du vil bidra! Dette er en lett guide — for *hva* appen gjør og *hvordan
den brukes*, se [`README.md`](README.md); for dyptgående arkitektur og «hva skjer
når …»-flyt, se [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Kom i gang

Det finnes **ingen byggesteg, ingen pakkebehandler og ingen avhengigheter** å
installere. Hele utviklingsloopen er:

1. Klon repoet.
2. Åpne `index.html` i en moderne nettleser. Et lokalt webserver-oppsett anbefales
   framfor `file://` (tryggere for enkelte nettlesere, selv om SSB-API-et har CORS):
   ```sh
   python3 -m http.server
   # åpne deretter http://localhost:8000
   ```
3. Rediger JS/CSS → refresh nettleseren. Det er alt.

**Debug:** `AppConfig.debug = true` i nettleserkonsollen slår på `logger`-utskrift
fra da av. `window.AppState`, `window.VarSelect` og `window.api` settes bare ved
sideinnlasting, så de krever `debug: true` i `js/config.js` før siden lastes. Det
trengs sjelden: toppnivå-`const`-er kan nås direkte ved navn i konsollen (`AppState`,
`VarSelect`, `api`). `window.BrowserState` og `window.clearCache()` er alltid
tilgjengelige, uavhengig av debug-modus.

## Kjøre tester

Åpne `test.html` i nettleseren. Det er en avhengighetsfri testrunner
(`suite()` / `assert()` / `assertEqual()`) som dekker `AppConfig`, oversettelser og
rene hjelpefunksjoner — **ingen nettverkskall**. Sammendraget nederst må vise alle
grønne (`x/x passed`).

- Legger du til logikk i en ren funksjon eller en ny oversettelsesnøkkel, legg til
  en `assert`/`assertEqual` for den.
- `test.html` laster bare **et utvalg** av scriptene, uten `?v=`: kjernen i samme
  rekkefølge som `index.html`, og deretter noen få view-filer (`variable-select-*`,
  `table-display.js`, `table-metadata.js`, `chart-view.js`) som er trygge å laste
  alene. Trenger en test et nytt script, legg det inn i `test.html`.

## Husregler

- **Cache-busting (viktigst).** `js/version.js` definerer `VERSION`, og hvert
  `?v=<versjon>` i `index.html` må matche denne: på alle `<script src>` og på de tre
  CSS-lenkene. Endrer du `VERSION` uten å oppdatere alle `?v=` (eller omvendt),
  serverer nettleseren en miks av gammel og ny JS, som gir «X is not a function»-feil,
  eller ny kode med gammel CSS. Flytt dem alltid sammen. (`js/version.js` selv lastes
  uten `?v=`.)

- **Ikke bump `VERSION` uoppfordret.** Gjeldende `VERSION` er ofte fortsatt under
  arbeid. Versjonsbump og release er primærutviklerens ansvar — la `VERSION` stå i
  en feature-PR med mindre du blir bedt om noe annet.

- **Loggfør endringen.** Hver endring får et punkt i [`DEVLOG.md`](DEVLOG.md): hva
  og hvorfor, og hvordan den er testet. Merker brukerne endringen, får den også en
  kort linje i [`CHANGELOG.md`](CHANGELOG.md), under samme versjonsoverskrift.

- **Hold diffen fokusert.** Ikke smugle visuelle endringer (font-størrelser, farger,
  spacing, badge-stiler) inn i en teknisk opprydding eller refaktor. Én bekymring
  per PR.

- **Internasjonalisering.** Aldri hardkod norsk UI-tekst i view-filene — bruk
  `t(key)` / `tpl(key, ...)` fra `translations.js`, og legg til nøkkelen for *alle*
  språk. Instansspesifikke strenger (appnavn, kildenavn) hører hjemme i `AppConfig`
  (`config.js`), ikke i ordboka.

- **Følg eksisterende stil.** Globalt namespace — ingen `import`/moduler; alle
  scripts deler samme namespace og lastes i streng avhengighetsrekkefølge i
  `index.html` (ikke bryt den). Bruk CSS-design-tokens (`var(--color-*)`,
  `var(--spacing-*)`), `:focus-visible` framfor `:focus`, og unngå `!important`.
  `ARCHITECTURE.md` har de fullstendige konvensjonene.

## Levere bidrag

Lag en branch, hold endringen liten og fokusert, og kjør `test.html` grønt før du
sender inn. Åpne en pull request mot
[GitHub-repoet](https://github.com/avocodetoast/statistikkportalen). Beskriv gjerne
*hvorfor* endringen gjøres, ikke bare *hva* som er endret.

## Lisens

Bidrag lisensieres under prosjektets [MIT-lisens](LICENCE.md).
