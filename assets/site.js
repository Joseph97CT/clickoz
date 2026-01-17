(function(){
  const search = document.getElementById('toolSearch');
  const grid = document.getElementById('grid');
  const chips = document.getElementById('chips');
  if(!search || !grid || !chips) return;

  const cards = Array.from(grid.querySelectorAll('[data-card="1"]'));
  let filter = 'all';

  function categoryOf(slug){
    const seo = new Set([
      'word-counter-pro','readability-analyzer','keyword-density','meta-tags',
      'title-description','alt-text','seo-outline'
    ]);
    const text = new Set(['word-counter']);
    if(seo.has(slug)) return 'seo';
    if(text.has(slug)) return 'text';
    return 'dev';
  }

  function apply(){
    const q = (search.value||'').trim().toLowerCase();
    cards.forEach(card=>{
      const slug = card.getAttribute('data-slug');
      const hay = (card.getAttribute('data-hay')||'').toLowerCase();
      const okQ = !q || hay.includes(q);
      const okF = filter === 'all' || categoryOf(slug) === filter;
      card.style.display = (okQ && okF) ? '' : 'none';
    });
  }

  chips.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip');
    if(!chip) return;
    chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    chip.classList.add('active');
    filter = chip.dataset.filter || 'all';
    apply();
  });

  search.addEventListener('input', apply);
  apply();
})();
(function(){
  // crea layer particles una sola volta
  if(document.getElementById('clickozParticles')) return;

  const wrap = document.createElement('div');
  wrap.id = 'clickozParticles';
  document.body.appendChild(wrap);

  // quante particelle: desktop vs mobile
  const isMobile = matchMedia('(max-width: 720px)').matches;
  const COUNT = isMobile ? 18 : 32;

  function rnd(min, max){ return Math.random()*(max-min)+min; }

  for(let i=0;i<COUNT;i++){
    const p = document.createElement('span');
    const cls = ['p','s2','s3','s4'][Math.floor(Math.random()*4)];
    p.className = 'p ' + cls;

    // start vicino hero (top 18%), poi vola verso fuori (random)
    const sx  = rnd(-80, 80) + 'px';
    const sy  = rnd(-20, 40) + 'px';
    const sx2 = rnd(-520, 520) + 'px';
    const sy2 = rnd(-420, 520) + 'px';

    const dur = rnd(6.5, 12.5).toFixed(2) + 's';
    const delay = rnd(0, 6).toFixed(2) + 's';

    p.style.setProperty('--sx', sx);
    p.style.setProperty('--sy', sy);
    p.style.setProperty('--sx2', sx2);
    p.style.setProperty('--sy2', sy2);
    p.style.setProperty('--dur', dur);
    p.style.animationDelay = delay;

    // varia anche la posizione iniziale un filo
    p.style.left = (50 + rnd(-6, 6)) + '%';
    p.style.top  = (18 + rnd(-6, 6)) + '%';

    wrap.appendChild(p);
  }
})();
(function(){
  if (document.getElementById('clickozParticles')) return;

  const layer = document.createElement('div');
  layer.id = 'clickozParticles';
  document.body.appendChild(layer);

  const isMobile = matchMedia('(max-width: 720px)').matches;

  // quantità: desktop wow, mobile più leggero
  const CORE = isMobile ? 38 : 90;      // dall'hero
  const JETS = isMobile ? 22 : 60;      // laterali (wow!)
  const MIST = isMobile ? 18 : 40;      // diffuso

  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];

  function makeParticle(type){
    const s = document.createElement('span');
    s.className = 'px ' + pick(['tiny','', 'big']);

    // start positions
    let x1=0,y1=0,x2=0,y2=0, dur=rnd(6.5, 14.5), delay=rnd(0, 6);

    if(type === 'core'){
      // parte vicino hero, esce in tutte le direzioni
      x1 = rnd(-30, 30);
      y1 = rnd(-40, 40);
      x2 = rnd(-520, 520);
      y2 = rnd(-520, 620);
      s.style.left = (50 + rnd(-8, 8)) + '%';
      s.style.top  = (18 + rnd(-6, 10)) + '%';
      dur = rnd(7, 16);
    }

    if(type === 'jetL'){
      // getto sinistro vicino ai box/sections
      x1 = rnd(-20, 20);
      y1 = rnd(-30, 30);
      x2 = rnd(-760, -220);
      y2 = rnd(-260, 520);
      s.style.left = (8 + rnd(-2, 4)) + '%';
      s.style.top  = (42 + rnd(-10, 22)) + '%';
      dur = rnd(6, 13);
    }

    if(type === 'jetR'){
      // getto destro
      x1 = rnd(-20, 20);
      y1 = rnd(-30, 30);
      x2 = rnd(220, 760);
      y2 = rnd(-260, 520);
      s.style.left = (92 + rnd(-4, 2)) + '%';
      s.style.top  = (42 + rnd(-10, 22)) + '%';
      dur = rnd(6, 13);
    }

    if(type === 'mist'){
      // pulviscolo diffuso lento
      x1 = rnd(-40, 40);
      y1 = rnd(-40, 40);
      x2 = rnd(-260, 260);
      y2 = rnd(-180, 320);
      s.style.left = rnd(10, 90) + '%';
      s.style.top  = rnd(18, 92) + '%';
      dur = rnd(10, 22);
      s.classList.add('tiny');
      s.style.opacity = '0.35';
    }

    s.style.setProperty('--x1', x1 + 'px');
    s.style.setProperty('--y1', y1 + 'px');
    s.style.setProperty('--x2', x2 + 'px');
    s.style.setProperty('--y2', y2 + 'px');
    s.style.setProperty('--dur', dur.toFixed(2) + 's');
    s.style.animationDelay = delay.toFixed(2) + 's';

    layer.appendChild(s);
  }

  // core
  for(let i=0;i<CORE;i++) makeParticle('core');

  // jets laterali
  for(let i=0;i<JETS;i++){
    makeParticle('jetL');
    makeParticle('jetR');
  }

  // mist
  for(let i=0;i<MIST;i++) makeParticle('mist');
})();
(function(){
  // grain layer (anti banding)
  if(!document.querySelector('.__grain')){
    const g = document.createElement('div');
    g.className = '__grain';
    document.body.appendChild(g);
  }

  // particles layer
  let layer = document.getElementById('clickozParticles');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'clickozParticles';
    document.body.appendChild(layer);
  }

  // pulizia: evita raddoppi se incolli più volte
  layer.innerHTML = '';

  const isMobile = matchMedia('(max-width: 720px)').matches;

  // DENSITÀ (wow)
  const CORE = isMobile ? 60 : 140;
  const SIDE = isMobile ? 70 : 220;   // <<< qui è la magia (frecce rosse)
  const MIST = isMobile ? 25 : 80;

  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const pick = (arr)=>arr[(Math.random()*arr.length)|0];

  function spawn(type){
    const p = document.createElement('span');
    p.className = 'px ' + pick(['tiny','', 'big']);

    // default
    let dur = rnd(6.5, 14.5);
    let delay = rnd(0, 5.5);

    // start/end vectors
    let x1=0,y1=0,x2=0,y2=0, left='50%', top='18%';

    if(type === 'core'){
      left = (50 + rnd(-9, 9)) + '%';
      top  = (18 + rnd(-6, 10)) + '%';
      x1 = rnd(-20, 20);  y1 = rnd(-30, 30);
      x2 = rnd(-620, 620); y2 = rnd(-520, 720);
      dur = rnd(8, 16);
    }

    // EMETTITORI LATERALI nella fascia che indichi (frecce rosse):
    // sparano verso l’esterno + un po’ verso il basso
    if(type === 'leftEmitter'){
      left = (8 + rnd(-1.5, 2.5)) + '%';
      top  = (42 + rnd(-12, 16)) + '%';
      x1 = rnd(-10, 18); y1 = rnd(-18, 18);
      x2 = rnd(-980, -280); y2 = rnd(-120, 620);
      dur = rnd(5.5, 11.5);
    }

    if(type === 'rightEmitter'){
      left = (92 + rnd(-2.5, 1.5)) + '%';
      top  = (42 + rnd(-12, 16)) + '%';
      x1 = rnd(-18, 10); y1 = rnd(-18, 18);
      x2 = rnd(280, 980); y2 = rnd(-120, 620);
      dur = rnd(5.5, 11.5);
    }

    if(type === 'mist'){
      left = rnd(10, 90) + '%';
      top  = rnd(20, 92) + '%';
      x1 = rnd(-25, 25); y1 = rnd(-25, 25);
      x2 = rnd(-320, 320); y2 = rnd(-220, 420);
      dur = rnd(11, 22);
      p.classList.add('tiny');
      p.style.opacity = '0.30';
    }

    p.style.left = left;
    p.style.top = top;
    p.style.setProperty('--x1', x1 + 'px');
    p.style.setProperty('--y1', y1 + 'px');
    p.style.setProperty('--x2', x2 + 'px');
    p.style.setProperty('--y2', y2 + 'px');
    p.style.setProperty('--dur', dur.toFixed(2) + 's');
    p.style.animationDelay = delay.toFixed(2) + 's';

    layer.appendChild(p);
  }

  // crea particelle
  for(let i=0;i<CORE;i++) spawn('core');
  for(let i=0;i<SIDE;i++){ spawn('leftEmitter'); spawn('rightEmitter'); }
  for(let i=0;i<MIST;i++) spawn('mist');

  // opzionale: rigenera su resize (solo una volta ogni tot)
  let t=null;
  addEventListener('resize', ()=>{
    clearTimeout(t);
    t=setTimeout(()=>{ try{ layer.innerHTML=''; for(let i=0;i<CORE;i++) spawn('core'); for(let i=0;i<SIDE;i++){ spawn('leftEmitter'); spawn('rightEmitter'); } for(let i=0;i<MIST;i++) spawn('mist'); }catch(e){} }, 250);
  }, {passive:true});
})();
(function(){
  // Layer particles
  let layer = document.getElementById('clickozParticles');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'clickozParticles';
    document.body.appendChild(layer);
  }
  layer.innerHTML = '';

  const isMobile = matchMedia('(max-width: 720px)').matches;
  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const pick = (arr)=>arr[(Math.random()*arr.length)|0];

  // DENSITÀ: più “wow” (desktop)
  const COUNTS = isMobile
    ? { heroCore: 70, heroX: 90, midSides: 60, footerFog: 40, mist: 30 }
    : { heroCore: 160, heroX: 260, midSides: 140, footerFog: 120, mist: 70 };

  // Emitters: coordinate “relative” alla viewport (%)
  // X ROSSE HERO: left/right, subito ai lati del titolo
  const emitters = [
    // HERO core (centro)
    { name:'heroCore', left:50, top:18, dx:[-680,680], dy:[-520,720], dur:[8,16], size:['tiny','','big'], op:[0.35,0.60] },

    // HERO X left (la tua X rossa a sinistra)
    { name:'heroX', left:12, top:22, dx:[-980,-260], dy:[-380,780], dur:[6,12], size:['tiny','','big'], op:[0.35,0.58] },

    // HERO X right (la tua X rossa a destra)
    { name:'heroX', left:88, top:22, dx:[260,980], dy:[-380,780], dur:[6,12], size:['tiny','','big'], op:[0.35,0.58] },

    // MID sides (riempie i cerchi della seconda immagine)
    { name:'midSides', left:8,  top:52, dx:[-980,-260], dy:[-220,680], dur:[7,14], size:['tiny','','big'], op:[0.28,0.50] },
    { name:'midSides', left:92, top:52, dx:[260,980],  dy:[-220,680], dur:[7,14], size:['tiny','','big'], op:[0.28,0.50] },

    // FOOTER fog jets (riempie la parte bassa senza banda netta)
    { name:'footerFog', left:18, top:86, dx:[-520,80], dy:[-120,260], dur:[10,20], size:['tiny','tiny',''], op:[0.20,0.35] },
    { name:'footerFog', left:82, top:86, dx:[-80,520], dy:[-120,260],  dur:[10,20], size:['tiny','tiny',''], op:[0.20,0.35] },
  ];

  function makePx(){
    const s = document.createElement('span');
    s.className = 'px ' + pick(['tiny','', 'big']);
    return s;
  }

  // se non hai più la classe .px / keyframes pxMove nel CSS, aggiungile:
  // (lo metto comunque qui in modo “safe”)
  if(!document.getElementById('__px_css')){
    const st = document.createElement('style');
    st.id='__px_css';
    st.textContent = `
      #clickozParticles{ position:fixed; inset:0; pointer-events:none; z-index:-2; overflow:hidden; }
      .px{ position:absolute; width:3px; height:3px; border-radius:999px;
           background: rgba(var(--accent-rgb), .92);
           box-shadow: 0 0 18px rgba(var(--accent-rgb), .45), 0 0 60px rgba(var(--accent-rgb), .16);
           opacity:.55; transform: translate3d(0,0,0);
           animation: pxMove var(--dur) linear infinite; }
      .px.big{ width:5px; height:5px; opacity:.42; filter: blur(.2px); }
      .px.tiny{ width:2px; height:2px; opacity:.45; }
      @keyframes pxMove{
        0%{ transform: translate3d(var(--x1), var(--y1), 0) scale(.8); opacity:0; }
        12%{ opacity: var(--op); }
        100%{ transform: translate3d(var(--x2), var(--y2), 0) scale(1.25); opacity:0; }
      }
      @media (prefers-reduced-motion: reduce){ #clickozParticles{ display:none; } }
    `;
    document.head.appendChild(st);
  }

  function spawnFrom(em){
    const p = document.createElement('span');
    const cls = pick(em.size || ['tiny','','big']);
    p.className = 'px ' + cls;

    const x1 = rnd(-20, 20);
    const y1 = rnd(-20, 20);
    const x2 = rnd(em.dx[0], em.dx[1]);
    const y2 = rnd(em.dy[0], em.dy[1]);

    const dur = rnd(em.dur[0], em.dur[1]);
    const delay = rnd(0, 5.5);
    const op = rnd(em.op[0], em.op[1]);

    p.style.left = (em.left + rnd(-2.5, 2.5)) + '%';
    p.style.top  = (em.top  + rnd(-6, 6)) + '%';

    p.style.setProperty('--x1', x1 + 'px');
    p.style.setProperty('--y1', y1 + 'px');
    p.style.setProperty('--x2', x2 + 'px');
    p.style.setProperty('--y2', y2 + 'px');
    p.style.setProperty('--dur', dur.toFixed(2) + 's');
    p.style.setProperty('--op', op.toFixed(2));
    p.style.animationDelay = delay.toFixed(2) + 's';

    layer.appendChild(p);
  }

  // Emit per counts
  function emit(name, n){
    const list = emitters.filter(e => e.name === name);
    for(let i=0;i<n;i++){
      const em = list[i % list.length];
      spawnFrom(em);
    }
  }

  emit('heroCore',  COUNTS.heroCore);
  emit('heroX',     COUNTS.heroX);
  emit('midSides',  COUNTS.midSides);
  emit('footerFog', COUNTS.footerFog);

  // MIST globale leggero (riempie senza “macchiare”)
  for(let i=0;i<COUNTS.mist;i++){
    const em = { left:rnd(10,90), top:rnd(18,92), dx:[-320,320], dy:[-220,420], dur:[12,22], size:['tiny','tiny',''], op:[0.18,0.32] };
    spawnFrom(em);
  }
})();
/* =========================
   PARTICLE BURST (2s)
========================= */
#clickozParticles{
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  overflow: hidden;
}

.pburst{
  position:absolute;
  left: var(--sx);
  top:  var(--sy);
  width: var(--sz);
  height: var(--sz);
  border-radius: 999px;

  background: rgba(var(--accent-rgb), .95);
  box-shadow:
    0 0 18px rgba(var(--accent-rgb), .55),
    0 0 70px rgba(var(--accent-rgb), .18);

  opacity: 0;
  transform: translate(-50%, -50%) scale(.65);
  animation: burstFly var(--dur) cubic-bezier(.12,.9,.18,1) forwards;
  animation-delay: var(--delay);
  will-change: transform, opacity;
}

@keyframes burstFly{
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(.5); }
  8%   { opacity: var(--op); }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce){
  #clickozParticles{ display:none; }
}
(function(){
  // layer
  let layer = document.getElementById('clickozParticles');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'clickozParticles';
    document.body.appendChild(layer);
  }
  layer.innerHTML = '';

  const isMobile = matchMedia('(max-width: 720px)').matches;

  // Punto di partenza unico (HERO)
  // Regola questi 2 numeri se vuoi più su/giù:
  const ORIGIN_X = 50;  // %
  const ORIGIN_Y = 22;  // %

  // quantità: desktop wow / mobile light
  const COUNT = isMobile ? 120 : 260;

  // durata: esplosione MAX 2s
  const MAX_DUR = 2.0;

  // “cascata”: delay a pacchetti (tutto finisce entro 2s)
  const MAX_DELAY = 0.55; // sec

  const rnd = (a,b)=>Math.random()*(b-a)+a;

  // distribuzione direzioni: più verso laterali + un po' verso basso
  function sampleDirection(){
    // bias laterale: scegli sinistra o destra
    const side = Math.random() < 0.5 ? -1 : 1;

    // dx grande per laterali
    const dx = side * rnd(260, 980);

    // dy: un po' su, tanto giù (cascata)
    const dy = rnd(-120, 760);

    return { dx, dy };
  }

  // crea particella
  for(let i=0;i<COUNT;i++){
    const p = document.createElement('span');
    p.className = 'pburst';

    const {dx,dy} = sampleDirection();

    // size e opacity
    const sz = (Math.random() < 0.18) ? rnd(5,7) : rnd(2,4);
    const op = (sz > 5) ? rnd(0.22, 0.36) : rnd(0.18, 0.30);

    // “cascata”: un po’ di delay ma non oltre MAX_DELAY
    const delay = rnd(0, MAX_DELAY);

    // durata: sempre <= 2s (delay + durata = ~2s)
    const dur = Math.max(0.9, Math.min(MAX_DUR, rnd(1.05, 1.65)));

    p.style.setProperty('--sx', ORIGIN_X + '%');
    p.style.setProperty('--sy', ORIGIN_Y + '%');
    p.style.setProperty('--dx', dx.toFixed(0) + 'px');
    p.style.setProperty('--dy', dy.toFixed(0) + 'px');
    p.style.setProperty('--sz', sz.toFixed(1) + 'px');
    p.style.setProperty('--op', op.toFixed(2));
    p.style.setProperty('--delay', delay.toFixed(2) + 's');
    p.style.setProperty('--dur', dur.toFixed(2) + 's');

    layer.appendChild(p);
  }

  // Se vuoi che il burst si ripeta quando ricarichi (o al click logo):
  // document.querySelector('.logo')?.addEventListener('click', ()=>location.reload());

})();
(function(){
  // grain layer
  if(!document.querySelector('.__grain')){
    const g = document.createElement('div');
    g.className = '__grain';
    document.body.appendChild(g);
  }

  function burst(){
    let layer = document.getElementById('clickozParticles');
    if(!layer){
      layer = document.createElement('div');
      layer.id = 'clickozParticles';
      document.body.appendChild(layer);
    }
    layer.innerHTML = '';

    const isMobile = matchMedia('(max-width: 720px)').matches;
    const rnd = (a,b)=>Math.random()*(b-a)+a;

    const ORIGIN_X = 50;  // %
    const ORIGIN_Y = 22;  // %
    const COUNT = isMobile ? 120 : 260;
    const MAX_DELAY = 0.55;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement('span');
      p.className = 'pburst';

      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side * rnd(320, 1100);
      const dy = rnd(-120, 780);

      const sz = (Math.random() < 0.18) ? rnd(5,7) : rnd(2,4);
      const op = (sz > 5) ? rnd(0.22, 0.36) : rnd(0.18, 0.30);
      const delay = rnd(0, MAX_DELAY);
      const dur = rnd(1.05, 1.65);

      p.style.setProperty('--sx', ORIGIN_X + '%');
      p.style.setProperty('--sy', ORIGIN_Y + '%');
      p.style.setProperty('--dx', dx.toFixed(0) + 'px');
      p.style.setProperty('--dy', dy.toFixed(0) + 'px');
      p.style.setProperty('--sz', sz.toFixed(1) + 'px');
      p.style.setProperty('--op', op.toFixed(2));
      p.style.setProperty('--delay', delay.toFixed(2) + 's');
      p.style.setProperty('--dur', dur.toFixed(2) + 's');

      layer.appendChild(p);
    }
  }

  // burst al load
  addEventListener('load', burst);

  // burst quando cambi accent (così lo vedi subito)
  document.getElementById('colorMenu')?.addEventListener('click', ()=> setTimeout(burst, 50));
})();
// Ensure particles layer exists (safety)
(function(){
  if(!document.getElementById('clickozParticles')){
    const d = document.createElement('div');
    d.id = 'clickozParticles';
    document.body.appendChild(d);
  }
})();
