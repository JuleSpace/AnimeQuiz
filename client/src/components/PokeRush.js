import React, { useEffect, useRef, useState } from 'react';
import { createRush } from './rushEngine';
import {
  FINAL_AT, FOE_TYPES, MAX_ALLIES, RUSH_STARTERS, TYPE_COLORS, UPGRADES, buyRushThing,
  loadRush, recordRush, saveRush, rushEffects, rushPool, starterOpen, upCost, upRank, weaknessesOf
} from './rushData';
import { FOES, WEAPONS, ultimateOf } from './swarmData';
import { Missions, MusicControls, PmdSprite, RunRecap, TcgCard, itemSprite } from './PokeSwarm';
import GameHome, { HomeBoard, HomeIcon } from './GameHome';
import { RushMetaPage, RushPickPage, RushPrepPage } from './RushPages';
import ScoreCard from './ScoreCard';
import { rushScore } from './scoring';
import { musicPlayer } from './pokeArenaMusic';
import { AccountChip, postRun, useCloudSync } from './account';
import './PokeSwarm.css';
import './PokeRush.css';

export const RUSH_HASH = '#pokerush';
const MUSIC_KEY = 'poke-arena-music';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const TypeChip = ({ type }) => <span className="pr-type" style={{ '--c': TYPE_COLORS[type] || '#999' }}>{type}</span>;

/** Décor de l'accueil : une île de Kanto au lever du jour, en aplats pixel. */
const RushScene = () => (
  <div className="prh-scene" aria-hidden="true">
    <span className="prh-sun" />
    <span className="prh-cloud is-1" /><span className="prh-cloud is-2" /><span className="prh-cloud is-3" /><span className="prh-cloud is-4" />
    <span className="prh-bird is-1" /><span className="prh-bird is-2" />
    <span className="prh-sea" />
    <span className="prh-hill is-far" />
    <span className="prh-hill is-mid" />
    <span className="prh-arena" />
    <span className="prh-hill is-near" />
    <span className="prh-grass" />
  </div>
);

const RUSH_HOWTO = (ultName) => [
  ['Bouger', 'ZQSD / WASD · caméra à la souris (clic) ou en glissant à droite de l’écran'],
  ['Sauter', 'Espace : les falaises se franchissent en sautant'],
  ['Esquive', 'Maj : un bond rapide, invincible'],
  ['Capturer', `F : PV rouges = capturable, il se bat ensuite avec toi (${MAX_ALLIES} max)`],
  ['Types', 'les attaques super efficaces font ×2, les mauvaises ×0,5'],
  ['Ultime', `R : ${ultName}`],
  ['Hautes herbes', 'des Pokémon Alpha s’y cachent vers 2:00 et 5:00'],
  ['Eau', 'seuls les types Eau et Vol s’y aventurent'],
  ['Coffres', 'payés en Poké Dollars ₽, ramassés sur les sauvages'],
  ['Arène', 'à 8:00, le légendaire s’y réveille : bats-le pour gagner']
];

const PokeRush = ({ onClose }) => {
  const [screen, setScreen] = useState('home');
  const [howto, setHowto] = useState(false);
  const [meta, setMetaState] = useState(loadRush);
  const metaRef = useRef(meta);
  const setMeta = (m) => { metaRef.current = m; setMetaState(m); };
  useCloudSync('rush', meta, (remote) => { saveRush({ ...remote }); setMeta(loadRush()); }, (m) => m?.total || 0);
  const [partnerId, setPartnerId] = useState(RUSH_STARTERS[0].id);
  const [hud, setHud] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [altar, setAltar] = useState(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState(null);
  const [panel, setPanel] = useState(null);
  const [run, setRun] = useState(0);
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const gameRef = useRef(null);
  const partner = RUSH_STARTERS.find((p) => p.id === partnerId) || RUSH_STARTERS[0];
  const ult = ultimateOf(partner);

  useEffect(() => {
    const player = musicPlayer();
    let vol = 0.5;
    try { const raw = localStorage.getItem(MUSIC_KEY); if (raw !== null) vol = Number(raw); } catch { /* stockage indisponible */ }
    player.setVolume(Number.isFinite(vol) ? vol : 0.5);
    player.setMode('main');
    return () => player.stop();
  }, []);

  useEffect(() => {
    if (screen !== 'play' || !mountRef.current || !overlayRef.current) return undefined;
    const game = createRush(mountRef.current, overlayRef.current, partner, {
      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),
      onAltar: (options) => setAltar(options),
      onEnd: (result, snap) => {
        const missionsDone = snap.missions.filter((m) => m.done).length;
        const sc = rushScore({ result, t: snap.t, kills: snap.kills, level: snap.level, caught: snap.caught.length, bosses: snap.bosses, alphaKills: snap.alphaKills, missions: missionsDone });
        const rec = recordRush(metaRef.current, {
          score: sc.total,
          result, t: snap.t, kills: snap.kills, level: snap.level, caught: snap.caught, met: snap.met, bosses: snap.bosses,
          missions: snap.missions.filter((m) => m.done).length, partnerId: partner.id, form: snap.form
        });
        setMeta(rec.meta);
        setEnd({ result, ...snap, reward: rec, score: sc });
        postRun('rush', {
          score: sc.total,
          gen: 1, mode: 'classic', partnerId: partner.id, form: snap.form.name, formDex: String(snap.form.dex), result, t: snap.t, kills: snap.kills,
          level: snap.level, caught: snap.caught.length, missions: snap.missions.filter((m) => m.done).length
        });
      },
      onPauseKey: () => setPaused((v) => !v)
    }, rushEffects(metaRef.current));
    gameRef.current = game;
    const timer = setInterval(() => setHud(game.snapshot()), 100);
    return () => { clearInterval(timer); game.destroy(); gameRef.current = null; };
  }, [screen, run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end) || Boolean(altar));
  }, [paused, levelUp, end, altar]);

  const start = () => {
    setEnd(null); setLevelUp(null); setAltar(null); setPaused(false); setHud(null); setPanel(null);
    setRun((n) => n + 1);
    setScreen('play');
  };
  const choose = (opt) => { setLevelUp(null); gameRef.current?.choose(opt); };
  const reroll = () => {
    const options = gameRef.current?.reroll();
    if (options) setLevelUp((cur) => ({ ...cur, options, rerolls: cur.rerolls - 1 }));
  };
  const bless = (id) => { setAltar(null); gameRef.current?.chooseBlessing(id); };

  if (panel && screen !== 'play') {
    return (
      <div className="sw-root pr-root prh-wrap">
        <RushMetaPage Sprite={PmdSprite} panel={panel} backdrop={<RushScene />} meta={meta} setMeta={setMeta} onBack={() => setPanel(null)} />
      </div>
    );
  }

  if (screen === 'home') {
    const pool = rushPool(1);
    const dexIds = [...pool.t1, ...pool.t2, ...pool.t3, ...pool.minis, ...pool.finals];
    const caughtN = dexIds.filter((id) => meta.caught[id]).length;
    const affordUp = UPGRADES.filter((u) => upRank(meta, u.id) < u.max && meta.pl >= upCost(meta, u)).length;
    const legend = pool.finals[Math.floor(Date.now() / 60000) % pool.finals.length];
    const beaten = pool.finals.filter((id) => meta.caught[id]).length;
    const rec = meta.best[partner.id];
    const locked = RUSH_STARTERS.find((p) => !starterOpen(meta, p));
    return (
      <div className="sw-root pr-root prh-wrap">
        <GameHome
          theme="gh-swarm gh-rush"
          backdrop={<RushScene />}
          topLeft={(
            <>
              <button type="button" className="gh-pill is-plain" onClick={onClose}>← Bully’s Lair</button>
              <button type="button" className="gh-pill is-plain" onClick={() => setHowto(true)}>Comment jouer</button>
            </>
          )}
          topRight={(
            <>
              <AccountChip returnHash="#pokerush" />
              <span className="gh-pill" title="Parties jouées">{(meta.runs || 0).toLocaleString('fr-FR')} parties</span>
              <span className="gh-pill" title="Victoires">🏆 {meta.wins || 0}</span>
              <span className="gh-pill is-strong" title="Points de Ligue">{meta.pl.toLocaleString('fr-FR')} PL</span>
            </>
          )}
          logo={(
            <div className="prh-logo">
              <span className="sw-kicker">Mode secret · Aube de Kanto · 3D</span>
              <h1>Poké <em>Rush</em></h1>
            </div>
          )}
          stage={(
            <>
              <span className="prh-legend"><PmdSprite dex={FOES[legend].dex} anim="idle" size={230} scale={2.5} foot={0.92} /></span>
              <span className="prh-partner"><PmdSprite dex={partner.dex} anim="walk" size={170} scale={4} foot={0.92} /></span>
            </>
          )}
          play={{
            title: 'Jouer',
            sub: `Île de Kanto · ${partner.name}${rec ? ` · ${rec.win ? 'victoire en' : 'record'} ${clock(rec.t)}` : ''}`,
            art: <PmdSprite dex={partner.dex} anim="idle" size={96} scale={2.6} />,
            onClick: () => setScreen('menu')
          }}
          side={{
            title: 'Partenaire',
            sub: `${RUSH_STARTERS.filter((p) => starterOpen(meta, p)).length}/${RUSH_STARTERS.length} recrutés`,
            art: <HomeIcon src={itemSprite('friend-ball')} fallback="◎" />,
            onClick: () => setScreen('menu')
          }}
          cards={[
            {
              key: 'arena', tone: beaten === pool.finals.length ? 'done' : 'event', kicker: `Arène de 8:00 · ${beaten}/${pool.finals.length} capturés`,
              title: `${FOES[legend].name} t’attend`,
              sub: `Faible contre ${weaknessesOf(FOE_TYPES[legend]).join(', ') || '—'}`,
              art: <PmdSprite dex={FOES[legend].dex} anim="idle" size={52} scale={0.8} still />,
              onClick: () => setScreen('menu')
            },
            locked ? {
              key: 'recruit', tone: 'light', kicker: 'Recrue',
              title: `${locked.name} · ${locked.cost} PL`,
              sub: meta.pl >= locked.cost ? 'Tu peux le recruter !' : `Il te manque ${locked.cost - meta.pl} PL`,
              art: <PmdSprite dex={locked.dex} anim="idle" size={52} scale={1.5} still />,
              onClick: () => { setPartnerId(locked.id); setScreen('menu'); }
            } : {
              key: 'record', tone: 'light', kicker: 'Palmarès',
              title: `${meta.wins || 0} victoire${(meta.wins || 0) > 1 ? 's' : ''} · ${meta.runs || 0} parties`,
              sub: `${(meta.total || 0).toLocaleString('fr-FR')} PL gagnés au total`,
              art: <HomeIcon src={itemSprite('gold-bottle-cap')} fallback="🏆" />,
              onClick: () => setPanel('history')
            }
          ]}
          tiles={[
            { key: 'shop', label: 'Centre', value: `${UPGRADES.reduce((n, u) => n + upRank(meta, u.id), 0)} niv.`, badge: affordUp, color: '#ff6f8a', icon: <HomeIcon src={itemSprite('potion')} fallback="✚" />, onClick: () => setPanel('shop') },
            { key: 'dex', label: 'Pokédex', value: `${caughtN}/${dexIds.length}`, color: '#ff4f4f', icon: <HomeIcon src={itemSprite('poke-ball')} fallback="●" />, onClick: () => setPanel('dex') },
            { key: 'board', label: 'Classement', value: 'en ligne', color: '#ffc93c', icon: <HomeIcon src={itemSprite('gold-bottle-cap')} fallback="★" />, onClick: () => setPanel('board') },
            { key: 'history', label: 'Historique', value: `${(meta.history || []).length}`, color: '#5fb8ff', icon: <HomeIcon src={itemSprite('town-map')} fallback="☰" />, onClick: () => setPanel('history') }
          ]}
          board={(
            <HomeBoard
              game="rush"
              gen={1}
              title="Classement"
              subtitle="Île de Kanto · meilleur score de chaque dresseur"
              describe={(r) => `${r.form || RUSH_STARTERS.find((p) => p.id === r.partnerId)?.name || ''} · niv. ${r.level}`}
              onMore={() => setPanel('board')}
            />
          )}
          footer="Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites animés : PMDCollab SpriteCollab (CC BY-NC 4.0) · Inspiré de Pokébonk et Megabonk."
        />
        {howto && (
          <div className="sw-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) setHowto(false); }}>
            <div className="sw-card is-panel prh-howto">
              <div className="sw-panel-head"><b className="sw-kicker">Comment jouer</b><button type="button" className="sw-btn is-small is-ghost" onClick={() => setHowto(false)}>Fermer</button></div>
              <div className="sw-panel-body">
                <p className="sw-panel-note">Une île de Kanto en 3D, envahie de Pokémon sauvages. Ton partenaire attaque tout seul : cours, saute, esquive, capture des sauvages qui se battront à tes côtés, et rejoins l’arène à 8:00 pour affronter le légendaire.</p>
                <div className="sw-howto">{RUSH_HOWTO(ult.name).map(([k, v]) => <span key={k}><b>{k}</b> {v}</span>)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'menu') {
    return (
      <div className="sw-root pr-root prh-wrap">
        <RushPickPage
          Sprite={PmdSprite}
          backdrop={<RushScene />}
          meta={meta}
          partnerId={partner.id}
          onPick={(p) => setPartnerId(p.id)}
          onBack={() => setScreen('home')}
          onNext={() => setScreen('prep')}
          onRecruit={() => setMeta(buyRushThing(meta, partner.id, partner.cost, 'starters'))}
        />
      </div>
    );
  }

  if (screen === 'prep') {
    return (
      <div className="sw-root pr-root prh-wrap">
        <RushPrepPage Sprite={PmdSprite} backdrop={<RushScene />} meta={meta} partner={partner} onStart={start} onBack={() => setScreen('menu')} />
      </div>
    );
  }

  const h = hud;
  const toFinal = h ? Math.max(0, FINAL_AT - h.t) : FINAL_AT;
  return (
    <div className="sw-root pr-root pr-play">
      <div ref={mountRef} className="pr-mount" />
      <canvas ref={overlayRef} className="pr-overlay" />
      {h && (
        <div className="sw-hud pr-hud">
          <div className="sw-xp"><b style={{ width: `${(h.xp / h.need) * 100}%` }} /><span>Niv. {h.level}</span></div>
          <div className="sw-top">
            <div className="sw-me">
              <PmdSprite dex={h.form.dex} size={46} scale={1.5} />
              <div>
                <strong>{h.form.name}</strong>
                <div className="sw-hp"><b style={{ width: `${(h.hp / h.maxHp) * 100}%` }} /><span>{Math.ceil(h.hp)} / {h.maxHp}</span></div>
              </div>
            </div>
            <div className="pr-center">
              <div className="sw-clock">{clock(h.t)}</div>
              <small className={h.finalSpawned ? 'is-hot' : ''}>{h.finalSpawned ? 'Le légendaire est dans l’arène !' : `Réveil du légendaire dans ${clock(toFinal)}`}</small>
            </div>
            <div className="pr-res">
              <span className="pr-chip is-coin" title="Poké Dollars : pour les coffres">{h.coins} ₽</span>
              <span className="pr-chip is-ball" title="Poké Balls">{h.balls}</span>
              <span className="pr-chip">{h.kills} K.O.</span>
            </div>
            <button type="button" className="sw-btn is-small" onClick={() => setPaused(true)}>Pause</button>
          </div>
          <div className="pr-team">
            {h.allies.map((a, i) => (
              <div key={`${a.id}-${i}`} className={`pr-ally${a.ko ? ' is-ko' : ''}${a.alpha ? ' is-alpha' : ''}`} title={a.name}>
                <PmdSprite dex={a.dex} size={36} scale={1.1} still={!!a.ko} />
                <div>
                  <b>{a.alpha ? 'Alpha ' : ''}{a.name}</b>
                  {a.ko ? <small>K.O. · {a.ko} s</small> : <i><em style={{ width: `${(a.hp / a.maxHp) * 100}%` }} /></i>}
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, h.maxAllies - h.allies.length) }, (_, i) => <div key={`e${i}`} className="pr-ally is-empty">Libre</div>)}
          </div>
          {h.missions?.length > 0 && (
            <div className={`sw-missions pr-missions${h.boss ? ' is-low' : ''}`}>
              <span className="sw-kicker">Missions</span>
              <Missions list={h.missions} compact />
            </div>
          )}
          {h.boss && (
            <div className="sw-boss">
              <strong>{h.boss.name}</strong> <span className="pr-types">{h.boss.types.map((t) => <TypeChip key={t} type={t} />)}</span>
              <div><b style={{ width: `${(h.boss.hp / h.boss.maxHp) * 100}%` }} /></div>
              <small className="pr-weak">Faible contre : {weaknessesOf(h.boss.types).join(', ') || '—'}</small>
            </div>
          )}
          {h.banner && <div key={h.banner} className="sw-banner">{h.banner}</div>}
          <div className="sw-loadout">
            {h.weapons.map((w) => (
              <span key={w.id} className="sw-slot" style={{ '--c': TYPE_COLORS[WEAPONS[w.id].type] || WEAPONS[w.id].color }} title={WEAPONS[w.id].name}>
                {WEAPONS[w.id].name}<span className="sw-pips">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < w.lv ? 'on' : ''} />)}</span>
              </span>
            ))}
          </div>
          <div className="pr-actions">
            <button type="button" className={`pr-act is-catch${h.canCatch && h.balls > 0 ? ' is-ready' : ''}`} onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.throwBall(); }}>
              <b>Capturer</b><small>F · {h.balls}</small>
            </button>
            <button type="button" className={`sw-ult pr-act${h.ult >= 1 ? ' is-ready' : ''}`} style={{ '--k': Math.min(1, h.ult), '--c': h.ultColor }} onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.ultimate(); }}>
              <b>Ultime</b><small>{h.ult >= 1 ? 'R : prêt !' : `${Math.floor(h.ult * 100)} %`}</small>
            </button>
            <button type="button" className={`sw-dash pr-act${h.dash >= 1 ? ' is-ready' : ''}`} style={{ '--k': Math.min(1, h.dash) }} onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.dash(); }}>
              <b>Esquive</b><small>Maj</small>
            </button>
            <button type="button" className="pr-act is-jump" onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.jump(true); }} onPointerUp={() => gameRef.current?.jump(false)}>
              <b>Saut</b><small>Espace</small>
            </button>
          </div>
        </div>
      )}
      {h?.evolving && <div className="pr-evo-tag">Quoi ? {h.form.name} évolue !</div>}

      {levelUp && !end && !altar && (
        <div className="sw-modal">
          <div className="sw-card is-deal">
            <span className="sw-kicker">Niveau {levelUp.level}</span>
            <h2>{levelUp.options[0]?.kind === 'evo' ? 'Choisis ton évolution' : 'Pioche une carte'}</h2>
            <div className="sw-choices is-tcg" key={levelUp.options.map((o) => o.kind + o.id + o.lv).join('|')}>
              {levelUp.options.map((opt, i) => (
                <TcgCard key={`${opt.kind}-${opt.id}`} opt={opt} partner={partner} formDex={hud?.form?.dex ?? partner.dex} index={i} onPick={choose} gen={1} megaLevels={hud?.megaLevels} />
              ))}
            </div>
            <div className="sw-actions" hidden={levelUp.options[0]?.kind === 'evo'}>
              <button type="button" className="sw-btn is-small" disabled={!levelUp.rerolls} onClick={reroll}>Relancer ({levelUp.rerolls})</button>
              <button type="button" className="sw-btn is-small is-ghost" onClick={() => choose({ kind: 'skip', id: 'skip', lv: 0 })}>Passer (+15 PV)</button>
            </div>
          </div>
        </div>
      )}

      {altar && !end && (
        <div className="sw-modal">
          <div className="sw-card is-altar">
            <span className="sw-kicker">Autel ancien</span>
            <h2>Choisis une bénédiction</h2>
            <div className="sw-blessings">
              {altar.map((b, i) => (
                <button key={b.id} type="button" className="sw-blessing" style={{ '--c': b.color, '--i': i }} onClick={() => bless(b.id)}>
                  <i aria-hidden="true" /><b>{b.name}</b><small>{b.id === 'fortune' ? '+40 ₽ et 2 Poké Balls tout de suite.' : b.desc}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {paused && !levelUp && !end && !altar && h && (
        <div className="sw-modal">
          <div className="sw-card is-pause">
            <h2 className="sw-pause-title">Pause</h2>
            <div className="sw-pause-main">
              {h.allies.length > 0 && (
                <>
                  <h3 className="pr-h3">Équipe</h3>
                  <div className="pr-team-recap">
                    {h.allies.map((a, i) => (
                      <div key={`${a.id}-${i}`} className="sw-tile">
                        <PmdSprite dex={a.dex} anim="idle" size={56} scale={1.6} />
                        <div><b>{a.alpha ? 'Alpha ' : ''}{a.name}</b><span className="pr-types">{a.types.map((t) => <TypeChip key={t} type={t} />)}</span></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <RunRecap h={h} partner={partner} />
            </div>
            <aside className="sw-pause-side">
              <MusicControls />
              <div className="sw-pause-actions">
                <button type="button" className="sw-btn is-go" onClick={() => setPaused(false)}>Reprendre</button>
                <button type="button" className="sw-btn" onClick={() => { setPaused(false); setScreen('home'); }}>Abandonner</button>
              </div>
              <small className="sw-pause-hint">Échap ou P pour reprendre</small>
            </aside>
          </div>
        </div>
      )}

      {end && (
        <div className="sw-modal">
          <div className={`sw-card is-end ${end.result === 'win' ? 'is-win' : 'is-lose'}`}>
            <PmdSprite dex={end.form.dex} anim={end.result === 'win' ? 'idle' : 'hurt'} size={120} scale={3} />
            <h2>{end.result === 'win' ? 'Le légendaire est K.O. !' : `${end.form.name} est K.O.`}</h2>
            <p>{clock(end.t)} · niveau {end.level} · {end.kills} K.O. · {end.caught.length} capture{end.caught.length > 1 ? 's' : ''}</p>
            {end.caught.length > 0 && (
              <div className="pr-caught">
                {end.caught.slice(0, 12).map((id, i) => <PmdSprite key={`${id}-${i}`} dex={FOES[id].dex} anim="idle" size={44} scale={1.3} still />)}
              </div>
            )}
            <ScoreCard score={end.score} best={end.reward.prevScore} />
            {end.missions?.length > 0 && <div className="sw-end-missions"><Missions list={end.missions} compact /></div>}
            <div className="sw-reward">
              <ul>{end.reward.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{l.v} PL</b></li>)}</ul>
              <div className="sw-reward-total"><span>Total</span><b>+{end.reward.earned} PL</b><small>Tu as maintenant {meta.pl.toLocaleString('fr-FR')} PL</small></div>
            </div>
            <div className="sw-actions">
              <button type="button" className="sw-btn is-go" onClick={start}>Rejouer</button>
              <button type="button" className="sw-btn" onClick={() => setScreen('menu')}>Changer de partenaire</button>
              <button type="button" className="sw-btn is-ghost" onClick={() => setScreen('home')}>Accueil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokeRush;
