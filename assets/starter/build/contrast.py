#!/usr/bin/env python
"""
Contrast validator.

Two projector rules are hard invariants:
    minimum contrast 4.5:1 for text, 3:1 for chart strokes and data marks

"Projector-safe" is only worth anything if it is checked. This reads the
colour tokens straight out of a theme file, computes the real WCAG ratio for
every pair the deck's roles produce, and fails loudly on any that fall short.

Run:
    python build/contrast.py                          # every theme in styles/themes
    python build/contrast.py styles/themes/my.css     # one theme

Run it after every palette change: a new theme, brand colours dropped into a
stock theme, or a single token nudged. Tokens it reports as FILL-ONLY may be
used for large shapes, washes and highlights, never for text or thin lines.
"""

import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
THEMES = HERE.parent / "styles" / "themes"

# (foreground, background, role, required ratio)
PAIRS = [
    # --- text on light scenes: 4.5:1 ---
    ("ink",            "ground",      "body text",                 4.5),
    ("ink",            "ground-alt",  "body text on panel",        4.5),
    ("ink",            "wash",        "body text on zone fill",    4.5),
    ("primary",        "ground",      "primary-coloured text",     4.5),
    ("primary",        "ground-alt",  "primary text on panel",     4.5),
    ("primary",        "wash",        "primary text on zone fill", 4.5),
    ("ink-soft",       "ground",      "secondary text",            4.5),
    ("ink-soft",       "ground-alt",  "secondary text on panel",   4.5),
    ("accent-ink",     "ground",      "accent label text",         4.5),
    ("ground",         "primary",     "reversed text",             4.5),

    # --- text on dark scenes: 4.5:1 ---
    ("dark-ink",       "dark-ground", "text on dark",              4.5),
    ("dark-ink-soft",  "dark-ground", "secondary text on dark",    4.5),
    ("dark-primary",   "dark-ground", "primary text on dark",      4.5),
    ("accent-on-dark", "dark-ground", "accent text on dark",       4.5),

    # --- strokes and data marks: 3:1 ---
    ("primary",        "ground",      "chart series 1",            3.0),
    ("primary-mid",    "ground",      "chart series 2",            3.0),
    ("support-deep",   "ground",      "chart series 3",            3.0),
    ("accent",         "ground",      "accent series / marks",     3.0),
    ("ink-soft",       "ground",      "axis and tick labels",      3.0),
    ("dark-primary",   "dark-ground", "series 1 on dark",          3.0),
    ("accent-on-dark", "dark-ground", "accent series on dark",     3.0),
    ("support",        "dark-ground", "series 3 on dark",          3.0),
]

# Colours that only ever fill. Reported with their ratio so nobody promotes
# one to text or a thin line by accident.
FILL_ONLY = ["support", "wash", "ground-alt", "rule"]


def read_tokens(theme: pathlib.Path) -> dict:
    text = theme.read_text(encoding="utf-8")
    return {m.group(1): m.group(2)
            for m in re.finditer(r"--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b", text)}


def lum(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = out
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def check(theme: pathlib.Path) -> int:
    tokens = read_tokens(theme)
    print(f"\n== {theme.name}")
    failures = []
    for fg, bg, role, need in PAIRS:
        if fg not in tokens or bg not in tokens:
            missing = fg if fg not in tokens else bg
            print(f"  MISSING --{missing}  ({role})")
            failures.append(role)
            continue
        r = ratio(tokens[fg], tokens[bg])
        ok = r >= need
        if not ok:
            failures.append(role)
        print(f"  {fg:15s} on {bg:12s} {role:27s} {r:5.2f}:1 / {need:.1f}  "
              f"{'ok' if ok else 'FAIL'}")

    fills = [f"--{t} {ratio(tokens[t], tokens['ground']):.2f}:1"
             for t in FILL_ONLY if t in tokens and 'ground' in tokens]
    print(f"  fill-only (vs ground): {', '.join(fills)}")
    if failures:
        print(f"  {len(failures)} pair(s) below the projector floor")
    return len(failures)


def main() -> int:
    themes = [pathlib.Path(a) for a in sys.argv[1:]] or sorted(THEMES.glob("*.css"))
    if not themes:
        print("no theme files found")
        return 1
    bad = sum(check(t) for t in themes)
    print("\nall pairs clear the projector floor." if not bad
          else f"\n{bad} failing pair(s). Darken the foreground or lighten the ground, then rerun.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
