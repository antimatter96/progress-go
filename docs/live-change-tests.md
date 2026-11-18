# Live change-verification tests

The step-by-step check that dev-mode file changes actually reach the running app. Use it
after any change to the build pipeline (bundler, Tailwind upgrade, PostCSS/CSS tooling)
and re-run it whenever "my edit didn't show up" is reported. Used to verify both the
Tailwind v3→v4 upgrade and the Parcel→Vite migration.

## Ground rules

- **One change at a time, one file at a time** — so a failure points at exactly one layer.
- **Make the edit → tell the human → wait for their confirmation → revert → next test.**
  The human's eyes are the verdict; server-side greps are corroboration.
- **If any test fails, stop.** Later tests depend on the watcher/pipeline below them.
- **Revert every edit** before finishing so the working tree stays clean.
- Start from a known state: if `wails dev` was running while config/deps changed,
  **restart it once** first.
- Failure triage order: manual refresh once (HMR vs watch), then server-side check, then
  only then suspect the pipeline.

## The tests

### 1. Plain CSS rule — proves basic watch/reload
- Edit `frontend/src/style.css`: `body` `background-color` → **`#7f1d1d` (dark red)**.
- Expect: background instantly hot-swaps.
- ⚠️ Use a **high-contrast** value: a near-white pink change was invisible because the
  `radial-gradient` `background-image` sits on top of the `background-color`.

### 2. Utility class in `index.html` — proves HTML template scanning + JIT
- Edit `frontend/src/index.html`: `<h2>Progress</h2>` `text-3xl` → **`text-5xl`**.
- Expect: heading visibly bigger (CSS hot-swap).
- Server-side: confirm the **`.text-5xl { … }` rule exists** — a bare `text-5xl` grep
  also hits the theme variable `--text-5xl`, which is not proof.

### 3. Utility class in a `.ts` lit-html template — proves source detection sees TS
- Edit `frontend/src/js/week.ts`: week heading `text-2xl` → **`text-4xl`**.
- Expect: week card heading bigger. Full page reload instead of a smooth swap is
  expected (no framework HMR plugin).
- This is the test that distinguishes auto source-detection from stale `content` globs.

### 4. Brand-new class never in the output — proves real JIT, not cache
- First assert the class is **absent** from the served CSS (`tracking-widest`).
- Add `tracking-widest` to the `<h2>` in `index.html`.
- Expect: letter-spacing appears; server-side the `.tracking-widest { … }` rule now exists.

### 5. `@theme` value — proves theme-layer recompilation (CSS-first config)
- Edit `style.css` `@theme`: `--font-serif` → **`"Courier New", monospace`**.
  (`body` uses `font-serif` — change `--font-serif`, not `--font-sans`.)
- Expect: the whole page switches to monospace.
- Server-side: `--font-serif: "Courier New", monospace;` in served CSS.

### 6. `@utility` body — proves custom utilities recompile
- Edit the `good-shadow` `@utility` in `style.css`: make the `box-shadow` an obvious
  **red glow** (e.g. `0 10px 30px rgba(255, 0, 0, 0.9)`).
- Expect: video tiles / activity counters on week cards get red shadows.

### 7. Nested font import — proves deep-import watching + asset handling
- Edit `frontend/src/fonts/incolsolata/style.css`: point the **weight-700 `@font-face`**
  at a different `.otf` (e.g. `Inconsolata-Black.otf`, or an odd font dropped into
  `otf/` for maximum contrast).
- Expect: all bold text changes weight.
- ⚠️ **Edit the 700 slot, not 400.** This app renders almost everything at 600/700/900;
  the weight-400 face is nearly unused, so a 400 edit looks like "nothing happened" even
  when the pipeline is fine (cost us a debugging detour once — it was **not** a cache or
  watch problem, confirmed on a second browser).
- ⚠️ Fonts cache aggressively: a hard refresh is a fair first move before suspecting
  anything.
- Expect: the new asset is fetchable (HTTP 200 with full byte size from the dev server).

## Server-side corroboration

- Vite's dev server serves fresh CSS to plain `curl` (Parcel used to serve stale content
  to non-HMR clients — if you're ever back on a bundler that caches, trust the browser
  or a Node `fs.readFileSync` check over `curl`).
- Terminal grep output embeds ANSI codes in captured strings — strip them
  (`sed $'s/\x1b\\[[0-9;]*m//g'`) before using a captured URL in `curl`.
- Match **rules** (`.class { … }`), not just names — theme variables and comments create
  false positives.
- When all 7 pass: revert everything, re-run `npm run build`, and confirm the checkpoint
  greps (fonts, `:invalid`, TS-template classes, dragula, `shadow-xs`) are still green.
