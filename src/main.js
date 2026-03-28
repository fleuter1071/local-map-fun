import { categories, defaultCenter, defaultZoom, getCategoryById, searchRadiusMeters } from "./config.js";
import { createMapController } from "./mapController.js";
import { fetchPlacesForCategory } from "./services/places.js";
import { searchFromBackend } from "./services/searchApi.js";
import { requestCurrentPosition } from "./services/geolocation.js";
import { createAppState } from "./state.js";
import {
  clearPlaceDetails,
  createDomRefs,
  renderChips,
  renderGeocodeCandidates,
  renderPlaceDetails,
  renderResultsError,
  renderResultsList,
  setDetailMode,
  setResultsExpanded,
  setSearchActionVisible,
  updateAddressSearch,
  updateResultsSummary,
  updateSearchAction
} from "./ui/renderers.js";

const state = createAppState();
const refs = createDomRefs(document);
const isLocalFrontend =
  globalThis.location?.hostname === "localhost" ||
  globalThis.location?.hostname === "127.0.0.1";

const mapController = createMapController({
  mapElementId: "map",
  defaultCenter,
  defaultZoom,
  onBackgroundMapClick: () => {
    if (state.activePlaceId) {
      state.activePlaceId = null;
      state.isResultsExpanded = true;
      syncDiscoveryUi();
      return;
    }

    if (state.isResultsExpanded) {
      state.isResultsExpanded = false;
      syncDiscoveryUi();
    }
  },
  onMarkerSelect: (placeId) => {
    selectPlace(placeId);
  },
  onMoveStart: () => {
    if (!state.suppressMoveNotice && hasLocalSearchContext() && state.searchStatus === "ready") {
      state.searchStatus = "stale";
      syncDiscoveryUi();
    }
  },
  onMoveEnd: () => {
    state.suppressMoveNotice = false;
  }
});

function getSelectedCategory() {
  return getCategoryById(state.selectedCategoryId);
}

function getLocalSearchAnchor() {
  return state.userLatLng || mapController.getVisibleCenter();
}

function hasLocalSearchContext() {
  return state.searchMode === "category" || state.searchMode === "name";
}

function getActiveLocalSearchLabel() {
  if (state.searchMode === "category") {
    const category = getSelectedCategory();
    return category?.label || state.localSearchQuery || "Nearby results";
  }

  if (state.searchMode === "name") {
    return state.localSearchQuery || "Nearby results";
  }

  return "";
}

function setLocalSearchContext({ mode = "idle", query = "", categoryId = null } = {}) {
  state.searchMode = mode;
  state.localSearchQuery = query;
  state.canBroadSearch = false;
  state.selectedCategoryId = categoryId;
  refreshCategoryUi();
}

function clearLocalSearchContext() {
  setLocalSearchContext();
  state.searchStatus = "idle";
}

function refreshCategoryUi() {
  renderChips({
    chipRail: refs.chipRail,
    categories,
    selectedCategoryId: state.selectedCategoryId,
    onSelectCategory: (categoryId, shouldSearch) => setSelectedCategory(categoryId, shouldSearch)
  });
}

function updateAddressUi() {
  const messageTone = state.addressSearchStatus === "error" ? "error" : state.addressSearchStatus === "no-result" ? "muted" : "neutral";
  updateAddressSearch(refs, {
    value: state.addressQuery,
    loading: state.addressSearchStatus === "loading",
    message: state.addressSearchMessage,
    messageTone
  });
}

function updateSearchUi() {
  const label = getActiveLocalSearchLabel();
  const isCategorySearch = state.searchMode === "category";

  if (state.geocodeCandidates.length) {
    setSearchActionVisible(refs, false);
    return;
  }

  if (!hasLocalSearchContext()) {
    setSearchActionVisible(refs, false);
    return;
  }

  setSearchActionVisible(refs, true);

  if (state.searchStatus === "loading") {
    updateSearchAction(refs, {
      title: "Searching nearby",
      subtitle: isCategorySearch ? `Looking for ${label.toLowerCase()} nearby.` : `Looking for matches for "${label}".`,
      meta: "Loading",
      disabled: true,
      compact: true
    });
    return;
  }

  if (state.searchStatus === "stale") {
    updateSearchAction(refs, {
      title: "Search this area",
      subtitle: isCategorySearch ? `Refresh ${label.toLowerCase()} for this map view.` : `Refresh matches for "${label}" in this map view.`,
      meta: "Refresh",
      emphasized: true,
      compact: true
    });
    return;
  }

  if (state.searchStatus === "error") {
    updateSearchAction(refs, {
      title: "Try again",
      subtitle: isCategorySearch ? "The nearby places search did not respond for this area." : "The nearby name search did not respond for this area.",
      meta: "Retry",
      emphasized: true,
      compact: true
    });
    return;
  }

  const count = state.currentPlaces.length;
  if (!count) {
    updateSearchAction(refs, {
      title: state.canBroadSearch ? "Show broader results" : isCategorySearch ? `No ${label.toLowerCase()} found` : "No nearby matches found",
      subtitle: state.canBroadSearch
        ? `No strong nearby matches found for "${label}".`
        : "Move the map, then search this area again.",
      meta: state.canBroadSearch ? "Broader" : "Adjust",
      emphasized: state.canBroadSearch,
      compact: true
    });
    return;
  }

  setSearchActionVisible(refs, false);
}

function updateSummaryUi() {
  if (state.geocodeCandidates.length) {
    updateResultsSummary(refs, "Choose a match", `Multiple places match "${state.addressQuery.trim()}"`);
    return;
  }

  const activePlace = findPlaceById(state.activePlaceId);
  if (activePlace) {
    updateResultsSummary(
      refs,
      activePlace.name || "Selected place",
      [activePlace.typeLabel, activePlace.distanceText].filter(Boolean).join(" · ") || "Place details"
    );
    return;
  }

  const label = getActiveLocalSearchLabel();
  const isCategorySearch = state.searchMode === "category";
  if (!hasLocalSearchContext()) {
    updateResultsSummary(refs, "Explore nearby", "Search a place or choose a category");
    return;
  }

  if (state.searchStatus === "loading") {
    updateResultsSummary(refs, isCategorySearch ? `${label} nearby` : `"${label}" nearby`, "Searching current map area");
    return;
  }

  if (state.searchStatus === "stale") {
    updateResultsSummary(refs, isCategorySearch ? `${label} nearby` : `"${label}" nearby`, "Map moved. Search this area to refresh");
    return;
  }

  if (state.searchStatus === "error") {
    updateResultsSummary(refs, isCategorySearch ? `${label} nearby` : `"${label}" nearby`, "Search failed");
    return;
  }

  if (!state.currentPlaces.length) {
    updateResultsSummary(
      refs,
      isCategorySearch ? `${label} nearby` : `"${label}" nearby`,
      state.canBroadSearch
        ? "No strong nearby matches found"
        : isCategorySearch
          ? "No places found in this area"
          : "No nearby matches in this area"
    );
    return;
  }

  updateResultsSummary(
    refs,
    isCategorySearch ? `${label} nearby` : `"${label}" nearby`,
    isCategorySearch
      ? `${state.currentPlaces.length} place${state.currentPlaces.length === 1 ? "" : "s"} in this area`
      : `${state.currentPlaces.length} match${state.currentPlaces.length === 1 ? "" : "es"} in this area`
  );
}

function syncDiscoveryUi() {
  const activePlace = findPlaceById(state.activePlaceId);
  const shouldExpand = activePlace ? true : state.isResultsExpanded;

  setResultsExpanded(refs, shouldExpand);
  setDetailMode(refs, Boolean(activePlace));

  if (activePlace) {
    renderPlaceDetails(refs, activePlace);
  } else if (state.geocodeCandidates.length) {
    clearPlaceDetails(refs);
    renderGeocodeCandidates(refs.resultsList, state.geocodeCandidates, (candidateId) => selectGeocodeCandidate(candidateId));
  } else {
    clearPlaceDetails(refs);
  }

  updateAddressUi();
  updateSearchUi();
  updateSummaryUi();
}

function findPlaceById(placeId) {
  return state.currentPlaces.find((place) => place.id === placeId) || null;
}

function selectPlace(placeId) {
  const place = findPlaceById(placeId);
  if (!place) {
    return;
  }

  state.activePlaceId = place.id;
  state.isResultsExpanded = true;
  state.suppressMoveNotice = true;
  mapController.flyToPlace(place);
  syncDiscoveryUi();
}

function clearResults() {
  state.currentPlaces = [];
  state.activePlaceId = null;
  state.geocodeCandidates = [];
  clearLocalSearchContext();
  mapController.clearResults();
  renderResultsList(refs.resultsList, [], () => {});
}

function selectGeocodeCandidate(candidateId) {
  const candidate = state.geocodeCandidates.find((item) => item.id === candidateId);
  if (!candidate) {
    return;
  }

  state.geocodeCandidates = [];
  state.lastGeocodedPlace = candidate;
  state.addressSearchStatus = "ready";
  state.addressSearchMessage = candidate.label;
  state.suppressMoveNotice = true;
  mapController.setDestination(candidate);
  mapController.flyToDestination(candidate);

  if (hasLocalSearchContext()) {
    state.searchStatus = "stale";
  }

  syncDiscoveryUi();
}

function setRenderedPlaces(places) {
  state.currentPlaces = places;
  state.activePlaceId = null;
  mapController.setResultPlaces(places);
  renderResultsList(refs.resultsList, places, (placeId) => selectPlace(placeId));
}

async function runCategorySearch(category, { center = mapController.getVisibleCenter(), fromSearchBar = false } = {}) {
  setLocalSearchContext({ mode: "category", query: category.label, categoryId: category.id });
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  state.searchStatus = "loading";
  state.geocodeCandidates = [];
  mapController.clearDestination();

  if (fromSearchBar) {
    state.addressSearchStatus = "loading";
    state.addressSearchMessage = `Searching nearby ${category.label.toLowerCase()}.`;
  }

  syncDiscoveryUi();

  if (state.activeFetchController) {
    state.activeFetchController.abort();
  }

  const controller = new AbortController();
  state.activeFetchController = controller;

  try {
    const places = await fetchPlacesForCategory({
      category,
      center,
      radiusMeters: searchRadiusMeters,
      signal: controller.signal
    });

    if (state.activeFetchController !== controller) {
      return;
    }

    setRenderedPlaces(places);
    state.searchStatus = "ready";

    if (fromSearchBar) {
      state.addressSearchStatus = places.length ? "ready" : "no-result";
      state.addressSearchMessage = places.length
        ? `Showing ${category.label.toLowerCase()} near ${state.userLatLng ? "your location" : "this map area"}.`
        : `No nearby ${category.label.toLowerCase()} found.`;
      state.isResultsExpanded = true;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    state.currentPlaces = [];
    state.activePlaceId = null;
    state.searchStatus = "error";
    mapController.clearResults();
    renderResultsError(refs.resultsList, "The places service did not respond. Try again in a moment.");

    if (fromSearchBar) {
      state.addressSearchStatus = "error";
      state.addressSearchMessage = "Nearby search did not respond. Try again.";
    }
  } finally {
    if (state.activeFetchController === controller) {
      state.activeFetchController = null;
    }
    syncDiscoveryUi();
  }
}

function applySearchResponse(query, response, { broadened = false } = {}) {
  state.addressSearchStatus = response.quality === "empty" ? "no-result" : "ready";
  state.addressSearchMessage = response.message || "";
  state.lastGeocodedPlace = null;
  state.geocodeCandidates = [];
  state.activePlaceId = null;
  state.currentPlaces = [];
  state.canBroadSearch = Boolean(response.canBroadSearch);
  mapController.clearDestination();
  mapController.clearResults();
  renderResultsList(refs.resultsList, [], () => {});

  if (response.mode === "category" && response.category) {
    setLocalSearchContext({
      mode: "category",
      query: response.category.label,
      categoryId: response.category.id
    });
    state.searchStatus = response.results?.length ? "ready" : "ready";
  } else if (response.mode === "nearby-name") {
    setLocalSearchContext({
      mode: "name",
      query
    });
    state.canBroadSearch = Boolean(response.canBroadSearch);
    state.searchStatus = response.results?.length || response.canBroadSearch ? "ready" : "ready";
  } else {
    clearLocalSearchContext();
    state.searchStatus = "idle";
  }

  if (response.resultsKind === "places") {
    setRenderedPlaces(response.results || []);
    state.isResultsExpanded = true;

    if (response.anchor === "user-location" && state.userLatLng) {
      state.suppressMoveNotice = true;
      mapController.flyToUserLocation(state.userLatLng);
    }

    if ((response.results || []).length === 1 && !broadened) {
      selectPlace(response.results[0].id);
      return;
    }

    syncDiscoveryUi();
    return;
  }

  if (response.resultsKind === "candidates") {
    state.geocodeCandidates = response.results || [];
    state.isResultsExpanded = Boolean(response.results?.length);

    if ((response.results || []).length === 1) {
      const place = response.results[0];
      state.geocodeCandidates = [];
      state.lastGeocodedPlace = place;
      state.addressSearchStatus = "ready";
      state.addressSearchMessage = response.message || place.label;
      state.suppressMoveNotice = true;
      mapController.setDestination(place);
      mapController.flyToDestination(place);
      syncDiscoveryUi();
      return;
    }

    syncDiscoveryUi();
    return;
  }

  syncDiscoveryUi();
}

async function performSearchRequest(query, { allowBroadFallback = false, centerOverride } = {}) {
  const controller = new AbortController();
  state.activeGeocodeController = controller;
  state.addressSearchStatus = "loading";
  state.addressSearchMessage = allowBroadFallback
    ? `Showing broader results for "${query}".`
    : `Searching for "${query}".`;
  state.geocodeCandidates = [];
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  syncDiscoveryUi();

  const anchor = centerOverride || getLocalSearchAnchor();

  try {
    const response = await searchFromBackend({
      query,
      userLocation: state.userLatLng,
      mapCenter: anchor,
      mapBounds: mapController.getVisibleBounds(),
      allowBroadFallback
    }, {
      signal: controller.signal
    });

    if (state.activeGeocodeController !== controller) {
      return;
    }

    applySearchResponse(query, response, { broadened: allowBroadFallback });
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    const backendUnavailable = isLocalFrontend && error instanceof TypeError;
    state.currentPlaces = [];
    state.activePlaceId = null;
    state.searchStatus = "error";
    state.addressSearchStatus = "error";
    state.addressSearchMessage = backendUnavailable
      ? "Search API is not running. Start node server/index.js."
      : error.message || "Search did not respond. Try again.";
    state.geocodeCandidates = [];
    state.canBroadSearch = false;
    mapController.clearResults();
    renderResultsError(
      refs.resultsList,
      backendUnavailable
        ? "The local search API is unavailable. Start node server/index.js, then try again."
        : error.message || "The search service did not respond. Try again in a moment."
    );
    syncDiscoveryUi();
  } finally {
    if (state.activeGeocodeController === controller) {
      state.activeGeocodeController = null;
    }
  }
}

async function rerunActiveLocalSearch() {
  if (!hasLocalSearchContext()) {
    return;
  }

  await performSearchRequest(state.localSearchQuery || state.addressQuery.trim(), {
    allowBroadFallback: false,
    centerOverride: mapController.getVisibleCenter()
  });
}

async function runAddressSearch({ allowBroadFallback = false } = {}) {
  const query = state.addressQuery.trim();
  if (!query) {
    state.addressSearchStatus = "error";
    state.addressSearchMessage = "Enter an address or place to search.";
    syncDiscoveryUi();
    return;
  }

  if (state.activeGeocodeController) {
    state.activeGeocodeController.abort();
  }

  if (state.activeFetchController) {
    state.activeFetchController.abort();
  }

  await performSearchRequest(query, { allowBroadFallback });
}

function setSelectedCategory(categoryId, shouldSearch = false) {
  setLocalSearchContext({
    mode: categoryId ? "category" : "idle",
    query: getCategoryById(categoryId)?.label || "",
    categoryId
  });
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  state.searchStatus = categoryId ? "stale" : "idle";
  syncDiscoveryUi();

  const category = getCategoryById(categoryId);
  if (shouldSearch && category) {
    runCategorySearch(category);
  }
}

async function syncUserLocation({ recenter = false, initial = false } = {}) {
  try {
    const position = await requestCurrentPosition({ initial });
    const { latitude, longitude } = position.coords;
    const hadLocation = Boolean(state.userLatLng);
    state.userLatLng = { lat: latitude, lng: longitude };
    mapController.setUserLocation(latitude, longitude);

    if (recenter || !hadLocation) {
      state.suppressMoveNotice = true;
      mapController.flyToCoordinates(latitude, longitude, hadLocation ? 0.5 : 0.35);
    }

    updateAddressUi();
  } catch (error) {
    updateAddressUi();
  }
}

refs.resultBar.addEventListener("click", () => {
  if (state.geocodeCandidates.length) {
    state.isResultsExpanded = !state.isResultsExpanded;
    syncDiscoveryUi();
    return;
  }

  if (state.activePlaceId) {
    state.activePlaceId = null;
    state.isResultsExpanded = true;
    syncDiscoveryUi();
    return;
  }

  if (!hasLocalSearchContext() || state.searchStatus === "loading") {
    return;
  }

  state.isResultsExpanded = !state.isResultsExpanded;
  syncDiscoveryUi();
});

refs.searchActionBtn.addEventListener("click", () => {
  if (!hasLocalSearchContext() || state.searchStatus === "loading") {
    return;
  }

  if (state.canBroadSearch && !state.currentPlaces.length) {
    runAddressSearch({ allowBroadFallback: true });
    return;
  }

  if (state.searchStatus === "stale" || state.searchStatus === "error") {
    rerunActiveLocalSearch();
    return;
  }

  if (!state.currentPlaces.length) {
    return;
  }

  state.activePlaceId = null;
  state.isResultsExpanded = !state.isResultsExpanded;
  syncDiscoveryUi();
});

refs.detailBackBtn.addEventListener("click", () => {
  state.activePlaceId = null;
  state.isResultsExpanded = true;
  syncDiscoveryUi();
});

refs.detailCloseBtn.addEventListener("click", () => {
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  syncDiscoveryUi();
});

refs.locateBtn.addEventListener("click", async () => {
  if (state.userLatLng) {
    state.suppressMoveNotice = true;
    mapController.flyToUserLocation(state.userLatLng);
    mapController.openUserPopup();
    return;
  }

  await syncUserLocation({ recenter: true });
});

refs.addressSearchInput.addEventListener("input", (event) => {
  state.addressQuery = event.target.value;
  state.canBroadSearch = false;
  if (state.addressSearchStatus !== "loading") {
    state.addressSearchStatus = "idle";
    state.addressSearchMessage = "";
    syncDiscoveryUi();
  } else {
    updateAddressUi();
  }
});

refs.addressClearBtn.addEventListener("click", () => {
  state.addressQuery = "";
  state.addressSearchStatus = "idle";
  state.addressSearchMessage = "";
  state.lastGeocodedPlace = null;
  state.geocodeCandidates = [];
  state.canBroadSearch = false;
  if (state.activeGeocodeController) {
    state.activeGeocodeController.abort();
    state.activeGeocodeController = null;
  }
  if (state.activeFetchController) {
    state.activeFetchController.abort();
    state.activeFetchController = null;
  }
  mapController.clearDestination();
  syncDiscoveryUi();
  refs.addressSearchInput.focus();
});

refs.addressSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAddressSearch();
});

refreshCategoryUi();
updateAddressUi();
clearResults();
syncDiscoveryUi();
setResultsExpanded(refs, false);
setDetailMode(refs, false);
syncUserLocation({ recenter: true, initial: true });
