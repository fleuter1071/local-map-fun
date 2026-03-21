export function createAppState() {
  return {
    selectedCategoryId: null,
    userLatLng: null,
    currentPlaces: [],
    activePlaceId: null,
    addressQuery: "",
    addressSearchStatus: "idle",
    addressSearchMessage: "",
    lastGeocodedPlace: null,
    isResultsExpanded: false,
    suppressMoveNotice: true,
    activeFetchController: null,
    activeGeocodeController: null,
    searchStatus: "idle"
  };
}
