export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

export function compactAddress(tags) {
  if (!tags) {
    return "";
  }

  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:state"],
    tags["addr:postcode"]
  ].filter(Boolean);

  return parts.join(parts.length > 2 ? ", " : " ").replace(/\s+,/g, ",").trim();
}

export function formatDistanceMeters(meters) {
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

export function getDistanceMeters(start, end) {
  const radius = 6371000;
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLng = (end.lng - start.lng) * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

export function titleCase(value) {
  return String(value || "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ensureSafeWebsiteUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}
