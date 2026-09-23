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
    resetConfirm: document.getElementById("reset-confirm"),
    resetCancelBtn: document.getElementById("reset-cancel-btn"),
    resetConfirmBtn: document.getElementById("reset-confirm-btn"),
    checklistMain: document.getElementById("checklist-main"),
  };

  let manifest = null;
  const docCache = {};

  let currentAircraftId = null;
  let currentDocId = null;
  let data = null;
  let checked = new Set();
  let currentPhase = 0;

  // Set when a linkedReference CTA jumps from one document to another, so a
  // "Back to Flow" banner can bring you straight back to where you left off.
  // Cleared on use or on returning Home.
  let returnRoute = null;

  function storageKeyChecked(aircraftId, docId) { return `sop:${aircraftId}:${docId}:checked`; }
  function storageKeyPhase(aircraftId, docId) { return `sop:${aircraftId}:${docId}:phase`; }

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
    currentPhase = 0;
    try {
      const raw = localStorage.getItem(storageKeyChecked(aircraftId, docId));
      if (raw) checked = new Set(JSON.parse(raw));
    } catch (e) { checked = new Set(); }
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

  function savePhase() {
    try {
      localStorage.setItem(storageKeyPhase(currentAircraftId, currentDocId), String(currentPhase));
    } catch (e) { /* ignore */ }
  }

  function checkedCountFor(aircraftId, docId) {
    try {
      const raw = localStorage.getItem(storageKeyChecked(aircraftId, docId));
      if (!raw) return 0;
      return JSON.parse(raw).length;
    } catch (e) { return 0; }
  }

  function itemId(phase, idx) {
    return `${phase.id}::${idx}`;
  }

  function isCheckable(item) {
    return item.type === "item" || item.type === "action";
  }

  function phaseStats(phase) {
    let total = 0, done = 0;
    phase.items.forEach((item, idx) => {
      if (!isCheckable(item)) return;
      total++;
      if (checked.has(itemId(phase, idx))) done++;
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

  // ---------------- Home / aircraft library ----------------

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
    closeDrawer();
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

  function renderItemRow(phase, item, idx) {
    const li = document.createElement("li");
    const id = itemId(phase, idx);
    const checkable = isCheckable(item);
    const isChecked = checkable && checked.has(id);

    li.className = "item-row item-" + item.type;
    if (item.emphasis) li.classList.add("emphasis");
    if (isChecked) li.classList.add("checked");

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

      const response = document.createElement("span");
      response.className = "item-response";
      response.textContent = item.response;

      wrap.append(challenge, leader, response);
    } else {
      wrap.textContent = item.text;
    }

    li.append(box, wrap);

    if (checkable) {
      li.addEventListener("click", () => {
        if (checked.has(id)) checked.delete(id);
        else checked.add(id);
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
    els.phaseProgressLabel.textContent = s.total ? `${s.done} of ${s.total} checked` : "Informational";

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

  async function showChecklist(aircraft, doc, phaseId) {
    currentAircraftId = aircraft.id;
    currentDocId = doc.id;
    loadState(aircraft.id, doc.id);
    data = await loadDocData(aircraft.id, doc);

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
      els.resetConfirm.hidden = false;
    });
    els.resetCancelBtn.addEventListener("click", () => {
      els.resetConfirm.hidden = true;
    });
    els.resetConfirmBtn.addEventListener("click", () => {
      checked.clear();
      saveChecked();
      renderCurrentPhase();
      renderPhaseDrawer();
      renderOverallProgress();
      els.resetConfirm.hidden = true;
    });

    window.addEventListener("hashchange", handleRoute);
  }

  async function init() {
    migrateLegacyStorage();
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
