/**
 * Musique du mode PokeArena.
 *
 * Chaque situation (ville, route selon le lieu, combat selon le dresseur, victoire…) demande
 * une piste d’OST. Les fichiers ne sont pas dans le dépôt (droits d’auteur) : on les dépose
 * soi-même dans client/public/music/ (voir le README de ce dossier), ou on pointe
 * REACT_APP_MUSIC_URL vers un dossier qui les héberge.
 * Si une piste manque, un thème chiptune original, composé à la volée, la remplace.
 */
import { composeSong, hashString, playSong } from './pokeArenaChiptune';

export const MUSIC_BASE = process.env.REACT_APP_MUSIC_URL || `${process.env.PUBLIC_URL || ''}/music`;

/* ——————————————————————— Catalogue ———————————————————————
 * Clé = nom du fichier .mp3 (si on dépose le fichier) ; `yt` = vidéos YouTube jouées en priorité. */

const T = (title, mood) => ({ title, mood });
/** Piste YouTube : plusieurs identifiants possibles (le suivant sert si une vidéo est indisponible). */
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
  // Combats de dresseurs
  'battle-trainer-johto-hgss': T('Combat ! Dresseur (Johto) — HeartGold / SoulSilver', 'battle'),
  'battle-trainer-kanto-hgss': T('Combat ! Dresseur (Kanto) — HeartGold / SoulSilver', 'battle'),
  'battle-trainer-dp': T('Combat ! Dresseur — Diamant / Perle', 'battle'),
  'battle-trainer-bw': T('Combat ! Dresseur — Noir / Blanc', 'battle'),
  'battle-trainer-xy': T('Combat ! Dresseur — X / Y', 'battle'),
  // Champions d’Arène
  'battle-gym-kanto-hgss': T('Combat ! Champion d’Arène (Kanto) — HeartGold / SoulSilver', 'gym'),
  'battle-gym-johto-hgss': T('Combat ! Champion d’Arène (Johto) — HeartGold / SoulSilver', 'gym'),
  'battle-gym-oras': T('Combat ! Champion d’Arène — Rubis Oméga / Saphir Alpha', 'gym'),
  'battle-gym-dp': T('Combat ! Champion d’Arène — Diamant / Perle', 'gym'),
  'battle-gym-bw': T('Combat ! Champion d’Arène — Noir / Blanc', 'gym'),
  'battle-gym-xy': T('Combat ! Champion d’Arène — X / Y', 'gym'),
  'battle-gym-swsh': T('Combat ! Champion d’Arène — Épée / Bouclier', 'gym'),
  'battle-gym-sv': T('Combat ! Champion d’Arène — Écarlate / Violet', 'gym'),
  // Conseil 4
  'battle-e4-oras': T('Combat ! Conseil 4 — Rubis Oméga / Saphir Alpha', 'e4'),
  'battle-e4-dp': T('Combat ! Conseil 4 — Diamant / Perle', 'e4'),
  'battle-e4-bw': T('Combat ! Conseil 4 — Noir / Blanc', 'e4'),
  'battle-e4-xy': T('Combat ! Conseil 4 — X / Y', 'e4'),
  'battle-e4-sm': T('Combat ! Conseil 4 — Soleil / Lune', 'e4'),
  'battle-e4-sv': T('Combat ! Conseil 4 — Écarlate / Violet', 'e4'),
  // Maîtres
  'battle-champion-hgss': T('Combat ! Maître (Peter) — HeartGold / SoulSilver', 'champion'),
  'battle-red-hgss': T('Combat contre Red — HeartGold / SoulSilver', 'champion'),
  'battle-blue-frlg': T('Combat final ! Rival (Blue) — Rouge Feu / Vert Feuille', 'champion'),
  'battle-champion-oras': T('Combat ! Maître — Rubis Oméga / Saphir Alpha', 'champion'),
  'battle-cynthia-dp': Y('Combat ! Maîtresse (Cynthia) — Diamant / Perle', 'champion', ['DfJYs5boP9A']),
  'battle-champion-bw': T('Combat ! Maître (Goyah) — Noir / Blanc', 'champion'),
  'battle-iris-b2w2': T('Combat ! Maîtresse Iris — Noire 2 / Blanche 2', 'champion'),
  'battle-diantha-xy': T('Combat ! Maîtresse (Dianthéa) — X / Y', 'champion'),
  'battle-kukui-sm': T('Combat ! Prof. Euphorbe — Soleil / Lune', 'champion'),
  'battle-leon-swsh': T('Combat ! Tarak — Épée / Bouclier', 'champion'),
  'battle-geeta-sv': T('Combat ! Alisma — Écarlate / Violet', 'champion'),
  'battle-nemona-sv': T('Combat ! Menzi — Écarlate / Violet', 'champion'),
  // Méchants
  'battle-cyrus-dp': Y('Combat ! Chef de la Team Galaxie (Hélio) — Diamant / Perle', 'villain', ['SE5dBmWml34', '-X_OBgeo59o', 'mA6WXoiQi34']),
  'battle-rocket-boss-hgss': T('Combat ! Chef de la Team Rocket — HeartGold / SoulSilver', 'villain'),
  'battle-aqua-magma-leader-oras': T('Combat ! Chef Aqua / Magma — Rubis Oméga / Saphir Alpha', 'villain'),
  'battle-ghetsis-bw': T('Combat ! Ghetis — Noir / Blanc', 'villain'),
  'battle-lysandre-xy': T('Combat ! Lysandre — X / Y', 'villain'),
  'battle-guzma-sm': T('Combat ! Guzma — Soleil / Lune', 'villain'),
  'battle-grunt-rocket-hgss': T('Combat ! Team Rocket — HeartGold / SoulSilver', 'grunt'),
  'battle-grunt-aqua-magma-oras': T('Combat ! Team Aqua / Magma — Rubis Oméga / Saphir Alpha', 'grunt'),
  'battle-grunt-galactic-dp': T('Combat ! Team Galaxie — Diamant / Perle', 'grunt'),
  'battle-grunt-plasma-bw': T('Combat ! Team Plasma — Noir / Blanc', 'grunt'),
  'battle-grunt-flare-xy': T('Combat ! Team Flare — X / Y', 'grunt'),
  'battle-grunt-skull-sm': T('Combat ! Team Skull — Soleil / Lune', 'grunt'),
  // Rivaux
  'battle-rival-hgss': T('Combat ! Rival — HeartGold / SoulSilver', 'rival'),
  'battle-rival-oras': T('Combat ! Timmy — Rubis Oméga / Saphir Alpha', 'rival'),
  'battle-rival-dp': T('Combat ! Rival — Diamant / Perle', 'rival'),
  'battle-rival-bw': T('Combat ! Rival — Noir / Blanc', 'rival'),
  'battle-rival-b2w2': T('Combat ! Rival — Noire 2 / Blanche 2', 'rival'),
  'battle-rival-xy': T('Combat ! Rival — X / Y', 'rival'),
  'battle-rival-sm': T('Combat ! Rival — Soleil / Lune', 'rival'),
  'battle-rival-swsh': T('Combat ! Rival — Épée / Bouclier', 'rival'),
  'battle-rival-sv': T('Combat ! Rival — Écarlate / Violet', 'rival'),
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

export const regionTrack = (region) => {
  const biome = LEGACY_BIOME[region?.biome] || region?.biome || 'prairie';
  return pickBy(BIOME_TRACKS[biome] || BIOME_TRACKS.prairie, `${region?.name || ''}-${region?.id || 0}`);
};

/** Thème de combat d’un nœud de la carte, selon le dresseur. */
export const battleTrack = (node) => {
  const t = node?.trainer || {};
  if (t.role === 'champion') return CHAMPION_TRACK[t.name] || 'battle-champion-hgss';
  if (t.role === 'e4') return E4_BY_REGION[t.region] || 'battle-e4-dp';
  if (t.role === 'gym') return GYM_BY_REGION[t.region] || 'battle-gym-dp';
  if (node?.kind === 'rival') return RIVAL_TRACK[t.name] || 'battle-rival-hgss';
  if (node?.kind === 'villain') return VILLAIN_TRACK[t.team]?.[0] || 'battle-cyrus-dp';
  if (t.team) return 'miroir-b-xd';
  const seed = `${node?.id || ''}-${t.name || ''}`;
  if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE) return 'battle-cyrus-dp';
  return pickBy(TRAINER_TRACKS, seed);
};

/** Après une victoire, on garde la musique en cours (pas de jingle). */
export const victoryTrack = () => null;

/** Thème de combat en salon multi (varie à chaque round, Hélio de temps en temps). */
export const versusTrack = (round, code = '') => {
  const seed = `${code}-${round}`;
  if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE * 1.5) return 'battle-cyrus-dp';
  const pool = [...TRAINER_TRACKS, 'battle-gym-dp', 'battle-gym-bw', 'battle-rival-dp', 'battle-rival-hgss', 'battle-e4-dp'];
  return pickBy(pool, seed);
};

/* ——————————————————————— Lecteur ——————————————————————— */

const failed = new Set();
const ytDead = new Set();

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
    setTimeout(() => reject(new Error('YouTube trop lent')), 8000);
  });
  ytApi.catch(() => { /* géré par l’appelant */ });
  return ytApi;
};

/** Mini-lecteur YouTube : une seule iframe, déplacée en fixed (visible ou hors écran). */
const createYouTubeDeck = (onEnded, onFail, onPlaying) => {
  let player = null;
  let ready = null;
  const host = document.createElement('div');
  host.className = 'pa-yt-host';
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: '240px', height: '135px', zIndex: '400', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.45)' });
  const mount = document.createElement('div');
  host.appendChild(mount);
  document.body.appendChild(host);
  const init = () => {
    if (ready) return ready;
    ready = loadYouTube().then((YT) => new Promise((resolve) => {
      player = new YT.Player(mount, {
        width: '240',
        height: '135',
        playerVars: { autoplay: 1, controls: 1, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3 },
        events: {
          onReady: () => resolve(player),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) onEnded();
            if (e.data === YT.PlayerState.PLAYING) onPlaying();
          },
          onError: () => onFail()
        }
      });
    }));
    return ready;
  };
  return {
    init,
    get player() { return player; },
    show(rect) {
      if (!rect) { host.style.left = '-10000px'; return; }
      Object.assign(host.style, { left: `${Math.round(rect.left)}px`, top: `${Math.round(rect.top)}px` });
    },
    destroy() { host.remove(); }
  };
};

const createPlayer = () => {
  let ac = null;
  let master = null;
  let volume = 0.5;
  let current = null; // { key, kind: 'yt'|'file'|'synth', … }
  let wanted = null;
  let listeners = [];
  let unlocked = false;
  let deck = null;

  const ensureCtx = () => {
    if (ac) return ac;
    const Ctx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!Ctx) return null;
    ac = new Ctx();
    master = ac.createGain();
    master.gain.value = volume * 0.7;
    master.connect(ac.destination);
    return ac;
  };

  const notify = () => listeners.forEach((fn) => fn(current ? { key: current.key, kind: current.kind, title: TRACKS[current.key]?.title || '' } : null));

  const fadeAudio = (audio, to, ms, done) => {
    const from = audio.volume;
    const t0 = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) {
        clearInterval(id);
        if (done) done();
      }
    }, 40);
  };

  const ytVolume = (v) => {
    try { deck?.player?.setVolume(Math.round(v * 100)); } catch { /* lecteur pas prêt */ }
  };

  const stopCurrent = () => {
    const c = current;
    current = null;
    if (!c) return;
    c.cancelled = true;
    if (c.kind === 'synth') c.song.stop(0.5);
    else if (c.kind === 'yt') { try { deck?.player?.pauseVideo(); } catch { /* lecteur pas prêt */ } }
    else fadeAudio(c.audio, 0, 500, () => { c.audio.pause(); c.audio.src = ''; });
  };

  const startSynth = (key) => {
    if (!ensureCtx()) return;
    const mood = TRACKS[key]?.mood || 'route';
    const song = composeSong(mood, hashString(key));
    current = { key, kind: 'synth', song: playSong(ac, master, song) };
    notify();
  };

  const startFile = (key) => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    const entry = { key, kind: 'file', audio };
    current = entry;
    let settled = false;
    const fallback = () => {
      if (settled || entry.cancelled) return;
      settled = true;
      failed.add(key);
      audio.src = '';
      if (current === entry) startSynth(key);
    };
    audio.addEventListener('error', fallback, { once: true });
    audio.addEventListener('playing', () => {
      if (settled || entry.cancelled) return;
      settled = true;
      if (current === entry) {
        fadeAudio(audio, volume, 700);
        notify();
      }
    }, { once: true });
    audio.src = `${MUSIC_BASE}/${key}.mp3`;
    const p = audio.play();
    if (p && p.catch) p.catch((e) => { if (e && e.name !== 'NotAllowedError') fallback(); });
    setTimeout(() => { if (!settled && current === entry) fallback(); }, 4000);
  };

  /** Piste sans YouTube jouable : fichier déposé, sinon thème composé. */
  const startLocal = (key) => {
    if (failed.has(key)) startSynth(key);
    else startFile(key);
  };

  const ytIds = (key) => (TRACKS[key]?.yt || []).filter((id) => !ytDead.has(id));

  const startYouTube = (key) => {
    const entry = { key, kind: 'yt', ids: ytIds(key), playing: false };
    current = entry;
    const giveUp = () => {
      if (entry.cancelled || current !== entry) return;
      current = null;
      startLocal(key);
    };
    if (!deck) {
      deck = createYouTubeDeck(
        () => { // fin de la vidéo : on boucle
          if (current?.kind === 'yt') { try { deck.player.seekTo(0); deck.player.playVideo(); } catch { /* lecteur pas prêt */ } }
        },
        () => { // vidéo indisponible : identifiant suivant
          const c = current;
          if (c?.kind !== 'yt') return;
          ytDead.add(c.ids.shift());
          if (c.ids.length) deck.player.loadVideoById(c.ids[0]);
          else { current = null; startLocal(c.key); }
        },
        () => {
          if (current?.kind === 'yt' && !current.playing) {
            current.playing = true;
            ytVolume(volume);
            notify();
          }
        }
      );
    }
    deck.init().then((pl) => {
      if (entry.cancelled || current !== entry) return;
      ytVolume(volume);
      pl.loadVideoById(entry.ids[0]);
      setTimeout(() => { if (!entry.playing && current === entry && !entry.cancelled) giveUp(); }, 9000);
    }).catch(giveUp);
  };

  const start = (key) => {
    if (!key || volume <= 0 || !unlocked) return;
    if (current?.key === key) return;
    stopCurrent();
    if (ytIds(key).length && typeof document !== 'undefined') startYouTube(key);
    else startLocal(key);
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
    start(wanted);
  };
  if (typeof window !== 'undefined') {
    ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { once: true, capture: true }));
  }

  return {
    play(key) {
      if (key === undefined) return;
      wanted = key;
      if (!key) {
        stopCurrent();
        notify();
        return;
      }
      start(key);
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume * 0.7;
      if (current?.kind === 'file') current.audio.volume = volume;
      if (current?.kind === 'yt') ytVolume(volume);
      if (volume <= 0) {
        stopCurrent();
        notify();
      } else if (!current) start(wanted);
    },
    /** Affiche la vidéo YouTube en cours à cet endroit (rect en coordonnées écran), ou la cache. */
    showVideo(rect) {
      if (deck) deck.show(rect);
    },
    stop() {
      wanted = null;
      stopCurrent();
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
