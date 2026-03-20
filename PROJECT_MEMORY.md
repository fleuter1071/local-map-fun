# PROJECT_MEMORY.md

This file is the running project memory for `local-map-fun`.

Use it to record meaningful work at the end of a session or after a large feature, release, or architectural change.

## Entry Template

## Date/time
YYYY-MM-DD HH:MM:SS Z

## Feature name, description, and value provided
Feature name:
Description:
Value provided:

## Files changed
- path/to/file
- path/to/file

## Technical Architecture changes or key technical decisions made
- ...

## Assumptions
- ...

## Known limitations
- ...

## Key learnings that you can bring with you to future sessions
- ...

## Remaining TODOs
- ...

## Next steps
1. ...
2. ...
3. ...

---

## Usage Notes
- Add a new entry for major work, not every tiny edit.
- Prefer concise, factual notes over long storytelling.
- Keep entries focused on what changed, why it matters, and what still needs attention.
- Treat this as the main historical memory file for the repo.

## Date/time
2026-03-18 22:15:00 -04:00

## Feature name, description, and value provided
Feature name: Modular Frontend Refactor Baseline + Repo Guidance Files
Description: Refactored the map app from a single-file `index.html` into a frontend-only modular structure with separate files for styles, app coordination, map behavior, place-search services, UI rendering, state, configuration, and shared utilities. Added `AGENTS.md` as the stable repo operating guide and created `PROJECT_MEMORY.md` as the structured historical memory file for future sessions.
Value provided: Makes the app easier to maintain, safer to extend, and easier to reason about without adding backend complexity yet. Also improves future session continuity by documenting repo workflow, architecture, and change history expectations.

## Files changed
- C:\Users\dougs\local-map-fun\index.html
- C:\Users\dougs\local-map-fun\styles\main.css
- C:\Users\dougs\local-map-fun\src\main.js
- C:\Users\dougs\local-map-fun\src\config.js
- C:\Users\dougs\local-map-fun\src\state.js
- C:\Users\dougs\local-map-fun\src\mapController.js
- C:\Users\dougs\local-map-fun\src\utils.js
- C:\Users\dougs\local-map-fun\src\services\geolocation.js
- C:\Users\dougs\local-map-fun\src\services\places.js
- C:\Users\dougs\local-map-fun\src\ui\renderers.js
- C:\Users\dougs\local-map-fun\AGENTS.md
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- Moved from single-file architecture to modular frontend-only architecture while keeping the app static-hostable.
- Kept Leaflet and direct browser-based Overpass queries for now instead of adding a backend.
- Separated responsibilities into:
  - page shell
  - styling
  - app coordinator
  - state
  - map controller
  - geolocation service
  - places service
  - UI renderers
  - shared utilities
- Chose a “boring” modular JavaScript approach instead of introducing a frontend framework.
- Added repo-level guidance files so future sessions can start with stable project context.

## Assumptions
- The current app should remain frontend-only for now.
- Static hosting simplicity is still more valuable than adding a backend immediately.
- The current map-first, mobile-first interaction model should remain the product baseline.
- Overpass API remains the active place-search source unless future reliability needs force a backend proxy or provider change.

## Known limitations
- No backend exists yet for caching, throttling, or shielding the app from Overpass instability.
- No automated test suite exists for this repo yet.
- Browser-level validation after the refactor was manual rather than automated.
- The app still depends directly on third-party map and place-search services from the browser.

## Key learnings that you can bring with you to future sessions
- This app was originally a single `index.html` prototype and now has a modular frontend structure.
- The repo’s current architecture intentionally stays simple: no framework and no backend yet.
- Clear separation between map logic, place-search logic, and UI rendering is the main architectural improvement.
- `AGENTS.md` should be read early in future sessions to align on architecture and collaboration style.
- `PROJECT_MEMORY.md` is now the main place to record large changes, releases, and architectural decisions.

## Remaining TODOs
- Run a more thorough browser QA pass on all core interactions after the modular refactor.
- Consider adding a lightweight local/dev workflow document or README if onboarding guidance is needed beyond `AGENTS.md`.
- Decide when to add a thin backend proxy for better reliability, caching, and observability.
- Add an automated validation approach later if the app grows beyond lightweight manual QA.

## Next steps
1. Do a focused browser smoke test of category selection, search area, results, detail sheet, and recenter behavior after the refactor.
2. Commit the new modular structure plus repo guidance files once validated.
3. Decide whether the next architecture move should be UX enhancement work or a reliability-focused backend proxy.

## Date/time
2026-03-19 18:40:00 -04:00

## Feature name, description, and value provided
Feature name: Guided Map UX Redesign for Mobile Discovery Flow
Description: Redesigned the app around a clearer map-first discovery flow with a persistent context header, unified category strip, search-status control that expands only when guidance is needed, and a single bottom sheet for results and place details. Follow-up iteration reduced mobile sheet height and collapsed the search-status control into a compact pill while browsing results so the map stays more visible.
Value provided: Makes the app easier to understand on first use, reduces competing overlays, preserves more map context on mobile, and gives users a clearer progression from choosing a category to reviewing results to opening a place.

## Files changed
- C:\Users\dougs\local-map-fun\index.html
- C:\Users\dougs\local-map-fun\styles\main.css
- C:\Users\dougs\local-map-fun\src\main.js
- C:\Users\dougs\local-map-fun\src\state.js
- C:\Users\dougs\local-map-fun\src\ui\renderers.js
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- Replaced the prior multi-overlay interaction model with a guided top-to-bottom flow.
- Unified result browsing and place details inside one shared discovery sheet.
- Added explicit search-state handling so the UI can distinguish idle, loading, stale, error, and ready states.
- Changed the search-status control to expand during guidance states and collapse during list/detail browsing to preserve map space.
- Tightened mobile sheet-height limits after visual QA to keep the experience map-first.

## Assumptions
- The app should continue prioritizing mobile map visibility over showing many results at once.
- A compact top status pill is sufficient while the user is already in the list or detail flow.
- Manual browser QA is still the primary validation method for this repo at the current stage.

## Known limitations
- The redesign has passed syntax checks and manual visual feedback loops, but it has not been regression-tested across multiple devices and browsers.
- Result density is still intentionally conservative on mobile, which may trade off some scanning efficiency for map visibility.
- Search relies on Overpass API from the browser and still inherits its latency and reliability issues.

## Key learnings that you can bring with you to future sessions
- The strongest UX issue was not visual style but control competition and redundant UI layers.
- The top search/status element should only remain large while guiding the map workflow; once users enter list/detail mode it should shrink.
- Mobile sheet height needs to be tightly constrained or the experience quickly stops feeling map-first.

## Remaining TODOs
- Run a broader browser/device QA pass on the redesigned mobile layout and the new compact search-status behavior.
- Consider further tuning the results density if users still feel the list is too dominant on smaller screens.
- Update README QA notes later to reflect the current control model instead of the pre-redesign one.

## Next steps
1. Push the redesign to production and validate the live build on a real mobile device.
2. Decide whether to keep tuning map/list balance or move next to reliability work around Overpass instability.
3. Refresh repo docs where the old `More` sheet and previous search interaction are still mentioned.
