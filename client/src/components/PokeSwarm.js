import React, { useEffect, useRef, useState } from 'react';
import { createGame } from './swarmEngine';
import { BIOMES, buildWorld } from './swarmWorld';
import { animLength, drawPokemon, preloadSprites } from './swarmSprites';
import { drawDemo } from './swarmDemo';
import {
  AI_INFO, FOES, FOE_INFO, GENS, GEN_POOLS, MAX_LEVEL, MAX_PASSIVES, MAX_WEAPONS, MEGA_LEVELS, PARTNERS, PASSIVES, TRAIT_INFO, WEAPONS,
  buildRoster, megaOf, seededRng, ultimateOf
} from './swarmData';
import {
  ACHIEVEMENTS, ALL_FOE_IDS, BRANCHES, MAX_RANK, REGION_COST, TALENTS, TIER_NEEDS, UNLOCKABLES, branchPoints, buyTalent, buyUnlock,
  dailyChallenge, loadMeta, metaEffects, saveMeta, rankLabel, rankOf, recordRun, refundAll, talentCost, talentLocked, tierNeed, unlockRegion
} from './swarmMeta';
import { musicPlayer } from './pokeArenaMusic';
import { AccountChip, Leaderboard, postRun, useCloudSync } from './account';
import './PokeSwarm.css';

export const SWARM_HASH = '#swarm';
const BEST_KEY = 'poke-swarm-best';
const GEN_KEY = 'poke-swarm-gen';
const MUSIC_KEY = 'poke-arena-music';
const MODE_KEY = 'poke-swarm-mode';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const readBest = () => {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch { return {}; }
};

const optionLabel = (opt, partner, ML = MEGA_LEVELS) => {
  if (opt.kind === 'mega' && partner?.mega) {
    const m = megaOf(partner, opt.id) || partner.mega;
    const choosing = partner.mega.choices && opt.lv === 1;
    let desc;
    if (opt.lv >= ML) desc = `${m.name} : ${m.perk || '+30 % de dégâts, plus rapide.'} PV max +60 et soin complet.`;
    else if (choosing) desc = `Choisis ta pierre : ${m.name}. ${m.perk} Au niveau ${ML}, la Méga-Évolution !`;
    else desc = `Rapproche de la Méga-Évolution (+4 % de dégâts). Au niveau ${ML} : ${m.name} !`;
    return {
      title: m.stone,
      tag: opt.lv >= ML ? 'Méga-Évolution !' : choosing ? `Choix de la pierre · 1/${ML}` : `Méga-Gemme ${opt.lv}/${ML}`,
      desc,
      color: m.color || '#ff6ad5',
      type: 'Méga',
      mega: true
    };
  }
  if (opt.kind === 'evo') {
    const c = partner.evolutions.find((e) => e.choices)?.choices.find((x) => x.id === opt.id);
    return { title: c.name, tag: 'Évolution', desc: c.perk, color: c.color, type: c.type, evoDex: c.dex };
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
const PmdSprite = ({ dex, anim = 'idle', size = 96, scale = 3, dir = 0, still = false, cycle = null, rate = 0.55, hold = 1.1, foot = 0.8 }) => {
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
      let drawn;
      const t = (now - t0) / 1000;
      if (cycle) {
        // Carte d'attaque : le Pokémon attend, puis joue son attaque au ralenti
        const len = animLength(dex, cycle) / rate;
        const tt = t % (len + hold);
        drawn = tt < hold
          ? drawPokemon(x, dex, 'idle', t, dir, size / 2, size * foot, scale)
          : drawPokemon(x, dex, cycle, (tt - hold) * rate, dir, size / 2, size * foot, scale, { loop: false });
      } else drawn = drawPokemon(x, dex, anim, still ? 0 : t, dir, size / 2, size * foot, scale);
      if (!(still && drawn)) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dex, anim, size, scale, dir, still, cycle, rate, hold, foot]);
  return <canvas ref={ref} className="sw-pmd" style={{ width: size, height: size }} />;
};

/** Démo d'attaque sur les cartes : le partenaire utilise l'attaque sur un Pokémon sauvage. */
const MoveDemo = ({ id, dex, foe, color }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    preloadSprites([dex, foe]);
    const dpr = window.devicePixelRatio || 1;
    const x = c.getContext('2d');
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      const w = c.clientWidth || 180; const h = c.clientHeight || 110;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, w, h);
      x.imageSmoothingEnabled = false;
      drawDemo(x, w, h, (now - t0) / 1000, { id, dex, foe, color });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id, dex, foe, color]);
  return <canvas ref={ref} className="tcg-demo" />;
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
  Spectre: '#8a6bc4', Ténèbres: '#6b5a4c', Combat: '#d2513f', Objet: '#9fb3d6', Baie: '#4f8fe0', Méga: '#ff6ad5',
  Glace: '#7fd8e8', Acier: '#b7b7ce', Poison: '#a35cc4', Psy: '#f95587', Vol: '#a98ff3', Dragon: '#6f35fc',
  Roche: '#b6a136', Fée: '#ff9ad8'
};
const ITEM_SLUG = {
  protein: 'protein', carbos: 'carbos', hpup: 'hp-up', magnet: 'magnet', quickclaw: 'quick-claw', leftovers: 'leftovers', scope: 'scope-lens',
  shellbell: 'shell-bell', expshare: 'exp-share', brightpowder: 'bright-powder'
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
  const rarity = opt.kind === 'mega' || opt.kind === 'evo' ? 'ultra' : (opt.kind === 'weapon' && opt.lv >= MAX_LEVEL) || (opt.kind === 'passive' && opt.lv >= MAX_LEVEL) ? 'rare' : opt.lv === 1 ? 'common' : 'uncommon';
  const holo = rarity === 'rare' || rarity === 'ultra';
  let power = null;
  if (opt.kind === 'weapon') {
    const v = WEAPONS[opt.id].at(opt.lv);
    power = v.dmg ? Math.round(v.dmg) : v.dps ? `${Math.round(v.dps)}/s` : null;
  }
  const kindLabel = opt.kind === 'evo' ? `Évolution · ${type}` : opt.kind === 'weapon' ? 'Attaque' : opt.kind === 'passive' ? 'Objet' : opt.kind === 'mega' ? 'Méga-Gemme' : 'Baie';
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
  if (opt.kind === 'weapon') art = <MoveDemo id={opt.id} dex={formDex} foe={FOES[(GEN_POOLS[gen] || GEN_POOLS[1]).t1[0]].dex} color={WEAPONS[opt.id].color} />;
  else if (opt.kind === 'evo') art = <PmdSprite dex={l.evoDex} anim="idle" size={118} scale={2.6} />;
  else if (opt.kind === 'mega') {
    const m = megaOf(partner, opt.id) || partner.mega;
    art = <PmdSprite dex={opt.lv >= MEGA_LEVELS || partner.mega.choices ? m.sprite : formDex} anim="idle" size={118} scale={2.6} />;
  }
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
      style={{ '--tc': opt.kind === 'mega' && l.color !== '#ff6ad5' ? l.color : tc, '--i': index }}
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

/** Musique : titre en cours, volume (partagé avec Arena) et morceau suivant. */
const MusicControls = () => {
  const [now, setNow] = useState(null);
  const [volume, setVolume] = useState(() => {
    try { const raw = localStorage.getItem(MUSIC_KEY); const v = raw === null ? 0.5 : Number(raw); return Number.isFinite(v) ? v : 0.5; } catch { return 0.5; }
  });
  useEffect(() => musicPlayer().subscribe(setNow), []);
  const set = (v) => {
    setVolume(v);
    musicPlayer().setVolume(v);
    try { localStorage.setItem(MUSIC_KEY, String(v)); } catch { /* stockage indisponible */ }
  };
  const pct = Math.round(volume * 100);
  return (
    <div className="sw-music">
      <span className="sw-kicker">Musique</span>
      <strong className="sw-music-title">{now?.title || (volume > 0 ? 'La musique démarre…' : 'Musique coupée')}</strong>
      <div className="sw-music-row">
        <button type="button" className="sw-music-mute" onClick={() => set(volume > 0 ? 0 : 0.5)} aria-label={volume > 0 ? 'Couper la musique' : 'Remettre la musique'}>
          {volume > 0 ? '🔊' : '🔇'}
        </button>
        <input type="range" min="0" max="100" step="1" value={pct} style={{ '--p': `${pct}%` }} aria-label="Volume de la musique" onChange={(e) => set(Number(e.target.value) / 100)} />
        <em>{pct} %</em>
      </div>
      <button type="button" className="sw-btn is-small" disabled={volume <= 0} onClick={() => musicPlayer().next()}>Morceau suivant ⏭</button>
    </div>
  );
};

const pctTxt = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))} %`;

/** Récapitulatif de la partie en cours (écran de pause). */
const RunRecap = ({ h, partner }) => {
  const s = h.stats || {};
  const m = megaOf(partner, h.megaChoice) || partner.mega;
  const chips = [
    ['Dégâts', pctTxt((s.dmg || 1) - 1), '#ff6a5a'],
    ['Vitesse', pctTxt((s.speed || 1) - 1), '#4fa8ff'],
    ['Recharge', pctTxt((s.cd || 1) - 1), '#f0c34a'],
    ['Critique', `${Math.round((s.crit || 0) * 100)} %`, '#ff9a3c'],
    ['Régén.', `${(s.regen || 0).toFixed(1)} PV/s`, '#5fd06a'],
    ['Ramassage', `${Math.round(s.magnet || 80)} px`, '#b8c2dc']
  ];
  return (
    <div className="sw-recap">
      <div className="sw-recap-head">
        <PmdSprite dex={h.form.dex} anim="idle" size={84} scale={2.2} />
        <div>
          <strong>{h.form.name}</strong>
          <span>Niveau {h.level} · {clock(h.t)} · {h.kills} K.O.</span>
          <div className="sw-hp is-recap"><b style={{ width: `${(h.hp / h.maxHp) * 100}%` }} /><span>{Math.ceil(h.hp)} / {h.maxHp} PV</span></div>
        </div>
      </div>
      <div className="sw-chips">
        {chips.map(([k, v, c]) => <span key={k} style={{ '--c': c }}><small>{k}</small><b>{v}</b></span>)}
      </div>
      {h.missions?.length > 0 && (
        <>
          <h3>Missions</h3>
          <Missions list={h.missions} />
        </>
      )}
      <h3>Attaques <small>{h.weapons.length}/{h.slots?.weapons || MAX_WEAPONS}</small></h3>
      <div className="sw-recap-grid">
        {h.weapons.map((w) => {
          const W = WEAPONS[w.id];
          const v = W.at(w.lv);
          const power = v.dmg ? Math.round(v.dmg * (s.dmg || 1)) : v.dps ? `${Math.round(v.dps * (s.dmg || 1))}/s` : null;
          return (
            <div key={w.id} className="sw-tile" style={{ '--c': TYPE_COLORS[W.type] || W.color }}>
              <div className="sw-tile-top"><b>{W.name}</b>{power !== null && <em>{power}</em>}</div>
              <small className="sw-tile-type">{W.type || 'Attaque'} · Niv. {w.lv}</small>
              <Pips lv={w.lv} />
              <p>{W.desc(w.lv)}</p>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, (h.slots?.weapons || MAX_WEAPONS) - h.weapons.length) }, (_, i) => <div key={`ew${i}`} className="sw-tile is-empty">Emplacement libre</div>)}
      </div>
      <h3>Objets <small>{h.passives.length}/{h.slots?.passives || MAX_PASSIVES}</small></h3>
      <div className="sw-recap-grid is-items">
        {h.passives.map((pv) => {
          const P = PASSIVES[pv.id];
          return (
            <div key={pv.id} className="sw-tile is-item" style={{ '--c': P.color }}>
              <img src={itemSprite(ITEM_SLUG[pv.id])} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
              <div>
                <div className="sw-tile-top"><b>{P.name}</b><small>Niv. {pv.lv}</small></div>
                <Pips lv={pv.lv} />
                <p>{P.desc}{pv.lv > 1 ? ` (×${pv.lv})` : ''}</p>
              </div>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, (h.slots?.passives || MAX_PASSIVES) - h.passives.length) }, (_, i) => <div key={`ep${i}`} className="sw-tile is-empty">Emplacement libre</div>)}
      </div>
      {partner.mega && (h.megaLv > 0 || h.isMega) && (
        <div className="sw-tile is-mega" style={{ '--c': m?.color || '#ff6ad5' }}>
          <div className="sw-tile-top"><b>{h.isMega ? h.form.name : (m?.stone || 'Méga-Gemme')}</b><small>{h.isMega ? 'Méga-Évolué !' : `${h.megaLv}/${h.megaLevels}`}</small></div>
          <p>{m?.perk || (h.isMega ? '+30 % de dégâts, plus rapide.' : 'Continue de prendre la Méga-Gemme pour Méga-Évoluer.')}</p>
        </div>
      )}
    </div>
  );
};

/** Liste des missions de la partie (HUD, pause, fin). */
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

const Pips = ({ lv }) => (
  <span className="sw-pips">
    {Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}
  </span>
);

const TIER_LABEL = { t1: 'Commun', t2: 'Peu commun', t3: 'Redoutable', minis: 'Boss', finals: 'Légendaire' };

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

/** Panneaux de progression : talents, défis, Pokédex. */
const MetaPanel = ({ panel, meta, setMeta, onClose }) => {
  const [tab, setTab] = useState(panel);
  const [foe, setFoe] = useState(null);
  useEffect(() => setTab(panel), [panel]);
  useEffect(() => setFoe(null), [tab]);
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
            {[['talents', 'Talents'], ['moves', `Capacités ${UNLOCKABLES.filter((u) => meta.unlocks?.[u.id]).length}/${UNLOCKABLES.length}`], ['achievements', `Défis ${Object.keys(meta.achievements).length}/${ACHIEVEMENTS.length}`], ['dex', `Pokédex ${seen}/${ALL_FOE_IDS.length}`], ['history', 'Historique'], ['board', 'Classement']].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <span className="sw-dust">✦ {meta.dust.toLocaleString('fr-FR')}</span>
          <button type="button" className="sw-btn is-small is-ghost" onClick={onClose}>Fermer</button>
        </div>

        {tab === 'talents' && (
          <>
            <p className="sw-panel-note">Chaque talent acheté rend tous les suivants un peu plus chers. Les paliers se débloquent avec {TIER_NEEDS[1]} puis {TIER_NEEDS[2]} points dans la branche ({tierNeed('mastery', 1)} puis {tierNeed('mastery', 2)} pour la Maîtrise).</p>
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
                              {maxed ? 'Maximum' : locked ? `${branchPoints(meta, t.branch)}/${tierNeed(t.branch, t.tier)} pts dans la branche` : `${cost} ✦`}
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

        {tab === 'moves' && (
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

        {tab === 'history' && <History meta={meta} />}
        {tab === 'board' && <Leaderboard game="swarm" gens={GENS.map((g) => ({ id: g.id, name: g.name }))} partnerName={(id) => PARTNERS.find((p) => p.id === id)?.name || id} />}
        {tab === 'dex' && foe && <FoeSheet id={foe} meta={meta} onClose={() => setFoe(null)} />}
        {tab === 'dex' && !foe && (
          <div className="sw-dex">
            <p className="sw-panel-note">Clique sur un Pokémon déjà croisé pour voir ce qu’il sait faire. À chaque partie, seule une partie du pool de la région apparaît.</p>
            {GENS.map((gn) => (
              <section key={gn.id}>
                <h3>{gn.name}</h3>
                <div className="sw-dex-grid">
                  {ALL_FOE_IDS.filter((id) => FOE_INFO[id].gen === gn.id).map((id) => {
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
  const [altar, setAltar] = useState(null);
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem(MODE_KEY) === 'endless' ? 'endless' : 'classic'; } catch { return 'classic'; }
  });
  const setMode = (v) => { setModeState(v); try { localStorage.setItem(MODE_KEY, v); } catch { /* stockage indisponible */ } };
  const [end, setEnd] = useState(null);
  const [best, setBest] = useState(readBest);
  const [run, setRun] = useState(0);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [world, setWorld] = useState(null);
  const [rank, setRank] = useState(0);
  const [meta, setMetaState] = useState(loadMeta);
  const metaRef = useRef(meta);
  const setMeta = (m) => { metaRef.current = m; setMetaState(m); };
  // Compte Discord : la progression suit le joueur d'un appareil à l'autre
  useCloudSync('swarm', meta, (remote) => { saveMeta({ ...remote }); setMeta(loadMeta()); }, (m) => m?.totalDust || 0);
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
  // Et la prochaine carte se prépare pendant qu'on est au menu ou sur l'écran de fin (jamais en pleine partie)
  const nextWorldRef = useRef(null);
  useEffect(() => {
    if (nextWorldRef.current || (screen === 'play' && !end)) return undefined;
    const id = setTimeout(() => { if (!nextWorldRef.current) nextWorldRef.current = buildWorld(); }, 700);
    return () => clearTimeout(id);
  }, [screen, end, world]);

  const partner = starters.find((p) => p.id === partnerId) || starters[0];
  const pickGen = (id) => {
    setGen(id);
    setPartnerId(PARTNERS.find((p) => p.gen === id)?.id);
    try { localStorage.setItem(GEN_KEY, String(id)); } catch { /* stockage indisponible */ }
  };
  const pool = GEN_POOLS[gen];
  const endlessOpen = Object.keys(meta.legends || {}).length > 0;
  const runMode = endlessOpen ? mode : 'classic';
  const maxRank = Math.min(MAX_RANK, meta.ranks?.[gen] || 0);
  useEffect(() => { setRank((r) => Math.min(r, maxRank)); }, [gen, maxRank]);

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
      onAltar: (options) => setAltar(options),
      onEnd: (result, snap) => {
        const rec = recordRun(metaRef.current, {
          t: snap.t, kills: snap.kills, level: snap.level, bosses: snap.bosses, result, daily: dailyRef.current,
          killsBy: snap.killsBy, partnerId: partner.id, gen, reachedFinal: snap.reachedFinal, mega: snap.isMega,
          maxWeapon: snap.maxWeapon, weapons: snap.weaponCount, passives: snap.passiveCount,
          rocks: snap.rocks, noHit: snap.noHit, dashes: snap.dashes,
          rank: runRef.current.rank, biome: runRef.current.biome, finalBoss: snap.finalBoss, met: snap.met,
          missions: snap.missions, alphaKills: snap.alphaKills, alphaBy: snap.alphaBy, endless: snap.endless, endlessWave: snap.endlessWave,
          finalDown: snap.finalDown, blessDust: snap.blessDust, ults: snap.ults, altarsUsed: snap.altarsUsed, weaponIds: snap.weapons.map((w) => w.id)
        });
        setMeta(rec.meta);
        setEnd({ result, ...snap, reward: rec });
        postRun('swarm', {
          gen, mode: dailyRef.current ? 'daily' : snap.endless ? 'endless' : 'classic', partnerId: partner.id, form: snap.form.name, formDex: String(snap.form.dex),
          result, t: snap.t, kills: snap.kills, level: snap.level, rank: runRef.current.rank, missions: (snap.missions || []).filter((m) => m.done).length
        });
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
    }, world, gen, { ...metaEffects(metaRef.current, dailyRef.current?.mod, runRef.current.rank), roster: runRef.current.roster, endless: runRef.current.endless });
    gameRef.current = game;
    const timer = setInterval(() => setHud(game.snapshot()), 100);
    return () => {
      clearInterval(timer);
      game.destroy();
      gameRef.current = null;
    };
  }, [screen, run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end) || Boolean(altar));
  }, [paused, levelUp, end, altar]);

  const runRef = useRef({ rank: 0, biome: null, roster: null, endless: false });
  const start = (dly = null, forGen = gen) => {
    dailyRef.current = dly && dly.key ? dly : null;
    // Nouvelle carte et nouveau roster à chaque partie (identiques pour tout le monde au défi du jour)
    const seed = dailyRef.current ? [...dailyRef.current.key].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 17) : Math.floor(Math.random() * 1e9);
    const rng = dailyRef.current ? seededRng(seed) : Math.random;
    const roster = buildRoster(forGen, rng);
    // La carte suivante est préparée à l'avance (menu, écran de fin) pour un départ instantané
    const w = (!dailyRef.current && nextWorldRef.current) || buildWorld(seed);
    nextWorldRef.current = null;
    w.setStatues([FOES[roster.minis[0]].dex, FOES[roster.minis[1]].dex, FOES[roster.final].dex]);
    runRef.current = { rank: dailyRef.current ? 0 : rank, biome: w.biome, roster, endless: !dailyRef.current && runMode === 'endless' };
    setWorld(w);
    setPanel(null);
    setEnd(null);
    setLevelUp(null);
    setAltar(null);
    setPaused(false);
    setHud(null);
    setRun((n) => n + 1);
    setScreen('play');
  };

  const playDaily = () => {
    setGen(daily.gen);
    setPartnerId(daily.partnerId);
    start(daily, daily.gen);
  };
  const unlocked = Boolean(meta.regions[gen]);

  const bless = (id) => {
    setAltar(null);
    gameRef.current?.chooseBlessing(id);
  };
  const ult = ultimateOf(partner);
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
            <p>Survis aux hordes sauvages pendant 9 minutes, puis bats le Pokémon légendaire de la région. Ennemis, boss et décor changent à chaque partie. Tes attaques partent toutes seules : à toi de bouger, de remplir tes 3 missions, de trouver les autels et de déchaîner ton ultime au bon moment.</p>
          </div>
          <div className="sw-head-side">
            <AccountChip returnHash="#swarm" compact />
            <span className="sw-dust" title="Poussière Étoile : gagnée à chaque partie">✦ {meta.dust.toLocaleString('fr-FR')}</span>
            <button type="button" className="sw-btn is-ghost" onClick={onClose}>Quitter</button>
          </div>
        </header>
        <div className="sw-metabar">
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('talents')}>
            Talents <small>{Object.values(meta.talents).reduce((a, b) => a + b, 0)} pts</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('moves')}>
            Capacités <small>{UNLOCKABLES.filter((u) => meta.unlocks?.[u.id]).length}/{UNLOCKABLES.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('achievements')}>
            Défis <small>{Object.keys(meta.achievements).length}/{ACHIEVEMENTS.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('dex')}>
            Pokédex <small>{ALL_FOE_IDS.filter((id) => meta.dex[id] > 0).length}/{ALL_FOE_IDS.length}</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('board')}>
            Classement <small>en ligne</small>
          </button>
          <button type="button" className="sw-btn is-small is-meta" onClick={() => setPanel('history')}>
            Historique <small>{(meta.history || []).length}</small>
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
        <div className="sw-pool">
          <div>
            <span className="sw-kicker">Légendaires possibles</span>
            <div className="sw-pool-row">
              {pool.finals.map((id) => (
                <span key={id} className={`sw-pool-mon${meta.legends?.[id] ? ' is-beaten' : ''}`} title={meta.legends?.[id] ? `${FOES[id].name} : déjà vaincu` : FOES[id].name}>
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
                <span key={id} className="sw-pool-mon" title={FOES[id].name}>
                  <PmdSprite dex={FOES[id].dex} anim="idle" size={52} scale={0.7} foot={0.9} still />
                  <small>{FOES[id].name}</small>
                </span>
              ))}
            </div>
          </div>
          <div className="sw-rank">
            <span className="sw-kicker">Rang de menace</span>
            <div className="sw-rank-row" role="radiogroup" aria-label="Rang de menace">
              {Array.from({ length: MAX_RANK + 1 }, (_, r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={r === rank}
                  disabled={r > maxRank}
                  className={`sw-rank-pip${r === rank ? ' is-on' : ''}`}
                  title={r > maxRank ? `Gagne au rang ${r - 1} dans cette région pour le débloquer` : rankLabel(r)}
                  onClick={() => setRank(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <small>{rankLabel(rank)}</small>
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
          </div>
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
          <span><b>Ultime</b> R ou le bouton : chaque K.O. remplit la jauge. {ult.name} : {ult.desc}</span>
          <span><b>Autels</b> 3 par carte (violets sur la mini-carte) : reste dessus 2 s pour choisir une bénédiction</span>
          <span><b>Alpha</b> vers 2:30 et 5:30, un Pokémon géant à l’aura rouge débarque : il lâche un coffre</span>
          <span><b>Missions</b> 3 objectifs par partie : XP, soin et Poussière à la clé</span>
        </div>
        {unlocked
          ? <button type="button" className="sw-btn is-go" onClick={() => start()}>{runMode === 'endless' ? `Survie infinie avec ${partner.name}` : `Partir avec ${partner.name}`}</button>
          : (
            <button type="button" className="sw-btn is-go is-unlock" disabled={meta.dust < REGION_COST[gen]} onClick={() => setMeta(unlockRegion(meta, gen))}>
              {meta.dust < REGION_COST[gen] ? `Région verrouillée : ${REGION_COST[gen]} ✦ (il t'en manque ${REGION_COST[gen] - meta.dust})` : `Débloquer ${GENS.find((g) => g.id === gen)?.name} : ${REGION_COST[gen]} ✦`}
            </button>
          )}
        {panel && <MetaPanel panel={panel} meta={meta} setMeta={setMeta} onClose={() => setPanel(null)} />}
        <p className="sw-credit">Sprites animés : PMDCollab SpriteCollab (CC BY-NC 4.0) · Méga-Évolutions manquantes : sprites de la communauté pokeemerald-expansion (RHH) · Pokémon © Nintendo / Game Freak</p>
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
              <span className="sw-slot is-passive" style={{ '--c': (megaOf(partner, h.megaChoice) || partner.mega).color || '#ff6ad5' }} title={(megaOf(partner, h.megaChoice) || partner.mega).stone}>
                {h.isMega ? h.form.name : (megaOf(partner, h.megaChoice) || partner.mega).stone}<Pips lv={h.isMega ? MAX_LEVEL : Math.round((h.megaLv / h.megaLevels) * MAX_LEVEL)} />
              </span>
            )}
            {partner.trait === 'turbo' && h.turbo > 0.05 && <span className="sw-slot" style={{ '--c': '#ff7a3a' }}>Turbo +{Math.round(h.turbo * 40)} %</span>}
            {h.passives.map((p) => (
              <span key={p.id} className="sw-slot is-passive" style={{ '--c': PASSIVES[p.id].color }} title={PASSIVES[p.id].name}>
                {PASSIVES[p.id].name}<Pips lv={p.lv} />
              </span>
            ))}
          </div>
          {h.missions?.length > 0 && (
            <div className={`sw-missions${h.boss ? ' is-low' : ''}`}>
              <span className="sw-kicker">{h.endless ? `Survie infinie${h.endlessWave ? ` · vague ${h.endlessWave}` : ''}` : 'Missions'}</span>
              <Missions list={h.missions} compact />
            </div>
          )}
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
          <button
            type="button"
            className={`sw-ult${h.ult >= 1 ? ' is-ready' : ''}`}
            style={{ '--k': Math.min(1, h.ult || 0), '--c': h.ultColor }}
            title={`${h.ultName} : ${ult.desc}`}
            onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.ultimate(); }}
          >
            <b>Ultime</b><small>{h.ult >= 1 ? 'R : prêt !' : `${Math.floor((h.ult || 0) * 100)} %`}</small>
          </button>
        </div>
      )}

      {levelUp && !end && !altar && (
        <div className="sw-modal">
          <div className="sw-card is-deal">
            <span className="sw-kicker">Niveau {levelUp.level}</span>
            <h2>{levelUp.options[0]?.kind === 'evo' ? 'Choisis ton évolution' : 'Pioche une carte'}</h2>
            <div className="sw-choices is-tcg" key={levelUp.options.map((o) => o.kind + o.id + o.lv).join('|')}>
              {levelUp.options.map((opt, i) => (
                <TcgCard key={`${opt.kind}-${opt.id}`} opt={opt} partner={partner} formDex={hud?.form?.dex ?? partner.dex} index={i} onPick={choose} gen={gen} megaLevels={hud?.megaLevels} />
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
                  <i aria-hidden="true" />
                  <b>{b.name}</b>
                  <small>{b.desc}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {paused && !levelUp && !end && !altar && (
        <div className="sw-modal">
          <div className="sw-card is-pause">
            <h2 className="sw-pause-title">Pause</h2>
            <div className="sw-pause-main">
              {h && <RunRecap h={h} partner={partner} />}
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
            <h2>{end.result === 'win' ? `${FOES[end.finalBoss]?.name || 'Le légendaire'} est K.O. !` : end.endless ? `${end.form.name} a tenu ${clock(end.t)}` : `${end.form.name} est K.O.`}</h2>
            <p>{clock(end.t)} · niveau {end.level} · {end.kills} Pokémon mis K.O. · {BIOMES[runRef.current.biome]?.name}{runRef.current.rank ? ` · rang ${runRef.current.rank}` : ''}</p>
            {end.reward?.rankUp > 0 && <p className="sw-rankup">Rang {end.reward.rankUp} débloqué dans cette région !</p>}
            {end.endless && <p className="sw-rankup">{end.reward?.endlessRecord ? 'Nouveau record de survie' : 'Survie infinie'} : {clock(end.t)}{end.endlessWave ? ` · ${end.endlessWave} vague${end.endlessWave > 1 ? 's' : ''} infinie${end.endlessWave > 1 ? 's' : ''}` : ''}</p>}
            {end.missions?.length > 0 && <div className="sw-end-missions"><Missions list={end.missions} compact /></div>}
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

export { PmdSprite, TcgCard, MusicControls, RunRecap, Missions, Pips };
