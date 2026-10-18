import React from 'react';
import { Avatar } from './SonicRoster';

// La table de jeu : le juge en haut, chaque joueur à sa place (toujours la même d'une question à l'autre),
// sa carte réponse posée devant lui. Les cartes se retournent à la révélation.

const COLLECT = [-34, -14, 6, 26, 46];
const SCATTER = [[-120, -60], [-80, -96], [-30, -110], [30, -110], [80, -96], [120, -60], [-140, -10], [140, -10]];

export const rankFor = (points, max) => {
  if (!(points > 0)) return 'E';
  const ratio = points / Math.max(1, max || 1);
  if (ratio >= 1) return 'A';
  if (ratio >= 0.66) return 'B';
  if (ratio >= 0.33) return 'C';
  return 'D';
};

const seatPosition = (index, count) => {
  // Le juge occupe le haut (-90°) ; les joueurs se répartissent sur le reste du tour, dans le sens horaire.
  const step = 360 / (count + 1);
  const angle = ((-90 + step * (index + 1)) * Math.PI) / 180;
  return {
    top: Math.sin(angle) < -0.2,
    style: {
      '--sx': `${50 + 41 * Math.cos(angle)}%`,
      '--sy': `${50 + 38 * Math.sin(angle)}%`
    }
  };
};

const AnswerFace = ({ lines }) => (
  <div className="qt-face">
    {lines.map((line, index) => (
      <div key={index} className="qt-line">
        {line.label ? <span className="qt-line-label">{line.label}</span> : null}
        <span className="qt-line-text" title={line.text || ''}>{line.text || '—'}</span>
        {(line.thumbs || []).length > 0 && (
          <span className="qt-thumbs">
            {line.thumbs.slice(0, 4).map((url, thumb) => <img key={`${url}-${thumb}`} src={url} alt="" />)}
          </span>
        )}
      </div>
    ))}
  </div>
);

const Seat = ({ seat, index, count, fx }) => {
  const mineFx = fx && seat.isMe ? fx : null;
  const place = seatPosition(index, count);
  const cardState = seat.face ? 'is-face' : seat.status === 'answered' ? 'is-back' : seat.status === 'silenced' ? 'is-silenced' : 'is-empty';
  return (
    <div
      className={[
        'qt-seat',
        place.top ? 'is-top' : '',
        seat.isMe ? 'is-me' : '',
        seat.verdict ? `is-${seat.verdict}` : '',
        mineFx ? `fx-${mineFx.type}` : ''
      ].filter(Boolean).join(' ')}
      style={{ ...place.style, '--i': index }}
    >
      <div className="qt-who">
        <Avatar id={seat.avatar} fallbackName={seat.name} size={52} />
        <div className="qt-who-text">
          <span className="qt-name">{seat.name}</span>
          <span className="qt-score">{seat.score || 0} pt{(seat.score || 0) > 1 ? 's' : ''}</span>
        </div>
        {typeof seat.points === 'number' && (
          <span className={`qt-gain${seat.points > 0 ? ' is-up' : ''}`}>+{seat.points}</span>
        )}
      </div>
      <div className={`qt-card ${cardState}`} key={seat.face ? 'face' : 'back'}>
        {seat.face ? (
          <AnswerFace lines={seat.lines || []} />
        ) : seat.status === 'answered' ? (
          <div className="qt-back"><span>Répondu</span></div>
        ) : seat.status === 'silenced' ? (
          <div className="qt-wait">Silence</div>
        ) : (
          <div className="qt-wait">{seat.waitLabel || '…'}</div>
        )}
        {seat.note ? <div className="qt-note">{seat.note}</div> : null}
      </div>
      {seat.controls ? <div className="qt-controls">{seat.controls}</div> : null}
      {mineFx?.type === 'good' && (
        <>
          {COLLECT.map((x, ring) => (
            <i key={ring} className="qt-ring is-collect" style={{ '--x': `${x}px`, '--d': `${ring * 0.08}s` }} aria-hidden="true" />
          ))}
          <span className="qt-plus" key={`plus-${mineFx.id}`}>+{mineFx.points}</span>
        </>
      )}
      {mineFx?.type === 'bad' && SCATTER.map(([x, y], ring) => (
        <i key={ring} className="qt-ring is-lost" style={{ '--x': `${x}px`, '--y': `${y}px` }} aria-hidden="true" />
      ))}
    </div>
  );
};

const QuizTable = ({ seats, judge, center, fx, phase }) => {
  const count = seats.length;
  const size = count > 12 ? 'is-dense' : count > 8 ? 'is-large' : count > 4 ? 'is-medium' : 'is-small';
  return (
    <div className={`qt ${size} qt-phase-${phase}`}>
      <div className="qt-felt" aria-hidden="true" />
      {judge && (
        <div className="qt-seat qt-judge" style={{ '--sx': '50%', '--sy': '9%' }}>
          <div className="qt-who">
            <Avatar id={judge.avatar} fallbackName={judge.name} size={60} />
            <div className="qt-who-text">
              <span className="qt-name">{judge.name || 'Juge'}</span>
              <span className="qt-score qt-judge-tag">Juge</span>
            </div>
          </div>
        </div>
      )}
      <div className="qt-center">{center}</div>
      {seats.map((seat, index) => (
        <Seat key={seat.key} seat={seat} index={index} count={count} fx={fx} />
      ))}
      {fx?.type === 'good' && (
        <span key={`rank-${fx.id}`} className={`qt-rank rank-${fx.rank}`} aria-hidden="true">{fx.rank}</span>
      )}
    </div>
  );
};

export default QuizTable;
