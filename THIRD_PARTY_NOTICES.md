# Third-party notices

This project is MIT licensed (see `LICENSE`), except for the components below, which keep their own licences.

| Component | Files | Licence | Full text |
|---|---|---|---|
| Archivo | `assets/starter/assets/fonts/archivo.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Archivo.txt` |
| Barlow | `assets/starter/assets/fonts/barlow-*.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Barlow.txt` |
| Figtree | `assets/starter/assets/fonts/figtree.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Figtree.txt` |
| Fraunces | `assets/starter/assets/fonts/fraunces.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Fraunces.txt` |
| Inter | `assets/starter/assets/fonts/inter.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Inter.txt` |
| JetBrains Mono | `assets/starter/assets/fonts/jetbrains-mono.woff2` | SIL Open Font License 1.1 | `licenses/OFL-JetBrains-Mono.txt` |
| Libre Franklin | `assets/starter/assets/fonts/libre-franklin.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Libre-Franklin.txt` |
| Literata | `assets/starter/assets/fonts/literata.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Literata.txt` |
| Newsreader | `assets/starter/assets/fonts/newsreader.woff2` | SIL Open Font License 1.1 | `licenses/OFL-Newsreader.txt` |
| Three.js | `assets/starter/js/vendor/three.core.min.js`, `three.module.min.js` | MIT | `licenses/MIT-three.js.txt` |

The font files are modified versions: `assets/starter/build/fonts.py` downloads them from Google Fonts, pins some variable axes and subsets them. They remain under the OFL, including when bundled in a deck you distribute. Under the OFL, documents made with the fonts are not themselves covered by it. None of these families declares a Reserved Font Name, so the modified files keep their original names.

Sources:

- Archivo: https://github.com/Omnibus-Type/Archivo
- Barlow: https://github.com/jpt/barlow
- Figtree: https://github.com/erikdkennedy/figtree
- Fraunces: https://github.com/undercasetype/Fraunces
- Inter: https://github.com/rsms/inter
- JetBrains Mono: https://github.com/JetBrains/JetBrainsMono
- Libre Franklin: https://github.com/googlefonts/Libre-Franklin
- Literata: https://github.com/googlefonts/literata
- Newsreader: https://github.com/productiontype/Newsreader
- Three.js: https://github.com/mrdoob/three.js

## Adapted guidance

Some of the written guidance adapts ideas from these MIT-licensed skills. No code from them is included. The examples and wording in this project are new.

| Source | What it informed | Licence | Full text |
|---|---|---|---|
| [humanizer](https://github.com/blader/humanizer), Siqi Chen | The list of wording tells and the rewrite loop in `references/wording.md` | MIT | `licenses/MIT-humanizer.txt` |
| [frontend-slides](https://github.com/zarazhangrui/frontend-slides), Zara Zhang | Style discovery by showing previews instead of asking for design vocabulary (`references/style-discovery.md`, `assets/starter/style-preview.html`) | MIT | `licenses/MIT-frontend-slides.txt` |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), Next Level Builder | Matching a style to its audience, and anti-patterns such as emoji icons (`references/style-discovery.md`, `references/anti-slop.md`) | MIT | `licenses/MIT-ui-ux-pro-max.txt` |

`humanizer` is itself based on Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) page. No text from that page is copied here.

## Acknowledgements

These shaped the thinking but nothing from them is copied or adapted: no text, code or examples.

- [impeccable](https://github.com/pbakaus/impeccable), Paul Bakaus (Apache 2.0): the idea of naming "AI slop" tells in design.
- The `dataviz` skill: the habit of choosing a chart's form from the question it answers.
