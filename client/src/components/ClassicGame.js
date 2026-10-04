import React, { useEffect, useRef, useState } from 'react';
import BlindMusicPlayer from './BlindMusicPlayer';
import { OrderAnswer, OrderReview, PlaceAnswer, PlaceBoard } from './InteractQuestion';
import { extractYouTubeId } from '../utils/media';
import { BoosterOpening, HostJokerBoard, JokerCard, PlayerJokerBar } from './JokerCards';
import Icon from './ArcadeIcon';

const CHOICE_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#8e44ad', '#e67e22'];
const CHOICE_SHAPES = ['▲', '◆', '●', '■', '★', '✚'];

const QuestionMedia = ({ imageUrl, videoUrl }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const youtubeId = extractYouTubeId(videoUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl && !videoUrl) return null;

  return (
    <div className="quiz-media">
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

const ClassicGame = ({
  gameData,
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
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hintAsked, setHintAsked] = useState(false);
  const [redoTick, setRedoTick] = useState(0);
  const hintAskedFor = useRef(null);

  const question = gameData?.question;
  const phase = gameData?.phase || 'answering';

  useEffect(() => {
    setTextAnswer('');
    setSelected([]);
    setRedoTick(0);
    setLocked(Boolean(gameData?.locked));
    if (gameData?.hintUsed) {
      hintAskedFor.current = gameData.questionIndex;
      setHintAsked(true);
      return;
    }
    if (hintAskedFor.current !== gameData?.questionIndex) {
      setHintAsked(false);
    }
  }, [gameData?.questionIndex, gameData?.locked, gameData?.hintUsed]);

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

  if (!gameData || !player) {
    return <div className="loading">Chargement de la question...</div>;
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
              <HostJokerBoard players={gameData.jokerRoster || []} />
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
    return <div className="loading">Chargement de la question...</div>;
  }

  const isHost = gameData.hostId === player.id;
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
    setLocked(true);
    onSubmitAnswer(answer);
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
        <div style={{ textAlign: 'center', padding: '18px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Tu es réduit au silence</div>
          <div style={{ opacity: 0.8 }}>Ta réponse ne comptera pas sur cette question.</div>
        </div>
      );
    }

    if (locked) {
      return (
        <div style={{ textAlign: 'center', padding: '18px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Réponse envoyée</div>
          <div style={{ opacity: 0.8 }}>
            {gameData.answered || 0}/{gameData.totalPlayers || players.length} {progressLabel}
          </div>
        </div>
      );
    }

    if (teamMode && !myTeam) {
      return (
        <div style={{ textAlign: 'center', padding: '18px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Choisis ton équipe</div>
          <div style={{ opacity: 0.8 }}>Ensuite tu suis la question avec les autres.</div>
        </div>
      );
    }

    if (teamMode && !iAmCaptain) {
      return (
        <div style={{ textAlign: 'center', padding: '18px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>
            {me?.captainName || 'Le chef d\'équipe'} envoie la réponse
          </div>
          <div style={{ opacity: 0.8 }}>Échangez dans le chat, une seule réponse part pour l'équipe.</div>
        </div>
      );
    }

    if (question.type === 'qcm') {
      return (
        <div className="choice-grid">
          {question.options.map((option, index) => {
            const isSelected = selected.includes(index);
            return (
              <button
                key={option + index}
                type="button"
                className="choice-btn"
                style={{
                  background: CHOICE_COLORS[index % CHOICE_COLORS.length],
                  outline: isSelected ? '3px solid white' : 'none'
                }}
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
                <span style={{ opacity: 0.85, marginRight: 8 }}>{CHOICE_SHAPES[index % CHOICE_SHAPES.length]}</span>
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
        />
      );
    }

    if (question.type === 'boolean') {
      return (
        <div className="choice-grid">
          <button type="button" className="choice-btn" style={{ background: '#26890c' }} onClick={() => send(true)}>
            Vrai
          </button>
          <button type="button" className="choice-btn" style={{ background: '#e21b3c' }} onClick={() => send(false)}>
            Faux
          </button>
        </div>
      );
    }

    return (
      <div className="answer-input">
        <input
          type="text"
          className="input"
          placeholder={question.type === 'music' ? 'Titre, artiste, anime...' : 'Ta réponse'}
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && textAnswer.trim()) send(textAnswer.trim());
          }}
        />
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
          readOnly
        />
      </div>
    );
  };

  const renderAnswer = (entry) => (
    <>
      {entry.firstAnswerText ? (
        <>
          <div style={{ opacity: 0.85 }}>1re : {entry.firstAnswerText}</div>
          <div style={{ opacity: 0.85 }}>2e : {entry.answerText}</div>
        </>
      ) : (
        <div style={{ opacity: 0.85 }}>{entry.answerText}</div>
      )}
      {renderPlacement(entry.answer)}
    </>
  );

  return (
    <div className="container">
      {gameData.melange && (
        <div className="melange-burst" role="status">
          <div className="melange-burst-card">
            <JokerCard cardId="melange" size="full" />
          </div>
          <p className="melange-burst-caption">{gameData.melange.username} mélange les réponses</p>
        </div>
      )}
      <div className="card">
        <div className="quiz-stage">
        <div className="question-number" style={{ marginBottom: 6 }}>
          {gameData.quizName ? `${gameData.quizName} · ` : ''}
          Question {gameData.questionIndex + 1} / {gameData.totalQuestions}
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
          {question.points} pt{question.points > 1 ? 's' : ''}
          {gameData.hostName ? ` · Chef ${gameData.hostName}` : ''}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', margin: '14px 0', width: '100%' }}>
          {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((entry) => (
            <span key={entry.id} style={{
              padding: '6px 10px',
              borderRadius: '999px',
              background: entry.id === player.id ? 'rgba(255, 35, 71,0.25)' : 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {entry.username} · {entry.score || 0}
            </span>
          ))}
        </div>

        {teamMode && !isHost && !myTeam && (
          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <div style={{ marginBottom: 10 }}>Choisis Team Shadow ou Team Sonic.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-danger" onClick={() => onChooseTeam && onChooseTeam('shadow')}>
                Team Shadow
              </button>
              <button type="button" className="btn" onClick={() => onChooseTeam && onChooseTeam('sonic')}>
                Team Sonic
              </button>
            </div>
          </div>
        )}

        {isHost && !teamMode && (
          <HostJokerBoard players={gameData.jokerRoster || []} />
        )}

        {phase === 'answering' && question.timeLimit > 0 && (
          <div style={{ width: '100%', maxWidth: '640px', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: 6 }}>
              {remaining}s
            </div>
            <div className="timer-bar">
              <div style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        )}

        {question.prompt && (
          <h2 className="quiz-answer" style={{ fontSize: '1.6rem', margin: '10px auto 6px', maxWidth: '760px' }}>
            {question.prompt}
          </h2>
        )}

        {question.type === 'music' ? (
          <BlindMusicPlayer
            key={`${question.musicUrl}-${phase}`}
            url={question.musicUrl}
            revealed={phase === 'reveal' || (isHost && phase !== 'answering')}
          />
        ) : (
          <QuestionMedia imageUrl={question.imageUrl} videoUrl={question.videoUrl} />
        )}
        {question.type === 'music' && question.imageUrl && (
          <QuestionMedia imageUrl={question.imageUrl} videoUrl="" />
        )}
        {phase === 'reveal' && (
          <QuestionMedia imageUrl={gameData.answerImageUrl} videoUrl={gameData.answerVideoUrl} />
        )}

        {phase === 'answering' && isHost && (
          <div className="quiz-host-panel">
            <div style={{ marginBottom: 8 }}>Tu es le chef : tu ne réponds pas.</div>
            {gameData.hostAnswer && (
              <div style={{ marginBottom: 8 }}>
                Réponse prévue : <strong className="quiz-answer">{gameData.hostAnswer}</strong>
              </div>
            )}
            {gameData.hostSolution?.type === 'order' && (
              <OrderReview items={gameData.hostSolution.items || []} />
            )}
            {gameData.hostSolution?.type === 'layout' && (
              <PlaceBoard
                mode={gameData.hostSolution.layoutMode === 'schema' ? 'schema' : 'timeline'}
                imageUrl={gameData.hostSolution.layoutImageUrl || ''}
                items={gameData.hostSolution.items || []}
                places={(gameData.hostSolution.items || []).map((item) => ({ id: item.id, x: item.x, y: item.y }))}
                readOnly
              />
            )}
            <div style={{ opacity: 0.8, marginBottom: 8 }}>
              {gameData.answered || 0}/{gameData.totalPlayers || players.length} {progressLabel}
            </div>
            {hintRequests.length === 0 && (
              <div style={{ opacity: 0.75 }}>Aucun indice demandé.</div>
            )}
            {hintRequests.map((request) => (
              <HintComposer key={request.id} request={request} onSend={onSendHint} />
            ))}
            <button type="button" className="btn" onClick={onForceClose}>
              <Icon name="lock" />Clore les réponses
            </button>
          </div>
        )}

        {phase === 'answering' && !isHost && (
          <>
            {gameData.copiedAnswer && gameData.copiedAnswer.questionIndex === gameData.questionIndex && !gameData.silenced && (
              <div className="copied-banner">
                Réponse de {gameData.copiedAnswer.username} : {gameData.copiedAnswer.text}
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
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              {gameData.answered || 0}/{gameData.totalPlayers || players.length} {progressLabel}
            </div>
          </>
        )}

        {(phase === 'hold' || phase === 'correction') && !isHost && (
          <div className="correction-section">
            <h3 style={{ textAlign: 'center' }}>
              {phase === 'hold' ? 'Réponses closes' : 'Le chef distribue les points'}
            </h3>
            {phase === 'hold' && gameData.answersVisible ? (
              <>
                <p style={{ textAlign: 'center', color: '#ff2347' }}>
                  Tu as Vol. Les réponses sont là, la bonne reste cachée.
                </p>
                {scoreRows.map((entry) => (
                  <div key={entry.id} className="quiz-score-row">
                    <div className="quiz-answer">
                      <strong>{entry.username}</strong>
                      {entry.captainName ? ` · chef ${entry.captainName}` : ''}
                      {renderAnswer(entry)}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#ff2347' }}>
                {phase === 'hold'
                  ? 'La bonne réponse reste cachée, le temps que le chef prépare les points.'
                  : 'La bonne réponse s\'affichera quand les points seront validés.'}
              </p>
            )}
          </div>
        )}

        {(phase === 'hold' || phase === 'correction') && isHost && (
          <div className="correction-section">
            <h3 style={{ textAlign: 'center' }}>
              {phase === 'hold' ? 'Prépare la correction' : 'Distribue les points'}
            </h3>
            <div style={{
              textAlign: 'center',
              margin: '12px 0 18px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 35, 71,0.15)',
              border: '1px solid rgba(255, 35, 71,0.45)'
            }}>
              Réponse prévue : <strong className="quiz-answer">{gameData.expectedAnswer || '—'}</strong>
              <div style={{ marginTop: 6, fontSize: '0.9rem', opacity: 0.85 }}>
                {phase === 'hold'
                  ? 'La réponse prévue reste cachée. Celui qui a Vol voit les réponses des autres.'
                  : `Rien n'est validé tout seul. Une bonne réponse vaut ${gameData.suggestedPoints || question.points || 1} pt.`}
              </div>
              {renderPlacement(null, true)}
              <QuestionMedia imageUrl={gameData.answerImageUrl} videoUrl={gameData.answerVideoUrl} />
            </div>
            {scoreRows.map((entry) => {
              const given = Number(corrections[entry.id]) || 0;
              const suggested = gameData.suggestedPoints || question.points || 1;
              const memberPreview = (gameData.gainPreview || []).filter((row) => (
                entry.team ? row.team === entry.team : row.id === entry.id
              ));
              return (
                <div key={entry.id} className="quiz-score-row">
                  <div className="quiz-answer">
                    <strong>{entry.username}</strong>
                    {entry.captainName ? ` · chef ${entry.captainName}` : ''}
                    {(entry.members || []).filter((name) => name !== entry.captainName).length
                      ? ` · ${(entry.members || []).filter((name) => name !== entry.captainName).join(', ')}`
                      : ''}
                    {renderAnswer(entry)}
                  </div>
                  {phase === 'correction' ? (
                    <div className="quiz-score-actions">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => onUpdateCorrections({ ...corrections, [entry.id]: suggested })}
                      >
                        Valider ({suggested})
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ background: 'rgba(255, 35, 71,0.25)', color: '#ff2347' }}
                        onClick={() => onUpdateCorrections({ ...corrections, [entry.id]: Math.min(99, given + 1) })}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onUpdateCorrections({ ...corrections, [entry.id]: Math.max(0, given - 1) })}
                      >
                        −1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        className="input"
                        style={{ width: '80px', margin: 0, textAlign: 'center' }}
                        value={given}
                        onChange={(event) => {
                          const next = Math.max(0, Math.min(99, Math.round(Number(event.target.value) || 0)));
                          onUpdateCorrections({ ...corrections, [entry.id]: next });
                        }}
                      />
                    </div>
                  ) : null}
                  {phase === 'correction' && memberPreview.some((row) => (row.tags || []).length > 0) && (
                    <div style={{ color: '#ff2347', fontSize: '0.9rem' }}>
                      {memberPreview.filter((row) => (row.tags || []).length > 0).map((row) => (
                        `${row.username || ''} ${(row.tags || []).join(' · ')} → ${row.gain || 0}`
                      )).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ textAlign: 'center' }}>
              {phase === 'hold' ? (
                <button type="button" className="btn btn-success" onClick={onBeginScoring}>
                  <Icon name="coin" />Distribuer les points
                </button>
              ) : (
                <button type="button" className="btn btn-success" onClick={() => onSubmitCorrection(corrections)}>
                  <Icon name="check" />Valider les points
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'reveal' && reveal && (
          <div style={{ marginTop: 18 }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(81,207,102,0.18)',
              border: '1px solid rgba(81,207,102,0.45)',
              marginBottom: 16
            }}>
              <div style={{ opacity: 0.8, marginBottom: 6 }}>Réponse prévue</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }} className="quiz-answer">{reveal.correctAnswer}</div>
              {renderPlacement(null, true)}
            </div>

            {question.type === 'boolean' && (
              <div className="choice-grid">
                <div className="choice-btn" style={{ background: reveal.correctBoolean ? '#26890c' : 'rgba(255,255,255,0.12)', opacity: reveal.correctBoolean ? 1 : 0.45 }}>
                  Vrai
                </div>
                <div className="choice-btn" style={{ background: reveal.correctBoolean === false ? '#e21b3c' : 'rgba(255,255,255,0.12)', opacity: reveal.correctBoolean === false ? 1 : 0.45 }}>
                  Faux
                </div>
              </div>
            )}

            {question.type === 'qcm' && (
              <div className="choice-grid">
                {(question.options || []).map((option, index) => {
                  const isCorrect = (reveal.correctIndexes || []).includes(index);
                  return (
                    <div
                      key={option + index}
                      className="choice-btn"
                      style={{
                        background: isCorrect ? '#26890c' : 'rgba(255,255,255,0.12)',
                        opacity: isCorrect ? 1 : 0.55,
                        cursor: 'default'
                      }}
                    >
                      {option}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16, width: '100%' }}>
              {((reveal.teams && reveal.teams.length) ? reveal.teams : (reveal.players || [])).map((entry) => {
                const teammates = (entry.members || []).filter((name) => name !== entry.captainName);
                const onThisRow = entry.memberIds
                  ? entry.memberIds.includes(player.id)
                  : entry.id === player.id;
                return (
                  <div key={entry.id} className="quiz-score-row">
                    <div className="quiz-answer">
                      <strong>{entry.username}</strong>
                      {entry.captainName ? ` · chef ${entry.captainName}` : ''}
                      {teammates.length ? ` · ${teammates.join(', ')}` : ''}
                      {renderAnswer(entry)}
                    </div>
                    <div style={{ fontWeight: 'bold', color: entry.pointsThisRound > 0 ? '#51cf66' : '#ff6b6b' }}>
                      +{entry.pointsThisRound || 0}
                    </div>
                    {(entry.memberGains || []).length > 0 && (
                      <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                        {entry.memberGains.map((gain) => `${gain.username} +${gain.points}`).join(' · ')}
                      </div>
                    )}
                    {onThisRow && (gameData.roundNotes || []).length > 0 && (
                      <div style={{ color: '#ff2347', fontSize: '0.9rem' }}>{gameData.roundNotes.join(' ')}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {isHost ? (
                <button type="button" className="btn btn-success" onClick={onNext}>
                  {gameData.questionIndex + 1 >= gameData.totalQuestions ? <><Icon name="trophy" />Voir les résultats</> : <><Icon name="go" />Question suivante</>}
                </button>
              ) : (
                <p style={{ color: '#ff2347' }}><Icon name="clock" tone="mark" />En attente du chef...</p>
              )}
            </div>
          </div>
        )}

        {phase === 'reveal' && !reveal && isHost && (
          <button type="button" className="btn btn-success" onClick={onNext}>
            <Icon name="go" />Question suivante
          </button>
        )}

        {!isHost && (
          <div className="player-dock">
            {!teamMode && (
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
                  setLocked(false);
                  setRedoTick((value) => value + 1);
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
