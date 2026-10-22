/**
 * Poké Rush : l'île de Kanto, en 3D façon pixel art.
 * Terrain en terrasses (falaises de briques ocre), sol texturé pixel par pixel (herbe, hautes herbes,
 * sable, chemin, dalles de l'arène), décor en sprites dessinés à la main par le code (arbres, fleurs, rochers),
 * rivière et lac, ciel, nuages et montagnes au loin.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PROPS, PROP_PIX, makeGroundTextures, makePropAtlas } from './rushArt';

export const TAU = Math.PI * 2;
export const SIZE = 240;
export const SEG = 220;
export const R = 104;
export const WATER = -0.6;

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

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

/* ——— Géométries simples colorées (objets 3D : Poké Balls, piliers…) ——— */
export const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)
);
export const part = (geo, color, m) => {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (m) g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < arr.length; i += 3) { arr[i] = c.r; arr[i + 1] = c.g; arr[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
};
export const merge = (parts) => mergeGeometries(parts, false);
export const S = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
export const C = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
export const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const K = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
export const I = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);

/** Grosse Poké Ball d'objets (Super Ball), posée au sol. */
export const chestGeo = () => merge([
  part(new THREE.SphereGeometry(0.75, 18, 9, 0, TAU, 0, Math.PI / 2), '#2f6fe0', M(0, 0.78, 0)),
  part(new THREE.SphereGeometry(0.76, 18, 9, 0, TAU, Math.PI / 2, Math.PI / 2), '#f2f2f6', M(0, 0.78, 0)),
  part(C(0.77, 0.77, 0.1, 22), '#1a1a22', M(0, 0.78, 0)),
  part(B(0.22, 0.12, 0.5), '#e2342f', M(0.42, 1.28, 0, 0, 0, -0.55)),
  part(B(0.22, 0.12, 0.5), '#e2342f', M(-0.42, 1.28, 0, 0, 0, 0.55)),
  part(C(0.2, 0.2, 0.08, 14), '#1a1a22', M(0, 0.78, 0.74, Math.PI / 2)),
  part(C(0.13, 0.13, 0.1, 14), '#ffffff', M(0, 0.78, 0.77, Math.PI / 2))
]);

/* ——— Matériaux ——— */
const LIGHT_DIR = new THREE.Vector3(-0.45, 0.85, 0.35).normalize();
const terrainVert = `
varying vec3 vW;
varying vec3 vN;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const terrainFrag = `
uniform sampler2D tGrass; uniform sampler2D tTall; uniform sampler2D tSand; uniform sampler2D tPath; uniform sampler2D tStone; uniform sampler2D tCliff;
uniform sampler2D tKind;
uniform vec3 uLight;
uniform float uSize;
uniform float uWater;
varying vec3 vW;
varying vec3 vN;
#include <fog_pars_fragment>
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 n = normalize(vN);
  vec2 kuv = (vW.xz + uSize * 0.5) / uSize;
  vec4 km = texture2D(tKind, kuv);
  float kind = floor(km.r * 255.0 + 0.5);
  vec2 uvT = vW.xz / 2.0;
  vec3 top;
  if (kind < 0.5) top = texture2D(tGrass, uvT).rgb;
  else if (kind < 1.5) top = texture2D(tTall, uvT).rgb;
  else if (kind < 2.5) top = texture2D(tSand, uvT).rgb;
  else if (kind < 3.5) top = texture2D(tStone, uvT).rgb;
  else top = texture2D(tPath, uvT).rgb;
  // sable des berges
  if (vW.y < uWater + 0.35 && kind < 1.5) top = texture2D(tSand, uvT).rgb;
  // légère variation de teinte à grande échelle
  top *= 0.94 + km.g * 0.12;
  vec2 uvS = abs(n.x) > abs(n.z) ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
  vec3 side = texture2D(tCliff, uvS / vec2(4.0, 2.0)).rgb;
  // lèvre d'herbe en haut des falaises (bord dentelé)
  float lip = fract(vW.y / 2.0);
  float jag = h21(floor(uvS * 16.0) + vec2(0.0, floor(vW.y / 2.0)));
  if (lip > 0.88 + jag * 0.07 && kind < 1.5) side = texture2D(tGrass, uvS / 2.0).rgb * 0.92;
  float isTop = step(0.62, n.y);
  vec3 col = mix(side, top, isTop);
  float diff = max(dot(n, uLight), 0.0);
  float shade = 0.62 + diff * 0.48;
  if (isTop < 0.5) shade = 0.7 + diff * 0.35;
  col *= shade;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
const waterFrag = `
uniform sampler2D tWater; uniform sampler2D tKind; uniform float uT; uniform float uSize;
varying vec3 vW;
varying vec3 vN;
#include <fog_pars_fragment>
void main() {
  vec2 uv = vW.xz / 3.0 + vec2(uT * 0.05, uT * 0.02);
  vec3 col = texture2D(tWater, uv).rgb;
  vec3 col2 = texture2D(tWater, vW.xz / 5.0 - vec2(uT * 0.03, -uT * 0.04)).rgb;
  col = mix(col, col2, 0.4);
  vec2 kuv = (vW.xz + uSize * 0.5) / uSize;
  float shore = texture2D(tKind, kuv).b;
  float foam = step(0.55, shore) * step(0.5, fract(sin(dot(floor(vW.xz * 8.0), vec2(12.9898, 78.233)) + floor(uT * 3.0)) * 43758.5453));
  col = mix(col, vec3(0.85, 0.95, 1.0), foam * 0.85 + shore * 0.25);
  gl_FragColor = vec4(col, 0.9);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
// Décor : billboards cylindriques (ils restent droits), qui ondulent un peu au vent
const propVert = `
attribute vec3 iPos;
attribute vec4 iRect; // x, y, w, h dans l'atlas (pixels)
attribute vec2 iSize; // largeur, hauteur (m)
attribute float iSway;
uniform vec2 uAtlas;
uniform float uT;
varying vec2 vUv;
varying float vShade;
varying float vNear;
#include <fog_pars_vertex>
void main() {
  vec3 camRight = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
  float sway = sin(uT * 1.6 + iPos.x * 0.37 + iPos.z * 0.21) * iSway * uv.y;
  vec3 world = iPos + camRight * (position.x * iSize.x + sway) + vec3(0.0, position.y * iSize.y, 0.0);
  vec4 mvPosition = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = vec2((iRect.x + uv.x * iRect.z) / uAtlas.x, 1.0 - (iRect.y + (1.0 - uv.y) * iRect.w) / uAtlas.y);
  vShade = 0.86 + uv.y * 0.18;
  vNear = -mvPosition.z;
  #include <fog_vertex>
}`;
const propFrag = `
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
varying float vShade;
varying float vNear;
#include <fog_pars_fragment>
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5) discard;
  // décor tout près de la caméra : tramé pour ne pas cacher l'action
  if (uFade > 0.5 && vNear < 9.0) {
    vec2 q = mod(floor(gl_FragCoord.xy / 2.0), 2.0);
    float th = (q.x * 2.0 + q.y) / 4.0 + 0.125;
    if (clamp((vNear - 3.5) / 5.0, 0.0, 1.0) < th) discard;
  }
  gl_FragColor = vec4(c.rgb * vShade, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Un lot de sprites de décor (un seul appel de dessin). */
const makePropBatch = (scene, track, atlas, list) => {
  const n = Math.max(1, list.length);
  const plane = new THREE.PlaneGeometry(1, 1); plane.translate(0, 0.5, 0);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = plane.index;
  geo.setAttribute('position', plane.attributes.position);
  geo.setAttribute('uv', plane.attributes.uv);
  const pos = new Float32Array(n * 3); const rect = new Float32Array(n * 4); const size = new Float32Array(n * 2); const sway = new Float32Array(n);
  list.forEach((p, i) => {
    const r = PROPS[p.kind];
    pos.set([p.x, p.y, p.z], i * 3);
    rect.set([r.x, r.y, r.w, r.h], i * 4);
    size.set([r.w * PROP_PIX * p.s * (p.flip ? -1 : 1), r.h * PROP_PIX * p.s], i * 2);
    sway[i] = p.sway || 0;
  });
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
  geo.setAttribute('iRect', new THREE.InstancedBufferAttribute(rect, 4));
  geo.setAttribute('iSize', new THREE.InstancedBufferAttribute(size, 2));
  geo.setAttribute('iSway', new THREE.InstancedBufferAttribute(sway, 1));
  geo.instanceCount = list.length;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMap: { value: null }, uAtlas: { value: new THREE.Vector2(atlas.w, atlas.h) }, uT: { value: 0 }, uFade: { value: 1 } }]);
  uniforms.uMap.value = atlas.tex;
  const mat = track(new THREE.ShaderMaterial({ vertexShader: propVert, fragmentShader: propFrag, uniforms, fog: true }));
  const mesh = new THREE.Mesh(track(geo), mat);
  mesh.frustumCulled = false;
  scene.add(mesh);
  plane.dispose();
  return { mesh, uniforms };
};

/** Panorama de montagnes au loin (une bande peinte, posée sur un cylindre ouvert). */
const mountainBand = () => {
  const W = 1024; const H = 128;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const layer = (base, amp, col, seed, snow) => {
    for (let i = 0; i < W; i += 1) {
      const t = i / W;
      const f = (u) => noise(u * 9, 0, seed) * 0.7 + noise(u * 23, 1, seed) * 0.3;
      const h = base + ((1 - t) * f(t) + t * f(t - 1)) * amp; // raccord sans couture autour du cylindre
      const top = Math.floor(H - h);
      x.fillStyle = col; x.fillRect(i, top, 1, H - top);
      if (snow && h > base + amp * 0.62) { x.fillStyle = '#eef6ff'; x.fillRect(i, top, 1, Math.max(2, Math.floor((h - base - amp * 0.62) * 0.9))); }
    }
  };
  layer(40, 70, '#9ec2e6', 1, true);
  layer(26, 48, '#86b2dc', 2, false);
  layer(12, 30, '#6fa0d2', 3, false);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Construit le monde dans la scène. */
export const buildRushWorld = (scene, track, opts = {}) => {
  const seed = opts.seed ?? Math.floor(Math.random() * 100000);
  const rng = (() => { let s = seed || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const rr = (a, b) => a + rng() * (b - a);

  // Arène du légendaire et point de départ, de part et d'autre de l'île
  const aAng = rr(0, TAU);
  const arena = { x: Math.cos(aAng) * 60, z: Math.sin(aAng) * 60, r: 15, y: 4.4 };
  const start = { x: -Math.cos(aAng) * 34, z: -Math.sin(aAng) * 34 };
  const lake = { x: Math.cos(aAng + 1.9) * 45, z: Math.sin(aAng + 1.9) * 45, r: 14 };
  const riverSeed = seed + 11;
  const riverDist = (x, z) => {
    const ux = -Math.sin(aAng); const uz = Math.cos(aAng);
    const along = x * ux + z * uz;
    const across = x * Math.cos(aAng) + z * Math.sin(aAng);
    const center = 8 + Math.sin(along / 17 + seed) * 9 + (noise(along / 30, 0, riverSeed) - 0.5) * 12;
    return Math.abs(across - center);
  };
  // Chemin de terre : du départ à l'arène, en serpentant
  const pathDist = (x, z) => {
    const ax = arena.x - start.x; const az = arena.z - start.z; const L = Math.hypot(ax, az);
    const ux = ax / L; const uz = az / L;
    const rx = x - start.x; const rz = z - start.z;
    const along = clamp(rx * ux + rz * uz, 0, L);
    const wob = Math.sin(along / 11 + seed * 0.1) * 7;
    const px = start.x + ux * along - uz * wob; const pz = start.z + uz * along + ux * wob;
    return Math.hypot(x - px, z - pz);
  };

  const rawHeight = (x, z) => {
    const r = Math.hypot(x, z);
    const f = noise(x / 46, z / 46, seed) * 0.6 + noise(x / 20, z / 20, seed + 1) * 0.3 + noise(x / 8, z / 8, seed + 2) * 0.1;
    let h = Math.max(0, (f - 0.4) * 26) + 0.4;
    // terrasses : falaises nettes de 2 m qu'on franchit en sautant
    const step = 2;
    const t = h / step; const fr = t - Math.floor(t);
    h = (Math.floor(t) + smooth(0.86, 1, fr)) * step;
    h *= smooth(10, 22, Math.hypot(x - start.x, z - start.z));
    // le chemin reste praticable
    h *= 0.35 + 0.65 * smooth(2.5, 6, pathDist(x, z));
    const rd = riverDist(x, z);
    const ld = Math.hypot(x - lake.x, z - lake.z);
    const carve = Math.max(1 - smooth(3.2, 6.5, rd), 1 - smooth(lake.r * 0.6, lake.r, ld));
    h = h * (1 - carve) + (WATER - 1.4) * carve;
    const ad = Math.hypot(x - arena.x, z - arena.z);
    const k = 1 - smooth(arena.r, arena.r + 12, ad);
    h = h * (1 - k) + arena.y * k;
    const edge = smooth(0.8, 0.98, r / R);
    return h * (1 - edge) + -3.2 * edge;
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
    if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
    return d + (c - d) * (1 - u) + (b - d) * (1 - v);
  };
  const isWater = (x, z) => terrainAt(x, z) < WATER - 0.05;
  const slopeAt = (x, z) => Math.abs(terrainAt(x + 1, z) - terrainAt(x - 1, z)) + Math.abs(terrainAt(x, z + 1) - terrainAt(x, z - 1));

  // Ponts de bois au-dessus de la rivière : un sur le chemin, deux autres plus loin
  const bridges = [];
  {
    const ux = -Math.sin(aAng); const uz = Math.cos(aAng); // axe de la rivière
    const cx = Math.cos(aAng); const cz = Math.sin(aAng); // en travers
    const centerAt = (along) => 8 + Math.sin(along / 17 + seed) * 9 + (noise(along / 30, 0, riverSeed) - 0.5) * 12;
    // point du chemin le plus proche de la rivière
    let best = null;
    for (let k = 0; k <= 200; k += 1) {
      const t = k / 200;
      const x = start.x + (arena.x - start.x) * t; const z = start.z + (arena.z - start.z) * t;
      let bx = x; let bz = z; let bd = 1e9;
      for (let o = -9; o <= 9; o += 0.5) { const px = x - uz * o; const pz = z + ux * o; const d = pathDist(px, pz); if (d < bd) { bd = d; bx = px; bz = pz; } }
      const rd = riverDist(bx, bz);
      if (!best || rd < best.rd) best = { rd, along: bx * ux + bz * uz };
    }
    const alongs = [best.along, best.along + 40, best.along - 40];
    alongs.forEach((along) => {
      const c = centerAt(along);
      const mx = ux * along + cx * c; const mz = uz * along + cz * c;
      const len = 17;
      const ax = mx - cx * len / 2; const az = mz - cz * len / 2; const bx = mx + cx * len / 2; const bz = mz + cz * len / 2;
      if (Math.hypot(mx, mz) > R * 0.78 || Math.hypot(mx - lake.x, mz - lake.z) < lake.r + 6) return;
      const hA = Math.max(WATER + 0.6, terrainAt(ax, az)); const hB = Math.max(WATER + 0.6, terrainAt(bx, bz));
      bridges.push({ mx, mz, dx: cx, dz: cz, len, half: 1.8, hA, hB });
    });
  }
  const deckAt = (x, z) => {
    for (const b of bridges) {
      const rx = x - b.mx; const rz = z - b.mz;
      const s = rx * b.dx + rz * b.dz; const w = -rx * b.dz + rz * b.dx;
      if (Math.abs(s) <= b.len / 2 && Math.abs(w) <= b.half) {
        const t = s / b.len + 0.5;
        return b.hA + (b.hB - b.hA) * t + Math.sin(Math.PI * t) * 0.7;
      }
    }
    return null;
  };
  // Sol praticable (terrain + ponts) : c'est ce que voient le joueur et les Pokémon
  const groundAt = (x, z) => { const h = terrainAt(x, z); const d = bridges.length ? deckAt(x, z) : null; return d !== null && d > h ? d : h; };
  const walkWater = (x, z) => groundAt(x, z) < WATER - 0.05;

  // Hautes herbes : des zones rondes
  const grass = [];
  for (let k = 0; k < 400 && grass.length < 16; k += 1) {
    const a = rr(0, TAU); const r = rr(18, R * 0.82);
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    const gr = rr(4.5, 8.5);
    if (isWater(x, z) || slopeAt(x, z) > 0.6 || Math.hypot(x - arena.x, z - arena.z) < arena.r + 14 || Math.hypot(x - start.x, z - start.z) < 14 || pathDist(x, z) < gr + 3) continue;
    if (grass.some((g) => Math.hypot(g.x - x, g.z - z) < g.r + gr + 6)) continue;
    grass.push({ x, z, r: gr });
  }
  const inGrass = (x, z) => grass.some((g) => (g.x - x) ** 2 + (g.z - z) ** 2 < g.r * g.r);

  /* ——— Carte des sols (1 texel ≈ 0,47 m) : R = sol, G = teinte, B = écume ——— */
  const KM = 512;
  const kindData = new Uint8Array(KM * KM * 4);
  for (let j = 0; j < KM; j += 1) {
    for (let i = 0; i < KM; i += 1) {
      const x = -SIZE / 2 + ((i + 0.5) / KM) * SIZE; const z = -SIZE / 2 + ((j + 0.5) / KM) * SIZE;
      let kind = 0;
      const ad = Math.hypot(x - arena.x, z - arena.z);
      if (ad < arena.r + 0.6) kind = 3;
      else if (pathDist(x, z) < 1.6 + noise(x / 3, z / 3, seed + 5) * 0.9) kind = 4;
      else if (inGrass(x, z)) kind = 1;
      const h = terrainAt(x, z);
      if (h < WATER + 0.2 && kind !== 3) kind = 2;
      const o = (j * KM + i) * 4;
      kindData[o] = kind;
      kindData[o + 1] = Math.floor(noise(x / 14, z / 14, seed + 9) * 255);
      // écume : près des berges, sur l'eau
      let shore = 0;
      if (h < WATER) { const d = WATER - h; shore = clamp(1 - d / 0.9, 0, 1); }
      kindData[o + 2] = Math.floor(shore * 255);
      kindData[o + 3] = 255;
    }
  }
  const kindTex = track(new THREE.DataTexture(kindData, KM, KM, THREE.RGBAFormat));
  kindTex.magFilter = THREE.NearestFilter; kindTex.minFilter = THREE.NearestFilter; kindTex.needsUpdate = true;
  const tex = makeGroundTextures();
  Object.values(tex).forEach((t) => track(t));

  /* ——— Terrain ——— */
  {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k += 1) pos.setY(k, terrainAt(pos.getX(k), pos.getZ(k)));
    const flat = geo.toNonIndexed();
    flat.computeVertexNormals();
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      tGrass: { value: null }, tTall: { value: null }, tSand: { value: null }, tPath: { value: null }, tStone: { value: null }, tCliff: { value: null }, tKind: { value: null },
      uLight: { value: LIGHT_DIR }, uSize: { value: SIZE }, uWater: { value: WATER }
    }]);
    uniforms.tGrass.value = tex.grass; uniforms.tTall.value = tex.tall; uniforms.tSand.value = tex.sand; uniforms.tPath.value = tex.path;
    uniforms.tStone.value = tex.stone; uniforms.tCliff.value = tex.cliff; uniforms.tKind.value = kindTex;
    const mat = track(new THREE.ShaderMaterial({ vertexShader: terrainVert, fragmentShader: terrainFrag, uniforms, fog: true }));
    const mesh = new THREE.Mesh(track(flat), mat);
    scene.add(mesh);
    geo.dispose();
  }
  // Eau (mer, rivière, lac)
  const waterUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tWater: { value: null }, tKind: { value: null }, uT: { value: 0 }, uSize: { value: SIZE } }]);
  waterUniforms.tWater.value = tex.water; waterUniforms.tKind.value = kindTex;
  const water = new THREE.Mesh(track(new THREE.PlaneGeometry(900, 900)), track(new THREE.ShaderMaterial({ vertexShader: terrainVert, fragmentShader: waterFrag, uniforms: waterUniforms, fog: true, transparent: true })));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  water.renderOrder = 1;
  scene.add(water);

  // Ciel : dégradé, montagnes au loin, nuages
  {
    const sky = new THREE.Mesh(track(new THREE.SphereGeometry(560, 24, 12)), track(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#3f8cf0') }, mid: { value: new THREE.Color('#8fcaff') }, bot: { value: new THREE.Color('#d8efff') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.6, h)) : mix(bot, mid, smoothstep(-0.05, 0.12, h)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}'
    })));
    sky.renderOrder = -10;
    scene.add(sky);
    const mt = track(mountainBand()); mt.repeat.set(3, 1);
    const band = new THREE.Mesh(track(new THREE.CylinderGeometry(420, 420, 110, 64, 1, true)), track(new THREE.MeshBasicMaterial({ map: mt, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false })));
    band.position.y = 38;
    band.renderOrder = -9;
    scene.add(band);
  }

  const vertexMat = track(new THREE.MeshLambertMaterial({ vertexColors: true }));
  const tmpM = new THREE.Matrix4(); const tmpQ = new THREE.Quaternion(); const tmpE = new THREE.Euler(); const tmpV = new THREE.Vector3(); const tmpS = new THREE.Vector3();
  const setInst = (mesh, i, x, y, z, ry = 0, sc = 1, rx = 0, rz = 0, sy = sc) => {
    tmpE.set(rx, ry, rz, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    tmpV.set(x, y, z); tmpS.set(sc, sy, sc);
    tmpM.compose(tmpV, tmpQ, tmpS);
    mesh.setMatrixAt(i, tmpM);
  };
  const instanced = (geo, count, mat = vertexMat) => {
    const m = new THREE.InstancedMesh(track(geo), mat, Math.max(1, count));
    m.count = count;
    scene.add(m);
    return m;
  };

  const freeSpot = (minR, maxR, maxSlope = 0.6, avoid = 0) => {
    for (let k = 0; k < 80; k += 1) {
      const a = rr(0, TAU); const r = rr(minR, maxR);
      const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      if (terrainAt(x, z) < WATER + 0.5 || slopeAt(x, z) > maxSlope) continue;
      if (Math.hypot(x - arena.x, z - arena.z) < arena.r + 4) continue;
      if (pathDist(x, z) < 2.6) continue;
      if (avoid && (Math.hypot(x - start.x, z - start.z) < avoid || inGrass(x, z))) continue;
      return { x, z };
    }
    return null;
  };

  // Décor en sprites
  const colliders = [];
  const atlas = makePropAtlas(); track(atlas.tex);
  const props = [];
  const rocks = [];
  {
    const put = (kind, n, minR, maxR, slope, avoid, o = {}) => {
      let made = 0;
      for (let k = 0; k < n * 12 && made < n; k += 1) {
        const s = freeSpot(minR, maxR, slope, avoid);
        if (!s || (o.noGrass && inGrass(s.x, s.z))) continue;
        const kk = Array.isArray(kind) ? kind[Math.floor(rng() * kind.length)] : kind;
        const sc = rr(o.s?.[0] ?? 0.9, o.s?.[1] ?? 1.2);
        props.push({ kind: kk, x: s.x, y: terrainAt(s.x, s.z) - 0.05, z: s.z, s: sc, flip: rng() < 0.5, sway: o.sway || 0 });
        if (o.col) colliders.push({ x: s.x, z: s.z, r: o.col * sc });
        made += 1;
      }
    };
    put(['oak', 'oak2', 'oak', 'apple', 'cherry'], 85, 12, R * 0.93, 0.5, 9, { noGrass: true, s: [0.8, 1.15], col: 0.5, sway: 0.1 });
    put('pine', 40, 40, R * 0.93, 0.9, 9, { noGrass: true, s: [0.9, 1.3], col: 0.4, sway: 0.06 });
    put(['bush', 'bushB'], 55, 8, R * 0.9, 0.5, 6, { s: [0.9, 1.25], sway: 0.05 });
    put('fern', 90, 6, R * 0.9, 0.6, 4, { s: [0.9, 1.3], sway: 0.1 });
    put('sunflower', 45, 8, R * 0.9, 0.5, 6, { noGrass: true, s: [0.9, 1.2], sway: 0.12 });
    put(['flowersA', 'flowersB', 'flowersC'], 260, 4, R * 0.9, 0.5, 0, { noGrass: true, s: [0.9, 1.3], sway: 0.06 });
    // rochers : de vrais volumes 3D (voir plus bas), pas des sprites
    for (let k = 0, made = 0; k < 500 && made < 46; k += 1) {
      const sp = freeSpot(14, R * 0.92, 1.4, 8);
      if (!sp) continue;
      const sc = rr(0.7, 1.9);
      rocks.push({ x: sp.x, z: sp.z, y: terrainAt(sp.x, sp.z), s: sc, ry: rr(0, TAU), v: Math.floor(rng() * 3) });
      colliders.push({ x: sp.x, z: sp.z, r: 0.85 * sc });
      made += 1;
    }
    put('stump', 20, 10, R * 0.9, 0.5, 8, { col: 0.4 });
    put('mush', 50, 8, R * 0.9, 0.5, 4, {});
    // hautes herbes : touffes serrées
    grass.forEach((gp) => {
      const n = Math.round(gp.r * gp.r * 1.6);
      for (let i = 0; i < n; i += 1) {
        const a = rr(0, TAU); const r = Math.sqrt(rng()) * gp.r;
        const x = gp.x + Math.cos(a) * r; const z = gp.z + Math.sin(a) * r;
        if (!isWater(x, z)) props.push({ kind: rng() < 0.5 ? 'tall' : 'tall2', x, y: terrainAt(x, z) - 0.05, z, s: rr(1.1, 1.6), flip: rng() < 0.5, sway: 0.18 });
      }
    });
  }
  const propBatch = makePropBatch(scene, track, atlas, props);
  // Rochers en 3D : icosaèdres cabossés, facettes plates, texture de pierre pixel et mousse sur le dessus
  {
    const rockMat = track(new THREE.MeshLambertMaterial({ map: tex.stone, vertexColors: true, flatShading: true }));
    const moss = new THREE.Color('#7fb84a'); const grey = new THREE.Color('#d8d4e6'); const dark = new THREE.Color('#9a94b0');
    [0, 1, 2].forEach((v) => {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const pos = geo.attributes.position;
      const cols = [];
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        const n = 0.78 + 0.32 * (noise(x * 1.7 + v * 5, z * 1.7 + y, v + 2) * 0.5 + 0.5);
        pos.setXYZ(i, x * n * (v === 1 ? 1.3 : 1), Math.max(-0.25, y * n * (v === 2 ? 0.85 : 0.62)) + 0.3, z * n);
        const c = (y > 0.55 ? moss : y < -0.1 ? dark : grey).clone();
        cols.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      geo.computeVertexNormals();
      const list = rocks.filter((r) => r.v === v);
      const m = instanced(geo, list.length, rockMat);
      list.forEach((r, i) => setInst(m, i, r.x, r.y - 0.15, r.z, r.ry, r.s));
      m.instanceMatrix.needsUpdate = true;
    });
  }
  // Nuages qui dérivent, très haut et loin
  const clouds = [];
  for (let k = 0; k < 26; k += 1) {
    const a = rr(0, TAU); const r = rr(140, 330);
    clouds.push({ kind: k % 2 ? 'cloud' : 'cloud2', x: Math.cos(a) * r, y: rr(55, 120), z: Math.sin(a) * r, s: rr(4, 8), flip: rng() < 0.5, a, r, sp: rr(0.004, 0.01) });
  }
  const cloudBatch = makePropBatch(scene, track, atlas, clouds);
  cloudBatch.mesh.material.fog = false;
  cloudBatch.uniforms.uFade.value = 0;

  // Arène : piliers de pierre en cercle
  {
    const stoneMat = track(new THREE.MeshLambertMaterial({ map: tex.stone }));
    const pil = new THREE.CylinderGeometry(0.55, 0.62, 5, 10);
    const cap = new THREE.BoxGeometry(1.5, 0.45, 1.5); cap.translate(0, 2.7, 0);
    const foot = new THREE.BoxGeometry(1.5, 0.45, 1.5); foot.translate(0, -2.3, 0);
    const pillar = mergeGeometries([pil, cap, foot], false); pillar.translate(0, 2.5, 0);
    pil.dispose(); cap.dispose(); foot.dispose();
    const pm = instanced(pillar, 10, stoneMat);
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * TAU;
      const x = arena.x + Math.cos(a) * (arena.r - 1.2); const z = arena.z + Math.sin(a) * (arena.r - 1.2);
      setInst(pm, i, x, arena.y - 0.05, z, -a);
      colliders.push({ x, z, r: 0.9 });
    }
  }

  // Autels et coffres
  const altars = [];
  for (let k = 0; k < 3; k += 1) {
    const s = freeSpot(25, R * 0.8, 0.3, 20);
    if (s && !altars.some((a) => Math.hypot(a.x - s.x, a.z - s.z) < 40)) altars.push({ ...s, y: terrainAt(s.x, s.z), charge: 0, used: false });
  }
  {
    const stoneMat = track(new THREE.MeshLambertMaterial({ map: tex.stone, color: '#cfc4ea' }));
    const base = new THREE.CylinderGeometry(1.8, 2.1, 0.5, 10); base.translate(0, 0.25, 0);
    const mid = new THREE.CylinderGeometry(1.2, 1.5, 0.4, 10); mid.translate(0, 0.7, 0);
    const col = new THREE.BoxGeometry(0.6, 2, 0.6); col.translate(0, 1.9, 0);
    const top = new THREE.BoxGeometry(0.8, 0.28, 0.8); top.translate(0, 3, 0);
    const altarGeo = mergeGeometries([base, mid, col, top], false);
    [base, mid, col, top].forEach((g) => g.dispose());
    const altarMesh = instanced(altarGeo, altars.length, stoneMat);
    altars.forEach((a, i) => { setInst(altarMesh, i, a.x, a.y - 0.1, a.z, 0); colliders.push({ x: a.x, z: a.z, r: 0.5 }); });
  }
  const chests = [];
  for (let k = 0; k < 12; k += 1) { const s = freeSpot(14, R * 0.86, 0.3, 10); if (s) chests.push({ ...s, y: terrainAt(s.x, s.z), open: false, ang: rr(0, TAU) }); }
  const chestMesh = instanced(chestGeo(), chests.length);
  chests.forEach((c, i) => setInst(chestMesh, i, c.x, c.y, c.z, c.ang));

  // Collisions avec le décor
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

  // Ponts : planches qui suivent l'arche, poteaux et rambardes
  if (bridges.length) {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const x = c.getContext('2d');
    for (let i = 0; i < 4; i += 1) {
      x.fillStyle = ['#b07a40', '#a06c36', '#bb8546', '#9a6430'][i]; x.fillRect(0, i * 8, 32, 8);
      x.fillStyle = '#6a4220'; x.fillRect(0, i * 8 + 7, 32, 1); x.fillRect((i * 11) % 32, i * 8, 1, 7);
      x.fillStyle = '#d8a868'; x.fillRect(0, i * 8, 32, 1);
    }
    const wt = track(new THREE.CanvasTexture(c)); wt.magFilter = THREE.NearestFilter; wt.minFilter = THREE.NearestFilter; wt.colorSpace = THREE.SRGBColorSpace;
    const woodMat = track(new THREE.MeshLambertMaterial({ map: wt }));
    const SEGS = 12;
    const planks = instanced(new THREE.BoxGeometry(1, 0.3, 1), bridges.length * SEGS, woodMat);
    const posts = instanced(new THREE.BoxGeometry(0.28, 1.3, 0.28), bridges.length * 14, woodMat);
    const rails = instanced(new THREE.BoxGeometry(1, 0.16, 0.16), bridges.length * SEGS * 2, woodMat);
    let pi = 0; let qi = 0; let ri = 0;
    bridges.forEach((b) => {
      const ry = Math.atan2(-b.dz, b.dx);
      const yAt = (t) => b.hA + (b.hB - b.hA) * t + Math.sin(Math.PI * t) * 0.7;
      const segLen = b.len / SEGS;
      for (let k = 0; k < SEGS; k += 1) {
        const t = (k + 0.5) / SEGS;
        const s = (t - 0.5) * b.len;
        const px = b.mx + b.dx * s; const pz = b.mz + b.dz * s;
        const tilt = Math.atan2(yAt(t + 0.5 / SEGS) - yAt(t - 0.5 / SEGS), segLen);
        planks.setMatrixAt(pi, new THREE.Matrix4().compose(new THREE.Vector3(px, yAt(t) - 0.15, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, tilt, 'YXZ')), new THREE.Vector3(segLen * 1.12, 1, b.half * 2)));
        pi += 1;
        [-1, 1].forEach((side) => {
          const ox = -b.dz * side * (b.half - 0.1); const oz = b.dx * side * (b.half - 0.1);
          rails.setMatrixAt(ri, new THREE.Matrix4().compose(new THREE.Vector3(px + ox, yAt(t) + 0.95, pz + oz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, tilt, 'YXZ')), new THREE.Vector3(segLen * 1.12, 1, 1)));
          ri += 1;
        });
      }
      for (let k = 0; k <= 6; k += 1) {
        const t = k / 6; const s = (t - 0.5) * b.len;
        [-1, 1].forEach((side) => {
          const px = b.mx + b.dx * s - b.dz * side * (b.half - 0.1); const pz = b.mz + b.dz * s + b.dx * side * (b.half - 0.1);
          setInst(posts, qi, px, yAt(t) + 0.35, pz, ry, 1); qi += 1;
        });
      }
    });
    planks.count = pi; posts.count = qi; rails.count = ri;
    [planks, posts, rails].forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }

  // Mini-carte
  const mini = document.createElement('canvas');
  mini.width = 128; mini.height = 128;
  {
    const mx = mini.getContext('2d');
    const img = mx.createImageData(128, 128);
    for (let j = 0; j < 128; j += 1) {
      for (let i = 0; i < 128; i += 1) {
        const x = -SIZE / 2 + (i / 128) * SIZE; const z = -SIZE / 2 + (j / 128) * SIZE;
        const h = terrainAt(x, z);
        let c;
        if (deckAt(x, z) !== null && h < WATER + 0.6) c = [168, 116, 63];
        else if (h < WATER) c = [63, 155, 232];
        else if (h < WATER + 0.3) c = [234, 215, 162];
        else if (Math.hypot(x - arena.x, z - arena.z) < arena.r) c = [217, 211, 232];
        else if (pathDist(x, z) < 1.8) c = [201, 160, 106];
        else if (inGrass(x, z)) c = [44, 122, 42];
        else c = [85 + h * 6, 184 - h * 5, 58];
        const o = (j * 128 + i) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    mx.putImageData(img, 0, 0);
  }

  const tick = (t) => {
    waterUniforms.uT.value = t;
    propBatch.uniforms.uT.value = t;
    cloudBatch.uniforms.uT.value = 0;
    // les nuages tournent lentement autour de l'île
    const pos = cloudBatch.mesh.geometry.attributes.iPos;
    clouds.forEach((c, i) => { const a = c.a + t * c.sp; pos.setXYZ(i, Math.cos(a) * c.r, c.y, Math.sin(a) * c.r); });
    pos.needsUpdate = true;
  };

  return {
    seed, terrainAt: groundAt, isWater: walkWater, slopeAt, inGrass, grass, arena, start, lake, altars, chests, chestMesh, setInst, freeSpot, pushOut, mini, tick, instanced, bridges
  };
};
