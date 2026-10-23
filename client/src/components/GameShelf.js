import React, { useRef } from 'react';
import { GAMES as ALL_GAMES } from './showcase';
import GameLogo from './GameLogo';
import './GameShelf.css';

export const GAMES_HASH = '#jeux';
// L'atelier des cartes reste accessible depuis le quiz ; la ludothèque ne montre que les jeux
const GAMES = ALL_GAMES.filter((g) => g.id !== 'cards');

// Ce qui fait office de « PV » et de type d'énergie sur chaque carte
const CARD_META = {
  quiz: { stage: 'Multijoueur', hp: '12', unit: 'J', glyph: '?', players: '2 – 12', time: '20 min' },
  arena: { stage: 'Stratégie', hp: '32', unit: 'ÉT.', glyph: '♛', players: 'Solo · 8', time: '30 min' },
  swarm: { stage: 'Survie', hp: '9', unit: 'MIN', glyph: '★', players: 'Solo', time: '10 min' },
  rush: { stage: 'Action 3D', hp: '8', unit: 'MIN', glyph: '●', players: 'Solo', time: '9 min' },
  bonk: { stage: 'Action 3D', hp: '8', unit: 'MIN', glyph: '◎', players: 'Solo', time: '8 min' },
  prairie: { stage: 'Idle', hp: '1025', unit: 'POKÉ', glyph: '✿', players: 'Solo', time: '2 min' }
};
const DEFAULT_META = { stage: 'Jeu', hp: '', unit: '', glyph: '●', players: 'Solo', time: '—' };

const RARITY_MARK = { Légendaire: '★', Rare: '◆', 'Peu commune': '▲', Commune: '●' };

/** Une carte de jeu façon TCG : inclinaison 3D et reflet holographique qui suivent la souris. */
export const GameCard = ({ game, index, total, onOpen }) => {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  };
  const holo = game.rarity === 'Légendaire' || game.rarity === 'Rare';
  const meta = CARD_META[game.id] || DEFAULT_META;
  return (
    <button
      ref={ref}
      type="button"
      className={`gs-card${holo ? ' is-holo' : ''}`}
      style={{ '--c': game.color, '--i': index }}
      onPointerMove={move}
      onPointerLeave={leave}
      onClick={() => onOpen(game)}
      aria-label={`Jouer à ${game.title}`}
    >
      <span className="gs-face">
        <span className="gs-top">
          <small className="gs-stage">{meta.stage}</small>
          <b>{game.title}</b>
          <span className="gs-hp"><small>{meta.unit}</small>{meta.hp}<i className="gs-energy" aria-hidden="true">{meta.glyph}</i></span>
        </span>
        <span className="gs-art">
          <GameLogo id={game.id} />
          <span className="gs-shine" aria-hidden="true" />
        </span>
        <span className="gs-strip">N° {String(index + 1).padStart(3, '0')} · {game.subtitle}</span>
        <span className="gs-moves">
          {game.moves.map(([label, value], k) => (
            <span key={label} className="gs-move">
              <span className="gs-cost" aria-hidden="true">{Array.from({ length: k + 1 }, (_, n) => <i key={n}>{meta.glyph}</i>)}</span>
              <span>{label}</span>
              <strong>{value}</strong>
            </span>
          ))}
        </span>
        <span className="gs-stats">
          <span><small>Joueurs</small><b>{meta.players}</b></span>
          <span><small>Partie</small><b>{meta.time}</b></span>
          <span><small>Rareté</small><b>{RARITY_MARK[game.rarity] || '●'}</b></span>
        </span>
        <span className="gs-foot">
          <span>{String(index + 1).padStart(3, '0')}/{String(total).padStart(3, '0')} {RARITY_MARK[game.rarity] || '●'} {game.rarity}</span>
          <span>Illus. Bully’s Lair</span>
        </span>
      </span>
      <span className="gs-play">Jouer →</span>
    </button>
  );
};

const GameShelf = ({ onClose, onOpen, onPortfolio }) => (
  <div className="gs-root">
    <div className="gs-bar">
      <button type="button" className="gs-btn is-back" onClick={onClose}>← Retour</button>
      <button type="button" className="gs-btn" onClick={onPortfolio}>Portfolio</button>
    </div>
    <header className="gs-head">
      <span className="gs-kicker">Bully’s Lair · ludothèque</span>
      <h1>Choisis ta carte</h1>
      <p>{GAMES.length} jeux à collectionner. Clique sur une carte pour jouer.</p>
    </header>
    <div className="gs-grid" style={{ '--n': GAMES.length }}>
      {GAMES.map((g, i) => (
        <div key={g.id} className="gs-slot" style={{ '--k': i - (GAMES.length - 1) / 2 }}>
          <GameCard game={g} index={i} total={GAMES.length} onOpen={onOpen} />
        </div>
      ))}
    </div>
  </div>
);

export default GameShelf;
