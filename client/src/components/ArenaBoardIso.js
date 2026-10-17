import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BOARD_COLS, BOARD_ROWS_HALF, BOARD_SIZE, ITEM_MAP } from './pokeArenaData';
import './ArenaBoard.css';

/*
 * Terrain de combat façon anime : pelouse, terrain en terre battue tracé à la craie,
 * Poké Ball au centre. Les Pokémon sont des éléments DOM posés sur les cases
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
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#7cc8f2');
  sky.addColorStop(1, '#cfeefc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rnd = seeded(11);
  // Collines lointaines
  const hill = (base, amp, color, seed) => {
    const r = seeded(seed);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, base);
    for (let x = 0; x <= w; x += w / 6) {
      ctx.quadraticCurveTo(x + w / 12, base - amp * (0.5 + r()), x + w / 6, base);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  hill(h * 0.3, h * 0.08, '#a9d98c', 3);
  hill(h * 0.36, h * 0.07, '#86c46b', 5);

  // Arbres (rangée du fond)
  for (let i = 0; i < 26; i += 1) {
    const x = (i / 25) * w + (rnd() - 0.5) * 30;
    const y = h * 0.37 + rnd() * h * 0.03;
    const r = 16 + rnd() * 18;
    ctx.fillStyle = '#4f9a45';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pelouse tondue en bandes
  const lawnTop = h * 0.4;
  ctx.fillStyle = '#6dbb4f';
  ctx.fillRect(0, lawnTop, w, h - lawnTop);
  const bands = 9;
  for (let i = 0; i < bands; i += 1) {
    if (i % 2) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    const x0 = (i / bands) * w;
    const x1 = ((i + 1) / bands) * w;
    ctx.moveTo(w / 2 + (x0 - w / 2) * 0.45, lawnTop);
    ctx.lineTo(w / 2 + (x1 - w / 2) * 0.45, lawnTop);
    ctx.lineTo(w / 2 + (x1 - w / 2) * 1.6, h);
    ctx.lineTo(w / 2 + (x0 - w / 2) * 1.6, h);
    ctx.closePath();
    ctx.fill();
  }
  // Touffes d’herbe
  for (let i = 0; i < 90; i += 1) {
    const x = rnd() * w;
    const y = lawnTop + 10 + rnd() * (h - lawnTop);
    ctx.strokeStyle = 'rgba(40,110,40,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 6);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - 7);
    ctx.stroke();
  }
};

/** Terrain en terre battue + lignes à la craie, dans l’espace « monde » écrasé (iso). */
const drawField = (ctx, gridW, gridH) => {
  const pad = 38;
  const x0 = -pad;
  const y0 = -pad;
  const w = gridW + pad * 2;
  const h = gridH + pad * 2;
  const r = 40;
  const rounded = (dx = 0, dy = 0) => {
    ctx.beginPath();
    ctx.moveTo(x0 + r + dx, y0 + dy);
    ctx.arcTo(x0 + w + dx, y0 + dy, x0 + w + dx, y0 + h + dy, r);
    ctx.arcTo(x0 + w + dx, y0 + h + dy, x0 + dx, y0 + h + dy, r);
    ctx.arcTo(x0 + dx, y0 + h + dy, x0 + dx, y0 + dy, r);
    ctx.arcTo(x0 + dx, y0 + dy, x0 + w + dx, y0 + dy, r);
    ctx.closePath();
  };
  // bordure / épaisseur
  rounded(0, 26);
  ctx.fillStyle = '#9a6b3f';
  ctx.fill();
  rounded(0, 0);
  const clay = ctx.createLinearGradient(0, y0, 0, y0 + h);
  clay.addColorStop(0, '#e2b27a');
  clay.addColorStop(0.5, '#d9a56c');
  clay.addColorStop(1, '#cf9860');
  ctx.fillStyle = clay;
  ctx.fill();

  // grain de la terre
  const rnd = seeded(29);
  ctx.save();
  rounded(0, 0);
  ctx.clip();
  for (let i = 0; i < 520; i += 1) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,70,30,0.10)' : 'rgba(255,240,210,0.12)';
    ctx.beginPath();
    ctx.arc(x0 + rnd() * w, y0 + rnd() * h, 1 + rnd() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Craie
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 5;
  const inset = 16;
  ctx.strokeRect(x0 + inset, y0 + inset, w - inset * 2, h - inset * 2);
  const midY = gridH / 2 + SIZE * 0.25;
  ctx.beginPath();
  ctx.moveTo(x0 + inset, midY);
  ctx.lineTo(x0 + w - inset, midY);
  ctx.stroke();
  // Poké Ball centrale
  const cx = gridW / 2;
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 1.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(227,53,13,0.16)';
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 1.25, Math.PI, Math.PI * 2);
  ctx.fill();
};

const drawCell = (ctx, cx, cy, enemy) => {
  const r = SIZE - 4;
  hexPath(ctx, cx, cy, r);
  ctx.fillStyle = enemy ? 'rgba(227,53,13,0.07)' : 'rgba(59,91,167,0.08)';
  ctx.fill();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.setLineDash([]);
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
      <div className="bd-clouds" aria-hidden>
        <i /><i /><i />
      </div>

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
