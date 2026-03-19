export function createAppState() {
  return {
    selectedCategoryId: null,
    userLatLng: null,
    currentPlaces: [],
    activePlaceId: null,
    isResultsExpanded: false,
    suppressResultBarUntil: 0,
    suppressMoveNotice: true,
    activeFetchController: null
  };
}
