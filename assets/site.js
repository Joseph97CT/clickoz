
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const rnd = (a,b)=>Math.random()*(b-a)+a;

  const prefersReduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     0) GLOBAL HELPERS
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

  function currentAccentRgb(){
    return (getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || "99,102,241");
  }

  function setAccent(a1, a2){
    const accent = a1 || '#6366f1';
    const accent2 = a2 || accent;

    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent2', accent2);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(accent));

    const dot = $('#colorDot');
    if (dot) dot.style.background = accent;

    const badge = $('#logoBadge');
    if (badge) badge.style.color = accent;

    try{
      localStorage.setItem('clickoz_accent', JSON.stringify({a1: accent, a2: accent2}));
    }catch(_){}

    // Update canvas color smoothly (next frame reads CSS vars)
  }

  function markActiveSwatches(accent){
    $$('.color-option').forEach(x => x.classList.toggle('active', x.dataset.accent === accent));
  }

  /* =========================================================
     1) MOBILE MENU (DRAWER)
  ========================================================= */
  (function initMobileMenu(){
    const burger  = $('#burger');
    const menu    = $('#mobileMenu');
    const overlay = $('#mOverlay');
    const closeBtn= $('#mClose');
    if(!burger || !menu || !overlay || !closeBtn) return;

    const root = document.documentElement;

    function openMenu(){
      menu.classList.add('open');
      overlay.hidden = false;
      menu.setAttribute('aria-hidden','false');
      burger.setAttribute('aria-expanded','true');
      root.classList.add('no-scroll');
    }
    function closeMenu(){
      menu.classList.remove('open');
      overlay.hidden = true;
      menu.setAttribute('aria-hidden','true');
      burger.setAttribute('aria-expanded','false');
      root.classList.remove('no-scroll');
    }

    burger.addEventListener('click', () => {
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });
    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });

    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) closeMenu();
    });

    if(!$('#__noScrollStyle')){
      const style = document.createElement('style');
      style.id = "__noScrollStyle";
      style.textContent = `.no-scroll{ overflow:hidden; }`;
      document.head.appendChild(style);
    }
  })();

  /* =========================================================
     2) ACCENT MENU (DESKTOP) + SYNC WITH MOBILE GRID
  ========================================================= */
  (function initAccent(){
    // restore saved accent first
    try{
      const saved = JSON.parse(localStorage.getItem('clickoz_accent') || 'null');
      if(saved?.a1){
        setAccent(saved.a1, saved.a2);
        markActiveSwatches(saved.a1);
      }else{
        const a = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';
        document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(a));
        const dot = $('#colorDot');
        if (dot) dot.style.background = a;
        markActiveSwatches(a);
      }
    }catch(_){}

    const toggle = $('#colorToggle');
    const menu   = $('#colorMenu');

    if(toggle && menu){
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

        setAccent(opt.dataset.accent, opt.dataset.accent2);
        markActiveSwatches(opt.dataset.accent);
        closeAllMenus();
        burstParticles();
      });
    }

    const mobileGrid = $('#mobileColorGrid');
    if(mobileGrid){
      mobileGrid.addEventListener('click', (e) => {
        const opt = e.target.closest('.color-option');
        if(!opt) return;
        setAccent(opt.dataset.accent, opt.dataset.accent2);
        markActiveSwatches(opt.dataset.accent);
        burstParticles();
      });
    }
  })();

  /* =========================================================
     3) "/" FOCUSES SEARCH
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
     4) SEARCH + CHIPS FILTER
  ========================================================= */
  (function searchAndChips(){
    const grid  = $('#grid');
    const chips = $('#chips');
    const q     = $('#toolSearch');
    if(!grid || !chips || !q) return;

    const cards = Array.from(grid.querySelectorAll('a.card'));
    let filter = 'all';

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
        const hay = ((card.dataset.hay || "") + " " + (card.textContent || "")).toLowerCase();
        const okTerm = !term || hay.includes(term);

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
     5) RECOMMENDED NOW RANDOM PICKS (6 cards)
     - Works on Tools pages (uses #grid if present)
     - Works on Home even without #grid (fallback catalog list)
  ========================================================= */
  (function recommendedRandom(){
    // Slots available on Home (and can exist elsewhere too)
    const slots = [
      {a:'randTool1', i:'randIcon1', t:'randTitle1', d:'randDesc1', c:'randCta1'},
      {a:'randTool2', i:'randIcon2', t:'randTitle2', d:'randDesc2', c:'randCta2'},
      {a:'randTool3', i:'randIcon3', t:'randTitle3', d:'randDesc3', c:'randCta3'},
      {a:'randTool4', i:'randIcon4', t:'randTitle4', d:'randDesc4', c:'randCta4'},
      {a:'randTool5', i:'randIcon5', t:'randTitle5', d:'randDesc5', c:'randCta5'},
      {a:'randTool6', i:'randIcon6', t:'randTitle6', d:'randDesc6', c:'randCta6'},
    ];

    // If the page doesn't have these elements, do nothing
    const anySlot = document.getElementById(slots[0].a);
    if(!anySlot) return;

    // Fallback catalog (used on Home when #grid is removed)
    // IMPORTANT: uses /tools/ routes
    const FALLBACK = [
      { href:'/tools/word-counter/',          icon:'🔢', title:'Word Counter',          desc:'Count words, characters, sentences, paragraphs and reading time.' },
      { href:'/tools/word-counter-pro/',      icon:'✨', title:'Word Counter Pro',      desc:'Advanced stats: speaking time, section breakdown and keyword hints.' },
      { href:'/tools/readability-analyzer/',  icon:'📚', title:'Readability Analyzer',  desc:'Readability score + clarity hints to improve scannability.' },
      { href:'/tools/keyword-density/',       icon:'🎯', title:'Keyword Density',       desc:'Measure keyword frequency and spot overuse without stuffing.' },
      { href:'/tools/meta-tags/',             icon:'🏷️', title:'Meta Tag Optimizer',    desc:'SERP preview + length checks to improve CTR.' },
      { href:'/tools/json-formatter/',        icon:'🧾', title:'JSON Formatter',        desc:'Prettify/minify/validate JSON instantly for debugging.' },
      { href:'/tools/url-encoder/',           icon:'🔗', title:'URL Encoder',           desc:'Encode/decode URLs and query strings safely.' },
      { href:'/tools/base64/',                icon:'🔐', title:'Base64',                desc:'Encode/decode Base64 strings for tokens and payloads.' },
      { href:'/tools/title-description/',     icon:'📝', title:'Title & Description',   desc:'Generate SEO title/description ideas aligned to intent.' },
      { href:'/tools/alt-text/',              icon:'🖼️', title:'Alt Text Generator',    desc:'Accessibility-friendly alt text variants without spam.' },
      { href:'/tools/seo-outline/',           icon:'🧠', title:'SEO Outline Helper',    desc:'Build H1/H2/H3 outline + FAQ ideas that match intent.' },
    ];

    // If a Tools page has #grid, extract from real cards (best source of truth)
    const grid = document.getElementById('grid');
    const cards = grid ? Array.from(grid.querySelectorAll('a.card')) : [];

    function extractFromCard(card){
      const title = (card.querySelector('h3')?.textContent || 'Tool').trim();
      const icon  = (card.querySelector('.thumb')?.textContent || '✨').trim();
      const href  = (card.getAttribute('href') || '#').trim();
      const desc  = (card.querySelector('p')?.textContent || '').trim();
      return { href, icon, title, desc };
    }

    // Build catalog:
    // - if #grid exists and has enough cards, use it
    // - else use FALLBACK
    let catalog = [];
    if(cards.length >= 6){
      catalog = cards.map(extractFromCard)
        // ensure we prefer /tools/ in case some old /tool/ slipped in
        .map(x => ({...x, href: x.href.replace(/^\/tool\//, '/tools/')}));
    }else{
      catalog = FALLBACK.slice();
    }

    if(catalog.length < 6) return;

    function pickDistinct(n){
      const idx = new Set();
      while(idx.size < n){
        idx.add(Math.floor(Math.random() * catalog.length));
      }
      return Array.from(idx).map(i => catalog[i]);
    }

    const picks = pickDistinct(6);

    slots.forEach((slot, k) => {
      const p = picks[k];
      const a = document.getElementById(slot.a);
      if(!a || !p) return;

      a.href = p.href;

      const i = document.getElementById(slot.i);
      const t = document.getElementById(slot.t);
      const d = document.getElementById(slot.d);
      const c = document.getElementById(slot.c);

      if(i) i.textContent = p.icon;
      if(t) t.textContent = p.title;
      if(d) d.textContent = p.desc || '';
      if(c) c.textContent = `Use ${p.title}`;
    });
  })();


  /* =========================================================
     6) COOKIE CONSENT + GOOGLE TRANSLATE
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

    function mirrorGTToMobile(){
      const desktop = $('#google_translate_element');
      const mobile  = $('#google_translate_element_mobile');
      if(!desktop || !mobile) return;
      if(desktop.innerHTML.trim() && !mobile.innerHTML.trim()){
        mobile.innerHTML = desktop.innerHTML;
      }
    }

    function loadGoogleTranslate(){
      if (window.__gt_loaded) return;
      window.__gt_loaded = true;

      if (gtWrap) gtWrap.classList.add('show');

      window.googleTranslateElementInit = function(){
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );

        let tries = 0;
        const t = setInterval(() => {
          mirrorGTToMobile();
          tries++;
          if(tries > 18) clearInterval(t);
        }, 350);
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
      store("all"); hideBanner(); loadGoogleTranslate();
    });
    $('#cookieEssential')?.addEventListener('click', () => {
      store("essential"); hideBanner();
    });
    $('#cookieReject')?.addEventListener('click', () => {
      store("none"); hideBanner();
    });
    $('#cookieClose')?.addEventListener('click', () => hideBanner());
  })();

  /* =========================================================
     7) DOM PARTICLES (idle + burst) — stable
  ========================================================= */
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
    if (layer.querySelector('.pidle')) return;

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 44 : 90;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement('span');
      p.className = "pidle";
      p.style.left = rnd(4, 96) + "%";
      p.style.top  = rnd(6, 94) + "%";
      p.style.setProperty("--ix", rnd(-200, 200).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(-160, 220).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(12, 26).toFixed(2) + "s");
      layer.appendChild(p);
    }
  }

  function burstParticles(){
    if (prefersReduce) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;

    layer.querySelectorAll(".pburst").forEach(n => n.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 90 : 180;

    const ORIGIN_X = 50;
    const ORIGIN_Y = 22;
    const MAX_DELAY = 0.50;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement("span");
      p.className = "pburst";

      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side * rnd(isMobile ? 260 : 320, isMobile ? 760 : 1100);
      const dy = rnd(-120, isMobile ? 620 : 820);

      const big = Math.random() < 0.16;
      const sz = big ? rnd(5,7) : rnd(2,4);
      const op = big ? rnd(0.20, 0.34) : rnd(0.14, 0.26);

      const delay = rnd(0, MAX_DELAY);
      const dur = rnd(1.05, 1.60);

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

 /* =========================================================
   8) SPACE CANVAS — BIG burst to near edges, then drift
   - burst once on load (no re-burst on accent change)
   - color always follows --accent-rgb live
========================================================= */
(function spaceCanvas(){
  if (prefersReduce) return;

  const canvas = document.getElementById('spaceParticles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  let w=0,h=0,dpr=1;
  let stars = [];
  let running = true;

  function accentRGB(){
    return (getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || "99,102,241");
  }
  function isMobile(){
    return window.matchMedia("(max-width: 720px)").matches;
  }
  function origin(){
    // hero center-ish
    return { x: w*0.5, y: h*(isMobile() ? 0.30 : 0.26) };
  }

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width  = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height= window.innerHeight + 'px';

    // Base starfield (always there)
    const baseCount = isMobile() ? 22 : 50;
    stars = [];
    for(let i=0;i<baseCount;i++){
      stars.push(spawnDriftStar(true));
    }

    // One BIG explosion on load
    bigBurst();
  }

  // Drift star (already distributed)
  function spawnDriftStar(randomField=false){
    const rgb = accentRGB(); // (not stored, just for defaults)
    const r = (Math.random() < 0.12 ? rnd(1.8, 3.4) : rnd(0.9, 2.0)) * dpr;

    const x = randomField ? rnd(0, w) : origin().x;
    const y = randomField ? rnd(0, h) : origin().y;

    // gentle random drift
    const sp = (isMobile() ? rnd(0.08, 0.22) : rnd(0.10, 0.28)) * dpr;
    const a = Math.random()*Math.PI*2;

    return {
      mode: "drift",
      x, y,
      vx: Math.cos(a)*sp,
      vy: Math.sin(a)*sp,
      r,
      a: rnd(0.05, 0.14),      // alpha
      life: 0,
      max: rnd(900, 1500),
      // swirl strength
      swirl: (isMobile() ? 0.00055 : 0.00080) * dpr,
    };
  }

  // Burst star (starts at origin, goes to edges fast, then transitions to drift)
  function spawnBurstStar(){
    const o = origin();

    // angle outward (uniform) + slight noise
    const ang = Math.random()*Math.PI*2 + rnd(-0.12, 0.12);

    // BURST speed (strong) → so it reaches near margins
    const vBase = isMobile() ? rnd(2.2, 3.6) : rnd(2.8, 4.6);
    const vx0 = Math.cos(ang) * vBase * dpr;
    const vy0 = Math.sin(ang) * vBase * dpr;

    const big = Math.random() < 0.20;
    const r = (big ? rnd(2.2, 4.4) : rnd(1.0, 2.2)) * dpr;

    // Burst frames: longer = reaches edges
    const burstFrames = isMobile() ? 90 : 120;

    return {
      mode: "burst",
      x: o.x + rnd(-3,3)*dpr,
      y: o.y + rnd(-3,3)*dpr,
      vx: vx0,
      vy: vy0,
      r,
      a: isMobile() ? rnd(0.16, 0.28) : rnd(0.18, 0.32),
      life: 0,
      burstFrames,
      // after burst, drift params
      swirl: (isMobile() ? 0.00055 : 0.00080) * dpr,
    };
  }

  function bigBurst(){
    // number of burst stars
    const count = isMobile() ? 120 : 220;
    for(let i=0;i<count;i++) stars.push(spawnBurstStar());

    // keep cap (performance)
    const cap = isMobile() ? 220 : 420;
    if(stars.length > cap) stars.splice(0, stars.length - cap);
  }

  function step(){
    if(!running) return;

    ctx.clearRect(0,0,w,h);
    const rgb = accentRGB();

    // soft haze to avoid “dead black” on desktop
    ctx.fillStyle = `rgba(${rgb},0.09)`;
    ctx.fillRect(0,0,w,h);

    const o = origin();
    const margin = 140*dpr;

    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      s.life++;

      if(s.mode === "burst"){
        // Move fast outward
        s.x += s.vx;
        s.y += s.vy;

        // very light fade during burst
        const burstT = Math.min(1, s.life / s.burstFrames);
        const alpha = s.a * (1 - burstT*0.35);

        // draw
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb},${Math.max(0, alpha)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();

        // Transition to drift AFTER it already spread near edges
        if(s.life >= s.burstFrames){
          s.mode = "drift";
          // damp speed to “space drift”
          s.vx *= isMobile() ? 0.10 : 0.12;
          s.vy *= isMobile() ? 0.10 : 0.12;
          s.life = 0;
          s.max = rnd(900, 1600);
          // lower alpha for drift
          s.a = rnd(0.05, 0.14);
        }
        continue;
      }

      // DRIFT mode (space feel)
      // swirl around origin
      const dx = s.x - o.x;
      const dy = s.y - o.y;
      s.vx += (-dy) * s.swirl * 0.0009;
      s.vy += ( dx) * s.swirl * 0.0009;

      s.x += s.vx;
      s.y += s.vy;

      // fade slowly
      const fade = 1 - (s.life / s.max);
      const alpha = Math.max(0, s.a * Math.min(1, fade));

      ctx.beginPath();
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();

      // respawn if out/expired (keep field stable)
      if(s.life > s.max || s.x < -margin || s.x > w+margin || s.y < -margin || s.y > h+margin){
        stars[i] = spawnDriftStar(true);
      }
    }

    requestAnimationFrame(step);
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if(running) requestAnimationFrame(step);
  });

  window.addEventListener('resize', resize, { passive:true });

  resize();
  requestAnimationFrame(step);
})();


  /* =========================================================
     9) INIT FX
  ========================================================= */
  function initFX(){
    if (prefersReduce) return;
    buildIdleParticles();
    burstParticles();
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initFX, { once:true });
  } else {
    initFX();
  }
})();
(function(){
  const path = location.pathname;
  const links = document.querySelectorAll('.nav-links a, .m-links a');
  links.forEach(a => a.classList.remove('active'));
  const setActive = (href) => {
    const el = Array.from(links).find(a => a.getAttribute('href') === href);
    if(el) el.classList.add('active');
  };

  if(path.startsWith('/tools')) setActive('/tools/');
  else if(path.startsWith('/guides')) setActive('/guides/');
  else if(path.startsWith('/updates')) setActive('/updates/');
  else setActive('/');
})();
