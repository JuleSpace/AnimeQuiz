import React, { useState } from 'react';
import { DiscordLogo, loginAccount, loginWithDiscord, registerAccount, resetWithCode, useAccount } from './account';

const CONTACT = 'ytspana@gmail.com';

/**
 * Connexion obligatoire : se connecter, créer un compte (pseudo + mot de passe, sans e-mail),
 * utiliser un code de réinitialisation, ou passer par Discord.
 */
const AuthPanel = ({ returnHash = '', title = 'Connexion' }) => {
  const { discord } = useAccount();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if ((tab === 'register' || tab === 'reset') && password !== password2) { setError('Les deux mots de passe ne sont pas identiques.'); return; }
    setBusy(true);
    try {
      if (tab === 'login') await loginAccount(name, password);
      else if (tab === 'register') await registerAccount(name, password);
      else await resetWithCode(name, code, password);
    } catch (e) {
      setError(e.status === 404 ? 'Serveur injoignable pour le moment.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const TABS = [['login', 'Se connecter'], ['register', 'Créer un compte'], ['reset', 'J’ai un code']];
  return (
    <div className="auth">
      <h2 className="auth-title">{title}</h2>
      <div className="auth-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); setError(''); }}>{label}</button>
        ))}
      </div>
      <form className="auth-form" onSubmit={submit}>
        {tab === 'register' && <p className="auth-hint">Pas d’e-mail : juste un pseudo et un mot de passe. Note-le bien !</p>}
        {tab === 'reset' && <p className="auth-hint">Entre le code que l’administrateur t’a envoyé, puis choisis un nouveau mot de passe.</p>}
        <input className="input" autoComplete="username" placeholder="Pseudo" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} required />
        {tab === 'reset' && <input className="input" placeholder="Code (ex. K7QM-82PX)" value={code} onChange={(e) => setCode(e.target.value)} required />}
        <input className="input" type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} placeholder={tab === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={tab === 'login' ? 1 : 6} />
        {tab !== 'login' && <input className="input" type="password" autoComplete="new-password" placeholder="Confirme le mot de passe" value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength={6} />}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-success auth-go" disabled={busy}>
          {busy ? '…' : tab === 'login' ? 'Entrer' : tab === 'register' ? 'Créer mon compte' : 'Changer le mot de passe'}
        </button>
      </form>
      {tab === 'login' && (
        <p className="auth-forgot">
          Mot de passe oublié ? Écris à <a href={`mailto:${CONTACT}?subject=Mot%20de%20passe%20Bully's%20Lair`}>{CONTACT}</a> avec ton pseudo : tu recevras un code, à saisir dans « J’ai un code ».
        </p>
      )}
      {discord && (
        <>
          <div className="auth-or"><span>ou</span></div>
          <button type="button" className="auth-discord" onClick={() => loginWithDiscord(returnHash)}>
            <DiscordLogo /> Continuer avec Discord
          </button>
        </>
      )}
    </div>
  );
};

export default AuthPanel;
