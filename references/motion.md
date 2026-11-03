# Motion

Everything here is implemented in `assets/starter/` (`styles/motion.css`, `styles/base.css`, `js/engine.js`).

## Contents

1. Invariants
2. Beats
3. Registers
4. The morph
5. Wipes and count-ups
6. Scene transitions and tiers
7. Speech pacing and auto-advance
8. Clicks and navigation
9. Set pieces
10. Three.js recipe
11. Reduced motion

## 1. Invariants

- **Motion argues, it never decorates.** An earlier deck failed by one gesture applied 77 times (`opacity 0→1 + translateY(30px)` at .42s).
- Animate `transform`, `opacity`, and `stroke-dashoffset`. Nothing that triggers layout.
- Calm elsewhere, one or two moving elements per view, a few named wow moments.
- **A change has to be visible to count.** Duration alone is measurable but invisible at 22px of travel. If it should look different, change the gesture.
- Cinematic morphs run .7–.95s. Generic 150–300ms advice applies to micro-interactions, not compositional moves.
- Never assert a move's direction or size before measuring. One promised "rises ~80px" became 74px down, and another became `translateX(14px) scale(.94)` because the figure was flush at the edge. Both were disclosed. Disclose yours.

## 2. Beats

```css
[data-b]{opacity:0} [data-b].in{opacity:1} [data-b].dim{opacity:.26}
```

- A scene declares `data-beats="N"`. Beat index runs `0..N`, so **`data-beats="2"` is three states and three note blocks.** Elements carry `data-b="k"`, and `data-dim-after` to dim later.
- `paint(instant)` is the single source of truth. Back and jump use the same paint.
- `.stg` elements stagger with `--i`: `.stg.stg { transition-delay: calc(var(--i,0) * var(--stagger)); }`. The doubled selector beats the register shorthand. `--stagger` 70ms; don't go past about `--i=6`. Never give `.stg` an inline `transitionDelay`.
- `data-tl` mirrors the beat to `#timeline[data-state]` (`.tl-live`) and `#scope-planet[data-state]` (`.planet-live`). Dormant if those elements are absent. For multi-beat objects that outlive one scene.

## 3. Registers

Each is a different **gesture**, not a different duration.

| Class | Register | Gesture | Use |
|---|---|---|---|
| `.m-b` | Editorial | translateY 12px, .40s `--ease-entrance`; `.m-b-rule` scaleX .46s | Sentences, headings |
| `.m-c` | Precision | scale .985, .22s `--ease-prec`, zero travel; `.m-c-draw` stroke .34s | Diagrams, labels, UI-like parts |
| `.m-d` | Data | `.m-d-draw` line draw, `.m-d-grow` scaleX .75s, `.m-d-rise` scaleY, `.m-d-count`, `.m-d-weight` scale 1.03→1 | Numbers, charts |
| `.m-a` | Cinematic | translateY 24px with letter-spacing settling, 1.1s `--ease-cine`; `.m-a-slow` 1.4s with .18s hold; `.m-a-swap` | **Scarce.** Name the moments in the brief. The source deck allowed four. |

Eases: `--ease-data cubic-bezier(.22,.61,.36,1)`, `--ease-prec cubic-bezier(.4,0,.2,1)`, `--ease-cine cubic-bezier(.16,.84,.28,1)`, `--ease-entrance cubic-bezier(.22,1,.36,1)`.

## 4. The morph

**One object physically relocates on a beat to make room for another.** It expresses cause and effect, and it often solves an overlap too: move the graph aside and the words have room.

Rules: `transform` only. Gate with `:has(.X.in)` or a sibling selector. Delay the arriving copy until the mover has mostly landed. Give it a reduced-motion escape.

Real examples:

```css
/* A field starts centred, slides over when the second half arrives */
.opp-field {
  position: absolute; left: 0; right: 0; top: 72px;
  display: grid; grid-template-columns: 1fr 1fr; column-gap: 96px; align-items: start;
  transform: translateX(376px);
  transition: transform .82s var(--ease-cine);
}
.scene[data-scene="heading"]:has(.opp-pull.in) .opp-field { transform: none; }
.opp-pull .opp-line { transition-delay: .34s; }
.opp-pull .opp-sub  { transition-delay: .44s; }
.opp-pull .opp-name { transition-delay: .54s; }

/* Sibling gate: text drops as a line arrives above it */
.rs-body { position: absolute; left: 96px; top: 292px; width: 520px; transition: transform .88s var(--ease-cine); }
.rs-d2.in ~ .rs-body { transform: translateY(74px); }

/* A figure shrinks and shifts as the pivot text arrives */
.scene[data-scene="cycle"]:has(.cycle-pivot.in) .cycle-figure {
  transform: translateX(14px) scale(.94);
  transition: transform .9s var(--ease-cine);
}

/* A line lifts to make room for what comes next */
.tk-line { transition: transform .72s var(--ease-cine); }
.scene[data-scene="takeaway"]:has(.tk-qualities.in) .tk-line { transform: translateY(-20px); }

/* A chart moves aside for its takeaway */
.scene[data-scene="chart-aside"] .radar-svg { transition: transform .95s var(--ease-cine); }
.scene[data-scene="chart-aside"]:has(.rad-takeaway.in) .radar-svg { transform: translateX(96px); }
```

Reduced-motion escape:

```css
@media (prefers-reduced-motion: reduce) {
  :root:not(.force-motion) .demo-figure { transition: none; }
}
```

Scene-scope every morph with `data-scene`. Measure both end states: a morph that clears the overlap at rest can still collide midway or at the other end.

## 5. Wipes and count-ups

**Masked wipe:** `transition: opacity 0s linear, clip-path .78s`. Negative insets keep ascenders and descenders: `inset(-.18em 100% -.32em 0)`.

**Line draw:** `.m-d-draw` uses `--len`, which the engine sets from `getTotalLength()`. `--len-dur` = clamp(.5, len/600*.9, 1.3)s.

**Count-up:** `<text class="cyc-x" data-count="24" data-from="0" data-dur="520">24</text>`. Options `data-from`, `data-dur`, `data-pre`, `data-post`. Ease-out cubic. Snaps to final on instant. Keep it fast.

**Fading the previous sentence:** strongly. A weak fade leaves two things competing.

**Ambient loops** (pulses, gentle drift) can run until a click, but only where the slide is about something alive.

## 6. Scene transitions and tiers

Set with `data-tier` on the section. Default `--scene-fade .30s`, `--scene-rise .46s`, `sceneInFwd` translate(22px,8px), `sceneInBack` translate(-22px,8px). Dark scenes `.46s/.56s`.

| Tier | Use | Timing | Gesture |
|---|---|---|---|
| 1 | Act breakers | .58s / .92s | `actBreakFwd` translate(0,104px) scale(.988); back translate(0,-72px) scale(.992) |
| 2 | Landings, big statements | .50s / .62s | Default gesture, slower |
| 3 | Continuations; the pair reads as one move | .22s / .34s | Default gesture, faster |

Thirty-four slides that all do the big move read as a template; four that do it read as structure. A jump hard-cuts.

The source deck's assignment as a sense of proportion, of 32 scenes: 4 breakers, 4 landings, 8 continuations, the rest default.

## 7. Speech pacing and auto-advance

- Speech runs about **145 wpm**. Motion must finish before the paragraph does, about 80% of `words ÷ 145 × 60` seconds.
- `data-auto="d1,d2,..."`: `d[k]` is seconds to wait **before beat k+1**. A short list leaves later beats manual. A missing entry *is* a manual beat: `data-auto=",3"` makes beat 1 manual and fires beat 2 three seconds later. Do not pad. Manual advance fires the pending beat and re-arms. Runs under reduced motion, since it's speech pacing rather than decoration.
- Use it for lists spoken at a known pace. Use manual for anything the speaker may pause on.

## 8. Clicks and navigation

- One click per spoken idea.
- Keys: arrows, space, PageUp/PageDown, Enter, Backspace, Home/End. `F` fullscreen, `P` presenter, `N` on-deck cue chip, `M` force motion, `-`/`=` zoom nudge, `0` reset. `?goto=SCENE.BEAT`.
- Click: left 15% goes back. `[data-nav-ignore]` is ignored. The final beat of the deck does nothing, for Q&A safety.
- Back snaps the incoming scene's beats and slides the scene in without replaying what's inside it (`.rewind`). Ambient keyframes keep running.
- `.instant` removal happens in the same tick (`void deck.offsetWidth; deck.classList.remove('instant')`). Removing it in rAF let later inputs snap intermittently.

## 9. Set pieces

For choreography beats can't express. `Deck.registerHook(sceneIndex, fn(scene, bi, instant))` in `js/setpieces.js`.

**PLAY forward, SNAP otherwise.** Forward entry with motion allowed plays. Back, jump and reduced motion snap to the final state of that beat. The gate:

```js
advancing = navMode==='fwd' && sceneChanged && !instant && !reduce && prev!==undefined && +ps > +prev
```

Play adds `.planet-advancing`, removes `.planet-settled`, and sets `.planet-settled` after 900ms. Snap sets it at once. Same-state beats leave classes alone.

Sequencing rules from the planet:

- Outgoing copy clears before the incoming layer moves.
- Incoming copy appears only after the object settles. **Verify by sampling opacity over the advance.** A report once claimed copy was gated when it was at opacity 1 at about 200ms.
- One advance per stage. Hard-cut out after the set piece.
- Lock the mechanism (state machine, gates) while re-skinning the art, so art rounds can't break timing.

## 10. Three.js recipe

Real WebGL when the object must read as 3D. Full file: `assets/examples/planet-3d.js`.

- Vendor Three.js locally (`js/vendor/`). No CDN. Loaded by `<script type="module">`.
- `<canvas id="sp-canvas">` plus a fallback element for no WebGL.
- **Orthographic camera** with frustum (0,1600,0,900), so world units are stage px, y down. "Flat keynote 3D": sold by lighting (terminator and rim), not perspective.
- Rings: a flat `RingGeometry` disc per band in a group tilted about X (`rotation.x = 90deg − TILT`), so the depth buffer gives true wrap-around.
- A shadow-casting key light drops the ring shadow on the globe.
- The only SVG left is leader lines, from projected 3D anchors.
- The engine owns the signal (`data-state`, `.planet-advancing`, `.planet-settled`). The 3D file only observes.
- PLAY about 1.78s tween, SNAP on back. Reduced motion always snaps.
- Example values: `CX 1440, CY 404, R 332, TILT 31`; bands 362–392, 402–432, 442–472; hero band 496–528 on its own plane (tiltX 33, tiltZ −19).

Direction that worked: "Sleek keynote 3D, NOT photoreal". The first attempt failed and was re-issued with a tighter brief.

## 11. Reduced motion

Automated browsers force reduced motion on, so **test with `M` or `window.__forceMotion`**, or you are testing the snap path. `isReduced = () => !window.__forceMotion && matchMedia('(prefers-reduced-motion: reduce)').matches`. All blocks are guarded by `:root:not(.force-motion)`.

Sample over time to prove a gate. A freeze-frame test can mask the behaviour.
