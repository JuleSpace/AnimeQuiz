import React, { useEffect, useRef, useState } from 'react';
import { createRush } from './rushEngine';
import {
  FINAL_AT, FOE_TYPES, MAX_ALLIES, RUSH_ITEMS, RUSH_MOVES, RUSH_STARTERS, TYPE_COLORS, UPGRADES, buyRushThing, buyUpgrade,
  loadRush, recordRush, saveRush, rushEffects, rushPool, starterOpen, upCost, upRank, weaknessesOf
} from './rushData';
import { FOES, WEAPONS, ultimateOf } from './swarmData';
import { Missions, MusicControls, PmdSprite, RunRecap, TcgCard } from './PokeSwarm';
import { musicPlayer } from './pokeArenaMusic';
import { AccountChip, Leaderboard, postRun, useCloudSync } from './account';
import './PokeSwarm.css';
import './PokeRush.css';

export const RUSH_HASH = '#pokerush';
const MUSIC_KEY = 'poke-arena-music';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const TypeChip = ({ type }) => <span className="pr-type" style={{ '--c': TYPE_COLORS[type] || '#999' }}>{type}</span>;

/** Boutique, Pokédex des captures, historique. */
const RushPanel = ({ tab, setTab, meta, setMeta, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const pool = rushPool(1);
  const dexIds = [...pool.t1, ...pool.t2, ...pool.t3, ...pool.minis, ...pool.finals];
  const caughtN = dexIds.filter((id) => meta.caught[id]).length;
  return (
    <div className="sw-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sw-card is-panel">
        <div className="sw-panel-head">
          <div className="sw-tabs" role="tablist">
            {[['shop', 'Centre Pokémon'], ['dex', `Pokédex ${caughtN}/${dexIds.length}`], ['history', 'Historique'], ['board', 'Classement']].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <span className="sw-dust pr-pl">{meta.pl.toLocaleString('fr-FR')} PL</span>
          <button type="button" className="sw-btn is-small is-ghost" onClick={onClose}>Fermer</button>
        </div>
        <div className="sw-panel-body">
          {tab === 'shop' && (
            <>
              <p className="sw-panel-note">Les Points de Ligue (PL) se gagnent à chaque partie du Poké Rush. Ils ne servent qu’ici : rien n’est partagé avec le Swarm.</p>
              <h3 className="pr-h3">Entraînement</h3>
              <div className="sw-shop">
                {UPGRADES.map((u) => {
                  const r = upRank(meta, u.id); const maxed = r >= u.max; const cost = upCost(meta, u);
                  return (
                    <div key={u.id} className={`sw-shop-item${maxed ? ' is-owned' : ''}`} style={{ '--c': '#ffd447' }}>
                      <div className="sw-tile-top"><b>{u.name}</b><small>{r}/{u.max}</small></div>
                      <p>{u.desc(Math.max(1, r + (maxed ? 0 : 1)))}</p>
                      <button type="button" className="sw-btn is-small" disabled={maxed || meta.pl < cost} onClick={() => setMeta(buyUpgrade(meta, u.id))}>{maxed ? 'Maximum' : `${cost} PL`}</button>
                    </div>
                  );
                })}
              </div>
              <h3 className="pr-h3">Capacités à apprendre</h3>
              <div className="sw-shop">
                {RUSH_MOVES.map((mv) => {
                  const own = !!meta.unlocks[mv.id];
                  return (
                    <div key={mv.id} className={`sw-shop-item${own ? ' is-owned' : ''}`} style={{ '--c': TYPE_COLORS[mv.type] || mv.color }}>
                      <div className="sw-tile-top"><b>{mv.name}</b><TypeChip type={mv.type} /></div>
                      <p>{mv.desc}</p>
                      <button type="button" className="sw-btn is-small" disabled={own || meta.pl < mv.cost} onClick={() => setMeta(buyRushThing(meta, mv.id, mv.cost))}>{own ? 'Apprise' : `${mv.cost} PL`}</button>
                    </div>
                  );
                })}
                {RUSH_ITEMS.map((it) => {
                  const own = !!meta.unlocks[it.id];
                  return (
                    <div key={it.id} className={`sw-shop-item${own ? ' is-owned' : ''}`} style={{ '--c': it.color }}>
                      <div className="sw-tile-top"><b>{it.name}</b><small>Objet</small></div>
                      <p>{it.desc}</p>
                      <button type="button" className="sw-btn is-small" disabled={own || meta.pl < it.cost} onClick={() => setMeta(buyRushThing(meta, it.id, it.cost))}>{own ? 'Débloqué' : `${it.cost} PL`}</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tab === 'dex' && (
            <>
              <p className="sw-panel-note">Les Pokémon capturés pendant tes parties. Affaiblis un sauvage (PV rouges), puis lance une Poké Ball avec F ou le bouton « Capturer ».</p>
              <div className="pr-dex">
                {dexIds.map((id) => {
                  const f = FOES[id]; const n = meta.caught[id] || 0; const seen = meta.seen[id];
                  const types = FOE_TYPES[id] || ['Normal'];
                  return (
                    <div key={id} className={`pr-dex-cell${n ? ' is-caught' : seen ? ' is-seen' : ''}`}>
                      <PmdSprite dex={f.dex} anim="idle" size={64} scale={1.6} still />
                      <b>{n || seen ? f.name : '???'}</b>
                      {(n > 0 || seen) && <span className="pr-types">{types.map((t) => <TypeChip key={t} type={t} />)}</span>}
                      <small>{n ? `${n} capturé${n > 1 ? 's' : ''}` : seen ? 'Aperçu' : 'Inconnu'}</small>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tab === 'board' && <Leaderboard game="rush" partnerName={(id) => RUSH_STARTERS.find((p) => p.id === id)?.name || id} />}
          {tab === 'history' && (
            (meta.history || []).length ? (
              <div className="sw-history">
                {meta.history.map((r) => {
                  const pt = RUSH_STARTERS.find((x) => x.id === r.partnerId);
                  return (
                    <div key={r.at} className={`sw-hist${r.result === 'win' ? ' is-win' : ''}`}>
                      {pt && <PmdSprite dex={r.form?.dex || pt.dex} anim="idle" size={48} scale={1.5} still />}
                      <div>
                        <b>{r.form?.name || pt?.name} · {r.result === 'win' ? 'Victoire' : 'K.O.'}</b>
                        <small>{clock(r.t)} · niv. {r.level} · {r.kills} K.O. · {r.caught} capture{r.caught > 1 ? 's' : ''}</small>
                      </div>
                      <time>{new Date(r.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
                    </div>
                  );
                })}
              </div>
            ) : <p className="sw-panel-note">Aucune partie pour l’instant.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const PokeRush = ({ onClose }) => {
  const [screen, setScreen] = useState('menu');
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
  const open = starterOpen(meta, partner);
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
        const rec = recordRush(metaRef.current, {
          result, t: snap.t, kills: snap.kills, level: snap.level, caught: snap.caught, met: snap.met, bosses: snap.bosses,
          missions: snap.missions.filter((m) => m.done).length, partnerId: partner.id, form: snap.form
        });
        setMeta(rec.meta);
        setEnd({ result, ...snap, reward: rec });
        postRun('rush', {
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

  if (screen === 'menu') {
    const pool = rushPool(1);
    return (
      <div className="sw-root sw-menu pr-root pr-menu">
        <div className="sw-backdrop pr-sky" aria-hidden="true"><i /><i /><i /></div>
        <header className="sw-head">
          <div>
            <span className="sw-kicker">Mode secret · 3D</span>
            <h1>Poké Rush</h1>
            <p>Une île de Kanto en 3D, envahie de Pokémon sauvages. Ton partenaire attaque tout seul : cours, saute, esquive, capture des sauvages qui se battront à tes côtés, et rejoins l’arène à 8:00 pour affronter le légendaire.</p>
          </div>
          <div className="sw-head-side">
            <AccountChip returnHash="#pokerush" compact />
            <span className="sw-dust pr-pl" title="Points de Ligue : propres au Poké Rush">{meta.pl.toLocaleString('fr-FR')} PL</span>
            <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
          </div>
        </header>
        <div className="sw-metabar">
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('shop')}>Centre Pokémon <small>améliorations</small></button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('dex')}>Pokédex <small>{Object.keys(meta.caught).length} capturés</small></button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('board')}>Classement <small>en ligne</small></button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('history')}>Historique <small>{(meta.history || []).length}</small></button>
        </div>
        <div className="sw-pool">
          <div>
            <span className="sw-kicker">Légendaires de l’arène</span>
            <div className="sw-pool-row">
              {pool.finals.map((id) => (
                <span key={id} className={`sw-pool-mon${meta.caught[id] ? ' is-beaten' : ''}`} title={`${FOES[id].name} · faible contre ${weaknessesOf(FOE_TYPES[id]).join(', ')}`}>
                  <PmdSprite dex={FOES[id].dex} anim="idle" size={52} scale={0.7} foot={0.9} still />
                  <small>{FOES[id].name}</small>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="sw-kicker">Boss possibles</span>
            <div className="sw-pool-row">
              {pool.minis.map((id) => (
                <span key={id} className="sw-pool-mon" title={`${FOES[id].name} · faible contre ${weaknessesOf(FOE_TYPES[id]).join(', ')}`}>
                  <PmdSprite dex={FOES[id].dex} anim="idle" size={52} scale={0.7} foot={0.9} still />
                  <small>{FOES[id].name}</small>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="sw-partners">
          {RUSH_STARTERS.map((p) => {
            const ok = starterOpen(meta, p);
            const rec = meta.best[p.id];
            return (
              <button key={p.id} type="button" className={`sw-partner${p.id === partnerId ? ' is-on' : ''}${ok ? '' : ' is-locked-mon'}`} style={{ '--c': p.color }}
                onClick={() => setPartnerId(p.id)} onDoubleClick={() => { if (ok) { setPartnerId(p.id); start(); } }} aria-pressed={p.id === partnerId}>
                <PmdSprite dex={p.dex} anim={p.id === partnerId ? 'walk' : 'idle'} size={112} scale={3} />
                <strong>{ok ? '' : '🔒 '}{p.name}</strong>
                <span className="sw-type">{p.type}</span>
                <span className="sw-attack">{WEAPONS[p.weapon].name}</span>
                <small>{p.type === 'Eau' ? 'Nage : traverse la rivière et le lac.' : p.id === 'charmander' ? 'Dracaufeu vole : il survole l’eau.' : p.blurb}</small>
                <span className="sw-stats">{p.hp} PV · vitesse {p.speed.toFixed(1)}</span>
                {rec && <span className={`sw-record${rec.win ? ' is-win' : ''}`}>{rec.win ? `Victoire en ${clock(rec.t)}` : `Record : ${clock(rec.t)}`}</span>}
              </button>
            );
          })}
        </div>
        <div className="sw-howto">
          <span><b>Bouger</b> ZQSD / WASD · caméra à la souris (clic) ou en glissant à droite de l’écran</span>
          <span><b>Sauter</b> Espace : les falaises se franchissent en sautant</span>
          <span><b>Esquive</b> Maj : un bond rapide, invincible</span>
          <span><b>Capturer</b> F : PV rouges = capturable, il se bat ensuite avec toi ({MAX_ALLIES} max)</span>
          <span><b>Types</b> les attaques super efficaces font ×2, les mauvaises ×0,5</span>
          <span><b>Ultime</b> R : {ult.name}</span>
          <span><b>Hautes herbes</b> des Pokémon Alpha s’y cachent vers 2:00 et 5:00</span>
          <span><b>Eau</b> seuls les types Eau et Vol s’y aventurent</span>
          <span><b>Coffres</b> payés en Poké Dollars ₽, ramassés sur les sauvages</span>
          <span><b>Arène</b> à 8:00, le légendaire s’y réveille : bats-le pour gagner</span>
        </div>
        {open
          ? <button type="button" className="sw-btn is-go" onClick={start}>Partir avec {partner.name}</button>
          : <button type="button" className="sw-btn is-go is-unlock" disabled={meta.pl < partner.cost} onClick={() => setMeta(buyRushThing(meta, partner.id, partner.cost, 'starters'))}>
            {meta.pl < partner.cost ? `${partner.name} : ${partner.cost} PL (il t’en manque ${partner.cost - meta.pl})` : `Recruter ${partner.name} : ${partner.cost} PL`}
          </button>}
        {panel && <RushPanel tab={panel} setTab={setPanel} meta={meta} setMeta={setMeta} onClose={() => setPanel(null)} />}
        <p className="sw-credit">Sprites animés : PMDCollab SpriteCollab (CC BY-NC 4.0) · Pokémon © Nintendo / Game Freak · Inspiré de Pokébonk et Megabonk</p>
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
                <button type="button" className="sw-btn" onClick={() => { setPaused(false); setScreen('menu'); }}>Abandonner</button>
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
            {end.missions?.length > 0 && <div className="sw-end-missions"><Missions list={end.missions} compact /></div>}
            <div className="sw-reward">
              <ul>{end.reward.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{l.v} PL</b></li>)}</ul>
              <div className="sw-reward-total"><span>Total</span><b>+{end.reward.earned} PL</b><small>Tu as maintenant {meta.pl.toLocaleString('fr-FR')} PL</small></div>
            </div>
            <div className="sw-actions">
              <button type="button" className="sw-btn is-go" onClick={start}>Rejouer</button>
              <button type="button" className="sw-btn" onClick={() => setScreen('menu')}>Menu</button>
              <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokeRush;
