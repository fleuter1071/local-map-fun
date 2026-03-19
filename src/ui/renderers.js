import { ensureSafeWebsiteUrl, escapeHtml } from "../utils.js";

export function createDomRefs(document) {
  return {
    topUi: document.querySelector(".top-ui"),
    chipRail: document.getElementById("chipRail"),
    categoryGrid: document.getElementById("categoryGrid"),
    moreSheet: document.getElementById("moreSheet"),
    closeSheetBtn: document.getElementById("closeSheetBtn"),
    scrim: document.getElementById("scrim"),
    searchAreaBtn: document.getElementById("searchAreaBtn"),
    listSheet: document.getElementById("listSheet"),
    resultBar: document.getElementById("resultBar"),
    resultTitle: document.getElementById("resultTitle"),
    resultSub: document.getElementById("resultSub"),
    resultsList: document.getElementById("resultsList"),
    resultsPanel: document.getElementById("resultsPanel"),
    locateBtn: document.getElementById("locateBtn"),
    placeDetailSheet: document.getElementById("placeDetailSheet"),
    detailCloseBtn: document.getElementById("detailCloseBtn"),
    detailTitle: document.getElementById("detailTitle"),
    detailSub: document.getElementById("detailSub"),
    detailPillRow: document.getElementById("detailPillRow"),
    detailList: document.getElementById("detailList")
  };
}

function createChip(label, id, extraClass = "") {
  const button = document.createElement("button");
  button.className = `chip ${extraClass}`.trim();
  button.textContent = label;
  button.dataset.id = id;
  return button;
}

export function renderChips({ chipRail, quickCategoryIds, categories, selectedCategoryId, onSelectCategory, onOpenMoreSheet }) {
  chipRail.innerHTML = "";

  quickCategoryIds.forEach((categoryId) => {
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    const chip = createChip(category.label, category.id);
    chip.classList.toggle("active", category.id === selectedCategoryId);
    chip.addEventListener("click", () => onSelectCategory(category.id, true));
    chipRail.appendChild(chip);
  });

  const moreChip = createChip("More", "more", "ghost");
  moreChip.addEventListener("click", onOpenMoreSheet);
  chipRail.appendChild(moreChip);
}

export function renderCategorySheet({ categoryGrid, categories, selectedCategoryId, onSelectCategory }) {
  categoryGrid.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "sheet-button";
    button.dataset.id = category.id;
    button.classList.toggle("active", category.id === selectedCategoryId);
    button.innerHTML = `<div class="name">${escapeHtml(category.label)}</div><div class="desc">${escapeHtml(category.desc)}</div>`;
    button.addEventListener("click", () => onSelectCategory(category.id, true));
    categoryGrid.appendChild(button);
  });
}

export function openMoreSheet(refs) {
  refs.moreSheet.classList.add("show");
  refs.moreSheet.setAttribute("aria-hidden", "false");
  refs.scrim.classList.add("show");
}

export function closeMoreSheet(refs) {
  refs.moreSheet.classList.remove("show");
  refs.moreSheet.setAttribute("aria-hidden", "true");
  refs.scrim.classList.remove("show");
}

export function setSearchAreaVisible(button, isVisible) {
  button.classList.toggle("show", isVisible);
}

export function positionSearchAreaButton(topUi, searchAreaButton) {
  if (!topUi) {
    return;
  }
  const top = topUi.offsetTop + topUi.offsetHeight + 10;
  searchAreaButton.style.top = `${top}px`;
}

export function setResultsExpanded(refs, expanded) {
  refs.listSheet.classList.toggle("expanded", expanded);
  refs.resultBar.setAttribute("aria-expanded", String(expanded));
  refs.resultsPanel.hidden = !expanded;
}

export function updateResultsSummary(refs, title, subtitle) {
  refs.resultTitle.textContent = title;
  refs.resultSub.textContent = subtitle;
}

export function renderResultsList(resultsList, places, onSelectPlace) {
  resultsList.innerHTML = "";

  places.forEach((place) => {
    const row = document.createElement("button");
    row.className = "result-row";
    row.type = "button";
    row.setAttribute("aria-label", `Open ${place.name || "place"} on map`);
    row.addEventListener("click", () => onSelectPlace(place.id));

    const main = document.createElement("div");
    main.className = "result-main";

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = place.name || "Unnamed place";

    const meta = document.createElement("div");
    meta.className = "result-meta";
    const metaParts = [place.typeLabel, place.distanceText].filter(Boolean);
    meta.textContent = metaParts.join(" · ") || "Nearby place";

    const affordance = document.createElement("div");
    affordance.className = "result-affordance";
    affordance.setAttribute("aria-hidden", "true");
    affordance.textContent = "›";

    main.append(name, meta);
    row.append(main, affordance);
    resultsList.appendChild(row);
  });
}

export function renderResultsError(resultsList, message) {
  resultsList.innerHTML = `<div class="result-row" role="status" aria-live="polite"><div class="result-main"><div class="result-name">Could not load places</div><div class="result-meta">${escapeHtml(message)}</div></div></div>`;
}

export function clearPlaceDetails(refs) {
  refs.placeDetailSheet.classList.remove("show");
  refs.placeDetailSheet.setAttribute("aria-hidden", "true");
  refs.detailTitle.textContent = "Place";
  refs.detailSub.hidden = true;
  refs.detailSub.textContent = "";
  refs.detailPillRow.innerHTML = "";
  refs.detailList.innerHTML = "";
}

export function renderPlaceDetails(refs, place) {
  if (!place) {
    clearPlaceDetails(refs);
    return;
  }

  refs.detailTitle.textContent = place.name || "Unnamed place";

  const subParts = [place.typeLabel, place.distanceText].filter(Boolean);
  if (subParts.length) {
    refs.detailSub.hidden = false;
    refs.detailSub.textContent = subParts.join(" · ");
  } else {
    refs.detailSub.hidden = true;
    refs.detailSub.textContent = "";
  }

  refs.detailPillRow.innerHTML = "";
  [place.typeLabel, place.cuisine].filter(Boolean).slice(0, 3).forEach((value) => {
    const pill = document.createElement("div");
    pill.className = "detail-pill";
    pill.textContent = value;
    refs.detailPillRow.appendChild(pill);
  });

  refs.detailList.innerHTML = "";
  const detailItems = [];
  if (place.address) detailItems.push({ icon: "📍", text: place.address });
  if (place.openingHours) detailItems.push({ icon: "🕒", text: place.openingHours });
  if (place.phone) detailItems.push({ icon: "☎", text: place.phone });
  if (place.website) {
    detailItems.push({
      icon: "↗",
      html: `<a href="${escapeHtml(ensureSafeWebsiteUrl(place.website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(place.website)}</a>`
    });
  }

  detailItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "detail-item";

    const icon = document.createElement("div");
    icon.className = "detail-icon";
    icon.textContent = item.icon;

    const text = document.createElement("div");
    text.className = "detail-text";
    if (item.html) {
      text.innerHTML = item.html;
    } else {
      text.textContent = item.text;
    }

    row.append(icon, text);
    refs.detailList.appendChild(row);
  });

  refs.placeDetailSheet.classList.add("show");
  refs.placeDetailSheet.setAttribute("aria-hidden", "false");
}
