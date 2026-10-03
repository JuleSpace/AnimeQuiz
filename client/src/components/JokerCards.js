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
    rule: 'Change ta réponse une fois, tant que la question est ouverte.',
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
    rule: 'Vois les réponses, puis prends les points d\'un joueur.',
    accent: '#ff8787',
    ink: '#8a1c1c',
    paper: '#ffc9c9'
  }
};

const face = 'Impact, Haettenschweiler, Arial Black, sans-serif';

const Lines = () => (
  <g fill="none" stroke="#f4f6ff" strokeWidth="5" opacity="0.2" strokeLinecap="square">
    <path d="M6 18h62" />
    <path d="M6 34h40" />
    <path d="M98 96h56" />
    <path d="M118 110h36" />
  </g>
);

const Mark = ({ cardId }) => {
  const common = { viewBox: '0 0 160 120', 'aria-hidden': 'true' };
  if (cardId === 'double') {
    return (
      <svg {...common}>
        <Lines />
        <text x="34" y="86" fontSize="68" fontFamily={face} fill="#f4f6ff" stroke="#111318" strokeWidth="7" paintOrder="stroke">3</text>
        <g transform="rotate(-12 108 58)">
          <rect x="64" y="30" width="88" height="56" fill="#ffe14a" stroke="#111318" strokeWidth="5" />
          <text x="108" y="72" textAnchor="middle" fontSize="42" fontFamily={face} fill="#111318">×2</text>
        </g>
        <text x="132" y="114" textAnchor="middle" fontSize="28" fontFamily={face} fill="#ffe14a" stroke="#111318" strokeWidth="4" paintOrder="stroke">6</text>
      </svg>
    );
  }
  if (cardId === 'filet') {
    return (
      <svg {...common}>
        <Lines />
        <text x="80" y="34" textAnchor="middle" fontSize="30" fontFamily={face} fill="#f4f6ff" stroke="#111318" strokeWidth="4" paintOrder="stroke">0</text>
        <path d="M16 46h128" stroke="#111318" strokeWidth="5" />
        <path d="M22 46c12 52 104 52 116 0" fill="none" stroke="#39f0a0" strokeWidth="6" />
        <path d="M42 46c8 32 68 32 76 0" fill="none" stroke="#111318" strokeWidth="4" />
        <path d="M62 46c4 16 32 16 36 0" fill="none" stroke="#39f0a0" strokeWidth="4" />
        <text x="80" y="96" textAnchor="middle" fontSize="36" fontFamily={face} fill="#111318" stroke="#39f0a0" strokeWidth="7" paintOrder="stroke">½</text>
      </svg>
    );
  }
  if (cardId === 'seconde') {
    return (
      <svg {...common}>
        <Lines />
        <rect x="8" y="22" width="58" height="42" fill="#f4f6ff" stroke="#111318" strokeWidth="5" />
        <path d="M16 43h42" stroke="#ff4d6a" strokeWidth="6" />
        <path d="M72 44h16" stroke="#111318" strokeWidth="6" />
        <path d="M84 32l16 12-16 12z" fill="#3ecbff" stroke="#111318" strokeWidth="4" />
        <rect x="104" y="48" width="48" height="46" fill="#3ecbff" stroke="#111318" strokeWidth="5" />
        <path d="M114 64h28M114 76h18" stroke="#111318" strokeWidth="5" strokeLinecap="square" />
      </svg>
    );
  }
  if (cardId === 'copie') {
    return (
      <svg {...common}>
        <Lines />
        <rect x="8" y="18" width="50" height="70" fill="#f4f6ff" stroke="#111318" strokeWidth="5" />
        <path d="M18 38h30M18 52h30M18 66h20" stroke="#111318" strokeWidth="5" strokeLinecap="square" />
        <path d="M64 52h14" stroke="#111318" strokeWidth="6" />
        <path d="M74 40l16 12-16 12z" fill="#d7b4ff" stroke="#111318" strokeWidth="4" />
        <rect x="96" y="32" width="54" height="70" fill="#d7b4ff" stroke="#111318" strokeWidth="5" />
        <path d="M106 52h32M106 66h32M106 80h22" stroke="#3a1868" strokeWidth="5" strokeLinecap="square" />
      </svg>
    );
  }
  if (cardId === 'indice') {
    return (
      <svg {...common}>
        <Lines />
        <g transform="rotate(-10 50 52)">
          <path d="M12 24h78l-10 20 10 18H12z" fill="#ffe14a" stroke="#111318" strokeWidth="5" />
          <text x="46" y="58" textAnchor="middle" fontSize="26" fontFamily={face} fill="#111318">−1</text>
          <path d="M20 62h52" stroke="#ff4d6a" strokeWidth="5" />
        </g>
        <text x="118" y="90" textAnchor="middle" fontSize="62" fontFamily={face} fill="#ffe14a" stroke="#111318" strokeWidth="6" paintOrder="stroke">?</text>
      </svg>
    );
  }
  if (cardId === 'silence') {
    return (
      <svg {...common}>
        <Lines />
        <path d="M16 26h108c10 0 16 8 16 16v6c0 22-28 40-62 40S16 74 16 52V26z" fill="#f4f6ff" stroke="#111318" strokeWidth="5" />
        <path d="M78 22v82" stroke="#111318" strokeWidth="5" />
        {[34, 48, 62, 76].map((y) => (
          <path key={y} d={`M68 ${y}h20`} stroke="#111318" strokeWidth="4" />
        ))}
        <rect x="64" y="88" width="28" height="16" fill="#8eb6ff" stroke="#111318" strokeWidth="4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <Lines />
      <circle cx="34" cy="62" r="24" fill="#f4f6ff" stroke="#111318" strokeWidth="5" />
      <text x="34" y="72" textAnchor="middle" fontSize="28" fontFamily={face} fill="#111318">1</text>
      <path d="M62 62h26" stroke="#111318" strokeWidth="6" strokeDasharray="7 6" />
      <path d="M84 48l18 14-18 14z" fill="#ff5d6c" stroke="#111318" strokeWidth="4" />
      <circle cx="126" cy="62" r="28" fill="#ff5d6c" stroke="#111318" strokeWidth="5" />
      <text x="126" y="74" textAnchor="middle" fontSize="32" fontFamily={face} fill="#111318">1</text>
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
    <span>J</span>
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

const JOKER_DRAW = Object.keys(JOKERS);

export const BoosterPlayground = () => {
  const [pack, setPack] = useState(() => ({
    id: 1,
    card: JOKER_DRAW[Math.floor(Math.random() * JOKER_DRAW.length)]
  }));

  const again = () => {
    setPack((current) => ({
      id: current.id + 1,
      card: JOKER_DRAW[Math.floor(Math.random() * JOKER_DRAW.length)]
    }));
  };

  return (
    <div className="booster-play">
      <div style={{ textAlign: 'center' }}>
        <button type="button" className="btn" onClick={again}>Encore un booster</button>
      </div>
      <BoosterOpening key={pack.id} cardId={pack.card} />
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
      : joker.card === 'seconde'
        ? phase === 'answering' && !silenced
        : phase === 'answering' && !locked && !silenced
  );

  const play = (targetId) => {
    onPlay({ card: joker.card, targetId });
    setPicking(false);
  };

  let hint = card.rule;
  if (joker.used) hint = joker.note || 'Jouée';
  else if (silenced && joker.card !== 'vol') hint = 'Tu es réduit au silence.';
  else if (joker.card === 'vol' && phase === 'answering') hint = 'Après les réponses, tu verras les copies.';
  else if (joker.card === 'vol' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card === 'seconde' && phase === 'answering' && locked) hint = 'Tu peux encore changer ta réponse.';
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
