/**
 * Poké Rush — interface complète (menus, Ligue, HUD, cartes de niveau, fins de partie).
 * Direction artistique propre au Rush : cartes blanches arrondies, Fredoka, couleurs vives,
 * posées sur une vraie vue de l'île en 3D. Rien n'est partagé avec l'habillage pixel du Swarm.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FINAL_AT, FOE_TYPES, MAX_ALLIES, RUSH_ITEMS, RUSH_MOVES, TYPE_COLORS, UPGRADES, buyRushThing, buyUpgrade, rushEffects, rushPool, upCost, upRank, weaknessesOf
} from './rushData';
import { FOES, PASSIVES, WEAPONS } from './swarmData';
import {
  FAMILIES, FAMILY, GEN1_NAMES, GEN1_TYPES, RARITY_COLOR, buyFamily, challengeText, foeDex, foeName, leagueSize, progressOf, statusOf
} from './rushLeague';
import { ITEM_SLUG, PmdSprite, itemSprite, optionLabel } from './PokeSwarm';
import { fxFrameOfType, fxIconUrl } from './rushArt';
import { fetchLeaderboard, AccountChip } from './account';
import { musicPlayer } from './pokeArenaMusic';
import GameLogo from './GameLogo';
import ScoreCard from './ScoreCard';
import './RushUI.css';

export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fr = (n) => Math.round(n || 0).toLocaleString('fr-FR');
const MUSIC_KEY = 'poke-arena-music';
const BG = `${process.env.PUBLIC_URL || ''}/rush/menu.jpg`;
const TYPES = ['Normal', 'Feu', 'Eau', 'Plante', 'Électrik', 'Glace', 'Combat', 'Poison', 'Sol', 'Vol', 'Psy', 'Insecte', 'Roche', 'Spectre', 'Dragon', 'Fée', 'Acier'];
const UP_ITEM = { balls: 'poke-ball', catch: 'great-ball', vitality: 'hp-up', power: 'protein', speed: 'carbos', coins: 'amulet-coin', allyslot: 'friend-ball', cards: 'up-grade', reroll: 'rare-candy' };
const ITEM_OF = { hpup: 'hp-up', quickclaw: 'quick-claw', scope: 'scope-lens', shellbell: 'shell-bell', expshare: 'exp-share', brightpowder: 'bright-powder' };

/* ——— Petites pièces ——— */
const iconCache = {};
const typeIcon = (type) => {
  if (!iconCache[type]) { try { iconCache[type] = fxIconUrl(fxFrameOfType(type)); } catch { iconCache[type] = ''; } }
  return iconCache[type];
};
export const TypeIcon = ({ type, size = 18 }) => {
  const src = typeIcon(type);
  return src ? <img className="rx-ticon" src={src} alt="" width={size} height={size} /> : <i className="rx-ticon" />;
};
export const TypeTag = ({ type, small = false }) => (
  <span className={`rx-type${small ? ' is-small' : ''}`} style={{ '--c': TYPE_COLORS[type] || '#999' }}><TypeIcon type={type} size={small ? 12 : 14} />{type}</span>
);
const Item = ({ slug, size = 32 }) => {
  const [ok, setOk] = useState(true);
  return ok ? <img className="rx-item" src={itemSprite(slug)} alt="" width={size} height={size} onError={() => setOk(false)} /> : <i className="rx-item is-missing" />;
};
const Key = ({ children }) => <kbd className="rx-key">{children}</kbd>;
const Bar = ({ value, max = 1, color, label, thin = false }) => (
  <span className={`rx-bar${thin ? ' is-thin' : ''}`} style={{ '--c': color }}>
    <b style={{ width: `${Math.max(0, Math.min(1, value / (max || 1))) * 100}%` }} />
    {label && <em>{label}</em>}
  </span>
);
const Sprite = (props) => <PmdSprite {...props} />;

export const RushBackdrop = ({ dim = false }) => (
  <div className={`rx-bg${dim ? ' is-dim' : ''}`} aria-hidden="true">
    <img src={BG} alt="" />
    <span className="rx-bg-veil" />
  </div>
);

/** Raccourcis clavier d'une page (Échap, Entrée, flèches…). */
const useKeys = (map, active = true) => {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!active) return undefined;
    const on = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const fn = ref.current[e.key];
      if (fn) { e.preventDefault(); fn(e); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [active]);
};

/** Cadre commun des pages : barre du haut (retour, titre, infos), contenu. */
const Shell = ({ title, kicker, onBack, right, children, className = '' }) => {
  useKeys({ Escape: onBack });
  return (
    <div className={`rx-root rx-page ${className}`}>
      <RushBackdrop dim />
      <header className="rx-topbar">
        <button type="button" className="rx-back" onClick={onBack}><Key>Échap</Key> Retour</button>
        <div className="rx-title">{kicker && <small>{kicker}</small>}<h1>{title}</h1></div>
        <div className="rx-topbar-right">{right}</div>
      </header>
      <main className="rx-page-body">{children}</main>
    </div>
  );
};
const PL = ({ meta }) => <span className="rx-chip is-gold"><Item slug="star-piece" size={22} />{fr(meta.pl)} PL</span>;

/* ——— Accueil ——— */
const MENU = [
  { id: 'play', label: 'Jouer', sub: 'Île de Kanto', icon: 'poke-ball', big: true },
  { id: 'league', label: 'Collection', icon: 'master-ball' },
  { id: 'shop', label: 'Centre Pokémon', icon: 'potion' },
  { id: 'dex', label: 'Pokédex', icon: 'poke-radar' },
  { id: 'board', label: 'Classement', icon: 'gold-bottle-cap' },
  { id: 'history', label: 'Historique', icon: 'town-map' },
  { id: 'howto', label: 'Comment jouer', icon: 'exp-share' },
  { id: 'quit', label: 'Retour au Lair', icon: 'escape-rope' }
];

export const RushHome = ({ meta, partner, onAction }) => {
  const [focus, setFocus] = useState(0);
  const size = leagueSize(meta);
  const ready = FAMILIES.filter((f) => statusOf(meta, f) === 'ready');
  const next = useMemo(() => FAMILIES.filter((f) => statusOf(meta, f) === 'locked' && f.unlock.kind !== 'buy')
    .map((f) => ({ f, p: progressOf(meta, f) })).sort((a, b) => b.p.pct - a.p.pct).slice(0, 3), [meta]);
  const affordUp = UPGRADES.filter((u) => upRank(meta, u.id) < u.max && meta.pl >= upCost(meta, u)).length;
  const badge = { league: ready.length || null, shop: affordUp || null };
  const value = { league: `${size}/${FAMILIES.length}`, history: fr((meta.history || []).length) };
  useKeys({
    ArrowDown: () => setFocus((i) => (i + 1) % MENU.length),
    ArrowUp: () => setFocus((i) => (i + MENU.length - 1) % MENU.length),
    Enter: () => onAction(MENU[focus].id),
    Escape: () => onAction('quit')
  });
  const rec = meta.best?.[partner.id];
  return (
    <div className="rx-root rx-home">
      <RushBackdrop />
      <div className="rx-home-top">
        <AccountChip returnHash="#pokerush" />
        <span className="rx-chip">{fr(meta.runs)} parties</span>
        <span className="rx-chip">🏆 {fr(meta.wins)}</span>
        <PL meta={meta} />
      </div>
      <nav className="rx-home-menu">
        <div className="rx-home-logo"><GameLogo id="rush" /></div>
        {MENU.map((m, i) => (
          <button key={m.id} type="button" className={`rx-menu-btn${m.big ? ' is-big' : ''}${i === focus ? ' is-focus' : ''}`}
            onMouseEnter={() => setFocus(i)} onClick={() => onAction(m.id)}>
            <span className="rx-menu-icon"><Item slug={m.icon} size={m.big ? 40 : 30} /></span>
            <span className="rx-menu-text"><b>{m.label}</b>{m.big && <small>{partner.name} · {m.sub}</small>}</span>
            {value[m.id] && <em>{value[m.id]}</em>}
            {badge[m.id] && <i className="rx-badge">{badge[m.id]}</i>}
            {m.big && <Key>Entrée</Key>}
          </button>
        ))}
      </nav>

      <section className="rx-home-hero">
        <div className="rx-hero-plate">
          <span className="rx-hero-shadow" />
          <Sprite dex={partner.dex} anim="walk" size={260} scale={5} foot={0.9} />
        </div>
        <button type="button" className="rx-hero-card" onClick={() => onAction('league')}>
          <small>Ton partenaire</small>
          <b>{partner.name}</b>
          <span className="rx-hero-types">{partner.types.map((t) => <TypeTag key={t} type={t} small />)}<span className="rx-class">{partner.cls}</span></span>
          <span className="rx-hero-rec">{rec ? `${rec.win ? 'Victoire en' : 'Record'} ${clock(rec.t)} · ${fr(rec.score)} pts` : 'Pas encore de partie avec lui'}</span>
          <em>Changer ›</em>
        </button>
      </section>

      <aside className="rx-home-side">
        <div className="rx-card rx-league-card">
          <header><b>Collection</b><span>{size}/{FAMILIES.length}</span></header>
          <Bar value={size} max={FAMILIES.length} color="#ffcb05" />
          {ready.length > 0 ? (
            <div className="rx-ready-list">
              <small>Apparaîtront sur l’île : capture-les !</small>
              <div>{ready.slice(0, 6).map((f) => <span key={f.id} className="rx-ready-face" title={f.name}><Sprite dex={f.dex} size={44} scale={1.3} still /></span>)}</div>
            </div>
          ) : <small className="rx-muted">Relève des défis pour faire apparaître de nouveaux Pokémon sur l’île.</small>}
          {next.map(({ f, p }) => (
            <button key={f.id} type="button" className="rx-next" onClick={() => onAction('league', f.id)}>
              <span className="rx-next-face is-locked"><Sprite dex={f.dex} size={36} scale={1.05} still /></span>
              <span><b>{f.name}</b><small>{challengeText(f)}</small><Bar value={p.value} max={p.goal} color="#2f7bf0" thin label={`${fr(p.value)}/${fr(p.goal)}`} /></span>
            </button>
          ))}
        </div>
        <MiniBoard onMore={() => onAction('board')} />
      </aside>
      <footer className="rx-foot">Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites : PMDCollab SpriteCollab (CC BY-NC 4.0). Inspiré de Pokébonk et Megabonk.</footer>
    </div>
  );
};

const describeRun = (r) => `${r.form || FAMILY[r.partnerId]?.name || ''}${r.level ? ` · niv. ${r.level}` : ''}`;
const MiniBoard = ({ onMore }) => {
  const [rows, setRows] = useState(null);
  useEffect(() => { let alive = true; fetchLeaderboard('rush', 1).then((b) => { if (alive) setRows(b?.score || []); }); return () => { alive = false; }; }, []);
  return (
    <div className="rx-card rx-miniboard">
      <header><b>Classement</b><span>meilleur score</span></header>
      <ol>
        {!rows && <li className="rx-muted">Chargement…</li>}
        {rows && !rows.length && <li className="rx-muted">La première place est à prendre !</li>}
        {(rows || []).slice(0, 5).map((r, i) => (
          <li key={`${r.name}-${i}`} className={`is-${i + 1}`}>
            <i>{i + 1}</i>
            <span><b>{r.name}</b><small>{describeRun(r)}</small></span>
            <em>{fr(r.score)}</em>
          </li>
        ))}
      </ol>
      <button type="button" className="rx-link" onClick={onMore}>Classement complet ›</button>
    </div>
  );
};

/* ——— La Ligue : les 79 familles de Kanto ——— */
const STATUS_LABEL = { member: 'Dans ta Collection', ready: 'À capturer !', locked: 'Défi à relever' };
const RAR_STARS = { Commun: 1, 'Peu commun': 2, Rare: 3, Épique: 4, Légendaire: 5 };

export const RushLeague = ({ meta, setMeta, partnerId, initial, onPick, onBack }) => {
  const [sel, setSel] = useState(initial || partnerId);
  const [type, setType] = useState('Tous');
  const [status, setStatus] = useState('all');
  const list = FAMILIES.filter((f) => (type === 'Tous' || f.types.includes(type)) && (status === 'all' || statusOf(meta, f) === status));
  const f = FAMILY[sel] || FAMILIES[0];
  const st = statusOf(meta, f);
  const size = leagueSize(meta);
  const counts = { member: size, ready: FAMILIES.filter((x) => statusOf(meta, x) === 'ready').length };
  counts.locked = FAMILIES.length - counts.member - counts.ready;
  const go = () => { if (st === 'member') onPick(f.id); };
  const move = (d) => { const i = list.findIndex((x) => x.id === sel); const n = list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + d))]; if (n) setSel(n.id); };
  useKeys({ Enter: go, ArrowRight: () => move(1), ArrowLeft: () => move(-1), ArrowDown: () => move(6), ArrowUp: () => move(-6) });
  return (
    <Shell title="Collection" kicker="Choisis ton partenaire" onBack={onBack} className="rx-league"
      right={(
        <>
          <span className="rx-chip is-wide"><b>{size}</b>/{FAMILIES.length} membres<Bar value={size} max={FAMILIES.length} color="#ffcb05" thin /></span>
          <PL meta={meta} />
        </>
      )}
    >
      <section className="rx-card rx-league-grid">
        <div className="rx-filters">
          <div className="rx-seg">
            {[['all', 'Tous', FAMILIES.length], ['member', 'Membres', counts.member], ['ready', 'À capturer', counts.ready], ['locked', 'Défis', counts.locked]].map(([id, label, n]) => (
              <button key={id} type="button" className={status === id ? 'is-on' : ''} onClick={() => setStatus(id)}>{label}<small>{n}</small></button>
            ))}
          </div>
          <div className="rx-typefilter">
            <button type="button" className={type === 'Tous' ? 'is-on' : ''} onClick={() => setType('Tous')}>Tous</button>
            {TYPES.map((t) => (
              <button key={t} type="button" title={t} className={type === t ? 'is-on' : ''} style={{ '--c': TYPE_COLORS[t] }} onClick={() => setType(t)}><TypeIcon type={t} size={18} /></button>
            ))}
          </div>
        </div>
        <div className="rx-mons">
          {list.map((x) => {
            const s = statusOf(meta, x);
            const p = s === 'locked' ? progressOf(meta, x) : null;
            return (
              <button key={x.id} type="button" className={`rx-mon is-${s}${x.id === sel ? ' is-sel' : ''}${x.id === partnerId ? ' is-partner' : ''}`}
                style={{ '--c': x.color, '--r': RARITY_COLOR[x.rarity] }} onClick={() => setSel(x.id)} onDoubleClick={() => { setSel(x.id); if (s === 'member') onPick(x.id); }}>
                <small className="rx-mon-no">{String(x.dex).padStart(3, '0')}</small>
                {s === 'ready' && <i className="rx-mon-flag">!</i>}
                <span className="rx-mon-art"><Sprite dex={x.dex} size={64} scale={x.legendary ? 1.5 : 1.8} foot={0.9} still /></span>
                <b>{x.name}</b>
                {p ? <Bar value={p.value} max={p.goal} color="#2f7bf0" thin /> : <span className="rx-mon-types">{x.types.map((t) => <TypeIcon key={t} type={t} size={14} />)}</span>}
              </button>
            );
          })}
          {!list.length && <p className="rx-muted">Aucun Pokémon ne correspond à ces filtres.</p>}
        </div>
      </section>

      <LeagueDetail f={f} st={st} meta={meta} partnerId={partnerId} onGo={go} onBuy={() => setMeta(buyFamily(meta, f))} />
    </Shell>
  );
};

const LeagueDetail = ({ f, st, meta, partnerId, onGo, onBuy }) => {
  const p = progressOf(meta, f);
  const W = WEAPONS[f.weapon];
  const forms = [{ name: f.name, dex: f.dex }, ...f.evolutions.flatMap((e) => (e.choices ? e.choices.map((c) => ({ name: c.name, dex: c.dex, lv: e.level })) : [{ name: e.name, dex: e.dex, lv: e.level }]))];
  const stats = [['PV', f.hp, 150, '#3ccf7a'], ['Vitesse', f.speed, 3.05, '#2f7bf0'], ['Puissance', f.power, 1.3, '#ff6a4a']];
  const buy = f.unlock.kind === 'buy';
  const rec = meta.best?.[f.id];
  return (
    <aside className="rx-card rx-detail" key={f.id} style={{ '--c': f.color, '--r': RARITY_COLOR[f.rarity] }}>
      <div className={`rx-detail-hero is-${st}`}>
        <span className="rx-detail-no">#{String(f.dex).padStart(3, '0')}</span>
        <span className="rx-rarity">{'★'.repeat(RAR_STARS[f.rarity] || 1)} {f.rarity}</span>
        <Sprite dex={f.dex} anim={st === 'member' ? 'walk' : 'idle'} size={170} scale={f.legendary ? 3 : 4} foot={0.88} still={st === 'locked'} />
        <span className={`rx-status is-${st}`}>{f.id === partnerId ? 'Partenaire actuel' : STATUS_LABEL[st]}</span>
      </div>
      <div className="rx-detail-body">
        <h2>{f.name}</h2>
        <div className="rx-detail-tags">{f.types.map((t) => <TypeTag key={t} type={t} />)}<span className="rx-class">{f.cls}</span></div>
        <div className="rx-forms">
          {forms.map((x, i) => (
            <span key={`${x.dex}-${i}`} className={`rx-form${st === 'locked' ? ' is-locked' : ''}`}>
              <Sprite dex={x.dex} size={42} scale={1.2} still />
              <small>{x.lv ? `Niv. ${x.lv}` : 'Départ'}</small>
            </span>
          ))}
        </div>

        {st !== 'member' && (
          <div className="rx-challenge">
            <header><b>{buy ? 'Recrutement' : 'Défi pour l’ajouter'}</b>{!buy && <span>{fr(p.value)} / {fr(p.goal)}</span>}</header>
            <p>{challengeText(f)}</p>
            {!buy && <Bar value={p.value} max={p.goal} color={st === 'ready' ? '#3ccf7a' : '#2f7bf0'} />}
            {!buy && (
              <ol className="rx-steps">
                <li className={p.pct >= 1 || st === 'ready' ? 'is-done' : 'is-now'}><i>1</i>Réussis le défi</li>
                <li className={st === 'ready' ? 'is-now' : ''}><i>2</i>Il apparaît à l’état sauvage sur l’île</li>
                <li><i>3</i>Affaiblis-le et capture-le (F)</li>
              </ol>
            )}
          </div>
        )}

        <div className="rx-kit">
          <div className="rx-kit-row">
            <span className="rx-kit-icon" style={{ '--c': TYPE_COLORS[W?.type] || f.color }}><TypeIcon type={W?.type || f.type} size={26} /></span>
            <span><small>Attaque de départ</small><b>{W?.name || 'Charge'}</b><em>{W?.desc ? W.desc(1) : ''}</em></span>
          </div>
          <div className="rx-kit-row">
            <span className="rx-kit-icon is-ult" style={{ '--c': f.ult.color }}><Item slug="max-elixir" size={30} /></span>
            <span><small>Ultime (R)</small><b>{f.ult.name}</b><em>{f.ult.desc}</em></span>
          </div>
        </div>
        <div className="rx-stats">
          {stats.map(([k, v, max, c]) => (
            <div key={k}><small>{k}</small><Bar value={v} max={max} color={c} thin /><b>{k === 'PV' ? v : k === 'Vitesse' ? v.toFixed(2) : `×${v.toFixed(2)}`}</b></div>
          ))}
        </div>
        {rec && <p className="rx-muted">Record : {rec.win ? 'victoire en' : 'survie'} {clock(rec.t)} · {fr(rec.kills)} K.O. · {fr(rec.score)} pts</p>}
      </div>
      <div className="rx-detail-cta">
        {st === 'member' && <button type="button" className="rx-cta" onClick={onGo}>Je te choisis ! <Key>Entrée</Key></button>}
        {st !== 'member' && buy && <button type="button" className="rx-cta" disabled={(meta.pl || 0) < f.unlock.goal} onClick={onBuy}>Recruter · {fr(f.unlock.goal)} PL</button>}
        {st !== 'member' && !buy && <button type="button" className="rx-cta is-off" disabled>{st === 'ready' ? 'Capture-le pendant une partie' : 'Pas encore dans ta Collection'}</button>}
      </div>
    </aside>
  );
};

/* ——— Préparation de la partie ——— */
export const RushPrep = ({ meta, partner, onStart, onBack, onChange }) => {
  const fx = rushEffects(meta);
  const pool = rushPool(1);
  const ready = FAMILIES.filter((f) => statusOf(meta, f) === 'ready');
  const rec = meta.best?.[partner.id];
  useKeys({ Enter: onStart });
  return (
    <Shell title="Île de Kanto" kicker="Prépare ta partie" onBack={onBack} className="rx-prep" right={<PL meta={meta} />}>
      <section className="rx-card rx-map">
        <div className="rx-map-art" style={{ backgroundImage: `url(${BG})` }}>
          <span className="rx-map-tag">Carte · 3D</span>
          <div className="rx-map-legend">
            <Sprite dex={FOES[pool.finals[(meta.runs || 0) % pool.finals.length]].dex} anim="idle" size={150} scale={1.6} foot={0.9} />
          </div>
        </div>
        <div className="rx-map-body">
          <h2>Île de Kanto</h2>
          <p>Une île en terrasses envahie de Pokémon sauvages. Ton partenaire attaque tout seul : cours, saute les falaises, esquive, capture des alliés et rejoins l’arène à {clock(FINAL_AT)} pour affronter le légendaire.</p>
          <div className="rx-facts">
            <span><b>{clock(FINAL_AT)}</b><small>Réveil du légendaire</small></span>
            <span><b>{pool.t1.length + pool.t2.length + pool.t3.length}+</b><small>Espèces sauvages</small></span>
            <span><b>2:00 · 5:00</b><small>Alphas dans les herbes</small></span>
          </div>
          <div className="rx-legends">
            <small>Légendaires possibles</small>
            <div>{pool.finals.map((id) => <span key={id} title={`${FOES[id].name} · faible contre ${weaknessesOf(FOE_TYPES[id]).join(', ')}`} className={meta.caught[id] ? 'is-done' : ''}><Sprite dex={FOES[id].dex} size={48} scale={0.62} foot={0.9} still /></span>)}</div>
          </div>
        </div>
      </section>
      <aside className="rx-card rx-prep-side">
        <button type="button" className="rx-me" onClick={onChange}>
          <span className="rx-me-face" style={{ '--c': partner.color }}><Sprite dex={partner.dex} anim="idle" size={64} scale={1.9} /></span>
          <span><small>Partenaire</small><b>{partner.name}</b><span className="rx-hero-types">{partner.types.map((t) => <TypeTag key={t} type={t} small />)}</span></span>
          <em>Changer</em>
        </button>
        <div className="rx-kv">
          <span><Item slug="poke-ball" size={26} /><b>{fx.balls}</b><small>Poké Balls</small></span>
          <span><Item slug="friend-ball" size={26} /><b>{fx.allies}</b><small>Alliés max</small></span>
          <span><Item slug="up-grade" size={26} /><b>{fx.cards}</b><small>Cartes au choix</small></span>
          <span><Item slug="rare-candy" size={26} /><b>{fx.rerolls}</b><small>Relances</small></span>
        </div>
        {ready.length > 0 ? (
          <div className="rx-prep-ready">
            <b>Pokémon de la Collection en liberté</b>
            <small>{Math.min(2, ready.length)} d’entre eux apparaîtront pendant la partie (★ doré sur la carte).</small>
            <div>{ready.map((f) => <span key={f.id} title={f.name}><Sprite dex={f.dex} size={44} scale={1.3} still /></span>)}</div>
          </div>
        ) : <p className="rx-muted">Relève des défis de la Collection pour faire apparaître de nouveaux partenaires sur l’île.</p>}
        <div className="rx-kv is-rec">
          <span><b>{fr(rec?.score)}</b><small>Score record</small></span>
          <span><b>{rec ? clock(rec.t) : '—'}</b><small>{rec?.win ? 'Victoire' : 'Survie'}</small></span>
          <span><b>{fr(rec?.kills)}</b><small>Record K.O.</small></span>
        </div>
        <button type="button" className="rx-cta is-go" onClick={onStart}>C’est parti ! <Key>Entrée</Key></button>
      </aside>
    </Shell>
  );
};

/* ——— Centre Pokémon, Pokédex, Classement, Historique ——— */
const META_TABS = [['shop', 'Centre Pokémon'], ['dex', 'Pokédex'], ['board', 'Classement'], ['history', 'Historique']];
export const RushMeta = ({ panel, setPanel, meta, setMeta, onBack }) => (
  <Shell title={META_TABS.find(([id]) => id === panel)?.[1]} kicker="Poké Rush" onBack={onBack} className="rx-meta"
    right={(
      <>
        <div className="rx-seg is-tabs">{META_TABS.map(([id, label]) => <button key={id} type="button" className={panel === id ? 'is-on' : ''} onClick={() => setPanel(id)}>{label}</button>)}</div>
        <PL meta={meta} />
      </>
    )}
  >
    {panel === 'shop' && <Shop meta={meta} setMeta={setMeta} />}
    {panel === 'dex' && <Dex meta={meta} />}
    {panel === 'board' && <Board />}
    {panel === 'history' && <History meta={meta} />}
  </Shell>
);

const UpTile = ({ color, icon, name, desc, note, level, max, state, cost, onBuy }) => (
  <div className={`rx-up is-${state}`} style={{ '--c': color }}>
    <span className="rx-up-icon">{icon}</span>
    <span className="rx-up-text">
      <b>{name}</b>{note && <small className="rx-up-note">{note}</small>}
      <em>{desc}</em>
      {max > 1 && <span className="rx-pips">{Array.from({ length: max }, (_, i) => <i key={i} className={i < level ? 'on' : ''} />)}</span>}
    </span>
    <button type="button" disabled={state !== 'buy'} onClick={onBuy}>{cost}</button>
  </div>
);
const Shop = ({ meta, setMeta }) => (
  <div className="rx-shop">
    <section className="rx-card">
      <header className="rx-sec"><b>Entraînement</b><small>Améliorations permanentes</small></header>
      <div className="rx-ups">
        {UPGRADES.map((u) => {
          const r = upRank(meta, u.id); const maxed = r >= u.max; const cost = upCost(meta, u);
          return <UpTile key={u.id} color="#ff5d7a" icon={<Item slug={UP_ITEM[u.id]} />} name={u.name} desc={u.desc(Math.max(1, r + (maxed ? 0 : 1)))} level={r} max={u.max}
            state={maxed ? 'max' : meta.pl >= cost ? 'buy' : 'poor'} cost={maxed ? 'Max' : `${fr(cost)} PL`} onBuy={() => setMeta(buyUpgrade(meta, u.id))} />;
        })}
      </div>
    </section>
    <section className="rx-card">
      <header className="rx-sec"><b>Capacités</b><small>Elles pourront sortir au level-up</small></header>
      <div className="rx-ups">
        {RUSH_MOVES.map((mv) => {
          const own = !!meta.unlocks[mv.id];
          return <UpTile key={mv.id} color={TYPE_COLORS[mv.type] || mv.color} icon={<TypeIcon type={mv.type} size={30} />} name={mv.name} note={mv.type} desc={mv.desc} level={own ? 1 : 0} max={1}
            state={own ? 'max' : meta.pl >= mv.cost ? 'buy' : 'poor'} cost={own ? 'Apprise' : `${fr(mv.cost)} PL`} onBuy={() => setMeta(buyRushThing(meta, mv.id, mv.cost))} />;
        })}
      </div>
    </section>
    <section className="rx-card">
      <header className="rx-sec"><b>Objets</b><small>Ajoutés aux bonus possibles</small></header>
      <div className="rx-ups">
        {RUSH_ITEMS.map((it) => {
          const own = !!meta.unlocks[it.id];
          return <UpTile key={it.id} color={it.color} icon={<Item slug={ITEM_OF[it.id] || it.id} />} name={it.name} desc={it.desc} level={own ? 1 : 0} max={1}
            state={own ? 'max' : meta.pl >= it.cost ? 'buy' : 'poor'} cost={own ? 'Débloqué' : `${fr(it.cost)} PL`} onBuy={() => setMeta(buyRushThing(meta, it.id, it.cost))} />;
        })}
      </div>
    </section>
  </div>
);

const Dex = ({ meta }) => {
  const byDex = useMemo(() => {
    const caught = {}; const seen = {};
    Object.entries(meta.caught || {}).forEach(([k, n]) => { const d = foeDex(k); if (d) caught[d] = (caught[d] || 0) + n; });
    Object.keys(meta.seen || {}).forEach((k) => { const d = foeDex(k); if (d) seen[d] = true; });
    return { caught, seen };
  }, [meta]);
  const [sel, setSel] = useState(null);
  const all = Array.from({ length: 151 }, (_, i) => i + 1);
  const nCaught = all.filter((d) => byDex.caught[d]).length;
  const nSeen = all.filter((d) => byDex.caught[d] || byDex.seen[d]).length;
  const cur = sel || all.find((d) => byDex.caught[d]) || 1;
  const known = byDex.caught[cur] || byDex.seen[cur];
  const types = GEN1_TYPES[cur] || ['Normal'];
  const fam = FAMILIES.find((f) => f.dex === cur || f.evolutions.some((e) => e.dex === cur || (e.choices || []).some((c) => c.dex === cur)));
  return (
    <div className="rx-dex">
      <section className="rx-card rx-dex-grid">
        <header className="rx-sec"><b>Kanto</b><small>{nCaught} capturés · {nSeen} vus sur 151</small><Bar value={nCaught} max={151} color="#ff4f5e" thin /></header>
        <div className="rx-dex-cells">
          {all.map((d) => {
            const c = byDex.caught[d]; const s = c || byDex.seen[d];
            return (
              <button key={d} type="button" className={`rx-dex-cell${c ? ' is-caught' : s ? ' is-seen' : ''}${d === cur ? ' is-sel' : ''}`} onClick={() => setSel(d)} style={{ '--c': TYPE_COLORS[(GEN1_TYPES[d] || ['Normal'])[0]] }}>
                <Sprite dex={d} size={48} scale={1.35} foot={0.9} still />
                <small>{String(d).padStart(3, '0')}</small>
              </button>
            );
          })}
        </div>
      </section>
      <aside className="rx-card rx-dex-side" style={{ '--c': TYPE_COLORS[types[0]] }}>
        <div className={`rx-detail-hero${known ? '' : ' is-locked'}`}>
          <span className="rx-detail-no">#{String(cur).padStart(3, '0')}</span>
          <Sprite dex={cur} anim="idle" size={160} scale={3.6} foot={0.88} still={!known} />
        </div>
        <div className="rx-detail-body">
          <h2>{known ? GEN1_NAMES[cur] : '???'}</h2>
          {known && <div className="rx-detail-tags">{types.map((t) => <TypeTag key={t} type={t} />)}</div>}
          <p className="rx-muted">{byDex.caught[cur] ? `Capturé ${byDex.caught[cur]} fois.` : known ? 'Vu sur l’île, jamais capturé.' : 'Jamais rencontré.'}</p>
          {known && <><small className="rx-label">Faible contre</small><div className="rx-detail-tags">{weaknessesOf(types).map((t) => <TypeTag key={t} type={t} small />)}</div></>}
          {fam && <p className="rx-muted">Famille jouable dans la Collection : <b>{fam.name}</b>.</p>}
        </div>
      </aside>
    </div>
  );
};

const BOARD_TABS = [
  { id: 'score', label: 'Score', value: (r) => fr(r.score), unit: 'pts' },
  { id: 'fastest', label: 'Victoires rapides', value: (r) => clock(r.t), unit: '' },
  { id: 'kills', label: 'K.O.', value: (r) => fr(r.kills), unit: 'K.O.' }
];
const Board = () => {
  const [board, setBoard] = useState(null);
  const [tab, setTab] = useState('score');
  useEffect(() => { let alive = true; fetchLeaderboard('rush', 1).then((b) => { if (alive) setBoard(b); }); return () => { alive = false; }; }, []);
  const cur = BOARD_TABS.find((t) => t.id === tab);
  const rows = board?.[tab] || [];
  return (
    <section className="rx-card rx-board">
      <div className="rx-seg">{BOARD_TABS.map((t) => <button key={t.id} type="button" className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
      <div className="rx-podium">
        {[1, 0, 2].map((i) => {
          const r = rows[i];
          return (
            <div key={i} className={`rx-podium-step is-${i + 1}`}>
              {r ? (
                <>
                  {r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : <i>{r.name.slice(0, 1).toUpperCase()}</i>}
                  <b>{r.name}</b><small>{describeRun(r)}</small><em>{cur.value(r)} {cur.unit}</em>
                </>
              ) : <small className="rx-muted">—</small>}
              <span className="rx-podium-block">{i + 1}</span>
            </div>
          );
        })}
      </div>
      <ol className="rx-rows">
        {!board && <li className="rx-muted">Chargement…</li>}
        {board && !rows.length && <li className="rx-muted">Personne pour l’instant : la première place est à prendre !</li>}
        {rows.slice(3, 50).map((r, i) => (
          <li key={`${r.name}-${i}`}><i>{i + 4}</i>{r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="rx-av">{r.name.slice(0, 1).toUpperCase()}</span>}<span><b>{r.name}</b><small>{describeRun(r)}</small></span><em>{cur.value(r)} <small>{cur.unit}</small></em></li>
        ))}
      </ol>
    </section>
  );
};

const History = ({ meta }) => {
  const list = meta.history || [];
  return (
    <section className="rx-card rx-history">
      {!list.length && <p className="rx-muted">Aucune partie pour l’instant.</p>}
      {list.map((r) => {
        const fam = FAMILY[r.partnerId];
        return (
          <div key={r.at} className={`rx-hist${r.result === 'win' ? ' is-win' : ''}`}>
            <span className="rx-hist-face">{(r.form?.dex || fam) && <Sprite dex={r.form?.dex || fam.dex} size={52} scale={1.5} still />}</span>
            <span><b>{r.result === 'win' ? 'Victoire à l’arène' : 'K.O.'} · {r.form?.name || fam?.name}</b><small>{clock(r.t)} · niv. {r.level} · {fr(r.kills)} K.O. · {r.caught} capture{r.caught > 1 ? 's' : ''}</small></span>
            <em>{fr(r.score)} <small>pts</small></em>
            <time>{new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
          </div>
        );
      })}
    </section>
  );
};

/* ——— Comment jouer ——— */
export const RushHowto = ({ partner, onClose }) => {
  useKeys({ Escape: onClose, Enter: onClose });
  const rows = [
    ['ZQSD / WASD', 'Bouger · la caméra suit la souris (clic) ou le doigt à droite de l’écran'],
    ['Espace', 'Sauter : les falaises en terrasses se franchissent d’un bond'],
    ['Maj', 'Esquive : un bond rapide pendant lequel tu es invincible'],
    ['F', `Capturer : PV rouges = capturable, il se bat ensuite avec toi (${MAX_ALLIES} max)`],
    ['R', `Ultime : ${partner.ult.name}, la jauge se remplit en combattant`],
    ['Types', 'Super efficace ×2, pas très efficace ×0,5 : vise les faiblesses'],
    ['Hautes herbes', 'des Pokémon Alpha s’y cachent vers 2:00 et 5:00'],
    ['Coffres et autels', 'les coffres coûtent des ₽, les autels donnent une bénédiction'],
    ['Collection', 'relève des défis, puis capture le Pokémon quand il apparaît (★ doré)'],
    ['Arène', `à ${clock(FINAL_AT)}, le légendaire s’y réveille : bats-le pour gagner`]
  ];
  return (
    <div className="rx-root rx-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rx-card rx-howto">
        <header className="rx-sec"><b>Comment jouer</b><button type="button" className="rx-x" onClick={onClose}>✕</button></header>
        <ul>{rows.map(([k, v]) => <li key={k}><Key>{k}</Key><span>{v}</span></li>)}</ul>
      </div>
    </div>
  );
};

/* ——— Musique ——— */
export const RushMusic = () => {
  const [now, setNow] = useState(null);
  const [volume, setVolume] = useState(() => { try { const v = Number(localStorage.getItem(MUSIC_KEY) ?? 0.5); return Number.isFinite(v) ? v : 0.5; } catch { return 0.5; } });
  useEffect(() => musicPlayer().subscribe(setNow), []);
  const set = (v) => { setVolume(v); musicPlayer().setVolume(v); try { localStorage.setItem(MUSIC_KEY, String(v)); } catch { /* stockage indisponible */ } };
  return (
    <div className="rx-music">
      <small>Musique</small>
      <b>{now?.title || (volume > 0 ? 'La musique démarre…' : 'Musique coupée')}</b>
      <div>
        <button type="button" onClick={() => set(volume > 0 ? 0 : 0.5)}>{volume > 0 ? '🔊' : '🔇'}</button>
        <input type="range" min="0" max="100" value={Math.round(volume * 100)} style={{ '--p': `${Math.round(volume * 100)}%` }} onChange={(e) => set(Number(e.target.value) / 100)} aria-label="Volume" />
        <button type="button" disabled={volume <= 0} onClick={() => musicPlayer().next()}>⏭</button>
      </div>
    </div>
  );
};

/* ——— HUD en jeu ——— */
const Loadout = ({ h }) => (
  <div className="rx-loadout">
    <div className="rx-slots">
      {Array.from({ length: h.slots?.weapons || 4 }, (_, i) => {
        const w = h.weapons[i];
        if (!w) return <span key={i} className="rx-slot is-empty" />;
        const W = WEAPONS[w.id];
        return (
          <span key={w.id} className="rx-slot" style={{ '--c': TYPE_COLORS[W.type] || W.color }} title={`${W.name} · niv. ${w.lv}`}>
            <TypeIcon type={W.type} size={26} /><i>{w.lv}</i>
          </span>
        );
      })}
    </div>
    <div className="rx-slots is-items">
      {Array.from({ length: h.slots?.passives || 4 }, (_, i) => {
        const pv = h.passives[i];
        if (!pv) return <span key={i} className="rx-slot is-empty" />;
        return <span key={pv.id} className="rx-slot is-item" title={`${PASSIVES[pv.id].name} · niv. ${pv.lv}`}><Item slug={ITEM_SLUG[pv.id] || pv.id} size={26} /><i>{pv.lv}</i></span>;
      })}
    </div>
  </div>
);

export const RushHud = ({ h, game, onPause }) => {
  const toFinal = Math.max(0, FINAL_AT - h.t);
  const hpK = h.hp / h.maxHp;
  return (
    <div className="rx-hud">
      <div className="rx-hud-me">
        <span className="rx-hud-face"><Sprite dex={h.form.dex} size={58} scale={1.7} /><i>{h.level}</i></span>
        <div className="rx-hud-bars">
          <b>{h.form.name}</b>
          <span className={`rx-hp${hpK < 0.3 ? ' is-low' : ''}`}><em style={{ width: `${hpK * 100}%` }} /><small>{Math.ceil(h.hp)} / {h.maxHp}</small></span>
          <span className="rx-xp"><em style={{ width: `${(h.xp / h.need) * 100}%` }} /></span>
        </div>
      </div>
      {h.allies.length > 0 && (
        <div className="rx-hud-team">
          {h.allies.map((a, i) => (
            <span key={`${a.id}-${i}`} className={`rx-ally${a.ko ? ' is-ko' : ''}${a.alpha ? ' is-alpha' : ''}`} title={a.name}>
              <Sprite dex={a.dex} size={34} scale={1} still={!!a.ko} />
              {a.ko ? <small>{a.ko}s</small> : <em><b style={{ width: `${(a.hp / a.maxHp) * 100}%` }} /></em>}
            </span>
          ))}
          {Array.from({ length: Math.max(0, h.maxAllies - h.allies.length) }, (_, i) => <span key={`e${i}`} className="rx-ally is-empty" />)}
        </div>
      )}

      <div className="rx-hud-clock">
        <b>{clock(h.t)}</b>
        <small className={h.finalSpawned ? 'is-hot' : ''}>{h.finalSpawned ? 'Le légendaire est dans l’arène !' : `Arène dans ${clock(toFinal)}`}</small>
      </div>
      {h.boss && (
        <div className={`rx-boss${h.boss.final ? ' is-final' : ''}`}>
          <header><b>{h.boss.name}</b><span>{h.boss.types.map((t) => <TypeTag key={t} type={t} small />)}</span></header>
          <span className="rx-boss-bar"><em style={{ width: `${(h.boss.hp / h.boss.maxHp) * 100}%` }} /></span>
          <small>Faible contre {weaknessesOf(h.boss.types).join(', ') || '—'}</small>
        </div>
      )}
      {h.banner && <div key={h.banner} className="rx-banner">{h.banner}</div>}
      {h.evolving && <div className="rx-evo">Quoi ? {h.form.name} évolue !</div>}

      <div className="rx-hud-res">
        <span title="Poké Dollars"><Item slug="nugget" size={22} />{fr(h.coins)}</span>
        <span title="Poké Balls"><Item slug="poke-ball" size={22} />{h.balls}</span>
        <span title="K.O."><Item slug="black-belt" size={22} />{fr(h.kills)}</span>
      </div>
      <button type="button" className="rx-pause-btn" onClick={onPause} aria-label="Pause">❚❚</button>
      {h.missions?.length > 0 && (
        <div className={`rx-hud-missions${h.boss ? ' is-low' : ''}`}>
          {h.missions.map((m) => (
            <span key={m.id} className={m.done ? 'is-done' : m.failed ? 'is-failed' : ''}>
              <i>{m.done ? '✓' : m.failed ? '✕' : '•'}</i>{m.label}<b>{m.done ? '' : m.failed ? '' : `${m.value}/${m.goal}`}</b>
            </span>
          ))}
        </div>
      )}

      <Loadout h={h} />
      <div className="rx-actions">
        <button type="button" className={`rx-act is-catch${h.canCatch && h.balls > 0 ? ' is-ready' : ''}`} onPointerDown={(e) => { e.stopPropagation(); game()?.throwBall(); }}>
          <Item slug="poke-ball" size={30} /><small>F</small>
        </button>
        <button type="button" className={`rx-act is-dash${h.dash >= 1 ? ' is-ready' : ''}`} style={{ '--k': Math.min(1, h.dash) }} onPointerDown={(e) => { e.stopPropagation(); game()?.dash(); }}>
          <span>➜</span><small>Maj</small>
        </button>
        <button type="button" className="rx-act is-jump" onPointerDown={(e) => { e.stopPropagation(); game()?.jump(true); }} onPointerUp={() => game()?.jump(false)}>
          <span>▲</span><small>Espace</small>
        </button>
        <button type="button" className={`rx-act is-ult${h.ult >= 1 ? ' is-ready' : ''}`} style={{ '--k': Math.min(1, h.ult), '--c': h.ultColor }} onPointerDown={(e) => { e.stopPropagation(); game()?.ultimate(); }}>
          <span>{h.ult >= 1 ? '★' : `${Math.floor(h.ult * 100)}%`}</span><small>R · {h.ultName}</small>
        </button>
      </div>
    </div>
  );
};

/* ——— Montée de niveau ——— */
const RARITY = [
  ['Commun', '#8a93a8'], ['Peu commun', '#34b46a'], ['Rare', '#2f7bf0'], ['Épique', '#9a4ff0'], ['Légendaire', '#f0a020']
];
const rarityOf = (opt) => {
  if (opt.kind === 'evo' || opt.kind === 'mega') return RARITY[4];
  if (opt.kind === 'heal' || opt.kind === 'skip') return RARITY[0];
  return RARITY[Math.min(3, Math.max(0, opt.lv - 1))];
};
const UpgradeCard = ({ opt, partner, index, onPick, h }) => {
  const l = optionLabel(opt, partner);
  const [rar, rc] = rarityOf(opt);
  const type = opt.kind === 'evo' ? (l.type || partner.type) : l.type;
  let icon;
  if (opt.kind === 'weapon') icon = <TypeIcon type={type} size={52} />;
  else if (opt.kind === 'evo') icon = <Sprite dex={l.evoDex} anim="idle" size={96} scale={2.6} />;
  else if (opt.kind === 'mega') icon = <Item slug="key-stone" size={56} />;
  else if (opt.kind === 'passive') icon = <Item slug={ITEM_SLUG[opt.id] || opt.id} size={56} />;
  else icon = <Item slug="oran-berry" size={56} />;
  let delta = null;
  if (opt.kind === 'weapon') {
    const W = WEAPONS[opt.id]; const v = W.at(opt.lv); const dm = h?.stats?.dmg || 1;
    const pow = (x) => (x.dmg ? Math.round(x.dmg * dm) : x.dps ? `${Math.round(x.dps * dm)}/s` : null);
    if (opt.lv > 1) { const a = pow(W.at(opt.lv - 1)); const b = pow(v); if (a !== null && b !== null) delta = `Puissance ${a} → ${b}`; } else if (pow(v) !== null) delta = `Puissance ${pow(v)}`;
  }
  return (
    <button type="button" className={`rx-up-card is-${opt.kind}`} style={{ '--rc': rc, '--tc': TYPE_COLORS[type] || l.color || rc, '--i': index }} onClick={() => onPick(opt)}>
      <span className="rx-up-card-top">
        <Key>{index + 1}</Key>
        {opt.kind === 'weapon' || opt.kind === 'passive' ? (opt.lv === 1 ? <i className="is-new">Nouveau</i> : <i>Niv. {opt.lv - 1} → {opt.lv}</i>) : <i>{l.tag}</i>}
        <span className="rx-up-card-icon">{icon}</span>
      </span>
      <span className="rx-up-card-rar" style={{ color: rc }}>{rar} · {opt.kind === 'weapon' ? `Attaque ${type}` : opt.kind === 'passive' ? 'Objet' : opt.kind === 'evo' ? 'Évolution' : opt.kind === 'mega' ? 'Méga' : 'Soin'}</span>
      <b className="rx-up-card-name">{l.title}</b>
      <em className="rx-up-card-desc">{l.desc}</em>
      {delta && <span className="rx-delta">{delta}</span>}
      {(opt.kind === 'weapon' || opt.kind === 'passive') && <span className="rx-pips">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < opt.lv ? 'on' : ''} />)}</span>}
    </button>
  );
};

export const RushLevelUp = ({ data, partner, h, onPick, onReroll, onSkip }) => {
  const evo = data.options[0]?.kind === 'evo';
  const keys = {};
  data.options.forEach((o, i) => { keys[String(i + 1)] = () => onPick(o); });
  if (!evo) { keys.r = () => { if (data.rerolls) onReroll(); }; keys.s = onSkip; }
  useKeys(keys);
  return (
    <div className="rx-root rx-modal is-game">
      <div className="rx-levelup">
        <header>
          <small>Niveau {data.level}</small>
          <h2>{evo ? 'Choisis ton évolution' : 'Niveau supérieur !'}</h2>
        </header>
        <div className="rx-up-cards" key={data.options.map((o) => o.kind + o.id + o.lv).join('|')}>
          {data.options.map((opt, i) => <UpgradeCard key={`${opt.kind}-${opt.id}`} opt={opt} partner={partner} index={i} onPick={onPick} h={h} />)}
        </div>
        {!evo && (
          <footer>
            <button type="button" className="rx-btn" disabled={!data.rerolls} onClick={onReroll}><Key>R</Key> Relancer ({data.rerolls})</button>
            <button type="button" className="rx-btn is-ghost" onClick={onSkip}><Key>S</Key> Passer · +15 PV</button>
          </footer>
        )}
      </div>
    </div>
  );
};

export const RushAltar = ({ options, onPick }) => {
  const keys = {};
  options.forEach((b, i) => { keys[String(i + 1)] = () => onPick(b.id); });
  useKeys(keys);
  return (
    <div className="rx-root rx-modal is-game">
      <div className="rx-levelup is-altar">
        <header><small>Autel ancien</small><h2>Choisis une bénédiction</h2></header>
        <div className="rx-blessings">
          {options.map((b, i) => (
            <button key={b.id} type="button" className="rx-blessing" style={{ '--c': b.color, '--i': i }} onClick={() => onPick(b.id)}>
              <Key>{i + 1}</Key><span className="rx-blessing-gem" /><b>{b.name}</b><small>{b.id === 'fortune' ? '+40 ₽ et 2 Poké Balls tout de suite.' : b.desc}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ——— Pause ——— */
const RunStats = ({ h }) => {
  const s = h.stats || {};
  const pct = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))} %`;
  return (
    <div className="rx-runstats">
      {[['Dégâts', pct((s.dmg || 1) - 1)], ['Vitesse', pct((s.speed || 1) - 1)], ['Recharge', pct((s.cd || 1) - 1)], ['Critique', `${Math.round((s.crit || 0) * 100)} %`], ['Régén.', `${(s.regen || 0).toFixed(1)}/s`], ['Ramassage', `${Math.round(s.magnet || 80)}`]].map(([k, v]) => (
        <span key={k}><small>{k}</small><b>{v}</b></span>
      ))}
    </div>
  );
};
export const RushPause = ({ h, onResume, onQuit }) => {
  useKeys({ Escape: onResume, p: onResume });
  return (
    <div className="rx-root rx-modal is-game">
      <div className="rx-card rx-pause">
        <div className="rx-pause-main">
          <header className="rx-pause-head">
            <span className="rx-hud-face"><Sprite dex={h.form.dex} anim="idle" size={72} scale={2.1} /><i>{h.level}</i></span>
            <span><h2>Pause</h2><small>{h.form.name} · {clock(h.t)} · {fr(h.kills)} K.O.</small></span>
          </header>
          <RunStats h={h} />
          <small className="rx-label">Attaques</small>
          <div className="rx-pause-list">
            {h.weapons.map((w) => { const W = WEAPONS[w.id]; return <span key={w.id} style={{ '--c': TYPE_COLORS[W.type] || W.color }}><TypeIcon type={W.type} size={24} /><b>{W.name}</b><small>Niv. {w.lv}</small></span>; })}
          </div>
          {h.passives.length > 0 && <><small className="rx-label">Objets</small><div className="rx-pause-list">{h.passives.map((pv) => <span key={pv.id}><Item slug={ITEM_SLUG[pv.id] || pv.id} size={24} /><b>{PASSIVES[pv.id].name}</b><small>Niv. {pv.lv}</small></span>)}</div></>}
          {h.allies.length > 0 && <><small className="rx-label">Équipe</small><div className="rx-pause-list">{h.allies.map((a, i) => <span key={`${a.id}-${i}`}><Sprite dex={a.dex} size={30} scale={0.9} still /><b>{a.alpha ? 'Alpha ' : ''}{a.name}</b><small>{a.types.join(' / ')}</small></span>)}</div></>}
          {h.missions?.length > 0 && <><small className="rx-label">Missions</small><div className="rx-pause-list is-missions">{h.missions.map((m) => <span key={m.id} className={m.done ? 'is-done' : m.failed ? 'is-failed' : ''}><i>{m.done ? '✓' : m.failed ? '✕' : '•'}</i><b>{m.label}</b><small>{m.done ? 'OK' : m.failed ? 'raté' : `${m.value}/${m.goal}`}</small></span>)}</div></>}
        </div>
        <aside className="rx-pause-side">
          <RushMusic />
          <button type="button" className="rx-cta is-go" onClick={onResume}>Reprendre <Key>Échap</Key></button>
          <button type="button" className="rx-btn is-danger" onClick={onQuit}>Abandonner la partie</button>
        </aside>
      </div>
    </div>
  );
};

/* ——— Fin de partie ——— */
export const RushEnd = ({ end, meta, onReplay, onLeague, onHome }) => {
  const win = end.result === 'win';
  useKeys({ Enter: onReplay, Escape: onHome });
  const lg = end.league || { joined: [], ready: [] };
  return (
    <div className="rx-root rx-modal is-game is-end">
      <div className={`rx-card rx-end${win ? ' is-win' : ' is-lose'}`}>
        <header className="rx-end-head">
          <Sprite dex={end.form.dex} anim={win ? 'idle' : 'hurt'} size={120} scale={3.2} />
          <span><small>{win ? 'Le légendaire est K.O.' : `${end.form.name} est K.O.`}</small><h2>{win ? 'Victoire !' : 'Fin de partie'}</h2></span>
        </header>
        <div className="rx-end-stats">
          {[['Temps', clock(end.t)], ['Niveau', end.level], ['K.O.', fr(end.kills)], ['Captures', end.caught.length], ['Boss', end.bosses]].map(([k, v]) => <span key={k}><b>{v}</b><small>{k}</small></span>)}
        </div>
        {(lg.joined.length > 0 || lg.ready.length > 0) && (
          <div className="rx-end-league">
            {lg.joined.map((id) => (
              <div key={id} className="is-joined"><span><Sprite dex={FAMILY[id].dex} anim="idle" size={56} scale={1.6} /></span><b>{FAMILY[id].name} rejoint ta Collection !</b><small>Tu peux maintenant le choisir comme partenaire.</small></div>
            ))}
            {lg.ready.map((id) => (
              <div key={id} className="is-ready"><span><Sprite dex={FAMILY[id].dex} size={56} scale={1.6} still /></span><b>Défi réussi : {FAMILY[id].name}</b><small>Il apparaîtra à l’état sauvage dans tes prochaines parties. Capture-le !</small></div>
            ))}
          </div>
        )}
        {end.caught.length > 0 && (
          <div className="rx-end-caught">{end.caught.slice(0, 14).map((id, i) => <span key={`${id}-${i}`} title={foeName(id)}><Sprite dex={foeDex(id)} size={42} scale={1.2} still /></span>)}</div>
        )}
        <div className="rx-end-cols">
          <ScoreCard score={end.score} best={end.reward.prevScore} />
          <div className="rx-reward">
            <ul>{end.reward.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{fr(l.v)}</b></li>)}</ul>
            <div><span>Points de Ligue</span><b>+{fr(end.reward.earned)} PL</b><small>Total : {fr(meta.pl)} PL</small></div>
          </div>
        </div>
        <footer>
          <button type="button" className="rx-cta is-go" onClick={onReplay}>Rejouer <Key>Entrée</Key></button>
          <button type="button" className="rx-btn" onClick={onLeague}>Collection</button>
          <button type="button" className="rx-btn is-ghost" onClick={onHome}>Accueil</button>
        </footer>
      </div>
    </div>
  );
};
