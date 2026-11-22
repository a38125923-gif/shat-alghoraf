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
  if (!u.avatar_frame || u.avatar_frame === 'none' || u.avatar_frame === 'gold_royal') {
    u.avatar_frame = 'owner_sovereign';
    patch.avatar_frame = 'owner_sovereign';
    changed = true;
  }
  if (!u.nameplate_style || u.nameplate_style === 'default') {
    u.nameplate_style = 'crimson_royal';
    patch.nameplate_style = 'crimson_royal';
    changed = true;
  }
  if (u.coins === undefined || u.coins === null || Number.isNaN(Number(u.coins))) {
    u.coins = 99999;
    patch.coins = 99999;
    changed = true;
  }
  if (u.is_ghosted || u.is_shadow_muted || u.is_frozen) {
    u.is_ghosted = 0;
    u.is_shadow_muted = 0;
    u.is_frozen = 0;
    patch.is_ghosted = 0;
    patch.is_shadow_muted = 0;
    patch.is_frozen = 0;
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
    enqueueDelete('banned_users', safeDocId(targetKey));
    enqueueDelete('bans', safeDocId(targetKey));
  }
  for (const [bk, b] of [...store.bansByKey.entries()]) {
    if (isSupremeOwnerEmail(b.email)) {
      store.bansByKey.delete(bk);
      enqueueDelete('banned_users', safeDocId(bk));
      enqueueDelete('bans', safeDocId(bk));
    }
  }
  for (const [mk, m] of [...store.mutesByKey.entries()]) {
    if (m.target_key === targetKey) {
      store.mutesByKey.delete(mk);
      enqueueDelete('muted_users', safeDocId(mk));
      enqueueDelete('mutes', safeDocId(mk));
    }
  }
  return u;
}

const ALL_RANK_PERMISSIONS = [
  'pm',
  'chat_media',
  'mic',
  'youtube',
  'wall',
  'gifts',
  'use_addons',
  'immune',
  'delete_msg',
  'mute',
  'kick',
  'ban',
  'manage_rooms',
  'set_rank',
  'stealth',
  'give_coins',
  'clear_room',
  'access_panel',
  'room_owner',
  'publish_news',
  'send_links'
];

function makeRankPerms(enabledList = []) {
  const set = new Set(enabledList);
  const out = {};
  for (const p of ALL_RANK_PERMISSIONS) {
    out[`perm_${p}`] = set.has('*') || set.has(p) ? 1 : 0;
  }
  return out;
}

const LEGACY_ROLE_MIGRATION_MAP = {
  senior_admin: 'co_owner',
  vip_owner: 'super_owner',
  master_owner: 'super_owner',
  master_super: 'super_owner',
  director: 'general_admin',
  general_mod: 'general_admin',
  moderator: 'super_admin',
  support_94: 'super_admin',
  support_93: 'super_admin',
  support_92: 'super_admin',
  support_91: 'admin',
  support_90: 'admin',
  supervisor: 'admin',
  admin_87: 'admin',
  admin_86: 'admin',
  admin_85: 'admin',
  admin_84: 'admin',
  admin_83: 'admin',
  admin_82: 'admin',
  admin_81: 'admin',
  admin_80: 'admin',
  founder_79: 'admin',
  vip: 'royal_vip',
  silver_vip: 'silver_member',
  participant_10: 'gold_member',
  participant_9: 'gold_member',
  participant_8: 'silver_member',
  participant_7: 'silver_member',
  participant_6: 'silver_member',
  participant_5: 'bronze_member',
  participant_4: 'bronze_member',
  participant_3: 'bronze_member',
  participant_2: 'bronze_member',
  participant_1: 'bronze_member'
};

function ensureSupremeOwnersInStore() {
  for (const u of store.usersById.values()) {
    if (isSupremeOwnerEmail(u.email)) {
      enforceSupremeOwnerUser(u);
    } else if (u.role === 'site_owner') {
      u.role = 'co_owner';
      enqueueSet('users', String(u.id), { role: 'co_owner' }, true);
      const senderKey = `user:${u.id}`;
      for (const m of store.messagesById.values()) {
        if (m.sender_key === senderKey && m.sender_role === 'site_owner') {
          m.sender_role = 'co_owner';
          enqueueSet('messages', String(m.doc_id || m.id), { sender_role: 'co_owner' }, true);
        }
      }
    }
  }
}

const DEFAULT_RANKS = [
  {
    key: 'site_owner',
    label: 'مالك',
    icon: '👑',
    badge_style: 'crown_royal',
    image_url: '',
    bg_color: '#b91c1c',
    text_color: '#fef3c7',
    power: 15,
    tier_order: 15,
    is_system: 1,
    max_assignable_rank: 15,
    ...makeRankPerms(['*'])
  },
  {
    key: 'co_owner',
    label: 'صاحب موقع',
    icon: '🛡️',
    badge_style: 'gold_eagle',
    image_url: '',
    bg_color: '#dc2626',
    text_color: '#ffffff',
    power: 14,
    tier_order: 14,
    is_system: 1,
    max_assignable_rank: 13,
    ...makeRankPerms(['*'])
  },
  {
    key: 'general_admin',
    label: 'إداري عام',
    icon: '🎖️',
    badge_style: 'royal_shield',
    image_url: '',
    bg_color: '#9333ea',
    text_color: '#ffffff',
    power: 13,
    tier_order: 13,
    is_system: 1,
    max_assignable_rank: 12,
    ...makeRankPerms([
      'pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune',
      'delete_msg', 'mute', 'kick', 'ban', 'manage_rooms', 'set_rank',
      'clear_room', 'access_panel', 'room_owner', 'publish_news', 'send_links'
    ])
  },
  {
    key: 'super_owner',
    label: 'سوبر أونر',
    icon: '⚜️',
    badge_style: 'diamond_medal',
    image_url: '',
    bg_color: '#d97706',
    text_color: '#fffbeb',
    power: 12,
    tier_order: 12,
    is_system: 1,
    max_assignable_rank: 11,
    ...makeRankPerms([
      'pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune',
      'delete_msg', 'mute', 'kick', 'ban', 'manage_rooms', 'set_rank',
      'clear_room', 'access_panel', 'room_owner', 'send_links'
    ])
  },
  {
    key: 'owner',
    label: 'أونر',
    icon: '⭐',
    badge_style: 'gold_crown',
    image_url: '',
    bg_color: '#f59e0b',
    text_color: '#1f1300',
    power: 11,
    tier_order: 11,
    is_system: 1,
    max_assignable_rank: 10,
    ...makeRankPerms([
      'pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune',
      'delete_msg', 'mute', 'kick', 'ban', 'manage_rooms', 'set_rank',
      'clear_room', 'access_panel', 'room_owner', 'send_links'
    ])
  },
  {
    key: 'super_admin',
    label: 'سوبر أدمن',
    icon: '🛡️',
    badge_style: 'silver_shield',
    image_url: '',
    bg_color: '#2563eb',
    text_color: '#ffffff',
    power: 10,
    tier_order: 10,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms([
      'pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune',
      'delete_msg', 'mute', 'kick', 'ban', 'clear_room', 'access_panel', 'send_links'
    ])
  },
  {
    key: 'admin',
    label: 'أدمن',
    icon: '🔰',
    badge_style: 'royal_shield',
    image_url: '',
    bg_color: '#0284c7',
    text_color: '#ffffff',
    power: 9,
    tier_order: 9,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms([
      'pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune',
      'delete_msg', 'mute', 'kick', 'clear_room', 'access_panel'
    ])
  },
  {
    key: 'premium',
    label: 'بريميوم',
    icon: '💎',
    badge_style: 'diamond_gem',
    image_url: '',
    bg_color: '#7c3aed',
    text_color: '#ffffff',
    power: 8,
    tier_order: 8,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune', 'send_links'])
  },
  {
    key: 'royal_vip',
    label: 'VIP',
    icon: '🏆',
    badge_style: 'vip_wings',
    image_url: '',
    bg_color: '#eab308',
    text_color: '#1c1917',
    power: 7,
    tier_order: 7,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons', 'immune'])
  },
  {
    key: 'royal_member',
    label: 'عضو ملكي',
    icon: '👑',
    badge_style: 'silver_crown',
    image_url: '',
    bg_color: '#db2777',
    text_color: '#ffffff',
    power: 6,
    tier_order: 6,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'])
  },
  {
    key: 'gold_member',
    label: 'عضو ذهبي',
    icon: '🥇',
    badge_style: 'gold_star',
    image_url: '',
    bg_color: '#ca8a04',
    text_color: '#ffffff',
    power: 5,
    tier_order: 5,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'])
  },
  {
    key: 'silver_member',
    label: 'عضو فضي',
    icon: '🥈',
    badge_style: 'silver_wing',
    image_url: '',
    bg_color: '#64748b',
    text_color: '#ffffff',
    power: 4,
    tier_order: 4,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'])
  },
  {
    key: 'bronze_member',
    label: 'عضو برونزي',
    icon: '🥉',
    badge_style: 'gold_star',
    image_url: '',
    bg_color: '#b45309',
    text_color: '#ffffff',
    power: 3,
    tier_order: 3,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'])
  },
  {
    key: 'member',
    label: 'عضو',
    icon: '',
    badge_style: 'royal_shield',
    image_url: '',
    bg_color: '#0f766e',
    text_color: '#ffffff',
    power: 2,
    tier_order: 2,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms(['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'])
  },
  {
    key: 'guest',
    label: 'زائر',
    icon: '👤',
    badge_style: 'neon_badge',
    image_url: '',
    bg_color: '#475569',
    text_color: '#ffffff',
    power: 1,
    tier_order: 1,
    is_system: 1,
    max_assignable_rank: 0,
    ...makeRankPerms([])
  }
];

const DEFAULT_SITE_SETTINGS = {
  id: 1,
  site_name: 'شات عربي الاصيل',
  site_description: 'دردشة عربية فورية • مايكات صوتية • رتب وإطارات ملكية',
  site_logo: '',
  welcome_message: '',
  owner_join_message: '',
  maintenance_mode: 0,
  top_bar_color: '#18181b',
  bottom_bar_color: '#18181b',
  button_color: '#18181b',
  font_family: 'Cairo',
  font_size: 14,
  custom_css: '',
  custom_html: '',
  lock_guest_images: 0,
  block_vpn: 0,
  banned_words: [],
  antiflood_enabled: 1,
  antiflood_max_msgs: 5,
  antiflood_window_sec: 6,
  antiflood_mute_mins: 5,
  banned_word_mute_mins: 10,
  online_boost: 0,
  lucky_box_enabled: 1,
  lucky_box_min: 50,
  lucky_box_max: 500,
  referral_bonus: 200,
  quiz_bot_enabled: 1,
  quiz_interval_sec: 25,
  quiz_hint_sec: 12,
  quiz_reward_coins: 100,
  quiz_msg_style: 'royal_gold',
  quiz_custom_questions: [],
  fx_owner_galaxy_identity: 1,
  fx_glass_bubbles: 1,
  fx_mic_waves: 1,
  fx_cinematic_entrance: 1,
  fx_typing_avatars: 1,
  fx_night_atmosphere: 'always_on',
  guest_can_chat: 1,
  min_rank_pm: 'member',
  min_rank_chat_media: 'member',
  min_rank_mic: 'guest',
  min_rank_avatar: 'member',
  min_rank_cover: 'member',
  min_rank_bg_effect: 'member',
  min_rank_music: 'member',
  min_rank_name_style: 'member',
  min_rank_msg_style: 'member',
  feat_mics: 1,
  feat_pm: 1,
  feat_store: 1,
  feat_gifts: 1,
  feat_youtube: 1,
  feat_wall: 1,
  royal_member_ruby_multiplier: 1.2,
  vip_ruby_multiplier: 1.5,
  premium_ruby_multiplier: 2,
  rank_price_royal_member: 250,
  rank_price_royal_vip: 600,
  rank_price_premium: 1200,
  frame_price_overrides: {},
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
  guestsByKey: new Map(),
  ranksByKey: new Map(),
  siteSettings: { ...DEFAULT_SITE_SETTINGS },
  roomsById: new Map(),
  roomStaffByKey: new Map(),
  messagesById: new Map(),
  mutesByKey: new Map(),
  bansByKey: new Map(),
  customEmojisById: new Map(),
  customFramesById: new Map(),
  privateMessagesById: new Map(),
  friendshipsByKey: new Map(),
  wallPostsById: new Map(),
  newsById: new Map(),
  giftsById: new Map(),
  reportsById: new Map(),
  adminLogsById: new Map(),
  pmLinkAlertsById: new Map(),
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
    admin_logs: 0,
    pm_link_alerts: 0,
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
  const allowStealth =
    role === 'site_owner' || role === 'co_owner' || isSupremeOwnerEmail(email) || hasPermission(role, 'stealth');
  const avatarFrame = String(data.avatar_frame || 'none');
  const rawMeta = data.owned_frames_meta && typeof data.owned_frames_meta === 'object' ? data.owned_frames_meta : {};
  const ownedFramesMeta = {};
  const nowTs = Date.now();
  for (const [fId, meta] of Object.entries(rawMeta)) {
    if (!meta || typeof meta !== 'object') continue;
    const exp = meta.expiresAt ? Number(meta.expiresAt) : null;
    if (exp && exp <= nowTs) continue;
    ownedFramesMeta[String(fId)] = {
      durationType: meta.durationType === 'monthly' ? 'monthly' : 'permanent',
      expiresAt: exp || null,
      grantedAt: Number(meta.grantedAt) || nowTs,
      source: String(meta.source || 'buy')
    };
  }
  const rawOwned = Array.isArray(data.owned_frames) ? data.owned_frames.map((x) => String(x)) : [];
  const ownedFrames = rawOwned.filter((fId) => {
    const m = rawMeta[fId];
    return !(m && m.expiresAt && Number(m.expiresAt) <= nowTs);
  });
  const effectiveFrame =
    avatarFrame && avatarFrame !== 'none' && rawMeta[avatarFrame]?.expiresAt && Number(rawMeta[avatarFrame].expiresAt) <= nowTs
      ? 'none'
      : avatarFrame;
  if (effectiveFrame && effectiveFrame !== 'none' && !ownedFrames.includes(effectiveFrame)) {
    ownedFrames.push(effectiveFrame);
  }
  return {
    id: numId,
    username: String(data.username || ''),
    email,
    password_hash: String(data.password_hash || ''),
    role,
    display_name: String(data.display_name || ''),
    name_color: String(data.name_color || '#f8fafc'),
    text_color: String(data.text_color || '#e2e8f0'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Cairo'),
    font_style: String(data.font_style || 'Normal'),
    font_size: Math.max(13, Math.min(17, Number(data.font_size) || 14)),
    name_font_size: Math.max(13, Math.min(18, Number(data.name_font_size) || 14)),
    name_style_mode: ['solid', 'gradient', 'glow'].includes(String(data.name_style_mode)) ? String(data.name_style_mode) : 'solid',
    name_gradient: String(data.name_gradient || 'gold_royal'),
    avatar_url: String(data.avatar_url || ''),
    cover_url: String(data.cover_url || ''),
    avatar_frame: effectiveFrame,
    owned_frames: ownedFrames,
    owned_frames_meta: ownedFramesMeta,
    nameplate_style: String(data.nameplate_style || 'default'),
    name_shine: String(data.name_shine || 'none'),
    name_anim: String(data.name_anim || 'none'),
    name_anim_speed: String(data.name_anim_speed || 'normal'),
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
    coins: data.coins !== undefined ? Number(data.coins) : 0,
    vip_family: String(data.vip_family || ''),
    is_stealth: allowStealth && data.is_stealth ? 1 : 0,
    is_ghosted: !isSupremeOwnerEmail(email) && data.is_ghosted ? 1 : 0,
    is_shadow_muted: !isSupremeOwnerEmail(email) && (data.is_shadow_muted || data.is_ghosted) ? 1 : 0,
    is_frozen: !isSupremeOwnerEmail(email) && data.is_frozen ? 1 : 0,
    name_history: Array.isArray(data.name_history) ? data.name_history.slice(-30) : [],
    last_lucky_box_at: Number(data.last_lucky_box_at) || 0,
    invited_by: data.invited_by ? Number(data.invited_by) : null,
    invites_count: Number(data.invites_count) || 0,
    activity_points: Number(data.activity_points) || 0,
    quiz_points: Number(data.quiz_points) || 0,
    gifts_received: Number(data.gifts_received) || 0,
    gifts_sent: Number(data.gifts_sent) || 0,
    last_ip: String(data.last_ip || ''),
    last_device_id: String(data.last_device_id || ''),
    last_fingerprint: String(data.last_fingerprint || ''),
    last_ua: String(data.last_ua || ''),
    is_banned: data.is_banned ? 1 : 0,
    ban_reason: String(data.ban_reason || ''),
    created_at: String(data.created_at || nowIso())
  };
}

function normalizeGuestDoc(docId, data = {}) {
  const rawKey = String(data.key || docId || '').replace(/^guest_/, 'guest:');
  const key = rawKey.startsWith('guest:') ? rawKey : `guest:${rawKey}`;
  const cleanName = String(data.name || data.display_name || 'زائر').trim().slice(0, 24) || 'زائر';
  return {
    key,
    isGuest: true,
    name: cleanName,
    display_name: cleanName,
    username: cleanName,
    role: 'guest',
    name_color: String(data.name_color || '#f8fafc'),
    text_color: String(data.text_color || '#e2e8f0'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Cairo'),
    font_style: String(data.font_style || 'Normal'),
    font_size: Math.max(13, Math.min(17, Number(data.font_size) || 14)),
    name_font_size: Math.max(13, Math.min(18, Number(data.name_font_size) || 14)),
    name_style_mode: ['solid', 'gradient', 'glow'].includes(String(data.name_style_mode)) ? String(data.name_style_mode) : 'solid',
    name_gradient: String(data.name_gradient || 'gold_royal'),
    avatar_url: String(data.avatar_url || ''),
    cover_url: String(data.cover_url || ''),
    avatar_frame: String(data.avatar_frame || 'none'),
    nameplate_style: String(data.nameplate_style || 'default'),
    name_shine: String(data.name_shine || 'none'),
    name_anim: String(data.name_anim || 'none'),
    name_anim_speed: String(data.name_anim_speed || 'normal'),
    vip_wings: data.vip_wings ? 1 : 0,
    bio: String(data.bio || ''),
    country: String(data.country || ''),
    last_ip: String(data.last_ip || ''),
    last_device_id: String(data.last_device_id || ''),
    last_fingerprint: String(data.last_fingerprint || ''),
    last_ua: String(data.last_ua || ''),
    last_seen_at: String(data.last_seen_at || data.created_at || nowIso()),
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
    name_color: String(data.name_color || '#f8fafc'),
    text_color: String(data.text_color || '#e2e8f0'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Cairo'),
    font_style: String(data.font_style || 'Normal'),
    font_size: Math.max(13, Math.min(17, Number(data.font_size) || 14)),
    name_font_size: Math.max(13, Math.min(18, Number(data.name_font_size) || 14)),
    name_style_mode: ['solid', 'gradient', 'glow'].includes(String(data.name_style_mode)) ? String(data.name_style_mode) : 'solid',
    name_gradient: String(data.name_gradient || 'gold_royal'),
    avatar_url: String(data.avatar_url || ''),
    avatar_frame: String(data.avatar_frame || 'none'),
    nameplate_style: String(data.nameplate_style || 'default'),
    name_shine: String(data.name_shine || 'none'),
    name_anim: String(data.name_anim || 'none'),
    name_anim_speed: String(data.name_anim_speed || 'normal'),
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
    is_frozen: data.is_frozen ? 1 : 0,
    pinned_message: String(data.pinned_message || ''),
    pinned_by: String(data.pinned_by || ''),
    pinned_at: String(data.pinned_at || ''),
    owner_user_id: data.owner_user_id ? Number(data.owner_user_id) : null,
    owner_name: String(data.owner_name || ''),
    card_bg_color: String(data.card_bg_color || ''),
    card_text_color: String(data.card_text_color || ''),
    activity_points: Number(data.activity_points) || 0,
    youtube_video_id: String(data.youtube_video_id || ''),
    youtube_title: String(data.youtube_title || ''),
    youtube_is_playing: data.youtube_is_playing ? 1 : 0,
    youtube_mini_mode: data.youtube_mini_mode ? 1 : 0,
    youtube_by_key: String(data.youtube_by_key || ''),
    youtube_by_name: String(data.youtube_by_name || ''),
    youtube_updated_at: String(data.youtube_updated_at || ''),
    created_by: String(data.created_by || 'system'),
    created_at: String(data.created_at || nowIso())
  };
}

function normalizeRankDoc(docId, data) {
  const key = String(data.key || docId);
  const canonicalDef = DEFAULT_RANKS.find((r) => r.key === key);
  let power = Number(data.power);
  if (Number.isNaN(power)) power = canonicalDef ? canonicalDef.power : 2;
  if (key === 'site_owner') power = 15;
  else if (key === 'guest') power = 1;
  else if (canonicalDef) power = canonicalDef.power;
  else power = Math.max(1, Math.min(14, power > 15 ? Math.round((power / 100) * 14) : power));

  const fallbackPerms = (pName, defaultVal = 0) => {
    if (data[`perm_${pName}`] !== undefined) return data[`perm_${pName}`] ? 1 : 0;
    if (canonicalDef && canonicalDef[`perm_${pName}`] !== undefined) return canonicalDef[`perm_${pName}`] ? 1 : 0;
    return defaultVal;
  };

  const defaultMaxAssign =
    key === 'site_owner' ? 15 : data.perm_set_rank ? Math.max(0, Math.min(14, power - 1)) : 0;
  const defaultBadgeStyle =
    canonicalDef?.badge_style ||
    (key === 'site_owner'
      ? 'crown_royal'
      : power >= 13
        ? 'gold_eagle'
        : power >= 10
          ? 'diamond_medal'
          : power >= 7
            ? 'vip_wings'
            : power >= 3
              ? 'royal_shield'
              : 'neon_badge');

  const isOwner = key === 'site_owner';
  const permDeleteMsg = isOwner ? 1 : (data.perm_delete_msg !== undefined ? (data.perm_delete_msg ? 1 : 0) : fallbackPerms('delete_msg', data.perm_clear_room ? 1 : 0));
  const permClearRoom = isOwner ? 1 : (data.perm_clear_room !== undefined ? (data.perm_clear_room ? 1 : 0) : permDeleteMsg);

  const rawIcon =
    data.icon !== undefined
      ? String(data.icon)
      : canonicalDef && canonicalDef.icon !== undefined
        ? String(canonicalDef.icon)
        : '⭐';
  const resolvedIcon = key === 'member' && rawIcon === '⭐' ? '' : rawIcon;

  const obj = {
    key,
    label: String(data.label || canonicalDef?.label || docId),
    icon: resolvedIcon,
    badge_style: String(data.badge_style || defaultBadgeStyle),
    image_url: String(data.image_url || ''),
    bg_color: String(data.bg_color || canonicalDef?.bg_color || '#334155'),
    text_color: String(data.text_color || canonicalDef?.text_color || '#ffffff'),
    power,
    tier_order: canonicalDef ? canonicalDef.tier_order : (Number(data.tier_order) || power),
    is_system: canonicalDef ? 1 : (data.is_system ? 1 : 0),
    perm_pm: isOwner ? 1 : fallbackPerms('pm', key === 'guest' ? 0 : 1),
    perm_chat_media: isOwner ? 1 : fallbackPerms('chat_media', key === 'guest' ? 0 : 1),
    perm_mic: isOwner ? 1 : fallbackPerms('mic', key === 'guest' ? 0 : 1),
    perm_youtube: isOwner ? 1 : fallbackPerms('youtube', key === 'guest' ? 0 : 1),
    perm_wall: isOwner ? 1 : fallbackPerms('wall', key === 'guest' ? 0 : 1),
    perm_gifts: isOwner ? 1 : fallbackPerms('gifts', key === 'guest' ? 0 : 1),
    perm_use_addons: isOwner ? 1 : fallbackPerms('use_addons', key === 'guest' ? 0 : 1),
    perm_immune: isOwner ? 1 : fallbackPerms('immune', power >= 7 ? 1 : 0),
    perm_delete_msg: permDeleteMsg,
    perm_clear_room: permClearRoom,
    perm_mute: isOwner ? 1 : fallbackPerms('mute', 0),
    perm_kick: isOwner ? 1 : fallbackPerms('kick', 0),
    perm_ban: isOwner ? 1 : fallbackPerms('ban', 0),
    perm_manage_rooms: isOwner ? 1 : fallbackPerms('manage_rooms', 0),
    perm_set_rank: isOwner ? 1 : fallbackPerms('set_rank', 0),
    perm_stealth: isOwner ? 1 : fallbackPerms('stealth', key === 'co_owner' ? 1 : 0),
    perm_give_coins: isOwner ? 1 : fallbackPerms('give_coins', key === 'co_owner' ? 1 : 0),
    perm_access_panel: isOwner ? 1 : fallbackPerms('access_panel', power >= 9 ? 1 : 0),
    perm_room_owner: isOwner ? 1 : fallbackPerms('room_owner', data.perm_manage_rooms ? 1 : 0),
    perm_publish_news: isOwner ? 1 : fallbackPerms('publish_news', power >= 13 ? 1 : 0),
    perm_send_links: isOwner ? 1 : fallbackPerms('send_links', power >= 8 ? 1 : 0),
    max_assignable_rank: isOwner
      ? 15
      : data.max_assignable_rank !== undefined
        ? Math.max(0, Math.min(14, Number(data.max_assignable_rank) > 15 ? Math.max(0, power - 1) : Number(data.max_assignable_rank) || 0))
        : defaultMaxAssign,
    created_at: String(data.created_at || nowIso())
  };
  return obj;
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

  let initialGuestsReady = false;
  unsubscribers.push(
    fsListen('guests', (changes) => {
      for (const ch of changes) {
        const d = ch.data || {};
        const g = normalizeGuestDoc(ch.id, d);
        if (ch.type === 'removed') {
          store.guestsByKey.delete(g.key);
        } else {
          store.guestsByKey.set(g.key, g);
        }
      }
      if (initialGuestsReady && hooks.onUsersChanged) hooks.onUsersChanged();
      initialGuestsReady = true;
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
      let siteChanged = false;
      for (const ch of changes) {
        if (ch.id === 'site' && ch.type !== 'removed') {
          store.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...ch.data, id: 1 };
          siteChanged = true;
        } else if (ch.id === 'store_frames_catalog' && ch.type !== 'removed') {
          loadCustomFramesCatalogFromDoc(ch.data);
        }
      }
      if (initialSettingsReady && siteChanged && hooks.onSettingsChanged) hooks.onSettingsChanged(getSiteSettings());
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
    fsListen('banned_users', (changes) => {
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
    fsListen('muted_users', (changes) => {
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
        const d = ch.data || {};
        if (String(ch.id).startsWith('log_') || d.log_type === 'admin_log') {
          const lid = Number(d.id || String(ch.id).replace('log_', ''));
          if (ch.type === 'removed') store.adminLogsById.delete(lid);
          else if (lid) {
            store.adminLogsById.set(lid, { ...d, id: lid });
            store.counters.admin_logs = Math.max(store.counters.admin_logs, lid);
          }
          continue;
        }
        if (String(ch.id).startsWith('pml_') || d.log_type === 'pm_link_alert') {
          const pid = Number(d.id || String(ch.id).replace('pml_', ''));
          if (ch.type === 'removed') store.pmLinkAlertsById.delete(pid);
          else if (pid) {
            store.pmLinkAlertsById.set(pid, { ...d, id: pid });
            store.counters.pm_link_alerts = Math.max(store.counters.pm_link_alerts, pid);
          }
          continue;
        }
        const id = Number(ch.id);
        if (ch.type === 'removed') store.reportsById.delete(id);
        else if (id) {
          store.reportsById.set(id, { id, ...d });
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
        fsGetAll('guests'),
        fsGetAll('ranks'),
        fsGetAll('settings'),
        fsGetAll('rooms'),
        fsGetAll('room_staff'),
        fsGetAll('messages'),
        fsGetAll('custom_emojis'),
        fsGetAll('banned_users'),
        fsGetAll('muted_users'),
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
      guestsDocs,
      ranksDocs,
      settingsDocs,
      roomsDocs,
      roomStaffDocs,
      messagesDocs,
      emojisDocs,
      bannedUsersDocs,
      mutedUsersDocs,
      legacyBansDocs,
      legacyMutesDocs,
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

    for (const d of guestsDocs) {
      const g = normalizeGuestDoc(d.id, d.data);
      store.guestsByKey.set(g.key, g);
    }

    for (const d of ranksDocs) {
      const rk = normalizeRankDoc(d.id, d.data);
      store.ranksByKey.set(rk.key, rk);
    }

    let hasSiteSettingsDoc = false;
    let shouldMigrateSiteName = false;
    for (const d of settingsDocs) {
      if (d.id === 'site') {
        hasSiteSettingsDoc = true;
        store.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...d.data, id: 1 };
        if (!store.siteSettings.site_name || store.siteSettings.site_name === 'شات الغرف المباشر') {
          store.siteSettings.site_name = DEFAULT_SITE_SETTINGS.site_name;
          shouldMigrateSiteName = true;
        }
      } else if (d.id === 'store_frames_catalog') {
        loadCustomFramesCatalogFromDoc(d.data);
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

    for (const d of legacyBansDocs) {
      if (d.data?.target_key) {
        const tk = String(d.data.target_key);
        store.bansByKey.set(tk, d.data);
        enqueueSet('banned_users', safeDocId(tk), d.data, true);
        enqueueDelete('bans', d.id);
      }
    }
    for (const d of bannedUsersDocs) {
      if (d.data?.target_key) store.bansByKey.set(String(d.data.target_key), d.data);
    }

    const nowInitTs = Date.now();
    for (const d of legacyMutesDocs) {
      if (d.data?.target_key) {
        const mKey = `${d.data.target_key}::${d.data.room_id || '*'}`;
        if (Number(d.data.expires_at) > nowInitTs) {
          store.mutesByKey.set(mKey, d.data);
          enqueueSet('muted_users', safeDocId(mKey), d.data, true);
        }
        enqueueDelete('mutes', d.id);
      }
    }
    for (const d of mutedUsersDocs) {
      if (d.data?.target_key) {
        const mKey = `${d.data.target_key}::${d.data.room_id || '*'}`;
        if (Number(d.data.expires_at) <= nowInitTs) {
          enqueueDelete('muted_users', d.id);
        } else {
          store.mutesByKey.set(mKey, d.data);
        }
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
      const data = d.data || {};
      if (String(d.id).startsWith('log_') || data.log_type === 'admin_log') {
        const lid = Number(data.id || String(d.id).replace('log_', ''));
        if (lid) {
          store.adminLogsById.set(lid, { ...data, id: lid });
          store.counters.admin_logs = Math.max(store.counters.admin_logs, lid);
        }
        continue;
      }
      if (String(d.id).startsWith('pml_') || data.log_type === 'pm_link_alert') {
        const pid = Number(data.id || String(d.id).replace('pml_', ''));
        if (pid) {
          store.pmLinkAlertsById.set(pid, { ...data, id: pid });
          store.counters.pm_link_alerts = Math.max(store.counters.pm_link_alerts, pid);
        }
        continue;
      }
      const id = Number(d.id) || Number(data.id);
      if (id) {
        store.reportsById.set(id, { id, ...data });
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

    // Remove obsolete legacy rank keys & migrate users/messages cleanly to canonical 15-rank hierarchy (Levels 15..1)
    const legacyKeysToDelete = [];
    for (const k of [...store.ranksByKey.keys()]) {
      if (Object.prototype.hasOwnProperty.call(LEGACY_ROLE_MIGRATION_MAP, k)) {
        store.ranksByKey.delete(k);
        legacyKeysToDelete.push(k);
      }
    }
    if (legacyKeysToDelete.length > 0) {
      await fsBatchDelete('ranks', legacyKeysToDelete);
    }

    const rawRanksByKey = new Map();
    for (const d of ranksDocs) {
      if (d.data && !Object.prototype.hasOwnProperty.call(LEGACY_ROLE_MIGRATION_MAP, d.id)) {
        rawRanksByKey.set(d.id, d.data);
      }
    }

    const rankSeedBatch = [];
    const legacyDefaultsMap = {
      site_owner: ['Owner / صاحب الموقع', 'مالك الموقع', 'المالك'],
      co_owner: ['الإدارة العليا'],
      royal_vip: ['ملوك الموقع VIP', 'ملكي'],
      premium: ['عضو بريميوم', 'Premium'],
      member: ['عضو مسجل'],
      guest: ['زائر']
    };
    for (const dr of DEFAULT_RANKS) {
      const existing = store.ranksByKey.get(dr.key);
      const rawExisting = rawRanksByKey.get(dr.key);
      const legacyLabels = legacyDefaultsMap[dr.key] || [];
      const hadOldPowerScale = rawExisting && Number(rawExisting.power) !== dr.power;
      const missingNewPerms = rawExisting && rawExisting.perm_pm === undefined;
      const memberHadStar = dr.key === 'member' && existing && existing.icon === '⭐';
      if (!existing) {
        const norm = normalizeRankDoc(dr.key, dr);
        store.ranksByKey.set(norm.key, norm);
        rankSeedBatch.push({ docId: norm.key, data: norm, merge: true });
      } else if (hadOldPowerScale || missingNewPerms || memberHadStar || (legacyLabels.includes(existing.label) && existing.label !== dr.label)) {
        const nextIcon = dr.key === 'member' ? (existing.icon === '⭐' ? '' : existing.icon ?? '') : (existing.icon || dr.icon);
        const refreshed = normalizeRankDoc(dr.key, {
          ...existing,
          label: legacyLabels.includes(existing.label) ? dr.label : existing.label,
          icon: nextIcon,
          badge_style: existing.badge_style || dr.badge_style,
          bg_color: existing.bg_color || dr.bg_color,
          text_color: existing.text_color || dr.text_color,
          power: dr.power,
          tier_order: dr.tier_order,
          is_system: 1,
          max_assignable_rank: dr.key === 'site_owner' ? 15 : dr.max_assignable_rank
        });
        store.ranksByKey.set(refreshed.key, refreshed);
        rankSeedBatch.push({ docId: refreshed.key, data: refreshed, merge: true });
      }
    }
    if (rankSeedBatch.length > 0) {
      await fsBatchSet('ranks', rankSeedBatch);
    }

    // Migrate any user holding legacy rank key without altering coins, points, or profile
    const migratedUsersBatch = [];
    for (const u of store.usersById.values()) {
      let targetRole = u.role;
      if (isSupremeOwnerEmail(u.email)) {
        targetRole = 'site_owner';
      } else if (targetRole === 'site_owner') {
        targetRole = 'co_owner';
      } else if (LEGACY_ROLE_MIGRATION_MAP[targetRole]) {
        targetRole = LEGACY_ROLE_MIGRATION_MAP[targetRole];
      } else if (!store.ranksByKey.has(targetRole) || targetRole === 'guest') {
        targetRole = 'member';
      }
      if (targetRole !== u.role) {
        u.role = targetRole;
        migratedUsersBatch.push({ docId: String(u.id), data: { role: targetRole }, merge: true });
      }
    }
    if (migratedUsersBatch.length > 0) {
      await fsBatchSet('users', migratedUsersBatch);
    }
    for (const m of store.messagesById.values()) {
      const mr = m.sender_role;
      if (LEGACY_ROLE_MIGRATION_MAP[mr]) {
        m.sender_role = LEGACY_ROLE_MIGRATION_MAP[mr];
        enqueueSet('messages', String(m.doc_id || m.id), { sender_role: m.sender_role }, true);
      }
    }

    if (!hasSiteSettingsDoc) {
      await fsSetDoc('settings', 'site', store.siteSettings, true);
    } else if (shouldMigrateSiteName) {
      await fsSetDoc('settings', 'site', { site_name: store.siteSettings.site_name }, true);
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
      guests: store.guestsByKey.size,
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
  const power = Math.max(1, Math.min(15, Number(row.power) || 1));
  const isOwner = row.key === 'site_owner';
  const permissions = {};
  for (const p of ALL_RANK_PERMISSIONS) {
    permissions[p] = isOwner || row[`perm_${p}`] === 1;
  }
  if (permissions.delete_msg || permissions.clear_room) {
    permissions.delete_msg = Boolean(permissions.delete_msg);
    permissions.clear_room = Boolean(permissions.clear_room);
  }
  return {
    key: row.key,
    label: row.label,
    icon:
      row.icon !== undefined
        ? row.key === 'member' && row.icon === '⭐'
          ? ''
          : String(row.icon)
        : row.key === 'member'
          ? ''
          : '⭐',
    badge_style: row.badge_style || 'royal_shield',
    image_url: row.image_url || '',
    bg_color: row.bg_color || '#334155',
    text_color: row.text_color || '#ffffff',
    power,
    tier_order: Number(row.tier_order) || power,
    is_system: row.is_system === 1,
    max_assignable_rank: isOwner
      ? 15
      : row.max_assignable_rank !== undefined
        ? Math.max(0, Math.min(14, Number(row.max_assignable_rank) || 0))
        : row.perm_set_rank === 1
          ? Math.max(0, power - 1)
          : 0,
    permissions
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
  return row ? Math.max(1, Math.min(15, Number(row.power) || 1)) : 1;
}

function getMaxAssignablePower(role) {
  if (role === 'site_owner') return 15;
  const row = store.ranksByKey.get(role);
  if (!row || row.perm_set_rank !== 1) return -1;
  const ownPower = Math.max(1, Math.min(15, Number(row.power) || 1));
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

const VALID_PERM_COLUMNS = Object.fromEntries(ALL_RANK_PERMISSIONS.map((p) => [p, `perm_${p}`]));

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

function sanitizeRankImageUrl(rawUrl) {
  const val = String(rawUrl || '').trim();
  if (!val) return '';
  if (val.startsWith('data:image/')) {
    return val.slice(0, 65000);
  }
  return val.slice(0, 500);
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

  const clampedPower = Math.max(1, Math.min(14, Number(power) || 2));
  const rawMaxAssign =
    maxAssignableRank !== undefined ? Number(maxAssignableRank) || 0 : permissions.set_rank ? Math.max(0, clampedPower - 1) : 0;

  const permFields = {};
  for (const p of ALL_RANK_PERMISSIONS) {
    if (p === 'clear_room') {
      permFields.perm_clear_room = permissions.clear_room !== undefined ? (permissions.clear_room ? 1 : 0) : (permissions.delete_msg ? 1 : 0);
    } else if (p === 'delete_msg') {
      permFields.perm_delete_msg = permissions.delete_msg !== undefined ? (permissions.delete_msg ? 1 : 0) : (permissions.clear_room ? 1 : 0);
    } else {
      permFields[`perm_${p}`] = permissions[p] ? 1 : 0;
    }
  }

  const docObj = {
    key: safeKey,
    label: cleanLabel,
    icon: String(icon || '⭐').trim().slice(0, 8) || '⭐',
    badge_style: String(badgeStyle || 'royal_shield').trim().slice(0, 40) || 'royal_shield',
    image_url: sanitizeRankImageUrl(imageUrl),
    bg_color: sanitizeHexColor(bgColor, '#334155'),
    text_color: sanitizeHexColor(textColor, '#ffffff'),
    power: clampedPower,
    tier_order: clampedPower,
    is_system: 0,
    ...permFields,
    max_assignable_rank: Math.max(0, Math.min(14, rawMaxAssign)),
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
  const nextImg = imageUrl !== undefined ? sanitizeRankImageUrl(imageUrl) : existing.image_url;
  const nextBg = bgColor !== undefined ? sanitizeHexColor(bgColor, existing.bg_color) : existing.bg_color;
  const nextText = textColor !== undefined ? sanitizeHexColor(textColor, existing.text_color) : existing.text_color;

  let nextPower = existing.power;
  if (key === 'site_owner') {
    nextPower = 15;
  } else if (key === 'guest') {
    nextPower = 1;
  } else if (power !== undefined) {
    nextPower = Math.max(1, Math.min(14, Number(power) || existing.power));
  }

  const p = permissions || {};
  const isOwner = key === 'site_owner';
  const nextMaxAssign = isOwner
    ? 15
    : maxAssignableRank !== undefined
      ? Math.max(0, Math.min(14, Number(maxAssignableRank) || 0))
      : existing.max_assignable_rank !== undefined
        ? Math.min(14, Number(existing.max_assignable_rank) || 0)
        : Math.max(0, nextPower - 1);

  const permPatch = {};
  for (const permName of ALL_RANK_PERMISSIONS) {
    const col = `perm_${permName}`;
    if (isOwner) {
      permPatch[col] = 1;
    } else if (p[permName] !== undefined) {
      permPatch[col] = p[permName] ? 1 : 0;
    } else if (permName === 'clear_room' && p.delete_msg !== undefined) {
      permPatch[col] = p.delete_msg ? 1 : 0;
    } else if (permName === 'delete_msg' && p.clear_room !== undefined) {
      permPatch[col] = p.clear_room ? 1 : 0;
    } else {
      permPatch[col] = existing[col] ? 1 : 0;
    }
  }

  const updated = {
    ...existing,
    label: nextLabel,
    icon: nextIcon,
    badge_style: nextBadgeStyle,
    image_url: nextImg,
    bg_color: nextBg,
    text_color: nextText,
    power: nextPower,
    ...permPatch,
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
// CUSTOM STORE FRAMES CATALOG (GIF/WebP/PNG)
// ==========================================
function loadCustomFramesCatalogFromDoc(docData) {
  store.customFramesById.clear();
  const items = Array.isArray(docData?.items) ? docData.items : [];
  for (const item of items) {
    if (!item || !item.id || !item.imageUrl) continue;
    store.customFramesById.set(String(item.id), {
      id: String(item.id),
      label: String(item.label || 'إطار مخصص').trim().slice(0, 60),
      imageUrl: String(item.imageUrl || '').trim(),
      price: Math.max(0, Number(item.price) || 0),
      durationType: item.durationType === 'monthly' ? 'monthly' : 'permanent',
      tier: 'ruby',
      isCustom: true,
      preview: String(item.preview || '#3b82f6'),
      createdBy: String(item.createdBy || ''),
      createdAt: String(item.createdAt || nowIso())
    });
  }
}

function persistCustomFramesCatalog() {
  const items = getAllCustomFrames();
  enqueueSet('settings', 'store_frames_catalog', { items, updated_at: nowIso() }, false);
}

function getAllCustomFrames() {
  return [...store.customFramesById.values()].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

function addCustomFrame({ label, imageUrl, price = 0, durationType = 'permanent', preview = '#3b82f6', createdBy = '' }) {
  const cleanLabel = String(label || '').trim().slice(0, 60);
  const cleanUrl = String(imageUrl || '').trim();
  if (cleanLabel.length < 2) return { error: 'أدخل اسم الإطار (حرفان على الأقل).' };
  if (!cleanUrl || !cleanUrl.startsWith('/uploads/frames/')) {
    return { error: 'يرجى رفع صورة الإطار (GIF / WebP / PNG) أولاً.' };
  }
  const id = `cframe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const frame = {
    id,
    label: cleanLabel,
    imageUrl: cleanUrl,
    price: Math.max(0, Math.round(Number(price) || 0)),
    durationType: durationType === 'monthly' ? 'monthly' : 'permanent',
    tier: 'ruby',
    isCustom: true,
    preview: sanitizeHexColor(preview, '#3b82f6'),
    createdBy: String(createdBy || ''),
    createdAt: nowIso()
  };
  store.customFramesById.set(id, frame);
  persistCustomFramesCatalog();
  return { frame };
}

function deleteCustomFrame(frameId) {
  const id = String(frameId || '').trim();
  if (!store.customFramesById.has(id)) return false;
  store.customFramesById.delete(id);
  persistCustomFramesCatalog();
  const affectedUserIds = [];
  for (const u of store.usersById.values()) {
    let changed = false;
    const patch = {};
    if (u.avatar_frame === id) {
      u.avatar_frame = 'none';
      patch.avatar_frame = 'none';
      changed = true;
    }
    if (Array.isArray(u.owned_frames) && u.owned_frames.includes(id)) {
      u.owned_frames = u.owned_frames.filter((x) => x !== id);
      patch.owned_frames = u.owned_frames;
      changed = true;
    }
    if (u.owned_frames_meta && u.owned_frames_meta[id]) {
      delete u.owned_frames_meta[id];
      patch.owned_frames_meta = u.owned_frames_meta;
      changed = true;
    }
    if (changed) {
      affectedUserIds.push(u.id);
      enqueueSet('users', String(u.id), patch, true);
    }
  }
  return { ok: true, affectedUserIds };
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
    owner_join_message:
      patch.owner_join_message !== undefined
        ? String(patch.owner_join_message).trim().slice(0, 220)
        : String(cur.owner_join_message || ''),
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
    lock_guest_images:
      patch.lock_guest_images !== undefined ? (patch.lock_guest_images ? 1 : 0) : cur.lock_guest_images ? 1 : 0,
    block_vpn: patch.block_vpn !== undefined ? (patch.block_vpn ? 1 : 0) : cur.block_vpn ? 1 : 0,
    banned_words:
      patch.banned_words !== undefined
        ? (Array.isArray(patch.banned_words)
            ? patch.banned_words
            : String(patch.banned_words || '').split(/[\n,،]+/)
          )
            .map((w) => String(w || '').trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 200)
        : Array.isArray(cur.banned_words)
          ? cur.banned_words
          : [],
    online_boost:
      patch.online_boost !== undefined
        ? Math.max(0, Math.min(2000, Number(patch.online_boost) || 0))
        : Number(cur.online_boost) || 0,
    lucky_box_enabled:
      patch.lucky_box_enabled !== undefined ? (patch.lucky_box_enabled ? 1 : 0) : cur.lucky_box_enabled !== 0 ? 1 : 0,
    lucky_box_min:
      patch.lucky_box_min !== undefined
        ? Math.max(10, Math.min(5000, Number(patch.lucky_box_min) || 50))
        : Number(cur.lucky_box_min) || 50,
    lucky_box_max:
      patch.lucky_box_max !== undefined
        ? Math.max(20, Math.min(10000, Number(patch.lucky_box_max) || 500))
        : Number(cur.lucky_box_max) || 500,
    referral_bonus:
      patch.referral_bonus !== undefined
        ? Math.max(0, Math.min(5000, Number(patch.referral_bonus) || 200))
        : Number(cur.referral_bonus ?? 200),
    quiz_bot_enabled:
      patch.quiz_bot_enabled !== undefined ? (patch.quiz_bot_enabled ? 1 : 0) : cur.quiz_bot_enabled !== 0 ? 1 : 0,
    quiz_interval_sec:
      patch.quiz_interval_sec !== undefined
        ? Math.max(10, Math.min(120, Number(patch.quiz_interval_sec) || 25))
        : Math.max(10, Math.min(120, Number(cur.quiz_interval_sec) || 25)),
    quiz_hint_sec:
      patch.quiz_hint_sec !== undefined
        ? Math.max(5, Math.min(90, Number(patch.quiz_hint_sec) || 12))
        : Math.max(5, Math.min(90, Number(cur.quiz_hint_sec) || 12)),
    quiz_reward_coins:
      patch.quiz_reward_coins !== undefined
        ? Math.max(10, Math.min(5000, Number(patch.quiz_reward_coins) || 100))
        : Math.max(10, Math.min(5000, Number(cur.quiz_reward_coins) || 100)),
    quiz_msg_style:
      patch.quiz_msg_style !== undefined &&
      ['royal_gold', 'cyber_blue', 'emerald_neon', 'crimson_fire'].includes(String(patch.quiz_msg_style))
        ? String(patch.quiz_msg_style)
        : ['royal_gold', 'cyber_blue', 'emerald_neon', 'crimson_fire'].includes(String(cur.quiz_msg_style))
          ? String(cur.quiz_msg_style)
          : 'royal_gold',
    quiz_custom_questions:
      patch.quiz_custom_questions !== undefined
        ? (Array.isArray(patch.quiz_custom_questions) ? patch.quiz_custom_questions : [])
            .map((item, idx) => {
              const q = String(item?.q || '').trim().slice(0, 240);
              const displayAnswer = String(item?.displayAnswer || (Array.isArray(item?.a) ? item.a[0] : '') || '').trim().slice(0, 80);
              const answers = Array.isArray(item?.a)
                ? item.a.map((s) => String(s || '').trim().slice(0, 80)).filter(Boolean)
                : String(item?.a || displayAnswer).split(/[,،|]/).map((s) => s.trim()).filter(Boolean);
              if (!q || (!displayAnswer && answers.length === 0)) return null;
              const finalAnswers = answers.length > 0 ? answers : [displayAnswer];
              return {
                id: String(item?.id || `q_${Date.now()}_${idx}`).slice(0, 50),
                category: String(item?.category || 'مخصصة').trim().slice(0, 30) || 'مخصصة',
                q,
                displayAnswer: displayAnswer || finalAnswers[0],
                a: finalAnswers.slice(0, 10)
              };
            })
            .filter(Boolean)
            .slice(0, 300)
        : Array.isArray(cur.quiz_custom_questions)
          ? cur.quiz_custom_questions
          : [],
    fx_owner_galaxy_identity:
      patch.fx_owner_galaxy_identity !== undefined
        ? (patch.fx_owner_galaxy_identity ? 1 : 0)
        : cur.fx_owner_galaxy_identity !== 0 ? 1 : 0,
    fx_glass_bubbles:
      patch.fx_glass_bubbles !== undefined
        ? (patch.fx_glass_bubbles ? 1 : 0)
        : cur.fx_glass_bubbles !== 0 ? 1 : 0,
    fx_mic_waves:
      patch.fx_mic_waves !== undefined
        ? (patch.fx_mic_waves ? 1 : 0)
        : cur.fx_mic_waves !== 0 ? 1 : 0,
    fx_cinematic_entrance:
      patch.fx_cinematic_entrance !== undefined
        ? (patch.fx_cinematic_entrance ? 1 : 0)
        : cur.fx_cinematic_entrance !== 0 ? 1 : 0,
    fx_typing_avatars:
      patch.fx_typing_avatars !== undefined
        ? (patch.fx_typing_avatars ? 1 : 0)
        : cur.fx_typing_avatars !== 0 ? 1 : 0,
    fx_night_atmosphere:
      patch.fx_night_atmosphere !== undefined && ['always_on', 'auto', 'off'].includes(String(patch.fx_night_atmosphere))
        ? String(patch.fx_night_atmosphere)
        : ['always_on', 'auto', 'off'].includes(String(cur.fx_night_atmosphere))
          ? String(cur.fx_night_atmosphere)
          : 'always_on',
    guest_can_chat:
      patch.guest_can_chat !== undefined ? (patch.guest_can_chat ? 1 : 0) : cur.guest_can_chat !== 0 ? 1 : 0,
    min_rank_pm:
      patch.min_rank_pm !== undefined ? String(patch.min_rank_pm || 'member').slice(0, 36) : cur.min_rank_pm || 'member',
    min_rank_chat_media:
      patch.min_rank_chat_media !== undefined
        ? String(patch.min_rank_chat_media || 'member').slice(0, 36)
        : cur.min_rank_chat_media || 'member',
    min_rank_mic:
      patch.min_rank_mic !== undefined ? String(patch.min_rank_mic || 'guest').slice(0, 36) : cur.min_rank_mic || 'guest',
    min_rank_avatar:
      patch.min_rank_avatar !== undefined
        ? String(patch.min_rank_avatar || 'member').slice(0, 36)
        : cur.min_rank_avatar || 'member',
    min_rank_cover:
      patch.min_rank_cover !== undefined
        ? String(patch.min_rank_cover || 'member').slice(0, 36)
        : cur.min_rank_cover || 'member',
    min_rank_bg_effect:
      patch.min_rank_bg_effect !== undefined
        ? String(patch.min_rank_bg_effect || 'member').slice(0, 36)
        : cur.min_rank_bg_effect || 'member',
    min_rank_music:
      patch.min_rank_music !== undefined
        ? String(patch.min_rank_music || 'member').slice(0, 36)
        : cur.min_rank_music || 'member',
    min_rank_name_style:
      patch.min_rank_name_style !== undefined
        ? String(patch.min_rank_name_style || 'member').slice(0, 36)
        : cur.min_rank_name_style || 'member',
    min_rank_msg_style:
      patch.min_rank_msg_style !== undefined
        ? String(patch.min_rank_msg_style || 'member').slice(0, 36)
        : cur.min_rank_msg_style || 'member',
    feat_mics: patch.feat_mics !== undefined ? (patch.feat_mics ? 1 : 0) : cur.feat_mics !== 0 ? 1 : 0,
    feat_pm: patch.feat_pm !== undefined ? (patch.feat_pm ? 1 : 0) : cur.feat_pm !== 0 ? 1 : 0,
    feat_store: patch.feat_store !== undefined ? (patch.feat_store ? 1 : 0) : cur.feat_store !== 0 ? 1 : 0,
    feat_gifts: patch.feat_gifts !== undefined ? (patch.feat_gifts ? 1 : 0) : cur.feat_gifts !== 0 ? 1 : 0,
    feat_youtube: patch.feat_youtube !== undefined ? (patch.feat_youtube ? 1 : 0) : cur.feat_youtube !== 0 ? 1 : 0,
    feat_wall: patch.feat_wall !== undefined ? (patch.feat_wall ? 1 : 0) : cur.feat_wall !== 0 ? 1 : 0,
    antiflood_enabled:
      patch.antiflood_enabled !== undefined ? (patch.antiflood_enabled ? 1 : 0) : cur.antiflood_enabled !== 0 ? 1 : 0,
    antiflood_max_msgs:
      patch.antiflood_max_msgs !== undefined
        ? Math.max(2, Math.min(30, Number(patch.antiflood_max_msgs) || 5))
        : Number(cur.antiflood_max_msgs) || 5,
    antiflood_window_sec:
      patch.antiflood_window_sec !== undefined
        ? Math.max(2, Math.min(60, Number(patch.antiflood_window_sec) || 6))
        : Number(cur.antiflood_window_sec) || 6,
    antiflood_mute_mins:
      patch.antiflood_mute_mins !== undefined
        ? Math.max(1, Math.min(1440, Number(patch.antiflood_mute_mins) || 5))
        : Number(cur.antiflood_mute_mins) || 5,
    banned_word_mute_mins:
      patch.banned_word_mute_mins !== undefined
        ? Math.max(1, Math.min(1440, Number(patch.banned_word_mute_mins) || 10))
        : Number(cur.banned_word_mute_mins) || 10,
    royal_member_ruby_multiplier:
      patch.royal_member_ruby_multiplier !== undefined
        ? Math.max(1, Math.min(10, Number(patch.royal_member_ruby_multiplier) || 1.2))
        : Number(cur.royal_member_ruby_multiplier) || 1.2,
    vip_ruby_multiplier:
      patch.vip_ruby_multiplier !== undefined
        ? Math.max(1, Math.min(10, Number(patch.vip_ruby_multiplier) || 1.5))
        : Number(cur.vip_ruby_multiplier) || 1.5,
    premium_ruby_multiplier:
      patch.premium_ruby_multiplier !== undefined
        ? Math.max(1, Math.min(10, Number(patch.premium_ruby_multiplier) || 2))
        : Number(cur.premium_ruby_multiplier) || 2,
    rank_price_royal_member:
      patch.rank_price_royal_member !== undefined
        ? Math.max(0, Math.min(1000000, Number(patch.rank_price_royal_member) || 0))
        : Number(cur.rank_price_royal_member ?? 250),
    rank_price_royal_vip:
      patch.rank_price_royal_vip !== undefined
        ? Math.max(0, Math.min(1000000, Number(patch.rank_price_royal_vip) || 0))
        : Number(cur.rank_price_royal_vip ?? 600),
    rank_price_premium:
      patch.rank_price_premium !== undefined
        ? Math.max(0, Math.min(1000000, Number(patch.rank_price_premium) || 0))
        : Number(cur.rank_price_premium ?? 1200),
    frame_price_overrides:
      patch.frame_price_overrides && typeof patch.frame_price_overrides === 'object' && !Array.isArray(patch.frame_price_overrides)
        ? Object.fromEntries(
            Object.entries(patch.frame_price_overrides).map(([k, v]) => [String(k).slice(0, 40), Math.max(0, Math.min(1000000, Number(v) || 0))])
          )
        : cur.frame_price_overrides && typeof cur.frame_price_overrides === 'object'
          ? cur.frame_price_overrides
          : {},
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

function registerUser({ username, email, passwordHash, ipAddress, deviceId, fingerprint = '', userAgent = '', country = '' }) {
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
    name_color: '#f8fafc',
    text_color: '#e2e8f0',
    name_bg_color: '',
    neon_color: '',
    font_family: 'Cairo',
    font_style: 'Normal',
    font_size: 14,
    name_font_size: 14,
    name_style_mode: 'solid',
    name_gradient: 'gold_royal',
    avatar_url: '',
    cover_url: '',
    avatar_frame: role === 'site_owner' ? 'owner_sovereign' : 'none',
    owned_frames: role === 'site_owner' ? ['owner_sovereign'] : [],
    owned_frames_meta: {},
    nameplate_style: role === 'site_owner' ? 'crimson_royal' : 'default',
    name_shine: 'none',
    name_anim: 'none',
    name_anim_speed: 'normal',
    profile_bg_effect: role === 'site_owner' ? 'aurora_glow' : 'none',
    vip_wings: role === 'site_owner' ? 1 : 0,
    profile_music: '',
    bio: '',
    age: '',
    gender: '',
    country: String(country || '').trim().slice(0, 36),
    allow_calls: 1,
    allow_pm: 1,
    likes_count: 0,
    rating_sum: 0,
    rating_count: 0,
    coins: role === 'site_owner' ? 99999 : 0,
    vip_family: '',
    is_stealth: 0,
    is_ghosted: 0,
    activity_points: 0,
    quiz_points: 0,
    gifts_received: 0,
    gifts_sent: 0,
    last_ip: ipAddress || '',
    last_device_id: deviceId || '',
    last_fingerprint: String(fingerprint || '').trim().slice(0, 128),
    last_ua: String(userAgent || '').trim().slice(0, 200),
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

function updateUserIp(userId, ipAddress, deviceId = '', extra = {}) {
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
  const fp = String(extra?.fingerprint || '').trim().slice(0, 128);
  if (fp && u.last_fingerprint !== fp) {
    u.last_fingerprint = fp;
    patch.last_fingerprint = fp;
  }
  const ua = String(extra?.userAgent || '').trim().slice(0, 200);
  if (ua && u.last_ua !== ua) {
    u.last_ua = ua;
    patch.last_ua = ua;
  }
  const ctry = String(extra?.country || '').trim().slice(0, 36);
  if (ctry && !u.country) {
    u.country = ctry;
    patch.country = ctry;
  }
  if (Object.keys(patch).length > 0) {
    enqueueSet('users', String(u.id), patch, true);
  }
}

function setUserStealth(userId, enabled) {
  const u = store.usersById.get(Number(userId));
  if (!u) return null;
  if (u.role !== 'site_owner' && !isSupremeOwnerEmail(u.email) && !hasPermission(u.role, 'stealth')) {
    return { error: 'وضع التخفي غير مفعل لرتبتك الحالية.' };
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
  u.is_shadow_muted = enabled ? 1 : 0;
  enqueueSet('users', String(u.id), { is_ghosted: u.is_ghosted, is_shadow_muted: u.is_shadow_muted }, true);
  return { user: { ...u } };
}

function setUserShadowMuted(userId, enabled) {
  const u = store.usersById.get(Number(userId));
  if (!u) return { error: 'العضو غير موجود.' };
  if (isSupremeOwnerEmail(u.email) || u.role === 'site_owner') {
    return { error: 'حساب صاحب الموقع محمي ولا يمكن كتمه صامتاً.' };
  }
  u.is_shadow_muted = enabled ? 1 : 0;
  u.is_ghosted = enabled ? 1 : 0;
  enqueueSet('users', String(u.id), { is_shadow_muted: u.is_shadow_muted, is_ghosted: u.is_ghosted }, true);
  return { user: { ...u } };
}

function setUserFrozen(userId, enabled) {
  const u = store.usersById.get(Number(userId));
  if (!u) return { error: 'العضو غير موجود.' };
  if (isSupremeOwnerEmail(u.email) || u.role === 'site_owner') {
    return { error: 'حساب صاحب الموقع محمي ولا يمكن تجميده.' };
  }
  u.is_frozen = enabled ? 1 : 0;
  enqueueSet('users', String(u.id), { is_frozen: u.is_frozen }, true);
  return { user: { ...u } };
}

function claimLuckyBox(userId) {
  const u = store.usersById.get(Number(userId));
  if (!u) return { error: 'الحساب غير موجود.' };
  const s = getSiteSettings();
  if (s.lucky_box_enabled === 0) return { error: 'صندوق الحظ مغلق حالياً من المالك.' };
  const now = Date.now();
  const last = Number(u.last_lucky_box_at) || 0;
  const cooldownMs = 24 * 60 * 60 * 1000;
  if (now - last < cooldownMs) {
    const hrsLeft = Math.max(1, Math.ceil((cooldownMs - (now - last)) / 3600000));
    return { error: `لقد فتحت صندوق الحظ اليوم! حاول بعد ${hrsLeft} ساعة.` };
  }
  const minC = Math.max(10, Number(s.lucky_box_min) || 50);
  const maxC = Math.max(minC + 10, Number(s.lucky_box_max) || 500);
  const prize = Math.floor(minC + Math.random() * (maxC - minC + 1));
  u.coins = (Number(u.coins) || 0) + prize;
  u.last_lucky_box_at = now;
  enqueueSet('users', String(u.id), { coins: u.coins, last_lucky_box_at: now }, true);
  return { prize, user: { ...u } };
}

function recordReferralInvite(inviterId, newUserId) {
  const inviter = store.usersById.get(Number(inviterId));
  const invited = store.usersById.get(Number(newUserId));
  if (!inviter || !invited || inviter.id === invited.id) return null;
  const bonus = Math.max(0, Number(getSiteSettings().referral_bonus ?? 200));
  invited.invited_by = inviter.id;
  invited.coins = (Number(invited.coins) || 0) + Math.floor(bonus / 2);
  inviter.invites_count = (Number(inviter.invites_count) || 0) + 1;
  inviter.coins = (Number(inviter.coins) || 0) + bonus;
  enqueueSet('users', String(invited.id), { invited_by: invited.invited_by, coins: invited.coins }, true);
  enqueueSet('users', String(inviter.id), { invites_count: inviter.invites_count, coins: inviter.coins }, true);
  return { inviter: { ...inviter }, invited: { ...invited }, bonus };
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
      enqueueDelete('muted_users', safeDocId(k));
      enqueueDelete('mutes', safeDocId(k));
    }
  }
  if (store.bansByKey.has(targetKey)) {
    store.bansByKey.delete(targetKey);
    enqueueDelete('banned_users', safeDocId(targetKey));
    enqueueDelete('bans', safeDocId(targetKey));
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

function incrementQuizPoints(userId, delta = 10) {
  const u = store.usersById.get(Number(userId));
  if (!u) return null;
  u.quiz_points = Math.max(0, (Number(u.quiz_points) || 0) + (Number(delta) || 0));
  enqueueSet('users', String(u.id), { quiz_points: u.quiz_points }, true);
  return { ...u };
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

  const nextDisplay = displayName !== undefined && displayName.trim() ? displayName.trim().slice(0, 28) : getEffectiveName(current);
  const curName = getEffectiveName(current);
  const nameHistory = Array.isArray(current.name_history) ? [...current.name_history] : [];
  if (nextDisplay && curName && nextDisplay !== curName) {
    nameHistory.push({ oldName: curName, newName: nextDisplay, changedBy: curName, at: nowIso() });
    if (nameHistory.length > 30) nameHistory.shift();
  }

  const updated = {
    ...current,
    display_name: nextDisplay,
    name_history: nameHistory,
    name_color: nameColor || current.name_color || '#f8fafc',
    text_color: textColor !== undefined ? textColor || '#e2e8f0' : current.text_color || '#e2e8f0',
    name_bg_color: nameBgColor !== undefined ? String(nameBgColor || '').trim().slice(0, 30) : current.name_bg_color || '',
    neon_color: neonColor !== undefined ? String(neonColor || '').trim().slice(0, 30) : current.neon_color || '',
    font_family: fontFamily !== undefined ? String(fontFamily || 'Cairo').trim().slice(0, 40) : current.font_family || 'Cairo',
    font_style: fontStyle !== undefined ? String(fontStyle || 'Normal').trim().slice(0, 30) : current.font_style || 'Normal',
    font_size: fontSize !== undefined ? Math.max(13, Math.min(17, Number(fontSize) || 14)) : Math.max(13, Math.min(17, Number(current.font_size) || 14)),
    name_font_size: nameFontSize !== undefined ? Math.max(13, Math.min(18, Number(nameFontSize) || 14)) : Math.max(13, Math.min(18, Number(current.name_font_size) || 14)),
    name_style_mode:
      nameStyleMode !== undefined && ['solid', 'gradient', 'glow'].includes(String(nameStyleMode))
        ? String(nameStyleMode)
        : ['solid', 'gradient', 'glow'].includes(String(current.name_style_mode))
          ? String(current.name_style_mode)
          : 'solid',
    name_gradient: nameGradient !== undefined ? String(nameGradient || 'gold_royal').trim().slice(0, 30) : current.name_gradient || 'gold_royal',
    avatar_url: avatarUrl !== undefined ? avatarUrl : current.avatar_url,
    cover_url: coverUrl !== undefined ? coverUrl : current.cover_url || '',
    avatar_frame:
      avatarFrame !== undefined
        ? (avatarFrame === 'owner_sovereign' && current.role !== 'site_owner' && !isSupremeOwnerEmail(current.email)
            ? current.avatar_frame || 'none'
            : avatarFrame || 'none')
        : current.avatar_frame || 'none',
    nameplate_style: nameplateStyle !== undefined ? nameplateStyle || 'default' : current.nameplate_style || 'default',
    name_shine: nameShine !== undefined ? String(nameShine || 'none').trim().slice(0, 30) : current.name_shine || 'none',
    name_anim: nameAnim !== undefined ? String(nameAnim || 'none').trim().slice(0, 30) : current.name_anim || 'none',
    name_anim_speed: nameAnimSpeed !== undefined ? String(nameAnimSpeed || 'normal').trim().slice(0, 16) : current.name_anim_speed || 'normal',
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
  const requestedRole = isValidRank(role) ? role : 'member';
  const safeRole = isSupremeOwnerEmail(cleanEmail)
    ? 'site_owner'
    : requestedRole === 'site_owner'
      ? 'co_owner'
      : requestedRole;

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
    avatar_frame: safeRole === 'site_owner' ? 'owner_sovereign' : 'none',
    owned_frames: safeRole === 'site_owner' ? ['owner_sovereign'] : [],
    owned_frames_meta: {},
    nameplate_style: safeRole === 'site_owner' ? 'crimson_royal' : 'default',
    name_shine: 'none',
    name_anim: 'none',
    name_anim_speed: 'normal',
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
    coins: safeRole === 'site_owner' ? 99999 : 0,
    vip_family: '',
    is_stealth: 0,
    is_ghosted: 0,
    activity_points: 0,
    quiz_points: 0,
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
  const nextRole = targetIsSupreme || isSupremeOwnerEmail(nextEmail)
    ? 'site_owner'
    : rawNextRole === 'site_owner'
      ? 'co_owner'
      : rawNextRole;

  for (const other of store.usersById.values()) {
    if (other.id === current.id) continue;
    if (other.username.toLowerCase() === nextUsername.toLowerCase()) {
      return { error: 'اسم المستخدم مستخدم لحساب آخر.' };
    }
    if (other.email.toLowerCase() === nextEmail.toLowerCase()) {
      return { error: 'البريد الإلكتروني مستخدم لحساب آخر.' };
    }
  }

  const curName = getEffectiveName(current);
  const nameHistory = Array.isArray(current.name_history) ? [...current.name_history] : [];
  if (nextDisplay && curName && nextDisplay !== curName) {
    nameHistory.push({ oldName: curName, newName: nextDisplay, changedBy: 'الإدارة', at: nowIso() });
    if (nameHistory.length > 30) nameHistory.shift();
  }

  const updated = {
    ...current,
    username: nextUsername,
    display_name: nextDisplay,
    name_history: nameHistory,
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

function adjustUserRubyAndActivity(userId, { rubyDelta = 0, activityDelta = 0 } = {}) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  const rDelta = Number(rubyDelta) || 0;
  const aDelta = Number(activityDelta) || 0;
  current.coins = Math.max(0, (Number(current.coins) || 0) + rDelta);
  current.activity_points = Math.max(0, (Number(current.activity_points) || 0) + aDelta);
  enqueueSet(
    'users',
    String(current.id),
    { coins: current.coins, activity_points: current.activity_points },
    true
  );
  return { ...current };
}

function getValidOwnedFramesData(userRow) {
  if (!userRow) return { ownedFrames: [], ownedFramesMeta: {}, activeFrame: 'none' };
  const nowTs = Date.now();
  const rawMeta = userRow.owned_frames_meta && typeof userRow.owned_frames_meta === 'object' ? userRow.owned_frames_meta : {};
  const validMeta = {};
  for (const [fId, m] of Object.entries(rawMeta)) {
    if (!m || typeof m !== 'object') continue;
    const exp = m.expiresAt ? Number(m.expiresAt) : null;
    if (exp && exp <= nowTs) continue;
    validMeta[fId] = {
      durationType: m.durationType === 'monthly' ? 'monthly' : 'permanent',
      expiresAt: exp || null,
      grantedAt: Number(m.grantedAt) || nowTs,
      source: String(m.source || 'buy')
    };
  }
  const rawOwned = Array.isArray(userRow.owned_frames) ? userRow.owned_frames.map(String) : [];
  const validOwned = rawOwned.filter((fId) => {
    const m = rawMeta[fId];
    return !(m && m.expiresAt && Number(m.expiresAt) <= nowTs);
  });
  let activeFrame = userRow.avatar_frame || 'none';
  if (activeFrame !== 'none' && rawMeta[activeFrame]?.expiresAt && Number(rawMeta[activeFrame].expiresAt) <= nowTs) {
    activeFrame = 'none';
  }
  return { ownedFrames: validOwned, ownedFramesMeta: validMeta, activeFrame };
}

function isFrameOwnedAndValid(userRow, frameId) {
  if (!userRow) return false;
  if (userRow.role === 'site_owner' || frameId === 'none') return true;
  const { ownedFrames, activeFrame } = getValidOwnedFramesData(userRow);
  return ownedFrames.includes(frameId) || activeFrame === frameId;
}

function purchaseFrameWithRuby(userId, frameId, price = 0, durationType = 'permanent') {
  const current = store.usersById.get(Number(userId));
  if (!current) return { error: 'الحساب غير موجود.' };
  const { ownedFrames, ownedFramesMeta } = getValidOwnedFramesData(current);
  const owned = [...ownedFrames];
  const meta = { ...ownedFramesMeta };
  const cost = Math.max(0, Number(price) || 0);
  const alreadyOwned = owned.includes(frameId) || frameId === 'none' || current.role === 'site_owner';
  if (!alreadyOwned && cost > 0) {
    if ((Number(current.coins) || 0) < cost) {
      return { error: `رصيد الروبي غير كافٍ (${Number(current.coins) || 0} / ${cost} روبي).` };
    }
    current.coins = (Number(current.coins) || 0) - cost;
  }
  if (frameId && frameId !== 'none') {
    if (!owned.includes(frameId)) owned.push(frameId);
    if (!alreadyOwned || !meta[frameId]) {
      const dur = durationType === 'monthly' ? 'monthly' : 'permanent';
      meta[frameId] = {
        durationType: dur,
        expiresAt: dur === 'monthly' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
        grantedAt: Date.now(),
        source: 'buy'
      };
    }
  }
  current.owned_frames = owned;
  current.owned_frames_meta = meta;
  current.avatar_frame = frameId || 'none';
  enqueueSet(
    'users',
    String(current.id),
    { coins: current.coins, owned_frames: owned, owned_frames_meta: meta, avatar_frame: current.avatar_frame },
    true
  );
  return { user: { ...current }, alreadyOwned };
}

function grantFrameToUser(userId, frameId, { durationType = 'permanent', grantedBy = '' } = {}) {
  const current = store.usersById.get(Number(userId));
  if (!current) return { error: 'العضو غير موجود.' };
  if (!frameId || frameId === 'none') return { error: 'اختر إطاراً صحيحاً للمنح.' };
  const { ownedFrames, ownedFramesMeta } = getValidOwnedFramesData(current);
  const owned = [...ownedFrames];
  if (!owned.includes(frameId)) owned.push(frameId);
  const dur = durationType === 'monthly' ? 'monthly' : 'permanent';
  const meta = {
    ...ownedFramesMeta,
    [frameId]: {
      durationType: dur,
      expiresAt: dur === 'monthly' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
      grantedAt: Date.now(),
      source: 'grant',
      grantedBy: String(grantedBy || '')
    }
  };
  current.owned_frames = owned;
  current.owned_frames_meta = meta;
  current.avatar_frame = frameId;
  enqueueSet(
    'users',
    String(current.id),
    { owned_frames: owned, owned_frames_meta: meta, avatar_frame: current.avatar_frame },
    true
  );
  return { user: { ...current } };
}

function getRubyMultiplierForRole(role) {
  const settings = getSiteSettings();
  if (role === 'site_owner' || role === 'premium') {
    return Math.max(1, Number(settings.premium_ruby_multiplier) || 2);
  }
  if (role === 'royal_vip' || role === 'vip') {
    return Math.max(1, Number(settings.vip_ruby_multiplier) || 1.5);
  }
  if (role === 'royal_member') {
    return Math.max(1, Number(settings.royal_member_ruby_multiplier) || 1.2);
  }
  return 1;
}

function checkAndApplyAutoPromotion(userId) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  if (isSupremeOwnerEmail(current.email) || current.role === 'site_owner') return null;
  const curPower = getRankPower(current.role);
  if (curPower > 5) return null;

  const pts = Number(current.activity_points) || 0;
  let targetRole = null;
  if (pts >= 10000) targetRole = 'gold_member';
  else if (pts >= 5000) targetRole = 'silver_member';
  else if (pts >= 1000) targetRole = 'bronze_member';

  if (!targetRole) return null;
  const targetPower = getRankPower(targetRole);
  if (targetPower <= curPower) return null;

  const updated = updateUserRole(current.id, targetRole);
  if (!updated) return null;
  return {
    promoted: true,
    oldRole: current.role,
    newRole: targetRole,
    rank: getRankByKey(targetRole),
    user: updated
  };
}

function purchaseRankWithRuby(userId, rankKey, price = 0) {
  const current = store.usersById.get(Number(userId));
  if (!current) return { error: 'الحساب غير موجود.' };
  if (isSupremeOwnerEmail(current.email) || current.role === 'site_owner') {
    return { error: 'حساب مالك الموقع يمتلك أعلى رتبة بالفعل.' };
  }
  if (!['royal_member', 'royal_vip', 'premium'].includes(rankKey)) {
    return { error: 'هذه الرتبة غير متاحة للشراء من المتجر.' };
  }
  const curPower = getRankPower(current.role);
  const targetPower = getRankPower(rankKey);
  if (current.role === rankKey) {
    return { error: 'أنت تمتلك هذه الرتبة بالفعل!' };
  }
  if (curPower > targetPower) {
    return { error: 'رتبتك الحالية أعلى من هذه الرتبة.' };
  }
  const cost = Math.max(0, Number(price) || 0);
  if ((Number(current.coins) || 0) < cost) {
    return { error: `رصيد الروبي غير كافٍ (${Number(current.coins) || 0} / ${cost} روبي).` };
  }
  current.coins = (Number(current.coins) || 0) - cost;
  current.role = rankKey;
  const owned = Array.isArray(current.owned_frames) ? [...current.owned_frames] : [];
  if (rankKey === 'premium') {
    if (!owned.includes('diamond_ring')) owned.push('diamond_ring');
    if (!current.avatar_frame || current.avatar_frame === 'none') {
      current.avatar_frame = 'diamond_ring';
    }
  } else if (rankKey === 'royal_vip') {
    if (!owned.includes('royal_wings')) owned.push('royal_wings');
    if (!current.avatar_frame || current.avatar_frame === 'none') {
      current.avatar_frame = 'royal_wings';
    }
  } else if (rankKey === 'royal_member') {
    if (!owned.includes('kings_crown')) owned.push('kings_crown');
    if (!current.avatar_frame || current.avatar_frame === 'none') {
      current.avatar_frame = 'kings_crown';
    }
  }
  current.owned_frames = owned;
  enqueueSet(
    'users',
    String(current.id),
    { coins: current.coins, role: current.role, owned_frames: owned, avatar_frame: current.avatar_frame },
    true
  );
  const senderKey = `user:${current.id}`;
  for (const m of store.messagesById.values()) {
    if (m.sender_key === senderKey) {
      m.sender_role = current.role;
      m.avatar_frame = current.avatar_frame;
      enqueueSet('messages', String(m.doc_id || m.id), { sender_role: current.role, avatar_frame: current.avatar_frame }, true);
    }
  }
  return { user: { ...current } };
}

function adminClearUserAvatar(userId) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  current.avatar_url = '';
  enqueueSet('users', String(current.id), { avatar_url: '' }, true);
  const senderKey = `user:${current.id}`;
  for (const m of store.messagesById.values()) {
    if (m.sender_key === senderKey && m.avatar_url) {
      m.avatar_url = '';
      enqueueSet('messages', String(m.doc_id || m.id), { avatar_url: '' }, true);
    }
  }
  return { ...current };
}

function updateUserRole(userId, newRole) {
  if (!isValidRank(newRole)) return null;
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  if (isSupremeOwnerEmail(current.email) && newRole !== 'site_owner') {
    return null;
  }
  if (newRole === 'site_owner' && !isSupremeOwnerEmail(current.email)) {
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
  const oldName = getEffectiveName(current);
  const nameHistory = Array.isArray(current.name_history) ? [...current.name_history] : [];
  if (oldName && oldName !== clean) {
    nameHistory.push({ oldName, newName: clean, changedBy: 'تعديل إداري', at: nowIso() });
    if (nameHistory.length > 30) nameHistory.shift();
  }
  current.display_name = clean;
  current.name_history = nameHistory;
  enqueueSet('users', String(current.id), { display_name: clean, name_history: nameHistory }, true);
  const senderKey = `user:${current.id}`;
  for (const m of store.messagesById.values()) {
    if (m.sender_key === senderKey) {
      m.sender_name = clean;
      enqueueSet('messages', String(m.doc_id || m.id), { sender_name: clean }, true);
    }
  }
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
// PERSISTENT GUESTS HELPERS
// ==========================================
function upsertGuest({ key, name, ipAddress = '', deviceId = '', fingerprint = '', userAgent = '', country = '', nameColor, textColor, nameBgColor, neonColor, fontFamily, fontStyle, fontSize, nameFontSize, nameStyleMode, nameGradient, avatarUrl, avatarFrame, nameplateStyle, nameShine, nameAnim, nameAnimSpeed, bio } = {}) {
  if (!key || !String(key).startsWith('guest:')) return null;
  const existing = store.guestsByKey.get(key);
  const cleanName = name !== undefined && String(name).trim()
    ? String(name).trim().slice(0, 24)
    : existing?.name || 'زائر';
  const now = nowIso();
  const docObj = normalizeGuestDoc(key, {
    ...(existing || {}),
    key,
    name: cleanName,
    display_name: cleanName,
    username: cleanName,
    name_color: nameColor !== undefined ? nameColor : existing?.name_color || '#f8fafc',
    text_color: textColor !== undefined ? textColor : existing?.text_color || '#e2e8f0',
    name_bg_color: nameBgColor !== undefined ? nameBgColor : existing?.name_bg_color || '',
    neon_color: neonColor !== undefined ? neonColor : existing?.neon_color || '',
    font_family: fontFamily !== undefined ? fontFamily : existing?.font_family || 'Cairo',
    font_style: fontStyle !== undefined ? fontStyle : existing?.font_style || 'Normal',
    font_size: fontSize !== undefined ? fontSize : existing?.font_size || 14,
    name_font_size: nameFontSize !== undefined ? nameFontSize : existing?.name_font_size || 14,
    name_style_mode: nameStyleMode !== undefined ? nameStyleMode : existing?.name_style_mode || 'solid',
    name_gradient: nameGradient !== undefined ? nameGradient : existing?.name_gradient || 'gold_royal',
    avatar_url: avatarUrl !== undefined ? avatarUrl : existing?.avatar_url || '',
    avatar_frame: avatarFrame !== undefined ? avatarFrame : existing?.avatar_frame || 'none',
    nameplate_style: nameplateStyle !== undefined ? nameplateStyle : existing?.nameplate_style || 'default',
    name_shine: nameShine !== undefined ? nameShine : existing?.name_shine || 'none',
    name_anim: nameAnim !== undefined ? nameAnim : existing?.name_anim || 'none',
    name_anim_speed: nameAnimSpeed !== undefined ? nameAnimSpeed : existing?.name_anim_speed || 'normal',
    bio: bio !== undefined ? bio : existing?.bio || '',
    country: country || existing?.country || '',
    last_ip: ipAddress || existing?.last_ip || '',
    last_device_id: deviceId || existing?.last_device_id || '',
    last_fingerprint: fingerprint || existing?.last_fingerprint || '',
    last_ua: userAgent || existing?.last_ua || '',
    last_seen_at: now,
    created_at: existing?.created_at || now
  });
  store.guestsByKey.set(docObj.key, docObj);
  enqueueSet('guests', safeDocId(docObj.key), docObj, true);
  return { ...docObj };
}

function findGuestByKey(key) {
  if (!key) return null;
  const g = store.guestsByKey.get(String(key));
  return g ? { ...g } : null;
}

function getAllGuests() {
  return [...store.guestsByKey.values()]
    .map((g) => ({ ...g }))
    .sort((a, b) => String(b.last_seen_at || '').localeCompare(String(a.last_seen_at || '')));
}

function updateGuestCustomization(key, patch = {}) {
  const existing = store.guestsByKey.get(String(key));
  if (!existing) return null;
  return upsertGuest({ key: existing.key, ...patch });
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

function setRoomYoutube(roomId, { videoId = '', title = '', isPlaying = false, miniMode = false, startedByKey = '', startedByName = '' }) {
  const r = store.roomsById.get(roomId);
  if (!r) return null;
  r.youtube_video_id = String(videoId || '').trim().slice(0, 32);
  r.youtube_title = String(title || '').trim().slice(0, 120);
  r.youtube_is_playing = isPlaying && r.youtube_video_id ? 1 : 0;
  r.youtube_mini_mode = r.youtube_is_playing && miniMode ? 1 : 0;
  r.youtube_by_key = r.youtube_is_playing ? String(startedByKey || '').slice(0, 80) : '';
  r.youtube_by_name = r.youtube_is_playing ? String(startedByName || '').slice(0, 60) : '';
  r.youtube_updated_at = nowIso();
  enqueueSet(
    'rooms',
    roomId,
    {
      youtube_video_id: r.youtube_video_id,
      youtube_title: r.youtube_title,
      youtube_is_playing: r.youtube_is_playing,
      youtube_mini_mode: r.youtube_mini_mode,
      youtube_by_key: r.youtube_by_key,
      youtube_by_name: r.youtube_by_name,
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
    youtube_mini_mode: room.youtube_mini_mode ? 1 : 0,
    youtube_by_key: String(room.youtube_by_key || ''),
    youtube_by_name: String(room.youtube_by_name || ''),
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
    min_rank_power: Math.max(0, Math.min(15, Number(minRankPower) || 0)),
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
      minRankPower !== undefined ? Math.max(0, Math.min(15, Number(minRankPower) || 0)) : Number(current.min_rank_power) || 0,
    owner_user_id: nextOwnerId,
    owner_name: nextOwnerName,
    mics_enabled: micsEnabled !== undefined ? (micsEnabled ? 1 : 0) : current.mics_enabled
  };

  store.roomsById.set(roomId, updated);
  enqueueSet('rooms', roomId, updated);
  return { ...updated };
}

function setRoomFrozen(roomId, enabled) {
  const current = store.roomsById.get(roomId);
  if (!current) return null;
  current.is_frozen = enabled ? 1 : 0;
  enqueueSet('rooms', roomId, { is_frozen: current.is_frozen }, true);
  return { ...current };
}

function setRoomPinnedMessage(roomId, message, byName = '') {
  const current = store.roomsById.get(roomId);
  if (!current) return null;
  current.pinned_message = String(message || '').trim().slice(0, 300);
  current.pinned_by = current.pinned_message ? String(byName || '') : '';
  current.pinned_at = current.pinned_message ? nowIso() : '';
  enqueueSet('rooms', roomId, {
    pinned_message: current.pinned_message,
    pinned_by: current.pinned_by,
    pinned_at: current.pinned_at
  }, true);
  return { ...current };
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
  enqueueBatchDelete('muted_users', mutesToDelete);
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
  fontSize,
  nameFontSize,
  nameStyleMode,
  nameGradient,
  avatarUrl,
  avatarFrame,
  nameplateStyle,
  nameShine,
  nameAnim,
  nameAnimSpeed,
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
    name_color: nameColor || '#f8fafc',
    text_color: textColor || '#e2e8f0',
    name_bg_color: nameBgColor || '',
    neon_color: neonColor || '',
    font_family: fontFamily || 'Cairo',
    font_style: fontStyle || 'Normal',
    font_size: Math.max(13, Math.min(17, Number(fontSize) || 14)),
    name_font_size: Math.max(13, Math.min(18, Number(nameFontSize) || 14)),
    name_style_mode: ['solid', 'gradient', 'glow'].includes(String(nameStyleMode)) ? String(nameStyleMode) : 'solid',
    name_gradient: String(nameGradient || 'gold_royal'),
    avatar_url: avatarUrl || '',
    avatar_frame: avatarFrame || 'none',
    nameplate_style: nameplateStyle || 'default',
    name_shine: nameShine || 'none',
    name_anim: nameAnim || 'none',
    name_anim_speed: nameAnimSpeed || 'normal',
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

function getRoomMessagesAfter(roomId, afterMs = 0, limit = 100, viewerKey = '') {
  const safeAfter = Math.max(0, Number(afterMs) || 0);
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
  const list = [];
  for (const m of store.messagesById.values()) {
    if (
      m.room_id === roomId &&
      Number(m.created_at_ms || 0) > safeAfter &&
      (!m.is_ghost_only || m.sender_key === viewerKey)
    ) {
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
// MUTES & BANS (muted_users & banned_users)
// ==========================================
function setMute(targetKey, roomId, durationMs, mutedBy, reason = '', extra = {}) {
  if (isProtectedSupremeOwnerKey(targetKey)) return null;
  const expiresAt = Date.now() + durationMs;
  const rid = roomId || '*';
  const key = `${targetKey}::${rid}`;
  const docObj = {
    target_key: targetKey,
    target_name: String(extra?.targetName || '').trim().slice(0, 60) || targetKey,
    room_id: rid,
    expires_at: expiresAt,
    muted_by: String(mutedBy || 'الإدارة').trim().slice(0, 60),
    muted_by_key: String(extra?.mutedByKey || '').trim().slice(0, 60),
    reason: String(reason || '').trim().slice(0, 240),
    violating_word: String(extra?.violatingWord || '').trim().slice(0, 80),
    created_at: nowIso()
  };
  store.mutesByKey.set(key, docObj);
  enqueueSet('muted_users', safeDocId(key), docObj);
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
  enqueueBatchDelete('muted_users', docIds);
  enqueueBatchDelete('mutes', docIds);
}

function getActiveMute(targetKey, roomId) {
  if (isProtectedSupremeOwnerKey(targetKey)) return null;
  const rid = roomId || '*';
  const now = Date.now();
  for (const [k, row] of store.mutesByKey.entries()) {
    if (row.target_key === targetKey && (row.room_id === rid || row.room_id === '*' || !roomId)) {
      if (Number(row.expires_at) <= now) {
        store.mutesByKey.delete(k);
        enqueueDelete('muted_users', safeDocId(k));
        enqueueDelete('mutes', safeDocId(k));
      } else {
        return { ...row };
      }
    }
  }
  return null;
}

function getAllActiveMutes() {
  const now = Date.now();
  const list = [];
  const expiredIds = [];
  for (const [k, row] of store.mutesByKey.entries()) {
    if (Number(row.expires_at) <= now) {
      store.mutesByKey.delete(k);
      expiredIds.push(safeDocId(k));
    } else {
      let resolvedName = row.target_name || '';
      if ((!resolvedName || resolvedName === row.target_key) && String(row.target_key || '').startsWith('user:')) {
        const uid = Number(String(row.target_key).replace('user:', ''));
        const u = Number.isNaN(uid) ? null : store.usersById.get(uid);
        if (u) resolvedName = getEffectiveName(u);
      } else if ((!resolvedName || resolvedName === row.target_key) && String(row.target_key || '').startsWith('guest:')) {
        const g = store.guestsByKey.get(row.target_key);
        if (g) resolvedName = g.name;
      }
      const roomObj = row.room_id && row.room_id !== '*' ? store.roomsById.get(row.room_id) : null;
      list.push({
        ...row,
        target_name: resolvedName || row.target_key,
        room_name: roomObj ? roomObj.name : row.room_id === '*' ? 'جميع الغرف' : row.room_id,
        remaining_ms: Math.max(0, Number(row.expires_at) - now)
      });
    }
  }
  if (expiredIds.length > 0) {
    enqueueBatchDelete('muted_users', expiredIds);
    enqueueBatchDelete('mutes', expiredIds);
  }
  return list.sort((a, b) => Number(b.expires_at) - Number(a.expires_at));
}

function isLoopbackIp(ip) {
  if (!ip) return true;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function banTarget({
  targetKey,
  targetName,
  email,
  ipAddress,
  deviceId,
  fingerprint = '',
  banType = 'ban',
  reason,
  bannedBy,
  bannedByKey = ''
}) {
  if (isProtectedSupremeOwnerKey(targetKey) || isSupremeOwnerEmail(email)) {
    return false;
  }
  const prev = store.bansByKey.get(targetKey) || {};
  const cleanEmail = (email || '').toLowerCase() || prev.email || '';
  const cleanIp = ipAddress || prev.ip_address || '';
  const cleanDevice = deviceId || prev.device_id || '';
  const cleanFingerprint = String(fingerprint || '').trim() || prev.fingerprint || '';
  const cleanReason =
    String(reason || '').trim().slice(0, 240) ||
    (banType === 'xban' ? 'إكس باند (حظر جهاز وعنوان)' : 'حظر نهائي من الإدارة');
  const docObj = {
    target_key: targetKey,
    target_name: targetName || targetKey,
    email: cleanEmail,
    ip_address: cleanIp,
    device_id: cleanDevice,
    fingerprint: cleanFingerprint,
    ban_type: banType === 'xban' ? 'xban' : 'ban',
    reason: cleanReason,
    banned_by: bannedBy || 'الإدارة',
    banned_by_key: String(bannedByKey || ''),
    created_at: nowIso()
  };

  store.bansByKey.set(targetKey, docObj);
  enqueueSet('banned_users', safeDocId(targetKey), docObj);
  enqueueDelete('bans', safeDocId(targetKey));

  if (String(targetKey).startsWith('user:')) {
    const uid = Number(String(targetKey).replace('user:', ''));
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
  enqueueDelete('banned_users', safeDocId(targetKey));
  enqueueDelete('bans', safeDocId(targetKey));
  if (String(targetKey).startsWith('user:')) {
    const uid = Number(String(targetKey).replace('user:', ''));
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
  const fingerprint = typeof input === 'object' ? String(input?.fingerprint || '').trim() : '';

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
        return {
          target_key: targetKey,
          target_name: getEffectiveName(u),
          reason: u.ban_reason || 'حظر نهائي',
          banned_by: 'الإدارة'
        };
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

  if (fingerprint) {
    for (const b of store.bansByKey.values()) {
      if (b.fingerprint && b.fingerprint === fingerprint) return { ...b };
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

function addWallPost({
  authorKey,
  authorName,
  authorRole,
  avatarUrl,
  avatarFrame,
  nameplateStyle,
  nameColor,
  nameBgColor,
  neonColor,
  content,
  imageUrl,
  inviteRoomId,
  inviteRoomName,
  inviteCountryFlag,
  inviteOnlineCount
}) {
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
    name_color: nameColor || '#0f172a',
    name_bg_color: nameBgColor || '',
    neon_color: neonColor || '',
    content,
    image_url: imageUrl || '',
    invite_room_id: inviteRoomId || '',
    invite_room_name: inviteRoomName || '',
    invite_country_flag: inviteCountryFlag || '',
    invite_online_count: Number(inviteOnlineCount) || 0,
    reactions: { like: 0, heart: 0, laugh: 0 },
    comments: [],
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
    .slice(0, 40)
    .map((p) => ({
      ...p,
      reactions: p.reactions || { like: Number(p.likes_count) || 0, heart: 0, laugh: 0 },
      comments: Array.isArray(p.comments) ? p.comments : []
    }));
}

function likeWallPost(postId) {
  return reactWallPost(postId, 'heart');
}

function reactWallPost(postId, reactionType = 'like') {
  const post = store.wallPostsById.get(Number(postId));
  if (!post) return null;
  const kind = ['like', 'heart', 'laugh'].includes(reactionType) ? reactionType : 'like';
  const curReactions = {
    like: Number(post.reactions?.like) || 0,
    heart: Number(post.reactions?.heart) || 0,
    laugh: Number(post.reactions?.laugh) || 0
  };
  curReactions[kind] += 1;
  post.reactions = curReactions;
  post.likes_count = curReactions.like + curReactions.heart + curReactions.laugh;
  enqueueSet('wall_posts', String(post.id), { reactions: curReactions, likes_count: post.likes_count }, true);
  return { ...post, reactions: { ...curReactions }, comments: Array.isArray(post.comments) ? post.comments : [] };
}

function addWallComment(postId, { authorKey, authorName, authorRole, avatarUrl, content }) {
  const post = store.wallPostsById.get(Number(postId));
  if (!post) return null;
  const clean = String(content || '').trim().slice(0, 300);
  if (!clean) return null;
  const comments = Array.isArray(post.comments) ? [...post.comments] : [];
  comments.push({
    id: `wc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author_key: authorKey,
    author_name: authorName,
    author_role: authorRole || 'member',
    avatar_url: avatarUrl || '',
    content: clean,
    created_at: nowIso()
  });
  if (comments.length > 50) comments.shift();
  post.comments = comments;
  enqueueSet('wall_posts', String(post.id), { comments }, true);
  return { ...post, reactions: post.reactions || { like: Number(post.likes_count) || 0, heart: 0, laugh: 0 }, comments };
}

function deleteWallPost(postId) {
  const nid = Number(postId);
  if (!store.wallPostsById.has(nid)) return false;
  store.wallPostsById.delete(nid);
  enqueueDelete('wall_posts', String(nid));
  return true;
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

function addAdminLog({ actorKey, actorName, actorRole, action, targetKey = '', targetName = '', details = '' }) {
  const id = nextSeq('admin_logs');
  const log = {
    id,
    log_type: 'admin_log',
    actor_key: actorKey || '',
    actor_name: actorName || 'النظام',
    actor_role: actorRole || '',
    action: String(action || ''),
    target_key: String(targetKey || ''),
    target_name: String(targetName || ''),
    details: String(details || '').slice(0, 300),
    created_at: nowIso()
  };
  store.adminLogsById.set(id, log);
  enqueueSet('reports', `log_${id}`, log);
  return { ...log };
}

function getAdminLogs(limit = 100) {
  return [...store.adminLogsById.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit);
}

function addPmLinkAlert({ fromKey, fromName, toKey, toName, content }) {
  const id = nextSeq('pm_link_alerts');
  const alert = {
    id,
    log_type: 'pm_link_alert',
    from_key: fromKey || '',
    from_name: fromName || '',
    to_key: toKey || '',
    to_name: toName || '',
    content: String(content || '').slice(0, 300),
    created_at: nowIso()
  };
  store.pmLinkAlertsById.set(id, alert);
  enqueueSet('reports', `pml_${id}`, alert);
  return { ...alert };
}

function getPmLinkAlerts(limit = 60) {
  return [...store.pmLinkAlertsById.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit);
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
      enqueueDelete('muted_users', safeDocId(k));
      enqueueDelete('mutes', safeDocId(k));
      const newMuteKey = `${newKey}::${m.room_id}`;
      if (!store.mutesByKey.has(newMuteKey)) {
        const migrated = { ...m, target_key: newKey, target_name: newName || m.target_name };
        store.mutesByKey.set(newMuteKey, migrated);
        enqueueSet('muted_users', safeDocId(newMuteKey), migrated);
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
  getAllCustomFrames,
  addCustomFrame,
  deleteCustomFrame,
  getValidOwnedFramesData,
  isFrameOwnedAndValid,
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
  setUserShadowMuted,
  setUserFrozen,
  claimLuckyBox,
  recordReferralInvite,
  interactProfile,
  updateUserCredentials,
  deleteUserAccountPermanently,
  incrementActivityPoints,
  incrementQuizPoints,
  updateUserCustomization,
  adminCreateUser,
  adminUpdateUserAccount,
  spendUserCoins,
  adjustUserCoins,
  adjustUserRubyAndActivity,
  purchaseFrameWithRuby,
  grantFrameToUser,
  getRubyMultiplierForRole,
  checkAndApplyAutoPromotion,
  purchaseRankWithRuby,
  adminClearUserAvatar,
  updateUserRole,
  forceChangeUserDisplayName,
  getAllRegisteredUsers,
  upsertGuest,
  findGuestByKey,
  getAllGuests,
  updateGuestCustomization,
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
  setRoomFrozen,
  setRoomPinnedMessage,
  deleteRoom,
  addMessage,
  getRoomMessages,
  getRoomMessagesAfter,
  clearRoomMessages,
  deleteMessageById,
  setMute,
  removeMute,
  getActiveMute,
  getAllActiveMutes,
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
  reactWallPost,
  addWallComment,
  deleteWallPost,
  addReport,
  getReports,
  addAdminLog,
  getAdminLogs,
  addPmLinkAlert,
  getPmLinkAlerts,
  addNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationsRead,
  migrateGuestKeyReferences
};
