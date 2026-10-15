import React from 'react';

export const ACADEMY_HASH = '#academy';

const AcademyGuide = ({ onClose }) => (
  <div className="academy-page">
    <header className="academy-top">
      <div>
        <p className="academy-kicker">Page secrète</p>
        <h1 className="stage-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
          Guide Academy
        </h1>
      </div>
      <button type="button" className="btn btn-danger" onClick={onClose}>Retour</button>
    </header>
    <iframe
      className="academy-frame"
      title="Guide Cobblemon Academy 2.0"
      src="/guides/academy-2.0.html"
    />
  </div>
);

export default AcademyGuide;
