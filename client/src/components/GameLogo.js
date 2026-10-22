import React from 'react';
import './GameLogo.css';

/*
 * Logos des jeux, dessinés en CSS : un lettrage façon Pokémon (lettres jaunes cerclées de bleu, en arc)
 * posé sur un décor dans la direction artistique de chaque jeu.
 * Le logo remplit son conteneur (unités cqw), quel que soit son format.
 */
const LOGOS = {
  quiz: { top: 'Bully’s', main: 'Lair', tag: 'Quiz entre potes', emblem: 'quiz' },
  arena: { top: 'Poké Bully', main: 'Tactics', tag: 'Auto-battler', emblem: 'crown' },
  swarm: { top: 'Poké', main: 'Swarm', tag: 'Survivor', emblem: 'ball' },
  rush: { top: 'Poké', main: 'Rush', tag: '3D', emblem: 'ball' },
  bonk: { top: 'Sonic', main: 'Bonk', tag: 'Green Hill', emblem: 'ring' },
  cards: { top: 'Atelier des', main: 'Cartes', tag: 'Jokers', emblem: 'cards' },
  academy: { top: 'Cobblemon', main: 'Academy', tag: 'Guide', emblem: 'book' }
};

/** Lettres en arc : plus grandes au centre, base alignée, comme le logo Pokémon. */
const Arc = ({ text, size }) => {
  const chars = [...text];
  const m = Math.max(1, (chars.length - 1) / 2);
  return (
    <span className="gl-main">
      {chars.map((ch, i) => {
        const k = Math.abs(i - (chars.length - 1) / 2) / m;
        return <span key={i} style={{ fontSize: `${(size * (1 + 0.28 * (1 - k * k))).toFixed(2)}cqw` }}>{ch}</span>;
      })}
    </span>
  );
};

const Emblem = ({ kind }) => {
  if (kind === 'ball') return <span className="gl-emblem gl-ball" />;
  if (kind === 'ring') return <span className="gl-emblem gl-ring" />;
  if (kind === 'crown') return <span className="gl-emblem gl-crown"><span className="gl-ball" /></span>;
  if (kind === 'quiz') return <span className="gl-emblem gl-quiz">?</span>;
  if (kind === 'cards') return <span className="gl-emblem gl-cardfan"><i /><i /><i /></span>;
  if (kind === 'book') return <span className="gl-emblem gl-book"><i /><i /></span>;
  return null;
};

const GameLogo = ({ id, className = '' }) => {
  const L = LOGOS[id] || { top: '', main: id, emblem: 'ball' };
  const len = [...L.main].length;
  const size = Math.min(22, 92 / Math.max(3, len) * 0.95);
  return (
    <span className={`gl-root is-${id} ${className}`} aria-hidden="true">
      <span className="gl-bg" />
      <Emblem kind={L.emblem} />
      <span className="gl-word">
        {L.top && <span className="gl-top">{L.top}</span>}
        <Arc text={L.main} size={size} />
        {L.tag && <span className="gl-tag">{L.tag}</span>}
      </span>
    </span>
  );
};

export default GameLogo;
