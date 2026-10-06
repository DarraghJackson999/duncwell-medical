/* Duncwell Medical v3 — behaviour. GSAP (ScrollTrigger, SplitText) is optional:
   if the CDN is blocked the page is complete and static; nothing is hidden. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var G = window.gsap;

  /* ---------- theme ---------- */
  var toggle = document.getElementById("theme");
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("dw3-theme", t); } catch (e) {}
  }
  function isDark() {
    return root.dataset.theme === "dark" || (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  if (toggle) toggle.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    if (document.startViewTransition && !reduce) document.startViewTransition(function () { setTheme(next); });
    else setTheme(next);
  });

  /* ---------- menu ---------- */
  var burger = document.getElementById("burger");
  function menu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { menu(!document.body.classList.contains("menu-open")); });
  document.querySelectorAll("#menu a").forEach(function (a) { a.addEventListener("click", function () { menu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) menu(false); });

  /* ---------- mobile bar ---------- */
  var bar = document.getElementById("bar");
  function onScroll() { if (bar) bar.classList.toggle("show", window.scrollY > window.innerHeight * 0.5); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- hero film ---------- */
  var video = document.getElementById("film");
  var conn = navigator.connection;
  var okVideo = !reduce && !(conn && (conn.saveData || /2g/.test(conn.effectiveType || ""))) && window.matchMedia("(min-width: 640px)").matches;
  if (video && okVideo) {
    [["assets/video/hero.webm", "video/webm"], ["assets/video/hero.mp4", "video/mp4"]].forEach(function (s) {
      var el = document.createElement("source"); el.src = s[0]; el.type = s[1]; video.appendChild(el);
    });
    video.addEventListener("canplay", function () {
      var p = video.play();
      if (p && p.then) p.then(function () { video.classList.add("ready"); }).catch(function () {});
      else video.classList.add("ready");
    }, { once: true });
    video.addEventListener("ended", function () { video.pause(); });
    video.load();
  }

  /* ---------- clinic finder (signature) ---------- */
  var CL = {
    omagh: {
      name: "Omagh", book: "https://duncwellmedicals.simplybook.it/",
      lines: ["Omagh Hospital & Primary Care Complex, 7 Donaghanie Road", "or Southwest College Omagh Campus, 2 Mountjoy Road"],
      pc: "BT79 0NR / BT79 7AH",
      dir: "https://maps.google.com/?q=Omagh+Hospital+and+Primary+Care+Complex,+7+Donaghanie+Road,+Omagh+BT79+0NR",
      map: "https://maps.google.com/maps?q=Omagh%20Hospital%20and%20Primary%20Care%20Complex%2C%207%20Donaghanie%20Road%2C%20Omagh%20BT79%200NR&z=13&output=embed"
    },
    enniskillen: {
      name: "Enniskillen", book: "https://duncwellmedical.simplybook.it/v2/",
      lines: ["Fermanagh House, Broadmeadow Place"],
      pc: "BT74 7HR",
      dir: "https://maps.google.com/?q=Fermanagh+House,+Broadmeadow+Place,+Enniskillen+BT74+7HR",
      map: "https://maps.google.com/maps?q=Fermanagh%20House%2C%20Broadmeadow%20Place%2C%20Enniskillen%20BT74%207HR&z=14&output=embed"
    }
  };
  /* approximate road miles to the nearer clinic */
  var TOWNS = [
    ["Omagh", "omagh", 0], ["Enniskillen", "enniskillen", 0],
    ["Augher", "omagh", 20], ["Ballinamallard", "enniskillen", 6], ["Ballygawley", "omagh", 14], ["Belcoo", "enniskillen", 12],
    ["Belleek", "enniskillen", 23], ["Beragh", "omagh", 8], ["Brookeborough", "enniskillen", 10], ["Carrickmore", "omagh", 12],
    ["Castlederg", "omagh", 14], ["Clogher", "omagh", 20], ["Cookstown", "omagh", 26], ["Derrygonnelly", "enniskillen", 10],
    ["Dromore", "omagh", 12], ["Drumquin", "omagh", 9], ["Dungannon", "omagh", 26], ["Ederney", "enniskillen", 14],
    ["Fintona", "omagh", 9], ["Fivemiletown", "omagh", 17], ["Florencecourt", "enniskillen", 8], ["Garrison", "enniskillen", 20],
    ["Gortin", "omagh", 10], ["Irvinestown", "enniskillen", 10], ["Kesh", "enniskillen", 14], ["Letterbreen", "enniskillen", 6],
    ["Lisbellaw", "enniskillen", 5], ["Lisnaskea", "enniskillen", 12], ["Maguiresbridge", "enniskillen", 8], ["Newtownbutler", "enniskillen", 15],
    ["Newtownstewart", "omagh", 10], ["Pettigo", "enniskillen", 18], ["Rosslea", "enniskillen", 16], ["Sion Mills", "omagh", 16],
    ["Strabane", "omagh", 20], ["Tempo", "enniskillen", 9], ["Trillick", "omagh", 14]
  ];
  var sel = document.getElementById("town");
  var res = document.getElementById("res");
  var chips = document.querySelectorAll(".chips button");
  if (sel) {
    TOWNS.slice(2).sort(function (a, b) { return a[0].localeCompare(b[0]); }).forEach(function (t) {
      var o = document.createElement("option"); o.value = t[0]; o.textContent = t[0]; sel.appendChild(o);
    });
    var other = document.createElement("option"); other.value = "__other"; other.textContent = "Somewhere else"; sel.appendChild(other);
  }
  function findTown(name) { for (var i = 0; i < TOWNS.length; i++) if (TOWNS[i][0] === name) return TOWNS[i]; return null; }
  function render(name) {
    if (!res) return;
    var t = findTown(name);
    var key = t ? t[1] : "omagh";
    var c = CL[key], o = CL[key === "omagh" ? "enniskillen" : "omagh"];
    var miles = t ? t[2] : null;
    var head, k;
    if (!t) { k = "Both clinics are central and about 27 miles apart"; head = "Pick whichever is on your route"; }
    else if (miles === 0) { k = "You're already in town"; head = c.name; }
    else { k = "Nearest clinic to " + name; head = c.name; }
    res.innerHTML =
      '<div class="rb">' +
        '<p class="k">' + k + "</p>" +
        "<h3>" + head + "</h3>" +
        (t && miles > 0 ? '<p class="mi">about ' + miles + ' miles<small>approximate road distance</small></p>' : "") +
        (t ? "<address>" + c.lines.join("<br>") + '<br><span class="pc">' + c.pc + "</span></address>" : "") +
        '<div class="acts">' +
          (t ? '<a class="pill pill-blue" href="' + c.book + '" target="_blank" rel="noopener">Book in ' + c.name + "</a>" +
               '<a class="pill pill-line" href="' + c.dir + '" target="_blank" rel="noopener">Directions</a>'
             : '<a class="pill pill-blue" href="' + CL.omagh.book + '" target="_blank" rel="noopener">Book in Omagh</a>' +
               '<a class="pill pill-blue" href="' + CL.enniskillen.book + '" target="_blank" rel="noopener">Book in Enniskillen</a>') +
        "</div>" +
        (t ? '<p class="alt">Prefer ' + o.name + '? <a href="' + o.book + '" target="_blank" rel="noopener">Book there instead</a>.</p>' : "") +
      "</div>" +
      '<div class="map"><div class="fb">Map of ' + c.name + " clinic</div>" +
        '<iframe src="' + c.map + '" loading="lazy" title="Map: ' + c.name + ' clinic" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
    res.classList.remove("swap"); void res.offsetWidth; if (!reduce) res.classList.add("swap");
    chips.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-town") === name ? "true" : "false"); });
    if (sel && sel.value !== name) { sel.value = findTown(name) ? name : "__other"; }
    try { localStorage.setItem("dw3-town", name); } catch (e) {}
  }
  if (sel) sel.addEventListener("change", function () { render(sel.value === "__other" ? "__other" : sel.value); });
  chips.forEach(function (b) { b.addEventListener("click", function () { render(b.getAttribute("data-town")); }); });
  var saved = null; try { saved = localStorage.getItem("dw3-town"); } catch (e) {}
  render(saved && (findTown(saved) || saved === "__other") ? saved : "Omagh");

  /* ---------- FAQ exclusive fallback ---------- */
  var faqs = document.querySelectorAll("details.faq");
  if (!("name" in document.createElement("details"))) {
    faqs.forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) faqs.forEach(function (o) { if (o !== d) o.removeAttribute("open"); }); }); });
  }

  /* ---------- copy phone ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var txt = b.getAttribute("data-copy");
      var done = function () { var was = b.textContent; b.textContent = "Copied"; setTimeout(function () { b.textContent = was; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(function () { selectText(); });
      else selectText();
      function selectText() { var v = b.parentElement.querySelector(".v"); if (!v) return; var r = document.createRange(); r.selectNodeContents(v); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
  });

  /* ---------- enquiry → WhatsApp ---------- */
  var form = document.getElementById("enq");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var text = "Hello, I'd like to book a medical.\nName: " + v("f-name") + "\nPhone: " + v("f-phone") + "\nMedical: " + v("f-type") + "\nClinic: " + v("f-clinic") + (v("f-msg") ? "\n" + v("f-msg") : "");
    var a = document.createElement("a"); a.href = "https://wa.me/447707612400?text=" + encodeURIComponent(text); a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- step cards: light up illustration when the card is in view ---------- */
  var steps = document.querySelectorAll(".step");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("lit"); io.unobserve(en.target); } }); }, { threshold: 0.45 });
    steps.forEach(function (s) { io.observe(s); });
  } else steps.forEach(function (s) { s.classList.add("lit"); });
  /* form rows tick in sequence */
  document.querySelectorAll(".step").forEach(function (s) {
    var rows = s.querySelectorAll(".form .row");
    if (!rows.length) return;
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      rows.forEach(function (r, i) { setTimeout(function () { r.classList.add("done"); }, reduce ? 0 : 350 + i * 320); });
      io2.disconnect();
    }, { threshold: 0.45 });
    io2.observe(s);
  });

  /* ---------- GSAP layer (progressive) ---------- */
  if (!G || reduce) return;
  var ST = window.ScrollTrigger;
  if (ST) G.registerPlugin(ST);

  // hero entrance is pure CSS; GSAP only counts the facts up
  document.querySelectorAll(".facts b[data-n]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-n")); var pre = el.getAttribute("data-pre") || ""; var suf = el.getAttribute("data-suf") || "";
    var o = { v: 0 };
    G.to(o, { v: target, duration: 1.6, ease: "power2.out", delay: .8, onUpdate: function () { el.textContent = pre + Math.round(o.v) + suf; } });
  });

  if (!ST) return;
  // hero scrub: film recedes into a rounded card as you scroll
  var media = document.querySelector(".hero-media");
  var hero = document.querySelector(".hero");
  if (media && hero && window.matchMedia("(min-width: 640px)").matches) {
    G.to(media, { scale: .94, borderRadius: 28, y: 36, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    G.to(".hero .wrap", { y: -40, opacity: .2, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
  }
  // medicals: cards wipe in from a clip, not a fade
  G.utils.toArray(".med").forEach(function (card, i) {
    G.from(card, { clipPath: "inset(0 0 100% 0 round 22px)", duration: 1, ease: "power3.out", delay: i * .08,
      scrollTrigger: { trigger: card, start: "top 85%", once: true } });
  });
  // stacking steps: earlier cards shrink and dim as the next arrives
  G.utils.toArray(".step").forEach(function (card, i, arr) {
    if (i === arr.length - 1) return;
    G.to(card, { scale: .94, opacity: .55, ease: "none",
      scrollTrigger: { trigger: arr[i + 1], start: "top 80%", end: "top 20%", scrub: true } });
  });
  // doctor photo: colour arrives when you reach it
  var docDuo = document.querySelector(".doc .duo");
  if (docDuo) ST.create({ trigger: docDuo, start: "top 60%", onEnter: function () { docDuo.classList.add("colour"); } });
  // reviews: scale in with slight offset
  G.from(".rev", { y: 30, scale: .98, opacity: 0, duration: .9, ease: "power3.out", stagger: .12, scrollTrigger: { trigger: ".revs", start: "top 80%", once: true } });

  // magnetic pills on fine pointers
  if (fine) document.querySelectorAll(".pill").forEach(function (p) {
    p.addEventListener("pointermove", function (e) {
      var r = p.getBoundingClientRect();
      G.to(p, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .3, duration: .35, ease: "power2.out" });
    });
    p.addEventListener("pointerleave", function () { G.to(p, { x: 0, y: 0, duration: .5, ease: "elastic.out(1,.5)" }); });
  });
})();
