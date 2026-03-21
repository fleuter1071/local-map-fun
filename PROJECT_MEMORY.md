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

## Date/time
2026-03-20 10:45:00 -04:00

## Feature name, description, and value provided
Feature name: Temporary Orientation Header + Persistent Locate Control
Description: Split the always-available recenter action from the large orientation header so the top heading can disappear after the user starts interacting. The location button now persists independently, while the large context header auto-collapses after meaningful engagement such as searching, moving the map, or opening results.
Value provided: Reduces top-of-screen clutter on small mobile screens, preserves map space after the user is oriented, and keeps the essential recenter utility available at all times.

## Files changed
- C:\Users\dougs\local-map-fun\index.html
- C:\Users\dougs\local-map-fun\styles\main.css
- C:\Users\dougs\local-map-fun\src\main.js
- C:\Users\dougs\local-map-fun\src\state.js
- C:\Users\dougs\local-map-fun\src\ui\renderers.js
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- Added explicit UI state for whether the large context header is collapsed.
- Decoupled the persistent locate control from the temporary orientation header.
- Chose auto-collapse after engagement instead of a manual close action to reduce decision overhead and chrome on mobile.

## Assumptions
- Users only need the large orientation header briefly at the start of the flow.
- The selected category chip, search-status control, and bottom sheet provide enough ongoing context after the header collapses.
- The locate action must remain available regardless of header visibility.

## Known limitations
- The collapse behavior is tuned for the current mobile-first flow and has not been adapted for any future broader desktop-specific top navigation.
- The README QA notes still describe older interactions and should be refreshed later.

## Key learnings that you can bring with you to future sessions
- Persistent utility actions and temporary orientation messaging should not share the same surface on a small mobile map UI.
- Auto-collapse is better than a manual dismiss control here because it removes chrome without adding another decision.
- The app’s biggest UX wins are coming from subtracting repeated UI, not adding more states or components.

## Remaining TODOs
- Refresh repo docs so the described QA flow matches the current header/search/result behavior.
- Continue validating whether any remaining top-of-screen copy can be shortened further on very small devices.

## Next steps
1. Push the temporary-header update to production now that mobile browser QA has passed.
2. Confirm the live production build preserves the lighter top-of-screen layout on a real phone.
3. Decide whether the next pass should tune copy density further or shift to reliability work.

## Date/time
2026-03-20 11:20:00 -04:00

## Feature name, description, and value provided
Feature name: Repo Docs Alignment For Guided Discovery Flow
Description: Updated repo guidance docs so they describe the current map app behavior instead of the older pre-redesign interaction model. The docs now reference the persistent locate control, temporary orientation header, search-state button, and shared discovery sheet flow.
Value provided: Reduces future session confusion, keeps QA guidance aligned with the live UI, and makes repo onboarding more reliable for product and engineering work.

## Files changed
- C:\Users\dougs\local-map-fun\README.md
- C:\Users\dougs\local-map-fun\AGENTS.md
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- No product architecture changed.
- Treated the doc mismatch as repo maintenance work so future sessions do not reason from removed UI patterns.

## Assumptions
- The current guided discovery flow is the intended baseline for upcoming work.
- Repo docs should describe the current live interaction model, not earlier intermediate states.

## Known limitations
- This update aligns docs with the current UI flow but does not add automated validation.
- Runtime reliability risks around direct browser-to-Overpass requests remain unchanged.

## Key learnings that you can bring with you to future sessions
- The repo recently moved fast on UX simplification, so docs can drift quickly if not refreshed after each UI pass.
- The current mental model is a map-first flow with one shared bottom sheet, not multiple competing panels.

## Remaining TODOs
- Refresh any future product notes promptly when the guided flow changes again.
- Consider a short release checklist if doc drift keeps recurring after UI work.

## Next steps
1. Use the updated QA checklist for future manual validation passes.
2. Keep the repo docs synchronized with any further map-flow changes.
3. Shift back to product or reliability work once the doc cleanup is committed.

## Date/time
2026-03-20 11:45:00 -04:00

## Feature name, description, and value provided
Feature name: Bottom-Right Locate Control + Top-Slot Category Recovery
Description: Moved the locate action out of the crowded top stack into a floating bottom-right map control and let the category chips rise into the reclaimed top slot once the temporary orientation header collapses. Also moved Leaflet zoom controls to the bottom-left so the map utilities do not compete for the same corner.
Value provided: Preserves more vertical map space after orientation, makes the persistent utility action easier to reach on mobile, and reduces top-of-screen clutter without removing category access.

## Files changed
- C:\Users\dougs\local-map-fun\index.html
- C:\Users\dougs\local-map-fun\styles\main.css
- C:\Users\dougs\local-map-fun\src\mapController.js
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- Kept the existing UI state model and changed layout placement rather than adding new interaction states.
- Split persistent map utilities across bottom corners so locate and zoom controls remain visually distinct.

## Assumptions
- The floating locate action should remain available even while the discovery sheet is collapsed.
- The category rail is important enough to stay immediately accessible after orientation copy disappears.

## Known limitations
- The locate control uses a fixed offset above the collapsed sheet and may need tuning if the sheet peek height changes later.
- This layout pass improves spacing but does not yet add animated transitions for the collapsing header.

## Key learnings that you can bring with you to future sessions
- The top stack works better when it focuses on category and search context rather than persistent utility controls.
- Reclaiming the header slot after orientation is a strong way to protect map space without hiding core actions.

## Remaining TODOs
- Validate the new control placement on a real phone and on smaller mobile browser chrome states.
- Tune the floating locate offset later if sheet height or bottom safe-area behavior changes.

## Next steps
1. Run a manual mobile QA pass on locate reachability, chip positioning, and bottom-corner control overlap.
2. Confirm the new bottom-right control does not fight the discovery sheet during list/detail browsing.
3. Refine transitions later if the header collapse still feels too abrupt in browser testing.

## Date/time
2026-03-20 15:30:00 -04:00

## Feature name, description, and value provided
Feature name: Address Search Top-Bar Refactor
Description: Replaced the temporary orientation header with a persistent address/place search bar at the top of the app, added a separate geocoding service for best-match destination search, and kept the category and nearby-results flow below it. Successful searches now move the map to the matched destination and drop a temporary destination marker.
Value provided: Makes the app feel more like a familiar map tool, lets users explore around any searched destination instead of only their current location, and simplifies the top-of-screen hierarchy by removing orientation chrome.

## Files changed
- C:\Users\dougs\local-map-fun\index.html
- C:\Users\dougs\local-map-fun\styles\main.css
- C:\Users\dougs\local-map-fun\src\main.js
- C:\Users\dougs\local-map-fun\src\state.js
- C:\Users\dougs\local-map-fun\src\mapController.js
- C:\Users\dougs\local-map-fun\src\services\geocoding.js
- C:\Users\dougs\local-map-fun\src\ui\renderers.js
- C:\Users\dougs\local-map-fun\README.md
- C:\Users\dougs\local-map-fun\AGENTS.md
- C:\Users\dougs\local-map-fun\PROJECT_MEMORY.md

## Technical Architecture changes or key technical decisions made
- Added a dedicated geocoding service instead of mixing address lookup into the nearby-places service.
- Removed the temporary header state path and promoted destination search to the primary top-of-screen control.
- Kept address lookup and nearby category search as separate user actions so map movement stays predictable.

## Assumptions
- Best-match destination search is sufficient for the first version without an intermediate result picker.
- The app should continue using no-cost third-party browser APIs for now, accepting best-effort reliability.
- Searching for an address or place should move the map but not automatically run nearby category search.

## Known limitations
- The free geocoder may miss ambiguous queries or rate-limit more aggressively than a paid provider.
- No autocomplete or multi-result disambiguation is included in this version.
- Validation remains limited to syntax checks until a browser QA pass is completed.

## Key learnings that you can bring with you to future sessions
- Once destination search exists, the temporary orientation header becomes unnecessary UI weight.
- Keeping destination search and nearby category search separate preserves user control and avoids surprising automatic refreshes.
- Free geocoding is valuable for scope and cost control, but the UI needs graceful failure states because reliability is not guaranteed.

## Remaining TODOs
- Run browser QA on mobile for keyboard behavior, destination-marker clarity, and interaction between searched destinations and category refresh.
- Decide later whether the app needs a small result picker for ambiguous searches.
- Revisit provider strategy if traffic or reliability expectations increase.

## Next steps
1. Do a browser smoke test of address search success, failure, and no-result cases.
2. Validate that selected categories correctly transition to `Search this area` after a destination search.
3. Decide whether to ship this directly or tune spacing and copy after mobile testing.
