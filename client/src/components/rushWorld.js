/**
 * Poké Rush : l'île de Kanto en 3D low-poly.
 * Collines en terrasses, rivière et lac (seuls les types Eau et Vol s'y aventurent),
 * hautes herbes (les Alphas s'y cachent), arbres, autels et l'arène du légendaire.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;
export const SIZE = 240;
export const SEG = 180;
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

/* ——— Géométries low-poly colorées ——— */
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

const treeGeo = () => merge([
  part(C(0.32, 0.42, 2.2, 6), '#7a4a26', M(0, 1.1, 0)),
  part(I(1.9, 0), '#2f9a3e', M(0, 3.0, 0, 0, 0, 0, 1, 0.85, 1)),
  part(I(1.45, 0), '#3fb54c', M(0.3, 4.1, 0.2, 0.3, 0.2, 0)),
  part(I(0.9, 0), '#58c95c', M(-0.2, 4.9, -0.1, 0.5, 0.4, 0))
]);
const pineGeo = () => merge([
  part(C(0.25, 0.35, 1.6, 6), '#6b3f20', M(0, 0.8, 0)),
  part(K(1.8, 2.4, 7), '#2a7a3c', M(0, 2.4, 0)),
  part(K(1.4, 2.0, 7), '#33914a', M(0, 3.6, 0)),
  part(K(0.95, 1.6, 7), '#3aa456', M(0, 4.7, 0))
]);
const bushGeo = () => merge([
  part(I(0.8, 0), '#3f9e45', M(0, 0.55, 0, 0, 0, 0, 1.2, 0.8, 1)),
  part(I(0.55, 0), '#4fb855', M(0.5, 0.65, 0.2)),
  part(S(0.13, 5, 4), '#3a6bdb', M(0.3, 0.95, 0.5)),
  part(S(0.13, 5, 4), '#3a6bdb', M(-0.4, 0.85, 0.45)),
  part(S(0.13, 5, 4), '#3a6bdb', M(0.1, 1.05, -0.4))
]);
const flowerGeo = () => merge([
  part(C(0.03, 0.03, 0.5, 4), '#2f8a3a', M(0, 0.25, 0)),
  ...[0, 1, 2, 3, 4].map((i) => part(B(0.16, 0.04, 0.09), '#ffffff', M(Math.cos(i * 1.26) * 0.12, 0.52, Math.sin(i * 1.26) * 0.12, 0, -i * 1.26, 0))),
  part(C(0.06, 0.06, 0.05, 6), '#ffd23a', M(0, 0.54, 0))
]);
const rockGeo = () => merge([part(new THREE.DodecahedronGeometry(1, 0), '#8f8a99', M(0, 0.35, 0, 0, 0, 0, 1, 0.7, 1))]);
const grassGeo = () => {
  // une touffe : 5 brins croisés
  const parts = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI;
    const g = new THREE.BufferGeometry();
    const h = 1.1 + (i % 2) * 0.35;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.18, 0, 0, 0.18, 0, 0, 0.02, h, 0]), 3));
    g.computeVertexNormals();
    parts.push(part(g, i % 2 ? '#2f8f3a' : '#3fae47', M(Math.cos(a * 2) * 0.2, 0, Math.sin(a * 2) * 0.2, 0, a, 0)));
  }
  return merge(parts);
};
export const chestGeo = () => merge([
  part(B(1.5, 0.85, 1.0), '#c0392b', M(0, 0.42, 0)),
  part(B(1.55, 0.12, 1.05), '#2a2a2a', M(0, 0.85, 0)),
  part(C(0.5, 0.5, 1.5, 10, 1), '#e74c3c', M(0, 0.95, 0, 0, 0, Math.PI / 2)),
  part(C(0.16, 0.16, 0.1, 10), '#ffffff', M(0, 0.8, 0.53, Math.PI / 2)),
  part(C(0.09, 0.09, 0.12, 10), '#2a2a2a', M(0, 0.8, 0.56, Math.PI / 2))
]);
const altarGeo = () => merge([
  part(C(1.8, 2.1, 0.5, 8), '#8a8399', M(0, 0.25, 0)),
  part(C(1.2, 1.5, 0.4, 8), '#a39bb5', M(0, 0.7, 0)),
  part(B(0.55, 2.0, 0.55), '#6e6684', M(0, 1.9, 0)),
  part(B(0.75, 0.25, 0.75), '#a39bb5', M(0, 2.95, 0))
]);
const pillarGeo = () => merge([
  part(B(1.4, 0.4, 1.4), '#c9c2d6', M(0, 0.2, 0)),
  part(C(0.5, 0.55, 5, 8), '#e6e0f0', M(0, 2.9, 0)),
  part(B(1.4, 0.4, 1.4), '#c9c2d6', M(0, 5.6, 0))
]);

/** Construit le monde dans la scène. */
export const buildRushWorld = (scene, track, opts = {}) => {
  const seed = opts.seed ?? Math.floor(Math.random() * 100000);
  const rng = (() => { let s = seed || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const rr = (a, b) => a + rng() * (b - a);

  // Arène du légendaire et point de départ, de part et d'autre de l'île
  const aAng = rr(0, TAU);
  const arena = { x: Math.cos(aAng) * 60, z: Math.sin(aAng) * 60, r: 15, y: 3.4 };
  const start = { x: -Math.cos(aAng) * 34, z: -Math.sin(aAng) * 34 };
  // Lac et rivière
  const lake = { x: Math.cos(aAng + 1.9) * 45, z: Math.sin(aAng + 1.9) * 45, r: 14 };
  const riverSeed = seed + 11;
  const riverDist = (x, z) => {
    // une rivière sinueuse qui coupe l'île en diagonale (perpendiculaire à l'axe départ → arène)
    const ux = -Math.sin(aAng); const uz = Math.cos(aAng);
    const along = x * ux + z * uz;
    const across = x * Math.cos(aAng) + z * Math.sin(aAng);
    const center = 8 + Math.sin(along / 17 + seed) * 9 + (noise(along / 30, 0, riverSeed) - 0.5) * 12;
    return Math.abs(across - center);
  };

  const rawHeight = (x, z) => {
    const r = Math.hypot(x, z);
    const f = noise(x / 48, z / 48, seed) * 0.6 + noise(x / 20, z / 20, seed + 1) * 0.3 + noise(x / 8, z / 8, seed + 2) * 0.1;
    let h = Math.max(0, (f - 0.42) * 22) + 0.4;
    // terrasses (falaises de 2 m qu'on franchit en sautant)
    const step = 2;
    const t = h / step; const fr = t - Math.floor(t);
    h = (Math.floor(t) + smooth(0.78, 1, fr)) * step;
    // départ plat
    h *= smooth(10, 22, Math.hypot(x - start.x, z - start.z));
    // rivière et lac
    const rd = riverDist(x, z);
    const ld = Math.hypot(x - lake.x, z - lake.z);
    const carve = Math.max(1 - smooth(3.2, 6.5, rd), 1 - smooth(lake.r * 0.6, lake.r, ld));
    h = h * (1 - carve) + (WATER - 1.4) * carve;
    // arène : plateau rond avec une rampe douce
    const ad = Math.hypot(x - arena.x, z - arena.z);
    const k = 1 - smooth(arena.r, arena.r + 12, ad);
    h = h * (1 - k) + arena.y * k;
    // bord de l'île
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

  // Hautes herbes : des zones rondes
  const grass = [];
  for (let k = 0; k < 400 && grass.length < 16; k += 1) {
    const a = rr(0, TAU); const r = rr(18, R * 0.82);
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    const gr = rr(4.5, 8.5);
    if (isWater(x, z) || slopeAt(x, z) > 0.6 || Math.hypot(x - arena.x, z - arena.z) < arena.r + 14 || Math.hypot(x - start.x, z - start.z) < 14) continue;
    if (grass.some((g) => Math.hypot(g.x - x, g.z - z) < g.r + gr + 6)) continue;
    grass.push({ x, z, r: gr });
  }
  const inGrass = (x, z) => grass.some((g) => (g.x - x) ** 2 + (g.z - z) ** 2 < g.r * g.r);

  /* ——— Maillage du terrain ——— */
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
      const ad = Math.hypot(cx - arena.x, cz - arena.z);
      if (cy < WATER + 0.25) c.set(cy < WATER - 0.6 ? '#c2ad7a' : '#e8d6a0');
      else if (ad < arena.r + 0.5 && ny > 0.9) {
        // dalles de l'arène
        const ring = Math.floor(ad / 2.5) & 1;
        c.set(ring ? '#d9d2e6' : '#c4bcd4');
        if (ad < 3) c.set('#ffd23a');
      } else if (ny < 0.72) {
        const band = Math.floor(cy / 0.7) & 1;
        c.set(band ? '#9a8a72' : '#857560');
      } else {
        const chk = (Math.floor(cx / 7) + Math.floor(cz / 7)) & 1;
        c.set(chk ? '#6cc44a' : '#62b842');
        if (grass.some((g) => (g.x - cx) ** 2 + (g.z - cz) ** 2 < (g.r + 0.5) ** 2)) c.set('#3f9a35');
        c.offsetHSL(0, 0, (hash2(Math.floor(cx * 2), Math.floor(cz * 2), 7) - 0.5) * 0.05 + cy * 0.006);
      }
      for (let q = 0; q < 3; q += 1) { col[(k + q) * 3] = c.r; col[(k + q) * 3 + 1] = c.g; col[(k + q) * 3 + 2] = c.b; }
    }
    flat.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(track(flat), track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    scene.add(mesh);
    geo.dispose();
  }
  // Eau (mer, rivière, lac)
  const waterMat = track(new THREE.MeshLambertMaterial({ color: '#3a9ae8', transparent: true, opacity: 0.82 }));
  const water = new THREE.Mesh(track(new THREE.PlaneGeometry(900, 900)), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  water.renderOrder = 1;
  scene.add(water);
  // reflets : petites vaguelettes blanches
  const foamGeo = track(new THREE.PlaneGeometry(0.9, 0.12));
  const foam = new THREE.InstancedMesh(foamGeo, track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })), 260);
  const foamList = [];

  const vertexMat = track(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
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
      if (avoid && (Math.hypot(x - start.x, z - start.z) < avoid || inGrass(x, z))) continue;
      return { x, z };
    }
    return null;
  };

  // Décor
  const colliders = [];
  {
    const trees = []; const pines = []; const bushes = []; const flowers = []; const rocks = [];
    for (let k = 0; k < 1500 && trees.length < 70; k += 1) { const s = freeSpot(12, R * 0.92, 0.5, 9); if (s && !inGrass(s.x, s.z)) trees.push(s); }
    for (let k = 0; k < 900 && pines.length < 40; k += 1) { const s = freeSpot(40, R * 0.92, 0.9, 9); if (s && !inGrass(s.x, s.z)) pines.push(s); }
    for (let k = 0; k < 900 && bushes.length < 40; k += 1) { const s = freeSpot(8, R * 0.9, 0.5, 6); if (s) bushes.push(s); }
    for (let k = 0; k < 900 && flowers.length < 220; k += 1) { const s = freeSpot(4, R * 0.9, 0.4); if (s && !inGrass(s.x, s.z)) flowers.push(s); }
    for (let k = 0; k < 600 && rocks.length < 34; k += 1) { const s = freeSpot(14, R * 0.92, 1.4, 8); if (s) rocks.push(s); }
    const tm = instanced(treeGeo(), trees.length);
    trees.forEach((s, i) => { const sc = rr(0.85, 1.25); setInst(tm, i, s.x, terrainAt(s.x, s.z) - 0.1, s.z, rr(0, TAU), sc); colliders.push({ x: s.x, z: s.z, r: 0.6 * sc }); });
    const pm = instanced(pineGeo(), pines.length);
    pines.forEach((s, i) => { const sc = rr(0.9, 1.4); setInst(pm, i, s.x, terrainAt(s.x, s.z) - 0.1, s.z, rr(0, TAU), sc); colliders.push({ x: s.x, z: s.z, r: 0.5 * sc }); });
    const bm = instanced(bushGeo(), bushes.length);
    bushes.forEach((s, i) => setInst(bm, i, s.x, terrainAt(s.x, s.z), s.z, rr(0, TAU), rr(0.8, 1.2)));
    const fm = instanced(flowerGeo(), flowers.length);
    const fcol = new THREE.Color();
    flowers.forEach((s, i) => {
      setInst(fm, i, s.x, terrainAt(s.x, s.z), s.z, rr(0, TAU), rr(0.8, 1.3));
      fm.setColorAt(i, fcol.set(['#ffffff', '#ff8ac0', '#ffe14a', '#ff6a5a', '#b8a0ff'][Math.floor(rng() * 5)]));
    });
    const rm = instanced(rockGeo(), rocks.length);
    rocks.forEach((s, i) => { const sc = rr(0.7, 1.9); setInst(rm, i, s.x, terrainAt(s.x, s.z) - 0.15, s.z, rr(0, TAU), sc); colliders.push({ x: s.x, z: s.z, r: sc * 0.85 }); });
    // Touffes des hautes herbes
    const tufts = [];
    grass.forEach((gp) => {
      const n = Math.round(gp.r * gp.r * 2.2);
      for (let i = 0; i < n; i += 1) {
        const a = rr(0, TAU); const r = Math.sqrt(rng()) * gp.r;
        const x = gp.x + Math.cos(a) * r; const z = gp.z + Math.sin(a) * r;
        if (!isWater(x, z)) tufts.push({ x, z });
      }
    });
    const gm = instanced(grassGeo(), tufts.length, track(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    tufts.forEach((s, i) => setInst(gm, i, s.x, terrainAt(s.x, s.z) - 0.05, s.z, rr(0, TAU), rr(0.85, 1.25)));
    // Écume sur l'eau
    for (let k = 0; k < 3000 && foamList.length < 260; k += 1) {
      const x = rr(-R, R); const z = rr(-R, R);
      if (Math.hypot(x, z) < R * 0.98 && terrainAt(x, z) < WATER - 0.3) foamList.push({ x, z, a: rr(0, TAU), p: rr(0, TAU) });
    }
    foam.count = foamList.length;
    scene.add(foam);
  }

  // Arène : piliers en cercle
  {
    const pm = instanced(pillarGeo(), 8);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
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
  const altarMesh = instanced(altarGeo(), altars.length);
  altars.forEach((a, i) => { setInst(altarMesh, i, a.x, a.y - 0.1, a.z, 0); colliders.push({ x: a.x, z: a.z, r: 0.5 }); });
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
        if (h < WATER) c = [58, 154, 232];
        else if (h < WATER + 0.3) c = [232, 214, 160];
        else if (Math.hypot(x - arena.x, z - arena.z) < arena.r) c = [210, 200, 230];
        else if (inGrass(x, z)) c = [50, 140, 50];
        else c = [90 + h * 10, 180 - h * 6, 70];
        const o = (j * 128 + i) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    mx.putImageData(img, 0, 0);
  }

  const tick = (t) => {
    foamList.forEach((f, i) => {
      const k = 0.6 + Math.sin(t * 1.5 + f.p) * 0.4;
      setInst(foam, i, f.x + Math.sin(t * 0.4 + f.p) * 0.4, WATER + 0.03, f.z, f.a, k, -Math.PI / 2);
    });
    foam.instanceMatrix.needsUpdate = true;
  };

  return {
    seed, terrainAt, isWater, slopeAt, inGrass, grass, arena, start, lake, altars, chests, chestMesh, setInst, freeSpot, pushOut, mini, tick, instanced
  };
};
