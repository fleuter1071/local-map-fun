# local-map-fun

A lightweight local discovery map app built for fast, mobile-friendly exploration.

Users can:
- view a map
- use their current location
- pick place categories
- search the visible area for nearby places
- browse nearby results in a compact list
- open a place detail sheet

## Run Locally
From the repo root:

```powershell
python -m http.server 3000
```

Then open:

`http://localhost:3000`

## Current Architecture
This app currently uses a frontend-only architecture.

What that means in plain language:
- the browser loads the page directly
- Leaflet handles the map
- the browser asks the Overpass API for nearby places
- there is no backend server yet for caching, rate limiting, or data shaping

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
- `src/services/places.js`
  - Overpass query building, fetches, and place normalization
- `src/ui/renderers.js`
  - chips, sheets, result list, and place detail rendering
- `src/utils.js`
  - shared helpers

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
- category selection
- `More` sheet open/close
- `Search this area`
- map marker rendering
- result list expand/collapse
- place detail sheet
- location recenter flow

## Recommended Direction
Near-term direction:
- stay frontend-only
- keep the modular structure clean
- continue separating map logic, search logic, and rendering logic

Longer-term direction:
- if reliability or scale becomes a problem, add a thin backend proxy for place search
- do not jump to a large framework rewrite unless product scope clearly demands it
