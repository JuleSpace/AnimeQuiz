import React from 'react';
import { LyricLine } from './LyricsPlayer';

const GapsBoard = ({ line = '', filled = '', imageUrl = '' }) => (
  <div className="gaps-board lyrics-player">
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
