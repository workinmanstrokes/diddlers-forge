# Diddler’s Forge

An all-in-one AI app and game maker that runs on **your own PC with Ollama**. You can use it from the PC or from your phone.
Describe an idea. The **Architect** plans it and asks you questions, **you approve the plan** (or let **Autopilot** do it), the **Coder** builds it, **QA** tests it on a phone-sized screen, the **Debugger** repairs whatever breaks, a bot **playtests** it for real, and the **Critic** gives honest ideas to make it better. Every change is saved as a version, and you promote builds through **dev → staging → production**. Production installs on your phone as its own app.

No cloud, no API keys, no `npm install`. It's one Node server with zero dependencies.

### New in 3.5: updates, phone + Wi-Fi Ollama, and a real test suite
- **⬇ Studio updates:** Settings → Updates checks GitHub and installs the newest Diddler’s Forge with one tap, then restarts itself. A git copy updates with `git pull`; a zip copy downloads the new version, checks it, and keeps a backup of every replaced file in `data/backups/`. Your projects in `data/` are never touched. Once a day the studio quietly tells you when an update is out.
- **🔎 Find Ollama:** one tap scans this device and your Wi-Fi for Ollama servers and lists how many models each has. Handy when Ollama runs on a gaming PC, or when the studio runs on your phone in Termux.
- **📱 Phone-only mode:** `./start.sh --with-ollama` in Termux starts Ollama on the phone too (after `pkg install ollama`).
- **Lean edits on the fast model:** “make it blue”-style tuning now runs on the small, fast model (it's a tiny JSON change that gets checked, with a normal patch as the fallback).
- **Studio tests + CI:** `npm test` runs 54 checks of the server, engine, all 22 starters and the updater against a fake Ollama, on Windows and Linux, Node 18 and 22, on every push.

### New in 3.0: same quality, a fraction of the tokens
- **⚡ 22 starter recipes:** finished, tested games and apps (space shooter, bullet-heaven zombie survival, endless runner, flappy, fruit catcher, brick breaker, snake, match-3, idle tycoon, a Michigan fishing game, 3-on-3 hockey, 3-on-3 basketball, tower defense, incremental tower defense, top-down racer, deckbuilder card battler, match-3 puzzle battle, cat logic puzzle, habit tracker, budget, interval timer and notes). Tap one to build it for **0 tokens**. If your idea matches one, the AI only re-themes and adjusts it, which takes about **1k output tokens instead of 3–7k**.
- **🎛 Tuner:** every starter keeps its colors, emoji, names, speeds and difficulty in one tuning block. Change them with sliders and color pickers, try 3 one-tap themes or 🎲 random colors, and watch a live preview. **No AI, 0 tokens.**
- **Lean edits:** requests like “make it faster” or “blue theme” send only the tuning block (~300 tokens) instead of the whole file.
- **Smarter cache use:** every role now shares one system prompt and the files always come first, so Ollama re-uses what it already read. The improvement step after a Critic review re-reads about 4% of its prompt instead of all of it.
- **Kit v2 (free polish):** procedural music, animated backgrounds, upgrade-choice cards, big banners and 1.2M-style numbers, each one line for the AI.

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
| `forge-loop.cmd` | Used by the Start file: runs the studio and brings it back after an update. |
| `start.sh` | The same for Mac, Linux, or Android (Termux). Add `--with-ollama` to also start Ollama in Termux. |

Keep the small console window open while you use the studio. There's also a **⏻ Stop studio** button in Monitor.

## Use it from your phone

Start the studio on the PC, then open the **Phone** address it prints (for example `http://192.168.1.23:4848`) in Chrome on your phone. The phone has to be on the same Wi-Fi.
The studio server talks to Ollama for you, so **Ollama can stay on localhost**. You don't need to change `OLLAMA_HOST` or CORS settings.

- **Install the studio itself as an app** (optional): Chrome only installs apps from secure addresses. Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the phone, add `http://YOUR-PC-IP:4848`, and relaunch Chrome. Then use ⋮ → **Install app**.
- **Install the games and apps you make**: promote a build to Production, then open `http://YOUR-PC-IP:4848/play/<id>/` → ⋮ → Install. For an install that works anywhere, export the **PWA .zip** and put it on GitHub Pages (steps are in the zip's README).
- On shared Wi-Fi, start with a PIN. Never expose port 4848 to the internet.

### Where Ollama can run
| Setup | What to do |
|---|---|
| **Studio and Ollama on your PC** (normal) | Nothing. Open the studio on your phone at the Phone address. |
| **Ollama on another PC** (e.g. a gaming PC) | On that PC set the environment variable `OLLAMA_HOST=0.0.0.0` (Windows: Settings → System → About → Advanced system settings → Environment Variables), quit Ollama from the tray and start it again, and allow port 11434 through its firewall on private networks. Then Settings → **🔎 Find Ollama** → **Use**. |
| **Studio on your phone, Ollama on your PC** | Run the studio in Termux (`pkg install nodejs git`, then `git clone https://github.com/workinmanstrokes/diddlers-forge && cd diddlers-forge && ./start.sh`). Set `OLLAMA_HOST=0.0.0.0` on the PC as above, then **🔎 Find Ollama** in the studio. |
| **Everything on your phone** | In Termux: `pkg install nodejs ollama`, then `./start.sh --with-ollama`. Use a small model such as `qwen2.5-coder:1.5b` or `qwen2.5-coder:3b`. |

`OLLAMA_ORIGINS` is never needed: the studio server talks to Ollama, not your browser.

---

## How a build works

| Mode | What happens | Tokens |
|---|---|---|
| ⚡ **Quick** | The Coder builds right away (from a matching starter when there is one). QA tests run (free), but nothing is auto-repaired. | Fewest |
| 🧠 **Smart** | The 📐 Architect writes a plan → **you edit and approve it** → the 👨‍💻 Coder builds → 🧪 QA tests → the 🩺 Debugger repairs only if something failed (attempt limit) | Low |
| 💎 **Quality** | Like Smart, but the Coder builds **step by step** with QA after every step. At the end, QA checks every planned feature against the code and the Coder adds anything missing. | More |

- **🤖 Autopilot** (on by default; it's a toggle next to *Build it*): you describe the idea and it runs every step for you. It approves the plan after a short countdown using the recommended answers; touching the plan pauses it. It accepts rewrites only if the tests don't get worse, then playtests, asks the Critic, and applies the best ideas for 1 round (configurable). If a change makes the tests or the playtest score worse, it is **reverted automatically**. Promoting to staging or production is always your call.
- **Plan card:** answer the Architect's questions with one tap, edit the features, controls, look and build steps, pick **Start from** (a starter or “write it from scratch”), and see an estimate (tokens, plus time based on *your* measured model speed). Nothing gets built until you press **Approve & build**.
- **Starter builds** save the finished starter as v1 straight away (playable in Preview within a second), then the Coder customizes it as v2. If the customization doesn't apply, you still keep the working starter.
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

### Updating the studio
Settings → **Updates** → *Check for updates* → **⬇ Update now** → **↻ Restart now**. You can also do it by hand: `git pull` in a git copy, or download the newest zip from GitHub and copy your old `data/` folder into it.
Updates install from the PC running the studio, or from your phone when the studio was started with a PIN. Download installs refuse anything that isn't Diddler’s Forge, is older than what you have, or has broken code, and nothing is written until those checks pass.

### Ship tab
Dev / Staging / Production with **manual Promote**, so nothing goes live by itself. Exports: **PWA .zip** (every file plus manifest, service worker and icons, ready for GitHub Pages) or a **single HTML file**.

### Monitor (tap ⚡)
Live CPU and RAM, which model is loaded (CPU vs GPU share, context, unload timer), measured write/read speed per model, tokens today, storage, the studio log, and Stop studio. It warns you when memory is low.

---

## Starters

| Starter | What you get | One-tap themes |
|---|---|---|
| 🚀 Space Blaster | Drag to fly, auto-fire, formation waves, power-ups, upgrade picks, bosses | Deep Space · Sky Ace · Ocean Defender |
| 🧟 Zombie Survival | Bullet heaven: virtual stick, auto-aim, XP gems with a level bar, level-up picks mid-fight (10 powers incl. orbit blades and nova), 20 s waves, brutes | Zombie Night · Monster Mash · Bug Blaster |
| 🏃 Neon Runner | Tap / double jump, obstacles, bats, pits, coin streaks, synthwave city | Neon City · Desert Dash · Ice Run |
| 🐤 Sky Hopper | Flap through pipes, 3 hearts, bouncy ground, bonus stars, streak points | Sunny Day · Night Flight · Rocket Hop |
| 🧺 Fruit Frenzy | Catch fruit, dodge bombs, combos, star frenzy | Fruit Frenzy · Candy Rain · Treasure Dive |
| 🧱 Brick Smash | Paddle, 5 cycling layouts, tough bricks, multi-ball / wide / slow / life | Neon · Sugar Smash · Retro Green |
| 🐍 Snake Arena | Smooth snake, 3 orbs, golden orbs, wrap-around, rocks as you grow | Jungle · Neon Viper · Garden Worm |
| 💎 Gem Match | Swipe match-3, cascades, line and rainbow gems, levels with moves and targets | Gem Vault · Fruit Crush · Candy Pop |
| 💰 Idle Tycoon | Tap coin, 7 businesses, x2 milestones at 10/25/50/100… owned, buy x1 / x10 / max, offline earnings, frenzy, prestige stars | Tycoon · Cookie Empire · Space Miner |
| 🎣 Lunker Rush | Charge cast, hook on the dip, tension-meter reeling, 9 Michigan species, weights, species log, sunset timer | Morning Lake · Ice Shanty · Deep Sea |
| 🏒 Rink Rush | 3-on-3 hockey: puck physics off boards and nets, PASS / SHOOT buttons, one-timers, body checks, AI teammates and goalies, 3 periods, OT | Classic Rink · Zombie Hockey · Neon Night |
| 🏀 Hoop Rush | 3-on-3 basketball: dribble, pass, 2s and 3s, dunks, steals, blocks, 12 s shot clock, AI teammates, first to 21 | Arena Court · Street Court · Zoo Hoops |
| 🏰 Tower Siege | Drag towers onto a grid, 4 towers (archer, splash, frost, chain) with 3 upgrade levels and sell, path waypoints, growing waves, bosses, early-wave gold | Castle Siege · Star Defense · Garden Guard |
| 🛡️ Hold the Tower | Incremental tower defense (trending in 2026): one tower vs. a growing horde from every side, 8 in-run gold upgrades (splash, multishot, frost aura…), NOVA blast, boss every 10 waves, permanent crown workshop between runs | Castle Hold · Last Light · Star Base |
| ⚔️ Gem Clash | Puzzle battle: match-3 where each of 5 colors powers a hero, type advantages (2× / ½×), combos, line and rainbow gems, hero specials (inferno, heal, vines, smite, drain), enemy attack timers, a boss every 5 stages, reward picks; arrows + Space on PC | Fantasy · Space Squad · Pet Brawl |
| 🐱 Cat Spots | Logic puzzle (Queens / Meowdoku style): 1 cat per row, column and color, cats never touch; fresh puzzles with exactly one solution from 5×5 to 9×9, tap ✕ → cat, drag to mark, 3 hearts, hints, auto-✕, timer | Cats · Puppy Park · Star Map |
| 🏎️ Turbo Track | Top-down racer: stick steering, drifting fills NITRO, boost pads, 3 laps vs 3 AI racing lines, minimap, places | Grand Prix · Desert Rally · Snow Circuit |
| 🃏 Card Quest | Deckbuilder: draw / hand / discard piles, energy, drag or tap cards, enemy intents, block, strength, weak, vulnerable, card rewards, elites, a boss on floor 10 | Dungeon · Space Crew · Haunted Manor |
| ✅ Habit Streaks | Check-offs, streaks, 7-day dots, completion ring, stats | Fresh Green · Fitness · Calm (light) |
| 💸 Budget Buddy | Quick add, money left this month, history by day, category bars | Emerald · Job Costs · Light |
| ⏱️ Interval Timer | Work/rest/rounds, ring countdown, beeps + vibration, presets | Workout · Fight Timer · Focus |
| 📝 Quick Notes | Capture, colors, pins, search with highlights, edit | Amber · Job Notes · Light |

Every starter and every theme passes all automated checks on a phone screen. Games score 93–100 in the bot playtest and apps score 100.

**Add your own starter:** drop a kit-based `.html` with a `const CFG = {…}` JSON block into `public/recipes/` and add an entry (keywords + themes) to `public/recipes/index.js`.

### 🎛 Tuner (0 tokens)
Tap **🎛 Tune** in the chat chips or the 🎛 button above the preview. You get color pickers, sliders for every number, text fields for names, emoji and help text, the starter's themes and **🎲 Surprise colors**, with a live phone preview. Nothing is saved until **💾 Save version**. Any project whose code has a `const CFG = {…}` block can use it, and new AI builds are told to write one.

## Why it uses so few tokens

- **Starters:** most ideas begin from a finished, tested build. The Coder sends small patches (≈1k tokens) instead of a whole game (3–7k). Tapping a starter as-is costs 0.
- **Lean edits + Tuner:** tuning changes touch only the CFG block, or skip the AI entirely.
1. **Kits:** `kit/game.js` handles the game loop, fit-to-screen, touch/mouse/keys, virtual joystick, sounds, particles, shake, menus, pause, game over, HUD and best score. `kit/app.js` and `kit/ui.css` give polished mobile UI parts. The model writes only the game or app logic, which means fewer output tokens and fewer bugs from small models.
2. **Patches, not rewrites:** edits send `SEARCH/REPLACE` blocks.
3. **No chat history resent:** the current files are the memory.
4. **One system prompt for every role, files first,** so Ollama reuses its prompt cache across Architect → Coder → Critic → Coder instead of re-reading the file each time.
5. **Fixed context size + keep-alive,** so the model never reloads between steps.
6. **Free local tests:** the AI is only called again when something actually broke.
7. **"Skip thinking"** for reasoning models (on by default).

On a 16 GB RAM PC with integrated graphics, expect a few to ~10 tokens/second for a 7B model. A game written from scratch is roughly 3–7k output tokens (10–20 minutes); a starter customization is about 1k (2–4 minutes). The plan card shows an estimate from your real measured speed. Use `qwen2.5-coder:3b` for quick edits if you want faster turnarounds.

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
| 3.0 | Starter recipes, Tuner, lean edits, shared prompt cache, kit v2 (music, backdrops, choice cards, banners) |
| 3.1 | 5 new genre starters (hockey, basketball, tower defense, racer, deckbuilder), XP level-ups in Zombie Survival, milestones and buy-max in Idle Tycoon, kit on-screen action buttons |
| 3.2 | Hold the Tower, an incremental tower defense starter with a permanent upgrade workshop |
| 3.3 | Gem Clash, a match-3 puzzle battle starter |
| 3.4 | Cat Spots, a cat logic puzzle starter with a unique-solution generator; kit guards against a zero-size window |
| 3.5 | One-tap studio updates with restart, Ollama finder for Wi-Fi and Termux, lean edits on the fast model, 54-test suite + GitHub CI |

---

## Settings worth knowing
- **Context size:** 16k by default. Choose 8k if RAM is tight.
- **Repair attempts:** how many times the Debugger may try (Smart). Quality always allows at least 2.
- **Plan first:** turn it off to skip the plan and approval step in Smart and Quality.
- **Autopilot:** on or off, how long before plans are approved (or "wait for me"), improvement rounds (0–3), and playtest length.
- **⚡ Start from starters** and **🎛 Lean edits:** both on by default. Turn them off to always write from scratch or always send whole files.
- **Ollama address:** point it at another machine, e.g. a gaming PC: `http://192.168.1.50:11434`.

Command-line options: `node server.js --port 4848 --host 0.0.0.0 --pin 1234 --ollama http://127.0.0.1:11434 --data ./data --open`
Update options: `--update-repo owner/repo`, `--update-branch main`, `--no-git-update` (always use the download updater).

## Folders
```
server.js              zero-dependency server (API, Ollama proxy, storage, terminal, monitor, updates)
lib/update.js          studio self-update (tar reader, safety checks)
test/                  npm test: server, engine, starters and updater against a fake Ollama
public/                the studio (PWA): index.html, app.js, engine.js, tester.js, styles.css
public/shared/         build + test-harness code shared by browser and server
public/kit/            game.js, app.js, ui.css — what generated apps are built on
public/recipes/        22 starter recipes + index.js (keywords, themes, CFG helpers)
data/                  your projects, versions (deduplicated), workspace, logs, settings (not in git)
```

## Troubleshooting
- **"Ollama offline":** start Ollama (system tray icon), then Settings → Test.
- **Very slow:** check Monitor. If RAM is nearly full, close apps or switch the Coder to `qwen2.5-coder:3b`.
- **Phone can't connect:** same Wi-Fi? Allow Node through Windows Firewall (private networks) the first time it asks.
- **A build broke something:** Ship → Versions → ↺ Restore, or tap 🐞 Fix bugs.
- **Deleted a project by mistake:** it's in `data/trash/`. Move the folder back into `data/projects/`.
- **An update broke something:** the replaced files are in `data/backups/studio-<old version>-<time>/`. Copy them back over the studio folder, or in a git copy run `git log` and `git checkout <old commit>`.
- **Find Ollama shows nothing on the phone (Termux):** Android sometimes hides the Wi-Fi address from apps. Type the PC's address in Settings instead, e.g. `http://192.168.1.50:11434`.

## Developing
`npm run check` checks syntax, `npm test` runs the test suite (no installs needed, Node 18+). GitHub Actions runs both on Windows and Linux for every push and pull request.
