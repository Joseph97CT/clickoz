(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const rnd = (a,b)=>Math.random()*(b-a)+a;

  const prefersReduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     0) Helpers
  ========================================================= */
  function closeAllMenus(){
    $$('.menu.active').forEach(m => m.classList.remove('active'));
    $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeAllMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });

  function hexToRgbTriplet(hex){
    const h = (hex || '').replace('#','').trim();
    if (h.length === 3){
      const r = parseInt(h[0]+h[0], 16);
      const g = parseInt(h[1]+h[1], 16);
      const b = parseInt(h[2]+h[2], 16);
      return `${r},${g},${b}`;
    }
    if (h.length === 6){
      const r = parseInt(h.slice(0,2), 16);
      const g = parseInt(h.slice(2,4), 16);
      const b = parseInt(h.slice(4,6), 16);
      return `${r},${g},${b}`;
    }
    return "99,102,241";
  }

  function setAccent(a1, a2){
    document.documentElement.style.setProperty('--accent', a1);
    document.documentElement.style.setProperty('--accent2', a2 || a1);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(a1));
    const dot = $('#colorDot');
    if (dot) dot.style.background = a1;

    try{
      localStorage.setItem('clickoz_accent', JSON.stringify({a1, a2: a2 || a1}));
    }catch(_){}
  }

  /* =========================================================
     1) Accent menu (dot + palette)
  ========================================================= */
  (function initAccent(){
    const toggle = $('#colorToggle');
    const menu   = $('#colorMenu');
    if(!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.contains('active');
      closeAllMenus();
      menu.classList.toggle('active', !open);
      toggle.setAttribute('aria-expanded', String(!open));
    });

    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const opt = e.target.closest('.color-option');
      if(!opt) return;

      $$('.color-option').forEach(x => x.classList.remove('active'));
      opt.classList.add('active');

      setAccent(opt.dataset.accent, opt.dataset.accent2);
      closeAllMenus();

      burstParticles(); // FX on change
    });

    // restore saved accent
    try{
      const saved = JSON.parse(localStorage.getItem('clickoz_accent') || 'null');
      if(saved?.a1){
        setAccent(saved.a1, saved.a2);
        const match = $$('.color-option').find(x => x.dataset.accent === saved.a1);
        if(match){
          $$('.color-option').forEach(x => x.classList.remove('active'));
          match.classList.add('active');
        }
      }else{
        // ensure accent-rgb exists even if CSS sets accent
        const a = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';
        document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(a));
        const dot = $('#colorDot');
        if (dot) dot.style.background = a;
      }
    }catch(_){}
  })();

  /* =========================================================
     2) "/" focuses search (nice UX)
  ========================================================= */
  (function slashFocus(){
    const search = $('#toolSearch');
    if(!search) return;
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement !== search){
        e.preventDefault();
        search.focus();
      }
    });
  })();

  /* =========================================================
     3) Search + Chips filter (works with data-cat OR fallback)
  ========================================================= */
  (function searchAndChips(){
    const grid  = $('#grid');
    const chips = $('#chips');
    const q     = $('#toolSearch');
    if(!grid || !chips || !q) return;

    const cards = Array.from(grid.querySelectorAll('a.card'));
    let filter = 'all';

    // optional fallback: infer cat from slug if you don't set data-cat
    const SEO = new Set([
      "word-counter-pro","readability-analyzer","keyword-density","meta-tags",
      "title-description","alt-text","seo-outline"
    ]);
    const TEXT = new Set(["word-counter","readability-analyzer"]);
    function catFromSlug(slug){
      if (SEO.has(slug)) return "seo";
      if (TEXT.has(slug)) return "text";
      return "dev";
    }

    function apply(){
      const term = (q.value || '').trim().toLowerCase();
      cards.forEach(card => {
        const hay = (card.dataset.hay || "").toLowerCase();
        const title = (card.querySelector('h3')?.textContent || "").toLowerCase();

        const okTerm = !term || hay.includes(term) || title.includes(term);

        const cat = (card.dataset.cat || "").toLowerCase();
        const slug = card.getAttribute('data-slug') || "";
        const resolved = cat || catFromSlug(slug);

        const okCat = (filter === "all") || (resolved === filter);

        card.style.display = (okTerm && okCat) ? "" : "none";
      });
    }

    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if(!chip) return;
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      filter = chip.dataset.filter || "all";
      apply();
    });

    q.addEventListener('input', apply);
    apply();
  })();

  /* =========================================================
     4) Recommended Now random picks
     - Expects slots ids in HTML:
       randTool1/2/3 (anchor), randIcon1/2/3, randTitle1/2/3,
       randDesc1/2/3, randCta1/2/3
  ========================================================= */
  (function recommendedRandom(){
    const grid = $('#grid');
    if(!grid) return;
    const cards = $$('#grid a.card');
    if(cards.length < 3) return;

    function pickDistinct(n){
      const idx = new Set();
      while(idx.size < n) idx.add(Math.floor(Math.random() * cards.length));
      return Array.from(idx).map(i => cards[i]);
    }

    function extract(card){
      const title = (card.querySelector('h3')?.textContent || 'Tool').trim();
      const icon  = (card.querySelector('.thumb')?.textContent || '✨').trim();
      const href  = card.getAttribute('href') || '#';
      const desc  = (card.querySelector('p')?.textContent || '').trim();
      return { href, icon, title, desc };
    }

    const picks = pickDistinct(3).map(extract);
    const slots = [
      {a:'randTool1', i:'randIcon1', t:'randTitle1', d:'randDesc1', c:'randCta1'},
      {a:'randTool2', i:'randIcon2', t:'randTitle2', d:'randDesc2', c:'randCta2'},
      {a:'randTool3', i:'randIcon3', t:'randTitle3', d:'randDesc3', c:'randCta3'},
    ];

    slots.forEach((slot, k) => {
      const p = picks[k];
      const a = $('#' + slot.a);
      if(!a) return;
      a.href = p.href;

      const i = $('#' + slot.i);
      const t = $('#' + slot.t);
      const d = $('#' + slot.d);
      const c = $('#' + slot.c);

      if (i) i.textContent = p.icon;
      if (t) t.textContent = p.title;
      if (d && p.desc) d.textContent = p.desc;
      if (c) c.textContent = `Use ${p.title}`;
    });
  })();

  /* =========================================================
     5) Cookie banner + Google Translate loader (privacy)
     - Uses your existing cookie HTML:
       .cookie, buttons: #cookieAccept, #cookieEssential, #cookieReject
       optional: #cookieClose
     - Shows GT only if accepted "all"
  ========================================================= */
  (function consentAndGT(){
    const KEY = "clickoz_consent";
    const banner = $('.cookie');
    const gtWrap  = $('#gtNavWrap');

    function setCookie(name, value, days){
      const maxAge = days ? `; Max-Age=${days*24*60*60}` : "";
      document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; Path=/; SameSite=Lax`;
    }
    function getCookie(name){
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return m ? decodeURIComponent(m[1]) : null;
    }
    function store(val){
      try { localStorage.setItem(KEY, val); } catch(e){}
      setCookie(KEY, val, 365);
    }
    function readStored(){
      try { return localStorage.getItem(KEY); } catch(e){ return null; }
    }

    function hideBanner(){
      banner?.classList.remove('show');
    }

    function loadGoogleTranslate(){
      if (window.__gt_loaded) return;
      window.__gt_loaded = true;

      if (gtWrap) gtWrap.classList.add('show');

      window.googleTranslateElementInit = function(){
        // Page language should match <html lang="en">
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );
      };

      const s = document.createElement('script');
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    }

    const existing = readStored() || getCookie(KEY);
    if (!existing){
      banner?.classList.add('show');
    } else {
      if (existing === "all") loadGoogleTranslate();
    }

    $('#cookieAccept')?.addEventListener('click', () => {
      store("all");
      hideBanner();
      loadGoogleTranslate();
    });

    $('#cookieEssential')?.addEventListener('click', () => {
      store("essential");
      hideBanner();
    });

    $('#cookieReject')?.addEventListener('click', () => {
      store("none");
      hideBanner();
    });

    $('#cookieClose')?.addEventListener('click', () => {
      hideBanner();
    });
  })();

  /* =========================================================
     6) Grain + Particles (idle + burst)
  ========================================================= */
  function ensureGrain(){
    if (prefersReduce) return;
    if ($('.__grain')) return;
    const g = document.createElement('div');
    g.className = "__grain";
    document.body.appendChild(g);
  }

  function ensureParticlesLayer(){
    if (prefersReduce) return null;
    let layer = $('#clickozParticles');
    if(!layer){
      layer = document.createElement('div');
      layer.id = "clickozParticles";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function buildIdleParticles(){
    if (prefersReduce) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;

    if (layer.querySelector('.pidle')) return; // don't duplicate

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 55 : 120;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement('span');
      p.className = "pidle";
      p.style.left = rnd(4, 96) + "%";
      p.style.top  = rnd(6, 94) + "%";
      p.style.setProperty("--ix", rnd(-220, 220).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(-180, 260).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(10, 24).toFixed(2) + "s");
      layer.appendChild(p);
    }
  }

  function burstParticles(){
    if (prefersReduce) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;

    // remove only previous bursts
    layer.querySelectorAll(".pburst").forEach(n => n.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 110 : 240;

    // origin from hero area
    const ORIGIN_X = 50; // %
    const ORIGIN_Y = 22; // %

    const MAX_DELAY = 0.55;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement("span");
      p.className = "pburst";

      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side * rnd(320, 1100);
      const dy = rnd(-140, 820);

      const big = Math.random() < 0.18;
      const sz = big ? rnd(5,7) : rnd(2,4);
      const op = big ? rnd(0.22, 0.36) : rnd(0.16, 0.28);

      const delay = rnd(0, MAX_DELAY);
      const dur = rnd(1.05, 1.65);

      p.style.setProperty("--sx", ORIGIN_X + "%");
      p.style.setProperty("--sy", ORIGIN_Y + "%");
      p.style.setProperty("--dx", dx.toFixed(0) + "px");
      p.style.setProperty("--dy", dy.toFixed(0) + "px");
      p.style.setProperty("--sz", sz.toFixed(1) + "px");
      p.style.setProperty("--op", op.toFixed(2));
      p.style.setProperty("--delay", delay.toFixed(2) + "s");
      p.style.setProperty("--dur", dur.toFixed(2) + "s");

      layer.appendChild(p);
    }
  }

  function initFX(){
    if (prefersReduce) return;
    ensureGrain();
    ensureParticlesLayer();
    buildIdleParticles();
    burstParticles();
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initFX, { once:true });
  } else {
    initFX();
  }

})();
