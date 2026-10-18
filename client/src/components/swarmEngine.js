/**
 * Moteur du mode Swarm (canvas 2D) : déplacement, vagues, attaques automatiques, XP et montée de niveau.
 * Le composant React ne fait qu'afficher l'interface ; toute la partie vit ici.
 */
import {
  BOSSES, FOES, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, PASSIVES, RUN_SECONDS, WAVES, WEAPONS, spriteOf, xpToNext
} from './swarmData';

const TAU = Math.PI * 2;
const MAX_FOES = 280;
const CELL = 48;

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/* ——— Images ——— */
const images = new Map();
const imageOf = (dex) => {
  if (!images.has(dex)) {
    const img = new Image();
    img.src = spriteOf(dex);
    images.set(dex, img);
  }
  return images.get(dex);
};

/* ——— Herbe du terrain (motif répété) ——— */
let grassTile = null;
const grass = () => {
  if (grassTile) return grassTile;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#78c25a';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i += 1) {
    const px = Math.random() * 256;
    const py = Math.random() * 256;
    x.strokeStyle = Math.random() < 0.5 ? '#5ea845' : '#8fd36c';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px - 3, py - 7);
    x.moveTo(px + 3, py);
    x.lineTo(px + 4, py - 8);
    x.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    x.fillStyle = pick(['#ffffff', '#ffd23a', '#ff8fb1']);
    x.beginPath();
    x.arc(Math.random() * 256, Math.random() * 256, 2.6, 0, TAU);
    x.fill();
  }
  grassTile = c;
  return c;
};

export const createGame = (canvas, partner, callbacks = {}) => {
  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const stick = { active: false, ox: 0, oy: 0, x: 0, y: 0 };

  const g = {
    t: 0,
    paused: false,
    over: null,
    kills: 0,
    spawnAcc: 0,
    bossIdx: 0,
    pendingLevels: 0,
    banner: null,
    player: {
      x: 0,
      y: 0,
      hp: partner.hp,
      maxHp: partner.hp,
      speed: partner.speed,
      face: { x: 1, y: 0 },
      flip: false,
      inv: 0,
      level: 1,
      xp: 0,
      need: xpToNext(1),
      form: { name: partner.name, dex: partner.dex }
    },
    weapons: { [partner.weapon]: { lv: 1, timer: 0.4 } },
    passives: {},
    foes: [],
    shots: [],
    hazards: [],
    orbs: [],
    berries: [],
    fx: [],
    texts: [],
    boss: null
  };

  const stats = () => ({
    dmg: 1 + 0.12 * (g.passives.protein || 0),
    speed: 1 + 0.08 * (g.passives.carbos || 0),
    magnet: 72 * (1 + 0.35 * (g.passives.magnet || 0)),
    cd: 1 - 0.07 * (g.passives.quickclaw || 0),
    regen: 0.6 * (g.passives.leftovers || 0)
  });

  /* ——— Grille spatiale pour les collisions ——— */
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
    const x0 = Math.floor((x - r) / CELL);
    const x1 = Math.floor((x + r) / CELL);
    const y0 = Math.floor((y - r) / CELL);
    const y1 = Math.floor((y + r) / CELL);
    for (let i = x0; i <= x1; i += 1) {
      for (let j = y0; j <= y1; j += 1) {
        const cell = grid.get(`${i},${j}`);
        if (cell) out.push(...cell);
      }
    }
    return out;
  };
  const nearest = (x, y, range = 2000, skip = null) => {
    let best = null;
    let bd = range * range;
    g.foes.forEach((f) => {
      if (f.dead || (skip && skip.has(f))) return;
      const d = (f.x - x) ** 2 + (f.y - y) ** 2;
      if (d < bd) { bd = d; best = f; }
    });
    return best;
  };

  /* ——— Apparitions ——— */
  const view = () => ({ w: canvas.clientWidth || 800, h: canvas.clientHeight || 600 });
  const spawnFoe = (id, opts = {}) => {
    const def = FOES[id];
    const { w, h } = view();
    const r = Math.hypot(w, h) / 2 + 60;
    const a = rand(0, TAU);
    const grow = def.boss ? 1 : 1 + g.t / 140;
    const hp = Math.round(def.hp * grow);
    g.foes.push({
      id,
      def,
      x: g.player.x + Math.cos(a) * r,
      y: g.player.y + Math.sin(a) * r,
      hp,
      maxHp: hp,
      speed: def.speed * (def.boss ? 1 : rand(0.9, 1.1)),
      dmg: Math.max(2, Math.round(def.dmg * (def.boss ? 1 : 0.7 + g.t / 360))),
      size: def.size,
      flash: 0,
      leafCd: 0,
      shootCd: 2.5,
      phase: rand(0, TAU),
      boss: def.boss || null,
      ...opts
    });
  };

  const spawnTick = (dt) => {
    // Rythme : de plus en plus de monde, par grappes.
    const interval = Math.max(0.1, 0.55 - g.t / 900);
    const batch = 1 + Math.floor(g.t / 80);
    g.spawnAcc += dt;
    while (g.spawnAcc >= interval) {
      g.spawnAcc -= interval;
      const wave = [...WAVES].reverse().find((w) => g.t >= w.from) || WAVES[0];
      for (let i = 0; i < batch && g.foes.length < MAX_FOES; i += 1) spawnFoe(pick(wave.foes));
    }
    const next = BOSSES[g.bossIdx];
    if (next && g.t >= next.at) {
      g.bossIdx += 1;
      spawnFoe(next.id);
      g.banner = { text: next.title, life: 3.2 };
      if (callbacks.onBanner) callbacks.onBanner(next.title);
    }
  };

  /* ——— Dégâts ——— */
  const text = (x, y, txt, color = '#fff') => {
    if (g.texts.length > 70) g.texts.shift();
    g.texts.push({ x, y, txt, color, life: 0.7 });
  };

  const hurt = (f, amount) => {
    if (f.dead) return;
    const dmg = Math.max(1, Math.round(amount * stats().dmg));
    f.hp -= dmg;
    f.flash = 0.08;
    text(f.x + rand(-6, 6), f.y - f.size * 0.6, String(dmg), f.boss ? '#ffd23a' : '#fff');
    if (f.hp <= 0) kill(f);
  };

  const kill = (f) => {
    f.dead = true;
    g.kills += 1;
    const value = f.def.xp;
    if (f.boss === 'final') {
      g.over = 'win';
      if (callbacks.onEnd) callbacks.onEnd('win', snapshot());
      return;
    }
    if (f.boss) {
      for (let i = 0; i < 14; i += 1) g.orbs.push({ x: f.x + rand(-50, 50), y: f.y + rand(-50, 50), v: 3 });
      g.berries.push({ x: f.x, y: f.y, kind: 'candy' });
      g.fx.push({ kind: 'ring', x: f.x, y: f.y, r: 10, max: 140, life: 0.6, color: '#ffd23a' });
      return;
    }
    g.orbs.push({ x: f.x, y: f.y, v: value });
    if (Math.random() < 0.012) g.berries.push({ x: f.x, y: f.y, kind: 'oran' });
  };

  const hurtPlayer = (amount) => {
    const p = g.player;
    if (p.inv > 0 || g.over) return;
    p.hp -= amount;
    p.inv = 0.45;
    text(p.x, p.y - 40, `-${amount}`, '#ff5a5a');
    if (p.hp <= 0) {
      p.hp = 0;
      g.over = 'lose';
      if (callbacks.onEnd) callbacks.onEnd('lose', snapshot());
    }
  };

  /* ——— Attaques ——— */
  const fire = (id, w) => {
    const W = WEAPONS[id];
    const v = W.at(w.lv);
    const p = g.player;
    if (id === 'thunder') {
      let from = { x: p.x, y: p.y };
      let target = nearest(p.x, p.y, v.range);
      const hit = new Set();
      const points = [from];
      for (let i = 0; i <= v.chains && target; i += 1) {
        hurt(target, v.dmg);
        hit.add(target);
        points.push({ x: target.x, y: target.y });
        from = target;
        target = nearest(from.x, from.y, 160, hit);
      }
      if (points.length > 1) g.fx.push({ kind: 'bolt', points, life: 0.16, color: W.color });
      return v.cd;
    }
    if (id === 'ember') {
      const target = nearest(p.x, p.y, 520);
      const base = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.face.y, p.face.x);
      for (let i = 0; i < v.count; i += 1) {
        const a = base + (i - (v.count - 1) / 2) * 0.22;
        g.shots.push({ kind: 'ember', x: p.x, y: p.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 8, dmg: v.dmg, blast: v.blast, life: 1.4, pierce: false, color: W.color });
      }
      return v.cd;
    }
    if (id === 'watergun') {
      // Visée automatique sur l'ennemi le plus proche (sinon droit devant).
      const target = nearest(p.x, p.y, 420);
      const a = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.face.y, p.face.x);
      const aim = { x: Math.cos(a), y: Math.sin(a) };
      const dirs = [aim];
      if (v.back) dirs.push({ x: -aim.x, y: -aim.y });
      if (v.side) dirs.push({ x: -aim.y, y: aim.x }, { x: aim.y, y: -aim.x });
      dirs.forEach((d) => {
        g.shots.push({ kind: 'water', x: p.x, y: p.y, vx: d.x * v.speed, vy: d.y * v.speed, r: v.size, dmg: v.dmg, life: 0.75, pierce: true, hit: new Set(), color: W.color });
      });
      return v.cd;
    }
    if (id === 'quake') {
      near(p.x, p.y, v.radius).forEach((f) => { if (dist2(f, p) < v.radius ** 2) hurt(f, v.dmg); });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 20, max: v.radius, life: 0.45, color: W.color });
      return v.cd;
    }
    if (id === 'swift') {
      for (let i = 0; i < v.count; i += 1) {
        const a = (i / v.count) * TAU + g.t;
        g.shots.push({ kind: 'swift', x: p.x, y: p.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 7, dmg: v.dmg, life: 2.2, pierce: false, homing: true, speed: v.speed, color: W.color, spin: 0 });
      }
      return v.cd;
    }
    if (id === 'shadow') {
      const target = nearest(p.x, p.y, 700);
      const a = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.face.y, p.face.x);
      g.shots.push({ kind: 'shadow', x: p.x, y: p.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: v.size, dmg: v.dmg, life: 3.2, pierce: true, hit: new Set(), color: W.color });
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
      return { x: g.player.x + Math.cos(a) * v.radius, y: g.player.y + Math.sin(a) * v.radius, a, dmg: v.dmg };
    });
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
    if (callbacks.onLevelUp) callbacks.onLevelUp(levelOptions(), g.player.level);
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
        g.banner = { text: `${partner.name} évolue en ${evo.name} !`, life: 2.6 };
        g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 10, max: 120, life: 0.7, color: '#ffffff' });
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
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + 30);
    }
    g.pendingLevels = Math.max(0, g.pendingLevels - 1);
    g.paused = false;
    askLevel();
  };

  /* ——— Boucle ——— */
  const update = (dt) => {
    if (g.paused || g.over) return;
    g.t += dt;
    const p = g.player;
    const s = stats();

    // Déplacement
    let mx = 0;
    let my = 0;
    if (keys.has('left')) mx -= 1;
    if (keys.has('right')) mx += 1;
    if (keys.has('up')) my -= 1;
    if (keys.has('down')) my += 1;
    if (stick.active) {
      const dx = stick.x - stick.ox;
      const dy = stick.y - stick.oy;
      const len = Math.hypot(dx, dy);
      if (len > 8) { mx = dx / Math.max(len, 50); my = dy / Math.max(len, 50); }
    }
    const len = Math.hypot(mx, my);
    if (len > 0) {
      const k = Math.min(1, len) / len;
      p.x += mx * k * p.speed * 0.8 * s.speed * 60 * dt;
      p.y += my * k * p.speed * 0.8 * s.speed * 60 * dt;
      p.face = { x: mx / len, y: my / len };
      if (Math.abs(mx) > 0.1) p.flip = mx > 0;
    }
    p.inv = Math.max(0, p.inv - dt);
    if (s.regen) p.hp = Math.min(p.maxHp, p.hp + s.regen * dt);

    spawnTick(dt);
    buildGrid();

    // Ennemis
    g.foes.forEach((f) => {
      if (f.dead) return;
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const d = Math.hypot(dx, dy) || 1;
      let vx = (dx / d) * f.speed;
      let vy = (dy / d) * f.speed;
      // Séparation légère pour que la horde ne se superpose pas.
      near(f.x, f.y, f.size).forEach((o) => {
        if (o === f) return;
        const ox = f.x - o.x;
        const oy = f.y - o.y;
        const od = Math.hypot(ox, oy);
        const min = (f.size + o.size) * 0.42;
        if (od > 0 && od < min) {
          const push = ((min - od) / min) * (o.boss && !f.boss ? 2.4 : 1.2);
          vx += (ox / od) * push;
          vy += (oy / od) * push;
        }
      });
      f.x += vx * 60 * dt;
      f.y += vy * 60 * dt;
      f.flip = dx > 0;
      f.flash = Math.max(0, f.flash - dt);
      f.leafCd = Math.max(0, f.leafCd - dt);
      if (d < f.size * 0.45 + 16) hurtPlayer(f.dmg);
      // Trop loin derrière : on le replace devant.
      if (!f.boss && d > 1400) {
        const a = Math.atan2(p.y - f.y, p.x - f.x);
        f.x = p.x + Math.cos(a) * 700;
        f.y = p.y + Math.sin(a) * 700;
      }
      // Mewtwo tire des Psyko en étoile.
      if (f.def.shoots) {
        f.shootCd -= dt;
        if (f.shootCd <= 0) {
          f.shootCd = 2.1;
          const n = 10;
          for (let i = 0; i < n; i += 1) {
            const a = (i / n) * TAU + g.t;
            g.hazards.push({ x: f.x, y: f.y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, r: 10, dmg: 16, life: 4 });
          }
        }
      }
    });
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
        if (f.leafCd > 0 || dist2(f, leaf) > (f.size * 0.45 + 12) ** 2) return;
        f.leafCd = 0.35;
        hurt(f, leaf.dmg);
      });
    });

    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.homing) {
        if (!sh.target || sh.target.dead) sh.target = nearest(sh.x, sh.y, 600);
        if (sh.target) {
          const a = Math.atan2(sh.target.y - sh.y, sh.target.x - sh.x);
          const cur = Math.atan2(sh.vy, sh.vx);
          let diff = a - cur;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          const na = cur + Math.max(-0.18, Math.min(0.18, diff));
          sh.vx = Math.cos(na) * sh.speed;
          sh.vy = Math.sin(na) * sh.speed;
        }
        sh.spin += dt * 12;
      }
      sh.x += sh.vx * 60 * dt;
      sh.y += sh.vy * 60 * dt;
      sh.life -= dt;
      near(sh.x, sh.y, sh.r + 50).some((f) => {
        if (f.dead || dist2(f, sh) > (f.size * 0.45 + sh.r) ** 2) return false;
        if (sh.pierce) {
          if (sh.hit.has(f)) return false;
          sh.hit.add(f);
          hurt(f, sh.dmg);
          return false;
        }
        if (sh.kind === 'ember') {
          near(sh.x, sh.y, sh.blast + 50).forEach((o) => { if (dist2(o, sh) < (sh.blast + o.size * 0.4) ** 2) hurt(o, sh.dmg); });
          g.fx.push({ kind: 'blast', x: sh.x, y: sh.y, r: sh.blast, life: 0.25, color: sh.color });
        } else {
          hurt(f, sh.dmg);
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
      if (dist2(h, p) < (h.r + 14) ** 2) { hurtPlayer(h.dmg); h.life = 0; }
    });
    g.hazards = g.hazards.filter((h) => h.life > 0);

    // XP et baies
    g.orbs.forEach((o) => {
      const d = Math.sqrt(dist2(o, p));
      if (d < s.magnet || o.pulled) {
        o.pulled = true;
        const k = Math.min(1, (9 * 60 * dt) / Math.max(d, 1));
        o.x += (p.x - o.x) * k;
        o.y += (p.y - o.y) * k;
      }
      if (d < 18) { o.got = true; gainXp(o.v); }
    });
    g.orbs = g.orbs.filter((o) => !o.got);
    if (g.orbs.length > 400) {
      // Trop d'XP au sol : on fusionne les plus lointaines.
      const extra = g.orbs.splice(0, g.orbs.length - 300);
      g.orbs.push({ x: extra[0].x, y: extra[0].y, v: extra.reduce((a, o) => a + o.v, 0) });
    }
    g.berries.forEach((b) => {
      if (dist2(b, p) < 30 ** 2) {
        b.got = true;
        if (b.kind === 'oran') {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          text(p.x, p.y - 40, '+30 PV', '#6bd17a');
        } else {
          gainXp(p.need - p.xp);
          text(p.x, p.y - 40, 'Super Bonbon !', '#ffd23a');
        }
      }
    });
    g.berries = g.berries.filter((b) => !b.got);

    g.fx.forEach((f) => { f.life -= dt; });
    g.fx = g.fx.filter((f) => f.life > 0);
    g.texts.forEach((tx) => { tx.life -= dt; tx.y -= 30 * dt; });
    g.texts = g.texts.filter((tx) => tx.life > 0);
    if (g.banner) {
      g.banner.life -= dt;
      if (g.banner.life <= 0) g.banner = null;
    }
  };

  /* ——— Dessin ——— */
  const drawSprite = (dex, x, y, size, flip, alpha = 1, white = false) => {
    const img = imageOf(dex);
    if (!img.complete || !img.naturalWidth) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, TAU);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    if (white) ctx.filter = 'brightness(4)';
    const s = size * 1.7;
    ctx.drawImage(img, -s / 2, -s * 0.62, s, s);
    ctx.restore();
  };

  const render = () => {
    const { w, h } = view();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = g.player;
    const cx = w / 2 - p.x;
    const cy = h / 2 - p.y;

    // Herbe
    const tile = grass();
    const ox = ((cx % 256) + 256) % 256;
    const oy = ((cy % 256) + 256) % 256;
    for (let x = ox - 256; x < w; x += 256) {
      for (let y = oy - 256; y < h; y += 256) ctx.drawImage(tile, x, y);
    }

    ctx.save();
    ctx.translate(cx, cy);

    // XP au sol (bonbons) et baies
    g.orbs.forEach((o) => {
      const color = o.v >= 10 ? '#ff5a7a' : o.v >= 3 ? '#4fd17a' : '#4fa8ff';
      const r = o.v >= 10 ? 7 : o.v >= 3 ? 6 : 4.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath();
      ctx.arc(o.x - r * 0.3, o.y - r * 0.3, r * 0.35, 0, TAU);
      ctx.fill();
    });
    g.berries.forEach((b) => {
      const bob = Math.sin(g.t * 4) * 2;
      if (b.kind === 'oran') {
        ctx.fillStyle = '#3d7bdb';
        ctx.beginPath();
        ctx.arc(b.x, b.y + bob, 9, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.ellipse(b.x + 4, b.y - 9 + bob, 6, 3, -0.5, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = '#7b5bd6';
        ctx.beginPath();
        ctx.roundRect(b.x - 10, b.y - 7 + bob, 20, 14, 7);
        ctx.fill();
        ctx.fillStyle = '#ffd23a';
        ctx.fillRect(b.x - 3, b.y - 7 + bob, 6, 14);
      }
    });

    // Ennemis (du haut vers le bas pour la profondeur)
    const drawList = [...g.foes].sort((a, b) => a.y - b.y);
    drawList.forEach((f) => {
      ctx.fillStyle = 'rgba(20,40,10,.25)';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y + f.size * 0.32, f.size * 0.42, f.size * 0.14, 0, 0, TAU);
      ctx.fill();
      const bob = Math.sin(g.t * 9 + f.phase) * (f.boss ? 1.5 : 2.5);
      drawSprite(f.def.dex, f.x, f.y + bob, f.size, f.flip, 1, f.flash > 0);
      if (!f.boss && f.hp < f.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(f.x - 14, f.y - f.size * 0.7, 28, 4);
        ctx.fillStyle = '#ff5a5a';
        ctx.fillRect(f.x - 14, f.y - f.size * 0.7, 28 * Math.max(0, f.hp / f.maxHp), 4);
      }
    });

    // Joueur
    ctx.strokeStyle = partnerColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 20, 24, 9, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const blink = p.inv > 0 && Math.floor(p.inv * 20) % 2 === 0;
    drawSprite(p.form.dex, p.x, p.y + Math.sin(g.t * 10) * 1.5, 56, p.flip, blink ? 0.35 : 1);

    // Feuilles
    leaves().forEach((leaf) => {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.a * 3);
      ctx.fillStyle = '#5fbf3c';
      ctx.strokeStyle = '#2f6e1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.kind === 'swift') {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.spin);
        ctx.fillStyle = '#ffe680';
        ctx.strokeStyle = '#c9a400';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const r = i % 2 ? 4 : 10;
          const a = (i / 10) * TAU - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }
      const grad = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, sh.r * 1.6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, sh.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, sh.r * 1.6, 0, TAU);
      ctx.fill();
    });
    g.hazards.forEach((hz) => {
      const grad = ctx.createRadialGradient(hz.x, hz.y, 1, hz.x, hz.y, hz.r * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#e05ad6');
      grad.addColorStop(1, 'rgba(120,0,140,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hz.x, hz.y, hz.r * 1.5, 0, TAU);
      ctx.fill();
    });

    // Effets
    g.fx.forEach((f) => {
      if (f.kind === 'bolt') {
        ctx.strokeStyle = '#fffbe0';
        ctx.lineWidth = 4;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        f.points.forEach((pt, i) => {
          if (!i) { ctx.moveTo(pt.x, pt.y); return; }
          const prev = f.points[i - 1];
          const mx = (prev.x + pt.x) / 2 + rand(-12, 12);
          const my = (prev.y + pt.y) / 2 + rand(-12, 12);
          ctx.lineTo(mx, my);
          ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (f.kind === 'ring') {
        if (!f.life0) f.life0 = f.life;
        const k = 1 - f.life / f.life0;
        const r = f.r + (f.max - f.r) * Math.min(1, k);
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = Math.min(1, f.life * 3);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.kind === 'blast') {
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.life * 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1.2 - f.life * 2), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // Chiffres de dégâts
    ctx.font = '800 13px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    g.texts.forEach((tx) => {
      ctx.globalAlpha = Math.min(1, tx.life * 2.5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.strokeText(tx.txt, tx.x, tx.y);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.txt, tx.x, tx.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // Joystick tactile
    if (stick.active) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(stick.ox, stick.oy, 46, 0, TAU);
      ctx.stroke();
      const dx = stick.x - stick.ox;
      const dy = stick.y - stick.oy;
      const l = Math.min(46, Math.hypot(dx, dy));
      const a = Math.atan2(dy, dx);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.arc(stick.ox + Math.cos(a) * l, stick.oy + Math.sin(a) * l, 18, 0, TAU);
      ctx.fill();
    }
  };

  const partnerColor = partner.color;

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
  if (typeof window !== 'undefined' && window.__SWARM_DEBUG) window.__swarm = g;

  let raf = 0;
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
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
    remaining: Math.max(0, RUN_SECONDS - g.t)
  });

  return {
    snapshot,
    choose,
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
