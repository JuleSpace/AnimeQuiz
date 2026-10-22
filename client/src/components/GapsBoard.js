import React from 'react';
import { LyricLine } from './LyricsPlayer';

// Plus le texte est long, plus la police diminue et plus le cadre s'agrandit (au lieu de déborder)
const sizeClass = (text) => {
  const words = String(text || '').replace(/_+/g, ' ___ ').split(/\s+/).filter(Boolean).length;
  const chars = String(text || '').length;
  if (words > 110 || chars > 650) return ' is-xxl';
  if (words > 60 || chars > 360) return ' is-xl';
  if (words > 28 || chars > 170) return ' is-long';
  return '';
};

const GapsBoard = ({ line = '', filled = '', imageUrl = '' }) => (
  <div className={`gaps-board lyrics-player${sizeClass(filled || line)}`}>
    <div className={`lyrics-stage gaps-stage${imageUrl ? ' has-bg' : ''}`}>
      {imageUrl ? (
        <>
          <img className="gaps-bg" src={imageUrl} alt="" />
          <span className="gaps-veil" aria-hidden="true" />
        </>
      ) : null}
      <div className="lyrics-card gaps-card">
        <LyricLine line={line} filled={filled} />
      </div>
    </div>
  </div>
);

export default GapsBoard;
