const { CATEGORY_RADIUS_METERS, LOCAL_NAME_RADIUS_METERS } = require("../config.js");
const { searchNearbyName } = require("../providers/geoapify.js");
const { searchNominatim } = require("../providers/nominatim.js");
const { searchNearbyCategory } = require("../providers/overpass.js");
const { classifyQuery } = require("./classifyQuery.js");
const { getCachedValue, setCachedValue, createLocationBucket } = require("../utils/cache.js");
const { normalizeSearchText, tokenizeSearchText } = require("../utils/text.js");

function resolveAnchor(payload) {
  if (payload.userLocation?.lat != null && payload.userLocation?.lng != null) {
    return {
      anchor: payload.userLocation,
      anchorType: "user-location"
    };
  }

  if (payload.mapCenter?.lat != null && payload.mapCenter?.lng != null) {
    return {
      anchor: payload.mapCenter,
      anchorType: "map-center"
    };
  }

  return {
    anchor: null,
    anchorType: "none"
  };
}

function scoreCandidate(candidate, query) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenizeSearchText(query);
  const candidateFields = [candidate.shortLabel, candidate.label, candidate.addressSummary]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);

  let score = 0;
  candidateFields.forEach((field) => {
    if (field === normalizedQuery) {
      score = Math.max(score, 120);
    } else if (field.includes(normalizedQuery)) {
      score = Math.max(score, 80);
    }

    const matchedTokens = queryTokens.filter((token) => field.includes(token));
    if (matchedTokens.length === queryTokens.length && matchedTokens.length) {
      score = Math.max(score, 60 + matchedTokens.length * 5);
    } else if (matchedTokens.length) {
      score = Math.max(score, 20 + matchedTokens.length * 5);
    }
  });

  return score;
}

function normalizeNearbyNamePlaces(candidates, query) {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.shortLabel || candidate.label,
      lat: candidate.lat,
      lng: candidate.lng,
      typeLabel: "Place",
      distanceMeters: candidate.distanceMeters,
      distanceText: candidate.distanceText,
      address: candidate.addressSummary,
      openingHours: "",
      phone: "",
      website: "",
      cuisine: "",
      tags: {},
      matchScore: scoreCandidate(candidate, query),
      providerConfidence: candidate.confidence
    }))
    .filter((place) => place.matchScore >= 50 || (place.providerConfidence != null && place.providerConfidence >= 0.9))
    .sort((left, right) => {
      const leftConfidence = left.providerConfidence ?? 0;
      const rightConfidence = right.providerConfidence ?? 0;
      if (rightConfidence !== leftConfidence) {
        return rightConfidence - leftConfidence;
      }
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }
      return (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (right.distanceMeters ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 12);
}

function createNearbyNameCacheKey(query, anchor, allowBroadFallback) {
  return [
    "nearby-name",
    normalizeSearchText(query),
    createLocationBucket(anchor),
    allowBroadFallback ? "broad" : "local"
  ].join("|");
}

function sortCandidatesByDistance(candidates) {
  return [...candidates].sort((left, right) => {
    const leftDistance = left.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    const rightDistance = right.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    return leftDistance - rightDistance;
  });
}

async function handleCategoryQuery(queryInfo, anchor, anchorType, signal) {
  const results = await searchNearbyCategory(queryInfo.category, anchor, CATEGORY_RADIUS_METERS, { signal });
  return {
    mode: "category",
    anchor: anchorType,
    fallbackUsed: false,
    quality: results.length ? "strong" : "empty",
    message: results.length
      ? `Showing ${queryInfo.category.label.toLowerCase()} near ${anchorType === "user-location" ? "your location" : "this map area"}.`
      : `No nearby ${queryInfo.category.label.toLowerCase()} found.`,
    category: {
      id: queryInfo.category.id,
      label: queryInfo.category.label
    },
    canBroadSearch: false,
    resultsKind: "places",
    results
  };
}

async function handleNearbyNameQuery(query, anchor, anchorType, allowBroadFallback, signal) {
  const cacheKey = createNearbyNameCacheKey(query, anchor, allowBroadFallback);
  const cachedResponse = getCachedValue(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const localCandidates = await searchNearbyName(query, {
    signal,
    limit: 12,
    radiusMeters: LOCAL_NAME_RADIUS_METERS,
    anchor
  });

  const nearbyPlaces = normalizeNearbyNamePlaces(localCandidates, query);
  if (nearbyPlaces.length) {
    const response = {
      mode: "nearby-name",
      anchor: anchorType,
      fallbackUsed: false,
      quality: "strong",
      message: nearbyPlaces.length === 1
        ? `Found 1 nearby match for "${query}".`
        : `Found ${nearbyPlaces.length} nearby matches for "${query}".`,
      category: null,
      canBroadSearch: false,
      resultsKind: "places",
      results: nearbyPlaces
    };
    setCachedValue(cacheKey, response);
    return response;
  }

  if (!allowBroadFallback) {
    const response = {
      mode: "nearby-name",
      anchor: anchorType,
      fallbackUsed: false,
      quality: "weak",
      message: `No strong nearby matches found for "${query}".`,
      category: null,
      canBroadSearch: true,
      resultsKind: "places",
      results: []
    };
    setCachedValue(cacheKey, response);
    return response;
  }

  const broaderCandidates = await searchNominatim(query, {
    signal,
    limit: 5,
    anchor
  });

  const sortedBroaderCandidates = sortCandidatesByDistance(broaderCandidates);

  const response = {
    mode: "destination",
    anchor: anchorType,
    fallbackUsed: true,
    quality: sortedBroaderCandidates.length ? "broad" : "empty",
    message: sortedBroaderCandidates.length
      ? `Showing broader results for "${query}".`
      : `No broader matches found for "${query}".`,
    category: null,
    canBroadSearch: false,
    resultsKind: "candidates",
    results: sortedBroaderCandidates
  };
  setCachedValue(cacheKey, response);
  return response;
}

async function handleDestinationQuery(query, anchor, anchorType, signal) {
  const candidates = await searchNominatim(query, {
    signal,
    limit: 5,
    viewbox: null,
    anchor
  });

  return {
    mode: "destination",
    anchor: anchorType,
    fallbackUsed: false,
    quality: candidates.length ? "strong" : "empty",
    message: candidates.length
      ? `Found ${candidates.length} possible match${candidates.length === 1 ? "" : "es"} for "${query}".`
      : `No matching address or place found for "${query}".`,
    category: null,
    canBroadSearch: false,
    resultsKind: "candidates",
    results: candidates
  };
}

function mapProviderErrorToResponse(error) {
  if (error.code === "provider_rate_limited" || error.statusCode === 429) {
    return {
      statusCode: 429,
      body: {
        error: "provider_rate_limited",
        message: "Search is temporarily busy. Wait a moment and try again.",
        detail: error.detail || error.message
      }
    };
  }

  if (error.code === "provider_timeout" || error.statusCode === 504) {
    return {
      statusCode: 504,
      body: {
        error: "provider_timeout",
        message: "Search took too long. Try again in a moment.",
        detail: error.detail || error.message
      }
    };
  }

  if (error.code === "provider_not_configured") {
    return {
      statusCode: 500,
      body: {
        error: "provider_not_configured",
        message: "Search provider is not configured.",
        detail: error.detail || error.message
      }
    };
  }

  return {
    statusCode: 502,
    body: {
      error: "provider_error",
      message: "Search provider did not respond.",
      detail: error.detail || error.message
    }
  };
}

async function orchestrateSearch(payload, { signal } = {}) {
  const query = String(payload.query || "").trim();
  if (!query) {
    return {
      statusCode: 400,
      body: {
        error: "missing_query",
        message: "Query is required."
      }
    };
  }

  const { anchor, anchorType } = resolveAnchor(payload);
  if (!anchor && classifyQuery(query).kind !== "destination") {
    return {
      statusCode: 400,
      body: {
        error: "missing_anchor",
        message: "A map center or user location is required for nearby search."
      }
    };
  }

  const queryInfo = classifyQuery(query);

  try {
    let responseBody;
    if (queryInfo.kind === "category") {
      responseBody = await handleCategoryQuery(queryInfo, anchor, anchorType, signal);
    } else if (queryInfo.kind === "nearby-name") {
      responseBody = await handleNearbyNameQuery(query, anchor, anchorType, Boolean(payload.allowBroadFallback), signal);
    } else {
      responseBody = await handleDestinationQuery(query, anchor, anchorType, signal);
    }

    return {
      statusCode: 200,
      body: responseBody
    };
  } catch (error) {
    return mapProviderErrorToResponse(error);
  }
}

module.exports = {
  orchestrateSearch
};
