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
  { id: 'owner_sovereign', label: 'التاج السيادي للمالك 👑', price: 0, tier: 'owner', ownerOnly: true, preview: '#fbbf24' },
  { id: 'none', label: 'بدون إطار', price: 0, tier: 'free', preview: '#64748b' },
  { id: 'kings_crown', label: 'تاج الملوك الذهبي 👑', price: 0, tier: 'vip', preview: '#fbbf24' },
  { id: 'gold_royal', label: 'الإطار الذهبي الملكي', price: 0, tier: 'vip', preview: '#f59e0b' },
  { id: 'fire_gold', label: 'إطار اللهب الناري 🔥', price: 0, tier: 'vip', preview: '#f97316' },
  { id: 'lightning_bolt', label: 'إطار البرق الكهربائي ⚡', price: 0, tier: 'vip', preview: '#38bdf8' },
  { id: 'hearts_roses', label: 'إطار القلوب والورود 🌹', price: 0, tier: 'vip', preview: '#f43f5e' },
  { id: 'neon_rainbow', label: 'إطار نيون RGB المضيء', price: 0, tier: 'vip', preview: '#ec4899' },
  { id: 'rgb_cyber_neon', label: 'إطار RGB الدوّار المتوهج', price: 0, tier: 'vip', preview: '#22d3ee' },
  { id: 'diamond_ring', label: 'الإطار الماسي المتوهج 💎', price: 0, tier: 'vip', preview: '#38bdf8' },
  { id: 'emerald_crown', label: 'إطار الزمرد الملكي', price: 0, tier: 'vip', preview: '#10b981' },
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

const NAME_ANIMATIONS = [
  { id: 'none', label: 'ثابت (بدون حركة)' },
  { id: 'pulse', label: 'نبض ملكي متوهج' },
  { id: 'color_wave', label: 'تموج ألوان الطيف' },
  { id: 'gradient_glow', label: 'بريق التدرج الذهبي' },
  { id: 'gentle_shake', label: 'اهتزاز خفيف جذاب' },
  { id: 'float_bounce', label: 'طفو وانسياب ناعم' },
  { id: 'neon_flicker', label: 'وميض النيون السريع' }
];

const NAME_ANIM_SPEEDS = [
  { id: 'slow', label: 'بطيء' },
  { id: 'normal', label: 'متوسط' },
  { id: 'fast', label: 'سريع' }
];

function normalizeNameAnim(val) {
  const clean = String(val || 'none').trim();
  return NAME_ANIMATIONS.some((a) => a.id === clean) ? clean : 'none';
}

function normalizeNameAnimSpeed(val) {
  const clean = String(val || 'normal').trim();
  return NAME_ANIM_SPEEDS.some((s) => s.id === clean) ? clean : 'normal';
}

const PROFILE_BG_EFFECTS = [
  { id: 'none', label: 'بدون خلفية متحركة', preview: '#1e293b' },
  { id: 'animated_flames', label: 'لهب ذهبي متوهج', preview: '#ea580c' },
  { id: 'falling_stars', label: 'نجوم وشُهب متساقطة', preview: '#38bdf8' },
  { id: 'royal_waves', label: 'أمواج ملكية متدرجة', preview: '#7c3aed' },
  { id: 'aurora_glow', label: 'شفق الألماس الساحر', preview: '#10b981' }
];

const RANK_BADGE_STYLES = [
  { id: 'gold_crown', label: 'تاج ذهبي ملكي', iconClass: 'fa-solid fa-crown' },
  { id: 'silver_crown', label: 'تاج فضي لامع', iconClass: 'fa-solid fa-crown' },
  { id: 'royal_shield', label: 'درع ذهبي ملكي', iconClass: 'fa-solid fa-shield-halved' },
  { id: 'silver_shield', label: 'درع الحماية الفضي', iconClass: 'fa-solid fa-shield' },
  { id: 'gold_star', label: 'نجمة ذهبية متلألئة', iconClass: 'fa-solid fa-star' },
  { id: 'diamond_gem', label: 'ماسة براقة', iconClass: 'fa-solid fa-gem' },
  { id: 'vip_wings', label: 'أجنحة VIP ملكية', iconClass: 'fa-solid fa-feather-pointed' },
  { id: 'silver_wing', label: 'جناح فضي لامع', iconClass: 'fa-solid fa-dove' },
  { id: 'gold_eagle', label: 'نسر ذهبي مجنح', iconClass: 'fa-solid fa-feather-pointed' },
  { id: 'neon_badge', label: 'شارة نيون حديثة', iconClass: 'fa-solid fa-certificate' },
  { id: 'crown_royal', label: 'التاج الملكي الكلاسيكي', iconClass: 'fa-solid fa-crown' },
  { id: 'diamond_medal', label: 'وسام ماسي متوهج', iconClass: 'fa-solid fa-gem' }
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

const ALLOWED_PROFILE_FONTS = new Set([
  'Normal',
  'Kalam',
  'Signika',
  'Grandmaster',
  'Comic Neue',
  'Quicksand',
  'Orbitron',
  'Lemonada',
  'Grenze Gotisch',
  'Merienda',
  'Amita',
  'Averia Libre',
  'Turret Road',
  'Sansita',
  'Comfortaa',
  'Charm',
  'Lobster Two',
  'Cairo',
  'Tajawal',
  'Amiri',
  'Changa',
  'Reem Kufi'
]);

function normalizeProfileFont(raw) {
  const clean = String(raw || '').trim();
  if (!clean) return 'Normal';
  for (const f of ALLOWED_PROFILE_FONTS) {
    if (f.toLowerCase() === clean.toLowerCase()) return f;
  }
  return 'Normal';
}

function textContainsMemberName(text, memberName) {
  const cleanText = String(text || '').toLowerCase();
  const cleanName = String(memberName || '').trim().toLowerCase();
  if (!cleanText || cleanName.length < 2) return false;
  const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s،.!؟@:\\-\\(\\)\\[\\]\\"'/])${escaped}(?:$|[\\s،.!؟:\\-\\(\\)\\[\\]\\"'/])`, 'i');
  return re.test(cleanText);
}

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
    nameAnim: normalizeNameAnim(u.name_anim),
    nameAnimSpeed: normalizeNameAnimSpeed(u.name_anim_speed),
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
    isShadowMuted: Boolean(u.is_shadow_muted),
    isFrozen: Boolean(u.is_frozen),
    lastLuckyBoxAt: Number(u.last_lucky_box_at) || 0,
    invitesCount: Number(u.invites_count) || 0,
    activityPoints: Number(u.activity_points) || 0,
    quizPoints: Number(u.quiz_points) || 0,
    giftsReceived: Number(u.gifts_received) || 0,
    giftsSent: Number(u.gifts_sent) || 0
  };
}

function mapGuestRow(g, fallbackKey = '', fallbackName = 'زائر') {
  const key = g?.key || fallbackKey;
  const name = g?.name || fallbackName || 'زائر';
  return {
    key,
    userId: null,
    isGuest: true,
    name,
    displayName: g?.display_name || name,
    username: g?.username || name,
    role: 'guest',
    rank: db.getRankByKey('guest'),
    nameColor: g?.name_color || '#0f172a',
    textColor: g?.text_color || '#111827',
    nameBgColor: g?.name_bg_color || '',
    neonColor: g?.neon_color || '',
    fontFamily: g?.font_family || 'Normal',
    fontStyle: g?.font_style || 'Normal',
    fontSize: Math.max(12, Math.min(20, Number(g?.font_size) || 14)),
    avatarUrl: g?.avatar_url || '',
    coverUrl: g?.cover_url || '',
    avatarFrame: g?.avatar_frame || 'none',
    nameplateStyle: g?.nameplate_style || 'default',
    nameShine: g?.name_shine || 'none',
    nameAnim: normalizeNameAnim(g?.name_anim),
    nameAnimSpeed: normalizeNameAnimSpeed(g?.name_anim_speed),
    profileBgEffect: 'none',
    vipWings: Boolean(g?.vip_wings),
    profileMusic: '',
    bio: g?.bio || '',
    coins: 0,
    vipFamily: '',
    isStealth: false,
    activityPoints: 0,
    giftsReceived: 0,
    giftsSent: 0
  };
}

function resolveAuthFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.isGuest) {
    const saved = db.findGuestByKey(payload.key);
    const guestObj = saved || db.upsertGuest({ key: payload.key, name: payload.name || 'زائر' });
    return mapGuestRow(guestObj, payload.key, payload.name || 'زائر');
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
// MULTER UPLOADS (PRESERVE GIF / WEBP ANIMATIONS 100%)
// ==========================================
const MIME_TO_EXT = {
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/png': '.png',
  'image/apng': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/svg+xml': '.svg',
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav'
};

function makeUploader(subdir, allowedPrefix, maxBytes = 15 * 1024 * 1024) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, subdir)),
    filename: (_req, file, cb) => {
      const mime = String(file.mimetype || '').toLowerCase();
      const mimeExt = MIME_TO_EXT[mime] || '';
      const origExt = path.extname(file.originalname || '').toLowerCase();
      const ext = mime === 'image/gif' || mime === 'image/webp'
        ? mimeExt
        : (origExt && /^[.a-z0-9]{2,8}$/.test(origExt) ? origExt : mimeExt || (allowedPrefix === 'audio/' ? '.webm' : '.png'));
      cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
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

const uploadAvatar = makeUploader('avatars', 'image/', 15 * 1024 * 1024);
const uploadCover = makeUploader('covers', 'image/', 15 * 1024 * 1024);
const uploadImage = makeUploader('images', 'image/', 15 * 1024 * 1024);
const uploadAudio = makeUploader('audio', 'audio/', 15 * 1024 * 1024);
const uploadWallpaper = makeUploader('wallpapers', 'image/', 15 * 1024 * 1024);
const uploadEmoji = makeUploader('emojis', 'image/', 8 * 1024 * 1024);
const uploadRankIcon = makeUploader('rank_icons', 'image/', 6 * 1024 * 1024);
const uploadNewsImg = makeUploader('news', 'image/', 12 * 1024 * 1024);

// ==========================================
// REAL-TIME STATE MAPS
// ==========================================
const onlineSockets = new Map(); // socketId -> user session entry
const roomMics = new Map(); // roomId -> [slot1..slot5]
const pendingGrace = new Map(); // key -> { timeout, lastRoomId }
const recentRoomPresence = new Map(); // key -> { roomId, at }
const roomActivitySpam = new Map(); // key -> { count, resetAt }
const guestShadowMutedKeys = new Set();
const guestFrozenKeys = new Set();
const roomQuizBots = new Map();

const QUIZ_BANK = [
  // عواصم
  { category: 'عواصم', q: 'ما هي عاصمة المملكة العربية السعودية؟', displayAnswer: 'الرياض', a: ['الرياض', 'رياض'] },
  { category: 'عواصم', q: 'ما هي عاصمة مصر؟', displayAnswer: 'القاهرة', a: ['القاهرة', 'القاهره', 'قاهرة'] },
  { category: 'عواصم', q: 'ما هي عاصمة الإمارات العربية المتحدة؟', displayAnswer: 'أبوظبي', a: ['أبوظبي', 'ابوظبي', 'أبو ظبي', 'ابو ظبي'] },
  { category: 'عواصم', q: 'ما هي عاصمة الأردن؟', displayAnswer: 'عمان', a: ['عمان'] },
  { category: 'عواصم', q: 'ما هي عاصمة المغرب؟', displayAnswer: 'الرباط', a: ['الرباط', 'رباط'] },
  { category: 'عواصم', q: 'ما هي عاصمة العراق؟', displayAnswer: 'بغداد', a: ['بغداد'] },
  { category: 'عواصم', q: 'ما هي عاصمة لبنان؟', displayAnswer: 'بيروت', a: ['بيروت'] },
  { category: 'عواصم', q: 'ما هي عاصمة اليابان؟', displayAnswer: 'طوكيو', a: ['طوكيو'] },
  { category: 'عواصم', q: 'ما هي عاصمة إيطاليا؟', displayAnswer: 'روما', a: ['روما'] },
  { category: 'عواصم', q: 'ما هي عاصمة إسبانيا؟', displayAnswer: 'مدريد', a: ['مدريد'] },
  // دينية
  { category: 'دينية', q: 'كم عدد أركان الإسلام؟', displayAnswer: 'خمسة', a: ['5', '٥', 'خمسة', 'خمس'] },
  { category: 'دينية', q: 'كم عدد سور القرآن الكريم؟', displayAnswer: '114', a: ['114', '١١٤', 'مائة وأربعة عشر'] },
  { category: 'دينية', q: 'ما هي أطول سورة في القرآن الكريم؟', displayAnswer: 'البقرة', a: ['البقرة', 'سورة البقرة', 'البقره'] },
  { category: 'دينية', q: 'ما هي السورة التي تسمى قلب القرآن؟', displayAnswer: 'يس', a: ['يس', 'سورة يس', 'ياسين'] },
  { category: 'دينية', q: 'من هو النبي الملقب بخليل الله؟', displayAnswer: 'إبراهيم', a: ['إبراهيم', 'ابراهيم', 'سيدنا إبراهيم'] },
  { category: 'دينية', q: 'في أي شهر أُنزل القرآن الكريم؟', displayAnswer: 'رمضان', a: ['رمضان', 'شهر رمضان'] },
  { category: 'دينية', q: 'ما هي أول قبلة للمسلمين؟', displayAnswer: 'المسجد الأقصى', a: ['المسجد الاقصى', 'الأقصى', 'الاقصى', 'القدس', 'بيت المقدس'] },
  { category: 'دينية', q: 'كم عدد الصلوات المفروضة في اليوم والليلة؟', displayAnswer: 'خمس', a: ['5', '٥', 'خمس', 'خمسة'] },
  { category: 'دينية', q: 'ما اسم الغار الذي تعبّد فيه النبي محمد ﷺ؟', displayAnswer: 'حراء', a: ['حراء', 'غار حراء'] },
  { category: 'دينية', q: 'من هو أول الخلفاء الراشدين؟', displayAnswer: 'أبو بكر الصديق', a: ['ابو بكر', 'أبو بكر', 'ابو بكر الصديق', 'أبو بكر الصديق'] },
  // ثقافية وعلمية
  { category: 'ثقافية', q: 'ما هي أكبر قارة في العالم من حيث المساحة؟', displayAnswer: 'آسيا', a: ['آسيا', 'اسيا', 'asia'] },
  { category: 'ثقافية', q: 'ما هو أطول نهر في العالم؟', displayAnswer: 'النيل', a: ['النيل', 'نهر النيل', 'الامازون', 'الأمازون'] },
  { category: 'ثقافية', q: 'ما هو الكوكب الملقب بالكوكب الأحمر؟', displayAnswer: 'المريخ', a: ['المريخ', 'مريخ'] },
  { category: 'ثقافية', q: 'كم عدد أيام السنة الكبيسة؟', displayAnswer: '366', a: ['366', '٣٦٦'] },
  { category: 'ثقافية', q: 'ما هي لغة البرازيل الرسمية؟', displayAnswer: 'البرتغالية', a: ['البرتغالية', 'البرتغاليه', 'برتغالية'] },
  { category: 'ثقافية', q: 'ما هو العنصر الكيميائي الذي رمزه Au؟', displayAnswer: 'الذهب', a: ['الذهب', 'ذهب'] },
  { category: 'ثقافية', q: 'كم عدد قلوب الأخطبوط؟', displayAnswer: 'ثلاثة', a: ['3', '٣', 'ثلاثة', 'ثلاث'] },
  { category: 'ثقافية', q: 'ما هو أسرع حيوان بري في العالم؟', displayAnswer: 'الفهد', a: ['الفهد', 'فهد', 'الشيتا'] },
  { category: 'ثقافية', q: 'في أي دولة يقع برج إيفل؟', displayAnswer: 'فرنسا', a: ['فرنسا'] },
  { category: 'ثقافية', q: 'ما هو أقرب كوكب إلى الشمس؟', displayAnswer: 'عطارد', a: ['عطارد'] },
  { category: 'ثقافية', q: 'كم عدد حروف اللغة العربية؟', displayAnswer: '28', a: ['28', '٢٨', 'ثمانية وعشرون'] },
  { category: 'ثقافية', q: 'ما هو أكبر محيط على وجه الأرض؟', displayAnswer: 'الهادي', a: ['الهادي', 'المحيط الهادي', 'الهادئ'] },
  { category: 'ثقافية', q: 'ما اسم صوت الأسد؟', displayAnswer: 'زئير', a: ['زئير', 'الزئير'] },
  { category: 'ثقافية', q: 'كم ساعة في اليوم الواحد؟', displayAnswer: '24', a: ['24', '٢٤', 'أربع وعشرون'] },
  // ألغاز
  { category: 'ألغاز', q: 'ما هو الشيء الذي يمشي بلا أرجل ويبكي بلا عيون؟', displayAnswer: 'السحاب', a: ['السحاب', 'الغيم', 'السحابة', 'الغيمة'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي كلما أخذت منه كبر؟', displayAnswer: 'الحفرة', a: ['الحفرة', 'الحفره', 'حفرة'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي يكتب ولا يقرأ؟', displayAnswer: 'القلم', a: ['القلم', 'قلم'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي له أسنان ولا يعض؟', displayAnswer: 'المشط', a: ['المشط', 'مشط'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي يدخل الماء ولا يبتل؟', displayAnswer: 'الضوء', a: ['الضوء', 'ضوء', 'الشعاع', 'الظل'] },
  { category: 'ألغاز', q: 'ما هو الباب الذي لا يمكن فتحه؟', displayAnswer: 'الباب المفتوح', a: ['الباب المفتوح', 'المفتوح'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي تذبحه وتبكي عليه؟', displayAnswer: 'البصل', a: ['البصل', 'بصل', 'البصلة'] },
  { category: 'ألغاز', q: 'ما هو الشيء الذي له عين واحدة ولا يرى؟', displayAnswer: 'الإبرة', a: ['الإبرة', 'الابرة', 'الابره', 'إبرة'] }
];

function isVpnOrProxyRequest(reqOrSocket) {
  const headers = reqOrSocket.headers || reqOrSocket.handshake?.headers || {};
  const via = String(headers['via'] || '').trim();
  const proxyConn = String(headers['proxy-connection'] || '').trim();
  const xVpn = String(headers['x-vpn'] || headers['x-tor'] || headers['x-proxy-id'] || '').trim();
  const cfCountry = String(headers['cf-ipcountry'] || '').trim().toUpperCase();
  const xff = String(headers['x-forwarded-for'] || '').trim();
  const hops = xff ? xff.split(',').map((s) => s.trim()).filter(Boolean) : [];
  if (xVpn || proxyConn || cfCountry === 'T1') return true;
  if (via && /proxy|squid|tor|vpn/i.test(via)) return true;
  if (hops.length >= 4) return true;
  return false;
}

function normalizeArabicText(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

function containsBannedWord(text) {
  const words = db.getSiteSettings().banned_words || [];
  if (!words.length || !text) return null;
  const normalized = normalizeArabicText(text);
  for (const w of words) {
    const cleanW = normalizeArabicText(w);
    if (cleanW && normalized.includes(cleanW)) return w;
  }
  return null;
}

function containsUrl(text) {
  const s = String(text || '');
  return /(?:https?:\/\/|www\.|t\.me\/|wa\.me\/|\b[a-z0-9-]{2,}\.(?:com|net|org|io|me|tv|gg|ly|tk|xyz|app|sa|ae|eg)\b)/i.test(s);
}

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

function computeRoomKingKey(roomId) {
  let topKey = null;
  let topPoints = 0;
  for (const entry of onlineSockets.values()) {
    if (entry.roomId !== roomId || isStealthEntry(entry) || entry.isGuest) continue;
    const pts = Number(entry.activityPoints) || 0;
    if (pts > topPoints) {
      topPoints = pts;
      topKey = entry.key;
    }
  }
  return topKey;
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
        fontSize: entry.fontSize || 14,
        avatarUrl: entry.avatarUrl,
        coverUrl: entry.coverUrl || '',
        avatarFrame: entry.avatarFrame,
        nameplateStyle: entry.nameplateStyle,
        nameShine: entry.nameShine || 'none',
        nameAnim: entry.nameAnim || 'none',
        nameAnimSpeed: entry.nameAnimSpeed || 'normal',
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
        isShadowMuted: Boolean(entry.isShadowMuted || guestShadowMutedKeys.has(entry.key)),
        isFrozen: Boolean(entry.isFrozen || guestFrozenKeys.has(entry.key)),
        coins: Number(entry.coins) || 0,
        vipFamily: entry.vipFamily || '',
        activityPoints: Number(entry.activityPoints) || 0,
        giftsReceived: Number(entry.giftsReceived) || 0,
        giftsSent: Number(entry.giftsSent) || 0
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) =>
      (b.role === 'site_owner' ? 1 : 0) - (a.role === 'site_owner' ? 1 : 0) ||
      db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) ||
      a.name.localeCompare(b.name, 'ar')
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
      nameAnim: entry.nameAnim || 'none',
      nameAnimSpeed: entry.nameAnimSpeed || 'normal',
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
      isShadowMuted: Boolean(entry.isShadowMuted || guestShadowMutedKeys.has(entry.key)),
      isFrozen: Boolean(entry.isFrozen || guestFrozenKeys.has(entry.key)),
      vipFamily: entry.vipFamily || '',
      activityPoints: Number(entry.activityPoints) || 0,
      roomId: entry.roomId || null,
      roomName: rm ? rm.name : ''
    });
  }
  return [...byKey.values()].sort(
    (a, b) =>
      (b.role === 'site_owner' ? 1 : 0) - (a.role === 'site_owner' ? 1 : 0) ||
      db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) ||
      a.name.localeCompare(b.name, 'ar')
  );
}

function buildPersistentMembersList() {
  const onlineByKey = new Map();
  for (const entry of onlineSockets.values()) {
    if (!isStealthEntry(entry)) onlineByKey.set(entry.key, entry);
  }
  const registered = db.getAllRegisteredUsers().map((u) => {
    const key = `user:${u.id}`;
    const isStealth = isUserStealth(u);
    const live = onlineByKey.get(key);
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
      nameAnim: normalizeNameAnim(u.name_anim),
      nameAnimSpeed: normalizeNameAnimSpeed(u.name_anim_speed),
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
      isStealth,
      nameColor: u.name_color || '#0f172a',
      nameBgColor: u.name_bg_color || '',
      neonColor: u.neon_color || '',
      fontFamily: u.font_family || 'Normal',
      fontStyle: u.font_style || 'Normal',
      vipFamily: u.vip_family || '',
      coins: Number(u.coins) || 0,
      activityPoints: Number(u.activity_points) || 0,
      giftsReceived: Number(u.gifts_received) || 0,
      roomId: live?.roomId || null,
      online: !isStealth && Boolean(live)
    };
  });

  const guestRank = db.getRankByKey('guest');
  const persistedGuests = db.getAllGuests().map((g) => {
    const live = onlineByKey.get(g.key);
    return {
      key: g.key,
      userId: null,
      isGuest: true,
      username: g.name,
      name: g.name,
      displayName: g.display_name || g.name,
      role: 'guest',
      rank: guestRank,
      avatarUrl: g.avatar_url || '',
      coverUrl: g.cover_url || '',
      avatarFrame: g.avatar_frame || 'none',
      nameplateStyle: g.nameplate_style || 'default',
      nameShine: g.name_shine || 'none',
      nameAnim: normalizeNameAnim(g.name_anim),
      nameAnimSpeed: normalizeNameAnimSpeed(g.name_anim_speed),
      profileBgEffect: 'none',
      vipWings: Boolean(g.vip_wings),
      profileMusic: '',
      bio: g.bio || '',
      age: '',
      gender: '',
      country: '',
      allowCalls: true,
      allowPm: true,
      likesCount: 0,
      ratingAvg: 5.0,
      ratingCount: 0,
      isGhosted: false,
      isStealth: false,
      nameColor: g.name_color || '#0f172a',
      nameBgColor: g.name_bg_color || '',
      neonColor: g.neon_color || '',
      fontFamily: g.font_family || 'Normal',
      fontStyle: g.font_style || 'Normal',
      vipFamily: '',
      coins: 0,
      activityPoints: 0,
      giftsReceived: 0,
      roomId: live?.roomId || null,
      online: Boolean(live)
    };
  });

  return [...registered, ...persistedGuests]
    .filter((m) => !m.isStealth)
    .sort(
      (a, b) =>
        (b.online ? 1 : 0) - (a.online ? 1 : 0) ||
        (b.role === 'site_owner' ? 1 : 0) - (a.role === 'site_owner' ? 1 : 0) ||
        db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role) ||
        String(a.name || '').localeCompare(String(b.name || ''), 'ar')
    );
}

function buildRoomsPayload() {
  const boost = Math.max(0, Number(db.getSiteSettings().online_boost) || 0);
  return db.getAllRooms().map((r) => {
    const pub = db.sanitizeRoomForPublic(r);
    const activeKeys = new Set();
    for (const e of onlineSockets.values()) {
      if (e.roomId === r.id && !isStealthEntry(e)) activeKeys.add(e.key);
    }
    return {
      ...pub,
      realOnlineCount: activeKeys.size,
      onlineCount: activeKeys.size + boost
    };
  });
}

function broadcastRoomUsers(io, roomId) {
  if (!roomId) return;
  io.to(`room:${roomId}`).emit('room_users', {
    roomId,
    users: getRoomUsersList(roomId),
    roomKingKey: computeRoomKingKey(roomId)
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
        fontSize: mapped.fontSize,
        avatarUrl: mapped.avatarUrl,
        coverUrl: mapped.coverUrl,
        avatarFrame: mapped.avatarFrame,
        nameplateStyle: mapped.nameplateStyle,
        nameShine: mapped.nameShine,
        nameAnim: mapped.nameAnim,
        nameAnimSpeed: mapped.nameAnimSpeed,
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
        isShadowMuted: mapped.isShadowMuted,
        isFrozen: mapped.isFrozen,
        lastLuckyBoxAt: mapped.lastLuckyBoxAt,
        invitesCount: mapped.invitesCount,
        coins: mapped.coins,
        vipFamily: mapped.vipFamily,
        isStealth: mapped.isStealth,
        activityPoints: mapped.activityPoints,
        quizPoints: mapped.quizPoints,
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
    const { username, email, password, invitedBy } = req.body || {};
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
      if (Number(db.getSiteSettings().block_vpn) === 1 && isVpnOrProxyRequest(req)) {
        return res.status(403).json({ error: 'التسجيل عبر VPN أو Proxy محظور حالياً.' });
      }
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

    if (invitedBy) {
      const refRes = db.recordReferralInvite(invitedBy, result.user.id);
      if (refRes) {
        const notif = db.addNotification({
          targetKey: `user:${refRes.inviter.id}`,
          title: '🤝 مكافأة دعوة صديق!',
          body: `انضم "${cleanUser}" عبر رابط دعوتك وحصلت على +${refRes.bonus} عملة!`,
          category: 'system'
        });
        emitNotificationToUser(io, `user:${refRes.inviter.id}`, notif);
        syncUserAcrossSockets(io, refRes.inviter.id);
      }
    }

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

app.post('/api/guest', async (req, res) => {
  const rawName = String(req.body?.name || '').trim().slice(0, 22);
  const name = rawName.length >= 2 ? rawName : `زائر_${Math.floor(100 + Math.random() * 900)}`;
  const ip = getClientIp(req);
  const deviceId = String(req.headers['x-device-id'] || req.body?.deviceId || '').trim().slice(0, 128);
  const requestedGuestKey = String(req.body?.guestKey || '').trim();
  const isValidExistingGuestKey = /^guest:[a-f0-9]{8,32}$/i.test(requestedGuestKey);
  const key = isValidExistingGuestKey ? requestedGuestKey : `guest:${crypto.randomBytes(6).toString('hex')}`;
  const ban = db.isTargetBanned({ targetKey: key, ipAddress: ip, deviceId });
  if (ban) return res.status(403).json({ error: `هذا الجهاز محظور: ${ban.reason}` });

  const guestRow = db.upsertGuest({ key, name, ipAddress: ip, deviceId });
  await db.flushWrites();
  const user = mapGuestRow(guestRow, key, name);
  const token = signToken({ key, name: user.name, isGuest: true });
  io.emit('persistent_members', buildPersistentMembersList());
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

app.delete('/api/profile/avatar', requireRegistered, async (req, res) => {
  const updated = db.updateUserCustomization(req.authUser.userId, { avatarUrl: '' });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserAcrossSockets(io, req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
});

app.delete('/api/profile/cover', requireRegistered, async (req, res) => {
  const updated = db.updateUserCustomization(req.authUser.userId, { coverUrl: '' });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserAcrossSockets(io, req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
});

app.post('/api/upload/image', requireAuth, (req, res, next) => {
  if (req.authUser.isGuest && Number(db.getSiteSettings().lock_guest_images) === 1) {
    return res.status(403).json({ error: 'إرسال الصور للزوار مقفل حالياً من قبل المالك.' });
  }
  return next();
}, uploadImage.single('file'), (req, res) => {
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

function collectYoutubeVideoRenderers(node, out = [], seen = new Set()) {
  if (!node || typeof node !== 'object' || out.length >= 14) return out;
  if (node.videoRenderer && node.videoRenderer.videoId) {
    const vr = node.videoRenderer;
    if (!seen.has(vr.videoId)) {
      seen.add(vr.videoId);
      const title = (vr.title?.runs || []).map((r) => r.text).join('') || vr.title?.simpleText || '';
      const author = (vr.ownerText?.runs || []).map((r) => r.text).join('') || (vr.longBylineText?.runs || []).map((r) => r.text).join('') || 'YouTube';
      const duration = vr.lengthText?.simpleText || vr.thumbnailOverlays?.find((o) => o?.thumbnailOverlayTimeStatusRenderer)?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || 'فيديو';
      out.push({
        videoId: vr.videoId,
        title: (title || 'فيديو يوتيوب').slice(0, 120),
        author: author.slice(0, 60),
        duration,
        thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`
      });
    }
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectYoutubeVideoRenderers(item, out, seen);
      if (out.length >= 14) break;
    }
  } else {
    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') {
        collectYoutubeVideoRenderers(val, out, seen);
        if (out.length >= 14) break;
      }
    }
  }
  return out;
}

const FALLBACK_YOUTUBE_SONGS = [
  { videoId: 'jfKfPfyJRdk', title: 'موسيقى هادئة للدردشة والتركيز - Lofi Radio', author: 'Lofi Girl', duration: 'مباشر' },
  { videoId: '5qap5aO4i9A', title: 'أنغام هادئة واسترخاء ليلي', author: 'ChillHop', duration: 'HD' },
  { videoId: '4xDzrJKXOOY', title: 'موسيقى سهرة واسترخاء سينث', author: 'Synth Radio', duration: 'مباشر' },
  { videoId: 'rUxyKA_-grg', title: 'أجواء مطر وموسيقى هادئة', author: 'Sleep Radio', duration: 'مباشر' },
  { videoId: 'DWcJFNfaw9c', title: 'موسيقى كافيه عربية وهادئة', author: 'Coffee Jazz', duration: 'HD' },
  { videoId: 'n61ULEU7CO0', title: 'تلاوة عطرة ومريحة للقلب', author: 'Quran Recitation', duration: 'HD' }
];

app.get('/api/youtube/search', requireAuth, async (req, res) => {
  const q = String(req.query?.q || '').trim().slice(0, 120);
  if (!q) return res.status(400).json({ error: 'أدخل كلمة البحث عن أغنية أو فيديو يوتيوب.' });

  const results = [];
  // 1. Direct YouTube search HTML parse
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    const ytRes = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
        }
      }
    );
    clearTimeout(timer);
    const html = await ytRes.text();
    const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      collectYoutubeVideoRenderers(parsed, results);
    }
  } catch {
    // ignore primary scrape error and try Piped/Invidious fallback
  }

  // 2. Fallback to Piped public JSON API if YouTube HTML returned nothing
  if (results.length === 0) {
    for (const apiBase of ['https://pipedapi.kavin.rocks', 'https://pipedapi.tokhmi.xyz']) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const pRes = await fetch(`${apiBase}/search?q=${encodeURIComponent(q)}&filter=videos`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        clearTimeout(timer);
        if (!pRes.ok) continue;
        const pData = await pRes.json();
        const items = Array.isArray(pData?.items) ? pData.items : [];
        for (const it of items) {
          const vid = extractYouTubeId(it.url || '');
          if (!vid) continue;
          const durSec = Number(it.duration) || 0;
          const durText = durSec > 0 ? `${Math.floor(durSec / 60)}:${String(durSec % 60).padStart(2, '0')}` : 'فيديو';
          results.push({
            videoId: vid,
            title: String(it.title || q).slice(0, 120),
            author: String(it.uploaderName || 'YouTube').slice(0, 60),
            duration: durText,
            thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
          });
          if (results.length >= 12) break;
        }
        if (results.length > 0) break;
      } catch {
        // try next mirror
      }
    }
  }

  // 3. Last-resort safe fallback catalog
  if (results.length === 0) {
    return res.json({
      results: FALLBACK_YOUTUBE_SONGS.map((item, idx) => ({
        ...item,
        title: idx === 0 ? `${q} — ${item.title}` : item.title,
        thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
      }))
    });
  }

  return res.json({ results });
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
    nameAnim,
    nameAnimSpeed,
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
    fontFamily: fontFamily !== undefined ? normalizeProfileFont(fontFamily) : undefined,
    fontStyle,
    fontSize,
    avatarUrl,
    coverUrl,
    avatarFrame,
    nameplateStyle,
    nameShine,
    nameAnim: nameAnim !== undefined ? normalizeNameAnim(nameAnim) : undefined,
    nameAnimSpeed: nameAnimSpeed !== undefined ? normalizeNameAnimSpeed(nameAnimSpeed) : undefined,
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
    nameAnimations: NAME_ANIMATIONS,
    nameAnimSpeeds: NAME_ANIM_SPEEDS,
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

  if (!isClearing && type !== 'name_anim' && type !== 'name_anim_speed' && !canUseAddons) {
    return res.status(403).json({ error: 'رتبتك لا تملك صلاحية استخدام الإضافات حالياً.' });
  }

  let patch = null;
  if (type === 'frame') {
    const found = SHOP_FRAMES.find((f) => f.id === itemId);
    if (!found) return res.status(400).json({ error: 'الإطار غير موجود.' });
    if (found.ownerOnly && req.authUser.role !== 'site_owner') {
      return res.status(403).json({ error: 'هذا الإطار حصري لصاحب الموقع فقط.' });
    }
    patch = { avatarFrame: itemId };
  } else if (type === 'nameplate') {
    const exists = SHOP_NAMEPLATES.some((n) => n.id === itemId);
    if (!exists) return res.status(400).json({ error: 'القالب غير موجود.' });
    patch = { nameplateStyle: itemId };
  } else if (type === 'shine') {
    const exists = NAME_SHINES.some((s) => s.id === itemId);
    if (!exists) return res.status(400).json({ error: 'اللمعة غير موجودة.' });
    patch = { nameShine: itemId };
  } else if (type === 'name_anim') {
    patch = { nameAnim: normalizeNameAnim(itemId) };
  } else if (type === 'name_anim_speed') {
    patch = { nameAnimSpeed: normalizeNameAnimSpeed(itemId) };
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
  const adminActionCounts = new Map();
  for (const log of db.getAdminLogs(500)) {
    if (log.actor_key) {
      adminActionCounts.set(log.actor_key, (adminActionCounts.get(log.actor_key) || 0) + 1);
    }
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
    quizPoints: Number(u.quiz_points) || 0,
    adminActionsCount: adminActionCounts.get(`user:${u.id}`) || 0,
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
  const quizLeaders = [...all]
    .sort((a, b) => (b.quiz_points || 0) - (a.quiz_points || 0) || (b.activity_points || 0) - (a.activity_points || 0))
    .slice(0, 25)
    .map(mapEntry);
  const adminActivity = [...all]
    .filter((u) => {
      if (u.role === 'member' || u.role === 'guest') return false;
      return (
        u.role === 'site_owner' ||
        db.hasPermission(u.role, 'access_panel') ||
        db.hasPermission(u.role, 'mute') ||
        db.hasPermission(u.role, 'kick') ||
        db.hasPermission(u.role, 'ban') ||
        db.getRankPower(u.role) >= 50
      );
    })
    .map(mapEntry)
    .sort(
      (a, b) =>
        (b.activityPoints + b.adminActionsCount * 5) - (a.activityPoints + a.adminActionsCount * 5) ||
        db.getRankSortWeight(b.role) - db.getRankSortWeight(a.role)
    )
    .slice(0, 25);

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

  return res.json({ rich, vips, families, activeMembers, activeRooms, quizLeaders, adminActivity });
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
  const targetKey = decodeURIComponent(req.params.key);
  db.unbanTarget(targetKey);
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'فك حظر',
    targetKey,
    targetName: targetKey
  });
  await db.flushWrites();
  return res.json({ ok: true });
});

// ==========================================
// DAILY LUCKY BOX & ULTIMATE OWNER SUITE
// ==========================================
app.post('/api/lucky-box/claim', requireRegistered, async (req, res) => {
  const result = db.claimLuckyBox(req.authUser.userId);
  if (result.error) return res.status(400).json({ error: result.error });
  syncUserAcrossSockets(io, req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, prize: result.prize, user: mapUserRow(result.user) });
});

function clearQuizBotTimers(bot) {
  if (!bot) return;
  if (bot.timer) { clearTimeout(bot.timer); bot.timer = null; }
  if (bot.hintTimer) { clearTimeout(bot.hintTimer); bot.hintTimer = null; }
  if (bot.endTimer) { clearTimeout(bot.endTimer); bot.endTimer = null; }
  if (bot.nextTimer) { clearTimeout(bot.nextTimer); bot.nextTimer = null; }
}

function getRoomHumanCount(roomId) {
  let count = 0;
  for (const e of onlineSockets.values()) {
    if (e.roomId === roomId) count += 1;
  }
  return count;
}

function buildQuizHintText(rawAnswer) {
  const ans = String(rawAnswer || '').trim();
  const compact = ans.replace(/\s+/g, '');
  const firstChar = compact.slice(0, 1) || '?';
  const letterCount = compact.length;
  return `أول حرف: "${firstChar}" • عدد الحروف: ${letterCount}`;
}

function emitQuizBotMessage(roomId, content, textColor = '#1e1b4b', nameBgColor = '#1e1b4b') {
  const msg = db.addMessage({
    roomId,
    senderKey: 'system:quizbot',
    senderName: '🤖 بوت المسابقات',
    senderRole: 'site_owner',
    nameColor: '#fbbf24',
    textColor,
    nameBgColor,
    isAdminNotice: true,
    msgType: 'text',
    content
  });
  io.to(`room:${roomId}`).emit('new_message', msg);
}

function emitQuizBotState(roomId) {
  const bot = roomQuizBots.get(roomId);
  io.to(`room:${roomId}`).emit('quiz_bot_state', {
    roomId,
    active: Boolean(bot && bot.active),
    hintSent: Boolean(bot && bot.hintSent),
    pausedEmpty: Boolean(bot && bot.pausedEmpty),
    enabledSetting: Number(db.getSiteSettings().quiz_bot_enabled) !== 0
  });
}

function startRoomQuizRound(roomId) {
  const bot = roomQuizBots.get(roomId);
  if (!bot || !bot.active) return;
  clearQuizBotTimers(bot);

  if (getRoomHumanCount(roomId) === 0) {
    bot.currentQ = null;
    bot.hintSent = false;
    bot.pausedEmpty = true;
    return;
  }

  bot.pausedEmpty = false;
  const qObj = QUIZ_BANK[bot.qIndex % QUIZ_BANK.length];
  bot.qIndex = (bot.qIndex + 1) % QUIZ_BANK.length;
  bot.currentQ = qObj;
  bot.roundStartedAt = Date.now();
  bot.hintSent = false;

  emitQuizBotMessage(
    roomId,
    `🎯 [${qObj.category}] ${qObj.q} (⏱️ 25 ثانية | 100 نقطة قبل التلميح)`
  );
  emitQuizBotState(roomId);

  // After 12s -> auto-send first letter + letter count hint
  bot.hintTimer = setTimeout(() => {
    const curBot = roomQuizBots.get(roomId);
    if (!curBot || !curBot.active || curBot.currentQ !== qObj) return;
    curBot.hintSent = true;
    const hintDesc = buildQuizHintText(qObj.displayAnswer || qObj.a[0]);
    emitQuizBotMessage(
      roomId,
      `💡 تلميح: ${hintDesc} — الإجابة الآن بـ 50 نقطة ثم 25 نقطة في الثواني الأخيرة!`,
      '#92400e',
      '#78350f'
    );
    emitQuizBotState(roomId);
  }, 12000);

  // After 25s -> reveal answer and advance to next question
  bot.endTimer = setTimeout(() => {
    const curBot = roomQuizBots.get(roomId);
    if (!curBot || !curBot.active || curBot.currentQ !== qObj) return;
    clearQuizBotTimers(curBot);
    curBot.currentQ = null;
    curBot.hintSent = false;
    const answerLabel = qObj.displayAnswer || qObj.a[0];
    emitQuizBotMessage(
      roomId,
      `⏰ انتهى الوقت! الإجابة الصحيحة هي: "${answerLabel}" — جاري الانتقال للسؤال التالي...`,
      '#991b1b',
      '#7f1d1d'
    );
    emitQuizBotState(roomId);
    curBot.nextTimer = setTimeout(() => startRoomQuizRound(roomId), 3500);
  }, 25000);
}

function startQuizBotInRoom(roomId, rewardCoins = 100) {
  const prev = roomQuizBots.get(roomId);
  clearQuizBotTimers(prev);
  const bot = {
    active: true,
    qIndex: Math.floor(Math.random() * QUIZ_BANK.length),
    currentQ: null,
    roundStartedAt: 0,
    hintSent: false,
    pausedEmpty: false,
    hintTimer: null,
    endTimer: null,
    nextTimer: null,
    timer: null,
    rewardCoins
  };
  roomQuizBots.set(roomId, bot);
  if (roomId === 'competitions') {
    db.updateSiteSettings({ quiz_bot_enabled: 1 });
  }
  startRoomQuizRound(roomId);
  emitQuizBotState(roomId);
}

function stopQuizBotInRoom(roomId, silent = false) {
  const prev = roomQuizBots.get(roomId);
  clearQuizBotTimers(prev);
  roomQuizBots.delete(roomId);
  if (roomId === 'competitions') {
    db.updateSiteSettings({ quiz_bot_enabled: 0 });
  }
  if (!silent) {
    io.to(`room:${roomId}`).emit('room_notice', {
      roomId,
      text: '🛑 تم إيقاف بوت المسابقات التلقائي في هذه الغرفة.'
    });
  }
  emitQuizBotState(roomId);
}

function ensureCompetitionsQuizBotRunning(roomId) {
  if (roomId !== 'competitions') return;
  if (Number(db.getSiteSettings().quiz_bot_enabled) === 0) return;
  if (getRoomHumanCount('competitions') === 0) return;

  const existing = roomQuizBots.get('competitions');
  if (!existing) {
    const bot = {
      active: true,
      qIndex: Math.floor(Math.random() * QUIZ_BANK.length),
      currentQ: null,
      roundStartedAt: 0,
      hintSent: false,
      pausedEmpty: false,
      hintTimer: null,
      endTimer: null,
      nextTimer: null,
      timer: null,
      rewardCoins: 100
    };
    roomQuizBots.set('competitions', bot);
    bot.nextTimer = setTimeout(() => startRoomQuizRound('competitions'), 1500);
    return;
  }
  if (existing.active && existing.pausedEmpty && !existing.currentQ && !existing.nextTimer) {
    existing.pausedEmpty = false;
    existing.nextTimer = setTimeout(() => startRoomQuizRound('competitions'), 1500);
  }
}

function pauseQuizBotIfRoomEmpty(roomId) {
  if (!roomId) return;
  const bot = roomQuizBots.get(roomId);
  if (!bot || !bot.active) return;
  if (getRoomHumanCount(roomId) === 0) {
    clearQuizBotTimers(bot);
    bot.currentQ = null;
    bot.hintSent = false;
    bot.pausedEmpty = true;
  }
}

function isQuizAnswerMatch(rawMsg, acceptedAnswers) {
  const normMsg = normalizeArabicText(rawMsg).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!normMsg) return false;
  const msgWords = normMsg.split(' ');
  return acceptedAnswers.some((ans) => {
    const normAns = normalizeArabicText(ans).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!normAns) return false;
    if (normMsg === normAns) return true;
    const bareAns = normAns.startsWith('ال') && normAns.length >= 4 ? normAns.slice(2) : normAns;
    const bareMsg = normMsg.startsWith('ال') && normMsg.length >= 4 ? normMsg.slice(2) : normMsg;
    if (bareMsg === bareAns) return true;
    if (normAns.includes(' ')) {
      return normMsg.includes(normAns);
    }
    return msgWords.some((w) => w === normAns || (bareAns.length >= 3 && (w === bareAns || w === `ال${bareAns}`)));
  });
}

function checkQuizBotAnswer(entry, content) {
  if (!entry || entry.key === 'system:quizbot') return;
  const bot = roomQuizBots.get(entry.roomId);
  if (!bot || !bot.active || !bot.currentQ) return;
  const qObj = bot.currentQ;
  if (!isQuizAnswerMatch(content, qObj.a)) return;

  const elapsedSec = Math.max(0, (Date.now() - (bot.roundStartedAt || Date.now())) / 1000);
  let earnedPoints = 100;
  let speedLabel = 'قبل التلميح ⚡';
  if (bot.hintSent || elapsedSec >= 12) {
    if (elapsedSec >= 20) {
      earnedPoints = 25;
      speedLabel = 'في الثواني الأخيرة ⏱️';
    } else {
      earnedPoints = 50;
      speedLabel = 'بعد التلميح 💡';
    }
  }

  clearQuizBotTimers(bot);
  bot.currentQ = null;
  bot.hintSent = false;

  if (entry.userId) {
    db.adjustUserCoins(entry.userId, earnedPoints);
    db.incrementQuizPoints(entry.userId, earnedPoints);
    syncUserAcrossSockets(io, entry.userId);
  }

  const answerLabel = qObj.displayAnswer || qObj.a[0];
  emitQuizBotMessage(
    entry.roomId,
    `🏆 أحسنت يا "${entry.name}"! الإجابة (${answerLabel}) صحيحة [${speedLabel}] وحصلت على +${earnedPoints} نقطة مسابقة!${entry.userId ? '' : ' (سجّل لحفظ نقاطك)'}`,
    '#166534',
    '#14532d'
  );
  emitQuizBotState(entry.roomId);
  bot.nextTimer = setTimeout(() => startRoomQuizRound(entry.roomId), 3500);
}

app.get('/api/owner/suite', requireOwner, (_req, res) => {
  const liveSockets = [];
  const hiddenOnline = [];
  for (const e of onlineSockets.values()) {
    const rm = e.roomId ? db.getRoomById(e.roomId) : null;
    const item = {
      socketId: e.socketId,
      key: e.key,
      userId: e.userId,
      isGuest: e.isGuest,
      name: e.name,
      role: e.role,
      roomId: e.roomId || '',
      roomName: rm ? rm.name : '',
      ipAddress: e.ipAddress || '',
      deviceId: e.deviceId || '',
      isStealth: isStealthEntry(e),
      isFrozen: Boolean(e.isFrozen || guestFrozenKeys.has(e.key)),
      isShadowMuted: Boolean(e.isShadowMuted || guestShadowMutedKeys.has(e.key)),
      isGhosted: Boolean(e.isGhosted)
    };
    liveSockets.push(item);
    if (item.isStealth || item.isGhosted || item.isShadowMuted) hiddenOnline.push(item);
  }

  // Multi-account detector by IP or Device ID
  const byIp = new Map();
  const byDev = new Map();
  const users = db.getAllRegisteredUsers().map((u) => {
    const mapped = {
      id: u.id,
      key: `user:${u.id}`,
      username: u.username,
      displayName: db.getEffectiveName(u),
      email: u.email,
      role: u.role,
      coins: Number(u.coins) || 0,
      lastIp: u.last_ip || '',
      lastDeviceId: u.last_device_id || '',
      nameHistory: Array.isArray(u.name_history) ? u.name_history : [],
      isShadowMuted: Boolean(u.is_shadow_muted),
      isFrozen: Boolean(u.is_frozen),
      isGhosted: Boolean(u.is_ghosted),
      invitesCount: Number(u.invites_count) || 0,
      isSupremeOwner: db.isSupremeOwnerEmail(u.email)
    };
    if (mapped.lastIp && !['127.0.0.1', '::1', 'localhost'].includes(mapped.lastIp)) {
      const arr = byIp.get(mapped.lastIp) || [];
      arr.push(mapped);
      byIp.set(mapped.lastIp, arr);
    }
    if (mapped.lastDeviceId) {
      const arr = byDev.get(mapped.lastDeviceId) || [];
      arr.push(mapped);
      byDev.set(mapped.lastDeviceId, arr);
    }
    return mapped;
  });

  const multiAccounts = [];
  for (const [ip, grp] of byIp.entries()) {
    if (grp.length >= 2) multiAccounts.push({ type: 'IP', fingerprint: ip, accounts: grp });
  }
  for (const [dev, grp] of byDev.entries()) {
    if (grp.length >= 2) multiAccounts.push({ type: 'Device', fingerprint: dev, accounts: grp });
  }

  const settings = db.getSiteSettings();
  const activeQuizRooms = [];
  for (const [rid, bot] of roomQuizBots.entries()) {
    if (bot.active) activeQuizRooms.push(rid);
  }

  return res.json({
    hiddenOnline,
    liveSockets,
    multiAccounts,
    users,
    adminLogs: db.getAdminLogs(100),
    pmLinkAlerts: db.getPmLinkAlerts(60),
    activeQuizRooms,
    protections: {
      lock_guest_images: Number(settings.lock_guest_images) || 0,
      block_vpn: Number(settings.block_vpn) || 0,
      banned_words: Array.isArray(settings.banned_words) ? settings.banned_words : [],
      online_boost: Number(settings.online_boost) || 0,
      lucky_box_enabled: settings.lucky_box_enabled === 0 ? 0 : 1,
      lucky_box_min: Number(settings.lucky_box_min) || 50,
      lucky_box_max: Number(settings.lucky_box_max) || 500,
      referral_bonus: Number(settings.referral_bonus) || 200
    }
  });
});

app.post('/api/owner/action', requireOwner, async (req, res) => {
  const { action, targetKey, roomId, toRoomId, enabled, message, content, title, asMode, targetUserKey, amountPerUser, rewardCoins, ipAddress, deviceId, reason, protections } = req.body || {};
  const actor = req.authUser;

  if (action === 'shadow_mute') {
    if (!targetKey || db.isProtectedSupremeOwnerKey(targetKey)) {
      return res.status(403).json({ error: 'لا يمكن تطبيق الكتم الصامت على هذا الحساب.' });
    }
    if (String(targetKey).startsWith('user:')) {
      const uid = Number(String(targetKey).replace('user:', ''));
      const r = db.setUserShadowMuted(uid, Boolean(enabled));
      if (r?.error) return res.status(400).json({ error: r.error });
      syncUserAcrossSockets(io, uid);
    } else {
      if (enabled) guestShadowMutedKeys.add(targetKey);
      else guestShadowMutedKeys.delete(targetKey);
      for (const e of onlineSockets.values()) {
        if (e.key === targetKey) e.isShadowMuted = Boolean(enabled);
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: enabled ? 'كتم صامت' : 'إلغاء كتم صامت', targetKey, targetName: targetKey });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'freeze_user') {
    if (!targetKey || db.isProtectedSupremeOwnerKey(targetKey)) {
      return res.status(403).json({ error: 'لا يمكن تجميد هذا الحساب.' });
    }
    if (String(targetKey).startsWith('user:')) {
      const uid = Number(String(targetKey).replace('user:', ''));
      const r = db.setUserFrozen(uid, Boolean(enabled));
      if (r?.error) return res.status(400).json({ error: r.error });
      syncUserAcrossSockets(io, uid);
    } else {
      if (enabled) guestFrozenKeys.add(targetKey);
      else guestFrozenKeys.delete(targetKey);
    }
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === targetKey) {
        e.isFrozen = Boolean(enabled);
        io.to(sid).emit('user_frozen_state', { isFrozen: Boolean(enabled) });
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: enabled ? 'تجميد عضو' : 'فك تجميد عضو', targetKey, targetName: targetKey });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'move_user') {
    const destRoom = db.getRoomById(toRoomId);
    if (!targetKey || !destRoom) return res.status(400).json({ error: 'الهدف أو الغرفة غير صالحة.' });
    let moved = 0;
    for (const [sid, e] of onlineSockets.entries()) {
      if (e.key === targetKey) {
        const s = io.sockets.sockets.get(sid);
        if (s) {
          moveSocketToRoom(s, toRoomId, false);
          io.to(sid).emit('error_toast', { message: `تم سحبك ونقلك إلى غرفة "${destRoom.name}" بواسطة المالك.` });
          moved += 1;
        }
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'سحب ونقل عضو', targetKey, details: `إلى ${destRoom.name} (${moved})` });
    await db.flushWrites();
    return res.json({ ok: true, moved });
  }

  if (action === 'freeze_room') {
    const updated = db.setRoomFrozen(roomId, Boolean(enabled));
    if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    io.to(`room:${roomId}`).emit('room_updated', db.sanitizeRoomForPublic(updated));
    io.to(`room:${roomId}`).emit('room_notice', {
      roomId,
      text: enabled ? `❄️ تم تجميد الغرفة (للقراءة فقط) بواسطة ${actor.name}.` : `🔥 تم فك تجميد الغرفة بواسطة ${actor.name}.`
    });
    broadcastRoomsList(io);
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: enabled ? 'تجميد غرفة' : 'فك تجميد غرفة', targetKey: roomId, targetName: updated.name });
    await db.flushWrites();
    return res.json({ ok: true, room: db.sanitizeRoomForPublic(updated) });
  }

  if (action === 'clear_room') {
    if (!roomId || !db.getRoomById(roomId)) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    db.clearRoomMessages(roomId);
    io.to(`room:${roomId}`).emit('room_cleared', { roomId, byName: actor.name });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تنظيف غرفة', targetKey: roomId });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'mute_all_mics') {
    if (!roomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
    const slots = ensureRoomMicSlots(roomId);
    for (const sl of slots) {
      if (sl.holderKey && sl.holderRole !== 'site_owner') {
        sl.isAdminMuted = true;
        sl.isSpeaking = false;
        if (sl.holderSocketId) io.to(sl.holderSocketId).emit('mic_force_mute', { muted: true });
      }
    }
    io.to(`room:${roomId}`).emit('mic_state', { roomId, slots: getPublicMicSlots(roomId) });
    io.to(`room:${roomId}`).emit('room_notice', { roomId, text: `🔇 تم كتم جميع المايكات في الغرفة بأمر المالك.` });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'كتم كل المايكات', targetKey: roomId });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'pin_message') {
    const updated = db.setRoomPinnedMessage(roomId, message || '', actor.name);
    if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    io.to(`room:${roomId}`).emit('room_updated', db.sanitizeRoomForPublic(updated));
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: message ? 'تثبيت رسالة ملكية' : 'إزالة الرسالة المثبتة', targetKey: roomId, details: String(message || '').slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true, room: db.sanitizeRoomForPublic(updated) });
  }

  if (action === 'send_as') {
    const rm = db.getRoomById(roomId);
    const clean = String(content || '').trim().slice(0, 1000);
    if (!rm || !clean) return res.status(400).json({ error: 'اختر الغرفة واكتب الرسالة.' });
    let senderObj = {
      senderKey: 'system:official',
      senderName: '🛡️ النظام الرسمي',
      senderRole: 'site_owner',
      nameColor: '#fbbf24',
      textColor: '#7f1d1d',
      nameBgColor: '#18181b',
      neonColor: '#f59e0b',
      avatarUrl: '',
      avatarFrame: 'owner_sovereign',
      isAdminNotice: true
    };
    if (asMode === 'user' && targetUserKey) {
      const uid = Number(String(targetUserKey).replace('user:', ''));
      const u = db.findUserById(uid);
      if (u) {
        senderObj = {
          senderKey: `user:${u.id}`,
          senderName: db.getEffectiveName(u),
          senderRole: u.role,
          nameColor: u.name_color,
          textColor: u.text_color,
          nameBgColor: u.name_bg_color,
          neonColor: u.neon_color,
          avatarUrl: u.avatar_url,
          avatarFrame: u.avatar_frame,
          isAdminNotice: false
        };
      }
    }
    const msg = db.addMessage({ roomId, ...senderObj, msgType: 'text', content: clean });
    io.to(`room:${roomId}`).emit('new_message', msg);
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: asMode === 'user' ? 'إرسال نيابة عن عضو' : 'إرسال باسم النظام', targetKey: roomId, details: clean.slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true, msg });
  }

  if (action === 'global_broadcast') {
    const clean = String(content || '').trim().slice(0, 500);
    if (!clean) return res.status(400).json({ error: 'أدخل نص الإعلان العام.' });
    const cleanTitle = String(title || '📢 إعلان إداري عاجل').trim().slice(0, 80);
    io.emit('global_urgent_broadcast', { title: cleanTitle, content: clean, byName: actor.name, ts: Date.now() });
    for (const r of db.getAllRooms()) {
      const msg = db.addMessage({
        roomId: r.id,
        senderKey: actor.key,
        senderName: actor.name,
        senderRole: 'site_owner',
        nameColor: '#fbbf24',
        textColor: '#7f1d1d',
        nameBgColor: '#18181b',
        avatarUrl: actor.avatarUrl,
        avatarFrame: actor.avatarFrame,
        isAdminNotice: true,
        msgType: 'text',
        content: `📢 ${cleanTitle}: ${clean}`
      });
      io.to(`room:${r.id}`).emit('new_message', msg);
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'إعلان عام لكل الغرف', details: clean.slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'golden_rain') {
    const amt = Math.max(10, Math.min(10000, Number(amountPerUser) || 100));
    const targetRoomId = roomId || 'general';
    const recipientIds = new Set();
    for (const e of onlineSockets.values()) {
      if (e.userId && (targetRoomId === 'all' || e.roomId === targetRoomId) && !isStealthEntry(e)) {
        recipientIds.add(e.userId);
      }
    }
    for (const uid of recipientIds) {
      db.adjustUserCoins(uid, amt);
      syncUserAcrossSockets(io, uid);
    }
    const emitTarget = targetRoomId === 'all' ? io : io.to(`room:${targetRoomId}`);
    emitTarget.emit('golden_rain_event', { amount: amt, byName: actor.name, count: recipientIds.size });
    const roomsToAnnounce = targetRoomId === 'all' ? db.getAllRooms().map((r) => r.id) : [targetRoomId];
    for (const rid of roomsToAnnounce) {
      if (!db.getRoomById(rid)) continue;
      const msg = db.addMessage({
        roomId: rid,
        senderKey: actor.key,
        senderName: actor.name,
        senderRole: 'site_owner',
        nameColor: '#fbbf24',
        textColor: '#92400e',
        nameBgColor: '#18181b',
        avatarUrl: actor.avatarUrl,
        avatarFrame: actor.avatarFrame,
        isAdminNotice: true,
        msgType: 'text',
        content: `🪙✨ أمطر المالك "${actor.name}" الغرفة بـ +${amt} عملة ذهبية لكل عضو (${recipientIds.size} مستفيد)!`
      });
      io.to(`room:${rid}`).emit('new_message', msg);
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'مطر ذهبي للعملات', targetKey: targetRoomId, details: `+${amt} × ${recipientIds.size}` });
    await db.flushWrites();
    return res.json({ ok: true, count: recipientIds.size });
  }

  if (action === 'quiz_bot') {
    const targetRoomId = roomId || 'competitions';
    if (!db.getRoomById(targetRoomId)) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    if (!enabled) {
      stopQuizBotInRoom(targetRoomId);
      db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'إيقاف بوت المسابقات', targetKey: targetRoomId });
      await db.flushWrites();
      return res.json({ ok: true, active: false });
    }
    const reward = Math.max(10, Math.min(2000, Number(rewardCoins) || 100));
    startQuizBotInRoom(targetRoomId, reward);
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تشغيل بوت المسابقات', targetKey: targetRoomId, details: 'نظام تدرجي 100/50/25' });
    await db.flushWrites();
    return res.json({ ok: true, active: true });
  }

  if (action === 'ban_ip') {
    const bKey = targetKey || `ip:${ipAddress || deviceId}`;
    if (!ipAddress && !deviceId && !targetKey) return res.status(400).json({ error: 'أدخل IP أو معرف الجهاز.' });
    if (db.isProtectedSupremeOwnerKey(bKey)) return res.status(403).json({ error: 'محمي.' });
    db.banTarget({
      targetKey: bKey,
      targetName: ipAddress || deviceId || bKey,
      ipAddress: ipAddress || '',
      deviceId: deviceId || '',
      banType: 'xban',
      reason: reason || 'حظر IP / جهاز من المالك',
      bannedBy: actor.name
    });
    for (const [sid, e] of onlineSockets.entries()) {
      if ((ipAddress && e.ipAddress === ipAddress) || (deviceId && e.deviceId === deviceId) || (targetKey && e.key === targetKey)) {
        if (e.role !== 'site_owner') {
          io.to(sid).emit('kicked', { reason: reason || 'تم حظر جهازك وعنوانك من قبل المالك.' });
          io.sockets.sockets.get(sid)?.disconnect(true);
        }
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'حظر IP/جهاز', targetKey: bKey, details: reason || '' });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'update_protections') {
    const updated = db.updateSiteSettings(protections || {});
    io.emit('site_settings_updated', updated);
    broadcastRoomsList(io);
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تحديث إعدادات الحماية والمميزات' });
    await db.flushWrites();
    return res.json({ ok: true, settings: updated });
  }

  return res.status(400).json({ error: 'إجراء غير معروف.' });
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
    pauseQuizBotIfRoomEmpty(oldRoomId);
  }

  entry.roomId = targetRoomId;
  socket.join(`room:${targetRoomId}`);

  ensureCompetitionsQuizBotRunning(targetRoomId);
  const qBot = roomQuizBots.get(targetRoomId);
  const messages = db.getRoomMessages(targetRoomId, 100, entry.key);
  const pubRoom = db.sanitizeRoomForPublic(room);
  const isManager = db.isRoomManager(targetRoomId, entry.userId, entry.role);

  socket.emit('room_joined', {
    room: pubRoom,
    isRoomManager: isManager,
    messages,
    mics: getPublicMicSlots(targetRoomId),
    users: getRoomUsersList(targetRoomId),
    roomKingKey: computeRoomKingKey(targetRoomId),
    quizBot: {
      active: Boolean(qBot && qBot.active),
      hintSent: Boolean(qBot && qBot.hintSent),
      enabledSetting: Number(db.getSiteSettings().quiz_bot_enabled) !== 0
    }
  });

  broadcastRoomUsers(io, targetRoomId);
  broadcastRoomsList(io);
  broadcastGlobalOnlineUsers(io);
  io.emit('persistent_members', buildPersistentMembersList());

  // Suppress redundant join notice on silent reconnect, grace recovery, or recent presence in same room
  const pending = pendingGrace.get(entry.key);
  const rejoiningSameRoom = pending && pending.lastRoomId === targetRoomId;
  if (pending) {
    clearTimeout(pending.timeout);
    pendingGrace.delete(entry.key);
  }

  const recent = recentRoomPresence.get(entry.key);
  const recentlyInSameRoom = Boolean(
    recent && recent.roomId === targetRoomId && Date.now() - recent.at < 20 * 60 * 1000
  );
  recentRoomPresence.set(entry.key, { roomId: targetRoomId, at: Date.now() });

  if (!isSilentReconnect && !rejoiningSameRoom && !recentlyInSameRoom && oldRoomId !== targetRoomId && !isStealthEntry(entry)) {
    const rank = db.getRankByKey(entry.role);
    const isOwnerJoin = entry.role === 'site_owner';
    if (isOwnerJoin) {
      io.to(`room:${targetRoomId}`).emit('royal_entrance', {
        roomId: targetRoomId,
        name: entry.name,
        avatarUrl: entry.avatarUrl || '',
        rankLabel: rank.label
      });
    }
    io.to(`room:${targetRoomId}`).emit('room_notice', {
      roomId: targetRoomId,
      kind: isOwnerJoin ? 'royal_join' : 'join',
      text: isOwnerJoin ? `👑 تشريف ملكي: دخل المالك "${entry.name}" الغرفة!` : `✓ هذا المستخدم انضم للغرفة`,
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
        nameAnim: entry.nameAnim || 'none',
        nameAnimSpeed: entry.nameAnimSpeed || 'normal',
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
      if (Number(db.getSiteSettings().block_vpn) === 1 && isVpnOrProxyRequest(socket)) {
        return next(new Error('BANNED:تم حظر الدخول عبر VPN أو Proxy.'));
      }
      const ban = db.isTargetBanned({ targetKey: payload.key, ipAddress: ip, deviceId });
      if (ban) return next(new Error(`BANNED:${ban.reason}`));
      const persistedGuest = db.upsertGuest({
        key: payload.key,
        name: payload.name || 'زائر',
        ipAddress: ip,
        deviceId
      });
      const mappedGuest = mapGuestRow(persistedGuest, payload.key, payload.name || 'زائر');
      socket.authSession = {
        socketId: socket.id,
        ...mappedGuest,
        email: '',
        isGhosted: false,
        isShadowMuted: guestShadowMutedKeys.has(payload.key),
        isFrozen: guestFrozenKeys.has(payload.key),
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
      if (Number(db.getSiteSettings().block_vpn) === 1 && row.role !== 'site_owner' && isVpnOrProxyRequest(socket)) {
        return next(new Error('BANNED:تم حظر الدخول عبر VPN أو Proxy.'));
      }
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

  // Deduplicate stale socket for the exact same user + device without emitting disconnect churn
  let replacedSameDevice = false;
  for (const [oldSid, oldEntry] of [...onlineSockets.entries()]) {
    if (oldSid !== socket.id && oldEntry.key === session.key && (!session.deviceId || oldEntry.deviceId === session.deviceId)) {
      replacedSameDevice = true;
      onlineSockets.delete(oldSid);
      const oldSock = io.sockets.sockets.get(oldSid);
      if (oldSock) {
        oldSock._replacedByNewSocket = true;
        oldSock.disconnect(true);
      }
    }
  }

  onlineSockets.set(socket.id, session);

  const pending = pendingGrace.get(session.key);
  const wasGraceReconnect = Boolean(pending) || replacedSameDevice;
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
    if (entry) {
      entry.lastHeartbeat = Date.now();
      if (entry.roomId) recentRoomPresence.set(entry.key, { roomId: entry.roomId, at: Date.now() });
    }
    if (typeof cb === 'function') cb({ ok: true, ts: Date.now() });
  });

  socket.on('explicit_logout', () => {
    socket._explicitLogout = true;
    const entry = onlineSockets.get(socket.id);
    if (entry) recentRoomPresence.delete(entry.key);
  });

  socket.on('join_room', ({ roomId, password }, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry) return;
    if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
      const errMsg = 'حسابك مجمد مؤقتاً من قبل المالك ولا يمكنك التنقل بين الغرف.';
      if (typeof cb === 'function') cb({ error: errMsg });
      return;
    }
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

      if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
        if (typeof cb === 'function') cb({ error: 'أنت مجمد حالياً بأمر المالك ولا يمكنك الإرسال.' });
        return;
      }

      const currentRm = db.getRoomById(entry.roomId);
      if (currentRm && Number(currentRm.is_frozen) === 1 && !db.isRoomManager(entry.roomId, entry.userId, entry.role)) {
        if (typeof cb === 'function') cb({ error: 'الغرفة مجمدة مؤقتاً للقراءة فقط.' });
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

      if (msgType === 'image' && entry.isGuest && Number(db.getSiteSettings().lock_guest_images) === 1) {
        if (typeof cb === 'function') cb({ error: 'تم إقفال إرسال الصور للزوار من قبل المالك.' });
        return;
      }
      if (msgType === 'text' && !content) {
        if (typeof cb === 'function') cb({ error: 'الرسالة فارغة.' });
        return;
      }
      if (msgType === 'text' && entry.role !== 'site_owner') {
        const matchedBan = containsBannedWord(content);
        if (matchedBan) {
          if (typeof cb === 'function') cb({ error: 'تحتوي رسالتك على كلمة محظورة في الموقع.' });
          return;
        }
      }
      if ((msgType === 'image' || msgType === 'audio') && !mediaUrl) {
        if (typeof cb === 'function') cb({ error: 'الملف غير موجود.' });
        return;
      }
      if (msgType === 'sticker' && !content && !mediaUrl) {
        if (typeof cb === 'function') cb({ error: 'الملصق فارغ.' });
        return;
      }

      const isGhostOnly =
        entry.role !== 'site_owner' &&
        (Boolean(entry.isGhosted) || Boolean(entry.isShadowMuted) || guestShadowMutedKeys.has(entry.key));
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
        nameAnim: entry.nameAnim || 'none',
        nameAnimSpeed: entry.nameAnimSpeed || 'normal',
        vipWings: entry.vipWings,
        isAdminNotice,
        isGhostOnly,
        msgType,
        content,
        mediaUrl,
        clientMsgId
      });

      if (isGhostOnly) {
        // Ghosted/shadow-muted users see their own messages locally without reaching anyone else
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
      if (msgType === 'text') checkQuizBotAnswer(entry, content);

      // Smart Mention (No @ required) & Recipient-Only Audio/Notification Ping
      if (msgType === 'text' && content) {
        const mentionedKeys = new Set();
        for (const other of onlineSockets.values()) {
          if (other.key === entry.key || isStealthEntry(other)) continue;
          const n1 = String(other.name || '').trim();
          const n2 = String(other.username || '').trim();
          if (textContainsMemberName(content, n1) || textContainsMemberName(content, n2)) {
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
    if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
      if (typeof cb === 'function') cb({ error: 'حسابك مجمد حالياً ولا يمكنك صعود المايك.' });
      return;
    }
    const rm = db.getRoomById(entry.roomId);
    if (!rm || rm.mics_enabled === 0) {
      if (typeof cb === 'function') cb({ error: 'المايكات معطلة في هذه الغرفة.' });
      return;
    }
    if (Number(rm.is_frozen) === 1 && !db.isRoomManager(entry.roomId, entry.userId, entry.role)) {
      if (typeof cb === 'function') cb({ error: 'الغرفة مجمدة مؤقتاً.' });
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
  // SYNCHRONIZED ROOM YOUTUBE PLAYER + MIC MINI AUDIO BAR
  // ==========================================
  socket.on('room_youtube_set', async ({ roomId, url, title, isPlaying, miniMode } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    const targetRoomId = roomId || entry?.roomId;
    if (!entry || !targetRoomId) return;

    const currentRoom = db.getRoomById(targetRoomId);
    if (!currentRoom) return;

    const isMgr = db.isRoomManager(targetRoomId, entry.userId, entry.role);
    const slots = ensureRoomMicSlots(targetRoomId);
    const isOnMic = slots.some((s) => s.holderKey === entry.key);
    const isFrozen = (entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner';
    const isMuted = Boolean(db.getActiveMute(entry.key, targetRoomId));

    if (!isMgr && (isFrozen || isMuted)) {
      if (typeof cb === 'function') cb({ error: 'لا يمكنك تشغيل أو تعديل يوتيوب أثناء التجميد أو الكتم.' });
      return;
    }

    const rawUrl = String(url || '').trim();
    const videoId = rawUrl === '' ? '' : extractYouTubeId(rawUrl);
    if (rawUrl !== '' && !videoId) {
      if (typeof cb === 'function') cb({ error: 'رابط يوتيوب غير صالح. استخدم البحث بالاسم أو رابط فيديو صحيح.' });
      return;
    }

    if (videoId === '' && !isMgr && !isOnMic && currentRoom.youtube_by_key !== entry.key) {
      if (typeof cb === 'function') cb({ error: 'يمكن لمن شغّل المقطع أو المتحدث على المايك أو الإدارة فقط إيقاف التشغيل.' });
      return;
    }

    const resolvedMiniMode = miniMode !== undefined ? Boolean(miniMode) : isOnMic;
    const cleanTitle = String(title || (videoId ? 'مقطع يوتيوب الغرفة' : '')).slice(0, 120);
    const updated = db.setRoomYoutube(targetRoomId, {
      videoId,
      title: cleanTitle,
      isPlaying: Boolean(videoId && isPlaying !== false),
      miniMode: Boolean(videoId && resolvedMiniMode),
      startedByKey: entry.key,
      startedByName: entry.name
    });
    if (!updated) return;

    const pub = db.sanitizeRoomForPublic(updated);
    io.to(`room:${targetRoomId}`).emit('room_youtube_updated', {
      roomId: targetRoomId,
      youtubeVideoId: pub.youtube_video_id,
      youtubeTitle: pub.youtube_title,
      youtubeIsPlaying: Boolean(pub.youtube_is_playing),
      youtubeMiniMode: Boolean(pub.youtube_mini_mode),
      youtubeByKey: pub.youtube_by_key,
      youtubeByName: pub.youtube_by_name,
      byName: entry.name
    });
    if (videoId) {
      io.to(`room:${targetRoomId}`).emit('room_notice', {
        roomId: targetRoomId,
        text: `🎵 شارك "${entry.name}" مقطع يوتيوب: ${cleanTitle}${resolvedMiniMode ? ' (شريط صوتي تحت المايك)' : ''}`
      });
    }
    broadcastRoomsList(io);
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true, room: pub });
  });

  socket.on('quiz_bot_toggle', async ({ roomId, enabled } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || entry.role !== 'site_owner') {
      if (typeof cb === 'function') cb({ error: 'هذا الخيار متاح لصاحب الموقع فقط.' });
      return;
    }
    const targetRoomId = roomId || entry.roomId || 'competitions';
    if (!db.getRoomById(targetRoomId)) {
      if (typeof cb === 'function') cb({ error: 'الغرفة غير موجودة.' });
      return;
    }
    if (enabled) {
      startQuizBotInRoom(targetRoomId, 100);
    } else {
      stopQuizBotInRoom(targetRoomId);
    }
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true, active: Boolean(enabled) });
  });

  // ==========================================
  // PRIVATE MESSAGES
  // ==========================================
  socket.on('send_pm', async ({ toKey, toName, content } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    const clean = String(content || '').trim().slice(0, 800);
    if (!entry || !toKey || !clean) return;
    if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
      if (typeof cb === 'function') cb({ error: 'أنت مجمد حالياً ولا يمكنك إرسال رسائل خاصة.' });
      return;
    }
    if (entry.role !== 'site_owner' && containsBannedWord(clean)) {
      if (typeof cb === 'function') cb({ error: 'تحتوي الرسالة على كلمة محظورة.' });
      return;
    }

    // PM Link Radar -> alerts Owner in real-time and persists alert
    if (entry.role !== 'site_owner' && containsUrl(clean)) {
      const linkAlert = db.addPmLinkAlert({
        fromKey: entry.key,
        fromName: entry.name,
        toKey,
        toName: toName || 'عضو',
        content: clean
      });
      for (const [sid, o] of onlineSockets.entries()) {
        if (o.role === 'site_owner' || db.isSupremeOwnerEmail(o.email)) {
          io.to(sid).emit('owner_pm_link_alert', linkAlert);
        }
      }
    }

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
  // MODERATION SOCKET ACTIONS (WITH HIERARCHICAL IMMUNITY)
  // ==========================================
  function resolveTargetInfo(targetKey) {
    let targetName = targetKey || 'عضو';
    let targetRole = 'guest';
    let targetEmail = '';
    let targetIp = '';
    let targetDevice = '';
    if (String(targetKey || '').startsWith('user:')) {
      const uid = Number(String(targetKey).replace('user:', ''));
      const row = Number.isNaN(uid) ? null : db.findUserById(uid);
      if (row) {
        targetName = db.getEffectiveName(row);
        targetRole = row.role || 'member';
        targetEmail = row.email || '';
        targetIp = row.last_ip || '';
        targetDevice = row.last_device_id || '';
      }
    }
    for (const o of onlineSockets.values()) {
      if (o.key === targetKey) {
        targetName = o.name || targetName;
        targetRole = o.role || targetRole;
        targetEmail = o.email || targetEmail;
        targetIp = o.ipAddress || targetIp;
        targetDevice = o.deviceId || targetDevice;
        break;
      }
    }
    return { targetName, targetRole, targetEmail, targetIp, targetDevice };
  }

  function canModerateWithImmunity(actorEntry, targetKey) {
    if (!actorEntry || !targetKey) return { allowed: false, reason: 'هدف غير صالح.' };
    if (targetKey === actorEntry.key) return { allowed: false, reason: 'لا يمكنك تنفيذ هذا الإجراء على نفسك.' };
    if (db.isProtectedSupremeOwnerKey(targetKey)) {
      return { allowed: false, reason: 'حساب صاحب الموقع محمي بالكامل.' };
    }
    const info = resolveTargetInfo(targetKey);
    if (info.targetRole === 'site_owner' && actorEntry.role !== 'site_owner') {
      return { allowed: false, reason: 'لا يمكنك التحكم بصاحب الموقع.' };
    }
    if (actorEntry.role !== 'site_owner') {
      const myPower = db.getRankPower(actorEntry.role);
      const targetPower = db.getRankPower(info.targetRole);
      if (targetPower >= myPower) {
        return { allowed: false, reason: 'الحصانة المتدرجة: لا يمكنك التحكم بعضو أعلى منك أو مساوٍ لك في الرتبة.' };
      }
    }
    return { allowed: true, info };
  }

  socket.on('admin_warn', async ({ targetKey, reason = 'مخالفة قوانين الغرفة' } = {}, cb) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr =
      entry.role === 'site_owner' ||
      db.isRoomManager(entry.roomId, entry.userId, entry.role) ||
      canDo(entry.role, 'mute') ||
      canDo(entry.role, 'kick') ||
      canDo(entry.role, 'ban');
    if (!isMgr) {
      if (typeof cb === 'function') cb({ error: 'لا تملك صلاحية توجيه التحذيرات.' });
      return;
    }
    const check = canModerateWithImmunity(entry, targetKey);
    if (!check.allowed) {
      socket.emit('error_toast', { message: check.reason });
      if (typeof cb === 'function') cb({ error: check.reason });
      return;
    }
    const cleanReason = String(reason || 'مخالفة قوانين الغرفة').trim().slice(0, 240);
    db.addAdminLog({
      actorKey: entry.key,
      actorName: entry.name,
      actorRole: entry.role,
      action: 'تحذير إداري',
      targetKey,
      targetName: check.info.targetName,
      details: cleanReason
    });
    const notif = db.addNotification({
      targetKey,
      title: `⚠️ تحذير إداري من ${entry.name}`,
      body: cleanReason,
      category: 'warning'
    });
    emitNotificationToUser(io, targetKey, notif);
    for (const [sid, o] of onlineSockets.entries()) {
      if (o.key === targetKey) {
        io.to(sid).emit('admin_warning', {
          byName: entry.name,
          byRole: entry.role,
          reason: cleanReason,
          roomId: entry.roomId
        });
      }
    }
    io.to(`room:${entry.roomId}`).emit('room_notice', {
      roomId: entry.roomId,
      text: `⚠️ وجّه "${entry.name}" تحذيراً إدارياً إلى "${check.info.targetName}": ${cleanReason}`
    });
    await db.flushWrites();
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('admin_mute', async ({ targetKey, minutes = 10, unmute = false } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'mute');
    if (!isMgr) return;
    const check = canModerateWithImmunity(entry, targetKey);
    if (!check.allowed) {
      socket.emit('error_toast', { message: check.reason });
      return;
    }

    if (unmute) {
      db.removeMute(targetKey, entry.roomId);
      io.to(`room:${entry.roomId}`).emit('room_notice', {
        roomId: entry.roomId,
        text: `🔊 قام "${entry.name}" بفك الكتم عن "${check.info.targetName}".`
      });
      db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'فك كتم', targetKey, targetName: check.info.targetName, details: entry.roomId });
    } else {
      const mins = Math.max(1, Math.min(1440, Number(minutes) || 10));
      db.setMute(targetKey, entry.roomId, mins * 60 * 1000, entry.name);
      releaseUserMicsInRoom(targetKey, entry.roomId);
      io.to(`room:${entry.roomId}`).emit('room_notice', {
        roomId: entry.roomId,
        text: `🔇 قام "${entry.name}" بكتم "${check.info.targetName}" لمدة ${mins} دقيقة.`
      });
      db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'كتم عضو', targetKey, targetName: check.info.targetName, details: `${mins} دقيقة (${entry.roomId})` });
    }
    await db.flushWrites();
  });

  socket.on('admin_kick', async ({ targetKey } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'kick');
    if (!isMgr) return;
    const check = canModerateWithImmunity(entry, targetKey);
    if (!check.allowed) {
      socket.emit('error_toast', { message: check.reason });
      return;
    }

    for (const [sid, o] of onlineSockets.entries()) {
      if (o.key === targetKey && o.roomId === entry.roomId) {
        db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'طرد من الغرفة', targetKey, targetName: o.name, details: entry.roomId });
        io.to(sid).emit('kicked', { reason: `تم طردك من الغرفة بواسطة ${entry.name}` });
        const s = io.sockets.sockets.get(sid);
        if (s) s.disconnect(true);
      }
    }
    await db.flushWrites();
  });

  socket.on('admin_ban', async ({ targetKey, reason = 'حظر إداري', banType = 'ban' } = {}) => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || (entry.role !== 'site_owner' && !canDo(entry.role, 'ban'))) return;
    const check = canModerateWithImmunity(entry, targetKey);
    if (!check.allowed) {
      socket.emit('error_toast', { message: check.reason });
      return;
    }

    const { targetName, targetEmail, targetIp, targetDevice } = check.info;
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: banType === 'xban' ? 'إكس باند X-Ban' : 'حظر نهائي', targetKey, targetName, details: reason });
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: enabled ? 'تفعيل شبح' : 'إلغاء شبح', targetKey, targetName: db.getEffectiveName(targetRow) });
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'حذف حساب نهائي', targetKey: `user:${uid}` });
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'تعديل رتبة', targetKey: `user:${userId}`, targetName: db.getEffectiveName(updated), details: rank.label });
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'تغيير اسم عضو', targetKey: `user:${userId}`, targetName: newDisplayName });
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
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'منح عملات', targetKey: `user:${userId}`, targetName: db.getEffectiveName(updated), details: `+${delta}` });
    syncUserAcrossSockets(io, userId);
    await db.flushWrites();
  });

  socket.on('admin_clear_room', async () => {
    const entry = onlineSockets.get(socket.id);
    if (!entry || !entry.roomId) return;
    const isMgr = db.isRoomManager(entry.roomId, entry.userId, entry.role) || canDo(entry.role, 'clear_room');
    if (!isMgr) return;
    db.clearRoomMessages(entry.roomId);
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'مسح رسائل الغرفة', targetKey: entry.roomId });
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
    if (target.sender_key !== entry.key && entry.role !== 'site_owner') {
      const check = canModerateWithImmunity(entry, target.sender_key);
      if (!check.allowed) {
        socket.emit('error_toast', { message: check.reason });
        return;
      }
    }
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

    if (socket._replacedByNewSocket) return;

    const stillHasActiveSocket = [...onlineSockets.values()].some((o) => o.key === key);
    if (stillHasActiveSocket) {
      broadcastRoomUsers(io, oldRoomId);
      broadcastGlobalOnlineUsers(io);
      return;
    }

    if (socket._explicitLogout) {
      releaseUserMicsInRoom(key, oldRoomId);
      pauseQuizBotIfRoomEmpty(oldRoomId);
      recentRoomPresence.delete(key);
      broadcastRoomUsers(io, oldRoomId);
      broadcastGlobalOnlineUsers(io);
      broadcastRoomsList(io);
      io.emit('persistent_members', buildPersistentMembersList());
      return;
    }

    // Transient disconnect grace window: avoid offline flicker and mic/presence churn on quick drops
    recentRoomPresence.set(key, { roomId: oldRoomId, at: Date.now() });
    const prevGrace = pendingGrace.get(key);
    if (prevGrace) clearTimeout(prevGrace.timeout);

    const timeout = setTimeout(() => {
      pendingGrace.delete(key);
      const reconnected = [...onlineSockets.values()].some((o) => o.key === key);
      if (reconnected) return;
      releaseUserMicsInRoom(key, oldRoomId);
      pauseQuizBotIfRoomEmpty(oldRoomId);
      broadcastRoomUsers(io, oldRoomId);
      broadcastGlobalOnlineUsers(io);
      broadcastRoomsList(io);
      io.emit('persistent_members', buildPersistentMembersList());
    }, 18000);

    pendingGrace.set(key, { timeout, lastRoomId: oldRoomId });
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
