import React, { useEffect, useRef, useState } from 'react';
import { createGame } from './swarmEngine';
import { buildWorld } from './swarmWorld';
import { drawPokemon, preloadSprites } from './swarmSprites';
import { FOES, GENS, GEN_BOSSES, GEN_WAVES, MAX_LEVEL, MEGA_LEVELS, PARTNERS, PASSIVES, WEAPONS } from './swarmData';
import {
  ACHIEVEMENTS, ALL_FOE_IDS, BRANCHES, REGION_COST, TALENTS, TIER_NEEDS, branchPoints, buyTalent, dailyChallenge,
  loadMeta, metaEffects, rankOf, recordRun, refundAll, talentCost, talentLocked, unlockRegion
} from './swarmMeta';
import { musicPlayer } from './pokeArenaMusic';
import './PokeSwarm.css';

export const SWARM_HASH = '#swarm';
const BEST_KEY = 'poke-swarm-best';
const GEN_KEY = 'poke-swarm-gen';
const MUSIC_KEY = 'poke-arena-music';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const readBest = () => {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch { return {}; }
};

const optionLabel = (opt, partner, ML = MEGA_LEVELS) => {
  if (opt.kind === 'mega' && partner?.mega) {
    return {
      title: partner.mega.stone,
      tag: opt.lv >= ML ? 'Méga-Évolution !' : `Méga-Gemme ${opt.lv}/${ML}`,
      desc: opt.lv >= ML ? `${partner.mega.name} : +30 % de dégâts, plus rapide, PV max +60 et soin complet.` : `Rapproche de la Méga-Évolution (+4 % de dégâts). Au niveau ${ML} : ${partner.mega.name} !`,
      color: '#ff6ad5',
      type: 'Méga',
      mega: true
    };
  }
  if (opt.kind === 'weapon') {
    const W = WEAPONS[opt.id];
    return { title: W.name, tag: opt.lv === 1 ? 'Nouvelle attaque' : `Niveau ${opt.lv}`, desc: W.desc(opt.lv), color: W.color, type: W.type };
  }
  if (opt.kind === 'passive') {
    const P = PASSIVES[opt.id];
    return { title: P.name, tag: opt.lv === 1 ? 'Nouvel objet' : `Niveau ${opt.lv}`, desc: P.desc, color: P.color, type: 'Objet' };
  }
  return { title: 'Baie Oran', tag: 'Soin', desc: 'Récupère 30 PV.', color: '#3d7bdb', type: 'Baie' };
};

/** Petit Pokémon animé (planches Donjon Mystère) dessiné dans un canvas. */
const PmdSprite = ({ dex, anim = 'idle', size = 96, scale = 3, dir = 0, still = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    preloadSprites([dex]);
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    const x = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, size, size);
      const drawn = drawPokemon(x, dex, anim, still ? 0 : (now - t0) / 1000, dir, size / 2, size * 0.8, scale);
      if (!(still && drawn)) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dex, anim, size, scale, dir, still]);
  return <canvas ref={ref} className="sw-pmd" style={{ width: size, height: size }} />;
};

/** Fond du menu : la vraie carte, qui défile lentement. */
const MenuBackdrop = ({ world }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !world) return undefined;
    const x = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      const w = c.clientWidth; const h = c.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const t = (now - t0) / 1000;
      const cx = world.plaza.x + Math.cos(t / 40) * 700;
      const cy = world.plaza.y - 250 + Math.sin(t / 40) * 420;
      const zoom = Math.max(1, Math.min(w / 1100, h / 760) * 1.1);
      const vw = w / zoom; const vh = h / zoom;
      const x0 = cx - vw / 2; const y0 = cy - vh / 2;
      x.setTransform(dpr * zoom, 0, 0, dpr * zoom, -x0 * dpr * zoom, -y0 * dpr * zoom);
      world.drawGround(x, x0 - 20, y0 - 20, vw + 40, vh + 40);
      world.propsIn(x0 - 60, y0 - 40, x0 + vw + 60, y0 + vh + 200).sort((a, b) => a.y - b.y).forEach((p) => world.drawProp(x, p, t));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [world]);
  return <canvas ref={ref} className="sw-backdrop" />;
};

/* ——— Cartes de bonus façon jeu de cartes à collectionner ——— */
const TYPE_COLORS = {
  Électrik: '#f7d02c', Feu: '#ee8130', Eau: '#6390f0', Plante: '#7ac74c', Sol: '#d9b25a', Normal: '#b8b48a',
  Spectre: '#8a6bc4', Ténèbres: '#6b5a4c', Combat: '#d2513f', Objet: '#9fb3d6', Baie: '#4f8fe0', Méga: '#ff6ad5'
};
const ITEM_SLUG = {
  protein: 'protein', carbos: 'carbos', hpup: 'hp-up', magnet: 'magnet', quickclaw: 'quick-claw', leftovers: 'leftovers', scope: 'scope-lens'
};
const itemSprite = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
// numéro « de collection » stable pour chaque carte
const cardNo = (id) => (([...String(id)].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 150) + 1);

const TcgCard = ({ opt, partner, formDex, index, onPick, gen, megaLevels = MEGA_LEVELS }) => {
  const MEGA_LEVELS = megaLevels; // eslint-disable-line no-shadow
  const l = optionLabel(opt, partner, megaLevels);
  const type = l.type;
  const tc = TYPE_COLORS[type] || l.color;
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);
  const rarity = opt.kind === 'mega' ? 'ultra' : (opt.kind === 'weapon' && opt.lv >= MAX_LEVEL) || (opt.kind === 'passive' && opt.lv >= MAX_LEVEL) ? 'rare' : opt.lv === 1 ? 'common' : 'uncommon';
  const holo = rarity === 'rare' || rarity === 'ultra';
  let power = null;
  if (opt.kind === 'weapon') {
    const v = WEAPONS[opt.id].at(opt.lv);
    power = v.dmg ? Math.round(v.dmg) : v.dps ? `${Math.round(v.dps)}/s` : null;
  }
  const kindLabel = opt.kind === 'weapon' ? 'Attaque' : opt.kind === 'passive' ? 'Objet' : opt.kind === 'mega' ? 'Méga-Gemme' : 'Baie';
  const tilt = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  };
  let art;
  if (opt.kind === 'weapon') art = <PmdSprite dex={formDex} anim={['quake', 'bite', 'leafblade', 'doublekick', 'machpunch'].includes(opt.id) ? 'attack' : 'shoot'} size={118} scale={2.6} dir={1} />;
  else if (opt.kind === 'mega') art = <PmdSprite dex={opt.lv >= MEGA_LEVELS ? partner.mega.sprite : formDex} anim="idle" size={118} scale={2.6} />;
  else {
    const slug = opt.kind === 'passive' ? ITEM_SLUG[opt.id] : 'oran-berry';
    art = failed
      ? <span className="tcg-glyph">{l.title.slice(0, 2)}</span>
      : <img src={itemSprite(slug)} alt="" className="tcg-item" onError={() => setFailed(true)} />;
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`tcg is-${rarity}${holo ? ' is-holo' : ''}`}
      style={{ '--tc': tc, '--i': index }}
      onClick={() => onPick(opt)}
      onPointerMove={tilt}
      onPointerLeave={reset}
    >
      <span className="tcg-inner">
        <span className="tcg-face tcg-front">
          <span className="tcg-head">
            <b>{l.title}</b>
            <span className="tcg-lv">{opt.kind === 'mega' ? `${Math.min(opt.lv, MEGA_LEVELS)}/${MEGA_LEVELS}` : opt.lv ? `Niv. ${opt.lv}` : ''}<i className="tcg-energy">{type.slice(0, 1)}</i></span>
          </span>
          <span className="tcg-art">{art}</span>
          <span className="tcg-strip">{opt.kind === 'weapon' ? `Attaque ${type}` : opt.kind === 'mega' ? l.tag : kindLabel}</span>
          {opt.lv === 1 && opt.kind !== 'mega' && <span className="tcg-new">Nouveau !</span>}
          <span className="tcg-text">
            <span className="tcg-move"><b>{l.title}</b>{power !== null && <em>{power}</em>}</span>
            <span className="tcg-desc">{l.desc}</span>
          </span>
          <span className="tcg-foot">
            <span>{['', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh'][gen] || 'Swarm'} · {String(cardNo(`${opt.kind}${opt.id}`)).padStart(3, '0')}/151</span>
            <span className="tcg-rarity">{rarity === 'ultra' ? '★★' : rarity === 'rare' ? '★' : rarity === 'uncommon' ? '◆' : '●'}</span>
          </span>
          {holo && <span className="tcg-shine" aria-hidden="true" />}
        </span>
        <span className="tcg-face tcg-back" aria-hidden="true"><span>SWARM</span></span>
      </span>
    </button>
  );
};

const Pips = ({ lv }) => (
  <span className="sw-pips">
    {Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}
  </span>
);

const FOE_GEN = (() => {
  const out = {};
  Object.entries(GEN_WAVES).forEach(([g, waves]) => waves.forEach((w) => w.foes.forEach((id) => { if (!out[id]) out[id] = Number(g); })));
  Object.entries(GEN_BOSSES).forEach(([g, list]) => list.forEach((b) => { if (!out[b.id]) out[b.id] = Number(g); }));
  return out;
})();

/** Panneaux de progression : talents, défis, Pokédex. */
const MetaPanel = ({ panel, meta, setMeta, onClose }) => {
  const [tab, setTab] = useState(panel);
  useEffect(() => setTab(panel), [panel]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const seen = ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length;
  return (
    <div className="sw-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sw-card is-panel">
        <div className="sw-panel-head">
          <div className="sw-tabs" role="tablist">
            {[['talents', 'Talents'], ['achievements', `Défis ${Object.keys(meta.achievements).length}/${ACHIEVEMENTS.length}`], ['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`]].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <span className="sw-dust">✦ {meta.dust.toLocaleString('fr-FR')}</span>
          <button type="button" className="sw-btn is-small is-ghost" onClick={onClose}>Fermer</button>
        </div>

        {tab === 'talents' && (
          <>
            <p className="sw-panel-note">Chaque talent acheté rend tous les suivants un peu plus chers. Les paliers se débloquent avec {TIER_NEEDS[1]} puis {TIER_NEEDS[2]} points dans la branche.</p>
            <div className="sw-tree">
              {BRANCHES.map((b) => (
                <div key={b.id} className="sw-branch" style={{ '--c': b.color }}>
                  <h3>{b.name}<small>{branchPoints(meta, b.id)} pts</small></h3>
                  {[0, 1, 2].map((tier) => (
                    <div key={tier} className="sw-tier">
                      {TALENTS.filter((t) => t.branch === b.id && t.tier === tier).map((t) => {
                        const r = rankOf(meta, t.id);
                        const maxed = r >= t.max;
                        const locked = talentLocked(meta, t);
                        const cost = talentCost(meta, t);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`sw-talent${maxed ? ' is-max' : ''}${locked ? ' is-locked' : ''}${r ? ' is-owned' : ''}`}
                            disabled={maxed || locked || meta.dust < cost}
                            onClick={() => setMeta(buyTalent(meta, t.id))}
                          >
                            <span className="sw-talent-top"><b>{t.name}</b><i>{r}/{t.max}</i></span>
                            <span className="sw-talent-desc">{r ? t.desc(r) : t.desc(1)}</span>
                            {!maxed && r > 0 && <span className="sw-talent-next">Ensuite : {t.desc(r + 1)}</span>}
                            <span className="sw-talent-cost">
                              {maxed ? 'Maximum' : locked ? `${branchPoints(meta, t.branch)}/${TIER_NEEDS[t.tier]} pts dans la branche` : `${cost} ✦`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="sw-actions">
              <button type="button" className="sw-btn is-small is-ghost" disabled={!meta.spent} onClick={() => setMeta(refundAll(meta))}>Tout rembourser ({meta.spent || 0} ✦)</button>
            </div>
          </>
        )}

        {tab === 'achievements' && (
          <div className="sw-achs">
            {ACHIEVEMENTS.map((a) => {
              const done = meta.achievements[a.id];
              return (
                <div key={a.id} className={`sw-ach${done ? ' is-done' : ''}`}>
                  <i>{done ? '★' : '☆'}</i>
                  <div><b>{a.name}</b><small>{a.desc}</small></div>
                  <span>{done ? 'Réussi' : `+${a.reward} ✦`}</span>
                </div>
              );
            })}
            <p className="sw-panel-note">Parties jouées : {meta.runs || 0} · K.O. au total : {(meta.kills || 0).toLocaleString('fr-FR')} · Poussière gagnée au total : {(meta.totalDust || 0).toLocaleString('fr-FR')} ✦</p>
          </div>
        )}

        {tab === 'dex' && (
          <div className="sw-dex">
            {GENS.map((gn) => (
              <section key={gn.id}>
                <h3>{gn.name}</h3>
                <div className="sw-dex-grid">
                  {ALL_FOE_IDS.filter((id) => FOE_GEN[id] === gn.id).map((id) => {
                    const n = meta.dex[id] || 0;
                    const f = FOES[id];
                    return (
                      <div key={id} className={`sw-dex-cell${n ? '' : ' is-unseen'}${f.boss ? ' is-boss' : ''}`} title={n ? f.name : '???'}>
                        <PmdSprite dex={f.dex} anim="idle" size={64} scale={f.boss ? 1.2 : 1.8} still />
                        <b>{n ? f.name : '???'}</b>
                        <small>{n ? `${n.toLocaleString('fr-FR')} K.O.` : 'Jamais vaincu'}</small>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PokeSwarm = ({ onClose }) => {
  const [screen, setScreen] = useState('menu');
  const [gen, setGen] = useState(() => {
    try { return Number(localStorage.getItem(GEN_KEY)) || 1; } catch { return 1; }
  });
  const starters = PARTNERS.filter((p) => p.gen === gen);
  const [partnerId, setPartnerId] = useState(PARTNERS[0].id);
  const [hud, setHud] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState(null);
  const [best, setBest] = useState(readBest);
  const [run, setRun] = useState(0);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [world, setWorld] = useState(null);
  const [meta, setMetaState] = useState(loadMeta);
  const metaRef = useRef(meta);
  const setMeta = (m) => { metaRef.current = m; setMetaState(m); };
  const [panel, setPanel] = useState(null);
  const dailyRef = useRef(null);
  const daily = dailyChallenge();
  const dailyPartner = PARTNERS.find((p) => p.id === daily.partnerId);
  const dailyDone = Boolean(meta.daily[daily.key]);

  // La carte se génère une fois le menu affiché (pour ne pas bloquer l'ouverture).
  useEffect(() => {
    if (world) return undefined;
    const id = setTimeout(() => setWorld(buildWorld()), 60);
    return () => clearTimeout(id);
  }, [world]);

  const partner = starters.find((p) => p.id === partnerId) || starters[0];
  const pickGen = (id) => {
    setGen(id);
    setPartnerId(PARTNERS.find((p) => p.gen === id)?.id);
    try { localStorage.setItem(GEN_KEY, String(id)); } catch { /* stockage indisponible */ }
  };
  const finalBoss = FOES[GEN_BOSSES[gen][GEN_BOSSES[gen].length - 1].id];

  // Musique : la playlist d'Arena, au même volume.
  useEffect(() => {
    const player = musicPlayer();
    let vol = 0.5;
    try {
      const raw = localStorage.getItem(MUSIC_KEY);
      if (raw !== null) vol = Number(raw);
    } catch { /* stockage indisponible */ }
    player.setVolume(Number.isFinite(vol) ? vol : 0.5);
    player.setMode('main');
    return () => player.stop();
  }, []);

  useEffect(() => {
    if (screen !== 'play' || !canvasRef.current) return undefined;
    const game = createGame(canvasRef.current, partner, {
      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),
      onEnd: (result, snap) => {
        const rec = recordRun(metaRef.current, {
          t: snap.t, kills: snap.kills, level: snap.level, bosses: snap.bosses, result, daily: dailyRef.current,
          killsBy: snap.killsBy, partnerId: partner.id, gen, reachedFinal: snap.reachedFinal, mega: snap.isMega,
          maxWeapon: snap.maxWeapon, weapons: snap.weaponCount, passives: snap.passiveCount,
          rocks: snap.rocks, noHit: snap.noHit, dashes: snap.dashes
        });
        setMeta(rec.meta);
        setEnd({ result, ...snap, reward: rec });
        setBest((prev) => {
          const mine = prev[partner.id] || {};
          const better = result === 'win'
            ? { win: true, t: Math.min(mine.win ? mine.t : Infinity, snap.t), kills: Math.max(mine.kills || 0, snap.kills) }
            : mine.win ? mine : { win: false, t: Math.max(mine.t || 0, snap.t), kills: Math.max(mine.kills || 0, snap.kills) };
          const next = { ...prev, [partner.id]: better };
          try { localStorage.setItem(BEST_KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
          return next;
        });
      },
      onPauseKey: () => setPaused((v) => !v)
    }, world, gen, metaEffects(metaRef.current, dailyRef.current?.mod));
    gameRef.current = game;
    const timer = setInterval(() => setHud(game.snapshot()), 100);
    return () => {
      clearInterval(timer);
      game.destroy();
      gameRef.current = null;
    };
  }, [screen, run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end));
  }, [paused, levelUp, end]);

  const start = (dly = null) => {
    dailyRef.current = dly && dly.key ? dly : null;
    setPanel(null);
    setEnd(null);
    setLevelUp(null);
    setPaused(false);
    setHud(null);
    setRun((n) => n + 1);
    setScreen('play');
  };

  const playDaily = () => {
    setGen(daily.gen);
    setPartnerId(daily.partnerId);
    start(daily);
  };
  const unlocked = Boolean(meta.regions[gen]);

  const choose = (opt) => {
    setLevelUp(null);
    gameRef.current?.choose(opt);
  };
  const reroll = () => {
    const options = gameRef.current?.reroll();
    if (options) setLevelUp((cur) => ({ ...cur, options, rerolls: cur.rerolls - 1 }));
  };

  if (screen === 'menu') {
    return (
      <div className="sw-root sw-menu">
        <MenuBackdrop world={world} />
        <header className="sw-head">
          <div>
            <span className="sw-kicker">Mode secret</span>
            <h1>Poké Swarm</h1>
            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats {finalBoss.name}. Tes attaques partent toutes seules : à toi de bouger et de bien choisir tes bonus.</p>
          </div>
          <div className="sw-head-side">
            <span className="sw-dust" title="Poussière Étoile : gagnée à chaque partie">✦ {meta.dust.toLocaleString('fr-FR')}</span>
            <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
          </div>
        </header>
        <div className="sw-metabar">
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('talents')}>
            Talents <small>{Object.values(meta.talents).reduce((a, b) => a + b, 0)} pts</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('achievements')}>
            Défis <small>{Object.keys(meta.achievements).length}/{ACHIEVEMENTS.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('dex')}>
            Pokédex <small>{ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length}/{ALL_FOE_IDS.length}</small>
          </button>
          <div className={`sw-daily${dailyDone ? ' is-done' : ''}`}>
            <PmdSprite dex={dailyPartner.dex} anim="idle" size={44} scale={1.4} />
            <div>
              <span className="sw-kicker">Défi du jour · {daily.mod.name}</span>
              <small>{dailyPartner.name} · {GENS.find((g) => g.id === daily.gen)?.name} · {daily.mod.desc}</small>
            </div>
            <button type="button" className="sw-btn is-small" onClick={playDaily}>{dailyDone ? 'Rejouer' : 'Jouer (+200 ✦)'}</button>
          </div>
        </div>
        <div className="sw-gens" role="tablist" aria-label="Génération">
          {GENS.map((gn) => {
            const open = meta.regions[gn.id];
            return (
              <button key={gn.id} type="button" role="tab" aria-selected={gn.id === gen} className={`sw-gen${gn.id === gen ? ' is-on' : ''}${open ? '' : ' is-locked'}`} onClick={() => pickGen(gn.id)}>
                <b>{open ? '' : '🔒 '}{gn.name}</b><small>{open ? gn.label : `${REGION_COST[gn.id]} ✦ pour débloquer`}</small>
              </button>
            );
          })}
        </div>
        <div className={`sw-partners${unlocked ? '' : ' is-locked'}`}>
          {starters.map((p) => {
            const rec = best[p.id];
            return (
              <button
                key={p.id}
                type="button"
                className={`sw-partner${p.id === partnerId ? ' is-on' : ''}`}
                style={{ '--c': p.color }}
                onClick={() => setPartnerId(p.id)}
                onDoubleClick={() => { if (unlocked) { setPartnerId(p.id); start(); } }}
                aria-pressed={p.id === partnerId}
              >
                <PmdSprite dex={p.dex} anim={p.id === partnerId ? 'walk' : 'idle'} size={112} scale={3} />
                <strong>{p.name}</strong>
                <span className="sw-type">{p.type}</span>
                <span className="sw-attack">{WEAPONS[p.weapon].name}</span>
                <small>{p.blurb}</small>
                <span className="sw-stats">{p.hp} PV · vitesse {p.speed.toFixed(1)}{p.mega ? ' · Méga' : ''}</span>
                {rec && (
                  <span className={`sw-record${rec.win ? ' is-win' : ''}`}>
                    {rec.win ? `Victoire en ${clock(rec.t)}` : `Record : ${clock(rec.t)}`} · {rec.kills} K.O.
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="sw-howto">
          <span><b>Bouger</b> ZQSD, WASD ou flèches · au doigt, glisse sur l'écran</span>
          <span><b>Esquive</b> Espace ou Maj : un bond rapide, invincible pendant le saut</span>
          <span><b>Pause</b> Échap ou P</span>
          <span><b>Bonbons</b> ramasse l'XP pour monter de niveau et choisir un bonus</span>
          <span><b>Rochers fissurés</b> casse-les : baies, aimants et Super Bonbons</span>
          <span><b>Boss</b> les zones rouges au sol vont exploser : sors-en !</span>
          <span><b>Méga</b> une fois la dernière forme atteinte, prends 3 fois la Méga-Gemme au level-up</span>
        </div>
        {unlocked
          ? <button type="button" className="sw-btn is-go" onClick={() => start()}>Partir avec {partner.name}</button>
          : (
            <button type="button" className="sw-btn is-go is-unlock" disabled={meta.dust < REGION_COST[gen]} onClick={() => setMeta(unlockRegion(meta, gen))}>
              {meta.dust < REGION_COST[gen] ? `Région verrouillée : ${REGION_COST[gen]} ✦ (il t'en manque ${REGION_COST[gen] - meta.dust})` : `Débloquer ${GENS.find((g) => g.id === gen)?.name} : ${REGION_COST[gen]} ✦`}
            </button>
          )}
        {panel && <MetaPanel panel={panel} meta={meta} setMeta={setMeta} onClose={() => setPanel(null)} />}
        <p className="sw-credit">Sprites animés : PMDCollab SpriteCollab (CC BY-NC 4.0) · Pokémon © Nintendo / Game Freak</p>
      </div>
    );
  }

  const h = hud;
  return (
    <div className="sw-root sw-play">
      <canvas ref={canvasRef} className="sw-canvas" />

      {h && (
        <div className="sw-hud">
          <div className="sw-xp"><b style={{ width: `${(h.xp / h.need) * 100}%` }} /><span>Niv. {h.level}</span></div>
          <div className="sw-top">
            <div className="sw-me">
              <PmdSprite dex={h.form.dex} size={46} scale={1.5} />
              <div>
                <strong>{h.form.name}</strong>
                <div className="sw-hp"><b style={{ width: `${(h.hp / h.maxHp) * 100}%` }} /><span>{Math.ceil(h.hp)} / {h.maxHp}</span></div>
              </div>
            </div>
            <div className="sw-clock">{clock(h.t)}</div>
            <div className="sw-kills">{h.kills} K.O.</div>
            <button type="button" className="sw-btn is-small" onClick={() => setPaused(true)}>Pause</button>
          </div>
          <div className="sw-loadout">
            {h.weapons.map((w) => (
              <span key={w.id} className="sw-slot" style={{ '--c': WEAPONS[w.id].color }} title={WEAPONS[w.id].name}>
                {WEAPONS[w.id].name}<Pips lv={w.lv} />
              </span>
            ))}
            {partner.mega && h.megaLv > 0 && (
              <span className="sw-slot is-passive" style={{ '--c': '#ff6ad5' }} title={partner.mega.stone}>
                {h.isMega ? partner.mega.name : partner.mega.stone}<Pips lv={h.isMega ? MAX_LEVEL : Math.round((h.megaLv / h.megaLevels) * MAX_LEVEL)} />
              </span>
            )}
            {partner.trait === 'turbo' && h.turbo > 0.05 && <span className="sw-slot" style={{ '--c': '#ff7a3a' }}>Turbo +{Math.round(h.turbo * 40)} %</span>}
            {h.passives.map((p) => (
              <span key={p.id} className="sw-slot is-passive" style={{ '--c': PASSIVES[p.id].color }} title={PASSIVES[p.id].name}>
                {PASSIVES[p.id].name}<Pips lv={p.lv} />
              </span>
            ))}
          </div>
          {h.boss && (
            <div className="sw-boss">
              <strong>{h.boss.name}</strong>
              <div><b style={{ width: `${(h.boss.hp / h.boss.maxHp) * 100}%` }} /></div>
            </div>
          )}
          {h.banner && <div key={h.banner} className="sw-banner">{h.banner}</div>}
          <button
            type="button"
            className={`sw-dash${h.dash >= 1 ? ' is-ready' : ''}`}
            style={{ '--k': Math.min(1, h.dash) }}
            onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.dash(); }}
          >
            <b>Esquive</b><small>Espace</small>
          </button>
        </div>
      )}

      {levelUp && !end && (
        <div className="sw-modal">
          <div className="sw-card is-deal">
            <span className="sw-kicker">Niveau {levelUp.level}</span>
            <h2>Pioche une carte</h2>
            <div className="sw-choices is-tcg" key={levelUp.options.map((o) => o.kind + o.id + o.lv).join('|')}>
              {levelUp.options.map((opt, i) => (
                <TcgCard key={`${opt.kind}-${opt.id}`} opt={opt} partner={partner} formDex={hud?.form?.dex ?? partner.dex} index={i} onPick={choose} gen={gen} megaLevels={hud?.megaLevels} />
              ))}
            </div>
            <div className="sw-actions">
              <button type="button" className="sw-btn is-small" disabled={!levelUp.rerolls} onClick={reroll}>Relancer ({levelUp.rerolls})</button>
              <button type="button" className="sw-btn is-small is-ghost" onClick={() => choose({ kind: 'skip', id: 'skip', lv: 0 })}>Passer (+15 PV)</button>
            </div>
          </div>
        </div>
      )}

      {paused && !levelUp && !end && (
        <div className="sw-modal">
          <div className="sw-card is-small">
            <h2>Pause</h2>
            <div className="sw-actions">
              <button type="button" className="sw-btn is-go" onClick={() => setPaused(false)}>Reprendre</button>
              <button type="button" className="sw-btn" onClick={() => { setPaused(false); setScreen('menu'); }}>Abandonner</button>
            </div>
          </div>
        </div>
      )}

      {end && (
        <div className="sw-modal">
          <div className={`sw-card is-end ${end.result === 'win' ? 'is-win' : 'is-lose'}`}>
            <PmdSprite dex={end.form.dex} anim={end.result === 'win' ? 'idle' : 'hurt'} size={120} scale={3} />
            <h2>{end.result === 'win' ? `${finalBoss.name} est K.O. !` : `${end.form.name} est K.O.`}</h2>
            <p>{clock(end.t)} · niveau {end.level} · {end.kills} Pokémon mis K.O.</p>
            {end.reward && (
              <div className="sw-reward">
                <ul>
                  {end.reward.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{l.v} ✦</b></li>)}
                  {end.reward.unlocked.map((a) => <li key={a.id} className="is-ach"><span>Défi réussi : {a.name}</span><b>+{a.reward} ✦</b></li>)}
                </ul>
                <div className="sw-reward-total">
                  <span>Total</span><b>+{end.reward.earned + end.reward.bonus} ✦</b>
                  <small>Tu as maintenant {meta.dust.toLocaleString('fr-FR')} ✦</small>
                </div>
              </div>
            )}
            <div className="sw-actions">
              <button type="button" className="sw-btn is-go" onClick={() => start(dailyRef.current)}>Rejouer</button>
              <button type="button" className="sw-btn" onClick={() => setScreen('menu')}>Changer de partenaire</button>
              <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokeSwarm;
