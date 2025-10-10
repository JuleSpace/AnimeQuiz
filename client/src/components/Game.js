import React, { useState, useEffect } from 'react';

const Game = ({ gameData, player, onSubmitAnswer, onSubmitCorrection }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrectionPhase, setIsCorrectionPhase] = useState(false);
  const [corrections, setCorrections] = useState({});
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    if (gameData) {
      setCurrentQuestion(gameData.currentQuestion || 0);
      setIsCorrectionPhase(gameData.isCorrectionPhase || false);
    }
  }, [gameData]);

  useEffect(() => {
    // Récupérer l'URL audio et la convertir si nécessaire
    if (gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion]) {
      const link = gameData.musicLinks[currentQuestion];
      
      // Si c'est un lien YouTube, essayer d'extraire l'audio
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        const videoId = extractYouTubeId(link);
        if (videoId) {
          // Appeler notre API pour convertir YouTube en MP3
          fetch(`/api/youtube-audio/${videoId}`)
            .then(response => response.json())
            .then(data => {
              if (data.success && data.audioUrl) {
                setAudioUrl(data.audioUrl);
                console.log('Audio YouTube converti en MP3:', data.audioUrl);
              } else {
                setAudioUrl(null);
                console.warn('Conversion YouTube échouée:', data.message);
              }
            })
            .catch(error => {
              console.error('Erreur conversion YouTube:', error);
              setAudioUrl(null);
            });
        }
      } else {
        setAudioUrl(link);
      }
    }
  }, [currentQuestion, gameData]);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
    setCorrections(prev => ({
      ...prev,
      [playerId]: isCorrect
    }));
  };

  if (!gameData) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <div className="card">
        <div className="question-container">
          <div className="question-number">
            Question {currentQuestion + 1} / {gameData.totalQuestions}
          </div>
          
          {gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion] && (
            <div className="audio-player">
              {audioUrl ? (
                <audio controls>
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/ogg" />
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
              ) : (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '20px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#ffd700', marginBottom: '15px', fontSize: '1.1rem' }}>
                    🎵 Lecteur Audio YouTube
                  </div>
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', opacity: 0.9 }}>
                    <strong>Vidéo masquée - Audio uniquement</strong>
                  </div>
                  
                  {/* Lecteur YouTube avec vidéo masquée */}
                  <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '80px',
                    background: 'rgba(0,0,0,0.8)',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <iframe
                      title="Lecteur audio YouTube masqué"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(gameData.musicLinks[currentQuestion])}?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1&fs=0&cc_load_policy=0&iv_load_policy=3&disablekb=1`}
                      style={{
                        position: 'absolute',
                        top: '-60px', // Masquer la partie vidéo
                        left: '0',
                        width: '100%',
                        height: '200px', // Plus grand pour avoir les contrôles en bas
                        border: 'none',
                        borderRadius: '10px'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '80px',
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: '0 0 10px 10px'
                    }}>
                      🎧 Contrôles YouTube (vidéo cachée)
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '15px', fontSize: '0.8rem', opacity: 0.8 }}>
                    💡 La vidéo est masquée, seul l'audio est disponible pour garder la réponse secrète
                  </div>
                </div>
              )}
            </div>
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
                Envoyer la réponse
              </button>
            </div>
          )}

          {hasAnswered && !isCorrectionPhase && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                ✅ Réponse envoyée !
              </div>
              <div style={{ opacity: 0.8 }}>
                En attente des autres joueurs...
              </div>
            </div>
          )}

          {isCorrectionPhase && (
            <div className="correction-section">
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                🔍 Phase de correction
              </h3>
              {gameData.players && gameData.players[0] && gameData.players[0].id === player.id ? (
                <>
                  <p style={{ textAlign: 'center', marginBottom: '20px', opacity: 0.8 }}>
                    En tant que chef, corrigez les réponses des autres joueurs :
                  </p>
              
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {gameData.players && gameData.players.map(p => (
                  <div key={p.id} className="correction-item">
                    <div>
                      <strong>{p.username}:</strong>
                      <div style={{ opacity: 0.8 }}>{p.answers && p.answers[currentQuestion]}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => toggleCorrection(p.id, true)}
                        className={`btn ${corrections[p.id] === true ? 'btn-success' : ''}`}
                        style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                      >
                        ✅ Correct
                      </button>
                      <button
                        onClick={() => toggleCorrection(p.id, false)}
                        className={`btn ${corrections[p.id] === false ? 'btn-danger' : ''}`}
                        style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                      >
                        ❌ Incorrect
                      </button>
                    </div>
                  </div>
                ))}
              </div>

                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button 
                      onClick={handleSubmitCorrection}
                      className="btn btn-success"
                      disabled={Object.keys(corrections).length === 0}
                    >
                      Finaliser les corrections ({Object.keys(corrections).length}/{gameData.players ? gameData.players.length - 1 : 0})
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ffd700' }}>
                    ⏳ En attente du chef...
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
          <div>Score actuel: {player.score || 0} points</div>
        </div>
      </div>
    </div>
  );
};

export default Game;
