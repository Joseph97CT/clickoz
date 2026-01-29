(() => {
  "use strict";

  const $  = (s, r=document) => r.querySelector(s);

  // Inputs
  const urlEl      = $("#ubUrl");
  const presetEl   = $("#ubPreset");
  const srcEl      = $("#ubSource");
  const medEl      = $("#ubMedium");
  const campEl     = $("#ubCampaign");
  const termEl     = $("#ubTerm");
  const contEl     = $("#ubContent");

  // Output + UI
  const outEl      = $("#ubOutput");
  const hostEl     = $("#ubHost");
  const pathEl     = $("#ubPath");
  const lenEl      = $("#ubLen");
  const paramsEl   = $("#ubParamsCount");

  // Buttons
  const copyLinkBtn   = $("#ubCopyLink");
  const copyParamsBtn = $("#ubCopyParams");
  const clearBtn      = $("#ubClear");

  // Examples
  const exBox       = $("#ubExampleBox");
  const exLoadBtn   = $("#ubLoadExample");
  const exNewBtn    = $("#ubNewExample");

  if (!urlEl || !outEl) return;

  /* =========================================================
     0) Helpers
  ========================================================= */

  function normalizeSpaces(v){
    return String(v ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Keep UTMs readable: lowercase + hyphen (optional but good practice)
  function normalizeUtmValue(v){
    const t = normalizeSpaces(v);
    if(!t) return "";
    // safe normalize: keep letters/numbers, convert spaces to hyphen
    return t
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^\p{L}\p{N}\-_.~ ]/gu, "") // allow unicode letters/numbers + safe url chars + space
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function ensureProtocol(raw){
    const t = String(raw ?? "").trim();
    if(!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[a-z]+:\/\//i.test(t)) return t; // other schemes
    // allow "example.com/path"
    return "https://" + t.replace(/^\/+/, "");
  }

  function safeURL(raw){
    const withProto = ensureProtocol(raw);
    if(!withProto) return null;
    try{
      return new URL(withProto);
    }catch(e){
      return null;
    }
  }

  function setOrDeleteParam(u, key, value){
    const v = normalizeUtmValue(value);
    if(v) u.searchParams.set(key, v);
    else u.searchParams.delete(key);
  }

  function countUtmParams(u){
    const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
    let n = 0;
    for(const k of keys) if(u.searchParams.get(k)) n++;
    return n;
  }

  async function copyToClipboard(str){
    const text = String(str ?? "");
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(e){}
    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){
      return false;
    }
  }

  function flash(btn, ok, baseText){
    if(!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btn.textContent = base), 900);
  }

  function cleanPreview(u){
    if(!hostEl || !pathEl) return;
    hostEl.textContent = u ? (u.host || "—") : "—";
    pathEl.textContent = u ? (u.pathname || "/") : "—";
  }

  function updateStats(finalUrl){
    const t = String(finalUrl ?? "");
    if(lenEl) lenEl.textContent = String(t.length || 0);
    if(paramsEl){
      const u = safeURL(t);
      paramsEl.textContent = u ? String(countUtmParams(u)) : "0";
    }
  }

  /* =========================================================
     1) Presets + Examples
  ========================================================= */

  const presets = {
    youtube:     { utm_source: "youtube",    utm_medium: "video",  utm_campaign: "", utm_term: "", utm_content: "description" },
    instagram:   { utm_source: "instagram",  utm_medium: "social", utm_campaign: "", utm_term: "", utm_content: "bio" },
    tiktok:      { utm_source: "tiktok",     utm_medium: "social", utm_campaign: "", utm_term: "", utm_content: "profile" },
    newsletter:  { utm_source: "newsletter", utm_medium: "email",  utm_campaign: "", utm_term: "", utm_content: "cta" },
    ads:         { utm_source: "google",     utm_medium: "cpc",    utm_campaign: "", utm_term: "", utm_content: "ad-variant-a" }
  };

  const examples = [
    {
      title: "YouTube video description",
      url: "https://clickoz.com/tools/",
      preset: "youtube",
      campaign: "tools-directory",
      content: "description"
    },
    {
      title: "Instagram bio",
      url: "https://clickoz.com/",
      preset: "instagram",
      campaign: "brand-profile",
      content: "bio"
    },
    {
      title: "Newsletter CTA",
      url: "https://clickoz.com/tools/utm-builder/",
      preset: "newsletter",
      campaign: "jan-update",
      content: "top-cta"
    },
    {
      title: "Paid ads landing page",
      url: "https://clickoz.com/tools/meta-tags/",
      preset: "ads",
      campaign: "meta-tags-launch",
      term: "meta tags tool",
      content: "headline-a"
    },
    {
      title: "Partner referral",
      url: "https://clickoz.com/tools/word-counter/",
      preset: "",
      source: "partner-site",
      medium: "referral",
      campaign: "partner-mention",
      content: "sidebar-link"
    },
    {
      title: "QR poster (offline)",
      url: "https://clickoz.com/tools/",
      preset: "",
      source: "poster",
      medium: "offline",
      campaign: "event-booth",
      content: "qr-code"
    },
    {
      title: "TikTok profile link",
      url: "https://clickoz.com/tools/utm-builder/",
      preset: "tiktok",
      campaign: "creator-profile",
      content: "profile"
    }
  ];

  let exIndex = 0;

  function renderExampleBox(idx){
    if(!exBox) return;
    const ex = examples[idx % examples.length];
    exBox.textContent =
`${ex.title}
URL: ${ex.url}
Preset: ${ex.preset || "custom"}
Campaign: ${ex.campaign || "(set your name)"}
Tip: use utm_content for placement/variant`;
  }

  function applyExample(idx){
    const ex = examples[idx % examples.length];
    urlEl.value = ex.url;

    if(ex.preset){
      presetEl && (presetEl.value = ex.preset);
      applyPreset(ex.preset, { silent: true });
    }else{
      presetEl && (presetEl.value = "");
      srcEl.value  = ex.source  || "";
      medEl.value  = ex.medium  || "";
      campEl.value = ex.campaign || "";
      termEl.value = ex.term || "";
      contEl.value = ex.content || "";
    }

    // overwrite some fields if present
    if(ex.campaign) campEl.value = ex.campaign;
    if(ex.term) termEl.value = ex.term;
    if(ex.content) contEl.value = ex.content;

    build();
    urlEl.focus();
  }

  function nextExample(){
    exIndex = (exIndex + 1) % examples.length;
    renderExampleBox(exIndex);
  }

  function applyPreset(key, opts = {}){
    const p = presets[key];
    if(!p) return;

    // Only fill blanks (so user doesn’t lose custom values)
    const fillIfEmpty = (el, v) => {
      if(!el) return;
      const cur = normalizeSpaces(el.value);
      if(!cur) el.value = v || "";
    };

    fillIfEmpty(srcEl, p.utm_source);
    fillIfEmpty(medEl, p.utm_medium);
    fillIfEmpty(campEl, p.utm_campaign);
    fillIfEmpty(termEl, p.utm_term);
    fillIfEmpty(contEl, p.utm_content);

    if(!opts.silent) build();
  }

  /* =========================================================
     2) Builder
  ========================================================= */

  function build(){
    const raw = normalizeSpaces(urlEl.value);
    const u = safeURL(raw);

    if(!u){
      outEl.value = "";
      cleanPreview(null);
      updateStats("");
      return;
    }

    // apply UTMs
    setOrDeleteParam(u, "utm_source",   srcEl.value);
    setOrDeleteParam(u, "utm_medium",   medEl.value);
    setOrDeleteParam(u, "utm_campaign", campEl.value);
    setOrDeleteParam(u, "utm_term",     termEl.value);
    setOrDeleteParam(u, "utm_content",  contEl.value);

    // produce final
    const finalUrl = u.toString();
    outEl.value = finalUrl;

    cleanPreview(u);
    updateStats(finalUrl);
  }

  function clearAll(){
    urlEl.value = "";
    presetEl && (presetEl.value = "");
    srcEl.value = "";
    medEl.value = "";
    campEl.value = "";
    termEl.value = "";
    contEl.value = "";
    outEl.value = "";
    cleanPreview(null);
    updateStats("");
    urlEl.focus();
  }

  function currentParamsText(){
    const u = safeURL(outEl.value);
    if(!u) return "";
    const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
    const rows = [];
    for(const k of keys){
      const v = u.searchParams.get(k);
      if(v) rows.push(`${k}=${v}`);
    }
    return rows.join("\n");
  }

  /* =========================================================
     3) Events
  ========================================================= */

  let tmr = null;
  function scheduleBuild(){
    clearTimeout(tmr);
    tmr = setTimeout(build, 20);
  }

  urlEl.addEventListener("input", scheduleBuild);
  srcEl.addEventListener("input", scheduleBuild);
  medEl.addEventListener("input", scheduleBuild);
  campEl.addEventListener("input", scheduleBuild);
  termEl.addEventListener("input", scheduleBuild);
  contEl.addEventListener("input", scheduleBuild);

  if(presetEl){
    presetEl.addEventListener("change", () => {
      const key = presetEl.value;
      if(!key) return build();
      applyPreset(key);
    });
  }

  if(copyLinkBtn){
    copyLinkBtn.addEventListener("click", async () => {
      const t = String(outEl.value ?? "").trim();
      if(!t){
        flash(copyLinkBtn, false, "📋 Copy link");
        return;
      }
      const ok = await copyToClipboard(t);
      flash(copyLinkBtn, ok, "📋 Copy link");
    });
  }

  if(copyParamsBtn){
    copyParamsBtn.addEventListener("click", async () => {
      const t = currentParamsText();
      if(!t){
        flash(copyParamsBtn, false, "✅ Copy UTM params");
        return;
      }
      const ok = await copyToClipboard(t);
      flash(copyParamsBtn, ok, "✅ Copy UTM params");
    });
  }

  if(clearBtn){
    clearBtn.addEventListener("click", clearAll);
  }

  // Examples
  renderExampleBox(exIndex);

  if(exNewBtn) exNewBtn.addEventListener("click", nextExample);
  if(exLoadBtn) exLoadBtn.addEventListener("click", () => applyExample(exIndex));

  // Initial render
  build();
})();
