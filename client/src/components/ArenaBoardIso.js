import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BOARD_COLS, BOARD_ROWS_HALF, BOARD_SIZE, ITEM_MAP } from './pokeArenaData';
import './ArenaBoard.css';

/*
 * Stade : tribunes et bannières, court à deux camps (bleu allié / rouge adverse),
 * emblème Poké Ball au centre. Les Pokémon sont des éléments DOM posés sur les cases
 * (déplacements animés, attaques, projectiles typés, impacts, KO).
 */

const COLS = BOARD_COLS;
const ROWS = BOARD_ROWS_HALF * 2;
const SIZE = 50;
const ISO_Y = 0.62;

export const TYPE_COLOR = {
  Normal: '#A8A77A', Feu: '#EE8130', Eau: '#6390F0', Électrik: '#F7D02C', Plante: '#7AC74C',
  Glace: '#96D9D6', Combat: '#C22E28', Poison: '#A33EA1', Sol: '#E2BF65', Vol: '#A98FF3',
  Psy: '#F95587', Insecte: '#A6B91A', Roche: '#B6A136', Spectre: '#735797', Dragon: '#6F35FC',
  Ténèbres: '#705746', Acier: '#B7B7CE', Fée: '#D685AD'
};

const hexPath = (ctx, cx, cy, size) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = cx + size * Math.cos(a);
    const y = cy + size * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const cellPixel = (col, row) => ({
  x: SIZE * Math.sqrt(3) * (col + 0.5 * (row % 2)),
  y: SIZE * 1.5 * row
});

/** Index 0..20 d’un camp → case (col,row) du plateau complet. */
const slotToCell = (index, enemy) => {
  const col = index % COLS;
  const rowLocal = Math.floor(index / COLS);
  return { col, row: enemy ? rowLocal : BOARD_ROWS_HALF + rowLocal };
};

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/* ———————————————— Décor (canvas) ———————————————— */

const drawScenery = (ctx, w, h) => {
  // Ciel clair de fin d’après-midi
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
  sky.addColorStop(0, '#cfd6f2');
  sky.addColorStop(1, '#f3f1f6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Tribunes en gradins
  const standTop = h * 0.04;
  const standBot = h * 0.33;
  const stand = ctx.createLinearGradient(0, standTop, 0, standBot);
  stand.addColorStop(0, '#2b3160');
  stand.addColorStop(1, '#1d2246');
  ctx.fillStyle = stand;
  ctx.beginPath();
  ctx.moveTo(-10, standBot);
  ctx.lineTo(w * 0.06, standTop);
  ctx.lineTo(w * 0.94, standTop);
  ctx.lineTo(w + 10, standBot);
  ctx.closePath();
  ctx.fill();
  // Toit
  ctx.fillStyle = '#151933';
  ctx.fillRect(w * 0.04, standTop - 8, w * 0.92, 10);
  // Rangées + public
  const rnd = seeded(11);
  const crowd = ['#ff7a45', '#ffd23f', '#8fa2ff', '#ffffff', '#ff5f7e', '#9be3b8', '#c49bff'];
  const rows = 7;
  for (let r = 0; r < rows; r += 1) {
    const t = (r + 0.5) / rows;
    const y = standTop + (standBot - standTop) * t;
    const inset = w * 0.06 * (1 - t);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inset, y + 4);
    ctx.lineTo(w - inset, y + 4);
    ctx.stroke();
    const step = 7 + t * 3;
    for (let x = inset + 4; x < w - inset - 4; x += step) {
      if (rnd() < 0.18) continue;
      ctx.fillStyle = crowd[Math.floor(rnd() * crowd.length)];
      ctx.globalAlpha = 0.35 + t * 0.35;
      ctx.beginPath();
      ctx.arc(x + rnd() * 2, y - 1, 1.6 + t * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Mur de tribune : bannières en biais Écarlate / Violet
  const wallY = standBot;
  const wallH = h * 0.06;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, wallY, w, wallH);
  const banners = 9;
  for (let i = 0; i < banners; i += 1) {
    const bx = (i / banners) * w;
    const bw = w / banners;
    ctx.fillStyle = i % 2 ? '#7b3ff2' : '#ff5a1f';
    ctx.beginPath();
    ctx.moveTo(bx + 10, wallY + 5);
    ctx.lineTo(bx + bw - 4, wallY + 5);
    ctx.lineTo(bx + bw - 14, wallY + wallH - 5);
    ctx.lineTo(bx, wallY + wallH - 5);
    ctx.closePath();
    ctx.fill();
    // Poké Ball stylisée sur la bannière
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    const cx = bx + bw / 2 - 2;
    const cy = wallY + wallH / 2;
    const rr = wallH * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.moveTo(cx - rr, cy);
    ctx.lineTo(cx + rr, cy);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(23,26,51,0.18)';
  ctx.fillRect(0, wallY + wallH, w, 4);

  // Sol du stade
  const floorTop = wallY + wallH;
  const floor = ctx.createLinearGradient(0, floorTop, 0, h);
  floor.addColorStop(0, '#d9dcea');
  floor.addColorStop(1, '#eceef6');
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorTop, w, h - floorTop);
  // Dalles en perspective
  ctx.strokeStyle = 'rgba(23,26,51,0.05)';
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * w * 0.05, floorTop);
    ctx.lineTo(w / 2 + i * w * 0.16, h);
    ctx.stroke();
  }
};

/** Court du stade (deux camps teintés, lignes blanches, emblème central), dans l’espace « monde » écrasé. */
const drawField = (ctx, gridW, gridH) => {
  const pad = 38;
  const x0 = -pad;
  const y0 = -pad;
  const w = gridW + pad * 2;
  const h = gridH + pad * 2;
  const r = 18;
  const rounded = (dx = 0, dy = 0, grow = 0) => {
    const X = x0 - grow + dx;
    const Y = y0 - grow + dy;
    const W = w + grow * 2;
    const H = h + grow * 2;
    ctx.beginPath();
    ctx.moveTo(X + r, Y);
    ctx.arcTo(X + W, Y, X + W, Y + H, r);
    ctx.arcTo(X + W, Y + H, X, Y + H, r);
    ctx.arcTo(X, Y + H, X, Y, r);
    ctx.arcTo(X, Y, X + W, Y, r);
    ctx.closePath();
  };
  const midY = gridH / 2 + SIZE * 0.25;

  // Ombre portée + tranche
  rounded(0, 34, 6);
  ctx.fillStyle = 'rgba(23,26,51,0.22)';
  ctx.fill();
  rounded(0, 22, 0);
  ctx.fillStyle = '#1b2148';
  ctx.fill();
  // Liseré extérieur (bord du court)
  rounded(0, 0, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Deux camps
  ctx.save();
  rounded(0, 0, 0);
  ctx.clip();
  const foe = ctx.createLinearGradient(0, y0, 0, midY);
  foe.addColorStop(0, '#c9433a');
  foe.addColorStop(1, '#e0614a');
  ctx.fillStyle = foe;
  ctx.fillRect(x0, y0, w, midY - y0);
  const ally = ctx.createLinearGradient(0, midY, 0, y0 + h);
  ally.addColorStop(0, '#4b6fe0');
  ally.addColorStop(1, '#3352bf');
  ctx.fillStyle = ally;
  ctx.fillRect(x0, midY, w, y0 + h - midY);
  // Bandes de tonte façon terrain synthétique
  for (let i = 0; i < 12; i += 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x0 + (i / 12) * w, y0, w / 12, h);
  }
  ctx.restore();

  // Lignes
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  const inset = 14;
  ctx.strokeRect(x0 + inset, y0 + inset, w - inset * 2, h - inset * 2);
  ctx.beginPath();
  ctx.moveTo(x0 + inset, midY);
  ctx.lineTo(x0 + w - inset, midY);
  ctx.stroke();

  // Emblème central : Poké Ball blanche
  const cx = gridW / 2;
  const R = SIZE * 1.3;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.arc(cx, midY, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, midY, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b2148';
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.2, 0, Math.PI * 2);
  ctx.fill();
};

const drawCell = (ctx, cx, cy, enemy) => {
  const r = SIZE - 3;
  hexPath(ctx, cx, cy, r);
  ctx.fillStyle = enemy ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

/* ———————————————— Sprites ———————————————— */

const Sprite = ({ unit, enemy }) => {
  const chain = [unit.home, unit.art, unit.sprite].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [unit.dex]);
  return (
    <img
      className={`bd-sprite${enemy ? ' is-enemy' : ''}`}
      src={chain[Math.min(idx, chain.length - 1)]}
      alt={unit.name}
      draggable={false}
      onError={() => setIdx((i) => Math.min(i + 1, chain.length - 1))}
    />
  );
};

const ItemPip = ({ id }) => {
  const item = ITEM_MAP[id];
  const [fail, setFail] = useState(false);
  if (!item) return null;
  return item.sprite && !fail
    ? <img src={item.sprite} alt={item.name} title={item.name} onError={() => setFail(true)} draggable={false} />
    : <em title={item.name}>•</em>;
};

const hpColor = (ratio) => (ratio > 0.5 ? '#4cc35a' : ratio > 0.22 ? '#f2c230' : '#e2453a');

/**
 * Props :
 *  board / enemyBoard : 21 cases par camp (unités ou null)
 *  positions          : uid → {col,row} pendant un combat (sinon on lit les cases)
 *  act / actKey       : action en cours (attaque, sort…) pour les animations
 */
export default function ArenaBoardIso({
  board,
  enemyBoard,
  positions = null,
  selectedUid,
  placing,
  dragging = false,
  fxMap = {},
  hpMap = {},
  floatFx = [],
  act = null,
  actKey = 0,
  evolving = [],
  speed = 1,
  stage,
  onCellClick,
  onHoverUnit,
  onUnitPointerDown
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [layout, setLayout] = useState(null);

  const safeBoard = board?.length === BOARD_SIZE ? board : Array(BOARD_SIZE).fill(null);
  const safeEnemy = enemyBoard?.length === BOARD_SIZE ? enemyBoard : Array(BOARD_SIZE).fill(null);

  const cells = useMemo(() => {
    const list = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const { x, y } = cellPixel(col, row);
        const enemy = row < BOARD_ROWS_HALF;
        const index = (enemy ? row : row - BOARD_ROWS_HALF) * COLS + col;
        list.push({ col, row, x, y, enemy, index });
      }
    }
    return list;
  }, []);

  const grid = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    cells.forEach((c) => { maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y); });
    return { w: maxX + SIZE * 2, h: maxY + SIZE * 2 };
  }, [cells]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (!cssW || !cssH) return;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScenery(ctx, cssW, cssH);
      const worldW = grid.w + 70;
      const worldH = (grid.h + 90) * ISO_Y + 60;
      const scale = Math.min((cssW - 16) / worldW, (cssH - 16) / worldH);
      const ox = (cssW - grid.w * scale) / 2;
      const oy = (cssH - grid.h * ISO_Y * scale) / 2 + 14 * scale;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale * ISO_Y);
      drawField(ctx, grid.w, grid.h);
      cells.forEach((cell) => drawCell(ctx, cell.x + SIZE, cell.y + SIZE, cell.enemy));
      ctx.restore();
      setLayout({ scale, ox, oy });
    };
    paint();
    const RO = typeof window !== 'undefined' ? window.ResizeObserver : undefined;
    const ro = RO ? new RO(paint) : null;
    ro?.observe(wrap);
    return () => ro?.disconnect();
  }, [cells, grid]);

  const screenOf = (col, row) => {
    if (!layout) return { x: 0, y: 0 };
    const { x, y } = cellPixel(col, row);
    return { x: layout.ox + (x + SIZE) * layout.scale, y: layout.oy + (y + SIZE) * layout.scale * ISO_Y };
  };

  // Toutes les unités avec leur case actuelle.
  const units = useMemo(() => {
    const list = [];
    safeBoard.forEach((u, i) => { if (u) list.push({ u, enemy: false, cell: positions?.[u.uid] || slotToCell(i, false) }); });
    safeEnemy.forEach((u, i) => { if (u) list.push({ u, enemy: true, cell: positions?.[u.uid] || slotToCell(i, true) }); });
    return list;
  }, [safeBoard, safeEnemy, positions]);

  const spot = useMemo(() => {
    const map = {};
    units.forEach(({ u, cell, enemy }) => { map[u.uid] = { ...screenOf(cell.col, cell.row), enemy, unit: u }; });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, layout]);

  const unitSize = Math.max(48, Math.round(SIZE * 1.65 * (layout?.scale || 1)));
  const cellW = Math.round(SIZE * 1.75 * (layout?.scale || 1));

  // Projectiles et impacts de l’action courante.
  const shots = useMemo(() => {
    if (!act || !act.uid || (act.kind !== 'strike' && act.kind !== 'spell')) return [];
    const from = spot[act.uid];
    if (!from) return [];
    if (act.kind === 'strike' && !act.ranged) return [];
    return (act.targets || []).map((t) => spot[t]).filter(Boolean).map((to, i) => ({
      key: `${actKey}-${i}`,
      x: from.x,
      y: from.y - unitSize * 0.35,
      dx: to.x - from.x,
      dy: to.y - from.y,
      color: TYPE_COLOR[act.type] || '#ffffff',
      kind: act.kind,
      type: act.type
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actKey]);

  const lunge = (uid) => {
    if (!act || act.uid !== uid || act.kind !== 'strike' || act.ranged) return null;
    const from = spot[uid];
    const to = spot[act.targets?.[0]];
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    return { '--lx': `${(dx / len) * unitSize * 0.45}px`, '--ly': `${(dy / len) * unitSize * 0.45}px` };
  };

  const isFight = stage === 'fight';
  const evolvingSet = new Set(evolving);

  return (
    <div
      className={`bd-stage${isFight ? ' is-fight' : ''}${placing ? ' is-placing' : ''}${dragging ? ' is-dragging' : ''}${act?.crit ? ` shake-${actKey % 2}` : ''}`}
      ref={wrapRef}
      style={{ '--bd-unit': `${unitSize}px`, '--bd-cell': `${cellW}px`, '--bd-speed': speed }}
    >
      <canvas ref={canvasRef} className="bd-canvas" />

      {/* Cases du joueur (clic / dépôt) */}
      {layout && !isFight && cells.filter((c) => !c.enemy).map((cell) => {
        const p = screenOf(cell.col, cell.row);
        const unit = safeBoard[cell.index];
        return (
          <button
            key={`cell-${cell.index}`}
            type="button"
            className={`bd-cell${unit ? ' has-unit' : ''}${unit && unit.uid === selectedUid ? ' is-selected' : ''}`}
            style={{ left: p.x, top: p.y }}
            data-drop="cell"
            data-index={cell.index}
            aria-label={unit ? `${unit.name}, case ${cell.index + 1}` : `Case vide ${cell.index + 1}`}
            onClick={() => onCellClick?.(cell.index)}
          />
        );
      })}

      {layout && units.map(({ u, enemy, cell }) => {
        const p = screenOf(cell.col, cell.row);
        const fx = fxMap[u.uid];
        const hp = hpMap[u.uid];
        const ratio = hp ? Math.max(0, Math.min(1, hp.cur / Math.max(1, hp.max))) : 1;
        const down = hp && !hp.alive;
        const floats = floatFx.filter((f) => f.uid === u.uid);
        const isActor = act?.uid === u.uid;
        const color = TYPE_COLOR[u.type] || '#ffffff';
        return (
          <div
            key={u.uid}
            className={[
              'bd-unit',
              enemy ? 'is-enemy' : 'is-ally',
              fx ? `fx-${fx}` : '',
              isActor ? `act-${act.kind}` : '',
              down ? 'is-down' : '',
              !enemy && u.uid === selectedUid ? 'is-selected' : '',
              u.star >= 3 ? 'is-gold' : '',
              evolvingSet.has(u.uid) ? 'is-evolving' : ''
            ].filter(Boolean).join(' ')}
            style={{ left: p.x, top: p.y, zIndex: 20 + cell.row * 2, '--type': color, ...(lunge(u.uid) || {}) }}
            data-uid={u.uid}
            data-drop={enemy ? undefined : 'unit'}
            data-index={enemy ? undefined : safeBoard.findIndex((x) => x?.uid === u.uid)}
            onMouseEnter={() => onHoverUnit?.(u)}
            onMouseLeave={() => onHoverUnit?.(null)}
            onPointerDown={(e) => { if (!enemy && !isFight) onUnitPointerDown?.(e, u); }}
            role="presentation"
          >
            <span className="bd-ring" aria-hidden />
            <span className="bd-shadow" aria-hidden />
            <div key={isActor ? `a-${actKey}` : 'idle'} className="bd-body">
              <div className="bd-bob">
                <Sprite unit={u} enemy={enemy} />
              </div>
            </div>
            <div className="bd-plate">
              <span className="bd-stars">{'★'.repeat(u.star)}</span>
              <span className="bd-hp">
                <i style={{ width: `${ratio * 100}%` }} />
                <b style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} />
              </span>
              {(u.items || []).length > 0 && (
                <span className="bd-items">
                  {(u.items || []).map((id, i) => <ItemPip key={`${id}-${i}`} id={id} />)}
                </span>
              )}
            </div>
            {isActor && act.kind === 'spell' && (
              <span key={`cast-${actKey}`} className="bd-cast" aria-hidden>
                <em>{act.name}</em>
              </span>
            )}
            {(fx === 'hit' || fx === 'ko') && (
              <span key={`imp-${actKey}`} className={`bd-impact type-${act?.type || 'Normal'}`} style={{ '--fxc': TYPE_COLOR[act?.type] || '#fff' }} aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
              </span>
            )}
            {fx === 'heal' && <span key={`heal-${actKey}`} className="bd-heal" aria-hidden><i /><i /><i /></span>}
            {fx === 'buff' && <span key={`buff-${actKey}`} className="bd-buff" aria-hidden />}
            {fx === 'ko' && <span key={`ko-${actKey}`} className="bd-ko" aria-hidden />}
            {evolvingSet.has(u.uid) && <span className="bd-evolve" aria-hidden>{Array.from({ length: 10 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</span>}
            {floats.map((f) => (
              <span key={f.key} className={`bd-float is-${f.kind || 'dmg'}`}>{f.text}</span>
            ))}
          </div>
        );
      })}

      {shots.map((s) => (
        <span
          key={s.key}
          className={`bd-shot is-${s.kind} type-${s.type}`}
          style={{
            left: s.x,
            top: s.y,
            '--dx': `${s.dx}px`,
            '--dy': `${s.dy}px`,
            '--shot': s.color,
            '--angle': `${Math.atan2(s.dy, s.dx)}rad`
          }}
          aria-hidden
        >
          <i />
        </span>
      ))}
    </div>
  );
}
