(function () {
  "use strict";
  var root = document.documentElement;
  try { history.scrollRestoration = "manual"; } catch (e) {}
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = matchMedia("(pointer: coarse)").matches;
  var hasG = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasG) gsap.registerPlugin(ScrollTrigger);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var on = function (el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); };

  /* ---------- theme and palette ---------- */
  var grid = null;
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function themeColor() { var m = $('meta[name="theme-color"]'); if (m) m.setAttribute("content", cssVar("--bg")); }
  on($("#themeBtn"), "click", function () {
    var next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    themeColor(); if (grid) grid.refresh();
  });
  themeColor();

  /* ---------- hero grid of "checks" (canvas) ---------- */
  (function () {
    var canvas = $("#grid"); if (!canvas) return;
    var ctx = canvas.getContext("2d"), hero = canvas.parentElement;
    var cell = 36, cols = 0, rows = 0, w = 0, h = 0, lv = null, running = false, visible = true, raf = 0;
    var mouse = { x: -999, y: -999 }, sweep = -1, sweepAt = 1400, col = { a: "#0e5159", b: "#ff5a4e" };
    function refresh() { col.a = cssVar("--brand"); col.b = cssVar("--acc"); if (reduce) draw(); }
    function size() {
      var r = hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cell = w < 700 ? 28 : 36;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / cell); rows = Math.ceil(h / cell); lv = new Float32Array(cols * rows);
      if (reduce) { for (var i = 0; i < lv.length; i++) if (Math.random() < 0.06) lv[i] = 0.3 + Math.random() * 0.5; draw(); }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = col.a; ctx.globalAlpha = 0.16;
      for (var y = 0; y <= rows; y++) for (var x = 0; x <= cols; x++) ctx.fillRect(x * cell, y * cell, 1.5, 1.5);
      for (var j = 0; j < lv.length; j++) {
        var l = lv[j]; if (l <= 0.02) continue;
        ctx.fillStyle = l > 0.8 ? col.b : col.a;
        ctx.globalAlpha = Math.min(l, 1) * (l > 0.8 ? 0.55 : 0.28);
        ctx.fillRect((j % cols) * cell + 3, ((j / cols) | 0) * cell + 3, cell - 6, cell - 6);
      }
      ctx.globalAlpha = 1;
    }
    function tick(t) {
      if (!running) return;
      var i, c, r;
      for (i = 0; i < lv.length; i++) if (lv[i] > 0) lv[i] *= 0.94;
      for (i = 0; i < 2; i++) lv[(Math.random() * lv.length) | 0] = 0.5 + Math.random() * 0.5;
      if (mouse.x > -900) {
        var mc = mouse.x / cell, mr = mouse.y / cell;
        for (r = Math.max(0, (mr - 4) | 0); r < Math.min(rows, mr + 5); r++)
          for (c = Math.max(0, (mc - 4) | 0); c < Math.min(cols, mc + 5); c++) {
            var d = Math.hypot(c + 0.5 - mc, r + 0.5 - mr);
            if (d < 4) { var k = 1 - d / 4, idx = r * cols + c; if (lv[idx] < k) lv[idx] = k; }
          }
      }
      if (sweep < 0 && t > sweepAt) sweep = 0;
      if (sweep >= 0) {
        var cc = sweep | 0;
        if (cc < cols) { for (r = 0; r < rows; r++) if (Math.random() < 0.5) lv[r * cols + cc] = 0.95; sweep += 0.8; }
        else { sweep = -1; sweepAt = t + 6500; }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function start() { if (running || reduce || !visible) return; running = true; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    on(hero, "pointermove", function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    on(hero, "pointerleave", function () { mouse.x = mouse.y = -999; });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    var rt; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { size(); start(); }, 120); }).observe(hero);
    refresh(); size(); start();
    grid = { refresh: refresh };
  })();

  /* ---------- intro: the logo assembles, then flies into the nav while a tile wall clears ---------- */
  function intro() {
    var boot = $("#boot"); if (boot) boot.style.display = "none";
    var mk = $("#navMark"); if (mk) mk.classList.remove("pending");
    if (!hasG || reduce) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".hero-copy .eyebrow", { opacity: 1, y: 0, duration: 0.7 })
      .to(".ln-in", { y: 0, duration: 1.1, stagger: 0.12 }, "-=0.5")
      .to(".hero-sub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .to(".hero-cta", { opacity: 1, y: 0, duration: 0.8 }, "-=0.65")
      .to(".portrait", { opacity: 1, y: 0, scale: 1, duration: 1.2 }, "-=1.1");
  }
  (function () {
    var boot = $("#boot"), seen = false;
    try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
    if (!boot || !hasG || reduce || seen) { intro(); return; }
    var mk = $("#navMark"); if (mk) mk.classList.add("pending");
    var wall = $("#bootGrid"), logo = $("#bootLogo");
    var cols = innerWidth < 700 ? 8 : 16, tile = Math.ceil(innerWidth / cols), rows = Math.ceil(innerHeight / tile);
    wall.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)"; wall.style.gridAutoRows = tile + "px";
    var tiles = [];
    for (var i = 0; i < cols * rows; i++) { var t = document.createElement("i"); wall.appendChild(t); tiles.push(t); }
    gsap.set(logo, { xPercent: -50, yPercent: -50, left: "50%", top: "50%", transform: "none" });
    gsap.set($$(".lg-br", logo), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set($$(".lg-d", logo), { scale: 0, opacity: 0 });
    gsap.set($(".lg-m", logo), { x: -26, opacity: 0 });
    gsap.set($(".lg-a", logo), { x: 26, opacity: 0 });
    var done = function () { try { sessionStorage.setItem("booted", "1"); } catch (e) {} intro(); };
    var tl = gsap.timeline({ onComplete: done });
    tl.to($$(".lg-br", logo), { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.04 }, 0)
      .to($(".lg-m", logo), { x: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0.25)
      .to($(".lg-a", logo), { x: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0.38)
      .to($$(".lg-d", logo), { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)", stagger: 0.05 }, 0.7)
      .add(function () {
        var r = logo.getBoundingClientRect(), n = mk ? mk.getBoundingClientRect() : null;
        var spread = { amount: 0.55, from: "center", grid: [rows, cols] };
        gsap.to(tiles, { opacity: 0, scale: 0.4, duration: 0.5, ease: "power2.in", stagger: spread });
        if (n) {
          var tx = (n.left + n.width / 2) - (r.left + r.width / 2), ty = (n.top + n.height / 2) - (r.top + r.height / 2);
          gsap.to(logo, { x: tx, y: ty, scale: n.width / r.width, duration: 0.85, ease: "power3.inOut",
            "--lg-m": cssVar("--brand"), "--lg-l": cssVar("--brand") });
        }
      }, "+=0.55")
      .to(boot, { opacity: 0, duration: 0.25 }, ">+0.7");
  })();

  /* ---------- scroll progress ---------- */
  if (hasG && !reduce) {
    gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  }

  /* ---------- magnetic buttons ---------- */
  if (hasG && !reduce && !coarse) {
    $$("[data-magnet]").forEach(function (b) {
      var xT = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3" }), yT = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3" });
      on(b, "pointermove", function (e) { var r = b.getBoundingClientRect(); xT((e.clientX - (r.left + r.width / 2)) * 0.22); yT((e.clientY - (r.top + r.height / 2)) * 0.3); });
      on(b, "pointerleave", function () { xT(0); yT(0); });
    });
  }

  /* ---------- tilt cards ---------- */
  if (!reduce && !coarse) {
    $$("[data-tilt]").forEach(function (c) {
      on(c, "pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty("--ry", (x * 6).toFixed(2) + "deg"); c.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      });
      on(c, "pointerleave", function () { c.style.setProperty("--ry", "0deg"); c.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ---------- reveal on scroll ---------- */
  (function () {
    var els = $$(".bento .cell, .exp-list li, .entry, .proj, .sg, .step, .show-left, .devices, .verify, .award, .h2, .lede");
    els.forEach(function (e) { e.classList.add("reveal"); });
    if (!("IntersectionObserver" in window) || reduce) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- skill chips pop in one by one ---------- */
  (function () {
    var groups = $$(".chips");
    if (!hasG || reduce) { groups.forEach(function (g) { $$(".chip", g).forEach(function (c) { c.style.opacity = 1; c.style.transform = "none"; }); }); return; }
    groups.forEach(function (g) {
      gsap.to($$(".chip", g), { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)", stagger: 0.06, scrollTrigger: { trigger: g, start: "top 90%", once: true } });
    });
  })();

  /* ---------- ticker: the one marquee ---------- */
  (function () {
    var track = $("#track"); if (!track) return;
    var belt = $(".belt", track), clone = belt.cloneNode(true);
    clone.setAttribute("aria-hidden", "true"); track.appendChild(clone);
  })();

  /* ---------- statement: words light up as you scroll ---------- */
  (function () {
    var p = $("#state"); if (!p) return;
    var words = p.textContent.trim().split(/\s+/); p.textContent = "";
    var spans = words.map(function (w, i) {
      var s = document.createElement("span"); s.className = "w"; s.textContent = w; p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(" ")); return s;
    });
    if (!hasG || reduce) { spans.forEach(function (s) { s.style.opacity = 1; }); return; }
    gsap.to(spans, { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true } });
  })();

  /* ---------- count-up numbers ---------- */
  if (hasG && !reduce) {
    $$("[data-count]").forEach(function (el) {
      var target = parseFloat(el.dataset.count), o = { v: 0 }; el.textContent = "0";
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () {
        gsap.to(o, { v: target, duration: 1.6, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
    });
  }

  /* ---------- AI tester: steps play on their own when in view (no scroll pinning, so no lag) ---------- */
  (function () {
    var steps = $$(".step"), wires = $$(".wire"), nodes = $$(".node"), pulse = $("#pulse"), box = $(".agent-grid");
    if (!steps.length) return;
    var pos = [[0, 0], [0, -90], [90, 0], [0, 90], [-90, 0]], cur = -1, timer = 0, seen = false, hold = false, user = 0;
    function set(i, play) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); s.classList.remove("run"); });
      if (play) { void steps[i].offsetWidth; steps[i].classList.add("run"); }
      nodes.forEach(function (n) { var id = n.dataset.n; n.classList.toggle("on", id === "core" || parseInt(id, 10) <= i); });
      wires.forEach(function (w) { w.classList.toggle("on", parseInt(w.dataset.w, 10) < i); });
      pulse.style.opacity = i === 0 ? 0 : 1;
      pulse.style.transform = "translate(" + pos[i][0] + "px," + pos[i][1] + "px)";
    }
    function loop() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { if (seen && !hold && Date.now() - user > 7000) set((cur + 1) % steps.length, true); }, 3200);
    }
    steps.forEach(function (s, k) {
      on(s, "click", function () { user = Date.now(); set(k, false); });
      on(s, "focus", function () { user = Date.now(); set(k, false); });
      s.setAttribute("tabindex", "0");
    });
    on(box, "pointerenter", function () { hold = true; }); on(box, "pointerleave", function () { hold = false; });
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen && cur === 0) steps[0].classList.add("run"); }, { threshold: 0.35 }).observe(box);
    set(0, false);
    if (reduce) { set(steps.length - 1, false); return; }
    loop();
  })();

  /* ---------- Switch screens: phone + browser slideshow ---------- */
  (function () {
    var S = [
      ["open", "Open the door", "A clean start. One tap and you are in.", ["Sign in with Google", "No long forms to get started"]],
      ["dashboard", "Your day at a glance", "New matches, applications in progress and your best opportunities.", ["Jobs found, new today, pursuing and top score", "The strongest matches come first"]],
      ["jobs", "Every job found", "Postings from email alerts, company pages and job boards in one list.", ["Filter by new, pursuing, skipped or watching", "Search by role or company"]],
      ["triage", "Pursue or skip", "Review new jobs one by one. Every card shows why it matches.", ["One tap to pursue or skip, with undo", "Separate tabs for new, watched and reviewed"]],
      ["detail", "Why it matches", "The role, the requirements and an honest match score.", ["The reasons behind every score", "Tabs for company, contacts, documents and chat"]],
      ["apply", "Application ready", "A tailored resume, cover letter and answers, ready to send.", ["Documents tailored to each role", "It never submits anything for you"]],
      ["tracker", "Track every application", "From applied to interview to offer, nothing gets lost.", ["Every stage in one place", "A follow-up date on each card"]],
      ["followups", "Follow-ups", "Reminders and drafted messages so no reply is forgotten.", ["Due today, upcoming and done", "A draft message in one tap"]],
      ["interviews", "Interview prep", "Practice questions and a prep checklist for each interview.", ["Upcoming and past interviews", "Mock interview and tips"]],
      ["analytics", "What is working", "Trends in your search, where jobs come from and how matches score.", ["Search activity over time", "Which sources bring the best jobs"]],
      ["contacts", "People who can help", "Recruiters and hiring managers at the companies you want.", ["Contacts grouped by company", "Who you last spoke to and when"]],
      ["assistant", "Ask the assistant", "Ask anything about your search in plain language.", ["Suggested questions to start", "Answers based on your own data"]],
      ["sources", "Source health", "Check that every job source is running and finding jobs.", ["Email alerts, job boards and manual adds", "A health status for each source"]]
    ];
    var screen = $("#screen"), bw = $("#bw"), dots = $("#dots"); if (!screen) return;
    var track = document.createElement("div"); track.className = "bw-track"; bw.appendChild(track);
    var dotBtns = [], pImgs = [], bImgs = [], cur = 0, timer = 0, idleTimer = 0, userHold = false, inView = false;
    S.forEach(function (s, i) {
      var d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Screen " + (i + 1) + ": " + s[1]);
      d.addEventListener("click", function () { go(i, true); }); dots.appendChild(d); dotBtns.push(d);
      var p = new Image(); p.src = "switch/img/" + s[0] + ".webp"; p.alt = ""; p.width = 720; p.height = 1680; p.loading = i < 2 ? "eager" : "lazy"; screen.appendChild(p); pImgs.push(p);
      var q = new Image(); q.src = p.src; q.alt = ""; q.loading = "lazy"; q.addEventListener("click", function () { go(i, true); }); track.appendChild(q); bImgs.push(q);
    });
    function place() {
      var tile = bImgs[0].offsetWidth || 120, gap = 14, W = bw.clientWidth;
      track.style.transform = "translateX(" + (W / 2 - (cur * (tile + gap) + tile / 2)) + "px)";
    }
    function go(i, byUser) {
      cur = (i + S.length) % S.length;
      dotBtns.forEach(function (b, k) { if (k === cur) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      pImgs.forEach(function (m, k) { m.classList.toggle("on", k === cur); });
      bImgs.forEach(function (m, k) { m.classList.toggle("on", k === cur); });
      $("#capK").textContent = "Screen " + (cur + 1) + " of " + S.length;
      $("#capT").textContent = S[cur][1]; $("#capD").textContent = S[cur][2];
      $("#capP").innerHTML = S[cur][3].map(function (t) { return "<li>" + t + "</li>"; }).join("");
      if (!reduce) { [$("#capT"), $("#capD"), $("#capP")].forEach(function (el) { el.classList.remove("cap-anim"); void el.offsetWidth; el.classList.add("cap-anim"); }); }
      place();
      if (byUser) { userHold = true; clearTimeout(idleTimer); idleTimer = setTimeout(function () { userHold = false; }, 9000); }
    }
    function loop() { clearInterval(timer); if (reduce) return; timer = setInterval(function () { if (inView && !userHold) go(cur + 1); }, 3600); }
    var show = $("#show");
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.25 }).observe(show);
    on(show, "pointerenter", function () { userHold = true; });
    on(show, "pointerleave", function () { clearTimeout(idleTimer); idleTimer = setTimeout(function () { userHold = false; }, 1500); });
    on($("#prev"), "click", function () { go(cur - 1, true); });
    on($("#next"), "click", function () { go(cur + 1, true); });
    var sx = 0; on($(".phone"), "pointerdown", function (e) { sx = e.clientX; });
    on($(".phone"), "pointerup", function (e) { var d = e.clientX - sx; if (Math.abs(d) > 40) go(cur + (d < 0 ? 1 : -1), true); });
    on(window, "resize", place); on(window, "load", place);
    go(0); loop();
  })();

  /* ---------- certificates: fan opens as you arrive, click to enlarge ---------- */
  (function () {
    var deck = $("#deck"), cards = $$(".card", deck);
    if (hasG && !reduce) {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 861px)", function () {
        gsap.timeline({ scrollTrigger: { trigger: deck, start: "top 85%", end: "top 30%", scrub: 0.6 } })
          .to(cards[0], { "--x": "-72%", "--y": "-46%", "--r": "-10deg" }, 0)
          .to(cards[1], { "--y": "-54%", "--r": "0deg" }, 0)
          .to(cards[2], { "--x": "-28%", "--y": "-58%", "--r": "10deg" }, 0);
      });
    }
    var dlg = $("#lightbox"), img = $("#lbImg"), cap = $("#lbCap");
    cards.forEach(function (c) {
      on(c, "click", function () {
        img.src = c.dataset.full; img.alt = c.querySelector("img").alt; cap.textContent = c.dataset.title;
        if (dlg.showModal) dlg.showModal(); else window.open(c.dataset.full, "_blank");
      });
    });
    on(dlg, "click", function (e) { if (e.target === dlg) dlg.close(); });
  })();

  /* ---------- open-mic photos: one small framed viewer with smooth cross-fades ---------- */
  (function () {
    var P = [
      ["kalakar", "Kalakar", "Mayank leaning on a wall beneath a painted sign that reads Kalakar"],
      ["tape-a-tale", "Abhinay at GHAR", "Mayank reading from a notebook on stage, beside a Tape A Tale sign"],
      ["sahitya-tak", "Sahitya Tak, Mike Ke Laal", "Mayank performing on stage at the Sahitya Tak event Mike Ke Laal"],
      ["red-curtain", "Red curtain set", "Mayank speaking into a microphone in front of a red curtain"],
      ["black-white", "Open Mic - Tape a Tale", "Black and white photo of Mayank seated on a stool, performing"],
      ["spotlight", "Under the spotlight", "Close-up of Mayank speaking into a microphone under stage lights"],
      ["with-performers", "At an event", "Mayank posing with three people in front of a bright poster at an event"],
      ["with-poet", "With Shayar - Azhar Iqbal", "Mayank with shayar Azhar Iqbal at a literary event"],
      ["aajtak-set", "Aaj Tak Sahitya festival", "Mayank seated at a desk on the Aaj Tak Sahitya festival set"]
    ];
    var A = $("#micA"), B = $("#micB"), cap = $("#micCap"), box = $("#mic"); if (!A) return;
    var cur = 0, front = A, back = B, timer = 0, hold = false, seen = false, busy = false, queued = null, FADE = 700;
    var cache = {};
    function load(i) {   // preload and decode so a photo is ready before it fades in
      var k = P[i][0];
      if (!cache[k]) {
        var im = new Image(); im.decoding = "async"; im.src = "assets/stage/" + k + ".webp";
        cache[k] = (im.decode ? im.decode().catch(function () {}) : new Promise(function (r) { im.onload = r; im.onerror = r; })).then(function () { return im; });
      }
      return cache[k];
    }
    function swap(i) {
      busy = true; cur = (i + P.length) % P.length;
      load(cur).then(function (im) {
        back.src = im.src; back.alt = P[cur][2]; back.removeAttribute("aria-hidden");
        front.setAttribute("aria-hidden", "true"); front.alt = "";
        void back.offsetWidth;                        // make sure the new photo is painted before fading
        back.classList.remove("out"); back.classList.add("on");           // new photo: fades in while slowly zooming
        front.classList.remove("on"); front.classList.add("out");         // old photo: fades out, holding its zoom
        var gone = front; setTimeout(function () { gone.classList.remove("out"); }, FADE + 80);
        cap.classList.add("fade"); setTimeout(function () { cap.textContent = P[cur][1]; cap.classList.remove("fade"); }, FADE / 2);
        var t = front; front = back; back = t;
        setTimeout(function () {
          busy = false;
          if (queued !== null) { var q = queued; queued = null; swap(q); }
        }, FADE + 60);
        load((cur + 1) % P.length);              // warm up the next one
      });
    }
    function go(i) { if (busy) { queued = i; return; } swap(i); }
    function step(d) { go(cur + d); restart(); }
    function restart() { clearInterval(timer); if (reduce) return; timer = setInterval(function () { if (seen && !hold && !busy) go(cur + 1); }, 4200); }
    A.src = "assets/stage/" + P[0][0] + ".webp"; A.alt = P[0][2]; cap.textContent = P[0][1]; load(0); load(1);
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    on(box, "pointerenter", function () { hold = true; }); on(box, "pointerleave", function () { hold = false; });
    on($("#micPrev"), "click", function () { step(-1); }); on($("#micNext"), "click", function () { step(1); });
    var dlg = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
    on($("#micMain"), "click", function () {
      var p = P[cur];
      lbImg.src = "assets/stage/" + p[0] + ".webp"; lbImg.alt = p[2]; lbCap.textContent = p[1];
      var big = new Image(); big.onload = function () { if (dlg.open && lbImg.alt === p[2]) lbImg.src = big.src; };
      big.src = "assets/stage/" + p[0] + "-full.webp";
      if (dlg.showModal) dlg.showModal();
    });
    restart();
  })();

  /* ---------- re-measure once fonts and images have settled so pinned sections start in the right place ---------- */
  if (hasG) {
    var refresh = function () { ScrollTrigger.refresh(); };
    on(window, "load", function () { setTimeout(refresh, 200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(refresh, 100); });
    var rz; on(window, "resize", function () { clearTimeout(rz); rz = setTimeout(refresh, 250); });
  }

  /* ---------- nav highlight (a link can cover several sections) ---------- */
  (function () {
    var links = $$("#links a"), map = {};
    links.forEach(function (a) { (a.dataset.sec || a.getAttribute("href").slice(1)).split(" ").forEach(function (id) { map[id] = a; }); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-on"); });
        var a = map[x.target.id]; if (a) a.classList.add("is-on");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  /* ---------- contact form (opens the visitor's mail app) ---------- */
  on($("#report"), "submit", function (e) {
    e.preventDefault();
    var t = $("#f-title"), b = $("#f-body"), sev = $("#f-sev"), bad = false;
    [[t, "#e-title"], [b, "#e-body"]].forEach(function (p) {
      var miss = !p[0].value.trim(); $(p[1]).hidden = !miss; p[0].setAttribute("aria-invalid", String(miss)); if (miss) bad = true;
    });
    if (bad) { (t.value.trim() ? b : t).focus(); return; }
    location.href = "mailto:mack22081@gmail.com?subject=" + encodeURIComponent(sev.value + " - " + t.value.trim()) + "&body=" + encodeURIComponent(b.value.trim() + "\n\n" + t.value.trim());
    $("#ok").hidden = false;
  });

  /* ---------- page check: real tests that run on this page ---------- */
  (function () {
    var btn = $("#qaBtn"), dlg = $("#qaDlg"), list = $("#qaList"), sub = $("#qaSub");
    function rgba(str) {
      var m = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
      if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
      m = str.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 1];
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    function blend(f, b) { var a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; }
    function lum(c) { var x = c.slice(0, 3).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]; }
    function ratio(a, b) { var l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
    function bgOf(el) {
      var stack = []; for (var n = el; n && n.nodeType === 1; n = n.parentElement) stack.push(getComputedStyle(n).backgroundColor);
      var c = rgba(getComputedStyle(document.body).backgroundColor); if (c[3] === 0) c = [255, 255, 255, 1];
      for (var i = stack.length - 1; i >= 0; i--) { var s = rgba(stack[i]); if (s[3] > 0) c = blend(s, c); } return c;
    }
    function run() {
      root.classList.add("qa-run"); var res = [];
      function add(name, pass, detail, bug) { res.push({ name: name, pass: pass, detail: detail, bug: bug }); }
      var imgs = $$("img").filter(function (i) { return i.getAttribute("src"); });
      var noAlt = imgs.filter(function (i) { return !i.hasAttribute("alt"); }).length, broken = imgs.filter(function (i) { return i.complete && i.naturalWidth === 0; }).length;
      add("Every image has a text description and loads", noAlt === 0 && broken === 0, imgs.length + " images, " + noAlt + " without text, " + broken + " broken");
      var an = $$('a[href^="#"]').filter(function (a) { return a.getAttribute("href").length > 1; }), dead = an.filter(function (a) { return !document.getElementById(a.getAttribute("href").slice(1)); });
      add("Every in-page link goes somewhere", dead.length === 0, an.length + " links checked, " + dead.length + " dead");
      var ext = $$('a[target="_blank"]'), unsafe = ext.filter(function (a) { return !/noopener/.test(a.rel); });
      add("Links that open a new tab are safe", unsafe.length === 0, ext.length + " links checked");
      add("No sideways scrolling at this screen size", document.documentElement.scrollWidth <= window.innerWidth + 1, "Window is " + window.innerWidth + " px wide");
      var hs = $$("h1,h2,h3,h4"), h1s = hs.filter(function (h) { return h.tagName === "H1"; }).length, jump = 0, last = 0;
      hs.forEach(function (h) { var l = +h.tagName[1]; if (last && l > last + 1) jump++; last = l; });
      add("Headings are in a sensible order", h1s === 1 && jump === 0, "One main heading, " + hs.length + " headings in total");
      var fields = $$("input,select,textarea").filter(function (f) { return f.type !== "hidden"; }), unl = fields.filter(function (f) { return !(f.id && document.querySelector('label[for="' + f.id + '"]')); });
      add("Every form field has a label", unl.length === 0, fields.length + " fields checked");
      add("Page language is declared", !!root.lang, "Language: " + (root.lang || "missing"));
      var els = $$("main *, header *").filter(function (el) {
        if (el.closest("dialog") || el.closest("svg") || !el.offsetParent) return false;
        return Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim().length > 1; });
      });
      var fails = [], worst = 99;
      els.forEach(function (el) {
        var cs = getComputedStyle(el), bg = bgOf(el), fg = blend(rgba(cs.color), bg), size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        var need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5, r = ratio(fg, bg);
        if (r < worst) worst = r; if (r < need) fails.push(el.textContent.trim().slice(0, 26) + " (" + r.toFixed(1) + ")");
      });
      add("Text is easy to read against its background", fails.length === 0, els.length + " pieces of text checked, lowest contrast " + worst.toFixed(1) + " to 1" + (fails.length ? ". Low: " + fails.slice(0, 3).join(", ") : ""));
      var bytes = 0; try { performance.getEntriesByType("resource").forEach(function (r) { bytes += r.encodedBodySize || 0; }); } catch (e) {}
      var kb = Math.round(bytes / 1024);
      add("Page stays light", bytes === 0 || kb < 4000, bytes ? "Loaded " + kb + " KB so far" : "Size not available in this browser");
      // two honest findings: these are real gaps in this page, logged the way I would log them on a project
      var moving = [].concat($$(".track").filter(function (t) { return getComputedStyle(t).animationName !== "none"; }), $$(".mic-img.on, .bw-track"));
      var hasPause = !!document.querySelector("[data-pause], [aria-label*='Pause' i]");
      add("Moving content can be paused by the visitor", reduce || hasPause,
        moving.length + " moving elements (tools strip, photo viewer, screens slideshow), no pause button",
        { id: "BUG-001", sev: "Minor", area: "Accessibility", title: "Moving content has no pause button",
          steps: ["Open the page on a laptop or phone.", "Watch the tools strip under the hero, the screens slideshow and the photo viewer.", "Try to stop any of them with the keyboard or a tap."],
          expected: "A visible Pause button, as WCAG 2.2.2 asks for anything that moves for more than 5 seconds.",
          actual: "They keep moving. The strip only stops while a mouse hovers over it. Visitors who set 'reduce motion' on their device are not affected.",
          fix: "Add a Pause button next to each moving element." });
      var form = $("#report"), formUrl = form ? (form.getAttribute("action") || "") : "";
      add("Contact form sends without needing an email app", /^https?:/.test(formUrl),
        form ? "Form has no server address, it opens the visitor's email app" : "No form found",
        { id: "BUG-002", sev: "Minor", area: "Functional", title: "Contact form depends on an email app being set up",
          steps: ["Open the Contact section and fill in the form.", "Press Send message on a device with no email app set up."],
          expected: "The message is delivered and the visitor sees a confirmation.",
          actual: "Nothing is sent. The page only shows a note with the email address to write to.",
          fix: "Send the form to a form service so delivery does not depend on the visitor's device." });
      root.classList.remove("qa-run"); return res;
    }
    function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function bugHtml(b) {
      return '<details class="bug" open><summary><span class="bug-id">' + b.id + '</span> ' + esc(b.title) + '<em class="sev">' + b.sev + '</em></summary>' +
        '<dl><dt>Area</dt><dd>' + b.area + '</dd><dt>Steps to reproduce</dt><dd><ol>' + b.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ol></dd>' +
        '<dt>Expected</dt><dd>' + esc(b.expected) + '</dd><dt>Actual</dt><dd>' + esc(b.actual) + '</dd><dt>Suggested fix</dt><dd>' + esc(b.fix) + '</dd></dl></details>';
    }
    function show() {
      var res = run(), ok = res.filter(function (r) { return r.pass; }).length, bad = res.length - ok;
      sub.innerHTML = '<b class="n-ok">' + ok + ' passed</b>' + (bad ? ' <b class="n-bad">' + bad + ' open issue' + (bad > 1 ? "s" : "") + '</b>' : "") + ' <span>of ' + res.length + ' checks</span>';
      res.sort(function (a, b) { return (a.pass ? 1 : 0) - (b.pass ? 1 : 0); });
      list.innerHTML = res.map(function (r) {
        return '<li class="' + (r.pass ? "pass" : "fail") + '"><b>' + (r.pass ? "Pass" : "Fail") + "</b><div>" + r.name + "<span>" + r.detail + "</span>" + (r.bug ? bugHtml(r.bug) : "") + "</div></li>";
      }).join("");
      btn.textContent = "Live QA report " + ok + "/" + res.length; btn.classList.toggle("pass", bad === 0);
    }
    function open() { show(); if (dlg.showModal) dlg.showModal(); }
    on(btn, "click", open); on($("#qaFoot"), "click", open);
    on(window, "load", function () { setTimeout(show, 1500); });
  })();
})();
