import React, { useId } from 'react';
import './GameLogo.css';

// Polices des logos, hébergées avec le site (licences Apache 2.0 et OFL dans /fonts)
if (typeof document !== 'undefined' && !document.getElementById('gl-fonts')) {
  const base = `${process.env.PUBLIC_URL || ''}/fonts`;
  const st = document.createElement('style');
  st.id = 'gl-fonts';
  st.textContent = `@font-face{font-family:'Luckiest Guy';src:url('${base}/LuckiestGuy-Regular.ttf') format('truetype');font-display:swap}`
    + `@font-face{font-family:'Pixelify Logo';src:url('${base}/PixelifySans.ttf') format('truetype');font-weight:400 700;font-display:swap}`;
  document.head.appendChild(st);
}

/*
 * Logos des jeux en SVG : un lettrage inspiré des logos Pokémon (lettres dorées en arc, contour bleu épais,
 * relief foncé, reflet) posé sur une petite scène dans la direction artistique de chaque jeu.
 * Deux calques : le décor remplit le cadre (slice), le lettrage reste toujours entier (meet).
 */

const THEMES = {
  quiz: { top: 'Bully’s', main: 'LAIR', tag: 'Quiz entre potes', fill: ['#fff7b0', '#ffd23a', '#ff9a00'], line: '#ff2347', deep: '#08164d', tagBg: '#ff2347' },
  arena: { top: 'Poké Bully', main: 'TACTICS', tag: 'Auto-battler', fill: ['#ffd6f0', '#b9c8ff', '#8ff0d4'], line: '#f3f0ff', deep: '#0e0b1f', tagBg: '#7a5cff' },
  swarm: { top: 'Poké', main: 'SWARM', tag: 'Survivor', fill: ['#fff3a6', '#ffd447', '#ff9f1a'], line: '#6b3fd6', deep: '#120b26', tagBg: '#ff6b57', pixel: true },
  rush: { top: 'Poké', main: 'RUSH', tag: 'Survivor 3D', fill: ['#fff27a', '#ffd60a', '#ffb800'], line: '#2563ff', deep: '#14142b', tagBg: '#ff3d57' },
  bonk: { top: 'Sonic', main: 'BONK', tag: 'Green Hill', fill: ['#fff6b0', '#ffd23a', '#ff8a00'], line: '#1f6dff', deep: '#0a1f6b', tagBg: '#ff2347' },
  cards: { top: 'Atelier des', main: 'CARTES', tag: 'Cartes jokers', fill: ['#ffffff', '#ffe1ea', '#ffb3c6'], line: '#e0193f', deep: '#5c0a22', tagBg: '#08164d' },
  academy: { top: 'Cobblemon', main: 'ACADEMY', tag: 'Guide', fill: ['#fffbd0', '#ffe14d', '#f2b705'], line: '#1f9d5a', deep: '#0b3322', tagBg: '#2a8cff' }
};

/* ——— Décors (viewBox 400 × 260) ——— */
const rays = (n, a, b, cx = 200, cy = 150) => Array.from({ length: n }, (_, i) => {
  const t0 = (i / n) * Math.PI * 2; const t1 = ((i + 0.5) / n) * Math.PI * 2; const R = 600;
  return <polygon key={i} points={`${cx},${cy} ${cx + R * Math.cos(t0)},${cy + R * Math.sin(t0)} ${cx + R * Math.cos(t1)},${cy + R * Math.sin(t1)}`} fill={i % 2 ? a : b} />;
});
const Ball = ({ x, y, r, o = 1, px = false }) => (
  <g opacity={o} transform={`translate(${x} ${y})`} shapeRendering={px ? 'crispEdges' : undefined}>
    <circle r={r} fill="#fff" stroke="#111" strokeWidth={r * 0.12} />
    <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`} fill="#ef3340" stroke="#111" strokeWidth={r * 0.12} />
    <rect x={-r} y={-r * 0.08} width={r * 2} height={r * 0.16} fill="#111" />
    <circle r={r * 0.3} fill="#fff" stroke="#111" strokeWidth={r * 0.12} />
  </g>
);

const Scene = ({ id, uid }) => {
  if (id === 'quiz') {
    return (
      <>
        <rect width="400" height="260" fill="#0b3bd1" />
        <g className="gl-spin">{rays(28, '#1f6dff', '#0b3bd1')}</g>
        <radialGradient id={`${uid}v`} cx="50%" cy="58%" r="70%"><stop offset="40%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#030a33" stopOpacity="0.75" /></radialGradient>
        <rect width="400" height="260" fill={`url(#${uid}v)`} />
        <g opacity="0.9">
          <g className="gl-bob">
            <rect x="300" y="26" width="58" height="80" rx="8" fill="#fff" transform="rotate(14 329 66)" />
            <rect x="306" y="32" width="46" height="40" rx="4" fill="#ff2347" transform="rotate(14 329 66)" />
            <text x="329" y="66" transform="rotate(14 329 66)" textAnchor="middle" className="gl-font" fontSize="34" fill="#fff">?</text>
          </g>
          <g className="gl-bob is-late">
            <rect x="40" y="150" width="50" height="70" rx="7" fill="#ffd23a" transform="rotate(-16 65 185)" />
            <text x="65" y="198" transform="rotate(-16 65 185)" textAnchor="middle" className="gl-font" fontSize="34" fill="#08164d">!</text>
          </g>
        </g>
        {[[70, 50], [345, 200], [120, 225], [270, 30]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 9}L${x + 3} ${y - 3}L${x + 9} ${y}L${x + 3} ${y + 3}L${x} ${y + 9}L${x - 3} ${y + 3}L${x - 9} ${y}L${x - 3} ${y - 3}Z`} fill="#fff" opacity="0.85" className="gl-twinkle" style={{ '--k': i }} />)}
      </>
    );
  }
  if (id === 'swarm') {
    const stars = [[30, 30], [80, 70], [140, 22], [220, 48], [300, 18], [350, 64], [380, 30], [60, 120], [250, 95], [175, 85]];
    return (
      <g shapeRendering="crispEdges">
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#140f2a" /><stop offset="0.7" stopColor="#352a5b" /><stop offset="1" stopColor="#5b3f8f" /></linearGradient>
        <rect width="400" height="260" fill={`url(#${uid}s)`} />
        {stars.map(([x, y], i) => <rect key={i} x={x} y={y} width={i % 3 ? 4 : 6} height={i % 3 ? 4 : 6} fill={i % 4 ? '#fff' : '#ffd447'} className="gl-twinkle" style={{ '--k': i }} />)}
        {/* lune pixel */}
        <g fill="#f6f1ff"><rect x="318" y="34" width="36" height="44" /><rect x="312" y="40" width="48" height="32" /></g>
        <g fill="#c9bdf0"><rect x="326" y="44" width="8" height="8" /><rect x="340" y="58" width="6" height="6" /></g>
        {/* forêt pixel */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = i * 30 - 8; const h = 40 + ((i * 37) % 30);
          return (
            <g key={i} fill={i % 2 ? '#1d4a2c' : '#26603a'}>
              <rect x={x + 10} y={260 - h} width="10" height={h} />
              <rect x={x} y={260 - h + 8} width="30" height="16" /><rect x={x + 4} y={260 - h - 4} width="22" height="14" />
            </g>
          );
        })}
        <rect y="244" width="400" height="16" fill="#163a1e" />
        {/* yeux dans la nuit : la horde */}
        {[[60, 214], [120, 226], [290, 218], [345, 230], [205, 232]].map(([x, y], i) => <g key={i} fill="#ff6b57" className="gl-blink" style={{ '--k': i }}><rect x={x} y={y} width="5" height="5" /><rect x={x + 10} y={y} width="5" height="5" /></g>)}
        <Ball x={58} y={64} r={26} o={0.9} px />
      </g>
    );
  }
  if (id === 'rush') {
    // L'île en plein cadre, façon écran-titre (ciel, rivière, terrasses, pont)
    return (
      <>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5aa8f0" /><stop offset="0.55" stopColor="#bfe4ff" /></linearGradient>
        <rect width="400" height="260" fill={`url(#${uid}r)`} />
        <path d="M0 96 L60 80 L120 92 L190 74 L260 90 L330 78 L400 92 L400 120 L0 120 Z" fill="#9cc3ea" />
        <g className="gl-drift"><ellipse cx="90" cy="40" rx="34" ry="10" fill="#fff" /><ellipse cx="112" cy="32" rx="20" ry="10" fill="#fff" /><ellipse cx="300" cy="28" rx="26" ry="8" fill="#fff" opacity="0.9" /></g>
        <rect y="112" width="400" height="148" fill="#5cc23c" />
        {[0, 1, 2].map((i) => <rect key={i} x={-10 + i * 40} y={120 + i * 22} width={190 - i * 30} height="16" fill="#c08a52" stroke="#14142b" strokeWidth="2" />)}
        {[0, 1, 2].map((i) => <rect key={`b${i}`} x={250 + i * 20} y={124 + i * 22} width={160 - i * 20} height="16" fill="#c08a52" stroke="#14142b" strokeWidth="2" />)}
        <path d="M180 112 Q 205 170 175 260 L 240 260 Q 260 170 230 112 Z" fill="#3f9be8" stroke="#14142b" strokeWidth="3" />
        <g className="gl-shimmer">{[[196, 190], [214, 222], [190, 244]].map(([x, y], i) => <rect key={i} x={x} y={y} width="16" height="3" rx="1.5" fill="#e8f6ff" />)}</g>
        <path d="M150 150 Q 205 132 262 150" fill="none" stroke="#14142b" strokeWidth="13" strokeLinecap="round" />
        <path d="M150 150 Q 205 132 262 150" fill="none" stroke="#b07a40" strokeWidth="8" strokeLinecap="round" />
        <circle cx="330" cy="62" r="22" fill="#2f9a3e" stroke="#14142b" strokeWidth="3" /><rect x="326" y="80" width="8" height="26" fill="#7a4a24" stroke="#14142b" strokeWidth="2" />
        <circle cx="60" cy="72" r="18" fill="#ff9ad5" stroke="#14142b" strokeWidth="3" /><rect x="56" y="88" width="8" height="22" fill="#7a4a24" stroke="#14142b" strokeWidth="2" />
        <rect x="6" y="6" width="388" height="248" rx="10" fill="none" stroke="#14142b" strokeWidth="5" />
      </>
    );
  }
  if (id === 'arena') {
    // Nuit violette, lignes de vitesse et trame façon manga, cadre holographique
    return (
      <>
        <radialGradient id={`${uid}a`} cx="60%" cy="45%" r="75%"><stop offset="0" stopColor="#3a2b78" /><stop offset="0.6" stopColor="#17122e" /><stop offset="1" stopColor="#0b0918" /></radialGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9ad5" /><stop offset="0.35" stopColor="#9ab8ff" /><stop offset="0.65" stopColor="#8ff0d4" /><stop offset="1" stopColor="#ffe38a" /></linearGradient>
        <pattern id={`${uid}t`} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.2" fill="#c9b8ff" opacity="0.35" /></pattern>
        <rect width="400" height="260" fill={`url(#${uid}a)`} />
        <g opacity="0.16" className="gl-spin is-slow" style={{ transformOrigin: '240px 118px' }}>{Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return <polygon key={i} points={`240,118 ${240 + Math.cos(a) * 420},${118 + Math.sin(a) * 420} ${240 + Math.cos(a + 0.05) * 420},${118 + Math.sin(a + 0.05) * 420}`} fill="#b9a6ff" />; })}</g>
        <rect y="170" width="400" height="90" fill={`url(#${uid}t)`} />
        <text x="335" y="104" textAnchor="middle" fontSize="84" fill={`url(#${uid}h)`} opacity="0.55" fontFamily="Georgia, serif">♛</text>
        <Ball x={58} y={70} r={28} o={0.8} />
        <rect x="5" y="5" width="390" height="250" rx="8" fill="none" stroke={`url(#${uid}h)`} strokeWidth="5" className="gl-hue" />
      </>
    );
  }
  if (id === 'bonk') {
    return (
      <>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f6dff" /><stop offset="0.7" stopColor="#8fd6ff" /></linearGradient>
        <pattern id={`${uid}c`} width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#8a4a1c" /><rect width="10" height="10" fill="#c97a36" /><rect x="10" y="10" width="10" height="10" fill="#c97a36" /></pattern>
        <rect width="400" height="260" fill={`url(#${uid}b)`} />
        <ellipse cx="70" cy="50" rx="44" ry="14" fill="#fff" /><ellipse cx="96" cy="42" rx="26" ry="14" fill="#fff" /><ellipse cx="330" cy="70" rx="38" ry="11" fill="#fff" opacity="0.9" />
        <circle cx="300" cy="170" r="66" fill="none" stroke={`url(#${uid}c)`} strokeWidth="20" />
        <circle cx="300" cy="170" r="76" fill="none" stroke="#4bb532" strokeWidth="4" />
        <path d="M0 205 Q 120 180 230 205 T 400 200 L400 260 L0 260 Z" fill={`url(#${uid}c)`} />
        <path d="M0 205 Q 120 180 230 205 T 400 200" fill="none" stroke="#4bb532" strokeWidth="9" />
        <g transform="translate(60 205)"><rect x="-4" y="-70" width="8" height="70" fill="#a8662b" /><path d="M0 -70 q -30 -6 -46 10 q 22 -4 46 -6 q -8 -20 -34 -24 q 24 0 34 20 q 6 -24 30 -26 q -22 10 -26 26 q 20 -6 44 6 q -26 -10 -48 -6Z" fill="#2fa83a" /></g>
        {[[150, 120], [175, 104], [200, 96], [225, 104], [250, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill="none" stroke="#ffd23a" strokeWidth="4" className="gl-ring" style={{ '--k': i }} />)}
      </>
    );
  }
  if (id === 'cards') {
    return (
      <>
        <rect width="400" height="260" fill="#ff2f5f" />
        {rays(24, '#ff5a7e', '#ff2f5f')}
        {[-20, 0, 18].map((a, i) => (
          <g key={i} transform={`rotate(${a} 320 220)`} opacity="0.85">
            <rect x="290" y="40" width="60" height="86" rx="8" fill="#fff" />
            <rect x="296" y="46" width="48" height="44" rx="4" fill={['#08164d', '#ffd23a', '#1f6dff'][i]} />
          </g>
        ))}
      </>
    );
  }
  return (
    <>
      <radialGradient id={`${uid}d`} cx="50%" cy="65%" r="70%"><stop offset="0" stopColor="#4fd18b" /><stop offset="1" stopColor="#14603a" /></radialGradient>
      <rect width="400" height="260" fill={`url(#${uid}d)`} />
      <g transform="translate(330 60) rotate(10)" opacity="0.8"><path d="M-40 -24 L0 -16 L40 -24 L40 26 L0 34 L-40 26 Z" fill="#fff" /><line x1="0" y1="-16" x2="0" y2="34" stroke="#1f9d5a" strokeWidth="3" /></g>
      <Ball x={60} y={200} r={30} o={0.7} />
    </>
  );
};

/* ——— Lettrage ——— */
const Wordmark = ({ t, uid }) => {
  const arc = `${uid}p`;
  const fill = `${uid}f`;
  const shine = `${uid}h`;
  const len = [...t.main].length;
  const width = Math.min(330, 70 + len * 46);
  const size = Math.min(92, (width / len) * 1.32);
  const main = (props) => (
    <text textAnchor="middle" className={t.pixel ? 'gl-pixel' : 'gl-font'} fontSize={size} {...props}>
      <textPath href={`#${arc}`} startOffset="50%" textLength={width} lengthAdjust="spacingAndGlyphs">{t.main}</textPath>
    </text>
  );
  return (
    <svg className="gl-word" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">
      <defs>
        <path id={arc} d="M 20 178 Q 200 118 380 178" />
        <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1"><stop offset="0.05" stopColor={t.fill[0]} /><stop offset="0.5" stopColor={t.fill[1]} /><stop offset="1" stopColor={t.fill[2]} /></linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1"><stop offset="0.25" stopColor="#fff" stopOpacity="0.75" /><stop offset="0.45" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      {/* relief */}
      {[10, 8, 6, 4].map((dy) => <g key={dy} transform={`translate(0 ${dy})`}>{main({ fill: t.deep, stroke: t.deep, strokeWidth: 22, strokeLinejoin: 'round' })}</g>)}
      {/* contour épais, puis liseré foncé */}
      {main({ fill: t.line, stroke: t.line, strokeWidth: 22, strokeLinejoin: 'round' })}
      {main({ fill: t.deep, stroke: t.deep, strokeWidth: 9, strokeLinejoin: 'round' })}
      {/* lettres dorées + reflet */}
      {main({ fill: `url(#${fill})` })}
      {main({ fill: `url(#${shine})` })}
      {/* mot du dessus */}
      <g transform="rotate(-6 200 70)">
        <text x="200" y="84" textAnchor="middle" className={t.pixel ? 'gl-pixel' : 'gl-font'} fontSize="40" fill="#fff" stroke={t.deep} strokeWidth="12" strokeLinejoin="round" paintOrder="stroke">{t.top.toUpperCase()}</text>
      </g>
      {/* étiquette */}
      {t.tag && (
        <g transform="rotate(-3 200 222)">
          <rect x={200 - (t.tag.length * 6.4 + 22)} y="204" width={t.tag.length * 12.8 + 44} height="32" rx="16" fill={t.tagBg} stroke={t.deep} strokeWidth="4" />
          <text x="200" y="227" textAnchor="middle" className="gl-tag" fontSize="18" fill="#fff">{t.tag.toUpperCase()}</text>
        </g>
      )}
    </svg>
  );
};

const GameLogo = ({ id, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const t = THEMES[id] || THEMES.quiz;
  return (
    <span className={`gl-root is-${id} ${className}`} aria-hidden="true">
      <svg className="gl-scene" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"><Scene id={id} uid={uid} /></svg>
      <Wordmark t={t} uid={uid} />
    </span>
  );
};

export default GameLogo;
