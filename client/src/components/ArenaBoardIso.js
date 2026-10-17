import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_COLS, BOARD_ROWS_HALF, BOARD_SIZE, ITEM_MAP } from './pokeArenaData';

const COLS = BOARD_COLS;
const ROWS = BOARD_ROWS_HALF * 2; // 6
const SIZE = 50;
const ISO_Y = 0.5;

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

const roundRectPath = (ctx, x, y, w, h, r) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const drawCave = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2e2c28');
  g.addColorStop(0.4, '#3f3830');
  g.addColorStop(1, '#243018');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(60, 80, 40, 0.35)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.9, w * 0.52, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a1814';
  [[0, 0, 70, 90], [100, 0, 50, 55], [w - 90, 0, 55, 75], [w - 36, 0, 36, 100]].forEach(([x, y, rw, rh]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rw, y);
    ctx.lineTo(x + rw * 0.45, y + rh);
    ctx.closePath();
    ctx.fill();
  });

  const crystals = [
    [w * 0.07, h * 0.4, '#4fd4c4', 1.1],
    [w * 0.12, h * 0.55, '#b07cff', 0.85],
    [w * 0.92, h * 0.38, '#7dff9a', 1.05],
    [w * 0.88, h * 0.56, '#4fd4c4', 0.8],
    [w * 0.16, h * 0.28, '#ff8ad4', 0.75]
  ];
  crystals.forEach(([x, y, color, s]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(8, 4);
    ctx.lineTo(3, 16);
    ctx.lineTo(-3, 16);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  ctx.fillStyle = '#6a4528';
  roundRectPath(ctx, 14, 12, 78, 22, 3);
  ctx.fill();
  ctx.strokeStyle = '#3a2814';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.fillText('Bully Field', 18, 27);
};

const drawRockyRim = (ctx, gridW, gridH) => {
  const pad = 36;
  ctx.save();
  ctx.translate(-pad, -pad * 0.5);
  const w = gridW + pad * 2;
  const h = gridH + pad * 1.6;

  ctx.fillStyle = '#1a1612';
  ctx.beginPath();
  ctx.moveTo(-8, h * 0.55);
  ctx.lineTo(4, h - 2);
  ctx.lineTo(w * 0.5, h + 14);
  ctx.lineTo(w - 10, h * 0.72);
  ctx.lineTo(w - 8, h + 40);
  ctx.lineTo(w * 0.5, h + 54);
  ctx.lineTo(-16, h + 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3e3630';
  ctx.beginPath();
  ctx.moveTo(12, 24);
  ctx.lineTo(w * 0.25, 8);
  ctx.lineTo(w * 0.55, 18);
  ctx.lineTo(w - 12, 22);
  ctx.lineTo(w - 4, h * 0.55);
  ctx.lineTo(w - 24, h + 8);
  ctx.lineTo(w * 0.5, h + 18);
  ctx.lineTo(8, h);
  ctx.lineTo(-4, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
};

const PixelPoke = ({ unit, enemy }) => {
  const chain = [unit.model, unit.home, unit.art, unit.anim, unit.pixel, unit.sprite].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const src = chain[Math.min(idx, chain.length - 1)];
  return (
    <img
      className={`ktb-sprite ktb-model${enemy ? ' is-enemy' : ''}`}
      src={src}
      alt={unit.name}
      draggable={false}
      onError={() => setIdx((i) => Math.min(i + 1, chain.length - 1))}
    />
  );
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
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawCave(ctx, cssW, cssH);

      const worldW = metrics.gridW + 70;
      const worldH = metrics.gridH + 90;
      const scale = Math.min((cssW - 20) / worldW, (cssH - 16) / (worldH * ISO_Y)) * 1.02;
      const ox = (cssW - metrics.gridW * scale) / 2;
      const oy = (cssH - metrics.gridH * ISO_Y * scale) / 2 + 6;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale * ISO_Y);

      drawRockyRim(ctx, metrics.gridW, metrics.gridH);

      cells.forEach((cell) => {
        const cx = cell.x + SIZE;
        const cy = cell.y + SIZE;
        const unit = cell.enemy
          ? safeEnemy[cell.index]
          : safeBoard[cell.index];
        const selected = !cell.enemy && (
          (unit && unit.uid === selectedUid)
          || (!unit && placing)
        );

        ctx.save();
        ctx.translate(1.5, 2.5);
        hexPath(ctx, cx, cy, SIZE - 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fill();
        ctx.restore();

        hexPath(ctx, cx, cy, SIZE - 0.5);
        const fill = ctx.createLinearGradient(cx, cy - SIZE, cx, cy + SIZE);
        if (cell.enemy) {
          fill.addColorStop(0, '#b08452');
          fill.addColorStop(0.45, '#8a5a34');
          fill.addColorStop(1, '#4a301c');
        } else {
          fill.addColorStop(0, '#a8a8b2');
          fill.addColorStop(0.45, '#6e6e78');
          fill.addColorStop(1, '#3a3a44');
        }
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.save();
        hexPath(ctx, cx, cy, SIZE - 0.5);
        ctx.clip();
        const shine = ctx.createLinearGradient(cx, cy - SIZE, cx, cy);
        shine.addColorStop(0, 'rgba(255,255,255,0.18)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        ctx.fillRect(cx - SIZE, cy - SIZE, SIZE * 2, SIZE);
        ctx.restore();

        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (unit) {
          ctx.save();
          hexPath(ctx, cx, cy, SIZE - 0.5);
          ctx.strokeStyle = cell.enemy ? '#ff3b4a' : '#2dff7a';
          ctx.lineWidth = 4;
          ctx.shadowColor = cell.enemy ? 'rgba(255,50,70,0.75)' : 'rgba(45,255,120,0.65)';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        } else if (selected) {
          ctx.save();
          hexPath(ctx, cx, cy, SIZE - 0.5);
          ctx.strokeStyle = '#ffd84a';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = 'rgba(255,216,74,0.5)';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.restore();
        } else if (!cell.enemy && placing) {
          ctx.save();
          hexPath(ctx, cx, cy, SIZE - 0.5);
          ctx.strokeStyle = 'rgba(255,216,74,0.35)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
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
    const ro = new ResizeObserver(paint);
    ro.observe(wrap);
    return () => ro.disconnect();
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
      const dy = y - cell.screenY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        best = cell;
      }
    });
    if (best) onCellClick?.(best.allyIndex);
  };

  return (
    <div className="ktb-stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="ktb-canvas"
        onClick={(e) => hitTest(e.clientX, e.clientY)}
      />
      {layout?.overlays.map((cell) => {
        const unit = cell.enemy ? safeEnemy[cell.index] : safeBoard[cell.index];
        if (!unit) return null;
        const fx = fxMap[unit.uid];
        const hpInfo = hpMap[unit.uid];
        const ratio = hpInfo
          ? Math.max(0, Math.min(1, hpInfo.cur / Math.max(1, hpInfo.max)))
          : 1;
        const floats = floatFx.filter((f) => f.uid === unit.uid);
        return (
          <div
            key={unit.uid}
            className={`ktb-pin${cell.enemy ? ' is-enemy' : ''}${fx ? ` fx-${fx}` : ''}${hpInfo && !hpInfo.alive ? ' is-down' : ''}`}
            style={{ left: cell.screenX, top: cell.screenY }}
            onMouseEnter={() => onHoverUnit?.(unit)}
            onMouseLeave={() => onHoverUnit?.(null)}
            onClick={() => {
              if (!cell.enemy && stage === 'prep') onCellClick?.(cell.allyIndex);
            }}
            role="presentation"
          >
            <div className="ktb-overhead">
              <span className="ktb-stars">{'★'.repeat(unit.star)}</span>
              {(unit.items || []).length > 0 && (
                <span className="ktb-items">
                  {(unit.items || []).map((id) => (
                    <em key={id}>{ITEM_MAP[id]?.icon || '·'}</em>
                  ))}
                </span>
              )}
              <span className={`ktb-hpbar${cell.enemy ? ' is-enemy' : ''}`}>
                <i style={{ width: `${ratio * 100}%` }} />
              </span>
              {hpInfo && (
                <span className="ktb-hpnum">{Math.ceil(hpInfo.cur)}/{hpInfo.max}</span>
              )}
            </div>
            {floats.map((f) => (
              <span key={f.key} className={`ktb-float is-${f.kind || 'dmg'}`}>{f.text}</span>
            ))}
            {fx === 'spell' && <span className="ktb-burst" aria-hidden />}
            {fx === 'strike' && <span className="ktb-slash" aria-hidden />}
            <span className="ktb-shadow" />
            <PixelPoke unit={unit} enemy={cell.enemy} />
          </div>
        );
      })}
    </div>
  );
}
