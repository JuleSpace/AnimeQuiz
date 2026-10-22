import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from './account';
import './GameHome.css';

/**
 * Écran d'accueil d'un jeu (inspiré de Pokébonk) : grande scène en fond, logo, grosse carte « Jouer »,
 * cartes secondaires, grille de tuiles avec compteurs et pastilles, classement à droite.
 * La structure est commune ; chaque jeu l'habille avec sa propre direction artistique (classe `theme`).
 */
export const HomeIcon = ({ src, alt = '', fallback = '★' }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <span className="gh-icon-fb" aria-hidden="true">{fallback}</span>;
  return <img className="gh-icon-img" src={src} alt={alt} onError={() => setBroken(true)} />;
};

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Classement compact : les 7 premiers, deux onglets. */
const DEFAULT_TABS = [
  { id: 'fastest', label: 'Victoires rapides', value: (r) => clock(r.t), unit: 'temps' },
  { id: 'kills', label: 'K.O.', value: (r) => r.kills.toLocaleString('fr-FR'), unit: 'K.O.' }
];

/** Classement compact : les 7 premiers, deux onglets (personnalisables). */
export const HomeBoard = ({ game, gen = 1, title = 'Classement', subtitle = '', onMore, describe = (r) => r.form, tabs = DEFAULT_TABS, empty = 'Personne pour l’instant : la première place est à prendre !' }) => {
  const [board, setBoard] = useState(null);
  const [tab, setTab] = useState(tabs[0].id);
  useEffect(() => {
    let alive = true;
    setBoard(null);
    fetchLeaderboard(game, gen).then((b) => { if (alive) setBoard(b); });
    return () => { alive = false; };
  }, [game, gen]);
  const cur = tabs.find((t) => t.id === tab) || tabs[0];
  const rows = (board?.[cur.id] || []).slice(0, 7);
  return (
    <aside className="gh-board">
      <header className="gh-board-head">
        <b>{title}</b>
        {subtitle && <small>{subtitle}</small>}
      </header>
      <div className="gh-board-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={cur.id === t.id} className={cur.id === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <ol className="gh-board-rows">
        {!board && <li className="gh-board-empty">Chargement…</li>}
        {board && !rows.length && <li className="gh-board-empty">{empty}</li>}
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className={i < 3 ? `is-top is-${i + 1}` : ''}>
            <span className="gh-pos">{i + 1}</span>
            {r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : <i>{r.name.slice(0, 1).toUpperCase()}</i>}
            <span className="gh-who"><strong>{r.name}</strong><small>{describe(r)}</small></span>
            <span className="gh-score">{cur.value(r)}<small>{cur.unit}</small></span>
          </li>
        ))}
      </ol>
      {onMore && <button type="button" className="gh-board-more" onClick={onMore}>Voir le classement complet</button>}
    </aside>
  );
};

/**
 * props :
 *  theme, backdrop (nœud), logo (nœud), topLeft / topRight (nœuds),
 *  play { title, sub, art, onClick }, side { title, sub, art, onClick, locked },
 *  cards [{ key, kicker, title, sub, art, onClick, tone }], tiles [{ key, label, value, icon, badge, onClick }],
 *  links (nœud), board (nœud), stage (nœud décoratif au centre), footer (texte)
 */
const GameHome = ({ theme = '', backdrop, logo, topLeft, topRight, play, side, cards = [], tiles = [], links, board, stage, footer }) => (
  <div className={`gh-root ${theme}`}>
    {backdrop}
    <div className="gh-shade" aria-hidden="true" />
    <div className="gh-top">
      <div className="gh-top-left">{topLeft}</div>
      <div className="gh-top-right">{topRight}</div>
    </div>
    {stage && <div className="gh-stage" aria-hidden="true">{stage}</div>}
    <main className="gh-main">
      <div className="gh-logo">{logo}</div>
      <div className="gh-play-row">
        <button type="button" className="gh-play" onClick={play.onClick}>
          <span className="gh-play-ball" aria-hidden="true" />
          <span className="gh-play-text"><b>{play.title}</b><small>{play.sub}</small></span>
          {play.art && <span className="gh-play-art">{play.art}</span>}
        </button>
        {side && (
          <button type="button" className={`gh-side${side.locked ? ' is-locked' : ''}`} onClick={side.onClick} disabled={side.locked} title={side.hint || ''}>
            {side.art && <span className="gh-side-art">{side.art}</span>}
            <b>{side.locked ? '🔒 ' : ''}{side.title}</b>
            <small>{side.sub}</small>
          </button>
        )}
      </div>
      {cards.length > 0 && (
        <div className="gh-cards">
          {cards.map((c) => (
            <button key={c.key} type="button" className={`gh-card is-${c.tone || 'event'}`} onClick={c.onClick}>
              {c.art && <span className="gh-card-art">{c.art}</span>}
              <span className="gh-card-text">
                {c.kicker && <small className="gh-card-kicker">{c.kicker}</small>}
                <b>{c.title}</b>
                {c.sub && <small>{c.sub}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="gh-tiles">
        {tiles.map((t) => (
          <button key={t.key} type="button" className="gh-tile" onClick={t.onClick} style={t.color ? { '--tc': t.color } : undefined}>
            {t.badge ? <span className="gh-badge">{t.badge}</span> : null}
            <span className="gh-tile-icon">{t.icon}</span>
            <b>{t.label}</b>
            {t.value !== undefined && <small>{t.value}</small>}
          </button>
        ))}
      </div>
      {links && <div className="gh-links">{links}</div>}
    </main>
    {board}
    {footer && <footer className="gh-foot">{footer}</footer>}
  </div>
);

export default GameHome;
