# Anti-slop

What makes a slide look machine-made, and the check to run before showing anything.

"AI slop" on a slide is the look of choices nobody made: the default layout, the default palette, the default words. Any single item below can be right when it was chosen for this content. Slop is the same choice on every subject.

**The one test that catches most of it:** swap the topic words for another talk's. If the slide still works, the design isn't about this content. Rebuild it around the thing only this talk has: its object, its number, its comparison.

## Layout

| Tell | Why it reads as generated | Do instead |
|---|---|---|
| Three or four equal cards, each an icon, a heading and two lines | The most common generated layout. Equal weight says nothing is more important. | One dominant element. Items that differ get their own diagrams. Truly parallel items go in one row or a table, without boxes. |
| An icon on every bullet, or in a circle above every heading | Decoration standing in for content | Use an icon only where it carries meaning a word can't. One line-icon system. |
| Three big numbers in a row, small label under each | A "hero metrics" template. A number with no reference point means nothing. | One number per view, with its comparison: before and after, against target, or against something the audience already knows. |
| Title plus five bullets | A document pasted onto a stage | One point per view. The speaker carries the rest. |
| Bold lead-in on every bullet ("**Speed:** ...") | Reads as an outline, not a talk | Plain sentences, or split into separate views. |
| Everything centred and symmetrical | Nothing for the eye to start on | Put the dominant element off-centre and let space lead to it. |
| Rounded cards with drop shadows, nested cards, coloured stripes down one edge | Web-app components on a slide | Use space and type size for grouping. A box needs a reason. |
| Blobs, waves, gradient meshes, dot grids as filler | Filling space because it looked empty | Make the main element bigger. Empty space is fine when it is on purpose. |
| Chevrons for a process, a pyramid, a funnel, a Venn, "pillars" | Stock shapes chosen before the content | Ask what the content actually does (flows, stacks, overlaps, narrows). Use the shape only if it truly does that. |
| Stock metaphors: lightbulb, rocket, target, puzzle pieces, gears, handshake, chess piece, summit, shield | The first image anyone would think of | Find an object that works the same way as the concept, with the method in `references/analogies.md`. |

## Colour and type

| Tell | Do instead |
|---|---|
| Purple-to-blue gradients, gradient text, neon on black, glass panels, glow as decoration | A theme picked in style discovery. Glow only as grammar for data. |
| The accent on every slide and every heading | One job for the accent, named in the brief. If everything is highlighted, nothing is. |
| Default indigo, slate and violet from web UI kits | Roles from the deck's theme file. |
| Pale grey body text to look elegant | Contrast at the floor or above. Elegance comes from space and type. |
| A small capitalised label above every heading | Keep it where it carries information (section, date, source). Drop it where it is decoration. |
| One font at one weight everywhere | Use the theme's display face, body face and reserved voice. The weight contrast is the hierarchy. |
| The same headline faces as every generated page | See "Never offer unprompted" in `references/style-discovery.md`. |
| Emoji as icons | Never. `audit.js` flags them. |

## Charts

The full method is in `references/dataviz.md`.

| Tell | Do instead |
|---|---|
| 3D, pies with many slices, a donut used for decoration | A bar or a line. A pie only for two or three parts of one whole. |
| A different colour for every series or bar | Neutral for context, the accent for the one series that matters. |
| A legend the eye has to travel to | Label the line or bar directly. |
| A title that names the chart ("Revenue by quarter") | A title that says what it shows ("Revenue doubled after the price change"), in the speaker's words. |
| Heavy gridlines, boxes and borders | Fewer lines. Keep the ones that help read a value. |

## Motion

| Tell | Do instead |
|---|---|
| Every element fades up, every slide, the same way | Motion that argues: a morph that shows what changed. See `references/motion.md`. |
| Cards entering one by one with a stagger | Reveal on the beat the speaker reaches it. |
| Floating, bouncing or parallax on still content | Stillness. Movement is for something that changes. |

## Words on the slide

Spoken lines follow the Voice section in `SKILL.md`, and the full wording check is in `references/wording.md`. These are the tells in on-slide text.

| Tell | Do instead |
|---|---|
| A topic for a title: "Our approach", "Key takeaways", "The challenge", "Overview" | Say the point: what the audience should take from this view. |
| Triplets everywhere: three adjectives, "Fast. Simple. Secure." | Say the one that matters, with its evidence. |
| Staccato punchlines, "It's not X, it's Y", "The result?" | A plain sentence. |
| Hype words: seamless, robust, leverage, unlock, empower, transformative, cutting-edge, game-changing, synergy, holistic, delve | The specific thing it does. `audit.js` flags these as advice. |
| Vague numbers: "significant", "up to 10x", an unsourced percentage | The exact figure from the facts ledger, with its qualifier. |
| A generic closer: "The future is bright", a thank-you slide with a big icon | End on the last real point, or a plain question slide. |
| Workflow text that leaked: "Option A", a theme or template name, "placeholder", a note like "audience: executives" | Never. Those belong in the message to the user, not on the slide. |

## When the user says it looks AI-made

Ask which slide and which element, or find the tells yourself from the tables above. Usual causes, most common first:

1. The layout is a template (cards, three stats, title and bullets).
2. Nothing is dominant.
3. Decoration with no meaning.
4. Generic words.
5. The same look as the last deck (run style discovery).

Fix the class of fault across the whole deck, not only the slide named.

## The slop check

Run this on every slide before showing it, as part of Phase 5 in `SKILL.md`.

1. **Swap test.** With another topic's words, would the slide still work? Then it isn't designed for this content.
2. **Squint test.** Blur your eyes: is there one dominant element? Or several equal ones?
3. **Name the choice.** For the layout, the colours, the font and every icon: why this, for this content? "It was the default" fails.
4. **Read the words aloud.** Title says the point. No hype words, no triplets, no leaked workflow text.
5. **Run `audit.js`.** `EMOJI` is a must-fix. `CARD_GRID`, `SLOP_WORD` and `TOPIC_TITLE` are advice: each one means look again and either change it or say why it stays.

The script finds the patterns. Only the first three questions find a slide that is merely generic, so do them yourself.
