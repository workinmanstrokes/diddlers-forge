# Diddler’s Forge

An all-in-one AI app and game maker that runs on **your own PC with Ollama**. You can use it from the PC or from your phone.
Describe an idea. The **Architect** plans it and asks you questions, **you approve the plan** (or let **Autopilot** do it), the **Coder** builds it, **QA** tests it on a phone-sized screen, the **Debugger** repairs whatever breaks, a bot **playtests** it for real, and the **Critic** gives honest ideas to make it better. Every change is saved as a version, and you promote builds through **dev → staging → production**. Production installs on your phone as its own app.

No cloud, no API keys, no `npm install`. It's one Node server with zero dependencies.

---

## Quick start (Windows)

1. Install **Node.js LTS**: https://nodejs.org
2. Install **Ollama**: https://ollama.com/download. Then pull models that fit a 16 GB RAM PC:
   ```
   ollama pull qwen2.5-coder:7b
   ollama pull qwen2.5-coder:3b
   ```
3. Double-click **`Create Desktop Shortcut.bat`** once.
4. Double-click **Diddler’s Forge** on your Desktop. A small window starts the server, and your browser opens `http://localhost:4848`.

| File | What it does |
|---|---|
| `Start Diddler’s Forge.bat` | Starts the studio and opens it. If it's already running, it just opens it. |
| `Start with PIN (phone terminal).bat` | Asks for a PIN. It protects the studio on Wi-Fi and lets your phone use the terminal. |
| `Stop Diddler’s Forge.bat` | Stops the studio. |
| `start.sh` | The same for Mac, Linux, or Android (Termux). |

Keep the small console window open while you use the studio. There's also a **⏻ Stop studio** button in Monitor.

## Use it from your phone

Start the studio on the PC, then open the **Phone** address it prints (for example `http://192.168.1.23:4848`) in Chrome on your phone. The phone has to be on the same Wi-Fi.
The studio server talks to Ollama for you, so **Ollama can stay on localhost**. You don't need to change `OLLAMA_HOST` or CORS settings.

- **Install the studio itself as an app** (optional): Chrome only installs apps from secure addresses. Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the phone, add `http://YOUR-PC-IP:4848`, and relaunch Chrome. Then use ⋮ → **Install app**.
- **Install the games and apps you make**: promote a build to Production, then open `http://YOUR-PC-IP:4848/play/<id>/` → ⋮ → Install. For an install that works anywhere, export the **PWA .zip** and put it on GitHub Pages (steps are in the zip's README).
- On shared Wi-Fi, start with a PIN. Never expose port 4848 to the internet.

---

## How a build works

| Mode | What happens | Tokens |
|---|---|---|
| ⚡ **Quick** | The Coder builds right away. QA tests run (free), but nothing is auto-repaired. | Fewest |
| 🧠 **Smart** | The 📐 Architect writes a plan → **you edit and approve it** → the 👨‍💻 Coder builds → 🧪 QA tests → the 🩺 Debugger repairs only if something failed (attempt limit) | Low |
| 💎 **Quality** | Like Smart, but the Coder builds **step by step** with QA after every step. At the end, QA checks every planned feature against the code and the Coder adds anything missing. | More |

- **🤖 Autopilot** (on by default; it's a toggle next to *Build it*): you describe the idea and it runs every step for you. It approves the plan after a short countdown using the recommended answers; touching the plan pauses it. It accepts rewrites only if the tests don't get worse, then playtests, asks the Critic, and applies the best ideas for 1 round (configurable). If a change makes the tests or the playtest score worse, it is **reverted automatically**. Promoting to staging or production is always your call.
- **Plan card:** answer the Architect's questions with one tap, edit the features, controls, look and build steps, and see an estimate (tokens, plus time based on *your* measured model speed). Nothing gets built until you press **Approve & build**.
- **Agent activity:** each step shows who did what (🧭 PM, 📐 Architect, 👨‍💻 Coder, 🧪 QA, 🩺 Debugger), tokens used, and speed. It's saved in the chat and in Tests → *Error console & agent activity*.
- **Roles take turns on one model.** Settings → Models → *Per-role models* lets you split them, but on 16 GB RAM one model avoids reload time.
- **Never overwrites without asking:** edits are small patches. If the AI wants to rewrite a whole file, the job **pauses for your approval**, with a diff.
- **Backups:** every build, patch, repair, upload, terminal import and library download is a version. You can view any version, diff it, or restore it, and a restore creates a new version, so nothing is lost.

### Automated testing (free: runs in your browser, no tokens)
These checks run after every build and edit, on a 390×844 phone screen (844×390 for landscape):
referenced files exist · JavaScript syntax · works offline · loads without errors · starts when tapped · survives 3 s of random taps, swipes and keys (monkey test) · draws something · fits the phone width with no zoom · no page scroll (games) · FPS · tap-target size · readable text · optional `window.__selfTest()`.
Errors show the **file, line and code**, and that's exactly what the Debugger gets. If you hit an error while playing in the preview, a red **Fix with AI** button appears.

### Playtest (free: a bot actually plays it)
After a build passes its tests, a small **live window** shows the bot playing the game or using the app for about 20 s on a phone-sized screen.
- **Games:** it plays three ways (hands-off, random taps and swipes, sweeping drags and keys) and measures how long you survive without touching anything, run length, deaths, best score, score per minute, whether *Play again* fully resets, whether pause works, sounds played, screen-shake and particle effects per minute, how much the screen changes, FPS, stutters and memory growth. It also saves screenshots from the run.
- **Apps:** it switches every tab, fills in forms and presses the main button, checks that the new item shows up, **reloads to confirm the data was saved**, taps every button to find ones that do nothing, and measures reaction time and text contrast.
- **Screen sizes:** layout is checked on small, normal and large phones (plus tablet and desktop for apps).

Everything becomes a 0–100 score with findings like *"Lost after 1.8 s without touching anything — the start isn't safe"*, each with a one-tap **Fix**.

### Review (the Critic)
The Critic reads the playtest numbers and your code, then gives honest, constructive feedback: scores for fun, polish, balance and speed, what already works, and 4–6 specific ideas ranked by impact and effort. Tap **Apply** on any idea, or **Apply top ideas**. It runs automatically with Autopilot or in Quality mode, or anytime from 🎯 *Get feedback*. It uses your Coder model by default (Settings → Models → Per-role).

### Files tab
- **Editor:** file explorer, multi-file projects, syntax highlighting, ▶ Run (preview without saving), 💾 Save (all changed files become one version), new / rename / delete / download, and uploads of images, sounds and data.
- **Terminal:** runs commands **on the PC** inside a workspace copy of the project (`data/workspace/<id>`). Try `git init`, `npm init -y`, `node -v`, or a formatter. Files the terminal changes can be saved back as a version. It only works from the PC itself, or from your phone when the studio was started with a PIN. There's also **📂 Open folder**.
- **Libraries:** the studio finds external files (CDN links) that would break offline and **bundles them into `vendor/`**. You approve each download. You can also add a library by URL (canvas-confetti, matter-js and howler are one tap away), and the AI is told which ones are available.

### Ship tab
Dev / Staging / Production with **manual Promote**, so nothing goes live by itself. Exports: **PWA .zip** (every file plus manifest, service worker and icons, ready for GitHub Pages) or a **single HTML file**.

### Monitor (tap ⚡)
Live CPU and RAM, which model is loaded (CPU vs GPU share, context, unload timer), measured write/read speed per model, tokens today, storage, the studio log, and Stop studio. It warns you when memory is low.

---

## Why it uses so few tokens

1. **Kits:** `kit/game.js` handles the game loop, fit-to-screen, touch/mouse/keys, virtual joystick, sounds, particles, shake, menus, pause, game over, HUD and best score. `kit/app.js` and `kit/ui.css` give polished mobile UI parts. The model writes only the game or app logic, which means fewer output tokens and fewer bugs from small models.
2. **Patches, not rewrites:** edits send `SEARCH/REPLACE` blocks.
3. **No chat history resent:** the current files are the memory.
4. **Same system prompt every call,** so Ollama reuses its prompt cache.
5. **Fixed context size + keep-alive,** so the model never reloads between steps.
6. **Free local tests:** the AI is only called again when something actually broke.
7. **"Skip thinking"** for reasoning models (on by default).

On a 16 GB RAM PC with integrated graphics, expect a few to ~10 tokens/second for a 7B model. A full game is roughly 3–7k tokens. The plan card shows an estimate from your real measured speed. Use `qwen2.5-coder:3b` for quick edits if you want faster turnarounds.

---

## Blueprint milestones

| Milestone | Status |
|---|---|
| M1 Dashboard + backend | ✅ Project dashboard, create/open/list, local storage, logging (`data/logs/studio.log`) and error reporting |
| M2 Ollama | ✅ Detects Ollama, lists and pulls models, picks a model per role (aware of your RAM), streams progress, Stop, timeouts and errors |
| M3 App planning | ✅ Architect questions, editable plan, steps, complexity and time estimate, approval before building |
| M4 Code generation | ✅ Kit-based generation, small verifiable patch steps, diffs, snapshots |
| M5 File editor | ✅ Multi-file explorer and editor, uploads, rename/delete |
| M6 Agent system | ✅ PM / Architect / Coder / QA / Debugger taking turns on one model, activity timeline |
| M7 Run + preview | ✅ Live preview (phone / tablet / desktop), restart, open in a new tab, error console |
| M8 QA + repair | ✅ Automated tests, **real playtesting**, Debugger repairs with an attempt limit, a version saved before each repair, automatic revert if a change makes things worse |
| M9 Backups + exports | ✅ Versions, restore, diff, PWA .zip, single HTML |
| M10 Remote access | ✅ Phone over Wi-Fi with an optional PIN (local network only) |
| Extras | Autopilot, Critic reviews, terminal, library bundling, hardware monitor, dev/staging/prod, Windows launcher |

---

## Settings worth knowing
- **Context size:** 16k by default. Choose 8k if RAM is tight.
- **Repair attempts:** how many times the Debugger may try (Smart). Quality always allows at least 2.
- **Plan first:** turn it off to skip the plan and approval step in Smart and Quality.
- **Autopilot:** on or off, how long before plans are approved (or "wait for me"), improvement rounds (0–3), and playtest length.
- **Ollama address:** point it at another machine, e.g. a gaming PC: `http://192.168.1.50:11434`.

Command-line options: `node server.js --port 4848 --host 0.0.0.0 --pin 1234 --ollama http://127.0.0.1:11434 --data ./data --open`

## Folders
```
server.js              zero-dependency server (API, Ollama proxy, storage, terminal, monitor)
public/                the studio (PWA): index.html, app.js, engine.js, tester.js, styles.css
public/shared/         build + test-harness code shared by browser and server
public/kit/            game.js, app.js, ui.css — what generated apps are built on
data/                  your projects, versions (deduplicated), workspace, logs, settings (not in git)
```

## Troubleshooting
- **"Ollama offline":** start Ollama (system tray icon), then Settings → Test.
- **Very slow:** check Monitor. If RAM is nearly full, close apps or switch the Coder to `qwen2.5-coder:3b`.
- **Phone can't connect:** same Wi-Fi? Allow Node through Windows Firewall (private networks) the first time it asks.
- **A build broke something:** Ship → Versions → ↺ Restore, or tap 🐞 Fix bugs.
- **Deleted a project by mistake:** it's in `data/trash/`. Move the folder back into `data/projects/`.
