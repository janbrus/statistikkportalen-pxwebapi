# Utviklingslogg — Statistikkportalen

To logger for to lesere, begge på norsk:

- **`CHANGELOG.md`** er for brukerne: hva som er nytt, endret og rettet sammenlignet
  med forrige versjon bare for PxWebApi, ett kort punkt per endring.
- **`DEVLOG.md`** er for vedlikeholderen: hva som ble endret og hvorfor, hva som ble
  verifisert og hvordan, og funn som venter på en avgjørelse.

Hver versjon står i begge, under samme overskrift. «under arbeid» står til
versjonen legges ut og får dato.

**Versjoner og mapper.** `sp.1.4.5`, `sp.1.5` og `sp.1.6` er utviklingsmapper.
1.4.5 er siste versjon bare for PxWebApi. 1.5 og 1.6 ble aldri lagt ut, så versjonen bygd
fra `sp.1.6` heter 1.5.0. CHANGELOG sammenligner med 1.4.5. En rettelse av noe som
bare var galt i en utviklingsversjon, står derfor bare her. Fra 2026-11-09 ligger
1.5.0 i git-repoet `janbrus/statistikkportalen-pxwebapi` (punkt 26), og `sp.1.6`
er en kopi som ikke endres. 1.4.5 er taggen `v1.4.5`.

1.5.0 videreutvikles som en egen versjon bare for PxWebApi (vedlikeholderens valg,
2026-11-08). Statistikkportalen.no kjører 2.0.0, en annen utgave med flere
datakilder (Norges Bank, FHI, DBH og SSB), sjekket samme dag.

## 1.5.0 — under arbeid

### Avklares før 1.5.0 legges ut

Forskjeller fra 1.4.5 som brukerne kan merke, og som ikke er bestemt. Ingen står
åpne nå (2026-11-09).

**Bestemt: SCB-instansen tas inn** (vedlikeholderens valg, 2026-11-09).
`config-sv.js` og `subjects-sv.js` fra 1.4.5 er tilpasset 1.5.0 (punkt 22).

**Bestemt: SEO-sidene droppes** (vedlikeholderens valg, 2026-11-08). I 1.4.5 lager
`scripts/generate-seo-pages.mjs` (cron på serveren) statiske emne- og tabellsider
(`/okonomi/…/`, `/table/{id}/`), `sitemap.xml`, `robots.txt` og `seo-map.json`, og
`js/seo-head.js` holder canonical- og og:-taggene i synk. 1.5.0 har ingenting av
dette, og ingen cron-jobb. Sidene på statistikkportalen.no (8 738 adresser i
sitemapen) hører til 2.0.0. Hver side er et fullt app-skall med skriptlisten til
versjonen som laget den. Legges 1.5.0 i en webroot som har slike sider, må de
fjernes samtidig. Ellers laster de en annen versjons skriptliste over 1.5.0s filer.
For sider laget med 1.4.5 mangler da `help-view.js` og `chart-view.js`, og ifølge
koden (ikke kjørt) stopper tabellvisningen på `destroyChart()`.

Sidene har aldri ligget på vedlikeholderens server, og ingen cron-jobb kjører
(vedlikeholderen, 2026-11-09). De finnes heller ikke i repoet eller i `~/sp_test`.
Det er altså ingenting å fjerne, og ingen gamle tabelladresser å sende videre.

Ikke tatt med fra utviklingsversjon 1.5 (aldri i drift, så ingen brukere merker det):
8 synonymgrupper (bni, enebolig, fattigdom, foretak, husholdning, valg, navn,
befolkning) og «bustad», `typeof destroyChart === 'function'`-vakter som gjør
diagrammet valgfritt per instans, en annen rekkefølge på radvariablene i
`determineDefaultLayout`, `/config` hentet parallelt med tabellisten, og egne
knappetekster for diagram og tabell. Testene i sp.1.5s `test.html` var ødelagte
(`PxWebApi`, `_getLastSourceUpdateTimestamp`, emnenavn som strenger).

Andre kjente ting:

- `resolveMetricDecimals` leser variabelvisningens `VarSelect.activeCodelists`, som
  kan være foreldet når `#table/` åpnes direkte.
- En feil ved datahenting står både i banneret og i visningen de første 10
  sekundene. Slik var det før også.
- Tabellistene har kolonneoverskriftene «Tittel», «Tidsperiode» og «Sist oppdatert»
  og merket «Avsluttet» hardkodet på norsk i `browser-state.js`, også på engelsk.
  1.4.5 hadde det på samme måte.

### 2026-11-08

Grunnlaget var planen fra 2026-11-06, det skillen `ssb-pxwebapi-v2` (1.3.0–1.6.6)
har lært om API-et, og en gjennomgang av koden som bare fantes i `sp.1.5`. Hvert steg
ble gjort, testet og godkjent for seg.

**Verifisert mot SSB** (lesende GET/POST mot data.ssb.no og ssb.no):

| Sjekk | Resultat |
|---|---|
| 10484, `paths` mot `link.related` | `paths` har `kolltrans` først, `metaid` er `KORTNAVN:jernbane`. «Om statistikken» pekte til feil statistikk |
| `link.describedby` i 8 tabeller (07459 14700 09842 03013 13760 12134 04317 11342) | Alle har formen `{extension:{Var:"urn… urn…"}}` uten `href`, så «Klassifikasjoner og definisjoner» var alltid tom. Alle har `link.related`, og 5 av 8 har definisjoner per verdi (`extension.category`) |
| 09842 BNP 2022–2024 | `value` `[1050535, 924263, 932583]`, `status` `{"1":"*","2":"*"}` |
| 07459 `agg_KommFylker` F-03, F-46 | Samme tall med `outputValues` `aggregated`, `single` og uten, både GET og POST |
| 14700 / 03013 / 12134 / 14710 | `noteMandatory` `{"1":true}` / `{"2":true,"3":true}` / `{"1":true}` / `{"0":true}`. Notene følger også med i dataresponsen |
| 11038, 99999 og `abc` | 404 `{"title":"Non-existent table"}` fra `/tables/{id}` og `/metadata`, 400 med samme tittel fra `/data`, på norsk og engelsk |
| SSBs side over endrede tabeller | nb og `/en/` svarer 200 |
| Grense for antall kall | `x-ratelimit-policy: 40;w=60s`. `/config` har `maxCallsPerTimeWindow: 0`, som ikke brukes |
| Statbank-lenker i noter (12 tabeller) | Alle har formen `https://www.ssb.no/statbank/table/NNNNN` |

**Endringer.** «Før» er `sp.1.6` slik mappen var ved starten av økten. Testskriptene
kjørte den virkelige appen i Chromium mot SSB. De ligger utenfor repoet, i
`~/sp_test/live-tests/` (se README der), sammen med en kopi av `sp.1.6` fra før økten
(`baseline-sp.1.6-2026-11-08/`).

1. **Opprydding.** `getTimeShortcut` flyttet til `variable-select-api.js`, og
   `getNewestPeriod` fjernet (planen fra 2026-11-06).
2. **Shift-klikk og `VarSelect`.** Anker og fastlåste valg (`committedSelection`) ble
   aldri nullstilt ved bytte av tabell eller kodeliste, og etter gjenoppretting fra
   URL mistet shift-klikk valgene utenfor området. `VarSelect` har fått `reset()`,
   `resetSelections()` og `setListState()`. Shift-klikk: 2/6 → 6/6. «Fyll inn
   standardvalg» erstatter nå valgene (vedlikeholderens valg): 9/9.
3. **API-byggeren.** Kopier og åpne bruker igjen den kodede URL-en (`dataset.rawUrl`).
   1.4.5 hadde dette, men `sp.1.6` hadde mistet det: `105+` ga 400, `105%2B` gir 200.
   «Kopier som curl» er fjernet (vedlikeholderens valg). 6/6.
4. **Melding om tomt standardvalg og fanetittel ved søk.** Begge fantes i 1.4.5 og
   var tapt i `sp.1.6`, og ble hentet tilbake via `sp.1.5`. 5/5.
5. **Emnenavn i `subjects.js`.** Navnene er `{ nb, en, sv }` og registreres i ordboka
   når filen lastes (fra `sp.1.5`). 87 `subject.*`-nøkler er fjernet fra
   `translations.js`, og 8 døde `|| mh.subjectNames`-reserver er fjernet.
6. **`link.related`** (fra `sp.1.5`, med skillens rettelser). «Om statistikken» og
   definisjonene kommer fra API-ets ferdige lenker. Reserven fra `paths` svarer bare
   når alle stiene er enige (`_shortNameFromPaths`). Klass-lenkene er uten `.json`.
   «Definisjon» på kortet viser bare definisjoner av hele variabelen. Tabellinfo har
   oversatte overskrifter. 12/12.
7. **Kortoverskriften.** `flex-wrap` hindrer at elementene går ut av kortet i
   kompaktvisning og ved 390 px. CSS for rollemerkene er hentet tilbake fra 1.4.5.
8. **Foreløpige tall.** En celle med både tall og `status` viser tallet med flagget,
   og diagrammet beholder punktet. `suppressedLabel` heter nå `statusLabel` og kan
   også `*`, `-` og `...`. 1/5 → 5/5.
9. **Obligatoriske noter.** Notene står under tabellen eller diagrammet. Over tok de
   oppmerksomheten fra resultatet (vedlikeholderens valg). 1/9 → 9/9.
10. **Fjernede tabeller.** `_buildApiError` gjenkjenner `"Non-existent table"`. Siden
    sier «Tabellen finnes ikke», med lenke til `source.tableChangesUrl`, og meldingen
    blir stående i visningen etter at banneret er borte. Plassholderen «(laster...)»
    var hardkodet på norsk og er oversatt. 2/9 → 9/9.
    **Kappløp rettet:** en henting som ble ferdig etter at brukeren hadde gått videre,
    tegnet over den nye visningen. Etter et språkbytte på 07459 og åpning av 14700 sto
    `currentData` som 07459 under `#table/14700`, og variabelvisningen viste kortene
    til 07459. `renderGuard()` i `utils.js` sjekkes etter hver `await` i tabell- og
    variabelvisningen. Testskriptet holder 07459-svarene tilbake i 2,5 s: 2/5 → 5/5.
    1.4.5 har den samme koden (`currentData = data` før `await` uten sjekk), men
    testskriptet er ikke kjørt mot 1.4.5.
11. **Tabellenker i noter.** `STATBANK_TABLE_URL` gjør dem om til `#variables/{id}`.
    Ctrl/Cmd-klikk overlates til nettleseren. Diagramvisningen gjelder bare én tabell
    om gangen. Før arvet neste tabell den, også i den opprinnelige koden. En tabell som
    ikke finnes, skjuler kontrollene som ikke har noe å virke på
    (vedlikeholderens valg). 3/12 → 12/12.
12. **Dokumentasjon.** `outputValues` har ingen virkning hos SSB, og grensen er 40 kall
    per 60 s. Listen over hva `test.html` laster, er rettet.
13. **Loggene.** Denne filen og `CHANGELOG.md`, sammenlignet med 1.4.5 (se under).
14. **Tilbake fra 1.4.5** (vedlikeholderens valg etter sammenligningen). Begge
    fantes i 1.4.5, så de står ikke i CHANGELOG.
    - **Tabellinfo i variabelvisningen:** den står over variabelkortene igjen, lukket,
      slik at notene kan leses før verdiene velges. `buildMetadataSection(meta)` tar
      metadataene som parameter, med `currentFullMetadata` som standard. Åpne og
      lukke er flyttet fra `table-display.js` til `setupMetadataToggle()` i
      `table-metadata.js`, og begge visningene bruker den.
    - **Én trekant på «API-bygger»:** `▶` er fjernet fra `api.builder` i nb, en
      og sv. Markeringen har sitt eget ikon.

    3/6 → 6/6: Tabellinfo over kortene, lukket, åpnes med notene og tabellenkene. Én
    trekant. I tabellvisningen åpner klikk og Enter lukker. En fjernet tabell har
    ingen Tabellinfo.

15. **Versjon 1.5.0.** `VERSION = 'v1.5.0'` i `js/version.js`, og alle 30 `?v=1.6.0`
    i `index.html` er `?v=1.5.0` (regelen i `CLAUDE.md`). Ingen `1.6.0` er igjen i
    koden. 1.5.0 er aldri lagt ut, så ingen nettleser kan ha `?v=1.5.0`-filer i
    hurtigbufferen, og 1.4.5-brukerne har `?v=1.4.5`. Bunnteksten viser v1.5.0, alle
    31 skriptene lastes med riktig `?v=` (`version.js` uten), og en tabell, diagrammet
    og hjelpen virker uten konsollfeil: 6/6.
    **Tillegg:** de tre CSS-lenkene har også fått `?v=1.5.0`, så det er 33 i alt.
    Stilarkene hadde aldri hatt `?v=`, heller ikke i 1.4.5, så en nettleser med
    CSS-en fra 1.4.5 lagret kunne ha vist ny kode med gammel stil. Det gjelder blant
    annet kompaktvisningen, noteboksen og de skjulte kontrollene for fjernede
    tabeller. Hvor lenge, avhenger av serverens hurtigbufferinnstillinger, som ikke er
    sjekket. Regelen i `CLAUDE.md`, `CONTRIBUTING.md` og `version.js` sier nå at
    CSS-lenkene følger `VERSION`. `version.mjs`: 7/7.

16. **Perioden i tabelltitlene, som i 1.4.5** (vedlikeholderens valg). Titlene i
    tabellistene gjentok perioden som står i kolonnen Tidsperiode. Nå tar
    `BrowserState.stripTrailingPeriod()` den bort igjen. Funksjonen er hentet fra
    1.4.5 og styres av `ui.hidePeriodInTableTitles: true` i `config.js`. Den fjerner
    bare en hale som er lik første og siste periode, også `(2016-2018)-(2022-2024)`.
    Prøvd på hele SSBs tabelliste 2026-11-08: 7815 av 7816 titler på norsk og 7814 av
    7816 på engelsk blir kortere, og ingen blir tomme eller ender rart. Den eneste
    norske som står urørt, har ingen periode («Pengemengden M1, M2 og M3»).
    `test.html` laster nå `browser-state.js`. `periods.mjs`: 4/7 → 7/7. Før gjentok
    164 av 164 rader på forsiden og alle radene i to søk perioden. Nå gjør ingen det,
    og kolonnen viser den fortsatt. Står ikke i CHANGELOG, fordi 1.4.5 hadde det.

17. **Forbedret søk på som standard, som i 1.4.5** (vedlikeholderens valg).
    `searchFilters.enhanced` starter som `true`. URL-en får bare `enh=0` når søket er
    av, og alt annet enn `enh=0` leses som på. Det er samme regel som i 1.4.5, så
    bokmerker fra 1.4.5 med `enh=0` virker som før. `sp.1.6` hadde snudd den
    (av som standard, `enh=1` for på). For «bnp» gir forbedret søk 24 treff mot 2
    med vanlig søk. `enhsearch.mjs`: 4/8 → 8/8, med sjekken av beta-merket. Søk fra forsiden har søket på og
    ingen `enh` i URL-en, avkrysning av skriver `enh=0`, og lenker med og uten `enh=0`
    åpner riktig. Navnet er fortsatt «Forbedret søk», mot «Utvidet søk» i 1.4.5, og
    navnebyttet står i CHANGELOG. Beta-merket er fjernet (vedlikeholderens valg),
    fordi et beta-merke på noe som er på som standard sier to ting. 1.4.5 hadde det
    heller ikke. `search.beta` (nb, en, sv) og `.beta-badge` med fargen `#6c8ebf`
    var ellers ubrukt og er fjernet.
18. **Umami i `AppConfig.analytics`, som i 1.4.5** (vedlikeholderens valg). Umami
    satt hardkodet i `<head>` i `sp.1.6`. Nå står `scriptUrl`, `websiteId`, `domains`
    og `doNotTrack` i `config.js`, og en liten snutt rett etter `config.js` i
    `index.html` legger skriptet inn i `<head>`. Snutten er den samme som i 1.4.5. Med
    `analytics: null`, eller tom `scriptUrl`/`websiteId`, lastes ingenting. Verdiene er
    de samme som før, og Umami teller fortsatt bare på `statistikkportalen.no`
    (`data-domains`). En egen versjon på et annet domene setter sin egen nettsted-ID
    her. `analytics.mjs`: 3/5 → 5/5, og 3/3 med `ANALYTICS=off` mot en kopi med
    `analytics: null`. `version.mjs` er fortsatt 7/7, og konsollen har ingen feil.
    Brukerne merker ingen forskjell, så CHANGELOG er uendret.
19. **Opprydding med `/simplify`** (vedlikeholderens valg, 2026-11-09). Tre lesende
    gjennomganger av kodeendringene siden 2026-11-08, mot kopien fra før økten. Ingen
    endret oppførsel. `_dimensionDefinitionLinks` bruker `_relatedByRelation`. Tall med
    og uten flagg har én `<td>`-mal, og definisjonslenkene i Tabellinfo én `add()`.
    `source.statisticsPageBase` er `{ nb, en }` og leses med `localized()`, som
    `tableChangesUrl`. De fire modusknappene bruker én `_setCardMode()`. «Fyll inn
    standardvalg» venter med `await` i stedet for flagget `showingTempMessage`, og
    laster ikke kodelisterekkefølgen på nytt. Periodekandidatene i
    `stripTrailingPeriod` er flatere. `s.defer = true` er fjernet fra Umami-snutten,
    fordi det ikke virker på et skript lagt inn med kode. Ugyldige data vises med
    `showViewError()`, og to misvisende kommentarer er rettet. Ti funn er ikke tatt
    med. Noen ville endret oppførsel, og noen gjaldt kode fra før økten. Fire er større
    omlegginger som kan bli egne steg: `AbortController` i `renderCurrentView`,
    `viewMode` i `AppState`, én felles side for tabeller som ikke finnes, og
    shift-klikk-modellen bygd fra DOM-en. `test.html`: 297/297, med 2 nye for
    `statisticsPageBase`. Testskriptene mot SSB: `varinfo` 6/6, `related` 12/12,
    `flags` 5/5, `shiftclick` 6/6, `defaultsel` 9/9, `ux4` 5/5, `periods` 7/7,
    `analytics` 5/5 og 3/3 med analytics av, `removed` 9/9, `version` 7/7, ugyldige
    data 1/1.
20. **CLAUDE.md kortet ned** (vedlikeholderens valg, 2026-11-09). Fra 298 linjer
    (33 KB) til 71 (6,6 KB), fordi filen lastes i hver økt. Igjen står kommandoer og
    testregler, logging, linjeslutt (nytt), hurtigbuffer, loggene, reglene som gir feil
    når de brytes, og en kort CSS-liste. Resten sto allerede i `ARCHITECTURE.md`. Det
    som manglet der, er lagt til: rutingdetaljene, de 6 nøklene `sv` mangler,
    kompaktvisning og kortoverskrift i CSS, `safeApiCall`, `showError` og
    `renderGuard` under «Shared utilities», og «Instansspesifikke filer», flyttet
    ordrett.
21. **Datakallet avbrytes når brukeren går videre** (vedlikeholderens valg,
    2026-11-09, smal versjon). `renderCurrentView()` avbryter en `AbortController` og
    lager en ny, og `renderGuard()` gir signalet som `.signal`. Bare `loadTableData`
    sender det videre, til `api.getTableData(…, { signal })`, fordi datakallet aldri
    ligger i hurtigbufferen og kan bli stort. Et kall som venter på sitt 100 ms-gap i
    `_throttledFetch`, sendes aldri. `safeApiCall()` gir `null` uten melding ved
    `AbortError`. Et kall som allerede er sendt, teller fortsatt mot SSBs grense, så
    gevinsten er nedlastingen og tolkingen av svaret, ikke kallet. Metadata og
    kodelister avbrytes ikke: de er små, og et avbrudd ville kastet en hurtigbuffer på
    7 dager. `isCurrent()`-sjekkene står, fordi kall fra hurtigbufferen og
    `BrowserState.init()` ikke tar signalet. Nytt testskript `abort.mjs`: 3/5 → 5/5.
    Det holder 07459-forespørselen tilbake 2,5 s før den sendes og åpner 14700 imens.
    Med endringen blir forespørselen avbrutt og aldri sendt, det kommer ingen
    feilmelding, og 14700 tegnes med egne data. `race.mjs` 5/5, `removed.mjs` 9/9 og
    `version.mjs` 7/7. `test.html` har fått en asynkron del til slutt, som
    sammendraget venter på: `_throttledFetch` med avbrutt signal kaller aldri
    `fetch`, og `safeApiCall` er stille ved `AbortError`. Brukerne ser ingen
    forskjell, så CHANGELOG er uendret.
22. **SCB-instansen i 1.5.0** (vedlikeholderens valg, 2026-11-09). Som i 1.4.5
    erstatter `js/config-sv.js` og `js/subjects-sv.js` filene `config.js` og
    `subjects.js` ved utrulling. `index.html` laster dem ikke. `config-sv.js` er bygd
    fra dagens `config.js` og har de samme feltene, sjekket med et skript. Verdiene
    fra 1.4.5 er tatt med: `statistikdatabasen.scb.se/api/v2`, SCB og CC0,
    «Statistikportalen», egen Umami-ID for statistikportalen.se, og svensk og engelsk
    med svensk som standard. I tillegg har den `statisticsPageBase`, `tableChangesUrl`
    og `savedQueryUrl` som `null`, `hidePeriodInTableTitles: false` og
    `topicCardDepth: 1`. `subjects-sv.js` er fra 1.4.5: 5 grupper og 21 emner. Koden
    som registrerer emnenavnene, er den samme som i `subjects.js`. Det som måtte inn i
    selve appen:
    - `ui.topicCardDepth` igjen, som i 1.4.5: `cardDepth` i `topic-view.js` og
      `MenuHierarchy.getChildrenForPath()`. `getCategoriesForSubtopic` er fjernet,
      fordi den ikke lenger hadde kallere. SSB har 2, som før.
    - Perioden står i SCB-titlene, fordi de slutter på «År 2005-2025», «Månad
      2001M01-2026M09» og «Kvartal 2001K1-2026K3». Fjernes perioden, blir «… och
      ålder. År» stående.
    - De seks svenske tekstene som manglet (`variable.defaultSelection*`,
      `variable.compactView*`, `error.defaultSelection`).
    - `source.savedQueryUrl` i stedet for ssb.no-lenken som var hardkodet i
      `table-save-query.js`. SCB-utgaven av 1.4.5 viste den lenken også.

    Ikke endret: diagrammene bruker SSBs farger, `synonyms.js` er norsk, og
    `_urnToUrl`/`STATBANK_TABLE_URL` kjenner bare SSBs mønstre. Publiseringstidene
    er SSBs, som i 1.4.5. SCBs `/config` 2026-11-09: 150 000 celler, 30 kall per
    10 s, sv og en, CC0. Tabellisten hadde 5 297 tabeller. Nytt testskript
    `scb.mjs`: 12/12 mot SCB, med «Få lenke» stubbet. Nytt `ssb-instance.mjs`: 5/5
    før og etter (to kortnivåer, ssb.no-lenken). `varinfo` 6/6, `version` 7/7,
    `periods` 7/7, `enhsearch` 8/8, `removed` 9/9 og `defaultsel` 9/9. `test.html`
    sjekker nå at `en` og `sv` har alle `nb`-nøkler, og den sjekker
    `savedQueryUrl` og `topicCardDepth`. 1.4.5 hadde SCB-filene, så CHANGELOG er
    uendret.
23. **Høyst halvparten av API-grensen** (vedlikeholderens valg, 2026-11-09). Før
    dette holdt appen bare 100 ms mellom kallene og telte dem ikke, og testene kunne
    bruke mer enn grensen tillot. `related.mjs` brukte 25 av SSBs 40 kall i én
    kjøring, og løperne spurte `x-ratelimit-remaining` hvert 5. sekund. Det er
    endret slik:
    - `_throttledFetch` holder et glidende vindu på `limits.rateLimit` ×
      `rateLimitShare` (0,5), altså 20 kall per 60 s hos SSB og 15 per 10 s hos SCB.
      Er vinduet fullt, venter neste kall. Et kall som avbrytes mens det venter,
      bruker ingen plass. Grensen kan ikke leses i nettleseren, fordi
      `x-ratelimit-*` ikke er tilgjengelig via CORS. Den står derfor i `config.js`,
      og i `config-sv.js` for SCB. `_applyConfig` bruker `/config` når den oppgir
      en grense, slik SCB gjør.
    - Sjekket mot SSB samme dag: en CORS-forhåndsforespørsel (`OPTIONS`) telles som
      et kall (`remaining` 39 → 38 → 37), og SSB sender ingen
      `Access-Control-Max-Age`. En POST med JSON teller derfor som 2
      (`_corsRequestCount`).
    - `cdp.mjs` teller hver forespørsel til SSB og SCB, også `OPTIONS`, og
      kjøringen feiler over halvparten. `run-all.sh` tar en pause på 60 s mellom
      kjøringene og spør ikke etter gjenværende grense.
    - `test.html`, uten nett: budsjettene, overstyringen fra `/config`, vinduet
      (2 kall per 300 ms), at et avbrudd under ventingen ikke tar plass, og at en
      JSON-POST teller som 2. `version.mjs`: 7/7, med 6 forespørsler (GET 4, POST 1,
      OPTIONS 1), høyst 6 per 60 s.
    - **Én teller for alle faner** (vedlikeholderens valg). Først hadde hver fane sitt
      eget vindu, så to faner kunne til sammen bruke hele grensen. Nå ligger vinduet i
      `localStorage` under `rateWindow:<vert>`, uten `ssb_`-prefikset, så å tømme
      hurtigbufferen nullstiller det ikke. `_claimRateSlots` leser og skriver det
      under en Web Lock med samme navn, så to faner ikke tar samme plass. Låsen
      slippes mens kallet venter. Uten `localStorage` teller fanen alene, og uten Web
      Locks tas plassen uten lås.
    - Den virtuelle klokken i den hodeløse `test.html`-kjøringen
      (`--virtual-time-budget`) får låseforespørslene til å henge. Vindustestene der
      skjuler derfor `navigator.locks`. De sjekker nøkkelen, og at et vindu som en
      annen fane har fylt, gjør at neste kall venter (≥ 290 ms). Låsen sjekkes i
      sanntid med `sharedwindow.mjs`: en iframe fra samme opphav er den andre fanen,
      `fetch` er stubbet og vinduet er 2 kall per 400 ms. 5/5, uten kall til SSB
      eller SCB.
    - **Per nettleser, ikke per nettverk.** Telleren dekker bare fanene i én
      nettleser. Et privat vindu, en annen nettleser eller en annen maskin har sin
      egen. Om SSB teller per IP-adresse, er ikke sjekket. Gjør SSB det, kan mange
      maskiner bak én felles adresse (en skole, et kurs, en arbeidsplass) til sammen
      gå over grensen, og «For mange forespørsler» kan fortsatt komme. CHANGELOG sier
      derfor «i hver nettleser» og «sjelden».
    - Med én teller for alle faner, mot SSB samme dag: `version.mjs` 7/7 og
      `abort.mjs` 5/5, med 6 forespørsler hver (GET 4, POST 1, OPTIONS 1) og 60 s
      mellom kjøringene.
    - **`./run-all.sh` mot SSB og SCB samme dag**, med 60 s mellom kjøringene. Alle
      unntatt `race.mjs` og `related.mjs` besto, og alle holdt seg innenfor
      halvparten. Tettest var `notes.mjs`, `race.mjs` og `notelinks.mjs` med 18 per
      60 s. `scb.mjs` brukte høyst 13 per 10 s.
    - De to feilet fordi de ventet for kort nå som appen kan holde kall tilbake.
      `related.mjs` trenger mer enn 20 plasser og ga opp etter 20 s. `race.mjs`
      sjekket 14700 etter fast 5 s, mens datakallet ventet på vinduet. Nå venter de
      på det de sjekker, i opptil 90 s. Etterpå: `race.mjs` 5/5 og `related.mjs`
      12/12.
    - **1 s margin.** `related.mjs` målte da 21 forespørsler innenfor 60 s. Ingen
      kall går utenom `_throttledFetch`. Men en forespørsel går ut litt etter at
      plassen er tatt, en JSON-POST først etter forhåndsforespørselens rundtur. I
      tillegg stemplet `cdp.mjs` tiden da hendelsen nådde Node. Nå holdes en plass
      i vinduet + 1 s (`_rateMarginMs`), og `cdp.mjs` bruker nettleserens
      `wallTime`. Hvor mye av overskridelsen som kom fra målingen, og hvor mye fra
      nettet, er ikke skilt ut. Etterpå: `related.mjs` 12/12, høyst 20 per 60 s, og
      21 forespørsler spenner over minst 61,00 s.
    - `cdp.mjs` skriver kalltellingen også når et skript krasjer, og lister
      forespørslene i det tetteste vinduet når budsjettet er brutt. `run-all.sh`
      viser også `Error`-linjer.
24. **Melding når appen venter på et kall** (vedlikeholderens valg, 2026-11-09).
    Før ventet appen bak «Laster…» uten forklaring når vinduet var fullt, i verste
    fall nesten ett minutt (se `race.mjs` under steg 23).
    - `_claimRateSlots` holder rede på kallene som venter (`_rateWaiters`). Den
      sender `ratewait` på `window`, med `until` for når det siste etter
      beregningen får plass, eller `null` når ingen venter. Et kall som får plass
      eller avbrytes, tas ut.
    - `updateRateWaitNotice` i `utils.js` viser meldingen når ventetiden er minst
      2 s, teller ned hvert sekund og tømmer den når ingen venter. Teksten er
      `loading.rateWait` med `AppConfig.source.name`, så SCB-instansen sier «SCB».
      Nedtellingen er `loading.rateWaitSeconds`.
    - `#rate-wait-notice` i `index.html` er en levende region (`role="status"`).
      Den er alltid i siden og er tom når ingen venter, så skjermlesere får med seg
      teksten når den fylles inn. Nedtellingen er `aria-hidden` og leses ikke opp
      hvert sekund. Meldingen står fast nederst på midten (`main.css`) og tar ingen
      plass når den er tom (`:not(:empty)`).
    - `test.html`: hendelsen med `until` og `null`, også ved avbrudd, terskelen på
      2 s, kildenavnet, nedtellingen og at den stopper. `ratewait.mjs` mot SSB
      fyller vinduet i `localStorage` som om en annen fane hadde brukt det for 56 s
      siden, og åpner 07459. Meldingen vises med nedtelling, dataene kommer etter
      ca. 5 s, og meldingen forsvinner. 8/8, med 6 forespørsler.
25. **Toppfeltet på mobil** (vedlikeholderens valg A, 2026-11-09). Skjermbildet av
    ventemeldingen i 390 px viste ikke meldingen. Tittelen «Statistikkportalen» er
    ett ord på 327 px, og språkknappene krymper ikke (`flex-shrink: 0`), så de stakk
    ut til 509 px. Mobil-Chrome legger da faste elementer etter den bredere siden.
    Meldingen havnet under skjermen (y 995–1078 på en skjerm som er 844 høy), og
    «Laster…» ble kuttet til høyre. 1.4.5 har samme overflyt, målt på en statisk
    side med bare toppfeltet og stilarkene.
    - `main.css`, i blokken for 768 px: `header { flex-wrap: wrap }`,
      `.header-content { flex: 1 1 0 }` og `.header-lang { margin-left: auto }`.
      Får ikke språkknappene plass, får de en egen linje til høyre under
      undertittelen. Tab-rekkefølgen følger det man ser. Uten `flex: 1 1 0`
      avgjorde undertittelens fulle bredde linjebruddet, så knappene flyttet seg
      ned også ved 560–640 px, der de får plass i dag. Med den bryter raden først
      mellom 520 og 560 px. Toppfeltet er da 188 px høyt mot 138. Fra 560 px er
      det som før.
    - Valg B, knappene over tittelen (`order: -1`), ble ikke valgt: da står de over
      tittelen, men kommer etter den ved tabbing.
    - `ratewait.mjs` sjekker i 390 px med mobilemulering at siden ikke er bredere
      enn skjermen og at meldingen er innenfor: 8/9 før, 9/9 etter, 6 forespørsler
      hver gang. `ratewait.mjs <navn>` tar skjermbilder i 1400 og 390 px.
    - «Laster…» er nå synlig i 390 px og ligger over undertittelen mens noe
      lastes, slik den ligger over kanten av toppfeltet på store skjermer. Ikke
      endret.
    - Ikke prøvd på en ekte telefon.
    - Hele `run-all.sh` etter steg 24 og 25: alle 22 skriptene besto. Det tetteste
      vinduet hos SSB var `related` med 20 per 60 s (21 forespørsler spenner over
      minst 61,00 s), deretter `race`, `notes` og `notelinks` med 18. `scb` hadde
      høyst 13 per 10 s.
26. **Inn i git-repoet** (vedlikeholderens valg, 2026-11-09).
    `janbrus/statistikkportalen-test`, en fork av `avocodetoast/statistikkportalen`,
    heter nå `statistikkportalen-pxwebapi`, og 1.5.0 ligger der. Repoet har ikke
    GitHub Pages, så det nye navnet bryter ingen nettadresse. `main` var 1.4.5 og
    hadde samme innhold som `sp.1.4.5`, bortsett fra linjeskift.
    - Taggen `v1.4.5` står på `82df884`, siste versjon med SEO-sidene. 1.5.0 er én
      commit på `release-1.5.0`, slått sammen inn i `main`.
    - Fjernet etter «Bestemt: SEO-sidene droppes»: `js/seo-head.js`,
      `scripts/generate-seo-pages.mjs`, `scripts/update-table-metadata.mjs`,
      `data/table-metadata/` og blokken for `data/table-metadata/*.json` i
      `.gitignore`. Ellers er repoets `.gitignore` beholdt, også at `CLAUDE.md`
      ikke er med i git.
    - `API-FINDINGS.md` er også fjernet. Ingenting viste til den, og den var aldri
      med i `sp.1.6`. De to formene av `link.describedby` står i doc-kommentaren
      til `_describedbyUrns()` og i skillen `ssb-pxwebapi-v2`. URN-oppslaget er
      `_urnToUrl()`, og notatet om ugyldige datoer gjaldt bare SEO-skriptet. Filen
      ligger i taggen `v1.4.5`.
    - Linjeskift: git lagrer LF. 32 filer med CRLF fra `sp.1.6` ble gjort om til
      LF, og hver CR sto rett før et linjeskift. Diffen er lik med og uten
      `--ignore-cr-at-eol`. De 15 filene git har lagret som kjørbare (100755),
      beholdt modusen, så diffen bare viser innhold.
    - Innholdet er likt `sp.1.6` når CR ses bort fra. Unntakene er `.gitignore`,
      `DEVLOG.md` og `CLAUDE.md`. I repo-mappen: `node --check` på alle 32
      skriptene og `test.html` 343/343. Testskriptene mot repo-mappen
      (`APP_DIR`/`SRC_DIR`): `version` 7/7 og `ratewait` 9/9 mot SSB, med 6
      forespørsler hver, og `scb` 12/12 mot SCB, med høyst 13 per 10 s.

`test.html`: 204/204 etter steg 8, 216 etter steg 9, 254 etter steg 10, 267 etter
steg 11, 276 etter steg 14 og 15, 285 etter steg 16, 291 etter steg 17, 295/295
etter steg 18, 297/297 etter steg 19, 306/306 etter steg 21, 310/310 etter
steg 22, 326/326 etter steg 23, 329/329 med én teller for alle faner, 331/331
med margin og 343/343 etter steg 24 og 25, også i git-repoet (steg 26).

**Sammenligning med 1.4.5.** CHANGELOG bygger på:
- norske tekstnøkler i 1.4.5 og `sp.1.6` (76 nye, 1 fjernet);
- antall endrede linjer per fil;
- funksjoner som finnes i 1.4.5 og mangler i `sp.1.6`;
- målrettede søk etter hvert punkt.

Det som var tapt i `sp.1.6` og nå er tilbake, står ikke i CHANGELOG, fordi brukerne
aldri mistet det. Det gjelder kodet URL, melding om tomt standardvalg, fanetittel ved
søk, stil på rollemerkene, Tabellinfo i variabelvisningen, én trekant på
«API-bygger», perioden i tabelltitlene og forbedret søk på som standard. README for 1.4.5 nevnte `from(periode)` som operator i velgeren, men det
fantes ikke i koden.

### 2026-11-06

Økten «1.6.0nyplan», etter at `sp.1.6` ble tatt over:

- `CLAUDE.md` ble rettet mot koden. To linjer i `test.html` var feil: metodenavnet i
  `cache.js` og at klassen heter `SSBApi`. Feilen stoppet siden etter 49 tester, og
  etter rettingen passerer 95/95.
- `README.md` og `CONTRIBUTING.md`: utdaterte påstander er rettet. Søketreff vises som
  tabellister, ikke kort, og `from(periode)` står ikke lenger som operator i velgeren.
- `ARCHITECTURE1.6.md` heter nå `ARCHITECTURE.md`. Lenkene er rettet, og navnet er
  fjernet fra `.gitignore.local`.
- Brukerveiledningen og hjelpetekstene (nb, en, sv) beskriver knappene som faktisk
  finnes, «Velg alle» og «Siste».
- `ARCHITECTURE.md` er rettet mot koden, og alle 84 funksjonsnavnene den nevner, finnes.
- **Rotasjon i URL-en:** `table-rotation.js` skriver oppsettet til `l` med
  `replaceState`. En rotert tabell beholder oppsettet ved oppdatering, bokmerke og
  tilbake/fram: 7/19 → 19/19. `test.html` 99/99.
- **Tidsforkortelsen i GET-URL-en:** `top()` og `from()` brukes bare for en
  sammenhengende rekke fram til nyeste periode, målt på posisjon i
  `category.index`. Før ga for eksempel 1986–1987 `top(2)`, og URL-en hentet
  2025–2026. 19 sjekker mot SSB, og `test.html` 114/114.
- En plan for `/simplify` ble laget og gjennomført 2026-11-08 som steg 1.
