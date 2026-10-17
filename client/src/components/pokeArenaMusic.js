/**
 * Musique du mode PokeArena : uniquement des pistes YouTube (sélection de Jules),
 * lues dans un mini-lecteur (bouton ♪). Chaque situation (menu, lieu, dresseur) demande une piste ;
 * si la situation n’a pas encore de piste (ou si sa vidéo est indisponible), une musique des menus
 * est tirée au hasard à la place.
 */

/** Hash FNV-1a : choix stables (même région → même musique). */
const hashString = (str = '') => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};

/* ——————————————————————— Catalogue ———————————————————————
 * `yt` = identifiants de vidéos YouTube (le suivant sert si une vidéo est indisponible). */

const Y = (title, mood, yt) => ({ title, mood, yt });

export const TRACKS = {
  // ——— Sélection de Jules (YouTube) ———
  'op-saison-3-vf': Y('Pokémon Johto — Générique saison 3 (VF)', 'town', ['ca_AUEJmkLo', 'FLJij1Ethl0']),
  'op-saison-8-vf': Y('Pokémon Invincible — Générique saison 8 (VF)', 'town', ['Np-vs6bXZAE']),
  'op-saison-9-vf': Y('Pokémon Advanced Battle — Générique saison 9 (VF)', 'town', ['8kKzydj7XbU', 'bLf8IMffDuY']),
  'parc-naturel-hgss': Y('Parc Naturel — HeartGold / SoulSilver', 'route', ['4ujh7lvcsRs', '4ujh7IvcsRs']),
  'route-209-dp': Y('Route 209 (jour) — Diamant / Perle', 'route', ['pmCpbZQXo9A']),
  'route-15-xy': Y('Route 15 — X / Y', 'route', ['ANamw2Fs6VY']),
  'port-yoneuve-bw': Y('Port Yoneuve — Noir / Blanc 2', 'town', ['2YZ1ouxhzaM']),
  'pont-hameau-b2w2': Y('Pont du Hameau — Noir / Blanc 2', 'route', ['Gju6j3f2xTc']),
  'bourg-en-vol-oras': Y('Bourg-en-Vol — Rubis Oméga / Saphir Alpha', 'town', ['xa-ngQFKark']),
  'la-porte-xy': Y('La Porte — X / Y', 'town', ['rtvln-rF3Rw', 'rtvIn-rF3Rw']),
  'route-216-nuit-dp': Y('Route 216 (nuit) — Diamant / Perle', 'snow', ['nayAS2WTMP0']),
  'ligue-dp': Y('Ligue Pokémon — Diamant / Perle', 'league', ['u83mX9tGG9E']),
  'donjons-mysteres-1': Y('Pokémon Donjon Mystère : Explorateurs (piste 1)', 'cave', ['WKLBhjeN27o']),
  'donjons-mysteres-2': Y('Pokémon Donjon Mystère : Explorateurs (piste 2)', 'cave', ['MvVwQ37VhkA']),
  'miroir-b-xd': Y('Miror B. — Pokémon XD', 'grunt', ['WuhqoZvyntA']),
  // Maîtres
  'battle-cynthia-dp': Y('Combat ! Maîtresse (Cynthia) — Diamant / Perle', 'champion', ['DfJYs5boP9A']),
  // Méchants
  'battle-cyrus-dp': Y('Combat ! Chef de la Team Galaxie (Hélio) — Diamant / Perle', 'villain', ['SE5dBmWml34', '-X_OBgeo59o', 'mA6WXoiQi34']),
};

/* ——————————————————————— Choix de la piste ——————————————————————— */

const pickBy = (list, seedText) => list[hashString(seedText) % list.length];

const BIOME_TRACKS = {
  prairie: ['parc-naturel-hgss', 'route-209-dp', 'route-15-xy', 'pont-hameau-b2w2'],
  montagne: ['route-15-xy', 'pont-hameau-b2w2', 'route-209-dp'],
  plage: ['port-yoneuve-bw', 'pont-hameau-b2w2', 'bourg-en-vol-oras'],
  neige: ['route-216-nuit-dp'],
  volcan: ['donjons-mysteres-1', 'donjons-mysteres-2'],
  grotte: ['donjons-mysteres-2', 'donjons-mysteres-1'],
  ligue: ['ligue-dp']
};
const LEGACY_BIOME = { forest: 'prairie', mountain: 'montagne', league: 'ligue' };

export const TOWN_TRACKS = ['op-saison-3-vf', 'op-saison-8-vf', 'op-saison-9-vf', 'la-porte-xy', 'bourg-en-vol-oras'];
export const OPENING_TRACKS = ['op-saison-3-vf', 'op-saison-8-vf', 'op-saison-9-vf'];
const TRAINER_TRACKS = ['battle-trainer-johto-hgss', 'battle-trainer-kanto-hgss', 'battle-trainer-dp', 'battle-trainer-bw', 'battle-trainer-xy'];

const GYM_BY_REGION = {
  Kanto: 'battle-gym-kanto-hgss', Johto: 'battle-gym-johto-hgss', Hoenn: 'battle-gym-oras', Sinnoh: 'battle-gym-dp',
  Unys: 'battle-gym-bw', Kalos: 'battle-gym-xy', Galar: 'battle-gym-swsh', Paldea: 'battle-gym-sv'
};
const E4_BY_REGION = {
  Kanto: 'battle-e4-dp', Johto: 'battle-e4-dp', Hoenn: 'battle-e4-oras', Sinnoh: 'battle-e4-dp',
  Unys: 'battle-e4-bw', Kalos: 'battle-e4-xy', Alola: 'battle-e4-sm', Paldea: 'battle-e4-sv'
};
const CHAMPION_TRACK = {
  Peter: 'battle-champion-hgss', Blue: 'battle-blue-frlg', Red: 'battle-red-hgss', 'Pierre Rochard': 'battle-champion-oras',
  Marc: 'battle-champion-oras', Cynthia: 'battle-cynthia-dp', Goyah: 'battle-champion-bw', Iris: 'battle-iris-b2w2',
  Dianthéa: 'battle-diantha-xy', Euphorbe: 'battle-kukui-sm', Tarak: 'battle-leon-swsh', Alisma: 'battle-geeta-sv', Menzi: 'battle-nemona-sv'
};
const VILLAIN_TRACK = {
  'Team Rocket': ['battle-rocket-boss-hgss', 'battle-grunt-rocket-hgss'],
  'Team Aqua': ['battle-aqua-magma-leader-oras', 'battle-grunt-aqua-magma-oras'],
  'Team Magma': ['battle-aqua-magma-leader-oras', 'battle-grunt-aqua-magma-oras'],
  'Team Galaxie': ['battle-cyrus-dp', 'battle-grunt-galactic-dp'],
  'Team Plasma': ['battle-ghetsis-bw', 'battle-grunt-plasma-bw'],
  'Team Flare': ['battle-lysandre-xy', 'battle-grunt-flare-xy'],
  'Team Skull': ['battle-guzma-sm', 'battle-grunt-skull-sm']
};
const RIVAL_TRACK = {
  Blue: 'battle-rival-hgss', Silver: 'battle-rival-hgss', Timmy: 'battle-rival-oras', Louka: 'battle-rival-dp',
  Bianca: 'battle-rival-bw', Matis: 'battle-rival-b2w2', Serena: 'battle-rival-xy', Kalem: 'battle-rival-xy',
  Tili: 'battle-rival-sm', Gladio: 'battle-rival-sm', Nabil: 'battle-rival-swsh', Travis: 'battle-rival-swsh',
  Rosemary: 'battle-rival-swsh', Menzi: 'battle-rival-sv', Kassis: 'battle-rival-sv', Pepper: 'battle-rival-sv'
};

/** Part des combats ordinaires qui passent le thème d’Hélio, en clin d’œil. */
const CYRUS_CHANCE = 0.08;

const ytDead = new Set();
const liveIds = (key) => (TRACKS[key]?.yt || []).filter((id) => !ytDead.has(id));
const liveMenus = () => TOWN_TRACKS.filter((k) => liveIds(k).length);

/** Piste demandée si elle existe sur YouTube, sinon une musique des menus au hasard (stable pour `seed`). */
const orMenu = (key, seed) => {
  if (liveIds(key).length) return key;
  const menus = liveMenus();
  return menus.length ? pickBy(menus, `${key}-${seed}`) : null;
};

export const regionTrack = (region) => {
  const biome = LEGACY_BIOME[region?.biome] || region?.biome || 'prairie';
  const seed = `${region?.name || ''}-${region?.id || 0}`;
  return orMenu(pickBy(BIOME_TRACKS[biome] || BIOME_TRACKS.prairie, seed), seed);
};

/** Thème de combat d’un nœud de la carte, selon le dresseur (musique des menus s’il n’en a pas encore). */
export const battleTrack = (node) => {
  const t = node?.trainer || {};
  const seed = `${node?.id || ''}-${t.name || ''}`;
  let key;
  if (t.role === 'champion') key = CHAMPION_TRACK[t.name];
  else if (t.role === 'e4') key = E4_BY_REGION[t.region];
  else if (t.role === 'gym') key = GYM_BY_REGION[t.region];
  else if (node?.kind === 'rival') key = RIVAL_TRACK[t.name];
  else if (node?.kind === 'villain') key = VILLAIN_TRACK[t.team]?.[0];
  else if (t.team) key = 'miroir-b-xd';
  else if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE) key = 'battle-cyrus-dp';
  else key = pickBy(TRAINER_TRACKS, seed);
  return orMenu(key, seed);
};

/** Thème de combat en salon multi (varie à chaque round, Hélio de temps en temps). */
export const versusTrack = (round, code = '') => {
  const seed = `${code}-${round}`;
  if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE * 1.5) return orMenu('battle-cyrus-dp', seed);
  return orMenu(pickBy(TRAINER_TRACKS, seed), seed);
};

/* ——————————————————————— Lecteur YouTube ——————————————————————— */

/** Charge l’API IFrame de YouTube une seule fois. */
let ytApi = null;
const loadYouTube = () => {
  if (ytApi) return ytApi;
  ytApi = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return; }
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => reject(new Error('YouTube indisponible'));
    document.head.appendChild(tag);
    setTimeout(() => reject(new Error('YouTube trop lent')), 10000);
  });
  ytApi.catch(() => { /* géré par l’appelant */ });
  return ytApi;
};

/** Une seule iframe, en position fixe : affichée dans le panneau ♪ ou rangée hors écran. */
const createDeck = (handlers) => {
  let player = null;
  let ready = null;
  const host = document.createElement('div');
  host.className = 'pa-yt-host';
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0', width: '240px', height: '135px',
    zIndex: '400', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.45)'
  });
  const mount = document.createElement('div');
  host.appendChild(mount);
  document.body.appendChild(host);
  return {
    init() {
      if (ready) return ready;
      ready = loadYouTube().then((YT) => new Promise((resolve) => {
        player = new YT.Player(mount, {
          width: '240',
          height: '135',
          playerVars: { autoplay: 1, controls: 1, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3 },
          events: {
            onReady: () => resolve(player),
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.ENDED) handlers.ended();
              if (e.data === YT.PlayerState.PLAYING) handlers.playing();
            },
            onError: () => handlers.error()
          }
        });
      }));
      return ready;
    },
    get player() { return player; },
    show(rect) {
      if (!rect) { host.style.left = '-10000px'; return; }
      Object.assign(host.style, { left: `${Math.round(rect.left)}px`, top: `${Math.round(rect.top)}px` });
    }
  };
};

const createPlayer = () => {
  let volume = 0.5;
  let current = null; // { key, id, playing }
  let wanted = null;
  let listeners = [];
  let unlocked = false;
  let deck = null;

  const notify = () => listeners.forEach((fn) => fn(current ? { key: current.key, kind: 'yt', title: TRACKS[current.key]?.title || '' } : null));
  const call = (fn) => { try { if (deck?.player) fn(deck.player); } catch { /* lecteur pas prêt */ } };

  const pause = () => {
    current = null;
    call((p) => p.pauseVideo());
  };

  /** Vidéo morte : identifiant suivant de la même piste, sinon une musique des menus au hasard. */
  const skip = () => {
    const c = current;
    if (!c) return;
    ytDead.add(c.id);
    const nextId = liveIds(c.key)[0];
    if (nextId) {
      c.id = nextId;
      call((p) => p.loadVideoById(nextId));
      return;
    }
    const menus = liveMenus().filter((k) => k !== c.key);
    if (!menus.length) { pause(); notify(); return; }
    load(menus[Math.floor(Math.random() * menus.length)]);
  };

  const ensureDeck = () => {
    if (deck) return deck;
    deck = createDeck({
      ended: () => { if (current) call((p) => { p.seekTo(0); p.playVideo(); }); },
      playing: () => {
        if (current && !current.playing) {
          current.playing = true;
          call((p) => p.setVolume(Math.round(volume * 100)));
          notify();
        }
      },
      error: () => skip()
    });
    return deck;
  };

  const load = (key) => {
    const id = liveIds(key)[0];
    if (!id) { skip(); return; }
    const entry = { key, id, playing: false };
    current = entry;
    notify();
    ensureDeck().init().then((p) => {
      if (current !== entry) return;
      p.setVolume(Math.round(volume * 100));
      p.loadVideoById(id);
      // Rien au bout de 10 s : on considère la vidéo indisponible.
      setTimeout(() => { if (current === entry && !entry.playing) skip(); }, 10000);
    }).catch(() => { if (current === entry) { current = null; notify(); } });
  };

  const start = (key) => {
    if (!key || volume <= 0 || !unlocked || typeof document === 'undefined') return;
    if (current?.key === key) return;
    load(key);
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    start(wanted);
  };
  if (typeof window !== 'undefined') {
    ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { once: true, capture: true }));
  }

  return {
    /** Demande une piste ; `null` ou `undefined` : on garde la musique en cours. */
    play(key) {
      if (!key) return;
      wanted = key;
      start(key);
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      call((p) => p.setVolume(Math.round(volume * 100)));
      if (volume <= 0) { pause(); notify(); } else if (!current) start(wanted);
    },
    /** Affiche la vidéo en cours à cet endroit (rect en coordonnées écran), ou la cache. */
    showVideo(rect) {
      if (deck) deck.show(rect);
    },
    stop() {
      wanted = null;
      pause();
      if (deck) deck.show(null);
      notify();
    },
    subscribe(fn) {
      listeners.push(fn);
      return () => { listeners = listeners.filter((x) => x !== fn); };
    }
  };
};

let player = null;
export const musicPlayer = () => {
  if (!player) player = createPlayer();
  return player;
};
