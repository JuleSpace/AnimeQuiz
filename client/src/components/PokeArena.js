import React, { useEffect, useMemo, useRef, useState } from 'react';
import ArenaBoardIso from './ArenaBoardIso';
import './PokeArena.css';
import {
  BENCH_CAP,
  BOARD_CAP,
  BOARD_SIZE,
  CAMPAIGN,
  ITEM_MAP,
  ITEM_SLOTS,
  AIM_LABELS,
  LEVEL_XP,
  LINE_MAP,
  LINES,
  MAGNET,
  RECIPE_LIST,
  ROSTER_FORMS,
  ROSTER_LINES,
  RUN_POOL_SIZE,
  SHOP_SIZE,
  START_GOLD,
  START_HP,
  TRAIT_INFO,
  buildRunPool,
  linePlaystyle,
  rangeLabel,
  clearCampaign,
  emptyBoard,
  enemyWave,
  enforceBoardCap,
  equipItemOnUnit,
  estimateIncome,
  hasSave,
  loadCampaign,
  maybeDropItem,
  mergeUnits,
  rollShop,
  saveCampaign,
  seatFoes,
  simulateFight,
  stripItems,
  traitBonus,
  unitFromLine,
  withBoardSlots
} from './pokeArenaData';

export const ARENA_HASH = '#arena';

const stars = (n) => '★'.repeat(n);
const TYPE_TINT = {
  Feu: '#ff6b3d', Eau: '#3d9bff', Plante: '#3ddc84', Électrik: '#ffe14a',
  Normal: '#d9d9e8', Combat: '#c45a3a', Psy: '#ff6bd6', Spectre: '#8b6bff',
  Dragon: '#6b8cff', Fée: '#ff9ad5', Acier: '#9ab0c8', Glace: '#9ee7ff',
  Roche: '#c4a06a', Ténèbres: '#6b5b8c', Vol: '#a8d4ff', Poison: '#b86bff',
  Sol: '#d4a574', Insecte: '#a8c840'
};

const PokeSprite = ({ unit, size = 'md' }) => {
  const chain = [unit.model, unit.home, unit.art, unit.anim, unit.pixel, unit.sprite].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [unit.uid, unit.model, unit.home]);
  const src = chain[Math.min(idx, chain.length - 1)];
  return (
    <img
      className={`pa-sprite size-${size}${unit.star >= 3 ? ' is-shine' : ''}`}
      src={src}
      alt={unit.name}
      draggable={false}
      onError={() => setIdx((i) => Math.min(i + 1, chain.length - 1))}
    />
  );
};

const STARTERS = [
  { lineId: 'cynda', ring: '#ff7a3d' },
  { lineId: 'mudkip', ring: '#3d9bff' },
  { lineId: 'eevee', ring: '#6b5b8c' }
];

const pickPlayFrames = (frames) => {
  if (!frames?.length) return [];
  if (frames.length <= 22) return frames;
  const step = Math.ceil(frames.length / 20);
  const out = frames.filter((_, i) => i === 0 || i === frames.length - 1 || i % step === 0);
  return out;
};

const TraitTip = ({ trait, count, tip }) => {
  const info = TRAIT_INFO[trait];
  if (!info && !trait) return null;
  return (
    <div className="pa-trait-tip">
      <strong>{info?.title || trait}{count != null ? ` ×${count}` : ''}</strong>
      {info?.blurb && <span>{info.blurb}</span>}
      <em>{tip || info?.effect}</em>
    </div>
  );
};

const SpellTip = ({ unit, onTraitHover }) => {
  if (!unit) return null;
  const traits = [unit.type, ...(unit.traits || []).filter((t) => t !== unit.type)].slice(0, 3);
  return (
    <div className="pa-tip">
      <header className="pa-tip-head">
        <PokeSprite unit={unit} size="md" />
        <div>
          <div className="pa-tip-title">
            <strong>{unit.name}</strong>
            <span className="pa-tip-stars">{stars(unit.star)}</span>
            <span className="pa-tip-cost">{unit.cost}</span>
          </div>
          <div className="pa-tip-types">
            {traits.map((trait) => (
              <i
                key={trait}
                style={{ '--tint': TYPE_TINT[trait] || '#f0c14b' }}
                onMouseEnter={() => onTraitHover?.(trait)}
                onMouseLeave={() => onTraitHover?.(null)}
              >
                {trait}
              </i>
            ))}
          </div>
        </div>
      </header>
      <div className="pa-tip-stats">
        <span><b>PV</b>{unit.hp}</span>
        <span><b>ATK</b>{unit.atk}</span>
        <span><b>SPD</b>{unit.spd}</span>
        <span><b>POR</b>{unit.range || 1}</span>
      </div>
      {unit.spell && (
        <p className="pa-tip-spell">
          <b>{unit.spell.name}</b>
          {unit.spell.desc}
        </p>
      )}
      {(unit.items || []).length > 0 && (
        <ul className="pa-tip-items">
          {(unit.items || []).map((id) => {
            const item = ITEM_MAP[id];
            if (!item) return null;
            return (
              <li key={id}>
                {item.sprite
                  ? <img src={item.sprite} alt="" className="pa-tip-item-spr" />
                  : <span>{item.icon}</span>}
                <div>
                  <b>{item.name}</b>
                  <em>{item.desc}</em>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const ItemIcon = ({ item, size = 28 }) => {
  const [fail, setFail] = useState(false);
  if (!item) return null;
  if (item.sprite && !fail) {
    return (
      <img
        src={item.sprite}
        alt={item.name}
        className="pa-item-spr"
        style={{ width: size, height: size }}
        draggable={false}
        onError={() => setFail(true)}
      />
    );
  }
  return <span className="pa-item-emoji">{item.icon}</span>;
};

const padBoard = (board) => {
  const next = [...board];
  while (next.length < BOARD_SIZE) next.push(null);
  return next.slice(0, BOARD_SIZE);
};

const PokeArena = ({ onClose }) => {
  const [phase, setPhase] = useState('hub');
  const [stage, setStage] = useState('prep');
  const [bench, setBench] = useState([]);
  const [board, setBoard] = useState(emptyBoard);
  const [enemyBoard, setEnemyBoard] = useState(emptyBoard);
  const [shop, setShop] = useState([]);
  const [bag, setBag] = useState([]);
  const [gold, setGold] = useState(START_GOLD);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(START_HP);
  const [wave, setWave] = useState(1);
  const [streak, setStreak] = useState(0);
  const [log, setLog] = useState('');
  const [fightLine, setFightLine] = useState('');
  const [locked, setLocked] = useState(false);
  const [selectedUid, setSelectedUid] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoverItem, setHoverItem] = useState(null);
  const [fxMap, setFxMap] = useState({});
  const [hpMap, setHpMap] = useState({});
  const [hoverUnit, setHoverUnit] = useState(null);
  const [hoverTrait, setHoverTrait] = useState(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [runPool, setRunPool] = useState([]);
  const [saveMsg, setSaveMsg] = useState('');
  const [canContinue, setCanContinue] = useState(() => hasSave());
  const [codexCost, setCodexCost] = useState(0);
  const [codexQuery, setCodexQuery] = useState('');
  const [codexPick, setCodexPick] = useState(null);
  const timers = useRef([]);

  const codexLines = useMemo(() => {
    const q = codexQuery.trim().toLowerCase();
    return LINES.filter((line) => {
      if (codexCost && line.cost !== codexCost) return false;
      if (!q) return true;
      const names = line.stages.map((s) => s.name).join(' ');
      const traits = (line.traits || []).join(' ');
      const hay = `${line.id} ${names} ${traits} ${line.spell?.name || ''} ${line.spell?.desc || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [codexCost, codexQuery]);

  const codexSelected = codexPick ? LINE_MAP[codexPick] : null;

  const boardCap = BOARD_CAP[Math.min(9, level)] || 1;
  const onBoard = board.filter(Boolean);
  const traits = useMemo(() => traitBonus(onBoard), [onBoard]);
  const incomeEst = useMemo(() => estimateIncome(gold, streak, wave), [gold, streak, wave]);
  const selected = bench.find((u) => u.uid === selectedUid)
    || board.find((u) => u?.uid === selectedUid)
    || null;
  const placing = !!(selectedUid && bench.some((u) => u.uid === selectedUid));
  const node = CAMPAIGN[Math.min(CAMPAIGN.length, Math.max(1, wave)) - 1];
  const shopPool = runPool.length ? runPool : null;

  const rollFromPool = (lv) => rollShop(lv, SHOP_SIZE, shopPool || undefined);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const snapshotSave = () => ({
    phase: 'map',
    stage: 'prep',
    bench,
    board,
    shop,
    bag,
    gold,
    xp,
    level,
    hp,
    wave,
    streak,
    runPoolIds: runPool.map((l) => l.id)
  });

  const persist = () => {
    const ok = saveCampaign(snapshotSave());
    setCanContinue(ok);
    setSaveMsg(ok ? 'Partie sauvegardée.' : 'Échec sauvegarde.');
    setTimeout(() => setSaveMsg(''), 2200);
  };

  const resumeSave = () => {
    const data = loadCampaign();
    if (!data) return setLog('Aucune sauvegarde.');
    clearTimers();
    const pool = (data.runPoolIds || [])
      .map((id) => LINE_MAP[id])
      .filter(Boolean);
    const restoredPool = pool.length ? pool : buildRunPool();
    setRunPool(restoredPool);
    setBench(data.bench || []);
    setBoard(padBoard(data.board || emptyBoard()));
    setShop(data.shop?.length ? data.shop : rollShop(data.level || 1, SHOP_SIZE, restoredPool));
    setBag(data.bag || []);
    setGold(data.gold ?? START_GOLD);
    setXp(data.xp || 0);
    setLevel(data.level || 1);
    setHp(data.hp ?? START_HP);
    setWave(data.wave || 1);
    setStreak(data.streak || 0);
    setEnemyBoard(emptyBoard());
    setFxMap({});
    setHpMap({});
    setSelectedUid(null);
    setSelectedItem(null);
    setHoverTrait(null);
    setLocked(false);
    setStage('prep');
    setPhase('map');
    setLog(`Partie reprise · catalogue run : ${restoredPool.length} lignées.`);
  };

  const mapUnit = (uid, fn) => {
    setBoard((current) => current.map((u) => (u?.uid === uid ? fn(u) : u)));
    setBench((current) => current.map((u) => (u?.uid === uid ? fn(u) : u)));
  };

  const applyMerge = (nextBoard, nextBench, prefix = '') => {
    const merged = mergeUnits(padBoard(nextBoard), nextBench);
    const capped = enforceBoardCap(merged.board, merged.bench, BOARD_CAP[Math.min(9, level)] || 1);
    const notes = [...merged.notes];
    if (capped.moved) notes.push(`${capped.moved} renvoyé(s) au banc (cap terrain)`);
    if (notes.length) setLog(`${prefix}${notes.join(' · ')}`);
    setBoard(padBoard(capped.board));
    setBench(capped.bench);
    return { ...merged, board: capped.board, bench: capped.bench };
  };

  const openStarter = () => {
    clearTimers();
    clearCampaign();
    setCanContinue(false);
    setPhase('starter');
    setStage('prep');
    setBench([]);
    setBoard(emptyBoard());
    setEnemyBoard(emptyBoard());
    setBag([]);
    setGold(START_GOLD);
    setXp(0);
    setLevel(1);
    setHp(START_HP);
    setWave(1);
    setStreak(0);
    setFightLine('');
    setLocked(false);
    setSelectedUid(null);
    setSelectedItem(null);
    setFxMap({});
    setHpMap({});
    setHoverUnit(null);
    setHoverTrait(null);
    setRunPool([]);
    setShop([]);
    setLog('Choisis ton partenaire de départ.');
  };

  const previewWave = (w, lv) => {
    setEnemyBoard(seatFoes(enemyWave(w, lv)));
  };

  const pickStarter = (lineId) => {
    const starter = unitFromLine(lineId, 1);
    const pool = buildRunPool([lineId]);
    setRunPool(pool);
    setBench([starter]);
    setSelectedUid(starter.uid);
    setShop(rollShop(1, SHOP_SIZE, pool));
    setPhase('map');
    setLog(`${starter.name} te rejoint ! Boutique : ${pool.length}/${RUN_POOL_SIZE} lignées tirées pour cette run.`);
  };

  const enterNode = (nodeId) => {
    if (locked) return;
    if (nodeId > wave) return setLog('Étape verrouillée.');
    if (nodeId < wave) return setLog('Étape déjà validée — avance sur la suivante.');
    setPhase('run');
    setStage('prep');
    previewWave(nodeId, level);
    setHpMap({});
    setFxMap({});
    setLog(`${CAMPAIGN[nodeId - 1]?.name || `Étape ${nodeId}`} — place ton équipe, puis Combat.`);
  };

  useEffect(() => {
    if (phase === 'run' && stage === 'prep') previewWave(wave, level);
  }, [phase, stage, wave, level]);

  const buyXp = () => {
    if (locked || stage !== 'prep') return;
    if (level >= 9) return setLog('Niveau max.');
    if (gold < 4) return setLog('Il faut 4 or pour +4 XP.');
    setGold((g) => g - 4);
    setXp((current) => {
      let nextXp = current + 4;
      let nextLevel = level;
      while (nextLevel < 9 && nextXp >= (LEVEL_XP[nextLevel + 1] || 999)) {
        nextXp -= LEVEL_XP[nextLevel + 1];
        nextLevel += 1;
      }
      if (nextLevel !== level) {
        setLevel(nextLevel);
        setLog(`Niveau ${nextLevel} ! Cap terrain : ${BOARD_CAP[nextLevel]}.`);
      } else setLog(`+4 XP (${nextXp}/${LEVEL_XP[nextLevel + 1] || '—'}).`);
      return nextXp;
    });
  };

  const refreshShop = () => {
    if (locked || stage !== 'prep') return;
    if (gold < 2) return setLog('Reroll = 2 or.');
    setGold((g) => g - 2);
    setShop(rollFromPool(level));
  };

  const buy = (index) => {
    if (locked || stage !== 'prep') return;
    const offer = shop[index];
    if (!offer) return;
    if (gold < offer.cost) return setLog(`Il faut ${offer.cost} or.`);
    if (bench.length >= BENCH_CAP) return setLog('Banc plein.');
    const bought = unitFromLine(offer.lineId, 1);
    setGold((g) => g - offer.cost);
    setShop((current) => current.map((slot, i) => (i === index ? null : slot)));
    applyMerge(board, [...bench, bought], 'Fusion : ');
    setSelectedUid(bought.uid);
    setLog(`${bought.name} — sort : ${bought.spell?.name}. Place-le sur une case.`);
  };

  const placeAt = (index) => {
    if (locked || stage !== 'prep') return;

    if (selectedItem && board[index]) {
      applyItemToUid(board[index].uid, selectedItem);
      return;
    }

    if (!selectedUid) {
      if (board[index]) {
        setSelectedUid(board[index].uid);
        setHoverUnit(board[index]);
      }
      return;
    }

    const fromBench = bench.find((u) => u.uid === selectedUid);
    const fromBoardIdx = board.findIndex((u) => u?.uid === selectedUid);

    if (fromBench) {
      if (onBoard.length >= boardCap && !board[index]) {
        return setLog(`Terrain limité à ${boardCap}.`);
      }
      const nextBoard = [...board];
      const displaced = nextBoard[index];
      nextBoard[index] = fromBench;
      let nextBench = bench.filter((u) => u.uid !== selectedUid);
      if (displaced) nextBench = [...nextBench, displaced];
      applyMerge(nextBoard, nextBench, '');
      setSelectedUid(null);
      return;
    }

    if (fromBoardIdx >= 0) {
      const nextBoard = [...board];
      const a = nextBoard[fromBoardIdx];
      const b = nextBoard[index];
      nextBoard[fromBoardIdx] = b;
      nextBoard[index] = a;
      applyMerge(nextBoard, bench, '');
      setSelectedUid(null);
    }
  };

  const consumeBagItem = (itemId) => {
    setBag((current) => {
      const i = current.indexOf(itemId);
      if (i < 0) return current;
      const next = [...current];
      next.splice(i, 1);
      return next;
    });
  };

  const applyItemToUid = (uid, itemId) => {
    if (locked || stage !== 'prep' || !itemId) return;
    if (itemId === 'magnet') {
      let found = null;
      const onB = board.find((u) => u?.uid === uid);
      const onBench = bench.find((u) => u?.uid === uid);
      found = onB || onBench;
      if (!found) return;
      const { unit, stripped } = stripItems(found);
      mapUnit(uid, () => unit);
      if (stripped.length) setBag((b) => [...b, ...stripped]);
      consumeBagItem('magnet');
      setSelectedItem(null);
      setLog(`Aimant : objets retirés de ${found.name}.`);
      return;
    }
    const target = board.find((u) => u?.uid === uid) || bench.find((u) => u?.uid === uid);
    if (!target) return;
    const result = equipItemOnUnit(target, itemId);
    if (!result) return setLog(`Impossible (max ${ITEM_SLOTS} ou combo invalide).`);
    mapUnit(uid, () => result.unit);
    consumeBagItem(itemId);
    setSelectedItem(null);
    setLog(result.note);
  };

  const equipOnSelected = () => {
    if (!selectedItem || !selected) return setLog('Choisis un item puis un Pokémon.');
    applyItemToUid(selected.uid, selectedItem);
  };

  const sellSelected = () => {
    if (locked || stage !== 'prep' || !selectedUid) return;
    let unit = null;
    if (bench.some((u) => u.uid === selectedUid)) {
      unit = bench.find((u) => u.uid === selectedUid);
      setBench((current) => current.filter((u) => u.uid !== selectedUid));
    } else {
      const index = board.findIndex((u) => u?.uid === selectedUid);
      if (index < 0) return;
      unit = board[index];
      setBoard((current) => {
        const next = [...current];
        next[index] = null;
        return next;
      });
    }
    if (unit?.items?.length) setBag((b) => [...b, ...unit.items]);
    if (!unit) return;
    const refund = Math.max(1, unit.cost * unit.star);
    setGold((g) => g + refund);
    setSelectedUid(null);
    setLog(`Vente ${unit.name} · +${refund} or.`);
  };

  const recallSelected = () => {
    if (locked || stage !== 'prep' || !selectedUid) return;
    const index = board.findIndex((u) => u?.uid === selectedUid);
    if (index < 0) return;
    if (bench.length >= BENCH_CAP) return setLog('Banc plein.');
    const unit = board[index];
    const nextBoard = [...board];
    nextBoard[index] = null;
    applyMerge(nextBoard, [...bench, unit], '');
    setSelectedUid(null);
  };

  const finishFight = (result, currentGold, currentHp, currentStreak, currentLevel, currentWave) => {
    setFxMap({});
    const drop = maybeDropItem(result.win, currentWave);
    if (drop) {
      setBag((b) => [...b, drop.id]);
    }

    if (result.win) {
      const earned = estimateIncome(currentGold, currentStreak, currentWave);
      const reward = earned.total;
      setGold((g) => g + reward);
      setStreak((s) => s + 1);
      setXp((current) => {
        let nextXp = current + 2;
        let nextLevel = currentLevel;
        while (nextLevel < 9 && nextXp >= (LEVEL_XP[nextLevel + 1] || 999)) {
          nextXp -= LEVEL_XP[nextLevel + 1];
          nextLevel += 1;
        }
        if (nextLevel !== currentLevel) setLevel(nextLevel);
        return nextXp;
      });
      const nextWave = Math.min(CAMPAIGN.length + 1, currentWave + 1);
      setWave(nextWave);
      const nextShop = rollShop(currentLevel, SHOP_SIZE, shopPool || undefined);
      setShop(nextShop);
      setStage('prep');
      setLocked(false);
      setFightLine('');
      setEnemyBoard(emptyBoard());
      setHpMap({});
      const incomeNote = `+${reward} or (base ${earned.base} · intérêt ${earned.interest} · série ${earned.streakBonus})`;
      if (currentWave >= CAMPAIGN.length) {
        setPhase('over');
        setLog(`Campagne terminée ! ${incomeNote}${drop ? ` · ${drop.name}` : ''}.`);
      } else {
        setPhase('map');
        setLog(`Victoire — ${CAMPAIGN[currentWave - 1]?.name} ! ${incomeNote}${drop ? ` · ${drop.name}` : ''}.`);
        setTimeout(() => saveCampaign({
          phase: 'map', stage: 'prep', bench, board, shop: nextShop,
          bag: drop ? [...bag, drop.id] : bag, gold: currentGold + reward, xp, level: currentLevel,
          hp: currentHp, wave: nextWave, streak: currentStreak + 1,
          runPoolIds: runPool.map((l) => l.id)
        }), 0);
        setCanContinue(true);
      }
      return;
    }

    const dmg = Math.min(currentHp, Math.max(2, result.damage + Math.floor(currentWave / 4)));
    const nextHp = currentHp - dmg;
    setHp(nextHp);
    setStreak(0);
    setHpMap({});
    if (nextHp <= 0) {
      setPhase('over');
      setStage('over');
      setLocked(false);
      setFightLine('');
      clearCampaign();
      setCanContinue(false);
      setLog(`Game over — ${CAMPAIGN[currentWave - 1]?.name || `étape ${currentWave}`}.`);
      return;
    }
    setLog(`Défaite -${dmg} PV${drop ? ` · butin ${drop.name}` : ''}. Réessaie l’étape.`);
    setShop(rollShop(currentLevel, SHOP_SIZE, shopPool || undefined));
    setStage('prep');
    setPhase('run');
    setLocked(false);
    setFightLine('');
    previewWave(currentWave, currentLevel);
  };

  const fight = () => {
    if (locked || stage !== 'prep') return;
    const capped = enforceBoardCap(board, bench, boardCap);
    if (capped.moved) {
      setBoard(padBoard(capped.board));
      setBench(capped.bench);
      setLog(`${capped.moved} renvoyé(s) au banc (cap ${boardCap}).`);
    }
    const fighters = capped.board.filter(Boolean);
    if (!fighters.length) return setLog('Place au moins un Pokémon.');
    clearTimers();
    setLocked(true);
    setSelectedUid(null);
    setSelectedItem(null);
    setStage('fight');
    setLog('Combat…');

    const foesRaw = enemyWave(wave, level);
    const foeBoard = seatFoes(foesRaw);
    setEnemyBoard(foeBoard);
    const allies = withBoardSlots(padBoard(capped.board), 'ally');
    const foes = withBoardSlots(foeBoard, 'foe');

    const result = simulateFight(allies, foes);
    const play = pickPlayFrames(result.frames);
    const snapshot = { gold, hp, streak, level, wave };

    if (play[0]?.hp) setHpMap(play[0].hp);

    play.forEach((frame, i) => {
      const id = setTimeout(() => {
        setFightLine(frame.line || '');
        setHpMap(frame.hp || {});
        setFxMap(frame.fx || {});
      }, 280 + i * 420);
      timers.current.push(id);
    });

    const endId = setTimeout(() => {
      finishFight(result, snapshot.gold, snapshot.hp, snapshot.streak, snapshot.level, snapshot.wave);
    }, 280 + play.length * 420 + 500);
    timers.current.push(endId);
  };

  const xpNeed = level >= 9 ? null : LEVEL_XP[level + 1];
  const tipUnit = hoverUnit || selected;

  if (phase === 'hub') {
    return (
      <div className="pa-root">
        <div className="pa-hub">
          <div className="pa-hub-glow" aria-hidden />
          <div className="pa-hub-card">
            <p className="pa-hub-kicker">Campagne solo · Auto-battler</p>
            <h1 className="pa-hub-brand">
              <span className="pa-hub-brand-poke">POKE</span>
              <span className="pa-hub-brand-bully">BULLY</span>
              <span className="pa-hub-brand-tac">TACTICS</span>
            </h1>
            <p className="pa-hub-sub">{ROSTER_LINES} lignées · {ROSTER_FORMS} formes · ~{RUN_POOL_SIZE} en boutique / run</p>
            <p className="pa-hub-copy">
              Place, fusionne, harcèle. Chaque run tire un catalogue équilibré ; en face, tout le roster peut débarquer.
            </p>
            <div className="pa-hub-actions">
              <button type="button" className="pa-btn pa-btn-gold" onClick={openStarter}>Nouvelle partie</button>
              {canContinue && (
                <button type="button" className="pa-btn pa-btn-gold" onClick={resumeSave}>Continuer</button>
              )}
              <button
                type="button"
                className="pa-btn pa-btn-ghost"
                onClick={() => { setPhase('codex'); setCodexPick(LINES[0]?.id || null); }}
              >
                Codex lignées
              </button>
              <button type="button" className="pa-btn pa-btn-ghost" onClick={onClose}>Quitter</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'codex') {
    const detail = codexSelected || codexLines[0] || null;
    const detailForms = detail
      ? [1, 2, 3].map((star) => unitFromLine(detail.id, star)).filter(Boolean)
      : [];
    return (
      <div className="pa-root pa-codex-root">
        <header className="pa-codex-top">
          <div className="pa-codex-brand">
            <strong>POKE BULLY TACTICS</strong>
            <span>Codex · {codexLines.length}/{ROSTER_LINES} lignées</span>
          </div>
          <div className="pa-codex-filters">
            <input
              className="pa-codex-search"
              type="search"
              placeholder="Chercher un poké, type, sort…"
              value={codexQuery}
              onChange={(e) => setCodexQuery(e.target.value)}
            />
            <div className="pa-codex-costs">
              <button
                type="button"
                className={`pa-chip${codexCost === 0 ? ' is-on' : ''}`}
                onClick={() => setCodexCost(0)}
              >
                Tous
              </button>
              {[1, 2, 3, 4, 5].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`pa-chip${codexCost === c ? ' is-on' : ''}`}
                  onClick={() => setCodexCost(c)}
                >
                  Coût {c}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="pa-chip" onClick={() => setPhase('hub')}>Menu</button>
        </header>

        <div className="pa-codex">
          <aside className="pa-codex-list" aria-label="Lignées">
            {codexLines.map((line) => {
              const preview = unitFromLine(line.id, 1);
              const active = (codexPick || detail?.id) === line.id;
              return (
                <button
                  key={line.id}
                  type="button"
                  className={`pa-codex-row${active ? ' is-active' : ''}`}
                  style={{ '--tint': TYPE_TINT[preview?.type] || '#c8f542' }}
                  onClick={() => setCodexPick(line.id)}
                >
                  {preview && <PokeSprite unit={preview} size="sm" />}
                  <div className="pa-codex-row-meta">
                    <strong>{line.stages[0]?.name}</strong>
                    <span>→ {line.stages[2]?.name}</span>
                  </div>
                  <em className="pa-codex-cost">{line.cost}</em>
                </button>
              );
            })}
            {!codexLines.length && <p className="pa-codex-empty">Aucun résultat.</p>}
          </aside>

          {detail && (
            <section className="pa-codex-detail">
              <header className="pa-codex-detail-head">
                <div>
                  <p className="pa-codex-kicker">Lignée · coût {detail.cost}</p>
                  <h2>{detail.stages.map((s) => s.name).join(' → ')}</h2>
                  <p className="pa-codex-role">{linePlaystyle(detail)}</p>
                </div>
                <div className="pa-codex-badges">
                  <span className="pa-codex-badge">Portée {rangeLabel(detail.range)}</span>
                  {(detail.traits || []).map((t) => (
                    <span
                      key={t}
                      className="pa-codex-badge is-type"
                      style={{ '--tint': TYPE_TINT[t] || '#c8f542' }}
                      title={TRAIT_INFO[t]?.effect || t}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </header>

              <div className="pa-codex-evo">
                {detailForms.map((form, i) => (
                  <article key={form.uid} className="pa-codex-stage">
                    <div className="pa-codex-stage-art" style={{ '--tint': TYPE_TINT[form.type] || '#c8f542' }}>
                      <PokeSprite unit={form} size="lg" />
                      <span className="pa-codex-stars">{stars(i + 1)}</span>
                    </div>
                    <h3>{form.name}</h3>
                    <p className="pa-codex-type" style={{ '--tint': TYPE_TINT[form.type] || '#c8f542' }}>{form.type}</p>
                    <ul className="pa-codex-stats">
                      <li><b>PV</b>{form.hp}</li>
                      <li><b>ATK</b>{form.atk}</li>
                      <li><b>SPD</b>{form.spd}</li>
                    </ul>
                  </article>
                ))}
              </div>

              <div className="pa-codex-spell">
                <h3>Sort — {detail.spell?.name}</h3>
                <p>{detail.spell?.desc}</p>
                <ul>
                  <li>Fréquence : tous les {detail.spell?.every || '?'} tours</li>
                  <li>Ciblage : {AIM_LABELS[detail.spell?.aim] || detail.spell?.aim || '—'}</li>
                  <li>Multiplicateur : ×{detail.spell?.mult || 1}</li>
                  <li>Portée auto : {detail.range || 1} · sorts : {(detail.range || 1) + 1}</li>
                </ul>
              </div>

              <div className="pa-codex-traits-explain">
                <h3>Synergies de la lignée</h3>
                <ul>
                  {(detail.traits || []).map((t) => {
                    const info = TRAIT_INFO[t];
                    return (
                      <li key={t}>
                        <strong style={{ color: TYPE_TINT[t] || 'var(--pa-acid)' }}>{t}</strong>
                        <span>{info?.blurb}</span>
                        <em>{info?.effect}</em>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="pa-codex-hint">
                En run, tu ne vois qu’~{RUN_POOL_SIZE} lignées en boutique. Les adversaires peuvent tirer n’importe laquelle du catalogue ({ROSTER_LINES}).
              </p>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'map') {
    return (
      <div className="pa-root">
        <header className="pa-top">
          <div className="pa-hp">❤ {hp}</div>
          <div className="pa-gold-top">
            <strong>{gold} or</strong>
            <span className="pa-income-mini">→ +{incomeEst.total}</span>
          </div>
          <div className="pa-wave">
            <strong>CAMPAGNE</strong>
            <span>Étape {Math.min(wave, CAMPAIGN.length)}/{CAMPAIGN.length}</span>
          </div>
          <div className="pa-top-actions">
            <button type="button" className="pa-chip" onClick={persist}>Sauver</button>
            <button type="button" className="pa-chip" onClick={() => setPhase('hub')}>Menu</button>
            <button type="button" className="pa-chip pa-chip-danger" onClick={onClose}>Quitter</button>
          </div>
        </header>
        <p className="pa-log">{saveMsg || log || 'Choisis la prochaine étape.'}</p>
        <p className="pa-income-bar">
          Estimation prochain round (si victoire) : <strong>+{incomeEst.total} or</strong>
          <span>base {incomeEst.base} · intérêt {incomeEst.interest}/5 · série {incomeEst.streakBonus}</span>
          {incomeEst.nextInterestGold != null && (
            <em>Encore {incomeEst.nextInterestGold - gold} or pour +1 intérêt</em>
          )}
        </p>
        <div className="pa-map">
          <h2 className="pa-map-title">ROUTE BULLY</h2>
          <div className="pa-map-path">
            {CAMPAIGN.map((n, i) => {
              const status = n.id < wave ? 'done' : n.id === wave ? 'current' : 'locked';
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`pa-map-node biome-${n.biome} is-${status}${n.boss ? ' is-boss' : ''}`}
                  onClick={() => enterNode(n.id)}
                  disabled={status === 'locked' || status === 'done'}
                >
                  <span className="pa-map-idx">{n.id}</span>
                  <strong>{n.name}</strong>
                  <em>{n.blurb}</em>
                  {status === 'current' && <span className="pa-map-go">Jouer →</span>}
                  {status === 'done' && <span className="pa-map-go">OK</span>}
                  {i < CAMPAIGN.length - 1 && <span className="pa-map-link" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="pa-map-hint">
            NV {level} · Banc {bench.length}/{BENCH_CAP}
            {runPool.length ? ` · Catalogue ${runPool.length} lignées` : ''}
            · Sauvegarde auto après victoire
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="pa-root">
        <div className="pa-over">
          <h2>{hp <= 0 ? 'GAME OVER' : 'CLEAR !'}</h2>
          <p>{log}</p>
          <button type="button" className="pa-btn pa-btn-gold" onClick={openStarter}>Nouvelle run</button>
          <button type="button" className="pa-btn pa-btn-ghost" onClick={() => setPhase('hub')}>Menu</button>
        </div>
      </div>
    );
  }

  if (phase === 'starter') {
    return (
      <div className="pa-root">
        <div className="pa-starter">
          <h1>Ton bully de départ</h1>
          <p className="pa-starter-hint">Choisis un partenaire — survole pour stats, types et sort</p>
          <div className="pa-starter-row">
            {STARTERS.map(({ lineId, ring }) => {
              const preview = unitFromLine(lineId, 1);
              return (
                <button
                  key={lineId}
                  type="button"
                  className="pa-starter-card"
                  style={{ '--ring': ring }}
                  onClick={() => pickStarter(lineId)}
                  onMouseEnter={() => { setHoverUnit(preview); setHoverTrait(null); }}
                >
                  <PokeSprite unit={preview} size="lg" />
                  <strong>{preview.name}</strong>
                  <em>{preview.type} · P{preview.range || 1}</em>
                </button>
              );
            })}
          </div>
          <div className="pa-starter-tips">
            {hoverUnit && <SpellTip unit={hoverUnit} onTraitHover={setHoverTrait} />}
            {hoverTrait && <TraitTip trait={hoverTrait} />}
          </div>
          <button type="button" className="pa-btn pa-btn-ghost" onClick={() => setPhase('hub')}>Retour</button>
        </div>
      </div>
    );
  }

  const traitEntries = Object.entries(traits.counts || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const tipTraitInfo = hoverTrait
    ? (typeof hoverTrait === 'object'
      ? hoverTrait
      : {
          trait: hoverTrait,
          count: traits.counts?.[hoverTrait],
          tip: traits.details?.find((d) => d.trait === hoverTrait)?.tip
        })
    : null;

  return (
    <div className={`pa-root${stage === 'fight' ? ' is-fighting' : ''}`}>
      <header className="pa-top">
        <div className="pa-hp">❤ {hp}</div>
        <div className="pa-gold-top">
          <strong>{gold} or</strong>
          <span className="pa-income-mini" title="Estimation si victoire au prochain combat">
            → +{incomeEst.total}
          </span>
        </div>
        <div className="pa-wave">
          <strong>{node?.name || `Étape ${wave}`}</strong>
          <span>{onBoard.length}/{boardCap} terrain · {node?.blurb}</span>
        </div>
        <div className="pa-traits">
          {traitEntries.length === 0 && <span className="pa-traits-empty">Synergies</span>}
          {traitEntries.map(([trait, count]) => {
            const detail = traits.details?.find((d) => d.trait === trait);
            return (
              <i
                key={trait}
                className={count >= 2 ? 'is-active' : ''}
                style={{ '--tint': TYPE_TINT[trait] || '#f0c14b' }}
                onMouseEnter={() => setHoverTrait({
                  trait,
                  count,
                  tip: detail?.tip,
                  blurb: detail?.blurb,
                  effect: detail?.effect || TRAIT_INFO[trait]?.effect
                })}
                onMouseLeave={() => setHoverTrait(null)}
              >
                {trait} ×{count}
              </i>
            );
          })}
          {tipTraitInfo && (
            <div className="pa-trait-tip-anchor">
              <TraitTip
                trait={tipTraitInfo.trait}
                count={tipTraitInfo.count}
                tip={tipTraitInfo.tip || tipTraitInfo.effect}
              />
            </div>
          )}
        </div>
        <div className="pa-top-actions">
          <button type="button" className="pa-chip" onClick={persist} disabled={stage === 'fight'}>Sauver</button>
          <button type="button" className="pa-chip" onClick={() => setPhase('map')} disabled={stage === 'fight'}>Carte</button>
          <button type="button" className="pa-chip pa-chip-danger" onClick={onClose}>Quitter</button>
        </div>
      </header>

      <p className="pa-log">{saveMsg || fightLine || log}</p>
      {stage === 'prep' && (
        <p className="pa-income-bar">
          Prochain round estimé : <strong>+{incomeEst.total} or</strong>
          <span>base {incomeEst.base} · intérêt {incomeEst.interest}/5 (10 or = +1) · série {incomeEst.streakBonus}</span>
          {incomeEst.nextInterestGold != null && (
            <em>À {incomeEst.nextInterestGold} or → intérêt {incomeEst.interest + 1}</em>
          )}
        </p>
      )}

      <>
          <div className="pa-stage">
            <ArenaBoardIso
              board={board}
              enemyBoard={enemyBoard}
              selectedUid={selectedUid}
              placing={placing}
              fxMap={fxMap}
              hpMap={hpMap}
              stage={stage}
              onCellClick={placeAt}
              onHoverUnit={(u) => { setHoverUnit(u); if (u) setHoverTrait(null); }}
            />
            {tipUnit && (
              <div className="pa-tip-float">
                <SpellTip unit={tipUnit} onTraitHover={setHoverTrait} />
                {hoverTrait && typeof hoverTrait === 'string' && (
                  <TraitTip trait={hoverTrait} />
                )}
              </div>
            )}
          </div>

          {showRecipes && (
            <div className="pa-modal" role="dialog">
              <div className="pa-modal-card">
                <header>
                  <h2>Combinaisons</h2>
                  <button type="button" className="pa-chip" onClick={() => setShowRecipes(false)}>Fermer</button>
                </header>
                <ul className="pa-recipes">
                  {RECIPE_LIST.map((row) => (
                    <li key={`${row.a}-${row.b}-${row.result.id}`}>
                      <span className="pa-recipe-cell">
                        <ItemIcon item={ITEM_MAP[row.a]} size={22} />
                        {ITEM_MAP[row.a]?.name}
                      </span>
                      <span>+</span>
                      <span className="pa-recipe-cell">
                        <ItemIcon item={ITEM_MAP[row.b]} size={22} />
                        {ITEM_MAP[row.b]?.name}
                      </span>
                      <span>→</span>
                      <strong className="pa-recipe-cell">
                        <ItemIcon item={row.result} size={22} />
                        {row.result.name}
                      </strong>
                      <em>{row.result.desc}</em>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="pa-dock">
            <div className="pa-items-row">
              <span className="pa-items-label">Objets</span>
              <div className="pa-items-bag">
                {bag.length === 0 && <span className="pa-items-label">Butin après combat</span>}
                {bag.map((id, index) => {
                  const item = ITEM_MAP[id] || (id === 'magnet' ? MAGNET : null);
                  if (!item) return null;
                  return (
                    <button
                      key={`${id}-${index}`}
                      type="button"
                      className={`pa-item${selectedItem === id ? ' is-selected' : ''}`}
                      onClick={() => setSelectedItem(selectedItem === id ? null : id)}
                      onMouseEnter={() => setHoverItem(item)}
                      onMouseLeave={() => setHoverItem(null)}
                      disabled={stage !== 'prep'}
                      title={item.name}
                    >
                      <ItemIcon item={item} size={32} />
                    </button>
                  );
                })}
              </div>
              {(hoverItem || (selectedItem && (ITEM_MAP[selectedItem] || (selectedItem === 'magnet' ? MAGNET : null)))) && (
                <div className="pa-item-tip" aria-live="polite">
                  {(() => {
                    const tip = hoverItem || ITEM_MAP[selectedItem] || MAGNET;
                    return (
                      <>
                        <div className="pa-item-tip-head">
                          <ItemIcon item={tip} size={36} />
                          <strong>{tip.name}</strong>
                        </div>
                        <span>{tip.desc}</span>
                        {tip.component && <em>Vitamine · combine avec une autre pour fabriquer</em>}
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="pa-items-actions">
                <button type="button" className="pa-chip" onClick={() => setShowRecipes(true)}>Combinaisons</button>
                <button
                  type="button"
                  className="pa-chip"
                  onClick={equipOnSelected}
                  disabled={stage !== 'prep' || !selectedItem || !selected}
                >
                  Équiper
                </button>
                <button
                  type="button"
                  className="pa-chip"
                  onClick={recallSelected}
                  disabled={stage !== 'prep' || !selected || !board.some((u) => u?.uid === selectedUid)}
                >
                  Rappeler
                </button>
                <button
                  type="button"
                  className="pa-chip pa-chip-danger"
                  onClick={sellSelected}
                  disabled={stage !== 'prep' || !selected}
                >
                  Vendre
                </button>
              </div>
            </div>

            <div className="pa-bench">
              {Array.from({ length: BENCH_CAP }).map((_, i) => {
                const unit = bench[i];
                return (
                  <button
                    key={unit ? unit.uid : `bench-empty-${i}`}
                    type="button"
                    className={`pa-bench-slot${unit?.uid === selectedUid ? ' is-selected' : ''}`}
                    onClick={() => {
                      if (stage !== 'prep' || !unit) return;
                      if (selectedItem) {
                        applyItemToUid(unit.uid, selectedItem);
                        return;
                      }
                      setSelectedUid(unit.uid === selectedUid ? null : unit.uid);
                      setHoverUnit(unit);
                    }}
                    onMouseEnter={() => unit && setHoverUnit(unit)}
                    disabled={stage !== 'prep' || !unit}
                  >
                    {unit ? (
                      <>
                        <PokeSprite unit={unit} size="sm" />
                        <span className="pa-stars">{stars(unit.star)}</span>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="pa-shopbar">
              <div className="pa-meta">
                <span className="pa-level">NV {level}</span>
                <div className="pa-xp">
                  <i style={{ width: xpNeed ? `${Math.min(100, (xp / xpNeed) * 100)}%` : '100%' }} />
                </div>
                <span className="pa-xp-label">{xpNeed != null ? `${xp}/${xpNeed}` : 'MAX'}</span>
                <div className="pa-meta-btns">
                  <button type="button" className="pa-chip" onClick={buyXp} disabled={stage !== 'prep' || level >= 9}>XP · 4</button>
                  <button type="button" className="pa-chip" onClick={refreshShop} disabled={stage !== 'prep'}>Relancer · 2</button>
                </div>
              </div>

              <div className="pa-shop">
                {shop.map((unit, index) => (
                  unit ? (
                    <button
                      key={unit.uid}
                      type="button"
                      className="pa-shop-card"
                      style={{ '--tint': TYPE_TINT[unit.type] || '#f0c14b' }}
                      onClick={() => buy(index)}
                      onMouseEnter={() => { setHoverUnit(unit); setHoverTrait(null); }}
                      disabled={stage !== 'prep'}
                    >
                      <span className="pa-shop-cost">{unit.cost}</span>
                      <span className="pa-shop-range">P{unit.range || 1}</span>
                      <PokeSprite unit={unit} size="md" />
                      <strong>{unit.name}</strong>
                      <span className="pa-shop-types">
                        {[unit.type, ...(unit.traits || []).filter((t) => t !== unit.type)].slice(0, 2).map((t) => (
                          <em
                            key={t}
                            className="pa-shop-type"
                            style={{ '--tint': TYPE_TINT[t] || '#f0c14b' }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setHoverTrait(t);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              setHoverTrait(null);
                            }}
                          >
                            {t}
                          </em>
                        ))}
                      </span>
                    </button>
                  ) : (
                    <div key={`sold-${index}`} className="pa-shop-card is-empty">—</div>
                  )
                ))}
              </div>

              <button type="button" className="pa-btn pa-btn-fight" onClick={fight} disabled={stage !== 'prep'}>
                Combat
              </button>
            </div>
          </div>
      </>
    </div>
  );
};

export default PokeArena;
