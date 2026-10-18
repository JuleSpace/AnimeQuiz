import React, { useEffect, useRef, useState } from 'react';
import { createGame } from './swarmEngine';
import { buildWorld } from './swarmWorld';
import { drawPokemon, preloadSprites } from './swarmSprites';
import { FOES, GENS, GEN_BOSSES, MAX_LEVEL, MEGA_LEVELS, PARTNERS, PASSIVES, WEAPONS } from './swarmData';
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

const optionLabel = (opt, partner) => {
  if (opt.kind === 'mega' && partner?.mega) {
    return {
      title: partner.mega.stone,
      tag: opt.lv >= MEGA_LEVELS ? 'Méga-Évolution !' : `Méga-Gemme ${opt.lv}/${MEGA_LEVELS}`,
      desc: opt.lv >= MEGA_LEVELS ? `${partner.mega.name} : +30 % de dégâts, plus rapide, PV max +60 et soin complet.` : `Rapproche de la Méga-Évolution (+4 % de dégâts). Au niveau ${MEGA_LEVELS} : ${partner.mega.name} !`,
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
const PmdSprite = ({ dex, anim = 'idle', size = 96, scale = 3, dir = 0 }) => {
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
      drawPokemon(x, dex, anim, (now - t0) / 1000, dir, size / 2, size * 0.8, scale);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dex, anim, size, scale, dir]);
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

const Pips = ({ lv }) => (
  <span className="sw-pips">
    {Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}
  </span>
);

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
        setEnd({ result, ...snap });
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
    }, world, gen);
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

  const start = () => {
    setEnd(null);
    setLevelUp(null);
    setPaused(false);
    setHud(null);
    setRun((n) => n + 1);
    setScreen('play');
  };

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
          <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
        </header>
        <div className="sw-gens" role="tablist" aria-label="Génération">
          {GENS.map((gn) => (
            <button key={gn.id} type="button" role="tab" aria-selected={gn.id === gen} className={`sw-gen${gn.id === gen ? ' is-on' : ''}`} onClick={() => pickGen(gn.id)}>
              <b>{gn.name}</b><small>{gn.label}</small>
            </button>
          ))}
        </div>
        <div className="sw-partners">
          {starters.map((p) => {
            const rec = best[p.id];
            return (
              <button
                key={p.id}
                type="button"
                className={`sw-partner${p.id === partnerId ? ' is-on' : ''}`}
                style={{ '--c': p.color }}
                onClick={() => setPartnerId(p.id)}
                onDoubleClick={() => { setPartnerId(p.id); start(); }}
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
        <button type="button" className="sw-btn is-go" onClick={start}>Partir avec {partner.name}</button>
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
                {h.isMega ? partner.mega.name : partner.mega.stone}<Pips lv={h.isMega ? MAX_LEVEL : h.megaLv} />
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
          <div className="sw-card">
            <span className="sw-kicker">Niveau {levelUp.level}</span>
            <h2>Choisis un bonus</h2>
            <div className="sw-choices">
              {levelUp.options.map((opt) => {
                const l = optionLabel(opt, partner);
                return (
                  <button key={`${opt.kind}-${opt.id}`} type="button" className={`sw-choice${l.mega ? ' is-mega' : ''}`} style={{ '--c': l.color }} onClick={() => choose(opt)}>
                    <span className="sw-choice-tag">{l.tag}</span>
                    <strong>{l.title}</strong>
                    <em>{l.type}</em>
                    <p>{l.desc}</p>
                  </button>
                );
              })}
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
            <div className="sw-actions">
              <button type="button" className="sw-btn is-go" onClick={start}>Rejouer</button>
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
