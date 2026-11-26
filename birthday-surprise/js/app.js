/* ============================================================
   Birthday Surprise – main script.
   You do NOT need to edit this file. Personalise js/config.js.
   ============================================================ */
(function () {
  "use strict";

  const C = window.BIRTHDAY_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tpl = (s) => String(s || "").replace(/\{friend\}/g, C.friendName || "you").replace(/\{me\}/g, C.yourName || "me");

  /* ---------- Icons (Lucide, bundled locally) ---------- */
  function icon(name) {
    const inner = (window.LUCIDE || {})[name] || "";
    return '<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }
  const renderIcons = (root = document) => $$("[data-icon]", root).forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
  const setIcon = (el, name) => { el.dataset.icon = name; el.innerHTML = icon(name); };

  /* ---------- Personalisation binding ---------- */
  document.title = "Happy Birthday " + (C.friendName || "") + "! 🎀";
  $$("[data-bind]").forEach((el) => { el.textContent = C[el.dataset.bind] || ""; });
  renderIcons();

  /* ============================================================
     FX: confetti + fireworks (single canvas, runs only when needed)
     ============================================================ */
  const FX = (() => {
    const cv = $("#fx"), ctx = cv.getContext("2d");
    let W = 0, H = 0, parts = [], raf = 0;
    const COLORS = ["#ff6fa8", "#ffb6d5", "#cdb4ff", "#8fd3ff", "#ffd3b6", "#ffe36e", "#b58cff", "#ffffff"];
    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    size(); addEventListener("resize", size);
    const scale = reduce ? 0.3 : 1;

    function confetti(x = W / 2, y = H / 2, n = 110, o = {}) {
      n = Math.round(n * scale);
      for (let i = 0; i < n && parts.length < 700; i++) {
        const a = (o.angle ?? -Math.PI / 2) + rand(-1, 1) * (o.spread ?? Math.PI);
        const s = rand(4, o.power ?? 13);
        parts.push({ k: "c", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.22, w: rand(6, 12), h: rand(4, 8),
          r: rand(0, 6), vr: rand(-0.3, 0.3), c: COLORS[(Math.random() * COLORS.length) | 0], life: rand(110, 190), age: 0, heart: Math.random() < 0.18 });
      }
      start();
    }
    function rain(ms = 2500) {
      const end = performance.now() + ms;
      (function tick() {
        if (performance.now() > end) return;
        confetti(rand(0, W), -10, 6, { angle: Math.PI / 2, spread: 0.5, power: 6 });
        setTimeout(tick, 90);
      })();
    }
    function firework(x, y) {
      const c = COLORS[(Math.random() * 6) | 0], n = Math.round(70 * Math.max(scale, 0.4));
      for (let i = 0; i < n && parts.length < 900; i++) {
        const a = (i / n) * Math.PI * 2, s = rand(2, 7.5);
        parts.push({ k: "f", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.07, c, life: rand(55, 95), age: 0 });
      }
      start();
    }
    function fireworks(ms = 5000) {
      const end = performance.now() + ms;
      (function tick() {
        if (performance.now() > end) return;
        firework(rand(W * 0.15, W * 0.85), rand(H * 0.12, H * 0.5));
        setTimeout(tick, rand(250, 600));
      })();
    }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function loop() {
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter((p) => p.age < p.life && p.y < H + 40);
      for (const p of parts) {
        p.age++; p.x += p.vx; p.y += p.vy; p.vy += p.g;
        const t = 1 - p.age / p.life;
        if (p.k === "c") {
          p.vx *= 0.99; p.r += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, t * 2); ctx.fillStyle = p.c;
          if (p.heart) { ctx.font = p.w * 1.6 + "px serif"; ctx.fillText("♥", -p.w / 2, p.w / 2); }
          else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.age / 7)) + 1);
          ctx.restore();
        } else {
          p.vx *= 0.975; p.vy *= 0.975;
          ctx.globalAlpha = Math.max(t, 0); ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * t + 0.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(loop) : (ctx.clearRect(0, 0, W, H), 0);
    }
    return { confetti, rain, firework, fireworks, burstAt: (el, n = 60) => { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, n, { spread: Math.PI, angle: -Math.PI / 2, power: 11 }); } };
  })();

  /* ============================================================
     Floating background (hearts, stars, sparkles) – sprites for speed
     ============================================================ */
  (function bg() {
    const cv = $("#bg"), ctx = cv.getContext("2d");
    let W, H, items = [], running = true;
    const cols = ["#ff9ecb", "#c7a8ff", "#9fd6ff", "#ffc9a3", "#ffffff"];
    function sprite(kind, color) {
      const s = 40, c = document.createElement("canvas"); c.width = c.height = s; const x = c.getContext("2d");
      x.fillStyle = color; x.translate(s / 2, s / 2); x.beginPath();
      if (kind === 0) { x.moveTo(0, 10); x.bezierCurveTo(-22, -4, -10, -20, 0, -8); x.bezierCurveTo(10, -20, 22, -4, 0, 10); }
      else { const sp = kind === 1 ? 5 : 4, ro = 16, ri = kind === 1 ? 7 : 3; for (let i = 0; i < sp * 2; i++) { const r = i % 2 ? ri : ro, a = (i * Math.PI) / sp - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }
      x.closePath(); x.fill(); return c;
    }
    const sprites = []; for (let k = 0; k < 3; k++) cols.forEach((c) => sprites.push(sprite(k, c)));
    function size() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    size(); addEventListener("resize", size);
    const N = innerWidth < 600 ? 18 : 30;
    for (let i = 0; i < N; i++) items.push({ s: sprites[(Math.random() * sprites.length) | 0], x: rand(0, 1), y: rand(0, 1), z: rand(0.4, 1.1), v: rand(0.0003, 0.0009), ph: rand(0, 6), r: rand(0, 6) });
    document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) loop(); });
    function loop(t = 0) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of items) {
        p.y -= p.v; if (p.y < -0.1) { p.y = 1.1; p.x = rand(0, 1); }
        const x = p.x * W + Math.sin(t / 1500 + p.ph) * 22, sz = 26 * p.z;
        ctx.globalAlpha = 0.55; ctx.save(); ctx.translate(x, p.y * H); ctx.rotate(Math.sin(t / 2000 + p.ph) * 0.5 + p.r * 0.1);
        ctx.drawImage(p.s, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ============================================================
     Music: your mp3 (config.music.file) or built-in music-box tune
     ============================================================ */
  const Music = (() => {
    let audio = null, synth = null, on = false, started = false, useSynth = !C.music || !C.music.file;
    const vol = (C.music && C.music.volume) || 0.5;
    // "Happy Birthday" melody (public domain): [midi note, beats]
    const TUNE = [[67,.75],[67,.25],[69,1],[67,1],[72,1],[71,2],[67,.75],[67,.25],[69,1],[67,1],[74,1],[72,2],
      [67,.75],[67,.25],[79,1],[76,1],[72,1],[71,1],[69,2],[77,.75],[77,.25],[76,1],[72,1],[74,1],[72,2],[0,2]];
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function makeSynth() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      const ctx = new AC(), master = ctx.createGain(); master.gain.value = vol * 0.35; master.connect(ctx.destination);
      const beat = 0.5; let i = 0, next = ctx.currentTime + 0.1, timer = 0;
      function note(m, t, d) {
        if (!m) return;
        [[1, 0.9], [2, 0.25], [3, 0.08]].forEach(([mult, g]) => {
          const o = ctx.createOscillator(), e = ctx.createGain(); o.type = "sine"; o.frequency.value = hz(m) * mult;
          e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0008, t + d * 1.8 + 0.4);
          o.connect(e); e.connect(master); o.start(t); o.stop(t + d * 1.8 + 0.5);
        });
        // soft low pad note for warmth
        const p = ctx.createOscillator(), pg = ctx.createGain(); p.type = "triangle"; p.frequency.value = hz(m) / 2;
        pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(0.18, t + 0.05); pg.gain.exponentialRampToValueAtTime(0.0008, t + d + 0.3);
        p.connect(pg); pg.connect(master); p.start(t); p.stop(t + d + 0.4);
      }
      function pump() { while (next < ctx.currentTime + 0.6) { const [m, b] = TUNE[i]; note(m, next, b * beat); next += b * beat; i = (i + 1) % TUNE.length; } }
      return { ctx, play() { ctx.resume(); next = Math.max(next, ctx.currentTime + 0.05); clearInterval(timer); timer = setInterval(pump, 150); pump(); },
        pause() { clearInterval(timer); ctx.suspend(); } };
    }
    function playFile() {
      if (!audio) {
        audio = new Audio(C.music.file); audio.loop = true; audio.volume = vol;
        audio.addEventListener("error", () => { useSynth = true; audio = null; if (on) playSynth(); });
      }
      const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { useSynth = true; audio = null; if (on) playSynth(); });
    }
    function playSynth() { synth = synth || makeSynth(); if (synth) synth.play(); }
    function ui() {
      $("#musicBtn").classList.toggle("on", on);
      setIcon($("#musicIcon"), on ? "volume-2" : "volume-x");
      setIcon($("#musicIcon2"), on ? "pause" : "play");
      $("#musicLabel").textContent = on ? "Pause music" : "Play music";
    }
    return {
      start() { if (started) return; started = true; this.set(true); },
      set(v) { on = v; started = true; if (on) { useSynth ? playSynth() : playFile(); } else { if (audio) audio.pause(); if (synth) synth.pause(); } ui(); },
      toggle() { this.set(!on); }
    };
  })();
  ["#musicBtn", "#musicBtn2"].forEach((s) => $(s).addEventListener("click", () => Music.toggle()));

  /* ============================================================
     Progress + toast
     ============================================================ */
  const GOALS = 7, done = new Set();
  let toastT = 0;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
  function mark(k) {
    if (done.has(k)) return; done.add(k);
    $("#pCount").textContent = done.size + "/" + GOALS; $("#pFill").style.width = (done.size / GOALS) * 100 + "%";
    toast(done.size === GOALS ? "🎉 You found every surprise!" : "✨ Surprise " + done.size + " of " + GOALS + " discovered");
  }

  /* ---------- scroll reveal + "keep going" buttons ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
  const observeReveals = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  $$("[data-next]").forEach((b) => b.addEventListener("click", () => { const t = $(b.dataset.next); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }));

  /* split text into animated letters */
  function splitLetters(el, text, cls) {
    el.textContent = ""; let i = 0;
    text.split(" ").forEach((word) => {
      const w = document.createElement("span"); w.className = "w";
      Array.from(word).forEach((ch) => {
        const s = document.createElement("span"); s.textContent = ch; s.className = "l";
        s.style.setProperty("--i", i); if (cls === "in") s.style.animationDelay = 0.35 + i * 0.06 + "s"; w.appendChild(s); i++;
      });
      el.appendChild(w);
    });
  }
  splitLetters($("#welcomeTitle"), "Heyyy Birthday Star! 🎀", "in");
  splitLetters($("#megaTitle"), "HAPPY BIRTHDAYYYYY! 🎂");

  /* ============================================================
     1. Welcome → gift opening
     ============================================================ */
  let opening = false;
  async function openGift() {
    if (opening) return; opening = true;
    $("#openBtn").disabled = true;
    Music.start();
    $("#giftBtn").classList.add("open");
    await sleep(500);
    FX.burstAt($("#giftBtn"), 140); FX.rain(1800);
    mark("gift");
    await sleep(1300);
    $("#welcome").classList.add("leaving");
    await sleep(800);
    $("#welcome").hidden = true;
    $("#journey").hidden = false; $("#hud").hidden = false;
    $("#journey").classList.add("enter");
    scrollTo(0, 0); observeReveals(); Balloons.spawn();
    FX.confetti(innerWidth / 2, innerHeight * 0.3, 120);
  }
  $("#giftBtn").addEventListener("click", openGift);
  $("#openBtn").addEventListener("click", openGift);

  /* ============================================================
     2. Birthday: balloons + cake + candles
     ============================================================ */
  const Balloons = {
    spawn() {
      const box = $("#balloons"); box.innerHTML = "";
      const cols = ["#ffb6d5", "#cdb4ff", "#b8e0ff", "#ffd3b6", "#ff9ecb", "#e8d9ff"]; const n = innerWidth < 600 ? 7 : 13;
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i"); b.className = "balloon";
        b.style.cssText = "left:" + rand(0, 94) + "%;--s:" + rand(44, 74) + "px;--c:" + cols[i % cols.length] + ";--d:" + rand(11, 20) + "s;--delay:" + -rand(0, 18) + "s";
        b.addEventListener("click", () => { FX.burstAt(b, 30); b.style.visibility = "hidden"; setTimeout(() => (b.style.visibility = ""), 4000); });
        box.appendChild(b);
      }
    }
  };
  const candleG = $("#candles"), SVGNS = "http://www.w3.org/2000/svg", candleX = [88, 109, 130, 151, 172], candleCol = ["#ff9ecb", "#8fd3ff", "#ffe36e", "#c7a8ff", "#ffb88a"];
  candleX.forEach((x, i) => {
    const g = document.createElementNS(SVGNS, "g");
    g.innerHTML = '<rect x="' + (x - 4) + '" y="76" width="8" height="38" rx="3" fill="' + candleCol[i] + '"/><rect x="' + (x - 4) + '" y="86" width="8" height="4" fill="#fff" opacity=".6"/><rect x="' + (x - 4) + '" y="98" width="8" height="4" fill="#fff" opacity=".6"/>' +
      '<g transform="translate(' + x + ' 66)"><circle class="halo" r="20" fill="url(#halo)"/><g class="flame"><path d="M0-15C7-6 7 2 0 5C-7 2-7-6 0-15Z" fill="#ffb347"/><path d="M0-8C3-3 3 1 0 3C-3 1-3-3 0-8Z" fill="#fff6c8"/></g>' +
      '<circle class="smoke" style="--i:' + i + '" r="6" fill="#d9cfe6"/></g>';
    candleG.appendChild(g);
  });
  let blown = false;
  $("#blowBtn").addEventListener("click", async () => {
    if (blown) { // relight
      blown = false; $("#cake").classList.remove("out"); $("#wishCard").hidden = true; $("#blowBtn").innerHTML = icon("wind") + " BLOW THE CANDLES 🕯️"; return;
    }
    blown = true; $("#cake").classList.add("out"); $("#blowBtn").disabled = true;
    await sleep(700);
    FX.burstAt($("#cake"), 120); FX.rain(1500);
    $("#wishTitle").textContent = tpl(C.candleWishTitle); $("#wishText").textContent = tpl(C.candleWish);
    $("#wishCard").hidden = false; $("#wishCard").scrollIntoView({ behavior: "smooth", block: "center" });
    $("#blowBtn").disabled = false; $("#blowBtn").innerHTML = icon("flame") + " RELIGHT THE CANDLES";
    mark("candles");
  });

  /* ============================================================
     3. Letter + typing animation
     ============================================================ */
  let typeToken = 0, letterOpen = false;
  $("#letterTitle").textContent = tpl(C.letterTitle);
  $(".env-paper span").textContent = "For " + (C.friendName || "you") + " 💌";
  async function typeText(el, text, token) {
    el.textContent = ""; el.classList.add("caret");
    const chars = Array.from(text); let skip = false;
    const skipFn = () => (skip = true); $("#letterPaper").addEventListener("click", skipFn, { once: true });
    for (let i = 0; i < chars.length; i++) {
      if (token !== typeToken) return;
      el.textContent += chars[i];
      if (!skip) await sleep(/[.!?\n]/.test(chars[i]) ? 220 : 26);
      else if (i % 12 === 0) await sleep(0);
    }
    el.classList.remove("caret");
  }
  $("#letterBtn").addEventListener("click", async () => {
    if (letterOpen) return; letterOpen = true; $("#letterBtn").disabled = true;
    const token = ++typeToken;
    $("#envelope").classList.add("open"); FX.burstAt($("#envelope"), 40);
    await sleep(1700);
    if (token !== typeToken) return;
    $("#envelope").classList.add("gone"); await sleep(700);
    $("#letterBtn").hidden = true; $("#letterPaper").hidden = false;
    $("#letterPaper").scrollIntoView({ behavior: "smooth", block: "center" });
    await typeText($("#letterText"), tpl(C.letter), token);
    if (token !== typeToken) return;
    $("#letterSign").textContent = tpl(C.letterSign || C.closingSign); $("#letterSign").classList.add("show");
    FX.confetti(innerWidth / 2, innerHeight * 0.6, 50); mark("letter");
  });

  /* ============================================================
     4. Gallery + lightbox
     ============================================================ */
  const photos = C.photos || [];
  const gal = $("#gallery");
  photos.forEach((p, i) => {
    const fig = document.createElement("button"); fig.className = "polaroid reveal"; fig.type = "button";
    fig.style.setProperty("--r", ((i % 2 ? 1 : -1) * rand(1, 3.5)).toFixed(1) + "deg"); fig.style.transitionDelay = (i % 3) * 0.12 + "s";
    const img = new Image(); img.src = p.src; img.alt = p.caption || "Our photo"; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", () => { const ph = document.createElement("div"); ph.className = "ph"; ph.textContent = "📷"; img.replaceWith(ph); });
    const cap = document.createElement("figcaption"); cap.textContent = p.caption || "";
    fig.append(img, cap); fig.addEventListener("click", () => openLB(i)); gal.appendChild(fig);
  });
  const lb = $("#lightbox"); let li = 0;
  function showLB() {
    const p = photos[li]; const img = $("#lbImg");
    img.style.animation = "none"; void img.offsetWidth; img.style.animation = ""; img.src = p.src; img.alt = p.caption || "";
    $("#lbCap").textContent = p.caption || ""; $("#lbCount").textContent = li + 1 + " / " + photos.length;
  }
  function openLB(i) { li = i; showLB(); lb.hidden = false; document.body.style.overflow = "hidden"; mark("gallery"); }
  function closeLB() { lb.hidden = true; document.body.style.overflow = ""; }
  const step = (d) => { li = (li + d + photos.length) % photos.length; showLB(); };
  $("#lbClose").addEventListener("click", closeLB);
  $("#lbPrev").addEventListener("click", () => step(-1)); $("#lbNext").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") closeLB(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
  let tx = 0; lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) step(d < 0 ? 1 : -1); }, { passive: true });
  if (!photos.length) $("#memories").hidden = true;

  /* ============================================================
     5. Reasons (flip cards)
     ============================================================ */
  const reasons = C.reasons || [];
  $("#flipTotal").textContent = reasons.length;
  const flipped = new Set();
  reasons.forEach((r, i) => {
    const card = document.createElement("button"); card.type = "button"; card.className = "rcard reveal"; card.style.transitionDelay = (i % 4) * 0.1 + "s";
    card.setAttribute("aria-label", "Reveal reason " + (i + 1));
    card.innerHTML = '<div class="rinner"><div class="rface rfront"><span class="heart">' + icon("heart") + "</span><b>Reason #" + (i + 1) + "</b><small>tap me ✨</small></div>" +
      '<div class="rface rback"><h4></h4><p></p></div></div>';
    $("h4", card).textContent = tpl(r.title); $("p", card).textContent = tpl(r.text);
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      if (card.classList.contains("flipped")) { flipped.add(i); FX.burstAt(card, 16); }
      $("#flipCount").textContent = flipped.size;
      if (flipped.size >= Math.min(reasons.length, 6)) mark("reasons");
    });
    $("#reasons").appendChild(card);
  });

  /* ============================================================
     6. Memory game
     ============================================================ */
  const EMOJI = ["🎂", "🎈", "🎁", "🎀", "🧁", "🌸", "🎉", "⭐"];
  const G = { first: null, lock: false, moves: 0, pairs: 0, misses: 0, best: null };
  try { G.best = JSON.parse(localStorage.getItem("bday-best")); } catch (e) { G.best = null; }
  const score = () => Math.max(0, G.pairs * 100 - G.misses * 10);
  function gameUI() { $("#gScore").textContent = score(); $("#gPairs").textContent = G.pairs + "/" + EMOJI.length; $("#gMoves").textContent = G.moves; $("#gBest").textContent = G.best == null ? "–" : G.best; }
  function newGame() {
    Object.assign(G, { first: null, lock: false, moves: 0, pairs: 0, misses: 0 }); $("#gMsg").textContent = "";
    const deck = EMOJI.concat(EMOJI).sort(() => Math.random() - 0.5); const board = $("#board"); board.innerHTML = "";
    deck.forEach((e) => {
      const t = document.createElement("button"); t.type = "button"; t.className = "tile"; t.dataset.e = e; t.setAttribute("aria-label", "Hidden card");
      t.innerHTML = '<span><i class="f">' + icon("heart") + '</i><i class="b">' + e + "</i></span>"; t.addEventListener("click", () => flip(t)); board.appendChild(t);
    });
    gameUI();
  }
  async function flip(t) {
    if (G.lock || t.classList.contains("on")) return; t.classList.add("on");
    if (!G.first) { G.first = t; return; }
    const a = G.first; G.first = null; G.moves++;
    if (a.dataset.e === t.dataset.e) {
      G.pairs++; a.classList.add("match"); t.classList.add("match"); FX.burstAt(t, 14); $("#gMsg").textContent = "Nice match! 💖";
      if (G.pairs === EMOJI.length) {
        const s = score(); if (G.best == null || s > G.best) { G.best = s; try { localStorage.setItem("bday-best", JSON.stringify(s)); } catch (e) {} }
        $("#gMsg").textContent = "You won in " + G.moves + " moves! 🏆"; FX.confetti(innerWidth / 2, innerHeight * 0.5, 160); mark("game");
      }
    } else {
      G.lock = true; G.misses++; $("#gMsg").textContent = "Oops, try again 💭"; await sleep(800); a.classList.remove("on"); t.classList.remove("on"); G.lock = false;
    }
    gameUI();
  }
  $("#restartBtn").addEventListener("click", newGame); newGame();

  /* ============================================================
     7. Secret surprise
     ============================================================ */
  let unlocked = false;
  $("#secretTitle").textContent = tpl(C.secretTitle); $("#secretMsg").textContent = tpl(C.secretMessage);
  (C.memories || []).forEach((m, i) => {
    const d = document.createElement("div"); d.className = "mem"; d.style.setProperty("--i", i);
    d.innerHTML = "<em></em><b></b><span></span>"; d.children[0].textContent = m.emoji || "💗"; d.children[1].textContent = tpl(m.title); d.children[2].textContent = tpl(m.text); $("#memGrid").appendChild(d);
  });
  $("#lbLock").addEventListener("click", () => { if (!unlocked) { $("#lockbox").classList.remove("shake"); void $("#lockbox").offsetWidth; $("#lockbox").classList.add("shake"); } });
  $("#unlockBtn").addEventListener("click", async () => {
    if (unlocked) return; unlocked = true; $("#unlockBtn").disabled = true;
    $("#lockbox").classList.add("shake"); await sleep(600);
    $("#lockbox").classList.remove("shake"); $("#lockbox").classList.add("open"); $("#secretHint").textContent = "✨ Unlocked! ✨";
    FX.fireworks(6000); FX.rain(3000); await sleep(1200);
    $("#unlockBtn").hidden = true; $("#finalCard").hidden = false; $("#finalCard").scrollIntoView({ behavior: "smooth", block: "center" }); mark("secret");
  });

  /* ============================================================
     8. Finale + replay
     ============================================================ */
  $("#closingMsg").textContent = tpl(C.closingMessage); $("#closingSign").textContent = tpl(C.closingSign);
  const stars = $(".stars"); for (let i = 0; i < 28; i++) { const s = document.createElement("i"); s.style.cssText = "left:" + rand(0, 100) + "%;top:" + rand(0, 100) + "%;--d:" + rand(2, 5) + "s;--dl:" + -rand(0, 4) + "s"; stars.appendChild(s); }
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !e.target.dataset.fired) { e.target.dataset.fired = 1; FX.confetti(innerWidth / 2, innerHeight * 0.4, 90); FX.rain(1500); } }), { threshold: 0.5 }).observe($("#finale"));

  $("#replayBtn").addEventListener("click", async () => {
    typeToken++; letterOpen = false; blown = false; unlocked = false; opening = false;
    done.clear(); flipped.clear(); $("#pCount").textContent = "0/" + GOALS; $("#pFill").style.width = "0";
    $("#cake").classList.remove("out"); $("#wishCard").hidden = true; $("#blowBtn").disabled = false; $("#blowBtn").innerHTML = icon("wind") + " BLOW THE CANDLES 🕯️";
    $("#envelope").classList.remove("open", "gone"); $("#letterPaper").hidden = true; $("#letterBtn").hidden = false; $("#letterBtn").disabled = false;
    $("#letterText").textContent = ""; $("#letterSign").classList.remove("show");
    $$(".rcard").forEach((c) => c.classList.remove("flipped")); $("#flipCount").textContent = 0;
    newGame();
    $("#lockbox").classList.remove("open", "shake"); $("#finalCard").hidden = true; $("#unlockBtn").hidden = false; $("#unlockBtn").disabled = false; $("#secretHint").textContent = "There is one more surprise...";
    $("#giftBtn").classList.remove("open"); $("#openBtn").disabled = false; $("#journey").classList.remove("enter");
    FX.confetti(innerWidth / 2, innerHeight / 2, 80);
    $("#welcome").hidden = false; $("#welcome").classList.add("leaving");
    $("#journey").hidden = true; $("#hud").hidden = true; scrollTo(0, 0);
    await sleep(60); $("#welcome").classList.remove("leaving");
  });

  /* ============================================================
     Custom cursor (desktop / fine pointers only)
     ============================================================ */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
    document.body.classList.add("has-cursor");
    const dot = $(".cursor-dot"), ring = $(".cursor-ring"); let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, last = 0;
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY; dot.style.transform = "translate(" + mx + "px," + my + "px)";
      const n = performance.now(); if (n - last > 70) {
        last = n; const s = document.createElement("span"); s.className = "trail"; s.textContent = ["✨", "💗", "⭐", "🌸"][(Math.random() * 4) | 0];
        s.style.left = mx + "px"; s.style.top = my + "px"; s.style.setProperty("--dx", rand(-20, 20) + "px"); document.body.appendChild(s); setTimeout(() => s.remove(), 900);
      }
    });
    (function follow() { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = "translate(" + rx + "px," + ry + "px)"; requestAnimationFrame(follow); })();
    document.addEventListener("mouseover", (e) => ring.classList.toggle("hover", !!e.target.closest("button,a,.balloon,.polaroid")));
    addEventListener("mousedown", (e) => FX.confetti(e.clientX, e.clientY, 8, { spread: Math.PI, power: 6 }));
  }

  /* ============================================================
     Loading screen
     ============================================================ */
  (function load() {
    const fill = $("#loaderFill"); let p = 0;
    const t = setInterval(() => { p = Math.min(p + rand(8, 18), 92); fill.style.width = p + "%"; }, 180);
    const fin = () => {
      clearInterval(t); fill.style.width = "100%";
      setTimeout(() => { $("#loader").classList.add("done"); document.body.classList.remove("is-loading"); }, 450);
    };
    const minWait = sleep(1500);
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([minWait, ready, new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))]).then(fin);
  })();
})();
