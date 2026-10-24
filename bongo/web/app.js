/* Bongo Stream : le personnage, les touches et la souris réagissent aux événements envoyés par l'appli. */
(() => {
  const W = 800;
  const H = 500;
  const params = new URLSearchParams(location.search);
  const SETTINGS = params.has('settings');
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const NS = 'http://www.w3.org/2000/svg';
  let cfg = { keys: ['Q', 'W', 'E', 'R'], bigFirst: 1.35, mouseRange: 1, background: 'transparent', scale: 1, skin: [] };
  const state = { down: [false, false, false, false], last: -1, lastAt: 0, mx: 0.5, my: 0.5, sx: 0.5, sy: 0.5, click: false };

  /* ——— Placement des touches ——— */
  const keyRects = () => {
    const base = 62;
    const big = base * cfg.bigFirst;
    const gap = 10;
    const out = [];
    let x = state.is3d ? 205 : 120;
    cfg.keys.forEach((k, i) => {
      const w = i === 0 ? big : base;
      out.push({ x, y: 372 - (i === 0 ? (big - base) / 2 : 0), w, h: w * 0.82, label: k });
      x += w + gap;
    });
    return out;
  };

  /* ——— Dessin par défaut (personnage original) ——— */
  const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="${NS}">${inner}</svg>`;
  // Style « dessin au trait » : aplats blancs, trait noir épais, personnage qui dépasse derrière le bord de la table.
  const INK = '#111';
  const DEFAULT_BODY = svg(W, H, `
    <path d="M372 132 C360 104 372 82 398 78 C394 100 388 116 372 132 Z" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M404 128 C420 102 446 98 462 112 C444 122 426 130 404 128 Z" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M236 340 C236 250 300 150 400 140 C500 150 566 250 566 340 Z" fill="#fff" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="350" cy="262" r="9" fill="${INK}"/><circle cx="452" cy="262" r="9" fill="${INK}"/>
    <path d="M388 282 Q401 296 414 282" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="322" cy="290" rx="16" ry="8" fill="#ffc9d6"/><ellipse cx="480" cy="290" rx="16" ry="8" fill="#ffc9d6"/>`);
  const DEFAULT_DESK = svg(W, H, `
    <rect x="-60" y="330" width="920" height="260" fill="#fff"/>
    <line x1="-60" y1="330" x2="860" y2="330" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`);
  const DEFAULT_MOUSE = svg(120, 140, `
    <rect x="26" y="14" width="68" height="104" rx="34" fill="#fff" stroke="${INK}" stroke-width="7"/>
    <line x1="60" y1="16" x2="60" y2="56" stroke="${INK}" stroke-width="6"/>`);

  /* ——— Couches perso (dossier « skin ») ——— */
  const has = (name) => cfg.skin.find((f) => f.replace(/\.(png|gif|webp|svg)$/i, '').toLowerCase() === name);
  const img = (file) => `<img src="/skin/${encodeURIComponent(file)}?v=${Date.now()}" alt="" draggable="false">`;
  const setLayer = (id, name, fallback) => { const f = has(name); $(id).innerHTML = f ? img(f) : fallback; };

  const build = () => {
    stage.style.setProperty('--scale', cfg.scale || 1);
    stage.style.setProperty('--tilt', `${cfg.tilt ?? 7}deg`);
    document.body.dataset.bg = cfg.background === 'green' ? 'green' : cfg.background === 'transparent' ? 'transparent' : 'color';
    if (cfg.background && cfg.background.startsWith('#')) document.body.style.setProperty('--bg', cfg.background);
    // Modèle 3D (.glb) : il remplace le personnage et ses mains
    const glb = cfg.skin.find((f) => /\.glb$/i.test(f));
    state.is3d = Boolean(glb) && !state.glbFailed;
    $('m3d-under').hidden = !glb;
    $('m3d-over').hidden = !glb;
    if (glb && state.glb !== glb) {
      state.glb = glb;
      import('./three3d.js')
        .then((m) => m.start({ url: `/skin/${encodeURIComponent(glb)}`, under: $('m3d-under'), over: $('m3d-over') }))
        .then((h) => { state.m3d = h; state.m3dStatus = `Modèle 3D chargé : ${glb}${h.info.hasArms ? '' : ' (bras introuvables : il ne bougera pas les mains)'}`; showStatus(); })
        .catch((e) => { console.error('Modèle 3D illisible', e); state.glbFailed = true; state.m3dStatus = `Modèle 3D illisible (${glb}) : ${e.message || e}`; showStatus(); build(); });
      state.m3dStatus = `Chargement du modèle 3D ${glb}…`;
      showStatus();
    }
    setLayer('body', 'body', state.is3d ? '' : DEFAULT_BODY);
    setLayer('desk', 'desk', DEFAULT_DESK);
    // touches
    const box = $('keys');
    box.innerHTML = '';
    box.hidden = Boolean(has('keys'));
    if (has('keys')) { $('desk').insertAdjacentHTML('beforeend', `<div class="layer">${img(has('keys'))}</div>`); }
    keyRects().forEach((r, i) => {
      const k = document.createElement('div');
      k.className = `key${i === 0 ? ' is-big' : ''}`;
      Object.assign(k.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, fontSize: `${r.h * 0.48}px` });
      k.textContent = r.label;
      box.appendChild(k);
    });
    // souris + main droite
    const mh = has('mouse-hand');
    $('mouse').innerHTML = mh ? '' : DEFAULT_MOUSE;
    $('hand-mouse').innerHTML = mh ? img(mh) : '';
    $('hand-mouse').classList.toggle('is-skin', Boolean(mh));
    render(true);
  };

  const showStatus = () => { const el = document.getElementById('m3d-status'); if (el) el.textContent = state.m3dStatus || 'Aucun modèle 3D (.glb) dans le dossier.'; };

  /* ——— Bras dessinés (mode par défaut) ——— */
  const arm = (from, to, raised) => {
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - (raised ? 50 : 24) };
    return `<path d="M${from.x} ${from.y} Q${mid.x} ${mid.y} ${to.x} ${to.y}" fill="none" stroke="${INK}" stroke-width="46" stroke-linecap="round"/>
      <path d="M${from.x} ${from.y} Q${mid.x} ${mid.y} ${to.x} ${to.y}" fill="none" stroke="#fff" stroke-width="32" stroke-linecap="round"/>
      <ellipse cx="${to.x}" cy="${to.y}" rx="${raised ? 27 : 30}" ry="${raised ? 25 : 21}" fill="#fff" stroke="${INK}" stroke-width="7"/>`;
  };
  const SHOULDER_L = { x: 268, y: 300 };
  const SHOULDER_R = { x: 534, y: 300 };
  const MOUSE_HOME = { x: 620, y: 384 };

  const render = (force) => {
    const keys = keyRects();
    // touche enfoncée affichée : la dernière pressée, encore tenue (ou relâchée il y a moins de 70 ms)
    let active = -1;
    if (state.last >= 0 && (state.down[state.last] || Date.now() - state.lastAt < 70)) active = state.last;
    else active = state.down.findIndex(Boolean);
    document.querySelectorAll('.key').forEach((k, i) => k.classList.toggle('is-down', state.down[i] || i === active));

    // main gauche sur les touches
    const f = active >= 0 ? (has(`hand-${active + 1}`) || has(`hand-${cfg.keys[active]?.toLowerCase()}`)) : has('hand-up');
    const hk = $('hand-keys');
    if (state.is3d) {
      hk.innerHTML = '';
      const r = active >= 0 ? keys[active] : null;
      const left = r ? { x: r.x + r.w / 2, y: r.y + r.h * 0.3 } : { x: 230, y: 300 };
      const range = cfg.mouseRange || 1;
      const right = { x: MOUSE_HOME.x + (state.sx - 0.5) * 120 * range, y: MOUSE_HOME.y - 10 + (state.sy - 0.5) * 50 * range + (state.click ? 4 : 0) };
      if (state.m3d) state.m3d.aim(left, right);
    } else if (f) { if (force || hk.dataset.f !== f) { hk.innerHTML = img(f); hk.dataset.f = f; } } else {
      const r = active >= 0 ? keys[active] : null;
      const to = r ? { x: r.x + r.w / 2, y: r.y + r.h * 0.35 } : { x: 218, y: 286 };
      hk.dataset.f = '';
      hk.innerHTML = svg(W, H, arm(SHOULDER_L, to, !r));
    }

    // main droite + souris : suit le mouvement (lissé)
    const range = cfg.mouseRange || 1;
    const dx = (state.sx - 0.5) * 120 * range;
    const dy = (state.sy - 0.5) * 50 * range;
    const mm = $('mouse-move');
    mm.style.transform = `translate(${dx}px, ${dy}px)`;
    mm.classList.toggle('is-click', state.click);
    if (state.is3d) $('arm-r').innerHTML = '';
    else if (!has('mouse-hand')) {
      const to = { x: MOUSE_HOME.x + dx, y: MOUSE_HOME.y - 6 + dy + (state.click ? 4 : 0) };
      $('arm-r').innerHTML = svg(W, H, arm(SHOULDER_R, to, false));
    } else $('arm-r').innerHTML = '';
  };

  // bras droit dans sa propre couche (sous la souris personnalisée, au-dessus du bureau)
  const armR = document.createElement('div');
  armR.className = 'layer';
  armR.id = 'arm-r';
  $('tilt').insertBefore(armR, $('hand-keys'));

  // lissage de la souris
  const tick = () => {
    state.sx += (state.mx - state.sx) * 0.35;
    state.sy += (state.my - state.sy) * 0.35;
    render(false);
    requestAnimationFrame(tick);
  };

  /* ——— Événements de l'appli ——— */
  const connect = () => {
    const ws = new WebSocket(`ws://${location.host}/events`);
    ws.onmessage = (m) => handle(JSON.parse(m.data));
    ws.onclose = () => setTimeout(connect, 1500);
  };
  const handle = (e) => {
      if (e.t === 'hello' || e.t === 'cfg') { cfg = { ...cfg, ...e.cfg }; build(); if (SETTINGS && e.t === 'hello') drawSettings(); }
      else if (e.t === 'key') { state.down[e.i] = e.down; if (e.down) { state.last = e.i; } state.lastAt = Date.now(); }
      else if (e.t === 'mouse') { state.mx = e.x; state.my = e.y; }
      else if (e.t === 'click') { state.click = e.down; }
  };
  window.__bongoEvent = handle; // tests

  /* ——— Réglages (fenêtre de l'appli seulement) ——— */
  const drawSettings = async () => {
    if (!window.bongo) return;
    const c = await window.bongo.getCfg();
    const el = $('settings');
    el.hidden = false;
    document.body.classList.add('is-settings');
    el.innerHTML = `
      <h1>Bongo Stream</h1>
      <section><h2>Dans OBS</h2>
        <p>Ajoute une <b>Source navigateur</b> avec cette adresse, taille 800 × 500 :</p>
        <div class="row"><code>http://localhost:${c.port}/</code><button id="copy">Copier</button></div>
        <p class="hint">Le fond est transparent. Laisse l’appli ouverte pendant le stream (elle peut rester réduite près de l’horloge).</p>
      </section>
      <section><h2>Touches</h2>
        <div class="row">${c.keys.map((k, i) => `<input class="k" data-i="${i}" maxlength="1" value="${k}">`).join('')}</div>
        <label>Taille de la première touche <input id="big" type="range" min="1" max="1.8" step="0.05" value="${c.bigFirst}"></label>
        <label>Amplitude de la souris <input id="range" type="range" min="0.3" max="2" step="0.1" value="${c.mouseRange}"></label>
      </section>
      <section><h2>Fond</h2>
        <div class="row">
          <select id="bg">
            <option value="transparent" ${c.background === 'transparent' ? 'selected' : ''}>Transparent (OBS)</option>
            <option value="green" ${c.background === 'green' ? 'selected' : ''}>Vert (incrustation)</option>
            <option value="color" ${c.background.startsWith('#') ? 'selected' : ''}>Couleur</option>
          </select>
          <input id="bgc" type="color" value="${c.background.startsWith('#') ? c.background : '#1b1e2e'}">
        </div>
      </section>
      <section><h2>Ton personnage</h2>
        <p>Dépose tes images (PNG transparents, toutes en <b>800 × 500</b>, alignées entre elles) dans le dossier, avec ces noms :</p>
        <ul>
          <li><code>body.png</code> : le personnage (sans les bras)</li>
          <li><code>hand-up.png</code> : la main gauche levée</li>
          <li><code>hand-1.png</code> à <code>hand-4.png</code> : la main posée sur la 1ʳᵉ, 2ᵉ, 3ᵉ, 4ᵉ touche</li>
          <li><code>mouse-hand.png</code> : la main droite sur la souris (elle bouge avec ta souris)</li>
          <li><code>desk.png</code>, <code>keys.png</code> : le bureau et le clavier (facultatif)</li>
        </ul>
        <p class="hint">Une image manquante est remplacée par le dessin par défaut.${c.skin.length ? ` Trouvées : ${c.skin.join(', ')}.` : ''}</p>
        <p>Ou un <b>modèle 3D .glb</b> avec squelette : il remplace le personnage, et ses bras vont sur les touches et la souris.</p>
        <p class="status" id="m3d-status"></p>
        <div class="row"><button id="open">Ouvrir le dossier</button><button id="reload">Recharger les images</button></div>
      </section>
      <p class="hint">Astuce : appuie sur ${c.keys.join(' ')} ou bouge la souris pour tester l’aperçu.</p>`;
    $('copy').onclick = async () => { await window.bongo.copyUrl(); $('copy').textContent = 'Copié !'; };
    el.querySelectorAll('.k').forEach((inp) => { inp.onchange = () => { const keys = [...c.keys]; keys[Number(inp.dataset.i)] = inp.value.toUpperCase() || keys[Number(inp.dataset.i)]; window.bongo.setCfg({ keys }); }; });
    $('big').oninput = (e) => window.bongo.setCfg({ bigFirst: Number(e.target.value) });
    $('range').oninput = (e) => window.bongo.setCfg({ mouseRange: Number(e.target.value) });
    $('bg').onchange = (e) => window.bongo.setCfg({ background: e.target.value === 'color' ? $('bgc').value : e.target.value });
    $('bgc').oninput = (e) => { if ($('bg').value === 'color') window.bongo.setCfg({ background: e.target.value }); };
    showStatus();
    $('open').onclick = () => window.bongo.openSkin();
    $('reload').onclick = () => { state.glbFailed = false; state.glb = null; window.bongo.reloadSkin(); };
  };

  build();
  tick();
  if (location.protocol.startsWith('http')) connect();
})();
