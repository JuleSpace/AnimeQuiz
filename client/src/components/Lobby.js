import React, { useState, useEffect } from 'react';

const Lobby = ({ lobby, player, onStartGame, onLeave, onTransferLeadership }) => {
  const [numberOfSongs, setNumberOfSongs] = useState(10);
  const [maxSongs, setMaxSongs] = useState(10);

  useEffect(() => {
    // Récupérer le nombre total de musiques dans la salle
    if (lobby && lobby.totalSongs) {
      setMaxSongs(lobby.totalSongs);
      setNumberOfSongs(Math.min(10, lobby.totalSongs));
    }
  }, [lobby]);

  if (!lobby || !player) return null;

  const isLeader = lobby.players[0]?.id === player.id;
  const canStartGame = lobby.players.length >= 1 && isLeader && !lobby.isGameStarted;

  const handleStartGame = () => {
    onStartGame(numberOfSongs);
  };

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🎮 Lobby - Salle {player.roomId}
        </h2>
        
        <div className="player-list">
          {lobby.players.map((p, index) => (
            <div 
              key={p.id} 
              className={`player-card ${index === 0 ? 'leader' : ''}`}
              onClick={() => {
                // Si je suis le chef et que je clique sur un autre joueur, lui transférer le leadership
                if (isLeader && p.id !== player.id && onTransferLeadership) {
                  onTransferLeadership(p.id);
                }
              }}
              style={{
                cursor: isLeader && p.id !== player.id ? 'pointer' : 'default',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (isLeader && p.id !== player.id) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (isLeader && p.id !== player.id) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{p.username}</div>
              {index === 0 && <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>👑 Chef</div>}
              {isLeader && p.id !== player.id && (
                <div style={{ fontSize: '0.7rem', color: '#ffd700', marginTop: '5px', opacity: 0.8 }}>
                  Cliquer pour transmettre
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Joueurs connectés: {lobby.players.length}/∞
          </div>
          
          {lobby.players.length < 2 && !isLeader && (
            <div style={{ color: '#ffd700', marginBottom: '20px' }}>
              ⏳ En attente d'un autre joueur...
            </div>
          )}
          
          {lobby.players.length === 1 && isLeader && (
            <div style={{ color: '#51cf66', marginBottom: '20px' }}>
              ✅ Mode solo activé - Vous pouvez démarrer !
            </div>
          )}

          {isLeader && lobby.players.length >= 1 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                🎵 Nombre de musiques à jouer :
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <input
                  type="number"
                  min="1"
                  max={maxSongs}
                  value={numberOfSongs}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= maxSongs) {
                      setNumberOfSongs(value);
                    }
                  }}
                  className="input"
                  style={{ 
                    width: '100px', 
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    padding: '10px'
                  }}
                />
                <span style={{ opacity: 0.8 }}>/ {maxSongs} disponibles</span>
              </div>
            </div>
          )}

          {canStartGame && (
            <button onClick={handleStartGame} className="btn btn-success">
              🚀 Démarrer la Partie
            </button>
          )}

          {!canStartGame && lobby.players.length >= 2 && !isLeader && (
            <div style={{ color: '#ffd700' }}>
              ⏳ En attente que le chef démarre la partie...
            </div>
          )}

          {!canStartGame && lobby.players.length >= 2 && isLeader && (
            <div style={{ color: '#51cf66' }}>
              ✅ Prêt à démarrer !
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={onLeave} className="btn btn-danger">
            Quitter le Lobby
          </button>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '15px' }}>
          <h3 style={{ marginBottom: '15px' }}>📋 Règles du jeu :</h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <li>Écoutez les extraits musicaux</li>
            <li>Écrivez votre réponse dans le champ</li>
            <li>Après chaque question, corrigez les réponses des autres joueurs</li>
            <li>Les points sont calculés automatiquement</li>
            <li>Le joueur avec le plus de points gagne !</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
