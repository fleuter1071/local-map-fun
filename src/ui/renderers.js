import { ensureSafeWebsiteUrl, escapeHtml } from "../utils.js";

export function createDomRefs(document) {
  return {
    chipRail: document.getElementById("chipRail"),
    locateBtn: document.getElementById("locateBtn"),
    addressSearchForm: document.getElementById("addressSearchForm"),
    addressSearchInput: document.getElementById("addressSearchInput"),
    addressClearBtn: document.getElementById("addressClearBtn"),
    addressSubmitBtn: document.getElementById("addressSubmitBtn"),
    addressSubmitSpinner: document.getElementById("addressSubmitSpinner"),
    addressSearchStatus: document.getElementById("addressSearchStatus"),
    searchActionBtn: document.getElementById("searchActionBtn"),
    searchActionTitle: document.getElementById("searchActionTitle"),
    searchActionSub: document.getElementById("searchActionSub"),
    searchActionMeta: document.getElementById("searchActionMeta"),
    discoverySheet: document.getElementById("discoverySheet"),
    resultBar: document.getElementById("resultBar"),
    resultTitle: document.getElementById("resultTitle"),
    resultSub: document.getElementById("resultSub"),
    resultsPanel: document.getElementById("resultsPanel"),
    resultsView: document.getElementById("resultsView"),
    resultsList: document.getElementById("resultsList"),
    detailView: document.getElementById("detailView"),
    detailBackBtn: document.getElementById("detailBackBtn"),
    detailCloseBtn: document.getElementById("detailCloseBtn"),
    detailTitle: document.getElementById("detailTitle"),
    detailSub: document.getElementById("detailSub"),
    detailPillRow: document.getElementById("detailPillRow"),
    detailList: document.getElementById("detailList")
  };
}

function createResultRow({ title, metaText, ariaLabel, onClick }) {
  const row = document.createElement("button");
  row.className = "result-row";
  row.type = "button";
  row.setAttribute("aria-label", ariaLabel);
  row.addEventListener("click", onClick);

  const main = document.createElement("div");
  main.className = "result-main";

  const name = document.createElement("div");
  name.className = "result-name";
  name.textContent = title;

  const meta = document.createElement("div");
  meta.className = "result-meta";
  meta.textContent = metaText;

  const affordance = document.createElement("div");
  affordance.className = "result-affordance";
  affordance.setAttribute("aria-hidden", "true");
  affordance.textContent = "›";

  main.append(name, meta);
  row.append(main, affordance);
  return row;
}

function createChip(label, id) {
  const button = document.createElement("button");
  button.className = "chip";
  button.type = "button";
  button.textContent = label;
  button.dataset.id = id;
  return button;
}

export function renderChips({ chipRail, categories, selectedCategoryId, onSelectCategory }) {
  chipRail.innerHTML = "";

  categories.forEach((category) => {
    const chip = createChip(category.label, category.id);
    chip.classList.toggle("active", category.id === selectedCategoryId);
    chip.addEventListener("click", () => onSelectCategory(category.id, true));
    chipRail.appendChild(chip);
  });
}

export function updateAddressSearch(refs, { value, loading = false, message = "", messageTone = "neutral" }) {
  refs.addressSearchInput.value = value;
  refs.addressClearBtn.hidden = !value;
  refs.addressSearchForm.classList.toggle("is-loading", loading);
  refs.addressSearchInput.disabled = loading;
  refs.addressSubmitBtn.disabled = loading;
  refs.addressSearchStatus.hidden = !message;
  refs.addressSearchStatus.textContent = message;
  refs.addressSearchStatus.dataset.tone = message ? messageTone : "";
}

export function setSearchActionVisible(refs, visible) {
  refs.searchActionBtn.hidden = !visible;
}

export function updateSearchAction(refs, { title, subtitle, meta, disabled = false, emphasized = false, compact = false }) {
  refs.searchActionTitle.textContent = title;
  refs.searchActionSub.textContent = subtitle;
  refs.searchActionMeta.textContent = meta;
  refs.searchActionBtn.disabled = disabled;
  refs.searchActionBtn.classList.toggle("emphasized", emphasized);
  refs.searchActionBtn.classList.toggle("compact", compact);
}

export function setResultsExpanded(refs, expanded) {
  refs.discoverySheet.classList.toggle("expanded", expanded);
  refs.resultBar.setAttribute("aria-expanded", String(expanded));
  refs.resultsPanel.hidden = !expanded;
}

export function setDetailMode(refs, active) {
  refs.discoverySheet.classList.toggle("detail-mode", active);
  refs.resultsView.hidden = active;
  refs.detailView.hidden = !active;
}

export function updateResultsSummary(refs, title, subtitle) {
  refs.resultTitle.textContent = title;
  refs.resultSub.textContent = subtitle;
}

export function renderResultsList(resultsList, places, onSelectPlace) {
  resultsList.innerHTML = "";

  if (!places.length) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    empty.innerHTML = '<div class="empty-results-title">No places found here</div><div class="empty-results-sub">Move the map a little, then search this area again.</div>';
    resultsList.appendChild(empty);
    return;
  }

  places.forEach((place) => {
    const metaParts = [place.typeLabel, place.distanceText].filter(Boolean);
    const row = createResultRow({
      title: place.name || "Unnamed place",
      metaText: metaParts.join(" · ") || "Nearby place",
      ariaLabel: `Open ${place.name || "place"} on map`,
      onClick: () => onSelectPlace(place.id)
    });
    resultsList.appendChild(row);
  });
}

export function renderGeocodeCandidates(resultsList, candidates, onSelectCandidate) {
  resultsList.innerHTML = "";

  candidates.forEach((candidate) => {
    const metaParts = [candidate.addressSummary, candidate.distanceText].filter(Boolean);
    const row = createResultRow({
      title: candidate.shortLabel || candidate.label,
      metaText: metaParts.join(" · ") || candidate.label,
      ariaLabel: `Choose ${candidate.shortLabel || candidate.label}`,
      onClick: () => onSelectCandidate(candidate.id)
    });
    resultsList.appendChild(row);
  });
}

export function renderResultsError(resultsList, message) {
  resultsList.innerHTML = `<div class="empty-results" role="status" aria-live="polite"><div class="empty-results-title">Could not load places</div><div class="empty-results-sub">${escapeHtml(message)}</div></div>`;
}

export function clearPlaceDetails(refs) {
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

  if (place.openingHours) detailItems.push({ icon: "Hours", text: place.openingHours });
  if (place.address) detailItems.push({ icon: "Address", text: place.address });
  if (place.phone) detailItems.push({ icon: "Phone", text: place.phone });
  if (place.website) {
    detailItems.push({
      icon: "Website",
      html: `<a href="${escapeHtml(ensureSafeWebsiteUrl(place.website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(place.website)}</a>`
    });
  }
  if (!detailItems.length) {
    detailItems.push({ icon: "Info", text: "No extra details were available for this place." });
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
}
