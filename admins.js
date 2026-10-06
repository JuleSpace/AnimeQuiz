const crypto = require('crypto');
const mongoose = require('mongoose');

const SUPER_USERNAME = 'Jules';
const SUPER_PASSWORD = 'superadmin';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'bullys-lair-admin-token';
const TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  usernameKey: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super', 'admin'], default: 'admin' }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

function usernameKey(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(String(password), salt, 32).toString('hex');
  const left = Buffer.from(hash, 'hex');
  const right = Buffer.from(next, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function encode(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decode(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64').toString();
}

function issueToken(admin) {
  const payload = encode(JSON.stringify({
    u: admin.username,
    r: admin.role,
    exp: Date.now() + TOKEN_TTL
  }));
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function readToken(header) {
  const raw = String(header || '').replace(/^Bearer\s+/i, '');
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(decode(payload));
    if (!data?.u || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch (error) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const data = readToken(req.get('authorization'));
  if (!data) {
    res.status(401).json({ error: 'Connexion administrateur requise' });
    return;
  }
  Admin.findOne({ usernameKey: usernameKey(data.u) })
    .then((admin) => {
      if (!admin || admin.role !== data.r) {
        res.status(401).json({ error: 'Connexion administrateur requise' });
        return;
      }
      req.admin = { username: admin.username, role: admin.role };
      next();
    })
    .catch(() => {
      res.status(500).json({ error: 'Vérification impossible' });
    });
}

function requireSuper(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'super') {
      res.status(403).json({ error: 'Réservé au superadmin' });
      return;
    }
    next();
  });
}

function canEditQuiz(admin, quiz) {
  if (!admin || !quiz) return false;
  if (admin.role === 'super') return true;
  return usernameKey(quiz.owner) !== '' && usernameKey(quiz.owner) === usernameKey(admin.username);
}

async function ensureSuperadmin() {
  const passwordHash = hashPassword(SUPER_PASSWORD);
  await Admin.updateMany(
    { role: 'super', usernameKey: { $ne: usernameKey(SUPER_USERNAME) } },
    { $set: { role: 'admin' } }
  );
  await Admin.findOneAndUpdate(
    { usernameKey: usernameKey(SUPER_USERNAME) },
    {
      username: SUPER_USERNAME,
      usernameKey: usernameKey(SUPER_USERNAME),
      passwordHash,
      role: 'super'
    },
    { upsert: true, new: true }
  );
}

function attachAdmins(app) {
  app.post('/api/admin/login', async (req, res) => {
    try {
      const key = usernameKey(req.body.username);
      const password = String(req.body.password || '');
      const admin = key ? await Admin.findOne({ usernameKey: key }) : null;
      if (!admin || !checkPassword(password, admin.passwordHash)) {
        res.status(401).json({ error: 'Identifiants incorrects' });
        return;
      }
      res.json({
        token: issueToken(admin),
        username: admin.username,
        role: admin.role
      });
    } catch (error) {
      res.status(500).json({ error: 'Connexion impossible' });
    }
  });

  app.get('/api/admins', requireSuper, async (req, res) => {
    try {
      const admins = await Admin.find().sort({ role: -1, username: 1 });
      res.json(admins.map((admin) => ({ username: admin.username, role: admin.role })));
    } catch (error) {
      res.status(500).json({ error: 'Liste impossible' });
    }
  });

  app.post('/api/admins', requireSuper, async (req, res) => {
    try {
      const username = String(req.body.username || '').trim().replace(/\s+/g, ' ').slice(0, 32);
      const password = String(req.body.password || '');
      const key = usernameKey(username);
      if (username.length < 2) {
        res.status(400).json({ error: 'Le nom doit faire au moins 2 caractères' });
        return;
      }
      if (password.length < 4) {
        res.status(400).json({ error: 'Le mot de passe doit faire au moins 4 caractères' });
        return;
      }
      if (key === usernameKey(SUPER_USERNAME)) {
        res.status(400).json({ error: 'Ce nom est réservé au superadmin' });
        return;
      }
      const existing = await Admin.findOne({ usernameKey: key });
      if (existing) {
        res.status(400).json({ error: 'Cet admin existe déjà' });
        return;
      }
      const admin = await Admin.create({
        username,
        usernameKey: key,
        passwordHash: hashPassword(password),
        role: 'admin'
      });
      res.json({ username: admin.username, role: admin.role });
    } catch (error) {
      res.status(500).json({ error: 'Création impossible' });
    }
  });

  app.delete('/api/admins/:username', requireSuper, async (req, res) => {
    try {
      const key = usernameKey(decodeURIComponent(req.params.username));
      if (key === usernameKey(SUPER_USERNAME)) {
        res.status(400).json({ error: 'Le superadmin reste en place' });
        return;
      }
      const admin = await Admin.findOneAndDelete({ usernameKey: key, role: 'admin' });
      if (!admin) {
        res.status(404).json({ error: 'Admin introuvable' });
        return;
      }
      if (mongoose.models.Quiz) {
        await mongoose.models.Quiz.updateMany({ owner: admin.username }, { $set: { owner: '' } });
      }
      if (mongoose.models.Room) {
        await mongoose.models.Room.updateMany({ owner: admin.username }, { $set: { owner: '' } });
      }
      res.json({ username: admin.username });
    } catch (error) {
      res.status(500).json({ error: 'Retrait impossible' });
    }
  });
}

module.exports = {
  attachAdmins,
  ensureSuperadmin,
  requireAdmin,
  requireSuper,
  canEditQuiz,
  usernameKey
};
