import React, { useEffect, useRef, useState } from 'react';
import { createBonk } from './bonkEngine';
import { CHARACTERS, MAX_LEVEL, PASSIVES, RUN_SECONDS, WEAPONS } from './bonkData';
import { Avatar } from './SonicRoster';
import './SonicBonk.css';

export const BONK_HASH = '#bonk';
const BEST_KEY = 'sonic-bonk-best';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const readBest = () => {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch { return {}; }
};

const optionLabel = (opt) => {
  if (opt.kind === 'weapon') {
    const W = WEAPONS[opt.id];
    return { title: W.name, tag: opt.lv === 1 ? 'Nouvelle attaque' : `Niveau ${opt.lv}`, desc: W.desc(opt.lv), color: W.color };
  }
  if (opt.kind === 'passive') {
    const P = PASSIVES[opt.id];
    return { title: P.name, tag: opt.lv === 1 ? 'Nouvel objet' : `Niveau ${opt.lv}`, desc: P.desc, color: P.color };
  }
  return { title: 'Soin', tag: 'Soin', desc: 'Récupère 30 PV.', color: '#6bd17a' };
};

const Pips = ({ lv }) => (
  <span className="bk-pips">{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}</span>
);

const SonicBonk = ({ onClose }) => {
  const [screen, setScreen] = useState('menu');
  const [charId, setCharId] = useState(CHARACTERS[0].id);
  const [hud, setHud] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState(null);
  const [best, setBest] = useState(readBest);
  const [run, setRun] = useState(0);
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const gameRef = useRef(null);
  const character = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];

  useEffect(() => {
    if (screen !== 'play' || !mountRef.current || !overlayRef.current) return undefined;
    const game = createBonk(mountRef.current, overlayRef.current, character, {
      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),
      onEnd: (result, snap) => {
        setEnd({ result, ...snap });
        setBest((prev) => {
          const mine = prev[character.id] || {};
          const better = result === 'win'
            ? { win: true, t: Math.min(mine.win ? mine.t : Infinity, snap.t), kills: Math.max(mine.kills || 0, snap.kills) }
            : mine.win ? mine : { win: false, t: Math.max(mine.t || 0, snap.t), kills: Math.max(mine.kills || 0, snap.kills) };
          const next = { ...prev, [character.id]: better };
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
    setEnd(null); setLevelUp(null); setPaused(false); setHud(null);
    setRun((n) => n + 1);
    setScreen('play');
  };
  const choose = (opt) => { setLevelUp(null); gameRef.current?.choose(opt); };
  const reroll = () => {
    const options = gameRef.current?.reroll();
    if (options) setLevelUp((cur) => ({ ...cur, options, rerolls: cur.rerolls - 1 }));
  };

  if (screen === 'menu') {
    return (
      <div className="bk-root bk-menu">
        <div className="bk-sky" aria-hidden="true"><i /><i /><i /></div>
        <header className="bk-head">
          <div>
            <span className="bk-kicker">Mode secret</span>
            <h1>Sonic <b>Bonk</b></h1>
            <p>Une île en 3D, des hordes de robots et {Math.round(RUN_SECONDS / 60)} minutes pour tenir. Tes attaques partent toutes seules : cours, saute, enchaîne les spin dash, casse les moniteurs et ouvre les coffres avec tes anneaux. Bats le Colosse pour gagner.</p>
          </div>
          <button type="button" className="bk-btn is-ghost" onClick={onClose}>Quitter</button>
        </header>
        <div className="bk-chars">
          {CHARACTERS.map((c) => {
            const rec = best[c.id];
            return (
              <button
                key={c.id}
                type="button"
                className={`bk-char${c.id === charId ? ' is-on' : ''}`}
                style={{ '--c': c.color }}
                onClick={() => setCharId(c.id)}
                onDoubleClick={() => { setCharId(c.id); start(); }}
                aria-pressed={c.id === charId}
              >
                <Avatar id={c.id} size={96} />
                <strong>{c.name}</strong>
                <span className="bk-weapon">{WEAPONS[c.weapon].name}</span>
                <small>{c.blurb}</small>
                <span className="bk-stats">{c.hp} PV · vitesse {c.speed}</span>
                {rec && <span className={`bk-record${rec.win ? ' is-win' : ''}`}>{rec.win ? `Victoire en ${clock(rec.t)}` : `Record : ${clock(rec.t)}`} · {rec.kills} K.O.</span>}
              </button>
            );
          })}
        </div>
        <div className="bk-howto">
          <span><b>Courir</b> ZQSD / WASD · <b>Caméra</b> souris (clique sur le jeu)</span>
          <span><b>Saut</b> Espace · rappuie en l'air pour la capacité du perso</span>
          <span><b>Spin dash</b> Maj ou E : fonce et écrase les robots, invincible</span>
          <span><b>Bunny hop</b> ressaute pile à l'atterrissage pour garder ta vitesse</span>
          <span><b>Ressorts et accélérateurs</b> pour traverser l'île · <b>Coffres</b> payés en anneaux</span>
          <span><b>Téléphone</b> joystick à gauche, caméra à droite, boutons Saut / Spin</span>
        </div>
        <button type="button" className="bk-btn is-go" onClick={start}>Jouer avec {character.name}</button>
        <p className="bk-credit">Modèle 3D par défaut : RobotExpressive de Tomás Laulhé (CC0)</p>
      </div>
    );
  }

  const h = hud;
  return (
    <div className="bk-root bk-play">
      <div ref={mountRef} className="bk-stage" />
      <canvas ref={overlayRef} className="bk-overlay" />
      {h && (
        <div className="bk-hud">
          <div className="bk-xp"><b style={{ width: `${(h.xp / h.need) * 100}%` }} /><span>Niv. {h.level}</span></div>
          <div className="bk-top">
            <div className="bk-me" style={{ '--c': character.color }}>
              <Avatar id={character.id} size={44} />
              <div>
                <strong>{character.name}{h.shield ? ' · Bouclier' : ''}</strong>
                <div className="bk-hp"><b style={{ width: `${(h.hp / h.maxHp) * 100}%` }} /><span>{Math.ceil(h.hp)} / {h.maxHp}</span></div>
              </div>
            </div>
            <div className="bk-clock">{clock(h.t)}</div>
            <div className="bk-counters">
              <span className="bk-rings"><i />{h.rings}</span>
              <span>{h.kills} K.O.</span>
              <span className="bk-speed">{h.speed} km/h{h.bhop > 0.05 ? ` · +${Math.round(h.bhop * 100)} %` : ''}</span>
            </div>
            <button type="button" className="bk-btn is-small" onClick={() => setPaused(true)}>Pause</button>
          </div>
          {h.boss && (
            <div className="bk-boss">
              <strong>{h.boss.name}</strong>
              <div><b style={{ width: `${(h.boss.hp / h.boss.maxHp) * 100}%` }} /></div>
            </div>
          )}
          {h.banner && <div key={h.banner} className="bk-banner">{h.banner}</div>}
          <div className="bk-loadout">
            {h.weapons.map((w) => <span key={w.id} className="bk-slot" style={{ '--c': WEAPONS[w.id].color }}>{WEAPONS[w.id].name}<Pips lv={w.lv} /></span>)}
            {h.passives.map((p) => <span key={p.id} className="bk-slot is-passive" style={{ '--c': PASSIVES[p.id].color }}>{PASSIVES[p.id].name}<Pips lv={p.lv} /></span>)}
          </div>
          <div className="bk-pad">
            <button
              type="button"
              className={`bk-act is-spin${h.dash >= 1 ? ' is-ready' : ''}`}
              style={{ '--k': Math.min(1, Math.max(0, h.dash)) }}
              onPointerDown={(e) => { e.preventDefault(); gameRef.current?.dash(); }}
            >Spin</button>
            <button
              type="button"
              className="bk-act is-jump"
              onPointerDown={(e) => { e.preventDefault(); gameRef.current?.jump(true); }}
              onPointerUp={() => gameRef.current?.jump(false)}
              onPointerCancel={() => gameRef.current?.jump(false)}
              onPointerLeave={() => gameRef.current?.jump(false)}
            >Saut</button>
          </div>
          {h.t < 6 && <div className="bk-tip">Clique sur le jeu pour tourner la caméra à la souris · Échap pour la libérer</div>}
        </div>
      )}

      {levelUp && !end && (
        <div className="bk-modal">
          <div className="bk-card">
            <span className="bk-kicker">Niveau {levelUp.level}</span>
            <h2>Choisis un bonus</h2>
            <div className="bk-choices">
              {levelUp.options.map((opt) => {
                const l = optionLabel(opt);
                return (
                  <button key={`${opt.kind}-${opt.id}`} type="button" className="bk-choice" style={{ '--c': l.color }} onClick={() => choose(opt)}>
                    <span className="bk-choice-tag">{l.tag}</span>
                    <strong>{l.title}</strong>
                    <p>{l.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="bk-actions">
              <button type="button" className="bk-btn is-small" disabled={!levelUp.rerolls} onClick={reroll}>Relancer ({levelUp.rerolls})</button>
              <button type="button" className="bk-btn is-small is-light" onClick={() => choose({ kind: 'skip', id: 'skip', lv: 0 })}>Passer (+15 PV)</button>
            </div>
          </div>
        </div>
      )}

      {paused && !levelUp && !end && (
        <div className="bk-modal">
          <div className="bk-card is-small">
            <h2>Pause</h2>
            <div className="bk-actions">
              <button type="button" className="bk-btn is-go" onClick={() => setPaused(false)}>Reprendre</button>
              <button type="button" className="bk-btn is-light" onClick={() => { setPaused(false); setScreen('menu'); }}>Abandonner</button>
            </div>
          </div>
        </div>
      )}

      {end && (
        <div className="bk-modal">
          <div className={`bk-card is-end ${end.result === 'win' ? 'is-win' : 'is-lose'}`}>
            <Avatar id={character.id} size={110} />
            <h2>{end.result === 'win' ? 'Le Colosse est détruit !' : `${character.name} est K.O.`}</h2>
            <p>{clock(end.t)} · niveau {end.level} · {end.kills} robots détruits · {end.rings} anneaux</p>
            <div className="bk-actions">
              <button type="button" className="bk-btn is-go" onClick={start}>Rejouer</button>
              <button type="button" className="bk-btn is-light" onClick={() => setScreen('menu')}>Changer de perso</button>
              <button type="button" className="bk-btn is-light" onClick={onClose}>Quitter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SonicBonk;
