p='PokeSwarm.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:90],s.count(a)); s=s.replace(a,b)
rep("""import { buildWorld } from './swarmWorld';
import { drawPokemon, preloadSprites } from './swarmSprites';
import { FOES, GENS, GEN_BOSSES, GEN_WAVES, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, MEGA_LEVELS, PARTNERS, PASSIVES, WEAPONS, megaOf } from './swarmData';
import {
  ACHIEVEMENTS, ALL_FOE_IDS, BRANCHES, REGION_COST, TALENTS, TIER_NEEDS, branchPoints, buyTalent, dailyChallenge,
  loadMeta, metaEffects, rankOf, recordRun, refundAll, talentCost, talentLocked, unlockRegion
} from './swarmMeta';""","""import { BIOMES, buildWorld } from './swarmWorld';
import { animLength, drawPokemon, preloadSprites } from './swarmSprites';
import {
  AI_INFO, FOES, FOE_INFO, GENS, GEN_POOLS, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, MEGA_LEVELS, PARTNERS, PASSIVES, TRAIT_INFO, WEAPONS,
  buildRoster, canLearn, megaOf, seededRng
} from './swarmData';
import {
  ACHIEVEMENTS, ALL_FOE_IDS, BRANCHES, MAX_RANK, REGION_COST, TALENTS, TIER_NEEDS, UNLOCKABLES, branchPoints, buyTalent, buyUnlock,
  dailyChallenge, loadMeta, metaEffects, rankLabel, rankOf, recordRun, refundAll, talentCost, talentLocked, unlockRegion
} from './swarmMeta';""")
# PmdSprite : animation d'attaque jouée doucement, puis retour au repos
rep("""const PmdSprite = ({ dex, anim = 'idle', size = 96, scale = 3, dir = 0, still = false }) => {""",
"""const PmdSprite = ({ dex, anim = 'idle', size = 96, scale = 3, dir = 0, still = false, cycle = null, rate = 0.55, hold = 1.1, foot = 0.8 }) => {""")
rep("""      const drawn = drawPokemon(x, dex, anim, still ? 0 : (now - t0) / 1000, dir, size / 2, size * 0.8, scale);""",
"""      let drawn;
      const t = (now - t0) / 1000;
      if (cycle) {
        // Carte d'attaque : le Pokémon attend, puis joue son attaque au ralenti
        const len = animLength(dex, cycle) / rate;
        const tt = t % (len + hold);
        drawn = tt < hold
          ? drawPokemon(x, dex, 'idle', t, dir, size / 2, size * foot, scale)
          : drawPokemon(x, dex, cycle, (tt - hold) * rate, dir, size / 2, size * foot, scale, { loop: false });
      } else drawn = drawPokemon(x, dex, anim, still ? 0 : t, dir, size / 2, size * foot, scale);""")
rep("""  }, [dex, anim, size, scale, dir, still]);""","""  }, [dex, anim, size, scale, dir, still, cycle, rate, hold, foot]);""")
rep("""  if (opt.kind === 'weapon') art = <PmdSprite dex={formDex} anim={['quake', 'bite', 'leafblade', 'doublekick', 'machpunch'].includes(opt.id) ? 'attack' : 'shoot'} size={118} scale={2.6} dir={1} />;""",
"""  if (opt.kind === 'weapon') art = <PmdSprite dex={formDex} cycle={['quake', 'bite', 'leafblade', 'doublekick', 'machpunch'].includes(opt.id) ? 'attack' : 'shoot'} size={150} scale={2.1} dir={1} foot={0.78} />;""")
# Pokédex : groupé par génération avec FOE_INFO
rep("""const FOE_GEN = (() => {
  const out = {};
  Object.entries(GEN_WAVES).forEach(([g, waves]) => waves.forEach((w) => w.foes.forEach((id) => { if (!out[id]) out[id] = Number(g); })));
  Object.entries(GEN_BOSSES).forEach(([g, list]) => list.forEach((b) => { if (!out[b.id]) out[b.id] = Number(g); }));
  return out;
})();
""","""const TIER_LABEL = { t1: 'Commun', t2: 'Peu commun', t3: 'Redoutable', minis: 'Boss', finals: 'Légendaire' };

/** Fiche d'un ennemi : ce qu'il fait et comment le gérer. */
const FoeSheet = ({ id, meta, onClose }) => {
  const f = FOES[id];
  const info = FOE_INFO[id];
  const n = meta.dex[id] || 0;
  const traits = [f.flying && 'flying', f.heavy && 'heavy', f.blink && 'blink', f.boss].filter(Boolean);
  return (
    <div className="sw-foe" role="dialog" aria-label={f.name}>
      <button type="button" className="sw-foe-close sw-btn is-small is-ghost" onClick={onClose}>Retour</button>
      <div className="sw-foe-art" style={{ '--c': f.color }}>
        <PmdSprite dex={f.dex} anim="walk" size={150} scale={f.boss ? 1.6 : 2.6} dir={0} />
      </div>
      <div className="sw-foe-body">
        <h3>{f.name}</h3>
        <span className="sw-foe-tag">{GENS.find((g) => g.id === info.gen)?.name} · {TIER_LABEL[info.tier]}</span>
        <div className="sw-chips is-foe">
          <span style={{ '--c': '#5fd98a' }}><small>PV</small><b>{f.hp.toLocaleString('fr-FR')}</b></span>
          <span style={{ '--c': '#ff6b57' }}><small>Dégâts</small><b>{f.dmg}</b></span>
          <span style={{ '--c': '#4fa8ff' }}><small>Vitesse</small><b>{f.speed.toFixed(1)}</b></span>
          <span style={{ '--c': '#ffd447' }}><small>Vaincus</small><b>{n.toLocaleString('fr-FR')}</b></span>
        </div>
        <h4>Ce qu’il fait</h4>
        <p>{AI_INFO[f.ai]}</p>
        {traits.map((t) => <p key={t} className="sw-foe-trait">{TRAIT_INFO[t]}</p>)}
        {!f.boss && <p className="sw-foe-note">Ses PV et ses dégâts augmentent avec le temps. Les versions « élites », plus grandes, ont 4 fois plus de PV.</p>}
      </div>
    </div>
  );
};
""")
rep("""const MetaPanel = ({ panel, meta, setMeta, onClose }) => {
  const [tab, setTab] = useState(panel);
  useEffect(() => setTab(panel), [panel]);""","""const MetaPanel = ({ panel, meta, setMeta, onClose }) => {
  const [tab, setTab] = useState(panel);
  const [foe, setFoe] = useState(null);
  useEffect(() => setTab(panel), [panel]);
  useEffect(() => setFoe(null), [tab]);""")
rep("""            {[['talents', 'Talents'], ['achievements', `Défis ${Object.keys(meta.achievements).length}/${ACHIEVEMENTS.length}`], ['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`]].map(([id, label]) => (""",
"""            {[['talents', 'Talents'], ['moves', `Capacités ${UNLOCKABLES.filter((u) => meta.unlocks?.[u.id]).length}/${UNLOCKABLES.length}`], ['achievements', `Défis ${Object.keys(meta.achievements).length}/${ACHIEVEMENTS.length}`], ['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`]].map(([id, label]) => (""")
rep("""        {tab === 'achievements' && (""","""        {tab === 'moves' && (
          <>
            <p className="sw-panel-note">Débloque de nouvelles capacités et de nouveaux objets : ils pourront ensuite sortir dans les cartes de level-up, pour tous les starters. Les attaques signature des autres starters du même type sont déjà disponibles.</p>
            <div className="sw-shop">
              {UNLOCKABLES.map((u) => {
                const owned = meta.unlocks?.[u.id];
                return (
                  <div key={u.id} className={`sw-shop-item${owned ? ' is-owned' : ''}`} style={{ '--c': u.color }}>
                    <div className="sw-tile-top"><b>{u.name}</b><small>{u.kind === 'weapon' ? u.type : 'Objet'}</small></div>
                    <p>{u.desc}</p>
                    <button type="button" className={`sw-btn is-small${owned ? '' : ' is-go'}`} disabled={owned || meta.dust < u.cost} onClick={() => setMeta(buyUnlock(meta, u.id))}>
                      {owned ? 'Débloqué' : `Débloquer · ${u.cost} ✦`}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'achievements' && (""")
rep("""        {tab === 'dex' && (
          <div className="sw-dex">""","""        {tab === 'dex' && foe && <FoeSheet id={foe} meta={meta} onClose={() => setFoe(null)} />}
        {tab === 'dex' && !foe && (
          <div className="sw-dex">
            <p className="sw-panel-note">Clique sur un Pokémon déjà croisé pour voir ce qu’il sait faire. À chaque partie, seule une partie du pool de la région apparaît.</p>""")
rep("""                  {ALL_FOE_IDS.filter((id) => FOE_GEN[id] === gn.id).map((id) => {
                    const n = meta.dex[id] || 0;
                    const f = FOES[id];
                    return (
                      <div key={id} className={`sw-dex-cell${n ? '' : ' is-unseen'}${f.boss ? ' is-boss' : ''}`} title={n ? f.name : '???'}>
                        <PmdSprite dex={f.dex} anim="idle" size={64} scale={f.boss ? 1.2 : 1.8} still />
                        <b>{n ? f.name : '???'}</b>
                        <small>{n ? `${n.toLocaleString('fr-FR')} K.O.` : 'Jamais vaincu'}</small>
                      </div>
                    );
                  })}""","""                  {ALL_FOE_IDS.filter((id) => FOE_INFO[id].gen === gn.id).map((id) => {
                    const n = meta.dex[id] || 0;
                    const known = n > 0 || meta.met?.[id];
                    const f = FOES[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!known}
                        onClick={() => setFoe(id)}
                        className={`sw-dex-cell${known ? '' : ' is-unseen'}${f.boss ? ' is-boss' : ''}`}
                        title={known ? `${f.name} : voir sa fiche` : '???'}
                      >
                        <PmdSprite dex={f.dex} anim="idle" size={64} scale={f.boss ? 1.2 : 1.8} still />
                        <b>{known ? f.name : '???'}</b>
                        <small>{n ? `${n.toLocaleString('fr-FR')} K.O.` : known ? 'Croisé' : 'Jamais vu'}</small>
                      </button>
                    );
                  })}""")
# état : rang, biome
rep("""  const [world, setWorld] = useState(null);""","""  const [world, setWorld] = useState(null);
  const [rank, setRank] = useState(0);""")
rep("""  const finalBoss = FOES[GEN_BOSSES[gen][GEN_BOSSES[gen].length - 1].id];""","""  const pool = GEN_POOLS[gen];
  const maxRank = Math.min(MAX_RANK, meta.ranks?.[gen] || 0);
  useEffect(() => { setRank((r) => Math.min(r, maxRank)); }, [gen, maxRank]);""")
# onEnd : rang, biome, boss final, ennemis croisés
rep("""          rocks: snap.rocks, noHit: snap.noHit, dashes: snap.dashes
        });""","""          rocks: snap.rocks, noHit: snap.noHit, dashes: snap.dashes,
          rank: runRef.current.rank, biome: runRef.current.biome, finalBoss: snap.finalBoss, met: snap.met
        });""")
rep("""    }, world, gen, metaEffects(metaRef.current, dailyRef.current?.mod));""","""    }, world, gen, { ...metaEffects(metaRef.current, dailyRef.current?.mod, runRef.current.rank), roster: runRef.current.roster });""")
rep("""  const start = (dly = null) => {
    dailyRef.current = dly && dly.key ? dly : null;""","""  const runRef = useRef({ rank: 0, biome: null, roster: null });
  const start = (dly = null, forGen = gen) => {
    dailyRef.current = dly && dly.key ? dly : null;
    // Nouvelle carte et nouveau roster à chaque partie (identiques pour tout le monde au défi du jour)
    const seed = dailyRef.current ? [...dailyRef.current.key].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 17) : Math.floor(Math.random() * 1e9);
    const rng = dailyRef.current ? seededRng(seed) : Math.random;
    const roster = buildRoster(forGen, rng);
    const w = buildWorld(seed, null, { statues: [FOES[roster.minis[0]].dex, FOES[roster.minis[1]].dex, FOES[roster.final].dex] });
    runRef.current = { rank: dailyRef.current ? 0 : rank, biome: w.biome, roster };
    setWorld(w);""")
rep("""  const playDaily = () => {
    setGen(daily.gen);
    setPartnerId(daily.partnerId);
    start(daily);
  };""","""  const playDaily = () => {
    setGen(daily.gen);
    setPartnerId(daily.partnerId);
    start(daily, daily.gen);
  };""")
rep("""            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats {finalBoss.name}. Tes attaques partent toutes seules : à toi de bouger et de bien choisir tes bonus.</p>""",
"""            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats le Pokémon légendaire de la région. Ennemis, boss et décor changent à chaque partie. Tes attaques partent toutes seules : à toi de bouger et de bien choisir tes bonus.</p>""")
rep("""          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('achievements')}>""","""          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('moves')}>
            Capacités <small>{UNLOCKABLES.filter((u) => meta.unlocks?.[u.id]).length}/{UNLOCKABLES.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('achievements')}>""")
open(p,'w').write(s)
print('ok')
