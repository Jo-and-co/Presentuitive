# Verification

Check before reporting. Measure with scripts first. Take a screenshot only when a check needs one or the user asks.

**A clean report proves there is no collision. It does not prove the slide is good.** One round passed with "0 overlaps" in its table, on a slide the user called plain and boring.

## The audit script

`assets/starter/js/audit.js` walks every beat of the chosen scenes and reports what people otherwise have to point out by hand. It kills transitions, jumps through each beat, restores state, and reports in author-space px.

Two separate tool calls, so the first has time to load:

```js
const s = document.createElement('script');
s.src = 'js/audit.js?v=1'; document.head.append(s);
```

```js
__audit({ from: 0, to: 7 })
```

Batch about 8 scenes per call, since browser automation JS calls often have a time limit (30s in the setup this was built on). Any URL works, so it can be injected into a deck that doesn't contain it. Add `?v=N` when it has changed.

Options: `from`, `to`, `floor` (784), `minFont` (15), `minBody` (22), `ignore` (extra selector), `limit` (80). Add `data-audit-ignore` to intentional ghost layers. `figcaption` and `[data-audit-on-media]` are exempt from the text-on-media check.

Returns `{scenes, statesChecked, counts, hueFamilies, mustFix, advice}`. Items read `slide.beat TYPE message`.

| Group | Type | Meaning |
|---|---|---|
| mustFix | `TEXT_OVERLAP` | Text ink over other text |
| mustFix | `LINE_THROUGH_TEXT` | A drawn line crosses text ink |
| mustFix | `OFF_STAGE` | Outside 1600×900 |
| mustFix | `TEXT_ON_CHROME` | Text meets the corner label, the rail with its spine, or the slide number |
| mustFix | `TEXT_ON_MEDIA` | Text over a small image or video |
| mustFix | `CONTRAST` | Under 4.5:1, or under 3:1 for text 24px and up |
| mustFix | `DASH` | Em or en dash in visible text |
| advice | `TOO_CLOSE` | Elements nearly touching |
| advice | `BELOW_FLOOR` | Under the content floor |
| advice | `SMALL_TEXT`, `SMALL_BODY` | Under `minFont` or `minBody` |
| advice | `STRAY_LAST_LINE` | A nearly empty last line |
| advice | `UNDERUSED_SPACE` | More than 24 words filling under 42% |

`mustFix` is what a viewer would reject on sight. `advice` is worth a look; an approved deck can have it. Fix a must-fix, or tell the user why it stands.

`hueFamilies` shows which hues appear on which slides. Compare it to the palette.

## How it was calibrated

**On seeded faults** (planted at runtime, removed after, on the starter): text over a headline, off-stage text, pale words at 1.29:1, a dash, horizontal and vertical 1.5px lines through text, text on the chrome. All caught. A dash-offset line that hadn't drawn yet was correctly not flagged. An early version missed a 3px horizontal line because its sample grid fell either side of it, so it now walks along each line with `getPointAtLength`.

**On one approved real deck** (93 states, all 32 scenes): 1 `CONTRAST` flag on a deliberately dimmed line, and 8 `LINE_THROUGH_TEXT` flags where thin 1.2px spokes clipped labels. The deck was approved anyway, so read flags like these as "the script measures them; look at them", not as "ugly". Advice on the same run: `SMALL_TEXT` 14, `SMALL_BODY` 6, `BELOW_FLOOR` 3, `STRAY_LAST_LINE` 1, `UNDERUSED_SPACE` 1. No `TEXT_OVERLAP`, no `OFF_STAGE`.

Versions: v1 raised dozens of false flags on approved slides. v2 raised 8 including false ones. v3 raised 9, all geometrically true. It has been tested on that one real deck and the starter, so expect it may need tuning on a deck with very different structure. When it is wrong, fix the script's reason, not just the instance, and record it here.

## Other checks

**Motion gates.** Sample opacity over time across an advance, in a loop with timers. A frozen frame can hide the fault. Automated browsers force reduced motion, so set `window.__forceMotion = true` (or press `M`) first.

**Presenter sync.** In a `?presenter` tab: `is-presenter` set, `#pv-say` Arial 30px with the right text. `Deck.fwd()` in the deck tab moves the presenter. An arrow key in the presenter moves the deck. Zero BroadcastChannel messages over 1200ms idle.

**Colour.** `python build/contrast.py` for tokens. `hueFamilies` for what actually rendered.

**Disk.** Re-read what you changed. Confirm the stamp moved.

## Measuring by hand

- `getBoundingClientRect` is in screen px. Multiply by `K = 1600 / deckRect.width` and subtract the deck origin.
- Reading right after `Deck.fwd()` catches mid-transition. Measure in a **separate tool call**.
- `display:none` gives a zero rect. Filter regions and stroke halos inflate SVG boxes.
- Font line boxes include empty leading, so overlap tests on them give false positives. Use an ink box.
- Walk ancestors for opacity, display and visibility before calling something visible.
- Measure every affected scene, not only the one reported.
- Your browser automation tool's JS call may not allow a top-level `return`. End with an expression.

## What measurement can't tell you

Whether a view holds one point: neither `audit.js` nor the PPTX checks measure this, so walk the click states yourself. Whether it is bold enough, whether the analogy reads, whether motion feels right, whether a stranger would understand it, whether the user will like it. Do the self-critique, and say plainly in the report what you couldn't check. "Measured no overlaps across 3 beats. I haven't seen it, so the weight of the amber line is your call." Reports that said "All measurements pass" repeatedly arrived with slides the user disliked.
