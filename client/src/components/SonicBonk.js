import React, { useEffect, useRef, useState } from 'react';
import { createBonk } from './bonkEngine';
import { CHARACTERS, MAX_LEVEL, MODELS, PASSIVES, RUN_SECONDS, WEAPONS } from './bonkData';
import { Avatar } from './SonicRoster';
import GameHome, { HomeBoard } from './GameHome';
import { AccountChip, postRun } from './account';
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

/** Décor de l'accueil : Green Hill, damier, palmiers, looping et anneaux. */
const BonkScene = () => (
  <div className="bkh-scene" aria-hidden="true">
    <span className="bkh-cloud is-1" /><span className="bkh-cloud is-2" /><span className="bkh-cloud is-3" />
    <span className="bkh-mount" />
    <span className="bkh-sea" />
    <span className="bkh-hill is-back" />
    <span className="bkh-loop" />
    <span className="bkh-palm is-1"><i /></span>
    <span className="bkh-palm is-2"><i /></span>
    <span className="bkh-palm is-3"><i /></span>
    <span className="bkh-hill is-front" />
    <span className="bkh-rings">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
  </div>
);
const Ring = () => <span className="bkh-ring" aria-hidden="true" />;

const BONK_HOWTO = [
  ['Courir', 'ZQSD / WASD · caméra à la souris (clique sur le jeu)'],
  ['Saut', 'Espace · rappuie en l’air pour la capacité du perso'],
  ['Spin dash', 'Maj ou E : fonce et écrase les robots, invincible'],
  ['Bunny hop', 'ressaute pile à l’atterrissage pour garder ta vitesse'],
  ['Ressorts', 'et accélérateurs pour traverser l’île'],
  ['Coffres', 'payés en anneaux, ramassés sur les robots'],
  ['Téléphone', 'joystick à gauche, caméra à droite, boutons Saut / Spin']
];

const SonicBonk = ({ onClose }) => {
  const [screen, setScreen] = useState('home');
  const [howto, setHowto] = useState(false);
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
        postRun('bonk', { gen: 1, mode: 'classic', partnerId: character.id, form: character.name, result, t: snap.t, kills: snap.kills, level: snap.level });
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

  if (screen === 'home') {
    const rec = best[character.id];
    const wins = CHARACTERS.filter((c) => best[c.id]?.win).length;
    const bestKills = Math.max(0, ...CHARACTERS.map((c) => best[c.id]?.kills || 0));
    const next = CHARACTERS.find((c) => !best[c.id]?.win);
    return (
      <div className="bk-root bkh-wrap">
        <GameHome
          theme="gh-bonk"
          backdrop={<BonkScene />}
          topLeft={(
            <>
              <button type="button" className="gh-pill is-plain" onClick={onClose}>← Bully’s Lair</button>
              <button type="button" className="gh-pill is-plain" onClick={() => setHowto(true)}>Comment jouer</button>
            </>
          )}
          topRight={(
            <>
              <AccountChip returnHash="#bonk" />
              <span className="gh-pill" title="Personnages victorieux">🏆 {wins}/{CHARACTERS.length}</span>
              <span className="gh-pill is-strong" title="Record de K.O.">{bestKills.toLocaleString('fr-FR')} K.O.</span>
            </>
          )}
          logo={(
            <div className="bkh-logo">
              <span className="bk-kicker">Mode secret · Green Hill</span>
              <h1>Sonic <b>Bonk</b></h1>
            </div>
          )}
          stage={<span className="bkh-hero"><Avatar id={character.id} size={230} /></span>}
          play={{
            title: 'Jouer',
            sub: `${character.name} · ${WEAPONS[character.weapon].name}${rec ? ` · ${rec.win ? 'victoire en' : 'record'} ${clock(rec.t)}` : ''}`,
            art: <Avatar id={character.id} size={84} />,
            onClick: start
          }}
          side={{
            title: 'Perso',
            sub: `${CHARACTERS.length} au choix`,
            art: <span className="bkh-side-stack">{CHARACTERS.slice(0, 3).map((c) => <Avatar key={c.id} id={c.id} size={34} />)}</span>,
            onClick: () => setScreen('menu')
          }}
          cards={[
            {
              key: 'boss', tone: 'event', kicker: `Le Colosse · à ${clock(RUN_SECONDS)}`,
              title: 'Tiens bon, puis abats-le',
              sub: `${Math.round(RUN_SECONDS / 60)} minutes de hordes de robots avant le boss`,
              art: <Ring />,
              onClick: start
            },
            next ? {
              key: 'next', tone: 'light', kicker: `Victoires · ${wins}/${CHARACTERS.length} personnages`,
              title: `Gagne avec ${next.name}`,
              sub: next.blurb,
              art: <Avatar id={next.id} size={52} />,
              onClick: () => { setCharId(next.id); setScreen('menu'); }
            } : {
              key: 'all', tone: 'done', kicker: 'Tous les personnages', title: 'Île entièrement conquise !', sub: 'Bats tes records de temps et de K.O.',
              art: <Ring />, onClick: () => setScreen('menu')
            }
          ]}
          tiles={CHARACTERS.slice(0, 5).map((c) => ({
            key: c.id, label: c.name, value: best[c.id]?.win ? `✓ ${clock(best[c.id].t)}` : best[c.id] ? `${best[c.id].kills} K.O.` : 'à jouer',
            color: c.color, icon: <Avatar id={c.id} size={44} />,
            onClick: () => { setCharId(c.id); setScreen('menu'); }
          }))}
          board={(
            <HomeBoard
              game="bonk"
              gen={1}
              title="Classement"
              subtitle="Île de Green Hill · meilleur score de chaque joueur"
              describe={(r) => `${r.form || CHARACTERS.find((c) => c.id === r.partnerId)?.name || ''} · niv. ${r.level}`}
            />
          )}
          footer={`Fan-game non commercial. Personnages © SEGA. Modèles 3D (Sketchfab) : ${CHARACTERS.map((c) => MODELS[c.id]?.credit).filter(Boolean).join(' · ')}.`}
        />
        {howto && (
          <div className="bkh-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) setHowto(false); }}>
            <div className="bkh-sheet">
              <header><b>Comment jouer</b><button type="button" className="bk-btn is-small is-light" onClick={() => setHowto(false)}>Fermer</button></header>
              <p>Une île en 3D, des hordes de robots et {Math.round(RUN_SECONDS / 60)} minutes pour tenir. Tes attaques partent toutes seules : cours, saute, enchaîne les spin dash, casse les moniteurs et ouvre les coffres avec tes anneaux. Bats le Colosse pour gagner.</p>
              <div className="bk-howto">{BONK_HOWTO.map(([k, v]) => <span key={k}><b>{k}</b> {v}</span>)}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <button type="button" className="bk-btn is-ghost" onClick={() => setScreen('home')}>← Accueil</button>
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
        <div className="bk-howto">{BONK_HOWTO.map(([k, v]) => <span key={k}><b>{k}</b> {v}</span>)}</div>
        <button type="button" className="bk-btn is-go" onClick={start}>Jouer avec {character.name}</button>
        <p className="bk-credit">
          Modèles 3D (Sketchfab) — {CHARACTERS.map((c) => MODELS[c.id]?.credit).filter(Boolean).join(' · ')} · Modèle de secours : RobotExpressive, Tomás Laulhé (CC0).
          Personnages © SEGA, projet de fans non commercial.
        </p>
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
              <button type="button" className="bk-btn is-light" onClick={() => { setPaused(false); setScreen('home'); }}>Abandonner</button>
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
              <button type="button" className="bk-btn is-light" onClick={() => setScreen('home')}>Accueil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SonicBonk;
