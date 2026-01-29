(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);

  // Elements
  const inTa   = $("#jfInput");
  const outTa  = $("#jfOutput");

  const btnFormat = $("#jfFormat");
  const btnMinify = $("#jfMinify");
  const btnCopyIn = $("#jfCopyInput");
  const btnCopyOut= $("#jfCopyOutput");
  const btnClear  = $("#jfClear");

  const stBadge = $("#jfValidity");
  const stMeta  = $("#jfMeta");

  // Examples UI (optional)
  const exBox   = $("#jfExampleBox");
  const exLoad  = $("#jfLoadExample");
  const exNew   = $("#jfNewExample");

  if (!inTa || !outTa) return;

  // -----------------------------
  // Helpers
  // -----------------------------
  function normalize(t){
    return String(t ?? "").replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
  }

  function flash(btn, ok, baseText){
    if(!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btn.textContent = base), 900);
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
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){ return false; }
  }

  function bytesOf(str){
    try{ return new Blob([str]).size; }catch(e){ return str.length; }
  }

  function lineColFromIndex(text, idx){
    const upto = text.slice(0, Math.max(0, idx));
    const lines = upto.split("\n");
    const line = lines.length; // 1-based
    const col  = (lines[lines.length-1] || "").length + 1; // 1-based
    return { line, col };
  }

  function parseErrorOffset(err){
    const msg = String(err?.message || err || "");
    const mPos = msg.match(/position\s+(\d+)/i);
    if(mPos) return { type:"pos", value: Number(mPos[1]) };

    const mLC = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if(mLC) return { type:"lc", line: Number(mLC[1]), col: Number(mLC[2]) };

    return null;
  }

  function selectErrorPosition(offset){
    try{
      inTa.focus();
      if(!offset) return;

      const text = normalize(inTa.value);
      if(offset.type === "pos" && Number.isFinite(offset.value)){
        const pos = Math.max(0, Math.min(text.length, offset.value));
        inTa.setSelectionRange(pos, Math.min(text.length, pos + 1));
        return;
      }

      if(offset.type === "lc" && Number.isFinite(offset.line) && Number.isFinite(offset.col)){
        const lines = text.split("\n");
        const lineIdx = Math.max(1, Math.min(lines.length, offset.line)) - 1;
        let start = 0;
        for(let i=0;i<lineIdx;i++) start += (lines[i].length + 1);
        const colIdx = Math.max(1, offset.col) - 1;
        const pos = Math.min(text.length, start + colIdx);
        inTa.setSelectionRange(pos, Math.min(text.length, pos + 1));
      }
    }catch(e){}
  }

  function setStatus(ok, info){
    if(stBadge){
      stBadge.classList.remove("ok","bad");
      stBadge.classList.add(ok ? "ok" : "bad");
      stBadge.textContent = ok ? "✅ Valid JSON" : "⚠️ Invalid JSON";
    }
    if(stMeta){
      stMeta.textContent = info || (ok ? "Looks good. Copy the output when ready." : "Fix the error and try again.");
    }
  }

  function basicStats(text){
    const t = normalize(text);
    const lines = t ? t.split("\n").length : 0;
    const chars = t.length;
    const bytes = bytesOf(t);
    return { lines, chars, bytes };
  }

  function renderStats(ok, formattedText){
    const srcStats = basicStats(inTa.value);
    const outStats = basicStats(formattedText ?? outTa.value);

    const left = `Input: ${srcStats.lines} lines • ${srcStats.chars} chars • ${srcStats.bytes} bytes`;
    const right= `Output: ${outStats.lines} lines • ${outStats.chars} chars • ${outStats.bytes} bytes`;

    if(stMeta){
      stMeta.textContent = ok ? `${left}  |  ${right}` : left;
    }
  }

  function safeStringify(obj, pretty){
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  }

  function validateOnly(){
    const raw = normalize(inTa.value).trim();
    if(!raw){
      outTa.value = "";
      setStatus(false, "Paste JSON to validate and format.");
      renderStats(false, "");
      return;
    }
    try{
      JSON.parse(raw);
      setStatus(true, "Valid JSON. Choose Format or Minify.");
      renderStats(true, outTa.value);
    }catch(e){
      const off = parseErrorOffset(e);
      let extra = "Invalid JSON.";
      if(off?.type === "pos"){
        const lc = lineColFromIndex(raw, off.value);
        extra = `Invalid JSON near line ${lc.line}, col ${lc.col}.`;
      }else if(off?.type === "lc"){
        extra = `Invalid JSON near line ${off.line}, col ${off.col}.`;
      }
      setStatus(false, extra);
      renderStats(false, "");
    }
  }

  function formatJSON(pretty){
    const raw = normalize(inTa.value).trim();
    if(!raw){
      outTa.value = "";
      setStatus(false, "Paste JSON to format.");
      renderStats(false, "");
      return;
    }
    try{
      const obj = JSON.parse(raw);
      const out = safeStringify(obj, !!pretty);
      outTa.value = out;
      setStatus(true, pretty ? "Formatted output ready." : "Minified output ready.");
      renderStats(true, out);
    }catch(e){
      const off = parseErrorOffset(e);
      let extra = "Invalid JSON. Fix the input and try again.";
      if(off?.type === "pos"){
        const lc = lineColFromIndex(raw, off.value);
        extra = `Invalid JSON near line ${lc.line}, col ${lc.col}.`;
      }else if(off?.type === "lc"){
        extra = `Invalid JSON near line ${off.line}, col ${off.col}.`;
      }
      setStatus(false, extra);
      selectErrorPosition(off);
    }
  }

  // -----------------------------
  // Examples (7 scenarios)
  // -----------------------------
  const examples = [
    {
      title: "API response (users)",
      text: `{"success":true,"page":1,"pageSize":3,"data":[{"id":101,"name":"Mark","role":"admin","active":true},{"id":102,"name":"Sophie","role":"editor","active":true},{"id":103,"name":"Alex","role":"viewer","active":false}]}`
    },
    {
      title: "Product listing (e-commerce)",
      text: `{"sku":"LD-PS4-CTRL-BLK","title":"Wireless Controller","price":{"amount":34.9,"currency":"EUR"},"features":["responsive buttons","smooth analog sticks","fast pairing"],"inStock":true,"shipping":{"from":"FR","etaDays":2}}`
    },
    {
      title: "Site config (feature flags)",
      text: `{"app":"clickoz","env":"prod","features":{"particles":true,"translate":true,"cookieBanner":true},"limits":{"maxInputKB":256,"maxOutputKB":512}}`
    },
    {
      title: "Analytics event payload",
      text: `{"event":"tool_use","tool":"json-formatter","ts":"2026-01-29T12:10:00Z","meta":{"source":"tools_index","device":"mobile"},"props":{"formatted":true,"chars":842}}`
    },
    {
      title: "Nested structure (debugging)",
      text: `{"a":{"b":{"c":[{"k":"v","n":1},{"k":"v2","n":2}],"ok":true}},"notes":"deep nesting example"}`
    },
    {
      title: "Array-heavy JSON",
      text: `{"ids":[1,2,3,5,8,13,21],"tags":["seo","dev","tools"],"ratios":[0.1,0.25,0.5,1]}`
    },
    {
      title: "Broken JSON (to test validation)",
      text: `{"ok": true, "name": "Clickoz", "items": [1,2,], }`
    }
  ];
  let exIndex = 0;

  function showExample(idx){
    if(!exBox) return;
    const ex = examples[idx % examples.length];
    exBox.textContent = `${ex.title}\n\n${ex.text}`;
  }

  function nextExample(){
    exIndex = (exIndex + 1) % examples.length;
    showExample(exIndex);
  }

 function loadExample(){
  const ex = examples[exIndex % examples.length];
  inTa.value = ex.text;

  // Broken JSON: no auto-format, show a helpful tip
  if(ex.broken){
    outTa.value = "";
    validateOnly(); // sets status + focuses near error when possible

    // Add a precise, human tip for the common mistakes in this sample
    if(stMeta){
      stMeta.textContent =
        "Tip: this sample is intentionally broken → remove trailing commas (like [1,2,]) and the extra comma before the closing brace (… , }).";
    }
    if(stBadge){
      stBadge.classList.remove("ok");
      stBadge.classList.add("bad");
      stBadge.textContent = "⚠️ Invalid JSON (example)";
    }

    inTa.focus();
    return;
  }

  // Valid example: auto-format immediately
  formatJSON(true);
  inTa.focus();
}

function selectFirstTrailingComma(text){
  try{
    const t = normalize(text);

    // Find first ", ]" or ", }" (optionally with spaces/newlines)
    const re = /,\s*([\]}])/g;
    const m = re.exec(t);
    if(!m) return false;

    const commaIndex = m.index; // position of comma
    inTa.focus();
    inTa.setSelectionRange(commaIndex, Math.min(t.length, commaIndex + 1)); // select comma only
    return true;
  }catch(e){
    return false;
  }
}

  if(exBox){
    // initial message
    showExample(exIndex);
  }
  if(exNew) exNew.addEventListener("click", nextExample);
  if(exLoad) exLoad.addEventListener("click", loadExample);

  // -----------------------------
  // Events
  // -----------------------------
  let tmr = null;
  inTa.addEventListener("input", () => {
    clearTimeout(tmr);
    tmr = setTimeout(validateOnly, 80);
  });

  if(btnFormat) btnFormat.addEventListener("click", () => formatJSON(true));
  if(btnMinify) btnMinify.addEventListener("click", () => formatJSON(false));

  if(btnCopyIn) btnCopyIn.addEventListener("click", async () => {
    const ok = await copyToClipboard(inTa.value || "");
    flash(btnCopyIn, ok, "📋 Copy input");
  });

  if(btnCopyOut) btnCopyOut.addEventListener("click", async () => {
    const ok = await copyToClipboard(outTa.value || "");
    flash(btnCopyOut, ok, "✅ Copy output");
  });

  if(btnClear) btnClear.addEventListener("click", () => {
    inTa.value = "";
    outTa.value = "";
    inTa.focus();
    setStatus(false, "Paste JSON to validate and format.");
    renderStats(false, "");
  });

  outTa.addEventListener("focus", () => {
    try{ outTa.select(); }catch(e){}
  });

  // Init
  setStatus(false, "Paste JSON to validate and format.");
  validateOnly();
})();
