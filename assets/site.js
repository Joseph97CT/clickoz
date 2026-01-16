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
