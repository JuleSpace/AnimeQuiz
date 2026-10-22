/**
 * Compte joueur (connexion Discord) côté client : qui est connecté, sauvegardes en ligne,
 * envoi des parties et classements.
 */
import React, { useEffect, useRef, useState } from 'react';
import './account.css';

const BASE = process.env.REACT_APP_SERVER_URL || '';
const call = async (path, opts = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...opts,
    headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) }
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

// Un seul appel /api/me partagé par tous les composants
let cache = null;
let pending = null;
const listeners = new Set();
const publish = (v) => { cache = v; listeners.forEach((fn) => fn(v)); };
const fetchAccount = () => {
  if (!pending) {
    pending = Promise.all([
      call('/api/auth/config').catch(() => ({ discord: false })),
      call('/api/me').catch(() => ({ user: null }))
    ]).then(([c, me]) => { const v = { enabled: !!c.discord, user: me.user || null, ready: true }; publish(v); return v; });
  }
  return pending;
};

/** { ready, enabled, user } — user = { id, name, avatar } ou null. */
export const useAccount = () => {
  const [state, setState] = useState(cache || { ready: false, enabled: false, user: null });
  useEffect(() => {
    listeners.add(setState);
    fetchAccount();
    return () => { listeners.delete(setState); };
  }, []);
  return state;
};

export const loginWithDiscord = (returnHash = window.location.hash) => {
  window.location.href = `${BASE}/auth/discord?return=${encodeURIComponent(returnHash || '')}`;
};
export const logout = async () => {
  try { await call('/api/logout', { method: 'POST' }); } catch { /* hors ligne */ }
  pending = null;
  publish({ ...(cache || {}), user: null, ready: true });
};

export const deleteAccount = async () => {
  await call('/api/me', { method: 'DELETE' });
  pending = null;
  publish({ ...(cache || {}), user: null, ready: true });
};

export const cloudLoad = (game) => call(`/api/me/save/${game}`).catch(() => null);
export const cloudSave = (game, save) => call(`/api/me/save/${game}`, { method: 'PUT', body: JSON.stringify({ save }) }).catch(() => null);
export const postRun = (game, run) => call(`/api/runs/${game}`, { method: 'POST', body: JSON.stringify({ run }) }).catch(() => null);
export const fetchLeaderboard = (game, gen = 1) => call(`/api/leaderboard/${game}?gen=${gen}`).catch(() => ({ fastest: [], kills: [], endless: [] }));

/**
 * Synchronise une progression locale avec le compte :
 * au premier passage, on garde la plus avancée des deux (`score` = Poussière totale gagnée, par exemple),
 * puis chaque changement est renvoyé au serveur (regroupé toutes les 2 s).
 */
export const useCloudSync = (game, meta, apply, score) => {
  const { user } = useAccount();
  const synced = useRef(null);
  const timer = useRef(0);
  useEffect(() => {
    if (!user || synced.current === user.id) return;
    synced.current = user.id;
    cloudLoad(game).then((res) => {
      const remote = res?.save;
      if (remote && score(remote) > score(meta)) apply(remote);
      else cloudSave(game, meta);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user || synced.current !== user.id) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => cloudSave(game, meta), 2000);
    return () => clearTimeout(timer.current);
  }, [meta, user, game]);
  return user;
};

const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.2a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9 0 13.5.3 18a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.6ZM8.5 15.2c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Z" />
  </svg>
);

/** Pastille de compte : bouton « Connexion Discord » ou avatar + pseudo. */
export const AccountChip = ({ returnHash, compact = false, className = '' }) => {
  const { ready, enabled, user } = useAccount();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!ready || !enabled) return null;
  if (!user) {
    return (
      <button type="button" className={`acc-chip is-login ${className}`} onClick={() => loginWithDiscord(returnHash)}>
        <DiscordLogo /><span>{compact ? 'Connexion' : 'Se connecter avec Discord'}</span>
      </button>
    );
  }
  return (
    <span className={`acc-chip-wrap ${className}`}>
      <button type="button" className="acc-chip" onClick={() => setOpen((v) => !v)} aria-expanded={open} title="Compte Discord">
        <img src={user.avatar} alt="" referrerPolicy="no-referrer" /><span>{user.name}</span>
      </button>
      {open && (
        <span className="acc-menu">
          <small>Ta progression est sauvegardée sur ton compte.</small>
          <button type="button" onClick={() => { setOpen(false); logout(); }}>Se déconnecter</button>
          {confirmDelete ? (
            <span className="acc-danger">
              <small>Supprimer ton compte, ta sauvegarde en ligne et tes scores ? C’est définitif.</small>
              <span>
                <button type="button" className="is-ghost" onClick={() => setConfirmDelete(false)}>Annuler</button>
                <button type="button" onClick={() => { setOpen(false); setConfirmDelete(false); deleteAccount().catch(() => {}); }}>Supprimer</button>
              </span>
            </span>
          ) : (
            <button type="button" className="is-ghost" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</button>
          )}
          <span className="acc-legal"><a href="/#terms">Conditions</a> · <a href="/#privacy">Confidentialité</a></span>
        </span>
      )}
    </span>
  );
};

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Classement d'un jeu (Swarm, Poké Rush), par région. */
export const Leaderboard = ({ game, gens = [{ id: 1, name: 'Kanto' }], partnerName = (id) => id }) => {
  const { enabled, user } = useAccount();
  const [gen, setGen] = useState(gens[0]?.id || 1);
  const [board, setBoard] = useState(null);
  const [tab, setTab] = useState('fastest');
  useEffect(() => {
    let alive = true;
    setBoard(null);
    fetchLeaderboard(game, gen).then((b) => { if (alive) setBoard(b); });
    return () => { alive = false; };
  }, [game, gen]);
  const tabs = [['fastest', 'Victoires les plus rapides'], ['kills', 'Plus de K.O.'], ...(game === 'swarm' ? [['endless', 'Survie infinie']] : [])];
  const rows = board?.[tab] || [];
  return (
    <div className="acc-board">
      {!enabled && <p className="acc-note">Le classement s’active quand la connexion Discord est configurée sur le serveur.</p>}
      {enabled && !user && (
        <p className="acc-note">
          Connecte-toi avec Discord pour apparaître au classement.{' '}
          <button type="button" className="acc-link" onClick={() => loginWithDiscord()}>Se connecter</button>
        </p>
      )}
      <div className="acc-board-tools">
        {gens.length > 1 && (
          <select value={gen} onChange={(e) => setGen(Number(e.target.value))} aria-label="Région">
            {gens.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        <div className="acc-board-tabs" role="tablist">
          {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>)}
        </div>
      </div>
      {!board && <p className="acc-note">Chargement…</p>}
      {board && !rows.length && <p className="acc-note">Personne pour l’instant. À toi d’ouvrir le bal !</p>}
      <ol className="acc-rows">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className={i < 3 ? `is-top is-${i + 1}` : ''}>
            <b className="acc-pos">{i + 1}</b>
            {r.avatar ? <img src={r.avatar} alt="" referrerPolicy="no-referrer" /> : <i />}
            <span className="acc-who"><strong>{r.name}</strong><small>{r.form || partnerName(r.partnerId)} · niv. {r.level}{r.rank ? ` · rang ${r.rank}` : ''}</small></span>
            <span className="acc-score">{tab === 'kills' ? `${r.kills.toLocaleString('fr-FR')} K.O.` : clock(r.t)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AccountChip;
