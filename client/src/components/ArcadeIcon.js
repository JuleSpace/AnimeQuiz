import React from 'react';

const G = '#ffd000';
const R = '#ff2347';
const B = '#1f6dff';
const K = '#111318';
const W = '#f4f6ff';

const edge = {
  stroke: K,
  strokeWidth: 1.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round'
};

const GLYPHS = {
  music: (
    <>
      <path d="M9 21.5c0-6.2 2.6-10.5 7-10.5s7 4.3 7 10.5" fill="none" stroke={G} strokeWidth="3.2" strokeLinecap="round" />
      <rect x="4.2" y="17.5" width="7.2" height="9" rx="2" fill={R} {...edge} />
      <rect x="20.6" y="17.5" width="7.2" height="9" rx="2" fill={B} {...edge} />
    </>
  ),
  quiz: (
    <>
      <path d="M7.5 4.5h11l6 6v17h-17z" fill={G} {...edge} />
      <path d="M18.5 4.5v6h6" fill={R} {...edge} />
      <path d="M16 13.2l3.3 3.3L16 19.8l-3.3-3.3z" fill={R} {...edge} />
    </>
  ),
  rules: (
    <>
      <path d="M16 7.2c-2.2-1.8-6.2-1.8-8.6.2v16.2c2.4-1.6 6.2-1.6 8.6.2 2.4-1.8 6.2-1.8 8.6-.2V7.4c-2.4-2-6.4-2-8.6-.2z" fill={G} {...edge} />
      <path d="M16 8.2v15.2" stroke={K} strokeWidth="1.5" />
      <path d="M9 12.2h4.2M18.8 12.2h4.2M9 16h4.2" stroke={R} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  booster: (
    <>
      <path d="M6 12.5h20V27H6z" fill={G} {...edge} />
      <path d="M6 12.5L16 6l10 6.5" fill={R} {...edge} />
      <path d="M17.2 14.2l-4.2 6.2h4.2l-2.2 6.2 7.4-8.2h-4.2z" fill={B} {...edge} />
    </>
  ),
  tools: (
    <>
      <path d="M16 3.2l4.6 2.6v5.2l4.6 2.6-4.6 2.6v5.2L16 24.2l-4.6-2.8v-5.2L6.8 13.6l4.6-2.6V5.8z" fill={G} {...edge} />
      <circle cx="16" cy="13.6" r="3" fill={R} {...edge} />
    </>
  ),
  plus: (
    <path d="M13 4.5h6V13h8.5v6H19v8.5h-6V19H4.5v-6H13z" fill={G} {...edge} />
  ),
  list: (
    <>
      <rect x="4.5" y="5.2" width="6.2" height="6.2" fill={R} {...edge} />
      <rect x="4.5" y="12.9" width="6.2" height="6.2" fill={G} {...edge} />
      <rect x="4.5" y="20.6" width="6.2" height="6.2" fill={B} {...edge} />
      <path d="M14 8.3h13.2M14 16h13.2M14 23.7h10" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pencil: (
    <>
      <path d="M19.2 4.2l8.6 8.6L13 27.6H4.4V19z" fill={G} {...edge} />
      <path d="M4.4 27.6l4.4 1.6 1.8-4.6" fill={R} {...edge} />
    </>
  ),
  trash: (
    <>
      <path d="M12.2 5h7.6v2.4h-7.6z" fill={G} {...edge} />
      <path d="M5.5 8.2h21v3.2h-21z" fill={G} {...edge} />
      <path d="M8 11.4h16l-1.3 15.2H9.3z" fill={R} {...edge} />
      <path d="M13 15.2v8M19 15.2v8" stroke={K} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  save: (
    <>
      <path d="M6 4h15.2L26 8.8V28H6z" fill={B} {...edge} />
      <path d="M10 4h8.4v7.2H10z" fill={G} {...edge} />
      <path d="M9.2 17.5h13.6V28H9.2z" fill={W} {...edge} />
    </>
  ),
  cross: (
    <>
      <path d="M8 6.5l17.5 19" stroke={G} strokeWidth="6" strokeLinecap="round" />
      <path d="M25.5 6.5L8 25.5" stroke={G} strokeWidth="6" strokeLinecap="round" />
      <path d="M8 6.5l17.5 19M25.5 6.5L8 25.5" stroke={R} strokeWidth="3.2" strokeLinecap="round" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 16S8 8 16 8s13.2 8 13.2 8-5.2 8-13.2 8S2.8 16 2.8 16z" fill={G} {...edge} />
      <circle cx="16" cy="16" r="4.4" fill={B} {...edge} />
      <circle cx="17.5" cy="14.6" r="1.5" fill={W} />
    </>
  ),
  lock: (
    <>
      <path d="M11 14.2V10a5 5 0 0 1 10 0v4.2" fill="none" stroke={R} strokeWidth="3.1" strokeLinecap="round" />
      <rect x="6.8" y="13.6" width="18.4" height="13.2" rx="2" fill={G} {...edge} />
      <circle cx="16" cy="19.4" r="1.8" fill={K} />
      <path d="M16 20.8v2.6" stroke={K} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  pad: (
    <>
      <path d="M3.5 12.2h25v9.2c0 2.2-1.8 4-4.4 4h-2.2l-2.2-2.4h-7.4l-2.2 2.4H7.9c-2.6 0-4.4-1.8-4.4-4z" fill={K} stroke={G} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 16.4h7.2M11.8 12.8v7.2" stroke={W} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21.2" cy="15.2" r="1.7" fill={R} />
      <circle cx="24.6" cy="18.2" r="1.7" fill={B} />
    </>
  ),
  exit: (
    <>
      <path d="M4.8 5.5h12.2v21H4.8z" fill={B} {...edge} />
      <path d="M13.5 16h12" stroke={G} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M21.2 10.6L28 16l-6.8 5.4" fill={R} {...edge} />
    </>
  ),
  crown: (
    <>
      <path d="M4 24.5V12.2l6.2 5.2L16 7.2l5.8 10.2 6.2-5.2v12.3z" fill={G} {...edge} />
      <circle cx="10" cy="20.2" r="1.6" fill={R} />
      <circle cx="16" cy="20.2" r="1.6" fill={B} />
      <circle cx="22" cy="20.2" r="1.6" fill={R} />
    </>
  ),
  go: (
    <>
      <path d="M3 7.2L12.2 16 3 24.8h5.2L17.4 16 8.2 7.2z" fill={G} {...edge} />
      <path d="M14 7.2L23.2 16 14 24.8h5.2L28.4 16 19.2 7.2z" fill={R} {...edge} />
    </>
  ),
  trophy: (
    <>
      <path d="M11 5h10v8.2a5 5 0 0 1-10 0z" fill={G} {...edge} />
      <path d="M11 8.2H6.6a4.2 4.2 0 0 0 4.2 4.6M21 8.2h4.4a4.2 4.2 0 0 1-4.4 4.6" fill="none" stroke={R} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 18.2h4v4.2h-4z" fill={G} {...edge} />
      <path d="M10 25.2h12v2.8H10z" fill={R} {...edge} />
    </>
  ),
  check: (
    <path d="M5.5 16.8l6.6 6.8L26.5 7.6" fill="none" stroke={G} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  search: (
    <>
      <circle cx="13.6" cy="13.6" r="7.6" fill={B} {...edge} />
      <circle cx="13.6" cy="13.6" r="3.4" fill={G} />
      <path d="M19.4 19.4L27.2 27.2" stroke={R} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  star: (
    <>
      <path d="M16 2.2l3.2 9.6L29 15.2l-9.8 3.4L16 28.6l-3.2-10L3 15.2l9.8-3.4z" fill={G} {...edge} />
      <circle cx="16" cy="15.6" r="2.3" fill={R} />
    </>
  ),
  back: (
    <path d="M21.5 5.2L8 16l13.5 10.8" fill="none" stroke={G} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  clock: (
    <>
      <rect x="4.8" y="4.8" width="22.4" height="22.4" rx="3" fill={K} stroke={G} strokeWidth="2.4" />
      <path d="M16 9.6v7.2l4.8 2.8" fill="none" stroke={R} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  play: (
    <path d="M9 5.2l17.2 10.8L9 26.8z" fill={G} {...edge} />
  ),
  box: (
    <>
      <rect x="5.5" y="5.5" width="21" height="21" fill={K} stroke={G} strokeWidth="2.6" />
      <rect x="12" y="12" width="8" height="8" fill={R} />
    </>
  ),
  coin: (
    <>
      <circle cx="16" cy="16" r="11" fill={G} {...edge} />
      <path d="M16 8.2l4.8 7.8L16 23.8l-4.8-7.8z" fill={R} {...edge} />
    </>
  ),
  expand: (
    <>
      <path d="M5 13V5h8" fill="none" stroke={G} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 13V5h-8" fill="none" stroke={R} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19v8h8" fill="none" stroke={B} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 19v8h-8" fill="none" stroke={G} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  shrink: (
    <>
      <path d="M13 5v8H5" fill="none" stroke={G} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5v8h8" fill="none" stroke={R} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 27v-8H5" fill="none" stroke={B} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 27v-8h8" fill="none" stroke={G} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
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
    {GLYPHS[name] || null}
  </svg>
);

export default Icon;
