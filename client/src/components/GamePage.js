import React, { useEffect, useRef, useState } from 'react';
import { fetchLeaderboard, useAccount } from './account';
import './GamePage.css';

/*
 * Pages de menu des jeux, rangées comme celles de Pokébonk :
 * « Échap · Retour », un ruban de titre, des compteurs à droite, puis des panneaux à bandeau rayé.
 * Chaque jeu les habille avec sa classe de thème (gh-swarm, gh-rush, gh-arena, gh-bonk).
 */

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Échap ferme la page ; Entrée déclenche l'action principale (si aucun champ n'a le focus). */
export const useKeys = (onBack, onEnter) => {
  const ref = useRef({ onBack, onEnter });
  ref.current = { onBack, onEnter };
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (e.key === 'Escape' && ref.current.onBack) { e.preventDefault(); ref.current.onBack(); }
      if (e.key === 'Enter' && ref.current.onEnter && !['input', 'textarea', 'select', 'button'].includes(tag)) { e.preventDefault(); ref.current.onEnter(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

export const Key = ({ children }) => <kbd className="gp-key">{children}</kbd>;

/** En-tête seul (Échap · Retour + ruban + compteurs), pour habiller un écran existant. */
export const PageHead = ({ title, subtitle, onBack, backLabel = 'Retour', right }) => (
  <header className="gp-head">
    <div className="gp-head-left">
      {onBack && <button type="button" className="gp-back" onClick={onBack}><Key>Échap</Key>{backLabel}</button>}
      <h1 className="gp-ribbon"><b>{title}</b>{subtitle && <small>{subtitle}</small>}</h1>
    </div>
    {right && <div className="gp-head-right">{right}</div>}
  </header>
);

/**
 * props : theme, backdrop, title, subtitle, onBack, right (compteurs), onEnter, wide, children, className
 */
const GamePage = ({ theme = '', backdrop, title, subtitle, onBack, backLabel = 'Retour', right, onEnter, children, className = '' }) => {
  useKeys(onBack, onEnter);
  return (
    <div className={`gp-root ${theme} ${className}`}>
      {backdrop}
      <div className="gp-veil" aria-hidden="true" />
      <PageHead title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} right={right} />
      <div className="gp-body">{children}</div>
    </div>
  );
};

/** Compteur arrondi de l'en-tête (« Vus 6/151 », monnaie…). */
export const Stat = ({ label, value, icon, strong, onClick, max }) => {
  const Tag = onClick ? 'button' : 'span';
  const pct = max ? Math.min(100, (Number(String(value).replace(/\D/g, '')) / max) * 100) : null;
  return (
    <Tag type={onClick ? 'button' : undefined} className={`gp-stat${strong ? ' is-strong' : ''}`} onClick={onClick}>
      {icon && <span className="gp-stat-icon">{icon}</span>}
      <span>{label && <small>{label}</small>}<b>{value}</b>{pct !== null && <i style={{ '--p': `${pct}%` }} />}</span>
    </Tag>
  );
};

/** Panneau à bandeau rayé. tone : play | side | accent | plain */
export const Panel = ({ title, kicker, right, tone = 'play', children, className = '', bodyClass = '' }) => (
  <section className={`gp-panel is-${tone} ${className}`}>
    {(title || kicker) && (
      <header className="gp-panel-head">
        <span>{kicker && <small>{kicker}</small>}{title && <b>{title}</b>}</span>
        {right && <span className="gp-panel-right">{right}</span>}
      </header>
    )}
    <div className={`gp-panel-body ${bodyClass}`}>{children}</div>
  </section>
);

/** Titre de section avec barre de couleur et compteur. */
export const Section = ({ title, sub, count, color, children, className = '' }) => (
  <section className={`gp-section ${className}`} style={color ? { '--sc': color } : undefined}>
    <h2 className="gp-section-title"><b>{title}</b>{count !== undefined && <em>{count}</em>}{sub && <small>{sub}</small>}</h2>
    {children}
  </section>
);

/** Onglets en pastilles. items : [[id, label, badge?]] */
export const Tabs = ({ items, value, onChange, className = '' }) => (
  <div className={`gp-tabs ${className}`} role="tablist">
    {items.map(([id, label, badge]) => (
      <button key={id} type="button" role="tab" aria-selected={value === id} className={value === id ? 'is-on' : ''} onClick={() => onChange(id)}>
        {label}{badge ? <em>{badge}</em> : null}
      </button>
    ))}
  </div>
);

/** Barre de progression avec texte centré. */
export const Bar = ({ value, max, label, tone }) => (
  <span className={`gp-bar${tone ? ` is-${tone}` : ''}${value >= max ? ' is-full' : ''}`}>
    <i style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
    <small>{label ?? `${value.toLocaleString('fr-FR')} / ${max.toLocaleString('fr-FR')}`}</small>
  </span>
);

/** Petites cases de niveau. */
export const Pips = ({ value, max }) => (
  <span className="gp-pips">{Array.from({ length: max }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}</span>
);

/** Carte d'amélioration façon Labo : bandeau, niveau, icône, nom, effet, cases, bouton prix. */
export const UpCard = ({ icon, name, desc, next, level = 0, max = 1, cost, costLabel, state = 'buy', onBuy, color, note }) => (
  <article className={`gp-up is-${state}`} style={color ? { '--uc': color } : undefined}>
    <span className="gp-up-band"><em>N. {level}/{max}</em></span>
    <span className="gp-up-icon">{icon}</span>
    <b>{name}</b>
    <p>{desc}</p>
    {next && <p className="gp-up-next">{next}</p>}
    {max > 1 && <Pips value={level} max={max} />}
    {note && <small className="gp-up-note">{note}</small>}
    <button type="button" className="gp-up-buy" disabled={state !== 'buy'} onClick={onBuy}>
      {costLabel || cost}
    </button>
  </article>
);

/** Ligne de succès / mission : icône, nom, description, barre, récompense. */
export const Quest = ({ icon, name, desc, value, goal, reward, done, tag, tagTone }) => (
  <article className={`gp-quest${done ? ' is-done' : ''}`}>
    <span className="gp-quest-icon">{icon}</span>
    <span className="gp-quest-main">
      <b>{tag && <em className={`gp-tag is-${tagTone || 'easy'}`}>{tag}</em>}{name}</b>
      <small>{desc}</small>
      {goal ? <Bar value={Math.min(value || 0, goal)} max={goal} /> : null}
    </span>
    <span className="gp-quest-reward">{done ? '✓' : reward}</span>
  </article>
);

/** Gros bouton d'action avec rappel de touche. */
export const Cta = ({ children, onClick, disabled, hint = 'Entrée', tone = 'play', className = '' }) => (
  <button type="button" className={`gp-cta is-${tone} ${className}`} onClick={onClick} disabled={disabled}>
    <span>{children}</span>{hint && <Key>{hint}</Key>}
  </button>
);

/** Choix en liste (modes, difficultés…). */
export const Choice = ({ title, sub, on, locked, onClick, right, tone }) => (
  <button type="button" className={`gp-choice${on ? ' is-on' : ''}${locked ? ' is-locked' : ''}${tone ? ` is-${tone}` : ''}`} disabled={locked} onClick={onClick} aria-pressed={on}>
    <span><b>{locked ? '🔒 ' : ''}{title}</b>{sub && <small>{sub}</small>}</span>
    {right && <em>{right}</em>}
  </button>
);

/** Barres de statistiques. rows : [[label, value, max, color?]] */
export const StatBars = ({ rows }) => (
  <dl className="gp-statbars">
    {rows.map(([label, v, max, color]) => (
      <React.Fragment key={label}>
        <dt>{label}</dt>
        <dd style={{ '--p': `${Math.min(100, (v / max) * 100)}%`, '--bc': color || 'var(--gh-accent)' }}><i /><b>{v}</b></dd>
      </React.Fragment>
    ))}
  </dl>
);

/**
 * Classement complet : catégories et régions à gauche, podium, puis le tableau.
 * tabs : [{ id, label, sub, value(r), unit }] ; gens : [{ id, name, sub }]
 */
export const BoardPage = ({ game, gens = [{ id: 1, name: 'Kanto' }], tabs, describe = (r) => r.form, avatarOf }) => {
  const { user } = useAccount();
  const [gen, setGen] = useState(gens[0]?.id || 1);
  const [tab, setTab] = useState(tabs[0].id);
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let alive = true;
    setBoard(null);
    fetchLeaderboard(game, gen).then((b) => { if (alive) setBoard(b); });
    return () => { alive = false; };
  }, [game, gen]);
  const cur = tabs.find((t) => t.id === tab) || tabs[0];
  const rows = board?.[cur.id] || [];
  const top = [rows[1], rows[0], rows[2]];
  const face = (r, size) => (r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : avatarOf ? avatarOf(r, size) : <i>{r.name.slice(0, 1).toUpperCase()}</i>);
  return (
    <div className="gp-board">
      <nav className="gp-board-nav">
        <div className="gp-board-cats">
          {tabs.map((t) => (
            <button key={t.id} type="button" className={t.id === cur.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
              <b>{t.label}</b>{t.sub && <small>{t.sub}</small>}
            </button>
          ))}
        </div>
        {gens.length > 1 && (
          <div className="gp-board-gens">
            <span className="gp-mini-title">Région</span>
            {gens.map((g) => (
              <button key={g.id} type="button" className={g.id === gen ? 'is-on' : ''} onClick={() => setGen(g.id)}>
                <b>{g.name}</b>{g.sub && <small>{g.sub}</small>}
              </button>
            ))}
          </div>
        )}
      </nav>
      <div className="gp-board-main">
        <header className="gp-board-banner">
          <small>Classement · {cur.label}</small>
          <b>{gens.find((g) => g.id === gen)?.name || ''}</b>
          <span>{cur.sub || 'Meilleure partie de chaque joueur'}</span>
        </header>
        {!board && <p className="gp-empty">Chargement…</p>}
        {board && !rows.length && <p className="gp-empty">Personne pour l’instant : la première place est à prendre !</p>}
        {rows.length > 0 && (
          <div className="gp-podium">
            {top.map((r, i) => (r ? (
              <div key={r.name + i} className={`gp-pod is-${[2, 1, 3][i]}`}>
                <span className="gp-pod-face">{face(r, 74)}</span>
                <b>{r.name}</b>
                <small>{describe(r)}</small>
                <strong>{cur.value(r)}<em>{cur.unit}</em></strong>
                <span className="gp-pod-step">{[2, 1, 3][i]}</span>
              </div>
            ) : <div key={`e${i}`} className="gp-pod is-empty" />))}
          </div>
        )}
        {rows.length > 3 && (
          <ol className="gp-table" start={4}>
            {rows.slice(3).map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <span className="gp-table-pos">{i + 4}</span>
                <span className="gp-table-face">{face(r, 40)}</span>
                <span className="gp-table-who"><b>{r.name}</b><small>{describe(r)}</small></span>
                <span className="gp-table-score">{cur.value(r)}<em>{cur.unit}</em></span>
              </li>
            ))}
          </ol>
        )}
        {!user && <p className="gp-note">Connecte-toi pour apparaître au classement.</p>}
      </div>
    </div>
  );
};

export { clock };
export default GamePage;
