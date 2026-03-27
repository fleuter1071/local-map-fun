import { searchApiOrigin } from "../config.js";

function getSearchApiUrl() {
  return `${searchApiOrigin}/api/search`;
}

export async function searchFromBackend(payload, { signal } = {}) {
  const response = await fetch(getSearchApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `HTTP ${response.status}`);
  }

  return body;
}
