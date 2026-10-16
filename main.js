(function () {
  "use strict";
  var root = document.documentElement;
  try { history.scrollRestoration = "manual"; } catch (e) {}
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = matchMedia("(pointer: coarse)").matches;
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  var themeBtn = $("#themeBtn");
  var gridColors = {};
  function readColors() {
    var cs = getComputedStyle(root);
    gridColors.acc = cs.getPropertyValue("--acc-text").trim() || "#ff5a2c";
    gridColors.line = cs.getPropertyValue("--mut").trim() || "#8a8a82";
  }
  themeBtn.addEventListener("click", function () {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute("content", next === "light" ? "#f2f2f0" : "#0e0e0d");
    readColors();
    if (grid) grid.draw(true);
  });
  readColors();

  /* ---------- hero test grid (canvas) ---------- */
  var grid = null;
  (function () {
    var canvas = $("#grid");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var cell = 34, cols = 0, rows = 0, w = 0, h = 0, dpr = 1;
    var lv = null, running = false, visible = true, raf = 0;
    var mouse = { x: -999, y: -999 };
    var sweep = -1, sweepAt = performance.now() + 1500;

    function size() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = w < 700 ? 26 : 34;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / cell); rows = Math.ceil(h / cell);
      lv = new Float32Array(cols * rows);
      if (reduce) seedStatic();
    }
    function seedStatic() {
      for (var i = 0; i < lv.length; i++) if (Math.random() < 0.07) lv[i] = 0.35 + Math.random() * 0.4;
      draw(true);
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = gridColors.line;
      ctx.globalAlpha = 0.22;
      for (var y = 0; y <= rows; y++) for (var x = 0; x <= cols; x++) ctx.fillRect(x * cell, y * cell, 1.5, 1.5);
      ctx.fillStyle = gridColors.acc;
      for (var j = 0; j < lv.length; j++) {
        var l = lv[j];
        if (l > 0.02) {
          ctx.globalAlpha = Math.min(l, 1) * 0.42;
          ctx.fillRect((j % cols) * cell + 3, Math.floor(j / cols) * cell + 3, cell - 5, cell - 5);
        }
      }
      ctx.globalAlpha = 1;
    }
    function tick(t) {
      if (!running) return;
      var i, c, r;
      for (i = 0; i < lv.length; i++) if (lv[i] > 0) lv[i] *= 0.93;
      for (i = 0; i < 1; i++) { lv[(Math.random() * lv.length) | 0] = 0.55 + Math.random() * 0.45; }
      if (mouse.x > -900) {
        var mc = mouse.x / cell, mr = mouse.y / cell;
        for (r = Math.max(0, (mr - 4) | 0); r < Math.min(rows, mr + 5); r++)
          for (c = Math.max(0, (mc - 4) | 0); c < Math.min(cols, mc + 5); c++) {
            var d = Math.hypot(c + 0.5 - mc, r + 0.5 - mr);
            if (d < 4) { var k = (1 - d / 4); var idx = r * cols + c; if (lv[idx] < k) lv[idx] = k; }
          }
      }
      if (sweep < 0 && t > sweepAt) { sweep = 0; }
      if (sweep >= 0) {
        var col = sweep | 0;
        if (col < cols) { for (r = 0; r < rows; r++) if (Math.random() < 0.55) lv[r * cols + col] = 0.9; sweep += 0.7; }
        else { sweep = -1; sweepAt = t + 7000; }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running || reduce || !visible) return; running = true; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    var rt; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (!reduce) start(); }, 120); }).observe(hero);
    size(); start();
    grid = { draw: draw };
  })();

  /* ---------- glitch on "break" ---------- */
  (function () {
    var g = $("#glitch");
    if (!g || reduce) return;
    (function loop() {
      setTimeout(function () {
        g.classList.add("is-glitch");
        setTimeout(function () { g.classList.remove("is-glitch"); loop(); }, 170);
      }, 3200 + Math.random() * 3500);
    })();
  })();

  /* ---------- intro ---------- */
  function intro() {
    var boot = $("#boot");
    if (boot) { boot.style.display = "none"; }
    if (!hasGsap || reduce) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".line-in", { y: 0, duration: 1.1, stagger: 0.12 })
      .to(".hero-sub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .to(".hero-cta", { opacity: 1, y: 0, duration: 0.8 }, "-=0.65")
      .to(".portrait", { opacity: 1, y: 0, duration: 1.1 }, "-=1.1");
  }
  (function boot() {
    var el = $("#boot");
    var seen = false;
    try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
    if (!el || !hasGsap || reduce || seen) { intro(); return; }
    var num = $("#bootNum");
    var o = { v: 0 };
    gsap.to(o, {
      v: 7, duration: 0.55, ease: "power1.inOut",
      onUpdate: function () { num.textContent = Math.round(o.v); },
      onComplete: function () {
        try { sessionStorage.setItem("booted", "1"); } catch (e) {}
        gsap.to(el, { yPercent: -100, duration: 0.6, ease: "expo.inOut", onComplete: intro });
      }
    });
  })();

  /* ---------- magnetic buttons ---------- */
  if (hasGsap && !reduce && !coarse) {
    $$("[data-magnet]").forEach(function (b) {
      var xTo = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3" });
      var yTo = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- reveals ---------- */
  (function () {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduce) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- statement: words light up as you scroll ---------- */
  (function () {
    var p = $("#state");
    if (!p) return;
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    var spans = words.map(function (w, i) {
      var s = document.createElement("span");
      s.className = "w"; s.textContent = w;
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(" "));
      return s;
    });
    if (!hasGsap || reduce) { spans.forEach(function (s) { s.style.opacity = 1; }); return; }
    gsap.to(spans, {
      opacity: 1, ease: "none", stagger: 0.12,
      scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true }
    });
  })();

  /* ---------- counters ---------- */
  if (hasGsap && !reduce) {
    $$("[data-count]").forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var o = { v: 0 };
      el.textContent = "0";
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(o, { v: target, duration: 1.6, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
        }
      });
    });
  }

  /* ---------- agent diagram ---------- */
  (function () {
    var steps = $$(".step");
    var wires = $$(".wire");
    var nodes = $$(".node");
    var pulse = $("#pulse");
    if (!steps.length) return;
    var pos = [[260, 260], [260, 170], [350, 260], [260, 350], [170, 260]];
    var cur = -1;
    function setStep(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      nodes.forEach(function (n) {
        var id = n.dataset.n;
        n.classList.toggle("on", id === "core" ? true : parseInt(id, 10) <= i);
      });
      wires.forEach(function (w) { w.classList.toggle("on", parseInt(w.dataset.w, 10) < i); });
      var p = pos[i];
      gsap.to(pulse, { opacity: i === 0 ? 0 : 1, duration: 0.3 });
      if (hasGsap && !reduce) gsap.to(pulse, { attr: { cx: p[0], cy: p[1] }, duration: 0.7, ease: "power3.inOut" });
      else { pulse.setAttribute("cx", p[0]); pulse.setAttribute("cy", p[1]); }
    }
    setStep(0);
    if (reduce || !hasGsap) { setStep(4); return; }
    var mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", function () {
      ScrollTrigger.create({
        trigger: ".agent-pin", start: "top top", end: "+=1100", pin: true, scrub: true,
        onUpdate: function (self) { setStep(Math.min(4, Math.floor(self.progress * 5))); }
      });
    });
    mm.add("(max-width: 860px)", function () {
      var t, i = 0, vis = false;
      var io = new IntersectionObserver(function (en) {
        vis = en[0].isIntersecting;
        clearInterval(t);
        if (vis) t = setInterval(function () { i = (i + 1) % 5; setStep(i); }, 2200);
      }, { threshold: 0.3 });
      io.observe($(".agent-grid"));
      return function () { clearInterval(t); io.disconnect(); };
    });
  })();

  /* ---------- certificates ---------- */
  (function () {
    var deck = $("#deck");
    var cards = $$(".card", deck);
    if (hasGsap && !reduce) {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 861px)", function () {
        var tl = gsap.timeline({ scrollTrigger: { trigger: deck, start: "top 85%", end: "top 30%", scrub: 0.6 } });
        tl.to(cards[0], { "--x": "-68%", "--y": "-46%", "--r": "-10deg" }, 0)
          .to(cards[1], { "--y": "-54%", "--r": "0deg" }, 0)
          .to(cards[2], { "--x": "-32%", "--y": "-58%", "--r": "10deg" }, 0);
      });
    }
    var dlg = $("#lightbox");
    var img = $("#lbImg"), cap = $("#lbCap");
    cards.forEach(function (c) {
      c.addEventListener("click", function () {
        img.src = c.dataset.full; img.alt = c.querySelector("img").alt; cap.textContent = c.dataset.title;
        if (dlg.showModal) dlg.showModal(); else window.open(c.dataset.full, "_blank");
      });
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  })();

  /* ---------- inspect mode (shows the test IDs) ---------- */
  (function () {
    var btn = $("#inspectBtn"), layer = $("#inspectLayer");
    var on = false, pending = 0;
    function build() {
      layer.textContent = "";
      var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      layer.style.height = docH + "px";
      var sx = window.scrollX, sy = window.scrollY, n = 0;
      $$("[data-testid]").forEach(function (el) {
        if (getComputedStyle(el).position === "fixed") return;
        var r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        var b = document.createElement("div");
        b.className = "ibox";
        b.style.cssText = "left:" + (r.left + sx) + "px;top:" + (r.top + sy) + "px;width:" + r.width + "px;height:" + r.height + "px;animation-delay:" + Math.min(n * 25, 600) + "ms";
        var s = document.createElement("span");
        s.textContent = "test id: " + el.dataset.testid;
        b.appendChild(s); layer.appendChild(b); n++;
      });
    }
    function schedule() { if (!on) return; cancelAnimationFrame(pending); pending = requestAnimationFrame(build); }
    function toggle(v) {
      on = typeof v === "boolean" ? v : !on;
      btn.setAttribute("aria-pressed", String(on));
      if (on) build(); else layer.textContent = "";
    }
    btn.addEventListener("click", function () { toggle(); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "x" && e.key !== "X") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      toggle();
    });
    if (hasGsap) {
      ScrollTrigger.addEventListener("scrollEnd", schedule);
      ScrollTrigger.addEventListener("refresh", schedule);
    }
    new ResizeObserver(schedule).observe(document.body);
    window.addEventListener("load", schedule);
  })();

  /* ---------- report form (opens the visitor's mail app) ---------- */
  (function () {
    var f = $("#report");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("#f-title"), b = $("#f-body"), sev = $("#f-sev");
      var bad = false;
      [[t, "#e-title"], [b, "#e-body"]].forEach(function (p) {
        var miss = !p[0].value.trim();
        $(p[1]).hidden = !miss;
        p[0].setAttribute("aria-invalid", String(miss));
        if (miss) bad = true;
      });
      if (bad) { (t.value.trim() ? b : t).focus(); return; }
      var subject = sev.value + " - " + t.value.trim();
      var body = b.value.trim() + "\n\n" + t.value.trim();
      location.href = "mailto:mack22081@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      $("#ok").hidden = false;
    });
  })();
})();
