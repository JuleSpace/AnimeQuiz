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
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🛠️ Panneau Administrateur
        </h2>

        <button 
          onClick={onBack} 
          className="btn" 
          style={{ 
            marginBottom: '20px',
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
          ← Retour au menu
        </button>

        {/* Créer une nouvelle salle */}
        <div className="card">
          <h3>➕ Créer une nouvelle salle</h3>
          <input
            type="text"
            placeholder="Nom de la salle"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Description (optionnel)"
            value={newRoom.description}
            onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
            className="input"
          />
          <button onClick={createRoom} className="btn btn-success">
            Créer la salle
          </button>
        </div>

        {/* Liste des salles */}
        <div className="card">
          <h3>📋 Salles existantes</h3>
          {rooms.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.8, padding: '20px' }}>
              Aucune salle créée
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {rooms.map(room => (
                <div key={room._id} style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '20px', 
                  borderRadius: '15px',
                  border: selectedRoom === room._id ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      {selectedRoom === room._id ? (
                        <>
                          <input
                            type="text"
                            value={editingRoom[room._id]?.name !== undefined ? editingRoom[room._id].name : room.name}
                            onChange={(e) => handleRoomNameChange(room._id, e.target.value)}
                            className="input"
                            style={{ marginBottom: '10px', fontSize: '1rem', fontWeight: 'bold' }}
                            placeholder="Nom de la salle"
                          />
                          <input
                            type="text"
                            value={editingRoom[room._id]?.description !== undefined ? editingRoom[room._id].description : (room.description || '')}
                            onChange={(e) => handleRoomDescriptionChange(room._id, e.target.value)}
                            className="input"
                            style={{ marginBottom: '10px', fontSize: '0.9rem' }}
                            placeholder="Description (optionnel)"
                          />
                        </>
                      ) : (
                        <>
                          <h4 style={{ margin: '0 0 5px 0' }}>{room.name}</h4>
                          {room.description && (
                            <p style={{ margin: '0', opacity: 0.8, fontSize: '0.9rem' }}>{room.description}</p>
                          )}
                        </>
                      )}
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#ffd700' }}>
                        ID: {room._id}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedRoom(selectedRoom === room._id ? null : room._id)}
                        className="btn"
                        style={{ 
                          padding: '5px 15px', 
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
                        {selectedRoom === room._id ? 'Masquer' : 'Modifier'}
                      </button>
                      <button
                        onClick={() => deleteRoom(room._id)}
                        className="btn btn-danger"
                        style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>Liens musicaux ({room.musicLinks.length})</strong>
                  </div>

                  {selectedRoom === room._id && (
                    <div>
                      {/* Ajouter un nouveau lien */}
                      <div style={{ marginBottom: '15px' }}>
                        <input
                          type="url"
                          placeholder="Lien YouTube ou audio..."
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          className="input"
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="text"
                          placeholder="Réponse (titre de la musique, artiste, etc.)"
                          value={newLink.answer}
                          onChange={(e) => setNewLink({ ...newLink, answer: e.target.value })}
                          className="input"
                          style={{ marginBottom: '10px' }}
                        />
                        <button
                          onClick={() => addMusicLink(room._id)}
                          className="btn btn-success"
                          style={{ padding: '10px 15px', width: '100%' }}
                        >
                          ➕ Ajouter cette musique
                        </button>
                      </div>

                      {/* Liste des liens existants */}
                      {room.musicLinks.map((link, index) => (
                        <div key={index} style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          padding: '15px', 
                          borderRadius: '10px', 
                          marginBottom: '10px'
                        }}>
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#ffd700' }}>Musique {index + 1}</strong>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>Lien: </span>
                            <span style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                              {typeof link === 'string' ? link : link.url}
                            </span>
                          </div>
                          {(typeof link === 'object' && link.answer) && (
                            <div style={{ marginBottom: '10px' }}>
                              <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>Réponse: </span>
                              <span style={{ color: '#51cf66', fontSize: '0.9rem' }}>
                                {link.answer}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => removeMusicLink(room._id, index)}
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '0.8rem', width: '100%' }}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => saveRoom(room._id)}
                        className="btn btn-success"
                        style={{ marginTop: '15px' }}
                      >
                        💾 Sauvegarder les modifications
                      </button>
                    </div>
                  )}

                  {selectedRoom !== room._id && (
                    <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                      {room.musicLinks.length === 0 
                        ? 'Aucun lien musical configuré'
                        : `${room.musicLinks.length} lien(s) configuré(s)`
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card">
          <h3>📖 Instructions</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li>Créez des salles pour organiser vos quiz</li>
            <li>Ajoutez des liens YouTube ou des fichiers audio</li>
            <li>Les joueurs utiliseront l'ID de la salle pour se connecter</li>
            <li>Vous pouvez modifier les liens à tout moment</li>
            <li>Assurez-vous que les liens sont accessibles publiquement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
