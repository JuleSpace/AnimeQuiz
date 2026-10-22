import React, { useEffect, useState } from 'react';
import { AccountChip, fetchLeaderboard } from './account';
import { PROJECTS } from './showcase';
import Icon from './ArcadeIcon';
import GameLogo from './GameLogo';
import './HubHome.css';

/** Accueil après connexion : le quiz entre potes, les jeux avec tes records, et les meilleurs scores du serveur. */

const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const maxScore = (obj) => Math.max(0, ...Object.values(obj || {}).map((v) => v?.score || 0));
const myBest = {
  swarm: () => maxScore(read('poke-swarm-best')),
  rush: () => maxScore(read('poke-rush-meta')?.best),
  arena: () => read('poke-arena-record')?.bestScore || 0,
  bonk: () => maxScore(read('sonic-bonk-best'))
};
const GAME_IDS = ['swarm', 'rush', 'arena', 'bonk'];
const LB_GAME = { swarm: 'swarm', rush: 'rush', arena: 'arena', bonk: 'bonk' };
const fr = (n) => Math.round(n || 0).toLocaleString('fr-FR');
const hello = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Encore debout' : h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir';
};

const HubHome = ({ name, onQuiz, onMusic, onGame, onAdmin, onPortfolio, onShelf }) => {
  const games = GAME_IDS.map((id) => PROJECTS.find((p) => p.id === id)).filter(Boolean);
  const extra = PROJECTS.filter((p) => !['quiz', 'cards', ...GAME_IDS].includes(p.id));
  const quiz = PROJECTS.find((p) => p.id === 'quiz');
  const [boards, setBoards] = useState({});
  useEffect(() => {
    let alive = true;
    GAME_IDS.forEach((id) => fetchLeaderboard(LB_GAME[id], 1).then((b) => { if (alive) setBoards((cur) => ({ ...cur, [id]: b?.score || [] })); }));
    return () => { alive = false; };
  }, []);
  const best = Object.fromEntries(GAME_IDS.map((id) => [id, myBest[id]()]));
  const rankOf = (id) => {
    const i = (boards[id] || []).findIndex((r) => r.name === name);
    return i >= 0 ? i + 1 : null;
  };

  return (
    <div className="hub">
      <header className="hub-top">
        <span className="hub-brand">Bully’s <b>Lair</b></span>
        <nav className="hub-nav">
          <button type="button" className="hub-link" onClick={onShelf}><Icon name="pad" />Ludothèque</button>
          <button type="button" className="hub-link" onClick={onPortfolio}>Portfolio</button>
          <AccountChip returnHash="" />
          <button type="button" className="hub-admin" onClick={onAdmin} title="Espace admin"><Icon name="lock" /></button>
        </nav>
      </header>

      <section className="hub-hero">
        <div className="hub-hello">
          <span className="hub-kicker">Bienvenue au repaire</span>
          <h1>{hello()}, <em>{name}</em> !</h1>
          <p>Lance un quiz avec tes potes, ou fais monter ton score dans les jeux. Tes records te suivent sur ton compte.</p>
          <div className="hub-cta">
            <button type="button" className="hub-btn is-gold" onClick={onQuiz}><Icon name="quiz" />Lancer un quiz</button>
            <button type="button" className="hub-btn is-white" onClick={onMusic}><Icon name="music" />Music Quiz</button>
          </div>
        </div>
        <div className="hub-fan" aria-hidden="true">
          {[games[1], quiz, games[0]].filter(Boolean).map((g, i) => (
            <span key={g.id} className="hub-fan-card" style={{ '--i': i - 1, '--c': g.color }}><span className="hub-fan-logo"><GameLogo id={g.id} /></span></span>
          ))}
        </div>
      </section>

      <section className="hub-section">
        <h2 className="hub-h2"><span>Entre potes</span>Les quiz</h2>
        <div className="hub-modes">
          <button type="button" className="hub-mode is-quiz" onClick={onQuiz}>
            <span className="hub-mode-logo"><GameLogo id="quiz" /></span>
            <span className="hub-mode-text">
              <b><Icon name="quiz" />Quiz</b>
              <small>Choix multiples, images, vidéos, vrai/faux, texte libre… et les cartes jokers pour saboter tes potes.</small>
              <em>Choisir un quiz →</em>
            </span>
          </button>
          <button type="button" className="hub-mode is-music" onClick={onMusic}>
            <span className="hub-mode-eq" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--k': i }} />)}</span>
            <span className="hub-mode-text">
              <b><Icon name="music" />Music Quiz</b>
              <small>Extraits masqués : tout le monde écrit sa réponse, le chef corrige.</small>
              <em>Créer ou rejoindre une salle →</em>
            </span>
          </button>
        </div>
      </section>

      <section className="hub-section">
        <h2 className="hub-h2"><span>Solo · records en ligne</span>Les jeux</h2>
        <div className="hub-games">
          {games.map((g, i) => {
            const r = rankOf(g.id);
            return (
              <button key={g.id} type="button" className="hub-game" style={{ '--c': g.color, '--i': i }} onClick={() => onGame(g)}>
                <span className="hub-game-art"><GameLogo id={g.id} /></span>
                <span className="hub-game-body">
                  <small>{g.subtitle}</small>
                  <b>{g.title}</b>
                  <span className="hub-game-stats">
                    <span>Ton record <strong>{best[g.id] ? `${fr(best[g.id])} pts` : '—'}</strong></span>
                    {r && <span className="hub-rank">#{r} mondial</span>}
                  </span>
                </span>
                <span className="hub-play">Jouer</span>
              </button>
            );
          })}
        </div>
        {extra.length > 0 && (
          <div className="hub-extras">
            {extra.map((g) => (
              <button key={g.id} type="button" className="hub-extra" style={{ '--c': g.color }} onClick={() => onGame(g)}>
                <span className="hub-extra-logo"><GameLogo id={g.id} /></span><span><b>{g.title}</b><small>{g.subtitle}</small></span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="hub-section">
        <h2 className="hub-h2"><span>Meilleurs scores du serveur</span>Classements</h2>
        <div className="hub-boards">
          {games.map((g) => {
            const rows = (boards[g.id] || []).slice(0, 3);
            return (
              <article key={g.id} className="hub-board" style={{ '--c': g.color }}>
                <header><b>{g.title}</b><button type="button" onClick={() => onGame(g)}>Jouer</button></header>
                {!boards[g.id] && <p className="hub-empty">Chargement…</p>}
                {boards[g.id] && !rows.length && <p className="hub-empty">Personne encore : prends la première place !</p>}
                <ol>
                  {rows.map((r, i) => (
                    <li key={`${r.name}-${i}`} className={`is-${i + 1}${r.name === name ? ' is-me' : ''}`}>
                      <span className="hub-medal">{i + 1}</span>
                      {r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : <i>{r.name.slice(0, 1).toUpperCase()}</i>}
                      <span className="hub-who">{r.name}</span>
                      <strong>{fr(r.score)}</strong>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="hub-foot">
        <a href="/#terms">Conditions d’utilisation</a> · <a href="/#privacy">Confidentialité</a> · <a href="mailto:ytspana@gmail.com">Contact</a>
      </footer>
    </div>
  );
};

export default HubHome;
