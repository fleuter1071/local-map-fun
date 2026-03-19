import { categories, defaultCenter, defaultZoom, getCategoryById, quickCategoryIds, searchRadiusMeters } from "./config.js";
import { createMapController } from "./mapController.js";
import { fetchPlacesForCategory } from "./services/places.js";
import { requestCurrentPosition } from "./services/geolocation.js";
import { createAppState } from "./state.js";
import {
  clearPlaceDetails,
  closeMoreSheet,
  createDomRefs,
  openMoreSheet,
  positionSearchAreaButton,
  renderCategorySheet,
  renderChips,
  renderPlaceDetails,
  renderResultsError,
  renderResultsList,
  setResultsExpanded,
  setSearchAreaVisible,
  updateResultsSummary
} from "./ui/renderers.js";

const state = createAppState();
const refs = createDomRefs(document);

const mapController = createMapController({
  mapElementId: "map",
  defaultCenter,
  defaultZoom,
  onBackgroundMapClick: () => {
    state.activePlaceId = null;
    clearPlaceDetails(refs);
  },
  onMarkerSelect: (placeId) => {
    selectPlace(placeId, false);
  },
  onMoveStart: () => {
    if (!state.suppressMoveNotice && state.selectedCategoryId) {
      setSearchAreaVisible(refs.searchAreaBtn, true);
    }
  },
  onMoveEnd: () => {
    state.suppressMoveNotice = false;
  }
});

function refreshCategoryUi() {
  renderChips({
    chipRail: refs.chipRail,
    quickCategoryIds,
    categories,
    selectedCategoryId: state.selectedCategoryId,
    onSelectCategory: (categoryId, shouldSearch) => {
      setSelectedCategory(categoryId, shouldSearch);
      closeMoreSheet(refs);
    },
    onOpenMoreSheet: () => openMoreSheet(refs)
  });

  renderCategorySheet({
    categoryGrid: refs.categoryGrid,
    categories,
    selectedCategoryId: state.selectedCategoryId,
    onSelectCategory: (categoryId, shouldSearch) => {
      setSelectedCategory(categoryId, shouldSearch);
      closeMoreSheet(refs);
    }
  });
}

function updateResultBarForCategory() {
  const category = getCategoryById(state.selectedCategoryId);
  if (!category) {
    updateResultsSummary(refs, "Explore nearby", "Choose a category");
    return;
  }

  updateResultsSummary(refs, `${category.label} nearby`, "Results in current map area");
}

function collapseResults() {
  state.isResultsExpanded = false;
  setResultsExpanded(refs, false);
}

function setSelectedCategory(categoryId, shouldSearch = false) {
  state.suppressResultBarUntil = Date.now() + 700;
  collapseResults();
  requestAnimationFrame(() => setResultsExpanded(refs, false));
  state.selectedCategoryId = categoryId;
  refreshCategoryUi();
  updateResultBarForCategory();

  const category = getCategoryById(categoryId);
  if (shouldSearch && category) {
    runCategorySearch(category);
  }
}

function findPlaceById(placeId) {
  return state.currentPlaces.find((place) => place.id === placeId) || null;
}

function selectPlace(placeId, collapseList = true) {
  const place = findPlaceById(placeId);
  if (!place) {
    return;
  }

  state.activePlaceId = place.id;
  state.suppressMoveNotice = true;
  if (collapseList) {
    state.suppressResultBarUntil = Date.now() + 350;
    collapseResults();
  }

  mapController.flyToPlace(place);
  renderPlaceDetails(refs, place);
}

function clearResults() {
  state.currentPlaces = [];
  state.activePlaceId = null;
  mapController.clearResults();
  clearPlaceDetails(refs);
  renderResultsList(refs.resultsList, [], () => {});
}

async function runCategorySearch(category) {
  const center = mapController.getVisibleCenter();
  state.activePlaceId = null;
  clearPlaceDetails(refs);
  setSearchAreaVisible(refs.searchAreaBtn, false);
  state.suppressResultBarUntil = Date.now() + 700;
  collapseResults();
  requestAnimationFrame(() => setResultsExpanded(refs, false));
  updateResultsSummary(refs, `${category.label} nearby`, "Searching current map area…");

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
    mapController.setResultPlaces(places);
    renderResultsList(refs.resultsList, places, (placeId) => selectPlace(placeId, true));
    state.suppressResultBarUntil = Date.now() + 450;
    collapseResults();
    setTimeout(() => setResultsExpanded(refs, false), 0);
    updateResultsSummary(
      refs,
      `${category.label} nearby`,
      places.length ? `${places.length} place${places.length === 1 ? "" : "s"} found` : "No places found in this area"
    );
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    state.currentPlaces = [];
    state.activePlaceId = null;
    mapController.clearResults();
    renderResultsError(refs.resultsList, "The places service did not respond. Try again in a moment.");
    updateResultsSummary(refs, `${category.label} nearby`, "Search failed");
  } finally {
    if (state.activeFetchController === controller) {
      state.activeFetchController = null;
    }
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
      mapController.flyToCoordinates(latitude, longitude, hadLocation ? 0.5 : 0.35);
    }
  } catch (error) {
    // Silent fallback keeps the app usable even if location access is denied.
  }
}

refs.closeSheetBtn.addEventListener("click", () => closeMoreSheet(refs));
refs.scrim.addEventListener("click", () => closeMoreSheet(refs));
refs.detailCloseBtn.addEventListener("click", () => {
  state.activePlaceId = null;
  clearPlaceDetails(refs);
});
refs.resultBar.addEventListener("click", (event) => {
  if (!state.selectedCategoryId) {
    return;
  }
  if (Date.now() < state.suppressResultBarUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  state.isResultsExpanded = !state.isResultsExpanded;
  if (state.isResultsExpanded) {
    state.activePlaceId = null;
    clearPlaceDetails(refs);
  }
  setResultsExpanded(refs, state.isResultsExpanded);
});
refs.searchAreaBtn.addEventListener("click", () => {
  const category = getCategoryById(state.selectedCategoryId);
  if (category) {
    runCategorySearch(category);
  }
});
refs.locateBtn.addEventListener("click", async () => {
  if (state.userLatLng) {
    mapController.flyToUserLocation(state.userLatLng);
    mapController.openUserPopup();
    return;
  }

  await syncUserLocation({ recenter: true });
});
window.addEventListener("resize", () => positionSearchAreaButton(refs.topUi, refs.searchAreaBtn));

refreshCategoryUi();
updateResultBarForCategory();
positionSearchAreaButton(refs.topUi, refs.searchAreaBtn);
clearResults();
setResultsExpanded(refs, false);
syncUserLocation({ recenter: true, initial: true });
