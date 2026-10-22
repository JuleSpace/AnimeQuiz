import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import ArenaBoardIso, { BOARD_THEMES, BOARD_THEME_LABELS, DEFAULT_BOARD_THEME, resolveScene } from './ArenaBoardIso';
import ArenaHome, { ArenaFrame, addToRecord, loadRecord, saveRecord } from './ArenaHome';
import { postRun, useCloudSync } from './account';
import './PokeArena.css';
import './PokeArenaPremium.css';
import {
  BENCH_CAP,
  BOARD_CAP,
  ITEM_MAP,
  ITEM_SLOTS,
  LEVEL_XP,
  LINE_MAP,
  MAX_LEVEL,
  REROLL_COST,
  SHOP_SIZE,
  START_GOLD,
  START_HP,
  XP_COST,
  addXp,
  rollComponent,
  applyEvolutionChoice,
  applyMegaChoice,
  autoSeat,
  buildRunPool,
  clearCampaign,
  emptyBoard,
  enforceBoardCap,
  equipItemOnUnit,
  estimateIncome,
  hasSave,
  loadCampaign,
  mergeUnits,
  rollShop,
  saveCampaign,
  seatFoes,
  simulateFight,
  starterTrio,
  stripItems,
  talentOf,
  unitFromLine,
  withBoardSlots
} from './pokeArenaData';
import {
  CENTER_HEAL,
  TOTAL_FLOORS,
  chapterOf,
  enemyTeam,
  eventOptions,
  fightLoot,
  finalBoss,
  generateMap,
  hasRewardChoice,
  isFightKind,
  lossDamage,
  martStock,
  regionAt,
  rewardChoices,
  trainerSprite
} from './pokeArenaCampaign';
import { musicPlayer } from './pokeArenaMusic';
import {
  VERSUS_MAX_PLAYERS,
  rebuildBoard,
  serializeBoard,
  versusChapter,
  versusLossDamage,
  versusPool,
  versusPoolSize,
  versusStarterCount,
  versusView
} from './pokeArenaVersus';
import {
  CodexScreen,
  EventScreen,
  ComboPreview,
  ItemCraftsPopover,
  ItemIcon,
  MapScreen,
  MartScreen,
  PokeSprite,
  RecipeModal,
  PoolModal,
  ShopOdds,
  PLAYER_TRAINERS,
  ResultOverlay,
  RewardModal,
  StarterScreen,
  TraitPanel,
  TraitPopup,
  TrainerPortrait,
  TypeChip,
  UnitCard,
  VersusLobby,
  VersusOver,
  VersusPlayers,
  chapterLabel,
  displayName,
  stars,
  tint
} from './PokeArenaUI';

export const ARENA_HASH = '#arena';

/** Étiquette de l’adversaire dans la barre du haut. */
const foeLabel = (node) => {
  const t = node.trainer || {};
  if (t.role === 'gym') return `Arène ${t.badge || ''} · ${t.region || ''}`;
  if (t.role === 'e4') return `Conseil 4 · ${t.seat || ''}/4`;
  if (t.role === 'champion') return 'Combat final';
  if (node.kind === 'rival') return 'Rival';
  if (node.kind === 'villain') return t.team || 'Méchants';
  if (node.kind === 'elite') return 'Élite';
  if (t.team) return t.team;
  return 'Adversaire';
};

/** Réplique de l’adversaire dans le bandeau d’avant-combat. */
const bannerLine = (node) => {
  const t = node.trainer || {};
  if (t.role === 'champion') return 'Le titre se joue maintenant !';
  if (t.role === 'e4') return 'Le Conseil 4 ne fait pas de cadeau.';
  if (t.role === 'gym') return 'Montre-moi ce que tu vaux pour mériter mon badge !';
  if (node.kind === 'rival') {
    if (t.meet === 4) return 'Un dernier duel avant la Ligue !';
    return t.meet > 1 ? 'Encore toi ? Cette fois, je gagne !' : 'Mon starter bat le tien, prépare-toi !';
  }
  if (node.kind === 'villain') return 'Personne ne se dresse sur notre route !';
  if (t.team) return 'Tu te mêles de ce qui ne te regarde pas !';
  return 'veut se battre !';
};

const SPEED_KEY = 'poke-arena-speed';
const THEME_KEY = 'poke-arena-board-theme';
const SKIN_KEY = 'poke-arena-skin';
const VS_NAME_KEY = 'poke-arena-vs-name';
const readVsName = () => {
  try {
    return localStorage.getItem(VS_NAME_KEY) || '';
  } catch {
    return '';
  }
};
const ARENA_URL = `${process.env.REACT_APP_SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/arena`;
/** Objets distribués à tous les joueurs à certains rounds du salon multi. */
const versusLoot = (round) => {
  if (round === 8 || round === 14) return ['keystone'];
  if (round % 3 === 0) return [rollComponent().id];
  return [];
};
const SKINS = ['premium', 'classique'];
const SKIN_LABELS = { premium: 'Premium', classique: 'Classique' };
const readSkin = () => {
  try {
    const v = localStorage.getItem(SKIN_KEY);
    return SKINS.includes(v) ? v : 'premium';
  } catch {
    return 'premium';
  }
};
const THEME_IDS = Object.keys(BOARD_THEMES);

const MUSIC_KEY = 'poke-arena-music';
const TRAINER_KEY = 'poke-arena-trainer';
const readMusic = () => {
  try {
    const v = localStorage.getItem(MUSIC_KEY);
    return v == null ? 0.5 : Math.max(0, Math.min(1, Number(v) || 0));
  } catch {
    return 0.5;
  }
};

/** Bouton ♪ : ouvre un petit panneau (titre, vidéo YouTube en cours, volume). */
const MusicControl = ({ volume, onVolume, now }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrap = useRef(null);
  const btn = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(window.innerWidth - 272, r.right - 264)) });
    };
    place();
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('pointerdown', close);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('pointerdown', close);
      setPos(null);
    };
  }, [open]);
  const pct = Math.round(volume * 100);
  return (
    <div className="pa-music" ref={wrap}>
      <button
        ref={btn}
        type="button"
        className={`ui-btn is-small is-ghost pa-music-btn${volume > 0 ? ' is-on' : ''}`}
        title={now ? `♪ ${now.title}` : 'Musique'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {volume > 0 ? '♪' : '♪̸'}
      </button>
      {open && (
        <div className="pa-music-pop" role="dialog" aria-label="Musique" style={pos || undefined}>
          <span className="pa-music-src">En ce moment</span>
          <strong className="pa-music-title">{now?.title || (volume > 0 ? 'La musique démarre…' : 'Musique coupée')}</strong>
          <label className="pa-music-vol">
            <span aria-hidden>{volume > 0 ? '🔊' : '🔇'}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={pct}
              style={{ '--p': `${pct}%` }}
              aria-label="Volume de la musique"
              onChange={(e) => onVolume(Number(e.target.value) / 100)}
            />
            <em>{pct} %</em>
          </label>
          <button type="button" className="ui-btn is-small is-ghost pa-music-next" disabled={!now} onClick={() => musicPlayer().next()}>
            Morceau suivant ⏭
          </button>
        </div>
      )}
    </div>
  );
};
const SPEEDS = [1, 2, 4];

const padBoard = (board) => {
  const next = [...(board || [])];
  while (next.length < 21) next.push(null);
  return next.slice(0, 21);
};

const sellValue = (u) => (u.star <= 1 ? u.cost : u.cost * 3 ** (u.star - 1) - 1);

/** Durée d’affichage d’une image de combat (ms, vitesse ×1). */
const frameDelay = (frame) => {
  const kind = frame?.act?.kind;
  if (kind === 'start') return 500;
  if (kind === 'end') return 450;
  if (kind === 'move') return 190;
  if (kind === 'spell') return 560;
  if (kind === 'strike') return 330;
  return 240;
};

const readSpeed = () => {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 2;
  } catch {
    return 2;
  }
};

const readTheme = () => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_IDS.includes(v) ? v : DEFAULT_BOARD_THEME;
  } catch {
    return DEFAULT_BOARD_THEME;
  }
};

const withTalent = (u) => (u ? { ...u, ab: talentOf(u.lineId, u.formId) } : u);

/** Dresseur debout au bord du terrain, de son côté : l'adversaire en haut à droite, toi en bas à gauche. */
const TrainerStand = ({ sprite, side, label }) => {
  const list = (Array.isArray(sprite) ? sprite : [sprite]).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = trainerSprite(list[idx]);
  if (!src || failed) return null;
  return (
    <div className={`pa-stand is-${side}`} aria-hidden="true" title={label}>
      <img src={src} alt="" draggable={false} onError={() => (idx + 1 < list.length ? setIdx(idx + 1) : setFailed(true))} />
      {label && <span>{label}</span>}
    </div>
  );
};

const PokeArena = ({ onClose }) => {
  const [phase, setPhase] = useState('hub');
  const [stage, setStage] = useState('prep');
  // Run
  const [map, setMap] = useState([]);
  const [floor, setFloor] = useState(0);
  const [path, setPath] = useState([]);
  const [node, setNode] = useState(null);
  const [runPool, setRunPool] = useState([]);
  const [bench, setBench] = useState([]);
  const [board, setBoard] = useState(emptyBoard);
  const [enemyBoard, setEnemyBoard] = useState(emptyBoard);
  const [shop, setShop] = useState([]);
  const [shopLocked, setShopLocked] = useState(false);
  const [bag, setBag] = useState([]);
  const [gold, setGold] = useState(START_GOLD);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(START_HP);
  const [streak, setStreak] = useState(0);
  const [coin, setCoin] = useState(0);
  const [stock, setStock] = useState([]);
  const [eventOpts, setEventOpts] = useState([]);
  const [rewardOpts, setRewardOpts] = useState(null);
  const [musicVol, setMusicVol] = useState(readMusic);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [wins, setWins] = useState(0);
  const [starterId, setStarterId] = useState('');
  const playTimeRef = useRef(0);
  const recordedRef = useRef(false);
  const [record, setRecordState] = useState(loadRecord);
  const setRecord = (r) => { saveRecord(r); setRecordState(r); };
  useCloudSync('arena', record, (remote) => setRecord({ ...loadRecord(), ...remote }), (r) => r?.runs || 0);
  // Interface
  const [toast, setToast] = useState('');
  const [selectedUid, setSelectedUid] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [itemMenu, setItemMenu] = useState(null);
  const [comboHover, setComboHover] = useState(null);
  const openItemMenu = (itemId, e) => {
    e.preventDefault();
    setComboHover(null);
    setItemMenu({ itemId, rect: e.currentTarget.getBoundingClientRect() });
  };
  const closeItemMenu = useCallback(() => setItemMenu(null), []);
  const [hoverUnit, setHoverUnit] = useState(null);
  const [traitPop, setTraitPop] = useState(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const [myTrainer, setMyTrainer] = useState(() => {
    try { return localStorage.getItem(TRAINER_KEY) || 'red'; } catch { return 'red'; }
  });
  useEffect(() => {
    try { localStorage.setItem(TRAINER_KEY, myTrainer); } catch { /* stockage indisponible */ }
  }, [myTrainer]);
  const [canContinue, setCanContinue] = useState(() => hasSave());
  const [evolving, setEvolving] = useState([]);
  const [drag, setDrag] = useState(null);
  // Combat
  const [positions, setPositions] = useState(null);
  const [fxMap, setFxMap] = useState({});
  const [hpMap, setHpMap] = useState({});
  const [floatFx, setFloatFx] = useState([]);
  const [act, setAct] = useState(null);
  const [actKey, setActKey] = useState(0);
  const [fightLine, setFightLine] = useState('');
  const [meter, setMeter] = useState({});
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState(null);
  const [speed, setSpeed] = useState(readSpeed);
  const [boardTheme, setBoardTheme] = useState(readTheme);
  const [skin, setSkin] = useState(readSkin);
  const skinCls = `skin-${skin}`;
  useEffect(() => {
    try { localStorage.setItem(SKIN_KEY, skin); } catch { /* stockage indisponible */ }
  }, [skin]);
  const [saveTick, setSaveTick] = useState(0);
  // Salon multi
  const [mode, setMode] = useState('solo');
  const [vsName, setVsName] = useState(readVsName);
  const [vsRoom, setVsRoom] = useState(null);
  const [vsMe, setVsMe] = useState(null);
  const [vsRound, setVsRound] = useState(0);
  const [vsDeadline, setVsDeadline] = useState(null);
  const [vsReady, setVsReady] = useState(false);
  const [vsOpponent, setVsOpponent] = useState(null);
  const [vsRanking, setVsRanking] = useState(null);
  const [vsError, setVsError] = useState('');
  const [vsBusy, setVsBusy] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const socketRef = useRef(null);
  const vsRef = useRef({});

  const timers = useRef([]);
  const speedRef = useRef(speed);
  const playRef = useRef(null);
  const dragRef = useRef(null);
  const prepBoardRef = useRef(null);
  const foesRef = useRef(null);
  const toastTimer = useRef(null);

  const boardCap = BOARD_CAP[Math.min(MAX_LEVEL, level)] || 2;
  const onBoard = board.filter(Boolean);
  const chapter = chapterOf(floor);
  const totalFloors = map.length || TOTAL_FLOORS;
  const autoScene = mode === 'versus' ? chapter : (regionAt(map, floor)?.scene || chapter);
  const incomeEst = estimateIncome(gold, streak, chapter, true, coin);
  const xpNeed = level >= MAX_LEVEL ? null : LEVEL_XP[level + 1];
  const selected = [...board, ...bench].find((u) => u?.uid === selectedUid) || null;
  const placing = !!(selectedUid && bench.some((u) => u.uid === selectedUid));

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => { clearTimers(); clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    speedRef.current = speed;
    try { localStorage.setItem(SPEED_KEY, String(speed)); } catch { /* stockage indisponible */ }
  }, [speed]);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, boardTheme); } catch { /* stockage indisponible */ }
  }, [boardTheme]);

  /* ———————————————— Musique ———————————————— */

  useEffect(() => {
    const player = musicPlayer();
    const off = player.subscribe(setNowPlaying);
    return () => { off(); player.stop(); };
  }, []);
  useEffect(() => {
    musicPlayer().setVolume(musicVol);
    try { localStorage.setItem(MUSIC_KEY, String(musicVol)); } catch { /* stockage indisponible */ }
  }, [musicVol]);
  // Playlist continue ; seule la Ligue a sa propre musique (Cynthia et Hélio en boucle).
  const inLeague = mode !== 'versus'
    && (phase === 'map' || phase === 'mart' || phase === 'event' || phase === 'battle')
    && regionAt(map, floor)?.biome === 'ligue';
  useEffect(() => {
    musicPlayer().setMode(inLeague ? 'league' : 'main');
  }, [inLeague]);
  // Temps de jeu d'une partie solo (sauvegardé avec elle), pour le Hall de la Ligue.
  useEffect(() => {
    if (mode !== 'solo' || !['map', 'mart', 'event', 'battle'].includes(phase)) return undefined;
    const id = setInterval(() => { if (document.visibilityState === 'visible') playTimeRef.current += 1; }, 1000);
    return () => clearInterval(id);
  }, [phase, mode]);

  // Fin d'une partie solo : carnet de dresseur + classement en ligne.
  useEffect(() => {
    if (phase !== 'over' || recordedRef.current || !map.length) return;
    recordedRef.current = true;
    const victory = floor >= totalFloors && hp > 0;
    const team = board.filter(Boolean);
    const mvp = [...team].sort((a, b) => (b.star || 1) - (a.star || 1) || (b.items?.length || 0) - (a.items?.length || 0))[0];
    const run = {
      at: Date.now(), result: victory ? 'win' : 'lose', floor: Math.min(floor + (victory ? 0 : 1), totalFloors), level, wins,
      t: Math.round(playTimeRef.current), starter: starterId, mvp: mvp ? displayName(mvp.name) : '', mvpArt: mvp ? (mvp.sprite || mvp.home || '') : ''
    };
    setRecord(addToRecord(loadRecord(), run));
    postRun('arena', {
      gen: 1, mode: 'classic', partnerId: starterId, form: run.mvp, formDex: mvp ? String(mvp.dex || '') : '', result: run.result,
      t: run.t, kills: run.floor, level, caught: wins
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const musicButton = <MusicControl volume={musicVol} onVolume={setMusicVol} now={nowPlaying} />;

  const openTrait = (trait, event, extra = {}) => {
    if (!trait || !event?.currentTarget) {
      setTraitPop(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 280;
    let left = rect.right + 10;
    let top = rect.top;
    if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - 10);
    if (top + 260 > window.innerHeight - 8) top = Math.max(8, window.innerHeight - 270);
    setTraitPop({ trait, count: extra.count ?? null, tip: extra.tip || '', left, top });
  };

  /* ———————————————— Sauvegarde ———————————————— */

  const snapshot = (over = {}) => ({
    map, floor, path, runPoolIds: runPool.map((l) => l.id), bench, board, shop, shopLocked, bag,
    gold, xp, level, hp, streak, coin, wins, starterId, playTime: Math.round(playTimeRef.current), ...over
  });

  const persist = (over = {}) => {
    const ok = saveCampaign(snapshot(over));
    setCanContinue(ok);
    return ok;
  };

  const resumeSave = () => {
    const data = loadCampaign();
    if (!data?.map?.length) {
      setCanContinue(false);
      return;
    }
    clearTimers();
    const pool = (data.runPoolIds || []).map((id) => LINE_MAP[id]).filter(Boolean);
    const restoredPool = pool.length ? pool : buildRunPool();
    setRunPool(restoredPool);
    setMap(data.map);
    setFloor(data.floor || 0);
    setPath(data.path || []);
    setBench((data.bench || []).filter((u) => u && LINE_MAP[u.lineId]).map(withTalent));
    setBoard(padBoard((data.board || []).map((u) => (u && LINE_MAP[u.lineId] ? withTalent(u) : null))));
    setShop(data.shop?.length ? data.shop : rollShop(data.level || 1, SHOP_SIZE, restoredPool));
    setShopLocked(!!data.shopLocked);
    setBag((data.bag || []).filter((id) => ITEM_MAP[id]));
    setGold(data.gold ?? START_GOLD);
    setXp(data.xp || 0);
    setLevel(data.level || 1);
    setHp(data.hp ?? START_HP);
    setStreak(data.streak || 0);
    setCoin(data.coin || 0);
    setWins(data.wins || 0);
    setStarterId(data.starterId || '');
    playTimeRef.current = data.playTime || 0;
    recordedRef.current = false;
    setNode(null);
    setResult(null);
    setPhase('map');
    setStage('prep');
  };

  /* ———————————————— Début de run ———————————————— */

  const startRun = (lineId) => {
    clearTimers();
    clearCampaign();
    const starter = unitFromLine(lineId, 1);
    const trio = starterTrio(lineId);
    const pool = buildRunPool(trio);
    const firstBoard = autoSeat([starter]);
    setRunPool(pool);
    setMap(generateMap(lineId, trio));
    setFloor(0);
    setPath([]);
    setNode(null);
    setBench([]);
    setBoard(firstBoard);
    setEnemyBoard(emptyBoard());
    setShop(rollShop(1, SHOP_SIZE, pool));
    setShopLocked(false);
    setBag([]);
    setGold(START_GOLD);
    setXp(0);
    setLevel(1);
    setHp(START_HP);
    setStreak(0);
    setCoin(0);
    setWins(0);
    setStarterId(lineId);
    playTimeRef.current = 0;
    recordedRef.current = false;
    setResult(null);
    setSelectedUid(null);
    setSelectedItem(null);
    setPhase('map');
    const partners = trio.slice(1).map((id) => displayName(LINE_MAP[id]?.stages[0]?.name || id));
    say(`${displayName(starter.name)} est prêt ! ${partners.join(' et ')} pourront rejoindre ta boutique.`);
  };

  const advance = (nodeId) => {
    const nextFloor = floor + 1;
    const nextPath = [...path, nodeId];
    setPath(nextPath);
    setFloor(nextFloor);
    setNode(null);
    if (nextFloor >= totalFloors) {
      clearCampaign();
      setCanContinue(false);
      setPhase('over');
      return;
    }
    setPhase('map');
    setStage('prep');
    setSaveTick((t) => t + 1);
  };

  // Sauvegarde automatique après chaque étape (avec l’état à jour).
  useEffect(() => {
    if (saveTick) persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTick]);

  /* ———————————————— Étapes de la carte ———————————————— */

  const enterNode = (n) => {
    if (n.floor !== floor) return;
    setNode(n);
    if (isFightKind(n.kind)) {
      const foes = seatFoes(enemyTeam(n));
      foesRef.current = foes;
      setEnemyBoard(foes);
      if (!shopLocked) setShop(rollShop(level, SHOP_SIZE, runPool));
      setStage('prep');
      setResult(null);
      setPositions(null);
      setHpMap({});
      setFxMap({});
      setFloatFx([]);
      setAct(null);
      setMeter({});
      setFightLine('');
      setPhase('battle');
      return;
    }
    if (n.kind === 'mart') {
      setStock(martStock(n.floor));
      setPhase('mart');
      return;
    }
    if (n.kind === 'event') {
      setEventOpts(eventOptions(n.floor, runPool));
      setPhase('event');
      return;
    }
    if (n.kind === 'center') {
      const healed = Math.min(START_HP, hp + CENTER_HEAL);
      say(`Centre Pokémon : +${healed - hp} PV de dresseur.`);
      setHp(healed);
      advance(n.id);
    }
  };

  /* ———————————————— Fusion / placement ———————————————— */

  const applyMerge = (nextBoard, nextBench) => {
    const merged = mergeUnits(padBoard(nextBoard), nextBench);
    const capped = enforceBoardCap(merged.board, merged.bench, boardCap);
    if (merged.notes.length) say(merged.notes.join(' · '));
    if (capped.moved) say(`Terrain limité à ${boardCap} : ${capped.moved} Pokémon renvoyé(s) au banc.`);
    if (merged.evolved?.length) {
      setEvolving(merged.evolved);
      setTimeout(() => setEvolving([]), 1400);
    }
    setBoard(padBoard(capped.board));
    setBench(capped.bench);
    return capped;
  };

  const pendingEvo = useMemo(() => [...board, ...bench].find((u) => u?.pendingEvo) || null, [board, bench]);

  const pendingMega = useMemo(() => [...board, ...bench].find((u) => u?.pendingMega && !u.pendingEvo) || null, [board, bench]);

  const mapUnit = (uid, fn) => {
    setBoard((cur) => cur.map((u) => (u?.uid === uid ? fn(u) : u)));
    setBench((cur) => cur.map((u) => (u?.uid === uid ? fn(u) : u)));
  };

  const chooseEvo = (formId) => {
    if (!pendingEvo) return;
    const next = applyEvolutionChoice(pendingEvo, formId);
    if (!next) return;
    mapUnit(pendingEvo.uid, () => next);
    setEvolving([next.uid]);
    setTimeout(() => setEvolving([]), 1400);
    say(`${pendingEvo.name} évolue en ${displayName(next.name)} !`);
  };

  const chooseMega = (index) => {
    if (!pendingMega) return;
    const next = applyMegaChoice(pendingMega, index);
    if (!next) return;
    mapUnit(pendingMega.uid, () => next);
    setEvolving([next.uid]);
    setTimeout(() => setEvolving([]), 1400);
    say(`${displayName(pendingMega.name)} Méga-évolue en ${displayName(next.name)} !`);
  };

  const canEdit = phase === 'battle' && stage === 'prep' && !result && !(mode === 'versus' && vsReady);

  const placeUnit = (uid, index) => {
    if (!canEdit) return;
    const fromBench = bench.find((u) => u.uid === uid);
    const fromIdx = board.findIndex((u) => u?.uid === uid);
    const next = [...board];
    if (fromBench) {
      if (onBoard.length >= boardCap && !next[index]) {
        say(`Terrain plein (${boardCap}). Monte de niveau pour placer plus de Pokémon.`);
        return;
      }
      const displaced = next[index];
      next[index] = fromBench;
      let nextBench = bench.filter((u) => u.uid !== uid);
      if (displaced) nextBench = [...nextBench, displaced];
      applyMerge(next, nextBench);
    } else if (fromIdx >= 0) {
      next[fromIdx] = next[index];
      next[index] = board[fromIdx];
      setBoard(padBoard(next));
    }
    setSelectedUid(null);
  };

  const recall = (uid) => {
    if (!canEdit) return;
    const idx = board.findIndex((u) => u?.uid === uid);
    if (idx < 0) return;
    if (bench.length >= BENCH_CAP) {
      say('Banc plein.');
      return;
    }
    const next = [...board];
    const unit = next[idx];
    next[idx] = null;
    applyMerge(next, [...bench, unit]);
    setSelectedUid(null);
  };

  const sell = (uid) => {
    if (!canEdit) return;
    const unit = [...board, ...bench].find((u) => u?.uid === uid);
    if (!unit) return;
    if (onBoard.length === 1 && board.some((u) => u?.uid === uid) && !bench.length) {
      say('Garde au moins un Pokémon !');
      return;
    }
    setBoard((cur) => cur.map((u) => (u?.uid === uid ? null : u)));
    setBench((cur) => cur.filter((u) => u.uid !== uid));
    if (unit.items?.length) setBag((b) => [...b, ...unit.items]);
    const refund = sellValue(unit);
    setGold((g) => g + refund);
    setSelectedUid(null);
    setHoverUnit(null);
    say(`${displayName(unit.name)} vendu : +${refund} or.`);
  };

  const onCellClick = (index) => {
    if (!canEdit) return;
    const unit = board[index];
    if (selectedItem && unit) {
      applyItem(unit.uid, selectedItem);
      return;
    }
    if (selectedUid) {
      if (unit?.uid === selectedUid) {
        setSelectedUid(null);
        return;
      }
      placeUnit(selectedUid, index);
      return;
    }
    if (unit) {
      setSelectedUid(unit.uid);
      setHoverUnit(unit);
    }
  };

  /* ———————————————— Boutique ———————————————— */

  const buy = (index) => {
    if (!canEdit) return;
    const offer = shop[index];
    if (!offer) return;
    if (gold < offer.cost) {
      say(`Il te faut ${offer.cost} or.`);
      return;
    }
    const copies = [...board, ...bench].filter((u) => u && u.lineId === offer.lineId && u.star === 1 && !u.formId).length;
    if (bench.length >= BENCH_CAP && copies < 2) {
      say('Banc plein : vends ou place un Pokémon.');
      return;
    }
    const bought = unitFromLine(offer.lineId, 1);
    setGold((g) => g - offer.cost);
    setShop((cur) => cur.map((s, i) => (i === index ? null : s)));
    // Place directement sur le terrain s’il reste de la place, sinon sur le banc.
    if (onBoard.length < boardCap && !copies) {
      const seat = autoSeat([...onBoard, bought]);
      const free = seat.findIndex((u) => u?.uid === bought.uid);
      const next = [...board];
      const target = next[free] ? next.findIndex((u) => !u) : free;
      next[target] = bought;
      applyMerge(next, bench);
    } else {
      applyMerge(board, [...bench, bought]);
    }
  };

  const reroll = () => {
    if (!canEdit) return;
    if (gold < REROLL_COST) {
      say(`Il faut ${REROLL_COST} or pour relancer.`);
      return;
    }
    setGold((g) => g - REROLL_COST);
    setShop(rollShop(level, SHOP_SIZE, runPool));
  };

  const buyXp = () => {
    if (!canEdit) return;
    if (level >= MAX_LEVEL) return;
    if (gold < XP_COST) {
      say(`Il faut ${XP_COST} or pour +4 XP.`);
      return;
    }
    setGold((g) => g - XP_COST);
    const next = addXp(level, xp, 4);
    if (next.level !== level) say(`Niveau ${next.level} ! Tu peux placer ${BOARD_CAP[next.level]} Pokémon.`);
    setLevel(next.level);
    setXp(next.xp);
  };

  /* ———————————————— Objets ———————————————— */

  const removeFromBag = (itemId) => {
    setBag((cur) => {
      const i = cur.indexOf(itemId);
      if (i < 0) return cur;
      const next = [...cur];
      next.splice(i, 1);
      return next;
    });
  };

  const applyItem = (uid, itemId) => {
    if (!canEdit || !itemId) return;
    const target = [...board, ...bench].find((u) => u?.uid === uid);
    if (!target) return;
    const item = ITEM_MAP[itemId];
    if (!item) return;
    if (item.special === 'strip') {
      const { unit, stripped } = stripItems(target);
      if (!stripped.length) {
        say(`${displayName(target.name)} ne tient aucun objet.`);
        return;
      }
      mapUnit(uid, () => unit);
      setBag((b) => [...b, ...stripped]);
      removeFromBag(itemId);
      setSelectedItem(null);
      say(`Aimant : objets de ${displayName(target.name)} rangés dans le sac.`);
      return;
    }
    if (item.special === 'starUp') {
      if (target.star !== 1) {
        say('Le Super Bonbon ne marche que sur un Pokémon 1★.');
        return;
      }
      const up = unitFromLine(target.lineId, 2, target.uid, target.items || [], target.formId, false);
      mapUnit(uid, () => up);
      removeFromBag(itemId);
      setSelectedItem(null);
      setEvolving([up.uid]);
      setTimeout(() => setEvolving([]), 1400);
      say(`${displayName(target.name)} passe à 2★ !`);
      return;
    }
    const res = equipItemOnUnit(target, itemId);
    if (!res) {
      say(item.plate ? 'Ce Pokémon a déjà ce type, ou ses 3 emplacements sont pris.' : `Maximum ${ITEM_SLOTS} objets par Pokémon.`);
      return;
    }
    mapUnit(uid, () => res.unit);
    removeFromBag(itemId);
    setSelectedItem(null);
    say(res.note);
  };

  /* ———————————————— Glisser-déposer ———————————————— */

  const beginDrag = (e, payload) => {
    if (!canEdit || e.button > 0) return;
    dragRef.current = { ...payload, x0: e.clientX, y0: e.clientY, active: false };
  };

  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.active && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.active = true;
      if (d.active) setDrag({ ...d, x: e.clientX, y: e.clientY });
    };
    const up = (e) => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;
      if (!d.active) {
        d.onClick?.();
        return;
      }
      setDrag(null);
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
      if (!el) return;
      const kind = el.dataset.drop;
      const index = Number(el.dataset.index);
      if (d.kind === 'unit') {
        if (kind === 'cell' || kind === 'unit') placeUnitRef.current(d.uid, index);
        else if (kind === 'bench') recallRef.current(d.uid);
        else if (kind === 'sell') sellRef.current(d.uid);
      } else if (d.kind === 'item') {
        const uid = el.dataset.uid || (kind === 'cell' ? boardRef.current[index]?.uid : null);
        if (uid) applyItemRef.current(uid, d.itemId);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);
  // Les gestionnaires globaux lisent toujours la dernière version des actions.
  const placeUnitRef = useRef(placeUnit);
  const recallRef = useRef(recall);
  const sellRef = useRef(sell);
  const applyItemRef = useRef(applyItem);
  const boardRef = useRef(board);
  placeUnitRef.current = placeUnit;
  recallRef.current = recall;
  sellRef.current = sell;
  applyItemRef.current = applyItem;
  boardRef.current = board;

  /* ———————————————— Combat ———————————————— */

  const finishFight = (res) => {
    if (mode === 'versus') {
      finishVersusFight(res);
      return;
    }
    const n = node;
    const gains = estimateIncome(gold, streak, chapterOf(n.floor), res.win, coin);
    const xpNext = addXp(level, xp, 2);
    const loot = res.win ? fightLoot(n) : [];
    const hpLost = res.win ? 0 : Math.min(hp, lossDamage(n, res));
    const statsMeter = res.stats.filter((s) => s.side === 'ally' && s.dmg > 0).sort((a, b) => b.dmg - a.dmg);
    const totals = {};
    res.stats.forEach((st) => { if (st.dmg) totals[st.uid] = st.dmg; });
    setMeter(totals);
    setGold((g) => g + gains.total);
    setStreak(gains.nextStreak);
    setLevel(xpNext.level);
    setXp(xpNext.xp);
    if (loot.length) setBag((b) => [...b, ...loot]);
    if (res.win) setWins((w) => w + 1);
    if (hpLost) setHp((h) => h - hpLost);
    setResult({
      win: res.win,
      gains,
      loot,
      hpLost,
      meter: statsMeter,
      boss: n.kind === 'boss' ? `${n.trainer.title} ${n.trainer.name}` : null,
      dead: hp - hpLost <= 0
    });
  };

  const applyFrame = (frame, i) => {
    setFightLine(frame.line || '');
    setHpMap(frame.hp || {});
    setFxMap(frame.fx || {});
    setAct(frame.act || null);
    setActKey(i + 1);
    if (frame.pos) {
      const p = {};
      Object.entries(frame.pos).forEach(([uid, v]) => { p[uid] = { col: v.col, row: v.row }; });
      setPositions(p);
    }
    setFloatFx((frame.floats || []).map((f, k) => ({ ...f, key: `${i}-${k}-${f.uid}` })));
    const a = frame.act;
    if (a?.uid && (a.kind === 'strike' || a.kind === 'spell')) {
      const dealt = (frame.floats || [])
        .filter((f) => (f.kind === 'dmg' || f.kind === 'crit' || f.kind === 'super') && f.uid !== a.uid)
        .reduce((sum, f) => sum + (parseInt(String(f.text).replace(/[^0-9]/g, ''), 10) || 0), 0);
      if (dealt) setMeter((m) => ({ ...m, [a.uid]: (m[a.uid] || 0) + dealt }));
    }
  };

  const playFrom = (index) => {
    const play = playRef.current;
    if (!play) return;
    if (index >= play.frames.length) {
      playRef.current = null;
      finishFight(play.res);
      return;
    }
    applyFrame(play.frames[index], index);
    const id = setTimeout(() => playFrom(index + 1), frameDelay(play.frames[index]) / speedRef.current);
    timers.current.push(id);
  };

  const skipFight = () => {
    const play = playRef.current;
    if (!play) return;
    clearTimers();
    const last = play.frames.length - 1;
    applyFrame(play.frames[last], last);
    playRef.current = null;
    finishFight(play.res);
  };

  const fight = () => {
    if (!canEdit || !node) return;
    if (pendingEvo) {
      say('Choisis d’abord une évolution.');
      return;
    }
    if (pendingMega) {
      say('Choisis d’abord sa Méga-Évolution.');
      return;
    }
    const capped = enforceBoardCap(board, bench, boardCap);
    const fighters = capped.board.filter(Boolean);
    if (!fighters.length) {
      say('Place au moins un Pokémon sur le terrain.');
      return;
    }
    setBoard(padBoard(capped.board));
    setBench(capped.bench);
    prepBoardRef.current = padBoard(capped.board).map((u) => (u ? { ...u, items: [...(u.items || [])] } : null));
    const foes = foesRef.current || enemyBoard;
    setSelectedUid(null);
    setSelectedItem(null);
    setStage('fight');
    setMeter({});
    const res = simulateFight(withBoardSlots(padBoard(capped.board), 'ally'), withBoardSlots(foes, 'foe'));
    playRef.current = { res, frames: res.frames };
    clearTimers();
    setBanner({ key: Date.now(), title: `${node.trainer.title} ${node.trainer.name}`, sub: bannerLine(node), trainer: node.trainer });
    const id = setTimeout(() => {
      setBanner(null);
      playFrom(0);
    }, 1500 / Math.max(1, speedRef.current * 0.75));
    timers.current.push(id);
  };

  const continueAfterFight = () => {
    if (!result) return;
    const r = result;
    setResult(null);
    setPositions(null);
    setFxMap({});
    setHpMap({});
    setFloatFx([]);
    setAct(null);
    setFightLine('');
    if (prepBoardRef.current) setBoard(prepBoardRef.current);
    if (mode === 'versus') {
      setEnemyBoard(emptyBoard());
      setVsOpponent(null);
      if (r.dead || vsRef.current.ranking) {
        setPhase('vs-over');
        return;
      }
      setStage('prep');
      if (!shopLocked) setShop(rollShop(level, SHOP_SIZE, runPool));
      return;
    }
    if (r.dead) {
      clearCampaign();
      setCanContinue(false);
      setPhase('over');
      return;
    }
    if (node.kind === 'boss' && !r.win) {
      // On retente le champion : nouvelle boutique, même équipe adverse.
      setStage('prep');
      setEnemyBoard(foesRef.current);
      if (!shopLocked) setShop(rollShop(level, SHOP_SIZE, runPool));
      return;
    }
    if (hasRewardChoice(node.kind) && r.win) {
      setRewardOpts(rewardChoices(node));
      return;
    }
    if (!shopLocked) setShop(rollShop(level, SHOP_SIZE, runPool));
    if (!r.win) {
      // Défaite : on reste sur la même étape et on peut rechoisir parmi ses chemins.
      setNode(null);
      setStage('prep');
      setPhase('map');
      setSaveTick((t) => t + 1);
      say('Défaite : tu restes sur cette étape. Choisis à nouveau ton chemin.');
      return;
    }
    advance(node.id);
  };

  const pickReward = (itemId) => {
    setRewardOpts(null);
    setBag((b) => [...b, itemId]);
    if (!shopLocked) setShop(rollShop(level, SHOP_SIZE, runPool));
    say(`${ITEM_MAP[itemId].name} rejoint ton sac.`);
    advance(node.id);
  };

  /* ———————————————— Mart / événement ———————————————— */

  const buyWare = (slot) => {
    if (slot.sold || gold < slot.price) return;
    const it = ITEM_MAP[slot.itemId];
    setGold((g) => g - slot.price);
    setStock((cur) => cur.map((s) => (s.key === slot.key ? { ...s, sold: true } : s)));
    if (it.special === 'xp') {
      const next = addXp(level, xp, it.amount);
      setLevel(next.level);
      setXp(next.xp);
      say(`+${it.amount} XP${next.level !== level ? ` — niveau ${next.level} !` : ''}`);
    } else if (it.special === 'heal') {
      setHp((h) => Math.min(START_HP, h + it.amount));
      say(`+${it.amount} PV de dresseur.`);
    } else if (it.special === 'coin') {
      setCoin((c) => c + 1);
      say('Pièce Rune : +1 or par victoire.');
    } else {
      setBag((b) => [...b, it.id]);
      say(`${it.name} ajouté au sac.`);
    }
  };

  const rerollMart = () => {
    if (gold < 2) return;
    setGold((g) => g - 2);
    setStock(martStock(floor));
  };

  const chooseEvent = (o) => {
    const eff = o.effect || o.id;
    if (o.cost) {
      if (gold < o.cost) {
        say('Pas assez d’or pour cet échange.');
        return;
      }
      setGold((g) => g - o.cost);
    }
    if (eff === 'gold') setGold((g) => g + o.amount);
    else if (eff === 'item' || eff === 'plate') setBag((b) => [...b, o.itemId]);
    else if (eff === 'xp') {
      const next = addXp(level, xp, o.amount);
      setLevel(next.level);
      setXp(next.xp);
    } else if (eff === 'unit') {
      const u = unitFromLine(o.lineId, o.star, undefined, [], null, true);
      if (bench.length < BENCH_CAP) applyMerge(board, [...bench, u]);
      else say('Banc plein : le Pokémon repart à la Pension.');
    } else if (eff === 'heal') setHp((h) => Math.min(START_HP, h + o.amount));
    say(`${o.title} : ${o.label}`);
    advance(node.id);
  };

  /* ———————————————— Salon multi ———————————————— */

  const finishVersusFight = (res) => {
    const round = vsRef.current.round || vsRound;
    const gains = estimateIncome(gold, streak, versusChapter(round), res.win, coin, true);
    const xpNext = addXp(level, xp, 2);
    const loot = versusLoot(round);
    const hpLost = res.win ? 0 : Math.min(hp, versusLossDamage(round, vsRef.current.damageTaken || 0));
    const statsMeter = res.stats.filter((st) => st.side === 'ally' && st.dmg > 0).sort((a, b) => b.dmg - a.dmg);
    const totals = {};
    res.stats.forEach((st) => { if (st.dmg) totals[st.uid] = st.dmg; });
    setMeter(totals);
    setGold((g) => g + gains.total);
    setStreak(gains.nextStreak);
    setLevel(xpNext.level);
    setXp(xpNext.xp);
    if (loot.length) setBag((b) => [...b, ...loot]);
    if (res.win) setWins((w) => w + 1);
    if (hpLost) setHp((h) => h - hpLost);
    socketRef.current?.emit('arena:result', { round, hp: hp - hpLost, win: res.win });
    setResult({
      win: res.win,
      gains,
      loot,
      hpLost,
      meter: statsMeter,
      boss: vsRef.current.opponent ? `contre ${vsRef.current.opponent.name}` : null,
      dead: hp - hpLost <= 0
    });
  };

  /** Lance le rejeu d’un duel envoyé par le serveur (combat identique chez les deux joueurs). */
  const playVersusFight = (payload) => {
    const view = versusView(payload.home, payload.away, payload.seed, payload.isHome);
    const own = rebuildBoard(payload.isHome ? payload.home : payload.away);
    clearTimers();
    prepBoardRef.current = padBoard(board).map((u) => (u ? { ...u, items: [...(u.items || [])] } : null));
    vsRef.current.damageTaken = view.damageTaken;
    vsRef.current.opponent = payload.opponent;
    setVsOpponent(payload.opponent);
    setPendingEvoSafe();
    setBoard(own);
    setEnemyBoard(view.enemyBoard);
    setSelectedUid(null);
    setSelectedItem(null);
    setResult(null);
    setPositions(null);
    setHpMap({});
    setFxMap({});
    setFloatFx([]);
    setMeter({});
    setStage('fight');
    playRef.current = { res: view.res, frames: view.res.frames };
    setBanner({ key: Date.now(), title: payload.opponent?.name || 'Adversaire', sub: payload.ghost ? 'Combat contre un reflet' : `Round ${payload.round}` });
    const id = setTimeout(() => {
      setBanner(null);
      playFrom(0);
    }, 1100 / Math.max(1, speedRef.current * 0.75));
    timers.current.push(id);
  };

  const setPendingEvoSafe = () => {
    // Un choix d’évolution en attente est résolu automatiquement avant le combat.
    if (pendingMega && !pendingEvo) chooseMega(0);
    if (!pendingEvo) return;
    const form = LINE_MAP[pendingEvo.lineId]?.forms?.[0];
    if (form) chooseEvo(form.id);
  };

  const startVersus = (poolIds, starterId) => {
    clearTimers();
    const pool = poolIds.map((id) => LINE_MAP[id]).filter(Boolean);
    const starter = unitFromLine(starterId, 1) || unitFromLine(pool[0]?.id, 1);
    setMode('versus');
    setRunPool(pool);
    setMap([]);
    setFloor(0);
    setPath([]);
    setNode(null);
    setBench([]);
    setBoard(autoSeat([starter]));
    setEnemyBoard(emptyBoard());
    setShop(rollShop(1, SHOP_SIZE, pool));
    setShopLocked(false);
    setBag([]);
    setGold(START_GOLD);
    setXp(0);
    setLevel(1);
    setHp(START_HP);
    setStreak(0);
    setCoin(0);
    setWins(0);
    setResult(null);
    setSelectedUid(null);
    setSelectedItem(null);
    setVsReady(false);
    setVsRanking(null);
    vsRef.current.ranking = null;
    setStage('prep');
    setPhase('battle');
    say(`Ton starter : ${displayName(starter.name)}. Le pool compte ${pool.length} lignées.`);
  };

  const sendReady = (force = false) => {
    const sock = socketRef.current;
    if (!sock || mode !== 'versus' || stage !== 'prep') return;
    if (vsReady && !force) {
      sock.emit('arena:unready', { round: vsRound });
      setVsReady(false);
      return;
    }
    setPendingEvoSafe();
    const capped = enforceBoardCap(board, bench, boardCap);
    setBoard(padBoard(capped.board));
    setBench(capped.bench);
    sock.emit('arena:ready', { round: vsRound, board: serializeBoard(padBoard(capped.board)), level });
    setVsReady(true);
  };

  // Les gestionnaires de socket lisent toujours la dernière version de ces fonctions.
  vsRef.current.handlers = { startVersus, playVersusFight };
  vsRef.current.round = vsRound;

  const openSocket = () => {
    if (socketRef.current) return socketRef.current;
    const sock = io(ARENA_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = sock;
    sock.on('arena:room', (room) => setVsRoom(room));
    sock.on('arena:started', ({ pool, starterOf }) => {
      vsRef.current.handlers.startVersus(pool, starterOf?.[sock.id]);
    });
    sock.on('arena:round', ({ round, deadline }) => {
      vsRef.current.round = round;
      setVsRound(round);
      setVsDeadline(deadline);
      setVsReady(false);
    });
    sock.on('arena:fight', (payload) => vsRef.current.handlers.playVersusFight(payload));
    sock.on('arena:over', ({ ranking }) => {
      vsRef.current.ranking = ranking;
      setVsRanking(ranking);
      setPhase((p) => (p === 'battle' && !playRef.current ? 'vs-over' : p));
    });
    sock.on('connect_error', () => setVsError('Connexion au serveur impossible.'));
    return sock;
  };

  const closeSocket = () => {
    const sock = socketRef.current;
    if (sock) {
      sock.emit('arena:leave');
      sock.disconnect();
    }
    socketRef.current = null;
    setVsRoom(null);
    setVsMe(null);
    setVsReady(false);
    setVsOpponent(null);
  };
  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  const saveVsName = (v) => {
    setVsName(v);
    try { localStorage.setItem(VS_NAME_KEY, v); } catch { /* stockage indisponible */ }
  };

  const vsCreate = () => {
    setVsError('');
    setVsBusy(true);
    openSocket().emit('arena:create', { name: vsName }, (ack) => {
      setVsBusy(false);
      if (ack?.ok) setVsMe(ack.me);
      else setVsError(ack?.error || 'Création impossible.');
    });
  };

  const vsJoin = (code) => {
    setVsError('');
    setVsBusy(true);
    openSocket().emit('arena:join', { code, name: vsName }, (ack) => {
      setVsBusy(false);
      if (ack?.ok) setVsMe(ack.me);
      else setVsError(ack?.error || 'Impossible de rejoindre.');
    });
  };

  const vsStart = () => {
    const count = vsRoom?.players?.length || 2;
    const pool = versusPool(count);
    const starters = pool.filter((id) => (LINE_MAP[id]?.traits || []).includes('Starter'));
    setVsBusy(true);
    socketRef.current?.emit('arena:start', { pool, starters }, (ack) => {
      setVsBusy(false);
      if (!ack?.ok) setVsError(ack?.error || 'Lancement impossible.');
    });
  };

  const leaveVersus = () => {
    closeSocket();
    clearTimers();
    setMode('solo');
    setResult(null);
    setStage('prep');
    setPhase('hub');
  };

  // Compte à rebours de la préparation ; prêt automatique à la fin du temps.
  useEffect(() => {
    if (mode !== 'versus') return undefined;
    const id = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(id);
  }, [mode]);
  useEffect(() => {
    if (mode === 'versus' && phase === 'battle' && stage === 'prep' && !vsReady && !result && vsDeadline && nowTick >= vsDeadline) {
      sendReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick]);

  /* ———————————————— Raccourcis clavier ———————————————— */

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'SELECT') return;
      if (phase !== 'battle') return;
      const k = e.key.toLowerCase();
      if (stage === 'prep' && !result) {
        if (k === 'd') reroll();
        else if (k === 'f') buyXp();
        else if (k === 'e' && (hoverUnit || selected)) {
          const u = hoverUnit || selected;
          if ([...board, ...bench].some((x) => x?.uid === u.uid)) sell(u.uid);
        } else if (k === 'escape') {
          setSelectedUid(null);
          setSelectedItem(null);
        }
      } else if (stage === 'fight' && k === ' ' && playRef.current) {
        e.preventDefault();
        skipFight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ———————————————— Rendu ———————————————— */

  const hud = (
    <div className="pa-hud">
      <div className="pa-hud-hp" title="PV de dresseur">
        <span className="pa-heart" aria-hidden>♥</span>
        <div>
          <strong>{hp}</strong>
          <i><b style={{ width: `${hp}%` }} /></i>
        </div>
      </div>
      <div className="pa-hud-gold" title="Or">
        <span className="pa-coin" aria-hidden />
        <strong key={gold} className="pa-bump">{gold}</strong>
        <em className="pa-income" title="Or gagné si tu remportes le prochain combat (base, intérêts, série)">+{incomeEst.total}</em>
      </div>
      <div className="pa-hud-level" title="Niveau de dresseur">
        <span>Niv. <strong>{level}</strong></span>
        <i><b style={{ width: xpNeed ? `${(xp / xpNeed) * 100}%` : '100%' }} /></i>
        <em>{xpNeed ? `${xp}/${xpNeed} XP` : 'max'}</em>
      </div>
    </div>
  );

  if (phase === 'hub') {
    return (
      <div className={`pa-root ${skinCls} pa-hub-home`}>
        <ArenaHome
          onClose={onClose}
          save={canContinue ? loadCampaign() : null}
          regionOf={(d) => chapterLabel(d.floor || 0, d.map)}
          onContinue={resumeSave}
          onNew={() => setPhase('starter')}
          onMulti={() => { setVsError(''); setPhase('lobby'); }}
          onCodex={() => setPhase('codex')}
          music={musicButton}
          skinLabel={SKIN_LABELS[skin]}
          onSkin={() => setSkin((k) => SKINS[(SKINS.indexOf(k) + 1) % SKINS.length])}
          myTrainer={myTrainer}
          record={record}
        />
      </div>
    );
  }

  if (phase === 'lobby') {
    const count = Math.max(2, vsRoom?.players?.length || 2);
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        <ArenaFrame title="Salon multi" subtitle="De 2 à 8 dresseurs, le dernier debout gagne" onBack={() => { closeSocket(); setPhase('hub'); }}>
        <VersusLobby
          room={vsRoom}
          me={vsMe}
          name={vsName}
          onName={saveVsName}
          onCreate={vsCreate}
          onJoin={vsJoin}
          onStart={vsStart}
          onLeave={() => { closeSocket(); setPhase('hub'); }}
          error={vsError}
          busy={vsBusy}
          poolPreview={vsRoom ? { size: versusPoolSize(count), starters: versusStarterCount(count), max: VERSUS_MAX_PLAYERS } : null}
        />
        </ArenaFrame>
      </div>
    );
  }

  if (phase === 'vs-over') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        <VersusOver
          ranking={vsRanking}
          me={vsMe}
          team={board.filter(Boolean)}
          onBack={leaveVersus}
          onLobby={() => { closeSocket(); setMode('solo'); setVsError(''); setPhase('lobby'); }}
        />
      </div>
    );
  }

  if (phase === 'codex') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        <ArenaFrame title="Pokédex" subtitle="Lignées, talents et synergies de l’arène" onBack={() => setPhase('hub')}>
          <CodexScreen onBack={() => setPhase('hub')} onTrait={(t, e) => openTrait(t, e)} />
        </ArenaFrame>
        <TraitPopup pop={traitPop} />
      </div>
    );
  }

  if (phase === 'starter') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        <ArenaFrame
          title="Choisis ton partenaire"
          subtitle="Il commence sur le terrain ; deux autres starters rejoindront ta boutique"
          onBack={() => setPhase('hub')}
          right={<span className="gp-stat"><span><small>Ligues remportées</small><b>♛ {record.wins}</b></span></span>}
        >
          <StarterScreen
            onPick={startRun}
            onBack={() => setPhase('hub')}
            onTrait={(t, e) => openTrait(t, e)}
            trainer={myTrainer}
            onTrainer={setMyTrainer}
          />
        </ArenaFrame>
        <TraitPopup pop={traitPop} />
      </div>
    );
  }

  if (phase === 'over') {
    const victory = floor >= totalFloors && hp > 0;
    const champ = finalBoss(map);
    const team = board.filter(Boolean);
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        <div className={`pa-over${victory ? ' is-win' : ''}`}>
          {victory && <div className="ui-confetti" aria-hidden>{Array.from({ length: 40 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
          <h1>{victory ? 'Maître de la Ligue !' : 'Ton aventure s’arrête ici'}</h1>
          {victory && champ && <TrainerPortrait trainer={champ} size="lg" />}
          <p>{victory ? `Tu as battu ${champ ? `${champ.title} ${champ.name}` : 'le Maître'} et conquis la Ligue.` : `Étape ${floor + 1} sur ${totalFloors} (${chapterLabel(floor, map)}), ${wins} combats gagnés.`}</p>
          <div className="pa-over-team">
            {team.map((u) => (
              <figure key={u.uid}>
                <PokeSprite unit={u} size="lg" />
                <figcaption>{displayName(u.name)} <span className="ui-stars">{stars(u.star)}</span></figcaption>
              </figure>
            ))}
          </div>
          <div className="pa-hub-actions">
            <button type="button" className="ui-btn is-primary is-big" onClick={() => setPhase('starter')}>Nouvelle partie</button>
            <button type="button" className="ui-btn" onClick={() => setPhase('hub')}>Menu</button>
          </div>
        </div>
      </div>
    );
  }

  const poolModal = showPool && (
    <PoolModal
      pool={runPool}
      level={level}
      owned={[...board.filter(Boolean), ...bench]}
      onClose={() => setShowPool(false)}
      onTrait={(t, e) => openTrait(t, e)}
    />
  );

  const topBar = (extra) => (
    <header className="pa-top">
      {hud}
      {mode === 'versus' ? (
        <div className="pa-top-where">
          <strong>Round {vsRound || 1}</strong>
          <span>Salon {vsRoom?.code || ''}</span>
        </div>
      ) : (
        <div className="pa-top-where">
          <strong>{chapterLabel(floor, map)}</strong>
          <span>Étape {Math.min(floor + 1, totalFloors)} sur {totalFloors}</span>
        </div>
      )}
      {extra}
      <div className="pa-top-actions">
        {runPool.length > 0 && (
          <button type="button" className="ui-btn is-small" title="Voir toutes les lignées de cette partie" onClick={() => setShowPool(true)}>
            Pool
          </button>
        )}
        {musicButton}
        <button
          type="button"
          className="ui-btn is-small is-ghost"
          title="Changer le style de l’interface"
          onClick={() => setSkin((k) => SKINS[(SKINS.indexOf(k) + 1) % SKINS.length])}
        >
          Style : {SKIN_LABELS[skin]}
        </button>
        <button
          type="button"
          className="ui-btn is-small is-ghost"
          title="Changer l’ambiance du terrain"
          onClick={() => setBoardTheme((t) => THEME_IDS[(THEME_IDS.indexOf(t) + 1) % THEME_IDS.length])}
        >
          Terrain : {boardTheme === 'auto' ? `Auto (${BOARD_THEME_LABELS[resolveScene('auto', autoScene)]})` : BOARD_THEME_LABELS[boardTheme]}
        </button>
        {mode === 'versus' ? (
          <button type="button" className="ui-btn is-small is-ghost" onClick={leaveVersus}>Quitter le salon</button>
        ) : (
          <>
            <button type="button" className="ui-btn is-small" onClick={() => { persist(); say('Partie sauvegardée.'); }} disabled={phase === 'battle' && stage !== 'prep'}>Sauvegarder</button>
            <button type="button" className="ui-btn is-small is-ghost" onClick={() => setPhase('hub')} disabled={phase === 'battle' && stage !== 'prep'}>Menu</button>
            <button type="button" className="ui-btn is-small is-ghost" onClick={onClose}>Quitter</button>
          </>
        )}
      </div>
    </header>
  );

  const toastEl = toast ? <div key={toast} className="pa-toast" role="status">{toast}</div> : null;

  if (phase === 'map') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        {topBar(null)}
        <MapScreen
          map={map}
          floor={floor}
          path={path}
          onEnter={enterNode}
          hud={null}
          team={[...board.filter(Boolean), ...bench]}
        />
        {poolModal}
        {toastEl}
      </div>
    );
  }

  if (phase === 'mart') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        {topBar(null)}
        <MartScreen stock={stock} gold={gold} bag={bag} onBuy={buyWare} onReroll={rerollMart} onLeave={() => advance(node.id)} hud={null} onItemMenu={openItemMenu} />
        {itemMenu && <ItemCraftsPopover itemId={itemMenu.itemId} rect={itemMenu.rect} owned={bag} onClose={closeItemMenu} />}
        {poolModal}
        {toastEl}
      </div>
    );
  }

  if (phase === 'event') {
    return (
      <div className={`pa-root ${skinCls} pa-screen`}>
        {topBar(null)}
        <EventScreen options={eventOpts} onChoose={chooseEvent} gold={gold} hud={null} />
        {poolModal}
        {toastEl}
      </div>
    );
  }

  /* ———————————————— Écran de combat ———————————————— */

  const isFight = stage === 'fight';
  const tipUnit = hoverUnit || selected;
  const meterRows = Object.entries(meter)
    .map(([uid, dmg]) => {
      const u = board.find((x) => x?.uid === uid);
      return u ? { uid, dmg, u } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.dmg - a.dmg);
  const trainer = node?.trainer;
  const dragUnit = drag?.kind === 'unit' ? [...board, ...bench].find((u) => u?.uid === drag.uid) : null;
  const dragItem = drag?.kind === 'item' ? ITEM_MAP[drag.itemId] : null;

  return (
    <div className={`pa-root ${skinCls} pa-battle${isFight ? ' is-fighting' : ''}${drag ? ' is-dragging' : ''}`}>
      {topBar(mode === 'versus' ? (
        <div className={`pa-foe pa-vs-timer${!isFight && vsDeadline && vsDeadline - nowTick < 10000 ? ' is-urgent' : ''}`}>
          {isFight || vsOpponent ? (
            <>
              <span className="pa-foe-label">Adversaire</span>
              <strong>{vsOpponent?.name || '…'}</strong>
            </>
          ) : (
            <>
              <span className="pa-foe-label">{vsReady ? 'Prêt · en attente' : 'Préparation'}</span>
              <strong>{vsDeadline ? `${Math.max(0, Math.ceil((vsDeadline - nowTick) / 1000))} s` : '—'}</strong>
            </>
          )}
        </div>
      ) : trainer && (
        <div className={`pa-foe kind-${node.kind}`}>
          <TrainerPortrait trainer={trainer} size="sm" />
          <div className="pa-foe-text">
            <span className="pa-foe-label">{foeLabel(node)}</span>
            <strong>{trainer.title} {trainer.name}</strong>
            <span className="ui-chips">{trainer.types.map((t) => <TypeChip key={t} type={t} small onHover={(tt, e) => openTrait(tt, e)} />)}</span>
          </div>
        </div>
      ))}

      <TraitPanel units={onBoard} onTrait={(t, e, extra) => openTrait(t, e, extra)} />

      <section className="pa-arena">
        <ArenaBoardIso
          board={board}
          enemyBoard={enemyBoard}
          positions={isFight ? positions : null}
          selectedUid={selectedUid}
          placing={placing}
          dragging={drag?.kind === 'unit'}
          fxMap={fxMap}
          hpMap={hpMap}
          floatFx={floatFx}
          act={act}
          actKey={actKey}
          evolving={evolving}
          speed={speed}
          theme={resolveScene(boardTheme, autoScene)}
          premium={skin === 'premium'}
          stage={isFight ? 'fight' : 'prep'}
          onCellClick={onCellClick}
          onHoverUnit={(u) => { setHoverUnit(u); if (u) setTraitPop(null); }}
          onUnitPointerDown={(e, u) => beginDrag(e, {
            kind: 'unit',
            uid: u.uid,
            onClick: () => {
              if (selectedItem) applyItem(u.uid, selectedItem);
              else {
                const idx = board.findIndex((x) => x?.uid === u.uid);
                onCellClick(idx);
              }
            }
          })}
        />
        {mode !== 'versus' && trainer?.sprite && (
          <TrainerStand key={`foe-${node?.id}`} sprite={trainer.sprite} side="foe" label={`${trainer.title || ''} ${trainer.name || ''}`.trim()} />
        )}
        <TrainerStand
          key={`me-${myTrainer}`}
          sprite={PLAYER_TRAINERS.find((t) => t.id === myTrainer)?.sprite || myTrainer}
          side="me"
          label={PLAYER_TRAINERS.find((t) => t.id === myTrainer)?.name || 'Toi'}
        />
        <div className="pa-arena-caption" aria-live="polite">
          {isFight ? fightLine : `${onBoard.length} / ${boardCap} Pokémon sur le terrain`}
        </div>
        {banner && (
          <div key={banner.key} className={`pa-banner${banner.trainer ? ' has-trainer' : ''}`}>
            {banner.trainer && <TrainerPortrait trainer={banner.trainer} size="lg" />}
            <strong>{banner.title}</strong>
            <span>{banner.sub}</span>
          </div>
        )}
      </section>

      <aside className="pa-side">
        {isFight ? (
          <div className="ui-meter">
            <h3>Dégâts</h3>
            {!meterRows.length && <p className="ui-empty">Le combat commence…</p>}
            {meterRows.map((m) => (
              <div key={m.uid} className="ui-meter-row">
                <PokeSprite unit={m.u} size="xs" />
                <i><b style={{ width: `${(m.dmg / Math.max(1, meterRows[0].dmg)) * 100}%`, background: tint(m.u.type) }} /></i>
                <strong>{m.dmg}</strong>
              </div>
            ))}
          </div>
        ) : tipUnit ? (
          <UnitCard
            unit={tipUnit}
            onTrait={(t, e) => openTrait(t, e)}
            footer={canEdit && [...board, ...bench].some((u) => u?.uid === tipUnit.uid) ? (
              <div className="ui-card-actions">
                {board.some((u) => u?.uid === tipUnit.uid) && <button type="button" className="ui-btn is-small" onClick={() => recall(tipUnit.uid)}>Au banc</button>}
                <button type="button" className="ui-btn is-small is-danger" onClick={() => sell(tipUnit.uid)}>Vendre {sellValue(tipUnit)} or</button>
              </div>
            ) : null}
          />
        ) : (
          <div className="ui-help">
            <h3>Préparation</h3>
            <p>Glisse un Pokémon sur une case du terrain. Trois exemplaires identiques fusionnent et évoluent.</p>
            <p>Raccourcis : D relance la boutique, F achète de l’XP, E vend le Pokémon survolé.</p>
          </div>
        )}

        {mode === 'versus' && <VersusPlayers room={vsRoom} me={vsMe} />}

        <div className="pa-bag">
          <header>
            <h3>Sac</h3>
            <button type="button" className="ui-btn is-small is-ghost" onClick={() => setShowRecipes(true)}>Recettes</button>
          </header>
          {bag.length === 0 && <p className="ui-empty">Les combats et le Poké Mart remplissent ton sac.</p>}
          <div className="pa-bag-grid">
            {bag.map((id, i) => {
              const it = ITEM_MAP[id];
              if (!it) return null;
              return (
                <button
                  key={`${id}-${i}`}
                  type="button"
                  className={`pa-bag-item${selectedItem === id && (selectedIdx === i || bag[selectedIdx] !== id) ? ' is-on' : ''}${it.component ? ' is-comp' : ''}${canEdit ? '' : ' is-locked'}`}
                  title={selectedItem && selectedIdx !== i ? undefined : `${it.name} : ${it.desc} (clic droit : recettes)`}
                  aria-disabled={!canEdit}
                  onContextMenu={(e) => openItemMenu(id, e)}
                  onPointerEnter={(e) => { if (selectedItem && selectedIdx !== i) setComboHover({ id, rect: e.currentTarget.getBoundingClientRect() }); }}
                  onPointerLeave={() => setComboHover(null)}
                  onPointerDown={(e) => beginDrag(e, {
                    kind: 'item',
                    itemId: id,
                    onClick: () => {
                      setComboHover(null);
                      if (selectedItem === id && selectedIdx === i) {
                        setSelectedItem(null);
                        setSelectedIdx(-1);
                      } else {
                        setSelectedItem(id);
                        setSelectedIdx(i);
                      }
                    }
                  })}
                >
                  <ItemIcon item={it} size={30} />
                </button>
              );
            })}
          </div>
          {selectedItem && ITEM_MAP[selectedItem] && (
            <p className="pa-bag-tip"><b>{ITEM_MAP[selectedItem].name}</b> {ITEM_MAP[selectedItem].desc} Clique sur un Pokémon pour l’utiliser, ou survole un autre objet pour voir leur combinaison.</p>
          )}
          {bag.length > 0 && !selectedItem && <p className="pa-bag-hint">Clic droit sur un objet : toutes ses recettes.</p>}
        </div>
      </aside>

      <footer className="pa-dock">
        <div className="pa-bench" data-drop="bench" aria-label="Banc">
          {Array.from({ length: BENCH_CAP }).map((_, i) => {
            const unit = bench[i];
            return (
              <button
                key={unit ? unit.uid : `empty-${i}`}
                type="button"
                className={`pa-slot${unit ? ` cost-${unit.cost}` : ' is-empty'}${unit?.uid === selectedUid ? ' is-selected' : ''}${unit && evolving.includes(unit.uid) ? ' is-evolving' : ''}`}
                data-drop="bench"
                data-uid={unit?.uid}
                disabled={!unit || !canEdit}
                onMouseEnter={() => unit && setHoverUnit(unit)}
                onMouseLeave={() => setHoverUnit(null)}
                onPointerDown={(e) => unit && beginDrag(e, {
                  kind: 'unit',
                  uid: unit.uid,
                  onClick: () => {
                    if (selectedItem) applyItem(unit.uid, selectedItem);
                    else setSelectedUid(selectedUid === unit.uid ? null : unit.uid);
                  }
                })}
              >
                {unit && (
                  <>
                    <PokeSprite unit={unit} size="sm" />
                    <span className="pa-slot-stars">{stars(unit.star)}</span>
                    {unit.items?.length > 0 && <span className="pa-slot-items">{unit.items.map((id, k) => <ItemIcon key={`${id}-${k}`} item={ITEM_MAP[id]} size={14} />)}</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {isFight ? (
          <div className="pa-fightbar">
            <div className="pa-speed" role="group" aria-label="Vitesse">
              {SPEEDS.map((s) => (
                <button key={s} type="button" className={`ui-chip${speed === s ? ' is-on' : ''}`} onClick={() => setSpeed(s)}>×{s}</button>
              ))}
            </div>
            <p className="pa-fightline">{fightLine}</p>
            <button type="button" className="ui-btn" onClick={skipFight} disabled={!playRef.current || !!result}>Passer (espace)</button>
          </div>
        ) : (
          <div className={`pa-shopbar${drag?.kind === 'unit' ? ' is-sell' : ''}`} data-drop="sell">
            <div className="pa-shop-actions">
              <button type="button" className="ui-btn is-xp" onClick={buyXp} disabled={!canEdit || level >= MAX_LEVEL || gold < XP_COST}>
                <span>Acheter 4 XP</span><em>{XP_COST} or</em>
              </button>
              <button type="button" className="ui-btn is-roll" onClick={reroll} disabled={!canEdit || gold < REROLL_COST}>
                <span>Relancer</span><em>{REROLL_COST} or</em>
              </button>
              <button type="button" className={`ui-chip${shopLocked ? ' is-on' : ''}`} onClick={() => setShopLocked((v) => !v)} aria-pressed={shopLocked} title="Garde ces Pokémon pour le prochain combat">
                {shopLocked ? 'Boutique gardée' : 'Garder la boutique'}
              </button>
              <button type="button" className="pa-odds-btn" onClick={() => setShowPool(true)} title="Chances par coût à ton niveau · voir le pool">
                <ShopOdds level={level} compact />
              </button>
            </div>
            <div className="pa-shop">
              {drag?.kind === 'unit' && (
                <div className="pa-sell-zone">Lâche ici pour vendre {dragUnit ? `(+${sellValue(dragUnit)} or)` : ''}</div>
              )}
              {shop.map((unit, index) => (unit ? (
                <button
                  key={unit.uid}
                  type="button"
                  className={`pa-card cost-${unit.cost}${gold < unit.cost ? ' is-poor' : ''}`}
                  style={{ '--t': tint(unit.type) }}
                  onClick={() => buy(index)}
                  onMouseEnter={() => setHoverUnit(unit)}
                  onMouseLeave={() => setHoverUnit(null)}
                  disabled={!canEdit}
                >
                  <span className="pa-card-art"><PokeSprite unit={unit} size="md" /></span>
                  <strong>{displayName(unit.name)}</strong>
                  <span className="pa-card-types">
                    {(unit.traits || []).slice(0, 3).map((t) => <i key={t} style={{ background: tint(t) }} title={t} />)}
                    <em>{(unit.traits || []).slice(0, 2).join(', ')}</em>
                  </span>
                  <span className="pa-card-cost" title={`${unit.cost} or`}><i aria-hidden />{unit.cost}</span>
                  {(() => {
                    const owned = [...board, ...bench].filter((u) => u?.lineId === unit.lineId && u.star === 1).length;
                    if (!owned) return null;
                    const left = Math.max(0, 3 - owned);
                    return (
                      <span className="pa-card-owned" title={left <= 1 ? 'En l’achetant, tu fais évoluer ce Pokémon' : `Tu en as ${owned} : encore ${left} pour le faire évoluer`}>
                        {[0, 1, 2].map((i) => <i key={i} className={i < owned ? 'is-have' : i === owned ? 'is-this' : ''} />)}
                      </span>
                    );
                  })()}
                </button>
              ) : <div key={`sold-${index}`} className="pa-card is-sold" aria-hidden />))}
            </div>
            {mode === 'versus' ? (
              <button type="button" className={`ui-btn is-fight${vsReady ? ' is-ready' : ''}`} onClick={() => sendReady(false)} disabled={stage !== 'prep' || !!result}>
                {vsReady ? 'Prêt ✓' : 'Prêt !'}
              </button>
            ) : (
              <button type="button" className="ui-btn is-fight" onClick={fight} disabled={!canEdit}>
                Combattre
              </button>
            )}
          </div>
        )}
      </footer>

      {pendingEvo && LINE_MAP[pendingEvo.lineId]?.forms && (
        <div className="ui-modal" role="dialog" aria-label="Évolution">
          <div className="ui-modal-card">
            <header><h2>{displayName(pendingEvo.name)} évolue !</h2></header>
            <p className="ui-muted">Choisis sa forme. Chaque forme a son propre talent.</p>
            <ul className="ui-reward">
              {LINE_MAP[pendingEvo.lineId].forms.map((form) => {
                const u = unitFromLine(pendingEvo.lineId, pendingEvo.star, `pick-${form.id}`, [], form.id);
                if (!u) return null;
                return (
                  <li key={form.id}>
                    <button type="button" className="ui-reward-card" style={{ '--t': tint(u.type) }} onClick={() => chooseEvo(form.id)}>
                      <PokeSprite unit={u} size="lg" />
                      <strong>{displayName(u.name)}</strong>
                      <span className="ui-chips">{u.types.map((t) => <TypeChip key={t} type={t} small />)}</span>
                      {u.ab && <span><b>{u.ab.name}</b> : {u.ab.desc}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {pendingMega && !pendingEvo && (pendingMega.megaOptions || []).length > 1 && (
        <div className="ui-modal" role="dialog" aria-label="Méga-Évolution">
          <div className="ui-modal-card">
            <header><h2>{displayName(pendingMega.name)} va Méga-évoluer !</h2></header>
            <p className="ui-muted">Il existe plusieurs Méga-Évolutions : choisis la sienne. Mêmes stats, types différents.</p>
            <ul className="ui-reward">
              {pendingMega.megaOptions.map((m, i) => {
                const u = applyMegaChoice({ ...pendingMega, uid: `mega-${i}` }, i);
                if (!u) return null;
                return (
                  <li key={m.dex}>
                    <button type="button" className="ui-reward-card" style={{ '--t': tint(u.type) }} onClick={() => chooseMega(i)}>
                      <PokeSprite unit={u} size="lg" />
                      <strong>{displayName(u.name)}</strong>
                      <span className="ui-chips">{u.types.map((t) => <TypeChip key={t} type={t} small />)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {result && !rewardOpts && (
        <ResultOverlay
          result={result}
          onContinue={continueAfterFight}
          continueLabel={mode === 'versus'
            ? (result.dead || vsRanking ? 'Voir le classement' : 'Préparer le round suivant')
            : result.dead ? 'Voir le bilan' : node?.kind === 'boss' && !result.win ? 'Se préparer à nouveau' : 'Continuer'}
        />
      )}
      {rewardOpts && <RewardModal choices={rewardOpts} onPick={pickReward} />}
      {itemMenu && <ItemCraftsPopover itemId={itemMenu.itemId} rect={itemMenu.rect} owned={bag} onClose={closeItemMenu} />}
      {comboHover && selectedItem && !itemMenu && <ComboPreview a={selectedItem} b={comboHover.id} rect={comboHover.rect} />}
      {showRecipes && <RecipeModal onClose={() => setShowRecipes(false)} />}
      {poolModal}
      <TraitPopup pop={traitPop} />
      {toastEl}

      {drag && (dragUnit || dragItem) && (
        <div className="pa-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden>
          {dragUnit ? <PokeSprite unit={dragUnit} size="md" /> : <ItemIcon item={dragItem} size={40} />}
        </div>
      )}
    </div>
  );
};

export default PokeArena;
