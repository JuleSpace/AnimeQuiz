import React, { useEffect, useState } from 'react';

// Roster des personnages de l'univers Sonic. Les identifiants doivent rester alignés sur AVATAR_IDS (quiz.js).
// Portraits : le navigateur demande au wiki Sonic (sonic.fandom.com) l'image principale de la page « wiki »
// de chaque personnage, une seule fois, puis la garde en cache une semaine. Si le wiki ne répond pas,
// le médaillon aux couleurs du personnage reste affiché.
// Pour imposer sa propre image : déposer client/public/roster/<id>.png et ajouter img: true à l'entrée.
export const ROSTER = [
  { id: 'sonic', name: 'Sonic', a: '#1f6dff', b: '#0a2a9e', ink: '#fff', wiki: 'Sonic the Hedgehog' },
  { id: 'tails', name: 'Tails', a: '#ffb02e', b: '#e07000', ink: '#fff', wiki: 'Miles "Tails" Prower' },
  { id: 'knuckles', name: 'Knuckles', a: '#ff3b4e', b: '#a3001a', ink: '#fff', wiki: 'Knuckles the Echidna' },
  { id: 'amy', name: 'Amy', a: '#ff7ac0', b: '#d6247c', ink: '#fff', wiki: 'Amy Rose' },
  { id: 'cream', name: 'Cream', a: '#ffe0a8', b: '#f08a24', ink: '#5a2a00', wiki: 'Cream the Rabbit' },
  { id: 'big', name: 'Big', a: '#b48cff', b: '#5b3fc4', ink: '#fff', wiki: 'Big the Cat' },
  { id: 'shadow', name: 'Shadow', a: '#2a2d3a', b: '#ff2347', ink: '#fff', wiki: 'Shadow the Hedgehog' },
  { id: 'rouge', name: 'Rouge', a: '#f2f2ff', b: '#d61f6e', ink: '#7a0036', wiki: 'Rouge the Bat' },
  { id: 'omega', name: 'Omega', a: '#ff4b3a', b: '#2a2d3a', ink: '#ffd23a', wiki: 'E-123 Omega' },
  { id: 'eggman', name: 'Eggman', a: '#ff5a3a', b: '#7a1a00', ink: '#ffd23a', wiki: 'Doctor Eggman' },
  { id: 'metal', name: 'Metal Sonic', a: '#6f8bd6', b: '#1d2b66', ink: '#ff3b4e', wiki: 'Metal Sonic' },
  { id: 'chaos', name: 'Chaos', a: '#8ff2ff', b: '#1a8fb8', ink: '#0a3a66', wiki: 'Chaos' },
  { id: 'tikal', name: 'Tikal', a: '#ffb36b', b: '#c8541a', ink: '#fff', wiki: 'Tikal' },
  { id: 'silver', name: 'Silver', a: '#e4f2ff', b: '#3ec9d6', ink: '#0a3a66', wiki: 'Silver the Hedgehog' },
  { id: 'blaze', name: 'Blaze', a: '#a57bff', b: '#ff5a1f', ink: '#fff', wiki: 'Blaze the Cat' },
  { id: 'espio', name: 'Espio', a: '#c46bff', b: '#5a1a8a', ink: '#ffd23a', wiki: 'Espio the Chameleon' },
  { id: 'vector', name: 'Vector', a: '#3ddc84', b: '#0d7a3f', ink: '#fff', wiki: 'Vector the Crocodile' },
  { id: 'charmy', name: 'Charmy', a: '#ffe14a', b: '#1d1d1d', ink: '#1d1d1d', wiki: 'Charmy Bee' },
  { id: 'jet', name: 'Jet', a: '#3ddc84', b: '#ff8a00', ink: '#fff', wiki: 'Jet the Hawk' },
  { id: 'wave', name: 'Wave', a: '#b48cff', b: '#3a1a8a', ink: '#fff', wiki: 'Wave the Swallow' },
  { id: 'storm', name: 'Storm', a: '#c9c9d6', b: '#4a4a5a', ink: '#fff', wiki: 'Storm the Albatross' },
  { id: 'marine', name: 'Marine', a: '#ffcf6b', b: '#1f8fff', ink: '#fff', wiki: 'Marine the Raccoon' },
  { id: 'sticks', name: 'Sticks', a: '#ffaa4a', b: '#7a3a00', ink: '#fff', wiki: 'Sticks the Badger' },
  { id: 'mighty', name: 'Mighty', a: '#ff3b4e', b: '#1d1d1d', ink: '#fff', wiki: 'Mighty the Armadillo' },
  { id: 'ray', name: 'Ray', a: '#ffe14a', b: '#d68a00', ink: '#5a2a00', wiki: 'Ray the Flying Squirrel' },
  { id: 'infinite', name: 'Infinite', a: '#3a3a4a', b: '#b8002e', ink: '#fff', wiki: 'Infinite' },
  { id: 'maria', name: 'Maria', a: '#fff1a8', b: '#5aa8ff', ink: '#0a1f6b', wiki: 'Maria Robotnik' },
  { id: 'gamma', name: 'Gamma', a: '#ff7a3a', b: '#3a3a4a', ink: '#fff', wiki: 'E-102 Gamma' }
];

const BY_ID = new Map(ROSTER.map((entry) => [entry.id, entry]));

const WIKI_API = 'https://sonic.fandom.com/api.php';
const CACHE_KEY = 'sonicRosterPortraits';
const CACHE_MS = 7 * 24 * 3600 * 1000;
const portraits = {};
let portraitsLoad = null;

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && cached.v === 1 && Date.now() - cached.at < CACHE_MS && cached.map) return cached.map;
  } catch (error) {
    // Pas de cache utilisable : on redemande.
  }
  return null;
};

export const loadPortraits = () => {
  if (portraitsLoad) return portraitsLoad;
  const cached = readCache();
  if (cached) {
    Object.assign(portraits, cached);
    portraitsLoad = Promise.resolve(portraits);
    return portraitsLoad;
  }
  const titles = ROSTER.map((entry) => entry.wiki);
  const url = `${WIKI_API}?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=320&titles=${encodeURIComponent(titles.join('|'))}`;
  portraitsLoad = fetch(url)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const query = data?.query || {};
      const follow = (title) => {
        let current = title;
        (query.normalized || []).forEach((step) => { if (step.from === current) current = step.to; });
        (query.redirects || []).forEach((step) => { if (step.from === current) current = step.to; });
        return current;
      };
      const byTitle = {};
      Object.values(query.pages || {}).forEach((page) => {
        if (page?.title && page.thumbnail?.source) byTitle[page.title] = page.thumbnail.source;
      });
      ROSTER.forEach((entry) => {
        const source = byTitle[follow(entry.wiki)];
        if (source) portraits[entry.id] = source;
      });
      if (Object.keys(portraits).length) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, at: Date.now(), map: portraits }));
        } catch (error) {
          // Stockage indisponible : tant pis, on redemandera.
        }
      }
      return portraits;
    })
    .catch(() => portraits);
  return portraitsLoad;
};
export const rosterEntry = (id) => BY_ID.get(id) || null;

const initialsOf = (name) => {
  const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return String(words[0] || '?').slice(0, 2).toUpperCase();
};

// Les images en échec ne sont demandées qu'une fois par session.
const missing = new Set();
const base = process.env.PUBLIC_URL || '';

export const Avatar = ({ id, fallbackName = '', size = 56, className = '', title }) => {
  const entry = rosterEntry(id);
  const [failed, setFailed] = useState(null);
  const [, setLoaded] = useState(0);
  useEffect(() => {
    let alive = true;
    loadPortraits().then(() => { if (alive) setLoaded((value) => value + 1); });
    return () => { alive = false; };
  }, []);
  const source = entry ? (entry.img ? `${base}/roster/${id}.png` : portraits[id]) : null;
  const broken = !source || missing.has(source) || failed === source;
  const label = entry ? entry.name : fallbackName;
  const style = {
    '--av-a': entry ? entry.a : '#5f7bd6',
    '--av-b': entry ? entry.b : '#0a1f6b',
    '--av-ink': entry ? entry.ink : '#fff',
    width: size,
    height: size,
    fontSize: size
  };
  return (
    <span className={['ce-avatar', className].filter(Boolean).join(' ')} style={style} title={title || label}>
      <span className="ce-avatar-core">
        {broken && <span className="ce-avatar-initials">{initialsOf(label)}</span>}
        {!broken && (
          <img
            src={source}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              missing.add(source);
              setFailed(source);
            }}
          />
        )}
      </span>
    </span>
  );
};

// Grille de choix : les personnages pris par d'autres sont grisés avec le pseudo de celui qui l'a.
export const AvatarPicker = ({ takenBy = {}, mine, onPick }) => (
  <div className="ce-roster" role="listbox" aria-label="Choisis ton personnage">
    {ROSTER.map((entry) => {
      const owner = takenBy[entry.id];
      const isMine = entry.id === mine;
      const locked = Boolean(owner) && !isMine;
      return (
        <button
          key={entry.id}
          type="button"
          role="option"
          aria-selected={isMine}
          className={['ce-roster-slot', isMine ? 'is-mine' : '', locked ? 'is-taken' : ''].filter(Boolean).join(' ')}
          disabled={locked}
          onClick={() => !locked && !isMine && onPick(entry.id)}
          title={locked ? `${entry.name} · pris par ${owner}` : entry.name}
        >
          <Avatar id={entry.id} size={54} />
          <span className="ce-roster-name">{entry.name}</span>
          {locked && <span className="ce-roster-owner">{owner}</span>}
        </button>
      );
    })}
  </div>
);

// Pseudo → personnage, à partir de l'état public du salon.
export const avatarMap = (lobby) => {
  const map = {};
  (lobby?.players || []).forEach((entry) => {
    if (entry.avatar) map[entry.username] = entry.avatar;
  });
  if (lobby?.hostName && lobby.hostAvatar) map[lobby.hostName] = lobby.hostAvatar;
  return map;
};

export const takenByMap = (lobby) => {
  const map = {};
  (lobby?.players || []).forEach((entry) => {
    if (entry.avatar) map[entry.avatar] = entry.username;
  });
  if (lobby?.hostAvatar) map[lobby.hostAvatar] = lobby.hostName || 'le chef';
  return map;
};
