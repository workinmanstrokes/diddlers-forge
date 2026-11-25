// @ts-check
/* Diddler’s Forge — starter recipes catalog.
 * A recipe is a finished, tested game or app built on the kits with all its tuning in one
 * `const CFG = {…}` JSON block. Builds start from the closest recipe and the AI only patches
 * what the idea changes, which takes far fewer tokens than writing a whole game from nothing.
 * Themes are CFG overrides you can apply with one tap and no AI at all. */
(function (root) {
  'use strict';
  /** @type {{id:string,type:'game'|'app',name:string,emoji:string,prompt:string,strong:string[],weak:string[],themes:{name:string,emoji:string,cfg:Record<string,any>}[]}[]} */
  const LIST = [
    { id: 'shooter', type: 'game', name: 'Space Blaster', emoji: '🚀',
      prompt: 'Vertical space shooter: drag to fly, lasers fire on their own, enemy waves in formations, power-ups (spread shot, shield, extra life), an upgrade pick every other wave and a boss every 4th wave.',
      strong: ['shooter', 'shoot', 'shooting', 'galaga', 'invaders', 'shmup', 'bullet hell', 'spaceship', 'space ship', 'laser', 'lasers', 'aliens', 'starfighter', 'asteroids'], weak: ['space', 'enemies', 'boss', 'plane', 'jet', 'fighter', 'blast', 'blaster'],
      themes: [{ name: 'Deep Space', emoji: '🌌', cfg: {} },
        { name: 'Sky Ace', emoji: '✈️', cfg: { title: 'Sky Ace', emoji: '✈️', player: '✈️', playerAngle: -45, enemies: ['🛩️', '🎈', '🦅'], boss: '🐲', bgTop: '#0c4a6e', bgBottom: '#7dd3fc', backdrop: 'clouds', accent: '#facc15', bulletColor: '#fde047', enemyBulletColor: '#f97316', music: 'arcade' } },
        { name: 'Ocean Defender', emoji: '🐬', cfg: { title: 'Deep Sea Defender', emoji: '🐬', player: '🐬', playerAngle: 90, enemies: ['🦈', '🐙', '🦑'], boss: '🐋', bgTop: '#020617', bgBottom: '#0e7490', backdrop: 'bubbles', accent: '#2dd4bf', bulletColor: '#a5f3fc', enemyBulletColor: '#fb7185', music: 'chill' } }] },
    { id: 'arena', type: 'game', name: 'Zombie Survival', emoji: '🧟',
      prompt: 'Top-down zombie survival: drag to move, auto-aim shooting, 20-second waves that grow, gems and hearts to grab, pick 1 of 3 upgrades after each wave (multishot, piercing, orbit blades…) and a brute every 3rd wave.',
      strong: ['zombie', 'zombies', 'survival', 'survivor', 'survivors', 'horde', 'top-down', 'top down', 'twin-stick', 'twin stick', 'undead'], weak: ['waves', 'wave', 'arena', 'monsters', 'upgrades', 'roguelite', 'roguelike'],
      themes: [{ name: 'Zombie Night', emoji: '🧟', cfg: {} },
        { name: 'Monster Mash', emoji: '👻', cfg: { title: 'Monster Mash', emoji: '👻', player: '🧙', enemies: ['👻', '💀', '🎃'], brute: '👺', gem: '💜', floor: '#1a1025', floorLine: '#2a1838', fog: '#c084fc', accent: '#c084fc', bulletColor: '#f0abfc' } },
        { name: 'Bug Blaster', emoji: '🐛', cfg: { title: 'Bug Blaster', emoji: '🐛', player: '🧑‍🌾', enemies: ['🐛', '🐜', '🕷️'], brute: '🦂', gem: '💛', floor: '#1c1917', floorLine: '#2c2622', fog: '#facc15', accent: '#facc15', bulletColor: '#fef08a', music: 'action' } }] },
    { id: 'runner', type: 'game', name: 'Neon Runner', emoji: '🏃',
      prompt: 'One-tap endless runner: tap to jump, tap again to double jump, obstacles, bats and pits, coin arcs with x2/x3 streaks, speed ramps up, synthwave city.',
      strong: ['runner', 'endless run', 'endless runner', 'dino', 'parkour', 'subway', 'temple run', 'jump over', 'side scroller', 'side-scroller'], weak: ['run', 'running', 'jump', 'jumping', 'obstacles', 'dash', 'coins'],
      themes: [{ name: 'Neon City', emoji: '🌆', cfg: {} },
        { name: 'Desert Dash', emoji: '🌵', cfg: { title: 'Desert Dash', emoji: '🌵', bgTop: '#7c2d12', bgBottom: '#fdba74', sun: '#fde047', gridColor: '#fb923c', groundColor: '#451a03', obstacles: ['🌵', '🪨', '🦂'], flyer: '🦅', accent: '#fb923c', hazardGlow: '#ef4444' } },
        { name: 'Ice Run', emoji: '⛄', cfg: { title: 'Ice Run', emoji: '⛄', bgTop: '#0c1a3a', bgBottom: '#7dd3fc', sun: '#e0f2fe', gridColor: '#bae6fd', groundColor: '#0f2747', obstacles: ['⛄', '🧊', '🌲'], flyer: '🐦', accent: '#7dd3fc', hazardGlow: '#38bdf8', music: 'chill' } }] },
    { id: 'flappy', type: 'game', name: 'Sky Hopper', emoji: '🐤',
      prompt: 'Tap to flap through pipe gaps: 3 hearts, a bouncy ground, bonus stars, x2/x3 points for streaks, gaps that narrow over time, sunny sky with drifting clouds.',
      strong: ['flappy', 'flap', 'flapping', 'tap to fly', 'pipes', 'helicopter'], weak: ['bird', 'fly', 'flying', 'gaps', 'gap'],
      themes: [{ name: 'Sunny Day', emoji: '☀️', cfg: {} },
        { name: 'Night Flight', emoji: '🦉', cfg: { title: 'Night Flight', emoji: '🦉', player: '🦉', bgTop: '#0f172a', bgBottom: '#4338ca', cloudTint: '#a5b4fc', pipeColor: '#7c3aed', pipeDark: '#5b21b6', groundColor: '#1e1b4b', grassColor: '#4c1d95', accent: '#a78bfa', bonus: '🌙', music: 'chill' } },
        { name: 'Rocket Hop', emoji: '🚀', cfg: { title: 'Rocket Hop', emoji: '🚀', player: '🚀', bgTop: '#020617', bgBottom: '#1e1b4b', cloudTint: '#64748b', pipeColor: '#f43f5e', pipeDark: '#9f1239', groundColor: '#334155', grassColor: '#64748b', accent: '#f43f5e', music: 'action' } }] },
    { id: 'catcher', type: 'game', name: 'Fruit Frenzy', emoji: '🧺',
      prompt: 'Drag a basket to catch falling fruit and dodge bombs: combo multiplier, golden-star frenzy that turns everything into fruit, speeds up over time.',
      strong: ['catcher', 'falling', 'basket', 'catch falling', 'dodge falling'], weak: ['catch', 'fruit', 'drop', 'drops', 'dropping', 'dodge', 'avoid', 'collect', 'bombs'],
      themes: [{ name: 'Fruit Frenzy', emoji: '🍎', cfg: {} },
        { name: 'Candy Rain', emoji: '🍭', cfg: { title: 'Candy Rain', emoji: '🍭', good: ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪'], bad: ['🌶️', '🧅'], golden: '🌈', bgTop: '#4a044e', bgBottom: '#db2777', glow: '#f9a8d4', accent: '#f472b6' } },
        { name: 'Treasure Dive', emoji: '💎', cfg: { title: 'Treasure Dive', emoji: '💎', player: '🪣', good: ['💎', '🪙', '💍', '👑', '🐚'], bad: ['🦀', '🐡'], golden: '🧜', bgTop: '#082f49', bgBottom: '#0e7490', glow: '#22d3ee', accent: '#22d3ee', music: 'chill' } }] },
    { id: 'breakout', type: 'game', name: 'Brick Smash', emoji: '🧱',
      prompt: 'Brick breaker: drag the paddle, tap to launch, 5 brick layouts that cycle by level, tougher bricks later, power-ups (multi-ball, wide paddle, slow ball, extra life).',
      strong: ['breakout', 'brick', 'bricks', 'arkanoid', 'paddle', 'brick breaker'], weak: ['ball', 'bounce', 'smash', 'blocks'],
      themes: [{ name: 'Neon Bricks', emoji: '🧱', cfg: {} },
        { name: 'Sugar Smash', emoji: '🍬', cfg: { title: 'Sugar Smash', emoji: '🍬', brickColors: ['#f9a8d4', '#fbcfe8', '#c4b5fd', '#a5f3fc', '#fde68a', '#bbf7d0'], bgTop: '#500724', bgBottom: '#831843', accent: '#f472b6', paddleColor: '#fdf2f8', music: 'happy' } },
        { name: 'Retro Green', emoji: '👾', cfg: { title: 'Retro Bricks', emoji: '👾', brickColors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac', '#bbf7d0'], bgTop: '#000000', bgBottom: '#052e16', accent: '#4ade80', paddleColor: '#4ade80', ballColor: '#bbf7d0' } }] },
    { id: 'snake', type: 'game', name: 'Snake Arena', emoji: '🐍',
      prompt: 'Modern snake: swipe or arrow keys, smooth gliding body, 3 orbs on the board, golden orbs, walls wrap around, rocks appear as you grow, speeds up every 4 orbs.',
      strong: ['snake', 'slither', 'worm', 'tron'], weak: ['grow longer', 'tail', 'orbs', 'grid'],
      themes: [{ name: 'Jungle', emoji: '🐍', cfg: {} },
        { name: 'Neon Viper', emoji: '⚡', cfg: { title: 'Neon Viper', emoji: '⚡', accent: '#f0abfc', bgTop: '#0b0221', bgBottom: '#2e1065', boardColor: '#120a2a', snakeHead: '#f0abfc', snakeTail: '#7c3aed', orbColor: '#22d3ee', goldColor: '#fde047', music: 'action' } },
        { name: 'Garden Worm', emoji: '🪱', cfg: { title: 'Garden Worm', emoji: '🪱', accent: '#84cc16', bgTop: '#1c1917', bgBottom: '#3f2a14', boardColor: '#3b2412', snakeHead: '#fda4af', snakeTail: '#e11d48', orbColor: '#84cc16', goldColor: '#facc15', rock: '🍄', music: 'happy' } }] },
    { id: 'match3', type: 'game', name: 'Gem Match', emoji: '💎',
      prompt: 'Match-3: swipe gems to swap, cascades, line gems for 4 in a row and rainbow gems for 5, levels with a target score and limited moves, hints and auto-shuffle.',
      strong: ['match 3', 'match-3', 'match3', 'match three', 'bejeweled', 'candy crush', 'jewels', 'gem swap'], weak: ['match', 'gems', 'gem', 'puzzle', 'swap', 'candy', 'cascade'],
      themes: [{ name: 'Gem Vault', emoji: '💎', cfg: {} },
        { name: 'Fruit Crush', emoji: '🍓', cfg: { title: 'Fruit Crush', emoji: '🍓', useEmoji: true, bgTop: '#14532d', bgBottom: '#065f46', accent: '#4ade80' } },
        { name: 'Candy Pop', emoji: '🍬', cfg: { title: 'Candy Pop', emoji: '🍬', gemColors: ['#fb7185', '#fbbf24', '#a3e635', '#38bdf8', '#c084fc', '#f472b6'], bgTop: '#4a044e', bgBottom: '#9d174d', accent: '#f9a8d4', music: 'happy' } }] },
    { id: 'clicker', type: 'game', name: 'Idle Tycoon', emoji: '💰',
      prompt: 'Idle tycoon: tap the big coin, buy 7 businesses that keep earning while you are away (offline earnings), stronger taps, a golden frenzy and prestige stars.',
      strong: ['clicker', 'idle', 'tycoon', 'incremental', 'cookie clicker', 'tap to earn'], weak: ['upgrades', 'money', 'earn', 'business', 'empire', 'tap'],
      themes: [{ name: 'Tycoon', emoji: '💰', cfg: {} },
        { name: 'Cookie Empire', emoji: '🍪', cfg: { title: 'Cookie Empire', emoji: '🍪', tapEmoji: '🍪', currency: '🍪', accent: '#f59e0b', bgTop: '#431407', bgBottom: '#7c2d12', panelColor: '#1c0a03ee',
          earners: [{ name: 'Grandma', icon: '👵', cost: 15, rate: 0.5 }, { name: 'Bakery', icon: '🥐', cost: 120, rate: 4 }, { name: 'Wheat Farm', icon: '🌾', cost: 1100, rate: 30 }, { name: 'Sugar Mine', icon: '⛏️', cost: 12000, rate: 260 }, { name: 'Cookie Factory', icon: '🏭', cost: 130000, rate: 2100 }, { name: 'Cookie Bank', icon: '🏦', cost: 1400000, rate: 16000 }, { name: 'Cookie Rocket', icon: '🚀', cost: 20000000, rate: 140000 }] } },
        { name: 'Space Miner', emoji: '🪐', cfg: { title: 'Space Miner', emoji: '🪐', tapEmoji: '☄️', currency: '◆', accent: '#a78bfa', bgTop: '#020617', bgBottom: '#312e81', panelColor: '#0b0726ee', music: 'chill',
          earners: [{ name: 'Drill Bot', icon: '🤖', cost: 15, rate: 0.5 }, { name: 'Ore Hauler', icon: '🚛', cost: 120, rate: 4 }, { name: 'Satellite', icon: '🛰️', cost: 1100, rate: 30 }, { name: 'Moon Base', icon: '🌙', cost: 12000, rate: 260 }, { name: 'Star Forge', icon: '⭐', cost: 130000, rate: 2100 }, { name: 'Galaxy Bank', icon: '🏦', cost: 1400000, rate: 16000 }, { name: 'Warp Gate', icon: '🌀', cost: 20000000, rate: 140000 }] } }] },
    { id: 'fishing', type: 'game', name: 'Lunker Rush', emoji: '🎣',
      prompt: 'Fishing: hold and let go to cast, tap when the bobber dips, hold to reel but ease off when the line goes red. 9 Michigan species with real weights, a species log, personal bests and a day that ends at sunset.',
      strong: ['fish', 'fishing', 'angler', 'angling', 'lure', 'bass', 'walleye', 'trout', 'pike', 'muskie', 'bobber', 'cast and reel'], weak: ['lake', 'boat', 'reel', 'river', 'pond'],
      themes: [{ name: 'Morning Lake', emoji: '🌅', cfg: {} },
        { name: 'Ice Shanty', emoji: '🧊', cfg: { title: 'Ice Shanty', emoji: '🧊', skyTop: '#93c5fd', skyBottom: '#e0f2fe', waterTop: '#1e3a8a', waterBottom: '#020617', treeColor: '#cbd5e1', boatColor: '#475569', accent: '#93c5fd' } },
        { name: 'Deep Sea', emoji: '🐟', cfg: { title: 'Deep Sea Rush', emoji: '🐟', skyTop: '#0ea5e9', skyBottom: '#bae6fd', waterTop: '#0369a1', waterBottom: '#0c1e3a', treeColor: '#0c4a6e', boatColor: '#f8fafc', accent: '#0ea5e9',
          fish: [{ name: 'Red Snapper', color: '#f87171', belly: '#fecaca', pattern: '', min: 1, max: 12, pts: 20, fight: 0.6, rarity: 28 }, { name: 'Mackerel', color: '#3b82f6', belly: '#e0f2fe', pattern: 'bars', min: 0.5, max: 4, pts: 15, fight: 0.55, rarity: 26 },
            { name: 'Sea Bass', color: '#334155', belly: '#cbd5e1', pattern: 'stripe', min: 1, max: 9, pts: 40, fight: 0.95, rarity: 16 }, { name: 'Grouper', color: '#a16207', belly: '#fde68a', pattern: 'spots', min: 5, max: 40, pts: 70, fight: 1.15, rarity: 10 },
            { name: 'Mahi-Mahi', color: '#22c55e', belly: '#facc15', pattern: 'spots', min: 8, max: 40, pts: 110, fight: 1.3, rarity: 7 }, { name: 'Yellowfin Tuna', color: '#1e3a8a', belly: '#facc15', pattern: 'stripe', min: 20, max: 180, pts: 300, fight: 1.55, rarity: 3 },
            { name: 'Blue Marlin', color: '#1d4ed8', belly: '#e2e8f0', pattern: 'bars', min: 100, max: 600, pts: 900, fight: 1.75, rarity: 0.7 }] } }] },
    { id: 'habits', type: 'app', name: 'Habit Streaks', emoji: '✅',
      prompt: 'Habit tracker: tap to check off today, streaks, 7-day dots, a completion ring, a stats tab and milestone celebrations.',
      strong: ['habit', 'habits', 'streak', 'streaks', 'routine', 'routines'], weak: ['daily', 'track', 'tracker', 'goals', 'check off'],
      themes: [{ name: 'Fresh Green', emoji: '✅', cfg: {} },
        { name: 'Fitness', emoji: '💪', cfg: { title: 'Fit Streaks', emoji: '💪', accent: '#f97316', accent2: '#facc15', starterHabits: [{ name: 'Workout', emoji: '🏋️' }, { name: '10k steps', emoji: '👟' }, { name: 'Hit protein goal', emoji: '🥩' }] } },
        { name: 'Calm (light)', emoji: '🧘', cfg: { title: 'Daily Calm', emoji: '🧘', accent: '#7c3aed', accent2: '#0891b2', light: true, starterHabits: [{ name: 'Meditate', emoji: '🧘' }, { name: 'Journal', emoji: '✍️' }, { name: 'No phone in bed', emoji: '📵' }] } }] },
    { id: 'budget', type: 'app', name: 'Budget Buddy', emoji: '💸',
      prompt: 'Expense tracker: quick add with category chips, how much is left this month, history grouped by day and a category breakdown.',
      strong: ['budget', 'expense', 'expenses', 'spending', 'finances', 'money tracker'], weak: ['money', 'cost', 'costs', 'receipts', 'bills', 'finance'],
      themes: [{ name: 'Emerald', emoji: '💸', cfg: {} },
        { name: 'Job Costs', emoji: '🧾', cfg: { title: 'Job Costs', emoji: '🧾', accent: '#f59e0b', monthlyBudget: 5000, categories: [{ name: 'Materials', emoji: '🧱', color: '#f97316' }, { name: 'Fuel', emoji: '⛽', color: '#eab308' }, { name: 'Equipment', emoji: '🚜', color: '#3b82f6' }, { name: 'Labor', emoji: '👷', color: '#22c55e' }, { name: 'Dump fees', emoji: '🚛', color: '#a855f7' }, { name: 'Other', emoji: '📦', color: '#64748b' }] } },
        { name: 'Light', emoji: '☀️', cfg: { title: 'Pocket Budget', accent: '#0369a1', light: true } }] },
    { id: 'timer', type: 'app', name: 'Interval Timer', emoji: '⏱️',
      prompt: 'Interval timer: work, rest and rounds steppers, a big ring countdown with beeps and vibration, and saved presets.',
      strong: ['interval', 'hiit', 'tabata', 'pomodoro', 'countdown', 'stopwatch', 'timer'], weak: ['workout', 'exercise', 'rounds', 'focus'],
      themes: [{ name: 'Workout', emoji: '🔥', cfg: {} },
        { name: 'Fight Timer', emoji: '🥊', cfg: { title: 'Fight Timer', emoji: '🥊', work: 180, rest: 60, rounds: 5, workColor: '#ef4444', restColor: '#3b82f6' } },
        { name: 'Focus', emoji: '🍅', cfg: { title: 'Focus Timer', emoji: '🍅', work: 1500, rest: 300, rounds: 4, workColor: '#f97316', restColor: '#22c55e', presets: [{ name: 'Classic 25/5', work: 1500, rest: 300, rounds: 4 }, { name: 'Deep work 50/10', work: 3000, rest: 600, rounds: 3 }] } }] },
    { id: 'notes', type: 'app', name: 'Quick Notes', emoji: '📝',
      prompt: 'Notes: quick capture, color tags, pinning, search with highlights, edit and delete.',
      strong: ['notes', 'note', 'notepad', 'journal', 'memo', 'memos'], weak: ['write', 'ideas', 'jot', 'list'],
      themes: [{ name: 'Amber', emoji: '📝', cfg: {} },
        { name: 'Job Notes', emoji: '🏗️', cfg: { title: 'Job Notes', emoji: '🏗️', accent: '#f97316', welcomeNote: 'Jot down site measurements, materials and client requests here.' } },
        { name: 'Light', emoji: '☀️', cfg: { title: 'Notebook', accent: '#1d4ed8', light: true } }] },
  ];

  const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /** Zero-token match: which recipe fits this idea best? @param {string} idea @param {'game'|'app'} [type] */
  function match(idea, type) {
    const t = ' ' + String(idea || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ') + ' ';
    let best = null, bestScore = 0;
    for (const r of LIST) {
      if (type && r.type !== type) continue;
      let s = 0;
      for (const w of r.strong) if (new RegExp('[\\s-]' + esc(w) + '[\\s-]').test(t)) s += 3;
      for (const w of r.weak) if (new RegExp('[\\s-]' + esc(w) + '[\\s-]').test(t)) s += 1;
      if (s > bestScore) { bestScore = s; best = r; }
    }
    return best && bestScore >= 3 ? { recipe: best, score: bestScore } : null;
  }
  /** Is this idea exactly a starter's own description (so no AI is needed at all)? @param {string} idea */
  function exact(idea) { const s = String(idea || '').trim(); return LIST.find((r) => r.prompt === s) || null; }

  // ---------- CFG block helpers (shared by the studio and the engine) ----------
  /** Find `const CFG = {…};` and parse it. @param {string} src */
  function findCfg(src) {
    const s = String(src || ''); const m = /const\s+CFG\s*=\s*\{/.exec(s); if (!m) return null;
    const open = m.index + m[0].length - 1; let depth = 0, inStr = false, q = '', i = open;
    for (; i < s.length; i++) {
      const c = s[i];
      if (inStr) { if (c === '\\') { i++; continue; } if (c === q) inStr = false; continue; }
      if (c === '"' || c === "'") { inStr = true; q = c; continue; }
      if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) break; }
    }
    if (depth !== 0) return null;
    const text = s.slice(open, i + 1);
    let obj = null; try { obj = JSON.parse(text); } catch (e) { return null; }
    return { start: open, end: i + 1, text, obj };
  }
  /** Pretty CFG: one key per line, short arrays/objects inline. @param {any} obj */
  function cfgText(obj) {
    const lines = Object.keys(obj).map((k) => {
      const v = obj[k]; let t = JSON.stringify(v);
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') t = '[\n    ' + v.map((x) => JSON.stringify(x).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/^\{/, '{ ').replace(/\}$/, ' }')).join(',\n    ') + '\n  ]';
      else if (Array.isArray(v)) t = JSON.stringify(v).replace(/,/g, ', ');
      return '  ' + JSON.stringify(k) + ': ' + t;
    });
    return '{\n' + lines.join(',\n') + '\n}';
  }
  /** Write a new CFG into the source and keep the app line + <title> in sync. @param {string} src @param {any} obj */
  function setCfg(src, obj) {
    const f = findCfg(src); if (!f) return src;
    let out = src.slice(0, f.start) + cfgText(obj) + src.slice(f.end);
    const m = out.match(/<!--\s*app:\s*(\{[\s\S]*?\})\s*-->/);
    if (m) {
      try {
        const meta = JSON.parse(m[1]);
        if (typeof obj.title === 'string' && obj.title) meta.name = obj.title.slice(0, 40);
        if (typeof obj.emoji === 'string' && obj.emoji) meta.emoji = obj.emoji;
        const col = obj.accent || obj.workColor; if (typeof col === 'string' && /^#[0-9a-f]{6}$/i.test(col)) meta.color = col;
        out = out.replace(m[0], '<!-- app: ' + JSON.stringify(meta) + ' -->');
      } catch (e) { /* leave the line alone */ }
    }
    if (typeof obj.title === 'string' && obj.title) out = out.replace(/<title>[^<]*<\/title>/i, '<title>' + obj.title.replace(/[<&]/g, '') + '</title>');
    return out;
  }

  const api = { list: LIST, get: (/** @type {string} */ id) => LIST.find((r) => r.id === id) || null, match, exact, findCfg, cfgText, setCfg };
  // @ts-ignore
  root.Recipes = api;
  // @ts-ignore
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
