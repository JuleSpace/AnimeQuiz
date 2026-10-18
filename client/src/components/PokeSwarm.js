import React, { useEffect, useRef, useState } from 'react';
import { createGame } from './swarmEngine';
import { MAX_LEVEL, PARTNERS, PASSIVES, WEAPONS, spriteOf } from './swarmData';
import { musicPlayer } from './pokeArenaMusic';
import './PokeSwarm.css';

export const SWARM_HASH = '#swarm';
const BEST_KEY = 'poke-swarm-best';
const MUSIC_KEY = 'poke-arena-music';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const readBest = () => {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch { return {}; }
};

const optionLabel = (opt) => {
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

const Pips = ({ lv }) => (
  <span className="sw-pips">
    {Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}
  </span>
);

const PokeSwarm = ({ onClose }) => {
  const [screen, setScreen] = useState('menu');
  const [partnerId, setPartnerId] = useState(PARTNERS[0].id);
  const [hud, setHud] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState(null);
  const [best, setBest] = useState(readBest);
  const [run, setRun] = useState(0);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const partner = PARTNERS.find((p) => p.id === partnerId) || PARTNERS[0];

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
      onLevelUp: (options, level) => setLevelUp({ options, level }),
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
    });
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

  if (screen === 'menu') {
    return (
      <div className="sw-root sw-menu">
        <header className="sw-head">
          <div>
            <span className="sw-kicker">Mode secret</span>
            <h1>Poké Swarm</h1>
            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats Mewtwo. Tes attaques partent toutes seules : à toi de bouger et de bien choisir tes bonus.</p>
          </div>
          <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
        </header>
        <div className="sw-partners">
          {PARTNERS.map((p) => {
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
                <img src={spriteOf(p.dex)} alt="" draggable={false} />
                <strong>{p.name}</strong>
                <span className="sw-type">{p.type}</span>
                <span className="sw-attack">{WEAPONS[p.weapon].name}</span>
                <small>{p.blurb}</small>
                <span className="sw-stats">{p.hp} PV · vitesse {p.speed.toFixed(1)}</span>
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
          <span><b>Pause</b> Échap ou P</span>
          <span><b>Bonbons</b> ramasse l'XP pour monter de niveau et choisir un bonus</span>
          <span><b>Évolution</b> ton partenaire évolue en route</span>
        </div>
        <button type="button" className="sw-btn is-go" onClick={start}>Partir avec {partner.name}</button>
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
              <img src={spriteOf(h.form.dex)} alt="" />
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
        </div>
      )}

      {levelUp && !end && (
        <div className="sw-modal">
          <div className="sw-card">
            <span className="sw-kicker">Niveau {levelUp.level}</span>
            <h2>Choisis un bonus</h2>
            <div className="sw-choices">
              {levelUp.options.map((opt) => {
                const l = optionLabel(opt);
                return (
                  <button key={`${opt.kind}-${opt.id}`} type="button" className="sw-choice" style={{ '--c': l.color }} onClick={() => choose(opt)}>
                    <span className="sw-choice-tag">{l.tag}</span>
                    <strong>{l.title}</strong>
                    <em>{l.type}</em>
                    <p>{l.desc}</p>
                  </button>
                );
              })}
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
            <img src={spriteOf(end.form.dex)} alt="" />
            <h2>{end.result === 'win' ? 'Mewtwo est K.O. !' : `${end.form.name} est K.O.`}</h2>
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
