const { SEARCH_CACHE_TTL_MS } = require("../config.js");

const cacheStore = new Map();

function getCachedValue(key) {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedValue(key, value, ttlMs = SEARCH_CACHE_TTL_MS) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function createLocationBucket(anchor) {
  if (!anchor) {
    return "none";
  }

  return `${anchor.lat.toFixed(2)},${anchor.lng.toFixed(2)}`;
}

module.exports = {
  getCachedValue,
  setCachedValue,
  createLocationBucket
};
