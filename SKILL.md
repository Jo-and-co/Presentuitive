---
name: presentuitive
description: Directs the design and build of any presentation so it reaches the approved result in far fewer iterations. Covers creative direction, slide design, motion, speaker notes, presenter mode, script voice and verification, with a tested HTML starter engine and notes for PPTX. Use whenever the user asks to build, redesign, review or fix a presentation, slide deck, slides, keynote, pitch deck, PPTX, speaker notes or presenter mode, even for one slide such as "fix slide 12" or "this slide looks plain".
---

# Presentuitive

Written after a deck that went very well and cost far too much to make.

**The measure of success is fewer iterations, less time and fewer tokens to reach the approved result.** Every rule here exists because its absence caused a rejection loop. When a rule and the goal disagree in a particular case, serve the goal and say so.

**Personal preferences:** if `~/.claude/presentuitive-preferences.md` exists, read it first. It overrides the defaults in this skill. Format: `assets/preferences-template.md`.

## First: size the request

Do this before anything else. It decides how much of this file applies.

| Request | Path |
|---|---|
| **Small change** (spacing, wording, timing, one overlap, one colour) | Read the slide, change it, measure it, report. No kickoff, no sketch, no questions unless the instruction is truly ambiguous. |
| **New or rethought slide** in an existing deck | Read the deck first. Skip kickoff. Run the concept gate, then sketch. |
| **Whole deck** | All phases below. |
| **"What do you think? No changes yet."** | Analysis only. Edit nothing. Plan nothing beyond what was asked. |

## The loops this skill exists to prevent

Each row cost real rounds. Read it as a list of things that will happen again unless headed off.

| # | The loop | What it looked like | Prevention |
|---|---|---|---|
| 1 | Rebuild instead of enhance | The user wanted the current slides improved and got a rebuild | Read what exists first. Default to enhancing. Replace only when asked or after saying why. |
| 2 | Visual doesn't carry the analogy | One slide rebuilt five times because it stayed a wireframe with no analogy | Settle the slide's job and analogy in words first. Flow alone is wireframe; it needs a recognisable object. |
| 3 | Repolishing the wrong medium | About seven versions of a planet in SVG, none of which looked like a planet | Ask whether the medium can render the object at all. If it can't, escalate the medium on the first failure. |
| 4 | "0 overlaps" yet ugly | A report showed zero overlaps on a slide the user called boring | Measurement proves no collision, never quality. Say so. Self-critique separately. |
| 5 | Fabrication rework | Invented stamps, figures, a quote, a product name | Nothing goes on a slide unless it is in the facts ledger with a source. |
| 6 | Slide intent replaced | A striking new visual dropped what the slide was there to say | Write each slide's job in one line. A new visual must still do that job. |
| 7 | Wording changed when visuals were asked for | The phrasing changed and the visuals didn't | Copy is frozen unless copy was the request. |
| 8 | Plain output | Tidy slides that were simple and also plain | Apply the boldness floor in `references/design-system.md` before showing anything. |
| 9 | Palette drift | Design skills pulled in new colours and the deck looked generic | Use design skills for craft, the deck's own tokens for colour. Scan computed colours. |
| 10 | Invisible motion | A transition change nobody could see | A change to motion only counts if it can be seen at the back of a room. |
| 11 | Wrong "done" reports | A claimed update that wasn't on disk; a promised prototype that didn't exist | Verify against disk and the live page before reporting. Report per item. |
| 12 | Wrong click counts and pacing | Two clicks for one idea | One click per spoken idea. Budget motion against speech (145 wpm). |
| 13 | Heavy process | Ceremony after the user had already decided | One session by default. Skip ceremony when the decision is made. |
| 14 | Token waste | Long replies and repeated checks | Short replies, batched calls, no narrated reasoning, no redundant work. |
| 15 | Repeating a complaint | The same feedback given many times | Keep the numbered feedback ledger. Close each item explicitly. Standing complaints become rules in the brief. |
| 16 | Late chrome redesigns | Corner labels reworked near the end | Decide the chrome on the style tiles, not on slide 30. |
| 17 | Late-discovered wishes | Morphs, transitions and presenter mode requested late | Ship them from day one. See "Defaults". |
| 18 | Adjacent-slide redundancy | Two neighbouring slides making the same point | Check each slide against its neighbours at the slide-jobs stage. |
| 19 | Crammed slides | A test deck's first run came out crammed; the second had the right amount | Apply "One point per view" before designing, without being asked. |
| 20 | Same look on every deck | Feedback that slides looked machine-made: the same palette and type whatever the subject | Run "Style discovery": ask, then show three directions on real content before the tiles. |

## Phase 0: kickoff (whole decks only)

Ask one batched round. Skip anything the source documents already answer. Never ask what you can read.

1. **Audience:** what do they know going in, who judges it, is there a rubric?
2. **Room:** projector or screen, whose laptop, how large?
3. **Time and length:** talk length, Q&A length, and any slide limit. No limit stated means none.
4. **Script:** does one exist, and which document is the authority?
5. **Medium:** HTML or PPTX, decided for this deck (see "Medium"). Must others edit it? Must it travel as a file?
6. **Brand:** is there a brand guide, colours or a logo to honour? The look itself is settled in "Style discovery", next.
7. **Target impression** in one sentence, such as "an honest review that still feels impressive".
8. **Wow budget:** how many big moments, and roughly where?
9. **Existing deck?** If so, read it before asking anything about it.
10. **Delivery:** presenter window, single file, or both?
11. **Light and dark:** what does each mean in this deck? One meaning each, never mixed.
12. **Safety net:** `git init` or dated snapshots? Without history, a bad edit can't be undone.

Then copy `assets/deck-brief-template.md` to `deck-brief.md` in the project and fill it in. It holds the answers, the facts ledger, the slide jobs, the decisions log and the feedback ledger. It lives in the project because context compaction forgets. Update it as you go.

## Phase 1: ground truth

Fill the facts ledger from the user's documents, each fact with its source. Numbers match the script exactly, including qualifiers ("up to" travels with the figure). Prefer raw before/after values over percentages: a percentage invites "how did you measure it?".

**Fabrication is the cardinal sin.** If a slide wants a fact the ledger lacks, ask, or use an approved placeholder that says it is one. Common fabrications: status stamps, figures, verbatim quotes, named products or organisations.

The authority document is never edited by you unless asked.

## Phase 2: slide jobs

One line per slide, in `deck-brief.md`:

- **Job:** what the audience gets with no explanation.
- **Speaker:** what the speaker adds. The slide provides context; the speaker provides insight.
- **Neighbours:** does it repeat the slide before or after? Does it build? Each lesson slide needs a different lesson.
- **Object:** what the viewer actually sees, named as a thing. "A border checkpoint with a boom barrier", not "a flow diagram".

Show the list. Get it accepted before design work on slides.

## One point per view

Applies to whole decks and to new or rethought slides. On a small change, don't restructure: finish the change and mention the crowding in one line.

Separate information so each graph, data set or claim is isolated. Do this by default, at the slide-jobs stage, before designing.

**Test each slide.** Count its main points. A point is one claim, one graph or table, one process, or one item the speaker talks through on its own. Things that only make sense side by side, such as before and after, count as one. More than one point means separate them.

**Pick the tool:**

| Situation | Tool | Adds to the slide count |
|---|---|---|
| A different point, graph or data set | New slide | Yes |
| The same object carries on: a graph moves aside, one number zooms in | Morph | PPTX yes (Morph needs a new slide). HTML no (a beat in the same scene). |
| One idea builds up | Click reveal, dimming what has been said | No |

**Keep everything.** Separating moves content. It does not delete or reword it (loop 7). Speaker notes move with their content. Every view still meets the boldness floor, and neighbours still get checked for repeats (loop 18).

**A deck mainly meant to be read,** not presented: a PDF or a reader loses Morph and clicks, so use new slides only, and tell the user.

### When to ask the user

Only a stated limit triggers a question. Otherwise separate without asking.

1. **No limit stated, or the separated deck fits it:** go ahead. Report the slide count before and after, and which slides changed.
2. **It would exceed the limit:** first use the tools that add no slides. If that leaves every view clean, go ahead and report it.
3. **Still over:** stop before building those slides and ask one batched question. Give the slide numbers, the limit and the count if everything is separated. Offer these options, with a recommendation:
   - Separate anyway, and go over the limit to N slides.
   - Stay at the limit, and keep named points together on one slide.
   - Cut content, with the user saying what goes.

Never exceed a stated limit or cut content without an answer. A stated talk length counts as a limit too, if the added clicks and motion would make the talk run over. Time them with the speech pace in `references/motion.md`. Record the answer in the decisions log, and don't ask again unless the count changes.

## Style discovery

Whole decks only, after the slide jobs are accepted. Full method in `references/style-discovery.md`.

1. Ask four questions in one batch: vibe, brand colour, headline type, light or dark. Each offers "Pick for me".
2. Show three directions (closest, adjacent, wildcard) in `assets/starter/style-preview.html`, filled with the deck's real lines and numbers.
3. The user picks or mixes. Copy that theme to `styles/themes/<deck>.css`, adapt it, run `build/contrast.py`, and link it in `index.html`.
4. Record it in the brief, and offer once to save it as the user's style.

Skip it for an existing deck, or when the preferences file holds a saved style the user confirms. With a strict brand guide, adapt directly and show one preview. Slides name roles (`--primary`, `--accent`), never hex, so the theme file is the only place colour and type live.

## Style tiles first

Before building the deck, get three slides approved: **one light, one dark, one data or set piece**, including chrome and real type. The rest of the deck inherits from them. This is what stops loops 8, 9 and 16.

## Defaults: ship these from day one

People tend to ask for these late. They are in the starter already, so do not make them a question:

- Morphs for compositional moves, not fades.
- Act breakers that look different from ordinary slides.
- Presenter mode with current and next previews and notes filling half the window.
- `notes.txt` the user edits by hand.
- A corner label holding the slide title.
- A progress spine that never animates.
- Count-up numbers, line draws, back navigation that rewinds cleanly.

## Default tastes

Start from these. The user's preferences file or their feedback overrides any of them.

- Morph over fade. A fade makes things appear from nowhere.
- One click per idea. Manual wherever the speaker needs control.
- Transitions visible from the back of the room.
- Extended one-line titles that don't wrap awkwardly.
- Use the space, and keep elements from crowding each other.
- **Words never touch lines or each other.** Nothing draws a stronger reaction.
- Line-chart theme for growth stories: smooth lines, checkpoints branching off, white words on dark, one-click left-to-right reveal.
- Slides carry cues the speaker can refer to while talking. Not paragraphs, and not nothing.
- Strong visuals, not just boxes and words. Each item gets its own diagram when items differ.
- Calm and purposeful, with a few wow moments.
- Low jargon, explained for someone with no background.

## Phase 3: concept gate

Run new concepts and set pieces through this before sketching. Say the concept in words, then test it:

1. **Message without explanation.** If you need a caption to explain the metaphor, it fails.
2. **The analogy is literally visible.** A recognisable object, not a labelled wireframe.
3. **No unsourced claim** enters through the visual. Labels, stamps and icons are claims.
4. **Keeps the slide's job.** A better picture of the wrong idea is still wrong. Wording stays honest too: a catchy line that misleads has to go.
5. **The medium can render it.** Name the tells that would make it read as the real thing. If the medium can't produce them, escalate now.
6. **The object carries the theme.** Don't add a second diagram to carry a point. It creates clutter.
7. **Perform, don't describe.** Could the slide do the thing it's about? See "shutter speed" in `references/case-studies.md`.

For new concepts, first widen what's possible. Consider WebGL, video, real photographs, canvas, real rendering of light and blur. Then offer 2–3 options and a recommendation.

### Sketch or build directly

- **Sketch** new concepts and set pieces: an interactive, full-scale `sketch.html` beside `index.html`, with real tokens and real copy, driven by arrow keys, plus specific questions ("does blur read as speed vs accuracy?"). Nothing conceptual enters the deck before it is accepted.
- **Build directly** for small changes.
- **Skip the sketch** when told to, and take feedback on what ships.

When a sketch is rejected, do not offer a rollback as the creative answer. Say what's new, or propose something new.

## Phase 4: build in small batches

- 2–4 related slides per round.
- Every piece of feedback becomes a numbered item in the ledger, quoted verbatim.
- Refer to every slide by number. Explain in simple terms.
- Report per item: done, how it was measured, not done. Say what has and has not changed on each slide. Never report "all done" without per-item status.
- Disclose when reality forced a departure from what was promised, and by how much.
- "Let's build the rest first, then circle back" is an instruction to keep moving. Don't polish one slide while others wait.
- When a slide fails twice, stop and ask what the user sees, or ask for the tells. Repeat failure on one object wears patience fast.

**Before editing:** read the slide's markup and CSS. Check the property isn't already declared later in the cascade. Never delete CSS by searching for comment boundaries. Stamp the version in the HTML comment so stale caches are identifiable. Update comments and checks along with the code.

## Phase 5: verify before reporting

Do all of this before saying anything is done. Details in `references/verification.md`.

1. Run `assets/starter/js/audit.js` on **every beat of every touched scene and its neighbours**. `mustFix` must be empty, or each flag justified to the user.
2. Prove motion gates by sampling opacity over time. A frozen frame can hide the behaviour.
3. Scan computed colours for anything outside the palette.
4. Walk each slide's click states for "One point per view". List any state still showing more than one point, and check the slide count against any limit.
5. Self-critique as a designer. Is the dominant element bold enough? Does it read from the back? Would the user call it plain?
6. Report. State what measurement cannot prove. Tell the user how to see it: **Ctrl+Shift+R** for HTML, CSS and JS, plain **F5** for `notes.txt`.

**Measure with scripts first.** Take screenshots only when a check needs one or the user asks. They cost tokens and the user can see the slide.

## Visual short list

Full detail in `references/design-system.md`.

- Stage is a fixed 1600×900 scaled to fit. No width-based media queries.
- Content sits inside a 1408×720 pad. Nothing below y=784. Body text never under 22px.
- If the dominant element could be 40% bigger, it is too small. Diagrams take 60–70% of the stage where a diagram is the point.
- "Plain" means flat: modest scale, white everywhere, thin strokes, no depth. Fix that, not the motion.
- Light and dark are chosen on purpose, one meaning each. For example: dark = proof, light = story.
- Few hues, from the deck's theme file. Slides name roles, never hex. Red only if a negative impression is intended.
- Text 4.5:1, chart strokes 3:1, hairlines never under 2px. Text must clear contrast with any glow removed.
- One title in one place. Corner text must not resemble in-body captions.
- One line-icon system. Never emoji. Tasks that differ get their own diagrams, not word lists.
- Think of it as UX design for slides: one anchor at a time, where does the eye go, what is safe to dim.

## Motion short list

Full detail in `references/motion.md`.

- **Motion argues, it never decorates.** One gesture applied 77 times is how a deck starts to look like a template.
- Four registers, each a different gesture: editorial, precision, data, cinematic. Cinematic is scarce and named in the brief.
- The morph: one object relocates on a beat to make room for another. `transform` only, gated with `:has(.X.in)`, with a reduced-motion escape.
- `data-beats="2"` means **three** states and three note blocks.
- Motion finishes before the spoken paragraph does: budget about 80% of words ÷ 145 wpm.
- Copy appears only after the object settles. Outgoing copy clears before the incoming layer moves.
- Set pieces PLAY forward and SNAP on back, jump or reduced motion.
- Cinematic morphs of .7–.95s override generic "150–300ms" advice for compositional moves. Keep short durations for micro-interactions.

## Voice: this rules every word

The speaker's own voice is mandatory on slides, in notes, and in anything spoken. Ask for a sample if you have none. The story structure is theirs to choose; `references/script-story.md` is optional reference, not a method to impose.

Default, until a sample says otherwise:

> Simple, direct, honest, slightly understated. Not a TED Talk, a LinkedIn post, a motivational speaker or corporate jargon. No motivational quotes, no manufactured profoundness.

- Concrete detail over abstract lesson statements.
- No stacked moral on every anecdote. Some sections end flat.
- No bragging.
- Keep human uncertainty. Frame meaning around the value or difference to other people, not around the speaker.
- Run drafts through a humanizer skill if one is available, then compare them against the sample.
- Their trims stand. If a trim moves load onto a slide, name it; don't argue the trim back in.

## Working style

- Keep replies short. No recap, no narrated options. Number the slides.
- Ask only questions that change the work, batched together. A request for clarifying questions means ask once, properly.
- Be honest about feasibility, and challenge the user when you disagree.
- "Give me the plan first" means a plan and no edits yet.
- Outside critiques the user pastes in are input to weigh, not orders. Say which points you'd take and why.
- Assume the user will look at what you claim.

## Medium

Ask at kickoff. Recommend, then let the user decide.

| Pick | When | Route |
|---|---|---|
| **HTML** | Heavy motion or set pieces; presented from their own laptop; a live presenter window | Copy `assets/starter/`. See `references/engine.md`. Proven on one 32-slide deck from a served folder. |
| **PPTX** | Others must edit it; it travels as a file; a corporate template applies | A PPTX skill if available, otherwise pptxgenjs directly, plus `references/pptx.md`. Proven once, on a 13-slide deck. |

The design, voice, gating and ledger rules apply to both. Only the mechanics differ.

## How other skills fit

All optional. This skill works without them, and sets direction when they are present. If one isn't installed, carry on with the fallback.

| Skill | Use | Without it |
|---|---|---|
| `impeccable` | Craft and critique. The brief here still wins. | Use the self-critique in Phase 5. |
| `ui-ux-pro-max` | Animation quality and UX checks. It can drift on colour, and its 150–300ms and mobile-first rules don't apply to compositional motion on a fixed stage. | Use `references/motion.md`. |
| `frontend-slides` | Single-file HTML deck patterns. Consider it when starting fresh. | Use `assets/starter/`. |
| `humanizer` | Every spoken line. | Read it aloud against the voice sample. |
| A PPTX skill | The PPTX route. | pptxgenjs directly. |
| `dataviz` | Chart forms and colour checks, within the deck's palette. | Use section 9 of `references/design-system.md`. |

## Workflow shape

One session by default. Only for a very large deck, or if the user asks, split into a Director session and an Exec session: `references/director-exec.md`. It costs overhead and pasting, so don't reach for it unprompted.

## References

| File | Read when |
|---|---|
| `references/style-discovery.md` | Choosing a new deck's look: the questions, the five themes, the preview, brand colours, fonts |
| `references/design-system.md` | Designing any slide: stage, type, colour method, chrome, charts, boldness |
| `references/motion.md` | Choreographing anything: beats, registers, morphs, tiers, pacing, set pieces, Three.js |
| `references/engine.md` | Starting an HTML deck or touching the engine, presenter, notes or build |
| `references/verification.md` | Before reporting done; using `audit.js`; how it was calibrated |
| `references/case-studies.md` | A concept is stuck, or you are about to attempt something big. Also holds the anti-pattern table. |
| `references/env-gotchas.md` | A tool, shell or browser misbehaves |
| `references/director-exec.md` | The two-session split, and how to write a gate brief |
| `references/script-story.md` | Only if the user wants help with story structure |
| `references/pptx.md` | The deck is PPTX |
| `assets/starter/` | Copy as the base of a new HTML deck |
| `assets/starter/style-preview.html` | Showing three looks side by side during style discovery |
| `assets/deck-brief-template.md` | Copy into the project at kickoff |
| `assets/preferences-template.md` | The user wants their tastes to carry across decks |
| `assets/examples/planet-3d.js` | A complete WebGL set piece to read before attempting one |
