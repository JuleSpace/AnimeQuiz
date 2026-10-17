import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_COLS, BOARD_ROWS_HALF, BOARD_SIZE, ITEM_MAP } from './pokeArenaData';
import './ArenaBoard.css';

/*
 * Plateau « Holo Stadium » : arène flottante de nuit, dalles hexagonales en relief,
 * camp allié cyan / camp adverse magenta, projectiles et impacts pendant les combats.
 */

const COLS = BOARD_COLS;
const ROWS = BOARD_ROWS_HALF * 2; // 6
const SIZE = 50;
const ISO_Y = 0.56;
const DEPTH = 11; // épaisseur des dalles (px monde)

const TYPE_GLOW = {
  Feu: '#ff7a3d', Eau: '#3da5ff', Plante: '#46e07d', Électrik: '#ffe14a',
  Normal: '#e6e3d8', Combat: '#ff8455', Psy: '#ff6bd6', Spectre: '#a07bff',
  Dragon: '#7a8cff', Fée: '#ff9ad5', Acier: '#b8c8dc', Glace: '#9ee7ff',
  Roche: '#d4b07a', Ténèbres: '#9a7fd0', Vol: '#a8d4ff', Poison: '#c26bff',
  Sol: '#e0b072', Insecte: '#b4d84a'
};

const TEAM = {
  ally: { top: '#163b55', mid: '#0f2a40', low: '#08182a', side: '#06101d', rim: '#45e9ff', glow: 'rgba(69,233,255,0.75)' },
  foe: { top: '#4a1838', mid: '#33102a', low: '#1d0819', side: '#12040f', rim: '#ff4f8b', glow: 'rgba(255,79,139,0.75)' }
};

const hexCorner = (cx, cy, size, i) => {
  const angle = (Math.PI / 180) * (60 * i - 30);
  return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
};

const hexPath = (ctx, cx, cy, size) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const [x, y] = hexCorner(cx, cy, size, i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const axialToPixel = (col, row, size) => ({
  x: size * Math.sqrt(3) * (col + 0.5 * (row % 2)),
  y: size * 1.5 * row
});

/** Index 0..20 dans le camp (ennemi = rangées 0-2, allié = 3-5). */
const cellToIndex = (col, row) => {
  if (row < BOARD_ROWS_HALF) return row * COLS + col;
  return (row - BOARD_ROWS_HALF) * COLS + col;
};

/** Petit générateur pseudo-aléatoire stable (décor identique à chaque rendu). */
const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const hashUid = (uid = '') => {
  let h = 0;
  for (let i = 0; i < uid.length; i += 1) h = (h * 31 + uid.charCodeAt(i)) % 997;
  return h;
};

/* ———————————————————————— Décor ———————————————————————— */

const drawSky = (ctx, w, h) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05061a');
  sky.addColorStop(0.45, '#0d0f33');
  sky.addColorStop(0.8, '#1a0f33');
  sky.addColorStop(1, '#090614');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rnd = seeded(7);
  for (let i = 0; i < 140; i += 1) {
    const x = rnd() * w;
    const y = rnd() * h * 0.55;
    const r = rnd() * 1.3 + 0.2;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aurores
  [[0.22, '#3cf0ff', 0.16], [0.62, '#b25cff', 0.14], [0.85, '#ff4f8b', 0.08]].forEach(([fx, color, alpha]) => {
    const g = ctx.createRadialGradient(w * fx, h * 0.18, 0, w * fx, h * 0.18, w * 0.38);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.6);
  });
  ctx.globalAlpha = 1;

  // Tribunes : silhouette + lumières de la foule
  const standTop = h * 0.36;
  ctx.fillStyle = '#070816';
  ctx.beginPath();
  ctx.moveTo(0, standTop + 40);
  ctx.quadraticCurveTo(w * 0.5, standTop - 30, w, standTop + 40);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 260; i += 1) {
    const x = rnd() * w;
    const t = x / w;
    const curve = standTop + 40 - Math.sin(t * Math.PI) * 70;
    const y = curve + rnd() * 70 + 8;
    const hue = rnd();
    ctx.fillStyle = hue < 0.5 ? 'rgba(69,233,255,0.55)' : hue < 0.8 ? 'rgba(255,204,77,0.5)' : 'rgba(255,79,139,0.5)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // Projecteurs
  [[0.08, -0.35], [0.92, 0.35]].forEach(([fx, tilt]) => {
    const x = w * fx;
    const beam = ctx.createLinearGradient(x, 0, w * 0.5, h * 0.7);
    beam.addColorStop(0, 'rgba(200,230,255,0.22)');
    beam.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 6, 0);
    ctx.lineTo(x + 6, 0);
    ctx.lineTo(w * (0.5 + tilt * 0.35) + 140, h * 0.85);
    ctx.lineTo(w * (0.5 + tilt * 0.35) - 140, h * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2f6ff';
    ctx.shadowColor = '#bfe4ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
};

/** Socle de l’arène (dans l’espace monde, avant écrasement iso). */
const drawPlatform = (ctx, gridW, gridH) => {
  const padX = 46;
  const padY = 50;
  const x0 = -padX;
  const y0 = -padY;
  const w = gridW + padX * 2;
  const h = gridH + padY * 2;
  const cut = 70;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(x0 + cut, y0);
    ctx.lineTo(x0 + w - cut, y0);
    ctx.lineTo(x0 + w, y0 + cut);
    ctx.lineTo(x0 + w, y0 + h - cut);
    ctx.lineTo(x0 + w - cut, y0 + h);
    ctx.lineTo(x0 + cut, y0 + h);
    ctx.lineTo(x0, y0 + h - cut);
    ctx.lineTo(x0, y0 + cut);
    ctx.closePath();
  };

  // Ombre portée + épaisseur
  ctx.save();
  ctx.translate(0, 70);
  outline();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 50;
  ctx.fill();
  ctx.restore();
  for (let d = 46; d > 0; d -= 2) {
    ctx.save();
    ctx.translate(0, d);
    outline();
    ctx.fillStyle = d > 40 ? '#05050f' : `rgb(${14 + d * 0.3},${14 + d * 0.2},${34 + d * 0.4})`;
    ctx.fill();
    ctx.restore();
  }

  // Dessus
  outline();
  const top = ctx.createLinearGradient(0, y0, 0, y0 + h);
  top.addColorStop(0, '#2a1230');
  top.addColorStop(0.5, '#141433');
  top.addColorStop(1, '#0c2236');
  ctx.fillStyle = top;
  ctx.fill();

  // Liserés lumineux (rouge en haut, cyan en bas)
  ctx.save();
  outline();
  ctx.clip();
  ctx.lineWidth = 5;
  const rim = ctx.createLinearGradient(0, y0, 0, y0 + h);
  rim.addColorStop(0, TEAM.foe.rim);
  rim.addColorStop(0.5, '#b25cff');
  rim.addColorStop(1, TEAM.ally.rim);
  ctx.strokeStyle = rim;
  ctx.shadowColor = '#b25cff';
  ctx.shadowBlur = 24;
  outline();
  ctx.stroke();
  ctx.restore();

  // Rainure d’énergie au milieu
  const midY = gridH / 2 + 6;
  const river = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  river.addColorStop(0, 'rgba(178,92,255,0)');
  river.addColorStop(0.5, 'rgba(178,92,255,0.9)');
  river.addColorStop(1, 'rgba(178,92,255,0)');
  ctx.fillStyle = river;
  ctx.shadowColor = '#b25cff';
  ctx.shadowBlur = 30;
  ctx.fillRect(x0 + 20, midY - 3, w - 40, 6);
  ctx.shadowBlur = 0;
};

const drawTile = (ctx, cx, cy, side, state) => {
  const t = TEAM[side];
  const r = SIZE - 2.5;

  // Faces latérales (relief)
  for (let d = DEPTH; d > 0; d -= 1.5) {
    hexPath(ctx, cx, cy + d, r);
    ctx.fillStyle = t.side;
    ctx.fill();
  }

  // Dessus vitré
  hexPath(ctx, cx, cy, r);
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, t.top);
  g.addColorStop(0.55, t.mid);
  g.addColorStop(1, t.low);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  hexPath(ctx, cx, cy, r);
  ctx.clip();
  const shine = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.2, cy);
  shine.addColorStop(0, 'rgba(255,255,255,0.16)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Hexagone intérieur gravé
  hexPath(ctx, cx, cy, r * 0.62);
  ctx.strokeStyle = side === 'ally' ? 'rgba(69,233,255,0.14)' : 'rgba(255,79,139,0.14)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  hexPath(ctx, cx, cy, r);
  ctx.strokeStyle = side === 'ally' ? 'rgba(69,233,255,0.28)' : 'rgba(255,79,139,0.26)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  if (state === 'occupied' || state === 'selected' || state === 'target') {
    const color = state === 'selected' ? '#ffcc4d' : state === 'target' ? 'rgba(255,204,77,0.75)' : t.rim;
    ctx.save();
    hexPath(ctx, cx, cy, r - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = state === 'target' ? 2.4 : 4;
    ctx.shadowColor = state === 'occupied' ? t.glow : 'rgba(255,204,77,0.8)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();
    if (state !== 'target') {
      ctx.save();
      hexPath(ctx, cx, cy, r);
      ctx.clip();
      const pool = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      pool.addColorStop(0, state === 'selected' ? 'rgba(255,204,77,0.35)' : t.glow.replace('0.75', '0.28'));
      pool.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }
  }
};

/* ———————————————————————— Sprites ———————————————————————— */

const PixelPoke = ({ unit, enemy }) => {
  const chain = [unit.model, unit.home, unit.art, unit.anim, unit.pixel, unit.sprite].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [unit.dex]);
  const src = chain[Math.min(idx, chain.length - 1)];
  return (
    <img
      className={`hx-sprite${enemy ? ' is-enemy' : ''}`}
      src={src}
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
    ? <img src={item.sprite} alt={item.name} title={item.name} onError={() => setFail(true)} />
    : <em title={item.name}>{item.icon}</em>;
};

export default function ArenaBoardIso({
  board,
  enemyBoard,
  selectedUid,
  placing,
  fxMap = {},
  hpMap = {},
  floatFx = [],
  stage,
  onCellClick,
  onHoverUnit
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const fxTick = useRef(0);

  const safeBoard = board?.length === BOARD_SIZE ? board : Array(BOARD_SIZE).fill(null);
  const safeEnemy = enemyBoard?.length === BOARD_SIZE ? enemyBoard : Array(BOARD_SIZE).fill(null);

  const cells = useMemo(() => {
    const list = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const { x, y } = axialToPixel(col, row, SIZE);
        const enemy = row < BOARD_ROWS_HALF;
        const index = cellToIndex(col, row);
        list.push({
          col, row, x, y, enemy, index,
          allyIndex: enemy ? null : index,
          enemyIndex: enemy ? index : null
        });
      }
    }
    return list;
  }, []);

  const metrics = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    cells.forEach((c) => {
      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    });
    return { gridW: maxX + SIZE * 2, gridH: maxY + SIZE * 2 };
  }, [cells]);

  useEffect(() => {
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

      drawSky(ctx, cssW, cssH);

      const worldW = metrics.gridW + 100;
      const worldH = (metrics.gridH + 110) * ISO_Y + 50;
      const scale = Math.min((cssW - 24) / worldW, (cssH - 24) / worldH);
      const ox = (cssW - metrics.gridW * scale) / 2;
      const oy = (cssH - metrics.gridH * ISO_Y * scale) / 2 + 4;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale * ISO_Y);
      drawPlatform(ctx, metrics.gridW, metrics.gridH);

      cells.forEach((cell) => {
        const cx = cell.x + SIZE;
        const cy = cell.y + SIZE;
        const unit = cell.enemy ? safeEnemy[cell.index] : safeBoard[cell.index];
        let state = 'idle';
        if (unit) state = !cell.enemy && unit.uid === selectedUid ? 'selected' : 'occupied';
        else if (!cell.enemy && placing) state = 'target';
        drawTile(ctx, cx, cy, cell.enemy ? 'foe' : 'ally', state);
      });
      ctx.restore();

      setLayout({
        scale,
        overlays: cells.map((cell) => ({
          ...cell,
          screenX: ox + (cell.x + SIZE) * scale,
          screenY: oy + (cell.y + SIZE) * scale * ISO_Y
        }))
      });
    };

    paint();
    const RO = typeof window !== 'undefined' ? window.ResizeObserver : undefined;
    const ro = RO ? new RO(paint) : null;
    ro?.observe(wrap);
    return () => ro?.disconnect();
  }, [cells, metrics, safeBoard, safeEnemy, selectedUid, placing]);

  const hitTest = (clientX, clientY) => {
    if (!layout || stage !== 'prep') return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestDist = SIZE * (layout.scale || 1) * 0.9;
    layout.overlays.forEach((cell) => {
      if (cell.allyIndex == null) return;
      const dx = x - cell.screenX;
      const dy = (y - cell.screenY) / ISO_Y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        best = cell;
      }
    });
    if (best) onCellClick?.(best.allyIndex);
  };

  // Position écran de chaque unité (pour les projectiles).
  const unitSpots = useMemo(() => {
    const spots = {};
    layout?.overlays.forEach((cell) => {
      const unit = cell.enemy ? safeEnemy[cell.index] : safeBoard[cell.index];
      if (unit) spots[unit.uid] = { x: cell.screenX, y: cell.screenY, unit, enemy: cell.enemy };
    });
    return spots;
  }, [layout, safeBoard, safeEnemy]);

  // Projectiles : de l’attaquant (strike / spell) vers chaque cible touchée.
  const shots = useMemo(() => {
    fxTick.current += 1;
    const entries = Object.entries(fxMap || {});
    const attacker = entries.find(([, v]) => v === 'spell' || v === 'strike');
    if (!attacker) return [];
    const from = unitSpots[attacker[0]];
    if (!from) return [];
    return entries
      .filter(([uid, v]) => uid !== attacker[0] && (v === 'hit' || v === 'ko'))
      .map(([uid]) => unitSpots[uid])
      .filter(Boolean)
      .map((to, i) => ({
        key: `${fxTick.current}-${i}`,
        kind: attacker[1],
        x: from.x,
        y: from.y,
        dx: to.x - from.x,
        dy: to.y - from.y,
        color: TYPE_GLOW[from.unit.type] || '#ffffff'
      }));
  }, [fxMap, unitSpots]);

  const unitSize = Math.max(48, Math.round(SIZE * 1.5 * (layout?.scale || 1)));

  return (
    <div
      className={`hx-stage${stage === 'fight' ? ' is-fight' : ''}${placing ? ' is-placing' : ''}`}
      ref={wrapRef}
      style={{ '--hx-unit': `${unitSize}px` }}
    >
      <canvas
        ref={canvasRef}
        className="hx-canvas"
        onClick={(e) => hitTest(e.clientX, e.clientY)}
      />
      <div className="hx-aurora" aria-hidden />
      <div className="hx-motes" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>

      {layout?.overlays.map((cell) => {
        const unit = cell.enemy ? safeEnemy[cell.index] : safeBoard[cell.index];
        if (!unit) return null;
        const fx = fxMap[unit.uid];
        const hpInfo = hpMap[unit.uid];
        const ratio = hpInfo
          ? Math.max(0, Math.min(1, hpInfo.cur / Math.max(1, hpInfo.max)))
          : 1;
        const floats = floatFx.filter((f) => f.uid === unit.uid);
        const glow = TYPE_GLOW[unit.type] || '#ffffff';
        return (
          <div
            key={unit.uid}
            className={[
              'hx-unit',
              cell.enemy ? 'is-enemy' : 'is-ally',
              fx ? `fx-${fx}` : '',
              hpInfo && !hpInfo.alive ? 'is-down' : '',
              !cell.enemy && unit.uid === selectedUid ? 'is-selected' : '',
              unit.star >= 3 ? 'is-gold' : ''
            ].filter(Boolean).join(' ')}
            style={{
              left: cell.screenX,
              top: cell.screenY,
              zIndex: 10 + cell.row,
              '--glow': glow,
              '--bob': `${(hashUid(unit.uid) % 9) * 0.17}s`
            }}
            onMouseEnter={() => onHoverUnit?.(unit)}
            onMouseLeave={() => onHoverUnit?.(null)}
            onClick={() => {
              if (!cell.enemy && stage === 'prep') onCellClick?.(cell.allyIndex);
            }}
            role="presentation"
          >
            <span className="hx-ring" aria-hidden />
            <span className="hx-shadow" aria-hidden />
            <div className="hx-body">
              <PixelPoke unit={unit} enemy={cell.enemy} />
            </div>
            <div className="hx-plate">
              <span className="hx-stars">{'★'.repeat(unit.star)}</span>
              <span className={`hx-hp${ratio < 0.3 ? ' is-low' : ''}`}>
                <i style={{ width: `${ratio * 100}%` }} />
                <b style={{ width: `${ratio * 100}%` }} />
              </span>
              {(unit.items || []).length > 0 && (
                <span className="hx-items">
                  {(unit.items || []).map((id, i) => <ItemPip key={`${id}-${i}`} id={id} />)}
                </span>
              )}
            </div>
            {fx === 'spell' && <span className="hx-cast" aria-hidden />}
            {(fx === 'hit' || fx === 'ko') && <span className="hx-impact" aria-hidden />}
            {floats.map((f) => (
              <span key={f.key} className={`hx-float is-${f.kind || 'dmg'}${String(f.text).endsWith('!') ? ' is-crit' : ''}`}>
                {f.text}
              </span>
            ))}
          </div>
        );
      })}

      {shots.map((shot) => (
        <span
          key={shot.key}
          className={`hx-shot is-${shot.kind}`}
          style={{
            left: shot.x,
            top: shot.y,
            '--dx': `${shot.dx}px`,
            '--dy': `${shot.dy}px`,
            '--shot': shot.color,
            '--angle': `${Math.atan2(shot.dy, shot.dx)}rad`
          }}
          aria-hidden
        />
      ))}

      {stage === 'fight' && <div className="hx-vignette" aria-hidden />}
    </div>
  );
}
