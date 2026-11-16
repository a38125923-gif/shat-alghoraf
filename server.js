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
    textColor: row.text_color || '#ffffff',
    nameBgColor: row.name_bg_color || '',
    neonColor: row.neon_color || '',
    fontFamily: row.font_family || 'Normal',
    fontStyle: row.font_style || 'Normal',
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
      textColor: payload.textColor || '#ffffff',
      nameBgColor: payload.nameBgColor || '',
      neonColor: payload.neonColor || '',
      fontFamily: payload.fontFamily || 'Normal',
      fontStyle: payload.fontStyle || 'Normal',
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
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
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
  const storage = db.getStorageStatus();
  const isReady = Boolean(storage && (storage.ready || storage.initialized));
  res.status(isReady ? 200 : 503).json({
    ok: isReady,
    status: isReady ? 'ready' : 'initializing',
    storage
  });
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
    persistentMembers: buildPersistentMembersList(),
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
    textColor: '#ffffff',
    nameBgColor: '',
    neonColor: '',
    fontFamily: 'Normal',
    fontStyle: 'Normal',
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
    broadcastGlobalOnlineUsers();
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

app.post('/api/upload/admin-avatar', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'تغيير صور حسابات الأعضاء متاح للمالك ولمن لديه صلاحية الرتب.' });
  }
  uploadAvatar.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الصورة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
  });
});

function canUploadForRoom(req) {
  if (canDo(req.authUser.role, 'manage_rooms')) return true;
  const rid = String(req.query?.roomId || req.body?.roomId || '').trim();
  if (rid && db.isRoomManager(rid, req.authUser.userId, req.authUser.role)) return true;
  return false;
}

app.post('/api/upload/room', requireAuth, (req, res) => {
  if (!canUploadForRoom(req)) {
    return res.status(403).json({ error: 'رفع صور الغرف متاح لمن يملك صلاحية إدارة الغرف أو لمالك الغرفة.' });
  }
  uploadRoomImage.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع صورة الغرفة.' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة للغرفة.' });
    res.json({ url: `/uploads/rooms/${req.file.filename}` });
  });
});

app.post('/api/upload/wallpaper', requireAuth, (req, res) => {
  if (!canUploadForRoom(req)) {
    return res.status(403).json({ error: 'رفع خلفية الغرفة متاح لمن يملك صلاحية إدارة الغرف أو لمالك الغرفة.' });
  }
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
const reconnectGrace = new Map(); // userKey -> { roomId, expiresAt, timer }
let liveMsgSeq = 0;

function clearReconnectGrace(userKey) {
  const existing = reconnectGrace.get(userKey);
  if (existing) {
    clearTimeout(existing.timer);
    reconnectGrace.delete(userKey);
  }
  return existing || null;
}

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
    (a, b) => db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) || (a.name || '').localeCompare(b.name || '', 'ar')
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
    const base = includePasswords
      ? {
          ...db.sanitizeRoomForPublic(r),
          room_password: r.room_password || '',
          hasPassword: Boolean(r.room_password && r.room_password.trim())
        }
      : db.sanitizeRoomForPublic(r);
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
      username: entry.username || entry.name,
      name: entry.name,
      email: entry.email,
      ipAddress: entry.ipAddress,
      role: entry.role,
      nameColor: entry.nameColor,
      textColor: entry.textColor || '#ffffff',
      nameBgColor: entry.nameBgColor || '',
      neonColor: entry.neonColor || '',
      fontFamily: entry.fontFamily || 'Normal',
      fontStyle: entry.fontStyle || 'Normal',
      avatarUrl: entry.avatarUrl,
      avatarFrame: entry.avatarFrame,
      nameplateStyle: entry.nameplateStyle,
      coins: entry.coins,
      vipFamily: entry.vipFamily,
      roomId: entry.roomId,
      roomName: roomsById[entry.roomId]?.name || 'خارج الغرف',
      isOnline: true,
      isMuted: Boolean(muteRow),
      muteExpiresAt: muteRow ? muteRow.expires_at : null
    });
  }
  return sortByRank(list);
}

function buildPersistentMembersList() {
  const onlineByKey = new Map();
  const onlineList = buildGlobalOnlineUsers();
  for (const u of onlineList) {
    if (!onlineByKey.has(u.key)) {
      onlineByKey.set(u.key, u);
    }
  }

  const combined = [...onlineByKey.values()];
  const registered = db.getAllRegisteredUsers().filter((u) => u.is_banned !== 1);
  for (const r of registered) {
    const k = `user:${r.id}`;
    if (!onlineByKey.has(k)) {
      combined.push({
        key: k,
        userId: r.id,
        username: r.username,
        name: db.getEffectiveName(r),
        role: r.role,
        nameColor: r.name_color || '#ffffff',
        textColor: r.text_color || '#ffffff',
        nameBgColor: r.name_bg_color || '',
        neonColor: r.neon_color || '',
        fontFamily: r.font_family || 'Normal',
        fontStyle: r.font_style || 'Normal',
        avatarUrl: r.avatar_url || '',
        avatarFrame: r.avatar_frame || 'none',
        nameplateStyle: r.nameplate_style || 'default',
        roomId: null,
        roomName: 'غير متصل',
        isOnline: false,
        isMuted: Boolean(db.getActiveMute(k, '*'))
      });
    }
  }
  return sortByRank(combined);
}

function broadcastRoomsList() {
  io.emit('rooms_list', buildRoomsPayload(false));
}

function broadcastGlobalOnlineUsers() {
  const allOnline = buildGlobalOnlineUsers().map((u) => ({
    socketId: u.socketId,
    key: u.key,
    userId: u.userId,
    username: u.username,
    name: u.name,
    role: u.role,
    nameColor: u.nameColor,
    textColor: u.textColor,
    nameBgColor: u.nameBgColor,
    neonColor: u.neonColor,
    fontFamily: u.fontFamily,
    fontStyle: u.fontStyle,
    avatarUrl: u.avatarUrl,
    avatarFrame: u.avatarFrame,
    nameplateStyle: u.nameplateStyle,
    roomId: u.roomId,
    roomName: u.roomName,
    isOnline: true,
    isMuted: u.isMuted
  }));
  io.emit('online_users_global', allOnline);
  io.emit('persistent_members', buildPersistentMembersList());
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
        username: entry.username || entry.name,
        name: entry.name,
        role: entry.role,
        nameColor: entry.nameColor,
        textColor: entry.textColor || '#ffffff',
        nameBgColor: entry.nameBgColor || '',
        neonColor: entry.neonColor || '',
        fontFamily: entry.fontFamily || 'Normal',
        fontStyle: entry.fontStyle || 'Normal',
        avatarUrl: entry.avatarUrl,
        avatarFrame: entry.avatarFrame,
        nameplateStyle: entry.nameplateStyle,
        isOnline: true,
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
      if (patchUser.username !== undefined) entry.username = patchUser.username;
      if (patchUser.name !== undefined) entry.name = patchUser.name;
      if (patchUser.email !== undefined) entry.email = patchUser.email;
      if (patchUser.role !== undefined) entry.role = patchUser.role;
      if (patchUser.nameColor !== undefined) entry.nameColor = patchUser.nameColor;
      if (patchUser.textColor !== undefined) entry.textColor = patchUser.textColor;
      if (patchUser.nameBgColor !== undefined) entry.nameBgColor = patchUser.nameBgColor;
      if (patchUser.neonColor !== undefined) entry.neonColor = patchUser.neonColor;
      if (patchUser.fontFamily !== undefined) entry.fontFamily = patchUser.fontFamily;
      if (patchUser.fontStyle !== undefined) entry.fontStyle = patchUser.fontStyle;
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
          textColor: targetSocket.user.textColor,
          nameBgColor: targetSocket.user.nameBgColor,
          neonColor: targetSocket.user.neonColor,
          fontFamily: targetSocket.user.fontFamily,
          fontStyle: targetSocket.user.fontStyle,
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

function sanitizeOptionalHex(val) {
  if (val === undefined) return undefined;
  const s = String(val || '').trim();
  if (s === '') return '';
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : undefined;
}

// Customize profile & Text/Name Customizer
app.post('/api/profile/customize', requireAuth, (req, res) => {
  const rawDisplayName = String(req.body?.displayName || '').trim();
  const rawColor = String(req.body?.nameColor || '').trim();
  const rawTextColor = req.body?.textColor;
  const rawNameBgColor = req.body?.nameBgColor;
  const rawNeonColor = req.body?.neonColor;
  const rawFontFamily = typeof req.body?.fontFamily === 'string' ? req.body.fontFamily.trim().slice(0, 40) : undefined;
  const rawFontStyle = typeof req.body?.fontStyle === 'string' ? req.body.fontStyle.trim().slice(0, 30) : undefined;
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
  const nextTextColor =
    rawTextColor !== undefined ? sanitizeOptionalHex(rawTextColor) || '#ffffff' : req.authUser.textColor || '#ffffff';
  const nextNameBgColor =
    rawNameBgColor !== undefined ? sanitizeOptionalHex(rawNameBgColor) ?? '' : req.authUser.nameBgColor || '';
  const nextNeonColor =
    rawNeonColor !== undefined ? sanitizeOptionalHex(rawNeonColor) ?? '' : req.authUser.neonColor || '';
  const nextFontFamily = rawFontFamily !== undefined ? rawFontFamily || 'Normal' : req.authUser.fontFamily || 'Normal';
  const nextFontStyle = rawFontStyle !== undefined ? rawFontStyle || 'Normal' : req.authUser.fontStyle || 'Normal';

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
    textColor: nextTextColor,
    nameBgColor: nextNameBgColor,
    neonColor: nextNeonColor,
    fontFamily: nextFontFamily,
    fontStyle: nextFontStyle,
    avatarUrl: safeAvatar,
    avatarFrame: validFrame,
    nameplateStyle: validPlate,
    vipFamily: vipFamily !== undefined ? vipFamily.slice(0, 24) : req.authUser.vipFamily
  };

  if (req.authUser.type === 'user' && req.authUser.userId) {
    const saved = db.updateUserCustomization(req.authUser.userId, {
      displayName: nextName,
      nameColor: validColor,
      textColor: nextTextColor,
      nameBgColor: nextNameBgColor,
      neonColor: nextNeonColor,
      fontFamily: nextFontFamily,
      fontStyle: nextFontStyle,
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
    textColor: updatedUser.textColor,
    nameBgColor: updatedUser.nameBgColor,
    neonColor: updatedUser.neonColor,
    fontFamily: updatedUser.fontFamily,
    fontStyle: updatedUser.fontStyle,
    avatarUrl: updatedUser.avatarUrl,
    avatarFrame: updatedUser.avatarFrame,
    nameplateStyle: updatedUser.nameplateStyle,
    coins: updatedUser.coins,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  syncUserAcrossSockets(updatedUser.key, {
    name: updatedUser.name,
    nameColor: updatedUser.nameColor,
    textColor: updatedUser.textColor,
    nameBgColor: updatedUser.nameBgColor,
    neonColor: updatedUser.neonColor,
    fontFamily: updatedUser.fontFamily,
    fontStyle: updatedUser.fontStyle,
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

app.post('/api/social/pm-read', requireAuth, (req, res) => {
  const partnerKey = String(req.body?.partnerKey || '').trim();
  if (!partnerKey) return res.status(400).json({ error: 'معرف الطرف الآخر مطلوب.' });
  const updatedCount = db.markPrivateMessagesRead(req.authUser.key, partnerKey);
  if (updatedCount > 0) {
    for (const [sid, entry] of onlineSockets.entries()) {
      if (entry.key === partnerKey || entry.key === req.authUser.key) {
        io.to(sid).emit('pm_read_receipt', {
          readerKey: req.authUser.key,
          partnerKey
        });
      }
    }
  }
  res.json({ ok: true, updatedCount });
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

// Room Options & Ownership Management (Site Admins OR Room Owner/Staff)
app.put('/api/rooms/:roomId/options', requireAuth, (req, res) => {
  const roomId = String(req.params.roomId || '').trim();
  const room = db.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  if (!db.isRoomManager(roomId, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'تعديل خيارات الغرفة متاح لمالك الغرفة ومشرفيها أو إدارة الموقع.' });
  }

  const body = req.body || {};
  const canAssignOwner = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  const safeImg =
    body.imageUrl !== undefined &&
    (body.imageUrl === '' || String(body.imageUrl).startsWith('/uploads/rooms/') || String(body.imageUrl).startsWith('/assets/rooms/'))
      ? String(body.imageUrl)
      : undefined;
  const safeWallpaper =
    body.wallpaperUrl !== undefined &&
    (body.wallpaperUrl === '' || String(body.wallpaperUrl).startsWith('/uploads/wallpapers/'))
      ? String(body.wallpaperUrl)
      : undefined;

  const updated = db.updateRoom(roomId, {
    name: body.name !== undefined ? String(body.name).trim().slice(0, 40) : undefined,
    description: body.description !== undefined ? String(body.description).trim().slice(0, 120) : undefined,
    welcomeMessage: body.welcomeMessage !== undefined ? String(body.welcomeMessage).trim().slice(0, 250) : undefined,
    roomPassword: body.roomPassword !== undefined ? String(body.roomPassword).trim().slice(0, 40) : undefined,
    minRankPower: body.minRankPower !== undefined ? Math.max(0, Math.min(100, Number(body.minRankPower) || 0)) : undefined,
    bgTheme: VALID_THEMES.has(body.bgTheme) ? body.bgTheme : undefined,
    bgCustom: body.bgCustom !== undefined ? String(body.bgCustom).trim().slice(0, 180) : undefined,
    cardBgColor: body.cardBgColor !== undefined ? String(body.cardBgColor).trim() : undefined,
    cardTextColor: body.cardTextColor !== undefined ? String(body.cardTextColor).trim() : undefined,
    wallpaperUrl: safeWallpaper,
    imageUrl: safeImg,
    micsEnabled: body.micsEnabled !== undefined ? Boolean(body.micsEnabled) : undefined,
    ownerUserId: canAssignOwner && body.ownerUserId !== undefined ? body.ownerUserId : undefined
  });

  if (!updated) return res.status(404).json({ error: 'تعذر تحديث الغرفة.' });

  if (body.micsEnabled === false) {
    roomMics.set(roomId, [null, null, null, null, null]);
    broadcastRoomMics(roomId);
  } else if (body.micsEnabled !== undefined) {
    broadcastRoomMics(roomId);
  }

  const pubRoom = db.sanitizeRoomForPublic(updated);
  broadcastRoomsList();
  io.to(roomId).emit('room_updated', pubRoom);
  notifyAdminPanelRefresh();
  res.json({ room: pubRoom, message: `✅ تم حفظ إعدادات غرفة "${pubRoom.name}" بنجاح.` });
});

app.post('/api/rooms/:roomId/staff', requireAuth, (req, res) => {
  const roomId = String(req.params.roomId || '').trim();
  const room = db.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  const isGlobalMgr = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  const isThisRoomOwner = room.owner_user_id && Number(room.owner_user_id) === Number(req.authUser.userId);
  if (!isGlobalMgr && !isThisRoomOwner) {
    return res.status(403).json({ error: 'إدارة موظفي الغرفة متاحة لمالك الغرفة أو إدارة الموقع.' });
  }

  const targetUserId = Number(req.body?.userId);
  const action = String(req.body?.action || 'add_staff');
  const staffRole = String(req.body?.staffRole || 'مشرف غرفة').trim().slice(0, 30);

  if (action === 'set_owner') {
    if (!isGlobalMgr) {
      return res.status(403).json({ error: 'تعيين مالك الغرفة الرئيسي متاح لإدارة الموقع فقط.' });
    }
    const updated = db.setRoomOwner(roomId, targetUserId || null);
    if (!updated) return res.status(404).json({ error: 'العضو المختار غير موجود.' });
    const pubRoom = db.sanitizeRoomForPublic(updated);
    broadcastRoomsList();
    io.to(roomId).emit('room_updated', pubRoom);
    notifyAdminPanelRefresh();
    return res.json({ room: pubRoom, message: '👑 تم تعيين مالك الغرفة بنجاح.' });
  }

  const staffList = db.addRoomStaff(roomId, targetUserId, staffRole, req.authUser.name);
  if (!staffList) return res.status(404).json({ error: 'العضو غير موجود.' });
  const pubRoom = db.sanitizeRoomForPublic(db.getRoomById(roomId));
  broadcastRoomsList();
  io.to(roomId).emit('room_updated', pubRoom);
  res.json({ room: pubRoom, staff: staffList, message: '✅ تم إضافة الموظف للغرفة.' });
});

app.delete('/api/rooms/:roomId/staff/:userId', requireAuth, (req, res) => {
  const roomId = String(req.params.roomId || '').trim();
  const room = db.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  const isGlobalMgr = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  const isThisRoomOwner = room.owner_user_id && Number(room.owner_user_id) === Number(req.authUser.userId);
  if (!isGlobalMgr && !isThisRoomOwner) {
    return res.status(403).json({ error: 'إزالة موظفي الغرفة متاحة لمالك الغرفة أو إدارة الموقع.' });
  }

  const staffList = db.removeRoomStaff(roomId, req.params.userId);
  const pubRoom = db.sanitizeRoomForPublic(db.getRoomById(roomId));
  broadcastRoomsList();
  io.to(roomId).emit('room_updated', pubRoom);
  res.json({ room: pubRoom, staff: staffList, message: '🗑️ تم إزالة الموظف من طاقم الغرفة.' });
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
    textColor: u.text_color || '#ffffff',
    nameBgColor: u.name_bg_color || '',
    neonColor: u.neon_color || '',
    fontFamily: u.font_family || 'Normal',
    fontStyle: u.font_style || 'Normal',
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
    persistentMembers: buildPersistentMembersList(),
    registeredUsers: registered,
    bans: db.getAllBans(),
    rooms: buildRoomsPayload(includeRoomPass),
    reports: db.getReports(),
    ranks: db.getAllRanks(),
    emojis: db.getAllCustomEmojis(),
    siteSettings: db.getSiteSettings()
  });
});

// Owner Full Account Management (Create + Full Edit: Name, Username, Avatar, Email, Password, Rank)
app.post('/api/admin/users', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'إنشاء حسابات الأعضاء متاح للمالك ولمن يملك صلاحية إدارة الرتب.' });
  }
  const username = String(req.body?.username || '').trim();
  const displayName = String(req.body?.displayName || username).trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const role = String(req.body?.role || 'member').trim();

  if (username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 2 و 24 حرفاً.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.' });
  }
  if (req.authUser.role !== 'site_owner' && db.getRankSortWeight(role) >= db.getRankSortWeight(req.authUser.role)) {
    return res.status(403).json({ error: 'لا يمكنك إنشاء حساب برتبة مساوية لرتبتك أو أعلى منها.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const created = db.adminCreateUser({ username, displayName, email, passwordHash, role });
  if (created.error) return res.status(409).json({ error: created.error });

  broadcastGlobalOnlineUsers();
  res.status(201).json({
    user: mapUserRow(created.user),
    message: `✅ تم إنشاء حساب "${db.getEffectiveName(created.user)}" بنجاح.`
  });
});

app.put('/api/admin/users/:id', requireAuth, requirePanelAccess, (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'تعديل بيانات الأعضاء متاح للمالك ولمن يملك صلاحية إدارة الرتب.' });
  }
  const targetId = Number(req.params.id);
  const targetRow = Number.isNaN(targetId) ? null : db.findUserById(targetId);
  if (!targetRow) return res.status(404).json({ error: 'الحساب غير موجود.' });

  if (targetRow.role === 'site_owner' && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'لا يمكن تعديل حساب صاحب الموقع.' });
  }
  if (
    req.authUser.role !== 'site_owner' &&
    targetRow.id !== req.authUser.userId &&
    db.getRankSortWeight(targetRow.role) >= db.getRankSortWeight(req.authUser.role)
  ) {
    return res.status(403).json({ error: 'لا يمكنك تعديل حساب برتبة أعلى منك أو مساوية لك.' });
  }

  const body = req.body || {};
  const nextUsername = body.username !== undefined ? String(body.username).trim() : undefined;
  const nextDisplayName = body.displayName !== undefined ? String(body.displayName).trim() : undefined;
  const nextEmail = body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
  const nextPassword = body.password !== undefined ? String(body.password) : '';
  const nextRole = body.role !== undefined ? String(body.role).trim() : undefined;
  const nextAvatar =
    body.avatarUrl !== undefined
      ? body.avatarUrl === '' || String(body.avatarUrl).startsWith('/uploads/avatars/')
        ? String(body.avatarUrl)
        : undefined
      : undefined;

  if (nextUsername !== undefined && (nextUsername.length < 2 || nextUsername.length > 24)) {
    return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 2 و 24 حرفاً.' });
  }
  if (nextDisplayName !== undefined && (nextDisplayName.length < 2 || nextDisplayName.length > 28)) {
    return res.status(400).json({ error: 'الاسم المستعار يجب أن يكون بين 2 و 28 حرفاً.' });
  }
  if (nextEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح.' });
  }
  if (nextPassword && nextPassword.length < 4) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.' });
  }
  if (nextRole !== undefined) {
    if (!db.isValidRank(nextRole)) return res.status(400).json({ error: 'الرتبة المختارة غير صالحة.' });
    if (req.authUser.role !== 'site_owner' && db.getRankSortWeight(nextRole) >= db.getRankSortWeight(req.authUser.role)) {
      return res.status(403).json({ error: 'لا يمكنك منح رتبة أعلى من رتبتك أو مساوية لها.' });
    }
  }

  const passwordHash = nextPassword ? bcrypt.hashSync(nextPassword, 10) : undefined;
  const updated = db.adminUpdateUserAccount(targetId, {
    displayName: nextDisplayName,
    username: nextUsername,
    email: nextEmail,
    passwordHash,
    avatarUrl: nextAvatar,
    role: nextRole
  });
  if (updated.error) return res.status(409).json({ error: updated.error });

  const mapped = mapUserRow(updated.user);
  syncUserAcrossSockets(mapped.key, {
    username: mapped.username,
    name: mapped.name,
    email: mapped.email,
    role: mapped.role,
    avatarUrl: mapped.avatarUrl
  });
  io.emit('user_rank_updated', {
    targetKey: mapped.key,
    newRole: mapped.role,
    name: mapped.name
  });
  res.json({
    user: mapped,
    message: `✅ تم تحديث بيانات "${mapped.name}" وحفظها فوراً.`
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

  let pendingGrace = clearReconnectGrace(user.key);

  onlineSockets.set(socket.id, {
    socketId: socket.id,
    key: user.key,
    userId: user.userId,
    username: user.username || user.name,
    email: user.email || '',
    ipAddress: socket.clientIp || '',
    name: user.name,
    role: user.role,
    nameColor: user.nameColor,
    textColor: user.textColor || '#ffffff',
    nameBgColor: user.nameBgColor || '',
    neonColor: user.neonColor || '',
    fontFamily: user.fontFamily || 'Normal',
    fontStyle: user.fontStyle || 'Normal',
    avatarUrl: user.avatarUrl,
    avatarFrame: user.avatarFrame,
    nameplateStyle: user.nameplateStyle,
    coins: user.coins,
    vipFamily: user.vipFamily || '',
    roomId: null,
    lastHeartbeat: Date.now()
  });

  socket.on('heartbeat', () => {
    const entry = onlineSockets.get(socket.id);
    if (entry) {
      entry.lastHeartbeat = Date.now();
    }
    socket.emit('heartbeat_ack', { ts: Date.now() });
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
    const isSilentReconnect = Boolean(
      pendingGrace &&
        pendingGrace.roomId === targetRoomId &&
        Date.now() <= pendingGrace.expiresAt &&
        oldRoomId === null
    );
    pendingGrace = null;

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
      isReconnect: isSilentReconnect,
      mics: {
        roomId: targetRoomId,
        micsEnabled: room.mics_enabled !== 0,
        slots: getOrInitMics(targetRoomId)
      }
    });

    const settings = db.getSiteSettings();
    if (!isSilentReconnect && oldRoomId === null && settings.welcome_message) {
      socket.emit('system_notice', {
        roomId: targetRoomId,
        text: `👋 ${settings.welcome_message}`
      });
    }
    if (!isSilentReconnect && room.welcome_message) {
      socket.emit('system_notice', {
        roomId: targetRoomId,
        text: `📌 ترحيب الغرفة: ${room.welcome_message}`
      });
    }

    if (!isSilentReconnect && oldRoomId !== targetRoomId) {
      const joinRole = currentEntry?.role || socket.user.role;
      const rankLabel = db.getRankByKey(joinRole)?.label || 'عضو';
      io.to(targetRoomId).emit('system_notice', {
        roomId: targetRoomId,
        text: `✨ انضم (# ${rankLabel} #) "${currentEntry?.name || socket.user.name}" إلى الغرفة.`
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
    const isStaffBypass =
      myRole === 'site_owner' ||
      canDo(myRole, 'manage_rooms') ||
      db.isRoomManager(targetRoomObj.id, socket.user.userId, myRole);

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
    const clientMsgId = String(payload?.clientMsgId || '').trim().slice(0, 64);

    if (msgType === 'text' && !content) return;
    if ((msgType === 'image' || msgType === 'audio') && !mediaUrl.startsWith('/uploads/')) return;

    const senderName = entry?.name || socket.user.name;
    const senderRole = entry?.role || socket.user.role;
    const nameColor = entry?.nameColor || socket.user.nameColor;
    const textColor = entry?.textColor || socket.user.textColor || '#ffffff';
    const nameBgColor = entry?.nameBgColor || socket.user.nameBgColor || '';
    const neonColor = entry?.neonColor || socket.user.neonColor || '';
    const fontFamily = entry?.fontFamily || socket.user.fontFamily || 'Normal';
    const fontStyle = entry?.fontStyle || socket.user.fontStyle || 'Normal';
    const avatarUrl = entry?.avatarUrl || socket.user.avatarUrl;
    const avatarFrame = entry?.avatarFrame || socket.user.avatarFrame || 'none';
    const nameplateStyle = entry?.nameplateStyle || socket.user.nameplateStyle || 'default';

    liveMsgSeq += 1;
    const nowMs = Date.now();
    const createdAtIso = new Date(nowMs).toISOString();
    const liveId = `live-${nowMs}-${liveMsgSeq}`;
    const instantMsg = {
      id: liveId,
      client_msg_id: clientMsgId,
      room_id: roomId,
      sender_key: socket.user.key,
      sender_name: senderName,
      sender_role: senderRole,
      name_color: nameColor,
      text_color: textColor,
      name_bg_color: nameBgColor,
      neon_color: neonColor,
      font_family: fontFamily,
      font_style: fontStyle,
      avatar_url: avatarUrl,
      avatar_frame: avatarFrame,
      nameplate_style: nameplateStyle,
      msg_type: msgType,
      content,
      media_url: mediaUrl,
      created_at: createdAtIso,
      created_at_ms: nowMs
    };

    // Immediate non-blocking broadcast to all connected clients in the room
    io.to(roomId).emit('new_message', instantMsg);

    // Parallel / non-blocking permanent save to Cloud Firestore + @mentions
    setImmediate(() => {
      try {
        const saved = db.addMessage({
          roomId,
          senderKey: socket.user.key,
          senderName,
          senderRole,
          nameColor,
          textColor,
          nameBgColor,
          neonColor,
          fontFamily,
          fontStyle,
          avatarUrl,
          avatarFrame,
          nameplateStyle,
          msgType,
          content,
          mediaUrl,
          clientMsgId,
          createdAt: createdAtIso,
          createdAtMs: nowMs
        });

        if (msgType === 'text' && content.includes('@')) {
          const lowerContent = content.toLowerCase();
          const notifiedKeys = new Set();
          for (const [sid, onlineEntry] of onlineSockets.entries()) {
            if (onlineEntry.key === socket.user.key || notifiedKeys.has(onlineEntry.key)) continue;
            const n1 = (onlineEntry.name || '').trim().toLowerCase();
            const n2 = (onlineEntry.username || '').trim().toLowerCase();
            if ((n1 && lowerContent.includes(`@${n1}`)) || (n2 && lowerContent.includes(`@${n2}`))) {
              notifiedKeys.add(onlineEntry.key);
              io.to(sid).emit('mention_alert', {
                roomId,
                messageId: saved?.id || liveId,
                fromKey: socket.user.key,
                fromName: senderName,
                text: content.slice(0, 120)
              });
            }
          }
        }
      } catch (err) {
        console.error('Firestore message persist error:', err);
      }
    });
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
    const isRoomMgr = roomId && db.isRoomManager(roomId, socket.user.userId, myRole);
    if (!canDo(myRole, 'mute') && !canDo(myRole, 'kick') && !isRoomMgr) return;
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
    const isRoomMgr = roomId && db.isRoomManager(roomId, socket.user.userId, myRole);
    if (!canDo(myRole, 'manage_rooms') && !canDo(myRole, 'access_panel') && !isRoomMgr) return;
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

  // Private Chat Read Receipts & Live Voice Call Signaling
  socket.on('pm_mark_read', ({ partnerKey }) => {
    if (!partnerKey) return;
    const updated = db.markPrivateMessagesRead(socket.user.key, String(partnerKey));
    if (updated > 0) {
      for (const [sid, e] of onlineSockets.entries()) {
        if (e.key === partnerKey || e.key === socket.user.key) {
          io.to(sid).emit('pm_read_receipt', {
            readerKey: socket.user.key,
            partnerKey
          });
        }
      }
    }
  });

  socket.on('pm_voice_call', ({ toKey, action }) => {
    if (!toKey || toKey === socket.user.key) return;
    const entry = onlineSockets.get(socket.id);
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === toKey) {
        io.to(sid).emit('pm_voice_call', {
          fromKey: socket.user.key,
          fromName: entry?.name || socket.user.name,
          fromAvatar: entry?.avatarUrl || socket.user.avatarUrl,
          action: String(action || 'offer')
        });
      }
    }
  });

  socket.on('pm_voice_chunk', ({ toKey, audioData }) => {
    if (!toKey || !audioData) return;
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === toKey) {
        io.to(sid).emit('pm_voice_chunk', {
          fromKey: socket.user.key,
          audioData
        });
      }
    }
  });

  // Moderation Handlers (Using Dynamic Rank Permissions Matrix + Room Ownership)
  function handleMute({ targetKey, roomId, minutes }) {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    const isRoomMgr = roomId && db.isRoomManager(roomId, socket.user.userId, myRole);
    if (!canDo(myRole, 'mute') && !isRoomMgr) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية كتم المستخدمين.' });
      return;
    }
    if (!targetKey) return;
    const meta = getTargetMetadata(targetKey);
    if (!canDo(myRole, 'mute') && isRoomMgr) {
      if (meta.targetRole === 'site_owner' || targetKey === socket.user.key) {
        socket.emit('action_error', { message: 'لا يمكنك كتم هذا العضو.' });
        return;
      }
    } else if (!canModerate(myRole, meta.targetRole, socket.user.key, targetKey)) {
      socket.emit('action_error', { message: 'لا يمكنك كتم مستخدم برتبة أعلى منك أو مساوية لك.' });
      return;
    }

    const scopeRoom = !canDo(myRole, 'mute') && isRoomMgr ? roomId : roomId || '*';
    const existing = db.getActiveMute(targetKey, scopeRoom);
    if (existing || minutes === 0) {
      db.removeMute(targetKey, !canDo(myRole, 'mute') && isRoomMgr ? roomId : '*');
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
    const expiresAt = db.setMute(targetKey, !canDo(myRole, 'mute') && isRoomMgr ? roomId : '*', mins * 60 * 1000, socket.user.name);
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
        text: `🔇 قام المشرف بكتم "${meta.targetName}" مؤقتاً.`
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

  // Room-level kick (used by Room Owners & Room Staff in خيارات الغرفة -> إدارة الإجراءات)
  socket.on('room_kick_member', ({ roomId, targetKey }) => {
    const myRole = onlineSockets.get(socket.id)?.role || socket.user.role;
    const targetRoom = roomId || onlineSockets.get(socket.id)?.roomId;
    if (!targetRoom || !targetKey) return;
    if (!db.isRoomManager(targetRoom, socket.user.userId, myRole)) {
      socket.emit('action_error', { message: 'طرد الأعضاء من الغرفة متاح لمالك وطاقم الغرفة فقط.' });
      return;
    }
    const meta = getTargetMetadata(targetKey);
    if (meta.targetRole === 'site_owner' || targetKey === socket.user.key) {
      socket.emit('action_error', { message: 'لا يمكنك طرد هذا العضو.' });
      return;
    }
    const fallback = db.getAllRooms().find((r) => r.id !== targetRoom) || db.getRoomById('general');
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === targetKey && e.roomId === targetRoom) {
        removeUserFromRoomMics(targetRoom, targetKey);
        const ts = io.sockets.sockets.get(sid);
        if (ts) {
          if (fallback && fallback.id !== targetRoom) {
            ts.leave(targetRoom);
            e.roomId = null;
            ts.emit('force_join_room', {
              roomId: fallback.id,
              message: `👢 تم إبعادك من هذه الغرفة بواسطة إدارة الغرفة.`
            });
          } else {
            ts.emit('kicked_from_chat', { message: '👢 تم طردك من الغرفة بواسطة إدارة الغرفة.' });
            ts.disconnect(true);
            onlineSockets.delete(sid);
          }
        }
      }
    }
    broadcastRoomUsers(targetRoom);
    broadcastRoomsList();
    io.to(targetRoom).emit('system_notice', {
      roomId: targetRoom,
      text: `👢 تم إخراج "${meta.targetName}" من الغرفة بواسطة طاقم الغرفة.`
    });
  });

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
      if (db.getRankSortWeight(targetRow.role) >= db.getRankSortWeight(myRole)) {
        socket.emit('action_error', { message: 'لا يمكنك تعديل رتبة مستخدم أعلى منك أو مساوٍ لك.' });
        return;
      }
      if (db.getRankSortWeight(newRole) >= db.getRankSortWeight(myRole)) {
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
    if (myRole !== 'site_owner' && targetKey !== socket.user.key && db.getRankSortWeight(meta.targetRole) >= db.getRankSortWeight(myRole)) {
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
    const isRoomMgr = roomId && db.isRoomManager(roomId, socket.user.userId, myRole);
    if (!canDo(myRole, 'clear_room') && !isRoomMgr) {
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
      cardBgColor: data.cardBgColor !== undefined ? String(data.cardBgColor).trim() : undefined,
      cardTextColor: data.cardTextColor !== undefined ? String(data.cardTextColor).trim() : undefined,
      welcomeMessage: data.welcomeMessage !== undefined ? String(data.welcomeMessage).trim().slice(0, 250) : undefined,
      roomPassword: data.roomPassword !== undefined ? String(data.roomPassword).trim().slice(0, 40) : undefined,
      minRankPower: data.minRankPower !== undefined ? Math.max(0, Math.min(100, Number(data.minRankPower) || 0)) : undefined,
      ownerUserId: data.ownerUserId !== undefined ? (data.ownerUserId ? Number(data.ownerUserId) : null) : undefined
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
      cardBgColor: parsed.cardBgColor || '',
      cardTextColor: parsed.cardTextColor || '',
      welcomeMessage: parsed.welcomeMessage || '',
      roomPassword: parsed.roomPassword || '',
      minRankPower: parsed.minRankPower || 0,
      ownerUserId: parsed.ownerUserId || null,
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
    const { roomId, name, description, icon, bgTheme } = data;
    if (!roomId || !db.getRoomById(roomId)) {
      socket.emit('action_error', { message: 'الغرفة غير موجودة.' });
      return;
    }
    const isRoomMgr = db.isRoomManager(roomId, socket.user.userId, myRole);
    if (!canDo(myRole, 'manage_rooms') && !isRoomMgr) {
      socket.emit('action_error', { message: 'ليس لديك صلاحية تعديل الغرف.' });
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
      cardBgColor: parsed.cardBgColor,
      cardTextColor: parsed.cardTextColor,
      welcomeMessage: parsed.welcomeMessage,
      roomPassword: parsed.roomPassword,
      minRankPower: parsed.minRankPower,
      ownerUserId: canDo(myRole, 'manage_rooms') ? parsed.ownerUserId : undefined
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

  socket.on('disconnect', (reason) => {
    const entry = onlineSockets.get(socket.id);
    onlineSockets.delete(socket.id);

    const isExplicitLeave =
      reason === 'client namespace disconnect' || reason === 'server namespace disconnect';

    if (entry && entry.roomId) {
      if (isExplicitLeave) {
        clearReconnectGrace(entry.key);
        removeUserFromRoomMics(entry.roomId, entry.key);
        broadcastRoomUsers(entry.roomId);
        broadcastRoomsList();
        broadcastGlobalOnlineUsers();
        return;
      }

      // Allow 30s grace window for auto-reconnect so idle blips/tab switches never disrupt user presence
      const hasOtherActiveSocket = [...onlineSockets.values()].some((e) => e.key === entry.key);
      if (!hasOtherActiveSocket) {
        clearReconnectGrace(entry.key);
        const leftRoomId = entry.roomId;
        const leftKey = entry.key;
        const expiresAt = Date.now() + 30000;
        const timer = setTimeout(() => {
          reconnectGrace.delete(leftKey);
          const stillOnline = [...onlineSockets.values()].some((e) => e.key === leftKey);
          if (!stillOnline) {
            removeUserFromRoomMics(leftRoomId, leftKey);
            broadcastRoomUsers(leftRoomId);
            broadcastRoomsList();
            broadcastGlobalOnlineUsers();
          }
        }, 30000);
        reconnectGrace.set(leftKey, { roomId: leftRoomId, expiresAt, timer });
      }
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

let isShuttingDown = false;
async function shutdownGracefully(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}, flushing Firestore writes...`);
  try {
    await db.flushWrites();
  } catch (err) {
    console.error('Error flushing Firestore writes on shutdown:', err);
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 4000).unref();
}

process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
process.on('SIGINT', () => shutdownGracefully('SIGINT'));

async function startServer() {
  try {
    await db.init({
      onExternalMessage: (msg) => {
        if (msg && msg.room_id) {
          io.to(msg.room_id).emit('new_message', msg);
        }
      },
      onRanksChanged: () => {
        io.emit('ranks_updated', db.getAllRanks());
      },
      onRoomsChanged: () => {
        broadcastRoomsList();
      },
      onSettingsChanged: () => {
        io.emit('site_settings_updated', db.getSiteSettings());
      },
      onEmojisChanged: () => {
        io.emit('emojis_updated', db.getAllCustomEmojis());
      }
    });

    server.listen(PORT, HOST, () => {
      console.log(`Arabic Realtime Chat listening on http://${HOST}:${PORT} (Firestore: ${db.getStorageStatus().databaseId})`);
    });
  } catch (err) {
    console.error('Failed to initialize Cloud Firestore backend:', err);
    process.exit(1);
  }
}

startServer();
