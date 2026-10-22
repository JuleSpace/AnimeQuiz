import React, { useEffect, useState } from 'react';
import './ScoreCard.css';

const fr = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/** Score de fin de partie : gros chiffre qui défile, record éventuel, détail du calcul. */
const ScoreCard = ({ score, best = 0, unit = 'pts' }) => {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!score) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1100);
      setShown(Math.round(score.total * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  if (!score) return null;
  const record = score.total > best;
  return (
    <div className={`sc-card${record ? ' is-record' : ''}`}>
      <button type="button" className="sc-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="sc-label">Score</span>
        <b>{fr(shown)}<small>{unit}</small></b>
        {record ? <em className="sc-badge">Nouveau record !</em> : <em className="sc-best">Record : {fr(best)}</em>}
        <i aria-hidden="true">{open ? '−' : '+'}</i>
      </button>
      {open && (
        <ul className="sc-lines">
          {score.lines.map((l) => (
            <li key={l.label}><span>{l.label}{l.detail && <small>{l.detail}</small>}</span><b>+{fr(l.v)}</b></li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScoreCard;
