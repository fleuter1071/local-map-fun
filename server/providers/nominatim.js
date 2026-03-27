const { REQUEST_TIMEOUT_MS } = require("../config.js");
const { getDistanceMeters, formatDistanceMeters } = require("../utils/geo.js");

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

function normalizeCandidate(result, anchor) {
  if (!result) {
    return null;
  }

  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const distanceMeters = anchor ? Math.round(getDistanceMeters(anchor, { lat, lng })) : null;
  return {
    id: result.place_id ? `geocode-${result.place_id}` : `geocode-${lat}-${lng}`,
    label: result.display_name || result.name || "Matched place",
    shortLabel: result.name || result.display_name?.split(",")[0] || "Matched place",
    addressSummary: buildAddressSummary(result.address),
    lat,
    lng,
    distanceMeters,
    distanceText: formatDistanceMeters(distanceMeters),
    typeLabel: "Place"
  };
}

async function fetchJson(url, { signal }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("Timeout")), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort(new Error("Aborted"));

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      throw new Error("Aborted");
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "local-map-fun-search-backend/1.0"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function searchNominatim(query, { signal, limit = 5, viewbox, bounded = false, anchor = null } = {}) {
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
    if (bounded) {
      url.searchParams.set("bounded", "1");
    }
  }

  const payload = await fetchJson(url, { signal });
  return (Array.isArray(payload) ? payload : [])
    .map((result) => normalizeCandidate(result, anchor))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.distanceMeters != null && right.distanceMeters != null) {
        return left.distanceMeters - right.distanceMeters;
      }
      return 0;
    });
}

module.exports = {
  searchNominatim
};
