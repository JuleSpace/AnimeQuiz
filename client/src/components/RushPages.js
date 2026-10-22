import React, { useMemo, useState } from 'react';
import GamePage, { BoardPage, Cta, Panel, Section, Stat, StatBars, Tabs, UpCard, clock } from './GamePage';
import { FINAL_AT, FOE_TYPES, MAX_ALLIES, RUSH_ITEMS, RUSH_MOVES, RUSH_STARTERS, UPGRADES, buyRushThing, buyUpgrade, rushEffects, rushPool, starterOpen, upCost, upRank, weaknessesOf } from './rushData';
import { FOES, WEAPONS, ultimateOf } from './swarmData';
import { TYPE_COLORS, itemUrl } from './SwarmPages';
import { HomeIcon } from './GameHome';

/* Pages de menu du Poké Rush (mêmes rangements que le Swarm, palette « Aube de Kanto »). */

const THEME = 'gh-swarm gh-rush';
const fr = (n) => (n || 0).toLocaleString('fr-FR');
const Item = ({ slug, fallback = '★' }) => <HomeIcon src={itemUrl(slug)} fallback={fallback} />;
const PL = ({ meta }) => <Stat label="Points de Ligue" value={`${fr(meta.pl)} PL`} strong />;
const UP_ITEM = { balls: 'poke-ball', catch: 'great-ball', vitality: 'hp-up', power: 'protein', speed: 'carbos', coins: 'amulet-coin', allyslot: 'friend-ball', cards: 'up-grade', reroll: 'rare-candy' };
const TYPE_EN = { Électrik: 'electric', Feu: 'fire', Eau: 'water', Plante: 'grass', Sol: 'ground', Normal: 'normal', Spectre: 'ghost', Ténèbres: 'dark', Combat: 'fighting', Glace: 'ice', Acier: 'steel', Poison: 'poison', Psy: 'psychic', Vol: 'flying', Dragon: 'dragon', Roche: 'rock', Fée: 'fairy', Insecte: 'bug' };

/* ——— Choix du partenaire ——— */
export const RushPickPage = ({ Sprite, backdrop, meta, partnerId, onPick, onBack, onNext, onRecruit }) => {
  const partner = RUSH_STARTERS.find((p) => p.id === partnerId) || RUSH_STARTERS[0];
  const open = starterOpen(meta, partner);
  const ult = ultimateOf(partner);
  const W = WEAPONS[partner.weapon];
  const rec = meta.best[partner.id];
  const runs = (meta.history || []).filter((r) => r.partnerId === partner.id);
  const maxHp = Math.max(...RUSH_STARTERS.map((p) => p.hp));
  const maxSpeed = Math.max(...RUSH_STARTERS.map((p) => p.speed));
  const recruits = RUSH_STARTERS.filter((p) => starterOpen(meta, p)).length;
  const next = open ? onNext : (meta.pl >= partner.cost ? onRecruit : undefined);
  return (
    <GamePage theme={THEME} backdrop={backdrop} title="Choisis ton partenaire" subtitle={`${recruits}/${RUSH_STARTERS.length} recrutés`} onBack={onBack} onEnter={next} right={<PL meta={meta} />}>
      <div className="gp-split">
        <div className="gp-body">
          <Panel tone="plain">
            <div className="gp-hero">
              <div className="gp-hero-art" data-no={`#${String(partner.dex).padStart(3, '0')}`} style={{ '--hc': partner.color }}>
                <Sprite dex={partner.dex} anim="walk" size={180} scale={5} foot={0.85} />
              </div>
              <div className="gp-body" style={{ gap: 10 }}>
                <span className="gp-hero-kicker">#{String(partner.dex).padStart(3, '0')} · Partenaire de l’île</span>
                <h2>{partner.name}</h2>
                <div className="gp-chips">
                  <span className="gp-chip" style={{ '--cc': TYPE_COLORS[partner.type] }}>{partner.type}</span>
                  {partner.type === 'Eau' && <span className="gp-chip" style={{ '--cc': '#3c8cff' }}>Nage</span>}
                  {partner.id === 'charmander' && <span className="gp-chip" style={{ '--cc': '#ff6b57' }}>Vole (Dracaufeu)</span>}
                  {!open && <span className="gp-chip is-soft">🔒 {partner.cost} PL</span>}
                </div>
                <div className="gpx-evo">
                  <span className="gp-mini-title">Évolue pendant la partie</span>
                  <div>
                    <span className="gp-face"><Sprite dex={partner.dex} anim="idle" size={44} scale={1.3} still /></span>
                    {partner.evolutions.map((e) => (
                      <React.Fragment key={e.dex}>
                        <em>N. {e.level}</em>
                        <span className="gp-face"><Sprite dex={e.dex} anim="idle" size={44} scale={1.1} still /></span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <StatBars rows={[['PV', partner.hp, maxHp, '#ff6b6b'], ['Vitesse', Number(partner.speed.toFixed(1)), maxSpeed, '#3ccf6e']]} />
              </div>
            </div>
          </Panel>
          <div className="gp-grid is-wide">
            <Panel title="Attaque de départ" kicker="Kit">
              <div className="gp-move" style={{ '--mc': W.color }}>
                <i>{W.type?.slice(0, 1)}</i>
                <span><b>{W.name}<em>{W.type}</em></b><small>{W.desc(1)}</small></span>
              </div>
              <p className="gpx-note">{partner.blurb}</p>
            </Panel>
            <Panel title={ult.name} kicker="Ultime · touche R" tone="side">
              <div className="gp-move" style={{ '--mc': TYPE_COLORS[partner.type] }}>
                <i>R</i>
                <span><b>{ult.name}</b><small>{ult.desc}</small></span>
              </div>
              <p className="gpx-note">Capture jusqu’à {MAX_ALLIES} sauvages (F) : ils se battent à tes côtés.</p>
            </Panel>
          </div>
          <Panel tone="plain">
            <div className="gp-runbar">
              <small>Tes parties</small>
              <span><b>{runs.length}</b>parties</span>
              <span><b>{runs.filter((r) => r.result === 'win').length}</b>victoires</span>
              <span><b>{fr(rec?.score)}</b>meilleur score</span>
              <span><b>{fr(rec?.kills)}</b>record de K.O.</span>
              <span><b>{rec ? clock(rec.t) : '—'}</b>{rec?.win ? 'meilleure victoire' : 'meilleur temps'}</span>
            </div>
            {open
              ? <Cta onClick={onNext}>Je te choisis !</Cta>
              : <Cta onClick={onRecruit} disabled={meta.pl < partner.cost} tone="good" hint={meta.pl < partner.cost ? '' : 'Entrée'}>{meta.pl < partner.cost ? `${partner.cost} PL (il en manque ${partner.cost - meta.pl})` : `Recruter · ${partner.cost} PL`}</Cta>}
          </Panel>
        </div>
        <Panel title="Partenaires" kicker="Île de Kanto" tone="side" className="gp-sticky gpx-roster" right={<span>{recruits}/{RUSH_STARTERS.length}</span>}>
          <div className="gp-roster">
            {RUSH_STARTERS.map((p) => {
              const ok = starterOpen(meta, p);
              return (
                <button key={p.id} type="button" className={`gp-mon${p.id === partner.id ? ' is-on' : ''}${ok ? '' : ' is-locked'}`} style={{ '--mc': p.color }}
                  onClick={() => onPick(p)} onDoubleClick={() => { onPick(p); if (ok) onNext(); }} aria-pressed={p.id === partner.id}>
                  <span><Sprite dex={p.dex} anim={p.id === partner.id ? 'walk' : 'idle'} size={84} scale={2.4} foot={0.85} still={p.id !== partner.id} /></span>
                  {!ok && <span className="gp-mon-lock">🔒</span>}
                  {meta.best[p.id]?.win && <span className="gp-mon-badge">★</span>}
                  <b>{p.name}</b>
                </button>
              );
            })}
          </div>
          <p className="gpx-note">Double-clic sur un partenaire pour partir tout de suite.</p>
        </Panel>
      </div>
    </GamePage>
  );
};

/* ——— Préparer la partie ——— */
export const RushPrepPage = ({ Sprite, backdrop, meta, partner, onStart, onBack }) => {
  const pool = rushPool(1);
  const rec = meta.best[partner.id];
  const fx = rushEffects(meta);
  return (
    <GamePage theme={THEME} backdrop={backdrop} title="Île de Kanto" subtitle="L’arène se réveille à 8:00" onBack={onBack} onEnter={onStart}
      right={(
        <>
          <span className="gp-keys"><kbd className="gp-key">Échap</kbd> Partenaire · <kbd className="gp-key">Entrée</kbd> Commencer</span>
          <PL meta={meta} />
        </>
      )}
    >
      <div className="gp-split">
        <div className="gp-stage gpx-stage" style={{ '--rc': '#ffb27a' }}>
          <div className="gp-stage-title">
            <small>Région · 3D</small>
            <h2>Île de Kanto</h2>
            <div className="gp-stage-desc">
              <div className="gp-chips">
                <span className="gp-chip" style={{ '--cc': '#3c8cff' }}>{pool.t1.length + pool.t2.length + pool.t3.length} espèces sauvages</span>
                <span className="gp-chip" style={{ '--cc': '#3ccf6e' }}>Hautes herbes · Alpha</span>
                <span className="gp-chip" style={{ '--cc': '#e6a400' }}>Arène à {clock(FINAL_AT)}</span>
              </div>
              <p>Cours, saute, esquive et capture des sauvages qui se battront à tes côtés. Rejoins l’arène à {clock(FINAL_AT)} pour affronter le légendaire.</p>
            </div>
          </div>
          <div className="gpx-stage-mons" aria-hidden="true">
            <Sprite dex={FOES[pool.finals[0]].dex} anim="idle" size={260} scale={3} foot={0.9} />
            <Sprite dex={partner.dex} anim="walk" size={170} scale={4.4} foot={0.9} />
          </div>
          <div className="gp-guards">
            <div className="gp-guard">
              <small>Sauvages</small>
              <div>{pool.t1.slice(0, 4).map((id) => <span key={id} className={`gp-face${meta.caught[id] ? ' is-done' : ''}`} title={FOES[id].name}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={1.4} still /></span>)}</div>
            </div>
            <div className="gp-guard">
              <small>Boss possibles</small>
              <div>{pool.minis.slice(0, 4).map((id) => <span key={id} className="gp-face" title={`${FOES[id].name} · faible contre ${weaknessesOf(FOE_TYPES[id]).join(', ')}`}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={0.75} foot={0.9} still /></span>)}</div>
            </div>
            <div className="gp-guard is-boss">
              <small>Légendaires de l’arène</small>
              <div>{pool.finals.map((id) => <span key={id} className={`gp-face${meta.caught[id] ? ' is-done' : ''}`} title={`${FOES[id].name} · faible contre ${weaknessesOf(FOE_TYPES[id]).join(', ')}`}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={0.6} foot={0.9} still /></span>)}</div>
            </div>
          </div>
        </div>
        <Panel title="Préparer la partie" right="Kanto" className="gp-sticky">
          <button type="button" className="gpx-me" onClick={onBack}>
            <span className="gp-face"><Sprite dex={partner.dex} anim="idle" size={44} scale={1.3} still /></span>
            <span><small>Ton partenaire</small><b>{partner.name}</b></span>
            <em>Changer</em>
          </button>
          <span className="gp-mini-title">Ton équipement de départ</span>
          <div className="gp-kv">
            <span><small>Poké Balls</small><b>{fx.balls}</b></span>
            <span><small>Compagnons max</small><b>{fx.allies}</b></span>
            <span><small>Cartes au choix</small><b>{fx.cards}</b></span>
            <span><small>Relances</small><b>{fx.rerolls}</b></span>
          </div>
          <span className="gp-mini-title">Tes scores · {partner.name}</span>
          <div className="gp-kv">
            <span><small>Score record</small><b>{fr(rec?.score)}</b></span>
            <span><small>Meilleur</small><b>{rec ? clock(rec.t) : '—'}</b></span>
            <span><small>Record K.O.</small><b>{fr(rec?.kills)}</b></span>
          </div>
          <Cta onClick={onStart}>Commencer !</Cta>
        </Panel>
      </div>
    </GamePage>
  );
};

/* ——— Centre Pokémon, Pokédex, Historique, Classement ——— */
const PAGES = {
  shop: ['Centre Pokémon', 'Dépense tes Points de Ligue'],
  dex: ['Pokédex', 'Tes captures sur l’île'],
  history: ['Historique', 'Tes dernières parties'],
  board: ['Classement', 'Records du serveur']
};

export const RushMetaPage = ({ Sprite, panel, backdrop, meta, setMeta, onBack }) => {
  const [title, sub] = PAGES[panel] || PAGES.shop;
  const pool = rushPool(1);
  const dexIds = [...pool.t1, ...pool.t2, ...pool.t3, ...pool.minis, ...pool.finals];
  const caughtN = dexIds.filter((id) => meta.caught[id]).length;
  const right = {
    shop: <><Stat label="Améliorations" value={`${UPGRADES.reduce((n, u) => n + upRank(meta, u.id), 0)}/${UPGRADES.reduce((n, u) => n + u.max, 0)}`} max={UPGRADES.reduce((n, u) => n + u.max, 0)} /><PL meta={meta} /></>,
    dex: <><Stat label="Capturés" value={`${caughtN}/${dexIds.length}`} max={dexIds.length} /><Stat label="Vus" value={`${dexIds.filter((id) => meta.seen[id] || meta.caught[id]).length}`} /></>,
    history: <><Stat label="Parties" value={fr(meta.runs)} /><Stat label="Victoires" value={fr(meta.wins)} /></>,
    board: null
  }[panel];
  return (
    <GamePage theme={THEME} backdrop={backdrop} title={title} subtitle={sub} onBack={onBack} right={right}>
      {panel === 'shop' && <Shop meta={meta} setMeta={setMeta} />}
      {panel === 'dex' && <Dex Sprite={Sprite} meta={meta} ids={dexIds} />}
      {panel === 'history' && <History Sprite={Sprite} meta={meta} />}
      {panel === 'board' && (
        <BoardPage
          game="rush"
          gens={[{ id: 1, name: 'Île de Kanto' }]}
          tabs={[
            { id: 'score', label: 'Score', sub: 'Meilleur score', value: (r) => (r.score || 0).toLocaleString('fr-FR'), unit: 'pts' },
            { id: 'fastest', label: 'Victoires', sub: 'La plus rapide', value: (r) => clock(r.t), unit: '' },
            { id: 'kills', label: 'K.O.', sub: 'Le plus de K.O.', value: (r) => fr(r.kills), unit: 'K.O.' }
          ]}
          describe={(r) => `${r.form || RUSH_STARTERS.find((p) => p.id === r.partnerId)?.name || ''} · niv. ${r.level}`}
        />
      )}
    </GamePage>
  );
};

const Shop = ({ meta, setMeta }) => (
  <>
    <Section title="Entraînement" sub="Améliorations permanentes" count={`${UPGRADES.reduce((n, u) => n + upRank(meta, u.id), 0)}`} color="#ff6f8a">
      <div className="gp-grid">
        {UPGRADES.map((u) => {
          const r = upRank(meta, u.id); const maxed = r >= u.max; const cost = upCost(meta, u);
          return (
            <UpCard key={u.id} color="#ff6f8a" icon={<Item slug={UP_ITEM[u.id]} fallback="✚" />} name={u.name}
              desc={u.desc(Math.max(1, r + (maxed ? 0 : 1)))} level={r} max={u.max}
              state={maxed ? 'max' : meta.pl >= cost ? 'buy' : 'poor'} costLabel={maxed ? 'Maximum' : `${fr(cost)} PL`}
              onBuy={() => setMeta(buyUpgrade(meta, u.id))} />
          );
        })}
      </div>
    </Section>
    <Section title="Capacités à apprendre" sub="Elles pourront sortir au level-up" count={`${RUSH_MOVES.filter((m) => meta.unlocks[m.id]).length}/${RUSH_MOVES.length}`} color="#3f9be8">
      <div className="gp-grid">
        {RUSH_MOVES.map((mv) => {
          const own = !!meta.unlocks[mv.id];
          return (
            <UpCard key={mv.id} color={TYPE_COLORS[mv.type] || mv.color} icon={<Item slug={`tm-${TYPE_EN[mv.type] || 'normal'}`} fallback="◆" />} name={mv.name}
              desc={mv.desc} note={mv.type} level={own ? 1 : 0} max={1}
              state={own ? 'max' : meta.pl >= mv.cost ? 'buy' : 'poor'} costLabel={own ? 'Apprise' : `${fr(mv.cost)} PL`}
              onBuy={() => setMeta(buyRushThing(meta, mv.id, mv.cost))} />
          );
        })}
      </div>
    </Section>
    <Section title="Objets" sub="Ajoutés aux bonus possibles" count={`${RUSH_ITEMS.filter((m) => meta.unlocks[m.id]).length}/${RUSH_ITEMS.length}`} color="#ffc93c">
      <div className="gp-grid">
        {RUSH_ITEMS.map((it) => {
          const own = !!meta.unlocks[it.id];
          return (
            <UpCard key={it.id} color={it.color} icon={<Item slug={it.id === 'hpup' ? 'hp-up' : it.id === 'quickclaw' ? 'quick-claw' : it.id === 'scope' ? 'scope-lens' : it.id === 'shellbell' ? 'shell-bell' : it.id === 'expshare' ? 'exp-share' : it.id === 'brightpowder' ? 'bright-powder' : it.id} fallback="●" />}
              name={it.name} desc={it.desc} level={own ? 1 : 0} max={1}
              state={own ? 'max' : meta.pl >= it.cost ? 'buy' : 'poor'} costLabel={own ? 'Débloqué' : `${fr(it.cost)} PL`}
              onBuy={() => setMeta(buyRushThing(meta, it.id, it.cost))} />
          );
        })}
      </div>
    </Section>
    <p className="gp-note">Les Points de Ligue se gagnent à chaque partie du Poké Rush et ne servent qu’ici.</p>
  </>
);

const Dex = ({ Sprite, meta, ids }) => {
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);
  const known = (id) => meta.caught[id] || meta.seen[id];
  const list = useMemo(() => ids.filter((id) => filter === 'all' || (filter === 'caught' ? meta.caught[id] : !meta.caught[id])), [ids, filter, meta]);
  const cur = sel && known(sel) ? sel : list.find(known);
  const f = cur ? FOES[cur] : null;
  const types = cur ? FOE_TYPES[cur] || ['Normal'] : [];
  return (
    <div className="gp-split">
      <Panel tone="plain" bodyClass="gpx-dex-body">
        <Tabs value={filter} onChange={setFilter} items={[['all', 'Tous'], ['caught', 'Capturés'], ['todo', 'À capturer']]} />
        <div className="gp-dexgrid">
          {list.map((id) => {
            const k = known(id);
            return (
              <button key={id} type="button" disabled={!k} onClick={() => setSel(id)} title={k ? FOES[id].name : '???'}
                className={`gp-dexcell${k ? ' is-seen' : ' is-unseen'}${id === cur ? ' is-on' : ''}`} style={{ '--dc': TYPE_COLORS[(FOE_TYPES[id] || ['Normal'])[0]] }}>
                <span><Sprite dex={FOES[id].dex} anim="idle" size={64} scale={FOES[id].boss ? 1 : 1.6} foot={0.9} still /></span>
                <small>{meta.caught[id] ? '● ' : ''}{String(FOES[id].dex).padStart(3, '0')}</small>
              </button>
            );
          })}
        </div>
      </Panel>
      <div className="gp-body gp-sticky">
        {f ? (
          <>
            <div className="gp-hero-art gpx-dex-art" data-no={`#${String(f.dex).padStart(3, '0')}`} style={{ '--hc': TYPE_COLORS[types[0]] }}>
              <Sprite dex={f.dex} anim="walk" size={180} scale={f.boss ? 1.7 : 3} foot={0.85} />
              <span className="gpx-dex-name"><small>{meta.caught[cur] ? `${meta.caught[cur]} capturé${meta.caught[cur] > 1 ? 's' : ''}` : 'Aperçu'}</small><b>{f.name}</b></span>
            </div>
            <Panel tone="plain">
              <div className="gp-chips">{types.map((t) => <span key={t} className="gp-chip" style={{ '--cc': TYPE_COLORS[t] }}>{t}</span>)}</div>
              <span className="gp-mini-title">Faible contre</span>
              <div className="gp-chips">{weaknessesOf(types).map((t) => <span key={t} className="gp-chip" style={{ '--cc': TYPE_COLORS[t] }}>{t}</span>)}</div>
              <p className="gpx-note">Affaiblis-le (PV rouges), puis lance une Poké Ball avec F pour qu’il rejoigne ton équipe.</p>
            </Panel>
          </>
        ) : <p className="gp-note">Croise et capture des Pokémon sur l’île pour remplir ton Pokédex.</p>}
      </div>
    </div>
  );
};

const History = ({ Sprite, meta }) => {
  const list = meta.history || [];
  if (!list.length) return <p className="gp-note">Aucune partie pour l’instant.</p>;
  return (
    <div className="gp-hist">
      {list.map((r) => {
        const pt = RUSH_STARTERS.find((x) => x.id === r.partnerId);
        return (
          <div key={r.at} className={`gp-hist-row${r.result === 'win' ? ' is-win' : ''}`}>
            <span className="gp-hist-face">{pt && <Sprite dex={r.form?.dex || pt.dex} anim="idle" size={48} scale={1.5} still />}</span>
            <span>
              <b>{r.result === 'win' ? 'Victoire à l’arène' : 'K.O.'} · {r.form?.name || pt?.name}</b>
              <small>{r.score ? `${fr(r.score)} pts · ` : ''}{clock(r.t)} · niv. {r.level} · {fr(r.kills)} K.O. · {r.caught} capture{r.caught > 1 ? 's' : ''}</small>
            </span>
            <time>{new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
          </div>
        );
      })}
    </div>
  );
};
