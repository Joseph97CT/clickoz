(() => {
  /* =========================
     1) SEARCH + CHIPS FILTER
  ========================= */
  const search = document.getElementById("toolSearch");
  const grid = document.getElementById("grid");
  const chips = document.getElementById("chips");

  if (search && grid && chips) {
    const cards = Array.from(grid.querySelectorAll('[data-card="1"]'));
    let filter = "all";

    const SEO = new Set([
      "word-counter-pro","readability-analyzer","keyword-density","meta-tags",
      "title-description","alt-text","seo-outline"
    ]);
    const TEXT = new Set(["word-counter"]);

    function categoryOf(slug){
      if (SEO.has(slug)) return "seo";
      if (TEXT.has(slug)) return "text";
      return "dev";
    }

    function apply(){
      const q = (search.value || "").trim().toLowerCase();
      for (const card of cards){
        const slug = card.getAttribute("data-slug") || "";
        const hay  = (card.getAttribute("data-hay") || "").toLowerCase();
        const okQ = !q || hay.includes(q);
        const okF = filter === "all" || categoryOf(slug) === filter;
        card.style.display = (okQ && okF) ? "" : "none";
      }
    }

    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      chips.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      chip.classList.add("active");
      filter = chip.dataset.filter || "all";
      apply();
    });

    search.addEventListener("input", apply);
    apply();
  }

  /* =========================
     2) GRAIN + PARTICLES
  ========================= */
  const prefersReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) return;

  function ensureGrain(){
    if (document.querySelector(".__grain")) return;
    const g = document.createElement("div");
    g.className = "__grain";
    document.body.appendChild(g);
  }

  function ensureLayer(){
    let layer = document.getElementById("clickozParticles");
    if (!layer){
      layer = document.createElement("div");
      layer.id = "clickozParticles";
      document.body.appendChild(layer);
    }
    return layer;
  }

  const rnd = (a,b)=>Math.random()*(b-a)+a;

  function buildIdle(layer){
    // non duplicare
    if (layer.querySelector(".pidle")) return;

    const isMobile = matchMedia("(max-width: 720px)").matches;
    const IDLE = isMobile ? 55 : 120;

    for(let i=0;i<IDLE;i++){
      const p = document.createElement("span");
      p.className = "pidle";
      p.style.left = rnd(4, 96) + "%";
      p.style.top  = rnd(6, 94) + "%";
      p.style.setProperty("--ix", rnd(-220, 220).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(-180, 260).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(10, 24).toFixed(2) + "s");
      layer.appendChild(p);
    }
  }

  function burst(layer){
    // rimuovi solo i burst vecchi
    layer.querySelectorAll(".pburst").forEach(n => n.remove());

    const isMobile = matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 110 : 240;

    // origine (hero): regola se vuoi
    const ORIGIN_X = 50; // %
    const ORIGIN_Y = 22; // %

    const MAX_DELAY = 0.55;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement("span");
      p.className = "pburst";

      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side * rnd(320, 1100);
      const dy = rnd(-120, 780);

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
    ensureGrain();
    const layer = ensureLayer();
    buildIdle(layer);
    burst(layer);

    // burst quando cambi accent (se hai un menu colori)
    const cm = document.getElementById("colorMenu");
    if (cm){
      cm.addEventListener("click", () => setTimeout(() => burst(layer), 60), { passive:true });
    }
  }

  if (document.readyState === "loading"){
    addEventListener("DOMContentLoaded", initFX, { once:true });
  } else {
    initFX();
  }
})();
