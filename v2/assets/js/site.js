/* Duncwell Medical — v2 behaviour
   Plain ES2017, no dependencies. Every enhancement degrades gracefully. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var desktop = window.matchMedia("(min-width: 900px)");

  /* ------------------------------------------------------------------ */
  /* Booking data — one source of truth for the page chooser and sheet   */
  /* ------------------------------------------------------------------ */
  var BOOK = {
    omagh: "https://duncwellmedicals.simplybook.it/",
    enniskillen: "https://duncwellmedical.simplybook.it/v2/"
  };
  var TYPES = {
    hgv: {
      title: "Group 2 (D4) medical — HGV",
      who: "For Class 1 and Class 2 lorry licences, whether you're applying for the first time or renewing.",
      includes: [
        "Full examination with an experienced GP",
        "Eyesight examination carried out on site",
        "Forms supplied, completed and signed on the day",
        "Around 15–20 minutes in total"
      ]
    },
    bus: {
      title: "Group 2 (D4) medical — Bus & coach",
      who: "For bus and coach licences — the same Group 2 medical lorry drivers need, completed in one appointment.",
      includes: [
        "Full examination with an experienced GP",
        "Eyesight examination carried out on site",
        "Forms supplied, completed and signed on the day",
        "Around 15–20 minutes in total"
      ]
    },
    taxi: {
      title: "Taxi driver medical",
      who: "For taxi driver licence applications and renewals. Not sure when yours is due? Tell us when you book and we'll confirm.",
      includes: [
        "Detailed medical for licence compliance",
        "Eyesight check included in the same appointment",
        "All paperwork handled for you on the day",
        "Follow-up care from your medical at no extra fee"
      ]
    }
  };
  var CLINICS = {
    omagh: { name: "Omagh", sub: "Two clinic locations" },
    enniskillen: { name: "Enniskillen", sub: "Fermanagh House" }
  };

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function renderResult(container, type, clinic) {
    var t = TYPES[type];
    var c = clinic || "omagh";
    var html = "" +
      '<div class="result-panel">' +
        '<div class="result-top"><div><h3>' + t.title + "</h3><p class=\"who\">" + t.who + "</p></div>" +
        '<div class="price-tag"><span class="amt">£100</span><span class="lbl">Cash or card</span></div></div>' +
        '<ul class="inc">' + t.includes.map(function (s) { return "<li>" + CHECK + s + "</li>"; }).join("") + "</ul>" +
        '<div class="clinic"><span class="lbl">Choose your clinic</span><div class="clinic-opts">' +
          '<button type="button" data-clinic="omagh" aria-pressed="' + (c === "omagh") + '">' + CLINICS.omagh.name + "<small>" + CLINICS.omagh.sub + "</small></button>" +
          '<button type="button" data-clinic="enniskillen" aria-pressed="' + (c === "enniskillen") + '">' + CLINICS.enniskillen.name + "<small>" + CLINICS.enniskillen.sub + "</small></button>" +
        "</div></div>" +
        '<div class="go">' +
          '<a class="btn btn-blue" href="' + BOOK[c] + '" target="_blank" rel="noopener">Book online in ' + CLINICS[c].name + ' <svg class="i arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
          '<a class="btn btn-line" href="tel:+447707612400">Or call 07707 612 400</a>' +
        "</div>" +
        '<p class="note">Bring your glasses if you wear them for driving. Everything else is handled on the day.</p>' +
      "</div>";
    container.innerHTML = html;
    container.querySelectorAll("[data-clinic]").forEach(function (b) {
      b.addEventListener("click", function () {
        setState(container.getAttribute("data-result"), type, b.getAttribute("data-clinic"));
      });
    });
  }

  var state = { page: { type: "hgv", clinic: "omagh" }, sheet: { type: "hgv", clinic: "omagh" } };

  function setState(key, type, clinic) {
    var st = state[key];
    var typeChanged = st.type !== type;
    st.type = type; st.clinic = clinic || st.clinic;
    var seg = document.querySelector('[data-chooser="' + key + '"]');
    var container = document.querySelector('[data-result="' + key + '"]');
    if (seg) {
      var tabs = seg.querySelectorAll("[data-type]");
      tabs.forEach(function (tab, i) {
        var on = tab.getAttribute("data-type") === type;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        if (on) seg.querySelector(".ind").style.transform = "translateX(" + (i * 100) + "%)";
      });
    }
    if (!container) return;
    var panel = container.querySelector(".result-panel");
    if (panel && typeChanged && !reduceMotion) {
      panel.classList.add("swap");
      setTimeout(function () { renderResult(container, type, st.clinic); }, 180);
    } else {
      renderResult(container, type, st.clinic);
    }
    try { localStorage.setItem("dw2-choice", JSON.stringify(state.page)); } catch (e) {}
  }

  function initChooser(key) {
    var seg = document.querySelector('[data-chooser="' + key + '"]');
    if (!seg) return;
    seg.querySelectorAll("[data-type]").forEach(function (tab) {
      tab.addEventListener("click", function () { setState(key, tab.getAttribute("data-type")); });
    });
    // keyboard: arrows move between tabs
    seg.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var tabs = Array.prototype.slice.call(seg.querySelectorAll("[data-type]"));
      var i = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
      var n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus(); tabs[n].click();
    });
    setState(key, state[key].type, state[key].clinic);
  }
  try {
    var saved = JSON.parse(localStorage.getItem("dw2-choice") || "null");
    if (saved && TYPES[saved.type] && BOOK[saved.clinic]) { state.page = saved; state.sheet = { type: saved.type, clinic: saved.clinic }; }
  } catch (e) {}
  initChooser("page");
  initChooser("sheet");

  /* ------------------------------------------------------------------ */
  /* Booking sheet                                                       */
  /* ------------------------------------------------------------------ */
  var sheet = document.getElementById("sheet");
  var lastFocus = null;
  function openSheet(preselect) {
    if (!sheet) return;
    lastFocus = document.activeElement;
    if (preselect && TYPES[preselect]) setState("sheet", preselect, state.sheet.clinic);
    if (typeof sheet.showModal === "function") { sheet.showModal(); }
    else { sheet.setAttribute("open", ""); }
    document.body.style.overflow = "hidden";
    var first = sheet.querySelector('[aria-selected="true"]');
    if (first) first.focus();
  }
  function closeSheet() {
    if (!sheet) return;
    var inner = sheet.querySelector(".sheet-inner");
    var finish = function () {
      if (typeof sheet.close === "function" && sheet.open) sheet.close(); else sheet.removeAttribute("open");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (reduceMotion) { finish(); return; }
    // let the slide-down play before the dialog unmounts
    sheet.classList.add("closing");
    inner.style.transition = "transform .3s cubic-bezier(.4,0,1,1), opacity .25s";
    inner.style.transform = desktop.matches ? "translateY(12px) scale(.98)" : "translateY(100%)";
    inner.style.opacity = desktop.matches ? "0" : "";
    setTimeout(function () {
      finish();
      sheet.classList.remove("closing");
      inner.style.transition = ""; inner.style.transform = ""; inner.style.opacity = "";
    }, 260);
  }
  document.querySelectorAll("[data-open-sheet]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      document.body.classList.remove("menu-open");
      openSheet(b.getAttribute("data-preselect"));
    });
  });
  document.querySelectorAll("[data-close-sheet]").forEach(function (b) { b.addEventListener("click", closeSheet); });
  if (sheet) {
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    sheet.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(); });
    // swipe down to dismiss on touch
    var y0 = null;
    sheet.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener("touchend", function (e) {
      if (y0 === null) return;
      var dy = e.changedTouches[0].clientY - y0;
      var inner = sheet.querySelector(".sheet-inner");
      if (dy > 90 && inner.scrollTop <= 0) closeSheet();
      y0 = null;
    }, { passive: true });
  }
  if (location.hash === "#book") openSheet();

  /* ------------------------------------------------------------------ */
  /* Theme toggle with a view transition where supported                 */
  /* ------------------------------------------------------------------ */
  var toggle = document.getElementById("themeToggle");
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("dw2-theme", t); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0C0D10" : "#16181C");
  }
  if (toggle) toggle.addEventListener("click", function () {
    var next = root.dataset.theme === "dark" ? "light" : "dark";
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(function () { applyTheme(next); });
    } else { applyTheme(next); }
  });

  /* ------------------------------------------------------------------ */
  /* Header state + action bar                                           */
  /* ------------------------------------------------------------------ */
  var header = document.getElementById("header");
  var bar = document.getElementById("bar");
  var hero = document.getElementById("hero");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      var heroBottom = hero ? hero.offsetTop + hero.offsetHeight - 70 : 400;
      var over = y < heroBottom;
      header.classList.toggle("over", over);
      header.classList.toggle("solid", !over);
      if (bar) bar.classList.toggle("show", y > window.innerHeight * 0.55);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                         */
  /* ------------------------------------------------------------------ */
  var burger = document.getElementById("burger");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { header.classList.remove("over"); header.classList.add("solid"); } else { onScroll(); }
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
  document.querySelectorAll("#menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); burger.focus(); }
  });

  /* ------------------------------------------------------------------ */
  /* Hero: entrance + film clip (desktop, decent connection only)        */
  /* ------------------------------------------------------------------ */
  var heroImg = hero ? hero.querySelector(".hero-media img") : null;
  function heroReady() { hero.classList.add("loaded"); }
  if (hero) {
    if (heroImg && heroImg.complete) heroReady();
    else if (heroImg) { heroImg.addEventListener("load", heroReady); setTimeout(heroReady, 1200); }
    else heroReady();
  }
  var video = document.getElementById("heroVideo");
  function okToPlayVideo() {
    if (reduceMotion) return false;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ""))) return false;
    return window.matchMedia("(min-width: 640px)").matches;
  }
  if (video && okToPlayVideo()) {
    var srcWebm = document.createElement("source"); srcWebm.src = "assets/video/hero.webm"; srcWebm.type = "video/webm";
    var srcMp4 = document.createElement("source"); srcMp4.src = "assets/video/hero.mp4"; srcMp4.type = "video/mp4";
    video.appendChild(srcWebm); video.appendChild(srcMp4);
    video.preload = "auto";
    video.addEventListener("canplay", function () {
      var p = video.play();
      if (p && p.then) p.then(function () { video.classList.add("ready"); }).catch(function () {});
      else video.classList.add("ready");
    }, { once: true });
    // Play once and hold the final frame — a lorry can't reverse out of shot.
    video.addEventListener("ended", function () { video.pause(); });
    video.load();
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                    */
  /* ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".rv");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add("in"); }); }

  /* ------------------------------------------------------------------ */
  /* Odometer-style number rolls on the fact rail                        */
  /* ------------------------------------------------------------------ */
  function buildOdo(el) {
    var target = el.getAttribute("data-odo");
    el.textContent = "";
    el.setAttribute("aria-label", target);
    target.split("").forEach(function (ch) {
      var col = document.createElement("span"); col.className = "col";
      var strip = document.createElement("span"); strip.className = "strip";
      for (var d = 0; d <= 9; d++) { var s = document.createElement("span"); s.textContent = d; strip.appendChild(s); }
      col.appendChild(strip); el.appendChild(col);
      col.dataset.digit = ch;
    });
  }
  function runOdo(el) {
    el.querySelectorAll(".col").forEach(function (col, i) {
      var strip = col.querySelector(".strip");
      strip.style.transitionDelay = (i * 0.08) + "s";
      strip.style.transform = "translateY(-" + (parseInt(col.dataset.digit, 10) * 1) + "em)";
    });
  }
  var odos = document.querySelectorAll("[data-odo]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    odos.forEach(buildOdo);
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runOdo(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.6 });
    odos.forEach(function (el) { io2.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* Process: sticky media follows the active step (desktop)             */
  /* ------------------------------------------------------------------ */
  var steps = document.querySelectorAll("#steps .step");
  var media = document.querySelectorAll(".proc-media img");
  var procLabel = document.getElementById("procLabel");
  var procBar = document.getElementById("procBar");
  var stepNames = ["Booking", "Paperwork", "Examination", "Road-ready"];
  function activate(n) {
    steps.forEach(function (s) {
      var k = parseInt(s.getAttribute("data-step"), 10);
      s.classList.toggle("active", k === n);
      if (k < n) s.classList.add("seen");
    });
    media.forEach(function (m) { m.classList.toggle("on", parseInt(m.getAttribute("data-step"), 10) === n); });
    if (procLabel) procLabel.textContent = "Step " + n + " of 4";
    if (procBar) procBar.style.width = (n * 25) + "%";
    var capName = document.querySelector(".proc-media .cap span:last-child");
    if (capName) capName.textContent = stepNames[n - 1];
  }
  if (steps.length && "IntersectionObserver" in window) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(parseInt(en.target.getAttribute("data-step"), 10));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io3.observe(s); });
  } else { steps.forEach(function (s) { s.classList.add("active"); }); }

  /* ------------------------------------------------------------------ */
  /* Reviews: sync dots to the snap carousel on mobile                   */
  /* ------------------------------------------------------------------ */
  var track = document.getElementById("revTrack");
  var dots = document.querySelectorAll("#revDots i");
  if (track && dots.length) {
    var cards = track.querySelectorAll(".rev");
    var io4 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          var i = Array.prototype.indexOf.call(cards, en.target);
          dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
        }
      });
    }, { root: track, threshold: [0.6] });
    cards.forEach(function (c) { io4.observe(c); });
  }

  /* ------------------------------------------------------------------ */
  /* FAQ: exclusive accordion fallback for browsers without details[name]*/
  /* ------------------------------------------------------------------ */
  var faqs = document.querySelectorAll("details.faq");
  var supportsName = "name" in document.createElement("details");
  if (!supportsName) {
    faqs.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) faqs.forEach(function (o) { if (o !== d) o.removeAttribute("open"); });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Enquiry form → pre-filled WhatsApp                                  */
  /* ------------------------------------------------------------------ */
  var form = document.getElementById("enquiry");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var text = "Hello, I'd like to book a medical.\n" +
      "Name: " + v("f-name") + "\nPhone: " + v("f-phone") + "\nMedical: " + v("f-type") + "\nClinic: " + v("f-clinic") +
      (v("f-msg") ? "\n" + v("f-msg") : "");
    window.open("https://wa.me/447707612400?text=" + encodeURIComponent(text), "_blank", "noopener");
  });

  /* ------------------------------------------------------------------ */
  /* Card tilt on fine pointers only — small, not showy                  */
  /* ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".svc, .loc").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "translateY(-4px) rotateX(" + (-y * 2.2) + "deg) rotateY(" + (x * 2.2) + "deg)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }
})();
