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
    if (!state.activePlaceId) {
      return;
    }

    state.activePlaceId = null;
    state.isResultsExpanded = true;
    syncDiscoveryUi();
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

  if (category && state.searchStatus === "ready" && state.currentPlaces.length) {
    setSearchActionVisible(refs, false);
    return;
  }

  setSearchActionVisible(refs, true);

  if (!category) {
    updateSearchAction(refs, {
      title: "Choose a category",
      subtitle: "Pick what you want to find nearby.",
      meta: "Browse",
      compact: false
    });
    return;
  }

  if (state.searchStatus === "loading") {
    updateSearchAction(refs, {
      title: "Searching current area",
      subtitle: `Looking for ${category.label.toLowerCase()} in the visible map view.`,
      meta: "Loading",
      disabled: true,
      compact: false
    });
    return;
  }

  if (state.searchStatus === "stale") {
    updateSearchAction(refs, {
      title: "Search this area",
      subtitle: `Refresh ${category.label.toLowerCase()} for the current map view.`,
      meta: "Refresh",
      emphasized: true,
      compact: false
    });
    return;
  }

  if (state.searchStatus === "error") {
    updateSearchAction(refs, {
      title: "Try this search again",
      subtitle: "The places service did not respond. Try the current map area again.",
      meta: "Retry",
      emphasized: true,
      compact: false
    });
    return;
  }

  const count = state.currentPlaces.length;
  if (!count) {
    updateSearchAction(refs, {
      title: `No ${category.label.toLowerCase()} found`,
      subtitle: "Move the map a little, then search this area again.",
      meta: "Adjust",
      compact: false
    });
    return;
  }

  updateSearchAction(refs, {
    title: `${count} ${category.label.toLowerCase()} nearby`,
    subtitle: "Open the list or move the map to refresh the area.",
    meta: compact ? "Results" : "View",
    compact
  });
}

function updateSummaryUi() {
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
    updateResultsSummary(refs, "Explore nearby", "Choose a category to begin");
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
  mapController.clearResults();
  renderResultsList(refs.resultsList, [], () => {});
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
  syncDiscoveryUi();

  try {
    const place = await geocodeQuery(query, { signal: controller.signal });
    if (state.activeGeocodeController !== controller) {
      return;
    }

    if (!place) {
      state.lastGeocodedPlace = null;
      state.addressSearchStatus = "no-result";
      state.addressSearchMessage = "No matching address or place found.";
      mapController.clearDestination();
      syncDiscoveryUi();
      return;
    }

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
