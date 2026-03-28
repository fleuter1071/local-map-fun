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
    const error = new Error(body.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.code = body.error || "search_error";
    error.detail = body.detail || "";
    throw error;
  }

  return body;
}
