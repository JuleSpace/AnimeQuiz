import React from 'react';

// Pictos City Escape : formes blanches et or, gros contour marine, légère inclinaison « vitesse »
// comme les titres, et un reflet blanc en haut à gauche.
const W = '#ffffff';
const G = '#ffd23a';
const B = '#1f6dff';
const R = '#ff2347';
const N = '#08164d';

const line = { stroke: N, strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const thin = { stroke: N, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round', fill: 'none' };

const GLYPHS = {
  music: (
    <>
      <path d="M7.5 18.5V15a8.5 8.5 0 0 1 17 0v3.5" {...thin} strokeWidth="3.4" />
      <path d="M7.5 18.5V15a8.5 8.5 0 0 1 17 0v3.5" fill="none" stroke={W} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4" y="16.5" width="7" height="10.5" rx="3" fill={G} {...line} />
      <rect x="21" y="16.5" width="7" height="10.5" rx="3" fill={G} {...line} />
      <path d="M6.2 19v5" stroke={W} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  quiz: (
    <>
      <path d="M8 4h11.5L25 9.5V28H8z" fill={W} {...line} />
      <path d="M19.5 4v5.5H25" fill={G} {...line} />
      <path d="M13.2 14.2a3.4 3.4 0 1 1 4.6 3.2c-1 .4-1.6 1-1.6 2v.8" {...thin} strokeWidth="2.6" stroke={B} />
      <circle cx="16.2" cy="24" r="1.6" fill={B} />
    </>
  ),
  rules: (
    <>
      <path d="M16 7.5C13 5.6 8.5 5.6 5 7.5v17c3.5-1.9 8-1.9 11 0 3-1.9 7.5-1.9 11 0v-17c-3.5-1.9-8-1.9-11 0z" fill={W} {...line} />
      <path d="M16 7.5v17" {...thin} />
      <path d="M8.5 12h4.5M8.5 16h4.5M19 12h4.5M19 16h4.5" stroke={B} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 3.5v8l1.8-1.4 1.8 1.4v-8z" fill={R} {...line} strokeWidth="1.6" />
    </>
  ),
  booster: (
    <>
      <path d="M16 3.5c5.6 0 10 7.6 10 14.2C26 24 21.6 28.5 16 28.5S6 24 6 17.7C6 11.1 10.4 3.5 16 3.5z" fill={W} {...line} />
      <path d="M7 16.5l4 2.5 3.4-3 3.2 3 3.4-3 4 2.6" {...thin} stroke={N} />
      <path d="M6.6 20c.8 5 4.6 8.5 9.4 8.5s8.6-3.5 9.4-8.5l-4.4-1.6-3.4 3-3.2-3-3.4 3z" fill={G} {...line} />
      <path d="M11 8.5c1.2-1.6 2.6-2.4 4-2.6" stroke={B} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </>
  ),
  tools: (
    <>
      <path d="M13.6 3.5h4.8l.8 3.4 2.4 1.4 3.3-1 2.4 4.2-2.5 2.4v2.8l2.5 2.4-2.4 4.2-3.3-1-2.4 1.4-.8 3.4h-4.8l-.8-3.4-2.4-1.4-3.3 1-2.4-4.2 2.5-2.4v-2.8L4.7 12.5l2.4-4.2 3.3 1 2.4-1.4z" fill={W} {...line} />
      <circle cx="16" cy="16" r="4.2" fill={G} {...line} />
    </>
  ),
  plus: (
    <path d="M12.8 4h6.4v8.8H28v6.4h-8.8V28h-6.4v-8.8H4v-6.4h8.8z" fill={G} {...line} />
  ),
  list: (
    <>
      <rect x="4" y="5" width="7" height="7" rx="1.6" fill={G} {...line} />
      <rect x="4" y="18" width="7" height="7" rx="1.6" fill={W} {...line} />
      <path d="M15 8.5h12M15 21.5h12" stroke={N} strokeWidth="5" strokeLinecap="round" />
      <path d="M15 8.5h12M15 21.5h12" stroke={W} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  pencil: (
    <>
      <path d="M20 4.5l7.5 7.5L12 27.5H4.5V20z" fill={G} {...line} />
      <path d="M17 7.5l7.5 7.5" {...thin} />
      <path d="M4.5 20l7.5 7.5H4.5z" fill={W} {...line} />
    </>
  ),
  trash: (
    <>
      <path d="M12 4.5h8v3h-8z" fill={W} {...line} />
      <path d="M5 8h22v3.5H5z" fill={W} {...line} />
      <path d="M7.5 11.5h17l-1.6 16H9.1z" fill={R} {...line} />
      <path d="M13 15.5v8M19 15.5v8" stroke={W} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  save: (
    <>
      <path d="M5 4.5h17l5 5V27.5H5z" fill={W} {...line} />
      <path d="M9.5 4.5h10V11h-10z" fill={B} {...line} />
      <path d="M9 17h14v10.5H9z" fill={G} {...line} />
    </>
  ),
  cross: (
    <>
      <path d="M8 8l16 16M24 8L8 24" stroke={N} strokeWidth="8" strokeLinecap="round" />
      <path d="M8 8l16 16M24 8L8 24" stroke={R} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 16S8 7.5 16 7.5 29.5 16 29.5 16 24 24.5 16 24.5 2.5 16 2.5 16z" fill={W} {...line} />
      <circle cx="16" cy="16" r="5" fill={B} {...line} />
      <circle cx="17.6" cy="14.4" r="1.6" fill={W} />
    </>
  ),
  lock: (
    <>
      <path d="M10.5 14V10a5.5 5.5 0 0 1 11 0v4" {...thin} strokeWidth="5.4" />
      <path d="M10.5 14V10a5.5 5.5 0 0 1 11 0v4" fill="none" stroke={W} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="6" y="13.5" width="20" height="14" rx="3" fill={G} {...line} />
      <path d="M16 18.5v4" stroke={N} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  pad: (
    <>
      <path d="M9 9.5h14c3.6 0 6 3.4 6 8.6 0 4-1.6 6.4-3.8 6.4-2 0-3-1.8-4.4-3.6H11.2C9.8 22.7 8.8 24.5 6.8 24.5 4.6 24.5 3 22.1 3 18.1c0-5.2 2.4-8.6 6-8.6z" fill={W} {...line} />
      <path d="M7.6 16h5.2M10.2 13.4v5.2" stroke={N} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21" cy="14.6" r="1.9" fill={G} stroke={N} strokeWidth="1.4" />
      <circle cx="24.4" cy="18" r="1.9" fill={B} stroke={N} strokeWidth="1.4" />
    </>
  ),
  exit: (
    <>
      <path d="M5 4.5h12.5v23H5z" fill={W} {...line} />
      <path d="M13 16h9" stroke={N} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M13 16h9" stroke={G} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 9.5l8 6.5-8 6.5z" fill={G} {...line} />
    </>
  ),
  crown: (
    <>
      <path d="M4 25V11l6.5 5.5L16 6l5.5 10.5L28 11v14z" fill={G} {...line} />
      <path d="M4 21h24" {...thin} />
      <circle cx="16" cy="16" r="2" fill={W} stroke={N} strokeWidth="1.4" />
    </>
  ),
  go: (
    <>
      <path d="M3.5 7.5h6L17 16l-7.5 8.5h-6L11 16z" fill={W} {...line} />
      <path d="M14 7.5h6l7.5 8.5-7.5 8.5h-6l7.5-8.5z" fill={G} {...line} />
    </>
  ),
  trophy: (
    <>
      <path d="M10 13H6.5a3.5 3.5 0 0 1 0-7H10M22 13h3.5a3.5 3.5 0 0 0 0-7H22" {...thin} strokeWidth="2.6" />
      <path d="M10 4.5h12v9a6 6 0 0 1-12 0z" fill={G} {...line} />
      <path d="M14 19.5h4v4h-4z" fill={G} {...line} />
      <path d="M9.5 23.5h13v4h-13z" fill={W} {...line} />
      <path d="M13 7.5v5" stroke={W} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  check: (
    <>
      <path d="M5.5 16.5l7 7L26.5 8.5" fill="none" stroke={N} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 16.5l7 7L26.5 8.5" fill="none" stroke={G} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (
    <>
      <path d="M19.5 19.5L27 27" stroke={N} strokeWidth="7" strokeLinecap="round" />
      <path d="M19.5 19.5L27 27" stroke={G} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="13.5" cy="13.5" r="8.5" fill={W} {...line} />
      <path d="M9.5 11.5a4.5 4.5 0 0 1 4-3" stroke={B} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  star: (
    <>
      <path d="M16 2.5l3.7 8.6 9.3.8-7 6.1 2.1 9.1L16 22.3l-8.1 4.8 2.1-9.1-7-6.1 9.3-.8z" fill={G} {...line} />
      <path d="M13.5 10.5l1.4-3" stroke={W} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  back: (
    <>
      <path d="M20.5 5.5L10 16l10.5 10.5" fill="none" stroke={N} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 5.5L10 16l10.5 10.5" fill="none" stroke={W} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="12" fill={W} {...line} />
      <circle cx="16" cy="16" r="12" fill="none" stroke={G} strokeWidth="2" strokeDasharray="2 4.28" />
      <path d="M16 9v7.5l5 3" fill="none" stroke={N} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  play: (
    <path d="M9 4.5L26.5 16 9 27.5z" fill={G} {...line} />
  ),
  box: (
    <>
      <path d="M16 3.5l11 5.5v14L16 28.5 5 23V9z" fill={W} {...line} />
      <path d="M5 9l11 5.5L27 9M16 14.5v14" {...thin} />
      <path d="M5 9l11 5.5V28.5L5 23z" fill={G} {...line} />
    </>
  ),
  coin: (
    <>
      <circle cx="16" cy="16" r="12" fill={G} {...line} />
      <circle cx="16" cy="16" r="6.2" fill="#2a6bff" {...line} />
      <path d="M8.6 11.2a8.5 8.5 0 0 1 4.6-4.3" stroke={W} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  expand: (
    <>
      <path d="M5 13V5h8M27 13V5h-8M5 19v8h8M27 19v8h-8" fill="none" stroke={N} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13V5h8M27 13V5h-8M5 19v8h8M27 19v8h-8" fill="none" stroke={G} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  shrink: (
    <>
      <path d="M13 5v8H5M19 5v8h8M13 27v-8H5M19 27v-8h8" fill="none" stroke={N} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5v8H5M19 5v8h8M13 27v-8H5M19 27v-8h8" fill="none" stroke={G} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
};

const Icon = ({ name, tone, bare, size }) => (
  <svg
    className={['arcade-icon', tone, bare ? 'bare' : ''].filter(Boolean).join(' ')}
    style={size ? { width: size, height: size } : undefined}
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
  >
    <g transform="translate(2.2 0) skewX(-8)">{GLYPHS[name] || null}</g>
  </svg>
);

export default Icon;
