#!/usr/bin/env python
"""
Font pipeline.

Downloads the deck's fonts from Google Fonts as variable woff2, then subsets
them to the exact glyph repertoire the deck uses and re-emits woff2.

Why this exists: a deck should render the same on a machine with no internet,
at a sane file size. Linking Google Fonts fails the first test, and embedding
the unsubsetted file once per weight fails the second.

Output: assets/*.woff2 -- one file per family, all weights, subsetted.
"""

import json
import pathlib
import re
import urllib.request

from fontTools import subset as subsetter_mod
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
ASSETS.mkdir(exist_ok=True)

# A real browser UA, or the API serves ttf/eot legacy formats instead of woff2.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# --- glyph repertoire -------------------------------------------------------
# ASCII printable covers every latin letter, digit and common mark. The named
# extras are the typographic characters the deck actually uses: the mono
# dateline separator, the before/after arrow, real quotes and dashes.
CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + (
    " "   # nbsp
    "‘’“”"   # ' ' " "  curly quotes
    "–—"               # en dash, em dash
    "·•"               # middle dot (dateline sep), bullet
    "→←↓↑"   # arrows -- 60 min -> 5 min
    "…"                     # ellipsis
    "×"                     # multiplication sign
    "−"                     # true minus (not hyphen) for negative figures
    "©®"               # (c) (r), cheap insurance
    "‹›"               # single guillemets -- the map's org-path separator
)

FAMILIES = {
    # name -> (css2 query, axis pins applied after download)
    #
    # Inter-dominant, with ONE reserved serif (Newsreader) for the title,
    # section markers and close only. An earlier trio of three families read
    # as messy.
    #
    # Inter carries an opsz axis (14..32): pinning nothing keeps it variable so
    # `font-optical-sizing: auto` picks the display cut at large sizes and the
    # text cut in body copy -- the single-family way to get display character
    # without a second display face.
    "Inter": (
        "Inter:opsz,wght@14..32,300..700",
        {},
    ),
    # Newsreader is the reserved serif: a warm, readable text-face serif (not a
    # mannered display type), which suits the emotional lines without shouting.
    # opsz pinned to its display end so the title reads crisp at 96px.
    "Newsreader": (
        "Newsreader:opsz,wght@72,500..700",
        {"opsz": 72},
    ),
}


def fetch_css(query: str) -> str:
    url = f"https://fonts.googleapis.com/css2?family={query}&display=block"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf8")


def latin_faces(css: str) -> list[tuple[str, str]]:
    """Google splits families into unicode-range blocks; we only want the plain
    'latin' block -- latin-ext, cyrillic and greek are dead weight here.

    Returns (font-weight, url) pairs. A variable family yields one pair whose
    weight is a range like '300 700'; a static family yields one pair per cut,
    which is why a static family comes back as several entries and Inter as one.
    """
    out = []
    for b in css.split("@font-face"):
        if "U+0000-00FF" not in b:      # the latin block's signature range
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", b)
        wght = re.search(r"font-weight:\s*([^;]+);", b)
        if url:
            out.append((wght.group(1).strip() if wght else "400", url.group(1)))
    return out


def download(url: str, dest: pathlib.Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())


def subset(src: pathlib.Path, dest: pathlib.Path, pins: dict) -> None:
    """Pin the unwanted variable axes, then cut to the glyph repertoire.

    Order matters: instancing first means the subsetter only has to carry
    deltas for the axes we actually kept (weight), not for opsz/SOFT/WONK.
    """
    font = TTFont(src)

    # Google already instances the axes it is asked to pin in the css2 query,
    # so by the time a file reaches us the pinned axes may be gone and only
    # wght survives. Pin defensively: intersect with what fvar actually
    # still carries, and skip entirely for static cuts.
    if pins and "fvar" in font:
        live = {a.axisTag for a in font["fvar"].axes}
        todo = {k: v for k, v in pins.items() if k in live}
        if todo:
            font = instancer.instantiateVariableFont(font, todo, inplace=False,
                                                     updateFontNames=False)

    opts = subsetter_mod.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "tnum", "ss01"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = [1, 2, 3, 4, 6]
    opts.drop_tables += ["DSIG"]
    opts.recalc_bounds = True

    s = subsetter_mod.Subsetter(options=opts)
    s.populate(text=CHARS)
    s.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    font.close()


def main() -> None:
    print(f"subsetting to {len(set(CHARS))} unique glyphs\n")
    total = before_total = 0
    manifest = []

    for name, (query, pins) in FAMILIES.items():
        faces = latin_faces(fetch_css(query))
        if not faces:
            raise SystemExit(f"no latin woff2 block found for {name}")

        slug = name.lower().replace(" ", "-")
        for weight, url in faces:
            # A static family gives several cuts; tag the file with its weight
            # so its files do not overwrite each other.
            tag = slug if len(faces) == 1 else f"{slug}-{weight}"
            raw = ASSETS / f"_raw-{tag}.woff2"
            download(url, raw)
            before = raw.stat().st_size

            out = ASSETS / f"{tag}.woff2"
            subset(raw, out, pins)
            after = out.stat().st_size
            raw.unlink()

            total += after
            before_total += before
            manifest.append({"family": name, "weight": weight,
                             "file": out.name, "bytes": after})
            print(f"{name:16s} w{weight:<9s} {before/1024:6.1f}K ->"
                  f" {after/1024:6.1f}K  ({100 - after * 100 // before}% off)")

    (HERE / "fonts.manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"\n{before_total/1024:.1f}K downloaded -> {total/1024:.1f}K embedded")
    print("Fonts are embedded, so the deck renders correctly with no internet.")


if __name__ == "__main__":
    main()
