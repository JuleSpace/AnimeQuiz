import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ onBack, onRoomUpdate }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', musicLinks: [] });
  const [newLink, setNewLink] = useState({ url: '', answer: '' });
  const [editingRoom, setEditingRoom] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPopup, setShowPopup] = useState(null); // Pour les popups de détails
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des salles');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      setError('Le nom de la salle est requis');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/rooms', newRoom);
      setRooms([...rooms, response.data]);
      setNewRoom({ name: '', description: '', musicLinks: [] });
      setSuccess('Salle créée avec succès !');
      setError('');
      if (onRoomUpdate) onRoomUpdate(); // Notifier le parent
    } catch (error) {
      setError('Erreur lors de la création de la salle');
    } finally {
      setLoading(false);
    }
  };

  const addMusicLink = (roomId) => {
    if (!newLink.url.trim()) return;

    const room = rooms.find(r => r._id === roomId);
    if (room) {
      const updatedRoom = {
        ...room,
        musicLinks: [...room.musicLinks, { url: newLink.url.trim(), answer: newLink.answer.trim() }]
      };
      
      setRooms(rooms.map(r => r._id === roomId ? updatedRoom : r));
      setNewLink({ url: '', answer: '' });
    }
  };

  const removeMusicLink = (roomId, linkIndex) => {
    const room = rooms.find(r => r._id === roomId);
    if (room) {
      const updatedRoom = {
        ...room,
        musicLinks: room.musicLinks.filter((_, index) => index !== linkIndex)
      };
      
      setRooms(rooms.map(r => r._id === roomId ? updatedRoom : r));
    }
  };

  const handleRoomNameChange = (roomId, newName) => {
    setEditingRoom(prev => ({ ...prev, [roomId]: { ...prev[roomId], name: newName } }));
  };

  const handleRoomDescriptionChange = (roomId, newDescription) => {
    setEditingRoom(prev => ({ ...prev, [roomId]: { ...prev[roomId], description: newDescription } }));
  };

  const saveRoom = async (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    if (!room) return;

    try {
      setLoading(true);
      const updates = {
        musicLinks: room.musicLinks
      };
      
      // Ajouter les modifications de nom et description si elles existent
      if (editingRoom[roomId]?.name !== undefined) {
        updates.name = editingRoom[roomId].name;
      }
      if (editingRoom[roomId]?.description !== undefined) {
        updates.description = editingRoom[roomId].description;
      }
      
      await axios.put(`/api/rooms/${roomId}`, updates);
      setSuccess('Salle mise à jour avec succès !');
      setError('');
      
      // Recharger les salles pour afficher les modifications
      await fetchRooms();
      
      // Nettoyer l'état d'édition pour cette salle
      setEditingRoom(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/rooms/${roomId}`);
      setRooms(rooms.filter(r => r._id !== roomId));
      setSuccess('Salle supprimée avec succès !');
      setError('');
      if (onRoomUpdate) onRoomUpdate(); // Notifier le parent
    } catch (error) {
      setError('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-panel">
        {/* Header avec bouton retour */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <button 
            onClick={onBack} 
            className="btn" 
            style={{ 
              background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
              border: '2px solid rgba(255, 107, 107, 0.5)',
              boxShadow: '0 4px 15px rgba(201, 42, 42, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 42, 42, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 42, 42, 0.3)';
            }}
          >
            ← Retour
          </button>
          
          <h2 style={{ margin: 0, textAlign: 'center' }}>
            🛠️ Panneau Administrateur
          </h2>
          
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn btn-success"
            style={{ 
              background: 'linear-gradient(135deg, #51cf66, #40c057)',
              border: '2px solid rgba(81, 207, 102, 0.5)',
              boxShadow: '0 4px 15px rgba(81, 207, 102, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(81, 207, 102, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(81, 207, 102, 0.3)';
            }}
          >
            ➕ Nouvelle Salle
          </button>
        </div>

        {/* Formulaire de création de salle */}
        {showCreateForm && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.2), rgba(64, 192, 87, 0.2))',
            padding: '25px', 
            borderRadius: '20px',
            border: '2px solid rgba(81, 207, 102, 0.3)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#51cf66' }}>➕ Créer une nouvelle salle</h3>
            <input
              type="text"
              placeholder="Nom de la salle"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              className="input"
              style={{ marginBottom: '15px' }}
            />
            <input
              type="text"
              placeholder="Description (optionnel)"
              value={newRoom.description}
              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              className="input"
              style={{ marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={createRoom} className="btn btn-success" style={{ flex: 1 }}>
                Créer la salle
              </button>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="btn btn-danger"
                style={{ padding: '10px 20px' }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Grille des salles */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '25px' }}>📋 Salles existantes</h3>
          
          {rooms.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: '2px dashed rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎵</div>
              <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Aucune salle créée</p>
              <p style={{ opacity: 0.6 }}>Cliquez sur "Nouvelle Salle" pour commencer</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {rooms.map(room => (
                <div 
                  key={room._id} 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                    padding: '25px', 
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%' // Même hauteur pour toutes les cartes
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {/* Badge du nombre de musiques */}
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'rgba(255, 215, 0, 0.9)',
                    color: '#000',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    🎵 {room.musicLinks.length}
                  </div>

                  {/* Titre et description */}
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#ffd700', 
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    minHeight: '40px' // Hauteur fixe pour éviter le décalage
                  }}>
                    {room.name}
                  </h4>
                  
                  <div style={{ 
                    minHeight: '60px', // Hauteur fixe pour la description
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    {room.description && (
                      <p style={{ 
                        margin: 0, 
                        opacity: 0.9,
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 3, // Limite à 3 lignes
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {room.description}
                      </p>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    justifyContent: 'center',
                    marginTop: 'auto' // Pousse les boutons vers le bas
                  }}>
                    <button
                      onClick={() => setShowPopup(room)}
                      className="btn"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #00d4ff, #1e3a8a)',
                        border: '2px solid rgba(0, 212, 255, 0.5)',
                        boxShadow: '0 2px 10px rgba(0, 212, 255, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 212, 255, 0.3)';
                      }}
                    >
                      Voir Détails
                    </button>
                    
                    <button
                      onClick={() => setSelectedRoom(selectedRoom === room._id ? null : room._id)}
                      className="btn"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #ffd93d, #ff9800)',
                        border: '2px solid rgba(255, 217, 61, 0.5)',
                        boxShadow: '0 2px 10px rgba(255, 152, 0, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(255, 152, 0, 0.3)';
                      }}
                    >
                      ✏️ Modifier
                    </button>
                    
                    <button
                      onClick={() => deleteRoom(room._id)}
                      className="btn btn-danger"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
                        border: '2px solid rgba(255, 107, 107, 0.5)',
                        boxShadow: '0 2px 10px rgba(201, 42, 42, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 42, 42, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(201, 42, 42, 0.3)';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section d'édition avec système de cartes */}
        {selectedRoom && rooms.find(r => r._id === selectedRoom) && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ textAlign: 'center', color: '#ffd700', marginBottom: '25px' }}>
              ✏️ Modification de la salle
            </h3>
            
            {(() => {
              const room = rooms.find(r => r._id === selectedRoom);
              return (
                <div>
                  {/* Carte pour modifier les infos de base */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.2), rgba(255, 152, 0, 0.2))',
                    padding: '25px', 
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 217, 61, 0.3)',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: '#ffd700', marginBottom: '20px', textAlign: 'center' }}>
                      📝 Informations de base
                    </h4>
                    <input
                      type="text"
                      value={editingRoom[room._id]?.name !== undefined ? editingRoom[room._id].name : room.name}
                      onChange={(e) => handleRoomNameChange(room._id, e.target.value)}
                      className="input"
                      style={{ marginBottom: '15px' }}
                      placeholder="Nom de la salle"
                    />
                    <input
                      type="text"
                      value={editingRoom[room._id]?.description !== undefined ? editingRoom[room._id].description : (room.description || '')}
                      onChange={(e) => handleRoomDescriptionChange(room._id, e.target.value)}
                      className="input"
                      style={{ marginBottom: '20px' }}
                      placeholder="Description (optionnel)"
                    />
                  </div>

                  {/* Carte pour ajouter une musique */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.2), rgba(64, 192, 87, 0.2))',
                    padding: '25px', 
                    borderRadius: '20px',
                    border: '2px solid rgba(81, 207, 102, 0.3)',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ color: '#51cf66', marginBottom: '20px', textAlign: 'center' }}>
                      ➕ Ajouter une nouvelle musique
                    </h4>
                    <input
                      type="url"
                      placeholder="Lien YouTube ou audio..."
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="input"
                      style={{ marginBottom: '15px' }}
                    />
                    <input
                      type="text"
                      placeholder="Réponse (titre de la musique, artiste, etc.)"
                      value={newLink.answer}
                      onChange={(e) => setNewLink({ ...newLink, answer: e.target.value })}
                      className="input"
                      style={{ marginBottom: '20px' }}
                    />
                    <button
                      onClick={() => addMusicLink(room._id)}
                      className="btn btn-success"
                      style={{ padding: '12px 20px', width: '100%' }}
                    >
                      ➕ Ajouter cette musique
                    </button>
                  </div>

                  {/* Grille des musiques existantes */}
                  {room.musicLinks.length > 0 && (
                    <div>
                      <h4 style={{ color: '#ffd700', marginBottom: '20px', textAlign: 'center' }}>
                        🎵 Musiques existantes ({room.musicLinks.length})
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '15px',
                        marginBottom: '20px'
                      }}>
                        {room.musicLinks.map((link, index) => (
                          <div key={index} style={{ 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
                            padding: '20px', 
                            borderRadius: '15px',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}>
                            {/* Badge du numéro */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(255, 215, 0, 0.9)',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '15px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              #{index + 1}
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                              {(typeof link === 'object' && link.answer) ? (
                                <div>
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    color: '#ffd700', 
                                    marginBottom: '8px',
                                    fontSize: '1rem'
                                  }}>
                                    {link.answer}
                                  </div>
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    opacity: 0.7, 
                                    wordBreak: 'break-all',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '8px',
                                    borderRadius: '8px'
                                  }}>
                                    {link.url}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ 
                                  fontSize: '0.8rem', 
                                  opacity: 0.7, 
                                  wordBreak: 'break-all',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  padding: '8px',
                                  borderRadius: '8px'
                                }}>
                                  {typeof link === 'string' ? link : link.url}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => removeMusicLink(room._id, index)}
                              className="btn btn-danger"
                              style={{ 
                                padding: '8px 12px', 
                                fontSize: '0.8rem',
                                width: '100%',
                                background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
                                border: '2px solid rgba(255, 107, 107, 0.5)',
                                boxShadow: '0 2px 8px rgba(201, 42, 42, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 42, 42, 0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(201, 42, 42, 0.3)';
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boutons de sauvegarde */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    justifyContent: 'center',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '15px'
                  }}>
                    <button
                      onClick={() => saveRoom(room._id)}
                      className="btn btn-success"
                      style={{ 
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #51cf66, #40c057)',
                        border: '2px solid rgba(81, 207, 102, 0.5)',
                        boxShadow: '0 4px 15px rgba(81, 207, 102, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(81, 207, 102, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(81, 207, 102, 0.3)';
                      }}
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="btn btn-danger"
                      style={{ 
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
                        border: '2px solid rgba(255, 107, 107, 0.5)',
                        boxShadow: '0 4px 15px rgba(201, 42, 42, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 42, 42, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 42, 42, 0.3)';
                      }}
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Popup de détails */}
        {showPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
              padding: '30px',
              borderRadius: '20px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}>
              {/* Bouton fermer */}
              <button
                onClick={() => setShowPopup(null)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(255, 107, 107, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <h3 style={{ color: '#ffd700', marginBottom: '20px', textAlign: 'center' }}>
                👁️ Détails de la salle
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>📝 Informations</h4>
                <p><strong>Nom:</strong> {showPopup.name}</p>
                {showPopup.description && <p><strong>Description:</strong> {showPopup.description}</p>}
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}><strong>ID:</strong> {showPopup._id}</p>
              </div>

              <div>
                <h4 style={{ color: '#ffd700', marginBottom: '15px' }}>
                  🎵 Musiques ({showPopup.musicLinks.length})
                </h4>
                {showPopup.musicLinks.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                    Aucune musique ajoutée
                  </p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {showPopup.musicLinks.map((link, index) => (
                      <div key={index} style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: '8px' }}>
                          Musique {index + 1}
                        </div>
                        {(typeof link === 'object' && link.answer) && (
                          <div style={{ color: '#51cf66', marginBottom: '8px' }}>
                            <strong>Réponse:</strong> {link.answer}
                          </div>
                        )}
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, wordBreak: 'break-all' }}>
                          <strong>Lien:</strong> {typeof link === 'string' ? link : link.url}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages d'erreur/succès */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.2)',
            border: '2px solid rgba(255, 107, 107, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            color: '#ff6b6b',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div style={{
            background: 'rgba(81, 207, 102, 0.2)',
            border: '2px solid rgba(81, 207, 102, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            color: '#51cf66',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ✅ {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
