export function createAppState() {
  return {
    selectedCategoryId: null,
    userLatLng: null,
    currentPlaces: [],
    activePlaceId: null,
    isResultsExpanded: false,
    suppressMoveNotice: true,
    activeFetchController: null,
    searchStatus: "idle"
  };
}
