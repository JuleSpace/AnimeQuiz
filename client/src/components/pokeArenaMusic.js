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

/* ——————————————————————— Catalogue (clé = nom du fichier .mp3) ——————————————————————— */

const T = (title, mood) => ({ title, mood });

export const TRACKS = {
  // Villes / menus
  'town-newbark-hgss': T('Bourg Geon — HeartGold / SoulSilver', 'town'),
  'town-twinleaf-dp': T('Bonaugure — Diamant / Perle', 'town'),
  'town-nuvema-bw': T('Renouet — Noir / Blanc', 'town'),
  'town-vaniville-xy': T('Bourg Croquis — X / Y', 'town'),
  // Prairies et forêts
  'route-29-hgss': T('Route 29 — HeartGold / SoulSilver', 'route'),
  'route-30-hgss': T('Route 30 — HeartGold / SoulSilver', 'route'),
  'route-38-hgss': T('Route 38 — HeartGold / SoulSilver', 'route'),
  'national-park-hgss': T('Parc Naturel — HeartGold / SoulSilver', 'route'),
  'route-201-dp': T('Route 201 — Diamant / Perle', 'route'),
  'route-205-dp': T('Route 205 — Diamant / Perle', 'route'),
  'eterna-forest-dp': T('Forêt de Vestigion — Diamant / Perle', 'route'),
  'route-1-bw': T('Route 1 — Noir / Blanc', 'route'),
  'route-6-bw': T('Route 6 — Noir / Blanc', 'route'),
  'route-xy': T('Thème des routes — X / Y', 'route'),
  // Montagnes
  'route-47-hgss': T('Route 47 — HeartGold / SoulSilver', 'route'),
  'route-210-dp': T('Route 210 — Diamant / Perle', 'route'),
  'mt-coronet-dp': T('Mont Couronné — Diamant / Perle', 'cave'),
  'route-10-bw': T('Route 10 — Noir / Blanc', 'route'),
  'dragonspiral-bw': T('Tour Dragospire — Noir / Blanc', 'cave'),
  // Côtes
  'olivine-hgss': T('Oliville — HeartGold / SoulSilver', 'town'),
  'surf-hgss': T('Surf — HeartGold / SoulSilver', 'route'),
  'sunyshore-dp': T('Rivamar — Diamant / Perle', 'town'),
  'undella-bw': T('Port Yoneuve (été) — Noir / Blanc', 'town'),
  'cyllage-xy': T('Relifac-le-Haut — X / Y', 'town'),
  // Neige
  'ice-path-hgss': T('Route de Glace — HeartGold / SoulSilver', 'snow'),
  'route-216-dp': T('Route 216 — Diamant / Perle', 'snow'),
  'snowpoint-dp': T('Frimapic — Diamant / Perle', 'snow'),
  'icirrus-bw': T('Flocombe — Noir / Blanc', 'snow'),
  'snowbelle-xy': T('Flusselles — X / Y', 'snow'),
  // Volcans
  'cinnabar-hgss': T('Cramois’Île — HeartGold / SoulSilver', 'volcano'),
  'stark-mountain-pt': T('Mont Abrupt — Platine', 'volcano'),
  'reversal-mountain-b2w2': T('Mont Renverse — Noire 2 / Blanche 2', 'volcano'),
  'route-113-oras': T('Route 113 — Rubis Oméga / Saphir Alpha', 'volcano'),
  // Grottes
  'union-cave-hgss': T('Caves Jumelles — HeartGold / SoulSilver', 'cave'),
  'chargestone-bw': T('Grotte Électrolithe — Noir / Blanc', 'cave'),
  'twist-mountain-bw': T('Mont Foré — Noir / Blanc', 'cave'),
  'glittering-cave-xy': T('Grotte Scintillante — X / Y', 'cave'),
  // Ligue
  'victory-road-hgss': T('Route Victoire — HeartGold / SoulSilver', 'league'),
  'league-dp': T('Ligue Pokémon — Diamant / Perle', 'league'),
  'victory-road-bw': T('Route Victoire — Noir / Blanc', 'league'),
  'league-bw': T('Ligue Pokémon — Noir / Blanc', 'league'),
  'league-xy': T('Ligue Pokémon — X / Y', 'league'),
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
  'battle-cynthia-dp': T('Combat ! Maîtresse (Cynthia) — Diamant / Perle', 'champion'),
  'battle-champion-bw': T('Combat ! Maître (Goyah) — Noir / Blanc', 'champion'),
  'battle-iris-b2w2': T('Combat ! Maîtresse Iris — Noire 2 / Blanche 2', 'champion'),
  'battle-diantha-xy': T('Combat ! Maîtresse (Dianthéa) — X / Y', 'champion'),
  'battle-kukui-sm': T('Combat ! Prof. Euphorbe — Soleil / Lune', 'champion'),
  'battle-leon-swsh': T('Combat ! Tarak — Épée / Bouclier', 'champion'),
  'battle-geeta-sv': T('Combat ! Alisma — Écarlate / Violet', 'champion'),
  'battle-nemona-sv': T('Combat ! Menzi — Écarlate / Violet', 'champion'),
  // Méchants
  'battle-cyrus-dp': T('Combat ! Chef de la Team Galaxie (Hélio) — Diamant / Perle', 'villain'),
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
  // Victoires
  'victory-trainer-hgss': T('Victoire ! (Dresseur) — HeartGold / SoulSilver', 'victory'),
  'victory-trainer-dp': T('Victoire ! (Dresseur) — Diamant / Perle', 'victory'),
  'victory-gym-dp': T('Victoire ! (Champion d’Arène) — Diamant / Perle', 'victory'),
  'victory-champion-bw': T('Victoire ! (Maître) — Noir / Blanc', 'victory'),
  'hall-of-fame-hgss': T('Panthéon — HeartGold / SoulSilver', 'fame'),
  'hall-of-fame-dp': T('Panthéon — Diamant / Perle', 'fame')
};

/* ——————————————————————— Choix de la piste ——————————————————————— */

const pickBy = (list, seedText) => list[hashString(seedText) % list.length];

const BIOME_TRACKS = {
  prairie: ['route-29-hgss', 'route-30-hgss', 'route-38-hgss', 'national-park-hgss', 'route-201-dp', 'route-205-dp', 'eterna-forest-dp', 'route-1-bw', 'route-6-bw', 'route-xy'],
  montagne: ['route-47-hgss', 'route-210-dp', 'mt-coronet-dp', 'route-10-bw', 'dragonspiral-bw'],
  plage: ['olivine-hgss', 'surf-hgss', 'sunyshore-dp', 'undella-bw', 'cyllage-xy'],
  neige: ['ice-path-hgss', 'route-216-dp', 'snowpoint-dp', 'icirrus-bw', 'snowbelle-xy'],
  volcan: ['cinnabar-hgss', 'stark-mountain-pt', 'reversal-mountain-b2w2', 'route-113-oras'],
  grotte: ['union-cave-hgss', 'mt-coronet-dp', 'chargestone-bw', 'twist-mountain-bw', 'glittering-cave-xy'],
  ligue: ['victory-road-hgss', 'league-dp', 'victory-road-bw', 'league-bw', 'league-xy']
};
const LEGACY_BIOME = { forest: 'prairie', mountain: 'montagne', league: 'ligue' };

export const TOWN_TRACKS = ['town-newbark-hgss', 'town-twinleaf-dp', 'town-nuvema-bw', 'town-vaniville-xy'];
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
  if (t.team) return VILLAIN_TRACK[t.team]?.[1] || 'battle-grunt-galactic-dp';
  const seed = `${node?.id || ''}-${t.name || ''}`;
  if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE) return 'battle-cyrus-dp';
  return pickBy(TRAINER_TRACKS, seed);
};

export const victoryTrack = (node) => {
  const role = node?.trainer?.role;
  if (role === 'champion') return 'victory-champion-bw';
  if (role === 'gym' || role === 'e4' || node?.kind === 'villain') return 'victory-gym-dp';
  return pickBy(['victory-trainer-hgss', 'victory-trainer-dp'], node?.id || '');
};

/** Thème de combat en salon multi (varie à chaque round, Hélio de temps en temps). */
export const versusTrack = (round, code = '') => {
  const seed = `${code}-${round}`;
  if ((hashString(`cyrus-${seed}`) % 1000) / 1000 < CYRUS_CHANCE * 1.5) return 'battle-cyrus-dp';
  const pool = [...TRAINER_TRACKS, 'battle-gym-dp', 'battle-gym-bw', 'battle-rival-dp', 'battle-rival-hgss', 'battle-e4-dp'];
  return pickBy(pool, seed);
};

/* ——————————————————————— Lecteur ——————————————————————— */

const failed = new Set();

const createPlayer = () => {
  let ac = null;
  let master = null;
  let volume = 0.5;
  let current = null; // { key, kind: 'file'|'synth', audio?, song? }
  let wanted = null;
  let listeners = [];
  let unlocked = false;

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

  const stopCurrent = () => {
    const c = current;
    current = null;
    if (!c) return;
    c.cancelled = true;
    if (c.kind === 'synth') c.song.stop(0.5);
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
    // Pas de réponse au bout de 4 s : on bascule sur le thème composé.
    setTimeout(() => { if (!settled && current === entry) fallback(); }, 4000);
  };

  const start = (key) => {
    if (!key || volume <= 0 || !unlocked) return;
    if (current?.key === key) return;
    stopCurrent();
    if (failed.has(key)) startSynth(key);
    else startFile(key);
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
      if (volume <= 0) {
        stopCurrent();
        notify();
      } else if (!current) start(wanted);
    },
    stop() {
      wanted = null;
      stopCurrent();
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
