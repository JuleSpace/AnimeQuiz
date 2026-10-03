import React from 'react';

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter'
};

const GLYPHS = {
  music: (
    <>
      <ellipse cx="10.2" cy="23.4" rx="3.5" ry="2.7" fill="currentColor" />
      <path {...line} d="M13.6 23V7.4L24.4 5v15.4" />
      <ellipse cx="21" cy="20.4" rx="3.5" ry="2.7" fill="currentColor" />
    </>
  ),
  quiz: (
    <>
      <path {...line} d="M8 4h11l5 5v19H8z" />
      <path {...line} d="M19 4v5h5" />
      <path d="M16 13.2l3.1 3.1L16 19.4l-3.1-3.1z" fill="currentColor" />
    </>
  ),
  rules: (
    <>
      <path {...line} d="M5 7h9v19H5zM18 7h9v19h-9z" />
      <path {...line} d="M7.4 12h4.2M7.4 16h4.2M20.4 12h4.2M20.4 16h4.2M20.4 20h4.2" />
    </>
  ),
  booster: (
    <>
      <path {...line} d="M8 11h16v16H8z" />
      <path {...line} d="M8 11l8-6 8 6" />
      <path {...line} d="M11 17l4 6M15.2 16l5 8M19.4 16.5l3.2 4.4" />
    </>
  ),
  tools: (
    <>
      <circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="1.7" fill="currentColor" />
      <path {...line} d="M16 3.2v4.6M16 24.2v4.6M3.2 16h4.6M24.2 16h4.6M6.8 6.8l3.3 3.3M21.9 21.9l3.3 3.3M25.2 6.8l-3.3 3.3M10.1 21.9l-3.3 3.3" />
    </>
  ),
  plus: (
    <path {...line} strokeWidth="2.8" d="M16 6v20M6 16h20" />
  ),
  list: (
    <>
      <rect x="5" y="6" width="5" height="5" fill="currentColor" />
      <rect x="5" y="13.5" width="5" height="5" fill="currentColor" />
      <rect x="5" y="21" width="5" height="5" fill="currentColor" />
      <path {...line} d="M14 8.5h13M14 16h13M14 23.5h13" />
    </>
  ),
  pencil: (
    <>
      <path {...line} d="M19 5l8 8L12 28H4v-8z" />
      <path {...line} d="M16.4 7.6l8 8" />
    </>
  ),
  trash: (
    <>
      <path {...line} d="M7 9h18M12 9V6h8v3M9.5 9l1 18h11l1-18" />
      <path {...line} d="M14 13.5v9M18 13.5v9" />
    </>
  ),
  save: (
    <>
      <path {...line} d="M6 5h15l5 5v17H6z" />
      <path {...line} d="M11 5v7h8V5M10 18h12v9H10z" />
    </>
  ),
  cross: (
    <path {...line} strokeWidth="2.8" d="M8 8l16 16M24 8L8 24" />
  ),
  eye: (
    <>
      <path {...line} d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16z" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </>
  ),
  lock: (
    <>
      <rect x="7" y="14" width="18" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path {...line} d="M11 14V10a5 5 0 0 1 10 0v4" />
    </>
  ),
  pad: (
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2 7h28v18H2zM7 13h8v3.2H7zM9.4 10.6h3.2v8H9.4zM19.2 12.2a2.3 2.3 0 1 0 .02 0zM24.6 16.6a2.3 2.3 0 1 0 .02 0z"
    />
  ),
  exit: (
    <>
      <path {...line} d="M6 5h12v22H6z" />
      <path {...line} d="M14 16h13M22 11l5 5-5 5" />
    </>
  ),
  crown: (
    <path d="M5 24V13l6 5 5-9 5 9 6-5v11z" fill="currentColor" />
  ),
  go: (
    <path {...line} strokeWidth="2.6" d="M7 7l9 9-9 9M16 7l9 9-9 9" />
  ),
  trophy: (
    <>
      <path {...line} d="M11 6h10v8a5 5 0 0 1-10 0z" />
      <path {...line} d="M11 9H7v3a4 4 0 0 0 4 4M21 9h4v3a4 4 0 0 1-4 4M16 19v4M11 27h10" />
    </>
  ),
  check: (
    <path {...line} strokeWidth="3" d="M6 17l7 7L26 8" />
  ),
  search: (
    <>
      <circle cx="14" cy="14" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path {...line} strokeWidth="2.6" d="M19.5 19.5L27 27" />
    </>
  ),
  star: (
    <path d="M16 3l3.2 9.8L29 16l-9.8 3.2L16 29l-3.2-9.8L3 16l9.8-3.2z" fill="currentColor" />
  ),
  back: (
    <path {...line} strokeWidth="2.8" d="M21 6L10 16l11 10" />
  ),
  clock: (
    <>
      <rect x="5" y="5" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path {...line} d="M16 10v7l5 3" />
    </>
  ),
  play: (
    <path d="M10 6l16 10L10 26z" fill="currentColor" />
  ),
  box: (
    <rect x="6" y="6" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" />
  ),
  coin: (
    <>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 9l5 7-5 7-5-7z" fill="currentColor" />
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
