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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 0
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 1
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
    perm_access_panel: 0
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
    perm_access_panel: 0
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
    perm_access_panel: 0
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
    perm_access_panel: 0
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
    perm_access_panel: 0
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

// ==========================================
// FIRESTORE DRIVER (Admin SDK when configured, or Firebase JS SDK + Rules)
// ==========================================
let fsMode = 'client';
let fsAdminDb = null;
let fsClientDb = null;
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
  if (fsMode === 'admin') {
    const snap = await fsAdminDb.collection(colName).get();
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  }
  const snap = await getDocs(collection(fsClientDb, colName));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function fsSetDoc(colName, docId, data, merge = false) {
  const cleanData = JSON.parse(JSON.stringify(data));
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
// REACTIVE IN-MEMORY CACHE (Synced with Cloud Firestore)
// ==========================================
const store = {
  usersById: new Map(),
  ranksByKey: new Map(),
  siteSettings: { ...DEFAULT_SITE_SETTINGS },
  roomsById: new Map(),
  roomStaffByKey: new Map(), // `${room_id}:${user_id}` -> row
  messagesById: new Map(), // String(id) -> msg
  mutesByKey: new Map(), // `${target_key}::${room_id}` -> row
  bansByKey: new Map(), // target_key -> row
  customEmojisById: new Map(),
  privateMessagesById: new Map(),
  friendshipsByKey: new Map(), // `${user_key}::${friend_key}` -> row
  wallPostsById: new Map(),
  reportsById: new Map(),
  notificationsById: new Map(),
  counters: {
    users: 0,
    messages: 0,
    custom_emojis: 0,
    private_messages: 0,
    wall_posts: 0,
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
  return {
    id: numId,
    username: String(data.username || ''),
    email: String(data.email || '').toLowerCase(),
    password_hash: String(data.password_hash || ''),
    role: String(data.role || 'member'),
    display_name: String(data.display_name || ''),
    name_color: String(data.name_color || '#ffffff'),
    text_color: String(data.text_color || '#ffffff'),
    name_bg_color: String(data.name_bg_color || ''),
    neon_color: String(data.neon_color || ''),
    font_family: String(data.font_family || 'Normal'),
    font_style: String(data.font_style || 'Normal'),
    avatar_url: String(data.avatar_url || ''),
    avatar_frame: String(data.avatar_frame || 'none'),
    nameplate_style: String(data.nameplate_style || 'default'),
    coins: data.coins !== undefined ? Number(data.coins) : 1500,
    vip_family: String(data.vip_family || ''),
    last_ip: String(data.last_ip || ''),
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
    created_by: String(data.created_by || 'system'),
    created_at: String(data.created_at || nowIso())
  };
}

function normalizeRankDoc(docId, data) {
  return {
    key: String(data.key || docId),
    label: String(data.label || docId),
    icon: String(data.icon || '⭐'),
    image_url: String(data.image_url || ''),
    bg_color: String(data.bg_color || '#334155'),
    text_color: String(data.text_color || '#ffffff'),
    power: Number(data.power) || 0,
    tier_order: Number(data.tier_order) || 0,
    is_system: data.is_system ? 1 : 0,
    perm_mute: data.perm_mute ? 1 : 0,
    perm_kick: data.perm_kick ? 1 : 0,
    perm_ban: data.perm_ban ? 1 : 0,
    perm_set_rank: data.perm_set_rank ? 1 : 0,
    perm_clear_room: data.perm_clear_room ? 1 : 0,
    perm_manage_rooms: data.perm_manage_rooms ? 1 : 0,
    perm_access_panel: data.perm_access_panel ? 1 : 0,
    created_at: String(data.created_at || nowIso())
  };
}

async function migrateFromSqliteIfNeeded() {
  const sqlitePath = path.join(__dirname, 'data', 'chat.db');
  if (!fs.existsSync(sqlitePath)) return;

  let sqlite;
  try {
    const { DatabaseSync } = require('node:sqlite');
    sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
  } catch (err) {
    console.warn('SQLite migration skipped:', err.message);
    return;
  }

  const tableExists = (name) =>
    Boolean(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name));

  try {
    if (store.usersById.size === 0 && tableExists('users')) {
      const users = sqlite.prepare('SELECT * FROM users').all();
      const batch = [];
      for (const u of users) {
        const docObj = normalizeUserDoc(u.id, u);
        store.usersById.set(docObj.id, docObj);
        store.counters.users = Math.max(store.counters.users, docObj.id);
        batch.push({ docId: String(docObj.id), data: docObj, merge: true });
      }
      await fsBatchSet('users', batch);
      if (batch.length > 0) console.log(`Migrated ${batch.length} users from SQLite to Cloud Firestore.`);
    }

    if (store.roomsById.size === 0 && tableExists('rooms')) {
      const rooms = sqlite.prepare('SELECT * FROM rooms').all();
      const batch = [];
      for (const r of rooms) {
        const docObj = normalizeRoomDoc(r.id, r);
        store.roomsById.set(docObj.id, docObj);
        batch.push({ docId: docObj.id, data: docObj, merge: true });
      }
      await fsBatchSet('rooms', batch);
      if (batch.length > 0) console.log(`Migrated ${batch.length} rooms from SQLite to Cloud Firestore.`);
    }

    if (store.roomStaffByKey.size === 0 && tableExists('room_staff')) {
      const staff = sqlite.prepare('SELECT * FROM room_staff').all();
      const batch = [];
      for (const s of staff) {
        const key = `${s.room_id}:${s.user_id}`;
        const docObj = {
          room_id: String(s.room_id),
          user_id: Number(s.user_id),
          staff_role: String(s.staff_role || 'مشرف غرفة'),
          assigned_by: String(s.assigned_by || ''),
          created_at: String(s.created_at || nowIso())
        };
        store.roomStaffByKey.set(key, docObj);
        batch.push({ docId: safeDocId(key), data: docObj, merge: true });
      }
      await fsBatchSet('room_staff', batch);
    }

    if (store.messagesById.size === 0 && tableExists('messages')) {
      const msgs = sqlite.prepare('SELECT * FROM messages').all();
      const batch = [];
      for (const m of msgs) {
        const docObj = normalizeMessageDoc(m.id, { ...m, created_at_ms: toMs(m.created_at) });
        store.messagesById.set(String(docObj.id), docObj);
        if (typeof docObj.id === 'number') {
          store.counters.messages = Math.max(store.counters.messages, docObj.id);
        }
        batch.push({ docId: String(docObj.id), data: docObj, merge: true });
      }
      await fsBatchSet('messages', batch);
      if (batch.length > 0) console.log(`Migrated ${batch.length} messages from SQLite to Cloud Firestore.`);
    }

    if (store.ranksByKey.size === 0 && tableExists('ranks')) {
      const ranks = sqlite.prepare('SELECT * FROM ranks').all();
      const batch = [];
      for (const rk of ranks) {
        const docObj = normalizeRankDoc(rk.key, rk);
        store.ranksByKey.set(docObj.key, docObj);
        batch.push({ docId: docObj.key, data: docObj, merge: true });
      }
      await fsBatchSet('ranks', batch);
    }

    if (store.customEmojisById.size === 0 && tableExists('custom_emojis')) {
      const emojis = sqlite.prepare('SELECT * FROM custom_emojis').all();
      const batch = [];
      for (const e of emojis) {
        const docObj = {
          id: Number(e.id),
          code: String(e.code),
          image_url: String(e.image_url),
          created_by: String(e.created_by || ''),
          created_at: String(e.created_at || nowIso())
        };
        store.customEmojisById.set(docObj.id, docObj);
        store.counters.custom_emojis = Math.max(store.counters.custom_emojis, docObj.id);
        batch.push({ docId: String(docObj.id), data: docObj, merge: true });
      }
      await fsBatchSet('custom_emojis', batch);
    }

    if (store.bansByKey.size === 0 && tableExists('bans')) {
      const bans = sqlite.prepare('SELECT * FROM bans').all();
      const batch = [];
      for (const b of bans) {
        const docObj = {
          target_key: String(b.target_key),
          target_name: String(b.target_name || b.target_key),
          email: String(b.email || '').toLowerCase(),
          ip_address: String(b.ip_address || ''),
          reason: String(b.reason || 'حظر نهائي من الإدارة'),
          banned_by: String(b.banned_by || 'الإدارة'),
          created_at: String(b.created_at || nowIso())
        };
        store.bansByKey.set(docObj.target_key, docObj);
        batch.push({ docId: safeDocId(docObj.target_key), data: docObj, merge: true });
      }
      await fsBatchSet('bans', batch);
    }

    if (tableExists('site_settings')) {
      const ss = sqlite.prepare('SELECT * FROM site_settings WHERE id = 1').get();
      if (ss) {
        store.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...ss, maintenance_mode: 0 };
        await fsSetDoc('settings', 'site', store.siteSettings, true);
      }
    }
  } finally {
    try {
      sqlite.close();
    } catch {
      // ignore
    }
  }
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
          for (const [k, v] of store.roomStaffByKey.entries()) {
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
        const id = Number(ch.id);
        if (ch.type === 'removed') store.wallPostsById.delete(id);
        else {
          store.wallPostsById.set(id, { id, ...ch.data });
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
        else {
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
        else {
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
    createFirestoreDriver();

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
    ] = await Promise.all([
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
      const id = Number(d.id) || Number(d.data?.id);
      if (id) {
        store.wallPostsById.set(id, { id, ...d.data });
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

    // One-time seamless migration of any legacy SQLite data if Firestore is missing it
    await migrateFromSqliteIfNeeded();

    // Seed missing default ranks into Firestore
    const missingRanks = [];
    for (const r of DEFAULT_RANKS) {
      if (!store.ranksByKey.has(r.key)) {
        const docObj = { ...r, created_at: nowIso() };
        store.ranksByKey.set(r.key, docObj);
        missingRanks.push({ docId: r.key, data: docObj, merge: true });
      }
    }
    if (missingRanks.length > 0) {
      await fsBatchSet('ranks', missingRanks);
    }

    // Seed site settings if missing
    if (!hasSiteSettingsDoc) {
      await fsSetDoc('settings', 'site', store.siteSettings, true);
    }

    // Seed default rooms if empty
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
    provider: 'firebase-firestore',
    mode: fsMode,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
    initialized,
    counts: {
      users: store.usersById.size,
      messages: store.messagesById.size,
      rooms: store.roomsById.size,
      ranks: store.ranksByKey.size,
      bans: store.bansByKey.size
    }
  };
}

// ==========================================
// DYNAMIC RANKS & PERMISSIONS HELPERS
// ==========================================
function mapRankRow(row) {
  if (!row) return null;
  return {
    key: row.key,
    label: row.label,
    icon: row.icon || '⭐',
    image_url: row.image_url || '',
    bg_color: row.bg_color || '#334155',
    text_color: row.text_color || '#ffffff',
    power: Number(row.power) || 0,
    tier_order: Number(row.tier_order) || 0,
    is_system: row.is_system === 1,
    permissions: {
      mute: row.perm_mute === 1,
      kick: row.perm_kick === 1,
      ban: row.perm_ban === 1,
      set_rank: row.perm_set_rank === 1,
      clear_room: row.perm_clear_room === 1,
      manage_rooms: row.perm_manage_rooms === 1,
      access_panel: row.perm_access_panel === 1
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
  access_panel: 'perm_access_panel'
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

function createRank({ key, label, icon, imageUrl, bgColor, textColor, power, permissions = {} }) {
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
  const docObj = {
    key: safeKey,
    label: cleanLabel,
    icon: String(icon || '⭐').trim().slice(0, 8) || '⭐',
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
    created_at: nowIso()
  };

  store.ranksByKey.set(safeKey, docObj);
  enqueueSet('ranks', safeKey, docObj);
  return { rank: getRankByKey(safeKey) };
}

function updateRank(key, { label, icon, imageUrl, bgColor, textColor, power, permissions }) {
  const existing = store.ranksByKey.get(key);
  if (!existing) return { error: 'الرتبة غير موجودة.' };

  const nextLabel = label !== undefined && String(label).trim() ? String(label).trim().slice(0, 32) : existing.label;
  const nextIcon = icon !== undefined ? String(icon).trim().slice(0, 8) || '⭐' : existing.icon;
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
  const updated = {
    ...existing,
    label: nextLabel,
    icon: nextIcon,
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
    perm_access_panel: isOwner ? 1 : p.access_panel !== undefined ? (p.access_panel ? 1 : 0) : existing.perm_access_panel
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

function registerUser({ username, email, passwordHash, ipAddress }) {
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

  const total = store.usersById.size;
  const role = total === 0 ? 'site_owner' : 'member';
  const id = nextSeq('users');
  const user = {
    id,
    username: cleanUser,
    email: cleanEmail,
    password_hash: passwordHash,
    role,
    display_name: cleanUser,
    name_color: '#ffffff',
    text_color: '#ffffff',
    name_bg_color: '',
    neon_color: '',
    font_family: 'Normal',
    font_style: 'Normal',
    avatar_url: '',
    avatar_frame: role === 'site_owner' ? 'gold_royal' : 'none',
    nameplate_style: role === 'site_owner' ? 'crimson_royal' : 'default',
    coins: role === 'site_owner' ? 99999 : 1500,
    vip_family: '',
    last_ip: ipAddress || '',
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
      return { ...u };
    }
  }
  return null;
}

function findUserById(id) {
  const num = Number(id);
  const u = store.usersById.get(num);
  return u ? { ...u } : null;
}

function updateUserIp(userId, ipAddress) {
  if (!userId || !ipAddress) return;
  const u = store.usersById.get(Number(userId));
  if (!u || u.last_ip === ipAddress) return;
  u.last_ip = ipAddress;
  enqueueSet('users', String(u.id), { last_ip: ipAddress }, true);
}

function updateUserCustomization(
  userId,
  { displayName, nameColor, textColor, nameBgColor, neonColor, fontFamily, fontStyle, avatarUrl, avatarFrame, nameplateStyle, vipFamily }
) {
  const current = store.usersById.get(Number(userId));
  if (!current) return null;

  const updated = {
    ...current,
    display_name: displayName !== undefined && displayName.trim() ? displayName.trim() : getEffectiveName(current),
    name_color: nameColor || current.name_color,
    text_color: textColor !== undefined ? textColor || '#ffffff' : current.text_color || '#ffffff',
    name_bg_color: nameBgColor !== undefined ? String(nameBgColor || '').trim().slice(0, 30) : current.name_bg_color || '',
    neon_color: neonColor !== undefined ? String(neonColor || '').trim().slice(0, 30) : current.neon_color || '',
    font_family: fontFamily !== undefined ? String(fontFamily || 'Normal').trim().slice(0, 40) : current.font_family || 'Normal',
    font_style: fontStyle !== undefined ? String(fontStyle || 'Normal').trim().slice(0, 30) : current.font_style || 'Normal',
    avatar_url: avatarUrl !== undefined ? avatarUrl : current.avatar_url,
    avatar_frame: avatarFrame || current.avatar_frame || 'none',
    nameplate_style: nameplateStyle || current.nameplate_style || 'default',
    vip_family: vipFamily !== undefined ? vipFamily.trim().slice(0, 24) : current.vip_family || ''
  };

  store.usersById.set(updated.id, updated);
  enqueueSet('users', String(updated.id), updated);
  return { ...updated };
}

function adminCreateUser({ username, displayName, email, passwordHash, role }) {
  const cleanUser = String(username || '').trim().slice(0, 24);
  const cleanDisplay = String(displayName || cleanUser).trim().slice(0, 28) || cleanUser;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const safeRole = isValidRank(role) ? role : 'member';

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
    name_color: '#ffffff',
    text_color: '#ffffff',
    name_bg_color: '',
    neon_color: '',
    font_family: 'Normal',
    font_style: 'Normal',
    avatar_url: '',
    avatar_frame: 'none',
    nameplate_style: 'default',
    coins: 1500,
    vip_family: '',
    last_ip: '',
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

  const nextDisplay =
    displayName !== undefined && String(displayName).trim()
      ? String(displayName).trim().slice(0, 28)
      : getEffectiveName(current);
  const nextUsername =
    username !== undefined && String(username).trim()
      ? String(username).trim().slice(0, 24)
      : current.username;
  const nextEmail =
    email !== undefined && String(email).trim() ? String(email).trim().toLowerCase() : current.email;
  const nextPasswordHash = passwordHash || current.password_hash;
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url;
  const nextRole = role !== undefined && isValidRank(role) ? role : current.role;

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
  if (!cost || cost <= 0) return findUserById(userId);
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
  if ((current.coins || 0) < cost) return { error: 'رصيد المحفظة غير كافٍ لإتمام الشراء.' };
  current.coins -= cost;
  enqueueSet('users', String(current.id), { coins: current.coins }, true);
  return { user: { ...current } };
}

function updateUserRole(userId, newRole) {
  if (!isValidRank(newRole)) return null;
  const current = store.usersById.get(Number(userId));
  if (!current) return null;
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
// ROOMS & STAFF HELPERS
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
  if (userRole === 'site_owner' || hasPermission(userRole, 'manage_rooms')) return true;
  if (!roomId || !userId) return false;
  const room = getRoomById(roomId);
  if (room && room.owner_user_id && Number(room.owner_user_id) === Number(userId)) return true;
  return isRoomStaffMember(roomId, userId);
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
  const msg = {
    id,
    doc_id: String(id),
    room_id: roomId,
    sender_key: senderKey,
    sender_name: senderName,
    sender_role: senderRole || 'member',
    name_color: nameColor || '#ffffff',
    text_color: textColor || '#ffffff',
    name_bg_color: nameBgColor || '',
    neon_color: neonColor || '',
    font_family: fontFamily || 'Normal',
    font_style: fontStyle || 'Normal',
    avatar_url: avatarUrl || '',
    avatar_frame: avatarFrame || 'none',
    nameplate_style: nameplateStyle || 'default',
    msg_type: ['text', 'image', 'audio'].includes(msgType) ? msgType : 'text',
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

function getRoomMessages(roomId, limit = 100) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
  const list = [];
  for (const m of store.messagesById.values()) {
    if (m.room_id === roomId) list.push(m);
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

// ==========================================
// MUTES & BANS
// ==========================================
function setMute(targetKey, roomId, durationMs, mutedBy) {
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

function banTarget({ targetKey, targetName, email, ipAddress, reason, bannedBy }) {
  const prev = store.bansByKey.get(targetKey) || {};
  const cleanEmail = (email || '').toLowerCase() || prev.email || '';
  const cleanIp = ipAddress || prev.ip_address || '';
  const cleanReason = reason || 'حظر نهائي من الإدارة';
  const docObj = {
    target_key: targetKey,
    target_name: targetName || targetKey,
    email: cleanEmail,
    ip_address: cleanIp,
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

  if (targetKey) {
    const banRow = store.bansByKey.get(targetKey);
    if (banRow) return { ...banRow };
    if (targetKey.startsWith('user:')) {
      const uid = Number(targetKey.replace('user:', ''));
      const u = Number.isNaN(uid) ? null : findUserById(uid);
      if (u && u.is_banned === 1) {
        return { target_key: targetKey, target_name: getEffectiveName(u), reason: u.ban_reason || 'حظر نهائي' };
      }
      if (u && u.role === 'site_owner') {
        return null;
      }
    }
  }

  if (email) {
    for (const b of store.bansByKey.values()) {
      if ((b.email || '').toLowerCase() === email) return { ...b };
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
// SOCIAL, PM, WALL, REPORTS, NOTIFICATIONS
// ==========================================
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

function addNotification({ targetKey, title, body }) {
  const id = nextSeq('notifications');
  const notif = {
    id,
    target_key: targetKey,
    title,
    body,
    is_read: 0,
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
    .slice(0, 30);
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
  DEFAULT_RANKS,
  getAllRanks,
  getRankByKey,
  getRankPower,
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
  updateUserCustomization,
  adminCreateUser,
  adminUpdateUserAccount,
  spendUserCoins,
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
  sanitizeRoomForPublic,
  createRoom,
  updateRoom,
  deleteRoom,
  addMessage,
  getRoomMessages,
  clearRoomMessages,
  setMute,
  removeMute,
  getActiveMute,
  banTarget,
  unbanTarget,
  getAllBans,
  isTargetBanned,
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
  migrateGuestKeyReferences
};
