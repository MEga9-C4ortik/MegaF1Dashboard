# Mega F1 Dashboard

A Formula 1 dashboard built with React. Browse the full season calendar, driver and constructor standings, race results, and a Pit Wall with session replay — all powered by live F1 data APIs.

**[Live Demo →](https://mega-f1-dashboard.vercel.app/)**

---

## Features

**Calendar** — Full season schedule with race weekends, session times, sprint weekends, and quick access to results.

**Standings** — Driver and Constructor championship standings for any season.

**Race Results** — Race, qualifying, and sprint results with detailed breakdown per round.

**Pit Wall** — The main feature. A replay session viewer with:
- Live timing tower (positions, gaps, intervals, lap times)
- Tyre stint tracking and pit stop history
- FIA race control messages
- Team radio messages
- Live track map with driver positions
- Weather bar (air/track temp, humidity, wind, rain)

---

## Tech Stack

- **React** (Vite) — UI and routing
- **React Router** — client-side navigation
- **CSS Modules** — scoped component styling
- **Jolpica API** — season calendar, standings, race/qualifying/sprint results
- **OpenF1 API** — real-time session data (positions, laps, stints, pits, radio, weather, track map)

---

## Architecture Highlights

**Incremental data fetching** — after the initial load, the Pit Wall only fetches data newer than the last poll window (35s), avoiding redundant large requests.

**Rate limit handling** — all API calls include 429-aware error handling with sequential delays between requests to stay within OpenF1's limits.

**Session caching** — static session data (drivers, stints, pits, FIA messages, radio) is cached in memory after the first fetch and reused across re-renders.

**Replay engine** — `useReplay` hook reconstructs historical state at any point in time by filtering time-series data (positions, intervals, pits, messages) against a seekable timestamp.

**Dual API layer** — `JolpiApi.jsx` and `openf1Api.jsx` are cleanly separated service modules. All data fetching goes through a `safeFetch` wrapper with proper error handling per API's quirks (e.g. OpenF1 returns 404 instead of empty array when no data exists).

---

## Getting Started

```bash
git clone https://github.com/MEga9-C4ortik/MegaF1Dashboard.git
cd MegaF1Dashboard
npm install
npm run dev
```

No API keys required — both Jolpica and OpenF1 are public APIs.

---

## Project Structure

```
src/
├── components/
│   ├── pitWall/        # LiveTower, Map, FiaMessages, RadioMessages, Weather, ReplayControls
│   └── shared/         # Navbar
├── hooks/
│   ├── useLiveData     # Orchestrates all OpenF1 real-time fetching
│   ├── useReplay       # Session replay engine
│   ├── useSessionBrowser
│   ├── useOpenF1Sessions
│   ├── useRaces
│   ├── useRaceResult
│   └── useStandings
├── pages/
│   ├── Calendar
│   ├── Standings
│   ├── Race
│   ├── PitWall
│   └── NotFound
└── services/
    ├── JolpiApi        # Ergast/Jolpica API — historical F1 data
    ├── openf1Api       # OpenF1 API — real-time session data
    └── SessionCache    # In-memory cache for static session data
```

---

## Known Limitations

- Replay is only available ~30 minutes after a session ends (OpenF1 data delay)
- Historical Pit Wall data depends on OpenF1 coverage (2023+)

---

## Author

Built by [Mergen Ovezov](https://github.com/MEga9-C4ortik) — CS student at Sunway University, Malaysia.