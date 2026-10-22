import React, { useEffect, useRef, useState } from 'react';
import BlindMusicPlayer from './BlindMusicPlayer';
import LyricsPlayer, { lyricHoleLengths } from './LyricsPlayer';
import GapsBoard from './GapsBoard';
import { WHOS_TEMPLATE_URL } from '../utils/media';
import { OrderAnswer, OrderReview, PlaceAnswer, PlaceBoard } from './InteractQuestion';
import { extractYouTubeId } from '../utils/media';
import { BoosterOpening, HostJokerBoard, JokerCard, PlayerJokerBar, TableDrop } from './JokerCards';
import Icon from './ArcadeIcon';
import QuizTable, { rankFor } from './QuizTable';
import { Avatar, avatarMap } from './SonicRoster';
import { Countdown } from './SiteFx';

const CHOICE_COLORS = ['#ff2347', '#1f6dff', '#f0a000', '#1fae55', '#8b5cf6', '#ff7a00'];
const CHOICE_SHAPES = ['▲', '◆', '●', '■', '★', '✚'];

const imageScaleOf = (size) => {
  const number = Number(size);
  if (!Number.isFinite(number)) return 1;
  return Math.max(0.5, Math.min(2, number / 100));
};

const QuestionMedia = ({ imageUrl, videoUrl, imageSize = 100 }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const youtubeId = extractYouTubeId(videoUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl && !videoUrl) return null;

  return (
    <div className="quiz-media" style={{ '--image-scale': imageScaleOf(imageSize) }}>
      {imageUrl && !imageFailed && (
        <img
          src={imageUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      )}
      {videoUrl && (
        youtubeId ? (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', marginTop: imageUrl ? 12 : 0, borderRadius: '12px', overflow: 'hidden' }}>
            <iframe
              title="Vidéo de la question"
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            style={{ width: '100%', maxWidth: '720px', maxHeight: '360px', borderRadius: '12px', margin: imageUrl ? '12px auto 0' : '0 auto', display: 'block' }}
          />
        )
      )}
    </div>
  );
};

const HintComposer = ({ request, onSend }) => {
  const [words, setWords] = useState('');

  return (
    <form
      className="quiz-hint-box"
      onSubmit={(event) => {
        event.preventDefault();
        const text = words.trim();
        if (!text) return;
        onSend(request.playerId, text);
        setWords('');
      }}
    >
      <div>
        <strong>{request.username}</strong> demande un indice{request.free ? ' gratuit' : ''}
      </div>
      <div className="quiz-hint-send">
        <input
          className="input"
          placeholder="Un ou plusieurs mots"
          value={words}
          onChange={(event) => setWords(event.target.value)}
        />
        <button type="submit" className="btn btn-success" disabled={!words.trim()}>
          <Icon name="go" />Envoyer
        </button>
      </div>
    </form>
  );
};

const TeamChat = ({ messages, onSend, accent }) => {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  return (
    <form
      className={`team-chat team-chat-${accent}`}
      onSubmit={(event) => {
        event.preventDefault();
        const next = text.trim();
        if (!next) return;
        onSend(next);
        setText('');
      }}
    >
      <div className="team-chat-log">
        {(messages || []).map((message) => (
          <div key={message.id} className="team-chat-line">
            <strong>{message.username}</strong>
            <span>{message.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="team-chat-compose">
        <input
          className="input"
          maxLength={200}
          value={text}
          placeholder="Parle avec ton équipe"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="btn">Envoyer</button>
      </div>
    </form>
  );
};

const ImageChoices = ({ options, correctIndexes, pickedIndex, onPick, readOnly = false, imageSize = 100 }) => (
  <div className="image-choice-grid" style={{ '--image-scale': imageScaleOf(imageSize) }}>
    {(options || []).map((url, index) => {
      const correct = (correctIndexes || []).includes(index);
      const picked = pickedIndex === index;
      return (
        <button
          key={`${url}-${index}`}
          type="button"
          className={`image-choice${correct ? ' is-correct' : ''}${picked ? ' is-picked' : ''}`}
          disabled={readOnly}
          onClick={() => onPick && onPick(index)}
        >
          <img src={url} alt={`Image ${index + 1}`} />
          <span>Image {index + 1}</span>
        </button>
      );
    })}
  </div>
);

const AnswerThumbs = ({ urls }) => {
  if (!urls || !urls.length) return null;
  return (
    <div className="answer-thumbs">
      {urls.map((url, index) => (
        <img key={`${url}-${index}`} src={url} alt="" className="answer-thumb" />
      ))}
    </div>
  );
};

const ClassicGame = ({
  gameData,
  lobby,
  player,
  onSubmitAnswer,
  onForceClose,
  onUpdateCorrections,
  onSubmitCorrection,
  onNext,
  onRequestHint,
  onSendHint,
  onPlayJoker,
  onTeamChat,
  onChooseTeam,
  onDismissCatchup,
  onBeginScoring,
  onStartQuestion
}) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [holes, setHoles] = useState(['']);
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hintAsked, setHintAsked] = useState(false);
  const [redoTick, setRedoTick] = useState(0);
  const [secondDraft, setSecondDraft] = useState(false);
  const hintAskedFor = useRef(null);
  const secondSent = useRef(false);
  const [countId, setCountId] = useState(0);
  const [fx, setFx] = useState(null);
  const prevPhase = useRef(null);
  const seatOrder = useRef([]);
  // Nouvelle catégorie : un bandeau l'annonce au début de la première question de la catégorie
  const prevCategory = useRef(null);
  const [catSplash, setCatSplash] = useState(null);
  useEffect(() => {
    const cat = gameData?.question?.category || null;
    const key = cat ? cat.name : '';
    if (gameData?.phase === 'answering' && key && key !== prevCategory.current) {
      setCatSplash({ ...cat, at: gameData.questionIndex });
      const timer = setTimeout(() => setCatSplash(null), 2600);
      prevCategory.current = key;
      return () => clearTimeout(timer);
    }
    if (gameData?.phase === 'answering') prevCategory.current = key;
    return undefined;
  }, [gameData?.questionIndex, gameData?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const question = gameData?.question;
  const phase = gameData?.phase || 'answering';

  // Compte à rebours une fois le booster pioché, au lancement de la question.
  useEffect(() => {
    if (prevPhase.current === 'booster' && phase === 'answering') setCountId(Date.now());
    prevPhase.current = phase;
  }, [phase, gameData?.questionIndex]);

  // Bonne ou mauvaise réponse : anneaux ramassés et rang, ou anneaux perdus.
  useEffect(() => {
    if (phase !== 'reveal' || !gameData?.reveal || !player) return undefined;
    if (gameData.hostId === player.id && !gameData.solo) return undefined;
    const reveal = gameData.reveal;
    const rows = (reveal.teams && reveal.teams.length) ? reveal.teams : (reveal.players || []);
    const mine = rows.find((row) => (row.memberIds ? row.memberIds.includes(player.id) : row.id === player.id));
    if (!mine) return undefined;
    const points = Number(mine.pointsThisRound) || 0;
    const max = gameData.suggestedPoints || gameData.question?.points || 1;
    const id = Date.now();
    setFx({ id, type: points > 0 ? 'good' : 'bad', points, rank: rankFor(points, max) });
    const timer = setTimeout(() => setFx((current) => (current && current.id === id ? null : current)), 2600);
    return () => clearTimeout(timer);
  }, [phase, gameData?.reveal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTextAnswer('');
    setHoles(['']);
    setSelected([]);
    setRedoTick(0);
    setSecondDraft(false);
    secondSent.current = false;
    setLocked(Boolean(gameData?.locked));
    if (gameData?.hintUsed) {
      hintAskedFor.current = gameData.questionIndex;
      setHintAsked(true);
      return;
    }
    if (hintAskedFor.current !== gameData?.questionIndex) {
      setHintAsked(false);
    }
  }, [gameData?.questionIndex]);

  useEffect(() => {
    if (!gameData?.hintUsed) return;
    hintAskedFor.current = gameData.questionIndex;
    setHintAsked(true);
  }, [gameData?.hintUsed, gameData?.questionIndex]);

  useEffect(() => {
    if (phase !== 'answering' || !gameData?.deadline) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [phase, gameData?.deadline, gameData?.questionIndex]);

  useEffect(() => {
    const joker = gameData?.myJoker;
    if (joker?.card === 'indice' && joker.used && joker.usedOn === gameData?.questionIndex) {
      hintAskedFor.current = gameData.questionIndex;
      setHintAsked(true);
    }
  }, [gameData?.myJoker, gameData?.questionIndex]);

  useEffect(() => {
    if (gameData?.myJoker?.card !== 'bouclier' || gameData.myJoker.note !== 'Silence annulé') return;
    setLocked(false);
    setTextAnswer('');
    setSelected([]);
  }, [gameData?.myJoker]);

  useEffect(() => {
    if (secondSent.current || phase !== 'answering' || !locked) return;
    const joker = gameData?.myJoker;
    const secondeOn = joker?.card === 'seconde'
      && joker.used
      && joker.usedOn === gameData?.questionIndex
      && !joker.redoSpent;
    if (!secondeOn) return;
    setTextAnswer('');
    setSelected([]);
    setRedoTick((value) => value + 1);
    setSecondDraft(true);
    setLocked(false);
  }, [gameData?.myJoker, gameData?.questionIndex, locked, phase]);

  if (!gameData || !player) {
    return <div className="loading">Chargement de la question</div>;
  }

  if (phase === 'booster') {
    const hostOpening = gameData.hostId === player.id;
    return (
      <div className="container">
        <div className="card booster-stage">
          <h2 style={{ textAlign: 'center' }}><Icon name="booster" tone="mark" />Booster</h2>
          <p style={{ textAlign: 'center', opacity: 0.85 }}>
            Question {(gameData.questionIndex || 0) + 1} / {gameData.totalQuestions}
            {gameData.booster ? ` · joker pour les questions ${gameData.booster.validFrom} à ${gameData.booster.validTo}` : ''}
          </p>
          {hostOpening ? (
            <>
              <HostJokerBoard players={gameData.jokerRoster || []} avatars={avatarMap(lobby)} />
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="btn btn-success" onClick={onStartQuestion}>
                  <Icon name="go" />Lancer la question
                </button>
              </div>
            </>
          ) : (
            <BoosterOpening cardId={gameData.myJoker?.card} />
          )}
        </div>
      </div>
    );
  }

  if (gameData.lateBooster && phase !== 'booster') {
    const pack = gameData.lateBooster;
    return (
      <div className="container">
        <div className="card booster-stage">
          <h2 style={{ textAlign: 'center' }}><Icon name="booster" tone="mark" />Booster</h2>
          <p style={{ textAlign: 'center', opacity: 0.85 }}>
            Tu rejoins à la question {(gameData.questionIndex || 0) + 1} / {gameData.totalQuestions}
            {pack.validFrom ? ` · joker pour les questions ${pack.validFrom} à ${pack.validTo}` : ''}
          </p>
          {pack.sittingOut && (
            <p style={{ textAlign: 'center' }}>
              Cette question est déjà close. Tu joues à partir de la suivante.
            </p>
          )}
          <BoosterOpening cardId={pack.card || gameData.myJoker?.card} />
          <div style={{ textAlign: 'center' }}>
            <button type="button" className="btn btn-success" onClick={onDismissCatchup}>
              <Icon name="go" />Rejoindre la partie
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return <div className="loading">Chargement de la question</div>;
  }

  const isHost = gameData.hostId === player.id;
  const solo = Boolean(gameData.solo);
  const corrections = gameData.corrections || {};
  const reveal = gameData.reveal;
  const players = gameData.players || [];
  const remaining = gameData.deadline ? Math.max(0, Math.ceil((gameData.deadline - now) / 1000)) : null;
  const me = players.find((entry) => entry.id === player.id);
  const teamMode = Boolean(gameData.teamMode);
  const myTeam = me?.team === 'shadow' || me?.team === 'sonic' ? me.team : null;
  const iAmCaptain = !teamMode || Boolean(me?.captain);
  const scoreRows = teamMode && (gameData.teams || []).length ? gameData.teams : players;
  const progressLabel = teamMode ? 'équipes ont répondu' : 'ont répondu';
  const ratio = question.timeLimit && gameData.deadline
    ? Math.max(0, Math.min(1, (gameData.deadline - now) / (question.timeLimit * 1000)))
    : 0;

  const send = (answer) => {
    if (gameData.silenced || locked || phase !== 'answering') return;
    const joker = gameData.myJoker;
    const secondeOn = joker?.card === 'seconde'
      && joker.used
      && joker.usedOn === gameData.questionIndex
      && !joker.redoSpent;
    onSubmitAnswer(answer);
    if (secondDraft || !secondeOn) {
      secondSent.current = Boolean(secondDraft);
      setSecondDraft(false);
      setLocked(true);
      return;
    }
    setTextAnswer('');
    setSelected([]);
    setRedoTick((value) => value + 1);
    setSecondDraft(true);
  };

  const myJoker = gameData.myJoker;
  const canRedo = phase === 'answering'
    && !gameData.silenced
    && locked
    && myJoker?.card === 'seconde'
    && myJoker.used
    && myJoker.usedOn === gameData.questionIndex
    && !myJoker.redoSpent;

  const renderAnswering = () => {
    if (gameData.silenced) {
      return (
        <div className="quiz-wait">
          <div className="quiz-wait-title">Tu es réduit au silence</div>
          <div className="quiz-wait-sub">Ta réponse ne comptera pas sur cette question.</div>
        </div>
      );
    }

    if (locked) {
      return (
        <div className="quiz-wait">
          <div className="quiz-wait-title">
            {gameData.myJoker?.redoSpent ? 'Deux réponses envoyées' : 'Réponse envoyée'}
          </div>
          <div className="quiz-wait-sub">
            {gameData.answered || 0}/{gameData.totalPlayers || players.length} {progressLabel}
          </div>
        </div>
      );
    }

    if (teamMode && !myTeam) {
      return (
        <div className="quiz-wait">
          <div className="quiz-wait-title">Choisis ton équipe</div>
          <div className="quiz-wait-sub">Ensuite tu suis la question avec les autres.</div>
        </div>
      );
    }

    if (teamMode && !iAmCaptain) {
      return (
        <div className="quiz-wait">
          <div className="quiz-wait-title">
            {me?.captainName || 'Le chef d\'équipe'} envoie la réponse
          </div>
          <div className="quiz-wait-sub">Échangez dans le chat, une seule réponse part pour l'équipe.</div>
        </div>
      );
    }

    if (question.type === 'imageqcm') {
      return (
        <ImageChoices
          options={question.options}
          imageSize={question.imageSize}
          onPick={(index) => send(index)}
        />
      );
    }

    const musicChoices = (question.type === 'music' || question.type === 'lyrics' || question.type === 'whos') && (question.options || []).length > 0;
    if (question.type === 'qcm' || musicChoices) {
      return (
        <div className="choice-grid">
          {question.options.map((option, index) => {
            const isSelected = selected.includes(index);
            return (
              <button
                key={option + index}
                type="button"
                className={`choice-btn${isSelected ? ' is-picked' : ''}`}
                style={{ '--choice': CHOICE_COLORS[index % CHOICE_COLORS.length] }}
                onClick={() => {
                  if (question.multiple) {
                    setSelected((current) => (
                      current.includes(index)
                        ? current.filter((value) => value !== index)
                        : [...current, index]
                    ));
                    return;
                  }
                  send(index);
                }}
              >
                <span className="choice-shape">{CHOICE_SHAPES[index % CHOICE_SHAPES.length]}</span>
                {option}
              </button>
            );
          })}
          {question.multiple && (
            <button
              type="button"
              className="btn btn-success"
              style={{ flex: '1 1 100%', maxWidth: '520px' }}
              disabled={selected.length === 0}
              onClick={() => send([...selected].sort((a, b) => a - b))}
            >
              <Icon name="check" />Valider la sélection
            </button>
          )}
        </div>
      );
    }

    if (question.type === 'order') {
      return (
        <OrderAnswer
          key={`${gameData.questionIndex}-${redoTick}`}
          items={question.items || []}
          onSubmit={(ids) => send({ ids })}
        />
      );
    }

    if (question.type === 'layout') {
      return (
        <PlaceAnswer
          key={`${gameData.questionIndex}-${redoTick}`}
          items={question.items || []}
          mode={question.layoutMode === 'schema' ? 'schema' : 'timeline'}
          imageUrl={question.layoutImageUrl || ''}
          onSubmit={(places) => send({ places })}
          timelineStart={question.timelineStart || ''}
          timelineEnd={question.timelineEnd || ''}
        />
      );
    }

    if ((question.type === 'lyrics' || question.type === 'gaps') && (question.blankCount || 0) > 1) {
      const count = question.blankCount;
      const lengths = lyricHoleLengths(question.clip?.line);
      const ready = holes.length === count && holes.every((value) => String(value).trim());
      return (
        <div className={`answer-input${count > 3 ? ' has-many-holes' : ''}`}>
          <div className="holes-grid">
          {Array.from({ length: count }, (_, index) => {
            const length = lengths[index] || 0;
            const value = holes[index] || '';
            return (
              <div key={index} className="lyrics-blank">
                {count > 1 && <b className="hole-no">{index + 1}</b>}
                <input
                  type="text"
                  className="input"
                  placeholder={length ? `${length} caractères` : `Trou ${index + 1}`}
                  maxLength={length || undefined}
                  value={value}
                  onChange={(event) => setHoles((current) => {
                    const next = [...current];
                    next[index] = length ? event.target.value.slice(0, length) : event.target.value;
                    return next;
                  })}
                />
                {length > 0 && <span className="lyrics-count">{value.length}/{length}</span>}
              </div>
            );
          })}
          </div>
          <button
            type="button"
            className="btn btn-success"
            disabled={!ready}
            onClick={() => send(holes.map((value) => value.trim()))}
          >
            <Icon name="go" />Envoyer
          </button>
        </div>
      );
    }

    if (question.type === 'boolean') {
      return (
        <div className="choice-grid">
          <button type="button" className="choice-btn choice-true" onClick={() => send(true)}>
            Vrai
          </button>
          <button type="button" className="choice-btn choice-false" onClick={() => send(false)}>
            Faux
          </button>
        </div>
      );
    }

    const lyricLength = (question.type === 'lyrics' || question.type === 'gaps')
      ? (lyricHoleLengths(question.clip?.line)[0] || 0)
      : 0;
    const freeField = (
      <input
        type="text"
        className="input"
        placeholder={question.type === 'music' ? 'Titre, artiste, anime...' : (lyricLength ? `${lyricLength} caractères` : 'Ta réponse')}
        maxLength={lyricLength || undefined}
        value={textAnswer}
        onChange={(event) => setTextAnswer(lyricLength ? event.target.value.slice(0, lyricLength) : event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && textAnswer.trim()) send(textAnswer.trim());
        }}
      />
    );
    return (
      <div className="answer-input">
        {lyricLength > 0 ? (
          <div className="lyrics-blank">
            {freeField}
            <span className="lyrics-count">{textAnswer.length}/{lyricLength}</span>
          </div>
        ) : freeField}
        <button
          type="button"
          className="btn btn-success"
          disabled={!textAnswer.trim()}
          onClick={() => send(textAnswer.trim())}
        >
          <Icon name="go" />Envoyer
        </button>
      </div>
    );
  };

  const requestHint = () => {
    if (hintAsked || phase !== 'answering' || isHost) return;
    hintAskedFor.current = gameData.questionIndex;
    setHintAsked(true);
    onRequestHint();
  };

  const hints = gameData.hints || [];
  const hintRequests = gameData.hintRequests || [];

  const solutionCatalog = (gameData.solutionItems && gameData.solutionItems.length)
    ? gameData.solutionItems
    : ((gameData.reveal && gameData.reveal.solutionItems) || question.items || []);

  const renderPlacement = (answer, expected = false) => {
    if (question.type !== 'order' && question.type !== 'layout') return null;
    const heading = expected ? (question.type === 'layout' ? 'Emplacement prévu' : 'Ordre prévu') : '';
    if (question.type === 'order') {
      return (
        <OrderReview
          title={heading}
          items={solutionCatalog}
          ids={expected ? undefined : (answer?.ids || [])}
        />
      );
    }
    const places = expected
      ? solutionCatalog.map((item) => ({ id: item.id, x: item.x, y: item.y }))
      : (answer?.places || []);
    return (
      <div className="order-review">
        {heading && <div className="order-review-title">{heading}</div>}
        <PlaceBoard
          mode={(gameData.layoutMode || question.layoutMode) === 'schema' ? 'schema' : 'timeline'}
          imageUrl={gameData.layoutImageUrl || question.layoutImageUrl || ''}
          items={solutionCatalog}
          places={places}
          timelineStart={gameData.timelineStart || question.timelineStart || ''}
          timelineEnd={gameData.timelineEnd || question.timelineEnd || ''}
          readOnly
        />
      </div>
    );
  };

  const renderAnswer = (entry) => {
    const paired = Boolean(entry.firstAnswerText);
    return (
      <>
        {paired ? (
          <>
            <div style={{ opacity: 0.85 }}>1re : {entry.firstAnswerText}</div>
            <AnswerThumbs urls={entry.firstAnswerImages} />
            {renderPlacement(entry.firstAnswer)}
            <div style={{ opacity: 0.85 }}>2e : {entry.answerText}</div>
            <AnswerThumbs urls={entry.answerImages} />
            {renderPlacement(entry.answer)}
          </>
        ) : (
          <>
            <div style={{ opacity: 0.85 }}>{entry.answerText}</div>
            <AnswerThumbs urls={entry.answerImages} />
            {renderPlacement(entry.answer)}
          </>
        )}
      </>
    );
  };

  const avatars = avatarMap(lobby);
  [...(lobby?.players || []), ...players].forEach((entry) => {
    if (entry?.username && !seatOrder.current.includes(entry.username)) seatOrder.current.push(entry.username);
  });
  const judge = { name: gameData.hostName || lobby?.hostName || 'Juge', avatar: lobby?.hostAvatar || null };
  const suggested = gameData.suggestedPoints || question.points || 1;
  const answeredIds = gameData.answeredIds || [];
  const showTable = phase === 'hold' || phase === 'correction' || phase === 'reveal'
    || (phase === 'answering' && isHost && !solo);
  const detailed = question.type === 'order' || question.type === 'layout';
  const canSeeAnswers = phase === 'correction' || phase === 'reveal'
    || (phase === 'hold' && (isHost || gameData.answersVisible));

  const rowsForPhase = () => {
    if (phase === 'reveal' && reveal) {
      return (reveal.teams && reveal.teams.length) ? reveal.teams : (reveal.players || []);
    }
    if (phase === 'answering') {
      return teamMode && (gameData.teams || []).length ? gameData.teams : players;
    }
    return scoreRows;
  };
  const teamOf = (entry) => (teamMode ? (entry.team || entry.id) : null);
  const seatRank = (entry) => {
    if (teamMode) return teamOf(entry) === 'shadow' ? 0 : 1;
    const at = seatOrder.current.indexOf(entry.username);
    return at < 0 ? 999 : at;
  };
  const scoreOf = (entry) => {
    if (typeof entry.score === 'number') return entry.score;
    const known = players.find((item) => item.username === entry.username);
    return known ? known.score : 0;
  };

  const setScore = (key, value) => {
    onUpdateCorrections({
      ...corrections,
      [key]: Math.max(0, Math.min(99, Math.round(Number(value) || 0)))
    });
  };

  const correctionControls = (entry) => {
    const paired = Boolean(entry.firstAnswerText) && !teamMode;
    const pads = paired
      ? [{ key: `${entry.id}::1`, label: '1re' }, { key: `${entry.id}::2`, label: '2e' }]
      : [{ key: entry.id, label: '' }];
    return pads.map((pad) => {
      const given = Number(corrections[pad.key]) || 0;
      return (
        <div key={pad.key} className={`qt-pad${given > 0 ? ' is-on' : ''}`}>
          {pad.label ? <span className="qt-pad-label">{pad.label}</span> : null}
          <button
            type="button"
            className="qt-pad-ok"
            onClick={() => setScore(pad.key, given > 0 ? 0 : suggested)}
            title={given > 0 ? 'Retirer les points' : `Bonne réponse : ${suggested} pt`}
          >
            <Icon name={given > 0 ? 'check' : 'star'} bare />
            {given > 0 ? 'Validé' : `Valider ${suggested}`}
          </button>
          <button type="button" className="qt-pad-step" onClick={() => setScore(pad.key, given - 1)} aria-label="Retirer un point">−</button>
          <span className="qt-pad-value">{given}</span>
          <button type="button" className="qt-pad-step" onClick={() => setScore(pad.key, given + 1)} aria-label="Ajouter un point">+</button>
        </div>
      );
    });
  };

  const seats = showTable ? [...rowsForPhase()]
    .sort((a, b) => seatRank(a) - seatRank(b))
    .map((entry) => {
      const team = teamOf(entry);
      const hasText = entry.answerText !== undefined && entry.answerText !== null;
      const answeredNow = phase === 'answering' ? answeredIds.includes(team || entry.id) : true;
      const paired = Boolean(entry.firstAnswerText);
      const teammates = (entry.members || []).filter((name) => name !== entry.captainName);
      const isMe = entry.memberIds ? entry.memberIds.includes(player.id) : entry.id === player.id;
      const points = phase === 'reveal' ? (Number(entry.pointsThisRound) || 0) : null;
      const tags = isHost && phase === 'correction'
        ? (gameData.gainPreview || [])
          .filter((row) => (team ? row.team === team : row.id === entry.id) && (row.tags || []).length > 0)
          .map((row) => `${row.username || ''} ${(row.tags || []).join(' · ')} → ${row.gain || 0}`)
        : [];
      const notes = [
        entry.captainName ? `chef ${entry.captainName}` : '',
        teammates.length ? teammates.join(', ') : '',
        ...tags,
        phase === 'reveal' && (entry.memberGains || []).length
          ? entry.memberGains.map((gain) => `${gain.username} +${gain.points}`).join(' · ')
          : '',
        phase === 'reveal' && isMe && (gameData.roundNotes || []).length ? gameData.roundNotes.join(' ') : ''
      ].filter(Boolean);
      return {
        key: team || entry.username || entry.id,
        name: entry.username,
        avatar: team || avatars[entry.username] || entry.avatar,
        score: scoreOf(entry),
        isMe,
        status: answeredNow ? 'answered' : 'waiting',
        waitLabel: phase === 'answering' ? 'Réfléchit…' : '…',
        face: canSeeAnswers && hasText,
        lines: paired
          ? [
            { label: '1re', text: entry.firstAnswerText, thumbs: entry.firstAnswerImages },
            { label: '2e', text: entry.answerText, thumbs: entry.answerImages }
          ]
          : [{ text: entry.answerText, thumbs: entry.answerImages }],
        points,
        verdict: points === null ? null : (points > 0 ? 'good' : 'bad'),
        note: notes.join(' · '),
        controls: isHost && phase === 'correction' ? correctionControls(entry) : null
      };
    }) : [];

  const expectedText = phase === 'reveal'
    ? (reveal?.correctAnswer || gameData.expectedAnswer)
    : (gameData.expectedAnswer || (isHost ? gameData.hostAnswer : ''));
  const showExpected = Boolean(expectedText) && (isHost || phase === 'correction' || phase === 'reveal');
  const lastQuestion = gameData.questionIndex + 1 >= gameData.totalQuestions;

  const phaseLabel = {
    answering: 'Question en cours',
    hold: 'Réponses closes',
    correction: isHost ? 'Distribue les points' : 'Le juge corrige',
    reveal: 'Révélation'
  }[phase] || '';

  const tableCenter = (
    <div className="qt-center-inner">
      <span className="qt-phase">{phaseLabel}</span>
      {phase === 'answering' && (
        <div className="qt-count">
          <b>{gameData.answered || 0}</b>/{gameData.totalPlayers || seats.length}
          <small>{progressLabel}</small>
        </div>
      )}
      {showExpected && (
        <div className="qt-expected">
          <small>Réponse prévue</small>
          <strong className="quiz-answer">{expectedText}</strong>
        </div>
      )}
      {phase === 'hold' && !isHost && (
        <p className="qt-hint">
          {gameData.answersVisible
            ? 'Tu as Vol : les réponses sont là, la bonne reste cachée.'
            : 'La bonne réponse reste cachée, le juge prépare la correction.'}
        </p>
      )}
      {phase === 'hold' && isHost && (
        <p className="qt-hint">
          {solo
            ? 'À toi de te noter avec la réponse prévue.'
            : 'Les joueurs ne voient rien encore. Celui qui a Vol voit les réponses des autres.'}
        </p>
      )}
      {phase === 'correction' && isHost && (
        <p className="qt-hint">Rien n'est validé tout seul. Une bonne réponse vaut {suggested} pt.</p>
      )}
      {phase === 'correction' && !isHost && (
        <p className="qt-hint">Les points ne sont pas encore validés.</p>
      )}
      {isHost && phase === 'answering' && (
        <button type="button" className="btn" onClick={onForceClose}>
          <Icon name="lock" />Clore les réponses
        </button>
      )}
      {isHost && phase === 'hold' && (
        <button type="button" className="btn btn-success" onClick={onBeginScoring}>
          <Icon name="coin" />Distribuer les points
        </button>
      )}
      {isHost && phase === 'correction' && (
        <button type="button" className="btn btn-success" onClick={() => onSubmitCorrection(corrections)}>
          <Icon name="check" />Valider les points
        </button>
      )}
      {phase === 'reveal' && (isHost ? (
        <button type="button" className="btn btn-success" onClick={onNext}>
          {lastQuestion ? <><Icon name="trophy" />Voir les résultats</> : <><Icon name="go" />Question suivante</>}
        </button>
      ) : (
        <p className="qt-hint qt-wait-judge"><Icon name="clock" bare /> En attente du juge</p>
      ))}
    </div>
  );

  const solutionExtras = (isHost && phase !== 'answering') || phase === 'correction' || phase === 'reveal';

  return (
    <div className="container">
      {gameData.tableShow && (
        <TableDrop cardId={gameData.tableShow.card} username={gameData.tableShow.username} />
      )}
      <Countdown runId={countId} />
      {catSplash && (
        <div className="quiz-cat-splash" key={catSplash.at} style={{ '--c': catSplash.color }} aria-live="polite">
          <small>Catégorie</small>
          <b>{catSplash.name}</b>
        </div>
      )}
      <div className="card quiz-card">
        <div className="quiz-stage">
        <div className="quiz-head">
          <div className="question-number">
            {gameData.quizName ? `${gameData.quizName} · ` : ''}
            Question {gameData.questionIndex + 1} / {gameData.totalQuestions}
            {question.category && <span className="quiz-category" style={{ '--c': question.category.color }}>{question.category.name}</span>}
          </div>
          <div className="quiz-head-meta">
            <span className="quiz-points">{question.points} pt{question.points > 1 ? 's' : ''}</span>
            {judge.name && (
              <span className="quiz-judge">
                <Avatar id={judge.avatar} fallbackName={judge.name} size={26} />
                Juge {judge.name}
              </span>
            )}
          </div>
        </div>

        {!showTable && (
          <div className="ce-strip">
            {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((entry, index) => {
              const done = phase === 'answering' && answeredIds.includes(teamMode ? entry.team : entry.id);
              return (
                <span
                  key={entry.id}
                  className={['ce-chip', entry.id === player.id ? 'is-me' : '', done ? 'is-done' : ''].filter(Boolean).join(' ')}
                >
                  <span className="ce-chip-rank">{index + 1}</span>
                  <Avatar id={avatars[entry.username] || entry.avatar} fallbackName={entry.username} size={30} />
                  <span className="ce-chip-name">{entry.username}</span>
                  <b>{entry.score || 0}</b>
                </span>
              );
            })}
          </div>
        )}

        {teamMode && !isHost && !myTeam && (
          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <div style={{ marginBottom: 10 }}>Choisis Team Shadow ou Team Sonic.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-danger btn-team-shadow" onClick={() => onChooseTeam && onChooseTeam('shadow')}>
                Team Shadow
              </button>
              <button type="button" className="btn" onClick={() => onChooseTeam && onChooseTeam('sonic')}>
                Team Sonic
              </button>
            </div>
          </div>
        )}

        {phase === 'answering' && question.timeLimit > 0 && (
          <div className="quiz-timer">
            <div className="quiz-timer-num">{remaining}s</div>
            <div className={`timer-bar${ratio < 0.25 ? ' is-low' : ''}`}>
              <div style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        )}

        {question.prompt && (
          <h2 className="quiz-prompt">
            {question.prompt}
          </h2>
        )}

        {question.type === 'music' ? (
          <BlindMusicPlayer
            key={`${question.musicUrl}-${phase}`}
            url={question.musicUrl}
            revealed={phase === 'reveal' || (isHost && phase !== 'answering')}
          />
        ) : question.type === 'lyrics' ? (
          <LyricsPlayer
            key={`${question.musicUrl}-${phase}`}
            url={question.musicUrl}
            clip={question.clip}
            filled={phase === 'correction' || phase === 'reveal'
              ? (gameData.expectedAnswer || gameData.reveal?.correctAnswer || '')
              : ''}
          />
        ) : question.type === 'gaps' ? (
          <GapsBoard
            key={`gaps-${question.index}-${phase}`}
            line={question.clip?.line || ''}
            imageUrl={question.imageUrl || ''}
            filled={phase === 'correction' || phase === 'reveal'
              ? (gameData.expectedAnswer || gameData.reveal?.correctAnswer || '')
              : ''}
          />
        ) : question.type === 'whos' ? (
          <LyricsPlayer
            key={`${question.imageUrl || 'whos'}`}
            url={question.musicUrl || WHOS_TEMPLATE_URL}
            clip={question.clip || { endAt: 6, line: '', masks: [] }}
            portrait={question.imageUrl}
          />
        ) : (
          <QuestionMedia imageUrl={question.imageUrl} videoUrl={question.videoUrl} imageSize={question.imageSize} />
        )}
        {question.type === 'music' && question.imageUrl && (
          <QuestionMedia imageUrl={question.imageUrl} videoUrl="" imageSize={question.imageSize} />
        )}

        {showTable && (
          <QuizTable seats={seats} judge={judge} center={tableCenter} fx={fx} phase={phase} />
        )}

        {phase === 'answering' && isHost && !solo && (gameData.hostSolution || hintRequests.length > 0) && (
          <div className="quiz-host-panel">
            {gameData.hostSolution?.type === 'order' && (
              <OrderReview title="Ordre prévu" items={gameData.hostSolution.items || []} />
            )}
            {gameData.hostSolution?.type === 'layout' && (
              <PlaceBoard
                mode={gameData.hostSolution.layoutMode === 'schema' ? 'schema' : 'timeline'}
                imageUrl={gameData.hostSolution.layoutImageUrl || ''}
                items={gameData.hostSolution.items || []}
                timelineStart={gameData.hostSolution.timelineStart || ''}
                timelineEnd={gameData.hostSolution.timelineEnd || ''}
                places={(gameData.hostSolution.items || []).map((item) => ({ id: item.id, x: item.x, y: item.y }))}
                readOnly
              />
            )}
            {gameData.hostSolution?.type === 'imageqcm' && (
              <ImageChoices
                options={gameData.hostSolution.options}
                correctIndexes={gameData.hostSolution.correctIndexes}
                imageSize={question.imageSize}
                readOnly
              />
            )}
            {hintRequests.length > 0 && (
              <div className="quiz-host-hints">
                <div className="quiz-host-title"><Icon name="search" bare /> Indices demandés</div>
                {hintRequests.map((request) => (
                  <HintComposer key={request.id} request={request} onSend={onSendHint} />
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'answering' && (!isHost || solo) && (
          <>
            {gameData.copiedAnswer && gameData.copiedAnswer.questionIndex === gameData.questionIndex && !gameData.silenced && (
              <div className="copied-banner">
                Réponse de {gameData.copiedAnswer.username} : {gameData.copiedAnswer.text}
              </div>
            )}
            {gameData.rumors && gameData.rumors.questionIndex === gameData.questionIndex && (gameData.rumors.texts || []).length > 0 && (
              <div className="copied-banner">
                Rumeur : {gameData.rumors.texts.join(' · ')}
              </div>
            )}
            {secondDraft && (
              <div className="quiz-flag">
                Première réponse gardée. Entre la deuxième.
              </div>
            )}
            {renderAnswering()}
            {teamMode && myTeam && (
              <TeamChat
                accent={myTeam}
                messages={gameData.teamChat || []}
                onSend={onTeamChat}
              />
            )}
            {hints.length > 0 && (
              <div className="quiz-hint-list">
                {hints.map((words, index) => (
                  <div key={`${words}-${index}`} className="quiz-hint">{words}</div>
                ))}
              </div>
            )}
            <div className="quiz-progress-line">
              {gameData.answered || 0}/{gameData.totalPlayers || players.length} {progressLabel}
            </div>
          </>
        )}

        {showTable && solutionExtras && (
          <div className="qt-extras">
            {renderPlacement(null, true)}
            {question.type === 'imageqcm' && phase !== 'reveal' && (
              <ImageChoices
                options={question.options}
                correctIndexes={gameData.correctIndexes}
                imageSize={question.imageSize}
                readOnly
              />
            )}
            <QuestionMedia imageUrl={gameData.answerImageUrl} videoUrl={gameData.answerVideoUrl} imageSize={question.imageSize} />
          </div>
        )}

        {phase === 'reveal' && reveal && question.type === 'boolean' && (
          <div className="choice-grid is-reveal">
            <div className={`choice-btn choice-true${reveal.correctBoolean ? ' is-right' : ' is-off'}`}>Vrai</div>
            <div className={`choice-btn choice-false${reveal.correctBoolean === false ? ' is-right' : ' is-off'}`}>Faux</div>
          </div>
        )}

        {phase === 'reveal' && reveal && (question.type === 'qcm' || ((question.type === 'music' || question.type === 'lyrics' || question.type === 'whos') && (question.options || []).length > 0)) && (
          <div className="choice-grid is-reveal">
            {(question.options || []).map((option, index) => {
              const isCorrect = (reveal.correctIndexes || []).includes(index);
              return (
                <div
                  key={option + index}
                  className={`choice-btn${isCorrect ? ' is-right' : ' is-off'}`}
                  style={{ '--choice': CHOICE_COLORS[index % CHOICE_COLORS.length] }}
                >
                  <span className="choice-shape">{CHOICE_SHAPES[index % CHOICE_SHAPES.length]}</span>
                  {option}
                </div>
              );
            })}
          </div>
        )}

        {phase === 'reveal' && reveal && question.type === 'imageqcm' && (
          <ImageChoices
            options={question.options}
            correctIndexes={reveal.correctIndexes}
            imageSize={question.imageSize}
            readOnly
          />
        )}

        {showTable && detailed && canSeeAnswers && (
          <div className="qt-details">
            <div className="qt-details-title">Détail des réponses</div>
            {seats.map((seat) => {
              const entry = rowsForPhase().find((row) => (teamOf(row) || row.username || row.id) === seat.key);
              if (!entry) return null;
              return (
                <div key={seat.key} className="quiz-score-row">
                  <div className="quiz-answer">
                    <strong>{entry.username}</strong>
                    {renderAnswer(entry)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {phase === 'reveal' && !reveal && isHost && (
          <button type="button" className="btn btn-success" onClick={onNext}>
            <Icon name="go" />Question suivante
          </button>
        )}

        {isHost && gameData.jokersEnabled !== false && !teamMode && (
          <HostJokerBoard players={gameData.jokerRoster || []} avatars={avatars} />
        )}

        {!isHost && (
          <div className="player-dock">
            {gameData.jokersEnabled !== false && !teamMode && (
              <PlayerJokerBar
                joker={myJoker}
                phase={phase}
                questionIndex={gameData.questionIndex}
                locked={locked}
                players={players}
                selfId={player.id}
                silenced={Boolean(gameData.silenced)}
                canRedo={canRedo}
                onPlay={onPlayJoker}
                onRedo={() => {
                  setTextAnswer('');
                  setSelected([]);
                  setRedoTick((value) => value + 1);
                  setSecondDraft(true);
                  setLocked(false);
                }}
              />
            )}
            {phase === 'answering' && !locked && !gameData.silenced && (!teamMode || myTeam) && (
              <button type="button" className="hint-chip" onClick={requestHint} disabled={hintAsked}>
                <Icon name="search" bare /> {hintAsked ? 'Indice demandé' : 'Indice −1'}
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ClassicGame;
