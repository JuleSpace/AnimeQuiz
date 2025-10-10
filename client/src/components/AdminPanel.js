import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ onBack, onRoomUpdate }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', musicLinks: [] });
  const [newLink, setNewLink] = useState('');
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
    if (!newLink.trim()) return;

    const room = rooms.find(r => r._id === roomId);
    if (room) {
      const updatedRoom = {
        ...room,
        musicLinks: [...room.musicLinks, newLink.trim()]
      };
      
      setRooms(rooms.map(r => r._id === roomId ? updatedRoom : r));
      setNewLink('');
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

  const saveRoom = async (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    if (!room) return;

    try {
      setLoading(true);
      await axios.put(`/api/rooms/${roomId}`, { musicLinks: room.musicLinks });
      setSuccess('Salle mise à jour avec succès !');
      setError('');
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

        <button onClick={onBack} className="btn" style={{ marginBottom: '20px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{room.name}</h4>
                      {room.description && (
                        <p style={{ margin: '0', opacity: 0.8, fontSize: '0.9rem' }}>{room.description}</p>
                      )}
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#ffd700' }}>
                        ID: {room._id}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedRoom(selectedRoom === room._id ? null : room._id)}
                        className="btn"
                        style={{ padding: '5px 15px', fontSize: '0.9rem' }}
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
                      <div className="music-link">
                        <input
                          type="url"
                          placeholder="Coller un lien YouTube ou audio ici..."
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          className="input"
                          style={{ margin: '0' }}
                        />
                        <button
                          onClick={() => addMusicLink(room._id)}
                          className="btn btn-success"
                          style={{ padding: '10px 15px' }}
                        >
                          Ajouter
                        </button>
                      </div>

                      {/* Liste des liens existants */}
                      {room.musicLinks.map((link, index) => (
                        <div key={index} className="music-link">
                          <span style={{ flex: 1, wordBreak: 'break-all' }}>
                            {link}
                          </span>
                          <button
                            onClick={() => removeMusicLink(room._id, index)}
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                          >
                            Supprimer
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
