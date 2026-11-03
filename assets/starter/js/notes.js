/* ============================================================================
   Deck presenter notes LOADER

   THE SCRIPT NO LONGER LIVES IN THIS FILE. It lives in notes.txt, next to
   index.html, as plain text — so it can be edited in Notepad without balancing
   a quote or remembering a comma. This file only reads that text and hands it
   to presenter.js in the shape it already expects:

       window.PRESENTER_NOTES = { 0: { title, say }, 20: { title, beats:[…] }, … }

   ONE THING MATTERS ABOUT THE ORDER OF EVENTS. presenter.js grabs
   `window.PRESENTER_NOTES` once, at load, into a const — and the fetch below
   finishes after that. So the object is created SYNCHRONOUSLY here and is
   later filled IN PLACE. Never reassign window.PRESENTER_NOTES; presenter.js
   would be left holding the empty original. When the fill is done a
   'notes-ready' event fires and presenter.js re-renders the current slide.

   FILE FORMAT (documented for the reader in notes.txt itself, at the top):
     === 12 · Some title ===    starts slide 12, titled "Some title"
     --- beat ---               splits a slide's note across its beats
     # anything                 a comment, ignored
     blank line                 a paragraph break in the panel
     soft line breaks           insignificant; re-joined with a space
   Everything before the first === heading is prose for the reader and is
   skipped, which is what lets notes.txt explain itself.
   ========================================================================= */
(function () {
  'use strict';

  // Created now, filled later. See the note above about the const capture.
  var NOTES = (window.PRESENTER_NOTES = {});

  var HEADER = /^===\s*(\d+)\s*(?:[·|\-–]\s*)?(.*?)\s*===\s*$/;
  var BEAT   = /^-{2,}\s*beat\s*-{2,}\s*$/i;
  var HASH   = /^\s*#/;

  function parse(text) {
    var lines = text.replace(/^﻿/, '').split(/\r?\n/);
    var out = {};
    var cur = null;          // { idx, title, blocks:[ [para,…], … ] }
    var block = null;        // the current beat's array of paragraph line-runs
    var para = null;         // the current paragraph's lines

    function closePara() {
      if (para && para.length) block.push(para.join(' '));
      para = null;
    }
    function closeBlock() { closePara(); }
    function closeSlide() {
      if (!cur) return;
      closeBlock();
      var texts = cur.blocks.map(function (b) { return b.join('\n\n'); });
      // Trailing empties are an artefact of a file that ends on a blank line;
      // an empty block in the MIDDLE is the author's, and is left alone.
      while (texts.length > 1 && !texts[texts.length - 1]) texts.pop();
      var rec = { title: cur.title };
      if (texts.length > 1) rec.beats = texts; else rec.say = texts[0] || '';
      out[cur.idx] = rec;
      cur = null;
    }

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var m = HEADER.exec(ln);
      if (m) {
        closeSlide();
        cur = { idx: +m[1], title: m[2], blocks: [] };
        block = []; cur.blocks.push(block); para = null;
        continue;
      }
      if (!cur) continue;                      // the reader's preamble
      if (HASH.test(ln)) continue;
      if (BEAT.test(ln)) { closeBlock(); block = []; cur.blocks.push(block); continue; }
      if (!ln.trim()) { closePara(); continue; }
      (para || (para = [])).push(ln.trim());
    }
    closeSlide();
    return out;
  }

  /* Resolved against this SCRIPT's own URL, not the document's, so it keeps
     working from presenter.html or any other page that includes js/notes.js. */
  function notesUrl() {
    var s = document.currentScript;
    var base = (s && s.src) || (location.origin + location.pathname);
    return new URL('../notes.txt', base).href;
  }

  /* cache:'no-store' rather than a cache-busting query: the point is that
     saving notes.txt and pressing F5 is enough. Without it the browser serves
     the stale copy and the edit looks like it did not take. */
  var url = notesUrl();
  fetch(url, { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (t) {
      var parsed = parse(t);
      var n = 0;
      for (var k in parsed) { NOTES[k] = parsed[k]; n++; }
      if (!n) throw new Error('no === slide headings found in notes.txt');
      window.dispatchEvent(new Event('notes-ready'));
    })
    .catch(function (err) {
      /* Loud, never silent. A blank panel mid-presentation reads as "this slide
         has no note"; this reads as "the file did not load, and here is why". */
      NOTES.__error =
        'Could not read notes.txt — ' + err.message + '\n\n' +
        'Looked for: ' + url + '\n\n' +
        'The deck must be served over a local server (python -m http.server). ' +
        'Opening index.html straight off the disk blocks the read.';
      window.dispatchEvent(new Event('notes-ready'));
    });
})();
