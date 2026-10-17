import React, { useEffect, useMemo, useState } from 'react';
import { TYPE_COLOR } from './ArenaBoardIso';
import {
  AIM_LABELS,
  ITEM_MAP,
  LINES,
  LINE_MAP,
  RECIPE_LIST,
  ROSTER_LINES,
  RUN_POOL_SIZE,
  STARTER_LINES,
  TYPES,
  lineSynergyRows,
  linePlaystyle,
  rangeLabel,
  traitBonus,
  traitCap,
  traitDossier,
  unitFromLine
} from './pokeArenaData';
import { CHAPTERS, FLOORS_PER_CHAPTER, NODE_INFO, isFightKind } from './pokeArenaCampaign';

export const ROLE_COLOR = { Starter: '#e9a23b', Force: '#d1495b', Mage: '#5c7cfa' };
export const tint = (t) => TYPE_COLOR[t] || ROLE_COLOR[t] || '#9aa3c2';
export const stars = (n) => '★'.repeat(n);
/** Nom sans les ★ des formes répétées (les étoiles sont affichées à part). */
export const displayName = (name = '') => name.replace(/\s*★+$/, '');

const GENS = [[1, 151], [152, 251], [252, 386], [387, 493], [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025]];
const genOf = (dex) => {
  const i = GENS.findIndex(([a, b]) => dex >= a && dex <= b);
  return i < 0 ? 0 : i + 1;
};

/* ———————————————— Petites briques ———————————————— */

export const PokeSprite = ({ unit, size = 'md', className = '' }) => {
  const chain = [unit?.home, unit?.art, unit?.sprite].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [unit?.dex]);
  if (!unit) return null;
  return (
    <img
      className={`ui-sprite size-${size}${unit.star >= 3 ? ' is-gold' : ''} ${className}`}
      src={chain[Math.min(idx, chain.length - 1)]}
      alt={displayName(unit.name)}
      draggable={false}
      loading="lazy"
      onError={() => setIdx((i) => Math.min(i + 1, chain.length - 1))}
    />
  );
};

export const ItemIcon = ({ item, size = 28 }) => {
  const [fail, setFail] = useState(false);
  if (!item) return null;
  if (item.sprite && !fail) {
    return (
      <img
        src={item.sprite}
        alt={item.name}
        className="ui-item-img"
        style={{ width: size, height: size }}
        draggable={false}
        onError={() => setFail(true)}
      />
    );
  }
  return <span className="ui-item-fallback" style={{ width: size, height: size }}>{item.name.slice(0, 1)}</span>;
};

export const TypeChip = ({ type, small, onHover }) => (
  <span
    className={`ui-type${small ? ' is-small' : ''}`}
    style={{ '--t': tint(type) }}
    onMouseEnter={(e) => onHover?.(type, e)}
    onMouseLeave={() => onHover?.(null)}
  >
    {type}
  </span>
);

const StatRow = ({ label, value, max }) => (
  <div className="ui-stat">
    <span>{label}</span>
    <i><b style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></i>
    <strong>{value}</strong>
  </div>
);

/** Fiche détaillée d’un Pokémon (survol / sélection). */
export const UnitCard = ({ unit, onTrait, compact = false, footer = null }) => {
  if (!unit) return null;
  const types = unit.types || [unit.type];
  const roles = (unit.traits || []).filter((t) => !types.includes(t));
  const plates = (unit.items || []).map((id) => ITEM_MAP[id]?.addTrait).filter(Boolean);
  return (
    <article className={`ui-card${compact ? ' is-compact' : ''}`} style={{ '--t': tint(unit.type) }}>
      <header className="ui-card-head">
        <div className="ui-card-art">
          <PokeSprite unit={unit} size="lg" />
        </div>
        <div className="ui-card-id">
          <h3>{displayName(unit.name)}</h3>
          <p>
            <span className="ui-stars">{stars(unit.star)}</span>
            <span className={`ui-cost cost-${unit.cost}`}>{unit.cost} or</span>
            <span className="ui-range">{rangeLabel(unit.range)}</span>
          </p>
          <div className="ui-chips">
            {[...types, ...roles, ...plates.filter((p) => !types.includes(p) && !roles.includes(p))].map((t) => (
              <TypeChip key={t} type={t} small onHover={onTrait} />
            ))}
          </div>
        </div>
      </header>
      <div className="ui-stats">
        <StatRow label="PV" value={unit.hp} max={1800} />
        <StatRow label="ATK" value={unit.atk} max={260} />
        <StatRow label="VIT" value={unit.spd} max={22} />
      </div>
      {unit.spell && (
        <section className="ui-ability">
          <h4>{unit.spell.name}</h4>
          <p>{unit.spell.desc}</p>
        </section>
      )}
      {unit.ab && (
        <section className="ui-ability is-talent">
          <h4>Talent : {unit.ab.name}</h4>
          <p>{unit.ab.desc}</p>
        </section>
      )}
      {(unit.items || []).length > 0 && (
        <ul className="ui-card-items">
          {unit.items.map((id, i) => {
            const it = ITEM_MAP[id];
            if (!it) return null;
            return (
              <li key={`${id}-${i}`}>
                <ItemIcon item={it} size={26} />
                <div><b>{it.name}</b><span>{it.desc}</span></div>
              </li>
            );
          })}
        </ul>
      )}
      {footer}
    </article>
  );
};

/** Bulle d’explication d’une synergie. */
export const TraitPopup = ({ pop }) => {
  if (!pop?.trait) return null;
  const doc = traitDossier(pop.trait);
  return (
    <div className="ui-pop" style={{ left: pop.left, top: pop.top, '--t': tint(pop.trait) }} role="tooltip">
      <header>
        <strong>{doc.title}</strong>
        {pop.count != null && <em>{pop.count} sur le terrain</em>}
      </header>
      {doc.blurb && <p>{doc.blurb}</p>}
      {doc.tiers.length > 0 && (
        <ul>
          {doc.tiers.map((tier) => (
            <li key={tier.n} className={pop.count >= tier.n ? 'is-on' : ''}>{tier.label}</li>
          ))}
        </ul>
      )}
      {doc.strong.length > 0 && <p><b>Efficace contre</b> {doc.strong.map((r) => r.name).join(', ')}</p>}
      {doc.weak.length > 0 && <p><b>Peu efficace contre</b> {doc.weak.map((r) => r.name).join(', ')}</p>}
    </div>
  );
};

/** Panneau des synergies actives (à gauche du plateau). */
export const TraitPanel = ({ units, onTrait }) => {
  const info = useMemo(() => traitBonus(units), [units]);
  const rows = Object.entries(info.counts || {})
    .map(([trait, count]) => ({ trait, count, cap: traitCap(trait), active: count >= 2 }))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.count - a.count || a.trait.localeCompare(b.trait, 'fr'));
  return (
    <aside className="ui-traits" aria-label="Synergies">
      <h2>Synergies</h2>
      {!rows.length && <p className="ui-empty">Place des Pokémon sur le terrain : 2 du même type activent un bonus.</p>}
      <ul>
        {rows.map((r) => {
          const tip = info.details?.find((d) => d.trait === r.trait)?.tip || '';
          return (
            <li
              key={r.trait}
              className={r.active ? 'is-active' : ''}
              style={{ '--t': tint(r.trait) }}
              onMouseEnter={(e) => onTrait?.(r.trait, e, { count: r.count, tip })}
              onMouseLeave={() => onTrait?.(null)}
            >
              <span className="ui-trait-badge">{r.count}</span>
              <div>
                <strong>{r.trait}</strong>
                <span className="ui-pips" aria-hidden>
                  {Array.from({ length: Math.max(2, r.cap) }).map((_, i) => <i key={i} className={i < r.count ? 'on' : ''} />)}
                </span>
                <em>{r.active ? tip : `encore ${2 - r.count} pour activer`}</em>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

const useEscape = (fn) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') fn(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fn]);
};

export const RecipeModal = ({ onClose }) => {
  useEscape(onClose);
  return (
  <div className="ui-modal" role="dialog" aria-label="Recettes d’objets" onClick={onClose}>
    <div className="ui-modal-card is-wide" onClick={(e) => e.stopPropagation()}>
      <header>
        <h2>Recettes</h2>
        <button type="button" className="ui-btn is-ghost" onClick={onClose}>Fermer</button>
      </header>
      <p className="ui-muted">Deux vitamines sur le même Pokémon se combinent automatiquement.</p>
      <ul className="ui-recipes">
        {RECIPE_LIST.map((row) => (
          <li key={`${row.a}-${row.b}`}>
            <span className="ui-recipe-in">
              <ItemIcon item={ITEM_MAP[row.a]} size={26} />
              <b>+</b>
              <ItemIcon item={ITEM_MAP[row.b]} size={26} />
            </span>
            <ItemIcon item={row.result} size={34} />
            <div>
              <strong>{row.result.name}</strong>
              <span>{row.result.desc}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
  );
};

/* ———————————————— Choix du starter ———————————————— */

const evolutionPreview = (line) => {
  const pre = (line.forms ? line.stages.slice(0, line.branchAt - 1) : line.stages)
    .filter((st, i, arr) => i === 0 || st.dex !== arr[i - 1].dex);
  const branches = (line.forms || []).map((f) => f.stages[0]);
  return { pre, branches };
};

const MiniStage = ({ stage }) => (
  <figure className="ui-evo-stage">
    <PokeSprite unit={{ home: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${stage.dex}.png`, art: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.dex}.png`, dex: stage.dex, name: stage.name }} size="md" />
    <figcaption>{displayName(stage.name)}</figcaption>
  </figure>
);

export const StarterScreen = ({ onPick, onBack, onTrait }) => {
  const [gen, setGen] = useState(0);
  const [type, setType] = useState('');
  const [pickId, setPickId] = useState(STARTER_LINES[0]?.id);
  const list = STARTER_LINES.filter((line) => {
    const first = line.stages[0];
    if (gen && genOf(first.dex) !== gen) return false;
    if (type) {
      const all = new Set();
      line.stages.forEach((s) => s.types.forEach((t) => all.add(t)));
      (line.forms || []).forEach((f) => f.stages.forEach((s) => s.types.forEach((t) => all.add(t))));
      if (!all.has(type)) return false;
    }
    return true;
  });
  const line = LINE_MAP[pickId] || list[0];
  const unit = line ? unitFromLine(line.id, 1, `starter-${line.id}`) : null;
  const evo = line ? evolutionPreview(line) : null;
  const typeFilters = ['Feu', 'Eau', 'Plante', 'Normal'];
  return (
    <div className="ui-starter">
      <header className="ui-screen-head">
        <div>
          <h1>Choisis ton partenaire</h1>
          <p>Il commence sur le terrain. Deux autres starters, tirés au hasard, apparaîtront dans ta boutique.</p>
        </div>
        <button type="button" className="ui-btn is-ghost" onClick={onBack}>Retour</button>
      </header>
      <div className="ui-starter-body">
        <section className="ui-starter-pick">
          <div className="ui-filters" role="toolbar" aria-label="Filtres">
            <button type="button" className={`ui-chip${gen === 0 ? ' is-on' : ''}`} onClick={() => setGen(0)}>Toutes les régions</button>
            {['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea'].map((name, i) => (
              <button key={name} type="button" className={`ui-chip${gen === i + 1 ? ' is-on' : ''}`} onClick={() => setGen(i + 1)}>{name}</button>
            ))}
          </div>
          <div className="ui-filters" role="toolbar" aria-label="Type">
            <button type="button" className={`ui-chip${type === '' ? ' is-on' : ''}`} onClick={() => setType('')}>Tous les types</button>
            {typeFilters.map((t) => (
              <button key={t} type="button" className={`ui-chip is-type${type === t ? ' is-on' : ''}`} style={{ '--t': tint(t) }} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
          <div className="ui-starter-grid">
            {list.map((l) => {
              const u = unitFromLine(l.id, 1, `s-${l.id}`);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`ui-starter-card${line?.id === l.id ? ' is-on' : ''}`}
                  style={{ '--t': tint(u.type) }}
                  onClick={() => setPickId(l.id)}
                  onDoubleClick={() => onPick(l.id)}
                  aria-pressed={line?.id === l.id}
                >
                  <PokeSprite unit={u} size="md" />
                  <strong>{displayName(u.name)}</strong>
                  <span className="ui-dots">{u.types.map((t) => <i key={t} style={{ background: tint(t) }} title={t} />)}</span>
                </button>
              );
            })}
            {!list.length && <p className="ui-empty">Aucun starter avec ces filtres.</p>}
          </div>
        </section>
        {line && unit && (
          <section className="ui-starter-detail" style={{ '--t': tint(unit.type) }}>
            <div className="ui-starter-hero">
              <PokeSprite unit={{ ...unit, home: unit.art, art: unit.home }} size="xl" />
            </div>
            <h2>{displayName(unit.name)}</h2>
            <div className="ui-chips">
              {unit.types.map((t) => <TypeChip key={t} type={t} onHover={onTrait} />)}
              <span className={`ui-cost cost-${line.cost}`}>{line.cost} or</span>
            </div>
            <div className="ui-evo">
              {evo.pre.map((st, i) => (
                <React.Fragment key={st.dex}>
                  {i > 0 && <span className="ui-evo-arrow" aria-hidden>›</span>}
                  <MiniStage stage={st} />
                </React.Fragment>
              ))}
              {evo.branches.length > 0 && (
                <>
                  <span className="ui-evo-arrow" aria-hidden>›</span>
                  <div className="ui-evo-branch">
                    {evo.branches.map((st) => <MiniStage key={st.dex} stage={st} />)}
                  </div>
                </>
              )}
            </div>
            <div className="ui-stats">
              <StatRow label="PV" value={unit.hp} max={600} />
              <StatRow label="ATK" value={unit.atk} max={90} />
              <StatRow label="VIT" value={unit.spd} max={22} />
            </div>
            <p className="ui-muted">{linePlaystyle(line)} · {rangeLabel(line.range)}</p>
            <section className="ui-ability">
              <h4>{line.spell?.name}</h4>
              <p>{line.spell?.desc}</p>
            </section>
            {unit.ab && (
              <section className="ui-ability is-talent">
                <h4>Talent : {unit.ab.name}</h4>
                <p>{unit.ab.desc}</p>
              </section>
            )}
            <button type="button" className="ui-btn is-primary is-big" onClick={() => onPick(line.id)}>
              Partir avec {displayName(unit.name)}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

/* ———————————————— Carte ———————————————— */

export const MapScreen = ({ map, floor, path, onEnter, hud, team }) => {
  const [focus, setFocus] = useState(null);
  const current = map[floor]?.nodes || [];
  const shown = focus || current[0] || null;
  return (
    <div className="ui-map">
      <div className="ui-map-main">
        {CHAPTERS.map((ch) => {
          const floors = map.filter((f) => f.chapter === ch.id);
          const done = floors.every((f) => f.floor < floor);
          return (
            <section key={ch.id} className={`ui-chapter biome-${ch.biome}${done ? ' is-done' : ''}`}>
              <header>
                <h2>{ch.name}</h2>
                <p>{ch.blurb}</p>
              </header>
              <ol className="ui-route">
                {floors.map((f) => (
                  <li key={f.floor} className={`ui-floor${f.floor === floor ? ' is-current' : ''}${f.floor < floor ? ' is-past' : ''}`}>
                    <span className="ui-floor-n">{f.floor + 1}</span>
                    <div className="ui-floor-nodes">
                      {f.nodes.map((node) => {
                        const chosen = path.includes(node.id);
                        const playable = f.floor === floor;
                        const meta = NODE_INFO[node.kind];
                        return (
                          <button
                            key={node.id}
                            type="button"
                            className={`ui-node kind-${node.kind}${chosen ? ' is-chosen' : ''}${playable ? ' is-playable' : ''}`}
                            disabled={!playable}
                            onClick={() => onEnter(node)}
                            onMouseEnter={() => setFocus(node)}
                            onFocus={() => setFocus(node)}
                            aria-label={`${meta.label}${node.trainer ? `, ${node.trainer.title} ${node.trainer.name}` : ''}`}
                          >
                            <span className="ui-node-icon" aria-hidden>{meta.icon}</span>
                            {node.kind === 'boss' && <span className="ui-node-tag">{node.trainer.name}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      <aside className="ui-map-side">
        {hud}
        {shown && (
          <div className={`ui-node-info kind-${shown.kind}`}>
            <span className="ui-node-icon" aria-hidden>{NODE_INFO[shown.kind].icon}</span>
            <div>
              <h3>{NODE_INFO[shown.kind].label}{shown.floor === floor ? '' : ` (étage ${shown.floor + 1})`}</h3>
              <p>{NODE_INFO[shown.kind].hint}</p>
              {shown.trainer && (
                <>
                  <p className="ui-trainer"><b>{shown.trainer.title} {shown.trainer.name}</b></p>
                  <div className="ui-chips">{shown.trainer.types.map((t) => <TypeChip key={t} type={t} small />)}</div>
                </>
              )}
            </div>
          </div>
        )}
        <div className="ui-map-team">
          <h3>Ton équipe</h3>
          <div className="ui-team-row">
            {team.length ? team.map((u) => (
              <span key={u.uid} className="ui-team-mon" title={`${displayName(u.name)} ${stars(u.star)}`}>
                <PokeSprite unit={u} size="sm" />
                <em>{stars(u.star)}</em>
              </span>
            )) : <p className="ui-empty">Personne pour l’instant.</p>}
          </div>
        </div>
        <p className="ui-muted">Choisis une étape de la colonne qui brille. Les combats te rapportent de l’or ; les Poké Marts vendent des objets.</p>
      </aside>
    </div>
  );
};

/* ———————————————— Poké Mart ———————————————— */

export const MartScreen = ({ stock, gold, onBuy, onReroll, onLeave, bag, hud }) => (
  <div className="ui-mart">
    <header className="ui-screen-head">
      <div>
        <h1>Poké Mart</h1>
        <p>Les objets achetés vont dans ton sac. Équipe-les pendant la préparation d’un combat.</p>
      </div>
      <div className="ui-head-actions">
        <button type="button" className="ui-btn" onClick={onReroll} disabled={gold < 2}>Nouveaux articles (2 or)</button>
        <button type="button" className="ui-btn is-primary" onClick={onLeave}>Reprendre la route</button>
      </div>
    </header>
    {hud}
    <ul className="ui-shelf">
      {stock.map((slot) => {
        const it = ITEM_MAP[slot.itemId];
        if (!it) return null;
        const kind = it.component ? 'Vitamine' : it.plate ? 'Plaque' : it.consumable ? 'Consommable' : 'Objet tenu';
        return (
          <li key={slot.key} className={`ui-ware${slot.sold ? ' is-sold' : ''}`}>
            <div className="ui-ware-icon"><ItemIcon item={it} size={48} /></div>
            <span className="ui-ware-kind">{kind}</span>
            <strong>{it.name}</strong>
            <p>{it.desc}</p>
            <button type="button" className="ui-btn is-buy" disabled={slot.sold || gold < slot.price} onClick={() => onBuy(slot)}>
              {slot.sold ? 'Vendu' : `${slot.price} or`}
            </button>
          </li>
        );
      })}
    </ul>
    <div className="ui-bag-preview">
      <h3>Ton sac</h3>
      <div className="ui-bag-row">
        {bag.length ? bag.map((id, i) => <span key={`${id}-${i}`} title={ITEM_MAP[id]?.name}><ItemIcon item={ITEM_MAP[id]} size={30} /></span>) : <p className="ui-empty">Vide.</p>}
      </div>
    </div>
  </div>
);

/* ———————————————— Événement ———————————————— */

export const EventScreen = ({ options, onChoose, hud }) => (
  <div className="ui-event">
    <header className="ui-screen-head">
      <div>
        <h1>Une rencontre sur la route</h1>
        <p>Choisis une seule récompense.</p>
      </div>
    </header>
    {hud}
    <ul className="ui-event-opts">
      {options.map((o) => {
        const it = o.itemId ? ITEM_MAP[o.itemId] : null;
        const u = o.lineId ? unitFromLine(o.lineId, o.star || 1, `ev-${o.lineId}`) : null;
        return (
          <li key={o.id}>
            <button type="button" className="ui-event-card" onClick={() => onChoose(o)}>
              <div className="ui-event-art">
                {it && <ItemIcon item={it} size={56} />}
                {u && <PokeSprite unit={u} size="lg" />}
                {!it && !u && <span className="ui-event-glyph" aria-hidden>{o.id === 'gold' ? '🪙' : o.id === 'xp' ? '📘' : '♨️'}</span>}
              </div>
              <strong>{o.title}</strong>
              <p>{o.text}</p>
              <span className="ui-event-reward">{o.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);

/* ———————————————— Codex ———————————————— */

export const CodexScreen = ({ onBack, onTrait }) => {
  const [cost, setCost] = useState(0);
  const [query, setQuery] = useState('');
  const [typeF, setTypeF] = useState('');
  const [pick, setPick] = useState(LINES[0]?.id);
  const lines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LINES.filter((line) => {
      if (cost && line.cost !== cost) return false;
      const allStages = [...line.stages, ...(line.forms || []).flatMap((f) => f.stages)];
      if (typeF && !allStages.some((s) => s.types.includes(typeF)) && !(line.traits || []).includes(typeF)) return false;
      if (!q) return true;
      const hay = `${allStages.map((s) => s.name).join(' ')} ${line.spell?.name || ''} ${line.ab?.name || ''} ${(line.forms || []).map((f) => f.ab?.name || '').join(' ')}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => a.cost - b.cost || a.stages[0].name.localeCompare(b.stages[0].name, 'fr'));
  }, [cost, query, typeF]);
  const detail = LINE_MAP[pick] || lines[0];
  const steps = detail
    ? (detail.forms
      ? [
        ...Array.from({ length: detail.branchAt - 1 }, (_, i) => ({ star: i + 1, units: [unitFromLine(detail.id, i + 1, `cx-${i}`)] })),
        ...Array.from({ length: 4 - detail.branchAt }, (_, k) => {
          const star = detail.branchAt + k;
          return { star, units: detail.forms.map((f) => unitFromLine(detail.id, star, `cx-${f.id}-${star}`, [], f.id)) };
        })
      ]
      : [1, 2, 3].map((star) => ({ star, units: [unitFromLine(detail.id, star, `cx-${star}`)] })))
    : [];
  const rows = detail ? lineSynergyRows(detail) : [];
  return (
    <div className="ui-codex">
      <header className="ui-screen-head">
        <div>
          <h1>Pokédex de l’arène</h1>
          <p>{lines.length} lignées affichées sur {ROSTER_LINES}. En run, ta boutique en propose ~{RUN_POOL_SIZE}.</p>
        </div>
        <button type="button" className="ui-btn is-ghost" onClick={onBack}>Retour</button>
      </header>
      <div className="ui-codex-body">
        <aside className="ui-codex-list">
          <input className="ui-search" type="search" placeholder="Nom, sort ou talent" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher" />
          <div className="ui-filters">
            {[0, 1, 2, 3, 4, 5].map((c) => (
              <button key={c} type="button" className={`ui-chip${cost === c ? ' is-on' : ''}`} onClick={() => setCost(c)}>{c ? `${c} or` : 'Tous'}</button>
            ))}
          </div>
          <select className="ui-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} aria-label="Type">
            <option value="">Tous les types</option>
            {[...TYPES, 'Starter', 'Force', 'Mage'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ul>
            {lines.map((line) => {
              const u = unitFromLine(line.id, 1, `cl-${line.id}`);
              return (
                <li key={line.id}>
                  <button type="button" className={`ui-codex-row${detail?.id === line.id ? ' is-on' : ''}`} onClick={() => setPick(line.id)} style={{ '--t': tint(u.type) }}>
                    <PokeSprite unit={u} size="sm" />
                    <span>{displayName(u.name)}</span>
                    <em className={`ui-cost cost-${line.cost}`}>{line.cost}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        {detail && (
          <section className="ui-codex-detail">
            <div className="ui-codex-steps">
              {steps.map((step) => (
                <div key={step.star} className="ui-codex-step">
                  <span className="ui-stars">{stars(step.star)}</span>
                  <div className="ui-codex-forms">
                    {step.units.filter(Boolean).map((u) => (
                      <figure key={u.uid} style={{ '--t': tint(u.type) }}>
                        <PokeSprite unit={u} size="lg" />
                        <figcaption>
                          <b>{displayName(u.name)}</b>
                          <span className="ui-chips">{u.types.map((t) => <TypeChip key={t} type={t} small onHover={onTrait} />)}</span>
                          <small>PV {u.hp} · ATK {u.atk} · VIT {u.spd}</small>
                          {detail.forms && u.ab && u.ab !== detail.ab && <small>Talent : {u.ab.name}</small>}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="ui-codex-text">
              <section className="ui-ability">
                <h4>{detail.spell?.name}</h4>
                <p>{detail.spell?.desc}</p>
                <p className="ui-muted">Ciblage : {AIM_LABELS[detail.spell?.aim] || '—'}. {rangeLabel(detail.range)} ; ses sorts portent à {(detail.range || 1) + 1} cases.</p>
              </section>
              {detail.ab && (
                <section className="ui-ability is-talent">
                  <h4>Talent : {detail.ab.name}</h4>
                  <p>{detail.ab.desc}</p>
                  {(detail.forms || []).some((f) => f.ab && f.ab !== detail.ab) && (
                    <ul>
                      {detail.forms.map((f) => <li key={f.id}><b>{displayName(f.stages[0].name)}</b> : {f.ab?.name} — {f.ab?.desc}</li>)}
                    </ul>
                  )}
                </section>
              )}
              <section className="ui-codex-syn">
                <h4>Synergies</h4>
                <ul>
                  {rows.map((r) => (
                    <li key={r.trait} style={{ '--t': tint(r.trait) }}>
                      <TypeChip type={r.trait} small onHover={onTrait} />
                      <span>{r.tiers.map((t) => t.label).join(' ; ') || r.blurb}</span>
                      <em>{r.where.join(', ')}</em>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/* ———————————————— Résultat d’un combat ———————————————— */

export const ResultOverlay = ({ result, onContinue, continueLabel }) => {
  if (!result) return null;
  const { win, gains, loot, hpLost, meter, boss } = result;
  return (
    <div className="ui-result" role="dialog" aria-label={win ? 'Victoire' : 'Défaite'}>
      <div className={`ui-result-card${win ? ' is-win' : ' is-loss'}`}>
        {win && <div className="ui-confetti" aria-hidden>{Array.from({ length: 24 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
        <h2>{win ? 'Victoire !' : 'Défaite…'}</h2>
        {boss && win && <p className="ui-result-sub">Tu as battu {boss} ! Choisis un objet en récompense.</p>}
        {!win && boss && <p className="ui-result-sub">Le champion bloque la route : retente ta chance.</p>}
        <ul className="ui-result-lines">
          <li><span>Or gagné</span><strong>+{gains.total}</strong><em>base {gains.base}, intérêts {gains.interest}, série {gains.streakBonus}{gains.winBonus ? `, victoire ${gains.winBonus}` : ''}</em></li>
          <li><span>Expérience</span><strong>+2 XP</strong></li>
          {hpLost > 0 && <li className="is-bad"><span>PV de dresseur</span><strong>-{hpLost}</strong></li>}
          {loot.length > 0 && (
            <li><span>Butin</span><strong className="ui-loot">{loot.map((id, i) => <ItemIcon key={`${id}-${i}`} item={ITEM_MAP[id]} size={28} />)}</strong></li>
          )}
        </ul>
        {meter.length > 0 && (
          <div className="ui-meter is-result">
            <h3>Dégâts infligés</h3>
            {meter.slice(0, 5).map((m) => (
              <div key={m.uid} className="ui-meter-row">
                <span>{displayName(m.name)}</span>
                <i><b style={{ width: `${(m.dmg / Math.max(1, meter[0].dmg)) * 100}%` }} /></i>
                <strong>{m.dmg}</strong>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="ui-btn is-primary is-big" onClick={onContinue} autoFocus>{continueLabel}</button>
      </div>
    </div>
  );
};

export const RewardModal = ({ choices, onPick }) => (
  <div className="ui-modal" role="dialog" aria-label="Récompense">
    <div className="ui-modal-card">
      <header><h2>Récompense du champion</h2></header>
      <ul className="ui-reward">
        {choices.map((id) => {
          const it = ITEM_MAP[id];
          return (
            <li key={id}>
              <button type="button" className="ui-reward-card" onClick={() => onPick(id)}>
                <ItemIcon item={it} size={52} />
                <strong>{it.name}</strong>
                <span>{it.desc}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

export const chapterLabel = (floor) => {
  const ch = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(floor / FLOORS_PER_CHAPTER))];
  return ch?.name || '';
};

export { isFightKind };
