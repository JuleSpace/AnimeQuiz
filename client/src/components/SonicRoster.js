import React, { useState } from 'react';

// Roster des personnages de l'univers Sonic. Les identifiants doivent rester alignés sur AVATAR_IDS (quiz.js).
// Chaque jeton est un médaillon aux couleurs du personnage. Pour mettre une vraie image,
// déposer client/public/roster/<id>.png (carré, 256 px conseillé) et ajouter img: true à son entrée :
// l'image remplace alors le médaillon (sans img: true, aucune requête n'est faite).
export const ROSTER = [
  { id: 'sonic', name: 'Sonic', a: '#1f6dff', b: '#0a2a9e', ink: '#fff' },
  { id: 'tails', name: 'Tails', a: '#ffb02e', b: '#e07000', ink: '#fff' },
  { id: 'knuckles', name: 'Knuckles', a: '#ff3b4e', b: '#a3001a', ink: '#fff' },
  { id: 'amy', name: 'Amy', a: '#ff7ac0', b: '#d6247c', ink: '#fff' },
  { id: 'cream', name: 'Cream', a: '#ffe0a8', b: '#f08a24', ink: '#5a2a00' },
  { id: 'big', name: 'Big', a: '#b48cff', b: '#5b3fc4', ink: '#fff' },
  { id: 'shadow', name: 'Shadow', a: '#2a2d3a', b: '#ff2347', ink: '#fff' },
  { id: 'rouge', name: 'Rouge', a: '#f2f2ff', b: '#d61f6e', ink: '#7a0036' },
  { id: 'omega', name: 'Omega', a: '#ff4b3a', b: '#2a2d3a', ink: '#ffd23a' },
  { id: 'eggman', name: 'Eggman', a: '#ff5a3a', b: '#7a1a00', ink: '#ffd23a' },
  { id: 'metal', name: 'Metal Sonic', a: '#6f8bd6', b: '#1d2b66', ink: '#ff3b4e' },
  { id: 'chaos', name: 'Chaos', a: '#8ff2ff', b: '#1a8fb8', ink: '#0a3a66' },
  { id: 'tikal', name: 'Tikal', a: '#ffb36b', b: '#c8541a', ink: '#fff' },
  { id: 'silver', name: 'Silver', a: '#e4f2ff', b: '#3ec9d6', ink: '#0a3a66' },
  { id: 'blaze', name: 'Blaze', a: '#a57bff', b: '#ff5a1f', ink: '#fff' },
  { id: 'espio', name: 'Espio', a: '#c46bff', b: '#5a1a8a', ink: '#ffd23a' },
  { id: 'vector', name: 'Vector', a: '#3ddc84', b: '#0d7a3f', ink: '#fff' },
  { id: 'charmy', name: 'Charmy', a: '#ffe14a', b: '#1d1d1d', ink: '#1d1d1d' },
  { id: 'jet', name: 'Jet', a: '#3ddc84', b: '#ff8a00', ink: '#fff' },
  { id: 'wave', name: 'Wave', a: '#b48cff', b: '#3a1a8a', ink: '#fff' },
  { id: 'storm', name: 'Storm', a: '#c9c9d6', b: '#4a4a5a', ink: '#fff' },
  { id: 'marine', name: 'Marine', a: '#ffcf6b', b: '#1f8fff', ink: '#fff' },
  { id: 'sticks', name: 'Sticks', a: '#ffaa4a', b: '#7a3a00', ink: '#fff' },
  { id: 'mighty', name: 'Mighty', a: '#ff3b4e', b: '#1d1d1d', ink: '#fff' },
  { id: 'ray', name: 'Ray', a: '#ffe14a', b: '#d68a00', ink: '#5a2a00' },
  { id: 'infinite', name: 'Infinite', a: '#3a3a4a', b: '#b8002e', ink: '#fff' },
  { id: 'maria', name: 'Maria', a: '#fff1a8', b: '#5aa8ff', ink: '#0a1f6b' },
  { id: 'gamma', name: 'Gamma', a: '#ff7a3a', b: '#3a3a4a', ink: '#fff' }
];

const BY_ID = new Map(ROSTER.map((entry) => [entry.id, entry]));
export const rosterEntry = (id) => BY_ID.get(id) || null;

const initialsOf = (name) => {
  const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return String(words[0] || '?').slice(0, 2).toUpperCase();
};

// Les images absentes ne sont demandées qu'une fois par session.
const missing = new Set();
const base = process.env.PUBLIC_URL || '';

export const Avatar = ({ id, fallbackName = '', size = 56, className = '', title }) => {
  const entry = rosterEntry(id);
  const [failed, setFailed] = useState(null);
  const broken = !entry || !entry.img || missing.has(id) || failed === id;
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
        <span className="ce-avatar-initials">{initialsOf(label)}</span>
        {!broken && (
          <img
            src={`${base}/roster/${id}.png`}
            alt=""
            onError={() => {
              missing.add(id);
              setFailed(id);
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
