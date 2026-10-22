/**
 * Poké Rush — pixel art généré en code : textures du sol et des falaises, décor (arbres, fleurs, rochers…),
 * effets d'attaques et objets. Tout est dessiné pixel par pixel dans des canvas, avec un contour sombre
 * et un éclairage venant du haut à gauche, puis affiché sans lissage.
 */
import * as THREE from 'three';

/* ——— Outils ——— */
const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => { const A = hex(a); const B = hex(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** Remplit une forme définie par une fonction de distance (négative à l'intérieur), avec ombrage en paliers et contour. */
const shape = (ctx, ox, oy, w, h, sdf, ramp, o = {}) => {
  const inside = new Uint8Array(w * h);
  const col = new Array(w * h);
  const L = o.light || [-0.6, -0.8];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5; const py = y + 0.5;
      const d = sdf(px, py);
      if (d >= 0) continue;
      inside[y * w + x] = 1;
      // normale approchée : gradient de la distance
      const gx = sdf(px + 0.7, py) - sdf(px - 0.7, py);
      const gy = sdf(px, py + 0.7) - sdf(px, py - 0.7);
      const gl = Math.hypot(gx, gy) || 1;
      const edge = Math.min(1, -d / (o.soft || 4));
      // lumière : vers le haut-gauche, plus clair au bord éclairé, plus sombre de l'autre côté
      let lit = 0.5 + ((-gx / gl) * L[0] + (-gy / gl) * L[1]) * 0.5 * (1 - edge * 0.55);
      if (o.flat) lit = 0.55;
      lit += (o.yShade ? (1 - py / h) * o.yShade : 0);
      lit += (hash(x + ox, y + oy, o.seed || 1) - 0.5) * (o.dither ?? 0.18);
      const steps = ramp.length;
      const k = Math.max(0, Math.min(steps - 1, Math.floor(lit * steps)));
      col[y * w + x] = o.color ? o.color(x, y, k, lit) || ramp[k] : ramp[k];
    }
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (inside[i]) { ctx.fillStyle = col[i]; ctx.fillRect(ox + x, oy + y, 1, 1); continue; }
      if (!o.outline) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && inside[yy * w + xx];
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { ctx.fillStyle = o.outline; ctx.fillRect(ox + x, oy + y, 1, 1); }
    }
  }
};
const circle = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
const union = (...f) => (x, y) => Math.min(...f.map((g) => g(x, y)));
const ellipse = (cx, cy, rx, ry) => (x, y) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
const box = (x0, y0, x1, y1) => (x, y) => Math.max(x0 - x, x - x1, y0 - y, y - y1);
const poly = (pts) => (x, y) => {
  // distance signée à un polygone convexe (approx. : max des demi-plans)
  let d = -Infinity;
  for (let i = 0; i < pts.length; i += 1) {
    const [ax, ay] = pts[i]; const [bx, by] = pts[(i + 1) % pts.length];
    const nx = by - ay; const ny = -(bx - ax); const l = Math.hypot(nx, ny);
    d = Math.max(d, ((x - ax) * nx + (y - ay) * ny) / l);
  }
  return d;
};

const pixelTex = (c, repeat = true) => {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = repeat ? THREE.NearestMipmapLinearFilter : THREE.NearestFilter;
  t.generateMipmaps = repeat;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
};

/* ——— Sols (32 × 32, raccord sans couture) ——— */
const grassTile = (pal, seed, o = {}) => {
  const S = 32; const c = canvas(S, S); const x = c.getContext('2d');
  for (let j = 0; j < S; j += 1) {
    for (let i = 0; i < S; i += 1) {
      const n = hash(Math.floor(i / 2), Math.floor(j / 2), seed) * 0.6 + hash(i, j, seed + 1) * 0.4;
      x.fillStyle = n > 0.82 ? pal[2] : n < 0.16 ? pal[0] : pal[1];
      x.fillRect(i, j, 1, 1);
    }
  }
  // touffes en « v » sombres
  const tufts = o.tufts ?? 7;
  for (let k = 0; k < tufts; k += 1) {
    const tx = Math.floor(hash(k, 3, seed) * S); const ty = Math.floor(hash(k, 7, seed) * S);
    const put = (dx, dy, col) => { x.fillStyle = col; x.fillRect((tx + dx + S) % S, (ty + dy + S) % S, 1, 1); };
    put(0, 0, pal[3]); put(2, 0, pal[3]); put(1, 1, pal[3]); put(0, -1, pal[0]); put(2, -1, pal[0]);
    if (o.tall) { put(1, 0, pal[3]); put(1, -1, pal[0]); put(1, -2, pal[2]); put(3, -1, pal[3]); put(-1, -1, pal[3]); }
  }
  // petites fleurs
  for (let k = 0; k < (o.flowers ?? 2); k += 1) {
    const fx = Math.floor(hash(k, 11, seed) * S); const fy = Math.floor(hash(k, 13, seed) * S);
    const fc = ['#ffffff', '#fff3a0', '#ffd0e6'][k % 3];
    [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => { x.fillStyle = fc; x.fillRect((fx + dx + S) % S, (fy + dy + S) % S, 1, 1); });
    x.fillStyle = '#f7c531'; x.fillRect(fx, fy, 1, 1);
  }
  return c;
};
const speckTile = (base, specks, seed, o = {}) => {
  const S = 32; const c = canvas(S, S); const x = c.getContext('2d');
  for (let j = 0; j < S; j += 1) for (let i = 0; i < S; i += 1) {
    const n = hash(Math.floor(i / 2), Math.floor(j / 2), seed);
    x.fillStyle = n > 0.85 ? base[2] : n < 0.15 ? base[0] : base[1];
    x.fillRect(i, j, 1, 1);
  }
  for (let k = 0; k < (o.n ?? 14); k += 1) {
    const sx = Math.floor(hash(k, 5, seed) * S); const sy = Math.floor(hash(k, 9, seed) * S);
    x.fillStyle = specks[k % specks.length]; x.fillRect(sx, sy, o.size || 1, 1);
    if (o.pebble) { x.fillStyle = base[0]; x.fillRect(sx, (sy + 1) % S, o.size || 1, 1); }
  }
  return c;
};
const stoneTile = () => {
  const S = 32; const c = canvas(S, S); const x = c.getContext('2d');
  x.fillStyle = '#8f88a6'; x.fillRect(0, 0, S, S);
  for (let r = 0; r < 2; r += 1) for (let q = 0; q < 2; q += 1) {
    const ox = q * 16 + (r % 2) * 8; const oy = r * 16;
    for (let j = 1; j < 15; j += 1) for (let i = 1; i < 15; i += 1) {
      const n = hash(i, j, r * 7 + q);
      x.fillStyle = j === 1 || i === 1 ? '#e6e1f2' : j === 14 || i === 14 ? '#b3abc8' : n > 0.9 ? '#cfc8e0' : '#d9d3e8';
      x.fillRect((ox + i) % S, oy + j, 1, 1);
    }
  }
  return c;
};
const cliffTile = () => {
  // strates de briques de pierre ocre, joints sombres, mousse sur certaines arêtes
  const W = 64; const H = 32; const c = canvas(W, H); const x = c.getContext('2d');
  x.fillStyle = '#6e5240'; x.fillRect(0, 0, W, H);
  for (let row = 0; row < 4; row += 1) {
    const y0 = row * 8; let bx = Math.floor(hash(row, 1, 4) * 8);
    let k = 0;
    while (bx < W + 16) {
      const bw = 9 + Math.floor(hash(row, k, 9) * 9);
      const tone = hash(row, k, 2);
      const base = tone > 0.66 ? '#e2bc84' : tone > 0.33 ? '#d4a96c' : '#c99a5e';
      for (let j = 0; j < 7; j += 1) for (let i = 0; i < bw - 1; i += 1) {
        const px = (bx + i) % W;
        let col = base;
        if (j === 0) col = mix(base, '#fff1c9', 0.45);
        else if (j >= 5) col = mix(base, '#7a5a3a', j === 6 ? 0.55 : 0.3);
        else if (hash(px, y0 + j, 3) > 0.9) col = mix(base, '#7a5a3a', 0.2);
        x.fillStyle = col; x.fillRect(px, y0 + j, 1, 1);
      }
      // mousse
      if (hash(row, k, 7) > 0.72) {
        for (let i = 1; i < bw - 2; i += 1) { if (hash(i, row, k) > 0.35) { x.fillStyle = hash(i, k, 1) > 0.5 ? '#7cc24a' : '#5aa53a'; x.fillRect((bx + i) % W, y0, 1, 1 + (hash(i, k, 2) > 0.7 ? 1 : 0)); } }
      }
      bx += bw; k += 1;
    }
  }
  return c;
};
const waterTile = () => {
  const S = 32; const c = canvas(S, S); const x = c.getContext('2d');
  x.fillStyle = '#3f9be8'; x.fillRect(0, 0, S, S);
  for (let k = 0; k < 9; k += 1) {
    const wx = Math.floor(hash(k, 1, 21) * S); const wy = Math.floor(hash(k, 2, 21) * S);
    x.fillStyle = k % 3 ? '#6fb9f2' : '#b8e2ff';
    x.fillRect(wx, wy, 4, 1); x.fillRect((wx + 4) % S, (wy + 1) % S, 2, 1);
  }
  for (let j = 0; j < S; j += 1) for (let i = 0; i < S; i += 1) if (hash(i, j, 22) > 0.93) { x.fillStyle = '#358cd8'; x.fillRect(i, j, 1, 1); }
  return c;
};

export const makeGroundTextures = () => ({
  grass: pixelTex(grassTile(['#3f9f2f', '#55b83a', '#6dca48', '#2f7f26'], 3, { flowers: 1 })),
  tall: pixelTex(grassTile(['#2c7a2a', '#378c30', '#469d38', '#1f5e20'], 5, { tufts: 16, tall: true, flowers: 0 })),
  sand: pixelTex(speckTile(['#dcc68e', '#ead7a2', '#f4e6bc'], ['#c9b07a', '#ffffff'], 7, { n: 16 })),
  path: pixelTex(speckTile(['#b98e5a', '#c9a06a', '#d8b47e'], ['#9c7446', '#e8cfa0'], 8, { n: 12, size: 2, pebble: true })),
  stone: pixelTex(stoneTile()),
  cliff: pixelTex(cliffTile()),
  water: pixelTex(waterTile())
});

/* ——— Décor : atlas de sprites (arbres, buissons, fleurs…) ——— */
// Chaque entrée : position dans l'atlas, taille en pixels, hauteur en mètres
export const PROP_PIX = 1 / 16; // 16 pixels de décor = 1 m
const drawTree = (x, ox, oy, pal, seed, kind = 'oak') => {
  const W = 64; const H = 88;
  // tronc
  shape(x, ox, oy, W, H, union(box(28, 52, 36, 86), poly([[22, 86], [42, 86], [36, 76], [28, 76]])), ['#5a3418', '#7a4a26', '#9a6236'], { outline: '#2e1a0c', seed, dither: 0.1 });
  if (kind === 'pine') {
    const tiers = [[32, 8, 14, 30], [32, 22, 20, 46], [32, 36, 26, 64]];
    tiers.reverse().forEach(([cx, top, half, bot], i) => shape(x, ox, oy, W, H, poly([[cx, top], [cx + half, bot], [cx - half, bot]]), pal, { outline: '#103a1c', seed: seed + i, yShade: 0.25 }));
    return;
  }
  const blobs = [];
  for (let k = 0; k < 7; k += 1) {
    const a = (k / 7) * Math.PI * 2 + hash(k, 0, seed);
    blobs.push(circle(32 + Math.cos(a) * (12 + hash(k, 1, seed) * 5), 34 + Math.sin(a) * (10 + hash(k, 2, seed) * 4), 11 + hash(k, 3, seed) * 4));
  }
  blobs.push(circle(32, 30, 17));
  shape(x, ox, oy, W, H, union(...blobs), pal, { outline: kind === 'cherry' ? '#7a2a52' : '#174a22', seed, soft: 9, dither: 0.1 });
  if (kind === 'apple') [[22, 32], [40, 26], [35, 44], [18, 46]].forEach(([fx, fy]) => shape(x, ox + fx, oy + fy, 5, 5, circle(2.5, 2.5, 2), ['#b8202a', '#e2342f', '#ff7a6a'], { outline: '#5a0f14' }));
};
const drawBush = (x, ox, oy, pal, seed, berries) => {
  const W = 40; const H = 28;
  shape(x, ox, oy, W, H, union(circle(12, 17, 9), circle(22, 13, 11), circle(30, 18, 8)), pal, { outline: '#174a22', seed, soft: 6 });
  if (berries) [[10, 14], [19, 9], [27, 15], [22, 19]].forEach(([bx, by]) => { x.fillStyle = berries; x.fillRect(ox + bx, oy + by, 2, 2); x.fillStyle = '#ffffff'; x.fillRect(ox + bx, oy + by, 1, 1); });
};
const drawFern = (x, ox, oy, seed) => {
  const W = 32; const H = 28;
  const g = x;
  const fronds = 7;
  for (let k = 0; k < fronds; k += 1) {
    const a = -Math.PI / 2 + (k - (fronds - 1) / 2) * 0.32;
    const len = 12 + hash(k, 1, seed) * 5;
    for (let s = 0; s < len; s += 1) {
      const bend = s * s * 0.012 * Math.sign(Math.cos(a));
      const px = W / 2 + Math.cos(a) * s + bend; const py = H - 2 + Math.sin(a) * s + s * s * 0.02;
      g.fillStyle = '#1f5e20'; g.fillRect(ox + Math.round(px), oy + Math.round(py) + 1, 1, 1);
      g.fillStyle = s % 2 ? '#4caf3c' : '#62c34a'; g.fillRect(ox + Math.round(px), oy + Math.round(py), 1, 1);
      if (s % 2 === 0 && s > 2) {
        const nx = -Math.sin(a); const ny = Math.cos(a);
        g.fillStyle = '#7dd75a';
        g.fillRect(ox + Math.round(px + nx * 2), oy + Math.round(py + ny * 2), 1, 1);
        g.fillRect(ox + Math.round(px - nx * 2), oy + Math.round(py - ny * 2), 1, 1);
      }
    }
  }
};
const drawSunflower = (x, ox, oy) => {
  shape(x, ox, oy, 24, 44, box(11, 16, 13, 44), ['#2f7f26', '#3f9f2f', '#55b83a'], { outline: '#174a22' });
  shape(x, ox, oy, 24, 44, ellipse(7, 30, 6, 3), ['#3f9f2f', '#55b83a', '#6dca48'], { outline: '#174a22' });
  shape(x, ox, oy, 24, 44, ellipse(17, 26, 6, 3), ['#3f9f2f', '#55b83a', '#6dca48'], { outline: '#174a22' });
  const petals = (px, py) => { const a = Math.atan2(py - 11, px - 12); const r = Math.hypot(px - 12, py - 11); return r - (9 + Math.cos(a * 10) * 1.6); };
  shape(x, ox, oy, 24, 22, petals, ['#e09a10', '#f7c531', '#ffe46a'], { outline: '#7a4a08' });
  shape(x, ox, oy, 24, 22, circle(12, 11, 4.5), ['#4a2a10', '#6b3f1a', '#8a5a2a'], { dither: 0.3 });
};
const drawFlowers = (x, ox, oy, seed, cols) => {
  const W = 24; const H = 16;
  for (let k = 0; k < 4; k += 1) {
    const fx = 3 + Math.floor(hash(k, 1, seed) * 17); const fy = 4 + Math.floor(hash(k, 2, seed) * 6);
    x.fillStyle = '#2f7f26'; x.fillRect(ox + fx, oy + fy + 2, 1, H - fy - 3);
    x.fillStyle = '#55b83a'; x.fillRect(ox + fx + 1, oy + fy + 5, 2, 1);
    const c = cols[k % cols.length];
    x.fillStyle = '#4a3a30';
    [[0, -2], [-2, 0], [2, 0], [0, 2]].forEach(([dx, dy]) => x.fillRect(ox + fx + dx, oy + fy + dy, 1, 1));
    x.fillStyle = c;
    [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => x.fillRect(ox + fx + dx, oy + fy + dy, 1, 1));
    x.fillStyle = '#f7c531'; x.fillRect(ox + fx, oy + fy, 1, 1);
  }
  void W;
};
const drawRock = (x, ox, oy, seed, mossy) => {
  shape(x, ox, oy, 36, 26, union(ellipse(18, 16, 15, 9), ellipse(12, 12, 8, 7), ellipse(24, 11, 9, 7)), ['#4f4a5c', '#6e6880', '#8f89a2', '#b2adc2'], {
    outline: '#2a2633', seed, soft: 7,
    color: (px, py, k) => (mossy && py < 9 && hash(px, py, seed) > 0.35 ? (k > 1 ? '#7cc24a' : '#4f9e36') : null)
  });
};
const drawStump = (x, ox, oy) => {
  shape(x, ox, oy, 24, 18, union(box(4, 6, 20, 17), ellipse(12, 6, 8, 3)), ['#5a3418', '#7a4a26', '#9a6236'], { outline: '#2e1a0c' });
  shape(x, ox, oy, 24, 10, ellipse(12, 6, 6.5, 2), ['#c9a06a', '#d8b47e', '#e8cfa0'], { flat: true });
};
const drawMush = (x, ox, oy) => {
  shape(x, ox, oy, 16, 16, box(6, 8, 10, 15), ['#e8dcc0', '#f4ecd8', '#ffffff'], { outline: '#6a5a4a' });
  shape(x, ox, oy, 16, 16, ellipse(8, 7, 7, 5), ['#a0181e', '#d8262c', '#ff5a4a'], { outline: '#4a0a0e' });
  [[5, 5], [10, 4], [8, 8]].forEach(([dx, dy]) => { x.fillStyle = '#ffffff'; x.fillRect(ox + dx, oy + dy, 2, 1); });
};
const drawTallGrass = (x, ox, oy, seed) => {
  for (let k = 0; k < 9; k += 1) {
    const bx = 2 + Math.floor(hash(k, 1, seed) * 18); const h = 8 + Math.floor(hash(k, 2, seed) * 10); const lean = (hash(k, 3, seed) - 0.5) * 6;
    for (let s = 0; s < h; s += 1) {
      const px = Math.round(bx + (lean * s) / h); const py = 22 - s;
      x.fillStyle = '#123f14'; x.fillRect(ox + px + 1, oy + py, 1, 1);
      x.fillStyle = s > h - 3 ? '#7dd75a' : s > h / 2 ? '#3f9f2f' : '#2c7a2a'; x.fillRect(ox + px, oy + py, 1, 1);
    }
  }
};
const drawCloud = (x, ox, oy, seed) => {
  const W = 96; const H = 40;
  const f = union(circle(26, 26, 12), circle(44, 18, 15), circle(64, 22, 13), circle(78, 28, 9), box(16, 26, 84, 36));
  shape(x, ox, oy, W, H, f, ['#c9dcf2', '#e6f0fb', '#ffffff', '#ffffff'], { seed, soft: 10, dither: 0.08 });
};

export const PROPS = {
  oak: { x: 0, y: 0, w: 64, h: 88 }, oak2: { x: 64, y: 0, w: 64, h: 88 }, cherry: { x: 128, y: 0, w: 64, h: 88 }, pine: { x: 192, y: 0, w: 64, h: 88 },
  apple: { x: 256, y: 0, w: 64, h: 88 },
  bush: { x: 0, y: 96, w: 40, h: 28 }, bushB: { x: 40, y: 96, w: 40, h: 28 }, fern: { x: 80, y: 96, w: 32, h: 28 }, sunflower: { x: 112, y: 96, w: 24, h: 44 },
  flowersA: { x: 136, y: 96, w: 24, h: 16 }, flowersB: { x: 160, y: 96, w: 24, h: 16 }, flowersC: { x: 184, y: 96, w: 24, h: 16 },
  rock: { x: 208, y: 96, w: 36, h: 26 }, rockM: { x: 244, y: 96, w: 36, h: 26 }, stump: { x: 280, y: 96, w: 24, h: 18 }, mush: { x: 304, y: 96, w: 16, h: 16 },
  tall: { x: 0, y: 144, w: 24, h: 24 }, tall2: { x: 24, y: 144, w: 24, h: 24 },
  cloud: { x: 64, y: 144, w: 96, h: 40 }, cloud2: { x: 160, y: 144, w: 96, h: 40 }
};
export const makePropAtlas = () => {
  const c = canvas(320, 192); const x = c.getContext('2d');
  drawTree(x, 0, 0, ['#1f6a2a', '#2f8a34', '#46a83e', '#62c34a', '#86da5e'], 3);
  drawTree(x, 64, 0, ['#256f2a', '#368f36', '#4fae40', '#6cc84c', '#94e06a'], 8);
  drawTree(x, 128, 0, ['#b8507e', '#de78a2', '#f39cbc', '#ffc2d8', '#ffe0ec'], 5, 'cherry');
  drawTree(x, 192, 0, ['#1a5a30', '#24733a', '#2f8c44', '#3ea552'], 2, 'pine');
  drawTree(x, 256, 0, ['#1f6a2a', '#2f8a34', '#46a83e', '#62c34a', '#86da5e'], 11, 'apple');
  drawBush(x, 0, 96, ['#226e2a', '#33903a', '#4caf44', '#6cc84c'], 1, '#3a6bdb');
  drawBush(x, 40, 96, ['#226e2a', '#33903a', '#4caf44', '#6cc84c'], 4, '#e2342f');
  drawFern(x, 80, 96, 2);
  drawSunflower(x, 112, 96);
  drawFlowers(x, 136, 96, 1, ['#ffffff', '#fff3a0']);
  drawFlowers(x, 160, 96, 2, ['#ff9ac0', '#ffffff']);
  drawFlowers(x, 184, 96, 3, ['#9ab8ff', '#ff6a5a']);
  drawRock(x, 208, 96, 1, false);
  drawRock(x, 244, 96, 5, true);
  drawStump(x, 280, 96);
  drawMush(x, 304, 96);
  drawTallGrass(x, 0, 144, 1);
  drawTallGrass(x, 24, 144, 6);
  drawCloud(x, 64, 144, 1);
  drawCloud(x, 160, 144, 4);
  return { tex: pixelTex(c, false), w: 320, h: 192 };
};

/* ——— Effets : un sprite de 16 × 16 par type d'attaque, plus des particules ——— */
export const FX = {
  Feu: 0, Eau: 1, Plante: 2, Électrik: 3, Glace: 4, Poison: 5, Psy: 6, Spectre: 7, Roche: 8, Sol: 9, Vol: 10, Normal: 11,
  Insecte: 12, Combat: 13, Dragon: 14, Ténèbres: 15, Acier: 16, Fée: 17, bone: 18, spark: 19, dot: 20, smoke: 21, ring: 22,
  coin0: 23, coin1: 24, coin2: 25, coin3: 26, ball: 27, berry: 28, heart: 29, leafbig: 30, star4: 31, bubble: 32, note: 33, slash: 34, gem: 35
};
const FXN = 36;
export const FX_COLS = 12;
export const makeFxAtlas = () => {
  const S = 16; const c = canvas(S * FX_COLS, S * Math.ceil(FXN / FX_COLS)); const x = c.getContext('2d');
  const at = (i) => [(i % FX_COLS) * S, Math.floor(i / FX_COLS) * S];
  const draw = (i, sdf, ramp, o = {}) => { const [ox, oy] = at(i); shape(x, ox, oy, S, S, sdf, ramp, { outline: o.outline, seed: i, dither: o.dither ?? 0.12, ...o }); };
  const tear = (cx, cy, r, h) => union(circle(cx, cy + h * 0.25, r), poly([[cx, cy - h], [cx + r * 0.85, cy + h * 0.15], [cx - r * 0.85, cy + h * 0.15]]));
  draw(FX.Feu, tear(8, 9, 4.6, 6.5), ['#d8261c', '#ff6a1f', '#ffb347', '#fff2a8'], { outline: '#6a1008', light: [0, 0.9], yShade: 0.4 });
  draw(FX.Eau, tear(8, 9, 4.4, 6.5), ['#1f5fc8', '#3a8af0', '#7fc4ff', '#e6f6ff'], { outline: '#0e2a66' });
  draw(FX.Plante, (px, py) => ellipse(8, 8, 6.5, 3.2)((px - 8) * 0.8 + (py - 8) * 0.6 + 8, -(px - 8) * 0.6 + (py - 8) * 0.8 + 8), ['#2f7f26', '#4caf3c', '#7dd75a', '#c8f59a'], { outline: '#123f14' });
  draw(FX.Électrik, union(circle(8, 8, 4.5), poly([[8, 0.5], [9.5, 6], [6.5, 6]]), poly([[8, 15.5], [6.5, 10], [9.5, 10]]), poly([[0.5, 8], [6, 6.5], [6, 9.5]]), poly([[15.5, 8], [10, 9.5], [10, 6.5]])), ['#e0a800', '#ffd23a', '#fff27a', '#ffffff'], { outline: '#6a4a00' });
  draw(FX.Glace, poly([[8, 1], [13, 8], [8, 15], [3, 8]]), ['#5ab8d8', '#9be8ff', '#d8f7ff', '#ffffff'], { outline: '#1f5a7a' });
  draw(FX.Poison, union(circle(8, 9, 5), circle(4, 5, 2), circle(12, 4, 1.6)), ['#5a1f7a', '#8a3ab0', '#c06ae0', '#f0c8ff'], { outline: '#2a0a3a' });
  draw(FX.Psy, (px, py) => Math.abs(Math.hypot(px - 8, py - 8) - 4.6) - 1.8, ['#c02a7a', '#ff5aa8', '#ffa6d6', '#ffffff'], { outline: '#5a0a3a' });
  draw(FX.Spectre, union(circle(8, 8, 5.5)), ['#2a1640', '#4a2a6a', '#7a4ab0', '#c8a6ff'], { outline: '#120a1f', color: (px, py) => ((px === 6 || px === 9) && py === 7 ? '#ffffff' : null) });
  draw(FX.Roche, poly([[4, 4], [11, 2], [14, 8], [11, 14], [4, 13], [2, 8]]), ['#5a4a32', '#8a6a44', '#b08a5a', '#d8b884'], { outline: '#2a2010' });
  draw(FX.Sol, union(circle(8, 9, 5), circle(5, 6, 3), circle(11, 6, 3)), ['#5a3a1a', '#8a5a2a', '#b07a40', '#d8a868'], { outline: '#2a1a08' });
  draw(FX.Vol, (px, py) => Math.max(circle(8, 10, 7)(px, py), -circle(10, 13, 6)(px, py)), ['#8a7ad8', '#b8a8ff', '#e6deff', '#ffffff'], { outline: '#3a2a7a' });
  const star = (cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) => (px, py) => { const a = Math.atan2(py - cy, px - cx) - rot; const k = (a / (2 * Math.PI / n)) % 1; const t = Math.abs(((k + 1) % 1) - 0.5) * 2; return Math.hypot(px - cx, py - cy) - (r2 + (r1 - r2) * t); };
  draw(FX.Normal, star(8, 8.5, 7, 3), ['#e0a800', '#ffd23a', '#fff27a', '#ffffff'], { outline: '#6a4a00' });
  draw(FX.Insecte, poly([[8, 0.5], [10.5, 12], [8, 15], [5.5, 12]]), ['#6a7a0a', '#a6b91a', '#d8e85a', '#ffffff'], { outline: '#2a3a00' });
  draw(FX.Combat, union(box(4, 5, 12, 12), circle(4.5, 7, 2), circle(11.5, 7, 2)), ['#a02a1a', '#d2513f', '#ff8a6a', '#ffd0c0'], { outline: '#4a0a08' });
  draw(FX.Dragon, tear(8, 9, 4.6, 6.5), ['#3a1a8a', '#6f35fc', '#a88aff', '#e6deff'], { outline: '#1a0a4a', yShade: 0.4 });
  draw(FX.Ténèbres, (px, py) => Math.max(circle(8, 8, 6)(px, py), -circle(10.5, 6.5, 5)(px, py)), ['#1f1814', '#3f322a', '#6b5a4c', '#a89080'], { outline: '#0a0806' });
  draw(FX.Acier, circle(8, 8, 5.5), ['#6a7084', '#9aa2b8', '#d0d6e6', '#ffffff'], { outline: '#2a2e3a' });
  draw(FX.Fée, star(8, 8, 7, 2.6, 4, 0), ['#d84a9a', '#ff8ac8', '#ffc6e6', '#ffffff'], { outline: '#6a1a4a' });
  draw(FX.bone, union(box(4, 7, 12, 9), circle(3.5, 6.5, 2), circle(3.5, 9.5, 2), circle(12.5, 6.5, 2), circle(12.5, 9.5, 2)), ['#b8ac8a', '#e8dcc0', '#fffaf0'], { outline: '#5a4a30' });
  draw(FX.spark, star(8, 8, 7.5, 1.6, 4, 0), ['#ffe08a', '#ffffff', '#ffffff'], {});
  draw(FX.dot, box(6, 6, 10, 10), ['#ffffff', '#ffffff'], {});
  draw(FX.smoke, union(circle(7, 9, 4.5), circle(10, 7, 4)), ['#c8c8d0', '#e6e6ee', '#ffffff'], { dither: 0.25 });
  draw(FX.ring, (px, py) => Math.abs(Math.hypot(px - 8, py - 8) - 6) - 0.9, ['#ffffff', '#ffffff'], {});
  for (let k = 0; k < 4; k += 1) {
    const w = [5.5, 4, 1.4, 4][k];
    draw(FX.coin0 + k, ellipse(8, 8, w, 5.5), ['#c07a00', '#f0b020', '#ffd84a', '#fff4b0'], { outline: '#5a3a00', color: (px, py) => (k !== 2 && px === 8 && py >= 6 && py <= 10 ? '#c07a00' : null) });
  }
  draw(FX.ball, circle(8, 8, 6), ['#ffffff'], {
    outline: '#1a1a1a',
    color: (px, py) => { const d = Math.hypot(px + 0.5 - 8, py + 0.5 - 8); if (py === 7 || py === 8) return d < 2.2 ? '#ffffff' : '#1a1a1a'; if (d < 2.6 && d > 1.4) return '#1a1a1a'; return py < 7 ? (px < 6 && py < 5 ? '#ff8a7a' : '#e3342f') : (px > 10 ? '#d8d8e0' : '#f5f5f5'); }
  });
  draw(FX.berry, union(circle(8, 9, 5)), ['#1f3f9a', '#3a6bdb', '#7fa6ff', '#ffffff'], { outline: '#0a1a4a', color: (px, py) => (py < 4 && px >= 7 && px <= 9 ? '#3f9f2f' : null) });
  draw(FX.heart, union(circle(5.5, 6.5, 3.5), circle(10.5, 6.5, 3.5), poly([[2, 7.5], [14, 7.5], [8, 14]])), ['#c02a4a', '#ff4a6a', '#ff9aa8', '#ffffff'], { outline: '#4a0a1a' });
  draw(FX.leafbig, ellipse(8, 8, 7, 3.6), ['#2f7f26', '#4caf3c', '#7dd75a', '#c8f59a'], { outline: '#123f14' });
  draw(FX.star4, star(8, 8, 7.5, 2.2, 4, Math.PI / 4), ['#ffffff', '#ffffff'], {});
  draw(FX.bubble, (px, py) => Math.abs(Math.hypot(px - 8, py - 8) - 5) - 1, ['#7fc4ff', '#e6f6ff', '#ffffff'], { color: (px, py) => (px === 6 && py === 5 ? '#ffffff' : null) });
  draw(FX.note, union(circle(6, 12, 2.6), box(7.5, 3, 9, 12), box(7.5, 3, 12, 5)), ['#2a1a4a', '#4a3a7a'], { outline: '#ffffff' });
  draw(FX.slash, (px, py) => Math.max(circle(4, 12, 11)(px, py), -circle(1.5, 14, 9.5)(px, py)), ['#ffffff', '#ffffff'], {});
  draw(FX.gem, poly([[8, 1], [13, 6], [8, 15], [3, 6]]), ['#1f9a4a', '#3ccf6e', '#8cf0a8', '#e6fff0'], { outline: '#0a4a20' });
  return pixelTex(c, false);
};
/** Halo doux (pour les effets lumineux en mode additif). */
export const makeGlowTexture = () => {
  const c = canvas(64, 64); const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
export const fxFrameOfType = (type) => (type in FX ? FX[type] : FX.Normal);

/** Petite icône de l'atlas sous forme d'URL (pour l'interface). */
let atlasCanvas = null;
export const fxIconUrl = (i) => {
  if (!atlasCanvas) { const t = makeFxAtlas(); atlasCanvas = t.image; }
  const c = canvas(16, 16); c.getContext('2d').drawImage(atlasCanvas, (i % FX_COLS) * 16, Math.floor(i / FX_COLS) * 16, 16, 16, 0, 0, 16, 16);
  return c.toDataURL();
};
