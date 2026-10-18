/**
 * Carte du mode Swarm : une grande zone bornée par la forêt, coupée par une rivière (3 ponts),
 * avec une place centrale, des ruines, un étang, un cercle de pierres et des statues.
 * Tout est dessiné en « pixel art » à demi-résolution (1 pixel d'art = 2 pixels du monde).
 */
import { drawPokemon } from './swarmSprites';

export const WORLD = { w: 4400, h: 3200, border: 300 };
const ART = 2;
const CELL = 16;
const BUCKET = 256;
const TAU = Math.PI * 2;

export const TILE = { FREE: 0, WATER: 1, WALL: 2, BRIDGE: 3 };

/* ——— Hasard reproductible ——— */
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash2 = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t) => t * t * (3 - 2 * t);
const noise = (x, y, s) => {
  const xi = Math.floor(x); const yi = Math.floor(y);
  const xf = smooth(x - xi); const yf = smooth(y - yi);
  const a = hash2(xi, yi, s); const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s); const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax; const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
};
const polyDist = (pts, x, y, pad = 0) => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1]; const b = pts[i];
    if (x < Math.min(a.x, b.x) - pad - best || x > Math.max(a.x, b.x) + pad + best) continue;
    const d = segDist(x, y, a.x, a.y, b.x, b.y);
    if (d < best) best = d;
  }
  return best;
};

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Rend les bords nets (alpha 0 ou 1) pour garder un rendu pixel art. */
const crisp = (c) => {
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
  x.putImageData(d, 0, 0);
  return c;
};
const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return c;
};
const circle = (x, cx, cy, r, color) => { x.fillStyle = color; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); };

/* ——— Décors (dessinés une fois, à demi-résolution) ——— */
const makeTree = (rng, kind = 'oak', dark = false) => {
  const c = canvas(46, 54);
  const x = c.getContext('2d');
  const pal = dark
    ? ['#173d22', '#21572c', '#2c6e35', '#3b8540']
    : kind === 'autumn' ? ['#6b2f17', '#a24a1c', '#cf6d22', '#f0a23a'] : ['#1f4f26', '#2f7a33', '#46a03c', '#77c44f'];
  // ombre au sol
  x.fillStyle = 'rgba(0,0,0,.28)';
  x.beginPath(); x.ellipse(23, 49, 15, 4.5, 0, 0, TAU); x.fill();
  // tronc + racines
  x.fillStyle = '#4a2a17';
  x.fillRect(20, 30, 6, 19);
  x.fillRect(16, 46, 14, 3);
  x.fillStyle = '#6b3d20';
  x.fillRect(21, 30, 2, 17);
  if (kind === 'pine') {
    const tiers = [[23, 4, 8], [23, 12, 12], [23, 21, 16], [23, 30, 19]];
    tiers.forEach(([tx, ty, hw], i) => {
      x.fillStyle = pal[0];
      x.beginPath(); x.moveTo(tx, ty - 3); x.lineTo(tx + hw + 1, ty + 12); x.lineTo(tx - hw - 1, ty + 12); x.closePath(); x.fill();
      x.fillStyle = pal[1 + (i % 2)];
      x.beginPath(); x.moveTo(tx, ty - 1); x.lineTo(tx + hw - 1, ty + 10); x.lineTo(tx - hw + 1, ty + 10); x.closePath(); x.fill();
      x.fillStyle = pal[3];
      x.fillRect(tx - 2, ty + 2, 2, 5);
    });
    return crisp(c);
  }
  const blobs = [[23, 22, 15], [13, 26, 10], [33, 26, 10], [18, 14, 10], [29, 14, 10], [23, 9, 9]];
  blobs.forEach(([bx, by, r]) => circle(x, bx, by + 1, r + 1, pal[0]));
  blobs.forEach(([bx, by, r]) => circle(x, bx, by, r, pal[1]));
  blobs.forEach(([bx, by, r]) => circle(x, bx - r * 0.25, by - r * 0.3, r * 0.65, pal[2]));
  // touffes de feuillage
  for (let i = 0; i < 26; i += 1) {
    const a = rng() * TAU; const d = rng() * 14;
    const fx = Math.round(23 + Math.cos(a) * d); const fy = Math.round(18 + Math.sin(a) * d * 0.9);
    x.fillStyle = rng() < 0.5 ? pal[3] : pal[0];
    x.fillRect(fx, fy, 2, 1);
  }
  circle(x, 17, 10, 3, pal[3]);
  return crisp(c);
};

const makeBush = (rng) => {
  const c = canvas(24, 16);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(12, 13, 10, 3, 0, 0, TAU); x.fill();
  [[7, 9, 6], [16, 9, 6], [12, 6, 6]].forEach(([bx, by, r]) => circle(x, bx, by, r, '#2a6a2c'));
  [[7, 8, 5], [16, 8, 5], [12, 5, 5]].forEach(([bx, by, r]) => circle(x, bx, by, r, '#3f9238'));
  for (let i = 0; i < 6; i += 1) { x.fillStyle = '#6cc04a'; x.fillRect(4 + Math.floor(rng() * 15), 3 + Math.floor(rng() * 6), 2, 1); }
  if (rng() < 0.45) for (let i = 0; i < 3; i += 1) { x.fillStyle = '#e8433c'; x.fillRect(5 + Math.floor(rng() * 13), 4 + Math.floor(rng() * 6), 2, 2); }
  return crisp(c);
};

const makeRock = (rng, big = false, tint = 0) => {
  const w = big ? 30 : 20; const h = big ? 24 : 15;
  const c = canvas(w, h);
  const x = c.getContext('2d');
  const base = tint ? ['#5d5560', '#7d7480', '#9f97a2', '#c4bdc6'] : ['#55525a', '#77737e', '#9b97a2', '#c7c3cc'];
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(w / 2, h - 3, w / 2 - 2, 3, 0, 0, TAU); x.fill();
  x.fillStyle = base[0];
  x.beginPath(); x.ellipse(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 2, 0, 0, TAU); x.fill();
  x.fillStyle = base[1];
  x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 3, 0, 0, TAU); x.fill();
  x.fillStyle = base[2];
  x.beginPath(); x.ellipse(w / 2 - 2, h / 2 - 2, w / 3, h / 4, -0.3, 0, TAU); x.fill();
  x.fillStyle = base[3];
  x.fillRect(Math.round(w / 2 - 5), Math.round(h / 2 - 5), 3, 1);
  x.fillStyle = base[0];
  x.fillRect(Math.round(w / 2 + 2), Math.round(h / 2), 1, 3);
  if (rng() < 0.5) { x.fillStyle = '#4a8f3a'; x.fillRect(2, h - 7, 4, 2); }
  return crisp(c);
};

const makeCrackedRock = () => {
  const c = canvas(26, 22);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(13, 19, 11, 3, 0, 0, TAU); x.fill();
  x.fillStyle = '#6b4a35'; x.beginPath(); x.ellipse(13, 11, 12, 9, 0, 0, TAU); x.fill();
  x.fillStyle = '#946a4a'; x.beginPath(); x.ellipse(13, 10, 11, 8, 0, 0, TAU); x.fill();
  x.fillStyle = '#b98c62'; x.beginPath(); x.ellipse(10, 7, 6, 4, -0.3, 0, TAU); x.fill();
  x.strokeStyle = '#3d2618'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(13, 3); x.lineTo(11, 8); x.lineTo(15, 11); x.lineTo(12, 17); x.stroke();
  x.beginPath(); x.moveTo(15, 11); x.lineTo(20, 13); x.stroke();
  return crisp(c);
};

const makePillar = (broken) => {
  const h = broken ? 22 : 40;
  const c = canvas(18, h + 6);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(9, h + 2, 8, 3, 0, 0, TAU); x.fill();
  x.fillStyle = '#9c968c'; x.fillRect(2, h - 3, 14, 4);
  x.fillStyle = '#cfc8bb'; x.fillRect(4, 4, 10, h - 6);
  x.fillStyle = '#e9e3d6'; x.fillRect(5, 4, 3, h - 6);
  x.fillStyle = '#a9a295'; x.fillRect(12, 4, 2, h - 6);
  if (!broken) { x.fillStyle = '#e9e3d6'; x.fillRect(2, 1, 14, 4); x.fillStyle = '#a9a295'; x.fillRect(2, 4, 14, 1); }
  else { x.fillStyle = '#cfc8bb'; x.beginPath(); x.moveTo(4, 4); x.lineTo(8, 1); x.lineTo(11, 5); x.lineTo(14, 2); x.lineTo(14, 6); x.lineTo(4, 6); x.fill(); }
  x.fillStyle = '#8b857a'; x.fillRect(8, Math.round(h / 2), 1, 5); x.fillRect(9, Math.round(h / 2) + 4, 2, 1);
  return crisp(c);
};

// Stèle gravée d'un Zarbi.
const makeStele = () => {
  const c = canvas(20, 40);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(10, 36, 9, 3, 0, 0, TAU); x.fill();
  x.fillStyle = '#5b5866'; x.beginPath(); x.moveTo(3, 37); x.lineTo(4, 6); x.lineTo(10, 1); x.lineTo(16, 6); x.lineTo(17, 37); x.fill();
  x.fillStyle = '#7a7686'; x.beginPath(); x.moveTo(5, 35); x.lineTo(6, 7); x.lineTo(10, 3); x.lineTo(14, 7); x.lineTo(15, 35); x.fill();
  x.fillStyle = '#2b2933';
  circle(x, 10, 17, 4, '#2b2933'); circle(x, 10, 17, 2, '#7a7686'); x.fillStyle = '#2b2933';
  x.fillRect(9, 21, 2, 7); x.fillRect(7, 11, 1, 3); x.fillRect(12, 11, 1, 3);
  return crisp(c);
};

const makePedestal = () => {
  const c = canvas(34, 18);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(17, 15, 16, 3, 0, 0, TAU); x.fill();
  x.fillStyle = '#8f8a80'; x.fillRect(2, 6, 30, 9);
  x.fillStyle = '#d6d0c3'; x.fillRect(1, 2, 32, 5);
  x.fillStyle = '#b4aea1'; x.fillRect(4, 8, 26, 1);
  return crisp(c);
};

/* ——— Construction de la carte ——— */
export const buildWorld = (seed = Math.floor(Math.random() * 1e9)) => {
  const rng = mulberry32(seed);
  const { w: W, h: H, border: B } = WORLD;

  // Rivière : ligne brisée + méandres.
  const ctrl = [[-200, 300], [900, 600], [1700, 860], [2500, 1150], [3200, 1500], [3800, 1840], [4600, 2180]];
  const river = [];
  let s = 0;
  for (let i = 1; i < ctrl.length; i += 1) {
    const [ax, ay] = ctrl[i - 1]; const [bx, by] = ctrl[i];
    const len = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / len; const ny = (bx - ax) / len;
    for (let d = 0; d < len; d += 30) {
      const k = d / len;
      const wob = Math.sin((s + d) / 260 + seed % 7) * 38 + Math.sin((s + d) / 90) * 8;
      river.push({ x: ax + (bx - ax) * k + nx * wob, y: ay + (by - ay) * k + ny * wob });
    }
    s += len;
  }
  const riverHW = 66;
  const riverY = (x) => {
    for (let i = 1; i < river.length; i += 1) {
      if (river[i].x >= x) {
        const a = river[i - 1]; const b = river[i];
        return a.y + ((b.y - a.y) * (x - a.x)) / ((b.x - a.x) || 1);
      }
    }
    return river[river.length - 1].y;
  };

  // Ponts : on les place sur la rivière, perpendiculaires au courant.
  const bridges = [0.3, 0.55, 0.78].map((f) => {
    const i = Math.floor(river.length * f);
    const a = river[i - 1]; const b = river[i + 1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    return { x: river[i].x, y: river[i].y, ang, half: 46, len: riverHW + 26 };
  });
  const onBridge = (x, y) => bridges.some((br) => {
    const dx = x - br.x; const dy = y - br.y;
    const along = dx * Math.cos(br.ang) + dy * Math.sin(br.ang);
    const across = -dx * Math.sin(br.ang) + dy * Math.cos(br.ang);
    return Math.abs(along) < br.half - 6 && Math.abs(across) < br.len + 10;
  });

  const plaza = { x: 2200, y: 1720, r: 230 };
  const pond = { x: 900, y: 2480, r: 170 };
  const ruins = { x: 3430, y: 2560 };
  const henge = { x: 3500, y: 880 };
  const garden = { x: 820, y: 1500 };
  const start = { x: plaza.x, y: plaza.y + 40 };

  // Chemins de terre qui relient tout ça.
  const bridgeEnd = (br, side) => ({
    x: br.x - Math.sin(br.ang) * (br.len + 40) * side,
    y: br.y + Math.cos(br.ang) * (br.len + 40) * side
  });
  const wiggle = (pts) => {
    const out = [];
    for (let i = 1; i < pts.length; i += 1) {
      const a = pts[i - 1]; const b = pts[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = -(b.y - a.y) / len; const ny = (b.x - a.x) / len;
      for (let d = 0; d <= len; d += 24) {
        const k = d / len;
        const wob = Math.sin(k * Math.PI) * Math.sin(d / 140 + i) * 26;
        out.push({ x: a.x + (b.x - a.x) * k + nx * wob, y: a.y + (b.y - a.y) * k + ny * wob });
      }
    }
    return out;
  };
  const paths = [
    [plaza, bridgeEnd(bridges[0], 1)],
    [plaza, bridgeEnd(bridges[1], 1)],
    [plaza, bridgeEnd(bridges[2], 1)],
    [plaza, ruins],
    [plaza, pond],
    [plaza, garden],
    [bridgeEnd(bridges[1], -1), henge],
    [bridgeEnd(bridges[2], -1), henge]
  ].map(wiggle);
  const pathW = 22;

  /* ——— Grille de collisions ——— */
  const gw = Math.ceil(W / CELL); const gh = Math.ceil(H / CELL);
  const grid = new Uint8Array(gw * gh);
  const pathMask = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const x = i * CELL + CELL / 2; const y = j * CELL + CELL / 2;
      let v = TILE.FREE;
      if (x < B || y < B || x > W - B || y > H - B) v = TILE.WALL;
      else if (Math.hypot(x - pond.x, y - pond.y) < pond.r * (0.86 + 0.14 * noise(x / 60, y / 60, 3))) v = TILE.WATER;
      else if (Math.abs(y - riverY(x)) < riverHW + 80 && polyDist(river, x, y) < riverHW) v = onBridge(x, y) ? TILE.BRIDGE : TILE.WATER;
      grid[j * gw + i] = v;
      if (v === TILE.FREE && paths.some((p) => polyDist(p, x, y) < pathW + 10)) pathMask[j * gw + i] = 1;
    }
  }
  const tileAt = (x, y) => {
    const i = Math.floor(x / CELL); const j = Math.floor(y / CELL);
    if (i < 0 || j < 0 || i >= gw || j >= gh) return TILE.WALL;
    return grid[j * gw + i];
  };
  const isPath = (x, y) => pathMask[Math.floor(y / CELL) * gw + Math.floor(x / CELL)] === 1;

  /* ——— Décors ——— */
  const props = [];
  const buckets = new Map();
  const addProp = (p) => {
    props.push(p);
    const k = `${Math.floor(p.x / BUCKET)},${Math.floor(p.y / BUCKET)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(p);
    return p;
  };
  const sprites = {
    oak: Array.from({ length: 4 }, () => makeTree(rng, 'oak')),
    autumn: Array.from({ length: 2 }, () => makeTree(rng, 'autumn')),
    pine: Array.from({ length: 2 }, () => makeTree(rng, 'pine')),
    darkOak: Array.from({ length: 3 }, () => makeTree(rng, 'oak', true)),
    darkPine: Array.from({ length: 2 }, () => makeTree(rng, 'pine', true)),
    bush: Array.from({ length: 4 }, () => makeBush(rng)),
    rock: Array.from({ length: 3 }, () => makeRock(rng, false)),
    boulder: Array.from({ length: 3 }, (_, i) => makeRock(rng, true, i % 2)),
    cracked: makeCrackedRock(),
    pillar: makePillar(false),
    broken: makePillar(true),
    stele: makeStele(),
    pedestal: makePedestal()
  };
  const pickOf = (list) => list[Math.floor(rng() * list.length)];
  const clearOf = (x, y, r) => {
    if (tileAt(x, y) !== TILE.FREE || isPath(x, y)) return false;
    if (Math.hypot(x - plaza.x, y - plaza.y) < plaza.r + 90) return false;
    if (Math.hypot(x - start.x, y - start.y) < 320) return false;
    if (Math.hypot(x - pond.x, y - pond.y) < pond.r + 30) return false;
    if (bridges.some((br) => Math.hypot(x - br.x, y - br.y) < 170)) return false;
    // pas trop près de l'eau
    for (let a = 0; a < TAU; a += TAU / 6) if (tileAt(x + Math.cos(a) * r, y + Math.sin(a) * r) === TILE.WATER) return false;
    const k0 = Math.floor(x / BUCKET); const k1 = Math.floor(y / BUCKET);
    for (let i = k0 - 1; i <= k0 + 1; i += 1) {
      for (let j = k1 - 1; j <= k1 + 1; j += 1) {
        const list = buckets.get(`${i},${j}`);
        if (list && list.some((p) => Math.hypot(p.x - x, p.y - y) < r + (p.space || 20))) return false;
      }
    }
    return true;
  };
  const sprProp = (x, y, spr, solid, extra = {}) => addProp({
    x, y, spr, w: spr.width * ART, h: spr.height * ART, solid, space: extra.space || solid + 16, tall: spr.height * ART > 60, ...extra
  });

  // Forêt de bordure : plusieurs rangs de grands arbres sombres (le mur de la carte).
  const rim = (x, y) => sprProp(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 24, rng() < 0.3 ? pickOf(sprites.darkPine) : pickOf(sprites.darkOak), 0, { rim: true });
  for (let y = 40; y < H; y += 54) {
    for (let x = 20; x < B + 20; x += 62) { rim(x, y); rim(W - x, y + 27); }
  }
  for (let x = B; x < W - B; x += 60) {
    for (let y = 40; y < B + 20; y += 56) { rim(x, y); rim(x + 30, H - y + 30); }
  }

  // Place centrale : anneau de rochers avec des ouvertures pour les chemins.
  for (let a = 0; a < TAU; a += TAU / 22) {
    const x = plaza.x + Math.cos(a) * (plaza.r + 34);
    const y = plaza.y + Math.sin(a) * (plaza.r + 26);
    if (isPath(x, y) || paths.some((p) => polyDist(p, x, y) < pathW + 26)) continue;
    sprProp(x, y, pickOf(sprites.boulder), 18, { space: 10 });
  }
  // Cercle de pierres (henge) au nord, ruines au sud-est, jardin des statues à l'ouest.
  for (let a = 0; a < TAU; a += TAU / 10) {
    sprProp(henge.x + Math.cos(a) * 150, henge.y + Math.sin(a) * 110, sprites.stele, 12, { space: 8 });
  }
  const ruinSpots = [[-160, -60], [-90, -80], [0, -100], [90, -80], [160, -60], [-160, 60], [160, 60], [-60, 90], [60, 90]];
  ruinSpots.forEach(([dx, dy], i) => sprProp(ruins.x + dx, ruins.y + dy, i % 3 === 1 ? sprites.broken : sprites.pillar, 12, { space: 8 }));
  [[-40, 10], [30, -20], [70, 30], [-110, 0]].forEach(([dx, dy]) => sprProp(ruins.x + dx, ruins.y + dy, pickOf(sprites.rock), 0, { space: 6 }));
  const statues = [
    { x: garden.x - 90, y: garden.y, dex: 150 },
    { x: garden.x + 90, y: garden.y, dex: 143 },
    { x: ruins.x, y: ruins.y - 10, dex: 95 }
  ];
  statues.forEach((st) => addProp({ ...st, statue: true, spr: sprites.pedestal, w: 68, h: 36, solid: 26, space: 40, tall: true }));
  [[-150, 70], [150, 70], [-150, -70], [150, -70]].forEach(([dx, dy]) => sprProp(garden.x + dx, garden.y + dy, sprites.pillar, 12, { space: 8 }));

  // Bosquets : les arbres se regroupent par zones (bruit), avec quelques clairières.
  let tries = 0;
  let trees = 0;
  while (trees < 260 && tries < 9000) {
    tries += 1;
    const x = B + rng() * (W - 2 * B); const y = B + rng() * (H - 2 * B);
    const dens = noise(x / 520, y / 520, 11);
    if (rng() > dens * dens * 1.6) continue;
    if (!clearOf(x, y, 46)) continue;
    const kind = rng();
    sprProp(x, y, kind < 0.12 ? pickOf(sprites.autumn) : kind < 0.3 ? pickOf(sprites.pine) : pickOf(sprites.oak), 15, { space: 34 });
    trees += 1;
  }
  for (let i = 0, n = 0; i < 4000 && n < 140; i += 1) {
    const x = B + rng() * (W - 2 * B); const y = B + rng() * (H - 2 * B);
    if (!clearOf(x, y, 22)) continue;
    const r = rng();
    if (r < 0.55) sprProp(x, y, pickOf(sprites.bush), 0, { space: 10 });
    else if (r < 0.85) sprProp(x, y, pickOf(sprites.rock), 9, { space: 12 });
    else sprProp(x, y, pickOf(sprites.boulder), 18, { space: 18 });
    n += 1;
  }

  // Rochers fissurés à casser (récompenses). Ils deviennent des cibles dans le moteur.
  const breakables = [];
  for (let i = 0; i < 4000 && breakables.length < 34; i += 1) {
    const x = B + 80 + rng() * (W - 2 * B - 160); const y = B + 80 + rng() * (H - 2 * B - 160);
    if (!clearOf(x, y, 30)) continue;
    breakables.push({ x, y });
    addProp({ x, y, space: 30, ghost: true });
  }

  /* ——— Sol (une seule grande image à demi-résolution) ——— */
  const AW = W / ART; const AH = H / ART;
  const ground = canvas(AW, AH);
  const g = ground.getContext('2d');
  const img = g.createImageData(AW, AH);
  const noiseRow = new Float32Array(AW);
  const G1 = hex('#5fae45'); const G2 = hex('#79c254'); const G3 = hex('#8ccf5d'); const G0 = hex('#4b9a3b');
  let n = 0;
  for (let y = 0; y < AH; y += 1) {
    for (let x = 0; x < AW; x += 1) {
      if (!(x & 1) && !(y & 1)) n = noise(x / 90, y / 90, 1) * 0.65 + noise(x / 22, y / 22, 2) * 0.35;
      else if (x & 1) { /* même valeur que le pixel de gauche */ } else n = noiseRow[x];
      if (!(y & 1)) noiseRow[x] = n;
      let col = n < 0.42 ? mix(G0, G1, n / 0.42) : n < 0.7 ? mix(G1, G2, (n - 0.42) / 0.28) : mix(G2, G3, (n - 0.7) / 0.3);
      const dither = hash2(x, y, 9);
      if (dither < 0.05) col = mix(col, G0, 0.5);
      else if (dither > 0.97) col = mix(col, G3, 0.6);
      const o = (y * AW + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false;
  const A = (v) => v / ART;

  // Taches de terre, touffes d'herbe et fleurs.
  for (let i = 0; i < 900; i += 1) {
    const x = rng() * AW; const y = rng() * AH;
    g.fillStyle = 'rgba(160,110,70,.35)';
    g.beginPath(); g.ellipse(x, y, 3 + rng() * 6, 2 + rng() * 3, 0, 0, TAU); g.fill();
  }
  for (let i = 0; i < 9000; i += 1) {
    const x = Math.floor(rng() * AW); const y = Math.floor(rng() * AH);
    const n = noise(x / 40, y / 40, 5);
    if (n < 0.45) continue;
    g.fillStyle = rng() < 0.5 ? '#3f8a32' : '#9fdc6a';
    g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y - 1, 1, 3); g.fillRect(x - 2, y, 1, 2);
  }
  // Hautes herbes (zones plus sombres et touffues).
  for (let i = 0; i < 70; i += 1) {
    const cx = rng() * AW; const cy = rng() * AH;
    const r = 18 + rng() * 34;
    for (let k = 0; k < r * 5; k += 1) {
      const a = rng() * TAU; const d = Math.sqrt(rng()) * r;
      const x = Math.floor(cx + Math.cos(a) * d); const y = Math.floor(cy + Math.sin(a) * d * 0.7);
      g.fillStyle = '#2f7a2c'; g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 1, 1, 3);
      g.fillStyle = '#56a83d'; g.fillRect(x + 2, y, 1, 3);
    }
  }
  const FLOWERS = ['#ffffff', '#ffd23a', '#ff8fb1', '#ff5a5a', '#b48cff'];
  for (let i = 0; i < 260; i += 1) {
    const cx = rng() * AW; const cy = rng() * AH;
    const col = pickOf(FLOWERS);
    for (let k = 0; k < 7; k += 1) {
      const x = Math.floor(cx + (rng() - 0.5) * 22); const y = Math.floor(cy + (rng() - 0.5) * 14);
      g.fillStyle = col; g.fillRect(x, y, 2, 2);
      g.fillStyle = '#ffe680'; g.fillRect(x, y, 1, 1);
    }
  }

  const strokePoly = (pts, width, color) => {
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(A(p.x), A(p.y)) : g.moveTo(A(p.x), A(p.y))));
    g.stroke();
  };
  // Chemins
  paths.forEach((p) => strokePoly(p, A(pathW * 2 + 8), '#a77b4f'));
  paths.forEach((p) => strokePoly(p, A(pathW * 2), '#cfa66f'));
  paths.forEach((p) => {
    for (let i = 0; i < p.length; i += 1) {
      if (rng() < 0.6) { g.fillStyle = rng() < 0.5 ? '#b58c5c' : '#e0bd88'; g.fillRect(Math.floor(A(p[i].x) + (rng() - 0.5) * 16), Math.floor(A(p[i].y) + (rng() - 0.5) * 16), 2, 1); }
    }
  });

  // Rivière : berge sableuse, eau profonde, reflets.
  strokePoly(river, A(riverHW * 2 + 30), '#cdb37a');
  strokePoly(river, A(riverHW * 2 + 14), '#7b9b4f');
  strokePoly(river, A(riverHW * 2 + 4), '#2f6fb3');
  strokePoly(river, A(riverHW * 2 - 14), '#3b86cf');
  strokePoly(river, A(riverHW * 0.9), '#2a64a6');
  for (let i = 0; i < river.length; i += 1) {
    for (let k = 0; k < 3; k += 1) {
      const p = river[i];
      g.fillStyle = 'rgba(190,230,255,.7)';
      g.fillRect(Math.floor(A(p.x) + (rng() - 0.5) * 50), Math.floor(A(p.y) + (rng() - 0.5) * 50), 4 + Math.floor(rng() * 5), 1);
    }
  }
  // Étang
  g.fillStyle = '#cdb37a'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 16), A(pond.r + 12), 0, 0, TAU); g.fill();
  g.fillStyle = '#2f6fb3'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 2), A(pond.r - 2), 0, 0, TAU); g.fill();
  g.fillStyle = '#3b86cf'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r - 14), A(pond.r - 18), 0, 0, TAU); g.fill();
  for (let i = 0; i < 9; i += 1) {
    const a = rng() * TAU; const d = rng() * (pond.r - 50);
    const x = A(pond.x + Math.cos(a) * d); const y = A(pond.y + Math.sin(a) * d);
    g.fillStyle = '#3f9a3a'; g.beginPath(); g.arc(x, y, 5, 0.4, TAU - 0.4); g.lineTo(x, y); g.fill();
    if (i % 3 === 0) { g.fillStyle = '#ff9ccf'; g.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, 3, 3); }
  }
  // Ponts en bois
  bridges.forEach((br) => {
    g.save();
    g.translate(A(br.x), A(br.y));
    g.rotate(br.ang);
    const hl = A(br.half); const ln = A(br.len + 16);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-hl + 2, -ln + 3, hl * 2, ln * 2);
    g.fillStyle = '#6b4325'; g.fillRect(-hl, -ln, hl * 2, ln * 2);
    for (let y = -ln; y < ln; y += 4) {
      g.fillStyle = (Math.round(y / 4) % 2) ? '#a9713f' : '#b98049';
      g.fillRect(-hl + 3, y, hl * 2 - 6, 3);
    }
    g.fillStyle = '#4a2c16'; g.fillRect(-hl, -ln, 3, ln * 2); g.fillRect(hl - 3, -ln, 3, ln * 2);
    g.restore();
  });
  // Place centrale : dallage + Poké Ball au sol.
  const px = A(plaza.x); const py = A(plaza.y); const pr = A(plaza.r);
  g.fillStyle = '#6f6458'; g.beginPath(); g.arc(px, py, pr + 4, 0, TAU); g.fill();
  for (let ring = 0; ring < 6; ring += 1) {
    const r1 = pr - ring * (pr / 6);
    g.fillStyle = ring % 2 ? '#9a8d7c' : '#a99c89';
    g.beginPath(); g.arc(px, py, r1, 0, TAU); g.fill();
    const n = 10 + (6 - ring) * 4;
    g.strokeStyle = '#7b6f60'; g.lineWidth = 1;
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * TAU + ring * 0.3;
      g.beginPath();
      g.moveTo(px + Math.cos(a) * (r1 - pr / 6), py + Math.sin(a) * (r1 - pr / 6));
      g.lineTo(px + Math.cos(a) * r1, py + Math.sin(a) * r1);
      g.stroke();
    }
    g.beginPath(); g.arc(px, py, r1, 0, TAU); g.stroke();
  }
  const br = pr * 0.42;
  g.fillStyle = '#3a3330'; g.beginPath(); g.arc(px, py, br + 3, 0, TAU); g.fill();
  g.fillStyle = '#d2423a'; g.beginPath(); g.arc(px, py, br, Math.PI, TAU); g.fill();
  g.fillStyle = '#ece6da'; g.beginPath(); g.arc(px, py, br, 0, Math.PI); g.fill();
  g.fillStyle = '#3a3330'; g.fillRect(px - br, py - 2, br * 2, 4);
  g.beginPath(); g.arc(px, py, br * 0.32, 0, TAU); g.fill();
  g.fillStyle = '#ece6da'; g.beginPath(); g.arc(px, py, br * 0.2, 0, TAU); g.fill();
  // Dalles des ruines et du jardin
  [[ruins, 190, 120], [garden, 190, 110], [henge, 170, 125]].forEach(([c, rx, ry]) => {
    for (let i = 0; i < 70; i += 1) {
      const a = rng() * TAU; const d = Math.sqrt(rng());
      const x = Math.floor(A(c.x + Math.cos(a) * rx * d)); const y = Math.floor(A(c.y + Math.sin(a) * ry * d));
      g.fillStyle = '#7d7568'; g.fillRect(x - 1, y - 1, 9, 6);
      g.fillStyle = rng() < 0.5 ? '#b3aa98' : '#a39a88'; g.fillRect(x, y, 7, 4);
    }
  });

  /* ——— Mini-carte ——— */
  const MS = 24;
  const mini = canvas(W / MS, H / MS);
  const m = mini.getContext('2d');
  const mimg = m.createImageData(mini.width, mini.height);
  for (let y = 0; y < mini.height; y += 1) {
    for (let x = 0; x < mini.width; x += 1) {
      const t = tileAt(x * MS + MS / 2, y * MS + MS / 2);
      const col = t === TILE.WATER ? [59, 134, 207] : t === TILE.WALL ? [31, 79, 38] : t === TILE.BRIDGE ? [185, 128, 73]
        : isPath(x * MS, y * MS) ? [207, 166, 111] : [111, 184, 76];
      const o = (y * mini.width + x) * 4;
      mimg.data[o] = col[0]; mimg.data[o + 1] = col[1]; mimg.data[o + 2] = col[2]; mimg.data[o + 3] = 255;
    }
  }
  m.putImageData(mimg, 0, 0);
  m.fillStyle = '#a99c89'; m.beginPath(); m.arc(plaza.x / MS, plaza.y / MS, plaza.r / MS, 0, TAU); m.fill();

  /* ——— Requêtes pour le moteur ——— */
  const walkable = (x, y, flying) => {
    const t = tileAt(x, y);
    if (t === TILE.WALL) return false;
    if (t === TILE.WATER) return !!flying;
    return true;
  };
  const sideOf = (x, y) => (y > riverY(x) ? 1 : -1);
  const solidsNear = (x, y, r) => {
    const out = [];
    const i0 = Math.floor((x - r - 40) / BUCKET); const i1 = Math.floor((x + r + 40) / BUCKET);
    const j0 = Math.floor((y - r - 40) / BUCKET); const j1 = Math.floor((y + r + 40) / BUCKET);
    for (let i = i0; i <= i1; i += 1) {
      for (let j = j0; j <= j1; j += 1) {
        const list = buckets.get(`${i},${j}`);
        if (list) list.forEach((p) => { if (p.solid) out.push(p); });
      }
    }
    return out;
  };
  /** Déplace une entité en glissant le long des obstacles. */
  const move = (e, dx, dy, r, flying) => {
    const ox = e.x; const oy = e.y;
    const nx = e.x + dx;
    if (walkable(nx, e.y, flying) && walkable(nx + Math.sign(dx) * r * 0.6, e.y, flying)) e.x = nx;
    const ny = e.y + dy;
    if (walkable(e.x, ny, flying) && walkable(e.x, ny + Math.sign(dy) * r * 0.4, flying)) e.y = ny;
    if (flying) {
      e.x = Math.max(B * 0.6, Math.min(W - B * 0.6, e.x));
      e.y = Math.max(B * 0.6, Math.min(H - B * 0.6, e.y));
      return;
    }
    solidsNear(e.x, e.y, r).forEach((p) => {
      const ox = e.x - p.x; const oy = (e.y - p.y) * 1.4;
      const d = Math.hypot(ox, oy);
      const min = p.solid + r * 0.6;
      if (d > 0 && d < min) {
        e.x = p.x + (ox / d) * min;
        e.y = p.y + ((oy / d) * min) / 1.4;
      }
    });
    // Jamais poussé dans l'eau ou dans la forêt par un décor.
    if (!walkable(e.x, e.y, false) && walkable(ox, oy, false)) { e.x = ox; e.y = oy; }
  };
  const propsIn = (x0, y0, x1, y1) => {
    const out = [];
    for (let i = Math.floor(x0 / BUCKET) - 1; i <= Math.floor(x1 / BUCKET) + 1; i += 1) {
      for (let j = Math.floor(y0 / BUCKET) - 1; j <= Math.floor(y1 / BUCKET) + 2; j += 1) {
        const list = buckets.get(`${i},${j}`);
        if (list) list.forEach((p) => { if (p.spr && p.x + p.w / 2 > x0 && p.x - p.w / 2 < x1 && p.y > y0 && p.y - p.h < y1) out.push(p); });
      }
    }
    return out;
  };

  // Statues : sprite PMD passé en pierre (gris) sur un piédestal.
  const statueCache = new Map();
  const drawProp = (ctx, p, t, alpha = 1) => {
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(p.spr, Math.round(p.x - p.w / 2), Math.round(p.y - p.h + (p.statue ? 8 : 6)), p.w, p.h);
    if (p.statue) {
      if (!statueCache.has(p.dex)) {
        const c = canvas(140, 160);
        statueCache.set(p.dex, { c, done: false });
      }
      const s = statueCache.get(p.dex);
      if (!s.done) {
        const x = s.c.getContext('2d');
        x.clearRect(0, 0, 140, 160);
        x.filter = 'grayscale(1) brightness(1.15) contrast(.85)';
        s.done = drawPokemon(x, p.dex, 'idle', 0, 0, 70, 150, p.dex === 95 ? 1.1 : 2, { loop: false });
        x.filter = 'none';
      }
      ctx.drawImage(s.c, Math.round(p.x - 70), Math.round(p.y - 160 - 14));
    }
    ctx.restore();
  };

  const drawGround = (ctx, vx, vy, vw, vh) => {
    ctx.imageSmoothingEnabled = false;
    // fond sombre (au-delà de la carte)
    ctx.fillStyle = '#163a1e';
    ctx.fillRect(vx, vy, vw, vh);
    const sx = Math.max(0, Math.floor(vx / ART)); const sy = Math.max(0, Math.floor(vy / ART));
    const ex = Math.min(AW, Math.ceil((vx + vw) / ART)); const ey = Math.min(AH, Math.ceil((vy + vh) / ART));
    if (ex > sx && ey > sy) ctx.drawImage(ground, sx, sy, ex - sx, ey - sy, sx * ART, sy * ART, (ex - sx) * ART, (ey - sy) * ART);
  };

  // Points de l'eau visibles pour les reflets animés.
  const glints = [];
  for (let i = 0; i < river.length; i += 1) {
    for (let k = 0; k < 2; k += 1) glints.push({ x: river[i].x + (rng() - 0.5) * riverHW * 1.6, y: river[i].y + (rng() - 0.5) * riverHW * 1.2, p: rng() * TAU });
  }

  return {
    W, H, B, start, plaza, bridges, breakables, glints, mini, miniScale: MS, crackedRock: sprites.cracked,
    tileAt, walkable, sideOf, move, propsIn, drawProp, drawGround, solidsNear
  };
};
