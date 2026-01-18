/* Clickoz site.js — clean + mobile-safe */
(function () {
  "use strict";

  // ===== Mobile SAFE MODE: Android/iPhone =====
  const SAFE_MOBILE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  window.CLICK0Z_SAFE_MOBILE = SAFE_MOBILE;

  // ===== Helpers =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Accent theme =====
  const ACCENT_KEY = "clickozAccent";
  const ACCENT2_KEY = "clickozAccent2";

  function setAccent(accent, accent2) {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent2", accent2 || accent);

    const dot = $("#colorDot");
    if (dot) dot.style.background = accent;

    // activate option
    $$(".color-option").forEach(o => {
      const a = o.getAttribute("data-accent");
      o.classList.toggle("active", a === accent);
    });

    // persist
    try {
      localStorage.setItem(ACCENT_KEY, accent);
      localStorage.setItem(ACCENT2_KEY, accent2 || accent);
    } catch {}
  }

  function loadSavedAccent() {
    try {
      const a = localStorage.getItem(ACCENT_KEY);
      const a2 = localStorage.getItem(ACCENT2_KEY);
      if (a) setAccent(a, a2 || a);
    } catch {}
  }

  // ===== Accent dropdown UI =====
  function initAccentPicker() {
    const toggle = $("#colorToggle");
    const menu = $("#colorMenu");
    if (!toggle || !menu) return;

    const open = () => {
      menu.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const isOpen = () => menu.classList.contains("open");

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      isOpen() ? close() : open();
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) close();
    });

    // options
    $$(".color-option", menu).forEach((opt) => {
      opt.addEventListener("click", () => {
        const a = opt.getAttribute("data-accent");
        const a2 = opt.getAttribute("data-accent2");
        if (a) setAccent(a, a2 || a);
      });
      opt.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          opt.click();
        }
      });
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ===== Cookie consent + Google Translate gated =====
  const CONSENT_KEY = "clickozConsent"; // "all" | "essential" | "reject"
  const cookieEl = $(".cookie");
  const btnReject = $("#cookieReject");
  const btnEssential = $("#cookieEssential");
  const btnAccept = $("#cookieAccept");
  const btnClose = $("#cookieClose");
  const gtWrap = $("#gtNavWrap");

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch {}
  }
  function showCookie() {
    if (!cookieEl) return;
    cookieEl.classList.add("show");
  }
  function hideCookie() {
    if (!cookieEl) return;
    cookieEl.classList.remove("show");
  }

  function enableGoogleTranslate() {
    if (!gtWrap) return;
    gtWrap.style.display = "block";

    // avoid double-load
    if (window.__clickoz_gt_loaded) return;
    window.__clickoz_gt_loaded = true;

    window.googleTranslateElementInit = function () {
      // eslint-disable-next-line no-undef
      new google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };

    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.head.appendChild(s);
  }

  function applyConsent() {
    const c = getConsent();

    if (!c) {
      showCookie();
      if (gtWrap) gtWrap.style.display = "none";
      return;
    }

    hideCookie();

    if (c === "all") enableGoogleTranslate();
    else if (gtWrap) gtWrap.style.display = "none";
  }

  function initCookieUI() {
    if (!cookieEl) return;

    const setAndApply = (v) => {
      setConsent(v);
      applyConsent();
    };

    if (btnReject) btnReject.addEventListener("click", () => setAndApply("reject"));
    if (btnEssential) btnEssential.addEventListener("click", () => setAndApply("essential"));
    if (btnAccept) btnAccept.addEventListener("click", () => setAndApply("all"));
    if (btnClose) btnClose.addEventListener("click", () => setAndApply("essential"));
  }

  // ===== Tools search + category chips =====
  function initToolsFilter() {
    const search = $("#toolSearch");
    const grid = $("#grid");
    const chips = $("#chips");
    if (!grid) return;

    const cards = $$("a.card", grid);
    let activeCat = "all";
    let q = "";

    function normalize(s) {
      return (s || "").toLowerCase().trim();
    }

    function apply() {
      const query = normalize(q);
      cards.forEach((card) => {
        const cat = card.getAttribute("data-cat") || "all";
        const hay = normalize(card.getAttribute("data-hay") || "") + " " + normalize(card.textContent || "");

        const okCat = (activeCat === "all") || (cat === activeCat);
        const okQ = !query || hay.includes(query);

        card.style.display = (okCat && okQ) ? "" : "none";
      });
    }

    if (search) {
      search.addEventListener("input", () => {
        q = search.value || "";
        apply();
      });
    }

    if (chips) {
      $$(".chip", chips).forEach((chip) => {
        chip.addEventListener("click", () => {
          $$(".chip", chips).forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          activeCat = chip.getAttribute("data-filter") || "all";
          apply();
        });
        chip.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            chip.click();
          }
        });
      });
    }

    // Shortcut "/" focuses search
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        if (search) search.focus();
      }
    });

    apply();
  }

  // ===== Recommended random picks =====
  function initRecommended() {
    const pool = [
      { href:"/tool/word-counter/", icon:"🔢", title:"Word Counter", desc:"Count words, characters, sentences, and reading time for briefs, essays, and SEO drafts.", cta:"Use Word Counter" },
      { href:"/tool/readability-analyzer/", icon:"📚", title:"Readability Analyzer", desc:"Get a readability score, grade level, and clear edits to make text easier to skim and understand.", cta:"Use Readability Analyzer" },
      { href:"/tool/meta-tags/", icon:"🏷️", title:"Meta Tag Optimizer", desc:"Preview SERP titles/descriptions, check length, and refine wording to improve click-through rate.", cta:"Use Meta Tag Optimizer" },
      { href:"/tool/keyword-density/", icon:"🎯", title:"Keyword Density", desc:"Measure keyword frequency and phrases to avoid overuse and keep relevance natural.", cta:"Use Keyword Density" },
      { href:"/tool/json-formatter/", icon:"🧾", title:"JSON Formatter", desc:"Prettify/minify JSON instantly, validate structure, and fix common syntax mistakes.", cta:"Use JSON Formatter" },
      { href:"/tool/url-encoder/", icon:"🔗", title:"URL Encoder", desc:"Encode/decode URLs and query strings safely for tracking, redirects, and debugging.", cta:"Use URL Encoder" },
      { href:"/tool/base64/", icon:"🔐", title:"Base64 Encoder", desc:"Quickly encode/decode Base64 for tokens, payloads, and developer workflows.", cta:"Use Base64" }
    ];

    function pick3() {
      // stable daily shuffle (so it doesn’t “jump” every refresh on mobile)
      const d = new Date();
      const seed = (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate());
      let x = seed % 2147483647;
      const rnd = () => (x = (x * 48271) % 2147483647) / 2147483647;

      const arr = pool.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, 3);
    }

    const picks = pick3();

    for (let i = 1; i <= 3; i++) {
      const p = picks[i - 1];
      const a = $("#randTool" + i);
      const ic = $("#randIcon" + i);
      const tt = $("#randTitle" + i);
      const dd = $("#randDesc" + i);
      const cc = $("#randCta" + i);
      if (!a || !p) continue;

      a.setAttribute("href", p.href);
      if (ic) ic.textContent = p.icon;
      if (tt) tt.textContent = p.title;
      if (dd) dd.textContent = p.desc;
      if (cc) cc.textContent = p.cta;
    }
  }

  // ===== Init =====
  loadSavedAccent();
  initAccentPicker();
  initCookieUI();
  applyConsent();
  initToolsFilter();
  initRecommended();

  // ===== Mobile stability: no heavy FX (we keep it clean) =====
  if (SAFE_MOBILE) {
    // if any old fx elements exist, hide them (no break)
    const p = document.getElementById("clickozParticles");
    if (p) p.style.display = "none";
    const g = document.querySelector(".__grain");
    if (g) g.style.display = "none";
  }
})();
