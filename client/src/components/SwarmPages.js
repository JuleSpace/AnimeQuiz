import React, { useMemo, useState } from 'react';
import GamePage, { BoardPage, Choice, Cta, Panel, Quest, Section, Stat, StatBars, Tabs, UpCard, clock } from './GamePage';
import { AI_INFO, FOES, FOE_INFO, GENS, GEN_POOLS, PARTNERS, PASSIVES, TRAIT_INFO, WEAPONS, ultimateOf } from './swarmData';
import {
  ACHIEVEMENTS, ALL_FOE_IDS, BRANCHES, MAX_RANK, REGION_COST, TALENTS, UNLOCKABLES, branchPoints, buyTalent, buyUnlock,
  rankOf, refundAll, talentCost, talentLocked, tierNeed
} from './swarmMeta';
import { HomeIcon } from './GameHome';

/* Les pages de menu du Poké Swarm, rangées comme celles de Pokébonk. */

export const TYPE_COLORS = {
  Électrik: '#f7d02c', Feu: '#ee8130', Eau: '#6390f0', Plante: '#7ac74c', Sol: '#d9b25a', Normal: '#b8b48a',
  Spectre: '#8a6bc4', Ténèbres: '#6b5a4c', Combat: '#d2513f', Objet: '#9fb3d6', Glace: '#7fd8e8', Acier: '#b7b7ce',
  Poison: '#a35cc4', Psy: '#f95587', Vol: '#a98ff3', Dragon: '#6f35fc', Roche: '#b6a136', Fée: '#ff9ad8', Insecte: '#a6b91a'
};
const TYPE_EN = {
  Électrik: 'electric', Feu: 'fire', Eau: 'water', Plante: 'grass', Sol: 'ground', Normal: 'normal', Spectre: 'ghost', Ténèbres: 'dark',
  Combat: 'fighting', Glace: 'ice', Acier: 'steel', Poison: 'poison', Psy: 'psychic', Vol: 'flying', Dragon: 'dragon', Roche: 'rock', Fée: 'fairy', Insecte: 'bug'
};
const ITEM_SLUG = {
  protein: 'protein', carbos: 'carbos', hpup: 'hp-up', magnet: 'magnet', quickclaw: 'quick-claw', leftovers: 'leftovers', scope: 'scope-lens',
  shellbell: 'shell-bell', expshare: 'exp-share', brightpowder: 'bright-powder'
};
const BRANCH_ITEM = { force: 'protein', resolve: 'hp-up', agility: 'carbos', fortune: 'amulet-coin', mastery: 'pp-up' };
export const itemUrl = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
const Item = ({ slug, fallback = '★' }) => <HomeIcon src={slug ? itemUrl(slug) : ''} fallback={fallback} />;
const TIER_LABEL = { t1: 'Commun', t2: 'Peu commun', t3: 'Redoutable', minis: 'Boss', finals: 'Légendaire' };
const fr = (n) => (n || 0).toLocaleString('fr-FR');

const Dust = ({ meta }) => <Stat label="Poussière" value={`✦ ${fr(meta.dust)}`} strong />;

/* ——————————————— Choix du Pokémon ——————————————— */
export const SwarmPickPage = ({ Sprite, backdrop, meta, partnerId, best, onPick, onBack, onNext }) => {
  const partner = PARTNERS.find((p) => p.id === partnerId) || PARTNERS[0];
  const [filter, setFilter] = useState('all');
  const regionOpen = (g) => Boolean(meta.regions[g]);
  const open = regionOpen(partner.gen);
  const ult = ultimateOf(partner);
  const W = WEAPONS[partner.weapon];
  const rec = best[partner.id];
  const list = PARTNERS.filter((p) => filter === 'all' || p.gen === Number(filter));
  const playable = PARTNERS.filter((p) => regionOpen(p.gen)).length;
  const runs = (meta.history || []).filter((r) => r.partnerId === partner.id);
  const maxHp = Math.max(...PARTNERS.map((p) => p.hp));
  const maxSpeed = Math.max(...PARTNERS.map((p) => p.speed));
  return (
    <GamePage
      theme="gh-swarm"
      backdrop={backdrop}
      title="Choisis ton Pokémon"
      subtitle={`${playable}/${PARTNERS.length} starters jouables`}
      onBack={onBack}
      onEnter={onNext}
      right={<Dust meta={meta} />}
    >
      <div className="gp-split">
        <div className="gp-body">
          <Panel tone="plain" bodyClass="gpx-hero-body">
            <div className="gp-hero">
              <div className="gp-hero-art" data-no={`#${String(partner.dex).padStart(3, '0')}`} style={{ '--hc': partner.color }}>
                <Sprite dex={partner.dex} anim="walk" size={180} scale={5} foot={0.85} />
              </div>
              <div className="gp-body" style={{ gap: 10 }}>
                <span className="gp-hero-kicker">#{String(partner.dex).padStart(3, '0')} · Starter de {GENS.find((g) => g.id === partner.gen)?.name}</span>
                <h2>{partner.name}</h2>
                <div className="gp-chips">
                  <span className="gp-chip" style={{ '--cc': TYPE_COLORS[partner.type] }}>{partner.type}</span>
                  {partner.mega && <span className="gp-chip" style={{ '--cc': '#ff6ad5' }}>Méga-Évolution</span>}
                  {!open && <span className="gp-chip is-soft">🔒 Région à débloquer</span>}
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
            <Panel title="Attaque de départ" kicker="Kit" tone="play">
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
              {partner.mega && <p className="gpx-note">Méga : une fois la dernière forme atteinte, prends 3 fois la Méga-Gemme au level-up ({partner.mega.name}).</p>}
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
            <Cta onClick={onNext}>{open ? 'Je te choisis !' : 'Voir la région'}</Cta>
          </Panel>
        </div>
        <Panel title="Starters" kicker="La Ligue" tone="side" className="gp-sticky gpx-roster" right={<span>{playable}/{PARTNERS.length}</span>}>
          <Tabs value={filter} onChange={setFilter} items={[['all', 'Tous'], ...GENS.map((g) => [String(g.id), g.name])]} />
          <div className="gp-roster">
            {list.map((p) => {
              const ok = regionOpen(p.gen);
              return (
                <button key={p.id} type="button" className={`gp-mon${p.id === partner.id ? ' is-on' : ''}${ok ? '' : ' is-locked'}`} style={{ '--mc': p.color }}
                  onClick={() => onPick(p)} onDoubleClick={() => { onPick(p); onNext(); }} aria-pressed={p.id === partner.id} title={p.name}>
                  <span><Sprite dex={p.dex} anim={p.id === partner.id ? 'walk' : 'idle'} size={84} scale={2.4} foot={0.85} still={p.id !== partner.id} /></span>
                  {!ok && <span className="gp-mon-lock">🔒</span>}
                  {best[p.id]?.win && <span className="gp-mon-badge">★</span>}
                  <b>{ok ? p.name : '???'}</b>
                </button>
              );
            })}
          </div>
          <span className="gp-mini-title">Régions débloquées : {Object.keys(meta.regions).length}/{GENS.length}</span>
        </Panel>
      </div>
    </GamePage>
  );
};

/* ——————————————— Préparer la partie (région, mode, rang) ——————————————— */
export const SwarmPrepPage = ({
  Sprite, backdrop, meta, gen, partner, pickGen, rank, setRank, maxRank, runMode, setMode, endlessOpen, best,
  daily, dailyPartner, dailyDone, onDaily, onStart, onUnlock, onBack
}) => {
  const region = GENS.find((g) => g.id === gen);
  const pool = GEN_POOLS[gen];
  const open = Boolean(meta.regions[gen]);
  const rec = best[partner.id];
  const cost = REGION_COST[gen];
  const go = open ? onStart : (meta.dust >= cost ? onUnlock : undefined);
  return (
    <GamePage
      theme="gh-swarm"
      backdrop={backdrop}
      title="Choisis une région"
      subtitle={`${Object.keys(meta.regions).length}/${GENS.length} régions`}
      onBack={onBack}
      onEnter={go}
      right={(
        <>
          <span className="gp-keys"><kbd className="gp-key">Échap</kbd> Pokémon · <kbd className="gp-key">Entrée</kbd> Commencer</span>
          <Dust meta={meta} />
        </>
      )}
    >
      <div className="gp-regions">
        {GENS.map((g) => {
          const ok = meta.regions[g.id];
          const fin = GEN_POOLS[g.id].finals;
          return (
            <button key={g.id} type="button" className={`gp-region${g.id === gen ? ' is-on' : ''}${ok ? '' : ' is-locked'}`} onClick={() => pickGen(g.id)}>
              <span className="gp-region-face"><Sprite dex={FOES[fin[0]].dex} anim="idle" size={40} scale={0.6} foot={0.9} still /></span>
              <span><b>{g.name}</b><small>{ok ? `${fin.filter((id) => meta.legends?.[id]).length}/${fin.length} légendaires` : `🔒 ${cost && g.id === gen ? cost : REGION_COST[g.id]} ✦`}</small></span>
            </button>
          );
        })}
      </div>
      <div className="gp-split">
        <div className="gp-body">
        <div className="gp-stage gpx-stage" style={{ '--rc': TYPE_COLORS[partner.type] }}>
          <div className="gp-stage-title">
            <small>Région · {region.label}</small>
            <h2>{region.name}</h2>
            <div className="gp-stage-desc">
              <div className="gp-chips">
                <span className="gp-chip" style={{ '--cc': '#3c8cff' }}>{pool.t1.length + pool.t2.length + pool.t3.length} espèces sauvages</span>
                <span className="gp-chip" style={{ '--cc': '#ff6b57' }}>{pool.minis.length} boss</span>
                <span className="gp-chip" style={{ '--cc': '#e6a400' }}>{pool.finals.length} légendaires</span>
              </div>
              <p>Survis aux hordes sauvages pendant 9 minutes, puis bats le légendaire de la région. Ennemis, boss et décor changent à chaque partie.</p>
            </div>
          </div>
          <div className="gpx-stage-mons" aria-hidden="true">
            <Sprite dex={FOES[pool.finals[0]].dex} anim="idle" size={260} scale={3} foot={0.9} />
            <Sprite dex={partner.dex} anim="walk" size={170} scale={4.4} foot={0.9} />
          </div>
          <div className="gp-guards">
            <div className="gp-guard">
              <small>Hordes</small>
              <div>{pool.t1.slice(0, 4).map((id) => <span key={id} className="gp-face" title={FOES[id].name}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={1.4} still /></span>)}</div>
            </div>
            <div className="gp-guard">
              <small>Boss possibles</small>
              <div>{pool.minis.slice(0, 4).map((id) => <span key={id} className="gp-face" title={FOES[id].name}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={0.75} foot={0.9} still /></span>)}</div>
            </div>
            <div className="gp-guard is-boss">
              <small>Légendaires</small>
              <div>{pool.finals.map((id) => <span key={id} className={`gp-face${meta.legends?.[id] ? ' is-done' : ''}`} title={`${FOES[id].name}${meta.legends?.[id] ? ' · vaincu' : ''}`}><Sprite dex={FOES[id].dex} anim="idle" size={44} scale={0.6} foot={0.9} still /></span>)}</div>
            </div>
          </div>
        </div>
        <Panel title={dailyDone ? 'Défi du jour réussi !' : `Défi du jour · ${daily.mod.name}`} kicker="Événement" tone="accent">
          <div className="gpx-daily">
            <span className="gp-face"><Sprite dex={dailyPartner.dex} anim="idle" size={44} scale={1.3} still /></span>
            <span><b>{dailyPartner.name} à {GENS.find((g) => g.id === daily.gen)?.name}</b><small>{daily.mod.desc} · même carte pour tout le monde</small></span>
            <button type="button" className="gp-up-buy gpx-daily-go" onClick={onDaily}>{dailyDone ? 'Rejouer' : 'Jouer · +200 ✦'}</button>
          </div>
        </Panel>
        </div>
        <Panel title="Préparer la partie" right={region.name} className="gp-sticky">
          <button type="button" className="gpx-me" onClick={onBack}>
            <span className="gp-face"><Sprite dex={partner.dex} anim="idle" size={44} scale={1.3} still /></span>
            <span><small>Ton Pokémon</small><b>{partner.name}</b></span>
            <em>Changer</em>
          </button>
          <span className="gp-mini-title">Mode</span>
          <div className="gpx-two">
            <Choice title="Classique" sub="Bats le légendaire" on={runMode === 'classic'} onClick={() => setMode('classic')} />
            <Choice title="Survie" sub={endlessOpen ? (meta.endless?.[gen] ? `Record ${clock(meta.endless[gen])}` : 'Tiens le plus longtemps') : 'Gagne une partie'} on={runMode === 'endless'} locked={!endlessOpen} onClick={() => setMode('endless')} tone="good" />
          </div>
          <span className="gp-mini-title">Rang de menace</span>
          <div className="gpx-ranks">
            {Array.from({ length: MAX_RANK + 1 }, (_, r) => (
              <Choice
                key={r}
                title={r ? `Rang ${r}` : 'Normal'}
                right={`×${(1 + r * 0.25).toFixed(2)} ✦${r ? ` · ennemis +${r * 25} %` : ''}`}
                on={r === rank}
                tone="good"
                locked={r > maxRank}
                onClick={() => setRank(r)}
              />
            ))}
          </div>
          <span className="gp-mini-title">Tes scores · {partner.name}</span>
          <div className="gp-kv">
            <span><small>Score record</small><b>{fr(rec?.score)}</b></span>
            <span><small>Meilleur</small><b>{rec ? clock(rec.t) : '—'}</b></span>
            <span><small>Record K.O.</small><b>{fr(rec?.kills)}</b></span>
            <span><small>Rang max</small><b>{meta.ranks?.[gen] || 0}</b></span>
          </div>
          {open
            ? <Cta onClick={onStart}>{runMode === 'endless' ? 'Survie !' : 'Commencer !'}</Cta>
            : <Cta onClick={onUnlock} disabled={meta.dust < cost} tone="good" hint={meta.dust < cost ? '' : 'Entrée'}>{meta.dust < cost ? `${cost} ✦ (il en manque ${cost - meta.dust})` : `Débloquer · ${cost} ✦`}</Cta>}
        </Panel>
      </div>
    </GamePage>
  );
};

/* ——————————————— Progression : Labo, Capacités, Succès, Pokédex, Historique, Classement ——————————————— */
const PAGES = {
  talents: ['Talents', 'Dépense ta Poussière Étoile'],
  moves: ['Capacités', 'Nouvelles attaques et objets'],
  achievements: ['Succès', 'Récompensés en Poussière'],
  dex: ['Pokédex', 'Tous les Pokémon croisés'],
  history: ['Historique', 'Tes dernières parties'],
  board: ['Classement', 'Records du serveur']
};

export const SwarmMetaPage = ({ Sprite, panel, backdrop, meta, setMeta, onBack }) => {
  const [title, sub] = PAGES[panel] || PAGES.talents;
  const seen = ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length;
  const right = {
    talents: (
      <>
        <Stat label="Talents" value={`${Object.values(meta.talents).reduce((a, b) => a + b, 0)} pts`} />
        <Dust meta={meta} />
      </>
    ),
    moves: (
      <>
        <Stat label="Débloquées" value={`${UNLOCKABLES.filter((u) => meta.unlocks?.[u.id]).length}/${UNLOCKABLES.length}`} max={UNLOCKABLES.length} />
        <Dust meta={meta} />
      </>
    ),
    achievements: (
      <>
        <Stat label="Terminés" value={`${Object.keys(meta.achievements).length}/${ACHIEVEMENTS.length}`} max={ACHIEVEMENTS.length} />
        <Dust meta={meta} />
      </>
    ),
    dex: (
      <>
        <Stat label="Vus" value={`${seen}/${ALL_FOE_IDS.length}`} max={ALL_FOE_IDS.length} />
        <Stat label="K.O. au total" value={fr(meta.kills)} />
      </>
    ),
    history: (
      <>
        <Stat label="Parties" value={fr(meta.runs)} />
        <Stat label="Victoires" value={fr((meta.history || []).filter((r) => r.result === 'win').length)} />
      </>
    ),
    board: null
  }[panel];
  return (
    <GamePage theme="gh-swarm" backdrop={backdrop} title={title} subtitle={sub} onBack={onBack} right={right}>
      {panel === 'talents' && <Talents meta={meta} setMeta={setMeta} />}
      {panel === 'moves' && <Moves meta={meta} setMeta={setMeta} />}
      {panel === 'achievements' && <Achievements meta={meta} />}
      {panel === 'dex' && <Dex Sprite={Sprite} meta={meta} />}
      {panel === 'history' && <History Sprite={Sprite} meta={meta} />}
      {panel === 'board' && (
        <BoardPage
          game="swarm"
          gens={GENS.map((g) => ({ id: g.id, name: g.name, sub: g.label }))}
          tabs={[
            { id: 'score', label: 'Score', sub: 'Meilleur score', value: (r) => (r.score || 0).toLocaleString('fr-FR'), unit: 'pts' },
            { id: 'fastest', label: 'Victoires', sub: 'La plus rapide', value: (r) => clock(r.t), unit: '' },
            { id: 'kills', label: 'K.O.', sub: 'Le plus de K.O.', value: (r) => fr(r.kills), unit: 'K.O.' },
            { id: 'endless', label: 'Survie', sub: 'Le plus long', value: (r) => clock(r.t), unit: '' }
          ]}
          describe={(r) => `${r.form || PARTNERS.find((p) => p.id === r.partnerId)?.name || ''} · niv. ${r.level}${r.rank ? ` · rang ${r.rank}` : ''}`}
        />
      )}
    </GamePage>
  );
};

const Talents = ({ meta, setMeta }) => (
  <>
    {BRANCHES.map((b) => (
      <Section key={b.id} title={b.name} count={`${branchPoints(meta, b.id)} pts`} color={b.color}
        sub={`Paliers à ${tierNeed(b.id, 1)} puis ${tierNeed(b.id, 2)} points dans la branche`}>
        <div className="gp-grid">
          {TALENTS.filter((t) => t.branch === b.id).map((t) => {
            const r = rankOf(meta, t.id);
            const maxed = r >= t.max;
            const locked = talentLocked(meta, t);
            const cost = talentCost(meta, t);
            const state = maxed ? 'max' : locked ? 'locked' : meta.dust >= cost ? 'buy' : 'poor';
            return (
              <UpCard
                key={t.id}
                color={b.color}
                icon={<Item slug={BRANCH_ITEM[b.id]} fallback="✦" />}
                name={t.name}
                desc={t.desc(Math.max(1, r))}
                next={r > 0 && !maxed ? `Ensuite : ${t.desc(r + 1)}` : null}
                level={r}
                max={t.max}
                state={state}
                note={locked ? `Palier ${t.tier + 1} : ${branchPoints(meta, t.branch)}/${tierNeed(t.branch, t.tier)} pts` : null}
                costLabel={maxed ? 'Maximum' : locked ? '🔒 Verrouillé' : `✦ ${fr(cost)}`}
                onBuy={() => setMeta(buyTalent(meta, t.id))}
              />
            );
          })}
        </div>
      </Section>
    ))}
    <div className="gpx-refund">
      <button type="button" className="gp-back" disabled={!meta.spent} onClick={() => setMeta(refundAll(meta))}>Tout rembourser · ✦ {fr(meta.spent)}</button>
      <small>Chaque talent acheté rend les suivants un peu plus chers.</small>
    </div>
  </>
);

const Moves = ({ meta, setMeta }) => (
  <>
    {[['weapon', 'Attaques', '#ff6b57'], ['passive', 'Objets', '#4fa8ff']].map(([kind, label, color]) => {
      const list = UNLOCKABLES.filter((u) => u.kind === kind);
      return (
        <Section key={kind} title={label} count={`${list.filter((u) => meta.unlocks?.[u.id]).length}/${list.length}`} color={color}
          sub="Elles pourront sortir dans les cartes de level-up, pour tous les starters">
          <div className="gp-grid">
            {list.map((u) => {
              const owned = meta.unlocks?.[u.id];
              const state = owned ? 'max' : meta.dust >= u.cost ? 'buy' : 'poor';
              return (
                <UpCard
                  key={u.id}
                  color={u.color}
                  icon={<Item slug={kind === 'weapon' ? `tm-${TYPE_EN[u.type] || 'normal'}` : ITEM_SLUG[u.id]} fallback={kind === 'weapon' ? '◆' : '●'} />}
                  name={u.name}
                  desc={u.desc}
                  level={owned ? 1 : 0}
                  max={1}
                  state={state}
                  note={kind === 'weapon' ? u.type : null}
                  costLabel={owned ? 'Débloqué' : `✦ ${fr(u.cost)}`}
                  onBuy={() => setMeta(buyUnlock(meta, u.id))}
                />
              );
            })}
          </div>
        </Section>
      );
    })}
  </>
);

const Achievements = ({ meta }) => {
  const [tab, setTab] = useState('all');
  const done = ACHIEVEMENTS.filter((a) => meta.achievements[a.id]);
  const todo = ACHIEVEMENTS.filter((a) => !meta.achievements[a.id]);
  const show = (list, label, color) => list.length > 0 && (
    <Section title={label} count={list.length} color={color}>
      <div className="gp-grid is-wide">
        {list.map((a) => (
          <Quest key={a.id} icon={<Item slug={meta.achievements[a.id] ? 'star-piece' : 'poke-ball'} fallback={meta.achievements[a.id] ? '★' : '☆'} />}
            name={a.name} desc={a.desc} reward={`+${a.reward} ✦`} done={Boolean(meta.achievements[a.id])} />
        ))}
      </div>
    </Section>
  );
  return (
    <>
      <Tabs value={tab} onChange={setTab} items={[['all', 'Tous'], ['todo', 'En cours', todo.length], ['done', 'Terminés']]} />
      {tab !== 'done' && show(todo, 'En cours', '#ffd447')}
      {tab !== 'todo' && show(done, 'Terminés', '#5fd98a')}
      <p className="gp-note">Parties jouées : {fr(meta.runs)} · K.O. au total : {fr(meta.kills)} · Poussière gagnée au total : ✦ {fr(meta.totalDust)}</p>
    </>
  );
};

const Dex = ({ Sprite, meta }) => {
  const [g, setG] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const ids = useMemo(() => ALL_FOE_IDS.filter((id) => (g === 'all' || FOE_INFO[id].gen === Number(g))
    && (!q || FOES[id].name.toLowerCase().includes(q.toLowerCase()) || String(FOES[id].dex).includes(q))), [g, q]);
  const known = (id) => meta.dex[id] > 0 || meta.met?.[id];
  const cur = sel && known(sel) ? sel : ids.find(known);
  const f = cur ? FOES[cur] : null;
  const info = cur ? FOE_INFO[cur] : null;
  const traits = f ? [f.flying && 'flying', f.heavy && 'heavy', f.blink && 'blink', f.boss].filter(Boolean) : [];
  return (
    <div className="gp-split">
      <Panel tone="plain" bodyClass="gpx-dex-body">
        <div className="gpx-dex-tools">
          <input className="gpx-search" placeholder="Chercher par nom ou numéro…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Tabs value={g} onChange={setG} items={[['all', 'Tous'], ...GENS.map((x) => [String(x.id), x.name])]} />
        </div>
        <div className="gp-dexgrid">
          {ids.map((id) => {
            const k = known(id);
            return (
              <button key={id} type="button" disabled={!k} onClick={() => setSel(id)} title={k ? FOES[id].name : '???'}
                className={`gp-dexcell${k ? ' is-seen' : ' is-unseen'}${FOES[id].boss ? ' is-boss' : ''}${id === cur ? ' is-on' : ''}`} style={{ '--dc': FOES[id].color }}>
                <span><Sprite dex={FOES[id].dex} anim="idle" size={64} scale={FOES[id].boss ? 1 : 1.6} foot={0.9} still /></span>
                <small>{String(FOES[id].dex).padStart(3, '0')}</small>
              </button>
            );
          })}
        </div>
      </Panel>
      <div className="gp-body gp-sticky">
        {f ? (
          <>
            <div className="gp-hero-art gpx-dex-art" data-no={`#${String(f.dex).padStart(3, '0')}`} style={{ '--hc': f.color }}>
              <Sprite dex={f.dex} anim="walk" size={180} scale={f.boss ? 1.7 : 3} foot={0.85} />
              <span className="gpx-dex-name"><small>{GENS.find((x) => x.id === info.gen)?.name} · {TIER_LABEL[info.tier]}</small><b>{f.name}</b></span>
            </div>
            <Panel tone="plain">
              <div className="gp-kv">
                <span><small>PV</small><b>{fr(f.hp)}</b></span>
                <span><small>Dégâts</small><b>{f.dmg}</b></span>
                <span><small>Vitesse</small><b>{f.speed.toFixed(1)}</b></span>
                <span><small>Vaincus</small><b>{fr(meta.dex[cur])}</b></span>
              </div>
              <span className="gp-mini-title">Ce qu’il fait</span>
              <p className="gpx-note">{AI_INFO[f.ai]}</p>
              {traits.map((t) => <p key={t} className="gpx-note">{TRAIT_INFO[t]}</p>)}
              {!f.boss && <p className="gpx-note is-dim">Ses PV et ses dégâts augmentent avec le temps. Les versions « élites » ont 4 fois plus de PV.</p>}
            </Panel>
          </>
        ) : <p className="gp-note">Rencontre des Pokémon en partie pour remplir ton Pokédex.</p>}
      </div>
    </div>
  );
};

const History = ({ Sprite, meta }) => {
  const list = meta.history || [];
  if (!list.length) return <p className="gp-note">Aucune partie enregistrée pour l’instant. Lance-toi !</p>;
  return (
    <div className="gp-hist">
      {list.map((r) => {
        const pt = PARTNERS.find((x) => x.id === r.partnerId);
        return (
          <div key={r.at} className={`gp-hist-row${r.result === 'win' ? ' is-win' : ''}`}>
            <span className="gp-hist-face">{pt && <Sprite dex={pt.dex} anim="idle" size={48} scale={1.5} still />}</span>
            <span>
              <b>{r.result === 'win' ? `Victoire contre ${FOES[r.finalBoss]?.name || 'le légendaire'}` : r.endless ? 'Fin de la survie' : 'K.O.'} · {pt?.name || '?'} à {GENS.find((g) => g.id === r.gen)?.name}</b>
              <small>{r.score ? `${fr(r.score)} pts · ` : ''}{clock(r.t)} · niv. {r.level} · {fr(r.kills)} K.O. · {r.missions}/3 missions{r.rank ? ` · rang ${r.rank}` : ''}{r.weapons?.length ? ` · ${r.weapons.map((id) => WEAPONS[id]?.name || PASSIVES[id]?.name).filter(Boolean).join(', ')}` : ''}</small>
            </span>
            <time>{new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
          </div>
        );
      })}
    </div>
  );
};
