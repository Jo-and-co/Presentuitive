# PPTX route

**Proven once.** A 13-slide deck was built this way, with the build read back through real PowerPoint. Morph and click behaviour were read back, not watched live. The mapping table below still comes from the HTML work.

Use a PPTX skill for file mechanics if you have one, otherwise pptxgenjs directly. This skill still supplies gating, ledger, voice, facts, design rules and the loops table.

## When to pick it

Others must edit it. It travels by email or a shared drive. A corporate template is required. Someone else presents it.

Say what is lost: real WebGL, custom per-beat choreography, a custom presenter layout, the audit script. Set expectations at kickoff, so loop 3 (wrong medium) doesn't start on slide 10. If the concept gate calls for something PowerPoint can't render, say so then, and offer pre-rendered video as a bridge.

## Mapping

| HTML idea | PPTX equivalent |
|---|---|
| Morph | Morph transition. Same object name on consecutive slides (`!!name` forces a match). |
| Beat | An animation click. Keep to one click per spoken idea. |
| `data-auto` | "After previous" with a delay |
| Registers | Pick a small set of animations with meaning, and don't apply one everywhere |
| Tiers | Keep most transitions quiet; use a distinct one for act breaks |
| `notes.txt` | Speaker notes, in Presenter View |
| Presenter window | Presenter View. Notes font is limited; tell the user. |
| 3D set piece | 3D Models with Morph, or pre-rendered video |
| Count-up | Pre-rendered, or a clean reveal. Don't fake it with many text boxes. |
| Corner label, spine | Slide master |
| Tokens | Theme colours and fonts in the master |

## Rules that carry over

- 16:9, with the same proportions: content inside 1408×720 of 1600×900 is about 88% × 80%. On a 13.33in slide, 22px on the 1600 stage scales to 13.2pt (22 × 960 / 1600). Treat that as the absolute minimum; 18pt is a safer body size, though that hasn't been tested on a real room.
- One point per view, from `SKILL.md`. Morph needs a new slide, so it counts toward a slide limit. A click animation doesn't.
- Words never touch lines or each other. No overlaps.
- Boldness floor, light and dark meanings, few hues, one icon system, no emoji.
- Facts ledger, no fabrication.
- Embed fonts, or use ones known to be on the presenting machine.

## What worked on the first deck

- Build with pptxgenjs and write Morph and timing XML into each slide after `</p:clrMapOvr>`. PowerPoint reads it: COM reports `EntryEffect` 3954 (`ppEffectMorphByObject`) and the clicks you wrote.
- A placeholder's position beats slide-level x and y. A differently placed title needs its own layout.
- Chart `layout: {x, y, w, h}` works. Per-point `chartColors` with `invertedColors` colours a negative bar. Format codes work on data labels, including `[>=1000]"$"0.00,"B";"$"0"M"`.
- `objectName` works on `addTable`.
- Keep the generator in the project. Temp folders get wiped, including `node_modules`, and a lost generator forces a rebuild.
- Large shell heredocs can fail at parse. Write files directly, or use a small patch script that asserts each match is unique.
- First full build: 23 measured layout problems. One batch and two small follow-ups cleared them.

## Verifying without `audit.js`

- On Windows, open the deck in real PowerPoint through COM (`pywin32`) and measure there, because python-pptx can't see text wrapping. Write a small project script that checks: off slide, overflow, below floor, text overlap, clicks, effects, transition, notes.
- COM details: `TextRange.Runs` is a property, so use `.Item(i)`. `BoundWidth` counts trailing spaces. `Timing.TriggerType == 1` separates clicks from effects.
- This measures text boxes only. Tables and charts need one look at a render, which found touching chart labels and a text and shape gap the numbers missed.
- Check notes exist where expected, and that click counts match the script.
- Convert to PDF or images only if the user asks for that or if a check needs it.
- Open in real PowerPoint to confirm Morph, because generators can't verify it. Say this in the report.
