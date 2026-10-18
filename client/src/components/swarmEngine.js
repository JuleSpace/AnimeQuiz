/**
 * Moteur du mode Swarm (canvas 2D).
 * — Sprites animés « Donjon Mystère » dans 8 directions (marche, attaque, tir, dégâts).
 * — Grande carte bornée (rivière, ponts, forêt, ruines) avec collisions.
 * — Esquive, recul, particules, secousses d'écran, ennemis qui chargent / crachent / se téléportent,
 *   boss avec attaques annoncées au sol.
 * Le composant React ne fait qu'afficher l'interface.
 */
import {
  BOSSES, CAST_ANIM, FOES, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, PASSIVES, RUN_SECONDS, WAVES, WEAPONS, xpToNext
} from './swarmData';
import { animLength, bodyHeight, dirOf, drawPokemon, hitTime, preloadSprites } from './swarmSprites';
import { TILE, buildWorld } from './swarmWorld';

const TAU = Math.PI * 2;
const MAX_FOES = 300;
const MAX_PARTICLES = 900;
const CELL = 48;
const SPR = 2; // échelle des sprites PMD
const DASH_CD = 2.2;
const ROCK = { name: 'Rocher fissuré', dex: 0, hp: 40, speed: 0, dmg: 0, size: 34, xp: 0, inert: true, color: '#946a4a' };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const createGame = (canvas, partner, callbacks = {}, prebuilt = null) => {
  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const stick = { active: false, ox: 0, oy: 0, x: 0, y: 0 };
  const world = prebuilt || buildWorld();

  preloadSprites([
    partner.dex, ...partner.evolutions.map((e) => e.dex),
    ...Object.values(FOES).map((f) => f.dex)
  ]);

  const g = {
    t: 0,
    paused: false,
    over: null,
    kills: 0,
    spawnAcc: 0,
    bossIdx: 0,
    pendingLevels: 0,
    rerolls: 2,
    banner: null,
    trauma: 0,
    flash: null,
    slow: 0,
    cam: { x: world.start.x, y: world.start.y },
    player: {
      x: world.start.x,
      y: world.start.y,
      hp: partner.hp,
      maxHp: partner.hp,
      speed: partner.speed,
      face: { x: 0, y: 1 },
      dir: 0,
      moving: false,
      vx: 0,
      vy: 0,
      act: null,
      inv: 0,
      dash: { cd: 0, t: 0, vx: 0, vy: 0 },
      ghosts: [],
      level: 1,
      xp: 0,
      need: xpToNext(1),
      form: { name: partner.name, dex: partner.dex },
      evolving: 0
    },
    weapons: { [partner.weapon]: { lv: 1, timer: 0.4 } },
    passives: {},
    foes: [],
    dying: [],
    shots: [],
    hazards: [],
    telegraphs: [],
    orbs: [],
    pickups: [],
    particles: [],
    decals: [],
    fx: [],
    texts: [],
    boss: null
  };

  // Rochers fissurés : des cibles fixes qui lâchent des objets.
  world.breakables.forEach((b) => g.foes.push({
    id: 'rock', def: ROCK, x: b.x, y: b.y, hp: ROCK.hp, maxHp: ROCK.hp, size: ROCK.size, inert: true, flash: 0, kx: 0, ky: 0, leafCd: 0
  }));

  const stats = () => ({
    dmg: 1 + 0.12 * (g.passives.protein || 0),
    speed: 1 + 0.08 * (g.passives.carbos || 0),
    magnet: 80 * (1 + 0.35 * (g.passives.magnet || 0)),
    cd: 1 - 0.07 * (g.passives.quickclaw || 0),
    regen: 0.6 * (g.passives.leftovers || 0),
    crit: 0.05 + 0.06 * (g.passives.scope || 0)
  });

  /* ——— Effets ——— */
  const shake = (amount) => { g.trauma = Math.min(1, g.trauma + amount); };
  const particle = (p) => { if (g.particles.length < MAX_PARTICLES) g.particles.push({ drag: 0.9, grav: 0, size: 3, ...p, max: p.life }); };
  const burst = (x, y, color, n, speed = 4, opts = {}) => {
    for (let i = 0; i < n; i += 1) {
      const a = rand(0, TAU); const v = rand(speed * 0.4, speed);
      particle({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.up || 0), life: rand(0.25, 0.55), color, size: rand(2, 4), ...opts });
    }
  };
  const smoke = (x, y, n, color = 'rgba(235,235,235,.8)', size = 10) => {
    for (let i = 0; i < n; i += 1) {
      particle({ kind: 'smoke', x: x + rand(-8, 8), y: y + rand(-8, 4), vx: rand(-1, 1), vy: rand(-1.4, -0.2), life: rand(0.35, 0.7), color, size: rand(size * 0.6, size), drag: 0.92 });
    }
  };
  const decal = (d) => { if (g.decals.length > 60) g.decals.shift(); g.decals.push({ ...d, max: d.life }); };
  const text = (x, y, txt, color = '#fff', big = false) => {
    if (g.texts.length > 80) g.texts.shift();
    g.texts.push({ x, y, txt, color, life: big ? 0.9 : 0.65, max: big ? 0.9 : 0.65, big, vx: rand(-0.6, 0.6) });
  };

  /* ——— Grille spatiale ——— */
  let grid = new Map();
  const buildGrid = () => {
    grid = new Map();
    g.foes.forEach((f) => {
      const k = `${Math.floor(f.x / CELL)},${Math.floor(f.y / CELL)}`;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(f);
    });
  };
  const near = (x, y, r) => {
    const out = [];
    const x0 = Math.floor((x - r) / CELL); const x1 = Math.floor((x + r) / CELL);
    const y0 = Math.floor((y - r) / CELL); const y1 = Math.floor((y + r) / CELL);
    for (let i = x0; i <= x1; i += 1) {
      for (let j = y0; j <= y1; j += 1) {
        const cell = grid.get(`${i},${j}`);
        if (cell) for (let k = 0; k < cell.length; k += 1) out.push(cell[k]);
      }
    }
    return out;
  };
  const nearest = (x, y, range = 2000, skip = null) => {
    let best = null;
    let bd = range * range;
    for (let i = 0; i < g.foes.length; i += 1) {
      const f = g.foes[i];
      if (f.dead || f.inert || f.hidden || (skip && skip.has(f))) continue;
      const d = (f.x - x) ** 2 + (f.y - y) ** 2;
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  };

  /* ——— Caméra / vue ——— */
  const view = () => {
    const w = canvas.clientWidth || 800; const h = canvas.clientHeight || 600;
    const zoom = clamp(Math.min(w / 1100, h / 760), 0.68, 1.35);
    return { w, h, zoom, vw: w / zoom, vh: h / zoom };
  };

  /* ——— Apparitions ——— */
  const spawnPoint = (flying, extra = 0) => {
    const { vw, vh } = view();
    const r = Math.hypot(vw, vh) / 2 + 70 + extra;
    for (let i = 0; i < 12; i += 1) {
      const a = rand(0, TAU);
      const x = g.player.x + Math.cos(a) * r; const y = g.player.y + Math.sin(a) * r;
      if (x < world.B - 40 || y < world.B - 40 || x > world.W - world.B + 40 || y > world.H - world.B + 40) continue;
      if (flying || world.walkable(x, y, false)) return { x, y };
    }
    return null;
  };
  const spawnFoe = (id, opts = {}) => {
    const def = FOES[id];
    const at = opts.at || spawnPoint(def.flying || def.boss, def.boss ? 60 : 0);
    if (!at) return null;
    const elite = !def.boss && g.t > 60 && Math.random() < 0.025;
    const grow = def.boss ? 1 : 1 + g.t / 140;
    const hp = Math.round(def.hp * grow * (elite ? 4 : 1));
    const f = {
      id,
      def,
      x: at.x,
      y: at.y,
      hp,
      maxHp: hp,
      speed: def.speed * (def.boss ? 1 : rand(0.9, 1.1)) * (elite ? 1.1 : 1),
      dmg: Math.max(2, Math.round(def.dmg * (def.boss ? 1 : 0.7 + g.t / 360) * (elite ? 1.4 : 1))),
      size: def.size * (elite ? 1.2 : 1),
      scale: (def.scale || SPR) * (elite ? 1.25 : 1),
      elite,
      dir: 0,
      flash: 0,
      leafCd: 0,
      kx: 0,
      ky: 0,
      atkCd: rand(0.4, 1.2),
      skillCd: rand(2, 4),
      shootCd: 2.5,
      state: 'chase',
      stateT: 0,
      act: null,
      phase: rand(0, TAU),
      z: def.flying ? 16 : 0,
      boss: def.boss || null,
      ...opts
    };
    g.foes.push(f);
    return f;
  };

  const spawnTick = (dt) => {
    const interval = Math.max(0.11, 0.5 - g.t / 1000);
    const batch = 1 + Math.floor(g.t / 85);
    g.spawnAcc += dt;
    const alive = g.foes.length - world.breakables.length;
    while (g.spawnAcc >= interval) {
      g.spawnAcc -= interval;
      const wave = [...WAVES].reverse().find((w) => g.t >= w.from) || WAVES[0];
      // Les ennemis arrivent par petits paquets, du même côté.
      const id = pick(wave.foes);
      const anchor = spawnPoint(FOES[id].flying);
      for (let i = 0; i < batch && alive + i < MAX_FOES && anchor; i += 1) {
        const at = { x: anchor.x + rand(-50, 50), y: anchor.y + rand(-50, 50) };
        if (FOES[id].flying || world.walkable(at.x, at.y, false)) spawnFoe(id, { at });
      }
    }
    const next = BOSSES[g.bossIdx];
    if (next && g.t >= next.at) {
      g.bossIdx += 1;
      const b = spawnFoe(next.id);
      if (b) {
        g.banner = { text: next.title, life: 3.2 };
        shake(0.6);
        smoke(b.x, b.y, 18, 'rgba(120,100,80,.8)', 22);
        if (callbacks.onBanner) callbacks.onBanner(next.title);
      } else {
        g.bossIdx -= 1; // on réessaiera à la frame suivante
      }
    }
  };

  /* ——— Dégâts ——— */
  const hurt = (f, amount, src = null, opts = {}) => {
    if (f.dead) return;
    const s = stats();
    const crit = !f.inert && Math.random() < s.crit;
    const dmg = Math.max(1, Math.round(amount * s.dmg * (crit ? 1.8 : 1)));
    f.hp -= dmg;
    f.flash = 0.1;
    // Recul (les boss et les lourds bougent à peine)
    if (src && !f.inert) {
      const k = (opts.knock ?? 3) * (f.boss ? 0.06 : f.def.heavy ? 0.4 : 1) * (f.elite ? 0.5 : 1);
      const dx = f.x - src.x; const dy = f.y - src.y;
      const d = Math.hypot(dx, dy) || 1;
      f.kx += (dx / d) * k;
      f.ky += (dy / d) * k;
    }
    if (!f.inert && !f.boss && (!f.act || f.act.anim === 'hurt') && f.state !== 'charge') f.act = { anim: 'hurt', t: 0, dur: 0.22 };
    if (opts.color) burst(f.x, f.y - 14, opts.color, crit ? 7 : 3, 3.5);
    const h = bodyHeight(f.def.dex || 19) * (f.scale || SPR) * 0.5;
    if (!opts.silent) text(f.x + rand(-6, 6), f.y - h - f.z, crit ? `${dmg}!` : String(dmg), crit ? '#ff9a3c' : f.boss ? '#ffd23a' : '#ffffff', crit);
    if (f.hp <= 0) kill(f);
  };

  const dropOrb = (x, y, v) => {
    const a = rand(0, TAU); const sp = rand(0.6, 2.2);
    g.orbs.push({ x, y, v, z: 6, vz: rand(2.5, 4.5), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
  };

  const kill = (f) => {
    f.dead = true;
    if (f.inert) {
      // Rocher fissuré : éclats + récompense
      burst(f.x, f.y - 10, '#946a4a', 14, 5, { grav: 0.35, up: 2 });
      burst(f.x, f.y - 10, '#b98c62', 8, 4, { grav: 0.35, up: 2 });
      smoke(f.x, f.y, 6, 'rgba(180,150,120,.8)');
      shake(0.12);
      const r = Math.random();
      const kind = r < 0.45 ? 'oran' : r < 0.7 ? 'magnet' : r < 0.82 ? 'candy' : 'xp';
      if (kind === 'xp') for (let i = 0; i < 8; i += 1) dropOrb(f.x, f.y, 3);
      else g.pickups.push({ x: f.x, y: f.y, kind, z: 4, vz: 4 });
      return;
    }
    g.kills += 1;
    g.dying.push({ dex: f.def.dex, x: f.x, y: f.y, z: f.z, dir: f.dir, t: 0, vx: f.kx * 0.6 + rand(-0.5, 0.5), vy: f.ky * 0.6, scale: f.scale, elite: f.elite });
    smoke(f.x, f.y - 8, f.boss ? 20 : 4, 'rgba(240,240,240,.85)', f.boss ? 26 : 9);
    burst(f.x, f.y - 12, f.def.color || '#ffffff', f.boss ? 30 : 5, f.boss ? 8 : 4);
    if (f.boss === 'final') {
      g.slow = 1.2;
      g.flash = { color: '#ffffff', life: 0.5, max: 0.5 };
      shake(1);
      g.over = 'win';
      setTimeout(() => { if (callbacks.onEnd) callbacks.onEnd('win', snapshot()); }, 900);
      return;
    }
    if (f.boss) {
      g.slow = 0.8;
      g.flash = { color: '#fff6c2', life: 0.35, max: 0.35 };
      shake(0.8);
      for (let i = 0; i < 16; i += 1) dropOrb(f.x, f.y, 3);
      g.pickups.push({ x: f.x, y: f.y, kind: 'candy', z: 4, vz: 5 });
      g.fx.push({ kind: 'ring', x: f.x, y: f.y, r: 10, max: 160, life: 0.6, color: '#ffd23a' });
      return;
    }
    if (f.elite) {
      for (let i = 0; i < 6; i += 1) dropOrb(f.x, f.y, 3);
      if (Math.random() < 0.5) g.pickups.push({ x: f.x, y: f.y, kind: 'oran', z: 4, vz: 4 });
      shake(0.15);
      return;
    }
    dropOrb(f.x, f.y, f.def.xp);
    if (Math.random() < 0.01) g.pickups.push({ x: f.x, y: f.y, kind: 'oran', z: 4, vz: 4 });
  };

  const hurtPlayer = (amount, src = null) => {
    const p = g.player;
    if (p.inv > 0 || g.over || p.dash.t > 0) return;
    p.hp -= amount;
    p.inv = 0.5;
    p.act = { anim: 'hurt', t: 0, dur: 0.25 };
    if (src) {
      const dx = p.x - src.x; const dy = p.y - src.y; const d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * 4; p.vy += (dy / d) * 4;
    }
    shake(clamp(amount / 40, 0.18, 0.5));
    g.flash = { color: '#ff2a2a', life: 0.22, max: 0.22, vignette: true };
    text(p.x, p.y - 56, `-${amount}`, '#ff5a5a', true);
    burst(p.x, p.y - 16, '#ff5a5a', 6, 3.5);
    if (p.hp <= 0) {
      p.hp = 0;
      g.over = 'lose';
      g.slow = 1;
      smoke(p.x, p.y, 12);
      setTimeout(() => { if (callbacks.onEnd) callbacks.onEnd('lose', snapshot()); }, 700);
    }
  };

  /* ——— Attaques du joueur ——— */
  const cast = (id, target) => {
    const p = g.player;
    const anim = CAST_ANIM[id] || 'shoot';
    const dur = Math.min(0.45, animLength(p.form.dex, anim) / 1.8);
    p.act = { anim, t: 0, dur, speed: 1.8 };
    if (target) p.castDir = dirOf(target.x - p.x, target.y - p.y);
  };

  const fire = (id, w) => {
    const W = WEAPONS[id];
    const v = W.at(w.lv);
    const p = g.player;
    const from = { x: p.x, y: p.y - 18 };
    if (id === 'thunder') {
      let target = nearest(p.x, p.y, v.range);
      if (!target) return 0.2;
      cast(id, target);
      const hit = new Set();
      const points = [from];
      let prev = p;
      for (let i = 0; i <= v.chains && target; i += 1) {
        hurt(target, v.dmg, prev, { knock: 2.5, color: '#fff27a' });
        hit.add(target);
        points.push({ x: target.x, y: target.y - 14 - target.z });
        g.fx.push({ kind: 'spark', x: target.x, y: target.y - 14, life: 0.18, max: 0.18, r: 18 });
        prev = target;
        target = nearest(prev.x, prev.y, 170, hit);
      }
      g.fx.push({ kind: 'bolt', points, life: 0.2, max: 0.2, color: W.color });
      g.flash = g.flash || { color: '#fff6a0', life: 0.06, max: 0.06 };
      return v.cd;
    }
    if (id === 'ember') {
      const target = nearest(p.x, p.y, 520);
      if (!target) return 0.2;
      cast(id, target);
      const base = Math.atan2(target.y - p.y, target.x - p.x);
      for (let i = 0; i < v.count; i += 1) {
        const a = base + (i - (v.count - 1) / 2) * 0.22;
        g.shots.push({ kind: 'ember', x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 8, dmg: v.dmg, blast: v.blast, life: 1.4, color: W.color });
      }
      burst(from.x, from.y, '#ffb347', 5, 3);
      return v.cd;
    }
    if (id === 'watergun') {
      const target = nearest(p.x, p.y, 420);
      if (!target) return 0.2;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      const aim = { x: Math.cos(a), y: Math.sin(a) };
      const dirs = [aim];
      if (v.back) dirs.push({ x: -aim.x, y: -aim.y });
      if (v.side) dirs.push({ x: -aim.y, y: aim.x }, { x: aim.y, y: -aim.x });
      dirs.forEach((d) => {
        g.shots.push({ kind: 'water', x: from.x, y: from.y, vx: d.x * v.speed, vy: d.y * v.speed, r: v.size, dmg: v.dmg, life: 0.75, pierce: true, hit: new Set(), color: W.color });
      });
      return v.cd;
    }
    if (id === 'quake') {
      if (!nearest(p.x, p.y, v.radius + 60)) return 0.3;
      cast(id, null);
      near(p.x, p.y, v.radius).forEach((f) => { if (f.def.ai !== 'fly' && f.def.ai !== 'ghost' && dist2(f, p) < v.radius ** 2) hurt(f, v.dmg, p, { knock: 6, color: '#c99a54' }); });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 20, max: v.radius, life: 0.4, color: '#e0b878' });
      decal({ kind: 'crack', x: p.x, y: p.y, r: v.radius * 0.8, life: 2.5, seed: Math.random() * 1000 });
      for (let i = 0; i < 18; i += 1) {
        const a = rand(0, TAU); const d = rand(10, v.radius);
        particle({ kind: 'dot', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: Math.cos(a) * 1.5, vy: -rand(2, 4), grav: 0.3, life: rand(0.4, 0.7), color: pick(['#8a6a44', '#b08a5a', '#6e5236']), size: rand(3, 5) });
      }
      smoke(p.x, p.y, 8, 'rgba(200,170,120,.7)', 16);
      shake(0.25);
      return v.cd;
    }
    if (id === 'swift') {
      if (!nearest(p.x, p.y, 600)) return 0.2;
      cast(id, nearest(p.x, p.y, 600));
      for (let i = 0; i < v.count; i += 1) {
        const a = (i / v.count) * TAU + g.t;
        g.shots.push({ kind: 'swift', x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 7, dmg: v.dmg, life: 2.2, homing: true, speed: v.speed, color: W.color, spin: 0, trail: [] });
      }
      return v.cd;
    }
    if (id === 'shadow') {
      const target = nearest(p.x, p.y, 700);
      if (!target) return 0.2;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      g.shots.push({ kind: 'shadow', x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: v.size, dmg: v.dmg, life: 3.2, pierce: true, hit: new Set(), color: W.color, spin: 0 });
      return v.cd;
    }
    return 1;
  };

  const leaves = () => {
    const w = g.weapons.leaf;
    if (!w) return [];
    const v = WEAPONS.leaf.at(w.lv);
    return Array.from({ length: v.count }, (_, i) => {
      const a = g.t * v.spin + (i / v.count) * TAU;
      return { x: g.player.x + Math.cos(a) * v.radius, y: g.player.y - 10 + Math.sin(a) * v.radius * 0.8, a, dmg: v.dmg, spin: v.spin, radius: v.radius, i, count: v.count };
    });
  };

  /* ——— Esquive ——— */
  const dash = () => {
    const p = g.player;
    if (p.dash.cd > 0 || g.paused || g.over) return;
    let dx = p.face.x; let dy = p.face.y;
    if (!p.moving) { const t = nearest(p.x, p.y, 300); if (t) { dx = p.x - t.x; dy = p.y - t.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; } }
    p.dash = { cd: DASH_CD * stats().cd, t: 0.17, vx: dx * 15, vy: dy * 15 };
    p.inv = Math.max(p.inv, 0.3);
    smoke(p.x, p.y, 6, 'rgba(255,255,255,.7)', 10);
  };

  /* ——— Montée de niveau ——— */
  const levelOptions = () => {
    const opts = [];
    const ownedW = Object.keys(g.weapons);
    const ownedP = Object.keys(g.passives);
    ownedW.forEach((id) => { if (g.weapons[id].lv < MAX_LEVEL) opts.push({ kind: 'weapon', id, lv: g.weapons[id].lv + 1 }); });
    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS).filter((id) => !g.weapons[id]).forEach((id) => opts.push({ kind: 'weapon', id, lv: 1 }));
    ownedP.forEach((id) => { if (g.passives[id] < MAX_LEVEL) opts.push({ kind: 'passive', id, lv: g.passives[id] + 1 }); });
    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES).filter((id) => !g.passives[id]).forEach((id) => opts.push({ kind: 'passive', id, lv: 1 }));
    const shuffled = opts.sort(() => Math.random() - 0.5).slice(0, 3);
    return shuffled.length ? shuffled : [{ kind: 'heal', id: 'oran', lv: 0 }];
  };

  const askLevel = () => {
    if (g.paused || !g.pendingLevels || g.over) return;
    g.paused = true;
    if (callbacks.onLevelUp) callbacks.onLevelUp(levelOptions(), g.player.level, g.rerolls);
  };

  const gainXp = (v) => {
    const p = g.player;
    p.xp += v;
    while (p.xp >= p.need) {
      p.xp -= p.need;
      p.level += 1;
      p.need = xpToNext(p.level);
      g.pendingLevels += 1;
      const evo = partner.evolutions.find((e) => e.level === p.level);
      if (evo) {
        p.form = { name: evo.name, dex: evo.dex };
        p.maxHp += evo.hp;
        p.hp = Math.min(p.maxHp, p.hp + evo.hp + 20);
        p.evolving = 0.9;
        g.banner = { text: `${partner.name} évolue en ${evo.name} !`, life: 2.6 };
        g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 10, max: 140, life: 0.7, color: '#ffffff' });
        g.flash = { color: '#ffffff', life: 0.3, max: 0.3 };
        burst(p.x, p.y - 20, '#ffffff', 24, 6);
        // l'évolution repousse tout le monde
        near(p.x, p.y, 160).forEach((f) => { if (!f.inert) hurt(f, 1, p, { knock: 9, silent: true }); });
      } else {
        g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 10, max: 70, life: 0.4, color: '#7fe0ff' });
      }
    }
    askLevel();
  };

  const choose = (opt) => {
    if (opt.kind === 'weapon') {
      if (g.weapons[opt.id]) g.weapons[opt.id].lv += 1;
      else g.weapons[opt.id] = { lv: 1, timer: 0.2 };
    } else if (opt.kind === 'passive') {
      g.passives[opt.id] = (g.passives[opt.id] || 0) + 1;
      if (opt.id === 'hpup') {
        g.player.maxHp += 25;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + 25);
      }
    } else {
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + (opt.kind === 'skip' ? 15 : 30));
    }
    g.pendingLevels = Math.max(0, g.pendingLevels - 1);
    g.paused = false;
    askLevel();
  };
  const reroll = () => {
    if (g.rerolls <= 0) return null;
    g.rerolls -= 1;
    return levelOptions();
  };

  /* ——— Attaques annoncées au sol (boss) ——— */
  const telegraph = (tg) => g.telegraphs.push({ t: 0, ...tg });
  const resolveTelegraph = (tg) => {
    const p = g.player;
    if (tg.kind === 'circle') {
      if (Math.hypot(p.x - tg.x, p.y - tg.y) < tg.r + 10) hurtPlayer(tg.dmg, tg);
      if (tg.effect === 'rock') {
        burst(tg.x, tg.y, '#8a7a66', 12, 5, { grav: 0.35, up: 2 });
        smoke(tg.x, tg.y, 5, 'rgba(160,140,110,.8)', 14);
        decal({ kind: 'crack', x: tg.x, y: tg.y, r: tg.r, life: 2, seed: Math.random() * 1000 });
        shake(0.12);
      }
    } else if (tg.kind === 'line') {
      const ex = tg.x + Math.cos(tg.ang) * tg.len; const ey = tg.y + Math.sin(tg.ang) * tg.len;
      const dx = ex - tg.x; const dy = ey - tg.y; const l2 = dx * dx + dy * dy;
      const k = clamp(((p.x - tg.x) * dx + (p.y - tg.y) * dy) / l2, 0, 1);
      if (Math.hypot(p.x - (tg.x + dx * k), p.y - (tg.y + dy * k)) < tg.w + 12) hurtPlayer(tg.dmg, { x: tg.x, y: tg.y });
      g.fx.push({ kind: 'beam', x: tg.x, y: tg.y, ang: tg.ang, len: tg.len, w: tg.w, life: 0.25, max: 0.25 });
      shake(0.15);
    }
  };

  /* ——— IA des ennemis ——— */
  const bridgeTarget = (f) => {
    let best = null; let bd = Infinity;
    world.bridges.forEach((b) => { const d = (b.x - f.x) ** 2 + (b.y - f.y) ** 2; if (d < bd) { bd = d; best = b; } });
    return best;
  };

  const updateFoe = (f, dt, p) => {
    const def = f.def;
    const flying = def.flying;
    let tx = p.x; let ty = p.y;
    if (!flying && world.tileAt(f.x, f.y) !== TILE.BRIDGE && world.sideOf(f.x, f.y) !== world.sideOf(p.x, p.y)) {
      const b = bridgeTarget(f);
      if (b) { tx = b.x; ty = b.y; }
    }
    const dx = p.x - f.x; const dy = p.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    let mx = tx - f.x; let my = ty - f.y;
    const md = Math.hypot(mx, my) || 1;
    mx /= md; my /= md;
    let sp = f.speed;
    f.stateT += dt;
    f.atkCd -= dt;
    f.skillCd -= dt;
    const reach = f.size * 0.45 + 20;

    // Comportements spéciaux
    if (def.ai === 'charge') {
      if (f.state === 'chase' && f.skillCd <= 0 && d < 250 && d > 70) { f.state = 'windup'; f.stateT = 0; f.cdir = { x: dx / d, y: dy / d }; }
      if (f.state === 'windup') { sp = 0; f.dir = dirOf(dx, dy); if (f.stateT > 0.45) { f.state = 'charge'; f.stateT = 0; f.act = { anim: 'attack', t: 0, dur: 0.45 }; } }
      if (f.state === 'charge') {
        mx = f.cdir.x; my = f.cdir.y; sp = f.speed * 4.4;
        if (Math.random() < 0.5) particle({ kind: 'smoke', x: f.x, y: f.y, vx: 0, vy: -0.3, life: 0.35, color: 'rgba(220,210,190,.6)', size: 8 });
        if (d < reach + 6) hurtPlayer(Math.round(f.dmg * 1.3), f);
        if (f.stateT > 0.45) { f.state = 'rest'; f.stateT = 0; }
      }
      if (f.state === 'rest') { sp *= 0.3; if (f.stateT > 0.4) { f.state = 'chase'; f.skillCd = rand(2.6, 4); } }
    } else if (def.ai === 'fly') {
      const w = Math.sin(g.t * 3 + f.phase) * 0.8;
      mx += -my * w; my += mx * w;
      f.z = 18 + Math.sin(g.t * 5 + f.phase) * 5;
    } else if (def.ai === 'spit') {
      if (f.skillCd <= 0 && d < 320 && d > 90) {
        f.skillCd = rand(3, 4.2);
        f.act = { anim: 'shoot', t: 0, dur: Math.min(0.7, animLength(def.dex, 'shoot')) };
        f.pendingShot = hitTime(def.dex, 'shoot') || 0.3;
      }
      if (f.pendingShot !== undefined) {
        sp *= 0.2;
        f.pendingShot -= dt;
        if (f.pendingShot <= 0) {
          f.pendingShot = undefined;
          const a = Math.atan2(dy, dx);
          g.hazards.push({ kind: 'poison', x: f.x, y: f.y - 14, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 3.4, r: 8, dmg: Math.round(f.dmg * 0.9), life: 2.6 });
        }
      }
    } else if (def.ai === 'ghost') {
      f.z = 10 + Math.sin(g.t * 3 + f.phase) * 4;
      if (def.blink && f.skillCd <= 0 && d > 220) {
        f.skillCd = rand(4.5, 6.5);
        smoke(f.x, f.y - 10, 6, 'rgba(120,80,170,.7)');
        const a = rand(0, TAU);
        f.x = p.x + Math.cos(a) * 150; f.y = p.y + Math.sin(a) * 150;
        smoke(f.x, f.y - 10, 6, 'rgba(120,80,170,.7)');
        f.fade = 0.4;
      }
    } else if (def.ai === 'onix') {
      if (f.skillCd <= 0) {
        f.skillCd = 5.5;
        f.act = { anim: 'attack', t: 0, dur: animLength(def.dex, 'attack') };
        shake(0.2);
        for (let i = 0; i < 6; i += 1) {
          const a = rand(0, TAU); const r = i === 0 ? 0 : rand(60, 180);
          telegraph({ kind: 'circle', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, r: 46, max: 1 + i * 0.08, dmg: 20, effect: 'rock' });
        }
      }
    } else if (def.ai === 'snorlax') {
      if (f.state === 'chase' && f.skillCd <= 0) { f.state = 'windup'; f.stateT = 0; }
      if (f.state === 'windup') {
        sp = 0;
        if (f.stateT > 0.5) {
          f.state = 'jump'; f.stateT = 0;
          f.jump = { x0: f.x, y0: f.y, x1: p.x, y1: p.y };
          telegraph({ kind: 'circle', x: p.x, y: p.y, r: 130, max: 0.95, dmg: 30 });
        }
      }
      if (f.state === 'jump') {
        const k = Math.min(1, f.stateT / 0.95);
        f.x = f.jump.x0 + (f.jump.x1 - f.jump.x0) * k;
        f.y = f.jump.y0 + (f.jump.y1 - f.jump.y0) * k;
        f.z = Math.sin(k * Math.PI) * 220;
        if (k >= 1) {
          f.z = 0; f.state = 'chase'; f.skillCd = rand(5.5, 7);
          shake(0.7);
          g.fx.push({ kind: 'ring', x: f.x, y: f.y, r: 20, max: 170, life: 0.45, color: '#e8d9b0' });
          decal({ kind: 'crack', x: f.x, y: f.y, r: 120, life: 3, seed: Math.random() * 1000 });
          smoke(f.x, f.y, 16, 'rgba(210,190,150,.8)', 22);
          near(f.x, f.y, 160).forEach((o) => { if (o !== f && !o.inert) { o.kx += (o.x - f.x) / 20; o.ky += (o.y - f.y) / 20; } });
        }
        return; // pas de déplacement normal pendant le saut
      }
    } else if (def.ai === 'mewtwo') {
      // Garde ses distances, tire en étoile, lance des Psykoud'Boul en ligne et se téléporte.
      if (d < 240) { mx = -dx / d; my = -dy / d; sp *= 0.8; } else if (d < 320) { mx = -dy / d; my = dx / d; }
      f.z = 20 + Math.sin(g.t * 2) * 6;
      f.shootCd -= dt;
      if (f.shootCd <= 0) {
        f.shootCd = 2.3;
        f.act = { anim: 'shoot', t: 0, dur: 0.6 };
        const n = 12;
        for (let i = 0; i < n; i += 1) {
          const a = (i / n) * TAU + g.t;
          g.hazards.push({ kind: 'psy', x: f.x, y: f.y - 30, vx: Math.cos(a) * 3.1, vy: Math.sin(a) * 3.1, r: 10, dmg: 16, life: 4 });
        }
      }
      if (f.skillCd <= 0) {
        f.skillCd = 7;
        const base = Math.atan2(dy, dx);
        [-0.42, 0, 0.42].forEach((o) => telegraph({ kind: 'line', x: f.x, y: f.y, ang: base + o, len: 900, w: 22, max: 0.95, dmg: 24 }));
      }
      if (f.state !== 'tp' && f.stateT > 9) {
        f.stateT = 0;
        smoke(f.x, f.y - 20, 12, 'rgba(200,120,220,.7)', 18);
        const a = rand(0, TAU);
        f.x = clamp(p.x + Math.cos(a) * 280, world.B, world.W - world.B);
        f.y = clamp(p.y + Math.sin(a) * 280, world.B, world.H - world.B);
        smoke(f.x, f.y - 20, 12, 'rgba(200,120,220,.7)', 18);
      }
    }

    // Attaque au corps à corps : vraie animation, les dégâts tombent sur l'image d'impact.
    if (f.state === 'chase' && !f.melee && f.atkCd <= 0 && d < reach + 8 && def.ai !== 'mewtwo') {
      f.melee = { t: 0, hit: hitTime(def.dex, 'attack'), done: false };
      f.act = { anim: 'attack', t: 0, dur: animLength(def.dex, 'attack') };
      f.atkCd = f.boss ? 1.4 : 1.15;
    }
    if (f.melee) {
      sp *= 0.25;
      f.melee.t += dt;
      if (!f.melee.done && f.melee.t >= f.melee.hit) {
        f.melee.done = true;
        if (d < reach + 18) hurtPlayer(f.dmg, f);
      }
      if (f.melee.t >= Math.max(f.melee.hit + 0.1, f.act ? f.act.dur : 0)) f.melee = null;
    }

    // Séparation : la horde ne s'empile pas.
    let sx = 0; let sy = 0;
    const others = near(f.x, f.y, f.size);
    for (let i = 0; i < others.length && i < 14; i += 1) {
      const o = others[i];
      if (o === f) continue;
      const ox = f.x - o.x; const oy = f.y - o.y;
      const od = Math.hypot(ox, oy);
      const min = (f.size + o.size) * 0.42;
      if (od > 0 && od < min) {
        const push = ((min - od) / min) * (o.boss && !f.boss ? 2.4 : 1.2);
        sx += (ox / od) * push; sy += (oy / od) * push;
      }
    }
    const vx = (mx * sp + sx + f.kx) * 60 * dt;
    const vy = (my * sp + sy + f.ky) * 60 * dt;
    f.kx *= Math.pow(0.82, dt * 60);
    f.ky *= Math.pow(0.82, dt * 60);
    if (flying || f.boss === 'final') { f.x += vx; f.y += vy; world.move(f, 0, 0, f.size * 0.4, true); } else world.move(f, vx, vy, f.size * 0.4, false);
    if (f.state !== 'windup' && !f.melee && f.state !== 'charge') f.dir = dirOf(f.boss ? dx : (mx * sp + f.kx * 0.2), f.boss ? dy : (my * sp + f.ky * 0.2));
    else if (f.melee) f.dir = dirOf(dx, dy);
    f.moving = sp > 0.05;

    // Contact passif léger (ceux qui collent au joueur sans attaquer)
    if (d < f.size * 0.3 + 10 && !f.melee) hurtPlayer(Math.max(1, Math.round(f.dmg * 0.5)), f);

    // Trop loin derrière : on le replace devant.
    if (!f.boss && d > 1500) {
      const at = spawnPoint(flying);
      if (at) { f.x = at.x; f.y = at.y; }
    }
  };

  /* ——— Boucle ——— */
  const update = (rawDt) => {
    if (g.paused) return;
    const p = g.player;
    if (g.over) {
      // On laisse vivre les effets pendant la fin de partie.
      const dt = rawDt * 0.35;
      tickEffects(dt);
      return;
    }
    if (g.slow > 0) g.slow -= rawDt;
    const dt = g.slow > 0 ? rawDt * 0.3 : rawDt;
    g.t += dt;
    const s = stats();

    // Déplacement
    let mx = 0; let my = 0;
    if (keys.has('left')) mx -= 1;
    if (keys.has('right')) mx += 1;
    if (keys.has('up')) my -= 1;
    if (keys.has('down')) my += 1;
    if (stick.active) {
      const dx = stick.x - stick.ox; const dy = stick.y - stick.oy;
      const len = Math.hypot(dx, dy);
      if (len > 8) { mx = dx / Math.max(len, 50); my = dy / Math.max(len, 50); }
    }
    const len = Math.hypot(mx, my);
    p.moving = len > 0;
    let dx = 0; let dy = 0;
    if (p.dash.t > 0) {
      p.dash.t -= dt;
      dx = p.dash.vx * 60 * dt; dy = p.dash.vy * 60 * dt;
      p.ghosts.push({ x: p.x, y: p.y, dir: p.dir, life: 0.25 });
    } else if (len > 0) {
      const k = Math.min(1, len) / len;
      dx = mx * k * p.speed * 0.8 * s.speed * 60 * dt;
      dy = my * k * p.speed * 0.8 * s.speed * 60 * dt;
      p.face = { x: mx / len, y: my / len };
      p.dir = dirOf(mx, my);
      if (Math.random() < 0.12) particle({ kind: 'smoke', x: p.x + rand(-6, 6), y: p.y + 2, vx: -mx * 0.4, vy: -0.3, life: 0.3, color: 'rgba(230,220,200,.55)', size: 5 });
    }
    dx += p.vx * 60 * dt; dy += p.vy * 60 * dt;
    p.vx *= Math.pow(0.8, dt * 60); p.vy *= Math.pow(0.8, dt * 60);
    world.move(p, dx, dy, 14, false);
    p.dash.cd = Math.max(0, p.dash.cd - dt);
    p.inv = Math.max(0, p.inv - dt);
    p.evolving = Math.max(0, p.evolving - dt);
    if (p.act) { p.act.t += dt; if (p.act.t >= p.act.dur) { p.act = null; p.castDir = null; } }
    if (s.regen) p.hp = Math.min(p.maxHp, p.hp + s.regen * dt);

    spawnTick(dt);
    buildGrid();

    // Ennemis
    for (let i = 0; i < g.foes.length; i += 1) {
      const f = g.foes[i];
      if (f.dead) continue;
      f.flash = Math.max(0, f.flash - dt);
      f.leafCd = Math.max(0, f.leafCd - dt);
      if (f.inert) continue;
      if (f.fade) f.fade = Math.max(0, f.fade - dt);
      if (f.act) { f.act.t += dt; if (f.act.t >= f.act.dur) f.act = null; }
      updateFoe(f, dt, p);
    }
    if (g.foes.some((f) => f.dead)) g.foes = g.foes.filter((f) => !f.dead);
    g.boss = g.foes.find((f) => f.boss) || null;

    // Attaques
    Object.entries(g.weapons).forEach(([id, w]) => {
      if (id === 'leaf') return;
      w.timer -= dt;
      if (w.timer <= 0) w.timer = fire(id, w) * s.cd;
    });
    leaves().forEach((leaf) => {
      near(leaf.x, leaf.y, 40).forEach((f) => {
        if (f.leafCd > 0 || dist2(f, leaf) > (f.size * 0.45 + 14) ** 2) return;
        f.leafCd = 0.35;
        hurt(f, leaf.dmg, g.player, { knock: 3.5, color: '#9be06a' });
        g.fx.push({ kind: 'slash', x: f.x, y: f.y - 14, a: leaf.a + Math.PI / 2, life: 0.15, max: 0.15 });
      });
    });

    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.homing) {
        if (!sh.target || sh.target.dead) sh.target = nearest(sh.x, sh.y, 600);
        if (sh.target) {
          const a = Math.atan2(sh.target.y - 14 - sh.y, sh.target.x - sh.x);
          const cur = Math.atan2(sh.vy, sh.vx);
          let diff = a - cur;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          const na = cur + clamp(diff, -0.2, 0.2);
          sh.vx = Math.cos(na) * sh.speed; sh.vy = Math.sin(na) * sh.speed;
        }
      }
      if (sh.trail) { sh.trail.push({ x: sh.x, y: sh.y }); if (sh.trail.length > 6) sh.trail.shift(); }
      if (sh.spin !== undefined) sh.spin += dt * 12;
      sh.x += sh.vx * 60 * dt;
      sh.y += sh.vy * 60 * dt;
      sh.life -= dt;
      if (sh.kind === 'ember' && Math.random() < 0.8) particle({ kind: 'dot', x: sh.x + rand(-3, 3), y: sh.y + rand(-3, 3), vx: -sh.vx * 0.1, vy: -rand(0.3, 1), life: rand(0.2, 0.4), color: pick(['#ffdd57', '#ff9a3c', '#ff5a1f']), size: rand(2, 4) });
      if (sh.kind === 'water' && Math.random() < 0.6) particle({ kind: 'dot', x: sh.x, y: sh.y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 0.25, color: pick(['#bfe3ff', '#6390f0']), size: 2 });
      if (sh.kind === 'shadow' && Math.random() < 0.7) particle({ kind: 'smoke', x: sh.x + rand(-sh.r, sh.r) * 0.6, y: sh.y + rand(-sh.r, sh.r) * 0.6, vx: 0, vy: -0.4, life: 0.4, color: 'rgba(90,50,140,.55)', size: sh.r * 0.6 });
      const sy = sh.y + 14; // les projectiles volent à hauteur de corps
      near(sh.x, sy, sh.r + 50).some((f) => {
        if (f.dead || (f.x - sh.x) ** 2 + (f.y - sy) ** 2 > (f.size * 0.45 + sh.r) ** 2) return false;
        if (sh.pierce) {
          if (sh.hit.has(f)) return false;
          sh.hit.add(f);
          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: sh.kind === 'shadow' ? 5 : 3, color: sh.kind === 'water' ? '#bfe3ff' : '#b48cff' });
          if (sh.kind === 'water') burst(f.x, f.y - 14, '#9fd0ff', 4, 3);
          return false;
        }
        if (sh.kind === 'ember') {
          near(sh.x, sy, sh.blast + 50).forEach((o) => { if ((o.x - sh.x) ** 2 + (o.y - sy) ** 2 < (sh.blast + o.size * 0.4) ** 2) hurt(o, sh.dmg, { x: sh.x, y: sy }, { knock: 4.5 }); });
          g.fx.push({ kind: 'blast', x: sh.x, y: sh.y, r: sh.blast, life: 0.28, max: 0.28 });
          for (let i = 0; i < 12; i += 1) {
            const a = rand(0, TAU); const v = rand(2, 5);
            particle({ kind: 'dot', x: sh.x, y: sh.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: rand(0.25, 0.5), color: pick(['#fff1a8', '#ffb347', '#ff6a1f']), size: rand(2, 5) });
          }
          smoke(sh.x, sh.y, 3, 'rgba(90,80,80,.55)', 12);
          decal({ kind: 'scorch', x: sh.x, y: sy, r: sh.blast * 0.7, life: 2.5 });
          shake(0.04);
        } else {
          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: 2.5, color: '#fff3a0' });
          burst(sh.x, sh.y, '#fff3a0', 5, 3);
        }
        sh.life = 0;
        return true;
      });
    });
    g.shots = g.shots.filter((sh) => sh.life > 0);

    // Tirs ennemis
    g.hazards.forEach((h) => {
      h.x += h.vx * 60 * dt;
      h.y += h.vy * 60 * dt;
      h.life -= dt;
      if (Math.random() < 0.3) particle({ kind: 'dot', x: h.x, y: h.y, vx: 0, vy: 0, life: 0.25, color: h.kind === 'poison' ? '#c27adf' : '#f29ce8', size: 2 });
      if ((h.x - p.x) ** 2 + (h.y - (p.y - 14)) ** 2 < (h.r + 12) ** 2) { hurtPlayer(h.dmg, h); h.life = 0; burst(h.x, h.y, h.kind === 'poison' ? '#c27adf' : '#f29ce8', 6, 3); }
    });
    g.hazards = g.hazards.filter((h) => h.life > 0);

    // Attaques annoncées
    g.telegraphs.forEach((tg) => { tg.t += dt; if (tg.t >= tg.max && !tg.done) { tg.done = true; resolveTelegraph(tg); } });
    g.telegraphs = g.telegraphs.filter((tg) => !tg.done);

    // XP (bonbons) et objets
    g.orbs.forEach((o) => {
      if (o.vz !== undefined) {
        o.z += o.vz; o.vz -= 0.45 * 60 * dt;
        o.x += o.vx * 60 * dt; o.y += o.vy * 60 * dt;
        o.vx *= 0.92; o.vy *= 0.92;
        if (o.z <= 0) { o.z = 0; o.vz = Math.abs(o.vz) > 2 ? -o.vz * 0.35 : undefined; }
      }
      const d = Math.sqrt(dist2(o, p));
      if (d < s.magnet || o.pulled) {
        o.pulled = true;
        o.pull = (o.pull || 4) + 40 * dt;
        const k = Math.min(1, (o.pull * 60 * dt) / Math.max(d, 1));
        o.x += (p.x - o.x) * k;
        o.y += (p.y - 10 - o.y) * k;
      }
      if (d < 20) {
        o.got = true;
        gainXp(o.v);
        particle({ kind: 'dot', x: p.x + rand(-8, 8), y: p.y - 20, vx: 0, vy: -1.5, life: 0.25, color: o.v >= 10 ? '#ff7ab0' : o.v >= 3 ? '#7fe08a' : '#7fc8ff', size: 3 });
      }
    });
    g.orbs = g.orbs.filter((o) => !o.got);
    if (g.orbs.length > 420) {
      const extra = g.orbs.splice(0, g.orbs.length - 320);
      g.orbs.push({ x: extra[0].x, y: extra[0].y, v: extra.reduce((a, o) => a + o.v, 0), z: 0 });
    }
    g.pickups.forEach((b) => {
      if (b.vz !== undefined) { b.z += b.vz; b.vz -= 0.4 * 60 * dt; if (b.z <= 0) { b.z = 0; b.vz = undefined; } }
      if (dist2(b, p) < 32 ** 2) {
        b.got = true;
        if (b.kind === 'oran') {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          text(p.x, p.y - 56, '+30 PV', '#6bd17a', true);
          burst(p.x, p.y - 20, '#6bd17a', 10, 3, { up: 1.5 });
        } else if (b.kind === 'magnet') {
          g.orbs.forEach((o) => { o.pulled = true; });
          text(p.x, p.y - 56, 'Aimant !', '#c0c6d6', true);
          g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 300, max: 20, life: 0.4, color: '#c0c6d6' });
        } else {
          gainXp(p.need - p.xp);
          text(p.x, p.y - 56, 'Super Bonbon !', '#ffd23a', true);
        }
      }
    });
    g.pickups = g.pickups.filter((b) => !b.got);

    tickEffects(dt);
    if (g.banner) { g.banner.life -= dt; if (g.banner.life <= 0) g.banner = null; }
  };

  const tickEffects = (dt) => {
    const f60 = dt * 60;
    g.particles.forEach((q) => {
      q.x += q.vx * f60; q.y += q.vy * f60;
      q.vy += q.grav * f60;
      q.vx *= Math.pow(q.drag, f60); q.vy *= Math.pow(q.drag, f60);
      q.life -= dt;
    });
    g.particles = g.particles.filter((q) => q.life > 0);
    g.dying.forEach((d) => { d.t += dt; d.x += d.vx * f60; d.y += d.vy * f60; d.vx *= 0.9; d.vy *= 0.9; });
    g.dying = g.dying.filter((d) => d.t < 0.35);
    g.player.ghosts.forEach((gh) => { gh.life -= dt; });
    g.player.ghosts = g.player.ghosts.filter((gh) => gh.life > 0);
    g.fx.forEach((f) => { f.life -= dt; });
    g.fx = g.fx.filter((f) => f.life > 0);
    g.decals.forEach((d) => { d.life -= dt; });
    g.decals = g.decals.filter((d) => d.life > 0);
    g.texts.forEach((tx) => { tx.life -= dt; tx.y -= 26 * dt; tx.x += tx.vx; });
    g.texts = g.texts.filter((tx) => tx.life > 0);
    g.trauma = Math.max(0, g.trauma - dt * 1.6);
    if (g.flash) { g.flash.life -= dt; if (g.flash.life <= 0) g.flash = null; }
  };

  /* ——— Dessin ——— */
  const shadow = (x, y, w, alpha = 0.28) => {
    ctx.fillStyle = `rgba(10,30,10,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.36, 0, 0, TAU);
    ctx.fill();
  };

  const drawFoe = (f) => {
    const def = f.def;
    if (f.inert) {
      const spr = world.crackedRock;
      const wob = f.flash > 0 ? rand(-2, 2) : 0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, Math.round(f.x - spr.width + wob), Math.round(f.y - spr.height * 2 + 8), spr.width * 2, spr.height * 2);
      if (f.hp < f.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(f.x - 16, f.y - 46, 32, 4);
        ctx.fillStyle = '#e0b878'; ctx.fillRect(f.x - 16, f.y - 46, 32 * Math.max(0, f.hp / f.maxHp), 4);
      }
      return;
    }
    let anim = 'walk';
    let at = g.t * (0.6 + f.speed * 0.35) + f.phase;
    let loop = true;
    if (f.act) { anim = f.act.anim; at = f.act.t; loop = false; }
    else if (f.state === 'windup' || !f.moving) anim = 'idle';
    let alpha = 1;
    if (def.ai === 'ghost') alpha = 0.72 + Math.sin(g.t * 6 + f.phase) * 0.12;
    if (f.fade) alpha *= 1 - f.fade / 0.4;
    const jitter = f.state === 'windup' ? rand(-2, 2) : 0;
    if (f.elite) {
      ctx.save();
      ctx.filter = 'hue-rotate(150deg) saturate(1.6) brightness(1.1)';
    }
    const ok = drawPokemon(ctx, def.dex, anim, at, f.dir, f.x + jitter, f.y, f.scale, { loop, white: f.flash > 0, alpha, z: f.z });
    if (f.elite) {
      ctx.restore();
      if (Math.random() < 0.15) particle({ kind: 'star', x: f.x + rand(-14, 14), y: f.y - 30 - f.z + rand(-14, 14), vx: 0, vy: -0.5, life: 0.5, color: '#fff6a0', size: 4 });
    }
    if (!ok) { ctx.fillStyle = def.color || '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y - 14 - f.z, f.size * 0.3, 0, TAU); ctx.fill(); }
    // « ! » quand il va charger
    if (f.state === 'windup') {
      const h = bodyHeight(def.dex) * f.scale * 0.55 + f.z;
      ctx.font = '900 18px "Barlow Condensed", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText('!', f.x, f.y - h);
      ctx.fillStyle = '#ff4a3a'; ctx.fillText('!', f.x, f.y - h);
    }
    if (!f.boss && f.hp < f.maxHp) {
      const h = bodyHeight(def.dex) * f.scale * 0.5 + f.z + 4;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(f.x - 14, f.y - h, 28, 4);
      ctx.fillStyle = f.elite ? '#ffd23a' : '#ff5a5a'; ctx.fillRect(f.x - 14, f.y - h, 28 * Math.max(0, f.hp / f.maxHp), 4);
    }
  };

  const drawPlayer = () => {
    const p = g.player;
    ctx.save();
    p.ghosts.forEach((gh) => drawPokemon(ctx, p.form.dex, 'walk', 0.1, gh.dir, gh.x, gh.y, SPR, { alpha: gh.life * 1.6, white: true }));
    ctx.restore();
    const blink = p.inv > 0 && p.dash.t <= 0 && Math.floor(p.inv * 20) % 2 === 0;
    let anim = p.moving ? 'walk' : 'idle';
    let at = g.t * (p.moving ? 1.3 : 1);
    let loop = true;
    let dir = p.dir;
    if (p.act) { anim = p.act.anim; at = p.act.t * (p.act.speed || 1); loop = false; if (p.castDir !== null && p.castDir !== undefined) dir = p.castDir; }
    if (p.dash.t > 0) { anim = 'walk'; at = 0.1; }
    const ok = drawPokemon(ctx, p.form.dex, anim, at, dir, p.x, p.y, SPR, { loop, alpha: blink ? 0.4 : 1, white: p.evolving > 0 && Math.floor(p.evolving * 12) % 2 === 0 });
    if (!ok) { ctx.fillStyle = partner.color; ctx.beginPath(); ctx.arc(p.x, p.y - 16, 14, 0, TAU); ctx.fill(); }
  };

  const drawLeaf = (x, y, a, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(a * 3);
    ctx.fillStyle = '#2f6e1a'; ctx.fillRect(-11, -4, 22, 8);
    ctx.fillStyle = '#6fd04a'; ctx.fillRect(-10, -3, 20, 6);
    ctx.fillStyle = '#b8f08a'; ctx.fillRect(-8, -1, 16, 2);
    ctx.restore();
  };

  const crackPath = (d) => {
    let s = d.seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    ctx.beginPath();
    for (let k = 0; k < 7; k += 1) {
      let a = (k / 7) * TAU + rnd() * 0.5;
      let x = d.x; let y = d.y;
      ctx.moveTo(x, y);
      const steps = 4;
      for (let i = 0; i < steps; i += 1) {
        a += rnd() * 0.8 - 0.4;
        const l = (d.r / steps) * (0.6 + rnd() * 0.6);
        x += Math.cos(a) * l; y += Math.sin(a) * l * 0.7;
        ctx.lineTo(x, y);
      }
    }
  };

  const render = () => {
    const { w, h, zoom, vw, vh } = view();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const p = g.player;
    // Caméra : suit le joueur avec un peu d'avance, reste dans la carte.
    const lx = p.x + p.face.x * (p.moving ? 40 : 0);
    const ly = p.y + p.face.y * (p.moving ? 30 : 0);
    g.cam.x += (lx - g.cam.x) * 0.12;
    g.cam.y += (ly - g.cam.y) * 0.12;
    const camX = clamp(g.cam.x, vw / 2, world.W - vw / 2);
    const camY = clamp(g.cam.y, vh / 2, world.H - vh / 2);
    const tr = g.trauma * g.trauma;
    const shx = tr * 16 * Math.sin(performance.now() / 23);
    const shy = tr * 16 * Math.cos(performance.now() / 29);
    const vx0 = camX - vw / 2; const vy0 = camY - vh / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-vx0 + shx, -vy0 + shy);

    world.drawGround(ctx, vx0 - 40, vy0 - 40, vw + 80, vh + 80);

    // Reflets qui scintillent sur l'eau
    world.glints.forEach((gl) => {
      if (gl.x < vx0 - 20 || gl.x > vx0 + vw + 20 || gl.y < vy0 - 20 || gl.y > vy0 + vh + 20) return;
      const a = Math.sin(g.t * 2.2 + gl.p);
      if (a < 0.3) return;
      ctx.fillStyle = `rgba(230,248,255,${(a - 0.3) * 0.9})`;
      ctx.fillRect(Math.round(gl.x + Math.sin(g.t + gl.p) * 6), Math.round(gl.y), 10, 2);
    });

    // Marques au sol
    g.decals.forEach((d) => {
      const a = Math.min(1, d.life / (d.max * 0.4));
      if (d.kind === 'scorch') {
        ctx.fillStyle = `rgba(40,25,15,${0.35 * a})`;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.55, 0, 0, TAU); ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(60,40,20,${0.55 * a})`;
        ctx.lineWidth = 3;
        crackPath(d); ctx.stroke();
      }
    });

    // Attaques annoncées : cercle qui se remplit (esquive !)
    g.telegraphs.forEach((tg) => {
      const k = Math.min(1, tg.t / tg.max);
      if (tg.kind === 'circle') {
        ctx.fillStyle = 'rgba(255,60,40,.16)';
        ctx.beginPath(); ctx.ellipse(tg.x, tg.y, tg.r, tg.r * 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,90,40,.32)';
        ctx.beginPath(); ctx.ellipse(tg.x, tg.y, tg.r * k, tg.r * 0.7 * k, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(tg.x, tg.y, tg.r, tg.r * 0.7, 0, 0, TAU); ctx.stroke();
        if (tg.effect === 'rock' && k > 0.55) {
          // le rocher tombe du ciel
          const fall = (1 - (k - 0.55) / 0.45) * 260;
          ctx.fillStyle = '#6f6458';
          ctx.beginPath(); ctx.ellipse(tg.x, tg.y - fall - 12, 16, 13, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#9a8d7c';
          ctx.beginPath(); ctx.ellipse(tg.x - 3, tg.y - fall - 15, 9, 7, 0, 0, TAU); ctx.fill();
        }
      } else {
        ctx.save();
        ctx.translate(tg.x, tg.y); ctx.rotate(tg.ang);
        ctx.fillStyle = 'rgba(200,80,255,.14)'; ctx.fillRect(0, -tg.w, tg.len, tg.w * 2);
        ctx.fillStyle = 'rgba(220,110,255,.32)'; ctx.fillRect(0, -tg.w * k, tg.len, tg.w * 2 * k);
        ctx.strokeStyle = '#d27aff'; ctx.lineWidth = 2; ctx.strokeRect(0, -tg.w, tg.len, tg.w * 2);
        ctx.restore();
      }
    });

    // Bonbons d'XP et objets
    g.orbs.forEach((o) => {
      if (o.x < vx0 - 20 || o.x > vx0 + vw + 20 || o.y < vy0 - 20 || o.y > vy0 + vh + 20) return;
      const big = o.v >= 10; const mid = o.v >= 3;
      const col = big ? '#ff5a9a' : mid ? '#3fcf6a' : '#4fa8ff';
      const s = big ? 7 : mid ? 6 : 5;
      const y = o.y - (o.z || 0) + Math.sin(g.t * 5 + o.x) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(Math.round(o.x - s / 2), Math.round(o.y + 2), s, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(o.x - s - 2), Math.round(y - 2), 3, 4); ctx.fillRect(Math.round(o.x + s - 1), Math.round(y - 2), 3, 4);
      ctx.fillStyle = col; ctx.fillRect(Math.round(o.x - s / 2 - 1), Math.round(y - s / 2), s + 2, s);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(Math.round(o.x - s / 2), Math.round(y - s / 2 + 1), 2, 2);
    });
    g.pickups.forEach((b) => {
      const y = b.y - (b.z || 0) + Math.sin(g.t * 4) * 2 - 6;
      shadow(b.x, b.y + 2, 9, 0.25);
      if (b.kind === 'oran') {
        ctx.fillStyle = '#21407a'; ctx.fillRect(b.x - 9, y - 7, 18, 16);
        ctx.fillStyle = '#3d7bdb'; ctx.fillRect(b.x - 8, y - 6, 16, 14);
        ctx.fillStyle = '#9cc4ff'; ctx.fillRect(b.x - 5, y - 4, 4, 3);
        ctx.fillStyle = '#4caf50'; ctx.fillRect(b.x, y - 12, 8, 5);
      } else if (b.kind === 'magnet') {
        ctx.fillStyle = '#d23a3a'; ctx.fillRect(b.x - 9, y - 8, 6, 14); ctx.fillRect(b.x - 9, y - 8, 18, 6);
        ctx.fillStyle = '#3a6ad2'; ctx.fillRect(b.x + 3, y - 8, 6, 14);
        ctx.fillStyle = '#e8e8f0'; ctx.fillRect(b.x - 9, y + 4, 6, 3); ctx.fillRect(b.x + 3, y + 4, 6, 3);
      } else {
        ctx.fillStyle = '#4b2fa6'; ctx.fillRect(b.x - 11, y - 7, 22, 14);
        ctx.fillStyle = '#7b5bd6'; ctx.fillRect(b.x - 10, y - 6, 20, 12);
        ctx.fillStyle = '#ffd23a'; ctx.fillRect(b.x - 3, y - 7, 6, 14);
      }
      if (Math.random() < 0.08) particle({ kind: 'star', x: b.x + rand(-10, 10), y: y + rand(-10, 6), vx: 0, vy: -0.4, life: 0.45, color: '#ffffff', size: 3 });
    });

    // Ombres des Pokémon
    g.foes.forEach((f) => {
      if (f.inert || f.x < vx0 - 80 || f.x > vx0 + vw + 80 || f.y < vy0 - 80 || f.y > vy0 + vh + 120) return;
      shadow(f.x, f.y + 2, f.size * 0.42 * (f.z > 40 ? 1 + f.z / 300 : 1), f.z > 40 ? 0.35 : 0.28);
    });
    shadow(p.x, p.y + 2, 15, 0.32);
    if (p.dash.cd <= 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 20, 7, 0, 0, TAU); ctx.stroke();
    }

    // Décor + Pokémon triés par profondeur
    const list = [];
    world.propsIn(vx0 - 60, vy0 - 40, vx0 + vw + 60, vy0 + vh + 200).forEach((pr) => list.push({ y: pr.y, prop: pr }));
    g.foes.forEach((f) => {
      if (f.x < vx0 - 120 || f.x > vx0 + vw + 120 || f.y < vy0 - 60 || f.y > vy0 + vh + 260) return;
      list.push({ y: f.y, foe: f });
    });
    g.dying.forEach((d) => list.push({ y: d.y, dying: d }));
    list.push({ y: p.y, player: true });
    list.sort((a, b) => a.y - b.y);
    list.forEach((it) => {
      if (it.prop) {
        const pr = it.prop;
        // Si le joueur passe derrière un grand décor, celui-ci devient transparent.
        const behind = pr.tall && p.y < pr.y - 4 && p.y > pr.y - pr.h + 10 && Math.abs(p.x - pr.x) < pr.w * 0.45;
        world.drawProp(ctx, pr, g.t, behind ? 0.5 : 1);
      } else if (it.foe) drawFoe(it.foe);
      else if (it.dying) {
        const d = it.dying;
        const k = d.t / 0.35;
        drawPokemon(ctx, d.dex, 'hurt', 0.05, d.dir, d.x, d.y, d.scale * (1 + k * 0.25), { white: k > 0.3, alpha: 1 - k, z: d.z + k * 10, loop: false });
      } else drawPlayer();
    });

    // Feuilles (avec traînée)
    leaves().forEach((leaf) => {
      for (let k = 3; k >= 1; k -= 1) {
        const a = leaf.a - k * 0.13;
        drawLeaf(p.x + Math.cos(a) * leaf.radius, p.y - 10 + Math.sin(a) * leaf.radius * 0.8, a, 0.18 * (4 - k));
      }
      drawLeaf(leaf.x, leaf.y, leaf.a);
    });

    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.kind === 'swift') {
        sh.trail.forEach((pt, i) => {
          ctx.fillStyle = `rgba(255,240,150,${(i / sh.trail.length) * 0.5})`;
          ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
        });
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.spin);
        ctx.fillStyle = '#fff3a0'; ctx.strokeStyle = '#c9a400'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const r = i % 2 ? 4.5 : 11;
          const a = (i / 10) * TAU - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        return;
      }
      if (sh.kind === 'water') {
        const a = Math.atan2(sh.vy, sh.vx);
        ctx.save();
        ctx.translate(sh.x, sh.y); ctx.rotate(a);
        ctx.fillStyle = 'rgba(99,144,240,.45)'; ctx.beginPath(); ctx.ellipse(-sh.r, 0, sh.r * 2.6, sh.r * 0.9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7fb4ff'; ctx.beginPath(); ctx.ellipse(0, 0, sh.r * 1.6, sh.r * 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(sh.r * 0.4, -1, sh.r * 0.7, sh.r * 0.3, 0, 0, TAU); ctx.fill();
        ctx.restore();
        return;
      }
      if (sh.kind === 'shadow') {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, sh.r * 1.7);
        grad.addColorStop(0, '#1a0d2b'); grad.addColorStop(0.55, '#4b2a7a'); grad.addColorStop(0.8, 'rgba(139,107,214,.6)'); grad.addColorStop(1, 'rgba(139,107,214,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, sh.r * 1.7, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(200,170,255,.7)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(0, 0, sh.r * 0.9, sh.spin + i * 2.1, sh.spin + i * 2.1 + 0.9); ctx.stroke(); }
        ctx.restore();
        return;
      }
      // Flammèche
      const grad = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, sh.r * 2);
      grad.addColorStop(0, '#fffbe0'); grad.addColorStop(0.3, '#ffd34a'); grad.addColorStop(0.65, '#ff6a1f'); grad.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r * 2, 0, TAU); ctx.fill();
    });
    g.hazards.forEach((hz) => {
      const grad = ctx.createRadialGradient(hz.x, hz.y, 1, hz.x, hz.y, hz.r * 1.6);
      if (hz.kind === 'poison') { grad.addColorStop(0, '#f2d0ff'); grad.addColorStop(0.45, '#a64fd0'); grad.addColorStop(1, 'rgba(100,20,140,0)'); }
      else { grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, '#e05ad6'); grad.addColorStop(1, 'rgba(120,0,140,0)'); }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(hz.x, hz.y, hz.r * 1.6, 0, TAU); ctx.fill();
    });

    // Effets
    g.fx.forEach((f) => {
      const k = 1 - f.life / (f.max || f.life || 1);
      if (f.kind === 'bolt') {
        const pts = [];
        f.points.forEach((pt, i) => {
          if (!i) { pts.push(pt); return; }
          const prev = f.points[i - 1];
          for (let s = 1; s <= 4; s += 1) {
            const t = s / 4;
            pts.push(s === 4 ? pt : { x: prev.x + (pt.x - prev.x) * t + rand(-10, 10), y: prev.y + (pt.y - prev.y) * t + rand(-10, 10) });
          }
        });
        const line = (width, color) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'miter';
          ctx.beginPath(); pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y))); ctx.stroke();
        };
        ctx.globalAlpha = 1 - k * 0.6;
        line(10, 'rgba(247,208,44,.35)');
        line(5, '#ffe14a');
        line(2, '#ffffff');
        ctx.globalAlpha = 1;
      } else if (f.kind === 'spark') {
        ctx.fillStyle = `rgba(255,250,200,${1 - k})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.5 + k), 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i += 1) {
          const a = i * (TAU / 4) + 0.6;
          ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 6, f.y + Math.sin(a) * 6); ctx.lineTo(f.x + Math.cos(a) * (14 + k * 14), f.y + Math.sin(a) * (14 + k * 14)); ctx.stroke();
        }
      } else if (f.kind === 'ring') {
        const r = f.r + (f.max - f.r) * Math.min(1, k);
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 6 * (1 - k) + 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.7, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.kind === 'blast') {
        const r = f.r * (0.4 + k * 0.9);
        const grad = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, r);
        grad.addColorStop(0, `rgba(255,250,220,${1 - k})`); grad.addColorStop(0.4, `rgba(255,170,60,${0.9 - k})`); grad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill();
      } else if (f.kind === 'slash') {
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.strokeStyle = `rgba(230,255,200,${1 - k})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.stroke();
        ctx.restore();
      } else if (f.kind === 'beam') {
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.ang);
        ctx.fillStyle = `rgba(240,160,255,${0.8 * (1 - k)})`; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.fillRect(0, -f.w * 0.35, f.len, f.w * 0.7);
        ctx.restore();
      }
    });

    // Particules (carrés pour rester « pixel »)
    g.particles.forEach((q) => {
      const a = Math.max(0, q.life / q.max);
      if (q.kind === 'smoke') {
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = q.color;
        const s = q.size * (1.6 - a * 0.6);
        ctx.beginPath(); ctx.arc(q.x, q.y, s, 0, TAU); ctx.fill();
      } else if (q.kind === 'star') {
        ctx.globalAlpha = a;
        ctx.fillStyle = q.color;
        ctx.fillRect(q.x - 1, q.y - q.size, 2, q.size * 2);
        ctx.fillRect(q.x - q.size, q.y - 1, q.size * 2, 2);
      } else {
        ctx.globalAlpha = Math.min(1, a * 1.5);
        ctx.fillStyle = q.color;
        ctx.fillRect(Math.round(q.x - q.size / 2), Math.round(q.y - q.size / 2), q.size, q.size);
      }
    });
    ctx.globalAlpha = 1;

    // Chiffres de dégâts (petit « pop » à l'apparition)
    ctx.textAlign = 'center';
    g.texts.forEach((tx) => {
      const k = 1 - tx.life / tx.max;
      const pop = k < 0.15 ? 1 + (0.15 - k) * 5 : 1;
      const size = (tx.big ? 20 : 14) * pop;
      ctx.font = `900 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.globalAlpha = Math.min(1, (tx.life / tx.max) * 2.5);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(tx.txt, tx.x, tx.y);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.txt, tx.x, tx.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // ——— Écran (hors monde) ———
    // Lumière : l'après-midi tourne au crépuscule puis à la nuit, avec un halo autour du joueur.
    const dusk = clamp((g.t - 200) / 200, 0, 1);
    const night = clamp((g.t - 420) / 120, 0, 1);
    if (dusk > 0) {
      ctx.fillStyle = `rgba(255,120,40,${0.09 * dusk * (1 - night)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (night > 0) {
      const px = (p.x - vx0) * zoom; const py = (p.y - vy0) * zoom;
      const grad = ctx.createRadialGradient(px, py, 80 * zoom, px, py, Math.max(w, h) * 0.75);
      grad.addColorStop(0, 'rgba(20,10,60,0)');
      grad.addColorStop(1, `rgba(20,10,60,${0.45 * night})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    // Vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    if (g.flash) {
      const a = g.flash.life / g.flash.max;
      if (g.flash.vignette) {
        const fg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
        fg.addColorStop(0, 'rgba(255,0,0,0)'); fg.addColorStop(1, `rgba(255,30,30,${0.45 * a})`);
        ctx.fillStyle = fg;
      } else {
        ctx.globalAlpha = 0.35 * a;
        ctx.fillStyle = g.flash.color;
      }
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Flèche vers le boss s'il est hors de l'écran
    if (g.boss) {
      const bx = (g.boss.x - vx0) * zoom; const by = (g.boss.y - vy0) * zoom;
      if (bx < 0 || by < 0 || bx > w || by > h) {
        const a = Math.atan2(by - h / 2, bx - w / 2);
        const ex = clamp(bx, 40, w - 40); const ey = clamp(by, 90, h - 40);
        ctx.save();
        ctx.translate(ex, ey); ctx.rotate(a);
        ctx.fillStyle = `rgba(255,80,60,${0.7 + Math.sin(g.t * 8) * 0.3})`;
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    // Mini-carte
    const mw = w < 640 ? 112 : 176;
    const mh = (mw * world.H) / world.W;
    const mx0 = w - mw - 14; const my0 = h - mh - 14;
    const ms = mw / world.W;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(10,20,30,.7)'; ctx.fillRect(mx0 - 4, my0 - 4, mw + 8, mh + 8);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(world.mini, mx0, my0, mw, mh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,70,60,.85)';
    g.foes.forEach((f, i) => { if (!f.inert && i % 2 === 0) ctx.fillRect(mx0 + f.x * ms, my0 + f.y * ms, 1.5, 1.5); });
    ctx.fillStyle = '#b98c62';
    g.foes.forEach((f) => { if (f.inert) ctx.fillRect(mx0 + f.x * ms - 1, my0 + f.y * ms - 1, 3, 3); });
    if (g.boss) {
      ctx.fillStyle = '#ffd23a';
      ctx.beginPath(); ctx.arc(mx0 + g.boss.x * ms, my0 + g.boss.y * ms, 4 + Math.sin(g.t * 6), 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1;
    ctx.strokeRect(mx0 + vx0 * ms, my0 + vy0 * ms, vw * ms, vh * ms);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(mx0 + p.x * ms, my0 + p.y * ms, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.strokeRect(mx0 - 4, my0 - 4, mw + 8, mh + 8);
    ctx.restore();

    // Joystick tactile
    if (stick.active) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 46, 0, TAU); ctx.stroke();
      const dx = stick.x - stick.ox; const dy = stick.y - stick.oy;
      const l = Math.min(46, Math.hypot(dx, dy));
      const a = Math.atan2(dy, dx);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.arc(stick.ox + Math.cos(a) * l, stick.oy + Math.sin(a) * l, 18, 0, TAU); ctx.fill();
    }
  };

  /* ——— Entrées ——— */
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', KeyZ: 'up',
    ArrowDown: 'down', KeyS: 'down'
  };
  const onKey = (down) => (e) => {
    const k = KEYMAP[e.code];
    if (k) {
      e.preventDefault();
      if (down) keys.add(k); else keys.delete(k);
    }
    if (down && (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')) { e.preventDefault(); dash(); }
    if (down && (e.code === 'Escape' || e.code === 'KeyP') && callbacks.onPauseKey) callbacks.onPauseKey();
  };
  const kd = onKey(true);
  const ku = onKey(false);
  const pointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const pd = (e) => {
    const pt = pointer(e);
    stick.active = true;
    stick.ox = pt.x; stick.oy = pt.y; stick.x = pt.x; stick.y = pt.y;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const pm = (e) => {
    if (!stick.active) return;
    const pt = pointer(e);
    stick.x = pt.x; stick.y = pt.y;
  };
  const pu = () => { stick.active = false; };
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  const blur = () => keys.clear();
  window.addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', pd);
  canvas.addEventListener('pointermove', pm);
  canvas.addEventListener('pointerup', pu);
  canvas.addEventListener('pointercancel', pu);

  // Accès de test (console) : window.__swarm
  if (typeof window !== 'undefined' && window.__SWARM_DEBUG) window.__swarm = { g, world, dash, keys };

  let raf = 0;
  let last = performance.now();
  const frame = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const snapshot = () => ({
    t: g.t,
    kills: g.kills,
    level: g.player.level,
    hp: g.player.hp,
    maxHp: g.player.maxHp,
    xp: g.player.xp,
    need: g.player.need,
    form: g.player.form,
    weapons: Object.entries(g.weapons).map(([id, w]) => ({ id, lv: w.lv })),
    passives: Object.entries(g.passives).map(([id, lv]) => ({ id, lv })),
    boss: g.boss ? { name: g.boss.def.name, hp: Math.max(0, g.boss.hp), maxHp: g.boss.maxHp } : null,
    banner: g.banner?.text || null,
    dash: 1 - g.player.dash.cd / DASH_CD,
    rerolls: g.rerolls,
    remaining: Math.max(0, RUN_SECONDS - g.t)
  });

  return {
    snapshot,
    choose,
    reroll,
    dash,
    setPaused(v) {
      if (g.pendingLevels && !v) return;
      g.paused = v;
      if (!v) last = performance.now();
    },
    isPaused: () => g.paused,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pd);
      canvas.removeEventListener('pointermove', pm);
      canvas.removeEventListener('pointerup', pu);
      canvas.removeEventListener('pointercancel', pu);
    }
  };
};
