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
    // idx is 0-based offset in text
    const upto = text.slice(0, Math.max(0, idx));
    const lines = upto.split("\n");
    const line = lines.length;               // 1-based
    const col  = (lines[lines.length-1] || "").length + 1; // 1-based
    return { line, col };
  }

  function parseErrorOffset(err){
    // V8/Chromium: "Unexpected token ... in JSON at position 123"
    // Safari: "JSON Parse error: Unexpected identifier "x" at line 1 column 2"
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
      stMeta.textContent = info || (ok ? "Looks good. You can copy the formatted output." : "Fix the error and try again.");
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
    // pretty: true => 2 spaces
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

  // Output is read-only UX, but keep focusable
  outTa.addEventListener("focus", () => {
    // select all on focus for quick copy if user wants
    try{ outTa.select(); }catch(e){}
  });

  // Init
  setStatus(false, "Paste JSON to validate and format.");
  validateOnly();
})();
