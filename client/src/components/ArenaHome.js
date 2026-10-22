import React, { useMemo, useState } from 'react';
import GameHome, { HomeBoard, HomeIcon } from './GameHome';
import GamePage, { BoardPage, PageHead, Section, Stat, useKeys } from './GamePage';
import { AccountChip } from './account';
import { CHAMPIONS } from './pokeArenaTrainers';
import { trainerSprite } from './pokeArenaCampaign';
import { STARTER_LINES, unitFromLine } from './pokeArenaData';
import { displayName } from './PokeArenaUI';
import './ArenaHome.css';

const itemSprite = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
const clock = (s) => {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/* ——— Carnet de dresseur : les parties solo terminées, gardées sur l'appareil (et sur le compte) ——— */
export const RECORD_KEY = 'poke-arena-record';
export const blankRecord = () => ({ v: 1, runs: 0, wins: 0, best: 0, history: [] });
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
  history: [run, ...(rec.history || [])].slice(0, 20)
});

/** Une carte rare en éventail : illustration HOME, cadre doré, reflet holographique. */
const FanCard = ({ unit, tilt, label }) => {
  const [idx, setIdx] = useState(0);
  const chain = [unit?.home, unit?.art, unit?.sprite].filter(Boolean);
  if (!unit) return null;
  return (
    <span className="ah-card" style={{ '--tilt': `${tilt}deg`, '--drop': `${Math.abs(tilt) * 1.2}px`, '--delay': `${tilt * 0.08}s` }}>
      <span className="ah-card-art">
        {idx < chain.length
          ? <img src={chain[idx]} alt="" draggable={false} onError={() => setIdx((i) => i + 1)} />
          : <span className="ah-card-fb" />}
      </span>
      <span className="ah-card-name">{label}</span>
      <span className="ah-card-holo" />
    </span>
  );
};

const Trainer = ({ id, className }) => {
  const [broken, setBroken] = useState(false);
  if (!id || broken) return null;
  return <img className={className} src={trainerSprite(id)} alt="" draggable={false} onError={() => setBroken(true)} />;
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
const ArenaHome = ({ onClose, save, onContinue, onNew, onMulti, onCodex, music, skinLabel, onSkin, myTrainer, record, regionOf }) => {
  const [howto, setHowto] = useState(false);
  const [carnet, setCarnet] = useState(false);
  const champ = CHAMPIONS[Math.floor(Date.now() / 60000) % CHAMPIONS.length];
  const fan = useMemo(() => {
    const lines = [...STARTER_LINES].sort(() => Math.random() - 0.5).slice(0, 3);
    return lines.map((l) => unitFromLine(l.id, 3)).filter(Boolean);
  }, []);
  const last = record.history?.[0];
  const saved = save && save.map?.length ? save : null;
  const total = saved?.map.length || 32;

  const play = saved
    ? { title: 'Continuer', sub: `Étape ${saved.floor + 1}/${total} · ${regionOf(saved)} · ${saved.hp} PV`, onClick: onContinue }
    : { title: 'Jouer', sub: 'Nouvelle aventure · 3 régions jusqu’à la Ligue', onClick: onNew };
  const side = saved
    ? { title: 'Nouvelle', sub: 'partie', art: <HomeIcon src={itemSprite('poke-ball')} fallback="●" />, onClick: onNew }
    : { title: 'Multi', sub: 'Salon en ligne', art: <HomeIcon src={itemSprite('link-cable')} fallback="⇄" />, onClick: onMulti };

  const ARENA_TABS = [
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
                    <small>{h.mvp ? `MVP ${h.mvp} · ` : ''}niv. {h.level} · {h.wins} combats gagnés{h.t ? ` · ${clock(h.t)}` : ''}</small>
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
    <div className="ah-wrap">
      <GameHome
        theme="gh-arena"
        backdrop={<ArenaScene />}
        topLeft={(
          <>
            <button type="button" className="gh-pill is-plain" onClick={onClose}>← Bully’s Lair</button>
            <button type="button" className="gh-pill is-plain" onClick={() => setHowto(true)}>Comment jouer</button>
          </>
        )}
        topRight={(
          <>
            <AccountChip returnHash="#arena" />
            <span className="gh-pill" title="Parties terminées">{record.runs} parties</span>
            <span className="gh-pill is-strong" title="Ligues remportées">♛ {record.wins}</span>
          </>
        )}
        logo={(
          <div className="ah-logo">
            <span className="ah-kicker">Salle des Champions</span>
            <h1>Poké Bully <em>Tactics</em></h1>
          </div>
        )}
        stage={(
          <>
            <Trainer id={myTrainer} className="ah-trainer is-me" />
            <span className="ah-fan">
              {fan.map((u, i) => <FanCard key={u.lineId || i} unit={u} tilt={(i - 1) * 12} label={displayName(u.name)} />)}
            </span>
            <Trainer id={champ.sprite} className="ah-trainer is-champ" />
          </>
        )}
        play={{ ...play, art: <span className="ah-play-crest">♛</span> }}
        side={side}
        cards={[
          {
            key: 'champ', tone: 'event', kicker: `Maître de la Ligue · ${champ.region}`,
            title: `${champ.name} t’attend au sommet`,
            sub: `Équipe ${champ.types.join(' / ')}`,
            art: <Trainer id={champ.sprite} className="ah-mini-trainer" />,
            onClick: saved ? onContinue : onNew
          },
          last ? {
            key: 'last', tone: last.result === 'win' ? 'done' : 'light', kicker: 'Dernière partie',
            title: last.result === 'win' ? 'Ligue conquise !' : `Arrêt à l’étape ${last.floor}`,
            sub: `${last.mvp ? `MVP ${last.mvp}` : ''}${last.mvp ? ' · ' : ''}${last.wins} combats gagnés`,
            art: <HomeIcon src={last.mvpArt} fallback="★" />,
            onClick: () => setCarnet(true)
          } : {
            key: 'multi', tone: 'light', kicker: 'Entre amis',
            title: 'Salon multijoueur',
            sub: 'Jusqu’à 8 dresseurs, le dernier debout gagne',
            art: <HomeIcon src={itemSprite('link-cable')} fallback="⇄" />,
            onClick: onMulti
          }
        ]}
        tiles={[
          { key: 'dex', label: 'Pokédex', value: 'lignées', color: '#d25a42', icon: <HomeIcon src={itemSprite('poke-ball')} fallback="●" />, onClick: onCodex },
          { key: 'multi', label: 'Multi', value: 'en ligne', color: '#7b98dc', icon: <HomeIcon src={itemSprite('link-cable')} fallback="⇄" />, onClick: onMulti },
          { key: 'carnet', label: 'Carnet', value: `record ${record.best || 0}`, color: '#e9c46a', icon: <HomeIcon src={itemSprite('town-map')} fallback="☰" />, onClick: () => setCarnet(true) },
          { key: 'skin', label: 'Style', value: skinLabel, color: '#a77bd9', icon: <HomeIcon src={itemSprite('dawn-stone')} fallback="✦" />, onClick: onSkin }
        ]}
        links={<span className="ah-music">{music}</span>}
        board={(
          <HomeBoard
            game="arena"
            gen={1}
            title="Hall de la Ligue"
            subtitle="Meilleure partie de chaque dresseur"
            describe={(r) => `${r.form || 'Équipe'} · niv. ${r.level}`}
            tabs={[
              { id: 'fastest', label: 'Maîtres', value: (r) => clock(r.t), unit: 'temps' },
              { id: 'kills', label: 'Plus loin', value: (r) => `${r.kills}`, unit: 'étape' }
            ]}
            empty="Aucun Maître pour l’instant : le titre est à prendre !"
            onMore={() => setCarnet('board')}
          />
        )}
        footer="Fan-game non officiel, gratuit et sans but lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company. Sprites de dresseurs : Pokémon Showdown."
      />
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
