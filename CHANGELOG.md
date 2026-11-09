# Endringslogg — Statistikkportalen

Hva som er nytt for deg som bruker Statistikkportalen. Versjonen står nederst på
siden. Detaljer, testing og åpne spørsmål står i [`DEVLOG.md`](DEVLOG.md).

## 1.5.0 — under arbeid

Sammenlignet med 1.4.5, siste versjon bare for PxWebApi. Utviklingsversjonene
1.5 og 1.6 ble aldri lagt ut, derfor heter denne 1.5.0.

### Nytt

- **Linjediagram.** Tidsserier kan vises som diagram (📈 Vis som diagram), i SSBs
  farger og med kildelinje.
- **Hjelp i appen.** «Hjelp» nederst på siden og «Ny her?» på forsiden gir en kort
  veiledning. Den fullstendige veiledningen er [`BRUKERVEILEDNING.md`](BRUKERVEILEDNING.md).
- **Obligatoriske noter.** Noter SSB krever skal følge tallene, står alltid under
  tabellen eller diagrammet. En lenke til en annen tabell i en note åpner den
  tabellen i appen.
- **Definisjoner.** Variabelkortene har en «Definisjon»-lenke, og Tabellinfo lister
  klassifikasjoner og definisjoner.
- **Kompaktvisning** i variabelvelgeren legger variablene i flere kolonner på brede
  skjermer.
- **Berøringsskjerm.** Et trykk legger til eller fjerner en verdi, så du kan velge
  flere verdier uten tastatur.
- **Tastatur.** Emnekortene og rotasjonsdialogen kan brukes med tastaturet.
- **Fjernede tabeller.** En gammel lenke til en tabell som ikke finnes lenger, gir en
  tydelig melding med lenke til SSBs oversikt over endrede og fjernede tabeller.
- **API-lenke som holder seg oppdatert.** Velger du perioder som går sammenhengende
  fram til den nyeste, bruker GET-URL-en i API-byggeren `top()` eller `from()`, så
  lenken også henter perioder som publiseres senere.

### Endret

- Små tabeller vises med alle variablene som kolonneoverskrifter og tiden nedover.
- «Fyll inn standardvalg» erstatter valgene du har gjort, i stedet for å legge til.
- Tabellinfo og «Få lenke» er også på engelsk.
- API-byggeren har nedtrekkslister i stedet for knapperader.
- «Utvidet søk» heter nå «Forbedret søk». Det er fortsatt slått på som standard.
- Appen bruker høyst halvparten av SSBs grense for antall kall i hver nettleser.
  Gjør du mye på kort tid, venter den litt og sier fra, så du sjelden får «For
  mange forespørsler».

### Rettet

- Foreløpige tall (`*`) ble vist som manglende. Nå vises tallet med `*` etter, også
  i diagrammet.
- «Om statistikken» kunne lenke til feil statistikk når tabellen hører til flere, og
  «Klassifikasjoner og definisjoner» var tom.
- En rotert tabell mistet oppsettet ved oppdatering, bokmerke og tilbake/fram.
- Shift-klikk etter bytte av tabell eller kodeliste kunne velge feil verdier.
- Byttet du språk og straks åpnet en annen tabell, kunne appen vise tallene fra den
  første tabellen.
- På mobil var siden bredere enn skjermen, og språkvalget havnet utenfor til høyre.
