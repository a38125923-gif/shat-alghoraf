const TOKEN_KEY = 'arabic_chat_token';
const ROOM_KEY = 'arabic_chat_active_room';
const USER_CACHE_KEY = 'arabic_chat_user_cache';

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
  activeRoomId: localStorage.getItem(ROOM_KEY) || 'general',
  activeRoom: null,
  usersInRoom: [],
  globalOnlineUsers: [],
  persistentMembers: [],
  membersFilter: 'all',
  micSlots: [null, null, null, null, null],
  micsEnabled: true,
  myMicSlot: null,
  liveMicStream: null,
  liveMicRecorder: null,
  shopCatalog: { frames: [], nameplates: [] },
  socket: null,
  heartbeatInterval: null,
  isMuted: false,
  welcomeStripCollapsed: false,
  radioPlaying: false,
  radioAudioCtx: null,
  radioTimer: null,
  fpmPartner: null,
  fpmMessagesCache: [],
  fpmMinimized: false,
  fpmMaximized: false,
  fpmVoiceActive: false,
  fpmVoiceStream: null,
  fpmVoiceRecorder: null,
  tcDraftText: '#ffffff',
  tcDraftNeon: '',
  tcDraftBg: '',
  tcDraftFont: 'Normal',
  tcDraftStyle: 'Normal',
  roActiveTab: 'settings',
  roDraftImg: '',
  roDraftWall: '',
  editingAdminUserId: null,
  aueDraftAvatarUrl: '',
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
const dropRoomOptionsBtn = document.getElementById('dropRoomOptionsBtn');

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
const toggleWelcomeStripBtn = document.getElementById('toggleWelcomeStripBtn');
const roomWelcomeBanner = document.getElementById('roomWelcomeBanner');
const roomWelcomeText = document.getElementById('roomWelcomeText');

const bannerRoomCard = document.getElementById('bannerRoomCard');
const bannerRoomImg = document.getElementById('bannerRoomImg');
const bannerRoomName = document.getElementById('bannerRoomName');
const bannerRoomOwnerChip = document.getElementById('bannerRoomOwnerChip');
const bannerRoomDesc = document.getElementById('bannerRoomDesc');
const bannerOnlineCount = document.getElementById('bannerOnlineCount');
const bannerRoomOptionsBtn = document.getElementById('bannerRoomOptionsBtn');
const bannerClearRoomBtn = document.getElementById('bannerClearRoomBtn');
const quickEnterRoomsBtn = document.getElementById('quickEnterRoomsBtn');

const chatStreamWrap = document.getElementById('chatStreamWrap');
const messagesFeed = document.getElementById('messagesFeed');
const muteBanner = document.getElementById('muteBanner');

const floatingPmBox = document.getElementById('floatingPmBox');
const fpmAvatar = document.getElementById('fpmAvatar');
const fpmPartnerName = document.getElementById('fpmPartnerName');
const fpmCallStatus = document.getElementById('fpmCallStatus');
const fpmPartnerSelect = document.getElementById('fpmPartnerSelect');
const fpmSettingsBtn = document.getElementById('fpmSettingsBtn');
const fpmCallBtn = document.getElementById('fpmCallBtn');
const fpmMinBtn = document.getElementById('fpmMinBtn');
const fpmMaxBtn = document.getElementById('fpmMaxBtn');
const fpmCloseBtn = document.getElementById('fpmCloseBtn');
const fpmMessages = document.getElementById('fpmMessages');
const fpmForm = document.getElementById('fpmForm');
const fpmInput = document.getElementById('fpmInput');

const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const emojiPopover = document.getElementById('emojiPopover');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const imageFileInput = document.getElementById('imageFileInput');
const composerPlusBtn = document.getElementById('composerPlusBtn');
const composerPlusMenu = document.getElementById('composerPlusMenu');
const plusTextCustomizerBtn = document.getElementById('plusTextCustomizerBtn');
const plusUploadImageBtn = document.getElementById('plusUploadImageBtn');
const plusEditProfileBtn = document.getElementById('plusEditProfileBtn');
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
const navRadioBtn = document.getElementById('navRadioBtn');
const navRadioIcon = document.getElementById('navRadioIcon');
const navRadioLabel = document.getElementById('navRadioLabel');

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
const openTcFromProfileBtn = document.getElementById('openTcFromProfileBtn');

const textCustomizerModal = document.getElementById('textCustomizerModal');
const tcPreviewAvatar = document.getElementById('tcPreviewAvatar');
const tcPreviewRank = document.getElementById('tcPreviewRank');
const tcPreviewName = document.getElementById('tcPreviewName');
const tcPreviewText = document.getElementById('tcPreviewText');
const tcTextSwatches = document.getElementById('tcTextSwatches');
const tcNeonSwatches = document.getElementById('tcNeonSwatches');
const tcBgSwatches = document.getElementById('tcBgSwatches');
const tcTextPicker = document.getElementById('tcTextPicker');
const tcNeonPicker = document.getElementById('tcNeonPicker');
const tcBgPicker = document.getElementById('tcBgPicker');
const tcResetTextBtn = document.getElementById('tcResetTextBtn');
const tcResetNeonBtn = document.getElementById('tcResetNeonBtn');
const tcResetBgBtn = document.getElementById('tcResetBgBtn');
const tcFontSelect = document.getElementById('tcFontSelect');
const tcFontStyleSelect = document.getElementById('tcFontStyleSelect');
const saveTextCustomizerBtn = document.getElementById('saveTextCustomizerBtn');

const roomOptionsModal = document.getElementById('roomOptionsModal');
const roomOptionsTitle = document.getElementById('roomOptionsTitle');
const roomOptionsTabsBar = document.getElementById('roomOptionsTabsBar');
const roomOptionsBody = document.getElementById('roomOptionsBody');

const adminUserEditorModal = document.getElementById('adminUserEditorModal');
const adminUserEditorForm = document.getElementById('adminUserEditorForm');
const adminUserEditorTitle = document.getElementById('adminUserEditorTitle');
const aueAvatarPreview = document.getElementById('aueAvatarPreview');
const aueAvatarFileInput = document.getElementById('aueAvatarFileInput');
const aueChooseAvatarBtn = document.getElementById('aueChooseAvatarBtn');
const aueClearAvatarBtn = document.getElementById('aueClearAvatarBtn');
const aueDisplayName = document.getElementById('aueDisplayName');
const aueUsername = document.getElementById('aueUsername');
const aueEmail = document.getElementById('aueEmail');
const auePassword = document.getElementById('auePassword');
const aueRoleSelect = document.getElementById('aueRoleSelect');

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
const roomOwnerSelect = document.getElementById('roomOwnerSelect');
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

function applyNameplate(el, name, style, color, bgColor = '') {
  el.textContent = name;
  el.className = `nameplate-pill plate-${style || 'default'}`;
  el.style.color = color && (!style || style === 'default') ? color : '';
  if (bgColor && (!style || style === 'default')) {
    el.style.background = bgColor;
  } else {
    el.style.background = '';
  }
}

function resolveCssFontFamily(fontName) {
  const f = (fontName || 'Normal').trim();
  if (!f || f === 'Normal') return '';
  if (f === 'Grandmaster') return "'Cinzel', 'Cairo', serif";
  if (f === 'Comic neue') return "'Comic Neue', 'Cairo', cursive";
  return `'${f}', 'Cairo', sans-serif`;
}

function resolveFontWeightAndStyle(styleName) {
  switch (styleName) {
    case 'Bold':
      return { fontWeight: '800', fontStyle: 'normal' };
    case 'Heavy':
      return { fontWeight: '900', fontStyle: 'normal' };
    case 'Italic':
      return { fontWeight: '700', fontStyle: 'italic' };
    case 'Bold italic':
      return { fontWeight: '800', fontStyle: 'italic' };
    case 'Heavy italic':
      return { fontWeight: '900', fontStyle: 'italic' };
    default:
      return { fontWeight: '700', fontStyle: 'normal' };
  }
}

function applyMessageStylingToEl(el, { textColor, neonColor, fontFamily, fontStyle } = {}) {
  el.style.color = textColor || '#ffffff';
  const cssFont = resolveCssFontFamily(fontFamily);
  el.style.fontFamily = cssFont || '';
  const ws = resolveFontWeightAndStyle(fontStyle);
  el.style.fontWeight = ws.fontWeight;
  el.style.fontStyle = ws.fontStyle;
  if (neonColor) {
    el.style.textShadow = `0 0 6px ${neonColor}, 0 0 14px ${neonColor}, 0 1px 2px rgba(0,0,0,0.8)`;
  } else {
    el.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.65)';
  }
}

function isCurrentUserRoomManager(room = state.activeRoom) {
  if (!state.user || !room) return false;
  if (state.user.role === 'site_owner' || hasPerm('manage_rooms')) return true;
  if (room.owner_user_id && state.user.userId && Number(room.owner_user_id) === Number(state.user.userId)) return true;
  if (Array.isArray(room.staff) && state.user.userId) {
    return room.staff.some((s) => Number(s.user_id) === Number(state.user.userId));
  }
  return false;
}

function playMentionChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(0.001, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.26);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // ignore audio autoplay block
  }
}

function stopAmbientRadio() {
  if (state.radioTimer) {
    clearInterval(state.radioTimer);
    state.radioTimer = null;
  }
  if (state.radioAudioCtx) {
    state.radioAudioCtx.close().catch(() => {});
    state.radioAudioCtx = null;
  }
  state.radioPlaying = false;
  navRadioBtn.classList.remove('playing');
  navRadioIcon.textContent = '▶️';
  navRadioLabel.textContent = 'راديو';
}

function toggleRadioPlayer() {
  if (state.radioPlaying) {
    stopAmbientRadio();
    showToast('⏹️ تم إيقاف تشغيل الراديو');
    return;
  }
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      showToast('متصفحك لا يدعم تشغيل صوت الراديو.', 'error');
      return;
    }
    const ctx = new AudioCtx();
    state.radioAudioCtx = ctx;
    state.radioPlaying = true;
    navRadioBtn.classList.add('playing');
    navRadioIcon.textContent = '⏸️';
    navRadioLabel.textContent = 'إيقاف';

    const chords = [
      [261.63, 329.63, 392.0],
      [293.66, 349.23, 440.0],
      [246.94, 329.63, 392.0],
      [220.0, 261.63, 329.63]
    ];
    let step = 0;
    const playChord = () => {
      if (!state.radioPlaying || !state.radioAudioCtx) return;
      const chord = chords[step % chords.length];
      step += 1;
      const now = ctx.currentTime;
      chord.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.03, now + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
      });
    };
    playChord();
    state.radioTimer = setInterval(playChord, 2500);
    showToast('🎶 تم تشغيل موسيقى الراديو الهادئة');
  } catch {
    stopAmbientRadio();
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

  if (state.activeRoom && !state.activeRoom.welcome_message && settings.welcome_message) {
    roomWelcomeText.textContent = settings.welcome_message;
  }

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

function appendSegmentWithMentions(parentEl, segment) {
  if (!segment) return;
  const mentionRegex = /(@[^\s@:،,!؟?()[\]{}"']+)/g;
  let last = 0;
  let m;
  while ((m = mentionRegex.exec(segment)) !== null) {
    if (m.index > last) {
      parentEl.appendChild(document.createTextNode(segment.slice(last, m.index)));
    }
    const chip = document.createElement('span');
    chip.className = 'mention-chip';
    chip.textContent = m[0];
    parentEl.appendChild(chip);
    last = mentionRegex.lastIndex;
  }
  if (last < segment.length) {
    parentEl.appendChild(document.createTextNode(segment.slice(last)));
  }
}

function renderTextWithCustomEmojis(targetEl, text) {
  targetEl.innerHTML = '';
  if (!text) return;
  const emojis = state.customEmojis || [];
  if (emojis.length === 0) {
    appendSegmentWithMentions(targetEl, text);
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
      appendSegmentWithMentions(targetEl, text.slice(lastIndex, match.index));
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
      appendSegmentWithMentions(targetEl, match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    appendSegmentWithMentions(targetEl, text.slice(lastIndex));
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
    const err = new Error(data.error || 'حدث خطأ غير متوقع.');
    err.status = res.status;
    throw err;
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
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user || null));
  } catch {
    // ignore storage quota errors
  }

  authView.classList.add('hidden');
  chatView.classList.remove('hidden');

  updateMeUI();
  connectSocket();
}

function clearHeartbeatTimer() {
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = null;
  }
}

function leaveChatSession(reasonMsg) {
  stopLiveMicCapture();
  clearHeartbeatTimer();
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  state.token = '';
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem(ROOM_KEY);

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
  applyNameplate(dropMeName, u.name, u.nameplateStyle, u.nameColor, u.nameBgColor);
  dropMeCoins.textContent = `🪙 ${u.coins ?? 1500} نقطة`;
  shopWalletBalance.textContent = `🪙 ${u.coins ?? 1500} نقطة`;

  const isGuest = u.role === 'guest' || u.type === 'guest';
  const hasPanel = hasPanelAccess(u.role);
  const canManageRooms = hasPerm('manage_rooms', u.role);
  const roomMgr = isCurrentUserRoomManager(state.activeRoom);
  const canClearRoom = hasPerm('clear_room', u.role) || roomMgr;

  topUpgradeGuestBtn.classList.toggle('hidden', !isGuest);
  dropUpgradeGuestBtn.classList.toggle('hidden', !isGuest);
  dropAdminPanelBtn.classList.toggle('hidden', !hasPanel);
  dropRoomOptionsBtn.classList.toggle('hidden', !roomMgr);
  bannerRoomOptionsBtn.classList.toggle('hidden', !roomMgr);
  drawerAdminBtn.classList.toggle('hidden', !hasPanel);
  micSettingsBtn.classList.toggle('hidden', !hasPanel && !roomMgr);
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
  if (!composerPlusMenu.contains(e.target) && e.target !== composerPlusBtn) {
    composerPlusMenu.classList.add('hidden');
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
    else if (act === 'text-customizer') openTextCustomizerModal();
    else if (act === 'chat-settings' || act === 'room-options') openRoomOptionsModal();
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
    else if (target === 'text-customizer') openTextCustomizerModal();
    else if (target === 'room-options') openRoomOptionsModal();
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
  openFloatingPm(state.fpmPartner);
});
document.getElementById('topRichBtn').addEventListener('click', () => openLeaderboardsModal('rich'));
document.getElementById('topVipBtn').addEventListener('click', () => openLeaderboardsModal('vips'));

// Mics welcome strip toggle, yellow arrow rooms switch, & room options
toggleWelcomeStripBtn.addEventListener('click', () => {
  state.welcomeStripCollapsed = !state.welcomeStripCollapsed;
  roomWelcomeBanner.classList.toggle('collapsed', state.welcomeStripCollapsed);
});

quickEnterRoomsBtn.addEventListener('click', openRoomsModal);
bannerRoomOptionsBtn.addEventListener('click', () => openRoomOptionsModal());

// Composer '+' popover
composerPlusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  composerPlusMenu.classList.toggle('hidden');
});
plusTextCustomizerBtn.addEventListener('click', () => {
  composerPlusMenu.classList.add('hidden');
  openTextCustomizerModal();
});
plusUploadImageBtn.addEventListener('click', () => {
  composerPlusMenu.classList.add('hidden');
  uploadImageBtn.click();
});
plusEditProfileBtn.addEventListener('click', () => {
  composerPlusMenu.classList.add('hidden');
  openCustomizeModal();
});
openTcFromProfileBtn.addEventListener('click', () => {
  customizeModal.classList.add('hidden');
  openTextCustomizerModal();
});

// Bottom 6 Nav Buttons
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
navRadioBtn.addEventListener('click', toggleRadioPlayer);

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
  clearHeartbeatTimer();
  if (state.socket) {
    state.socket.disconnect();
  }

  const socket = io({
    auth: { token: state.token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling']
  });
  state.socket = socket;

  state.heartbeatInterval = setInterval(() => {
    if (state.socket && state.socket.connected) {
      state.socket.emit('heartbeat', { roomId: state.activeRoomId, ts: Date.now() });
    }
  }, 15000);

  socket.on('connect', () => {
    socket.emit('heartbeat', { roomId: state.activeRoomId, ts: Date.now() });
    socket.emit('join_room', state.activeRoomId || 'general');
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect' && state.token && state.user) {
      setTimeout(() => {
        if (state.socket === socket && !socket.connected && state.token && state.user) {
          socket.connect();
        }
      }, 1200);
    }
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
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
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
    if (active) {
      state.activeRoom = active;
      applyActiveRoomBanner(active);
      updateMeUI();
    }
    if (!roomsModal.classList.contains('hidden')) renderRoomsModalList();
  });

  socket.on('room_joined', ({ room, messages, muteInfo, mics }) => {
    state.activeRoomId = room.id;
    state.activeRoom = room;
    localStorage.setItem(ROOM_KEY, room.id);
    applyActiveRoomBanner(room);
    updateMeUI();
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
      updateMeUI();
    }
    if (!roomOptionsModal.classList.contains('hidden')) {
      renderRoomOptionsTab();
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
    modalOnlineCount.textContent = String(
      state.persistentMembers.length ? state.persistentMembers.length : state.globalOnlineUsers.length
    );
    if (!onlineUsersModal.classList.contains('hidden')) {
      renderGlobalOnlineModal();
    }
  });

  socket.on('persistent_members', (members) => {
    state.persistentMembers = members || [];
    modalOnlineCount.textContent = String(state.persistentMembers.length || state.globalOnlineUsers.length);
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

  socket.on('mention_alert', ({ fromName, text }) => {
    playMentionChime();
    showToast(`🔔 منشن من ${fromName}: ${text || ''}`);
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
    if (!pm) return;
    if (pm.from_key !== state.user?.key) {
      pmDot.classList.remove('hidden');
      showToast(`✉️ رسالة خاصة من ${pm.from_name}`);
    }
    if (!floatingPmBox.classList.contains('hidden')) {
      state.fpmMessagesCache.push(pm);
      renderFloatingPmMessages();
      if (state.fpmPartner && pm.from_key === state.fpmPartner.key) {
        state.socket?.emit('pm_mark_read', { partnerKey: state.fpmPartner.key });
      }
    }
  });

  socket.on('pm_read_receipt', ({ readerKey }) => {
    if (!readerKey) return;
    state.fpmMessagesCache.forEach((m) => {
      if (m.from_key === state.user?.key && m.to_key === readerKey) {
        m.is_read = 1;
      }
    });
    if (!floatingPmBox.classList.contains('hidden')) {
      renderFloatingPmMessages();
    }
  });

  socket.on('pm_voice_call', ({ fromKey, fromName, action }) => {
    if (!fromKey || fromKey === state.user?.key) return;
    if (action === 'end') {
      if (state.fpmPartner?.key === fromKey) {
        stopFloatingPmVoice();
      }
      showToast(`📞 انتهت المكالمة الخاصة مع ${fromName}`);
      return;
    }
    openFloatingPm({ key: fromKey, name: fromName });
    if (action === 'offer') {
      showToast(`📞 مكالمة صوتية خاصة واردة من ${fromName}`);
      fpmCallStatus.textContent = '📞 يتصل بك... اضغط 📞 للرد';
      fpmCallStatus.classList.remove('hidden');
    } else if (action === 'accept') {
      fpmCallStatus.textContent = '🎙️ مكالمة صوتية متصلة الآن';
      fpmCallStatus.classList.remove('hidden');
    }
  });

  socket.on('pm_voice_chunk', ({ fromKey, audioData }) => {
    if (!audioData || !fromKey) return;
    if (state.fpmPartner?.key === fromKey && !floatingPmBox.classList.contains('hidden')) {
      try {
        const audio = new Audio(audioData);
        audio.volume = 0.9;
        audio.play().catch(() => {});
      } catch {
        // ignore audio restriction
      }
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

  const wText =
    (room.welcome_message || '').trim() ||
    (state.siteSettings?.welcome_message || '').trim() ||
    `أهلاً وسهلاً بكم في "${room.name}" — نتمنى لكم أمتع الأوقات!`;
  roomWelcomeText.textContent = wText;

  if (room.owner_name) {
    bannerRoomOwnerChip.textContent = `👑 ${room.owner_name}`;
    bannerRoomOwnerChip.classList.remove('hidden');
  } else {
    bannerRoomOwnerChip.textContent = '';
    bannerRoomOwnerChip.classList.add('hidden');
  }

  bannerRoomCard.style.background = room.card_bg_color || '';
  bannerRoomCard.style.color = room.card_text_color || '';

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

function insertMentionInComposer(targetName) {
  if (!targetName) return;
  const tag = `@${targetName} `;
  const cur = messageInput.value;
  const prefix = cur && !cur.endsWith(' ') ? ' ' : '';
  messageInput.value = `${cur}${prefix}${tag}`;
  messageInput.focus();
}

function makeClientMsgId() {
  return `cmsg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendOptimisticOutgoingMessage({ msgType = 'text', content = '', mediaUrl = '', clientMsgId }) {
  if (!state.user) return;
  appendMessage(
    {
      id: clientMsgId,
      client_msg_id: clientMsgId,
      room_id: state.activeRoomId,
      sender_key: state.user.key,
      sender_name: state.user.name,
      sender_role: state.user.role,
      name_color: state.user.nameColor,
      text_color: state.user.textColor || '#ffffff',
      name_bg_color: state.user.nameBgColor || '',
      neon_color: state.user.neonColor || '',
      font_family: state.user.fontFamily || 'Normal',
      font_style: state.user.fontStyle || 'Normal',
      avatar_url: state.user.avatarUrl || '',
      avatar_frame: state.user.avatarFrame || 'none',
      nameplate_style: state.user.nameplateStyle || 'default',
      msg_type: msgType,
      content,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
      isOptimistic: true
    },
    true
  );
}

function appendMessage(msg, scroll = true) {
  const empty = messagesFeed.querySelector('.empty-feed');
  if (empty) empty.remove();

  // Reconcile optimistic sender message when instant server broadcast returns
  if (msg.client_msg_id) {
    const existingOptimistic = [...messagesFeed.children].find(
      (el) => el.dataset && el.dataset.clientMsgId === String(msg.client_msg_id)
    );
    if (existingOptimistic) {
      if (msg.id) existingOptimistic.dataset.msgId = String(msg.id);
      existingOptimistic.classList.remove('optimistic-pending');
      const timeEl = existingOptimistic.querySelector('.msg-time-cody');
      if (timeEl && msg.created_at) {
        timeEl.textContent = formatTime(msg.created_at);
      }
      return;
    }
  }

  // Prevent duplicate renders of already displayed message IDs
  if (msg.id && !String(msg.id).startsWith('cmsg-')) {
    const alreadyShown = [...messagesFeed.children].some(
      (el) => el.dataset && el.dataset.msgId === String(msg.id)
    );
    if (alreadyShown) return;
  }

  const row = document.createElement('div');
  row.className = `cody-msg-row${msg.isOptimistic ? ' optimistic-pending' : ''}`;
  if (msg.id) row.dataset.msgId = String(msg.id);
  if (msg.client_msg_id) row.dataset.clientMsgId = String(msg.client_msg_id);
  row.dataset.senderKey = msg.sender_key || '';
  row.dataset.senderRole = msg.sender_role || 'member';

  const av = document.createElement('div');
  av.className = 'avatar-circle clickable-user-trigger';
  av.title = `اضغط لعمل منشن لـ ${msg.sender_name}`;
  renderAvatarInto(av, msg.sender_name, msg.avatar_url, msg.name_color, msg.sender_role, msg.avatar_frame);

  const body = document.createElement('div');
  body.className = 'cody-msg-body';

  const inline = document.createElement('div');
  inline.className = 'cody-msg-inline';

  const rankSlot = document.createElement('span');
  rankSlot.className = 'msg-rank-slot clickable-user-trigger';
  rankSlot.title = 'عرض ملف العضو وخيارات الإدارة';
  rankSlot.innerHTML = roleBadgeHTML(msg.sender_role);
  inline.appendChild(rankSlot);

  const nameplate = document.createElement('span');
  applyNameplate(nameplate, msg.sender_name, msg.nameplate_style, msg.name_color, msg.name_bg_color || '');
  nameplate.classList.add('clickable-user-trigger');
  nameplate.title = `اضغط لعمل منشن @${msg.sender_name}`;
  inline.appendChild(nameplate);

  const openSenderCard = () => {
    const sk = row.dataset.senderKey;
    if (!sk) return;
    const match =
      state.persistentMembers.find((u) => u.key === sk) ||
      state.globalOnlineUsers.find((u) => u.key === sk);
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
      nameBgColor: msg.name_bg_color,
      avatarUrl: msg.avatar_url,
      avatarFrame: msg.avatar_frame,
      nameplateStyle: msg.nameplate_style,
      roomName: 'غير متصل حالياً',
      isMuted: false
    });
  };

  // Click-to-Mention when clicking avatar or nameplate; rank badge opens user card
  const mentionHandler = () => {
    const cleanName = nameplate.textContent || msg.sender_name;
    insertMentionInComposer(cleanName);
  };
  av.addEventListener('click', mentionHandler);
  nameplate.addEventListener('click', mentionHandler);
  rankSlot.addEventListener('click', openSenderCard);

  if (msg.content) {
    const colon = document.createElement('span');
    colon.className = 'msg-colon';
    colon.textContent = ':';
    inline.appendChild(colon);

    const txt = document.createElement('span');
    txt.className = 'msg-text-cody';
    applyMessageStylingToEl(txt, {
      textColor: msg.text_color || '#ffffff',
      neonColor: msg.neon_color || '',
      fontFamily: msg.font_family || 'Normal',
      fontStyle: msg.font_style || 'Normal'
    });
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

  const clientMsgId = makeClientMsgId();
  appendOptimisticOutgoingMessage({
    msgType: 'text',
    content,
    mediaUrl: '',
    clientMsgId
  });
  messageInput.value = '';
  messageInput.focus();

  state.socket.emit('send_message', {
    roomId: state.activeRoomId,
    msgType: 'text',
    content,
    clientMsgId
  });
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
    const clientMsgId = makeClientMsgId();
    appendOptimisticOutgoingMessage({
      msgType: 'image',
      content: '',
      mediaUrl: url,
      clientMsgId
    });
    state.socket.emit('send_message', {
      roomId: state.activeRoomId,
      msgType: 'image',
      mediaUrl: url,
      content: '',
      clientMsgId
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
        const clientMsgId = makeClientMsgId();
        appendOptimisticOutgoingMessage({
          msgType: 'audio',
          content: '',
          mediaUrl: url,
          clientMsgId
        });
        state.socket.emit('send_message', {
          roomId: state.activeRoomId,
          msgType: 'audio',
          mediaUrl: url,
          content: '',
          clientMsgId
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
  if (!state.socket || (!hasPerm('clear_room') && !isCurrentUserRoomManager())) return;
  if (confirm('هل تريد مسح جميع رسائل هذه الغرفة؟')) {
    state.socket.emit('admin_clear_room', { roomId: state.activeRoomId });
  }
});

// ==========================================
// PERSISTENT MEMBERS & ONLINE USERS MODAL + ROOMS MODAL
// ==========================================
document.querySelectorAll('[data-members-filter]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-members-filter]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.membersFilter = btn.dataset.membersFilter || 'all';
    renderGlobalOnlineModal();
  });
});

function renderGlobalOnlineModal() {
  const q = onlineModalSearch.value.trim().toLowerCase();
  const baseList =
    state.membersFilter === 'online'
      ? state.globalOnlineUsers
      : state.persistentMembers.length > 0
        ? state.persistentMembers
        : state.globalOnlineUsers;

  const filtered = baseList.filter((u) => {
    const rLabel = getRankInfo(u.role)?.label || '';
    return (
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.roomName || '').toLowerCase().includes(q) ||
      rLabel.toLowerCase().includes(q)
    );
  });

  modalOnlineCount.textContent = String(filtered.length);
  globalOnlineList.innerHTML = '';
  if (filtered.length === 0) {
    globalOnlineList.innerHTML = '<li class="panel-empty">لا يوجد أعضاء مطابقون.</li>';
    return;
  }

  for (const u of filtered) {
    const isOnline = u.isOnline !== false;
    const li = document.createElement('li');
    li.className = `user-row-light ${isOnline ? '' : 'is-offline'}`;

    const top = document.createElement('div');
    top.className = 'user-row-top';

    const left = document.createElement('div');
    left.className = 'user-left';

    const av = document.createElement('div');
    av.className = 'avatar-circle clickable-user-trigger';
    renderAvatarInto(av, u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);

    const info = document.createElement('div');
    info.className = 'clickable-user-trigger';
    const statusDotHtml = `<span class="status-dot-inline ${isOnline ? 'online' : 'offline'}" title="${isOnline ? 'متصل الآن' : 'غير متصل'}"></span>`;
    const statusText = isOnline ? `متصل الآن • ${u.roomName || 'الغرفة العامة'}` : '⚫ غير متصل حالياً';
    info.innerHTML = `
      <div class="me-name-row">
        ${statusDotHtml}
        ${roleBadgeHTML(u.role)}
        <span class="nameplate-pill plate-${u.nameplateStyle || 'default'}"></span>
      </div>
      <div class="panel-meta-sub">${escapeHtml(statusText)} ${u.isMuted ? '• 🔇 مكتوم' : ''}</div>
    `;
    const np = info.querySelector('.nameplate-pill');
    applyNameplate(np, u.name, u.nameplateStyle, u.nameColor, u.nameBgColor || '');

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
        openFloatingPm(u);
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
        openFloatingPm(u);
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

function populateRoomOwnerSelect(selectedOwnerId = null) {
  if (!roomOwnerSelect) return;
  roomOwnerSelect.innerHTML = '';
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'بدون مالك معين (إدارة الموقع فقط)';
  roomOwnerSelect.appendChild(noneOpt);

  const sourceMembers = (
    state.adminOverview?.registeredUsers ||
    state.persistentMembers.filter((m) => m.userId) ||
    []
  );
  const seen = new Set();
  for (const m of sourceMembers) {
    const uid = m.id || m.userId;
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    const opt = document.createElement('option');
    opt.value = String(uid);
    opt.textContent = `👑 ${m.name} (@${m.username || m.name})`;
    roomOwnerSelect.appendChild(opt);
  }
  roomOwnerSelect.value = selectedOwnerId ? String(selectedOwnerId) : '';
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
  populateRoomOwnerSelect(room ? room.owner_user_id : null);
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
    ownerUserId: roomOwnerSelect.value ? Number(roomOwnerSelect.value) : null,
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

  // Registered Members Tab (Full Owner Account Management: Create + Full Edit)
  panelTabMembers.innerHTML = '';
  if (state.user?.role === 'site_owner' || canSetRank) {
    const createCard = document.createElement('form');
    createCard.className = 'cms-section-card';
    const myPower = getRankPower(state.user.role);
    const amOwner = state.user.role === 'site_owner';
    const selectableRanks = (data.ranks || state.ranks || []).filter(
      (r) => r.key !== 'guest' && (amOwner || getRankPower(r.key) < myPower)
    );
    const rankOpts = selectableRanks
      .map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === 'member' ? 'selected' : ''}>${escapeHtml(r.icon || '⭐')} ${escapeHtml(r.label)}</option>`)
      .join('');

    createCard.innerHTML = `
      <div class="cms-section-title">➕ إنشاء حساب عضو جديد يدوياً</div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>الاسم الظاهر</label>
          <input id="adminNewDisplay" class="light-input" type="text" maxlength="28" placeholder="مثال: الأمير محمد" />
        </div>
        <div class="field-group-light">
          <label>اسم المستخدم (للدخول)</label>
          <input id="adminNewUsername" class="light-input" type="text" minlength="2" maxlength="24" required placeholder="mohamed_vip" />
        </div>
        <div class="field-group-light">
          <label>البريد الإلكتروني</label>
          <input id="adminNewEmail" class="light-input" type="email" required placeholder="user@example.com" />
        </div>
        <div class="field-group-light">
          <label>كلمة المرور</label>
          <input id="adminNewPass" class="light-input" type="password" minlength="4" required placeholder="••••" />
        </div>
      </div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>الرتبة المبدئية</label>
          <select id="adminNewRole" class="light-input">${rankOpts}</select>
        </div>
        <div class="field-group-light" style="justify-content:flex-end;">
          <button type="submit" class="btn btn-gold btn-sm">➕ إنشاء الحساب فوراً</button>
        </div>
      </div>
    `;
    createCard.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try {
        const res = await apiJson('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            displayName: createCard.querySelector('#adminNewDisplay').value.trim(),
            username: createCard.querySelector('#adminNewUsername').value.trim(),
            email: createCard.querySelector('#adminNewEmail').value.trim(),
            password: createCard.querySelector('#adminNewPass').value,
            role: createCard.querySelector('#adminNewRole').value
          })
        });
        showToast(res.message);
        await loadAdminOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    panelTabMembers.appendChild(createCard);
  }

  const memFiltered = (data.registeredUsers || []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  if (memFiltered.length === 0) {
    const emp = document.createElement('div');
    emp.className = 'panel-empty';
    emp.textContent = 'لا يوجد أعضاء مطابقون.';
    panelTabMembers.appendChild(emp);
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
              <div class="panel-meta-sub">@${escapeHtml(u.username)} • ${escapeHtml(u.email)}${u.ipAddress ? ` • IP: ${escapeHtml(u.ipAddress)}` : ''}</div>
            </div>
          </div>
        </div>
      `;
      renderAvatarInto(card.querySelector('.avatar-circle'), u.name, u.avatarUrl, u.nameColor, u.role, u.avatarFrame);
      card.querySelector('strong').textContent = u.name;

      const canEditAccount =
        state.user?.role === 'site_owner' ||
        (canSetRank && (u.id === state.user?.userId || getRankPower(u.role) < getRankPower(state.user?.role)));

      if (canModerateTarget(u.role, u.key) || canEditAccount) {
        const actions = document.createElement('div');
        actions.className = 'panel-actions-row';

        if (canEditAccount && (u.role !== 'site_owner' || state.user?.role === 'site_owner')) {
          const fullEditBtn = document.createElement('button');
          fullEditBtn.type = 'button';
          fullEditBtn.className = 'mod-btn success';
          fullEditBtn.textContent = '✏️ تعديل الحساب';
          fullEditBtn.onclick = () => openAdminUserEditorModal(u);
          actions.appendChild(fullEditBtn);
        }

        if (canModerateTarget(u.role, u.key)) {
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
        pmBtn.onclick = () => {
          featureModal.classList.add('hidden');
          openFloatingPm({ key: f.friend_key, name: f.friend_name, avatarUrl: f.friend_avatar, role: f.friend_role });
        };
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
    if (data.persistentMembers) state.persistentMembers = data.persistentMembers;
    if (data.userCount === 0) firstOwnerNotice.classList.remove('hidden');
    if (data.bannedReason) {
      leaveChatSession(`⛔ تم حظرك نهائياً: ${data.bannedReason}`);
      return;
    }
    if (data.user && state.token) {
      enterChatSession(state.token, data.user);
    } else if (state.token && !data.user) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      state.token = '';
    }
  } catch (err) {
    if (err && (err.status === 401 || err.status === 403)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      state.token = '';
      return;
    }
    if (state.token) {
      try {
        const cachedUser = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null');
        if (cachedUser) {
          enterChatSession(state.token, cachedUser);
          showToast('🔄 جاري استعادة الاتصال بالسحابة...');
        }
      } catch {
        // ignore JSON parse errors
      }
    }
  }
}

// ==========================================
// 1. FLOATING PRIVATE CHAT BOX (PM + VOICE CALL + READ TICK)
// ==========================================
async function openFloatingPm(preselectUser = null) {
  if (!state.user) return;
  pmDot.classList.add('hidden');
  floatingPmBox.classList.remove('hidden', 'minimized');
  state.fpmMinimized = false;

  const candidates = [];
  const seenKeys = new Set();
  const pushCandidate = (u) => {
    if (!u || !u.key || u.key === state.user?.key || seenKeys.has(u.key)) return;
    seenKeys.add(u.key);
    candidates.push(u);
  };
  if (preselectUser) pushCandidate(preselectUser);
  state.globalOnlineUsers.forEach(pushCandidate);
  state.persistentMembers.forEach(pushCandidate);

  if (!state.fpmPartner || (preselectUser && preselectUser.key)) {
    state.fpmPartner = preselectUser || candidates[0] || null;
  }

  try {
    const socialData = await apiJson('/api/social/state');
    state.fpmMessagesCache = socialData.privateMessages || [];
    if (!state.fpmPartner && state.fpmMessagesCache.length > 0) {
      const last = state.fpmMessagesCache[state.fpmMessagesCache.length - 1];
      const pKey = last.from_key === state.user.key ? last.to_key : last.from_key;
      const pName = last.from_key === state.user.key ? last.to_name : last.from_name;
      state.fpmPartner = { key: pKey, name: pName };
      pushCandidate(state.fpmPartner);
    }
  } catch {
    // ignore fetch error
  }

  fpmPartnerSelect.innerHTML = '';
  if (candidates.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'لا يوجد أعضاء للمراسلة';
    fpmPartnerSelect.appendChild(opt);
  } else {
    candidates.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.key;
      opt.textContent = `${c.isOnline === false ? '⚫' : '🟢'} ${c.name}`;
      if (state.fpmPartner && state.fpmPartner.key === c.key) opt.selected = true;
      fpmPartnerSelect.appendChild(opt);
    });
  }

  syncFloatingPmHeader();
  renderFloatingPmMessages();
  if (state.fpmPartner?.key) {
    state.socket?.emit('pm_mark_read', { partnerKey: state.fpmPartner.key });
  }
}

function syncFloatingPmHeader() {
  const p = state.fpmPartner;
  if (!p) {
    fpmPartnerName.textContent = 'اختر عضواً للخاص';
    renderAvatarInto(fpmAvatar, '?', '', '#ffffff', 'member', 'none');
    return;
  }
  const full =
    state.persistentMembers.find((u) => u.key === p.key) ||
    state.globalOnlineUsers.find((u) => u.key === p.key) ||
    p;
  fpmPartnerName.textContent = full.name || p.name;
  renderAvatarInto(fpmAvatar, full.name, full.avatarUrl || '', full.nameColor || '#ffffff', full.role || 'member', full.avatarFrame || 'none');
}

function renderFloatingPmMessages() {
  fpmMessages.innerHTML = '';
  const p = state.fpmPartner;
  if (!p || !p.key) {
    fpmMessages.innerHTML = '<div class="panel-empty">اختر عضواً من القائمة لبدء المحادثة الخاصة.</div>';
    return;
  }
  const thread = (state.fpmMessagesCache || []).filter(
    (m) =>
      (m.from_key === state.user?.key && m.to_key === p.key) ||
      (m.from_key === p.key && m.to_key === state.user?.key)
  );
  if (thread.length === 0) {
    fpmMessages.innerHTML = '<div class="panel-empty">ابدأ محادثتك الخاصة الآن!</div>';
    return;
  }
  thread.forEach((m) => {
    const isMine = m.from_key === state.user?.key;
    const row = document.createElement('div');
    row.className = `fpm-msg-row ${isMine ? 'sent' : 'received'}`;

    const bubble = document.createElement('div');
    bubble.className = `fpm-bubble ${isMine ? 'sent' : 'received'}`;
    bubble.textContent = m.content;

    const meta = document.createElement('div');
    meta.className = 'fpm-meta';
    const tickHtml = isMine
      ? `<span class="fpm-read-tick ${m.is_read ? 'read' : ''}">${m.is_read ? '✓✓' : '✓'}</span>`
      : '';
    meta.innerHTML = `${tickHtml}<span>${formatTime(m.created_at)}</span>`;

    row.appendChild(bubble);
    row.appendChild(meta);
    fpmMessages.appendChild(row);
  });
  fpmMessages.scrollTop = fpmMessages.scrollHeight;
}

fpmPartnerSelect.addEventListener('change', () => {
  const k = fpmPartnerSelect.value;
  if (!k) return;
  const found =
    state.persistentMembers.find((u) => u.key === k) ||
    state.globalOnlineUsers.find((u) => u.key === k);
  state.fpmPartner = found || { key: k, name: fpmPartnerSelect.options[fpmPartnerSelect.selectedIndex]?.textContent || k };
  syncFloatingPmHeader();
  renderFloatingPmMessages();
  state.socket?.emit('pm_mark_read', { partnerKey: state.fpmPartner.key });
});

fpmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = fpmInput.value.trim();
  if (!content || !state.fpmPartner?.key) return;
  fpmInput.value = '';
  try {
    const { pm } = await apiJson('/api/social/pm', {
      method: 'POST',
      body: JSON.stringify({
        toKey: state.fpmPartner.key,
        toName: state.fpmPartner.name,
        content
      })
    });
    if (pm && !state.fpmMessagesCache.some((m) => m.id === pm.id)) {
      state.fpmMessagesCache.push(pm);
    }
    renderFloatingPmMessages();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

fpmSettingsBtn.addEventListener('click', openTextCustomizerModal);
fpmMinBtn.addEventListener('click', () => {
  state.fpmMinimized = !state.fpmMinimized;
  floatingPmBox.classList.toggle('minimized', state.fpmMinimized);
  if (state.fpmMinimized) {
    state.fpmMaximized = false;
    floatingPmBox.classList.remove('maximized');
  }
});
fpmMaxBtn.addEventListener('click', () => {
  state.fpmMaximized = !state.fpmMaximized;
  state.fpmMinimized = false;
  floatingPmBox.classList.remove('minimized');
  floatingPmBox.classList.toggle('maximized', state.fpmMaximized);
});
fpmCloseBtn.addEventListener('click', () => {
  stopFloatingPmVoice();
  floatingPmBox.classList.add('hidden');
  floatingPmBox.classList.remove('minimized', 'maximized');
});

function stopFloatingPmVoice(notifyPartner = false) {
  if (notifyPartner && state.fpmPartner?.key) {
    state.socket?.emit('pm_voice_call', { toKey: state.fpmPartner.key, action: 'end' });
  }
  if (state.fpmVoiceRecorder && state.fpmVoiceRecorder.state !== 'inactive') {
    try {
      state.fpmVoiceRecorder.stop();
    } catch {
      // ignore
    }
  }
  state.fpmVoiceRecorder = null;
  if (state.fpmVoiceStream) {
    state.fpmVoiceStream.getTracks().forEach((t) => t.stop());
    state.fpmVoiceStream = null;
  }
  state.fpmVoiceActive = false;
  fpmCallBtn.classList.remove('active-call');
  fpmCallStatus.classList.add('hidden');
}

fpmCallBtn.addEventListener('click', async () => {
  if (!state.fpmPartner?.key) return;
  if (state.fpmVoiceActive) {
    stopFloatingPmVoice(true);
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('متصفحك لا يدعم المكالمات الصوتية.', 'error');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.fpmVoiceStream = stream;
    const rec = new MediaRecorder(stream);
    state.fpmVoiceRecorder = rec;
    state.fpmVoiceActive = true;
    fpmCallBtn.classList.add('active-call');
    fpmCallStatus.textContent = '🎙️ مكالمة صوتية نشطة الآن';
    fpmCallStatus.classList.remove('hidden');

    state.socket?.emit('pm_voice_call', { toKey: state.fpmPartner.key, action: 'offer' });
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0 && state.fpmVoiceActive && state.fpmPartner?.key) {
        const reader = new FileReader();
        reader.onloadend = () => {
          state.socket?.emit('pm_voice_chunk', {
            toKey: state.fpmPartner.key,
            audioData: reader.result
          });
        };
        reader.readAsDataURL(ev.data);
      }
    };
    rec.start(1400);
  } catch {
    showToast('تعذر تشغيل الميكروفون للمكالمة الخاصة.', 'error');
  }
});

// ==========================================
// 2. ADVANCED TEXT, NAME & NEON CUSTOMIZER
// ==========================================
const TC_SWATCHES_TEXT = ['#ffffff', '#fef08a', '#bae6fd', '#a7f3d0', '#fbcfe8', '#fda4af', '#c4b5fd', '#fed7aa', '#0f172a', '#fde047', '#38bdf8', '#f472b6'];
const TC_SWATCHES_NEON = ['', '#38bdf8', '#f472b6', '#facc15', '#4ade80', '#a855f7', '#fb7185', '#f97316', '#ef4444', '#22d3ee'];
const TC_SWATCHES_BG = ['', '#1e293b', '#1a45e5', '#7c3aed', '#b91c1c', '#059669', '#d97706', '#db2777', '#0f766e', '#000000'];

function buildTcSwatches(container, colors, getCur, onPick) {
  container.innerHTML = '';
  colors.forEach((col) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `tc-swatch ${getCur() === col ? 'active' : ''}`;
    if (!col) {
      b.style.background = 'linear-gradient(135deg,#fff 45%,#ef4444 48%,#fff 52%)';
      b.title = 'بدون / افتراضي';
    } else {
      b.style.background = col;
    }
    b.addEventListener('click', () => {
      onPick(col);
      syncTextCustomizerPreview();
      buildTcSwatches(container, colors, getCur, onPick);
    });
    container.appendChild(b);
  });
}

function syncTextCustomizerPreview() {
  if (!state.user) return;
  renderAvatarInto(tcPreviewAvatar, state.user.name, state.user.avatarUrl, state.user.nameColor, state.user.role, state.user.avatarFrame);
  tcPreviewRank.innerHTML = roleBadgeHTML(state.user.role);
  applyNameplate(tcPreviewName, state.user.name, state.user.nameplateStyle, state.user.nameColor, state.tcDraftBg);
  applyMessageStylingToEl(tcPreviewText, {
    textColor: state.tcDraftText,
    neonColor: state.tcDraftNeon,
    fontFamily: state.tcDraftFont,
    fontStyle: state.tcDraftStyle
  });
  tcFontSelect.value = state.tcDraftFont || 'Normal';
  tcFontStyleSelect.value = state.tcDraftStyle || 'Normal';
  if (/^#[0-9a-fA-F]{6}$/.test(state.tcDraftText)) tcTextPicker.value = state.tcDraftText;
  if (/^#[0-9a-fA-F]{6}$/.test(state.tcDraftNeon)) tcNeonPicker.value = state.tcDraftNeon;
  if (/^#[0-9a-fA-F]{6}$/.test(state.tcDraftBg)) tcBgPicker.value = state.tcDraftBg;
}

function openTextCustomizerModal() {
  if (!state.user) return;
  state.tcDraftText = state.user.textColor || '#ffffff';
  state.tcDraftNeon = state.user.neonColor || '';
  state.tcDraftBg = state.user.nameBgColor || '';
  state.tcDraftFont = state.user.fontFamily || 'Normal';
  state.tcDraftStyle = state.user.fontStyle || 'Normal';

  buildTcSwatches(tcTextSwatches, TC_SWATCHES_TEXT, () => state.tcDraftText, (c) => { state.tcDraftText = c || '#ffffff'; });
  buildTcSwatches(tcNeonSwatches, TC_SWATCHES_NEON, () => state.tcDraftNeon, (c) => { state.tcDraftNeon = c; });
  buildTcSwatches(tcBgSwatches, TC_SWATCHES_BG, () => state.tcDraftBg, (c) => { state.tcDraftBg = c; });

  syncTextCustomizerPreview();
  textCustomizerModal.classList.remove('hidden');
}

document.querySelectorAll('[data-tc-tab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-tc-tab]').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const key = tab.dataset.tcTab;
    document.getElementById('tcTabText').classList.toggle('hidden', key !== 'text');
    document.getElementById('tcTabNeon').classList.toggle('hidden', key !== 'neon');
    document.getElementById('tcTabBg').classList.toggle('hidden', key !== 'bg');
  });
});

tcTextPicker.addEventListener('input', (e) => {
  state.tcDraftText = e.target.value;
  syncTextCustomizerPreview();
});
tcNeonPicker.addEventListener('input', (e) => {
  state.tcDraftNeon = e.target.value;
  syncTextCustomizerPreview();
});
tcBgPicker.addEventListener('input', (e) => {
  state.tcDraftBg = e.target.value;
  syncTextCustomizerPreview();
});
tcResetTextBtn.addEventListener('click', () => {
  state.tcDraftText = '#ffffff';
  syncTextCustomizerPreview();
});
tcResetNeonBtn.addEventListener('click', () => {
  state.tcDraftNeon = '';
  syncTextCustomizerPreview();
});
tcResetBgBtn.addEventListener('click', () => {
  state.tcDraftBg = '';
  syncTextCustomizerPreview();
});
tcFontSelect.addEventListener('change', (e) => {
  state.tcDraftFont = e.target.value;
  syncTextCustomizerPreview();
});
tcFontStyleSelect.addEventListener('change', (e) => {
  state.tcDraftStyle = e.target.value;
  syncTextCustomizerPreview();
});

saveTextCustomizerBtn.addEventListener('click', async () => {
  try {
    const data = await apiJson('/api/profile/customize', {
      method: 'POST',
      body: JSON.stringify({
        textColor: state.tcDraftText,
        neonColor: state.tcDraftNeon,
        nameBgColor: state.tcDraftBg,
        fontFamily: state.tcDraftFont,
        fontStyle: state.tcDraftStyle
      })
    });
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem(TOKEN_KEY, data.token);
    updateMeUI();
    textCustomizerModal.classList.add('hidden');
    showToast('✅ تم حفظ تنسيق النص والخط والنيون فوراً!');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ==========================================
// 3. ROOM OPTIONS MODAL (5 SECTIONS FOR ROOM OWNERS/STAFF/ADMINS)
// ==========================================
function openRoomOptionsModal() {
  if (!state.activeRoom) return;
  if (!isCurrentUserRoomManager(state.activeRoom)) {
    openRoomOptionsFeature();
    return;
  }
  state.roActiveTab = 'settings';
  state.roDraftImg = state.activeRoom.image_url || '/assets/rooms/default.svg';
  state.roDraftWall = state.activeRoom.wallpaper_url || '';
  roomOptionsTitle.textContent = `🏠 خيارات غرفة: ${state.activeRoom.name}`;
  document.querySelectorAll('.ro-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.roTab === state.roActiveTab);
  });
  renderRoomOptionsTab();
  roomOptionsModal.classList.remove('hidden');
}

document.querySelectorAll('.ro-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ro-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    state.roActiveTab = tab.dataset.roTab;
    renderRoomOptionsTab();
  });
});

function renderRoomOptionsTab() {
  const r = state.activeRoom;
  if (!r) return;
  roomOptionsBody.innerHTML = '';

  if (state.roActiveTab === 'settings') {
    const form = document.createElement('form');
    form.className = 'cms-section-card';
    const powerOpts = [
      '<option value="0">مفتوحة للجميع (بما في ذلك الزوار)</option>',
      ...[...(state.ranks || [])]
        .filter((rk) => rk.key !== 'guest')
        .sort((a, b) => a.power - b.power)
        .map((rk) => `<option value="${rk.power}" ${Number(r.min_rank_power) === Number(rk.power) ? 'selected' : ''}>${escapeHtml(rk.icon || '⭐')} ${escapeHtml(rk.label)} (${rk.power}+)</option>`)
    ].join('');

    form.innerHTML = `
      <div class="cms-section-title">1. إعدادات الغرفة الأساسية</div>
      <div class="room-image-editor">
        <img id="roImgPreview" class="room-avatar room-avatar-lg" src="${escapeHtml(state.roDraftImg)}" alt="" />
        <div>
          <input id="roImgInp" type="file" accept="image/*" class="hidden" />
          <button id="roUploadImgBtn" type="button" class="btn btn-royal btn-sm">🖼️ تغيير صورة الغرفة</button>
        </div>
      </div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>اسم الغرفة</label>
          <input id="roName" class="light-input" type="text" maxlength="40" required value="${escapeHtml(r.name)}" />
        </div>
        <div class="field-group-light">
          <label>وصف الغرفة</label>
          <input id="roDesc" class="light-input" type="text" maxlength="120" value="${escapeHtml(r.description || '')}" />
        </div>
      </div>
      <div class="field-group-light">
        <label>شريط الترحيب والإعلان داخل الغرفة</label>
        <input id="roWelcome" class="light-input" type="text" maxlength="250" value="${escapeHtml(r.welcome_message || '')}" placeholder="أهلاً بالجميع في الغرفة..." />
      </div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>كلمة مرور الغرفة (اتركه فارغاً بدون تغيير)</label>
          <input id="roPass" class="light-input" type="text" maxlength="40" placeholder="••••" />
        </div>
        <div class="field-group-light">
          <label>صلاحية الدخول (أقل قوة رتبة)</label>
          <select id="roMinPower" class="light-input">${powerOpts}</select>
        </div>
      </div>
      <button type="submit" class="btn btn-gold btn-sm">💾 حفظ إعدادات الغرفة</button>
    `;

    const imgInp = form.querySelector('#roImgInp');
    form.querySelector('#roUploadImgBtn').onclick = () => imgInp.click();
    imgInp.addEventListener('change', async () => {
      const f = imgInp.files?.[0];
      imgInp.value = '';
      if (!f) return;
      const fd = new FormData();
      fd.append('file', f);
      try {
        const { url } = await apiJson(`/api/upload/room?roomId=${encodeURIComponent(r.id)}`, { method: 'POST', body: fd });
        state.roDraftImg = url;
        form.querySelector('#roImgPreview').src = url;
        showToast('✅ تم رفع صورة الغرفة');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const body = {
        name: form.querySelector('#roName').value.trim(),
        description: form.querySelector('#roDesc').value.trim(),
        welcomeMessage: form.querySelector('#roWelcome').value.trim(),
        minRankPower: Number(form.querySelector('#roMinPower').value) || 0,
        imageUrl: state.roDraftImg
      };
      const passVal = form.querySelector('#roPass').value.trim();
      if (passVal) body.roomPassword = passVal;
      try {
        const res = await apiJson(`/api/rooms/${encodeURIComponent(r.id)}/options`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        state.activeRoom = res.room;
        applyActiveRoomBanner(res.room);
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    roomOptionsBody.appendChild(form);
    return;
  }

  if (state.roActiveTab === 'style') {
    const form = document.createElement('form');
    form.className = 'cms-section-card';
    form.innerHTML = `
      <div class="cms-section-title">2. ستايل الروم (الخلفيات وألوان البطاقة)</div>
      <div class="cms-grid">
        <div class="field-group-light">
          <label>قالب خلفية الغرفة</label>
          <select id="roBgTheme" class="light-input">
            <option value="warm_peach" ${r.bg_theme === 'warm_peach' ? 'selected' : ''}>وردي برتقالي دافئ</option>
            <option value="sunset_rose" ${r.bg_theme === 'sunset_rose' ? 'selected' : ''}>غروب وردي</option>
            <option value="sky_breeze" ${r.bg_theme === 'sky_breeze' ? 'selected' : ''}>سماوي منعش</option>
            <option value="emerald_mist" ${r.bg_theme === 'emerald_mist' ? 'selected' : ''}>أخضر زمردي</option>
            <option value="royal_night" ${r.bg_theme === 'royal_night' ? 'selected' : ''}>ليلي ملكي</option>
          </select>
        </div>
        <div class="field-group-light">
          <label>لون / تدرج CSS مخصص للخلفية</label>
          <input id="roBgCustom" class="light-input" type="text" value="${escapeHtml(r.bg_custom || '')}" placeholder="مثال: linear-gradient(135deg,#1e3a8a,#7c3aed)" />
        </div>
        <div class="field-group-light">
          <label>لون بطاقة الغرفة العلوية</label>
          <input id="roCardBg" class="light-input" type="color" value="${escapeHtml(r.card_bg_color || '#fef9ec')}" />
        </div>
        <div class="field-group-light">
          <label>لون نص بطاقة الغرفة</label>
          <input id="roCardText" class="light-input" type="color" value="${escapeHtml(r.card_text_color || '#78350f')}" />
        </div>
      </div>
      <div class="field-group-light">
        <label>صورة خلفية مخصصة للغرفة</label>
        <div class="avatar-upload-row">
          <input id="roWallInp" type="file" accept="image/*" class="hidden" />
          <button id="roUploadWallBtn" type="button" class="btn btn-royal btn-sm">🌄 رفع صورة خلفية</button>
          <button id="roClearWallBtn" type="button" class="btn btn-light btn-sm">إزالة الخلفية</button>
        </div>
      </div>
      <button type="submit" class="btn btn-gold btn-sm">🎨 تطبيق الستايل الآن</button>
    `;
    const wallInp = form.querySelector('#roWallInp');
    form.querySelector('#roUploadWallBtn').onclick = () => wallInp.click();
    form.querySelector('#roClearWallBtn').onclick = () => {
      state.roDraftWall = '';
      showToast('تم تحديد إزالة الخلفية، اضغط تطبيق للحفظ.');
    };
    wallInp.addEventListener('change', async () => {
      const f = wallInp.files?.[0];
      wallInp.value = '';
      if (!f) return;
      const fd = new FormData();
      fd.append('file', f);
      try {
        const { url } = await apiJson(`/api/upload/wallpaper?roomId=${encodeURIComponent(r.id)}`, { method: 'POST', body: fd });
        state.roDraftWall = url;
        showToast('✅ تم رفع صورة الخلفية، اضغط تطبيق الستايل.');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try {
        const res = await apiJson(`/api/rooms/${encodeURIComponent(r.id)}/options`, {
          method: 'PUT',
          body: JSON.stringify({
            bgTheme: form.querySelector('#roBgTheme').value,
            bgCustom: form.querySelector('#roBgCustom').value.trim(),
            cardBgColor: form.querySelector('#roCardBg').value,
            cardTextColor: form.querySelector('#roCardText').value,
            wallpaperUrl: state.roDraftWall
          })
        });
        state.activeRoom = res.room;
        applyActiveRoomBanner(res.room);
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    roomOptionsBody.appendChild(form);
    return;
  }

  if (state.roActiveTab === 'staff') {
    const registeredCandidates = state.persistentMembers.filter((m) => m.userId);
    const memberOpts = registeredCandidates
      .map((m) => `<option value="${m.userId}">${escapeHtml(m.name)} (${escapeHtml(getRankInfo(m.role).label)})</option>`)
      .join('');
    const card = document.createElement('div');
    card.className = 'cms-section-card';
    card.innerHTML = `
      <div class="cms-section-title">3. إدارة موظفي ومشرفي الغرفة</div>
      <div class="panel-meta-sub">👑 المالك المعين للغرفة: <strong>${escapeHtml(r.owner_name || 'إدارة الموقع')}</strong></div>
      <form id="roAddStaffForm" class="cms-grid">
        <div class="field-group-light">
          <label>اختر عضواً مسجلاً</label>
          <select id="roStaffUserSel" class="light-input" required>${memberOpts}</select>
        </div>
        <div class="field-group-light">
          <label>المسمى داخل الغرفة</label>
          <select id="roStaffRoleSel" class="light-input">
            <option value="مشرف غرفة">مشرف غرفة</option>
            <option value="مراقب مايكات">مراقب مايكات</option>
            <option value="مساعد مالك الغرفة">مساعد مالك الغرفة</option>
          </select>
        </div>
        <button type="submit" class="btn btn-gold btn-sm">➕ تعيين في طاقم الغرفة</button>
      </form>
      <div id="roStaffList" style="display:flex;flex-direction:column;gap:7px;"></div>
    `;
    const staffListEl = card.querySelector('#roStaffList');
    const staffArr = Array.isArray(r.staff) ? r.staff : [];
    if (staffArr.length === 0) {
      staffListEl.innerHTML = '<div class="panel-empty">لا يوجد موظفون إضافيون لهذه الغرفة حالياً.</div>';
    } else {
      staffArr.forEach((st) => {
        const item = document.createElement('div');
        item.className = 'panel-card';
        item.innerHTML = `
          <div class="panel-card-top">
            <div>
              <strong>${escapeHtml(st.display_name || st.username)}</strong>
              <div class="panel-meta-sub">${escapeHtml(st.staff_role || 'مشرف غرفة')}</div>
            </div>
            <button type="button" class="mod-btn danger">🗑️ إزالة</button>
          </div>
        `;
        item.querySelector('button').onclick = async () => {
          try {
            const res = await apiJson(`/api/rooms/${encodeURIComponent(r.id)}/staff/${st.user_id}`, { method: 'DELETE' });
            state.activeRoom = res.room;
            renderRoomOptionsTab();
            showToast(res.message);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
        staffListEl.appendChild(item);
      });
    }

    card.querySelector('#roAddStaffForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const userId = Number(card.querySelector('#roStaffUserSel').value);
      const staffRole = card.querySelector('#roStaffRoleSel').value;
      if (!userId) return;
      try {
        const res = await apiJson(`/api/rooms/${encodeURIComponent(r.id)}/staff`, {
          method: 'POST',
          body: JSON.stringify({ userId, staffRole, action: 'add_staff' })
        });
        state.activeRoom = res.room;
        renderRoomOptionsTab();
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    roomOptionsBody.appendChild(card);
    return;
  }

  if (state.roActiveTab === 'mics') {
    const card = document.createElement('div');
    card.className = 'cms-section-card';
    const slotsHTML = state.micSlots
      .map((s, idx) => `
        <div class="user-row-light">
          <div class="user-row-top">
            <strong>🎙️ المايك #${idx + 1}: ${s ? escapeHtml(s.name) : 'متاح'}</strong>
            ${s ? `<button type="button" class="mod-btn danger" data-ro-kick-mic="${idx + 1}">إنزال</button>` : ''}
          </div>
        </div>
      `)
      .join('');
    card.innerHTML = `
      <div class="cms-section-title">4. إعدادات المايكات داخل الغرفة</div>
      <div class="panel-card-top">
        <strong>حالة المايكات الصوتية: ${state.micsEnabled ? 'مفتوحة 🎙️' : 'مغلقة 🔇'}</strong>
        <button id="roToggleMicsBtn" type="button" class="btn btn-gold btn-sm">${state.micsEnabled ? 'إغلاق المايكات في الغرفة' : 'فتح المايكات في الغرفة'}</button>
      </div>
      ${slotsHTML}
    `;
    card.querySelector('#roToggleMicsBtn').onclick = () => {
      state.socket?.emit('mic_toggle_enabled', { roomId: r.id, enabled: !state.micsEnabled });
    };
    card.querySelectorAll('[data-ro-kick-mic]').forEach((b) => {
      b.onclick = () => state.socket?.emit('mic_kick_slot', { roomId: r.id, slot: Number(b.dataset.roKickMic) });
    });
    roomOptionsBody.appendChild(card);
    return;
  }

  // Section 5: Room Moderation Actions
  const actionsCard = document.createElement('div');
  actionsCard.className = 'cms-section-card';
  actionsCard.innerHTML = `
    <div class="cms-section-title">5. إدارة الإجراءات الفورية داخل الغرفة</div>
    <div class="panel-actions-row">
      <button id="roClearMsgsBtn" type="button" class="btn btn-danger btn-sm">🧹 مسح جميع رسائل الغرفة</button>
    </div>
    <div id="roUsersActionsList" style="display:flex;flex-direction:column;gap:7px;"></div>
  `;
  actionsCard.querySelector('#roClearMsgsBtn').onclick = () => {
    if (confirm(`مسح كل رسائل غرفة "${r.name}"؟`)) {
      state.socket?.emit('admin_clear_room', { roomId: r.id });
    }
  };
  const uListEl = actionsCard.querySelector('#roUsersActionsList');
  const othersInRoom = state.usersInRoom.filter((u) => u.key !== state.user?.key);
  if (othersInRoom.length === 0) {
    uListEl.innerHTML = '<div class="panel-empty">لا يوجد أعضاء آخرون داخل الغرفة حالياً.</div>';
  } else {
    othersInRoom.forEach((u) => {
      const row = document.createElement('div');
      row.className = 'user-row-light';
      row.innerHTML = `
        <div class="user-row-top">
          <div class="me-name-row">${roleBadgeHTML(u.role)} <strong>${escapeHtml(u.name)}</strong> ${u.isMuted ? '<span class="muted-tag">مكتوم</span>' : ''}</div>
          <div class="owner-actions">
            <button type="button" class="mod-btn warn ro-mute-btn">${u.isMuted ? '🔊 فك كتم' : '🔇 كتم'}</button>
            <button type="button" class="mod-btn danger ro-kick-btn">👢 طرد من الغرفة</button>
          </div>
        </div>
      `;
      row.querySelector('.ro-mute-btn').onclick = () => {
        state.socket?.emit('admin_mute', { targetKey: u.key, roomId: r.id, minutes: u.isMuted ? 0 : 60 });
      };
      row.querySelector('.ro-kick-btn').onclick = () => {
        state.socket?.emit('room_kick_member', { roomId: r.id, targetKey: u.key });
      };
      uListEl.appendChild(row);
    });
  }
  roomOptionsBody.appendChild(actionsCard);
}

// ==========================================
// 4. OWNER FULL USER ACCOUNT EDITOR MODAL
// ==========================================
function openAdminUserEditorModal(userObj) {
  if (!userObj) return;
  state.editingAdminUserId = userObj.id;
  state.aueDraftAvatarUrl = userObj.avatarUrl || '';
  adminUserEditorTitle.textContent = `✏️ تعديل حساب: ${userObj.name}`;
  aueDisplayName.value = userObj.name || '';
  aueUsername.value = userObj.username || '';
  aueEmail.value = userObj.email || '';
  auePassword.value = '';

  aueRoleSelect.innerHTML = '';
  const amOwner = state.user?.role === 'site_owner';
  const myPower = getRankPower(state.user?.role);
  const rankList = (state.adminOverview?.ranks || state.ranks || []).filter((r) => r.key !== 'guest');
  rankList
    .filter((r) => amOwner || getRankPower(r.key) < myPower || r.key === userObj.role)
    .forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.key;
      opt.textContent = `${r.icon || '⭐'} ${r.label}`;
      if (r.key === userObj.role) opt.selected = true;
      aueRoleSelect.appendChild(opt);
    });

  renderAvatarInto(aueAvatarPreview, userObj.name, state.aueDraftAvatarUrl, userObj.nameColor, userObj.role, userObj.avatarFrame);
  adminUserEditorModal.classList.remove('hidden');
}

aueChooseAvatarBtn.addEventListener('click', () => aueAvatarFileInput.click());
aueClearAvatarBtn.addEventListener('click', () => {
  state.aueDraftAvatarUrl = '';
  renderAvatarInto(aueAvatarPreview, aueDisplayName.value || '?', '', '#ffffff', aueRoleSelect.value, 'none');
});
aueAvatarFileInput.addEventListener('change', async () => {
  const f = aueAvatarFileInput.files?.[0];
  aueAvatarFileInput.value = '';
  if (!f) return;
  const fd = new FormData();
  fd.append('file', f);
  try {
    showToast('جاري رفع صورة العضو...');
    const { url } = await apiJson('/api/upload/admin-avatar', { method: 'POST', body: fd });
    state.aueDraftAvatarUrl = url;
    renderAvatarInto(aueAvatarPreview, aueDisplayName.value || '?', url, '#ffffff', aueRoleSelect.value, 'none');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

adminUserEditorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.editingAdminUserId) return;
  const payload = {
    displayName: aueDisplayName.value.trim(),
    username: aueUsername.value.trim(),
    email: aueEmail.value.trim(),
    avatarUrl: state.aueDraftAvatarUrl,
    role: aueRoleSelect.value
  };
  if (auePassword.value) payload.password = auePassword.value;
  try {
    const res = await apiJson(`/api/admin/users/${state.editingAdminUserId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    showToast(res.message);
    adminUserEditorModal.classList.add('hidden');
    await loadAdminOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.token && state.user && state.socket) {
    if (!state.socket.connected) {
      state.socket.connect();
    } else {
      state.socket.emit('heartbeat', { roomId: state.activeRoomId, ts: Date.now() });
    }
  }
});

window.addEventListener('online', () => {
  if (state.token && state.user && state.socket && !state.socket.connected) {
    state.socket.connect();
  }
});

init();
