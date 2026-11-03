# Presentuitive

Present + Intuitive: a Claude Code skill for building presentations in fewer rounds of revision.

It directs the whole job: creative direction, slide design, motion, speaker notes, presenter mode, script voice and checking the result. It comes with a working HTML deck starter and notes for PowerPoint.

Most deck rework comes from the same few loops: rebuilding a slide you only wanted improved, inventing facts, polishing a visual in a medium that can't render it, reporting "done" when it isn't. Each rule here exists to head off one of those loops.

## Install

```bash
git clone https://github.com/Jo-and-co/presentuitive.git ~/.claude/skills/presentuitive
```

Then start a new Claude Code session. The skill loads by itself when you ask for anything to do with slides.

## Use

```text
Build a 10-minute deck from script.docx. The audience is non-technical.
Slide 12 looks plain, fix it.
What do you think of this deck? No changes yet.
Turn these notes into a PowerPoint my team can edit.
```

Small requests stay small: fixing one slide skips the kickoff questions.

## What's inside

| Path | What it is |
|---|---|
| `SKILL.md` | The main instructions |
| `references/` | Detail on design, motion, the engine, checking, PPTX and past failures, read only when needed |
| `assets/starter/` | A working 5-slide HTML deck: beats, morphs, presenter window, notes file, audit script |
| `assets/examples/planet-3d.js` | A complete WebGL set piece to read before attempting one |
| `assets/deck-brief-template.md` | Per-deck record of facts, slide jobs, decisions and feedback |
| `assets/preferences-template.md` | Optional tastes that carry across decks |

## Requirements

| For | You need |
|---|---|
| The skill itself | Claude Code |
| Serving an HTML deck, contrast check | Python 3 |
| Rebuilding fonts (optional) | `fontTools` and `brotli` |
| Single-file build (optional) | Node.js |
| PowerPoint decks | A PPTX skill, or `pptxgenjs` |
| Measuring PowerPoint layout (optional, Windows) | PowerPoint and `pywin32` |

## Your own preferences (optional)

Copy `assets/preferences-template.md` to `~/.claude/presentuitive-preferences.md` and fill it in. It overrides the skill's default tastes, including voice, colours, punctuation and how much motion you like.

## Other skills

None are required. If you have `impeccable`, `ui-ux-pro-max`, `frontend-slides`, `humanizer`, `dataviz` or a PPTX skill, this one will make use of them. `SKILL.md` lists the fallback for each.

## How mature is this?

Early, and worth being clear about:

- It was built from one real 32-slide HTML deck and one 13-slide PowerPoint deck.
- The audit script was calibrated on that one HTML deck and on the starter. It may need tuning on a deck with a very different structure.
- The starter has passed its checks but has not yet been used to build a real new deck.
- It has not been tested by other people or on other machines. Most of the work happened on Windows.
- A clean audit proves nothing collides. It doesn't prove a slide is good.

Issues and reports of what happened on your own deck are welcome.

## Licence

MIT, see [LICENSE](LICENSE). Bundled fonts and Three.js keep their own licences, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
