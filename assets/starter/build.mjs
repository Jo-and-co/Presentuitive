/* ============================================================================
   Deck build
   Inlines the folder into one self-contained HTML file that opens offline with
   zero dependencies -- the artefact the user presents from.

   The folder is the workshop; the file is the product. Editing happens here,
   against linked CSS/JS/assets; `node build.mjs` produces the shippable file.

   Why a build step rather than shipping index.html directly: the file:// CORS
   rule blocks fetch() and ES modules from disk, and base64-inlined fonts/video
   make the source uneditable at 3000+ lines. This resolves every <link>,
   <script src>, url(...) and asset reference to a data: URI or inline block at
   build time, so the output needs nothing external and the source stays sane.
   ========================================================================= */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
// Output name defaults to the shipped deck, but an optional CLI arg lets a build
// target a different file (e.g. `node build.mjs my-talk.html`)
// so a variant can be produced without clobbering the canonical output.
const OUT = resolve(HERE, '..', process.argv[2] || 'deck-final.html');

const MIME = {
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

function dataURI(absPath) {
  const buf = readFileSync(absPath);
  const mime = MIME[extname(absPath).toLowerCase()] || 'application/octet-stream';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function resolveRef(ref, baseDir) {
  // Strip querystrings/hashes for the filesystem lookup, keep nothing after.
  const clean = ref.split(/[?#]/)[0];
  return resolve(baseDir, clean);
}

// --- inline url(...) references inside a stylesheet -------------------------
function inlineCssUrls(css, cssDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    // fragment refs (url(#gradientId)) point at in-document SVG paint servers,
    // not files — leave them untouched (else they resolve to the dir → EISDIR).
    if (ref.startsWith('data:') || ref.startsWith('http') || ref.startsWith('#')) return m;
    const abs = resolveRef(ref, cssDir);
    if (!existsSync(abs)) {
      console.warn(`  ! css asset not found: ${ref}`);
      return m;
    }
    return `url(${dataURI(abs)})`;
  });
}

// --- main -------------------------------------------------------------------
let html = readFileSync(join(HERE, 'index.html'), 'utf8');
let inlinedCss = 0, inlinedJs = 0, inlinedAsset = 0;

// 1. <link rel="stylesheet" href="..."> -> <style>...</style>
html = html.replace(
  /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
  (m, href) => {
    const abs = resolveRef(href, HERE);
    let css = readFileSync(abs, 'utf8');
    css = inlineCssUrls(css, dirname(abs));
    inlinedCss++;
    return `<style data-from="${href}">\n${css}\n</style>`;
  }
);

// 2. <script src="..."> -> <script>...</script>
html = html.replace(
  /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
  (m, src) => {
    const abs = resolveRef(src, HERE);
    const js = readFileSync(abs, 'utf8');
    inlinedJs++;
    return `<script data-from="${src}">\n${js}\n</script>`;
  }
);

// 3. remaining asset references in attributes: src="assets/..", poster="..",
//    and href on <video>/<source>/<img>. Fonts/CSS urls are already handled.
html = html.replace(
  /\b(src|poster|href)=["'](assets\/[^"']+)["']/gi,
  (m, attr, ref) => {
    if (/rel=["']stylesheet/i.test(m)) return m;
    const abs = resolveRef(ref, HERE);
    if (!existsSync(abs)) { console.warn(`  ! asset not found: ${ref}`); return m; }
    inlinedAsset++;
    return `${attr}="${dataURI(abs)}"`;
  }
);

writeFileSync(OUT, html);

const kb = (readFileSync(OUT).length / 1024).toFixed(0);
console.log(`built ${OUT}`);
console.log(`  ${inlinedCss} stylesheet(s), ${inlinedJs} script(s), ${inlinedAsset} asset(s) inlined`);
console.log(`  ${kb} KB single-file output`);
if (kb > 8000) console.warn('  ! over 8MB — check the video encode');
