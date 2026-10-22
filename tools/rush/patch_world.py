p='swarmWorld.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

rep("""/* ——— Décors (dessinés une fois, à demi-résolution) ——— */
const makeTree = (rng, kind = 'oak', dark = false) => {
  const c = canvas(46, 54);
  const x = c.getContext('2d');
  const pal = dark
    ? ['#173d22', '#21572c', '#2c6e35', '#3b8540']
    : kind === 'autumn' ? ['#6b2f17', '#a24a1c', '#cf6d22', '#f0a23a'] : ['#1f4f26', '#2f7a33', '#46a03c', '#77c44f'];""",
"""/* ——— Décors (dessinés une fois, à demi-résolution) ——— */
const TREE_PALS = {
  oak: ['#1f4f26', '#2f7a33', '#46a03c', '#77c44f'],
  dark: ['#173d22', '#21572c', '#2c6e35', '#3b8540'],
  autumn: ['#6b2f17', '#a24a1c', '#cf6d22', '#f0a23a'],
  gold: ['#6b4a12', '#a2781c', '#cfa422', '#f0d23a'],
  snow: ['#1f3f36', '#2f5a4a', '#e2ebf3', '#ffffff'],
  swamp: ['#11241b', '#1b3426', '#28452f', '#4a6a3a']
};

/* ——— Décors : les biomes (une carte = un biome tiré au sort) ——— */
export const BIOMES = {
  prairie: {
    name: 'Prairie', ground: ['#4b9a3b', '#5fae45', '#79c254', '#8ccf5d'], dirt: 'rgba(160,110,70,.35)',
    tuft: ['#3f8a32', '#9fdc6a'], tall: ['#2f7a2c', '#56a83d'], flowers: ['#ffffff', '#ffd23a', '#ff8fb1', '#ff5a5a', '#b48cff'], flowerHeart: '#ffe680', flowerCount: 260,
    path: ['#a77b4f', '#cfa66f', '#b58c5c', '#e0bd88'], bank: '#cdb37a', shore: '#7b9b4f', water: ['#2f6fb3', '#3b86cf', '#2a64a6'], foam: 'rgba(190,230,255,.7)', lily: '#3f9a3a',
    trees: [['oak', 0.7], ['pine', 0.18], ['autumn', 0.12]], rim: ['darkOak', 'darkOak', 'darkPine'], bush: ['#2a6a2c', '#3f9238', '#6cc04a', '#e8433c'],
    outside: '#163a1e', mini: { grass: [111, 184, 76], wall: [31, 79, 38], path: [207, 166, 111], water: [59, 134, 207] }, ambient: null
  },
  automne: {
    name: 'Bois d’automne', ground: ['#7a6a2c', '#8c7a34', '#a08a3c', '#b39a48'], dirt: 'rgba(120,70,30,.35)',
    tuft: ['#6a5a24', '#c9a24a'], tall: ['#5a4a1c', '#8a7a34'], flowers: ['#e07a2a', '#c9502a', '#f0a23a', '#a83a1a', '#f0c24a'], flowerHeart: '#ffe0a0', flowerCount: 520,
    path: ['#8a5a32', '#b88a52', '#9a6a3c', '#d0a46c'], bank: '#b89a62', shore: '#7a7a3a', water: ['#2f5f8f', '#3a74a6', '#2a5480'], foam: 'rgba(200,220,240,.6)', lily: '#7a8a3a',
    trees: [['autumn', 0.5], ['gold', 0.3], ['oak', 0.2]], rim: ['autumnDark', 'autumnDark', 'darkPine'], bush: ['#6a3a14', '#a25a1c', '#e09a3a', '#ffd23a'],
    outside: '#2a1a0e', mini: { grass: [168, 140, 66], wall: [90, 50, 20], path: [190, 140, 90], water: [58, 116, 166] }, ambient: 'rgba(255,140,40,.06)'
  },
  neige: {
    name: 'Plaine enneigée', ground: ['#b9c8d8', '#cbd8e5', '#dbe5ef', '#eaf1f8'], dirt: 'rgba(150,170,200,.25)',
    tuft: ['#a7b8ca', '#ffffff'], tall: ['#9fb2c6', '#f4f8fc'], flowers: ['#9fd8ff', '#ffffff', '#c8e8ff'], flowerHeart: '#ffffff', flowerCount: 120,
    path: ['#8a9aac', '#aebccb', '#9aaabb', '#c8d4e0'], bank: '#a8b8c8', shore: '#d8e4ee', water: ['#5f8fbf', '#7aa6d0', '#5280b0'], foam: 'rgba(240,250,255,.85)', lily: null,
    trees: [['snowPine', 0.75], ['dead', 0.25]], rim: ['snowPineDark', 'snowPineDark', 'snowPineDark'], bush: ['#4a6a6a', '#6a8a8a', '#f4f8fc', '#9fd8ff'],
    outside: '#26364a', mini: { grass: [214, 226, 238], wall: [60, 90, 90], path: [160, 176, 192], water: [100, 150, 200] }, ambient: 'rgba(120,170,255,.05)'
  },
  desert: {
    name: 'Canyon aride', ground: ['#c99a5a', '#d6aa6a', '#e0ba7a', '#eac88c'], dirt: 'rgba(170,100,50,.3)',
    tuft: ['#a8823e', '#c8a858'], tall: ['#8a7a3a', '#a89a4a'], flowers: ['#ff6a8a', '#ffd23a', '#ff9a3a'], flowerHeart: '#fff2a0', flowerCount: 90,
    path: ['#9a6a3a', '#b8824e', '#a87444', '#cf9a62'], bank: '#d8c088', shore: '#7a9a4a', water: ['#2f8fb3', '#3ba6cf', '#2a7aa6'], foam: 'rgba(210,245,255,.75)', lily: '#4a8a3a',
    trees: [['cactus', 0.55], ['palm', 0.25], ['dead', 0.2]], rim: ['mesa', 'mesa', 'cactus'], bush: ['#6a7a3a', '#8a9a4a', '#b0ba60', '#ff6a8a'],
    outside: '#5a3418', mini: { grass: [222, 184, 122], wall: [120, 70, 36], path: [184, 130, 78], water: [59, 166, 207] }, ambient: 'rgba(255,170,80,.05)'
  },
  marais: {
    name: 'Marais brumeux', ground: ['#2c4a38', '#355642', '#3f624c', '#4a6e56'], dirt: 'rgba(30,40,30,.35)',
    tuft: ['#24402f', '#5a8a5a'], tall: ['#1a3424', '#46744a'], flowers: ['#9fe6ff', '#c8a8ff', '#7fffb0'], flowerHeart: '#ffffff', flowerCount: 180,
    path: ['#3a2e20', '#5a4630', '#4a3a28', '#6a563c'], bank: '#4a4a30', shore: '#2f4a32', water: ['#1f4a44', '#2a6058', '#1a3e3a'], foam: 'rgba(170,230,210,.5)', lily: '#4a8a4a',
    trees: [['swamp', 0.6], ['dead', 0.25], ['darkPine', 0.15]], rim: ['swampDark', 'swampDark', 'darkPine'], bush: ['#18301f', '#28462e', '#4a7a4a', '#c8a8ff'],
    outside: '#0c1a14', mini: { grass: [60, 98, 76], wall: [16, 34, 24], path: [90, 70, 48], water: [42, 96, 88] }, ambient: 'rgba(20,40,60,.18)'
  }
};
export const BIOME_IDS = Object.keys(BIOMES);

const makeCactus = (rng) => {
  const c = canvas(28, 46);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(14, 43, 9, 3, 0, 0, TAU); x.fill();
  const col = (cx, y0, y1, w) => {
    x.fillStyle = '#2f6a2a'; x.fillRect(cx - w / 2, y0, w, y1 - y0);
    x.fillStyle = '#4a9a3a'; x.fillRect(cx - w / 2 + 1, y0 + 1, w - 3, y1 - y0 - 1);
    x.fillStyle = '#7ac85a'; x.fillRect(cx - w / 2 + 2, y0 + 2, 1, y1 - y0 - 4);
  };
  col(14, 6, 43, 8);
  if (rng() < 0.8) { col(6, 14, 26, 5); x.fillStyle = '#2f6a2a'; x.fillRect(6, 24, 6, 4); }
  if (rng() < 0.8) { col(22, 10, 22, 5); x.fillStyle = '#2f6a2a'; x.fillRect(17, 20, 6, 4); }
  if (rng() < 0.5) { x.fillStyle = '#ff6a8a'; x.fillRect(12, 4, 4, 3); }
  return crisp(c);
};
const makePalm = (rng) => {
  const c = canvas(46, 56);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(23, 52, 12, 3.5, 0, 0, TAU); x.fill();
  for (let i = 0; i < 9; i += 1) { x.fillStyle = i % 2 ? '#8a5a2a' : '#a8743a'; x.fillRect(21 + Math.round(Math.sin(i / 3) * 2), 18 + i * 4, 5, 4); }
  const frond = (a, len) => {
    x.strokeStyle = '#2f7a33'; x.lineWidth = 4; x.beginPath(); x.moveTo(23, 16); x.quadraticCurveTo(23 + Math.cos(a) * len * 0.6, 10 + Math.sin(a) * len * 0.3, 23 + Math.cos(a) * len, 16 + Math.sin(a) * len * 0.5 + 6); x.stroke();
    x.strokeStyle = '#5fae45'; x.lineWidth = 2; x.beginPath(); x.moveTo(23, 15); x.quadraticCurveTo(23 + Math.cos(a) * len * 0.6, 9 + Math.sin(a) * len * 0.3, 23 + Math.cos(a) * len, 15 + Math.sin(a) * len * 0.5 + 6); x.stroke();
  };
  [-2.8, -2.2, -1.6, -1.0, -0.4, 0.2].forEach((a) => frond(a, 16 + rng() * 5));
  circle(x, 21, 18, 2, '#6b3d20'); circle(x, 25, 19, 2, '#6b3d20');
  return crisp(c);
};
const makeDeadTree = (rng, snow = false) => {
  const c = canvas(40, 50);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 47, 11, 3, 0, 0, TAU); x.fill();
  x.strokeStyle = '#4a3020'; x.lineCap = 'round';
  const branch = (x0, y0, a, len, w) => {
    if (len < 4) return;
    const x1 = x0 + Math.cos(a) * len; const y1 = y0 + Math.sin(a) * len;
    x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    if (snow && w < 3) { x.fillStyle = '#ffffff'; x.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 2, 1); }
    branch(x1, y1, a - 0.5 - rng() * 0.3, len * 0.66, Math.max(1, w - 1.4));
    branch(x1, y1, a + 0.5 + rng() * 0.3, len * 0.62, Math.max(1, w - 1.4));
  };
  branch(20, 47, -Math.PI / 2, 15, 5);
  return crisp(c);
};
const makeMesa = (rng) => {
  const c = canvas(56, 52);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(28, 48, 25, 4, 0, 0, TAU); x.fill();
  x.fillStyle = '#8a4a26'; x.beginPath(); x.moveTo(4, 48); x.lineTo(9, 10); x.lineTo(20, 4); x.lineTo(38, 6); x.lineTo(50, 14); x.lineTo(53, 48); x.fill();
  x.fillStyle = '#b0623a'; x.beginPath(); x.moveTo(8, 46); x.lineTo(12, 12); x.lineTo(21, 7); x.lineTo(36, 9); x.lineTo(47, 16); x.lineTo(48, 46); x.fill();
  for (let y = 16; y < 46; y += 7) { x.fillStyle = y % 14 ? '#c8784a' : '#9a5230'; x.fillRect(10, y, 37, 2); }
  x.fillStyle = '#d89a62'; x.fillRect(14, 9, 18, 2);
  if (rng() < 0.4) { x.fillStyle = '#7a9a4a'; x.fillRect(16, 7, 4, 2); }
  return crisp(c);
};

const makeTree = (rng, kind = 'oak', dark = false, palName = null) => {
  const c = canvas(46, 54);
  const x = c.getContext('2d');
  const pal = TREE_PALS[palName || (dark ? 'dark' : kind === 'autumn' ? 'autumn' : 'oak')];""")
rep("""const makeBush = (rng) => {
  const c = canvas(24, 16);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(12, 13, 10, 3, 0, 0, TAU); x.fill();
  [[7, 9, 6], [16, 9, 6], [12, 6, 6]].forEach(([bx, by, r]) => circle(x, bx, by, r, '#2a6a2c'));
  [[7, 8, 5], [16, 8, 5], [12, 5, 5]].forEach(([bx, by, r]) => circle(x, bx, by, r, '#3f9238'));
  for (let i = 0; i < 6; i += 1) { x.fillStyle = '#6cc04a'; x.fillRect(4 + Math.floor(rng() * 15), 3 + Math.floor(rng() * 6), 2, 1); }
  if (rng() < 0.45) for (let i = 0; i < 3; i += 1) { x.fillStyle = '#e8433c'; x.fillRect(5 + Math.floor(rng() * 13), 4 + Math.floor(rng() * 6), 2, 2); }""",
"""const makeBush = (rng, pal = ['#2a6a2c', '#3f9238', '#6cc04a', '#e8433c']) => {
  const c = canvas(24, 16);
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(12, 13, 10, 3, 0, 0, TAU); x.fill();
  [[7, 9, 6], [16, 9, 6], [12, 6, 6]].forEach(([bx, by, r]) => circle(x, bx, by, r, pal[0]));
  [[7, 8, 5], [16, 8, 5], [12, 5, 5]].forEach(([bx, by, r]) => circle(x, bx, by, r, pal[1]));
  for (let i = 0; i < 6; i += 1) { x.fillStyle = pal[2]; x.fillRect(4 + Math.floor(rng() * 15), 3 + Math.floor(rng() * 6), 2, 1); }
  if (rng() < 0.45) for (let i = 0; i < 3; i += 1) { x.fillStyle = pal[3]; x.fillRect(5 + Math.floor(rng() * 13), 4 + Math.floor(rng() * 6), 2, 2); }""")

rep("""export const buildWorld = (seed = Math.floor(Math.random() * 1e9)) => {
  const rng = mulberry32(seed);
  const { w: W, h: H, border: B } = WORLD;
""","""export const buildWorld = (seed = Math.floor(Math.random() * 1e9), biomeId = null, opts = {}) => {
  const rng = mulberry32(seed);
  const { w: W, h: H, border: B } = WORLD;
  const biome = BIOMES[biomeId] || BIOMES[BIOME_IDS[Math.floor(rng() * BIOME_IDS.length)]];
  const BIOME_ID = Object.keys(BIOMES).find((k) => BIOMES[k] === biome);
  // Disposition : la carte peut être retournée, et les lieux échangent leurs places
  const flipX = rng() < 0.5; const flipY = rng() < 0.5;
  const fx = (x) => (flipX ? W - x : x);
  const fy = (y) => (flipY ? H - y : y);
""")
rep("""  const ctrl = [[-200, 300], [900, 600], [1700, 860], [2500, 1150], [3200, 1500], [3800, 1840], [4600, 2180]];""",
"""  const ctrl = [[-200, 300], [900, 600], [1700, 860], [2500, 1150], [3200, 1500], [3800, 1840], [4600, 2180]]
    .map(([x, y]) => [fx(x), fy(y)])
    .sort((a, b) => a[0] - b[0]);""")
rep("""  const plaza = { x: 2200, y: 1720, r: 230 };
  const pond = { x: 900, y: 2480, r: 170 };
  const ruins = { x: 3430, y: 2560 };
  const henge = { x: 3500, y: 880 };
  const garden = { x: 820, y: 1500 };""","""  const plaza = { x: fx(2200), y: fy(1720), r: 230 };
  const slots = [[900, 2480], [3430, 2560], [3500, 880], [820, 1500]].map(([x, y]) => ({ x: fx(x), y: fy(y) }));
  for (let i = slots.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const pond = { ...slots[0], r: 150 + Math.floor(rng() * 50) };
  const ruins = slots[1];
  const henge = slots[2];
  const garden = slots[3];""")
# sprites
rep("""  const sprites = {
    oak: Array.from({ length: 4 }, () => makeTree(rng, 'oak')),
    autumn: Array.from({ length: 2 }, () => makeTree(rng, 'autumn')),
    pine: Array.from({ length: 2 }, () => makeTree(rng, 'pine')),
    darkOak: Array.from({ length: 3 }, () => makeTree(rng, 'oak', true)),
    darkPine: Array.from({ length: 2 }, () => makeTree(rng, 'pine', true)),
    bush: Array.from({ length: 4 }, () => makeBush(rng)),""","""  const need = new Set([...biome.trees.map(([k]) => k), ...biome.rim]);
  const many = (key, n, make) => (need.has(key) ? Array.from({ length: n }, make) : []);
  const sprites = {
    oak: many('oak', 4, () => makeTree(rng, 'oak')),
    autumn: many('autumn', 3, () => makeTree(rng, 'oak', false, 'autumn')),
    gold: many('gold', 3, () => makeTree(rng, 'oak', false, 'gold')),
    autumnDark: many('autumnDark', 3, () => makeTree(rng, 'oak', false, 'autumn')),
    pine: many('pine', 2, () => makeTree(rng, 'pine')),
    darkOak: many('darkOak', 3, () => makeTree(rng, 'oak', true)),
    darkPine: many('darkPine', 2, () => makeTree(rng, 'pine', true)),
    snowPine: many('snowPine', 3, () => makeTree(rng, 'pine', false, 'snow')),
    snowPineDark: many('snowPineDark', 3, () => makeTree(rng, 'pine', false, 'snow')),
    swamp: many('swamp', 3, () => makeTree(rng, 'oak', false, 'swamp')),
    swampDark: many('swampDark', 3, () => makeTree(rng, 'oak', false, 'swamp')),
    dead: many('dead', 3, () => makeDeadTree(rng, BIOME_ID === 'neige')),
    cactus: many('cactus', 3, () => makeCactus(rng)),
    palm: many('palm', 2, () => makePalm(rng)),
    mesa: many('mesa', 3, () => makeMesa(rng)),
    bush: Array.from({ length: 4 }, () => makeBush(rng, biome.bush)),""")
rep("""  const rim = (x, y) => sprProp(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 24, rng() < 0.3 ? pickOf(sprites.darkPine) : pickOf(sprites.darkOak), 0, { rim: true });""",
"""  const rim = (x, y) => sprProp(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 24, pickOf(sprites[pickOf(biome.rim)]), 0, { rim: true });""")
rep("""  const statues = [
    { x: garden.x - 90, y: garden.y, dex: 150 },
    { x: garden.x + 90, y: garden.y, dex: 143 },
    { x: ruins.x, y: ruins.y - 10, dex: 95 }
  ];""","""  const statueDex = opts.statues || [150, 143, 95];
  const statues = [
    { x: garden.x - 90, y: garden.y, dex: statueDex[0] },
    { x: garden.x + 90, y: garden.y, dex: statueDex[1] },
    { x: ruins.x, y: ruins.y - 10, dex: statueDex[2] }
  ];""")
rep("""    const kind = rng();
    sprProp(x, y, kind < 0.12 ? pickOf(sprites.autumn) : kind < 0.3 ? pickOf(sprites.pine) : pickOf(sprites.oak), 15, { space: 34 });""",
"""    let kind = rng(); let key = biome.trees[0][0];
    for (const [k, w] of biome.trees) { if (kind < w) { key = k; break; } kind -= w; }
    sprProp(x, y, pickOf(sprites[key]), key === 'cactus' ? 10 : 15, { space: 34 });""")
rep("""  const G1 = hex('#5fae45'); const G2 = hex('#79c254'); const G3 = hex('#8ccf5d'); const G0 = hex('#4b9a3b');""",
"""  const [G0, G1, G2, G3] = biome.ground.map(hex);""")
rep("""    g.fillStyle = 'rgba(160,110,70,.35)';""","""    g.fillStyle = biome.dirt;""")
rep("""    g.fillStyle = rng() < 0.5 ? '#3f8a32' : '#9fdc6a';""","""    g.fillStyle = rng() < 0.5 ? biome.tuft[0] : biome.tuft[1];""")
rep("""      g.fillStyle = '#2f7a2c'; g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 1, 1, 3);
      g.fillStyle = '#56a83d'; g.fillRect(x + 2, y, 1, 3);""","""      g.fillStyle = biome.tall[0]; g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 1, 1, 3);
      g.fillStyle = biome.tall[1]; g.fillRect(x + 2, y, 1, 3);""")
rep("""  const FLOWERS = ['#ffffff', '#ffd23a', '#ff8fb1', '#ff5a5a', '#b48cff'];
  for (let i = 0; i < 260; i += 1) {""","""  const FLOWERS = biome.flowers;
  for (let i = 0; i < biome.flowerCount; i += 1) {""")
rep("""      g.fillStyle = '#ffe680'; g.fillRect(x, y, 1, 1);""","""      g.fillStyle = biome.flowerHeart; g.fillRect(x, y, 1, 1);""")
rep("""  paths.forEach((p) => strokePoly(p, A(pathW * 2 + 8), '#a77b4f'));
  paths.forEach((p) => strokePoly(p, A(pathW * 2), '#cfa66f'));""","""  paths.forEach((p) => strokePoly(p, A(pathW * 2 + 8), biome.path[0]));
  paths.forEach((p) => strokePoly(p, A(pathW * 2), biome.path[1]));""")
rep("""      if (rng() < 0.6) { g.fillStyle = rng() < 0.5 ? '#b58c5c' : '#e0bd88';""","""      if (rng() < 0.6) { g.fillStyle = rng() < 0.5 ? biome.path[2] : biome.path[3];""")
rep("""  strokePoly(river, A(riverHW * 2 + 30), '#cdb37a');
  strokePoly(river, A(riverHW * 2 + 14), '#7b9b4f');
  strokePoly(river, A(riverHW * 2 + 4), '#2f6fb3');
  strokePoly(river, A(riverHW * 2 - 14), '#3b86cf');
  strokePoly(river, A(riverHW * 0.9), '#2a64a6');""","""  strokePoly(river, A(riverHW * 2 + 30), biome.bank);
  strokePoly(river, A(riverHW * 2 + 14), biome.shore);
  strokePoly(river, A(riverHW * 2 + 4), biome.water[0]);
  strokePoly(river, A(riverHW * 2 - 14), biome.water[1]);
  strokePoly(river, A(riverHW * 0.9), biome.water[2]);""")
rep("""      g.fillStyle = 'rgba(190,230,255,.7)';""","""      g.fillStyle = biome.foam;""")
rep("""  g.fillStyle = '#cdb37a'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 16), A(pond.r + 12), 0, 0, TAU); g.fill();
  g.fillStyle = '#2f6fb3'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 2), A(pond.r - 2), 0, 0, TAU); g.fill();
  g.fillStyle = '#3b86cf'; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r - 14), A(pond.r - 18), 0, 0, TAU); g.fill();
  for (let i = 0; i < 9; i += 1) {""","""  g.fillStyle = biome.bank; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 16), A(pond.r + 12), 0, 0, TAU); g.fill();
  g.fillStyle = biome.water[0]; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r + 2), A(pond.r - 2), 0, 0, TAU); g.fill();
  g.fillStyle = biome.water[1]; g.beginPath(); g.ellipse(A(pond.x), A(pond.y), A(pond.r - 14), A(pond.r - 18), 0, 0, TAU); g.fill();
  for (let i = 0; i < (biome.lily ? 9 : 0); i += 1) {""")
rep("""    g.fillStyle = '#3f9a3a'; g.beginPath(); g.arc(x, y, 5, 0.4, TAU - 0.4); g.lineTo(x, y); g.fill();""","""    g.fillStyle = biome.lily; g.beginPath(); g.arc(x, y, 5, 0.4, TAU - 0.4); g.lineTo(x, y); g.fill();""")
rep("""      const col = t === TILE.WATER ? [59, 134, 207] : t === TILE.WALL ? [31, 79, 38] : t === TILE.BRIDGE ? [185, 128, 73]
        : isPath(x * MS, y * MS) ? [207, 166, 111] : [111, 184, 76];""","""      const col = t === TILE.WATER ? biome.mini.water : t === TILE.WALL ? biome.mini.wall : t === TILE.BRIDGE ? [185, 128, 73]
        : isPath(x * MS, y * MS) ? biome.mini.path : biome.mini.grass;""")
rep("""    ctx.fillStyle = '#163a1e';
    ctx.fillRect(vx, vy, vw, vh);""","""    ctx.fillStyle = biome.outside;
    ctx.fillRect(vx, vy, vw, vh);""")
rep("""  return {
    W, H, B, start, plaza,""","""  return {
    biome: BIOME_ID, biomeName: biome.name, ambient: biome.ambient, seed,
    W, H, B, start, plaza,""")
open(p,'w').write(s)
print('ok')
