# Design system

How slides are laid out and styled. Values come from one approved 32-slide deck (called "the source deck" below) and are defaults, not laws. Real code: `assets/starter/styles/`.

## Contents

1. Stage and grid
2. Boldness floor
3. What a slide must contain
4. Light and dark
5. Colour method
6. Type
7. Chrome
8. Projector floors
9. Charts
10. Diagrams and icons
11. UX for slides
12. Approved patterns

## 1. Stage and grid

- Fixed **1600×900** stage, scaled and centred to fit. Letterbox on other ratios, surround colour matched to the deck. No width-based media queries. Verified at 1600×900, 1920×1080, 1280×800.
- `.pad` is `position:absolute; inset:64px 96px 116px`, a **1408×720** containing block. Never declare `position` on a class that shares the `.pad` element: `.opp-solo { position: relative }` collapsed a layout and cost an hour.
- Layout classes on `.pad` use `height:720px`.
- Eyebrow occupies y 40 to 53. Content floor y=784 on stage, 720 in the pad. Rail top y=844. Pad right edge x=1504.
- Use px for measures that must clear a hard boundary. `ch` is unreliable: 20ch measured 553.7px while 28ch measured 517px on the same 30px Inter.
- A layout widening can release a previously unreachable `max-width` and create a new overlap. Re-measure after widening.

## 2. Boldness floor

Apply before showing anything. Plain was the most common visual complaint.

> Display numerals 180–260px, diagrams 60–70% of stage, ghost and depth layers, colour-blocking. If the dominant element could be 40% bigger, it's too small.

**"Plain" is a diagnosis of flatness:** modest scale, white everywhere, thin strokes, no depth. It is not a motion problem; more motion won't fix it. But the brief for a finished deck can be "refinement, not reinvention", and then you scale and deepen what's there rather than replacing it.

Simple and plain are different. A single huge object on a coloured field is simple and not plain. Three small boxes on white are plain, however tidy.

## 3. What a slide must contain

- **One dominant element.** A recognisable object where the concept allows.
- **Cues for the speaker.** Short phrases they can glance at. Not paragraphs, not nothing.
- **Space used on purpose.**
- **Nothing that needs explaining.** The visual flows without the speaker having to decode it.

Words and lines:

- Words never touch lines, other words, or chrome. Overlap draws the strongest reaction of anything in this skill.
- Lines stop before labels, or the label moves. Branch checkpoints off a line so words don't sit on it. Put axis labels below the line.
- Extend headings to one line instead of wrapping awkwardly. Avoid a stray last word.
- Scaling a group shrinks its words. A track scaled to .414 made labels unreadable, so a bespoke overview layer replaced it.

## 4. Light and dark

Default rule: every deck uses both, on purpose, one meaning each. The meanings change per deck; they never mix within one. The source deck used dark = proof and measurement, light = story and structure. Write them in the brief.

`data-dark` on a scene swaps the colour roles to the theme's dark set (`base.css`), so the background and text follow without extra CSS.

Dark scenes: projector gamma can crush them, so keep body text well above the floor. Glow is grammar for data, never the legibility mechanism. Text must clear contrast with glow removed.

## 5. Colour method

**No fixed palette.** Every colour lives in one theme file (`styles/themes/<id>.css`), chosen with the user in style discovery (`references/style-discovery.md`). Then:

1. Keep it to few hues. Too many colours is what makes a deck look machine-made.
2. Give each accent one job, and say so in the brief.
3. Slides and `slides.css` name roles, never hex. A new colour need is a new role in the theme file, not a one-off value.
4. Check the theme with `python build/contrast.py styles/themes/<id>.css`.
5. Scan computed colours with the audit (`hueFamilies`). Design skills will drift; the scan catches it.

The source deck chose no green and no red, since red gives a negative impression. Ask rather than assume for other decks.

The roles every theme defines:

| Role | Job |
|---|---|
| `--ground`, `--ground-alt`, `--wash` | Slide background, alternate panel, faint tint |
| `--ink`, `--ink-soft`, `--rule` | Text, secondary text, hairlines |
| `--primary`, `--primary-mid` | Main brand colour (text-safe), a lighter step for fills |
| `--support`, `--support-deep` | Second hue. `--support` is **fills only**; `--support-deep` is text-safe |
| `--accent`, `--accent-ink` | The one highlight. `--accent-ink` is its text-safe shade |
| `--dark-*`, `--accent-on-dark` | What the roles become under `data-dark` |
| `--letterbox`, `--eyebrow*`, `--rail-id-on-dark` | Chrome |

The split between fill-only and text-safe matters: bright hues rarely reach 4.5:1 on a light ground, so they fill bars and areas while a deeper shade carries any words.

## 6. Type

| Class | Spec |
|---|---|
| `.t-display-xl` | 700 96px/.96, -.03em |
| `.t-display-l` | 700 64px/1.02, -.022em |
| `.t-display-m` | 600 44px/1.08, -.016em |
| `.t-lead` | 400 30px/1.40 |
| `.t-body` | 400 22px/1.50 |
| `.t-label` | 600 16px/1.2, .14em uppercase |
| `.t-data` | 500 15px tabular |
| `.t-stat` | 700 112px/1, -.04em tabular |

The sizes are fixed; the theme sets the faces and the display knobs. Weights and tracking above are harbour's.

- Faces come from the theme's `--font-display`, `--font-body`, `--font-label` and `--font-special` (the reserved voice for human or reflective lines).
- Knobs: `--display-weight`, `--display-track` (a multiplier on the negative tracking; serifs want less), `--display-stretch`, `--display-case`, `--label-track`. Tune these rather than overriding classes.
- At most two families plus a reserved voice. A trio of three display families was rejected as messy in the source deck. Faces change per deck; the discipline stays.
- Fonts embedded as woff2 with `font-display: block`, in `assets/fonts/`.
- **The bundled fonts are subset.** `build/fonts.py` keeps ASCII and a short list of punctuation. Other glyphs fall back silently. Re-run it for a new repertoire.
- A good default: no em or en dashes in visible text, curly apostrophes and quotes (`&#8217;`, `&#8220;`, `&#8221;`). The audit's `DASH` check enforces the first. Drop it if a deck wants dashes.
- Body floor 22px. The audit flags text under 15px as advice.

## 7. Chrome

Decide on the style tiles. Late chrome changes touch every slide.

- **Corner label:** per-slide title in `TITLE_OF` (`js/spine.js`), keyed by `data-scene` so it stays right under back and jump. `left:40px; top:40px`, 13px 600 .22em uppercase, 32×2px rule before it, aligned so the words meet the heading edge at x=96. The corner says where you are; it isn't a headline. A held act label became noise, so the label moved to per-slide titles. One title in one place: move it to the corner and delete it from the body.
- Corner text must not resemble in-body captions. Keep it clear of body content.
- **Spine:** progress bar made of zones. Fixed-width label so bars never shift. Changes state at slide changes and never animates.
- **Slide number:** zero-based working number matching conversation. Remove `#slide-no` from `index.html` for the final talk.

## 8. Projector floors

- Text 4.5:1. Chart strokes 3:1. Hairlines at least 2px. Body at least 22px.
- Assume a washed-out projector. `build/contrast.py` checks every theme's text roles on both grounds; keep dark-scene body text well above the floor, not at it.
- Overscan is handled by the `-`/`=` zoom nudge, so don't reserve margin for it.
- Deliberate dimming of past content is allowed (`[data-b].dim{opacity:.26}`). The audit will flag dim text that still needs reading; decide per case.

## 9. Charts

Defaults that held across every chart in the source deck:

- Line-chart theme for growth stories.
- Smooth lines. Not too wiggly, not many at once, no dotted lines by default.
- Checkpoints branch off so words stay clear of the line. Enlarge them.
- White words on dark. Pulsing points are welcome. One-click left-to-right reveal.
- Raw before/after numbers, sized honestly. Bars or rails sized by real values. A teaser carries no numbers, so the reveal slide keeps its impact.
- Keep it plain enough for a non-specialist. Use `dataviz` for form choices if you have it, within the deck palette.

## 10. Diagrams and icons

- Different tasks need their own diagrams and their own positions, not words laid out in a cramped sequence. Icons can support a diagram but don't replace it.
- As a model of the idea: a checking task is a form with a verify tick; an investigation is a magnifier tracing a discrepancy; an urgent item is a priority clock; balancing is a balance beam; filtering is a funnel. Each object says what the task is.
- One line-icon system on a 24×24 grid, `currentColor`. Never emoji.
- Hand-drawn SVG lines must look deliberate. If a line isn't saying something, delete it.
- Inside SVG, transforms need `transform-box:fill-box`.

## 11. UX for slides

Think of this as UX design for slides. In practice:

- One anchor at a time. Dim what has been said so the eye knows where to be.
- Reading order is the beat order. Don't reveal something the speaker hasn't reached.
- Spatial continuity: an object that moves is the same object, and it means something that it moved.
- If a slide has to teach its own visual language, it has already lost the room.
- A personal detail gets a light nod on the slide, not its own treatment.
- A theme is carried by design, not labelled.
- The audience is the primary user. They should remember the key messages after the talk.

## 12. Approved patterns

Reuse the ideas, not the content. Full stories in `case-studies.md`.

- **The slide performs the claim.** Shutter speed: blurred smears slow, resolve into a clean row, ticks run across.
- **Real rendering of light and depth.** The lit patch: a pool of light opens to reveal structure around a small mark.
- **Same start, same end, different middle.** Assumed vs actual on one baseline; stations never move, detours grow between them.
- **Repetition as argument.** The same staircase and leap twice, then a marker climbs every tread.
- **Before and after on one baseline,** rails sized by real values.
- **Lift rather than replace.** Keep what works, move the anchor, reorder for the hard number first.
- **Echo a past slide on purpose.** A heading slide's colour split came from an earlier slide and was named as such, not a new invention.
- **Literal metaphors drawn properly.** An iceberg with a bottom, real water, the surface line only.
