# Environment gotchas

Things that cost time at least once. The setup was Windows 11 with Git Bash, PowerShell and a browser pane driven by automation, so some items are specific to that.

## Serving and caching

- Serve with `python -m http.server 8123 --bind 127.0.0.1`, run in the background. `file://` blocks notes and modules.
- Automated browsers cache CSS and JS. Add a cache-buster, reload, then take the buster out.

## Browser automation

- A hidden browser pane or tab may not composite, so timing and animation numbers are unreliable. Prefer DOM reads.
- Automated browsers often force reduced motion on. Press `M` or set `window.__forceMotion = true`.
- JS calls may have a time limit: about 8–11 scenes per audit call fitted in 30s. Top-level `return` may not be allowed; end with an expression.
- Reading right after `Deck.fwd()` catches mid-transition. Measure in a separate call.
- A browser JS call can fail once with a temporary-unavailable message. Retry once.

## Files

- A big `index.html` can't be read whole. Locate a section with:
  `re.search(r'<section\b[^>]*?data-scene="NAME".*?</section>', h, re.S)`
- python-docx splits sentences across runs. Print `len(p.runs)` before replacing text.
- Some file-reading tools strip `/* */` comments from JS. Raw-read comment blocks before editing near them.
- Set up history at kickoff. A new project folder is not a git repository by default.

## Windows

- PowerShell 5.1 has no `&&`. In Bash, `cmd1 && cmd2` short-circuits when `grep` finds nothing.
- The console is often cp1252. Encode non-ASCII when printing, and open files with `io.open(..., encoding="utf-8", newline="")`.
- `grep` can report "Binary file (standard input) matches" on non-ASCII. Use `grep -a`.
- An apostrophe in a shell command can break quoting if your tooling wraps commands. Write such content to a file instead.

## For the user

- Ctrl+Shift+R for HTML, CSS and JS.
- Plain F5 for `notes.txt`.
- Serve the folder; `file://` blocks notes and modules.
- Fullscreen `F`, presenter `P`. Presenter window on the laptop, deck on the projector.
- Projector overscan: `-` and `=` nudge the zoom, `0` resets.
