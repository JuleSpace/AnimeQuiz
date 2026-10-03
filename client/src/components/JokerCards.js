import React, { useEffect, useRef, useState } from 'react';

export const JOKERS = {
  double: {
    name: 'Double mise',
    rule: 'Les points du chef sont doublés.',
    accent: '#f5c542',
    ink: '#7a4b00',
    paper: '#ffe08a'
  },
  filet: {
    name: 'Filet',
    rule: 'Si tu as 0, prends la moitié des points.',
    accent: '#3ecf8e',
    ink: '#0d5c3d',
    paper: '#b8f5d6'
  },
  seconde: {
    name: 'Seconde main',
    rule: 'Modifie ta réponse une fois.',
    accent: '#4dabf7',
    ink: '#0b4f8a',
    paper: '#d0ebff'
  },
  copie: {
    name: 'Copie',
    rule: 'Vois la réponse d\'un autre joueur.',
    accent: '#b197fc',
    ink: '#4c2f96',
    paper: '#e5dbff'
  },
  indice: {
    name: 'Indice gratuit',
    rule: 'Un indice du chef, sans perdre de point.',
    accent: '#ffd43b',
    ink: '#7a5b00',
    paper: '#fff3bf'
  },
  silence: {
    name: 'Silence',
    rule: 'Un joueur ne peut plus répondre.',
    accent: '#91a7ff',
    ink: '#2b3f8f',
    paper: '#dbe4ff'
  },
  vol: {
    name: 'Vol',
    rule: 'Prends les points d\'un joueur.',
    accent: '#ff8787',
    ink: '#8a1c1c',
    paper: '#ffc9c9'
  }
};

const Mark = ({ cardId }) => {
  const common = { viewBox: '0 0 80 64', 'aria-hidden': 'true' };
  if (cardId === 'double') {
    return (
      <svg {...common}>
        <text x="40" y="46" textAnchor="middle" fontSize="40" fontWeight="800" fill="#1a1030">×2</text>
      </svg>
    );
  }
  if (cardId === 'filet') {
    return (
      <svg {...common}>
        <text x="40" y="24" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1a1030">0</text>
        <path d="M14 34h52" stroke="#1a1030" strokeWidth="3" />
        <path d="M18 34c6 16 38 16 44 0" fill="none" stroke="#1a1030" strokeWidth="3" />
        <path d="M28 34c3 8 21 8 24 0" fill="none" stroke="#1a1030" strokeWidth="3" />
      </svg>
    );
  }
  if (cardId === 'seconde') {
    return (
      <svg {...common}>
        <rect x="18" y="16" width="28" height="18" rx="3" fill="#fff" stroke="#1a1030" strokeWidth="3" />
        <path d="M50 30h14M58 24l8 6-8 6" fill="none" stroke="#1a1030" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="32" width="28" height="18" rx="3" fill="#d0ebff" stroke="#1a1030" strokeWidth="3" />
      </svg>
    );
  }
  if (cardId === 'copie') {
    return (
      <svg {...common}>
        <rect x="10" y="14" width="26" height="22" rx="4" fill="#fff" stroke="#1a1030" strokeWidth="3" />
        <path d="M40 25h8M44 21l6 4-6 4" fill="none" stroke="#1a1030" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="48" y="28" width="26" height="22" rx="4" fill="#e5dbff" stroke="#1a1030" strokeWidth="3" />
      </svg>
    );
  }
  if (cardId === 'indice') {
    return (
      <svg {...common}>
        <text x="40" y="46" textAnchor="middle" fontSize="42" fontWeight="800" fill="#1a1030">?</text>
      </svg>
    );
  }
  if (cardId === 'silence') {
    return (
      <svg {...common}>
        <path d="M16 40c0-12 10-20 24-20s24 8 24 20v4H16z" fill="#fff" stroke="#1a1030" strokeWidth="3" />
        <path d="M22 18l36 28" stroke="#1a1030" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="24" cy="32" r="10" fill="#fff" stroke="#1a1030" strokeWidth="3" />
      <path d="M38 32h16M48 26l8 6-8 6" fill="none" stroke="#1a1030" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="32" r="10" fill="#ffd0d0" stroke="#1a1030" strokeWidth="3" />
    </svg>
  );
};

export const JokerCard = ({ cardId, used = false, size = 'full' }) => {
  const card = JOKERS[cardId];
  if (!card) return null;

  return (
    <article
      className={`tcg-card tcg-${size} ${used ? 'is-used' : ''}`}
      style={{ '--tcg-accent': card.accent, '--tcg-paper': card.paper, '--tcg-ink': card.ink }}
    >
      <div className="tcg-name">{card.name}</div>
      <div className="tcg-art">
        <Mark cardId={cardId} />
      </div>
      {size === 'full' && <p className="tcg-rule">{card.rule}</p>}
      {used && <div className="tcg-stamp">Jouée</div>}
    </article>
  );
};

const CardBack = () => (
  <div className="card-back" aria-hidden="true">
    <div className="card-back-diamond" />
  </div>
);

export const BoosterOpening = ({ cardId }) => {
  const [stage, setStage] = useState('sealed');
  const timers = useRef([]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
  }, []);

  const openPack = () => {
    if (stage !== 'sealed' || !cardId) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStage('show');
      return;
    }
    const wait = (next, ms) => {
      timers.current.push(setTimeout(() => setStage(next), ms));
    };
    setStage('shake');
    wait('tear', 320);
    wait('pull', 980);
    wait('flip', 2050);
    wait('show', 2850);
  };

  const card = JOKERS[cardId];
  let caption = 'Clique sur le booster pour le déchirer';
  if (!cardId) caption = 'Le booster arrive...';
  else if (stage === 'shake' || stage === 'tear') caption = 'Ça se déchire...';
  else if (stage === 'pull') caption = 'Une carte sort du paquet';
  else if (stage === 'flip' || stage === 'show') caption = card ? `${card.name} — ${card.rule}` : '';

  return (
    <div className={`pack-scene is-${stage}`}>
      <div className="pack-stage">
        <div className="sleeve">
          <div className="rising-card">
            <div className="rising-inner">
              <CardBack />
              <div className="rising-front">
                {cardId && <JokerCard cardId={cardId} size="full" />}
              </div>
            </div>
          </div>
        </div>
        <button type="button" className="pack" onClick={openPack} disabled={stage !== 'sealed'}>
          <span className="pack-top">
            <span className="pack-perf" />
          </span>
          <span className="pack-body">
            <span className="pack-label">
              <strong>JOKERS</strong>
              <em>1 carte</em>
            </span>
          </span>
        </button>
      </div>
      <p className="booster-caption">{caption}</p>
    </div>
  );
};

export const HostJokerBoard = ({ players }) => {
  const rows = players || [];

  return (
    <div className="host-jokers">
      <div className="host-jokers-title">Mains des joueurs</div>
      {rows.length === 0 && <p className="host-jokers-empty">Aucune carte pour l'instant.</p>}
      <div className="host-jokers-row">
        {rows.map((entry) => {
          const joker = entry.joker;
          return (
            <div key={entry.id} className="host-joker-slot">
              {joker ? (
                <JokerCard cardId={joker.card} used={joker.used} size="mini" />
              ) : (
                <div className="tcg-empty">Sans carte</div>
              )}
              <div className="host-joker-meta">
                <strong>{entry.username}</strong>
                <span>{joker ? (joker.used ? 'Jouée' : 'En main') : '—'}</span>
                {joker?.note && joker.note !== 'En main' && <span>{joker.note}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const needsTarget = (cardId) => cardId === 'copie' || cardId === 'silence' || cardId === 'vol';

export const PlayerJokerBar = ({
  joker,
  phase,
  questionIndex,
  locked,
  players,
  selfId,
  silenced,
  canRedo,
  onPlay,
  onRedo
}) => {
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    setPicking(false);
  }, [questionIndex, phase, joker?.used]);

  if (!joker?.card || !JOKERS[joker.card]) return null;

  const card = JOKERS[joker.card];
  const targets = (players || []).filter((entry) => entry.id !== selfId);
  const onThisQuestion = joker.used && joker.usedOn === questionIndex;
  const canPlay = !joker.used && (
    joker.card === 'vol'
      ? phase === 'hold'
      : phase === 'answering' && !locked && !silenced
  );

  const play = (targetId) => {
    onPlay({ card: joker.card, targetId });
    setPicking(false);
  };

  let hint = card.rule;
  if (joker.used) hint = joker.note || 'Jouée';
  else if (silenced && joker.card !== 'vol') hint = 'Tu es réduit au silence.';
  else if (joker.card === 'vol' && phase === 'answering') hint = 'Après les réponses, avant les points.';
  else if (joker.card === 'vol' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card !== 'vol' && phase === 'answering' && locked) hint = 'Il fallait la jouer avant de répondre.';
  else if (joker.card !== 'vol' && phase !== 'answering') hint = 'Trop tard pour cette question.';

  return (
    <div className="player-joker">
      <JokerCard cardId={joker.card} used={joker.used} size="hand" />
      <div className="player-joker-body">
        {hint !== card.rule && <p>{hint}</p>}
        {canPlay && !needsTarget(joker.card) && (
          <button type="button" className="joker-chip" onClick={() => play(null)}>
            Jouer
          </button>
        )}
        {canPlay && needsTarget(joker.card) && (
          <button
            type="button"
            className="joker-chip"
            disabled={targets.length === 0}
            onClick={() => setPicking((open) => !open)}
          >
            {targets.length === 0 ? 'Personne à viser' : (picking ? 'Annuler' : 'Choisir')}
          </button>
        )}
        {canRedo && (
          <button type="button" className="joker-chip joker-chip-alt" onClick={onRedo}>
            Modifier
          </button>
        )}
        {onThisQuestion && joker.targetName && (
          <div className="player-joker-target">Cible : {joker.targetName}</div>
        )}
        {picking && (
          <div className="joker-targets">
            {targets.map((entry) => (
              <button key={entry.id} type="button" className="joker-chip joker-chip-alt" onClick={() => play(entry.id)}>
                {entry.username}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
