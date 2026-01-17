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
