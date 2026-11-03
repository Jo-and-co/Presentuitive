# Director and Exec: optional split

**One session is the default.** This split was used on one large deck and worked, but pasting prompts between tabs added overhead and irritation. Use it only for a very large deck, or when asked.

The gate-brief format is useful either way: for a big set piece, write the brief for yourself.

## Roles

- **Director:** reviews, blueprints, writes paste-ready prompts. Doesn't edit deck files.
- **Exec:** a separate session that builds exactly what the brief says.
- **User:** pastes prompts, gives feedback on what ships. Shipped, rendered slides tend to get better feedback than scratch sketches once a direction is agreed.

Normal cadence is one slide at a time. Bump a version stamp each build so stale caches can be identified.

## Rule: don't trust the report

Exec "done" reports were repeatedly wrong. Copy was reported as gated while it sat at opacity 1 about 200ms into the advance. "All measurements pass" arrived with a slide the user called plain and boring. The Director verifies against disk and the live page before relaying anything.

## Gate brief anatomy

One document, the single source of truth.

1. **HARD RULES** ("violating any = reject"): don't invent facts, every word is specified; palette and a computed-colour scan; motion; script scope; stamp; register.
2. **PRE-CHECK, done first:** confirm scene indices via `data-scene` with `?goto`, paste current markup and CSS, grep for forbidden colours. **STOP if ambiguous.** This exists because one round was built on the wrong slide.
3. **Per-scene sections:** Keep list, Delete list, topology, verbatim copy, beats (b0…bN), palette assignment.
4. **Wow budget:** name the moments. Calm elsewhere, no more than 1–2 moving elements per view.
5. **VERIFY:** author-space geometry table per scene, every beat of every touched scene, palette scan, per-scene report with explicit confirmation of each deletion, stamp bump, build-log entry.

## Gated builds

For big or risky work: **PART A prototype, STOP, PART B after greenlight.** Part B must not start unprompted.

For a set piece, this order worked well:

WHY THIS REBUILD → HARD MECHANISM RULES → DEPENDENCY → THE OBJECT → STATE MACHINE → LABELS → COLOUR/TYPE/STAGE → GATE (Part A/B, checks (a) to (e)).

Opening with "why this rebuild" tells the Exec what failure looked like. Hard mechanism rules let the art change without breaking timing.

A shorter form for routine slides: TASK → PRE-CHECK → CONCEPT → BEATS → PALETTE → MOTION → VERIFY.

## Handoffs

When a session grows long, write a handoff with: operating model, current state, what's approved, what's rejected, facts, open items. Keep it in the project, not a temp folder.

A handoff can carry a mistake forward. One labelled a wrong figure as canonical, and later sessions trusted it. Check facts against the source.

## When a model may be the problem

If the user asks whether the model or effort level is the cause, answer honestly. A weak brief is more often the cause than the model, but a set piece can deserve higher effort. Don't defend it reflexively.
