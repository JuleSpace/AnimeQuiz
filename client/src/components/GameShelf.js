import React, { useRef } from 'react';
import { GAMES } from './showcase';
import GameLogo from './GameLogo';
import './GameShelf.css';

export const GAMES_HASH = '#jeux';

const RARITY_MARK = { Légendaire: '★', Rare: '◆', 'Peu commune': '▲', Commune: '●' };

/** Une carte de jeu façon TCG : inclinaison 3D et reflet holographique qui suivent la souris. */
const GameCard = ({ game, index, total, onOpen }) => {
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
          <b>{game.title}</b>
          <em>{game.genre.split(' · ')[0]}</em>
        </span>
        <span className="gs-art">
          <GameLogo id={game.id} />
          <span className="gs-shine" aria-hidden="true" />
        </span>
        <span className="gs-strip">{game.subtitle}</span>
        <span className="gs-moves">
          {game.moves.map(([label, value]) => (
            <span key={label} className="gs-move">
              <i aria-hidden="true" />
              <span>{label}</span>
              <strong>{value}</strong>
            </span>
          ))}
        </span>
        <span className="gs-flavor">{game.pitch}</span>
        <span className="gs-foot">
          <span>{String(index + 1).padStart(3, '0')}/{String(total).padStart(3, '0')} {RARITY_MARK[game.rarity] || '●'}</span>
          <span>{game.tech.slice(0, 2).join(' · ')}</span>
        </span>
      </span>
      <span className="gs-play">Jouer →</span>
    </button>
  );
};

const GameShelf = ({ onClose, onOpen, onPortfolio }) => (
  <div className="gs-root">
    <header className="gs-head">
      <div>
        <span className="gs-kicker">Bully’s Lair · ludothèque</span>
        <h1>Choisis ta carte</h1>
        <p>Tous les jeux du site, en cartes à collectionner. Passe la souris dessus, clique pour jouer.</p>
      </div>
      <div className="gs-head-actions">
        <button type="button" className="gs-btn" onClick={onPortfolio}>Portfolio</button>
        <button type="button" className="gs-btn is-back" onClick={onClose}>Retour</button>
      </div>
    </header>
    <div className="gs-grid">
      {GAMES.map((g, i) => <GameCard key={g.id} game={g} index={i} total={GAMES.length} onOpen={onOpen} />)}
    </div>
  </div>
);

export default GameShelf;
