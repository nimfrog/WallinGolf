# WallinMatch 🏳️⛳

Mobilanpassad webbapp för att hantera en liten golfturnering i **singel matchspel**
för exakt fyra spelare som går tillsammans i samma boll.

Alla fyra spelar samtidigt på samma bana, men varje runda består av två separata
1‑vs‑1‑matcher. Alla möter alla exakt en gång: **4 spelare · 3 rundor · 6 matcher**.

Appen är byggd mobile‑first, kräver ingen inloggning och ingen backend – all data
sparas lokalt i webbläsaren (`localStorage`) och en pågående turnering återställs
automatiskt efter omladdning.

## Teknik

- **React 19** + **TypeScript**
- **Vite 6** (dev-server och build)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Vitest** + **Testing Library** för tester

## Kom igång

```bash
npm install      # installera beroenden
npm run dev      # starta utvecklingsservern (öppna länken i mobilen/desktop)
```

Öppna adressen som Vite skriver ut (t.ex. `http://localhost:5173`).

### Övriga kommandon

```bash
npm run build      # typcheck + produktionsbygge till dist/
npm run preview    # förhandsvisa produktionsbygget
npm run typecheck  # enbart TypeScript-kontroll
npm run lint       # ESLint
npm test           # kör alla tester en gång
npm run test:watch # tester i watch-läge
```

## Projektstruktur

```
src/
  types.ts                 Datamodeller (Player, Course, Tournament, Match, ...)
  logic/                   Ren, testbar spellogik (ingen React)
    schedule.ts            generateRoundRobinSchedule()
    handicap.ts            slagfördelning + nettoscore
    match.ts               calculateMatchState() / determineMatchResult()
    rounds.ts              hjälpare på rundnivå
    standings.ts           calculateStandings()
    validation.ts          validering med svenska felmeddelanden
    __tests__/             enhetstester för spellogiken
  storage/                 localStorage-lagring
  state/AppContext.tsx     app-tillstånd + persistens
  ui/                      återanvändbara komponenter (knappar, kort, tabeller ...)
  screens/                 skärmar (hem, guide, runda, resultat, historik)
  App.tsx                  enkel skärmbaserad navigation
```

## Spellogik i korthet

- **Slagfördelning:** spelaren med lägst spelhandicap i matchen spelar från 0.
  Motståndaren får skillnaden, fördelad efter Stroke Index. Fungerar även när
  slagen är fler än antalet hål:
  `slag per hål = floor(total / antal hål)` + 1 extra på de
  `total % antal hål` hålen med lägst Stroke Index.
- **Matchställning:** byggs alltid om från samtliga registrerade hålscorer –
  aldrig enbart inkrementellt. Ändrar man en tidigare score räknas hålvinnare,
  ställning, ett eventuellt tidigt avgörande (t.ex. `3&2`) och slutresultatet om.
- **Avgörande i förtid:** en match är avgjord när ledningen är större än antalet
  återstående hål (`3&2`, `2&1` osv). Score kan fortsätta registreras även efter
  att en match är avgjord.
- **Poäng:** vinst 1, delad match 0,5 vardera, förlust 0. Tabellen sorteras på
  poäng och delar placering vid lika poäng.

## Data & integritet

All data lagras enbart i din egen webbläsare under nyckeln `wallinmatch:v1`.
Inget skickas till någon server.
