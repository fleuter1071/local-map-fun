export function normalizeGeocodingResult(result) {
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
    lat,
    lng
  };
}

export async function geocodeQuery(query, { signal } = {}) {
  const text = String(query || "").trim();
  if (!text) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", text);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

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
  return normalizeGeocodingResult(Array.isArray(payload) ? payload[0] : null);
}
