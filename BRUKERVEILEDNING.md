# Brukerveiledning – Statistikkportalen

Denne veiledningen tar deg fra «hva er dette?» til ferdige tall – vist som graf,
lastet ned og delt. Du trenger ingen forkunnskaper om statistikk eller programmering.
En kortversjon finnes også i appen under **Hjelp** (lenken nederst på siden, eller
adressen `#hjelp`).

> **Tips:** Vil du bare komme i gang? Hopp til [kapittel 1 – På 1 minutt](#1-på-1-minutt).
> Kapittel 4 forklarer ordene som går igjen – les det når du står fast i
> variabelvelgeren.

## Innhold

0. [Hva er Statistikkportalen?](#0-hva-er-statistikkportalen)
1. [På 1 minutt](#1-på-1-minutt)
2. [Forsiden](#2-forsiden)
3. [Finne riktig tabell](#3-finne-riktig-tabell)
4. [Forstå en statistikktabell](#4-forstå-en-statistikktabell)
5. [Velge variabler](#5-velge-variabler)
6. [Lese dataene](#6-lese-dataene)
7. [Tilpasse visningen](#7-tilpasse-visningen)
8. [Hente ut og dele](#8-hente-ut-og-dele)
9. [For viderekomne: API-byggeren](#9-for-viderekomne-api-byggeren)
10. [Ofte stilte spørsmål](#10-ofte-stilte-spørsmål)
- [Ordliste](#ordliste)

---

## 0. Hva er Statistikkportalen?

Statistikkportalen er et **uoffisielt, raskere grensesnitt til SSBs åpne data**.
Tallene er de samme som i Statistikkbanken på ssb.no, hentet direkte fra SSBs
offisielle API (PxWebApi v2).

Med portalen kan du:

- **finne** en tabell ved å søke eller bla gjennom emner,
- **plukke ut** akkurat de tallene du vil ha (et fylke, et år, et kjønn …),
- **se dem** som tabell eller linjediagram,
- **laste ned** til Excel, CSV eller PX, og **dele** en lenke som gjenskaper hele utvalget.

Portalen er ikke SSB selv, men alle tall kommer fra SSB. Dataene er lisensiert under
[CC BY 4.0](https://www.ssb.no/diverse/lisens). Du kan bruke dem fritt så lenge du
oppgir kilden («Kilde: SSB, tabell …»).

---

## 1. På 1 minutt

Den raske veien til et tall. Eksempel: **«Hvor mange bor i Oslo?»**

1. **Søk.** Skriv et søkeord i søkefeltet på forsiden, f.eks. `folkemengde`, og trykk
   Enter. Eller bla deg fram via emneflisene.
2. **Velg en tabell** fra trefflisten. For folketall er *07459 Befolkning* et godt valg.
3. **Velg verdiene du vil ha.** I variabelvelgeren: velg `Oslo` under Geografi og
   `Siste` periode under Tid. La de andre variablene stå som de er.
4. **Klikk «Hent data».**
5. **Utforsk.** Les tabellen. Bytt til linjediagram med 📈-knappen, **roter** den,
   eller **last ned** til Excel.

Det er hele kjernen. Resten av veiledningen forklarer hvert steg grundigere.

---

## 2. Forsiden

Forsiden har tre deler:

- **Søkefeltet** øverst finner tabeller på ID, tittel og variabelnavn. Du kan også
  **lime inn en delelenke fra ssb.no** (en `data.ssb.no`-lenke). Portalen gjenkjenner
  den og åpner riktig uttrekk.
- **Emneflisene** viser SSBs emnehierarki gruppert i seks hovedområder (Befolkning og
  bolig, Arbeid, lønn og utdanning, Økonomi, osv.). Klikk deg fra emne til tabell.
- **«Nylig oppdatert»** lister tabeller som nettopp har fått nye tall, gruppert på
  *Oppdatert i dag*, *I går* / *Fredag* og *Tidligere siste 7 dager*.

Øverst ligger **språkvelgeren** (Norsk / English). Klikk på logoen «Statistikkportalen»
når som helst for å komme tilbake til forsiden.

---

## 3. Finne riktig tabell

### Søk

Søket leter i tabellens **ID, tittel og variabler**. Store og små bokstaver spiller
ingen rolle. Tips for bedre treff:

- **Bruk SSBs fagtermer.** Søk `konsumprisindeks` framfor `KPI`, `folkemengde` framfor
  `befolkning`, `sysselsatte` framfor `jobber`. Den forbedrede søkemodusen (under)
  hjelper med synonymer.
- **Trunkér med `*`** for å fange bøyninger: `anlegg*` treffer både *anlegg* og
  *anleggsvirksomhet*.
- Hver tabell i trefflisten vises som et **kort** med periode, oppdateringsdato,
  frekvens og antall variabler. Avsluttede serier er tydelig merket.

### Filtrer treffene

Over resultatene kan du snevre inn med:

- **Emne** (f.eks. bare *Priser og prisindekser*),
- **Frekvens** (Månedlig / Kvartalsvis / Årlig / Annet),
- **Oppdatert** (siste dag/uke/måned/år),
- **Inkluder avsluttede tabeller** – av som standard. Slå på hvis du leter etter en
  eldre, historisk serie.

### Forbedret søk

**Forbedret søk** er slått på som standard. Det finner flere relevante tabeller ved
hjelp av synonymer og en mer tilgivende matching: «bnp» finner også tabeller om
bruttonasjonalprodukt. Slå det av hvis du bare vil ha treff der søkeordet står i
tittelen, tabellnummeret eller variabelnavnene. Gir søket ingen eksakte treff,
faller portalen automatisk tilbake til omtrentlige («fuzzy») treff.

### Bla via emner

Foretrekker du å lete deg fram, bruk emneflisene på forsiden eller emnemenyen øverst.
Du graver deg nedover: hovedområde → emne → underemne → tabeller. Kortene kan også
brukes med tastaturet: **Tab** flytter fokus mellom dem, **Enter** eller **mellomrom**
åpner.

---

## 4. Forstå en statistikktabell

Dette er kapittelet som gjør resten lett. En SSB-tabell er bygd av noen få byggeklosser:

- **Tabell** – et datasett om ett tema, identifisert med et nummer (f.eks. `07459`).
- **Variabel (dimensjon)** – en egenskap du kan bryte tallene ned på: *Tid*,
  *Geografi (Region)*, *Kjønn*, *Alder*, *Næring* … Hver variabel har et sett **verdier**
  (Geografi har f.eks. alle kommuner og fylker).
- **Statistikkvariabel** – selve *målet*: det som telles. Det kan være et antall
  (personer), en prosent, et kronebeløp eller en indeks. Statistikkvariabelen har
  alltid en **enhet** og et antall desimaler. Se etter den først – den forteller deg
  hva tallene *betyr*.
- **Tid** og **Geografi** er egne *roller* som portalen merker spesielt. Tid styrer
  hvilke perioder du ser; Geografi hvor i landet. Mangler Geografi, gjelder tallene
  **hele landet**.
- **Celle** – ett enkelt tall i tabellen. Antall celler = produktet av hvor mange
  verdier du velger i hver variabel: 5 regioner × 2 kjønn × 10 år = 100 celler.
  API-et har en **øvre grense (800 000 celler)** per uttrekk, så hold utvalget stramt.
- **Obligatorisk vs. valgfri variabel.** En variabel merket **«Må velges \*»** er
  obligatorisk: velg minst én verdi. Tid og Statistikkvariabel er alltid obligatoriske.
  En **«Valgfri variabel»** kan stå tom. Da summerer SSB automatisk over alle verdiene
  (kalt *eliminering*).

> Kjenner du disse seks ordene, er du forbi den bratteste bakken.

---

## 5. Velge variabler

Når du har valgt en tabell, åpnes **variabelvelgeren**. Her bestemmer du nøyaktig hvilke
tall du vil hente. Hvert kort er én variabel. Har SSB en definisjon av variabelen
(f.eks. «Standard for kjønn» i Klass), står lenken **«Definisjon»** øverst i kortet.

Over kortene står **Tabellinfo**. Klikk for å åpne den og lese notene før du velger,
f.eks. om tabellen er erstattet av en nyere tabell eller om referanseåret er endret.

### Slik velger du verdier

- **Klikk** på en verdi for å velge den (og bare den).
- **Shift+klikk** for å velge et sammenhengende **område**.
- **Ctrl/Cmd+klikk** for å legge til eller fjerne **enkeltverdier**.
- **Ctrl+A** velger alle synlige verdier.
- **Filterfeltet** øverst i kortet søker i verdiene – nyttig når en variabel har hundrevis
  av kommuner.

> **På nettbrett og mobil:** Uten tastatur har du ikke Shift/Ctrl/Cmd. Da fungerer et
> **trykk som veksling**: trykk på verdier for å legge dem til eller fjerne dem. Slik
> bygger du et flervalg med fingeren. For større utvalg, bruk filterfeltet sammen med
> knappene **Velg alle** og **Siste**. (Med tastatur eller styreflate får du de vanlige
> snarveiene tilbake.)

Hvert kort har også hurtigknapper: **Velg alle**, **Opphev alle** og, for tidsvariabelen,
**Siste**.

### Spesielle operatorer (særlig for Tid)

I stedet for å klikke deg gjennom mange perioder kan du bruke hurtigknappene, som setter
en operator i spørringen:

| Knapp | Betydning | Operator |
| --- | --- | --- |
| **Velg alle** | Alle verdier i variabelen | `*` |
| **Siste** (med antall) | De *n* nyeste periodene | `top(n)`, f.eks. `top(12)` = siste 12 måneder |

Vil du ha alt fra en bestemt periode og framover, marker periodene til og med den nyeste
med **Shift+klikk**. I GET-URL-en fra API-byggeren (avsnitt 9) blir et slikt valg av flere
enn to perioder til `from(første periode)`, som også tar med nye perioder senere.

Tidsvariabelen viser også et **formathint** så du vet hvordan periodene skrives –
f.eks. `2024M06` for juni 2024, `2024K2` for 2. kvartal.

### Gruppering (kodelister)

Mange variabler kan vises på flere **nivåer**. Under «Gruppering» kan du f.eks. bytte
fra kommune til **fylke**, eller fra detaljerte aldersgrupper til grovere intervaller.
To typer:

- **Verdiutvalg** – viser et utsnitt av de originale kodene (f.eks. bare fylker).
- **Aggregering** – slår sammen verdier til nye grupper (f.eks. «0–4 år»). Portalen
  håndterer dette automatisk og henter korrekte summerte tall.

### Snarvei: «Fyll inn standardvalg»

Vet du ikke hvor du skal begynne? Klikk **«Fyll inn standardvalg»**. Da henter
portalen SSBs anbefalte utvalg – et fornuftig utgangspunkt du kan justere. Særlig
nyttig i store tabeller. Utvalget erstatter valgene du alt har gjort, også
grupperinger og filtertekst.

### Statuslinjen og «Hent data»

Nederst viser **statuslinjen** hvor mange celler du har valgt, og om noe mangler:

- *«Velg minst én verdi for alle obligatoriske variabler»* – du mangler et obligatorisk valg.
- *«… celler valgt (av maks …)»* – alt klart.
- *«For mange celler valgt – reduser utvalget»* / *«overskrider API-grensen på 800 000»* –
  uttrekket er for stort; snevre inn (f.eks. færre perioder med `top(n)`).

Når alt obligatorisk er på plass, klikk **«Hent data»**.

> **Kompaktvisning:** På brede skjermer kan du klikke **«Kompaktvisning»** for å legge
> variabelkortene i flere kolonner. Valget huskes i nettleseren din.

---

## 6. Lese dataene

Tabellen vises med en gjennomtenkt standard: **statistikkvariabelen øverst** som
kolonneoverskrift og **tid nedover** som rader. Smale tabeller stables automatisk for
å utnytte plassen. Overskriftene «fryser» (sticky), så du holder oversikten når du
ruller.

- **Tallformat** er norsk: mellomrom som tusenskilletegn og komma som desimaltegn
  (`1 234,5`).
- **Tomme celler** er ikke feil. De bruker SSBs **statuskoder**:
  - `.` = **ikke aktuelt** (kombinasjonen gir ikke mening),
  - `..` = **ikke tilgjengelig** (tallet finnes ikke / er ikke publisert),
  - `:` = **konfidensielt** (holdt tilbake av personvern­hensyn).
- **Et tall med `*` etter seg** (f.eks. `924 263 *`) er et **foreløpig tall**: tallet
  er publisert, men kan bli revidert. Hold musepekeren over cellen for forklaring.
  I grafen er punktet med, og verktøytipset sier at det er foreløpig.
- **En note i en ramme under tabellen** er en note SSB krever skal følge tallene, for
  eksempel at tabellen erstatter en avsluttet tabell, eller at referanseåret er endret slik
  at endringstall kan avvike fra tidligere publiserte. Den står under grafen også.
  En lenke til en annen tabell i noten (f.eks. «tabell 03013») åpner den tabellen her i
  portalen. Hold inne Ctrl (Cmd på Mac) når du klikker for å åpne den i en ny fane.
- **Tabellinfo** viser kilde, alle notene, lenker til **statistikksiden** og **«Om statistikken»** på
  ssb.no, der du finner definisjoner og forklaringer, og en liste over
  **klassifikasjoner og definisjoner** for variablene (f.eks. «Standard for kjønn»).

---

## 7. Tilpasse visningen

### Roter tabell

Klikk **«Roter tabell»** for å endre oppsettet. Dra dimensjoner mellom **Rader** og
**Kolonner**, eller bruk hurtigvalgene:

- **Standard** – portalens anbefalte oppsett,
- **Transponér** – bytt om rader og kolonner,
- **Alle som rader** / **Alle som kolonner**.

Dialogen kan også betjenes uten mus: **Tab** deg til en dimensjon, flytt den mellom
Rader og Kolonner med **piltast venstre/høyre**, og endre rekkefølgen innad i en sone
med **piltast opp/ned**.

Trykk **«Bruk layout»** for å ta endringen i bruk.

### Vis som diagram (📈)

For tabeller med en tidsdimensjon dukker det opp en **📈-knapp**. Den tegner tallene
som et **linjediagram** i SSBs stil: riktig antall desimaler per statistikkvariabel,
manglende verdier som hull (ikke som nuller), og en kildelinje under figuren.
Har diagrammet mange linjer, foreslår portalen å snevre inn utvalget. Klikk knappen
igjen for å gå tilbake til tabellen.

---

## 8. Hente ut og dele

### Last ned

Klikk **«Last ned i Excel-format»** for rask Excel-eksport, eller **«Flere alternativer»**
for full kontroll:

- **Filformat:** Excel (xlsx), CSV (semikolon-separert) eller PX (PC-Axis).
- **Vis verdier som:** tekst (`Oslo`), koder (`0301`) eller begge (`0301: Oslo`).
- **CSV-separator** og **tabelloppsett** (bl.a. et pivotvennlig oppsett for videre
  arbeid i Excel).
- **Inkluder tabelltittel.**

Filen lastes ned direkte fra SSBs API.

### Få lenke

Klikk **«Få lenke»** for en **bokmerkbar URL** som gjenskaper hele utvalget ditt –
tabell, variabelvalg og layout. Send den til en kollega, eller lagre den selv.

### Lagrede spørringer

Du kan også lagre en spørring hos SSB og få en kort, delbar lenke. Bruker du
**«Siste *n*»** for tid, henter den alltid de **nyeste** periodene – nyttig for rapporter
som skal oppdateres jevnlig. Limer du en slik SSB-lenke inn i søkefeltet, åpner portalen
den direkte.

---

## 9. For viderekomne: API-byggeren

> Dette kapittelet er for deg som vil hente data programmatisk eller bygge integrasjoner.
> Trenger du bare tall, kan du hoppe over det.

I variabelvelgeren ligger **«▶ API-bygger»**. Den genererer et ferdig kall mot SSBs
PxWebApi v2 ut fra det du har valgt:

- **Metode:** velg **GET** (delbar URL) eller **POST** (for store/komplekse uttrekk).
- **Responsformat:** JSON-stat2, CSV, Excel, PX, HTML og JSON-PX. Formater som API-et ikke
  oppgir i `/config`, skjules fra listen.
- **Visning:** verdier som tekst, koder eller begge.
- Kopier **URL** eller **POST-body** med ett klikk, åpne kallet i ny fane, eller hent
  **metadata-URL-en** for tabellen. «Vis i klartekst» endrer bare
  visningen: det som kopieres og åpnes, er alltid den URL-kodede versjonen, slik at
  koder som `105+` kommer riktig fram.

Tidsdimensjonen **optimeres automatisk**. Når valget ditt er sammenhengende og når den
nyeste perioden, skriver URL-en `from(startdato)` eller `top(n)`. Da blir lenken «levende»
og henter alltid ferske tall. Ellers listes periodene enkeltvis, så lenken henter akkurat
dem. Blir en GET-URL for lang, sier portalen fra og foreslår POST.

### Naturlig språk i stedet?

Vil du heller *spørre* med vanlig språk, som «hvor mange bor i Oslo siste 10 år?»
Det finnes egne **skills for AI-assistenter** (f.eks. `ssb-pxwebapi-v2`). De kjenner
hele arbeidsflyten: søk → metadata → spørring → presentasjon med kilde. Portalen er
det menneske-vendte grensesnittet mot det samme API-et.

---

## 10. Ofte stilte spørsmål

**«Ingen data funnet for valgt kombinasjon.»**
Kombinasjonen finnes ikke i tabellen. Endre variabelvalget – ofte er det en periode eller
en region som ikke har tall.

**«For mange celler» / «overskrider API-grensen på 800 000».**
Uttrekket er for stort. Velg færre verdier – bruk f.eks. **Siste *n*** for tid, eller velg
et utvalg regioner i stedet for alle.

**Jeg finner ikke tabellen jeg leter etter.**
Prøv SSBs fagterm (se [kapittel 3](#3-finne-riktig-tabell)). Slå på **Inkluder
avsluttede tabeller** hvis serien er gammel. Sjekk også at **Forbedret søk** er på.

**«Tabellen finnes ikke.»**
Tabellen er fjernet eller erstattet av en ny, eller tabellnummeret er feil. Det skjer
ofte med gamle lenker og bokmerker. Meldingen lenker til SSBs oversikt over endrede og
fjernede tabeller, der du finner hvilken tabell som har tatt over.

**Hvorfor er noen celler tomme (`.`, `..`, `:`)?**
Det er statuskoder, ikke feil: ikke aktuelt, ikke tilgjengelig, eller konfidensielt.
Se [kapittel 6](#6-lese-dataene).

**Jeg får andre tall enn på ssb.no.**
Som regel handler det om **kommunesammenslåinger** eller gruppering. For tidsserier på
kommunenivå gir SSB egne aggregeringer som holder grensene konsistente over tid. Velg
riktig **Gruppering** i variabelvelgeren.

**Appen virker treg eller viser gamle tall.**
Portalen mellomlagrer data for fart. Klikk **«Tøm hurtigbuffer»** nederst på siden for å
hente alt på nytt.

**Bytte språk.**
Bruk språkvelgeren øverst (Norsk / English). Tabelltitler, variabler og verditekster
hentes på nytt i valgt språk.

---

## Ordliste

| Begrep | Betydning |
| --- | --- |
| **Tabell** | Datasett om ett tema, identifisert med et nummer (f.eks. 07459). |
| **Variabel / dimensjon** | Egenskap tallene brytes ned på (Tid, Geografi, Kjønn, Alder …). |
| **Verdi** | Ett alternativ i en variabel (f.eks. «Oslo» i Geografi). |
| **Statistikkvariabel** | Selve målet – hva som telles (antall, prosent, kroner, indeks), med enhet. |
| **Tid** | Tidsdimensjonen – hvilke perioder tallene gjelder. |
| **Geografi (Region)** | Hvor tallene gjelder. Mangler den, gjelder hele landet. |
| **Celle** | Ett tall i tabellen. Antall celler = produktet av valgte verdier. |
| **Obligatorisk («Må velges \*»)** | Variabel du må velge minst én verdi i. |
| **Valgfri variabel / eliminering** | Variabel du kan la stå tom; SSB summerer da over alle verdier. |
| **Gruppering / kodeliste** | Alternativt nivå for en variabel (f.eks. fylke i stedet for kommune). |
| **Aggregering** | Gruppering som slår verdier sammen til nye koder (f.eks. «0–4 år»). |
| **Operator** | Uttrykk i spørringen som velger verdier: alle (`*`) via **Velg alle**, de *n* nyeste (`top(n)`) via **Siste**, og fra og med en periode (`from()`) i API-byggerens GET-URL. |
| **Statuskode** | Symbol for celler uten ordinært tall: `.` ikke aktuelt, `..` ikke tilgjengelig, `:` konfidensielt. `*` etter et tall betyr foreløpig tall. |
| **Layout / rotasjon** | Hvilke variabler som ligger i rader vs. kolonner. |
| **Lagret spørring** | Delbar, gjenbrukbar spørring lagret hos SSB. |
| **API-bygger** | Verktøy som lager GET/POST-kall mot SSBs API ut fra utvalget ditt. |
| **JSON-stat2** | Det åpne dataformatet API-et leverer tall og metadata i. |

---

*Data fra [Statistisk sentralbyrå](https://www.ssb.no/), lisensiert under
[CC BY 4.0](https://www.ssb.no/diverse/lisens). Statistikkportalen er et uoffisielt verktøy.*
