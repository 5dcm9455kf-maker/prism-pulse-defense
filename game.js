const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  wave: document.getElementById("waveText"),
  coins: document.getElementById("coinsText"),
  lives: document.getElementById("livesText"),
  score: document.getElementById("scoreText"),
  mode: document.getElementById("modeText"),
  banner: document.getElementById("waveBanner"),
  heroDeck: document.getElementById("heroDeck"),
  towerDeck: document.getElementById("towerDeck"),
  selectedTower: document.getElementById("selectedTowerText"),
  focusName: document.getElementById("focusName"),
  focusStats: document.getElementById("focusStats"),
  focusLevel: document.getElementById("focusLevelText"),
  abilityText: document.getElementById("abilityText"),
  abilityBtn: document.getElementById("abilityBtn"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  startWaveBtn: document.getElementById("startWaveBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  restartBtn: document.getElementById("restartBtn"),
};

const W = 1280;
const H = 720;
const TWO_PI = Math.PI * 2;

const path = [
  { x: -50, y: 372 },
  { x: 142, y: 372 },
  { x: 142, y: 160 },
  { x: 382, y: 160 },
  { x: 382, y: 535 },
  { x: 632, y: 535 },
  { x: 632, y: 286 },
  { x: 902, y: 286 },
  { x: 902, y: 495 },
  { x: 1118, y: 495 },
  { x: 1118, y: 354 },
  { x: 1330, y: 354 },
];

const pads = [
  { x: 250, y: 296 },
  { x: 252, y: 474 },
  { x: 500, y: 250 },
  { x: 512, y: 624 },
  { x: 740, y: 410 },
  { x: 790, y: 164 },
  { x: 1016, y: 196 },
  { x: 1038, y: 615 },
  { x: 1220, y: 448 },
  { x: 84, y: 520 },
];

const heroes = {
  nova: {
    key: "nova",
    name: "Nova",
    initial: "N",
    color: "#ed6fa8",
    accent: "#ffd447",
    blurb: "Quick | Burst",
    speed: 260,
    shotRate: 0.16,
    bulletSpeed: 760,
    damage: 13,
    powerName: "Prism Burst",
    powerCooldown: 10,
  },
  bolt: {
    key: "bolt",
    name: "Bolt",
    initial: "B",
    color: "#40a7e3",
    accent: "#f6b63f",
    blurb: "Heavy | Pierce",
    speed: 240,
    shotRate: 0.34,
    bulletSpeed: 940,
    damage: 30,
    powerName: "Line Surge",
    powerCooldown: 12,
  },
  mint: {
    key: "mint",
    name: "Mint",
    initial: "M",
    color: "#19b7a5",
    accent: "#7658e8",
    blurb: "Chill | Freeze",
    speed: 250,
    shotRate: 0.22,
    bulletSpeed: 700,
    damage: 10,
    slow: 0.45,
    powerName: "Deep Freeze",
    powerCooldown: 13,
  },
};

const towerTypes = {
  pepper: {
    key: "pepper",
    name: "Pepper Pop",
    initial: "P",
    color: "#f05d5e",
    cost: 45,
    range: 155,
    damage: 18,
    rate: 0.5,
    blurb: "Fast | Single",
  },
  frost: {
    key: "frost",
    name: "Frost Floe",
    initial: "F",
    color: "#40a7e3",
    cost: 55,
    range: 165,
    damage: 7,
    rate: 0.78,
    slow: 0.42,
    blurb: "Slow | Focus",
  },
  spark: {
    key: "spark",
    name: "Spark Link",
    initial: "S",
    color: "#f6b63f",
    cost: 70,
    range: 170,
    damage: 15,
    rate: 1.1,
    chains: 3,
    blurb: "Chain | Cluster",
  },
  goo: {
    key: "goo",
    name: "Goo Bloom",
    initial: "G",
    color: "#58b957",
    cost: 85,
    range: 180,
    damage: 22,
    rate: 1.18,
    splash: 58,
    blurb: "Splash | Group",
  },
};

const enemyTypes = {
  runner: {
    name: "Runner",
    color: "#19b7a5",
    hp: 38,
    speed: 96,
    reward: 8,
    radius: 15,
    score: 20,
  },
  bruiser: {
    name: "Bruiser",
    color: "#f07645",
    hp: 92,
    speed: 54,
    reward: 14,
    radius: 20,
    score: 36,
  },
  shield: {
    name: "Shield",
    color: "#7658e8",
    hp: 65,
    shield: 42,
    speed: 68,
    reward: 13,
    radius: 18,
    score: 34,
  },
  splitter: {
    name: "Splitter",
    color: "#58b957",
    hp: 58,
    speed: 76,
    reward: 12,
    radius: 17,
    score: 30,
    splits: true,
  },
  boss: {
    name: "Prism Breaker",
    color: "#e2488f",
    hp: 420,
    shield: 120,
    speed: 39,
    reward: 80,
    radius: 32,
    score: 240,
    damage: 4,
    boss: true,
  },
};

const keys = new Set();
const mouse = { x: W / 2, y: H / 2, down: false };
const state = createInitialState();

let lastTime = performance.now();
let dpr = 1;
let nextEnemyId = 1;

function createInitialState() {
  return {
    wave: 0,
    coins: 160,
    lives: 20,
    score: 0,
    gameOver: false,
    paused: false,
    waveActive: false,
    selectedTowerKey: "pepper",
    selectedPadIndex: null,
    selectedHeroKey: "nova",
    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],
    spawnQueue: [],
    spawnTimer: 0,
    player: {
      x: 1120,
      y: 150,
      angle: 0,
      cooldown: 0,
      powerCooldown: 0,
    },
  };
}

function resetGame() {
  const fresh = createInitialState();
  nextEnemyId = 1;
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  renderCards();
  updateUi();
}

function setupCanvas() {
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderCards() {
  ui.heroDeck.innerHTML = "";
  Object.values(heroes).forEach((hero) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card-button ${state.selectedHeroKey === hero.key ? "selected" : ""}`;
    button.style.setProperty("--accent", hero.color);
    button.innerHTML = `
      <span class="avatar" aria-hidden="true">${hero.initial}</span>
      <span class="card-copy">
        <strong>${hero.name}</strong>
        <span>${hero.blurb}</span>
      </span>
      <span class="price-badge">${hero.powerName}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedHeroKey = hero.key;
      state.player.powerCooldown = Math.min(state.player.powerCooldown, hero.powerCooldown);
      renderCards();
      updateUi();
    });
    ui.heroDeck.appendChild(button);
  });

  ui.towerDeck.innerHTML = "";
  Object.values(towerTypes).forEach((tower) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card-button ${state.selectedTowerKey === tower.key ? "selected" : ""}`;
    button.style.setProperty("--accent", tower.color);
    button.innerHTML = `
      <span class="avatar" aria-hidden="true">${tower.initial}</span>
      <span class="card-copy">
        <strong>${tower.name}</strong>
        <span>${tower.blurb}</span>
      </span>
      <span class="price-badge">$${tower.cost}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedTowerKey = tower.key;
      state.selectedPadIndex = null;
      renderCards();
      updateUi();
    });
    ui.towerDeck.appendChild(button);
  });
}

function updateUi() {
  const hero = heroes[state.selectedHeroKey];
  const selectedTower = towerTypes[state.selectedTowerKey];
  ui.wave.textContent = String(state.wave);
  ui.coins.textContent = String(Math.floor(state.coins));
  ui.lives.textContent = String(Math.max(0, state.lives));
  ui.score.textContent = String(state.score);
  ui.selectedTower.textContent = selectedTower ? `$${selectedTower.cost}` : "None";
  ui.pauseBtn.querySelector("span").textContent = state.paused ? ">" : "II";
  ui.startWaveBtn.disabled = state.waveActive || state.gameOver;
  ui.startWaveBtn.textContent = state.waveActive ? "Wave Running" : "Start Wave";
  ui.abilityBtn.disabled = state.gameOver || state.player.powerCooldown > 0;
  ui.abilityBtn.textContent = state.player.powerCooldown > 0 ? `${hero.powerName} ${Math.ceil(state.player.powerCooldown)}` : hero.powerName;
  ui.abilityText.textContent = state.player.powerCooldown > 0 ? "Charging" : "Power ready";

  if (state.gameOver) {
    ui.mode.textContent = "Prism core offline.";
    ui.banner.textContent = "Game Over";
  } else if (state.waveActive) {
    ui.mode.textContent = "Core under attack.";
    ui.banner.textContent = `Wave ${state.wave}`;
  } else {
    ui.mode.textContent = "Prism core charging.";
    ui.banner.textContent = state.wave === 0 ? "Ready" : "Wave Clear";
  }

  const selectedPad = state.selectedPadIndex === null ? null : pads[state.selectedPadIndex];
  const tower = selectedPad ? getTowerAtPad(state.selectedPadIndex) : null;
  if (tower) {
    const def = towerTypes[tower.type];
    const upgradeCost = getUpgradeCost(tower);
    ui.focusName.textContent = def.name;
    ui.focusLevel.textContent = `Level ${tower.level}`;
    ui.focusStats.textContent = `Damage ${Math.round(getTowerDamage(tower))} | Range ${Math.round(getTowerRange(tower))} | Upgrade $${upgradeCost}`;
    ui.upgradeBtn.disabled = state.coins < upgradeCost || tower.level >= 4 || state.gameOver;
    ui.upgradeBtn.textContent = tower.level >= 4 ? "Max Level" : `Upgrade $${upgradeCost}`;
  } else if (selectedPad) {
    ui.focusName.textContent = "Open pad";
    ui.focusLevel.textContent = "Level 0";
    ui.focusStats.textContent = `${selectedTower.name} | $${selectedTower.cost} | Damage ${selectedTower.damage} | Range ${selectedTower.range}`;
    ui.upgradeBtn.disabled = true;
    ui.upgradeBtn.textContent = "Upgrade";
  } else {
    ui.focusName.textContent = selectedTower.name;
    ui.focusLevel.textContent = "Level 1";
    ui.focusStats.textContent = `$${selectedTower.cost} | Damage ${selectedTower.damage} | Range ${selectedTower.range}`;
    ui.upgradeBtn.disabled = true;
    ui.upgradeBtn.textContent = "Upgrade";
  }
}

function startWave() {
  if (state.waveActive || state.gameOver) return;
  state.wave += 1;
  state.waveActive = true;
  state.spawnQueue = makeWave(state.wave);
  state.spawnTimer = 0.2;
  state.coins += 12;
  updateUi();
}

function makeWave(wave) {
  const queue = [];
  const push = (type, count, delay = 0.56) => {
    for (let i = 0; i < count; i += 1) {
      queue.push({ type, delay });
    }
  };

  push("runner", 6 + wave * 2, Math.max(0.22, 0.58 - wave * 0.015));
  if (wave >= 2) push("bruiser", 2 + Math.floor(wave * 0.75), 0.72);
  if (wave >= 3) push("shield", 2 + Math.floor(wave * 0.55), 0.68);
  if (wave >= 4) push("splitter", 2 + Math.floor(wave * 0.45), 0.62);
  if (wave % 5 === 0) push("boss", 1 + Math.floor(wave / 10), 1.2);

  return shuffle(queue);
}

function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function spawnEnemy(type, inherited = {}) {
  const def = enemyTypes[type];
  const scale = 1 + state.wave * 0.095;
  state.enemies.push({
    id: `enemy-${nextEnemyId++}`,
    type,
    x: inherited.x ?? path[0].x,
    y: inherited.y ?? path[0].y,
    segment: inherited.segment ?? 0,
    hp: inherited.hp ?? Math.round(def.hp * scale),
    maxHp: inherited.hp ?? Math.round(def.hp * scale),
    shield: Math.round((def.shield || 0) * (1 + state.wave * 0.055)),
    maxShield: Math.round((def.shield || 0) * (1 + state.wave * 0.055)),
    speed: def.speed * (1 + Math.min(0.42, state.wave * 0.018)),
    reward: def.reward,
    radius: inherited.radius ?? def.radius,
    slowTimer: 0,
    slowAmount: 1,
    reached: false,
  });
}

function update(dt) {
  if (state.paused || state.gameOver) return;

  updatePlayer(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  state.player.powerCooldown = Math.max(0, state.player.powerCooldown - dt);

  if (state.waveActive && state.spawnQueue.length === 0 && state.enemies.length === 0) {
    state.waveActive = false;
    state.coins += 45 + state.wave * 7;
    state.score += 120 + state.wave * 25;
    addTextEffect(W / 2, 90, `Wave ${state.wave} clear`, "#19202a");
  }

  if (state.lives <= 0 && !state.gameOver) {
    state.gameOver = true;
    addBurst(W - 88, H / 2, "#f05d5e", 36);
  }

  updateUi();
}

function updateSpawns(dt) {
  if (!state.waveActive || state.spawnQueue.length === 0) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const next = state.spawnQueue.shift();
    spawnEnemy(next.type);
    state.spawnTimer = next.delay;
  }
}

function updatePlayer(dt) {
  const hero = heroes[state.selectedHeroKey];
  let dx = 0;
  let dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  const length = Math.hypot(dx, dy) || 1;
  state.player.x = clamp(state.player.x + (dx / length) * hero.speed * dt, 42, W - 42);
  state.player.y = clamp(state.player.y + (dy / length) * hero.speed * dt, 42, H - 42);
  state.player.angle = Math.atan2(mouse.y - state.player.y, mouse.x - state.player.x);
  state.player.cooldown = Math.max(0, state.player.cooldown - dt);

  if (mouse.down && state.player.cooldown <= 0) {
    shootHero();
    state.player.cooldown = hero.shotRate;
  }
}

function shootHero() {
  const hero = heroes[state.selectedHeroKey];
  const spread = hero.key === "nova" ? 0.04 : 0;
  const angle = state.player.angle + (Math.random() - 0.5) * spread;
  state.projectiles.push({
    kind: "hero",
    owner: hero.key,
    x: state.player.x + Math.cos(angle) * 30,
    y: state.player.y + Math.sin(angle) * 30,
    vx: Math.cos(angle) * hero.bulletSpeed,
    vy: Math.sin(angle) * hero.bulletSpeed,
    damage: hero.damage,
    radius: hero.key === "bolt" ? 6 : 5,
    color: hero.color,
    slow: hero.slow || 0,
    life: 1.15,
    pierce: hero.key === "bolt" ? 1 : 0,
    hitIds: new Set(),
  });
}

function useHeroPower() {
  if (state.gameOver) return;
  const hero = heroes[state.selectedHeroKey];
  if (state.player.powerCooldown > 0) return;
  state.player.powerCooldown = hero.powerCooldown;

  if (hero.key === "nova") {
    state.enemies.forEach((enemy) => {
      if (enemy.dead || enemy.hp <= 0) return;
      const dist = distance(enemy, state.player);
      if (dist < 190) damageEnemy(enemy, 75, { color: hero.color });
    });
    addBurst(state.player.x, state.player.y, hero.color, 56);
  }

  if (hero.key === "bolt") {
    const angle = state.player.angle;
    const end = {
      x: state.player.x + Math.cos(angle) * 900,
      y: state.player.y + Math.sin(angle) * 900,
    };
    state.enemies.forEach((enemy) => {
      if (enemy.dead || enemy.hp <= 0) return;
      const dist = distanceToLine(enemy, state.player, end);
      if (dist < enemy.radius + 18 && pointAhead(enemy, state.player, angle)) {
        damageEnemy(enemy, 118, { color: hero.color });
      }
    });
    state.effects.push({
      type: "beam",
      x1: state.player.x,
      y1: state.player.y,
      x2: end.x,
      y2: end.y,
      color: hero.color,
      life: 0.22,
      maxLife: 0.22,
      width: 15,
    });
  }

  if (hero.key === "mint") {
    state.enemies.forEach((enemy) => {
      if (enemy.dead || enemy.hp <= 0) return;
      const dist = distance(enemy, state.player);
      if (dist < 230) {
        enemy.slowTimer = Math.max(enemy.slowTimer, 3.5);
        enemy.slowAmount = Math.min(enemy.slowAmount, 0.28);
        damageEnemy(enemy, 42, { color: hero.color });
      }
    });
    addRing(state.player.x, state.player.y, hero.color, 230);
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.hp <= 0) continue;
    const def = enemyTypes[enemy.type];
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
    } else {
      enemy.slowAmount = 1;
    }

    const speed = enemy.speed * enemy.slowAmount;
    let remaining = speed * dt;
    while (remaining > 0 && enemy.segment < path.length - 1) {
      const target = path[enemy.segment + 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.segment += 1;
        remaining -= dist;
      } else {
        enemy.x += (dx / dist) * remaining;
        enemy.y += (dy / dist) * remaining;
        remaining = 0;
      }
    }

    if (enemy.segment >= path.length - 1) {
      enemy.reached = true;
      state.lives -= def.damage || 1;
      addBurst(W - 82, H / 2, def.color, 16);
    }
  }

  state.enemies = state.enemies.filter((enemy) => !enemy.reached && enemy.hp > 0);
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.cooldown > 0) continue;
    const target = findTarget(tower.x, tower.y, getTowerRange(tower));
    if (!target) continue;
    fireTower(tower, target);
    const def = towerTypes[tower.type];
    tower.cooldown = Math.max(0.14, def.rate * Math.pow(0.91, tower.level - 1));
  }
}

function fireTower(tower, target) {
  const def = towerTypes[tower.type];
  const damage = getTowerDamage(tower);

  if (tower.type === "frost") {
    target.slowTimer = Math.max(target.slowTimer, 2.2 + tower.level * 0.2);
    target.slowAmount = Math.min(target.slowAmount, def.slow);
    damageEnemy(target, damage, { color: def.color });
    state.effects.push({
      type: "beam",
      x1: tower.x,
      y1: tower.y,
      x2: target.x,
      y2: target.y,
      color: def.color,
      life: 0.18,
      maxLife: 0.18,
      width: 7 + tower.level,
    });
    return;
  }

  if (tower.type === "spark") {
    const chained = getEnemiesInRange(target.x, target.y, 120 + tower.level * 10).slice(0, def.chains + tower.level - 1);
    let previous = tower;
    chained.forEach((enemy, index) => {
      damageEnemy(enemy, damage * (1 - index * 0.12), { color: def.color });
      state.effects.push({
        type: "beam",
        x1: previous.x,
        y1: previous.y,
        x2: enemy.x,
        y2: enemy.y,
        color: def.color,
        life: 0.16,
        maxLife: 0.16,
        width: 6,
      });
      previous = enemy;
    });
    return;
  }

  state.projectiles.push({
    kind: "tower",
    towerType: tower.type,
    x: tower.x,
    y: tower.y,
    targetId: target.id,
    damage,
    speed: tower.type === "goo" ? 430 : 620,
    radius: tower.type === "goo" ? 10 : 6,
    splash: def.splash ? def.splash + tower.level * 8 : 0,
    color: def.color,
    life: 2,
  });
}

function updateProjectiles(dt) {
  for (const shot of state.projectiles) {
    shot.life -= dt;

    if (shot.kind === "hero") {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      for (const enemy of state.enemies) {
        if (enemy.dead || enemy.hp <= 0) continue;
        if (shot.hitIds.has(enemy.id)) continue;
        if (distance(shot, enemy) <= enemy.radius + shot.radius) {
          damageEnemy(enemy, shot.damage, { color: shot.color });
          if (shot.slow) {
            enemy.slowTimer = Math.max(enemy.slowTimer, 1.3);
            enemy.slowAmount = Math.min(enemy.slowAmount, shot.slow);
          }
          shot.hitIds.add(enemy.id);
          addSpark(shot.x, shot.y, shot.color);
          if (shot.pierce > 0) {
            shot.pierce -= 1;
          } else {
            shot.life = 0;
            break;
          }
        }
      }
    } else {
      const target = state.enemies.find((enemy) => enemy.id === shot.targetId && !enemy.dead && enemy.hp > 0);
      if (!target) {
        shot.life = 0;
        continue;
      }
      const dx = target.x - shot.x;
      const dy = target.y - shot.y;
      const dist = Math.hypot(dx, dy);
      const step = shot.speed * dt;
      if (dist <= step + target.radius) {
        shot.x = target.x;
        shot.y = target.y;
        if (shot.splash) {
          getEnemiesInRange(shot.x, shot.y, shot.splash).forEach((enemy) => {
            const falloff = 1 - Math.min(0.48, distance(shot, enemy) / (shot.splash * 2));
            damageEnemy(enemy, shot.damage * falloff, { color: shot.color });
          });
          addRing(shot.x, shot.y, shot.color, shot.splash);
        } else {
          damageEnemy(target, shot.damage, { color: shot.color });
          addSpark(shot.x, shot.y, shot.color);
        }
        shot.life = 0;
      } else {
        shot.x += (dx / dist) * step;
        shot.y += (dy / dist) * step;
      }
    }
  }

  state.projectiles = state.projectiles.filter((shot) => {
    return shot.life > 0 && shot.x > -80 && shot.x < W + 80 && shot.y > -80 && shot.y < H + 80;
  });
}

function damageEnemy(enemy, amount, options = {}) {
  if (enemy.dead || enemy.hp <= 0) return;
  let remaining = amount;
  if (enemy.shield > 0) {
    const blocked = Math.min(enemy.shield, remaining);
    enemy.shield -= blocked;
    remaining -= blocked;
    addTextEffect(enemy.x, enemy.y - enemy.radius - 14, "shield", "#7658e8");
  }

  if (remaining > 0) {
    enemy.hp -= remaining;
    if (Math.random() < 0.38) {
      addSpark(enemy.x, enemy.y, options.color || enemyTypes[enemy.type].color);
    }
  }

  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    defeatEnemy(enemy);
  }
}

function defeatEnemy(enemy) {
  const def = enemyTypes[enemy.type];
  state.coins += enemy.reward;
  state.score += def.score;
  addBurst(enemy.x, enemy.y, def.color, def.boss ? 36 : 18);
  addTextEffect(enemy.x, enemy.y - enemy.radius - 16, `+$${enemy.reward}`, "#19202a");

  if (def.splits) {
    for (let i = 0; i < 2; i += 1) {
      spawnEnemy("runner", {
        x: enemy.x + (i === 0 ? -10 : 10),
        y: enemy.y,
        segment: enemy.segment,
        hp: Math.max(20, Math.round(enemy.maxHp * 0.34)),
        radius: 12,
      });
    }
  }
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.life -= dt;
    if (effect.type === "text") {
      effect.y -= 28 * dt;
    }
  });
  state.effects = state.effects.filter((effect) => effect.life > 0);
}

function findTarget(x, y, range) {
  let best = null;
  let bestProgress = -Infinity;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.hp <= 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist > range) continue;
    const progress = enemy.segment * 10000 - dist;
    if (progress > bestProgress) {
      bestProgress = progress;
      best = enemy;
    }
  }
  return best;
}

function getEnemiesInRange(x, y, range) {
  return state.enemies
    .filter((enemy) => !enemy.dead && enemy.hp > 0 && Math.hypot(enemy.x - x, enemy.y - y) <= range)
    .sort((a, b) => b.segment - a.segment);
}

function getTowerAtPad(index) {
  return state.towers.find((tower) => tower.padIndex === index) || null;
}

function getTowerDamage(tower) {
  return towerTypes[tower.type].damage * (1 + (tower.level - 1) * 0.42);
}

function getTowerRange(tower) {
  return towerTypes[tower.type].range * (1 + (tower.level - 1) * 0.08);
}

function getUpgradeCost(tower) {
  const base = towerTypes[tower.type].cost;
  return Math.round(base * (0.7 + tower.level * 0.62));
}

function upgradeSelectedTower() {
  if (state.selectedPadIndex === null) return;
  const tower = getTowerAtPad(state.selectedPadIndex);
  if (!tower || tower.level >= 4) return;
  const cost = getUpgradeCost(tower);
  if (state.coins < cost) return;
  state.coins -= cost;
  tower.level += 1;
  addBurst(tower.x, tower.y, towerTypes[tower.type].color, 22);
  updateUi();
}

function handleCanvasPointer(event, isDown = false) {
  const point = getCanvasPoint(event);
  mouse.x = point.x;
  mouse.y = point.y;
  if (!isDown) return;

  const padIndex = findPad(point.x, point.y);
  if (padIndex !== null) {
    state.selectedPadIndex = padIndex;
    const tower = getTowerAtPad(padIndex);
    if (!tower) {
      buildTower(padIndex);
    }
    mouse.down = false;
    updateUi();
    return;
  }

  state.selectedPadIndex = null;
  mouse.down = true;
  if (state.player.cooldown <= 0) {
    shootHero();
    state.player.cooldown = heroes[state.selectedHeroKey].shotRate;
  }
  updateUi();
}

function buildTower(padIndex) {
  const def = towerTypes[state.selectedTowerKey];
  if (state.coins < def.cost || state.gameOver) {
    addTextEffect(pads[padIndex].x, pads[padIndex].y - 44, "need coins", "#f05d5e");
    return;
  }
  state.coins -= def.cost;
  state.towers.push({
    type: def.key,
    padIndex,
    x: pads[padIndex].x,
    y: pads[padIndex].y,
    level: 1,
    cooldown: 0.15,
  });
  addBurst(pads[padIndex].x, pads[padIndex].y, def.color, 20);
}

function findPad(x, y) {
  for (let i = 0; i < pads.length; i += 1) {
    if (Math.hypot(pads[i].x - x, pads[i].y - y) <= 34) return i;
  }
  return null;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  };
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawPath();
  drawPads();
  drawBase();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawPlayer();
  drawEffects();

  if (state.paused) {
    drawOverlay("Paused");
  }
  if (state.gameOver) {
    drawOverlay("Core Down");
  }
}

function drawBackground() {
  ctx.fillStyle = "#f5f2e8";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.35;
  const tiles = [
    ["#19b7a5", 72, 84, 90, 64],
    ["#f6b63f", 1110, 86, 118, 68],
    ["#ed6fa8", 86, 620, 118, 64],
    ["#7658e8", 702, 78, 72, 72],
    ["#58b957", 1160, 610, 90, 56],
  ];
  tiles.forEach(([color, x, y, width, height]) => {
    ctx.fillStyle = color;
    roundRect(x, y, width, height, 14);
    ctx.fill();
  });
  ctx.restore();

  ctx.strokeStyle = "rgba(39, 51, 73, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPath() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "#c8b98d";
  ctx.lineWidth = 78;
  drawPathLine();
  ctx.stroke();

  ctx.strokeStyle = "#f2dfab";
  ctx.lineWidth = 58;
  drawPathLine();
  ctx.stroke();

  ctx.strokeStyle = "rgba(97, 75, 40, 0.16)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 18]);
  drawPathLine();
  ctx.stroke();
  ctx.restore();
}

function drawPathLine() {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x, path[i].y);
  }
}

function drawPads() {
  pads.forEach((pad, index) => {
    const occupied = getTowerAtPad(index);
    const selected = state.selectedPadIndex === index;
    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.fillStyle = occupied ? "rgba(255, 255, 255, 0.64)" : "rgba(255, 255, 255, 0.42)";
    ctx.strokeStyle = selected ? "#19202a" : occupied ? towerTypes[occupied.type].color : "#ffffff";
    ctx.lineWidth = selected ? 5 : 3;
    ctx.shadowColor = occupied ? towerTypes[occupied.type].color : "#40a7e3";
    ctx.shadowBlur = selected || !occupied ? 18 : 9;
    roundRect(-32, -32, 64, 64, 12);
    ctx.fill();
    ctx.stroke();
    if (!occupied) {
      ctx.fillStyle = "rgba(25, 32, 42, 0.28)";
      ctx.fillRect(-14, -3, 28, 6);
      ctx.fillRect(-3, -14, 6, 28);
    }
    ctx.restore();
  });
}

function drawBase() {
  ctx.save();
  ctx.translate(W - 78, H / 2);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#19202a";
  ctx.lineWidth = 5;
  roundRect(-45, -62, 90, 124, 16);
  ctx.fill();
  ctx.stroke();
  const pulse = 1 + Math.sin(performance.now() / 260) * 0.06;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "#ed6fa8";
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(34, 0);
  ctx.lineTo(0, 38);
  ctx.lineTo(-34, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawTowers() {
  state.towers.forEach((tower) => {
    const def = towerTypes[tower.type];
    ctx.save();
    ctx.translate(tower.x, tower.y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(Math.sin(performance.now() / 420 + tower.x) * 0.12);
    ctx.fillStyle = def.color;
    if (tower.type === "pepper") {
      roundRect(-11, -19, 22, 38, 8);
      ctx.fill();
    } else if (tower.type === "frost") {
      drawDiamond(0, 0, 24);
    } else if (tower.type === "spark") {
      drawBoltShape(0, 0, 28);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-6, -5, 5, 0, TWO_PI);
      ctx.arc(7, 6, 4, 0, TWO_PI);
      ctx.fill();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#19202a";
    ctx.font = "800 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(tower.level), tower.x, tower.y + 50);
    ctx.restore();
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    const def = enemyTypes[enemy.type];
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = def.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = enemyTypes[enemy.type].boss ? 5 : 4;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(-enemy.radius * 0.35, -enemy.radius * 0.25, enemy.radius * 0.16, 0, TWO_PI);
    ctx.arc(enemy.radius * 0.35, -enemy.radius * 0.25, enemy.radius * 0.16, 0, TWO_PI);
    ctx.fill();

    if (enemy.shield > 0) {
      ctx.strokeStyle = "rgba(118, 88, 232, 0.75)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 8, 0, TWO_PI);
      ctx.stroke();
    }

    if (enemy.slowTimer > 0) {
      ctx.strokeStyle = "rgba(64, 167, 227, 0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 12, 0, TWO_PI);
      ctx.stroke();
    }

    const barWidth = enemy.radius * 2.4;
    ctx.fillStyle = "rgba(25, 32, 42, 0.22)";
    roundRect(-barWidth / 2, -enemy.radius - 18, barWidth, 6, 3);
    ctx.fill();
    ctx.fillStyle = "#58b957";
    roundRect(-barWidth / 2, -enemy.radius - 18, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 6, 3);
    ctx.fill();
    ctx.restore();
  });
}

function drawProjectiles() {
  state.projectiles.forEach((shot) => {
    ctx.save();
    ctx.fillStyle = shot.color;
    ctx.shadowColor = shot.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlayer() {
  const hero = heroes[state.selectedHeroKey];
  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.rotate(state.player.angle);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = hero.color;
  roundRect(11, -8, 30, 16, 7);
  ctx.fill();

  ctx.rotate(-state.player.angle);
  ctx.fillStyle = hero.color;
  ctx.beginPath();
  ctx.arc(-8, -7, 5, 0, TWO_PI);
  ctx.arc(8, -7, 5, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = hero.accent;
  ctx.beginPath();
  ctx.arc(0, 7, 7, 0, Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawEffects() {
  state.effects.forEach((effect) => {
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (effect.type === "spark") {
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 - alpha + 0.3), 0, TWO_PI);
      ctx.fill();
    }
    if (effect.type === "ring") {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 8 * alpha;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 - alpha * 0.2), 0, TWO_PI);
      ctx.stroke();
    }
    if (effect.type === "beam") {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.width * alpha;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
    }
    if (effect.type === "text") {
      ctx.fillStyle = effect.color;
      ctx.font = "800 18px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(effect.text, effect.x, effect.y);
    }
    ctx.restore();
  });
}

function drawOverlay(text) {
  ctx.save();
  ctx.fillStyle = "rgba(25, 32, 42, 0.34)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 54px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2);
  ctx.restore();
}

function drawDiamond(x, y, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawBoltShape(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size * 0.15, y - size);
  ctx.lineTo(x + size * 0.42, y - size * 0.14);
  ctx.lineTo(x + size * 0.08, y - size * 0.14);
  ctx.lineTo(x + size * 0.2, y + size);
  ctx.lineTo(x - size * 0.44, y + size * 0.04);
  ctx.lineTo(x - size * 0.08, y + size * 0.04);
  ctx.closePath();
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function addSpark(x, y, color) {
  state.effects.push({ type: "spark", x, y, color, radius: 18, life: 0.18, maxLife: 0.18 });
}

function addRing(x, y, color, radius) {
  state.effects.push({ type: "ring", x, y, color, radius, life: 0.36, maxLife: 0.36 });
}

function addBurst(x, y, color, count) {
  addRing(x, y, color, Math.min(95, count * 2.8));
  for (let i = 0; i < Math.min(count, 18); i += 1) {
    const angle = (i / count) * TWO_PI;
    state.effects.push({
      type: "spark",
      x: x + Math.cos(angle) * 16,
      y: y + Math.sin(angle) * 16,
      color,
      radius: 10 + Math.random() * 18,
      life: 0.25 + Math.random() * 0.22,
      maxLife: 0.47,
    });
  }
}

function addTextEffect(x, y, text, color) {
  state.effects.push({ type: "text", x, y, text, color, life: 0.9, maxLife: 0.9 });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToLine(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function pointAhead(point, origin, angle) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return dx * Math.cos(angle) + dy * Math.sin(angle) > 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", setupCanvas);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (key === " " || key === "e") {
    event.preventDefault();
    useHeroPower();
  }
  if (key === "1") selectTowerByIndex(0);
  if (key === "2") selectTowerByIndex(1);
  if (key === "3") selectTowerByIndex(2);
  if (key === "4") selectTowerByIndex(3);
  if (key === "escape") {
    state.selectedPadIndex = null;
    mouse.down = false;
    updateUi();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
  mouse.down = false;
});

canvas.addEventListener("pointermove", (event) => {
  const point = getCanvasPoint(event);
  mouse.x = point.x;
  mouse.y = point.y;
});
canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  handleCanvasPointer(event, true);
});
canvas.addEventListener("pointerup", () => {
  mouse.down = false;
});
canvas.addEventListener("pointerleave", () => {
  mouse.down = false;
});

ui.startWaveBtn.addEventListener("click", startWave);
ui.abilityBtn.addEventListener("click", useHeroPower);
ui.upgradeBtn.addEventListener("click", upgradeSelectedTower);
ui.pauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  updateUi();
});
ui.restartBtn.addEventListener("click", resetGame);

function selectTowerByIndex(index) {
  const tower = Object.values(towerTypes)[index];
  if (!tower) return;
  state.selectedTowerKey = tower.key;
  state.selectedPadIndex = null;
  renderCards();
  updateUi();
}

setupCanvas();
renderCards();
updateUi();
requestAnimationFrame(loop);
