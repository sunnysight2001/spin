const LANGS = [
  { id: "en", label: "English", locale: "en-IN" },
  { id: "hi", label: "Hindi", locale: "hi-IN" },
  { id: "mr", label: "Marathi", locale: "mr-IN" },
  { id: "gu", label: "Gujarati", locale: "gu-IN" },
  { id: "ta", label: "Tamil", locale: "ta-IN" },
  { id: "te", label: "Telugu", locale: "te-IN" },
  { id: "pa", label: "Punjabi", locale: "pa-IN" },
  { id: "bn", label: "Bengali", locale: "bn-IN" }
];

const state = {
  i: 0,
  lang: "en",
  mode: "standard",
  auto: true,
  micMuted: false,
  spkMuted: false,
  paused: false,
  speaking: false,
  user: null,
  gen: 0
};

let rec = null;
let audioEl = null;
let audioUrl = null;

function $(id) { return document.getElementById(id); }

function currentSlide() { return DECK.slides[state.i]; }

function scriptFor(slide) {
  const pack = slide.scripts[state.lang] || slide.scripts.en;
  return pack[state.mode] || pack.standard;
}

function setVoiceStatus(msg) {
  const el = $("voiceStatus");
  if (el) el.textContent = msg || "";
}

function stopSpeech() {
  state.gen += 1;
  if (audioEl) {
    try { audioEl.pause(); } catch (e) {}
    audioEl.removeAttribute("src");
    audioEl.load();
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    audioUrl = null;
  }
  state.speaking = false;
}

async function speakCurrent() {
  stopSpeech();
  if (state.spkMuted) {
    setVoiceStatus("Speaker muted");
    return;
  }
  const text = scriptFor(currentSlide());
  const lang = state.lang;
  const myGen = state.gen;
  state.speaking = true;
  state.paused = false;
  const label = (LANGS.find(l => l.id === lang) || {}).label || lang;
  setVoiceStatus("Loading " + label + " voice…");

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang })
    });
    if (myGen !== state.gen) return;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || ("TTS " + res.status));
    }
    const buf = await res.arrayBuffer();
    if (myGen !== state.gen) return;
    if (!buf.byteLength) throw new Error("Empty audio");
    audioUrl = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
    if (!audioEl) audioEl = new Audio();
    audioEl.src = audioUrl;
    audioEl.onended = () => {
      if (myGen !== state.gen) return;
      state.speaking = false;
      setVoiceStatus("");
      if (state.auto && !state.paused) next();
    };
    audioEl.onerror = () => {
      if (myGen !== state.gen) return;
      state.speaking = false;
      setVoiceStatus("Audio playback failed");
    };
    await audioEl.play();
    if (myGen !== state.gen) return;
    setVoiceStatus("Speaking · neural voice");
  } catch (err) {
    if (myGen !== state.gen) return;
    state.speaking = false;
    setVoiceStatus("Voice server not live. Deploy with Netlify functions (see NETLIFY.md).");
    console.warn("TTS failed", err);
  }
}

function renderSlide() {
  const s = currentSlide();
  $("slideTitle").textContent = s.title;
  $("slideMeta").textContent = `Slide ${state.i + 1} of ${DECK.slides.length} · ${s.chapter}`;
  $("slideFrame").innerHTML = s.html;
  $("scriptBox").textContent = scriptFor(s);
  $("tipBox").textContent = s.tip || "Stay with approved claims only. If it is not on this page, do not invent it.";
  $("termBox").innerHTML = (s.terms || []).map(t => `<span class="term">${t}</span>`).join("");
  $("bar").style.width = `${((state.i + 1) / DECK.slides.length) * 100}%`;
  document.querySelectorAll(".nav-ch").forEach(el => {
    el.classList.toggle("active", Number(el.dataset.index) === state.i);
  });
  $("modeBtn").textContent = state.mode === "doctor" ? "Cabin lines on" : "Cabin lines";
  const head = $("scriptHead");
  if (head) head.textContent = state.mode === "doctor" ? "Cabin lines" : "Facilitator";
  $("modeBtn").classList.toggle("active", state.mode === "doctor");
  $("autoBtn").textContent = state.auto ? "Auto-advance on" : "Auto-advance off";
  $("autoBtn").classList.toggle("active", state.auto);
  $("micBtn").textContent = state.micMuted ? "Mic muted" : "Mic on";
  $("micBtn").classList.toggle("on", !state.micMuted);
  $("micBtn").classList.toggle("danger", state.micMuted);
  $("spkBtn").textContent = state.spkMuted ? "Speaker muted" : "Speaker on";
  $("spkBtn").classList.toggle("on", !state.spkMuted);
  $("spkBtn").classList.toggle("danger", state.spkMuted);
}

function go(n, speak) {
  if (speak === undefined) speak = true;
  state.i = Math.max(0, Math.min(DECK.slides.length - 1, n));
  state.paused = false;
  renderSlide();
  if (speak) speakCurrent();
}

function next() { if (state.i < DECK.slides.length - 1) go(state.i + 1); }
function prev() { if (state.i > 0) go(state.i - 1); }

function setLang(id) {
  state.lang = id;
  $("langSelect").value = id;
  renderSlide();
  speakCurrent();
}

function toggleMode() {
  state.mode = state.mode === "doctor" ? "standard" : "doctor";
  renderSlide();
  speakCurrent();
}

function pauseSpeech() {
  state.paused = true;
  if (audioEl) {
    try { audioEl.pause(); } catch (e) {}
  }
  setVoiceStatus("Paused");
}

function handleCommand(raw) {
  const t = (raw || "").toLowerCase();
  if (!t) return;
  if (/(next|aage|agli|agla)/.test(t)) return next();
  if (/(prev|previous|pehle|pichli|back)/.test(t)) return prev();
  if (/(repeat|dobara|phir)/.test(t)) return speakCurrent();
  if (/(pause|ruk|stop)/.test(t)) return pauseSpeech();
  if (/(play|chalao|continue|resume)/.test(t)) {
    state.paused = false;
    if (audioEl && audioEl.paused && audioEl.src) audioEl.play();
    else speakCurrent();
    return;
  }
  if (/(doctor|specialist|clinic|cabin)/.test(t)) {
    state.mode = "doctor";
    renderSlide();
    return speakCurrent();
  }
  if (/(simple|standard|rep script|asaan|facilitator)/.test(t)) {
    state.mode = "standard";
    renderSlide();
    return speakCurrent();
  }
  const map = [
    [/hindi|हिंदी/, "hi"],
    [/english|अंग्रेजी|angrezi/, "en"],
    [/marathi|मराठी/, "mr"],
    [/gujarati|gujrati|ગુજરાતી/, "gu"],
    [/tamil|தமிழ்/, "ta"],
    [/telugu|telegu|తెలుగు/, "te"],
    [/punjabi|ਪੰਜਾਬੀ/, "pa"],
    [/bengali|bangla|বাংলা/, "bn"]
  ];
  for (const [re, id] of map) {
    if (re.test(t)) return setLang(id);
  }
}

function startMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-IN";
  rec.onresult = ev => {
    if (state.micMuted) return;
    const last = ev.results[ev.results.length - 1];
    if (last && last.isFinal) handleCommand(last[0].transcript);
  };
  rec.onend = () => {
    if (!state.micMuted) {
      try { rec.start(); } catch (e) {}
    }
  };
  try { rec.start(); } catch (e) {}
}

function stopMic() {
  if (rec) {
    try { rec.stop(); } catch (e) {}
  }
}

function buildNav() {
  const nav = $("chapterNav");
  nav.innerHTML = DECK.slides.map((s, i) =>
    `<div class="nav-ch" data-index="${i}"><small>${s.chapter}</small>${s.short}</div>`
  ).join("");
  nav.addEventListener("click", e => {
    const el = e.target.closest(".nav-ch");
    if (!el) return;
    go(Number(el.dataset.index));
  });
}

function fillLangs() {
  $("langSelect").innerHTML = LANGS.map(l => `<option value="${l.id}">${l.label}</option>`).join("");
}

function showApp(user) {
  $("loginScreen").style.display = "none";
  $("app").classList.add("on");
  $("userLabel").textContent = user;
  buildNav();
  fillLangs();
  renderSlide();
  startMic();
}

function login() {
  const email = $("email").value.trim();
  const pass = $("password").value;
  const ok = (email === "mr@sunpharma.com" && pass === "Gimliand@2026") ||
             (email.length > 3 && pass === "Gimliand@2026");
  if (!ok) {
    $("loginError").textContent = "Use mr@sunpharma.com / Gimliand@2026 for this demo.";
    return;
  }
  state.user = email;
  localStorage.setItem("spin_user", email);
  showApp(email);
}

function logout() {
  stopSpeech();
  stopMic();
  localStorage.removeItem("spin_user");
  location.reload();
}

function bind() {

  const chaptersBtn = $("chaptersBtn");
  const scriptBtn = $("scriptBtn");
  if (chaptersBtn) chaptersBtn.onclick = () => {
    $("app").classList.toggle("wide-side");
    $("app").classList.remove("wide-rail");
  };
  if (scriptBtn) scriptBtn.onclick = () => {
    $("app").classList.toggle("wide-rail");
    $("app").classList.remove("wide-side");
  };
  $("loginBtn").onclick = login;
  $("password").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
  $("logoutBtn").onclick = logout;
  $("prevBtn").onclick = prev;
  $("nextBtn").onclick = next;
  $("playBtn").onclick = () => { state.paused = false; speakCurrent(); };
  $("pauseBtn").onclick = pauseSpeech;
  $("repeatBtn").onclick = speakCurrent;
  $("langSelect").onchange = e => setLang(e.target.value);
  $("modeBtn").onclick = toggleMode;
  $("autoBtn").onclick = () => { state.auto = !state.auto; renderSlide(); };
  $("micBtn").onclick = () => {
    state.micMuted = !state.micMuted;
    if (state.micMuted) stopMic(); else startMic();
    renderSlide();
  };
  $("spkBtn").onclick = () => {
    state.spkMuted = !state.spkMuted;
    if (state.spkMuted) stopSpeech();
    renderSlide();
  };
  document.addEventListener("keydown", e => {
    if (!$("app").classList.contains("on")) return;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === " ") {
      e.preventDefault();
      state.speaking && !state.paused ? pauseSpeech() : speakCurrent();
    }
  });
}

bind();
const existing = localStorage.getItem("spin_user");
if (existing) showApp(existing);
