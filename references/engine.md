# The HTML engine

`assets/starter/` is a working 5-slide deck with the full engine. It was tested this way: audit clean across 9 states, presenter sync in both directions, no idle messages between windows. It has not yet been used to build a real new deck.

## Start a deck

```bash
cp -r "$HOME/.claude/skills/presentuitive/assets/starter" ./my-deck
```

```bash
cd my-deck && python -m http.server 8123 --bind 127.0.0.1
```

Open `http://127.0.0.1:8123/`. Press `P` for the presenter window. `index.html` must be served: `file://` blocks `fetch` for notes and ES modules for Three.js. If you start the server from a tool, run it in the background.

## File map

| File | Role | Edit per deck? |
|---|---|---|
| `index.html` | Scenes and chrome. HTML comment at top holds the build stamp. | Yes |
| `notes.txt` | Script for the presenter. User-editable. | Yes |
| `styles/themes/<id>.css` | Every colour and font, as role tokens. `index.html` links one. | Pick or adapt one per deck |
| `styles/base.css` | Stage, scene transitions, tiers, type scale, the `data-dark` role swap | Rarely |
| `styles/motion.css` | Four registers | Rarely |
| `styles/slides.css` | Per-slide layout and morphs | Yes, most work goes here |
| `js/engine.js` | Stage scaling, beats, nav, auto, count-up, hooks | Rarely. Treat as read-only once a deck is live. |
| `js/spine.js` | `ZONES`, `UNIT`, `TITLE_OF` | Yes |
| `js/setpieces.js` | Custom hooks | When needed |
| `js/notes.js` | Loader | No |
| `js/presenter.js` | Presenter window | Timer only |
| `js/audit.js` | Checking script, injected in testing. Not linked from `index.html`. | No |
| `js/vendor/three.*.min.js` | Three.js. Delete if unused. | No |
| `build.mjs` | Inline to one file | No |
| `build/contrast.py` | WCAG check of every theme's role pairs | Run on any palette change |
| `build/fonts.py` | Download and subset fonts | When glyphs or fonts change |

## Per-deck change list

1. Theme: point the `<link>` in `index.html` at the chosen theme file, or a copy adapted to the brand (`references/style-discovery.md`). Keep the role names; run `python build/contrast.py styles/themes/<id>.css`.
2. Replace the demo scenes and the demo rules in `slides.css`. Keep the idioms.
3. `ZONES`, `UNIT`, `TITLE_OF` in `js/spine.js`. If the deck grows, trim `UNIT` so the bars stay near 290px. For scale, 9 per slide fits 32 slides.
4. Talk length in `tickClock` in `js/presenter.js`: `elapsed >= 9 * 60 && elapsed < 10 * 60` is the warning, `elapsed >= 10 * 60` is over.
5. Dark scenes: `data-dark` swaps the roles to the theme's dark set, background included. No extra CSS.
6. Fonts: `python build/fonts.py styles/themes/<id>.css` if you change font or need other glyphs (needs fontTools). Subsets to ASCII plus nbsp, curly quotes, en and em dash, middle dot, bullet, four arrows, ellipsis, ×, true minus, ©®, ‹›. Anything else falls back silently.
7. Delete the Three.js vendor files if no 3D is used.
8. Remove `#slide-no` before the real talk if numbers aren't wanted.

Channel and window names are already neutral (`deck-channel`, `deck-presenter`).

## Scene markup

```html
<section class="scene on-dark" data-dark data-tier="1" data-beats="2" data-auto=",3"
         data-zone="part-b" data-scene="data-demo">
  <div class="pad demo-layout">
    <h2 class="t-display-l">Visible from the start: no data-b</h2>
    <div class="t-stat m-d-count" data-b="1" data-count="120" data-from="0" data-dur="700" data-post=" min">120 min</div>
    <svg viewBox="0 0 900 300"><path class="m-d-draw" data-b="2" d="..."/></svg>
  </div>
</section>
```

- `.scene` is absolute, `opacity:0`, `.live` shows it.
- An element without `data-b` is there from the start. `data-b="1"` arrives on the first click. Keep the final value as the element's text, so the slide still reads correctly when it snaps.
- Indices follow DOM order. Refer to scenes by `data-scene`; indices shift.
- Scene order lives in `index.html` only. Reordering means updating `notes.txt` numbers and any `registerHook` index.

## Stage scaling

`const s = Math.min(w / 1600, h / 900) * nudge;` with `w = fitBox?.clientWidth || innerWidth || 1600`. Translate rounded to whole px. `#deck` transform-origin 0 0. Centring is by translate, since grid `place-items` pinned an oversized child to the start edge and caused cropping. A ResizeObserver, rAF, `load` and a 120ms timeout guard against scale(0). `#fit` is `position:fixed; inset:0; overflow:hidden`.

## Public API

`window.Deck = { registerHook, jump, fwd, back, get state(), scenes, countUp }`. `state = { si, bi }`. The stage element is `#deck`, not `#stage`. `Deck.jump(si, bi)` clamps and paints instantly.

Boot waits for `document.fonts.ready` with a 600ms safety. `.booted` is added after two rAFs with a 100ms fallback; the title stagger is gated on it.

## Presenter

`?presenter` on the same file. `P` opens it. `html.is-presenter` scopes the styles.

What it provides: separate window, current and next previews, notes at least half the screen, Arial, large (30px), no cues, user-editable, scroll that doesn't reset on beat change, notes aligned with the script.

- The real `#fit` is re-parented into the current preview, so there is no second renderer.
- Next preview clones the next scene, strips ids, shows all beats, no animation.
- **Echo suppression:** `BroadcastChannel.prototype.postMessage` stamps `_origin:'presenter'`, and own echoes are dropped. The first version oscillated at about 13 cycles per second. Test by counting messages while idle: must be 0.
- All presenter nav posts `{type:'nav',dir}`. The deck engine is the authority and answers `{type:'state',...}`; the presenter mirrors with `Deck.jump`.
- Arrow keys are caught in capture phase with `stopImmediatePropagation`, or they double-advance.
- **Scroll rule:** `if (el.textContent !== text) { el.textContent = text; scrollTop = 0; }`.
- All media is muted in the presenter window.
- The deck presents fine with no presenter window. A notes failure shows loudly via `NOTES.__error`.

## Notes format

Self-documented at the top of `notes.txt`.

```
=== 3 · A label for you ===
First paragraph.

Second paragraph.

--- beat ---

What you say once the next beat has fired.
```

- Number is the scene index. Text above the first `===` is ignored. `#` lines are comments. Soft breaks rejoin.
- A slide with `data-beats="N"` and beat markers needs N+1 blocks. One block with no marker stays up for the whole slide.
- `window.PRESENTER_NOTES` is created synchronously and filled in place, never reassigned, because `presenter.js` captures it in a const. A `notes-ready` event re-renders.
- `fetch(url, {cache:'no-store'})`, so plain F5 picks up edits.

## Set-piece hooks

```js
Deck.registerHook(sceneIndex, function (scene, bi, instant) {
  if (instant) { /* snap to the state for bi */ }
  else { /* play into bi */ }
});
```

A scene with `data-setpiece="name"` can be located by name in `setpieces.js`. A full WebGL example: `assets/examples/planet-3d.js`.

## Build

`node build.mjs [outname]` inlines everything to `../<name>` (default `deck-final.html`). It leaves `url(#id)` fragments alone and warns over 8MB. Optional. The proven delivery was the live folder with a local server and presenter in a second window. Offer the file as a backup, and test it if you do.

## Editing safety

Not everything here is under version control unless you set it up. Lessons paid for:

- Never delete a CSS range by searching for comment boundaries. A whole family of rules was lost that way, with no git to restore it. Use verified line ranges or exact strings with occurrence guards.
- Some file-reading tools strip `/* */` from JS. An edit near a stripped banner once killed `setpieces.js`. Raw-read comment blocks first.
- Check a property isn't already declared. A double `max-width` defeated four attempts.
- `nth-of-type` on all-`div` children mis-targets. Use classes.
- `index.html` gets too large to read whole. Patch with a script, or locate with:
  `re.search(r'<section\b[^>]*?data-scene="NAME".*?</section>', h, re.S)`
