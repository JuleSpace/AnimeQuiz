/**
 * Sprites animés du mode Swarm : planches « Donjon Mystère » (PMDCollab SpriteCollab, CC BY-NC 4.0).
 * Chaque planche a 8 lignes (une par direction) et une colonne par image.
 * Ordre des lignes : bas, bas-droite, droite, haut-droite, haut, haut-gauche, gauche, bas-gauche.
 */
import SWARM_SHEETS from './swarmSheets';

const BASE = `${process.env.PUBLIC_URL || ''}/swarm/pmd`;
const TICK = 1 / 60;

const cache = new Map();

const load = (dex, anim) => {
  const key = `${dex}/${anim}`;
  if (cache.has(key)) return cache.get(key);
  const meta = SWARM_SHEETS[dex]?.[anim];
  if (!meta) { cache.set(key, null); return null; }
  const img = new Image();
  const entry = { meta, img, white: null, total: meta.d.reduce((a, b) => a + b, 0) * TICK };
  img.onload = () => {
    // Silhouette blanche précalculée pour le flash quand on prend un coup.
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // Où sont vraiment les pieds ? Plus bas pixel opaque de chaque ligne (direction), première image.
    try {
      const { w, h, rows } = meta;
      entry.feet = [];
      for (let r = 0; r < rows; r += 1) {
        const d = x.getImageData(0, r * h, w, h).data;
        let bottom = h / 2;
        for (let yy = h - 1; yy >= 0; yy -= 1) {
          let hit = false;
          for (let xx = 0; xx < w; xx += 1) if (d[(yy * w + xx) * 4 + 3] > 40) { hit = true; break; }
          if (hit) { bottom = yy + 1; break; }
        }
        entry.feet.push(bottom - h / 2);
      }
    } catch (e) { entry.feet = null; }
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    entry.white = c;
  };
  img.src = `${BASE}/${dex}/${meta.src}`;
  cache.set(key, entry);
  return entry;
};

/** Précharge les animations utiles d'une liste de Pokémon. */
export const preloadSprites = (dexes) => {
  dexes.forEach((dex) => ['walk', 'idle', 'attack', 'hurt', 'shoot'].forEach((a) => load(dex, a)));
};

/** Durée totale d'une animation (en secondes). */
export const animLength = (dex, anim) => load(dex, anim)?.total || 0.5;

/** Moment (en secondes) où l'attaque « touche » dans l'animation. */
export const hitTime = (dex, anim = 'attack') => {
  const e = load(dex, anim);
  if (!e) return 0.25;
  const hit = e.meta.hit ?? Math.floor(e.meta.d.length / 2);
  return e.meta.d.slice(0, hit).reduce((a, b) => a + b, 0) * TICK;
};

/** Hauteur « au repos » du Pokémon (pour placer barres de vie et chiffres). */
export const bodyHeight = (dex) => (SWARM_SHEETS[dex]?.walk?.h || 40);

/** Direction (0..7) à partir d'un vecteur. */
export const dirOf = (dx, dy) => {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (((Math.round((90 - deg) / 45) % 8) + 8) % 8);
};

const frameAt = (meta, t, loop) => {
  const total = meta.d.reduce((a, b) => a + b, 0);
  let ticks = t / TICK;
  if (loop) ticks %= total;
  else if (ticks >= total) return meta.d.length - 1;
  for (let i = 0; i < meta.d.length; i += 1) {
    ticks -= meta.d[i];
    if (ticks < 0) return i;
  }
  return meta.d.length - 1;
};

/**
 * Dessine un Pokémon animé. (x, y) = position des pieds.
 * Renvoie false si l'image n'est pas encore chargée (l'appelant peut dessiner un repli).
 */
export const drawPokemon = (ctx, dex, anim, t, dir, x, y, scale, opts = {}) => {
  let e = load(dex, anim);
  if (!e || !e.img.complete || !e.img.naturalWidth) e = load(dex, 'walk');
  if (!e || !e.img.complete || !e.img.naturalWidth) return false;
  const { meta } = e;
  const f = frameAt(meta, t, opts.loop !== false);
  const row = meta.rows > 1 ? dir % meta.rows : 0;
  const w = meta.w * scale;
  const h = meta.h * scale;
  // pieds posés sur (x, y) : on remonte le sprite de la distance centre → plus bas pixel
  const walkFeet = load(dex, 'walk')?.feet;
  const feet = (e.feet && e.feet[row]) ?? (walkFeet && walkFeet[row]) ?? bodyHeight(dex) * 0.25;
  const lift = (feet - 1) * scale;
  const src = opts.white && e.white ? e.white : e.img;
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.imageSmoothingEnabled = false;
  const sx = opts.squash ? 1 + opts.squash : 1;
  const sy = opts.squash ? 1 - opts.squash : 1;
  ctx.translate(x, y - lift - (opts.z || 0));
  if (sx !== 1) ctx.scale(sx, sy);
  ctx.drawImage(src, f * meta.w, row * meta.h, meta.w, meta.h, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
};
