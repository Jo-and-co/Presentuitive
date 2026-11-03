/* ============================================================================
   Worked example · a 3D planet set piece with four rings

   Not part of the starter. To use it: copy it into js/, add #scope-planet with
   a <canvas id="sp-canvas">, an optional #sp-fallback and an SVG #sp-arrow
   (.sp-arrow-line, .sp-arrow-head), then give each scene a data-tl state.

   A genuine WebGL scene (Three.js, vendored locally under js/vendor/, no CDN)
   rendered into <canvas id="sp-canvas">. The only SVG in the set piece is the
   leader line, whose endpoints this file computes by
   projecting the real 3D band anchors to 2D.

   CAMERA. An ORTHOGRAPHIC camera with frustum (left 0, right 1600, top 0,
   bottom 900) makes world units == stage pixels 1:1, with y growing downward
   exactly like CSS. That means the globe can be placed at the same stage
   coordinates the rest of the deck uses, and projected anchors come back as
   plain stage px. Orthographic also keeps the "flat keynote 3D" read: the
   sphere is sold by LIGHTING (terminator + rim), not by perspective distortion.

   RING WRAP. The ring is one flat RingGeometry disc per band, all in a single
   group tilted about X so it is near edge-on: rotation.x = 90deg - TILT. At
   TILT 23deg the disc's far half sits at negative Z (behind the sphere) and the
   near half at positive Z (in front of it), so the depth buffer produces the
   true Saturn wrap — back-behind / front-over — with no manual arc splitting.
   A shadow-casting key light drops the ring's shadow band onto the globe.

   MECHANISM. engine.js is untouched and owns the signal: it sets
   #scope-planet's data-state and toggles .planet-live / .planet-advancing /
   .planet-settled. This file only OBSERVES those attributes:
     - data-state changes with .planet-advancing present -> PLAY (tween over
       the same ~1.78s window engine.js uses before it adds .planet-settled)
     - data-state changes without it (back / jump / boot) -> SNAP, no tween
     - prefers-reduced-motion -> SNAP always, plus no auto-rotation, no pulse
   The .planet-settled copy gate stays pure CSS on .sp-block and is not touched.
   ========================================================================= */

(function () {
  'use strict';

  const mount = document.getElementById('scope-planet');
  const canvas = document.getElementById('sp-canvas');
  const fallback = document.getElementById('sp-fallback');
  if (!mount || !canvas) return;

  // 'm' force-motion override (engine.js) beats the OS setting, same as the
  // rest of the deck.
  const reduced = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches && !window.__forceMotion;

  /* --- composition, in stage px -------------------------------------------
     Globe anchored lower-right and cropped by the bottom/right stage edges, so
     what shows is its upper hemisphere and a bit more. The ring reaches left to
     x=780, which keeps the whole label column (520-740) and the copy block
     (96-496) clear — the left third is never touched by the object. */
  const CX = 1440, CY = 404, R = 332;
  const TILT_DEG = 31;                       // disc tilt off edge-on
  const BANDS = [                            // inner -> outer, Cassini gaps
    { key: 'a',    inner: 362, outer: 392, phi: 206 },
    { key: 'b',    inner: 402, outer: 432, phi: 198 },
    { key: 'c',   inner: 442, outer: 472, phi: 191 },
    // The fourth band is NOT one more concentric band. It sits OUTSIDE the disc on its own plane, rolled
    // 19deg off it. The tilt is chosen so its projected vertical semi-axis
    // (528 * cos(90-33) = 295) lands INSIDE the globe's radius of 332 — that
    // is what makes it read as an orbit: the near arc crosses over the sphere
    // face and the far arc disappears behind it, rather than ringing the whole
    // composition at a safe distance.
    { key: 'd',    inner: 496, outer: 528, phi: 176, tiltX: 33, tiltZ: -19, hero: true },
  ];
  /* --- the reach-out -------------------------------------------------------
     A checkpoint does not just light up: its band GROWS outward until its
     leftmost tip lands at REACH_X, an elbow arrow steps out from that tip to
     the copy block, and on the next click the band retracts to its slot and
     the arrow goes with it. Only one band is ever reached out at a time.
     The copy block occupies x 96..520, so every part of the arrow is held well
     to the right of 520 — the head stops at 600, an 80px gutter, so a long
     headline or a wrapped support line can never run into it. */
  const REACH_X = 764;    // stage x the expanded band's left tip lands on
  const ARM_X   = 664;    // the elbow's vertical run
  const TIP_X   = 600;    // where the arrowhead stops · 80px clear of the copy
  const TIP_Y   = 300;    // beside the headline
  // The arrow wipes on over this slice of the reach-out: it starts drawing as
  // the band is coming out, not after it has arrived, so the line reads as
  // branching off the ring rather than appearing next to it.
  const WIPE_FROM = 0.42;

  // Each band expands outward into place from this fraction of its radius.
  const GROW_FROM = 0.72;
  // ...and reaches this much further again while it is the active checkpoint.
  const reachScale = (b) => (CX - REACH_X) / b.outer;

  const NAVY      = 0x002E69;   // brand navy · globe body
  const BAND_DIM  = 0x2E5C97;   // dim navy · inactive / "done" band
  const AMBER     = 0xC17D0A;   // the single active accent
  const HERO_DIM  = 0x2F6E93;   // hero orbit unlit · cool teal-navy
  const HERO_HOT  = 0x35D6F0;   // hero orbit lit · glowing cyan
  const RIM       = 0x8DBAEA;   // light-navy tint · rim light only

  // engine.js's copy-gate timer. The object motion runs for exactly this long,
  // so the copy is released the instant the ring lands and the arrow finishes
  // wiping — no dead frame between the motion and the words. If the gate in
  // engine.js moves, this MUST move with it.
  const MOTION_MS = 900;

  let THREE, renderer, scene, camera, globe, rimShell, ringGroup;
  const bandMeshes = [], bandGlows = [], bandPlanes = [], bandX = [0, 0, 0, 0];
  let rafId = null, live = false;
  let current = -1, tween = null, rotY = 0, lastT = null;

  boot();

  async function boot() {
    try {
      THREE = await import('./vendor/three.module.min.js');
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true,
        preserveDrawingBuffer: true,   // lets the frame be captured for QA
      });
    } catch (e) {
      showFallback();
      return;
    }
    if (!renderer) { showFallback(); return; }

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    // y-down frustum: world units are stage px, origin top-left.
    camera = new THREE.OrthographicCamera(0, 1600, 0, 900, -3000, 3000);
    camera.position.z = 1500;
    camera.lookAt(0, 0, 0);

    buildLights();
    buildGlobe();
    buildRing();

    resize();
    addEventListener('resize', resize);

    applyState(readState(), false);   // boot always snaps
    observe();

    live = true;
    tick();
  }

  function resize() {
    renderer.setSize(mount.clientWidth || 1600, mount.clientHeight || 900, false);
  }

  /* --- lighting · one upper-left key, cool fill, so the terminator reads ---- */
  function buildLights() {
    scene.add(new THREE.AmbientLight(0x14315C, 0.5));

    const key = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    key.position.set(CX - 700, CY - 700, 800);   // upper-left, in front
    key.target.position.set(CX, CY, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = key.shadow.camera;
    s.left = -700; s.right = 700; s.top = 700; s.bottom = -700;
    s.near = 10; s.far = 3000;
    key.shadow.bias = -0.0008;
    key.shadow.radius = 4;
    scene.add(key, key.target);

    // cool bounce from lower-right keeps the dark side from going dead black
    const fill = new THREE.DirectionalLight(RIM, 0.30);
    fill.position.set(CX + 600, CY + 400, -500);
    fill.target.position.set(CX, CY, 0);
    scene.add(fill, fill.target);
  }

  /* --- globe · smooth premium navy, no surface texture --------------------- */
  function buildGlobe() {
    globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 128, 128),
      new THREE.MeshPhongMaterial({
        color: NAVY, specular: 0x3A6BB5, shininess: 26,
      })
    );
    globe.position.set(CX, CY, 0);
    globe.receiveShadow = true;
    globe.castShadow = true;
    scene.add(globe);

    // atmospheric rim: an enlarged back-faced shell, additive. Where the globe
    // covers it the depth test hides it, leaving only a thin lit edge.
    rimShell = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.05, 64, 64),
      new THREE.MeshBasicMaterial({
        color: RIM, transparent: true, opacity: 0.30,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    rimShell.position.set(CX, CY, 0);
    scene.add(rimShell);
  }

  /* --- ring · one tilted plane, four concentric bands ---------------------- */
  function grain() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 90;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(14, 3);
    return t;
  }

  // A band sits either in the main disc plane or, if it declares its own
  // tilt, in a private plane of the same centre.
  function planeFor(b) {
    if (b.tiltX === undefined) return ringGroup;
    const g = new THREE.Group();
    g.position.set(CX, CY, 0);
    g.rotation.x = THREE.MathUtils.degToRad(90 - b.tiltX);
    g.rotation.z = THREE.MathUtils.degToRad(b.tiltZ || 0);
    scene.add(g);
    return g;
  }

  function buildRing() {
    ringGroup = new THREE.Group();
    ringGroup.position.set(CX, CY, 0);
    // near edge-on: 90deg puts the disc exactly side-on, so 90-TILT opens it
    // just enough to read as a disc while the far half goes behind the sphere.
    ringGroup.rotation.x = THREE.MathUtils.degToRad(90 - TILT_DEG);
    scene.add(ringGroup);

    BANDS.forEach((b) => {
      const plane = planeFor(b);
      bandPlanes.push(plane);
      const geo = new THREE.RingGeometry(b.inner, b.outer, 256, 1);

      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: BAND_DIM, specular: 0x0E2648, shininess: 6,
        side: THREE.DoubleSide,
        bumpMap: grain(), bumpScale: 1.1,     // granular, not a solid ring
        emissive: 0x14355F,   // floor so a near edge-on band never reads black
        transparent: true, opacity: 0,        // bands fade + expand in on reveal
      }));
      // the hero band is worked in the light tint + a hotter amber so it never
      // reads as "the fourth stripe", lit or unlit
      if (b.hero) {
        mesh.material.color.setHex(HERO_DIM);
        mesh.material.specular = new THREE.Color(0x9BE8F7);
        mesh.material.shininess = 34;
        mesh.material.emissive.setHex(0x14586E);
      }
      mesh.castShadow = true;                  // this is what bands the globe
      plane.add(mesh);
      bandMeshes.push(mesh);

      const glow = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: b.hero ? HERO_HOT : AMBER, transparent: true, opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      }));
      glow.renderOrder = 2;
      plane.add(glow);
      bandGlows.push(glow);
    });
  }

  /* --- the arrow · one elbow, straight segments only -----------------------
     Anchored to the LIVE leftmost tip of the active band (projected from 3D
     each frame while it moves), then two right angles into the copy block.
     No curves: horizontal run, vertical run, horizontal run into the head. */
  function bandTip(i) {
    const plane = bandPlanes[i] || ringGroup;
    plane.updateMatrixWorld(true);
    const v = new THREE.Vector3(-BANDS[i].outer * bandMeshes[i].scale.x, 0, 0)
      .applyMatrix4(plane.matrixWorld).project(camera);
    return [(v.x + 1) / 2 * 1600, (1 - v.y) / 2 * 900];
  }

  function drawArrow(i) {
    const g = document.getElementById('sp-arrow');
    if (!g) return;
    const line = g.querySelector('.sp-arrow-line');
    const head = g.querySelector('.sp-arrow-head');
    // the arrow belongs to the reach-out, not to the band: it wipes out of the
    // ring as the band expands, and unwipes back into it as the band retracts.
    const x = i < 0 ? 0 : bandX[i] || 0;
    const w = clamp01((x - WIPE_FROM) / (1 - WIPE_FROM));
    if (w <= 0) { g.style.opacity = 0; return; }
    const [ax, ay] = bandTip(i);
    if (ax < ARM_X + 24) { g.style.opacity = 0; return; }
    g.style.opacity = 1;
    line.setAttribute('points',
      `${ax.toFixed(1)},${ay.toFixed(1)} ${ARM_X},${ay.toFixed(1)} ${ARM_X},${TIP_Y} ${TIP_X + 10},${TIP_Y}`);
    // polyline point 0 is the band tip, so dashoffset -> 0 draws OUTWARD from
    // the ring toward the copy. Recomputed each frame because the tail moves.
    const L = line.getTotalLength();
    line.style.strokeDasharray  = L.toFixed(2);
    line.style.strokeDashoffset = (L * (1 - w)).toFixed(2);
    head.setAttribute('points',
      `${TIP_X},${TIP_Y} ${TIP_X + 12},${TIP_Y - 6} ${TIP_X + 12},${TIP_Y + 6}`);
    // the head only lands once the stroke has actually reached it
    head.style.opacity = clamp01((w - 0.84) / 0.16).toFixed(3);
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  /* --- state machine ------------------------------------------------------- */
  function readState() {
    const s = +mount.dataset.state;
    return Number.isFinite(s) ? Math.max(0, Math.min(3, s)) : 0;
  }

  function applyState(n, play) {
    const from = current;
    current = n;
    if (!renderer) return;
    if (!play || reduced() || from < 0) {          // SNAP
      tween = null;
      // every band up to n is already out and settled; nothing beyond exists
      bandMeshes.forEach((_, i) => setBand(i, i === n ? 1 : 0, i <= n ? 1 : 0, i === n ? 1 : 0));
      drawArrow(n);
      return;
    }
    tween = { t0: performance.now(), from, to: n };  // PLAY
  }

  /* k = 0 dim/"done", 1 active amber.
     r = 0 not yet revealed (collapsed inward, invisible), 1 fully expanded out.
     Scaling the RingGeometry mesh grows inner and outer radius together, so a
     band emerges from just outside the globe and expands into its own slot —
     the disc builds up one ring at a time instead of arriving whole. */
  function setBand(i, k, r, x) {
    const hero = !!BANDS[i].hero;
    const dimC = hero ? HERO_DIM : BAND_DIM;
    const hotC = hero ? HERO_HOT : AMBER;
    const m = bandMeshes[i].material;
    m.color.setHex(dimC).lerp(new THREE.Color(hotC), k);
    m.emissive.setHex(hero ? 0x14586E : 0x14355F)
     .lerp(new THREE.Color(hotC), k).multiplyScalar(0.22 + 0.14 * k + (hero ? 0.10 : 0));
    m.opacity = r;
    m.visible = r > 0.001;

    // r drives the arrival scale; x drives the temporary reach-out on top of it
    const base = GROW_FROM + (1 - GROW_FROM) * r;
    bandX[i] = x || 0;
    const s = base * (1 + (reachScale(BANDS[i]) - 1) * bandX[i]);
    bandMeshes[i].scale.set(s, s, 1);
    bandGlows[i].scale.set(s, s, 1);
    bandGlows[i].material.opacity = (hero ? 0.85 : 0.5) * k * r;
    bandGlows[i].visible = r > 0.001;
  }

  function stepTween(now) {
    const p = Math.min(1, (now - tween.t0) / MOTION_MS);
    const e = 1 - Math.pow(1 - p, 3);
    // the incoming band expands out slightly behind the colour handoff, so the
    // ring is seen arriving before it lights
    const g = 1 - Math.pow(1 - Math.min(1, p / 0.82), 3);
    // the outgoing band retracts first, the incoming one reaches out after —
    // they never both occupy the left of the stage at the same time
    const outX = 1 - (1 - Math.pow(1 - Math.min(1, p / 0.45), 3));
    const inX  = 1 - Math.pow(1 - Math.max(0, (p - 0.40) / 0.60), 3);
    bandMeshes.forEach((_, i) => {
      if (i === tween.to)        setBand(i, e, tween.to > tween.from ? g : 1, inX);
      else if (i === tween.from) setBand(i, 1 - e, tween.from > tween.to ? 1 - g : 1, outX);
      else                       setBand(i, 0, i <= tween.to ? 1 : 0, 0);
    });
    drawArrow(tween.to);
    if (p >= 1) tween = null;
  }

  function observe() {
    new MutationObserver(() => {
      const n = readState();
      if (n === current) return;
      applyState(n, mount.classList.contains('planet-advancing'));
    }).observe(mount, { attributes: true, attributeFilter: ['data-state', 'class'] });
  }

  /* --- render loop --------------------------------------------------------- */
  function tick(t) {
    rafId = requestAnimationFrame(tick);
    if (!live) return;
    const now = t || performance.now();
    if (lastT == null) lastT = now;
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;

    if (tween) stepTween(now);

    if (!reduced()) {
      rotY += dt * (Math.PI * 2 / 50);          // one revolution / 50s
      globe.rotation.y = rotY;
      if (!tween && current >= 0) {             // gentle pulse on the active band
        const k = 0.88 + 0.12 * Math.sin(now / 700);
        bandGlows[current].material.opacity = (BANDS[current].hero ? 0.85 : 0.5) * k;
      }
    } else {
      globe.rotation.y = 0;
    }

    renderer.render(scene, camera);
  }

  /* --- WebGL fallback · static styled placeholder, never blank -------------- */
  function showFallback() {
    if (rafId) cancelAnimationFrame(rafId);
    live = false;
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  addEventListener('pagehide', () => {
    live = false;
    if (rafId) cancelAnimationFrame(rafId);
  });

  // QA hook only — lets the frame be read back without a visible browser pane.
  window.__spShot = () => canvas.toDataURL('image/png');
})();
