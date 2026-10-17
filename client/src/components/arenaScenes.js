/*
 * Décors peints du terrain de combat (canvas 2D).
 * Chaque lieu = un fond (ciel, horizon, végétation…) dessiné en coordonnées écran,
 * et un terrain (bordure + surface) dessiné dans l’espace « monde » écrasé en iso.
 * Tout est procédural et déterministe (graine fixe) : aucun fichier image.
 */

export const SCENES = ['prairie', 'montagne', 'ligue', 'plage'];
export const SCENE_LABELS = {
  auto: 'Auto',
  prairie: 'Prairie',
  montagne: 'Montagne',
  ligue: 'Stade de la Ligue',
  plage: 'Plage'
};
/** Lieu automatique selon le chapitre de la campagne. */
export const SCENE_BY_CHAPTER = { 1: 'prairie', 2: 'montagne', 3: 'ligue' };

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const vGrad = (ctx, y0, y1, stops) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c));
  return g;
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const ellipse = (ctx, x, y, rx, ry, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fill();
};

/** Crête lissée (collines, montagnes) remplie jusqu’en bas. */
const ridge = (ctx, w, h, base, amp, step, color, seed, sharp = false) => {
  const r = seeded(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-20, h + 10);
  let px = -20;
  let py = base - amp * r();
  ctx.lineTo(px, py);
  for (let x = -20; x <= w + step; x += step) {
    const nx = x + step;
    const ny = base - amp * (0.25 + r() * 0.75);
    if (sharp) ctx.lineTo(nx, ny);
    else ctx.quadraticCurveTo(px + step / 2, Math.min(py, ny) - amp * 0.15, nx, ny);
    px = nx;
    py = ny;
  }
  ctx.lineTo(w + step + 20, h + 10);
  ctx.closePath();
  ctx.fill();
};

const cloud = (ctx, x, y, s, alpha = 0.9) => {
  ctx.globalAlpha = alpha;
  ellipse(ctx, x, y, 46 * s, 14 * s, '#ffffff');
  ellipse(ctx, x - 20 * s, y - 6 * s, 22 * s, 14 * s, '#ffffff');
  ellipse(ctx, x + 12 * s, y - 11 * s, 26 * s, 18 * s, '#ffffff');
  ellipse(ctx, x + 34 * s, y - 2 * s, 18 * s, 11 * s, '#ffffff');
  ctx.globalAlpha = 1;
};

const vignette = (ctx, w, h, strength = 0.22) => {
  const g = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(20,24,40,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

/* ——————————————————————————— Fonds ——————————————————————————— */

const sceneryPrairie = (ctx, w, h) => {
  ctx.fillStyle = vGrad(ctx, 0, h * 0.45, ['#a9d4f0', '#d7ecf6', '#f4f4e6']);
  ctx.fillRect(0, 0, w, h);
  // Soleil voilé
  const sun = ctx.createRadialGradient(w * 0.8, h * 0.06, 0, w * 0.8, h * 0.06, h * 0.45);
  sun.addColorStop(0, 'rgba(255,248,220,0.95)');
  sun.addColorStop(1, 'rgba(255,248,220,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h * 0.5);
  cloud(ctx, w * 0.18, h * 0.08, 1.1);
  cloud(ctx, w * 0.55, h * 0.05, 0.75, 0.8);
  cloud(ctx, w * 0.9, h * 0.13, 0.6, 0.7);
  // Montagnes lointaines bleutées
  ridge(ctx, w, h, h * 0.25, h * 0.1, w / 7, '#b5cad9', 4, true);
  // Collines
  ridge(ctx, w, h, h * 0.29, h * 0.06, w / 4, '#a7d08e', 7);
  ridge(ctx, w, h, h * 0.33, h * 0.05, w / 3, '#8fc277', 9);
  // Lisière d’arbres
  const rnd = seeded(21);
  for (let i = 0; i < 46; i += 1) {
    const x = (i / 45) * (w + 40) - 20 + (rnd() - 0.5) * 18;
    const y = h * 0.35 + rnd() * h * 0.025;
    const r = 13 + rnd() * 17;
    const tone = ['#4c8a49', '#5a9a52', '#3f7a42', '#66a85a'][Math.floor(rnd() * 4)];
    ellipse(ctx, x, y + r * 0.55, r * 0.9, r * 0.35, 'rgba(30,60,30,0.18)');
    ellipse(ctx, x, y, r, r * 0.95, tone);
    ellipse(ctx, x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.4, 'rgba(255,255,255,0.13)');
  }
  // Prairie
  const top = h * 0.38;
  ctx.fillStyle = vGrad(ctx, top, h, ['#9ccd78', '#86bd66', '#78b25b']);
  ctx.fillRect(0, top, w, h - top);
  for (let i = 0; i < 220; i += 1) {
    const x = rnd() * w;
    const y = top + 6 + rnd() * (h - top);
    const t = (y - top) / (h - top);
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(50,110,40,0.35)' : 'rgba(220,245,190,0.35)';
    ctx.lineWidth = 1 + t;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2 - t * 2, y - 5 - t * 6);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2 + t * 2, y - 6 - t * 6);
    ctx.stroke();
  }
  const petals = ['#ffffff', '#ffe27a', '#ffb3c7', '#c9b8ff'];
  for (let i = 0; i < 70; i += 1) {
    const x = rnd() * w;
    const y = top + 10 + rnd() * (h - top);
    const t = (y - top) / (h - top);
    ellipse(ctx, x, y, 1.6 + t * 2, 1.2 + t * 1.6, petals[Math.floor(rnd() * petals.length)]);
  }
  vignette(ctx, w, h, 0.18);
};

const sceneryMontagne = (ctx, w, h) => {
  ctx.fillStyle = vGrad(ctx, 0, h * 0.45, ['#c3cedb', '#dfe4ea', '#eceae4']);
  ctx.fillRect(0, 0, w, h);
  // Sommets enneigés en couches
  const peaks = (base, amp, color, snow, seed) => {
    const r = seeded(seed);
    const pts = [];
    for (let x = -40; x <= w + 80; x += w / 6) pts.push([x + (r() - 0.5) * 40, base - amp * (0.4 + r() * 0.6)]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, h);
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.lineTo(x, y);
      else {
        const [px, py] = pts[i - 1];
        ctx.lineTo((px + x) / 2, Math.max(py, y) + amp * 0.35);
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(w + 80, h);
    ctx.closePath();
    ctx.fill();
    if (snow) {
      ctx.fillStyle = snow;
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - amp * 0.22, y + amp * 0.2);
        ctx.lineTo(x - amp * 0.08, y + amp * 0.16);
        ctx.lineTo(x + amp * 0.04, y + amp * 0.23);
        ctx.lineTo(x + amp * 0.2, y + amp * 0.18);
        ctx.closePath();
        ctx.fill();
      });
    }
  };
  peaks(h * 0.22, h * 0.16, '#a6b3c4', 'rgba(255,255,255,0.85)', 3);
  // Brume
  ctx.fillStyle = vGrad(ctx, h * 0.18, h * 0.3, ['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']);
  ctx.fillRect(0, h * 0.18, w, h * 0.12);
  peaks(h * 0.3, h * 0.12, '#8796a8', 'rgba(255,255,255,0.7)', 8);
  // Sapins
  const rnd = seeded(33);
  for (let i = 0; i < 60; i += 1) {
    const x = (i / 59) * (w + 30) - 15 + (rnd() - 0.5) * 14;
    const y = h * 0.355 + rnd() * h * 0.02;
    const s = 12 + rnd() * 16;
    ctx.fillStyle = ['#3d5a52', '#466658', '#34504a'][Math.floor(rnd() * 3)];
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.6);
    ctx.lineTo(x + s * 0.55, y);
    ctx.lineTo(x - s * 0.55, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = vGrad(ctx, h * 0.3, h * 0.38, ['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)']);
  ctx.fillRect(0, h * 0.3, w, h * 0.08);
  // Plateau rocheux
  const top = h * 0.37;
  ctx.fillStyle = vGrad(ctx, top, h, ['#b4ab9d', '#a29889', '#968b7c']);
  ctx.fillRect(0, top, w, h - top);
  for (let i = 0; i < 160; i += 1) {
    const x = rnd() * w;
    const y = top + 4 + rnd() * (h - top);
    const t = (y - top) / (h - top);
    ellipse(ctx, x, y, 1.5 + t * 4 * rnd(), 1 + t * 2.4 * rnd(), rnd() < 0.5 ? 'rgba(70,60,50,0.25)' : 'rgba(255,255,255,0.18)');
  }
  for (let i = 0; i < 40; i += 1) {
    const x = rnd() * w;
    const y = top + 10 + rnd() * (h - top);
    ellipse(ctx, x, y, 4 + rnd() * 6, 2 + rnd() * 3, 'rgba(110,150,90,0.35)');
  }
  vignette(ctx, w, h, 0.2);
};

const sceneryLigue = (ctx, w, h) => {
  ctx.fillStyle = vGrad(ctx, 0, h * 0.4, ['#e9c9a3', '#f2dcc0', '#f6ecdf']);
  ctx.fillRect(0, 0, w, h);
  // Toit et charpente
  const roofY = h * 0.03;
  ctx.fillStyle = '#2d3447';
  ctx.beginPath();
  ctx.moveTo(-10, roofY + 26);
  ctx.quadraticCurveTo(w / 2, roofY - 10, w + 10, roofY + 26);
  ctx.lineTo(w + 10, roofY + 36);
  ctx.quadraticCurveTo(w / 2, roofY + 2, -10, roofY + 36);
  ctx.closePath();
  ctx.fill();
  // Tribunes en gradins
  const standTop = roofY + 30;
  const standBot = h * 0.33;
  const rows = 9;
  const rnd = seeded(11);
  const crowd = ['#f4efe6', '#e8b66a', '#d77d63', '#8eaed6', '#b7d3a3', '#c9a6d9'];
  for (let r = 0; r < rows; r += 1) {
    const t0 = r / rows;
    const t1 = (r + 1) / rows;
    const y0 = standTop + (standBot - standTop) * t0;
    const y1 = standTop + (standBot - standTop) * t1;
    const inset0 = w * 0.05 * (1 - t0);
    const inset1 = w * 0.05 * (1 - t1);
    ctx.fillStyle = r % 2 ? '#454d66' : '#3e4560';
    ctx.beginPath();
    ctx.moveTo(inset0, y0);
    ctx.lineTo(w - inset0, y0);
    ctx.lineTo(w - inset1, y1);
    ctx.lineTo(inset1, y1);
    ctx.closePath();
    ctx.fill();
    const step = 6 + t1 * 4;
    for (let x = inset1 + 3; x < w - inset1 - 3; x += step) {
      if (rnd() < 0.2) continue;
      const c = crowd[Math.floor(rnd() * crowd.length)];
      const hr = 1.4 + t1 * 1.5;
      ellipse(ctx, x, y1 - hr * 1.6, hr * 1.25, hr * 1.1, c);
      ellipse(ctx, x, y1 - hr * 3.1, hr * 0.8, hr * 0.8, 'rgba(240,210,180,0.85)');
    }
  }
  // Grands drapeaux suspendus
  const flags = ['#c94f43', '#f2ede2', '#3d6b9e', '#f2ede2', '#e0a640', '#f2ede2', '#4f8f6b'];
  flags.forEach((c, i) => {
    const x = w * (0.08 + i * 0.14);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - 9, roofY + 30);
    ctx.lineTo(x + 9, roofY + 30);
    ctx.lineTo(x + 9, roofY + 58);
    ctx.lineTo(x, roofY + 50);
    ctx.lineTo(x - 9, roofY + 58);
    ctx.closePath();
    ctx.fill();
  });
  // Faisceaux de projecteurs, très doux
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  [[0.12, 0.6], [0.88, 0.4]].forEach(([fx, tx]) => {
    const g = ctx.createLinearGradient(w * fx, 0, w * tx, h * 0.8);
    g.addColorStop(0, 'rgba(255,240,210,0.16)');
    g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * fx - 10, roofY + 20);
    ctx.lineTo(w * fx + 10, roofY + 20);
    ctx.lineTo(w * tx + w * 0.16, h * 0.85);
    ctx.lineTo(w * tx - w * 0.16, h * 0.85);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
  // Muret + sol en parquet clair
  const wallY = standBot;
  const wallH = h * 0.04;
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, wallY, w, wallH);
  ctx.fillStyle = '#c94f43';
  ctx.fillRect(0, wallY + wallH - 4, w, 4);
  const top = wallY + wallH;
  ctx.fillStyle = vGrad(ctx, top, h, ['#d8c3a5', '#e4d3ba']);
  ctx.fillRect(0, top, w, h - top);
  ctx.strokeStyle = 'rgba(120,90,60,0.12)';
  ctx.lineWidth = 1;
  for (let i = -14; i <= 14; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * w * 0.04, top);
    ctx.lineTo(w / 2 + i * w * 0.13, h);
    ctx.stroke();
  }
  vignette(ctx, w, h, 0.2);
};

const sceneryPlage = (ctx, w, h) => {
  ctx.fillStyle = vGrad(ctx, 0, h * 0.26, ['#8cc7e6', '#c6e3ee', '#fbe9cf']);
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.25, h * 0.2, 0, w * 0.25, h * 0.2, h * 0.3);
  sun.addColorStop(0, 'rgba(255,240,200,0.95)');
  sun.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h * 0.4);
  cloud(ctx, w * 0.7, h * 0.07, 0.9, 0.85);
  cloud(ctx, w * 0.42, h * 0.12, 0.55, 0.7);
  // Mer
  const seaTop = h * 0.22;
  const seaBot = h * 0.33;
  ctx.fillStyle = vGrad(ctx, seaTop, seaBot, ['#3f9fbf', '#58b8c9', '#86d0d0']);
  ctx.fillRect(0, seaTop, w, seaBot - seaTop);
  const rnd = seeded(41);
  for (let i = 0; i < 70; i += 1) {
    const x = rnd() * w;
    const y = seaTop + 3 + rnd() * (seaBot - seaTop - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x, y, 6 + rnd() * 14, 1.2);
  }
  // Écume
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, seaBot);
  for (let x = 0; x <= w + 30; x += 30) ctx.quadraticCurveTo(x + 15, seaBot + 5 + rnd() * 4, x + 30, seaBot);
  ctx.lineTo(w + 30, seaBot + 8);
  ctx.lineTo(0, seaBot + 8);
  ctx.closePath();
  ctx.fill();
  // Sable mouillé puis sec
  ctx.fillStyle = vGrad(ctx, seaBot + 6, h * 0.4, ['#d9c08e', '#e8d3a5']);
  ctx.fillRect(0, seaBot + 6, w, h * 0.4 - seaBot);
  ctx.fillStyle = vGrad(ctx, h * 0.4, h, ['#efdcb2', '#f3e3bd', '#ead6a8']);
  ctx.fillRect(0, h * 0.4, w, h * 0.6);
  for (let i = 0; i < 260; i += 1) {
    const x = rnd() * w;
    const y = seaBot + 10 + rnd() * (h - seaBot);
    ellipse(ctx, x, y, 0.8 + rnd() * 1.4, 0.6 + rnd(), rnd() < 0.5 ? 'rgba(160,120,70,0.25)' : 'rgba(255,255,255,0.4)');
  }
  for (let i = 0; i < 16; i += 1) {
    const x = rnd() * w;
    const y = h * 0.45 + rnd() * h * 0.55;
    ellipse(ctx, x, y, 4, 3, ['#f6c9b8', '#fbeee0', '#e8b9a0'][i % 3]);
  }
  // Palmiers aux coins
  const palm = (x, y, s, flip) => {
    ctx.strokeStyle = '#8a6a48';
    ctx.lineWidth = 7 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 18 * s * flip, y - 70 * s, x + 6 * s * flip, y - 130 * s);
    ctx.stroke();
    const tx = x + 6 * s * flip;
    const ty = y - 130 * s;
    ctx.fillStyle = '#4f9a5c';
    for (let k = 0; k < 7; k += 1) {
      const a = (k / 7) * Math.PI * 2;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(34 * s, 4 * s, 36 * s, 8 * s, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.lineCap = 'butt';
  };
  palm(w * 0.03, h * 0.5, Math.max(0.6, h / 700), 1);
  palm(w * 0.97, h * 0.46, Math.max(0.5, h / 800), -1);
  vignette(ctx, w, h, 0.16);
};

/* ——————————————————————————— Terrains ——————————————————————————— */

const FIELDS = {
  prairie: {
    shadow: 'rgba(40,70,30,0.25)',
    side: ['#7c7466', '#5f584c'],
    rim: '#c9c1ae',
    stone: ['#d6cfbd', '#c3baa6', '#b8af9a', '#cfc8b6'],
    surface: ['#7fbb63', '#74b35a'],
    band: 'rgba(255,255,255,0.07)',
    grain: ['rgba(40,90,30,0.18)', 'rgba(230,255,200,0.16)'],
    line: 'rgba(255,255,255,0.72)',
    foe: 'rgba(214,92,72,0.16)',
    ally: 'rgba(74,120,214,0.16)',
    emblem: 'rgba(255,255,255,0.2)',
    tileTop: 'rgba(255,255,255,0.07)',
    tileEdge: 'rgba(30,60,25,0.18)',
    tileLine: 'rgba(255,255,255,0.3)',
    border: 'stones'
  },
  montagne: {
    shadow: 'rgba(40,40,50,0.28)',
    side: ['#6b645b', '#4f4a44'],
    rim: '#8c8378',
    stone: ['#9b9286', '#8a8175', '#a8a094', '#7f776c'],
    surface: ['#c2b6a2', '#b5a892'],
    band: 'rgba(255,255,255,0)',
    grain: ['rgba(80,65,50,0.16)', 'rgba(255,255,255,0.16)'],
    line: 'rgba(255,255,255,0.6)',
    foe: 'rgba(200,90,70,0.14)',
    ally: 'rgba(70,110,190,0.14)',
    emblem: 'rgba(255,255,255,0.14)',
    tileTop: 'rgba(255,255,255,0.08)',
    tileEdge: 'rgba(60,50,40,0.22)',
    tileLine: 'rgba(255,255,255,0.32)',
    border: 'rocks',
    slabs: true
  },
  ligue: {
    shadow: 'rgba(40,30,30,0.28)',
    side: ['#2f3650', '#232940'],
    rim: '#f4efe6',
    stone: null,
    surface: ['#5d8fa0', '#4f8193'],
    band: 'rgba(255,255,255,0.05)',
    grain: ['rgba(20,40,60,0.08)', 'rgba(255,255,255,0.06)'],
    line: 'rgba(255,255,255,0.9)',
    foe: 'rgba(214,92,72,0.2)',
    ally: 'rgba(240,200,110,0.16)',
    emblem: 'rgba(255,255,255,0.14)',
    emblemCore: '#c94f43',
    tileTop: 'rgba(255,255,255,0.06)',
    tileEdge: 'rgba(10,25,40,0.25)',
    tileLine: 'rgba(255,255,255,0.28)',
    border: 'clean'
  },
  plage: {
    shadow: 'rgba(120,90,50,0.22)',
    side: ['#9a7650', '#7c5c3c'],
    rim: '#b98d5f',
    stone: ['#c0956a', '#ab8257', '#b88c60', '#a17a50'],
    surface: ['#ecd4a2', '#e3c891'],
    band: 'rgba(255,255,255,0)',
    grain: ['rgba(150,110,60,0.18)', 'rgba(255,255,255,0.35)'],
    line: 'rgba(255,255,255,0.8)',
    foe: 'rgba(224,110,80,0.14)',
    ally: 'rgba(60,150,170,0.16)',
    emblem: 'rgba(255,255,255,0.22)',
    tileTop: 'rgba(255,255,255,0.12)',
    tileEdge: 'rgba(140,100,50,0.2)',
    tileLine: 'rgba(160,120,70,0.32)',
    border: 'planks',
    ripples: true
  }
};

const sceneryFns = { prairie: sceneryPrairie, montagne: sceneryMontagne, ligue: sceneryLigue, plage: sceneryPlage };
const GROUND = { prairie: '#86bd66', montagne: '#a29889', ligue: '#ddc9ad', plage: '#f0dfb5' };
const HORIZON = 0.37;

/**
 * Fond du lieu. `horizon` (px) = où doit tomber la ligne d’horizon (juste derrière le terrain) :
 * le décor est légèrement tassé puis remonté pour rester visible au-dessus du terrain.
 */
export const drawScenery = (ctx, w, h, scene, horizon = h * HORIZON) => {
  const fn = sceneryFns[scene] || sceneryPrairie;
  ctx.fillStyle = GROUND[scene] || GROUND.prairie;
  ctx.fillRect(0, 0, w, h);
  const sy = Math.max(0.62, Math.min(1, horizon / (h * HORIZON)));
  const dy = horizon - h * HORIZON * sy;
  ctx.save();
  ctx.translate(0, dy);
  ctx.scale(1, sy);
  fn(ctx, w, h / sy + Math.max(0, -dy) / sy);
  ctx.restore();
};

/** Pierres / rochers / planches posés tout autour du terrain. */
const drawBorder = (ctx, F, X, Y, W, H, pad) => {
  const rnd = seeded(77);
  const per = [];
  const step = F.border === 'planks' ? 34 : F.border === 'rocks' ? 26 : 22;
  for (let x = X; x < X + W; x += step) per.push([x, Y, 'h'], [x, Y + H - pad, 'h']);
  for (let y = Y + pad; y < Y + H - pad; y += step) per.push([X, y, 'v'], [X + W - pad, y, 'v']);
  per.forEach(([x, y, dir]) => {
    const c = F.stone[Math.floor(rnd() * F.stone.length)];
    const jw = dir === 'h' ? step - 3 : pad;
    const jh = dir === 'h' ? pad : step - 3;
    if (F.border === 'stones') {
      roundRect(ctx, x + 1.5, y + 1.5, jw - 3, jh - 3, 6);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, x + 3, y + 3, (jw - 6) * 0.7, (jh - 6) * 0.4, 4);
      ctx.fill();
    } else if (F.border === 'rocks') {
      ctx.fillStyle = c;
      ctx.beginPath();
      const cx = x + jw / 2;
      const cy = y + jh / 2;
      for (let k = 0; k < 7; k += 1) {
        const a = (k / 7) * Math.PI * 2;
        const rr = Math.min(jw, jh) * (0.42 + rnd() * 0.18);
        const px = cx + Math.cos(a) * rr * (dir === 'h' ? 1.15 : 1);
        const py = cy + Math.sin(a) * rr * (dir === 'v' ? 1.15 : 1);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ellipse(ctx, cx - jw * 0.12, cy - jh * 0.15, jw * 0.18, jh * 0.12, 'rgba(255,255,255,0.16)');
    } else if (F.border === 'planks') {
      roundRect(ctx, x + 1, y + 1, jw - 2, jh - 2, 3);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,25,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (dir === 'h') {
        ctx.moveTo(x + 4, y + jh * 0.45);
        ctx.lineTo(x + jw - 6, y + jh * 0.5);
      } else {
        ctx.moveTo(x + jw * 0.45, y + 4);
        ctx.lineTo(x + jw * 0.5, y + jh - 6);
      }
      ctx.stroke();
      ellipse(ctx, x + jw * 0.5, y + jh * 0.5, 1.6, 1.6, 'rgba(60,40,20,0.45)');
    }
  });
};

/** Terrain (bordure + surface) en espace monde. gridW/gridH : taille de la grille, midY : ligne médiane. */
export const drawField = (ctx, gridW, gridH, scene, SIZE) => {
  const F = FIELDS[scene] || FIELDS.prairie;
  const pad = 44;
  const X = -pad;
  const Y = -pad;
  const W = gridW + pad * 2;
  const H = gridH + pad * 2;
  const midY = gridH / 2 + SIZE * 0.25;
  const inner = 22;

  // Ombre douce et tranche (épaisseur du terrain)
  roundRect(ctx, X - 6, Y + 26, W + 12, H + 16, 30);
  ctx.fillStyle = F.shadow;
  ctx.fill();
  roundRect(ctx, X, Y + 18, W, H, 24);
  ctx.fillStyle = vGrad(ctx, Y + H - 40, Y + H + 18, F.side);
  ctx.fill();

  // Bordure
  roundRect(ctx, X, Y, W, H, 24);
  ctx.fillStyle = F.rim;
  ctx.fill();
  if (F.stone) {
    ctx.save();
    roundRect(ctx, X, Y, W, H, 24);
    ctx.clip();
    drawBorder(ctx, F, X, Y, W, H, inner);
    ctx.restore();
  }

  // Surface
  const sx = X + inner;
  const sy = Y + inner;
  const sw = W - inner * 2;
  const sh = H - inner * 2;
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, 12);
  ctx.clip();
  ctx.fillStyle = vGrad(ctx, sy, sy + sh, F.surface);
  ctx.fillRect(sx, sy, sw, sh);
  // Tonte en damier diagonal / bandes
  if (F.band !== 'rgba(255,255,255,0)') {
    ctx.fillStyle = F.band;
    for (let i = -10; i < 20; i += 2) {
      ctx.beginPath();
      ctx.moveTo(sx + i * 60, sy);
      ctx.lineTo(sx + i * 60 + 60, sy);
      ctx.lineTo(sx + i * 60 + 60 - sh * 0.5, sy + sh);
      ctx.lineTo(sx + i * 60 - sh * 0.5, sy + sh);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Dalles irrégulières (montagne)
  if (F.slabs) {
    const r = seeded(5);
    ctx.strokeStyle = 'rgba(90,75,60,0.28)';
    ctx.lineWidth = 2;
    for (let yy = sy; yy < sy + sh; yy += 70) {
      ctx.beginPath();
      ctx.moveTo(sx, yy + r() * 10);
      for (let xx = sx; xx < sx + sw + 60; xx += 60) ctx.lineTo(xx, yy + r() * 14);
      ctx.stroke();
      for (let xx = sx + r() * 60; xx < sx + sw; xx += 80 + r() * 60) {
        ctx.beginPath();
        ctx.moveTo(xx, yy + 6);
        ctx.lineTo(xx + (r() - 0.5) * 16, yy + 70);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 18; i += 1) ellipse(ctx, sx + r() * sw, sy + r() * sh, 18 + r() * 30, 8 + r() * 14, 'rgba(110,150,90,0.18)');
  }
  // Ondulations du sable (plage)
  if (F.ripples) {
    const r = seeded(9);
    ctx.lineWidth = 2;
    for (let yy = sy + 12; yy < sy + sh; yy += 22) {
      ctx.strokeStyle = r() < 0.5 ? 'rgba(170,130,80,0.18)' : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(sx, yy);
      for (let xx = sx; xx < sx + sw + 40; xx += 40) ctx.quadraticCurveTo(xx + 20, yy + (r() - 0.5) * 12, xx + 40, yy);
      ctx.stroke();
    }
  }
  // Grain
  const g = seeded(29);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = F.grain[i % 2];
    ctx.fillRect(sx + g() * sw, sy + g() * sh, 1.5 + g() * 2.5, 1.5 + g() * 2.5);
  }
  // Camps : teinte qui se fond depuis chaque bout du terrain
  const foe = ctx.createLinearGradient(0, sy, 0, midY);
  foe.addColorStop(0, F.foe);
  foe.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = foe;
  ctx.fillRect(sx, sy, sw, midY - sy);
  const ally = ctx.createLinearGradient(0, sy + sh, 0, midY);
  ally.addColorStop(0, F.ally);
  ally.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ally;
  ctx.fillRect(sx, midY, sw, sy + sh - midY);
  // Lumière au centre
  const light = ctx.createRadialGradient(gridW / 2, midY, 0, gridW / 2, midY, sw * 0.6);
  light.addColorStop(0, 'rgba(255,255,255,0.14)');
  light.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = light;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.restore();

  // Lignes
  ctx.strokeStyle = F.line;
  ctx.lineWidth = 3;
  roundRect(ctx, sx + 10, sy + 10, sw - 20, sh - 20, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + 10, midY);
  ctx.lineTo(sx + sw - 10, midY);
  ctx.stroke();
  const cx = gridW / 2;
  const R = SIZE * 1.2;
  ctx.fillStyle = F.emblem;
  ctx.beginPath();
  ctx.arc(cx, midY, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = F.line;
  ctx.fill();
  if (F.emblemCore) {
    ctx.beginPath();
    ctx.arc(cx, midY, SIZE * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = F.emblemCore;
    ctx.fill();
  }
};

/** Case hexagonale « en relief » : tranche légère + dessus éclairci. */
export const drawTile = (ctx, cx, cy, scene, SIZE, hexPath) => {
  const F = FIELDS[scene] || FIELDS.prairie;
  const r = SIZE - 5;
  hexPath(ctx, cx, cy + 5, r);
  ctx.fillStyle = F.tileEdge;
  ctx.fill();
  hexPath(ctx, cx, cy, r);
  ctx.fillStyle = F.tileTop;
  ctx.fill();
  ctx.strokeStyle = F.tileLine;
  ctx.lineWidth = 1.8;
  ctx.stroke();
};
