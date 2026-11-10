/* ============================================================================
   Deck engine
   Beats, navigation, fit-to-stage.

   The beat model: each .scene carries data-beats="N"; each revealable element
   carries data-b="k" and becomes visible once the current beat >= k. Beats are
   decoupled from slide count, so one slide can hold six beats or one held frame.

   Deliberate choices:
   - click-to-advance is guarded: a dead zone and a Q&A lock so a stray click on
     the final slide moves nothing
   - reverse navigation never replays animation (.instant for one frame)
   - counts, draws and grows are driven from data attributes, not hard-coded
   - the fit never bakes in scale(0): it waits for a real viewport

   Also:
   - AUTO-ADVANCE: beats within a slide fire on per-slide tuned delays
     (data-auto="d1,d2,..." in seconds — d[k] is the wait before beat k+1).
     Slide-to-slide stays manual. A manual advance fires the pending beat
     immediately and re-arms the remaining schedule. Backward nav cancels the
     schedule (presenter has taken control); the next forward input resumes it.
     A delay list shorter than the beat count leaves the tail beats manual —
     useful when a video's audio is cued by hand.
   - TIMELINE: a deck-level persistent element (#timeline) that scenes opt into
     via data-tl="N"; the engine mirrors N onto the element so CSS can pan it
     continuously across a run of scenes.
   ========================================================================= */

(function () {
  'use strict';

  const deck = document.getElementById('deck');
  const scenes = [...document.querySelectorAll('.scene')];

  // Presenter channel — populated only if presenter.js is loaded. Guarded so
  // the deck runs identically with or without it (hard rule: never a dependency).
  const channel = ('BroadcastChannel' in window)
    ? new BroadcastChannel('deck-channel') : null;

  const state = { si: 0, bi: 0 };

  // directional transitions. navMode is the intent of the pending paint:
  //   'fwd'  — advance; scene slides in from the right, beats animate.
  //   'back' — reverse; scene slides in from the left, but its beats SNAP
  //            (.rewind) so nothing the presenter already saw replays.
  //   'jump' — goto/presenter/Home/End/boot; hard cut, no slide.
  // renderedSi tracks the last painted scene so the slide only fires on a real
  // scene change, never on a beat advance within a scene.
  let navMode = 'jump';
  let renderedSi = -1;

  // --- fit ------------------------------------------------------------------
  // Scale the fixed 1600x900 stage into the viewport, contain-fit, and CENTRE it
  // by translation. relying on CSS grid place-items to centre #deck
  // was the bug behind most "cropped" reports — an oversized
  // transformed child is pinned to the start edge, not centred, so on any
  // viewport narrower than 1600 CSS px the deck sat off toward bottom-right
  // (top-left measured at 800(1-s),450(1-s), which nets to zero only at exactly
  // 1600 wide — the one width the deck was ever tested at). #deck now has
  // transform-origin 0 0 and this function applies translate()+scale() so the
  // margins are always symmetric, at every viewport size.
  //
  // `nudge` is a session-persistent manual multiplier on the auto-fit scale.
  // The `-` / `=` keys step it ±3% per press so the user can pull the whole deck
  // in until the room stops cropping it. It survives resize/refit — the refit
  // recomputes the base fit but re-applies the same nudge, so it never snaps
  // back to 100%. A smaller nudge grows the margins symmetrically (still
  // centred), which is exactly what clears a projector's overscan.
  let nudge = 1;
  const NUDGE_STEP = 0.03;
  const NUDGE_MIN = 0.6, NUDGE_MAX = 1.15;

  const fitBox = document.getElementById('fit');
  function fit() {
    // Measure the fit container, not window.innerWidth: some embedding surfaces
    // report innerWidth/Height as 0 at boot, which would bake in scale(0).
    const w = fitBox?.clientWidth || innerWidth || 1600;
    const h = fitBox?.clientHeight || innerHeight || 900;
    const s = Math.min(w / 1600, h / 900) * nudge;
    if (s > 0) {
      // Centre by translation (origin is 0 0). tx/ty use the SAME w/h that set
      // s, so the fit is exact regardless of the container's real pixel size.
      const tx = Math.round((w - 1600 * s) / 2);
      const ty = Math.round((h - 900 * s) / 2);
      deck.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    }
  }
  addEventListener('resize', fit);
  // A ResizeObserver catches the case where the container gets its real size
  // only after first layout — without it the deck can stick at scale(0).
  if ('ResizeObserver' in window && fitBox) new ResizeObserver(fit).observe(fitBox);

  function bumpZoom(dir) {
    nudge = Math.max(NUDGE_MIN, Math.min(NUDGE_MAX,
      +(nudge + dir * NUDGE_STEP).toFixed(3)));
    fit();
  }

  // --- beat count helper ----------------------------------------------------
  const beatsIn = (scene) => +scene.dataset.beats || 0;

  // --- SVG path length priming ---------------------------------------------
  // Draw animations need the path length as a CSS var. Compute once, cache on
  // the element. Duration for data-register draws scales with length so a long
  // line and a short line feel like the same speed of ink.
  function primeDraws(scene) {
    scene.querySelectorAll('.m-c-draw, .m-d-draw').forEach((p) => {
      if (p.dataset.len) return;
      let len = 1200;
      try { len = p.getTotalLength() || 1200; } catch (e) { /* non-path */ }
      p.dataset.len = len;
      p.style.setProperty('--len', len);
      if (p.classList.contains('m-d-draw')) {
        // 0.9s at 600px, clamped so extremes stay sane
        const dur = Math.max(0.5, Math.min(1.3, len / 600 * 0.9));
        p.style.setProperty('--len-dur', dur.toFixed(2) + 's');
      }
    });
  }

  // --- number count-up ------------------------------------------------------
  // data-count target, optional data-pre / data-post / data-dur. Register D.
  function countUp(el) {
    const to = +el.dataset.count;
    const from = +el.dataset.from || 0;
    const dur = +el.dataset.dur || 800;
    const pre = el.dataset.pre || '';
    const post = el.dataset.post || '';
    let t0 = null;
    function tick(t) {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);              // ease-out cubic
      el.textContent = pre + Math.round(from + (to - from) * e) + post;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function setCountFinal(el) {
    el.textContent = (el.dataset.pre || '') + el.dataset.count + (el.dataset.post || '');
  }

  // --- paint ----------------------------------------------------------------
  // The single source of truth: given (si, bi), make the DOM match. instant=true
  // suppresses all animation (used on load, reverse nav, and jumps).
  function paint(instant) {
    const sceneChanged = renderedSi !== state.si;
    renderedSi = state.si;

    // direction: expose it only on a real scene change so the container
    // slide (base.css) picks left vs right. A beat advance leaves .live where
    // it is, so its keyframe never re-fires. Jumps map to a state with no
    // matching slide rule -> hard cut.
    if (sceneChanged) deck.dataset.dir = navMode;

    // Suppression: a jump/boot hard-cuts the whole deck (.instant). A back step
    // instead snaps ONLY the incoming scene's beats (.rewind kills descendant
    // transitions) while letting the scene CONTAINER still slide, so reverse
    // navigation reads as motion without replaying beats.
    if (navMode === 'back') scenes[state.si].classList.add('rewind');
    else if (instant) deck.classList.add('instant');

    scenes.forEach((s, i) => s.classList.toggle('live', i === state.si));

    const scene = scenes[state.si];
    primeDraws(scene);

    // Spine changes state at slide transitions only; sync is a no-op unless the
    // zone actually changed, so it never re-renders mid-slide (invariant 4).
    window.Spine?.sync(scene);

    // The persistent timeline: scenes opt in with data-tl="N". The element
    // lives at deck level so its pan survives slide transitions — that
    // continuity IS the device. State only; motion is CSS.
    const tl = document.getElementById('timeline');
    if (tl) {
      const ts = scene.dataset.tl;
      tl.classList.toggle('tl-live', ts !== undefined);
      if (ts !== undefined) tl.dataset.state = ts;
    }

    // an optional 3D object (#scope-planet) rides the SAME signal as #timeline: the active
    // scene's data-tl becomes data-state. One persistent deck-level
    // element, no second navigation model.
    //
    // PLAY vs SNAP. A real forward STEP into a higher state (navMode 'fwd', a
    // genuine scene change, not a jump) PLAYS the incoming layer's orbit→nest
    // choreography once. Every other arrival — back-step, jump/presenter goto,
    // boot, or reduced motion — SNAPS straight to the settled object: no replay,
    // no half-built frame. This reuses the engine's own navMode/instant signals
    // rather than inventing a second notion of direction.
    //
    // COPY GATE. Copy for a state is released only AFTER its object motion
    // settles. On a play we add .planet-settled on a timer sized to the
    // choreography; on a snap we add it immediately. .planet-advancing is only a
    // trigger for the CSS keyframes and may be cleared on the next tick — the
    // copy no longer depends on it, so it can't be released early.
    const planet = document.getElementById('scope-planet');
    if (planet) {
      const ps = scene.dataset.tl;
      const live = ps !== undefined;
      planet.classList.toggle('planet-live', live);
      if (live) {
        const prev = planet.dataset.state;
        if (prev !== ps) {                       // state actually changed
          const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
          const advancing = navMode === 'fwd' && sceneChanged && !instant && !reduce
                            && prev !== undefined && +ps > +prev;
          clearTimeout(planet._settleT);
          planet.dataset.state = ps;
          if (advancing) {
            // hold prior state, play the object motion, then release the copy
            planet.classList.add('planet-advancing');
            planet.classList.remove('planet-settled');
            planet._settleT = setTimeout(
              () => planet.classList.add('planet-settled'), 900);
          } else {
            // snap: object + copy settled at once, no choreography
            planet.classList.remove('planet-advancing');
            planet.classList.add('planet-settled');
          }
        }
        // same-state re-render (beat advance): leave the classes untouched so a
        // running settle timer and any playing keyframe are never disturbed.
      }
    }

    // Invert the persistent rail over dark (rare full-bleed) scenes.
    document.getElementById('rail')?.classList.toggle('on-dark',
      scene.classList.contains('on-dark') || scene.hasAttribute('data-dark'));

    scene.querySelectorAll('[data-b]').forEach((el) => {
      const b = +el.dataset.b;
      const on = state.bi >= b;
      const was = el.classList.contains('in');
      el.classList.toggle('in', on);

      // data-dim-after: element recedes (not vanishes) once a later beat lands
      if (el.dataset.dimAfter) {
        el.classList.toggle('dim', state.bi > +el.dataset.dimAfter);
      }

      // Only the beat that just turned on gets the little settle delay, so a
      // scene arriving with several beats already lit does not stagger.
      // never write an inline delay on a .stg element -- an inline
      // transitionDelay beats the .stg CSS calc and silently kills the sibling
      // cascade. For staggered siblings, let motion.css own the delay.
      if (el.classList.contains('stg')) {
        el.style.transitionDelay = '';
      } else {
        el.style.transitionDelay = (on && state.bi === b && !instant) ? '60ms' : '0ms';
      }

      // counts: the beat element itself, or anything inside it
      const counts = [...(el.matches('[data-count]') ? [el] : []), ...el.querySelectorAll('[data-count]')];
      if (on && !was && !instant) counts.forEach(countUp);
      else if (on && instant) counts.forEach(setCountFinal);
    });

    // Elements whose *content* is driven by a beat (set piece hooks register
    // callbacks here). Each hook is (scene, bi, instant).
    (hooks[state.si] || []).forEach((fn) => fn(scene, state.bi, instant));

    if (instant) {
      // the flakiness fix. The old code removed .instant on the
      // NEXT animation frame (~16ms later). Any beat advance that landed in that
      // window (reverse-then-forward, a fast double-press, boot->goto) ran while
      // .instant still forced transition:none on the whole deck, so it snapped
      // instead of animating. Whether an input fell inside the window depended on
      // timing -> "sometimes works, sometimes doesn't".
      //
      // Instead, force a synchronous reflow so the instant final state is flushed
      // NOW (with transitions off), then remove .instant in the SAME tick. The
      // animatable values are already committed, so re-enabling transitions
      // starts nothing -- and there is no async window for a later input to fall
      // into. Forward beats after this animate normally.
      void deck.offsetWidth;
      deck.classList.remove('instant');
    }

    if (navMode === 'back') {
      // Same synchronous-flush trick, scoped to the incoming scene: commit the
      // snapped beat state with transitions off, then re-enable in this tick.
      // The scene CONTAINER (not a descendant) keeps its directional slide.
      const s = scenes[state.si];
      void s.offsetWidth;
      s.classList.remove('rewind');
    }

    broadcast();
  }

  // --- per-scene hooks ------------------------------------------------------
  // Set pieces register a function keyed by scene index to run custom logic on
  // each paint (e.g. the tools extinguishing, the trust line). Kept out of the
  // core so the engine stays generic.
  const hooks = {};
  function registerHook(sceneIndex, fn) {
    (hooks[sceneIndex] = hooks[sceneIndex] || []).push(fn);
  }

  // --- auto-advance ---------------------------------------------------------
  // data-auto="d1,d2,..." (seconds): d[k] is the wait before beat k+1 fires,
  // measured from the previous beat (or slide entry). Tuned per slide against
  // the script's spoken time — motion completes by ~80% of the paragraph.
  // Runs under reduced motion too: this is speech pacing, not decoration.
  let autoTimers = [];
  function clearAuto() { autoTimers.forEach(clearTimeout); autoTimers = []; }

  function armAuto() {
    clearAuto();
    const scene = scenes[state.si];
    if (state.bi >= beatsIn(scene)) return;
    const list = (scene.dataset.auto || '')
      .split(',').map(parseFloat);
    const d = list[state.bi];                 // delay before beat (bi+1)
    if (!isFinite(d)) return;                 // past the list → manual beat
    autoTimers.push(setTimeout(() => {
      if (state.bi < beatsIn(scenes[state.si])) {
        state.bi++; paint(false); armAuto();  // chain the next delay
      }
    }, d * 1000));
  }

  // --- navigation -----------------------------------------------------------
  function totalBeats() { return scenes.reduce((n, s) => n + beatsIn(s) + 1, 0); }

  function atEnd() {
    return state.si === scenes.length - 1 && state.bi >= beatsIn(scenes[state.si]);
  }

  function fwd() {
    navMode = 'fwd';
    clearAuto();                              // manual advance reflows timers
    if (state.bi < beatsIn(scenes[state.si])) { state.bi++; paint(false); armAuto(); }
    else if (state.si < scenes.length - 1) { state.si++; state.bi = 0; paint(false); armAuto(); }
    // else: at the very end — do nothing. Q&A safety.
  }

  function back() {
    navMode = 'back';
    // Backward = the presenter has taken control; cancel the schedule and do
    // NOT re-arm. The next forward input fires immediately and resumes it.
    clearAuto();
    if (state.bi > 0) { state.bi--; paint(true); }
    else if (state.si > 0) { state.si--; state.bi = beatsIn(scenes[state.si]); paint(true); }
  }

  function jump(si, bi) {
    navMode = 'jump';
    clearAuto();                              // jumps (goto/presenter) don't arm
    state.si = Math.max(0, Math.min(scenes.length - 1, si));
    state.bi = Math.max(0, Math.min(beatsIn(scenes[state.si]), bi ?? 0));
    paint(true);
  }

  // --- input ----------------------------------------------------------------
  addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'Enter':
        e.preventDefault(); fwd(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace':
        e.preventDefault(); back(); break;
      case 'Home': e.preventDefault(); jump(0, 0); break;
      case 'End': e.preventDefault(); jump(scenes.length - 1, beatsIn(scenes[scenes.length - 1])); break;
      case 'f': case 'F':
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;

      // manual zoom nudge for projector overscan (centre-shrink)
      case '-': case '_': e.preventDefault(); bumpZoom(-1); break;
      case '=': case '+': e.preventDefault(); bumpZoom(+1); break;
      case '0': e.preventDefault(); nudge = 1; fit(); break;   // reset zoom

      // force-motion override: insurance against a borrowed machine or
      // battery-saver silently flattening the deck via prefers-reduced-motion.
      case 'm': case 'M': {
        e.preventDefault();
        const on = document.documentElement.classList.toggle('force-motion');
        window.__forceMotion = on;
        break;
      }
    }
  });

  // Click to advance, with two guards:
  //   - the left 15% is a back zone (a familiar click-to-go-back habit)
  //   - clicks on the final beat do nothing (Q&A safety)
  // Clicks that originate on an interactive element (overview grid) are ignored.
  addEventListener('click', (e) => {
    if (e.target.closest('[data-nav-ignore]')) return;
    if (e.clientX < innerWidth * 0.15) { back(); return; }
    if (atEnd()) return;
    fwd();
  });

  // --- presenter sync -------------------------------------------------------
  function broadcast() {
    if (!channel) return;
    channel.postMessage({
      type: 'state',
      si: state.si, bi: state.bi,
      beats: beatsIn(scenes[state.si]),
      scenes: scenes.length,
      atEnd: atEnd(),
    });
  }
  if (channel) {
    channel.onmessage = (ev) => {
      const m = ev.data;
      if (m.type === 'nav') {
        if (m.dir === 'fwd') fwd();
        else if (m.dir === 'back') back();
        else if (m.dir === 'jump') jump(m.si, m.bi);
      } else if (m.type === 'request') {
        broadcast();
      }
    };
  }

  // --- boot -----------------------------------------------------------------
  // Wait for fonts before the first paint so nothing reflows after the title is
  // already composed (the title must not open on a blank or shifting frame).
  // ?goto=SI or ?goto=SI.BI jumps to a scene/beat on load (instant). Used for
  // QA screenshots and harmless in the live deck (no param = normal start).
  function applyGoto() {
    const m = /[?&]goto=(\d+)(?:\.(\d+))?/.exec(location.search);
    if (m) jump(+m[1], m[2] ? +m[2] : 0);
  }

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    fit();
    paint(true);
    applyGoto();
    // The container may not have its final size on the first fit (some surfaces
    // report 0 or a stale width at boot). Refit after layout settles and on the
    // window load event so the deck never sticks oversized before first paint.
    requestAnimationFrame(fit);
    addEventListener('load', fit);
    setTimeout(fit, 120);
    // the opening title stagger. boot()'s paint(true) hard-cuts
    // the deck with .instant, which zeroes every animation for that frame; the
    // title's entrance would be swallowed. Mark the root .booted one frame LATER
    // (after .instant is gone), and the title CSS is gated on .booted so the
    // stagger fires cleanly on a real frame. Deterministic — no reliance on the
    // ambiguous same-tick duration flip.
    const markBooted = () => document.documentElement.classList.add('booted');
    requestAnimationFrame(() => requestAnimationFrame(markBooted));
    // Fallback: if rAF is throttled (backgrounded tab), still reveal the title
    // rather than leave it stuck at the pre-boot opacity:0 resting state.
    setTimeout(markBooted, 100);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
    // Safety: never let a slow font block the deck from appearing.
    setTimeout(boot, 600);
  } else {
    boot();
  }

  // --- public surface -------------------------------------------------------
  // Set pieces and the overview grid use these; nothing else is exposed.
  window.Deck = {
    registerHook,
    jump,
    fwd,
    back,
    get state() { return { ...state }; },
    scenes,
    countUp,
  };
})();
