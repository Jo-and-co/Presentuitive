# Case studies

What went wrong and right on specific slides of one real deck, and the general lesson. Reuse the reasoning, not the visuals.

## The planet: wrong medium, about seven rounds

**Goal:** a reveal showing four tools as a system.

**What happened:** SVG layered core → cutaway → opened sphere → sphere plus orbit → orbital system → half planet with rings branching → real WebGL Saturn. Every SVG version was rejected, with growing frustration: it didn't look 3D, it didn't look like a planet, the rings were just lines, and it read as an extra diagram with no connection to the content.

**What fixed it:** Three.js, vendored offline. Orthographic camera so world units are stage px. A matte globe with a terminator and rim light. Flat ring discs tilted so the depth buffer wraps them behind and in front. A real shadow band on the globe. Four bands, one per checkpoint, each advancing on a beat, so the rings mean something. Direction: "Sleek keynote 3D, NOT photoreal." The first WebGL attempt also failed and was re-issued with a tighter brief.

**Refinements after that:** planet moved right and enlarged, progressive ring reveal, no mini callouts, straight elbow arrows with a wipe, speed matched to spoken words, copy only after the object settles, one advance per stage, PLAY forward and SNAP back, hard cut afterwards.

**Lessons**
- SVG could never read as 3D. Depth, shading and occlusion were what it lacked, and repolishing doesn't add those. **Ask early whether the medium can render the object, and escalate on the first failure.**
- Name the concrete tells that would make it read as the thing: terminator, ring shadow, wrap-around.
- A big object must mean something: the bands map to the checkpoints.
- Lock the mechanism while re-skinning the art.
- Brainstorm formats broadly before settling.

Code: `assets/examples/planet-3d.js`.

## The team explainer: five rebuilds of one slide

**Goal:** explain to someone outside the field what a team does.

**What happened:** five different analogies across five rounds. A control tower. A conveyor, built on the wrong slide, which replaced what that slide was for. A routing hub, which was still a wireframe of moving dots with no analogy, with an invented name caught at the same time. A checkpoint. Finally a two-way border post with a guard and a boom barrier. Midway, the user asked a question nobody had answered: is this analogy even the right one?

**Lessons**
- **Fix the slide's job and the analogy in words first.** Most of these rounds could have been one conversation.
- Pick the analogy before building. Compare candidates by "does a stranger get it?".
- Flow alone is wireframe. It needs a recognisable object.
- Message and intent outrank a pretty visual.
- Pre-check the target: confirm the scene with `data-scene` before building. That's why the brief format has a PRE-CHECK.

## The timeline: passed the measurements, failed the eye

A round reported zero overlaps. The reply said one moving panel was right and little else. Then numbered criticisms: a box covering a label, plain and boring, tasks not spread out, a barely visible band, words too small in the zoom-out, a checkpoint with too much detail.

**What fixed it:** a bespoke overview layer. Scaling the track to .414 was shrinking the words, so scale couldn't be the mechanism. Labels moved below the line. One checkpoint became a teaser with no numbers or names, so the next slide could reveal them.

**Lessons**
- A measurement table can be all green on a slide that fails.
- Keep what was approved in a rejected round. The moving panel survived.
- Scaling a group scales its words.
- Teasers withhold. Don't spend the reveal early.

## Shutter speed: the approval to imitate

**The problem:** a lesson about trading speed for accuracy, which could have been a bullet.

**The slide:** seven motion-blurred smears with ghost trails slow down. The blur resolves. They settle into a clean row. An amber check runs left to right. Nothing is marked wrong, nothing is counted, no incident is depicted. It was approved on sight.

**Why it worked:** the slide *does* the trade. The theme needs no label. The sketch came with a specific question ("does blur read as speed vs accuracy?"), so the feedback was specific too.

## The lit patch: same round, same reaction

A dark slide. A pool of amber light on a small cluster, with one mark picked out. On a beat the light opens and structure fills the frame.

**Why it worked:** real rendering of light, depth, blur and glow. A single move. The wording states what the picture just did, briefly, and stops.

## The theme rail: a failed theme, then a failed rollback

An approved slide got a 44-tick rail added to carry a theme, plus a per-cell opacity ramp. It was clutter and came out in a rollback: back to the approved version with two small fixes. The user's reaction was that it had just been changed back, and could it be more creative.

**Lessons**
- A second diagram to carry a theme produces clutter. The object already on the slide must carry it.
- Removing the failure isn't the creative answer. Say what's new, or propose something new.

## Too far from the original

A sketch made a slide symmetrical and added lines. The user found it messy and asked to stay closer to the original, with more animation or simple visuals.

Notes from that time say the fault across about six rounds was register, not amplitude: making it louder or quieter didn't help when the tone was wrong. The record of those rounds is thin, so treat that as a hypothesis. When a slide keeps failing at every intensity, question its tone, not its volume.

## Lifted, not replaced

A photo, clip, scrim, three beats and the video logic all stayed. A decision line, previously only spoken, went on the slide. Figures were reordered so the hard number leads. A quote card moved so it no longer shared a baseline. Figures dim to a third when the quote arrives.

**Lesson:** sometimes the job is to find the one anchor and make everything else behave.

## The iceberg: literal objects need literal drawing

Four messages on one slide: give the iceberg a bottom and make the water look like water, not a dotted line; remove the extra lines below the surface, and it looks like a ball, not an iceberg; animate it with one click and space the points evenly; make the text neater and larger.

**Lessons**
- Commit to a metaphor physically: it fills the stage, has a bottom, and the water is water. Half a metaphor reads worse than none.
- Say what the user will check before they check it: silhouette, surface, fill.

## Make the connection visible

Two things on a slide were related, and the audience couldn't see how. The wrong number had to visibly become the dip in the chart. If two things on a slide are connected, the audience must watch the connection happen, because they won't infer it.

## Corner labels: a late chrome change

Act labels held across slides became noise. They were replaced late with per-slide titles, which touched every slide and required moving titles out of bodies. Spacing complaints followed. **Lesson:** decide chrome on the style tiles.

## Deleted CSS: no safety net

A range of CSS was deleted by searching between comment boundaries. A whole family of rules went with it, and there was no git to restore it. **Lesson:** set up history at kickoff, and use verified line ranges or exact strings.

## Anti-pattern table

For the look of generated slides (cards, stock shapes, hype words), see `references/anti-slop.md`.

| You're about to | The likely response | Do instead |
|---|---|---|
| Replace a slide because a new idea is exciting | "Why change it?" | Enhance. Propose the replacement beside it. |
| Show a flow diagram for a concept | "Too wireframe" | Find the recognisable object. |
| Polish the same approach again | Growing frustration | Change medium or ask for the tells. |
| Add a label or stamp for clarity | "Why is that there?" | Check the ledger. Often delete. |
| Tweak the wording while fixing visuals | "You changed the phrasing" | Freeze copy. |
| Report "all pass" | "It's still boring" | Report what was measured and what wasn't. |
| Take a screenshot by reflex | Wasted tokens | Measure with a script. |
| Reason at length in the reply | Wasted tokens | One line of reasoning at most. |
| Undo a change when told it's not good enough | "You just changed it back" | Offer something new, or ask. |
| Add a second diagram to hold a theme | Clutter | Make the existing object carry it. |
| Fix the reported slide only | The same complaint again | Fix the class of fault across the deck. |
