# AGENTS.md

## Purpose
This repository contains a local map exploration web app. Use this file as the stable working guide for future sessions in this repo.

Keep this file focused on how to work in the repo. Do not use it as a feature history log.

## Product Summary
- This is a lightweight local discovery app built around a map.
- Users can:
  - view a map
  - use their current location
  - search an address or place and move the map there
  - choose place categories
  - search the visible area for nearby places
  - browse a compact result list
  - open place details in the shared discovery sheet
- The current product style is mobile-first, fast, and minimal.
- The current flow uses:
  - a top address/place search bar
  - a persistent locate control
  - a category strip directly below the search bar
  - a search-state button that changes based on search status
  - one bottom discovery sheet for both results and place details

## Current Architecture
- Static frontend plus a thin search backend.
- Frontend is still a lightweight browser app.
- Backend is a small Node service for top-bar search orchestration.
- Static app can still be served locally or from static hosting.
- Mapping library: Leaflet.
- Top-bar search is routed through the backend.
- Category chip search still uses Overpass API from the browser today.
- Geolocation: browser `navigator.geolocation`.

## File Structure
Core app files:
- `index.html`: page shell only
- `styles/main.css`: app styling
- `src/main.js`: app coordinator / wiring
- `src/config.js`: categories and app defaults
- `src/state.js`: in-memory app state
- `src/mapController.js`: Leaflet setup and marker behavior
- `src/services/geolocation.js`: browser geolocation access
- `src/services/geocoding.js`: address/place lookup, result biasing, and ambiguous-match selection
- `src/services/places.js`: Overpass query building, fetches, and place normalization
- `src/services/searchApi.js`: frontend client for the backend search API
- `src/ui/renderers.js`: chips, sheets, result list, and place detail rendering
- `src/utils.js`: shared helpers
- `server/index.js`: backend entrypoint
- `server/services/searchOrchestrator.js`: backend query routing and fallback logic
- `server/providers/nominatim.js`: backend Nominatim client
- `server/providers/overpass.js`: backend Overpass client

## Working Principles For This Repo
- Keep the backend thin and focused on search orchestration, provider control, and reliability.
- Prefer boring, maintainable JavaScript modules over a framework rewrite.
- Keep map behavior, data-fetch behavior, and UI rendering separated.
- Make small, coherent changes instead of large rewrites.
- Maintain the current mobile-first interaction model unless asked to redesign it.

## Recommended Near-Term Architecture Direction
- Continue with modular frontend files plus the thin backend search layer.
- Route search logic that needs provider choice, fallback control, or reliability handling through the backend.
- Do not jump to a full framework or large platform redesign unless product scope clearly demands it.

## Reliability Guidance
- Treat Overpass API as an unstable dependency.
- Treat free geocoding as a best-effort dependency with rate limits and occasional misses.
- Use the backend to make fallback behavior explicit instead of silently swapping local intent for broad global results.
- For ambiguous place-name queries, prefer showing a short candidate picker over auto-jumping to a weak global match.
- Keep request cancellation behavior when starting a new search.
- Prefer explicit loading, empty, and error states.
- If adding new data providers later, normalize all results into a stable internal `Place` shape before rendering.

## UX Guidance
- Preserve the current compact map-first design.
- Keep the address search bar, locate control, category selection, search-state action, and shared discovery sheet behavior simple and legible.
- Avoid cluttering the map with too many panels or controls.
- Keep destination search as the primary top-of-screen control and avoid reintroducing large orientation banners.
- Any new feature should be evaluated in terms of map clarity and tap-target quality on mobile.

## Collaboration Style For This Repo
When working with the user in this repo:
- Use concise, plain language, non-technical. Do not be verbose or over explain.
- Explain what you are doing and why you are doing it in non-technical language.
- Define technical terms in simple language when needed.
- Assume the user may be acting as a less technical product manager.
- Connect the dots between:
  - user-facing behavior
  - design decisions
  - app architecture
  - concrete code changes
- If recommending an architecture change, explain the user value succinctly, not just the engineering benefit.

## Run And Verify
Simple local run option:
- from repo root, start backend: `node server/index.js`
- in a second terminal, start frontend: `python -m http.server 3000`
- open: `http://localhost:3000`

Basic manual QA areas:
- address/place search success, failure, and no-result handling
- ambiguous place-name search and candidate-picker selection
- map fly-to after searched destination
- category selection
- temporary destination marker behavior
- persistent locate control and recenter flow
- search-state button behavior across idle, loading, stale, error, and ready states
- `Search this area`
- map marker rendering
- result summary bar expand/collapse
- shared discovery sheet list/detail transitions
- place detail open/back/close behavior

## Documentation Guidance
If meaningful work is completed in this repo, add a short repo memory file later if useful.
For now, keep `AGENTS.md` as the stable operating guide.

## Deployment Workflow
- Production deploys are done by pushing `main` to `origin`.
- Before deploy:
  - stage only intended app and docs files
  - do not include local log files such as `http-server.log` or `http-server-error.log`
  - add a short `PROJECT_MEMORY.md` entry for meaningful production-facing changes
  - run lightweight syntax or sanity checks when relevant
- Preferred git flow:
  - `git status`
  - `git diff --cached --stat`
  - `git commit -m "..."`
  - `git push origin main`
- If common git approval prefixes are available, use them to streamline deploys.
