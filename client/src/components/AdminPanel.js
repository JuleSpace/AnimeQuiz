import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuizAdmin from './QuizAdmin';
import QuizRules from './QuizRules';
import { BoosterPlayground } from './JokerCards';
import Icon from './ArcadeIcon';

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
  const [section, setSection] = useState('music');
  const [importing, setImporting] = useState(false);

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

  const updateMusicLink = (roomId, linkIndex, field, value) => {
    setRooms(rooms.map((room) => {
      if (room._id !== roomId) return room;
      const musicLinks = room.musicLinks.map((link, index) => {
        if (index !== linkIndex) return link;
        const current = typeof link === 'string' ? { url: link, answer: '' } : { url: link?.url || '', answer: link?.answer || '' };
        return { ...current, [field]: value };
      });
      return { ...room, musicLinks };
    }));
  };

  const importPlaylist = async (roomId) => {
    const source = newLink.url.trim();
    if (!source) return;
    const room = rooms.find((entry) => entry._id === roomId);
    if (!room) return;

    try {
      setImporting(true);
      setError('');
      const response = await axios.post('/api/youtube-playlist', { url: source });
      const known = new Set(room.musicLinks.map((link) => {
        const url = typeof link === 'string' ? link : (link?.url || '');
        const match = String(url).match(/(?:youtu\.be\/|shorts\/|embed\/|v\/|watch\?v=|&v=)([A-Za-z0-9_-]{11})/);
        return match ? match[1] : url;
      }));
      const fresh = (response.data.tracks || []).filter((track) => {
        const match = String(track.url || '').match(/[?&]v=([A-Za-z0-9_-]{11})/);
        const id = match ? match[1] : track.url;
        if (!id || known.has(id)) return false;
        known.add(id);
        return true;
      });
      if (!fresh.length) {
        setError('Ces musiques sont déjà dans la salle.');
        return;
      }
      setRooms(rooms.map((entry) => (
        entry._id === roomId ? { ...entry, musicLinks: [...entry.musicLinks, ...fresh] } : entry
      )));
      setNewLink({ url: '', answer: '' });
      const playlistName = response.data.title ? ` depuis « ${response.data.title} »` : '';
      const truncated = response.data.truncated ? ' La playlist continue, les 400 premières ont été prises.' : '';
      setSuccess(`${fresh.length} musiques ajoutées${playlistName}. Le titre YouTube est proposé comme réponse : tu peux le modifier, puis enregistrer.${truncated}`);
    } catch (error) {
      setError(error.response?.data?.error || "Impossible de lire cette playlist.");
    } finally {
      setImporting(false);
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

  const sectionTabs = (
    <div className="admin-tabs">
      <button type="button" className={`btn ${section === 'music' ? 'tab-active' : ''}`} onClick={() => setSection('music')}>
        <Icon name="music" />Music Quiz
      </button>
      <button type="button" className={`btn ${section === 'quiz' ? 'tab-active' : ''}`} onClick={() => setSection('quiz')}>
        <Icon name="quiz" />Quiz
      </button>
      <button type="button" className={`btn ${section === 'rules' ? 'tab-active' : ''}`} onClick={() => setSection('rules')}>
        <Icon name="rules" />Règles
      </button>
      <button type="button" className={`btn ${section === 'boosters' ? 'tab-active' : ''}`} onClick={() => setSection('boosters')}>
        <Icon name="booster" />Boosters
      </button>
    </div>
  );

  if (section === 'boosters') {
    return (
      <div className="container">
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={onBack} className="btn btn-danger"><Icon name="back" />Retour</button>
            <h2 style={{ margin: 0 }}><Icon name="tools" tone="mark" />Panneau administrateur</h2>
            <div style={{ width: 110 }} />
          </div>
          {sectionTabs}
          <BoosterPlayground />
        </div>
      </div>
    );
  }

  if (section === 'rules') {
    return (
      <div className="container">
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={onBack} className="btn btn-danger"><Icon name="back" />Retour</button>
            <h2 style={{ margin: 0 }}><Icon name="tools" tone="mark" />Panneau administrateur</h2>
            <div style={{ width: 110 }} />
          </div>
          {sectionTabs}
          <QuizRules />
        </div>
      </div>
    );
  }

  if (section === 'quiz') {
    return (
      <div className="container">
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={onBack} className="btn btn-danger"><Icon name="back" />Retour</button>
            <h2 style={{ margin: 0 }}><Icon name="tools" tone="mark" />Panneau administrateur</h2>
            <div style={{ width: 110 }} />
          </div>
          {sectionTabs}
          <QuizAdmin />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="admin-panel">
          {sectionTabs}
          <div className="loading">
            <div className="spinner"></div>
            <div>Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-panel">
        {/* Header avec bouton retour */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <button type="button" onClick={onBack} className="btn btn-danger">
            <Icon name="back" />Retour
          </button>
          
          <h2 style={{ margin: 0, textAlign: 'center' }}>
            <Icon name="tools" tone="mark" />Panneau administrateur
          </h2>
          
          <button type="button" onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-success">
            <Icon name="plus" />Nouvelle salle
          </button>
        </div>

        {sectionTabs}

        {/* Formulaire de création de salle */}
        {showCreateForm && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.2), rgba(64, 192, 87, 0.2))',
            padding: '25px', 
            borderRadius: '20px',
            border: '2px solid rgba(81, 207, 102, 0.3)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#51cf66' }}><Icon name="plus" />Créer une nouvelle salle</h3>
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
          <h3 style={{ textAlign: 'center', marginBottom: '25px' }}><Icon name="list" tone="mark" />Salles existantes</h3>
          
          {rooms.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: '2px dashed rgba(255, 255, 255, 0.3)'
            }}>
              <Icon name="music" tone="hero" />
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
                    background: '#14141c',
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
                    e.currentTarget.style.boxShadow = '6px 6px 0 #ff2347';
                    e.currentTarget.style.borderColor = '#ff2347';
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
                    background: 'rgba(255, 35, 71, 0.9)',
                    color: '#000',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    <Icon name="music" bare /> {room.musicLinks.length}
                  </div>

                  {/* Titre et description */}
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#ff2347', 
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
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      Voir Détails
                    </button>
                    
                    <button
                      onClick={() => setSelectedRoom(selectedRoom === room._id ? null : room._id)}
                      className="btn btn-quiet"
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      <Icon name="pencil" />Modifier
                    </button>
                    
                    <button
                      onClick={() => deleteRoom(room._id)}
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      <Icon name="trash" bare />
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
            <h3 style={{ textAlign: 'center', color: '#ff2347', marginBottom: '25px' }}>
              <Icon name="pencil" tone="mark" />Modification de la salle
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
                    <h4 style={{ color: '#ff2347', marginBottom: '20px', textAlign: 'center' }}>
                      <Icon name="quiz" />Informations de base
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
                      <Icon name="plus" />Ajouter une nouvelle musique
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
                      <Icon name="plus" />Ajouter cette musique
                    </button>
                    {/[?&]list=([A-Za-z0-9_-]+)/.test(newLink.url) && (
                      <button
                        type="button"
                        onClick={() => importPlaylist(room._id)}
                        className="btn"
                        disabled={importing}
                        style={{ padding: '12px 20px', width: '100%', marginTop: '10px' }}
                      >
                        <Icon name="music" />{importing ? 'Lecture de la playlist…' : 'Importer la playlist'}
                      </button>
                    )}
                    <p style={{ margin: '14px 0 0', opacity: 0.8, textAlign: 'center' }}>
                      Colle un lien de playlist YouTube pour ajouter toutes ses vidéos. Le titre de la vidéo devient la réponse, et tu peux le changer ensuite.
                    </p>
                  </div>

                  {/* Grille des musiques existantes */}
                  {room.musicLinks.length > 0 && (
                    <div>
                      <h4 style={{ color: '#ff2347', marginBottom: '20px', textAlign: 'center' }}>
                        <Icon name="music" tone="mark" />Musiques existantes ({room.musicLinks.length})
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '15px',
                        marginBottom: '20px'
                      }}>
                        {room.musicLinks.map((link, index) => (
                          <div key={index} style={{ 
                            background: '#14141c',
                            padding: '16px', 
                            borderRadius: '15px',
                            border: '2px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: '8px', color: '#ffd000' }}>
                              #{index + 1}
                            </div>
                            <input
                              type="text"
                              className="input"
                              style={{ margin: '0 0 8px' }}
                              placeholder="Réponse"
                              value={typeof link === 'string' ? '' : (link.answer || '')}
                              onChange={(event) => updateMusicLink(room._id, index, 'answer', event.target.value)}
                            />
                            <input
                              type="url"
                              className="input"
                              style={{ margin: '0 0 12px', fontSize: '0.85rem' }}
                              placeholder="Lien"
                              value={typeof link === 'string' ? link : (link.url || '')}
                              onChange={(event) => updateMusicLink(room._id, index, 'url', event.target.value)}
                            />
                            
                            <button
                              onClick={() => removeMusicLink(room._id, index)}
                              className="btn btn-danger"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%' }}
                            >
                              <Icon name="trash" />Supprimer
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
                      <Icon name="save" />Sauvegarder
                    </button>
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="btn btn-danger"
                      style={{ padding: '12px 24px' }}
                    >
                      <Icon name="cross" />Annuler
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
              background: '#12121a',
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

              <h3 style={{ color: '#ff2347', marginBottom: '20px', textAlign: 'center' }}>
                <Icon name="eye" tone="mark" />Détails de la salle
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#ff2347', marginBottom: '10px' }}><Icon name="quiz" />Informations</h4>
                <p><strong>Nom:</strong> {showPopup.name}</p>
                {showPopup.description && <p><strong>Description:</strong> {showPopup.description}</p>}
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}><strong>ID:</strong> {showPopup._id}</p>
              </div>

              <div>
                <h4 style={{ color: '#ff2347', marginBottom: '15px' }}>
                  <Icon name="music" />Musiques ({showPopup.musicLinks.length})
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
                        <div style={{ fontWeight: 'bold', color: '#ff2347', marginBottom: '8px' }}>
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
          <div className="error" style={{ textAlign: 'center' }}>
            <Icon name="cross" />{error}
          </div>
        )}

        {success && (
          <div className="success" style={{ textAlign: 'center' }}>
            <Icon name="check" />{success}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
