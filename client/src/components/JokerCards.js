import React, { useEffect, useState } from 'react';

export const JOKERS = {
  double: {
    name: 'Double mise',
    rule: 'Les points du chef sont doublés.',
    accent: '#ffd700'
  },
  filet: {
    name: 'Filet',
    rule: 'Si tu as 0, prends la moitié des points de la question.',
    accent: '#51cf66'
  },
  seconde: {
    name: 'Seconde main',
    rule: 'Modifie ta réponse une fois.',
    accent: '#74c0fc'
  },
  copie: {
    name: 'Copie',
    rule: 'Vois la réponse d\'un joueur avant d\'envoyer la tienne.',
    accent: '#b197fc'
  },
  indice: {
    name: 'Indice gratuit',
    rule: 'Un indice du chef, sans perdre de point.',
    accent: '#ffd43b'
  },
  silence: {
    name: 'Silence',
    rule: 'Un joueur ne peut plus répondre.',
    accent: '#748ffc'
  },
  vol: {
    name: 'Vol',
    rule: 'Prends les points d\'un joueur avant la correction.',
    accent: '#ff6b6b'
  }
};

export const JokerCard = ({ cardId, used = false, size = 'full' }) => {
  const card = JOKERS[cardId];
  if (!card) return null;

  return (
    <article
      className={`tcg-card tcg-${size} ${used ? 'is-used' : ''}`}
      style={{ '--tcg-accent': card.accent }}
    >
      <div className="tcg-art">
        <img src={`/jokers/${cardId}.jpg`} alt="" />
        <div className="tcg-foil" />
      </div>
      <div className="tcg-plate">
        <div className="tcg-kicker">Joker</div>
        <h3>{card.name}</h3>
        {size !== 'mini' && <p>{card.rule}</p>}
      </div>
      {used && <div className="tcg-stamp">Jouée</div>}
    </article>
  );
};

export const BoosterOpening = ({ cardId }) => {
  const [stage, setStage] = useState(cardId ? 'drop' : 'wait');

  useEffect(() => {
    if (!cardId) {
      setStage('wait');
      return undefined;
    }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStage('show');
      return undefined;
    }
    setStage('drop');
    const timers = [
      setTimeout(() => setStage('shake'), 650),
      setTimeout(() => setStage('burst'), 1550),
      setTimeout(() => setStage('flip'), 2300),
      setTimeout(() => setStage('show'), 3400)
    ];
    return () => timers.forEach(clearTimeout);
  }, [cardId]);

  const card = JOKERS[cardId];

  return (
    <div className={`booster-scene stage-${stage}`}>
      <div className="booster-pack" aria-hidden="true">
        <span>Booster</span>
      </div>
      <div className="booster-burst" aria-hidden="true" />
      {cardId && (
        <div className="booster-flip">
          <JokerCard cardId={cardId} size="full" />
        </div>
      )}
      <p className="booster-caption">
        {stage === 'show' && card
          ? `${card.name} — ${card.rule}`
          : 'Ouverture du booster...'}
      </p>
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
  else if (joker.card === 'vol' && phase === 'answering') hint = 'Se joue quand les réponses sont closes, avant les points.';
  else if (joker.card === 'vol' && phase !== 'hold') hint = 'Trop tard pour cette question.';
  else if (joker.card !== 'vol' && phase === 'answering' && locked) hint = 'Il fallait la jouer avant de répondre.';
  else if (joker.card !== 'vol' && phase !== 'answering') hint = 'Trop tard pour cette question.';

  return (
    <div className="player-joker">
      <JokerCard cardId={joker.card} used={joker.used} size="hand" />
      <div className="player-joker-body">
        <strong>{card.name}</strong>
        <p>{hint}</p>
        {canPlay && !needsTarget(joker.card) && (
          <button type="button" className="btn btn-success" onClick={() => play(null)}>
            Jouer
          </button>
        )}
        {canPlay && needsTarget(joker.card) && (
          <button
            type="button"
            className="btn btn-success"
            disabled={targets.length === 0}
            onClick={() => setPicking((open) => !open)}
          >
            {targets.length === 0 ? 'Personne à viser' : (picking ? 'Annuler' : 'Choisir une cible')}
          </button>
        )}
        {canRedo && (
          <button type="button" className="btn" onClick={onRedo}>
            Modifier ma réponse
          </button>
        )}
        {onThisQuestion && joker.targetName && (
          <div className="player-joker-target">Cible : {joker.targetName}</div>
        )}
        {picking && (
          <div className="joker-targets">
            {targets.map((entry) => (
              <button key={entry.id} type="button" className="btn" onClick={() => play(entry.id)}>
                {entry.username}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
