import React, { useState, useEffect } from 'react';
import Icon from './ArcadeIcon';

const Lobby = ({
  lobby,
  player,
  onStartGame,
  onLeave,
  onTransferLeadership,
  onSetTeamMode,
  onSetJokers,
  onChooseTeam,
  variant = 'music'
}) => {
  const [numberOfSongs, setNumberOfSongs] = useState(10);
  const [maxSongs, setMaxSongs] = useState(10);
  const isQuiz = variant === 'quiz';

  useEffect(() => {
    const pool = lobby?.totalQuestions || lobby?.totalSongs;
    if (pool) {
      setMaxSongs(pool);
      setNumberOfSongs(isQuiz ? pool : Math.min(10, pool));
    }
  }, [lobby, isQuiz]);

  if (!lobby || !player) return null;

  const isLeader = isQuiz ? lobby.hostId === player.id : lobby.players[0]?.id === player.id;
  const teamMode = Boolean(isQuiz && lobby.teamMode);
  const jokersOn = lobby.jokersEnabled !== false;
  const shadowPlayers = lobby.players.filter((entry) => entry.team === 'shadow');
  const sonicPlayers = lobby.players.filter((entry) => entry.team === 'sonic');
  const unassigned = lobby.players.filter((entry) => entry.team !== 'shadow' && entry.team !== 'sonic');
  const teamsReady = !teamMode || (
    unassigned.length === 0 && shadowPlayers.length > 0 && sonicPlayers.length > 0
  );
  const canStartGame = isQuiz
    ? isLeader && lobby.players.length >= 1 && teamsReady && !lobby.isGameStarted
    : lobby.players.length >= 1 && isLeader && !lobby.isGameStarted;

  const handleStartGame = () => {
    onStartGame(numberOfSongs);
  };

  return (
    <div className="container">
      <div className="card">
        {isQuiz && isLeader && !lobby.isGameStarted && (
          <button
            type="button"
            className="btn lobby-solo"
            onClick={() => onStartGame(numberOfSongs, { solo: true })}
          >
            Solo
          </button>
        )}
        {isQuiz && !lobby.isGameStarted && (
          teamMode ? (
            <div className="lobby-joker-switch">Sans jokers</div>
          ) : isLeader ? (
            <button
              type="button"
              className={`btn lobby-joker-switch${jokersOn ? ' is-on' : ''}`}
              onClick={() => onSetJokers && onSetJokers(!jokersOn)}
            >
              {jokersOn ? 'Jokers' : 'Sans jokers'}
            </button>
          ) : (
            <div className={`lobby-joker-switch${jokersOn ? ' is-on' : ''}`}>{jokersOn ? 'Jokers' : 'Sans jokers'}</div>
          )
        )}
        <h2 style={{ textAlign: 'center', marginBottom: '30px', padding: isQuiz ? '0 140px' : undefined }}>
          <Icon name="pad" tone="mark" />
          {isQuiz ? `Lobby — ${lobby.quizName || 'Quiz'}` : `Lobby — Salle ${player.roomId}`}
        </h2>
        
        <div className={`player-list${teamMode ? ' player-list-teams' : ''}`}>
          {isQuiz && lobby.hostName && (
            <div className="player-card leader">
              <div style={{ fontWeight: 'bold' }}>{lobby.hostName}</div>
              <div style={{ fontSize: '0.8rem' }}><Icon name="crown" />Chef · ne joue pas</div>
            </div>
          )}
          {teamMode ? (
            <>
              <div className="team-board">
                {[
                  { id: 'shadow', label: 'Team Shadow', members: shadowPlayers },
                  { id: 'sonic', label: 'Team Sonic', members: sonicPlayers }
                ].map((team) => (
                  <div key={team.id} className={`team-column team-${team.id}`}>
                    <div className="team-name">{team.label}</div>
                    {team.members.map((member) => (
                      <div key={member.id} className="player-card">
                        <div style={{ fontWeight: 'bold' }}>{member.username}</div>
                        {member.captain && <div style={{ fontSize: '0.8rem' }}>Chef d'équipe</div>}
                      </div>
                    ))}
                    {!isLeader && (
                      <button
                        type="button"
                        className={`btn${lobby.players.find((entry) => entry.id === player.id)?.team === team.id ? ' btn-danger' : ''}`}
                        onClick={() => onChooseTeam && onChooseTeam(team.id)}
                      >
                        {lobby.players.find((entry) => entry.id === player.id)?.team === team.id ? 'Ton équipe' : 'Rejoindre'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {unassigned.map((entry) => (
                <div key={entry.id} className="player-card">
                  <div style={{ fontWeight: 'bold' }}>{entry.username}</div>
                  <div style={{ fontSize: '0.8rem' }}>Sans équipe</div>
                </div>
              ))}
            </>
          ) : lobby.players.map((p, index) => (
            <div
              key={p.id}
              className={`player-card ${!isQuiz && index === 0 ? 'leader' : ''}`}
              onClick={() => {
                if (!isQuiz && isLeader && p.id !== player.id && onTransferLeadership) {
                  onTransferLeadership(p.id);
                }
              }}
              style={{
                cursor: !isQuiz && isLeader && p.id !== player.id ? 'pointer' : 'default',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isQuiz && isLeader && p.id !== player.id) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 35, 71, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isQuiz && isLeader && p.id !== player.id) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{p.username}</div>
              {!isQuiz && index === 0 && <div style={{ fontSize: '0.8rem' }}><Icon name="crown" />Chef</div>}
              {!isQuiz && isLeader && p.id !== player.id && (
                <div style={{ fontSize: '0.7rem', color: '#ff2347', marginTop: '5px', opacity: 0.8 }}>
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

          {isQuiz && isLeader && !lobby.isGameStarted && (
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                className={teamMode ? 'btn btn-danger' : 'btn'}
                onClick={() => onSetTeamMode && onSetTeamMode(!teamMode)}
              >
                {teamMode ? 'Équipes activées' : 'Jouer en équipe'}
              </button>
            </div>
          )}

          {teamMode && isLeader && lobby.players.length > 0 && !teamsReady && (
            <div style={{ color: '#ff2347', marginBottom: '20px' }}>
              Chaque joueur choisit Team Shadow ou Team Sonic. Les deux équipes doivent avoir au moins un joueur.
            </div>
          )}

          {teamMode && !isLeader && !lobby.players.find((entry) => entry.id === player.id)?.team && (
            <div style={{ color: '#ff2347', marginBottom: '20px' }}>
              Choisis Team Shadow ou Team Sonic.
            </div>
          )}
          
          {isQuiz && isLeader && lobby.players.length === 0 && (
            <div style={{ color: '#ff2347', marginBottom: '20px' }}>
              <Icon name="clock" tone="mark" />En attente d'au moins un joueur. Le chef ne répond pas.
            </div>
          )}

          {isQuiz && !isLeader && !lobby.isGameStarted && (
            <div style={{ color: '#ff2347', marginBottom: '20px' }}>
              <Icon name="clock" tone="mark" />En attente que le chef démarre la partie...
            </div>
          )}

          {!isQuiz && lobby.players.length < 2 && !isLeader && (
            <div style={{ color: '#ff2347', marginBottom: '20px' }}>
              <Icon name="clock" tone="mark" />En attente d'un autre joueur...
            </div>
          )}
          
          {!isQuiz && lobby.players.length === 1 && isLeader && (
            <div style={{ color: '#51cf66', marginBottom: '20px' }}>
              <Icon name="check" tone="cyan" />Mode solo activé — vous pouvez démarrer !
            </div>
          )}

          {isLeader && lobby.players.length >= 1 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                {isQuiz ? <><Icon name="quiz" tone="mark" />Nombre de questions</> : <><Icon name="music" tone="cyan" />Nombre de musiques à jouer</>}
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
              <Icon name="go" />Démarrer la partie
            </button>
          )}

          {!isQuiz && !canStartGame && lobby.players.length >= 2 && !isLeader && (
            <div style={{ color: '#ff2347' }}>
              <Icon name="clock" tone="mark" />En attente que le chef démarre la partie...
            </div>
          )}

          {!isQuiz && !canStartGame && lobby.players.length >= 2 && isLeader && (
            <div style={{ color: '#51cf66' }}>
              <Icon name="check" tone="cyan" />Prêt à démarrer !
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={onLeave} className="btn btn-danger">
            <Icon name="exit" />Quitter le lobby
          </button>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '15px' }}>
          <h3 style={{ marginBottom: '15px' }}><Icon name="rules" tone="mark" />Règles du jeu</h3>
          {isQuiz ? (
            <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
              <li>Seul dans la salle, le chef peut lancer un solo : il répond, puis se note avec la réponse prévue</li>
              <li>Le chef ne joue pas : il lance la partie et passe à la question suivante</li>
              <li>Choix multiple, choix d'images, vrai/faux, texte libre, blind test en écoute libre ou en choix multiple, paroles sur un extrait, who's that, classement ou placement sur une frise et un schéma</li>
              <li>Rien n'est corrigé tout seul : le chef valide chaque réponse</li>
              <li>Il choisit les points, et peut ajouter +1 pour une blague</li>
              <li>Un seul indice par question : −1 pt, sauf avec la carte Indice gratuit. Le chef peut envoyer plusieurs messages à ce joueur</li>
              <li>Dès 20 questions, cinq boosters (tous les 20 %). De 10 à 19, deux. En dessous, un seul. Le chef peut couper les jokers avant de lancer. Pas de jokers en équipe</li>
              <li>Un joueur peut rejoindre en cours de route. Il pioche un booster tout de suite, puis les suivants avec les autres. En équipe, il choisit seulement son équipe</li>
              <li>Le chef voit les cartes, si elles sont jouées, et qui est visé. Les autres joueurs non</li>
              <li>Le chef peut lancer une partie en équipe. Team Shadow et Team Sonic se forment toutes seules, le premier arrivé envoie la réponse</li>
              <li>Le joueur avec le plus de points gagne</li>
            </ul>
          ) : (
            <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
              <li>Écoutez les extraits musicaux</li>
              <li>Écrivez votre réponse dans le champ</li>
              <li>Après chaque question, corrigez les réponses des autres joueurs</li>
              <li>Les points sont calculés automatiquement</li>
              <li>Le joueur avec le plus de points gagne !</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
