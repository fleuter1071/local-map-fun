import { categories, defaultCenter, defaultZoom, getCategoryById, searchRadiusMeters } from "./config.js";
import { createMapController } from "./mapController.js";
import { geocodeQuery } from "./services/geocoding.js";
import { fetchPlacesForCategory } from "./services/places.js";
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
    if (!state.suppressMoveNotice && state.selectedCategoryId && state.searchStatus === "ready") {
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
  const category = getSelectedCategory();

  if (state.geocodeCandidates.length) {
    setSearchActionVisible(refs, false);
    return;
  }

  if (!category) {
    setSearchActionVisible(refs, false);
    return;
  }

  setSearchActionVisible(refs, true);

  if (state.searchStatus === "loading") {
    updateSearchAction(refs, {
      title: "Searching current area",
      subtitle: `Looking for ${category.label.toLowerCase()} nearby.`,
      meta: "Loading",
      disabled: true,
      compact: true
    });
    return;
  }

  if (state.searchStatus === "stale") {
    updateSearchAction(refs, {
      title: "Search this area",
      subtitle: `Refresh ${category.label.toLowerCase()} for this map view.`,
      meta: "Refresh",
      emphasized: true,
      compact: true
    });
    return;
  }

  if (state.searchStatus === "error") {
    updateSearchAction(refs, {
      title: "Try again",
      subtitle: "The places service did not respond for this area.",
      meta: "Retry",
      emphasized: true,
      compact: true
    });
    return;
  }

  const count = state.currentPlaces.length;
  if (!count) {
    updateSearchAction(refs, {
      title: `No ${category.label.toLowerCase()} found`,
      subtitle: "Move the map, then search this area again.",
      meta: "Adjust",
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

  const category = getSelectedCategory();
  if (!category) {
    updateResultsSummary(refs, "Explore nearby", "Search a place or choose a category");
    return;
  }

  if (state.searchStatus === "loading") {
    updateResultsSummary(refs, `${category.label} nearby`, "Searching current map area");
    return;
  }

  if (state.searchStatus === "stale") {
    updateResultsSummary(refs, `${category.label} nearby`, "Map moved. Search this area to refresh");
    return;
  }

  if (state.searchStatus === "error") {
    updateResultsSummary(refs, `${category.label} nearby`, "Search failed");
    return;
  }

  if (!state.currentPlaces.length) {
    updateResultsSummary(refs, `${category.label} nearby`, "No places found in this area");
    return;
  }

  updateResultsSummary(
    refs,
    `${category.label} nearby`,
    `${state.currentPlaces.length} place${state.currentPlaces.length === 1 ? "" : "s"} in this area`
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
  mapController.clearResults();
  renderResultsList(refs.resultsList, [], () => {});
}

function formatCandidateDistance(meters) {
  if (meters == null) {
    return "";
  }
  if (meters < 1500) {
    return "Near current map view";
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi away`;
}

function looksAmbiguousQuery(query) {
  const text = String(query || "").trim();
  return !/[0-9,]/.test(text);
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

  if (state.selectedCategoryId) {
    state.searchStatus = "stale";
  }

  syncDiscoveryUi();
}

async function runCategorySearch(category) {
  const center = mapController.getVisibleCenter();
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  state.searchStatus = "loading";
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

    state.currentPlaces = places;
    state.searchStatus = "ready";
    mapController.setResultPlaces(places);
    renderResultsList(refs.resultsList, places, (placeId) => selectPlace(placeId));
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    state.currentPlaces = [];
    state.activePlaceId = null;
    state.searchStatus = "error";
    mapController.clearResults();
    renderResultsError(refs.resultsList, "The places service did not respond. Try again in a moment.");
  } finally {
    if (state.activeFetchController === controller) {
      state.activeFetchController = null;
    }
    syncDiscoveryUi();
  }
}

async function runAddressSearch() {
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

  const controller = new AbortController();
  state.activeGeocodeController = controller;
  state.addressSearchStatus = "loading";
  state.addressSearchMessage = "";
  state.geocodeCandidates = [];
  syncDiscoveryUi();

  try {
    const ambiguousQuery = looksAmbiguousQuery(query);
    let candidates = await geocodeQuery(query, {
      signal: controller.signal,
      limit: 5,
      viewbox: mapController.getVisibleBounds()
    });
    if (state.activeGeocodeController !== controller) {
      return;
    }

    if (ambiguousQuery && candidates.length <= 1) {
      candidates = await geocodeQuery(query, {
        signal: controller.signal,
        limit: 5
      });
      if (state.activeGeocodeController !== controller) {
        return;
      }
    }

    if (!candidates.length) {
      state.lastGeocodedPlace = null;
      state.addressSearchStatus = "no-result";
      state.addressSearchMessage = "No matching address or place found.";
      state.geocodeCandidates = [];
      mapController.clearDestination();
      syncDiscoveryUi();
      return;
    }

    const enrichedCandidates = candidates.map((candidate) => ({
      ...candidate,
      distanceText: formatCandidateDistance(candidate.distanceMeters)
    }));

    if (enrichedCandidates.length > 1 && ambiguousQuery) {
      state.lastGeocodedPlace = null;
      state.addressSearchStatus = "ready";
      state.addressSearchMessage = `Choose one of ${enrichedCandidates.length} matches below.`;
      state.geocodeCandidates = enrichedCandidates;
      state.activePlaceId = null;
      state.isResultsExpanded = true;
      mapController.clearDestination();
      syncDiscoveryUi();
      return;
    }

    const place = enrichedCandidates[0];
    state.geocodeCandidates = [];
    state.lastGeocodedPlace = place;
    state.addressSearchStatus = "ready";
    state.addressSearchMessage = place.label;
    state.suppressMoveNotice = true;
    mapController.setDestination(place);
    mapController.flyToDestination(place);

    if (state.selectedCategoryId) {
      state.searchStatus = "stale";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    state.lastGeocodedPlace = null;
    state.addressSearchStatus = "error";
    state.addressSearchMessage = "Address search did not respond. Try again.";
    state.geocodeCandidates = [];
  } finally {
    if (state.activeGeocodeController === controller) {
      state.activeGeocodeController = null;
    }
    syncDiscoveryUi();
  }
}

function setSelectedCategory(categoryId, shouldSearch = false) {
  state.selectedCategoryId = categoryId;
  state.activePlaceId = null;
  state.isResultsExpanded = false;
  state.searchStatus = "stale";
  refreshCategoryUi();
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

  if (!state.selectedCategoryId || state.searchStatus === "loading") {
    return;
  }

  state.isResultsExpanded = !state.isResultsExpanded;
  syncDiscoveryUi();
});

refs.searchActionBtn.addEventListener("click", () => {
  const category = getSelectedCategory();
  if (!category || state.searchStatus === "loading") {
    return;
  }

  if (state.searchStatus === "stale" || state.searchStatus === "error") {
    runCategorySearch(category);
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
  if (state.activeGeocodeController) {
    state.activeGeocodeController.abort();
    state.activeGeocodeController = null;
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
