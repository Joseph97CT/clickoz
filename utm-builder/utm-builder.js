/* =========================================================
   Clickoz — UTM Builder (browser-only)
   - Build UTM URLs fast
   - Copy-ready link + params
   - Presets + examples
   - Safe URL normalization
========================================================= */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  const els = {
    url: $("#ubUrl"),
    source: $("#ubSource"),
    medium: $("#ubMedium"),
    campaign: $("#ubCampaign"),
    term: $("#ubTerm"),
    content: $("#ubContent"),

    out: $("#ubOutput"),
    previewHost: $("#ubHost"),
    previewPath: $("#ubPath"),

    btnCopyLink: $("#ubCopyLink"),
    btnCopyParams: $("#ubCopyParams"),
    btnClear: $("#ubClear"),

    btnLoadExample: $("#ubLoadExample"),
    btnNewExample: $("#ubNewExample"),

    preset: $("#ubPreset"),

    statLen: $("#ubLen"),
    statParams: $("#ubParamsCount"),
  };

  if (!els.url || !els.out) return;

  // --- Helpers ---
  const normalizeSpaces = (s) => String(s ?? "").replace(/\u00A0/g, " ").trim();

  // Minimal slugify for utm fields (doesn't break user intent)
  function cleanUtmValue(raw) {
    let s = normalizeSpaces(raw);
    if (!s) return "";
    // Keep letters/numbers/._- and convert spaces to -
    s = s
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}._-]/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return s;
  }

  function ensureUrl(raw) {
    const t = normalizeSpaces(raw);
    if (!t) return "";
    // If missing scheme, assume https
    if (!/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
  }

  function safeParseUrl(raw) {
    try {
      return new URL(raw);
    } catch (_) {
      return null;
    }
  }

  function setText(el, v) {
    if (!el) return;
    el.textContent = String(v ?? "");
  }

  async function copyToClipboard(str) {
    const text = String(str ?? "");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
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
    } catch (e) {
      return false;
    }
  }

  function flash(btn, ok, baseText) {
    if (!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btn.textContent = base), 900);
  }

  function buildParams() {
    // clean fields but DO NOT force if user wants raw -> only for UTM values
    const source = cleanUtmValue(els.source.value);
    const medium = cleanUtmValue(els.medium.value);
    const campaign = cleanUtmValue(els.campaign.value);
    const term = cleanUtmValue(els.term.value);
    const content = cleanUtmValue(els.content.value);

    const params = new URLSearchParams();
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (term) params.set("utm_term", term);
    if (content) params.set("utm_content", content);

    return params;
  }

  function mergeUrlWithParams(baseUrlRaw, params) {
    const fixed = ensureUrl(baseUrlRaw);
    const u = safeParseUrl(fixed);
    if (!u) return { finalUrl: "", host: "—", path: "—" };

    // Merge: keep existing params, override same keys with new UTM
    params.forEach((v, k) => u.searchParams.set(k, v));

    const host = u.host || "—";
    const path = (u.pathname || "/") + (u.search ? u.search : "");
    return { finalUrl: u.toString(), host, path };
  }

  function countParams(params) {
    let n = 0;
    params.forEach(() => n++);
    return n;
  }

  function render() {
    const params = buildParams();
    const merged = mergeUrlWithParams(els.url.value, params);

    els.out.value = merged.finalUrl || "";
    setText(els.previewHost, merged.host);
    setText(els.previewPath, merged.path);

    setText(els.statLen, (merged.finalUrl || "").length);
    setText(els.statParams, countParams(params));
  }

  function clearAll() {
    els.url.value = "";
    els.source.value = "";
    els.medium.value = "";
    els.campaign.value = "";
    els.term.value = "";
    els.content.value = "";
    render();
    els.url.focus();
  }

  // --- Presets (common UTM mediums + quick setups) ---
  const PRESETS = {
    youtube: { source: "youtube", medium: "video", campaign: "channel", term: "", content: "description" },
    instagram: { source: "instagram", medium: "social", campaign: "profile", term: "", content: "bio" },
    tiktok: { source: "tiktok", medium: "social", campaign: "profile", term: "", content: "bio" },
    newsletter: { source: "newsletter", medium: "email", campaign: "weekly", term: "", content: "cta" },
    ads: { source: "google", medium: "cpc", campaign: "search", term: "keyword", content: "ad-1" },
  };

  function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    els.source.value = p.source;
    els.medium.value = p.medium;
    els.campaign.value = p.campaign;
    els.term.value = p.term;
    els.content.value = p.content;
    render();
  }

  // --- Examples ---
  const EXAMPLES = [
    {
      title: "YouTube description link",
      url: "https://clickoz.com/tools/word-counter/",
      preset: "youtube",
      campaign: "word-counter-launch",
      content: "yt-description",
    },
    {
      title: "Instagram bio link",
      url: "clickoz.com/tools/",
      preset: "instagram",
      campaign: "tools-directory",
      content: "bio-link",
    },
    {
      title: "TikTok profile link",
      url: "https://clickoz.com/",
      preset: "tiktok",
      campaign: "brand-home",
      content: "profile",
    },
    {
      title: "Newsletter CTA",
      url: "https://clickoz.com/tools/meta-tags/",
      preset: "newsletter",
      campaign: "jan-update",
      content: "cta-button",
    },
    {
      title: "Ads landing page",
      url: "clickoz.com/tools/serp-preview/",
      preset: "ads",
      campaign: "serp-preview-cpc",
      term: "serp-preview",
      content: "text-ad-1",
    },
    {
      title: "Partner referral",
      url: "https://clickoz.com/tools/readability-analyzer/",
      preset: "",
      source: "partner-site",
      medium: "referral",
      campaign: "partner-mentions",
      content: "article-link",
    },
    {
      title: "QR code poster",
      url: "https://clickoz.com/tools/utm-builder/",
      preset: "",
      source: "poster",
      medium: "offline",
      campaign: "flyer-geneva",
      content: "qr",
    },
  ];

  let exIndex = 0;

  function loadExample(idx) {
    const ex = EXAMPLES[idx % EXAMPLES.length];
    if (!ex) return;

    els.url.value = ex.url || "";
    if (ex.preset) applyPreset(ex.preset);

    // override / fill
    if (ex.source) els.source.value = ex.source;
    if (ex.medium) els.medium.value = ex.medium;
    if (ex.campaign) els.campaign.value = ex.campaign;
    if (ex.term) els.term.value = ex.term;
    if (ex.content) els.content.value = ex.content;

    render();
    els.url.focus();
  }

  function nextExample() {
    exIndex = (exIndex + 1) % EXAMPLES.length;
    // Do not auto-fill (keeps UX); only changes "example hint"
    // We'll show example name in placeholder (handled by HTML later)
    loadExample(exIndex);
  }

  // --- Events ---
  let tmr = null;
  const onAnyInput = () => {
    clearTimeout(tmr);
    tmr = setTimeout(render, 30);
  };

  ["input", "change"].forEach((evt) => {
    els.url.addEventListener(evt, onAnyInput);
    els.source.addEventListener(evt, onAnyInput);
    els.medium.addEventListener(evt, onAnyInput);
    els.campaign.addEventListener(evt, onAnyInput);
    els.term.addEventListener(evt, onAnyInput);
    els.content.addEventListener(evt, onAnyInput);
  });

  if (els.preset) {
    els.preset.addEventListener("change", () => {
      const key = els.preset.value;
      if (key) applyPreset(key);
    });
  }

  if (els.btnClear) els.btnClear.addEventListener("click", clearAll);

  if (els.btnCopyLink) {
    els.btnCopyLink.addEventListener("click", async () => {
      const ok = await copyToClipboard(els.out.value || "");
      flash(els.btnCopyLink, ok, "📋 Copy link");
    });
  }

  if (els.btnCopyParams) {
    els.btnCopyParams.addEventListener("click", async () => {
      const params = buildParams();
      const pairs = [];
      params.forEach((v, k) => pairs.push(`${k}=${v}`));
      const payload = pairs.length ? pairs.join("\n") : "";
      const ok = await copyToClipboard(payload);
      flash(els.btnCopyParams, ok, "✅ Copy UTM params");
    });
  }

  if (els.btnLoadExample) els.btnLoadExample.addEventListener("click", () => loadExample(exIndex));
  if (els.btnNewExample) els.btnNewExample.addEventListener("click", nextExample);

  // init
  render();
})();
