const { REQUEST_TIMEOUT_MS } = require("../config.js");
const { getDistanceMeters, formatDistanceMeters } = require("../utils/geo.js");
const { createProviderError } = require("../utils/providerError.js");

function compactAddress(tags) {
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

function titleCase(value) {
  return String(value || "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildOverpassQuery(category, center, radiusMeters) {
  const tagQueries = category.tags.map((tag) => {
    const [key, value] = tag.split("=");
    return `nwr(around:${radiusMeters},${center.lat},${center.lng})["${key}"="${value}"];`;
  }).join("");

  return `[out:json][timeout:25];(${tagQueries});out center tags;`;
}

function normalizePlaces(elements, center) {
  const seen = new Set();

  return (Array.isArray(elements) ? elements : [])
    .map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (lat == null || lng == null) {
        return null;
      }

      const id = `${element.type}-${element.id}`;
      if (seen.has(id)) {
        return null;
      }
      seen.add(id);

      const tags = element.tags || {};
      const distanceMeters = Math.round(getDistanceMeters(center, { lat, lng }));
      const cuisine = tags.cuisine
        ? tags.cuisine.split(";").map((part) => titleCase(part.trim())).filter(Boolean).join(" · ")
        : "";

      return {
        id,
        name: tags.name || tags.brand || tags.operator || "Unnamed place",
        lat,
        lng,
        typeLabel: titleCase(tags.amenity || tags.shop || tags.leisure || tags.landuse || tags.sport || "place"),
        distanceMeters,
        distanceText: formatDistanceMeters(distanceMeters),
        address: compactAddress(tags),
        openingHours: tags.opening_hours || "",
        phone: tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "",
        website: tags.website || tags["contact:website"] || "",
        cuisine,
        tags
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, 24);
}

async function searchNearbyCategory(category, center, radiusMeters, { signal } = {}) {
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
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: buildOverpassQuery(category, center, radiusMeters),
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw createProviderError("Overpass request failed.", {
        statusCode: response.status,
        code: response.status === 429 ? "provider_rate_limited" : "provider_http_error",
        detail: `HTTP ${response.status}`
      });
    }

    const payload = await response.json();
    return normalizePlaces(payload.elements || [], center);
  } catch (error) {
    if (error.name === "AbortError") {
      throw createProviderError("Overpass request timed out.", {
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

module.exports = {
  searchNearbyCategory
};
