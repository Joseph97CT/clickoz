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

  function setAccent(a1, a2){
    const accent = a1 || '#6366f1';
    const accent2 = a2 || accent;

    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent2', accent2);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(accent));

    const dot = $('#colorDot');
    if (dot) dot.style.background = accent;

    // logo badge follows accent (CSS uses currentColor)
    const badge = $('#logoBadge');
    if (badge) badge.style.color = accent;

    try{
      localStorage.setItem('clickoz_accent', JSON.stringify({a1: accent, a2: accent2}));
    }catch(_){}
  }

  function markActiveSwatches(accent){
    // desktop palette + mobile palette
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

    // close when clicking a link
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) closeMenu();
    });

    // inject no-scroll style once
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
    const toggle = $('#colorToggle');
    const menu   = $('#colorMenu');

    // restore saved accent first
    try{
      const saved = JSON.parse(localStorage.getItem('clickoz_accent') || 'null');
      if(saved?.a1){
        setAccent(saved.a1, saved.a2);
        markActiveSwatches(saved.a1);
      }else{
        // ensure accent-rgb exists even if CSS sets accent
        const a = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';
        document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(a));
        const dot = $('#colorDot');
        if (dot) dot.style.background = a;
        markActiveSwatches(a);
      }
    }catch(_){}

    // Desktop dropdown behavior
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

        burstParticles(); // subtle FX on change
      });
    }

    // Mobile grid (same .color-option class, inside #mobileColorGrid)
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

    // Fallback category resolver if data-cat missing
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
     5) RECOMMENDED NOW RANDOM PICKS
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
     6) COOKIE CONSENT + GOOGLE TRANSLATE (LOAD ONLY IF "all")
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

      // When GT loads, it injects a select into desktop container.
      // Copy HTML into mobile container if mobile is empty.
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

        // try mirroring a few times (GT inject timing)
        let tries = 0;
        const t = setInterval(() => {
          mirrorGTToMobile();
          tries++;
          if(tries > 15) clearInterval(t);
        }, 400);
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
     7) FX: GRAIN + PARTICLES (idle + burst) — OPTIMIZED
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

    // Avoid duplication
    if (layer.querySelector('.pidle')) return;

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    // Reduced counts for mobile smoothness
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

    // remove only previous bursts
    layer.querySelectorAll(".pburst").forEach(n => n.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 90 : 180;

    const ORIGIN_X = 50; // %
    const ORIGIN_Y = 22; // % (hero zone)
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

  // Pause FX when tab hidden (mobile friendly)
  let fxRunning = true;
  document.addEventListener("visibilitychange", () => {
    fxRunning = !document.hidden;
    const layer = $('#clickozParticles');
    if(!layer) return;
    layer.style.display = fxRunning ? "" : "none";
  });

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

  // expose burst for accent handler (safe)
  window.__clickozBurst = burstParticles;

  // ensure burstParticles reference exists even before initAccent uses it
  function burstParticlesSafe(){
    if(typeof burstParticles === "function") burstParticles();
  }

  // replace calls inside file
  function burstParticles(){
    burstParticlesSafe();
  }

})();
/* =========================================================
   8) SPACE CANVAS PARTICLES (center origin, space drift)
   - Very light, adapts to mobile/desktop
========================================================= */
(function spaceCanvas(){
  if (prefersReduce) return;

  const canvas = document.getElementById('spaceParticles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  let w=0,h=0,dpr=1;
  let parts = [];
  let running = true;

  function rgb(){
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '99,102,241';
    return v;
  }

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width  = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height= window.innerHeight + 'px';

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const count = isMobile ? 28 : 60; // leggero!
    parts = new Array(count).fill(0).map(()=>spawn(true));
  }

  function spawn(initial=false){
    const cx = w*0.5, cy = h*0.28; // centro/hero (più su)
    const a = Math.random()*Math.PI*2;
    const speed = (Math.random()*0.55 + 0.25) * dpr;

    // particelle "grandi" ma soft
    const radius = (Math.random() < 0.20 ? (Math.random()*2.6+2.2) : (Math.random()*1.6+1.0)) * dpr;

    // partono dal centro e si allargano
    const dist = initial ? (Math.random()*Math.min(w,h)*0.55) : 0;
    const x = cx + Math.cos(a)*dist;
    const y = cy + Math.sin(a)*dist;

    // drift “spaziale” + leggero swirl
    const vx = Math.cos(a)*speed;
    const vy = Math.sin(a)*speed;

    return { x,y,vx,vy,r:radius, life:0, max: (Math.random()*240+260) };
  }

  function step(){
    if(!running) return;

    ctx.clearRect(0,0,w,h);

    const v = rgb();
    // glow soft
    ctx.fillStyle = `rgba(${v},0.10)`;
    ctx.fillRect(0,0,w,h);

    for(let i=0;i<parts.length;i++){
      const p = parts[i];

      // swirl leggerissimo
      const sw = 0.0008 * dpr;
      const dx = p.x - w*0.5;
      const dy = p.y - h*0.28;
      p.vx += (-dy) * sw;
      p.vy += ( dx) * sw;

      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // draw: orb soft
      const alpha = Math.max(0, 0.22 - (p.life/p.max)*0.22);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${v},${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();

      // respawn fuori schermo o fine vita
      if(p.life > p.max || p.x < -80*dpr || p.x > w+80*dpr || p.y < -80*dpr || p.y > h+80*dpr){
        parts[i] = spawn(false);
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
