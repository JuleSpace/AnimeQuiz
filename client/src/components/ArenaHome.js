import React, { useEffect, useMemo, useState } from 'react';
import { HomeIcon } from './GameHome';
import GamePage, { BoardPage, PageHead, Section, Stat, useKeys } from './GamePage';
import { AccountChip, fetchLeaderboard } from './account';
import { CHAMPIONS } from './pokeArenaTrainers';
import { trainerSprite } from './pokeArenaCampaign';
import { STARTER_LINES, spriteUrl, unitFromLine } from './pokeArenaData';
import { displayName, playerTrainerSprite, useStageUnit } from './PokeArenaUI';
import './ArenaHome.css';

const itemSprite = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
const clock = (s) => {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/* ——— Carnet de dresseur : les parties solo terminées, gardées sur l'appareil (et sur le compte) ——— */
export const RECORD_KEY = 'poke-arena-record';
export const blankRecord = () => ({ v: 1, runs: 0, wins: 0, best: 0, bestScore: 0, history: [] });
export const loadRecord = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECORD_KEY) || 'null');
    return raw && typeof raw === 'object' ? { ...blankRecord(), ...raw } : blankRecord();
  } catch { return blankRecord(); }
};
export const saveRecord = (r) => {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(r)); } catch { /* stockage indisponible */ }
};
export const addToRecord = (rec, run) => ({
  ...rec,
  runs: rec.runs + 1,
  wins: rec.wins + (run.result === 'win' ? 1 : 0),
  best: Math.max(rec.best, run.floor),
  bestScore: Math.max(rec.bestScore || 0, run.score || 0),
  history: [run, ...(rec.history || [])].slice(0, 20)
});

const Trainer = ({ id, className }) => {
  const [broken, setBroken] = useState(false);
  if (!id || broken) return null;
  return <img className={className} src={trainerSprite(playerTrainerSprite(id))} alt="" draggable={false} onError={() => setBroken(true)} />;
};

/* ——— Accueil « Nuit holo × manga » : mise en page de la maquette 1280×720, mise à l'échelle de l'écran ——— */
const HERO_DEX = [150, 249, 250, 384, 483, 484, 487, 643, 644, 716, 717, 791, 792, 888, 889];
const HeroMon = ({ dex, small = false }) => {
  const [broken, setBroken] = useState(false);
  if (!dex || broken) return <span className={small ? 'ah2-mon-fb' : 'ah2-mon is-fb'}>★</span>;
  return <img className={small ? 'ah2-cardmon' : 'ah2-mon'} src={spriteUrl(dex)} alt="" draggable={false} onError={() => setBroken(true)} />;
};

const HallRows = () => {
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchLeaderboard('arena', 1).then((b) => { if (alive) setBoard(b); });
    return () => { alive = false; };
  }, []);
  const rows = (board?.score || []).slice(0, 3);
  if (!board) return <div className="ah2-row is-empty">Chargement…</div>;
  if (!rows.length) return <div className="ah2-row is-empty">Aucun Maître pour l’instant : le titre est à prendre !</div>;
  return rows.map((r, i) => (
    <div key={`${r.name}-${i}`} className={`ah2-row${i === 0 ? ' ah2-holo is-first' : ''}`}>
      <span>{i + 1} · {r.name}{r.form ? ` · ${r.form}` : ''}</span>
      <b>{(r.score || 0).toLocaleString('fr-FR')} pts</b>
    </div>
  ));
};

const ArenaScene = () => (
  <div className="ah-scene" aria-hidden="true">
    <span className="ah-glow" />
    <span className="ah-beam is-1" /><span className="ah-beam is-2" /><span className="ah-beam is-3" />
    <span className="ah-floor"><i /></span>
    <span className="ah-dust" />
  </div>
);

/** Habille un écran du jeu (sélection, Pokédex, salon) avec l'en-tête commun des menus. */
export const ArenaFrame = ({ title, subtitle, onBack, right, children }) => {
  useKeys(onBack);
  return (
    <div className="gp-frame gh-arena ah-frame">
      <PageHead title={title} subtitle={subtitle} onBack={onBack} right={right} />
      {children}
    </div>
  );
};

/**
 * Accueil de Poké Bully Tactics : salle des champions, cartes rares en éventail, carnet de dresseur.
 */
const ArenaHome = ({ onClose, save, onContinue, onNew, onMulti, onCodex, music, myTrainer, record, regionOf }) => {
  const [howto, setHowto] = useState(false);
  const [carnet, setCarnet] = useState(false);
  const champ = CHAMPIONS[Math.floor(Date.now() / 60000) % CHAMPIONS.length];
  const fan = useMemo(() => {
    const lines = [...STARTER_LINES].sort(() => Math.random() - 0.5).slice(0, 3);
    return lines.map((l) => unitFromLine(l.id, 3)).filter(Boolean);
  }, []);
  const u = useStageUnit();
  const heroDex = useMemo(() => HERO_DEX[Math.floor(Math.random() * HERO_DEX.length)], []);
  const saved = save && save.map?.length ? save : null;
  const total = saved?.map.length || 32;

  const play = saved
    ? { title: 'Continuer', sub: `Étape ${saved.floor + 1}/${total} · ${regionOf(saved)} · ${saved.hp} PV`, onClick: onContinue }
    : { title: 'Jouer', sub: 'Nouvelle aventure · 3 régions jusqu’à la Ligue', onClick: onNew };

  const ARENA_TABS = [
    { id: 'score', label: 'Score', sub: 'Meilleur score', value: (r) => (r.score || 0).toLocaleString('fr-FR'), unit: 'pts' },
    { id: 'fastest', label: 'Maîtres', sub: 'Ligue la plus rapide', value: (r) => clock(r.t), unit: '' },
    { id: 'kills', label: 'Plus loin', sub: 'Étape atteinte', value: (r) => `${r.kills}`, unit: 'étape' }
  ];
  if (carnet === 'board') {
    return (
      <GamePage theme="gh-arena" backdrop={<ArenaScene />} title="Hall de la Ligue" subtitle="Records du serveur" onBack={() => setCarnet(false)}>
        <BoardPage game="arena" gens={[{ id: 1, name: 'Ligue Pokémon' }]} tabs={ARENA_TABS} describe={(r) => `MVP ${r.form || '—'} · niv. ${r.level}`} />
      </GamePage>
    );
  }
  if (carnet) {
    return (
      <GamePage
        theme="gh-arena"
        backdrop={<ArenaScene />}
        title="Carnet de dresseur"
        subtitle="Tes parties solo terminées"
        onBack={() => setCarnet(false)}
        right={(
          <>
            <Stat label="Parties" value={record.runs} />
            <Stat label="Ligues" value={`♛ ${record.wins}`} strong />
            <Stat label="Étape record" value={`${record.best || 0}/32`} max={32} />
          </>
        )}
      >
        <Section title="Dernières parties" count={record.history?.length || 0}>
          {record.history?.length ? (
            <div className="gp-hist">
              {record.history.map((h) => (
                <div key={h.at} className={`gp-hist-row${h.result === 'win' ? ' is-win' : ''}`}>
                  <span className="gp-hist-face"><HomeIcon src={h.mvpArt} fallback="★" /></span>
                  <span>
                    <b>{h.result === 'win' ? 'Maître de la Ligue !' : `Arrêt à l’étape ${h.floor}`}</b>
                    <small>{h.score ? `${h.score.toLocaleString('fr-FR')} pts · ` : ''}{h.mvp ? `MVP ${h.mvp} · ` : ''}niv. {h.level} · {h.wins} combats gagnés{h.t ? ` · ${clock(h.t)}` : ''}</small>
                  </span>
                  <time>{new Date(h.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
                </div>
              ))}
            </div>
          ) : <p className="gp-note">Aucune partie terminée pour l’instant : lance-toi !</p>}
        </Section>
      </GamePage>
    );
  }

  return (
    <div className="ah-wrap ah2" style={{ '--u': `${u}px` }}>
      <section className="ah2-panel ah2-hero">
        <span className="ah2-tone" aria-hidden="true" />
        <span className="ah2-lines" aria-hidden="true" />
        <HeroMon dex={heroDex} />
        <div className="ah2-logo">
          <b>POKÉ BULLY</b>
          <em>TACTICS</em>
        </div>
        <span className="ah2-bubble">Je deviendrai Maître !</span>
        <nav className="ah2-mini">
          <button type="button" onClick={onClose} title="Retour au Bully’s Lair">← Lair</button>
          <button type="button" onClick={() => setHowto(true)} title="Comment jouer">?</button>
          <span className="ah2-music">{music}</span>
          <AccountChip returnHash="#arena" />
        </nav>
      </section>

      <button type="button" className="ah2-play ah2-holo" onClick={play.onClick}>
        <b>{saved ? 'CONTINUER' : 'JOUER'}</b>
        <small>{saved ? `Étape ${saved.floor + 1}/${total} · ${regionOf(saved)}` : 'Chapitre 1 · Kanto'}</small>
      </button>

      <div className={`ah2-tiles${saved ? ' is-4' : ''}`}>
        {saved && <button type="button" className="ah2-panel ah2-tile" onClick={onNew}>NOUVELLE<small>partie</small></button>}
        <button type="button" className="ah2-panel ah2-tile" onClick={onMulti}>MULTI<small>jusqu’à 8</small></button>
        <button type="button" className="ah2-panel ah2-tile" onClick={onCodex}>POKÉDEX<small>lignées</small></button>
        <button type="button" className="ah2-panel ah2-tile" onClick={() => setCarnet(true)}>CARNET<small>{record.runs} parties · ♛ {record.wins}</small></button>
      </div>

      <section className="ah2-panel ah2-season">
        <h2>LES CARTES DE LA SAISON</h2>
        <div className="ah2-fan">
          {fan.map((u2, i) => (
            <span key={u2.lineId || i} className={`ah2-card${i === 1 ? ' is-mid' : ''}`} style={{ '--r': `${(i - 1) * 9}deg` }}>
              <span className="ah2-card-in">
                <HeroMon dex={u2.dex} small />
                <b>{displayName(u2.name)}</b>
                {i === 1 && <small>★★★</small>}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="ah2-panel ah2-hall">
        <h2>HALL DE LA <span className="ah2-holotxt">LIGUE</span></h2>
        <HallRows />
        <button type="button" className="ah2-more" onClick={() => setCarnet('board')}>Classement complet ›</button>
        <p className="ah2-champ">
          <Trainer id={champ.sprite} className="ah2-champ-face" />
          <span><b>{champ.name}</b> t’attend au sommet · Maître de {champ.region}, équipe {champ.types.join(' / ')}</span>
        </p>
      </section>
      <footer className="ah2-foot">Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites de dresseurs : Pokémon Showdown.</footer>

      {howto && (
        <div className="ah-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) setHowto(false); }}>
          <div className="ah-sheet">
            <header><b>Comment jouer</b><button type="button" className="gh-pill" onClick={() => setHowto(false)}>Fermer</button></header>
            <p>Recrute des Pokémon dans la boutique, place-les sur le terrain et regarde-les se battre tout seuls. Traverse trois régions jusqu’à la Ligue et son Maître.</p>
            <ul>
              <li><b>Fusion</b> trois exemplaires identiques fusionnent et évoluent (★★, puis ★★★).</li>
              <li><b>Placement</b> glisse tes Pokémon : devant, ils encaissent ; derrière, ils tirent.</li>
              <li><b>Synergies</b> plusieurs Pokémon du même type ou de la même famille activent des bonus.</li>
              <li><b>Objets</b> combine deux composants pour forger un objet puissant.</li>
              <li><b>Or</b> les intérêts récompensent l’épargne, les séries rapportent un bonus.</li>
              <li><b>Carte</b> choisis ta route : combats, Boutiques, événements, rivaux et champions.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaHome;
