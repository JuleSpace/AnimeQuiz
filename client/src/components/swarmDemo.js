/**
 * Petites démos animées pour les cartes d'attaque du Swarm :
 * le partenaire (à gauche) utilise l'attaque sur un Pokémon sauvage (à droite), en boucle.
 * Tout est dessiné au canvas, avec les mêmes sprites que le jeu.
 */
import { animLength, drawPokemon } from './swarmSprites';

const TAU = Math.PI * 2;
const CYCLE = 2.4;
const ease = (k) => 1 - (1 - k) ** 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* Comment chaque attaque se montre. */
const KIND = {
  ember: 'proj', electroball: 'proj', shadow: 'proj', watergun: 'proj', bubble: 'proj', willowisp: 'proj', swift: 'proj',
  icebeam: 'beam', hydropump: 'beam',
  thunder: 'bolt', thunderwave: 'bolt',
  mudbomb: 'lob', seedbomb: 'lob', sludge: 'lob',
  dracometeor: 'meteor',
  quake: 'ring', surf: 'ring', spark: 'ring',
  psychic: 'psy',
  leaf: 'orbit',
  firespin: 'firering',
  bloom: 'bloom',
  bite: 'melee', irontail: 'melee', machpunch: 'melee', doublekick: 'melee', flamethrower: 'cone',
  flametrail: 'trail',
  hurricane: 'tornado', whirlpool: 'tornado',
  gigadrain: 'drain',
  leafblade: 'boomerang',
  rockslide: 'meteor', aerialace: 'bolt', bodyslam: 'melee', blizzard: 'ring', dazzlinggleam: 'ring',
  nightslash: 'melee', flashcannon: 'proj', hyperbeam: 'beam',
  vinewhip: 'melee', flamecharge: 'melee', razorshell: 'boomerang', needlearm: 'melee', mysticalfire: 'psy', watershuriken: 'bolt'
};
export const demoAnim = (id) => (['quake', 'bite', 'irontail', 'machpunch', 'doublekick', 'leafblade', 'surf', 'spark', 'bodyslam', 'nightslash', 'blizzard', 'dazzlinggleam', 'vinewhip', 'flamecharge', 'razorshell', 'needlearm'].includes(id) ? 'attack' : 'shoot');

const PAL = {
  ember: ['#fffbe0', '#ffd34a', '#ff6a1f'], electroball: ['#ffffff', '#fff27a', '#f7c61c'], shadow: ['#1a0d2b', '#4b2a7a', '#8b6bd6'],
  watergun: ['#e8f4ff', '#7fb4ff', '#3a7bff'], bubble: ['#ffffff', '#bfe3ff', '#7fd0ff'], willowisp: ['#ffffff', '#b8c4ff', '#5a6aff'],
  swift: ['#ffffff', '#fff3a0', '#c9a400'], flashcannon: ['#ffffff', '#d8e2f0', '#8a95a8']
};

const ball = (ctx, x, y, r, pal) => {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2);
  g.addColorStop(0, pal[0]); g.addColorStop(0.35, pal[1]); g.addColorStop(0.75, pal[2]); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, TAU); ctx.fill();
};
const star = (ctx, x, y, r, rot) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#fff3a0'; ctx.strokeStyle = '#c9a400'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) { const rr = i % 2 ? r * 0.42 : r; const a = (i / 10) * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
};
const flame = (ctx, x, y, s, a) => {
  // petite flamme : base rouge, cœur orange, pointe jaune
  ctx.globalAlpha = clamp01(a);
  ctx.fillStyle = '#e0401a'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.55, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(x - s * 0.8, y); ctx.quadraticCurveTo(x, y - s * 2.4, x + s * 0.8, y); ctx.fill();
  ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.quadraticCurveTo(x, y - s * 1.4, x + s * 0.4, y); ctx.fill();
  ctx.globalAlpha = 1;
};
const burst = (ctx, x, y, k, color) => {
  if (k <= 0 || k >= 1) return;
  ctx.strokeStyle = color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU + 0.3;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (4 + k * 6), y + Math.sin(a) * (4 + k * 6)); ctx.lineTo(x + Math.cos(a) * (10 + k * 14), y + Math.sin(a) * (10 + k * 14)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
const zigzag = (ctx, x0, y0, x1, y1, seed) => {
  const pts = [[x0, y0]];
  for (let i = 1; i < 6; i += 1) { const k = i / 6; pts.push([x0 + (x1 - x0) * k + Math.sin(seed * 7 + i * 3) * 4, y0 + (y1 - y0) * k + Math.cos(seed * 5 + i * 2) * 8]); }
  pts.push([x1, y1]);
  [[6, 'rgba(247,208,44,.35)'], [3, '#ffe14a'], [1.2, '#ffffff']].forEach(([w, c]) => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  });
};

/**
 * Dessine une image de la démo.
 * @param t temps en secondes ; dex : sprite du partenaire ; foe : sprite de la cible ; color : couleur de l'attaque.
 */
export const drawDemo = (ctx, W, H, t, { id, dex, foe, color }) => {
  const kind = KIND[id] || 'proj';
  const ground = H * 0.82;
  const sc = Math.min(1.7, H / 70);
  const tt = t % CYCLE;
  const anim = demoAnim(id);
  const castAt = 0.35;
  const castLen = Math.min(0.7, animLength(dex, anim) / 1.2);
  let px = W * 0.24;
  const fx = W * 0.78;
  const fy = ground;
  const hitAt = kind === 'proj' || kind === 'lob' || kind === 'tornado' || kind === 'boomerang' ? 1.05 : kind === 'meteor' ? 1.2 : 0.6;
  const hitK = (tt - hitAt) / 0.35;
  const hit = hitK > 0 && hitK < 1;

  // sol : ombre douce
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath(); ctx.ellipse(W / 2, ground + 4, W * 0.46, 6, 0, 0, TAU); ctx.fill();

  /* ——— Roue de Feu : il traverse la scène en laissant des flammes ——— */
  if (kind === 'trail') {
    const k = (tt / CYCLE);
    px = W * (0.08 + k * 0.84);
    for (let i = 0; i < 9; i += 1) {
      const bx = px - 10 - i * 12;
      if (bx < 0) continue;
      flame(ctx, bx, ground - 1, 10 - i * 0.5, clamp01(1 - i / 9) * (0.8 + Math.sin(t * 20 + i) * 0.2));
    }
    drawPokemon(ctx, dex, 'walk', t * 1.4, 2, px, ground, sc);
    return;
  }

  /* ——— Cible ——— */
  const knock = hit ? Math.sin(hitK * Math.PI) * 6 : 0;
  if (kind !== 'orbit' && kind !== 'firering' && kind !== 'bloom') {
    drawPokemon(ctx, foe, hit ? 'hurt' : 'idle', hit ? hitK * 0.4 : t, 6, fx + knock, fy, sc * 0.9, { white: hit && hitK < 0.25 });
  }

  /* ——— Lanceur : au repos, puis animation d'attaque ——— */
  const casting = tt >= castAt && tt < castAt + castLen;
  let cx = px;
  if (kind === 'melee' && tt > castAt - 0.1 && tt < castAt + 0.8) {
    // il bondit au contact puis revient
    const k = tt < castAt + 0.2 ? ease((tt - castAt + 0.1) / 0.3) : 1 - ease(clamp01((tt - castAt - 0.4) / 0.4));
    cx = px + (fx - px - 46) * clamp01(k);
  }
  drawPokemon(ctx, dex, casting ? anim : 'idle', casting ? (tt - castAt) * 1.2 : t, 2, cx, ground, sc, { loop: !casting });
  const hand = { x: cx + 14, y: ground - 18 };
  const target = { x: fx, y: fy - 16 };
  const fly = clamp01((tt - (castAt + 0.15)) / (hitAt - castAt - 0.15));
  const flying = tt > castAt + 0.15 && tt < hitAt;

  if (kind === 'proj') {
    const pal = PAL[id] || ['#ffffff', color, color];
    if (flying) {
      const x = hand.x + (target.x - hand.x) * fly;
      const arc = id === 'swift' || id === 'willowisp' ? Math.sin(fly * Math.PI) * -22 : 0;
      const y = hand.y + (target.y - hand.y) * fly + arc;
      if (id === 'swift') star(ctx, x, y, 7, t * 10);
      else if (id === 'watergun') {
        ctx.fillStyle = 'rgba(99,144,240,.5)'; ctx.beginPath(); ctx.ellipse(x - 8, y, 14, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#cfe6ff'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, 0, 0, TAU); ctx.fill();
      } else if (id === 'bubble') {
        ctx.fillStyle = 'rgba(160,215,255,.35)'; ctx.beginPath(); ctx.arc(x, y + Math.sin(t * 9) * 3, 8, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#eaf8ff'; ctx.lineWidth = 1.5; ctx.stroke();
      } else ball(ctx, x, y, id === 'shadow' ? 8 : 5, pal);
    }
    if (hit) {
      if (id === 'ember' || id === 'electroball') ball(ctx, target.x, target.y, 6 + hitK * 10, pal.map((c, i) => (i === 2 ? c : c)));
      burst(ctx, target.x, target.y, hitK, pal[1]);
    }
  } else if (kind === 'beam') {
    if (tt > castAt + 0.1 && tt < castAt + 0.55) {
      const a = 1 - clamp01((tt - castAt - 0.1) / 0.45);
      const water = id === 'hydropump';
      ctx.globalAlpha = a;
      ctx.fillStyle = water ? 'rgba(60,130,255,.55)' : 'rgba(140,220,255,.5)'; ctx.fillRect(hand.x, hand.y - 7, W - hand.x, 14);
      ctx.fillStyle = water ? '#7fc0ff' : '#c8f2ff'; ctx.fillRect(hand.x, hand.y - 4, W - hand.x, 8);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(hand.x, hand.y - 1.5, W - hand.x, 3);
      ctx.globalAlpha = 1;
    }
    if (hit) burst(ctx, target.x, target.y, hitK, id === 'hydropump' ? '#bfe3ff' : '#e8fbff');
  } else if (kind === 'bolt') {
    if (tt > castAt + 0.1 && tt < castAt + 0.4) zigzag(ctx, hand.x, hand.y - 4, target.x, target.y, Math.floor(t * 20));
    if (hit) burst(ctx, target.x, target.y, hitK, '#fff27a');
  } else if (kind === 'lob') {
    if (flying) {
      const x = hand.x + (target.x - hand.x) * fly;
      const y = hand.y + (target.y + 14 - hand.y) * fly - Math.sin(fly * Math.PI) * H * 0.45;
      const c = id === 'sludge' ? ['#5a2a7a', '#b06ad6'] : id === 'mudbomb' ? ['#5a3a1a', '#8a5a2a'] : ['#6b4a2a', '#c9a36b'];
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 3.5, 0, TAU); ctx.fill();
    }
    if (tt > hitAt) {
      const a = 1 - clamp01((tt - hitAt) / 1.2);
      if (id === 'seedbomb') ball(ctx, fx, ground - 4, 8 + hitK * 10, ['#fff6c2', '#ffb347', '#c9a36b']);
      else {
        ctx.fillStyle = id === 'sludge' ? `rgba(176,106,214,${0.6 * a})` : `rgba(110,72,36,${0.6 * a})`;
        ctx.beginPath(); ctx.ellipse(fx, ground + 2, 30, 8, 0, 0, TAU); ctx.fill();
      }
    }
  } else if (kind === 'meteor') {
    for (let i = 0; i < 3; i += 1) {
      const t0 = castAt + 0.2 + i * 0.15;
      const k = clamp01((tt - t0) / 0.5);
      if (tt < t0 || k >= 1) continue;
      const tx = fx + (i - 1) * 18; const ty = ground - 6;
      const x = tx + 70 * (1 - k); const y = ty - H * (1 - k);
      ctx.strokeStyle = 'rgba(255,200,120,.6)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + 14, y - 22); ctx.lineTo(x, y); ctx.stroke();
      ball(ctx, x, y, 4, ['#fff1c8', '#b49cff', '#6f35fc']);
    }
    if (hit) ball(ctx, fx, ground - 8, 8 + hitK * 16, ['#ffffff', '#b49cff', '#5a2ad0']);
  } else if (kind === 'ring') {
    if (tt > castAt + 0.1 && tt < castAt + 0.7) {
      const k = clamp01((tt - castAt - 0.1) / 0.6);
      const r = 14 + k * (fx - px + 10);
      const c = id === 'surf' ? '#3a7bff' : id === 'spark' ? '#ffe14a' : '#d8a868';
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = c; ctx.lineWidth = id === 'surf' ? 9 : 4;
      ctx.beginPath(); ctx.ellipse(px, ground, r, r * 0.4, 0, 0, TAU); ctx.stroke();
      if (id === 'surf') { ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, ground - 3, r * 0.97, r * 0.38, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    if (hit) burst(ctx, target.x, target.y, hitK, id === 'spark' ? '#fff27a' : '#ffffff');
  } else if (kind === 'psy') {
    if (tt > castAt + 0.1 && tt < castAt + 0.8) {
      const k = clamp01((tt - castAt - 0.1) / 0.7);
      ctx.strokeStyle = `rgba(255,122,200,${1 - k})`; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i += 1) { const r = 8 + (k + i * 0.25) * 24; ctx.beginPath(); ctx.ellipse(target.x, target.y, r, r * 0.6, 0, 0, TAU); ctx.stroke(); }
    }
  } else if (kind === 'orbit') {
    for (let i = 0; i < 3; i += 1) {
      const a = t * 3 + (i / 3) * TAU;
      const x = px + Math.cos(a) * 34; const y = ground - 14 + Math.sin(a) * 14;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * 2);
      ctx.fillStyle = '#2f6e1a'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7fe05a'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'firering') {
    const on = tt > castAt && tt < castAt + 1.7;
    const a = on ? clamp01((tt - castAt) / 0.2) * clamp01((castAt + 1.7 - tt) / 0.3) : 0;
    for (let i = 0; i < 9; i += 1) {
      const ang = (i / 9) * TAU;
      flame(ctx, px + Math.cos(ang) * 44, ground + Math.sin(ang) * 14, 8, a * (0.8 + Math.sin(t * 18 + i) * 0.2));
    }
  } else if (kind === 'bloom') {
    const a = clamp01((tt - castAt) / 0.4) * clamp01((CYCLE - tt) / 0.4);
    ctx.fillStyle = `rgba(150,220,110,${0.3 * a})`; ctx.beginPath(); ctx.ellipse(px + 20, ground, 56, 14, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 12; i += 1) {
      const x = px + 20 + Math.cos(i * 2.4) * 48 * ((i % 4) / 4 + 0.25); const y = ground + Math.sin(i * 2.4) * 11;
      ctx.globalAlpha = a; ctx.fillStyle = i % 3 ? '#ff9ccf' : '#fff6a0'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'melee') {
    if (hit || (tt > castAt + 0.15 && tt < castAt + 0.5)) {
      const k = clamp01((tt - castAt - 0.15) / 0.35);
      if (id === 'bite') {
        const c = 1 - Math.min(1, k * 1.6);
        ctx.fillStyle = `rgba(255,255,255,${1 - k * 0.8})`; ctx.strokeStyle = `rgba(40,50,90,${1 - k})`; ctx.lineWidth = 1;
        [-1, 1].forEach((sg) => {
          const y0 = target.y + sg * (4 + 12 * c);
          for (let i = 0; i < 4; i += 1) { const x0 = target.x - 14 + i * 7; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 6, y0); ctx.lineTo(x0 + 3, y0 - sg * 7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        });
      } else if (id === 'irontail') {
        ctx.strokeStyle = `rgba(230,236,245,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 2;
        ctx.beginPath(); ctx.ellipse(cx + 10, ground - 14, 40, 22, 0, -1 - k, 0.6 + k * 0.4); ctx.stroke();
      } else if (id === 'doublekick') {
        ball(ctx, target.x - 4, target.y, 6 + k * 8, ['#fff6c2', '#ffb347', '#ff6a1f']);
        if (k > 0.4) ball(ctx, target.x + 6, target.y + 6, 4 + (k - 0.4) * 10, ['#fff6c2', '#ffb347', '#ff6a1f']);
      } else {
        ctx.fillStyle = `rgba(255,220,140,${1 - k})`; ctx.beginPath(); ctx.arc(target.x, target.y, 6 + k * 10, 0, TAU); ctx.fill();
        burst(ctx, target.x, target.y, k, '#ffffff');
      }
    }
  } else if (kind === 'cone') {
    if (tt > castAt + 0.05 && tt < castAt + 0.7) {
      const k = clamp01((tt - castAt - 0.05) / 0.65);
      for (let i = 0; i < 14; i += 1) {
        const d = ((i / 14 + t * 2.5) % 1) * (fx - hand.x + 14);
        const spread = d * 0.32;
        const y = hand.y + Math.sin(i * 1.7) * spread;
        const s = 3 + d * 0.06;
        ctx.fillStyle = ['#fff1a8', '#ffb347', '#ff6a1f', '#e0401a'][i % 4];
        ctx.globalAlpha = (1 - k * 0.6) * (1 - d / (fx - hand.x + 30));
        ctx.beginPath(); ctx.arc(hand.x + d, y, s, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  } else if (kind === 'tornado') {
    if (tt > castAt + 0.1 && tt < hitAt + 0.5) {
      const k = clamp01((tt - castAt - 0.1) / (hitAt - castAt - 0.1));
      const x = hand.x + 10 + (target.x - hand.x - 10) * k;
      const water = id === 'whirlpool';
      for (let i = 0; i < 5; i += 1) {
        const q = i / 4; const w = 6 + q * 12;
        ctx.strokeStyle = water ? (i % 2 ? 'rgba(200,240,255,.9)' : 'rgba(60,140,230,.85)') : (i % 2 ? 'rgba(255,255,255,.9)' : 'rgba(170,210,240,.8)');
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 9 + i) * 3, ground - 4 - q * 30, w, w * 0.32, 0, t * 9 + i, t * 9 + i + 4.2); ctx.stroke();
      }
    }
  } else if (kind === 'drain') {
    if (tt > castAt + 0.15 && tt < castAt + 0.9) {
      const k = clamp01((tt - castAt - 0.15) / 0.75);
      for (let i = 0; i < 5; i += 1) {
        const q = clamp01(k - i * 0.08);
        const x = target.x + (hand.x - target.x) * q; const y = target.y + (hand.y - target.y) * q - Math.sin(q * Math.PI) * (10 + i * 3);
        ctx.fillStyle = i % 2 ? '#d8ffb8' : '#9be06a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      }
    }
  } else if (kind === 'boomerang') {
    if (tt > castAt + 0.1 && tt < castAt + 1.4) {
      const k = clamp01((tt - castAt - 0.1) / 1.3);
      const out = k < 0.5 ? ease(k * 2) : 1 - ease((k - 0.5) * 2);
      const x = hand.x + (target.x - hand.x + 10) * out; const y = hand.y - Math.sin(k * TAU) * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 18);
      ctx.fillStyle = '#2f6e1a'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7fe05a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
};

export { CYCLE as DEMO_CYCLE };
