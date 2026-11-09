# Style discovery

How a deck gets its look. This runs after kickoff and before the style tiles, and its output is one theme file the whole deck uses.

Why it exists: a deck built on the starter's defaults looks like every other deck built on them. Feedback on early decks was that they looked machine-made, and the cause was not the layout. It was the same palette and the same type on every subject. Asking takes one round. Guessing wrong costs a rebuild.

## When to run it

| Situation | What to do |
|---|---|
| New whole deck | Run it in full. |
| Preferences file has a **Saved style** | Show it as the closest direction, next to two alternatives. Skip the questions unless the user wants a change. |
| Strict brand guide (fonts and colours given) | Skip the questions. Adapt the nearest theme to the guide and show one preview to confirm. |
| User says "just pick" | Pick from the audience and content, show one preview, and say why in one line. |
| Existing deck, a new slide, or a small change | Skip. The deck already has a look; keep it. |

## The questions

Ask them in one batch. Use the host's question tool if it has one (for example `AskUserQuestion`), otherwise one short message. Every question offers **Pick for me**: an unsure user should never have to guess at design vocabulary.

Skip any question the kickoff answers already settle.

1. **Vibe: how should the room feel?** Offer the three vibes from the table below that plausibly fit this audience and subject, plus Pick for me. The user can still name another.
2. **Colour: is there a brand to honour?** Options: "Yes, I'll share the colours or logo", "No, use a palette that fits", Pick for me.
3. **Type: what voice should headlines have?** Options: "Clean sans", "Editorial serif", "Condensed and loud", Pick for me.
4. **Light and dark: what should the ground be?** Options: "Mostly light, dark for the proof slides", "Mostly dark", "Light only", Pick for me.

When the answer is Pick for me, decide from the audience, the room and the content, and state the choice in one line with the reason ("Harbour: a finance panel in a lit room, so calm and light").

For the room: a washed-out projector favours light grounds and heavier weights; a dark hall favours dark grounds. The contrast floors hold either way.

## The bundled themes

Each lives in `assets/starter/styles/themes/`. The comment at the top of each file says what it suits.

| Theme | Vibe | Type | Colour | Suits |
|---|---|---|---|---|
| `harbour` | Calm, institutional, precise | Inter, Newsreader for the reserved voice | Deep navy, sky fills, one amber accent | Finance, consulting, public sector, internal reviews |
| `broadsheet` | Editorial, considered, literate | Literata headlines, Libre Franklin text | Ink on warm paper, one vermilion mark | Research, policy, strategy narratives, findings |
| `workshop` | Technical, hands-on, builder | Barlow, JetBrains Mono labels | Teal and safety orange on cool grey | Engineering, product demos, operations, data platforms |
| `poster` | Loud, confident, campaign | Archivo condensed capitals | Ultramarine and hard red on newsprint, yellow fills | Launches, pitches, keynotes, anything that must wake the room |
| `hearth` | Warm, human, approachable | Fraunces headlines, Figtree text | Forest and terracotta on cream | People, education, health, community, culture |

Adjacent pairs, for the second preview: harbour and broadsheet, broadsheet and hearth, workshop and harbour, poster and workshop.

## Show three directions

Copy `assets/starter/style-preview.html` into the project and edit only the two lists at the top of its script:

- **CONTENT:** the user's real title, one real sentence, a real comparison and one real number, all from the facts ledger. A look is judged on the words it will carry; placeholder text makes every theme look fine.
- **DIRECTIONS:** three entries, in this order:
  1. **Closest:** the best fit to the answers.
  2. **Adjacent:** a neighbour that differs on one axis (serif instead of sans, warm instead of cool).
  3. **Wildcard:** a real alternative that still suits the content. Not a joke option.

Each row shows one theme on a light statement slide and a dark data slide, with swatches and font names. Tell the user how to open it, and say they can pick one or mix ("type from the first, colours from the third").

Don't screenshot it for them unless asked. They can look.

## Adapt to a brand

1. Copy the nearest theme to `styles/themes/<deck>.css`. Rename the class in its selector (`:root, .theme-<deck>`).
2. Map brand colours to roles, not the other way round:
   - The brand's main colour becomes `--primary` if it reaches 4.5:1 on the ground. If it is too light for text (most bright brand blues and greens are), make it `--support` (fills only) and set `--primary` to a deeper shade of it.
   - A second brand colour becomes `--accent`, or `--support` if it is light.
   - Keep the theme's neutrals unless the brand defines its own.
3. Set the dark roles: `--dark-primary` and `--accent-on-dark` are usually lighter tints of the light ones.
4. Run `python build/contrast.py styles/themes/<deck>.css`. Fix every failure by darkening (on light) or lightening (on dark). Never by dropping a pair from the check.
5. Point `index.html` at the new file.

## Change fonts

Only when a theme's fonts don't suit, or a brand requires its own.

1. Edit three things in the theme file: the `@fonts` recipe in the top comment, the `@font-face` rules, and the `--font-*` variables.
2. Run `python build/fonts.py styles/themes/<deck>.css`. It downloads, subsets and writes the woff2 files to `assets/fonts/`.
3. Use only fonts under the SIL Open Font License **with no Reserved Font Name**: subsetting counts as modifying the font, and a reserved name forbids that under the original name. Check the font's `OFL.txt` for the words "Reserved Font Name". Source Serif and IBM Plex, for example, reserve theirs.
4. Add the licence to `licenses/` and a row to `THIRD_PARTY_NOTICES.md` if the deck will be shared.

Tune the display knobs rather than overriding classes: `--display-weight`, `--display-track` (a multiplier on the negative tracking; serifs want less), `--display-stretch` and `--display-case`.

## Never offer unprompted

These are the looks that read as generated. Use one only if the user's brand genuinely is it.

- Space Grotesk, DM Sans, Poppins or Montserrat as the headline face.
- Purple-to-blue gradients, neon on black, glassmorphism, glowing borders.
- A different accent colour on every slide.
- Emoji as icons.

## After the pick

1. Record it in the **Style** section of `deck-brief.md`: theme file, direction, fonts, and every token changed from the bundled theme.
2. Offer once to save it to the preferences file as **Saved style**, so the next deck starts from it.
3. Move on to the style tiles. They test the look on the deck's hardest slides; discovery only chooses it.

## PPTX decks

Run discovery the same way: the preview page is the fastest way to compare looks. Then carry the chosen theme's role colours into the PPTX theme colours and its fonts into the theme fonts. Embed the fonts or confirm they are installed on the presenting machine, since a PPTX doesn't carry them by default. See `references/pptx.md`.
