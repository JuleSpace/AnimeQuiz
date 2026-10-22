/**
 * Poké Rush — effets en sprites pixel art : projectiles, étincelles, fumée, pièces, Poké Balls…
 * Deux lots instanciés : les sprites (découpe alpha) et les halos lumineux (mode additif).
 * Ils sont remplis à chaque image puis dessinés en un seul appel chacun.
 */
import * as THREE from 'three';
import { FXN, FX_COLS, makeFxAtlas, makeGlowTexture } from './rushArt';

const VERT = `
attribute vec3 iPos;
attribute vec4 iData; // taille, image, rotation, alpha
attribute vec3 iTint;
uniform float uCols;
uniform float uRows;
varying vec2 vUv;
varying float vAlpha;
varying vec3 vTint;
#include <fog_pars_vertex>
void main() {
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float c = cos(iData.z); float s = sin(iData.z);
  vec2 p = vec2(position.x * c - position.y * s, position.x * s + position.y * c) * iData.x;
  vec3 world = iPos + right * p.x + up * p.y;
  vec4 mvPosition = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float f = iData.y;
  vec2 cell = vec2(mod(f, uCols), floor(f / uCols));
  vUv = vec2((cell.x + uv.x) / uCols, 1.0 - (cell.y + 1.0 - uv.y) / uRows);
  vAlpha = iData.w;
  vTint = iTint;
  #include <fog_vertex>
}`;
const FRAG = `
uniform sampler2D uMap;
uniform float uGlow;
varying vec2 vUv;
varying float vAlpha;
varying vec3 vTint;
#include <fog_pars_fragment>
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (uGlow > 0.5) {
    gl_FragColor = vec4(vTint * c.a * vAlpha, 1.0);
  } else {
    if (c.a < 0.5) discard;
    gl_FragColor = vec4(c.rgb * vTint, vAlpha);
  }
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

class Batch {
  constructor(scene, map, cols, rows, capacity, glow) {
    this.capacity = capacity;
    this.count = 0;
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.attributes.position);
    geo.setAttribute('uv', plane.attributes.uv);
    this.pos = new Float32Array(capacity * 3);
    this.data = new Float32Array(capacity * 4);
    this.tint = new Float32Array(capacity * 3);
    this.aPos = new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aData = new THREE.InstancedBufferAttribute(this.data, 4).setUsage(THREE.DynamicDrawUsage);
    this.aTint = new THREE.InstancedBufferAttribute(this.tint, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPos', this.aPos);
    geo.setAttribute('iData', this.aData);
    geo.setAttribute('iTint', this.aTint);
    geo.instanceCount = 0;
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMap: { value: null }, uCols: { value: cols }, uRows: { value: rows }, uGlow: { value: glow ? 1 : 0 } }]);
    this.uniforms.uMap.value = map;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms, fog: true,
      transparent: true, depthWrite: !glow, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = glow ? 5 : 4;
    this.geo = geo;
    plane.dispose();
    scene.add(this.mesh);
  }

  add(frame, x, y, z, size, rot = 0, alpha = 1, r = 1, g = 1, b = 1) {
    if (this.count >= this.capacity) return;
    const i = this.count;
    this.count += 1;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.data[i * 4] = size; this.data[i * 4 + 1] = frame; this.data[i * 4 + 2] = rot; this.data[i * 4 + 3] = alpha;
    this.tint[i * 3] = r; this.tint[i * 3 + 1] = g; this.tint[i * 3 + 2] = b;
  }

  flush() {
    this.geo.instanceCount = this.count;
    this.aPos.needsUpdate = true; this.aData.needsUpdate = true; this.aTint.needsUpdate = true;
    this.count = 0;
  }

  dispose() { this.geo.dispose(); this.material.dispose(); }
}

export const createFx = (scene) => {
  const atlas = makeFxAtlas();
  const glowTex = makeGlowTexture();
  const rows = Math.ceil(FXN / FX_COLS);
  const sprites = new Batch(scene, atlas, FX_COLS, rows, 4000, false);
  const glows = new Batch(scene, glowTex, 1, 1, 1500, true);
  const col = new THREE.Color();
  return {
    sprite(frame, x, y, z, size, rot = 0, alpha = 1, tint = null) {
      if (tint) { col.set(tint); sprites.add(frame, x, y, z, size, rot, alpha, col.r, col.g, col.b); } else sprites.add(frame, x, y, z, size, rot, alpha);
    },
    glow(x, y, z, size, color, alpha = 1) { col.set(color); glows.add(0, x, y, z, size, 0, alpha, col.r, col.g, col.b); },
    flush() { sprites.flush(); glows.flush(); },
    dispose() { scene.remove(sprites.mesh); scene.remove(glows.mesh); sprites.dispose(); glows.dispose(); atlas.dispose(); glowTex.dispose(); }
  };
};
