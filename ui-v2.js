/* Hevy Analytics UI v2 — 5 hoofdsecties, responsive */
(() => {
  const UI_STATE_KEY = "hevy_dashboard_ui_v2";

  const PAGES = {
    home: {
      label: "Home",
      defaultSub: "summary",
      subs: {
        summary: { label: "Overzicht", sections: ["overview", "periodComparison", "goalTracker"] }
      }
    },
    progress: {
      label: "Progress",
      defaultSub: "exercise",
      subs: {
        exercise: { label: "Oefening", sections: ["detailPanel", "annotationsPanel"] },
        compare: { label: "Vergelijken", sections: ["exerciseControls", "exerciseChartPanel"], sidebar: true },
        records: { label: "Records & PR's", sections: ["prCenter", "recordsPage"] },
        history: { label: "Historie", sections: ["exerciseEvolution"] }
      }
    },
    training: {
      label: "Training",
      defaultSub: "calendar",
      subs: {
        calendar: { label: "Kalender", sections: ["trainingCalendar"] },
        consistency: { label: "Consistentie", sections: ["consistencyPanel"] }
      }
    },
    muscles: {
      label: "Spiergroepen",
      defaultSub: "distribution",
      subs: {
        distribution: { label: "Verdeling", sections: ["musclePanel"] },
        volume: { label: "Volume", sections: ["muscleVolume"] },
        progress: { label: "Progressie", sections: ["muscleProgress"] }
      }
    },
    analysis: {
      label: "Analyse",
      defaultSub: "plateaus",
      subs: {
        plateaus: { label: "Plateaus", sections: ["plateauDetector"] },
        fatigue: { label: "Set fatigue", sections: ["setPerformancePanel"] },
        context: { label: "Context", sections: ["routinePerfPanel"] }
      }
    }
  };

  const legacyMap = {
    overview: ["home", "summary"],
    exercises: ["progress", "exercise"],
    prs: ["progress", "records"],
    calendar: ["training", "calendar"],
    muscles: ["muscles", "distribution"],
    analysis: ["analysis", "plateaus"],
    history: ["progress", "history"],
    goals: ["home", "summary"],
    records: ["progress", "records"],
    update: ["home", "summary"]
  };

  function loadState() {
    try { return JSON.parse(localStorage.getItem(UI_STATE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveState(page, sub) {
    try { localStorage.setItem(UI_STATE_KEY, JSON.stringify({page, sub})); } catch (_) {}
  }

  function parseHash() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw) return null;
    const [a,b] = raw.split(":");
    if (PAGES[a]) return [a, PAGES[a].subs[b] ? b : PAGES[a].defaultSub];
    return legacyMap[a] || null;
  }

  function allSections() {
    return [...document.querySelectorAll(".page-section")];
  }

  function buildChrome() {
    const nav = document.querySelector(".app-tabs");
    if (!nav) return;
    nav.innerHTML = Object.entries(PAGES).map(([key,p]) =>
      `<button class="app-tab" type="button" data-ui-page="${key}">${p.label}</button>`
    ).join("");

    const main = document.querySelector(".main");
    if (main && !document.getElementById("uiSubnav")) {
      const sub = document.createElement("nav");
      sub.id = "uiSubnav";
      sub.className = "ui-subnav";
      sub.setAttribute("aria-label", "Subnavigatie");
      main.prepend(sub);

      const toggle = document.createElement("button");
      toggle.id = "uiExerciseToggle";
      toggle.type = "button";
      toggle.className = "ui-mobile-exercise-toggle";
      toggle.textContent = "Oefeningen kiezen";
      sub.insertAdjacentElement("afterend", toggle);
    }

    const stats = document.querySelector(".top-stats");
    if (stats && !document.getElementById("uiDataLink")) {
      const link = document.createElement("a");
      link.id = "uiDataLink";
      link.className = "ui-data-link";
      link.href = "./index.html";
      link.textContent = "Data beheren";
      stats.appendChild(link);
    }

    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !document.getElementById("uiSidebarClose")) {
      const close = document.createElement("button");
      close.id = "uiSidebarClose";
      close.type = "button";
      close.className = "ui-sidebar-close";
      close.textContent = "Sluiten";
      const top = sidebar.querySelector(".sidebar-top");
      if (top) top.appendChild(close); else sidebar.prepend(close);
    }
    if (!document.getElementById("uiSidebarBackdrop")) {
      const backdrop = document.createElement("div");
      backdrop.id = "uiSidebarBackdrop";
      backdrop.className = "ui-sidebar-backdrop";
      document.body.appendChild(backdrop);
    }
  }

  function renderSubnav(page, activeSub) {
    const host = document.getElementById("uiSubnav");
    if (!host) return;
    const entries = Object.entries(PAGES[page].subs);
    host.innerHTML = entries.length > 1 ? entries.map(([key,s]) =>
      `<button class="ui-subtab${key===activeSub?" active":""}" type="button" data-ui-sub="${key}">${s.label}</button>`
    ).join("") : "";
    host.style.display = entries.length > 1 ? "flex" : "none";
    host.querySelectorAll("[data-ui-sub]").forEach(btn => {
      btn.addEventListener("click", () => show(page, btn.dataset.uiSub));
    });
  }

  function setSidebar(enabled) {
    document.body.classList.toggle("ui-progress-compare", !!enabled);
    if (!enabled) document.body.classList.remove("ui-sidebar-open");
    const dashboard = document.querySelector(".dashboard");
    if (dashboard) dashboard.classList.toggle("no-sidebar", !enabled);
  }

  function show(page, sub, opts={}) {
    if (legacyMap[page]) [page, sub] = legacyMap[page];
    if (!PAGES[page]) page = "home";
    if (!PAGES[page].subs[sub]) sub = PAGES[page].defaultSub;
    const spec = PAGES[page].subs[sub];
    const visible = new Set(spec.sections);

    allSections().forEach(el => {
      el.classList.remove("active-page-section", "ui-visible");
      if (visible.has(el.id)) el.classList.add("ui-visible");
    });

    document.querySelectorAll(".app-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.uiPage === page);
    });
    renderSubnav(page, sub);
    setSidebar(spec.sidebar);
    saveState(page, sub);

    if (opts.hash !== false) {
      try { history.replaceState(null, "", `#${page}:${sub}`); } catch (_) {}
    }
    if (opts.scroll !== false) window.scrollTo({top:0, behavior: opts.instant ? "auto" : "smooth"});

    requestAnimationFrame(() => requestAnimationFrame(() => {
      try { if (typeof resizeVisiblePlots === "function") resizeVisiblePlots(); } catch (_) {}
    }));
  }

  function mapExternalSwitch(page, scrollTop=true) {
    const mapped = legacyMap[page];
    if (mapped) return show(mapped[0], mapped[1], {scroll:scrollTop});
    if (PAGES[page]) return show(page, PAGES[page].defaultSub, {scroll:scrollTop});
    return show("home", "summary", {scroll:scrollTop});
  }

  function wireEvents() {
    document.querySelectorAll(".app-tab").forEach(btn => {
      btn.addEventListener("click", () => show(btn.dataset.uiPage, PAGES[btn.dataset.uiPage].defaultSub));
    });
    document.getElementById("uiExerciseToggle")?.addEventListener("click", () => document.body.classList.add("ui-sidebar-open"));
    document.getElementById("uiSidebarClose")?.addEventListener("click", () => document.body.classList.remove("ui-sidebar-open"));
    document.getElementById("uiSidebarBackdrop")?.addEventListener("click", () => document.body.classList.remove("ui-sidebar-open"));
    document.querySelector(".sidebar")?.addEventListener("click", e => {
      if (window.innerWidth <= 900 && e.target.closest(".focus-link")) document.body.classList.remove("ui-sidebar-open");
    });
  }

  function init() {
    buildChrome();
    wireEvents();
    try { window.switchDashboardPage = mapExternalSwitch; } catch (_) {}
    try { switchDashboardPage = mapExternalSwitch; } catch (_) {}

    const fromHash = parseHash();
    const st = loadState();
    const initial = fromHash || (PAGES[st.page] ? [st.page, PAGES[st.page].subs[st.sub] ? st.sub : PAGES[st.page].defaultSub] : ["home","summary"]);
    show(initial[0], initial[1], {scroll:false, hash:false, instant:true});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
