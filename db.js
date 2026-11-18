const path = require('node:path');
const fs = require('node:fs');
const { initializeApp, getApps } = require('firebase/app');
const {
  initializeFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot
} = require('firebase/firestore');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0018513004';
const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-android-34a0c37b-d80d-4f0d-80fc-e6a16720a8bb';
const FIREBASE_WEB_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyB0CmJYtorLqJvL6Mr97B-7az5zTKtmfEk',
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.FIREBASE_APP_ID || '1:723801973538:android:d6b9f31aeca7ee2faebb7b'
};

const SUPREME_OWNER_EMAIL = 'a38125923@gmail.com';

const GIFT_CATALOG = [
  { id: 'rose', name: 'وردة حمراء', emoji: '🌹', cost: 50, reward: 25, tier: 'classic', color: '#e11d48' },
  { id: 'coffee', name: 'فنجان قهوة', emoji: '☕', cost: 75, reward: 40, tier: 'classic', color: '#b45309' },
  { id: 'heart', name: 'قلب متوهج', emoji: '💖', cost: 120, reward: 60, tier: 'warm', color: '#ec4899' },
  { id: 'bouquet', name: 'باقة زهور', emoji: '💐', cost: 200, reward: 100, tier: 'warm', color: '#db2777' },
  { id: 'perfume', name: 'عطر فاخر', emoji: '✨', cost: 320, reward: 160, tier: 'vip', color: '#8b5cf6' },
  { id: 'ring', name: 'خاتم ألماس', emoji: '💍', cost: 500, reward: 250, tier: 'vip', color: '#0284c7' },
  { id: 'crown', name: 'تاج ملكي', emoji: '👑', cost: 750, reward: 375, tier: 'royal', color: '#d97706' },
  { id: 'diamond', name: 'جوهرة نادرة', emoji: '💎', cost: 1000, reward: 500, tier: 'royal', color: '#0ea5e9' },
  { id: 'car', name: 'سيارة رياضية', emoji: '🏎️', cost: 1800, reward: 900, tier: 'legend', color: '#dc2626' },
  { id: 'castle', name: 'قصر الأحلام', emoji: '🏰', cost: 3000, reward: 1500, tier: 'legend', color: '#7c3aed' }
];

function isSupremeOwnerEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPREME_OWNER_EMAIL;
}

function isProtectedSupremeOwnerKey(targetKey) {
  if (!targetKey || !String(targetKey).startsWith('user:')) return false;
  const uid = Number(String(targetKey).replace('user:', ''));
  if (Number.isNaN(uid)) return false;
  const u = store.usersById.get(uid);
  return Boolean(u && isSupremeOwnerEmail(u.email));
}

function enforceSupremeOwnerUser(u) {
  if (!u || !isSupremeOwnerEmail(u.email)) return u;
  const patch = {};
  let changed = false;
  if (u.role !== 'site_owner') {
    u.role = 'site_owner';
    patch.role = 'site_owner';
    changed = true;
  }
  if (u.is_banned !== 0 || u.ban_reason) {
    u.is_banned = 0;
    u.ban_reason = '';
    patch.is_banned = 0;
    patch.ban_reason = '';
    changed = true;
  }
  if (!u.avatar_frame || u.avatar_frame === 'none') {
    u.avatar_frame = 'gold_royal';
    patch.avatar_frame = 'gold_royal';
    changed = true;
  }
  if (!u.nameplate_style || u.nameplate_style === 'default') {
    u.nameplate_style = 'crimson_royal';
    patch.nameplate_style = 'crimson_royal';
    changed = true;
  }
  if ((Number(u.coins) || 0) < 99999) {
    u.coins = 99999;
    patch.coins = 99999;
    changed = true;
  }
  if (u.is_ghosted) {
    u.is_ghosted = 0;
    patch.is_ghosted = 0;
    changed = true;
  }
  if (changed) {
    enqueueSet('users', String(u.id), patch, true);
    const senderKey = `user:${u.id}`;
    for (const m of store.messagesById.values()) {
      if (m.sender_key === senderKey && m.sender_role !== 'site_owner') {
        m.sender_role = 'site_owner';
        enqueueSet('messages', String(m.doc_id || m.id), { sender_role: 'site_owner' }, true);
      }
    }
  }
  const targetKey = `user:${u.id}`;
  if (store.bansByKey.has(targetKey)) {
    store.bansByKey.delete(targetKey);
    enqueueDelete('bans', safeDocId(targetKey));
  }
  for (const [bk, b] of [...store.bansByKey.entries()]) {
    if (isSupremeOwnerEmail(b.email)) {
      store.bansByKey.delete(bk);
      enqueueDelete('bans', safeDocId(bk));
    }
  }
  for (const [mk, m] of [...store.mutesByKey.entries()]) {
    if (m.target_key === targetKey) {
      store.mutesByKey.delete(mk);
      enqueueDelete('mutes', safeDocId(mk));
    }
  }
  return u;
}

function ensureSupremeOwnersInStore() {
  for (const u of store.usersById.values()) {
    if (isSupremeOwnerEmail(u.email)) {
      enforceSupremeOwnerUser(u);
    }
  }
}

const DEFAULT_RANKS = [
  {
    key: 'site_owner',
    label: 'Owner / صاحب الموقع',
    icon: '👑',
    image_url: '',
    bg_color: '#b91c1c',
    text_color: '#fef3c7',
    power: 100,
    tier_order: 10,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 100
  },
  {
    key: 'super_owner',
    label: 'Super Owner',
    icon: '💎',
    image_url: '',
    bg_color: '#d97706',
    text_color: '#fffbeb',
    power: 99,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 98
  },
  {
    key: 'vip_owner',
    label: 'VIP Owner',
    icon: '🌟',
    image_url: '',
    bg_color: '#ea580c',
    text_color: '#fffbeb',
    power: 98,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 97
  },
  {
    key: 'master_owner',
    label: 'Master Owner',
    icon: '⚜️',
    image_url: '',
    bg_color: '#c026d3',
    text_color: '#ffffff',
    power: 97,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 96
  },
  {
    key: 'master_super',
    label: 'Master Super',
    icon: '🔥',
    image_url: '',
    bg_color: '#9333ea',
    text_color: '#ffffff',
    power: 96,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 95
  },
  {
    key: 'director',
    label: 'Director',
    icon: '🏛️',
    image_url: '',
    bg_color: '#4f46e5',
    text_color: '#ffffff',
    power: 95,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 94
  },
  {
    key: 'moderator',
    label: 'Moderator',
    icon: '🛡️',
    image_url: '',
    bg_color: '#2563eb',
    text_color: '#ffffff',
    power: 94,
    tier_order: 5,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 0,
    perm_clear_room: 1,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  ...[94, 93, 92, 91, 90].map((n) => ({
    key: `support_${n}`,
    label: `Support ${n}`,
    icon: '🎧',
    image_url: '',
    bg_color: '#0284c7',
    text_color: '#ffffff',
    power: n,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: n >= 92 ? 1 : 0,
    perm_set_rank: 0,
    perm_clear_room: n >= 93 ? 1 : 0,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  })),
  {
    key: 'premium',
    label: 'Premium',
    icon: '✨',
    image_url: '',
    bg_color: '#f59e0b',
    text_color: '#1f1300',
    power: 88,
    tier_order: 2,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  ...[87, 86, 85, 84, 83, 82, 81, 80].map((n) => ({
    key: `admin_${n}`,
    label: `عضو إداري رتبة ${n}`,
    icon: '🔰',
    image_url: '',
    bg_color: '#059669',
    text_color: '#ffffff',
    power: n,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: n >= 82 ? 1 : 0,
    perm_ban: n >= 85 ? 1 : 0,
    perm_set_rank: 0,
    perm_clear_room: n >= 84 ? 1 : 0,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  })),
  {
    key: 'founder_79',
    label: 'عضو مؤسس رتبة 79',
    icon: '🏅',
    image_url: '',
    bg_color: '#0f766e',
    text_color: '#ffffff',
    power: 79,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'owner',
    label: 'أونر',
    icon: '⭐',
    image_url: '',
    bg_color: '#f59e0b',
    text_color: '#1f1300',
    power: 98,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 1,
    perm_clear_room: 1,
    perm_manage_rooms: 1,
    perm_access_panel: 1,
    perm_room_owner: 1,
    perm_publish_news: 1,
    perm_use_addons: 1,
    max_assignable_rank: 97
  },
  {
    key: 'super_admin',
    label: 'سوبر أدمن',
    icon: '🛡️',
    image_url: '',
    bg_color: '#7c3aed',
    text_color: '#ffffff',
    power: 70,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 0,
    perm_clear_room: 1,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'admin',
    label: 'أدمن',
    icon: '🔰',
    image_url: '',
    bg_color: '#0284c7',
    text_color: '#ffffff',
    power: 60,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 1,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'general_mod',
    label: 'إداري عام',
    icon: '🎖️',
    image_url: '',
    bg_color: '#059669',
    text_color: '#ffffff',
    power: 50,
    tier_order: 0,
    is_system: 1,
    perm_mute: 1,
    perm_kick: 1,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 1,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'royal_vip',
    label: 'ملكي',
    icon: '⚜️',
    image_url: '',
    bg_color: '#ea580c',
    text_color: '#ffffff',
    power: 40,
    tier_order: 0,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'silver_vip',
    label: 'فضي',
    icon: '🥈',
    image_url: '',
    bg_color: '#94a3b8',
    text_color: '#0f172a',
    power: 30,
    tier_order: 0,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  ...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
    key: `participant_${n}`,
    label: `عضو مشارك رتبة ${n}`,
    icon: '🎗️',
    image_url: '',
    bg_color: '#475569',
    text_color: '#f8fafc',
    power: 10 + n,
    tier_order: 0,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  })),
  {
    key: 'member',
    label: 'عضو',
    icon: '👤',
    image_url: '',
    bg_color: '#334155',
    text_color: '#f8fafc',
    power: 5,
    tier_order: 0,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 1,
    max_assignable_rank: 0
  },
  {
    key: 'guest',
    label: 'زائر',
    icon: '💬',
    image_url: '',
    bg_color: '#64748b',
    text_color: '#ffffff',
    power: 0,
    tier_order: 0,
    is_system: 1,
    perm_mute: 0,
    perm_kick: 0,
    perm_ban: 0,
    perm_set_rank: 0,
    perm_clear_room: 0,
    perm_manage_rooms: 0,
    perm_access_panel: 0,
    perm_room_owner: 0,
    perm_publish_news: 0,
    perm_use_addons: 0,
    max_assignable_rank: 0
  }
];

const DEFAULT_SITE_SETTINGS = {
  id: 1,
  site_name: 'شات الغرف المباشر',
  site_description: 'دردشة عربية فورية • مايكات صوتية • رتب وإطارات ملكية',
  site_logo: '',
  welcome_message: '',
  maintenance_mode: 0,
  top_bar_color: '#1a45e5',
  bottom_bar_color: '#1a45e5',
  button_color: '#f59e0b',
  font_family: 'Cairo',
  font_size: 15,
  custom_css: '',
  custom_html: '',
  updated_at: new Date().toISOString()
};

const DEFAULT_ROOMS = [
  {
    id: 'general',
    name: 'الغرفة العامة',
    description: 'الغرفة الرئيسية للتعارف والدردشة المباشرة للجميع',
    icon: '💬',
    image_url: '/assets/rooms/general.svg',
    bg_theme: 'warm_peach',
    wallpaper_url: '',
    bg_custom: '',
    welcome_message: '',
    room_password: '',
    min_rank_power: 0,
    mics_enabled: 1,
    owner_user_id: null,
    owner_name: '',
    card_bg_color: '',
    card_text_color: '',
    activity_points: 0,
    youtube_video_id: '',
    youtube_title: '',
    youtube_is_playing: 0,
    youtube_updated_at: '',
    created_by: 'system',
    created_at: new Date(1700000000000).toISOString()
  },
  {
    id: 'competitions',
    name: 'غرفة المسابقات',
    description: 'تحديات ثقافية وألغاز ومسابقات تفاعلية ممتعة',
    icon: '🏆',
    image_url: '/assets/rooms/competitions.svg',
    bg_theme: 'sunset_rose',
    wallpaper_url: '',
    bg_custom: '',
    welcome_message: '',
    room_password: '',
    min_rank_power: 0,
    mics_enabled: 1,
    owner_user_id: null,
    owner_name: '',
    card_bg_color: '',
    card_text_color: '',
    activity_points: 0,
    youtube_video_id: '',
    youtube_title: '',
    youtube_is_playing: 0,
    youtube_updated_at: '',
    created_by: 'system',
    created_at: new Date(1700000001000).toISOString()
  },
  {
    id: 'tech-games',
    name: 'التقنية والألعاب',
    description: 'نقاشات البرمجة والتقنية وأحدث الألعاب الإلكترونية',
    icon: '🎮',
    image_url: '/assets/rooms/tech.svg',
    bg_theme: 'sky_breeze',
    wallpaper_url: '',
    bg_custom: '',
    welcome_message: '',
    room_password: '',
    min_rank_power: 0,
    mics_enabled: 1,
    owner_user_id: null,
    owner_name: '',
    card_bg_color: '',
    card_text_color: '',
    activity_points: 0,
    youtube_video_id: '',
    youtube_title: '',
    youtube_is_playing: 0,
    youtube_updated_at: '',
    created_by: 'system',
    created_at: new Date(1700000002000).toISOString()
  }
];

function safeDocId(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'empty';
  return Buffer.from(s, 'utf8').toString('base64url');
}

function nowIso() {
  return new Date().toISOString();
}

function toMs(isoOrSql) {
  if (!isoOrSql) return Date.now();
  if (typeof isoOrSql === 'number') return isoOrSql;
  const s = String(isoOrSql);
  const normalized = s.includes('T') ? s : `${s.replace(' ', 'T')}Z`;
  const t = new Date(normalized).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

let fsMode = 'client';
let fsAdminDb = null;
let fsClientDb = null;
let sqliteDb = null;
let initialized = false;
let initPromise = null;
const unsubscribers = [];
const pendingWrites = new Set();
const localEmittedMessageIds = new Set();

function trackWrite(promise) {
  pendingWrites.add(promise);
  promise.finally(() => pendingWrites.delete(promise));
  return promise;
}

async function flushWrites() {
  while (pendingWrites.size > 0) {
    await Promise.allSettled([...pendingWrites]);
  }
}

function createSqliteFallbackDriver() {
  const { DatabaseSync } = require('node:sqlite');
  const dataDir = path.join(__dirname, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  sqliteDb = new DatabaseSync(path.join(dataDir, 'chat.db'));
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS kv_docs (
      col TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (col, doc_id)
    )
  `);
  fsMode = 'sqlite';
}

function createFirestoreDriver() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (saJson || (gacPath && fs.existsSync(gacPath))) {
    try {
      const adminApp = require('firebase-admin/app');
      const adminFs = require('firebase-admin/firestore');
      let app;
      if (adminApp.getApps().length > 0) {
        app = adminApp.getApps()[0];
      } else if (saJson) {
        app = adminApp.initializeApp({
          credential: adminApp.cert(JSON.parse(saJson))
        });
      } else {
        app = adminApp.initializeApp({
          credential: adminApp.applicationDefault()
        });
      }
      fsAdminDb = adminFs.getFirestore(app, FIRESTORE_DATABASE_ID);
      fsMode = 'admin';
      return;
    } catch (err) {
      console.warn('Admin SDK fallback to Firebase Web/Node SDK:', err.message);
    }
  }

  const clientApp = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_WEB_CONFIG);
  fsClientDb = initializeFirestore(
    clientApp,
    { experimentalForceLongPolling: true },
    FIRESTORE_DATABASE_ID
  );
  fsMode = 'client';
}

async function fsGetAll(colName) {
  if (fsMode === 'sqlite') {
    const rows = sqliteDb.prepare('SELECT doc_id, data FROM kv_docs WHERE col = ?').all(String(colName));
    return rows.map((r) => ({ id: r.doc_id, data: JSON.parse(r.data) }));
  }
  if (fsMode === 'admin') {
    const snap = await fsAdminDb.collection(colName).get();
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  }
  const snap = await getDocs(collection(fsClientDb, colName));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function fsSetDoc(colName, docId, data, merge = false) {
  const cleanData = JSON.parse(JSON.stringify(data));
  if (fsMode === 'sqlite') {
    let finalObj = cleanData;
    if (merge) {
      const existing = sqliteDb
        .prepare('SELECT data FROM kv_docs WHERE col = ? AND doc_id = ?')
        .get(String(colName), String(docId));
      if (existing) {
        finalObj = { ...JSON.parse(existing.data), ...cleanData };
      }
    }
    sqliteDb
      .prepare('INSERT INTO kv_docs (col, doc_id, data) VALUES (?, ?, ?) ON CONFLICT(col, doc_id) DO UPDATE SET data = excluded.data')
      .run(String(colName), String(docId), JSON.stringify(finalObj));
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      if (fsMode === 'admin') {
        await fsAdminDb.collection(colName).doc(String(docId)).set(cleanData, { merge });
      } else {
        await setDoc(doc(collection(fsClientDb, colName), String(docId)), cleanData, { merge });
      }
      return;
    } catch (err) {
      if (attempt === 3) {
        console.error(`Firestore setDoc failed [${colName}/${docId}]:`, err.message);
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempt * 250));
    }
  }
}

async function fsDeleteDoc(colName, docId) {
  if (fsMode === 'sqlite') {
    sqliteDb.prepare('DELETE FROM kv_docs WHERE col = ? AND doc_id = ?').run(String(colName), String(docId));
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      if (fsMode === 'admin') {
        await fsAdminDb.collection(colName).doc(String(docId)).delete();
      } else {
        await deleteDoc(doc(collection(fsClientDb, colName), String(docId)));
      }
      return;
    } catch (err) {
      if (attempt === 3) {
        console.error(`Firestore deleteDoc failed [${colName}/${docId}]:`, err.message);
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempt * 250));
    }
  }
}

async function fsBatchSet(colName, entries) {
  if (!entries || entries.length === 0) return;
  if (fsMode === 'sqlite') {
    for (const { docId, data, merge } of entries) {
      await fsSetDoc(colName, docId, data, merge);
    }
    return;
  }
  for (let i = 0; i < entries.length; i += 400) {
    const chunk = entries.slice(i, i + 400);
    if (fsMode === 'admin') {
      const batch = fsAdminDb.batch();
      for (const { docId, data, merge } of chunk) {
        batch.set(fsAdminDb.collection(colName).doc(String(docId)), JSON.parse(JSON.stringify(data)), {
          merge: Boolean(merge)
        });
      }
      await batch.commit();
    } else {
      const batch = writeBatch(fsClientDb);
      const colRef = collection(fsClientDb, colName);
      for (const { docId, data, merge } of chunk) {
        batch.set(doc(colRef, String(docId)), JSON.parse(JSON.stringify(data)), {
          merge: Boolean(merge)
        });
      }
      await batch.commit();
    }
  }
}

async function fsBatchDelete(colName, docIds) {
  if (!docIds || docIds.length === 0) return;
  if (fsMode === 'sqlite') {
    for (const id of docIds) {
      await fsDeleteDoc(colName, id);
    }
    return;
  }
  for (let i = 0; i < docIds.length; i += 400) {
    const chunk = docIds.slice(i, i + 400);
    if (fsMode === 'admin') {
      const batch = fsAdminDb.batch();
      for (const id of chunk) {
        batch.delete(fsAdminDb.collection(colName).doc(String(id)));
      }
      await batch.commit();
    } else {
      const batch = writeBatch(fsClientDb);
      const colRef = collection(fsClientDb, colName);
      for (const id of chunk) {
        batch.delete(doc(colRef, String(id)));
      }
      await batch.commit();
    }
  }
}

function fsListen(colName, onChanges) {
  if (fsMode === 'sqlite') return () => {};
  const handleSnapshot = (snapshot) => {
    const changes = snapshot.docChanges().map((ch) => ({
      type: ch.type,
      id: ch.doc.id,
      data: ch.doc.data()
    }));
    onChanges(changes);
  };
  const handleError = (err) => {
    console.error(`Firestore onSnapshot error [${colName}]:`, err.message);
  };
  if (fsMode === 'admin') {
    return fsAdminDb.collection(colName).onSnapshot(handleSnapshot, handleError);
  }
  return onSnapshot(collection(fsClientDb, colName), handleSnapshot, handleError);
}

function enqueueSet(colName, docId, data, merge = false) {
  return trackWrite(fsSetDoc(colName, docId, data, merge).catch(() => {}));
}

function enqueueDelete(colName, docId) {
  return trackWrite(fsDeleteDoc(colName, docId).catch(() => {}));
}

function enqueueBatchDelete(colName, docIds) {
  return trackWrite(
    fsBatchDelete(colName, docIds).catch((err) => {
      console.error(`Batch delete error [${colName}]:`, err.message);
    })
  );
}

// ==========================================
// REACTIVE IN-MEMORY CACHE
// ==========================================
const store = {
  usersById: new Map(),
  ranksByKey: new Map(),
  siteSettings: { ...DEFAULT_SITE_SETTINGS },
  roomsById: new Map(),
  roomStaffByKey: new Map(),
  messagesById: new Map(),
  mutesByKey: new Map(),
  bansByKey: new Map(),
  customEmojisById: new Map(),
  privateMessagesById: new Map(),
  friendshipsByKey: new Map(),
  wallPostsById: new Map(),
  newsById: new Map(),
  giftsById: new Map(),
  reportsById: new Map(),
  notificationsById: new Map(),
  counters: {
    users: 0,
    messages: 0,
    custom_emojis: 0,
    private_messages: 0,
    wall_posts: 0,
    news: 0,
    gifts: 0,
    reports: 0,
    notifications: 0
  }
};

function nextSeq(name) {
  const nextVal = (Number(store.counters[name]) || 0) + 1;
  store.counters[name] = nextVal;
  enqueueSet('counters', 'sequences', { [name]: nextVal }, true);
  return nextVal;
}

let hooks = {};

function normalizeUserDoc(docId, data) {
  const numId = Number(data.id) || Number(docId) || 0;
  const email = String(data.email || '').toLowerCase();
  const role = String(data.role || 'member');
  const allowStealth = role === 'site_owner' || isSupremeOwnerEmail(email);
  return {
    id: numId,
    username: String(data.username || ''),
    email,
    password_hash: String(data.password_hash || ''),
    role,
    display_name: String(data.display_name || ''),
    name_color: String(data.name_color || '#ffffff'),
    text_color: String(data.text_color || '#ffffff'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Normal'),
    font_style: String(data.font_style || 'Normal'),
    avatar_url: String(data.avatar_url || ''),
    cover_url: String(data.cover_url || ''),
    avatar_frame: String(data.avatar_frame || 'none'),
    nameplate_style: String(data.nameplate_style || 'default'),
    name_shine: String(data.name_shine || 'none'),
    profile_bg_effect: String(data.profile_bg_effect || 'none'),
    vip_wings: data.vip_wings ? 1 : 0,
    profile_music: String(data.profile_music || ''),
    bio: String(data.bio || ''),
    age: String(data.age || ''),
    gender: String(data.gender || ''),
    country: String(data.country || ''),
    allow_calls: data.allow_calls === 0 || data.allow_calls === false ? 0 : 1,
    allow_pm: data.allow_pm === 0 || data.allow_pm === false ? 0 : 1,
    likes_count: Number(data.likes_count) || 0,
    rating_sum: Number(data.rating_sum) || 0,
    rating_count: Number(data.rating_count) || 0,
    coins: data.coins !== undefined ? Number(data.coins) : 1500,
    vip_family: String(data.vip_family || ''),
    is_stealth: allowStealth && data.is_stealth ? 1 : 0,
    is_ghosted: !isSupremeOwnerEmail(email) && data.is_ghosted ? 1 : 0,
    activity_points: Number(data.activity_points) || 0,
    gifts_received: Number(data.gifts_received) || 0,
    gifts_sent: Number(data.gifts_sent) || 0,
    last_ip: String(data.last_ip || ''),
    last_device_id: String(data.last_device_id || ''),
    is_banned: data.is_banned ? 1 : 0,
    ban_reason: String(data.ban_reason || ''),
    created_at: String(data.created_at || nowIso())
  };
}

function normalizeMessageDoc(docId, data) {
  const numericId = Number(data.id) || Number(docId) || 0;
  return {
    id: numericId || String(docId),
    doc_id: String(docId),
    room_id: String(data.room_id || ''),
    sender_key: String(data.sender_key || ''),
    sender_name: String(data.sender_name || ''),
    sender_role: String(data.sender_role || 'member'),
    name_color: String(data.name_color || '#ffffff'),
    text_color: String(data.text_color || '#ffffff'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Normal'),
    font_style: String(data.font_style || 'Normal'),
    avatar_url: String(data.avatar_url || ''),
    avatar_frame: String(data.avatar_frame || 'none'),
    nameplate_style: String(data.nameplate_style || 'default'),
    name_shine: String(data.name_shine || 'none'),
    vip_wings: data.vip_wings ? 1 : 0,
    is_admin_notice: Boolean(data.is_admin_notice),
    is_gift: Boolean(data.is_gift),
    is_ghost_only: Boolean(data.is_ghost_only),
    gift_data: data.gift_data || null,
    msg_type: String(data.msg_type || 'text'),
    content: String(data.content || ''),
    media_url: String(data.media_url || ''),
    client_msg_id: String(data.client_msg_id || ''),
    created_at: String(data.created_at || nowIso()),
    created_at_ms: Number(data.created_at_ms) || toMs(data.created_at)
  };
}

function normalizeRoomDoc(docId, data) {
  return {
    id: String(data.id || docId),
    name: String(data.name || ''),
    description: String(data.description || ''),
    icon: String(data.icon || '💬'),
    image_url: String(data.image_url || '/assets/rooms/default.svg'),
    bg_theme: String(data.bg_theme || 'warm_peach'),
    wallpaper_url: String(data.wallpaper_url || ''),
    bg_custom: String(data.bg_custom || ''),
    welcome_message: String(data.welcome_message || ''),
    room_password: String(data.room_password || ''),
    min_rank_power: Number(data.min_rank_power) || 0,
    mics_enabled: data.mics_enabled === 0 ? 0 : 1,
    owner_user_id: data.owner_user_id ? Number(data.owner_user_id) : null,
    owner_name: String(data.owner_name || ''),
    card_bg_color: String(data.card_bg_color || ''),
    card_text_color: String(data.card_text_color || ''),
    activity_points: Number(data.activity_points) || 0,
    youtube_video_id: String(data.youtube_video_id || ''),
    youtube_title: String(data.youtube_title || ''),
    youtube_is_playing: data.youtube_is_playing ? 1 : 0,
    youtube_updated_at: String(data.youtube_updated_at || ''),
    created_by: String(data.created_by || 'system'),
    created_at: String(data.created_at || nowIso())
  };
}

function normalizeRankDoc(docId, data) {
  const key = String(data.key || docId);
  const power = Number(data.power) || 0;
  const defaultRoomOwner = key === 'site_owner' || data.perm_manage_rooms ? 1 : 0;
  const defaultPublishNews = key === 'site_owner' || power >= 95 ? 1 : 0;
  const defaultUseAddons = key === 'site_owner' || power >= 5 ? 1 : 0;
  const defaultMaxAssign =
    key === 'site_owner' ? 100 : data.perm_set_rank ? Math.max(0, power - 1) : 0;
  const defaultBadgeStyle =
    key === 'site_owner'
      ? 'crown_royal'
      : power >= 95
        ? 'gold_eagle'
        : power >= 80
          ? 'diamond_medal'
          : power >= 40
            ? 'silver_wing'
            : power >= 10
              ? 'royal_shield'
              : 'neon_badge';

  return {
    key,
    label: String(data.label || docId),
    icon: String(data.icon || '⭐'),
    badge_style: String(data.badge_style || defaultBadgeStyle),
    image_url: String(data.image_url || ''),
    bg_color: String(data.bg_color || '#334155'),
    text_color: String(data.text_color || '#ffffff'),
    power,
    tier_order: Number(data.tier_order) || 0,
    is_system: data.is_system ? 1 : 0,
    perm_mute: data.perm_mute ? 1 : 0,
    perm_kick: data.perm_kick ? 1 : 0,
    perm_ban: data.perm_ban ? 1 : 0,
    perm_set_rank: data.perm_set_rank ? 1 : 0,
    perm_clear_room: data.perm_clear_room ? 1 : 0,
    perm_manage_rooms: data.perm_manage_rooms ? 1 : 0,
    perm_access_panel: data.perm_access_panel ? 1 : 0,
    perm_room_owner: data.perm_room_owner !== undefined ? (data.perm_room_owner ? 1 : 0) : defaultRoomOwner,
    perm_publish_news:
      data.perm_publish_news !== undefined ? (data.perm_publish_news ? 1 : 0) : defaultPublishNews,
    perm_use_addons: data.perm_use_addons !== undefined ? (data.perm_use_addons ? 1 : 0) : defaultUseAddons,
    max_assignable_rank:
      key === 'site_owner'
        ? 100
        : data.max_assignable_rank !== undefined
          ? Math.max(0, Math.min(99, Number(data.max_assignable_rank) || 0))
          : defaultMaxAssign,
    created_at: String(data.created_at || nowIso())
  };
}

function attachRealtimeListeners() {
  for (const unsub of unsubscribers) {
    try {
      unsub();
    } catch {
      // ignore
    }
  }
  unsubscribers.length = 0;

  let initialMessagesReady = false;
  unsubscribers.push(
    fsListen('messages', (changes) => {
      for (const ch of changes) {
        if (ch.type === 'removed') {
          store.messagesById.delete(String(ch.id));
          const num = Number(ch.id);
          if (!Number.isNaN(num)) store.messagesById.delete(String(num));
          continue;
        }
        const msg = normalizeMessageDoc(ch.id, ch.data);
        const key = String(msg.id);
        const alreadyKnown =
          store.messagesById.has(key) ||
          (msg.client_msg_id && localEmittedMessageIds.has(msg.client_msg_id)) ||
          localEmittedMessageIds.has(key);
        store.messagesById.set(key, msg);
        if (typeof msg.id === 'number') {
          store.counters.messages = Math.max(store.counters.messages, msg.id);
        }
        if (initialMessagesReady && ch.type === 'added' && !alreadyKnown && hooks.onExternalMessage) {
          hooks.onExternalMessage(msg);
        }
      }
      initialMessagesReady = true;
    })
  );

  let initialUsersReady = false;
  unsubscribers.push(
    fsListen('users', (changes) => {
      for (const ch of changes) {
        const uid = Number(ch.id);
        if (ch.type === 'removed') {
          store.usersById.delete(uid);
        } else {
          const u = normalizeUserDoc(ch.id, ch.data);
          store.usersById.set(u.id, u);
          if (isSupremeOwnerEmail(u.email)) {
            enforceSupremeOwnerUser(u);
          }
          store.counters.users = Math.max(store.counters.users, u.id);
        }
      }
      if (initialUsersReady && hooks.onUsersChanged) hooks.onUsersChanged();
      initialUsersReady = true;
    })
  );

  let initialRanksReady = false;
  unsubscribers.push(
    fsListen('ranks', (changes) => {
      for (const ch of changes) {
        if (ch.type === 'removed') {
          store.ranksByKey.delete(ch.id);
        } else {
          const rk = normalizeRankDoc(ch.id, ch.data);
          store.ranksByKey.set(rk.key, rk);
        }
      }
      if (initialRanksReady && hooks.onRanksChanged) hooks.onRanksChanged(getAllRanks());
      initialRanksReady = true;
    })
  );

  let initialRoomsReady = false;
  unsubscribers.push(
    fsListen('rooms', (changes) => {
      for (const ch of changes) {
        if (ch.type === 'removed') {
          store.roomsById.delete(ch.id);
        } else {
          const rm = normalizeRoomDoc(ch.id, ch.data);
          store.roomsById.set(rm.id, rm);
        }
      }
      if (initialRoomsReady && hooks.onRoomsChanged) hooks.onRoomsChanged();
      initialRoomsReady = true;
    })
  );

  unsubscribers.push(
    fsListen('room_staff', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        const key = `${d.room_id}:${d.user_id}`;
        if (ch.type === 'removed') {
          for (const [k] of store.roomStaffByKey.entries()) {
            if (safeDocId(k) === ch.id || k === key) store.roomStaffByKey.delete(k);
          }
        } else if (d.room_id && d.user_id) {
          store.roomStaffByKey.set(key, {
            room_id: String(d.room_id),
            user_id: Number(d.user_id),
            staff_role: String(d.staff_role || 'مشرف غرفة'),
            assigned_by: String(d.assigned_by || ''),
            created_at: String(d.created_at || nowIso())
          });
        }
      }
    })
  );

  let initialSettingsReady = false;
  unsubscribers.push(
    fsListen('settings', (changes) => {
      for (const ch of changes) {
        if (ch.id === 'site' && ch.type !== 'removed') {
          store.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...ch.data, id: 1 };
        }
      }
      if (initialSettingsReady && hooks.onSettingsChanged) hooks.onSettingsChanged(getSiteSettings());
      initialSettingsReady = true;
    })
  );

  let initialEmojisReady = false;
  unsubscribers.push(
    fsListen('custom_emojis', (changes) => {
      for (const ch of changes) {
        const id = Number(ch.id);
        if (ch.type === 'removed') {
          store.customEmojisById.delete(id);
        } else {
          store.customEmojisById.set(id, { id, ...ch.data });
          store.counters.custom_emojis = Math.max(store.counters.custom_emojis, id);
        }
      }
      if (initialEmojisReady && hooks.onEmojisChanged) hooks.onEmojisChanged(getAllCustomEmojis());
      initialEmojisReady = true;
    })
  );

  unsubscribers.push(
    fsListen('bans', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        if (ch.type === 'removed') {
          for (const [k] of store.bansByKey.entries()) {
            if (safeDocId(k) === ch.id || k === d.target_key) store.bansByKey.delete(k);
          }
        } else if (d.target_key) {
          store.bansByKey.set(String(d.target_key), d);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('mutes', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        const key = `${d.target_key}::${d.room_id}`;
        if (ch.type === 'removed') {
          for (const [k] of store.mutesByKey.entries()) {
            if (safeDocId(k) === ch.id || k === key) store.mutesByKey.delete(k);
          }
        } else if (d.target_key) {
          store.mutesByKey.set(key, d);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('private_messages', (changes) => {
      for (const ch of changes) {
        const id = Number(ch.id);
        if (ch.type === 'removed') store.privateMessagesById.delete(id);
        else {
          store.privateMessagesById.set(id, { id, ...ch.data });
          store.counters.private_messages = Math.max(store.counters.private_messages, id);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('friendships', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        const key = `${d.user_key}::${d.friend_key}`;
        if (ch.type === 'removed') {
          for (const [k] of store.friendshipsByKey.entries()) {
            if (safeDocId(k) === ch.id || k === key) store.friendshipsByKey.delete(k);
          }
        } else if (d.user_key && d.friend_key) {
          store.friendshipsByKey.set(key, d);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('wall_posts', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        if (String(ch.id).startsWith('news_') || d.post_type === 'news') {
          const nid = Number(d.id || String(ch.id).replace('news_', ''));
          if (ch.type === 'removed') store.newsById.delete(nid);
          else if (nid) {
            store.newsById.set(nid, { ...d, id: nid });
            store.counters.news = Math.max(store.counters.news, nid);
          }
          continue;
        }
        if (String(ch.id).startsWith('gift_') || d.post_type === 'gift_tx') {
          const gid = Number(d.id || String(ch.id).replace('gift_', ''));
          if (ch.type === 'removed') store.giftsById.delete(gid);
          else if (gid) {
            store.giftsById.set(gid, { ...d, id: gid });
            store.counters.gifts = Math.max(store.counters.gifts, gid);
          }
          continue;
        }
        const id = Number(ch.id);
        if (ch.type === 'removed') store.wallPostsById.delete(id);
        else if (id) {
          store.wallPostsById.set(id, { id, ...d });
          store.counters.wall_posts = Math.max(store.counters.wall_posts, id);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('reports', (changes) => {
      for (const ch of changes) {
        const id = Number(ch.id);
        if (ch.type === 'removed') store.reportsById.delete(id);
        else if (id) {
          store.reportsById.set(id, { id, ...ch.data });
          store.counters.reports = Math.max(store.counters.reports, id);
        }
      }
    })
  );

  unsubscribers.push(
    fsListen('notifications', (changes) => {
      for (const ch of changes) {
        const id = Number(ch.id);
        if (ch.type === 'removed') store.notificationsById.delete(id);
        else if (id) {
          store.notificationsById.set(id, { id, ...ch.data });
          store.counters.notifications = Math.max(store.counters.notifications, id);
        }
      }
    })
  );
}

async function init(eventHooks = {}) {
  hooks = eventHooks || {};
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const fetchAllCollections = () =>
      Promise.all([
        fsGetAll('users'),
        fsGetAll('ranks'),
        fsGetAll('settings'),
        fsGetAll('rooms'),
        fsGetAll('room_staff'),
        fsGetAll('messages'),
        fsGetAll('custom_emojis'),
        fsGetAll('bans'),
        fsGetAll('mutes'),
        fsGetAll('private_messages'),
        fsGetAll('friendships'),
        fsGetAll('wall_posts'),
        fsGetAll('reports'),
        fsGetAll('notifications'),
        fsGetAll('counters')
      ]);

    let loadedCollections;
    try {
      createFirestoreDriver();
      loadedCollections = await fetchAllCollections();
    } catch (fsErr) {
      console.warn('Cloud Firestore unavailable, falling back to local SQLite:', fsErr.message);
      createSqliteFallbackDriver();
      loadedCollections = await fetchAllCollections();
    }

    const [
      usersDocs,
      ranksDocs,
      settingsDocs,
      roomsDocs,
      roomStaffDocs,
      messagesDocs,
      emojisDocs,
      bansDocs,
      mutesDocs,
      pmDocs,
      friendsDocs,
      wallDocs,
      reportsDocs,
      notifDocs,
      counterDocs
    ] = loadedCollections;

    for (const c of counterDocs) {
      if (c.id === 'sequences' && c.data) {
        for (const [k, v] of Object.entries(c.data)) {
          store.counters[k] = Math.max(store.counters[k] || 0, Number(v) || 0);
        }
      }
    }

    for (const d of usersDocs) {
      const u = normalizeUserDoc(d.id, d.data);
      store.usersById.set(u.id, u);
      store.counters.users = Math.max(store.counters.users, u.id);
    }

    for (const d of ranksDocs) {
      const rk = normalizeRankDoc(d.id, d.data);
      store.ranksByKey.set(rk.key, rk);
    }

    let hasSiteSettingsDoc = false;
    for (const d of settingsDocs) {
      if (d.id === 'site') {
        hasSiteSettingsDoc = true;
        store.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...d.data, id: 1 };
      } else if (d.id === 'connectivity_probe' || d.id === 'probe_1') {
        enqueueDelete('settings', d.id);
      }
    }

    for (const d of roomsDocs) {
      const rm = normalizeRoomDoc(d.id, d.data);
      store.roomsById.set(rm.id, rm);
    }

    for (const d of roomStaffDocs) {
      const s = d.data || {};
      if (s.room_id && s.user_id) {
        store.roomStaffByKey.set(`${s.room_id}:${s.user_id}`, {
          room_id: String(s.room_id),
          user_id: Number(s.user_id),
          staff_role: String(s.staff_role || 'مشرف غرفة'),
          assigned_by: String(s.assigned_by || ''),
          created_at: String(s.created_at || nowIso())
        });
      }
    }

    for (const d of messagesDocs) {
      const msg = normalizeMessageDoc(d.id, d.data);
      store.messagesById.set(String(msg.id), msg);
      if (typeof msg.id === 'number') {
        store.counters.messages = Math.max(store.counters.messages, msg.id);
      }
    }

    for (const d of emojisDocs) {
      const id = Number(d.id) || Number(d.data?.id);
      if (id) {
        store.customEmojisById.set(id, { id, ...d.data });
        store.counters.custom_emojis = Math.max(store.counters.custom_emojis, id);
      }
    }

    for (const d of bansDocs) {
      if (d.data?.target_key) store.bansByKey.set(String(d.data.target_key), d.data);
    }

    for (const d of mutesDocs) {
      if (d.data?.target_key) {
        store.mutesByKey.set(`${d.data.target_key}::${d.data.room_id}`, d.data);
      }
    }

    for (const d of pmDocs) {
      const id = Number(d.id) || Number(d.data?.id);
      if (id) {
        store.privateMessagesById.set(id, { id, ...d.data });
        store.counters.private_messages = Math.max(store.counters.private_messages, id);
      }
    }

    for (const d of friendsDocs) {
      if (d.data?.user_key && d.data?.friend_key) {
        store.friendshipsByKey.set(`${d.data.user_key}::${d.data.friend_key}`, d.data);
      }
    }

    for (const d of wallDocs) {
      const data = d.data || {};
      if (String(d.id).startsWith('news_') || data.post_type === 'news') {
        const nid = Number(data.id || String(d.id).replace('news_', ''));
        if (nid) {
          store.newsById.set(nid, { ...data, id: nid });
          store.counters.news = Math.max(store.counters.news, nid);
        }
        continue;
      }
      if (String(d.id).startsWith('gift_') || data.post_type === 'gift_tx') {
        const gid = Number(data.id || String(d.id).replace('gift_', ''));
        if (gid) {
          store.giftsById.set(gid, { ...data, id: gid });
          store.counters.gifts = Math.max(store.counters.gifts, gid);
        }
        continue;
      }
      const id = Number(d.id) || Number(data.id);
      if (id) {
        store.wallPostsById.set(id, { id, ...data });
        store.counters.wall_posts = Math.max(store.counters.wall_posts, id);
      }
    }

    for (const d of reportsDocs) {
      const id = Number(d.id) || Number(d.data?.id);
      if (id) {
        store.reportsById.set(id, { id, ...d.data });
        store.counters.reports = Math.max(store.counters.reports, id);
      }
    }

    for (const d of notifDocs) {
      const id = Number(d.id) || Number(d.data?.id);
      if (id) {
        store.notificationsById.set(id, { id, ...d.data });
        store.counters.notifications = Math.max(store.counters.notifications, id);
      }
    }

    ensureSupremeOwnersInStore();

    // Seed missing default ranks if none exist yet
    const rankSeedBatch = [];
    for (const dr of DEFAULT_RANKS) {
      if (!store.ranksByKey.has(dr.key)) {
        const norm = normalizeRankDoc(dr.key, dr);
        store.ranksByKey.set(norm.key, norm);
        rankSeedBatch.push({ docId: norm.key, data: norm, merge: true });
      }
    }
    if (rankSeedBatch.length > 0) {
      await fsBatchSet('ranks', rankSeedBatch);
    }

    if (!hasSiteSettingsDoc) {
      await fsSetDoc('settings', 'site', store.siteSettings, true);
    }

    if (store.roomsById.size === 0) {
      const roomBatch = [];
      for (const r of DEFAULT_ROOMS) {
        store.roomsById.set(r.id, { ...r });
        roomBatch.push({ docId: r.id, data: r, merge: true });
      }
      await fsBatchSet('rooms', roomBatch);
    }

    await fsSetDoc('counters', 'sequences', store.counters, true);

    attachRealtimeListeners();
    initialized = true;
    console.log(
      `Cloud Firestore connected (${fsMode} mode) -> project=${FIREBASE_PROJECT_ID}, database=${FIRESTORE_DATABASE_ID} | users=${store.usersById.size}, rooms=${store.roomsById.size}, messages=${store.messagesById.size}, ranks=${store.ranksByKey.size}`
    );
  })();

  return initPromise;
}

function getStorageStatus() {
  return {
    provider: fsMode === 'sqlite' ? 'sqlite' : 'firebase-firestore',
    mode: fsMode,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
    initialized,
    counts: {
      users: store.usersById.size,
      messages: store.messagesById.size,
      rooms: store.roomsById.size,
      ranks: store.ranksByKey.size,
      news: store.newsById.size,
      gifts: store.giftsById.size,
      bans: store.bansByKey.size
    }
  };
}

// ==========================================
// DYNAMIC RANKS & PERMISSIONS HELPERS
// ==========================================
function mapRankRow(row) {
  if (!row) return null;
  const power = Number(row.power) || 0;
  return {
    key: row.key,
    label: row.label,
    icon: row.icon || '⭐',
    badge_style: row.badge_style || 'royal_shield',
    image_url: row.image_url || '',
    bg_color: row.bg_color || '#334155',
    text_color: row.text_color || '#ffffff',
    power,
    tier_order: Number(row.tier_order) || 0,
    is_system: row.is_system === 1,
    max_assignable_rank:
      row.key === 'site_owner'
        ? 100
        : row.max_assignable_rank !== undefined
          ? Number(row.max_assignable_rank) || 0
          : row.perm_set_rank === 1
            ? Math.max(0, power - 1)
            : 0,
    permissions: {
      mute: row.perm_mute === 1,
      kick: row.perm_kick === 1,
      ban: row.perm_ban === 1,
      set_rank: row.perm_set_rank === 1,
      clear_room: row.perm_clear_room === 1,
      manage_rooms: row.perm_manage_rooms === 1,
      access_panel: row.perm_access_panel === 1,
      room_owner: row.perm_room_owner === 1,
      publish_news: row.perm_publish_news === 1,
      use_addons: row.perm_use_addons === 1
    }
  };
}

function getAllRanks() {
  return [...store.ranksByKey.values()]
    .sort(
      (a, b) =>
        (Number(b.power) || 0) - (Number(a.power) || 0) ||
        (Number(b.tier_order) || 0) - (Number(a.tier_order) || 0) ||
        String(a.created_at || '').localeCompare(String(b.created_at || ''))
    )
    .map(mapRankRow);
}

function getRankByKey(key) {
  const row = store.ranksByKey.get(key);
  if (row) return mapRankRow(row);
  const member = store.ranksByKey.get('member');
  return mapRankRow(member) || mapRankRow(DEFAULT_RANKS.find((r) => r.key === 'member'));
}

function getRankPower(role) {
  const row = store.ranksByKey.get(role);
  return row ? Number(row.power) || 0 : 0;
}

function getMaxAssignablePower(role) {
  if (role === 'site_owner') return 100;
  const row = store.ranksByKey.get(role);
  if (!row || row.perm_set_rank !== 1) return -1;
  const ownPower = Number(row.power) || 0;
  const ceiling =
    row.max_assignable_rank !== undefined ? Number(row.max_assignable_rank) || 0 : Math.max(0, ownPower - 1);
  return Math.min(ownPower - 1, Math.max(0, ceiling));
}

function getRankSortWeight(role) {
  const row = store.ranksByKey.get(role);
  return row ? (Number(row.power) || 0) * 100 + (Number(row.tier_order) || 0) : 0;
}

function isValidRank(role) {
  if (!role || role === 'guest') return false;
  return store.ranksByKey.has(role);
}

const VALID_PERM_COLUMNS = {
  mute: 'perm_mute',
  kick: 'perm_kick',
  ban: 'perm_ban',
  set_rank: 'perm_set_rank',
  clear_room: 'perm_clear_room',
  manage_rooms: 'perm_manage_rooms',
  access_panel: 'perm_access_panel',
  room_owner: 'perm_room_owner',
  publish_news: 'perm_publish_news',
  use_addons: 'perm_use_addons'
};

function hasPermission(role, permName) {
  if (!role) return false;
  if (role === 'site_owner') return true;
  const col = VALID_PERM_COLUMNS[permName];
  if (!col) return false;
  const row = store.ranksByKey.get(role);
  return Boolean(row && row[col] === 1);
}

function sanitizeHexColor(val, fallback) {
  const s = String(val || '').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : fallback;
}

function createRank({
  key,
  label,
  icon,
  badgeStyle,
  imageUrl,
  bgColor,
  textColor,
  power,
  maxAssignableRank,
  permissions = {}
}) {
  const cleanLabel = String(label || '').trim().slice(0, 32);
  if (cleanLabel.length < 2) return { error: 'اسم الرتبة يجب أن يكون حرفين على الأقل.' };
  const safeKey =
    String(key || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 36) || `rank_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  if (store.ranksByKey.has(safeKey)) return { error: 'مفتاح هذه الرتبة موجود مسبقاً.' };

  const clampedPower = Math.max(1, Math.min(99, Number(power) || 15));
  const rawMaxAssign =
    maxAssignableRank !== undefined ? Number(maxAssignableRank) || 0 : permissions.set_rank ? clampedPower - 1 : 0;
  const docObj = {
    key: safeKey,
    label: cleanLabel,
    icon: String(icon || '⭐').trim().slice(0, 8) || '⭐',
    badge_style: String(badgeStyle || 'royal_shield').trim().slice(0, 40) || 'royal_shield',
    image_url: String(imageUrl || '').trim(),
    bg_color: sanitizeHexColor(bgColor, '#334155'),
    text_color: sanitizeHexColor(textColor, '#ffffff'),
    power: clampedPower,
    tier_order: 0,
    is_system: 0,
    perm_mute: permissions.mute ? 1 : 0,
    perm_kick: permissions.kick ? 1 : 0,
    perm_ban: permissions.ban ? 1 : 0,
    perm_set_rank: permissions.set_rank ? 1 : 0,
    perm_clear_room: permissions.clear_room ? 1 : 0,
    perm_manage_rooms: permissions.manage_rooms ? 1 : 0,
    perm_access_panel: permissions.access_panel ? 1 : 0,
    perm_room_owner: permissions.room_owner ? 1 : 0,
    perm_publish_news: permissions.publish_news ? 1 : 0,
    perm_use_addons: permissions.use_addons ? 1 : 0,
    max_assignable_rank: Math.max(0, Math.min(99, rawMaxAssign)),
    created_at: nowIso()
  };

  store.ranksByKey.set(safeKey, docObj);
  enqueueSet('ranks', safeKey, docObj);
  return { rank: getRankByKey(safeKey) };
}

function updateRank(key, { label, icon, badgeStyle, imageUrl, bgColor, textColor, power, maxAssignableRank, permissions }) {
  const existing = store.ranksByKey.get(key);
  if (!existing) return { error: 'الرتبة غير موجودة.' };

  const nextLabel = label !== undefined && String(label).trim() ? String(label).trim().slice(0, 32) : existing.label;
  const nextIcon = icon !== undefined ? String(icon).trim().slice(0, 8) || '⭐' : existing.icon;
  const nextBadgeStyle =
    badgeStyle !== undefined && String(badgeStyle).trim()
      ? String(badgeStyle).trim().slice(0, 40)
      : existing.badge_style || 'royal_shield';
  const nextImg = imageUrl !== undefined ? String(imageUrl).trim() : existing.image_url;
  const nextBg = bgColor !== undefined ? sanitizeHexColor(bgColor, existing.bg_color) : existing.bg_color;
  const nextText = textColor !== undefined ? sanitizeHexColor(textColor, existing.text_color) : existing.text_color;

  let nextPower = existing.power;
  if (key === 'site_owner') {
    nextPower = 100;
  } else if (key === 'guest') {
    nextPower = 0;
  } else if (power !== undefined) {
    nextPower = Math.max(1, Math.min(99, Number(power) || existing.power));
  }

  const p = permissions || {};
  const isOwner = key === 'site_owner';
  const nextMaxAssign = isOwner
    ? 100
    : maxAssignableRank !== undefined
      ? Math.max(0, Math.min(99, Number(maxAssignableRank) || 0))
      : existing.max_assignable_rank !== undefined
        ? Number(existing.max_assignable_rank)
        : Math.max(0, nextPower - 1);

  const updated = {
    ...existing,
    label: nextLabel,
    icon: nextIcon,
    badge_style: nextBadgeStyle,
    image_url: nextImg,
    bg_color: nextBg,
    text_color: nextText,
    power: nextPower,
    perm_mute: isOwner ? 1 : p.mute !== undefined ? (p.mute ? 1 : 0) : existing.perm_mute,
    perm_kick: isOwner ? 1 : p.kick !== undefined ? (p.kick ? 1 : 0) : existing.perm_kick,
    perm_ban: isOwner ? 1 : p.ban !== undefined ? (p.ban ? 1 : 0) : existing.perm_ban,
    perm_set_rank: isOwner ? 1 : p.set_rank !== undefined ? (p.set_rank ? 1 : 0) : existing.perm_set_rank,
    perm_clear_room: isOwner ? 1 : p.clear_room !== undefined ? (p.clear_room ? 1 : 0) : existing.perm_clear_room,
    perm_manage_rooms: isOwner ? 1 : p.manage_rooms !== undefined ? (p.manage_rooms ? 1 : 0) : existing.perm_manage_rooms,
    perm_access_panel: isOwner ? 1 : p.access_panel !== undefined ? (p.access_panel ? 1 : 0) : existing.perm_access_panel,
    perm_room_owner: isOwner ? 1 : p.room_owner !== undefined ? (p.room_owner ? 1 : 0) : existing.perm_room_owner,
    perm_publish_news: isOwner ? 1 : p.publish_news !== undefined ? (p.publish_news ? 1 : 0) : existing.perm_publish_news,
    perm_use_addons: isOwner ? 1 : p.use_addons !== undefined ? (p.use_addons ? 1 : 0) : existing.perm_use_addons,
    max_assignable_rank: nextMaxAssign
  };

  store.ranksByKey.set(key, updated);
  enqueueSet('ranks', key, updated);
  return { rank: getRankByKey(key) };
}

function deleteRank(key) {
  const existing = store.ranksByKey.get(key);
  if (!existing) return { error: 'الرتبة غير موجودة.' };
  if (existing.is_system === 1) return { error: 'لا يمكن حذف الرتب الأساسية للنظام.' };

  const affectedUserIds = [];
  for (const u of store.usersById.values()) {
    if (u.role === key) {
      u.role = 'member';
      affectedUserIds.push(u.id);
      enqueueSet('users', String(u.id), u);
    }
  }
  for (const m of store.messagesById.values()) {
    if (m.sender_role === key) {
      m.sender_role = 'member';
      enqueueSet('messages', String(m.doc_id || m.id), { sender_role: 'member' }, true);
    }
  }

  store.ranksByKey.delete(key);
  enqueueDelete('ranks', key);
  return { ok: true, affectedUserIds };
}

// ==========================================
// CUSTOM EMOJIS & STICKERS HELPERS
// ==========================================
function normalizeEmojiCode(rawCode) {
  let cleaned = String(rawCode || '').trim().replace(/\s+/g, '_').slice(0, 28);
  if (!cleaned) return '';
  if (!cleaned.startsWith(':')) cleaned = `:${cleaned}`;
  if (!cleaned.endsWith(':')) cleaned = `${cleaned}:`;
  return cleaned;
}

function getAllCustomEmojis() {
  return [...store.customEmojisById.values()].sort((a, b) => Number(b.id) - Number(a.id));
}

function addCustomEmoji({ code, imageUrl, createdBy }) {
  const norm = normalizeEmojiCode(code);
  if (norm.length < 3) return { error: 'أدخل رمز اختصار الإيموجي (مثال: :وردة:).' };
  if (!imageUrl || !String(imageUrl).startsWith('/uploads/emojis/')) {
    return { error: 'يرجى رفع صورة الإيموجي أو الملصق أولاً.' };
  }
  for (const e of store.customEmojisById.values()) {
    if (String(e.code || '').toLowerCase() === norm.toLowerCase()) {
      return { error: `الرمز "${norm}" مستخدم مسبقاً.` };
    }
  }

  const id = nextSeq('custom_emojis');
  const emoji = {
    id,
    code: norm,
    image_url: imageUrl,
    created_by: createdBy || '',
    created_at: nowIso()
  };
  store.customEmojisById.set(id, emoji);
  enqueueSet('custom_emojis', String(id), emoji);
  return { emoji };
}

function deleteCustomEmoji(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return false;
  store.customEmojisById.delete(numId);
  enqueueDelete('custom_emojis', String(numId));
  return true;
}

// ==========================================
// SITE SETTINGS & THEME CMS HELPERS
// ==========================================
function getSiteSettings() {
  return { ...DEFAULT_SITE_SETTINGS, ...store.siteSettings };
}

function updateSiteSettings(patch = {}) {
  const cur = getSiteSettings();
  const next = {
    id: 1,
    site_name: patch.site_name !== undefined ? String(patch.site_name).trim().slice(0, 60) || cur.site_name : cur.site_name,
    site_description:
      patch.site_description !== undefined ? String(patch.site_description).trim().slice(0, 180) : cur.site_description,
    site_logo: patch.site_logo !== undefined ? String(patch.site_logo).trim().slice(0, 260) : cur.site_logo,
    welcome_message:
      patch.welcome_message !== undefined ? String(patch.welcome_message).trim().slice(0, 400) : cur.welcome_message,
    maintenance_mode:
      patch.maintenance_mode !== undefined ? (patch.maintenance_mode ? 1 : 0) : cur.maintenance_mode,
    top_bar_color:
      patch.top_bar_color !== undefined ? sanitizeHexColor(patch.top_bar_color, cur.top_bar_color) : cur.top_bar_color,
    bottom_bar_color:
      patch.bottom_bar_color !== undefined
        ? sanitizeHexColor(patch.bottom_bar_color, cur.bottom_bar_color)
        : cur.bottom_bar_color,
    button_color:
      patch.button_color !== undefined ? sanitizeHexColor(patch.button_color, cur.button_color) : cur.button_color,
    font_family: patch.font_family !== undefined ? String(patch.font_family).trim().slice(0, 50) || 'Cairo' : cur.font_family,
    font_size:
      patch.font_size !== undefined ? Math.max(12, Math.min(22, Number(patch.font_size) || 15)) : cur.font_size,
    custom_css: patch.custom_css !== undefined ? String(patch.custom_css).slice(0, 8000) : cur.custom_css,
    custom_html: patch.custom_html !== undefined ? String(patch.custom_html).slice(0, 8000) : cur.custom_html,
    updated_at: nowIso()
  };

  store.siteSettings = next;
  enqueueSet('settings', 'site', next);
  return getSiteSettings();
}

// ==========================================
// USERS HELPERS
// ==========================================
function getEffectiveName(userRow) {
  if (!userRow) return '';
  const dn = (userRow.display_name || '').trim();
  return dn || userRow.username;
}

function getUserCount() {
  return store.usersById.size;
}

function registerUser({ username, email, passwordHash, ipAddress, deviceId }) {
  const cleanUser = String(username || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  for (const existing of store.usersById.values()) {
    if (existing.username.toLowerCase() === cleanUser.toLowerCase()) {
      return { error: 'اسم المستخدم مسجل مسبقاً، اختر اسماً آخر.' };
    }
    if (existing.email.toLowerCase() === cleanEmail) {
      return { error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }
  }

  const role = isSupremeOwnerEmail(cleanEmail) ? 'site_owner' : 'member';
  const id = nextSeq('users');
  const user = {
    id,
    username: cleanUser,
    email: cleanEmail,
    password_hash: passwordHash,
    role,
    display_name: cleanUser,
    name_color: '#0f172a',
    text_color: '#111827',
    name_bg_color: '',
    neon_color: '',
    font_family: 'Normal',
    font_style: 'Normal',
    avatar_url: '',
    cover_url: '',
    avatar_frame: role === 'site_owner' ? 'kings_crown' : 'none',
    nameplate_style: role === 'site_owner' ? 'crimson_royal' : 'default',
    name_shine: 'none',
    profile_bg_effect: role === 'site_owner' ? 'aurora_glow' : 'none',
    vip_wings: role === 'site_owner' ? 1 : 0,
    profile_music: '',
    bio: '',
    age: '',
    gender: '',
    country: '',
    allow_calls: 1,
    allow_pm: 1,
    likes_count: 0,
    rating_sum: 0,
    rating_count: 0,
    coins: role === 'site_owner' ? 99999 : 1500,
    vip_family: '',
    is_stealth: 0,
    is_ghosted: 0,
    activity_points: 0,
    gifts_received: 0,
    gifts_sent: 0,
    last_ip: ipAddress || '',
    last_device_id: deviceId || '',
    is_banned: 0,
    ban_reason: '',
    created_at: nowIso()
  };

  store.usersById.set(id, user);
  enqueueSet('users', String(id), user);
  return { user: { ...user } };
}

function findUserByIdentifier(identifier) {
  const needle = String(identifier || '').trim().toLowerCase();
  if (!needle) return null;
  for (const u of store.usersById.values()) {
    if (u.username.toLowerCase() === needle || u.email.toLowerCase() === needle) {
      if (isSupremeOwnerEmail(u.email)) enforceSupremeOwnerUser(u);
      return { ...u };
    }
  }
  return null;
}

function findUserById(id) {
  const num = Number(id);
  const u = store.usersById.get(num);
  if (!u) return null;
  if (isSupremeOwnerEmail(u.email)) enforceSupremeOwnerUser(u);
  return { ...u };
}

function updateUserIp(userId, ipAddress, deviceId = '') {
  if (!userId) return;
  const u = store.usersById.get(Number(userId));
  if (!u) return;
  const patch = {};
  if (ipAddress && u.last_ip !== ipAddress) {
    u.last_ip = ipAddress;
    patch.last_ip = ipAddress;
  }
  if (deviceId && u.last_device_id !== deviceId) {
    u.last_device_id = deviceId;
    patch.last_device_id = deviceId;
  }
  if (Object.keys(patch).length > 0) {
    enqueueSet('users', String(u.id), patch, true);
  }
}

function setUserStealth(userId, enabled) {
  const u = store.usersById.get(Number(userId));
  if (!u) return null;
  if (u.role !== 'site_owner' && !isSupremeOwnerEmail(u.email)) {
    return { error: 'وضع التخفي متاح لصاحب الموقع فقط.' };
  }
  u.is_stealth = enabled ? 1 : 0;
  enqueueSet('users', String(u.id), { is_stealth: u.is_stealth }, true);
  return { user: { ...u } };
}

function setUserGhosted(userId, enabled) {
  const u = store.usersById.get(Number(userId));
  if (!u) return { error: 'العضو غير موجود.' };
  if (isSupremeOwnerEmail(u.email) || u.role === 'site_owner') {
    return { error: 'حساب صاحب الموقع محمي ولا يمكن تجميده.' };
  }
  u.is_ghosted = enabled ? 1 : 0;
  enqueueSet('users', String(u.id), { is_ghosted: u.is_ghosted }, true);
  return { user: { ...u } };
}

function interactProfile(targetUserId, { like, rating } = {}) {
  const u = store.usersById.get(Number(targetUserId));
  if (!u) return null;
  const patch = {};
  if (like) {
    u.likes_count = (Number(u.likes_count) || 0) + 1;
    patch.likes_count = u.likes_count;
  }
  const stars = Number(rating);
  if (stars >= 1 && stars <= 5) {
    u.rating_sum = (Number(u.rating_sum) || 0) + Math.round(stars);
    u.rating_count = (Number(u.rating_count) || 0) + 1;
    patch.rating_sum = u.rating_sum;
    patch.rating_count = u.rating_count;
  }
  if (Object.keys(patch).length > 0) {
    enqueueSet('users', String(u.id), patch, true);
  }
  return { ...u };
}

function updateUserCredentials(userId, { email, passwordHash } = {}) {
  const current = store.usersById.get(Number(userId));
  if (!current) return { error: 'الحساب غير موجود.' };
  const targetIsSupreme = isSupremeOwnerEmail(current.email);
  const nextEmail = targetIsSupreme
    ? SUPREME_OWNER_EMAIL
    : email && String(email).trim()
      ? String(email).trim().toLowerCase()
      : current.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return { error: 'البريد الإلكتروني غير صالح.' };
  }
  for (const other of store.usersById.values()) {
    if (other.id !== current.id && other.email.toLowerCase() === nextEmail) {
      return { error: 'البريد الإلكتروني مستخدم لحساب آخر.' };
    }
  }
  const patch = { email: nextEmail };
  current.email = nextEmail;
  if (passwordHash) {
    current.password_hash = passwordHash;
    patch.password_hash = passwordHash;
  }
  enqueueSet('users', String(current.id), patch, true);
  return { user: { ...current } };
}

function deleteUserAccountPermanently(userId) {
  const uid = Number(userId);
  const target = store.usersById.get(uid);
  if (!target) return { error: 'الحساب غير موجود.' };
  if (isSupremeOwnerEmail(target.email) || target.role === 'site_owner') {
    return { error: 'حساب صاحب الموقع الأعلى محمي ولا يمكن حذفه نهائياً.' };
  }
  const targetKey = `user:${uid}`;
  store.usersById.delete(uid);
  enqueueDelete('users', String(uid));

  for (const [k, rs] of [...store.roomStaffByKey.entries()]) {
    if (Number(rs.user_id) === uid) {
      store.roomStaffByKey.delete(k);
      enqueueDelete('room_staff', safeDocId(k));
    }
  }
  for (const [k, m] of [...store.mutesByKey.entries()]) {
    if (m.target_key === targetKey) {
      store.mutesByKey.delete(k);
      enqueueDelete('mutes', safeDocId(k));
    }
  }
  for (const [k, f] of [...store.friendshipsByKey.entries()]) {
    if (f.user_key === targetKey || f.friend_key === targetKey) {
      store.friendshipsByKey.delete(k);
      enqueueDelete('friendships', safeDocId(k));
    }
  }
  return { ok: true, deletedKey: targetKey, deletedUserId: uid };
}

function incrementActivityPoints({ userId, roomId, userDelta = 1, roomDelta = 1 }) {
  if (userId) {
    const u = store.usersById.get(Number(userId));
    if (u) {
      u.activity_points = (Number(u.activity_points) || 0) + userDelta;
      enqueueSet('users', String(u.id), { activity_points: u.activity_points }, true);
    }
  }
  if (roomId) {
    const r = store.roomsById.get(roomId);
    if (r) {
      r.activity_points = (Number(r.activity_points) || 0) + roomDelta;
      enqueueSet('rooms', roomId, { activity_points: r.activity_points }, true);
    }
  }
}

function updateUserCustomization(
  userId,
  {
    displayName,
    nameColor,
    textColor,
    nameBgColor,
    neonColor,
    fontFamily,
    fontStyle,
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
  }
) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;

  const updated = {
    ...current,
    display_name: displayName !== undefined && displayName.trim() ? displayName.trim().slice(0, 28) : getEffectiveName(current),
    name_color: nameColor || current.name_color,
    text_color: textColor !== undefined ? textColor || '#111827' : current.text_color || '#111827',
    name_bg_color: nameBgColor !== undefined ? String(nameBgColor || '').trim().slice(0, 30) : current.name_bg_color || '',
    neon_color: neonColor !== undefined ? String(neonColor || '').trim().slice(0, 30) : current.neon_color || '',
    font_family: fontFamily !== undefined ? String(fontFamily || 'Normal').trim().slice(0, 40) : current.font_family || 'Normal',
    font_style: fontStyle !== undefined ? String(fontStyle || 'Normal').trim().slice(0, 30) : current.font_style || 'Normal',
    avatar_url: avatarUrl !== undefined ? avatarUrl : current.avatar_url,
    cover_url: coverUrl !== undefined ? coverUrl : current.cover_url || '',
    avatar_frame: avatarFrame !== undefined ? avatarFrame || 'none' : current.avatar_frame || 'none',
    nameplate_style: nameplateStyle !== undefined ? nameplateStyle || 'default' : current.nameplate_style || 'default',
    name_shine: nameShine !== undefined ? String(nameShine || 'none').trim().slice(0, 30) : current.name_shine || 'none',
    profile_bg_effect:
      profileBgEffect !== undefined ? String(profileBgEffect || 'none').trim().slice(0, 36) : current.profile_bg_effect || 'none',
    vip_wings: vipWings !== undefined ? (vipWings ? 1 : 0) : current.vip_wings ? 1 : 0,
    profile_music: profileMusic !== undefined ? String(profileMusic || '').trim().slice(0, 300) : current.profile_music || '',
    bio: bio !== undefined ? String(bio || '').trim().slice(0, 160) : current.bio || '',
    vip_family: vipFamily !== undefined ? vipFamily.trim().slice(0, 24) : current.vip_family || '',
    age: age !== undefined ? String(age || '').trim().slice(0, 16) : current.age || '',
    gender: gender !== undefined ? String(gender || '').trim().slice(0, 20) : current.gender || '',
    country: country !== undefined ? String(country || '').trim().slice(0, 36) : current.country || '',
    allow_calls: allowCalls !== undefined ? (allowCalls ? 1 : 0) : current.allow_calls === 0 ? 0 : 1,
    allow_pm: allowPm !== undefined ? (allowPm ? 1 : 0) : current.allow_pm === 0 ? 0 : 1
  };

  store.usersById.set(updated.id, updated);
  enqueueSet('users', String(updated.id), updated);
  return { ...updated };
}

function adminCreateUser({ username, displayName, email, passwordHash, role }) {
  const cleanUser = String(username || '').trim().slice(0, 24);
  const cleanDisplay = String(displayName || cleanUser).trim().slice(0, 28) || cleanUser;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const safeRole = isSupremeOwnerEmail(cleanEmail)
    ? 'site_owner'
    : isValidRank(role)
      ? role
      : 'member';

  for (const existing of store.usersById.values()) {
    if (existing.username.toLowerCase() === cleanUser.toLowerCase()) {
      return { error: 'اسم المستخدم مسجل مسبقاً.' };
    }
    if (existing.email.toLowerCase() === cleanEmail) {
      return { error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }
  }

  const id = nextSeq('users');
  const user = {
    id,
    username: cleanUser,
    email: cleanEmail,
    password_hash: passwordHash,
    role: safeRole,
    display_name: cleanDisplay,
    name_color: '#0f172a',
    text_color: '#111827',
    name_bg_color: '',
    neon_color: '',
    font_family: 'Normal',
    font_style: 'Normal',
    avatar_url: '',
    cover_url: '',
    avatar_frame: safeRole === 'site_owner' ? 'kings_crown' : 'none',
    nameplate_style: safeRole === 'site_owner' ? 'crimson_royal' : 'default',
    name_shine: 'none',
    profile_bg_effect: safeRole === 'site_owner' ? 'aurora_glow' : 'none',
    vip_wings: safeRole === 'site_owner' ? 1 : 0,
    profile_music: '',
    bio: '',
    age: '',
    gender: '',
    country: '',
    allow_calls: 1,
    allow_pm: 1,
    likes_count: 0,
    rating_sum: 0,
    rating_count: 0,
    coins: safeRole === 'site_owner' ? 99999 : 1500,
    vip_family: '',
    is_stealth: 0,
    is_ghosted: 0,
    activity_points: 0,
    gifts_received: 0,
    gifts_sent: 0,
    last_ip: '',
    last_device_id: '',
    is_banned: 0,
    ban_reason: '',
    created_at: nowIso()
  };

  store.usersById.set(id, user);
  enqueueSet('users', String(id), user);
  return { user: { ...user } };
}

function adminUpdateUserAccount(userId, { displayName, username, email, passwordHash, avatarUrl, role }) {
  const current = store.usersById.get(Number(userId));
  if (!current) return { error: 'الحساب غير موجود.' };

  const targetIsSupreme = isSupremeOwnerEmail(current.email);
  const nextDisplay =
    displayName !== undefined && String(displayName).trim()
      ? String(displayName).trim().slice(0, 28)
      : getEffectiveName(current);
  const nextUsername =
    username !== undefined && String(username).trim()
      ? String(username).trim().slice(0, 24)
      : current.username;
  const rawNextEmail =
    email !== undefined && String(email).trim() ? String(email).trim().toLowerCase() : current.email;
  const nextEmail = targetIsSupreme ? SUPREME_OWNER_EMAIL : rawNextEmail;
  const nextPasswordHash = passwordHash || current.password_hash;
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url;
  const rawNextRole = role !== undefined && isValidRank(role) ? role : current.role;
  const nextRole = targetIsSupreme || isSupremeOwnerEmail(nextEmail) ? 'site_owner' : rawNextRole;

  for (const other of store.usersById.values()) {
    if (other.id === current.id) continue;
    if (other.username.toLowerCase() === nextUsername.toLowerCase()) {
      return { error: 'اسم المستخدم مستخدم لحساب آخر.' };
    }
    if (other.email.toLowerCase() === nextEmail.toLowerCase()) {
      return { error: 'البريد الإلكتروني مستخدم لحساب آخر.' };
    }
  }

  const updated = {
    ...current,
    username: nextUsername,
    display_name: nextDisplay,
    email: nextEmail,
    password_hash: nextPasswordHash,
    avatar_url: nextAvatar,
    role: nextRole
  };

  store.usersById.set(updated.id, updated);
  enqueueSet('users', String(updated.id), updated);

  const senderKey = `user:${updated.id}`;
  for (const m of store.messagesById.values()) {
    if (m.sender_key === senderKey) {
      m.sender_name = nextDisplay;
      m.sender_role = nextRole;
      m.avatar_url = nextAvatar || '';
      enqueueSet(
        'messages',
        String(m.doc_id || m.id),
        { sender_name: nextDisplay, sender_role: nextRole, avatar_url: nextAvatar || '' },
        true
      );
    }
  }

  return { user: { ...updated } };
}

function spendUserCoins(userId, cost) {
  if (!cost || cost <= 0) return { user: findUserById(userId) };
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  if ((current.coins || 0) < cost) return { error: 'رصيد المحفظة غير كافٍ لإتمام الشراء.' };
  current.coins -= cost;
  enqueueSet('users', String(current.id), { coins: current.coins }, true);
  return { user: { ...current } };
}

function adjustUserCoins(userId, delta) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  const amount = Number(delta) || 0;
  current.coins = Math.max(0, (Number(current.coins) || 0) + amount);
  enqueueSet('users', String(current.id), { coins: current.coins }, true);
  return { ...current };
}

function updateUserRole(userId, newRole) {
  if (!isValidRank(newRole)) return null;
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  if (isSupremeOwnerEmail(current.email) && newRole !== 'site_owner') {
    return null;
  }
  current.role = newRole;
  enqueueSet('users', String(current.id), { role: newRole }, true);

  const senderKey = `user:${current.id}`;
  for (const m of store.messagesById.values()) {
    if (m.sender_key === senderKey) {
      m.sender_role = newRole;
      enqueueSet('messages', String(m.doc_id || m.id), { sender_role: newRole }, true);
    }
  }
  return { ...current };
}

function forceChangeUserDisplayName(userId, newDisplayName) {
  const clean = String(newDisplayName || '').trim().slice(0, 28);
  if (clean.length < 2) return null;
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  current.display_name = clean;
  enqueueSet('users', String(current.id), { display_name: clean }, true);
  return { ...current };
}

function getAllRegisteredUsers() {
  return [...store.usersById.values()]
    .map((u) => {
      const { password_hash: _pw, ...safe } = u;
      return safe;
    })
    .sort((a, b) => getRankSortWeight(b.role) - getRankSortWeight(a.role) || a.id - b.id);
}

// ==========================================
// ROOMS, YOUTUBE & STAFF HELPERS
// ==========================================
function getAllRooms() {
  return [...store.roomsById.values()].sort((a, b) =>
    String(a.created_at || '').localeCompare(String(b.created_at || ''))
  );
}

function getRoomById(roomId) {
  const r = store.roomsById.get(roomId);
  return r ? { ...r } : null;
}

function getRoomStaff(roomId) {
  const list = [];
  for (const s of store.roomStaffByKey.values()) {
    if (s.room_id === roomId) {
      const u = store.usersById.get(Number(s.user_id));
      if (u) {
        list.push({
          roomId: s.room_id,
          userId: s.user_id,
          name: getEffectiveName(u),
          role: u.role,
          avatarUrl: u.avatar_url || '',
          staffRole: s.staff_role || 'مشرف غرفة',
          assignedBy: s.assigned_by || '',
          created_at: s.created_at
        });
      }
    }
  }
  return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}

function setRoomOwner(roomId, ownerUserId) {
  const room = store.roomsById.get(roomId);
  if (!room) return null;
  const uid = ownerUserId ? Number(ownerUserId) : null;
  if (!uid || Number.isNaN(uid)) {
    room.owner_user_id = null;
    room.owner_name = '';
  } else {
    const u = findUserById(uid);
    if (!u) return null;
    room.owner_user_id = uid;
    room.owner_name = getEffectiveName(u);
  }
  enqueueSet('rooms', roomId, room);
  return { ...room };
}

function addRoomStaff(roomId, userId, staffRole = 'مشرف غرفة', assignedBy = '') {
  const uid = Number(userId);
  if (!roomId || Number.isNaN(uid) || !findUserById(uid)) return null;
  const key = `${roomId}:${uid}`;
  const docObj = {
    room_id: roomId,
    user_id: uid,
    staff_role: String(staffRole || 'مشرف غرفة').slice(0, 30),
    assigned_by: String(assignedBy || ''),
    created_at: nowIso()
  };
  store.roomStaffByKey.set(key, docObj);
  enqueueSet('room_staff', safeDocId(key), docObj);
  return getRoomStaff(roomId);
}

function removeRoomStaff(roomId, userId) {
  const key = `${roomId}:${Number(userId)}`;
  store.roomStaffByKey.delete(key);
  enqueueDelete('room_staff', safeDocId(key));
  return getRoomStaff(roomId);
}

function isRoomStaffMember(roomId, userId) {
  if (!roomId || !userId) return false;
  return store.roomStaffByKey.has(`${roomId}:${Number(userId)}`);
}

function isRoomManager(roomId, userId, userRole) {
  if (userRole === 'site_owner' || hasPermission(userRole, 'manage_rooms') || hasPermission(userRole, 'room_owner')) {
    return true;
  }
  if (!roomId || !userId) return false;
  const room = getRoomById(roomId);
  if (room && room.owner_user_id && Number(room.owner_user_id) === Number(userId)) return true;
  return isRoomStaffMember(roomId, userId);
}

function setRoomYoutube(roomId, { videoId = '', title = '', isPlaying = false }) {
  const r = store.roomsById.get(roomId);
  if (!r) return null;
  r.youtube_video_id = String(videoId || '').trim().slice(0, 32);
  r.youtube_title = String(title || '').trim().slice(0, 120);
  r.youtube_is_playing = isPlaying && r.youtube_video_id ? 1 : 0;
  r.youtube_updated_at = nowIso();
  enqueueSet(
    'rooms',
    roomId,
    {
      youtube_video_id: r.youtube_video_id,
      youtube_title: r.youtube_title,
      youtube_is_playing: r.youtube_is_playing,
      youtube_updated_at: r.youtube_updated_at
    },
    true
  );
  return { ...r };
}

function sanitizeRoomForPublic(room) {
  if (!room) return null;
  const { room_password, ...rest } = room;
  return {
    ...rest,
    hasPassword: Boolean(room_password && room_password.trim()),
    min_rank_power: Number(room.min_rank_power) || 0,
    owner_user_id: room.owner_user_id ? Number(room.owner_user_id) : null,
    owner_name: room.owner_name || '',
    activity_points: Number(room.activity_points) || 0,
    youtube_video_id: String(room.youtube_video_id || ''),
    youtube_title: String(room.youtube_title || ''),
    youtube_is_playing: room.youtube_is_playing ? 1 : 0,
    youtube_updated_at: String(room.youtube_updated_at || ''),
    staff: getRoomStaff(room.id)
  };
}

function createRoom({
  id,
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
  createdBy
}) {
  let resolvedOwnerId = null;
  let resolvedOwnerName = '';
  if (ownerUserId) {
    const ownerRow = findUserById(Number(ownerUserId));
    if (ownerRow) {
      resolvedOwnerId = ownerRow.id;
      resolvedOwnerName = getEffectiveName(ownerRow);
    }
  }
  const room = {
    id,
    name,
    description: description || '',
    icon: icon || '💬',
    image_url: imageUrl || '/assets/rooms/default.svg',
    bg_theme: bgTheme || 'warm_peach',
    wallpaper_url: wallpaperUrl || '',
    bg_custom: bgCustom || '',
    card_bg_color: sanitizeHexColor(cardBgColor, ''),
    card_text_color: sanitizeHexColor(cardTextColor, ''),
    welcome_message: String(welcomeMessage || '').trim().slice(0, 250),
    room_password: String(roomPassword || '').trim().slice(0, 40),
    min_rank_power: Math.max(0, Math.min(100, Number(minRankPower) || 0)),
    owner_user_id: resolvedOwnerId,
    owner_name: resolvedOwnerName,
    activity_points: 0,
    youtube_video_id: '',
    youtube_title: '',
    youtube_is_playing: 0,
    youtube_updated_at: '',
    mics_enabled: 1,
    created_by: createdBy || 'owner',
    created_at: nowIso()
  };

  store.roomsById.set(id, room);
  enqueueSet('rooms', id, room);
  return { ...room };
}

function updateRoom(
  roomId,
  {
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
    micsEnabled
  }
) {
  const current = store.roomsById.get(roomId);
  if (!current) return null;

  let nextOwnerId = current.owner_user_id;
  let nextOwnerName = current.owner_name || '';
  if (ownerUserId !== undefined) {
    if (!ownerUserId) {
      nextOwnerId = null;
      nextOwnerName = '';
    } else {
      const ownerRow = findUserById(Number(ownerUserId));
      if (ownerRow) {
        nextOwnerId = ownerRow.id;
        nextOwnerName = getEffectiveName(ownerRow);
      }
    }
  }

  const updated = {
    ...current,
    name: name !== undefined && String(name).trim() ? String(name).trim() : current.name,
    description: description !== undefined ? String(description).trim() : current.description,
    icon: icon !== undefined && String(icon).trim() ? String(icon).trim() : current.icon,
    image_url: imageUrl !== undefined && String(imageUrl).trim() ? String(imageUrl).trim() : current.image_url,
    bg_theme: bgTheme !== undefined && String(bgTheme).trim() ? String(bgTheme).trim() : current.bg_theme || 'warm_peach',
    wallpaper_url: wallpaperUrl !== undefined ? String(wallpaperUrl).trim() : current.wallpaper_url || '',
    bg_custom: bgCustom !== undefined ? String(bgCustom).trim().slice(0, 180) : current.bg_custom || '',
    card_bg_color: cardBgColor !== undefined ? (cardBgColor ? sanitizeHexColor(cardBgColor, '') : '') : current.card_bg_color || '',
    card_text_color: cardTextColor !== undefined ? (cardTextColor ? sanitizeHexColor(cardTextColor, '') : '') : current.card_text_color || '',
    welcome_message:
      welcomeMessage !== undefined ? String(welcomeMessage).trim().slice(0, 250) : current.welcome_message || '',
    room_password: roomPassword !== undefined ? String(roomPassword).trim().slice(0, 40) : current.room_password || '',
    min_rank_power:
      minRankPower !== undefined ? Math.max(0, Math.min(100, Number(minRankPower) || 0)) : Number(current.min_rank_power) || 0,
    owner_user_id: nextOwnerId,
    owner_name: nextOwnerName,
    mics_enabled: micsEnabled !== undefined ? (micsEnabled ? 1 : 0) : current.mics_enabled
  };

  store.roomsById.set(roomId, updated);
  enqueueSet('rooms', roomId, updated);
  return { ...updated };
}

function deleteRoom(roomId) {
  const staffToDelete = [];
  for (const [k, s] of store.roomStaffByKey.entries()) {
    if (s.room_id === roomId) {
      store.roomStaffByKey.delete(k);
      staffToDelete.push(safeDocId(k));
    }
  }
  enqueueBatchDelete('room_staff', staffToDelete);

  clearRoomMessages(roomId);

  const mutesToDelete = [];
  for (const [k, m] of store.mutesByKey.entries()) {
    if (m.room_id === roomId) {
      store.mutesByKey.delete(k);
      mutesToDelete.push(safeDocId(k));
    }
  }
  enqueueBatchDelete('mutes', mutesToDelete);

  store.roomsById.delete(roomId);
  enqueueDelete('rooms', roomId);
}

// ==========================================
// MESSAGES (PERMANENT FIRESTORE STORAGE)
// ==========================================
function addMessage({
  roomId,
  senderKey,
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
  nameShine,
  vipWings,
  isAdminNotice,
  isGift,
  isGhostOnly,
  giftData,
  msgType,
  content,
  mediaUrl,
  clientMsgId,
  createdAt,
  createdAtMs
}) {
  const id = nextSeq('messages');
  const tsMs = Number(createdAtMs) || Date.now();
  const iso = createdAt || new Date(tsMs).toISOString();
  const persistedMsgType = ['text', 'image', 'audio', 'sticker'].includes(msgType) ? msgType : 'text';
  const msg = {
    id,
    doc_id: String(id),
    room_id: roomId,
    sender_key: senderKey,
    sender_name: senderName,
    sender_role: senderRole || 'member',
    name_color: nameColor || '#0f172a',
    text_color: textColor || '#111827',
    name_bg_color: nameBgColor || '',
    neon_color: neonColor || '',
    font_family: fontFamily || 'Normal',
    font_style: fontStyle || 'Normal',
    avatar_url: avatarUrl || '',
    avatar_frame: avatarFrame || 'none',
    nameplate_style: nameplateStyle || 'default',
    name_shine: nameShine || 'none',
    vip_wings: vipWings ? 1 : 0,
    is_admin_notice: Boolean(isAdminNotice),
    is_gift: Boolean(isGift),
    is_ghost_only: Boolean(isGhostOnly),
    gift_data: giftData || null,
    msg_type: persistedMsgType,
    content: content || '',
    media_url: mediaUrl || '',
    client_msg_id: String(clientMsgId || ''),
    created_at: iso,
    created_at_ms: tsMs
  };

  localEmittedMessageIds.add(String(id));
  if (msg.client_msg_id) localEmittedMessageIds.add(msg.client_msg_id);
  if (localEmittedMessageIds.size > 4000) {
    const first = localEmittedMessageIds.values().next().value;
    localEmittedMessageIds.delete(first);
  }

  store.messagesById.set(String(id), msg);
  enqueueSet('messages', String(id), msg);
  return { ...msg };
}

function getRoomMessages(roomId, limit = 100, viewerKey = '') {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
  const list = [];
  for (const m of store.messagesById.values()) {
    if (m.room_id === roomId && (!m.is_ghost_only || m.sender_key === viewerKey)) {
      list.push(m);
    }
  }
  list.sort(
    (a, b) =>
      (Number(a.created_at_ms) || 0) - (Number(b.created_at_ms) || 0) ||
      (Number(a.id) || 0) - (Number(b.id) || 0)
  );
  return list.slice(-safeLimit);
}

function clearRoomMessages(roomId) {
  const docIds = [];
  for (const [k, m] of store.messagesById.entries()) {
    if (m.room_id === roomId) {
      store.messagesById.delete(k);
      docIds.push(String(m.doc_id || k));
    }
  }
  enqueueBatchDelete('messages', docIds);
}

function deleteMessageById(msgId) {
  const idStr = String(msgId || '');
  if (!idStr) return null;
  for (const [k, m] of store.messagesById.entries()) {
    if (String(m.id) === idStr || String(k) === idStr || String(m.doc_id) === idStr) {
      store.messagesById.delete(k);
      enqueueBatchDelete('messages', [String(m.doc_id || k)]);
      return m;
    }
  }
  return null;
}

// ==========================================
// MUTES & BANS
// ==========================================
function setMute(targetKey, roomId, durationMs, mutedBy) {
  if (isProtectedSupremeOwnerKey(targetKey)) return null;
  const expiresAt = Date.now() + durationMs;
  const rid = roomId || '*';
  const key = `${targetKey}::${rid}`;
  const docObj = {
    target_key: targetKey,
    room_id: rid,
    expires_at: expiresAt,
    muted_by: mutedBy
  };
  store.mutesByKey.set(key, docObj);
  enqueueSet('mutes', safeDocId(key), docObj);
  return expiresAt;
}

function removeMute(targetKey, roomId) {
  const docIds = [];
  if (!roomId || roomId === '*') {
    for (const [k, m] of store.mutesByKey.entries()) {
      if (m.target_key === targetKey) {
        store.mutesByKey.delete(k);
        docIds.push(safeDocId(k));
      }
    }
  } else {
    for (const [k, m] of store.mutesByKey.entries()) {
      if (m.target_key === targetKey && (m.room_id === roomId || m.room_id === '*')) {
        store.mutesByKey.delete(k);
        docIds.push(safeDocId(k));
      }
    }
  }
  enqueueBatchDelete('mutes', docIds);
}

function getActiveMute(targetKey, roomId) {
  if (isProtectedSupremeOwnerKey(targetKey)) return null;
  const rid = roomId || '*';
  const now = Date.now();
  for (const [k, row] of store.mutesByKey.entries()) {
    if (row.target_key === targetKey && (row.room_id === rid || row.room_id === '*')) {
      if (Number(row.expires_at) <= now) {
        store.mutesByKey.delete(k);
        enqueueDelete('mutes', safeDocId(k));
      } else {
        return { ...row };
      }
    }
  }
  return null;
}

function isLoopbackIp(ip) {
  if (!ip) return true;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function banTarget({ targetKey, targetName, email, ipAddress, deviceId, banType = 'ban', reason, bannedBy }) {
  if (isProtectedSupremeOwnerKey(targetKey) || isSupremeOwnerEmail(email)) {
    return false;
  }
  const prev = store.bansByKey.get(targetKey) || {};
  const cleanEmail = (email || '').toLowerCase() || prev.email || '';
  const cleanIp = ipAddress || prev.ip_address || '';
  const cleanDevice = deviceId || prev.device_id || '';
  const cleanReason = reason || (banType === 'xban' ? 'إكس باند (حظر جهاز وعنوان)' : 'حظر نهائي من الإدارة');
  const docObj = {
    target_key: targetKey,
    target_name: targetName || targetKey,
    email: cleanEmail,
    ip_address: cleanIp,
    device_id: cleanDevice,
    ban_type: banType === 'xban' ? 'xban' : 'ban',
    reason: cleanReason,
    banned_by: bannedBy || 'الإدارة',
    created_at: nowIso()
  };

  store.bansByKey.set(targetKey, docObj);
  enqueueSet('bans', safeDocId(targetKey), docObj);

  if (targetKey.startsWith('user:')) {
    const uid = Number(targetKey.replace('user:', ''));
    const u = store.usersById.get(uid);
    if (u) {
      u.is_banned = 1;
      u.ban_reason = cleanReason;
      enqueueSet('users', String(uid), { is_banned: 1, ban_reason: cleanReason }, true);
    }
  }
  return true;
}

function unbanTarget(targetKey) {
  store.bansByKey.delete(targetKey);
  enqueueDelete('bans', safeDocId(targetKey));
  if (targetKey.startsWith('user:')) {
    const uid = Number(targetKey.replace('user:', ''));
    const u = store.usersById.get(uid);
    if (u) {
      u.is_banned = 0;
      u.ban_reason = '';
      enqueueSet('users', String(uid), { is_banned: 0, ban_reason: '' }, true);
    }
  }
}

function getAllBans() {
  return [...store.bansByKey.values()].sort((a, b) =>
    String(b.created_at || '').localeCompare(String(a.created_at || ''))
  );
}

function isTargetBanned(input) {
  const targetKey = typeof input === 'string' ? input : input?.targetKey || '';
  const email = typeof input === 'object' ? (input?.email || '').toLowerCase() : '';
  const ipAddress = typeof input === 'object' ? input?.ipAddress || '' : '';
  const deviceId = typeof input === 'object' ? input?.deviceId || '' : '';

  if (isSupremeOwnerEmail(email) || isProtectedSupremeOwnerKey(targetKey)) {
    return null;
  }

  if (targetKey) {
    const banRow = store.bansByKey.get(targetKey);
    if (banRow) return { ...banRow };
    if (targetKey.startsWith('user:')) {
      const uid = Number(targetKey.replace('user:', ''));
      const u = Number.isNaN(uid) ? null : findUserById(uid);
      if (u && (isSupremeOwnerEmail(u.email) || u.role === 'site_owner')) {
        return null;
      }
      if (u && u.is_banned === 1) {
        return { target_key: targetKey, target_name: getEffectiveName(u), reason: u.ban_reason || 'حظر نهائي' };
      }
    }
  }

  if (email) {
    for (const b of store.bansByKey.values()) {
      if ((b.email || '').toLowerCase() === email) return { ...b };
    }
  }

  if (deviceId) {
    for (const b of store.bansByKey.values()) {
      if (b.device_id && b.device_id === deviceId) return { ...b };
    }
  }

  if (ipAddress && !isLoopbackIp(ipAddress)) {
    for (const b of store.bansByKey.values()) {
      if (b.ip_address === ipAddress) return { ...b };
    }
  }

  return null;
}

// ==========================================
// NEWS, GIFTS, SOCIAL, PM, WALL, REPORTS, NOTIFICATIONS
// ==========================================
function addNewsPost({ title, content, imageUrl, authorKey, authorName, authorRole }) {
  const cleanTitle = String(title || '').trim().slice(0, 120);
  const cleanContent = String(content || '').trim().slice(0, 2000);
  if (cleanTitle.length < 2 || cleanContent.length < 2) {
    return { error: 'يرجى كتابة عنوان ومحتوى الخبر.' };
  }
  const id = nextSeq('news');
  const post = {
    id,
    post_type: 'news',
    title: cleanTitle,
    content: cleanContent,
    image_url: String(imageUrl || '').trim(),
    author_key: authorKey,
    author_name: authorName,
    author_role: authorRole || 'site_owner',
    created_at: nowIso()
  };
  store.newsById.set(id, post);
  // Persisted inside wall_posts collection under docId `news_${id}` so Cloud Firestore rules always accept it
  enqueueSet('wall_posts', `news_${id}`, post);
  return { news: { ...post } };
}

function getAllNews() {
  return [...store.newsById.values()].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 60);
}

function deleteNewsPost(newsId) {
  const nid = Number(newsId);
  if (Number.isNaN(nid) || !store.newsById.has(nid)) return false;
  store.newsById.delete(nid);
  enqueueDelete('wall_posts', `news_${nid}`);
  return true;
}

function sendGift({ fromUserId, fromKey, fromName, fromRole, toKey, toName, giftId, roomId }) {
  const gift = GIFT_CATALOG.find((g) => g.id === giftId);
  if (!gift) return { error: 'الهدية المختارة غير متوفرة.' };
  if (!fromUserId) return { error: 'إرسال الهدايا متاح للأعضاء المسجلين فقط.' };
  const sender = store.usersById.get(Number(fromUserId));
  if (!sender) return { error: 'حساب المرسل غير موجود.' };
  if (fromKey === toKey) return { error: 'لا يمكنك إرسال هدية إلى نفسك.' };
  if ((Number(sender.coins) || 0) < gift.cost) {
    return { error: `رصيدك الحالي (${sender.coins}) غير كافٍ لهذه الهدية (${gift.cost} عملة).` };
  }

  sender.coins = (Number(sender.coins) || 0) - gift.cost;
  sender.gifts_sent = (Number(sender.gifts_sent) || 0) + 1;
  sender.activity_points = (Number(sender.activity_points) || 0) + 5;
  enqueueSet(
    'users',
    String(sender.id),
    { coins: sender.coins, gifts_sent: sender.gifts_sent, activity_points: sender.activity_points },
    true
  );

  let receiverRow = null;
  if (toKey && String(toKey).startsWith('user:')) {
    const rid = Number(String(toKey).replace('user:', ''));
    const rec = Number.isNaN(rid) ? null : store.usersById.get(rid);
    if (rec) {
      rec.coins = (Number(rec.coins) || 0) + gift.reward;
      rec.gifts_received = (Number(rec.gifts_received) || 0) + 1;
      rec.activity_points = (Number(rec.activity_points) || 0) + 4;
      enqueueSet(
        'users',
        String(rec.id),
        { coins: rec.coins, gifts_received: rec.gifts_received, activity_points: rec.activity_points },
        true
      );
      receiverRow = { ...rec };
    }
  }

  if (roomId) {
    const rm = store.roomsById.get(roomId);
    if (rm) {
      rm.activity_points = (Number(rm.activity_points) || 0) + 5;
      enqueueSet('rooms', roomId, { activity_points: rm.activity_points }, true);
    }
  }

  const txId = nextSeq('gifts');
  const tx = {
    id: txId,
    post_type: 'gift_tx',
    gift_id: gift.id,
    gift_name: gift.name,
    gift_emoji: gift.emoji,
    gift_color: gift.color,
    gift_tier: gift.tier,
    cost: gift.cost,
    reward: gift.reward,
    from_key: fromKey,
    from_name: fromName,
    from_role: fromRole || sender.role,
    to_key: toKey,
    to_name: toName,
    room_id: roomId || '',
    created_at: nowIso()
  };
  store.giftsById.set(txId, tx);
  enqueueSet('wall_posts', `gift_${txId}`, tx);

  return {
    tx: { ...tx },
    gift,
    sender: { ...sender },
    receiver: receiverRow
  };
}

function getGiftsForUser(userKey) {
  const received = [];
  const sent = [];
  for (const g of store.giftsById.values()) {
    if (g.to_key === userKey) received.push(g);
    if (g.from_key === userKey) sent.push(g);
  }
  received.sort((a, b) => Number(b.id) - Number(a.id));
  sent.sort((a, b) => Number(b.id) - Number(a.id));
  return {
    received: received.slice(0, 50),
    sent: sent.slice(0, 50)
  };
}

function addPrivateMessage({ fromKey, fromName, fromRole, fromAvatar, toKey, toName, content }) {
  const id = nextSeq('private_messages');
  const pm = {
    id,
    from_key: fromKey,
    from_name: fromName,
    from_role: fromRole || 'member',
    from_avatar: fromAvatar || '',
    to_key: toKey,
    to_name: toName,
    content,
    is_read: 0,
    created_at: nowIso()
  };
  store.privateMessagesById.set(id, pm);
  enqueueSet('private_messages', String(id), pm);
  return { ...pm };
}

function getPrivateMessagesForUser(userKey) {
  return [...store.privateMessagesById.values()]
    .filter((m) => m.from_key === userKey || m.to_key === userKey)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 120);
}

function markPrivateMessagesRead(readerKey, partnerKey) {
  if (!readerKey || !partnerKey) return 0;
  let count = 0;
  for (const pm of store.privateMessagesById.values()) {
    if (pm.to_key === readerKey && pm.from_key === partnerKey && pm.is_read === 0) {
      pm.is_read = 1;
      count += 1;
      enqueueSet('private_messages', String(pm.id), { is_read: 1 }, true);
    }
  }
  return count;
}

function sendFriendRequest({ fromUser, toKey, toName, toRole, toAvatar }) {
  const key1 = `${fromUser.key}::${toKey}`;
  if (store.friendshipsByKey.has(key1)) return { ...store.friendshipsByKey.get(key1) };

  const f1 = {
    user_key: fromUser.key,
    friend_key: toKey,
    friend_name: toName,
    friend_role: toRole || 'member',
    friend_avatar: toAvatar || '',
    status: 'pending',
    requested_by: fromUser.key,
    created_at: nowIso()
  };
  const key2 = `${toKey}::${fromUser.key}`;
  const f2 = {
    user_key: toKey,
    friend_key: fromUser.key,
    friend_name: fromUser.name,
    friend_role: fromUser.role || 'member',
    friend_avatar: fromUser.avatarUrl || '',
    status: 'pending',
    requested_by: fromUser.key,
    created_at: nowIso()
  };

  store.friendshipsByKey.set(key1, f1);
  store.friendshipsByKey.set(key2, f2);
  enqueueSet('friendships', safeDocId(key1), f1);
  enqueueSet('friendships', safeDocId(key2), f2);
  return { ok: true };
}

function respondFriendRequest(userKey, friendKey, accept) {
  const key1 = `${userKey}::${friendKey}`;
  const key2 = `${friendKey}::${userKey}`;
  if (accept) {
    for (const k of [key1, key2]) {
      const f = store.friendshipsByKey.get(k);
      if (f) {
        f.status = 'accepted';
        enqueueSet('friendships', safeDocId(k), { status: 'accepted' }, true);
      }
    }
  } else {
    store.friendshipsByKey.delete(key1);
    store.friendshipsByKey.delete(key2);
    enqueueDelete('friendships', safeDocId(key1));
    enqueueDelete('friendships', safeDocId(key2));
  }
}

function getFriendsForUser(userKey) {
  return [...store.friendshipsByKey.values()]
    .filter((f) => f.user_key === userKey)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function addWallPost({ authorKey, authorName, authorRole, avatarUrl, avatarFrame, nameplateStyle, content, imageUrl }) {
  const id = nextSeq('wall_posts');
  const post = {
    id,
    post_type: 'wall',
    author_key: authorKey,
    author_name: authorName,
    author_role: authorRole || 'member',
    avatar_url: avatarUrl || '',
    avatar_frame: avatarFrame || 'none',
    nameplate_style: nameplateStyle || 'default',
    content,
    image_url: imageUrl || '',
    likes_count: 0,
    created_at: nowIso()
  };
  store.wallPostsById.set(id, post);
  enqueueSet('wall_posts', String(id), post);
  return { ...post };
}

function getWallPosts() {
  return [...store.wallPostsById.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 40);
}

function likeWallPost(postId) {
  const post = store.wallPostsById.get(Number(postId));
  if (!post) return null;
  post.likes_count = (Number(post.likes_count) || 0) + 1;
  enqueueSet('wall_posts', String(post.id), { likes_count: post.likes_count }, true);
  return { ...post };
}

function addReport({ reporterKey, reporterName, targetName, reason, roomId }) {
  const id = nextSeq('reports');
  const rep = {
    id,
    reporter_key: reporterKey,
    reporter_name: reporterName,
    target_name: targetName,
    reason,
    room_id: roomId || '',
    created_at: nowIso()
  };
  store.reportsById.set(id, rep);
  enqueueSet('reports', String(id), rep);
  return { ...rep };
}

function getReports() {
  return [...store.reportsById.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 50);
}

function addNotification({ targetKey, title, body, category = 'system' }) {
  const id = nextSeq('notifications');
  const notif = {
    id,
    target_key: targetKey,
    title,
    body,
    category,
    is_read: 0,
    read_by: [],
    created_at: nowIso()
  };
  store.notificationsById.set(id, notif);
  enqueueSet('notifications', String(id), notif);
  return { ...notif };
}

function getNotificationsForUser(userKey) {
  return [...store.notificationsById.values()]
    .filter((n) => n.target_key === userKey || n.target_key === '*')
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 35)
    .map((n) => ({
      ...n,
      readByMe:
        n.target_key === userKey
          ? Boolean(n.is_read)
          : Array.isArray(n.read_by) && n.read_by.includes(userKey)
    }));
}

function getUnreadNotificationCount(userKey) {
  let count = 0;
  for (const n of store.notificationsById.values()) {
    if (n.target_key === userKey) {
      if (!n.is_read) count += 1;
    } else if (n.target_key === '*') {
      const readBy = Array.isArray(n.read_by) ? n.read_by : [];
      if (!readBy.includes(userKey)) count += 1;
    }
  }
  return count;
}

function markNotificationsRead(userKey) {
  if (!userKey) return 0;
  let updated = 0;
  for (const n of store.notificationsById.values()) {
    if (n.target_key === userKey && !n.is_read) {
      n.is_read = 1;
      updated += 1;
      enqueueSet('notifications', String(n.id), { is_read: 1 }, true);
    } else if (n.target_key === '*') {
      const readBy = Array.isArray(n.read_by) ? [...n.read_by] : [];
      if (!readBy.includes(userKey)) {
        readBy.push(userKey);
        if (readBy.length > 500) readBy.shift();
        n.read_by = readBy;
        updated += 1;
        enqueueSet('notifications', String(n.id), { read_by: readBy }, true);
      }
    }
  }
  return updated;
}

function migrateGuestKeyReferences(oldKey, newKey, newName, newRole) {
  if (!oldKey || !newKey || oldKey === newKey) return;

  for (const [k, m] of [...store.mutesByKey.entries()]) {
    if (m.target_key === oldKey) {
      store.mutesByKey.delete(k);
      enqueueDelete('mutes', safeDocId(k));
      const newMuteKey = `${newKey}::${m.room_id}`;
      if (!store.mutesByKey.has(newMuteKey)) {
        const migrated = { ...m, target_key: newKey };
        store.mutesByKey.set(newMuteKey, migrated);
        enqueueSet('mutes', safeDocId(newMuteKey), migrated);
      }
    }
  }

  for (const m of store.messagesById.values()) {
    if (m.sender_key === oldKey) {
      m.sender_key = newKey;
      m.sender_name = newName;
      m.sender_role = newRole;
      enqueueSet(
        'messages',
        String(m.doc_id || m.id),
        { sender_key: newKey, sender_name: newName, sender_role: newRole },
        true
      );
    }
  }

  for (const pm of store.privateMessagesById.values()) {
    let changed = false;
    const patch = {};
    if (pm.from_key === oldKey) {
      pm.from_key = newKey;
      pm.from_name = newName;
      pm.from_role = newRole;
      patch.from_key = newKey;
      patch.from_name = newName;
      patch.from_role = newRole;
      changed = true;
    }
    if (pm.to_key === oldKey) {
      pm.to_key = newKey;
      pm.to_name = newName;
      patch.to_key = newKey;
      patch.to_name = newName;
      changed = true;
    }
    if (changed) {
      enqueueSet('private_messages', String(pm.id), patch, true);
    }
  }
}

module.exports = {
  init,
  flushWrites,
  getStorageStatus,
  SUPREME_OWNER_EMAIL,
  GIFT_CATALOG,
  isSupremeOwnerEmail,
  isProtectedSupremeOwnerKey,
  ensureSupremeOwnerAccount: (id) => {
    const u = store.usersById.get(Number(id));
    return u ? { ...enforceSupremeOwnerUser(u) } : null;
  },
  DEFAULT_RANKS,
  getAllRanks,
  getRankByKey,
  getRankPower,
  getMaxAssignablePower,
  getRankSortWeight,
  isValidRank,
  hasPermission,
  createRank,
  updateRank,
  deleteRank,
  getAllCustomEmojis,
  addCustomEmoji,
  deleteCustomEmoji,
  getSiteSettings,
  updateSiteSettings,
  getEffectiveName,
  getUserCount,
  registerUser,
  findUserByIdentifier,
  findUserById,
  updateUserIp,
  setUserStealth,
  setUserGhosted,
  interactProfile,
  updateUserCredentials,
  deleteUserAccountPermanently,
  incrementActivityPoints,
  updateUserCustomization,
  adminCreateUser,
  adminUpdateUserAccount,
  spendUserCoins,
  adjustUserCoins,
  updateUserRole,
  forceChangeUserDisplayName,
  getAllRegisteredUsers,
  getAllRooms,
  getRoomById,
  getRoomStaff,
  setRoomOwner,
  addRoomStaff,
  removeRoomStaff,
  isRoomStaffMember,
  isRoomManager,
  setRoomYoutube,
  sanitizeRoomForPublic,
  createRoom,
  updateRoom,
  deleteRoom,
  addMessage,
  getRoomMessages,
  clearRoomMessages,
  deleteMessageById,
  setMute,
  removeMute,
  getActiveMute,
  banTarget,
  unbanTarget,
  getAllBans,
  isTargetBanned,
  addNewsPost,
  getAllNews,
  deleteNewsPost,
  sendGift,
  getGiftsForUser,
  addPrivateMessage,
  getPrivateMessagesForUser,
  markPrivateMessagesRead,
  sendFriendRequest,
  respondFriendRequest,
  getFriendsForUser,
  addWallPost,
  getWallPosts,
  likeWallPost,
  addReport,
  getReports,
  addNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationsRead,
  migrateGuestKeyReferences
};
