/**
 * Moteur 3D du mode « Sonic Bonk » (Three.js).
 * Île en relief façon Green Hill (falaises en damier), course rapide, sauts, spin dash,
 * ressorts, accélérateurs, moniteurs, coffres, hordes de robots instanciés et deux boss.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  BOSSES, ENEMIES, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, PASSIVES, RUN_SECONDS, WAVES, WEAPONS, xpToNext
} from './bonkData';

const TAU = Math.PI * 2;
const SIZE = 260;
const SEG = 200;
const R = 118; // rayon de l'île
const WATER = -0.8;
const GRAV = 34;
const MAX_ENEMIES = 340;
const CELL = 4;

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ——— Bruit ——— */
const hash2 = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const noise = (x, y, s) => {
  const xi = Math.floor(x); const yi = Math.floor(y);
  const xf = x - xi; const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s); const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s); const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

/* ——— Géométries « low poly » colorées ——— */
const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)
);
const part = (geo, color, m) => {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (m) g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < arr.length; i += 3) { arr[i] = c.r; arr[i + 1] = c.g; arr[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
};
const merge = (parts) => mergeGeometries(parts, false);
const S = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
const C = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const K = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);

const MODELS = {
  beetle: () => merge([
    part(S(0.55, 9, 6), '#1fb38a', M(0, 0.55, 0, 0, 0, 0, 1, 0.75, 1.2)),
    part(C(0.5, 0.5, 0.18, 10), '#20242e', M(0, 0.32, 0)),
    part(S(0.13), '#ffffff', M(0.18, 0.72, 0.52)),
    part(S(0.13), '#ffffff', M(-0.18, 0.72, 0.52)),
    part(S(0.06), '#111', M(0.18, 0.74, 0.63)),
    part(S(0.06), '#111', M(-0.18, 0.74, 0.63)),
    part(S(0.09), '#ffd23a', M(0.25, 0.85, -0.1)),
    part(S(0.09), '#ffd23a', M(-0.22, 0.8, -0.35)),
    part(new THREE.TorusGeometry(0.22, 0.09, 6, 10), '#2a2a2a', M(0, 0.24, 0.35, 0, Math.PI / 2, 0)),
    part(C(0.03, 0.03, 0.4), '#888', M(0, 1.0, 0.25, 0.4))
  ]),
  wasp: () => merge([
    part(S(0.42, 9, 6), '#ffcc1a', M(0, 0, 0, 0, 0, 0, 0.9, 0.9, 1.5)),
    part(C(0.39, 0.39, 0.14, 10), '#20242e', M(0, 0, -0.15, Math.PI / 2)),
    part(C(0.33, 0.33, 0.14, 10), '#20242e', M(0, 0, -0.42, Math.PI / 2)),
    part(K(0.14, 0.45), '#c9c9d6', M(0, 0, -0.85, -Math.PI / 2)),
    part(S(0.3), '#3a3f52', M(0, 0.08, 0.55)),
    part(S(0.1), '#ff3b3b', M(0.12, 0.14, 0.78)),
    part(S(0.1), '#ff3b3b', M(-0.12, 0.14, 0.78)),
    part(B(0.9, 0.04, 0.38), '#dff6ff', M(0.5, 0.35, 0, 0, 0, 0.35)),
    part(B(0.9, 0.04, 0.38), '#dff6ff', M(-0.5, 0.35, 0, 0, 0, -0.35))
  ]),
  crab: () => merge([
    part(B(1.3, 0.5, 0.9), '#ff6a3a', M(0, 0.7, 0)),
    part(B(1.1, 0.25, 0.75), '#c63d1a', M(0, 0.4, 0)),
    part(C(0.05, 0.05, 0.4), '#888', M(0.25, 1.1, 0.25)),
    part(C(0.05, 0.05, 0.4), '#888', M(-0.25, 1.1, 0.25)),
    part(S(0.12), '#ffffff', M(0.25, 1.3, 0.25)),
    part(S(0.12), '#ffffff', M(-0.25, 1.3, 0.25)),
    part(S(0.3, 7, 5), '#ff8a5a', M(0.95, 0.85, 0.45)),
    part(S(0.3, 7, 5), '#ff8a5a', M(-0.95, 0.85, 0.45)),
    part(K(0.16, 0.45), '#ffd23a', M(0.95, 0.85, 0.8, Math.PI / 2)),
    part(K(0.16, 0.45), '#ffd23a', M(-0.95, 0.85, 0.8, Math.PI / 2)),
    ...[-0.45, 0, 0.45].flatMap((z) => [
      part(C(0.05, 0.05, 0.6), '#5a5f72', M(0.7, 0.25, z, 0, 0, 0.6)),
      part(C(0.05, 0.05, 0.6), '#5a5f72', M(-0.7, 0.25, z, 0, 0, -0.6))
    ])
  ]),
  pawn: () => merge([
    part(C(0.42, 0.5, 0.9, 10), '#7b8aa8', M(0, 0.75, 0)),
    part(S(0.42, 10, 7), '#dfe6f2', M(0, 1.35, 0)),
    part(B(0.6, 0.14, 0.1), '#ff8a00', M(0, 1.38, 0.38)),
    part(C(0.45, 0.45, 0.1, 10), '#ff8a00', M(0, 0.95, 0)),
    part(C(0.12, 0.12, 0.4), '#3a3f52', M(0.18, 0.15, 0)),
    part(C(0.12, 0.12, 0.4), '#3a3f52', M(-0.18, 0.15, 0)),
    part(C(0.05, 0.05, 1.5), '#c9c9d6', M(0.55, 1.0, 0.1, 0.1)),
    part(K(0.1, 0.3), '#ff3b3b', M(0.55, 1.85, 0.18, 0.1))
  ]),
  roller: () => merge([
    part(new THREE.IcosahedronGeometry(0.6, 1), '#2b4fd6', M(0, 0.6, 0)),
    part(new THREE.TorusGeometry(0.6, 0.08, 6, 14), '#ffd23a', M(0, 0.6, 0, 0, Math.PI / 2, 0)),
    ...[0, 1, 2, 3, 4, 5].map((i) => part(K(0.12, 0.35, 5), '#dfe6f2', M(Math.cos(i * 1.05) * 0.62, 0.6 + Math.sin(i * 1.05) * 0.62, 0, 0, 0, i * 1.05 - Math.PI / 2)))
  ]),
  brute: () => merge([
    part(B(1.4, 1.3, 1.0), '#5a6178', M(0, 1.35, 0)),
    part(B(1.0, 0.5, 0.8), '#3a3f52', M(0, 2.2, 0)),
    part(B(0.7, 0.14, 0.1), '#ff2347', M(0, 2.25, 0.42)),
    part(B(0.55, 0.55, 0.55), '#7b8aa8', M(1.0, 1.75, 0)),
    part(B(0.55, 0.55, 0.55), '#7b8aa8', M(-1.0, 1.75, 0)),
    part(B(0.4, 0.9, 0.4), '#5a6178', M(1.0, 1.1, 0.1)),
    part(B(0.4, 0.9, 0.4), '#5a6178', M(-1.0, 1.1, 0.1)),
    part(B(0.5, 0.45, 0.5), '#ffb02e', M(1.0, 0.55, 0.15)),
    part(B(0.5, 0.45, 0.5), '#ffb02e', M(-1.0, 0.55, 0.15)),
    part(B(0.4, 0.7, 0.45), '#3a3f52', M(0.35, 0.35, 0)),
    part(B(0.4, 0.7, 0.45), '#3a3f52', M(-0.35, 0.35, 0))
  ]),
  titan: () => merge([
    part(B(1.5, 1.4, 1.1), '#c99a1a', M(0, 1.4, 0)),
    part(B(1.1, 0.6, 0.9), '#2a2d3a', M(0, 2.35, 0)),
    part(B(0.8, 0.16, 0.12), '#ff2347', M(0, 2.4, 0.47)),
    part(K(0.18, 0.6), '#ffffff', M(0.45, 2.85, 0, 0, 0, -0.4)),
    part(K(0.18, 0.6), '#ffffff', M(-0.45, 2.85, 0, 0, 0, 0.4)),
    part(B(0.6, 0.6, 0.6), '#ffd23a', M(1.1, 1.85, 0)),
    part(B(0.6, 0.6, 0.6), '#ffd23a', M(-1.1, 1.85, 0)),
    part(B(0.45, 1.0, 0.45), '#2a2d3a', M(1.1, 1.1, 0.1)),
    part(B(0.45, 1.0, 0.45), '#2a2d3a', M(-1.1, 1.1, 0.1)),
    part(B(0.6, 0.55, 0.6), '#c99a1a', M(1.1, 0.5, 0.2)),
    part(B(0.6, 0.55, 0.6), '#c99a1a', M(-1.1, 0.5, 0.2)),
    part(B(0.45, 0.75, 0.5), '#2a2d3a', M(0.38, 0.35, 0)),
    part(B(0.45, 0.75, 0.5), '#2a2d3a', M(-0.38, 0.35, 0))
  ]),
  colossus: () => merge([
    part(S(1.0, 12, 9), '#b8002e', M(0, 1.9, 0, 0, 0, 0, 1, 1.25, 1)),
    part(C(1.05, 1.05, 0.25, 14), '#2a2d3a', M(0, 1.7, 0)),
    part(S(0.32, 10, 8), '#8ff2ff', M(0, 2.1, 0.88)),
    part(B(1.3, 0.2, 0.2), '#ffd23a', M(0, 2.75, 0.55)),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => part(K(0.16, 0.7, 5), '#dfe6f2', M(Math.cos(i * 0.785) * 0.95, 2.6, Math.sin(i * 0.785) * 0.95, Math.sin(i * 0.785) * 0.8, 0, -Math.cos(i * 0.785) * 0.8))),
    part(B(0.5, 1.2, 0.5), '#2a2d3a', M(1.25, 1.6, 0, 0, 0, -0.3)),
    part(B(0.5, 1.2, 0.5), '#2a2d3a', M(-1.25, 1.6, 0, 0, 0, 0.3)),
    part(S(0.42), '#b8002e', M(1.5, 0.95, 0.2)),
    part(S(0.42), '#b8002e', M(-1.5, 0.95, 0.2)),
    part(C(0.35, 0.5, 0.9, 8), '#2a2d3a', M(0.5, 0.45, 0)),
    part(C(0.35, 0.5, 0.9, 8), '#2a2d3a', M(-0.5, 0.45, 0))
  ])
};

const palmGeo = () => {
  const parts = [];
  for (let i = 0; i < 6; i += 1) parts.push(part(C(0.22 - i * 0.015, 0.26 - i * 0.015, 1.05, 6), i % 2 ? '#a7663a' : '#c27a45', M(i * i * 0.025, 0.5 + i * 1.0, 0)));
  const top = new THREE.Vector3(25 * 0.025, 6.1, 0);
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * TAU;
    parts.push(part(B(0.5, 0.08, 2.6), i % 2 ? '#2fa84a' : '#3fc45a', M(top.x + Math.cos(a) * 1.2, top.y - 0.25, Math.sin(a) * 1.2, 0, -a + Math.PI / 2, 0.35)));
  }
  parts.push(part(S(0.22), '#6b3d20', M(top.x + 0.2, top.y - 0.35, 0.1)));
  parts.push(part(S(0.22), '#6b3d20', M(top.x - 0.15, top.y - 0.35, -0.15)));
  return merge(parts);
};
const flowerGeo = () => merge([
  part(C(0.05, 0.05, 1.1, 5), '#2f8a3a', M(0, 0.55, 0)),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => part(B(0.22, 0.06, 0.12), '#ffd23a', M(Math.cos(i * 0.785) * 0.24, 1.15, Math.sin(i * 0.785) * 0.24, 0, -i * 0.785, 0))),
  part(C(0.14, 0.14, 0.08, 8), '#7a3a10', M(0, 1.17, 0)),
  part(B(0.35, 0.05, 0.12), '#3fc45a', M(0.18, 0.5, 0, 0, 0, 0.5))
]);
const rockGeo = () => merge([part(new THREE.DodecahedronGeometry(1, 0), '#8f8a99', M(0, 0.4, 0, 0, 0, 0, 1, 0.75, 1))]);
const springGeo = () => merge([
  part(C(0.8, 0.9, 0.3, 12), '#c9c9d6', M(0, 0.15, 0)),
  part(C(0.45, 0.45, 0.45, 10), '#8f8a99', M(0, 0.5, 0)),
  part(C(0.85, 0.85, 0.25, 12), '#ff2347', M(0, 0.85, 0)),
  part(C(0.6, 0.6, 0.06, 12), '#ffd23a', M(0, 0.99, 0))
]);
const padGeo = () => merge([
  part(B(2.4, 0.15, 3.2), '#2a2d3a', M(0, 0.08, 0)),
  part(B(0.5, 0.05, 1.4), '#ffd23a', M(0, 0.18, -0.2)),
  part(K(0.9, 0.9, 3), '#ffd23a', M(0, 0.18, 0.9, Math.PI / 2, 0, 0, 1, 1, 0.06))
]);
const monitorGeo = () => merge([
  part(B(1.1, 1.0, 1.0), '#c9c9d6', M(0, 0.6, 0)),
  part(B(0.8, 0.65, 0.04), '#1a2a4a', M(0, 0.65, 0.51)),
  part(new THREE.TorusGeometry(0.2, 0.06, 5, 10), '#ffd23a', M(0, 0.65, 0.54)),
  part(B(1.15, 0.1, 1.05), '#7b8aa8', M(0, 0.1, 0))
]);
const chestGeo = () => merge([
  part(B(1.6, 0.9, 1.1), '#a7663a', M(0, 0.45, 0)),
  part(B(1.65, 0.12, 1.15), '#ffd23a', M(0, 0.9, 0)),
  part(C(0.55, 0.55, 1.6, 8, 1), '#c27a45', M(0, 1.0, 0, 0, 0, Math.PI / 2, 1, 1, 1)),
  part(B(0.3, 0.35, 0.1), '#ffd23a', M(0, 0.75, 0.58)),
  part(B(0.12, 1.2, 1.2), '#ffd23a', M(0.6, 0.7, 0)),
  part(B(0.12, 1.2, 1.2), '#ffd23a', M(-0.6, 0.7, 0))
]);

export const createBonk = (mount, overlay, character, callbacks = {}) => {
  /* ——— Rendu ——— */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  renderer.domElement.className = 'bk-gl';
  const scene = new THREE.Scene();
  const SKY = new THREE.Color('#8fd6ff');
  scene.background = SKY;
  scene.fog = new THREE.Fog(SKY, 70, 190);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500);
  scene.add(new THREE.HemisphereLight('#dff4ff', '#4f8a3a', 1.15));
  const sun = new THREE.DirectionalLight('#fff6e0', 1.6);
  sun.position.set(40, 80, 25);
  scene.add(sun);
  const octx = overlay.getContext('2d');
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  /* ——— Terrain ——— */
  const seed = Math.floor(Math.random() * 1000);
  const rawHeight = (x, z) => {
    const r = Math.hypot(x, z);
    const f = noise(x / 55, z / 55, seed) * 0.6 + noise(x / 22, z / 22, seed + 1) * 0.3 + noise(x / 9, z / 9, seed + 2) * 0.1;
    let h = Math.max(0, (f - 0.44) * 30);
    const step = 2.3;
    const t = h / step; const fr = t - Math.floor(t);
    h = (Math.floor(t) + smooth(0.8, 1, fr)) * step;
    h *= smooth(14, 26, r);
    const edge = smooth(0.8, 0.98, r / R);
    return h * (1 - edge) + (-3.5) * edge;
  };
  const N1 = SEG + 1;
  const CS = SIZE / SEG;
  const heights = new Float32Array(N1 * N1);
  for (let j = 0; j < N1; j += 1) for (let i = 0; i < N1; i += 1) heights[j * N1 + i] = rawHeight(-SIZE / 2 + i * CS, -SIZE / 2 + j * CS);
  const terrainAt = (x, z) => {
    const fx = (x + SIZE / 2) / CS; const fz = (z + SIZE / 2) / CS;
    const i = clamp(Math.floor(fx), 0, SEG - 1); const j = clamp(Math.floor(fz), 0, SEG - 1);
    const u = clamp(fx - i, 0, 1); const v = clamp(fz - j, 0, 1);
    const a = heights[j * N1 + i]; const b = heights[j * N1 + i + 1];
    const c = heights[(j + 1) * N1 + i]; const d = heights[(j + 1) * N1 + i + 1];
    // même découpage en triangles que PlaneGeometry
    if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
    return d + (c - d) * (1 - u) + (b - d) * (1 - v);
  };
  {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k += 1) pos.setY(k, terrainAt(pos.getX(k), pos.getZ(k)));
    const flat = geo.toNonIndexed();
    flat.computeVertexNormals();
    const p = flat.attributes.position; const nrm = flat.attributes.normal;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let k = 0; k < p.count; k += 3) {
      const cx = (p.getX(k) + p.getX(k + 1) + p.getX(k + 2)) / 3;
      const cy = (p.getY(k) + p.getY(k + 1) + p.getY(k + 2)) / 3;
      const cz = (p.getZ(k) + p.getZ(k + 1) + p.getZ(k + 2)) / 3;
      const ny = nrm.getY(k);
      if (cy < -0.25) c.set(cy < WATER - 0.5 ? '#c9b27a' : '#ecd9a0');
      else if (ny < 0.7) {
        // falaises en damier
        const chk = (Math.floor(cy / 1.15) + Math.floor((cx + cz) / 2.3)) & 1;
        c.set(chk ? '#b8642a' : '#7a3a14');
      } else {
        const chk = (Math.floor(cx / 6.5) + Math.floor(cz / 6.5)) & 1;
        c.set(chk ? '#5fcf3a' : '#4bb532');
        c.offsetHSL(0, 0, (hash2(Math.floor(cx * 3), Math.floor(cz * 3), 7) - 0.5) * 0.04);
      }
      for (let q = 0; q < 3; q += 1) { col[(k + q) * 3] = c.r; col[(k + q) * 3 + 1] = c.g; col[(k + q) * 3 + 2] = c.b; }
    }
    flat.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(track(flat), track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    scene.add(mesh);
    geo.dispose();
    // Mer
    const water = new THREE.Mesh(track(new THREE.PlaneGeometry(900, 900)), track(new THREE.MeshLambertMaterial({ color: '#2f8fe0', transparent: true, opacity: 0.85 })));
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER;
    scene.add(water);
  }
  const slopeAt = (x, z) => Math.abs(terrainAt(x + 1, z) - terrainAt(x - 1, z)) + Math.abs(terrainAt(x, z + 1) - terrainAt(x, z - 1));

  /* ——— Plateformes flottantes ——— */
  const platforms = [];
  const platMat = track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const platGeo = track(merge([
    part(B(6, 0.6, 6), '#4bb532', M(0, 0.3, 0)),
    part(B(6.05, 0.9, 6.05), '#b8642a', M(0, -0.45, 0)),
    part(K(2.6, 2.2, 6), '#7a3a14', M(0, -1.95, 0, Math.PI))
  ]));
  /* ——— Placement des éléments ——— */
  const freeSpot = (minR, maxR, maxSlope = 0.6) => {
    for (let k = 0; k < 60; k += 1) {
      const a = rand(0, TAU); const r = rand(minR, maxR);
      const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      if (terrainAt(x, z) > WATER + 0.6 && slopeAt(x, z) < maxSlope) return { x, z };
    }
    return null;
  };
  for (let k = 0; k < 12; k += 1) {
    const s = freeSpot(25, R * 0.75, 3);
    if (!s) continue;
    const y = terrainAt(s.x, s.z) + rand(4.5, 7.5);
    const m = new THREE.Mesh(platGeo, platMat);
    m.position.set(s.x, y - 0.6, s.z);
    scene.add(m);
    platforms.push({ x: s.x, z: s.z, top: y, half: 3 });
  }
  const groundAt = (x, z, y = Infinity) => {
    let g = terrainAt(x, z);
    for (let k = 0; k < platforms.length; k += 1) {
      const p = platforms[k];
      if (Math.abs(x - p.x) < p.half && Math.abs(z - p.z) < p.half && y >= p.top - 0.35 && p.top > g) g = p.top;
    }
    return g;
  };

  const vertexMat = track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const instanced = (geo, count) => {
    const m = new THREE.InstancedMesh(track(geo), vertexMat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    scene.add(m);
    return m;
  };
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const tmpV = new THREE.Vector3();
  const tmpS = new THREE.Vector3();
  const setInst = (mesh, i, x, y, z, ry = 0, sc = 1, rx = 0, rz = 0) => {
    tmpE.set(rx, ry, rz, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    tmpV.set(x, y, z); tmpS.set(sc, sc, sc);
    tmpM.compose(tmpV, tmpQ, tmpS);
    mesh.setMatrixAt(i, tmpM);
  };

  // Décor : palmiers, tournesols, rochers (colliders pour palmiers et rochers)
  const colliders = [];
  {
    const palms = []; const flowers = []; const rocks = [];
    for (let k = 0; k < 900 && palms.length < 70; k += 1) {
      const s = freeSpot(18, R * 0.9, 0.5);
      if (s) palms.push(s);
    }
    for (let k = 0; k < 900 && flowers.length < 120; k += 1) { const s = freeSpot(10, R * 0.9, 0.4); if (s) flowers.push(s); }
    for (let k = 0; k < 600 && rocks.length < 40; k += 1) { const s = freeSpot(18, R * 0.9, 1.2); if (s) rocks.push(s); }
    const pm = instanced(palmGeo(), palms.length);
    palms.forEach((s, i) => { setInst(pm, i, s.x, terrainAt(s.x, s.z) - 0.1, s.z, rand(0, TAU), rand(0.85, 1.2)); colliders.push({ x: s.x, z: s.z, r: 0.6 }); });
    const fm = instanced(flowerGeo(), flowers.length);
    flowers.forEach((s, i) => setInst(fm, i, s.x, terrainAt(s.x, s.z), s.z, rand(0, TAU), rand(0.8, 1.3)));
    const rm = instanced(rockGeo(), rocks.length);
    rocks.forEach((s, i) => { const sc = rand(0.8, 2); setInst(rm, i, s.x, terrainAt(s.x, s.z) - 0.2, s.z, rand(0, TAU), sc); colliders.push({ x: s.x, z: s.z, r: sc * 0.9 }); });
  }
  const colGrid = new Map();
  colliders.forEach((c) => {
    const k = `${Math.floor(c.x / 8)},${Math.floor(c.z / 8)}`;
    if (!colGrid.has(k)) colGrid.set(k, []);
    colGrid.get(k).push(c);
  });
  const pushOut = (e, r) => {
    const i0 = Math.floor(e.x / 8); const j0 = Math.floor(e.z / 8);
    for (let i = i0 - 1; i <= i0 + 1; i += 1) {
      for (let j = j0 - 1; j <= j0 + 1; j += 1) {
        const list = colGrid.get(`${i},${j}`);
        if (!list) continue;
        for (let k = 0; k < list.length; k += 1) {
          const c = list[k];
          const dx = e.x - c.x; const dz = e.z - c.z; const d = Math.hypot(dx, dz);
          const min = c.r + r;
          if (d > 0 && d < min) { e.x = c.x + (dx / d) * min; e.z = c.z + (dz / d) * min; }
        }
      }
    }
  };

  // Ressorts, accélérateurs, moniteurs, coffres
  const springs = []; const pads = []; const monitors = []; const chests = [];
  for (let k = 0; k < 14; k += 1) { const s = freeSpot(15, R * 0.85, 0.4); if (s) springs.push({ ...s, y: terrainAt(s.x, s.z), squash: 0 }); }
  platforms.forEach((p) => { const a = rand(0, TAU); const x = p.x + Math.cos(a) * 6; const z = p.z + Math.sin(a) * 6; if (slopeAt(x, z) < 0.6) springs.push({ x, z, y: terrainAt(x, z), squash: 0 }); });
  for (let k = 0; k < 10; k += 1) { const s = freeSpot(18, R * 0.8, 0.3); if (s) pads.push({ ...s, y: terrainAt(s.x, s.z), ang: rand(0, TAU) }); }
  for (let k = 0; k < 26; k += 1) { const s = freeSpot(12, R * 0.88, 0.4); if (s) monitors.push({ ...s, y: terrainAt(s.x, s.z), alive: true, kind: pick(['rings', 'rings', 'shield', 'shoes', 'heal']) }); }
  platforms.forEach((p, i) => { if (i % 2 === 0) monitors.push({ x: p.x, z: p.z, y: p.top, alive: true, kind: pick(['rings', 'shield', 'heal']) }); });
  for (let k = 0; k < 9; k += 1) { const s = freeSpot(20, R * 0.85, 0.3); if (s) chests.push({ ...s, y: terrainAt(s.x, s.z), open: false, ang: rand(0, TAU) }); }
  const springMesh = instanced(springGeo(), springs.length);
  const padMesh = instanced(padGeo(), pads.length);
  pads.forEach((p, i) => setInst(padMesh, i, p.x, p.y + 0.02, p.z, p.ang));
  const monitorMesh = instanced(monitorGeo(), monitors.length);
  const chestMesh = instanced(chestGeo(), chests.length);
  chests.forEach((c, i) => setInst(chestMesh, i, c.x, c.y, c.z, c.ang));

  // Anneaux posés sur la carte (lignes et arcs)
  const ringsMap = [];
  for (let k = 0; k < 26; k += 1) {
    const s = freeSpot(8, R * 0.85, 0.5);
    if (!s) continue;
    const a = rand(0, TAU);
    for (let i = 0; i < 7; i += 1) {
      const x = s.x + Math.cos(a) * i * 2.2; const z = s.z + Math.sin(a) * i * 2.2;
      ringsMap.push({ x, z, y: groundAt(x, z) + 1.2, v: 1 });
    }
  }
  springs.forEach((sp) => {
    for (let i = 0; i < 6; i += 1) ringsMap.push({ x: sp.x, z: sp.z, y: sp.y + 5 + i * 2.2, v: 1 });
  });
  const ringGeo = track(merge([part(new THREE.TorusGeometry(0.42, 0.11, 6, 14), '#ffd23a')]));
  const ringMat = track(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#7a5a00', emissiveIntensity: 0.6 }));
  const ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, 700);
  ringMesh.frustumCulled = false;
  scene.add(ringMesh);

  /* ——— Ciel : nuages ——— */
  const cloudGeo = track(merge([
    part(S(3, 7, 5), '#ffffff', M(0, 0, 0)), part(S(2.4, 7, 5), '#ffffff', M(2.8, -0.4, 0.4)),
    part(S(2.2, 7, 5), '#ffffff', M(-2.7, -0.5, -0.2)), part(S(1.8, 7, 5), '#f1f8ff', M(1, 1.4, 0.3))
  ]));
  const clouds = new THREE.InstancedMesh(cloudGeo, track(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ffffff', emissiveIntensity: 0.4 })), 26);
  const cloudList = Array.from({ length: 26 }, () => ({ x: rand(-200, 200), z: rand(-200, 200), y: rand(38, 60), s: rand(1, 2.4) }));
  scene.add(clouds);

  /* ——— Joueur : vrai modèle 3D animé (squelette + animations) ———
   * On essaie d'abord public/bonk/models/<perso>.glb (ton propre modèle), sinon le modèle
   * par défaut (RobotExpressive, CC0) teinté à la couleur du perso. */
  const charColor = new THREE.Color(character.color);
  const avatar = { root: new THREE.Group(), model: null, mixer: null, actions: {}, current: null, mats: [], yaw: 0, lean: 0, squash: 0, punchT: 0, wasGrounded: true, jumpT: 0 };
  scene.add(avatar.root);
  const MODEL_BASE = `${process.env.PUBLIC_URL || ''}/bonk/models`;
  const CLIPS = {
    idle: /idle|stand/i,
    run: /run|sprint/i,
    walk: /walk(?!jump)/i,
    jump: /jump|fall|air/i,
    punch: /punch|attack|slash/i,
    death: /death|die|dead/i,
    win: /dance|victory|wave|thumb/i
  };
  const play = (key, fade = 0.18) => {
    let k = key;
    if (!avatar.actions[k]) k = k === 'run' ? 'walk' : k === 'walk' ? 'run' : 'idle';
    const next = avatar.actions[k];
    if (!next || avatar.current === next) return next || null;
    next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (avatar.current) avatar.current.fadeOut(fade);
    avatar.current = next;
    return next;
  };
  const setupModel = (gltf, tint) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = list.map((m) => {
        const c = track(m.clone());
        if (tint && /main/i.test(m.name || '')) c.color.copy(charColor);
        if (!c.emissive) c.emissive = new THREE.Color(0, 0, 0);
        avatar.mats.push(c);
        return c;
      });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
    const box = new THREE.Box3().setFromObject(model);
    const h = (box.max.y - box.min.y) || 1;
    const sc = 2 / h;
    model.scale.multiplyScalar(sc);
    model.position.y = -box.min.y * sc;
    avatar.root.add(model);
    avatar.model = model;
    avatar.mixer = new THREE.AnimationMixer(model);
    Object.entries(CLIPS).forEach(([key, re]) => {
      const clip = gltf.animations.find((a) => (key === 'jump' ? /^jump$/i.test(a.name) : false)) || gltf.animations.find((a) => re.test(a.name));
      if (clip) avatar.actions[key] = avatar.mixer.clipAction(clip);
    });
    ['jump', 'punch', 'death', 'win'].forEach((k) => {
      const a = avatar.actions[k];
      if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    });
    play('idle', 0);
  };
  const fallbackModel = () => {
    // Si aucun modèle ne charge : un coureur simple aux couleurs du perso.
    const geo = merge([
      part(C(0.32, 0.38, 0.9, 10), character.color, M(0, 1.05, 0)),
      part(S(0.36, 12, 9), character.color, M(0, 1.75, 0)),
      part(C(0.12, 0.12, 0.7), '#2a2d3a', M(0.16, 0.35, 0)),
      part(C(0.12, 0.12, 0.7), '#2a2d3a', M(-0.16, 0.35, 0))
    ]);
    const m = new THREE.Mesh(track(geo), track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    avatar.mats.push(m.material);
    avatar.root.add(m);
    avatar.model = m;
  };
  const gltfLoader = new GLTFLoader();
  const loadDefault = () => gltfLoader.load(`${MODEL_BASE}/default.glb`, (gl) => setupModel(gl, true), undefined, fallbackModel);
  gltfLoader.load(`${MODEL_BASE}/${character.id}.glb`, (gl) => setupModel(gl, false), undefined, loadDefault);

  const ball = new THREE.Mesh(track(merge([
    part(new THREE.IcosahedronGeometry(0.7, 1), character.color),
    part(new THREE.TorusGeometry(0.55, 0.1, 5, 12), '#ffffff', M(0, 0, 0, 0, Math.PI / 2, 0))
  ])), track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: charColor, emissiveIntensity: 0.25 })));
  scene.add(ball);
  const shieldMesh = new THREE.Mesh(track(new THREE.SphereGeometry(1.25, 16, 12)), track(new THREE.MeshBasicMaterial({ color: '#7fe0ff', transparent: true, opacity: 0.22, depthWrite: false })));
  scene.add(shieldMesh);
  const flameMesh = new THREE.Mesh(track(new THREE.TorusGeometry(1, 0.12, 6, 32)), track(new THREE.MeshBasicMaterial({ color: '#ff7a1f', transparent: true, opacity: 0.7, depthWrite: false })));
  flameMesh.rotation.x = Math.PI / 2;
  scene.add(flameMesh);
  const hammerMesh = new THREE.Mesh(track(merge([
    part(C(0.08, 0.08, 1.6, 6), '#a7663a', M(0, 0, 0.8, Math.PI / 2)),
    part(B(0.9, 0.7, 0.7), '#ff5aa8', M(0, 0, 1.75)),
    part(B(0.95, 0.15, 0.75), '#ffd23a', M(0, 0, 1.75))
  ])), vertexMat);
  scene.add(hammerMesh);

  // Ombres « blob » (joueur + robots)
  const blobMat = track(new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  const blobGeo = track(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2));
  const blobs = new THREE.InstancedMesh(blobGeo, blobMat, MAX_ENEMIES + 4);
  blobs.frustumCulled = false;
  scene.add(blobs);

  /* ——— Robots ——— */
  const enemyMeshes = {};
  Object.keys(MODELS).forEach((kind) => {
    const big = kind === 'titan' || kind === 'colossus';
    const m = new THREE.InstancedMesh(track(MODELS[kind]()), vertexMat, big ? 2 : MAX_ENEMIES);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.count = 0;
    m.setColorAt(0, new THREE.Color(1, 1, 1));
    scene.add(m);
    enemyMeshes[kind] = m;
  });

  /* ——— Projectiles et objets ——— */
  const pool = (geo, mat, n) => { const m = new THREE.InstancedMesh(track(geo), mat, n); m.frustumCulled = false; m.count = 0; scene.add(m); return m; };
  const glow = (color) => track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
  const shotMeshes = {
    homing: pool(new THREE.IcosahedronGeometry(0.42, 1), glow('#4fb3ff'), 80),
    rings: pool(new THREE.TorusGeometry(0.45, 0.1, 5, 12), glow('#ffd23a'), 160),
    spear: pool(new THREE.ConeGeometry(0.16, 1.8, 5).rotateX(Math.PI / 2), glow('#ffe14a'), 80),
    tornado: pool(new THREE.ConeGeometry(1, 2.4, 9, 1, true).rotateX(Math.PI), track(new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })), 12),
    bullet: pool(new THREE.IcosahedronGeometry(0.35, 1), glow('#ff3bd0'), 160)
  };
  const orbMesh = pool(new THREE.OctahedronGeometry(0.28, 0), track(new THREE.MeshLambertMaterial({ color: '#5ff0ff', emissive: '#1a8fb8', emissiveIntensity: 0.9 })), 900);
  const waveMeshes = Array.from({ length: 10 }, () => {
    const m = new THREE.Mesh(track(new THREE.RingGeometry(0.9, 1, 40).rotateX(-Math.PI / 2)), track(new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })));
    m.visible = false;
    scene.add(m);
    return m;
  });
  const teleMeshes = Array.from({ length: 16 }, () => {
    const m = new THREE.Mesh(track(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2)), track(new THREE.MeshBasicMaterial({ color: '#ff3b2a', transparent: true, opacity: 0.3, depthWrite: false })));
    m.visible = false;
    scene.add(m);
    return m;
  });
  const boltGeo = new THREE.BufferGeometry();
  const boltPos = new Float32Array(600 * 3);
  boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPos, 3));
  const bolts = new THREE.LineSegments(track(boltGeo), track(new THREE.LineBasicMaterial({ color: '#e9d4ff' })));
  bolts.frustumCulled = false;
  scene.add(bolts);

  // Particules
  const PMAX = 2400;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PMAX * 3); const pCol = new Float32Array(PMAX * 3);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const points = new THREE.Points(track(pGeo), track(new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, depthWrite: false })));
  points.frustumCulled = false;
  scene.add(points);
  const parts = [];
  const tmpC = new THREE.Color();
  const particle = (x, y, z, color, n = 6, speed = 6, opts = {}) => {
    tmpC.set(color);
    for (let i = 0; i < n && parts.length < PMAX; i += 1) {
      const a = rand(0, TAU); const e = rand(-0.2, 1); const v = rand(speed * 0.3, speed);
      parts.push({ x, y, z, vx: Math.cos(a) * v * Math.cos(e), vy: Math.sin(e) * v + (opts.up || 0), vz: Math.sin(a) * v * Math.cos(e), life: rand(0.3, 0.7) * (opts.life || 1), r: tmpC.r, g: tmpC.g, b: tmpC.b, grav: opts.grav ?? 14 });
    }
  };

  /* ——— État ——— */
  const g = {
    t: 0,
    paused: false,
    over: null,
    kills: 0,
    rings: 0,
    spawnAcc: 0,
    bossIdx: 0,
    pendingLevels: 0,
    rerolls: 2,
    chestsOpened: 0,
    banner: null,
    trauma: 0,
    slow: 0,
    hurtFlash: 0,
    player: {
      x: 0, z: 0, y: terrainAt(0, 0), vx: 0, vy: 0, vz: 0,
      hp: character.hp, maxHp: character.hp,
      grounded: true, coyote: 0, jumpHeld: false, jumpBuffer: 0, airUsed: false, fuel: 2.4,
      bhop: 0, landT: 0, inv: 0, spin: 0, spinCd: 0, shield: 0, boost: 0, boostDir: null, shoes: 0,
      face: 0, step: 0, flip: 1, level: 1, xp: 0, need: xpToNext(1), gliding: false, flying: false
    },
    weapons: { [character.weapon]: { lv: 1, timer: 0.6 } },
    passives: {},
    enemies: [],
    shots: [],
    bullets: [],
    orbs: [],
    drops: [],
    waves: [],
    teles: [],
    zaps: [],
    texts: [],
    hammer: null,
    boss: null,
    cam: { yaw: 0, pitch: 0.36, dist: 10, x: 0, y: 8, z: 10 }
  };

  const stats = () => ({
    dmg: 1 + 0.12 * (g.passives.gloves || 0),
    speed: 1 + 0.08 * (g.passives.shoes || 0),
    magnet: 4.5 * (1 + 0.4 * (g.passives.magnet || 0)),
    cd: 1 - 0.07 * (g.passives.clock || 0),
    xp: 1 + 0.1 * (g.passives.chao || 0),
    crit: 0.05 + 0.05 * (g.passives.chao || 0)
  });

  const shake = (a) => { g.trauma = Math.min(1, g.trauma + a); };
  const text = (x, y, z, txt, color = '#fff', big = false) => {
    if (g.texts.length > 90) g.texts.shift();
    g.texts.push({ x, y, z, txt, color, big, life: big ? 1 : 0.7, max: big ? 1 : 0.7 });
  };
  const banner = (txt, life = 2.6) => { g.banner = { text: txt, life }; };

  /* ——— Grille des robots ——— */
  let grid = new Map();
  const buildGrid = () => {
    grid = new Map();
    for (let i = 0; i < g.enemies.length; i += 1) {
      const e = g.enemies[i];
      const k = `${Math.floor(e.x / CELL)},${Math.floor(e.z / CELL)}`;
      let cell = grid.get(k);
      if (!cell) { cell = []; grid.set(k, cell); }
      cell.push(e);
    }
  };
  const near = (x, z, r) => {
    const out = [];
    for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i += 1) {
      for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j += 1) {
        const cell = grid.get(`${i},${j}`);
        if (cell) for (let k = 0; k < cell.length; k += 1) out.push(cell[k]);
      }
    }
    return out;
  };
  const nearest = (x, z, range, skip) => {
    let best = null; let bd = range * range;
    for (let i = 0; i < g.enemies.length; i += 1) {
      const e = g.enemies[i];
      if (e.dead || (skip && skip.has(e))) continue;
      const d = (e.x - x) ** 2 + (e.z - z) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };
  const nearestN = (x, z, range, n) => g.enemies
    .filter((e) => !e.dead && (e.x - x) ** 2 + (e.z - z) ** 2 < range * range)
    .sort((a, b) => ((a.x - x) ** 2 + (a.z - z) ** 2) - ((b.x - x) ** 2 + (b.z - z) ** 2))
    .slice(0, n);

  /* ——— Apparitions ——— */
  const spawnEnemy = (id, at = null) => {
    const def = ENEMIES[id];
    let x; let z;
    if (at) { x = at.x; z = at.z; } else {
      let ok = false;
      for (let k = 0; k < 10 && !ok; k += 1) {
        const a = rand(0, TAU); const r = rand(36, 52);
        x = g.player.x + Math.cos(a) * r; z = g.player.z + Math.sin(a) * r;
        ok = Math.hypot(x, z) < R * 0.9 && terrainAt(x, z) > WATER;
      }
      if (!ok) return null;
    }
    const grow = def.boss ? 1 : 1 + g.t / 120;
    const hp = Math.round(def.hp * grow);
    const e = {
      id, def, kind: def.kind, x, z, y: groundAt(x, z) + (def.fly ? 2.4 : 0), vx: 0, vz: 0, vy: 0, kx: 0, kz: 0,
      hp, maxHp: hp, speed: def.speed * (def.boss ? 1 : rand(0.9, 1.12)),
      dmg: Math.round(def.dmg * (def.boss ? 1 : 0.8 + g.t / 300)), size: def.size, yaw: 0,
      flash: 0, phase: rand(0, TAU), hitCd: 0, cd: rand(1, 3), state: 'chase', st: 0, boss: def.boss || null,
      tick: 0, grounded: true, spinX: 0
    };
    g.enemies.push(e);
    return e;
  };
  const spawnTick = (dt) => {
    const interval = Math.max(0.09, 0.42 - g.t / 1100);
    const batch = 1 + Math.floor(g.t / 70);
    g.spawnAcc += dt;
    while (g.spawnAcc >= interval) {
      g.spawnAcc -= interval;
      const wave = [...WAVES].reverse().find((w) => g.t >= w.from) || WAVES[0];
      for (let i = 0; i < batch && g.enemies.length < MAX_ENEMIES; i += 1) spawnEnemy(pick(wave.list));
    }
    const next = BOSSES[g.bossIdx];
    if (next && g.t >= next.at) {
      const b = spawnEnemy(next.id);
      if (b) {
        g.bossIdx += 1;
        banner(next.title, 3.2);
        shake(0.7);
        particle(b.x, b.y + 2, b.z, '#ffd23a', 40, 12);
      }
    }
  };

  /* ——— Dégâts ——— */
  const hurt = (e, amount, src = null, knock = 4, color = null) => {
    if (e.dead) return;
    const s = stats();
    const crit = Math.random() < s.crit;
    const dmg = Math.max(1, Math.round(amount * s.dmg * (crit ? 2 : 1)));
    e.hp -= dmg;
    e.flash = 0.1;
    if (src) {
      const dx = e.x - src.x; const dz = e.z - src.z; const d = Math.hypot(dx, dz) || 1;
      const k = knock * (e.boss ? 0.05 : e.kind === 'brute' ? 0.35 : 1);
      e.kx += (dx / d) * k; e.kz += (dz / d) * k;
      if (!e.boss && knock > 5 && !e.def.fly) e.vy = Math.max(e.vy, knock * 0.9);
    }
    if (color) particle(e.x, e.y + e.size * 0.7, e.z, color, crit ? 8 : 3, 5);
    text(e.x + rand(-0.4, 0.4), e.y + e.size * 1.6 + (e.boss ? 3 : 0), e.z, crit ? `${dmg}!` : String(dmg), crit ? '#ff9a3c' : e.boss ? '#ffd23a' : '#ffffff', crit);
    if (e.hp <= 0) kill(e);
  };
  const dropOrb = (x, y, z, v) => g.orbs.push({ x, y: y + 0.6, z, v, vx: rand(-3, 3), vy: rand(4, 7), vz: rand(-3, 3) });
  const kill = (e) => {
    e.dead = true;
    g.kills += 1;
    // explosion de robot + petits animaux libérés (oiseaux)
    particle(e.x, e.y + e.size * 0.6, e.z, '#ffb347', e.boss ? 80 : 10, e.boss ? 18 : 7);
    particle(e.x, e.y + e.size * 0.6, e.z, '#6f6f7f', e.boss ? 40 : 6, e.boss ? 12 : 5);
    if (!e.boss) particle(e.x, e.y + 0.8, e.z, pick(['#ffffff', '#7fd0ff', '#ffe14a']), 2, 2, { up: 6, grav: -2, life: 2 });
    if (e.boss === 'final') {
      g.slow = 1.5;
      shake(1);
      g.over = 'win';
      setTimeout(() => callbacks.onEnd && callbacks.onEnd('win', snapshot()), 1200);
      return;
    }
    if (e.boss) {
      g.slow = 0.9; shake(0.9);
      for (let i = 0; i < 25; i += 1) dropOrb(e.x, e.y, e.z, 3);
      for (let i = 0; i < 20; i += 1) g.drops.push({ x: e.x, y: e.y + 2, z: e.z, vx: rand(-8, 8), vy: rand(6, 12), vz: rand(-8, 8), kind: 'ring', life: 12 });
      return;
    }
    dropOrb(e.x, e.y, e.z, e.def.xp);
    if (Math.random() < 0.18) g.drops.push({ x: e.x, y: e.y + 1, z: e.z, vx: rand(-2, 2), vy: rand(5, 8), vz: rand(-2, 2), kind: 'ring', life: 10 });
    if (e.size > 1.5) shake(0.1);
  };
  const hurtPlayer = (amount, src) => {
    const p = g.player;
    if (p.inv > 0 || g.over || p.spin > 0) return;
    if (p.shield > 0) {
      p.shield = 0; p.inv = 0.8;
      banner('Bouclier détruit !', 1.2);
      particle(p.x, p.y + 1, p.z, '#7fe0ff', 20, 8);
      return;
    }
    p.hp -= amount;
    p.inv = 0.7;
    g.hurtFlash = 0.3;
    shake(clamp(amount / 35, 0.2, 0.55));
    text(p.x, p.y + 2.6, p.z, `-${amount}`, '#ff5a5a', true);
    if (src) { const dx = p.x - src.x; const dz = p.z - src.z; const d = Math.hypot(dx, dz) || 1; p.vx += (dx / d) * 9; p.vz += (dz / d) * 9; p.vy = Math.max(p.vy, 5); p.grounded = false; }
    // Comme dans Sonic : on perd quelques anneaux en se faisant toucher.
    const lost = Math.min(g.rings, 3);
    g.rings -= lost;
    for (let i = 0; i < lost; i += 1) g.drops.push({ x: p.x, y: p.y + 1.5, z: p.z, vx: rand(-7, 7), vy: rand(6, 10), vz: rand(-7, 7), kind: 'ring', life: 4, delay: 0.8 });
    if (p.hp <= 0) {
      p.hp = 0;
      g.over = 'lose';
      g.slow = 1.2;
      particle(p.x, p.y + 1, p.z, character.color, 40, 10);
      setTimeout(() => callbacks.onEnd && callbacks.onEnd('lose', snapshot()), 900);
    }
  };

  /* ——— Attaques ——— */
  const forward = () => ({ x: -Math.sin(g.cam.yaw), z: -Math.cos(g.cam.yaw) });
  const fire = (id, w) => {
    const v = WEAPONS[id].at(w.lv);
    const p = g.player;
    const from = { x: p.x, y: p.y + 1.2, z: p.z };
    if (id === 'homing') {
      const t = nearest(p.x, p.z, 30);
      if (!t) return 0.2;
      g.shots.push({ kind: 'homing', ...from, target: t, speed: v.speed, dmg: v.dmg, chains: v.chains, hit: new Set(), life: 2.5 });
      return v.cd;
    }
    if (id === 'rings') {
      const t = nearest(p.x, p.z, 26);
      const f = t ? { x: t.x - p.x, z: t.z - p.z } : forward();
      const base = Math.atan2(f.z, f.x);
      for (let i = 0; i < v.count; i += 1) {
        const a = base + (i - (v.count - 1) / 2) * 0.2;
        g.shots.push({ kind: 'rings', ...from, vx: Math.cos(a) * v.speed, vz: Math.sin(a) * v.speed, vy: 0, dmg: v.dmg, pierce: v.pierce, hit: new Set(), life: 1.1, spin: 0 });
      }
      return v.cd;
    }
    if (id === 'spear') {
      const targets = nearestN(p.x, p.z, 34, v.count);
      if (!targets.length) return 0.2;
      targets.forEach((t) => {
        const dx = t.x - p.x; const dz = t.z - p.z; const dy = (t.y + t.size * 0.6) - from.y; const d = Math.hypot(dx, dz, dy) || 1;
        g.shots.push({ kind: 'spear', ...from, vx: (dx / d) * v.speed, vy: (dy / d) * v.speed, vz: (dz / d) * v.speed, dmg: v.dmg, pierce: 99, hit: new Set(), life: 0.9 });
      });
      return v.cd;
    }
    if (id === 'tornado') {
      for (let i = 0; i < v.count; i += 1) g.shots.push({ kind: 'tornado', x: p.x, y: p.y, z: p.z, cx: p.x, cz: p.z, a: rand(0, TAU) + i * Math.PI, r: 1, size: v.size, dmg: v.dmg, life: v.life, max: v.life, ticks: new Map() });
      return v.cd;
    }
    if (id === 'quake') {
      if (!nearest(p.x, p.z, v.radius + 2)) return 0.3;
      avatar.punchT = 0.45;
      wave(p.x, groundAt(p.x, p.z) + 0.15, p.z, v.radius, '#ff8a5a', 0.45);
      near(p.x, p.z, v.radius).forEach((e) => { if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < v.radius ** 2 && !e.def.fly) hurt(e, v.dmg, p, 9, '#ffb347'); });
      particle(p.x, p.y + 0.3, p.z, '#b8642a', 26, 9, { up: 3 });
      shake(0.22);
      return v.cd;
    }
    if (id === 'hammer') {
      if (!nearest(p.x, p.z, v.radius + 1.5)) return 0.25;
      g.hammer = { t: 0, dur: 0.32, radius: v.radius, dmg: v.dmg, hit: new Set() };
      avatar.punchT = 0.4;
      return v.cd;
    }
    if (id === 'lightning') {
      const targets = nearestN(p.x, p.z, v.range, v.count);
      if (!targets.length) return 0.25;
      targets.forEach((t) => {
        hurt(t, v.dmg, p, 2, '#e9d4ff');
        g.zaps.push({ x: t.x, y: t.y + t.size * 0.6, z: t.z, life: 0.16 });
      });
      return v.cd;
    }
    return 1;
  };
  const wave = (x, y, z, radius, color, dur) => {
    const m = waveMeshes.find((w) => !w.visible);
    if (!m) return;
    m.visible = true;
    m.material.color.set(color);
    m.position.set(x, y, z);
    m.userData = { t: 0, dur, radius };
  };
  const telegraph = (x, z, r, dur, onDone) => g.teles.push({ x, z, r, t: 0, dur, onDone });

  /* ——— Montée de niveau ——— */
  const levelOptions = () => {
    const opts = [];
    const ownedW = Object.keys(g.weapons); const ownedP = Object.keys(g.passives);
    ownedW.forEach((id) => { if (g.weapons[id].lv < MAX_LEVEL) opts.push({ kind: 'weapon', id, lv: g.weapons[id].lv + 1 }); });
    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS).filter((id) => !g.weapons[id]).forEach((id) => opts.push({ kind: 'weapon', id, lv: 1 }));
    ownedP.forEach((id) => { if (g.passives[id] < MAX_LEVEL) opts.push({ kind: 'passive', id, lv: g.passives[id] + 1 }); });
    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES).filter((id) => !g.passives[id]).forEach((id) => opts.push({ kind: 'passive', id, lv: 1 }));
    const out = opts.sort(() => Math.random() - 0.5).slice(0, 3);
    return out.length ? out : [{ kind: 'heal', id: 'heal', lv: 0 }];
  };
  const applyOption = (opt) => {
    if (opt.kind === 'weapon') {
      if (g.weapons[opt.id]) g.weapons[opt.id].lv += 1; else g.weapons[opt.id] = { lv: 1, timer: 0.3 };
    } else if (opt.kind === 'passive') {
      g.passives[opt.id] = (g.passives[opt.id] || 0) + 1;
      if (opt.id === 'heart') { g.player.maxHp += 25; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 25); }
    } else g.player.hp = Math.min(g.player.maxHp, g.player.hp + (opt.kind === 'skip' ? 15 : 30));
  };
  const askLevel = () => {
    if (g.paused || !g.pendingLevels || g.over) return;
    g.paused = true;
    releasePointer();
    if (callbacks.onLevelUp) callbacks.onLevelUp(levelOptions(), g.player.level, g.rerolls);
  };
  const gainXp = (v) => {
    const p = g.player;
    p.xp += v * stats().xp;
    while (p.xp >= p.need) {
      p.xp -= p.need; p.level += 1; p.need = xpToNext(p.level); g.pendingLevels += 1;
      wave(p.x, p.y + 0.2, p.z, 4, '#7fe0ff', 0.4);
    }
    askLevel();
  };
  const choose = (opt) => {
    applyOption(opt);
    g.pendingLevels = Math.max(0, g.pendingLevels - 1);
    g.paused = false;
    askLevel();
  };
  const reroll = () => { if (g.rerolls <= 0) return null; g.rerolls -= 1; return levelOptions(); };

  /* ——— Entrées ——— */
  const keys = new Set();
  const input = { jump: false, jumpPressed: false, dash: false, look: { x: 0, y: 0 }, stick: null };
  const KEYMAP = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => {
    if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
    if (e.code === 'Space') { if (!input.jump) input.jumpPressed = true; input.jump = true; e.preventDefault(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') { input.dash = true; e.preventDefault(); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && callbacks.onPauseKey) callbacks.onPauseKey();
  };
  const ku = (e) => {
    if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
    if (e.code === 'Space') input.jump = false;
  };
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
    // Tactile : moitié gauche = joystick, moitié droite = caméra
    const rect = canvas.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) input.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    else dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const mm = (e) => {
    if (locked()) { input.look.x += e.movementX; input.look.y += e.movementY; return; }
    if (input.stick && e.pointerId === input.stick.id) { input.stick.x = e.clientX; input.stick.y = e.clientY; return; }
    if (dragging && e.pointerId === dragging.id) {
      input.look.x += (e.clientX - dragging.x) * (dragging.mouse ? 1 : 1.6);
      input.look.y += (e.clientY - dragging.y) * (dragging.mouse ? 1 : 1.6);
      dragging.x = e.clientX; dragging.y = e.clientY;
    }
  };
  const mu = (e) => {
    if (input.stick && e.pointerId === input.stick.id) input.stick = null;
    if (dragging && e.pointerId === dragging.id) dragging = null;
  };
  const blur = () => { keys.clear(); input.jump = false; };
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', md);
  window.addEventListener('pointermove', mm);
  window.addEventListener('pointerup', mu);
  window.addEventListener('pointercancel', mu);
  canvas.style.touchAction = 'none';

  /* ——— Joueur ——— */
  const updatePlayer = (dt) => {
    const p = g.player;
    const s = stats();
    // caméra
    g.cam.yaw -= input.look.x * 0.0028;
    g.cam.pitch = clamp(g.cam.pitch + input.look.y * 0.0022, -0.05, 1.1);
    input.look.x = 0; input.look.y = 0;
    // direction voulue (relative à la caméra)
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
      p.face = Math.atan2(wx, wz);
      p.flip = ix < -0.1 ? -1 : ix > 0.1 ? 1 : p.flip;
    }
    p.shoes = Math.max(0, p.shoes - dt);
    const top = character.speed * s.speed * (1 + p.bhop) * (p.shoes > 0 ? 1.35 : 1) * (p.gliding ? 1.15 : 1);
    const accel = p.grounded ? 70 : 28;
    if (p.spin > 0) {
      p.spin -= dt;
    } else if (p.boost > 0) {
      p.boost -= dt;
      p.vx = p.boostDir.x * 32; p.vz = p.boostDir.z * 32;
    } else {
      const tx = wx * top; const tz = wz * top;
      const dvx = tx - p.vx; const dvz = tz - p.vz; const dl = Math.hypot(dvx, dvz);
      const maxDv = accel * dt;
      if (dl > maxDv && dl > 0) { p.vx += (dvx / dl) * maxDv; p.vz += (dvz / dl) * maxDv; } else { p.vx = tx; p.vz = tz; }
    }
    // saut / capacités aériennes
    p.coyote = p.grounded ? 0.12 : Math.max(0, p.coyote - dt);
    if (input.jumpPressed) p.jumpBuffer = 0.12;
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.gliding = false; p.flying = false;
    if (p.jumpBuffer > 0 && p.coyote > 0) {
      // Saut enchaîné juste à l'atterrissage : on garde de l'élan (« bunny hop »).
      if (p.landT < 0.2 && Math.hypot(p.vx, p.vz) > character.speed * 0.6) p.bhop = Math.min(0.45, p.bhop + 0.07);
      p.vy = character.jump;
      p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; p.airUsed = false;
      particle(p.x, p.y + 0.1, p.z, '#ffffff', 6, 3);
    } else if (input.jumpPressed && !p.grounded && !p.airUsed) {
      if (character.air === 'dash') {
        const d = il > 0 ? { x: wx, z: wz } : forward();
        const dl = Math.hypot(d.x, d.z) || 1;
        p.vx = (d.x / dl) * 30; p.vz = (d.z / dl) * 30; p.vy = Math.max(p.vy, 3);
        p.airUsed = true;
        particle(p.x, p.y + 1, p.z, '#bfe6ff', 14, 6);
      } else if (character.air === 'double') {
        p.vy = character.jump * 0.92; p.airUsed = true;
        particle(p.x, p.y + 0.5, p.z, '#ffb3dd', 12, 4);
      }
    }
    if (!p.grounded && input.jump && p.vy < 0) {
      if (character.air === 'glide') { p.vy = Math.max(p.vy, -2.6); p.gliding = true; }
      if (character.air === 'fly' && p.fuel > 0) { p.vy = Math.max(p.vy, 2.2); p.fuel -= dt; p.flying = true; }
    }
    input.jumpPressed = false;
    // spin dash
    p.spinCd = Math.max(0, p.spinCd - dt);
    if (input.dash && p.spinCd <= 0 && p.spin <= 0) {
      const d = il > 0 ? { x: wx, z: wz } : (Math.hypot(p.vx, p.vz) > 1 ? { x: p.vx, z: p.vz } : forward());
      const dl = Math.hypot(d.x, d.z) || 1;
      p.vx = (d.x / dl) * 34; p.vz = (d.z / dl) * 34;
      p.spin = 0.38; p.spinCd = 1.3 * s.cd; p.inv = Math.max(p.inv, 0.4);
      particle(p.x, p.y + 0.4, p.z, '#ffffff', 12, 5);
      shake(0.08);
    }
    input.dash = false;
    // gravité + déplacement (avec murs : on ne grimpe pas une falaise sans sauter)
    p.vy -= GRAV * dt * (p.gliding ? 0.25 : 1);
    const nx = p.x + p.vx * dt; const nz = p.z + p.vz * dt;
    const gx = groundAt(nx, p.z, p.y + 0.6); const gz = groundAt(p.x, nz, p.y + 0.6);
    if (gx <= p.y + 0.7) p.x = nx; else p.vx *= -0.1;
    if (gz <= p.y + 0.7) p.z = nz; else p.vz *= -0.1;
    pushOut(p, 0.5);
    const rr = Math.hypot(p.x, p.z);
    if (rr > R * 0.9) { p.x *= (R * 0.9) / rr; p.z *= (R * 0.9) / rr; }
    p.y += p.vy * dt;
    const ground = groundAt(p.x, p.z, p.y + 0.4);
    const wasGrounded = p.grounded;
    if (p.y <= ground && p.vy <= 0) {
      if (!wasGrounded) { p.landT = 0; if (p.vy < -18) { shake(0.12); particle(p.x, ground + 0.1, p.z, '#ecd9a0', 10, 5); } }
      p.y = ground; p.vy = 0; p.grounded = true; p.fuel = 2.4; p.airUsed = false;
    } else if (p.y > ground + 0.05) {
      p.grounded = false;
    } else if (wasGrounded) p.y = ground; // colle aux descentes
    if (p.grounded) { p.landT += dt; if (p.landT > 0.25) p.bhop = Math.max(0, p.bhop - dt * 0.6); }
    // eau : on est remis sur la plage
    if (p.y < WATER - 0.4) { p.x *= 0.92; p.z *= 0.92; p.vy = 12; hurtPlayer(8, null); }
    p.inv = Math.max(0, p.inv - dt);
    const sp = Math.hypot(p.vx, p.vz);
    p.step += dt * sp * 0.9;
    if (p.grounded && sp > 4 && Math.random() < dt * sp * 0.6) particle(p.x, p.y + 0.1, p.z, '#e9f7d0', 1, 1.5, { up: 1.5 });
    // spin dash : écrase les robots touchés
    if (p.spin > 0) {
      near(p.x, p.z, 2.5).forEach((e) => {
        if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < (e.size + 0.9) ** 2 && e.hitCd <= 0) { e.hitCd = 0.35; hurt(e, 24 + p.level * 2, p, 10, character.color); }
      });
    }
    // rebond sur la tête d'un robot
    if (!p.grounded && p.vy < 0) {
      near(p.x, p.z, 3).some((e) => {
        if (e.dead) return false;
        const top = e.y + e.size * 1.2;
        if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < (e.size * 0.8 + 0.5) ** 2 && p.y < top + 0.3 && p.y > top - 0.9) {
          hurt(e, 30 + p.level * 3, p, 3, '#ffffff');
          p.vy = 14; p.airUsed = false; p.inv = Math.max(p.inv, 0.25);
          particle(p.x, p.y, p.z, '#ffffff', 10, 6);
          return true;
        }
        return false;
      });
    }
    // ressorts et accélérateurs
    springs.forEach((spg) => {
      if ((spg.x - p.x) ** 2 + (spg.z - p.z) ** 2 < 1.1 ** 2 && p.y < spg.y + 1.4 && p.vy <= 0.5) {
        p.vy = 30; p.grounded = false; p.airUsed = false; spg.squash = 0.3;
        particle(spg.x, spg.y + 1, spg.z, '#ffd23a', 14, 6);
      }
    });
    pads.forEach((pd) => {
      if ((pd.x - p.x) ** 2 + (pd.z - p.z) ** 2 < 1.8 ** 2 && p.y < pd.y + 1) {
        p.boost = 0.7; p.boostDir = { x: Math.sin(pd.ang), z: Math.cos(pd.ang) };
        p.face = pd.ang;
      }
    });
    // moniteurs (on les casse en les touchant)
    monitors.forEach((mo) => {
      if (!mo.alive || (mo.x - p.x) ** 2 + (mo.z - p.z) ** 2 > 1.3 ** 2 || Math.abs(p.y - mo.y) > 1.6) return;
      mo.alive = false;
      particle(mo.x, mo.y + 0.7, mo.z, '#c9c9d6', 16, 7);
      if (!p.grounded) { p.vy = 12; }
      if (mo.kind === 'rings') { g.rings += 10; banner('+10 anneaux', 1.2); }
      if (mo.kind === 'shield') { p.shield = 1; banner('Bouclier !', 1.2); }
      if (mo.kind === 'shoes') { p.shoes = 10; banner('Chaussures de vitesse !', 1.2); }
      if (mo.kind === 'heal') { p.hp = Math.min(p.maxHp, p.hp + 30); banner('+30 PV', 1.2); }
    });
    // coffres
    chests.forEach((c) => {
      if (c.open || (c.x - p.x) ** 2 + (c.z - p.z) ** 2 > 2.2 ** 2 || Math.abs(p.y - c.y) > 2) return;
      const cost = chestCost();
      if (g.rings < cost) { c.hint = 0.5; return; }
      g.rings -= cost; c.open = true; g.chestsOpened += 1;
      const opt = levelOptions()[0];
      applyOption(opt);
      const label = opt.kind === 'weapon' ? WEAPONS[opt.id].name : opt.kind === 'passive' ? PASSIVES[opt.id].name : 'Soin';
      banner(`Coffre : ${label}${opt.lv > 1 ? ` (niv. ${opt.lv})` : ''}`, 2.4);
      particle(c.x, c.y + 1.2, c.z, '#ffd23a', 40, 9, { up: 4 });
      shake(0.15);
    });
  };
  const chestCost = () => Math.round(20 * (1 + g.chestsOpened * 0.6));

  /* ——— Robots ——— */
  const updateEnemies = (dt) => {
    const p = g.player;
    for (let i = 0; i < g.enemies.length; i += 1) {
      const e = g.enemies[i];
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.hitCd = Math.max(0, e.hitCd - dt);
      e.st += dt;
      e.cd -= dt;
      const dx = p.x - e.x; const dz = p.z - e.z; const d = Math.hypot(dx, dz) || 1;
      let mx = dx / d; let mz = dz / d;
      let sp = e.speed;
      if (e.def.charge) {
        if (e.state === 'chase' && e.cd <= 0 && d < 16 && d > 4) { e.state = 'wind'; e.st = 0; e.dir = { x: mx, z: mz }; }
        if (e.state === 'wind') { sp = 0; if (e.st > 0.5) { e.state = 'go'; e.st = 0; } }
        if (e.state === 'go') { mx = e.dir.x; mz = e.dir.z; sp = e.speed * 3.2; e.spinX += dt * 20; if (e.st > 0.7) { e.state = 'chase'; e.cd = rand(2.5, 4); } }
      }
      if (e.def.shoots && e.cd <= 0 && d < 24) {
        e.cd = rand(2.6, 3.6);
        const ty = p.y + 1; const fy = e.y + 1;
        const dd = Math.hypot(dx, dz, ty - fy) || 1;
        g.bullets.push({ x: e.x, y: fy, z: e.z, vx: (dx / dd) * 13, vy: ((ty - fy) / dd) * 13, vz: (dz / dd) * 13, dmg: Math.round(e.dmg * 0.8), life: 3 });
      }
      if (e.kind === 'titan') {
        if (e.state === 'chase' && e.cd <= 0) { e.state = 'jump'; e.st = 0; e.vy = 22; e.target = { x: p.x, z: p.z }; telegraph(p.x, p.z, 9, 1.3, null); e.cd = 6; }
        if (e.state === 'jump') {
          mx = (e.target.x - e.x); mz = (e.target.z - e.z); const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l; sp = Math.min(l / 1.2, 18);
          if (e.grounded && e.st > 0.3) {
            e.state = 'chase';
            wave(e.x, groundAt(e.x, e.z) + 0.2, e.z, 9, '#ff3b2a', 0.5);
            shake(0.6);
            particle(e.x, e.y + 0.3, e.z, '#b8642a', 40, 10, { up: 4 });
            if ((p.x - e.x) ** 2 + (p.z - e.z) ** 2 < 81 && p.grounded) hurtPlayer(e.dmg, e);
            for (let k = 0; k < 4; k += 1) spawnEnemy('beetle', { x: e.x + rand(-5, 5), z: e.z + rand(-5, 5) });
          }
        }
      }
      if (e.kind === 'colossus') {
        if (e.cd <= 0) {
          e.cd = 5;
          if (Math.random() < 0.5) {
            // pluie de missiles annoncée au sol
            for (let k = 0; k < 9; k += 1) {
              const a = rand(0, TAU); const r = k === 0 ? 0 : rand(3, 14);
              const x = p.x + Math.cos(a) * r; const z = p.z + Math.sin(a) * r;
              telegraph(x, z, 3.2, 1.1 + k * 0.06, () => {
                particle(x, groundAt(x, z) + 0.5, z, '#ff6a1f', 18, 9, { up: 4 });
                shake(0.12);
                if ((p.x - x) ** 2 + (p.z - z) ** 2 < 3.4 ** 2 && p.y - groundAt(x, z) < 2.5) hurtPlayer(20, { x, z });
              });
            }
          } else {
            for (let k = 0; k < 18; k += 1) {
              const a = (k / 18) * TAU;
              g.bullets.push({ x: e.x, y: e.y + 2, z: e.z, vx: Math.cos(a) * 11, vy: 0, vz: Math.sin(a) * 11, dmg: 18, life: 4 });
            }
          }
        }
        if (d < 12) sp *= 0.4;
      }
      // séparation
      let sx = 0; let sz = 0;
      const others = near(e.x, e.z, e.size + 1);
      for (let k = 0; k < others.length && k < 12; k += 1) {
        const o = others[k];
        if (o === e) continue;
        const ox = e.x - o.x; const oz = e.z - o.z; const od = Math.hypot(ox, oz); const min = (e.size + o.size) * 0.6;
        if (od > 0 && od < min) { const push = ((min - od) / min) * (o.boss && !e.boss ? 10 : 4); sx += (ox / od) * push; sz += (oz / od) * push; }
      }
      e.x += (mx * sp + sx + e.kx) * dt;
      e.z += (mz * sp + sz + e.kz) * dt;
      e.kx *= Math.pow(0.03, dt); e.kz *= Math.pow(0.03, dt);
      if (!e.def.fly && !e.boss) pushOut(e, e.size * 0.5);
      const ground = groundAt(e.x, e.z, e.y + 1);
      if (e.def.fly) {
        e.y += ((ground + 2.4 + Math.sin(g.t * 3 + e.phase) * 0.5) - e.y) * Math.min(1, dt * 4);
      } else {
        e.vy -= GRAV * dt;
        e.y += e.vy * dt;
        if (e.y <= ground) { e.y = ground; e.vy = 0; e.grounded = true; } else e.grounded = e.y < ground + 0.05;
        // petits sauts en marchant (les robots « trottent »)
        if (e.grounded && !e.boss && e.kind !== 'roller' && Math.random() < dt * 0.4) e.vy = 4;
      }
      if (Math.hypot(e.x, e.z) > R * 0.95) { e.x *= 0.99; e.z *= 0.99; }
      e.yaw = Math.atan2(mx, mz);
      if (e.kind === 'roller' && e.state !== 'go') e.spinX += dt * sp * 1.5;
      // contact
      const reach = e.size * 0.75 + 0.5;
      if (d < reach && Math.abs((p.y + 0.8) - (e.y + e.size * 0.7)) < e.size + 1) {
        if (p.spin > 0) { /* le spin dash gère */ } else hurtPlayer(e.dmg, e);
      }
      if (!e.boss && d > 75) { const a = rand(0, TAU); e.x = p.x + Math.cos(a) * 45; e.z = p.z + Math.sin(a) * 45; e.y = groundAt(e.x, e.z); }
    }
    if (g.enemies.some((e) => e.dead)) g.enemies = g.enemies.filter((e) => !e.dead);
    g.boss = g.enemies.find((e) => e.boss) || null;
  };

  /* ——— Projectiles ——— */
  const updateShots = (dt) => {
    const p = g.player;
    const s = stats();
    Object.entries(g.weapons).forEach(([id, w]) => {
      if (id === 'flame') return;
      w.timer -= dt;
      if (w.timer <= 0) w.timer = fire(id, w) * s.cd;
    });
    // bouclier flamme
    if (g.weapons.flame) {
      const v = WEAPONS.flame.at(g.weapons.flame.lv);
      g.flameTick = (g.flameTick || 0) - dt;
      if (g.flameTick <= 0) {
        g.flameTick = 0.25;
        near(p.x, p.z, v.radius + 1).forEach((e) => { if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < (v.radius + e.size * 0.4) ** 2) hurt(e, v.dps * 0.25, p, 1.5, '#ff7a1f'); });
      }
      if (Math.random() < 0.5) { const a = rand(0, TAU); particle(p.x + Math.cos(a) * v.radius, p.y + 0.3, p.z + Math.sin(a) * v.radius, pick(['#ff7a1f', '#ffd23a']), 1, 1, { up: 3, grav: -3 }); }
    }
    // marteau
    if (g.hammer) {
      const h = g.hammer;
      h.t += dt;
      const a = g.player.face + (h.t / h.dur) * TAU;
      near(p.x, p.z, h.radius + 1).forEach((e) => {
        if (h.hit.has(e) || (e.x - p.x) ** 2 + (e.z - p.z) ** 2 > (h.radius + e.size * 0.4) ** 2) return;
        const ea = Math.atan2(e.x - p.x, e.z - p.z);
        let diff = ea - a; while (diff > Math.PI) diff -= TAU; while (diff < -Math.PI) diff += TAU;
        if (Math.abs(diff) < 0.6) { h.hit.add(e); hurt(e, h.dmg, p, 12, '#ff5aa8'); }
      });
      if (h.t >= h.dur) { g.hammer = null; shake(0.06); }
    }
    g.shots.forEach((sh) => {
      sh.life -= dt;
      if (sh.kind === 'homing') {
        if (!sh.target || sh.target.dead) sh.target = nearest(sh.x, sh.z, 16, sh.hit);
        if (!sh.target) { sh.life = 0; return; }
        const t = sh.target;
        const dx = t.x - sh.x; const dy = (t.y + t.size * 0.6) - sh.y; const dz = t.z - sh.z; const d = Math.hypot(dx, dy, dz) || 1;
        sh.x += (dx / d) * sh.speed * dt; sh.y += (dy / d) * sh.speed * dt; sh.z += (dz / d) * sh.speed * dt;
        if (Math.random() < 0.6) particle(sh.x, sh.y, sh.z, '#4fb3ff', 1, 0.5, { grav: 0, life: 0.6 });
        if (d < t.size * 0.7 + 0.4) {
          hurt(t, sh.dmg, sh, 5, '#9fd8ff');
          sh.hit.add(t);
          sh.chains -= 1;
          if (sh.chains < 0) sh.life = 0; else sh.target = nearest(sh.x, sh.z, 14, sh.hit);
        }
        return;
      }
      if (sh.kind === 'tornado') {
        sh.a += dt * 3; sh.r += dt * 6;
        sh.x = sh.cx + Math.cos(sh.a) * sh.r; sh.z = sh.cz + Math.sin(sh.a) * sh.r;
        sh.y = groundAt(sh.x, sh.z);
        near(sh.x, sh.z, sh.size + 1).forEach((e) => {
          if ((e.x - sh.x) ** 2 + (e.z - sh.z) ** 2 > (sh.size + e.size * 0.4) ** 2) return;
          const last = sh.ticks.get(e) || -1;
          if (g.t - last < 0.4) return;
          sh.ticks.set(e, g.t);
          hurt(e, sh.dmg, sh, 7, '#dff6ff');
        });
        if (Math.random() < 0.7) particle(sh.x + rand(-1, 1), sh.y + rand(0, 2), sh.z + rand(-1, 1), '#ffffff', 1, 2, { up: 4, grav: 0 });
        return;
      }
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.z += sh.vz * dt;
      if (sh.kind === 'rings') sh.spin += dt * 20;
      if (sh.kind === 'spear' && Math.random() < 0.8) particle(sh.x, sh.y, sh.z, '#ffe14a', 1, 0.5, { grav: 0, life: 0.4 });
      near(sh.x, sh.z, 2.5).some((e) => {
        if (sh.hit.has(e)) return false;
        if ((e.x - sh.x) ** 2 + (e.z - sh.z) ** 2 > (e.size * 0.7 + 0.4) ** 2 || Math.abs(sh.y - (e.y + e.size * 0.6)) > e.size + 0.8) return false;
        sh.hit.add(e);
        hurt(e, sh.dmg, { x: sh.x - sh.vx, z: sh.z - sh.vz }, 4, sh.kind === 'rings' ? '#ffd23a' : '#ffe14a');
        sh.pierce -= 1;
        if (sh.pierce <= 0) { sh.life = 0; return true; }
        return false;
      });
    });
    g.shots = g.shots.filter((sh) => sh.life > 0);
    g.bullets.forEach((b) => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.life -= dt;
      if ((b.x - p.x) ** 2 + (b.z - p.z) ** 2 < 0.9 && Math.abs(b.y - (p.y + 1)) < 1.2) { hurtPlayer(b.dmg, b); b.life = 0; particle(b.x, b.y, b.z, '#ff3bd0', 8, 4); }
      if (b.y < groundAt(b.x, b.z) - 0.2) b.life = 0;
    });
    g.bullets = g.bullets.filter((b) => b.life > 0);
    g.teles.forEach((tg) => { tg.t += dt; if (tg.t >= tg.dur) { tg.done = true; if (tg.onDone) tg.onDone(); } });
    g.teles = g.teles.filter((tg) => !tg.done);
    g.zaps.forEach((z) => { z.life -= dt; });
    g.zaps = g.zaps.filter((z) => z.life > 0);
  };

  /* ——— Ramassage ——— */
  const updatePickups = (dt) => {
    const p = g.player;
    const s = stats();
    const py = p.y + 1;
    g.orbs.forEach((o) => {
      if (o.vy !== undefined) {
        o.x += o.vx * dt; o.z += o.vz * dt; o.y += o.vy * dt; o.vy -= GRAV * 0.6 * dt; o.vx *= 0.96; o.vz *= 0.96;
        const gr = groundAt(o.x, o.z) + 0.4;
        if (o.y < gr) { o.y = gr; o.vy = undefined; }
      }
      const d = Math.hypot(o.x - p.x, o.y - py, o.z - p.z);
      if (d < s.magnet || o.pulled) {
        o.pulled = true; o.vy = undefined;
        o.pull = (o.pull || 8) + 60 * dt;
        const k = Math.min(1, (o.pull * dt) / Math.max(d, 0.01));
        o.x += (p.x - o.x) * k; o.y += (py - o.y) * k; o.z += (p.z - o.z) * k;
      }
      if (d < 0.9) { o.got = true; gainXp(o.v); }
    });
    g.orbs = g.orbs.filter((o) => !o.got);
    if (g.orbs.length > 800) { const extra = g.orbs.splice(0, g.orbs.length - 700); g.orbs.push({ ...extra[0], v: extra.reduce((a, o) => a + o.v, 0) }); }
    const grab = (r) => {
      const d = Math.hypot(r.x - p.x, r.y - py, r.z - p.z);
      if (d < s.magnet * 0.8 && !(r.delay > 0)) {
        const k = Math.min(1, (30 * dt) / Math.max(d, 0.01));
        r.x += (p.x - r.x) * k; r.y += (py - r.y) * k; r.z += (p.z - r.z) * k;
      }
      if (d < 1 && !(r.delay > 0)) { r.got = true; g.rings += 1; particle(r.x, r.y, r.z, '#ffe680', 3, 3, { grav: 0 }); }
    };
    ringsMap.forEach((r) => { if (!r.got) grab(r); });
    g.drops.forEach((r) => {
      r.delay = (r.delay || 0) - dt;
      r.life -= dt;
      if (r.vy !== undefined) {
        r.x += r.vx * dt; r.z += r.vz * dt; r.y += r.vy * dt; r.vy -= GRAV * 0.7 * dt;
        const gr = groundAt(r.x, r.z) + 0.6;
        if (r.y < gr) { r.y = gr; r.vy = Math.abs(r.vy) > 3 ? -r.vy * 0.5 : undefined; r.vx *= 0.7; r.vz *= 0.7; }
      }
      grab(r);
    });
    g.drops = g.drops.filter((r) => !r.got && r.life > 0);
  };

  const updateParticles = (dt) => {
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const q = parts[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      q.vy -= q.grav * dt; q.vx *= 0.97; q.vz *= 0.97;
      q.life -= dt;
      if (q.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); }
    }
    g.texts.forEach((t) => { t.life -= dt; t.y += dt * 1.6; });
    g.texts = g.texts.filter((t) => t.life > 0);
    g.trauma = Math.max(0, g.trauma - dt * 1.5);
    g.hurtFlash = Math.max(0, g.hurtFlash - dt);
    if (g.banner) { g.banner.life -= dt; if (g.banner.life <= 0) g.banner = null; }
  };

  const update = (raw) => {
    if (g.paused) return;
    if (g.slow > 0) g.slow -= raw;
    const dt = g.slow > 0 ? raw * 0.3 : raw;
    if (g.over) { updateParticles(dt); return; }
    g.t += dt;
    updatePlayer(dt);
    spawnTick(dt);
    buildGrid();
    updateEnemies(dt);
    updateShots(dt);
    updatePickups(dt);
    updateParticles(dt);
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

  const white = new THREE.Color(1, 1, 1);
  const flashC = new THREE.Color(4, 4, 4);
  const proj = new THREE.Vector3();
  const toScreen = (x, y, z) => {
    proj.set(x, y, z).project(camera);
    if (proj.z > 1) return null;
    return { x: (proj.x * 0.5 + 0.5) * size.w, y: (-proj.y * 0.5 + 0.5) * size.h };
  };

  // Mini-carte (image des hauteurs)
  const mini = document.createElement('canvas');
  mini.width = 120; mini.height = 120;
  {
    const mx = mini.getContext('2d');
    const img = mx.createImageData(120, 120);
    for (let j = 0; j < 120; j += 1) {
      for (let i = 0; i < 120; i += 1) {
        const x = -SIZE / 2 + (i / 120) * SIZE; const z = -SIZE / 2 + (j / 120) * SIZE;
        const h = terrainAt(x, z);
        const c = h < WATER ? [47, 143, 224] : h < -0.25 ? [236, 217, 160] : [70 + h * 8, 180 - h * 4, 50];
        const o = (j * 120 + i) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    mx.putImageData(img, 0, 0);
  }

  const animateAvatar = (dt) => {
    const p = g.player;
    const spd = Math.hypot(p.vx, p.vz);
    const balled = p.spin > 0;
    ball.visible = balled;
    avatar.root.visible = !balled && !(p.inv > 0 && p.spin <= 0 && !g.over && Math.floor(p.inv * 18) % 2 === 0);
    if (balled) {
      ball.position.set(p.x, p.y + 0.7, p.z);
      ball.rotation.x -= 0.5;
      ball.rotation.y = p.face;
    }
    // orientation douce + inclinaison dans les virages et en pleine course
    let diff = p.face - avatar.yaw;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    avatar.yaw += diff * Math.min(1, dt * 12);
    avatar.lean += (clamp(diff * 0.6, -0.35, 0.35) * Math.min(1, spd / 8) - avatar.lean) * Math.min(1, dt * 8);
    if (!p.grounded && avatar.wasGrounded) avatar.jumpT = 0;
    if (p.grounded && !avatar.wasGrounded) avatar.squash = 0.18;
    avatar.wasGrounded = p.grounded;
    avatar.squash = Math.max(0, avatar.squash - dt * 1.2);
    avatar.punchT = Math.max(0, avatar.punchT - dt);
    avatar.root.position.set(p.x, p.y, p.z);
    avatar.root.rotation.set(Math.min(0.18, spd * 0.007), avatar.yaw, -avatar.lean, 'YXZ');
    const sq = avatar.squash;
    avatar.root.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    // flash rouge quand on est touché
    const hurt = g.hurtFlash > 0 ? g.hurtFlash * 2 : 0;
    avatar.mats.forEach((m) => { if (m.emissive) m.emissive.setRGB(hurt, hurt * 0.1, hurt * 0.1); });
    if (!avatar.mixer) {
      if (avatar.model) avatar.model.position.y = p.grounded && spd > 1 ? Math.abs(Math.sin(p.step * 1.6)) * 0.15 : 0;
      return;
    }
    let state;
    if (g.over === 'lose') state = 'death';
    else if (g.over === 'win') state = 'win';
    else if (!p.grounded) state = 'jump';
    else if (avatar.punchT > 0) state = 'punch';
    else if (spd > 7) state = 'run';
    else if (spd > 0.6) state = 'walk';
    else state = 'idle';
    const action = play(state, state === 'jump' ? 0.08 : 0.18);
    if (action) {
      if (state === 'run') action.timeScale = clamp(spd / 9, 0.8, 2.4);
      else if (state === 'walk') action.timeScale = clamp(spd / 3.2, 0.6, 1.8);
      else if (state === 'jump') {
        avatar.jumpT += dt;
        // en plané / vol, on fige la pose « en l'air » du saut
        action.timeScale = p.gliding || p.flying ? 0 : 1.3;
      } else action.timeScale = 1;
    }
    avatar.mixer.update(dt);
  };

  const render = (dt = 1 / 60) => {
    const p = g.player;
    // Caméra 3e personne
    const cp = Math.cos(g.cam.pitch); const sp = Math.sin(g.cam.pitch);
    const dist = g.cam.dist + Math.hypot(p.vx, p.vz) * 0.08;
    let cx = p.x + Math.sin(g.cam.yaw) * dist * cp;
    let cz = p.z + Math.cos(g.cam.yaw) * dist * cp;
    let cy = p.y + 1.6 + dist * sp;
    cy = Math.max(cy, groundAt(cx, cz) + 0.8);
    const tr = g.trauma * g.trauma;
    cx += (Math.random() - 0.5) * tr * 1.2; cy += (Math.random() - 0.5) * tr * 1.2; cz += (Math.random() - 0.5) * tr * 1.2;
    g.cam.x += (cx - g.cam.x) * 0.35; g.cam.y += (cy - g.cam.y) * 0.35; g.cam.z += (cz - g.cam.z) * 0.35;
    camera.position.set(g.cam.x, g.cam.y, g.cam.z);
    camera.lookAt(p.x, p.y + 1.6, p.z);
    camera.fov = 62 + Math.min(14, Math.hypot(p.vx, p.vz) * 0.35);
    camera.updateProjectionMatrix();

    // Joueur : modèle animé (boule pendant le spin dash)
    animateAvatar(dt);
    shieldMesh.visible = p.shield > 0;
    shieldMesh.position.set(p.x, p.y + 1, p.z);
    shieldMesh.material.opacity = 0.18 + Math.sin(g.t * 6) * 0.06;
    flameMesh.visible = !!g.weapons.flame;
    if (g.weapons.flame) {
      const r = WEAPONS.flame.at(g.weapons.flame.lv).radius;
      flameMesh.position.set(p.x, p.y + 0.3, p.z);
      flameMesh.scale.set(r, r, 1 + Math.sin(g.t * 12) * 0.3);
      flameMesh.rotation.z = g.t * 2;
    }
    hammerMesh.visible = !!g.hammer;
    if (g.hammer) {
      hammerMesh.position.set(p.x, p.y + 1, p.z);
      hammerMesh.rotation.set(0, p.face + (g.hammer.t / g.hammer.dur) * TAU, 0);
      hammerMesh.scale.setScalar(g.hammer.radius / 2.2);
    }

    // Robots
    const counts = {};
    Object.keys(enemyMeshes).forEach((k) => { counts[k] = 0; });
    let bi = 0;
    setInst(blobs, bi, p.x, groundAt(p.x, p.z, p.y + 0.5) + 0.04, p.z, 0, 0.7 * clamp(1 - (p.y - groundAt(p.x, p.z, p.y + 0.5)) / 12, 0.3, 1));
    bi += 1;
    g.enemies.forEach((e) => {
      const m = enemyMeshes[e.kind];
      const i = counts[e.kind];
      if (i >= m.instanceMatrix.count) return;
      counts[e.kind] += 1;
      const wob = e.kind === 'beetle' || e.kind === 'pawn' || e.kind === 'brute' || e.boss ? Math.sin(g.t * 10 + e.phase) * 0.08 : 0;
      const shakeX = e.state === 'wind' ? (Math.random() - 0.5) * 0.3 : 0;
      const sc = (e.boss ? e.size / 2.1 : e.size) * (e.flash > 0 ? 1.12 : 1);
      setInst(m, i, e.x + shakeX, e.y + (e.def.fly ? 0 : 0), e.z, e.yaw, sc, e.kind === 'roller' ? e.spinX : 0, wob);
      m.setColorAt(i, e.flash > 0 ? flashC : white);
      if (bi < blobs.instanceMatrix.count) { setInst(blobs, bi, e.x, groundAt(e.x, e.z) + 0.04, e.z, 0, e.size * 0.8); bi += 1; }
    });
    Object.entries(enemyMeshes).forEach(([k, m]) => {
      m.count = counts[k];
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    blobs.count = bi;
    blobs.instanceMatrix.needsUpdate = true;

    // Projectiles
    const sc = { homing: 0, rings: 0, spear: 0, tornado: 0, bullet: 0 };
    g.shots.forEach((sh) => {
      const m = shotMeshes[sh.kind];
      const i = sc[sh.kind];
      if (i >= m.instanceMatrix.count) return;
      sc[sh.kind] += 1;
      if (sh.kind === 'spear') {
        const yaw = Math.atan2(sh.vx, sh.vz); const pitch = -Math.atan2(sh.vy, Math.hypot(sh.vx, sh.vz));
        setInst(m, i, sh.x, sh.y, sh.z, yaw, 1, pitch);
      } else if (sh.kind === 'rings') setInst(m, i, sh.x, sh.y, sh.z, sh.spin, 1, Math.PI / 2);
      else if (sh.kind === 'tornado') {
        const k = Math.min(1, (sh.max - sh.life) * 4) * Math.min(1, sh.life * 3);
        setInst(m, i, sh.x, sh.y + 1.2 * sh.size / 2, sh.z, g.t * 9, sh.size * 0.6 * k);
      } else setInst(m, i, sh.x, sh.y, sh.z, g.t * 5, 1 + Math.sin(g.t * 30) * 0.15);
    });
    g.bullets.forEach((b) => { const i = sc.bullet; if (i < shotMeshes.bullet.instanceMatrix.count) { sc.bullet += 1; setInst(shotMeshes.bullet, i, b.x, b.y, b.z, g.t * 4, 1); } });
    Object.entries(shotMeshes).forEach(([k, m]) => { m.count = sc[k]; m.instanceMatrix.needsUpdate = true; });

    // XP et anneaux
    let oi = 0;
    g.orbs.forEach((o) => { if (oi < 900) { setInst(orbMesh, oi, o.x, o.y + Math.sin(g.t * 4 + o.x) * 0.1, o.z, g.t * 2, o.v >= 10 ? 1.8 : o.v >= 3 ? 1.3 : 1); oi += 1; } });
    orbMesh.count = oi; orbMesh.instanceMatrix.needsUpdate = true;
    let ri = 0;
    const ringSpin = g.t * 3;
    ringsMap.forEach((r) => { if (!r.got && ri < 700) { setInst(ringMesh, ri, r.x, r.y + Math.sin(g.t * 2 + r.x) * 0.1, r.z, ringSpin, 1); ri += 1; } });
    g.drops.forEach((r) => { if (ri < 700) { setInst(ringMesh, ri, r.x, r.y, r.z, ringSpin * 2, r.life < 2 && Math.floor(r.life * 10) % 2 ? 0.01 : 1); ri += 1; } });
    ringMesh.count = ri; ringMesh.instanceMatrix.needsUpdate = true;

    // Ressorts, moniteurs
    springs.forEach((s2, i) => { s2.squash = Math.max(0, s2.squash - 0.016); setInst(springMesh, i, s2.x, s2.y - s2.squash, s2.z, 0, 1); });
    springMesh.instanceMatrix.needsUpdate = true;
    let mi = 0;
    monitors.forEach((mo) => { if (mo.alive) { setInst(monitorMesh, mi, mo.x, mo.y + Math.abs(Math.sin(g.t * 2 + mo.x)) * 0.15, mo.z, g.t * 0.8 + mo.x, 1); mi += 1; } });
    monitorMesh.count = mi; monitorMesh.instanceMatrix.needsUpdate = true;
    let ci = 0;
    chests.forEach((c) => { if (!c.open) { setInst(chestMesh, ci, c.x, c.y, c.z, c.ang, 1); ci += 1; } });
    chestMesh.count = ci; chestMesh.instanceMatrix.needsUpdate = true;
    cloudList.forEach((c, i) => { c.x += 0.02; if (c.x > 220) c.x = -220; setInst(clouds, i, c.x, c.y, c.z, 0, c.s); });
    clouds.instanceMatrix.needsUpdate = true;

    // Ondes et zones annoncées
    waveMeshes.forEach((m) => {
      if (!m.visible) return;
      const u = m.userData;
      u.t += 1 / 60;
      const k = u.t / u.dur;
      if (k >= 1) { m.visible = false; return; }
      m.scale.setScalar(0.5 + k * u.radius);
      m.material.opacity = 0.9 * (1 - k);
    });
    teleMeshes.forEach((m) => { m.visible = false; });
    g.teles.forEach((tg, i) => {
      const m = teleMeshes[i];
      if (!m) return;
      m.visible = true;
      const k = tg.t / tg.dur;
      m.position.set(tg.x, groundAt(tg.x, tg.z) + 0.08, tg.z);
      m.scale.setScalar(tg.r * (0.3 + 0.7 * k));
      m.material.opacity = 0.25 + 0.3 * k;
    });
    // Éclairs
    let bp = 0;
    g.zaps.forEach((z) => {
      let lx = z.x; let ly = z.y + 14; let lz = z.z;
      for (let s2 = 1; s2 <= 6 && bp < 590; s2 += 1) {
        const nx2 = z.x + (s2 < 6 ? rand(-0.8, 0.8) : 0); const ny = z.y + 14 - (14 * s2) / 6; const nz = z.z + (s2 < 6 ? rand(-0.8, 0.8) : 0);
        boltPos.set([lx, ly, lz, nx2, ny, nz], bp * 3);
        bp += 2; lx = nx2; ly = ny; lz = nz;
      }
    });
    boltGeo.setDrawRange(0, bp);
    boltGeo.attributes.position.needsUpdate = true;
    // Particules
    for (let i = 0; i < parts.length; i += 1) {
      const q = parts[i];
      pPos[i * 3] = q.x; pPos[i * 3 + 1] = q.y; pPos[i * 3 + 2] = q.z;
      const a = Math.min(1, q.life * 3);
      pCol[i * 3] = q.r * a; pCol[i * 3 + 1] = q.g * a; pCol[i * 3 + 2] = q.b * a;
    }
    pGeo.setDrawRange(0, parts.length);
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
    drawOverlay();
  };

  const drawOverlay = () => {
    const { w, h, dpr } = size;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, w, h);
    const p = g.player;
    // Chiffres de dégâts
    octx.textAlign = 'center';
    g.texts.forEach((t) => {
      const sp2 = toScreen(t.x, t.y, t.z);
      if (!sp2) return;
      const k = 1 - t.life / t.max;
      const pop = k < 0.15 ? 1 + (0.15 - k) * 5 : 1;
      octx.font = `900 ${(t.big ? 24 : 17) * pop}px "Saira", "Arial Black", sans-serif`;
      octx.globalAlpha = Math.min(1, (t.life / t.max) * 2.5);
      octx.lineWidth = 4; octx.strokeStyle = 'rgba(0,0,0,.7)';
      octx.strokeText(t.txt, sp2.x, sp2.y);
      octx.fillStyle = t.color; octx.fillText(t.txt, sp2.x, sp2.y);
    });
    octx.globalAlpha = 1;
    // Prix des coffres proches
    chests.forEach((c) => {
      if (c.open || (c.x - p.x) ** 2 + (c.z - p.z) ** 2 > 22 ** 2) return;
      const sp2 = toScreen(c.x, c.y + 2.2, c.z);
      if (!sp2) return;
      const cost = chestCost();
      const ok = g.rings >= cost;
      octx.font = '900 15px "Saira", sans-serif';
      const label = `◎ ${cost}`;
      const tw = octx.measureText(label).width + 16;
      octx.fillStyle = ok ? 'rgba(255,210,58,.95)' : 'rgba(10,20,50,.8)';
      octx.beginPath(); octx.roundRect(sp2.x - tw / 2, sp2.y - 13, tw, 24, 12); octx.fill();
      octx.fillStyle = ok ? '#3a1d00' : '#ffd23a';
      octx.fillText(label, sp2.x, sp2.y + 5);
    });
    // Robots qui vont charger
    g.enemies.forEach((e) => {
      if (e.state !== 'wind') return;
      const sp2 = toScreen(e.x, e.y + e.size * 2 + 0.5, e.z);
      if (!sp2) return;
      octx.font = '900 22px "Saira", sans-serif';
      octx.lineWidth = 4; octx.strokeStyle = '#000'; octx.strokeText('!', sp2.x, sp2.y);
      octx.fillStyle = '#ff3b2a'; octx.fillText('!', sp2.x, sp2.y);
    });
    // Vignette rouge quand on est touché
    if (g.hurtFlash > 0) {
      const gr = octx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
      gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,30,30,${g.hurtFlash * 1.4})`);
      octx.fillStyle = gr; octx.fillRect(0, 0, w, h);
    }
    // Vitesse : traits sur les bords
    const spd = Math.hypot(p.vx, p.vz);
    if (spd > character.speed * 1.25) {
      const a = clamp((spd - character.speed * 1.25) / 20, 0, 0.5);
      octx.strokeStyle = `rgba(255,255,255,${a})`; octx.lineWidth = 2;
      for (let i = 0; i < 14; i += 1) {
        const ang = rand(0, TAU); const r1 = Math.max(w, h) * rand(0.42, 0.55);
        octx.beginPath();
        octx.moveTo(w / 2 + Math.cos(ang) * r1, h / 2 + Math.sin(ang) * r1);
        octx.lineTo(w / 2 + Math.cos(ang) * r1 * 1.3, h / 2 + Math.sin(ang) * r1 * 1.3);
        octx.stroke();
      }
    }
    // Mini-carte
    const ms = w < 640 ? 96 : 140;
    const mx0 = w - ms - 14; const my0 = 70;
    octx.save();
    octx.beginPath(); octx.arc(mx0 + ms / 2, my0 + ms / 2, ms / 2, 0, TAU); octx.clip();
    octx.drawImage(mini, mx0, my0, ms, ms);
    const k = ms / SIZE;
    const mp = (x, z) => [mx0 + (x + SIZE / 2) * k, my0 + (z + SIZE / 2) * k];
    octx.fillStyle = '#ffd23a';
    chests.forEach((c) => { if (!c.open) { const [x, y] = mp(c.x, c.z); octx.fillRect(x - 2, y - 2, 4, 4); } });
    octx.fillStyle = 'rgba(255,60,60,.8)';
    g.enemies.forEach((e, i) => { if (i % 2 === 0) { const [x, y] = mp(e.x, e.z); octx.fillRect(x, y, 1.5, 1.5); } });
    if (g.boss) { const [x, y] = mp(g.boss.x, g.boss.z); octx.fillStyle = '#ff2347'; octx.beginPath(); octx.arc(x, y, 4, 0, TAU); octx.fill(); }
    const [px, py] = mp(p.x, p.z);
    octx.translate(px, py); octx.rotate(-g.cam.yaw);
    octx.fillStyle = '#ffffff';
    octx.beginPath(); octx.moveTo(0, -6); octx.lineTo(4, 4); octx.lineTo(-4, 4); octx.closePath(); octx.fill();
    octx.restore();
    octx.strokeStyle = 'rgba(255,255,255,.8)'; octx.lineWidth = 3;
    octx.beginPath(); octx.arc(mx0 + ms / 2, my0 + ms / 2, ms / 2, 0, TAU); octx.stroke();
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
    // (le premier horodatage peut précéder « last » : jamais de dt négatif)
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = Math.max(last, now);
    update(dt);
    render(g.paused ? 0 : dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const snapshot = () => ({
    t: g.t,
    kills: g.kills,
    rings: g.rings,
    level: g.player.level,
    hp: g.player.hp,
    maxHp: g.player.maxHp,
    xp: g.player.xp,
    need: g.player.need,
    weapons: Object.entries(g.weapons).map(([id, w]) => ({ id, lv: w.lv })),
    passives: Object.entries(g.passives).map(([id, lv]) => ({ id, lv })),
    boss: g.boss ? { name: g.boss.def.name, hp: Math.max(0, g.boss.hp), maxHp: g.boss.maxHp } : null,
    banner: g.banner?.text || null,
    dash: 1 - g.player.spinCd / 1.3,
    shield: g.player.shield > 0,
    speed: Math.round(Math.hypot(g.player.vx, g.player.vz) * 3.6),
    bhop: g.player.bhop,
    remaining: Math.max(0, RUN_SECONDS - g.t)
  });

  if (typeof window !== 'undefined' && window.__BONK_DEBUG) window.__bonk = { g, input, keys, terrainAt, groundAt, camera };

  return {
    snapshot,
    choose,
    reroll,
    jump(down) { if (down && !input.jump) input.jumpPressed = true; input.jump = down; },
    dash() { input.dash = true; },
    setPaused(v) {
      if (g.pendingLevels && !v) return;
      g.paused = v;
      if (v) releasePointer();
      if (!v) last = performance.now();
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
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); });
      disposables.forEach((d) => d.dispose?.());
      Object.values(enemyMeshes).forEach((m) => m.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
};
