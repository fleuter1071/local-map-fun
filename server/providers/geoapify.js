const { GEOAPIFY_API_KEY, REQUEST_TIMEOUT_MS } = require("../config.js");
const { getDistanceMeters, formatDistanceMeters } = require("../utils/geo.js");
const { createProviderError } = require("../utils/providerError.js");

function buildAddressSummary(result) {
  return [
    result.address_line1,
    result.address_line2,
    result.city,
    result.state,
    result.country_code ? String(result.country_code).toUpperCase() : ""
  ].filter(Boolean).join(", ");
}

function normalizeGeoapifyResult(result, anchor) {
  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const distanceMeters = anchor ? Math.round(getDistanceMeters(anchor, { lat, lng })) : null;
  const confidence = typeof result.rank?.confidence === "number" ? result.rank.confidence : null;

  return {
    id: result.place_id ? `geoapify-${result.place_id}` : `geoapify-${lat}-${lng}`,
    label: result.formatted || result.address_line1 || result.name || "Matched place",
    shortLabel: result.name || result.address_line1 || result.formatted?.split(",")[0] || "Matched place",
    addressSummary: buildAddressSummary(result),
    lat,
    lng,
    distanceMeters,
    distanceText: formatDistanceMeters(distanceMeters),
    typeLabel: result.result_type || result.datasource?.sourcename || "Place",
    confidence
  };
}

async function fetchJson(url, { signal }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      throw createProviderError("Request aborted.", {
        code: "provider_aborted",
        detail: "Aborted"
      });
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
      throw createProviderError("Geoapify request failed.", {
        statusCode: response.status,
        code: response.status === 429 ? "provider_rate_limited" : "provider_http_error",
        detail: `HTTP ${response.status}`
      });
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw createProviderError("Geoapify request timed out.", {
        statusCode: 504,
        code: "provider_timeout",
        detail: "Timeout"
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function searchNearbyName(query, { signal, limit = 12, anchor, radiusMeters } = {}) {
  if (!GEOAPIFY_API_KEY) {
    throw createProviderError("Geoapify API key is not configured.", {
      statusCode: 500,
      code: "provider_not_configured",
      detail: "Missing GEOAPIFY_API_KEY"
    });
  }

  const text = String(query || "").trim();
  if (!text) {
    return [];
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", text);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("apiKey", GEOAPIFY_API_KEY);

  if (anchor) {
    url.searchParams.set("bias", `proximity:${anchor.lng},${anchor.lat}`);
    if (radiusMeters) {
      url.searchParams.set("filter", `circle:${anchor.lng},${anchor.lat},${radiusMeters}`);
    }
  }

  const payload = await fetchJson(url, { signal });
  return (Array.isArray(payload.results) ? payload.results : [])
    .map((result) => normalizeGeoapifyResult(result, anchor))
    .filter(Boolean)
    .sort((left, right) => {
      const leftDistance = left.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      const rightDistance = right.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      return leftDistance - rightDistance;
    });
}

module.exports = {
  searchNearbyName
};
