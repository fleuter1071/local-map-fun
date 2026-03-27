function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeSearchText(value) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

module.exports = {
  normalizeSearchText,
  tokenizeSearchText
};
