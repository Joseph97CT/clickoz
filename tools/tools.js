/* =========================================================
   Clickoz Tools — tools.js
   - Category chips => scroll to sections
   - Scroll-spy => highlights active chip
   - URL hash sync (#seo #text #dev #creator)
   - Optional search hook (ready)
========================================================= */

(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---- Config
  const NAV_ID = "topNav";                 // your sticky nav id
  const CHIPS_ID = "toolsChips";           // chips container id
  const SEARCH_ID = "toolsSearch";         // optional search input id
  const GRID_ID = "toolsGrid";             // optional grid id (if you still keep cards in one grid)
  const SECTION_ATTR = "data-section";     // sections will have data-section="seo|text|dev|creator"

  // Categories mapping
  const CATS = [
    { key: "all",    hash: "#all"     },
    { key: "seo",    hash: "#seo"     },
    { key: "text",   hash: "#text"    },
    { key: "dev",    hash: "#dev"     },
    { key: "creator",hash: "#creator" }
  ];

  const nav = $("#" + NAV_ID);
  const chips = $("#" + CHIPS_ID);
  if (!chips) return;

  // Helper: current sticky offset
  function navOffset() {
    if (!nav) return 12;
    const r = nav.getBoundingClientRect();
    // extra spacing so titles don't hide under sticky bar
    return Math.max(12, Math.round(r.height + 14));
  }

  // Sections (you will add these in HTML as separate blocks)
  // Example:
  // <section class="tool-section" id="seo" data-section="seo">...</section>
  const sections = $$(`[${SECTION_ATTR}]`);

  // Chips (expected markup):
  // <div class="chip" data-filter="seo">SEO</div>
  const chipEls = $$("#" + CHIPS_ID + " .chip");

  function setActiveChip(key) {
    chipEls.forEach(c => c.classList.toggle("active", (c.dataset.filter || "") === key));
  }

  function scrollToSection(key) {
    if (key === "all") {
      // All => scroll to top of tools shell (or first section)
      const first = sections[0];
      const y = first ? window.scrollY + first.getBoundingClientRect().top - navOffset() : 0;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      return;
    }
    const target = sections.find(s => (s.getAttribute(SECTION_ATTR) || "") === key) || document.getElementById(key);
    if (!target) return;

    const y = window.scrollY + target.getBoundingClientRect().top - navOffset();
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function updateHashFor(key) {
    const item = CATS.find(x => x.key === key);
    if (!item) return;
    // replaceState = no jump
    history.replaceState(null, "", item.hash === "#all" ? "#all" : item.hash);
  }

  // ---- Click / keyboard on chips
  function onChipActivate(chip) {
    const key = (chip.dataset.filter || "all").toLowerCase();
    setActiveChip(key);
    updateHashFor(key);
    scrollToSection(key);
  }

  chips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    onChipActivate(chip);
  });

  chips.addEventListener("keydown", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChipActivate(chip);
    }
  });

  // ---- Scroll-spy: highlight active chip while scrolling
  let spyTicking = false;

  function getCurrentSectionKey() {
    if (!sections.length) return "all";

    const off = navOffset();
    // Find the last section whose top is above the offset line
    let current = sections[0];
    for (const s of sections) {
      const top = s.getBoundingClientRect().top - off;
      if (top <= 6) current = s;
      else break;
    }
    return (current.getAttribute(SECTION_ATTR) || "all").toLowerCase();
  }

  function runSpy() {
    const key = getCurrentSectionKey();
    setActiveChip(key);

    // Keep hash in sync but only if user is within tools page sections
    // (avoid fighting when user scrolls into footer/faq etc.)
    if (sections.length) {
      const firstTop = sections[0].getBoundingClientRect().top - navOffset();
      const lastBottom = sections[sections.length - 1].getBoundingClientRect().bottom - navOffset();
      const inside = firstTop <= 10 && lastBottom >= 60;
      if (inside) updateHashFor(key);
    }
  }

  window.addEventListener("scroll", () => {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => {
      runSpy();
      spyTicking = false;
    });
  }, { passive: true });

  // ---- Handle initial hash
  function initFromHash() {
    const h = (location.hash || "").replace("#", "").trim().toLowerCase();
    const allowed = new Set(CATS.map(x => x.key));
    const key = allowed.has(h) ? h : (h ? h : "all");

    setActiveChip(key);
    // delay ensures layout is stable (fonts, etc.)
    if (key && key !== "all") {
      setTimeout(() => scrollToSection(key), 60);
    }
  }

  // ---- Optional: Search (ready to be used if you keep a single grid with data-cat/data-hay)
  // If you switch to sections-only, you can ignore this.
  const search = $("#" + SEARCH_ID);
  const grid = $("#" + GRID_ID);
  const cards = grid ? $$("#" + GRID_ID + " a.card") : [];

  function normalize(s){ return (s || "").toLowerCase().trim(); }

  function filterCards(term) {
    if (!grid || !cards.length) return;
    const t = normalize(term);
    cards.forEach(card => {
      const hay = normalize((card.dataset.hay || "") + " " + (card.textContent || ""));
      card.style.display = (!t || hay.includes(t)) ? "" : "none";
    });
  }

  if (search) {
    let t = null;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => filterCards(search.value), 70);
    });

    // shortcut "/"
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && document.activeElement !== search) {
        e.preventDefault();
        search.focus();
      }
    });
  }

  // Init
  initFromHash();
  runSpy();
})();
