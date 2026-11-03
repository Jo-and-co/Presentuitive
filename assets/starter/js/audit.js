/* presentuitive audit. Walks every beat of the chosen scenes and reports what the
   user has historically had to point out by hand. Author-space px (1600x900).

   In the live page, as two separate tool calls so the first has time to load:
     const s = document.createElement('script');
     s.src = 'js/audit.js'; document.head.append(s);       // same origin, or any URL
     __audit({ from: 0, to: 7 })                           // batches of 8 scenes

   Result: `mustFix` is what the user would reject on sight. `advice` is worth a
   look but an approved deck can legitimately have it. Calibrated against the
   approved 32-slide deck; see references/verification.md for what it found there.

   Options: from, to, floor (content floor, default 784), minFont (default 15),
   minBody (default 22), ignore (extra CSS selector to skip), limit (default 80).
   Add data-audit-ignore to intentional ghost layers.

   A clean report proves there is no collision. It does not prove the slide is good. */
(function () {
  'use strict';
  const STAGE = { w: 1600, h: 900 };
  const MUST = new Set(['TEXT_OVERLAP', 'LINE_THROUGH_TEXT', 'OFF_STAGE', 'TEXT_ON_CHROME', 'TEXT_ON_MEDIA', 'CONTRAST', 'DASH']);

  const parseRGB = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  };
  const hueBucket = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d < .15) return null;                     // near-neutral: not a hue
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return Math.round(h / 30) * 30 % 360;
  };

  // Effective opacity and visibility, walking up to the scene.
  function shown(el, scene) {
    let o = 1;
    for (let n = el; n && n !== scene.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity);
      if (o < .05) return 0;
    }
    return o;
  }

  const SHAPES = 'rect,circle,ellipse,polygon,path';
  const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  window.__audit = function (opts) {
    opts = opts || {};
    const D = window.Deck, deck = document.getElementById('deck');
    if (!D || !deck) return { error: 'window.Deck or #deck not found' };
    const FLOOR = opts.floor || 784, MIN = opts.minFont || 15, BODY = opts.minBody || 22;
    const skip = '[data-audit-ignore]' + (opts.ignore ? ',' + opts.ignore : '');
    const home = D.state;
    const kill = document.createElement('style');
    kill.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
    document.head.append(kill);

    const dr = deck.getBoundingClientRect(), K = STAGE.w / dr.width;
    const box = (r) => ({
      x: (r.left - dr.left) * K, y: (r.top - dr.top) * K,
      w: r.width * K, h: r.height * K,
    });
    // A text rect is the font's full height. Keep the part letters actually occupy.
    const ink = (b) => ({ x: b.x, w: b.w, y: b.y + b.h * .17, h: b.h * .66 });
    const toScreen = (x, y) => ({ x: dr.left + x / K, y: dr.top + y / K });

    const scenes = [...D.scenes];
    const from = opts.from || 0;
    const to = Math.min(opts.to == null ? scenes.length - 1 : opts.to, scenes.length - 1);
    const out = [], hues = {}, seen = new Set(), small = {};
    let states = 0;
    const add = (si, bi, type, msg) => {
      const k = si + '|' + type + '|' + msg;
      if (seen.has(k)) return;        // first beat it appears in is enough
      seen.add(k);
      out.push({ slide: si, beat: bi, scene: scenes[si].dataset.scene, type, msg });
    };
    const label = (t) => '"' + t.trim().replace(/\s+/g, ' ').slice(0, 34) + '"';
    const rnd = (b) => [b.x, b.y, b.w, b.h].map(Math.round).join(',');
    const inBox = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

    for (let si = from; si <= to; si++) {
      const scene = scenes[si];
      const beats = +(scene.dataset.beats || 0);
      for (let bi = 0; bi <= beats; bi++) {
        D.jump(si, bi); states++;

        // Everything opaque that is painted, in document order.
        const paint = [];
        scene.querySelectorAll('*').forEach((n) => {
          if (n.closest('defs,symbol,clipPath,mask,style,script') || n.closest(skip)) return;
          const o = shown(n, scene);
          if (!o) return;
          const cs = getComputedStyle(n);
          [cs.color, cs.backgroundColor, cs.fill, cs.stroke].forEach((c) => {
            const p = parseRGB(c); if (!p || p.a < .15) return;
            const h = hueBucket(p); if (h == null) return;
            (hues[h] = hues[h] || new Set()).add(si);
          });
          if (o < .5) return;
          const b = box(n.getBoundingClientRect());
          if (b.w < 2 || b.h < 2) return;
          if (n.matches('img,video,canvas')) { paint.push({ n, b, media: true }); return; }
          if (n.closest('svg')) {
            if (!n.matches(SHAPES)) return;
            const c = parseRGB(cs.fill);
            if (c && c.a * parseFloat(cs.fillOpacity) > .8) paint.push({ n, b, c, svg: true });
            return;
          }
          if (cs.backgroundImage !== 'none') { paint.push({ n, b, unknown: true }); return; }
          const c = parseRGB(cs.backgroundColor);
          if (c && c.a > .8) paint.push({ n, b, c });
        });
        const contains = (p, x, y) => {
          if (!inBox(p.b, x, y)) return false;
          if (!p.svg) return true;
          const ctm = p.n.getScreenCTM(); if (!ctm || !p.n.isPointInFill) return true;
          const s = toScreen(x, y), pt = p.n.ownerSVGElement.createSVGPoint();
          pt.x = s.x; pt.y = s.y;
          return p.n.isPointInFill(pt.matrixTransform(ctm.inverse()));
        };
        // What sits directly behind this text. null = gradient or photo, cannot judge.
        const behind = (el, x, y) => {
          for (let i = paint.length - 1; i >= 0; i--) {
            const p = paint[i];
            if (p.n === el || el.contains(p.n)) continue;
            if (follows(el, p.n) && !p.n.contains(el)) continue;   // painted after the text
            if (contains(p, x, y)) return p.c || null;
          }
          const sb = getComputedStyle(scene);
          if (sb.backgroundImage !== 'none') return null;
          for (const pseudo of ['::before', '::after']) {
            const ps = getComputedStyle(scene, pseudo);
            if (ps.content !== 'none' && (ps.backgroundImage !== 'none' || (parseRGB(ps.backgroundColor) || {}).a > .05)) return null;
          }
          const sc = parseRGB(sb.backgroundColor);
          if (sc && sc.a > .8) return sc;
          return parseRGB(getComputedStyle(deck).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
        };

        const lines = [];              // one rect per rendered line of text
        const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          if (!t.textContent.trim()) continue;
          const el = t.parentElement;
          if (!el || el.closest(skip) || el.closest('style,script,title,desc,defs,symbol')) continue;
          const o = shown(el, scene);
          if (!o) continue;
          const range = document.createRange(); range.selectNodeContents(t);
          let rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
          if (!rects.length && el.getBoundingClientRect) rects = [el.getBoundingClientRect()];
          if (!rects.length) continue;
          const cs = getComputedStyle(el);
          let fs = parseFloat(cs.fontSize);
          if (el.closest('svg') && el.getScreenCTM) {
            const m = el.getScreenCTM(); fs *= (m ? m.a : 1) * K;
          }
          if (fs < 1) continue;        // collapsed by a transform, not on screen
          const halo = cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 1 && /stroke/.test(cs.paintOrder);
          rects.forEach((r) => { const b = box(r); lines.push({ el, text: t.textContent, b, i: ink(b), fs, o, cs, halo }); });

          if (fs < MIN && t.textContent.trim().length > 2) {
            const k = si, e = small[k] = small[k] || { n: 0, min: 99, eg: '', bi };
            e.n++; if (fs < e.min) { e.min = fs; e.eg = label(t.textContent); }
          } else if (fs < BODY && t.textContent.trim().split(/\s+/).length > 8) {
            add(si, bi, 'SMALL_BODY', label(t.textContent) + ' ' + fs.toFixed(1) + 'px sentence, body floor ' + BODY);
          }
          if (/[–—]/.test(t.textContent)) add(si, bi, 'DASH', label(t.textContent) + ' has an em or en dash');

          const fg = parseRGB(el.closest('svg') ? (cs.fill !== 'none' ? cs.fill : cs.color) : cs.color);
          const f = box(rects[0]);
          const words = /[a-z0-9]/i.test(t.textContent);   // a chevron or dot is decoration
          const bg = fg && words && o > .5 ? behind(el, f.x + f.w / 2, f.y + f.h / 2) : null;
          if (bg) {
            const c = ratio(fg, bg), need = fs >= 24 ? 3 : 4.5;
            if (c < need) add(si, bi, 'CONTRAST', label(t.textContent) + ' ' + c.toFixed(2) + ':1, needs ' + need);
          }
        }

        // Geometry, line against line, on letter shapes rather than font boxes.
        for (let i = 0; i < lines.length; i++) {
          const a = lines[i], A = a.i;
          if (A.x < -1 || A.y < -1 || A.x + A.w > STAGE.w + 1 || A.y + A.h > STAGE.h + 1)
            add(si, bi, 'OFF_STAGE', label(a.text) + ' box ' + rnd(A));
          if (A.y + A.h > FLOOR + 1 && A.y < STAGE.h)
            add(si, bi, 'BELOW_FLOOR', label(a.text) + ' bottom y=' + Math.round(A.y + A.h) + ', floor ' + FLOOR);
          for (let j = i + 1; j < lines.length; j++) {
            const b = lines[j], B = b.i;
            if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
            const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
            if (ox > 2 && oy > 1) {
              add(si, bi, 'TEXT_OVERLAP', label(a.text) + ' x ' + label(b.text) + ' by ' + Math.round(ox) + 'x' + Math.round(oy));
            } else if (ox > 8 && oy > -3 && a.el.parentElement !== b.el.parentElement) {
              add(si, bi, 'TOO_CLOSE', label(a.text) + ' and ' + label(b.text) + ' gap ' + Math.max(0, Math.round(-oy)) + 'px');
            }
          }
        }

        // Words crossed by a drawn line: the rejection a box check cannot see.
        scene.querySelectorAll('svg line, svg polyline, svg path').forEach((g) => {
          if (g.closest(skip) || g.closest('defs,symbol,clipPath,mask')) return;
          const gs = getComputedStyle(g);
          const stroke = parseRGB(gs.stroke);
          if (!stroke || stroke.a < .1 || !g.getPointAtLength) return;
          if (shown(g, scene) * parseFloat(gs.strokeOpacity) < .3) return;
          const len = g.getTotalLength(), off = parseFloat(gs.strokeDashoffset) || 0;
          const drawn = off > 0 ? len - off : len;
          if (!len || drawn < len * .02) return;                 // not drawn yet
          const ctm = g.getScreenCTM(); if (!ctm) return;
          // Walk the line, not the text: a grid of samples over a word misses a thin line.
          const step = Math.max(1.5 / (Math.hypot(ctm.a, ctm.b) * K), len / 2000);
          const later = paint.filter((p) => p.n !== g && follows(g, p.n));
          const open = new Set(lines.filter((l) => !l.halo));
          for (let d = 0; d <= drawn && open.size; d += step) {
            const q = g.getPointAtLength(d);
            const x = (ctm.a * q.x + ctm.c * q.y + ctm.e - dr.left) * K;
            const y = (ctm.b * q.x + ctm.d * q.y + ctm.f - dr.top) * K;
            open.forEach((l) => {
              if (!inBox(l.i, x, y) || later.some((p) => contains(p, x, y))) return;
              open.delete(l);
              add(si, bi, 'LINE_THROUGH_TEXT', label(l.text) + ' crossed by <' + g.tagName + (g.getAttribute('class') ? ' .' + g.getAttribute('class').split(' ')[0] : '') + '>');
            });
          }
        });

        // Words on a photo that is not the slide's backdrop, and words on the chrome.
        const inset = paint.filter((p) => p.n.matches('img,video') && p.b.w * p.b.h < STAGE.w * STAGE.h * .55);
        const chrome = ['#act-eyebrow.show', '#rail', '#slide-no'].map((q) => document.querySelector(q)).filter((c) => c && c.textContent.trim()).map((c) => ({ n: c.id, b: box(c.getBoundingClientRect()) }));
        const hit = (A, B) => Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x) > 1 && Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y) > 1;
        for (const l of lines) {
          for (const m of inset) if (hit(l.i, m.b) && !l.el.closest('figcaption,[data-audit-on-media]')) add(si, bi, 'TEXT_ON_MEDIA', label(l.text) + ' on <' + m.n.tagName + '>');
          for (const c of chrome) if (hit(l.i, c.b)) add(si, bi, 'TEXT_ON_CHROME', label(l.text) + ' hits #' + c.n);
        }

        // Awkward wraps: a last line much shorter than the rest of the block.
        const byEl = new Map();
        lines.forEach((l) => { if (!byEl.has(l.el)) byEl.set(l.el, []); byEl.get(l.el).push(l); });
        byEl.forEach((ls, el) => {
          if (el.closest('svg')) return;
          const rows = [];
          ls.forEach((l) => {
            const r = rows.find((q) => Math.abs(q.y - l.b.y) < l.b.h * .5);
            if (r) { r.x2 = Math.max(r.x2, l.b.x + l.b.w); r.x1 = Math.min(r.x1, l.b.x); } else rows.push({ y: l.b.y, x1: l.b.x, x2: l.b.x + l.b.w });
          });
          if (rows.length < 2) return;
          rows.sort((p, q) => p.y - q.y);
          const widest = Math.max(...rows.map((r) => r.x2 - r.x1)), last = rows[rows.length - 1];
          const share = (last.x2 - last.x1) / widest;
          if (share < (ls[0].fs >= 40 ? .34 : .2)) add(si, bi, 'STRAY_LAST_LINE', label(ls[0].text) + ' last line is ' + Math.round(share * 100) + '% of the widest');
        });

        // Space used on the final state. Statement slides are meant to be sparse.
        if (bi === beats && lines.length) {
          const words = lines.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);
          const parts = paint.filter((p) => p.b.w < STAGE.w * .9 && p.b.h < STAGE.h * .9 && p.b.w > 12 && p.b.h > 12).map((p) => p.b);
          scene.querySelectorAll('svg').forEach((v) => { if (shown(v, scene) && !v.closest(skip)) { const b = box(v.getBoundingClientRect()); if (b.w < STAGE.w * .9) parts.push(b); } });
          const all = lines.map((l) => l.b).concat(parts);
          const x1 = Math.min(...all.map((b) => b.x)), x2 = Math.max(...all.map((b) => b.x + b.w));
          const y1 = Math.min(...all.map((b) => b.y)), y2 = Math.max(...all.map((b) => b.y + b.h));
          const fill = ((x2 - x1) * (y2 - y1)) / (1408 * 720);
          if (words > 24 && fill < .42) add(si, bi, 'UNDERUSED_SPACE', 'content spans ' + Math.round(x2 - x1) + 'x' + Math.round(y2 - y1) + ', ' + Math.round(fill * 100) + '% of the 1408x720 area');
        }
      }
    }
    kill.remove();
    D.jump(home.si, home.bi);

    Object.keys(small).forEach((k) => {
      const e = small[k];
      add(+k, e.bi, 'SMALL_TEXT', e.n + ' labels under ' + MIN + 'px, smallest ' + e.min.toFixed(1) + 'px: ' + e.eg);
    });
    const counts = {};
    out.forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });
    const hueOut = {};
    Object.keys(hues).forEach((h) => { hueOut[h + 'deg'] = hues[h].size + ' slides'; });
    const fmt = (i) => i.slide + '.' + i.beat + ' ' + i.type + ' ' + i.msg;
    const cap = opts.limit || 80;
    return {
      scenes: to - from + 1, statesChecked: states, counts, hueFamilies: hueOut,
      mustFix: out.filter((i) => MUST.has(i.type)).slice(0, cap).map(fmt),
      advice: out.filter((i) => !MUST.has(i.type)).slice(0, cap).map(fmt),
    };
  };
})();
