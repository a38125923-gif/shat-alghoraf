const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const { Server } = require('socket.io');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('./db');

const isAiStudioNginx = Boolean(process.env.NGINX_PORT && process.env.DEFAULT_APP_PORT && process.env.STANDALONE_CLOUD_RUN !== '1');
const PORT = Number(process.env.CHAT_PORT) || (isAiStudioNginx ? Number(process.env.DEFAULT_APP_PORT) : Number(process.env.PORT) || 3000);
const HOST = '0.0.0.0';

const DATA_DIR = path.join(__dirname, 'data');
const SECRET_FILE = path.join(DATA_DIR, '.session_secret');
let SESSION_SECRET = process.env.SESSION_SECRET || '';
if (!SESSION_SECRET) {
  if (fs.existsSync(SECRET_FILE)) {
    SESSION_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } else {
    SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, SESSION_SECRET, { mode: 0o600 });
  }
}

const UPLOADS_ROOT = path.join(__dirname, 'uploads');
const UPLOAD_SUBDIRS = ['images', 'audio', 'avatars', 'rooms', 'ranks', 'emojis', 'wallpapers', 'branding'];
for (const sub of UPLOAD_SUBDIRS) {
  const dir = path.join(UPLOADS_ROOT, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const SHOP_FRAMES = [
  { id: 'none', name: 'بدون إطار', cost: 0 },
  { id: 'gold_royal', name: 'الإطار الملكي الذهبي', cost: 0 },
  { id: 'fire_gold', name: 'إطار اللهب الذهبي', cost: 350 },
  { id: 'diamond_ring', name: 'الإطار الماسي المتوهج', cost: 600 },
  { id: 'emerald_crown', name: 'إطار الزمرد الفاخر', cost: 450 }
];

const SHOP_NAMEPLATES = [
  { id: 'default', name: 'افتراضي شفاف', cost: 0 },
  { id: 'gold_bar', name: 'شريط ذهبي ملكي', cost: 250 },
  { id: 'crimson_royal', name: 'شريط أحمر ملكي', cost: 0 },
  { id: 'obsidian_gold', name: 'أسود مذهب فاخر', cost: 400 },
  { id: 'emerald_silk', name: 'زمردي لامع', cost: 300 },
  { id: 'violet_glow', name: 'بنفسجي متوهج', cost: 300 }
];

const VALID_THEMES = new Set(['warm_peach', 'sunset_rose', 'royal_night', 'emerald_mist', 'sky_breeze']);

function getClientIp(reqOrHandshake) {
  const headers = reqOrHandshake?.headers || {};
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return (
    reqOrHandshake?.address ||
    reqOrHandshake?.socket?.remoteAddress ||
    reqOrHandshake?.ip ||
    ''
  ).replace(/^::ffff:/, '');
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || !payload.key || !payload.name) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function mapUserRow(row) {
  return {
    type: 'user',
    userId: row.id,
    key: `user:${row.id}`,
    username: row.username,
    name: db.getEffectiveName(row),
    email: row.email,
    role: row.role,
    nameColor: row.name_color || '#ffffff',
    avatarUrl: row.avatar_url || '',
    avatarFrame: row.avatar_frame || (db.getRankPower(row.role) >= 70 ? 'gold_royal' : 'none'),
    nameplateStyle: row.nameplate_style || (row.role === 'site_owner' ? 'crimson_royal' : 'default'),
    coins: row.coins ?? 1500,
    vipFamily: row.vip_family || ''
  };
}

function resolveSessionUser(token, ipAddress = '') {
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.type === 'user' && payload.userId) {
    const userRow = db.findUserById(payload.userId);
    if (!userRow) return null;
    const key = `user:${userRow.id}`;
    const ban = db.isTargetBanned({
      targetKey: key,
      email: userRow.email,
      ipAddress: userRow.role === 'site_owner' ? '' : ipAddress
    });
    if (ban || userRow.is_banned === 1) {
      return {
        banned: true,
        reason: (ban && ban.reason) || userRow.ban_reason || 'حظر نهائي من الإدارة'
      };
    }
    return { banned: false, user: mapUserRow(userRow) };
  }

  const ban = db.isTargetBanned({
    targetKey: payload.key,
    ipAddress
  });
  if (ban) {
    return { banned: true, reason: ban.reason || 'حظر نهائي من الإدارة' };
  }

  return {
    banned: false,
    user: {
      type: 'guest',
      userId: null,
      key: payload.key,
      username: payload.name,
      name: payload.name,
      email: '',
      role: 'guest',
      nameColor: payload.nameColor || '#ffffff',
      avatarUrl: payload.avatarUrl || '',
      avatarFrame: payload.avatarFrame || 'none',
      nameplateStyle: payload.nameplateStyle || 'default',
      coins: payload.coins ?? 500,
      vipFamily: ''
    }
  };
}

function createMulterStorage(subdir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(UPLOADS_ROOT, subdir));
    },
    filename: (_req, file, cb) => {
      const extRaw = path.extname(file.originalname || '').toLowerCase();
      const safeExt = extRaw.replace(/[^a-z0-9.]/g, '').slice(0, 10) || (subdir === 'audio' ? '.webm' : '.png');
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
      cb(null, unique);
    }
  });
}

function makeImageUploader(subdir, maxSizeMb = 5, errMsg = 'يُسمح برفع ملفات الصور فقط.') {
  return multer({
    storage: createMulterStorage(subdir),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error(errMsg));
    }
  });
}

const uploadImage = makeImageUploader('images', 10, 'يُسمح برفع ملفات الصور فقط.');
const uploadAvatar = makeImageUploader('avatars', 5, 'يُسمح برفع الصور فقط لصورة البروفايل.');
const uploadRoomImage = makeImageUploader('rooms', 5, 'يُسمح برفع الصور فقط لصورة الغرفة.');
const uploadRankIcon = makeImageUploader('ranks', 3, 'يُسمح برفع الصور فقط لأيقونة الرتبة.');
const uploadEmojiImg = makeImageUploader('emojis', 3, 'يُسمح برفع الصور فقط للإيموجي أو الملصق.');
const uploadWallpaper = makeImageUploader('wallpapers', 10, 'يُسمح برفع الصور فقط لخلفية الغرفة.');
const uploadBranding = makeImageUploader('branding', 5, 'يُسمح برفع الصور فقط لشعار الموقع.');

const uploadAudio = multer({
  storage: createMulterStorage('audio'),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype &&
      (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' || file.mimetype === 'application/ogg')
    ) {
      cb(null, true);
    } else {
      cb(new Error('تنسيق الصوت غير مدعوم.'));
    }
  }
});

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  maxHttpBufferSize: 1e7
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, status: 'ready' });
});

app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS_ROOT));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const ip = getClientIp(req);
  const resolved = resolveSessionUser(token, ip);
  if (!resolved) {
    return res.status(401).json({ error: 'انتهت الجلسة أو التوكن غير صالح. يرجى تسجيل الدخول مجدداً.' });
  }
  if (resolved.banned) {
    return res.status(403).json({ error: `تم حظرك نهائياً من الشات: ${resolved.reason}` });
  }
  req.authUser = resolved.user;
  req.clientIp = ip;
  req.rawToken = token;
  next();
}

function canDo(role, permName) {
  return db.hasPermission(role, permName);
}

function requirePanelAccess(req, res, next) {
  if (!canDo(req.authUser.role, 'access_panel')) {
    return res.status(403).json({ error: 'هذه اللوحة مخصصة لأصحاب الرتب الإدارية المخوّلة فقط.' });
  }
  next();
}

function requirePermission(permName, errMessage) {
  return (req, res, next) => {
    if (!canDo(req.authUser.role, permName)) {
      return res.status(403).json({ error: errMessage || 'ليس لديك صلاحية تنفيذ هذا الإجراء.' });
    }
    next();
  };
}

function canModerate(actorRole, targetRole, actorKey, targetKey) {
  if (actorKey && targetKey && actorKey === targetKey) return false;
  if (actorRole === 'site_owner') return true;
  if (targetRole === 'site_owner') return false;
  if (
    !canDo(actorRole, 'mute') &&
    !canDo(actorRole, 'kick') &&
    !canDo(actorRole, 'ban') &&
    !canDo(actorRole, 'set_rank')
  ) {
    return false;
  }
  return db.getRankPower(actorRole) > db.getRankPower(targetRole);
}

function isMaintenanceBlocked(role) {
  const settings = db.getSiteSettings();
  if (!settings || settings.maintenance_mode !== 1) return false;
  return role !== 'site_owner' && !canDo(role, 'access_panel');
}

// Bootstrap info & session verification
app.get('/api/bootstrap', (req, res) => {
  const userCount = db.getUserCount();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const ip = getClientIp(req);
  let sessionUser = null;
  let bannedReason = null;

  if (token) {
    const resolved = resolveSessionUser(token, ip);
    if (resolved && resolved.banned) {
      bannedReason = resolved.reason;
    } else if (resolved && resolved.user) {
      if (!isMaintenanceBlocked(resolved.user.role)) {
        sessionUser = resolved.user;
      }
    }
  } else {
    const ipBan = db.isTargetBanned({ ipAddress: ip });
    if (ipBan) bannedReason = ipBan.reason;
  }

  const rooms = db.getAllRooms().map((r) => db.sanitizeRoomForPublic(r));

  res.json({
    userCount,
    user: sessionUser,
    bannedReason,
    ranks: db.getAllRanks(),
    emojis: db.getAllCustomEmojis(),
    siteSettings: db.getSiteSettings(),
    rooms,
    shop: { frames: SHOP_FRAMES, nameplates: SHOP_NAMEPLATES }
  });
});

// Guest Login (Nickname only)
app.post('/api/auth/guest', (req, res) => {
  if (isMaintenanceBlocked('guest')) {
    return res.status(503).json({ error: '🛠️ الشات في وضع الصيانة المؤقتة حالياً — الدخول متاح للإدارة فقط.' });
  }

  const nickname = String(req.body?.nickname || '').trim();
  if (nickname.length < 2 || nickname.length > 24) {
    return res.status(400).json({ error: 'يجب أن يكون الاسم المستعار بين 2 و 24 حرفاً.' });
  }

  const ip = getClientIp(req);
  const key = `guest:${nickname.toLowerCase()}`;
  const ban = db.isTargetBanned({ targetKey: key, ipAddress: ip });
  if (ban) {
    return res.status(403).json({ error: `تم حظرك نهائياً من دخول الشات: ${ban.reason}` });
  }

  const user = {
    type: 'guest',
    userId: null,
    key,
    username: nickname,
    name: nickname,
    email: '',
    role: 'guest',
    nameColor: '#ffffff',
    avatarUrl: '',
    avatarFrame: 'none',
    nameplateStyle: 'default',
    coins: 500,
    vipFamily: ''
  };

  const token = signToken({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  res.json({ token, user });
});

// Register New Member
app.post('/api/auth/register', (req, res) => {
  const isFirstAccount = db.getUserCount() === 0;
  if (!isFirstAccount && isMaintenanceBlocked('member')) {
    return res.status(503).json({ error: '🛠️ الشات في وضع الصيانة المؤقتة حالياً — التسجيل متاح للإدارة فقط.' });
  }

  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const ip = getClientIp(req);

  if (username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: 'يجب أن يكون اسم المستخدم بين 2 و 24 حرفاً.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 4 أحرف على الأقل.' });
  }

  const preBan = db.isTargetBanned({ email, ipAddress: ip });
  if (preBan && db.getUserCount() > 0) {
    return res.status(403).json({ error: `تم حظر هذا البريد أو العنوان نهائياً: ${preBan.reason}` });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.registerUser({ username, email, passwordHash, ipAddress: ip });
    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    const row = result.user;
    const user = mapUserRow(row);
    const token = signToken({
      type: 'user',
      userId: row.id,
      key: user.key,
      name: user.name,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      token,
      user,
      isFirstOwner: row.role === 'site_owner'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب.' });
  }
});

// Login Existing Member
app.post('/api/auth/login', (req, res) => {
  const identifier = String(req.body?.identifier || '').trim();
  const password = String(req.body?.password || '');
  const ip = getClientIp(req);

  if (!identifier || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.' });
  }

  const row = db.findUserByIdentifier(identifier);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
  }

  if (isMaintenanceBlocked(row.role)) {
    return res.status(503).json({ error: '🛠️ الشات في وضع الصيانة حالياً — الدخول متاح للإدارة والمالك فقط.' });
  }

  const key = `user:${row.id}`;
  const ban = db.isTargetBanned({
    targetKey: key,
    email: row.email,
    ipAddress: row.role === 'site_owner' ? '' : ip
  });
  if (ban || row.is_banned === 1) {
    const reason = (ban && ban.reason) || row.ban_reason || 'حظر نهائي من الإدارة';
    return res.status(403).json({ error: `تم حظر حسابك نهائياً: ${reason}` });
  }

  db.updateUserIp(row.id, ip);
  const user = mapUserRow(row);
  const token = signToken({
    type: 'user',
    userId: row.id,
    key,
    name: user.name,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  res.json({ token, user });
});

// Upgrade Guest to Registered Member in-place without leaving the room
app.post('/api/auth/upgrade-guest', requireAuth, (req, res) => {
  if (req.authUser.type !== 'guest' && req.authUser.role !== 'guest') {
    return res.status(400).json({ error: 'حسابك مسجل مسبقاً كعضو.' });
  }

  const username = String(req.body?.username || req.authUser.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const ip = req.clientIp || getClientIp(req);

  if (username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: 'يجب أن يكون الاسم بين 2 و 24 حرفاً.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 4 أحرف على الأقل.' });
  }

  const preBan = db.isTargetBanned({ email, ipAddress: ip });
  if (preBan && db.getUserCount() > 0) {
    return res.status(403).json({ error: `تم حظر هذا البريد أو العنوان نهائياً: ${preBan.reason}` });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.registerUser({ username, email, passwordHash, ipAddress: ip });
    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    let row = result.user;
    if (req.authUser.avatarUrl || (req.authUser.nameColor && req.authUser.nameColor !== '#ffffff')) {
      row =
        db.updateUserCustomization(row.id, {
          displayName: username,
          nameColor: req.authUser.nameColor,
          avatarUrl: req.authUser.avatarUrl,
          avatarFrame: req.authUser.avatarFrame,
          nameplateStyle: req.authUser.nameplateStyle,
          vipFamily: req.authUser.vipFamily
        }) || row;
    }

    const oldKey = req.authUser.key;
    const newUser = mapUserRow(row);
    db.migrateGuestKeyReferences(oldKey, newUser.key, newUser.name, newUser.role);

    const token = signToken({
      type: 'user',
      userId: row.id,
      key: newUser.key,
      name: newUser.name,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    const affectedRooms = new Set();
    for (const [sid, entry] of onlineSockets.entries()) {
      if (entry.key === oldKey) {
        entry.key = newUser.key;
        entry.userId = newUser.userId;
        entry.email = newUser.email;
        entry.name = newUser.name;
        entry.role = newUser.role;
        entry.nameColor = newUser.nameColor;
        entry.avatarUrl = newUser.avatarUrl;
        entry.avatarFrame = newUser.avatarFrame;
        entry.nameplateStyle = newUser.nameplateStyle;
        entry.coins = newUser.coins;
        entry.vipFamily = newUser.vipFamily || '';

        const targetSocket = io.sockets.sockets.get(sid);
        if (targetSocket) {
          targetSocket.user = { ...newUser };
          targetSocket.emit('session_updated', { user: newUser, token });
        }
        if (entry.roomId) affectedRooms.add(entry.roomId);
      }
    }

    for (const rid of affectedRooms) {
      const slots = roomMics.get(rid);
      if (slots) {
        let micChanged = false;
        for (const s of slots) {
          if (s && s.key === oldKey) {
            s.key = newUser.key;
            s.name = newUser.name;
            s.role = newUser.role;
            s.avatarUrl = newUser.avatarUrl;
            s.avatarFrame = newUser.avatarFrame;
            micChanged = true;
          }
        }
        if (micChanged) broadcastRoomMics(rid);
      }
      broadcastRoomUsers(rid);
      io.to(rid).emit('system_notice', {
        roomId: rid,
        text: `🎉 قام "${newUser.name}" بترقية حسابه من زائر إلى عضو مسجل!`
      });
    }

    io.emit('user_rank_updated', {
      oldKey,
      targetKey: newUser.key,
      newRole: newUser.role,
      name: newUser.name
    });
    broadcastGlobalOnlineUsers();

    res.status(201).json({
      token,
      user: newUser,
      isFirstOwner: row.role === 'site_owner'
    });
  } catch (err) {
    console.error('Upgrade guest error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء ترقية الحساب.' });
  }
});

// Multer Uploads
app.post('/api/upload/image', requireAuth, (req, res) => {
  uploadImage.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الصورة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال أي صورة.' });
    res.json({ url: `/uploads/images/${req.file.filename}` });
  });
});

app.post('/api/upload/audio', requireAuth, (req, res) => {
  uploadAudio.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الرسالة الصوتية.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال أي تسجيل صوتي.' });
    res.json({ url: `/uploads/audio/${req.file.filename}` });
  });
});

app.post('/api/upload/avatar', requireAuth, (req, res) => {
  uploadAvatar.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع صورة البروفايل.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
  });
});

app.post('/api/upload/room', requireAuth, requirePermission('manage_rooms', 'رفع صور الغرف متاح لمن يملك صلاحية إدارة الغرف فقط.'), (req, res) => {
  uploadRoomImage.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع صورة الغرفة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة للغرفة.' });
    res.json({ url: `/uploads/rooms/${req.file.filename}` });
  });
});

app.post('/api/upload/wallpaper', requireAuth, requirePermission('manage_rooms', 'رفع خلفية الغرفة متاح لمن يملك صلاحية إدارة الغرف فقط.'), (req, res) => {
  uploadWallpaper.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع خلفية الغرفة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة خلفية.' });
    res.json({ url: `/uploads/wallpapers/${req.file.filename}` });
  });
});

app.post('/api/upload/rank-icon', requireAuth, requirePanelAccess, (req, res) => {
  if (!canDo(req.authUser.role, 'set_rank') && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'تحتاج لصلاحية إدارة الرتب لرفع أيقونة رتبة.' });
  }
  uploadRankIcon.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع أيقونة الرتبة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    res.json({ url: `/uploads/ranks/${req.file.filename}` });
  });
});

app.post('/api/upload/emoji', requireAuth, requirePanelAccess, (req, res) => {
  uploadEmojiImg.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الإيموجي.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    res.json({ url: `/uploads/emojis/${req.file.filename}` });
  });
});

app.post('/api/upload/branding', requireAuth, requirePanelAccess, (req, res) => {
  uploadBranding.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع شعار الموقع.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    res.json({ url: `/uploads/branding/${req.file.filename}` });
  });
});

// Active Sockets & Voice Mics State
const onlineSockets = new Map();
const roomMics = new Map(); // roomId -> [slot0..slot4]

function getOrInitMics(roomId) {
  if (!roomMics.has(roomId)) {
    roomMics.set(roomId, [null, null, null, null, null]);
  }
  return roomMics.get(roomId);
}

function broadcastRoomMics(roomId) {
  if (!roomId) return;
  const room = db.getRoomById(roomId);
  const slots = getOrInitMics(roomId);
  io.to(roomId).emit('room_mics', {
    roomId,
    micsEnabled: room ? room.mics_enabled !== 0 : true,
    slots
  });
}

function removeUserFromRoomMics(roomId, userKey) {
  if (!roomId || !roomMics.has(roomId)) return false;
  const slots = roomMics.get(roomId);
  let changed = false;
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i] && slots[i].key === userKey) {
      slots[i] = null;
      changed = true;
    }
  }
  if (changed) broadcastRoomMics(roomId);
  return changed;
}

function sortByRank(users) {
  return [...users].sort(
    (a, b) => db.getRankPower(b.role) - db.getRankPower(a.role) || a.name.localeCompare(b.name, 'ar')
  );
}

function buildRoomsPayload(includePasswords = false) {
  const rooms = db.getAllRooms();
  const counts = {};
  for (const s of onlineSockets.values()) {
    if (s.roomId) {
      counts[s.roomId] = (counts[s.roomId] || 0) + 1;
    }
  }
  return rooms.map((r) => {
    const base = includePasswords ? { ...r, hasPassword: Boolean(r.room_password && r.room_password.trim()) } : db.sanitizeRoomForPublic(r);
    return {
      ...base,
      onlineCount: counts[r.id] || 0
    };
  });
}

function buildGlobalOnlineUsers() {
  const roomsById = Object.fromEntries(db.getAllRooms().map((r) => [r.id, r]));
  const list = [];
  for (const entry of onlineSockets.values()) {
    const muteRow = db.getActiveMute(entry.key, entry.roomId || '*');
    list.push({
      socketId: entry.socketId,
      key: entry.key,
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      ipAddress: entry.ipAddress,
      role: entry.role,
      nameColor: entry.nameColor,
      avatarUrl: entry.avatarUrl,
      avatarFrame: entry.avatarFrame,
      nameplateStyle: entry.nameplateStyle,
      coins: entry.coins,
      vipFamily: entry.vipFamily,
      roomId: entry.roomId,
      roomName: roomsById[entry.roomId]?.name || 'خارج الغرف',
      isMuted: Boolean(muteRow),
      muteExpiresAt: muteRow ? muteRow.expires_at : null
    });
  }
  return sortByRank(list);
}

function broadcastRoomsList() {
  io.emit('rooms_list', buildRoomsPayload(false));
}

function broadcastGlobalOnlineUsers() {
  const allOnline = buildGlobalOnlineUsers().map((u) => ({
    socketId: u.socketId,
    key: u.key,
    userId: u.userId,
    name: u.name,
    role: u.role,
    nameColor: u.nameColor,
    avatarUrl: u.avatarUrl,
    avatarFrame: u.avatarFrame,
    nameplateStyle: u.nameplateStyle,
    roomId: u.roomId,
    roomName: u.roomName,
    isMuted: u.isMuted
  }));
  io.emit('online_users_global', allOnline);
  notifyAdminPanelRefresh();
}

function broadcastRoomUsers(roomId) {
  if (!roomId) return;
  const usersInRoom = [];
  for (const entry of onlineSockets.values()) {
    if (entry.roomId === roomId) {
      const muteRow = db.getActiveMute(entry.key, roomId);
      usersInRoom.push({
        socketId: entry.socketId,
        key: entry.key,
        userId: entry.userId,
        name: entry.name,
        role: entry.role,
        nameColor: entry.nameColor,
        avatarUrl: entry.avatarUrl,
        avatarFrame: entry.avatarFrame,
        nameplateStyle: entry.nameplateStyle,
        isMuted: Boolean(muteRow),
        muteExpiresAt: muteRow ? muteRow.expires_at : null
      });
    }
  }
  io.to(roomId).emit('room_users', { roomId, users: sortByRank(usersInRoom) });
}

function notifyAdminPanelRefresh() {
  for (const [sid, entry] of onlineSockets.entries()) {
    if (canDo(entry.role, 'access_panel')) {
      io.to(sid).emit('admin_panel_dirty');
    }
  }
}

function syncUserAcrossSockets(targetKey, patchUser) {
  const affectedRooms = new Set();
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === targetKey) {
      if (patchUser.name !== undefined) entry.name = patchUser.name;
      if (patchUser.role !== undefined) entry.role = patchUser.role;
      if (patchUser.nameColor !== undefined) entry.nameColor = patchUser.nameColor;
      if (patchUser.avatarUrl !== undefined) entry.avatarUrl = patchUser.avatarUrl;
      if (patchUser.avatarFrame !== undefined) entry.avatarFrame = patchUser.avatarFrame;
      if (patchUser.nameplateStyle !== undefined) entry.nameplateStyle = patchUser.nameplateStyle;
      if (patchUser.coins !== undefined) entry.coins = patchUser.coins;
      if (patchUser.vipFamily !== undefined) entry.vipFamily = patchUser.vipFamily;

      const targetSocket = io.sockets.sockets.get(sid);
      if (targetSocket) {
        targetSocket.user = {
          ...targetSocket.user,
          ...patchUser
        };
        const freshToken = signToken({
          type: targetSocket.user.type,
          userId: targetSocket.user.userId,
          key: targetSocket.user.key,
          name: targetSocket.user.name,
          role: targetSocket.user.role,
          nameColor: targetSocket.user.nameColor,
          avatarUrl: targetSocket.user.avatarUrl,
          avatarFrame: targetSocket.user.avatarFrame,
          nameplateStyle: targetSocket.user.nameplateStyle,
          coins: targetSocket.user.coins,
          exp: Date.now() + 30 * 24 * 60 * 60 * 1000
        });
        targetSocket.emit('session_updated', {
          user: targetSocket.user,
          token: freshToken
        });
      }
      if (entry.roomId) affectedRooms.add(entry.roomId);
    }
  }
  for (const rid of affectedRooms) {
    broadcastRoomUsers(rid);
    const slots = roomMics.get(rid);
    if (slots) {
      let micChanged = false;
      for (const s of slots) {
        if (s && s.key === targetKey) {
          if (patchUser.name !== undefined) s.name = patchUser.name;
          if (patchUser.role !== undefined) s.role = patchUser.role;
          if (patchUser.avatarUrl !== undefined) s.avatarUrl = patchUser.avatarUrl;
          if (patchUser.avatarFrame !== undefined) s.avatarFrame = patchUser.avatarFrame;
          micChanged = true;
        }
      }
      if (micChanged) broadcastRoomMics(rid);
    }
  }
  broadcastGlobalOnlineUsers();
}

// Customize profile
app.post('/api/profile/customize', requireAuth, (req, res) => {
  const rawDisplayName = String(req.body?.displayName || '').trim();
  const rawColor = String(req.body?.nameColor || '').trim();
  const avatarUrl = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : undefined;
  const avatarFrame = typeof req.body?.avatarFrame === 'string' ? req.body.avatarFrame.trim() : undefined;
  const nameplateStyle = typeof req.body?.nameplateStyle === 'string' ? req.body.nameplateStyle.trim() : undefined;
  const vipFamily = typeof req.body?.vipFamily === 'string' ? req.body.vipFamily.trim() : undefined;

  let nextName = req.authUser.name;
  if (rawDisplayName) {
    if (rawDisplayName.length < 2 || rawDisplayName.length > 28) {
      return res.status(400).json({ error: 'يجب أن يكون الاسم المستعار بين 2 و 28 حرفاً.' });
    }
    nextName = rawDisplayName;
  }

  const validColor = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : req.authUser.nameColor;
  const safeAvatar =
    avatarUrl === undefined
      ? req.authUser.avatarUrl
      : avatarUrl === '' || avatarUrl.startsWith('/uploads/avatars/')
        ? avatarUrl
        : req.authUser.avatarUrl;

  const validFrame = SHOP_FRAMES.some((f) => f.id === avatarFrame) ? avatarFrame : req.authUser.avatarFrame;
  const validPlate = SHOP_NAMEPLATES.some((p) => p.id === nameplateStyle) ? nameplateStyle : req.authUser.nameplateStyle;

  let updatedUser = {
    ...req.authUser,
    name: nextName,
    nameColor: validColor,
    avatarUrl: safeAvatar,
    avatarFrame: validFrame,
    nameplateStyle: validPlate,
    vipFamily: vipFamily !== undefined ? vipFamily.slice(0, 24) : req.authUser.vipFamily
  };

  if (req.authUser.type === 'user' && req.authUser.userId) {
    const saved = db.updateUserCustomization(req.authUser.userId, {
      displayName: nextName,
      nameColor: validColor,
      avatarUrl: safeAvatar,
      avatarFrame: validFrame,
      nameplateStyle: validPlate,
      vipFamily: updatedUser.vipFamily
    });
    if (saved) updatedUser = mapUserRow(saved);
  }

  const newToken = signToken({
    type: updatedUser.type,
    userId: updatedUser.userId,
    key: updatedUser.key,
    name: updatedUser.name,
    role: updatedUser.role,
    nameColor: updatedUser.nameColor,
    avatarUrl: updatedUser.avatarUrl,
    avatarFrame: updatedUser.avatarFrame,
    nameplateStyle: updatedUser.nameplateStyle,
    coins: updatedUser.coins,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  syncUserAcrossSockets(updatedUser.key, {
    name: updatedUser.name,
    nameColor: updatedUser.nameColor,
    avatarUrl: updatedUser.avatarUrl,
    avatarFrame: updatedUser.avatarFrame,
    nameplateStyle: updatedUser.nameplateStyle,
    vipFamily: updatedUser.vipFamily
  });

  res.json({ user: updatedUser, token: newToken });
});

// Shop: Equip / Purchase Frame or Nameplate
app.post('/api/shop/equip', requireAuth, (req, res) => {
  const { itemType, itemId } = req.body || {};
  const list = itemType === 'frame' ? SHOP_FRAMES : itemType === 'nameplate' ? SHOP_NAMEPLATES : null;
  if (!list) return res.status(400).json({ error: 'نوع العنصر غير صالح.' });

  const item = list.find((x) => x.id === itemId);
  if (!item) return res.status(404).json({ error: 'العنصر غير موجود في المتجر.' });

  const isPrivileged = canDo(req.authUser.role, 'manage_rooms') || canDo(req.authUser.role, 'set_rank');
  const effectiveCost = isPrivileged ? 0 : item.cost;

  let updatedUser = { ...req.authUser };
  if (req.authUser.type === 'user' && req.authUser.userId) {
    if (effectiveCost > 0) {
      const spend = db.spendUserCoins(req.authUser.userId, effectiveCost);
      if (spend?.error) return res.status(400).json({ error: spend.error });
    }
    const saved = db.updateUserCustomization(req.authUser.userId, {
      avatarFrame: itemType === 'frame' ? item.id : undefined,
      nameplateStyle: itemType === 'nameplate' ? item.id : undefined
    });
    if (saved) updatedUser = mapUserRow(saved);
  } else {
    if (effectiveCost > (updatedUser.coins || 0)) {
      return res.status(400).json({ error: 'رصيد الزائر غير كافٍ لهذا العنصر.' });
    }
    updatedUser.coins = Math.max(0, (updatedUser.coins || 500) - effectiveCost);
    if (itemType === 'frame') updatedUser.avatarFrame = item.id;
    if (itemType === 'nameplate') updatedUser.nameplateStyle = item.id;
  }

  const newToken = signToken({
    type: updatedUser.type,
    userId: updatedUser.userId,
    key: updatedUser.key,
    name: updatedUser.name,
    role: updatedUser.role,
    nameColor: updatedUser.nameColor,
    avatarUrl: updatedUser.avatarUrl,
    avatarFrame: updatedUser.avatarFrame,
    nameplateStyle: updatedUser.nameplateStyle,
    coins: updatedUser.coins,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  syncUserAcrossSockets(updatedUser.key, {
    avatarFrame: updatedUser.avatarFrame,
    nameplateStyle: updatedUser.nameplateStyle,
    coins: updatedUser.coins
  });

  res.json({ user: updatedUser, token: newToken, message: `✅ تم تفعيل "${item.name}" بنجاح!` });
});

// Room Theme Update
app.post('/api/room/theme', requireAuth, (req, res) => {
  const { roomId, bgTheme } = req.body || {};
  if (!canDo(req.authUser.role, 'manage_rooms') && !canDo(req.authUser.role, 'access_panel')) {
    return res.status(403).json({ error: 'تغيير خلفية الغرفة متاح للإدارة والمالك فقط.' });
  }
  if (!roomId || !VALID_THEMES.has(bgTheme)) {
    return res.status(400).json({ error: 'بيانات الخلفية غير صالحة.' });
  }
  const updated = db.updateRoom(roomId, { bgTheme, wallpaperUrl: '', bgCustom: '' });
  if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const pubRoom = db.sanitizeRoomForPublic(updated);
  broadcastRoomsList();
  io.to(roomId).emit('room_updated', pubRoom);
  res.json({ room: pubRoom });
});

// Leaderboards (الأثرياء & الكبار & عائلات VIP)
app.get('/api/leaderboards', requireAuth, (_req, res) => {
  const allUsers = db.getAllRegisteredUsers().filter((u) => u.is_banned !== 1);
  const rich = [...allUsers]
    .sort((a, b) => (b.coins || 0) - (a.coins || 0))
    .slice(0, 20)
    .map(mapUserRow);

  const vips = allUsers
    .filter((u) => db.getRankPower(u.role) >= 30)
    .sort((a, b) => db.getRankPower(b.role) - db.getRankPower(a.role))
    .slice(0, 25)
    .map(mapUserRow);

  const familiesMap = new Map();
  for (const u of allUsers) {
    const fam = (u.vip_family || '').trim();
    if (fam) {
      if (!familiesMap.has(fam)) familiesMap.set(fam, { name: fam, members: [] });
      familiesMap.get(fam).members.push(mapUserRow(u));
    }
  }

  res.json({
    rich,
    vips,
    families: [...familiesMap.values()]
  });
});

// Social & Communication Endpoints (Friends, PM, Wall, Reports, Notifications)
app.get('/api/social/state', requireAuth, (req, res) => {
  res.json({
    friends: db.getFriendsForUser(req.authUser.key),
    privateMessages: db.getPrivateMessagesForUser(req.authUser.key),
    wallPosts: db.getWallPosts(),
    notifications: db.getNotificationsForUser(req.authUser.key),
    reports: canDo(req.authUser.role, 'access_panel') ? db.getReports() : []
  });
});

app.post('/api/social/pm', requireAuth, (req, res) => {
  const toKey = String(req.body?.toKey || '').trim();
  const toName = String(req.body?.toName || '').trim() || 'مستخدم';
  const content = String(req.body?.content || '').trim().slice(0, 1000);
  if (!toKey || !content) return res.status(400).json({ error: 'يرجى كتابة نص الرسالة الخاصة.' });
  if (toKey === req.authUser.key) return res.status(400).json({ error: 'لا يمكنك مراسلة نفسك.' });

  const pm = db.addPrivateMessage({
    fromKey: req.authUser.key,
    fromName: req.authUser.name,
    fromRole: req.authUser.role,
    fromAvatar: req.authUser.avatarUrl,
    toKey,
    toName,
    content
  });

  db.addNotification({
    targetKey: toKey,
    title: `رسالة خاصة من ${req.authUser.name}`,
    body: content.slice(0, 80)
  });

  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === toKey || entry.key === req.authUser.key) {
      io.to(sid).emit('new_pm', pm);
      if (entry.key === toKey) {
        io.to(sid).emit('new_notification', { title: `رسالة خاصة من ${req.authUser.name}`, body: content });
      }
    }
  }

  res.status(201).json({ pm });
});

app.post('/api/social/friend-request', requireAuth, (req, res) => {
  const toKey = String(req.body?.toKey || '').trim();
  const toName = String(req.body?.toName || '').trim();
  const toRole = String(req.body?.toRole || 'member').trim();
  const toAvatar = String(req.body?.toAvatar || '').trim();

  if (!toKey || !toName || toKey === req.authUser.key) {
    return res.status(400).json({ error: 'بيانات الطلب غير صالحة.' });
  }

  db.sendFriendRequest({
    fromUser: req.authUser,
    toKey,
    toName,
    toRole,
    toAvatar
  });

  db.addNotification({
    targetKey: toKey,
    title: 'طلب صداقة جديد',
    body: `أرسل لك "${req.authUser.name}" طلب صداقة`
  });

  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === toKey) {
      io.to(sid).emit('new_notification', {
        title: 'طلب صداقة جديد',
        body: `أرسل لك "${req.authUser.name}" طلب صداقة`
      });
    }
  }

  res.json({ ok: true, message: `✅ تم إرسال طلب الصداقة إلى ${toName}` });
});

app.post('/api/social/friend-respond', requireAuth, (req, res) => {
  const friendKey = String(req.body?.friendKey || '').trim();
  const accept = Boolean(req.body?.accept);
  if (!friendKey) return res.status(400).json({ error: 'معرف الصديق مطلوب.' });
  db.respondFriendRequest(req.authUser.key, friendKey, accept);
  res.json({ ok: true, friends: db.getFriendsForUser(req.authUser.key) });
});

app.post('/api/social/wall', requireAuth, (req, res) => {
  const content = String(req.body?.content || '').trim().slice(0, 600);
  const imageUrl = String(req.body?.imageUrl || '').trim();
  if (!content) return res.status(400).json({ error: 'اكتب منشوراً أولاً.' });

  const post = db.addWallPost({
    authorKey: req.authUser.key,
    authorName: req.authUser.name,
    authorRole: req.authUser.role,
    avatarUrl: req.authUser.avatarUrl,
    avatarFrame: req.authUser.avatarFrame,
    nameplateStyle: req.authUser.nameplateStyle,
    content,
    imageUrl: imageUrl.startsWith('/uploads/images/') ? imageUrl : ''
  });
  io.emit('wall_post_added', post);
  res.status(201).json({ post });
});

app.post('/api/social/wall-like', requireAuth, (req, res) => {
  const postId = Number(req.body?.postId);
  if (Number.isNaN(postId)) return res.status(400).json({ error: 'معرف غير صالح.' });
  const updated = db.likeWallPost(postId);
  res.json({ post: updated });
});

app.post('/api/social/report', requireAuth, (req, res) => {
  const targetName = String(req.body?.targetName || '').trim().slice(0, 50);
  const reason = String(req.body?.reason || '').trim().slice(0, 300);
  const roomId = String(req.body?.roomId || '').trim();
  if (!targetName || !reason) {
    return res.status(400).json({ error: 'يرجى تحديد الاسم وسبب الإبلاغ.' });
  }
  const rep = db.addReport({
    reporterKey: req.authUser.key,
    reporterName: req.authUser.name,
    targetName,
    reason,
    roomId
  });
  for (const [sid, entry] of onlineSockets.entries()) {
    if (canDo(entry.role, 'access_panel')) {
      io.to(sid).emit('new_notification', {
        title: `🚨 بلاغ جديد من ${req.authUser.name}`,
        body: `ضد "${targetName}": ${reason}`
      });
    }
  }
  res.status(201).json({ report: rep, message: '✅ تم إرسال البلاغ للإدارة.' });
});

// ==========================================
// CONTROL PANEL & FULL CMS ENDPOINTS
// ==========================================
app.get('/api/admin/overview', requireAuth, requirePanelAccess, (req, res) => {
  const includeRoomPass = canDo(req.authUser.role, 'manage_rooms');
  const registered = db.getAllRegisteredUsers().map((u) => ({
    id: u.id,
    key: `user:${u.id}`,
    username: u.username,
    name: db.getEffectiveName(u),
    email: u.email,
    role: u.role,
    nameColor: u.name_color,
    avatarUrl: u.avatar_url || '',
    avatarFrame: u.avatar_frame || 'none',
    nameplateStyle: u.nameplate_style || 'default',
    coins: u.coins ?? 1500,
    ipAddress: u.last_ip || '',
    isBanned: u.is_banned === 1,
    isMuted: Boolean(db.getActiveMute(`user:${u.id}`, '*')),
    createdAt: u.created_at
  }));

  res.json({
    onlineUsers: buildGlobalOnlineUsers(),
    registeredUsers: registered,
    bans: db.getAllBans(),
    rooms: buildRoomsPayload(includeRoomPass),
    reports: db.getReports(),
    ranks: db.getAllRanks(),
    emojis: db.getAllCustomEmojis(),
    siteSettings: db.getSiteSettings()
  });
});

// Custom Ranks & Permissions CRUD
app.post('/api/admin/ranks', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'إنشاء الرتب متاح للمالك ولمن لديه صلاحية إدارة الرتب فقط.' });
  }
  const { label, icon, imageUrl, bgColor, textColor, power, permissions } = req.body || {};
  const safeImg = imageUrl && String(imageUrl).startsWith('/uploads/ranks/') ? String(imageUrl) : '';
  const requestedPower = Math.max(1, Math.min(99, Number(power) || 20));
  if (req.authUser.role !== 'site_owner' && requestedPower >= db.getRankPower(req.authUser.role)) {
    return res.status(403).json({ error: 'لا يمكنك إنشاء رتبة بقوة أعلى من رتبتك أو مساوية لها.' });
  }
  const created = db.createRank({
    label,
    icon,
    imageUrl: safeImg,
    bgColor,
    textColor,
    power: requestedPower,
    permissions: permissions || {}
  });
  if (created.error) return res.status(400).json({ error: created.error });

  const ranks = db.getAllRanks();
  io.emit('ranks_updated', ranks);
  broadcastGlobalOnlineUsers();
  res.status(201).json({ rank: created.rank, ranks, message: `✅ تم إنشاء رتبة "${created.rank.label}" بنجاح!` });
});

app.put('/api/admin/ranks/:key', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'تعديل الرتب متاح للمالك ولمن لديه صلاحية إدارة الرتب فقط.' });
  }
  const key = String(req.params.key || '').trim();
  if (key === 'site_owner' && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'لا يمكن تعديل رتبة صاحب الموقع.' });
  }
  const existingPower = db.getRankPower(key);
  if (req.authUser.role !== 'site_owner' && existingPower >= db.getRankPower(req.authUser.role)) {
    return res.status(403).json({ error: 'لا يمكنك تعديل رتبة أعلى أو مساوية لرتبتك.' });
  }

  const { label, icon, imageUrl, bgColor, textColor, power, permissions } = req.body || {};
  const safeImg =
    imageUrl === undefined
      ? undefined
      : imageUrl === '' || String(imageUrl).startsWith('/uploads/ranks/')
        ? String(imageUrl)
        : undefined;

  const nextPower =
    power === undefined
      ? undefined
      : req.authUser.role === 'site_owner'
        ? power
        : Math.min(db.getRankPower(req.authUser.role) - 1, Math.max(1, Number(power) || 1));

  const updated = db.updateRank(key, {
    label,
    icon,
    imageUrl: safeImg,
    bgColor,
    textColor,
    power: nextPower,
    permissions
  });
  if (updated.error) return res.status(400).json({ error: updated.error });

  const ranks = db.getAllRanks();
  io.emit('ranks_updated', ranks);
  broadcastGlobalOnlineUsers();
  res.json({ rank: updated.rank, ranks, message: `✅ تم تحديث رتبة "${updated.rank.label}" وتطبيقها فوراً.` });
});

app.delete('/api/admin/ranks/:key', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'حذف الرتب متاح للمالك ولمن لديه صلاحية إدارة الرتب فقط.' });
  }
  const key = String(req.params.key || '').trim();
  const result = db.deleteRank(key);
  if (result.error) return res.status(400).json({ error: result.error });

  for (const uid of result.affectedUserIds || []) {
    syncUserAcrossSockets(`user:${uid}`, { role: 'member' });
  }
  const ranks = db.getAllRanks();
  io.emit('ranks_updated', ranks);
  broadcastGlobalOnlineUsers();
  res.json({ ok: true, ranks, message: '🗑️ تم حذف الرتبة المخصصة ونقل أعضائها إلى عضو.' });
});

// Custom Emojis & Stickers CRUD
app.post('/api/admin/emojis', requireAuth, requirePanelAccess, (req, res) => {
  const { code, imageUrl } = req.body || {};
  const added = db.addCustomEmoji({
    code,
    imageUrl,
    createdBy: req.authUser.name
  });
  if (added.error) return res.status(400).json({ error: added.error });

  const emojis = db.getAllCustomEmojis();
  io.emit('emojis_updated', emojis);
  notifyAdminPanelRefresh();
  res.status(201).json({ emoji: added.emoji, emojis, message: `✅ تم إضافة الإيموجي "${added.emoji.code}" بنجاح!` });
});

app.delete('/api/admin/emojis/:id', requireAuth, requirePanelAccess, (req, res) => {
  db.deleteCustomEmoji(req.params.id);
  const emojis = db.getAllCustomEmojis();
  io.emit('emojis_updated', emojis);
  notifyAdminPanelRefresh();
  res.json({ ok: true, emojis, message: '🗑️ تم حذف الإيموجي المخصص.' });
});

// Site Settings & Theme CMS
app.put('/api/admin/site-settings', requireAuth, requirePanelAccess, (req, res) => {
  const body = req.body || {};
  const safeLogo =
    body.site_logo === undefined
      ? undefined
      : body.site_logo === '' ||
          String(body.site_logo).startsWith('/uploads/branding/') ||
          String(body.site_logo).startsWith('/assets/')
        ? String(body.site_logo)
        : undefined;

  const updated = db.updateSiteSettings({
    ...body,
    site_logo: safeLogo
  });

  io.emit('site_settings_updated', updated);
  notifyAdminPanelRefresh();
  res.json({ siteSettings: updated, message: '🎨 تم حفظ وتطبيق إعدادات الموقع والمظهر فوراً للجميع!' });
});

// Broadcast Global Popup Alert
app.post('/api/admin/broadcast', requireAuth, requirePanelAccess, (req, res) => {
  const title = String(req.body?.title || '📢 إعلان هام من الإدارة').trim().slice(0, 80);
  const message = String(req.body?.message || '').trim().slice(0, 1000);
  if (!message) {
    return res.status(400).json({ error: 'يرجى كتابة نص الإعلان العام.' });
  }

  db.addNotification({
    targetKey: '*',
    title,
    body: message
  });

  const payload = {
    title,
    message,
    senderName: req.authUser.name,
    senderRole: req.authUser.role,
    createdAt: new Date().toISOString()
  };

  io.emit('broadcast_alert', payload);
  io.emit('new_notification', { title, body: message });
  res.json({ ok: true, payload, message: '📢 تم إرسال الإعلان العام المنبثق لجميع المتواجدين!' });
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || '';
  const ip = getClientIp(socket.handshake);
  const resolved = resolveSessionUser(token, ip);
  if (!resolved) {
    return next(new Error('UNAUTHORIZED'));
  }
  if (resolved.banned) {
    return next(new Error(`BANNED:${resolved.reason}`));
  }
  if (isMaintenanceBlocked(resolved.user.role)) {
    return next(new Error('MAINTENANCE:الموقع في وضع الصيانة المؤقتة حالياً'));
  }
  socket.user = resolved.user;
  socket.clientIp = ip;
  next();
});

function disconnectTargetSockets(targetKey, eventName, payload) {
  const affectedRooms = new Set();
  for (const [sid, entry] of [...onlineSockets.entries()]) {
    if (entry.key === targetKey) {
      if (entry.roomId) {
        affectedRooms.add(entry.roomId);
        removeUserFromRoomMics(entry.roomId, targetKey);
      }
      const targetSocket = io.sockets.sockets.get(sid);
      if (targetSocket) {
        if (eventName) targetSocket.emit(eventName, payload);
        targetSocket.disconnect(true);
      }
      onlineSockets.delete(sid);
    }
  }
  for (const rid of affectedRooms) {
    broadcastRoomUsers(rid);
  }
  broadcastRoomsList();
  broadcastGlobalOnlineUsers();
}

function getTargetMetadata(targetKey) {
  let targetRole = targetKey.startsWith('guest:') ? 'guest' : 'member';
  let targetName = targetKey;
  let email = '';
  let ipAddress = '';

  if (targetKey.startsWith('user:')) {
    const uid = Number(targetKey.replace('user:', ''));
    const row = Number.isNaN(uid) ? null : db.findUserById(uid);
    if (row) {
      targetRole = row.role;
      targetName = db.getEffectiveName(row);
      email = row.email;
      ipAddress = row.last_ip || '';
    }
  }

  for (const entry of onlineSockets.values()) {
    if (entry.key === targetKey) {
      targetRole = entry.role;
      targetName = entry.name;
      if (entry.email) email = entry.email;
      if (entry.ipAddress) ipAddress = entry.ipAddress;
      break;
    }
  }

  return { targetRole, targetName, email, ipAddress };
}

io.on('connection', (socket) => {
  const user = socket.user;
  if (user.type === 'user' && user.userId && socket.clientIp) {
    db.updateUserIp(user.userId, socket.clientIp);
  }

  onlineSockets.set(socket.id, {
    socketId: socket.id,
    key: user.key,
    userId: user.userId,
    email: user.email || '',
    ipAddress: socket.clientIp || '',
    name: user.name,
    role: user.role,
    nameColor: user.nameColor,
    avatarUrl: user.avatarUrl,
    avatarFrame: user.avatarFrame,
    nameplateStyle: user.nameplateStyle,
    coins: user.coins,
    vipFamily: user.vipFamily || '',
    roomId: null
  });

  socket.emit('ranks_updated', db.getAllRanks());
  socket.emit('emojis_updated', db.getAllCustomEmojis());
  socket.emit('site_settings_updated', db.getSiteSettings());
  socket.emit('rooms_list', buildRoomsPayload(false));
  broadcastGlobalOnlineUsers();

  function moveSocketToRoom(targetRoomId) {
    const rawRoom = db.getRoomById(targetRoomId);
    if (!rawRoom) return;
    const room = db.sanitizeRoomForPublic(rawRoom);

    const currentEntry = onlineSockets.get(socket.id);
    const oldRoomId = currentEntry ? currentEntry.roomId : null;

    if (oldRoomId && oldRoomId !== targetRoomId) {
      socket.leave(oldRoomId);
      removeUserFromRoomMics(oldRoomId, socket.user.key);
      currentEntry.roomId = null;
      broadcastRoomUsers(oldRoomId);
    }

    socket.join(targetRoomId);
    if (currentEntry) {
      currentEntry.roomId = targetRoomId;
    }

    const history = db.getRoomMessages(targetRoomId, 100);
    const activeMute = db.getActiveMute(socket.user.key, targetRoomId);

    socket.emit('room_joined', {
      room,
      messages: history,
      muteInfo: activeMute ? { expiresAt: activeMute.expires_at } : null,
      mics: {
        roomId: targetRoomId,
        micsEnabled: room.mics_enabled !== 0,
        slots: getOrInitMics(targetRoomId)
      }
    });

    const settings = db.getSiteSettings();
    if (oldRoomId === null && settings.welcome_message) {
      socket.emit('system_notice', {
        roomId: targetRoomId,
        text: `👋 ${settings.welcome_message}`
      });
    }
    if (room.welcome_message) {
      socket.emit('system_notice', {
        roomId: targetRoomId,
        text: `📌 ترحيب الغرفة: ${room.welcome_message}`
      });
    }

    if (oldRoomId !== targetRoomId) {
      io.to(targetRoomId).emit('system_notice', {
        roomId: targetRoomId,
        text: `✨ انضم "${currentEntry?.name || socket.user.name}" إلى الغرفة.`
      });
    }

    broadcastRoomUsers(targetRoomId);
    broadcastRoomsList();
    broadcastGlobalOnlineUsers();
  }

  socket.on('join_room', (payload) => {
    const ban = db.isTargetBanned({
      targetKey: socket.user.key,
      email: socket.user.email,
      ipAddress: socket.user.role === 'site_owner' ? '' : socket.clientIp
    });
    if (ban) {
      socket.emit('banned_forever', { reason: ban.reason });
      socket.disconnect(true);
      return;
    }

    const reqRoomId = typeof payload === 'string' ? payload : payload?.roomId;
    const suppliedPassword = typeof payload === 'object' ? String(payload?.password || '') : '';

    const allRooms = db.getAllRooms();
    const targetRoomObj = (reqRoomId && db.getRoomById(reqRoomId)) || allRooms[0];
    if (!targetRoomObj) return;

    const currentEntry = onlineSockets.get(socket.id);
    const myRole = currentEntry?.role || socket.user.role;
    const myPower = db.getRankPower(myRole);
    const isStaffBypass = myRole === 'site_owner' || canDo(myRole, 'manage_rooms');

    if (!isStaffBypass && Number(targetRoomObj.min_rank_power) > myPower) {
      socket.emit('action_error', {
        message: `🔒 هذه الغرفة مخصصة لأصحاب الرتب بقوة (${targetRoomObj.min_rank_power}) فأعلى.`
      });
      if (!currentEntry?.roomId) {
        const openFallback = allRooms.find((r) => Number(r.min_rank_power) <= myPower && !r.room_password) || allRooms[0];
        if (openFallback && openFallback.id !== targetRoomObj.id) {
          moveSocketToRoom(openFallback.id);
        }
      }
      return;
    }

    if (!isStaffBypass && targetRoomObj.room_password && targetRoomObj.room_password.trim() !== '') {
      if (suppliedPassword !== targetRoomObj.room_password) {
        socket.emit('room_password_required', {
          roomId: targetRoomObj.id,
          roomName: targetRoomObj.name,
          wrongPassword: Boolean(suppliedPassword)
        });
        if (!currentEntry?.roomId) {
          const openFallback = allRooms.find((r) => !r.room_password && Number(r.min_rank_power) <= myPower);
          if (openFallback) moveSocketToRoom(openFallback.id);
        }
        return;
      }
    }

    moveSocketToRoom(targetRoomObj.id);
  });

  socket.on('refresh_room', (roomId) => {
    const targetRoom = db.getRoomById(roomId) ? roomId : onlineSockets.get(socket.id)?.roomId;
    if (!targetRoom) return;
    socket.emit('room_history_sync', {
      roomId: targetRoom,
      messages: db.getRoomMessages(targetRoom, 100)
    });
    broadcastRoomUsers(targetRoom);
    broadcastRoomsList();
    broadcastRoomMics(targetRoom);
  });

  socket.on('send_message', (payload) => {
    const ban = db.isTargetBanned({
      targetKey: socket.user.key,
      email: socket.user.email,
      ipAddress: socket.user.role === 'site_owner' ? '' : socket.clientIp
    });
    if (ban) {
      socket.emit('banned_forever', { reason: ban.reason });
      socket.disconnect(true);
      return;
    }

    const entry = onlineSockets.get(socket.id);
    const roomId = payload?.roomId || entry?.roomId;
    if (!roomId || !db.getRoomById(roomId)) return;

    const activeMute = db.getActiveMute(socket.user.key, roomId);
    if (activeMute) {
      socket.emit('mute_status', { isMuted: true, expiresAt: activeMute.expires_at });
      socket.emit('action_error', {
        message: '⚠️ أنت مكتوم من قبل الإدارة ولا يمكنك إرسال الرسائل أو الوسائط حالياً.'
      });
      return;
    }

    const msgType = ['text', 'image', 'audio'].includes(payload?.msgType) ? payload.msgType : 'text';
    const content = String(payload?.content || '').trim().slice(0, 2000);
    const mediaUrl = String(payload?.mediaUrl || '').trim();

    if (msgType === 'text' && !content) return;
    if ((msgType === 'image' || msgType === 'audio') && !mediaUrl.startsWith('/uploads/')) return;

    const saved = db.addMessage({
      roomId,
      senderKey: socket.user.key,
      senderName: entry?.name || socket.user.name,
      senderRole: entry?.role || socket.user.role,
      nameColor: entry?.nameColor || socket.user.nameColor,
      avatarUrl: entry?.avatarUrl || socket.user.avatarUrl,
      avatarFrame: entry?.avatarFrame || socket.user.avatarFrame || 'none',
      nameplateStyle: entry?.nameplateStyle || socket.user.nameplateStyle || 'default',
      msgType,
      content,
      mediaUrl
    });

    io.to(roomId).emit('new_message', saved);
  });

  // Voice Mics 1..5 Events
  socket.on('mic_take', ({ roomId, slot }) => {
    const entry = onlineSockets.get(socket.id);
    const targetRoom = roomId || entry?.roomId;
    const room = targetRoom ? db.getRoomById(targetRoom) : null;
    if (!room) return;

    const myRole = entry?.role || socket.user.role;
    if (room.mics_enabled === 0 && !canDo(myRole, 'access_panel')) {
      socket.emit('action_error', { message: 'المايكات الصوتية مغلقة حالياً في هذه الغرفة.' });
      return;
    }

    const activeMute = db.getActiveMute(socket.user.key, targetRoom);
    if (activeMute) {
      socket.emit('action_error', { message: '⚠️ أنت مكتوم من قبل الإدارة ولا يمكنك الصعود على المايك.' });
      return;
    }

    const idx = Number(slot) - 1;
    if (idx < 0 || idx > 4) return;

    const slots = getOrInitMics(targetRoom);
    if (slots[idx] && slots[idx].key !== socket.user.key) {
      socket.emit('action_error', { message: `المايك رقم ${slot} مشغول حالياً.` });
      return;
    }

    for (let i = 0; i < slots.length; i += 1) {
      if (slots[i] && slots[i].key === socket.user.key) slots[i] = null;
    }

    slots[idx] = {
      slot: idx + 1,
      key: socket.user.key,
      name: entry?.name || socket.user.name,
      role: entry?.role || socket.user.role,
      avatarUrl: entry?.avatarUrl || socket.user.avatarUrl,
      avatarFrame: entry?.avatarFrame || socket.user.avatarFrame,
      isSpeaking: true
    };

    broadcastRoomMics(targetRoom);
    io.to(targetRoom).emit('system_notice', {
      roomId: targetRoom,
      text: `🎙️ صعد "${slots[idx].name}" على المايك رقم ${idx + 1}.`
    });
  });

  socket.on('mic_leave', ({ roomId }) => {
    const entry = onlineSockets.get(socket.id);
    const targetRoom = roomId || entry?.roomId;
    if (targetRoom) {
      removeUserFromRoomMics(targetRoom, socket.user.key);
    }
  });

  socket.on('mic_kick_slot', ({ roomId, slot }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'mute') && !canDo(myRole, 'kick')) return;
    const idx = Number(slot) - 1;
    if (!roomId || idx < 0 || idx > 4) return;
    const slots = getOrInitMics(roomId);
    if (slots[idx]) {
      const removedKey = slots[idx].key;
      slots[idx] = null;
      broadcastRoomMics(roomId);
      for (const [sid, e] of onlineSockets.entries()) {
        if (e.key === removedKey) {
          io.to(sid).emit('mic_force_left', { message: 'تم إنزالك من المايك بواسطة الإدارة.' });
        }
      }
    }
  });

  socket.on('mic_toggle_enabled', ({ roomId, enabled }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'manage_rooms') && !canDo(myRole, 'access_panel')) return;
    if (!roomId || !db.getRoomById(roomId)) return;
    db.updateRoom(roomId, { micsEnabled: Boolean(enabled) });
    if (!enabled) {
      roomMics.set(roomId, [null, null, null, null, null]);
    }
    broadcastRoomMics(roomId);
    io.to(roomId).emit('system_notice', {
      roomId,
      text: enabled ? '🎙️ قامت الإدارة بفتح المايكات الصوتية في الغرفة.' : '🔇 قامت الإدارة بإغلاق المايكات الصوتية مؤقتاً.'
    });
  });

  socket.on('mic_audio_chunk', ({ roomId, slot, audioData }) => {
    if (!roomId || !audioData) return;
    const slots = getOrInitMics(roomId);
    const idx = Number(slot) - 1;
    if (!slots[idx] || slots[idx].key !== socket.user.key) return;
    socket.to(roomId).emit('mic_audio_chunk', {
      roomId,
      slot,
      fromKey: socket.user.key,
      audioData
    });
  });

  // Moderation Handlers (Using Dynamic Rank Permissions Matrix)
  function handleMute({ targetKey, roomId, minutes }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'mute')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية كتم المستخدمين.' });
      return;
    }
    if (!targetKey) return;
    const meta = getTargetMetadata(targetKey);
    if (!canModerate(myRole, meta.targetRole, socket.user.key, targetKey)) {
      socket.emit('action_error', { message: 'لا يمكنك كتم مستخدم برتبة أعلى منك أو مساوية لك.' });
      return;
    }

    const scopeRoom = roomId || '*';
    const existing = db.getActiveMute(targetKey, scopeRoom);
    if (existing || minutes === 0) {
      db.removeMute(targetKey, '*');
      for (const [sid, e] of onlineSockets.entries()) {
        if (e.key === targetKey) {
          io.to(sid).emit('mute_status', { isMuted: false, expiresAt: null });
          if (e.roomId) broadcastRoomUsers(e.roomId);
        }
      }
      if (roomId) {
        io.to(roomId).emit('system_notice', {
          roomId,
          text: `🔊 قامت الإدارة بفك الكتم عن "${meta.targetName}".`
        });
      }
      broadcastGlobalOnlineUsers();
      return;
    }

    const mins = Math.min(10080, Math.max(1, Number(minutes) || 60));
    const expiresAt = db.setMute(targetKey, '*', mins * 60 * 1000, socket.user.name);
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === targetKey) {
        if (e.roomId) removeUserFromRoomMics(e.roomId, targetKey);
        io.to(sid).emit('mute_status', { isMuted: true, expiresAt, minutes: mins });
        if (e.roomId) broadcastRoomUsers(e.roomId);
      }
    }
    const noticeRoom = roomId || onlineSockets.get(socket.id)?.roomId;
    if (noticeRoom) {
      io.to(noticeRoom).emit('system_notice', {
        roomId: noticeRoom,
        text: `🔇 قامت الإدارة بكتم "${meta.targetName}" مؤقتاً.`
      });
    }
    broadcastGlobalOnlineUsers();
  }

  function handleKick({ targetKey, roomId }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'kick')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية طرد المستخدمين.' });
      return;
    }
    if (!targetKey) return;
    const meta = getTargetMetadata(targetKey);
    if (!canModerate(myRole, meta.targetRole, socket.user.key, targetKey)) {
      socket.emit('action_error', { message: 'لا يمكنك طرد مستخدم برتبة أعلى منك أو مساوية لك.' });
      return;
    }

    const noticeRoom = roomId || onlineSockets.get(socket.id)?.roomId;
    disconnectTargetSockets(targetKey, 'kicked_from_chat', {
      message: '👢 تم طردك من الشات بواسطة الإدارة'
    });

    if (noticeRoom && db.getRoomById(noticeRoom)) {
      io.to(noticeRoom).emit('system_notice', {
        roomId: noticeRoom,
        text: `👢 تم طرد "${meta.targetName}" من الشات بواسطة الإدارة.`
      });
    }
  }

  function handleBan({ targetKey, targetName, reason }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'ban')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية حظر المستخدمين.' });
      return;
    }
    if (!targetKey) return;
    const meta = getTargetMetadata(targetKey);
    if (!canModerate(myRole, meta.targetRole, socket.user.key, targetKey)) {
      socket.emit('action_error', { message: 'لا يمكنك حظر مستخدم برتبة أعلى منك أو مساوية لك.' });
      return;
    }

    const cleanReason = String(reason || '').trim() || 'حظر نهائي بواسطة الإدارة';
    db.banTarget({
      targetKey,
      targetName: targetName || meta.targetName,
      email: meta.email,
      ipAddress: meta.ipAddress,
      reason: cleanReason,
      bannedBy: socket.user.name
    });

    const noticeRoom = onlineSockets.get(socket.id)?.roomId;
    disconnectTargetSockets(targetKey, 'banned_forever', { reason: cleanReason });

    if (noticeRoom && db.getRoomById(noticeRoom)) {
      io.to(noticeRoom).emit('system_notice', {
        roomId: noticeRoom,
        text: `⛔ تم حظر "${meta.targetName}" نهائياً بواسطة الإدارة.`
      });
    }
    notifyAdminPanelRefresh();
  }

  socket.on('owner_mute', handleMute);
  socket.on('admin_mute', handleMute);
  socket.on('owner_kick', handleKick);
  socket.on('admin_kick', handleKick);
  socket.on('owner_ban', handleBan);
  socket.on('admin_ban', handleBan);

  socket.on('admin_unban', ({ targetKey }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'ban')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية فك الحظر.' });
      return;
    }
    if (!targetKey) return;
    db.unbanTarget(targetKey);
    socket.emit('action_success', { message: '✅ تم فك الحظر بنجاح.' });
    notifyAdminPanelRefresh();
  });

  function handleSetRole({ targetUserId, newRole }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'set_rank')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية منح أو تعديل الرتب.' });
      return;
    }
    if (!db.isValidRank(newRole)) {
      socket.emit('action_error', { message: 'الرتبة المختارة غير صالحة.' });
      return;
    }

    const uid = Number(targetUserId);
    const targetRow = Number.isNaN(uid) ? null : db.findUserById(uid);
    if (!targetRow) {
      socket.emit('action_error', { message: 'المستخدم غير موجود.' });
      return;
    }

    const targetKey = `user:${targetRow.id}`;
    if (targetKey === socket.user.key) {
      socket.emit('action_error', { message: 'لا يمكنك تغيير رتبتك بنفسك.' });
      return;
    }

    if (myRole !== 'site_owner') {
      if (db.getRankPower(targetRow.role) >= db.getRankPower(myRole)) {
        socket.emit('action_error', { message: 'لا يمكنك تعديل رتبة مستخدم أعلى منك أو مساوٍ لك.' });
        return;
      }
      if (db.getRankPower(newRole) >= db.getRankPower(myRole)) {
        socket.emit('action_error', { message: 'لا يمكنك منح رتبة مساوية لرتبتك أو أعلى منها.' });
        return;
      }
    }

    const updated = db.updateUserRole(uid, newRole);
    if (!updated) return;

    syncUserAcrossSockets(targetKey, { role: updated.role });
    io.emit('user_rank_updated', {
      targetKey,
      newRole: updated.role,
      name: db.getEffectiveName(updated)
    });
    const rankLabel = db.getRankByKey(updated.role)?.label || updated.role;
    socket.emit('action_success', {
      message: `✅ تم تحديث رتبة "${db.getEffectiveName(updated)}" إلى ${rankLabel}.`
    });
  }

  socket.on('admin_set_role', handleSetRole);
  socket.on('owner_set_rank', handleSetRole);

  socket.on('admin_rename_user', ({ targetKey, newName }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'set_rank') && myRole !== 'site_owner') {
      socket.emit('action_error', { message: 'تغيير أسماء المستخدمين متاح لمن يملك صلاحية الرتب والمالك فقط.' });
      return;
    }
    const cleanName = String(newName || '').trim().slice(0, 28);
    if (cleanName.length < 2) {
      socket.emit('action_error', { message: 'يجب أن يكون الاسم الجديد حرفين على الأقل.' });
      return;
    }
    const meta = getTargetMetadata(targetKey);
    if (myRole !== 'site_owner' && targetKey !== socket.user.key && db.getRankPower(meta.targetRole) >= db.getRankPower(myRole)) {
      socket.emit('action_error', { message: 'لا يمكنك تغيير اسم مستخدم برتبة أعلى منك أو مساوية لك.' });
      return;
    }

    if (targetKey.startsWith('user:')) {
      const uid = Number(targetKey.replace('user:', ''));
      const updated = db.forceChangeUserDisplayName(uid, cleanName);
      if (!updated) {
        socket.emit('action_error', { message: 'تعذر تحديث اسم المستخدم.' });
        return;
      }
      syncUserAcrossSockets(targetKey, { name: db.getEffectiveName(updated) });
    } else {
      syncUserAcrossSockets(targetKey, { name: cleanName });
    }

    socket.emit('action_success', { message: `✅ تم تغيير الاسم إلى "${cleanName}" بنجاح.` });
  });

  function handleClearRoom({ roomId }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'clear_room')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية مسح رسائل الغرف.' });
      return;
    }
    if (!roomId || !db.getRoomById(roomId)) return;

    db.clearRoomMessages(roomId);
    io.to(roomId).emit('room_cleared', {
      roomId,
      message: '🧹 قامت الإدارة بمسح جميع رسائل هذه الغرفة.'
    });
  }

  socket.on('owner_clear_room', handleClearRoom);
  socket.on('admin_clear_room', handleClearRoom);

  function sanitizeRoomFields(data) {
    const safeImg =
      data.imageUrl && (data.imageUrl.startsWith('/uploads/rooms/') || data.imageUrl.startsWith('/assets/rooms/'))
        ? data.imageUrl
        : undefined;
    const safeWallpaper =
      data.wallpaperUrl === undefined
        ? undefined
        : data.wallpaperUrl === '' || String(data.wallpaperUrl).startsWith('/uploads/wallpapers/')
          ? String(data.wallpaperUrl)
          : undefined;

    return {
      safeImg,
      safeWallpaper,
      bgCustom: data.bgCustom !== undefined ? String(data.bgCustom).trim().slice(0, 180) : undefined,
      welcomeMessage: data.welcomeMessage !== undefined ? String(data.welcomeMessage).trim().slice(0, 250) : undefined,
      roomPassword: data.roomPassword !== undefined ? String(data.roomPassword).trim().slice(0, 40) : undefined,
      minRankPower: data.minRankPower !== undefined ? Math.max(0, Math.min(100, Number(data.minRankPower) || 0)) : undefined
    };
  }

  function handleCreateRoom(data = {}) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'manage_rooms')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية إنشاء الغرف.' });
      return;
    }
    const cleanName = String(data.name || '').trim();
    if (cleanName.length < 2 || cleanName.length > 40) {
      socket.emit('action_error', { message: 'اسم الغرفة يجب أن يكون بين 2 و 40 حرفاً.' });
      return;
    }

    const parsed = sanitizeRoomFields(data);
    const id = `room-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
    const created = db.createRoom({
      id,
      name: cleanName,
      description: String(data.description || '').trim().slice(0, 120),
      icon: String(data.icon || '💬').trim().slice(0, 4) || '💬',
      imageUrl: parsed.safeImg || '/assets/rooms/default.svg',
      bgTheme: VALID_THEMES.has(data.bgTheme) ? data.bgTheme : 'warm_peach',
      wallpaperUrl: parsed.safeWallpaper || '',
      bgCustom: parsed.bgCustom || '',
      welcomeMessage: parsed.welcomeMessage || '',
      roomPassword: parsed.roomPassword || '',
      minRankPower: parsed.minRankPower || 0,
      createdBy: socket.user.name
    });

    broadcastRoomsList();
    notifyAdminPanelRefresh();
    socket.emit('room_created', db.sanitizeRoomForPublic(created));
  }

  socket.on('owner_create_room', handleCreateRoom);
  socket.on('admin_create_room', handleCreateRoom);

  socket.on('admin_update_room', (data = {}) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'manage_rooms')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية تعديل الغرف.' });
      return;
    }
    const { roomId, name, description, icon, bgTheme } = data;
    if (!roomId || !db.getRoomById(roomId)) {
      socket.emit('action_error', { message: 'الغرفة غير موجودة.' });
      return;
    }
    const parsed = sanitizeRoomFields(data);
    const updated = db.updateRoom(roomId, {
      name,
      description,
      icon,
      imageUrl: parsed.safeImg,
      bgTheme: VALID_THEMES.has(bgTheme) ? bgTheme : undefined,
      wallpaperUrl: parsed.safeWallpaper,
      bgCustom: parsed.bgCustom,
      welcomeMessage: parsed.welcomeMessage,
      roomPassword: parsed.roomPassword,
      minRankPower: parsed.minRankPower
    });
    if (!updated) return;

    const pubRoom = db.sanitizeRoomForPublic(updated);
    broadcastRoomsList();
    io.to(roomId).emit('room_updated', pubRoom);
    notifyAdminPanelRefresh();
    socket.emit('action_success', { message: `✅ تم تحديث غرفة "${updated.name}" بالكامل.` });
  });

  socket.on('admin_delete_room', ({ roomId }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    if (!canDo(myRole, 'manage_rooms')) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية حذف الغرف.' });
      return;
    }
    const allRooms = db.getAllRooms();
    if (allRooms.length <= 1) {
      socket.emit('action_error', { message: 'لا يمكن حذف آخر غرفة متبقية في الشات.' });
      return;
    }
    const target = db.getRoomById(roomId);
    if (!target) return;

    const fallback = allRooms.find((r) => r.id !== roomId);
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.roomId === roomId) {
        const s = io.sockets.sockets.get(sid);
        if (s && fallback) {
          s.leave(roomId);
          e.roomId = null;
          s.emit('force_join_room', {
            roomId: fallback.id,
            message: `تم حذف غرفة "${target.name}" ونقلك إلى "${fallback.name}".`
          });
        }
      }
    }

    db.deleteRoom(roomId);
    roomMics.delete(roomId);
    broadcastRoomsList();
    broadcastGlobalOnlineUsers();
    socket.emit('action_success', { message: `🗑️ تم حذف غرفة "${target.name}".` });
  });

  socket.on('disconnect', () => {
    const entry = onlineSockets.get(socket.id);
    onlineSockets.delete(socket.id);
    if (entry && entry.roomId) {
      removeUserFromRoomMics(entry.roomId, entry.key);
      broadcastRoomUsers(entry.roomId);
      broadcastRoomsList();
    }
    broadcastGlobalOnlineUsers();
  });
});

app.use((err, _req, res, _next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: err.message || 'خطأ في الخادم' });
});

server.listen(PORT, HOST, () => {
  console.log(`Arabic Realtime Chat listening on http://${HOST}:${PORT}`);
});
