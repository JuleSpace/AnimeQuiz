import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountChip, useCloudSync } from './account';
import { PmdSprite } from './PokeSwarm';
import SWARM_SHEETS from './swarmSheets';
import { PR_DEX, PR_TYPES } from './prairieDex';
import {
  BALLS, PARTY_MAX, SHOP_ITEMS, STARTERS, WINS_FOR_GYM, ZONES, buy, catchUp, chooseStarter, curHp, dexName, duplicates, expFor,
  exportSave, gymReady, gymTeam, hit, importSave, itemSprite, levelCap, loadLocal, maxHp, mergeSaves, monById, nextFighter,
  partyMons, progressScore, release, releaseValue, saveLocal, setParty, settle, spawnWild, speedOf, spriteOf, stars, travel,
  typesOf, feedCandy, winGym
} from './prairieGame';
import './PokePrairie.css';

export const PRAIRIE_HASH = '#prairie';

/** Pont avec l'appli de bureau (Electron) : présent seulement dans l'appli. */
const desk = typeof window !== 'undefined' ? window.prairieDesktop : null;
const GEN_NAMES = ['Tous', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea'];
const TYPE_COLORS = ['#a8a77a', '#c22e28', '#a98ff3', '#a33ea1', '#e2bf65', '#b6a136', '#a6b91a', '#735797', '#b7b7ce', '#ee8130', '#6390f0', '#7ac74c', '#f7d02c', '#f95587', '#96d9d6', '#6f35fc', '#705746', '#d685ad'];
const fr = (n) => Math.round(n).toLocaleString('fr-FR');
const dur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

/* ——— Sprites ——— */
const Mon = ({ dex, shiny, className = '', flip = false }) => {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className={`pr-mon is-fb ${className}`}>?</span>;
  return <img className={`pr-mon ${className}`} style={flip ? { transform: 'scaleX(-1)' } : undefined} src={spriteOf(dex, shiny)} alt={dexName(dex)} draggable={false} loading="lazy" onError={() => setBroken(true)} />;
};
/** Sur la route : sprite animé Donjon Mystère quand il existe (marche, attaque), sinon le sprite fixe qui sautille. */
const RouteMon = ({ dex, shiny, facing, anim, size }) => {
  if (SWARM_SHEETS[dex] && !shiny) {
    return <PmdSprite dex={dex} anim={anim === 'attack' && SWARM_SHEETS[dex].attack ? 'attack' : anim === 'walk' ? 'walk' : 'idle'} dir={facing === 'right' ? 2 : 6} size={size} scale={size / 26} foot={0.94} />;
  }
  return <span className={`pr-route-static is-${anim}`} style={{ width: size, height: size }}><Mon dex={dex} shiny={shiny} flip={facing === 'right'} /></span>;
};
const Ball = ({ id, size = 22 }) => <img className="pr-ball" src={itemSprite(BALLS[id].slug)} alt="" width={size} height={size} draggable={false} />;
const TypeTag = ({ t }) => <span className="pr-type" style={{ '--t': TYPE_COLORS[t] }}>{PR_TYPES[t]}</span>;
const Stars = ({ n }) => <span className="pr-stars">{'★'.repeat(n)}</span>;
const Bar = ({ value, max, kind = 'hp' }) => {
  const p = Math.max(0, Math.min(1, value / max));
  return <span className={`pr-bar is-${kind}${kind === 'hp' && p < 0.25 ? ' is-low' : kind === 'hp' && p < 0.5 ? ' is-mid' : ''}`}><i style={{ width: `${p * 100}%` }} /></span>;
};

/* ——— Choix du starter ——— */
const StarterPick = ({ onPick }) => (
  <div className="pr-starter">
    <h2>Choisis ton premier partenaire</h2>
    <p>Il part tout seul sur la route, combat les Pokémon sauvages et en recrute d’autres pour toi. Même quand le jeu est fermé.</p>
    <div className="pr-starter-grid">
      {STARTERS.map((d) => (
        <button key={d} type="button" className="pr-starter-cell" onClick={() => onPick(d)}>
          <Mon dex={d} />
          <b>{dexName(d)}</b>
          <span>{typesOf(d).map((t) => <TypeTag key={t} t={t} />)}</span>
        </button>
      ))}
    </div>
  </div>
);

/* ——— Récap « Pendant ton absence » ——— */
const AwayCard = ({ sum, onClose }) => (
  <div className="pr-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="pr-card">
      <h2>Pendant ton absence <small>({dur(sum.ms)})</small></h2>
      <div className="pr-recap">
        <span><b>{fr(sum.wins)}</b> victoires</span>
        <span><b>{fr(sum.money)}</b> ₽</span>
        <span><b>{sum.levels}</b> niveaux gagnés</span>
        {sum.wipes > 0 && <span className="is-bad"><b>{sum.wipes}</b> K.O. d’équipe</span>}
      </div>
      {sum.evolutions.length > 0 && (
        <div className="pr-away-row"><h3>Évolutions</h3>{sum.evolutions.map((e, i) => <span key={i} className="pr-away-evo"><Mon dex={e.from} />→<Mon dex={e.d} /></span>)}</div>
      )}
      {sum.caught.length > 0 ? (
        <div className="pr-away-row"><h3>{sum.caught.length} recrue{sum.caught.length > 1 ? 's' : ''}</h3><div className="pr-away-mons">{sum.caught.slice(0, 60).map((c, i) => <span key={i} className={c.s ? 'is-shiny' : ''} title={dexName(c.d)}><Mon dex={c.d} shiny={Boolean(c.s)} /></span>)}</div></div>
      ) : <p className="pr-note">Aucune recrue : vérifie tes Poké Balls et tes règles de capture.</p>}
      <button type="button" className="pr-btn is-main" onClick={onClose}>Reprendre la route</button>
    </div>
  </div>
);

/* ——— Onglet Équipe & PC ——— */
const Team = ({ save, setSave, toast }) => {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');
  const [pick, setPick] = useState(null); // uid du PC sélectionné pour un échange
  const party = partyMons(save);
  const cap = levelCap(save);
  const inParty = new Set(save.party);
  let pc = save.box.filter((m) => !inParty.has(m.u) && (!q.trim() || dexName(m.d).toLowerCase().includes(q.trim().toLowerCase())));
  if (sort === 'recent') pc = [...pc].reverse();
  else if (sort === 'level') pc = [...pc].sort((a, b) => b.l - a.l);
  else if (sort === 'dex') pc = [...pc].sort((a, b) => a.d - b.d);
  else if (sort === 'rare') pc = [...pc].sort((a, b) => stars(b.d) - stars(a.d) || b.s - a.s);
  const dups = useMemo(() => duplicates(save), [save]);
  const dupMoney = useMemo(() => { const s = new Set(dups); return save.box.filter((m) => s.has(m.u)).reduce((n, m) => n + releaseValue(m), 0); }, [dups, save.box]);
  const moveLead = (u) => setSave(setParty(save, [u, ...save.party.filter((x) => x !== u)]));
  const remove = (u) => { if (save.party.length <= 1) { toast('Il faut garder au moins un Pokémon dans l’équipe.'); return; } setSave(setParty(save, save.party.filter((x) => x !== u))); };
  const addOrSwap = (u, target) => {
    if (target) setSave(setParty(save, save.party.map((x) => (x === target ? u : x))));
    else if (save.party.length < PARTY_MAX) setSave(setParty(save, [...save.party, u]));
    else { setPick(u); toast('Équipe pleine : clique sur un membre de l’équipe pour l’échanger.'); return; }
    setPick(null);
  };
  return (
    <div className="pr-team">
      <div className="pr-party">
        {party.map((m, i) => (
          <div key={m.u} className={`pr-party-card${i === 0 ? ' is-lead' : ''}${pick ? ' is-target' : ''}${m.s ? ' is-shiny' : ''}`} onClick={() => pick && addOrSwap(pick, m.u)}>
            {i === 0 && <em>Tête</em>}
            <Mon dex={m.d} shiny={Boolean(m.s)} />
            <div>
              <b>{dexName(m.d)}{m.s ? ' ✨' : ''}</b>
              <small>niv. {m.l}{m.l >= cap ? ' (plafond)' : ''} · {typesOf(m.d).map((t) => PR_TYPES[t]).join(' / ')}</small>
              <Bar value={curHp(save, m)} max={maxHp(m)} />
              <Bar value={m.x - expFor(m.l)} max={expFor(m.l + 1) - expFor(m.l)} kind="xp" />
            </div>
            <div className="pr-party-actions">
              {i > 0 && <button type="button" title="Mettre en tête" onClick={(e) => { e.stopPropagation(); moveLead(m.u); }}>▲</button>}
              <button type="button" title="Super Bonbon" disabled={!(save.items.candy > 0) || m.l >= cap} onClick={(e) => { e.stopPropagation(); const r = feedCandy(save, m.u); setSave(r.save); const ev = r.events.find((x) => x.kind === 'evolve'); toast(ev ? `${dexName(ev.from)} évolue en ${dexName(ev.d)} !` : `${dexName(m.d)} monte au niveau ${m.l + 1}.`); }}>🍬</button>
              <button type="button" title="Envoyer au PC" onClick={(e) => { e.stopPropagation(); remove(m.u); }}>✕</button>
            </div>
          </div>
        ))}
        {Array.from({ length: PARTY_MAX - party.length }, (_, i) => <div key={`e${i}`} className="pr-party-card is-empty">Place libre</div>)}
      </div>
      <p className="pr-note">Plafond de niveau : {cap}. Le Pokémon en tête combat d’abord ; les autres prennent le relais s’il est K.O. et gagnent la moitié de l’expérience.</p>
      <div className="pr-box-tools">
        <h3>PC <small>{save.box.length - party.length}</small></h3>
        <input className="pr-input" type="search" placeholder="Chercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="pr-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
          <option value="recent">Plus récents</option><option value="level">Niveau</option><option value="dex">N° Pokédex</option><option value="rare">Rareté</option>
        </select>
        <button type="button" className="pr-btn" disabled={!dups.length} onClick={() => { const r = release(save, dups); setSave(r.save); toast(`${r.count} doublons envoyés au Professeur · +${fr(r.money)} ₽`); }}>Doublons au Professeur ({dups.length}) · +{fr(dupMoney)} ₽</button>
      </div>
      <div className="pr-box-grid">
        {pc.slice(0, 300).map((m) => (
          <button key={m.u} type="button" className={`pr-box-cell${pick === m.u ? ' is-picked' : ''}${m.s ? ' is-shiny' : ''}`} onClick={() => addOrSwap(m.u)} title="Ajouter à l’équipe">
            <Mon dex={m.d} shiny={Boolean(m.s)} />
            <b>{dexName(m.d)}</b>
            <small>niv. {m.l}{m.s ? ' ✨' : ''}</small>
          </button>
        ))}
        {!pc.length && <p className="pr-note">Rien au PC pour l’instant. Tes recrues arrivent ici quand l’équipe est complète.</p>}
      </div>
    </div>
  );
};

/* ——— Onglet Carte ——— */
const MapTab = ({ save, setSave, onGym, busy }) => (
  <div className="pr-map">
    {ZONES.map((z, i) => {
      const open = i <= save.maxZone;
      const here = save.zone === i;
      const wins = save.zoneWins[i] || 0;
      return (
        <div key={z.name} className={`pr-zone bio-${z.biome}${here ? ' is-here' : ''}${open ? '' : ' is-locked'}`}>
          <div>
            <b>{i + 1}. {z.name}</b>
            <small>Niveaux {z.lv[0]} à {z.lv[1]}{z.types.length ? ` · ${z.types.map((t) => PR_TYPES[t]).join(', ')}` : ' · tous les types, légendaires'}</small>
            {z.gym && (
              <small className="pr-zone-gym">
                Arène : {z.gym.name} ({PR_TYPES[z.gym.type]}) · {save.badges > i ? `✔ ${z.gym.badge}` : `${Math.min(wins, WINS_FOR_GYM)}/${WINS_FOR_GYM} victoires pour la défier`}
              </small>
            )}
          </div>
          <div className="pr-row">
            {z.gym && <span className="pr-gym-team">{z.gym.team.map(([d, l]) => <span key={d} title={`${dexName(d)} niv. ${l}`}><Mon dex={d} /></span>)}</span>}
            {open && !here && <button type="button" className="pr-btn" disabled={busy} onClick={() => setSave(travel(save, i))}>Y aller</button>}
            {here && <span className="pr-chip is-here">Tu es ici</span>}
            {here && gymReady(save) && <button type="button" className="pr-btn is-gym" disabled={busy} onClick={onGym}>Défier {z.gym.name}</button>}
            {!open && <span className="pr-chip">Bats l’Arène précédente</span>}
          </div>
        </div>
      );
    })}
  </div>
);

/* ——— Onglet Captures ——— */
const Rules = ({ save, setSave }) => {
  const r = save.rules;
  const set = (patch) => setSave({ ...save, rules: { ...r, ...patch }, updatedAt: Date.now() });
  return (
    <div className="pr-rules">
      <p className="pr-note">Après chaque victoire, ton équipe lance une Ball si le Pokémon correspond à une de ces règles. Pas de Ball, pas de recrue : pense à la Boutique.</p>
      <label className="pr-check"><input type="checkbox" checked={r.newSpecies} onChange={(e) => set({ newSpecies: e.target.checked })} /> Les espèces que je n’ai pas encore</label>
      <label className="pr-check"><input type="checkbox" checked={r.shiny} onChange={(e) => set({ shiny: e.target.checked })} /> Tous les chromatiques ✨</label>
      <label className="pr-check">Rareté à partir de
        <select className="pr-input" value={r.minStars} onChange={(e) => set({ minStars: Number(e.target.value) })}>
          <option value={9}>jamais</option><option value={2}>★★</option><option value={3}>★★★</option><option value={4}>★★★★</option><option value={5}>★★★★★ (légendaires)</option>
        </select>
      </label>
      <label className="pr-check"><input type="checkbox" checked={r.all} onChange={(e) => set({ all: e.target.checked })} /> Tout ce qu’on bat (gros consommateur de Balls)</label>
      <div className="pr-row">
        <span>Ball utilisée :</span>
        {['poke', 'super', 'hyper', 'master'].map((b) => (
          <button key={b} type="button" className={`pr-ballpick${r.ball === b ? ' is-on' : ''}`} onClick={() => set({ ball: b })}><Ball id={b} size={26} /><span>{BALLS[b].name}</span><b>×{save.balls[b]}</b></button>
        ))}
      </div>
      <p className="pr-note">S’il n’en reste plus, l’équipe prend la meilleure Ball qui reste (jamais la Master Ball sans que tu l’aies choisie).</p>
    </div>
  );
};

/* ——— Onglet Boutique ——— */
const Shop = ({ save, setSave, toast }) => {
  const doBuy = (kind, id, qty) => {
    const next = buy(save, kind, id, qty);
    if (!next) { toast('Pas assez d’argent.'); return; }
    setSave(next);
    toast(`Acheté : ${qty} × ${kind === 'ball' ? BALLS[id].name : SHOP_ITEMS[id].name}`);
  };
  return (
    <div className="pr-shop">
      {Object.entries(BALLS).map(([id, b]) => (
        <div key={id} className="pr-shop-item">
          <Ball id={id} size={40} />
          <div><b>{b.name}</b><small>{id === 'master' ? 'Capture à coup sûr.' : `Chances ×${b.mult}.`} Tu en as {save.balls[id]}.</small></div>
          <div className="pr-row">
            <button type="button" className="pr-btn" disabled={save.money < b.price} onClick={() => doBuy('ball', id, 1)}>{fr(b.price)} ₽</button>
            {id !== 'master' && <button type="button" className="pr-btn" disabled={save.money < b.price * 10} onClick={() => doBuy('ball', id, 10)}>×10</button>}
          </div>
        </div>
      ))}
      {Object.entries(SHOP_ITEMS).map(([id, it]) => (
        <div key={id} className="pr-shop-item">
          <img className="pr-ball" src={itemSprite(it.slug)} alt="" width={40} height={40} />
          <div><b>{it.name}</b><small>{it.desc} {id === 'charm' ? (save.charm ? 'Obtenu.' : '') : `Tu en as ${save.items[id] || 0}.`}</small></div>
          <button type="button" className="pr-btn" disabled={save.money < it.price || (id === 'charm' && save.charm)} onClick={() => doBuy('item', id, 1)}>{fr(it.price)} ₽</button>
        </div>
      ))}
    </div>
  );
};

/* ——— Onglet Pokédex ——— */
const Dex = ({ save }) => {
  const [gen, setGen] = useState(1);
  const counts = useMemo(() => {
    const c = Array.from({ length: 10 }, () => [0, 0]);
    for (let d = 1; d < PR_DEX.length; d += 1) { const g = PR_DEX[d][10]; c[g][1] += 1; c[0][1] += 1; if (save.dex[d]?.[1]) { c[g][0] += 1; c[0][0] += 1; } }
    return c;
  }, [save.dex]);
  const list = [];
  for (let d = 1; d < PR_DEX.length; d += 1) if (!gen || PR_DEX[d][10] === gen) list.push(d);
  return (
    <div className="pr-dex">
      <div className="pr-tabs is-sub">
        {GEN_NAMES.map((n, g) => <button key={n} type="button" className={gen === g ? 'is-on' : ''} onClick={() => setGen(g)}>{n} <small>{counts[g][0]}/{counts[g][1]}</small></button>)}
      </div>
      <div className="pr-dex-grid">
        {list.map((d) => {
          const st = save.dex[d];
          return (
            <div key={d} className={`pr-dex-cell${st?.[1] ? ' is-caught' : st?.[0] ? ' is-seen' : ''}${st?.[2] ? ' is-shiny' : ''}`} title={st?.[0] ? `${dexName(d)}${st[1] ? '' : ' (vu)'}` : `#${d}`}>
              {st?.[0] ? <Mon dex={d} /> : <span className="pr-dex-q">?</span>}
              <small>#{d}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ——— Onglet Journal ——— */
const Journal = ({ save }) => (
  <div className="pr-journal">
    <div className="pr-recap">
      <span><b>{fr(save.stats.wins)}</b> victoires</span>
      <span><b>{fr(save.stats.caught)}</b> recrues</span>
      <span><b>{save.stats.evolutions}</b> évolutions</span>
      <span><b>{save.stats.shinies}</b> chromatiques</span>
      <span><b>{save.badges}</b> badges</span>
      <span><b>{Object.values(save.dex).filter((v) => v[1]).length}</b> espèces</span>
    </div>
    {(save.log || []).map((e) => (
      <div key={e.t + (e.d || 0)} className={`pr-log is-${e.kind}`}>
        <time>{new Date(e.t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
        {e.kind === 'catch' && <span><Mon dex={e.d} shiny={Boolean(e.s)} /> Recrue {e.s ? 'chromatique ' : ''}: <b>{dexName(e.d)}</b> niv. {e.l}</span>}
        {e.kind === 'evolve' && <span><Mon dex={e.from} /> → <Mon dex={e.d} /> <b>{dexName(e.from)}</b> évolue en <b>{dexName(e.d)}</b></span>}
        {e.kind === 'badge' && <span>🏅 <b>{e.badge}</b> obtenu contre {e.leader}</span>}
      </div>
    ))}
    {!save.log?.length && <p className="pr-note">Les recrues rares, les évolutions et les badges s’afficheront ici.</p>}
  </div>
);

/* ——— Onglet Réglages ——— */
const Settings = ({ save, setSave, toast, user }) => {
  const fileRef = useRef(null);
  const download = () => {
    const blob = new Blob([exportSave(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `poke-prairie-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const load = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => { setSave({ ...importSave(t), updatedAt: Date.now(), lastTick: Date.now() }); toast('Sauvegarde importée.'); }).catch((err) => toast(err.message || 'Fichier illisible.'));
    e.target.value = '';
  };
  return (
    <div className="pr-settings">
      <section>
        <h3>Sauvegarde</h3>
        <p>Ta partie est gardée sur cet appareil{user ? ' et synchronisée avec ton compte Bully’s Lair : tu la retrouves sur le site comme dans l’appli de bureau.' : '. Connecte-toi pour la retrouver sur tous tes appareils.'} Le jeu marche aussi hors ligne : la synchro reprend au retour du réseau.</p>
        <div className="pr-row">
          <button type="button" className="pr-btn" onClick={download}>Exporter un fichier</button>
          <button type="button" className="pr-btn" onClick={() => fileRef.current?.click()}>Importer un fichier</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={load} />
        </div>
      </section>
      <section>
        <h3>Appli de bureau</h3>
        <p>{desk ? 'La route reste en bandeau au-dessus de ta barre des tâches : ton équipe chasse pendant que tu fais autre chose.' : 'L’appli de bureau garde la route en bandeau au-dessus de ta barre des tâches, avec la même sauvegarde que le site.'}</p>
        {!desk ? (
          <div className="pr-row">
            <a className="pr-btn is-main pr-link" href="https://github.com/JuleSpace/AnimeQuiz/releases/download/prairie-latest/Poke-Prairie-Setup.exe">Télécharger pour Windows</a>
            <a className="pr-btn pr-link" href="https://github.com/JuleSpace/AnimeQuiz/releases/download/prairie-latest/Poke-Prairie-portable.exe">Version sans installation</a>
          </div>
        ) : (
          <div className="pr-row">
            <AccountChip returnHash={PRAIRIE_HASH} />
            <label className="pr-check"><input type="checkbox" defaultChecked={desk.getTop?.() !== false} onChange={(e) => desk.setTop?.(e.target.checked)} /> Toujours au premier plan</label>
            <label className="pr-check"><input type="checkbox" defaultChecked={Boolean(desk.getAutostart?.())} onChange={(e) => desk.setAutostart?.(e.target.checked)} /> Lancer au démarrage</label>
          </div>
        )}
      </section>
    </div>
  );
};

/* ——— La route : combats en direct ——— */
const useRoute = (saveRef, commit, active) => {
  const [view, setView] = useState({ phase: 'walk', foe: null, me: null, hits: [], gym: null, banner: null });
  const gymReq = useRef(false);
  const stop = useRef(false);
  useEffect(() => {
    if (!active) return undefined;
    stop.current = false;
    let hitId = 0;
    const float = (side, h) => {
      hitId += 1;
      const id = hitId;
      setView((v) => ({ ...v, hits: [...v.hits.slice(-5), { id, side, dmg: h.dmg, mult: h.mult, crit: h.crit }] }));
    };
    const fight = async (foe, gym) => {
      let f = { ...foe };
      let s = saveRef.current;
      let me = nextFighter(s);
      setView((v) => ({ ...v, phase: 'battle', foe: f, me: me?.u, gym, hits: [] }));
      while (!stop.current && me && f.hp > 0) {
        const first = speedOf(me) >= speedOf(f) ? 'me' : 'foe';
        for (const side of first === 'me' ? ['me', 'foe'] : ['foe', 'me']) {
          await sleep(560);
          if (stop.current) return null;
          s = saveRef.current;
          me = monById(s, me.u);
          if (!me) break;
          if (side === 'me') {
            const h = hit(me, f);
            f = { ...f, hp: Math.max(0, f.hp - h.dmg) };
            setView((v) => ({ ...v, foe: f, attacker: 'me' }));
            float('foe', h);
            if (f.hp <= 0) break;
          } else {
            const h = hit(f, me);
            const hp = Math.max(0, curHp(s, me) - h.dmg);
            commit({ ...s, hp: { ...s.hp, [me.u]: hp } }, true);
            setView((v) => ({ ...v, attacker: 'foe' }));
            float('me', h);
            if (hp <= 0) break;
          }
        }
        s = saveRef.current;
        if (curHp(s, monById(s, me.u) || me) <= 0) {
          me = nextFighter(s);
          if (me) setView((v) => ({ ...v, me: me.u, banner: `À toi, ${dexName(me.d)} !` }));
        }
      }
      return { won: f.hp <= 0, last: me?.u || null, foe: f };
    };
    const loop = async () => {
      while (!stop.current) {
        const s0 = saveRef.current;
        if (!s0.started || !s0.party.length) { await sleep(800); continue; }
        if (gymReq.current && gymReady(s0)) {
          gymReq.current = false;
          const zone = s0.zone;
          const g = ZONES[zone].gym;
          setView((v) => ({ ...v, phase: 'gym-intro', banner: `${g.name} relève le défi !`, gym: g }));
          await sleep(1600);
          let won = true;
          for (const foe of gymTeam(zone)) {
            const r = await fight(foe, g);
            if (!r) return;
            const out = settle(saveRef.current, r.foe, r.won, r.last, g);
            commit(out.save);
            if (!r.won) { won = false; break; }
            await sleep(700);
          }
          if (won) {
            commit(winGym(saveRef.current));
            setView((v) => ({ ...v, phase: 'win', banner: `${g.badge} obtenu ! Nouvelle zone et plafond de niveau relevé.` }));
          } else setView((v) => ({ ...v, phase: 'lose', banner: `${g.name} a gagné… Entraîne ton équipe et reviens.` }));
          await sleep(2600);
          setView((v) => ({ ...v, banner: null, gym: null }));
          continue;
        }
        setView((v) => ({ ...v, phase: 'walk', foe: null, attacker: null, hits: [] }));
        await sleep(2600 + Math.random() * 1600);
        if (stop.current) return;
        const foe = spawnWild(saveRef.current);
        const r = await fight(foe, null);
        if (!r) return;
        const out = settle(saveRef.current, r.foe, r.won, r.last);
        commit({ ...out.save, lastTick: Date.now() });
        const ev = out.events;
        const c = ev.find((e) => e.kind === 'catch');
        const evo = ev.find((e) => e.kind === 'evolve');
        const banner = !r.won ? 'Toute l’équipe est K.O. ! Retour au Centre Pokémon.'
          : evo ? `${dexName(evo.from)} évolue en ${dexName(evo.d)} !`
            : c ? `${dexName(c.d)}${c.s ? ' chromatique' : ''} rejoint ton équipe !`
              : ev.find((e) => e.kind === 'escape') ? `${dexName(foe.d)} s’est échappé de la Ball…`
                : ev.find((e) => e.kind === 'noball') ? 'Plus de Poké Balls ! Passe à la Boutique.' : null;
        setView((v) => ({ ...v, phase: r.won ? (c ? 'catch' : 'won') : 'lose', banner, caught: c }));
        await sleep(banner ? 1500 : 800);
        setView((v) => ({ ...v, banner: null, caught: null }));
      }
    };
    loop();
    return () => { stop.current = true; };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return { view, requestGym: () => { gymReq.current = true; } };
};

const Route = ({ save, view, compact, onGym, onOpen }) => {
  const z = ZONES[save.zone];
  const party = partyMons(save);
  const me = party.find((m) => m.u === view.me) || party[0];
  const others = party.filter((m) => m !== me).slice(0, compact ? 2 : 5);
  const wins = save.zoneWins[save.zone] || 0;
  const size = compact ? 56 : 92;
  const fighting = view.phase === 'battle' && view.foe;
  return (
    <div className={`pr-route bio-${z.biome}${compact ? ' is-compact' : ''}${fighting ? ' is-fighting' : ''}`}>
      <div className="pr-route-ground" />
      <div className="pr-route-info">
        <b>{z.name}</b>
        {z.gym && save.badges <= save.zone ? <small>{Math.min(wins, WINS_FOR_GYM)}/{WINS_FOR_GYM} avant l’Arène de {z.gym.name}</small> : <small>Niveaux {z.lv[0]}–{z.lv[1]}</small>}
      </div>
      {gymReady(save) && !view.gym && <button type="button" className="pr-gym-btn" onClick={onGym}>Défier {z.gym.name} !</button>}
      <div className="pr-route-party">
        {others.reverse().map((m) => (
          <span key={m.u} className={`pr-route-follower${curHp(save, m) <= 0 ? ' is-ko' : ''}`}><RouteMon dex={m.d} shiny={Boolean(m.s)} facing="right" anim={fighting ? 'idle' : 'walk'} size={size * 0.72} /></span>
        ))}
        {me && (
          <span className={`pr-route-lead${view.attacker === 'me' && fighting ? ' is-attacking' : ''}${view.attacker === 'foe' && fighting ? ' is-hit' : ''}`}>
            <span className="pr-hp-pill"><b>{dexName(me.d)}</b> niv. {me.l}<Bar value={curHp(save, me)} max={maxHp(me)} /></span>
            <RouteMon dex={me.d} shiny={Boolean(me.s)} facing="right" anim={fighting ? (view.attacker === 'me' ? 'attack' : 'idle') : 'walk'} size={size} />
            {view.hits.filter((h) => h.side === 'me').map((h) => <i key={h.id} className={`pr-dmg${h.mult > 1 ? ' is-super' : h.mult < 1 ? ' is-weak' : ''}`}>{h.mult === 0 ? 'Aucun effet' : `-${h.dmg}`}</i>)}
          </span>
        )}
      </div>
      {view.foe && (view.phase === 'battle' || view.phase === 'catch' || view.phase === 'won') && (
        <span className={`pr-route-foe${view.foe.hp <= 0 ? ' is-down' : ''}${view.attacker === 'foe' ? ' is-attacking' : ''}${view.attacker === 'me' ? ' is-hit' : ''}${view.foe.s ? ' is-shiny' : ''}`}>
          <span className="pr-hp-pill is-foe"><b>{dexName(view.foe.d)}{view.foe.s ? ' ✨' : ''}</b> niv. {view.foe.l}<Bar value={view.foe.hp} max={maxHp(view.foe)} /></span>
          <RouteMon dex={view.foe.d} shiny={Boolean(view.foe.s)} facing="left" anim={view.attacker === 'foe' ? 'attack' : 'idle'} size={size} />
          {view.hits.filter((h) => h.side === 'foe').map((h) => <i key={h.id} className={`pr-dmg${h.mult > 1 ? ' is-super' : h.mult < 1 ? ' is-weak' : ''}${h.crit ? ' is-crit' : ''}`}>{h.mult === 0 ? 'Aucun effet' : `-${h.dmg}`}</i>)}
          {view.phase === 'catch' && <span className="pr-route-ball"><Ball id={view.caught?.ball || 'poke'} size={compact ? 26 : 40} /></span>}
        </span>
      )}
      {view.banner && <div className={`pr-route-banner is-${view.phase}`}>{view.banner}</div>}
      {compact && <button type="button" className="pr-route-open" onClick={onOpen} title="Ouvrir le panneau">▴</button>}
    </div>
  );
};

/* ——— Écran principal ——— */
const PokePrairie = ({ onClose }) => {
  const first = useMemo(() => catchUp(loadLocal()), []);
  const [save, setSaveState] = useState(first.save);
  const saveRef = useRef(first.save);
  const [away, setAway] = useState(first.summary && first.summary.battles >= 3 ? first.summary : null);
  const [tab, setTab] = useState('team');
  const [panel, setPanel] = useState(!desk);
  const [msg, setMsg] = useState(null);
  const commit = useCallback((s, quiet) => { saveRef.current = s; setSaveState(s); if (!quiet) saveLocal(s); }, []);
  const setSave = useCallback((s) => commit({ ...s, updatedAt: Date.now() }), [commit]);
  const toast = useCallback((m) => { setMsg(m); setTimeout(() => setMsg((x) => (x === m ? null : x)), 2600); }, []);
  useEffect(() => { const id = setInterval(() => saveLocal(saveRef.current), 5000); return () => clearInterval(id); }, []);
  const user = useCloudSync('prairie', save, (remote) => commit(mergeSaves(saveRef.current, remote)), progressScore);
  // Onglet en veille ou PC en pause : au retour, le temps perdu est rejoué en accéléré
  useEffect(() => {
    const onShow = () => {
      if (document.hidden) return;
      const r = catchUp(saveRef.current);
      if (r.summary) { commit(r.save); if (r.summary.battles >= 6) setAway(r.summary); }
    };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [commit]);
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  useEffect(() => {
    if (!desk) return undefined;
    document.documentElement.classList.add('pr-desktop');
    return () => document.documentElement.classList.remove('pr-desktop');
  }, []);
  useEffect(() => { desk?.setMode?.(panel || away || !save.started ? 'panel' : 'strip'); }, [panel, away, save.started]);

  const { view, requestGym } = useRoute(saveRef, commit, save.started);
  const onGym = () => { requestGym(); toast('Le Champion arrive après ce combat…'); };
  const cap = levelCap(save);

  if (!save.started) {
    return (
      <div className={`pr-root${desk ? ' is-desktop' : ''}`}>
        <div className="pr-panel">
          <header className="pr-head">
            {!desk && <button type="button" className="pr-btn is-ghost" onClick={onClose}>← Bully’s Lair</button>}
            <div className="pr-logo"><span>POKÉ</span><b>PRAIRIE</b></div>
            {!desk && <AccountChip returnHash={PRAIRIE_HASH} />}
          </header>
          <StarterPick onPick={(d) => setSave(chooseStarter(save, d))} />
        </div>
      </div>
    );
  }

  return (
    <div className={`pr-root${desk ? ' is-desktop' : ''}${desk && !panel && !away ? ' is-collapsed' : ''}`}>
      {(panel || !desk) && (
        <div className="pr-panel">
          <header className="pr-head">
            {!desk && <button type="button" className="pr-btn is-ghost" onClick={onClose}>← Bully’s Lair</button>}
            {desk && <button type="button" className="pr-btn is-ghost" onClick={() => setPanel(false)}>▾ Replier</button>}
            <div className="pr-logo"><span>POKÉ</span><b>PRAIRIE</b></div>
            <div className="pr-head-stats">
              <span className="pr-chip is-gold" title="Argent">{fr(save.money)} ₽</span>
              {['poke', 'super', 'hyper'].map((id) => <span key={id} className="pr-chip" title={BALLS[id].name}><Ball id={id} size={18} />{save.balls[id]}</span>)}
              <span className="pr-chip" title="Badges">🏅 {save.badges}/8</span>
              <span className="pr-chip" title="Plafond de niveau">Niv. max {cap}</span>
              {!desk && <AccountChip returnHash={PRAIRIE_HASH} />}
            </div>
          </header>
          {!desk && <Route save={save} view={view} onGym={onGym} />}
          <nav className="pr-tabs">
            {[['team', 'Équipe & PC'], ['map', 'Carte & Arènes'], ['rules', 'Captures'], ['shop', 'Boutique'], ['dex', 'Pokédex'], ['log', 'Journal'], ['settings', 'Réglages']].map(([id, label]) => (
              <button key={id} type="button" className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>
          <main className="pr-main">
            {tab === 'team' && <Team save={save} setSave={setSave} toast={toast} />}
            {tab === 'map' && <MapTab save={save} setSave={setSave} onGym={onGym} busy={Boolean(view.gym)} />}
            {tab === 'rules' && <Rules save={save} setSave={setSave} />}
            {tab === 'shop' && <Shop save={save} setSave={setSave} toast={toast} />}
            {tab === 'dex' && <Dex save={save} />}
            {tab === 'log' && <Journal save={save} />}
            {tab === 'settings' && <Settings save={save} setSave={setSave} toast={toast} user={user} />}
          </main>
          {!desk && <footer className="pr-foot">Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites : PokéAPI, PMDCollab SpriteCollab (CC BY-NC 4.0).</footer>}
        </div>
      )}
      {desk && <Route save={save} view={view} compact onGym={onGym} onOpen={() => setPanel((p) => !p)} />}
      {away && <AwayCard sum={away} onClose={() => setAway(null)} />}
      {msg && <div className="pr-toast" role="status">{msg}</div>}
    </div>
  );
};

export default PokePrairie;
