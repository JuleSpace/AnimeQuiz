/**
 * Comptes joueurs : pseudo + mot de passe (sans e-mail) ou connexion Discord (OAuth2, scope « identify »).
 * Session dans un cookie signé, sauvegarde en ligne des progressions, historique et classements.
 * Mot de passe oublié : le superadmin génère un code de réinitialisation à usage unique (48 h)
 * qu'il transmet lui-même au joueur.
 *
 * Variables d'environnement :
 *   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET  (obligatoires pour activer la connexion)
 *   DISCORD_REDIRECT_URI                       (facultatif, sinon https://<hôte>/auth/discord/callback)
 *   SESSION_SECRET                             (facultatif mais conseillé : clé de signature des sessions)
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const { requireSuper } = require('./admins');

const GAMES = ['swarm', 'rush', 'arena', 'bonk', 'prairie'];
const SESSION_COOKIE = 'bl_session';
const STATE_COOKIE = 'bl_oauth';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
const MAX_SAVE_BYTES = 250 * 1000;

const UserSchema = new mongoose.Schema({
  discordId: { type: String, unique: true, sparse: true },
  // Compte classique : pseudo unique (sans tenir compte des majuscules) + mot de passe
  loginKey: { type: String, unique: true, sparse: true },
  loginName: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  resetHash: { type: String, default: '' },
  resetExpires: { type: Date, default: null },
  sessionVersion: { type: Number, default: 0 },
  username: { type: String, default: '' },
  globalName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  saves: { type: mongoose.Schema.Types.Mixed, default: {} },
  savedAt: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
}, { minimize: false });
const RunSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', index: true },
  game: { type: String, enum: GAMES, index: true },
  gen: { type: Number, default: 1 },
  mode: { type: String, default: 'classic' },
  partnerId: { type: String, default: '' },
  form: { type: String, default: '' },
  formDex: { type: String, default: '' },
  result: { type: String, enum: ['win', 'lose'], default: 'lose' },
  t: { type: Number, default: 0 },
  kills: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  rank: { type: Number, default: 0 },
  caught: { type: Number, default: 0 },
  missions: { type: Number, default: 0 },
  score: { type: Number, default: null },
  at: { type: Date, default: Date.now, index: true }
});
RunSchema.index({ game: 1, gen: 1, mode: 1, result: 1, t: 1 });
RunSchema.index({ game: 1, gen: 1, score: -1 });
const Account = mongoose.models.Account || mongoose.model('Account', UserSchema);
const Run = mongoose.models.Run || mongoose.model('Run', RunSchema);

const cfg = () => ({
  id: process.env.DISCORD_CLIENT_ID || '',
  secret: process.env.DISCORD_CLIENT_SECRET || '',
  redirect: process.env.DISCORD_REDIRECT_URI || ''
});
const enabled = () => Boolean(cfg().id && cfg().secret);
const signingKey = () => process.env.SESSION_SECRET || `bl-session:${cfg().secret || 'dev'}`;

/* ——— Cookies et sessions signées ——— */
const parseCookies = (req) => {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
};
const isSecure = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';
const setCookie = (req, res, name, value, maxAgeMs) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAgeMs !== undefined) parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
  if (isSecure(req)) parts.push('Secure');
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), parts.join('; ')]);
};
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload) => {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
  return `${body}.${mac}`;
};
const verify = (token) => {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const want = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
  const a = Buffer.from(mac); const b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
};

const avatarUrl = (u) => {
  if (!u.discordId) return '';
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=96`;
  let idx = 0;
  try { idx = Number((BigInt(u.discordId) >> 22n) % 6n); } catch { idx = 0; }
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
};
const displayName = (u) => u.loginName || u.globalName || u.username || 'Joueur';
const publicUser = (u) => ({
  id: String(u._id), name: displayName(u), username: u.loginName || u.username, avatar: avatarUrl(u),
  discord: Boolean(u.discordId), password: Boolean(u.passwordHash)
});

/* ——— Pseudo et mot de passe ——— */
const loginKeyOf = (name) => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
const cleanLoginName = (name) => String(name || '').trim().replace(/\s+/g, ' ');
const validName = (name) => /^[\p{L}\p{N} _.-]{3,20}$/u.test(name);
const hashSecret = (secret, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(String(secret), salt, 32).toString('hex')}`;
const checkSecret = (secret, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex'); const b = crypto.scryptSync(String(secret), salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Code de réinitialisation lisible (sans 0/O ni 1/I) : XXXX-XXXX
const resetCode = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  const raw = [...bytes].map((b) => abc[b % abc.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
};
const normCode = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Trop d'essais ratés : on bloque 15 minutes (par adresse IP et par pseudo)
const failures = new Map();
const tooMany = (key) => { const f = failures.get(key); return f && f.n >= 8 && Date.now() - f.at < 15 * 60 * 1000; };
const fail = (key) => { const f = failures.get(key); failures.set(key, { n: f && Date.now() - f.at < 15 * 60 * 1000 ? f.n + 1 : 1, at: Date.now() }); };

const currentUser = async (req) => {
  const data = verify(parseCookies(req)[SESSION_COOKIE]);
  if (!data?.uid || mongoose.connection.readyState !== 1) return null;
  try {
    const user = await Account.findById(data.uid);
    // une réinitialisation du mot de passe déconnecte les anciennes sessions
    if (!user || (user.sessionVersion || 0) !== (data.sv || 0)) return null;
    return user;
  } catch { return null; }
};
const openSession = (req, res, user) => setCookie(req, res, SESSION_COOKIE, sign({ uid: String(user._id), sv: user.sessionVersion || 0, exp: Date.now() + SESSION_TTL }), SESSION_TTL);
const requireUser = async (req, res, next) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'Connecte-toi à ton compte.' });
  req.account = user;
  return next();
};

const redirectUri = (req) => {
  if (cfg().redirect) return cfg().redirect;
  const proto = isSecure(req) ? 'https' : 'http';
  return `${proto}://${req.get('host')}/auth/discord/callback`;
};
// On ne revient que vers une page du site (#swarm, #pokerush…)
const safeReturn = (value) => (/^#[a-z0-9-]{1,30}$/i.test(String(value || '')) ? value : '');

/* ——— Nettoyage d'une partie envoyée par le client ——— */
const num = (v, min, max, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const str = (v, max = 40) => String(v || '').slice(0, max);
const cleanRun = (game, r = {}) => ({
  game,
  gen: Math.round(num(r.gen, 1, 9, 1)),
  mode: r.mode === 'endless' ? 'endless' : r.mode === 'daily' ? 'daily' : 'classic',
  partnerId: str(r.partnerId),
  form: str(r.form),
  formDex: str(r.formDex, 16),
  result: r.result === 'win' ? 'win' : 'lose',
  t: num(r.t, 0, 6 * 3600),
  kills: Math.round(num(r.kills, 0, 1e6)),
  level: Math.round(num(r.level, 1, 999, 1)),
  rank: Math.round(num(r.rank, 0, 20)),
  caught: Math.round(num(r.caught, 0, 999)),
  missions: Math.round(num(r.missions, 0, 10)),
  score: r.score === undefined || r.score === null ? null : Math.round(num(r.score, 0, 5e7))
});

const attachAccounts = (app) => {
  app.set('trust proxy', 1);

  app.get('/api/auth/config', (req, res) => res.json({ discord: enabled(), accounts: true }));

  // Inscription : pseudo + mot de passe, sans e-mail
  app.post('/api/register', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Base de données indisponible, réessaie plus tard.' });
    const name = cleanLoginName(req.body?.username);
    const password = String(req.body?.password || '');
    if (!validName(name)) return res.status(400).json({ error: 'Pseudo : 3 à 20 caractères (lettres, chiffres, espace, point, tiret).' });
    if (password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Mot de passe : au moins 6 caractères.' });
    const ipKey = `reg:${req.ip}`;
    if (tooMany(ipKey)) return res.status(429).json({ error: 'Trop de comptes créés, réessaie plus tard.' });
    if (await Account.exists({ loginKey: loginKeyOf(name) })) return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    fail(ipKey); // compte aussi les inscriptions réussies (limite d'abus)
    try {
      const user = await Account.create({ loginKey: loginKeyOf(name), loginName: name, passwordHash: hashSecret(password), createdAt: new Date(), lastLogin: new Date() });
      openSession(req, res, user);
      return res.json({ user: publicUser(user) });
    } catch (e) {
      return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    }
  });

  app.post('/api/login', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Base de données indisponible, réessaie plus tard.' });
    const key = loginKeyOf(req.body?.username);
    const limitKey = `login:${req.ip}:${key}`;
    if (tooMany(limitKey)) return res.status(429).json({ error: 'Trop d’essais. Attends 15 minutes.' });
    const user = key ? await Account.findOne({ loginKey: key }) : null;
    if (!user || !checkSecret(String(req.body?.password || ''), user.passwordHash)) {
      fail(limitKey);
      return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
    }
    failures.delete(limitKey);
    user.lastLogin = new Date();
    await user.save();
    openSession(req, res, user);
    return res.json({ user: publicUser(user) });
  });

  // Mot de passe oublié : le joueur saisit le code reçu du superadmin
  app.post('/api/reset-password', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Base de données indisponible.' });
    const key = loginKeyOf(req.body?.username);
    const limitKey = `reset:${req.ip}:${key}`;
    if (tooMany(limitKey)) return res.status(429).json({ error: 'Trop d’essais. Attends 15 minutes.' });
    const password = String(req.body?.password || '');
    if (password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Mot de passe : au moins 6 caractères.' });
    const user = key ? await Account.findOne({ loginKey: key }) : null;
    const ok = user && user.resetHash && user.resetExpires && user.resetExpires > new Date() && checkSecret(normCode(req.body?.code), user.resetHash);
    if (!ok) {
      fail(limitKey);
      return res.status(400).json({ error: 'Code invalide ou expiré. Redemande un code à l’administrateur.' });
    }
    user.passwordHash = hashSecret(password);
    user.resetHash = '';
    user.resetExpires = null;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    user.lastLogin = new Date();
    await user.save();
    openSession(req, res, user);
    return res.json({ user: publicUser(user) });
  });

  // Superadmin : liste des comptes et code de réinitialisation
  app.get('/api/admin/accounts', requireSuper, async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = q ? { $or: [{ loginKey: { $regex: q } }, { username: { $regex: q, $options: 'i' } }, { globalName: { $regex: q, $options: 'i' } }] } : {};
    const list = await Account.find(filter).sort({ lastLogin: -1 }).limit(50).lean();
    res.json(list.map((u) => ({
      id: String(u._id), name: displayName(u), discord: u.discordId ? (u.username || 'oui') : '', password: Boolean(u.passwordHash),
      createdAt: u.createdAt, lastLogin: u.lastLogin, resetPending: Boolean(u.resetHash && u.resetExpires && new Date(u.resetExpires) > new Date())
    })));
  });
  app.post('/api/admin/accounts/:id/reset', requireSuper, async (req, res) => {
    const user = await Account.findById(req.params.id).catch(() => null);
    if (!user) return res.status(404).json({ error: 'Compte introuvable' });
    if (!user.loginKey) return res.status(400).json({ error: 'Ce compte se connecte uniquement avec Discord : pas de mot de passe à réinitialiser.' });
    const code = resetCode();
    user.resetHash = hashSecret(normCode(code));
    user.resetExpires = new Date(Date.now() + 48 * 3600 * 1000);
    await user.save();
    res.json({ code, name: displayName(user), expires: user.resetExpires });
  });

  app.get('/auth/discord', (req, res) => {
    if (!enabled()) return res.redirect('/');
    const state = crypto.randomBytes(16).toString('hex');
    setCookie(req, res, STATE_COOKIE, JSON.stringify({ state, back: safeReturn(req.query.return) }), 10 * 60 * 1000);
    const q = new URLSearchParams({ client_id: cfg().id, response_type: 'code', scope: 'identify', redirect_uri: redirectUri(req), state, prompt: 'none' });
    return res.redirect(`https://discord.com/oauth2/authorize?${q}`);
  });

  app.get('/auth/discord/callback', async (req, res) => {
    let saved = {};
    try { saved = JSON.parse(parseCookies(req)[STATE_COOKIE] || '{}'); } catch { saved = {}; }
    setCookie(req, res, STATE_COOKIE, '', 0);
    const back = `/${saved.back || ''}`;
    if (!enabled() || !req.query.code || !saved.state || saved.state !== req.query.state) return res.redirect(back);
    try {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: cfg().id, client_secret: cfg().secret, grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: redirectUri(req) })
      });
      if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
      const token = await tokenRes.json();
      const meRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!meRes.ok) throw new Error(`me ${meRes.status}`);
      const me = await meRes.json();
      // Déjà connecté avec un pseudo : on relie Discord à ce compte (si ce Discord n'a pas déjà son compte)
      const current = await currentUser(req);
      if (current && !current.discordId && !(await Account.exists({ discordId: String(me.id) }))) {
        current.discordId = String(me.id);
        current.username = str(me.username, 64); current.globalName = str(me.global_name, 64); current.avatar = str(me.avatar, 64);
        current.lastLogin = new Date();
        await current.save();
        openSession(req, res, current);
        return res.redirect(back);
      }
      const user = await Account.findOneAndUpdate(
        { discordId: String(me.id) },
        { $set: { username: str(me.username, 64), globalName: str(me.global_name, 64), avatar: str(me.avatar, 64), lastLogin: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, new: true }
      );
      openSession(req, res, user);
    } catch (e) {
      console.error('Connexion Discord impossible :', e.message);
    }
    return res.redirect(back);
  });

  app.get('/api/me', async (req, res) => {
    const user = await currentUser(req);
    res.json({ user: user ? publicUser(user) : null });
  });

  // Suppression du compte : compte, sauvegardes et historique (et donc classements)
  app.delete('/api/me', requireUser, async (req, res) => {
    await Run.deleteMany({ user: req.account._id });
    await Account.deleteOne({ _id: req.account._id });
    setCookie(req, res, SESSION_COOKIE, '', 0);
    res.json({ ok: true });
  });

  app.post('/api/logout', (req, res) => {
    setCookie(req, res, SESSION_COOKIE, '', 0);
    res.json({ ok: true });
  });

  // Sauvegarde en ligne d'une progression (Swarm, Poké Rush)
  app.get('/api/me/save/:game', requireUser, (req, res) => {
    const { game } = req.params;
    if (!GAMES.includes(game)) return res.status(404).json({ error: 'Jeu inconnu' });
    return res.json({ save: req.account.saves?.[game] || null, savedAt: req.account.savedAt?.[game] || null });
  });
  app.put('/api/me/save/:game', requireUser, async (req, res) => {
    const { game } = req.params;
    if (!GAMES.includes(game)) return res.status(404).json({ error: 'Jeu inconnu' });
    const save = req.body?.save;
    if (!save || typeof save !== 'object' || JSON.stringify(save).length > MAX_SAVE_BYTES) return res.status(400).json({ error: 'Sauvegarde invalide' });
    await Account.updateOne({ _id: req.account._id }, { $set: { [`saves.${game}`]: save, [`savedAt.${game}`]: Date.now() } });
    return res.json({ ok: true });
  });

  // Une partie terminée (une toutes les 15 s au plus par joueur)
  const lastRun = new Map();
  app.post('/api/runs/:game', requireUser, async (req, res) => {
    const { game } = req.params;
    if (!GAMES.includes(game)) return res.status(404).json({ error: 'Jeu inconnu' });
    const key = `${req.account._id}:${game}`;
    if (Date.now() - (lastRun.get(key) || 0) < 15000) return res.status(429).json({ error: 'Trop rapide' });
    lastRun.set(key, Date.now());
    const run = await Run.create({ ...cleanRun(game, req.body?.run), user: req.account._id });
    return res.json({ ok: true, id: String(run._id) });
  });

  app.get('/api/me/runs/:game', requireUser, async (req, res) => {
    const runs = await Run.find({ user: req.account._id, game: req.params.game }).sort({ at: -1 }).limit(20).lean();
    res.json({ runs });
  });

  // Classements : meilleur score de chaque joueur
  app.get('/api/leaderboard/:game', async (req, res) => {
    const { game } = req.params;
    if (!GAMES.includes(game) || mongoose.connection.readyState !== 1) return res.json({ score: [], fastest: [], kills: [], endless: [] });
    const gen = Math.round(num(req.query.gen, 1, 9, 1));
    // Score : celui envoyé par le jeu, sinon une estimation pour les parties d'avant le score
    const winBonus = (v) => ({ $cond: [{ $eq: ['$result', 'win'] }, v, 0] });
    const fallback = game === 'arena'
      ? { $add: [{ $multiply: ['$kills', 1000] }, { $multiply: ['$caught', 300] }, { $multiply: ['$level', 200] }, winBonus(10000)] }
      : { $add: [{ $multiply: ['$kills', 10] }, { $multiply: ['$level', 150] }, { $multiply: ['$missions', 750] }, { $multiply: ['$caught', 400] }, winBonus(6000)] };
    const top = async (match, sortField, dir) => {
      const rows = await Run.aggregate([
        { $match: { game, gen, ...match } },
        { $addFields: { score: { $ifNull: ['$score', fallback] } } },
        { $sort: { [sortField]: dir, at: 1 } },
        { $group: { _id: '$user', best: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$best' } },
        { $sort: { [sortField]: dir, at: 1 } },
        { $limit: 20 },
        { $lookup: { from: Account.collection.name, localField: 'user', foreignField: '_id', as: 'who' } }
      ]);
      return rows.map((r) => {
        const u = r.who?.[0];
        return {
          name: u ? displayName(u) : 'Joueur', avatar: u ? avatarUrl(u) : '', partnerId: r.partnerId, form: r.form, formDex: r.formDex,
          t: r.t, kills: r.kills, level: r.level, rank: r.rank, caught: r.caught, score: Math.round(r.score || 0), result: r.result, at: r.at
        };
      });
    };
    try {
      const [score, fastest, kills, endless] = await Promise.all([
        top({ mode: { $ne: 'endless' } }, 'score', -1),
        top({ result: 'win', mode: { $ne: 'endless' } }, 't', 1),
        top({ mode: { $ne: 'endless' } }, 'kills', -1),
        game === 'swarm' ? top({ mode: 'endless' }, 't', -1) : Promise.resolve([])
      ]);
      res.json({ score, fastest, kills, endless });
    } catch (e) {
      res.status(500).json({ error: 'Classement indisponible' });
    }
  });
};

module.exports = { attachAccounts, currentUser };
