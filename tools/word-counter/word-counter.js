(() => {
  "use strict";

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const input = $("#inputText");

  const elWords = $("#w");
  const elChars = $("#c");
  const elCharsNoSpaces = $("#cn");
  const elSentences = $("#s");
  const elParagraphs = $("#p");
  const elAWS = $("#aws");
  const elRtHuman = $("#rtHuman");
  const elRtAI = $("#rtAI");

  const copyBtn = $("#copyBtn");
  const copyStatsBtn = $("#copyStatsBtn");
  const clearBtn = $("#clearBtn");

  const aiSpeakBtn = $("#aiSpeakBtn");
  const aiStopBtn = $("#aiStopBtn");

  // ✅ quick guard
  if (!input) {
    console.warn("[WordCounter] Missing #inputText");
    return;
  }

  // ✅ DEBUG (optional): remove later
  console.log("[WordCounter] JS loaded ✅");

  /* ---------------------------
     Helpers
  --------------------------- */

  function normalizeText(t){
    return (t || "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n");
  }

  function wordCount(text){
    const t = normalizeText(text).trim();
    if (!t) return 0;
    // keeps apostrophes inside words
    const words = t.match(/[^\s]+/g);
    return words ? words.length : 0;
  }

  function sentenceCount(text){
    const t = normalizeText(text).trim();
    if (!t) return 0;

    // simple + robust: count punctuation boundaries, fallback to 1
    const parts = t
      .split(/(?<=[.!?])\s+/g)
      .map(x => x.trim())
      .filter(Boolean);

    return Math.max(1, parts.length);
  }

  function paragraphCount(text){
    const t = normalizeText(text).trim();
    if (!t) return 0;

    return t
      .split(/\n{2,}/g)
      .map(x => x.trim())
      .filter(Boolean).length;
  }

  function formatDuration(seconds){
    const s = Math.max(0, Math.round(seconds || 0));
    if (s < 60) return `${s} sec`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m} min ${r} sec` : `${m} min`;
  }

  // ✅ Human silent reading (fast)
  function humanSeconds(words){
    const wpm = 235;
    return (words / wpm) * 60;
  }

  // ✅ AI voice speaking (slower)
  function aiSeconds(words){
    const wpm = 155;
    return (words / wpm) * 60;
  }

  async function copyToClipboard(str){
    const text = String(str ?? "");
    // Try modern clipboard first
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch(e){ /* ignore */ }

    // Fallback
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
    } catch(e){
      return false;
    }
  }

  function flashBtn(btn, okText, failText, resetText){
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = okText;
    setTimeout(() => {
      btn.textContent = resetText || prev;
    }, 900);
  }

  /* ---------------------------
     Render
  --------------------------- */

  function render(){
    const text = input.value || "";
    const words = wordCount(text);
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = sentenceCount(text);
    const paragraphs = paragraphCount(text);
    const aws = sentences > 0 ? (words / sentences) : 0;

    if (elWords) elWords.textContent = String(words);
    if (elChars) elChars.textContent = String(chars);
    if (elCharsNoSpaces) elCharsNoSpaces.textContent = String(charsNoSpaces);
    if (elSentences) elSentences.textContent = String(sentences);
    if (elParagraphs) elParagraphs.textContent = String(paragraphs);
    if (elAWS) elAWS.textContent = (Math.round(aws * 10) / 10).toFixed(1);

    if (elRtHuman) elRtHuman.textContent = formatDuration(humanSeconds(words));
    if (elRtAI) elRtAI.textContent = formatDuration(aiSeconds(words));
  }

  let debounce = null;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(render, 30);
  });

  /* ---------------------------
     Buttons
  --------------------------- */

  if (clearBtn){
    clearBtn.addEventListener("click", () => {
      input.value = "";
      render();
      input.focus();
      stopVoice();
    });
  }

  if (copyBtn){
    copyBtn.addEventListener("click", async () => {
      const ok = await copyToClipboard(input.value || "");
      flashBtn(copyBtn, ok ? "Copied!" : "Copy failed", "Copy failed", "Copy text");
    });
  }

  if (copyStatsBtn){
    copyStatsBtn.addEventListener("click", async () => {
      const text = input.value || "";
      const words = wordCount(text);
      const sentences = sentenceCount(text);

      const payload =
`Word Counter (Clickoz)
Words: ${words}
Human reading: ${formatDuration(humanSeconds(words))}
AI voice reading: ${formatDuration(aiSeconds(words))}
Characters: ${text.length}
Chars (no spaces): ${text.replace(/\\s/g, "").length}
Sentences: ${sentences}
Paragraphs: ${paragraphCount(text)}
Avg words/sentence: ${(sentences ? (words / sentences) : 0).toFixed(1)}`;

      const ok = await copyToClipboard(payload);
      flashBtn(copyStatsBtn, ok ? "Copied!" : "Copy failed", "Copy failed", "Copy results");
    });
  }

  /* ---------------------------
     Examples
  --------------------------- */

  $$("[data-fill]").forEach(btn => {
    btn.addEventListener("click", () => {
      const sel = btn.getAttribute("data-fill");
      const pre = sel ? $(sel) : null;
      if (!pre) return;

      input.value = (pre.textContent || "").trim();
      render();
      input.focus();
      stopVoice();
    });
  });

  /* ---------------------------
     AI Voice (SpeechSynthesis)
     - Works only after user interaction
  --------------------------- */

  let utter = null;

  function stopVoice(){
    try { window.speechSynthesis.cancel(); } catch(e) {}
    utter = null;
    if (aiSpeakBtn) aiSpeakBtn.textContent = "Play voice";
  }

  function speak(){
    const t = normalizeText(input.value).trim();
    if (!t) return;

    stopVoice();

    utter = new SpeechSynthesisUtterance(t);

    // Stable settings
    utter.rate = 0.92;
    utter.pitch = 1.0;

    utter.onend = () => {
      utter = null;
      if (aiSpeakBtn) aiSpeakBtn.textContent = "Play voice";
    };
    utter.onerror = () => {
      utter = null;
      if (aiSpeakBtn) aiSpeakBtn.textContent = "Play voice";
    };

    try {
      window.speechSynthesis.speak(utter);
      if (aiSpeakBtn) aiSpeakBtn.textContent = "Playing…";
    } catch(e) {
      // ignore
    }
  }

  if (aiSpeakBtn){
    aiSpeakBtn.addEventListener("click", () => {
      // If already speaking, do nothing
      if (utter) return;
      speak();
    });
  }

  if (aiStopBtn){
    aiStopBtn.addEventListener("click", stopVoice);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopVoice();
  });

  /* ---------------------------
     Init
  --------------------------- */
  render();
})();
