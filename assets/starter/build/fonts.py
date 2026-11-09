#!/usr/bin/env python
"""
Font pipeline.

Reads the font recipe at the top of each theme file (styles/themes/*.css),
downloads those families from Google Fonts as woff2, subsets them to the
glyphs the deck uses, and writes them to assets/fonts/.

Why this exists: a deck should render the same on a machine with no internet,
at a sane file size. Linking Google Fonts fails the first test, and embedding
the unsubsetted file once per weight fails the second.

The bundled themes already ship their fonts, so you only need this when you
change a theme's fonts or need glyphs outside CHARS (accents, other scripts).

Run:
    python build/fonts.py                       # every theme in styles/themes
    python build/fonts.py styles/themes/my.css  # one theme

Needs: pip install fonttools brotli

Recipe format, inside a comment in the theme file:

    /* @fonts
       Inter      | Inter:opsz,wght@14..32,300..700
       Newsreader | Newsreader:opsz,wght@72,500..700 | opsz=72
    */

Column 1 is the family name, column 2 the Google Fonts css2 query, column 3
optional axis pins applied after download. Use only fonts under the SIL Open
Font License with no Reserved Font Name (subsetting counts as modifying the
font). When you ship a new family, add its OFL text to licenses/ and a row to
THIRD_PARTY_NOTICES.md.
"""

import io
import json
import pathlib
import re
import sys
import urllib.request

from fontTools import subset as subsetter_mod
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
THEMES = ROOT / "styles" / "themes"
OUT = ROOT / "assets" / "fonts"

# A real browser UA, or the API serves ttf/eot legacy formats instead of woff2.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# --- glyph repertoire -------------------------------------------------------
# ASCII printable covers every latin letter, digit and common mark. The named
# extras are the typographic characters decks commonly use. Anything else
# falls back silently to a system font, so extend this for a new repertoire.
CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + (
    " "                   # nbsp
    "‘’“”" # curly quotes
    "–—"             # en dash, em dash
    "·•"             # middle dot, bullet
    "→←↓↑" # arrows
    "…"                   # ellipsis
    "×"                   # multiplication sign
    "−"                   # true minus for negative figures
    "©®"             # (c) (r)
    "‹›"             # single guillemets
    "°£€¥" # degree, pound, euro, yen
)


def read_recipe(theme: pathlib.Path) -> list[tuple[str, str, dict]]:
    text = theme.read_text(encoding="utf-8")
    m = re.search(r"@fonts\s*\n(.*?)\*/", text, re.S)
    if not m:
        raise SystemExit(f"{theme.name}: no @fonts recipe found")
    out = []
    for line in m.group(1).splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 2 or not parts[0]:
            continue
        pins = {}
        if len(parts) > 2 and parts[2]:
            for kv in parts[2].split(","):
                k, v = kv.split("=")
                pins[k.strip()] = float(v)
        out.append((parts[0], parts[1].replace(" ", "+"), pins))
    return out


def fetch_css(query: str) -> str:
    url = f"https://fonts.googleapis.com/css2?family={query}&display=block"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf8")


def latin_faces(css: str) -> list[tuple[str, str]]:
    """Google splits families into unicode-range blocks; keep only the plain
    'latin' block. Returns (font-weight, url) pairs: one for a variable family,
    one per cut for a static family."""
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
    """Pin unwanted variable axes, then cut to the glyph repertoire."""
    font = TTFont(src)
    if pins and "fvar" in font:
        live = {a.axisTag for a in font["fvar"].axes}
        todo = {k: v for k, v in pins.items() if k in live}
        if todo:
            font = instancer.instantiateVariableFont(font, todo, inplace=False,
                                                     updateFontNames=False)
            # Round-trip through bytes: the instancer leaves lazily loaded
            # tables the subsetter cannot read back reliably.
            buf = io.BytesIO()
            font.save(buf)
            buf.seek(0)
            font = TTFont(buf)

    opts = subsetter_mod.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "pnum", "ss01"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = [0, 1, 2, 3, 4, 6, 13, 14]   # keep copyright and licence
    opts.drop_tables += ["DSIG"]
    opts.recalc_bounds = True

    s = subsetter_mod.Subsetter(options=opts)
    s.populate(text=CHARS)
    s.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    font.close()


def main() -> None:
    themes = [pathlib.Path(a).resolve() for a in sys.argv[1:]] or sorted(THEMES.glob("*.css"))
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"subsetting to {len(set(CHARS))} unique glyphs\n")

    done, manifest = set(), []
    for theme in themes:
        for name, query, pins in read_recipe(theme):
            if query in done:
                continue
            done.add(query)
            faces = latin_faces(fetch_css(query))
            if not faces:
                raise SystemExit(f"no latin woff2 block found for {name}")
            slug = name.lower().replace(" ", "-")
            for weight, url in faces:
                tag = slug if len(faces) == 1 else f"{slug}-{weight}"
                raw = OUT / f"_raw-{tag}.woff2"
                download(url, raw)
                before = raw.stat().st_size
                out = OUT / f"{tag}.woff2"
                subset(raw, out, pins)
                raw.unlink()
                after = out.stat().st_size
                manifest.append({"family": name, "weight": weight,
                                 "file": out.name, "bytes": after})
                print(f"{name:16s} w{weight:<9s} {before/1024:6.1f}K -> {after/1024:6.1f}K")
                print(f"  @font-face {{ font-family: '{name}'; "
                      f"src: url('../../assets/fonts/{out.name}') format('woff2'); "
                      f"font-weight: {weight}; font-display: block; }}")

    (HERE / "fonts.manifest.json").write_text(json.dumps(manifest, indent=2))
    total = sum(m["bytes"] for m in manifest)
    print(f"\n{total/1024:.1f}K embedded. The deck renders correctly with no internet.")


if __name__ == "__main__":
    main()
