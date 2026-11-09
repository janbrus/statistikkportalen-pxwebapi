# Statistikkportalen
Statistikkportalen er et uoffisielt grensesnitt som forbedrer tilgangen til SSBs data. Applikasjonen gir rask navigering gjennom lokal caching, et kompakt grensesnitt for å minimere scrolling, og enklere oppdagelse av tabeller gjennom menynavigering.

Applikasjonen kan tilpasses andre systemer som bruker PxWebApi v2, eksempelvis SCBs statistikkbank. Det meste ligger i tre filer som byttes ut: `config.js` (API-URL, kilde, språk), `subjects.js` (emnehierarki og emnenavn på alle språk) og `synonyms.js` (søkesynonymer). I tillegg må SSB-lenkene i `table-metadata.js` og `table-save-query.js` samt fargepaletten i `chart-view.js` tilpasses. Øvrig visuell tilpassing (farger, typografi, avrunding) styres av CSS-variabler i `:root` i `css/main.css`.

## Funksjonalitet
1. **Oppdag tabeller raskt og enkelt**
   - Søk gjennom alle SSBs tilgjengelige tabeller
   - Filtrer etter emne og frekvens
   - Oversiktlige tabellister med tabellnummer, tittel, tidsperiode og oppdateringsdato. Perioden står i egen kolonne, så den gjentas ikke i tittelen
   - Emnekortene kan også åpnes med tastaturet (Tab + Enter/mellomrom)
   - En lenke til en fjernet tabell gir en tydelig melding med lenke til SSBs oversikt over endrede og fjernede tabeller

2. **Variabelvelger**
   - Interaktivt grensesnitt for å velge verdier for hver dimensjon
   - Semantiske merker (Tid, Geografi, Statistikkvariabel) basert på JSON-stat2 `role`
   - Tidsdimensjon viser forventet periodeformat (f.eks. `2024M06`)
   - Støtte for kodelister, inkludert aggregeringer (`agg_*`) som gir summerte tall, f.eks. tidskonsistente kommunetall
   - Støtte for spesielle operatorer
     - `*` — Alle verdier
     - `top(n)` — De n siste verdiene (f.eks. `top(12)` for siste 12 måneder)
   - Visuelle indikatorer for valideringsstatus
   - Berøringsvennlig: på nettbrett/mobil veksler et trykk en verdi inn/ut, slik at flervalg fungerer uten tastatur
   - Valgfri kompaktvisning som plasserer dimensjonene i et flerkolonners rutenett på brede skjermer (huskes per nettleser)

3. **API-bygger**
   - Generer GET- og POST-URL direkte fra variabelvalget
   - Støtte for responsformatene JSON-stat2, CSV, Excel, PX, HTML og JSON-PX — formater som API-et ikke oppgir i `/config`, skjules fra listen
   - Tidsdimensjonen optimeres automatisk: når valget er sammenhengende og når den nyeste perioden, erstattes eksplisitte perioder med `from(startdato)` eller `top(n)` for en dynamisk URL som alltid henter ferske data. Ellers listes periodene enkeltvis
   - URL vises i klartekst som standard; kopier og åpne bruker alltid den URL-kodede versjonen, så lenken virker også med koder som `105+`
   - Kopier URL eller POST-body med ett klikk

4. **Datavisning**
   - Intelligent standard layout — Statistikkvariabel som øverste kolonneoverskrift, tid nedover som rader, og automatisk kompaktvisning som stabler alle dimensjoner i kolonneoverskriften når tabellen er smal nok
   - Sticky headers for enkel navigering i store tabeller
   - Norske tallformater (mellomrom som tusenskilletegn, komma som desimalskilletegn)
   - Korrekt visning av statuskoder per SSBs konvensjon: `.`, `..` og `:` for manglende tall, og foreløpige tall med `*` etter tallet
   - Obligatoriske noter (`extension.noteMandatory`) vises alltid under tabellen eller diagrammet, f.eks. at tabellen erstatter en avsluttet tabell eller at referanseåret er endret. Lenker til andre tabeller i notene åpner tabellen i appen (Ctrl/Cmd-klikk gir ny fane)
   - Tabellinfo, både i variabelvelgeren og over tabellen, med notene, kilde og direktelenker til statistikksiden, "Om statistikken" og klassifikasjoner/definisjoner (Klass/VarDok) fra API-ets `link.related`, og en «Definisjon»-lenke på variabelkortene
   - Linjediagram-toggle (📈) for tidsserier — SSB-stilrent i offisiell palett, med riktig desimalpresisjon per statistikkvariabel (hentet fra `category.unit.decimals`), manglende tall rendret som hull (foreløpige tall beholdes og merkes i verktøytipset), og obligatorisk kildelinje under figuren

5. **Tabellrotasjon**
   - Drag-and-drop-grensesnitt for å endre tabellayout
   - Flytt dimensjoner mellom rader og kolonner
   - Full tastaturstøtte: Tab til en dimensjon, piltast venstre/høyre flytter mellom rader og kolonner, opp/ned endrer rekkefølgen
   - Hurtigvalg: Standard, Transponér, Alle som rader/kolonner

6. **Dataeksport**
   - Eksporter til Excel, CSV og PX-format
   - Valg for eksportformat, eksempelvis pivotvennlig CSV

7. **Caching**
   - Intelligent caching av API-kall i localStorage og IndexedDB (for store elementer som tabellisten)
   - Automatisk opprydding av utdaterte data

8. **Lagrede spørringer**
   - Lagre spørringer som kan gjenfinnes med lenke
   - Åpne en SSB-spørring ved å lime lenken inn i søkefeltet

9. **Forbedret søk**
   - Finn flere tabeller enn ved den vanlige søkemodusen, ved hjelp av synonymer. Slått på som standard

10. **Innebygd hjelp**
   - Kondensert brukerveiledning i appen (`#hjelp`), med inngang fra footer, forsiden og variabelvelgeren
   - Fullstendig veiledning i [`BRUKERVEILEDNING.md`](BRUKERVEILEDNING.md)

## Kom i gang

Ny bruker? Se den fullstendige **[brukerveiledningen](BRUKERVEILEDNING.md)** for en steg-for-steg-innføring i grensesnittet. I appen ligger en kortversjon under **Hjelp** (footer-lenken, eller `#hjelp`). Kortversjonen av oppstarten:

1. Åpne `index.html` i en moderne nettleser
2. Vent til tabellisten lastes (caches automatisk)
3. Søk eller bla til ønsket tabell
4. Velg verdier for variablene
5. Klikk «Hent data»
6. Utforsk, roter og eksporter data

## Systemkrav
- Moderne nettleser (Chrome, Firefox, Safari, Edge, Vivaldi)
- JavaScript aktivert
- Internettforbindelse (for API-kall)
- localStorage aktivert (for caching og språkvalg), og helst IndexedDB (for caching av store elementer som tabellisten)

## Endringer
Hva som er nytt i hver versjon, står i [`CHANGELOG.md`](CHANGELOG.md). Utviklingsloggen med testing og åpne spørsmål er [`DEVLOG.md`](DEVLOG.md).

## Lisens
Denne koden er lisensiert under [MIT-lisens](LICENCE.md).
Data fra Statistisk sentralbyrå er lisensiert under [CC BY 4.0](https://www.ssb.no/diverse/lisens).
Data fra Statistiska centralbyrån er lisensiert under [CC0](https://www.scb.se/en/services/open-data-api/).
