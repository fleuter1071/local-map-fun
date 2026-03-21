export function createMapController({ mapElementId, defaultCenter, defaultZoom, onBackgroundMapClick, onMarkerSelect, onMoveStart, onMoveEnd }) {
  const map = L.map(mapElementId, { zoomControl: false, preferCanvas: true }).setView(defaultCenter, defaultZoom);
  L.control.zoom({ position: "bottomleft" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const resultLayer = L.layerGroup().addTo(map);
  let userMarker = null;

  map.on("click", (event) => {
    if (!event.originalEvent?.target?.closest?.(".leaflet-interactive")) {
      onBackgroundMapClick();
    }
  });

  map.on("movestart", onMoveStart);
  map.on("moveend", onMoveEnd);

  return {
    getVisibleCenter() {
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    },
    setResultPlaces(places) {
      resultLayer.clearLayers();
      places.forEach((place) => {
        const marker = L.circleMarker([place.lat, place.lng], {
          radius: 7,
          weight: 2,
          color: "#d9efff",
          fillColor: "#57abff",
          fillOpacity: 0.88
        }).addTo(resultLayer);

        marker.on("click", () => onMarkerSelect(place.id));
      });
    },
    clearResults() {
      resultLayer.clearLayers();
    },
    flyToPlace(place) {
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 17), { duration: 0.45 });
    },
    setUserLocation(lat, lng) {
      if (!userMarker) {
        userMarker = L.circleMarker([lat, lng], {
          radius: 9,
          weight: 3,
          color: "#ffffff",
          fillColor: "#ff4d67",
          fillOpacity: 1
        })
          .addTo(map)
          .bindPopup('<div class="popup-name">You are here</div><div class="popup-meta">Current device location</div>');
      } else {
        userMarker.setLatLng([lat, lng]);
      }
    },
    openUserPopup() {
      userMarker?.openPopup();
    },
    flyToUserLocation(latLng) {
      map.flyTo([latLng.lat, latLng.lng], 15, { duration: 0.4 });
    },
    flyToCoordinates(lat, lng, duration = 0.35) {
      map.flyTo([lat, lng], 15, { duration });
    }
  };
}
