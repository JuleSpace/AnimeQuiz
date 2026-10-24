/*
 * Mode 3D de Bongo Stream : un modèle .glb (avec squelette) déposé dans le dossier « skin » remplace le dessin.
 * Le personnage est vu de face derrière la table. Deux rendus du même modèle, alignés :
 *  - le corps entier, sous le bureau (le bas du corps est caché par la table) ;
 *  - seulement les bras, par-dessus le bureau (les mains se posent sur les touches et la souris).
 * Les bras sont pilotés en direct (IK à deux os : épaule, coude) vers les cibles données par app.js.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = 800;
const H = 500;
const TABLE_Y = 330; // bord de la table, en pixels de la scène

const v = () => new THREE.Vector3();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** IK analytique à deux os (D. Holden) : tourne `a` (épaule) et `b` (coude) pour que `c` (main) touche `t`. */
function twoBoneIK(a, b, c, t) {
  const pa = a.getWorldPosition(v());
  const pb = b.getWorldPosition(v());
  const pc = c.getWorldPosition(v());
  const lab = pb.distanceTo(pa);
  const lcb = pb.distanceTo(pc);
  const lat = clamp(t.distanceTo(pa), 1e-4, lab + lcb - 1e-4);
  const ac = v().subVectors(pc, pa).normalize();
  const ab = v().subVectors(pb, pa).normalize();
  const ba = v().subVectors(pa, pb).normalize();
  const bc = v().subVectors(pc, pb).normalize();
  const at = v().subVectors(t, pa).normalize();
  const acAb0 = Math.acos(clamp(ac.dot(ab), -1, 1));
  const baBc0 = Math.acos(clamp(ba.dot(bc), -1, 1));
  const acAt0 = Math.acos(clamp(ac.dot(at), -1, 1));
  const acAb1 = Math.acos(clamp((lcb * lcb - lab * lab - lat * lat) / (-2 * lab * lat), -1, 1));
  const baBc1 = Math.acos(clamp((lat * lat - lab * lab - lcb * lcb) / (-2 * lab * lcb), -1, 1));
  const axis0 = v().crossVectors(ac, ab);
  if (axis0.lengthSq() < 1e-8) axis0.set(0, 0, 1);
  axis0.normalize();
  const axis1 = v().crossVectors(ac, at);
  if (axis1.lengthSq() < 1e-8) axis1.copy(axis0);
  axis1.normalize();
  const ga = a.getWorldQuaternion(new THREE.Quaternion());
  const gb = b.getWorldQuaternion(new THREE.Quaternion());
  const inv = (q) => q.clone().invert();
  const r0 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(inv(ga)), acAb1 - acAb0);
  const r1 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(inv(gb)), baBc1 - baBc0);
  const r2 = new THREE.Quaternion().setFromAxisAngle(axis1.clone().applyQuaternion(inv(ga)), acAt0);
  a.quaternion.multiply(r0.multiply(r2));
  b.quaternion.multiply(r1);
  a.updateMatrixWorld(true);
}

/** Matériau qui ne dessine que les sommets portés par les os des bras. */
function armsOnly(material, armFlags) {
  const m = material.clone();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uArm = { value: armFlags };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uArm[${armFlags.length}];\nvarying float vArm;`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>\nvArm = skinWeight.x * uArm[int(skinIndex.x)] + skinWeight.y * uArm[int(skinIndex.y)] + skinWeight.z * uArm[int(skinIndex.z)] + skinWeight.w * uArm[int(skinIndex.w)];`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vArm;')
      .replace('void main() {', 'void main() {\n  if (vArm < 0.5) discard;');
  };
  m.customProgramCacheKey = () => 'arms-only';
  return m;
}

export async function start({ url, under, over }) {
  const mk = (canvas) => {
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setSize(W, H, false);
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  };
  const rUnder = mk(under);
  const rOver = mk(over);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8aa0, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(1, 2, 3);
  scene.add(sun);

  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  scene.add(root);
  root.updateMatrixWorld(true);

  // Os des bras
  let skinned = null;
  root.traverse((o) => { if (o.isSkinnedMesh && !skinned) skinned = o; });
  const bone = (re) => skinned?.skeleton.bones.find((b) => re.test(b.name));
  const L = { a: bone(/^L_Shoulder$/i), b: bone(/^L_Elbow$/i), c: bone(/^L_Hand$/i) };
  const R = { a: bone(/^R_Shoulder$/i), b: bone(/^R_Elbow$/i), c: bone(/^R_Hand$/i) };
  const head = bone(/^Head$/i);
  const spine = bone(/^Spine2$/i) || bone(/^Spine1$/i);
  const hasArms = L.a && L.b && L.c && R.a && R.b && R.c;

  // Les bras (épaule et tout ce qui en descend) pour le second rendu
  const armFlags = new Float32Array(Math.max(1, skinned ? skinned.skeleton.bones.length : 1));
  if (skinned) {
    skinned.skeleton.bones.forEach((b, i) => {
      let p = b;
      while (p) { if (p === L.a || p === R.a) { armFlags[i] = 1; break; } p = p.parent; }
    });
  }
  const meshes = [];
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  // L'arme (matériau « Gun ») flotterait quand la main part sur le clavier : on la cache
  meshes.forEach((m) => { if (/gun|weapon/i.test(m.material?.name || '')) m.visible = false; });
  const normalMat = new Map(meshes.map((m) => [m, m.material]));
  const armMat = new Map(meshes.map((m) => [m, Array.isArray(m.material) ? m.material.map((x) => armsOnly(x, armFlags)) : armsOnly(m.material, armFlags)]));

  // Animation d'attente
  const mixer = new THREE.AnimationMixer(root);
  const idle = gltf.animations.find((a) => /idle/i.test(a.name)) || gltf.animations[0];
  if (idle) mixer.clipAction(idle).play();
  mixer.update(0);
  root.updateMatrixWorld(true);

  // Cadrage : tête et épaules au-dessus de la table, face caméra
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(v());
  const center = box.getCenter(v());
  const headY = head ? head.getWorldPosition(v()).y : box.max.y - size.y * 0.1;
  const chestY = spine ? spine.getWorldPosition(v()).y : box.min.y + size.y * 0.62;
  const top = headY + (headY - chestY) * 0.9; // un peu au-dessus de la tête
  // pixels → monde : top ↔ 60 px, chestY ↔ TABLE_Y
  const k = (top - chestY) / (TABLE_Y - 60); // unités monde par pixel
  const cam = new THREE.OrthographicCamera(-W / 2 * k, W / 2 * k, H / 2 * k, -H / 2 * k, -size.z * 20 - 100, size.z * 20 + 100);
  const midY = chestY + (TABLE_Y - H / 2) * k;
  // la caméra regarde le personnage de face (+Z vers la caméra pour un glTF)
  cam.position.set(center.x, midY, center.z + size.z * 5 + 10);
  cam.lookAt(center.x, midY, center.z);
  const frontZ = center.z + size.z * 0.6; // plan des cibles des mains, devant le buste
  const toWorld = (px, py) => new THREE.Vector3(center.x + (px - W / 2) * k, midY - (py - H / 2) * k, frontZ);

  const tgt = { L: toWorld(220, 290), R: toWorld(620, 380) };
  const want = { L: tgt.L.clone(), R: tgt.R.clone() };
  const clock = new THREE.Clock();

  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    mixer.update(dt);
    root.updateMatrixWorld(true);
    if (hasArms) {
      tgt.L.lerp(want.L, 0.55);
      tgt.R.lerp(want.R, 0.35);
      // Face caméra, son bras droit est à gauche de l'écran (les touches), son bras gauche à droite (la souris)
      twoBoneIK(R.a, R.b, R.c, tgt.L);
      twoBoneIK(L.a, L.b, L.c, tgt.R);
      root.updateMatrixWorld(true);
    }
    meshes.forEach((m) => { m.material = normalMat.get(m); });
    rUnder.render(scene, cam);
    meshes.forEach((m) => { m.material = armMat.get(m); });
    rOver.render(scene, cam);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return {
    /** Cibles des mains en pixels de la scène (800 × 500). */
    aim(left, right) {
      want.L.copy(toWorld(left.x, left.y));
      want.R.copy(toWorld(right.x, right.y));
    },
    info: { bones: skinned?.skeleton.bones.length || 0, hasArms, clip: idle?.name || null }
  };
}
