const { categories, categoryAliases } = require("../constants.js");
const { normalizeSearchText } = require("../utils/text.js");

function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId) || null;
}

function findCategoryForQuery(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return null;
  }

  const aliasedCategoryId = categoryAliases.get(normalizedQuery);
  if (aliasedCategoryId) {
    return getCategoryById(aliasedCategoryId);
  }

  return categories.find((category) => {
    const labels = [category.id, category.label, category.desc];
    return labels.some((value) => normalizeSearchText(value) === normalizedQuery);
  }) || null;
}

function looksLikeAddressOrArea(query) {
  const text = String(query || "").trim().toLowerCase();
  return /\d/.test(text) || /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pl|place|sq|square|hwy|highway)\b/.test(text) || text.includes(",");
}

function classifyQuery(query) {
  const matchedCategory = findCategoryForQuery(query);
  if (matchedCategory) {
    return {
      kind: "category",
      category: matchedCategory
    };
  }

  if (looksLikeAddressOrArea(query)) {
    return {
      kind: "destination",
      category: null
    };
  }

  return {
    kind: "nearby-name",
    category: null
  };
}

module.exports = {
  classifyQuery,
  findCategoryForQuery
};
