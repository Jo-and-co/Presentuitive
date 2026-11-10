# Data on slides

How to show numbers and charts in a talk. A slide chart is not a report chart: the audience sees it once, from across a room, for as long as the speaker talks about it, with no hover and no zoom. So each chart makes one point, the title says it, the mark shows it, and it is revealed as it is spoken.

## Start from the sentence

Write what the data shows as one sentence before choosing a form: "Wait times halved after the second desk opened." That sentence is the title, in the speaker's words. If you can't write it, the chart isn't ready, or it belongs in an appendix or a handout.

Every number comes from the facts ledger, with its source and qualifier. A chart is a claim like any other.

## Choose the form by the question

| The question | Use | Avoid |
|---|---|---|
| How did one thing change over time? | A line. One or two lines at most, the one that matters in the accent. | Many lines, bars for long series |
| Which is bigger, and by how much? | Horizontal bars, sorted, labelled at the bar's end | Pies, radar charts |
| What changed between before and after? | Two bars or rails on one baseline, sized by the real values | Two charts on different scales |
| What share of a whole? | One stacked bar, or a pie only for two or three parts | A donut with many slices |
| Is this one number big? | The number with its comparison: against a target, last year, or something the room already knows | Three hero numbers in a row |
| How do two measures relate? | A scatter with the point that matters labelled | Two y-axes |
| Where does this sit on a range? | One rail with a marker | Gauges and speedometers |
| How spread out are the values? | Dots along one line | Box plots, for a general audience |
| Will the audience read exact values? | A small table, four rows or so, the row that matters highlighted | A spreadsheet on a slide |

If the honest answer is "several of these", the slide has several points. Split it.

## Make the number mean something

- Give every number a reference point. A number on its own tells the room nothing.
- Translate units into something the room can picture, when the ledger supports it: "120 minutes" may land better as "a quarter of the working day".
- Round for speech: "1.3 million", not 1,284,903, unless the exactness is the point.
- Put the unit and the period in the label. Put the source in small text when the claim needs it.
- A teaser carries no numbers, so the reveal keeps its impact.

## Colour

- Context in neutral roles (`--ink-soft`, `--rule`). The one series that matters in `--accent`, or `--accent-on-dark` on a dark scene. If two series both need the accent, the slide has two points.
- Categories: at most three hues, all from the theme, and labelled directly so colour is never the only key.
- Good and bad in red and green only if the brief chose them. Many decks don't, and colour-blind viewers lose the difference.
- Strokes at least 3:1 against the ground, text 4.5:1. A label on a bar must clear contrast there, or move outside the bar.
- Glow is allowed as grammar for data on dark scenes, never as the way something becomes readable.

## Marks and labels

- Label lines at their end and bars at their tip. No legend.
- The key line is the thickest and brightest thing on the slide (4 to 6px); context lines are thin (2px, never less).
- Keep the baseline. Drop the box, most gridlines and tick marks. Keep two or three reference values only if the audience needs to read a level.
- Bars start at zero. A line can crop its axis, but say so when the crop changes how big the change looks.
- No rotated text. Shorten the label, or turn the chart horizontal.
- Labels the speaker points to are at body size (22px). Nothing is under 15px, the audit's floor.
- Smooth lines are the default taste, but never smooth away a real dip the point depends on.
- No 3D, no shadows, no gradients on bars.

## Reveal with the talk

A common order: the frame and context first, then the mark draws or grows, then the point is annotated. One beat per spoken idea.

- The motion is the datum: a line draws (`.m-d-draw`), bars grow from their base (`.m-d-grow`, `.m-d-rise`). Nothing in a chart just fades in.
- A number the room should watch arrive counts up (`data-count`, with `data-from`, `data-pre`, `data-post`, `data-dur`). A number whose size is the point lands with `.m-d-weight`. Never both on one element.
- Dim what has been said (`data-dim-after`) so the eye goes to the new mark.
- If two things are connected (a wrong number and the dip it caused), animate the connection. The audience won't infer it.

## Building it

- Draw charts as inline SVG from the real values, with colours from roles (`stroke: var(--accent)`), never hex. The starter's data demo (`.demo-chart` in `index.html`) is the pattern.
- Keep the source values beside the drawing, in a comment or data attributes, so a later check can compare them with the ledger.
- SVG text scales with the `viewBox`. Check the rendered size, or put labels in HTML over the SVG.
- A chart library is fine if its output takes the theme's roles and loses its default look (legend, tooltip, grid). For most slides, hand-drawn SVG is shorter.
- `audit.js` flags `LINE_THROUGH_TEXT` when a label sits on a line. Move the label, or branch it off the line.

## Check

1. Squint: is the point visible before reading any label?
2. Read the title, then look: does the mark show what the title says?
3. Honest scales: bars from zero, any crop disclosed, before and after on one scale.
4. Every number in the ledger, rounded for speech, with a reference point.
5. From the back of the room: is the key mark the boldest thing on the slide?
