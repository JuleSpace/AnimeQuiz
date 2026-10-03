import React, { useState, useEffect } from 'react';
import BlindMusicPlayer from './BlindMusicPlayer';
import Icon from './ArcadeIcon';

const Game = ({ gameData, player, onSubmitAnswer, onSubmitCorrection, onUpdateCorrections }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrectionPhase, setIsCorrectionPhase] = useState(false);
  const [corrections, setCorrections] = useState({});

  useEffect(() => {
    if (gameData) {
      setCurrentQuestion(gameData.currentQuestion || 0);
      setIsCorrectionPhase(gameData.isCorrectionPhase || false);
      
      // Synchroniser les corrections reçues du serveur
      if (gameData.currentCorrections) {
        setCorrections(gameData.currentCorrections);
      }
      
      // Réinitialiser hasAnswered quand on passe à une nouvelle question
      if (gameData.currentQuestion !== currentQuestion) {
        setHasAnswered(false);
        setAnswer('');
        setCorrections({}); // Réinitialiser les corrections pour la nouvelle question
      }
    }
  }, [gameData, currentQuestion]);

  const getMusicUrl = (musicLink) => {
    return typeof musicLink === 'string' ? musicLink : (musicLink?.url || '');
  };

  const getMusicAnswer = (musicLink) => {
    return typeof musicLink === 'object' ? (musicLink?.answer || '') : '';
  };

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      onSubmitAnswer(answer.trim(), currentQuestion);
      setHasAnswered(true);
    }
  };

  const handleSubmitCorrection = () => {
    onSubmitCorrection(currentQuestion, corrections);
    setIsCorrectionPhase(false);
    setCorrections({});
    setAnswer('');
    setHasAnswered(false);
  };

  const toggleCorrection = (playerId, isCorrect) => {
    const newCorrections = {
      ...corrections,
      [playerId]: isCorrect
    };
    setCorrections(newCorrections);
    
    // Envoyer les corrections en temps réel au serveur
    if (onUpdateCorrections) {
      onUpdateCorrections(currentQuestion, newCorrections);
    }
  };

  if (!gameData) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <div className="card">
        <div className="question-container">
          <div className="question-number">
            Question {currentQuestion + 1} / {gameData.totalQuestions || (gameData.musicLinks ? gameData.musicLinks.length : 0)}
          </div>
          
          {/* Afficher la réponse pendant la correction */}
          {isCorrectionPhase && gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion] && (
            <div style={{
              background: 'rgba(255, 35, 71, 0.2)',
              border: '2px solid #ff2347',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff2347', marginBottom: '10px' }}>
                <Icon name="check" tone="mark" />Réponse correcte
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {getMusicAnswer(gameData.musicLinks[currentQuestion]) || 'Aucune réponse définie'}
              </div>
            </div>
          )}

          {gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion] && (
            <BlindMusicPlayer
              key={`${getMusicUrl(gameData.musicLinks[currentQuestion])}-${isCorrectionPhase}`}
              url={getMusicUrl(gameData.musicLinks[currentQuestion])}
              revealed={isCorrectionPhase}
            />
          )}

          {!hasAnswered && !isCorrectionPhase && (
            <div className="answer-input">
              <input
                type="text"
                placeholder="Votre réponse..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="input"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
              />
              <button onClick={handleSubmitAnswer} className="btn btn-success">
                <Icon name="go" />Envoyer la réponse
              </button>
            </div>
          )}

          {hasAnswered && !isCorrectionPhase && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                <Icon name="check" tone="cyan" />Réponse envoyée
              </div>
              <div style={{ opacity: 0.8 }}>
                En attente des autres joueurs...
              </div>
            </div>
          )}

          {isCorrectionPhase && (
            <div className="correction-section">
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Icon name="search" tone="mark" />Phase de correction
              </h3>
              
              {/* Affichage des réponses pour tous les joueurs */}
              <p style={{ textAlign: 'center', marginBottom: '20px', opacity: 0.8 }}>
                {gameData.players && gameData.players[0] && gameData.players[0].id === player.id 
                  ? 'En tant que chef, corrigez les réponses des autres joueurs :'
                  : 'Voici les réponses soumises par tous les joueurs. Les sélections du chef apparaîtront en temps réel :'
                }
              </p>
              
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {gameData.players && gameData.players.map(p => (
                  <div key={p.id} className="correction-item">
                    <div>
                      <strong>{p.username}:</strong>
                      <div style={{ opacity: 0.8 }}>{p.answers && p.answers[currentQuestion]}</div>
                    </div>
                    
                    {/* Boutons de correction visibles pour tous, mais cliquables seulement pour le chef */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={gameData.players[0] && gameData.players[0].id === player.id ? () => toggleCorrection(p.id, true) : undefined}
                        className={`btn ${corrections[p.id] === true ? 'btn-success' : ''}`}
                        style={{ 
                          padding: '5px 15px', 
                          fontSize: '0.9rem',
                          cursor: gameData.players[0] && gameData.players[0].id === player.id ? 'pointer' : 'default',
                          opacity: gameData.players[0] && gameData.players[0].id === player.id ? 1 : 0.7,
                          filter: gameData.players[0] && gameData.players[0].id === player.id ? 'none' : 'grayscale(20%)'
                        }}
                        disabled={!(gameData.players[0] && gameData.players[0].id === player.id)}
                      >
                        <Icon name="check" />Correct
                      </button>
                      <button
                        onClick={gameData.players[0] && gameData.players[0].id === player.id ? () => toggleCorrection(p.id, false) : undefined}
                        className={`btn ${corrections[p.id] === false ? 'btn-danger' : ''}`}
                        style={{ 
                          padding: '5px 15px', 
                          fontSize: '0.9rem',
                          cursor: gameData.players[0] && gameData.players[0].id === player.id ? 'pointer' : 'default',
                          opacity: gameData.players[0] && gameData.players[0].id === player.id ? 1 : 0.7,
                          filter: gameData.players[0] && gameData.players[0].id === player.id ? 'none' : 'grayscale(20%)'
                        }}
                        disabled={!(gameData.players[0] && gameData.players[0].id === player.id)}
                      >
                        <Icon name="cross" />Incorrect
                      </button>
                      <button
                        onClick={gameData.players[0] && gameData.players[0].id === player.id ? () => toggleCorrection(p.id, 'bonus') : undefined}
                        className={`btn ${corrections[p.id] === 'bonus' ? 'btn-warning' : ''}`}
                        style={{ 
                          padding: '5px 15px', 
                          fontSize: '0.9rem',
                          background: corrections[p.id] === 'bonus' ? '#ff2347' : 'rgba(255, 35, 71, 0.2)',
                          color: corrections[p.id] === 'bonus' ? '#000' : '#ff2347',
                          cursor: gameData.players[0] && gameData.players[0].id === player.id ? 'pointer' : 'default',
                          opacity: gameData.players[0] && gameData.players[0].id === player.id ? 1 : 0.7,
                          filter: gameData.players[0] && gameData.players[0].id === player.id ? 'none' : 'grayscale(20%)'
                        }}
                        disabled={!(gameData.players[0] && gameData.players[0].id === player.id)}
                      >
                        <Icon name="star" />+1 Bonus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              
              {/* Bouton de finalisation uniquement pour le chef */}
              {gameData.players && gameData.players[0] && gameData.players[0].id === player.id && (
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button 
                    onClick={handleSubmitCorrection}
                    className="btn btn-success"
                    disabled={Object.keys(corrections).length === 0}
                  >
                    <Icon name="check" />Finaliser les corrections
                  </button>
                </div>
              )}
              
              {/* Message pour les non-chefs */}
              {gameData.players && (!gameData.players[0] || gameData.players[0].id !== player.id) && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ff2347' }}>
                    <Icon name="clock" tone="mark" />En attente du chef...
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    Seul le chef peut corriger les réponses
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', opacity: 0.8 }}>
          <div>Score actuel: {(gameData.players && gameData.players.find(p => p.id === player.id)?.score) || 0} points</div>
        </div>
      </div>
    </div>
  );
};

export default Game;
