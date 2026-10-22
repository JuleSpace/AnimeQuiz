import React, { useEffect, useRef, useState } from 'react';
import { createRush } from './rushEngine';
import { loadRush, recordRush, rushEffects, saveRush } from './rushData';
import { FAMILIES, FAMILY, applyRunToLeague, isMember, leagueSpawns, migrateLeague, statusOf } from './rushLeague';
import {
  RushAltar, RushEnd, RushHome, RushHowto, RushHud, RushLeague, RushLevelUp, RushMeta, RushPause, RushPrep
} from './RushUI';
import { rushScore } from './scoring';
import { musicPlayer } from './pokeArenaMusic';
import { postRun, useCloudSync } from './account';

export const RUSH_HASH = '#pokerush';
const MUSIC_KEY = 'poke-arena-music';
const PARTNER_KEY = 'poke-rush-partner';

const savedPartner = () => { try { return localStorage.getItem(PARTNER_KEY) || 'bulbasaur'; } catch { return 'bulbasaur'; } };

const PokeRush = ({ onClose }) => {
  const [screen, setScreen] = useState('home');
  const [howto, setHowto] = useState(false);
  const [meta, setMetaState] = useState(() => migrateLeague(loadRush()));
  const metaRef = useRef(meta);
  const setMeta = (m) => { metaRef.current = m; setMetaState(m); };
  useCloudSync('rush', meta, (remote) => { saveRush({ ...remote }); setMeta(migrateLeague(loadRush())); }, (m) => m?.total || 0);
  const [partnerId, setPartnerIdState] = useState(savedPartner);
  const setPartnerId = (id) => { setPartnerIdState(id); try { localStorage.setItem(PARTNER_KEY, id); } catch { /* stockage indisponible */ } };
  const [leagueFocus, setLeagueFocus] = useState(null);
  const [hud, setHud] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [altar, setAltar] = useState(null);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState(null);
  const [panel, setPanel] = useState('shop');
  const [run, setRun] = useState(0);
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const gameRef = useRef(null);
  const chosen = FAMILY[partnerId];
  const partner = chosen && isMember(meta, chosen) ? chosen : FAMILY.bulbasaur;

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
    const m0 = metaRef.current;
    const game = createRush(mountRef.current, overlayRef.current, partner, {
      onLevelUp: (options, level, rerolls) => setLevelUp({ options, level, rerolls }),
      onAltar: (options) => setAltar(options),
      onEnd: (result, snap) => {
        const missionsDone = snap.missions.filter((m) => m.done).length;
        const sc = rushScore({ result, t: snap.t, kills: snap.kills, level: snap.level, caught: snap.caught.length, bosses: snap.bosses, alphaKills: snap.alphaKills, missions: missionsDone });
        const rec = recordRush(metaRef.current, {
          score: sc.total,
          result, t: snap.t, kills: snap.kills, level: snap.level, caught: snap.caught, met: snap.met, bosses: snap.bosses,
          missions: missionsDone, partnerId: partner.id, form: snap.form
        });
        const lg = applyRunToLeague(rec.meta, {
          result, t: snap.t, kills: snap.kills, level: snap.level, caughtCount: snap.caught.length, bosses: snap.bosses, missions: missionsDone,
          typeKills: snap.typeKills, caughtTypes: snap.caughtTypes, leagueCaught: snap.leagueCaught, dashes: snap.dashes, berries: snap.berries,
          evolutions: snap.evolutions, coinsTotal: snap.coinsTotal, chests: snap.chests, altars: snap.altars, superHits: snap.superHits,
          noHit: snap.noHit, ults: snap.ults, alphas: snap.alphaKills
        });
        setMeta(lg.meta);
        setEnd({ result, ...snap, reward: rec, score: sc, league: { joined: lg.joined, ready: lg.ready } });
        postRun('rush', {
          score: sc.total,
          gen: 1, mode: 'classic', partnerId: partner.id, form: snap.form.name, formDex: String(snap.form.dex), result, t: snap.t, kills: snap.kills,
          level: snap.level, caught: snap.caught.length, missions: missionsDone
        });
      },
      onPauseKey: () => setPaused((v) => !v)
    }, {
      ...rushEffects(m0),
      leagueReady: FAMILIES.filter((f) => statusOf(m0, f) === 'ready').map((f) => f.id),
      leagueSpawns: leagueSpawns(m0)
    });
    gameRef.current = game;
    const timer = setInterval(() => setHud(game.snapshot()), 100);
    return () => { clearInterval(timer); game.destroy(); gameRef.current = null; };
  }, [screen, run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameRef.current) gameRef.current.setPaused(paused || Boolean(levelUp) || Boolean(end) || Boolean(altar));
  }, [paused, levelUp, end, altar]);

  const start = () => {
    setEnd(null); setLevelUp(null); setAltar(null); setPaused(false); setHud(null);
    setRun((n) => n + 1);
    setScreen('play');
  };
  const choose = (opt) => { setLevelUp(null); gameRef.current?.choose(opt); };
  const reroll = () => {
    const options = gameRef.current?.reroll();
    if (options) setLevelUp((cur) => ({ ...cur, options, rerolls: cur.rerolls - 1 }));
  };
  const bless = (id) => { setAltar(null); gameRef.current?.chooseBlessing(id); };
  const openLeague = (focus = null) => { setLeagueFocus(focus); setScreen('league'); };

  if (screen === 'home') {
    return (
      <>
        <RushHome
          meta={meta}
          partner={partner}
          onAction={(id, arg) => {
            if (id === 'play') setScreen('prep');
            else if (id === 'league') openLeague(arg || null);
            else if (id === 'howto') setHowto(true);
            else if (id === 'quit') onClose();
            else { setPanel(id); setScreen('meta'); }
          }}
        />
        {howto && <RushHowto partner={partner} onClose={() => setHowto(false)} />}
      </>
    );
  }

  if (screen === 'league') {
    return (
      <RushLeague
        meta={meta}
        setMeta={setMeta}
        partnerId={partner.id}
        initial={leagueFocus}
        onPick={(id) => { setPartnerId(id); setScreen('prep'); }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'meta') {
    return <RushMeta panel={panel} setPanel={setPanel} meta={meta} setMeta={setMeta} onBack={() => setScreen('home')} />;
  }

  if (screen === 'prep') {
    return <RushPrep meta={meta} partner={partner} onStart={start} onBack={() => setScreen('home')} onChange={() => openLeague(partner.id)} />;
  }

  const h = hud;
  return (
    <div className="rx-root rx-play">
      <div ref={mountRef} className="pr-mount" />
      <canvas ref={overlayRef} className="pr-overlay" />
      {h && <RushHud h={h} game={() => gameRef.current} onPause={() => setPaused(true)} />}

      {levelUp && !end && !altar && (
        <RushLevelUp data={levelUp} partner={partner} h={h} onPick={choose} onReroll={reroll} onSkip={() => choose({ kind: 'skip', id: 'skip', lv: 0 })} />
      )}
      {altar && !end && <RushAltar options={altar} onPick={bless} />}
      {paused && !levelUp && !end && !altar && h && (
        <RushPause h={h} onResume={() => setPaused(false)} onQuit={() => { setPaused(false); setScreen('home'); }} />
      )}
      {end && (
        <RushEnd end={end} meta={meta} onReplay={start} onLeague={() => openLeague(end.league?.joined?.[0] || null)} onHome={() => setScreen('home')} />
      )}
    </div>
  );
};

export default PokeRush;
