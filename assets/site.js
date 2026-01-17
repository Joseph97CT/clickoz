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
