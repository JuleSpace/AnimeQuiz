import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuizAdmin from './QuizAdmin';
import QuizRules from './QuizRules';
import { BoosterPlayground } from './JokerCards';
import Icon from './ArcadeIcon';
import ConfirmPopup from './ConfirmPopup';

/** Superadmin : comptes joueurs et codes de réinitialisation de mot de passe. */
const PlayerAccounts = () => {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const load = async (query = q) => {
    try {
      const response = await axios.get(`/api/admin/accounts?q=${encodeURIComponent(query)}`);
      setList(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Impossible de charger les comptes joueurs');
    }
  };
  useEffect(() => { load(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = async (account) => {
    setConfirm(null);
    try {
      const response = await axios.post(`/api/admin/accounts/${account.id}/reset`);
      setIssued(response.data);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Réinitialisation impossible');
    }
  };
  const date = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  return (
    <div>
      <p className="adm-note">
        Un joueur a oublié son mot de passe ? Génère-lui un code ici et envoie-le-lui (Discord, message…). Il le saisit sur la page de connexion, dans « J’ai un code », et choisit un nouveau mot de passe. Le code marche une seule fois, pendant 48 h.
      </p>
      {issued && (
        <section className="adm-block adm-reset-code">
          <h3 className="adm-block-title"><Icon name="lock" bare />Code pour {issued.name}</h3>
          <p className="adm-code">{issued.code}</p>
          <p className="adm-note">Valable jusqu’au {new Date(issued.expires).toLocaleString('fr-FR')}. Il ne sera plus affiché ensuite : copie-le maintenant.</p>
          <div className="adm-actions">
            <button type="button" className="btn btn-quiet adm-mini" onClick={() => navigator.clipboard?.writeText(issued.code)}>Copier</button>
            <button type="button" className="btn btn-quiet adm-mini" onClick={() => setIssued(null)}>Fermer</button>
          </div>
        </section>
      )}
      <div className="adm-fields">
        <label className="adm-field">
          <span>Rechercher un joueur</span>
          <input className="input" placeholder="Pseudo" value={q} onChange={(event) => { setQ(event.target.value); load(event.target.value); }} />
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="adm-players">
        {list.map((account) => (
          <div key={account.id} className="adm-qrow">
            <div className="adm-qtext">
              <div className="adm-qprompt">{account.name}</div>
              <div className="adm-qmeta">
                {account.password ? 'Pseudo + mot de passe' : 'Discord uniquement'}{account.discord ? ` · Discord : ${account.discord}` : ''}
                {' · '}inscrit le {date(account.createdAt)} · vu le {date(account.lastLogin)}
                {account.resetPending ? ' · code en attente' : ''}
              </div>
            </div>
            <div className="adm-qactions">
              {account.password && (
                <button type="button" className="btn adm-mini" onClick={() => setConfirm(account)}>Réinitialiser le mot de passe</button>
              )}
            </div>
          </div>
        ))}
        {!list.length && !error && <p className="adm-note">Aucun compte trouvé.</p>}
      </div>
      {confirm && (
        <ConfirmPopup
          title={`Réinitialiser le mot de passe de ${confirm.name} ?`}
          message="Un code à usage unique sera créé. Son mot de passe actuel restera valable jusqu’à ce qu’il utilise le code ; à ce moment-là, ses autres sessions seront déconnectées."
          confirmLabel="Créer le code"
          onCancel={() => setConfirm(null)}
          onConfirm={() => reset(confirm)}
        />
      )}
    </div>
  );
};

const Accounts = ({ admin }) => {
  const [accounts, setAccounts] = useState([]);
  const [draft, setDraft] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    const response = await axios.get('/api/admins');
    setAccounts(response.data);
  };

  useEffect(() => {
    load().catch(() => setError('Impossible de charger les comptes'));
  }, []);

  const createAccount = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/admins', draft);
      setDraft({ username: '', password: '' });
      setSuccess('Admin créé');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Création impossible');
    } finally {
      setLoading(false);
    }
  };

  const removeAccount = async (username) => {
    setConfirm(null);
    setError('');
    try {
      await axios.delete(`/api/admins/${encodeURIComponent(username)}`);
      setSuccess(`${username} retiré`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Retrait impossible');
    }
  };

  return (
    <div>
      <p className="adm-note">
        {admin.username}, tu es le seul superadmin. Un admin ne modifie et ne supprime que les quiz et les salles musique qui lui sont attribués.
      </p>
      <section className="adm-block is-new">
        <h3 className="adm-block-title"><Icon name="plus" bare />Nouvel admin</h3>
        <div className="adm-fields">
          <label className="adm-field">
            <span>Nom</span>
            <input
              className="input"
              placeholder="Nom"
              value={draft.username}
              onChange={(event) => setDraft({ ...draft, username: event.target.value })}
            />
          </label>
          <label className="adm-field">
            <span>Mot de passe</span>
            <input
              className="input"
              type="password"
              placeholder="Mot de passe"
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            />
          </label>
        </div>
        <div className="adm-actions">
          <button type="button" className="btn btn-success" onClick={createAccount} disabled={loading}>
            <Icon name="check" />Créer l'admin
          </button>
        </div>
      </section>
      <h3 className="adm-section-title"><Icon name="crown" bare />Comptes <small>{accounts.length}</small></h3>
      <div className="adm-grid is-tight">
      {accounts.map((account) => (
        <article key={account.username} className={`adm-tile${account.role === 'super' ? ' is-super' : ''}`}>
          <h4 className="adm-tile-title">{account.username}</h4>
          <span className={`adm-role${account.role === 'super' ? ' is-super' : ''}`}>{account.role === 'super' ? 'Superadmin' : 'Admin'}</span>
          {account.role !== 'super' && (
            <div className="adm-actions">
            <button
              type="button"
              className="btn btn-danger adm-mini"
              onClick={() => setConfirm({
                title: `Retirer ${account.username} ?`,
                message: 'Ses quiz et ses salles musique redeviennent non attribués.',
                confirmLabel: 'Retirer',
                run: () => removeAccount(account.username)
              })}
            >
              <Icon name="trash" />Retirer
            </button>
            </div>
          )}
        </article>
      ))}
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      {confirm && (
        <ConfirmPopup
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const run = confirm.run;
            setConfirm(null);
            run();
          }}
        />
      )}
    </div>
  );
};

const AdminPanel = ({ onBack, onRoomUpdate, admin }) => {
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
  const [admins, setAdmins] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const canEditRoom = (room) => (
    admin?.role === 'super'
    || (room?.owner && room.owner.toLowerCase() === String(admin?.username || '').toLowerCase())
  );

  useEffect(() => {
    fetchRooms();
    if (admin?.role !== 'super') return;
    axios.get('/api/admins')
      .then((response) => setAdmins(response.data))
      .catch(() => setError('Impossible de charger les admins'));
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

  const assignRoomOwner = async (roomId, owner) => {
    setError('');
    try {
      await axios.put(`/api/rooms/${roomId}/owner`, { owner });
      setSuccess(owner ? `Salle donnée à ${owner}` : 'Salle retirée');
      await fetchRooms();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Attribution impossible');
    }
  };

  const deleteRoom = async (roomId) => {
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

  const isSuper = admin?.role === 'super';
  const TABS = [
    { id: 'music', icon: 'music', label: 'Music Quiz' },
    { id: 'quiz', icon: 'quiz', label: 'Quiz' },
    { id: 'rules', icon: 'rules', label: 'Règles' },
    { id: 'boosters', icon: 'booster', label: 'Boosters' },
    ...(isSuper ? [{ id: 'accounts', icon: 'crown', label: 'Comptes' }, { id: 'players', icon: 'pad', label: 'Joueurs' }] : [])
  ];

  const shell = (children, action = null) => (
    <div className="container adm">
      <div className="admin-panel adm-panel">
        <header className="adm-head">
          <button type="button" onClick={onBack} className="btn btn-quiet adm-back">
            <Icon name="back" />Retour
          </button>
          <div className="adm-title">
            <span className="adm-kicker">Atelier</span>
            <h2><Icon name="tools" />{admin?.username || 'Admin'}</h2>
            <span className={`adm-role${isSuper ? ' is-super' : ''}`}>{isSuper ? 'Superadmin' : 'Admin'}</span>
          </div>
          <div className="adm-head-action">{action}</div>
        </header>
        <nav className="adm-tabs" aria-label="Sections de l'atelier">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`adm-tab${section === tab.id ? ' is-on' : ''}`}
              aria-pressed={section === tab.id}
              onClick={() => setSection(tab.id)}
            >
              <Icon name={tab.icon} bare />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="adm-body">{children}</div>
      </div>
    </div>
  );

  if (section === 'boosters') return shell(<BoosterPlayground />);
  if (section === 'rules') return shell(<QuizRules />);
  if (section === 'accounts' && isSuper) return shell(<Accounts admin={admin} />);
  if (section === 'players' && isSuper) return shell(<PlayerAccounts />);
  if (section === 'quiz') return shell(<QuizAdmin admin={admin} />);

  if (loading) {
    return shell(<div className="loading">Chargement</div>);
  }

  const editingRoomData = selectedRoom ? rooms.find((r) => r._id === selectedRoom) : null;

  return shell(
    <>
      {showCreateForm && (
        <section className="adm-block is-new">
          <h3 className="adm-block-title"><Icon name="plus" bare />Nouvelle salle</h3>
          <div className="adm-fields">
            <label className="adm-field">
              <span>Nom</span>
              <input
                type="text"
                placeholder="Nom de la salle"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="input"
              />
            </label>
            <label className="adm-field">
              <span>Description</span>
              <input
                type="text"
                placeholder="Optionnel"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                className="input"
              />
            </label>
          </div>
          <p className="adm-note">
            {isSuper
              ? 'Une salle créée t\'est attribuée. Tu peux la donner à un admin : lui et toi seuls pourrez la modifier ou la supprimer.'
              : 'Une salle que tu crées t\'est attribuée. Tu modifies et tu supprimes seulement les tiennes.'}
          </p>
          <div className="adm-actions">
            <button type="button" onClick={createRoom} className="btn btn-success">
              <Icon name="check" />Créer la salle
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-quiet">
              Annuler
            </button>
          </div>
        </section>
      )}

      <h3 className="adm-section-title"><Icon name="list" bare />Salles musique <small>{rooms.length}</small></h3>

      {rooms.length === 0 ? (
        <div className="adm-empty">
          <Icon name="music" tone="hero" />
          <p>Aucune salle pour l'instant.</p>
          <small>« Nouvelle salle » en haut à droite pour commencer.</small>
        </div>
      ) : (
        <div className="adm-grid">
          {rooms.map((room) => {
            const editable = canEditRoom(room);
            return (
              <article key={room._id} className={`adm-tile${selectedRoom === room._id ? ' is-open' : ''}`}>
                <span className="adm-count"><Icon name="music" bare />{room.musicLinks.length}</span>
                <h4 className="adm-tile-title">{room.name}</h4>
                <p className="adm-tile-desc">{room.description || 'Sans description'}</p>
                <div className="adm-owner">
                  <Icon name="crown" bare />{room.owner ? room.owner : 'Non attribuée'}
                </div>
                {isSuper && (
                  <select
                    className="input adm-select"
                    value={room.owner || ''}
                    onChange={(event) => assignRoomOwner(room._id, event.target.value)}
                    aria-label="Attribuer la salle"
                  >
                    <option value="">Personne</option>
                    {admins.map((account) => (
                      <option key={account.username} value={account.username}>{account.username}</option>
                    ))}
                  </select>
                )}
                <div className="adm-actions">
                  <button type="button" onClick={() => setShowPopup(room)} className="btn btn-quiet adm-mini">
                    <Icon name="eye" />Détails
                  </button>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => setSelectedRoom(selectedRoom === room._id ? null : room._id)}
                      className="btn adm-mini"
                    >
                      <Icon name="pencil" />Modifier
                    </button>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => setConfirm({
                        title: 'Supprimer cette salle ?',
                        message: `« ${room.name} » et ses musiques disparaissent.`,
                        run: () => deleteRoom(room._id)
                      })}
                      className="btn btn-danger adm-mini adm-icon-only"
                      aria-label="Supprimer la salle"
                    >
                      <Icon name="trash" bare />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingRoomData && canEditRoom(editingRoomData) && (() => {
        const room = editingRoomData;
        return (
          <section className="adm-edit">
            <h3 className="adm-section-title"><Icon name="pencil" bare />Modifier « {room.name} »</h3>

            <div className="adm-block">
              <h4 className="adm-block-title"><Icon name="quiz" bare />Informations</h4>
              <div className="adm-fields">
                <label className="adm-field">
                  <span>Nom</span>
                  <input
                    type="text"
                    value={editingRoom[room._id]?.name !== undefined ? editingRoom[room._id].name : room.name}
                    onChange={(e) => handleRoomNameChange(room._id, e.target.value)}
                    className="input"
                    placeholder="Nom de la salle"
                  />
                </label>
                <label className="adm-field">
                  <span>Description</span>
                  <input
                    type="text"
                    value={editingRoom[room._id]?.description !== undefined ? editingRoom[room._id].description : (room.description || '')}
                    onChange={(e) => handleRoomDescriptionChange(room._id, e.target.value)}
                    className="input"
                    placeholder="Optionnel"
                  />
                </label>
              </div>
            </div>

            <div className="adm-block is-new">
              <h4 className="adm-block-title"><Icon name="plus" bare />Ajouter une musique</h4>
              <div className="adm-fields">
                <label className="adm-field">
                  <span>Lien</span>
                  <input
                    type="url"
                    placeholder="YouTube, playlist YouTube ou fichier audio"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="input"
                  />
                </label>
                <label className="adm-field">
                  <span>Réponse</span>
                  <input
                    type="text"
                    placeholder="Titre, artiste, anime…"
                    value={newLink.answer}
                    onChange={(e) => setNewLink({ ...newLink, answer: e.target.value })}
                    className="input"
                  />
                </label>
              </div>
              <div className="adm-actions">
                <button type="button" onClick={() => addMusicLink(room._id)} className="btn btn-success">
                  <Icon name="plus" />Ajouter cette musique
                </button>
                {/[?&]list=([A-Za-z0-9_-]+)/.test(newLink.url) && (
                  <button type="button" onClick={() => importPlaylist(room._id)} className="btn" disabled={importing}>
                    <Icon name="music" />{importing ? 'Lecture de la playlist…' : 'Importer la playlist'}
                  </button>
                )}
              </div>
              <p className="adm-note">
                Colle un lien de playlist YouTube pour ajouter toutes ses vidéos. Le titre de la vidéo devient la réponse, et tu peux le changer ensuite.
              </p>
            </div>

            {room.musicLinks.length > 0 && (
              <>
                <h4 className="adm-section-title is-sub"><Icon name="music" bare />Musiques <small>{room.musicLinks.length}</small></h4>
                <div className="adm-tracks">
                  {room.musicLinks.map((link, index) => (
                    <div key={index} className="adm-track">
                      <span className="adm-track-num">{index + 1}</span>
                      <input
                        type="text"
                        className="input"
                        placeholder="Réponse"
                        value={typeof link === 'string' ? '' : (link.answer || '')}
                        onChange={(event) => updateMusicLink(room._id, index, 'answer', event.target.value)}
                      />
                      <input
                        type="url"
                        className="input adm-track-url"
                        placeholder="Lien"
                        value={typeof link === 'string' ? link : (link.url || '')}
                        onChange={(event) => updateMusicLink(room._id, index, 'url', event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setConfirm({
                          title: 'Retirer cette musique ?',
                          message: 'Elle sort de la salle. Il reste à sauvegarder pour que ce soit définitif.',
                          run: () => removeMusicLink(room._id, index)
                        })}
                        className="btn btn-danger adm-mini adm-icon-only"
                        aria-label="Retirer cette musique"
                      >
                        <Icon name="trash" bare />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="adm-savebar">
              <span>Les changements de la salle ne sont pris en compte qu'à la sauvegarde.</span>
              <div className="adm-actions">
                <button type="button" onClick={() => saveRoom(room._id)} className="btn btn-success">
                  <Icon name="save" />Sauvegarder
                </button>
                <button type="button" onClick={() => setSelectedRoom(null)} className="btn btn-quiet">
                  <Icon name="cross" />Fermer
                </button>
              </div>
            </div>
          </section>
        );
      })()}

      {showPopup && (
        <div className="adm-modal" onClick={() => setShowPopup(null)}>
          <div className="adm-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="adm-close" onClick={() => setShowPopup(null)} aria-label="Fermer">
              <Icon name="cross" bare />
            </button>
            <span className="adm-kicker">Salle musique</span>
            <h3>{showPopup.name}</h3>
            {showPopup.description && <p className="adm-note">{showPopup.description}</p>}
            <p className="adm-id">ID {showPopup._id}</p>
            <h4 className="adm-section-title is-sub"><Icon name="music" bare />Musiques <small>{showPopup.musicLinks.length}</small></h4>
            {showPopup.musicLinks.length === 0 ? (
              <p className="adm-note">Aucune musique ajoutée.</p>
            ) : (
              <ol className="adm-modal-list">
                {showPopup.musicLinks.map((link, index) => (
                  <li key={index}>
                    <strong>{(typeof link === 'object' && link.answer) ? link.answer : 'Sans réponse'}</strong>
                    <span>{typeof link === 'string' ? link : link.url}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error"><Icon name="cross" />{error}</div>
      )}
      {success && (
        <div className="success"><Icon name="check" />{success}</div>
      )}
      {confirm && (
        <ConfirmPopup
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const run = confirm.run;
            setConfirm(null);
            run();
          }}
        />
      )}
    </>,
    <button type="button" onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-success">
      <Icon name="plus" />Nouvelle salle
    </button>
  );
};

export default AdminPanel;
