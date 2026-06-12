/* =========================================================
   Shared site behaviour — theme, nav, reveal, tweaks applier
   ========================================================= */
(function () {
  var TWEAK_KEY = "yn_tweaks_v1";
  var THEME_KEY = "yn_theme";

  /* ---- apply persisted tweaks + theme as early as possible ---- */
  function readTweaks() {
    try { return JSON.parse(localStorage.getItem(TWEAK_KEY)) || {}; } catch (e) { return {}; }
  }

  function applyTweaks(t) {
    var root = document.documentElement;
    if (!t) return;
    if (t.accent) root.style.setProperty("--accent", t.accent);
    if (t.density) {
      var s = t.density === "compact" ? 0.82 : t.density === "airy" ? 1.18 : 1;
      root.style.setProperty("--space-scale", s);
    }
    if (t.fontPair) {
      if (t.fontPair === "mincho") {
        root.style.setProperty("--font-display", '"Zen Old Mincho", serif');
        root.style.setProperty("--font-body", '"Zen Kaku Gothic New", system-ui, sans-serif');
      } else if (t.fontPair === "gothic") {
        root.style.setProperty("--font-display", '"Zen Kaku Gothic New", system-ui, sans-serif');
        root.style.setProperty("--font-body", '"Zen Kaku Gothic New", system-ui, sans-serif');
      } else if (t.fontPair === "mono") {
        root.style.setProperty("--font-display", '"Zen Kaku Gothic New", system-ui, sans-serif');
        root.style.setProperty("--font-body", '"Zen Kaku Gothic New", system-ui, sans-serif');
      }
    }
    if (t.worksLayout) root.setAttribute("data-works", t.worksLayout);
    if (typeof t.dark === "boolean") {
      root.setAttribute("data-theme", t.dark ? "dark" : "light");
      try { localStorage.setItem(THEME_KEY, t.dark ? "dark" : "light"); } catch (e) {}
    }
  }

  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", saved);
  }

  initTheme();
  applyTweaks(readTweaks());

  /* ---- DOM ready behaviours ---- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    /* theme toggle button */
    var tBtn = document.querySelector("[data-theme-toggle]");
    if (tBtn) {
      tBtn.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme");
        var next = cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        // keep tweaks panel (if any) in sync
        var t = readTweaks(); t.dark = next === "dark";
        try { localStorage.setItem(TWEAK_KEY, JSON.stringify(t)); } catch (e) {}
        window.dispatchEvent(new CustomEvent("yn-theme", { detail: next }));
      });
    }

    /* mobile nav */
    var navToggle = document.querySelector("[data-nav-toggle]");
    if (navToggle) {
      navToggle.addEventListener("click", function () {
        document.body.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", document.body.classList.contains("nav-open"));
      });
      document.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
      });
    }

    /* scroll reveal */
    var els = document.querySelectorAll(".reveal");
    function reveal(el) { el.classList.add("in"); }
    /* reveal instantly with transition disabled — guarantees visibility even in
       environments where the transition timeline is frozen (offscreen capture) */
    function revealNow(el) {
      el.style.transition = "none";
      el.classList.add("in");
      requestAnimationFrame(function () { el.style.transition = ""; });
    }
    if ("IntersectionObserver" in window && els.length) {
      var vh = window.innerHeight || 800;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (el, i) {
        var top = el.getBoundingClientRect().top;
        if (top < vh * 1.02) {
          /* already in view → show immediately (no scroll animation needed) */
          revealNow(el);
        } else {
          el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
          io.observe(el);
        }
      });
      /* ultimate failsafe — never leave near-view content hidden */
      setTimeout(function () {
        els.forEach(function (el) {
          if (!el.classList.contains("in") && el.getBoundingClientRect().top < (window.innerHeight || 800) * 1.1) {
            revealNow(el);
          }
        });
      }, 1600);
    } else {
      els.forEach(reveal);
    }

    /* header shadow on scroll */
    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 8) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  });

  /* expose for tweaks panel pages */
  window.YN = { applyTweaks: applyTweaks, readTweaks: readTweaks, TWEAK_KEY: TWEAK_KEY };
})();
