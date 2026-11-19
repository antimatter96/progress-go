# Implementation Plan: Wails v2 → v3

## Goal

Move `progress-go` from Wails `v2.17.1` to Wails `v3.1.0` while keeping the current
user-visible behavior:

- same JSON file at `~/wail_progress/data.json` and the same schema
- same window size/title/appearance
- same save debounce and shutdown save
- same Vite 8.3.8 + Tailwind 4.3.5 frontend pipeline
- macOS remains the only verified platform

This is a build-system and API migration, not a feature change.

## Verified baseline

- Go `1.26.10` via `mise` (satisfies Wails v3's Go 1.26+ requirement).
- Wails v2.17.1; target v3 is **v3.1.0** (a weekly release; pin the exact
  version).
- `@wailsio/runtime` is published at `3.1.0`.
- v3 replaces `wails.json` with `Taskfile.yml` + `build/config.yml`.
- `wails3 build` produces the binary `bin/progress`; `wails3 package` produces the
  `.app` bundle `bin/progress.app` (not `build/bin/progress.app`).
- v3 bindings go to `frontend/bindings/progress/` and import `@wailsio/runtime`.
  The Taskfile passes `-ts`, so the files are `app.ts` / `index.ts`.
- Working tree currently has `tasks/` (this plan) plus two pre-existing
  untracked files: `build/darwin/Info.dev.plist` and
  `frontend/src/fonts/incolsolata/otf/BrontidevpDemoStyle2-ZV8E3.otf` (unused;
  leave it untracked).

## v3.1.0 release review (2026-11-19)

Reviewed the v3.1.0 release notes and the matching module source. No breaking
API changes affect this app. Migration-relevant items:

- `WAILS_PUREGO` opts into the experimental CGO-free macOS/Linux backend by
  adding the `purego` build tag. Do not set it.
- `WAILS_EXP_USE_WAKE` opts into the experimental YAML build system. With it
  unset, `wails3 init` still writes `Taskfile.yml`, `build/config.yml`, and the
  platform Taskfiles.
- A dialog requested before `Run` now does nothing instead of blocking forever.
  `ConfirmDelete` is called from the frontend after `Run`; keep dialogs out of
  `ServiceStartup` and this is a non-issue.
- Dev-process shutdown, dev-proxy retry/port, Taskfile path/cache, icon-size
  validation, and DMG-preservation fixes are included. No plan changes needed.

## Key decisions

1. Target **v3.1.0**, not v3.0.0, for both the `wails3` CLI and the
   `github.com/wailsapp/wails/v3` library.
2. Pin `wails3` in `mise.toml` via the `go:` backend so `mise install` provisions
   the CLI alongside Go and Node. Keep
   `go install github.com/wailsapp/wails/v3/cmd/wails3@v3.1.0` documented as the
   fallback for non-mise setups. Confirmed.
3. Keep the existing frontend layout (`frontend/src` as Vite root, port 1234) and the
   two non-obvious Vite settings (`define.global`, `server.fs.allow`).
4. Keep the Go service type named `App` and keep the four exported methods:
   `GetJsonData`, `SaveJsonData`, `SetJsonData`, `ConfirmDelete`.
5. Keep `frontend/bindings/` tracked in git (like `frontend/wailsjs` was), so a
   frontend-only `npm run build` still works without running the Wails CLI first.
   Confirmed.
6. Use the stable Taskfile build flow. Do **not** opt into the experimental
   `wails.yaml` build system (`WAILS_EXP_USE_WAKE`) or the experimental CGO-free
   backend (`WAILS_PUREGO`).
7. Ship a proper liquid-glass icon: author `build/appicon.icon` and the compiled
   `build/darwin/Assets.car` on a Mac with Xcode 26+ and Icon Composer, commit
   both, and package them here. Never commit the scaffold's Wails-logo
   `Assets.car`.
8. Treat `build/darwin/Info.plist` and `Info.dev.plist` as generated build
   assets, not hand-authored files.

## Task list

### Task 1 — Pin the v3 toolchain and prove it works (S)

**Description:** Install `wails3` 3.1.0 and verify it can scaffold and build a
throwaway v3 app before touching the repo.

**Steps:**
- Add to `mise.toml`:
  ```toml
  "go:github.com/wailsapp/wails/v3/cmd/wails3" = "3.1.0"
  ```
- Run `mise install`, then `wails3 version`, `mise which wails3`, and
  `wails3 doctor`.
- If the `go:` backend fails, fall back to
  `go install github.com/wailsapp/wails/v3/cmd/wails3@v3.1.0` and record why the
  pin did not work.
- Confirm the ambient build-system switches are unset:
  `env | grep -E '^WAILS_(EXP_USE_WAKE|PUREGO)='` should print nothing.
- In a temp directory, run `wails3 init -n wails3-scratch -t vanilla`, then
  `wails3 build` and `wails3 package`; open the resulting
  `bin/wails3-scratch.app`.
- Confirm the scaffold contains `Taskfile.yml`, `build/config.yml`, and
  `build/darwin/Taskfile.yml`, and that no `wails.yaml` was generated.
- Do not copy the scratch project into this repo; it is the reference for the
  canonical `Taskfile.yml` and `build/` assets.

**Acceptance criteria:**
- [x] `wails3 version` reports `v3.1.0` and `mise which wails3` resolves inside
      mise's install tree.
- [x] `wails3 doctor` reports no macOS issues (a missing full Xcode/actool is
      fine at this stage; it is only needed for the liquid-glass icon in
      Task 2A).
- [x] The scaffold uses `Taskfile.yml` + `build/config.yml`, not `wails.yaml`.
- [x] The scratch app builds and opens a window.

**Verification:** commands above.

**Depends on:** none.

---

### Task 2 — Replace the v2 build system with Taskfile + v3 build assets (M)

**Description:** Remove `wails.json` and the v2 `build/` layout, and install the
v3 Taskfile build pipeline adapted to this app.

**Steps:**
- Take `Taskfile.yml`, `build/Taskfile.yml`, `build/darwin/Taskfile.yml`, and
  `build/config.yml` from the scratch project; adapt rather than copy blindly.
- Keep only the `common` and `darwin` includes in the root `Taskfile.yml`; this
  app ships macOS builds only, so do not copy `windows/`, `linux/`, `ios/`, or
  `android/` task files. Drop the scaffold's server/Docker/Puppertino/DMG tasks.
- Adapt `Taskfile.yml`:
  - `APP_NAME: progress`
  - `BIN_DIR: bin`
  - `VITE_PORT: 1234`
- Adapt `build/config.yml`:
  - product name `Progress`
  - identifier `com.antimatter96.utils.progress`
  - description/copyright matching the current app
  - `cfBundleIconName: "appicon"` so the generated plists keep the key even
    before `Assets.car` exists
- Do not hand-author the plists: `wails3 init` only scaffolds a new directory,
  so generate them in place with
  `wails3 update build-assets -name progress -binaryname progress -config config.yml -dir .`
  (the `common:update:build-assets` task). Delete the `ios/`, `linux/`, and
  `windows/` directories that command also writes. Track both
  `build/darwin/Info.plist` and `Info.dev.plist`.
- Keep `build/appicon.png` and generate the legacy icon with explicit paths.
  `wails3 generate icons` defaults to writing `build/windows/icon.ico`; pass
  `-windowsfilename ""` to opt out. The Mac default is
  `build/darwin/icon.icns` (singular).
- Delete the scaffold's `build/appicon.icon/` and `build/darwin/Assets.car`: they
  contain the Wails logo. Do not copy them into this repo.
- Split the copied `generate:icons` task into:
  - `generate:icons`: PNG -> `icons.icns`; no `actool` dependency.
  - `generate:liquid-glass-icons`: passes `-iconcomposerinput appicon.icon
    -macassetdir darwin`; manual task for a Mac with Xcode 26+ (see Task 2A).
- Delete `wails.json` and the old v2-only `build/` files (`build/bin`,
  `build/icons`, `build/windows`, `build/README.md`). The v2
  `build/darwin/Info.plist` is replaced by the generated one.
- Update `.gitignore` for `bin/`, `.wails/`, and `.task/`. Do not ignore
  `build/darwin/Assets.car`; it is committed in Task 2A.
- Update `.gitattributes` from `frontend/wailsjs/**` to
  `frontend/bindings/**`.

**Acceptance criteria:**
- [x] `wails3 task -list` lists `build`, `dev`, `package`, and `run`.
- [x] `build/config.yml` carries the app's product name and bundle identifier.
- [x] `common:generate:icons` produces `build/darwin/icons.icns` from
      `build/appicon.png`.
- [x] No scaffold `Assets.car` or `appicon.icon` remains; `Info.plist` keeps
      `CFBundleIconName` for the custom asset added in Task 2A.
- [x] No `wails.json` references remain outside docs (fixed in Task 6).

**Verification:** `wails3 task -list`;
`wails3 task common:generate:icons -f`.

**Depends on:** Task 1.

---

### Task 2A — Add the proper liquid-glass icon (M, external Xcode machine)

**Description:** Replace the legacy `.icns`-only icon with a liquid-glass
`Assets.car` built from a custom `appicon.icon` bundle. This host has only the
Command Line Tools, so `actool` cannot compile the bundle here. Author and
compile it on a Mac with Xcode 26+ and Icon Composer, then commit the outputs.

**Steps:**
- On the Xcode machine, create `build/appicon.icon` in Icon Composer from the
  Progress artwork. The current `build/appicon.png` is 512x512; prefer a vector
  recreation or a 1024x1024 export so the icon stays crisp.
- From `build/`, compile the icon bundle and the legacy icons:
  ```sh
  wails3 generate icons -input appicon.png -macfilename darwin/icons.icns \
    -windowsfilename "" -iconcomposerinput appicon.icon -macassetdir darwin
  ```
- Commit `build/appicon.icon/**` and `build/darwin/Assets.car`.
- `build/config.yml` already sets `cfBundleIconName: "appicon"`, so the
  generated `Info.plist` needs no manual edit. Do not rerun `wails3 init`: it
  re-extracts the scaffold's Wails-logo `Assets.car`. Rerunning
  `common:update:build-assets` is safe for the icon (it only rewrites the
  generated plists and updatable assets, not `Assets.car`), but review the diff
  and delete the `ios/`, `linux/`, and `windows/` directories it recreates.
- On this host, do not run the liquid-glass task. `wails3 package` copies the
  committed `Assets.car` into `Contents/Resources`.

**Acceptance criteria:**
- [ ] `build/appicon.icon/icon.json` and its artwork are committed.
- [ ] `build/darwin/Assets.car` is committed and contains the Progress artwork.
- [ ] `bin/progress.app/Contents/Info.plist` has `CFBundleIconName=appicon`.
- [ ] `bin/progress.app/Contents/Resources/Assets.car` exists.
- [ ] Dock/Finder show the Progress icon, not the Wails logo.

**Verification:**
```sh
ls -l build/darwin/Assets.car
plutil -p bin/progress.app/Contents/Info.plist | grep -E 'CFBundleIcon(Name|File)'
ls -l bin/progress.app/Contents/Resources/Assets.car
```

**Depends on:** Task 2. **Blocks:** Task 5.

---

### Task 3 — Port the Go backend to the v3 application/service API (M)

**Description:** Replace `wails.Run` and the v2 runtime imports with the v3
application, window, service, dialog, and logger APIs.

**Steps:**
- Upgrade `go.mod` to `github.com/wailsapp/wails/v3 v3.1.0`; run `go mod tidy`.
- Rewrite `main.go`:
  - `application.New(application.Options{...})`
  - `application.NewService(&App{})` in `Services`
  - `Assets: application.AssetOptions{Handler: application.AssetFileServerFS(assets)}`
  - `Mac: application.MacOptions{...}`
  - `app.Window.NewWithOptions(...)`, then `app.Run()`
  - keep the embedded `frontend/dist` and `build/appicon.png`
- Rewrite `app.go`:
  - drop `ctx`, v2 `logger`, and `runtime` imports
  - `startup(ctx)` → `ServiceStartup(ctx context.Context, options application.ServiceOptions) error`
  - `shutdown(ctx)` → `ServiceShutdown() error` (still saves)
  - drop the empty `domReady`
  - `ConfirmDelete` → v3 `app.Dialog.Question()` with `Yes`/`No` buttons. v3
    dialogs are callback based, so the bound method blocks on a buffered channel
    that each button's `OnClick` writes to. Binding calls run off the UI thread,
    so this does not deadlock.
  - keep the data path and `SetJsonData`/`GetJsonData`/`SaveJsonData` signatures
  - use `os.MkdirAll` so a missing `data.json` in an existing `~/wail_progress`
    directory no longer panics
- Map window options: title, `960x840`, min `720x570`, background `#21252b`,
  macOS title bar/appearance, and single-window behavior.
  - Map v2's `mac.NSAppearanceNameVibrantLight` to
    `application.NSAppearanceNameVibrantLight`.
  - v3 has no `WebviewIsTransparent`; use `BackgroundType`/`BackgroundColour`
    and verify visually. The page CSS is opaque, so no visible change is
    expected.
- Use `Options.Name`/`Description`/`Icon` for the default About box instead of
  the v2 `mac.AboutInfo` struct.
- Note: plain `go build` still compiles, but without `-tags production` it
  produces a dev build that expects `FRONTEND_DEVSERVER_URL`. Only
  `wails3 build` / `wails3 package` are real build checks (same trap as v2's
  missing build tags).

**Acceptance criteria:**
- [x] `go mod tidy` leaves only v3 Wails dependencies.
- [x] `wails3 build` compiles the binary; `wails3 package` builds the bundle.
- [x] The app launches and loads the existing JSON file (verified: the shutdown
      save kept all 6 real weeks and appends nothing). The first pass claimed
      "12 existing weeks survived"; that count actually included 6 sample weeks
      written by an inverted `isWails()` check in `main.ts`. Fixed and re-verified
      against a repaired `~/wail_progress/data.json` (6 weeks, no sample ids).
- [ ] Closing the window and quitting behave like v2 (verify explicitly).

**Verification:** `wails3 package`, launch `bin/progress.app`.

**Depends on:** Task 2.

---

### Task 4 — Generate v3 bindings and update the frontend bridge (M)

**Description:** Remove the v2 `frontend/wailsjs` bindings and point the frontend
at the generated v3 bindings and runtime.

**Steps:**
- Add `@wailsio/runtime` `3.1.0` to `frontend/package.json` under
  `dependencies` (the generated bindings import it).
- Keep `frontend/vite.config.mjs` apart from two changes: pin
  `server.host: '127.0.0.1'` and update the bindings comment. The
  `@wailsio/runtime/plugins/vite` plugin is only needed for typed custom events,
  which this app does not use. If it is added later, pass an absolute bindings
  path (`fileURLToPath(new URL('./bindings', import.meta.url))`) because the Vite
  root is `src`.
  - The host pin is required: Vite 8 binds `localhost` as IPv6-only `[::1]` on
    this machine, while the Wails dev proxy dials `127.0.0.1`, so the initial
    page load fails with `502` / `connection refused`.
- Add a `build:dev` script (`vite build --mode development`) because `wails3 dev`
  selects it when `DEV=true`. `vite.config.mjs` already sets `minify: false`.
- Run `wails3 task common:generate:bindings` (or
  `wails3 generate bindings -ts -i`). The Taskfile passes `-ts -i`, so the output
  is TypeScript interfaces. The generated `frontend/bindings/progress/app.ts`
  exports `ConfirmDelete`, `GetJsonData`, `SaveJsonData`, `SetJsonData`;
  `index.ts` re-exports them as `App`.
- Update `frontend/src/js/framework.ts`:
  - import `{ App }` from `../../bindings/progress`
  - `customConfirm` calls `App.ConfirmDelete()` instead of
    `window.go.main.App.ConfirmDelete()`
- Do not detect Wails with a `window.go` / `window._wails` check. Call the
  binding and treat a rejection as "plain browser" (`loadLocal()` → `null`,
  `saveFile()` → ignore, `customConfirm()` → `window.confirm`). Two reasons:
  importing `@wailsio/runtime` creates `window._wails` in a plain browser, and
  v3 injects `_wails.flags` from the `didFinishNavigation` hook, which races
  `window.onload`, where `run()` starts. A flag check silently took the browser
  path inside the app and overwrote `data.json` with sample weeks.
- Delete `frontend/wailsjs/**` and update the comment in `vite.config.mjs`.

**Acceptance criteria:**
- [x] `wails3 generate bindings` produces `frontend/bindings/progress/*`.
- [x] `npm run build` succeeds in `frontend/` with the generated bindings present.
- [x] Opening the frontend in a plain browser still shows sample data (verified in
      headless Chrome: container ids `1`, `2`, `3`, `101`, `102`, `103`, no UUIDs).
- [x] No `window.go` or `wailsjs` references remain in source.

**Verification:** `cd frontend && npm run build`; `wails3 dev`.

**Depends on:** Tasks 2 and 3.

---

### Task 5 — End-to-end verification (S/M)

**Description:** Prove the migration works against the real data file and the
existing interaction flows.

**Manual checks:**
- [ ] `wails3 dev` starts Vite on `http://localhost:1234`, opens the app, and
      picks up frontend edits (reload) and Go edits (rebuild/restart).
- [ ] Existing `~/wail_progress/data.json` loads; adding a week, editing progress,
      and drag-reordering work.
- [ ] Delete confirmation shows the native dialog and returns the right result.
- [ ] Changes persist across restart; the shutdown save runs.
- [ ] `wails3 build` produces the binary `bin/progress`; `wails3 package`
      produces `bin/progress.app`; launch it with `open bin/progress.app`.
- [ ] Production build has no devtools, embeds `frontend/dist`, and has the
      correct app name/bundle id.
- [ ] `bin/progress.app/Contents/Resources/Assets.car` is the custom Progress
      icon (Task 2A), `Contents/Info.plist` has `CFBundleIconName=appicon`, and
      Dock/Finder show the Progress icon.
- [ ] Run `docs/live-change-tests.md` against the new build pipeline (Vite +
      Tailwind + Wails dev server).
- [ ] Browser fallback still works with `cd frontend && npm run dev`.

**Verification:** the checks above plus `wails3 doctor`, plus:
```sh
plutil -p bin/progress.app/Contents/Info.plist | grep -E 'CFBundleIcon(Name|File)'
ls -l bin/progress.app/Contents/Resources/Assets.car
```

**Depends on:** Tasks 3, 4, and 2A.

---

### Task 6 — Update docs and clean up v2 leftovers (S)

**Description:** Bring `AGENTS.md` and `README.md` in line with the v3 project.

**Steps:**
- `AGENTS.md`:
  - v2 → v3.1; `wails dev` → `wails3 dev`; `wails build` → `wails3 build` +
    `wails3 package`
  - output `build/bin/progress.app` → `bin/progress` (binary) and
    `bin/progress.app` (bundle from `wails3 package`)
  - `wails.json` → `Taskfile.yml` + `build/config.yml`
  - `frontend/wailsjs` → `frontend/bindings`
  - service/lifecycle notes (`ServiceStartup`/`ServiceShutdown`)
  - keep the Vite/Tailwind gotchas; drop the `@wailsio/runtime` plugin note
    unless the plugin is actually added
  - note that plain `go build` is a dev build, not a shippable build
  - document the icon workflow: `build/appicon.icon` + `build/darwin/Assets.car`
    are committed, authored on a Mac with Xcode 26+, and only regenerated by the
    manual `generate:liquid-glass-icons` task. Do not run `wails3 init` or
    `common:update:build-assets` after customizing the build assets; they
    re-extract the Wails-logo `Assets.car`.
  - correct the current “wails CLI is a mise shim” note: `wails3` is pinned via
    the `go:` backend; include the `go install ...@v3.1.0` fallback for non-mise
    setups
- `README.md`: update run/build commands and the artifact path; remove the
  stale root-level `npm install` instructions if they are no longer relevant.
- Remove any remaining v2-generated files and confirm `.gitignore` covers new
  generated output.

**Acceptance criteria:**
- [ ] Every command in `AGENTS.md`/`README.md` matches the v3 project.
- [ ] No v2-only paths or commands remain in docs.
- [ ] `git status` shows only intended changes.

**Verification:** run the documented commands from a clean checkout.

**Depends on:** Task 5.

## Checkpoints

### Checkpoint A — after Task 1
- [x] `wails3` 3.1.0 works through mise.
- [x] Scratch v3 app builds and runs.

### Checkpoint B — after Task 3
- [ ] The app compiles and launches on v3.
- [ ] Existing JSON data loads and saves.

### Checkpoint C — after Task 4
- [ ] Bindings work in both `wails3 dev` and a plain browser.
- [ ] Frontend production build succeeds.

### Checkpoint D — after Task 5
- [ ] Full manual flow passes; `bin/progress.app` is the verified artifact.
- [ ] The custom `Assets.car` is in the bundle and Dock/Finder show the
      Progress icon.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| macOS window chrome (transparency, appearance, About) differs from v2 | Medium | Do a visual pass early; v3 has no `WebviewIsTransparent`, so rely on `BackgroundType`/`BackgroundColour` and check the rendered page. |
| Generated binding path/export names differ from the expected `App` service | Medium | Generate once before editing imports; inspect `frontend/bindings/progress/` and adjust. |
| `frontend/bindings` is needed by `npm run build` | Medium | Commit generated bindings, as `frontend/wailsjs` was committed. |
| v3 build assets are a new format | Medium | Copy from a freshly scaffolded v3.1 project rather than hand-editing v2 assets. |
| Installation docs lag the release | Low | The v3.1.0 release body has the exact `go install ...@v3.1.0` line; pin it explicitly and use the scaffold as the source of truth. |
| mise's `go:` backend cannot install `wails3` | Low | Fall back to `go install ...@v3.1.0` during Task 1 and record the reason; keep the fallback in `AGENTS.md`. |
| Untracked font/plist files get mixed into the migration | Low | Leave `BrontidevpDemoStyle2-ZV8E3.otf` untracked; `build/darwin/Info.dev.plist` is regenerated by v3. |
| Release scripts/docs still expect `build/bin/progress.app` | Medium | Update README/AGENTS and any packaging steps in Task 6; the new bundle is `bin/progress.app`. |
| `window._wails` is truthy in a plain browser after the runtime import | Medium | Gate on `window._wails?.flags`, not `window._wails`. |
| Ambient `WAILS_PUREGO`/`WAILS_EXP_USE_WAKE` changes the scaffold or build | Medium | Check `env` before `wails3 init`; never add either variable to repo scripts. |
| Vite binds IPv6 only while the Wails dev proxy dials IPv4 | High | Pin `server.host: '127.0.0.1'` in `frontend/vite.config.mjs`; without it `wails3 dev` loads a 502 error page. |
| This host cannot compile `Assets.car` (no full Xcode/actool) | Medium | Author and compile on an Xcode 26+ machine, commit `appicon.icon` + `Assets.car`; this host only packages them (Task 2A). |
| Committed `Assets.car` goes stale when `appicon.icon` changes | Low | Regenerate both with `generate:liquid-glass-icons` on an Xcode 26+ machine and commit them together. |
| Rerunning `wails3 init` overwrites the custom icon and Taskfiles | Medium | Do not rerun `init` in this repo; it re-extracts the Wails-logo `Assets.car` and default task files. `common:update:build-assets` only rewrites generated plists/updatable assets, but still review its diff and delete the non-darwin directories it recreates. |

## Open questions

None. All decisions are confirmed:

- `wails3` 3.1.0 is pinned in `mise.toml` via the `go:` backend, with a
  documented `go install ...@v3.1.0` fallback.
- Generated `frontend/bindings/` stays tracked in git.
- `BrontidevpDemoStyle2-ZV8E3.otf` stays untracked (not deleted).
- macOS-only verification is acceptable.
- The liquid-glass icon is authored on a Mac with Xcode 26+ and committed as
  `build/appicon.icon` + `build/darwin/Assets.car`; this host packages it.

Resolved while planning: v2 keeps the app running when the last window closes
(`applicationShouldTerminateAfterLastWindowClosed` returns `NO`), and v3's
`MacOptions.ApplicationShouldTerminateAfterLastWindowClosed` defaults to
`false`, so the behavior matches without extra code.
