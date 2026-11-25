// @ts-check
/* Diddler’s Forge — starter recipes catalog.
 * A recipe is a finished, tested game or app built on the kits with all its tuning in one
 * `const CFG = {…}` JSON block. Builds start from the closest recipe and the AI only patches
 * what the idea changes, which takes far fewer tokens than writing a whole game from nothing.
 * Themes are CFG overrides you can apply with one tap and no AI at all. */
(function (root) {
  'use strict';
  /** @type {{id:string,type:'game'|'app',name:string,emoji:string,prompt:string,strong:string[],weak:string[],avoid?:string[],themes:{name:string,emoji:string,cfg:Record<string,any>}[]}[]} */
  const LIST = [
    { id: 'shooter', type: 'game', name: 'Space Blaster', emoji: '🚀',
      prompt: 'Vertical space shooter: drag to fly, lasers fire on their own, enemy waves in formations, power-ups (spread shot, shield, extra life), an upgrade pick every other wave and a boss every 4th wave.',
      strong: ['shooter', 'shoot', 'shooting', 'galaga', 'invaders', 'shmup', 'bullet hell', 'spaceship', 'space ship', 'laser', 'lasers', 'aliens', 'starfighter', 'asteroids'], weak: ['space', 'enemies', 'boss', 'plane', 'jet', 'fighter', 'blast', 'blaster'],
      themes: [{ name: 'Deep Space', emoji: '🌌', cfg: {} },
        { name: 'Sky Ace', emoji: '✈️', cfg: { title: 'Sky Ace', emoji: '✈️', player: '✈️', playerAngle: -45, enemies: ['🛩️', '🎈', '🦅'], boss: '🐲', bgTop: '#0c4a6e', bgBottom: '#7dd3fc', backdrop: 'clouds', accent: '#facc15', bulletColor: '#fde047', enemyBulletColor: '#f97316', music: 'arcade' } },
        { name: 'Ocean Defender', emoji: '🐬', cfg: { title: 'Deep Sea Defender', emoji: '🐬', player: '🐬', playerAngle: 90, enemies: ['🦈', '🐙', '🦑'], boss: '🐋', bgTop: '#020617', bgBottom: '#0e7490', backdrop: 'bubbles', accent: '#2dd4bf', bulletColor: '#a5f3fc', enemyBulletColor: '#fb7185', music: 'chill' } }] },
    { id: 'arena', type: 'game', name: 'Zombie Survival', emoji: '🧟',
      prompt: 'Bullet-heaven zombie survival: drag to move, auto-aim shooting, XP gems that level you up mid-fight (pick 1 of 3 powers: multishot, piercing, orbit blades, nova…), 20-second waves that grow and a brute every 3rd wave.',
      strong: ['survival', 'survivor', 'survivors', 'horde', 'hordes', 'bullet heaven', 'vampire survivors', 'auto shooter', 'auto-shooter', 'twin-stick', 'twin stick', 'arena shooter', 'zombie game', 'zombie survival', 'zombie shooter', 'zombie apocalypse', 'shoot zombies', 'kill zombies'], weak: ['zombie', 'zombies', 'undead', 'top-down', 'top down', 'waves', 'wave', 'arena', 'monsters', 'upgrades', 'level up', 'xp', 'roguelite', 'roguelike'],
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
      prompt: 'Idle tycoon: tap the big coin, buy 7 businesses that keep earning while you are away (offline earnings), x2 milestones at 10/25/50/100 owned, buy x1/x10/max, stronger taps, a golden frenzy and prestige stars.',
      strong: ['clicker', 'idle', 'tycoon', 'incremental', 'cookie clicker', 'tap to earn', 'shop manager', 'business sim', 'business simulator', 'adventure capitalist'], weak: ['upgrades', 'money', 'earn', 'business', 'empire', 'tap', 'shop', 'store', 'manager', 'sim', 'passive income'],
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
    { id: 'hockey', type: 'game', name: 'Rink Rush', emoji: '🏒',
      prompt: 'Arcade 3-on-3 ice hockey: drag to skate, PASS and SHOOT buttons (tap to pass, swipe up to shoot), one-timers, body checks, smart AI teammates and goalies, 3 periods on a clock, scoreboard and sudden-death overtime.',
      avoid: ['air hockey', 'table hockey'], strong: ['hockey', 'ice hockey', 'puck', 'nhl', 'rink', 'slapshot', 'slap shot'], weak: ['ice', 'goalie', 'stick', 'skate', 'skating', '3v3', '2v2', 'sports', 'team', 'periods'],
      themes: [{ name: 'Classic Rink', emoji: '🏒', cfg: {} },
        { name: 'Zombie Hockey', emoji: '🧟', cfg: { title: 'Zombie Hockey', emoji: '🧟', accent: '#a3e635', arena: '#070b07', ice: '#d9e4dc', iceShade: '#b9c9bd', redLine: '#7f1d1d', blueLine: '#3f6212', homeName: 'HUMANS', homeColor: '#2563eb', awayName: 'ZOMBIES', awayColor: '#4d7c0f', awayTrim: '#d9f99d', awayEmoji: '🧟', music: 'spooky' } },
        { name: 'Neon Night', emoji: '🌃', cfg: { title: 'Neon Night Hockey', emoji: '🌃', accent: '#f472b6', arena: '#05010f', ice: '#1e1b4b', iceShade: '#2e1065', redLine: '#f472b6', blueLine: '#22d3ee', puckColor: '#f8fafc', homeColor: '#0891b2', homeTrim: '#cffafe', awayColor: '#db2777', awayTrim: '#fce7f3' } }] },
    { id: 'basketball', type: 'game', name: 'Hoop Rush', emoji: '🏀',
      prompt: 'Arcade 3-on-3 basketball: drag to move, PASS and SHOOT buttons, dunks up close, 2s and 3s, steals and blocks, a 12-second shot clock, AI teammates, first to 21 or best score after 3 minutes.',
      strong: ['basketball', 'hoops', 'hoop', 'nba', 'dunk', 'dunks', 'slam dunk', 'streetball', 'b-ball', 'buzzer beater'], weak: ['court', 'three pointer', 'jump shot', 'layup', '3v3', '2v2', 'sports', 'team', 'ball'],
      themes: [{ name: 'Arena Court', emoji: '🏀', cfg: {} },
        { name: 'Street Court', emoji: '🏙️', cfg: { title: 'Street Hoops', emoji: '🏙️', accent: '#facc15', arena: '#0c0a09', wood: '#57534e', woodDark: '#44403c', lines: '#facc15', paint: '#292524', homeName: 'NORTH', homeColor: '#0ea5e9', awayName: 'SOUTH', awayColor: '#f97316', music: 'action' } },
        { name: 'Zoo Hoops', emoji: '🦁', cfg: { title: 'Zoo Hoops', emoji: '🦁', accent: '#22c55e', wood: '#e3b27a', woodDark: '#c98f52', paint: '#166534', homeName: 'BEARS', homeEmoji: '🐻', homeColor: '#92400e', awayName: 'LIONS', awayEmoji: '🦁', awayColor: '#ca8a04', music: 'happy' } }] },
    { id: 'towerdefense', type: 'game', name: 'Tower Siege', emoji: '🏰',
      prompt: 'Tower defense: drag towers from the tray onto the grass, 4 tower types (archer, splash cannon, frost slow, chain zapper) with 3 upgrade levels and sell, enemies follow a winding path, waves that grow with a boss every 10th, call waves early for bonus gold.',
      avoid: ['idle', 'incremental', 'single tower', 'one tower'], strong: ['tower defense', 'tower defence', 'td', 'towers', 'turret', 'turrets', 'bloons', 'kingdom rush', 'defend the base', 'defend the castle', 'defend your base'], weak: ['tower', 'defend', 'defense', 'defence', 'path', 'castle', 'enemies', 'waves', 'upgrade', 'strategy'],
      themes: [{ name: 'Castle Siege', emoji: '🏰', cfg: {} },
        { name: 'Star Defense', emoji: '🛰️', cfg: { title: 'Star Defense', emoji: '🛰️', accent: '#38bdf8', grass: '#111827', grassAlt: '#162033', pathColor: '#475569', pathEdge: '#94a3b8', trayColor: '#05070d', base: '🛰️', portal: '🌌',
          towers: [{ name: 'Blaster', icon: '🔫', cost: 50, range: 92, rate: 1.7, dmg: 9, color: '#22d3ee', kind: 'single' }, { name: 'Rocket', icon: '🚀', cost: 80, range: 82, rate: 0.7, dmg: 22, splash: 44, color: '#f97316', kind: 'splash' }, { name: 'Cryo', icon: '🧊', cost: 70, range: 80, rate: 1.2, dmg: 4, slow: 0.5, color: '#93c5fd', kind: 'slow' }, { name: 'Tesla', icon: '⚡', cost: 120, range: 104, rate: 0.9, dmg: 15, chain: 3, color: '#a855f7', kind: 'chain' }],
          enemies: [{ name: 'Drone', icon: '👾', hp: 28, speed: 50, reward: 5, leak: 1 }, { name: 'Scout', icon: '🛸', hp: 16, speed: 86, reward: 4, leak: 1 }, { name: 'Mech', icon: '🤖', hp: 95, speed: 31, reward: 12, leak: 2 }, { name: 'Overlord', icon: '👽', hp: 650, speed: 25, reward: 90, leak: 10 }] } },
        { name: 'Garden Guard', emoji: '🌻', cfg: { title: 'Garden Guard', emoji: '🌻', accent: '#facc15', grass: '#65a30d', grassAlt: '#6eb012', pathColor: '#a16207', pathEdge: '#713f12', trayColor: '#1a2e05', base: '🏡', portal: '🕳️', music: 'happy',
          towers: [{ name: 'Seed Spitter', icon: '🌱', cost: 50, range: 92, rate: 1.7, dmg: 9, color: '#22c55e', kind: 'single' }, { name: 'Melon Lob', icon: '🍉', cost: 80, range: 82, rate: 0.7, dmg: 22, splash: 44, color: '#f43f5e', kind: 'splash' }, { name: 'Ice Mint', icon: '🌿', cost: 70, range: 80, rate: 1.2, dmg: 4, slow: 0.5, color: '#67e8f9', kind: 'slow' }, { name: 'Bee Hive', icon: '🐝', cost: 120, range: 104, rate: 0.9, dmg: 15, chain: 3, color: '#facc15', kind: 'chain' }],
          enemies: [{ name: 'Snail', icon: '🐌', hp: 28, speed: 50, reward: 5, leak: 1 }, { name: 'Beetle', icon: '🪲', hp: 16, speed: 86, reward: 4, leak: 1 }, { name: 'Tortoise', icon: '🐢', hp: 95, speed: 31, reward: 12, leak: 2 }, { name: 'Wild Boar', icon: '🐗', hp: 650, speed: 25, reward: 90, leak: 10 }] } }] },
    { id: 'racer', type: 'game', name: 'Turbo Track', emoji: '🏎️',
      prompt: 'Top-down arcade racer: steer with the stick, auto gas, drift around corners to fill NITRO, boost pads, 3 laps against 3 AI rivals with rubber-banding, a minimap, places and lap times.',
      strong: ['racing', 'racer', 'race', 'races', 'kart', 'karts', 'go kart', 'go-kart', 'drift', 'drifting', 'micro machines', 'race car', 'racecar', 'grand prix', 'rally'], weak: ['car', 'cars', 'track', 'speed', 'nitro', 'drive', 'driving', 'lap', 'laps', 'circuit', 'turbo'],
      themes: [{ name: 'Grand Prix', emoji: '🏁', cfg: {} },
        { name: 'Desert Rally', emoji: '🌵', cfg: { title: 'Desert Rally', emoji: '🌵', accent: '#f59e0b', grass: '#d6a461', grassAlt: '#dcae6e', asphalt: '#6b5e52', curbA: '#ea580c', curbB: '#fef3c7', tree: '🌵', playerColor: '#f59e0b', rivalColors: ['#0ea5e9', '#16a34a', '#e11d48'], rivalNames: ['Sky', 'Cactus', 'Rose'] } },
        { name: 'Snow Circuit', emoji: '❄️', cfg: { title: 'Snow Circuit', emoji: '❄️', accent: '#3b82f6', grass: '#e2e8f0', grassAlt: '#eef2f7', asphalt: '#475569', curbA: '#2563eb', curbB: '#ffffff', tree: '🌲', playerColor: '#2563eb', rivalColors: ['#dc2626', '#16a34a', '#9333ea'], rivalNames: ['Red', 'Green', 'Purple'], grip: 6, driftGrip: 1.5,
          track: [[550, 1380], [230, 1340], [150, 1120], [290, 960], [170, 760], [190, 420], [350, 230], [620, 200], [820, 330], [790, 560], [580, 650], [650, 840], [870, 920], [900, 1200], [750, 1360]] } }] },
    { id: 'cards', type: 'game', name: 'Card Quest', emoji: '🃏',
      prompt: 'Deckbuilder card battler: draw 5 cards a turn, spend energy to attack, block and cast, drag cards onto enemies or tap them, read enemy intents, weak, vulnerable and strength, pick new cards after every fight, elites every 3rd floor and a dragon boss on floor 10.',
      strong: ['deckbuilder', 'deck builder', 'deck-builder', 'deckbuilding', 'card battler', 'card battle', 'card game', 'cards', 'slay the spire', 'hearthstone', 'ccg', 'tcg', 'collectible card'], weak: ['card', 'deck', 'spells', 'dungeon', 'turn-based', 'turn based', 'roguelike', 'roguelite', 'mana', 'energy', 'hand', 'rpg', 'battle'],
      themes: [{ name: 'Dungeon', emoji: '🐉', cfg: {} },
        { name: 'Space Crew', emoji: '🧑‍🚀', cfg: { title: 'Star Deck', emoji: '🧑‍🚀', hero: '🧑‍🚀', accent: '#22d3ee', bgTop: '#020617', bgBottom: '#1e1b4b', floor: '#0f172a', cardColor: '#1e293b', music: 'arcade',
          enemies: [{ name: 'Space Germ', icon: '🦠', hp: 16, moves: [{ t: 'attack', n: 5 }, { t: 'attack', n: 3 }, { t: 'block', n: 4 }] }, { name: 'Glitch', icon: '👾', hp: 12, moves: [{ t: 'attack', n: 4 }, { t: 'attack', n: 6 }] }, { name: 'Saucer', icon: '🛸', hp: 20, moves: [{ t: 'debuff', n: 2 }, { t: 'attack', n: 7 }, { t: 'attack', n: 4 }] }, { name: 'Robot', icon: '🤖', hp: 26, moves: [{ t: 'block', n: 6 }, { t: 'attack', n: 9 }, { t: 'buff', n: 2 }] }, { name: 'Void Squid', icon: '🐙', hp: 24, moves: [{ t: 'attack', n: 8 }, { t: 'attack', n: 5 }, { t: 'buff', n: 1 }] }],
          elites: [{ name: 'Mech Titan', icon: '🦾', hp: 60, moves: [{ t: 'buff', n: 3 }, { t: 'attack', n: 14 }, { t: 'block', n: 10 }, { t: 'attack', n: 9 }] }, { name: 'Overseer', icon: '👽', hp: 52, moves: [{ t: 'debuff', n: 2 }, { t: 'attack', n: 12 }, { t: 'attack', n: 12 }] }],
          boss: { name: 'Planet Eater', icon: '🪐', hp: 130, moves: [{ t: 'buff', n: 2 }, { t: 'attack', n: 14 }, { t: 'block', n: 12 }, { t: 'attack', n: 9 }, { t: 'debuff', n: 2 }, { t: 'attack', n: 19 }] } } },
        { name: 'Haunted Manor', emoji: '🎃', cfg: { title: 'Haunted Hand', emoji: '🎃', hero: '🧝', accent: '#a78bfa', bgTop: '#0f0a1e', bgBottom: '#2e1065', floor: '#1e1330', cardColor: '#2a2140', music: 'spooky',
          enemies: [{ name: 'Ghost', icon: '👻', hp: 16, moves: [{ t: 'attack', n: 5 }, { t: 'attack', n: 3 }, { t: 'block', n: 4 }] }, { name: 'Bat', icon: '🦇', hp: 12, moves: [{ t: 'attack', n: 4 }, { t: 'attack', n: 6 }] }, { name: 'Spider', icon: '🕷️', hp: 20, moves: [{ t: 'debuff', n: 2 }, { t: 'attack', n: 7 }, { t: 'attack', n: 4 }] }, { name: 'Skeleton', icon: '💀', hp: 26, moves: [{ t: 'block', n: 6 }, { t: 'attack', n: 9 }, { t: 'buff', n: 2 }] }, { name: 'Black Cat', icon: '🐈‍⬛', hp: 24, moves: [{ t: 'attack', n: 8 }, { t: 'attack', n: 5 }, { t: 'buff', n: 1 }] }],
          elites: [{ name: 'Ghoul', icon: '🧟', hp: 60, moves: [{ t: 'buff', n: 3 }, { t: 'attack', n: 14 }, { t: 'block', n: 10 }, { t: 'attack', n: 9 }] }, { name: 'Vampire', icon: '🧛', hp: 52, moves: [{ t: 'debuff', n: 2 }, { t: 'attack', n: 12 }, { t: 'attack', n: 12 }] }],
          boss: { name: 'Pumpkin King', icon: '🎃', hp: 130, moves: [{ t: 'buff', n: 2 }, { t: 'attack', n: 14 }, { t: 'block', n: 12 }, { t: 'attack', n: 9 }, { t: 'debuff', n: 2 }, { t: 'attack', n: 19 }] } } }] },
    { id: 'idletd', type: 'game', name: 'Hold the Tower', emoji: '🛡️',
      prompt: 'Incremental tower defense: one tower auto-shoots a growing horde coming from every side, spend gold on 8 upgrades during the run (damage, speed, range, wall, splash, multishot, frost aura, gold), a NOVA blast, a boss every 10 waves, then spend crowns on permanent workshop upgrades and push further next run.',
      strong: ['incremental tower defense', 'idle tower defense', 'incremental td', 'idle td', 'idle defense', 'incremental defense', 'single tower', 'one tower', 'the tower', 'last stand', 'hold the line', 'defend the tower', 'horde defense', 'outhold', 'orc problem'], weak: ['idle', 'incremental', 'tower', 'horde', 'hordes', 'meta progression', 'permanent upgrades', 'roguelite', 'upgrades', 'waves', 'defend', 'orcs'],
      themes: [{ name: 'Castle Hold', emoji: '🏯', cfg: {} },
        { name: 'Last Light', emoji: '🔥', cfg: { title: 'Last Light', emoji: '🔥', tower: '🔥', accent: '#fb923c', ground: '#2a1f3d', groundEdge: '#07060d', panelColor: '#0b0910ee', boltColor: '#fdba74', music: 'spooky',
          enemies: [{ name: 'Wraith', icon: '👻', hp: 6, speed: 26, dps: 4, gold: 2, size: 22, from: 1 }, { name: 'Bat', icon: '🦇', hp: 4, speed: 50, dps: 3, gold: 2, size: 20, from: 3 }, { name: 'Bone Brute', icon: '💀', hp: 32, speed: 16, dps: 12, gold: 8, size: 34, from: 6 }],
          boss: { name: 'Vampire Lord', icon: '🧛', hp: 420, speed: 12, dps: 45, gold: 120, size: 64 } } },
        { name: 'Star Base', emoji: '🛰️', cfg: { title: 'Star Base', emoji: '🛰️', tower: '🛰️', accent: '#22d3ee', ground: '#1e293b', groundEdge: '#020617', panelColor: '#020617ee', boltColor: '#67e8f9', music: 'arcade',
          enemies: [{ name: 'Alien', icon: '👾', hp: 6, speed: 26, dps: 4, gold: 2, size: 22, from: 1 }, { name: 'Saucer', icon: '🛸', hp: 4, speed: 50, dps: 3, gold: 2, size: 20, from: 3 }, { name: 'Robot', icon: '🤖', hp: 32, speed: 16, dps: 12, gold: 8, size: 34, from: 6 }],
          boss: { name: 'Mothership', icon: '👽', hp: 420, speed: 12, dps: 45, gold: 120, size: 64 } } }] },
    { id: 'battle', type: 'game', name: 'Gem Clash', emoji: '⚔️',
      prompt: 'Puzzle battle: match-3 gems where each of 5 colors powers a hero who attacks (fire, water, nature, light, shadow with type advantages), combos, line and rainbow gems, hero specials that charge up (inferno, heal, vines, smite, drain), enemies with attack timers, a boss every 5 stages and a reward pick after each stage.',
      strong: ['puzzle battle', 'puzzle battler', 'puzzle rpg', 'puzzle fighter', 'match 3 battle', 'match-3 battle', 'match 3 rpg', 'match-3 rpg', 'match 3 combat', 'match-3 combat', 'gem battle', 'puzzle quest', 'empires and puzzles', 'empires & puzzles', 'puzzle and dragons', 'puzzle & dragons', 'puzzle heroes', 'battle puzzle'], weak: ['heroes', 'battle', 'boss', 'bosses', 'rpg', 'match 3', 'match-3', 'gems', 'elements', 'specials', 'team', 'monsters'],
      themes: [{ name: 'Fantasy', emoji: '⚔️', cfg: {} },
        { name: 'Space Squad', emoji: '🚀', cfg: { title: 'Star Clash', emoji: '🚀', accent: '#22d3ee', bgTop: '#020617', bgBottom: '#1e1b4b', ground: '#111a33', music: 'arcade',
          heroes: [{ name: 'Nova', icon: '🧑‍🚀', atk: 12, special: 'Solar Flare: hits ALL enemies' }, { name: 'Medic', icon: '🤖', atk: 10, special: 'Repair Beam: heal the team' }, { name: 'Zeta', icon: '👽', atk: 11, special: 'Tractor Web: big hit + slow all timers' }, { name: 'Flux', icon: '🦾', atk: 12, special: 'Rail Gun: huge hit on the target' }, { name: 'Void', icon: '🥷', atk: 11, special: 'Black Hole: hit all + heal' }],
          enemies: [{ name: 'Fire Drone', icon: '👾', el: 0, hp: 70, atk: 30, every: 2 }, { name: 'Space Squid', icon: '🦑', el: 1, hp: 90, atk: 26, every: 2 }, { name: 'Spore', icon: '🦠', el: 2, hp: 85, atk: 40, every: 3 }, { name: 'Saucer', icon: '🛸', el: 3, hp: 60, atk: 28, every: 2 }, { name: 'Shade Bot', icon: '🤖', el: 4, hp: 50, atk: 16, every: 1 }, { name: 'Moon Rock', icon: '🪨', el: 2, hp: 65, atk: 30, every: 2 }, { name: 'Comet', icon: '☄️', el: 0, hp: 95, atk: 34, every: 3 }, { name: 'Jelly', icon: '🪼', el: 1, hp: 75, atk: 24, every: 2 }],
          bosses: [{ name: 'Sun Eater', icon: '🌞', el: 0, hp: 520, atk: 70, every: 3 }, { name: 'Ice Giant', icon: '🧊', el: 1, hp: 560, atk: 60, every: 3 }, { name: 'Hive Queen', icon: '🐛', el: 2, hp: 620, atk: 85, every: 4 }, { name: 'Mothership', icon: '🛸', el: 3, hp: 500, atk: 55, every: 2 }, { name: 'Overlord', icon: '👽', el: 4, hp: 540, atk: 65, every: 3 }] } },
        { name: 'Pet Brawl', emoji: '🦊', cfg: { title: 'Pet Brawl', emoji: '🦊', accent: '#84cc16', bgTop: '#052e16', bgBottom: '#3f2a0a', ground: '#365314', music: 'happy',
          heroes: [{ name: 'Ember', icon: '🦊', atk: 12, special: 'Fire Fur: hits ALL enemies' }, { name: 'Splash', icon: '🐳', atk: 10, special: 'Big Splash: heal the team' }, { name: 'Hopper', icon: '🐸', atk: 11, special: 'Tongue Lash: big hit + slow all timers' }, { name: 'Sparky', icon: '🐯', atk: 12, special: 'Thunder Pounce: huge hit on the target' }, { name: 'Hoot', icon: '🦉', atk: 11, special: 'Night Hoot: hit all + heal' }],
          enemies: [{ name: 'Scorpion', icon: '🦂', el: 0, hp: 70, atk: 30, every: 2 }, { name: 'Gator', icon: '🐊', el: 1, hp: 90, atk: 26, every: 2 }, { name: 'Beetle', icon: '🪲', el: 2, hp: 85, atk: 40, every: 3 }, { name: 'Wasp', icon: '🐝', el: 3, hp: 60, atk: 28, every: 2 }, { name: 'Rat', icon: '🐀', el: 4, hp: 50, atk: 16, every: 1 }, { name: 'Snake', icon: '🐍', el: 2, hp: 65, atk: 30, every: 2 }, { name: 'Raven', icon: '🐦‍⬛', el: 4, hp: 95, atk: 34, every: 3 }, { name: 'Crab', icon: '🦀', el: 1, hp: 75, atk: 24, every: 2 }],
          bosses: [{ name: 'T-Rex', icon: '🦖', el: 0, hp: 520, atk: 70, every: 3 }, { name: 'Shark', icon: '🦈', el: 1, hp: 560, atk: 60, every: 3 }, { name: 'Gorilla', icon: '🦍', el: 2, hp: 620, atk: 85, every: 4 }, { name: 'Eagle King', icon: '🦅', el: 3, hp: 500, atk: 55, every: 2 }, { name: 'Wolf Alpha', icon: '🐺', el: 4, hp: 540, atk: 65, every: 3 }] } }] },
    { id: 'cats', type: 'game', name: 'Cat Spots', emoji: '🐱',
      prompt: 'Cat logic puzzle (like Queens / Meowdoku): place one cat in every row, column and color region, and cats can never touch, not even diagonally. Tap for ✕ then cat, drag to mark, 3 hearts per level, hints, auto-✕, timer, and fresh puzzles with exactly one solution that grow from 5×5 to 9×9.',
      strong: ['meowdoku', 'queens', 'queens puzzle', 'queens game', 'linkedin queens', 'star battle', 'logic puzzle', 'logic game', 'brain puzzle', 'brain teaser', 'deduction puzzle', 'cat puzzle', 'cat logic', 'cats puzzle', 'placement puzzle', 'one per row'], weak: ['cats', 'cat', 'kitty', 'logic', 'brain', 'sudoku', 'grid', 'regions', 'puzzle', 'deduction', 'minesweeper', 'relaxing', 'daily puzzle'],
      themes: [{ name: 'Cats', emoji: '🐱', cfg: {} },
        { name: 'Puppy Park', emoji: '🐶', cfg: { title: 'Pup Spots', emoji: '🐶', noun: 'pup', accent: '#fbbf24', bgTop: '#052e16', bgBottom: '#14532d', boardEdge: '#0f1f14', markColor: '#1f3b2a', autoMarkColor: '#1f3b2a59', lineColor: '#0f1f142e', items: ['🐶', '🐕', '🐩', '🦮', '🐕‍🦺', '🐶', '🐕', '🐩', '🦮'], help: "Place one pup in every row, every column and every color. Pups can't touch, not even corner to corner. Tap once for ✕, twice for a pup. Drag to mark lots of ✕. Wrong pups cost a heart!" } },
        { name: 'Star Map', emoji: '🌟', cfg: { title: 'Star Spots', emoji: '🌟', noun: 'star', accent: '#facc15', bgTop: '#020617', bgBottom: '#1e1b4b', boardEdge: '#020617', markColor: '#e2e8f0', autoMarkColor: '#e2e8f055', lineColor: '#ffffff1f', items: ['⭐', '🌟', '✨', '💫', '🌠', '⭐', '🌟', '✨', '💫'], regionColors: ['#7c3aed', '#2563eb', '#0891b2', '#15803d', '#ca8a04', '#c2410c', '#be185d', '#65a30d', '#475569', '#92400e'], help: "Place one star in every row, every column and every color. Stars can't touch, not even corner to corner. Tap once for ✕, twice for a star. Drag to mark lots of ✕. Wrong stars cost a heart!" } }] },
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
      if (r.avoid && r.avoid.some((w) => new RegExp('[\\s-]' + esc(w) + '[\\s-]').test(t))) continue;
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
