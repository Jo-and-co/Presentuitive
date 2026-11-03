/* ============================================================================
   Deck presenter view
   A second WINDOW (not tab) on the laptop while the deck is fullscreen on the
   projector. Synced via BroadcastChannel — local only, no server, no internet.

   HARD RULE: the deck is fully presentable without this. If the
   second window never opens, or the room is stuck on Duplicate rather than
   Extend, the presentation proceeds normally. This file only ever *reads* deck
   state and sends nav intents back; it is never on the critical path. It also
   never touches slide markup or slide CSS — everything it adds is scoped under
   html.is-presenter, which only ever exists in the popped window.

   Opened by pressing P from the deck. The opened window loads the same single
   HTML file with ?presenter, which this script detects.
   ========================================================================= */

(function () {
  'use strict';

  const channel = ('BroadcastChannel' in window)
    ? new BroadcastChannel('deck-channel') : null;
  if (!channel) return;

  const isPresenter = /[?&]presenter\b/.test(location.search);

  // ---- deck side: opener hotkey + Press-N on-deck cue chip -----------------
  // P opens the full presenter WINDOW (unchanged). N toggles a small cue chip
  // in the bottom-right of the deck itself, showing the current scene's cue —
  // OFF by default, fixed-position so it never shifts the deck's layout. It
  // reads the same 'state' broadcast the presenter window uses.
  if (!isPresenter) {
    const NOTES = window.PRESENTER_NOTES || {};
    let chip = null, chipOn = false, last = { si: 0 };

    function ensureChip() {
      if (chip) return chip;
      chip = document.createElement('div');
      chip.id = 'deck-cue-chip';
      chip.setAttribute('data-nav-ignore', '');
      chip.innerHTML =
        '<style>' +
        '#deck-cue-chip{position:fixed;right:18px;bottom:18px;z-index:9999;' +
        'max-width:380px;display:none;padding:14px 16px 12px;border-radius:10px;' +
        "font-family:'Inter',system-ui,sans-serif;" +
        'background:rgba(9,20,32,.93);border:1px solid rgba(120,150,180,.34);' +
        'box-shadow:0 10px 34px rgba(0,0,0,.42);}' +
        '#deck-cue-chip.on{display:block;}' +
        '#dcc-t{font:700 10px/1 Inter,sans-serif;letter-spacing:.22em;' +
        'text-transform:uppercase;color:#E7A23A;margin-bottom:7px;}' +
        '#dcc-b{font:400 15px/1.45 Inter,sans-serif;color:#EAF0F6;}' +
        '#dcc-k{margin-top:9px;font:600 9px/1 Inter,sans-serif;letter-spacing:.14em;' +
        'text-transform:uppercase;color:#6C7E93;}' +
        '</style>' +
        '<div id="dcc-t">&mdash;</div><div id="dcc-b"></div>' +
        '<div id="dcc-k">N to hide</div>';
      document.body.appendChild(chip);
      return chip;
    }
    function renderChip() {
      if (!chipOn || !chip) return;
      const n = NOTES[last.si] || {};
      chip.querySelector('#dcc-t').textContent = n.title || ('Slide ' + (last.si + 1));
      // Reads the same fields the presenter panel does. It used to read n.body,
      // a field the notes stopped carrying at the script-alignment pass, so the
      // chip has been rendering an em dash on every slide since.
      const say = Array.isArray(n.beats)
        ? (n.beats[last.bi] ?? n.beats[n.beats.length - 1])
        : n.say;
      chip.querySelector('#dcc-b').textContent = NOTES.__error || say || '—';
    }
    // The chip is usually toggled on well after notes.txt has landed, but not
    // always — this covers the case where it is already open.
    addEventListener('notes-ready', renderChip);

    // Track deck state off the same broadcast the presenter window listens to.
    // (A BroadcastChannel never receives its own posts, and the engine owns a
    // separate instance, so this handler still sees the engine's 'state'.)
    channel.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'state') { last = ev.data; renderChip(); }
    };
    channel.postMessage({ type: 'request' });

    addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        // Same file, presenter flag. A window (not tab) so it can live on the
        // laptop screen while the deck is fullscreen on the projector. Sized
        // for the two previews plus the notes column.
        const url = location.pathname + '?presenter';
        window.open(url, 'deck-presenter',
          'width=1320,height=860,menubar=no,toolbar=no,location=no');
      } else if (e.key === 'n' || e.key === 'N') {
        ensureChip();
        chipOn = !chipOn;
        chip.classList.toggle('on', chipOn);
        if (chipOn) {
          if (window.Deck && window.Deck.state) last = { si: window.Deck.state.si };
          channel.postMessage({ type: 'request' });
          renderChip();
        }
      }
    });
    return;
  }

  /* ==========================================================================
     PRESENTER SIDE
     Everything below runs only in the popped window.

     The presenter window loads the SAME index.html, so it already contains a
     complete, live deck driven by its own engine instance. That is what makes
     the "current slide" preview exact rather than an approximation: it is the
     real deck at real scale, just re-parented into a 16:9 box. #fit is measured
     by engine.fit() through a ResizeObserver, so moving it into a smaller
     container is all it takes — no second rendering path, no screenshots, and
     nothing in the slide CSS has to know this mode exists.

     SYNC MODEL (one authority, one direction of truth):
       · Any nav intent here is posted as {type:'nav'} to the deck window.
       · The deck window's engine is the authority and answers with {type:'state'}.
       · This window mirrors that state with Deck.jump(si,bi) — a hard cut, which
         is what you want in a preview anyway.
     So it does not matter which window you drive: arrows or clicks in either one
     end at the same (si, bi) in both. The presenter's own engine may advance
     locally first (its keydown handler is the engine's, and read-only); the
     state echo immediately lands it on the same value, so that is a no-op.
     ========================================================================== */

  /* ECHO SUPPRESSION — the one non-obvious thing in this file, and the reason
     the first version of it oscillated at ~13 cycles a second.

     A BroadcastChannel never delivers to the object that posted, but it DOES
     deliver to every other channel object, including ones in the same window.
     This window runs its own engine instance, and that engine owns a separate
     channel. So every mirror jump we make here is broadcast straight back to
     us as if it were the deck talking, one task later — by which time our own
     state has already moved on, so we "correct" to a stale value, broadcast
     that, and the four most recent states orbit each other forever.

     engine.js is read-only, so it cannot stamp its own posts. Instead we stamp
     every post made from THIS window at the prototype, which covers the
     engine's broadcasts as well as ours, and drop anything that comes back
     wearing our own mark. The deck window is never patched, and the deck's
     engine ignores unknown fields, so nothing downstream sees this. */
  const ORIGIN = 'presenter';
  (function stampOwnPosts() {
    const proto = BroadcastChannel.prototype;
    if (proto.__deckStamped) return;
    const orig = proto.postMessage;
    proto.postMessage = function (msg) {
      if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
        msg = Object.assign({}, msg, { _origin: ORIGIN });
      }
      return orig.call(this, msg);
    };
    proto.__deckStamped = true;
  })();

  const NOTES = window.PRESENTER_NOTES || {};   // populated by notes.js
  let elapsed = 0, running = false, timerId = null;
  let cur = { si: 0, bi: 0, beats: 0, scenes: 0, atEnd: false };
  let nextBuiltFor = -1;

  document.documentElement.classList.add('is-presenter');

  const root = document.createElement('div');
  root.id = 'presenter-root';
  // data-nav-ignore: the engine's document-level click handler advances the
  // deck on any click. Without this, clicking the notes panel or a button in
  // this window would fire a nav as well as the button's own action.
  root.setAttribute('data-nav-ignore', '');
  root.innerHTML = `
    <style>
      html.is-presenter, html.is-presenter body {
        overflow: hidden; background: #0B1420; height: 100%;
      }
      /* #fit is re-parented into the current-slide box. It is position:fixed in
         base.css; inside the box it must be absolute, and it keeps its own
         overflow:hidden so nothing paints outside the 16:9 frame. */
      html.is-presenter #fit { position: absolute; inset: 0; }

      #presenter-root {
        position: fixed; inset: 0; display: grid;
        /* The notes column is the working surface — the script is read from it
           under pressure, while the previews only need to be recognisable. So
           the notes take a literal half of the WINDOW (50vw, not half the grid:
           an even 1fr/1fr split loses the padding and the gap and lands at 48%).
           The calc() is the guard rail: on a window narrow enough that 50vw
           would crush the previews, the notes give width back rather than
           overflow, and the left column never drops below 320px. */
        grid-template-columns: minmax(0, 1fr) min(50vw, calc(100% - 320px));
        grid-template-rows: minmax(0, 1fr) auto;
        font-family: 'Inter', system-ui, sans-serif; color: #E8EEF5;
        padding: 18px 20px; gap: 16px 20px; background: #0B1420;
      }

      /* ---- previews ---- */
      #pv-left { min-width: 0; min-height: 0; overflow: hidden; display: grid;
                 grid-template-rows: auto auto; gap: 14px; align-content: start; }
      .pv-cap { font: 600 10px/1 'Inter', sans-serif; letter-spacing: .2em;
                text-transform: uppercase; color: #6C7E93; margin-bottom: 7px; }
      .pv-cap b { color: #C6D4E4; font-weight: 600; letter-spacing: .06em;
                  text-transform: none; font-size: 12px; }
      .pv-stage { position: relative; aspect-ratio: 16 / 9; width: 100%;
                  overflow: hidden; border-radius: 5px; background: #050B14;
                  border: 2px solid #24384F; }
      /* Both previews are width-driven 16:9 boxes, so their HEIGHT is what can
         overrun a short window. The caps below spend the window's leftover
         vertical space (everything not taken by padding, the control row, the
         two captions and the gaps ≈ 175px) as 62% current / 38% next, converted
         back to a width by *16/9. On a 1320x860 popup that lands at roughly
         755x425 and 463x260, and it stays inside the frame as the window is
         resized instead of pushing the next preview off the bottom edge. */
      #pv-cur  .pv-stage { border-color: #38536F;
                           max-width: min(100%, calc((100vh - 175px) * 1.102)); }
      #pv-next .pv-stage { max-width: min(100%, calc((100vh - 175px) * 0.676)); }
      /* The next-slide clone is a still: it must not run entry animations, and
         it must not steal the eye from the live frame above it. */
      #pv-nextscale { position: absolute; top: 0; left: 0; width: 1600px;
                      height: 900px; transform-origin: 0 0; }
      #pv-nextscale, #pv-nextscale * { animation: none !important;
                                       transition: none !important; }
      #pv-next .pv-stage { opacity: .82; }
      #pv-nextend { position: absolute; inset: 0; display: grid; place-items: center;
                    font: 500 15px/1 'Inter', sans-serif; color: #6C7E93; }

      /* ---- notes column ---- */
      #pv-right { min-width: 0; display: grid; grid-template-rows: auto minmax(0,1fr);
                  gap: 14px; }
      #pv-top { display: flex; justify-content: space-between; align-items: baseline; }
      #pv-clock { font: 700 40px/1 'Inter', sans-serif; font-variant-numeric: tabular-nums;
                  letter-spacing: -.02em; }
      #pv-clock.warn { color: #E7A13B; }
      #pv-clock.over { color: #E7593B; }
      #pv-pos { font: 500 13px/1 'Inter', system-ui, sans-serif; color: #7C8DA3;
                letter-spacing: .08em; }
      #pv-notes { background: #12203150; border: 2px solid #24384F; border-radius: 6px;
                  padding: 22px 26px; overflow: auto; }
      #pv-slidetitle { font: 600 13px/1 'Inter', system-ui, sans-serif; letter-spacing: .12em;
                       text-transform: uppercase; color: #5AC2E7; margin-bottom: 16px; }
      /* The panel now shows the script and nothing else, so it is set to be
         read at a glance from a lectern: Arial, large, generous leading. Arial
         is asked for by name — no webfont, no load order to depend on, and the
         same shapes on any machine the deck is opened on. */
      #pv-say { font: 400 30px/1.5 Arial, Helvetica, sans-serif; color: #F4F8FC;
                white-space: pre-wrap; }
      #pv-say:empty { display: none; }
      /* notes.txt did not load. Deliberately the loudest thing in the panel —
         the failure mode this replaces was a panel that looked merely empty. */
      #pv-say.err { font-size: 20px; line-height: 1.55; color: #FF9B8A;
                    border-left: 4px solid #FF6B52; padding-left: 16px; }
      #pv-nextnote { font: 400 15px/1.5 'Inter', sans-serif; color: #94A6BC; margin-top: 20px;
                     padding-top: 14px; border-top: 2px solid #24384F; }
      #pv-nextnote b { color: #C6D4E4; font-weight: 600; }

      /* ---- controls ---- */
      #pv-bottom { grid-column: 1 / -1; display: flex; gap: 10px; align-items: center; }
      .pv-btn { font: 500 12px/1 'Inter', system-ui, sans-serif; letter-spacing: .08em;
                text-transform: uppercase; padding: 12px 16px;
                border: 2px solid #2C4256; background: #16273A; color: #C6D4E4;
                cursor: pointer; border-radius: 4px; }
      .pv-btn:hover { background: #1D3450; }
      .pv-btn:disabled { opacity: .38; cursor: default; }
      .pv-btn:focus-visible { outline: 2px solid #5AC2E7; outline-offset: 2px; }
      #pv-hint { font: 500 11px/1 'Inter', sans-serif; letter-spacing: .1em;
                 text-transform: uppercase; color: #55677D; }
      #pv-beats { display: flex; gap: 5px; margin-left: auto; }
      .pv-beat { width: 20px; height: 6px; border-radius: 2px; background: #2C4256; }
      .pv-beat.on { background: #5AC2E7; }
    </style>

    <div id="pv-left">
      <div id="pv-cur">
        <div class="pv-cap">On screen now</div>
        <div class="pv-stage" id="pv-curstage"></div>
      </div>
      <div id="pv-next">
        <div class="pv-cap">Next &#183; <b id="pv-nexttitle">&#8212;</b></div>
        <div class="pv-stage" id="pv-nextstage">
          <div id="pv-nextscale"></div>
        </div>
      </div>
    </div>

    <div id="pv-right">
      <div id="pv-top">
        <div id="pv-clock">00:00</div>
        <div id="pv-pos">SLIDE 01 / BEAT 0</div>
      </div>
      <div id="pv-notes">
        <div id="pv-slidetitle">&#8212;</div>
        <div id="pv-say">Waiting for the deck&#8230;</div>
        <div id="pv-nextnote"></div>
      </div>
    </div>

    <div id="pv-bottom">
      <button class="pv-btn" data-act="back">&#9664; back</button>
      <button class="pv-btn" data-act="fwd">next &#9654;</button>
      <button class="pv-btn" data-act="timer">&#9654; start timer</button>
      <button class="pv-btn" data-act="reset">reset timer</button>
      <span id="pv-hint">&#8592; &#8594; also work here</span>
      <div id="pv-beats"></div>
    </div>`;
  document.body.appendChild(root);

  const $ = (id) => document.getElementById(id);

  // ---- the live deck becomes the "on screen now" preview --------------------
  const fitBox = document.getElementById('fit');
  if (fitBox) $('pv-curstage').appendChild(fitBox);

  // Both windows run the deck, so both would play a video clip's audio.
  // The projector owns the sound; this window is silent, always.
  function muteAll() {
    document.querySelectorAll('video, audio').forEach((m) => {
      m.muted = true; m.volume = 0;
    });
  }
  muteAll();
  addEventListener('load', muteAll);

  // ---- next-slide preview ---------------------------------------------------
  // A static clone of the next scene with every beat resolved to its final
  // state, so what you see is the slide as the room will see it when you are
  // done clicking through it. Ids are stripped from the clone: duplicate ids
  // would be invalid, and SVG url(#…) references still resolve against the
  // originals, which are identical.
  const nextScale = $('pv-nextscale');

  function fitNext() {
    const box = $('pv-nextstage');
    const s = box.clientWidth / 1600;
    if (s > 0) nextScale.style.transform = `scale(${s})`;
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitNext).observe($('pv-nextstage'));
  addEventListener('resize', fitNext);

  function buildNext(si) {
    if (si === nextBuiltFor) return;
    nextBuiltFor = si;
    nextScale.innerHTML = '';
    const src = document.querySelectorAll('#deck .scene')[si];
    if (!src) {
      const end = document.createElement('div');
      end.id = 'pv-nextend';
      end.textContent = 'End of deck';
      nextScale.appendChild(end);
      fitNext();
      return;
    }
    const clone = src.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.classList.add('live');
    clone.querySelectorAll('[data-b]').forEach((n) => n.classList.add('in'));
    clone.querySelectorAll('video').forEach((v) => {
      v.removeAttribute('autoplay'); v.muted = true; v.volume = 0;
    });
    // The clone sits outside #deck, so give it the board's own paper colour
    // rather than letting the panel behind it show through a light scene.
    nextScale.style.background = getComputedStyle(document.getElementById('deck')).backgroundColor;
    nextScale.appendChild(clone);
    fitNext();
  }

  // ---- render ---------------------------------------------------------------
  function fmt(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  function tickClock() {
    elapsed++;
    const c = $('pv-clock');
    c.textContent = fmt(elapsed);
    c.classList.toggle('warn', elapsed >= 9 * 60 && elapsed < 10 * 60);
    c.classList.toggle('over', elapsed >= 10 * 60);
  }

  function render(m) {
    cur = m;
    // Same numbering the deck's own #slide-no corner counter uses (scene index,
    // zero-based, over the last index) — a presenter panel that disagreed with
    // the number on the projector would be worse than no number at all.
    $('pv-pos').textContent =
      `SLIDE ${m.si}` + (m.scenes ? ` / ${m.scenes - 1}` : '') + `  ·  BEAT ${m.bi}`;

    const note = NOTES[m.si] || {};
    $('pv-slidetitle').textContent = note.title || `Slide ${m.si}`;
    // The panel shows the script only. `say` is the line for this slide; a
    // `beats` array overrides it per beat for the one slide long enough to
    // need it. `body` is the pre-alignment shape, kept so a stale notes source
    // still shows something rather than an empty panel.
    let say = note.say;
    if (Array.isArray(note.beats)) {
      say = note.beats[m.bi] ?? note.beats[note.beats.length - 1] ?? say;
    }
    // Two slides are silent by design (the clip and the breath); everything
    // else having no text is a hole in notes.txt, and should look like one.
    const el = $('pv-say');
    // notes.txt failing to load is NOT the same as a slide having no note, and
    // must not be able to look like one — every slide would read "(no note)"
    // and nothing would say why. The loader parks the reason on __error.
    el.classList.toggle('err', !!NOTES.__error);
    const text = NOTES.__error
      || say || note.body || (note.title ? '' : '(no note for this slide)');
    /* Rewrite and rewind ONLY when the words actually change. This used to run
       on every render, and a render happens on every beat — but the script is
       usually per-SLIDE, so clicking to the next beat re-rendered
       identical text and threw the scroll back to the top. Mid-paragraph, on a
       long note, that loses your place in a sentence you are still speaking.

       The test is the rendered STRING, not si/bi, and that is deliberate: it
       keeps the rewind where a rewind is right (a new slide, or a slide's
       per-beat blocks) and drops it everywhere it was only noise. If two blocks
       are identical on purpose — a click that starts an animation without
       moving the script on — that click holds the scroll too. */
    if (el.textContent !== text) {
      el.textContent = text;
      $('pv-notes').scrollTop = 0;
    }

    const next = NOTES[m.si + 1];
    $('pv-nextnote').innerHTML = m.atEnd
      ? '<b>End of deck.</b> Navigation is locked here for Q&amp;A.'
      : (next ? `<b>Next:</b> ${next.title || ''}` : '');
    $('pv-nexttitle').textContent =
      m.atEnd ? 'end of deck' : ((next && next.title) || `slide ${m.si + 1}`);

    const beats = $('pv-beats');
    beats.innerHTML = '';
    for (let i = 0; i <= m.beats; i++) {
      const b = document.createElement('div');
      b.className = 'pv-beat' + (i <= m.bi ? ' on' : '');
      beats.appendChild(b);
    }

    $('pv-bottom').querySelector('[data-act="fwd"]').disabled = !!m.atEnd;
    $('pv-bottom').querySelector('[data-act="back"]').disabled = (m.si === 0 && m.bi === 0);

    buildNext(m.si + 1);
  }

  /* The panel always renders from THIS window's own engine, never straight from
     a message. That keeps one rendering path whether or not the deck window is
     open: with it open, the mirror below lands local state on the deck's state
     and the hook then renders; with it closed, the local engine is simply the
     only engine and everything still works. Hooks fire once per paint, which is
     exactly once per state change. */
  const localScenes = document.querySelectorAll('#deck .scene');
  function renderLocal() {
    const s = window.Deck.state;
    const beats = +localScenes[s.si]?.dataset.beats || 0;
    render({
      si: s.si, bi: s.bi, beats, scenes: localScenes.length,
      atEnd: s.si === localScenes.length - 1 && s.bi >= beats,
    });
    // Belt and braces: a set piece may call play() on arrival, so keep
    // asserting silence here as well as at load. The projector owns the sound.
    muteAll();
  }
  for (let i = 0; i < localScenes.length; i++) {
    window.Deck.registerHook(i, renderLocal);
  }
  renderLocal();

  /* notes.js reads notes.txt over the network, so the first renderLocal() above
     almost always runs before the script text has arrived — the panel would sit
     on "(no note for this slide)" until the first key press. The loader fires
     this once the object is filled (or once it knows it failed). */
  addEventListener('notes-ready', renderLocal);

  // Mirror the deck window. jump() is a hard cut, which is right for a preview
  // and avoids replaying entry animation on every beat step. The render comes
  // from the hook the jump triggers, not from here.
  channel.onmessage = (ev) => {
    const m = ev.data;
    if (!m || m.type !== 'state') return;
    if (m._origin === ORIGIN) return;     // our own engine's echo, see above
    const s = window.Deck.state;
    if (s.si !== m.si || s.bi !== m.bi) { window.Deck.jump(m.si, m.bi); muteAll(); }
  };
  channel.postMessage({ type: 'request' });

  /* ---- controls -------------------------------------------------------------
     ONE navigation path, for every input, in both windows: post a nav intent
     and let each engine act on it. The local engine is on the far end of the
     channel too (same window, different channel object), so this window
     advances with its normal animation from the same message the projector
     gets — no local Deck.fwd() call, which would advance it twice.

     The audience deck must receive fwd/back and never jump: jump is a hard cut
     and would strip the scene transition off the projector. */
  function nav(dir) { channel.postMessage({ type: 'nav', dir }); }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'fwd') nav('fwd');
    else if (act === 'back') nav('back');
    else if (act === 'timer') {
      running = !running;
      btn.innerHTML = running ? '&#10074;&#10074; pause timer' : '&#9654; start timer';
      if (running) timerId = setInterval(tickClock, 1000);
      else clearInterval(timerId);
    } else if (act === 'reset') {
      elapsed = 0; $('pv-clock').textContent = '00:00';
      $('pv-clock').className = '';
    }
  });

  /* Arrow keys here drive both windows — through the channel, same as the
     buttons. Caught in the CAPTURE phase on window and stopped there, so the
     engine's own bubble-phase keydown never sees these five keys and cannot
     advance this window a second time. Every other key the engine listens for
     (Home, End, O, the -/= zoom nudges) is left alone. */
  const NAV_FWD = new Set(['ArrowRight', 'PageDown', ' ']);
  const NAV_BACK = new Set(['ArrowLeft', 'PageUp']);
  addEventListener('keydown', (e) => {
    if (!NAV_FWD.has(e.key) && !NAV_BACK.has(e.key)) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    nav(NAV_FWD.has(e.key) ? 'fwd' : 'back');
  }, true);
})();
