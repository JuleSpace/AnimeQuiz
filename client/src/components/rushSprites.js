/**
 * Sprites PMDCollab dans un monde 3D : chaque planche (un Pokémon, une animation) devient un lot
 * de « billboards » instanciés. Un seul appel de dessin par planche, même avec 300 Pokémon à l'écran.
 * La ligne de la planche (8 directions) est choisie selon l'angle entre le Pokémon et la caméra.
 */
import * as THREE from 'three';
import SWARM_SHEETS from './swarmSheets';

const BASE = `${process.env.PUBLIC_URL || ''}/swarm/pmd`;
const TICK = 1 / 60;
export const PIX = 0.065; // 1 pixel de sprite = 6,5 cm

const loader = new THREE.TextureLoader();

const VERT = `
attribute vec3 iPos;
attribute vec4 iData; // échelle, colonne, ligne, flash
attribute float iAlpha;
uniform vec2 uCell;   // taille d'une case (px)
uniform vec2 uGrid;   // colonnes, lignes
uniform float uLift;  // du centre de la case jusqu'aux pieds (px)
varying vec2 vUv;
varying float vFlash;
varying float vAlpha;
#include <fog_pars_vertex>
void main() {
  float s = iData.x;
  // billboard cylindrique : le sprite reste bien droit, il pivote seulement autour de l'axe vertical
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
  vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 up = normalize(mix(vec3(0.0, 1.0, 0.0), camUp, 0.22));
  vec2 size = uCell * ${PIX.toFixed(4)} * s;
  vec3 center = iPos + up * ((uLift - 1.0) * ${PIX.toFixed(4)} * s);
  vec3 world = center + right * position.x * size.x + up * position.y * size.y;
  vec4 mvPosition = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = vec2((iData.y + uv.x) / uGrid.x, 1.0 - (iData.z + 1.0 - uv.y) / uGrid.y);
  vFlash = iData.w;
  vAlpha = iAlpha;
  #include <fog_vertex>
}`;
const FRAG = `
uniform sampler2D uMap;
uniform vec3 uTint;
uniform vec2 uTexel;
varying vec2 vUv;
varying float vFlash;
varying float vAlpha;
#include <fog_pars_fragment>
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5) {
    // contour sombre d'un pixel autour du sprite, pour le détacher du décor
    float n = texture2D(uMap, vUv + vec2(uTexel.x, 0.0)).a + texture2D(uMap, vUv - vec2(uTexel.x, 0.0)).a
      + texture2D(uMap, vUv + vec2(0.0, uTexel.y)).a + texture2D(uMap, vUv - vec2(0.0, uTexel.y)).a;
    if (n < 0.5) discard;
    gl_FragColor = vec4(0.08, 0.07, 0.12, vAlpha * 0.85);
    #include <colorspace_fragment>
    #include <fog_fragment>
    return;
  }
  vec3 col = c.rgb * uTint;
  if (vFlash > 0.0) col = mix(col, vec3(1.0), vFlash);
  if (vFlash < 0.0) col = mix(col, vec3(1.0, 0.25, 0.2), -vFlash);
  gl_FragColor = vec4(col, vAlpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const frameAt = (d, t, loop = true) => {
  const total = d.reduce((a, b) => a + b, 0);
  let ticks = t / TICK;
  if (loop) ticks %= total;
  else if (ticks >= total) return d.length - 1;
  for (let i = 0; i < d.length; i += 1) {
    ticks -= d[i];
    if (ticks < 0) return i;
  }
  return d.length - 1;
};

/** Ligne de la planche (0 = face caméra … 2 = droite … 4 = dos). */
export const rowFor = (faceX, faceZ, camYaw) => {
  // repère écran : droite = (cos yaw, -sin yaw), vers la caméra = (sin yaw, cos yaw)
  const sx = faceX * Math.cos(camYaw) - faceZ * Math.sin(camYaw);
  const sy = faceX * Math.sin(camYaw) + faceZ * Math.cos(camYaw);
  const deg = (Math.atan2(sy, sx) * 180) / Math.PI;
  return (((Math.round((90 - deg) / 45) % 8) + 8) % 8);
};

export const sheetOf = (dex, anim) => SWARM_SHEETS[dex]?.[anim] || SWARM_SHEETS[dex]?.walk || null;
export const animTotal = (dex, anim) => {
  const m = sheetOf(dex, anim);
  return m ? m.d.reduce((a, b) => a + b, 0) * TICK : 0.5;
};
export const hasAnim = (dex, anim) => !!SWARM_SHEETS[dex]?.[anim];
export const spriteHeight = (dex) => (SWARM_SHEETS[dex]?.walk?.h || 40) * PIX;

/** Un lot de billboards pour une planche. */
class SpriteBatch {
  constructor(scene, dex, anim, capacity) {
    this.meta = sheetOf(dex, anim);
    this.anim = SWARM_SHEETS[dex]?.[anim] ? anim : 'walk';
    this.capacity = capacity;
    this.count = 0;
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.attributes.position);
    geo.setAttribute('uv', plane.attributes.uv);
    this.pos = new Float32Array(capacity * 3);
    this.data = new Float32Array(capacity * 4);
    this.alpha = new Float32Array(capacity).fill(1);
    this.aPos = new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aData = new THREE.InstancedBufferAttribute(this.data, 4).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.InstancedBufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPos', this.aPos);
    geo.setAttribute('iData', this.aData);
    geo.setAttribute('iAlpha', this.aAlpha);
    geo.instanceCount = 0;
    const meta = this.meta || { w: 32, h: 32, d: [1], rows: 1 };
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null },
      uCell: { value: new THREE.Vector2(meta.w, meta.h) },
      uGrid: { value: new THREE.Vector2(meta.d.length, meta.rows || 1) },
      uLift: { value: meta.h * 0.25 },
      uTint: { value: new THREE.Color(1, 1, 1) },
      uTexel: { value: new THREE.Vector2(0.001, 0.001) }
    }]);
    this.material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms, fog: true, transparent: true, depthWrite: true });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.geo = geo;
    plane.dispose();
    scene.add(this.mesh);
    if (this.meta) {
      loader.load(`${BASE}/${dex}/${this.meta.src}`, (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.uniforms.uMap.value = tex;
        this.uniforms.uTexel.value.set(1 / tex.image.width, 1 / tex.image.height);
        this.tex = tex;
        // Où sont les pieds ? Plus bas pixel opaque de la première case (face caméra).
        try {
          const img = tex.image;
          const c = document.createElement('canvas');
          c.width = meta.w; c.height = meta.h;
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0, meta.w, meta.h, 0, 0, meta.w, meta.h);
          const d = x.getImageData(0, 0, meta.w, meta.h).data;
          for (let yy = meta.h - 1; yy >= 0; yy -= 1) {
            let hit = false;
            for (let xx = 0; xx < meta.w; xx += 1) if (d[(yy * meta.w + xx) * 4 + 3] > 40) { hit = true; break; }
            if (hit) { this.uniforms.uLift.value = yy + 1 - meta.h / 2; break; }
          }
        } catch { /* image d'une autre origine : on garde l'estimation */ }
      }, undefined, () => { this.failed = true; });
    }
  }

  push(x, y, z, scale, t, row, flash = 0, alpha = 1, loop = true) {
    if (this.count >= this.capacity || !this.meta) return;
    const i = this.count;
    this.count += 1;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.data[i * 4] = scale;
    this.data[i * 4 + 1] = frameAt(this.meta.d, t, loop);
    this.data[i * 4 + 2] = this.meta.rows > 1 ? row % this.meta.rows : 0;
    this.data[i * 4 + 3] = flash;
    this.alpha[i] = alpha;
  }

  flush() {
    this.geo.instanceCount = this.count;
    this.aPos.needsUpdate = true;
    this.aData.needsUpdate = true;
    this.aAlpha.needsUpdate = true;
    this.count = 0;
  }

  dispose() {
    this.geo.dispose();
    this.material.dispose();
    this.tex?.dispose();
  }
}

/** Banque de lots : un lot par (Pokémon, animation), créé à la demande. */
export const createSpriteBank = (scene) => {
  const batches = new Map();
  const get = (dex, anim, capacity = 8) => {
    const key = `${dex}/${anim}`;
    let b = batches.get(key);
    if (!b) {
      b = new SpriteBatch(scene, dex, anim, capacity);
      batches.set(key, b);
    }
    return b;
  };
  return {
    get,
    /** Ajoute un sprite ; `cap` = capacité du lot s'il doit être créé. */
    draw(dex, anim, x, y, z, scale, t, row, flash = 0, alpha = 1, cap = 8, loop = true) {
      // Taupiqueur et Triopikeur : leur « marche » PMD n'est qu'une traînée de terre, on garde leur pose visible
      const a = (dex === 50 || dex === 51) && anim === 'walk' ? 'idle' : anim;
      const real = hasAnim(dex, a) ? a : 'walk';
      get(dex, real, cap).push(x, y, z, scale, t, row, flash, alpha, loop);
    },
    preload(dex, anims, cap) { anims.forEach((a0) => { const a = (dex === 50 || dex === 51) && a0 === 'walk' ? 'idle' : a0; if (hasAnim(dex, a)) get(dex, a, cap); }); },
    flush() { batches.forEach((b) => b.flush()); },
    dispose() { batches.forEach((b) => { scene.remove(b.mesh); b.dispose(); }); batches.clear(); }
  };
};
