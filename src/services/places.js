import { compactAddress, formatDistanceMeters, getDistanceMeters, titleCase } from "../utils.js";

export function buildOverpassQuery(category, center, radiusMeters) {
  const tagQueries = category.tags.map((tag) => {
    const [key, value] = tag.split("=");
    return `nwr(around:${radiusMeters},${center.lat},${center.lng})["${key}"="${value}"];`;
  }).join("");

  return `[out:json][timeout:25];(${tagQueries});out center tags;`;
}

export function normalizePlaces(elements, center) {
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
      const distanceMeters = getDistanceMeters(center, { lat, lng });
      const website = tags.website || tags["contact:website"] || "";
      const phone = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";
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
        mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`,
        address: compactAddress(tags),
        openingHours: tags.opening_hours || "",
        phone,
        website,
        cuisine,
        tags
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, 24);
}

export async function fetchPlacesForCategory({ category, center, radiusMeters, signal }) {
  const query = buildOverpassQuery(category, center, radiusMeters);
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    signal,
    headers: { "Content-Type": "text/plain;charset=UTF-8" }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  return normalizePlaces(payload.elements || [], center);
}
