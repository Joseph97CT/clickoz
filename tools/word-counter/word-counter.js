(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const input = $('#inputText');

  const w  = $('#w');
  const c  = $('#c');
  const cn = $('#cn');
  const s  = $('#s');
  const p  = $('#p');

  const rtHuman = $('#rtHuman');
  const rtAI    = $('#rtAI');
  const aws     = $('#aws');

  const copyBtn      = $('#copyBtn');
  const copyStatsBtn = $('#copyStatsBtn');
  const clearBtn     = $('#clearBtn');

  const aiSpeakBtn = $('#aiSpeakBtn');
  const aiStopBtn  = $('#aiStopBtn');

  if (!input) return;

  /* ---------------- Counting helpers ---------------- */

  function safeTrim(text){
    return (text || '').replace(/\u00A0/g, ' ').trim();
  }

  function countWords(text){
    const t = safeTrim(text);
    if(!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function countSentences(text){
    const t = safeTrim(text);
    if(!t) return 0;
    // robust enough for normal text (handles abbreviations decently)
    const parts = t.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g);
    const n = parts ? parts.map(x => x.trim()).filter(Boolean).length : 0;
    return n || (t ? 1 : 0);
  }

  function countParagraphs(text){
    const t = (text || '').trim();
    if(!t) return 0;
    return t
      .split(/\n{2,}/)
      .map(x => x.trim())
      .filter(Boolean).length;
  }

  function fmtDuration(seconds){
    const sec = Math.max(0, Math.round(seconds || 0));
    if (sec < 60) return `${sec} sec`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} min ${s} sec`;
  }

  // ✅ Human reading: faster (default ~230 wpm)
  function humanReadingSeconds(words){
    const wpm = 230;
    const secs = (words / wpm) * 60;
    // show real seconds (no “stuck at 1 min”)
    return Math.max(0, secs);
  }

  // ✅ AI voice reading: slower (default ~150 wpm)
  function aiReadingSeconds(words){
    const wpm = 150;
    const secs = (words / wpm) * 60;
    return Math.max(0, secs);
  }

  /* ---------------- Clipboard ---------------- */

  async function copyTextSafe(str){
    try{
      await navigator.clipboard.writeText(str);
      return true;
    }catch(e){
      return false;
    }
  }

  /* ---------------- AI voice (speechSynthesis) ---------------- */

  let utter = null;

  function stopVoice(){
    try{
      window.speechSynthesis.cancel();
    }catch(e){}
    utter = null;
    if(aiSpeakBtn) aiSpeakBtn.textContent = 'Play voice';
  }

  function speakText(text){
    const t = safeTrim(text);
    if(!t) return;

    stopVoice();

    utter = new SpeechSynthesisUtterance(t);

    // Slightly slower for "AI voice"
    utter.rate = 0.9;   // 1.0 default, lower = slower
    utter.pitch = 1.0;

    utter.onend = () => {
      utter = null;
      if(aiSpeakBtn) aiSpeakBtn.textContent = 'Play voice';
    };
    utter.onerror = () => {
      utter = null;
      if(aiSpeakBtn) aiSpeakBtn.textContent = 'Play voice';
    };

    try{
      window.speechSynthesis.speak(utter);
      if(aiSpeakBtn) aiSpeakBtn.textContent = 'Playing…';
    }catch(e){
      // ignore
    }
  }

  /* ---------------- Render ---------------- */

  function render(){
    const text = input.value || '';
    const words = countWords(text);
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g,'').length;
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);

    if(w)  w.textContent = String(words);
    if(c)  c.textContent = String(chars);
    if(cn) cn.textContent = String(charsNoSpaces);
    if(s)  s.textContent = String(sentences);
    if(p)  p.textContent = String(paragraphs);

    // ✅ improved reading time (not stuck)
    if(rtHuman) rtHuman.textContent = fmtDuration(humanReadingSeconds(words));
    if(rtAI)    rtAI.textContent    = fmtDuration(aiReadingSeconds(words));

    // ✅ extra useful tool metric
    if(aws){
      const val = sentences > 0 ? (words / sentences) : 0;
      aws.textContent = (Math.round(val * 10) / 10).toFixed(1);
    }
  }

  /* ---------------- Events ---------------- */

  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(render, 40);
  });

  if(clearBtn){
    clearBtn.addEventListener('click', () => {
      input.value = '';
      render();
      input.focus();
      stopVoice();
    });
  }

  if(copyBtn){
    copyBtn.addEventListener('click', async () => {
      const ok = await copyTextSafe(input.value || '');
      copyBtn.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(() => copyBtn.textContent = 'Copy text', 900);
    });
  }

  if(copyStatsBtn){
    copyStatsBtn.addEventListener('click', async () => {
      const text = input.value || '';
      const words = countWords(text);

      const payload =
`Word Counter (Clickoz)
Words: ${words}
Human reading: ${fmtDuration(humanReadingSeconds(words))}
AI voice reading: ${fmtDuration(aiReadingSeconds(words))}
Characters: ${text.length}
Chars (no spaces): ${text.replace(/\s/g,'').length}
Sentences: ${countSentences(text)}
Paragraphs: ${countParagraphs(text)}
Avg words/sentence: ${((countSentences(text) > 0) ? (words / countSentences(text)) : 0).toFixed(1)}`;

      const ok = await copyTextSafe(payload);
      copyStatsBtn.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(() => copyStatsBtn.textContent = 'Copy results', 900);
    });
  }

  // Example loaders
  $$('.ex .btn[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-fill');
      const pre = sel ? $(sel) : null;
      if(!pre) return;

      input.value = (pre.textContent || '').trim();
      render();
      input.focus();
      input.scrollIntoView({ behavior:'smooth', block:'center' });
      stopVoice();
    });
  });

  // AI voice buttons
  if(aiSpeakBtn){
    aiSpeakBtn.addEventListener('click', () => {
      const text = input.value || '';
      if (utter) return; // already speaking
      speakText(text);
    });
  }
  if(aiStopBtn){
    aiStopBtn.addEventListener('click', stopVoice);
  }

  // If user navigates away / hides tab
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stopVoice();
  });

  render();
})();
