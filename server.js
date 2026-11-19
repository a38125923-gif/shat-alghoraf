const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');

const rawEnvPort = Number(process.env.PORT);
const nginxEnvPort = Number(process.env.NGINX_PORT || 0);
const PORT =
  Number(process.env.APP_PORT) ||
  (rawEnvPort && rawEnvPort !== nginxEnvPort ? rawEnvPort : Number(process.env.DEFAULT_APP_PORT || 3000));
const TOKEN_SECRET =
  process.env.CHAT_TOKEN_SECRET || 'arabic-chat-super-secret-token-key-2026-v3';

const UPLOAD_ROOT = path.join(__dirname, 'data', 'uploads');
const UPLOAD_SUBDIRS = ['avatars', 'covers', 'images', 'audio', 'wallpapers', 'emojis', 'rank_icons', 'news'];
for (const sub of UPLOAD_SUBDIRS) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
}

const SHOP_FRAMES = [
  { id: 'none', label: 'بدون إطار', price: 0, tier: 'free', preview: '#64748b' },
  { id: 'kings_crown', label: 'تاج الملوك KINGS', price: 0, tier: 'vip', preview: '#fbbf24' },
  { id: 'gold_royal', label: 'الإطار الذهبي الملكي', price: 0, tier: 'vip', preview: '#f59e0b' },
  { id: 'fire_gold', label: 'إطار اللهب الذهبي', price: 0, tier: 'vip', preview: '#f97316' },
  { id: 'diamond_ring', label: 'الإطار الماسي', price: 0, tier: 'vip', preview: '#38bdf8' },
  { id: 'emerald_crown', label: 'إطار الزمرد الملكي', price: 0, tier: 'vip', preview: '#10b981' },
  { id: 'neon_rainbow', label: 'إطار قوس قزح المضيء', price: 0, tier: 'vip', preview: '#ec4899' },
  { id: 'royal_wings', label: 'إطار الأجنحة الملكية', price: 0, tier: 'vip', preview: '#eab308' },
  { id: 'plasma_violet', label: 'إطار البلازما البنفسجي', price: 0, tier: 'vip', preview: '#a855f7' }
];

const SHOP_NAMEPLATES = [
  { id: 'default', label: 'كلاسيكي نقي', price: 0 },
  { id: 'gold_vip', label: 'شريط VIP الذهبي', price: 0 },
  { id: 'crimson_royal', label: 'الشريط القرمزي الملكي', price: 0 },
  { id: 'sky_prism', label: 'الطيف الأزرق', price: 0 },
  { id: 'emerald_elite', label: 'النخبة الزمردية', price: 0 }
];

const NAME_SHINES = [
  { id: 'none', label: 'بدون لمعة', previewColor: '#ffffff' },
  { id: 'gold_shimmer', label: 'لمعة الذهب المتحركة', previewColor: '#fbbf24' },
  { id: 'rainbow_wave', label: 'طيف قوس قزح', previewColor: '#ec4899' },
  { id: 'diamond_sparkle', label: 'بريق الألماس الأزرق', previewColor: '#38bdf8' },
  { id: 'crimson_pulse', label: 'وهج الياقوت الأحمر', previewColor: '#fb7185' },
  { id: 'emerald_glitter', label: 'بريق الزمرد الأخضر', previewColor: '#34d399' },
  { id: 'royal_aura', label: 'هالة البنفسج الملكية', previewColor: '#c084fc' }
];

const PROFILE_BG_EFFECTS = [
  { id: 'none', label: 'بدون خلفية متحركة', preview: '#1e293b' },
  { id: 'animated_flames', label: 'لهب ذهبي متوهج', preview: '#ea580c' },
  { id: 'falling_stars', label: 'نجوم وشُهب متساقطة', preview: '#38bdf8' },
  { id: 'royal_waves', label: 'أمواج ملكية متدرجة', preview: '#7c3aed' },
  { id: 'aurora_glow', label: 'شفق الألماس الساحر', preview: '#10b981' }
];

const RANK_BADGE_STYLES = [
  { id: 'crown_royal', label: 'تاج ملكي متحرك', iconClass: 'fa-solid fa-crown' },
  { id: 'gold_eagle', label: 'نسر ذهبي مجنح', iconClass: 'fa-solid fa-feather-pointed' },
  { id: 'silver_wing', label: 'جناح فضي لامع', iconClass: 'fa-solid fa-dove' },
  { id: 'diamond_medal', label: 'وسام ماسي متوهج', iconClass: 'fa-solid fa-gem' },
  { id: 'royal_shield', label: 'درع الحماية الملكي', iconClass: 'fa-solid fa-shield-halved' },
  { id: 'neon_badge', label: 'شارة نيون حديثة', iconClass: 'fa-solid fa-certificate' }
];

const RADIO_STATIONS = [
  {
    id: 'arabic_hits',
    name: 'إذاعة الأغاني العربية المباشرة',
    genre: 'طرب وموسيقى عربية',
    streamUrl: 'https://n0e.radiojar.com/8s5u5tpdtwzuv'
  },
  {
    id: 'quran_live',
    name: 'إذاعة القرآن الكريم المباشرة',
    genre: 'تلاوات عطرة على مدار الساعة',
    streamUrl: 'https://n0a.radiojar.com/0tpy1h0kxtzuv'
  },
  {
    id: 'chill_lofi',
    name: 'موسيقى استرخاء ولوفاي',
    genre: 'أجواء هادئة للدردشة',
    streamUrl: 'https://streams.fluxfm.de/Chillhop/mp3-320/audio/'
  },
  {
    id: 'classic_tarab',
    name: 'سهرة الطرب الأصيل والعود',
    genre: 'طرب أصيل',
    streamUrl: 'https://n09.radiojar.com/4wqre23fytzuv'
  }
];

const PROFILE_MUSIC_PRESETS = [
  { id: '', label: 'بدون موسيقى' },
  { id: 'preset:calm_lofi', label: 'أنغام هادئة (Lo-Fi)' },
  { id: 'preset:royal_oud', label: 'نغمة شرقية ملكية' },
  { id: 'preset:ambient_stars', label: 'أوتار ليلية ناعمة' }
];

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '6mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, storage: db.getStorageStatus() });
});

function getClientIp(reqOrSocket) {
  const headers = reqOrSocket.headers || reqOrSocket.handshake?.headers || {};
  const xff = headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  const raw =
    reqOrSocket.ip ||
    reqOrSocket.handshake?.address ||
    reqOrSocket.socket?.remoteAddress ||
    '';
  return String(raw).replace(/^::ffff:/, '');
}

// ==========================================
// TOKEN SIGNING & AUTH HELPERS
// ==========================================
function signToken(payloadObj) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ...payloadObj, iat: Date.now() })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function canDo(role, permName) {
  return db.hasPermission(role, permName);
}

function isUserStealth(userOrEntry) {
  if (!userOrEntry) return false;
  const role = userOrEntry.role;
  const email = userOrEntry.email || '';
  if (role !== 'site_owner' && !db.isSupremeOwnerEmail(email)) return false;
  return Boolean(userOrEntry.isStealth || userOrEntry.is_stealth);
}

function mapUserRow(u) {
  if (!u) return null;
  const rank = db.getRankByKey(u.role);
  const effectiveName = db.getEffectiveName(u);
  const stealth = isUserStealth(u);
  const ratingCount = Number(u.rating_count) || 0;
  const ratingSum = Number(u.rating_sum) || 0;
  const ratingAvg = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 5.0;
  return {
    key: `user:${u.id}`,
    userId: u.id,
    isGuest: false,
    username: u.username,
    displayName: u.display_name || u.username,
    name: effectiveName,
    email: u.email,
    role: u.role,
    rank,
    nameColor: u.name_color || '#0f172a',
    textColor: u.text_color || '#111827',
    nameBgColor: u.name_bg_color || '',
    neonColor: u.neon_color || '',
    fontFamily: u.font_family || 'Normal',
    fontStyle: u.font_style || 'Normal',
    fontSize: Math.max(12, Math.min(20, Number(u.font_size) || 14)),
    avatarUrl: u.avatar_url || '',
    coverUrl: u.cover_url || '',
    avatarFrame: u.avatar_frame || 'none',
    nameplateStyle: u.nameplate_style || 'default',
    nameShine: u.name_shine || 'none',
    profileBgEffect: u.profile_bg_effect || 'none',
    vipWings: Boolean(u.vip_wings),
    profileMusic: u.profile_music || '',
    bio: u.bio || '',
    age: u.age || '',
    gender: u.gender || '',
    country: u.country || '',
    allowCalls: u.allow_calls !== 0,
    allowPm: u.allow_pm !== 0,
    likesCount: Number(u.likes_count) || 0,
    ratingSum,
    ratingCount,
    ratingAvg,
    coins: Number(u.coins) || 0,
    vipFamily: u.vip_family || '',
    isStealth: stealth,
    isGhosted: Boolean(u.is_ghosted),
    activityPoints: Number(u.activity_points) || 0,
    giftsReceived: Number(u.gifts_received) || 0,
    giftsSent: Number(u.gifts_sent) || 0
  };
}

function resolveAuthFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.isGuest) {
    return {
      key: payload.key,
      userId: null,
      isGuest: true,
      name: payload.name || 'زائر',
      displayName: payload.name || 'زائر',
      username: payload.name || 'زائر',
      role: 'guest',
      rank: db.getRankByKey('guest'),
      nameColor: '#ffffff',
      textColor: '#ffffff',
      nameBgColor: '',
      neonColor: '',
      fontFamily: 'Normal',
      fontStyle: 'Normal',
      fontSize: 14,
      avatarUrl: '',
      avatarFrame: 'none',
      nameplateStyle: 'default',
      nameShine: 'none',
      vipWings: false,
      profileMusic: '',
      bio: '',
      coins: 0,
      vipFamily: '',
      isStealth: false,
      activityPoints: 0,
      giftsReceived: 0,
      giftsSent: 0
    };
  }

  if (payload.userId) {
    const row = db.findUserById(payload.userId);
    if (!row) return null;
    if (db.isSupremeOwnerEmail(row.email)) {
      db.ensureSupremeOwnerAccount(row.id);
    }
    const freshRow = db.findUserById(row.id);
    if (!freshRow) return null;
    const ban = db.isTargetBanned({ targetKey: `user:${freshRow.id}`, email: freshRow.email });
    if (ban) return { banned: true, reason: ban.reason };
    return mapUserRow(freshRow);
  }
  return null;
}

function requireAuth(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u) return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً.' });
  if (u.banned) return res.status(403).json({ error: `حسابك محظور: ${u.reason}` });
  req.authUser = u;
  return next();
}

function requireRegistered(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest) return res.status(401).json({ error: 'هذه الميزة متاحة للأعضاء المسجلين فقط.' });
  if (u.banned) return res.status(403).json({ error: `حسابك محظور: ${u.reason}` });
  req.authUser = u;
  return next();
}

function requirePanelAccess(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest) return res.status(403).json({ error: 'صلاحية الإدارة مطلوبة.' });
  if (u.role !== 'site_owner' && !canDo(u.role, 'access_panel')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية دخول لوحة التحكم.' });
  }
  req.authUser = u;
  return next();
}

function requireOwner(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest || u.role !== 'site_owner') {
    return res.status(403).json({ error: 'هذه الصلاحية مخصصة لصاحب الموقع فقط.' });
  }
  req.authUser = u;
  return next();
}

// ==========================================
// MULTER UPLOADS
// ==========================================
function makeUploader(subdir, allowedPrefix, maxBytes = 12 * 1024 * 1024) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, subdir)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || (allowedPrefix === 'audio/' ? '.webm' : '.png');
      const safeExt = /^[.a-z0-9]{2,8}$/.test(ext) ? ext : '.bin';
      cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`);
    }
  });
  return multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype && file.mimetype.startsWith(allowedPrefix)) cb(null, true);
      else cb(new Error('نوع الملف غير مدعوم.'));
    }
  });
}

const uploadAvatar = makeUploader('avatars', 'image/', 8 * 1024 * 1024);
const uploadCover = makeUploader('covers', 'image/', 10 * 1024 * 1024);
const uploadImage = makeUploader('images', 'image/', 10 * 1024 * 1024);
const uploadAudio = makeUploader('audio', 'audio/', 12 * 1024 * 1024);
const uploadWallpaper = makeUploader('wallpapers', 'image/', 12 * 1024 * 1024);
const uploadEmoji = makeUploader('emojis', 'image/', 4 * 1024 * 1024);
const uploadRankIcon = makeUploader('rank_icons', 'image/', 3 * 1024 * 1024);
const uploadNewsImg = makeUploader('news', 'image/', 10 * 1024 * 1024);

// ==========================================
// REAL-TIME STATE MAPS
// ==========================================
const onlineSockets = new Map(); // socketId -> user session entry
const roomMics = new Map(); // roomId -> [slot1..slot5]
const pendingGrace = new Map(); // key -> { timeout, lastRoomId }
const roomActivitySpam = new Map(); // key -> { count, resetAt }

function ensureRoomMicSlots(roomId) {
  if (!roomMics.has(roomId)) {
    roomMics.set(
      roomId,
      [1, 2, 3, 4, 5].map((slot) => ({
        slot,
        holderKey: null,
        holderSocketId: null,
        holderName: null,
        holderRole: null,
        holderAvatar: null,
        isSelfMuted: false,
        isAdminMuted: false,
        isSpeaking: false
      }))
    );
  }
  return roomMics.get(roomId);
}

function getPublicMicSlots(roomId) {
  return ensureRoomMicSlots(roomId).map((s) => ({ ...s }));
}

function isStealthEntry(entry) {
  return Boolean(entry && entry.isStealth && (entry.role === 'site_owner' || db.isSupremeOwnerEmail(entry.email)));
}

function getRoomUsersList(roomId) {
  const byKey = new Map();
  for (const entry of onlineSockets.values()) {
    if (entry.roomId === roomId && !isStealthEntry(entry)) {
      byKey.set(entry.key, {
        key: entry.key,
        userId: entry.userId,
        isGuest: entry.isGuest,
        name: entry.name,
        displayName: entry.displayName,
        username: entry.username,
        role: entry.role,
        rank: db.getRankByKey(entry.role),
        nameColor: entry.nameColor,
        textColor: entry.textColor,
        nameBgColor: entry.nameBgColor,
        neonColor: entry.neonColor,
        fontFamily: entry.fontFamily,
        fontStyle: entry.fontStyle,
        avatarUrl: entry.avatarUrl,
        coverUrl: entry.coverUrl || '',
        avatarFrame: entry.avatarFrame,
        nameplateStyle: entry.nameplateStyle,
        nameShine: entry.nameShine || 'none',
        profileBgEffect: entry.profileBgEffect || 'none',
        vipWings: Boolean(entry.vipWings),
        profileMusic: entry.profileMusic || '',
        bio: entry.bio || '',
        age: entry.age || '',
        gender: entry.gender || '',
        country: entry.country || '',
        allowCalls: entry.allowCalls !== false,
        allowPm: entry.allowPm !== false,
        likesCount: Number(entry.likesCount) || 0,
        ratingAvg: Number(entry.ratingAvg) || 5.0,
        ratingCount: Number(entry.ratingCount) || 0,
        isGhosted: Boolean(entry.isGhosted),
        coins: Number(entry.coins) || 0,
        vipFamily: entry.vipFamily || '',
        activityPoints: Number(entry.activityPoints) || 0,
        giftsReceived: Number(entry.giftsReceived) || 0,
        giftsSent: Number(entry.giftsSent) || 0
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) || a.name.localeCompare(b.name, 'ar')
  );
}

function buildGlobalOnlineUsers() {
  const byKey = new Map();
  for (const entry of onlineSockets.values()) {
    if (isStealthEntry(entry)) continue;
    const rm = entry.roomId ? db.getRoomById(entry.roomId) : null;
    byKey.set(entry.key, {
      key: entry.key,
      userId: entry.userId,
      isGuest: entry.isGuest,
      name: entry.name,
      role: entry.role,
      rank: db.getRankByKey(entry.role),
      nameColor: entry.nameColor,
      avatarUrl: entry.avatarUrl,
      coverUrl: entry.coverUrl || '',
      avatarFrame: entry.avatarFrame,
      nameplateStyle: entry.nameplateStyle,
      nameShine: entry.nameShine || 'none',
      profileBgEffect: entry.profileBgEffect || 'none',
      vipWings: Boolean(entry.vipWings),
      profileMusic: entry.profileMusic || '',
      bio: entry.bio || '',
      age: entry.age || '',
      gender: entry.gender || '',
      country: entry.country || '',
      allowCalls: entry.allowCalls !== false,
      allowPm: entry.allowPm !== false,
      likesCount: Number(entry.likesCount) || 0,
      ratingAvg: Number(entry.ratingAvg) || 5.0,
      ratingCount: Number(entry.ratingCount) || 0,
      isGhosted: Boolean(entry.isGhosted),
      vipFamily: entry.vipFamily || '',
      activityPoints: Number(entry.activityPoints) || 0,
      roomId: entry.roomId || null,
      roomName: rm ? rm.name : ''
    });
  }
  return [...byKey.values()].sort(
    (a, b) => db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) || a.name.localeCompare(b.name, 'ar')
  );
}

function buildPersistentMembersList() {
  const onlineKeys = new Set();
  for (const entry of onlineSockets.values()) {
    if (!isStealthEntry(entry)) onlineKeys.add(entry.key);
  }
  return db.getAllRegisteredUsers().map((u) => {
    const key = `user:${u.id}`;
    const isStealth = isUserStealth(u);
    const ratingCount = Number(u.rating_count) || 0;
    const ratingAvg = ratingCount > 0 ? Number(((Number(u.rating_sum) || 0) / ratingCount).toFixed(1)) : 5.0;
    return {
      key,
      userId: u.id,
      isGuest: false,
      username: u.username,
      name: db.getEffectiveName(u),
      displayName: u.display_name || u.username,
      role: u.role,
      rank: db.getRankByKey(u.role),
      avatarUrl: u.avatar_url || '',
      coverUrl: u.cover_url || '',
      avatarFrame: u.avatar_frame || 'none',
      nameplateStyle: u.nameplate_style || 'default',
      nameShine: u.name_shine || 'none',
      profileBgEffect: u.profile_bg_effect || 'none',
      vipWings: Boolean(u.vip_wings),
      profileMusic: u.profile_music || '',
      bio: u.bio || '',
      age: u.age || '',
      gender: u.gender || '',
      country: u.country || '',
      allowCalls: u.allow_calls !== 0,
      allowPm: u.allow_pm !== 0,
      likesCount: Number(u.likes_count) || 0,
      ratingAvg,
      ratingCount,
      isGhosted: Boolean(u.is_ghosted),
      nameColor: u.name_color || '#0f172a',
      vipFamily: u.vip_family || '',
      coins: Number(u.coins) || 0,
      activityPoints: Number(u.activity_points) || 0,
      giftsReceived: Number(u.gifts_received) || 0,
      online: !isStealth && onlineKeys.has(key)
    };
  });
}

function buildRoomsPayload() {
  return db.getAllRooms().map((r) => {
    const pub = db.sanitizeRoomForPublic(r);
    const activeKeys = new Set();
    for (const e of onlineSockets.values()) {
      if (e.roomId === r.id && !isStealthEntry(e)) activeKeys.add(e.key);
    }
    return {
      ...pub,
      onlineCount: activeKeys.size
    };
  });
}

function broadcastRoomUsers(io, roomId) {
  if (!roomId) return;
  io.to(`room:${roomId}`).emit('room_users', {
    roomId,
    users: getRoomUsersList(roomId)
  });
}

function broadcastGlobalOnlineUsers(io) {
  io.emit('online_users_global', buildGlobalOnlineUsers());
}

function broadcastRoomsList(io) {
  io.emit('rooms_list', buildRoomsPayload());
}

function syncUserAcrossSockets(io, userId) {
  const row = db.findUserById(userId);
  if (!row) return;
  const mapped = mapUserRow(row);
  const affectedRooms = new Set();
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.userId === Number(userId)) {
      Object.assign(entry, {
        name: mapped.name,
        displayName: mapped.displayName,
        username: mapped.username,
        role: mapped.role,
        nameColor: mapped.nameColor,
        textColor: mapped.textColor,
        nameBgColor: mapped.nameBgColor,
        neonColor: mapped.neonColor,
        fontFamily: mapped.fontFamily,
        fontStyle: mapped.fontStyle,
        avatarUrl: mapped.avatarUrl,
        coverUrl: mapped.coverUrl,
        avatarFrame: mapped.avatarFrame,
        nameplateStyle: mapped.nameplateStyle,
        nameShine: mapped.nameShine,
        profileBgEffect: mapped.profileBgEffect,
        vipWings: mapped.vipWings,
        profileMusic: mapped.profileMusic,
        bio: mapped.bio,
        age: mapped.age,
        gender: mapped.gender,
        country: mapped.country,
        allowCalls: mapped.allowCalls,
        allowPm: mapped.allowPm,
        likesCount: mapped.likesCount,
        ratingAvg: mapped.ratingAvg,
        ratingCount: mapped.ratingCount,
        isGhosted: mapped.isGhosted,
        coins: mapped.coins,
        vipFamily: mapped.vipFamily,
        isStealth: mapped.isStealth,
        activityPoints: mapped.activityPoints,
        giftsReceived: mapped.giftsReceived,
        giftsSent: mapped.giftsSent
      });
      io.to(sid).emit('session_updated', { user: mapped });
      if (entry.roomId) affectedRooms.add(entry.roomId);
    }
  }
  for (const rid of affectedRooms) {
    broadcastRoomUsers(io, rid);
  }
  broadcastGlobalOnlineUsers(io);
  io.emit('persistent_members', buildPersistentMembersList());
}

function emitNotificationToUser(io, targetKey, notifObj) {
  for (const [sid, entry] of onlineSockets.entries()) {
    if (targetKey === '*' || entry.key === targetKey) {
      io.to(sid).emit('new_notification', {
        ...notifObj,
        unreadCount: db.getUnreadNotificationCount(entry.key)
      });
    }
  }
}

function extractYouTubeId(rawInput) {
  const s = String(rawInput || '').trim();
  if (!s) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    const v = u.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live' || p === 'v');
    if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
      return parts[idx + 1];
    }
  } catch {
    // fallback regex
  }
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : '';
}

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const cleanUser = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    if (cleanUser.length < 2 || cleanUser.length > 24) {
      return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 2 و 24 حرفاً.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صالح.' });
    }
    if (cleanPass.length < 5) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 5 أحرف على الأقل.' });
    }

    const ip = getClientIp(req);
    const deviceId = String(req.headers['x-device-id'] || req.body?.deviceId || '').trim().slice(0, 128);
    if (!db.isSupremeOwnerEmail(cleanEmail)) {
      const ipBan = db.isTargetBanned({ email: cleanEmail, ipAddress: ip, deviceId });
      if (ipBan) {
        return res.status(403).json({ error: `تم حظر هذا الحساب أو الجهاز: ${ipBan.reason}` });
      }
    }

    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const result = db.registerUser({
      username: cleanUser,
      email: cleanEmail,
      passwordHash,
      ipAddress: ip,
      deviceId
    });
    if (result.error) return res.status(409).json({ error: result.error });

    const finalUser = db.findUserById(result.user.id);
    const mapped = mapUserRow(finalUser);
    const token = signToken({ userId: mapped.userId, isGuest: false });
    await db.flushWrites();
    io.emit('persistent_members', buildPersistentMembersList());
    return res.json({ token, user: mapped });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'تعذر إنشاء الحساب حالياً.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(password || '');
    if (!cleanId || !cleanPass) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.' });
    }

    const row = db.findUserByIdentifier(cleanId);
    if (!row) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }

    const ok = await bcrypt.compare(cleanPass, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    const ip = getClientIp(req);
    const deviceId = String(req.headers['x-device-id'] || req.body?.deviceId || '').trim().slice(0, 128);
    if (db.isSupremeOwnerEmail(row.email)) {
      db.ensureSupremeOwnerAccount(row.id);
    } else {
      const ban = db.isTargetBanned({ targetKey: `user:${row.id}`, email: row.email, ipAddress: ip, deviceId });
      if (ban) {
        return res.status(403).json({ error: `تم حظر هذا الحساب: ${ban.reason}` });
      }
    }

    db.updateUserIp(row.id, ip, deviceId);
    const freshRow = db.findUserById(row.id);
    const mapped = mapUserRow(freshRow);
    const token = signToken({ userId: mapped.userId, isGuest: false });
    return res.json({ token, user: mapped });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

app.post('/api/guest', (req, res) => {
  const rawName = String(req.body?.name || '').trim().slice(0, 22);
  const name = rawName.length >= 2 ? rawName : `زائر_${Math.floor(100 + Math.random() * 900)}`;
  const ip = getClientIp(req);
  const deviceId = String(req.headers['x-device-id'] || req.body?.deviceId || '').trim().slice(0, 128);
  const key = `guest:${crypto.randomBytes(6).toString('hex')}`;
  const ban = db.isTargetBanned({ ipAddress: ip, deviceId });
  if (ban) return res.status(403).json({ error: `هذا الجهاز محظور: ${ban.reason}` });

  const token = signToken({ key, name, isGuest: true });
  const user = {
    key,
    userId: null,
    isGuest: true,
    name,
    displayName: name,
    username: name,
    role: 'guest',
    rank: db.getRankByKey('guest'),
    nameColor: '#ffffff',
    textColor: '#ffffff',
    nameBgColor: '',
    neonColor: '',
    fontFamily: 'Normal',
    fontStyle: 'Normal',
    avatarUrl: '',
    avatarFrame: 'none',
    nameplateStyle: 'default',
    nameShine: 'none',
    vipWings: false,
    profileMusic: '',
    bio: '',
    coins: 0,
    vipFamily: '',
    isStealth: false,
    activityPoints: 0,
    giftsReceived: 0,
    giftsSent: 0
  };
  return res.json({ token, user });
});

app.get('/api/me', (req, res) => {
  const u = resolveAuthFromRequest(req);
  if (!u) return res.status(401).json({ error: 'جلسة غير صالحة.' });
  if (u.banned) return res.status(403).json({ error: u.reason });
  return res.json({ user: u });
});

app.post('/api/logout', (_req, res) => {
  res.json({ ok: true });
});

// ==========================================
// PUBLIC CONFIG, RANKS, EMOJIS, NEWS, GIFTS
// ==========================================
app.get('/api/ranks', (_req, res) => {
  res.json({ ranks: db.getAllRanks() });
});

app.get('/api/emojis', (_req, res) => {
  res.json({ emojis: db.getAllCustomEmojis() });
});

app.get('/api/settings/public', (_req, res) => {
  res.json({ settings: db.getSiteSettings() });
});

// ==========================================
// UPLOAD ENDPOINTS
// ==========================================
app.post('/api/upload/avatar', requireRegistered, uploadAvatar.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة.' });
  const url = `/uploads/avatars/${req.file.filename}`;
  db.updateUserCustomization(req.authUser.userId, { avatarUrl: url });
  syncUserAcrossSockets(io, req.authUser.userId);
  return res.json({ url });
});

app.post('/api/upload/cover', requireRegistered, uploadCover.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة الغلاف.' });
  const url = `/uploads/covers/${req.file.filename}`;
  db.updateUserCustomization(req.authUser.userId, { coverUrl: url });
  syncUserAcrossSockets(io, req.authUser.userId);
  return res.json({ url });
});

app.post('/api/upload/image', requireAuth, uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة.' });
  return res.json({ url: `/uploads/images/${req.file.filename}` });
});

app.post('/api/upload/audio', requireAuth, uploadAudio.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق ملف صوتي.' });
  return res.json({ url: `/uploads/audio/${req.file.filename}` });
});

app.post('/api/upload/wallpaper', requirePanelAccess, uploadWallpaper.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة خلفية.' });
  return res.json({ url: `/uploads/wallpapers/${req.file.filename}` });
});

app.post('/api/upload/emoji', requirePanelAccess, uploadEmoji.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة إيموجي.' });
  return res.json({ url: `/uploads/emojis/${req.file.filename}` });
});

app.post('/api/upload/rank-icon', requirePanelAccess, uploadRankIcon.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق أيقونة رتبة.' });
  return res.json({ url: `/uploads/rank_icons/${req.file.filename}` });
});

app.post('/api/upload/news', requireRegistered, uploadNewsImg.single('file'), (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'publish_news')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية نشر الأخبار.' });
  }
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة الخبر.' });
  return res.json({ url: `/uploads/news/${req.file.filename}` });
});

// ==========================================
// YOUTUBE SEARCH BY NAME & RADIO STATIONS
// ==========================================
app.get('/api/radio/stations', (_req, res) => {
  res.json({ stations: RADIO_STATIONS });
});

app.get('/api/youtube/search', requireAuth, async (req, res) => {
  const q = String(req.query?.q || '').trim().slice(0, 120);
  if (!q) return res.status(400).json({ error: 'أدخل كلمة البحث عن فيديو يوتيوب.' });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const ytRes = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
        }
      }
    );
    clearTimeout(timer);
    const html = await ytRes.text();
    const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    const results = [];
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      const sections =
        parsed?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      for (const sec of sections) {
        const items = sec?.itemSectionRenderer?.contents || [];
        for (const item of items) {
          const vr = item.videoRenderer;
          if (!vr || !vr.videoId) continue;
          const title = (vr.title?.runs || []).map((r) => r.text).join('') || vr.title?.simpleText || q;
          const author = (vr.ownerText?.runs || []).map((r) => r.text).join('') || 'YouTube';
          const duration = vr.lengthText?.simpleText || 'فيديو';
          results.push({
            videoId: vr.videoId,
            title: title.slice(0, 120),
            author: author.slice(0, 60),
            duration,
            thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`
          });
          if (results.length >= 12) break;
        }
        if (results.length >= 12) break;
      }
    }
    return res.json({ results });
  } catch (err) {
    return res.json({
      results: [
        {
          videoId: 'jfKfPfyJRdk',
          title: `بث موسيقى هادئة - ${q}`,
          author: 'Lofi Radio',
          duration: 'مباشر',
          thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg'
        },
        {
          videoId: '5qap5aO4i9A',
          title: 'أنغام عربية واسترخاء',
          author: 'Music Stream',
          duration: 'HD',
          thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg'
        }
      ]
    });
  }
});

// ==========================================
// PROFILE CUSTOMIZER, CREDENTIALS, INTERACT, STEALTH, SHOP & ADDONS
// ==========================================
app.post('/api/profile/stealth', requireOwner, async (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  const resStealth = db.setUserStealth(req.authUser.userId, enabled);
  if (!resStealth || resStealth.error) {
    return res.status(403).json({ error: resStealth?.error || 'تعذر تحديث وضع التخفي.' });
  }
  syncUserAcrossSockets(io, req.authUser.userId);
  broadcastRoomsList(io);
  for (const r of db.getAllRooms()) {
    broadcastRoomUsers(io, r.id);
  }
  await db.flushWrites();
  return res.json({ ok: true, isStealth: enabled, user: mapUserRow(resStealth.user) });
});

app.post('/api/profile/credentials', requireRegistered, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    const existing = db.findUserById(req.authUser.userId);
    if (!existing) return res.status(404).json({ error: 'الحساب غير موجود.' });
    if (newPassword && String(newPassword).length < 5) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 5 أحرف على الأقل.' });
    }
    if (newPassword || (email && email.trim().toLowerCase() !== existing.email.toLowerCase())) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية للتأكيد.' });
      }
      const passOk = await bcrypt.compare(String(currentPassword), existing.password_hash);
      if (!passOk) {
        return res.status(403).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
      }
    }
    const passwordHash = newPassword ? await bcrypt.hash(String(newPassword), 10) : null;
    const upd = db.updateUserCredentials(req.authUser.userId, { email, passwordHash });
    if (upd.error) return res.status(400).json({ error: upd.error });
    syncUserAcrossSockets(io, req.authUser.userId);
    await db.flushWrites();
    return res.json({ ok: true, user: mapUserRow(upd.user) });
  } catch (err) {
    return res.status(500).json({ error: 'تعذر تحديث بيانات الحساب.' });
  }
});

app.post('/api/profile/interact', requireAuth, async (req, res) => {
  const { targetKey, like, rating } = req.body || {};
  if (!targetKey || !String(targetKey).startsWith('user:')) {
    return res.status(400).json({ error: 'التفاعل متاح لملفات الأعضاء المسجلين فقط.' });
  }
  if (targetKey === req.authUser.key) {
    return res.status(400).json({ error: 'لا يمكنك تقييم أو الإعجاب بملفك الشخصي.' });
  }
  const uid = Number(String(targetKey).replace('user:', ''));
  const updated = db.interactProfile(uid, { like: Boolean(like), rating });
  if (!updated) return res.status(404).json({ error: 'العضو غير موجود.' });
  syncUserAcrossSockets(io, uid);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
});

app.post('/api/profile/customize', requireRegistered, async (req, res) => {
  const {
    displayName,
    nameColor,
    textColor,
    nameBgColor,
    neonColor,
    fontFamily,
    fontStyle,
    fontSize,
    avatarUrl,
    coverUrl,
    avatarFrame,
    nameplateStyle,
    nameShine,
    profileBgEffect,
    vipWings,
    profileMusic,
    bio,
    vipFamily,
    age,
    gender,
    country,
    allowCalls,
    allowPm
  } = req.body || {};

  const canUseAddons = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'use_addons');
  const wantsAddonEquip =
    (avatarFrame !== undefined && avatarFrame !== 'none' && avatarFrame !== req.authUser.avatarFrame) ||
    (nameplateStyle !== undefined && nameplateStyle !== 'default' && nameplateStyle !== req.authUser.nameplateStyle) ||
    (nameShine !== undefined && nameShine !== 'none' && nameShine !== req.authUser.nameShine) ||
    (profileBgEffect !== undefined && profileBgEffect !== 'none' && profileBgEffect !== req.authUser.profileBgEffect) ||
    (vipWings === true && !req.authUser.vipWings) ||
    (profileMusic !== undefined && profileMusic !== '' && profileMusic !== req.authUser.profileMusic);

  if (wantsAddonEquip && !canUseAddons) {
    return res.status(403).json({ error: 'استخدام الإضافات (الإطارات واللمعة والموسيقى) غير مفعّل لرتبتك الحالية.' });
  }

  const updated = db.updateUserCustomization(req.authUser.userId, {
    displayName,
    nameColor,
    textColor,
    nameBgColor,
    neonColor,
    fontFamily,
    fontStyle,
    fontSize,
    avatarUrl,
    coverUrl,
    avatarFrame,
    nameplateStyle,
    nameShine,
    profileBgEffect,
    vipWings,
    profileMusic,
    bio,
    vipFamily,
    age,
    gender,
    country,
    allowCalls,
    allowPm
  });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserAcrossSockets(io, req.authUser.userId);
  await db.flushWrites();
  return res.json({ user: mapUserRow(updated) });
});

app.get('/api/shop/items', (_req, res) => {
  res.json({
    frames: SHOP_FRAMES,
    nameplates: SHOP_NAMEPLATES,
    shines: NAME_SHINES,
    profileBackgrounds: PROFILE_BG_EFFECTS,
    rankBadgeStyles: RANK_BADGE_STYLES,
    musicPresets: PROFILE_MUSIC_PRESETS,
    radioStations: RADIO_STATIONS,
    gifts: db.GIFT_CATALOG
  });
});

app.post('/api/shop/equip', requireRegistered, async (req, res) => {
  const { type, itemId } = req.body || {};
  const canUseAddons = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'use_addons');
  const isClearing =
    itemId === 'none' || itemId === 'default' || itemId === '' || itemId === false || itemId === 0;

  if (!isClearing && !canUseAddons) {
    return res.status(403).json({ error: 'رتبتك لا تملك صلاحية استخدام الإضافات حالياً.' });
  }

  let patch = null;
  if (type === 'frame') {
    const exists = SHOP_FRAMES.some((f) => f.id === itemId);
    if (!exists) return res.status(400).json({ error: 'الإطار غير موجود.' });
    patch = { avatarFrame: itemId };
  } else if (type === 'nameplate') {
    const exists = SHOP_NAMEPLATES.some((n) => n.id === itemId);
    if (!exists) return res.status(400).json({ error: 'القالب غير موجود.' });
    patch = { nameplateStyle: itemId };
  } else if (type === 'shine') {
    const exists = NAME_SHINES.some((s) => s.id === itemId);
    if (!exists) return res.status(400).json({ error: 'اللمعة غير موجودة.' });
    patch = { nameShine: itemId };
  } else if (type === 'bg_effect') {
    const exists = PROFILE_BG_EFFECTS.some((b) => b.id === itemId);
    if (!exists) return res.status(400).json({ error: 'الخلفية المتحركة غير موجودة.' });
    patch = { profileBgEffect: itemId };
  } else if (type === 'wings') {
    patch = { vipWings: Boolean(itemId) };
  } else if (type === 'music') {
    patch = { profileMusic: String(itemId || '').slice(0, 300) };
  } else {
    return res.status(400).json({ error: 'نوع الإضافة غير صالح.' });
  }

  const updated = db.updateUserCustomization(req.authUser.userId, patch);
  syncUserAcrossSockets(io, req.authUser.userId);
  await db.flushWrites();
  return res.json({ user: mapUserRow(updated) });
});

// ==========================================
// GIFTS SYSTEM
// ==========================================
app.get('/api/gifts/catalog', (_req, res) => {
  res.json({ gifts: db.GIFT_CATALOG });
});

app.get('/api/gifts/user/:key', (req, res) => {
  const targetKey = decodeURIComponent(req.params.key || '');
  res.json(db.getGiftsForUser(targetKey));
});

app.post('/api/gifts/send', requireRegistered, async (req, res) => {
  try {
    const { toKey, toName, giftId, roomId } = req.body || {};
    if (!toKey || !giftId) {
      return res.status(400).json({ error: 'يرجى تحديد المستلم والهدية.' });
    }
    let resolvedToName = String(toName || '').trim();
    if (String(toKey).startsWith('user:')) {
      const uid = Number(String(toKey).replace('user:', ''));
      const targetRow = Number.isNaN(uid) ? null : db.findUserById(uid);
      if (targetRow) resolvedToName = db.getEffectiveName(targetRow);
    }
    if (!resolvedToName) resolvedToName = 'عضو';

    const result = db.sendGift({
      fromUserId: req.authUser.userId,
      fromKey: req.authUser.key,
      fromName: req.authUser.name,
      fromRole: req.authUser.role,
      toKey,
      toName: resolvedToName,
      giftId,
      roomId: roomId || ''
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    syncUserAcrossSockets(io, req.authUser.userId);
    if (result.receiver) {
      syncUserAcrossSockets(io, result.receiver.id);
    }

    if (roomId && db.getRoomById(roomId)) {
      const msg = db.addMessage({
        roomId,
        senderKey: req.authUser.key,
        senderName: req.authUser.name,
        senderRole: req.authUser.role,
        nameColor: req.authUser.nameColor,
        textColor: '#fef3c7',
        nameBgColor: req.authUser.nameBgColor,
        neonColor: req.authUser.neonColor,
        fontFamily: req.authUser.fontFamily,
        fontStyle: req.authUser.fontStyle,
        avatarUrl: req.authUser.avatarUrl,
        avatarFrame: req.authUser.avatarFrame,
        nameplateStyle: req.authUser.nameplateStyle,
        nameShine: req.authUser.nameShine,
        vipWings: req.authUser.vipWings,
        isGift: true,
        giftData: result.tx,
        msgType: 'text',
        content: `🎁 تم إرسال هدية (${result.gift.emoji} ${result.gift.name}) من "${req.authUser.name}" إلى "${resolvedToName}"!`
      });
      io.to(`room:${roomId}`).emit('new_message', msg);
      io.to(`room:${roomId}`).emit('gift_celebration', result.tx);
      broadcastRoomsList(io);
    }

    const notif = db.addNotification({
      targetKey: toKey,
      title: `${result.gift.emoji} هدية جديدة من ${req.authUser.name}`,
      body: `أرسل لك "${req.authUser.name}" هدية (${result.gift.name}) +${result.gift.reward} عملة!`,
      category: 'gift'
    });
    emitNotificationToUser(io, toKey, notif);

    for (const [sid, entry] of onlineSockets.entries()) {
      if (entry.key === toKey) {
        io.to(sid).emit('gift_received', { tx: result.tx, gift: result.gift });
      }
    }

    await db.flushWrites();
    return res.json({
      ok: true,
      tx: result.tx,
      user: mapUserRow(result.sender)
    });
  } catch (err) {
    console.error('Send gift error:', err);
    return res.status(500).json({ error: 'تعذر إرسال الهدية حالياً.' });
  }
});

// ==========================================
// NEWS SYSTEM
// ==========================================
app.get('/api/news', (_req, res) => {
  res.json({ news: db.getAllNews() });
});

app.post('/api/news', requireRegistered, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'publish_news')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية نشر الأخبار.' });
  }
  const { title, content, imageUrl } = req.body || {};
  const result = db.addNewsPost({
    title,
    content,
    imageUrl,
    authorKey: req.authUser.key,
    authorName: req.authUser.name,
    authorRole: req.authUser.role
  });
  if (result.error) return res.status(400).json({ error: result.error });

  const notif = db.addNotification({
    targetKey: '*',
    title: `📰 خبر جديد: ${result.news.title}`,
    body: result.news.content.slice(0, 140),
    category: 'news'
  });
  io.emit('news_added', result.news);
  emitNotificationToUser(io, '*', notif);
  await db.flushWrites();
  return res.json({ news: result.news });
});

app.delete('/api/news/:id', requireRegistered, async (req, res) => {
  if (
    req.authUser.role !== 'site_owner' &&
    !canDo(req.authUser.role, 'publish_news') &&
    !canDo(req.authUser.role, 'access_panel')
  ) {
    return res.status(403).json({ error: 'صلاحية حذف الأخبار غير متوفرة.' });
  }
  const ok = db.deleteNewsPost(req.params.id);
  if (!ok) return res.status(404).json({ error: 'الخبر غير موجود.' });
  io.emit('news_deleted', { id: Number(req.params.id) });
  await db.flushWrites();
  return res.json({ ok: true });
});

// ==========================================
// SOCIAL, FRIENDS, WALL, REPORTS, NOTIFICATIONS, LEADERBOARDS
// ==========================================
app.get('/api/social/state', requireAuth, (req, res) => {
  const key = req.authUser.key;
  return res.json({
    friends: db.getFriendsForUser(key),
    privateMessages: db.getPrivateMessagesForUser(key),
    wallPosts: db.getWallPosts(),
    notifications: db.getNotificationsForUser(key),
    unreadNotifCount: db.getUnreadNotificationCount(key),
    myGifts: db.getGiftsForUser(key),
    reports:
      req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'access_panel') ? db.getReports() : []
  });
});

app.post('/api/notifications/read', requireAuth, async (req, res) => {
  db.markNotificationsRead(req.authUser.key);
  await db.flushWrites();
  return res.json({ ok: true, unreadNotifCount: 0 });
});

app.post('/api/friends/request', requireRegistered, async (req, res) => {
  const { toKey, toName, toRole, toAvatar } = req.body || {};
  if (!toKey || toKey === req.authUser.key) {
    return res.status(400).json({ error: 'هدف غير صالح.' });
  }
  const result = db.sendFriendRequest({
    fromUser: req.authUser,
    toKey,
    toName: toName || 'عضو',
    toRole: toRole || 'member',
    toAvatar: toAvatar || ''
  });
  const notif = db.addNotification({
    targetKey: toKey,
    title: 'طلب صداقة جديد',
    body: `أرسل لك "${req.authUser.name}" طلب صداقة.`,
    category: 'friend'
  });
  emitNotificationToUser(io, toKey, notif);
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === toKey || entry.key === req.authUser.key) {
      io.to(sid).emit('social_updated');
    }
  }
  await db.flushWrites();
  return res.json(result);
});

app.post('/api/friends/respond', requireRegistered, async (req, res) => {
  const { friendKey, accept } = req.body || {};
  if (!friendKey) return res.status(400).json({ error: 'بيانات ناقصة.' });
  db.respondFriendRequest(req.authUser.key, friendKey, Boolean(accept));
  if (accept) {
    const notif = db.addNotification({
      targetKey: friendKey,
      title: 'تم قبول الصداقة',
      body: `قبل "${req.authUser.name}" طلب الصداقة!`,
      category: 'friend'
    });
    emitNotificationToUser(io, friendKey, notif);
  }
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === friendKey || entry.key === req.authUser.key) {
      io.to(sid).emit('social_updated');
    }
  }
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/wall', requireRegistered, async (req, res) => {
  const content = String(req.body?.content || '').trim().slice(0, 600);
  const imageUrl = String(req.body?.imageUrl || '').trim();
  const inviteRoomId = String(req.body?.inviteRoomId || '').trim().slice(0, 64);
  const inviteCountryFlag = String(req.body?.countryFlag || '🌍').trim().slice(0, 12);
  let inviteRoomName = '';
  let inviteOnlineCount = 0;
  if (inviteRoomId) {
    const rm = db.getRoomById(inviteRoomId);
    if (rm) {
      inviteRoomName = rm.name;
      inviteOnlineCount = getRoomUsersList(inviteRoomId).length;
    }
  }
  if (!content && !imageUrl && !inviteRoomName) {
    return res.status(400).json({ error: 'أدخل نص المنشور أو صورة أو دعوة غرفة.' });
  }
  const post = db.addWallPost({
    authorKey: req.authUser.key,
    authorName: req.authUser.name,
    authorRole: req.authUser.role,
    avatarUrl: req.authUser.avatarUrl,
    avatarFrame: req.authUser.avatarFrame,
    nameplateStyle: req.authUser.nameplateStyle,
    nameColor: req.authUser.nameColor,
    nameBgColor: req.authUser.nameBgColor,
    neonColor: req.authUser.neonColor,
    content,
    imageUrl,
    inviteRoomId: inviteRoomName ? inviteRoomId : '',
    inviteRoomName,
    inviteCountryFlag: inviteRoomName ? inviteCountryFlag : '',
    inviteOnlineCount
  });
  db.incrementActivityPoints({ userId: req.authUser.userId, roomId: null, userDelta: 3, roomDelta: 0 });
  syncUserAcrossSockets(io, req.authUser.userId);
  io.emit('wall_updated', { post });
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/like', requireAuth, async (req, res) => {
  const post = db.likeWallPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'المنشور غير موجود.' });
  io.emit('wall_updated', { post });
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/react', requireAuth, async (req, res) => {
  const type = String(req.body?.type || 'like');
  const post = db.reactWallPost(req.params.id, type);
  if (!post) return res.status(404).json({ error: 'المنشور غير موجود.' });
  io.emit('wall_updated', { post });
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/comment', requireAuth, async (req, res) => {
  const content = String(req.body?.content || '').trim().slice(0, 300);
  if (!content) return res.status(400).json({ error: 'اكتب تعليقك أولاً.' });
  const post = db.addWallComment(req.params.id, {
    authorKey: req.authUser.key,
    authorName: req.authUser.name,
    authorRole: req.authUser.role,
    avatarUrl: req.authUser.avatarUrl,
    content
  });
  if (!post) return res.status(404).json({ error: 'المنشور غير موجود.' });
  if (post.author_key && post.author_key !== req.authUser.key) {
    const notif = db.addNotification({
      targetKey: post.author_key,
      title: `💬 تعليق جديد من ${req.authUser.name}`,
      body: content.slice(0, 100),
      category: 'wall'
    });
    emitNotificationToUser(io, post.author_key, notif);
  }
  io.emit('wall_updated', { post });
  await db.flushWrites();
  return res.json({ post });
});

app.delete('/api/wall/:id', requireAuth, async (req, res) => {
  const posts = db.getWallPosts();
  const target = posts.find((p) => String(p.id) === String(req.params.id));
  if (!target) return res.status(404).json({ error: 'المنشور غير موجود.' });
  const canDelete =
    target.author_key === req.authUser.key ||
    req.authUser.role === 'site_owner' ||
    canDo(req.authUser.role, 'access_panel');
  if (!canDelete) return res.status(403).json({ error: 'لا تملك صلاحية حذف هذا المنشور.' });
  db.deleteWallPost(req.params.id);
  io.emit('wall_deleted', { id: Number(req.params.id) });
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/reports', requireAuth, async (req, res) => {
  const targetName = String(req.body?.targetName || '').trim().slice(0, 40);
  const reason = String(req.body?.reason || '').trim().slice(0, 300);
  const roomId = String(req.body?.roomId || '');
  if (!targetName || !reason) return res.status(400).json({ error: 'يرجى تحديد المبلغ عنه وسبب البلاغ.' });
  const report = db.addReport({
    reporterKey: req.authUser.key,
    reporterName: req.authUser.name,
    targetName,
    reason,
    roomId
  });
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.role === 'site_owner' || canDo(entry.role, 'access_panel')) {
      io.to(sid).emit('new_report', report);
    }
  }
  await db.flushWrites();
  return res.json({ report });
});

app.get('/api/leaderboards', (_req, res) => {
  const all = db.getAllRegisteredUsers();
  const onlineKeys = new Set();
  for (const e of onlineSockets.values()) {
    if (!isStealthEntry(e)) onlineKeys.add(e.key);
  }
  const mapEntry = (u) => ({
    key: `user:${u.id}`,
    name: db.getEffectiveName(u),
    role: u.role,
    rank: db.getRankByKey(u.role),
    avatarUrl: u.avatar_url || '',
    avatarFrame: u.avatar_frame || 'none',
    nameShine: u.name_shine || 'none',
    vipWings: Boolean(u.vip_wings),
    coins: Number(u.coins) || 0,
    activityPoints: Number(u.activity_points) || 0,
    giftsReceived: Number(u.gifts_received) || 0,
    vipFamily: u.vip_family || '',
    online: !isUserStealth(u) && onlineKeys.has(`user:${u.id}`)
  });

  const rich = [...all].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 20).map(mapEntry);
  const vips = [...all]
    .sort((a, b) => db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) || (b.activity_points || 0) - (a.activity_points || 0))
    .slice(0, 20)
    .map(mapEntry);
  const activeMembers = [...all]
    .sort((a, b) => (b.activity_points || 0) - (a.activity_points || 0) || (b.gifts_received || 0) - (a.gifts_received || 0))
    .slice(0, 25)
    .map(mapEntry);

  const famMap = new Map();
  for (const u of all) {
    const fam = (u.vip_family || '').trim();
    if (!fam) continue;
    const prev = famMap.get(fam) || { name: fam, members: 0, totalCoins: 0, totalActivity: 0 };
    prev.members += 1;
    prev.totalCoins += Number(u.coins) || 0;
    prev.totalActivity += Number(u.activity_points) || 0;
    famMap.set(fam, prev);
  }
  const families = [...famMap.values()].sort((a, b) => b.totalCoins - a.totalCoins).slice(0, 15);

  const activeRooms = buildRoomsPayload()
    .sort((a, b) => (b.activity_points || 0) - (a.activity_points || 0) || (b.onlineCount || 0) - (a.onlineCount || 0))
    .slice(0, 20);

  return res.json({ rich, vips, families, activeMembers, activeRooms });
});

// ==========================================
// ADMIN PANEL / CMS API
// ==========================================
app.get('/api/admin/overview', requirePanelAccess, (req, res) => {
  const isOwner = req.authUser.role === 'site_owner';
  const onlineCount = buildGlobalOnlineUsers().length;
  const users = db.getAllRegisteredUsers().map((u) => ({
    ...u,
    displayName: db.getEffectiveName(u),
    rank: db.getRankByKey(u.role),
    isSupremeOwner: db.isSupremeOwnerEmail(u.email)
  }));
  res.json({
    stats: {
      onlineCount,
      registeredCount: users.length,
      roomsCount: db.getAllRooms().length,
      ranksCount: db.getAllRanks().length,
      bansCount: db.getAllBans().length,
      reportsCount: db.getReports().length,
      newsCount: db.getAllNews().length,
      myMaxAssignablePower: isOwner ? 100 : db.getMaxAssignablePower(req.authUser.role)
    },
    settings: db.getSiteSettings(),
    ranks: db.getAllRanks(),
    rooms: buildRoomsPayload(),
    users,
    bans: db.getAllBans(),
    reports: db.getReports(),
    emojis: db.getAllCustomEmojis(),
    news: db.getAllNews()
  });
});

app.put('/api/admin/settings', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'access_panel')) {
    return res.status(403).json({ error: 'صلاحية الإعدادات غير متوفرة.' });
  }
  const settings = db.updateSiteSettings(req.body || {});
  io.emit('site_settings_updated', settings);
  await db.flushWrites();
  return res.json({ settings });
});

app.post('/api/admin/ranks', requireOwner, async (req, res) => {
  const result = db.createRank(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  io.emit('ranks_updated', db.getAllRanks());
  await db.flushWrites();
  return res.json({ rank: result.rank });
});

app.put('/api/admin/ranks/:key', requireOwner, async (req, res) => {
  const result = db.updateRank(req.params.key, req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  io.emit('ranks_updated', db.getAllRanks());
  for (const entry of onlineSockets.values()) {
    if (entry.role === req.params.key && entry.userId) {
      syncUserAcrossSockets(io, entry.userId);
    }
  }
  await db.flushWrites();
  return res.json({ rank: result.rank });
});

app.delete('/api/admin/ranks/:key', requireOwner, async (req, res) => {
  const result = db.deleteRank(req.params.key);
  if (result.error) return res.status(400).json({ error: result.error });
  io.emit('ranks_updated', db.getAllRanks());
  for (const uid of result.affectedUserIds || []) {
    syncUserAcrossSockets(io, uid);
  }
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/emojis', requirePanelAccess, async (req, res) => {
  const result = db.addCustomEmoji({
    code: req.body?.code,
    imageUrl: req.body?.imageUrl,
    createdBy: req.authUser.name
  });
  if (result.error) return res.status(400).json({ error: result.error });
  io.emit('emojis_updated', db.getAllCustomEmojis());
  await db.flushWrites();
  return res.json({ emoji: result.emoji });
});

app.delete('/api/admin/emojis/:id', requirePanelAccess, async (req, res) => {
  db.deleteCustomEmoji(req.params.id);
  io.emit('emojis_updated', db.getAllCustomEmojis());
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/rooms', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'manage_rooms')) {
    return res.status(403).json({ error: 'لا تملك صلاحية إدارة الغرف.' });
  }
  const {
    name,
    description,
    icon,
    imageUrl,
    bgTheme,
    wallpaperUrl,
    bgCustom,
    cardBgColor,
    cardTextColor,
    welcomeMessage,
    roomPassword,
    minRankPower,
    ownerUserId
  } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 60);
  if (cleanName.length < 2) return res.status(400).json({ error: 'اسم الغرفة يجب أن يكون حرفين على الأقل.' });
  const id = `room_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`;
  const room = db.createRoom({
    id,
    name: cleanName,
    description,
    icon,
    imageUrl,
    bgTheme,
    wallpaperUrl,
    bgCustom,
    cardBgColor,
    cardTextColor,
    welcomeMessage,
    roomPassword,
    minRankPower,
    ownerUserId,
    createdBy: req.authUser.name
  });
  broadcastRoomsList(io);
  await db.flushWrites();
  return res.json({ room: db.sanitizeRoomForPublic(room) });
});

app.put('/api/admin/rooms/:id', requirePanelAccess, async (req, res) => {
  const rm = db.getRoomById(req.params.id);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  if (!db.isRoomManager(rm.id, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذه الغرفة.' });
  }
  const updated = db.updateRoom(rm.id, req.body || {});
  io.to(`room:${rm.id}`).emit('room_updated', db.sanitizeRoomForPublic(updated));
  broadcastRoomsList(io);
  await db.flushWrites();
  return res.json({ room: db.sanitizeRoomForPublic(updated) });
});

app.delete('/api/admin/rooms/:id', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'manage_rooms')) {
    return res.status(403).json({ error: 'لا تملك صلاحية حذف الغرف.' });
  }
  if (req.params.id === 'general') {
    return res.status(400).json({ error: 'لا يمكن حذف الغرفة العامة الرئيسية.' });
  }
  const rm = db.getRoomById(req.params.id);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.roomId === rm.id) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) moveSocketToRoom(sock, 'general', true);
    }
  }
  db.deleteRoom(rm.id);
  broadcastRoomsList(io);
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/rooms/:id/staff', requirePanelAccess, async (req, res) => {
  if (!db.isRoomManager(req.params.id, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'صلاحية غير كافية.' });
  }
  const staff = db.addRoomStaff(req.params.id, req.body?.userId, req.body?.staffRole, req.authUser.name);
  if (!staff) return res.status(400).json({ error: 'تعذر إضافة مشرف الغرفة.' });
  broadcastRoomsList(io);
  await db.flushWrites();
  return res.json({ staff });
});

app.delete('/api/admin/rooms/:id/staff/:userId', requirePanelAccess, async (req, res) => {
  if (!db.isRoomManager(req.params.id, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'صلاحية غير كافية.' });
  }
  const staff = db.removeRoomStaff(req.params.id, req.params.userId);
  broadcastRoomsList(io);
  await db.flushWrites();
  return res.json({ staff });
});

app.post('/api/admin/users', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'لا تملك صلاحية إنشاء الحسابات أو تعيين الرتب.' });
  }
  const { username, displayName, email, password, role } = req.body || {};
  const targetRole = role || 'member';
  const targetPower = db.getRankPower(targetRole);
  const maxAllowed = db.getMaxAssignablePower(req.authUser.role);
  if (req.authUser.role !== 'site_owner' && targetPower > maxAllowed) {
    return res.status(403).json({ error: `سقف الترقية المسموح لرتبتك هو (${maxAllowed}) فقط.` });
  }
  if (!password || String(password).length < 5) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 5 أحرف على الأقل.' });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const result = db.adminCreateUser({
    username,
    displayName,
    email,
    passwordHash,
    role: targetRole
  });
  if (result.error) return res.status(400).json({ error: result.error });
  await db.flushWrites();
  io.emit('persistent_members', buildPersistentMembersList());
  return res.json({ user: mapUserRow(result.user) });
});

app.put('/api/admin/users/:id', requirePanelAccess, async (req, res) => {
  const target = db.findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'الحساب غير موجود.' });
  const myPower = db.getRankPower(req.authUser.role);
  const targetCurPower = db.getRankPower(target.role);

  if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(req.authUser.email)) {
    return res.status(403).json({ error: 'حساب صاحب الموقع محمي ولا يمكن تعديله.' });
  }
  if (req.authUser.role !== 'site_owner' && targetCurPower >= myPower && target.id !== req.authUser.userId) {
    return res.status(403).json({ error: 'لا يمكنك تعديل عضو مساوٍ لك أو أعلى منك في القوة.' });
  }

  const { displayName, username, email, password, role } = req.body || {};
  if (role && role !== target.role) {
    if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
      return res.status(403).json({ error: 'لا تملك صلاحية تعديل الرتب.' });
    }
    const newPower = db.getRankPower(role);
    const maxAssign = db.getMaxAssignablePower(req.authUser.role);
    if (req.authUser.role !== 'site_owner' && newPower > maxAssign) {
      return res.status(403).json({ error: `لا يمكنك الترقية لرتبة أعلى من سقفك (${maxAssign}).` });
    }
  }

  const passwordHash = password && String(password).length >= 5 ? await bcrypt.hash(String(password), 10) : null;
  const result = db.adminUpdateUserAccount(target.id, {
    displayName,
    username,
    email,
    passwordHash,
    role
  });
  if (result.error) return res.status(400).json({ error: result.error });
  syncUserAcrossSockets(io, target.id);
  await db.flushWrites();
  return res.json({ user: mapUserRow(result.user) });
});

app.post('/api/admin/ban', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'ban')) {
    return res.status(403).json({ error: 'لا تملك صلاحية الحظر.' });
  }
  const { targetKey, reason, banType } = req.body || {};
  if (!targetKey || db.isProtectedSupremeOwnerKey(targetKey)) {
    return res.status(403).json({ error: 'لا يمكن حظر صاحب الموقع.' });
  }
  let targetName = targetKey;
  let targetEmail = '';
  let targetIp = '';
  let targetDevice = '';
  if (String(targetKey).startsWith('user:')) {
    const uid = Number(String(targetKey).replace('user:', ''));
    const row = db.findUserById(uid);
    if (row) {
      if (req.authUser.role !== 'site_owner' && db.getRankPower(row.role) >= db.getRankPower(req.authUser.role)) {
        return res.status(403).json({ error: 'لا يمكنك حظر رتبة أعلى منك أو مساوية لك.' });
      }
      targetName = db.getEffectiveName(row);
      targetEmail = row.email;
      targetIp = row.last_ip || '';
      targetDevice = row.last_device_id || '';
    }
  }
  db.banTarget({
    targetKey,
    targetName,
    email: targetEmail,
    ipAddress: targetIp,
    deviceId: banType === 'xban' ? targetDevice : '',
    banType: banType === 'xban' ? 'xban' : 'ban',
    reason: reason || (banType === 'xban' ? 'إكس باند X-Ban من الإدارة' : 'حظر من الإدارة'),
    bannedBy: req.authUser.name
  });

  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.key === targetKey) {
      io.to(sid).emit('kicked', { reason: reason || 'تم حظرك نهائياً من الشات.' });
      const s = io.sockets.sockets.get(sid);
      if (s) s.disconnect(true);
    }
  }
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/ghost', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'mute')) {
    return res.status(403).json({ error: 'لا تملك صلاحية وضع الشبح.' });
  }
  const { userId, enabled } = req.body || {};
  const result = db.setUserGhosted(userId, Boolean(enabled));
  if (result.error) return res.status(400).json({ error: result.error });
  syncUserAcrossSockets(io, userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(result.user) });
});

app.delete('/api/admin/users/:id', requireOwner, async (req, res) => {
  const uid = Number(req.params.id);
  const result = db.deleteUserAccountPermanently(uid);
  if (result.error) return res.status(400).json({ error: result.error });
  for (const [sid, entry] of onlineSockets.entries()) {
    if (entry.userId === uid) {
      io.to(sid).emit('kicked', { reason: 'تم حذف حسابك نهائياً من قبل صاحب الموقع.' });
      const s = io.sockets.sockets.get(sid);
      if (s) s.disconnect(true);
    }
  }
  broadcastRoomsList(io);
  broadcastGlobalOnlineUsers(io);
  io.emit('persistent_members', buildPersistentMembersList());
  await db.flushWrites();
  return res.json({ ok: true });
});

app.delete('/api/admin/ban/:key', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'ban')) {
    return res.status(403).json({ error: 'لا تملك صلاحية فك الحظر.' });
  }
  db.unbanTarget(decodeURIComponent(req.params.key));
  await db.flushWrites();
  return res.json({ ok: true });
});

// ==========================================
// HTTP SERVER & SOCKET.IO SETUP
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

function releaseUserMicsInRoom(socketOrKey, roomId) {
  if (!roomId) return;
  const slots = ensureRoomMicSlots(roomId);
  const key = typeof socketOrKey === 'string' ? socketOrKey : onlineSockets.get(socketOrKey.id)?.key;
  let changed = false;
  for (const slot of slots) {
    if (slot.holderKey === key) {
      slot.holderKey = null;
      slot.holderSocketId = null;
      slot.holderName = null;
      slot.holderRole = null;
      slot.holderAvatar = null;
      slot.isSelfMuted = false;
      slot.isAdminMuted = false;
      slot.isSpeaking = false;
      changed = true;
    }
  }
  if (changed) {
    io.to(`room:${roomId}`).emit('mic_state', { roomId, slots: getPublicMicSlots(roomId) });
  }
}

function moveSocketToRoom(socket, targetRoomId, isSilentReconnect = false) {
  const entry = onlineSockets.get(socket.id);
  if (!entry) return;
  const room = db.getRoomById(targetRoomId);
  if (!room) {
    socket.emit('error_toast', { message: 'الغرفة غير موجودة.' });
    return;
  }

  const oldRoomId = entry.roomId;
  if (oldRoomId && oldRoomId !== targetRoomId) {
    releaseUserMicsInRoom(entry.key, oldRoomId);
    socket.leave(`room:${oldRoomId}`);
    entry.roomId = null;
    broadcastRoomUsers(io, oldRoomId);
  }

  entry.roomId = targetRoomId;
  socket.join(`room:${targetRoomId}`);

  const messages = db.getRoomMessages(targetRoomId, 100, entry.key);
  const pubRoom = db.sanitizeRoomForPublic(room);
  const isManager = db.isRoomManager(targetRoomId, entry.userId, entry.role);

  socket.emit('room_joined', {
    room: pubRoom,
    isRoomManager: isManager,
    messages,
    mics: getPublicMicSlots(targetRoomId),
    users: getRoomUsersList(targetRoomId)
  });

  broadcastRoomUsers(io, targetRoomId);
  broadcastRoomsList(io);
  broadcastGlobalOnlineUsers(io);

  // Never broadcast join notice if stealth active, or silent reconnect, or rejoining same room during active grace
  const pending = pendingGrace.get(entry.key);
  const rejoiningSameRoom = pending && pending.lastRoomId === targetRoomId;
  if (pending) {
    clearTimeout(pending.timeout);
    pendingGrace.delete(entry.key);
  }

  if (!isSilentReconnect && !rejoiningSameRoom && oldRoomId !== targetRoomId && !isStealthEntry(entry)) {
    const rank = db.getRankByKey(entry.role);
    io.to(`room:${targetRoomId}`).emit('room_notice', {
      roomId: targetRoomId,
      kind: 'join',
      text: `✓ هذا المستخدم انضم للغرفة`,
      user: {
        key: entry.key,
        name: entry.name,
        role: entry.role,
        rankIcon: rank.icon,
        rankLabel: rank.label,
        avatarUrl: entry.avatarUrl || '',
        avatarFrame: entry.avatarFrame || 'none',
        nameColor: entry.nameColor || '#0f172a',
        nameBgColor: entry.nameBgColor || '',
        neonColor: entry.neonColor || '',
        fontFamily: entry.fontFamily || 'Normal',
        fontStyle: entry.fontStyle || 'Normal',
        nameplateStyle: entry.nameplateStyle || 'default',
        nameShine: entry.nameShine || 'none',
        vipWings: Boolean(entry.vipWings)
      }
    });
  }
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = verifyToken(token);
    if (!payload) return next(new Error('AUTH_REQUIRED'));

    const ip = getClientIp(socket);
    const deviceId = String(socket.handshake.auth?.deviceId || '').trim().slice(0, 128);
    if (payload.isGuest) {
      const ban = db.isTargetBanned({ targetKey: payload.key, ipAddress: ip, deviceId });
      if (ban) return next(new Error(`BANNED:${ban.reason}`));
      socket.authSession = {
        socketId: socket.id,
        key: payload.key,
        userId: null,
        isGuest: true,
        name: payload.name || 'زائر',
        displayName: payload.name || 'زائر',
        username: payload.name || 'زائر',
        email: '',
        role: 'guest',
        nameColor: '#0f172a',
        textColor: '#111827',
        nameBgColor: '',
        neonColor: '',
        fontFamily: 'Normal',
        fontStyle: 'Normal',
        fontSize: 14,
        avatarUrl: '',
        coverUrl: '',
        avatarFrame: 'none',
        nameplateStyle: 'default',
        nameShine: 'none',
        profileBgEffect: 'none',
        vipWings: false,
        profileMusic: '',
        bio: '',
        age: '',
        gender: '',
        country: '',
        allowCalls: true,
        allowPm: true,
        likesCount: 0,
        ratingAvg: 5.0,
        ratingCount: 0,
        isGhosted: false,
        coins: 0,
        vipFamily: '',
        isStealth: false,
        activityPoints: 0,
        giftsReceived: 0,
        giftsSent: 0,
        ipAddress: ip,
        deviceId,
        roomId: null,
        lastHeartbeat: Date.now()
      };
      return next();
    }

    const row = db.findUserById(payload.userId);
    if (!row) return next(new Error('AUTH_REQUIRED'));
    if (db.isSupremeOwnerEmail(row.email)) {
      db.ensureSupremeOwnerAccount(row.id);
    } else {
      const ban = db.isTargetBanned({ targetKey: `user:${row.id}`, email: row.email, ipAddress: ip, deviceId });
      if (ban) return next(new Error(`BANNED:${ban.reason}`));
    }

    db.updateUserIp(row.id, ip, deviceId);
    const freshRow = db.findUserById(row.id);
    const mapped = mapUserRow(freshRow);
    socket.authSession = {
      socketId: socket.id,
      ...mapped,
      ipAddress: ip,
      deviceId,
      roomId: null,
      lastHeartbeat: Date.now()
    };
    return next();
  } catch (err) {
    return next(new Error('AUTH_FAILED'));
  }
});

io.on('connection', (socket) => {
  const session = socket.authSession;
  onlineSockets.set(socket.id, session);

  const pending = pendingGrace.get(session.key);
  const wasGraceReconnect = Boolean(pending);
  const initialRoomId = socket.handshake.auth?.roomId || (pending && pending.lastRoomId) || 'general';
  const validRoom = db.getRoomById(initialRoomId) ? initialRoomId : db.getAllRooms()[0]?.id || 'general';

  socket.emit('init_state', {
    user: session.isGuest ? session : mapUserRow(db.findUserById(session.userId)),
    settings: db.getSiteSettings(),
    ranks: db.getAllRanks(),
    emojis: db.getAllCustomEmojis(),
    rooms: buildRoomsPayload(),
    onlineUsers: buildGlobalOnlineUsers(),
    persistentMembers: buildPersistentMembersList(),
    unreadNotifCount: db.getUnreadNotificationCount(session.key),
    news: db.getAllNews(),
    giftsCatalog: db.GIFT_CATALOG
  });

  moveSocketToRoom(socket, validRoom, wasGraceReconnect);

  socket.on('heartbeat', (_data, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (entry) entry.lastHeartbeat = Date.now();
    if (typeof cb === 'function') cb({ ok: true, ts: Date.now() });
  });

  socket.on('join_room', ({ roomId, password }, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry) return;
    const room = db.getRoomById(roomId);
    if (!room) {
      if (typeof cb === 'function') cb({ error: 'الغرفة غير موجودة.' });
      return;
    }

    const isOwnerOrMod = entry.role === 'site_owner' || canDo(entry.role, 'manage_rooms');
    if (!isOwnerOrMod && (Number(room.min_rank_power) || 0) > db.getRankPower(entry.role)) {
      const errMsg = `الدخول لهذه الغرفة يتطلب رتبة بقوة ${room.min_rank_power} فأعلى.`;
      if (typeof cb === 'function') cb({ error: errMsg });
      else socket.emit('error_toast', { message: errMsg });
      return;
    }

    if (!isOwnerOrMod && room.room_password && room.room_password.trim()) {
      if (String(password || '').trim() !== room.room_password.trim()) {
        const errMsg = 'كلمة مرور الغرفة غير صحيحة.';
        if (typeof cb === 'function') cb({ error: errMsg, requiresPassword: true });
        else socket.emit('error_toast', { message: errMsg });
        return;
      }
    }

    moveSocketToRoom(socket, roomId, false);
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('send_message', (payload = {}, cb) => {
    try {
      const entry = onlineSockets.get(socket.id);
      if (!entry || !entry.roomId) {
        if (typeof cb === 'function') cb({ error: 'لست داخل غرفة.' });
        return;
      }

      const mute = db.getActiveMute(entry.key, entry.roomId);
      if (mute) {
        const mins = Math.max(1, Math.ceil((mute.expires_at - Date.now()) / 60000));
        const errMsg = `أنت مكتوم حالياً في هذه الغرفة لمدة ${mins} دقيقة تقريباً.`;
        if (typeof cb === 'function') cb({ error: errMsg });
        else socket.emit('error_toast', { message: errMsg });
        return;
      }

      // Light spam guard (owner exempt)
      if (entry.role !== 'site_owner') {
        const now = Date.now();
        const spam = roomActivitySpam.get(entry.key) || { count: 0, resetAt: now + 5000 };
        if (now > spam.resetAt) {
          spam.count = 0;
          spam.resetAt = now + 5000;
        }
        spam.count += 1;
        roomActivitySpam.set(entry.key, spam);
        if (spam.count > 8) {
          const errMsg = 'يرجى التمهل قليلاً قبل إرسال رسالة أخرى.';
          if (typeof cb === 'function') cb({ error: errMsg });
          return;
        }
      }

      const msgType = ['text', 'image', 'audio', 'sticker'].includes(payload.msgType) ? payload.msgType : 'text';
      const content = String(payload.content || '').trim().slice(0, 1000);
      const mediaUrl = String(payload.mediaUrl || '').trim().slice(0, 300);
      const clientMsgId = String(payload.clientMsgId || '').slice(0, 80);
      const isAdminNotice =
        Boolean(payload.isAdminNotice) && (entry.role === 'site_owner' || canDo(entry.role, 'access_panel'));

      if (msgType === 'text' && !content) {
        if (typeof cb === 'function') cb({ error: 'الرسالة فارغة.' });
        return;
      }
      if ((msgType === 'image' || msgType === 'audio') && !mediaUrl) {
        if (typeof cb === 'function') cb({ error: 'الملف غير موجود.' });
        return;
      }
      if (msgType === 'sticker' && !content && !mediaUrl) {
        if (typeof cb === 'function') cb({ error: 'الملصق فارغ.' });
        return;
      }

      const isGhostOnly = Boolean(entry.isGhosted) && entry.role !== 'site_owner';
      const msg = db.addMessage({
        roomId: entry.roomId,
        senderKey: entry.key,
        senderName: entry.name,
        senderRole: entry.role,
        nameColor: entry.nameColor,
        textColor: entry.textColor,
        nameBgColor: entry.nameBgColor,
        neonColor: entry.neonColor,
        fontFamily: entry.fontFamily,
        fontStyle: entry.fontStyle,
        fontSize: entry.fontSize || 14,
        avatarUrl: entry.avatarUrl,
        avatarFrame: entry.avatarFrame,
        nameplateStyle: entry.nameplateStyle,
        nameShine: entry.nameShine,
        vipWings: entry.vipWings,
        isAdminNotice,
        isGhostOnly,
        msgType,
        content,
        mediaUrl,
        clientMsgId
      });

      if (isGhostOnly) {
        // Ghosted/shadow-frozen users see their own messages locally without reaching anyone else
        socket.emit('new_message', msg);
        if (typeof cb === 'function') cb({ ok: true, id: msg.id, message: msg });
        return;
      }

      const delta = msgType === 'text' ? 2 : 3;
      db.incrementActivityPoints({
        userId: entry.userId,
        roomId: entry.roomId,
        userDelta: delta,
        roomDelta: delta
      });
      if (entry.userId) {
        entry.activityPoints = (Number(entry.activityPoints) || 0) + delta;
      }

      io.to(`room:${entry.roomId}`).emit('new_message', msg);
      broadcastRoomsList(io);

      // Smart Mention & Recipient-Only Ping Alert
      if (msgType === 'text' && content.includes('@')) {
        const lowerContent = content.toLowerCase();
        const mentionedKeys = new Set();
        for (const other of onlineSockets.values()) {
          if (other.key === entry.key || isStealthEntry(other)) continue;
          const n1 = String(other.name || '').trim().toLowerCase();
          const n2 = String(other.username || '').trim().toLowerCase();
          if ((n1 && lowerContent.includes(`@${n1}`)) || (n2 && lowerContent.includes(`@${n2}`))) {
            mentionedKeys.add(other.key);
          }
        }
        for (const tKey of mentionedKeys) {
          const notif = db.addNotification({
            targetKey: tKey,
            title: `🔔 نداء من ${entry.name}`,
            body: content.slice(0, 120),
            category: 'mention'
          });
          emitNotificationToUser(io, tKey, notif);
          for (const [sid, o] of onlineSockets.entries()) {
            if (o.key === tKey) {
              io.to(sid).emit('mention_alert', {
                fromKey: entry.key,
                fromName: entry.name,
                fromAvatar: entry.avatarUrl || '',
                fromRole: entry.role || 'member',
                roomId: entry.roomId,
                msgId: msg.id,
                content: content.slice(0, 120)
              });
            }
          }
        }
      }

      if (typeof cb === 'function') cb({ ok: true, id: msg.id, message: msg });
    } catch (err) {
      console.error('send_message error:', err);
      if (typeof cb === 'function') cb({ error: 'فشل إرسال الرسالة.' });
    }
  });

  socket.on('typing', ({ isTyping } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId || isStealthEntry(entry)) return;
    socket.to(`room:${entry.roomId}`).emit('user_typing', {
      roomId: entry.roomId,
      userKey: entry.key,
      name: entry.name,
      isTyping: Boolean(isTyping)
    });
  });

  socket.on('toggle_stealth', async ({ enabled } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !db.isSupremeOwnerEmail(entry.email))) {
      if (typeof cb === 'function') cb({ error: 'وضع التخفي متاح لصاحب الموقع فقط.' });
      return;
    }
    const resStealth = db.setUserStealth(entry.userId, Boolean(enabled));
    if (resStealth && !resStealth.error) {
      syncUserAcrossSockets(io, entry.userId);
      broadcastRoomsList(io);
      for (const r of db.getAllRooms()) broadcastRoomUsers(io, r.id);
      await db.flushWrites();
      if (typeof cb === 'function') cb({ ok: true, isStealth: Boolean(enabled) });
    }
  });

  // ==========================================
  // MICS 1..5 + REAL WEBRTC AUDIO SIGNALING
  // ==========================================
  socket.on('mic_take', ({ slot } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const rm = db.getRoomById(entry.roomId);
    if (!rm || rm.mics_enabled === 0) {
      if (typeof cb === 'function') cb({ error: 'المايكات معطلة في هذه الغرفة.' });
      return;
    }
    const slotNum = Number(slot);
    if (slotNum < 1 || slotNum > 5) return;

    const slots = ensureRoomMicSlots(entry.roomId);
    const targetSlot = slots.find((s) => s.slot === slotNum);
    if (!targetSlot) return;
    if (targetSlot.holderKey && targetSlot.holderKey !== entry.key) {
      if (typeof cb === 'function') cb({ error: 'هذا المايك محجوز حالياً.' });
      return;
    }

    for (const s of slots) {
      if (s.holderKey === entry.key && s.slot !== slotNum) {
        s.holderKey = null;
        s.holderSocketId = null;
        s.holderName = null;
        s.holderRole = null;
        s.holderAvatar = null;
        s.isSelfMuted = false;
        s.isAdminMuted = false;
        s.isSpeaking = false;
      }
    }

    targetSlot.holderKey = entry.key;
    targetSlot.holderSocketId = socket.id;
    targetSlot.holderName = entry.name;
    targetSlot.holderRole = entry.role;
    targetSlot.holderAvatar = entry.avatarUrl || '';
    targetSlot.isSelfMuted = false;
    targetSlot.isAdminMuted = false;
    targetSlot.isSpeaking = true;

    io.to(`room:${entry.roomId}`).emit('mic_state', {
      roomId: entry.roomId,
      slots: getPublicMicSlots(entry.roomId)
    });
    if (typeof cb === 'function') cb({ ok: true, slot: slotNum });
  });

  socket.on('mic_leave', () => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    releaseUserMicsInRoom(entry.key, entry.roomId);
  });

  socket.on('mic_toggle_self_mute', ({ muted } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const slots = ensureRoomMicSlots(entry.roomId);
    let changed = false;
    for (const s of slots) {
      if (s.holderKey === entry.key) {
        s.isSelfMuted = Boolean(muted);
        s.isSpeaking = !s.isSelfMuted && !s.isAdminMuted;
        changed = true;
      }
    }
    if (changed) {
      io.to(`room:${entry.roomId}`).emit('mic_state', {
        roomId: entry.roomId,
        slots: getPublicMicSlots(entry.roomId)
      });
    }
  });

  socket.on('mic_admin_mute_slot', ({ slot, muted } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr =
      db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'mute');
    if (!isMgr) return;
    const slots = ensureRoomMicSlots(entry.roomId);
    const targetSlot = slots.find((s) => s.slot === Number(slot));
    if (!targetSlot || !targetSlot.holderKey) return;
    targetSlot.isAdminMuted = Boolean(muted);
    targetSlot.isSpeaking = !targetSlot.isSelfMuted && !targetSlot.isAdminMuted;
    if (targetSlot.holderSocketId) {
      io.to(targetSlot.holderSocketId).emit('mic_force_mute', { muted: targetSlot.isAdminMuted });
    }
    io.to(`room:${entry.roomId}`).emit('mic_state', {
      roomId: entry.roomId,
      slots: getPublicMicSlots(entry.roomId)
    });
  });

  socket.on('mic_kick_slot', ({ slot } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr =
      db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'kick');
    if (!isMgr) return;
    const slots = ensureRoomMicSlots(entry.roomId);
    const targetSlot = slots.find((s) => s.slot === Number(slot));
    if (!targetSlot || !targetSlot.holderKey) return;
    const kickedSid = targetSlot.holderSocketId;
    targetSlot.holderKey = null;
    targetSlot.holderSocketId = null;
    targetSlot.holderName = null;
    targetSlot.holderRole = null;
    targetSlot.holderAvatar = null;
    targetSlot.isSelfMuted = false;
    targetSlot.isAdminMuted = false;
    targetSlot.isSpeaking = false;
    if (kickedSid) {
      io.to(kickedSid).emit('mic_kicked', { byName: entry.name });
    }
    io.to(`room:${entry.roomId}`).emit('mic_state', {
      roomId: entry.roomId,
      slots: getPublicMicSlots(entry.roomId)
    });
  });

  socket.on('mic_webrtc_ready', ({ slot } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    socket.to(`room:${entry.roomId}`).emit('mic_webrtc_peer_ready', {
      roomId: entry.roomId,
      slot: Number(slot) || 1,
      fromSocketId: socket.id,
      fromKey: entry.key,
      fromName: entry.name
    });
  });

  socket.on('mic_webrtc_offer', ({ toSocketId, sdp, slot } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !toSocketId || !sdp) return;
    io.to(toSocketId).emit('mic_webrtc_offer', {
      fromSocketId: socket.id,
      fromKey: entry.key,
      fromName: entry.name,
      slot: Number(slot) || 1,
      sdp
    });
  });

  socket.on('mic_webrtc_answer', ({ toSocketId, sdp } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !toSocketId || !sdp) return;
    io.to(toSocketId).emit('mic_webrtc_answer', {
      fromSocketId: socket.id,
      fromKey: entry.key,
      sdp
    });
  });

  socket.on('mic_webrtc_ice', ({ toSocketId, candidate } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !toSocketId || !candidate) return;
    io.to(toSocketId).emit('mic_webrtc_ice', {
      fromSocketId: socket.id,
      candidate
    });
  });

  // ==========================================
  // SYNCHRONIZED ROOM YOUTUBE PLAYER
  // ==========================================
  socket.on('room_youtube_set', async ({ roomId, url, title, isPlaying } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    const targetRoomId = roomId || entry?.roomId;
    if (!entry || !targetRoomId) return;
    if (!db.isRoomManager(targetRoomId, entry.userId, entry.role)) {
      if (typeof cb === 'function') cb({ error: 'تشغيل يوتيوب الغرفة متاح لمالك الغرفة والإدارة فقط.' });
      return;
    }

    const rawUrl = String(url || '').trim();
    const videoId = rawUrl === '' ? '' : extractYouTubeId(rawUrl);
    if (rawUrl !== '' && !videoId) {
      if (typeof cb === 'function') cb({ error: 'رابط يوتيوب غير صالح. أرسل رابط فيديو يوتيوب صحيح.' });
      return;
    }

    const updated = db.setRoomYoutube(targetRoomId, {
      videoId,
      title: String(title || (videoId ? 'فيديو يوتيوب الغرفة' : '')).slice(0, 120),
      isPlaying: Boolean(videoId && isPlaying !== false)
    });
    if (!updated) return;

    const pub = db.sanitizeRoomForPublic(updated);
    io.to(`room:${targetRoomId}`).emit('room_youtube_updated', {
      roomId: targetRoomId,
      youtubeVideoId: pub.youtube_video_id,
      youtubeTitle: pub.youtube_title,
      youtubeIsPlaying: Boolean(pub.youtube_is_playing),
      byName: entry.name
    });
    broadcastRoomsList(io);
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true, room: pub });
  });

  // ==========================================
  // PRIVATE MESSAGES
  // ==========================================
  socket.on('send_pm', async ({ toKey, toName, content } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    const clean = String(content || '').trim().slice(0, 800);
    if (!entry || !toKey || !clean) return;
    const pm = db.addPrivateMessage({
      fromKey: entry.key,
      fromName: entry.name,
      fromRole: entry.role,
      fromAvatar: entry.avatarUrl,
      toKey,
      toName: toName || 'عضو',
      content: clean
    });
    const notif = db.addNotification({
      targetKey: toKey,
      title: `✉️ رسالة خاصة من ${entry.name}`,
      body: clean.slice(0, 120),
      category: 'pm'
    });
    emitNotificationToUser(io, toKey, notif);

    for (const [sid, o] of onlineSockets.entries()) {
      if (o.key === toKey || o.key === entry.key) {
        io.to(sid).emit('new_pm', pm);
      }
    }
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true, pm });
  });

  socket.on('mark_pm_read', async ({ partnerKey } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !partnerKey) return;
    db.markPrivateMessagesRead(entry.key, partnerKey);
    await db.flushWrites();
  });

  // ==========================================
  // MODERATION SOCKET ACTIONS
  // ==========================================
  socket.on('admin_mute', async ({ targetKey, minutes = 10, unmute = false } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'mute');
    if (!isMgr) return;
    if (db.isProtectedSupremeOwnerKey(targetKey)) {
      socket.emit('error_toast', { message: 'لا يمكن كتم صاحب الموقع.' });
      return;
    }

    if (unmute) {
      db.removeMute(targetKey, entry.roomId);
      io.to(`room:${entry.roomId}`).emit('room_notice', {
        roomId: entry.roomId,
        text: `🔊 قام "${entry.name}" بفك الكتم عن العضو.`
      });
    } else {
      const mins = Math.max(1, Math.min(1440, Number(minutes) || 10));
      db.setMute(targetKey, entry.roomId, mins * 60 * 1000, entry.name);
      releaseUserMicsInRoom(targetKey, entry.roomId);
      io.to(`room:${entry.roomId}`).emit('room_notice', {
        roomId: entry.roomId,
        text: `🔇 قام "${entry.name}" بكتم عضو لمدة ${mins} دقيقة.`
      });
    }
    await db.flushWrites();
  });

  socket.on('admin_kick', ({ targetKey } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'kick');
    if (!isMgr || db.isProtectedSupremeOwnerKey(targetKey)) return;

    for (const [sid, o] of onlineSockets.entries()) {
      if (o.key === targetKey && o.roomId === entry.roomId) {
        if (entry.role !== 'site_owner' && db.getRankPower(o.role) >= db.getRankPower(entry.role)) {
          socket.emit('error_toast', { message: 'لا يمكنك طرد رتبة أعلى منك أو مساوية لك.' });
          return;
        }
        io.to(sid).emit('kicked', { reason: `تم طردك من الغرفة بواسطة ${entry.name}` });
        const s = io.sockets.sockets.get(sid);
        if (s) s.disconnect(true);
      }
    }
  });

  socket.on('admin_ban', async ({ targetKey, reason = 'حظر إداري', banType = 'ban' } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !canDo(entry.role, 'ban'))) return;
    if (db.isProtectedSupremeOwnerKey(targetKey)) return;

    let targetName = targetKey;
    let targetEmail = '';
    let targetIp = '';
    let targetDevice = '';
    for (const o of onlineSockets.values()) {
      if (o.key === targetKey) {
        if (entry.role !== 'site_owner' && db.getRankPower(o.role) >= db.getRankPower(entry.role)) {
          socket.emit('error_toast', { message: 'لا يمكنك حظر رتبة أعلى منك أو مساوية لك.' });
          return;
        }
        targetName = o.name;
        targetEmail = o.email || '';
        targetIp = o.ipAddress || '';
        targetDevice = o.deviceId || '';
        break;
      }
    }

    db.banTarget({
      targetKey,
      targetName,
      email: targetEmail,
      ipAddress: targetIp,
      deviceId: banType === 'xban' ? targetDevice : '',
      banType: banType === 'xban' ? 'xban' : 'ban',
      reason,
      bannedBy: entry.name
    });
    for (const [sid, o] of onlineSockets.entries()) {
      if (o.key === targetKey) {
        io.to(sid).emit('kicked', { reason: `تم حظرك: ${reason}` });
        const s = io.sockets.sockets.get(sid);
        if (s) s.disconnect(true);
      }
    }
    await db.flushWrites();
  });

  socket.on('admin_ghost', async ({ targetKey, enabled = true } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !canDo(entry.role, 'mute'))) return;
    if (!targetKey || !String(targetKey).startsWith('user:') || db.isProtectedSupremeOwnerKey(targetKey)) {
      if (typeof cb === 'function') cb({ error: 'لا يمكن تطبيق وضع الشبح على هذا الحساب.' });
      return;
    }
    const uid = Number(String(targetKey).replace('user:', ''));
    const targetRow = db.findUserById(uid);
    if (!targetRow) return;
    if (entry.role !== 'site_owner' && db.getRankPower(targetRow.role) >= db.getRankPower(entry.role)) {
      socket.emit('error_toast', { message: 'لا يمكنك تجميد رتبة مساوية لك أو أعلى منك.' });
      return;
    }
    const resGhost = db.setUserGhosted(uid, Boolean(enabled));
    if (resGhost.error) {
      socket.emit('error_toast', { message: resGhost.error });
      return;
    }
    syncUserAcrossSockets(io, uid);
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true, isGhosted: Boolean(enabled) });
  });

  socket.on('admin_delete_account', async ({ userId } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || entry.role !== 'site_owner') {
      if (typeof cb === 'function') cb({ error: 'حذف الحسابات متاح لصاحب الموقع فقط.' });
      return;
    }
    const uid = Number(userId);
    const resDel = db.deleteUserAccountPermanently(uid);
    if (resDel.error) {
      if (typeof cb === 'function') cb({ error: resDel.error });
      return;
    }
    for (const [sid, o] of onlineSockets.entries()) {
      if (o.userId === uid) {
        io.to(sid).emit('kicked', { reason: 'تم حذف حسابك نهائياً من قبل صاحب الموقع.' });
        const s = io.sockets.sockets.get(sid);
        if (s) s.disconnect(true);
      }
    }
    broadcastRoomsList(io);
    broadcastGlobalOnlineUsers(io);
    io.emit('persistent_members', buildPersistentMembersList());
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('admin_set_role', async ({ userId, newRole } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !canDo(entry.role, 'set_rank'))) {
      if (typeof cb === 'function') cb({ error: 'لا تملك صلاحية تعديل الرتب.' });
      return;
    }
    const target = db.findUserById(userId);
    if (!target) return;
    if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(entry.email)) {
      if (typeof cb === 'function') cb({ error: 'صاحب الموقع محمي ولا يمكن تغيير رتبته.' });
      return;
    }
    const myPower = db.getRankPower(entry.role);
    const maxAssign = db.getMaxAssignablePower(entry.role);
    const newPower = db.getRankPower(newRole);
    if (entry.role !== 'site_owner') {
      if (db.getRankPower(target.role) >= myPower) {
        if (typeof cb === 'function') cb({ error: 'لا يمكنك تعديل رتبة مساوية لك أو أعلى منك.' });
        return;
      }
      if (newPower > maxAssign) {
        if (typeof cb === 'function') cb({ error: `سقف الترقية الأقصى المتاح لك هو (${maxAssign}).` });
        return;
      }
    }

    const updated = db.updateUserRole(userId, newRole);
    if (!updated) return;
    syncUserAcrossSockets(io, userId);
    const rank = db.getRankByKey(newRole);
    if (entry.roomId) {
      io.to(`room:${entry.roomId}`).emit('room_notice', {
        roomId: entry.roomId,
        text: `🎖️ تم ترقية/تعديل رتبة "${db.getEffectiveName(updated)}" إلى (${rank.icon} ${rank.label}) بواسطة ${entry.name}.`
      });
    }
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('admin_force_name', async ({ userId, newDisplayName } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !canDo(entry.role, 'access_panel'))) return;
    const target = db.findUserById(userId);
    if (!target) return;
    if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(entry.email)) return;
    db.forceChangeUserDisplayName(userId, newDisplayName);
    syncUserAcrossSockets(io, userId);
    await db.flushWrites();
  });

  socket.on('admin_give_coins', async ({ userId, amount } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || entry.role !== 'site_owner') return;
    const delta = Number(amount) || 0;
    if (!delta) return;
    const updated = db.adjustUserCoins(userId, delta);
    if (!updated) return;
    syncUserAcrossSockets(io, userId);
    await db.flushWrites();
  });

  socket.on('admin_clear_room', async () => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'clear_room');
    if (!isMgr) return;
    db.clearRoomMessages(entry.roomId);
    io.to(`room:${entry.roomId}`).emit('room_cleared', { roomId: entry.roomId, byName: entry.name });
    await db.flushWrites();
  });

  socket.on('delete_message', async ({ msgId } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId || !msgId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'clear_room');
    const roomMsgs = db.getRoomMessages(entry.roomId, 200);
    const target = roomMsgs.find((m) => String(m.id) === String(msgId) || String(m.doc_id) === String(msgId));
    if (!target) return;
    if (!isMgr && target.sender_key !== entry.key) return;
    db.deleteMessageById(msgId);
    io.to(`room:${entry.roomId}`).emit('message_deleted', { roomId: entry.roomId, msgId: String(msgId) });
    await db.flushWrites();
  });

  socket.on('admin_room_update', async (payload = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    const rid = payload.roomId || entry?.roomId;
    if (!entry || !rid) return;
    if (!db.isRoomManager(rid, entry.userId, entry.role)) {
      if (typeof cb === 'function') cb({ error: 'لا تملك صلاحية تعديل هذه الغرفة.' });
      return;
    }
    const updated = db.updateRoom(rid, payload);
    if (!updated) return;
    io.to(`room:${rid}`).emit('room_updated', db.sanitizeRoomForPublic(updated));
    broadcastRoomsList(io);
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('disconnect', () => {
    const entry = onlineSockets.get(socket.id);
    if (!entry) return;
    const oldRoomId = entry.roomId;
    const key = entry.key;
    onlineSockets.delete(socket.id);
    releaseUserMicsInRoom(key, oldRoomId);

    // Grace period keeps transient disconnect silent without emitting any leave notice
    const prevGrace = pendingGrace.get(key);
    if (prevGrace) clearTimeout(prevGrace.timeout);

    const timeout = setTimeout(() => {
      pendingGrace.delete(key);
      broadcastRoomUsers(io, oldRoomId);
      broadcastGlobalOnlineUsers(io);
      broadcastRoomsList(io);
      io.emit('persistent_members', buildPersistentMembersList());
    }, 25000);

    pendingGrace.set(key, { timeout, lastRoomId: oldRoomId });
    broadcastRoomUsers(io, oldRoomId);
    broadcastGlobalOnlineUsers(io);
    broadcastRoomsList(io);
  });
});

// ==========================================
// STARTUP
// ==========================================
async function start() {
  await db.init({
    onExternalMessage: (msg) => {
      if (msg && msg.room_id && !msg.is_ghost_only) io.to(`room:${msg.room_id}`).emit('new_message', msg);
    },
    onRanksChanged: (ranks) => {
      io.emit('ranks_updated', ranks);
    },
    onRoomsChanged: () => {
      broadcastRoomsList(io);
    },
    onSettingsChanged: (settings) => {
      io.emit('site_settings_updated', settings);
    },
    onEmojisChanged: (emojis) => {
      io.emit('emojis_updated', emojis);
    },
    onUsersChanged: () => {
      io.emit('persistent_members', buildPersistentMembersList());
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Arabic CodyChat Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
