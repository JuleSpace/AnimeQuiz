import React, { useEffect, useRef, useState } from 'react';
import Icon from './ArcadeIcon';

export const JOKERS = {
  double: {
    name: 'Double mise',
    rule: 'Les points du chef sont doublés.',
    accent: '#ff2347',
    mate: '#1f6dff'
  },
  filet: {
    name: 'Filet',
    rule: 'La moyenne des autres, ou tes points s’ils sont plus hauts.',
    accent: '#1f6dff',
    mate: '#ff2347'
  },
  seconde: {
    name: 'Seconde main',
    rule: 'Change ta réponse une fois, tant que la question est ouverte.',
    accent: '#ff2347',
    mate: '#1f6dff'
  },
  copie: {
    name: 'Copie',
    rule: 'Vois la réponse d\'un autre joueur.',
    accent: '#1f6dff',
    mate: '#ff2347'
  },
  indice: {
    name: 'Indice gratuit',
    rule: 'Un indice du chef, sans perdre de point.',
    accent: '#ff2347',
    mate: '#1f6dff'
  },
  silence: {
    name: 'Silence',
    rule: 'Un joueur ne peut plus répondre.',
    accent: '#1f6dff',
    mate: '#ff2347'
  },
  vol: {
    name: 'Vol',
    rule: 'Vois les réponses, puis prends les points d\'un joueur.',
    accent: '#ff2347',
    mate: '#1f6dff'
  }
};

const CARD_ART = {
  double: '/double.png',
  filet: '/filet.png?v=2',
  seconde: '/seconde.png',
  copie: '/copie.png',
  indice: '/indice.png',
  silence: '/silence-faker.png',
  vol: '/vol.png'
};

const Mark = ({ cardId }) => {
  const src = CARD_ART[cardId];
  if (!src) return null;
  const fit = cardId !== 'silence';
  return <img className={fit ? 'tcg-photo tcg-photo-fit' : 'tcg-photo'} src={src} alt="" />;
};

export const JokerCard = ({ cardId, used = false, size = 'full' }) => {
  const card = JOKERS[cardId];
  if (!card) return null;

  return (
    <article
      className={`tcg-card tcg-${size} ${used ? 'is-used' : ''}`}
      style={{ '--tcg-accent': card.accent, '--tcg-mate': card.mate }}
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
        <button type="button" className="btn" onClick={again}><Icon name="booster" />Encore un booster</button>
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
            <Icon name="play" />Jouer
          </button>
        )}
        {canPlay && needsTarget(joker.card) && (
          <button
            type="button"
            className="joker-chip"
            disabled={targets.length === 0}
            onClick={() => setPicking((open) => !open)}
          >
            {targets.length === 0 ? 'Personne à viser' : (picking ? <><Icon name="cross" />Annuler</> : <><Icon name="search" />Choisir</>)}
          </button>
        )}
        {canRedo && (
          <button type="button" className="joker-chip joker-chip-alt" onClick={onRedo}>
            <Icon name="pencil" />Modifier
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
