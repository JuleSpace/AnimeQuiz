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

/** Ambiances du stade (couleurs du décor et du court). */
export const BOARD_THEMES = {
  gazon: {
    sky: ['#cfe3f2', '#eef4f7'],
    stand: ['#3a4a5e', '#2c394b'],
    roof: '#243042',
    crowd: ['#f2f2f2', '#e8c26a', '#d9785f', '#8db3d9', '#b9d7a8'],
    crowdAlpha: 0.28,
    wall: '#f7f5ef',
    banners: ['#d9483b', '#f7f5ef'],
    bannerMark: 'rgba(40,40,40,0.25)',
    floor: ['#cfd3c6', '#e3e5dc'],
    edge: '#5a6b4f',
    rim: '#f7f5ef',
    foe: ['#4f9a55', '#5aa760'],
    ally: ['#5aa760', '#4f9a55'],
    stripe: 'rgba(255,255,255,0.06)',
    line: 'rgba(255,255,255,0.85)',
    emblem: 'rgba(255,255,255,0.12)',
    emblemCore: '#d9483b',
    foeTint: 'rgba(217,72,59,0.10)',
    allyTint: 'rgba(60,110,200,0.08)',
    cellLine: 'rgba(255,255,255,0.28)'
  },
  sable: {
    sky: ['#e6dccb', '#f6f1e8'],
    stand: ['#8a7a66', '#6f6252'],
    roof: '#5c5144',
    crowd: ['#f6f1e8', '#d9a066', '#7aa6a0', '#c98f7a', '#e8d5a8'],
    crowdAlpha: 0.3,
    wall: '#fbf8f2',
    banners: ['#2f8f88', '#e07a4f'],
    bannerMark: 'rgba(255,255,255,0.45)',
    floor: ['#ddd3c3', '#ece5d8'],
    edge: '#9c8466',
    rim: '#fbf8f2',
    foe: ['#e8c9a0', '#e2c196'],
    ally: ['#e2c196', '#dcb98c'],
    stripe: 'rgba(255,255,255,0.08)',
    line: 'rgba(255,255,255,0.9)',
    emblem: 'rgba(255,255,255,0.18)',
    emblemCore: '#2f8f88',
    foeTint: 'rgba(224,122,79,0.10)',
    allyTint: 'rgba(47,143,136,0.10)',
    cellLine: 'rgba(120,90,60,0.22)'
  },
  nuit: {
    sky: ['#1e2338', '#2b3150'],
    stand: ['#171b2e', '#11142a'],
    roof: '#0c0f20',
    crowd: ['#ffd27a', '#ff9f80', '#9fb6ff', '#ffffff'],
    crowdAlpha: 0.4,
    wall: '#262c48',
    banners: ['#e2715a', '#5f73d9'],
    bannerMark: 'rgba(255,255,255,0.35)',
    floor: ['#2a3050', '#333a5c'],
    edge: '#10132a',
    rim: '#3b4370',
    foe: ['#3a4170', '#353c68'],
    ally: ['#353c68', '#30375f'],
    stripe: 'rgba(255,255,255,0.03)',
    line: 'rgba(255,255,255,0.55)',
    emblem: 'rgba(255,255,255,0.06)',
    emblemCore: '#e2715a',
    foeTint: 'rgba(226,113,90,0.12)',
    allyTint: 'rgba(95,115,217,0.12)',
    cellLine: 'rgba(255,255,255,0.16)'
  }
};
export const DEFAULT_BOARD_THEME = 'gazon';
export const BOARD_THEME_LABELS = { gazon: 'Gazon', sable: 'Sable', nuit: 'Nocturne' };
const themeOf = (key) => BOARD_THEMES[key] || BOARD_THEMES[DEFAULT_BOARD_THEME];

const vGrad = (ctx, y0, y1, [c0, c1]) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
};

const drawScenery = (ctx, w, h, T) => {
  ctx.fillStyle = vGrad(ctx, 0, h * 0.42, T.sky);
  ctx.fillRect(0, 0, w, h);

  // Tribunes
  const standTop = h * 0.05;
  const standBot = h * 0.32;
  ctx.fillStyle = vGrad(ctx, standTop, standBot, T.stand);
  ctx.beginPath();
  ctx.moveTo(-10, standBot);
  ctx.lineTo(w * 0.06, standTop);
  ctx.lineTo(w * 0.94, standTop);
  ctx.lineTo(w + 10, standBot);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = T.roof;
  ctx.fillRect(w * 0.04, standTop - 6, w * 0.92, 8);
  const rnd = seeded(11);
  const rows = 6;
  for (let r = 0; r < rows; r += 1) {
    const t = (r + 0.5) / rows;
    const y = standTop + (standBot - standTop) * t;
    const inset = w * 0.06 * (1 - t);
    const step = 8 + t * 4;
    for (let x = inset + 4; x < w - inset - 4; x += step) {
      if (rnd() < 0.25) continue;
      ctx.fillStyle = T.crowd[Math.floor(rnd() * T.crowd.length)];
      ctx.globalAlpha = T.crowdAlpha * (0.6 + t * 0.6);
      ctx.beginPath();
      ctx.arc(x + rnd() * 2, y, 1.5 + t * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Mur de tribune, bannières sobres
  const wallY = standBot;
  const wallH = h * 0.05;
  ctx.fillStyle = T.wall;
  ctx.fillRect(0, wallY, w, wallH);
  const banners = 6;
  for (let i = 0; i < banners; i += 1) {
    const bw = w / banners;
    const bx = i * bw + bw * 0.18;
    const bwi = bw * 0.64;
    ctx.fillStyle = T.banners[i % T.banners.length];
    ctx.beginPath();
    ctx.moveTo(bx + 8, wallY + 6);
    ctx.lineTo(bx + bwi, wallY + 6);
    ctx.lineTo(bx + bwi - 8, wallY + wallH - 6);
    ctx.lineTo(bx, wallY + wallH - 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = T.bannerMark;
    ctx.lineWidth = 1.5;
    const cx = bx + bwi / 2;
    const cy = wallY + wallH / 2;
    const rr = wallH * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.moveTo(cx - rr, cy);
    ctx.lineTo(cx + rr, cy);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, wallY + wallH, w, 3);

  const floorTop = wallY + wallH;
  ctx.fillStyle = vGrad(ctx, floorTop, h, T.floor);
  ctx.fillRect(0, floorTop, w, h - floorTop);
};

/** Court du stade dans l’espace « monde » écrasé. */
const drawField = (ctx, gridW, gridH, T) => {
  const pad = 38;
  const x0 = -pad;
  const y0 = -pad;
  const w = gridW + pad * 2;
  const h = gridH + pad * 2;
  const r = 18;
  const rounded = (dy = 0, grow = 0) => {
    const X = x0 - grow;
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

  rounded(30, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fill();
  rounded(20, 0);
  ctx.fillStyle = T.edge;
  ctx.fill();
  rounded(0, 8);
  ctx.fillStyle = T.rim;
  ctx.fill();

  ctx.save();
  rounded(0, 0);
  ctx.clip();
  ctx.fillStyle = vGrad(ctx, y0, midY, T.foe);
  ctx.fillRect(x0, y0, w, midY - y0);
  ctx.fillStyle = vGrad(ctx, midY, y0 + h, T.ally);
  ctx.fillRect(x0, midY, w, y0 + h - midY);
  ctx.fillStyle = T.foeTint;
  ctx.fillRect(x0, y0, w, midY - y0);
  ctx.fillStyle = T.allyTint;
  ctx.fillRect(x0, midY, w, y0 + h - midY);
  for (let i = 0; i < 12; i += 2) {
    ctx.fillStyle = T.stripe;
    ctx.fillRect(x0 + (i / 12) * w, y0, w / 12, h);
  }
  ctx.restore();

  ctx.strokeStyle = T.line;
  ctx.lineWidth = 3.5;
  const inset = 14;
  ctx.strokeRect(x0 + inset, y0 + inset, w - inset * 2, h - inset * 2);
  ctx.beginPath();
  ctx.moveTo(x0 + inset, midY);
  ctx.lineTo(x0 + w - inset, midY);
  ctx.stroke();

  const cx = gridW / 2;
  const R = SIZE * 1.25;
  ctx.fillStyle = T.emblem;
  ctx.beginPath();
  ctx.arc(cx, midY, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = T.line;
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = T.emblemCore;
  ctx.beginPath();
  ctx.arc(cx, midY, SIZE * 0.16, 0, Math.PI * 2);
  ctx.fill();
};

const drawCell = (ctx, cx, cy, T) => {
  hexPath(ctx, cx, cy, SIZE - 3);
  ctx.strokeStyle = T.cellLine;
  ctx.lineWidth = 1.6;
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
  theme = DEFAULT_BOARD_THEME,
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
      const T = themeOf(theme);
      drawScenery(ctx, cssW, cssH, T);
      const worldW = grid.w + 70;
      const worldH = (grid.h + 90) * ISO_Y + 60;
      const scale = Math.min((cssW - 16) / worldW, (cssH - 16) / worldH);
      const ox = (cssW - grid.w * scale) / 2;
      const oy = (cssH - grid.h * ISO_Y * scale) / 2 + 14 * scale;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale * ISO_Y);
      drawField(ctx, grid.w, grid.h, T);
      cells.forEach((cell) => drawCell(ctx, cell.x + SIZE, cell.y + SIZE, T));
      ctx.restore();
      setLayout({ scale, ox, oy });
    };
    paint();
    const RO = typeof window !== 'undefined' ? window.ResizeObserver : undefined;
    const ro = RO ? new RO(paint) : null;
    ro?.observe(wrap);
    return () => ro?.disconnect();
  }, [cells, grid, theme]);

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
