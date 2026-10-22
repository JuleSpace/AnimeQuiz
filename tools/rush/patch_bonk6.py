p='PokeSwarm.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

rep("  AI_INFO, FOES, FOE_INFO, GENS,","  AI_INFO, BLESSINGS, FOES, FOE_INFO, GENS,")
rep("  buildRoster, megaOf, seededRng\n} from './swarmData';","  buildRoster, megaOf, seededRng, ultimateOf\n} from './swarmData';")
rep("const MUSIC_KEY = 'poke-arena-music';","const MUSIC_KEY = 'poke-arena-music';\nconst MODE_KEY = 'poke-swarm-mode';")
rep("  Glace: '#7fd8e8', Acier: '#b7b7ce', Poison: '#a35cc4', Psy: '#f95587', Vol: '#a98ff3', Dragon: '#6f35fc'\n};",
    "  Glace: '#7fd8e8', Acier: '#b7b7ce', Poison: '#a35cc4', Psy: '#f95587', Vol: '#a98ff3', Dragon: '#6f35fc',\n  Roche: '#b6a136', Fée: '#ff9ad8'\n};")

# Récap de pause : emplacements et missions
rep("""      <h3>Attaques <small>{h.weapons.length}/{MAX_WEAPONS}</small></h3>""","""      {h.missions?.length > 0 && (
        <>
          <h3>Missions</h3>
          <Missions list={h.missions} />
        </>
      )}
      <h3>Attaques <small>{h.weapons.length}/{h.slots?.weapons || MAX_WEAPONS}</small></h3>""")
rep("""        {Array.from({ length: Math.max(0, MAX_WEAPONS - h.weapons.length) }, (_, i) =>""","""        {Array.from({ length: Math.max(0, (h.slots?.weapons || MAX_WEAPONS) - h.weapons.length) }, (_, i) =>""")
rep("""      <h3>Objets <small>{h.passives.length}/{MAX_PASSIVES}</small></h3>""","""      <h3>Objets <small>{h.passives.length}/{h.slots?.passives || MAX_PASSIVES}</small></h3>""")
rep("""        {Array.from({ length: Math.max(0, MAX_PASSIVES - h.passives.length) }, (_, i) =>""","""        {Array.from({ length: Math.max(0, (h.slots?.passives || MAX_PASSIVES) - h.passives.length) }, (_, i) =>""")
rep("""const Pips = ({ lv }) => (""","""/** Liste des missions de la partie (HUD, pause, fin). */
const Missions = ({ list, compact = false }) => (
  <ul className={`sw-missions-list${compact ? ' is-compact' : ''}`}>
    {list.map((m) => (
      <li key={m.id} className={m.done ? 'is-done' : m.failed ? 'is-failed' : ''}>
        <i aria-hidden="true">{m.done ? '✓' : m.failed ? '✕' : '◆'}</i>
        <span>{m.label}</span>
        <b>{m.done ? 'OK' : m.failed ? 'raté' : `${m.value}/${m.goal}`}</b>
        {!compact && !m.done && !m.failed && <em style={{ width: `${(m.value / m.goal) * 100}%` }} />}
      </li>
    ))}
  </ul>
);

/** Historique des dernières parties. */
const History = ({ meta }) => {
  const list = meta.history || [];
  if (!list.length) return <p className="sw-panel-note">Aucune partie enregistrée pour l’instant. Lance-toi !</p>;
  return (
    <div className="sw-history">
      {list.map((r) => {
        const pt = PARTNERS.find((x) => x.id === r.partnerId);
        return (
          <div key={r.at} className={`sw-hist${r.result === 'win' ? ' is-win' : ''}`}>
            {pt && <PmdSprite dex={pt.dex} anim="idle" size={48} scale={1.5} still />}
            <div>
              <b>{pt?.name || '?'} · {GENS.find((g) => g.id === r.gen)?.name}{r.endless ? ' · Survie infinie' : ''}{r.rank ? ` · rang ${r.rank}` : ''}</b>
              <small>
                {r.result === 'win' ? `Victoire contre ${FOES[r.finalBoss]?.name || 'le légendaire'}` : r.endless ? 'Fin de la survie' : 'K.O.'} · {clock(r.t)} · niv. {r.level} · {r.kills} K.O. · {r.missions}/3 missions
              </small>
              {r.weapons?.length > 0 && <small className="sw-hist-moves">{r.weapons.map((id) => WEAPONS[id]?.name).filter(Boolean).join(' · ')}</small>}
            </div>
            <time>{new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
          </div>
        );
      })}
    </div>
  );
};

const Pips = ({ lv }) => (""")
# Onglet Historique
rep("""['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`]].map(""","""['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`], ['history', 'Historique']].map(""")
rep("""        {tab === 'dex' && foe && <FoeSheet""","""        {tab === 'history' && <History meta={meta} />}
        {tab === 'dex' && foe && <FoeSheet""")

# État : autel, mode
rep("""  const [levelUp, setLevelUp] = useState(null);
  const [paused, setPaused] = useState(false);""","""  const [levelUp, setLevelUp] = useState(null);
  const [paused, setPaused] = useState(false);
  const [altar, setAltar] = useState(null);
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem(MODE_KEY) === 'endless' ? 'endless' : 'classic'; } catch { return 'classic'; }
  });
  const setMode = (v) => { setModeState(v); try { localStorage.setItem(MODE_KEY, v); } catch { /* stockage indisponible */ } };""")
rep("""  const pool = GEN_POOLS[gen];""","""  const pool = GEN_POOLS[gen];
  const endlessOpen = Object.keys(meta.legends || {}).length > 0;
  const runMode = endlessOpen ? mode : 'classic';""")
rep("""      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),""","""      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),
      onAltar: (options) => setAltar(options),""")
rep("""          rank: runRef.current.rank, biome: runRef.current.biome, finalBoss: snap.finalBoss, met: snap.met
        });""","""          rank: runRef.current.rank, biome: runRef.current.biome, finalBoss: snap.finalBoss, met: snap.met,
          missions: snap.missions, alphaKills: snap.alphaKills, alphaBy: snap.alphaBy, endless: snap.endless, endlessWave: snap.endlessWave,
          finalDown: snap.finalDown, blessDust: snap.blessDust, ults: snap.ults, altarsUsed: snap.altarsUsed, weaponIds: snap.weapons.map((w) => w.id)
        });""")
rep("""    }, world, gen, { ...metaEffects(metaRef.current, dailyRef.current?.mod, runRef.current.rank), roster: runRef.current.roster });""",
    """    }, world, gen, { ...metaEffects(metaRef.current, dailyRef.current?.mod, runRef.current.rank), roster: runRef.current.roster, endless: runRef.current.endless });""")
rep("""    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end));
  }, [paused, levelUp, end]);""","""    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end) || Boolean(altar));
  }, [paused, levelUp, end, altar]);""")
rep("""  const runRef = useRef({ rank: 0, biome: null, roster: null });""","""  const runRef = useRef({ rank: 0, biome: null, roster: null, endless: false });""")
rep("""    runRef.current = { rank: dailyRef.current ? 0 : rank, biome: w.biome, roster };""","""    runRef.current = { rank: dailyRef.current ? 0 : rank, biome: w.biome, roster, endless: !dailyRef.current && runMode === 'endless' };""")
rep("""    setLevelUp(null);
    setPaused(false);
    setHud(null);""","""    setLevelUp(null);
    setAltar(null);
    setPaused(false);
    setHud(null);""")
rep("""  const choose = (opt) => {""","""  const bless = (id) => {
    setAltar(null);
    gameRef.current?.chooseBlessing(id);
  };
  const ult = ultimateOf(partner);
  const choose = (opt) => {""")

# Menu : texte, bouton Historique, mode
rep("""            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats le Pokémon légendaire de la région. Ennemis, boss et décor changent à chaque partie. Tes attaques partent toutes seules : à toi de bouger et de bien choisir tes bonus.</p>""",
"""            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats le Pokémon légendaire de la région. Ennemis, boss et décor changent à chaque partie. Tes attaques partent toutes seules : à toi de bouger, de remplir tes 3 missions, de trouver les autels et de déchaîner ton ultime au bon moment.</p>""")
rep("""            Pokédex <small>{ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length}/{ALL_FOE_IDS.length}</small>
          </button>""","""            Pokédex <small>{ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length}/{ALL_FOE_IDS.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('history')}>
            Historique <small>{(meta.history || []).length}</small>
          </button>""")
rep("""            <small>{rankLabel(rank)}</small>
          </div>""","""            <small>{rankLabel(rank)}</small>
          </div>
          <div className="sw-mode">
            <span className="sw-kicker">Mode de jeu</span>
            <div className="sw-mode-row" role="radiogroup" aria-label="Mode de jeu">
              <button type="button" role="radio" aria-checked={runMode === 'classic'} className={`sw-mode-btn${runMode === 'classic' ? ' is-on' : ''}`} onClick={() => setMode('classic')}>
                <b>Classique</b><small>Bats le légendaire</small>
              </button>
              <button type="button" role="radio" aria-checked={runMode === 'endless'} disabled={!endlessOpen} className={`sw-mode-btn${runMode === 'endless' ? ' is-on' : ''}`} onClick={() => setMode('endless')} title={endlessOpen ? '' : 'Gagne une partie pour débloquer ce mode'}>
                <b>{endlessOpen ? '' : '🔒 '}Survie infinie</b>
                <small>{endlessOpen ? (meta.endless?.[gen] ? `Record : ${clock(meta.endless[gen])}` : 'Tiens le plus longtemps') : 'Gagne une partie'}</small>
              </button>
            </div>
          </div>""")
rep("""          <span><b>Méga</b> une fois la dernière forme atteinte, prends 3 fois la Méga-Gemme au level-up</span>""","""          <span><b>Méga</b> une fois la dernière forme atteinte, prends 3 fois la Méga-Gemme au level-up</span>
          <span><b>Ultime</b> R ou le bouton : chaque K.O. remplit la jauge. {ult.name} : {ult.desc}</span>
          <span><b>Autels</b> 3 par carte (violets sur la mini-carte) : reste dessus 2 s pour choisir une bénédiction</span>
          <span><b>Alpha</b> vers 2:30 et 5:30, un Pokémon géant à l’aura rouge débarque : il lâche un coffre</span>
          <span><b>Missions</b> 3 objectifs par partie : XP, soin et Poussière à la clé</span>""")
rep("""          ? <button type="button" className="sw-btn is-go" onClick={() => start()}>Partir avec {partner.name}</button>""",
    """          ? <button type="button" className="sw-btn is-go" onClick={() => start()}>{runMode === 'endless' ? `Survie infinie avec ${partner.name}` : `Partir avec ${partner.name}`}</button>""")

# HUD : missions et ultime
rep("""          {h.boss && (
            <div className="sw-boss">""","""          {h.missions?.length > 0 && (
            <div className="sw-missions">
              <span className="sw-kicker">{h.endless ? `Survie infinie${h.endlessWave ? ` · vague ${h.endlessWave}` : ''}` : 'Missions'}</span>
              <Missions list={h.missions} compact />
            </div>
          )}
          {h.boss && (
            <div className="sw-boss">""")
rep("""            <b>Esquive</b><small>Espace</small>
          </button>""","""            <b>Esquive</b><small>Espace</small>
          </button>
          <button
            type="button"
            className={`sw-ult${h.ult >= 1 ? ' is-ready' : ''}`}
            style={{ '--k': Math.min(1, h.ult || 0), '--c': h.ultColor }}
            title={`${h.ultName} : ${ult.desc}`}
            onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.ultimate(); }}
          >
            <b>Ultime</b><small>{h.ult >= 1 ? 'R : prêt !' : `${Math.floor((h.ult || 0) * 100)} %`}</small>
          </button>""")

# Autel : choix de bénédiction
rep("""      {paused && !levelUp && !end && (""","""      {altar && !end && (
        <div className="sw-modal">
          <div className="sw-card is-altar">
            <span className="sw-kicker">Autel ancien</span>
            <h2>Choisis une bénédiction</h2>
            <div className="sw-blessings">
              {altar.map((b, i) => (
                <button key={b.id} type="button" className="sw-blessing" style={{ '--c': b.color, '--i': i }} onClick={() => bless(b.id)}>
                  <i aria-hidden="true" />
                  <b>{b.name}</b>
                  <small>{b.desc}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {paused && !levelUp && !end && !altar && (""")
rep("""      {levelUp && !end && (""","""      {levelUp && !end && !altar && (""")

# Fin de partie : missions, survie
rep("""            {end.reward?.rankUp > 0 && <p className="sw-rankup">Rang {end.reward.rankUp} débloqué dans cette région !</p>}""","""            {end.reward?.rankUp > 0 && <p className="sw-rankup">Rang {end.reward.rankUp} débloqué dans cette région !</p>}
            {end.endless && <p className="sw-rankup">{end.reward?.endlessRecord ? 'Nouveau record de survie' : 'Survie infinie'} : {clock(end.t)}{end.endlessWave ? ` · ${end.endlessWave} vague${end.endlessWave > 1 ? 's' : ''} infinie${end.endlessWave > 1 ? 's' : ''}` : ''}</p>}
            {end.missions?.length > 0 && <div className="sw-end-missions"><Missions list={end.missions} compact /></div>}""")
rep("""            <h2>{end.result === 'win' ? `${FOES[end.finalBoss]?.name || 'Le légendaire'} est K.O. !` : `${end.form.name} est K.O.`}</h2>""",
    """            <h2>{end.result === 'win' ? `${FOES[end.finalBoss]?.name || 'Le légendaire'} est K.O. !` : end.endless ? `${end.form.name} a tenu ${clock(end.t)}` : `${end.form.name} est K.O.`}</h2>""")
open(p,'w').write(s)
print('ok')
