# local-map-fun

A lightweight local discovery map app built for fast, mobile-friendly exploration.

Users can:
- view a map
- use their current location
- search an address or place and jump the map there
- pick place categories
- search the visible area for nearby places
- browse nearby results in a compact list
- open place details in the shared discovery sheet

## Run Locally
From the repo root:

Start the search API:

```powershell
node server/index.js
```

In a second terminal, start the static frontend:

```powershell
python -m http.server 3000
```

Then open:

`http://localhost:3000`

Local API health check:

`http://localhost:8787/health`

## Deploy On Render
This repo now includes a Render Blueprint at [render.yaml](C:/Users/dougs/local-map-fun/render.yaml) that defines:
- `local-map-fun-api`
  - Node web service for `server/index.js`
- `local-map-fun-web`
  - static frontend service built from `dist/`

How to deploy:
- push the latest `main`
- in Render, create a new Blueprint service from this repo
- let Render create both services from `render.yaml`
- confirm the API service comes up first
- then open the static site and verify top-bar search

The static build injects `SEARCH_API_ORIGIN` into `runtime-config.js`, so the frontend points at:
- `https://local-map-fun-api.onrender.com`

If you rename the API service in Render, update `SEARCH_API_ORIGIN` in [render.yaml](C:/Users/dougs/local-map-fun/render.yaml) to match.

## Current Architecture
This app currently uses a frontend-only architecture.

What that means in plain language:
- the browser loads the page directly
- Leaflet handles the map
- the browser renders the UI and map interactions
- a small local/backend search API now handles top-bar search orchestration
- category chip search still uses Overpass directly from the browser today

This repo was recently refactored from a single-file prototype into a modular frontend structure.

## File Structure
- `index.html`
  - page shell only
- `styles/main.css`
  - app styling
- `src/main.js`
  - app coordinator that wires the modules together
- `src/config.js`
  - categories and app defaults
- `src/state.js`
  - in-memory app state
- `src/mapController.js`
  - Leaflet setup and marker behavior
- `src/services/geolocation.js`
  - browser geolocation access
- `src/services/geocoding.js`
  - address and place lookup for map repositioning and ambiguous-match selection
- `src/services/places.js`
  - Overpass query building, fetches, and place normalization
- `src/services/searchApi.js`
  - frontend client for the local/backend search API
- `src/ui/renderers.js`
  - chips, sheets, result list, and place detail rendering
- `src/utils.js`
  - shared helpers
- `server/index.js`
  - local/backend API entrypoint
- `server/services/searchOrchestrator.js`
  - query routing and provider orchestration for top-bar search
- `server/providers/nominatim.js`
  - backend Nominatim client
- `server/providers/overpass.js`
  - backend Overpass client for backend-routed category search

## Repo Guidance Files
- `AGENTS.md`
  - stable repo guidance for future agent sessions
  - explains architecture, workflow preferences, and collaboration style
- `PROJECT_MEMORY.md`
  - running historical memory for large changes, feature releases, architectural decisions, and next steps

## How To Use PROJECT_MEMORY.md
Add an entry:
- at the end of a session with meaningful work
- after a large feature release
- after an architectural change

Keep entries focused on:
- what changed
- why it mattered
- technical decisions made
- known limitations
- what remains to do

## QA Areas
When testing manually, focus on:
- address/place search success, failure, and no-result states
- ambiguous place-name search and multi-result picker behavior
- map fly-to after searched destination
- category selection
- temporary destination marker behavior
- persistent locate control and recenter flow
- search-state button copy and action across idle, loading, stale, error, and ready states
- `Search this area`
- map marker rendering
- result summary bar expand/collapse
- shared discovery sheet list/detail transitions
- place detail open/back/close behavior

## Recommended Direction
Near-term direction:
- stay frontend-only
- keep the modular structure clean
- continue separating map logic, search logic, and rendering logic

Longer-term direction:
- if reliability or scale becomes a problem, add a thin backend proxy for place search
- do not jump to a large framework rewrite unless product scope clearly demands it
