(() => {
  "use strict";

  const STORAGE_CHECKED = "a380x-sop-checked-v1";
  const STORAGE_PHASE = "a380x-sop-phase-v1";

  const els = {
    phaseTitle: document.getElementById("phase-title"),
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
    resetBtn: document.getElementById("reset-btn"),
    resetConfirm: document.getElementById("reset-confirm"),
    resetCancelBtn: document.getElementById("reset-cancel-btn"),
    resetConfirmBtn: document.getElementById("reset-confirm-btn"),
    checklistMain: document.getElementById("checklist-main"),
  };

  let data = null;
  let checked = new Set();
  let currentPhase = 0;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_CHECKED);
      if (raw) checked = new Set(JSON.parse(raw));
    } catch (e) { checked = new Set(); }
    try {
      const p = parseInt(localStorage.getItem(STORAGE_PHASE), 10);
      if (!Number.isNaN(p)) currentPhase = p;
    } catch (e) { currentPhase = 0; }
  }

  function saveChecked() {
    try {
      localStorage.setItem(STORAGE_CHECKED, JSON.stringify([...checked]));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function savePhase() {
    try {
      localStorage.setItem(STORAGE_PHASE, String(currentPhase));
    } catch (e) { /* ignore */ }
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
    document.getElementById("phase-sub").textContent = `Phase ${currentPhase + 1} of ${data.phases.length}`;

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

  function wireEvents() {
    els.backBtn.addEventListener("click", () => goToPhase(currentPhase - 1));
    els.nextBtn.addEventListener("click", () => goToPhase(currentPhase + 1));
    els.menuBtn.addEventListener("click", openDrawer);
    els.drawerCloseBtn.addEventListener("click", closeDrawer);
    els.drawerScrim.addEventListener("click", closeDrawer);

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
  }

  async function init() {
    loadState();
    wireEvents();
    const res = await fetch("data/checklist.json");
    data = await res.json();
    if (currentPhase >= data.phases.length) currentPhase = 0;
    renderCurrentPhase();
    renderPhaseDrawer();
    renderOverallProgress();
  }

  init();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline install can proceed without SW update */ });
    });
  }
})();
