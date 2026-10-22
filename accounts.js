/**
 * Comptes joueurs via Discord (OAuth2, scope « identify ») :
 * connexion, session dans un cookie signé, sauvegarde en ligne des progressions,
 * historique des parties et classements du Swarm et du Poké Rush.
 *
 * Variables d'environnement :
 *   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET  (obligatoires pour activer la connexion)
 *   DISCORD_REDIRECT_URI                       (facultatif, sinon https://<hôte>/auth/discord/callback)
 *   SESSION_SECRET                             (facultatif mais conseillé : clé de signature des sessions)
 */
const crypto = require('crypto');
const mongoose = require('mongoose');

const GAMES = ['swarm', 'rush'];
const SESSION_COOKIE = 'bl_session';
const STATE_COOKIE = 'bl_oauth';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
const MAX_SAVE_BYTES = 250 * 1000;

const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
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
  at: { type: Date, default: Date.now, index: true }
});
RunSchema.index({ game: 1, gen: 1, mode: 1, result: 1, t: 1 });
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
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=96`;
  let idx = 0;
  try { idx = Number((BigInt(u.discordId) >> 22n) % 6n); } catch { idx = 0; }
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
};
const publicUser = (u) => ({ id: String(u._id), name: u.globalName || u.username, username: u.username, avatar: avatarUrl(u) });

const currentUser = async (req) => {
  const data = verify(parseCookies(req)[SESSION_COOKIE]);
  if (!data?.uid || mongoose.connection.readyState !== 1) return null;
  try { return await Account.findById(data.uid); } catch { return null; }
};
const requireUser = async (req, res, next) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'Connecte-toi avec Discord.' });
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
  missions: Math.round(num(r.missions, 0, 10))
});

const attachAccounts = (app) => {
  app.set('trust proxy', 1);

  app.get('/api/auth/config', (req, res) => res.json({ discord: enabled() }));

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
      const user = await Account.findOneAndUpdate(
        { discordId: String(me.id) },
        { $set: { username: str(me.username, 64), globalName: str(me.global_name, 64), avatar: str(me.avatar, 64), lastLogin: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, new: true }
      );
      setCookie(req, res, SESSION_COOKIE, sign({ uid: String(user._id), exp: Date.now() + SESSION_TTL }), SESSION_TTL);
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
    if (!GAMES.includes(game) || mongoose.connection.readyState !== 1) return res.json({ fastest: [], kills: [], endless: [] });
    const gen = Math.round(num(req.query.gen, 1, 9, 1));
    const top = async (match, sortField, dir) => {
      const rows = await Run.aggregate([
        { $match: { game, gen, ...match } },
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
          name: u ? (u.globalName || u.username) : 'Joueur', avatar: u ? avatarUrl(u) : '', partnerId: r.partnerId, form: r.form, formDex: r.formDex,
          t: r.t, kills: r.kills, level: r.level, rank: r.rank, caught: r.caught, at: r.at
        };
      });
    };
    try {
      const [fastest, kills, endless] = await Promise.all([
        top({ result: 'win', mode: { $ne: 'endless' } }, 't', 1),
        top({ mode: { $ne: 'endless' } }, 'kills', -1),
        game === 'swarm' ? top({ mode: 'endless' }, 't', -1) : Promise.resolve([])
      ]);
      res.json({ fastest, kills, endless });
    } catch (e) {
      res.status(500).json({ error: 'Classement indisponible' });
    }
  });
};

module.exports = { attachAccounts, currentUser };
