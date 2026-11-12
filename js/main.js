/* ============================================================
   main.js — Animasi halaman.
   Aturan desain: TIDAK ada pola opacity:0 di CSS. Semua keadaan
   awal animasi dipasang oleh JS (gsap.from), jadi tanpa JS pun
   seluruh teks tetap terbaca.
   ============================================================ */

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Bilah progres baca di paling atas ---------- */
  gsap.to('#progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ---------- Kemunculan teks per section ---------- */
  gsap.utils.toArray('.panel').forEach(function (panel) {
    var items = panel.querySelectorAll('.reveal');
    if (!items.length) return;
    gsap.from(items, {
      y: 44,
      autoAlpha: 0,
      duration: 1.05,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: panel, start: 'top 68%' }
    });
  });

  /* ---------- Koreografi objek 3D mengikuti scroll ----------
     Satu timeline besar, di-scrub sepanjang halaman. Keadaan
     awal objek (Hero) dipasang di scene.js. */
  var WAYPOINTS = [
    { px: -0.90, py: 1.95, s: 0.50, spin: 1.5 },  /* Tentang    — atas, kecil: tidak menutupi biodata/foto */
    { px:  1.85, py: 0.10, s: 0.92, spin: 0.8 },  /* Keahlian   — kanan           */
    { px:  2.30, py: 1.70, s: 0.48, spin: 1.9 },  /* Karya      — pojok atas jauh */
    { px: -1.70, py: 0.0,  s: 0.85, spin: 1.2 },  /* Pengalaman — kiri            */
    { px:  0.0,  py: 1.55, s: 0.78, spin: 0.9 }   /* Kontak     — tengah atas     */
  ];

  function buildChoreography() {
    var knot = window.__knotState;
    if (!knot) return;
    var tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7
      }
    });
    WAYPOINTS.forEach(function (w) {
      /* Tiba lebih dulu (0.7), lalu diam menemani section dibaca (0.3). */
      tl.to(knot, { px: w.px, py: w.py, s: w.s, spin: w.spin, duration: 0.7 });
      tl.to(knot, { duration: 0.3 });
    });
  }

  if (window.__knotState) {
    buildChoreography();
  } else {
    var built = false;
    window.addEventListener('scene-ready', function () {
      if (built) return;
      built = true;
      buildChoreography();
      ScrollTrigger.refresh();
    });
    /* Pengaman: bila WebGL gagal, halaman tetap berjalan tanpa 3D. */
    setTimeout(function () {
      if (!built && window.__knotState) { built = true; buildChoreography(); }
    }, 2500);
  }
})();
