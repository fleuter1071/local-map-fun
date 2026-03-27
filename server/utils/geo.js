function toRadians(value) {
  return value * Math.PI / 180;
}

function getDistanceMeters(start, end) {
  const radius = 6371000;
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

function formatDistanceMeters(meters) {
  if (meters == null || Number.isNaN(meters)) {
    return "";
  }
  if (meters < 402.336) {
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft away`;
  }

  const miles = meters / 1609.34;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi away`;
}

function createViewboxAroundCenter(center, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.max(Math.cos(toRadians(center.lat)), 0.2));

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
}

module.exports = {
  getDistanceMeters,
  formatDistanceMeters,
  createViewboxAroundCenter
};
