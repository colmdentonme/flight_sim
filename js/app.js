(() => {
  "use strict";

  const LEGACY_CHECKED_KEY = "a380x-sop-checked-v1";
  const LEGACY_PHASE_KEY = "a380x-sop-phase-v1";

  const els = {
    homeView: document.getElementById("home-view"),
    aircraftList: document.getElementById("aircraft-list"),
    checklistView: document.getElementById("checklist-view"),
    phaseTitle: document.getElementById("phase-title"),
    phaseSub: document.getElementById("phase-sub"),
    progressFill: document.getElementById("progress-fill"),
    phaseProgressLabel: document.getElementById("phase-progress-label"),
    itemList: document.getElementById("item-list"),
    phaseList: document.getElementById("phase-list"),
    backBtn: document.getElementById("back-btn"),
    nextBtn: document.getElementById("next-btn"),
    footerPhaseIndex: document.getElementById("footer-phase-index"),
    menuBtn: document.getElementById("menu-btn"),
    drawerCloseBtn: document.getElementById("drawer-close-btn"),
    drawerScrim: document.getElementById("drawer-scrim"),
    allAircraftBtn: document.getElementById("all-aircraft-btn"),
    returnBanner: document.getElementById("return-banner"),
    returnBannerLabel: document.getElementById("return-banner-label"),
    resetBtn: document.getElementById("reset-btn"),
    phaseResetBtn: document.getElementById("phase-reset-btn"),
    resetConfirm: document.getElementById("reset-confirm"),
    resetConfirmTitle: document.getElementById("reset-confirm-title"),
    resetConfirmBody: document.getElementById("reset-confirm-body"),
    resetCancelBtn: document.getElementById("reset-cancel-btn"),
    resetConfirmBtn: document.getElementById("reset-confirm-btn"),
    checklistMain: document.getElementById("checklist-main"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    themeToggleBtnHome: document.getElementById("theme-toggle-btn-home"),
    themeColorMeta: document.getElementById("theme-color-meta"),
    textSizeBtns: document.querySelectorAll(".text-size-btn"),
    continueCard: document.getElementById("continue-card"),
    continueTitle: document.getElementById("continue-title"),
    continueMeta: document.getElementById("continue-meta"),
    searchBtn: document.getElementById("search-btn"),
    searchOverlay: document.getElementById("search-overlay"),
    searchInput: document.getElementById("search-input"),
    searchCloseBtn: document.getElementById("search-close-btn"),
    searchResults: document.getElementById("search-results"),
    searchEmpty: document.getElementById("search-empty"),
  };

  const THEME_KEY = "sop:theme";
  const THEME_COLOR = { light: "#f4f6f9", dark: "#0b0f14" };

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    document.querySelectorAll(".theme-icon").forEach((el) => {
      el.textContent = theme === "dark" ? "☽" : "☀";
    });
    els.themeColorMeta.setAttribute("content", THEME_COLOR[theme] || THEME_COLOR.light);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable, ignore */ }
  }

  const TEXT_SIZE_KEY = "sop:textSize";

  function applyTextSize(size) {
    if (size === "sm" || size === "lg") {
      document.documentElement.setAttribute("data-text-size", size);
    } else {
      document.documentElement.removeAttribute("data-text-size");
      size = "md";
    }
    els.textSizeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.size === size);
    });
  }

  function setTextSize(size) {
    applyTextSize(size);
    try { localStorage.setItem(TEXT_SIZE_KEY, size); } catch (e) { /* storage unavailable, ignore */ }
  }

  let manifest = null;
  const docCache = {};

  let currentAircraftId = null;
  let currentDocId = null;
  let data = null;
  let checked = new Set();
  let blanks = {}; // "<itemId>:<blankIdx>" -> typed-in value
  let na = new Set(); // items marked "not applicable" this flight (optional/conditional items only)
  let currentPhase = 0;
  let resetScope = "all"; // "all" or "phase", set right before the confirm modal opens

  // Set when a linkedReference CTA jumps from one document to another, so a
  // "Back to Flow" banner can bring you straight back to where you left off.
  // Cleared on use or on returning Home.
  let returnRoute = null;

  // Reverse of linkedReference: maps a phase id in the *current* document to
  // the sibling document's phase that links to it, so a QREF phase opened
  // any way (not just via the forward CTA) can still jump to its matching
  // flow phase. Rebuilt whenever the open document changes.
  let reverseLinks = {};

  function storageKeyChecked(aircraftId, docId) { return `sop:${aircraftId}:${docId}:checked`; }
  function storageKeyPhase(aircraftId, docId) { return `sop:${aircraftId}:${docId}:phase`; }
  function storageKeyBlanks(aircraftId, docId) { return `sop:${aircraftId}:${docId}:blanks`; }
  function storageKeyNA(aircraftId, docId) { return `sop:${aircraftId}:${docId}:na`; }

  const LAST_OPENED_KEY = "sop:lastOpened";
  function saveLastOpened(aircraftId, docId) {
    try { localStorage.setItem(LAST_OPENED_KEY, `${aircraftId}/${docId}`); } catch (e) { /* ignore */ }
  }

  // Two generations of legacy keys to fold forward, oldest first: the very
  // first single-aircraft release, then the single-document-per-aircraft
  // release. Both are one-time, idempotent, and safe to run on every load.
  function migrateLegacyStorage() {
    try {
      const stage1Checked = "sop:a380x:checked";
      const stage1Phase = "sop:a380x:phase";
      const oldChecked = localStorage.getItem(LEGACY_CHECKED_KEY);
      if (oldChecked !== null && localStorage.getItem(stage1Checked) === null) {
        localStorage.setItem(stage1Checked, oldChecked);
      }
      const oldPhase = localStorage.getItem(LEGACY_PHASE_KEY);
      if (oldPhase !== null && localStorage.getItem(stage1Phase) === null) {
        localStorage.setItem(stage1Phase, oldPhase);
      }
      localStorage.removeItem(LEGACY_CHECKED_KEY);
      localStorage.removeItem(LEGACY_PHASE_KEY);

      const stage2Checked = storageKeyChecked("a380x", "sop");
      const stage2Phase = storageKeyPhase("a380x", "sop");
      const stage1CheckedVal = localStorage.getItem(stage1Checked);
      if (stage1CheckedVal !== null && localStorage.getItem(stage2Checked) === null) {
        localStorage.setItem(stage2Checked, stage1CheckedVal);
      }
      const stage1PhaseVal = localStorage.getItem(stage1Phase);
      if (stage1PhaseVal !== null && localStorage.getItem(stage2Phase) === null) {
        localStorage.setItem(stage2Phase, stage1PhaseVal);
      }
      localStorage.removeItem(stage1Checked);
      localStorage.removeItem(stage1Phase);
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function loadState(aircraftId, docId) {
    checked = new Set();
    blanks = {};
    na = new Set();
    currentPhase = 0;
    try {
      const raw = localStorage.getItem(storageKeyChecked(aircraftId, docId));
      if (raw) checked = new Set(JSON.parse(raw));
    } catch (e) { checked = new Set(); }
    try {
      const raw = localStorage.getItem(storageKeyBlanks(aircraftId, docId));
      if (raw) blanks = JSON.parse(raw);
    } catch (e) { blanks = {}; }
    try {
      const raw = localStorage.getItem(storageKeyNA(aircraftId, docId));
      if (raw) na = new Set(JSON.parse(raw));
    } catch (e) { na = new Set(); }
    try {
      const p = parseInt(localStorage.getItem(storageKeyPhase(aircraftId, docId)), 10);
      if (!Number.isNaN(p)) currentPhase = p;
    } catch (e) { currentPhase = 0; }
  }

  function saveChecked() {
    try {
      localStorage.setItem(storageKeyChecked(currentAircraftId, currentDocId), JSON.stringify([...checked]));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function saveBlanks() {
    try {
      localStorage.setItem(storageKeyBlanks(currentAircraftId, currentDocId), JSON.stringify(blanks));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function saveNA() {
    try {
      localStorage.setItem(storageKeyNA(currentAircraftId, currentDocId), JSON.stringify([...na]));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function savePhase() {
    try {
      localStorage.setItem(storageKeyPhase(currentAircraftId, currentDocId), String(currentPhase));
    } catch (e) { /* ignore */ }
  }

  function checkedCountFor(aircraftId, docId) {
    try {
      const checkedRaw = localStorage.getItem(storageKeyChecked(aircraftId, docId));
      const naRaw = localStorage.getItem(storageKeyNA(aircraftId, docId));
      const checkedIds = checkedRaw ? JSON.parse(checkedRaw) : [];
      const naIds = naRaw ? JSON.parse(naRaw) : [];
      return new Set([...checkedIds, ...naIds]).size;
    } catch (e) { return 0; }
  }

  function itemId(phase, idx) {
    return `${phase.id}::${idx}`;
  }

  function isCheckable(item) {
    return item.type === "item" || item.type === "action";
  }

  // Conditional items ("AS REQUIRED" / "AS RQRD") don't always apply on a
  // given flight, so they can be marked N/A instead of left permanently
  // unchecked. N/A counts the same as checked for completion purposes.
  function isOptional(item) {
    return isCheckable(item) && /^AS (REQUIRED|RQRD|REQ)\.?$/i.test((item.response || "").trim());
  }

  function phaseStats(phase) {
    let total = 0, done = 0;
    phase.items.forEach((item, idx) => {
      if (!isCheckable(item)) return;
      total++;
      const id = itemId(phase, idx);
      if (checked.has(id) || na.has(id)) done++;
    });
    return { total, done };
  }

  function overallStats() {
    let total = 0, done = 0;
    data.phases.forEach((phase) => {
      const s = phaseStats(phase);
      total += s.total;
      done += s.done;
    });
    return { total, done };
  }

  function groupColor(groupId) {
    return (data.groups[groupId] && data.groups[groupId].color) || "#00defb";
  }

  // ---------------- Search ----------------

  let searchIndex = [];

  function buildSearchIndex() {
    searchIndex = [];
    data.phases.forEach((phase, phaseIdx) => {
      phase.items.forEach((item, itemIdx) => {
        const text = item.type === "item"
          ? `${item.challenge} — ${item.response}`
          : (item.text || "");
        if (!text) return;
        searchIndex.push({ phaseIdx, itemIdx, phaseTitle: phase.title, text });
      });
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    els.searchResults.innerHTML = "";
    if (!q) {
      els.searchEmpty.hidden = true;
      return;
    }
    const matches = searchIndex.filter((entry) => entry.text.toLowerCase().includes(q)).slice(0, 40);
    els.searchEmpty.hidden = matches.length > 0;

    matches.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "search-result-row";

      const phaseLabel = document.createElement("div");
      phaseLabel.className = "search-result-phase";
      phaseLabel.textContent = entry.phaseTitle;

      const textEl = document.createElement("div");
      textEl.className = "search-result-text";
      const escaped = escapeHtml(entry.text);
      const qEscaped = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      textEl.innerHTML = escaped.replace(new RegExp(`(${qEscaped})`, "ig"), "<mark>$1</mark>");

      li.append(phaseLabel, textEl);
      li.addEventListener("click", () => jumpToSearchResult(entry.phaseIdx, entry.itemIdx));
      els.searchResults.appendChild(li);
    });
  }

  function jumpToSearchResult(phaseIdx, itemIdx) {
    closeSearch();
    goToPhase(phaseIdx);
    requestAnimationFrame(() => {
      const row = els.itemList.querySelector(`[data-item-idx="${itemIdx}"]`);
      if (!row) return;
      row.scrollIntoView({ block: "center" });
      row.classList.add("flash-highlight");
      setTimeout(() => row.classList.remove("flash-highlight"), 1600);
    });
  }

  function openSearch() {
    els.searchOverlay.hidden = false;
    els.searchInput.value = "";
    renderSearchResults("");
    els.searchInput.focus();
  }

  function closeSearch() {
    els.searchOverlay.hidden = true;
  }

  // ---------------- Home / aircraft library ----------------

  function renderContinueCard() {
    let lastOpened = null;
    try { lastOpened = localStorage.getItem(LAST_OPENED_KEY); } catch (e) { /* ignore */ }
    if (!lastOpened) { els.continueCard.hidden = true; return; }

    const [aircraftId, docId] = lastOpened.split("/");
    const aircraft = manifest.aircraft.find((a) => a.id === aircraftId);
    const doc = aircraft && aircraft.documents.find((d) => d.id === docId);
    if (!aircraft || !doc) { els.continueCard.hidden = true; return; }

    const done = checkedCountFor(aircraftId, docId);
    if (done === 0) { els.continueCard.hidden = true; return; }

    let phase = 0;
    try {
      const p = parseInt(localStorage.getItem(storageKeyPhase(aircraftId, docId)), 10);
      if (!Number.isNaN(p)) phase = p;
    } catch (e) { /* ignore */ }

    els.continueTitle.textContent = `${aircraft.name} — ${doc.label}`;
    const metaParts = [];
    if (doc.phaseCount) metaParts.push(`Phase ${phase + 1} of ${doc.phaseCount}`);
    if (doc.itemCount) metaParts.push(`${done}/${doc.itemCount} checked`);
    els.continueMeta.textContent = metaParts.join(" · ");

    els.continueCard.onclick = () => { location.hash = `${aircraftId}/${docId}`; };
    els.continueCard.hidden = false;
  }

  function renderAircraftList() {
    els.aircraftList.innerHTML = "";
    manifest.aircraft.forEach((aircraft) => {
      const group = document.createElement("li");
      group.className = "aircraft-group";

      const header = document.createElement("div");
      header.className = "aircraft-group-header";
      const name = document.createElement("div");
      name.className = "aircraft-group-name";
      name.textContent = aircraft.name;
      const subtitle = document.createElement("div");
      subtitle.className = "aircraft-group-subtitle";
      subtitle.textContent = aircraft.subtitle || "";
      header.append(name, subtitle);
      group.appendChild(header);

      const docList = document.createElement("ul");
      docList.className = "document-list";

      aircraft.documents.forEach((doc) => {
        const li = document.createElement("li");
        li.className = "document-card";
        li.style.setProperty("--card-accent", aircraft.accent || "#00defb");
        li.setAttribute("role", "button");
        li.tabIndex = 0;

        const bar = document.createElement("span");
        bar.className = "document-card-accent";

        const body = document.createElement("div");
        body.className = "document-card-body";

        const label = document.createElement("div");
        label.className = "document-card-label";
        label.textContent = doc.label;

        const meta = document.createElement("div");
        meta.className = "document-card-meta";
        const done = checkedCountFor(aircraft.id, doc.id);
        const metaParts = [];
        if (doc.phaseCount) metaParts.push(`${doc.phaseCount} phases`);
        if (doc.itemCount) metaParts.push(done > 0 ? `${done}/${doc.itemCount} checked` : `${doc.itemCount} items`);
        meta.textContent = metaParts.join(" · ");

        body.append(label, meta);

        const chevron = document.createElement("span");
        chevron.className = "document-card-chevron";
        chevron.textContent = "›";

        li.append(bar, body, chevron);
        li.addEventListener("click", () => { location.hash = `${aircraft.id}/${doc.id}`; });
        docList.appendChild(li);
      });

      group.appendChild(docList);
      els.aircraftList.appendChild(group);
    });
  }

  function showHome() {
    els.checklistView.hidden = true;
    els.homeView.hidden = false;
    returnRoute = null;
    reverseLinks = {};
    closeDrawer();
    closeSearch();
    renderContinueCard();
    renderAircraftList();
  }

  // ---------------- Checklist view ----------------

  function renderPhaseDrawer() {
    els.phaseList.innerHTML = "";
    data.phases.forEach((phase, idx) => {
      const s = phaseStats(phase);
      const li = document.createElement("li");
      li.className = "phase-list-item" + (idx === currentPhase ? " current" : "");
      li.setAttribute("role", "button");
      li.tabIndex = 0;

      const dot = document.createElement("span");
      dot.className = "phase-dot";
      dot.style.background = groupColor(phase.group);

      const title = document.createElement("span");
      title.className = "phase-list-title";
      title.textContent = `${idx + 1}. ${phase.title}`;

      const prog = document.createElement("span");
      prog.className = "phase-list-progress" + (s.total > 0 && s.done === s.total ? " done" : "");
      prog.textContent = s.total ? `${s.done}/${s.total}` : "";

      li.append(dot, title, prog);
      li.addEventListener("click", () => {
        goToPhase(idx);
        closeDrawer();
      });
      els.phaseList.appendChild(li);
    });
  }

  const BLANK_RE = /_{2,}/g;

  function activateFillBlank(span, key) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fill-blank-input";
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.value = blanks[key] || "";
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") input.blur();
    });
    input.addEventListener("blur", () => {
      const val = input.value.trim();
      if (val) blanks[key] = val; else delete blanks[key];
      saveBlanks();
      renderCurrentPhase();
    });
    span.replaceWith(input);
    input.focus();
    input.select();
  }

  function renderFillBlank(itemId_, blankIdx, underscoreLen) {
    const key = `${itemId_}:${blankIdx}`;
    const val = blanks[key];
    const span = document.createElement("span");
    span.className = "fill-blank" + (val ? " filled" : "");
    span.textContent = val || "_".repeat(Math.max(underscoreLen, 3));
    span.setAttribute("role", "button");
    span.tabIndex = 0;
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      activateFillBlank(span, key);
    });
    return span;
  }

  function renderResponse(id, responseText) {
    const response = document.createElement("span");
    response.className = "item-response";
    BLANK_RE.lastIndex = 0;
    let lastIndex = 0;
    let blankIdx = 0;
    let match;
    let hasBlank = false;
    while ((match = BLANK_RE.exec(responseText))) {
      hasBlank = true;
      if (match.index > lastIndex) {
        response.appendChild(document.createTextNode(responseText.slice(lastIndex, match.index)));
      }
      response.appendChild(renderFillBlank(id, blankIdx, match[0].length));
      blankIdx += 1;
      lastIndex = BLANK_RE.lastIndex;
    }
    if (!hasBlank) {
      response.textContent = responseText;
    } else if (lastIndex < responseText.length) {
      response.appendChild(document.createTextNode(responseText.slice(lastIndex)));
    }
    return response;
  }

  function renderItemRow(phase, item, idx) {
    const li = document.createElement("li");
    const id = itemId(phase, idx);
    const checkable = isCheckable(item);
    const isChecked = checkable && checked.has(id);
    const optional = checkable && isOptional(item);
    const isNA = optional && na.has(id);

    li.dataset.itemIdx = idx;
    li.className = "item-row item-" + item.type;
    if (item.emphasis) li.classList.add("emphasis");
    if (isChecked) li.classList.add("checked");
    if (isNA) li.classList.add("na");

    if (item.type === "note" || item.type === "marker") {
      const wrap = document.createElement("div");
      wrap.className = "item-text-wrap";
      wrap.textContent = item.text;
      li.appendChild(wrap);
      return li;
    }

    const box = document.createElement("span");
    box.className = "item-checkbox";
    box.textContent = "✓";

    const wrap = document.createElement("div");
    wrap.className = "item-text-wrap";

    if (item.type === "item") {
      const challenge = document.createElement("span");
      challenge.className = "item-challenge";
      challenge.textContent = item.challenge;

      const leader = document.createElement("span");
      leader.className = "item-leader";

      const response = renderResponse(id, item.response);

      wrap.append(challenge, leader, response);
    } else {
      wrap.textContent = item.text;
    }

    li.append(box, wrap);

    if (optional) {
      const naBtn = document.createElement("span");
      naBtn.className = "na-toggle" + (isNA ? " active" : "");
      naBtn.textContent = "N/A";
      naBtn.setAttribute("role", "button");
      naBtn.tabIndex = 0;
      naBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (na.has(id)) {
          na.delete(id);
        } else {
          na.add(id);
          checked.delete(id);
          saveChecked();
        }
        saveNA();
        renderCurrentPhase();
        renderPhaseDrawer();
        renderOverallProgress();
      });
      li.appendChild(naBtn);
    }

    if (checkable) {
      li.addEventListener("click", () => {
        if (checked.has(id)) {
          checked.delete(id);
        } else {
          checked.add(id);
          if (na.has(id)) { na.delete(id); saveNA(); }
        }
        saveChecked();
        renderCurrentPhase();
        renderPhaseDrawer();
        renderOverallProgress();
      });
    }

    return li;
  }

  function renderCurrentPhase() {
    const phase = data.phases[currentPhase];
    els.phaseTitle.textContent = phase.title;
    els.phaseSub.textContent = `Phase ${currentPhase + 1} of ${data.phases.length}`;

    const s = phaseStats(phase);
    const isComplete = s.total > 0 && s.done === s.total;
    els.phaseProgressLabel.textContent = s.total
      ? (isComplete ? "✓ Phase complete" : `${s.done} of ${s.total} checked`)
      : "Informational";
    els.phaseProgressLabel.classList.toggle("complete", isComplete);
    els.phaseResetBtn.hidden = s.total === 0 || s.done === 0;

    els.itemList.innerHTML = "";
    const banner = document.createElement("div");
    banner.className = "phase-banner";
    banner.style.background = groupColor(phase.group) + "22";
    banner.style.border = "1px solid " + groupColor(phase.group) + "55";
    banner.style.color = groupColor(phase.group);
    banner.textContent = phase.title;
    els.itemList.appendChild(banner);

    phase.items.forEach((item, idx) => {
      els.itemList.appendChild(renderItemRow(phase, item, idx));
    });

    if (phase.linkedReference) {
      const cta = document.createElement("li");
      cta.className = "linked-reference-cta";
      cta.setAttribute("role", "button");
      cta.tabIndex = 0;
      const label = document.createElement("span");
      label.textContent = phase.linkedReference.label || "Read Quick Reference";
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "›";
      cta.append(label, arrow);
      cta.addEventListener("click", () => {
        returnRoute = { aircraftId: currentAircraftId, docId: currentDocId, phaseId: phase.id };
        location.hash = `${currentAircraftId}/${phase.linkedReference.docId}/${phase.linkedReference.phaseId}`;
      });
      els.itemList.appendChild(cta);
    }

    const reverse = reverseLinks[phase.id];
    if (reverse) {
      const cta = document.createElement("li");
      cta.className = "linked-reference-cta reverse";
      cta.setAttribute("role", "button");
      cta.tabIndex = 0;
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "‹";
      const label = document.createElement("span");
      label.textContent = `Read Flow: ${reverse.phaseTitle}`;
      cta.append(arrow, label);
      cta.addEventListener("click", () => {
        location.hash = `${currentAircraftId}/${reverse.docId}/${reverse.phaseId}`;
      });
      els.itemList.appendChild(cta);
    }

    els.backBtn.disabled = currentPhase === 0;
    els.nextBtn.disabled = currentPhase === data.phases.length - 1;
    els.footerPhaseIndex.textContent = `${currentPhase + 1} / ${data.phases.length}`;
  }

  function renderOverallProgress() {
    const s = overallStats();
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    els.progressFill.style.width = pct + "%";
  }

  function goToPhase(idx) {
    currentPhase = Math.max(0, Math.min(data.phases.length - 1, idx));
    savePhase();
    renderCurrentPhase();
    renderPhaseDrawer();
    els.checklistMain.scrollTop = 0;
  }

  function openDrawer() {
    document.body.classList.add("drawer-open");
    els.menuBtn.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    els.menuBtn.setAttribute("aria-expanded", "false");
  }

  // ---------------- Routing ----------------

  async function loadDocData(aircraftId, doc) {
    const cacheKey = `${aircraftId}/${doc.id}`;
    if (docCache[cacheKey]) return docCache[cacheKey];
    const res = await fetch(doc.file);
    const json = await res.json();
    docCache[cacheKey] = json;
    return json;
  }

  function renderReturnBanner(aircraft) {
    const showBanner = returnRoute &&
      (returnRoute.aircraftId !== currentAircraftId || returnRoute.docId !== currentDocId);
    if (!showBanner) {
      els.returnBanner.hidden = true;
      return;
    }
    const fromDoc = aircraft.documents.find((d) => d.id === returnRoute.docId);
    els.returnBannerLabel.textContent = `Back to ${fromDoc ? fromDoc.label : "Flow"}`;
    els.returnBanner.hidden = false;
  }

  async function buildReverseLinks(aircraft, doc) {
    reverseLinks = {};
    for (const otherDoc of aircraft.documents) {
      if (otherDoc.id === doc.id) continue;
      let otherData;
      try {
        otherData = await loadDocData(aircraft.id, otherDoc);
      } catch (e) {
        continue; // sibling doc unreachable (offline, first visit); skip reverse links
      }
      otherData.phases.forEach((p) => {
        if (p.linkedReference && p.linkedReference.docId === doc.id) {
          reverseLinks[p.linkedReference.phaseId] = {
            docId: otherDoc.id,
            phaseId: p.id,
            phaseTitle: p.title,
          };
        }
      });
    }
  }

  async function showChecklist(aircraft, doc, phaseId) {
    currentAircraftId = aircraft.id;
    currentDocId = doc.id;
    saveLastOpened(aircraft.id, doc.id);
    loadState(aircraft.id, doc.id);
    data = await loadDocData(aircraft.id, doc);
    await buildReverseLinks(aircraft, doc);
    buildSearchIndex();

    if (phaseId) {
      const idx = data.phases.findIndex((p) => p.id === phaseId);
      if (idx >= 0) currentPhase = idx;
    }
    if (currentPhase < 0 || currentPhase >= data.phases.length) currentPhase = 0;
    savePhase();

    els.homeView.hidden = true;
    els.checklistView.hidden = false;

    renderReturnBanner(aircraft);
    renderCurrentPhase();
    renderPhaseDrawer();
    renderOverallProgress();
    els.checklistMain.scrollTop = 0;
  }

  // Hash shape: #<aircraftId>/<documentId>[/<phaseId>]
  function parseHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [aircraftId, docId, phaseId] = raw.split("/");
    return { aircraftId, docId, phaseId };
  }

  function handleRoute() {
    const { aircraftId, docId, phaseId } = parseHash();
    const aircraft = aircraftId && manifest.aircraft.find((a) => a.id === aircraftId);
    const doc = aircraft && docId && aircraft.documents.find((d) => d.id === docId);
    if (!aircraft || !doc) {
      showHome();
      return;
    }
    showChecklist(aircraft, doc, phaseId);
  }

  function wireEvents() {
    els.backBtn.addEventListener("click", () => goToPhase(currentPhase - 1));
    els.nextBtn.addEventListener("click", () => goToPhase(currentPhase + 1));
    els.menuBtn.addEventListener("click", openDrawer);
    els.drawerCloseBtn.addEventListener("click", closeDrawer);
    els.drawerScrim.addEventListener("click", closeDrawer);
    els.allAircraftBtn.addEventListener("click", () => { location.hash = ""; });

    els.returnBanner.addEventListener("click", () => {
      if (!returnRoute) return;
      const target = returnRoute;
      returnRoute = null;
      location.hash = `${target.aircraftId}/${target.docId}/${target.phaseId}`;
    });

    els.resetBtn.addEventListener("click", () => {
      resetScope = "all";
      els.resetConfirmTitle.textContent = "Reset for new flight?";
      els.resetConfirmBody.textContent = "This clears every checked item across all phases. This can't be undone.";
      els.resetConfirm.hidden = false;
    });
    els.phaseResetBtn.addEventListener("click", () => {
      resetScope = "phase";
      const phase = data.phases[currentPhase];
      els.resetConfirmTitle.textContent = "Reset this phase?";
      els.resetConfirmBody.textContent = `This clears every checked item in "${phase.title}" only. This can't be undone.`;
      els.resetConfirm.hidden = false;
    });
    els.resetCancelBtn.addEventListener("click", () => {
      els.resetConfirm.hidden = true;
    });
    els.resetConfirmBtn.addEventListener("click", () => {
      if (resetScope === "phase") {
        const phase = data.phases[currentPhase];
        phase.items.forEach((item, idx) => {
          const id = itemId(phase, idx);
          checked.delete(id);
          na.delete(id);
          Object.keys(blanks).forEach((key) => {
            if (key.startsWith(id + ":")) delete blanks[key];
          });
        });
      } else {
        checked.clear();
        na.clear();
        blanks = {};
      }
      saveChecked();
      saveNA();
      saveBlanks();
      renderCurrentPhase();
      renderPhaseDrawer();
      renderOverallProgress();
      els.resetConfirm.hidden = true;
    });

    window.addEventListener("hashchange", handleRoute);

    els.themeToggleBtn.addEventListener("click", toggleTheme);
    els.themeToggleBtnHome.addEventListener("click", toggleTheme);

    els.textSizeBtns.forEach((btn) => {
      btn.addEventListener("click", () => setTextSize(btn.dataset.size));
    });

    els.searchBtn.addEventListener("click", openSearch);
    els.searchCloseBtn.addEventListener("click", closeSearch);
    els.searchInput.addEventListener("input", () => renderSearchResults(els.searchInput.value));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.searchOverlay.hidden) closeSearch();
    });
  }

  async function init() {
    migrateLegacyStorage();
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    applyTextSize(document.documentElement.getAttribute("data-text-size") || "md");
    wireEvents();
    const res = await fetch("data/aircraft/index.json");
    manifest = await res.json();
    handleRoute();
  }

  init();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline install can proceed without SW update */ });
    });
  }
})();
