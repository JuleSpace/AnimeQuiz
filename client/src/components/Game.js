import React, { useState, useEffect, useRef } from 'react';

const Game = ({ gameData, player, onSubmitAnswer, onSubmitCorrection, onUpdateCorrections }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrectionPhase, setIsCorrectionPhase] = useState(false);
  const [corrections, setCorrections] = useState({});
  const [audioUrl, setAudioUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const [youtubeIsPlaying, setYoutubeIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const youtubeIframeRef = useRef(null);

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

  // Prévenir le rafraîchissement de page (F5) pendant le jeu
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (gameData && !gameData.isGameFinished) {
        e.preventDefault();
        e.returnValue = 'Êtes-vous sûr de vouloir quitter la partie ? Votre progression sera perdue.';
        return 'Êtes-vous sûr de vouloir quitter la partie ? Votre progression sera perdue.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameData]);

  // Écouter les messages de l'iframe YouTube
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress') {
          setYoutubeCurrentTime(data.info.currentTime || 0);
          setYoutubeDuration(data.info.duration || 0);
        } else if (data.event === 'video-play-progress') {
          setYoutubeIsPlaying(data.info.playerState === 1);
          setYoutubeCurrentTime(data.info.currentTime || 0);
        } else if (data.event === 'video-pause') {
          setYoutubeIsPlaying(false);
        }
      } catch (e) {
        // Ignorer les messages non-JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Nettoyer l'audio précédent avant de charger le nouveau
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
    
    // Récupérer l'URL audio et la convertir si nécessaire
    if (gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion]) {
      const musicLink = gameData.musicLinks[currentQuestion];
      const link = typeof musicLink === 'string' ? musicLink : musicLink.url;
      
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
                // Forcer le rechargement de l'audio
                if (audioRef.current) {
                  audioRef.current.load();
                }
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
      } else if (link.includes('spotify.com')) {
        // Lien Spotify - on va utiliser l'embed
        setAudioUrl(null);
        console.log('Lien Spotify détecté');
      } else {
        // Lien audio direct (MP3, WAV, etc.)
        setAudioUrl(link);
        // Forcer le rechargement de l'audio
        if (audioRef.current) {
          audioRef.current.load();
        }
      }
    }
  }, [currentQuestion, gameData]);

  const getMusicUrl = (musicLink) => {
    return typeof musicLink === 'string' ? musicLink : (musicLink?.url || '');
  };

  const getMusicAnswer = (musicLink) => {
    return typeof musicLink === 'object' ? (musicLink?.answer || '') : '';
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractYouTubeTimestamp = (url) => {
    // Extraire le timestamp (t=236, start=236, etc.)
    const timestampMatch = url.match(/[?&](?:t|start)=(\d+)/);
    return timestampMatch ? parseInt(timestampMatch[1]) : 0;
  };

  const extractSpotifyId = (url) => {
    // Support pour différents formats Spotify :
    // https://open.spotify.com/track/1EUGo3QcDXQSv0XKF8GIZK
    // https://open.spotify.com/intl-fr/track/1EUGo3QcDXQSv0XKF8GIZK?si=...
    const regExp = /spotify\.com\/.*?\/track\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
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
    // Réinitialiser l'état audio pour la prochaine question
    setAudioUrl(null);
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

  // Fonction pour formater le temps en mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              background: 'rgba(255, 215, 0, 0.2)',
              border: '2px solid #ffd700',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700', marginBottom: '10px' }}>
                ✅ Réponse correcte :
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {getMusicAnswer(gameData.musicLinks[currentQuestion]) || 'Aucune réponse définie'}
              </div>
            </div>
          )}

          {gameData && gameData.musicLinks && gameData.musicLinks[currentQuestion] && (
            <div className="audio-player">
              {audioUrl ? (
                <div style={{ width: '100%' }}>
                  <audio 
                    ref={audioRef}
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.target.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={audioUrl} type="audio/mpeg" />
                    <source src={audioUrl} type="audio/ogg" />
                    Votre navigateur ne supporte pas la lecture audio.
                  </audio>
                  
                  {/* Contrôles personnalisés */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '20px', 
                    borderRadius: '10px',
                    marginTop: '10px'
                  }}>
                    {/* Boutons Play/Pause */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) {
                              audioRef.current.pause();
                            } else {
                              audioRef.current.play();
                            }
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '50px',
                          height: '50px',
                          color: 'white',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isPlaying ? '⏸️' : '▶️'}
                      </button>
                    </div>
                    
                    {/* Barre de progression */}
                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const time = parseFloat(e.target.value);
                          setCurrentTime(time);
                          if (audioRef.current) {
                            audioRef.current.currentTime = time;
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          accentColor: '#667eea'
                        }}
                      />
                    </div>
                    
                    {/* Temps */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              ) : getMusicUrl(gameData.musicLinks[currentQuestion]).includes('spotify.com') ? (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '20px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#1db954', marginBottom: '15px', fontSize: '1.1rem' }}>
                    🎵 Lecteur Spotify
                  </div>
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', opacity: 0.9 }}>
                    <strong>Lecteur Spotify intégré</strong>
                  </div>
                  
                   {/* Lecteur Spotify intégré avec informations masquées */}
                   <div style={{ 
                     position: 'relative',
                     width: '100%',
                     height: '80px',
                     background: 'rgba(29, 185, 84, 0.1)',
                     borderRadius: '10px',
                     overflow: 'hidden'
                   }}>
                     <iframe
                       title="Lecteur Spotify"
                       src={`https://open.spotify.com/embed/track/${extractSpotifyId(getMusicUrl(gameData.musicLinks[currentQuestion]))}?utm_source=generator&theme=0`}
                       style={{
                         position: 'absolute',
                         top: '-40px', // Masquer les informations en haut
                         left: '0',
                         width: '100%',
                         height: '160px', // Plus grand pour avoir les contrôles
                         border: 'none',
                         borderRadius: '10px'
                       }}
                       allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                       loading="lazy"
                     />
                     
                     {/* Masque pour cacher les informations */}
                     <div style={{
                       position: 'absolute',
                       top: '0',
                       left: '0',
                       right: '0',
                       height: '40px',
                       background: 'rgba(0,0,0,0.9)',
                       borderRadius: '10px 10px 0 0'
                     }}></div>
                     
                     {/* Interface audio personnalisée */}
                     <div style={{
                       position: 'absolute',
                       bottom: '0',
                       left: '0',
                       right: '0',
                       height: '80px',
                       background: 'linear-gradient(45deg, #1db954, #1ed760)',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       color: 'white',
                       padding: '0 20px',
                       borderRadius: '0 0 10px 10px'
                     }}>
                       <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                         <div style={{ fontSize: '1.5rem', marginRight: '15px' }}>🎵</div>
                         <div style={{ flex: 1 }}>
                           <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Audio Spotify</div>
                           <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px' }}>Utilisez les contrôles ci-dessus</div>
                           
                           {/* Barre de progression simulée pour Spotify */}
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <span style={{ fontSize: '0.7rem', minWidth: '30px', opacity: 0.7 }}>0:00</span>
                             <input
                               type="range"
                               min="0"
                               max="100"
                               defaultValue="0"
                               style={{
                                 flex: 1,
                                 height: '4px',
                                 background: 'rgba(255,255,255,0.3)',
                                 outline: 'none',
                                 borderRadius: '2px',
                                 cursor: 'not-allowed',
                                 opacity: 0.5
                               }}
                               disabled
                             />
                             <span style={{ fontSize: '0.7rem', minWidth: '30px', opacity: 0.7 }}>?:??</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                  
                  <div style={{ marginTop: '15px', fontSize: '0.8rem', opacity: 0.8 }}>
                    💡 Lecteur Spotify officiel - écoutez sans révéler la réponse
                  </div>
                </div>
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
                    <strong>{isCorrectionPhase ? 'Vidéo visible - Phase de correction' : 'Vidéo masquée - Audio uniquement'}</strong>
                  </div>
                  
                  {isCorrectionPhase ? (
                    // Afficher la vidéo YouTube normalement pendant la correction
                    <div style={{ 
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '56.25%', // Ratio 16:9
                      background: 'rgba(0,0,0,0.9)',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        title="Lecteur vidéo YouTube"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(getMusicUrl(gameData.musicLinks[currentQuestion]))}?autoplay=0&controls=1&start=${extractYouTubeTimestamp(getMusicUrl(gameData.musicLinks[currentQuestion]))}`}
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          borderRadius: '10px'
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    // Lecteur YouTube complètement masqué avec contrôles audio pendant le jeu
                    <div style={{ 
                      position: 'relative',
                      width: '100%',
                      height: '80px',
                      background: 'rgba(0,0,0,0.9)',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      {/* Iframe YouTube complètement masquée */}
                      <iframe
                        title="Lecteur audio YouTube masqué"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(getMusicUrl(gameData.musicLinks[currentQuestion]))}?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1&fs=0&cc_load_policy=0&iv_load_policy=3&disablekb=1&enablejsapi=1&start=${extractYouTubeTimestamp(getMusicUrl(gameData.musicLinks[currentQuestion]))}`}
                        style={{
                          position: 'absolute',
                          top: '-200px', // Complètement masquer la vidéo
                          left: '0',
                          width: '100%',
                          height: '400px', // Très grand pour avoir les contrôles
                          border: 'none',
                          opacity: '0.01' // Presque invisible mais fonctionnel
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      
                      {/* Interface audio personnalisée */}
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'white',
                        padding: '0 20px',
                        borderRadius: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ fontSize: '1.5rem', marginRight: '15px' }}>🎵</div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Audio YouTube</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Vidéo masquée</div>
                          </div>
                        </div>
                        
                        {/* Contrôles audio personnalisés */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <button
                            onClick={() => {
                              // Trouver l'iframe et déclencher play
                              const iframe = document.querySelector('iframe[title="Lecteur audio YouTube masqué"]');
                              if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                              }
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              color: 'white',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ▶️
                          </button>
                          <button
                            onClick={() => {
                              const iframe = document.querySelector('iframe[title="Lecteur audio YouTube masqué"]');
                              if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                              }
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              color: 'white',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ⏸️
                          </button>
                          
                          {/* Barre de progression YouTube */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span style={{ fontSize: '0.8rem', minWidth: '35px' }}>
                              {Math.floor(youtubeCurrentTime / 60)}:{(youtubeCurrentTime % 60).toFixed(0).padStart(2, '0')}
                            </span>
                            <input
                              type="range"
                              min="0"
                              max={youtubeDuration || 100}
                              value={youtubeCurrentTime}
                              onChange={(e) => {
                                const time = parseFloat(e.target.value);
                                setYoutubeCurrentTime(time);
                                const iframe = document.querySelector('iframe[title="Lecteur audio YouTube masqué"]');
                                if (iframe && iframe.contentWindow) {
                                  iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":["${time}",true]}`, '*');
                                }
                              }}
                              style={{
                                flex: 1,
                                height: '6px',
                                background: 'rgba(255,255,255,0.3)',
                                outline: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', minWidth: '35px' }}>
                              {Math.floor((youtubeDuration || 0) / 60)}:{((youtubeDuration || 0) % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          </div>
                          
                          {/* Contrôle de volume */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem' }}>🔊</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              defaultValue="50"
                              onChange={(e) => {
                                const volume = parseInt(e.target.value);
                                const iframe = document.querySelector('iframe[title="Lecteur audio YouTube masqué"]');
                                if (iframe && iframe.contentWindow) {
                                  iframe.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":["${volume}"]}`, '*');
                                }
                              }}
                              style={{
                                width: '80px',
                                height: '4px',
                                background: 'rgba(255,255,255,0.3)',
                                outline: 'none',
                                borderRadius: '2px'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isCorrectionPhase && (
                    <div style={{ marginTop: '15px', fontSize: '0.8rem', opacity: 0.8 }}>
                      💡 La vidéo est masquée, seul l'audio est disponible pour garder la réponse secrète
                    </div>
                  )}
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
                        ✅ Correct
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
                        ❌ Incorrect
                      </button>
                      <button
                        onClick={gameData.players[0] && gameData.players[0].id === player.id ? () => toggleCorrection(p.id, 'bonus') : undefined}
                        className={`btn ${corrections[p.id] === 'bonus' ? 'btn-warning' : ''}`}
                        style={{ 
                          padding: '5px 15px', 
                          fontSize: '0.9rem',
                          background: corrections[p.id] === 'bonus' ? '#ffd700' : 'rgba(255, 215, 0, 0.2)',
                          color: corrections[p.id] === 'bonus' ? '#000' : '#ffd700',
                          cursor: gameData.players[0] && gameData.players[0].id === player.id ? 'pointer' : 'default',
                          opacity: gameData.players[0] && gameData.players[0].id === player.id ? 1 : 0.7,
                          filter: gameData.players[0] && gameData.players[0].id === player.id ? 'none' : 'grayscale(20%)'
                        }}
                        disabled={!(gameData.players[0] && gameData.players[0].id === player.id)}
                      >
                        ⭐ +1 Bonus
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
                    Finaliser les corrections
                  </button>
                </div>
              )}
              
              {/* Message pour les non-chefs */}
              {gameData.players && (!gameData.players[0] || gameData.players[0].id !== player.id) && (
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
          <div>Score actuel: {(gameData.players && gameData.players.find(p => p.id === player.id)?.score) || 0} points</div>
        </div>
      </div>
    </div>
  );
};

export default Game;
