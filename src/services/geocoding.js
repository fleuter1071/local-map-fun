import { getDistanceMeters } from "../utils.js";

function buildAddressSummary(address) {
  if (!address) {
    return "";
  }

  return [
    address.neighbourhood || address.suburb || address.hamlet,
    address.city || address.town || address.village || address.county,
    address.state,
    address.country_code ? String(address.country_code).toUpperCase() : ""
  ].filter(Boolean).join(", ");
}

export function normalizeGeocodingResult(result, center = null) {
  if (!result) {
    return null;
  }

  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: result.place_id ? `geocode-${result.place_id}` : `geocode-${lat}-${lng}`,
    label: result.display_name || result.name || "Matched place",
    shortLabel: result.name || result.display_name?.split(",")[0] || "Matched place",
    addressSummary: buildAddressSummary(result.address),
    lat,
    lng,
    distanceMeters: center ? Math.round(getDistanceMeters(center, { lat, lng })) : null
  };
}

export async function geocodeQuery(query, { signal, limit = 5, viewbox } = {}) {
  const text = String(query || "").trim();
  if (!text) {
    return [];
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", text);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("dedupe", "1");

  if (viewbox) {
    url.searchParams.set("viewbox", `${viewbox.west},${viewbox.north},${viewbox.east},${viewbox.south}`);
  }

  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  const center = viewbox
    ? { lat: (viewbox.north + viewbox.south) / 2, lng: (viewbox.east + viewbox.west) / 2 }
    : null;

  return (Array.isArray(payload) ? payload : [])
    .map((result) => normalizeGeocodingResult(result, center))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.distanceMeters != null && right.distanceMeters != null) {
        return left.distanceMeters - right.distanceMeters;
      }
      return 0;
    });
}
