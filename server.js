const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Server: SocketIOServer } = require('socket.io');
const db = require('./db');

const rawEnvPort = Number(process.env.PORT);
const nginxEnvPort = Number(process.env.NGINX_PORT || 0);
const PORT =
  Number(process.env.APP_PORT) ||
  (rawEnvPort && rawEnvPort !== nginxEnvPort ? rawEnvPort : Number(process.env.DEFAULT_APP_PORT || 3000));
const TOKEN_SECRET =
  process.env.CHAT_TOKEN_SECRET || 'arabic-chat-super-secret-token-key-2026-v3';

const UPLOAD_ROOT = path.join(__dirname, 'data', 'uploads');
const UPLOAD_SUBDIRS = ['avatars', 'covers', 'images', 'audio', 'wallpapers', 'emojis', 'rank_icons', 'news', 'frames'];
for (const sub of UPLOAD_SUBDIRS) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
}

const SHOP_FRAMES = [
  { id: 'owner_sovereign', label: 'إطار الكسوف الملكي للمالك 👑', price: 0, tier: 'owner', ownerOnly: true, preview: '#fbbf24' },
  { id: 'none', label: 'بدون إطار', price: 0, tier: 'free', preview: '#64748b' },
  { id: 'kings_crown', label: 'إطار الملك الذهبي KINGS', price: 50, tier: 'ruby', preview: '#fbbf24' },
  { id: 'fire_gold', label: 'إطار اللهب الناري المتحرك', price: 40, tier: 'ruby', preview: '#f97316' },
  { id: 'neon_rainbow', label: 'إطار النيون المتغير RGB', price: 35, tier: 'ruby', preview: '#ec4899' },
  { id: 'lightning_bolt', label: 'إطار البرق الأزرق', price: 45, tier: 'ruby', preview: '#38bdf8' },
  { id: 'royal_wings', label: 'إطار الأجنحة الذهبية', price: 55, tier: 'ruby', preview: '#eab308' },
  { id: 'hearts_roses', label: 'إطار القلوب المتطايرة', price: 35, tier: 'ruby', preview: '#f43f5e' },
  { id: 'royal_flowers', label: 'إطار الزهور الملكية', price: 40, tier: 'ruby', preview: '#f472b6' },
  { id: 'diamond_ring', label: 'إطار الألماس اللامع', price: 60, tier: 'ruby', preview: '#38bdf8' },
  { id: 'fire_dragon', label: 'إطار التنين الناري', price: 75, tier: 'ruby', preview: '#ef4444' },
  { id: 'celestial_halo', label: 'إطار الهالة السماوية', price: 80, tier: 'ruby', preview: '#a855f7' },
  { id: 'gold_royal', label: 'الإطار الذهبي الملكي', price: 25, tier: 'ruby', preview: '#f59e0b' },
  { id: 'rgb_cyber_neon', label: 'إطار RGB الدوّار المتوهج', price: 30, tier: 'ruby', preview: '#22d3ee' },
  { id: 'emerald_crown', label: 'إطار الزمرد الملكي', price: 30, tier: 'ruby', preview: '#10b981' },
  { id: 'plasma_violet', label: 'إطار البلازما البنفسجي', price: 30, tier: 'ruby', preview: '#a855f7' }
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
  { id: 'gold_crown', label: 'تاج ذهبي ملكي مرصّع', iconClass: 'fa-solid fa-crown' },
  { id: 'crown_royal', label: 'تاج السيادة الملكي', iconClass: 'fa-solid fa-crown' },
  { id: 'ruby_crown', label: 'تاج الياقوت الأحمر', iconClass: 'fa-solid fa-crown' },
  { id: 'silver_crown', label: 'تاج فضي لامع', iconClass: 'fa-solid fa-crown' },
  { id: 'royal_trophy', label: 'كأس البطولة الذهبي', iconClass: 'fa-solid fa-trophy' },
  { id: 'diamond_trophy', label: 'كأس الماس الملكي', iconClass: 'fa-solid fa-trophy' },
  { id: 'emerald_trophy', label: 'كأس الزمرد المتلألئ', iconClass: 'fa-solid fa-trophy' },
  { id: 'gold_star', label: 'نجمة ذهبية متلألئة', iconClass: 'fa-solid fa-star' },
  { id: 'sapphire_star', label: 'نجمة الياقوت الزرقاء', iconClass: 'fa-solid fa-star' },
  { id: 'royal_shield', label: 'درع ذهبي ملكي', iconClass: 'fa-solid fa-shield-halved' },
  { id: 'silver_shield', label: 'درع الحماية الفضي', iconClass: 'fa-solid fa-shield' },
  { id: 'diamond_gem', label: 'ماسة براقة', iconClass: 'fa-solid fa-gem' },
  { id: 'vip_wings', label: 'أجنحة VIP ملكية', iconClass: 'fa-solid fa-feather-pointed' },
  { id: 'silver_wing', label: 'جناح فضي لامع', iconClass: 'fa-solid fa-dove' },
  { id: 'gold_eagle', label: 'نسر ذهبي مجنح', iconClass: 'fa-solid fa-feather-pointed' },
  { id: 'neon_badge', label: 'شارة نيون حديثة', iconClass: 'fa-solid fa-certificate' },
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
  'Lemonada',
  'Cairo',
  'Amiri',
  'Aref Ruqaa',
  'Reem Kufi',
  'Tajawal',
  'Lalezar',
  'Changa',
  'Marhey',
  'Rakkas',
  'Almarai'
]);

const ALLOWED_FONT_STYLES = new Set(['Normal', 'Bold', 'Italic', 'BoldItalic']);

function normalizeProfileFont(raw) {
  const clean = String(raw || '').trim();
  if (!clean || clean.toLowerCase() === 'normal') return 'Cairo';
  for (const f of ALLOWED_PROFILE_FONTS) {
    if (f.toLowerCase() === clean.toLowerCase()) return f;
  }
  return 'Cairo';
}

function normalizeFontStyle(raw) {
  const clean = String(raw || '').trim();
  for (const s of ALLOWED_FONT_STYLES) {
    if (s.toLowerCase() === clean.toLowerCase()) return s;
  }
  return 'Normal';
}

function parseHexColorRgb(hex) {
  const clean = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  return null;
}

function getRelativeLuminance(hex) {
  const rgb = parseHexColorRgb(hex);
  if (!rgb) return 1;
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function isReadableDarkBgColor(hex) {
  if (!hex || typeof hex !== 'string') return true;
  if (!parseHexColorRgb(hex)) return true;
  return getRelativeLuminance(hex) >= 0.02;
}

function ensureDarkReadableColor(hex, fallback = '#0f172a') {
  if (!hex || !parseHexColorRgb(hex)) return fallback;
  return hex;
}

function validateHttpsOrLocalUrl(rawUrl, { allowDataImage = false, allowPreset = false } = {}) {
  const s = String(rawUrl || '').trim();
  if (!s) return { ok: true, value: '' };
  if (/[\x00-\x1f<>"'`]/.test(s)) {
    return { ok: false, error: 'الرابط يحتوي على أحرف غير صالحة.' };
  }
  if (allowPreset && /^preset:[a-z0-9_-]{1,40}$/i.test(s)) {
    return { ok: true, value: s };
  }
  if (allowDataImage && /^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(s)) {
    return { ok: true, value: s };
  }
  if (/^\/(?:uploads|assets|api\/profile-media)\/[A-Za-z0-9._\-\/]+$/i.test(s)) {
    return { ok: true, value: s };
  }
  if (/^https:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      if (parsed.protocol === 'https:') {
        return { ok: true, value: s.slice(0, 500) };
      }
    } catch {
      return { ok: false, error: 'رابط HTTPS غير صالح.' };
    }
  }
  return { ok: false, error: 'يُسمح فقط بروابط HTTPS الآمنة أو الملفات المرفوعة.' };
}

const rateLimitBuckets = new Map();
function checkRateLimit(bucketKey, maxHits = 20, windowMs = 120000) {
  const now = Date.now();
  if (rateLimitBuckets.size > 3000) {
    for (const [k, arr] of rateLimitBuckets.entries()) {
      const fresh = arr.filter((t) => now - t <= windowMs);
      if (!fresh.length) rateLimitBuckets.delete(k);
      else rateLimitBuckets.set(k, fresh);
    }
  }
  const prev = (rateLimitBuckets.get(bucketKey) || []).filter((t) => now - t <= windowMs);
  if (prev.length >= maxHits) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - prev[0])) / 1000));
    rateLimitBuckets.set(bucketKey, prev);
    return { allowed: false, retryAfterSec };
  }
  prev.push(now);
  rateLimitBuckets.set(bucketKey, prev);
  return { allowed: true, retryAfterSec: 0 };
}

function textContainsMemberName(text, memberName) {
  const cleanMarks = (val) =>
    String(val || '')
      .replace(/[\u200e\u200f\u200b\u200c\u200d]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const rawText = cleanMarks(text).toLowerCase();
  const rawName = cleanMarks(memberName).replace(/^@+/, '').trim().toLowerCase();
  if (!rawText || !rawName) return false;
  const escapedRaw = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rawRe = new RegExp(`(?:^|[\\s،,.!?؟؛@:\\-\\(\\)\\[\\]\\"'/])${escapedRaw}(?:$|[\\s،,.!?؟؛:\\-\\(\\)\\[\\]\\"'/])`, 'i');
  if (rawRe.test(rawText)) return true;

  const normText = normalizeArabicText(rawText);
  const normName = normalizeArabicText(rawName);
  if (!normText || !normName) return false;
  const escapedNorm = normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normRe = new RegExp(`(?:^|[\\s،,.!?؟؛@:\\-\\(\\)\\[\\]\\"'/])${escapedNorm}(?:$|[\\s،,.!?؟؛:\\-\\(\\)\\[\\]\\"'/])`, 'i');
  return normRe.test(normText);
}

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '6mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public')));

// Global async safety wrapper for all Express routes so rejected promises never cause unhandledRejection
for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
  const origMethod = app[method].bind(app);
  app[method] = (pathArg, ...handlers) => {
    if (method === 'get' && handlers.length === 0) return origMethod(pathArg);
    const wrapped = handlers.map((fn) => {
      if (typeof fn !== 'function' || fn.length === 4) return fn;
      return function safeExpressHandler(req, res, next) {
        try {
          const maybePromise = fn.call(this, req, res, next);
          if (maybePromise && typeof maybePromise.catch === 'function') {
            return maybePromise.catch(next);
          }
          return maybePromise;
        } catch (err) {
          return next(err);
        }
      };
    });
    return origMethod(pathArg, ...wrapped);
  };
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, storage: db.getStorageStatus() });
});
app.get('/health', (_req, res) => {
  res.json({ ok: true, storage: db.getStorageStatus() });
});
app.get('/api/health', (_req, res) => {
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

function getClientCountry(reqOrSocket) {
  const headers = reqOrSocket.headers || reqOrSocket.handshake?.headers || {};
  const raw =
    headers['cf-ipcountry'] ||
    headers['x-appengine-country'] ||
    headers['x-country-code'] ||
    headers['x-vercel-ip-country'] ||
    '';
  const code = String(raw || '').trim().toUpperCase().slice(0, 8);
  if (!code || code === 'XX' || code === 'T1') return '';
  return code;
}

function getClientTelemetry(reqOrSocket) {
  const headers = reqOrSocket.headers || reqOrSocket.handshake?.headers || {};
  const ip = getClientIp(reqOrSocket);
  const country = getClientCountry(reqOrSocket);
  const userAgent = String(headers['user-agent'] || '').trim().slice(0, 200);
  const deviceId = String(
    headers['x-device-id'] ||
      reqOrSocket.body?.deviceId ||
      reqOrSocket.handshake?.auth?.deviceId ||
      ''
  )
    .trim()
    .slice(0, 128);
  const fingerprint = String(
    headers['x-client-fingerprint'] ||
      reqOrSocket.body?.fingerprint ||
      reqOrSocket.handshake?.auth?.fingerprint ||
      ''
  )
    .trim()
    .slice(0, 128);
  return { ip, deviceId, fingerprint, userAgent, country };
}

// ==========================================
// TOKEN SIGNING & PERSISTENT SESSION HELPERS
// ==========================================
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function signToken(payloadObj) {
  const now = Date.now();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ ...payloadObj, iat: now, exp: payloadObj.exp || now + SESSION_TTL_MS })
  ).toString('base64url');
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
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed && parsed.exp && Number(parsed.exp) <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function issuePersistentSessionToken({ user = null, isGuest = false, guestKey = '', guestName = '', telemetry = {} } = {}) {
  const sid = crypto.randomBytes(16).toString('hex');
  if (isGuest) {
    db.createUserSession({
      sessionId: sid,
      userId: null,
      userKey: guestKey,
      email: '',
      role: 'guest',
      isGuest: true,
      name: guestName || 'زائر',
      deviceId: telemetry.deviceId || '',
      fingerprint: telemetry.fingerprint || '',
      ipAddress: telemetry.ip || '',
      userAgent: telemetry.userAgent || '',
      ttlMs: SESSION_TTL_MS
    });
    return signToken({ sid, key: guestKey, name: guestName || 'زائر', isGuest: true });
  }
  const uid = Number(user?.userId || user?.id);
  db.createUserSession({
    sessionId: sid,
    userId: uid,
    userKey: `user:${uid}`,
    email: user?.email || '',
    role: user?.role || 'member',
    isGuest: false,
    name: user?.name || user?.username || '',
    deviceId: telemetry.deviceId || '',
    fingerprint: telemetry.fingerprint || '',
    ipAddress: telemetry.ip || '',
    userAgent: telemetry.userAgent || '',
    ttlMs: SESSION_TTL_MS
  });
  return signToken({ sid, userId: uid, isGuest: false });
}

function validateAndTouchSession(payload, { role = '', telemetry = {}, userRow = null } = {}) {
  if (!payload) return false;
  if (!payload.sid) return true; // Backward compatibility for pre-existing valid HMAC tokens
  const existing = db.getUserSession(payload.sid);
  if (existing) {
    if (existing.revoked) return false;
    if (existing.expires_at && existing.expires_at <= Date.now()) return false;
    db.touchUserSession(payload.sid, {
      role: role || existing.role,
      ipAddress: telemetry.ip || '',
      deviceId: telemetry.deviceId || '',
      fingerprint: telemetry.fingerprint || '',
      ttlMs: SESSION_TTL_MS
    });
    return true;
  }
  // If HMAC token is valid and user exists, ensure session record is recovered in Firebase
  db.createUserSession({
    sessionId: payload.sid,
    userId: payload.isGuest ? null : Number(payload.userId),
    userKey: payload.isGuest ? payload.key : `user:${payload.userId}`,
    email: userRow?.email || '',
    role: role || userRow?.role || (payload.isGuest ? 'guest' : 'member'),
    isGuest: Boolean(payload.isGuest),
    name: payload.name || userRow?.username || '',
    deviceId: telemetry.deviceId || '',
    fingerprint: telemetry.fingerprint || '',
    ipAddress: telemetry.ip || '',
    userAgent: telemetry.userAgent || '',
    ttlMs: SESSION_TTL_MS
  });
  return true;
}

function canDo(role, permName) {
  return db.hasPermission(role, permName);
}

const rubyFracCarryByUser = new Map();

function canPassSettingThreshold(userOrEntry, settingKey, fallbackRankKey = 'member') {
  if (!userOrEntry) return false;
  if (userOrEntry.role === 'site_owner' || db.isSupremeOwnerEmail(userOrEntry.email)) return true;
  const settings = db.getSiteSettings();
  const minKey = String(settings[settingKey] || fallbackRankKey || 'member');
  if (minKey === 'disabled' || minKey === 'owner_only') return false;
  if (minKey === 'guest') return true;
  if (userOrEntry.isGuest || userOrEntry.role === 'guest') return false;
  const userPower = db.getRankPower(userOrEntry.role);
  const reqPower = db.getRankPower(minKey);
  return userPower >= reqPower;
}

function canUserUploadAnimatedGif(userOrEntry) {
  if (!userOrEntry) return false;
  if (userOrEntry.role === 'site_owner' || db.isSupremeOwnerEmail(userOrEntry.email)) return true;
  if (userOrEntry.isGuest || userOrEntry.role === 'guest') return false;
  const ranks = db.getAllRanks();
  const topNonOwnerRanks = ranks
    .filter((r) => r && r.key !== 'site_owner' && r.key !== 'guest')
    .sort((a, b) => Number(b.power || 0) - Number(a.power || 0))
    .slice(0, 2);
  if (topNonOwnerRanks.some((r) => r.key === userOrEntry.role)) return true;
  const minTopPower = topNonOwnerRanks.length >= 2
    ? Number(topNonOwnerRanks[1].power || 13)
    : 13;
  return db.getRankPower(userOrEntry.role) >= minTopPower;
}

async function isUploadedGifFile(file) {
  if (!file) return false;
  if (String(file.mimetype || '').toLowerCase() === 'image/gif') return true;
  if (/\.gif$/i.test(file.originalname || '') || /\.gif$/i.test(file.filename || '')) return true;
  if (!file.path) return false;
  try {
    const fd = await fs.promises.open(file.path, 'r');
    try {
      const header = Buffer.alloc(6);
      const { bytesRead } = await fd.read(header, 0, 6, 0);
      if (bytesRead === 6) {
        const sig = header.toString('ascii');
        if (sig === 'GIF87a' || sig === 'GIF89a') return true;
      }
    } finally {
      await fd.close();
    }
  } catch {
    // ignore read error
  }
  return false;
}

function computeRubyGainWithMultiplier(userId, role, baseRuby = 1) {
  const mult = db.getRubyMultiplierForRole(role);
  const prevCarry = rubyFracCarryByUser.get(userId) || 0;
  const exact = baseRuby * mult + prevCarry;
  const whole = Math.floor(exact + 1e-6);
  rubyFracCarryByUser.set(userId, Math.max(0, exact - whole));
  return Math.max(0, whole);
}

function getEffectiveFramesCatalog() {
  const overrides = db.getSiteSettings().frame_price_overrides || {};
  const builtIn = SHOP_FRAMES.map((f) => {
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, f.id);
    const price = f.id === 'none' || f.ownerOnly ? f.price : hasOverride ? Math.max(0, Number(overrides[f.id]) || 0) : f.price;
    return {
      ...f,
      price,
      durationType: 'permanent',
      isCustom: false,
      imageUrl: ''
    };
  });
  const custom = db.getAllCustomFrames().map((cf) => ({
    ...cf,
    isCustom: true,
    tier: 'ruby',
    preview: '#38bdf8'
  }));
  return [...builtIn, ...custom];
}

function getPurchasableRanksCatalog() {
  const s = db.getSiteSettings();
  const royalMemRank = db.getRankByKey('royal_member');
  const vipRank = db.getRankByKey('royal_vip');
  const premRank = db.getRankByKey('premium');
  const royalMemMult = Number(s.royal_member_ruby_multiplier || 1.2);
  const vipMult = Number(s.vip_ruby_multiplier || 1.5);
  const premMult = Number(s.premium_ruby_multiplier || 2);
  return [
    {
      key: 'royal_member',
      label: royalMemRank?.label || 'عضو ملكي',
      icon: royalMemRank?.icon || '💠',
      color: royalMemRank?.bg_color || '#6366f1',
      power: Number(royalMemRank?.power || 6),
      price: Math.max(0, Number(s.rank_price_royal_member ?? 300)),
      multiplier: royalMemMult,
      rubyMultiplier: royalMemMult,
      benefits: `مضاعف ربح الروبي ×${royalMemMult} + إطار تاج الملوك هدية`,
      perks: [
        `مضاعف ربح الروبي ×${royalMemMult}`,
        'إطار تاج الملوك هدية فورية مع الترقية',
        'شارة عضو ملكي المميزة في قائمة الأعضاء والغرف'
      ]
    },
    {
      key: 'royal_vip',
      label: vipRank?.label || 'VIP',
      icon: vipRank?.icon || '🏆',
      color: vipRank?.bg_color || '#eab308',
      power: Number(vipRank?.power || 7),
      price: Math.max(0, Number(s.rank_price_royal_vip ?? 800)),
      multiplier: vipMult,
      rubyMultiplier: vipMult,
      benefits: `مضاعف ربح الروبي ×${vipMult} + بطاقة دخول سينمائية + أجنحة ملكية`,
      perks: [
        `مضاعف ربح الروبي ×${vipMult}`,
        'بطاقة دخول سينمائية فاخرة عند دخول الغرف',
        'إطار الأجنحة الذهبية الملكية هدية فورية'
      ]
    },
    {
      key: 'premium',
      label: premRank?.label || 'بريميوم',
      icon: premRank?.icon || '💎',
      color: premRank?.bg_color || '#7c3aed',
      power: Number(premRank?.power || 8),
      price: Math.max(0, Number(s.rank_price_premium ?? 1500)),
      multiplier: premMult,
      rubyMultiplier: premMult,
      benefits: `مضاعف ربح الروبي ×${premMult} + حصانة ووسائل خاصة متقدمة + إطار الألماس`,
      perks: [
        `مضاعف ربح الروبي ×${premMult}`,
        'إطار الألماس اللامع هدية مع الترقية',
        'مزايا وصلاحيات بريميوم الفاخرة داخل الغرف'
      ]
    }
  ];
}

function isUserStealth(userOrEntry) {
  if (!userOrEntry) return false;
  const role = userOrEntry.role;
  const email = userOrEntry.email || '';
  if (role !== 'site_owner' && !db.isSupremeOwnerEmail(email) && !canDo(role, 'stealth')) return false;
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
  const { ownedFrames, ownedFramesMeta, activeFrame } = db.getValidOwnedFramesData(u);
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
    level: Number(rank?.power || 2),
    nameColor: u.name_bg_color ? u.name_color || '#0f172a' : ensureDarkReadableColor(u.name_color, '#0f172a'),
    textColor: ensureDarkReadableColor(u.text_color, '#0f172a'),
    nameBgColor: u.name_bg_color || '',
    neonColor: u.neon_color || '',
    fontFamily: normalizeProfileFont(u.font_family),
    fontStyle: normalizeFontStyle(u.font_style),
    nameFontStyle: normalizeFontStyle(u.name_font_style || u.font_style),
    fontSize: Math.max(13, Math.min(17, Number(u.font_size) || 14)),
    nameFontSize: Math.max(13, Math.min(18, Number(u.name_font_size) || 14)),
    nameStyleMode: ['solid', 'gradient', 'glow'].includes(String(u.name_style_mode)) ? String(u.name_style_mode) : 'solid',
    nameGradient: u.name_gradient || 'gold_royal',
    avatarUrl: u.avatar_url || '',
    coverUrl: u.cover_url || '',
    avatarFrame: activeFrame || 'none',
    ownedFrames,
    ownedFramesMeta,
    nameplateStyle: u.nameplate_style || 'default',
    nameShine: u.name_shine || 'none',
    nameAnim: normalizeNameAnim(u.name_anim),
    nameAnimSpeed: normalizeNameAnimSpeed(u.name_anim_speed),
    profileBgEffect: u.profile_bg_effect || 'none',
    vipWings: Boolean(u.vip_wings),
    profileMusic: u.profile_music || '',
    bio: u.bio || '',
    statusText: u.status_text || '',
    age: u.age || '',
    gender: u.gender || '',
    country: u.country || '',
    allowCalls: u.allow_calls !== 0,
    allowPm: u.allow_pm !== 0,
    visitorsCount: Number(u.visitors_count) || 0,
    likesCount: Number(u.likes_count) || 0,
    ratingSum,
    ratingCount,
    ratingAvg,
    coins: Number(u.coins) || 0,
    ruby: Number(u.coins) || 0,
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
    giftsSent: Number(u.gifts_sent) || 0,
    customFields: u.custom_fields && typeof u.custom_fields === 'object' ? u.custom_fields : {}
  };
}

function mapGuestRow(g, fallbackKey = '', fallbackName = 'زائر') {
  const key = g?.key || fallbackKey;
  const name = g?.name || fallbackName || 'زائر';
  const guestRank = db.getRankByKey('guest');
  return {
    key,
    userId: null,
    isGuest: true,
    name,
    displayName: g?.display_name || name,
    username: g?.username || name,
    role: 'guest',
    rank: guestRank,
    level: Number(guestRank?.power || 1),
    nameColor: ensureDarkReadableColor(g?.name_color, '#0f172a'),
    textColor: ensureDarkReadableColor(g?.text_color, '#0f172a'),
    nameBgColor: g?.name_bg_color || '',
    neonColor: g?.neon_color || '',
    fontFamily: normalizeProfileFont(g?.font_family),
    fontStyle: normalizeFontStyle(g?.font_style),
    nameFontStyle: normalizeFontStyle(g?.name_font_style || g?.font_style),
    fontSize: Math.max(13, Math.min(17, Number(g?.font_size) || 14)),
    nameFontSize: Math.max(13, Math.min(18, Number(g?.name_font_size) || 14)),
    nameStyleMode: ['solid', 'gradient', 'glow'].includes(String(g?.name_style_mode)) ? String(g.name_style_mode) : 'solid',
    nameGradient: g?.name_gradient || 'gold_royal',
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
    country: g?.country || '',
    coins: 0,
    vipFamily: '',
    isStealth: false,
    visitorsCount: 0,
    likesCount: 0,
    activityPoints: 0,
    giftsReceived: 0,
    giftsSent: 0
  };
}

function resolveAuthUserFromToken(token, telemetry = {}, outMeta = null) {
  const cleanToken = String(token || '').trim();
  const payload = verifyToken(cleanToken);
  if (!payload) return null;

  const { ip, deviceId, fingerprint } = telemetry;

  if (payload.isGuest) {
    const ban = db.isTargetBanned({ targetKey: payload.key, ipAddress: ip, deviceId, fingerprint });
    if (ban) {
      return { banned: true };
    }
    if (!validateAndTouchSession(payload, { role: 'guest', telemetry })) return null;
    const saved = db.findGuestByKey(payload.key);
    const guestObj = saved || db.upsertGuest({ key: payload.key, name: payload.name || 'زائر' });
    if (outMeta) {
      outMeta.payload = payload;
      outMeta.rawToken = cleanToken;
    }
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
    if (!db.isSupremeOwnerEmail(freshRow.email) && freshRow.role !== 'site_owner') {
      const ban = db.isTargetBanned({
        targetKey: `user:${freshRow.id}`,
        email: freshRow.email,
        ipAddress: ip,
        deviceId,
        fingerprint
      });
      if (ban || freshRow.isBanned === true || freshRow.is_banned === 1) {
        return { banned: true };
      }
    }
    if (!validateAndTouchSession(payload, { role: freshRow.role, telemetry, userRow: freshRow })) {
      return null;
    }
    if (outMeta) {
      outMeta.payload = payload;
      outMeta.rawToken = cleanToken;
    }
    return mapUserRow(freshRow);
  }
  return null;
}

function resolveAuthFromRequest(req, tokenOverride = '') {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const token = String(tokenOverride || bearer || '').trim();
  const telemetry = getClientTelemetry(req);
  const meta = {};
  const user = resolveAuthUserFromToken(token, telemetry, meta);
  if (user && !user.banned && meta.payload) {
    req._authTokenPayload = meta.payload;
    req._authRawToken = meta.rawToken;
  }
  return user;
}

function requireAuth(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u) return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً.' });
  if (u.banned) {
    return res.status(403).json({
      error: 'تم حظرك من الشات',
      banned: true
    });
  }
  req.authUser = u;
  return next();
}

function requireRegistered(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u) return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً.' });
  if (u.banned) {
    return res.status(403).json({
      error: 'تم حظرك من الشات',
      banned: true
    });
  }
  if (u.isGuest) return res.status(401).json({ error: 'هذه الميزة متاحة للأعضاء المسجلين فقط.' });
  req.authUser = u;
  return next();
}

function requirePanelAccess(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest || u.banned) return res.status(403).json({ error: 'صلاحية الإدارة مطلوبة.' });
  if (u.role !== 'site_owner' && !canDo(u.role, 'access_panel')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية دخول لوحة التحكم.' });
  }
  req.authUser = u;
  return next();
}

function requirePanelAccessForScript(req, res, next) {
  const qToken = typeof req.query?.token === 'string' ? req.query.token.trim() : '';
  const u = resolveAuthFromRequest(req, qToken);
  if (!u || u.isGuest || u.banned || (u.role !== 'site_owner' && !canDo(u.role, 'access_panel'))) {
    return res.status(403).type('application/javascript; charset=utf-8').send('/* 403 Forbidden: Admin Access Required */\n');
  }
  req.authUser = u;
  return next();
}

app.get('/admin', (_req, res) => {
  return res.sendFile(path.join(__dirname, 'private_admin', 'admin.html'));
});

app.get('/admin-panel.js', requirePanelAccessForScript, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, private');
  return res.sendFile(path.join(__dirname, 'private_admin', 'admin-panel.js'));
});

function requireOwner(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest || u.role !== 'site_owner') {
    return res.status(403).json({ error: 'هذه الصلاحية مخصصة لصاحب الموقع فقط.' });
  }
  req.authUser = u;
  return next();
}

function requireBankAccess(req, res, next) {
  const u = resolveAuthFromRequest(req);
  if (!u || u.isGuest || (u.role !== 'site_owner' && u.role !== 'co_owner' && db.getRankPower(u.role) < 14)) {
    return res.status(403).json({ error: 'بنك المالك مخصص لرتبتي المالك وصاحب الموقع فقط.' });
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
      const ext = mime === 'image/gif' || mime === 'image/webp' || mime === 'image/svg+xml'
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
const uploadFrame = makeUploader('frames', 'image/', 12 * 1024 * 1024);
const uploadProfileMusic = makeUploader('music', 'audio/', 2 * 1024 * 1024);

// ==========================================
// REAL-TIME PRESENCE, SOCKET.IO & ROOM STATE MAPS
// ==========================================
let io = null;
const userSocketsMap = new Map(); // userKey -> Set<Socket>
const socketGraceTimers = new Map(); // userKey -> timeout
const onlinePresenceMap = new Map(); // userKey -> presence entry
function emitToUserKey(targetKey, event, payload) {
  if (!io || !targetKey || !event) return;
  const set = userSocketsMap.get(String(targetKey));
  if (!set || !set.size) return;
  for (const sock of set) {
    try {
      sock.emit(event, payload);
    } catch {
      // ignore closed socket
    }
  }
}
const recentDeletedMsgLog = new Map(); // msgId -> deletedAtMs
const recentUpdatedMsgLog = new Map(); // msgId -> updatedAtMs
function recordDeletedMessage(msgId) {
  const id = String(msgId || '').trim();
  if (!id) return;
  const now = Date.now();
  recentDeletedMsgLog.set(id, now);
  for (const [k, ts] of recentDeletedMsgLog.entries()) {
    if (now - ts > 65000) recentDeletedMsgLog.delete(k);
  }
}
function recordUpdatedMessage(msgId) {
  const id = String(msgId || '').trim();
  if (!id) return;
  const now = Date.now();
  recentUpdatedMsgLog.set(id, now);
  for (const [k, ts] of recentUpdatedMsgLog.entries()) {
    if (now - ts > 65000) recentUpdatedMsgLog.delete(k);
  }
}
const roomMics = new Map(); // roomId -> [slot1..slot5]
const pendingGrace = new Map(); // key -> { timeout, lastRoomId }
const recentRoomPresence = new Map(); // key -> { roomId, at }
const roomActivitySpam = new Map(); // key -> { count, resetAt }
const floodTimestampsByKey = new Map(); // key -> [timestamps]
const lastMessageRewardByUser = new Map(); // userId/key -> { text, at }
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

function escapeRegexChars(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildArabicFlexibleRegex(word) {
  const chars = Array.from(String(word || '').trim());
  if (!chars.length) return null;
  const pattern = chars
    .map((ch) => {
      if ('أإآا'.includes(ch)) return '[أإآا][\\u064B-\\u065F]*';
      if ('ةه'.includes(ch)) return '[ةه][\\u064B-\\u065F]*';
      if ('ىي'.includes(ch)) return '[ىي][\\u064B-\\u065F]*';
      return `${escapeRegexChars(ch)}[\\u064B-\\u065F]*`;
    })
    .join('');
  try {
    return new RegExp(pattern, 'gi');
  } catch {
    return null;
  }
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

function maskBannedWords(text) {
  const words = db.getSiteSettings().banned_words || [];
  const raw = String(text || '');
  if (!words.length || !raw) return { maskedText: raw, matchedWord: null };
  let masked = raw;
  let matchedWord = null;
  for (const w of words) {
    const rawW = String(w || '').trim();
    if (!rawW) continue;
    const flexRe = buildArabicFlexibleRegex(rawW);
    if (flexRe && flexRe.test(masked)) {
      if (!matchedWord) matchedWord = rawW;
      masked = masked.replace(flexRe, '***');
    } else if (normalizeArabicText(masked).includes(normalizeArabicText(rawW))) {
      if (!matchedWord) matchedWord = rawW;
      const litRe = new RegExp(escapeRegexChars(rawW), 'gi');
      masked = litRe.test(masked) ? masked.replace(litRe, '***') : '***';
    }
  }
  return { maskedText: masked, matchedWord };
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
        isSpeaking: false,
        speakingLevel: 0
      }))
    );
  }
  return roomMics.get(roomId);
}

function getPublicMicSlots(roomId) {
  return ensureRoomMicSlots(roomId).map((s) => ({ ...s }));
}

function syncRoomMicsToFirestore(roomId) {
  if (!roomId) return;
  const slots = getPublicMicSlots(roomId);
  db.syncRoomMicsDoc(roomId, slots);
  if (io) {
    io.to(roomId).emit('room_mics', { roomId, slots });
  }
}

function isStealthEntry(entry) {
  return Boolean(
    entry &&
      entry.isStealth &&
      (entry.role === 'site_owner' || db.isSupremeOwnerEmail(entry.email) || canDo(entry.role, 'stealth'))
  );
}

function computeRoomKingKey(roomId) {
  let topKey = null;
  let topPoints = 0;
  for (const entry of onlinePresenceMap.values()) {
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
  for (const entry of onlinePresenceMap.values()) {
    if (entry.roomId === roomId && !isStealthEntry(entry)) {
      const rankObj = db.getRankByKey(entry.role);
      byKey.set(entry.key, {
        key: entry.key,
        userId: entry.userId,
        isGuest: entry.isGuest,
        name: entry.name,
        displayName: entry.displayName,
        username: entry.username,
        role: entry.role,
        rank: rankObj,
        level: Number(rankObj?.power || (entry.isGuest ? 1 : 2)),
        nameColor: entry.nameColor,
        textColor: entry.textColor,
        nameBgColor: entry.nameBgColor,
        neonColor: entry.neonColor,
        fontFamily: normalizeProfileFont(entry.fontFamily),
        fontStyle: entry.fontStyle,
        fontSize: Math.max(13, Math.min(17, Number(entry.fontSize) || 14)),
        nameFontSize: Math.max(13, Math.min(18, Number(entry.nameFontSize) || 14)),
        nameStyleMode: entry.nameStyleMode || 'solid',
        nameGradient: entry.nameGradient || 'gold_royal',
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
        statusText: entry.statusText || '',
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
  const virtualUsers = getActiveVirtualMembersForRooms();
  for (const vu of virtualUsers) {
    if (vu.roomId === roomId) byKey.set(vu.key, vu);
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
  for (const entry of onlinePresenceMap.values()) {
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
      statusText: entry.statusText || '',
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
  const virtualUsers = getActiveVirtualMembersForRooms();
  for (const vu of virtualUsers) {
    byKey.set(vu.key, vu);
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
  for (const entry of onlinePresenceMap.values()) {
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
      statusText: u.status_text || '',
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
      level: Number(db.getRankPower(u.role) || 2),
      nameColor: u.name_bg_color ? u.name_color || '#0f172a' : ensureDarkReadableColor(u.name_color, '#0f172a'),
      nameBgColor: u.name_bg_color || '',
      neonColor: u.neon_color || '',
      fontFamily: normalizeProfileFont(u.font_family),
      fontStyle: normalizeFontStyle(u.font_style),
      nameFontStyle: normalizeFontStyle(u.name_font_style || u.font_style),
      nameFontSize: Math.max(13, Math.min(18, Number(u.name_font_size) || 14)),
      nameStyleMode: ['solid', 'gradient', 'glow'].includes(String(u.name_style_mode)) ? String(u.name_style_mode) : 'solid',
      nameGradient: u.name_gradient || 'gold_royal',
      vipFamily: u.vip_family || '',
      coins: Number(u.coins) || 0,
      activityPoints: Number(u.activity_points) || 0,
      giftsReceived: Number(u.gifts_received) || 0,
      roomId: live?.roomId || null,
      online: !isStealth && Boolean(live)
    };
  });

  return [...registered]
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
  const virtualUsers = getActiveVirtualMembersForRooms();
  return db.getAllRooms().map((r) => {
    const pub = db.sanitizeRoomForPublic(r);
    const activeKeys = new Set();
    for (const e of onlinePresenceMap.values()) {
      if (e.roomId === r.id && !isStealthEntry(e)) activeKeys.add(e.key);
    }
    for (const vu of virtualUsers) {
      if (vu.roomId === r.id) activeKeys.add(vu.key);
    }
    return {
      ...pub,
      realOnlineCount: activeKeys.size,
      onlineCount: activeKeys.size + boost
    };
  });
}

function buildPublicPresenceDoc(entry) {
  if (!entry) return null;
  const rm = entry.roomId ? db.getRoomById(entry.roomId) : null;
  const rankObj = db.getRankByKey(entry.role);
  return {
    key: entry.key,
    userId: entry.userId || null,
    firebaseUid: entry.firebaseUid || '',
    isGuest: Boolean(entry.isGuest),
    isVirtual: Boolean(entry.isVirtual),
    name: entry.name,
    displayName: entry.displayName || entry.name,
    username: entry.username || entry.name,
    role: entry.role || (entry.isGuest ? 'guest' : 'member'),
    rank: rankObj,
    level: Number(rankObj?.power || (entry.isGuest ? 1 : 2)),
    nameColor: entry.nameColor || '#0f172a',
    textColor: entry.textColor || '#0f172a',
    nameBgColor: entry.nameBgColor || '',
    neonColor: entry.neonColor || '',
    fontFamily: normalizeProfileFont(entry.fontFamily),
    fontStyle: normalizeFontStyle(entry.fontStyle),
    nameFontStyle: normalizeFontStyle(entry.nameFontStyle || entry.fontStyle),
    fontSize: Math.max(13, Math.min(17, Number(entry.fontSize) || 14)),
    nameFontSize: Math.max(13, Math.min(18, Number(entry.nameFontSize) || 14)),
    nameStyleMode: entry.nameStyleMode || 'solid',
    nameGradient: entry.nameGradient || 'gold_royal',
    avatarUrl: entry.avatarUrl || '',
    coverUrl: entry.coverUrl || '',
    avatarFrame: entry.avatarFrame || 'none',
    nameplateStyle: entry.nameplateStyle || 'default',
    nameShine: entry.nameShine || 'none',
    nameAnim: entry.nameAnim || 'none',
    nameAnimSpeed: entry.nameAnimSpeed || 'normal',
    profileBgEffect: entry.profileBgEffect || 'none',
    vipWings: Boolean(entry.vipWings),
    profileMusic: entry.profileMusic || '',
    bio: entry.bio || '',
    statusText: entry.statusText || '',
    age: entry.age || '',
    gender: entry.gender || '',
    country: entry.country || '',
    allowCalls: entry.allowCalls !== false,
    allowPm: entry.allowPm !== false,
    likesCount: Number(entry.likesCount) || 0,
    ratingAvg: Number(entry.ratingAvg) || 5.0,
    ratingCount: Number(entry.ratingCount) || 0,
    isStealth: isStealthEntry(entry),
    isGhosted: Boolean(entry.isGhosted),
    isShadowMuted: Boolean(entry.isShadowMuted || guestShadowMutedKeys.has(entry.key)),
    isFrozen: Boolean(entry.isFrozen || guestFrozenKeys.has(entry.key)),
    coins: Number(entry.coins) || 0,
    vipFamily: entry.vipFamily || '',
    activityPoints: Number(entry.activityPoints) || 0,
    giftsReceived: Number(entry.giftsReceived) || 0,
    giftsSent: Number(entry.giftsSent) || 0,
    roomId: entry.roomId || null,
    roomName: rm ? rm.name : '',
    typingInRoom: entry.typingInRoom || '',
    typingAt: Number(entry.typingAt) || 0,
    lastSeenMs: Number(entry.lastSeenMs) || Date.now()
  };
}

function upsertOnlinePresence(authUser, telemetry = {}, roomId = null, extra = {}) {
  if (!authUser || !authUser.key) return null;
  const existing = onlinePresenceMap.get(authUser.key) || {};
  const nextRoomId = roomId !== undefined && roomId !== null ? roomId : (existing.roomId || 'general');
  const resolvedFuid = String(
    extra.firebaseUid ||
    authUser.firebaseUid ||
    existing.firebaseUid ||
    (authUser.userId ? db.findUserById(authUser.userId)?.firebase_uid || '' : '')
  ).trim();
  const entry = {
    ...existing,
    ...authUser,
    firebaseUid: resolvedFuid,
    roomId: nextRoomId,
    ipAddress: telemetry.ip || existing.ipAddress || '',
    deviceId: telemetry.deviceId || existing.deviceId || '',
    fingerprint: telemetry.fingerprint || existing.fingerprint || '',
    userAgent: telemetry.userAgent || existing.userAgent || '',
    country: telemetry.country || authUser.country || existing.country || '',
    isShadowMuted: authUser.isGuest ? guestShadowMutedKeys.has(authUser.key) : Boolean(authUser.isShadowMuted),
    isFrozen: authUser.isGuest ? guestFrozenKeys.has(authUser.key) : Boolean(authUser.isFrozen),
    lastSeenMs: Date.now(),
    lastHeartbeat: Date.now(),
    ...extra
  };
  onlinePresenceMap.set(authUser.key, entry);
  db.syncOnlinePresenceDoc(buildPublicPresenceDoc(entry));
  if (!entry.isGuest && entry.userId) {
    const row = db.findUserById(entry.userId);
    if (row) db.syncUserStateDoc(row);
  }
  if (entry.roomId) broadcastRoomUsers(entry.roomId);
  broadcastGlobalOnlineUsers();
  broadcastRoomsList();
  return entry;
}

function removeOnlinePresence(targetKey) {
  const key = String(targetKey || '').trim();
  if (!key) return;
  const existing = onlinePresenceMap.get(key);
  onlinePresenceMap.delete(key);
  recentRoomPresence.delete(key);
  db.removeOnlinePresenceDoc(key);
  if (existing?.roomId) {
    releaseUserMicsInRoom(key, existing.roomId);
    pauseQuizBotIfRoomEmpty(existing.roomId);
    broadcastRoomUsers(existing.roomId);
  }
  broadcastGlobalOnlineUsers();
  broadcastRoomsList();
}

function broadcastRoomUsers(roomId) {
  if (!io || !roomId) return;
  io.to(roomId).emit('room_users', {
    roomId,
    users: getRoomUsersList(roomId),
    roomKingKey: computeRoomKingKey(roomId)
  });
}

function broadcastGlobalOnlineUsers() {
  if (!io) return;
  io.emit('online_users', buildGlobalOnlineUsers());
}

function broadcastRoomsList() {
  if (!io) return;
  io.emit('rooms', buildRoomsPayload());
}

function broadcastTypingUsers(roomId) {
  if (!io || !roomId) return;
  const now = Date.now();
  const users = [];
  for (const e of onlinePresenceMap.values()) {
    if (e.roomId === roomId && !isStealthEntry(e) && e.typingInRoom === roomId && now - (Number(e.typingAt) || 0) < 5000) {
      users.push({
        key: e.key,
        name: e.name,
        avatarUrl: e.avatarUrl || '',
        role: e.role || 'member'
      });
    }
  }
  io.to(roomId).emit('typing_users', { roomId, users });
}

function syncUserPresence(userId) {
  const row = db.findUserById(userId);
  if (!row) return;
  db.syncUserStateDoc(row);
  const mapped = mapUserRow(row);
  const existing = onlinePresenceMap.get(mapped.key);
  if (existing) {
    Object.assign(existing, mapped, { firebaseUid: row.firebase_uid || existing.firebaseUid || '' });
    db.syncOnlinePresenceDoc(buildPublicPresenceDoc(existing));
    if (existing.roomId) broadcastRoomUsers(existing.roomId);
  }
  emitToUserKey(mapped.key, 'session_patch', mapped);
  broadcastGlobalOnlineUsers();
}

function syncUserAcrossSockets(_ioUnused, userId) {
  syncUserPresence(userId);
}

function emitNotificationToUser(_ioUnused, targetKey, notifObj) {
  if (!targetKey || !notifObj) return;
  if (targetKey === '*') {
    if (io) io.emit('notification', notifObj);
    return;
  }
  db.patchUserStateDoc(targetKey, {
    lastNotifAt: Date.now(),
    unreadNotifCount: db.getUnreadNotificationCount(targetKey)
  });
  emitToUserKey(targetKey, 'notification', notifObj);
}

function formatMuteDurationArabic(mins) {
  const m = Math.max(1, Math.round(Number(mins) || 1));
  if (m === 1) return 'دقيقة واحدة';
  if (m === 2) return 'دقيقتين';
  if (m >= 3 && m <= 10) return `${m} دقائق`;
  return `${m} دقيقة`;
}

function buildSanitizedMutePayload(active, fallbackRoomId = '*') {
  if (!active) {
    return {
      muted: false,
      roomId: fallbackRoomId || '*',
      expiresAt: 0
    };
  }
  return {
    muted: true,
    roomId: active.room_id || fallbackRoomId || '*',
    expiresAt: Number(active.expires_at) || 0
  };
}

function notifyUserMutedNotification(targetKey, mins) {
  if (!targetKey) return;
  const durLabel = formatMuteDurationArabic(mins);
  const notif = db.addNotification({
    targetKey,
    title: '🔇 تنبيه كتم مؤقت',
    body: `تم كتمك مؤقتاً لمدة: ${durLabel}`,
    category: 'system'
  });
  emitNotificationToUser(null, targetKey, notif);
}

function emitMuteStateToUser(targetKey, roomId) {
  const active = db.getActiveMute(targetKey, roomId);
  const payload = buildSanitizedMutePayload(active, roomId);
  db.patchUserStateDoc(targetKey, { activeMute: payload });
  emitToUserKey(targetKey, 'mute_state', payload);
}

function kickTargetFromPresence(targetKey, { reason = 'تم طردك من الغرفة', banned = false } = {}) {
  if (!targetKey) return;
  const cleanReason = banned ? 'تم حظرك من الشات' : String(reason || 'تم طردك من الغرفة');
  db.patchUserStateDoc(targetKey, {
    kickedAt: Date.now(),
    kickedReason: cleanReason,
    isBanned: Boolean(banned)
  });
  for (const rm of db.getAllRooms()) {
    releaseUserMicsInRoom(targetKey, rm.id);
  }
  emitToUserKey(targetKey, banned ? 'banned' : 'kicked', {
    reason: cleanReason,
    banned: Boolean(banned)
  });
  const sockSet = userSocketsMap.get(String(targetKey));
  if (sockSet && sockSet.size) {
    const socksCopy = [...sockSet];
    userSocketsMap.delete(String(targetKey));
    setTimeout(() => {
      for (const s of socksCopy) {
        try {
          s.disconnect(true);
        } catch {
          // ignore
        }
      }
    }, 120);
  }
  removeOnlinePresence(targetKey);
}

const activeMutedKeysTracker = new Set();
let muteExpiryTimer = null;

function startMuteExpiryMonitor() {
  if (muteExpiryTimer) clearInterval(muteExpiryTimer);
  muteExpiryTimer = setInterval(() => {
    try {
      const activeRows = db.getAllActiveMutes();
      const stillMuted = new Set(activeRows.map((m) => m.target_key));
      for (const prevKey of [...activeMutedKeysTracker]) {
        if (!stillMuted.has(prevKey)) {
          activeMutedKeysTracker.delete(prevKey);
          emitMuteStateToUser(prevKey, '*');
        }
      }
      for (const k of stillMuted) activeMutedKeysTracker.add(k);
    } catch (err) {
      console.error('[MuteExpiryMonitor Error]', err?.message || err);
    }
  }, 8000);
}

function notifyOwnersModerationEvent({
  actorName,
  actorKey = '',
  targetName,
  targetKey,
  actionType,
  reason = '',
  durationMins = 0,
  roomId = '',
  violatingWord = ''
}) {
  const roomObj = roomId ? db.getRoomById(roomId) : null;
  const roomName = roomObj ? roomObj.name : roomId || 'الشات';
  const cleanReason = String(reason || '').trim() || 'بدون سبب محدد';
  let title = '🛡️ تنبيه رقابي فوري للمالك';
  let body = '';
  if (actionType === 'banned_word_mute') {
    title = `🚫 كتم تلقائي: كلمة محظورة من "${targetName}"`;
    body = `تم كتم "${targetName}" تلقائياً في (${roomName}) لمدة ${durationMins} د — السبب: ${cleanReason} • الكلمة: "${violatingWord}" • المنفّذ: ${actorName}`;
  } else if (actionType === 'antiflood_mute') {
    title = `⚡ كتم تلقائي (Anti-Flood): "${targetName}"`;
    body = `تم كتم "${targetName}" تلقائياً في (${roomName}) لمدة ${durationMins} د — السبب: ${cleanReason} • المنفّذ: ${actorName}`;
  } else if (actionType === 'kick') {
    title = `🚪 إشعار طرد من (${actorName})`;
    body = `قام "${actorName}" بطرد "${targetName}" من (${roomName}) — السبب: ${cleanReason}`;
  } else if (actionType === 'ban' || actionType === 'xban') {
    title = `🚫 إشعار حظر${actionType === 'xban' ? ' X-Ban' : ''} من (${actorName})`;
    body = `قام "${actorName}" بحظر "${targetName}" نهائياً — السبب: ${cleanReason}`;
  } else {
    title = `🔇 إشعار كتم من (${actorName})`;
    body = `قام "${actorName}" بكتم "${targetName}" لمدة ${durationMins || '؟'} د في (${roomName}) — السبب: ${cleanReason}`;
  }

  const ownerUsers = db
    .getAllRegisteredUsers()
    .filter((u) => u.role === 'site_owner' || db.isSupremeOwnerEmail(u.email));
  for (const owner of ownerUsers) {
    const ownerKey = `user:${owner.id}`;
    const notif = db.addNotification({
      targetKey: ownerKey,
      title,
      body,
      category: 'security_alert'
    });
    emitNotificationToUser(null, ownerKey, notif);
    db.patchUserStateDoc(ownerKey, {
      lastModAlertAt: Date.now(),
      lastModAlertTitle: title,
      lastModAlertBody: body
    });
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
// AUTH ROUTES (LOCAL + FIREBASE AUTH GOOGLE/EMAIL SYNC)
// ==========================================
function decodeJwtPayloadUnsafe(jwt) {
  try {
    const parts = String(jwt || '').split('.');
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

app.post('/api/auth/firebase', async (req, res) => {
  try {
    const { idToken, firebaseUid, email, displayName, avatarUrl, invitedBy } = req.body || {};
    const tokenClaims = idToken ? decodeJwtPayloadUnsafe(idToken) : null;
    const fuid = String(tokenClaims?.user_id || tokenClaims?.sub || firebaseUid || '').trim().slice(0, 128);
    const cleanEmail = String(tokenClaims?.email || email || '').trim().toLowerCase();
    const rawName = db.sanitizePlainText(String(tokenClaims?.name || displayName || cleanEmail.split('@')[0] || 'عضو'), 24);
    const rawPic = String(tokenClaims?.picture || avatarUrl || '').trim().slice(0, 500);
    const pic = db.sanitizeSafeUrl(rawPic, { allowDataImage: false, maxLen: 500 });

    if (!fuid && !cleanEmail) {
      return res.status(400).json({ error: 'بيانات مصادقة Firebase غير مكتملة.' });
    }

    const { ip, deviceId, fingerprint, userAgent, country } = getClientTelemetry(req);
    const isSup = db.isSupremeOwnerEmail(cleanEmail);
    if (!isSup) {
      const rl = checkRateLimit(`auth_fb:${ip}:${deviceId || 'nodev'}`, 20, 120000);
      if (!rl.allowed) {
        return res.status(429).json({ error: `محاولات دخول متكررة. حاول بعد ${rl.retryAfterSec} ثانية.` });
      }
    }

    let row = (fuid && db.findUserByFirebaseUid(fuid)) || (cleanEmail ? db.findUserByIdentifier(cleanEmail) : null);

    if (!isSup) {
      const settings = db.getSiteSettings();
      if (Number(settings.block_vpn) === 1 && isVpnOrProxyRequest(req)) {
        return res.status(403).json({ error: 'الدخول عبر VPN أو Proxy محظور حالياً.' });
      }
      const ban = db.isTargetBanned({
        targetKey: row ? `user:${row.id}` : '',
        email: cleanEmail || row?.email || '',
        ipAddress: ip,
        deviceId,
        fingerprint
      });
      if (ban || (row && (row.isBanned === true || row.is_banned === 1))) {
        return res.status(403).json({ error: 'تم حظرك من الشات', banned: true });
      }
      if (!row && Number(settings.allow_register ?? 1) === 0) {
        return res.status(403).json({ error: 'التسجيل الجديد مقفل حالياً من قبل صاحب الموقع.', locked: true });
      }
    }

    if (!row) {
      if (!cleanEmail) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب لإنشاء الحساب عبر Firebase.' });
      }
      const baseUsername = rawName.length >= 2 ? rawName : `عضو_${Math.floor(100 + Math.random() * 900)}`;
      let candidateName = baseUsername;
      if (db.findUserByIdentifier(candidateName)) {
        candidateName = `${baseUsername.slice(0, 18)}_${Math.floor(100 + Math.random() * 900)}`;
      }
      const randomPassHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      const regRes = db.registerUser({
        username: candidateName,
        email: cleanEmail,
        passwordHash: randomPassHash,
        ipAddress: ip,
        deviceId,
        fingerprint,
        userAgent,
        country,
        firebaseUid: fuid
      });
      if (regRes.error) return res.status(409).json({ error: regRes.error });
      row = regRes.user;
      if (pic && row?.id) {
        db.updateUserCustomization(row.id, { avatarUrl: pic });
      }
      if (invitedBy) {
        const refRes = db.recordReferralInvite(invitedBy, row.id);
        if (refRes) {
          db.addNotification({
            targetKey: `user:${refRes.inviter.id}`,
            title: '🤝 مكافأة دعوة صديق!',
            body: `انضم "${candidateName}" عبر رابط دعوتك وحصلت على +${refRes.bonus} روبي!`,
            category: 'system'
          });
          syncUserPresence(refRes.inviter.id);
        }
      }
    } else {
      if (fuid) db.linkUserFirebaseUid(row.id, fuid);
      if (db.isSupremeOwnerEmail(row.email)) db.ensureSupremeOwnerAccount(row.id);
      db.updateUserIp(row.id, ip, deviceId, { fingerprint, userAgent, country });
    }

    const freshRow = db.findUserById(row.id);
    db.syncUserStateDoc(freshRow);
    const mapped = mapUserRow(freshRow);
    const token = issuePersistentSessionToken({
      user: mapped,
      isGuest: false,
      telemetry: { ip, deviceId, fingerprint, userAgent }
    });
    await db.flushWrites();
    return res.json({ token, user: mapped });
  } catch (err) {
    console.error('Firebase Auth error:', err);
    return res.status(500).json({ error: 'تعذر إتمام المصادقة عبر Firebase.' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, invitedBy, firebaseUid } = req.body || {};
    const cleanUser = db.sanitizePlainText(String(username || ''), 24);
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    const cleanFuid = String(firebaseUid || req.headers['x-firebase-uid'] || '').trim().slice(0, 128);

    const { ip, deviceId, fingerprint, userAgent, country } = getClientTelemetry(req);
    const isSup = db.isSupremeOwnerEmail(cleanEmail);
    const settings = db.getSiteSettings();
    if (!isSup && Number(settings.allow_register ?? 1) === 0) {
      return res.status(403).json({ error: 'التسجيل الجديد مقفل حالياً من قبل صاحب الموقع.', locked: true });
    }
    if (!isSup) {
      const rl = checkRateLimit(`register:${ip}:${deviceId || 'nodev'}`, 6, 180000);
      if (!rl.allowed) {
        return res.status(429).json({ error: `تم تجاوز الحد المسموح لإنشاء الحسابات. حاول بعد ${rl.retryAfterSec} ثانية.` });
      }
    }

    if (cleanUser.length < 2 || cleanUser.length > 24) {
      return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 2 و 24 حرفاً.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صالح.' });
    }
    if (cleanPass.length < 5) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 5 أحرف على الأقل.' });
    }

    if (!isSup) {
      if (Number(settings.block_vpn) === 1 && isVpnOrProxyRequest(req)) {
        return res.status(403).json({ error: 'التسجيل عبر VPN أو Proxy محظور حالياً.' });
      }
      const ipBan = db.isTargetBanned({ email: cleanEmail, ipAddress: ip, deviceId, fingerprint });
      if (ipBan) {
        return res.status(403).json({
          error: 'تم حظرك من الشات',
          banned: true
        });
      }
    }

    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const result = db.registerUser({
      username: cleanUser,
      email: cleanEmail,
      passwordHash,
      ipAddress: ip,
      deviceId,
      fingerprint,
      userAgent,
      country,
      firebaseUid: cleanFuid
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
        emitNotificationToUser(null, `user:${refRes.inviter.id}`, notif);
        syncUserPresence(refRes.inviter.id);
      }
    }

    const finalUser = db.findUserById(result.user.id);
    db.syncUserStateDoc(finalUser);
    const mapped = mapUserRow(finalUser);
    const token = issuePersistentSessionToken({
      user: mapped,
      isGuest: false,
      telemetry: { ip, deviceId, fingerprint, userAgent }
    });
    await db.flushWrites();
    return res.json({ token, user: mapped });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'تعذر إنشاء الحساب حالياً.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password, firebaseUid } = req.body || {};
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(password || '');
    const cleanFuid = String(firebaseUid || req.headers['x-firebase-uid'] || '').trim().slice(0, 128);
    if (!cleanId || !cleanPass) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.' });
    }

    const { ip, deviceId, fingerprint, userAgent, country } = getClientTelemetry(req);
    const preRow = db.findUserByIdentifier(cleanId);
    const isSupAttempt = db.isSupremeOwnerEmail(cleanId) || (preRow && db.isSupremeOwnerEmail(preRow.email));
    if (!isSupAttempt) {
      const rl = checkRateLimit(`login:${ip}:${deviceId || 'nodev'}`, 18, 120000);
      if (!rl.allowed) {
        return res.status(429).json({ error: `محاولات تسجيل دخول متكررة. حاول بعد ${rl.retryAfterSec} ثانية.` });
      }
    }

    const row = preRow;
    if (!row) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }

    const ok = await bcrypt.compare(cleanPass, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    if (db.isSupremeOwnerEmail(row.email)) {
      db.ensureSupremeOwnerAccount(row.id);
    } else {
      const ban = db.isTargetBanned({
        targetKey: `user:${row.id}`,
        email: row.email,
        ipAddress: ip,
        deviceId,
        fingerprint
      });
      if (ban || row.isBanned === true || row.is_banned === 1) {
        return res.status(403).json({
          error: 'تم حظرك من الشات',
          banned: true
        });
      }
    }

    if (cleanFuid) db.linkUserFirebaseUid(row.id, cleanFuid);
    db.updateUserIp(row.id, ip, deviceId, { fingerprint, userAgent, country });
    const freshRow = db.findUserById(row.id);
    db.syncUserStateDoc(freshRow);
    const mapped = mapUserRow(freshRow);
    const token = issuePersistentSessionToken({
      user: mapped,
      isGuest: false,
      telemetry: { ip, deviceId, fingerprint, userAgent }
    });
    await db.flushWrites();
    return res.json({ token, user: mapped });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

app.post('/api/guest', async (req, res) => {
  const settings = db.getSiteSettings();
  if (Number(settings.allow_guests ?? 1) === 0) {
    return res.status(403).json({ error: 'دخول الزوار مقفل حالياً من قبل صاحب الموقع.', locked: true });
  }
  const { ip, deviceId, fingerprint, userAgent, country } = getClientTelemetry(req);
  const rl = checkRateLimit(`guest:${ip}:${deviceId || 'nodev'}`, 10, 180000);
  if (!rl.allowed) {
    return res.status(429).json({ error: `تم تجاوز الحد المسموح لدخول الزوار. حاول بعد ${rl.retryAfterSec} ثانية.` });
  }
  const rawName = db.sanitizePlainText(String(req.body?.name || ''), 22);
  const name = rawName.length >= 2 ? rawName : `زائر_${Math.floor(100 + Math.random() * 900)}`;
  const requestedGuestKey = String(req.body?.guestKey || '').trim();
  const cleanFuid = String(req.body?.firebaseUid || req.headers['x-firebase-uid'] || '').trim().slice(0, 128);
  const isValidExistingGuestKey = /^guest:[a-f0-9]{8,32}$/i.test(requestedGuestKey);
  const key = isValidExistingGuestKey ? requestedGuestKey : `guest:${crypto.randomBytes(6).toString('hex')}`;
  const ban = db.isTargetBanned({ targetKey: key, ipAddress: ip, deviceId, fingerprint });
  if (ban) {
    return res.status(403).json({
      error: 'تم حظرك من الشات',
      banned: true
    });
  }

  const guestRow = db.upsertGuest({ key, name, ipAddress: ip, deviceId, fingerprint, userAgent, country, firebaseUid: cleanFuid });
  const user = mapGuestRow(guestRow, key, name);
  const token = issuePersistentSessionToken({
    isGuest: true,
    guestKey: key,
    guestName: user.name,
    telemetry: { ip, deviceId, fingerprint, userAgent }
  });
  await db.flushWrites();
  return res.json({ token, user });
});

app.get('/api/me', async (req, res) => {
  const u = resolveAuthFromRequest(req);
  if (!u) return res.status(401).json({ error: 'جلسة غير صالحة.' });
  if (u.banned) {
    return res.status(403).json({
      error: 'تم حظرك من الشات',
      banned: true
    });
  }
  const cleanFuid = String(req.headers['x-firebase-uid'] || req.query?.firebaseUid || '').trim().slice(0, 128);
  if (cleanFuid && !u.isGuest && u.userId) {
    db.linkUserFirebaseUid(u.userId, cleanFuid);
  }
  let nextToken = req._authRawToken || '';
  const payload = req._authTokenPayload;
  const shouldRefreshToken =
    !payload ||
    !payload.sid ||
    !payload.exp ||
    Date.now() - Number(payload.iat || 0) > 7 * 24 * 60 * 60 * 1000;
  if (shouldRefreshToken) {
    const telemetry = getClientTelemetry(req);
    if (u.isGuest) {
      nextToken = issuePersistentSessionToken({
        isGuest: true,
        guestKey: u.key,
        guestName: u.name,
        telemetry
      });
    } else {
      nextToken = issuePersistentSessionToken({
        user: u,
        isGuest: false,
        telemetry
      });
    }
    await db.flushWrites();
  }
  return res.json({ user: u, token: nextToken || undefined });
});

app.post('/api/logout', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const payload = verifyToken(token);
  if (payload?.sid) {
    db.revokeUserSession(payload.sid);
  }
  const uKey = payload?.isGuest ? payload?.key : (payload?.userId ? `user:${payload.userId}` : '');
  if (uKey) {
    removeOnlinePresence(uKey);
  }
  await db.flushWrites();
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
  const webApiKey = String(process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY || '').trim();
  const firebaseWebConfig = webApiKey
    ? {
        apiKey: webApiKey,
        authDomain: String(process.env.FIREBASE_AUTH_DOMAIN || `${db.FIREBASE_PROJECT_ID}.firebaseapp.com`),
        projectId: db.FIREBASE_PROJECT_ID,
        firestoreDatabaseId: db.FIRESTORE_DATABASE_ID,
        appId: String(process.env.FIREBASE_WEB_APP_ID || '')
      }
    : {
        projectId: db.FIREBASE_PROJECT_ID,
        firestoreDatabaseId: db.FIRESTORE_DATABASE_ID
      };
  res.json({ settings: db.getPublicSiteSettings(), firebaseWebConfig });
});

// ==========================================
// UPLOAD ENDPOINTS
// ==========================================
app.get('/api/profile-media/:id', async (req, res) => {
  const cleanId = String(req.params.id || '').replace(/[^a-zA-Z0-9_.-]/g, '').replace(/\.{2,}/g, '');
  if (!cleanId) return res.status(404).end();
  const media = await db.getProfileMedia(cleanId);
  if (!media || !media.dataBase64) return res.status(404).end();
  const buf = Buffer.from(String(media.dataBase64), 'base64');
  res.setHeader('Content-Type', media.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(buf);
});

async function persistUploadedProfileImage(req, kind) {
  const fallbackUrl = `/uploads/${kind === 'cover' ? 'covers' : 'avatars'}/${req.file.filename}`;
  let finalUrl = fallbackUrl;
  let savedInFirebase = false;
  try {
    const buf = await fs.promises.readFile(req.file.path);
    // Keep within Firestore 1 MB document size limit (~720 KB raw -> ~960 KB base64)
    if (buf.length > 0 && buf.length <= 720 * 1024) {
      const mediaId = `${kind}_${req.authUser.userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const ok = await db.saveProfileMedia(mediaId, {
        mimeType: req.file.mimetype || 'image/jpeg',
        dataBase64: buf.toString('base64'),
        kind,
        userId: req.authUser.userId
      });
      if (ok) {
        finalUrl = `/api/profile-media/${mediaId}`;
        savedInFirebase = true;
      }
    }
  } catch {
    // fallback to disk upload path
  }
  const prevUrl = String(kind === 'cover' ? req.authUser.coverUrl || '' : req.authUser.avatarUrl || '');
  if (prevUrl.startsWith('/api/profile-media/')) {
    const oldMediaId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
    if (oldMediaId) db.deleteProfileMedia(oldMediaId).catch(() => {});
  }
  return { url: finalUrl, savedInFirebase };
}

app.post('/api/upload/avatar', requireRegistered, (req, res, next) => {
  if (!canPassSettingThreshold(req.authUser, 'min_rank_avatar', 'member')) {
    return res.status(403).json({ error: 'تغيير الصورة الشخصية مقيّد حالياً لرتبة أعلى من رتبتك.' });
  }
  return next();
}, uploadAvatar.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة.' });
  if ((await isUploadedGifFile(req.file)) && !canUserUploadAnimatedGif(req.authUser)) {
    if (req.file.path) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(403).json({ error: 'رفع صور GIF المتحركة متاح للمالك وأعلى رتبتين فقط.' });
  }
  const { url, savedInFirebase } = await persistUploadedProfileImage(req, 'avatar');
  const updated = db.updateUserCustomization(req.authUser.userId, { avatarUrl: url });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, url, savedInFirebase, user: updated ? mapUserRow(updated) : null });
});

app.post('/api/upload/cover', requireRegistered, (req, res, next) => {
  if (!canPassSettingThreshold(req.authUser, 'min_rank_cover', 'member')) {
    return res.status(403).json({ error: 'تغيير صورة الغلاف مقيّد حالياً لرتبة أعلى من رتبتك.' });
  }
  return next();
}, uploadCover.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة الغلاف.' });
  if ((await isUploadedGifFile(req.file)) && !canUserUploadAnimatedGif(req.authUser)) {
    if (req.file.path) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(403).json({ error: 'رفع صور GIF المتحركة متاح للمالك وأعلى رتبتين فقط.' });
  }
  const { url, savedInFirebase } = await persistUploadedProfileImage(req, 'cover');
  const updated = db.updateUserCustomization(req.authUser.userId, { coverUrl: url });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, url, savedInFirebase, user: updated ? mapUserRow(updated) : null });
});

app.delete('/api/profile/avatar', requireRegistered, async (req, res) => {
  const prevUrl = String(req.authUser.avatarUrl || '');
  if (prevUrl.startsWith('/api/profile-media/')) {
    const oldMediaId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
    if (oldMediaId) db.deleteProfileMedia(oldMediaId).catch(() => {});
  }
  const updated = db.updateUserCustomization(req.authUser.userId, { avatarUrl: '' });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
});

app.delete('/api/profile/cover', requireRegistered, async (req, res) => {
  const prevUrl = String(req.authUser.coverUrl || '');
  if (prevUrl.startsWith('/api/profile-media/')) {
    const oldMediaId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
    if (oldMediaId) db.deleteProfileMedia(oldMediaId).catch(() => {});
  }
  const updated = db.updateUserCustomization(req.authUser.userId, { coverUrl: '' });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
});

app.post('/api/upload/image', requireAuth, (req, res, next) => {
  if (req.authUser.isGuest && Number(db.getSiteSettings().lock_guest_images) === 1) {
    return res.status(403).json({ error: 'إرسال الصور للزوار مقفل حالياً من قبل المالك.' });
  }
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'chat_media')) {
    return res.status(403).json({ error: 'إرسال الصور والملفات غير متاح لرتبتك الحالية.' });
  }
  if (!canPassSettingThreshold(req.authUser, 'min_rank_chat_media', 'member')) {
    return res.status(403).json({ error: 'إرسال الصور والملفات في الدردشة مقيّد حالياً لرتبة أعلى.' });
  }
  return next();
}, uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة.' });
  return res.json({ url: `/uploads/images/${req.file.filename}` });
});

app.post('/api/upload/audio', requireAuth, (req, res, next) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'chat_media')) {
    return res.status(403).json({ error: 'إرسال الرسائل الصوتية غير متاح لرتبتك الحالية.' });
  }
  if (!canPassSettingThreshold(req.authUser, 'min_rank_chat_media', 'member')) {
    return res.status(403).json({ error: 'إرسال الملفات الصوتية مقيّد حالياً لرتبة أعلى.' });
  }
  return next();
}, uploadAudio.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق ملف صوتي.' });
  return res.json({ url: `/uploads/audio/${req.file.filename}` });
});

app.post('/api/upload/wallpaper', requireRegistered, (req, res, next) => {
  const u = req.authUser;
  const canAny =
    u.role === 'site_owner' ||
    canDo(u.role, 'manage_rooms') ||
    canDo(u.role, 'access_panel') ||
    db.getAllRooms().some((r) => db.isRoomManager(r.id, u.userId, u.role) || db.hasRoomOwnerPermission(r.id, u.userId, u.role, 'style_bg'));
  if (!canAny) {
    return res.status(403).json({ error: 'تغيير خلفية الغرفة متاح للمالك وملاك ومشرفي الغرف المصرح لهم فقط.' });
  }
  return next();
}, uploadWallpaper.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة خلفية.' });
  return res.json({ url: `/uploads/wallpapers/${req.file.filename}` });
});

app.post('/api/upload/emoji', requirePanelAccess, uploadEmoji.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة إيموجي.' });
  const mime = String(req.file.mimetype || 'image/png').toLowerCase();
  const ext = MIME_TO_EXT[mime] || path.extname(req.file.filename || '') || '.png';
  const isAnimated = mime === 'image/gif' || mime === 'image/webp' || mime === 'image/svg+xml' || /\.(gif|webp|svg)$/i.test(ext);
  const fallbackUrl = `/uploads/emojis/${req.file.filename}`;
  let finalUrl = fallbackUrl;
  let savedInFirebase = false;
  try {
    const buf = await fs.promises.readFile(req.file.path);
    if (buf.length > 0 && buf.length <= 720 * 1024) {
      const mediaId = `emoji_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const ok = await db.saveProfileMedia(mediaId, {
        mimeType: mime,
        dataBase64: buf.toString('base64'),
        kind: 'emoji',
        userId: req.authUser.userId
      });
      if (ok) {
        finalUrl = `/api/profile-media/${mediaId}`;
        savedInFirebase = true;
        fs.promises.unlink(req.file.path).catch(() => {});
      }
    }
  } catch {
    // fallback to disk upload
  }
  await db.flushWrites();
  return res.json({ ok: true, url: finalUrl, isAnimated, savedInFirebase });
});

app.post('/api/upload/frame', requireOwner, uploadFrame.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة أو GIF الإطار.' });
  const fallbackUrl = `/uploads/frames/${req.file.filename}`;
  let finalUrl = fallbackUrl;
  let savedInFirebase = false;
  try {
    const buf = await fs.promises.readFile(req.file.path);
    if (buf.length > 0 && buf.length <= 5 * 1024 * 1024) {
      const mediaId = `frame_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const ok = await db.saveProfileMedia(mediaId, {
        mimeType: req.file.mimetype || 'image/png',
        dataBase64: buf.toString('base64'),
        kind: 'frame',
        userId: req.authUser.userId
      });
      if (ok) {
        finalUrl = `/api/profile-media/${mediaId}`;
        savedInFirebase = true;
        fs.promises.unlink(req.file.path).catch(() => {});
      }
    }
  } catch {
    // fallback to disk upload
  }
  await db.flushWrites();
  return res.json({ ok: true, url: finalUrl, savedInFirebase });
});

app.post('/api/upload/profile-music', requireRegistered, (req, res, next) => {
  if (Number(db.getSiteSettings().feat_profile_music ?? 1) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'ميزة أغنية البروفايل متوقفة مؤقتاً من قبل المالك.' });
  }
  if (req.authUser.role !== 'site_owner' && (!canDo(req.authUser.role, 'profile_music') || !canPassSettingThreshold(req.authUser, 'min_rank_music', 'member'))) {
    return res.status(403).json({ error: 'رفع أغنية البروفايل غير متاح لرتبتك الحالية.' });
  }
  return uploadProfileMusic.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'الحد الأقصى لحجم أغنية البروفايل هو 2 ميجابايت.' });
      }
      return res.status(400).json({ error: err.message || 'تعذر رفع الملف الصوتي.' });
    }
    return next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق ملف صوتي.' });
  const mime = String(req.file.mimetype || '').toLowerCase();
  const origName = String(req.file.originalname || '').toLowerCase();
  if (!mime.startsWith('audio/') && !origName.endsWith('.mp3')) {
    if (req.file.path) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: 'يُسمح فقط برفع ملفات صوتية بصيغة MP3 أو Audio.' });
  }
  if ((req.file.size || 0) > 2 * 1024 * 1024) {
    if (req.file.path) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: 'الحد الأقصى لحجم أغنية البروفايل هو 2 ميجابايت.' });
  }
  const fallbackUrl = `/uploads/music/${req.file.filename}`;
  let finalUrl = fallbackUrl;
  let savedInFirebase = false;
  try {
    const buf = await fs.promises.readFile(req.file.path);
    const mediaId = `music_${req.authUser.userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const ok = await db.saveProfileMedia(mediaId, {
      mimeType: mime || 'audio/mpeg',
      dataBase64: buf.toString('base64'),
      kind: 'music',
      userId: req.authUser.userId
    });
    if (ok) {
      finalUrl = `/api/profile-media/${mediaId}`;
      savedInFirebase = true;
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  } catch {
    // fallback
  }
  const prevUrl = String(req.authUser.profileMusic || '');
  if (prevUrl.startsWith('/api/profile-media/')) {
    const oldMediaId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
    if (oldMediaId) db.deleteProfileMedia(oldMediaId).catch(() => {});
  }
  const updated = db.updateUserCustomization(req.authUser.userId, { profileMusic: finalUrl });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, url: finalUrl, savedInFirebase, user: updated ? mapUserRow(updated) : null });
});

app.delete('/api/profile/music', requireRegistered, async (req, res) => {
  const prevUrl = String(req.authUser.profileMusic || '');
  if (prevUrl.startsWith('/api/profile-media/')) {
    const oldMediaId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
    if (oldMediaId) db.deleteProfileMedia(oldMediaId).catch(() => {});
  }
  const updated = db.updateUserCustomization(req.authUser.userId, { profileMusic: '' });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(updated) });
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

app.post('/api/upload/bot-avatar', requireOwner, uploadAvatar.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة.' });
  const fallbackUrl = `/uploads/avatars/${req.file.filename}`;
  let finalUrl = fallbackUrl;
  let savedInFirebase = false;
  try {
    const buf = await fs.promises.readFile(req.file.path);
    if (buf.length > 0 && buf.length <= 720 * 1024) {
      const mediaId = `bot_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const ok = await db.saveProfileMedia(mediaId, {
        mimeType: req.file.mimetype || 'image/jpeg',
        dataBase64: buf.toString('base64'),
        kind: 'bot_avatar',
        userId: req.authUser.userId
      });
      if (ok) {
        finalUrl = `/api/profile-media/${mediaId}`;
        savedInFirebase = true;
      }
    }
  } catch {
    // fallback to disk upload path
  }
  await db.flushWrites();
  return res.json({ ok: true, url: finalUrl, savedInFirebase });
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
  if (Number(db.getSiteSettings().feat_youtube) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'ميزة اليوتيوب متوقفة مؤقتاً من قبل المالك.' });
  }
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'youtube')) {
    return res.status(403).json({ error: 'البحث ومشاركة اليوتيوب غير متاحة لرتبتك الحالية.' });
  }
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
app.post('/api/profile/stealth', requireRegistered, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !db.isSupremeOwnerEmail(req.authUser.email) && !canDo(req.authUser.role, 'stealth')) {
    return res.status(403).json({ error: 'وضع التخفي غير مفعل لرتبتك الحالية.' });
  }
  const enabled = Boolean(req.body?.enabled);
  const resStealth = db.setUserStealth(req.authUser.userId, enabled);
  if (!resStealth || resStealth.error) {
    return res.status(403).json({ error: resStealth?.error || 'تعذر تحديث وضع التخفي.' });
  }
  syncUserPresence(req.authUser.userId);
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
    syncUserPresence(req.authUser.userId);
    await db.flushWrites();
    return res.json({ ok: true, user: mapUserRow(upd.user) });
  } catch (err) {
    return res.status(500).json({ error: 'تعذر تحديث بيانات الحساب.' });
  }
});

app.post('/api/profile/interact', requireAuth, async (req, res) => {
  const { targetKey, like, rating, visit } = req.body || {};
  const settings = db.getSiteSettings();
  if (like && Number(settings.feat_profile_likes) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'ميزة الإعجاب بالبروفايل متوقفة حالياً من المالك.' });
  }
  if (rating && Number(settings.feat_profile_rating) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'ميزة تقييم النجوم متوقفة حالياً من المالك.' });
  }
  if (!targetKey || !String(targetKey).startsWith('user:')) {
    return res.status(400).json({ error: 'التفاعل متاح لملفات الأعضاء المسجلين فقط.' });
  }
  if (targetKey === req.authUser.key) {
    return res.status(400).json({ error: 'لا يمكنك تقييم أو الإعجاب بملفك الشخصي.' });
  }
  const uid = Number(String(targetKey).replace('user:', ''));
  const updated = db.interactProfile(uid, { like: Boolean(like), rating, visit: Boolean(visit) });
  if (!updated) return res.status(404).json({ error: 'العضو غير موجود.' });
  syncUserPresence(uid);
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
    nameFontStyle,
    fontSize,
    nameFontSize,
    nameStyleMode,
    nameGradient,
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
    statusText,
    vipFamily,
    age,
    gender,
    country,
    allowCalls,
    allowPm,
    customFields
  } = req.body || {};

  if (textColor !== undefined && textColor !== '' && !parseHexColorRgb(textColor)) {
    return res.status(400).json({ error: 'صيغة لون النص غير صالحة.' });
  }
  if (nameColor !== undefined && nameColor !== '' && !parseHexColorRgb(nameColor)) {
    return res.status(400).json({ error: 'صيغة لون الاسم غير صالحة.' });
  }

  const currentEffectiveName = String(req.authUser.displayName || req.authUser.name || '').trim();
  const nextCleanDisplayName = displayName !== undefined ? db.sanitizePlainText(String(displayName || ''), 28) : currentEffectiveName;
  if (
    displayName !== undefined &&
    nextCleanDisplayName !== currentEffectiveName &&
    req.authUser.role !== 'site_owner' &&
    !canDo(req.authUser.role, 'change_name')
  ) {
    return res.status(403).json({ error: 'تغيير الاسم المستعار غير متاح لرتبتك الحالية.' });
  }

  const canUseAddons = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'use_addons');
  const wantsAddonEquip =
    (nameplateStyle !== undefined && nameplateStyle !== 'default' && nameplateStyle !== req.authUser.nameplateStyle) ||
    (nameShine !== undefined && nameShine !== 'none' && nameShine !== req.authUser.nameShine) ||
    (profileBgEffect !== undefined && profileBgEffect !== 'none' && profileBgEffect !== req.authUser.profileBgEffect) ||
    (vipWings === true && !req.authUser.vipWings);

  if (avatarFrame === 'owner_sovereign' && req.authUser.role !== 'site_owner' && !db.isSupremeOwnerEmail(req.authUser.email)) {
    return res.status(403).json({ error: 'إطار الكسوف الملكي حصري للمالك فقط.' });
  }
  if (avatarFrame !== undefined && avatarFrame !== 'none' && avatarFrame !== req.authUser.avatarFrame && req.authUser.role !== 'site_owner') {
    const foundFrame = getEffectiveFramesCatalog().find((f) => f.id === avatarFrame);
    const curUserRow = db.findUserById(req.authUser.userId);
    const frameAllowed =
      foundFrame &&
      !foundFrame.ownerOnly &&
      (foundFrame.isFree || Number(foundFrame.price || 0) === 0 || db.isFrameOwnedAndValid(curUserRow, foundFrame.id));
    if (!frameAllowed) {
      return res.status(403).json({ error: 'المتجر مقفل: يجب شراء الإطار بالروبي من المتجر أولاً قبل تفعيله.' });
    }
  }
  if (wantsAddonEquip && !canUseAddons) {
    return res.status(403).json({ error: 'استخدام الإضافات (اللمعة والقوالب والخلفيات) غير مفعّل لرتبتك الحالية.' });
  }
  if (profileBgEffect !== undefined && profileBgEffect !== 'none' && profileBgEffect !== req.authUser.profileBgEffect && !canPassSettingThreshold(req.authUser, 'min_rank_bg_effect', 'member')) {
    return res.status(403).json({ error: 'خلفيات الملف المتحركة مقيّدة حالياً لرتبة أعلى من رتبتك.' });
  }
  if (
    profileMusic !== undefined &&
    profileMusic !== '' &&
    profileMusic !== req.authUser.profileMusic &&
    req.authUser.role !== 'site_owner' &&
    (!canDo(req.authUser.role, 'profile_music') || !canPassSettingThreshold(req.authUser, 'min_rank_music', 'member'))
  ) {
    return res.status(403).json({ error: 'إضافة أو تغيير أغنية الملف الشخصي غير متاح لرتبتك الحالية.' });
  }
  const changingNameStyle =
    (nameColor !== undefined && nameColor !== req.authUser.nameColor) ||
    (nameBgColor !== undefined && nameBgColor !== req.authUser.nameBgColor) ||
    (neonColor !== undefined && neonColor !== req.authUser.neonColor) ||
    (nameFontSize !== undefined && Number(nameFontSize) !== Number(req.authUser.nameFontSize || 14)) ||
    (nameFontStyle !== undefined && normalizeFontStyle(nameFontStyle) !== normalizeFontStyle(req.authUser.nameFontStyle || req.authUser.fontStyle)) ||
    (nameStyleMode !== undefined && nameStyleMode !== (req.authUser.nameStyleMode || 'solid')) ||
    (nameGradient !== undefined && nameGradient !== (req.authUser.nameGradient || 'gold_royal'));
  if (changingNameStyle && !canPassSettingThreshold(req.authUser, 'min_rank_name_style', 'member')) {
    return res.status(403).json({ error: 'تخصيص لون وخط الاسم وتوهج النيون مقيّد حالياً لرتبة أعلى.' });
  }
  const changingMsgStyle =
    (textColor !== undefined && textColor !== req.authUser.textColor) ||
    (fontSize !== undefined && Number(fontSize) !== Number(req.authUser.fontSize || 14)) ||
    (fontFamily !== undefined && normalizeProfileFont(fontFamily) !== normalizeProfileFont(req.authUser.fontFamily)) ||
    (fontStyle !== undefined && normalizeFontStyle(fontStyle) !== normalizeFontStyle(req.authUser.fontStyle));
  if (changingMsgStyle && !canPassSettingThreshold(req.authUser, 'min_rank_msg_style', 'member')) {
    return res.status(403).json({ error: 'تلوين وتكبير خط الرسائل مقيّد حالياً لرتبة أعلى من رتبتك.' });
  }

  if (avatarUrl !== undefined) {
    const chk = validateHttpsOrLocalUrl(avatarUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `الصورة الشخصية: ${chk.error}` });
  }
  if (coverUrl !== undefined) {
    const chk = validateHttpsOrLocalUrl(coverUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `صورة الغلاف: ${chk.error}` });
  }
  if (profileMusic !== undefined) {
    const chk = validateHttpsOrLocalUrl(profileMusic, { allowPreset: true });
    if (!chk.ok) return res.status(400).json({ error: `موسيقى البروفايل: ${chk.error}` });
  }

  const clampedMsgSize = fontSize !== undefined ? Math.max(13, Math.min(17, Number(fontSize) || 14)) : undefined;
  const clampedNameSize = nameFontSize !== undefined ? Math.max(13, Math.min(18, Number(nameFontSize) || 14)) : undefined;

  const updated = db.updateUserCustomization(req.authUser.userId, {
    displayName: displayName !== undefined && !canDo(req.authUser.role, 'change_name') && req.authUser.role !== 'site_owner' ? undefined : displayName,
    nameColor,
    textColor,
    nameBgColor,
    neonColor,
    fontFamily: fontFamily !== undefined ? normalizeProfileFont(fontFamily) : undefined,
    fontStyle: fontStyle !== undefined ? normalizeFontStyle(fontStyle) : undefined,
    nameFontStyle: nameFontStyle !== undefined ? normalizeFontStyle(nameFontStyle) : undefined,
    fontSize: clampedMsgSize,
    nameFontSize: clampedNameSize,
    nameStyleMode,
    nameGradient,
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
    statusText,
    vipFamily,
    age,
    gender,
    country,
    allowCalls,
    allowPm,
    customFields
  });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ user: mapUserRow(updated) });
});

app.get('/api/shop/items', (_req, res) => {
  const s = db.getSiteSettings();
  res.json({
    storeEnabled: Number(s.feat_store) !== 0,
    frames: getEffectiveFramesCatalog(),
    ranks: getPurchasableRanksCatalog(),
    nameplates: SHOP_NAMEPLATES,
    shines: NAME_SHINES,
    nameAnimations: NAME_ANIMATIONS,
    nameAnimSpeeds: NAME_ANIM_SPEEDS,
    profileBackgrounds: PROFILE_BG_EFFECTS,
    rankBadgeStyles: RANK_BADGE_STYLES,
    musicPresets: PROFILE_MUSIC_PRESETS,
    radioStations: RADIO_STATIONS,
    gifts: db.getGiftsCatalog()
  });
});

app.post('/api/shop/buy', requireRegistered, async (req, res) => {
  const { type = 'frame', itemId } = req.body || {};
  const settings = db.getSiteSettings();
  if (Number(settings.feat_store) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'المتجر متوقف مؤقتاً من قبل مالك الموقع.' });
  }

  if (type === 'rank') {
    const catalog = getPurchasableRanksCatalog();
    const targetRank = catalog.find((r) => r.key === itemId);
    if (!targetRank) return res.status(400).json({ error: 'هذه الرتبة غير متوفرة للشراء.' });
    const result = db.purchaseRankWithRuby(req.authUser.userId, targetRank.key, targetRank.price);
    if (result?.error) return res.status(400).json({ error: result.error });
    syncUserPresence(req.authUser.userId);
    await db.flushWrites();
    return res.json({ user: mapUserRow(result.user), purchased: true, rank: targetRank });
  }

  if (type !== 'frame') {
    return res.status(400).json({ error: 'الشراء بالروبي متاح للإطارات والرتب فقط.' });
  }
  const found = getEffectiveFramesCatalog().find((f) => f.id === itemId);
  if (!found) return res.status(400).json({ error: 'الإطار غير موجود.' });
  if (found.ownerOnly && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'هذا الإطار حصري لصاحب الموقع فقط.' });
  }
  const result = db.purchaseFrameWithRuby(
    req.authUser.userId,
    found.id,
    found.price || 0,
    found.durationType || 'permanent'
  );
  if (result?.error) return res.status(400).json({ error: result.error });
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ user: mapUserRow(result.user), purchased: !result.alreadyOwned, frame: found });
});

app.post('/api/shop/equip', requireRegistered, async (req, res) => {
  const { type, itemId } = req.body || {};
  const canUseAddons = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'use_addons');
  const isClearing =
    itemId === 'none' || itemId === 'default' || itemId === '' || itemId === false || itemId === 0;

  if (type === 'frame') {
    const found = getEffectiveFramesCatalog().find((f) => f.id === itemId);
    if (!found) return res.status(400).json({ error: 'الإطار غير موجود.' });
    if (found.ownerOnly && req.authUser.role !== 'site_owner') {
      return res.status(403).json({ error: 'هذا الإطار حصري لصاحب الموقع فقط.' });
    }
    const curUser = db.findUserById(req.authUser.userId);
    const isFreeOrOwned =
      req.authUser.role === 'site_owner' ||
      found.id === 'none' ||
      (!found.ownerOnly && (found.isFree || Number(found.price || 0) === 0)) ||
      db.isFrameOwnedAndValid(curUser, found.id);
    if (!isFreeOrOwned) {
      return res.status(403).json({ error: 'المتجر مقفل: يجب شراء الإطار بالروبي أولاً (أو انتهت مدة صلاحيته).' });
    }
    const updated = db.updateUserCustomization(req.authUser.userId, { avatarFrame: found.id });
    syncUserPresence(req.authUser.userId);
    await db.flushWrites();
    return res.json({ user: mapUserRow(updated) });
  }

  if (!isClearing && type !== 'name_anim' && type !== 'name_anim_speed' && !canUseAddons) {
    return res.status(403).json({ error: 'رتبتك لا تملك صلاحية استخدام الإضافات حالياً.' });
  }
  if (!isClearing && type === 'bg_effect' && !canPassSettingThreshold(req.authUser, 'min_rank_bg_effect', 'member')) {
    return res.status(403).json({ error: 'خلفيات البروفايل المتحركة مقيّدة لرتبة أعلى من رتبتك.' });
  }
  if (!isClearing && type === 'music' && !canPassSettingThreshold(req.authUser, 'min_rank_music', 'member')) {
    return res.status(403).json({ error: 'أغاني الملف الشخصي مقيّدة لرتبة أعلى من رتبتك.' });
  }

  let patch = null;
  if (type === 'nameplate') {
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
  syncUserPresence(req.authUser.userId);
  await db.flushWrites();
  return res.json({ user: mapUserRow(updated) });
});

// ==========================================
// GIFTS SYSTEM
// ==========================================
app.get('/api/gifts/catalog', (_req, res) => {
  res.json({ gifts: db.getGiftsCatalog() });
});

app.get('/api/gifts/user/:key', (req, res) => {
  const targetKey = decodeURIComponent(req.params.key || '');
  res.json(db.getGiftsForUser(targetKey));
});

app.post('/api/gifts/send', requireRegistered, async (req, res) => {
  try {
    if (Number(db.getSiteSettings().feat_gifts) === 0 && req.authUser.role !== 'site_owner') {
      return res.status(403).json({ error: 'ميزة إرسال الهدايا متوقفة مؤقتاً من قبل المالك.' });
    }
    if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'gifts')) {
      return res.status(403).json({ error: 'إرسال الهدايا غير متاح لرتبتك الحالية.' });
    }
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

    syncUserPresence(req.authUser.userId);
    if (result.receiver) {
      syncUserPresence(result.receiver.id);
    }

    if (roomId && db.getRoomById(roomId)) {
      db.addMessage({
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
    }

    const notif = db.addNotification({
      targetKey: toKey,
      title: `${result.gift.emoji} هدية جديدة من ${req.authUser.name}`,
      body: `أرسل لك "${req.authUser.name}" هدية (${result.gift.name}) +${result.gift.reward} عملة!`,
      category: 'gift'
    });
    emitNotificationToUser(null, toKey, notif);
    db.patchUserStateDoc(toKey, {
      lastGiftAt: Date.now(),
      lastGiftTx: result.tx,
      lastGiftEmoji: result.gift.emoji,
      lastGiftName: result.gift.name
    });

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
  if (imageUrl) {
    const chk = validateHttpsOrLocalUrl(imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
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
  emitNotificationToUser(null, '*', notif);
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
  await db.flushWrites();
  return res.json({ ok: true });
});

// ==========================================
// SOCIAL, FRIENDS, WALL, REPORTS, NOTIFICATIONS, LEADERBOARDS
// ==========================================
app.get('/api/social/state', requireAuth, (req, res) => {
  const key = req.authUser.key;
  const pms = db.getPrivateMessagesForUser(key);
  const unreadPmCount = pms.filter((m) => m.to_key === key && Number(m.is_read) === 0).length;
  return res.json({
    friends: db.getFriendsForUser(key),
    privateMessages: pms,
    unreadPmCount,
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
  db.patchUserStateDoc(req.authUser.key, { unreadNotifCount: 0 });
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
  emitNotificationToUser(null, toKey, notif);
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
    emitNotificationToUser(null, friendKey, notif);
  }
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/wall', requireRegistered, async (req, res) => {
  if (Number(db.getSiteSettings().feat_wall) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'حائط المنشورات متوقف مؤقتاً من قبل المالك.' });
  }
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'wall')) {
    return res.status(403).json({ error: 'النشر على الحائط غير متاح لرتبتك الحالية.' });
  }
  const content = db.sanitizePlainText(String(req.body?.content || ''), 600);
  const imageUrl = String(req.body?.imageUrl || '').trim();
  if (imageUrl) {
    const chk = validateHttpsOrLocalUrl(imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
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
  const promo = db.checkAndApplyAutoPromotion(req.authUser.userId);
  syncUserPresence(req.authUser.userId);
  if (promo?.promoted) {
    const notif = db.addNotification({
      targetKey: req.authUser.key,
      title: `🎖️ ترقية تلقائية إلى ${promo.rank?.label || promo.newRole}!`,
      body: `مبارك! وصلت نقاط تفاعلك إلى الحد المطلوب وتمت ترقيتك تلقائياً إلى "${promo.rank?.label || promo.newRole}".`,
      category: 'system'
    });
    emitNotificationToUser(null, req.authUser.key, notif);
  }
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/like', requireAuth, async (req, res) => {
  const post = db.likeWallPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'المنشور غير موجود.' });
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/react', requireAuth, async (req, res) => {
  const type = String(req.body?.type || 'like');
  const post = db.reactWallPost(req.params.id, type);
  if (!post) return res.status(404).json({ error: 'المنشور غير موجود.' });
  await db.flushWrites();
  return res.json({ post });
});

app.post('/api/wall/:id/comment', requireAuth, async (req, res) => {
  if (Number(db.getSiteSettings().feat_wall) === 0 && req.authUser.role !== 'site_owner') {
    return res.status(403).json({ error: 'حائط المنشورات متوقف مؤقتاً من قبل المالك.' });
  }
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'wall')) {
    return res.status(403).json({ error: 'التعليق على الحائط غير متاح لرتبتك الحالية.' });
  }
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
    emitNotificationToUser(null, post.author_key, notif);
  }
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
    canDo(req.authUser.role, 'delete_msg') ||
    canDo(req.authUser.role, 'clear_room') ||
    canDo(req.authUser.role, 'access_panel');
  if (!canDelete) return res.status(403).json({ error: 'لا تملك صلاحية حذف هذا المنشور.' });
  db.deleteWallPost(req.params.id);
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/reports', requireAuth, async (req, res) => {
  if (!checkRateLimit(`report:${req.authUser.key}`, 8, 60000)) {
    return res.status(429).json({ error: 'تم إرسال عدة بلاغات مؤخراً؛ انتظر دقيقة ثم حاول مجدداً.' });
  }
  const targetName = db.sanitizePlainText(String(req.body?.targetName || '').trim(), 40);
  const reason = db.sanitizePlainText(String(req.body?.reason || '').trim(), 300);
  const roomId = db.sanitizePlainText(String(req.body?.roomId || ''), 60);
  if (!targetName || !reason) return res.status(400).json({ error: 'يرجى تحديد المبلغ عنه وسبب البلاغ.' });
  const report = db.addReport({
    reporterKey: req.authUser.key,
    reporterName: req.authUser.name,
    targetName,
    reason,
    roomId
  });
  await db.flushWrites();
  return res.json({ report });
});

app.get('/api/leaderboards', (_req, res) => {
  const all = db.getAllRegisteredUsers();
  const onlineKeys = new Set();
  for (const e of onlinePresenceMap.values()) {
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
    ruby: Number(u.coins) || 0,
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
        db.getRankPower(u.role) >= 9
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

// Reconnect catch-up endpoint for missed room messages without duplicate flicker
app.get('/api/rooms/:id/messages', requireAuth, (req, res) => {
  const roomId = String(req.params.id || '').trim();
  const rm = db.getRoomById(roomId);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const isOwnerOrMod = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  if (!isOwnerOrMod && db.isBannedFromRoom(roomId, req.authUser.key)) {
    return res.status(403).json({ error: 'تم حظرك من هذه الغرفة.' });
  }
  if (!isOwnerOrMod && (Number(rm.min_rank_power) || 0) > db.getRankPower(req.authUser.role)) {
    return res.status(403).json({ error: 'لا تملك صلاحية عرض رسائل هذه الغرفة.' });
  }
  const afterMs = Math.max(0, Number(req.query?.after) || 0);
  const limit = Math.max(1, Math.min(150, Number(req.query?.limit) || 100));
  const messages = afterMs > 0
    ? db.getRoomMessagesAfter(roomId, afterMs, limit, req.authUser.key)
    : db.getRoomMessages(roomId, limit, req.authUser.key);
  return res.json({ roomId, messages });
});

function buildAdminOverviewPayload(reqUser) {
  const isOwner = reqUser.role === 'site_owner';
  const canAccessBank = isOwner || reqUser.role === 'co_owner' || db.getRankPower(reqUser.role) >= 14;
  const onlineCount = buildGlobalOnlineUsers().length;
  const users = db.getAllRegisteredUsers().map((u) => ({
    ...u,
    displayName: db.getEffectiveName(u),
    rank: db.getRankByKey(u.role),
    isBanned: Boolean(u.isBanned || u.is_banned === 1),
    isSupremeOwner: db.isSupremeOwnerEmail(u.email)
  }));
  const allBans = db.getAllBans();
  const allMutes = db.getAllActiveMutes();
  return {
    stats: {
      onlineCount,
      registeredCount: users.length,
      roomsCount: db.getAllRooms().length,
      ranksCount: db.getAllRanks().length,
      bansCount: allBans.length,
      mutesCount: allMutes.length,
      reportsCount: db.getReports().length,
      newsCount: db.getAllNews().length,
      myMaxAssignablePower: isOwner ? 15 : db.getMaxAssignablePower(reqUser.role),
      canAccessBank
    },
    settings: isOwner ? db.getSiteSettings() : db.getPublicSiteSettings(),
    ranks: db.getAllRanks(),
    rooms: buildRoomsPayload(),
    users,
    bans: allBans,
    mutes: allMutes,
    reports: db.getReports(),
    emojis: db.getAllCustomEmojis(),
    news: db.getAllNews(),
    giftsCatalog: db.getGiftsCatalog(),
    customFrames: db.getAllCustomFrames(),
    framesCatalog: getEffectiveFramesCatalog(),
    adminLogs: db.getAdminLogs(120),
    pmLinkAlerts: isOwner ? db.getPmLinkAlerts(60) : [],
    violationLogs: isOwner ? db.getViolationLogs(120) : [],
    roomBans: db.getRoomBans()
  };
}

app.get('/api/admin/overview', requirePanelAccess, (req, res) => {
  return res.json(buildAdminOverviewPayload(req.authUser));
});

app.get('/api/admin/bootstrap', requirePanelAccess, (req, res) => {
  return res.json(buildAdminOverviewPayload(req.authUser));
});

app.get('/api/admin/logs', requirePanelAccess, (req, res) => {
  const limit = Math.max(10, Math.min(300, Number(req.query?.limit) || 120));
  return res.json({ logs: db.getAdminLogs(limit) });
});

app.put('/api/admin/gifts', requireOwner, async (req, res) => {
  const list = Array.isArray(req.body?.gifts) ? req.body.gifts : [];
  if (!list.length) return res.status(400).json({ error: 'قائمة الهدايا لا يمكن أن تكون فارغة.' });
  const updated = db.updateGiftsCatalog(list);
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'تحديث قائمة الهدايا',
    details: `${updated.length} هدية`
  });
  await db.flushWrites();
  return res.json({ ok: true, gifts: updated });
});

app.delete('/api/admin/reports/:id', requirePanelAccess, async (req, res) => {
  const ok = db.deleteReportById(req.params.id);
  if (!ok) return res.status(404).json({ error: 'البلاغ غير موجود.' });
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'إغلاق وحذف بلاغ',
    targetKey: String(req.params.id)
  });
  await db.flushWrites();
  return res.json({ ok: true, reports: db.getReports() });
});

app.post('/api/admin/reports/:id/resolve', requirePanelAccess, async (req, res) => {
  const ok = db.deleteReportById(req.params.id);
  if (!ok) return res.status(404).json({ error: 'البلاغ غير موجود.' });
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'معالجة بلاغ',
    targetKey: String(req.params.id)
  });
  await db.flushWrites();
  return res.json({ ok: true, reports: db.getReports() });
});

app.get('/api/owner/bank/search', requireBankAccess, (req, res) => {
  const q = String(req.query?.q || '').trim().toLowerCase();
  const list = db
    .getAllRegisteredUsers()
    .filter((u) => {
      if (!q) return true;
      return (
        String(u.username || '').toLowerCase().includes(q) ||
        String(u.display_name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.id) === q
      );
    })
    .sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0) || (Number(b.activity_points) || 0) - (Number(a.activity_points) || 0))
    .slice(0, 60)
    .map((u) => ({
      id: u.id,
      key: `user:${u.id}`,
      username: u.username,
      displayName: db.getEffectiveName(u),
      email: u.email,
      role: u.role,
      rank: db.getRankByKey(u.role),
      coins: Number(u.coins) || 0,
      activityPoints: Number(u.activity_points) || 0,
      isBanned: Boolean(u.isBanned || u.is_banned === 1),
      isSupremeOwner: db.isSupremeOwnerEmail(u.email)
    }));
  return res.json({ users: list });
});

app.post('/api/owner/bank/adjust', requireBankAccess, async (req, res) => {
  const { userId, targetKey, rubyDelta = 0, activityDelta = 0, reason = '' } = req.body || {};
  const rawId = userId || (String(targetKey || '').startsWith('user:') ? String(targetKey).replace('user:', '') : '');
  const uid = Number(rawId);
  if (!uid || Number.isNaN(uid)) {
    return res.status(400).json({ error: 'يرجى تحديد عضو مسجل صحيح.' });
  }
  const rDelta = Math.trunc(Number(rubyDelta) || 0);
  const aDelta = Math.trunc(Number(activityDelta) || 0);
  if (rDelta === 0 && aDelta === 0) {
    return res.status(400).json({ error: 'يرجى إدخال كمية الروبي أو نقاط التفاعل (غير صفرية).' });
  }
  const updated = db.adjustUserRubyAndActivity(uid, { rubyDelta: rDelta, activityDelta: aDelta });
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });

  let promo = null;
  if (aDelta > 0) {
    promo = db.checkAndApplyAutoPromotion(uid);
  }
  syncUserPresence(uid);

  const finalUser = promo?.user || updated;
  const targetDisplay = db.getEffectiveName(finalUser);
  const cleanNote = String(reason || '').trim().slice(0, 120);
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'عملية بنك المالك',
    targetKey: `user:${uid}`,
    targetName: targetDisplay,
    details: `روبي: ${rDelta >= 0 ? `+${rDelta}` : rDelta} • تفاعل: ${aDelta >= 0 ? `+${aDelta}` : aDelta}${cleanNote ? ` • ${cleanNote}` : ''}`
  });

  if (promo?.promoted) {
    const notif = db.addNotification({
      targetKey: `user:${uid}`,
      title: `🎖️ ترقية تلقائية إلى ${promo.rank?.label || promo.newRole}!`,
      body: `وصل رصيد تفاعلك إلى الحد المطلوب وتمت ترقيتك إلى "${promo.rank?.label || promo.newRole}"!`,
      category: 'system'
    });
    emitNotificationToUser(null, `user:${uid}`, notif);
  }

  await db.flushWrites();
  return res.json({
    ok: true,
    user: {
      id: finalUser.id,
      key: `user:${finalUser.id}`,
      username: finalUser.username,
      displayName: targetDisplay,
      role: finalUser.role,
      rank: db.getRankByKey(finalUser.role),
      coins: Number(finalUser.coins) || 0,
      activityPoints: Number(finalUser.activity_points) || 0
    },
    promoted: promo?.promoted ? promo.rank : null
  });
});

app.put('/api/admin/settings', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'access_panel')) {
    return res.status(403).json({ error: 'صلاحية الإعدادات غير متوفرة.' });
  }
  const body = { ...(req.body || {}) };
  if (req.authUser.role !== 'site_owner') {
    const ownerOnlySettingKeys = [
      'welcome_bot_gemini_key',
      'allow_guests',
      'allow_register',
      'global_chat_mute',
      'banned_words',
      'antiflood_enabled',
      'antiflood_max_msgs',
      'antiflood_window_sec',
      'antiflood_mute_mins',
      'banned_word_mute_mins',
      'block_vpn',
      'welcome_bot_enabled',
      'welcome_bot_mode',
      'ad_units'
    ];
    for (const k of ownerOnlySettingKeys) delete body[k];
  }
  if (body.site_logo !== undefined) {
    const chk = validateHttpsOrLocalUrl(body.site_logo, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `شعار الموقع: ${chk.error}` });
  }
  db.updateSiteSettings(body);
  const pubSettings = db.getPublicSiteSettings();
  if (io) io.emit('settings', pubSettings);
  await db.flushWrites();
  return res.json({ settings: pubSettings });
});

app.post('/api/admin/ranks', requireOwner, async (req, res) => {
  if (req.body?.imageUrl) {
    const chk = validateHttpsOrLocalUrl(req.body.imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
  const result = db.createRank(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  if (io) io.emit('ranks', db.getAllRanks());
  await db.flushWrites();
  return res.json({ rank: result.rank });
});

app.put('/api/admin/ranks/:key', requireOwner, async (req, res) => {
  if (req.body?.imageUrl) {
    const chk = validateHttpsOrLocalUrl(req.body.imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
  const result = db.updateRank(req.params.key, req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  for (const entry of onlinePresenceMap.values()) {
    if (entry.role === req.params.key && entry.userId) {
      syncUserPresence(entry.userId);
    }
  }
  if (io) io.emit('ranks', db.getAllRanks());
  await db.flushWrites();
  return res.json({ rank: result.rank });
});

app.delete('/api/admin/ranks/:key', requireOwner, async (req, res) => {
  const result = db.deleteRank(req.params.key);
  if (result.error) return res.status(400).json({ error: result.error });
  for (const uid of result.affectedUserIds || []) {
    syncUserPresence(uid);
  }
  if (io) io.emit('ranks', db.getAllRanks());
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/emojis', requirePanelAccess, async (req, res) => {
  if (req.body?.imageUrl) {
    const chk = validateHttpsOrLocalUrl(req.body.imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
  const result = db.addCustomEmoji({
    code: req.body?.code,
    imageUrl: req.body?.imageUrl,
    isAnimated: Boolean(req.body?.isAnimated),
    createdBy: req.authUser.name
  });
  if (result.error) return res.status(400).json({ error: result.error });
  await db.flushWrites();
  if (io) io.emit('emojis', db.getAllCustomEmojis());
  return res.json({ emoji: result.emoji });
});

app.delete('/api/admin/emojis/:id', requirePanelAccess, async (req, res) => {
  db.deleteCustomEmoji(req.params.id);
  await db.flushWrites();
  if (io) io.emit('emojis', db.getAllCustomEmojis());
  return res.json({ ok: true });
});

app.post('/api/admin/store/frames', requireOwner, async (req, res) => {
  const { label, imageUrl, price, durationType, isFree } = req.body || {};
  if (imageUrl) {
    const chk = validateHttpsOrLocalUrl(imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
  }
  const freeFlag = Boolean(isFree) || Number(price) === 0;
  const result = db.addCustomFrame({
    label,
    imageUrl,
    price: freeFlag ? 0 : Math.max(0, Number(price) || 0),
    isFree: freeFlag,
    durationType,
    createdBy: req.authUser.name
  });
  if (result.error) return res.status(400).json({ error: result.error });
  const catalog = getEffectiveFramesCatalog();
  await db.flushWrites();
  return res.json({ frame: result.frame, framesCatalog: catalog });
});

app.delete('/api/admin/store/frames/:id', requireOwner, async (req, res) => {
  const resDel = db.deleteCustomFrame(req.params.id);
  for (const uid of resDel.affectedUserIds || []) {
    syncUserPresence(uid);
  }
  const catalog = getEffectiveFramesCatalog();
  await db.flushWrites();
  return res.json({ ok: true, framesCatalog: catalog });
});

app.post('/api/admin/store/grant', requireOwner, async (req, res) => {
  const { userId, frameId, durationType } = req.body || {};
  const found = getEffectiveFramesCatalog().find((f) => f.id === String(frameId || '').trim());
  if (!found || found.id === 'none') return res.status(400).json({ error: 'الإطار المطلوب غير موجود في المتجر.' });
  const chosenDuration = durationType === 'monthly' ? 'monthly' : durationType === 'permanent' ? 'permanent' : (found.durationType || 'permanent');
  const grantRes = db.grantFrameToUser(userId, found.id, {
    durationType: chosenDuration,
    grantedBy: req.authUser.name
  });
  if (grantRes?.error) return res.status(400).json({ error: grantRes.error });
  syncUserPresence(grantRes.user.id);
  const notif = db.addNotification({
    targetKey: `user:${grantRes.user.id}`,
    title: '🎁 هدية إطار من المالك!',
    body: `منحك المالك "${req.authUser.name}" إطار "${found.label}" (${chosenDuration === 'monthly' ? 'لمدة 30 يوماً' : 'دائم'})!`,
    category: 'gift'
  });
  emitNotificationToUser(null, `user:${grantRes.user.id}`, notif);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(grantRes.user) });
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
    ownerUserId,
    ownerPerms,
    ownerAllowedRoles
  } = req.body || {};
  if (imageUrl) {
    const chk = validateHttpsOrLocalUrl(imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `صورة الغرفة: ${chk.error}` });
  }
  if (wallpaperUrl) {
    const chk = validateHttpsOrLocalUrl(wallpaperUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `خلفية الغرفة: ${chk.error}` });
  }
  const cleanName = db.sanitizePlainText(String(name || ''), 60);
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
    ownerPerms,
    ownerAllowedRoles,
    createdBy: req.authUser.name
  });
  broadcastRoomsList();
  await db.flushWrites();
  return res.json({ room: db.sanitizeRoomForPublic(room) });
});

app.put('/api/admin/rooms/:id', requireRegistered, async (req, res) => {
  const rm = db.getRoomById(req.params.id);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const isFullRoomAdmin = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  if (!isFullRoomAdmin && !db.hasRoomOwnerPermission(rm.id, req.authUser.userId, req.authUser.role, 'style_bg')) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذه الغرفة.' });
  }
  const patch = { ...(req.body || {}) };
  if (patch.imageUrl) {
    const chk = validateHttpsOrLocalUrl(patch.imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `صورة الغرفة: ${chk.error}` });
  }
  if (patch.wallpaperUrl) {
    const chk = validateHttpsOrLocalUrl(patch.wallpaperUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `خلفية الغرفة: ${chk.error}` });
  }
  if (!isFullRoomAdmin) {
    delete patch.ownerUserId;
    delete patch.ownerPerms;
    delete patch.ownerAllowedRoles;
  }
  const updated = db.updateRoom(rm.id, patch);
  const pubRoom = db.sanitizeRoomForPublic(updated);
  if (io && pubRoom) io.to(rm.id).emit('room_updated', pubRoom);
  broadcastRoomsList();
  await db.flushWrites();
  return res.json({ room: pubRoom });
});

app.put('/api/rooms/:id/style', requireRegistered, async (req, res) => {
  const rm = db.getRoomById(req.params.id);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const isFullRoomAdmin = req.authUser.role === 'site_owner' || canDo(req.authUser.role, 'manage_rooms');
  const canStyle = db.hasRoomOwnerPermission(rm.id, req.authUser.userId, req.authUser.role, 'style_bg');
  if (!isFullRoomAdmin && !canStyle) {
    return res.status(403).json({ error: 'ليست لديك صلاحية تغيير ستايل أو خلفية هذه الغرفة.' });
  }
  const { bgTheme, wallpaperUrl, bgCustom, welcomeMessage } = req.body || {};
  if (wallpaperUrl) {
    const chk = validateHttpsOrLocalUrl(wallpaperUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `خلفية الغرفة: ${chk.error}` });
  }
  const updated = db.updateRoom(rm.id, {
    bgTheme,
    wallpaperUrl,
    bgCustom,
    welcomeMessage
  });
  const pubRoom = db.sanitizeRoomForPublic(updated);
  if (io && pubRoom) io.to(rm.id).emit('room_updated', pubRoom);
  broadcastRoomsList();
  await db.flushWrites();
  return res.json({ ok: true, room: pubRoom });
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
  for (const entry of onlinePresenceMap.values()) {
    if (entry.roomId === rm.id) {
      movePresenceToRoom(entry, 'general', {}, true);
      db.patchUserStateDoc(entry.key, { forceRoomId: 'general', forceRoomAt: Date.now() });
      emitToUserKey(entry.key, 'forced_room_move', { roomId: 'general' });
    }
  }
  db.deleteRoom(rm.id);
  broadcastRoomsList();
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/admin/rooms/:id/staff', requirePanelAccess, async (req, res) => {
  if (!db.isRoomManager(req.params.id, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'صلاحية غير كافية.' });
  }
  const staff = db.addRoomStaff(req.params.id, req.body?.userId, req.body?.staffRole, req.authUser.name);
  if (!staff) return res.status(400).json({ error: 'تعذر إضافة مشرف الغرفة.' });
  await db.flushWrites();
  return res.json({ staff });
});

app.delete('/api/admin/rooms/:id/staff/:userId', requirePanelAccess, async (req, res) => {
  if (!db.isRoomManager(req.params.id, req.authUser.userId, req.authUser.role)) {
    return res.status(403).json({ error: 'صلاحية غير كافية.' });
  }
  const staff = db.removeRoomStaff(req.params.id, req.params.userId);
  await db.flushWrites();
  return res.json({ staff });
});

app.post('/api/admin/users', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
    return res.status(403).json({ error: 'لا تملك صلاحية إنشاء الحسابات أو تعيين الرتب.' });
  }
  const { username, displayName, email, password, role } = req.body || {};
  const targetRole = role || 'member';
  if (req.authUser.role !== 'site_owner' && !db.canAssignRankTo(req.authUser.role, targetRole)) {
    return res.status(403).json({ error: 'ليس لديك صلاحية منح هذه الرتبة المحددة.' });
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
  db.syncUserStateDoc(result.user);
  await db.flushWrites();
  return res.json({ user: mapUserRow(result.user) });
});

app.put('/api/admin/users/:id', requirePanelAccess, async (req, res) => {
  const target = db.findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'الحساب غير موجود.' });
  const myPower = db.getRankPower(req.authUser.role);
  const targetCurPower = db.getRankPower(target.role);

  const { displayName, username, email, password, role, isBanned, coins, avatarUrl, coverUrl } = req.body || {};
  if (db.isSupremeOwnerEmail(target.email)) {
    if (!db.isSupremeOwnerEmail(req.authUser.email)) {
      return res.status(403).json({ error: 'حساب صاحب الموقع محمي ولا يمكن تعديله.' });
    }
    if (isBanned === true || (role && role !== 'site_owner')) {
      return res.status(403).json({ error: 'حساب صاحب الموقع محمي ولا يمكن حظره أو تخفيض رتبته.' });
    }
  }
  if (req.authUser.role !== 'site_owner' && targetCurPower >= myPower && target.id !== req.authUser.userId) {
    return res.status(403).json({ error: 'لا يمكنك تعديل عضو مساوٍ لك أو أعلى منك في القوة.' });
  }

  if (role && role !== target.role) {
    if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'set_rank')) {
      return res.status(403).json({ error: 'لا تملك صلاحية تعديل الرتب.' });
    }
    if (req.authUser.role !== 'site_owner' && !db.canAssignRankTo(req.authUser.role, role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية تعيين هذه الرتبة.' });
    }
  }
  if (avatarUrl !== undefined && avatarUrl !== '') {
    const chk = validateHttpsOrLocalUrl(avatarUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `الصورة الشخصية: ${chk.error}` });
  }
  if (coverUrl !== undefined && coverUrl !== '') {
    const chk = validateHttpsOrLocalUrl(coverUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `صورة الغلاف: ${chk.error}` });
  }

  const passwordHash = password && String(password).length >= 5 ? await bcrypt.hash(String(password), 10) : null;
  const result = db.adminUpdateUserAccount(target.id, {
    displayName,
    username,
    email,
    passwordHash,
    role,
    avatarUrl,
    coverUrl
  });
  if (result.error) return res.status(400).json({ error: result.error });
  if (coins !== undefined && Number.isFinite(Number(coins))) {
    if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'give_coins')) {
      return res.status(403).json({ error: 'لا تملك صلاحية تعديل رصيد الروبي.' });
    }
    const nextCoins = Math.max(0, Math.min(100000000, Math.floor(Number(coins))));
    const curCoins = Number(result.user.coins) || 0;
    if (nextCoins !== curCoins) {
      db.adjustUserCoins(target.id, nextCoins - curCoins);
    }
  }
  if (typeof isBanned === 'boolean' && !db.isSupremeOwnerEmail(target.email)) {
    const tKey = `user:${target.id}`;
    if (isBanned) {
      db.banTarget({
        targetKey: tKey,
        targetName: db.getEffectiveName(result.user),
        email: result.user.email,
        banType: 'ban',
        reason: 'تحديث حالة الحظر من لوحة التحكم',
        bannedBy: req.authUser.name,
        bannedByKey: req.authUser.key
      });
      kickTargetFromPresence(tKey, { reason: 'تم حظرك من الشات', banned: true });
    } else {
      db.unbanTarget(tKey);
    }
  }
  const refreshedTarget = db.findUserById(target.id) || result.user;
  db.syncUserStateDoc(refreshedTarget);
  syncUserPresence(target.id);
  await db.flushWrites();
  return res.json({ user: mapUserRow(refreshedTarget) });
});

app.post('/api/admin/users/:id/media', requirePanelAccess, uploadAvatar.single('file'), async (req, res) => {
  const target = db.findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'الحساب غير موجود.' });
  if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(req.authUser.email)) {
    return res.status(403).json({ error: 'حساب صاحب الموقع محمي ولا يمكن تعديله.' });
  }
  const myPower = db.getRankPower(req.authUser.role);
  const targetPower = db.getRankPower(target.role);
  if (req.authUser.role !== 'site_owner' && targetPower >= myPower && target.id !== req.authUser.userId) {
    return res.status(403).json({ error: 'لا يمكنك تعديل صور عضو مساوٍ لك أو أعلى منك.' });
  }

  const kind = String(req.body?.kind || req.query?.kind || 'avatar') === 'cover' ? 'cover' : 'avatar';
  const mode = String(req.body?.mode || (req.file ? 'upload' : 'url'));

  let nextMediaUrl = '';
  if (mode === 'delete') {
    const prevUrl = String(kind === 'cover' ? target.cover_url || '' : target.avatar_url || '');
    if (prevUrl.startsWith('/api/profile-media/')) {
      const oldId = prevUrl.replace('/api/profile-media/', '').split('?')[0];
      if (oldId) db.deleteProfileMedia(oldId).catch(() => {});
    }
    nextMediaUrl = '';
  } else if (req.file) {
    let finalUrl = `/uploads/avatars/${req.file.filename}`;
    try {
      const buf = await fs.promises.readFile(req.file.path);
      if (buf.length > 0 && buf.length <= 720 * 1024) {
        const mediaId = `${kind}_${target.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const ok = await db.saveProfileMedia(mediaId, {
          mimeType: req.file.mimetype || 'image/jpeg',
          dataBase64: buf.toString('base64'),
          kind,
          userId: target.id
        });
        if (ok) finalUrl = `/api/profile-media/${mediaId}`;
      }
    } catch {
      // keep disk fallback URL
    }
    nextMediaUrl = finalUrl;
  } else {
    const rawUrl = String(req.body?.url || '').trim();
    const chk = validateHttpsOrLocalUrl(rawUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: chk.error });
    nextMediaUrl = chk.value;
  }

  const patch = kind === 'cover' ? { coverUrl: nextMediaUrl } : { avatarUrl: nextMediaUrl };
  const updated = db.adminUpdateUserMedia(target.id, patch);
  if (!updated) return res.status(404).json({ error: 'الحساب غير موجود.' });
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: mode === 'delete' ? (kind === 'cover' ? 'حذف غلاف عضو' : 'حذف صورة عضو') : (kind === 'cover' ? 'تحديث غلاف عضو' : 'تحديث صورة عضو'),
    targetKey: `user:${target.id}`,
    targetName: db.getEffectiveName(updated)
  });
  db.syncUserStateDoc(updated);
  syncUserPresence(target.id);
  await db.flushWrites();
  return res.json({ ok: true, url: nextMediaUrl, user: mapUserRow(updated) });
});

app.post('/api/admin/ban', requirePanelAccess, async (req, res) => {
  const isOwner = req.authUser.role === 'site_owner';
  if (!isOwner && !canDo(req.authUser.role, 'ban')) {
    return res.status(403).json({ error: 'لا تملك صلاحية الحظر.' });
  }
  const { targetKey, reason, banType } = req.body || {};
  const cleanReason = String(reason || '').trim().slice(0, 240);
  if (!isOwner && cleanReason.length < 2) {
    return res.status(400).json({ error: 'يجب كتابة سبب الحظر (حرفان على الأقل).' });
  }
  const effectiveReason = cleanReason || (banType === 'xban' ? 'بقرار من المالك (X-Ban)' : 'بقرار من المالك');
  if (!targetKey || db.isProtectedSupremeOwnerKey(targetKey)) {
    return res.status(403).json({ error: 'لا يمكن حظر صاحب الموقع.' });
  }
  let targetName = targetKey;
  let targetEmail = '';
  let targetIp = '';
  let targetDevice = '';
  let targetFingerprint = '';
  if (String(targetKey).startsWith('user:')) {
    const uid = Number(String(targetKey).replace('user:', ''));
    const row = db.findUserById(uid);
    if (row) {
      if (!isOwner && db.getRankPower(row.role) >= db.getRankPower(req.authUser.role)) {
        return res.status(403).json({ error: 'لا يمكنك حظر رتبة أعلى منك أو مساوية لك.' });
      }
      targetName = db.getEffectiveName(row);
      targetEmail = row.email;
      targetIp = row.last_ip || '';
      targetDevice = row.last_device_id || '';
      targetFingerprint = row.last_fingerprint || '';
    }
  } else if (String(targetKey).startsWith('guest:')) {
    const g = db.findGuestByKey(targetKey);
    if (g) {
      targetName = g.name || targetKey;
      targetIp = g.last_ip || '';
      targetDevice = g.last_device_id || '';
      targetFingerprint = g.last_fingerprint || '';
    }
  }
  const live = onlinePresenceMap.get(targetKey);
  if (live) {
    targetName = live.name || targetName;
    targetIp = live.ipAddress || targetIp;
    targetDevice = live.deviceId || targetDevice;
    targetFingerprint = live.fingerprint || targetFingerprint;
  }
  db.banTarget({
    targetKey,
    targetName,
    email: targetEmail,
    ipAddress: targetIp,
    deviceId: banType === 'xban' ? targetDevice : '',
    fingerprint: banType === 'xban' ? targetFingerprint : '',
    banType: banType === 'xban' ? 'xban' : 'ban',
    reason: effectiveReason,
    bannedBy: req.authUser.name,
    bannedByKey: req.authUser.key
  });
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: banType === 'xban' ? 'إكس باند X-Ban' : 'حظر نهائي',
    targetKey,
    targetName,
    details: effectiveReason
  });
  notifyOwnersModerationEvent({
    actorName: req.authUser.name,
    actorKey: req.authUser.key,
    targetName,
    targetKey,
    actionType: banType === 'xban' ? 'xban' : 'ban',
    reason: effectiveReason
  });

  kickTargetFromPresence(targetKey, { reason: 'تم حظرك من الشات', banned: true });
  await db.flushWrites();
  return res.json({ ok: true, bans: db.getAllBans() });
});

app.post('/api/admin/ghost', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'mute') && !canDo(req.authUser.role, 'ban')) {
    return res.status(403).json({ error: 'لا تملك صلاحية وضع الشبح.' });
  }
  const { userId, enabled } = req.body || {};
  const targetRow = db.findUserById(userId);
  if (!targetRow) return res.status(404).json({ error: 'العضو غير موجود.' });
  if (req.authUser.role !== 'site_owner') {
    if (db.getRankPower(targetRow.role) >= db.getRankPower(req.authUser.role)) {
      return res.status(403).json({ error: 'الحصانة المتدرجة: لا يمكنك تطبيق وضع الشبح على رتبة مساوية أو أعلى منك.' });
    }
    if (db.hasPermission(targetRow.role, 'immune')) {
      return res.status(403).json({ error: 'هذا العضو يمتلك حصانة ضد الكتم والشبح.' });
    }
  }
  const result = db.setUserGhosted(userId, Boolean(enabled));
  if (result.error) return res.status(400).json({ error: result.error });
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: enabled ? 'تفعيل شبح' : 'إلغاء شبح',
    targetKey: `user:${targetRow.id}`,
    targetName: db.getEffectiveName(targetRow)
  });
  syncUserPresence(userId);
  await db.flushWrites();
  return res.json({ ok: true, user: mapUserRow(result.user) });
});

app.delete('/api/admin/users/:id', requireOwner, async (req, res) => {
  const uid = Number(req.params.id);
  const result = db.deleteUserAccountPermanently(uid);
  if (result.error) return res.status(400).json({ error: result.error });
  kickTargetFromPresence(`user:${uid}`, { reason: 'تم حذف حسابك نهائياً من قبل صاحب الموقع.', banned: true });
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
  return res.json({ ok: true, bans: db.getAllBans() });
});

app.post('/api/admin/unmute', requirePanelAccess, async (req, res) => {
  if (req.authUser.role !== 'site_owner' && !canDo(req.authUser.role, 'mute') && !canDo(req.authUser.role, 'access_panel')) {
    return res.status(403).json({ error: 'لا تملك صلاحية فك الكتم.' });
  }
  const targetKey = String(req.body?.targetKey || '').trim();
  const roomId = String(req.body?.roomId || '*').trim() || '*';
  if (!targetKey) {
    return res.status(400).json({ error: 'يرجى تحديد العضو لفك الكتم.' });
  }
  db.removeMute(targetKey, roomId);
  emitMuteStateToUser(targetKey, roomId);
  if (roomId && roomId !== '*') {
    emitRoomNoticeMessage(roomId, `🔊 قام "${req.authUser.name}" بفك الكتم عن العضو.`);
  }
  db.addAdminLog({
    actorKey: req.authUser.key,
    actorName: req.authUser.name,
    actorRole: req.authUser.role,
    action: 'فك كتم',
    targetKey,
    targetName: targetKey,
    details: roomId
  });
  await db.flushWrites();
  return res.json({ ok: true, mutes: db.getAllActiveMutes() });
});

// ==========================================
// DAILY LUCKY BOX & ULTIMATE OWNER SUITE
// ==========================================
app.post('/api/lucky-box/claim', requireRegistered, async (req, res) => {
  const result = db.claimLuckyBox(req.authUser.userId);
  if (result.error) return res.status(400).json({ error: result.error });
  syncUserPresence(req.authUser.userId);
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

function emitRoomNoticeMessage(roomId, content, extra = {}) {
  if (!roomId || !content) return null;
  const msg = db.addMessage({
    roomId,
    senderKey: extra.senderKey || 'system:notice',
    senderName: extra.senderName || 'النظام',
    senderRole: extra.senderRole || 'site_owner',
    nameColor: extra.nameColor || '#fbbf24',
    textColor: extra.textColor || '#fef3c7',
    nameBgColor: extra.nameBgColor || '#1e293b',
    avatarUrl: extra.avatarUrl || '',
    avatarFrame: extra.avatarFrame || 'none',
    isAdminNotice: true,
    msgType: 'text',
    clientMsgId: extra.clientMsgId || '',
    content: String(content).slice(0, 800)
  });
  return msg;
}

function getRoomHumanCount(roomId) {
  let count = 0;
  for (const e of onlinePresenceMap.values()) {
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

function getEffectiveQuizBank() {
  const settings = db.getSiteSettings();
  const custom = Array.isArray(settings.quiz_custom_questions) ? settings.quiz_custom_questions : [];
  return [...custom, ...QUIZ_BANK];
}

function getQuizStylePalette(styleKey) {
  const legacyMap = { royal: 'royal_gold', glass: 'glass_modern', classic: 'glass_modern', classic_compact: 'glass_modern' };
  const raw = String(styleKey || 'royal_gold');
  const key = legacyMap[raw] || raw;
  switch (key) {
    case 'glass_modern':
      return { key: 'glass_modern', textColor: '#e0f2fe', bgColor: '#0f172a' };
    case 'cyber_blue':
      return { key: 'cyber_blue', textColor: '#7dd3fc', bgColor: '#0c4a6e' };
    case 'emerald_neon':
      return { key: 'emerald_neon', textColor: '#6ee7b7', bgColor: '#064e3b' };
    case 'crimson_fire':
      return { key: 'crimson_fire', textColor: '#fda4af', bgColor: '#881337' };
    case 'royal_gold':
    default:
      return { key: 'royal_gold', textColor: '#fde68a', bgColor: '#1e293b' };
  }
}

function emitQuizBotMessage(roomId, content, textColor = '', nameBgColor = '') {
  const settings = db.getSiteSettings();
  const palette = getQuizStylePalette(settings.quiz_msg_style);
  db.addMessage({
    roomId,
    senderKey: 'system:quizbot',
    senderName: '🤖 بوت المسابقات',
    senderRole: 'site_owner',
    nameColor: '#fbbf24',
    textColor: textColor || palette.textColor,
    nameBgColor: nameBgColor || palette.bgColor,
    isAdminNotice: true,
    quizStyle: palette.key,
    msgType: 'text',
    content
  });
  db.flushWrites().catch(() => {});
}

function emitQuizBotState(roomId) {
  const bot = roomQuizBots.get(roomId);
  const settings = db.getSiteSettings();
  const palette = getQuizStylePalette(settings.quiz_msg_style);
  const room = db.getRoomById(roomId);
  if (room) {
    db.updateRoom(roomId, {
      quiz_bot_active: Boolean(bot && bot.active),
      quiz_hint_sent: Boolean(bot && bot.hintSent),
      quiz_style: palette.key
    });
  }
}

function startRoomQuizRound(roomId) {
  try {
    const bot = roomQuizBots.get(roomId);
    if (!bot || !bot.active) return;
    clearQuizBotTimers(bot);

    if (getRoomHumanCount(roomId) === 0) {
      bot.currentQ = null;
      bot.hintSent = false;
      bot.pausedEmpty = true;
      return;
    }

    const bank = getEffectiveQuizBank();
    if (!bank.length) return;
    const settings = db.getSiteSettings();
    const intervalSec = Math.max(10, Math.min(120, Number(settings.quiz_interval_sec) || 25));
    const hintSec = Math.max(5, Math.min(intervalSec - 3, Number(settings.quiz_hint_sec) || Math.floor(intervalSec * 0.48)));
    const baseReward = Math.max(10, Math.min(5000, Number(bot.rewardCoins || settings.quiz_reward_coins) || 100));
    const afterHintReward = Math.max(5, Math.round(baseReward * 0.5));
    const lastSecReward = Math.max(5, Math.round(baseReward * 0.25));

    bot.pausedEmpty = false;
    const qObj = bank[bot.qIndex % bank.length];
    bot.qIndex = (bot.qIndex + 1) % bank.length;
    bot.currentQ = qObj;
    bot.roundStartedAt = Date.now();
    bot.roundIntervalSec = intervalSec;
    bot.roundHintSec = hintSec;
    bot.roundRewardCoins = baseReward;
    bot.hintSent = false;

    emitQuizBotMessage(
      roomId,
      `🎯 [${qObj.category}] ${qObj.q} (⏱️ ${intervalSec} ثانية | ${baseReward} روبي قبل التلميح)`
    );
    emitQuizBotState(roomId);

    // Auto-send first letter + letter count hint
    bot.hintTimer = setTimeout(() => {
      try {
        const curBot = roomQuizBots.get(roomId);
        if (!curBot || !curBot.active || curBot.currentQ !== qObj) return;
        curBot.hintSent = true;
        const hintDesc = buildQuizHintText(qObj.displayAnswer || qObj.a[0]);
        emitQuizBotMessage(
          roomId,
          `💡 تلميح: ${hintDesc} — الإجابة الآن بـ ${afterHintReward} ثم ${lastSecReward} في الثواني الأخيرة!`,
          '#fde68a',
          '#78350f'
        );
        emitQuizBotState(roomId);
      } catch (err) {
        console.error('[QuizBot Hint Error]', err?.message || err);
      }
    }, hintSec * 1000);

    // End round -> reveal answer and advance to next question
    bot.endTimer = setTimeout(() => {
      try {
        const curBot = roomQuizBots.get(roomId);
        if (!curBot || !curBot.active || curBot.currentQ !== qObj) return;
        clearQuizBotTimers(curBot);
        curBot.currentQ = null;
        curBot.hintSent = false;
        const answerLabel = qObj.displayAnswer || qObj.a[0];
        emitQuizBotMessage(
          roomId,
          `⏰ انتهى الوقت! الإجابة الصحيحة هي: "${answerLabel}" — جاري الانتقال للسؤال التالي...`,
          '#fecaca',
          '#7f1d1d'
        );
        emitQuizBotState(roomId);
        curBot.nextTimer = setTimeout(() => startRoomQuizRound(roomId), 3500);
      } catch (err) {
        console.error('[QuizBot EndRound Error]', err?.message || err);
      }
    }, intervalSec * 1000);
  } catch (err) {
    console.error('[QuizBot startRoomQuizRound Error]', err?.message || err);
  }
}

function startQuizBotInRoom(roomId, rewardCoins = null) {
  const prev = roomQuizBots.get(roomId);
  clearQuizBotTimers(prev);
  const bank = getEffectiveQuizBank();
  const defaultReward = Math.max(10, Math.min(5000, Number(rewardCoins ?? db.getSiteSettings().quiz_reward_coins) || 100));
  const bot = {
    active: true,
    qIndex: Math.floor(Math.random() * Math.max(1, bank.length)),
    currentQ: null,
    roundStartedAt: 0,
    hintSent: false,
    pausedEmpty: false,
    hintTimer: null,
    endTimer: null,
    nextTimer: null,
    timer: null,
    rewardCoins: defaultReward
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
    emitRoomNoticeMessage(roomId, '🛑 تم إيقاف بوت المسابقات التلقائي في هذه الغرفة.');
  }
  emitQuizBotState(roomId);
}

function ensureCompetitionsQuizBotRunning(roomId) {
  if (roomId !== 'competitions') return;
  const settings = db.getSiteSettings();
  if (Number(settings.quiz_bot_enabled) === 0) return;
  if (getRoomHumanCount('competitions') === 0) return;

  const existing = roomQuizBots.get('competitions');
  if (!existing) {
    const bank = getEffectiveQuizBank();
    const bot = {
      active: true,
      qIndex: Math.floor(Math.random() * Math.max(1, bank.length)),
      currentQ: null,
      roundStartedAt: 0,
      hintSent: false,
      pausedEmpty: false,
      hintTimer: null,
      endTimer: null,
      nextTimer: null,
      timer: null,
      rewardCoins: Number(settings.quiz_reward_coins) || 100
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

  const intervalSec = Math.max(10, Number(bot.roundIntervalSec) || Number(db.getSiteSettings().quiz_interval_sec) || 25);
  const hintSec = Math.max(5, Number(bot.roundHintSec) || Number(db.getSiteSettings().quiz_hint_sec) || 12);
  const baseReward = Math.max(10, Number(bot.roundRewardCoins) || Number(bot.rewardCoins) || Number(db.getSiteSettings().quiz_reward_coins) || 100);
  const elapsedSec = Math.max(0, (Date.now() - (bot.roundStartedAt || Date.now())) / 1000);
  let earnedPoints = baseReward;
  let speedLabel = 'قبل التلميح ⚡';
  if (bot.hintSent || elapsedSec >= hintSec) {
    if (elapsedSec >= Math.max(hintSec + 2, intervalSec - 5)) {
      earnedPoints = Math.max(5, Math.round(baseReward * 0.25));
      speedLabel = 'في الثواني الأخيرة ⏱️';
    } else {
      earnedPoints = Math.max(5, Math.round(baseReward * 0.5));
      speedLabel = 'بعد التلميح 💡';
    }
  }

  clearQuizBotTimers(bot);
  bot.currentQ = null;
  bot.hintSent = false;

  if (entry.userId) {
    db.adjustUserCoins(entry.userId, earnedPoints);
    db.incrementQuizPoints(entry.userId, earnedPoints);
    syncUserPresence(entry.userId);
    db.flushWrites().catch(() => {});
  }

  const answerLabel = qObj.displayAnswer || qObj.a[0];
  emitQuizBotMessage(
    entry.roomId,
    `🏆 أحسنت يا "${entry.name}"! الإجابة (${answerLabel}) صحيحة [${speedLabel}] وحصلت على +${earnedPoints} نقطة/روبي!${entry.userId ? '' : ' (سجّل لحفظ نقاطك)'}`,
    '#86efac',
    '#14532d'
  );
  emitQuizBotState(entry.roomId);
  bot.nextTimer = setTimeout(() => startRoomQuizRound(entry.roomId), 3500);
}

// ==========================================
// SMART WELCOME BOT & VIRTUAL MEMBERS ENGINE
// (100% Independent of Quiz Bot)
// ==========================================
const WELCOME_BOT_PALETTES = {
  royal_gold: {
    key: 'royal_gold',
    label: 'ذهبي ملكي',
    nameColor: '#fde68a',
    textColor: '#fef3c7'
  },
  sky_blue: {
    key: 'sky_blue',
    label: 'أزرق سماوي',
    nameColor: '#7dd3fc',
    textColor: '#e0f2fe'
  },
  emerald_green: {
    key: 'emerald_green',
    label: 'أخضر زمردي',
    nameColor: '#6ee7b7',
    textColor: '#d1fae5'
  },
  ruby_red: {
    key: 'ruby_red',
    label: 'أحمر ياقوتي',
    nameColor: '#fda4af',
    textColor: '#ffe4e6'
  },
  royal_purple: {
    key: 'royal_purple',
    label: 'بنفسجي',
    nameColor: '#d8b4fe',
    textColor: '#f3e8ff'
  }
};

const welcomeBotCooldownByUser = new Map();
const welcomeBotLastRoomWelcome = new Map();
const lastBotActivityByRoom = new Map();
let virtualMembersLoopTimer = null;

function getWelcomeBotPalette(colorKey) {
  const k = String(colorKey || 'royal_gold').trim();
  return WELCOME_BOT_PALETTES[k] || WELCOME_BOT_PALETTES.royal_gold;
}

function getActiveVirtualMembersForRooms() {
  const s = db.getSiteSettings();
  if (Number(s.welcome_bot_enabled ?? 1) === 0 || s.welcome_bot_mode !== 'virtual_members') return [];
  const rawList = Array.isArray(s.virtual_members_list) ? s.virtual_members_list : [];
  if (!rawList.length) return [];
  const allRooms = db.getAllRooms();
  if (!allRooms.length) return [];
  const orderedRooms = allRooms.slice().sort((a, b) => (a.id === 'general' ? -1 : b.id === 'general' ? 1 : 0));
  const palette = getWelcomeBotPalette(s.welcome_bot_color);

  return rawList.map((vm, idx) => {
    const rm = orderedRooms[idx % orderedRooms.length];
    const role = String(vm.role || 'member');
    const rankObj = db.getRankByKey(role);
    const id = String(vm.id || `vm_${idx + 1}`);
    const name = String(vm.name || `عضو ${idx + 1}`).trim();
    return {
      key: `virtual:${id}`,
      virtualId: id,
      userId: null,
      isGuest: false,
      isVirtual: true,
      name,
      displayName: name,
      username: id,
      role,
      rank: rankObj,
      level: Number(rankObj?.power || 4),
      nameColor: palette.nameColor,
      textColor: palette.textColor,
      nameBgColor: '',
      neonColor: '',
      fontFamily: 'Cairo',
      fontStyle: 'Normal',
      fontSize: 14,
      nameFontSize: 14,
      nameStyleMode: 'solid',
      nameGradient: 'gold_royal',
      avatarUrl: String(vm.avatarUrl || ''),
      coverUrl: '',
      avatarFrame: 'none',
      nameplateStyle: 'default',
      nameShine: 'none',
      nameAnim: 'none',
      nameAnimSpeed: 'normal',
      profileBgEffect: 'none',
      vipWings: false,
      profileMusic: '',
      bio: 'عضو نشط في مجتمع شات الأصيل 🌹',
      statusText: 'متفاعل ومستعد للدردشة والترحيب',
      age: '',
      gender: '',
      country: '',
      allowCalls: false,
      allowPm: false,
      likesCount: 12 + idx * 5,
      ratingAvg: 5.0,
      ratingCount: 3,
      isGhosted: false,
      isShadowMuted: false,
      isFrozen: false,
      coins: 0,
      vipFamily: '',
      activityPoints: 45 + idx * 15,
      giftsReceived: 0,
      giftsSent: 0,
      roomId: rm.id,
      roomName: rm.name
    };
  });
}

function emitWelcomeBotMessage(roomId, content, speaker = null) {
  if (!roomId || !content) return null;
  const s = db.getSiteSettings();
  const palette = getWelcomeBotPalette(s.welcome_bot_color);
  const senderKey = speaker?.key || 'system:welcomebot';
  const senderName = String(speaker?.name || s.welcome_bot_name || 'مساعد الأصيل').trim() || 'مساعد الأصيل';
  const senderRole = String(speaker?.role || 'vip');
  const avatarUrl = String(speaker?.avatarUrl ?? s.welcome_bot_avatar ?? '');

  db.addMessage({
    roomId,
    senderKey,
    senderName,
    senderRole,
    nameColor: palette.nameColor,
    textColor: palette.textColor,
    fontFamily: 'Cairo',
    fontStyle: 'Bold',
    fontSize: 14,
    nameFontSize: 14,
    avatarUrl,
    isAdminNotice: false,
    isWelcomeBot: true,
    botColor: palette.key,
    msgType: 'text',
    content: String(content).slice(0, 800)
  });
  lastBotActivityByRoom.set(roomId, Date.now());
  db.flushWrites().catch(() => {});
  return true;
}

function formatWelcomeGreeting(template, userName, roomName) {
  const tpl = String(template || '').trim() || 'أهلاً وسهلاً بك يا [الاسم] في [الغرفة]! نورتنا ويسعدنا تواجدك معنا 🌹';
  return tpl
    .replace(/\[الاسم\]|\{name\}/g, userName)
    .replace(/\[الغرفة\]|\{room\}/g, roomName);
}

function triggerWelcomeBotOnRoomJoin(entry, room) {
  if (!entry || !room) return;
  const s = db.getSiteSettings();
  if (Number(s.welcome_bot_enabled ?? 1) === 0) return;
  const dedupKey = `${entry.key}:${room.id}`;
  const lastAt = welcomeBotLastRoomWelcome.get(dedupKey) || 0;
  if (Date.now() - lastAt < 2 * 60 * 1000) return;
  welcomeBotLastRoomWelcome.set(dedupKey, Date.now());

  const targetRoomId = room.id;
  const targetRoomName = room.name || 'الغرفة';
  const targetUserName = entry.name || 'ضيفنا الكريم';
  const targetEntryKey = entry.key;

  setTimeout(() => {
    try {
      const stillHere = [...onlinePresenceMap.values()].some((e) => e.key === targetEntryKey && e.roomId === targetRoomId);
      if (!stillHere) return;
      const latestSettings = db.getSiteSettings();
      if (Number(latestSettings.welcome_bot_enabled ?? 1) === 0) return;
      let speaker = null;
      if (latestSettings.welcome_bot_mode === 'virtual_members') {
        const vms = getActiveVirtualMembersForRooms();
        const inRoom = vms.filter((v) => v.roomId === targetRoomId);
        const pool = inRoom.length ? inRoom : vms;
        if (pool.length) speaker = pool[Math.floor(Math.random() * pool.length)];
      }
      const greeting = formatWelcomeGreeting(latestSettings.welcome_bot_greeting, targetUserName, targetRoomName);
      emitWelcomeBotMessage(targetRoomId, greeting, speaker);
    } catch (err) {
      console.error('[WelcomeBot RoomJoin Timer Error]', err?.message || err);
    }
  }, 900);
}

function generateSmartFallbackReply(question, userName, roomName, speakerName) {
  const q = normalizeArabicText(question);
  if (/^(اهلا|هلا|مرحبا|السلام|سلام|مساء|صباح|هاي|هلو)/.test(q) || q.includes('شلونك') || q.includes('كيف حالك') || q.includes('اخبارك')) {
    return `يا هلا بك يا ${userName}! يسعدني تواجدك معنا في ${roomName}، كل شيء بخير بوجودك 🌹`;
  }
  if (q.includes('الساعة') || q.includes('الوقت') || q.includes('كم الساعة') || q.includes('التاريخ')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ar-SA');
    return `الوقت الآن ${timeStr} • التاريخ ${dateStr} — أوقاتاً سعيدة يا ${userName}!`;
  }
  if (q.includes('رتب') || q.includes('ترقية') || q.includes('الصلاحيات')) {
    return `يمكنك ترقية رتبتك تلقائياً عبر التفاعل المستمر في الدردشة وجمع النقاط، أو زيارة المتجر لترقية حسابك يا ${userName}.`;
  }
  if (q.includes('روبي') || q.includes('نقاط') || q.includes('متجر') || q.includes('هدايا')) {
    return `تكسب الروبي ونقاط التفاعل عند كتابة رسائل حقيقية في الغرف أو الفوز في المسابقات، ويمكنك استبدالها في المتجر بالإطارات والرتب 💎`;
  }
  if (q.includes('مايك') || q.includes('صوت') || q.includes('راديو') || q.includes('يوتيوب')) {
    return `المايكات الصوتية في أعلى الغرفة متاحة بالضغط على أي مايك فارغ، كما يمكنك فتح الراديو أو يوتيوب الغرفة من الأيقونات بالأعلى 🎙️`;
  }
  if (q.includes('قوانين') || q.includes('حظر') || q.includes('كتم')) {
    return `نرجو من الجميع الالتزام بالاحترام المتبادل، وتجنب التكرار المفرط أو إرسال الروابط والكلمات المخالفة للحفاظ على أجواء ${roomName} الجميلة ✨`;
  }
  if (q.includes('نكتة') || q.includes('اضحك') || q.includes('طرفه')) {
    const jokes = [
      'مرة واحد سأل خويه: ليش تشرب القهوة بدون سكر؟ قال له: لأني أحليها بسواليفك 😄',
      'واحد فتح الثلاجة لقى الجلي يرتجف، قال له: لا تخاف بشرب موية بس! 😂',
      'واحد اشترى ساعة جديدة، شافها متأخرة دقيقة... راح ينتظرها عند البوابة! ⌚'
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (q.includes('حكمة') || q.includes('نصيحة') || q.includes('مقولة')) {
    const quotes = [
      'الكلمة الطيبة جواز سفر إلى القلوب — اترك أثراً جميلاً أينما حللت 🌟',
      'الهدوء والابتسامة والاحترام تفتح لك أبواب المودة في كل مكان 🌹',
      'لا تؤجل فرحة اليوم لظنون الغد؛ استمتع بوقتك مع أصدقائك الآن ✨'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (q.includes('من انت') || q.includes('اسمك') || q.includes('عرفني')) {
    return `أنا ${speakerName}، يسعدني الترحيب بالأعضاء والإجابة عن استفساراتكم بكل ود في ${roomName} 💫`;
  }
  if (q.includes('شكر') || q.includes('يعطيك العافية') || q.includes('تسلم')) {
    return `العفو يا ${userName}! بالخدمة دائماً وأهلاً بك في أي وقت 🌹`;
  }
  return `أهلاً بك يا ${userName} في ${roomName}! وصلتني رسالتك بكل سرور — كيف أستطيع مساعدتك الآن؟ ✨`;
}

const GEMINI_CASCADE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];
let lastWelcomeBotGeminiStatus = { ok: null, model: '', at: null, error: '' };

function recordWelcomeBotGeminiFailureSilent(errorReason) {
  const cleanErr = String(errorReason || 'تعذر الاتصال').slice(0, 260);
  lastWelcomeBotGeminiStatus = {
    ok: false,
    model: GEMINI_CASCADE_MODELS[0],
    at: new Date().toISOString(),
    error: cleanErr
  };
  console.error('[WelcomeBot Gemini]', cleanErr);
}

function stripBotMentionFromQuestion(rawContent, speakerName, mainBotName) {
  let q = String(rawContent || '').trim();
  const names = [speakerName, mainBotName]
    .map((n) => String(n || '').trim())
    .filter((n) => n.length >= 2);
  for (const nm of names) {
    const escaped = nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    q = q.replace(new RegExp(`@?${escaped}`, 'gi'), ' ');
  }
  q = q
    .replace(/(?:^|\s)(?:يا\s*بوت|يا\s*مساعد|البوت|المساعد|@?bot)(?=$|\s|[،.!؟:])/gi, ' ')
    .replace(/^[\s،.!؟:\-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return q || String(rawContent || '').trim();
}

async function callWelcomeBotGeminiWithModel(key, modelName, sysPrompt, userPrompt) {
  let timeout = null;
  try {
    if (typeof fetch !== 'function') {
      return { text: null, status: 0, errorReason: `${modelName}: fetch API غير متاحة في بيئة الخادم` };
    }
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    if (controller) {
      timeout = setTimeout(() => {
        try { controller.abort(); } catch {}
      }, 9000);
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(key)}`;
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 320,
      thinkingConfig: { thinkingBudget: 0 }
    };
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(controller ? { signal: controller.signal } : {}),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig
      })
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const apiMsg = data?.error?.message || resp.statusText || `HTTP ${resp.status}`;
      return { text: null, status: resp.status, errorReason: `${modelName}: (${resp.status}) ${apiMsg}` };
    }
    if (data?.promptFeedback?.blockReason) {
      return { text: null, status: resp.status, errorReason: `${modelName}: حجب (${data.promptFeedback.blockReason})` };
    }
    const candidate = data?.candidates?.[0];
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .filter((p) => typeof p?.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      const finish = candidate?.finishReason || 'EMPTY_RESPONSE';
      return { text: null, status: resp.status, errorReason: `${modelName}: استجابة فارغة (${finish})` };
    }
    return { text: text.slice(0, 480), status: 200, errorReason: '', model: modelName };
  } catch (err) {
    const errMsg = err?.name === 'AbortError'
      ? `${modelName}: انتهت المهلة (9s)`
      : `${modelName}: ${err?.message || 'فشل الاتصال'}`;
    return { text: null, status: 0, errorReason: errMsg };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function callWelcomeBotGemini(apiKey, { question, userName, roomName, speakerName, mainBotName, isVirtual }) {
  try {
    const key = String(apiKey || '').trim();
    if (!key) return { text: null, errorReason: '' };
    const cleanQuestion = stripBotMentionFromQuestion(question, speakerName, mainBotName);
    const persona = isVirtual
      ? `أنت عضو عربي مثقف وودود اسمك "${speakerName}" داخل غرفة الدردشة "${roomName}".`
      : `أنت "${speakerName}"، المساعد الذكي لغرفة الدردشة العربية "${roomName}".`;
    const sysPrompt = `${persona} المستخدم "${userName}" يوجه لك سؤالاً أو حديثاً مباشراً. أجب إجابة ذكية ومباشرة ومفيدة ومختصرة جداً باللغة العربية (سطر إلى ثلاثة أسطر كحد أقصى). ركّز على الإجابة الفعلية لسؤال المستخدم ولا ترد برسالة ترحيب عامة أو متكررة إذا كان هناك سؤال محدد.`;
    const userPrompt = `رسالة ${userName}: ${cleanQuestion.slice(0, 500)}`;

    const errors = [];
    for (const modelName of GEMINI_CASCADE_MODELS) {
      let res = await callWelcomeBotGeminiWithModel(key, modelName, sysPrompt, userPrompt);
      if (!res?.text && Number(res?.status) === 503) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        res = await callWelcomeBotGeminiWithModel(key, modelName, sysPrompt, userPrompt);
      }
      if (res?.text) {
        lastWelcomeBotGeminiStatus = {
          ok: true,
          model: res.model || modelName,
          at: new Date().toISOString(),
          error: ''
        };
        return res;
      }
      if (res?.errorReason) errors.push(res.errorReason);
    }
    return { text: null, errorReason: errors.join(' | ') || 'تعذر الاتصال بنماذج Gemini المتدرجة' };
  } catch (outerErr) {
    return { text: null, errorReason: `Gemini Error: ${outerErr?.message || 'خطأ غير متوقع'}` };
  }
}

function textContainsNormalizedBotName(content, botName) {
  if (textContainsMemberName(content, botName)) return true;
  const normText = normalizeArabicText(content);
  const normName = normalizeArabicText(botName);
  if (!normText || normName.length < 2) return false;
  const escaped = normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s،.!؟@:\\-\\(\\)\\[\\]\\"'/])${escaped}(?:$|[\\s،.!؟:\\-\\(\\)\\[\\]\\"'/])`, 'i');
  return re.test(normText);
}

function findAddressedWelcomeBotSpeaker(content, roomId, s, mentionedUserId = null) {
  const norm = normalizeArabicText(content);
  if (!norm) return null;
  const mainBotName = String(s.welcome_bot_name || 'مساعد الأصيل').trim();
  const targetMentionId = String(mentionedUserId || '').trim();

  if (s.welcome_bot_mode === 'virtual_members') {
    const vms = getActiveVirtualMembersForRooms();
    const sorted = vms.slice().sort((a, b) => (a.roomId === roomId ? -1 : b.roomId === roomId ? 1 : 0));
    if (targetMentionId.startsWith('virtual:')) {
      const byId = sorted.find((v) => v.key === targetMentionId);
      if (byId && textContainsNormalizedBotName(content, byId.name)) return byId;
    }
    for (const vm of sorted) {
      if (textContainsNormalizedBotName(content, vm.name)) return vm;
    }
    if (targetMentionId === 'system:welcomebot' || (mainBotName && textContainsNormalizedBotName(content, mainBotName))) {
      const fallbackVm = sorted[0];
      return fallbackVm || { key: 'system:welcomebot', name: mainBotName, avatarUrl: s.welcome_bot_avatar || '', role: 'vip', isVirtual: false };
    }
    return null;
  }

  if (targetMentionId === 'system:welcomebot') {
    return { key: 'system:welcomebot', name: mainBotName || 'مساعد الأصيل', avatarUrl: s.welcome_bot_avatar || '', role: 'vip', isVirtual: false };
  }
  if (mainBotName && textContainsNormalizedBotName(content, mainBotName)) {
    return { key: 'system:welcomebot', name: mainBotName, avatarUrl: s.welcome_bot_avatar || '', role: 'vip', isVirtual: false };
  }
  const explicitCall =
    /(^|\s)(يا\s*بوت|يا\s*مساعد|البوت|المساعد|@?bot|@?مساعد)($|\s)/i.test(norm) ||
    norm === 'بوت' ||
    norm === 'مساعد';
  if (explicitCall) {
    return { key: 'system:welcomebot', name: mainBotName || 'مساعد الأصيل', avatarUrl: s.welcome_bot_avatar || '', role: 'vip', isVirtual: false };
  }
  return null;
}

async function maybeHandleWelcomeBotMention(entry, roomId, content, { mentionedUserId = null } = {}) {
  try {
    if (!entry || !roomId || !content) return;
    if (String(entry.key || '').startsWith('system:') || String(entry.key || '').startsWith('virtual:')) return;
    const s = db.getSiteSettings();
    if (Number(s.welcome_bot_enabled ?? 1) === 0) return;

    const speaker = findAddressedWelcomeBotSpeaker(content, roomId, s, mentionedUserId);
    if (!speaker) return;

    // Enforce strict 15-second cooldown per user silently
    const now = Date.now();
    const prevAt = welcomeBotCooldownByUser.get(entry.key) || 0;
    if (now - prevAt < 15000) return;
    welcomeBotCooldownByUser.set(entry.key, now);

    const room = db.getRoomById(roomId);
    const roomName = room?.name || 'الغرفة';
    const apiKey = String(s.welcome_bot_gemini_key || '').trim();
    const mainBotName = String(s.welcome_bot_name || 'مساعد الأصيل').trim();

    let reply = null;
    if (apiKey) {
      try {
        const gemRes = await callWelcomeBotGemini(apiKey, {
          question: content,
          userName: entry.name,
          roomName,
          speakerName: speaker.name,
          mainBotName,
          isVirtual: Boolean(speaker.isVirtual)
        });
        if (gemRes?.text) {
          reply = gemRes.text;
        } else if (gemRes?.errorReason) {
          recordWelcomeBotGeminiFailureSilent(gemRes.errorReason);
        }
      } catch (gemErr) {
        recordWelcomeBotGeminiFailureSilent(gemErr?.message || 'تعذر الاتصال');
      }
    }
    if (!reply) {
      const cleanQ = stripBotMentionFromQuestion(content, speaker.name, mainBotName);
      reply = generateSmartFallbackReply(cleanQ, entry.name, roomName, speaker.name);
    }
    const stillOnline = [...onlinePresenceMap.values()].some((e) => e.roomId === roomId);
    if (!stillOnline) return;
    emitWelcomeBotMessage(roomId, reply, speaker);
  } catch (err) {
    console.error('[WelcomeBot Mention Handler Error]', err?.message || err);
  }
}

const VIRTUAL_MEMBER_CHAT_LINES = [
  'مساء النور على الجميع في الغرفة 🌹 كيف أموركم اليوم؟',
  'الأجواء اليوم رايقة جداً، حياكم الله جميعاً ☕✨',
  'منورين الغرفة يا أبطال، شاركونا سواليفكم الحلوة 💬',
  'صلوا على النبي محمد ﷺ — اللهم صل وسلم على نبينا محمد 🤍',
  'أهلاً باللي انضموا معنا الآن، القهوة جاهزة والغرفة منورة بكم 🌟',
  'مين صاحي معنا الآن ويسولف في الدردشة؟ 😄',
  'الكلمة الطيبة تجمع القلوب دائماً — أوقاتاً ممتعة للجميع 🌹'
];

function runVirtualMembersTick() {
  try {
    const s = db.getSiteSettings();
    if (Number(s.welcome_bot_enabled ?? 1) === 0 || s.welcome_bot_mode !== 'virtual_members') return;
    const vms = getActiveVirtualMembersForRooms();
    if (!vms.length) return;
    const now = Date.now();
    const rooms = db.getAllRooms();
    for (const r of rooms) {
      if (getRoomHumanCount(r.id) <= 0) continue;
      const lastAt = lastBotActivityByRoom.get(r.id) || 0;
      if (now - lastAt < 65000) continue;
      const roomVms = vms.filter((v) => v.roomId === r.id);
      if (!roomVms.length) continue;
      // Slight natural randomness so rooms don't all fire simultaneously
      if (Math.random() > 0.55) continue;
      const speaker = roomVms[Math.floor(Math.random() * roomVms.length)];
      const line = VIRTUAL_MEMBER_CHAT_LINES[Math.floor(Math.random() * VIRTUAL_MEMBER_CHAT_LINES.length)];
      emitWelcomeBotMessage(r.id, line, speaker);
    }
  } catch (err) {
    console.error('[VirtualMembersTick Error]', err?.message || err);
  }
}

function startVirtualMembersLoop() {
  if (virtualMembersLoopTimer) clearInterval(virtualMembersLoopTimer);
  virtualMembersLoopTimer = setInterval(runVirtualMembersTick, 65000);
}

app.get('/api/owner/suite', requireOwner, (_req, res) => {
  const liveSockets = [];
  const hiddenOnline = [];
  for (const e of onlinePresenceMap.values()) {
    const rm = e.roomId ? db.getRoomById(e.roomId) : null;
    const item = {
      clientId: e.key,
      key: e.key,
      userId: e.userId,
      isGuest: e.isGuest,
      name: e.name,
      role: e.role,
      roomId: e.roomId || '',
      roomName: rm ? rm.name : '',
      ipAddress: e.ipAddress || '',
      deviceId: e.deviceId || '',
      fingerprint: e.fingerprint || '',
      userAgent: e.userAgent || '',
      country: e.country || '',
      isStealth: isStealthEntry(e),
      isFrozen: Boolean(e.isFrozen || guestFrozenKeys.has(e.key)),
      isShadowMuted: Boolean(e.isShadowMuted || guestShadowMutedKeys.has(e.key)),
      isGhosted: Boolean(e.isGhosted)
    };
    liveSockets.push(item);
    if (item.isStealth || item.isGhosted || item.isShadowMuted) hiddenOnline.push(item);
  }

  // Multi-account detector by IP, Device ID, or Fingerprint
  const byIp = new Map();
  const byDev = new Map();
  const byFp = new Map();
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
      lastFingerprint: u.last_fingerprint || '',
      lastUa: u.last_ua || '',
      country: u.country || '',
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
    if (mapped.lastFingerprint) {
      const arr = byFp.get(mapped.lastFingerprint) || [];
      arr.push(mapped);
      byFp.set(mapped.lastFingerprint, arr);
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
  for (const [fp, grp] of byFp.entries()) {
    if (grp.length >= 2) multiAccounts.push({ type: 'Fingerprint', fingerprint: fp, accounts: grp });
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
    bans: db.getAllBans(),
    mutes: db.getAllActiveMutes(),
    adminLogs: db.getAdminLogs(100),
    pmLinkAlerts: db.getPmLinkAlerts(60),
    violationLogs: db.getViolationLogs(150),
    roomBans: db.getRoomBans(),
    activeQuizRooms,
    quizSettings: {
      quiz_bot_enabled: settings.quiz_bot_enabled === 0 ? 0 : 1,
      quiz_interval_sec: Number(settings.quiz_interval_sec) || 25,
      quiz_hint_sec: Number(settings.quiz_hint_sec) || 12,
      quiz_reward_coins: Number(settings.quiz_reward_coins) || 100,
      quiz_msg_style: settings.quiz_msg_style || 'royal_gold',
      quiz_custom_questions: Array.isArray(settings.quiz_custom_questions) ? settings.quiz_custom_questions : [],
      builtinCount: QUIZ_BANK.length
    },
    welcomeBotSettings: {
      welcome_bot_enabled: settings.welcome_bot_enabled === 0 ? 0 : 1,
      welcome_bot_mode: settings.welcome_bot_mode === 'virtual_members' ? 'virtual_members' : 'assistant',
      welcome_bot_name: String(settings.welcome_bot_name || 'مساعد الأصيل'),
      welcome_bot_avatar: String(settings.welcome_bot_avatar || ''),
      welcome_bot_greeting: String(settings.welcome_bot_greeting || ''),
      welcome_bot_gemini_key: String(settings.welcome_bot_gemini_key || ''),
      welcome_bot_color: String(settings.welcome_bot_color || 'royal_gold'),
      virtual_members_list: Array.isArray(settings.virtual_members_list) ? settings.virtual_members_list : [],
      lastGeminiStatus: lastWelcomeBotGeminiStatus
    },
    protections: {
      allow_guests: settings.allow_guests === 0 ? 0 : 1,
      allow_register: settings.allow_register === 0 ? 0 : 1,
      global_chat_mute: Number(settings.global_chat_mute) === 1 ? 1 : 0,
      lock_guest_images: Number(settings.lock_guest_images) || 0,
      block_vpn: Number(settings.block_vpn) || 0,
      banned_words: Array.isArray(settings.banned_words) ? settings.banned_words : [],
      antiflood_enabled: settings.antiflood_enabled === 0 ? 0 : 1,
      antiflood_max_msgs: Number(settings.antiflood_max_msgs) || 6,
      antiflood_window_sec: Number(settings.antiflood_window_sec) || 10,
      antiflood_mute_mins: Number(settings.antiflood_mute_mins) || 5,
      banned_word_mute_mins: Number(settings.banned_word_mute_mins) || 10,
      online_boost: Number(settings.online_boost) || 0,
      lucky_box_enabled: settings.lucky_box_enabled === 0 ? 0 : 1,
      lucky_box_min: Number(settings.lucky_box_min) || 50,
      lucky_box_max: Number(settings.lucky_box_max) || 500,
      referral_bonus: Number(settings.referral_bonus) || 200,
      fx_owner_galaxy_identity: settings.fx_owner_galaxy_identity === 0 ? 0 : 1,
      fx_glass_bubbles: settings.fx_glass_bubbles === 0 ? 0 : 1,
      fx_mic_waves: settings.fx_mic_waves === 0 ? 0 : 1,
      fx_cinematic_entrance: settings.fx_cinematic_entrance === 0 ? 0 : 1,
      fx_typing_avatars: settings.fx_typing_avatars === 0 ? 0 : 1,
      fx_night_atmosphere: settings.fx_night_atmosphere || 'off',
      guest_can_chat: settings.guest_can_chat === 0 ? 0 : 1,
      min_rank_pm: settings.min_rank_pm || 'member',
      min_rank_chat_media: settings.min_rank_chat_media || 'member',
      min_rank_mic: settings.min_rank_mic || 'guest',
      min_rank_avatar: settings.min_rank_avatar || 'member',
      min_rank_cover: settings.min_rank_cover || 'member',
      min_rank_bg_effect: settings.min_rank_bg_effect || 'member',
      min_rank_music: settings.min_rank_music || 'member',
      min_rank_name_style: settings.min_rank_name_style || 'member',
      min_rank_msg_style: settings.min_rank_msg_style || 'member',
      feat_mics: settings.feat_mics === 0 ? 0 : 1,
      feat_pm: settings.feat_pm === 0 ? 0 : 1,
      feat_store: settings.feat_store === 0 ? 0 : 1,
      feat_gifts: settings.feat_gifts === 0 ? 0 : 1,
      feat_youtube: settings.feat_youtube === 0 ? 0 : 1,
      feat_wall: settings.feat_wall === 0 ? 0 : 1,
      feat_profile_likes: settings.feat_profile_likes === 0 ? 0 : 1,
      feat_profile_rating: settings.feat_profile_rating === 0 ? 0 : 1,
      feat_profile_music: settings.feat_profile_music === 0 ? 0 : 1,
      feat_profile_friends: settings.feat_profile_friends === 0 ? 0 : 1,
      feat_profile_gifts: settings.feat_profile_gifts === 0 ? 0 : 1,
      feat_profile_relations: settings.feat_profile_relations === 0 ? 0 : 1,
      feat_profile_wall: settings.feat_profile_wall === 0 ? 0 : 1,
      custom_drawer_sections: Array.isArray(settings.custom_drawer_sections) ? settings.custom_drawer_sections : [],
      custom_profile_fields: Array.isArray(settings.custom_profile_fields) ? settings.custom_profile_fields : [],
      royal_member_ruby_multiplier: Number(settings.royal_member_ruby_multiplier) || 1.2,
      vip_ruby_multiplier: Number(settings.vip_ruby_multiplier) || 1.5,
      premium_ruby_multiplier: Number(settings.premium_ruby_multiplier) || 2,
      rank_price_royal_member: Number(settings.rank_price_royal_member ?? 300),
      rank_price_royal_vip: Number(settings.rank_price_royal_vip ?? 800),
      rank_price_premium: Number(settings.rank_price_premium ?? 1500),
      frame_price_overrides: settings.frame_price_overrides || {}
    },
    storageStatus: db.getStorageStatus(),
    framesCatalog: getEffectiveFramesCatalog(),
    ranks: db.getAllRanks(),
    adUnits: Array.isArray(settings.ad_units) ? settings.ad_units : []
  });
});

app.put('/api/owner/ads', requireOwner, async (req, res) => {
  const incoming = Array.isArray(req.body?.adUnits)
    ? req.body.adUnits
    : Array.isArray(req.body?.ad_units)
      ? req.body.ad_units
      : [];
  db.updateSiteSettings({ ad_units: incoming });
  const pub = db.getPublicSiteSettings();
  await db.flushWrites();
  return res.json({
    ok: true,
    adUnits: Array.isArray(pub.ad_units) ? pub.ad_units : [],
    settings: pub
  });
});

app.post('/api/owner/action', requireOwner, async (req, res) => {
  const { action, targetKey, targetUserId, rubyDelta, activityDelta, roomId, toRoomId, enabled, message, content, title, asMode, targetUserKey, amountPerUser, rewardCoins, ipAddress, deviceId, reason, protections, rolePermissions } = req.body || {};
  const actor = req.authUser;

  if (action === 'manage_ruby') {
    const rawId = targetUserId || (String(targetKey || '').startsWith('user:') ? String(targetKey).replace('user:', '') : '');
    const uid = Number(rawId);
    if (!uid) return res.status(400).json({ error: 'يرجى تحديد عضو مسجل.' });
    const rDelta = Number(rubyDelta) || 0;
    const aDelta = Number(activityDelta) || 0;
    if (rDelta === 0 && aDelta === 0) {
      return res.status(400).json({ error: 'يرجى إدخال كمية روبي أو نقاط تفاعل.' });
    }
    const updated = db.adjustUserRubyAndActivity(uid, { rubyDelta: rDelta, activityDelta: aDelta });
    if (!updated) return res.status(404).json({ error: 'العضو غير موجود.' });
    const promo = aDelta > 0 ? db.checkAndApplyAutoPromotion(uid) : null;
    syncUserPresence(uid);
    const finalUser = promo?.user || updated;
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: rDelta >= 0 ? 'إضافة روبي/نقاط' : 'خصم روبي/نقاط',
      targetKey: `user:${uid}`,
      targetName: db.getEffectiveName(finalUser),
      details: `روبي: ${rDelta >= 0 ? `+${rDelta}` : rDelta} • تفاعل: ${aDelta >= 0 ? `+${aDelta}` : aDelta}`
    });
    await db.flushWrites();
    return res.json({ ok: true, user: mapUserRow(finalUser) });
  }

  if (action === 'shadow_mute') {
    if (!targetKey || db.isProtectedSupremeOwnerKey(targetKey)) {
      return res.status(403).json({ error: 'لا يمكن تطبيق الكتم الصامت على هذا الحساب.' });
    }
    if (String(targetKey).startsWith('user:')) {
      const uid = Number(String(targetKey).replace('user:', ''));
      const r = db.setUserShadowMuted(uid, Boolean(enabled));
      if (r?.error) return res.status(400).json({ error: r.error });
      syncUserPresence(uid);
    } else {
      if (enabled) guestShadowMutedKeys.add(targetKey);
      else guestShadowMutedKeys.delete(targetKey);
      const liveEntry = onlinePresenceMap.get(targetKey);
      if (liveEntry) {
        liveEntry.isShadowMuted = Boolean(enabled);
        db.syncOnlinePresenceDoc(buildPublicPresenceDoc(liveEntry));
      }
      db.patchUserStateDoc(targetKey, { isShadowMuted: Boolean(enabled) });
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
      syncUserPresence(uid);
    } else {
      if (enabled) guestFrozenKeys.add(targetKey);
      else guestFrozenKeys.delete(targetKey);
    }
    const liveEntry = onlinePresenceMap.get(targetKey);
    if (liveEntry) {
      liveEntry.isFrozen = Boolean(enabled);
      db.syncOnlinePresenceDoc(buildPublicPresenceDoc(liveEntry));
    }
    db.patchUserStateDoc(targetKey, { isFrozen: Boolean(enabled) });
    emitToUserKey(targetKey, 'user_state', { isFrozen: Boolean(enabled) });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: enabled ? 'تجميد عضو' : 'فك تجميد عضو', targetKey, targetName: targetKey });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'move_user') {
    const destRoom = db.getRoomById(toRoomId);
    if (!targetKey || !destRoom) return res.status(400).json({ error: 'الهدف أو الغرفة غير صالحة.' });
    let moved = 0;
    const liveEntry = onlinePresenceMap.get(targetKey);
    if (liveEntry) {
      movePresenceToRoom(liveEntry, toRoomId, {}, false);
      db.patchUserStateDoc(targetKey, {
        forceRoomId: toRoomId,
        forceRoomNotice: `تم سحبك ونقلك إلى غرفة "${destRoom.name}" بواسطة المالك.`,
        forceRoomAt: Date.now()
      });
      emitToUserKey(targetKey, 'forced_room_move', {
        roomId: toRoomId,
        notice: `تم سحبك ونقلك إلى غرفة "${destRoom.name}" بواسطة المالك.`
      });
      moved = 1;
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'سحب ونقل عضو', targetKey, details: `إلى ${destRoom.name} (${moved})` });
    await db.flushWrites();
    return res.json({ ok: true, moved });
  }

  if (action === 'freeze_room') {
    const updated = db.setRoomFrozen(roomId, Boolean(enabled));
    if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    const pubRoom = db.sanitizeRoomForPublic(updated);
    if (io && pubRoom) io.to(roomId).emit('room_updated', pubRoom);
    broadcastRoomsList();
    emitRoomNoticeMessage(
      roomId,
      enabled ? `❄️ تم تجميد الغرفة (للقراءة فقط) بواسطة ${actor.name}.` : `🔥 تم فك تجميد الغرفة بواسطة ${actor.name}.`
    );
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: enabled ? 'تجميد غرفة' : 'فك تجميد غرفة', targetKey: roomId, targetName: updated.name });
    await db.flushWrites();
    return res.json({ ok: true, room: pubRoom });
  }

  if (action === 'clear_room') {
    if (!roomId || !db.getRoomById(roomId)) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    db.clearRoomMessages(roomId);
    emitRoomNoticeMessage(roomId, `🧹 تم تنظيف الغرفة بواسطة ${actor.name}.`, { clientMsgId: `room_cleared:${Date.now()}` });
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
        db.patchUserStateDoc(sl.holderKey, { micForceMuteAt: Date.now(), micForceMuted: true });
        emitToUserKey(sl.holderKey, 'user_state', { micForceMuteAt: Date.now(), micForceMuted: true });
      }
    }
    syncRoomMicsToFirestore(roomId);
    emitRoomNoticeMessage(roomId, '🔇 تم كتم جميع المايكات في الغرفة بأمر المالك.');
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'كتم كل المايكات', targetKey: roomId });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'pin_message') {
    const updated = db.setRoomPinnedMessage(roomId, message || '', actor.name);
    if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
    const pubRoom = db.sanitizeRoomForPublic(updated);
    if (io && pubRoom) io.to(roomId).emit('room_updated', pubRoom);
    broadcastRoomsList();
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: message ? 'تثبيت رسالة ملكية' : 'إزالة الرسالة المثبتة', targetKey: roomId, details: String(message || '').slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true, room: pubRoom });
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
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: asMode === 'user' ? 'إرسال نيابة عن عضو' : 'إرسال باسم النظام', targetKey: roomId, details: clean.slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true, msg });
  }

  if (action === 'global_broadcast') {
    const clean = String(content || '').trim().slice(0, 500);
    if (!clean) return res.status(400).json({ error: 'أدخل نص الإعلان العام.' });
    const cleanTitle = String(title || '📢 إعلان إداري عاجل').trim().slice(0, 80);
    db.updateSiteSettings({
      last_global_broadcast: { title: cleanTitle, content: clean, byName: actor.name, ts: Date.now() }
    });
    for (const r of db.getAllRooms()) {
      db.addMessage({
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
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'إعلان عام لكل الغرف', details: clean.slice(0, 80) });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'golden_rain') {
    const amt = Math.max(10, Math.min(10000, Number(amountPerUser) || 100));
    const targetRoomId = roomId || 'general';
    const recipientIds = new Set();
    for (const e of onlinePresenceMap.values()) {
      if (e.userId && (targetRoomId === 'all' || e.roomId === targetRoomId) && !isStealthEntry(e)) {
        recipientIds.add(e.userId);
      }
    }
    for (const uid of recipientIds) {
      db.adjustUserCoins(uid, amt);
      syncUserPresence(uid);
      db.patchUserStateDoc(`user:${uid}`, {
        goldenRainAt: Date.now(),
        goldenRainAmount: amt,
        goldenRainBy: actor.name
      });
      emitToUserKey(`user:${uid}`, 'gold_rain', { amount: amt, by: actor.name });
    }
    const roomsToAnnounce = targetRoomId === 'all' ? db.getAllRooms().map((r) => r.id) : [targetRoomId];
    for (const rid of roomsToAnnounce) {
      if (!db.getRoomById(rid)) continue;
      db.addMessage({
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
    const reward = rewardCoins !== undefined ? Math.max(10, Math.min(5000, Number(rewardCoins) || 100)) : null;
    startQuizBotInRoom(targetRoomId, reward);
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تشغيل بوت المسابقات', targetKey: targetRoomId, details: 'نظام تدرجي ذكي' });
    await db.flushWrites();
    return res.json({ ok: true, active: true });
  }

  if (action === 'quiz_save_settings') {
    const { intervalSec, hintSec, rewardCoins: nextReward, msgStyle, enabled: botEnabled } = req.body || {};
    const patch = {};
    if (intervalSec !== undefined) patch.quiz_interval_sec = Math.max(10, Math.min(120, Number(intervalSec) || 25));
    if (hintSec !== undefined) patch.quiz_hint_sec = Math.max(5, Math.min(90, Number(hintSec) || 12));
    if (nextReward !== undefined) patch.quiz_reward_coins = Math.max(10, Math.min(5000, Number(nextReward) || 100));
    if (msgStyle !== undefined) patch.quiz_msg_style = msgStyle;
    if (botEnabled !== undefined) patch.quiz_bot_enabled = botEnabled ? 1 : 0;
    const updated = db.updateSiteSettings(patch);
    for (const b of roomQuizBots.values()) {
      if (updated.quiz_reward_coins) b.rewardCoins = Number(updated.quiz_reward_coins) || 100;
    }
    const pubSettings = db.getPublicSiteSettings();
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تحديث إعدادات بوت المسابقات', details: `${updated.quiz_interval_sec}ث / ${updated.quiz_reward_coins} روبي` });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'quiz_add_question') {
    const { category, q, answers, displayAnswer } = req.body || {};
    const cleanQ = String(q || '').trim().slice(0, 240);
    const ansList = Array.isArray(answers)
      ? answers.map((s) => String(s || '').trim()).filter(Boolean)
      : String(answers || displayAnswer || '').split(/[,،|]/).map((s) => s.trim()).filter(Boolean);
    const cleanDisp = String(displayAnswer || ansList[0] || '').trim().slice(0, 80);
    if (!cleanQ || !cleanDisp) return res.status(400).json({ error: 'يرجى كتابة نص السؤال والإجابة الصحيحة.' });
    const existing = Array.isArray(db.getSiteSettings().quiz_custom_questions) ? [...db.getSiteSettings().quiz_custom_questions] : [];
    const newItem = {
      id: `cq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      category: String(category || 'مخصصة').trim().slice(0, 30) || 'مخصصة',
      q: cleanQ,
      displayAnswer: cleanDisp,
      a: ansList.length ? ansList : [cleanDisp]
    };
    const updated = db.updateSiteSettings({ quiz_custom_questions: [newItem, ...existing] });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'إضافة سؤال لبنك المسابقات', details: cleanQ.slice(0, 60) });
    await db.flushWrites();
    return res.json({ ok: true, question: newItem, questions: updated.quiz_custom_questions });
  }

  if (action === 'quiz_update_question') {
    const { questionId, category, q, answers, displayAnswer } = req.body || {};
    const curList = Array.isArray(db.getSiteSettings().quiz_custom_questions) ? [...db.getSiteSettings().quiz_custom_questions] : [];
    const idx = curList.findIndex((item) => item.id === String(questionId || ''));
    if (idx === -1) return res.status(404).json({ error: 'السؤال غير موجود.' });
    const cleanQ = String(q || curList[idx].q).trim().slice(0, 240);
    const ansList = Array.isArray(answers)
      ? answers.map((s) => String(s || '').trim()).filter(Boolean)
      : String(answers || displayAnswer || curList[idx].displayAnswer).split(/[,،|]/).map((s) => s.trim()).filter(Boolean);
    const cleanDisp = String(displayAnswer || ansList[0] || curList[idx].displayAnswer).trim().slice(0, 80);
    curList[idx] = {
      ...curList[idx],
      category: String(category || curList[idx].category || 'مخصصة').trim().slice(0, 30),
      q: cleanQ,
      displayAnswer: cleanDisp,
      a: ansList.length ? ansList : [cleanDisp]
    };
    const updated = db.updateSiteSettings({ quiz_custom_questions: curList });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تعديل سؤال في المسابقات', details: cleanQ.slice(0, 60) });
    await db.flushWrites();
    return res.json({ ok: true, questions: updated.quiz_custom_questions });
  }

  if (action === 'quiz_delete_question') {
    const { questionId } = req.body || {};
    const curList = Array.isArray(db.getSiteSettings().quiz_custom_questions) ? [...db.getSiteSettings().quiz_custom_questions] : [];
    const nextList = curList.filter((item) => item.id !== String(questionId || ''));
    const updated = db.updateSiteSettings({ quiz_custom_questions: nextList });
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'حذف سؤال من المسابقات', details: String(questionId || '') });
    await db.flushWrites();
    return res.json({ ok: true, questions: updated.quiz_custom_questions });
  }

  if (action === 'ban_ip') {
    const bKey = targetKey || `ip:${ipAddress || deviceId}`;
    if (!ipAddress && !deviceId && !targetKey) return res.status(400).json({ error: 'أدخل IP أو معرف الجهاز.' });
    if (db.isProtectedSupremeOwnerKey(bKey)) return res.status(403).json({ error: 'محمي.' });
    const banReasonText = String(reason || '').trim() || 'حظر IP / جهاز من المالك';
    db.banTarget({
      targetKey: bKey,
      targetName: ipAddress || deviceId || bKey,
      ipAddress: ipAddress || '',
      deviceId: deviceId || '',
      banType: 'xban',
      reason: banReasonText,
      bannedBy: actor.name,
      bannedByKey: actor.key
    });
    for (const e of [...onlinePresenceMap.values()]) {
      if ((ipAddress && e.ipAddress === ipAddress) || (deviceId && e.deviceId === deviceId) || (targetKey && e.key === targetKey)) {
        if (e.role !== 'site_owner') {
          kickTargetFromPresence(e.key, { reason: 'تم حظرك من الشات', banned: true });
        }
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'حظر IP/جهاز', targetKey: bKey, details: banReasonText });
    notifyOwnersModerationEvent({
      actorName: actor.name,
      actorKey: actor.key,
      targetName: ipAddress || deviceId || bKey,
      targetKey: bKey,
      actionType: 'xban',
      reason: banReasonText
    });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  if (action === 'update_protections') {
    db.updateSiteSettings(protections || {});
    const pubSettings = db.getPublicSiteSettings();
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تحديث إعدادات الحماية والمميزات' });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'update_master_matrix') {
    if (protections) db.updateSiteSettings(protections);
    const pubSettings = db.getPublicSiteSettings();
    if (rolePermissions && typeof rolePermissions === 'object') {
      for (const [rKey, perms] of Object.entries(rolePermissions)) {
        if (rKey === 'site_owner' || rKey === 'guest') continue;
        const r = db.updateRank(rKey, { permissions: perms });
        if (r && !r.error) {
          for (const entry of onlinePresenceMap.values()) {
            if (entry.role === rKey && entry.userId) syncUserPresence(entry.userId);
          }
        }
      }
    }
    db.addAdminLog({ actorKey: actor.key, actorName: actor.name, actorRole: actor.role, action: 'تحديث مصفوفة الصلاحيات الشاملة' });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings, ranks: db.getAllRanks() });
  }

  if (action === 'save_custom_drawer_sections') {
    const { sections } = req.body || {};
    const updated = db.updateSiteSettings({ custom_drawer_sections: Array.isArray(sections) ? sections : [] });
    const pubSettings = db.getPublicSiteSettings();
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'تحديث أقسام القائمة الجانبية',
      details: `${(updated.custom_drawer_sections || []).length} قسم`
    });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'save_profile_builder') {
    const { fields, toggles } = req.body || {};
    const patch = {};
    if (Array.isArray(fields)) patch.custom_profile_fields = fields;
    if (toggles && typeof toggles === 'object') {
      const allowedToggles = [
        'feat_profile_likes',
        'feat_profile_rating',
        'feat_profile_music',
        'feat_profile_friends',
        'feat_profile_gifts',
        'feat_profile_relations',
        'feat_profile_wall'
      ];
      for (const tk of allowedToggles) {
        if (toggles[tk] !== undefined) patch[tk] = toggles[tk] ? 1 : 0;
      }
    }
    const updated = db.updateSiteSettings(patch);
    const pubSettings = db.getPublicSiteSettings();
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'تحديث حقول وميزات الملف الشخصي',
      details: `${(updated.custom_profile_fields || []).length} حقل ديناميكي`
    });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'welcome_bot_save') {
    const body = req.body || {};
    const patch = {};
    if (body.welcome_bot_enabled !== undefined) patch.welcome_bot_enabled = body.welcome_bot_enabled ? 1 : 0;
    if (body.welcome_bot_mode !== undefined) {
      patch.welcome_bot_mode = body.welcome_bot_mode === 'virtual_members' ? 'virtual_members' : 'assistant';
    }
    if (body.welcome_bot_name !== undefined) patch.welcome_bot_name = String(body.welcome_bot_name || '');
    if (body.welcome_bot_avatar !== undefined) patch.welcome_bot_avatar = String(body.welcome_bot_avatar || '');
    if (body.welcome_bot_greeting !== undefined) patch.welcome_bot_greeting = String(body.welcome_bot_greeting || '');
    if (body.welcome_bot_gemini_key !== undefined) patch.welcome_bot_gemini_key = String(body.welcome_bot_gemini_key || '');
    if (body.welcome_bot_color !== undefined) patch.welcome_bot_color = String(body.welcome_bot_color || 'royal_gold');
    if (Array.isArray(body.virtual_members_list)) patch.virtual_members_list = body.virtual_members_list;

    const fullUpdated = db.updateSiteSettings(patch);
    const pubSettings = db.getPublicSiteSettings();
    startVirtualMembersLoop();
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'تحديث إعدادات البوت الترحيبي الذكي',
      details: `الوضع: ${fullUpdated.welcome_bot_mode === 'virtual_members' ? 'أعضاء افتراضيين' : 'بوت مساعد ذكي'} • اللون: ${fullUpdated.welcome_bot_color}`
    });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'toggle_emergency') {
    const keyMap = {
      allow_guests: 'قفل/فتح دخول الزوار',
      allow_register: 'قفل/فتح تسجيل الحسابات',
      global_chat_mute: 'الكتم الشامل للدردشة العامة'
    };
    const field = String(req.body?.field || '').trim();
    if (!keyMap[field]) {
      return res.status(400).json({ error: 'حقل الطوارئ غير صالح.' });
    }
    const val = req.body?.enabled ? 1 : 0;
    db.updateSiteSettings({ [field]: val });
    const pubSettings = db.getPublicSiteSettings();
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: `طوارئ المالك: ${keyMap[field]}`,
      details: val ? 'مفعل (1)' : 'معطل (0)'
    });
    await db.flushWrites();
    return res.json({ ok: true, settings: pubSettings });
  }

  if (action === 'clear_all_rooms') {
    const clearedCount = db.clearAllRoomsMessages();
    const rooms = db.getAllRooms();
    for (const r of rooms) {
      emitRoomNoticeMessage(r.id, `🧹 تم تنظيف جميع الغرف بأمر صاحب الموقع (${actor.name}).`, {
        clientMsgId: `room_cleared:${Date.now()}_${r.id}`
      });
    }
    db.addAdminLog({
      actorKey: actor.key,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'تنظيف جميع الغرف دفعة واحدة',
      details: `تم حذف ${clearedCount} رسالة`
    });
    await db.flushWrites();
    return res.json({ ok: true, clearedCount });
  }

  return res.status(400).json({ error: 'إجراء غير معروف.' });
});

app.get('/api/owner/backup', requireOwner, async (_req, res) => {
  try {
    await db.flushWrites();
    const dbBackup = await db.exportFullBackup();
    const uploads = [];
    const subdirs = ['avatars', 'covers', 'news', 'emojis', 'wallpapers', 'chat'];
    for (const sub of subdirs) {
      const dirPath = path.join(UPLOAD_ROOT, sub);
      if (!fs.existsSync(dirPath)) continue;
      let files = [];
      try {
        files = fs.readdirSync(dirPath);
      } catch {
        files = [];
      }
      for (const fname of files) {
        if (!fname || fname.startsWith('.') || fname.includes('..')) continue;
        const full = path.join(dirPath, fname);
        try {
          const stat = fs.statSync(full);
          if (!stat.isFile() || stat.size > 8 * 1024 * 1024) continue;
          const buf = await fs.promises.readFile(full);
          uploads.push({
            subdir: sub,
            filename: fname,
            dataBase64: buf.toString('base64')
          });
        } catch {
          // skip unreadable upload file
        }
      }
    }
    const bundle = {
      format: 'asil-chat-full-backup-v1',
      exportedAt: new Date().toISOString(),
      db: dbBackup,
      uploads
    };
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="asil-chat-backup-${stamp}.json"`);
    return res.send(JSON.stringify(bundle));
  } catch (err) {
    return res.status(500).json({ error: `تعذر إنشاء النسخة الاحتياطية: ${err.message}` });
  }
});

app.post('/api/owner/restore', requireOwner, express.json({ limit: '80mb' }), async (req, res) => {
  try {
    const raw = req.body || {};
    const dbPayload = raw.db && typeof raw.db === 'object' ? raw.db : raw;
    const uploadsList = Array.isArray(raw.uploads) ? raw.uploads : [];
    const allowedSubdirs = new Set(['avatars', 'covers', 'news', 'emojis', 'wallpapers', 'chat']);

    for (const up of uploadsList) {
      const sub = String(up?.subdir || '');
      const fname = path.basename(String(up?.filename || '')).replace(/[^a-zA-Z0-9._-]/g, '');
      const b64 = String(up?.dataBase64 || '');
      if (!allowedSubdirs.has(sub) || !fname || !b64) continue;
      const targetDir = path.join(UPLOAD_ROOT, sub);
      fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, fname);
      await fs.promises.writeFile(targetPath, Buffer.from(b64, 'base64'));
    }

    const result = await db.restoreFullBackup(dbPayload, { preserveSessionId: req.sessionId || '' });
    if (result?.error) return res.status(400).json({ error: result.error });

    const pubSettings = db.getPublicSiteSettings();
    for (const entry of onlinePresenceMap.values()) {
      if (entry.userId) syncUserPresence(entry.userId);
    }

    db.addAdminLog({
      actorKey: req.authUser.key,
      actorName: req.authUser.name,
      actorRole: req.authUser.role,
      action: 'استعادة نسخة احتياطية كاملة للبيانات',
      details: `مستخدمون: ${result.counts?.users || 0} • غرف: ${result.counts?.rooms || 0} • رسائل: ${result.counts?.messages || 0}`
    });
    await db.flushWrites();

    return res.json({
      ok: true,
      counts: result.counts,
      storageStatus: db.getStorageStatus(),
      settings: pubSettings,
      ranks: db.getAllRanks()
    });
  } catch (err) {
    return res.status(500).json({ error: `فشلت استعادة البيانات: ${err.message}` });
  }
});

// ==========================================
// PRESENCE, ROOMS, MICS & REST REAL-TIME API (FIRESTORE-BACKED, ZERO SOCKET.IO)
// ==========================================
function resolveOnlineSessionFromRequest(req, roomIdHint = null) {
  const telemetry = getClientTelemetry(req);
  let entry = onlinePresenceMap.get(req.authUser.key);
  if (!entry) {
    const fallbackRoom =
      roomIdHint && db.getRoomById(roomIdHint)
        ? roomIdHint
        : req.headers['x-room-id'] && db.getRoomById(String(req.headers['x-room-id']))
          ? String(req.headers['x-room-id'])
          : db.getAllRooms()[0]?.id || 'general';
    entry = upsertOnlinePresence(req.authUser, telemetry, fallbackRoom);
  } else {
    Object.assign(entry, req.authUser, {
      ipAddress: telemetry.ip || entry.ipAddress || '',
      deviceId: telemetry.deviceId || entry.deviceId || '',
      fingerprint: telemetry.fingerprint || entry.fingerprint || '',
      userAgent: telemetry.userAgent || entry.userAgent || '',
      country: telemetry.country || req.authUser.country || entry.country || '',
      lastSeenMs: Date.now(),
      lastHeartbeat: Date.now()
    });
    if (roomIdHint && !entry.roomId && db.getRoomById(roomIdHint)) {
      entry.roomId = roomIdHint;
    }
    db.syncOnlinePresenceDoc(buildPublicPresenceDoc(entry));
  }
  return entry;
}

function releaseUserMicsInRoom(userKey, roomId) {
  if (!roomId || !userKey) return;
  const slots = ensureRoomMicSlots(roomId);
  let changed = false;
  for (const slot of slots) {
    if (slot.holderKey === userKey) {
      slot.holderKey = null;
      slot.holderSocketId = null;
      slot.holderName = null;
      slot.holderRole = null;
      slot.holderAvatar = null;
      slot.isSelfMuted = false;
      slot.isAdminMuted = false;
      slot.isSpeaking = false;
      slot.speakingLevel = 0;
      changed = true;
    }
  }
  if (changed) {
    syncRoomMicsToFirestore(roomId);
  }
}

function movePresenceToRoom(entry, targetRoomId, telemetry = {}, isSilentReconnect = false) {
  if (!entry) return { error: 'جلسة غير صالحة.' };
  const room = db.getRoomById(targetRoomId);
  if (!room) return { error: 'الغرفة غير موجودة.' };

  const oldRoomId = entry.roomId;
  if (oldRoomId && oldRoomId !== targetRoomId) {
    releaseUserMicsInRoom(entry.key, oldRoomId);
    entry.roomId = null;
    pauseQuizBotIfRoomEmpty(oldRoomId);
  }

  entry.roomId = targetRoomId;
  entry.lastSeenMs = Date.now();
  entry.lastHeartbeat = Date.now();
  if (telemetry.ip) entry.ipAddress = telemetry.ip;
  if (telemetry.deviceId) entry.deviceId = telemetry.deviceId;
  if (telemetry.fingerprint) entry.fingerprint = telemetry.fingerprint;
  db.syncOnlinePresenceDoc(buildPublicPresenceDoc(entry));

  const sockSet = userSocketsMap.get(entry.key);
  if (sockSet && sockSet.size) {
    for (const sock of sockSet) {
      try {
        if (oldRoomId && oldRoomId !== targetRoomId) sock.leave(oldRoomId);
        sock.join(targetRoomId);
      } catch {
        // ignore
      }
    }
  }
  if (oldRoomId && oldRoomId !== targetRoomId) broadcastRoomUsers(oldRoomId);
  broadcastRoomUsers(targetRoomId);
  broadcastGlobalOnlineUsers();
  broadcastRoomsList();

  ensureCompetitionsQuizBotRunning(targetRoomId);
  const qBot = roomQuizBots.get(targetRoomId);
  const pubRoom = db.sanitizeRoomForPublic(room);
  const isManager = db.isRoomManager(targetRoomId, entry.userId, entry.role);
  const canStyleRoom = db.hasRoomOwnerPermission(targetRoomId, entry.userId, entry.role, 'style_bg');
  const activeMuteRow = db.getActiveMute(entry.key, targetRoomId);

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

  let royalEntrance = null;
  let joinNotice = null;
  if (!isSilentReconnect && !rejoiningSameRoom && !recentlyInSameRoom && oldRoomId !== targetRoomId && !isStealthEntry(entry)) {
    const rank = db.getRankByKey(entry.role);
    const isOwnerJoin = entry.role === 'site_owner';
    const customJoinTpl = String(db.getSiteSettings().owner_join_message || '').trim();
    const ownerJoinText = customJoinTpl
      ? customJoinTpl.includes('[الاسم]')
        ? customJoinTpl.replace(/\[الاسم\]/g, entry.name)
        : customJoinTpl.includes('{name}')
          ? customJoinTpl.replace(/\{name\}/g, entry.name)
          : `${customJoinTpl} • ${entry.name}`
      : `انضم إلى الغرفه مؤسس ومالك الشات ${entry.name} • أهلاً بك`;

    if (isOwnerJoin) {
      royalEntrance = {
        roomId: targetRoomId,
        name: entry.name,
        avatarUrl: entry.avatarUrl || '',
        rankLabel: rank.label,
        joinMessage: ownerJoinText
      };
    }
    const noticeText = isOwnerJoin ? ownerJoinText : `✓ انضم "${entry.name}" إلى الغرفة`;
    joinNotice = {
      kind: isOwnerJoin ? 'royal_join' : 'join',
      text: noticeText,
      joinMessage: ownerJoinText
    };
    emitRoomNoticeMessage(
      targetRoomId,
      noticeText,
      {
        senderKey: isOwnerJoin ? 'system:royal_join' : 'system:join',
        senderName: entry.name,
        senderRole: entry.role,
        avatarUrl: entry.avatarUrl || '',
        avatarFrame: entry.avatarFrame || 'none',
        nameColor: entry.nameColor || '#fbbf24',
        textColor: isOwnerJoin ? '#fde68a' : '#cbd5e1',
        clientMsgId: isOwnerJoin ? `royal_join:${entry.key}:${Date.now()}` : `join:${entry.key}:${Date.now()}`
      }
    );
    triggerWelcomeBotOnRoomJoin(entry, pubRoom);
  }

  const messages = db.getRoomMessages(targetRoomId, 100, entry.key);

  return {
    room: pubRoom,
    isRoomManager: isManager,
    canStyleRoom,
    messages,
    mics: getPublicMicSlots(targetRoomId),
    users: getRoomUsersList(targetRoomId),
    roomKingKey: computeRoomKingKey(targetRoomId),
    activeMute: buildSanitizedMutePayload(activeMuteRow, targetRoomId).muted
      ? buildSanitizedMutePayload(activeMuteRow, targetRoomId)
      : null,
    royalEntrance,
    joinNotice,
    quizBot: {
      active: Boolean(qBot && qBot.active),
      hintSent: Boolean(qBot && qBot.hintSent),
      enabledSetting: Number(db.getSiteSettings().quiz_bot_enabled) !== 0
    }
  };
}

let presenceSweepTimer = null;
function startPresenceSweeper() {
  if (presenceSweepTimer) clearInterval(presenceSweepTimer);
  presenceSweepTimer = setInterval(() => {
    try {
      const now = Date.now();
      for (const [key, entry] of [...onlinePresenceMap.entries()]) {
        const lastSeen = Number(entry.lastSeenMs || entry.lastHeartbeat || 0);
        if (lastSeen && now - lastSeen > 75000) {
          removeOnlinePresence(key);
        }
      }
    } catch (err) {
      console.error('[PresenceSweeper Error]', err?.message || err);
    }
  }, 20000);
}

app.get('/api/chat/bootstrap', requireAuth, async (req, res) => {
  const telemetry = getClientTelemetry(req);
  const requestedRoom = String(req.query?.roomId || '').trim();
  const initialRoomId = requestedRoom && db.getRoomById(requestedRoom)
    ? requestedRoom
    : (db.getAllRooms()[0]?.id || 'general');
  const existingEntry = onlinePresenceMap.get(req.authUser.key);
  const entry = upsertOnlinePresence(req.authUser, telemetry, existingEntry?.roomId || initialRoomId);
  const joined = movePresenceToRoom(entry, entry.roomId || initialRoomId, telemetry, Boolean(existingEntry));
  await db.flushWrites();

  const freshUser = req.authUser.isGuest
    ? req.authUser
    : mapUserRow(db.findUserById(req.authUser.userId)) || req.authUser;
  const activeMute = db.getActiveMute(entry.key, joined.room?.id || initialRoomId);

  return res.json({
    user: freshUser,
    settings: db.getPublicSiteSettings(),
    ranks: db.getAllRanks(),
    emojis: db.getAllCustomEmojis(),
    rooms: buildRoomsPayload(),
    onlineUsers: buildGlobalOnlineUsers(),
    persistentMembers: buildPersistentMembersList(),
    unreadNotifCount: db.getUnreadNotificationCount(entry.key),
    news: db.getAllNews(),
    giftsCatalog: db.getGiftsCatalog(),
    framesCatalog: getEffectiveFramesCatalog(),
    activeMute: activeMute ? buildSanitizedMutePayload(activeMute, joined.room?.id || initialRoomId) : null,
    roomState: joined
  });
});

app.post('/api/chat/heartbeat', requireAuth, (req, res) => {
  const telemetry = getClientTelemetry(req);
  const reqRoomId = String(req.body?.roomId || '').trim();
  const entry = resolveOnlineSessionFromRequest(req, reqRoomId || null);
  if (reqRoomId && db.getRoomById(reqRoomId) && entry.roomId !== reqRoomId) {
    entry.roomId = reqRoomId;
    db.syncOnlinePresenceDoc(buildPublicPresenceDoc(entry));
  }
  if (entry.roomId) recentRoomPresence.set(entry.key, { roomId: entry.roomId, at: Date.now() });

  const roomId = entry.roomId || 'general';
  const activeMute = db.getActiveMute(entry.key, roomId);
  const qBot = roomQuizBots.get(roomId);

  const nowMs = Date.now();
  const deletedMsgIds = [];
  for (const [mid, ts] of recentDeletedMsgLog.entries()) {
    if (nowMs - ts <= 45000) deletedMsgIds.push(mid);
  }
  const updatedMessages = [];
  if (recentUpdatedMsgLog.size > 0) {
    const roomMsgsNow = db.getRoomMessages(roomId, 120, entry.key);
    for (const [mid, ts] of recentUpdatedMsgLog.entries()) {
      if (nowMs - ts <= 45000) {
        const found = roomMsgsNow.find((m) => String(m.id) === mid || String(m.doc_id) === mid);
        if (found) updatedMessages.push(found);
      }
    }
  }

  return res.json({
    ok: true,
    ts: nowMs,
    roomId,
    isRoomManager: db.isRoomManager(roomId, entry.userId, entry.role),
    canStyleRoom: db.hasRoomOwnerPermission(roomId, entry.userId, entry.role, 'style_bg'),
    rooms: buildRoomsPayload(),
    onlineUsers: buildGlobalOnlineUsers(),
    roomUsers: getRoomUsersList(roomId),
    mics: getPublicMicSlots(roomId),
    messages: req.body?.includeMessages ? db.getRoomMessages(roomId, 80, entry.key) : undefined,
    deletedMsgIds,
    updatedMessages,
    activeMute: buildSanitizedMutePayload(activeMute, roomId),
    unreadNotifCount: db.getUnreadNotificationCount(entry.key),
    quizBot: {
      active: Boolean(qBot && qBot.active),
      hintSent: Boolean(qBot && qBot.hintSent),
      enabledSetting: Number(db.getSiteSettings().quiz_bot_enabled) !== 0
    }
  });
});

app.post('/api/chat/logout', requireAuth, async (req, res) => {
  removeOnlinePresence(req.authUser.key);
  if (req._authTokenPayload?.sid) {
    db.revokeUserSession(req._authTokenPayload.sid);
  }
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/chat/rooms/:roomId/join', requireAuth, async (req, res) => {
  const telemetry = getClientTelemetry(req);
  const entry = resolveOnlineSessionFromRequest(req);
  if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'حسابك مجمد مؤقتاً من قبل المالك ولا يمكنك التنقل بين الغرف.' });
  }
  const roomId = String(req.params.roomId || '').trim();
  const room = db.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  const isOwnerOrMod = entry.role === 'site_owner' || canDo(entry.role, 'manage_rooms');
  if (!isOwnerOrMod) {
    const rBan = db.isBannedFromRoom(roomId, entry.key);
    if (rBan) {
      return res.status(403).json({ error: `تم حظرك من دخول هذه الغرفة (${rBan.reason || 'بقرار إدارة الغرفة'}).`, roomBanned: true });
    }
  }
  if (!isOwnerOrMod && (Number(room.min_rank_power) || 0) > db.getRankPower(entry.role)) {
    return res.status(403).json({ error: `الدخول لهذه الغرفة يتطلب رتبة بقوة ${room.min_rank_power} فأعلى.` });
  }
  if (!isOwnerOrMod && room.room_password && room.room_password.trim()) {
    if (String(req.body?.password || '').trim() !== room.room_password.trim()) {
      return res.status(403).json({ error: 'كلمة مرور الغرفة غير صحيحة.', requiresPassword: true });
    }
  }
  const roomState = movePresenceToRoom(entry, roomId, telemetry, Boolean(req.body?.silent));
  await db.flushWrites();
  return res.json({ ok: true, ...roomState, rooms: buildRoomsPayload(), onlineUsers: buildGlobalOnlineUsers() });
});

async function processIncomingChatMessage(entry, payload = {}) {
  const targetRoomId = String(payload.roomId || entry.roomId || '').trim();
  if (!targetRoomId || !db.getRoomById(targetRoomId)) {
    return { status: 400, error: 'لست داخل غرفة.' };
  }
  entry.roomId = targetRoomId;
  entry.lastSeenMs = Date.now();
  entry.lastHeartbeat = Date.now();

  const isOwnerOrMod = entry.role === 'site_owner' || canDo(entry.role, 'manage_rooms');
  if (!isOwnerOrMod && db.isBannedFromRoom(targetRoomId, entry.key)) {
    return { status: 403, error: 'تم حظرك من هذه الغرفة ولا يمكنك الإرسال فيها.', extra: { roomBanned: true } };
  }

  const siteSettings = db.getSiteSettings();
  if (Number(siteSettings.global_chat_mute) === 1 && entry.role !== 'site_owner') {
    return { status: 403, error: 'الدردشة العامة مكتومة حالياً بأمر صاحب الموقع.' };
  }

  if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
    return { status: 403, error: 'أنت مجمد حالياً بأمر المالك ولا يمكنك الإرسال.' };
  }
  const currentRm = db.getRoomById(targetRoomId);
  if (currentRm && Number(currentRm.is_frozen) === 1 && !db.isRoomManager(targetRoomId, entry.userId, entry.role)) {
    return { status: 403, error: 'الغرفة مجمدة مؤقتاً للقراءة فقط.' };
  }

  const mute = entry.role !== 'site_owner' ? db.getActiveMute(entry.key, targetRoomId) : null;
  if (mute) {
    const mins = Math.max(1, Math.ceil((mute.expires_at - Date.now()) / 60000));
    return {
      status: 403,
      error: `تم كتمك مؤقتاً لمدة: ${formatMuteDurationArabic(mins)}`,
      extra: { activeMute: buildSanitizedMutePayload(mute, targetRoomId) }
    };
  }

  if (entry.role !== 'site_owner') {
    const now = Date.now();
    if (Number(siteSettings.antiflood_enabled ?? 1) !== 0 && !canDo(entry.role, 'immune')) {
      const maxMsgs = Math.max(2, Number(siteSettings.antiflood_max_msgs) || 6);
      const windowMs = Math.max(3, Number(siteSettings.antiflood_window_sec) || 10) * 1000;
      const muteMins = Math.max(1, Number(siteSettings.antiflood_mute_mins) || 5);
      const prevTimes = (floodTimestampsByKey.get(entry.key) || []).filter((ts) => now - ts <= windowMs);
      prevTimes.push(now);
      floodTimestampsByKey.set(entry.key, prevTimes);
      if (prevTimes.length > maxMsgs) {
        floodTimestampsByKey.set(entry.key, []);
        const floodReason = 'مخالفة قواعد الدردشة التلقائية';
        db.setMute(entry.key, targetRoomId, muteMins * 60 * 1000, 'نظام الحماية التلقائي', floodReason, {
          targetName: entry.name,
          mutedByKey: 'system:antiflood'
        });
        activeMutedKeysTracker.add(entry.key);
        releaseUserMicsInRoom(entry.key, targetRoomId);
        emitMuteStateToUser(entry.key, targetRoomId);
        notifyUserMutedNotification(entry.key, muteMins);
        db.addViolationLog({
          offenderKey: entry.key,
          offenderName: entry.name,
          offenderRole: entry.role,
          penaltyType: 'antiflood_mute',
          reason: 'التكرار المفرط (Anti-Flood)',
          violatingDetail: `تجاوز ${maxMsgs} رسائل خلال ${Math.round(windowMs / 1000)} ثوانٍ (${muteMins} دقيقة)`,
          roomId: targetRoomId
        });
        db.addAdminLog({
          actorKey: 'system:antiflood',
          actorName: '🛡️ نظام الحماية Anti-Flood',
          actorRole: 'site_owner',
          action: 'كتم تلقائي (Anti-Flood)',
          targetKey: entry.key,
          targetName: entry.name,
          details: `كتم ${muteMins} دقيقة لتجاوز ${maxMsgs} رسائل خلال ${Math.round(windowMs / 1000)} ثوانٍ`
        });
        notifyOwnersModerationEvent({
          actorName: '🛡️ نظام الحماية Anti-Flood',
          actorKey: 'system:antiflood',
          targetName: entry.name,
          targetKey: entry.key,
          actionType: 'antiflood_mute',
          reason: 'التكرار المفرط (Anti-Flood)',
          durationMins: muteMins,
          roomId: targetRoomId
        });
        await db.flushWrites();
        return { status: 429, error: `تم كتمك مؤقتاً لمدة: ${formatMuteDurationArabic(muteMins)}` };
      }
    }
    const spam = roomActivitySpam.get(entry.key) || { count: 0, resetAt: now + 5000 };
    if (now > spam.resetAt) {
      spam.count = 0;
      spam.resetAt = now + 5000;
    }
    spam.count += 1;
    roomActivitySpam.set(entry.key, spam);
    if (spam.count > 8) {
      return { status: 429, error: 'يرجى التمهل قليلاً قبل إرسال رسالة أخرى.' };
    }
  }

  const msgType = ['text', 'image', 'audio', 'sticker'].includes(payload.msgType) ? payload.msgType : 'text';
  let content = db.sanitizePlainText(String(payload.content || ''), 1000);
  const mediaUrlRaw = String(payload.mediaUrl || '').trim().slice(0, 500);
  let mediaUrl = mediaUrlRaw;
  if (mediaUrlRaw) {
    const mChk = validateHttpsOrLocalUrl(mediaUrlRaw, { allowDataImage: true });
    if (!mChk.ok) return { status: 400, error: mChk.error };
    mediaUrl = mChk.value;
  }
  const clientMsgId = String(payload.clientMsgId || '').slice(0, 80);
  let mentionedUserId = payload.mentionedUserId ? String(payload.mentionedUserId).trim().slice(0, 80) : null;
  let mentionedUserName = db.sanitizePlainText(String(payload.mentionedUserName || '').replace(/^@+/, ''), 60);
  const isAdminNotice =
    Boolean(payload.isAdminNotice) && (entry.role === 'site_owner' || canDo(entry.role, 'access_panel'));

  if (entry.isGuest && Number(siteSettings.guest_can_chat) === 0) {
    return { status: 403, error: 'الكتابة في الغرف العامة مقيّدة حالياً للأعضاء المسجلين فقط.' };
  }
  if (msgType === 'image' && entry.isGuest && Number(siteSettings.lock_guest_images) === 1) {
    return { status: 403, error: 'تم إقفال إرسال الصور للزوار من قبل المالك.' };
  }
  if (msgType === 'image' || msgType === 'sticker' || msgType === 'audio') {
    if (entry.role !== 'site_owner' && !canDo(entry.role, 'chat_media')) {
      return { status: 403, error: 'إرسال الصور والملصقات والصوتيات غير متاح لرتبتك الحالية.' };
    }
    if (!canPassSettingThreshold(entry, 'min_rank_chat_media', 'member')) {
      return { status: 403, error: 'إرسال الصور والملصقات والصوتيات مقيّد لرتبة أعلى من رتبتك.' };
    }
  }
  if (msgType === 'text' && !content) {
    return { status: 400, error: 'الرسالة فارغة.' };
  }
  if (msgType === 'text' && entry.role !== 'site_owner' && !canDo(entry.role, 'send_links') && containsUrl(content)) {
    db.addViolationLog({
      offenderKey: entry.key,
      offenderName: entry.name,
      offenderRole: entry.role,
      penaltyType: 'blocked_link',
      reason: 'محاولة إرسال رابط غير مسموح في الغرفة',
      violatingDetail: content.slice(0, 220),
      roomId: targetRoomId
    });
    await db.flushWrites();
    return { status: 403, error: 'إرسال الروابط غير مسموح لرتبتك الحالية.' };
  }

  if (msgType !== 'text') {
    mentionedUserId = null;
    mentionedUserName = '';
  } else if (mentionedUserId) {
    let resolvedName = mentionedUserName;
    if (mentionedUserId === 'system:welcomebot') {
      resolvedName = String(siteSettings.welcome_bot_name || 'مساعد الأصيل').trim();
    } else if (mentionedUserId === 'system:quizbot') {
      resolvedName = '🤖 بوت المسابقات';
    } else if (mentionedUserId.startsWith('virtual:')) {
      const vm = getActiveVirtualMembersForRooms().find((v) => v.key === mentionedUserId);
      if (vm?.name) resolvedName = vm.name;
    } else if (mentionedUserId.startsWith('user:')) {
      const u = db.findUserById(Number(mentionedUserId.slice(5)));
      if (u) resolvedName = db.getEffectiveName(u);
    } else {
      const o = onlinePresenceMap.get(mentionedUserId);
      if (o?.name) resolvedName = o.name;
      if (!resolvedName && mentionedUserId.startsWith('guest:')) {
        const g = db.findGuestByKey(mentionedUserId);
        if (g?.name) resolvedName = g.name;
      }
    }
    const checkCandidate = String(resolvedName || mentionedUserName || '').replace(/^@+/, '').trim();
    if (!checkCandidate || (!textContainsMemberName(content, checkCandidate) && !textContainsNormalizedBotName(content, checkCandidate))) {
      mentionedUserId = null;
      mentionedUserName = '';
    } else {
      mentionedUserName = checkCandidate;
    }
  }

  let matchedBannedWord = null;
  if (msgType === 'text' && entry.role !== 'site_owner') {
    const maskedRes = maskBannedWords(content);
    if (maskedRes.matchedWord) {
      matchedBannedWord = maskedRes.matchedWord;
      content = maskedRes.maskedText.trim() || '***';
    }
  }
  if ((msgType === 'image' || msgType === 'audio') && !mediaUrl) {
    return { status: 400, error: 'الملف غير موجود.' };
  }
  if (msgType === 'sticker' && !content && !mediaUrl) {
    return { status: 400, error: 'الملصق فارغ.' };
  }

  const allowNameStyle = canPassSettingThreshold(entry, 'min_rank_name_style', 'member');
  const allowMsgStyle = canPassSettingThreshold(entry, 'min_rank_msg_style', 'member');
  const isGhostOnly =
    entry.role !== 'site_owner' &&
    (Boolean(entry.isGhosted) || Boolean(entry.isShadowMuted) || guestShadowMutedKeys.has(entry.key));
  const rawReply = payload.replyTo && typeof payload.replyTo === 'object' ? payload.replyTo : null;
  const replyTo = rawReply && rawReply.senderName && rawReply.content
    ? {
        id: rawReply.id ? String(rawReply.id).slice(0, 60) : '',
        senderName: db.sanitizePlainText(String(rawReply.senderName || ''), 40),
        senderKey: String(rawReply.senderKey || '').slice(0, 80),
        content: db.sanitizePlainText(String(rawReply.content || ''), 160)
      }
    : null;

  const msg = db.addMessage({
    roomId: targetRoomId,
    senderKey: entry.key,
    senderName: entry.name,
    senderRole: entry.role,
    nameColor: allowNameStyle ? (entry.nameBgColor ? entry.nameColor : ensureDarkReadableColor(entry.nameColor, '#0f172a')) : '#0f172a',
    textColor: allowMsgStyle ? ensureDarkReadableColor(entry.textColor, '#0f172a') : '#0f172a',
    nameBgColor: allowNameStyle ? entry.nameBgColor : '',
    neonColor: allowNameStyle ? entry.neonColor : '',
    fontFamily: allowMsgStyle ? normalizeProfileFont(entry.fontFamily) : 'Cairo',
    fontStyle: allowMsgStyle ? normalizeFontStyle(entry.fontStyle) : 'Normal',
    nameFontStyle: allowNameStyle ? normalizeFontStyle(entry.nameFontStyle || entry.fontStyle) : 'Normal',
    fontSize: allowMsgStyle ? Math.max(13, Math.min(17, Number(entry.fontSize) || 14)) : 14,
    nameFontSize: allowNameStyle ? Math.max(13, Math.min(18, Number(entry.nameFontSize) || 14)) : 14,
    nameStyleMode: allowNameStyle ? entry.nameStyleMode || 'solid' : 'solid',
    nameGradient: allowNameStyle ? entry.nameGradient || 'gold_royal' : 'gold_royal',
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
    mentionedUserId,
    mentionedUserName,
    replyTo,
    clientMsgId
  });

  if (isGhostOnly) {
    await db.flushWrites();
    return { status: 200, data: { ok: true, id: msg.id, message: msg } };
  }

  if (matchedBannedWord) {
    const banWordMuteMins = Math.max(1, Number(siteSettings.banned_word_mute_mins) || 10);
    const safeGenericReason = 'مخالفة قواعد الدردشة التلقائية';
    db.setMute(entry.key, targetRoomId, banWordMuteMins * 60 * 1000, 'نظام الحماية التلقائي', safeGenericReason, {
      targetName: entry.name,
      mutedByKey: 'system:wordfilter'
    });
    activeMutedKeysTracker.add(entry.key);
    releaseUserMicsInRoom(entry.key, targetRoomId);
    emitMuteStateToUser(entry.key, targetRoomId);
    notifyUserMutedNotification(entry.key, banWordMuteMins);
    db.addViolationLog({
      offenderKey: entry.key,
      offenderName: entry.name,
      offenderRole: entry.role,
      penaltyType: 'banned_word_mute',
      reason: 'استخدام كلمة محظورة في الغرفة',
      violatingDetail: matchedBannedWord,
      roomId: targetRoomId
    });
    db.addAdminLog({
      actorKey: 'system:wordfilter',
      actorName: '🛡️ فلتر الكلمات المحظورة',
      actorRole: 'site_owner',
      action: 'تشفير كلمة محظورة + كتم تلقائي',
      targetKey: entry.key,
      targetName: entry.name,
      details: `كتم ${banWordMuteMins} دقيقة • الكلمة: "${matchedBannedWord}" • الغرفة: ${targetRoomId}`
    });
    notifyOwnersModerationEvent({
      actorName: '🛡️ فلتر الكلمات المحظورة',
      actorKey: 'system:wordfilter',
      targetName: entry.name,
      targetKey: entry.key,
      actionType: 'banned_word_mute',
      reason: 'استخدام كلمة محظورة',
      durationMins: banWordMuteMins,
      roomId: targetRoomId,
      violatingWord: matchedBannedWord
    });
    await db.flushWrites();
    return { status: 200, data: { ok: true, id: msg.id, message: msg, autoMuted: true, muteMins: banWordMuteMins } };
  }

  let rubyRewardResult = null;
  if (msgType === 'text' && !entry.isGuest && entry.userId) {
    const nowTs = Date.now();
    const normBody = normalizeArabicText(content);
    const rewardKey = String(entry.userId);
    const prevReward = lastMessageRewardByUser.get(rewardKey);
    const isDuplicateMsg = prevReward && prevReward.text === normBody;
    const tooFast = prevReward && nowTs - prevReward.at < 3000;
    if (normBody.length > 0 && !isDuplicateMsg && !tooFast) {
      lastMessageRewardByUser.set(rewardKey, { text: normBody, at: nowTs });
      db.incrementActivityPoints({
        userId: entry.userId,
        roomId: targetRoomId,
        userDelta: 2,
        roomDelta: 2
      });
      entry.activityPoints = (Number(entry.activityPoints) || 0) + 2;
      rubyRewardResult = db.processMessageAutoRubyReward(entry.userId, nowTs);
      if (rubyRewardResult?.awarded) {
        entry.coins = rubyRewardResult.coins;
      }

      const promo = db.checkAndApplyAutoPromotion(entry.userId);
      if (promo?.promoted) {
        entry.role = promo.newRole;
        const pRank = promo.rank || db.getRankByKey(promo.newRole);
        emitRoomNoticeMessage(
          targetRoomId,
          `🎖️ تهانينا! تمت ترقية "${entry.name}" تلقائياً إلى رتبة (${pRank.icon} ${pRank.label}) لتفاعله النشط!`
        );
        const promoNotif = db.addNotification({
          targetKey: entry.key,
          title: `🎖️ ترقية تلقائية إلى ${pRank.label}!`,
          body: `مبارك! وصلت نقاط تفاعلك إلى ${entry.activityPoints} وتمت ترقيتك تلقائياً إلى "${pRank.label}".`,
          category: 'system'
        });
        emitNotificationToUser(null, entry.key, promoNotif);
      }
      syncUserPresence(entry.userId);
    }
  }

  if (msgType === 'text') {
    checkQuizBotAnswer(entry, content);
    maybeHandleWelcomeBotMention(entry, targetRoomId, content, { mentionedUserId }).catch(() => {});
  }

  if (msgType === 'text' && content) {
    const mentionedKeys = new Set();
    if (
      mentionedUserId &&
      mentionedUserId !== entry.key &&
      !mentionedUserId.startsWith('system:') &&
      !mentionedUserId.startsWith('virtual:')
    ) {
      mentionedKeys.add(mentionedUserId);
    } else if (!mentionedUserId) {
      for (const other of onlinePresenceMap.values()) {
        if (other.key === entry.key || isStealthEntry(other)) continue;
        const n1 = String(other.name || '').trim();
        const n2 = String(other.username || '').trim();
        if (textContainsMemberName(content, n1) || textContainsMemberName(content, n2)) {
          mentionedKeys.add(other.key);
        }
      }
    }
    for (const tKey of mentionedKeys) {
      db.patchUserStateDoc(tKey, {
        lastMentionAt: Date.now(),
        lastMentionData: {
          fromKey: entry.key,
          fromName: entry.name,
          fromAvatar: entry.avatarUrl || '',
          fromRole: entry.role || 'member',
          roomId: targetRoomId,
          msgId: msg.id,
          mentionedUserId: tKey,
          content: content.slice(0, 120)
        }
      });
    }
  }

  await db.flushWrites();
  return {
    status: 200,
    data: {
      ok: true,
      id: msg.id,
      message: msg,
      rubyReward: rubyRewardResult,
      user: !entry.isGuest && entry.userId ? mapUserRow(db.findUserById(entry.userId)) : undefined
    }
  };
}

app.post('/api/chat/messages', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const entry = resolveOnlineSessionFromRequest(req, payload.roomId || null);
    const result = await processIncomingChatMessage(entry, payload);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error, ...(result.extra || {}) });
    }
    return res.json(result.data);
  } catch (err) {
    console.error('POST /api/chat/messages error:', err);
    return res.status(500).json({ error: 'فشل إرسال الرسالة.' });
  }
});

app.post('/api/chat/messages/:id/react', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req);
  if (!checkRateLimit(`react:${entry.key}`, 35, 10000)) {
    return res.status(429).json({ error: 'تم التفاعل بسرعة كبيرة، انتظر ثوانٍ قليلة.' });
  }
  const msgId = String(req.params.id || '').trim();
  const reaction = String(req.body?.reaction || '').trim();
  if (!['heart', 'ok', 'broken', 'laugh', 'fire'].includes(reaction)) {
    return res.status(400).json({ error: 'نوع التفاعل غير صالح.' });
  }
  const updated = db.toggleMessageReaction(msgId, reaction, entry.key);
  if (!updated) return res.status(404).json({ error: 'الرسالة غير موجودة.' });
  recordUpdatedMessage(updated.id || msgId);
  await db.flushWrites();
  return res.json({ ok: true, message: updated });
});

app.delete('/api/chat/messages/:id', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req);
  const msgId = String(req.params.id || '').trim();
  const roomId = String(req.query?.roomId || entry.roomId || '').trim();
  if (!roomId || !msgId) return res.status(400).json({ error: 'بيانات ناقصة.' });

  const isSupreme = db.isSupremeOwnerEmail(entry.email) || entry.role === 'site_owner';
  const isMgr =
    isSupreme ||
    db.isRoomManager(roomId, entry.userId, entry.role) ||
    canDo(entry.role, 'delete_msg') ||
    canDo(entry.role, 'clear_room');
  const roomMsgs = db.getRoomMessages(roomId, 200);
  const target = roomMsgs.find((m) => String(m.id) === msgId || String(m.doc_id) === msgId);
  if (!target) return res.status(404).json({ error: 'الرسالة غير موجودة.' });
  if (!isMgr && target.sender_key !== entry.key) {
    return res.status(403).json({ error: 'ليست لديك صلاحية حذف هذه الرسالة.' });
  }
  if (target.sender_key !== entry.key && !isSupreme) {
    const check = canModerateWithImmunity(entry, target.sender_key);
    if (!check.allowed) return res.status(403).json({ error: check.reason });
  }
  db.deleteMessageById(msgId);
  recordDeletedMessage(target.id || msgId);
  if (target.sender_key !== entry.key) {
    db.addAdminLog({
      actorKey: entry.key,
      actorName: entry.name,
      actorRole: entry.role,
      action: 'حذف رسالة',
      targetKey: target.sender_key,
      targetName: target.sender_name || target.sender_key,
      details: roomId
    });
  }
  await db.flushWrites();
  return res.json({ ok: true, msgId: String(target.id || msgId) });
});

app.post('/api/chat/typing', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  if (!entry || !entry.roomId || isStealthEntry(entry)) return res.json({ ok: true });
  const isTyping = Boolean(req.body?.isTyping);
  entry.typingInRoom = isTyping ? entry.roomId : '';
  entry.typingAt = isTyping ? Date.now() : 0;
  db.syncOnlinePresenceDoc(buildPublicPresenceDoc(entry));
  broadcastTypingUsers(entry.roomId);
  return res.json({ ok: true });
});

app.post('/api/chat/stealth', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req);
  if (entry.role !== 'site_owner' && !db.isSupremeOwnerEmail(entry.email) && !canDo(entry.role, 'stealth')) {
    return res.status(403).json({ error: 'وضع التخفي غير متاح لرتبتك الحالية.' });
  }
  const resStealth = db.setUserStealth(entry.userId, Boolean(req.body?.enabled));
  if (resStealth?.error) return res.status(400).json({ error: resStealth.error });
  syncUserPresence(entry.userId);
  await db.flushWrites();
  return res.json({ ok: true, isStealth: Boolean(req.body?.enabled) });
});

app.post('/api/chat/mics/take', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!roomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
  if (Number(db.getSiteSettings().feat_mics) === 0 && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'نظام المايكات الصوتية متوقف مؤقتاً من قبل المالك.' });
  }
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'mic')) {
    return res.status(403).json({ error: 'صعود المايكات غير متاح لرتبتك الحالية.' });
  }
  if (!canPassSettingThreshold(entry, 'min_rank_mic', 'guest')) {
    return res.status(403).json({ error: 'صعود المايكات مقيّد حالياً لرتبة أعلى من رتبتك.' });
  }
  if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'حسابك مجمد حالياً ولا يمكنك صعود المايك.' });
  }
  const rm = db.getRoomById(roomId);
  if (!rm || rm.mics_enabled === 0) return res.status(403).json({ error: 'المايكات معطلة في هذه الغرفة.' });
  if (Number(rm.is_frozen) === 1 && !db.isRoomManager(roomId, entry.userId, entry.role)) {
    return res.status(403).json({ error: 'الغرفة مجمدة مؤقتاً.' });
  }
  const slotNum = Number(req.body?.slot);
  if (slotNum < 1 || slotNum > 5) return res.status(400).json({ error: 'رقم مايك غير صالح.' });

  const slots = ensureRoomMicSlots(roomId);
  const targetSlot = slots.find((s) => s.slot === slotNum);
  if (!targetSlot) return res.status(404).json({ error: 'المايك غير موجود.' });
  if (targetSlot.holderKey && targetSlot.holderKey !== entry.key) {
    return res.status(409).json({ error: 'هذا المايك محجوز حالياً.' });
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
      s.speakingLevel = 0;
    }
  }
  targetSlot.holderKey = entry.key;
  targetSlot.holderSocketId = entry.key;
  targetSlot.holderName = entry.name;
  targetSlot.holderRole = entry.role;
  targetSlot.holderAvatar = entry.avatarUrl || '';
  targetSlot.isSelfMuted = false;
  targetSlot.isAdminMuted = false;
  targetSlot.isSpeaking = true;
  targetSlot.speakingLevel = 0;
  syncRoomMicsToFirestore(roomId);
  return res.json({ ok: true, slot: slotNum, slots: getPublicMicSlots(roomId) });
});

app.post('/api/chat/mics/leave', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (roomId) releaseUserMicsInRoom(entry.key, roomId);
  return res.json({ ok: true, slots: roomId ? getPublicMicSlots(roomId) : [] });
});

app.post('/api/chat/mics/self-mute', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!roomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
  const slots = ensureRoomMicSlots(roomId);
  let changed = false;
  for (const s of slots) {
    if (s.holderKey === entry.key) {
      s.isSelfMuted = Boolean(req.body?.muted);
      s.isSpeaking = !s.isSelfMuted && !s.isAdminMuted;
      changed = true;
    }
  }
  if (changed) syncRoomMicsToFirestore(roomId);
  return res.json({ ok: true, slots: getPublicMicSlots(roomId) });
});

app.post('/api/chat/mics/admin-mute', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!roomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
  const isMgr = db.isRoomManager(roomId, entry.userId, entry.role) || canDo(entry.role, 'mute');
  if (!isMgr) return res.status(403).json({ error: 'صلاحية غير كافية.' });
  const slots = ensureRoomMicSlots(roomId);
  const targetSlot = slots.find((s) => s.slot === Number(req.body?.slot));
  if (!targetSlot || !targetSlot.holderKey) return res.status(404).json({ error: 'المايك فارغ.' });
  if (targetSlot.holderKey !== entry.key) {
    const check = canModerateWithImmunity(entry, targetSlot.holderKey, { checkImmunePerm: true });
    if (!check.allowed) return res.status(403).json({ error: check.reason });
  }
  targetSlot.isAdminMuted = Boolean(req.body?.muted);
  targetSlot.isSpeaking = !targetSlot.isSelfMuted && !targetSlot.isAdminMuted;
  db.patchUserStateDoc(targetSlot.holderKey, { micForceMuteAt: Date.now(), micForceMuted: targetSlot.isAdminMuted });
  emitToUserKey(targetSlot.holderKey, 'user_state', { micForceMuteAt: Date.now(), micForceMuted: targetSlot.isAdminMuted });
  syncRoomMicsToFirestore(roomId);
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: targetSlot.isAdminMuted ? 'كتم مايك' : 'فتح مايك',
    targetKey: targetSlot.holderKey,
    targetName: targetSlot.holderName || targetSlot.holderKey,
    details: `مايك #${targetSlot.slot} (${roomId})`
  });
  await db.flushWrites();
  return res.json({ ok: true, slots: getPublicMicSlots(roomId) });
});

app.post('/api/chat/mics/kick', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!roomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
  const isMgr = db.isRoomManager(roomId, entry.userId, entry.role) || canDo(entry.role, 'kick');
  if (!isMgr) return res.status(403).json({ error: 'صلاحية غير كافية.' });
  const slots = ensureRoomMicSlots(roomId);
  const targetSlot = slots.find((s) => s.slot === Number(req.body?.slot));
  if (!targetSlot || !targetSlot.holderKey) return res.status(404).json({ error: 'المايك فارغ.' });
  if (targetSlot.holderKey !== entry.key) {
    const check = canModerateWithImmunity(entry, targetSlot.holderKey, { checkImmunePerm: true });
    if (!check.allowed) return res.status(403).json({ error: check.reason });
  }
  const kickedKey = targetSlot.holderKey;
  const kickedName = targetSlot.holderName || kickedKey;
  targetSlot.holderKey = null;
  targetSlot.holderSocketId = null;
  targetSlot.holderName = null;
  targetSlot.holderRole = null;
  targetSlot.holderAvatar = null;
  targetSlot.isSelfMuted = false;
  targetSlot.isAdminMuted = false;
  targetSlot.isSpeaking = false;
  targetSlot.speakingLevel = 0;
  db.patchUserStateDoc(kickedKey, { micKickedAt: Date.now(), micKickedBy: entry.name });
  emitToUserKey(kickedKey, 'user_state', { micKickedAt: Date.now(), micKickedBy: entry.name });
  syncRoomMicsToFirestore(roomId);
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: 'إنزال من المايك',
    targetKey: kickedKey,
    targetName: kickedName,
    details: `مايك #${targetSlot.slot} (${roomId})`
  });
  await db.flushWrites();
  return res.json({ ok: true, slots: getPublicMicSlots(roomId) });
});

app.post('/api/chat/mics/speaking', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const roomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!roomId) return res.json({ ok: true });
  const slotNum = Number(req.body?.slot) || 0;
  const level = Math.max(0, Math.min(1, Number(req.body?.level) || 0));
  const slots = ensureRoomMicSlots(roomId);
  const target = slots.find((s) => s.slot === slotNum && s.holderKey === entry.key);
  if (target) {
    target.speakingLevel = level;
    syncRoomMicsToFirestore(roomId);
  }
  return res.json({ ok: true });
});

app.post('/api/chat/webrtc/signal', requireAuth, (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const { type, toKey, slot, sdp, candidate, roomId } = req.body || {};
  const cleanType = ['ready', 'offer', 'answer', 'ice'].includes(type) ? type : '';
  if (!cleanType) return res.status(400).json({ error: 'نوع إشارة غير صالح.' });
  const targetRoomId = String(roomId || entry.roomId || 'general');
  const sigObj = {
    type: cleanType,
    roomId: targetRoomId,
    fromKey: entry.key,
    fromName: entry.name,
    toKey: String(toKey || ''),
    slot: Number(slot) || 1,
    sdp: sdp || null,
    candidate: candidate || null,
    createdAtMs: Date.now()
  };
  const signalId = db.pushWebRtcSignalDoc(sigObj);
  sigObj.id = signalId;
  if (sigObj.toKey) {
    emitToUserKey(sigObj.toKey, 'webrtc_signal', sigObj);
  } else if (io) {
    io.to(targetRoomId).emit('webrtc_signal', sigObj);
  }
  setTimeout(() => {
    db.deleteWebRtcSignalDoc(signalId);
  }, 45000);
  return res.json({ ok: true, id: signalId });
});

app.post('/api/chat/youtube', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const targetRoomId = String(req.body?.roomId || entry.roomId || '').trim();
  if (!targetRoomId) return res.status(400).json({ error: 'الغرفة مطلوبة.' });
  if (Number(db.getSiteSettings().feat_youtube) === 0 && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'ميزة اليوتيوب متوقفة مؤقتاً من قبل المالك.' });
  }
  const currentRoom = db.getRoomById(targetRoomId);
  if (!currentRoom) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  const isMgr = db.isRoomManager(targetRoomId, entry.userId, entry.role);
  if (!isMgr && entry.role !== 'site_owner' && !canDo(entry.role, 'youtube')) {
    return res.status(403).json({ error: 'تشغيل ومشاركة يوتيوب غير متاحة لرتبتك الحالية.' });
  }
  const slots = ensureRoomMicSlots(targetRoomId);
  const isOnMic = slots.some((s) => s.holderKey === entry.key);
  const isFrozen = (entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner';
  const isMuted = Boolean(db.getActiveMute(entry.key, targetRoomId));
  if (!isMgr && (isFrozen || isMuted)) {
    return res.status(403).json({ error: 'لا يمكنك تشغيل أو تعديل يوتيوب أثناء التجميد أو الكتم.' });
  }

  const rawUrl = String(req.body?.url || '').trim();
  const videoId = rawUrl === '' ? '' : extractYouTubeId(rawUrl);
  if (rawUrl !== '' && !videoId) {
    return res.status(400).json({ error: 'رابط يوتيوب غير صالح. استخدم البحث بالاسم أو رابط فيديو صحيح.' });
  }
  if (videoId === '' && !isMgr && !isOnMic && currentRoom.youtube_by_key !== entry.key) {
    return res.status(403).json({ error: 'يمكن لمن شغّل المقطع أو المتحدث على المايك أو الإدارة فقط إيقاف التشغيل.' });
  }

  const resolvedMiniMode = req.body?.miniMode !== undefined ? Boolean(req.body?.miniMode) : isOnMic;
  const cleanTitle = String(req.body?.title || (videoId ? 'مقطع يوتيوب الغرفة' : '')).slice(0, 120);
  const updated = db.setRoomYoutube(targetRoomId, {
    videoId,
    title: cleanTitle,
    isPlaying: Boolean(videoId && req.body?.isPlaying !== false),
    miniMode: Boolean(videoId && resolvedMiniMode),
    startedByKey: entry.key,
    startedByName: entry.name
  });
  if (!updated) return res.status(500).json({ error: 'تعذر تحديث يوتيوب.' });
  const pub = db.sanitizeRoomForPublic(updated);
  if (io && pub) io.to(targetRoomId).emit('room_updated', pub);
  broadcastRoomsList();
  if (videoId) {
    emitRoomNoticeMessage(
      targetRoomId,
      `🎵 شارك "${entry.name}" مقطع يوتيوب: ${cleanTitle}${resolvedMiniMode ? ' (شريط صوتي تحت المايك)' : ''}`
    );
  }
  await db.flushWrites();
  return res.json({ ok: true, room: pub });
});

app.post('/api/chat/quiz/toggle', requireOwner, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req, req.body?.roomId || null);
  const targetRoomId = String(req.body?.roomId || entry.roomId || 'competitions').trim();
  if (!db.getRoomById(targetRoomId)) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const enabled = Boolean(req.body?.enabled);
  if (enabled) startQuizBotInRoom(targetRoomId, 100);
  else stopQuizBotInRoom(targetRoomId);
  await db.flushWrites();
  return res.json({ ok: true, active: enabled });
});

// ==========================================
// PRIVATE MESSAGES (ISOLATED FROM GENERAL NOTIFICATIONS)
// ==========================================
app.post('/api/pm/send', requireAuth, async (req, res) => {
  const entry = resolveOnlineSessionFromRequest(req);
  const { toKey, toName, content } = req.body || {};
  const clean = db.sanitizePlainText(String(content || ''), 800);
  if (!toKey || !clean) return res.status(400).json({ error: 'الرسالة أو المستلم مفقود.' });
  const settings = db.getSiteSettings();
  if (Number(settings.global_chat_mute) === 1 && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'الدردشة مكتومة حالياً بأمر صاحب الموقع.' });
  }
  if (Number(settings.feat_pm) === 0 && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'الرسائل الخاصة متوقفة مؤقتاً من قبل المالك.' });
  }
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'pm')) {
    return res.status(403).json({ error: 'إرسال الرسائل الخاصة غير متاح لرتبتك الحالية.' });
  }
  if (!canPassSettingThreshold(entry, 'min_rank_pm', 'member')) {
    return res.status(403).json({ error: 'إرسال الرسائل الخاصة مقيّد حالياً لرتبة أعلى من رتبتك.' });
  }
  if ((entry.isFrozen || guestFrozenKeys.has(entry.key)) && entry.role !== 'site_owner') {
    return res.status(403).json({ error: 'أنت مجمد حالياً ولا يمكنك إرسال رسائل خاصة.' });
  }
  if (entry.role !== 'site_owner') {
    const pmRl = checkRateLimit(`pm:${entry.key}`, 14, 60000);
    if (!pmRl.allowed) {
      return res.status(429).json({ error: 'يرجى التمهل قليلاً قبل إرسال رسالة خاصة أخرى.' });
    }
  }
  const pmMute = entry.role !== 'site_owner' ? db.getActiveMute(entry.key, entry.roomId || '*') : null;
  if (pmMute) {
    const mins = Math.max(1, Math.ceil((pmMute.expires_at - Date.now()) / 60000));
    return res.status(403).json({ error: `تم كتمك مؤقتاً لمدة: ${formatMuteDurationArabic(mins)}` });
  }
  if (entry.role !== 'site_owner' && (entry.isShadowMuted || guestShadowMutedKeys.has(entry.key) || entry.isGhosted)) {
    return res.json({
      ok: true,
      pm: {
        id: `shadow_${Date.now()}`,
        from_key: entry.key,
        from_name: entry.name,
        from_role: entry.role,
        from_avatar: entry.avatarUrl || '',
        to_key: toKey,
        to_name: toName || 'عضو',
        content: clean,
        created_at: new Date().toISOString(),
        is_read: 1
      }
    });
  }
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'send_links') && containsUrl(clean)) {
    db.addViolationLog({
      offenderKey: entry.key,
      offenderName: entry.name,
      offenderRole: entry.role,
      penaltyType: 'pm_blocked_link',
      reason: 'محاولة إرسال رابط غير مسموح في الخاص',
      violatingDetail: clean.slice(0, 220)
    });
    await db.flushWrites();
    return res.status(403).json({ error: 'إرسال الروابط في الرسائل الخاصة غير مسموح لرتبتك.' });
  }
  if (entry.role !== 'site_owner' && containsBannedWord(clean)) {
    const matched = maskBannedWords(clean).matchedWord || 'كلمة محظورة';
    db.addViolationLog({
      offenderKey: entry.key,
      offenderName: entry.name,
      offenderRole: entry.role,
      penaltyType: 'pm_banned_word',
      reason: 'محاولة إرسال كلمة محظورة في الخاص',
      violatingDetail: matched
    });
    await db.flushWrites();
    return res.status(400).json({ error: 'تعذر إرسال الرسالة لمخالفتها شروط الاستخدام.' });
  }

  // PM Link Radar -> alerts Owner only (never general notification for recipients)
  if (entry.role !== 'site_owner' && containsUrl(clean)) {
    const linkAlert = db.addPmLinkAlert({
      fromKey: entry.key,
      fromName: entry.name,
      toKey,
      toName: toName || 'عضو',
      content: clean
    });
    const ownerUsers = db.getAllRegisteredUsers().filter((u) => u.role === 'site_owner' || db.isSupremeOwnerEmail(u.email));
    for (const owner of ownerUsers) {
      db.patchUserStateDoc(`user:${owner.id}`, {
        lastPmLinkAlertAt: Date.now(),
        lastPmLinkAlert: linkAlert
      });
    }
  }

  // addPrivateMessage isolates notifications to user_states.lastPmAt — NEVER inserts into notifications bell!
  const pm = db.addPrivateMessage({
    fromKey: entry.key,
    fromName: entry.name,
    fromRole: entry.role,
    fromAvatar: entry.avatarUrl,
    toKey,
    toName: toName || 'عضو',
    content: clean
  });
  await db.flushWrites();
  return res.json({ ok: true, pm });
});

app.post('/api/pm/read', requireAuth, async (req, res) => {
  const { partnerKey } = req.body || {};
  if (!partnerKey) return res.status(400).json({ error: 'المعرف مطلوب.' });
  db.markPrivateMessagesRead(req.authUser.key, partnerKey);
  await db.flushWrites();
  return res.json({ ok: true });
});

// ==========================================
// MODERATION REST ACTIONS (WITH HIERARCHICAL IMMUNITY)
// ==========================================
function resolveTargetInfo(targetKey) {
  let targetName = targetKey || 'عضو';
  let targetRole = 'guest';
  let targetEmail = '';
  let targetIp = '';
  let targetDevice = '';
  let targetFingerprint = '';
  if (String(targetKey || '').startsWith('user:')) {
    const uid = Number(String(targetKey).replace('user:', ''));
    const row = Number.isNaN(uid) ? null : db.findUserById(uid);
    if (row) {
      targetName = db.getEffectiveName(row);
      targetRole = row.role || 'member';
      targetEmail = row.email || '';
      targetIp = row.last_ip || '';
      targetDevice = row.last_device_id || '';
      targetFingerprint = row.last_fingerprint || '';
    }
  } else if (String(targetKey || '').startsWith('guest:')) {
    const g = db.findGuestByKey(targetKey);
    if (g) {
      targetName = g.name || targetName;
      targetIp = g.last_ip || '';
      targetDevice = g.last_device_id || '';
      targetFingerprint = g.last_fingerprint || '';
    }
  }
  const live = onlinePresenceMap.get(targetKey);
  if (live) {
    targetName = live.name || targetName;
    targetRole = live.role || targetRole;
    targetEmail = live.email || targetEmail;
    targetIp = live.ipAddress || targetIp;
    targetDevice = live.deviceId || targetDevice;
    targetFingerprint = live.fingerprint || targetFingerprint;
  }
  return { targetName, targetRole, targetEmail, targetIp, targetDevice, targetFingerprint };
}

function canModerateWithImmunity(actorEntry, targetKey, { checkImmunePerm = false } = {}) {
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
    if (checkImmunePerm && db.hasPermission(info.targetRole, 'immune')) {
      return { allowed: false, reason: 'هذا العضو يمتلك حصانة إدارية ضد الكتم والطرد.' };
    }
  }
  return { allowed: true, info };
}

app.post('/api/mod/warn', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const roomId = String(req.body?.roomId || entry.roomId || 'general');
  const targetKey = String(req.body?.targetKey || '').trim();
  const isMgr =
    entry.role === 'site_owner' ||
    db.isRoomManager(roomId, entry.userId, entry.role) ||
    canDo(entry.role, 'mute') ||
    canDo(entry.role, 'kick') ||
    canDo(entry.role, 'ban');
  if (!isMgr) return res.status(403).json({ error: 'لا تملك صلاحية توجيه التحذيرات.' });
  const check = canModerateWithImmunity(entry, targetKey);
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  const cleanReason = String(req.body?.reason || '').trim().slice(0, 240) || 'مخالفة قوانين الغرفة';

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
  emitNotificationToUser(null, targetKey, notif);
  const warnPayload = { byName: entry.name, byRole: entry.role, reason: cleanReason, roomId };
  db.patchUserStateDoc(targetKey, {
    lastWarningAt: Date.now(),
    lastWarning: warnPayload
  });
  emitToUserKey(targetKey, 'warning', warnPayload);
  emitRoomNoticeMessage(roomId, `⚠️ وجّه "${entry.name}" تحذيراً إدارياً إلى "${check.info.targetName}": ${cleanReason}`);
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/mute', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const roomId = String(req.body?.roomId || entry.roomId || 'general');
  const targetKey = String(req.body?.targetKey || '').trim();
  const unmute = Boolean(req.body?.unmute);
  const isOwner = entry.role === 'site_owner';
  const isMgr = isOwner || db.isRoomManager(roomId, entry.userId, entry.role) || canDo(entry.role, 'mute');
  if (!isMgr) return res.status(403).json({ error: 'لا تملك صلاحية الكتم.' });
  const check = canModerateWithImmunity(entry, targetKey, { checkImmunePerm: true });
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  if (unmute) {
    db.removeMute(targetKey, roomId);
    emitMuteStateToUser(targetKey, roomId);
    emitRoomNoticeMessage(roomId, `🔊 قام "${entry.name}" بفك الكتم عن "${check.info.targetName}".`);
    db.addAdminLog({
      actorKey: entry.key,
      actorName: entry.name,
      actorRole: entry.role,
      action: 'فك كتم',
      targetKey,
      targetName: check.info.targetName,
      details: roomId
    });
    await db.flushWrites();
    return res.json({ ok: true });
  }

  const minsNum = Number(req.body?.minutes) || 15;
  const cleanReason = String(req.body?.reason || '').trim().slice(0, 240);
  const effectiveReason = cleanReason || (isOwner ? 'بقرار من المالك' : 'بقرار إداري');
  const mins = Math.max(1, Math.min(1440, Math.floor(minsNum)));
  db.setMute(targetKey, roomId, mins * 60 * 1000, entry.name, effectiveReason, {
    targetName: check.info.targetName,
    mutedByKey: entry.key
  });
  activeMutedKeysTracker.add(targetKey);
  releaseUserMicsInRoom(targetKey, roomId);
  emitMuteStateToUser(targetKey, roomId);
  notifyUserMutedNotification(targetKey, mins);
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: 'كتم عضو',
    targetKey,
    targetName: check.info.targetName,
    details: `${mins} دقيقة • السبب: ${effectiveReason}`
  });
  notifyOwnersModerationEvent({
    actorName: entry.name,
    actorKey: entry.key,
    targetName: check.info.targetName,
    targetKey,
    actionType: 'mute',
    reason: effectiveReason,
    durationMins: mins,
    roomId
  });
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/kick', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const roomId = String(req.body?.roomId || entry.roomId || 'general');
  const targetKey = String(req.body?.targetKey || '').trim();
  const isOwner = entry.role === 'site_owner';
  const isMgr =
    isOwner ||
    db.hasRoomOwnerPermission(roomId, entry.userId, entry.role, 'kick') ||
    canDo(entry.role, 'kick');
  if (!isMgr) return res.status(403).json({ error: 'لا تملك صلاحية الطرد.' });
  const check = canModerateWithImmunity(entry, targetKey, { checkImmunePerm: true });
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  const cleanReason = db.sanitizePlainText(String(req.body?.reason || ''), 240);
  const effectiveReason = cleanReason || (isOwner ? 'بقرار من المالك' : 'بقرار إداري');
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: 'طرد من الغرفة',
    targetKey,
    targetName: check.info.targetName,
    details: `${roomId} • السبب: ${effectiveReason}`
  });
  kickTargetFromPresence(targetKey, {
    reason: `تم طردك من الغرفة بواسطة ${entry.name}${cleanReason ? ` — السبب: ${cleanReason}` : ''}`,
    banned: false
  });
  notifyOwnersModerationEvent({
    actorName: entry.name,
    actorKey: entry.key,
    targetName: check.info.targetName,
    targetKey,
    actionType: 'kick',
    reason: effectiveReason,
    roomId
  });
  emitRoomNoticeMessage(
    roomId,
    `🚪 قام "${entry.name}" بطرد "${check.info.targetName}" من الغرفة${cleanReason ? ` — السبب: ${cleanReason}` : ''}`
  );
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/room-ban', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const roomId = String(req.body?.roomId || entry.roomId || 'general').trim();
  const targetKey = String(req.body?.targetKey || '').trim();
  const unban = Boolean(req.body?.unban);
  const rm = db.getRoomById(roomId);
  if (!rm) return res.status(404).json({ error: 'الغرفة غير موجودة.' });

  const isOwner = entry.role === 'site_owner';
  const canRoomBan =
    isOwner ||
    canDo(entry.role, 'ban') ||
    db.hasRoomOwnerPermission(roomId, entry.userId, entry.role, 'room_ban');
  if (!canRoomBan) return res.status(403).json({ error: 'لا تملك صلاحية الحظر من هذه الغرفة.' });

  if (unban) {
    db.unbanFromRoom(roomId, targetKey);
    db.addAdminLog({
      actorKey: entry.key,
      actorName: entry.name,
      actorRole: entry.role,
      action: 'فك حظر غرفة',
      targetKey,
      details: rm.name
    });
    await db.flushWrites();
    return res.json({ ok: true, roomBans: db.getRoomBans(roomId) });
  }

  const check = canModerateWithImmunity(entry, targetKey, { checkImmunePerm: true });
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  const cleanReason = db.sanitizePlainText(String(req.body?.reason || ''), 200);
  const effectiveReason = cleanReason || (isOwner ? 'بقرار من المالك' : 'بقرار إدارة الغرفة');
  db.banFromRoom({
    roomId,
    targetKey,
    targetName: check.info.targetName,
    reason: effectiveReason,
    bannedBy: entry.name,
    bannedByKey: entry.key
  });
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: 'حظر من غرفة',
    targetKey,
    targetName: check.info.targetName,
    details: `${rm.name} • ${effectiveReason}`
  });

  const live = onlinePresenceMap.get(targetKey);
  if (live && live.roomId === roomId) {
    if (roomId !== 'general' && db.getRoomById('general') && !db.isBannedFromRoom('general', targetKey)) {
      movePresenceToRoom(live, 'general', {}, true);
      db.patchUserStateDoc(targetKey, {
        forceRoomId: 'general',
        forceRoomNotice: `تم حظرك من غرفة "${rm.name}" بواسطة ${entry.name} (${effectiveReason}).`,
        forceRoomAt: Date.now()
      });
      emitToUserKey(targetKey, 'forced_room_move', { roomId: 'general' });
    } else {
      kickTargetFromPresence(targetKey, {
        reason: `تم حظرك من غرفة "${rm.name}" بواسطة ${entry.name} (${effectiveReason})`,
        banned: false
      });
    }
  }
  emitRoomNoticeMessage(roomId, `🚫 قام "${entry.name}" بحظر "${check.info.targetName}" من الغرفة.`);
  await db.flushWrites();
  return res.json({ ok: true, roomBans: db.getRoomBans(roomId) });
});

app.post('/api/mod/ban', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const targetKey = String(req.body?.targetKey || '').trim();
  const banType = req.body?.banType === 'xban' ? 'xban' : 'ban';
  const isOwner = entry.role === 'site_owner';
  if (!isOwner && !canDo(entry.role, 'ban')) return res.status(403).json({ error: 'لا تملك صلاحية الحظر.' });
  const check = canModerateWithImmunity(entry, targetKey);
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  const cleanReason = String(req.body?.reason || '').trim().slice(0, 240);
  const effectiveReason = cleanReason || (banType === 'xban' ? 'بقرار إداري (X-Ban)' : 'بقرار إداري');
  const { targetName, targetEmail, targetIp, targetDevice, targetFingerprint } = check.info;
  db.banTarget({
    targetKey,
    targetName,
    email: targetEmail,
    ipAddress: targetIp,
    deviceId: banType === 'xban' ? targetDevice : '',
    fingerprint: banType === 'xban' ? targetFingerprint : '',
    banType,
    reason: effectiveReason,
    bannedBy: entry.name,
    bannedByKey: entry.key
  });
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: banType === 'xban' ? 'إكس باند X-Ban' : 'حظر نهائي',
    targetKey,
    targetName,
    details: effectiveReason
  });
  notifyOwnersModerationEvent({
    actorName: entry.name,
    actorKey: entry.key,
    targetName,
    targetKey,
    actionType: banType,
    reason: effectiveReason
  });
  kickTargetFromPresence(targetKey, { reason: 'تم حظرك من الشات', banned: true });
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/ghost', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'mute') && !canDo(entry.role, 'ban')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية وضع الشبح.' });
  }
  const targetKey = String(req.body?.targetKey || '').trim();
  const enabled = Boolean(req.body?.enabled !== false);
  if (!targetKey || !targetKey.startsWith('user:') || db.isProtectedSupremeOwnerKey(targetKey)) {
    return res.status(400).json({ error: 'لا يمكن تطبيق وضع الشبح على هذا الحساب.' });
  }
  const check = canModerateWithImmunity(entry, targetKey, { checkImmunePerm: true });
  if (!check.allowed) return res.status(403).json({ error: check.reason });

  const uid = Number(targetKey.replace('user:', ''));
  const targetRow = db.findUserById(uid);
  if (!targetRow) return res.status(404).json({ error: 'العضو غير موجود.' });
  const resGhost = db.setUserGhosted(uid, enabled);
  if (resGhost.error) return res.status(400).json({ error: resGhost.error });
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: enabled ? 'تفعيل شبح' : 'إلغاء شبح',
    targetKey,
    targetName: db.getEffectiveName(targetRow)
  });
  syncUserPresence(uid);
  await db.flushWrites();
  return res.json({ ok: true, isGhosted: enabled });
});

app.post('/api/mod/delete-account', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  if (entry.role !== 'site_owner') return res.status(403).json({ error: 'حذف الحسابات متاح لصاحب الموقع فقط.' });
  const uid = Number(req.body?.userId);
  const resDel = db.deleteUserAccountPermanently(uid);
  if (resDel.error) return res.status(400).json({ error: resDel.error });
  db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'حذف حساب نهائي', targetKey: `user:${uid}` });
  kickTargetFromPresence(`user:${uid}`, { reason: 'تم حذف حسابك نهائياً من قبل صاحب الموقع.', banned: false });
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/set-role', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const userId = Number(req.body?.userId);
  const newRole = String(req.body?.newRole || '').trim();
  const roomId = String(req.body?.roomId || entry.roomId || 'general');
  const canDelegate =
    entry.role === 'site_owner' ||
    canDo(entry.role, 'set_rank') ||
    db.hasRoomOwnerPermission(roomId, entry.userId, entry.role, 'assign_roles');
  if (!canDelegate) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل الرتب.' });
  }
  const target = db.findUserById(userId);
  if (!target) return res.status(404).json({ error: 'العضو غير موجود.' });
  if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(entry.email)) {
    return res.status(403).json({ error: 'صاحب الموقع محمي ولا يمكن تغيير رتبته.' });
  }
  const myPower = db.getRankPower(entry.role);
  if (entry.role !== 'site_owner') {
    if (db.getRankPower(target.role) >= myPower) {
      return res.status(403).json({ error: 'لا يمكنك تعديل رتبة مساوية لك أو أعلى منك.' });
    }
    if (!db.canAssignRankTo(entry.role, newRole, { roomId, actorUserId: entry.userId })) {
      return res.status(403).json({ error: 'ليس لديك صلاحية منح هذه الرتبة المحددة.' });
    }
  }
  const updated = db.updateUserRole(userId, newRole);
  if (!updated) return res.status(400).json({ error: 'تعذر تحديث الرتبة.' });
  syncUserPresence(userId);
  const rank = db.getRankByKey(newRole);
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: 'تعديل رتبة',
    targetKey: `user:${userId}`,
    targetName: db.getEffectiveName(updated),
    details: rank.label
  });
  emitRoomNoticeMessage(
    roomId,
    `🎖️ تم ترقية/تعديل رتبة "${db.getEffectiveName(updated)}" إلى (${rank.icon} ${rank.label}) بواسطة ${entry.name}.`
  );
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/force-name', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'access_panel') && !canDo(entry.role, 'mute')) {
    return res.status(403).json({ error: 'لا تملك صلاحية تغيير الأسماء.' });
  }
  const clean = db.sanitizePlainText(String(req.body?.newDisplayName || ''), 28);
  if (clean.length < 2) return res.status(400).json({ error: 'الاسم الجديد قصير جداً.' });
  const userId = req.body?.userId ? Number(req.body.userId) : null;
  const resolvedKey = String(req.body?.targetKey || (userId ? `user:${userId}` : '')).trim();
  if (resolvedKey && resolvedKey.startsWith('guest:')) {
    const updatedGuest = db.updateGuestCustomization(resolvedKey, { displayName: clean });
    const live = onlinePresenceMap.get(resolvedKey);
    if (live) {
      live.name = clean;
      live.displayName = clean;
      upsertOnlinePresence(live, {}, live.roomId || 'general');
    }
    db.patchUserStateDoc(resolvedKey, { forcedNameAt: Date.now(), name: clean, displayName: clean });
    emitToUserKey(resolvedKey, 'session_patch', { name: clean, displayName: clean });
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'تغيير اسم زائر', targetKey: resolvedKey, targetName: clean });
    await db.flushWrites();
    return res.json({ ok: true, name: clean, guest: updatedGuest });
  }
  const uid = Number(userId || resolvedKey.replace('user:', ''));
  const target = db.findUserById(uid);
  if (!target) return res.status(404).json({ error: 'العضو غير موجود.' });
  if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(entry.email)) {
    return res.status(403).json({ error: 'صاحب الموقع محمي.' });
  }
  if (entry.role !== 'site_owner' && db.getRankPower(target.role) >= db.getRankPower(entry.role)) {
    return res.status(403).json({ error: 'لا يمكنك تعديل اسم عضو برتبة مساوية أو أعلى منك.' });
  }
  db.forceChangeUserDisplayName(uid, clean);
  db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'تغيير اسم عضو', targetKey: `user:${uid}`, targetName: clean });
  syncUserPresence(uid);
  await db.flushWrites();
  return res.json({ ok: true, name: clean });
});

app.post('/api/mod/clear-avatar', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'access_panel') && !canDo(entry.role, 'mute')) {
    return res.status(403).json({ error: 'لا تملك صلاحية مسح الصور.' });
  }
  const userId = req.body?.userId ? Number(req.body.userId) : null;
  const resolvedKey = String(req.body?.targetKey || (userId ? `user:${userId}` : '')).trim();
  if (resolvedKey && resolvedKey.startsWith('guest:')) {
    db.updateGuestCustomization(resolvedKey, { avatarUrl: '' });
    const live = onlinePresenceMap.get(resolvedKey);
    if (live) {
      live.avatarUrl = '';
      upsertOnlinePresence(live, {}, live.roomId || 'general');
    }
    db.patchUserStateDoc(resolvedKey, { avatarClearedAt: Date.now(), avatarUrl: '' });
    emitToUserKey(resolvedKey, 'session_patch', { avatarUrl: '' });
    db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'مسح صورة زائر', targetKey: resolvedKey });
    await db.flushWrites();
    return res.json({ ok: true });
  }
  const uid = Number(userId || resolvedKey.replace('user:', ''));
  const target = db.findUserById(uid);
  if (!target) return res.status(404).json({ error: 'العضو غير موجود.' });
  if (db.isSupremeOwnerEmail(target.email) && !db.isSupremeOwnerEmail(entry.email)) {
    return res.status(403).json({ error: 'صاحب الموقع محمي.' });
  }
  if (entry.role !== 'site_owner' && db.getRankPower(target.role) >= db.getRankPower(entry.role)) {
    return res.status(403).json({ error: 'لا يمكنك مسح صورة عضو برتبة مساوية أو أعلى منك.' });
  }
  db.adminClearUserAvatar(uid);
  db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'مسح صورة عضو', targetKey: `user:${uid}`, targetName: db.getEffectiveName(target) });
  syncUserPresence(uid);
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/give-coins', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  if (entry.role !== 'site_owner' && !canDo(entry.role, 'give_coins')) {
    return res.status(403).json({ error: 'ليست لديك صلاحية منح النقاط أو الروبي.' });
  }
  const userId = Number(req.body?.userId);
  const delta = Number(req.body?.amount) || 0;
  if (!delta) return res.status(400).json({ error: 'يرجى تحديد كمية صحيحة.' });
  const updated = db.adjustUserCoins(userId, delta);
  if (!updated) return res.status(404).json({ error: 'العضو غير موجود.' });
  db.addAdminLog({
    actorKey: entry.key,
    actorName: entry.name,
    actorRole: entry.role,
    action: delta >= 0 ? 'منح روبي' : 'خصم روبي',
    targetKey: `user:${userId}`,
    targetName: db.getEffectiveName(updated),
    details: `${delta >= 0 ? `+${delta}` : delta} روبي`
  });
  syncUserPresence(userId);
  await db.flushWrites();
  return res.json({ ok: true, coins: updated.coins });
});

app.post('/api/mod/clear-room', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const roomId = String(req.body?.roomId || entry.roomId || 'general');
  const isMgr = db.isRoomManager(roomId, entry.userId, entry.role) || canDo(entry.role, 'clear_room');
  if (!isMgr) return res.status(403).json({ error: 'لا تملك صلاحية مسح رسائل الغرفة.' });
  db.clearRoomMessages(roomId);
  db.addAdminLog({ actorKey: entry.key, actorName: entry.name, actorRole: entry.role, action: 'مسح رسائل الغرفة', targetKey: roomId });
  emitRoomNoticeMessage(roomId, `🧹 تم مسح رسائل الغرفة بواسطة ${entry.name}`, {
    client_msg_id: `room_cleared:${Date.now()}`
  });
  await db.flushWrites();
  return res.json({ ok: true });
});

app.post('/api/mod/room-update', requireAuth, async (req, res) => {
  const entry = getPresenceOrAuthEntry(req);
  const rid = String(req.body?.roomId || entry.roomId || 'general');
  const isFullAdmin = entry.role === 'site_owner' || canDo(entry.role, 'manage_rooms');
  if (!isFullAdmin && !db.hasRoomOwnerPermission(rid, entry.userId, entry.role, 'style_bg')) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذه الغرفة.' });
  }
  const patch = { ...(req.body || {}) };
  if (patch.imageUrl) {
    const chk = validateHttpsOrLocalUrl(patch.imageUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `صورة الغرفة: ${chk.error}` });
  }
  if (patch.wallpaperUrl) {
    const chk = validateHttpsOrLocalUrl(patch.wallpaperUrl, { allowDataImage: true });
    if (!chk.ok) return res.status(400).json({ error: `خلفية الغرفة: ${chk.error}` });
  }
  if (!isFullAdmin) {
    delete patch.ownerUserId;
    delete patch.ownerPerms;
    delete patch.ownerAllowedRoles;
  }
  const updated = db.updateRoom(rid, patch);
  if (!updated) return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  const pubRoom = db.sanitizeRoomForPublic(updated);
  if (io && pubRoom) io.to(rid).emit('room_updated', pubRoom);
  broadcastRoomsList();
  await db.flushWrites();
  return res.json({ ok: true, room: pubRoom });
});

// Handle Multer / Upload errors gracefully without crashing
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (2MB للصورة / 6MB للصوت).' });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'خطأ في معالجة الطلب.' });
  }
  return res.status(500).json({ error: 'خطأ غير متوقع في الخادم.' });
});

const server = http.createServer(app);
io = new SocketIOServer(server, {
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});

io.use((socket, next) => {
  try {
    const authHeader = String(socket.handshake?.headers?.authorization || '');
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const token = String(socket.handshake?.auth?.token || bearer || '').trim();
    const telemetry = getClientTelemetry(socket);
    const user = resolveAuthUserFromToken(token, telemetry);
    if (!user) return next(new Error('AUTH_REQUIRED'));
    if (user.banned) return next(new Error('BANNED'));
    socket.authUser = user;
    socket.clientTelemetry = telemetry;
    return next();
  } catch {
    return next(new Error('AUTH_ERROR'));
  }
});

io.on('connection', (socket) => {
  const authUser = socket.authUser;
  if (!authUser || !authUser.key) {
    socket.disconnect(true);
    return;
  }
  const userKey = authUser.key;
  const pendingTimer = socketGraceTimers.get(userKey);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    socketGraceTimers.delete(userKey);
  }
  if (!userSocketsMap.has(userKey)) {
    userSocketsMap.set(userKey, new Set());
  }
  userSocketsMap.get(userKey).add(socket);

  const requestedRoom = String(socket.handshake?.auth?.roomId || '').trim();
  const existingEntry = onlinePresenceMap.get(userKey);
  const targetRoomId = requestedRoom && db.getRoomById(requestedRoom)
    ? requestedRoom
    : (existingEntry?.roomId && db.getRoomById(existingEntry.roomId) ? existingEntry.roomId : (db.getAllRooms()[0]?.id || 'general'));
  const entry = upsertOnlinePresence(authUser, socket.clientTelemetry || {}, targetRoomId);
  if (entry?.roomId) {
    socket.join(entry.roomId);
    socket.emit('room_users', {
      roomId: entry.roomId,
      users: getRoomUsersList(entry.roomId),
      roomKingKey: computeRoomKingKey(entry.roomId)
    });
    socket.emit('room_mics', {
      roomId: entry.roomId,
      slots: getPublicMicSlots(entry.roomId)
    });
  }
  socket.emit('online_users', buildGlobalOnlineUsers());
  socket.emit('rooms', buildRoomsPayload());

  socket.on('join_room', async (payload = {}, ack) => {
    try {
      const roomId = String(payload.roomId || '').trim();
      const rm = db.getRoomById(roomId);
      if (!rm) {
        if (typeof ack === 'function') ack({ error: 'الغرفة غير موجودة.' });
        return;
      }
      const live = onlinePresenceMap.get(userKey) || upsertOnlinePresence(authUser, socket.clientTelemetry || {}, roomId);
      const isOwnerOrMod = live.role === 'site_owner' || canDo(live.role, 'manage_rooms');
      if (!isOwnerOrMod && db.isBannedFromRoom(roomId, live.key)) {
        if (typeof ack === 'function') ack({ error: 'تم حظرك من دخول هذه الغرفة.', roomBanned: true });
        return;
      }
      if (!isOwnerOrMod && (Number(rm.min_rank_power) || 0) > db.getRankPower(live.role)) {
        if (typeof ack === 'function') ack({ error: `الدخول لهذه الغرفة يتطلب رتبة بقوة ${rm.min_rank_power} فأعلى.` });
        return;
      }
      if (!isOwnerOrMod && rm.room_password && rm.room_password.trim()) {
        if (String(payload.password || '').trim() !== rm.room_password.trim()) {
          if (typeof ack === 'function') ack({ error: 'كلمة مرور الغرفة غير صحيحة.', requiresPassword: true });
          return;
        }
      }
      const roomState = movePresenceToRoom(live, roomId, socket.clientTelemetry || {}, Boolean(payload.silent));
      await db.flushWrites();
      if (typeof ack === 'function') {
        ack({ ok: true, ...roomState, rooms: buildRoomsPayload(), onlineUsers: buildGlobalOnlineUsers() });
      }
    } catch (err) {
      if (typeof ack === 'function') ack({ error: err?.message || 'تعذر الانضمام للغرفة.' });
    }
  });

  socket.on('send_message', async (payload = {}, ack) => {
    try {
      const live = onlinePresenceMap.get(userKey) || upsertOnlinePresence(authUser, socket.clientTelemetry || {}, payload?.roomId || 'general');
      const result = await processIncomingChatMessage(live, payload || {});
      if (result.error) {
        if (typeof ack === 'function') ack({ error: result.error, status: result.status, ...(result.extra || {}) });
        return;
      }
      if (typeof ack === 'function') ack(result.data);
    } catch (err) {
      if (typeof ack === 'function') ack({ error: err?.message || 'فشل إرسال الرسالة.' });
    }
  });

  socket.on('typing', (payload = {}) => {
    try {
      const live = onlinePresenceMap.get(userKey);
      if (!live || isStealthEntry(live)) return;
      const roomId = String(payload.roomId || live.roomId || '').trim();
      if (!roomId || roomId !== live.roomId) return;
      const isTyping = Boolean(payload.isTyping);
      live.typingInRoom = isTyping ? roomId : '';
      live.typingAt = isTyping ? Date.now() : 0;
      broadcastTypingUsers(roomId);
    } catch {
      // ignore
    }
  });

  socket.on('webrtc_signal', (payload = {}) => {
    try {
      const live = onlinePresenceMap.get(userKey);
      if (!live) return;
      const cleanType = ['ready', 'offer', 'answer', 'ice'].includes(payload?.type) ? payload.type : '';
      if (!cleanType) return;
      const targetRoomId = String(payload.roomId || live.roomId || 'general');
      const sigObj = {
        id: `sig_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        type: cleanType,
        roomId: targetRoomId,
        fromKey: live.key,
        fromName: live.name,
        toKey: String(payload.toKey || ''),
        slot: Number(payload.slot) || 1,
        sdp: payload.sdp || null,
        candidate: payload.candidate || null,
        createdAtMs: Date.now()
      };
      if (sigObj.toKey) emitToUserKey(sigObj.toKey, 'webrtc_signal', sigObj);
      else socket.to(targetRoomId).emit('webrtc_signal', sigObj);
    } catch {
      // ignore
    }
  });

  socket.on('disconnect', () => {
    const set = userSocketsMap.get(userKey);
    if (set) {
      set.delete(socket);
      if (set.size === 0) userSocketsMap.delete(userKey);
    }
    if (!userSocketsMap.has(userKey)) {
      const t = setTimeout(() => {
        socketGraceTimers.delete(userKey);
        const cur = onlinePresenceMap.get(userKey);
        if (!userSocketsMap.has(userKey) && cur && Date.now() - (Number(cur.lastHeartbeat) || 0) > 12000) {
          removeOnlinePresence(userKey);
        }
      }, 14000);
      if (typeof t.unref === 'function') t.unref();
      socketGraceTimers.set(userKey, t);
    }
  });
});

// ==========================================
// STARTUP
// ==========================================
async function start() {
  await db.init({
    onMessageAdded(msg) {
      if (!io || !msg || !msg.room_id) return;
      if (msg.is_ghost_only) {
        emitToUserKey(msg.sender_key, 'new_message', msg);
      } else {
        io.to(msg.room_id).emit('new_message', msg);
      }
    },
    onMessageUpdated(msg) {
      if (!io || !msg || !msg.room_id) return;
      io.to(msg.room_id).emit('message_updated', msg);
    },
    onMessageDeleted(msgId, roomId) {
      if (!io || !roomId) return;
      io.to(roomId).emit('message_deleted', { id: msgId, roomId });
    },
    onRoomCleared(roomId) {
      if (!io || !roomId) return;
      io.to(roomId).emit('room_cleared', { roomId });
    },
    onRoomClearedAll() {
      if (!io) return;
      for (const r of db.getAllRooms()) {
        io.to(r.id).emit('room_cleared', { roomId: r.id });
      }
    },
    onPrivateMessage(pm) {
      if (!io || !pm) return;
      if (pm.from_key) emitToUserKey(pm.from_key, 'private_message', pm);
      if (pm.to_key && pm.to_key !== pm.from_key) emitToUserKey(pm.to_key, 'private_message', pm);
    },
    onNotification(notif) {
      if (!io || !notif) return;
      if (notif.target_key === '*') {
        io.emit('notification', notif);
      } else if (notif.target_key) {
        emitToUserKey(notif.target_key, 'notification', notif);
      }
    },
    onEmojisChanged(emojis) {
      if (!io) return;
      io.emit('emojis', emojis || db.getAllCustomEmojis());
    }
  });

  // Anti-AFK Policy: passive 5-minute online presence reward removed; rewards occur exclusively on genuine text chat activity.
  startVirtualMembersLoop();
  startMuteExpiryMonitor();
  startPresenceSweeper();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Arabic CodyChat Server (Socket.io + Firebase Real-Time) listening on http://0.0.0.0:${PORT}`);
  });
}

let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}, flushing pending Firestore writes...`);
  try {
    await db.flushWrites();
  } catch {
    // ignore
  }
  process.exit(0);
}
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection Guard]', reason?.stack || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException Guard]', err?.stack || err);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
