const TOKEN_KEY = 'arabic_chat_token';

const DEFAULT_RANKS_FALLBACK = [
  { key: 'site_owner', label: 'صاحب الموقع', icon: '👑', image_url: '', bg_color: '#b91c1c', text_color: '#fef3c7', power: 100, is_system: true, permissions: { mute: true, kick: true, ban: true, set_rank: true, clear_room: true, manage_rooms: true, access_panel: true } },
  { key: 'super_owner', label: 'سوبر أونر', icon: '💎', image_url: '', bg_color: '#d97706', text_color: '#fffbeb', power: 90, is_system: true, permissions: { mute: true, kick: true, ban: true, set_rank: true, clear_room: true, manage_rooms: true, access_panel: true } },
  { key: 'owner', label: 'أونر', icon: '⭐', image_url: '', bg_color: '#f59e0b', text_color: '#1f1300', power: 80, is_system: true, permissions: { mute: true, kick: true, ban: true, set_rank: true, clear_room: true, manage_rooms: true, access_panel: true } },
  { key: 'super_admin', label: 'سوبر أدمن', icon: '🛡️', image_url: '', bg_color: '#7c3aed', text_color: '#ffffff', power: 70, is_system: true, permissions: { mute: true, kick: true, ban: true, set_rank: false, clear_room: true, manage_rooms: false, access_panel: true } },
  { key: 'admin', label: 'أدمن', icon: '🔰', image_url: '', bg_color: '#0284c7', text_color: '#ffffff', power: 60, is_system: true, permissions: { mute: true, kick: true, ban: true, set_rank: false, clear_room: false, manage_rooms: false, access_panel: true } },
  { key: 'general_mod', label: 'إداري عام', icon: '🎖️', image_url: '', bg_color: '#059669', text_color: '#ffffff', power: 50, is_system: true, permissions: { mute: true, kick: true, ban: false, set_rank: false, clear_room: false, manage_rooms: false, access_panel: true } },
  { key: 'royal_vip', label: 'ملكي', icon: '⚜️', image_url: '', bg_color: '#ea580c', text_color: '#ffffff', power: 40, is_system: true, permissions: {} },
  { key: 'silver_vip', label: 'فضي', icon: '🥈', image_url: '', bg_color: '#94a3b8', text_color: '#0f172a', power: 30, is_system: true, permissions: {} },
  { key: 'member', label: 'عضو', icon: '👤', image_url: '', bg_color: '#334155', text_color: '#f8fafc', power: 10, is_system: true, permissions: {} },
  { key: 'guest', label: 'زائر', icon: '💬', image_url: '', bg_color: '#64748b', text_color: '#ffffff', power: 0, is_system: true, permissions: {} }
];

const PERM_LABELS = [
  { key: 'mute', label: 'كتم المستخدمين' },
  { key: 'kick', label: 'طرد المستخدمين' },
  { key: 'ban', label: 'حظر المستخدمين' },
  { key: 'set_rank', label: 'منح وتعديل الرتب' },
  { key: 'clear_room', label: 'مسح رسائل الغرف' },
  { key: 'manage_rooms', label: 'إدارة الغرف بالكامل' },
  { key: 'access_panel', label: 'دخول لوحة التحكم' }
];

const EMOJIS = [
  '😀', '😂', '🥰', '😍', '😎', '🤩', '🥳', '❤️',
  '💛', '💎', '👑', '🔥', '✨', '🌹', '💐', '🎉',
  '👏', '🙌', '🤝', '🎙️', '🎶', '🏆', '☕', '🌙'
];

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  ranks: [...DEFAULT_RANKS_FALLBACK],
  rankMap: Object.fromEntries(DEFAULT_RANKS_FALLBACK.map((r) => [r.key, r])),
  customEmojis: [],
  siteSettings: null,
  rooms: [],
  activeRoomId: 'general',
  activeRoom: null,
  usersInRoom: [],
  globalOnlineUsers: [],
  micSlots: [null, null, null, null, null],
  micsEnabled: true,
  myMicSlot: null,
  liveMicStream: null,
  liveMicRecorder: null,
  shopCatalog: { frames: [], nameplates: [] },
  socket: null,
  isMuted: false,
  draftColor: '#ffffff',
  draftAvatarUrl: '',
  roomEditorMode: 'create',
  editingRoomId: null,
  draftRoomImageUrl: '/assets/rooms/default.svg',
  draftRoomWallpaperUrl: '',
  pendingPasswordRoom: null,
  editingRankKey: null,
  draftRankImageUrl: '',
  draftEmojiImageUrl: '',
  draftCmsLogoUrl: '',
  activePanelTab: 'online',
  adminOverview: null,
  mediaRecorder: null,
  audioChunks: [],
  recordingInterval: null,
  recordingSeconds: 0
};

// DOM References
const authView = document.getElementById('authView');
const chatView = document.getElementById('chatView');
const authError = document.getElementById('authError');
const firstOwnerNotice = document.getElementById('firstOwnerNotice');
const toastContainer = document.getElementById('toastContainer');

const authTabs = document.querySelectorAll('.auth-tab');
const guestForm = document.getElementById('guestForm');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const profileMenuBtn = document.getElementById('profileMenuBtn');
const profileDropdown = document.getElementById('profileDropdown');
const topMeAvatar = document.getElementById('topMeAvatar');
const dropMeAvatar = document.getElementById('dropMeAvatar');
const dropMeRank = document.getElementById('dropMeRank');
const dropMeName = document.getElementById('dropMeName');
const dropMeCoins = document.getElementById('dropMeCoins');
const dropUpgradeGuestBtn = document.getElementById('dropUpgradeGuestBtn');
const topUpgradeGuestBtn = document.getElementById('topUpgradeGuestBtn');
const dropAdminPanelBtn = document.getElementById('dropAdminPanelBtn');

const openDrawerBtn = document.getElementById('openDrawerBtn');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const whiteDrawer = document.getElementById('whiteDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerRoomImg = document.getElementById('drawerRoomImg');
const drawerRoomName = document.getElementById('drawerRoomName');
const drawerAdminBtn = document.getElementById('drawerAdminBtn');

const micsSlotsEl = document.getElementById('micsSlots');
const leaveMicBtn = document.getElementById('leaveMicBtn');
const micSettingsBtn = document.getElementById('micSettingsBtn');

const bannerRoomImg = document.getElementById('bannerRoomImg');
const bannerRoomName = document.getElementById('bannerRoomName');
const bannerRoomDesc = document.getElementById('bannerRoomDesc');
const bannerOnlineCount = document.getElementById('bannerOnlineCount');
const bannerClearRoomBtn = document.getElementById('bannerClearRoomBtn');

const chatStreamWrap = document.getElementById('chatStreamWrap');
const messagesFeed = document.getElementById('messagesFeed');
const muteBanner = document.getElementById('muteBanner');

const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const emojiPopover = document.getElementById('emojiPopover');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const imageFileInput = document.getElementById('imageFileInput');
const recordAudioBtn = document.getElementById('recordAudioBtn');
const recordingBar = document.getElementById('recordingBar');
const recTimer = document.getElementById('recTimer');
const cancelRecordBtn = document.getElementById('cancelRecordBtn');
const sendRecordBtn = document.getElementById('sendRecordBtn');

const bottomOnlineNum = document.getElementById('bottomOnlineNum');
const modalOnlineCount = document.getElementById('modalOnlineCount');
const onlineUsersModal = document.getElementById('onlineUsersModal');
const onlineModalSearch = document.getElementById('onlineModalSearch');
const globalOnlineList = document.getElementById('globalOnlineList');

const roomsModal = document.getElementById('roomsModal');
const roomsModalList = document.getElementById('roomsModalList');
const roomsModalCreateBtn = document.getElementById('roomsModalCreateBtn');

const shopModal = document.getElementById('shopModal');
const shopWalletBalance = document.getElementById('shopWalletBalance');
const shopContent = document.getElementById('shopContent');

const customizeModal = document.getElementById('customizeModal');
const customizeDisplayName = document.getElementById('customizeDisplayName');
const customizeFamily = document.getElementById('customizeFamily');
const previewAvatar = document.getElementById('previewAvatar');
const previewName = document.getElementById('previewName');
const previewRankBadge = document.getElementById('previewRankBadge');
const customColorPicker = document.getElementById('customColorPicker');
const avatarFileInput = document.getElementById('avatarFileInput');
const chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
const clearAvatarBtn = document.getElementById('clearAvatarBtn');
const saveCustomizeBtn = document.getElementById('saveCustomizeBtn');

const authBrandLogo = document.getElementById('authBrandLogo');
const authSiteName = document.getElementById('authSiteName');
const authSiteDesc = document.getElementById('authSiteDesc');
const maintenanceNoticeBanner = document.getElementById('maintenanceNoticeBanner');
const cmsCustomCssTag = document.getElementById('cmsCustomCssTag');
const cmsCustomHtmlSlot = document.getElementById('cmsCustomHtmlSlot');

const adminPanelModal = document.getElementById('adminPanelModal');
const adminPanelToolbar = document.getElementById('adminPanelToolbar');
const adminSearchInput = document.getElementById('adminSearchInput');
const panelNewRoomBtn = document.getElementById('panelNewRoomBtn');
const panelTabOnline = document.getElementById('panelTabOnline');
const panelTabMembers = document.getElementById('panelTabMembers');
const panelTabBans = document.getElementById('panelTabBans');
const panelTabRooms = document.getElementById('panelTabRooms');
const panelTabRanks = document.getElementById('panelTabRanks');
const panelTabEmojis = document.getElementById('panelTabEmojis');
const panelTabCms = document.getElementById('panelTabCms');
const panelTabReports = document.getElementById('panelTabReports');

const roomEditorModal = document.getElementById('roomEditorModal');
const roomEditorForm = document.getElementById('roomEditorForm');
const roomEditorTitle = document.getElementById('roomEditorTitle');
const roomImagePreview = document.getElementById('roomImagePreview');
const roomImageFileInput = document.getElementById('roomImageFileInput');
const chooseRoomImageBtn = document.getElementById('chooseRoomImageBtn');
const roomNameInput = document.getElementById('roomNameInput');
const roomDescInput = document.getElementById('roomDescInput');
const roomWelcomeInput = document.getElementById('roomWelcomeInput');
const roomPasswordInput = document.getElementById('roomPasswordInput');
const roomMinRankSelect = document.getElementById('roomMinRankSelect');
const roomThemeSelect = document.getElementById('roomThemeSelect');
const roomBgColorPicker = document.getElementById('roomBgColorPicker');
const roomBgCustomInput = document.getElementById('roomBgCustomInput');
const roomWallpaperPreview = document.getElementById('roomWallpaperPreview');
const roomWallpaperFileInput = document.getElementById('roomWallpaperFileInput');
const chooseRoomWallpaperBtn = document.getElementById('chooseRoomWallpaperBtn');
const clearRoomWallpaperBtn = document.getElementById('clearRoomWallpaperBtn');

const roomPasswordModal = document.getElementById('roomPasswordModal');
const roomPasswordForm = document.getElementById('roomPasswordForm');
const roomPasswordModalTitle = document.getElementById('roomPasswordModalTitle');
const roomPasswordDesc = document.getElementById('roomPasswordDesc');
const roomPasswordError = document.getElementById('roomPasswordError');
const roomPasswordPromptInput = document.getElementById('roomPasswordPromptInput');

const broadcastAlertModal = document.getElementById('broadcastAlertModal');
const broadcastModalTitle = document.getElementById('broadcastModalTitle');
const broadcastModalSender = document.getElementById('broadcastModalSender');
const broadcastModalMessage = document.getElementById('broadcastModalMessage');

const featureModal = document.getElementById('featureModal');
const featureModalTitle = document.getElementById('featureModalTitle');
const featureModalBody = document.getElementById('featureModalBody');

const imageLightbox = document.getElementById('imageLightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightboxBtn = document.getElementById('closeLightboxBtn');

const upgradeGuestModal = document.getElementById('upgradeGuestModal');
const upgradeGuestForm = document.getElementById('upgradeGuestForm');
const upgradeUsername = document.getElementById('upgradeUsername');
const upgradeEmail = document.getElementById('upgradeEmail');
const upgradePassword = document.getElementById('upgradePassword');
const upgradeError = document.getElementById('upgradeError');

const notifDot = document.getElementById('notifDot');
const reqDot = document.getElementById('reqDot');
const pmDot = document.getElementById('pmDot');

// Helpers
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setRanksList(ranks) {
  if (!Array.isArray(ranks) || ranks.length === 0) return;
  state.ranks = ranks;
  state.rankMap = Object.fromEntries(ranks.map((r) => [r.key, r]));
}

function getRankInfo(role) {
  return state.rankMap[role] || state.rankMap.member || DEFAULT_RANKS_FALLBACK[8];
}

function getRankPower(role) {
  return Number(getRankInfo(role)?.power ?? 0);
}

function hasPerm(permName, role = state.user?.role) {
  if (!role) return false;
  if (role === 'site_owner') return true;
  const info = getRankInfo(role);
  return Boolean(info?.permissions?.[permName]);
}

function hasPanelAccess(role = state.user?.role) {
  return hasPerm('access_panel', role);
}

function canModerateTarget(targetRole, targetKey) {
  if (!state.user || !targetKey || targetKey === state.user.key) return false;
  if (state.user.role === 'site_owner') return true;
  if (!hasPanelAccess(state.user.role)) return false;
  return getRankPower(state.user.role) > getRankPower(targetRole);
}

function roleBadgeHTML(role) {
  const info = getRankInfo(role);
  const bg = info.bg_color ? `background:${escapeHtml(info.bg_color)};` : '';
  const fg = info.text_color ? `color:${escapeHtml(info.text_color)};` : '';
  const iconHtml = info.image_url
    ? `<img class="rank-icon-img" src="${escapeHtml(info.image_url)}" alt="" />`
    : escapeHtml(info.icon || '⭐');
  return `<span class="role-badge role-${escapeHtml(info.key)}" style="${bg}${fg}">${iconHtml} ${escapeHtml(info.label)}</span>`;
}

function getEffectiveFrame(role, frame) {
  if (frame && frame !== 'none') return frame;
  if (getRankPower(role) >= 70) return 'gold_royal';
  return 'none';
}

function renderAvatarInto(el, name, avatarUrl, nameColor, role = 'member', frame = 'none') {
  el.innerHTML = '';
  const appliedFrame = getEffectiveFrame(role, frame);
  el.classList.remove(
    'avatar-frame-none',
    'avatar-frame-gold_royal',
    'avatar-frame-fire_gold',
    'avatar-frame-diamond_ring',
    'avatar-frame-emerald_crown'
  );
  el.classList.add(`avatar-frame-${appliedFrame}`);

  if (avatarUrl) {
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.alt = name;
    el.appendChild(img);
  } else {
    el.textContent = (name || '?').trim().charAt(0).toUpperCase();
    el.style.color = nameColor || '#ffffff';
  }
}

function applyNameplate(el, name, style, color) {
  el.textContent = name;
  el.className = `nameplate-pill plate-${style || 'default'}`;
  if (color && (!style || style === 'default')) {
    el.style.color = color;
  } else {
    el.style.color = '';
  }
}

function applySiteSettings(settings) {
  if (!settings) return;
  state.siteSettings = settings;
  const siteName = settings.site_name || 'شات الغرف المباشر';
  document.title = `${siteName} — شات عربي متطور`;
  authSiteName.textContent = siteName;
  authSiteDesc.textContent = settings.site_description || 'دردشة عربية فورية • مايكات صوتية • رتب وإطارات ملكية';

  if (settings.site_logo) {
    authBrandLogo.innerHTML = `<img src="${escapeHtml(settings.site_logo)}" alt="شعار الموقع" />`;
  } else {
    authBrandLogo.textContent = '👑';
  }

  maintenanceNoticeBanner.classList.toggle('hidden', settings.maintenance_mode !== 1);

  const rootStyle = document.documentElement.style;
  if (settings.top_bar_color) {
    rootStyle.setProperty('--royal-blue', settings.top_bar_color);
    rootStyle.setProperty('--royal-blue-dark', settings.top_bar_color);
  }
  if (settings.bottom_bar_color) {
    rootStyle.setProperty('--bottom-nav-bg', settings.bottom_bar_color);
  }
  if (settings.button_color) {
    rootStyle.setProperty('--gold-btn', `linear-gradient(135deg, ${settings.button_color}, ${settings.button_color})`);
  }
  if (settings.font_family) {
    rootStyle.setProperty('--chat-font-family', `'${settings.font_family}'`);
  }
  if (settings.font_size) {
    rootStyle.setProperty('--chat-font-size', `${Number(settings.font_size) || 15}px`);
  }

  cmsCustomCssTag.textContent = settings.custom_css || '';

  const customHtml = (settings.custom_html || '').trim();
  if (customHtml) {
    cmsCustomHtmlSlot.innerHTML = customHtml;
    cmsCustomHtmlSlot.classList.remove('hidden');
  } else {
    cmsCustomHtmlSlot.innerHTML = '';
    cmsCustomHtmlSlot.classList.add('hidden');
  }
}

function renderTextWithCustomEmojis(targetEl, text) {
  targetEl.innerHTML = '';
  if (!text) return;
  const emojis = state.customEmojis || [];
  if (emojis.length === 0) {
    targetEl.textContent = text;
    return;
  }

  const byCode = new Map(emojis.map((e) => [e.code.toLowerCase(), e]));
  const escapedCodes = emojis
    .map((e) => e.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${escapedCodes.join('|')})`, 'gi');

  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      targetEl.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const found = byCode.get(match[0].toLowerCase());
    if (found) {
      const img = document.createElement('img');
      img.src = found.image_url;
      img.alt = found.code;
      img.title = found.code;
      img.className = 'custom-chat-emoji';
      targetEl.appendChild(img);
    } else {
      targetEl.appendChild(document.createTextNode(match[0]));
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    targetEl.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function showToast(text, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = text;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function showAuthError(msg) {
  if (!msg) {
    authError.classList.add('hidden');
    authError.textContent = '';
    return;
  }
  authError.textContent = msg;
  authError.classList.remove('hidden');
}

function formatTime(isoOrSql) {
  if (!isoOrSql) return '';
  const normalized = isoOrSql.includes('T') ? isoOrSql : `${isoOrSql.replace(' ', 'T')}Z`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

async function apiJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  if (!(options.body instanceof FormData) && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ غير متوقع.');
  }
  return data;
}

// Auth Switching & Login/Register
authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    authTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    showAuthError('');
    const target = tab.dataset.tab;
    guestForm.classList.toggle('hidden', target !== 'guest');
    loginForm.classList.toggle('hidden', target !== 'login');
    registerForm.classList.toggle('hidden', target !== 'register');
  });
});

function enterChatSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(TOKEN_KEY, token);

  authView.classList.add('hidden');
  chatView.classList.remove('hidden');

  updateMeUI();
  connectSocket();
}

function leaveChatSession(reasonMsg) {
  stopLiveMicCapture();
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  state.token = '';
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);

  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.add('hidden'));
  profileDropdown.classList.add('hidden');
  closeDrawer();

  chatView.classList.add('hidden');
  authView.classList.remove('hidden');
  if (reasonMsg) showAuthError(reasonMsg);
}

function updateMeUI() {
  if (!state.user) return;
  const u = state.user;
  renderAvatarInto(topMeAvatar, u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
  renderAvatarInto(dropMeAvatar, u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
  dropMeRank.innerHTML = roleBadgeHTML(u.role);
  applyNameplate(dropMeName, u.name, u.nameplateStyle, u.nameColor);
  dropMeCoins.textContent = `🪙 ${u.coins ?? 1500} نقطة`;
  shopWalletBalance.textContent = `🪙 ${u.coins ?? 1500} نقطة`;

  const isGuest = u.role === 'guest' || u.type === 'guest';
  const hasPanel = hasPanelAccess(u.role);
  const canManageRooms = hasPerm('manage_rooms', u.role);
  const canClearRoom = hasPerm('clear_room', u.role);

  topUpgradeGuestBtn.classList.toggle('hidden', !isGuest);
  dropUpgradeGuestBtn.classList.toggle('hidden', !isGuest);
  dropAdminPanelBtn.classList.toggle('hidden', !hasPanel);
  drawerAdminBtn.classList.toggle('hidden', !hasPanel);
  micSettingsBtn.classList.toggle('hidden', !hasPanel);
  bannerClearRoomBtn.classList.toggle('hidden', !canClearRoom);
  roomsModalCreateBtn.classList.toggle('hidden', !canManageRooms);
  panelNewRoomBtn.classList.toggle('hidden', !canManageRooms);
}

function openUpgradeGuestModal() {
  if (!state.user) return;
  upgradeError.classList.add('hidden');
  upgradeError.textContent = '';
  upgradeUsername.value = state.user.name || '';
  upgradeEmail.value = '';
  upgradePassword.value = '';
  upgradeGuestModal.classList.remove('hidden');
}

topUpgradeGuestBtn.addEventListener('click', openUpgradeGuestModal);

upgradeGuestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  upgradeError.classList.add('hidden');
  upgradeError.textContent = '';
  const username = upgradeUsername.value.trim();
  const email = upgradeEmail.value.trim();
  const password = upgradePassword.value;
  try {
    const data = await apiJson('/api/auth/upgrade-guest', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem(TOKEN_KEY, data.token);
    if (state.socket) {
      state.socket.auth = { token: data.token };
    }
    updateMeUI();
    upgradeGuestModal.classList.add('hidden');
    if (data.isFirstOwner) {
      showToast('👑 تم ترقية حسابك كأول عضو وحصلت على رتبة صاحب الموقع!');
    } else {
      showToast('✅ تم تسجيل عضويتك بنجاح مع بقائك داخل الغرفة!');
    }
  } catch (err) {
    upgradeError.textContent = err.message;
    upgradeError.classList.remove('hidden');
  }
});

guestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAuthError('');
  const nickname = document.getElementById('guestNickname').value.trim();
  try {
    const data = await apiJson('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ nickname })
    });
    enterChatSession(data.token, data.user);
  } catch (err) {
    showAuthError(err.message);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAuthError('');
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await apiJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    enterChatSession(data.token, data.user);
  } catch (err) {
    showAuthError(err.message);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAuthError('');
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  try {
    const data = await apiJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    if (data.isFirstOwner) {
      showToast('👑 تم تسجيلك كأول حساب وحصلت تلقائياً على رتبة صاحب الموقع!');
    }
    enterChatSession(data.token, data.user);
  } catch (err) {
    showAuthError(err.message);
  }
});

// Topbar Profile Dropdown & White Drawer
profileMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!profileDropdown.contains(e.target) && e.target !== profileMenuBtn) {
    profileDropdown.classList.add('hidden');
  }
  if (!emojiPopover.contains(e.target) && e.target !== emojiToggleBtn) {
    emojiPopover.classList.add('hidden');
  }
});

function openDrawer() {
  whiteDrawer.classList.add('open');
  drawerBackdrop.classList.remove('hidden');
}

function closeDrawer() {
  whiteDrawer.classList.remove('open');
  drawerBackdrop.classList.add('hidden');
}

openDrawerBtn.addEventListener('click', openDrawer);
closeDrawerBtn.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

profileDropdown.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    profileDropdown.classList.add('hidden');
    const act = btn.dataset.action;
    if (act === 'upgrade-guest') openUpgradeGuestModal();
    else if (act === 'edit-profile') openCustomizeModal();
    else if (act === 'chat-settings' || act === 'room-options') openRoomOptionsFeature();
    else if (act === 'wallet') openWalletFeature();
    else if (act === 'admin-panel') openAdminPanel();
    else if (act === 'leave-room') openRoomsModal();
    else if (act === 'logout') leaveChatSession('');
  });
});

document.querySelectorAll('[data-drawer]').forEach((btn) => {
  btn.addEventListener('click', () => {
    closeDrawer();
    const target = btn.dataset.drawer;
    if (target === 'wall') openWallModal();
    else if (target === 'news') openNewsModal();
    else if (target === 'mics') openMicsModal();
    else if (target === 'families') openLeaderboardsModal('families');
    else if (target === 'vips') openLeaderboardsModal('vips');
    else if (target === 'rich') openLeaderboardsModal('rich');
    else if (target === 'rooms') openRoomsModal();
    else if (target === 'admin') openAdminPanel();
  });
});

// Topbar Quick Buttons
document.getElementById('topReportBtn').addEventListener('click', openReportModal);
document.getElementById('topNotifBtn').addEventListener('click', () => {
  notifDot.classList.add('hidden');
  openNotificationsModal();
});
document.getElementById('topRequestBtn').addEventListener('click', () => {
  reqDot.classList.add('hidden');
  openFriendsModal('requests');
});
document.getElementById('topPmBtn').addEventListener('click', () => {
  pmDot.classList.add('hidden');
  openPrivateMessagesModal();
});
document.getElementById('topRichBtn').addEventListener('click', () => openLeaderboardsModal('rich'));
document.getElementById('topVipBtn').addEventListener('click', () => openLeaderboardsModal('vips'));

// Bottom 5 Nav Buttons
document.getElementById('navFriendsBtn').addEventListener('click', () => openFriendsModal('friends'));
document.getElementById('navOnlineBtn').addEventListener('click', () => {
  onlineModalSearch.value = '';
  renderGlobalOnlineModal();
  onlineUsersModal.classList.remove('hidden');
});
document.getElementById('navRoomsBtn').addEventListener('click', openRoomsModal);
document.getElementById('navRefreshBtn').addEventListener('click', () => {
  if (state.socket) {
    state.socket.emit('refresh_room', state.activeRoomId);
    showToast('🔄 تم تحديث بيانات الغرفة والرسائل');
  }
});
document.getElementById('navShopBtn').addEventListener('click', openShopModal);

// Emoji Picker Setup (Standard + Custom Uploaded Stickers)
function rebuildEmojiPopover() {
  emojiPopover.innerHTML = '';

  const stdTitle = document.createElement('div');
  stdTitle.className = 'emoji-section-title';
  stdTitle.textContent = 'إيموجي سريع';
  emojiPopover.appendChild(stdTitle);

  const stdGrid = document.createElement('div');
  stdGrid.className = 'emoji-grid';
  EMOJIS.forEach((emo) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'emoji-btn';
    b.textContent = emo;
    b.addEventListener('click', () => {
      messageInput.value += emo;
      messageInput.focus();
    });
    stdGrid.appendChild(b);
  });
  emojiPopover.appendChild(stdGrid);

  if (state.customEmojis && state.customEmojis.length > 0) {
    const custTitle = document.createElement('div');
    custTitle.className = 'emoji-section-title';
    custTitle.textContent = 'ملصقات وإيموجيات الموقع المخصصة';
    emojiPopover.appendChild(custTitle);

    const custGrid = document.createElement('div');
    custGrid.className = 'emoji-grid';
    state.customEmojis.forEach((ce) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-btn';
      b.title = ce.code;
      const img = document.createElement('img');
      img.src = ce.image_url;
      img.alt = ce.code;
      b.appendChild(img);
      b.addEventListener('click', () => {
        const prefix = messageInput.value && !messageInput.value.endsWith(' ') ? ' ' : '';
        messageInput.value += `${prefix}${ce.code} `;
        messageInput.focus();
      });
      custGrid.appendChild(b);
    });
    emojiPopover.appendChild(custGrid);
  }
}

rebuildEmojiPopover();

emojiToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  emojiPopover.classList.toggle('hidden');
});

// ==========================================
// SOCKET.IO REAL-TIME CONNECTION
// ==========================================
function connectSocket() {
  if (state.socket) {
    state.socket.disconnect();
  }

  const socket = io({
    auth: { token: state.token }
  });
  state.socket = socket;

  socket.on('connect', () => {
    socket.emit('join_room', state.activeRoomId || 'general');
  });

  socket.on('connect_error', (err) => {
    if (err.message && err.message.startsWith('BANNED:')) {
      leaveChatSession(`⛔ تم حظرك نهائياً: ${err.message.slice(7)}`);
    } else if (err.message && err.message.startsWith('MAINTENANCE:')) {
      leaveChatSession(`🛠️ ${err.message.slice(12)}`);
    } else if (err.message === 'UNAUTHORIZED') {
      leaveChatSession('انتهت صلاحية الجلسة، يرجى الدخول مجدداً.');
    }
  });

  socket.on('ranks_updated', (ranks) => {
    setRanksList(ranks);
    updateMeUI();
    messagesFeed.querySelectorAll('.cody-msg-row').forEach((row) => {
      const slot = row.querySelector('.msg-rank-slot');
      const rKey = row.dataset.senderRole;
      if (slot && rKey) slot.innerHTML = roleBadgeHTML(rKey);
    });
    if (!onlineUsersModal.classList.contains('hidden')) renderGlobalOnlineModal();
    if (!adminPanelModal.classList.contains('hidden')) loadAdminOverview();
  });

  socket.on('emojis_updated', (emojis) => {
    state.customEmojis = emojis || [];
    rebuildEmojiPopover();
    if (!adminPanelModal.classList.contains('hidden') && state.activePanelTab === 'emojis') {
      loadAdminOverview();
    }
  });

  socket.on('site_settings_updated', (settings) => {
    applySiteSettings(settings);
    if (!adminPanelModal.classList.contains('hidden') && state.activePanelTab === 'cms') {
      loadAdminOverview();
    }
  });

  socket.on('room_password_required', ({ roomId, roomName, wrongPassword }) => {
    state.pendingPasswordRoom = { roomId, roomName };
    roomPasswordModalTitle.textContent = `🔒 دخول: ${roomName || 'غرفة محمية'}`;
    roomPasswordDesc.textContent = 'هذه الغرفة محمية بكلمة مرور من الإدارة، يرجى إدخال كلمة المرور للمتابعة.';
    roomPasswordPromptInput.value = '';
    roomPasswordError.classList.toggle('hidden', !wrongPassword);
    roomPasswordError.textContent = wrongPassword ? '❌ كلمة مرور الغرفة غير صحيحة، حاول مجدداً.' : '';
    roomPasswordModal.classList.remove('hidden');
  });

  socket.on('broadcast_alert', (payload) => {
    if (!payload) return;
    broadcastModalTitle.textContent = payload.title || '📢 إعلان عام من الإدارة';
    const senderBadge = payload.senderRole ? getRankInfo(payload.senderRole).label : 'الإدارة';
    broadcastModalSender.textContent = `مرسل الإعلان: ${payload.senderName || 'الإدارة'} (${senderBadge})`;
    broadcastModalMessage.textContent = payload.message || '';
    broadcastAlertModal.classList.remove('hidden');
  });

  socket.on('session_updated', ({ user, token }) => {
    if (!user) return;
    const prevRole = state.user?.role;
    state.user = user;
    if (token) {
      state.token = token;
      localStorage.setItem(TOKEN_KEY, token);
    }
    updateMeUI();
    if (prevRole && prevRole !== user.role) {
      const rankLabel = getRankInfo(user.role)?.label || user.role;
      showToast(`⭐ تم تحديث رتبتك إلى: ${rankLabel}`);
    }
    if (!adminPanelModal.classList.contains('hidden')) {
      if (hasPanelAccess(user.role)) loadAdminOverview();
      else adminPanelModal.classList.add('hidden');
    }
  });

  socket.on('rooms_list', (rooms) => {
    state.rooms = rooms;
    const active = rooms.find((r) => r.id === state.activeRoomId);
    if (active) applyActiveRoomBanner(active);
    if (!roomsModal.classList.contains('hidden')) renderRoomsModalList();
  });

  socket.on('room_joined', ({ room, messages, muteInfo, mics }) => {
    state.activeRoomId = room.id;
    state.activeRoom = room;
    applyActiveRoomBanner(room);
    setMuteState(Boolean(muteInfo));
    renderMessages(messages);
    if (mics) {
      state.micSlots = mics.slots || [null, null, null, null, null];
      state.micsEnabled = mics.micsEnabled !== false;
      renderMicsBar();
    }
  });

  socket.on('room_history_sync', ({ roomId, messages }) => {
    if (roomId === state.activeRoomId) renderMessages(messages);
  });

  socket.on('room_updated', (room) => {
    if (room.id === state.activeRoomId) {
      state.activeRoom = room;
      applyActiveRoomBanner(room);
    }
  });

  socket.on('force_join_room', ({ roomId, message }) => {
    if (message) showToast(message);
    socket.emit('join_room', roomId);
  });

  socket.on('room_users', ({ roomId, users }) => {
    if (roomId !== state.activeRoomId) return;
    state.usersInRoom = users;
    bannerOnlineCount.textContent = `👥 ${users.length} متواجد`;
  });

  socket.on('online_users_global', (users) => {
    state.globalOnlineUsers = users || [];
    bottomOnlineNum.textContent = String(state.globalOnlineUsers.length);
    modalOnlineCount.textContent = String(state.globalOnlineUsers.length);
    if (!onlineUsersModal.classList.contains('hidden')) {
      renderGlobalOnlineModal();
    }
  });

  socket.on('room_mics', ({ roomId, micsEnabled, slots }) => {
    if (roomId !== state.activeRoomId) return;
    state.micsEnabled = micsEnabled;
    state.micSlots = slots || [null, null, null, null, null];
    const mySlotObj = state.micSlots.find((s) => s && s.key === state.user?.key);
    state.myMicSlot = mySlotObj ? mySlotObj.slot : null;
    if (!state.myMicSlot) stopLiveMicCapture();
    renderMicsBar();
  });

  socket.on('mic_force_left', ({ message }) => {
    stopLiveMicCapture();
    showToast(message || 'تم إنزالك من المايك', 'error');
  });

  socket.on('mic_audio_chunk', ({ roomId, audioData }) => {
    if (roomId !== state.activeRoomId || !audioData) return;
    try {
      const audio = new Audio(audioData);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    } catch {
      // ignore playback restriction before gesture
    }
  });

  socket.on('new_message', (msg) => {
    if (msg.room_id !== state.activeRoomId) return;
    appendMessage(msg);
  });

  socket.on('room_cleared', ({ roomId, message }) => {
    if (roomId !== state.activeRoomId) return;
    messagesFeed.innerHTML = '';
    appendSystemNotice(message);
    showToast(message);
  });

  socket.on('room_created', (room) => {
    showToast(`تم إنشاء غرفة "${room.name}" بنجاح!`);
    socket.emit('join_room', room.id);
  });

  socket.on('system_notice', ({ roomId, text }) => {
    if (roomId === state.activeRoomId) {
      appendSystemNotice(text);
    }
  });

  socket.on('mute_status', ({ isMuted }) => {
    setMuteState(isMuted);
    showToast(isMuted ? '⚠️ أنت مكتوم من قبل الإدارة' : '🔊 تم فك الكتم عنك.', isMuted ? 'error' : 'info');
  });

  socket.on('kicked_from_chat', ({ message }) => {
    leaveChatSession(message || '👢 تم طردك من الشات بواسطة الإدارة');
  });

  socket.on('banned_forever', ({ reason }) => {
    leaveChatSession(`⛔ تم حظرك نهائياً من الشات: ${reason}`);
  });

  socket.on('new_pm', (pm) => {
    if (pm.from_key !== state.user?.key) {
      pmDot.classList.remove('hidden');
      showToast(`✉️ رسالة خاصة من ${pm.from_name}`);
    }
  });

  socket.on('new_notification', ({ title }) => {
    notifDot.classList.remove('hidden');
    if (title?.includes('صداقة')) reqDot.classList.remove('hidden');
    showToast(`🔔 ${title}`);
  });

  socket.on('admin_panel_dirty', () => {
    if (!adminPanelModal.classList.contains('hidden')) {
      loadAdminOverview();
    }
  });

  socket.on('user_rank_updated', ({ oldKey, targetKey, newRole, name }) => {
    const keysToMatch = [oldKey, targetKey].filter(Boolean);
    if (keysToMatch.length === 0 || !newRole) return;
    messagesFeed.querySelectorAll('.cody-msg-row').forEach((row) => {
      if (keysToMatch.includes(row.dataset.senderKey)) {
        row.dataset.senderKey = targetKey;
        row.dataset.senderRole = newRole;
        const slot = row.querySelector('.msg-rank-slot');
        if (slot) slot.innerHTML = roleBadgeHTML(newRole);
        if (name) {
          const plate = row.querySelector('.nameplate-pill');
          if (plate) plate.textContent = name;
        }
      }
    });
    if (!onlineUsersModal.classList.contains('hidden')) {
      renderGlobalOnlineModal();
    }
    if (!adminPanelModal.classList.contains('hidden')) {
      loadAdminOverview();
    }
  });

  socket.on('action_error', ({ message }) => showToast(message, 'error'));
  socket.on('action_success', ({ message }) => showToast(message));
}

function applyActiveRoomBanner(room) {
  const img = room.image_url || '/assets/rooms/default.svg';
  bannerRoomImg.src = img;
  drawerRoomImg.src = img;
  bannerRoomName.textContent = room.name;
  drawerRoomName.textContent = room.name;
  bannerRoomDesc.textContent = room.description || 'غرفة دردشة مباشرة';
  if (typeof room.onlineCount === 'number') {
    bannerOnlineCount.textContent = `👥 ${room.onlineCount} متواجد`;
  }
  const theme = room.bg_theme || 'warm_peach';
  chatStreamWrap.className = `chat-stream theme-${theme}`;
  chatStreamWrap.style.backgroundImage = '';
  chatStreamWrap.style.background = '';

  if (room.wallpaper_url) {
    chatStreamWrap.classList.add('has-wallpaper');
    chatStreamWrap.style.backgroundImage = `linear-gradient(rgba(15,23,42,0.28), rgba(15,23,42,0.34)), url("${room.wallpaper_url}")`;
  } else if (room.bg_custom) {
    chatStreamWrap.style.background = room.bg_custom;
  }
}

function setMuteState(muted) {
  state.isMuted = muted;
  muteBanner.classList.toggle('hidden', !muted);
  messageInput.disabled = muted;
  messageInput.placeholder = muted ? '⚠️ أنت مكتوم من قبل الإدارة...' : 'اكتب هنا...';
}

// ==========================================
// 5 VOICE MICS BAR (1..5)
// ==========================================
function renderMicsBar() {
  micsSlotsEl.innerHTML = '';
  for (let i = 0; i < 5; i += 1) {
    const slotNum = i + 1;
    const occupant = state.micSlots[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mic-slot-btn ${occupant ? 'occupied' : ''}`;
    btn.title = occupant ? `المايك ${slotNum}: ${occupant.name}` : `اصعد على المايك رقم ${slotNum}`;

    if (occupant) {
      if (occupant.avatarUrl) {
        const img = document.createElement('img');
        img.src = occupant.avatarUrl;
        img.alt = occupant.name;
        btn.appendChild(img);
      } else {
        btn.textContent = occupant.name.charAt(0).toUpperCase();
      }
    } else {
      btn.textContent = '🎙️';
    }

    const badge = document.createElement('span');
    badge.className = 'mic-num';
    badge.textContent = String(slotNum);
    btn.appendChild(badge);

    btn.addEventListener('click', async () => {
      if (!state.socket) return;
      if (occupant && occupant.key === state.user?.key) {
        state.socket.emit('mic_leave', { roomId: state.activeRoomId });
        stopLiveMicCapture();
        return;
      }
      if (occupant) {
        if (hasPerm('mute') || hasPerm('kick')) {
          if (confirm(`إنزال "${occupant.name}" من المايك رقم ${slotNum}؟`)) {
            state.socket.emit('mic_kick_slot', { roomId: state.activeRoomId, slot: slotNum });
          }
        } else {
          showToast(`المايك ${slotNum} مشغول بواسطة ${occupant.name}`);
        }
        return;
      }
      state.socket.emit('mic_take', { roomId: state.activeRoomId, slot: slotNum });
      await startLiveMicCapture(slotNum);
    });

    micsSlotsEl.appendChild(btn);
  }

  const amOnMic = state.micSlots.some((s) => s && s.key === state.user?.key);
  leaveMicBtn.classList.toggle('hidden', !amOnMic);
}

async function startLiveMicCapture(slotNum) {
  stopLiveMicCapture();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.liveMicStream = stream;
    const rec = new MediaRecorder(stream);
    state.liveMicRecorder = rec;
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0 && state.socket && state.myMicSlot === slotNum) {
        const reader = new FileReader();
        reader.onloadend = () => {
          state.socket?.emit('mic_audio_chunk', {
            roomId: state.activeRoomId,
            slot: slotNum,
            audioData: reader.result
          });
        };
        reader.readAsDataURL(ev.data);
      }
    };
    rec.start(1600);
  } catch {
    showToast('صعدت على المايك (بدون إذن ميكروفون المتصفح حالياً).');
  }
}

function stopLiveMicCapture() {
  if (state.liveMicRecorder && state.liveMicRecorder.state !== 'inactive') {
    try {
      state.liveMicRecorder.stop();
    } catch {
      // ignore
    }
  }
  state.liveMicRecorder = null;
  if (state.liveMicStream) {
    state.liveMicStream.getTracks().forEach((t) => t.stop());
    state.liveMicStream = null;
  }
}

leaveMicBtn.addEventListener('click', () => {
  stopLiveMicCapture();
  state.socket?.emit('mic_leave', { roomId: state.activeRoomId });
});

micSettingsBtn.addEventListener('click', openMicsModal);

// ==========================================
// MESSAGES RENDERING & COMPOSER
// ==========================================
function renderMessages(messages) {
  messagesFeed.innerHTML = '';
  if (!messages || messages.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-feed';
    empty.textContent = 'لا توجد رسائل بعد في هذه الغرفة. ابدأ الدردشة الآن!';
    messagesFeed.appendChild(empty);
    return;
  }
  for (const m of messages) {
    appendMessage(m, false);
  }
  chatStreamWrap.scrollTop = chatStreamWrap.scrollHeight;
}

function appendSystemNotice(text) {
  const empty = messagesFeed.querySelector('.empty-feed');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.className = 'system-notice';
  div.textContent = text;
  messagesFeed.appendChild(div);
  chatStreamWrap.scrollTop = chatStreamWrap.scrollHeight;
}

function appendMessage(msg, scroll = true) {
  const empty = messagesFeed.querySelector('.empty-feed');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = 'cody-msg-row';
  row.dataset.senderKey = msg.sender_key || '';
  row.dataset.senderRole = msg.sender_role || 'member';

  const av = document.createElement('div');
  av.className = 'avatar-circle clickable-user-trigger';
  renderAvatarInto(av, msg.sender_name, msg.avatar_url, msg.name_color, msg.sender_role, msg.avatar_frame);

  const body = document.createElement('div');
  body.className = 'cody-msg-body';

  const inline = document.createElement('div');
  inline.className = 'cody-msg-inline';

  inline.insertAdjacentHTML('beforeend', `<span class="msg-rank-slot">${roleBadgeHTML(msg.sender_role)}</span>`);

  const nameplate = document.createElement('span');
  applyNameplate(nameplate, msg.sender_name, msg.nameplate_style, msg.name_color);
  nameplate.classList.add('clickable-user-trigger');
  inline.appendChild(nameplate);

  const openSenderCard = () => {
    const sk = row.dataset.senderKey;
    if (!sk) return;
    const match = state.globalOnlineUsers.find((u) => u.key === sk);
    if (match) {
      openQuickUserModal(match);
      return;
    }
    const parsedId = sk.startsWith('user:') ? Number(sk.slice(5)) : null;
    openQuickUserModal({
      key: sk,
      userId: parsedId && !Number.isNaN(parsedId) ? parsedId : null,
      name: nameplate.textContent || msg.sender_name,
      role: row.dataset.senderRole || msg.sender_role,
      nameColor: msg.name_color,
      avatarUrl: msg.avatar_url,
      avatarFrame: msg.avatar_frame,
      nameplateStyle: msg.nameplate_style,
      roomName: 'غير متصل حالياً',
      isMuted: false
    });
  };
  av.addEventListener('click', openSenderCard);
  nameplate.addEventListener('click', openSenderCard);

  if (msg.content) {
    const txt = document.createElement('span');
    txt.className = 'msg-text-cody';
    renderTextWithCustomEmojis(txt, msg.content);
    inline.appendChild(txt);
  }

  const time = document.createElement('span');
  time.className = 'msg-time-cody';
  time.textContent = formatTime(msg.created_at);
  inline.appendChild(time);

  body.appendChild(inline);

  if (msg.msg_type === 'image' && msg.media_url) {
    const img = document.createElement('img');
    img.className = 'msg-image';
    img.src = msg.media_url;
    img.alt = 'صورة مرسلة';
    img.addEventListener('click', () => {
      lightboxImg.src = msg.media_url;
      imageLightbox.classList.remove('hidden');
    });
    body.appendChild(img);
  } else if (msg.msg_type === 'audio' && msg.media_url) {
    const audio = document.createElement('audio');
    audio.className = 'msg-audio';
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = msg.media_url;
    body.appendChild(audio);
  }

  row.appendChild(av);
  row.appendChild(body);
  messagesFeed.appendChild(row);

  if (scroll) {
    chatStreamWrap.scrollTop = chatStreamWrap.scrollHeight;
  }
}

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.socket) return;
  if (state.isMuted) {
    showToast('⚠️ أنت مكتوم من قبل الإدارة', 'error');
    return;
  }
  const content = messageInput.value.trim();
  if (!content) return;

  state.socket.emit('send_message', {
    roomId: state.activeRoomId,
    msgType: 'text',
    content
  });
  messageInput.value = '';
  messageInput.focus();
});

uploadImageBtn.addEventListener('click', () => {
  if (state.isMuted) {
    showToast('⚠️ أنت مكتوم من قبل الإدارة', 'error');
    return;
  }
  imageFileInput.click();
});

imageFileInput.addEventListener('change', async () => {
  const file = imageFileInput.files?.[0];
  imageFileInput.value = '';
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  try {
    showToast('جاري رفع الصورة...');
    const { url } = await apiJson('/api/upload/image', {
      method: 'POST',
      body: formData
    });
    state.socket.emit('send_message', {
      roomId: state.activeRoomId,
      msgType: 'image',
      mediaUrl: url,
      content: ''
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Voice Message Recorder
function stopRecorderCleanup(stream) {
  if (state.recordingInterval) {
    clearInterval(state.recordingInterval);
    state.recordingInterval = null;
  }
  if (stream) stream.getTracks().forEach((t) => t.stop());
  state.mediaRecorder = null;
  state.audioChunks = [];
  recordingBar.classList.add('hidden');
  recordAudioBtn.classList.remove('recording');
}

function updateTimerDisplay() {
  const mins = String(Math.floor(state.recordingSeconds / 60)).padStart(2, '0');
  const secs = String(state.recordingSeconds % 60).padStart(2, '0');
  recTimer.textContent = `${mins}:${secs}`;
}

recordAudioBtn.addEventListener('click', async () => {
  if (state.isMuted) {
    showToast('⚠️ أنت مكتوم من قبل الإدارة', 'error');
    return;
  }
  if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
    sendRecordBtn.click();
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('متصفحك لا يدعم تسجيل الصوت.', 'error');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    state.audioChunks = [];
    state.recordingSeconds = 0;
    updateTimerDisplay();

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) state.audioChunks.push(ev.data);
    };

    recorder.onstop = async () => {
      const shouldSend = recorder._sendOnStop;
      const chunks = [...state.audioChunks];
      stopRecorderCleanup(stream);

      if (!shouldSend || chunks.length === 0) return;

      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const fd = new FormData();
      fd.append('file', blob, `voice-${Date.now()}.webm`);
      try {
        showToast('جاري إرسال الرسالة الصوتية...');
        const { url } = await apiJson('/api/upload/audio', {
          method: 'POST',
          body: fd
        });
        state.socket.emit('send_message', {
          roomId: state.activeRoomId,
          msgType: 'audio',
          mediaUrl: url,
          content: ''
        });
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    recorder._sendOnStop = false;
    state.mediaRecorder = recorder;
    recorder.start();
    recordingBar.classList.remove('hidden');
    recordAudioBtn.classList.add('recording');

    state.recordingInterval = setInterval(() => {
      state.recordingSeconds += 1;
      updateTimerDisplay();
      if (state.recordingSeconds >= 120 && state.mediaRecorder?.state === 'recording') {
        recorder._sendOnStop = true;
        recorder.stop();
      }
    }, 1000);
  } catch {
    showToast('تعذر الوصول للميكروفون.', 'error');
  }
});

cancelRecordBtn.addEventListener('click', () => {
  if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
    state.mediaRecorder._sendOnStop = false;
    state.mediaRecorder.stop();
  }
});

sendRecordBtn.addEventListener('click', () => {
  if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
    state.mediaRecorder._sendOnStop = true;
    state.mediaRecorder.stop();
  }
});

bannerClearRoomBtn.addEventListener('click', () => {
  if (!state.socket || !hasPerm('clear_room')) return;
  if (confirm('هل تريد مسح جميع رسائل هذه الغرفة؟')) {
    state.socket.emit('admin_clear_room', { roomId: state.activeRoomId });
  }
});

// ==========================================
// ONLINE USERS MODAL & ROOMS MODAL
// ==========================================
function renderGlobalOnlineModal() {
  const q = onlineModalSearch.value.trim().toLowerCase();
  const filtered = state.globalOnlineUsers.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || (u.roomName || '').toLowerCase().includes(q)
  );
  globalOnlineList.innerHTML = '';
  if (filtered.length === 0) {
    globalOnlineList.innerHTML = '<li class="panel-empty">لا يوجد متصلون مطابقون.</li>';
    return;
  }

  for (const u of filtered) {
    const li = document.createElement('li');
    li.className = 'user-row-light';

    const top = document.createElement('div');
    top.className = 'user-row-top';

    const left = document.createElement('div');
    left.className = 'user-left';

    const av = document.createElement('div');
    av.className = 'avatar-circle clickable-user-trigger';
    renderAvatarInto(av, u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);

    const info = document.createElement('div');
    info.className = 'clickable-user-trigger';
    info.innerHTML = `
      <div class="me-name-row">
        ${roleBadgeHTML(u.role)}
        <span class="nameplate-pill plate-${u.nameplateStyle || 'default'}"></span>
      </div>
      <div class="panel-meta-sub">${u.roomName || ''} ${u.isMuted ? '• 🔇 مكتوم' : ''}</div>
    `;
    info.querySelector('.nameplate-pill').textContent = u.name;

    const inspectHandler = () => openQuickUserModal(u);
    av.addEventListener('click', inspectHandler);
    info.addEventListener('click', inspectHandler);

    left.appendChild(av);
    left.appendChild(info);
    top.appendChild(left);
    li.appendChild(top);

    if (state.user && u.key !== state.user.key) {
      const actions = document.createElement('div');
      actions.className = 'owner-actions';

      const pmBtn = document.createElement('button');
      pmBtn.type = 'button';
      pmBtn.className = 'mod-btn';
      pmBtn.textContent = '✉️ خاص';
      pmBtn.addEventListener('click', () => {
        onlineUsersModal.classList.add('hidden');
        openPrivateMessagesModal(u);
      });

      const addFriendBtn = document.createElement('button');
      addFriendBtn.type = 'button';
      addFriendBtn.className = 'mod-btn';
      addFriendBtn.textContent = '🤝 صداقة';
      addFriendBtn.addEventListener('click', async () => {
        try {
          const r = await apiJson('/api/social/friend-request', {
            method: 'POST',
            body: JSON.stringify({ toKey: u.key, toName: u.name, toRole: u.role, toAvatar: u.avatarUrl })
          });
          showToast(r.message);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      actions.appendChild(pmBtn);
      actions.appendChild(addFriendBtn);

      if (hasPerm('set_rank') && u.userId && canModerateTarget(u.role, u.key)) {
        const rankWrap = document.createElement('div');
        rankWrap.className = 'rank-control-wrap';
        const lbl = document.createElement('span');
        lbl.className = 'rank-control-label';
        lbl.textContent = '👑 رتبة:';
        rankWrap.appendChild(lbl);
        rankWrap.appendChild(buildRankSelect(u.role, u.userId));
        actions.appendChild(rankWrap);
      }

      if (canModerateTarget(u.role, u.key)) {
        if (hasPerm('mute')) {
          const muteBtn = document.createElement('button');
          muteBtn.type = 'button';
          muteBtn.className = 'mod-btn warn';
          muteBtn.textContent = u.isMuted ? '🔊 فك كتم' : '🔇 كتم';
          muteBtn.addEventListener('click', () => {
            state.socket.emit('admin_mute', {
              targetKey: u.key,
              roomId: u.roomId || state.activeRoomId,
              minutes: u.isMuted ? 0 : 60
            });
          });
          actions.appendChild(muteBtn);
        }

        if (hasPerm('kick')) {
          const kickBtn = document.createElement('button');
          kickBtn.type = 'button';
          kickBtn.className = 'mod-btn';
          kickBtn.textContent = '👢 طرد';
          kickBtn.addEventListener('click', () => {
            state.socket.emit('admin_kick', { targetKey: u.key, roomId: u.roomId });
          });
          actions.appendChild(kickBtn);
        }

        if (hasPerm('ban')) {
          const banBtn = document.createElement('button');
          banBtn.type = 'button';
          banBtn.className = 'mod-btn danger';
          banBtn.textContent = '⛔ حظر';
          banBtn.addEventListener('click', () => {
            if (confirm(`حظر "${u.name}" نهائياً؟`)) {
              state.socket.emit('admin_ban', { targetKey: u.key, targetName: u.name, reason: 'حظر نهائي من الإدارة' });
            }
          });
          actions.appendChild(banBtn);
        }
      }
      li.appendChild(actions);
    }

    globalOnlineList.appendChild(li);
  }
}

function openQuickUserModal(u) {
  if (!u || !state.user) return;
  openFeatureModal(`👤 ملف ${u.name}`, (body) => {
    const canRank = hasPerm('set_rank') && u.userId && canModerateTarget(u.role, u.key);
    const canMod = canModerateTarget(u.role, u.key);
    body.innerHTML = `
      <div class="panel-card">
        <div class="user-left">
          <div id="quickUserAvatar" class="avatar-circle avatar-md"></div>
          <div>
            <div class="me-name-row">${roleBadgeHTML(u.role)} <span id="quickUserPlate" class="nameplate-pill"></span></div>
            <div class="panel-meta-sub">${u.roomName || 'متصل الآن'} ${u.isMuted ? '• 🔇 مكتوم' : ''}</div>
          </div>
        </div>
        ${u.key !== state.user.key ? `
          <div id="quickUserActions" class="panel-actions-row" style="margin-top:10px;">
            <button id="quickPmBtn" type="button" class="btn btn-royal btn-xs">✉️ رسالة خاصة</button>
          </div>
        ` : ''}
        ${canRank ? `
          <div id="quickRankBox" class="field-group-light" style="margin-top:10px;">
            <label>👑 منح أو تعديل الرتبة</label>
          </div>
        ` : (hasPerm('set_rank') && !u.userId && u.key !== state.user.key ? '<small class="panel-meta-sub" style="display:block;margin-top:8px;">هذا المستخدم زائر حالياً — يمكن منحه رتبة فور تسجيل عضويته.</small>' : '')}
      </div>
    `;
    renderAvatarInto(document.getElementById('quickUserAvatar'), u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
    applyNameplate(document.getElementById('quickUserPlate'), u.name, u.nameplateStyle, u.nameColor);

    const pmBtn = document.getElementById('quickPmBtn');
    if (pmBtn) {
      pmBtn.onclick = () => {
        featureModal.classList.add('hidden');
        onlineUsersModal.classList.add('hidden');
        openPrivateMessagesModal(u);
      };
    }

    if (canRank) {
      const rankBox = document.getElementById('quickRankBox');
      const sel = buildRankSelect(u.role, u.userId);
      sel.classList.add('light-input');
      rankBox.appendChild(sel);
    }

    if (canMod) {
      const actRow = document.getElementById('quickUserActions');
      if (actRow) {
        if (hasPerm('mute')) {
          const mBtn = document.createElement('button');
          mBtn.type = 'button';
          mBtn.className = 'mod-btn warn';
          mBtn.textContent = u.isMuted ? '🔊 فك كتم' : '🔇 كتم';
          mBtn.onclick = () => {
            state.socket.emit('admin_mute', { targetKey: u.key, roomId: u.roomId || state.activeRoomId, minutes: u.isMuted ? 0 : 60 });
            featureModal.classList.add('hidden');
          };
          actRow.appendChild(mBtn);
        }
        if (hasPerm('kick')) {
          const kBtn = document.createElement('button');
          kBtn.type = 'button';
          kBtn.className = 'mod-btn';
          kBtn.textContent = '👢 طرد';
          kBtn.onclick = () => {
            state.socket.emit('admin_kick', { targetKey: u.key, roomId: u.roomId });
            featureModal.classList.add('hidden');
          };
          actRow.appendChild(kBtn);
        }
        if (hasPerm('ban')) {
          const bBtn = document.createElement('button');
          bBtn.type = 'button';
          bBtn.className = 'mod-btn danger';
          bBtn.textContent = '⛔ حظر';
          bBtn.onclick = () => {
            if (confirm(`حظر "${u.name}" نهائياً؟`)) {
              state.socket.emit('admin_ban', { targetKey: u.key, targetName: u.name, reason: 'حظر نهائي من الإدارة' });
              featureModal.classList.add('hidden');
            }
          };
          actRow.appendChild(bBtn);
        }
      }
    }
  });
}

onlineModalSearch.addEventListener('input', renderGlobalOnlineModal);

function openRoomsModal() {
  renderRoomsModalList();
  roomsModal.classList.remove('hidden');
}

function renderRoomsModalList() {
  roomsModalList.innerHTML = '';
  for (const r of state.rooms) {
    const li = document.createElement('li');
    li.className = 'room-row-light';
    const locks = [];
    if (r.hasPassword) locks.push('<span class="room-lock-chip">🔒 بكلمة مرور</span>');
    if (Number(r.min_rank_power) > 0) locks.push(`<span class="room-lock-chip">🛡️ قوة ${Number(r.min_rank_power)}+</span>`);
    li.innerHTML = `
      <div class="user-row-top">
        <div class="user-left">
          <img class="room-avatar" src="${r.image_url || '/assets/rooms/default.svg'}" alt="" />
          <div>
            <div class="me-name-row"><strong></strong> ${locks.join(' ')}</div>
            <div class="panel-meta-sub">${escapeHtml(r.description || 'غرفة دردشة')} • 👥 ${r.onlineCount || 0}</div>
          </div>
        </div>
        <button type="button" class="btn ${r.id === state.activeRoomId ? 'btn-gold' : 'btn-royal'} btn-sm">
          ${r.id === state.activeRoomId ? 'متواجد هنا' : 'دخول الغرفة'}
        </button>
      </div>
    `;
    li.querySelector('strong').textContent = r.name;
    li.querySelector('button').addEventListener('click', () => {
      if (state.socket && r.id !== state.activeRoomId) {
        state.socket.emit('join_room', r.id);
      }
      roomsModal.classList.add('hidden');
    });
    roomsModalList.appendChild(li);
  }
}

roomsModalCreateBtn.addEventListener('click', () => {
  roomsModal.classList.add('hidden');
  openRoomEditorModal('create');
});

// ==========================================
// SHOP MODAL (FRAMES & NAMEPLATES)
// ==========================================
function openShopModal() {
  if (!state.user) return;
  shopWalletBalance.textContent = `🪙 ${state.user.coins ?? 1500} نقطة`;
  const isFreeForMe = hasPerm('manage_rooms') || hasPerm('set_rank');

  const framesHTML = state.shopCatalog.frames
    .map(
      (f) => `
      <div class="shop-item-card">
        <div class="avatar-circle avatar-frame-${f.id}" style="width:46px;height:46px;">${state.user.name.charAt(0)}</div>
        <strong>${f.name}</strong>
        <small>${isFreeForMe || f.cost === 0 ? 'مجاني لك' : `🪙 ${f.cost}`}</small>
        <button type="button" class="btn ${state.user.avatarFrame === f.id ? 'btn-gold' : 'btn-royal'} btn-xs" data-equip="frame" data-id="${f.id}">
          ${state.user.avatarFrame === f.id ? 'مُفعّل ✓' : 'تفعيل'}
        </button>
      </div>`
    )
    .join('');

  const platesHTML = state.shopCatalog.nameplates
    .map(
      (p) => `
      <div class="shop-item-card">
        <span class="nameplate-pill plate-${p.id}">${state.user.name}</span>
        <strong>${p.name}</strong>
        <small>${isFreeForMe || p.cost === 0 ? 'مجاني لك' : `🪙 ${p.cost}`}</small>
        <button type="button" class="btn ${state.user.nameplateStyle === p.id ? 'btn-gold' : 'btn-royal'} btn-xs" data-equip="nameplate" data-id="${p.id}">
          ${state.user.nameplateStyle === p.id ? 'مُفعّل ✓' : 'تفعيل'}
        </button>
      </div>`
    )
    .join('');

  shopContent.innerHTML = `
    <div>
      <h4>👑 إطارات الصور الذهبية والفاخرة</h4>
      <div class="shop-grid">${framesHTML}</div>
    </div>
    <div style="margin-top:12px;">
      <h4>✨ خلفيات الأسماء المزخرفة</h4>
      <div class="shop-grid">${platesHTML}</div>
    </div>
  `;

  shopContent.querySelectorAll('[data-equip]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const res = await apiJson('/api/shop/equip', {
          method: 'POST',
          body: JSON.stringify({ itemType: btn.dataset.equip, itemId: btn.dataset.id })
        });
        state.user = res.user;
        state.token = res.token;
        localStorage.setItem(TOKEN_KEY, res.token);
        updateMeUI();
        openShopModal();
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  shopModal.classList.remove('hidden');
}

// ==========================================
// PROFILE CUSTOMIZE MODAL
// ==========================================
function syncCustomizePreview() {
  if (!state.user) return;
  const displayName = customizeDisplayName.value.trim() || state.user.name;
  applyNameplate(previewName, displayName, state.user.nameplateStyle, state.draftColor);
  previewRankBadge.innerHTML = roleBadgeHTML(state.user.role);
  renderAvatarInto(previewAvatar, displayName, state.draftAvatarUrl, state.draftColor, state.user.role, state.user.avatarFrame);
  customColorPicker.value = state.draftColor;
}

function openCustomizeModal() {
  if (!state.user) return;
  customizeDisplayName.value = state.user.name || '';
  customizeFamily.value = state.user.vipFamily || '';
  state.draftColor = state.user.nameColor || '#ffffff';
  state.draftAvatarUrl = state.user.avatarUrl || '';
  syncCustomizePreview();
  customizeModal.classList.remove('hidden');
}

customizeDisplayName.addEventListener('input', syncCustomizePreview);

document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.draftColor = btn.dataset.color;
    syncCustomizePreview();
  });
});

customColorPicker.addEventListener('input', (e) => {
  state.draftColor = e.target.value;
  syncCustomizePreview();
});

chooseAvatarBtn.addEventListener('click', () => avatarFileInput.click());

avatarFileInput.addEventListener('change', async () => {
  const file = avatarFileInput.files?.[0];
  avatarFileInput.value = '';
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    showToast('جاري رفع الصورة...');
    const { url } = await apiJson('/api/upload/avatar', { method: 'POST', body: fd });
    state.draftAvatarUrl = url;
    syncCustomizePreview();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

clearAvatarBtn.addEventListener('click', () => {
  state.draftAvatarUrl = '';
  syncCustomizePreview();
});

saveCustomizeBtn.addEventListener('click', async () => {
  const displayName = customizeDisplayName.value.trim();
  if (displayName.length < 2 || displayName.length > 28) {
    showToast('يجب أن يكون الاسم المستعار بين 2 و 28 حرفاً.', 'error');
    return;
  }
  try {
    const data = await apiJson('/api/profile/customize', {
      method: 'POST',
      body: JSON.stringify({
        displayName,
        nameColor: state.draftColor,
        avatarUrl: state.draftAvatarUrl,
        vipFamily: customizeFamily.value.trim()
      })
    });
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem(TOKEN_KEY, data.token);
    updateMeUI();
    customizeModal.classList.add('hidden');
    showToast('✅ تم حفظ التعديلات وتحديث الشات!');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ==========================================
// ADMIN PANEL, ROOM EDITOR & FULL CMS SYSTEM
// ==========================================
function populateRoomMinRankSelect(selectedPower = 0) {
  roomMinRankSelect.innerHTML = '';
  const openOpt = document.createElement('option');
  openOpt.value = '0';
  openOpt.textContent = 'مفتوحة للجميع (بما في ذلك الزوار)';
  roomMinRankSelect.appendChild(openOpt);

  const sorted = [...(state.ranks || [])]
    .filter((r) => r.key !== 'guest')
    .sort((a, b) => a.power - b.power);
  for (const r of sorted) {
    const opt = document.createElement('option');
    opt.value = String(r.power);
    opt.textContent = `${r.icon || '⭐'} ${r.label} (قوة ${r.power}+)`;
    roomMinRankSelect.appendChild(opt);
  }
  roomMinRankSelect.value = String(selectedPower || 0);
}

function syncWallpaperPreview(url) {
  state.draftRoomWallpaperUrl = url || '';
  if (state.draftRoomWallpaperUrl) {
    roomWallpaperPreview.src = state.draftRoomWallpaperUrl;
    roomWallpaperPreview.classList.remove('hidden');
  } else {
    roomWallpaperPreview.src = '';
    roomWallpaperPreview.classList.add('hidden');
  }
}

function openRoomEditorModal(mode, room = null) {
  state.roomEditorMode = mode;
  state.editingRoomId = room ? room.id : null;
  state.draftRoomImageUrl = room?.image_url || '/assets/rooms/default.svg';

  roomEditorTitle.textContent = mode === 'edit' ? `✏️ تعديل غرفة: ${room.name}` : '➕ إنشاء غرفة جديدة';
  roomImagePreview.src = state.draftRoomImageUrl;
  roomNameInput.value = room ? room.name : '';
  roomDescInput.value = room ? room.description || '' : '';
  roomWelcomeInput.value = room ? room.welcome_message || '' : '';
  roomPasswordInput.value = room ? room.room_password || '' : '';
  populateRoomMinRankSelect(room ? Number(room.min_rank_power) || 0 : 0);
  roomThemeSelect.value = room?.bg_theme || 'warm_peach';
  roomBgCustomInput.value = room?.bg_custom || '';
  if (room?.bg_custom && /^#[0-9a-fA-F]{6}$/.test(room.bg_custom)) {
    roomBgColorPicker.value = room.bg_custom;
  }
  syncWallpaperPreview(room?.wallpaper_url || '');
  roomEditorModal.classList.remove('hidden');
}

panelNewRoomBtn.addEventListener('click', () => openRoomEditorModal('create'));
chooseRoomImageBtn.addEventListener('click', () => roomImageFileInput.click());
chooseRoomWallpaperBtn.addEventListener('click', () => roomWallpaperFileInput.click());
clearRoomWallpaperBtn.addEventListener('click', () => syncWallpaperPreview(''));

roomBgColorPicker.addEventListener('input', () => {
  roomBgCustomInput.value = roomBgColorPicker.value;
});

roomImageFileInput.addEventListener('change', async () => {
  const file = roomImageFileInput.files?.[0];
  roomImageFileInput.value = '';
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    showToast('جاري رفع صورة الغرفة...');
    const { url } = await apiJson('/api/upload/room', { method: 'POST', body: fd });
    state.draftRoomImageUrl = url;
    roomImagePreview.src = url;
  } catch (err) {
    showToast(err.message, 'error');
  }
});

roomWallpaperFileInput.addEventListener('change', async () => {
  const file = roomWallpaperFileInput.files?.[0];
  roomWallpaperFileInput.value = '';
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);
  try {
    showToast('جاري رفع خلفية الغرفة...');
    const { url } = await apiJson('/api/upload/wallpaper', { method: 'POST', body: fd });
    syncWallpaperPreview(url);
    showToast('✅ تم رفع الخلفية بنجاح');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

roomEditorForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.socket || !hasPerm('manage_rooms')) return;

  const payload = {
    name: roomNameInput.value.trim(),
    description: roomDescInput.value.trim(),
    welcomeMessage: roomWelcomeInput.value.trim(),
    roomPassword: roomPasswordInput.value.trim(),
    minRankPower: Number(roomMinRankSelect.value) || 0,
    imageUrl: state.draftRoomImageUrl,
    bgTheme: roomThemeSelect.value,
    bgCustom: roomBgCustomInput.value.trim(),
    wallpaperUrl: state.draftRoomWallpaperUrl
  };

  if (state.roomEditorMode === 'edit' && state.editingRoomId) {
    state.socket.emit('admin_update_room', { roomId: state.editingRoomId, ...payload });
  } else {
    state.socket.emit('admin_create_room', payload);
  }
  roomEditorModal.classList.add('hidden');
});

roomPasswordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.socket || !state.pendingPasswordRoom) return;
  const pwd = roomPasswordPromptInput.value;
  state.socket.emit('join_room', {
    roomId: state.pendingPasswordRoom.roomId,
    password: pwd
  });
  roomPasswordModal.classList.add('hidden');
});

function openAdminPanel() {
  adminSearchInput.value = '';
  adminPanelModal.classList.remove('hidden');
  loadAdminOverview();
}

async function loadAdminOverview() {
  if (!state.user || !hasPanelAccess(state.user.role)) return;
  try {
    state.adminOverview = await apiJson('/api/admin/overview');
    if (state.adminOverview.ranks) setRanksList(state.adminOverview.ranks);
    if (state.adminOverview.emojis) {
      state.customEmojis = state.adminOverview.emojis;
      rebuildEmojiPopover();
    }
    if (state.adminOverview.siteSettings) {
      applySiteSettings(state.adminOverview.siteSettings);
    }
    renderAdminPanelContent();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.querySelectorAll('.panel-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    state.activePanelTab = tab.dataset.panelTab;
    panelTabOnline.classList.toggle('hidden', state.activePanelTab !== 'online');
    panelTabMembers.classList.toggle('hidden', state.activePanelTab !== 'members');
    panelTabBans.classList.toggle('hidden', state.activePanelTab !== 'bans');
    panelTabRooms.classList.toggle('hidden', state.activePanelTab !== 'rooms');
    panelTabRanks.classList.toggle('hidden', state.activePanelTab !== 'ranks');
    panelTabEmojis.classList.toggle('hidden', state.activePanelTab !== 'emojis');
    panelTabCms.classList.toggle('hidden', state.activePanelTab !== 'cms');
    panelTabReports.classList.toggle('hidden', state.activePanelTab !== 'reports');
    const hideSearch = ['ranks', 'emojis', 'cms'].includes(state.activePanelTab);
    adminPanelToolbar.classList.toggle('hidden', hideSearch);
    renderAdminPanelContent();
  });
});

adminSearchInput.addEventListener('input', renderAdminPanelContent);

function buildRankSelect(currentRole, targetUserId) {
  const select = document.createElement('select');
  select.className = 'rank-select';
  const myPower = getRankPower(state.user.role);
  const amSiteOwner = state.user.role === 'site_owner';
  const sourceRanks = (state.adminOverview?.ranks || state.ranks || DEFAULT_RANKS_FALLBACK).filter(
    (r) => r.key !== 'guest'
  );
  const availableRanks = sourceRanks.filter(
    (r) => amSiteOwner || getRankPower(r.key) < myPower || r.key === currentRole
  );
  for (const r of availableRanks) {
    const opt = document.createElement('option');
    opt.value = r.key;
    opt.textContent = `${r.icon || '⭐'} ${r.label}`;
    if (r.key === currentRole) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    state.socket.emit('admin_set_role', { targetUserId, newRole: select.value });
  });
  return select;
}

function renderRanksTab() {
  const ranks = state.adminOverview?.ranks || state.ranks || [];
  const canEditRanks = state.user?.role === 'site_owner' || hasPerm('set_rank');
  const editingRank = state.editingRankKey ? ranks.find((r) => r.key === state.editingRankKey) : null;
  if (editingRank && state.draftRankImageUrl === '' && editingRank.image_url) {
    state.draftRankImageUrl = editingRank.image_url;
  }

  panelTabRanks.innerHTML = '';

  if (!canEditRanks) {
    panelTabRanks.innerHTML = '<div class="panel-empty">عرض الرتب متاح فقط؛ تعديل وبناء الرتب متاح للمالك ولمن يملك صلاحية إدارة الرتب.</div>';
  } else {
    const fCard = document.createElement('form');
    fCard.className = 'cms-section-card';
    const perms = editingRank?.permissions || {};
    const isOwnerRank = editingRank?.key === 'site_owner';

    const permsHtml = PERM_LABELS.map(
      (p) => `
      <label class="perm-check-item">
        <input type="checkbox" name="perm_${p.key}" ${isOwnerRank || perms[p.key] ? 'checked' : ''} ${isOwnerRank ? 'disabled' : ''} />
        <span>${p.label}</span>
      </label>
    `
    ).join('');

    const curImg = editingRank ? (state.draftRankImageUrl ?? editingRank.image_url) : state.draftRankImageUrl;

    fCard.innerHTML = `
      <div class="cms-section-title">${editingRank ? `✏️ تعديل رتبة: ${escapeHtml(editingRank.label)}` : '➕ إنشاء رتبة جديدة وصلاحياتها'}</div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>اسم الرتبة</label>
          <input id="rankLabelInput" class="light-input" type="text" maxlength="32" required value="${escapeHtml(editingRank?.label || '')}" placeholder="مثال: كبار الشخصيات" />
        </div>
        <div class="field-group-light">
          <label>الأيقونة / الإيموجي</label>
          <input id="rankIconInput" class="light-input" type="text" maxlength="8" value="${escapeHtml(editingRank?.icon || '⭐')}" placeholder="👑 أو ⭐" />
        </div>
        <div class="field-group-light">
          <label>لون الخلفية</label>
          <input id="rankBgColorInput" class="light-input" type="color" value="${escapeHtml(editingRank?.bg_color || '#7c3aed')}" />
        </div>
        <div class="field-group-light">
          <label>لون النص</label>
          <input id="rankTextColorInput" class="light-input" type="color" value="${escapeHtml(editingRank?.text_color || '#ffffff')}" />
        </div>
        <div class="field-group-light">
          <label>مستوى قوة الرتبة (1 إلى 99)</label>
          <input id="rankPowerInput" class="light-input" type="number" min="1" max="99" value="${editingRank ? Number(editingRank.power) : 45}" ${editingRank?.key === 'site_owner' || editingRank?.key === 'guest' ? 'disabled' : ''} />
        </div>
        <div class="field-group-light">
          <label>صورة أيقونة للرتبة (اختياري)</label>
          <div class="avatar-upload-row" style="align-items:center;">
            <input id="rankIconFileInput" type="file" accept="image/*" class="hidden" />
            <button id="uploadRankIconBtn" type="button" class="btn btn-royal btn-xs">🖼️ رفع أيقونة</button>
            <button id="clearRankIconBtn" type="button" class="btn btn-light btn-xs">إزالة</button>
            <span id="rankIconPreviewWrap">${curImg ? `<img class="rank-icon-img" src="${escapeHtml(curImg)}" alt="" />` : ''}</span>
          </div>
        </div>
      </div>
      <div class="field-group-light">
        <label>مصفوفة الصلاحيات لهذه الرتبة</label>
        <div class="perm-checkboxes-grid">${permsHtml}</div>
      </div>
      <div class="panel-actions-row">
        <button type="submit" class="btn btn-gold btn-sm">${editingRank ? '💾 حفظ تعديلات الرتبة' : '➕ إنشاء الرتبة الآن'}</button>
        ${editingRank ? '<button id="cancelEditRankBtn" type="button" class="btn btn-light btn-sm">إلغاء التعديل</button>' : ''}
      </div>
    `;

    const fileInp = fCard.querySelector('#rankIconFileInput');
    fCard.querySelector('#uploadRankIconBtn').onclick = () => fileInp.click();
    fCard.querySelector('#clearRankIconBtn').onclick = () => {
      state.draftRankImageUrl = '';
      fCard.querySelector('#rankIconPreviewWrap').innerHTML = '';
    };
    fileInp.addEventListener('change', async () => {
      const f = fileInp.files?.[0];
      fileInp.value = '';
      if (!f) return;
      const fd = new FormData();
      fd.append('file', f);
      try {
        const { url } = await apiJson('/api/upload/rank-icon', { method: 'POST', body: fd });
        state.draftRankImageUrl = url;
        fCard.querySelector('#rankIconPreviewWrap').innerHTML = `<img class="rank-icon-img" src="${escapeHtml(url)}" alt="" />`;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    const cancelBtn = fCard.querySelector('#cancelEditRankBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        state.editingRankKey = null;
        state.draftRankImageUrl = '';
        renderRanksTab();
      };
    }

    fCard.addEventListener('submit', async (e) => {
      e.preventDefault();
      const permissions = {};
      PERM_LABELS.forEach((p) => {
        const cb = fCard.querySelector(`input[name="perm_${p.key}"]`);
        permissions[p.key] = Boolean(cb?.checked);
      });
      const body = {
        label: fCard.querySelector('#rankLabelInput').value.trim(),
        icon: fCard.querySelector('#rankIconInput').value.trim(),
        imageUrl: state.draftRankImageUrl,
        bgColor: fCard.querySelector('#rankBgColorInput').value,
        textColor: fCard.querySelector('#rankTextColorInput').value,
        power: Number(fCard.querySelector('#rankPowerInput').value) || 20,
        permissions
      };
      try {
        const res = editingRank
          ? await apiJson(`/api/admin/ranks/${editingRank.key}`, { method: 'PUT', body: JSON.stringify(body) })
          : await apiJson('/api/admin/ranks', { method: 'POST', body: JSON.stringify(body) });
        showToast(res.message || '✅ تم الحفظ');
        state.editingRankKey = null;
        state.draftRankImageUrl = '';
        await loadAdminOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    panelTabRanks.appendChild(fCard);
  }

  for (const r of ranks) {
    const card = document.createElement('div');
    card.className = 'panel-card';
    const activePerms = PERM_LABELS.filter((p) => r.permissions?.[p.key]).map((p) => p.label);
    card.innerHTML = `
      <div class="panel-card-top">
        <div class="user-left">
          ${roleBadgeHTML(r.key)}
          <div>
            <div class="panel-meta-sub">القوة: <strong>${r.power}</strong> • ${r.is_system ? 'رتبة أساسية' : 'رتبة مخصصة'}</div>
            <div class="panel-meta-sub">الصلاحيات: ${activePerms.length ? activePerms.join('، ') : 'لا توجد صلاحيات إدارية'}</div>
          </div>
        </div>
        <div class="panel-actions-row rank-row-btns"></div>
      </div>
    `;
    if (canEditRanks) {
      const btns = card.querySelector('.rank-row-btns');
      const eBtn = document.createElement('button');
      eBtn.type = 'button';
      eBtn.className = 'mod-btn';
      eBtn.textContent = '✏️ تعديل';
      eBtn.onclick = () => {
        state.editingRankKey = r.key;
        state.draftRankImageUrl = r.image_url || '';
        renderRanksTab();
      };
      btns.appendChild(eBtn);

      if (!r.is_system) {
        const dBtn = document.createElement('button');
        dBtn.type = 'button';
        dBtn.className = 'mod-btn danger';
        dBtn.textContent = '🗑️ حذف';
        dBtn.onclick = async () => {
          if (!confirm(`حذف الرتبة المخصصة "${r.label}" ونقل حامليها إلى عضو؟`)) return;
          try {
            const res = await apiJson(`/api/admin/ranks/${r.key}`, { method: 'DELETE' });
            showToast(res.message);
            await loadAdminOverview();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
        btns.appendChild(dBtn);
      }
    }
    panelTabRanks.appendChild(card);
  }
}

function renderEmojisTab() {
  panelTabEmojis.innerHTML = '';

  const formCard = document.createElement('form');
  formCard.className = 'cms-section-card';
  formCard.innerHTML = `
    <div class="cms-section-title">😊 إضافة إيموجي أو ملصق مخصص للشات</div>
    <div class="cms-grid">
      <div class="field-group-light">
        <label>رمز الاختصار (مثال: :وردة: أو :vip:)</label>
        <input id="emojiCodeInput" class="light-input" type="text" maxlength="28" required placeholder=":وردة:" />
      </div>
      <div class="field-group-light">
        <label>صورة الإيموجي / الملصق</label>
        <div class="avatar-upload-row" style="align-items:center;">
          <input id="emojiFileInput" type="file" accept="image/*" class="hidden" />
          <button id="uploadEmojiImgBtn" type="button" class="btn btn-royal btn-sm">🖼️ رفع صورة الإيموجي</button>
          <span id="emojiPreviewBox">${state.draftEmojiImageUrl ? `<img class="custom-chat-emoji" src="${escapeHtml(state.draftEmojiImageUrl)}" alt="" />` : ''}</span>
        </div>
      </div>
    </div>
    <button type="submit" class="btn btn-gold btn-sm" style="align-self:flex-start;">➕ إضافة الإيموجي للمنتقى</button>
  `;

  const fileInp = formCard.querySelector('#emojiFileInput');
  formCard.querySelector('#uploadEmojiImgBtn').onclick = () => fileInp.click();
  fileInp.addEventListener('change', async () => {
    const f = fileInp.files?.[0];
    fileInp.value = '';
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const { url } = await apiJson('/api/upload/emoji', { method: 'POST', body: fd });
      state.draftEmojiImageUrl = url;
      formCard.querySelector('#emojiPreviewBox').innerHTML = `<img class="custom-chat-emoji" src="${escapeHtml(url)}" alt="" />`;
      showToast('✅ تم رفع صورة الإيموجي');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  formCard.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = formCard.querySelector('#emojiCodeInput').value.trim();
    if (!state.draftEmojiImageUrl) {
      showToast('يرجى رفع صورة الإيموجي أولاً.', 'error');
      return;
    }
    try {
      const res = await apiJson('/api/admin/emojis', {
        method: 'POST',
        body: JSON.stringify({ code, imageUrl: state.draftEmojiImageUrl })
      });
      state.draftEmojiImageUrl = '';
      showToast(res.message);
      await loadAdminOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  panelTabEmojis.appendChild(formCard);

  const list = state.adminOverview?.emojis || state.customEmojis || [];
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'panel-empty';
    empty.textContent = 'لا توجد إيموجيات مخصصة بعد. أضف أول ملصق من النموذج أعلاه!';
    panelTabEmojis.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.className = 'emoji-manager-grid';
    for (const ce of list) {
      const item = document.createElement('div');
      item.className = 'emoji-manage-card';
      item.innerHTML = `
        <img src="${escapeHtml(ce.image_url)}" alt="${escapeHtml(ce.code)}" />
        <span class="emoji-code-chip">${escapeHtml(ce.code)}</span>
        <button type="button" class="mod-btn danger">🗑️ حذف</button>
      `;
      item.querySelector('button').onclick = async () => {
        try {
          const res = await apiJson(`/api/admin/emojis/${ce.id}`, { method: 'DELETE' });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
      grid.appendChild(item);
    }
    panelTabEmojis.appendChild(grid);
  }
}

function renderCmsTab() {
  const s = state.adminOverview?.siteSettings || state.siteSettings || {};
  state.draftCmsLogoUrl = s.site_logo || '';
  panelTabCms.innerHTML = '';

  // 1. Live Global Broadcast Popup
  const bCard = document.createElement('form');
  bCard.className = 'cms-section-card';
  bCard.innerHTML = `
    <div class="cms-section-title">📢 إعلان عام منبثق لجميع المتصلين (Broadcast Alert)</div>
    <div class="field-group-light">
      <label>عنوان الإعلان</label>
      <input id="broadcastTitleInp" class="light-input" type="text" maxlength="80" value="📢 إعلان هام من الإدارة" />
    </div>
    <div class="field-group-light">
      <label>نص الإعلان</label>
      <textarea id="broadcastMsgInp" class="light-input" rows="2" maxlength="1000" required placeholder="اكتب رسالتك لتصل فوراً كنافذة منبثقة لكل المتصلين..."></textarea>
    </div>
    <button type="submit" class="btn btn-danger btn-sm" style="align-self:flex-start;">📣 إرسال الإعلان العام الآن</button>
  `;
  bCard.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await apiJson('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: bCard.querySelector('#broadcastTitleInp').value.trim(),
          message: bCard.querySelector('#broadcastMsgInp').value.trim()
        })
      });
      bCard.querySelector('#broadcastMsgInp').value = '';
      showToast(res.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  panelTabCms.appendChild(bCard);

  // 2. Site Theme & CMS Form
  const cmsForm = document.createElement('form');
  cmsForm.className = 'cms-section-card';
  const fonts = ['Cairo', 'Tajawal', 'Amiri', 'Readex Pro', 'Changa'];
  const fontOpts = fonts
    .map((f) => `<option value="${f}" ${(s.font_family || 'Cairo') === f ? 'selected' : ''}>${f}</option>`)
    .join('');

  cmsForm.innerHTML = `
    <div class="cms-section-title">🎨 تخصيص هوية الموقع والألوان والخطوط</div>
    <div class="cms-grid">
      <div class="field-group-light">
        <label>اسم الموقع</label>
        <input id="cmsSiteName" class="light-input" type="text" maxlength="60" value="${escapeHtml(s.site_name || 'شات الغرف المباشر')}" required />
      </div>
      <div class="field-group-light">
        <label>شعار الموقع (Logo)</label>
        <div class="avatar-upload-row" style="align-items:center;">
          <input id="cmsLogoFileInp" type="file" accept="image/*" class="hidden" />
          <button id="cmsUploadLogoBtn" type="button" class="btn btn-royal btn-xs">🖼️ رفع شعار</button>
          <button id="cmsClearLogoBtn" type="button" class="btn btn-light btn-xs">إزالة</button>
          <span id="cmsLogoPreviewWrap">${s.site_logo ? `<img class="rank-icon-img" src="${escapeHtml(s.site_logo)}" alt="" style="width:28px;height:28px;" />` : ''}</span>
        </div>
      </div>
    </div>

    <div class="field-group-light">
      <label>وصف الموقع أسفل العنوان</label>
      <input id="cmsSiteDesc" class="light-input" type="text" maxlength="180" value="${escapeHtml(s.site_description || '')}" />
    </div>

    <div class="field-group-light">
      <label>رسالة الترحيب العامة عند دخول الشات</label>
      <input id="cmsWelcomeMsg" class="light-input" type="text" maxlength="400" value="${escapeHtml(s.welcome_message || '')}" placeholder="أهلاً ومرحباً بكم في شاتنا..." />
    </div>

    <div class="cms-grid">
      <div class="field-group-light">
        <label>لون الشريط العلوي</label>
        <input id="cmsTopBarColor" class="light-input" type="color" value="${escapeHtml(s.top_bar_color || '#1a45e5')}" />
      </div>
      <div class="field-group-light">
        <label>لون الشريط السفلي</label>
        <input id="cmsBottomBarColor" class="light-input" type="color" value="${escapeHtml(s.bottom_bar_color || '#1a45e5')}" />
      </div>
      <div class="field-group-light">
        <label>لون الأزرار الرئيسية</label>
        <input id="cmsBtnColor" class="light-input" type="color" value="${escapeHtml(s.button_color || '#f59e0b')}" />
      </div>
      <div class="field-group-light">
        <label>نوع الخط (Google Font)</label>
        <select id="cmsFontFamily" class="light-input">${fontOpts}</select>
      </div>
      <div class="field-group-light">
        <label>حجم الخط (${Number(s.font_size) || 15}px)</label>
        <input id="cmsFontSize" class="light-input" type="number" min="12" max="22" value="${Number(s.font_size) || 15}" />
      </div>
      <div class="field-group-light" style="justify-content:center;">
        <label class="perm-check-item" style="font-size:0.88rem;padding-top:14px;">
          <input id="cmsMaintenanceMode" type="checkbox" ${s.maintenance_mode === 1 ? 'checked' : ''} />
          <span>🛠️ تفعيل وضع الصيانة (إغلاق الدخول لغير الإدارة)</span>
        </label>
      </div>
    </div>

    <div class="field-group-light">
      <label>كود CSS مخصص (Custom CSS)</label>
      <textarea id="cmsCustomCss" class="light-input" rows="3" dir="ltr" placeholder="/* مثال: .cody-msg-row { border-radius: 18px; } */">${escapeHtml(s.custom_css || '')}</textarea>
    </div>

    <div class="field-group-light">
      <label>كود HTML / إعلان أعلى الدردشة (Custom HTML)</label>
      <textarea id="cmsCustomHtml" class="light-input" rows="3" dir="ltr" placeholder="<div>أهلاً بكم!</div>">${escapeHtml(s.custom_html || '')}</textarea>
    </div>

    <button type="submit" class="btn btn-gold">💾 حفظ وتطبيق إعدادات الموقع فوراً</button>
  `;

  const logoInp = cmsForm.querySelector('#cmsLogoFileInp');
  cmsForm.querySelector('#cmsUploadLogoBtn').onclick = () => logoInp.click();
  cmsForm.querySelector('#cmsClearLogoBtn').onclick = () => {
    state.draftCmsLogoUrl = '';
    cmsForm.querySelector('#cmsLogoPreviewWrap').innerHTML = '';
  };
  logoInp.addEventListener('change', async () => {
    const f = logoInp.files?.[0];
    logoInp.value = '';
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const { url } = await apiJson('/api/upload/branding', { method: 'POST', body: fd });
      state.draftCmsLogoUrl = url;
      cmsForm.querySelector('#cmsLogoPreviewWrap').innerHTML = `<img class="rank-icon-img" src="${escapeHtml(url)}" alt="" style="width:28px;height:28px;" />`;
      showToast('✅ تم رفع الشعار بنجاح');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  cmsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      site_name: cmsForm.querySelector('#cmsSiteName').value.trim(),
      site_description: cmsForm.querySelector('#cmsSiteDesc').value.trim(),
      site_logo: state.draftCmsLogoUrl,
      welcome_message: cmsForm.querySelector('#cmsWelcomeMsg').value.trim(),
      maintenance_mode: cmsForm.querySelector('#cmsMaintenanceMode').checked,
      top_bar_color: cmsForm.querySelector('#cmsTopBarColor').value,
      bottom_bar_color: cmsForm.querySelector('#cmsBottomBarColor').value,
      button_color: cmsForm.querySelector('#cmsBtnColor').value,
      font_family: cmsForm.querySelector('#cmsFontFamily').value,
      font_size: Number(cmsForm.querySelector('#cmsFontSize').value) || 15,
      custom_css: cmsForm.querySelector('#cmsCustomCss').value,
      custom_html: cmsForm.querySelector('#cmsCustomHtml').value
    };
    try {
      const res = await apiJson('/api/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      applySiteSettings(res.siteSettings);
      showToast(res.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  panelTabCms.appendChild(cmsForm);
}

function renderAdminPanelContent() {
  const data = state.adminOverview;
  if (!data) return;

  const q = adminSearchInput.value.trim().toLowerCase();
  const canSetRank = hasPerm('set_rank');
  const canMute = hasPerm('mute');
  const canKick = hasPerm('kick');
  const canBan = hasPerm('ban');
  const canManageRooms = hasPerm('manage_rooms');
  const canClearRoom = hasPerm('clear_room');

  // Online Tab
  panelTabOnline.innerHTML = '';
  const onlineFiltered = (data.onlineUsers || []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.ipAddress || '').includes(q)
  );
  if (onlineFiltered.length === 0) {
    panelTabOnline.innerHTML = '<div class="panel-empty">لا يوجد متصلون مطابقون.</div>';
  } else {
    for (const u of onlineFiltered) {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="panel-card-top">
          <div class="user-left">
            <div class="avatar-circle"></div>
            <div>
              <div class="me-name-row"><strong></strong> ${roleBadgeHTML(u.role)} ${u.isMuted ? '<span class="muted-tag">مكتوم</span>' : ''}</div>
              <div class="panel-meta-sub">الغرفة: ${u.roomName || '-'}${u.ipAddress ? ` • IP: ${u.ipAddress}` : ''}</div>
            </div>
          </div>
        </div>
      `;
      renderAvatarInto(card.querySelector('.avatar-circle'), u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
      card.querySelector('strong').textContent = u.name;

      if (canModerateTarget(u.role, u.key)) {
        const actions = document.createElement('div');
        actions.className = 'panel-actions-row';
        if (canSetRank && u.userId) actions.appendChild(buildRankSelect(u.role, u.userId));
        if (canSetRank || state.user?.role === 'site_owner') {
          const rBtn = document.createElement('button');
          rBtn.type = 'button';
          rBtn.className = 'mod-btn';
          rBtn.textContent = '✏️ تغيير الاسم';
          rBtn.onclick = () => {
            const n = prompt(`الاسم الجديد لـ "${u.name}":`, u.name);
            if (n && n.trim().length >= 2) state.socket.emit('admin_rename_user', { targetKey: u.key, newName: n.trim() });
          };
          actions.appendChild(rBtn);
        }
        if (canMute) {
          const mBtn = document.createElement('button');
          mBtn.type = 'button';
          mBtn.className = 'mod-btn warn';
          mBtn.textContent = u.isMuted ? '🔊 فك الكتم' : '🔇 كتم';
          mBtn.onclick = () => state.socket.emit('admin_mute', { targetKey: u.key, roomId: u.roomId || '*', minutes: u.isMuted ? 0 : 60 });
          actions.appendChild(mBtn);
        }
        if (canKick) {
          const kBtn = document.createElement('button');
          kBtn.type = 'button';
          kBtn.className = 'mod-btn';
          kBtn.textContent = '👢 طرد';
          kBtn.onclick = () => state.socket.emit('admin_kick', { targetKey: u.key, roomId: u.roomId });
          actions.appendChild(kBtn);
        }
        if (canBan) {
          const bBtn = document.createElement('button');
          bBtn.type = 'button';
          bBtn.className = 'mod-btn danger';
          bBtn.textContent = '⛔ حظر';
          bBtn.onclick = () => {
            if (confirm(`حظر "${u.name}" نهائياً؟`)) {
              state.socket.emit('admin_ban', { targetKey: u.key, targetName: u.name, reason: 'حظر نهائي من لوحة التحكم' });
            }
          };
          actions.appendChild(bBtn);
        }
        card.appendChild(actions);
      }
      panelTabOnline.appendChild(card);
    }
  }

  // Registered Members Tab
  panelTabMembers.innerHTML = '';
  const memFiltered = (data.registeredUsers || []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  if (memFiltered.length === 0) {
    panelTabMembers.innerHTML = '<div class="panel-empty">لا يوجد أعضاء مسجلون.</div>';
  } else {
    for (const u of memFiltered) {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="panel-card-top">
          <div class="user-left">
            <div class="avatar-circle"></div>
            <div>
              <div class="me-name-row"><strong></strong> ${roleBadgeHTML(u.role)}</div>
              <div class="panel-meta-sub">@${u.username} • ${u.email}${u.ipAddress ? ` • IP: ${u.ipAddress}` : ''}</div>
            </div>
          </div>
        </div>
      `;
      renderAvatarInto(card.querySelector('.avatar-circle'), u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
      card.querySelector('strong').textContent = u.name;

      if (canModerateTarget(u.role, u.key)) {
        const actions = document.createElement('div');
        actions.className = 'panel-actions-row';
        if (canSetRank) {
          actions.appendChild(buildRankSelect(u.role, u.id));
          const rBtn = document.createElement('button');
          rBtn.type = 'button';
          rBtn.className = 'mod-btn';
          rBtn.textContent = '✏️ تغيير الاسم';
          rBtn.onclick = () => {
            const n = prompt(`الاسم الجديد للعضو "${u.name}":`, u.name);
            if (n && n.trim().length >= 2) state.socket.emit('admin_rename_user', { targetKey: u.key, newName: n.trim() });
          };
          actions.appendChild(rBtn);
        }
        if (canMute) {
          const mBtn = document.createElement('button');
          mBtn.type = 'button';
          mBtn.className = 'mod-btn warn';
          mBtn.textContent = u.isMuted ? '🔊 فك الكتم' : '🔇 كتم';
          mBtn.onclick = () => state.socket.emit('admin_mute', { targetKey: u.key, roomId: '*', minutes: u.isMuted ? 0 : 60 });
          actions.appendChild(mBtn);
        }

        if (canBan) {
          if (u.isBanned) {
            const ub = document.createElement('button');
            ub.type = 'button';
            ub.className = 'mod-btn success';
            ub.textContent = '🔓 فك الحظر';
            ub.onclick = () => state.socket.emit('admin_unban', { targetKey: u.key });
            actions.appendChild(ub);
          } else {
            const bBtn = document.createElement('button');
            bBtn.type = 'button';
            bBtn.className = 'mod-btn danger';
            bBtn.textContent = '⛔ حظر';
            bBtn.onclick = () => {
              if (confirm(`حظر "${u.name}" نهائياً؟`)) {
                state.socket.emit('admin_ban', { targetKey: u.key, targetName: u.name, reason: 'حظر نهائي من لوحة التحكم' });
              }
            };
            actions.appendChild(bBtn);
          }
        }
        card.appendChild(actions);
      }
      panelTabMembers.appendChild(card);
    }
  }

  // Bans Tab
  panelTabBans.innerHTML = '';
  const bansFiltered = (data.bans || []).filter(
    (b) => !q || (b.target_name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q) || (b.ip_address || '').includes(q)
  );
  if (bansFiltered.length === 0) {
    panelTabBans.innerHTML = '<div class="panel-empty">قائمة المحظورين فارغة.</div>';
  } else {
    for (const b of bansFiltered) {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="panel-card-top">
          <div>
            <strong></strong>
            <div class="panel-meta-sub">البريد: ${b.email || 'زائر'} • IP: ${b.ip_address || '-'} • بواسطة: ${b.banned_by}</div>
            <div class="panel-meta-sub">السبب: ${b.reason}</div>
          </div>
          ${canBan ? '<button type="button" class="mod-btn success">🔓 فك الحظر</button>' : ''}
        </div>
      `;
      card.querySelector('strong').textContent = b.target_name;
      const uBtn = card.querySelector('button');
      if (uBtn) uBtn.onclick = () => state.socket.emit('admin_unban', { targetKey: b.target_key });
      panelTabBans.appendChild(card);
    }
  }

  // Rooms Tab
  panelTabRooms.innerHTML = '';
  const roomsFiltered = (data.rooms || []).filter((r) => !q || r.name.toLowerCase().includes(q));
  for (const r of roomsFiltered) {
    const card = document.createElement('div');
    card.className = 'panel-card';
    const locks = [];
    if (r.hasPassword) locks.push('🔒 محمية بكلمة مرور');
    if (Number(r.min_rank_power) > 0) locks.push(`🛡️ قوة ${Number(r.min_rank_power)}+`);
    if (r.wallpaper_url) locks.push('🌄 خلفية مخصصة');
    card.innerHTML = `
      <div class="panel-card-top">
        <div class="user-left">
          <img class="room-avatar" src="${r.image_url || '/assets/rooms/default.svg'}" alt="" />
          <div>
            <strong></strong>
            <div class="panel-meta-sub">${r.description || 'بدون وصف'} • 👥 ${r.onlineCount || 0}${locks.length ? ` • ${locks.join(' • ')}` : ''}</div>
          </div>
        </div>
        <div class="panel-actions-row room-btns"></div>
      </div>
    `;
    card.querySelector('strong').textContent = r.name;
    const btns = card.querySelector('.room-btns');
    if (canClearRoom) {
      const cBtn = document.createElement('button');
      cBtn.type = 'button';
      cBtn.className = 'mod-btn warn';
      cBtn.textContent = '🧹 مسح';
      cBtn.onclick = () => confirm(`مسح رسائل "${r.name}"؟`) && state.socket.emit('admin_clear_room', { roomId: r.id });
      btns.appendChild(cBtn);
    }
    if (canManageRooms) {
      const eBtn = document.createElement('button');
      eBtn.type = 'button';
      eBtn.className = 'mod-btn';
      eBtn.textContent = '✏️ تعديل';
      eBtn.onclick = () => openRoomEditorModal('edit', r);

      const dBtn = document.createElement('button');
      dBtn.type = 'button';
      dBtn.className = 'mod-btn danger';
      dBtn.textContent = '🗑️ حذف';
      dBtn.onclick = () => confirm(`حذف غرفة "${r.name}"؟`) && state.socket.emit('admin_delete_room', { roomId: r.id });

      btns.append(eBtn, dBtn);
    }
    panelTabRooms.appendChild(card);
  }

  // CMS Tabs
  renderRanksTab();
  renderEmojisTab();
  renderCmsTab();

  // Reports Tab
  panelTabReports.innerHTML = '';
  const reps = data.reports || [];
  if (reps.length === 0) {
    panelTabReports.innerHTML = '<div class="panel-empty">لا توجد بلاغات حالياً.</div>';
  } else {
    for (const rp of reps) {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <strong>🚨 بلاغ ضد: <span></span></strong>
        <div class="panel-meta-sub">المُبلغ: ${rp.reporter_name} • السبب: ${rp.reason}</div>
      `;
      card.querySelector('span').textContent = rp.target_name;
      panelTabReports.appendChild(card);
    }
  }
}

// ==========================================
// FEATURE MODALS (PMs, Friends, Wall, Leaderboards, Reports, Wallet, Mics)
// ==========================================
function openFeatureModal(title, htmlOrRender) {
  featureModalTitle.textContent = title;
  featureModalBody.innerHTML = '';
  if (typeof htmlOrRender === 'string') featureModalBody.innerHTML = htmlOrRender;
  else htmlOrRender(featureModalBody);
  featureModal.classList.remove('hidden');
}

async function openLeaderboardsModal(tab = 'rich') {
  openFeatureModal(
    tab === 'rich' ? '💎 قائمة الأثرياء' : tab === 'vips' ? '👑 قائمة الكبار' : '🏰 عائلات VIP',
    '<div class="panel-empty">جاري التحميل...</div>'
  );
  try {
    const data = await apiJson('/api/leaderboards');
    featureModalBody.innerHTML = '';
    if (tab === 'families') {
      if (!data.families.length) {
        featureModalBody.innerHTML = '<div class="panel-empty">لم ينضم أعضاء لعائلات VIP بعد. يمكنك إضافة اسم عائلتك من تحرير الملف الشخصي!</div>';
        return;
      }
      data.families.forEach((f) => {
        const div = document.createElement('div');
        div.className = 'panel-card';
        div.innerHTML = `<strong>🏰 ${f.name}</strong><div class="panel-meta-sub">الأعضاء: ${f.members.map((m) => m.name).join('، ')}</div>`;
        featureModalBody.appendChild(div);
      });
      return;
    }

    const list = tab === 'rich' ? data.rich : data.vips;
    if (!list.length) {
      featureModalBody.innerHTML = '<div class="panel-empty">لا توجد بيانات متاحة حالياً.</div>';
      return;
    }
    list.forEach((u, i) => {
      const div = document.createElement('div');
      div.className = 'user-row-light';
      div.innerHTML = `
        <div class="user-row-top">
          <div class="user-left">
            <strong>#${i + 1}</strong>
            <div class="avatar-circle"></div>
            <div>
              <div class="me-name-row">${roleBadgeHTML(u.role)} <span class="nameplate-pill plate-${u.nameplateStyle}">${u.name}</span></div>
              <div class="panel-meta-sub">🪙 ${u.coins} نقطة</div>
            </div>
          </div>
        </div>
      `;
      renderAvatarInto(div.querySelector('.avatar-circle'), u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
      featureModalBody.appendChild(div);
    });
  } catch (err) {
    featureModalBody.innerHTML = `<div class="panel-empty">${err.message}</div>`;
  }
}

async function openFriendsModal(defaultMode = 'friends') {
  openFeatureModal(defaultMode === 'requests' ? '🤝 طلبات الصداقة' : '👥 الأصدقاء', '<div class="panel-empty">جاري التحميل...</div>');
  try {
    const data = await apiJson('/api/social/state');
    const items = data.friends || [];
    featureModalBody.innerHTML = '';
    if (!items.length) {
      featureModalBody.innerHTML = '<div class="panel-empty">لا يوجد أصدقاء أو طلبات صداقة حالياً. اضغط على أي متصل لإرسال طلب صداقة!</div>';
      return;
    }
    items.forEach((f) => {
      const div = document.createElement('div');
      div.className = 'user-row-light';
      div.innerHTML = `
        <div class="user-row-top">
          <div class="user-left">
            <div class="avatar-circle"></div>
            <div>
              <strong></strong>
              <div class="panel-meta-sub">${f.status === 'accepted' ? '✅ صديق' : f.requested_by === state.user.key ? '⏳ طلب مرسل' : '📩 طلب صداقة وارد'}</div>
            </div>
          </div>
          <div class="owner-actions f-acts"></div>
        </div>
      `;
      renderAvatarInto(div.querySelector('.avatar-circle'), f.friend_name, f.friend_avatar, '#ffffff', f.friend_role, 'none');
      div.querySelector('strong').textContent = f.friend_name;
      const acts = div.querySelector('.f-acts');
      if (f.status === 'pending' && f.requested_by !== state.user.key) {
        const acc = document.createElement('button');
        acc.type = 'button';
        acc.className = 'mod-btn success';
        acc.textContent = 'قبول';
        acc.onclick = async () => {
          await apiJson('/api/social/friend-respond', { method: 'POST', body: JSON.stringify({ friendKey: f.friend_key, accept: true }) });
          openFriendsModal();
        };
        const rej = document.createElement('button');
        rej.type = 'button';
        rej.className = 'mod-btn danger';
        rej.textContent = 'رفض';
        rej.onclick = async () => {
          await apiJson('/api/social/friend-respond', { method: 'POST', body: JSON.stringify({ friendKey: f.friend_key, accept: false }) });
          openFriendsModal();
        };
        acts.append(acc, rej);
      } else {
        const pmBtn = document.createElement('button');
        pmBtn.type = 'button';
        pmBtn.className = 'mod-btn';
        pmBtn.textContent = '✉️ مراسلة';
        pmBtn.onclick = () => openPrivateMessagesModal({ key: f.friend_key, name: f.friend_name });
        acts.appendChild(pmBtn);
      }
      featureModalBody.appendChild(div);
    });
  } catch (err) {
    featureModalBody.innerHTML = `<div class="panel-empty">${err.message}</div>`;
  }
}

async function openPrivateMessagesModal(preselectUser = null) {
  openFeatureModal('✉️ الرسائل الخاصة', '<div class="panel-empty">جاري التحميل...</div>');
  try {
    const data = await apiJson('/api/social/state');
    const others = state.globalOnlineUsers.filter((u) => u.key !== state.user?.key);
    const optionsHTML = others.map((u) => `<option value="${u.key}" data-name="${u.name}" ${preselectUser?.key === u.key ? 'selected' : ''}>${u.name}</option>`).join('');
    const preOption = preselectUser && !others.some((o) => o.key === preselectUser.key)
      ? `<option value="${preselectUser.key}" data-name="${preselectUser.name}" selected>${preselectUser.name}</option>`
      : '';

    featureModalBody.innerHTML = `
      <form id="pmSendForm" class="panel-card">
        <select id="pmTargetSelect" class="light-input" required>
          <option value="">اختر المستلم...</option>
          ${preOption}${optionsHTML}
        </select>
        <input id="pmTextInput" type="text" class="light-input" placeholder="اكتب رسالتك الخاصة..." required />
        <button type="submit" class="btn btn-royal btn-sm">إرسال رسالة خاصة</button>
      </form>
      <div id="pmHistoryList" style="display:flex;flex-direction:column;gap:8px;"></div>
    `;

    const hist = document.getElementById('pmHistoryList');
    const pms = data.privateMessages || [];
    if (!pms.length) {
      hist.innerHTML = '<div class="panel-empty">لا توجد رسائل خاصة بعد.</div>';
    } else {
      pms.forEach((m) => {
        const d = document.createElement('div');
        d.className = 'panel-card';
        const isMine = m.from_key === state.user?.key;
        d.innerHTML = `<strong>${isMine ? `إلى ${m.to_name}` : `من ${m.from_name}`}</strong><div></div><small class="panel-meta-sub">${formatTime(m.created_at)}</small>`;
        d.querySelector('div').textContent = m.content;
        hist.appendChild(d);
      });
    }

    document.getElementById('pmSendForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const sel = document.getElementById('pmTargetSelect');
      const opt = sel.options[sel.selectedIndex];
      const toKey = sel.value;
      const toName = opt?.dataset?.name || opt?.textContent || '';
      const content = document.getElementById('pmTextInput').value.trim();
      if (!toKey || !content) return;
      await apiJson('/api/social/pm', { method: 'POST', body: JSON.stringify({ toKey, toName, content }) });
      showToast('✅ تم إرسال الرسالة الخاصة');
      openPrivateMessagesModal({ key: toKey, name: toName });
    });
  } catch (err) {
    featureModalBody.innerHTML = `<div class="panel-empty">${err.message}</div>`;
  }
}

async function openWallModal() {
  openFeatureModal('📰 حائط الأصدقاء', '<div class="panel-empty">جاري التحميل...</div>');
  try {
    const data = await apiJson('/api/social/state');
    featureModalBody.innerHTML = `
      <form id="wallPostForm" class="panel-card">
        <textarea id="wallContentInput" class="light-input" rows="2" placeholder="شارك منشوراً مع أصدقائك..." required></textarea>
        <button type="submit" class="btn btn-gold btn-sm">نشر على الحائط</button>
      </form>
      <div id="wallPostsList" style="display:flex;flex-direction:column;gap:8px;"></div>
    `;
    const listEl = document.getElementById('wallPostsList');
    const posts = data.wallPosts || [];
    if (!posts.length) listEl.innerHTML = '<div class="panel-empty">الحائط فارغ، كن أول من ينشر!</div>';
    posts.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'panel-card';
      card.innerHTML = `
        <div class="panel-card-top">
          <div class="me-name-row">${roleBadgeHTML(p.author_role)} <strong></strong></div>
          <button type="button" class="mod-btn">❤️ ${p.likes_count || 0}</button>
        </div>
        <div class="wall-txt"></div>
      `;
      card.querySelector('strong').textContent = p.author_name;
      card.querySelector('.wall-txt').textContent = p.content;
      card.querySelector('button').onclick = async () => {
        await apiJson('/api/social/wall-like', { method: 'POST', body: JSON.stringify({ postId: p.id }) });
        openWallModal();
      };
      listEl.appendChild(card);
    });

    document.getElementById('wallPostForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = document.getElementById('wallContentInput').value.trim();
      if (!content) return;
      await apiJson('/api/social/wall', { method: 'POST', body: JSON.stringify({ content }) });
      openWallModal();
    });
  } catch (err) {
    featureModalBody.innerHTML = `<div class="panel-empty">${err.message}</div>`;
  }
}

async function openNotificationsModal() {
  openFeatureModal('🔔 الإشعارات', '<div class="panel-empty">جاري التحميل...</div>');
  try {
    const data = await apiJson('/api/social/state');
    const list = data.notifications || [];
    featureModalBody.innerHTML = '';
    if (!list.length) {
      featureModalBody.innerHTML = '<div class="panel-empty">لا توجد إشعارات جديدة.</div>';
      return;
    }
    list.forEach((n) => {
      const d = document.createElement('div');
      d.className = 'panel-card';
      d.innerHTML = `<strong>${n.title}</strong><div class="panel-meta-sub">${n.body}</div>`;
      featureModalBody.appendChild(d);
    });
  } catch (err) {
    featureModalBody.innerHTML = `<div class="panel-empty">${err.message}</div>`;
  }
}

function openReportModal() {
  openFeatureModal('🚩 إبلاغ عن مخالفة', (body) => {
    body.innerHTML = `
      <form id="reportForm" class="panel-card">
        <div class="field-group-light">
          <label>اسم المستخدم المخالف</label>
          <input id="repTarget" class="light-input" type="text" placeholder="اكتب اسم المخالف..." required />
        </div>
        <div class="field-group-light">
          <label>سبب الإبلاغ</label>
          <textarea id="repReason" class="light-input" rows="3" placeholder="اشرح سبب البلاغ للإدارة..." required></textarea>
        </div>
        <button type="submit" class="btn btn-danger btn-sm">إرسال البلاغ للإدارة</button>
      </form>
    `;
    document.getElementById('reportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetName = document.getElementById('repTarget').value.trim();
      const reason = document.getElementById('repReason').value.trim();
      try {
        const r = await apiJson('/api/social/report', {
          method: 'POST',
          body: JSON.stringify({ targetName, reason, roomId: state.activeRoomId })
        });
        featureModal.classList.add('hidden');
        showToast(r.message);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function openWalletFeature() {
  openFeatureModal('💰 محفظتي', `
    <div class="wallet-strip">
      <span>الرصيد المتاح:</span>
      <strong>🪙 ${state.user?.coins ?? 1500} نقطة</strong>
    </div>
    <p class="panel-meta-sub">يمكنك استخدام نقاطك في متجر الإطارات والخلفيات المزخرفة لتخصيص ظهورك داخل الشات.</p>
    <button type="button" id="goShopFromWallet" class="btn btn-gold btn-sm">🛍️ فتح المتجر</button>
  `);
  document.getElementById('goShopFromWallet').onclick = () => {
    featureModal.classList.add('hidden');
    openShopModal();
  };
}

function openRoomOptionsFeature() {
  const canEdit = hasPerm('manage_rooms') || hasPanelAccess();
  const currentTheme = state.activeRoom?.bg_theme || 'warm_peach';
  openFeatureModal('🎨 إعدادات الدردشة وخيارات الغرفة', (body) => {
    body.innerHTML = `
      <div class="panel-card">
        <strong>الغرفة الحالية: ${state.activeRoom?.name || 'الغرفة العامة'}</strong>
        <div class="field-group-light">
          <label>خلفية منطقة الرسائل</label>
          <select id="quickThemeSel" class="light-input" ${canEdit ? '' : 'disabled'}>
            <option value="warm_peach" ${currentTheme === 'warm_peach' ? 'selected' : ''}>وردي برتقالي دافئ</option>
            <option value="sunset_rose" ${currentTheme === 'sunset_rose' ? 'selected' : ''}>غروب وردي</option>
            <option value="sky_breeze" ${currentTheme === 'sky_breeze' ? 'selected' : ''}>سماوي منعش</option>
            <option value="emerald_mist" ${currentTheme === 'emerald_mist' ? 'selected' : ''}>أخضر زمردي</option>
            <option value="royal_night" ${currentTheme === 'royal_night' ? 'selected' : ''}>ليلي ملكي</option>
          </select>
        </div>
        ${canEdit ? '<button id="saveQuickThemeBtn" type="button" class="btn btn-royal btn-sm">تطبيق خلفية الغرفة</button>' : '<small class="panel-meta-sub">تغيير خلفية الغرفة متاح للإدارة فقط.</small>'}
      </div>
    `;
    const btn = document.getElementById('saveQuickThemeBtn');
    if (btn) {
      btn.onclick = async () => {
        const bgTheme = document.getElementById('quickThemeSel').value;
        try {
          await apiJson('/api/room/theme', { method: 'POST', body: JSON.stringify({ roomId: state.activeRoomId, bgTheme }) });
          featureModal.classList.add('hidden');
          showToast('✅ تم تغيير خلفية الغرفة');
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
    }
  });
}

function openMicsModal() {
  const canManage = hasPerm('manage_rooms') || hasPanelAccess();
  openFeatureModal('🎙️ تفاعل المايكات الصوتية', (body) => {
    const listHTML = state.micSlots
      .map((s, idx) => `
        <div class="user-row-light">
          <div class="user-row-top">
            <strong>المايك #${idx + 1}: ${s ? s.name : 'متاح للصعود'}</strong>
            <div class="owner-actions">
              ${!s ? `<button type="button" class="mod-btn success" data-take-mic="${idx + 1}">صعود</button>` : ''}
              ${s && canManage ? `<button type="button" class="mod-btn danger" data-kick-mic="${idx + 1}">إنزال</button>` : ''}
            </div>
          </div>
        </div>
      `)
      .join('');

    body.innerHTML = `
      ${canManage ? `
        <div class="panel-card">
          <div class="user-row-top">
            <strong>حالة المايكات بالغرفة: ${state.micsEnabled ? 'مفتوحة 🎙️' : 'مغلقة 🔇'}</strong>
            <button id="toggleRoomMicsBtn" type="button" class="btn btn-gold btn-sm">${state.micsEnabled ? 'إغلاق المايكات' : 'فتح المايكات'}</button>
          </div>
        </div>
      ` : ''}
      ${listHTML}
    `;

    const tBtn = document.getElementById('toggleRoomMicsBtn');
    if (tBtn) {
      tBtn.onclick = () => {
        state.socket.emit('mic_toggle_enabled', { roomId: state.activeRoomId, enabled: !state.micsEnabled });
        featureModal.classList.add('hidden');
      };
    }
    body.querySelectorAll('[data-take-mic]').forEach((b) => {
      b.onclick = () => {
        const slot = Number(b.dataset.takeMic);
        state.socket.emit('mic_take', { roomId: state.activeRoomId, slot });
        startLiveMicCapture(slot);
        featureModal.classList.add('hidden');
      };
    });
    body.querySelectorAll('[data-kick-mic]').forEach((b) => {
      b.onclick = () => {
        state.socket.emit('mic_kick_slot', { roomId: state.activeRoomId, slot: Number(b.dataset.kickMic) });
        featureModal.classList.add('hidden');
      };
    });
  });
}

function openNewsModal() {
  openFeatureModal('📢 أخبار وتحديثات الشات', `
    <div class="panel-card">
      <strong>🎉 أهلاً بكم في التحديث الجديد!</strong>
      <p class="panel-meta-sub">تم تفعيل نظام المايكات الصوتية الخمسة، ومتجر الإطارات الذهبية وخلفيات الأسماء، ونظام الرتب الثمانية الكامل مع لوحة تحكم شاملة للمالك والإدارة.</p>
    </div>
  `);
}

// Close buttons for modals & lightbox
document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.close).classList.add('hidden');
  });
});

closeLightboxBtn.addEventListener('click', () => {
  imageLightbox.classList.add('hidden');
  lightboxImg.src = '';
});

imageLightbox.addEventListener('click', (e) => {
  if (e.target === imageLightbox) {
    imageLightbox.classList.add('hidden');
    lightboxImg.src = '';
  }
});

// Bootstrap
async function init() {
  try {
    const data = await apiJson('/api/bootstrap');
    if (data.ranks) setRanksList(data.ranks);
    if (data.emojis) {
      state.customEmojis = data.emojis;
      rebuildEmojiPopover();
    }
    if (data.siteSettings) applySiteSettings(data.siteSettings);
    if (data.shop) state.shopCatalog = data.shop;
    if (data.rooms) state.rooms = data.rooms;
    if (data.userCount === 0) firstOwnerNotice.classList.remove('hidden');
    if (data.bannedReason) {
      leaveChatSession(`⛔ تم حظرك نهائياً: ${data.bannedReason}`);
      return;
    }
    if (data.user && state.token) {
      enterChatSession(state.token, data.user);
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    state.token = '';
  }
}

init();
