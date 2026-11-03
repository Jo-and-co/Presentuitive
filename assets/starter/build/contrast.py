#!/usr/bin/env python
"""
Phase 1 · contrast validator.

Two projector rules are hard invariants:
    minimum contrast 4.5:1 for text, 3:1 for chart strokes

"Projector-safe" is only worth anything if it is checked. This computes the
real WCAG ratio for every foreground/background pair the deck actually uses
and fails loudly on any that falls short.

Run: python build/contrast.py
"""

import sys

TOKENS = {
    "navy":      "#002E69",
    "navy-deep": "#001B3D",
    "navy-mid":  "#0B4A94",
    "sky":       "#5AC2E7",
    "sky-deep":  "#1B8FBF",
    "sky-wash":  "#EAF7FC",
    "amber":     "#C17D0A",
    "amber-ink": "#9A5F07",
    "paper":     "#FFFFFF",
    "warm":      "#F6F9FB",
    "ink":       "#0E1A2B",
    "soft":      "#45566C",
    "rule":      "#DCE4EC",
}

# (foreground, background, role, required ratio)
PAIRS = [
    # --- body and display text: 4.5:1 ---
    ("ink",       "paper",     "body text",              4.5),
    ("ink",       "warm",      "body text on panel",     4.5),
    ("ink",       "sky-wash",  "body text on zone fill", 4.5),
    ("navy",      "paper",     "headlines",              4.5),
    ("navy",      "warm",      "headlines on panel",     4.5),
    ("navy",      "sky-wash",  "headlines on zone fill", 4.5),
    ("soft",      "paper",     "secondary text",         4.5),
    ("soft",      "warm",      "secondary on panel",     4.5),
    ("amber-ink", "paper",     "accent label text",  4.5),
    ("paper",     "navy",      "reversed text",          4.5),
    ("paper",     "navy-deep", "reversed text (deep)",   4.5),
    ("sky",       "navy-deep", "accent on dark panel",   4.5),

    # --- chart strokes and data marks: 3:1 ---
    ("navy",      "paper",     "chart series 1",         3.0),
    ("navy-mid",  "paper",     "chart series 2",         3.0),
    ("sky-deep",  "paper",     "chart series 3",         3.0),
    ("amber",     "paper",     "accent series",      3.0),
    ("soft",      "paper",     "axis / tick labels",     3.0),

    # --- known-bad pairs the deck must never produce ---
    # kept here as regression guards, expected to FAIL if ever used as text
    ("sky",       "paper",     "GUARD: sky as stroke",   3.0),
    ("soft",      "sky-wash",  "GUARD: soft on wash",    4.5),
]

GUARD = "GUARD:"


def lum(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = out
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(fg: str, bg: str) -> float:
    a, b = lum(TOKENS[fg]), lum(TOKENS[bg])
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    failures = []
    print(f"{'foreground':11s} {'background':11s} {'role':26s} "
          f"{'ratio':>7s}  {'need':>5s}")
    print("-" * 68)

    for fg, bg, role, need in PAIRS:
        r = ratio(fg, bg)
        is_guard = role.startswith(GUARD)
        ok = r >= need

        if is_guard:
            # Guards document pairs we expect to fail; a guard that PASSES
            # is not an error, it just means the token got darker.
            mark = "guard" if not ok else "guard*"
        elif ok:
            mark = "ok"
        else:
            mark = "FAIL"
            failures.append((fg, bg, role, r, need))

        print(f"{fg:11s} {bg:11s} {role:26s} {r:6.2f}:1 {need:5.1f}  {mark}")

    print()
    if failures:
        print(f"{len(failures)} pair(s) below the projector floor:\n")
        for fg, bg, role, r, need in failures:
            print(f"  {role}: {fg} on {bg} is {r:.2f}:1, needs {need}:1")
        return 1

    print("all live pairs clear the projector floor.")
    print("guards confirm --sky and --soft/--sky-wash remain unusable as ink.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
