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
const TREE_PALS = {
  oak: ['#1f4f26', '#2f7a33', '#46a03c', '#77c44f'],
  dark: ['#173d22', '#21572c', '#2c6e35', '#3b8540'],
  autumn: ['#6b2f17', '#a24a1c', '#cf6d22', '#f0a23a'],
  gold: ['#6b4a12', '#a2781c', '#cfa422', '#f0d23a'],
  snow: ['#1f3f36', '#2f5a4a', '#e2ebf3', '#ffffff'],
  swamp: ['#11241b', '#1b3426', '#28452f', '#4a6a3a']
};

/* ——— Décors : les biomes (une carte = un biome tiré au sort) ——— */
export const BIOMES = {
  prairie: {
    name: 'Prairie', ground: ['#4b9a3b', '#5fae45', '#79c254', '#8ccf5d'], dirt: 'rgba(160,110,70,.35)',
    tuft: ['#3f8a32', '#9fdc6a'], tall: ['#2f7a2c', '#56a83d'], flowers: ['#ffffff', '#ffd23a', '#ff8fb1', '#ff5a5a', '#b48cff'], flowerHeart: '#ffe680', flowerCount: 260,
    path: ['#a77b4f', '#cfa66f', '#b58c5c', '#e0bd88'], bank: '#cdb37a', shore: '#7b9b4f', water: ['#2f6fb3', '#3b86cf', '#2a64a6'], foam: 'rgba(190,230,255,.7)', lily: '#3f9a3a',
    trees: [['oak', 0.7], ['pine', 0.18], ['autumn', 0.12]], rim: ['darkOak', 'darkOak', 'darkPine'], bush: ['#2a6a2c', '#3f9238', '#6cc04a', '#e8433c'],
    outside: '#163a1e', mini: { grass: [111, 184, 76], wall: [31, 79, 38], path: [207, 166, 111], water: [59, 134, 207] }, ambient: null
  },
  automne: {
    name: 'Bois d’automne', ground: ['#7a6a2c', '#8c7a34', '#a08a3c', '#b39a48'], dirt: 'rgba(120,70,30,.35)',
    tuft: ['#6a5a24', '#c9a24a'], tall: ['#5a4a1c', '#8a7a34'], flowers: ['#e07a2a', '#c9502a', '#f0a23a', '#a83a1a', '#f0c24a'], flowerHeart: '#ffe0a0', flowerCount: 520,
    path: ['#8a5a32', '#b88a52', '#9a6a3c', '#d0a46c'], bank: '#b89a62', shore: '#7a7a3a', water: ['#2f5f8f', '#3a74a6', '#2a5480'], foam: 'rgba(200,220,240,.6)', lily: '#7a8a3a',
    trees: [['autumn', 0.5], ['gold', 0.3], ['oak', 0.2]], rim: ['autumnDark', 'autumnDark', 'darkPine'], bush: ['#6a3a14', '#a25a1c', '#e09a3a', '#ffd23a'],
    outside: '#2a1a0e', mini: { grass: [168, 140, 66], wall: [90, 50, 20], path: [190, 140, 90], water: [58, 116, 166] }, ambient: 'rgba(255,140,40,.06)'
  },
  neige: {
    name: 'Plaine enneigée', ground: ['#b9c8d8', '#cbd8e5', '#dbe5ef', '#eaf1f8'], dirt: 'rgba(150,170,200,.25)',
    tuft: ['#a7b8ca', '#ffffff'], tall: ['#9fb2c6', '#f4f8fc'], flowers: ['#9fd8ff', '#ffffff', '#c8e8ff'], flowerHeart: '#ffffff', flowerCount: 120,
    path: ['#8a9aac', '#aebccb', '#9aaabb', '#c8d4e0'], bank: '#a8b8c8', shore: '#d8e4ee', water: ['#5f8fbf', '#7aa6d0', '#5280b0'], foam: 'rgba(240,250,255,.85)', lily: null,
    trees: [['snowPine', 0.75], ['dead', 0.25]], rim: ['snowPineDark', 'snowPineDark', 'snowPineDark'], bush: ['#4a6a6a', '#6a8a8a', '#f4f8fc', '#9fd8ff'],
    outside: '#26364a', mini: { grass: [214, 226, 238], wall: [60, 90, 90], path: [160, 176, 192], water: [100, 150, 200] }, ambient: 'rgba(120,170,255,.05)'
  },
  desert: {
    name: 'Canyon aride', ground: ['#c99a5a', '#d6aa6a', '#e0ba7a', '#eac88c'], dirt: 'rgba(170,100,50,.3)',
    tuft: ['#a8823e', '#c8a858'], tall: ['#8a7a3a', '#a89a4a'], flowers: ['#ff6a8a', '#ffd23a', '#ff9a3a'], flowerHeart: '#fff2a0', flowerCount: 90,
    path: ['#9a6a3a', '#b8824e', '#a87444', '#cf9a62'], bank: '#d8c088', shore: '#7a9a4a', water: ['#2f8fb3', '#3ba6cf', '#2a7aa6'], foam: 'rgba(210,245,255,.75)', lily: '#4a8a3a',
    trees: [['cactus', 0.55], ['palm', 0.25], ['dead', 0.2]], rim: ['mesa', 'mesa', 'cactus'], bush: ['#6a7a3a', '#8a9a4a', '#b0ba60', '#ff6a8a'],
    outside: '#5a3418', mini: { grass: [222, 184, 122], wall: [120, 70, 36], path: [184, 130, 78], water: [59, 166, 207] }, ambient: 'rgba(255,170,80,.05)'
  },
  marais: {
    name: 'Marais brumeux', ground: ['#2c4a38', '#355642', '#3f624c', '#4a6e56'], dirt: 'rgba(30,40,30,.35)',
    tuft: ['#24402f', '#5a8a5a'], tall: ['#1a3424', '#46744a'], flowers: ['#9fe6ff', '#c8a8ff', '#7fffb0'], flowerHeart: '#ffffff', flowerCount: 180,
    path: ['#3a2e20', '#5a4630', '#4a3a28', '#6a563c'], bank: '#4a4a30', shore: '#2f4a32', water: ['#1f4a44', '#2a6058', '#1a3e3a'], foam: 'rgba(170,230,210,.5)', lily: '#4a8a4a',
    trees: [['swamp', 0.6], ['dead', 0.25], ['darkPine', 0.15]], rim: ['swampDark', 'swampDark', 'darkPine'], bush: ['#18301f', '#28462e', '#4a7a4a', '#c8a8ff'],
    outside: '#0c1a14', mini: { grass: [60, 98, 76], wall: [16, 34, 24], path: [90, 70, 48], water: [42, 96, 88] }, ambient: 'rgba(20,40,60,.18)'
  }
};
export const BIOME_IDS = Object.keys(BIOMES);

const makeCactus = (rng) => {
  const c = canvas(28, 46);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(14, 43, 9, 3, 0, 0, TAU); x.fill();
  const col = (cx, y0, y1, w) => {
    x.fillStyle = '#2f6a2a'; x.fillRect(cx - w / 2, y0, w, y1 - y0);
    x.fillStyle = '#4a9a3a'; x.fillRect(cx - w / 2 + 1, y0 + 1, w - 3, y1 - y0 - 1);
    x.fillStyle = '#7ac85a'; x.fillRect(cx - w / 2 + 2, y0 + 2, 1, y1 - y0 - 4);
  };
  col(14, 6, 43, 8);
  if (rng() < 0.8) { col(6, 14, 26, 5); x.fillStyle = '#2f6a2a'; x.fillRect(6, 24, 6, 4); }
  if (rng() < 0.8) { col(22, 10, 22, 5); x.fillStyle = '#2f6a2a'; x.fillRect(17, 20, 6, 4); }
  if (rng() < 0.5) { x.fillStyle = '#ff6a8a'; x.fillRect(12, 4, 4, 3); }
  return crisp(c);
};
const makePalm = (rng) => {
  const c = canvas(46, 56);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(23, 52, 12, 3.5, 0, 0, TAU); x.fill();
  for (let i = 0; i < 9; i += 1) { x.fillStyle = i % 2 ? '#8a5a2a' : '#a8743a'; x.fillRect(21 + Math.round(Math.sin(i / 3) * 2), 18 + i * 4, 5, 4); }
  const frond = (a, len) => {
    x.strokeStyle = '#2f7a33'; x.lineWidth = 4; x.beginPath(); x.moveTo(23, 16); x.quadraticCurveTo(23 + Math.cos(a) * len * 0.6, 10 + Math.sin(a) * len * 0.3, 23 + Math.cos(a) * len, 16 + Math.sin(a) * len * 0.5 + 6); x.stroke();
    x.strokeStyle = '#5fae45'; x.lineWidth = 2; x.beginPath(); x.moveTo(23, 15); x.quadraticCurveTo(23 + Math.cos(a) * len * 0.6, 9 + Math.sin(a) * len * 0.3, 23 + Math.cos(a) * len, 15 + Math.sin(a) * len * 0.5 + 6); x.stroke();
  };
  [-2.8, -2.2, -1.6, -1.0, -0.4, 0.2].forEach((a) => frond(a, 16 + rng() * 5));
  circle(x, 21, 18, 2, '#6b3d20'); circle(x, 25, 19, 2, '#6b3d20');
  return crisp(c);
};
const makeDeadTree = (rng, snow = false) => {
  const c = canvas(40, 50);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 47, 11, 3, 0, 0, TAU); x.fill();
  x.strokeStyle = '#4a3020'; x.lineCap = 'round';
  const branch = (x0, y0, a, len, w) => {
    if (len < 4) return;
    const x1 = x0 + Math.cos(a) * len; const y1 = y0 + Math.sin(a) * len;
    x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    if (snow && w < 3) { x.fillStyle = '#ffffff'; x.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 2, 1); }
    branch(x1, y1, a - 0.5 - rng() * 0.3, len * 0.66, Math.max(1, w - 1.4));
    branch(x1, y1, a + 0.5 + rng() * 0.3, len * 0.62, Math.max(1, w - 1.4));
  };
  branch(20, 47, -Math.PI / 2, 15, 5);
  return crisp(c);
};
const makeMesa = (rng) => {
  const c = canvas(56, 52);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(28, 48, 25, 4, 0, 0, TAU); x.fill();
  x.fillStyle = '#8a4a26'; x.beginPath(); x.moveTo(4, 48); x.lineTo(9, 10); x.lineTo(20, 4); x.lineTo(38, 6); x.lineTo(50, 14); x.lineTo(53, 48); x.fill();
  x.fillStyle = '#b0623a'; x.beginPath(); x.moveTo(8, 46); x.lineTo(12, 12); x.lineTo(21, 7); x.lineTo(36, 9); x.lineTo(47, 16); x.lineTo(48, 46); x.fill();
  for (let y = 16; y < 46; y += 7) { x.fillStyle = y % 14 ? '#c8784a' : '#9a5230'; x.fillRect(10, y, 37, 2); }
  x.fillStyle = '#d89a62'; x.fillRect(14, 9, 18, 2);
  if (rng() < 0.4) { x.fillStyle = '#7a9a4a'; x.fillRect(16, 7, 4, 2); }
  return crisp(c);
};

const makeTree = (rng, kind = 'oak', dark = false, palName = null) => {
  const c = canvas(46, 54);
  const x = c.getContext('2d');
  const pal = TREE_PALS[palName || (dark ? 'dark' : kind === 'autumn' ? 'autumn' : 'oak')];
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

const makeBush = (rng, pal = ['#2a6a2c', '#3f9238', '#6cc04a', '#e8433c']) => {
  const c = canvas(24, 16);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(12, 13, 10, 3, 0, 0, TAU); x.fill();
  [[7, 9, 6], [16, 9, 6], [12, 6, 6]].forEach(([bx, by, r]) => circle(x, bx, by, r, pal[0]));
  [[7, 8, 5], [16, 8, 5], [12, 5, 5]].forEach(([bx, by, r]) => circle(x, bx, by, r, pal[1]));
  for (let i = 0; i < 6; i += 1) { x.fillStyle = pal[2]; x.fillRect(4 + Math.floor(rng() * 15), 3 + Math.floor(rng() * 6), 2, 1); }
  if (rng() < 0.45) for (let i = 0; i < 3; i += 1) { x.fillStyle = pal[3]; x.fillRect(5 + Math.floor(rng() * 13), 4 + Math.floor(rng() * 6), 2, 2); }
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
export const buildWorld = (seed = Math.floor(Math.random() * 1e9), biomeId = null, opts = {}) => {
  const rng = mulberry32(seed);
  const { w: W, h: H, border: B } = WORLD;
  const biome = BIOMES[biomeId] || BIOMES[BIOME_IDS[Math.floor(rng() * BIOME_IDS.length)]];
  const BIOME_ID = Object.keys(BIOMES).find((k) => BIOMES[k] === biome);
  // Disposition : la carte peut être retournée, et les lieux échangent leurs places
  const flipX = rng() < 0.5; const flipY = rng() < 0.5;
  const fx = (x) => (flipX ? W - x : x);
  const fy = (y) => (flipY ? H - y : y);

  // Rivière : ligne brisée + méandres.
  const ctrl = [[-200, 300], [900, 600], [1700, 860], [2500, 1150], [3200, 1500], [3800, 1840], [4600, 2180]]
    .map(([x, y]) => [fx(x), fy(y)])
    .sort((a, b) => a[0] - b[0]);
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

  const plaza = { x: fx(2200), y: fy(1720), r: 230 };
  const slots = [[900, 2480], [3430, 2560], [3500, 880], [820, 1500]].map(([x, y]) => ({ x: fx(x), y: fy(y) }));
  for (let i = slots.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const pond = { ...slots[0], r: 150 + Math.floor(rng() * 50) };
  const ruins = slots[1];
  const henge = slots[2];
  const garden = slots[3];
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
  const need = new Set([...biome.trees.map(([k]) => k), ...biome.rim]);
  const many = (key, n, make) => (need.has(key) ? Array.from({ length: n }, make) : []);
  const sprites = {
    oak: many('oak', 4, () => makeTree(rng, 'oak')),
    autumn: many('autumn', 3, () => makeTree(rng, 'oak', false, 'autumn')),
    gold: many('gold', 3, () => makeTree(rng, 'oak', false, 'gold')),
    autumnDark: many('autumnDark', 3, () => makeTree(rng, 'oak', false, 'autumn')),
    pine: many('pine', 2, () => makeTree(rng, 'pine')),
    darkOak: many('darkOak', 3, () => makeTree(rng, 'oak', true)),
    darkPine: many('darkPine', 2, () => makeTree(rng, 'pine', true)),
    snowPine: many('snowPine', 3, () => makeTree(rng, 'pine', false, 'snow')),
    snowPineDark: many('snowPineDark', 3, () => makeTree(rng, 'pine', false, 'snow')),
    swamp: many('swamp', 3, () => makeTree(rng, 'oak', false, 'swamp')),
    swampDark: many('swampDark', 3, () => makeTree(rng, 'oak', false, 'swamp')),
    dead: many('dead', 3, () => makeDeadTree(rng, BIOME_ID === 'neige')),
    cactus: many('cactus', 3, () => makeCactus(rng)),
    palm: many('palm', 2, () => makePalm(rng)),
    mesa: many('mesa', 3, () => makeMesa(rng)),
    bush: Array.from({ length: 4 }, () => makeBush(rng, biome.bush)),
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
  const rim = (x, y) => sprProp(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 24, pickOf(sprites[pickOf(biome.rim)]), 0, { rim: true });
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
  const statueDex = opts.statues || [150, 143, 95];
  const statues = [
    { x: garden.x - 90, y: garden.y, dex: statueDex[0] },
    { x: garden.x + 90, y: garden.y, dex: statueDex[1] },
    { x: ruins.x, y: ruins.y - 10, dex: statueDex[2] }
  ];
  const statueProps = statues.map((st) => addProp({ ...st, statue: true, spr: sprites.pedestal, w: 68, h: 36, solid: 26, space: 40, tall: true }));
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
    let kind = rng(); let key = biome.trees[0][0];
    for (const [k, w] of biome.trees) { if (kind < w) { key = k; break; } kind -= w; }
    sprProp(x, y, pickOf(sprites[key]), key === 'cactus' ? 10 : 15, { space: 34 });
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
  const [G0, G1, G2, G3] = biome.ground.map(hex);
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
    g.fillStyle = biome.dirt;
    g.beginPath(); g.ellipse(x, y, 3 + rng() * 6, 2 + rng() * 3, 0, 0, TAU); g.fill();
  }
  for (let i = 0; i < 9000; i += 1) {
    const x = Math.floor(rng() * AW); const y = Math.floor(rng() * AH);
    const n = noise(x / 40, y / 40, 5);
    if (n < 0.45) continue;
    g.fillStyle = rng() < 0.5 ? biome.tuft[0] : biome.tuft[1];
    g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y - 1, 1, 3); g.fillRect(x - 2, y, 1, 2);
  }
  // Hautes herbes (zones plus sombres et touffues).
  for (let i = 0; i < 70; i += 1) {
    const cx = rng() * AW; const cy = rng() * AH;
    const r = 18 + rng() * 34;
    for (let k = 0; k < r * 5; k += 1) {
      const a = rng() * TAU; const d = Math.sqrt(rng()) * r;
      const x = Math.floor(cx + Math.cos(a) * d); const y = Math.floor(cy + Math.sin(a) * d * 0.7);
      g.fillStyle = biome.tall[0]; g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 1, 1, 3);
      g.fillStyle = biome.tall[1]; g.fillRect(x + 2, y, 1, 3);
    }
  }
  const FLOWERS = biome.flowers;
  for (let i = 0; i < biome.flowerCount; i += 1) {
    const cx = rng() * AW; const cy = rng() * AH;
    const col = pickOf(FLOWERS);
    for (let k = 0; k < 7; k += 1) {
      const x = Math.floor(cx + (rng() - 0.5) * 22); const y = Math.floor(cy + (rng() - 0.5) * 14);
      g.fillStyle = col; g.fillRect(x, y, 2, 2);
      g.fillStyle = biome.flowerHeart; g.fillRect(x, y, 1, 1);
    }
  }

  const strokePoly = (pts, width, color) => {
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(A(p.x), A(p.y)) : g.moveTo(A(p.x), A(p.y))));
    g.stroke();
  };
  // Chemins
  paths.forEach((p) => strokePoly(p, A(pathW * 2 + 8), biome.path[0]));
  paths.forEach((p) => strokePoly(p, A(pathW * 2), biome.path[1]));
  paths.forEach((p) => {
    for (let i = 0; i < p.length; i += 1) {
      if (rng() < 0.6) { g.fillStyle = rng() < 0.5 ? biome.path[2] : biome.path[3]; g.fillRect(Math.floor(A(p[i].x) + (rng() - 0.5) * 16), Math.floor(A(p[i].y) + (rng() - 0.5) * 16), 2, 1); }
    }
  });

  // Rivière : berge sableuse, eau profonde, reflets.
  strokePoly(river, A(riverHW * 2 + 30), biome.bank);
  strokePoly(river, A(riverHW * 2 + 14), biome.shore);
  strokePoly(river, A(riverHW * 2 + 4), biome.water[0]);
  strokePoly(river, A(riverHW * 2 - 14), biome.water[1]);
  strokePoly(river, A(riverHW * 0.9), biome.water[2]);
  for (let i = 0; i < river.length; i += 1) {
    for (let k = 0; k < 3; k += 1) {
      const p = river[i];
      g.fillStyle = biome.foam;
      g.fillRect(Math.floor(A(p.x) + (rng() - 0.5) * 50), Math.floor(A(p.y) + (rng() - 0.5) * 50), 4 + Math.floor(rng() * 5), 1);
    }
  }
  // Étang
  g.fillStyle = biome.bank; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 16), A(pond.r + 12), 0, 0, TAU); g.fill();
  g.fillStyle = biome.water[0]; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 2), A(pond.r - 2), 0, 0, TAU); g.fill();
  g.fillStyle = biome.water[1]; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r - 14), A(pond.r - 18), 0, 0, TAU); g.fill();
  for (let i = 0; i < (biome.lily ? 9 : 0); i += 1) {
    const a = rng() * TAU; const d = rng() * (pond.r - 50);
    const x = A(pond.x + Math.cos(a) * d); const y = A(pond.y + Math.sin(a) * d);
    g.fillStyle = biome.lily; g.beginPath(); g.arc(x, y, 5, 0.4, TAU - 0.4); g.lineTo(x, y); g.fill();
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
      const col = t === TILE.WATER ? biome.mini.water : t === TILE.WALL ? biome.mini.wall : t === TILE.BRIDGE ? [185, 128, 73]
        : isPath(x * MS, y * MS) ? biome.mini.path : biome.mini.grass;
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
    ctx.fillStyle = biome.outside;
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
    biome: BIOME_ID, biomeName: biome.name, ambient: biome.ambient, seed,
    W, H, B, start, plaza, bridges, breakables, glints, mini, miniScale: MS, crackedRock: sprites.cracked,
    tileAt, walkable, sideOf, move, propsIn, drawProp, drawGround, solidsNear,
    /** Change les Pokémon des statues (les boss de la partie). */
    setStatues: (dexes) => { statueProps.forEach((st, i) => { if (dexes[i]) st.dex = dexes[i]; }); statueCache.clear(); }
  };
};
