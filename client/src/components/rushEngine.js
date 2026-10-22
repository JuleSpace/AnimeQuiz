/**
 * Moteur du Poké Rush (Three.js) : survie en 3D avec les sprites PMDCollab.
 * Le partenaire attaque tout seul ; on court, on saute, on esquive, on capture des Pokémon
 * qui se battent à nos côtés, et on finit par affronter le légendaire dans l'arène.
 */
import * as THREE from 'three';
import {
  BLESSINGS, FOES, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, MEGA_LEVELS, PASSIVES, WEAPONS, CAST_ANIM, canHold, canLearn, megaOf, xpToNext
} from './swarmData';
import { GEN1_TYPES, buildRushRoster, familyOfDex, ultOf } from './rushLeague';
import { FINAL_AT, MOVE_KIND, PX, TYPE_COLORS, catchChance, foeTypes, typeMult } from './rushData';
import { B, C, M, R, S, TAU, WATER, buildRushWorld, clamp, merge, part, rand } from './rushWorld';
import { createSpriteBank, rowFor, spriteHeight } from './rushSprites';
import { createFx } from './rushFx';
import { FX, fxFrameOfType } from './rushArt';

const GRAV = 34;
const MAX_FOES = 260;
const pick = (l) => l[Math.floor(Math.random() * l.length)];

// Types de chaque forme du partenaire (pour l'eau, le vol et le bonus de même type)
const FORM_TYPES = {
  1: ['Plante', 'Poison'], 2: ['Plante', 'Poison'], 3: ['Plante', 'Poison'], '3-mega': ['Plante', 'Poison'],
  4: ['Feu'], 5: ['Feu'], 6: ['Feu', 'Vol'], '6-mega': ['Feu', 'Dragon'], '6-megay': ['Feu', 'Vol'],
  7: ['Eau'], 8: ['Eau'], 9: ['Eau'], '9-mega': ['Eau'],
  25: ['Électrik'], 26: ['Électrik'], '26-megax': ['Électrik'], '26-megay': ['Électrik', 'Psy']
};

export const createRush = (mount, overlay, partner, callbacks = {}, effects = {}) => {
  const E = {
    balls: 3, catchBonus: 0, hp: 0, dmg: 1, speed: 1, coins: 1, allies: 3, cards: 3, rerolls: 2, unlocks: {}, ...effects
  };
  /* ——— Rendu ——— */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  renderer.domElement.className = 'pr-gl';
  const scene = new THREE.Scene();
  const SKY = new THREE.Color('#bfe4ff');
  scene.background = SKY;
  scene.fog = new THREE.Fog(SKY, 70, 190);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1200);
  scene.add(new THREE.HemisphereLight('#ffffff', '#5f8f45', 1.25));
  const sun = new THREE.DirectionalLight('#fff3dc', 1.5);
  sun.position.set(40, 80, 30);
  scene.add(sun);
  const octx = overlay.getContext('2d');
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const world = buildRushWorld(scene, track, { seed: effects.seed });
  const { terrainAt, isWater, inGrass, arena } = world;
  const bank = createSpriteBank(scene);
  const roster = buildRushRoster();
  const leagueReady = new Set(effects.leagueReady || []);

  /* ——— Objets 3D réutilisables ——— */
  // Ombres rondes sous chaque Pokémon
  const blobGeo = track(new THREE.CircleGeometry(1, 14));
  blobGeo.rotateX(-Math.PI / 2);
  const blobs = new THREE.InstancedMesh(blobGeo, track(new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false })), 700);
  blobs.frustumCulled = false; blobs.renderOrder = 1;
  scene.add(blobs);
  // Effets en sprites pixel art (projectiles, particules, pièces, Balls…)
  const fx = createFx(scene);
  // Cristaux d'XP : petits prismes lumineux
  const candyGeo = track(new THREE.OctahedronGeometry(0.26, 0)); candyGeo.scale(0.85, 1.45, 0.85);
  const candyMesh = new THREE.InstancedMesh(candyGeo, track(new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#1f6a3a', flatShading: true })), 1000);
  candyMesh.frustumCulled = false; scene.add(candyMesh);

  // Disques au sol (zones, ondes, attaques annoncées) en mode « immédiat »
  const makePool = (geo, n, order = 1) => {
    const list = [];
    for (let i = 0; i < n; i += 1) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false; m.renderOrder = order; m.frustumCulled = false;
      disposables.push(m.material);
      scene.add(m);
      list.push(m);
    }
    let used = 0;
    return {
      begin() { used = 0; },
      add(x, y, z, sx, color, opacity, ry = 0, sy = sx, sz = sx, rx = 0) {
        if (used >= list.length) return null;
        const m = list[used]; used += 1;
        m.visible = true;
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, 0, 'YXZ');
        m.scale.set(sx, sy, sz);
        m.material.color.set(color);
        m.material.opacity = opacity;
        return m;
      },
      end() { for (let i = used; i < list.length; i += 1) list[i].visible = false; }
    };
  };
  const ringGeo = track(new THREE.RingGeometry(0.86, 1, 40)); ringGeo.rotateX(-Math.PI / 2);
  const discGeo = track(new THREE.CircleGeometry(1, 40)); discGeo.rotateX(-Math.PI / 2);
  const rings = makePool(ringGeo, 70);
  const discs = makePool(discGeo, 70);
  const beamGeo = track(new THREE.BoxGeometry(1, 1, 1)); beamGeo.translate(0, 0, 0.5);
  const beams = makePool(beamGeo, 16, 3);
  const pillarGeo = track(new THREE.CylinderGeometry(1, 1, 1, 18, 1, true)); pillarGeo.translate(0, 0.5, 0);
  const pillars = makePool(pillarGeo, 12, 3);
  const parts = [];
  const MAXP = 2400;
  const particle = (x, y, z, color, n = 6, speed = 5, o = {}) => {
    for (let i = 0; i < n && parts.length < MAXP; i += 1) {
      const a = rand(0, TAU); const v = rand(0.3, 1) * speed;
      const life = rand(0.35, 0.8) * (o.life || 1);
      parts.push({
        x, y, z, vx: Math.cos(a) * v, vy: rand(0.2, 1) * speed * 0.8 + (o.up || 0), vz: Math.sin(a) * v, life, max: life,
        col: color, f: o.f ?? (Math.random() < 0.35 ? FX.spark : FX.dot), size: (o.size || 0.26) * rand(0.7, 1.3), rot: rand(0, TAU), spin: o.spin ?? rand(-6, 6), grav: o.grav ?? 14
      });
    }
  };
  // Éclats d'une attaque : des petits sprites du type (flammèches, gouttes, feuilles…) et des étincelles
  const fxBurst = (x, y, z, type, n = 8, speed = 5) => {
    const f = fxFrameOfType(type);
    particle(x, y, z, null, Math.ceil(n * 0.5), speed, { f, size: 0.42, grav: type === 'Feu' || type === 'Dragon' ? -2 : 10 });
    particle(x, y, z, TYPE_COLORS[type] || '#ffffff', Math.ceil(n * 0.5), speed * 1.1, { size: 0.3 });
  };
  const puff = (x, y, z, n = 4, color = '#ffffff') => particle(x, y, z, color, n, 2, { f: FX.smoke, size: 0.55, grav: -1.5, life: 1.1, spin: 0 });
  const tmpM = new THREE.Matrix4(); const tmpQ = new THREE.Quaternion(); const tmpE = new THREE.Euler(); const tmpV = new THREE.Vector3(); const tmpS = new THREE.Vector3();
  const setInst = (mesh, i, x, y, z, ry = 0, sc = 1, rx = 0, rz = 0) => {
    tmpE.set(rx, ry, rz, 'YXZ'); tmpQ.setFromEuler(tmpE);
    tmpV.set(x, y, z); tmpS.set(sc, sc, sc);
    tmpM.compose(tmpV, tmpQ, tmpS);
    mesh.setMatrixAt(i, tmpM);
  };

  /* ——— État ——— */
  const formTypes = (dex) => FORM_TYPES[dex] || GEN1_TYPES[dex] || partner.types || [partner.type];
  const g = {
    t: 0, paused: false, over: null, trauma: 0, banner: null,
    kills: 0, killsBy: {}, typeKills: {}, caughtTypes: [], leagueCaught: [], leagueSpawns: [...(effects.leagueSpawns || [])], dashes: 0, berries: 0, evolutions: 0, coinsTotal: 0, met: {}, coins: 0, balls: E.balls, caught: [], bossKills: 0, superHits: 0, chestsOpened: 0,
    pendingLevels: 0, pendingEvo: null, evoQueue: [], evo: null, rerolls: E.rerolls,
    weapons: { [partner.weapon]: { lv: 1, timer: 0.4 } }, passives: {}, megaLv: 0, megaChoice: null,
    foes: [], shots: [], zones: [], fx: [], orbs: [], drops: [], texts: [], teles: [], allies: [], throws: [], zaps: [],
    bossIdx: 0, boss: null, finalSpawned: false, finalAwake: false,
    ult: 0, ults: 0, bless: { dmg: 1, speed: 1 }, altarOpen: false, altarsUsed: 0,
    alphaAt: [120, 300], alphaKills: 0, hurtFlash: 0, lastHitT: 0, maxNoHit: 0, spawnAcc: 0,
    cam: { yaw: Math.atan2(world.start.x - arena.x, world.start.z - arena.z), pitch: 0.5, dist: 11.5, x: 0, y: 20, z: 0 },
    player: {
      x: world.start.x, y: terrainAt(world.start.x, world.start.z), z: world.start.z, vx: 0, vy: 0, vz: 0,
      fx: 0, fz: -1, hp: partner.hp + E.hp, maxHp: partner.hp + E.hp, inv: 0, grounded: true,
      dashCd: 0, dashT: 0, level: 1, xp: 0, need: xpToNext(1), form: { name: partner.name, dex: partner.dex }, mega: false,
      castT: 0, castAnim: 'shoot', hurtT: 0, combo: 0, comboT: 0, trailAcc: 0, moving: false, bob: 0
    }
  };
  const p0 = g.player;
  g.cam.x = p0.x; g.cam.z = p0.z + 10;

  const stats = () => {
    const P = g.passives; const p = g.player;
    const mk = g.megaChoice;
    return {
      dmg: (1 + 0.12 * (P.protein || 0) + 0.04 * g.megaLv) * (p.mega ? (mk === 'x' ? 1.45 : 1.3) : 1) * E.dmg * g.bless.dmg * (partner.power || 1),
      speed: (1 + 0.08 * (P.carbos || 0) + (p.mega ? 0.12 : 0)) * E.speed * g.bless.speed * (p.slowT > 0 ? 0.6 : 1),
      cd: (1 - 0.07 * (P.quickclaw || 0)) * (p.mega && mk === 'y' ? 0.75 : 1),
      crit: 0.05 + 0.06 * (P.scope || 0),
      regen: 0.6 * (P.leftovers || 0),
      magnet: 2.6 * (1 + 0.35 * (P.magnet || 0)),
      dodge: 0.04 * (P.brightpowder || 0)
    };
  };
  const shake = (a) => { g.trauma = Math.min(1, g.trauma + a); };
  const text = (x, y, z, txt, color = '#fff', big = false) => { if (g.texts.length < 90) g.texts.push({ x, y, z, txt, color, big, life: 0.8, max: 0.8 }); };
  const banner = (txt, life = 2.6) => { g.banner = { text: txt, life }; if (callbacks.onBanner) callbacks.onBanner(txt); };
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

  /* ——— Grille spatiale ——— */
  const CELL = 4;
  let grid = new Map();
  const buildGrid = () => {
    grid = new Map();
    g.foes.forEach((f) => {
      if (f.dead) return;
      const k = Math.floor(f.x / CELL) * 1000 + Math.floor(f.z / CELL);
      let l = grid.get(k);
      if (!l) { l = []; grid.set(k, l); }
      l.push(f);
    });
  };
  const near = (x, z, r) => {
    const out = [];
    const i0 = Math.floor((x - r) / CELL); const i1 = Math.floor((x + r) / CELL);
    const j0 = Math.floor((z - r) / CELL); const j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i += 1) for (let j = j0; j <= j1; j += 1) { const l = grid.get(i * 1000 + j); if (l) for (let k = 0; k < l.length; k += 1) if (!l[k].dead) out.push(l[k]); }
    return out;
  };
  const nearest = (x, z, range, skip = null) => {
    let best = null; let bd = range * range;
    near(x, z, range).forEach((f) => { if (f.dormant || f.captureT > 0 || (skip && skip.has(f))) return; const d = (f.x - x) ** 2 + (f.z - z) ** 2; if (d < bd) { bd = d; best = f; } });
    return best;
  };
  const nearestN = (x, z, range, n) => near(x, z, range).filter((f) => !f.dormant && !(f.captureT > 0) && (f.x - x) ** 2 + (f.z - z) ** 2 < range * range)
    .sort((a, b) => ((a.x - x) ** 2 + (a.z - z) ** 2) - ((b.x - x) ** 2 + (b.z - z) ** 2)).slice(0, n);

  /* ——— Apparitions ——— */
  const spawnFoe = (id, at = null, extra = {}) => {
    const def = FOES[id];
    if (!def) return null;
    const p = g.player;
    let x; let z;
    if (at) { x = at.x; z = at.z; } else {
      let ok = false;
      for (let k = 0; k < 14 && !ok; k += 1) {
        const a = rand(0, TAU); const r = rand(28, 38);
        x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r;
        ok = Math.hypot(x, z) < R * 0.9 && (def.flying || !isWater(x, z)) && Math.hypot(x - arena.x, z - arena.z) > arena.r + 2;
      }
      if (!ok) return null;
    }
    const grow = def.boss ? 1 : 1 + g.t / 150;
    const elite = !def.boss && !extra.alpha && g.t > 60 && Math.random() < 0.02;
    const hp = Math.round(def.hp * grow * (elite ? 4 : 1));
    g.met[id] = 1;
    const f = {
      id, def, types: foeTypes(id), x, z, y: terrainAt(x, z), vx: 0, vz: 0, kx: 0, kz: 0, hp, maxHp: hp,
      speed: def.speed * 2.3 * (def.boss ? 1 : rand(0.9, 1.1)) * (elite ? 1.1 : 1),
      dmg: Math.max(2, Math.round(def.dmg * (def.boss ? 1 : 0.7 + g.t / 380) * (elite ? 1.4 : 1))),
      radius: def.boss ? 1.6 : Math.max(0.45, def.size * PX * 0.5),
      scale: (def.boss ? 2.1 : 1) * (elite ? 1.25 : 1),
      elite, flash: 0, atkCd: rand(0.5, 1.2), skillCd: rand(2.5, 4), shootCd: rand(2, 4), state: 'chase', stateT: 0,
      phase: rand(0, TAU), fly: !!def.flying, boss: def.boss || null, stunT: 0, slowT: 0, burnT: 0, hitCd: 0, fx: 0, fz: 1,
      ...extra
    };
    g.foes.push(f);
    return f;
  };
  const spawnTick = (dt) => {
    const interval = Math.max(0.12, 0.55 - g.t / 900);
    const batch = 1 + Math.floor(g.t / 90);
    g.spawnAcc += dt;
    while (g.spawnAcc >= interval) {
      g.spawnAcc -= interval;
      if (g.foes.length >= MAX_FOES) { g.spawnAcc = 0; break; }
      const wave = [...roster.waves].reverse().find((w) => g.t >= w.from) || roster.waves[0];
      const id = pick(wave.foes);
      const a = rand(0, TAU); const r = rand(28, 38);
      const ax = g.player.x + Math.cos(a) * r; const az = g.player.z + Math.sin(a) * r;
      for (let i = 0; i < batch; i += 1) {
        const x = ax + rand(-3, 3); const z = az + rand(-3, 3);
        if (Math.hypot(x, z) > R * 0.9 || (!FOES[id].flying && isWater(x, z)) || Math.hypot(x - arena.x, z - arena.z) < arena.r + 2) continue;
        spawnFoe(id, { x, z });
      }
    }
    // Boss intermédiaires
    const next = roster.bosses[g.bossIdx];
    if (next && next.id !== roster.final && g.t >= next.at * (next.hpMul > 1 ? 1 : 1)) {
      const b = spawnFoe(next.id);
      if (b) {
        g.bossIdx += 1;
        b.hp = Math.round(b.hp * next.hpMul); b.maxHp = b.hp;
        banner(next.title, 3.2); shake(0.5);
      }
    }
    // Le légendaire se réveille dans l'arène
    if (!g.finalSpawned && g.t >= FINAL_AT) {
      g.finalSpawned = true;
      g.bossIdx = roster.bosses.length;
      const b = spawnFoe(roster.final, { x: arena.x, z: arena.z }, { dormant: true });
      if (b) { b.y = arena.y; banner(`${b.def.name} s'est réveillé dans l'arène ! Va l'affronter`, 4); shake(0.6); }
    }
    // Futurs membres de la Collection : ils rôdent, il faut les capturer
    while (g.leagueSpawns.length && g.t >= g.leagueSpawns[0].at) {
      const L = g.leagueSpawns.shift();
      const f = spawnFoe(L.key, null, { league: L.fam, legendLeague: !!L.legendary, elite: false });
      if (f) {
        f.hp = Math.round(f.hp * (L.legendary ? 10 : 3.5)) + 40; f.maxHp = f.hp; f.scale = L.legendary ? 1.5 : 1.15;
        banner(`Un ${f.def.name} sauvage rôde ! Capture-le pour l'ajouter à ta Collection`, 3.6);
      } else g.leagueSpawns.push({ ...L, at: g.t + 5 });
    }
    // Pokémon Alpha cachés dans les hautes herbes
    if (g.alphaAt.length && g.t >= g.alphaAt[0] && world.grass.length) {
      g.alphaAt.shift();
      const gp = pick(world.grass);
      const wave = [...roster.waves].reverse().find((w) => g.t >= w.from) || roster.waves[0];
      const id = pick(wave.foes.filter((x) => !FOES[x].flying).length ? wave.foes.filter((x) => !FOES[x].flying) : wave.foes);
      const f = spawnFoe(id, { x: gp.x, z: gp.z }, { alpha: true, dormant: true, elite: false });
      if (f) {
        f.hp = Math.round(f.hp * 14); f.maxHp = f.hp;
        f.scale = 1.9; f.radius *= 1.7; f.dmg = Math.round(f.dmg * 1.8); f.speed *= 0.85;
        f.grass = gp;
        banner(`Un ${f.def.name} Alpha se cache dans les hautes herbes…`, 3.4);
      }
    }
  };

  /* ——— Dégâts ——— */
  let lastSuper = -9;
  const hurt = (f, amount, type = 'Normal', src = null, o = {}) => {
    if (f.dead || f.captureT > 0) return 0;
    const s = stats();
    const mult = typeMult(type, f.types);
    const stab = formTypes(g.player.form.dex).includes(type) ? 1.2 : 1;
    const crit = Math.random() < s.crit + (o.critBonus || 0);
    const dmg = Math.max(1, Math.round(amount * s.dmg * mult * stab * (crit ? 1.8 : 1) * (f.stunT > 0 && o.trapBonus ? 1.25 : 1) * (o.ally ? 1 : 1)));
    f.hp -= dmg;
    f.flash = 0.12;
    f.lastType = type;
    if (f.dormant && !f.boss) f.dormant = false;
    if (f.boss === 'final' && f.dormant) { f.dormant = false; g.finalAwake = true; }
    if (src && !f.boss) {
      const k = (o.knock ?? 3) * (f.def.heavy ? 0.4 : 1) * (f.elite ? 0.5 : 1) * (f.alpha ? 0.2 : 1);
      const dx = f.x - src.x; const dz = f.z - src.z; const l = Math.hypot(dx, dz) || 1;
      f.kx += (dx / l) * k; f.kz += (dz / l) * k;
    }
    if (mult > 1) {
      g.superHits += 1;
      if (g.t - lastSuper > 1.5) { lastSuper = g.t; text(f.x, f.y + spriteHeight(f.def.dex) * f.scale + 0.6, f.z, 'Super efficace !', '#ffb02e'); }
    }
    if (!o.silent) text(f.x + rand(-0.3, 0.3), f.y + spriteHeight(f.def.dex) * f.scale * 0.8, f.z, crit ? `${dmg}!` : `${dmg}`, crit ? '#ff6a3a' : mult > 1 ? '#ffd23a' : mult < 1 ? '#b8b8c8' : '#ffffff', crit || mult > 1);
    if (f.hp <= 0) kill(f);
    return dmg;
  };
  // Jauge d'ultime : rien ne se recharge pendant 15 s après un ultime, puis chaque ultime lancé ralentit la suivante
  const chargeUlt = (v) => { if (g.t < (g.ultLock || 0)) return; g.ult = Math.min(1, g.ult + v / (1 + 0.3 * g.ults)); };
  const dropOrb = (x, z, v) => g.orbs.push({ x, z, y: terrainAt(x, z) + 0.6, v, vx: rand(-3, 3), vy: rand(4, 7), vz: rand(-3, 3), pulled: false });
  const kill = (f) => {
    if (f.dead) return;
    f.dead = true;
    g.kills += 1;
    g.killsBy[f.id] = (g.killsBy[f.id] || 0) + 1;
    if (f.lastType) g.typeKills[f.lastType] = (g.typeKills[f.lastType] || 0) + 1;
    chargeUlt((f.boss ? 0.2 : f.alpha ? 0.25 : f.elite ? 0.03 : 0.005));
    particle(f.x, f.y + 0.8, f.z, '#ffffff', f.boss ? 30 : 6, f.boss ? 9 : 5, { f: FX.star4, size: 0.4 });
    puff(f.x, f.y + 0.5, f.z, f.boss ? 14 : 3, '#ffffff');
    if (f.boss) fxBurst(f.x, f.y + 1, f.z, f.types[0], 40, 10);
    if (Math.random() < (g.passives.shellbell || 0) * 0.06) { g.player.hp = Math.min(g.player.maxHp, g.player.hp + 3); }
    if (f.boss === 'final') {
      g.over = 'win';
      g.bossKills += 1;
      shake(1);
      banner(`${f.def.name} est K.O. !`, 4);
      setTimeout(() => { if (callbacks.onEnd) callbacks.onEnd('win', snapshot()); }, 1600);
      return;
    }
    if (f.boss) {
      g.bossKills += 1;
      shake(0.7);
      for (let i = 0; i < 18; i += 1) dropOrb(f.x, f.z, 3);
      g.drops.push({ kind: 'ball', x: f.x, z: f.z, y: f.y + 1, vy: 6 }, { kind: 'ball', x: f.x + 1, z: f.z, y: f.y + 1, vy: 7 });
      for (let i = 0; i < 8; i += 1) g.drops.push({ kind: 'coin', v: 3, x: f.x + rand(-2, 2), z: f.z + rand(-2, 2), y: f.y + 1, vy: rand(5, 8) });
      return;
    }
    if (f.alpha) {
      g.alphaKills += 1;
      for (let i = 0; i < 10; i += 1) dropOrb(f.x, f.z, 3);
      g.drops.push({ kind: 'ball', x: f.x, z: f.z, y: f.y + 1, vy: 6 }, { kind: 'ball', x: f.x - 1, z: f.z, y: f.y + 1, vy: 7 }, { kind: 'berry', x: f.x, z: f.z + 1, y: f.y + 1, vy: 6 });
      banner(`${f.def.name} Alpha est K.O. !`, 2.4);
      return;
    }
    dropOrb(f.x, f.z, f.def.xp * (f.elite ? 6 : 1));
    if (Math.random() < 0.3) g.drops.push({ kind: 'coin', v: f.elite ? 5 : 1, x: f.x, z: f.z, y: f.y + 0.6, vy: 5 });
    if (Math.random() < (f.elite ? 0.5 : 0.012)) g.drops.push({ kind: 'ball', x: f.x, z: f.z, y: f.y + 0.6, vy: 6 });
    else if (Math.random() < (f.elite ? 0.5 : 0.01)) g.drops.push({ kind: 'berry', x: f.x, z: f.z, y: f.y + 0.6, vy: 6 });
  };
  const hurtPlayer = (amount, src) => {
    const p = g.player;
    if (p.inv > 0 || g.over || g.evo || p.dashT > 0) return;
    if (Math.random() < stats().dodge) { text(p.x, p.y + 2.4, p.z, 'Esquivé', '#fff6c2'); p.inv = 0.3; return; }
    p.hp -= amount;
    p.inv = 0.5;
    p.hurtT = 0.3;
    g.hurtFlash = 0.35;
    g.lastHitT = g.t;
    shake(0.18);
    text(p.x, p.y + 2.4, p.z, `-${amount}`, '#ff5a5a', true);
    if (src) { const dx = p.x - src.x; const dz = p.z - src.z; const l = Math.hypot(dx, dz) || 1; p.vx += (dx / l) * 9; p.vz += (dz / l) * 9; }
    if (p.hp <= 0) {
      p.hp = 0;
      g.over = 'lose';
      banner(`${p.form.name} est K.O.`, 3);
      setTimeout(() => { if (callbacks.onEnd) callbacks.onEnd('lose', snapshot()); }, 1300);
    }
  };

  /* ——— Attaques (comportements 3D génériques) ——— */
  const chest = (e) => e.y + spriteHeight(e.def?.dex ?? g.player.form.dex) * (e.scale || 1) * 0.45;
  const shoot = (o) => g.shots.push({ life: 2, hit: new Set(), y: g.player.y + 1, x: g.player.x, z: g.player.z, ...o });
  const castAt = (id, target) => {
    const p = g.player;
    p.castT = 0.32; p.castAnim = CAST_ANIM[id] || 'shoot';
    if (target) { const dx = target.x - p.x; const dz = target.z - p.z; const l = Math.hypot(dx, dz) || 1; p.fx = dx / l; p.fz = dz / l; }
  };
  const zap = (pts, color) => g.zaps.push({ pts, color, life: 0.18 });
  const fire = (id, w) => {
    const W = WEAPONS[id];
    const v = W.at(w.lv);
    const p = g.player;
    const kind = MOVE_KIND[id] || 'blast';
    const type = W.type;
    const color = TYPE_COLORS[type] || W.color;
    const range = (v.range ? v.range * PX : 14);
    switch (kind) {
      case 'chain': {
        let t = nearest(p.x, p.z, range);
        if (!t) return 0.2;
        castAt(id, t);
        const hit = new Set(); const pts = [[p.x, p.y + 1.2, p.z]];
        let prev = p;
        for (let i = 0; i <= v.chains && t; i += 1) {
          hurt(t, v.dmg, type, prev, { knock: 2 });
          hit.add(t); pts.push([t.x, chest(t), t.z]);
          fxBurst(t.x, chest(t), t.z, type, 5, 4);
          prev = t; t = nearest(t.x, t.z, 8, hit);
        }
        zap(pts, id === 'aerialace' ? '#e8f4ff' : '#fff27a');
        return v.cd;
      }
      case 'blast': case 'lob': {
        const targets = nearestN(p.x, p.z, 22, v.count || 1);
        if (!targets.length) return 0.2;
        castAt(id, targets[0]);
        targets.forEach((t) => {
          if (kind === 'lob') shoot({ kind: 'lob', sx: p.x, sz: p.z, sy: p.y + 1, tx: t.x, tz: t.z, ty: t.y, t: 0, dur: 0.6, h: 4, dmg: v.dmg, blast: Math.max(1.6, v.blast * PX), type, color, size: 0.35 });
          else {
            const dx = t.x - p.x; const dz = t.z - p.z; const dy = chest(t) - (p.y + 1); const l = Math.hypot(dx, dy, dz) || 1; const sp = (v.speed || 6) * 3;
            shoot({ kind: 'blast', vx: (dx / l) * sp, vy: (dy / l) * sp, vz: (dz / l) * sp, dmg: v.dmg, blast: Math.max(1.4, (v.blast || 30) * PX), type, color, size: 0.3, life: 1.6 });
          }
        });
        return v.cd;
      }
      case 'puddle': {
        const targets = nearestN(p.x, p.z, 20, v.count || 1);
        if (!targets.length) return 0.2;
        castAt(id, targets[0]);
        targets.forEach((t) => shoot({ kind: 'lob', puddle: true, sx: p.x, sz: p.z, sy: p.y + 1, tx: t.x, tz: t.z, ty: t.y, t: 0, dur: 0.6, h: 4, dmg: v.dmg, blast: Math.max(1.6, v.puddle * PX * 0.8), zr: v.puddle * PX, dps: v.dps, zlife: v.life || 2.5, type, color, size: 0.35 }));
        return v.cd;
      }
      case 'pierce': case 'boomerang': {
        const t = nearest(p.x, p.z, 22);
        if (!t) return 0.2;
        castAt(id, t);
        const a = Math.atan2(t.z - p.z, t.x - p.x);
        const dirs = [a];
        if (v.back) dirs.push(a + Math.PI);
        if (v.side) dirs.push(a + Math.PI / 2, a - Math.PI / 2);
        const sp = (v.speed || 7) * 3;
        dirs.forEach((d) => shoot({
          kind, vx: Math.cos(d) * sp, vy: 0, vz: Math.sin(d) * sp, dmg: v.dmg, type, color, pierce: true, bone: id === 'bonemerang',
          size: Math.max(0.25, (v.size || 10) * PX * 0.9), life: kind === 'boomerang' ? 1.4 : 1.3, out: range, sx: p.x, sz: p.z
        }));
        return v.cd;
      }
      case 'nova': {
        const r = v.radius * PX;
        if (!nearest(p.x, p.z, r + 1)) return 0.3;
        castAt(id, null);
        near(p.x, p.z, r + 1).forEach((f) => {
          if (id === 'quake' && f.fly) return;
          if (dist2(f, p) > (r + f.radius) ** 2) return;
          hurt(f, v.dmg, type, p, { knock: v.knock ? v.knock * 0.6 : 5 });
          if (v.slow && !f.boss) { f.slowT = v.slowT || 1; }
        });
        g.fx.push({ kind: 'ring', x: p.x, z: p.z, y: p.y + 0.15, r: 0.5, max: r, life: 0.4, dur: 0.4, color });
        if (id === 'quake') { shake(0.2); fxBurst(p.x, p.y + 0.2, p.z, 'Roche', 16, 7); puff(p.x, p.y + 0.3, p.z, 8, '#d8c0a0'); }
        if (id === 'surf') fxBurst(p.x, p.y + 0.5, p.z, 'Eau', 30, 8);
        if (id === 'dazzlinggleam') fxBurst(p.x, p.y + 1, p.z, 'Fée', 24, 7);
        if (id === 'spark') fxBurst(p.x, p.y + 1, p.z, 'Électrik', 16, 6);
        return v.cd;
      }
      case 'homing': case 'bubble': {
        const t = nearest(p.x, p.z, 20);
        if (!t) return 0.2;
        castAt(id, t);
        const base = Math.atan2(t.z - p.z, t.x - p.x);
        for (let i = 0; i < (v.count || 1); i += 1) {
          const a = base + (i - ((v.count || 1) - 1) / 2) * 0.5;
          const sp = (v.speed || 4) * 3;
          shoot({ kind, vx: Math.cos(a) * sp, vy: 1, vz: Math.sin(a) * sp, sp, dmg: v.dmg, type, color, size: kind === 'bubble' ? 0.4 : 0.25, life: kind === 'bubble' ? 2.5 : 2.2, burn: v.burn, trap: v.trap });
        }
        return v.cd;
      }
      case 'beam': {
        const len = v.len * PX; const wd = Math.max(0.5, v.w * PX * 1.2);
        const t = nearest(p.x, p.z, len);
        if (!t) return 0.25;
        castAt(id, t);
        const a = Math.atan2(t.z - p.z, t.x - p.x);
        const ux = Math.cos(a); const uz = Math.sin(a);
        near(p.x + ux * len / 2, p.z + uz * len / 2, len / 2 + 2).forEach((f) => {
          const rx = f.x - p.x; const rz = f.z - p.z;
          const along = rx * ux + rz * uz; const across = Math.abs(-rx * uz + rz * ux);
          if (along < 0 || along > len || across > wd + f.radius) return;
          hurt(f, v.dmg, type, p, { knock: id === 'hyperbeam' ? 6 : 1.5 });
          if (v.slow && !f.boss) f.slowT = v.slowT || 1.5;
        });
        g.fx.push({ kind: 'beam', x: p.x, y: p.y + 1.1, z: p.z, ang: a, len, w: wd, life: id === 'hyperbeam' ? 0.5 : 0.3, dur: id === 'hyperbeam' ? 0.5 : 0.3, color });
        if (id === 'hyperbeam') shake(0.3);
        return v.cd;
      }
      case 'psychic': {
        const pool = near(p.x, p.z, range).filter((f) => !f.dormant && dist2(f, p) < range * range).sort((a, b) => b.hp - a.hp).slice(0, v.count);
        if (!pool.length) return 0.25;
        castAt(id, pool[0]);
        pool.forEach((f) => { hurt(f, v.dmg, type, p, { knock: 7 }); g.fx.push({ kind: 'ring', x: f.x, z: f.z, y: chest(f), r: 0.3, max: 1.6, life: 0.4, dur: 0.4, color: '#ff7ac8', vert: true }); });
        return v.cd;
      }
      case 'tornado': {
        const t = nearest(p.x, p.z, 20);
        castAt(id, t);
        for (let i = 0; i < (v.count || 1); i += 1) {
          const a = t ? Math.atan2(t.z - p.z, t.x - p.x) + (i ? Math.PI : 0) : rand(0, TAU);
          g.zones.push({ kind: 'tornado', x: p.x, z: p.z, vx: Math.cos(a) * 3.5, vz: Math.sin(a) * 3.5, r: v.radius * PX * 1.2, dps: v.dps, pull: v.pull, life: v.life, max: v.life, tick: 0, type, color });
        }
        return v.cd;
      }
      case 'meteor': {
        const pool = near(p.x, p.z, range).filter((f) => !f.dormant && dist2(f, p) < range * range);
        if (!pool.length) return 0.3;
        castAt(id, pool[0]);
        for (let i = 0; i < v.count; i += 1) {
          const t = pick(pool);
          g.fx.push({ kind: 'meteor', x: t.x + rand(-1, 1), z: t.z + rand(-1, 1), y: t.y, delay: 0.45 + i * 0.12, life: 0.45 + i * 0.12 + 0.3, dur: 0.3, dmg: v.dmg, blast: Math.max(1.8, v.blast * PX), type, color, rock: id === 'rockslide' });
        }
        return v.cd;
      }
      case 'dash': return 1;
      case 'radial': {
        if (!nearest(p.x, p.z, 18)) return 0.3;
        castAt(id, null);
        for (let i = 0; i < v.count; i += 1) {
          const a = (i / v.count) * TAU + g.t;
          shoot({ kind: 'pierce', vx: Math.cos(a) * 16, vy: 0, vz: Math.sin(a) * 16, dmg: v.dmg, type, color: '#bfefff', pierce: true, size: 0.28, life: 1.1, slow: true });
        }
        return v.cd;
      }
      case 'claws': {
        const n = id === 'nightslash' ? v.count : 1;
        const reach = Math.max(2.6, (v.range || 70) * PX * 1.3);
        const hit = nearestN(p.x, p.z, reach, n);
        if (!hit.length) return 0.12;
        castAt(id, hit[0]);
        hit.forEach((f) => {
          let dmg = v.dmg;
          if (id === 'machpunch') { p.combo = Math.min(10, p.combo + 1); p.comboT = 1.5; dmg *= 1 + p.combo * 0.08; }
          hurt(f, dmg, type, p, { knock: 3, critBonus: id === 'nightslash' ? 0.25 : 0 });
          if (id === 'doublekick') setTimeout(() => { if (!f.dead) hurt(f, v.dmg, type, p, { knock: 3 }); }, 120);
          if (id === 'bite' && v.heal) p.hp = Math.min(p.maxHp, p.hp + v.heal);
          g.fx.push({ kind: 'slash', x: f.x, y: chest(f), z: f.z, life: 0.22, dur: 0.22, color, rot: rand(-1.2, 1.2) });
          fxBurst(f.x, chest(f), f.z, type, 6, 4);
        });
        return v.cd;
      }
      case 'cone': {
        const reach = Math.max(3, v.range * PX * 1.2);
        const t = nearest(p.x, p.z, reach + 1);
        if (!t) return 0.15;
        castAt(id, t);
        const a = Math.atan2(t.z - p.z, t.x - p.x);
        near(p.x, p.z, reach + 1).forEach((f) => {
          const d = Math.sqrt(dist2(f, p));
          if (d > reach + f.radius) return;
          let da = Math.atan2(f.z - p.z, f.x - p.x) - a;
          while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
          if (Math.abs(da) > (v.arc || 0.5) + 0.15) return;
          hurt(f, v.dmg, type, p, { knock: v.knock || 3 });
        });
        for (let i = 0; i < 14; i += 1) {
          const aa = a + rand(-(v.arc || 0.5), v.arc || 0.5); const sp = rand(6, 12);
          parts.push({ x: p.x, y: p.y + 1, z: p.z, vx: Math.cos(aa) * sp, vy: rand(0, 1.5), vz: Math.sin(aa) * sp, life: reach / sp, max: reach / sp, col: null, f: id === 'flamethrower' ? FX.Feu : FX.Acier, size: 0.6, rot: 0, spin: 0, grow: 1.2, grav: 0 });
        }
        return v.cd;
      }
      case 'stun': {
        const hit = nearestN(p.x, p.z, range, v.count);
        if (!hit.length) return 0.25;
        castAt(id, hit[0]);
        hit.forEach((f) => { hurt(f, v.dmg, type, p, { knock: 0 }); if (!f.boss) f.stunT = v.stun; zap([[p.x, p.y + 1.2, p.z], [f.x, chest(f), f.z]], '#fff27a'); });
        return v.cd;
      }
      case 'firering': {
        castAt(id, null);
        g.zones.push({ kind: 'firering', follow: true, x: p.x, z: p.z, r: v.radius * PX, dps: v.dps, life: v.life, max: v.life, tick: 0, type, color: '#ff7a2a' });
        return v.cd;
      }
      case 'bloom': {
        castAt(id, null);
        g.zones.push({ kind: 'bloom', x: p.x, z: p.z, r: v.radius * PX, dps: v.dps, heal: v.heal, life: v.life, max: v.life, tick: 0, type, color: '#ff9ad8', slow: true });
        return v.cd;
      }
      case 'drain': {
        const hit = nearestN(p.x, p.z, range, v.count);
        if (!hit.length) return 0.2;
        castAt(id, hit[0]);
        let healed = 0;
        hit.forEach((f) => { hurt(f, v.dmg, type, p, { knock: 1 }); healed += v.heal; zap([[f.x, chest(f), f.z], [p.x, p.y + 1, p.z]], '#9be06a'); });
        p.hp = Math.min(p.maxHp, p.hp + healed);
        if (healed) text(p.x, p.y + 2.6, p.z, `+${healed}`, '#6bd17a');
        return v.cd;
      }
      default: return 1;
    }
  };

  // Attaques continues : Tranch'Herbe (orbite), Roue de Feu (traînée), Plaquage (esquive)
  const leafList = [];
  const continuous = (dt) => {
    const p = g.player;
    leafList.length = 0;
    if (g.weapons.leaf) {
      const v = WEAPONS.leaf.at(g.weapons.leaf.lv);
      const r = Math.max(2, v.radius * PX * 1.1);
      for (let i = 0; i < v.count; i += 1) {
        const a = g.t * v.spin + (i / v.count) * TAU;
        const L = { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r, y: p.y + 0.9, a };
        leafList.push(L);
        near(L.x, L.z, 1.5).forEach((f) => {
          if (dist2(f, L) > (f.radius + 0.5) ** 2) return;
          f.leafCd = f.leafCd || 0;
          if (f.leafCd > g.t) return;
          f.leafCd = g.t + 0.4;
          hurt(f, v.dmg, 'Plante', p, { knock: 2.5 });
        });
      }
    }
    if (g.weapons.flametrail && p.moving) {
      const v = WEAPONS.flametrail.at(g.weapons.flametrail.lv);
      p.trailAcc += dt;
      if (p.trailAcc > 0.12) {
        p.trailAcc = 0;
        g.zones.push({ kind: 'flame', x: p.x, z: p.z, r: Math.max(0.9, v.radius * PX * 1.4), dps: v.dps, life: v.life, max: v.life, tick: 0, type: 'Feu', color: '#ff7a2a' });
      }
    }
  };

  /* ——— Ultime : un comportement par famille de types ——— */
  const ULT = ultOf(partner);
  const ultimate = () => {
    if (g.ult < 1 || g.over || g.paused || g.evo) return false;
    const p = g.player;
    g.ult = 0; g.ults += 1; g.ultLock = g.t + 15;
    const power = (70 + p.level * 9) * (partner.power || 1);
    const type = partner.type;
    banner(`${ULT.name} !`, 2);
    shake(0.9); p.inv = Math.max(p.inv, 1.2);
    g.flashScreen = { color: ULT.color, life: 0.4 };
    castAt(partner.weapon, null);
    const close = near(p.x, p.z, 26).filter((f) => !f.dormant || f.alpha);
    if (ULT.kind === 'bloom') {
      close.forEach((f) => { hurt(f, power, type, p, { knock: 1 }); if (!f.boss) { f.slowT = 4; f.rooted = type === 'Fée' ? 2 : 3; if (type === 'Fée') f.stunT = 1.5; } fxBurst(f.x, f.y + 0.4, f.z, type, 5); });
      const heal = Math.round(p.maxHp * (type === 'Insecte' ? 0.12 : 0.25)); p.hp = Math.min(p.maxHp, p.hp + heal); text(p.x, p.y + 3, p.z, `+${heal}`, '#6bd17a', true);
      g.zones.push({ kind: 'bloom', x: p.x, z: p.z, r: 10, dps: power * (type === 'Insecte' ? 0.35 : 0.15), heal: type === 'Insecte' ? 0 : 2, life: 6, max: 6, tick: 0, type, color: ULT.color, slow: true });
    } else if (ULT.kind === 'nova') {
      near(p.x, p.z, 16).forEach((f) => hurt(f, power * 1.6, type, p, { knock: type === 'Combat' ? 22 : 14 }));
      g.fx.push({ kind: 'ring', x: p.x, z: p.z, y: p.y + 0.2, r: 1, max: 16, life: 0.6, dur: 0.6, color: ULT.color });
      g.fx.push({ kind: 'dome', x: p.x, z: p.z, y: p.y, r: 15, life: 0.6, dur: 0.6, color: ULT.color });
      fxBurst(p.x, p.y + 1, p.z, type, 60, 14);
      if (type === 'Feu') g.zones.push({ kind: 'firering', follow: true, x: p.x, z: p.z, r: 6, dps: power * 0.2, life: 4, max: 4, tick: 0, type, color: '#ff7a2a' });
    } else if (ULT.kind === 'wave') {
      close.forEach((f) => { hurt(f, power * 0.9, type, p, { knock: type === 'Glace' ? 4 : 30 }); if (type === 'Glace' && !f.boss) { f.stunT = 3; f.frozen = 3; } });
      g.fx.push({ kind: 'ring', x: p.x, z: p.z, y: p.y + 0.3, r: 1, max: 26, life: 0.9, dur: 0.9, color: ULT.color, thick: true });
      p.inv = Math.max(p.inv, 2.5);
      fxBurst(p.x, p.y + 1, p.z, type, 60, 14);
    } else {
      close.sort(() => Math.random() - 0.5).slice(0, 30).forEach((f, k) => {
        hurt(f, power * 1.2, type, null, { knock: 0 });
        if (!f.boss) f.stunT = 2.6;
        if (type === 'Électrik') zap([[f.x + rand(-2, 2), f.y + 18, f.z + rand(-2, 2)], [f.x + rand(-1, 1), f.y + 9, f.z], [f.x, chest(f), f.z]], '#ffe14a');
        else g.fx.push({ kind: 'meteor', x: f.x, z: f.z, y: f.y, delay: 0.15 + k * 0.03, life: 0.15 + k * 0.03 + 0.3, dur: 0.3, dmg: 0, blast: 1.6, type, color: ULT.color, rock: type === 'Roche' || type === 'Sol', ult: true });
        if (type === 'Poison') { f.burnT = 4; f.burnDmg = power * 0.06; }
        fxBurst(f.x, chest(f), f.z, type, 4, 5);
      });
    }
    return true;
  };

  /* ——— Montée de niveau, évolution en direct ——— */
  const levelOptions = () => {
    if (g.pendingEvo) return g.pendingEvo.choices.map((c) => ({ kind: 'evo', id: c.id, lv: 0 }));
    const opts = [];
    const ownedW = Object.keys(g.weapons); const ownedP = Object.keys(g.passives);
    ownedW.forEach((id) => { if (g.weapons[id].lv < MAX_LEVEL) opts.push({ kind: 'weapon', id, lv: g.weapons[id].lv + 1 }); });
    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS).filter((id) => !g.weapons[id] && canLearn(partner, id, E.unlocks)).forEach((id) => opts.push({ kind: 'weapon', id, lv: 1 }));
    ownedP.forEach((id) => { if (g.passives[id] < MAX_LEVEL) opts.push({ kind: 'passive', id, lv: g.passives[id] + 1 }); });
    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES).filter((id) => !g.passives[id] && canHold(id, E.unlocks)).forEach((id) => opts.push({ kind: 'passive', id, lv: 1 }));
    const shuffled = opts.sort(() => Math.random() - 0.5).slice(0, E.cards);
    const last = partner.evolutions[partner.evolutions.length - 1];
    const finalForm = partner.evolutions.length === 0 || g.player.form.dex === last.dex;
    if (partner.mega && finalForm && !g.player.mega) {
      if (partner.mega.choices && !g.megaChoice) return [...shuffled.slice(0, Math.max(0, E.cards - 2)), ...partner.mega.choices.map((c) => ({ kind: 'mega', id: c.id, lv: g.megaLv + 1 }))];
      const megaOpt = { kind: 'mega', id: g.megaChoice || 'mega', lv: g.megaLv + 1 };
      if (shuffled.length >= E.cards) shuffled[E.cards - 1] = megaOpt; else shuffled.push(megaOpt);
    }
    return shuffled.length ? shuffled : [{ kind: 'heal', id: 'oran', lv: 0 }];
  };
  const askLevel = () => {
    if (g.paused || !g.pendingLevels || g.over || g.evo || g.altarOpen) return;
    const opts = levelOptions();
    // Tout est au maximum : simple Baie Oran, sans couper la partie avec un menu
    if (opts.every((o) => o.kind === 'heal')) {
      const p = g.player; const heal = 30 * g.pendingLevels;
      p.hp = Math.min(p.maxHp, p.hp + heal); g.pendingLevels = 0;
      text(p.x, p.y + 2.8, p.z, `Niv. ${p.level} · +${heal} PV`, '#6bd17a');
      return;
    }
    g.paused = true;
    releasePointer();
    if (callbacks.onLevelUp) callbacks.onLevelUp(opts, g.player.level, g.rerolls);
  };
  // Séquence d'évolution : le temps ralentit, le Pokémon brille et change de forme
  const startEvo = (to, opts = {}) => {
    const p = g.player;
    g.evo = { t: 0, dur: 2.6, from: p.form.dex, to, name: to.name, before: p.form.name, color: opts.color || '#ffffff', mega: !!opts.mega, hp: opts.hp || 0, done: false };
    releasePointer();
  };
  const finishEvo = () => {
    const p = g.player; const e = g.evo;
    p.form = { name: e.to.name, dex: e.to.dex, mega: e.mega, scale: e.to.scale };
    g.evolutions += 1;
    p.maxHp += e.hp; p.hp = Math.min(p.maxHp, p.hp + e.hp + 20);
    if (e.mega) { p.mega = true; p.hp = p.maxHp; }
    banner(e.mega ? `${e.name} !` : `${e.before} évolue en ${e.name} !`, 3);
    shake(0.8);
    near(p.x, p.z, 10).forEach((f) => hurt(f, e.mega ? 40 : 10, partner.type, p, { knock: 14 }));
    g.fx.push({ kind: 'ring', x: p.x, z: p.z, y: p.y + 0.2, r: 1, max: 12, life: 0.6, dur: 0.6, color: e.color });
    particle(p.x, p.y + 1.4, p.z, '#ffffff', 40, 10, { f: FX.star4, size: 0.5 });
    particle(p.x, p.y + 1.4, p.z, e.color, 30, 8);
    g.evo = null;
    if (g.evoQueue.length) { const n = g.evoQueue.shift(); startEvo(n.to, n.opts); return; }
    askLevel();
  };
  const gainXp = (v) => {
    const p = g.player;
    p.xp += v * 1.1 * (1 + 0.08 * (g.passives.expshare || 0));
    while (p.xp >= p.need) {
      p.xp -= p.need;
      p.level += 1;
      p.need = xpToNext(p.level);
      g.pendingLevels += 1;
      const evo = partner.evolutions.find((e) => e.level === p.level);
      if (evo && evo.choices) g.pendingEvo = evo;
      else if (evo) {
        if (g.evo) g.evoQueue.push({ to: evo, opts: { hp: evo.hp } });
        else startEvo(evo, { hp: evo.hp });
      }
      g.fx.push({ kind: 'ring', x: p.x, z: p.z, y: p.y + 0.2, r: 0.5, max: 4, life: 0.4, dur: 0.4, color: '#7fe0ff' });
    }
    askLevel();
  };
  const choose = (opt) => {
    if (g.pendingEvo) {
      const evo = g.pendingEvo; g.pendingEvo = null;
      const c = evo.choices.find((x) => x.id === opt.id) || evo.choices[0];
      g.paused = false;
      startEvo({ name: c.name, dex: c.dex }, { hp: evo.hp, color: c.color });
      return;
    }
    if (opt.kind === 'weapon') {
      if (g.weapons[opt.id]) g.weapons[opt.id].lv += 1; else g.weapons[opt.id] = { lv: 1, timer: 0.2 };
    } else if (opt.kind === 'passive') {
      g.passives[opt.id] = (g.passives[opt.id] || 0) + 1;
      if (opt.id === 'hpup') { g.player.maxHp += 25; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 25); }
    } else if (opt.kind === 'mega') {
      if (partner.mega?.choices && !g.megaChoice) g.megaChoice = opt.id;
      g.megaLv += 1;
      if (g.megaLv >= MEGA_LEVELS) {
        const m = megaOf(partner, g.megaChoice) || partner.mega;
        g.pendingLevels = Math.max(0, g.pendingLevels - 1);
        g.paused = false;
        startEvo({ name: m.name, dex: m.sprite, scale: m.scale }, { mega: true, hp: 60, color: m.color || '#ff6ad5' });
        return;
      }
    } else {
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + (opt.kind === 'skip' ? 15 : 30));
    }
    g.pendingLevels = Math.max(0, g.pendingLevels - 1);
    g.paused = false;
    askLevel();
  };
  const reroll = () => { if (g.rerolls <= 0) return null; g.rerolls -= 1; return levelOptions(); };

  /* ——— Capture ——— */
  const catchable = (f) => !f.dead && !f.boss && !f.dormant && !(f.captureT > 0) && f.hp / f.maxHp <= 0.3;
  const catchTarget = () => {
    const p = g.player;
    let best = null; let bd = 10 * 10;
    near(p.x, p.z, 10).forEach((f) => { if (!catchable(f)) return; const d = dist2(f, p); if (d < bd) { bd = d; best = f; } });
    return best;
  };
  const throwBall = () => {
    if (g.over || g.paused || g.evo) return false;
    const p = g.player;
    if (g.balls <= 0) { text(p.x, p.y + 2.6, p.z, 'Plus de Poké Balls !', '#ff8a7a'); return false; }
    const f = catchTarget();
    if (!f) { text(p.x, p.y + 2.6, p.z, 'Affaiblis un Pokémon (PV rouges)', '#ffffff'); return false; }
    g.balls -= 1;
    castAt('ember', f);
    f.captureT = 999; f.stunT = 99;
    g.throws.push({ f, sx: p.x, sy: p.y + 1.4, sz: p.z, t: 0, dur: 0.45, phase: 'fly', shakes: 0 });
    return true;
  };
  const addAlly = (f) => {
    const max = E.allies;
    const ally = {
      id: f.id, def: f.def, dex: f.def.dex, types: f.types, x: f.x, z: f.z, y: f.y, alpha: !!f.alpha,
      hp: 60 + f.def.hp * 0.6 + g.player.level * 4, atkCd: 1, ko: 0, fx: 0, fz: 1, scale: f.alpha ? 1.4 : 1
    };
    ally.maxHp = ally.hp;
    if (g.allies.length >= max) {
      const weakest = g.allies.reduce((a, b) => (a.def.hp + (a.alpha ? 999 : 0) <= b.def.hp + (b.alpha ? 999 : 0) ? a : b));
      g.allies.splice(g.allies.indexOf(weakest), 1);
      banner(`${weakest.def.name} est relâché pour faire de la place`, 2.2);
    }
    g.allies.push(ally);
  };
  const updateThrows = (dt) => {
    g.throws = g.throws.filter((th) => {
      th.t += dt;
      const f = th.f;
      if (th.phase === 'fly') {
        const k = Math.min(1, th.t / th.dur);
        th.x = th.sx + (f.x - th.sx) * k; th.z = th.sz + (f.z - th.sz) * k;
        th.y = th.sy + (f.y + 0.6 - th.sy) * k + Math.sin(k * Math.PI) * 2.5;
        if (k >= 1) { th.phase = 'shake'; th.t = 0; particle(f.x, f.y + 0.8, f.z, '#ffffff', 16, 5); th.x = f.x; th.z = f.z; th.y = f.y + 0.32; }
        return true;
      }
      if (th.phase === 'shake') {
        th.wob = Math.sin(th.t * 14) * (Math.floor(th.t / 0.5) % 2 === 0 ? 0.5 : 0);
        if (th.t > 1.6) {
          const chance = f.league ? Math.min(0.95, catchChance(f, Math.max(0, f.hp) / f.maxHp, E.catchBonus) * (f.legendLeague ? 0.6 : 1.15)) : catchChance(f, Math.max(0, f.hp) / f.maxHp, E.catchBonus);
          if (Math.random() < chance) {
            f.dead = true;
            f.captureT = 0;
            g.caught.push(f.id);
            g.met[f.id] = 1;
            (f.types || []).forEach((t) => g.caughtTypes.push(t));
            const fam = f.league || familyOfDex(f.def.dex);
            if (fam && leagueReady.has(fam) && !g.leagueCaught.includes(fam)) {
              g.leagueCaught.push(fam);
              setTimeout(() => banner(`${f.def.name} rejoint ta Collection !`, 3.2), 2700);
            }
            if (f.alpha) g.alphaKills += 1;
            gainXp(f.def.xp * 3);
            addAlly(f);
            banner(`${f.def.name}${f.alpha ? ' Alpha' : ''} est capturé ! Il se bat à tes côtés`, 2.6);
            particle(f.x, f.y + 0.6, f.z, '#ffd23a', 30, 7, { up: 3 });
          } else {
            f.captureT = 0; f.stunT = 0.6;
            text(f.x, f.y + 2.4, f.z, 'Oh non ! Il s’est libéré', '#ff8a7a', true);
            particle(f.x, f.y + 0.6, f.z, '#e3342f', 16, 6);
          }
          return false;
        }
        return true;
      }
      return false;
    });
  };

  /* ——— Entrées ——— */
  const keys = new Set();
  const input = { jump: false, jumpPressed: false, dash: false, look: { x: 0, y: 0 }, stick: null };
  const KEYMAP = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => {
    if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
    if (e.code === 'Space') { if (!input.jump) input.jumpPressed = true; input.jump = true; e.preventDefault(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { input.dash = true; e.preventDefault(); }
    if ((e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'KeyC') && !e.repeat) throwBall();
    if (e.code === 'KeyR' && !e.repeat) ultimate();
    if ((e.code === 'Escape' || e.code === 'KeyP') && callbacks.onPauseKey) callbacks.onPauseKey();
  };
  const ku = (e) => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); if (e.code === 'Space') input.jump = false; };
  const canvas = renderer.domElement;
  let dragging = null;
  const locked = () => document.pointerLockElement === canvas;
  const releasePointer = () => { if (locked()) document.exitPointerLock?.(); };
  const md = (e) => {
    if (e.pointerType === 'mouse') {
      if (!locked() && !g.paused) canvas.requestPointerLock?.();
      dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, mouse: true };
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) input.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    else dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const mm = (e) => {
    if (locked()) { input.look.x += e.movementX; input.look.y += e.movementY; return; }
    if (input.stick && e.pointerId === input.stick.id) { input.stick.x = e.clientX; input.stick.y = e.clientY; return; }
    if (dragging && e.pointerId === dragging.id) {
      input.look.x += (e.clientX - dragging.x) * (dragging.mouse ? 1 : 1.5);
      input.look.y += (e.clientY - dragging.y) * (dragging.mouse ? 1 : 1.5);
      dragging.x = e.clientX; dragging.y = e.clientY;
    }
  };
  const mu = (e) => {
    if (input.stick && e.pointerId === input.stick.id) input.stick = null;
    if (dragging && e.pointerId === dragging.id) dragging = null;
  };
  const wheel = (e) => { g.cam.dist = clamp(g.cam.dist + Math.sign(e.deltaY) * 1.2, 7, 18); };
  const blur = () => { keys.clear(); input.jump = false; };
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', md);
  canvas.addEventListener('wheel', wheel, { passive: true });
  window.addEventListener('pointermove', mm);
  window.addEventListener('pointerup', mu);
  window.addEventListener('pointercancel', mu);
  canvas.style.touchAction = 'none';

  /* ——— Joueur ——— */
  const canSwim = () => formTypes(g.player.form.dex).some((t) => t === 'Eau' || t === 'Vol');
  const blocked = (x, z, y) => {
    const h = terrainAt(x, z);
    if (h > y + 0.75) return true; // falaise : il faut sauter
    if (!canSwim() && h < WATER - 0.05) return true; // l'eau : seulement les types Eau et Vol
    return false;
  };
  const chestCost = () => Math.round(12 * (1 + g.chestsOpened * 0.5));
  const updatePlayer = (dt) => {
    const p = g.player;
    const s = stats();
    g.cam.yaw -= input.look.x * 0.0028;
    g.cam.pitch = clamp(g.cam.pitch + input.look.y * 0.0022, 0.18, 1.2);
    input.look.x = 0; input.look.y = 0;
    let ix = 0; let iz = 0;
    if (keys.has('f')) iz -= 1;
    if (keys.has('b')) iz += 1;
    if (keys.has('l')) ix -= 1;
    if (keys.has('r')) ix += 1;
    if (input.stick) {
      const dx = input.stick.x - input.stick.ox; const dy = input.stick.y - input.stick.oy; const l = Math.hypot(dx, dy);
      if (l > 8) { ix = dx / Math.max(l, 55); iz = dy / Math.max(l, 55); }
    }
    const il = Math.hypot(ix, iz);
    const cy = Math.cos(g.cam.yaw); const sy = Math.sin(g.cam.yaw);
    let wx = 0; let wz = 0;
    if (il > 0) {
      const k = Math.min(1, il) / il;
      wx = (ix * cy + iz * sy) * k;
      wz = (-ix * sy + iz * cy) * k;
      if (p.castT <= 0) { const l = Math.hypot(wx, wz); p.fx = wx / l; p.fz = wz / l; }
    }
    p.moving = il > 0.1;
    const top = partner.speed * 2.6 * s.speed;
    const accel = p.grounded ? 60 : 26;
    if (p.dashT > 0) {
      p.dashT -= dt;
      if (g.weapons.bodyslam) {
        const v = WEAPONS.bodyslam.at(g.weapons.bodyslam.lv);
        near(p.x, p.z, 2.5).forEach((f) => { if (dist2(f, p) < (f.radius + 1) ** 2 && f.hitCd <= g.t) { f.hitCd = g.t + 0.3; hurt(f, v.dmg, 'Normal', p, { knock: 10 }); } });
      }
    } else {
      const tx = wx * top; const tz = wz * top;
      const dvx = tx - p.vx; const dvz = tz - p.vz; const dl = Math.hypot(dvx, dvz);
      const maxDv = accel * dt;
      if (dl > maxDv && dl > 0) { p.vx += (dvx / dl) * maxDv; p.vz += (dvz / dl) * maxDv; } else { p.vx = tx; p.vz = tz; }
    }
    // Saut
    // Saut : petite marge après avoir quitté le sol (descente de pente) et appui mémorisé un court instant
    if (input.jumpPressed) { p.jumpBuf = 0.18; input.jumpPressed = false; }
    p.jumpBuf = Math.max(0, (p.jumpBuf || 0) - dt);
    p.coyote = p.grounded ? 0.14 : Math.max(0, (p.coyote || 0) - dt);
    if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = 13; p.grounded = false; p.coyote = 0; p.jumpBuf = 0; p.jumping = true; puff(p.x, p.y + 0.2, p.z, 3); }
    // Esquive
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (input.dash && p.dashCd <= 0) {
      const d = il > 0 ? { x: wx, z: wz } : { x: p.fx, z: p.fz };
      const dl = Math.hypot(d.x, d.z) || 1;
      p.vx = (d.x / dl) * 24; p.vz = (d.z / dl) * 24;
      p.dashT = 0.2; g.dashes += 1;
      const slam = g.weapons.bodyslam ? WEAPONS.bodyslam.at(g.weapons.bodyslam.lv).cdr : 0;
      p.dashCd = 1.6 * (1 - slam);
      p.inv = Math.max(p.inv, 0.35);
      puff(p.x, p.y + 0.4, p.z, 5);
    }
    input.dash = false;
    // Gravité, murs, eau
    p.vy -= GRAV * dt;
    const nx = p.x + p.vx * dt; const nz = p.z + p.vz * dt;
    if (!blocked(nx, p.z, p.y)) p.x = nx; else p.vx *= -0.1;
    if (!blocked(p.x, nz, p.y)) p.z = nz; else p.vz *= -0.1;
    world.pushOut(p, 0.45);
    const rr = Math.hypot(p.x, p.z);
    if (rr > R * 0.9) { p.x *= (R * 0.9) / rr; p.z *= (R * 0.9) / rr; }
    p.y += p.vy * dt;
    const ground = Math.max(terrainAt(p.x, p.z), canSwim() ? WATER : -99);
    if (p.y <= ground && p.vy <= 0) { if (!p.grounded && p.vy < -14) puff(p.x, ground + 0.2, p.z, 5); p.y = ground; p.vy = 0; p.grounded = true; }
    else if (!p.jumping && p.vy <= 0 && p.y < ground + 0.5) { p.y = ground; p.vy = 0; p.grounded = true; } // colle au sol en descendant une pente
    else if (p.y > ground + 0.08) p.grounded = false;
    else p.y = ground;
    if (p.grounded) p.jumping = false;
    p.swimming = canSwim() && terrainAt(p.x, p.z) < WATER - 0.05;
    if (p.swimming && Math.random() < dt * 8 && p.moving) particle(p.x, WATER + 0.1, p.z, '#e8f6ff', 2, 2, { up: 1 });
    p.inv = Math.max(0, p.inv - dt);
    p.castT = Math.max(0, p.castT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.slowT = Math.max(0, (p.slowT || 0) - dt);
    p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;
    if (s.regen) p.hp = Math.min(p.maxHp, p.hp + s.regen * dt);
    g.maxNoHit = Math.max(g.maxNoHit, g.t - g.lastHitT);
    // Coffres (payés en Poké Dollars)
    world.chests.forEach((c) => {
      if (c.open || (c.x - p.x) ** 2 + (c.z - p.z) ** 2 > 2.4 ** 2 || Math.abs(p.y - c.y) > 2) return;
      const cost = chestCost();
      if (g.coins < cost) { c.hint = 0.5; return; }
      g.coins -= cost; c.open = true; g.chestsOpened += 1;
      const opt = levelOptions().filter((o) => o.kind === 'weapon' || o.kind === 'passive')[0];
      if (opt) {
        const bak = g.pendingLevels; g.pendingLevels += 1; choose(opt); g.pendingLevels = bak;
        banner(`Coffre : ${opt.kind === 'weapon' ? WEAPONS[opt.id].name : PASSIVES[opt.id].name}${opt.lv > 1 ? ` (niv. ${opt.lv})` : ''}`, 2.4);
      }
      g.balls += 1;
      particle(c.x, c.y + 1.2, c.z, '#ffd23a', 40, 9, { up: 4 });
      shake(0.15);
    });
    // Autels : rester 2 s dessus
    world.altars.forEach((a) => {
      if (a.used) return;
      const inside = (a.x - p.x) ** 2 + (a.z - p.z) ** 2 < 3.2 ** 2;
      a.charge = inside ? a.charge + dt : Math.max(0, a.charge - dt * 2);
      if (inside && Math.random() < 0.4) particle(a.x + rand(-1.5, 1.5), a.y + rand(0, 3), a.z + rand(-1.5, 1.5), '#d8b8ff', 1, 1, { up: 2, grav: 0 });
      if (a.charge >= 2) {
        a.used = true;
        const opts = [...BLESSINGS].sort(() => Math.random() - 0.5).slice(0, 3);
        g.altarOpen = true; g.paused = true; keys.clear(); releasePointer();
        particle(a.x, a.y + 3, a.z, '#c08aff', 30, 6);
        if (callbacks.onAltar) callbacks.onAltar(opts); else chooseBlessing(opts[0].id);
      }
    });
  };
  const chooseBlessing = (id) => {
    if (!g.altarOpen) return;
    const p = g.player;
    const b = BLESSINGS.find((x) => x.id === id) || BLESSINGS[0];
    g.altarOpen = false; g.paused = false; g.altarsUsed += 1;
    last = performance.now();
    if (b.id === 'might') g.bless.dmg *= 1.15;
    if (b.id === 'wind') g.bless.speed *= 1.12;
    if (b.id === 'life') { p.maxHp += 30; p.hp = p.maxHp; }
    if (b.id === 'magnet') g.orbs.forEach((o) => { o.pulled = true; });
    if (b.id === 'storm') g.ult = 1;
    if (b.id === 'fortune') { g.coins += 40; g.balls += 2; }
    banner(`${b.name} !`, 2.2);
    particle(p.x, p.y + 1.5, p.z, b.color, 30, 6);
    if (b.id === 'wisdom') gainXp(p.need - p.xp + 1);
    askLevel();
  };

  /* ——— Pokémon sauvages ——— */
  const updateFoes = (dt) => {
    const p = g.player;
    g.boss = null;
    g.foes.forEach((f) => {
      if (f.dead) return;
      if (f.boss && !f.dormant) g.boss = f;
      if (f.boss === 'final' && (!g.boss || g.boss.boss !== 'final')) g.boss = f;
      f.flash = Math.max(0, f.flash - dt);
      if (f.captureT > 0) return;
      // brûlure
      if (f.burnT > 0) { f.burnT -= dt; f.burnTick = (f.burnTick || 0) + dt; if (f.burnTick > 0.5) { f.burnTick = 0; hurt(f, f.burnDmg || 4, 'Feu', null, { silent: true }); } }
      if (f.dead) return;
      if (f.stunT > 0) { f.stunT -= dt; f.kx *= 0.85; f.kz *= 0.85; f.x += f.kx * dt * 8; f.z += f.kz * dt * 8; return; }
      const dx = p.x - f.x; const dz = p.z - f.z; const d = Math.hypot(dx, dz) || 1;
      // Endormis : Alphas dans les herbes, légendaire dans l'arène
      if (f.dormant) {
        const wake = f.boss ? 24 : 11;
        if (d < wake) {
          f.dormant = false;
          if (f.boss === 'final') g.finalAwake = true;
          banner(f.boss ? `${f.def.name} passe à l'attaque !` : `${f.def.name} Alpha surgit des hautes herbes !`, 2.4);
          shake(0.4);
          particle(f.x, f.y + 1, f.z, '#3fae47', 30, 7, { up: 2 });
        } else { f.y = f.boss ? arena.y : terrainAt(f.x, f.z); return; }
      }
      f.fx = dx / d; f.fz = dz / d;
      let sp = f.speed * (f.slowT > 0 ? 0.45 : 1);
      f.slowT = Math.max(0, f.slowT - dt);
      // IA
      f.stateT -= dt;
      if (f.boss) bossAI(f, dt, d);
      else if (f.def.ai === 'charge' && f.state === 'chase' && d < 9 && f.stateT <= 0) { f.state = 'wind'; f.stateT = 0.6; f.cx = dx / d; f.cz = dz / d; }
      else if (f.def.ai === 'spit' && d < 14 && d > 3) {
        f.shootCd -= dt;
        if (f.shootCd <= 0) {
          f.shootCd = rand(2.8, 4);
          g.shots.push({ kind: 'foe', x: f.x, y: f.y + 1, z: f.z, vx: (dx / d) * 9, vy: 0, vz: (dz / d) * 9, dmg: Math.round(f.dmg * 0.8), color: TYPE_COLORS[f.types[0]] || '#a35cc4', size: 0.3, life: 2, hit: new Set() });
        }
      }
      let mvx = (dx / d) * sp; let mvz = (dz / d) * sp;
      if (f.state === 'wind') { mvx = 0; mvz = 0; if (f.stateT <= 0) { f.state = 'dash'; f.stateT = 0.45; } }
      else if (f.state === 'dash') { mvx = f.cx * sp * 3.6; mvz = f.cz * sp * 3.6; if (f.stateT <= 0) { f.state = 'chase'; f.stateT = rand(1.5, 3); } }
      if (f.def.ai === 'fly' || f.def.ai === 'zigzag') { const w = Math.sin(g.t * 3 + f.phase) * 0.6; mvx += -f.fz * w * sp; mvz += f.fx * w * sp; }
      if (f.rooted > 0) { f.rooted -= dt; mvx = 0; mvz = 0; }
      // déplacement + recul
      const nx = f.x + (mvx + f.kx) * dt; const nz = f.z + (mvz + f.kz) * dt;
      const okX = f.fly || f.def.ai === 'ghost' || (!isWater(nx, f.z) && terrainAt(nx, f.z) < f.y + 2.2);
      const okZ = f.fly || f.def.ai === 'ghost' || (!isWater(f.x, nz) && terrainAt(f.x, nz) < f.y + 2.2);
      if (okX) f.x = nx;
      if (okZ) f.z = nz;
      f.kx *= Math.pow(0.02, dt); f.kz *= Math.pow(0.02, dt);
      if (!f.fly && f.def.ai !== 'ghost') world.pushOut(f, f.radius * 0.8);
      const gy = terrainAt(f.x, f.z);
      f.y = f.fly ? Math.max(gy, WATER) + 1.3 + Math.sin(g.t * 3 + f.phase) * 0.25 : f.def.ai === 'ghost' ? Math.max(gy, WATER) + 0.5 + Math.sin(g.t * 2 + f.phase) * 0.2 : f.y + (gy - f.y) * Math.min(1, dt * 12);
      // contact
      f.atkCd -= dt;
      if (d < f.radius + 0.6 && f.atkCd <= 0 && Math.abs(p.y - f.y) < 2.2) { f.atkCd = 0.9; hurtPlayer(f.dmg, f); }
      // alliés au contact
      g.allies.forEach((al) => {
        if (al.ko > 0) return;
        if ((al.x - f.x) ** 2 + (al.z - f.z) ** 2 < (f.radius + 0.5) ** 2 && f.atkCd <= 0) { f.atkCd = 0.9; al.hp -= f.dmg * 0.7; al.flash = 0.12; if (al.hp <= 0) { al.ko = 18; banner(`${al.def.name} est K.O. Il revient bientôt`, 1.8); } }
      });
    });
    // séparation entre sauvages
    buildGrid();
    grid.forEach((list) => {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i]; const b = list[j];
          const dx = b.x - a.x; const dz = b.z - a.z; const d = Math.hypot(dx, dz); const min = (a.radius + b.radius) * 0.85;
          if (d > 0 && d < min) { const k = (min - d) * 0.5 / d; if (!a.boss) { a.x -= dx * k; a.z -= dz * k; } if (!b.boss) { b.x += dx * k; b.z += dz * k; } }
        }
      }
    });
    g.foes = g.foes.filter((f) => !f.dead || f.captureT > 0);
    // on recycle les sauvages trop loin (pas les boss ni les Alphas)
    g.foes.forEach((f) => {
      if (f.boss || f.alpha || f.dormant) return;
      if ((f.x - p.x) ** 2 + (f.z - p.z) ** 2 > (f.league ? 34 : 60) ** 2) {
        const a = rand(0, TAU); const x = p.x + Math.cos(a) * 32; const z = p.z + Math.sin(a) * 32;
        if (Math.hypot(x, z) < R * 0.9 && (f.fly || !isWater(x, z))) { f.x = x; f.z = z; f.y = terrainAt(x, z); }
      }
    });
  };
  // Boss : poursuite + attaques annoncées au sol
  const bossAI = (f, dt, d) => {
    const p = g.player;
    f.skillCd -= dt;
    if (f.skillCd > 0) return;
    f.skillCd = f.boss === 'final' ? rand(2.4, 3.4) : rand(3.2, 4.4);
    const color = TYPE_COLORS[f.types[0]] || '#ff4a4a';
    const r = rand();
    if (r < 0.4) {
      // pluie de zones sur le joueur
      const n = f.boss === 'final' ? 5 : 3;
      for (let i = 0; i < n; i += 1) g.teles.push({ x: p.x + (i ? rand(-5, 5) : 0), z: p.z + (i ? rand(-5, 5) : 0), r: rand(2.4, 3.4), t: 0, dur: 1.1 + i * 0.12, dmg: Math.round(f.dmg * 1.2), color });
    } else if (r < 0.7) {
      // salve de projectiles en cercle
      const n = f.boss === 'final' ? 18 : 12;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * TAU + rand(0, 0.3);
        g.shots.push({ kind: 'foe', x: f.x, y: f.y + 1.4, z: f.z, vx: Math.cos(a) * 10, vy: 0, vz: Math.sin(a) * 10, dmg: Math.round(f.dmg * 0.7), color, size: 0.45, life: 3, hit: new Set() });
      }
      particle(f.x, f.y + 2, f.z, color, 20, 6);
    } else if (d < 26) {
      // charge annoncée
      g.teles.push({ x: f.x, z: f.z, r: 3, t: 0, dur: 0.9, dmg: 0, color, line: { ang: Math.atan2(p.z - f.z, p.x - f.x), len: 18 }, onDone: () => { f.state = 'dash'; f.stateT = 0.5; const a = Math.atan2(p.z - f.z, p.x - f.x); f.cx = Math.cos(a); f.cz = Math.sin(a); } });
      f.state = 'wind'; f.stateT = 0.9;
    }
  };
  const updateTeles = (dt) => {
    const p = g.player;
    g.teles = g.teles.filter((tg) => {
      tg.t += dt;
      if (tg.t < tg.dur) return true;
      if (tg.onDone) tg.onDone();
      if (tg.dmg && (p.x - tg.x) ** 2 + (p.z - tg.z) ** 2 < tg.r * tg.r) hurtPlayer(tg.dmg, tg);
      if (tg.dmg) { particle(tg.x, terrainAt(tg.x, tg.z) + 0.3, tg.z, tg.color, 16, 7); puff(tg.x, terrainAt(tg.x, tg.z) + 0.4, tg.z, 4); shake(0.1); }
      return false;
    });
  };

  /* ——— Alliés capturés ——— */
  const updateAllies = (dt) => {
    const p = g.player;
    g.allies.forEach((al, i) => {
      al.flash = Math.max(0, (al.flash || 0) - dt);
      if (al.ko > 0) {
        al.ko -= dt;
        if (al.ko <= 0) { al.hp = al.maxHp; al.x = p.x; al.z = p.z; particle(p.x, p.y + 1, p.z, '#ffffff', 12, 4); }
        return;
      }
      // formation derrière le joueur
      const a = Math.atan2(p.fz, p.fx) + Math.PI + (i - (g.allies.length - 1) / 2) * 0.8;
      const tx = p.x + Math.cos(a) * 2.6; const tz = p.z + Math.sin(a) * 2.6;
      const dx = tx - al.x; const dz = tz - al.z; const d = Math.hypot(dx, dz);
      const sp = Math.min(d * 3, partner.speed * 3.2);
      if (d > 0.2) { al.x += (dx / d) * sp * dt; al.z += (dz / d) * sp * dt; al.fx = dx / d; al.fz = dz / d; al.moving = true; } else al.moving = false;
      if (d > 20) { al.x = p.x; al.z = p.z; }
      const fly = al.def.flying;
      const gy = terrainAt(al.x, al.z);
      al.y = fly ? Math.max(gy, WATER) + 1.2 : Math.max(gy, WATER);
      // attaque : une boule de son type sur l'ennemi le plus proche
      al.atkCd -= dt;
      if (al.atkCd <= 0) {
        const t = nearest(al.x, al.z, 12);
        if (t) {
          al.atkCd = 1.1;
          const type = al.types[0];
          const dmg = (8 + g.player.level * 1.4 + al.def.hp * 0.12) * (al.alpha ? 1.6 : 1);
          const dx2 = t.x - al.x; const dz2 = t.z - al.z; const dy2 = chest(t) - (al.y + 0.8); const l = Math.hypot(dx2, dy2, dz2) || 1;
          g.shots.push({ kind: 'blast', x: al.x, y: al.y + 0.8, z: al.z, vx: (dx2 / l) * 18, vy: (dy2 / l) * 18, vz: (dz2 / l) * 18, dmg, blast: 1.3, type, color: TYPE_COLORS[type] || '#ffffff', size: 0.25, life: 1.2, hit: new Set(), ally: true });
          al.fx = dx2 / l; al.fz = dz2 / l; al.castT = 0.3;
        } else al.atkCd = 0.4;
      }
      al.castT = Math.max(0, (al.castT || 0) - dt);
    });
  };

  /* ——— Projectiles et zones ——— */
  const explode = (x, y, z, r, dmg, type, color) => {
    near(x, z, r + 1.5).forEach((f) => { if ((f.x - x) ** 2 + (f.z - z) ** 2 < (r + f.radius) ** 2) hurt(f, dmg, type, { x, z }, { knock: 4 }); });
    g.fx.push({ kind: 'ring', x, z, y: y - 0.6, r: 0.3, max: r, life: 0.3, dur: 0.3, color });
    g.fx.push({ kind: 'flash', x, y, z, life: 0.18, dur: 0.18, color, r });
    fxBurst(x, y, z, type, 12, 6);
    puff(x, y, z, 3);
  };
  const updateShots = (dt) => {
    const p = g.player;
    g.shots = g.shots.filter((sh) => {
      sh.life -= dt;
      if (sh.life <= 0) return false;
      if (sh.kind === 'lob') {
        sh.t += dt;
        const k = Math.min(1, sh.t / sh.dur);
        sh.x = sh.sx + (sh.tx - sh.sx) * k; sh.z = sh.sz + (sh.tz - sh.sz) * k;
        sh.y = sh.sy + (sh.ty + 0.3 - sh.sy) * k + Math.sin(k * Math.PI) * sh.h;
        if (k >= 1) {
          explode(sh.x, sh.y + 0.4, sh.z, sh.blast, sh.dmg, sh.type, sh.color);
          if (sh.puddle) g.zones.push({ kind: 'puddle', x: sh.x, z: sh.z, r: sh.zr, dps: sh.dps, life: sh.zlife, max: sh.zlife, tick: 0, type: sh.type, color: sh.color });
          return false;
        }
        return true;
      }
      if (sh.kind === 'homing' || sh.kind === 'bubble') {
        const t = nearest(sh.x, sh.z, 12);
        if (t && sh.kind === 'homing') {
          const dx = t.x - sh.x; const dz = t.z - sh.z; const l = Math.hypot(dx, dz) || 1;
          sh.vx += ((dx / l) * sh.sp - sh.vx) * Math.min(1, dt * 5); sh.vz += ((dz / l) * sh.sp - sh.vz) * Math.min(1, dt * 5);
        }
        sh.vy = (chest(t || p) - sh.y) * 2;
      }
      if (sh.kind === 'boomerang') {
        const d = Math.hypot(sh.x - sh.sx, sh.z - sh.sz);
        if (!sh.back && d > sh.out) { sh.back = true; sh.hit = new Set(); }
        if (sh.back) {
          const dx = p.x - sh.x; const dz = p.z - sh.z; const l = Math.hypot(dx, dz) || 1;
          const sp = Math.hypot(sh.vx, sh.vz);
          sh.vx = (dx / l) * sp; sh.vz = (dz / l) * sp;
          if (l < 1) return false;
          sh.life = Math.max(sh.life, 0.5);
        }
      }
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.z += sh.vz * dt;
      sh.trail = (sh.trail || 0) + dt;
      if (sh.trail > 0.035 && parts.length < MAXP) {
        sh.trail = 0;
        parts.push({ x: sh.x + rand(-0.1, 0.1), y: sh.y + rand(-0.1, 0.1), z: sh.z + rand(-0.1, 0.1), vx: 0, vy: sh.type === 'Feu' ? 1 : 0, vz: 0, life: 0.28, max: 0.28, col: sh.kind === 'foe' ? '#ff6a5a' : (sh.color || '#ffffff'), f: FX.dot, size: 0.22, rot: 0, spin: 0, grav: 0 });
      }
      if (sh.kind === 'foe') {
        if ((sh.x - p.x) ** 2 + (sh.z - p.z) ** 2 < (sh.size + 0.5) ** 2 && Math.abs(sh.y - (p.y + 1)) < 1.3) { hurtPlayer(sh.dmg, sh); return false; }
        return terrainAt(sh.x, sh.z) < sh.y + 0.5;
      }
      if (terrainAt(sh.x, sh.z) > sh.y + 0.4 && sh.kind !== 'boomerang') {
        if (sh.kind === 'blast') explode(sh.x, sh.y, sh.z, sh.blast, sh.dmg, sh.type, sh.color);
        return false;
      }
      const list = near(sh.x, sh.z, sh.size + 2);
      for (let i = 0; i < list.length; i += 1) {
        const f = list[i];
        if (f.dormant && !f.alpha) continue;
        if ((f.x - sh.x) ** 2 + (f.z - sh.z) ** 2 > (f.radius + sh.size) ** 2) continue;
        if (Math.abs(sh.y - chest(f)) > 1.6 * f.scale) continue;
        if (sh.pierce) {
          if (sh.hit.has(f)) continue;
          sh.hit.add(f);
          hurt(f, sh.dmg, sh.type, sh, { knock: 3 });
          if (sh.slow && !f.boss) f.slowT = 1.6;
          continue;
        }
        if (sh.kind === 'blast') { explode(sh.x, sh.y, sh.z, sh.blast, sh.dmg, sh.type, sh.color); return false; }
        hurt(f, sh.dmg, sh.type, sh, { knock: 2 });
        if (sh.burn) { f.burnT = 3; f.burnDmg = sh.burn * 0.5; }
        if (sh.trap && !f.boss) { f.stunT = sh.trap; f.trapped = sh.trap; }
        fxBurst(sh.x, sh.y, sh.z, sh.type, 6, 4);
        return false;
      }
      return true;
    });
    // zones au sol
    g.zones = g.zones.filter((z) => {
      z.life -= dt;
      if (z.life <= 0) return false;
      if (z.follow) { z.x = p.x; z.z = p.z; }
      if (z.kind === 'tornado') {
        z.x += z.vx * dt; z.z += z.vz * dt;
        near(z.x, z.z, z.r + 3).forEach((f) => { if (f.boss) return; const dx = z.x - f.x; const dz = z.z - f.z; const l = Math.hypot(dx, dz) || 1; if (l < z.r + 3) { f.x += (dx / l) * z.pull * 2 * dt; f.z += (dz / l) * z.pull * 2 * dt; } });
        if (Math.random() < 0.6) parts.push({ x: z.x + rand(-z.r, z.r) * 0.5, y: terrainAt(z.x, z.z) + rand(0, 3), z: z.z + rand(-z.r, z.r) * 0.5, vx: rand(-3, 3), vy: 3, vz: rand(-3, 3), life: 0.5, max: 0.5, col: null, f: z.type === 'Eau' ? FX.Eau : FX.Vol, size: 0.5, rot: 0, spin: 8, grav: 0 });
      }
      z.tick += dt;
      if (z.tick >= 0.3) {
        z.tick = 0;
        near(z.x, z.z, z.r + 1).forEach((f) => {
          if ((f.x - z.x) ** 2 + (f.z - z.z) ** 2 > (z.r + f.radius * 0.5) ** 2) return;
          hurt(f, z.dps * 0.3, z.type, null, { silent: z.kind === 'flame', knock: 0 });
          if (z.slow && !f.boss) f.slowT = 0.6;
        });
        if (z.heal && (p.x - z.x) ** 2 + (p.z - z.z) ** 2 < z.r * z.r) p.hp = Math.min(p.maxHp, p.hp + z.heal * 0.3);
      }
      if (z.kind === 'firering' || z.kind === 'flame') { if (Math.random() < 0.5) particle(z.x + rand(-z.r, z.r) * (z.kind === 'flame' ? 0.5 : 1), terrainAt(z.x, z.z) + 0.2, z.z + rand(-z.r, z.r) * (z.kind === 'flame' ? 0.5 : 1), null, 1, 1, { up: 3, grav: 0, life: 0.6, f: FX.Feu, size: 0.55, spin: 0 }); }
      return true;
    });
    // météores
    g.fx.forEach((fx) => {
      if (fx.kind !== 'meteor' || fx.done || fx.life > fx.dur) return;
      fx.done = true;
      if (!fx.ult) explode(fx.x, fx.y + 0.5, fx.z, fx.blast, fx.dmg, fx.type, fx.color);
      else fxBurst(fx.x, fx.y + 0.5, fx.z, fx.type, 10, 6);
      fxBurst(fx.x, fx.y + 0.5, fx.z, fx.rock ? 'Roche' : fx.type, 16, 8); puff(fx.x, fx.y + 0.5, fx.z, 4, '#e0d0b8');
      shake(0.08);
    });
  };

  /* ——— Ramassage ——— */
  const updatePickups = (dt) => {
    const p = g.player;
    const mag = stats().magnet;
    g.orbs = g.orbs.filter((o) => {
      if (!o.pulled) {
        o.vy -= 20 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; o.vx *= 0.92; o.vz *= 0.92;
        const gy = Math.max(terrainAt(o.x, o.z), WATER) + 0.35;
        if (o.y < gy) { o.y = gy; o.vy = 0; }
        if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 < mag * mag) o.pulled = true;
        return true;
      }
      const dx = p.x - o.x; const dy = p.y + 1 - o.y; const dz = p.z - o.z; const l = Math.hypot(dx, dy, dz);
      if (l < 0.8) { gainXp(o.v); return false; }
      const sp = 22;
      o.x += (dx / l) * sp * dt; o.y += (dy / l) * sp * dt; o.z += (dz / l) * sp * dt;
      return true;
    });
    g.drops = g.drops.filter((d) => {
      d.vy = (d.vy || 0) - 20 * dt; d.y += d.vy * dt;
      const gy = Math.max(terrainAt(d.x, d.z), WATER) + 0.35;
      if (d.y < gy) { d.y = gy; d.vy = 0; }
      d.age = (d.age || 0) + dt;
      const dd = (d.x - p.x) ** 2 + (d.z - p.z) ** 2;
      if (d.kind === 'coin' && dd < (mag * 1.2) ** 2) { const l = Math.sqrt(dd) || 1; d.x += ((p.x - d.x) / l) * 18 * dt; d.z += ((p.z - d.z) / l) * 18 * dt; }
      if (dd < 1.4 * 1.4 && Math.abs(p.y - d.y) < 2) {
        if (d.kind === 'coin') { const gain = Math.round(d.v * E.coins * 10) / 10; g.coins += gain; g.coinsTotal += gain; }
        if (d.kind === 'ball') { g.balls += 1; text(p.x, p.y + 2.4, p.z, '+1 Poké Ball', '#ffffff'); }
        if (d.kind === 'berry') { g.berries += 1; p.hp = Math.min(p.maxHp, p.hp + 30); text(p.x, p.y + 2.4, p.z, '+30', '#6bd17a', true); }
        return false;
      }
      return d.age < 60;
    });
  };

  /* ——— Missions ——— */
  const MISSIONS = [
    { id: 'kills', label: 'Mets K.O. 400 Pokémon', goal: 400, prog: () => g.kills },
    { id: 'catch', label: 'Capture 3 Pokémon', goal: 3, prog: () => g.caught.length },
    { id: 'alpha', label: 'Bats ou capture un Alpha', goal: 1, prog: () => g.alphaKills },
    { id: 'altars', label: 'Active 2 autels', goal: 2, prog: () => g.altarsUsed },
    { id: 'boss', label: 'Bats un boss', goal: 1, prog: () => g.bossKills },
    { id: 'super', label: 'Place 150 coups super efficaces', goal: 150, prog: () => g.superHits },
    { id: 'chests', label: 'Ouvre 3 coffres', goal: 3, prog: () => g.chestsOpened },
    { id: 'lvl', label: 'Atteins le niveau 12 avant 4:00', goal: 12, prog: () => g.player.level, fail: () => g.t > 240 },
    { id: 'nohit', label: 'Tiens 60 s sans être touché', goal: 60, prog: () => Math.floor(Math.max(g.maxNoHit, g.t - g.lastHitT)) }
  ].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => ({ ...m, value: 0, done: false, failed: false }));
  g.missions = MISSIONS;
  let missionAcc = 0;
  const missionTick = (dt) => {
    missionAcc += dt;
    if (missionAcc < 0.25) return;
    missionAcc = 0;
    const p = g.player;
    g.missions.forEach((m) => {
      if (m.done || m.failed) return;
      m.value = Math.min(m.goal, m.prog());
      if (m.value >= m.goal) {
        m.done = true;
        banner(`Mission accomplie : ${m.label} !`, 2.8);
        p.hp = Math.min(p.maxHp, p.hp + 30);
        g.balls += 1;
        chargeUlt(0.2);
        gainXp(Math.round(p.need * 0.5));
      } else if (m.fail && m.fail()) m.failed = true;
    });
  };

  /* ——— Boucle de jeu ——— */
  const update = (raw) => {
    if (g.paused) return;
    const p = g.player;
    if (g.over) { tickFx(raw * 0.4); return; }
    // Évolution : tout ralentit
    if (g.evo) {
      g.evo.t += raw;
      if (Math.random() < 0.6) particle(p.x + rand(-1.5, 1.5), p.y + rand(0, 0.5), p.z + rand(-1.5, 1.5), pick(['#ffffff', g.evo.color]), 1, 1, { up: 5, grav: 0, life: 1.4, f: FX.star4, size: 0.35 });
      if (g.evo.t >= g.evo.dur) finishEvo();
      tickFx(raw * 0.3);
      return;
    }
    const dt = raw;
    g.t += dt;
    updatePlayer(dt);
    if (g.paused) return;
    spawnTick(dt);
    buildGrid();
    Object.entries(g.weapons).forEach(([id, w]) => {
      if (MOVE_KIND[id] === 'orbit' || id === 'flametrail' || id === 'bodyslam') return;
      w.timer -= dt;
      if (w.timer <= 0) w.timer = fire(id, w) * stats().cd;
    });
    continuous(dt);
    updateFoes(dt);
    updateAllies(dt);
    updateTeles(dt);
    updateShots(dt);
    updateThrows(dt);
    updatePickups(dt);
    missionTick(dt);
    tickFx(dt);
  };
  const tickFx = (dt) => {
    g.fx = g.fx.filter((f) => { f.life -= dt; return f.life > 0; });
    g.zaps = g.zaps.filter((z) => { z.life -= dt; return z.life > 0; });
    g.texts = g.texts.filter((t) => { t.life -= dt; t.y += dt * 1.2; return t.life > 0; });
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const q = parts[i];
      q.life -= dt;
      if (q.life <= 0) { parts.splice(i, 1); continue; }
      q.vy -= q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += (q.spin || 0) * dt;
    }
    g.trauma = Math.max(0, g.trauma - dt * 1.6);
    g.hurtFlash = Math.max(0, g.hurtFlash - dt);
    if (g.flashScreen) { g.flashScreen.life -= dt; if (g.flashScreen.life <= 0) g.flashScreen = null; }
    if (g.banner) { g.banner.life -= dt; if (g.banner.life <= 0) g.banner = null; }
  };

  /* ——— Dessin ——— */
  const size = { w: 1, h: 1, dpr: 1 };
  const resize = () => {
    const w = mount.clientWidth || 800; const h = mount.clientHeight || 600;
    size.w = w; size.h = h; size.dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    overlay.width = Math.round(w * size.dpr); overlay.height = Math.round(h * size.dpr);
    overlay.style.width = `${w}px`; overlay.style.height = `${h}px`;
  };
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(mount);
  const proj = new THREE.Vector3();
  const toScreen = (x, y, z) => {
    proj.set(x, y, z).project(camera);
    if (proj.z > 1) return null;
    return { x: (proj.x * 0.5 + 0.5) * size.w, y: (-proj.y * 0.5 + 0.5) * size.h, off: Math.abs(proj.x) > 1 || Math.abs(proj.y) > 1 };
  };
  // préchargement des planches
  [partner.dex, ...partner.evolutions.flatMap((e) => [e.dex, ...(e.choices || []).map((c) => c.dex)])].forEach((d) => bank.preload(d, ['walk', 'idle', 'attack', 'shoot', 'hurt'], 4));
  [...new Set(roster.waves.flatMap((w) => w.foes))].forEach((id) => bank.preload(FOES[id].dex, ['walk'], MAX_FOES));
  [...roster.minis, roster.final].forEach((id) => bank.preload(FOES[id].dex, ['walk', 'idle'], 2));

  const render = () => {
    const p = g.player;
    const zoomIn = g.evo ? 0.55 : 1;
    // Caméra
    const cp = Math.cos(g.cam.pitch); const sp = Math.sin(g.cam.pitch);
    const dist = g.cam.dist * zoomIn;
    let cx = p.x + Math.sin(g.cam.yaw) * dist * cp;
    let cz = p.z + Math.cos(g.cam.yaw) * dist * cp;
    let cy = p.y + 1.4 + dist * sp;
    cy = Math.max(cy, terrainAt(cx, cz) + 1);
    const tr = g.trauma * g.trauma;
    cx += (Math.random() - 0.5) * tr; cy += (Math.random() - 0.5) * tr; cz += (Math.random() - 0.5) * tr;
    g.cam.x += (cx - g.cam.x) * 0.3; g.cam.y += (cy - g.cam.y) * 0.3; g.cam.z += (cz - g.cam.z) * 0.3;
    camera.position.set(g.cam.x, g.cam.y, g.cam.z);
    camera.lookAt(p.x, p.y + 1.3, p.z);
    const yaw = g.cam.yaw;
    world.tick(g.t);

    // Sprites
    let bi = 0;
    const blob = (x, z, y, r) => { if (bi < 700) { setInst(blobs, bi, x, y + 0.05, z, 0, r); bi += 1; } };
    // Joueur (et séquence d'évolution)
    const pScale = p.form.scale || 1;
    if (g.evo) {
      const e = g.evo; const k = e.t / e.dur;
      const freq = 2 + k * 14;
      const showNew = Math.sin(e.t * freq * Math.PI) > 0 && k > 0.25;
      bank.draw(showNew ? e.to.dex : e.from, 'idle', p.x, p.y, p.z, showNew ? (e.to.scale || 1) : pScale, g.t, 0, k < 0.15 ? k / 0.15 : 1, 1, 4);
    } else {
      let anim = p.moving ? 'walk' : 'idle';
      let at = g.t;
      if (p.castT > 0) { anim = p.castAnim; at = 0.32 - p.castT; }
      if (p.hurtT > 0) { anim = 'hurt'; at = 0.3 - p.hurtT; }
      const blink = p.inv > 0 && p.dashT <= 0 && Math.floor(g.t * 20) % 2 === 0;
      bank.draw(p.form.dex, anim, p.x, p.y + (p.swimming ? -0.3 : 0), p.z, pScale, at, rowFor(p.fx, p.fz, yaw), p.dashT > 0 ? 0.5 : 0, blink ? 0.45 : 1, 4, anim === 'walk' || anim === 'idle');
    }
    blob(p.x, p.z, Math.max(terrainAt(p.x, p.z), WATER), 0.55 * pScale);
    // Alliés
    g.allies.forEach((al) => {
      if (al.ko > 0) return;
      bank.draw(al.dex, al.castT > 0 ? 'shoot' : al.moving ? 'walk' : 'idle', al.x, al.y, al.z, al.scale, al.castT > 0 ? 0.3 - al.castT : g.t + al.x, rowFor(al.fx, al.fz, yaw), al.flash > 0 ? -0.8 : 0, 1, 6, !(al.castT > 0));
      blob(al.x, al.z, Math.max(terrainAt(al.x, al.z), WATER), 0.55 * al.scale);
    });
    // Sauvages
    const cam = camera.position;
    g.foes.forEach((f) => {
      if (f.dead && !(f.captureT > 0)) return;
      if (f.captureT > 0 && g.throws.some((th) => th.f === f && th.phase === 'shake')) return; // dans la Ball
      if ((f.x - cam.x) ** 2 + (f.z - cam.z) ** 2 > 110 * 110) return;
      const flash = f.flash > 0 ? 1 : f.stunT > 0 && !f.captureT ? 0.25 : 0;
      const hidden = f.dormant && f.alpha && inGrass(f.x, f.z);
      const anim = f.dormant || f.stunT > 0 ? 'idle' : 'walk';
      bank.draw(f.def.dex, anim, f.x + (f.state === 'wind' ? rand(-0.08, 0.08) : 0), f.y + (hidden ? -0.6 : 0), f.z, f.scale, g.t * (f.state === 'dash' ? 2 : 1) + f.phase, rowFor(f.fx, f.fz, yaw), flash, 1, f.boss || f.alpha ? 2 : MAX_FOES);
      blob(f.x, f.z, Math.max(terrainAt(f.x, f.z), WATER), f.radius * 0.85);
    });
    bank.flush();
    blobs.count = bi; blobs.instanceMatrix.needsUpdate = true;

    // Projectiles : sprite du type + halo lumineux
    const SPIN = { Normal: 1, Plante: 1, Fée: 1, Insecte: 0, Vol: 1, Roche: 1, Sol: 1, Ténèbres: 1, Acier: 0 };
    g.shots.forEach((sh, si) => {
      const ty = sh.type || 'Normal';
      let frame = fxFrameOfType(ty);
      if (sh.kind === 'bubble') frame = FX.bubble;
      if (sh.bone) frame = FX.bone;
      const base = sh.kind === 'foe' ? 0.9 : sh.ally ? 0.75 : 1;
      const size = Math.max(0.55, sh.size * 2.6) * base * (1 + Math.sin(g.t * 30 + si) * 0.06);
      const rot = SPIN[ty] || sh.bone ? g.t * 12 + si : sh.kind === 'foe' ? 0 : 0;
      fx.glow(sh.x, sh.y, sh.z, size * 2.1, sh.kind === 'foe' ? '#ff4a3a' : (sh.color || '#ffffff'), 0.55);
      fx.sprite(frame, sh.x, sh.y, sh.z, size, rot, 1, sh.kind === 'foe' ? '#ffd0d0' : null);
    });
    // Feuilles en orbite
    leafList.forEach((L, i) => fx.sprite(FX.leafbig, L.x, L.y, L.z, 0.9, -L.a + g.t * 10 + i, 1));
    // Bonbons Exp. (petit, moyen, Super Bonbon), pièces, Balls, baies
    let oi = 0;
    g.orbs.forEach((o) => {
      if (oi >= 1200) return;
      const tier = o.v >= 10 ? 2 : o.v >= 3 ? 1 : 0;
      const size = [0.55, 0.7, 0.9][tier];
      const yy = o.y + 0.15 + Math.abs(Math.sin(g.t * 5 + o.x)) * 0.18;
      fx.sprite([FX.candyS, FX.candyM, FX.candyL][tier], o.x, yy, o.z, size, Math.sin(g.t * 3 + o.z) * 0.35, 1);
      if (tier && oi < 220) fx.glow(o.x, yy, o.z, 1.2 * size + 0.4, tier === 2 ? '#8a6aff' : '#ffd23a', 0.3);
      oi += 1;
    });
    candyMesh.count = 0;
    g.drops.forEach((d) => {
      const yy = d.y + 0.25 + Math.sin(g.t * 3 + d.x) * 0.08;
      if (d.kind === 'coin') { fx.sprite(FX.coin0 + (Math.floor(g.t * 8 + d.x) % 4), d.x, yy, d.z, 0.6); fx.glow(d.x, yy, d.z, 0.9, '#ffd23a', 0.25); }
      else if (d.kind === 'ball') { fx.sprite(FX.ball, d.x, yy + 0.1, d.z, 0.8, Math.sin(g.t * 3 + d.x) * 0.2); fx.glow(d.x, yy, d.z, 1.4, '#ffffff', 0.3); }
      else { fx.sprite(FX.berry, d.x, yy, d.z, 0.7); fx.glow(d.x, yy, d.z, 1.1, '#5f8bff', 0.3); }
    });
    // Balls lancées
    g.throws.forEach((th) => {
      if (th.x === undefined) return;
      fx.sprite(FX.ball, th.x, th.y + 0.15, th.z, 0.85, th.phase === 'fly' ? g.t * 14 : (th.wob || 0) * 0.8);
      if (th.phase === 'shake') fx.glow(th.x, th.y + 0.15, th.z, 1.6, '#ffffff', 0.25 + Math.abs(th.wob || 0) * 0.6);
    });
    // Coffres ouverts : on les cache
    let ci = 0;
    world.chests.forEach((c) => { if (!c.open) { world.setInst(world.chestMesh, ci, c.x, c.y + Math.abs(Math.sin(g.t * 2 + c.x)) * 0.05, c.z, c.ang); ci += 1; } });
    world.chestMesh.count = ci; world.chestMesh.instanceMatrix.needsUpdate = true;

    // Sol : zones, ondes, attaques annoncées, autels, arène
    rings.begin(); discs.begin(); beams.begin(); pillars.begin();
    g.zones.forEach((z) => {
      const y = Math.max(terrainAt(z.x, z.z), WATER) + 0.08;
      const a = Math.min(1, z.life / 0.4) * Math.min(1, (z.max - z.life) / 0.2 + 0.3);
      if (z.kind === 'tornado') {
        pillars.add(z.x, y, z.z, z.r, '#e8f4ff', 0.28 * a, g.t * 6, 4.5, z.r);
        pillars.add(z.x, y, z.z, z.r * 0.5, z.color, 0.35 * a, -g.t * 8, 5, z.r * 0.5);
      } else {
        discs.add(z.x, y, z.z, z.r, z.color, (z.kind === 'flame' ? 0.3 : 0.22) * a);
        rings.add(z.x, y + 0.01, z.z, z.r, z.color, 0.7 * a);
      }
    });
    g.fx.forEach((f) => {
      const k = 1 - f.life / f.dur;
      if (f.kind === 'ring') {
        const r = f.r + (f.max - f.r) * Math.min(1, k * 1.3);
        if (f.vert) rings.add(f.x, f.y, f.z, r, f.color, 0.8 * (1 - k), yaw, r, r, Math.PI / 2);
        else { rings.add(f.x, f.y, f.z, r, f.color, 0.85 * (1 - k)); if (f.thick) discs.add(f.x, f.y - 0.02, f.z, r, f.color, 0.25 * (1 - k)); }
      } else if (f.kind === 'beam') {
        const m = beams.add(f.x, f.y, f.z, 1, f.color, 0.8 * (1 - k), Math.PI / 2 - f.ang, f.w * (1 - k * 0.6), f.len);
        if (m) m.scale.set(f.w * 2 * (1 - k * 0.6), f.w * 2 * (1 - k * 0.6), f.len);
        const m2 = beams.add(f.x, f.y, f.z, 1, '#ffffff', 0.9 * (1 - k), Math.PI / 2 - f.ang);
        if (m2) m2.scale.set(f.w * 0.8 * (1 - k), f.w * 0.8 * (1 - k), f.len);
      } else if (f.kind === 'meteor') {
        const fall = f.done ? 1 : 1 - Math.max(0, (f.life - f.dur) / f.delay);
        if (!f.done) {
          rings.add(f.x, f.y + 0.1, f.z, f.blast * fall, f.color, 0.6);
          const my = f.y + 0.5 + (1 - fall) * 18;
          const mx = f.x - (1 - fall) * 6;
          fx.sprite(f.rock ? FX.Roche : fxFrameOfType(f.type), mx, my, f.z, f.rock ? 1.6 : 1.3, g.t * 6);
          fx.glow(mx, my, f.z, 2.4, f.color, 0.5);
        } else discs.add(f.x, f.y + 0.1, f.z, f.blast * (0.5 + k), f.color, 0.4 * (1 - k));
      } else if (f.kind === 'slash') {
        fx.sprite(FX.slash, f.x, f.y, f.z, 1.4 + k * 0.8, f.rot ?? 0.6, 1 - k, f.color);
        fx.glow(f.x, f.y, f.z, 1.8, f.color, 0.4 * (1 - k));
      } else if (f.kind === 'flash') {
        fx.glow(f.x, f.y, f.z, (f.r || 1) * 3 * (0.6 + k), f.color, 0.8 * (1 - k));
        fx.sprite(FX.star4, f.x, f.y, f.z, (f.r || 1) * 1.2 * (0.5 + k), k * 2, 1 - k);
      } else if (f.kind === 'dome') {
        pillars.add(f.x, f.y, f.z, f.r * (0.3 + k), f.color, 0.4 * (1 - k), 0, 6 * (1 - k * 0.5), f.r * (0.3 + k));
      }
    });
    g.teles.forEach((tg) => {
      const y = Math.max(terrainAt(tg.x, tg.z), WATER) + 0.1;
      const k = tg.t / tg.dur;
      if (tg.line) {
        const m = beams.add(tg.x, y, tg.z, 1, '#ff3a2a', 0.25 + 0.3 * k, Math.PI / 2 - tg.line.ang);
        if (m) m.scale.set(tg.r * 2, 0.05, tg.line.len);
      } else {
        discs.add(tg.x, y, tg.z, tg.r * k, '#ff3a2a', 0.35);
        rings.add(tg.x, y + 0.01, tg.z, tg.r, '#ff3a2a', 0.8);
      }
    });
    world.altars.forEach((a) => {
      if (a.used) return;
      rings.add(a.x, a.y + 0.12, a.z, 3.2, '#c08aff', 0.5 + Math.sin(g.t * 3) * 0.2);
      if (a.charge > 0) discs.add(a.x, a.y + 0.1, a.z, 3.2 * Math.min(1, a.charge / 2), '#ffe14a', 0.35);
      pillars.add(a.x, a.y + 3, a.z, 0.5, '#d8b8ff', 0.3 + Math.sin(g.t * 4) * 0.1, g.t, 1.2 + Math.sin(g.t * 2) * 0.2, 0.5);
    });
    if (g.finalSpawned && !g.finalAwake) {
      pillars.add(arena.x, arena.y, arena.z, arena.r - 2, '#ffd23a', 0.14 + Math.sin(g.t * 3) * 0.06, g.t, 30, arena.r - 2);
    }
    // Évolution : colonne de lumière
    if (g.evo) {
      const k = g.evo.t / g.evo.dur;
      pillars.add(p.x, p.y, p.z, 1.4 + k * 0.6, '#ffffff', 0.35 + Math.sin(g.evo.t * 20) * 0.1, g.t * 3, 14, 1.4 + k * 0.6);
      pillars.add(p.x, p.y, p.z, 2.4, g.evo.color, 0.18, -g.t * 2, 10, 2.4);
      rings.add(p.x, p.y + 0.1, p.z, 2 + Math.sin(g.evo.t * 6) * 0.5, g.evo.color, 0.8);
    }
    // Hautes herbes avec Alpha : elles frémissent
    // Anneau sous le joueur (cyan), comme un repère de visée
    {
      const py = Math.max(terrainAt(p.x, p.z), WATER) + 0.07;
      rings.add(p.x, py, p.z, 1.05 * pScale, '#5fe6ff', 0.95);
      discs.add(p.x, py - 0.01, p.z, 1.05 * pScale, '#5fe6ff', 0.14);
    }
    // Futurs membres de la Collection : halo doré au sol
    g.foes.forEach((f) => { if (f.league && !f.dead) { const y = Math.max(terrainAt(f.x, f.z), WATER) + 0.08; rings.add(f.x, y, f.z, 1.4 * f.scale + Math.sin(g.t * 5) * 0.12, '#ffd23a', 0.9); } });
    rings.end(); discs.end(); beams.end(); pillars.end();

    // Éclairs : une chaîne d'étincelles
    g.zaps.forEach((z) => {
      if (!z.jit) z.jit = z.pts.map(() => [rand(-0.5, 0.5), rand(-0.5, 0.5), rand(-0.5, 0.5)]);
      for (let sgi = 0; sgi < z.pts.length - 1; sgi += 1) {
        const [ax, ay, az] = z.pts[sgi]; const [bx, by, bz] = z.pts[sgi + 1];
        const L = Math.hypot(bx - ax, by - ay, bz - az); const n = Math.max(2, Math.ceil(L / 0.45));
        for (let q = 0; q <= n; q += 1) {
          const k = q / n; const w = Math.sin(k * Math.PI);
          const jx = Math.sin(q * 2.3 + sgi * 7.1 + g.t * 40) * 0.35 * w; const jy = Math.cos(q * 1.7 + sgi * 3.3 + g.t * 37) * 0.35 * w;
          const x = ax + (bx - ax) * k + jx; const y = ay + (by - ay) * k + jy; const zz = az + (bz - az) * k - jx;
          fx.sprite(q % 3 === 0 ? FX.spark : FX.dot, x, y, zz, q % 3 === 0 ? 0.7 : 0.32, g.t * 9 + q, Math.min(1, z.life * 8), z.color);
          if (q % 2 === 0) fx.glow(x, y, zz, 1.1, z.color, 0.35);
        }
      }
    });
    // Particules
    for (let i = 0; i < parts.length; i += 1) {
      const q = parts[i];
      const k = q.life / (q.max || 1);
      const sz = q.size * (q.grow ? 1 + (1 - k) * q.grow : 0.4 + k * 0.6);
      fx.sprite(q.f ?? FX.dot, q.x, q.y, q.z, sz, q.rot || 0, Math.min(1, k * 2.5), q.col);
    }
    fx.flush();

    renderer.render(scene, camera);
    drawOverlay();
  };

  const ballIcon = (x, y, r) => {
    octx.fillStyle = '#e3342f'; octx.beginPath(); octx.arc(x, y, r, Math.PI, TAU); octx.fill();
    octx.fillStyle = '#f5f5f5'; octx.beginPath(); octx.arc(x, y, r, 0, Math.PI); octx.fill();
    octx.strokeStyle = '#1a1a1a'; octx.lineWidth = 2; octx.beginPath(); octx.arc(x, y, r, 0, TAU); octx.stroke();
    octx.beginPath(); octx.moveTo(x - r, y); octx.lineTo(x + r, y); octx.stroke();
    octx.fillStyle = '#ffffff'; octx.beginPath(); octx.arc(x, y, r * 0.32, 0, TAU); octx.fill(); octx.stroke();
  };
  const arrowTo = (x, y, z, color, label) => {
    const sp = toScreen(x, y, z);
    const { w, h } = size;
    let sx; let sy;
    if (sp && !sp.off) return;
    if (sp) { sx = sp.x; sy = sp.y; } else {
      // derrière la caméra : on inverse
      proj.set(x, y, z).project(camera);
      sx = (-proj.x * 0.5 + 0.5) * w; sy = (proj.y * 0.5 + 0.5) * h;
    }
    const a = Math.atan2(sy - h / 2, sx - w / 2);
    const ex = clamp(w / 2 + Math.cos(a) * w, 40, w - 40); const ey = clamp(h / 2 + Math.sin(a) * h, 110, h - 60);
    octx.save(); octx.translate(ex, ey); octx.rotate(a);
    octx.fillStyle = color; octx.globalAlpha = 0.75 + Math.sin(g.t * 8) * 0.25;
    octx.beginPath(); octx.moveTo(18, 0); octx.lineTo(-10, -12); octx.lineTo(-10, 12); octx.closePath(); octx.fill();
    octx.restore();
    if (label) {
      octx.font = '600 13px Fredoka, Nunito, sans-serif'; octx.textAlign = 'center';
      octx.lineWidth = 4; octx.strokeStyle = 'rgba(0,0,0,.75)'; octx.strokeText(label, ex - Math.cos(a) * 26, ey - Math.sin(a) * 26);
      octx.fillStyle = color; octx.fillText(label, ex - Math.cos(a) * 26, ey - Math.sin(a) * 26);
    }
  };
  const roundRect = (x, y, w, h, r) => {
    octx.beginPath();
    octx.moveTo(x + r, y); octx.lineTo(x + w - r, y); octx.quadraticCurveTo(x + w, y, x + w, y + r);
    octx.lineTo(x + w, y + h - r); octx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    octx.lineTo(x + r, y + h); octx.quadraticCurveTo(x, y + h, x, y + h - r);
    octx.lineTo(x, y + r); octx.quadraticCurveTo(x, y, x + r, y); octx.closePath();
  };
  const drawOverlay = () => {
    const { w, h, dpr } = size;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, w, h);
    const p = g.player;
    octx.textAlign = 'center';
    // Pokémon capturables : icône de Ball (et barre de vie rouge)
    near(p.x, p.z, 16).forEach((f) => {
      if (!catchable(f)) return;
      const sp = toScreen(f.x, f.y + spriteHeight(f.def.dex) * f.scale + 0.3, f.z);
      if (!sp) return;
      ballIcon(sp.x, sp.y - Math.abs(Math.sin(g.t * 5)) * 4, 7);
    });
    // Barres de vie (Alphas, boss, élites)
    g.foes.forEach((f) => {
      if (f.dead || !(f.alpha || f.elite || f.boss) || f.dormant) return;
      const sp = toScreen(f.x, f.y + spriteHeight(f.def.dex) * f.scale + 0.5, f.z);
      if (!sp || sp.off) return;
      const bw = f.boss ? 0 : f.alpha ? 70 : 40;
      if (!bw) return;
      octx.fillStyle = 'rgba(12,8,24,.85)'; octx.fillRect(sp.x - bw / 2 - 2, sp.y - 4, bw + 4, 8);
      octx.fillStyle = f.hp / f.maxHp <= 0.3 ? '#ff4a4a' : f.alpha ? '#ff6a3a' : '#ffd23a';
      octx.fillRect(sp.x - bw / 2, sp.y - 2, bw * Math.max(0, f.hp / f.maxHp), 4);
      if (f.alpha) { octx.font = '600 12px Fredoka, Nunito, sans-serif'; octx.fillStyle = '#ff6a3a'; octx.fillText('ALPHA', sp.x, sp.y - 8); }
    });
    // Charges annoncées
    g.foes.forEach((f) => {
      if (f.state !== 'wind' || f.dead) return;
      const sp = toScreen(f.x, f.y + spriteHeight(f.def.dex) * f.scale + 0.6, f.z);
      if (!sp) return;
      octx.font = '900 24px Fredoka, Nunito, sans-serif';
      octx.lineWidth = 4; octx.strokeStyle = '#000'; octx.strokeText('!', sp.x, sp.y);
      octx.fillStyle = '#ff3b2a'; octx.fillText('!', sp.x, sp.y);
    });
    // Barre de vie sous le joueur
    {
      const sp = toScreen(p.x, Math.max(terrainAt(p.x, p.z), WATER), p.z);
      if (sp && !g.evo) {
        const bw = 76; const bh = 11; const x0 = sp.x - bw / 2; const y0 = sp.y + 14;
        const k = Math.max(0, p.hp / p.maxHp);
        octx.fillStyle = 'rgba(20,16,40,.85)'; roundRect(x0 - 2, y0 - 2, bw + 4, bh + 4, 7); octx.fill();
        octx.fillStyle = '#ffffff'; roundRect(x0, y0, bw, bh, 5); octx.fill();
        octx.fillStyle = k > 0.5 ? '#3ccf6e' : k > 0.25 ? '#f5b82e' : '#ff4a4a'; if (k > 0) { roundRect(x0, y0, Math.max(6, bw * k), bh, 5); octx.fill(); }
        octx.font = '700 10px Fredoka, Nunito, sans-serif'; octx.textAlign = 'center';
        octx.fillStyle = '#14102a'; octx.fillText(`${Math.ceil(p.hp)}`, sp.x, y0 + 9);
      }
    }
    // Futurs membres de la Collection : étiquette dorée
    g.foes.forEach((f) => {
      if (!f.league || f.dead || f.captureT > 0) return;
      const sp = toScreen(f.x, f.y + spriteHeight(f.def.dex) * f.scale + 0.8, f.z);
      if (!sp || sp.off) return;
      octx.font = '700 12px Fredoka, Nunito, sans-serif'; octx.textAlign = 'center';
      const label = `★ COLLECTION · ${f.def.name}`; const tw = octx.measureText(label).width + 16;
      octx.fillStyle = '#ffd23a'; roundRect(sp.x - tw / 2, sp.y - 12, tw, 20, 10); octx.fill();
      octx.fillStyle = '#3a2400'; octx.fillText(label, sp.x, sp.y + 2);
      const bw = 64; const k = Math.max(0, f.hp / f.maxHp);
      octx.fillStyle = 'rgba(20,16,40,.85)'; octx.fillRect(sp.x - bw / 2 - 2, sp.y + 12, bw + 4, 7);
      octx.fillStyle = k <= 0.3 ? '#ff4a4a' : '#ffd23a'; octx.fillRect(sp.x - bw / 2, sp.y + 14, bw * k, 3);
    });
    // Chiffres
    g.texts.forEach((t) => {
      const sp = toScreen(t.x, t.y, t.z);
      if (!sp) return;
      const k = 1 - t.life / t.max;
      const pop = k < 0.15 ? 1 + (0.15 - k) * 4 : 1;
      octx.font = `700 ${(t.big ? 24 : 17) * pop}px Fredoka, Nunito, sans-serif`;
      octx.globalAlpha = Math.min(1, (t.life / t.max) * 2.5);
      octx.lineJoin = 'round'; octx.lineWidth = 5; octx.strokeStyle = 'rgba(20,16,40,.9)';
      octx.strokeText(t.txt, sp.x, sp.y);
      octx.fillStyle = t.color; octx.fillText(t.txt, sp.x, sp.y);
    });
    octx.globalAlpha = 1;
    // Prix des coffres
    world.chests.forEach((c) => {
      if (c.open || (c.x - p.x) ** 2 + (c.z - p.z) ** 2 > 20 ** 2) return;
      const sp = toScreen(c.x, c.y + 2, c.z);
      if (!sp) return;
      const cost = chestCost(); const ok = g.coins >= cost;
      octx.font = '600 14px Fredoka, Nunito, sans-serif';
      const label = `${cost} ₽`;
      const tw = octx.measureText(label).width + 14;
      octx.fillStyle = ok ? '#ffd447' : 'rgba(12,8,24,.85)'; octx.fillRect(sp.x - tw / 2, sp.y - 11, tw, 20);
      octx.fillStyle = ok ? '#0c0818' : '#ffd447'; octx.fillText(label, sp.x, sp.y + 4);
    });
    // Flèches : légendaire, Alphas réveillés
    if (g.finalSpawned && !g.over) {
      const f = g.foes.find((x) => x.boss === 'final' && !x.dead);
      if (f) arrowTo(f.x, f.y + 2, f.z, '#ffd23a', g.finalAwake ? '' : 'Arène');
    }
    g.foes.forEach((f) => { if (f.alpha && !f.dead && !f.dormant) arrowTo(f.x, f.y + 1, f.z, '#ff4a4a', ''); });
    // Vignettes
    if (g.hurtFlash > 0) {
      const gr = octx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
      gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,30,30,${g.hurtFlash * 1.2})`);
      octx.fillStyle = gr; octx.fillRect(0, 0, w, h);
    }
    if (g.flashScreen) { octx.fillStyle = g.flashScreen.color; octx.globalAlpha = g.flashScreen.life * 0.8; octx.fillRect(0, 0, w, h); octx.globalAlpha = 1; }
    if (g.evo) { const k = g.evo.t / g.evo.dur; octx.fillStyle = `rgba(255,255,255,${k > 0.9 ? (k - 0.9) * 8 : 0})`; octx.fillRect(0, 0, w, h); }
    // Mini-carte ronde, en haut à droite, orientée vers le haut de l'écran
    const ms = w < 640 ? 104 : 150;
    const mcx = w - ms / 2 - 16; const mcy = ms / 2 + 16;
    octx.save();
    octx.beginPath(); octx.arc(mcx, mcy, ms / 2 + 5, 0, TAU); octx.fillStyle = '#ffffff'; octx.fill();
    octx.beginPath(); octx.arc(mcx, mcy, ms / 2 + 2, 0, TAU); octx.fillStyle = '#ff4a5e'; octx.fill();
    octx.beginPath(); octx.arc(mcx, mcy, ms / 2, 0, TAU); octx.clip();
    const zoom = 2.2; const k = (ms / 240) * zoom;
    octx.translate(mcx, mcy); octx.rotate(g.cam.yaw); octx.translate(-(p.x + 120) * k, -(p.z + 120) * k);
    octx.imageSmoothingEnabled = false;
    octx.fillStyle = '#3f9be8'; octx.fillRect(-200, -200, 240 * k + 400, 240 * k + 400);
    octx.drawImage(world.mini, 0, 0, 240 * k, 240 * k);
    const mp = (x, z) => [(x + 120) * k, (z + 120) * k];
    const dot = (x, z, r, col, ring) => { const [mx, my] = mp(x, z); octx.beginPath(); octx.arc(mx, my, r, 0, TAU); if (ring) { octx.strokeStyle = col; octx.lineWidth = 2; octx.stroke(); } else { octx.fillStyle = col; octx.fill(); } };
    world.chests.forEach((c) => { if (!c.open) dot(c.x, c.z, 3.2, '#2f6fe0'); });
    world.altars.forEach((a) => { if (!a.used) dot(a.x, a.z, 4, '#9a5aff'); });
    g.foes.forEach((f, i) => { if (i % 2 === 0 && !f.dormant && !f.boss && !f.alpha && !f.league) dot(f.x, f.z, 1.3, 'rgba(230,40,40,.85)'); });
    g.foes.forEach((f) => {
      if (f.dead) return;
      if (f.alpha) { const pt = f.dormant ? f.grass : f; dot(pt.x, pt.z, f.dormant ? 6 + Math.sin(g.t * 4) * 2 : 4, '#ff3a3a', true); }
      if (f.league) dot(f.x, f.z, 4.5 + Math.sin(g.t * 6), '#ffd23a');
      if (f.boss && f.boss !== 'final') dot(f.x, f.z, 4, '#ff2347');
    });
    dot(arena.x, arena.z, arena.r * k, g.finalSpawned ? '#ffd23a' : 'rgba(255,255,255,.8)', true);
    const fin = g.foes.find((x) => x.boss === 'final' && !x.dead);
    if (fin) dot(fin.x, fin.z, 4 + Math.sin(g.t * 6), '#ffd23a');
    g.allies.forEach((al) => { if (al.ko <= 0) dot(al.x, al.z, 2.2, '#5fe6ff'); });
    octx.restore();
    // le joueur au centre : flèche
    octx.save(); octx.translate(mcx, mcy);
    octx.fillStyle = '#ffffff'; octx.strokeStyle = '#14102a'; octx.lineWidth = 2;
    octx.beginPath(); octx.moveTo(0, -7); octx.lineTo(5, 5); octx.lineTo(0, 2); octx.lineTo(-5, 5); octx.closePath(); octx.fill(); octx.stroke();
    octx.restore();
    // points cardinaux
    octx.font = '700 10px Fredoka, Nunito, sans-serif'; octx.fillStyle = '#14102a';
    [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['O', -Math.PI / 2]].forEach(([l, a]) => {
      const aa = a + g.cam.yaw; const rr2 = ms / 2 + 0.5;
      const lx = mcx + Math.sin(aa) * rr2; const ly = mcy - Math.cos(aa) * rr2;
      octx.beginPath(); octx.arc(lx, ly, 7, 0, TAU); octx.fillStyle = '#ffffff'; octx.fill();
      octx.fillStyle = l === 'N' ? '#ff2347' : '#14102a'; octx.textAlign = 'center'; octx.fillText(l, lx, ly + 3.5);
    });
    // Joystick tactile
    if (input.stick) {
      const r = mount.getBoundingClientRect();
      const ox = input.stick.ox - r.left; const oy = input.stick.oy - r.top;
      octx.strokeStyle = 'rgba(255,255,255,.6)'; octx.lineWidth = 3;
      octx.beginPath(); octx.arc(ox, oy, 50, 0, TAU); octx.stroke();
      const dx = input.stick.x - input.stick.ox; const dy = input.stick.y - input.stick.oy; const l = Math.min(50, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx);
      octx.fillStyle = 'rgba(255,255,255,.75)';
      octx.beginPath(); octx.arc(ox + Math.cos(a) * l, oy + Math.sin(a) * l, 20, 0, TAU); octx.fill();
    }
  };

  /* ——— Boucle ——— */
  let raf = 0;
  let last = performance.now();
  const frame = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = Math.max(last, now);
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const snapshot = () => {
    const p = g.player;
    const s = stats();
    return {
      t: g.t, kills: g.kills, level: p.level, hp: p.hp, maxHp: p.maxHp, xp: p.xp, need: p.need, form: p.form, isMega: p.mega,
      coins: Math.floor(g.coins), balls: g.balls, chestCost: chestCost(),
      weapons: Object.entries(g.weapons).map(([id, w]) => ({ id, lv: w.lv })),
      passives: Object.entries(g.passives).map(([id, lv]) => ({ id, lv })),
      megaLv: g.megaLv, megaChoice: g.megaChoice, megaLevels: MEGA_LEVELS,
      stats: { ...s, magnet: s.magnet * 20 },
      allies: g.allies.map((a) => ({ id: a.id, name: a.def.name, dex: a.dex, hp: Math.max(0, a.hp), maxHp: a.maxHp, ko: a.ko > 0 ? Math.ceil(a.ko) : 0, alpha: a.alpha, types: a.types })),
      maxAllies: E.allies,
      canCatch: !!catchTarget(),
      boss: g.boss && !g.boss.dead ? { name: g.boss.def.name, hp: Math.max(0, g.boss.hp), maxHp: g.boss.maxHp, types: g.boss.types, final: g.boss.boss === 'final' } : null,
      banner: g.banner?.text || null,
      dash: 1 - p.dashCd / 1.6,
      ult: g.ult, ultName: ULT.name, ultColor: ULT.color, ults: g.ults,
      missions: g.missions.map((m) => ({ id: m.id, label: m.label, goal: m.goal, value: m.value, done: m.done, failed: m.failed })),
      caught: g.caught, met: Object.keys(g.met), bosses: g.bossKills, alphaKills: g.alphaKills,
      typeKills: g.typeKills, caughtTypes: g.caughtTypes, leagueCaught: g.leagueCaught, dashes: g.dashes, berries: g.berries, evolutions: g.evolutions, coinsTotal: g.coinsTotal,
      chests: g.chestsOpened, altars: g.altarsUsed, superHits: g.superHits, noHit: g.maxNoHit,
      finalSpawned: g.finalSpawned, finalAt: FINAL_AT, evolving: !!g.evo, swim: canSwim(),
      slots: { weapons: MAX_WEAPONS, passives: MAX_PASSIVES }
    };
  };

  if (typeof window !== 'undefined' && window.__RUSH_DEBUG) window.__rush = { g, input, keys, world, camera, renderer, render, stop: () => cancelAnimationFrame(raf), shot: () => { render(); return renderer.domElement.toDataURL('image/jpeg', 0.85); }, gainXp, choose, throwBall, ultimate, chooseBlessing, spawnFoe, step: (n, dt = 1 / 30) => { for (let i = 0; i < n; i += 1) update(dt); } };

  return {
    snapshot, choose, reroll, ultimate, chooseBlessing, throwBall,
    jump(down) { if (down && !input.jump) input.jumpPressed = true; input.jump = down; },
    dash() { input.dash = true; },
    setPaused(v) {
      if (!v && g.altarOpen) return; // un autel attend sa bénédiction
      g.paused = v;
      if (v) releasePointer();
      if (!v) { last = performance.now(); askLevel(); }
    },
    destroy() {
      cancelAnimationFrame(raf);
      releasePointer();
      if (ro) ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', mu);
      window.removeEventListener('pointercancel', mu);
      canvas.removeEventListener('pointerdown', md);
      canvas.removeEventListener('wheel', wheel);
      bank.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); });
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
};
