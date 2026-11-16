const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'chat.db');
const db = new DatabaseSync(DB_PATH);

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
  // Legacy compatibility ranks
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

function ensureColumn(tableName, columnName, columnDef) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = cols.some((c) => c.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }
}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    display_name TEXT DEFAULT '',
    name_color TEXT NOT NULL DEFAULT '#ffffff',
    avatar_url TEXT DEFAULT '',
    avatar_frame TEXT NOT NULL DEFAULT 'none',
    nameplate_style TEXT NOT NULL DEFAULT 'default',
    coins INTEGER NOT NULL DEFAULT 1500,
    vip_family TEXT DEFAULT '',
    last_ip TEXT DEFAULT '',
    is_banned INTEGER NOT NULL DEFAULT 0,
    ban_reason TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ranks (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '⭐',
    image_url TEXT NOT NULL DEFAULT '',
    bg_color TEXT NOT NULL DEFAULT '#334155',
    text_color TEXT NOT NULL DEFAULT '#ffffff',
    power INTEGER NOT NULL DEFAULT 10,
    is_system INTEGER NOT NULL DEFAULT 0,
    perm_mute INTEGER NOT NULL DEFAULT 0,
    perm_kick INTEGER NOT NULL DEFAULT 0,
    perm_ban INTEGER NOT NULL DEFAULT 0,
    perm_set_rank INTEGER NOT NULL DEFAULT 0,
    perm_clear_room INTEGER NOT NULL DEFAULT 0,
    perm_manage_rooms INTEGER NOT NULL DEFAULT 0,
    perm_access_panel INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS custom_emojis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL COLLATE NOCASE,
    image_url TEXT NOT NULL,
    created_by TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_name TEXT NOT NULL DEFAULT 'شات الغرف المباشر',
    site_description TEXT NOT NULL DEFAULT 'دردشة عربية فورية • مايكات صوتية • رتب وإطارات ملكية',
    site_logo TEXT NOT NULL DEFAULT '',
    welcome_message TEXT NOT NULL DEFAULT '',
    maintenance_mode INTEGER NOT NULL DEFAULT 0,
    top_bar_color TEXT NOT NULL DEFAULT '#1a45e5',
    bottom_bar_color TEXT NOT NULL DEFAULT '#1a45e5',
    button_color TEXT NOT NULL DEFAULT '#f59e0b',
    font_family TEXT NOT NULL DEFAULT 'Cairo',
    font_size INTEGER NOT NULL DEFAULT 15,
    custom_css TEXT NOT NULL DEFAULT '',
    custom_html TEXT NOT NULL DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '💬',
    image_url TEXT DEFAULT '',
    bg_theme TEXT NOT NULL DEFAULT 'warm_peach',
    wallpaper_url TEXT NOT NULL DEFAULT '',
    bg_custom TEXT NOT NULL DEFAULT '',
    welcome_message TEXT NOT NULL DEFAULT '',
    room_password TEXT NOT NULL DEFAULT '',
    min_rank_power INTEGER NOT NULL DEFAULT 0,
    mics_enabled INTEGER NOT NULL DEFAULT 1,
    created_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_key TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'member',
    name_color TEXT NOT NULL DEFAULT '#ffffff',
    avatar_url TEXT DEFAULT '',
    avatar_frame TEXT NOT NULL DEFAULT 'none',
    nameplate_style TEXT NOT NULL DEFAULT 'default',
    msg_type TEXT NOT NULL DEFAULT 'text',
    content TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, id DESC);

  CREATE TABLE IF NOT EXISTS mutes (
    target_key TEXT NOT NULL,
    room_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    muted_by TEXT NOT NULL,
    PRIMARY KEY (target_key, room_id)
  );

  CREATE TABLE IF NOT EXISTS bans (
    target_key TEXT PRIMARY KEY,
    target_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    reason TEXT NOT NULL DEFAULT 'حظر نهائي من الإدارة',
    banned_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_key TEXT NOT NULL,
    from_name TEXT NOT NULL,
    from_role TEXT NOT NULL DEFAULT 'member',
    from_avatar TEXT DEFAULT '',
    to_key TEXT NOT NULL,
    to_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friendships (
    user_key TEXT NOT NULL,
    friend_key TEXT NOT NULL,
    friend_name TEXT NOT NULL,
    friend_role TEXT NOT NULL DEFAULT 'member',
    friend_avatar TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_key, friend_key)
  );

  CREATE TABLE IF NOT EXISTS wall_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_key TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'member',
    avatar_url TEXT DEFAULT '',
    avatar_frame TEXT NOT NULL DEFAULT 'none',
    nameplate_style TEXT NOT NULL DEFAULT 'default',
    content TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_key TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    target_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    room_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_key TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS room_staff (
    room_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    staff_role TEXT NOT NULL DEFAULT 'مشرف غرفة',
    assigned_by TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
  );
`);

// Safe column migrations for pre-existing tables
ensureColumn('users', 'username', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'email', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'password_hash', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'role', "TEXT NOT NULL DEFAULT 'member'");
ensureColumn('users', 'display_name', "TEXT DEFAULT ''");
ensureColumn('users', 'name_color', "TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn('users', 'text_color', "TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn('users', 'name_bg_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'neon_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'font_family', "TEXT NOT NULL DEFAULT 'Normal'");
ensureColumn('users', 'font_style', "TEXT NOT NULL DEFAULT 'Normal'");
ensureColumn('users', 'avatar_url', "TEXT DEFAULT ''");
ensureColumn('users', 'last_ip', "TEXT DEFAULT ''");
ensureColumn('users', 'avatar_frame', "TEXT NOT NULL DEFAULT 'none'");
ensureColumn('users', 'nameplate_style', "TEXT NOT NULL DEFAULT 'default'");
ensureColumn('users', 'coins', 'INTEGER NOT NULL DEFAULT 1500');
ensureColumn('users', 'vip_family', "TEXT DEFAULT ''");
ensureColumn('users', 'is_banned', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'ban_reason', "TEXT DEFAULT ''");
ensureColumn('users', 'created_at', "DATETIME DEFAULT ''");

ensureColumn('rooms', 'description', "TEXT DEFAULT ''");
ensureColumn('rooms', 'icon', "TEXT DEFAULT '💬'");
ensureColumn('rooms', 'image_url', "TEXT DEFAULT ''");
ensureColumn('rooms', 'bg_theme', "TEXT NOT NULL DEFAULT 'warm_peach'");
ensureColumn('rooms', 'wallpaper_url', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'bg_custom', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'welcome_message', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'room_password', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'min_rank_power', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('rooms', 'mics_enabled', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('rooms', 'owner_user_id', 'INTEGER DEFAULT NULL');
ensureColumn('rooms', 'owner_name', "TEXT DEFAULT ''");
ensureColumn('rooms', 'card_bg_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'card_text_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('rooms', 'created_by', "TEXT DEFAULT 'system'");

ensureColumn('messages', 'avatar_frame', "TEXT NOT NULL DEFAULT 'none'");
ensureColumn('messages', 'nameplate_style', "TEXT NOT NULL DEFAULT 'default'");
ensureColumn('messages', 'text_color', "TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn('messages', 'name_bg_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('messages', 'neon_color', "TEXT NOT NULL DEFAULT ''");
ensureColumn('messages', 'font_family', "TEXT NOT NULL DEFAULT 'Normal'");
ensureColumn('messages', 'font_style', "TEXT NOT NULL DEFAULT 'Normal'");

ensureColumn('private_messages', 'is_read', 'INTEGER NOT NULL DEFAULT 0');

ensureColumn('bans', 'email', "TEXT DEFAULT ''");
ensureColumn('bans', 'ip_address', "TEXT DEFAULT ''");

ensureColumn('ranks', 'image_url', "TEXT NOT NULL DEFAULT ''");
ensureColumn('ranks', 'bg_color', "TEXT NOT NULL DEFAULT '#334155'");
ensureColumn('ranks', 'text_color', "TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn('ranks', 'tier_order', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_mute', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_kick', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_ban', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_set_rank', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_clear_room', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_manage_rooms', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('ranks', 'perm_access_panel', 'INTEGER NOT NULL DEFAULT 0');

// Seed default ranks idempotently
const seedRankStmt = db.prepare(`
  INSERT OR IGNORE INTO ranks (
    key, label, icon, image_url, bg_color, text_color, power, tier_order, is_system,
    perm_mute, perm_kick, perm_ban, perm_set_rank, perm_clear_room, perm_manage_rooms, perm_access_panel
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const r of DEFAULT_RANKS) {
  seedRankStmt.run(
    r.key,
    r.label,
    r.icon,
    r.image_url,
    r.bg_color,
    r.text_color,
    r.power,
    r.tier_order || 0,
    r.is_system,
    r.perm_mute,
    r.perm_kick,
    r.perm_ban,
    r.perm_set_rank,
    r.perm_clear_room,
    r.perm_manage_rooms,
    r.perm_access_panel
  );
}

// Keep top leadership labels & powers aligned with 1-100 hierarchy without overwriting custom user-edited ranks
db.prepare("UPDATE ranks SET label = 'Owner / صاحب الموقع', power = 100, tier_order = 10 WHERE key = 'site_owner' AND label = 'صاحب الموقع'").run();
db.prepare("UPDATE ranks SET label = 'Super Owner', power = 99, tier_order = 5 WHERE key = 'super_owner' AND label = 'سوبر أونر'").run();
db.prepare("UPDATE ranks SET tier_order = 5 WHERE key IN ('vip_owner','master_owner','master_super','director','moderator')").run();

// Seed default site_settings row id = 1 idempotently & ensure maintenance_mode is disabled by default on boot
db.prepare('INSERT OR IGNORE INTO site_settings (id) VALUES (1)').run();
db.prepare('UPDATE site_settings SET maintenance_mode = 0 WHERE id = 1').run();

// Upgrade legacy first 'owner' account to 'site_owner' safely
const siteOwnerCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'site_owner'").get().count;
if (siteOwnerCount === 0) {
  db.prepare(
    "UPDATE users SET role = 'site_owner', avatar_frame = 'gold_royal', nameplate_style = 'crimson_royal' WHERE id = (SELECT id FROM users WHERE role = 'owner' ORDER BY id ASC LIMIT 1)"
  ).run();
}

// Seed default Arabic chat rooms if empty
const roomCount = db.prepare('SELECT COUNT(*) AS count FROM rooms').get().count;
if (roomCount === 0) {
  const insertRoom = db.prepare(
    'INSERT INTO rooms (id, name, description, icon, image_url, bg_theme, mics_enabled, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertRoom.run(
    'general',
    'الغرفة العامة',
    'الغرفة الرئيسية للتعارف والدردشة المباشرة للجميع',
    '💬',
    '/assets/rooms/general.svg',
    'warm_peach',
    1,
    'system'
  );
  insertRoom.run(
    'competitions',
    'غرفة المسابقات',
    'تحديات ثقافية وألغاز ومسابقات تفاعلية ممتعة',
    '🏆',
    '/assets/rooms/competitions.svg',
    'sunset_rose',
    1,
    'system'
  );
  insertRoom.run(
    'tech-games',
    'التقنية والألعاب',
    'نقاشات البرمجة والتقنية وأحدث الألعاب الإلكترونية',
    '🎮',
    '/assets/rooms/tech.svg',
    'sky_breeze',
    1,
    'system'
  );
} else {
  const defaultRoomImages = {
    general: '/assets/rooms/general.svg',
    competitions: '/assets/rooms/competitions.svg',
    'tech-games': '/assets/rooms/tech.svg'
  };
  const existingRooms = db.prepare("SELECT id, image_url FROM rooms WHERE image_url IS NULL OR image_url = ''").all();
  const updRoomImg = db.prepare('UPDATE rooms SET image_url = ? WHERE id = ?');
  for (const r of existingRooms) {
    updRoomImg.run(defaultRoomImages[r.id] || '/assets/rooms/default.svg', r.id);
  }
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
  return db
    .prepare('SELECT * FROM ranks ORDER BY power DESC, tier_order DESC, created_at ASC')
    .all()
    .map(mapRankRow);
}

function getRankByKey(key) {
  const row = db.prepare('SELECT * FROM ranks WHERE key = ?').get(key);
  if (row) return mapRankRow(row);
  const member = db.prepare("SELECT * FROM ranks WHERE key = 'member'").get();
  return mapRankRow(member) || DEFAULT_RANKS.find((r) => r.key === 'member');
}

function getRankPower(role) {
  const row = db.prepare('SELECT power, tier_order FROM ranks WHERE key = ?').get(role);
  return row ? Number(row.power) || 0 : 0;
}

function getRankSortWeight(role) {
  const row = db.prepare('SELECT power, tier_order FROM ranks WHERE key = ?').get(role);
  return row ? (Number(row.power) || 0) * 100 + (Number(row.tier_order) || 0) : 0;
}

function isValidRank(role) {
  if (!role || role === 'guest') return false;
  const row = db.prepare('SELECT key FROM ranks WHERE key = ?').get(role);
  return Boolean(row);
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
  const row = db.prepare(`SELECT ${col} AS val FROM ranks WHERE key = ?`).get(role);
  return Boolean(row && row.val === 1);
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

  const existing = db.prepare('SELECT key FROM ranks WHERE key = ?').get(safeKey);
  if (existing) return { error: 'مفتاح هذه الرتبة موجود مسبقاً.' };

  const clampedPower = Math.max(1, Math.min(99, Number(power) || 15));
  db.prepare(`
    INSERT INTO ranks (
      key, label, icon, image_url, bg_color, text_color, power, is_system,
      perm_mute, perm_kick, perm_ban, perm_set_rank, perm_clear_room, perm_manage_rooms, perm_access_panel
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    safeKey,
    cleanLabel,
    String(icon || '⭐').trim().slice(0, 8) || '⭐',
    String(imageUrl || '').trim(),
    sanitizeHexColor(bgColor, '#334155'),
    sanitizeHexColor(textColor, '#ffffff'),
    clampedPower,
    permissions.mute ? 1 : 0,
    permissions.kick ? 1 : 0,
    permissions.ban ? 1 : 0,
    permissions.set_rank ? 1 : 0,
    permissions.clear_room ? 1 : 0,
    permissions.manage_rooms ? 1 : 0,
    permissions.access_panel ? 1 : 0
  );
  return { rank: getRankByKey(safeKey) };
}

function updateRank(key, { label, icon, imageUrl, bgColor, textColor, power, permissions }) {
  const existing = db.prepare('SELECT * FROM ranks WHERE key = ?').get(key);
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
  const pm = isOwner ? 1 : p.mute !== undefined ? (p.mute ? 1 : 0) : existing.perm_mute;
  const pk = isOwner ? 1 : p.kick !== undefined ? (p.kick ? 1 : 0) : existing.perm_kick;
  const pb = isOwner ? 1 : p.ban !== undefined ? (p.ban ? 1 : 0) : existing.perm_ban;
  const psr = isOwner ? 1 : p.set_rank !== undefined ? (p.set_rank ? 1 : 0) : existing.perm_set_rank;
  const pcr = isOwner ? 1 : p.clear_room !== undefined ? (p.clear_room ? 1 : 0) : existing.perm_clear_room;
  const pmr = isOwner ? 1 : p.manage_rooms !== undefined ? (p.manage_rooms ? 1 : 0) : existing.perm_manage_rooms;
  const pap = isOwner ? 1 : p.access_panel !== undefined ? (p.access_panel ? 1 : 0) : existing.perm_access_panel;

  db.prepare(`
    UPDATE ranks SET
      label = ?, icon = ?, image_url = ?, bg_color = ?, text_color = ?, power = ?,
      perm_mute = ?, perm_kick = ?, perm_ban = ?, perm_set_rank = ?,
      perm_clear_room = ?, perm_manage_rooms = ?, perm_access_panel = ?
    WHERE key = ?
  `).run(nextLabel, nextIcon, nextImg, nextBg, nextText, nextPower, pm, pk, pb, psr, pcr, pmr, pap, key);

  return { rank: getRankByKey(key) };
}

function deleteRank(key) {
  const existing = db.prepare('SELECT * FROM ranks WHERE key = ?').get(key);
  if (!existing) return { error: 'الرتبة غير موجودة.' };
  if (existing.is_system === 1) return { error: 'لا يمكن حذف الرتب الأساسية للنظام.' };

  const affectedUsers = db.prepare('SELECT id FROM users WHERE role = ?').all(key);
  db.prepare("UPDATE users SET role = 'member' WHERE role = ?").run(key);
  db.prepare("UPDATE messages SET sender_role = 'member' WHERE sender_role = ?").run(key);
  db.prepare('DELETE FROM ranks WHERE key = ?').run(key);
  return { ok: true, affectedUserIds: affectedUsers.map((u) => u.id) };
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
  return db.prepare('SELECT * FROM custom_emojis ORDER BY id DESC').all();
}

function addCustomEmoji({ code, imageUrl, createdBy }) {
  const norm = normalizeEmojiCode(code);
  if (norm.length < 3) return { error: 'أدخل رمز اختصار الإيموجي (مثال: :وردة:).' };
  if (!imageUrl || !String(imageUrl).startsWith('/uploads/emojis/')) {
    return { error: 'يرجى رفع صورة الإيموجي أو الملصق أولاً.' };
  }
  const exists = db.prepare('SELECT id FROM custom_emojis WHERE LOWER(code) = LOWER(?)').get(norm);
  if (exists) return { error: `الرمز "${norm}" مستخدم مسبقاً.` };

  const res = db
    .prepare('INSERT INTO custom_emojis (code, image_url, created_by) VALUES (?, ?, ?)')
    .run(norm, imageUrl, createdBy || '');
  return { emoji: db.prepare('SELECT * FROM custom_emojis WHERE id = ?').get(res.lastInsertRowid) };
}

function deleteCustomEmoji(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return false;
  db.prepare('DELETE FROM custom_emojis WHERE id = ?').run(numId);
  return true;
}

// ==========================================
// SITE SETTINGS & THEME CMS HELPERS
// ==========================================
function getSiteSettings() {
  const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
  return row || {
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
    custom_html: ''
  };
}

function updateSiteSettings(patch = {}) {
  const cur = getSiteSettings();
  const next = {
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
    custom_html: patch.custom_html !== undefined ? String(patch.custom_html).slice(0, 8000) : cur.custom_html
  };

  db.prepare(`
    UPDATE site_settings SET
      site_name = ?, site_description = ?, site_logo = ?, welcome_message = ?,
      maintenance_mode = ?, top_bar_color = ?, bottom_bar_color = ?, button_color = ?,
      font_family = ?, font_size = ?, custom_css = ?, custom_html = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    next.site_name,
    next.site_description,
    next.site_logo,
    next.welcome_message,
    next.maintenance_mode,
    next.top_bar_color,
    next.bottom_bar_color,
    next.button_color,
    next.font_family,
    next.font_size,
    next.custom_css,
    next.custom_html
  );
  return getSiteSettings();
}

function getEffectiveName(userRow) {
  if (!userRow) return '';
  const dn = (userRow.display_name || '').trim();
  return dn || userRow.username;
}

function getUserCount() {
  return db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
}

function registerUser({ username, email, passwordHash, ipAddress }) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db
      .prepare('SELECT id, username, email FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)')
      .get(username, email);
    if (existing) {
      db.exec('ROLLBACK');
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return { error: 'اسم المستخدم مسجل مسبقاً، اختر اسماً آخر.' };
      }
      return { error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    const total = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const role = total === 0 ? 'site_owner' : 'member';
    const nameColor = '#ffffff';
    const avatarFrame = role === 'site_owner' ? 'gold_royal' : 'none';
    const nameplateStyle = role === 'site_owner' ? 'crimson_royal' : 'default';
    const coins = role === 'site_owner' ? 99999 : 1500;

    const result = db
      .prepare(
        `INSERT INTO users (username, email, password_hash, role, display_name, name_color, avatar_frame, nameplate_style, coins, last_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(username, email, passwordHash, role, username, nameColor, avatarFrame, nameplateStyle, coins, ipAddress || '');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    db.exec('COMMIT');
    return { user };
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  }
}

function findUserByIdentifier(identifier) {
  return db
    .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)')
    .get(identifier, identifier);
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUserIp(userId, ipAddress) {
  if (!userId || !ipAddress) return;
  db.prepare('UPDATE users SET last_ip = ? WHERE id = ?').run(ipAddress, userId);
}

function updateUserCustomization(
  userId,
  { displayName, nameColor, textColor, nameBgColor, neonColor, fontFamily, fontStyle, avatarUrl, avatarFrame, nameplateStyle, vipFamily }
) {
  const current = findUserById(userId);
  if (!current) return null;
  const nextDisplay = displayName !== undefined && displayName.trim() ? displayName.trim() : getEffectiveName(current);
  const nextColor = nameColor || current.name_color;
  const nextTextColor = textColor !== undefined ? textColor || '#ffffff' : current.text_color || '#ffffff';
  const nextNameBg = nameBgColor !== undefined ? String(nameBgColor || '').trim().slice(0, 30) : current.name_bg_color || '';
  const nextNeon = neonColor !== undefined ? String(neonColor || '').trim().slice(0, 30) : current.neon_color || '';
  const nextFont = fontFamily !== undefined ? String(fontFamily || 'Normal').trim().slice(0, 40) : current.font_family || 'Normal';
  const nextFontStyle = fontStyle !== undefined ? String(fontStyle || 'Normal').trim().slice(0, 30) : current.font_style || 'Normal';
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url;
  const nextFrame = avatarFrame || current.avatar_frame || 'none';
  const nextPlate = nameplateStyle || current.nameplate_style || 'default';
  const nextFamily = vipFamily !== undefined ? vipFamily.trim().slice(0, 24) : current.vip_family || '';

  db.prepare(
    `UPDATE users SET
      display_name = ?, name_color = ?, text_color = ?, name_bg_color = ?, neon_color = ?,
      font_family = ?, font_style = ?, avatar_url = ?, avatar_frame = ?, nameplate_style = ?, vip_family = ?
     WHERE id = ?`
  ).run(
    nextDisplay,
    nextColor,
    nextTextColor,
    nextNameBg,
    nextNeon,
    nextFont,
    nextFontStyle,
    nextAvatar,
    nextFrame,
    nextPlate,
    nextFamily,
    userId
  );

  return findUserById(userId);
}

function adminCreateUser({ username, displayName, email, passwordHash, role }) {
  const cleanUser = String(username || '').trim().slice(0, 24);
  const cleanDisplay = String(displayName || cleanUser).trim().slice(0, 28) || cleanUser;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const safeRole = isValidRank(role) ? role : 'member';

  const existing = db
    .prepare('SELECT id, username, email FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)')
    .get(cleanUser, cleanEmail);
  if (existing) {
    if (existing.username.toLowerCase() === cleanUser.toLowerCase()) {
      return { error: 'اسم المستخدم مسجل مسبقاً.' };
    }
    return { error: 'البريد الإلكتروني مسجل مسبقاً.' };
  }

  const res = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, role, display_name, name_color, text_color, avatar_frame, nameplate_style, coins)
       VALUES (?, ?, ?, ?, ?, '#ffffff', '#ffffff', 'none', 'default', 1500)`
    )
    .run(cleanUser, cleanEmail, passwordHash, safeRole, cleanDisplay);
  return { user: findUserById(res.lastInsertRowid) };
}

function adminUpdateUserAccount(userId, { displayName, username, email, passwordHash, avatarUrl, role }) {
  const current = findUserById(userId);
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

  const conflict = db
    .prepare('SELECT id, username, email FROM users WHERE id != ? AND (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))')
    .get(userId, nextUsername, nextEmail);
  if (conflict) {
    if (conflict.username.toLowerCase() === nextUsername.toLowerCase()) {
      return { error: 'اسم المستخدم مستخدم لحساب آخر.' };
    }
    return { error: 'البريد الإلكتروني مستخدم لحساب آخر.' };
  }

  db.prepare(
    `UPDATE users SET
      username = ?, display_name = ?, email = ?, password_hash = ?, avatar_url = ?, role = ?
     WHERE id = ?`
  ).run(nextUsername, nextDisplay, nextEmail, nextPasswordHash, nextAvatar, nextRole, userId);

  db.prepare('UPDATE messages SET sender_name = ?, sender_role = ?, avatar_url = ? WHERE sender_key = ?').run(
    nextDisplay,
    nextRole,
    nextAvatar || '',
    `user:${userId}`
  );

  return { user: findUserById(userId) };
}

function spendUserCoins(userId, cost) {
  if (!cost || cost <= 0) return findUserById(userId);
  const current = findUserById(userId);
  if (!current) return null;
  if ((current.coins || 0) < cost) return { error: 'رصيد المحفظة غير كافٍ لإتمام الشراء.' };
  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(cost, userId);
  return { user: findUserById(userId) };
}

function updateUserRole(userId, newRole) {
  if (!isValidRank(newRole)) return null;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
  db.prepare('UPDATE messages SET sender_role = ? WHERE sender_key = ?').run(newRole, `user:${userId}`);
  return findUserById(userId);
}

function forceChangeUserDisplayName(userId, newDisplayName) {
  const clean = String(newDisplayName || '').trim().slice(0, 28);
  if (clean.length < 2) return null;
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(clean, userId);
  return findUserById(userId);
}

function getAllRegisteredUsers() {
  const rows = db
    .prepare(
      `SELECT id, username, email, role, display_name, name_color, text_color, name_bg_color, neon_color, font_family, font_style, avatar_url, avatar_frame, nameplate_style, coins, vip_family, last_ip, is_banned, ban_reason, created_at
       FROM users ORDER BY id ASC`
    )
    .all();
  return rows.sort((a, b) => getRankSortWeight(b.role) - getRankSortWeight(a.role) || a.id - b.id);
}

function getAllRooms() {
  return db.prepare('SELECT * FROM rooms ORDER BY created_at ASC').all();
}

function getRoomById(roomId) {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
}

function getRoomStaff(roomId) {
  return db
    .prepare(
      `SELECT rs.room_id, rs.user_id, rs.staff_role, rs.assigned_by, u.username, u.display_name, u.role, u.avatar_url
       FROM room_staff rs
       JOIN users u ON u.id = rs.user_id
       WHERE rs.room_id = ?
       ORDER BY rs.created_at ASC`
    )
    .all(roomId)
    .map((r) => ({
      roomId: r.room_id,
      userId: r.user_id,
      name: (r.display_name || '').trim() || r.username,
      role: r.role,
      avatarUrl: r.avatar_url || '',
      staffRole: r.staff_role || 'مشرف غرفة',
      assignedBy: r.assigned_by || ''
    }));
}

function setRoomOwner(roomId, ownerUserId) {
  const uid = ownerUserId ? Number(ownerUserId) : null;
  if (!uid || Number.isNaN(uid)) {
    db.prepare("UPDATE rooms SET owner_user_id = NULL, owner_name = '' WHERE id = ?").run(roomId);
    return getRoomById(roomId);
  }
  const u = findUserById(uid);
  if (!u) return null;
  const ownerName = getEffectiveName(u);
  db.prepare('UPDATE rooms SET owner_user_id = ?, owner_name = ? WHERE id = ?').run(uid, ownerName, roomId);
  return getRoomById(roomId);
}

function addRoomStaff(roomId, userId, staffRole = 'مشرف غرفة', assignedBy = '') {
  const uid = Number(userId);
  if (!roomId || Number.isNaN(uid) || !findUserById(uid)) return null;
  db.prepare(
    `INSERT INTO room_staff (room_id, user_id, staff_role, assigned_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(room_id, user_id) DO UPDATE SET staff_role = excluded.staff_role, assigned_by = excluded.assigned_by`
  ).run(roomId, uid, String(staffRole || 'مشرف غرفة').slice(0, 30), assignedBy);
  return getRoomStaff(roomId);
}

function removeRoomStaff(roomId, userId) {
  db.prepare('DELETE FROM room_staff WHERE room_id = ? AND user_id = ?').run(roomId, Number(userId));
  return getRoomStaff(roomId);
}

function isRoomStaffMember(roomId, userId) {
  if (!roomId || !userId) return false;
  const row = db.prepare('SELECT user_id FROM room_staff WHERE room_id = ? AND user_id = ?').get(roomId, Number(userId));
  return Boolean(row);
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
  db.prepare(`
    INSERT INTO rooms (
      id, name, description, icon, image_url, bg_theme,
      wallpaper_url, bg_custom, card_bg_color, card_text_color, welcome_message, room_password, min_rank_power,
      owner_user_id, owner_name, mics_enabled, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    name,
    description || '',
    icon || '💬',
    imageUrl || '/assets/rooms/default.svg',
    bgTheme || 'warm_peach',
    wallpaperUrl || '',
    bgCustom || '',
    sanitizeHexColor(cardBgColor, ''),
    sanitizeHexColor(cardTextColor, ''),
    String(welcomeMessage || '').trim().slice(0, 250),
    String(roomPassword || '').trim().slice(0, 40),
    Math.max(0, Math.min(100, Number(minRankPower) || 0)),
    resolvedOwnerId,
    resolvedOwnerName,
    createdBy || 'owner'
  );
  return getRoomById(id);
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
  const current = getRoomById(roomId);
  if (!current) return null;
  const nextName = name !== undefined && String(name).trim() ? String(name).trim() : current.name;
  const nextDesc = description !== undefined ? String(description).trim() : current.description;
  const nextIcon = icon !== undefined && String(icon).trim() ? String(icon).trim() : current.icon;
  const nextImg = imageUrl !== undefined && String(imageUrl).trim() ? String(imageUrl).trim() : current.image_url;
  const nextBg = bgTheme !== undefined && String(bgTheme).trim() ? String(bgTheme).trim() : current.bg_theme || 'warm_peach';
  const nextWallpaper = wallpaperUrl !== undefined ? String(wallpaperUrl).trim() : current.wallpaper_url || '';
  const nextBgCustom = bgCustom !== undefined ? String(bgCustom).trim().slice(0, 180) : current.bg_custom || '';
  const nextCardBg = cardBgColor !== undefined ? (cardBgColor ? sanitizeHexColor(cardBgColor, '') : '') : current.card_bg_color || '';
  const nextCardText = cardTextColor !== undefined ? (cardTextColor ? sanitizeHexColor(cardTextColor, '') : '') : current.card_text_color || '';
  const nextWelcome =
    welcomeMessage !== undefined ? String(welcomeMessage).trim().slice(0, 250) : current.welcome_message || '';
  const nextPass = roomPassword !== undefined ? String(roomPassword).trim().slice(0, 40) : current.room_password || '';
  const nextMinRank =
    minRankPower !== undefined ? Math.max(0, Math.min(100, Number(minRankPower) || 0)) : Number(current.min_rank_power) || 0;
  const nextMics = micsEnabled !== undefined ? (micsEnabled ? 1 : 0) : current.mics_enabled;

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

  db.prepare(`
    UPDATE rooms SET
      name = ?, description = ?, icon = ?, image_url = ?, bg_theme = ?,
      wallpaper_url = ?, bg_custom = ?, card_bg_color = ?, card_text_color = ?,
      welcome_message = ?, room_password = ?, min_rank_power = ?,
      owner_user_id = ?, owner_name = ?, mics_enabled = ?
    WHERE id = ?
  `).run(
    nextName,
    nextDesc,
    nextIcon,
    nextImg,
    nextBg,
    nextWallpaper,
    nextBgCustom,
    nextCardBg,
    nextCardText,
    nextWelcome,
    nextPass,
    nextMinRank,
    nextOwnerId,
    nextOwnerName,
    nextMics,
    roomId
  );
  return getRoomById(roomId);
}

function deleteRoom(roomId) {
  db.prepare('DELETE FROM room_staff WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM mutes WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
}

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
  mediaUrl
}) {
  const result = db
    .prepare(
      `INSERT INTO messages (
        room_id, sender_key, sender_name, sender_role, name_color, text_color, name_bg_color, neon_color, font_family, font_style,
        avatar_url, avatar_frame, nameplate_style, msg_type, content, media_url
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      roomId,
      senderKey,
      senderName,
      senderRole,
      nameColor || '#ffffff',
      textColor || '#ffffff',
      nameBgColor || '',
      neonColor || '',
      fontFamily || 'Normal',
      fontStyle || 'Normal',
      avatarUrl || '',
      avatarFrame || 'none',
      nameplateStyle || 'default',
      msgType || 'text',
      content || '',
      mediaUrl || ''
    );
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
}

function getRoomMessages(roomId, limit = 90) {
  const rows = db
    .prepare('SELECT * FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT ?')
    .all(roomId, limit);
  return rows.reverse();
}

function clearRoomMessages(roomId) {
  db.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId);
}

function setMute(targetKey, roomId, durationMs, mutedBy) {
  const expiresAt = Date.now() + durationMs;
  db.prepare(
    `INSERT INTO mutes (target_key, room_id, expires_at, muted_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(target_key, room_id) DO UPDATE SET expires_at = excluded.expires_at, muted_by = excluded.muted_by`
  ).run(targetKey, roomId || '*', expiresAt, mutedBy);
  return expiresAt;
}

function removeMute(targetKey, roomId) {
  if (!roomId || roomId === '*') {
    db.prepare('DELETE FROM mutes WHERE target_key = ?').run(targetKey);
  } else {
    db.prepare('DELETE FROM mutes WHERE target_key = ? AND (room_id = ? OR room_id = ?)').run(
      targetKey,
      roomId,
      '*'
    );
  }
}

function getActiveMute(targetKey, roomId) {
  const rows = db
    .prepare('SELECT * FROM mutes WHERE target_key = ? AND (room_id = ? OR room_id = ?)')
    .all(targetKey, roomId || '*', '*');
  for (const row of rows) {
    if (row.expires_at <= Date.now()) {
      db.prepare('DELETE FROM mutes WHERE target_key = ? AND room_id = ?').run(targetKey, row.room_id);
    } else {
      return row;
    }
  }
  return null;
}

function isLoopbackIp(ip) {
  if (!ip) return true;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function banTarget({ targetKey, targetName, email, ipAddress, reason, bannedBy }) {
  db.prepare(
    `INSERT INTO bans (target_key, target_name, email, ip_address, reason, banned_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(target_key) DO UPDATE SET
       target_name = excluded.target_name,
       email = COALESCE(NULLIF(excluded.email, ''), bans.email),
       ip_address = COALESCE(NULLIF(excluded.ip_address, ''), bans.ip_address),
       reason = excluded.reason,
       banned_by = excluded.banned_by,
       created_at = CURRENT_TIMESTAMP`
  ).run(
    targetKey,
    targetName || targetKey,
    (email || '').toLowerCase(),
    ipAddress || '',
    reason || 'حظر نهائي من الإدارة',
    bannedBy || 'الإدارة'
  );

  if (targetKey.startsWith('user:')) {
    const uid = Number(targetKey.replace('user:', ''));
    if (!Number.isNaN(uid)) {
      db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?').run(
        reason || 'حظر نهائي من الإدارة',
        uid
      );
    }
  }
}

function unbanTarget(targetKey) {
  db.prepare('DELETE FROM bans WHERE target_key = ?').run(targetKey);
  if (targetKey.startsWith('user:')) {
    const uid = Number(targetKey.replace('user:', ''));
    if (!Number.isNaN(uid)) {
      db.prepare("UPDATE users SET is_banned = 0, ban_reason = '' WHERE id = ?").run(uid);
    }
  }
}

function getAllBans() {
  return db.prepare('SELECT * FROM bans ORDER BY created_at DESC').all();
}

function isTargetBanned(input) {
  const targetKey = typeof input === 'string' ? input : input?.targetKey || '';
  const email = typeof input === 'object' ? (input?.email || '').toLowerCase() : '';
  const ipAddress = typeof input === 'object' ? input?.ipAddress || '' : '';

  if (targetKey) {
    const banRow = db.prepare('SELECT * FROM bans WHERE target_key = ?').get(targetKey);
    if (banRow) return banRow;
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
    const byEmail = db.prepare('SELECT * FROM bans WHERE LOWER(email) = LOWER(?)').get(email);
    if (byEmail) return byEmail;
  }

  if (ipAddress && !isLoopbackIp(ipAddress)) {
    const byIp = db.prepare('SELECT * FROM bans WHERE ip_address = ?').get(ipAddress);
    if (byIp) return byIp;
  }

  return null;
}

// Social & CodyChat Features
function addPrivateMessage({ fromKey, fromName, fromRole, fromAvatar, toKey, toName, content }) {
  const result = db
    .prepare(
      `INSERT INTO private_messages (from_key, from_name, from_role, from_avatar, to_key, to_name, content, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .run(fromKey, fromName, fromRole, fromAvatar || '', toKey, toName, content);
  return db.prepare('SELECT * FROM private_messages WHERE id = ?').get(result.lastInsertRowid);
}

function getPrivateMessagesForUser(userKey) {
  return db
    .prepare(
      `SELECT * FROM private_messages
       WHERE from_key = ? OR to_key = ?
       ORDER BY id DESC LIMIT 120`
    )
    .all(userKey, userKey);
}

function markPrivateMessagesRead(readerKey, partnerKey) {
  if (!readerKey || !partnerKey) return 0;
  const info = db
    .prepare('UPDATE private_messages SET is_read = 1 WHERE to_key = ? AND from_key = ? AND is_read = 0')
    .run(readerKey, partnerKey);
  return info.changes || 0;
}

function sendFriendRequest({ fromUser, toKey, toName, toRole, toAvatar }) {
  const existing = db
    .prepare('SELECT * FROM friendships WHERE user_key = ? AND friend_key = ?')
    .get(fromUser.key, toKey);
  if (existing) return existing;

  db.prepare(
    `INSERT OR REPLACE INTO friendships (user_key, friend_key, friend_name, friend_role, friend_avatar, status, requested_by)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(fromUser.key, toKey, toName, toRole || 'member', toAvatar || '', fromUser.key);

  db.prepare(
    `INSERT OR REPLACE INTO friendships (user_key, friend_key, friend_name, friend_role, friend_avatar, status, requested_by)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(toKey, fromUser.key, fromUser.name, fromUser.role || 'member', fromUser.avatarUrl || '', fromUser.key);

  return { ok: true };
}

function respondFriendRequest(userKey, friendKey, accept) {
  if (accept) {
    db.prepare(
      "UPDATE friendships SET status = 'accepted' WHERE (user_key = ? AND friend_key = ?) OR (user_key = ? AND friend_key = ?)"
    ).run(userKey, friendKey, friendKey, userKey);
  } else {
    db.prepare(
      'DELETE FROM friendships WHERE (user_key = ? AND friend_key = ?) OR (user_key = ? AND friend_key = ?)'
    ).run(userKey, friendKey, friendKey, userKey);
  }
}

function getFriendsForUser(userKey) {
  return db.prepare('SELECT * FROM friendships WHERE user_key = ? ORDER BY created_at DESC').all(userKey);
}

function addWallPost({ authorKey, authorName, authorRole, avatarUrl, avatarFrame, nameplateStyle, content, imageUrl }) {
  const result = db
    .prepare(
      `INSERT INTO wall_posts (author_key, author_name, author_role, avatar_url, avatar_frame, nameplate_style, content, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      authorKey,
      authorName,
      authorRole,
      avatarUrl || '',
      avatarFrame || 'none',
      nameplateStyle || 'default',
      content,
      imageUrl || ''
    );
  return db.prepare('SELECT * FROM wall_posts WHERE id = ?').get(result.lastInsertRowid);
}

function getWallPosts() {
  return db.prepare('SELECT * FROM wall_posts ORDER BY id DESC LIMIT 40').all();
}

function likeWallPost(postId) {
  db.prepare('UPDATE wall_posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
  return db.prepare('SELECT * FROM wall_posts WHERE id = ?').get(postId);
}

function addReport({ reporterKey, reporterName, targetName, reason, roomId }) {
  const result = db
    .prepare('INSERT INTO reports (reporter_key, reporter_name, target_name, reason, room_id) VALUES (?, ?, ?, ?, ?)')
    .run(reporterKey, reporterName, targetName, reason, roomId || '');
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
}

function getReports() {
  return db.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT 50').all();
}

function addNotification({ targetKey, title, body }) {
  const result = db
    .prepare('INSERT INTO notifications (target_key, title, body) VALUES (?, ?, ?)')
    .run(targetKey, title, body);
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
}

function getNotificationsForUser(userKey) {
  return db
    .prepare("SELECT * FROM notifications WHERE target_key = ? OR target_key = '*' ORDER BY id DESC LIMIT 30")
    .all(userKey);
}

function migrateGuestKeyReferences(oldKey, newKey, newName, newRole) {
  if (!oldKey || !newKey || oldKey === newKey) return;
  db.prepare('UPDATE OR IGNORE mutes SET target_key = ? WHERE target_key = ?').run(newKey, oldKey);
  db.prepare('DELETE FROM mutes WHERE target_key = ?').run(oldKey);
  db.prepare('UPDATE messages SET sender_key = ?, sender_name = ?, sender_role = ? WHERE sender_key = ?').run(
    newKey,
    newName,
    newRole,
    oldKey
  );
  db.prepare('UPDATE private_messages SET from_key = ?, from_name = ?, from_role = ? WHERE from_key = ?').run(
    newKey,
    newName,
    newRole,
    oldKey
  );
  db.prepare('UPDATE private_messages SET to_key = ?, to_name = ? WHERE to_key = ?').run(newKey, newName, oldKey);
}

module.exports = {
  db,
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
