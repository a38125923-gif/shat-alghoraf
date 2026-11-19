(() => {
  const TOKEN_KEY = 'arabic_chat_token_v3';
  const ROOM_KEY = 'arabic_chat_room_v3';
  const DEVICE_ID_KEY = 'arabic_chat_device_id_v1';
  const REF_KEY = 'arabic_chat_ref_v1';

  function getOrCreateDeviceId() {
    let did = localStorage.getItem(DEVICE_ID_KEY);
    if (!did) {
      did = `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, did);
    }
    return did;
  }

  const EMOJI_CATEGORIES = {
    faces: [
      '😀', '😃', '😄', '😁', '😆', '🥹', '😂', '🤣', '😊', '😇', '🙂', '😉',
      '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😒', '😔', '😭', '😤',
      '😡', '🤯', '😳', '🥺', '🤔', '🤭', '🤫', '😴', '🤗', '🤝', '👏', '🙏'
    ],
    hearts: [
      '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍',
      '❤️‍🔥', '❤️‍🩹', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🫶',
      '🌹', '🥀', '🌺', '🌸', '💐', '🌷', '🌻', '🌼'
    ],
    arabic_stickers: [
      '🕌 السلام عليكم',
      '🌹 أهلاً وسهلاً',
      '✨ منورين المكان',
      '☀️ صباح الخير',
      '🌙 مساء النور',
      '👑 تسلم يا غالي',
      '🔥 كفو والله',
      '💯 صح لسانك',
      '❤️ الله يسعدك',
      '🤝 حياك الله',
      '🎉 ألف مبروك',
      '☕ تفضلوا قهوة'
    ]
  };

  const ANIMATED_STICKERS = [
    { id: 'crown_king', glyph: '👑', label: 'تاج ملكي' },
    { id: 'heart_fire', glyph: '❤️‍🔥', label: 'قلب متوهج' },
    { id: 'rocket_boom', glyph: '🚀', label: 'انطلاق' },
    { id: 'rose_gift', glyph: '🌹', label: 'وردة' },
    { id: 'diamond_vip', glyph: '💎', label: 'ألماس' },
    { id: 'fire_hot', glyph: '🔥', label: 'حماس' },
    { id: 'clap_bravo', glyph: '👏', label: 'تصفيق' },
    { id: 'party_pop', glyph: '🥳', label: 'احتفال' },
    { id: 'kiss_love', glyph: '😘', label: 'محبة' },
    { id: 'trophy_win', glyph: '🏆', label: 'كأس' },
    { id: 'butterfly', glyph: '🦋', label: 'فراشة' },
    { id: 'sparkle_star', glyph: '✨', label: 'نجوم' }
  ];

  const NAME_COLOR_SWATCHES = [
    '#0f172a', '#1e293b', '#b71c4a', '#dc2626', '#ea580c', '#d97706',
    '#16a34a', '#0d9488', '#0284c7', '#1a45e5', '#7c3aed', '#db2777'
  ];

  const RANK_ICON_PRESETS = [
    '👑', '💎', '⭐', '🏆', '🛡️', '🦅', '⚜️', '🔥',
    '✨', '🎖️', '🔰', '💫', '🐉', '🦁', '🌟', '💍'
  ];

  const RANK_BADGE_STYLES = [
    { id: 'crown_royal', label: 'تاج ملكي', iconClass: 'fa-solid fa-crown' },
    { id: 'gold_eagle', label: 'نسر ذهبي', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'silver_wing', label: 'جناح فضي', iconClass: 'fa-solid fa-dove' },
    { id: 'diamond_medal', label: 'وسام ماسي', iconClass: 'fa-solid fa-gem' },
    { id: 'royal_shield', label: 'درع ملكي', iconClass: 'fa-solid fa-shield-halved' },
    { id: 'neon_badge', label: 'شارة نيون', iconClass: 'fa-solid fa-certificate' }
  ];

  const DEFAULT_RADIO_STATIONS = [
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

  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const state = {
    deviceId: getOrCreateDeviceId(),
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: null,
    settings: {},
    ranks: [],
    emojis: [],
    rooms: [],
    currentRoom: null,
    isRoomManager: false,
    messages: [],
    mics: [],
    roomUsers: [],
    onlineUsers: [],
    persistentMembers: [],
    news: [],
    giftsCatalog: [],
    shopItems: { frames: [], nameplates: [], shines: [], profileBackgrounds: [], rankBadgeStyles: [], musicPresets: [], radioStations: DEFAULT_RADIO_STATIONS },
    social: { friends: [], privateMessages: [], wallPosts: [], notifications: [], unreadNotifCount: 0, myGifts: { received: [], sent: [] } },
    socket: null,
    heartbeatTimer: null,
    adminNoticeMode: false,
    ytLocalMuted: false,
    ytBarOpen: false,
    activeCustomizeTab: 'info',
    activeNameStyleTab: 'color',
    activeLeaderboardTab: 'rich',
    activeAdminTab: 'stats',
    activeEmojiTab: 'faces',
    giftTarget: null,
    adminOverview: null,
    editingRankKey: null,
    editingRoomId: null,
    profileAudioEl: null,
    profileSynthTimer: null,
    activeMusicRef: '',
    radioAudioEl: null,
    radioSynthTimer: null,
    selectedRadioId: DEFAULT_RADIO_STATIONS[0].id,
    radioPlaying: false,
    // WebRTC Voice Mics
    localStream: null,
    isSelfMicMuted: false,
    micPeers: new Map(), // remoteSocketId -> RTCPeerConnection
    mediaRecorder: null,
    recordedChunks: [],
    isRecordingAudio: false,
    typingTimeout: null,
    micsCollapsed: false,
    deepLinkHandled: false,
    activeSlideDrawer: null,
    activeSlidePmTarget: null,
    roomKingKey: null,
    activeOwnerSubTab: 'surveillance',
    ownerSuite: null
  };

  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message, isError = false) {
    const box = $('toastContainer');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast-item${isError ? ' error' : ''}`;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function playNotificationChime(kind = 'notif') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'gift' ? 'triangle' : 'sine';
      if (kind === 'gift') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.09);
        osc.frequency.setValueAtTime(783.99, now + 0.18);
      } else if (kind === 'mention') {
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.setValueAtTime(1046.5, now + 0.09);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
      }
      gain.gain.setValueAtTime(kind === 'mention' ? 0.09 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.37);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch {
      // ignore audio context block
    }
  }

  function stopProfileMusic() {
    if (state.profileAudioEl) {
      try {
        state.profileAudioEl.pause();
        state.profileAudioEl.src = '';
      } catch {
        // ignore
      }
      state.profileAudioEl = null;
    }
    if (state.profileSynthTimer) {
      clearInterval(state.profileSynthTimer);
      state.profileSynthTimer = null;
    }
    state.activeMusicRef = '';
    const previewBtn = $('custMusicPreviewBtn');
    if (previewBtn) previewBtn.textContent = '▶️ تجربة';
    const quBtn = $('quMusicToggleBtn');
    if (quBtn) quBtn.textContent = '🎵 تشغيل موسيقى البروفايل';
  }

  function playProfileMusic(musicRef) {
    const ref = String(musicRef || '').trim();
    if (!ref) {
      stopProfileMusic();
      return false;
    }
    if (state.activeMusicRef === ref) {
      stopProfileMusic();
      return false;
    }
    stopProfileMusic();
    state.activeMusicRef = ref;

    if (ref.startsWith('preset:')) {
      const sequences = {
        'preset:calm_lofi': [261.63, 329.63, 392.0, 493.88],
        'preset:royal_oud': [293.66, 349.23, 440.0, 523.25],
        'preset:ambient_stars': [220.0, 277.18, 329.63, 440.0]
      };
      const notes = sequences[ref] || sequences['preset:calm_lofi'];
      let step = 0;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        stopProfileMusic();
        showToast('المتصفح لا يدعم تشغيل النغمات.', true);
        return false;
      }
      const playStep = () => {
        try {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = ref === 'preset:royal_oud' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(notes[step % notes.length], now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.56);
          setTimeout(() => ctx.close().catch(() => {}), 650);
          step += 1;
        } catch {
          // ignore
        }
      };
      playStep();
      state.profileSynthTimer = setInterval(playStep, 620);
      return true;
    }

    try {
      const audio = new Audio(ref);
      audio.loop = true;
      audio.volume = 0.45;
      audio.play().catch(() => {
        showToast('تعذر تشغيل رابط الصوت المباشر.', true);
        stopProfileMusic();
      });
      state.profileAudioEl = audio;
      return true;
    } catch {
      stopProfileMusic();
      return false;
    }
  }

  async function api(url, opts = {}) {
    const headers = { ...(opts.headers || {}), 'X-Device-Id': state.deviceId };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, {
      ...opts,
      headers,
      body: opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string'
        ? JSON.stringify(opts.body)
        : opts.body
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم.');
    return data;
  }

  function getRank(roleKey) {
    return (
      state.ranks.find((r) => r.key === roleKey) || {
        key: roleKey || 'member',
        label: 'عضو',
        icon: '👤',
        badge_style: 'royal_shield',
        image_url: '',
        bg_color: '#334155',
        text_color: '#ffffff',
        power: 5,
        permissions: {}
      }
    );
  }

  function hasPerm(perm) {
    if (!state.user) return false;
    if (state.user.role === 'site_owner') return true;
    const rk = getRank(state.user.role);
    return Boolean(rk.permissions && rk.permissions[perm]);
  }

  function rankStyleIconHtml(r) {
    if (r.image_url) {
      return `<img src="${escapeHtml(r.image_url)}" class="rank-badge-img" alt="" />`;
    }
    const styleObj = RANK_BADGE_STYLES.find((s) => s.id === r.badge_style);
    if (styleObj) {
      return `<i class="${escapeHtml(styleObj.iconClass)}"></i>`;
    }
    return `<span>${escapeHtml(r.icon || '⭐')}</span>`;
  }

  function roleBadgeHTML(roleKey, compact = false) {
    const r = getRank(roleKey);
    const styleClass = r.badge_style ? `rank-badge-style-${escapeHtml(r.badge_style)}` : '';
    const iconHtml = rankStyleIconHtml(r);
    if (compact) {
      return `<span class="rank-icon-mini ${styleClass}" title="${escapeHtml(r.label)}" style="background:${escapeHtml(r.bg_color)};color:${escapeHtml(r.text_color)}">${iconHtml}</span>`;
    }
    return `<span class="rank-badge ${styleClass}" style="background:${escapeHtml(r.bg_color)};color:${escapeHtml(r.text_color)}">${iconHtml}<span>${escapeHtml(r.label)}</span></span>`;
  }

  function formatNameHTML(userObj) {
    const uKey = userObj.sender_key || userObj.key || '';
    const name = escapeHtml(userObj.sender_name || userObj.name || 'عضو');
    const role = userObj.sender_role || userObj.role || 'member';
    const isQuizBot = uKey === 'system:quizbot' || uKey === 'system:official';
    const shine = userObj.name_shine || userObj.nameShine || 'none';
    const wings = Boolean(userObj.vip_wings || userObj.vipWings);
    const nameplate = userObj.nameplate_style || userObj.nameplateStyle || 'default';
    const nameColor = userObj.name_color || userObj.nameColor || '#111827';
    const nameBg = userObj.name_bg_color || userObj.nameBgColor || '';
    const neon = userObj.neon_color || userObj.neonColor || '';
    const ff = userObj.font_family || userObj.fontFamily || 'Normal';
    const fs = userObj.font_style || userObj.fontStyle || 'Normal';
    const fontSize = Math.max(11, Math.min(18, Number(userObj.font_size || userObj.fontSize) || 12));

    const classes = ['sender-name-btn'];
    if (nameplate && nameplate !== 'default') classes.push(`nameplate-${nameplate}`);
    if (shine && shine !== 'none') classes.push(`shine-${shine}`);

    const styles = [];
    if (shine === 'none') styles.push(`color:${escapeHtml(nameColor)}`);
    if (nameBg) {
      styles.push(`background-color:${escapeHtml(nameBg)}`);
    } else if (role === 'site_owner' && !isQuizBot && (!nameplate || nameplate === 'default')) {
      styles.push('background-color:#18181b');
    } else if (!nameplate || nameplate === 'default') {
      styles.push('background-color:#f4f4f5');
    }
    if (neon) styles.push(`text-shadow:0 0 8px ${escapeHtml(neon)}, 0 0 14px ${escapeHtml(neon)}`);
    if (ff && ff !== 'Normal') styles.push(`font-family:'${escapeHtml(ff)}', sans-serif`);
    if (fs === 'Bold') styles.push('font-weight:900');
    if (fs === 'Italic') styles.push('font-style:italic');
    styles.push(`font-size:${fontSize}px`);

    const leftWing = wings ? '<span class="vip-wing">🪽</span>' : role === 'site_owner' && !isQuizBot ? '<span class="vip-wing">👑</span>' : '';
    const rightWing = wings ? '<span class="vip-wing">🪽</span>' : '';

    const lowerColor = String(nameColor || '').trim().toLowerCase();
    const hasCustomSurface = Boolean(nameBg) || (nameplate && nameplate !== 'default') || (role === 'site_owner' && !isQuizBot);
    const resolvedStyles = [...styles];
    if (role === 'site_owner' && !isQuizBot && shine === 'none' && !nameBg && (!nameColor || lowerColor === '#0f172a' || lowerColor === '#111827')) {
      resolvedStyles[0] = 'color:#fbbf24';
    } else if (shine === 'none' && !hasCustomSurface && (!nameColor || lowerColor === '#ffffff' || lowerColor === '#fff')) {
      resolvedStyles[0] = 'color:#111827';
    }

    const verifiedHtml = role === 'site_owner' && !isQuizBot
      ? '<i class="fa-solid fa-circle-check owner-verified-badge" title="حساب المالك الموثق"></i>'
      : '';
    const kingHtml = uKey && state.roomKingKey && uKey === state.roomKingKey && role !== 'site_owner'
      ? '<span class="room-king-badge" title="الأكثر تفاعلاً في الغرفة"><i class="fa-solid fa-crown"></i> ملك الغرفة</span>'
      : '';

    return `<span class="${classes.join(' ')}" style="${resolvedStyles.join(';')}">${leftWing}<span>${name}</span>${rightWing}</span>${verifiedHtml}${kingHtml}`;
  }

  function formatAvatarHTML(userObj, sizeClass = '') {
    const name = String(userObj.sender_name || userObj.name || 'ع').trim();
    const avatarUrl = userObj.avatar_url || userObj.avatarUrl || '';
    const frame = userObj.avatar_frame || userObj.avatarFrame || 'none';
    const letter = escapeHtml(name.slice(0, 1) || 'ع');
    const inner = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" />`
      : `<span class="avatar-letter">${letter}</span>`;
    return `<span class="avatar-wrap ${sizeClass} frame-${escapeHtml(frame)}">${inner}</span>`;
  }

  function formatTimeAgo(dateInput) {
    if (!dateInput) return 'الآن';
    const ms = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    if (!ms || Number.isNaN(ms)) return 'الآن';
    const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (diffSec < 45) return 'الآن';
    const mins = Math.floor(diffSec / 60);
    if (mins === 1) return 'منذ دقيقة';
    if (mins === 2) return 'منذ دقيقتين';
    if (mins < 11) return `منذ ${mins} دقائق`;
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs === 1) return 'منذ ساعة';
    if (hrs === 2) return 'منذ ساعتين';
    if (hrs < 11) return `منذ ${hrs} ساعات`;
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    return new Date(ms).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }

  function insertMention(name) {
    const clean = String(name || '').trim();
    const input = $('messageInput');
    if (!clean || !input) return;
    const prefix = input.value && !input.value.endsWith(' ') ? ' ' : '';
    input.value = `${input.value}${prefix}@${clean} `;
    input.focus();
  }

  function findKnownUserByMention(mentionText) {
    const target = String(mentionText || '').trim().toLowerCase();
    if (!target) return null;
    const pools = [state.roomUsers, state.onlineUsers, state.persistentMembers];
    for (const pool of pools) {
      for (const u of pool || []) {
        const n1 = String(u.name || u.displayName || '').trim().toLowerCase();
        const n2 = String(u.username || '').trim().toLowerCase();
        if ((n1 && n1 === target) || (n2 && n2 === target)) return u;
      }
    }
    return null;
  }

  function renderContentWithEmojis(rawText) {
    let html = escapeHtml(rawText);
    for (const e of state.emojis) {
      if (!e.code || !e.image_url) continue;
      const escapedCode = escapeHtml(e.code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(
        new RegExp(escapedCode, 'g'),
        `<img src="${escapeHtml(e.image_url)}" class="inline-custom-emoji" alt="${escapeHtml(e.code)}" title="${escapeHtml(e.code)}" />`
      );
    }
    return html;
  }

  function renderMessageTextWithMentions(rawText) {
    let html = renderContentWithEmojis(rawText);
    const knownNames = [];
    const seen = new Set();
    for (const pool of [state.roomUsers, state.onlineUsers, state.persistentMembers]) {
      for (const u of pool || []) {
        for (const nm of [u.name, u.username]) {
          const clean = String(nm || '').trim();
          if (clean && !seen.has(clean.toLowerCase())) {
            seen.add(clean.toLowerCase());
            knownNames.push({ name: clean, user: u });
          }
        }
      }
    }
    knownNames.sort((a, b) => b.name.length - a.name.length);
    for (const item of knownNames) {
      const esc = escapeHtml(item.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const bg = item.user.nameBgColor || item.user.name_bg_color || '#18181b';
      const fg = item.user.nameBgColor || item.user.name_bg_color
        ? (item.user.nameColor || item.user.name_color || '#ffffff')
        : '#ffffff';
      html = html.replace(
        new RegExp(`@${esc}`, 'gi'),
        `<span class="mention-inline-badge" data-mention-name="${escapeHtml(item.name)}" style="background:${escapeHtml(bg)};color:${escapeHtml(fg)};">@${escapeHtml(item.name)}</span>`
      );
    }
    // Highlight any unmatched @token cleanly as well
    html = html.replace(
      /(^|\s)@([^\s<>"'&]{2,30})/g,
      '$1<span class="mention-inline-badge" data-mention-name="$2" style="background:#18181b;color:#facc15;">@$2</span>'
    );
    return html;
  }

  function applySiteSettings(s) {
    if (!s) return;
    state.settings = s;
    document.title = s.site_name || 'شات الغرف المباشر';
    if ($('authSiteName')) $('authSiteName').textContent = s.site_name || 'شات الغرف المباشر';
    if ($('authSiteDesc')) $('authSiteDesc').textContent = s.site_description || '';
    if ($('drawerSiteTitle')) $('drawerSiteTitle').textContent = s.site_name || 'القائمة الرئيسية';
    if (s.site_logo && $('authSiteLogo')) {
      $('authSiteLogo').src = s.site_logo;
      $('authSiteLogo').classList.remove('hidden');
    }
    const root = document.documentElement.style;
    const normBarColor = (c) => (!c || c === '#1a45e5' || c === '#0b2239' ? '#18181b' : c);
    root.setProperty('--top-bar-bg', normBarColor(s.top_bar_color));
    root.setProperty('--bottom-bar-bg', normBarColor(s.bottom_bar_color));
    root.setProperty('--accent-btn', normBarColor(s.button_color));
    if (s.font_family) root.setProperty('--chat-font', `'${s.font_family}', 'Cairo', sans-serif`);
    if (s.font_size) root.setProperty('--chat-font-size', `${s.font_size}px`);
    if ($('dynamicCmsCss')) $('dynamicCmsCss').textContent = s.custom_css || '';
    if ($('customHtmlBanner')) {
      if (s.custom_html && s.custom_html.trim()) {
        $('customHtmlBanner').innerHTML = s.custom_html;
        $('customHtmlBanner').classList.remove('hidden');
      } else {
        $('customHtmlBanner').classList.add('hidden');
      }
    }
  }

  function updateNotificationBadge(count) {
    state.social.unreadNotifCount = Math.max(0, Number(count) || 0);
    const badge = $('notifBadge');
    if (!badge) return;
    if (state.social.unreadNotifCount > 0) {
      badge.textContent = state.social.unreadNotifCount > 99 ? '99+' : String(state.social.unreadNotifCount);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function updateFriendAndPmBadges() {
    const pendingFriends = (state.social.friends || []).filter(
      (f) => f.status === 'pending' && f.requested_by !== state.user?.key
    ).length;
    const fBadge = $('friendBadge');
    if (fBadge) {
      fBadge.textContent = String(pendingFriends);
      fBadge.classList.toggle('hidden', pendingFriends === 0);
    }

    const unreadPm = (state.social.privateMessages || []).filter(
      (m) => m.to_key === state.user?.key && Number(m.is_read) === 0
    ).length;
    const pBadge = $('pmBadge');
    if (pBadge) {
      pBadge.textContent = String(unreadPm);
      pBadge.classList.toggle('hidden', unreadPm === 0);
    }
  }

  function renderUserIdentity() {
    const u = state.user;
    if (!u) return;
    const wrap = $('topAvatarWrap');
    wrap.className = `avatar-wrap frame-${u.avatarFrame || 'none'}`;
    if (u.avatarUrl) {
      $('topAvatarImg').src = u.avatarUrl;
      $('topAvatarImg').classList.remove('hidden');
      $('topAvatarLetter').classList.add('hidden');
    } else {
      $('topAvatarImg').classList.add('hidden');
      $('topAvatarLetter').classList.remove('hidden');
      $('topAvatarLetter').textContent = (u.name || 'ع').slice(0, 1);
    }

    const isOwner = u.role === 'site_owner';
    const isStealth = isOwner && Boolean(u.isStealth);
    $('topStealthBadge').classList.toggle('hidden', !isStealth);
    $('dropStealthBtn').classList.toggle('hidden', !isOwner);
    $('drawerStealthBtn').classList.toggle('hidden', !isOwner);
    $('dropOwnerSuiteBtn')?.classList.toggle('hidden', !isOwner);
    $('drawerOwnerSuiteBtn')?.classList.toggle('hidden', !isOwner);
    $('admOwnerSuiteTabBtn')?.classList.toggle('hidden', !isOwner);

    $('dropUserName').textContent = u.name;
    $('dropUserRole').innerHTML = `${roleBadgeHTML(u.role)}`;
    $('dropUserCoins').innerHTML = `<i class="fa-solid fa-coins"></i> ${u.coins || 0} عملة • <i class="fa-solid fa-fire"></i> ${u.activityPoints || 0} تفاعل`;

    $('dropStealthBtn').innerHTML = isStealth
      ? '<i class="fa-solid fa-eye"></i> إلغاء وضع التخفي'
      : '<i class="fa-solid fa-user-secret"></i> تفعيل وضع التخفي';
    $('drawerStealthBtn').innerHTML = isStealth
      ? '<i class="fa-solid fa-eye"></i> إلغاء التخفي'
      : '<i class="fa-solid fa-user-secret"></i> وضع التخفي';

    const isFrozen = Boolean(u.isFrozen && !isOwner);
    const fBanner = $('frozenUserBanner');
    if (fBanner) {
      fBanner.classList.toggle('hidden', !isFrozen);
      if (isFrozen) {
        fBanner.innerHTML = '<i class="fa-solid fa-snowflake"></i> حسابك مجمد حالياً من الإدارة (وضع القراءة فقط — لا يمكنك الإرسال أو التنقل).';
      }
    }

    const canPanel = isOwner || hasPerm('access_panel');
    $('dropAdminBtn').classList.toggle('hidden', !canPanel);
    $('drawerAdminBtn').classList.toggle('hidden', !canPanel);
    $('plusAdminNoticeBtn').classList.toggle('hidden', !canPanel);
    $('plusClearRoomBtn').classList.toggle('hidden', !(isOwner || hasPerm('clear_room') || state.isRoomManager));
  }

  function renderRoomBanner() {
    const r = state.currentRoom;
    if (!r) return;
    $('roomBannerName').textContent = `${r.name}${r.is_frozen ? ' ❄️' : ''}`;
    $('roomBannerDesc').textContent = r.description || '';
    $('roomBannerImg').src = r.image_url || '/assets/rooms/default.svg';
    $('roomActivityBadge').innerHTML = `<i class="fa-solid fa-fire"></i> ${r.activity_points || 0} تفاعل`;
    $('roomSettingsBtn')?.classList.toggle('hidden', !state.isRoomManager);

    const pinnedBar = $('pinnedRoyalBanner');
    if (pinnedBar) {
      const pinText = String(r.pinned_message || '').trim();
      pinnedBar.classList.toggle('hidden', !pinText);
      if (pinText) {
        const isOwner = state.user?.role === 'site_owner';
        pinnedBar.innerHTML = `
          <div style="min-width:0;flex:1;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-thumbtack" style="color:#fbbf24;flex-shrink:0;"></i>
            <span style="word-break:break-word;"><strong>رسالة مثبتة:</strong> ${escapeHtml(pinText)}</span>
          </div>
          ${isOwner ? '<button type="button" id="unpinRoyalBannerBtn" class="yt-mini-btn danger" title="إزالة التثبيت"><i class="fa-solid fa-xmark"></i></button>' : ''}
        `;
        $('unpinRoyalBannerBtn')?.addEventListener('click', async () => {
          try {
            await api('/api/owner/action', { method: 'POST', body: { action: 'pin_message', roomId: r.id, message: '' } });
          } catch (err) {
            showToast(err.message, true);
          }
        });
      }
    }

    const baseTopic = r.welcome_message || r.description || state.settings?.marquee_text || 'أهلاً بكم في شات الغرف المباشر!';
    const topicTxt = r.is_frozen ? `❄️ الغرفة مجمدة حالياً (للقراءة فقط) • ${baseTopic}` : baseTopic;
    if ($('topicBannerText')) $('topicBannerText').textContent = topicTxt;

    const boosted = Math.max(state.roomUsers.length, Number(r.onlineCount || 0));
    if ($('roomOnlineCounter')) $('roomOnlineCounter').textContent = String(boosted);

    const stage = $('chatStage');
    stage.className = `chat-stage theme-${r.bg_theme || 'warm_peach'}`;
    if (r.wallpaper_url) {
      stage.style.backgroundImage = `url("${r.wallpaper_url}")`;
    } else if (r.bg_custom) {
      stage.style.background = r.bg_custom;
    } else {
      stage.style.backgroundImage = '';
      stage.style.background = '';
    }

    renderRoomYoutubeBar();
  }

  function renderRoomYoutubeBar() {
    const r = state.currentRoom;
    if (!r) return;
    const hasVideo = Boolean(r.youtube_video_id && r.youtube_is_playing);
    $('ytManagerForm').classList.toggle('hidden', !state.isRoomManager);
    $('ytStopBtn').classList.toggle('hidden', !(state.isRoomManager && hasVideo));
    $('toggleYoutubeBarBtn').classList.toggle('active', hasVideo || state.ytBarOpen);

    if (hasVideo) {
      $('roomYoutubeBar').classList.remove('hidden');
      $('ytNowPlayingLabel').innerHTML = `<i class="fa-brands fa-youtube" style="color:#ef4444"></i> يوتيوب الغرفة: ${escapeHtml(r.youtube_title || r.youtube_video_id)}`;
      $('ytPlayerContainer').classList.remove('hidden');
      const targetSrc = `https://www.youtube.com/embed/${encodeURIComponent(r.youtube_video_id)}?autoplay=1&enablejsapi=1${state.ytLocalMuted ? '&mute=1' : ''}`;
      if ($('ytIframe').dataset.videoId !== r.youtube_video_id || $('ytIframe').dataset.muted !== String(state.ytLocalMuted)) {
        $('ytIframe').src = targetSrc;
        $('ytIframe').dataset.videoId = r.youtube_video_id;
        $('ytIframe').dataset.muted = String(state.ytLocalMuted);
      }
    } else {
      $('ytPlayerContainer').classList.add('hidden');
      if ($('ytIframe').src) {
        $('ytIframe').src = '';
        delete $('ytIframe').dataset.videoId;
      }
      $('ytNowPlayingLabel').innerHTML = '<i class="fa-brands fa-youtube" style="color:#ef4444"></i> مشغل يوتيوب الغرفة';
      $('roomYoutubeBar').classList.toggle('hidden', !state.ytBarOpen);
    }
    $('ytMuteLocalBtn').innerHTML = state.ytLocalMuted
      ? '<i class="fa-solid fa-volume-xmark"></i> صامت'
      : '<i class="fa-solid fa-volume-high"></i> صوت';
  }

  async function performYouTubeSearch() {
    const q = $('ytSearchInput')?.value?.trim() || '';
    if (!q) return showToast('أدخل اسم الأغنية أو الفيديو للبحث في يوتيوب.', true);
    const resBox = $('ytSearchResults');
    resBox.classList.remove('hidden');
    resBox.innerHTML = '<div class="muted" style="color:#cbd5e1;padding:6px;">جاري البحث في يوتيوب...</div>';
    try {
      const data = await api(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      const results = data.results || [];
      if (!results.length) {
        resBox.innerHTML = '<div class="muted" style="color:#cbd5e1;padding:6px;">لم يتم العثور على نتائج مطابقة.</div>';
        return;
      }
      resBox.innerHTML = results.map((v) => `
        <button type="button" class="yt-result-card" data-vid="${escapeHtml(v.videoId)}" data-title="${escapeHtml(v.title)}">
          <img src="${escapeHtml(v.thumbnail)}" class="yt-result-thumb" alt="" />
          <div class="yt-result-meta">
            <div class="yt-result-title">${escapeHtml(v.title)}</div>
            <div class="yt-result-sub">${escapeHtml(v.author)} • ${escapeHtml(v.duration)}</div>
          </div>
          <i class="fa-solid fa-circle-play" style="color:#38bdf8;font-size:18px;"></i>
        </button>
      `).join('');

      resBox.querySelectorAll('.yt-result-card').forEach((card) => {
        card.addEventListener('click', () => {
          const videoId = card.dataset.vid;
          const title = card.dataset.title;
          state.socket.emit('room_youtube_set', { roomId: state.currentRoom?.id, url: videoId, title, isPlaying: true }, (res) => {
            if (res?.error) showToast(res.error, true);
            else {
              showToast(`تم تشغيل: ${title}`);
              resBox.classList.add('hidden');
            }
          });
        });
      });
    } catch (err) {
      resBox.innerHTML = `<div class="muted" style="color:#fca5a5;padding:6px;">${escapeHtml(err.message)}</div>`;
    }
  }

  function getRadioStations() {
    return (state.shopItems.radioStations && state.shopItems.radioStations.length)
      ? state.shopItems.radioStations
      : DEFAULT_RADIO_STATIONS;
  }

  function stopRadioStream() {
    if (state.radioAudioEl) {
      try {
        state.radioAudioEl.pause();
        state.radioAudioEl.src = '';
      } catch {
        // ignore
      }
      state.radioAudioEl = null;
    }
    if (state.radioSynthTimer) {
      clearInterval(state.radioSynthTimer);
      state.radioSynthTimer = null;
    }
    state.radioPlaying = false;
    $('footerRadioBtn')?.classList.remove('playing');
    const rIco = $('footerRadioBtn')?.querySelector('.fn-ico');
    if (rIco) rIco.innerHTML = '<i class="fa-solid fa-radio"></i>';
  }

  function startRadioStream(stationId = state.selectedRadioId) {
    stopRadioStream();
    const stations = getRadioStations();
    const station = stations.find((s) => s.id === stationId) || stations[0];
    if (!station) return;
    state.selectedRadioId = station.id;
    state.radioPlaying = true;
    $('footerRadioBtn')?.classList.add('playing');
    const rIco = $('footerRadioBtn')?.querySelector('.fn-ico');
    if (rIco) rIco.innerHTML = '<i class="fa-solid fa-pause"></i>';
    if ($('footerRadioStationName')) $('footerRadioStationName').textContent = station.name.slice(0, 10);

    try {
      const audio = new Audio(station.streamUrl);
      audio.crossOrigin = 'anonymous';
      audio.volume = 0.65;
      audio.play().catch(() => {
        // Smooth ambient synth fallback if browser blocks cross-origin radio stream
        playProfileMusic('preset:royal_oud');
      });
      state.radioAudioEl = audio;
      showToast(`تم تشغيل: ${station.name}`);
    } catch {
      playProfileMusic('preset:royal_oud');
    }
    renderRadioStationsPopover();
  }

  function renderRadioStationsPopover() {
    const list = $('radioStationsList');
    if (!list) return;
    const stations = getRadioStations();
    list.innerHTML = stations.map((st) => `
      <button type="button" class="radio-station-item ${state.selectedRadioId === st.id ? 'active' : ''}" data-station-id="${escapeHtml(st.id)}">
        <div>
          <div style="font-size:12px;font-weight:800;">${escapeHtml(st.name)}</div>
          <div style="font-size:10px;opacity:0.8;">${escapeHtml(st.genre)}</div>
        </div>
        <i class="fa-solid ${state.selectedRadioId === st.id && state.radioPlaying ? 'fa-volume-high' : 'fa-play'}"></i>
      </button>
    `).join('');

    list.querySelectorAll('.radio-station-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        startRadioStream(btn.dataset.stationId);
        $('radioPopover')?.classList.add('hidden');
      });
    });
  }

  // ==========================================
  // WEBRTC MICS 1..5 ENGINE
  // ==========================================
  function closeAllMicPeers() {
    for (const pc of state.micPeers.values()) {
      try {
        pc.close();
      } catch {
        // ignore
      }
    }
    state.micPeers.clear();
    $('webrtcAudioContainer').innerHTML = '';
  }

  function stopLocalMicStream() {
    if (state.localStream) {
      for (const t of state.localStream.getTracks()) t.stop();
      state.localStream = null;
    }
    state.isSelfMicMuted = false;
  }

  function attachRemoteAudioStream(remoteSocketId, stream) {
    let audio = document.getElementById(`webrtc_audio_${remoteSocketId}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `webrtc_audio_${remoteSocketId}`;
      audio.autoplay = true;
      audio.playsInline = true;
      $('webrtcAudioContainer').appendChild(audio);
    }
    audio.srcObject = stream;
    audio.play().catch(() => {});
  }

  function createPeerConnection(remoteSocketId) {
    if (state.micPeers.has(remoteSocketId)) return state.micPeers.get(remoteSocketId);
    const pc = new RTCPeerConnection(ICE_CONFIG);
    state.micPeers.set(remoteSocketId, pc);

    if (state.localStream) {
      for (const track of state.localStream.getTracks()) {
        pc.addTrack(track, state.localStream);
      }
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && state.socket) {
        state.socket.emit('mic_webrtc_ice', { toSocketId: remoteSocketId, candidate: ev.candidate });
      }
    };

    pc.ontrack = (ev) => {
      if (ev.streams && ev.streams[0]) {
        attachRemoteAudioStream(remoteSocketId, ev.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        state.micPeers.delete(remoteSocketId);
        const el = document.getElementById(`webrtc_audio_${remoteSocketId}`);
        if (el) el.remove();
      }
    };

    return pc;
  }

  async function takeVoiceMic(slotNum) {
    try {
      if (!state.localStream && navigator.mediaDevices?.getUserMedia) {
        state.localStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      }
    } catch {
      showToast('تم الصعود للمايك بدون إذن ميكروفون المتصفح (تحقق من الأذونات للبث الصوتي).');
    }

    state.socket.emit('mic_take', { slot: slotNum }, async (res) => {
      if (res?.error) {
        showToast(res.error, true);
        return;
      }
      state.isSelfMicMuted = false;
      state.socket.emit('mic_webrtc_ready', { slot: slotNum });
    });
  }

  function leaveVoiceMic() {
    stopLocalMicStream();
    closeAllMicPeers();
    state.socket.emit('mic_leave');
  }

  function renderMics() {
    const container = $('micSlotsContainer');
    if (!container) return;
    const myKey = state.user?.key;
    let iHoldMic = false;
    let iAmMuted = false;

    container.innerHTML = (state.mics || []).map((m) => {
      const isOccupied = Boolean(m.holderKey);
      const isMine = m.holderKey === myKey;
      if (isMine) {
        iHoldMic = true;
        iAmMuted = Boolean(m.isSelfMuted || m.isAdminMuted);
      }
      const isMuted = Boolean(m.isSelfMuted || m.isAdminMuted);
      const micIconHtml = isMuted
        ? '<i class="fa-solid fa-microphone-slash"></i>'
        : '<i class="fa-solid fa-microphone"></i>';
      const avatarContent = isOccupied && m.holderAvatar
        ? `<img src="${escapeHtml(m.holderAvatar)}" alt="${escapeHtml(m.holderName)}" />`
        : micIconHtml;
      const title = isOccupied
        ? `${m.holderName}${isMuted ? ' (مكتوم)' : ' (يتحدث)'}`
        : `صعود على المايك ${m.slot}`;
      const underLabel = isOccupied ? `${m.slot}•${m.holderName}` : String(m.slot);

      return `
        <div class="mic-slot-item">
          <button
            type="button"
            class="mic-slot-btn ${isOccupied ? 'occupied' : ''} ${isMuted ? 'muted-slot' : ''}"
            data-mic-slot="${m.slot}"
            title="${escapeHtml(title)}"
          >
            ${avatarContent}
          </button>
          <span class="mic-slot-num-lbl">${escapeHtml(underLabel)}</span>
        </div>
      `;
    }).join('');

    $('micSelfFloating')?.classList.toggle('hidden', !iHoldMic);
    $('leaveMicBtn')?.classList.toggle('hidden', !iHoldMic);
    $('toggleSelfMicMuteBtn')?.classList.toggle('hidden', !iHoldMic);
    if ($('toggleSelfMicMuteBtn')) {
      $('toggleSelfMicMuteBtn').innerHTML = state.isSelfMicMuted || iAmMuted
        ? '<i class="fa-solid fa-microphone-slash"></i>'
        : '<i class="fa-solid fa-microphone"></i>';
      $('toggleSelfMicMuteBtn').classList.toggle('danger', state.isSelfMicMuted || iAmMuted);
    }
  }

  // ==========================================
  // CHAT FEED RENDERING (MOBILE-FIRST CHARCOAL & WHITE)
  // ==========================================
  function createMessageRowElement(msg) {
    const row = document.createElement('div');
    const isAdminNotice = Boolean(msg.is_admin_notice);
    const isGift = Boolean(msg.is_gift);
    const isOwnerSender = msg.sender_role === 'site_owner' && msg.sender_key !== 'system:quizbot' && msg.sender_key !== 'system:official';
    const rawContent = String(msg.content || '');
    const hasMention = msg.msg_type === 'text' && rawContent.includes('@');
    const myName = String(state.user?.name || '').trim().toLowerCase();
    const myUser = String(state.user?.username || '').trim().toLowerCase();
    const mentionsMe =
      hasMention &&
      ((myName && rawContent.toLowerCase().includes(`@${myName}`)) ||
        (myUser && rawContent.toLowerCase().includes(`@${myUser}`)));

    row.className = `cody-msg-row${isAdminNotice ? ' admin-notice-row' : ''}${isGift ? ' gift-msg-row' : ''}${mentionsMe ? ' mention-for-me' : ''}${isOwnerSender && !isAdminNotice ? ' owner-royal-msg-row' : ''}`;
    if (msg.client_msg_id) row.dataset.clientMsgId = msg.client_msg_id;
    if (msg.id) row.dataset.msgId = String(msg.id);

    const timeStr = formatTimeAgo(msg.created_at_ms || msg.created_at);
    const msgFontSize = Math.max(12, Math.min(20, Number(msg.font_size || msg.fontSize) || 13.5));

    let inlineTextHtml = '';
    let mediaBelowHtml = '';
    if (msg.msg_type === 'image' && msg.media_url) {
      mediaBelowHtml = `<img src="${escapeHtml(msg.media_url)}" class="msg-media-img" alt="صورة" onclick="window.open(this.src,'_blank')" />`;
    } else if (msg.msg_type === 'audio' && msg.media_url) {
      mediaBelowHtml = `<audio controls src="${escapeHtml(msg.media_url)}" class="msg-audio-player"></audio>`;
    } else if (msg.msg_type === 'sticker') {
      inlineTextHtml = `<span class="msg-sticker-pill">${escapeHtml(msg.content || '✨')}</span>`;
    } else {
      const prefix = isAdminNotice ? '<span class="admin-notice-prefix">إشعار الإدارة</span>' : '';
      const rawTxtColor = String(msg.text_color || '').trim();
      const lowerTxt = rawTxtColor.toLowerCase();
      const readableColor = isAdminNotice
        ? '#7f1d1d'
        : (!rawTxtColor || lowerTxt === '#ffffff' || lowerTxt === '#fff' ? '#111827' : escapeHtml(rawTxtColor));
      const ff = msg.font_family && msg.font_family !== 'Normal' ? `font-family:'${escapeHtml(msg.font_family)}',sans-serif;` : '';
      const fw = msg.font_style === 'Bold' ? 'font-weight:800;' : '';
      const fi = msg.font_style === 'Italic' || hasMention ? 'font-style:italic;' : '';
      inlineTextHtml = `<span class="msg-text-inline${hasMention ? ' mention-italic' : ''}" style="color:${readableColor};font-size:${msgFontSize}px;${ff}${fw}${fi}">${prefix}${renderMessageTextWithMentions(msg.content)}</span>`;
    }

    const isMe = state.user && msg.sender_key === state.user.key;
    const isOwner = state.user?.role === 'site_owner';
    const canDelete = isMe || isOwner || state.isRoomManager || hasPerm('clear_room');
    const canMute = !isMe && (isOwner || state.isRoomManager || hasPerm('mute'));

    row.innerHTML = `
      <div class="msg-avatar-trigger" style="cursor:pointer" title="عرض البطاقة">${formatAvatarHTML(msg, '')}</div>
      <div class="msg-body-col">
        <div class="msg-head-line">
          <div class="msg-inline-main">
            ${roleBadgeHTML(msg.sender_role, true)}
            <span class="msg-name-trigger" style="cursor:pointer" title="اضغط لنداء العضو">${formatNameHTML(msg)}</span>
            ${inlineTextHtml}
          </div>
          <div class="msg-time-actions">
            <span class="msg-time">${escapeHtml(timeStr)}</span>
            ${hasMention ? '<button type="button" class="msg-dismiss-btn" title="تجاهل الإشارة">&times;</button>' : ''}
            <div class="msg-actions-wrap">
              <button type="button" class="msg-dots-btn" title="خيارات الرسالة"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              <div class="msg-dots-menu hidden">
                <button type="button" data-msg-act="mention"><i class="fa-solid fa-at"></i> نداء / منشن</button>
                ${!isMe ? '<button type="button" data-msg-act="pm"><i class="fa-solid fa-envelope"></i> رسالة خاصة</button>' : ''}
                <button type="button" data-msg-act="profile"><i class="fa-solid fa-id-card"></i> بطاقة العضو</button>
                ${isOwner && msg.msg_type === 'text' ? '<button type="button" data-msg-act="pin"><i class="fa-solid fa-thumbtack"></i> تثبيت في الغرفة</button>' : ''}
                ${canMute ? '<button type="button" data-msg-act="mute"><i class="fa-solid fa-volume-xmark"></i> كتم العضو</button>' : ''}
                ${canDelete && msg.id ? '<button type="button" class="danger" data-msg-act="delete"><i class="fa-solid fa-trash"></i> حذف الرسالة</button>' : ''}
              </div>
            </div>
          </div>
        </div>
        ${mediaBelowHtml}
      </div>
    `;

    const targetObj = {
      key: msg.sender_key,
      name: msg.sender_name,
      role: msg.sender_role,
      avatarUrl: msg.avatar_url,
      avatarFrame: msg.avatar_frame,
      nameplateStyle: msg.nameplate_style,
      nameShine: msg.name_shine,
      vipWings: msg.vip_wings,
      nameColor: msg.name_color,
      nameBgColor: msg.name_bg_color,
      neonColor: msg.neon_color
    };
    const openTarget = () => openQuickUserModal(targetObj);
    row.querySelector('.msg-avatar-trigger').addEventListener('click', openTarget);
    row.querySelector('.msg-name-trigger').addEventListener('click', () => insertMention(msg.sender_name));
    row.querySelector('.msg-dismiss-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      row.remove();
    });
    row.querySelectorAll('.mention-inline-badge').forEach((badge) => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const found = findKnownUserByMention(badge.dataset.mentionName);
        if (found) openQuickUserModal(found);
        else insertMention(badge.dataset.mentionName);
      });
    });

    const dotsBtn = row.querySelector('.msg-dots-btn');
    const dotsMenu = row.querySelector('.msg-dots-menu');
    dotsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = dotsMenu.classList.contains('hidden');
      document.querySelectorAll('.msg-dots-menu').forEach((m) => m.classList.add('hidden'));
      if (willOpen) dotsMenu.classList.remove('hidden');
    });
    dotsMenu.querySelectorAll('button[data-msg-act]').forEach((actBtn) => {
      actBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        dotsMenu.classList.add('hidden');
        const act = actBtn.dataset.msgAct;
        if (act === 'mention') {
          insertMention(msg.sender_name);
        } else if (act === 'pm') {
          openSlideSheetDrawer('pm', targetObj);
        } else if (act === 'profile') {
          openTarget();
        } else if (act === 'pin' && state.currentRoom) {
          try {
            await api('/api/owner/action', {
              method: 'POST',
              body: { action: 'pin_message', roomId: state.currentRoom.id, message: `${msg.sender_name}: ${msg.content}` }
            });
            showToast('تم تثبيت الرسالة في أعلى الغرفة.');
          } catch (err) {
            showToast(err.message, true);
          }
        } else if (act === 'mute') {
          state.socket?.emit('admin_mute', { targetKey: msg.sender_key, minutes: 15 });
        } else if (act === 'delete' && msg.id) {
          state.socket?.emit('delete_message', { msgId: msg.id });
        }
      });
    });

    return row;
  }

  function renderAllMessages() {
    const feed = $('chatFeed');
    feed.innerHTML = '';
    for (const m of state.messages) {
      feed.appendChild(createMessageRowElement(m));
    }
    feed.scrollTop = feed.scrollHeight;
  }

  function appendOrReconcileMessage(msg) {
    const feed = $('chatFeed');
    if (msg.client_msg_id) {
      const existing = feed.querySelector(`[data-client-msg-id="${CSS.escape(msg.client_msg_id)}"]`);
      if (existing) {
        const fresh = createMessageRowElement(msg);
        existing.replaceWith(fresh);
        return;
      }
    }
    if (msg.id && feed.querySelector(`[data-msg-id="${CSS.escape(String(msg.id))}"]`)) {
      return;
    }
    state.messages.push(msg);
    if (state.messages.length > 150) state.messages.shift();
    feed.appendChild(createMessageRowElement(msg));
    feed.scrollTop = feed.scrollHeight;
  }

  function appendRoomNotice(payload) {
    const feed = $('chatFeed');
    const isJoinObj = payload && typeof payload === 'object' && (payload.kind === 'join' || payload.kind === 'royal_join') && payload.user;
    if (isJoinObj) {
      const u = payload.user;
      const isRoyal = payload.kind === 'royal_join';
      const row = document.createElement('div');
      row.className = `cody-msg-row cody-join-row${isRoyal ? ' owner-royal-msg-row' : ''}`;
      row.innerHTML = `
        <div class="msg-avatar-trigger" style="cursor:pointer" title="بطاقة العضو">${formatAvatarHTML(u, '')}</div>
        <div class="msg-body-col">
          <div class="msg-head-line">
            <div class="msg-inline-main">
              ${roleBadgeHTML(u.role, true)}
              <span class="msg-name-trigger" style="cursor:pointer" title="اضغط لنداء العضو">${formatNameHTML(u)}</span>
              <span class="${isRoyal ? 'join-royal-bar' : 'join-maroon-bar'}"><i class="fa-solid ${isRoyal ? 'fa-crown' : 'fa-check'}"></i> ${isRoyal ? 'تشريف ملكي: دخل المالك الغرفة' : 'انضم إلى الغرفة الآن'}</span>
            </div>
            <span class="msg-time">${formatTimeAgo(Date.now())}</span>
          </div>
        </div>
      `;
      row.querySelector('.msg-avatar-trigger').addEventListener('click', () => openQuickUserModal(u));
      row.querySelector('.msg-name-trigger').addEventListener('click', () => insertMention(u.name));
      feed.appendChild(row);
      feed.scrollTop = feed.scrollHeight;
      return;
    }

    const div = document.createElement('div');
    div.className = 'room-notice-row';
    div.textContent = typeof payload === 'string' ? payload : (payload?.text || '');
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  }

  function renderRoomUsers() {
    const list = $('roomUsersList');
    const count = state.roomUsers.length;
    const boosted = Math.max(count, Number(state.currentRoom?.onlineCount || 0));
    $('roomOnlineCounter').textContent = String(boosted);
    $('sideOnlineCount').textContent = String(count);

    list.innerHTML = state.roomUsers.map((u) => `
      <div class="user-row-card" data-user-key="${escapeHtml(u.key)}">
        <div class="user-row-avatar-btn" style="cursor:pointer" title="بطاقة العضو">${formatAvatarHTML(u, 'sm')}</div>
        <div class="user-row-info">
          <div class="user-row-name user-row-name-btn" style="cursor:pointer" title="اضغط لنداء العضو">${formatNameHTML(u)}</div>
          <div>${roleBadgeHTML(u.role)} <span class="muted">🔥${u.activityPoints || 0}</span></div>
        </div>
        <div class="user-row-actions">
          <button type="button" class="user-mini-ping-btn" title="إشارة @">@</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.user-row-card').forEach((card) => {
      const u = state.roomUsers.find((x) => x.key === card.dataset.userKey);
      if (!u) return;
      card.querySelector('.user-row-avatar-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickUserModal(u);
      });
      card.querySelector('.user-row-name-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        $('usersSidePanel')?.classList.remove('open');
        insertMention(u.name);
      });
      card.querySelector('.user-mini-ping-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        $('usersSidePanel')?.classList.remove('open');
        insertMention(u.name);
      });
    });
  }

  // ==========================================
  // SEND MESSAGES (INSTANT OPTIMISTIC RENDERING)
  // ==========================================
  function sendTextMessage() {
    const input = $('messageInput');
    const text = input.value.trim();
    if (!text || !state.socket || !state.currentRoom) return;

    const u = state.user;
    const clientMsgId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const isAdminNotice = state.adminNoticeMode && (u.role === 'site_owner' || hasPerm('access_panel'));

    const optimistic = {
      client_msg_id: clientMsgId,
      room_id: state.currentRoom.id,
      sender_key: u.key,
      sender_name: u.name,
      sender_role: u.role,
      name_color: u.nameColor,
      text_color: isAdminNotice ? '#ffffff' : u.textColor,
      name_bg_color: u.nameBgColor,
      neon_color: u.neonColor,
      font_family: u.fontFamily,
      font_style: u.fontStyle,
      font_size: u.fontSize || 14,
      avatar_url: u.avatarUrl,
      avatar_frame: u.avatarFrame,
      nameplate_style: u.nameplateStyle,
      name_shine: u.nameShine,
      vip_wings: u.vipWings,
      is_admin_notice: isAdminNotice,
      msg_type: 'text',
      content: text,
      created_at: new Date().toISOString(),
      created_at_ms: Date.now()
    };

    appendOrReconcileMessage(optimistic);
    input.value = '';
    if (state.adminNoticeMode) {
      state.adminNoticeMode = false;
      $('adminNoticeModePill').classList.add('hidden');
    }

    state.socket.emit(
      'send_message',
      { msgType: 'text', content: text, clientMsgId, isAdminNotice },
      (res) => {
        if (res?.error) {
          showToast(res.error, true);
          const el = $('chatFeed').querySelector(`[data-client-msg-id="${CSS.escape(clientMsgId)}"]`);
          if (el) el.remove();
        }
      }
    );
  }

  // ==========================================
  // MODALS HELPERS
  // ==========================================
  function openModal(id) {
    $(id)?.classList.remove('hidden');
  }

  function closeModal(id) {
    $(id)?.classList.add('hidden');
    if (id === 'quickUserModal' || id === 'customizeModal') {
      stopProfileMusic();
    }
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  function computeUserRanks(userKey) {
    const members = [...(state.persistentMembers || [])];
    if (state.user && !state.user.isGuest && !members.some((m) => m.key === state.user.key)) {
      members.push(state.user);
    }
    const byRich = [...members].sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0));
    const byAct = [...members].sort((a, b) => (Number(b.activityPoints) || 0) - (Number(a.activityPoints) || 0));
    const rIdx = byRich.findIndex((m) => m.key === userKey);
    const aIdx = byAct.findIndex((m) => m.key === userKey);
    return {
      richRank: rIdx >= 0 ? rIdx + 1 : 0,
      interactionRank: aIdx >= 0 ? aIdx + 1 : 0
    };
  }

  function renderModMenuItemsHTML(u, targetUserId, isOwner, canMod, canBan) {
    const targetIsProtected = Boolean(
      u.isSupremeOwner ||
      u.role === 'site_owner' ||
      String(u.email || '').toLowerCase() === 'a38125923@gmail.com'
    );
    if (targetIsProtected) {
      return '<div class="muted" style="padding:8px;font-size:12px;">حساب المالك الأعلى محمي بالكامل.</div>';
    }
    return `
      ${canMod ? '<button type="button" class="mod-menu-btn" id="quMuteBtn"><i class="fa-solid fa-volume-xmark"></i><span>كتم 15 دقيقة</span></button>' : ''}
      ${canMod ? '<button type="button" class="mod-menu-btn" id="quUnmuteBtn"><i class="fa-solid fa-volume-high"></i><span>فك الكتم</span></button>' : ''}
      ${canMod ? '<button type="button" class="mod-menu-btn" id="quKickBtn"><i class="fa-solid fa-door-open"></i><span>طرد من الغرفة</span></button>' : ''}
      ${isOwner ? `<button type="button" class="mod-menu-btn" id="quShadowMuteBtn"><i class="fa-solid fa-user-ninja"></i><span>${u.isShadowMuted ? 'إلغاء الكتم الصامت' : 'كتم صامت (مخفي)'}</span></button>` : ''}
      ${isOwner ? `<button type="button" class="mod-menu-btn" id="quFreezeUserBtn"><i class="fa-solid fa-snowflake"></i><span>${u.isFrozen ? 'فك التجميد' : 'تجميد تام'}</span></button>` : ''}
      ${isOwner ? '<button type="button" class="mod-menu-btn" id="quMoveRoomBtn"><i class="fa-solid fa-right-left"></i><span>سحب ونقل لغرفة</span></button>' : ''}
      ${canMod && targetUserId ? `<button type="button" class="mod-menu-btn" id="quGhostBtn"><i class="fa-solid fa-ghost"></i><span>${u.isGhosted ? 'إلغاء وضع الشبح' : 'وضع الشبح'}</span></button>` : ''}
      ${canBan ? '<button type="button" class="mod-menu-btn danger" id="quXBanBtn"><i class="fa-solid fa-shield-virus"></i><span>إكس باند (حظر الجهاز)</span></button>' : ''}
      ${canBan ? '<button type="button" class="mod-menu-btn danger" id="quBanBtn"><i class="fa-solid fa-ban"></i><span>حظر نهائي</span></button>' : ''}
      ${isOwner && targetUserId ? '<button type="button" class="mod-menu-btn" id="quCoinsBtn"><i class="fa-solid fa-coins"></i><span>منح +500 عملة</span></button>' : ''}
      ${isOwner && targetUserId ? '<button type="button" class="mod-menu-btn danger" id="quDeleteAccountBtn"><i class="fa-solid fa-user-slash"></i><span>حذف حساب العضو نهائياً</span></button>' : ''}
    `;
  }

  // ==========================================
  // LUXURY MEMBER PROFILE CARD + 6 TABS + MODERATION
  // ==========================================
  async function openQuickUserModal(rawUser) {
    const liveMatch =
      state.roomUsers.find((x) => x.key === rawUser.key) ||
      state.onlineUsers.find((x) => x.key === rawUser.key) ||
      state.persistentMembers.find((x) => x.key === rawUser.key);
    let u = { ...(liveMatch || {}), ...rawUser };
    if (!u.profileMusic && liveMatch?.profileMusic) u.profileMusic = liveMatch.profileMusic;
    if (!u.bio && liveMatch?.bio) u.bio = liveMatch.bio;
    if (!u.vipFamily && liveMatch?.vipFamily) u.vipFamily = liveMatch.vipFamily;
    if (!u.coverUrl && liveMatch?.coverUrl) u.coverUrl = liveMatch.coverUrl;
    if (!u.profileBgEffect && liveMatch?.profileBgEffect) u.profileBgEffect = liveMatch.profileBgEffect;

    const isMe = state.user && u.key === state.user.key;
    if (isMe && !state.user?.isGuest) {
      openCustomizeModal('info');
      return;
    }

    const isReg = u.key && String(u.key).startsWith('user:');
    const targetUserId = isReg ? Number(String(u.key).replace('user:', '')) : null;
    const isOwner = state.user?.role === 'site_owner';
    const isTargetOwner = u.role === 'site_owner' || u.isSupremeOwner;
    const canMod = !isMe && (isOwner || state.isRoomManager || hasPerm('mute') || hasPerm('kick'));
    const canBan = !isMe && (isOwner || hasPerm('ban'));
    const canGift = !isMe && !state.user?.isGuest;
    const hasMusic = Boolean(u.profileMusic && String(u.profileMusic).trim());
    const { richRank, interactionRank } = computeUserRanks(u.key);
    const avgRating = u.ratingCount > 0 ? (Number(u.ratingSum || 0) / Number(u.ratingCount)).toFixed(1) : '0.0';
    const bgEffectClass = u.profileBgEffect && u.profileBgEffect !== 'none' ? `bg-effect-${u.profileBgEffect}` : '';

    try {
      const socialRes = await api('/api/social/state');
      state.social = { ...state.social, ...socialRes };
    } catch {
      // fallback
    }

    const userWallPosts = (state.social.wallPosts || []).filter((p) => p.author_key === u.key);
    const friendsList = (state.social.friends || []).filter((f) => f.status === 'accepted');
    const profileLink = `${window.location.origin}/?profile=${encodeURIComponent(u.key)}`;

    $('quickUserBody').innerHTML = `
      <div class="profile-luxury-card ${escapeHtml(bgEffectClass)}${isTargetOwner ? ' owner-black-gold-theme' : ''}">
        <div class="${isTargetOwner ? 'owner-falling-stars-layer' : 'profile-bg-effect-layer'}"></div>
        <div class="profile-cover-hero" style="${u.coverUrl ? `background-image:url('${escapeHtml(u.coverUrl)}')` : ''}">
          ${u.coverUrl ? `<img src="${escapeHtml(u.coverUrl)}" class="profile-cover-img" alt="" />` : ''}
          <div class="profile-cover-top-actions">
            <div style="display:flex;gap:6px;align-items:center;">
              ${(canMod || canBan || isOwner) && !isTargetOwner ? `
                <div class="mod-menu-wrap" style="position:relative;">
                  <button type="button" class="hero-icon-btn" id="quModMenuToggleBtn" title="قائمة الإدارة">
                    <i class="fa-solid fa-bars"></i>
                  </button>
                  <div id="quModMenuDropdown" class="mod-menu-dropdown hidden">
                    ${renderModMenuItemsHTML(u, targetUserId, isOwner, canMod, canBan)}
                  </div>
                </div>
              ` : ''}
              ${hasMusic ? `<button type="button" class="hero-icon-btn" id="quMusicToggleBtn" title="موسيقى البروفايل"><i class="fa-solid fa-music"></i></button>` : ''}
            </div>
            <button type="button" class="hero-icon-btn" id="quHeroCloseBtn" title="إغلاق"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="profile-cover-stats-bar">
            <button type="button" class="hero-stat-pill" id="quLikeBtn" title="إعجاب"><i class="fa-solid fa-heart" style="color:#fb7185;"></i> <span id="quLikesCount">${Number(u.likesCount || 0)}</span></button>
            <div class="hero-stat-pill" title="التقييم"><i class="fa-solid fa-star" style="color:#fbbf24;"></i> <span id="quRatingAvg">${avgRating}</span></div>
            <div class="hero-stat-pill" title="العملات"><i class="fa-solid fa-coins" style="color:#facc15;"></i> <span>${Number(u.coins || 0)}</span></div>
          </div>
        </div>

        <div class="profile-identity-center">
          <div class="profile-avatar-lift">
            ${formatAvatarHTML(u, 'xl')}
          </div>
          <div class="profile-name-row-center">
            ${roleBadgeHTML(u.role, true)}
            ${formatNameHTML(u)}
          </div>
          <div class="profile-role-subtitle">${escapeHtml(getRank(u.role).label)} ${u.vipFamily ? `• <i class="fa-solid fa-crown"></i> ${escapeHtml(u.vipFamily)}` : ''}</div>
          ${u.bio ? `<p class="profile-bio-line">${escapeHtml(u.bio)}</p>` : ''}
          <div class="qu-star-rating-row" id="quStarRatingRow" title="قيّم هذا العضو">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-rate-btn" data-star="${n}"><i class="fa-solid fa-star"></i></button>`).join('')}
          </div>
          <div class="qu-quick-action-strip">
            <button type="button" class="btn-secondary btn-xs" id="quMentionBtn"><i class="fa-solid fa-at"></i> منشن</button>
            ${!isMe && u.allowPm !== false ? '<button type="button" class="btn-primary btn-xs" id="quPmBtn"><i class="fa-solid fa-envelope"></i> رسالة</button>' : ''}
            ${!isMe && !state.user?.isGuest && isReg ? '<button type="button" class="btn-secondary btn-xs" id="quFriendBtn"><i class="fa-solid fa-user-plus"></i> صداقة</button>' : ''}
            ${canGift ? '<button type="button" class="btn-primary btn-xs" style="background:#db2777" id="quGiftBtn"><i class="fa-solid fa-gift"></i> هدية</button>' : ''}
          </div>
        </div>

        <div class="profile-6tabs-bar" id="quTabsBar">
          <button type="button" class="qu-tab active" data-qu-tab="info"><i class="fa-solid fa-circle-info"></i><span>المعلومات</span></button>
          <button type="button" class="qu-tab" data-qu-tab="friends"><i class="fa-solid fa-user-group"></i><span>الأصدقاء</span></button>
          <button type="button" class="qu-tab" data-qu-tab="gifts"><i class="fa-solid fa-gift"></i><span>الهدايا</span></button>
          <button type="button" class="qu-tab" data-qu-tab="relations"><i class="fa-solid fa-heart-pulse"></i><span>العلاقات</span></button>
          <button type="button" class="qu-tab" data-qu-tab="posts"><i class="fa-solid fa-newspaper"></i><span>المنشورات</span></button>
          <button type="button" class="qu-tab" data-qu-tab="more"><i class="fa-solid fa-ellipsis"></i><span>المزيد</span></button>
        </div>

        <div class="profile-tab-content">
          <div id="quPane_info" class="qu-pane">
            <div class="rank-duo-grid">
              <div class="rank-duo-card">
                <span class="muted"><i class="fa-solid fa-fire" style="color:#ea580c;"></i> ترتيب التفاعل</span>
                <strong>${interactionRank > 0 ? `#${interactionRank}` : '—'}</strong>
              </div>
              <div class="rank-duo-card">
                <span class="muted"><i class="fa-solid fa-sack-dollar" style="color:#ca8a04;"></i> ترتيب الأثرياء</span>
                <strong>${richRank > 0 ? `#${richRank}` : '—'}</strong>
              </div>
            </div>
            <div class="info-kv-list">
              <div class="info-kv-row"><span><i class="fa-solid fa-cake-candles"></i> العمر</span><strong>${u.age ? escapeHtml(String(u.age)) : 'غير محدد'}</strong></div>
              <div class="info-kv-row"><span><i class="fa-solid fa-venus-mars"></i> الجنس</span><strong>${escapeHtml(u.gender || 'غير محدد')}</strong></div>
              <div class="info-kv-row"><span><i class="fa-solid fa-earth-asia"></i> البلد</span><strong>${escapeHtml(u.country || 'غير محدد')}</strong></div>
              <div class="info-kv-row"><span><i class="fa-solid fa-bolt"></i> نقاط التفاعل</span><strong>${Number(u.activityPoints || 0)}</strong></div>
            </div>
            <div class="copy-link-box">
              <input type="text" readonly value="${escapeHtml(profileLink)}" id="quProfileLinkInput" />
              <button type="button" class="btn-secondary btn-xs" id="quCopyLinkBtn"><i class="fa-solid fa-copy"></i> نسخ</button>
            </div>
          </div>

          <div id="quPane_friends" class="qu-pane hidden">
            ${friendsList.length ? friendsList.map((f) => `
              <div class="admin-list-card">
                <div><strong>${escapeHtml(f.friend_name)}</strong><div class="muted">صديق</div></div>
                <i class="fa-solid fa-user-check" style="color:#16a34a;"></i>
              </div>
            `).join('') : '<div class="muted" style="text-align:center;padding:12px;">لا توجد بيانات أصدقاء ظاهرة.</div>'}
          </div>

          <div id="quPane_gifts" class="qu-pane hidden">
            <div class="gifts-wallet-summary">
              <div class="stat-mini"><span><i class="fa-solid fa-gift"></i> مستلمة</span><strong>${Number(u.giftsReceived || 0)}</strong></div>
              <div class="stat-mini"><span><i class="fa-solid fa-paper-plane"></i> مرسلة</span><strong>${Number(u.giftsSent || 0)}</strong></div>
            </div>
            ${canGift ? `<button type="button" class="btn-primary btn-sm" id="quSendGiftInsideTabBtn" style="margin-top:8px;"><i class="fa-solid fa-gift"></i> أرسل هدية لـ ${escapeHtml(u.name)}</button>` : ''}
          </div>

          <div id="quPane_relations" class="qu-pane hidden">
            <div class="admin-list-card">
              <div><strong><i class="fa-solid fa-crown" style="color:#d97706;"></i> العائلة / القبيلة</strong><div class="muted">${u.vipFamily ? escapeHtml(u.vipFamily) : 'لم ينضم لعائلة بعد'}</div></div>
            </div>
          </div>

          <div id="quPane_posts" class="qu-pane hidden">
            ${userWallPosts.length ? userWallPosts.map((p) => `
              <div class="news-card">
                <div><strong>${escapeHtml(p.author_name)}</strong></div>
                <p style="margin-top:4px;">${escapeHtml(p.content)}</p>
                <span class="muted"><i class="fa-solid fa-heart"></i> ${p.likes_count || 0}</span>
              </div>
            `).join('') : '<div class="muted" style="text-align:center;padding:12px;">لا توجد منشورات لهذا العضو.</div>'}
          </div>

          <div id="quPane_more" class="qu-pane hidden">
            <div class="info-kv-list">
              <div class="info-kv-row"><span><i class="fa-solid fa-phone"></i> استقبال المكالمات</span><strong>${u.allowCalls !== false ? 'مسموح' : 'مغلق'}</strong></div>
              <div class="info-kv-row"><span><i class="fa-solid fa-message"></i> الرسائل الخاصة</span><strong>${u.allowPm !== false ? 'مفتوحة' : 'مغلقة'}</strong></div>
            </div>
            ${canMod ? `
              <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
                <button type="button" class="btn-secondary btn-xs" id="quOpenModDrawerInsideBtn"><i class="fa-solid fa-gavel"></i> خيارات الإشراف والإدارة</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    $('quHeroCloseBtn')?.addEventListener('click', () => closeModal('quickUserModal'));
    $('quModMenuToggleBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      $('quModMenuDropdown')?.classList.toggle('hidden');
    });
    $('quOpenModDrawerInsideBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      $('quModMenuDropdown')?.classList.remove('hidden');
    });

    $('quTabsBar')?.querySelectorAll('.qu-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.quTab;
        $('quTabsBar').querySelectorAll('.qu-tab').forEach((b) => b.classList.toggle('active', b === btn));
        ['info', 'friends', 'gifts', 'relations', 'posts', 'more'].forEach((pane) => {
          $(`quPane_${pane}`)?.classList.toggle('hidden', pane !== t);
        });
      });
    });

    $('quCopyLinkBtn')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(profileLink).then(
        () => showToast('تم نسخ رابط الملف الشخصي.'),
        () => showToast('انسخ الرابط من الحقل أعلاه.')
      );
    });

    $('quLikeBtn')?.addEventListener('click', async () => {
      if (state.user?.isGuest) return showToast('الإعجاب متاح للأعضاء المسجلين.', true);
      try {
        const res = await api('/api/profile/interact', { method: 'POST', body: { targetKey: u.key, like: true } });
        if (res?.target) {
          u.likesCount = res.target.likesCount;
          if ($('quLikesCount')) $('quLikesCount').textContent = String(res.target.likesCount || 0);
        }
        showToast('تم إرسال الإعجاب للملف.');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quStarRatingRow')?.querySelectorAll('.star-rate-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (state.user?.isGuest) return showToast('التقييم متاح للأعضاء المسجلين.', true);
        const stars = Number(btn.dataset.star);
        try {
          const res = await api('/api/profile/interact', { method: 'POST', body: { targetKey: u.key, rating: stars } });
          if (res?.target) {
            u.ratingSum = res.target.ratingSum;
            u.ratingCount = res.target.ratingCount;
            const nextAvg = u.ratingCount > 0 ? (u.ratingSum / u.ratingCount).toFixed(1) : '0.0';
            if ($('quRatingAvg')) $('quRatingAvg').textContent = nextAvg;
          }
          $('quStarRatingRow').querySelectorAll('.star-rate-btn').forEach((b) => {
            b.classList.toggle('active', Number(b.dataset.star) <= stars);
          });
          showToast(`تم تقييم العضو بـ ${stars} نجوم.`);
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    $('quMusicToggleBtn')?.addEventListener('click', () => {
      const playing = playProfileMusic(u.profileMusic);
      if ($('quMusicToggleBtn')) {
        $('quMusicToggleBtn').innerHTML = playing ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-music"></i>';
      }
    });

    $('quMentionBtn')?.addEventListener('click', () => {
      $('messageInput').value += `@${u.name} `;
      $('messageInput').focus();
      closeModal('quickUserModal');
    });

    $('quPmBtn')?.addEventListener('click', () => {
      closeModal('quickUserModal');
      openSocialModal('pm', u);
    });

    $('quFriendBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/friends/request', {
          method: 'POST',
          body: { toKey: u.key, toName: u.name, toRole: u.role, toAvatar: u.avatarUrl || '' }
        });
        showToast('تم إرسال طلب الصداقة!');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    const openGiftAction = () => {
      closeModal('quickUserModal');
      openGiftModal(u);
    };
    $('quGiftBtn')?.addEventListener('click', openGiftAction);
    $('quSendGiftInsideTabBtn')?.addEventListener('click', openGiftAction);

    $('quMuteBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_mute', { targetKey: u.key, minutes: 15 });
      closeModal('quickUserModal');
    });

    $('quUnmuteBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_mute', { targetKey: u.key, unmute: true });
      closeModal('quickUserModal');
    });

    $('quKickBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_kick', { targetKey: u.key });
      closeModal('quickUserModal');
    });

    $('quGhostBtn')?.addEventListener('click', async () => {
      const next = !u.isGhosted;
      state.socket.emit('admin_ghost', { targetKey: u.key, enabled: next });
      showToast(next ? 'تم تفعيل وضع الشبح على العضو.' : 'تم إلغاء وضع الشبح.');
      closeModal('quickUserModal');
    });

    $('quShadowMuteBtn')?.addEventListener('click', async () => {
      const next = !u.isShadowMuted;
      try {
        await api('/api/owner/action', { method: 'POST', body: { action: 'shadow_mute', targetKey: u.key, enabled: next } });
        showToast(next ? 'تم تطبيق الكتم الصامت على العضو.' : 'تم إلغاء الكتم الصامت.');
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quFreezeUserBtn')?.addEventListener('click', async () => {
      const next = !u.isFrozen;
      try {
        await api('/api/owner/action', { method: 'POST', body: { action: 'freeze_user', targetKey: u.key, enabled: next } });
        showToast(next ? 'تم تجميد العضو (قراءة فقط).' : 'تم فك تجميد العضو.');
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quMoveRoomBtn')?.addEventListener('click', async () => {
      const roomChoices = state.rooms.map((r) => `${r.id}: ${r.name}`).join('\n');
      const toRoomId = prompt(`أدخل معرف الغرفة لسحب "${u.name}" إليها:\n${roomChoices}`, state.currentRoom?.id || 'general');
      if (!toRoomId) return;
      try {
        await api('/api/owner/action', { method: 'POST', body: { action: 'move_user', targetKey: u.key, toRoomId: toRoomId.trim() } });
        showToast('تم سحب ونقل العضو للغرفة المحددة.');
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quXBanBtn')?.addEventListener('click', () => {
      const reason = prompt('سبب إكس باند (حظر الجهاز نهائياً):', 'مخالفة جسيمة');
      if (reason === null) return;
      state.socket.emit('admin_ban', { targetKey: u.key, reason: reason || 'إكس باند من الإدارة', banType: 'xban' });
      closeModal('quickUserModal');
    });

    $('quBanBtn')?.addEventListener('click', () => {
      const reason = prompt('سبب الحظر النهائي:', 'مخالفة القوانين');
      if (reason === null) return;
      state.socket.emit('admin_ban', { targetKey: u.key, reason: reason || 'حظر من الإدارة', banType: 'ban' });
      closeModal('quickUserModal');
    });

    $('quCoinsBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_give_coins', { userId: targetUserId, amount: 500 });
      showToast('تم منح 500 عملة للعضو.');
      closeModal('quickUserModal');
    });

    $('quDeleteAccountBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      if (!confirm(`هل أنت متأكد من حذف حساب "${u.name}" نهائياً من قاعدة البيانات؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
      state.socket.emit('admin_delete_account', { userId: targetUserId }, (res) => {
        if (res?.error) showToast(res.error, true);
        else {
          showToast('تم حذف حساب العضو نهائياً.');
          closeModal('quickUserModal');
        }
      });
    });

    openModal('quickUserModal');
  }

  // ==========================================
  // GIFTS PICKER & CELEBRATION OVERLAY
  // ==========================================
  async function openGiftModal(targetUser) {
    state.giftTarget = targetUser;
    $('giftTargetName').textContent = targetUser.name || 'العضو';
    $('giftModalCoins').textContent = String(state.user?.coins || 0);

    if (state.giftsCatalog.length === 0) {
      const res = await api('/api/gifts/catalog').catch(() => ({ gifts: [] }));
      state.giftsCatalog = res.gifts || [];
    }

    $('giftCatalogGrid').innerHTML = state.giftsCatalog.map((g) => `
      <div class="gift-card">
        <div class="gift-emoji-big">${g.emoji}</div>
        <strong>${escapeHtml(g.name)}</strong>
        <span class="muted">السعر: ${g.cost} 💰 • هدية +${g.reward} 💰</span>
        <button type="button" class="btn-primary btn-xs send-gift-pick-btn" data-gift-id="${g.id}">إرسال</button>
      </div>
    `).join('');

    $('giftCatalogGrid').querySelectorAll('.send-gift-pick-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          const res = await api('/api/gifts/send', {
            method: 'POST',
            body: {
              toKey: targetUser.key,
              toName: targetUser.name,
              giftId: btn.dataset.giftId,
              roomId: state.currentRoom?.id || ''
            }
          });
          if (res.user) {
            state.user = res.user;
            renderUserIdentity();
          }
          showToast(`تم إرسال ${res.tx.gift_emoji} ${res.tx.gift_name} إلى ${targetUser.name}!`);
          closeModal('giftModal');
        } catch (err) {
          showToast(err.message, true);
          btn.disabled = false;
        }
      });
    });

    openModal('giftModal');
  }

  function showGiftCelebration(tx) {
    $('giftOverlayEmoji').textContent = tx.gift_emoji || '🎁';
    $('giftOverlayTitle').textContent = `هدية ${tx.gift_name || ''}!`;
    $('giftOverlaySubtitle').textContent = `من "${tx.from_name}" إلى "${tx.to_name}"`;
    $('giftOverlay').classList.remove('hidden');
    playNotificationChime('gift');
    setTimeout(() => $('giftOverlay').classList.add('hidden'), 3200);
  }

  // ==========================================
  // LUXURY 6-TAB OWN PROFILE & SETTINGS MODAL
  // ==========================================
  function switchNameStyleTab(tab) {
    state.activeNameStyleTab = tab;
    $('nameStyleSubTabs')?.querySelectorAll('.sub-pill-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.namestyleTab === tab);
    });
    ['color', 'neon', 'bg'].forEach((t) => {
      $(`nameStylePane_${t}`)?.classList.toggle('hidden', t !== tab);
    });
    renderNameColorSwatches();
  }

  function renderNameColorSwatches() {
    const box = $('nameColorSwatches');
    if (!box) return;
    box.innerHTML = NAME_COLOR_SWATCHES.map((hex) => `
      <button type="button" class="swatch-dot" data-swatch="${hex}" style="background:${hex};" title="${hex}"></button>
    `).join('');
    box.querySelectorAll('.swatch-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const hex = dot.dataset.swatch;
        if (state.activeNameStyleTab === 'color' && $('custNameColor')) {
          $('custNameColor').value = hex;
        } else if (state.activeNameStyleTab === 'neon' && $('custNeonColor')) {
          $('custNeonColor').value = hex;
          $('custNeonColor').dataset.cleared = '0';
        } else if (state.activeNameStyleTab === 'bg' && $('custNameBgColor')) {
          $('custNameBgColor').value = hex;
          $('custNameBgColor').dataset.cleared = '0';
        }
        updateCustomizePreview();
      });
    });
  }

  async function openCustomizeModal(initialTab = 'info') {
    if (!state.user || state.user.isGuest) {
      showToast('تخصيص الملف والإضافات متاح للأعضاء المسجلين فقط.', true);
      return;
    }

    try {
      const [shopRes, socialRes] = await Promise.all([
        api('/api/shop/items'),
        api('/api/social/state')
      ]);
      state.shopItems = { ...state.shopItems, ...shopRes };
      state.social = { ...state.social, ...socialRes };
    } catch {
      // ignore fallback
    }

    const u = state.user;
    $('custDisplayName').value = u.displayName || u.name || '';
    $('custVipFamily').value = u.vipFamily || '';
    $('custBioInput').value = u.bio || '';
    if ($('custAgeInput')) $('custAgeInput').value = u.age ? String(u.age) : '';
    if ($('custGenderSelect')) $('custGenderSelect').value = u.gender || '';
    if ($('custCountryInput')) $('custCountryInput').value = u.country || '';

    $('custNameColor').value = /^#[0-9a-f]{6}$/i.test(u.nameColor || '') ? u.nameColor : '#0f172a';
    $('custTextColor').value = /^#[0-9a-f]{6}$/i.test(u.textColor || '') ? u.textColor : '#1e293b';
    $('custNameBgColor').value = /^#[0-9a-f]{6}$/i.test(u.nameBgColor || '') ? u.nameBgColor : '#e2e8f0';
    $('custNameBgColor').dataset.cleared = u.nameBgColor ? '0' : '1';
    $('custNeonColor').value = /^#[0-9a-f]{6}$/i.test(u.neonColor || '') ? u.neonColor : '#38bdf8';
    $('custNeonColor').dataset.cleared = u.neonColor ? '0' : '1';
    $('custFontFamily').value = u.fontFamily || 'Cairo';
    $('custFontStyle').value = u.fontStyle || 'Normal';
    if ($('custFontSize')) {
      const fsz = Math.max(12, Math.min(20, Number(u.fontSize) || 14));
      $('custFontSize').value = String(fsz);
      if ($('custFontSizeVal')) $('custFontSizeVal').textContent = String(fsz);
    }
    $('custVipWingsToggle').checked = Boolean(u.vipWings);

    if ($('custAllowCallsToggle')) $('custAllowCallsToggle').checked = u.allowCalls !== false;
    if ($('custAllowPmToggle')) $('custAllowPmToggle').checked = u.allowPm !== false;
    if ($('custCredEmail')) $('custCredEmail').value = u.email || '';
    if ($('custCredCurrentPass')) $('custCredCurrentPass').value = '';
    if ($('custCredNewPass')) $('custCredNewPass').value = '';

    const pmusic = u.profileMusic || '';
    if (pmusic.startsWith('preset:') || pmusic === '') {
      $('custMusicPreset').value = pmusic;
      $('custMusicCustomUrl').value = '';
    } else {
      $('custMusicPreset').value = '';
      $('custMusicCustomUrl').value = pmusic;
    }

    const isOwner = u.role === 'site_owner';
    $('custStealthCard')?.classList.toggle('hidden', !isOwner);
    if ($('custStealthToggle')) $('custStealthToggle').checked = Boolean(u.isStealth);

    // Cover hero & live rank cards
    if ($('custLikesCountVal')) $('custLikesCountVal').textContent = String(u.likesCount || 0);
    const avg = u.ratingCount > 0 ? (Number(u.ratingSum || 0) / Number(u.ratingCount)).toFixed(1) : '0.0';
    if ($('custRatingAvgVal')) $('custRatingAvgVal').textContent = avg;
    if ($('custTopCoinsVal')) $('custTopCoinsVal').textContent = String(u.coins || 0);

    const { interactionRank, richRank } = computeUserRanks(u.key);
    if ($('custInteractionRankNum')) $('custInteractionRankNum').textContent = interactionRank > 0 ? `#${interactionRank}` : '—';
    if ($('custRichRankNum')) $('custRichRankNum').textContent = richRank > 0 ? `#${richRank}` : '—';
    if ($('custProfileLinkInput')) $('custProfileLinkInput').value = `${window.location.origin}/?profile=${encodeURIComponent(u.key)}`;

    const refBox = $('custReferralBox');
    if (refBox) {
      if (u.userId) {
        const refLink = `${window.location.origin}/?ref=${u.userId}`;
        const bonus = Number(state.settings?.referral_bonus) || 200;
        refBox.classList.remove('hidden');
        refBox.innerHTML = `
          <strong><i class="fa-solid fa-share-nodes"></i> رابط الدعوة والمكافآت (عدد دعواتك: ${Number(u.invitesCount || 0)} • +${bonus} عملة لكل مدعو)</strong>
          <div class="profile-link-box">
            <input type="text" id="custReferralLinkInput" readonly value="${escapeHtml(refLink)}" />
            <button type="button" id="custCopyReferralBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-copy"></i> نسخ رابط الدعوة</button>
          </div>
        `;
        $('custCopyReferralBtn')?.addEventListener('click', () => {
          navigator.clipboard?.writeText(refLink).then(
            () => showToast('تم نسخ رابط الدعوة الخاص بك!'),
            () => showToast('انسخ رابط الدعوة من الحقل.')
          );
        });
      } else {
        refBox.classList.add('hidden');
      }
    }

    // Friends tab
    const friends = state.social.friends || [];
    if ($('custFriendsList')) {
      $('custFriendsList').innerHTML = friends.length
        ? friends.map((f) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(f.friend_name)}</strong><div class="muted">${f.status === 'accepted' ? 'صديق' : 'طلب معلق'}</div></div>
              <button type="button" class="btn-secondary btn-xs cust-fr-pm" data-fk="${escapeHtml(f.friend_key)}" data-fn="${escapeHtml(f.friend_name)}">مراسلة</button>
            </div>
          `).join('')
        : '<div class="muted" style="text-align:center;padding:12px;">لا يوجد أصدقاء مضافون بعد.</div>';
      $('custFriendsList').querySelectorAll('.cust-fr-pm').forEach((b) => {
        b.addEventListener('click', () => {
          closeModal('customizeModal');
          openSocialModal('pm', { key: b.dataset.fk, name: b.dataset.fn });
        });
      });
    }

    // Gifts tab
    $('custCoinsBalance').textContent = String(u.coins || 0);
    $('custGiftsReceivedCount').textContent = String(u.giftsReceived || 0);
    $('custGiftsSentCount').textContent = String(u.giftsSent || 0);
    $('custActivityPoints').textContent = String(u.activityPoints || 0);
    const recList = state.social.myGifts?.received || [];
    $('custReceivedGiftsList').innerHTML = recList.length
      ? recList.map((g) => `
          <div class="gift-card">
            <div class="gift-emoji-big">${escapeHtml(g.gift_emoji || '🎁')}</div>
            <strong>${escapeHtml(g.gift_name)}</strong>
            <span class="muted">من: ${escapeHtml(g.from_name)}</span>
          </div>
        `).join('')
      : '<div class="muted">لم تستلم هدايا بعد.</div>';

    // Relations tab
    if ($('custRelationsBox')) {
      $('custRelationsBox').innerHTML = `
        <div class="admin-list-card">
          <div>
            <strong><i class="fa-solid fa-crown" style="color:#d97706;"></i> العائلة الملكية</strong>
            <div class="muted">${u.vipFamily ? escapeHtml(u.vipFamily) : 'اكتب اسم عائلتك من تبويب المعلومات'}</div>
          </div>
          <strong>${friends.filter((f) => f.status === 'accepted').length} صديق</strong>
        </div>
      `;
    }

    // Posts tab
    if ($('custUserPostsList')) {
      const myPosts = (state.social.wallPosts || []).filter((p) => p.author_key === u.key);
      $('custUserPostsList').innerHTML = myPosts.length
        ? myPosts.map((p) => `
            <div class="news-card">
              <div><strong>${escapeHtml(p.author_name)}</strong></div>
              <p style="margin-top:4px;">${escapeHtml(p.content)}</p>
              <span class="muted"><i class="fa-solid fa-heart"></i> ${p.likes_count || 0}</span>
            </div>
          `).join('')
        : '<div class="muted" style="text-align:center;padding:10px;">لم تنشر منشورات على حائطك بعد.</div>';
    }

    // More / Addons
    const canAddons = isOwner || hasPerm('use_addons');
    $('custAddonsLockNotice').classList.toggle('hidden', canAddons);
    $('custVipWingsToggle').disabled = !canAddons;

    renderCustomizeAddonsGrids(canAddons);
    switchNameStyleTab(state.activeNameStyleTab || 'color');
    switchCustomizeTab(initialTab === 'account' || initialTab === 'options' || initialTab === 'addons' ? (initialTab === 'account' ? 'info' : 'more') : initialTab);
    updateCustomizePreview();
    openModal('customizeModal');
  }

  function renderCustomizeAddonsGrids(canAddons) {
    const u = state.user;

    if ($('custBgEffectsGrid')) {
      $('custBgEffectsGrid').innerHTML = (state.shopItems.profileBackgrounds || []).map((bg) => `
        <div class="addon-card ${(u.profileBgEffect || 'none') === bg.id ? 'active' : ''}">
          <div class="bg-swatch-mini ${bg.id !== 'none' ? `bg-effect-${bg.id}` : ''}"></div>
          <strong style="font-size:12px;">${escapeHtml(bg.label)}</strong>
          <button type="button" class="btn-primary btn-xs pick-bg-effect-btn" data-bg-id="${bg.id}" ${!canAddons && bg.id !== 'none' ? 'disabled' : ''}>
            ${(u.profileBgEffect || 'none') === bg.id ? 'مفعل' : 'تطبيق'}
          </button>
        </div>
      `).join('');

      $('custBgEffectsGrid').querySelectorAll('.pick-bg-effect-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'bg_effect', itemId: btn.dataset.bgId } });
            state.user = res.user;
            renderCustomizeAddonsGrids(canAddons);
            updateCustomizePreview();
            renderUserIdentity();
            showToast('تم تحديث خلفية البطاقة الملكية.');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
    }

    $('custShineGrid').innerHTML = (state.shopItems.shines || []).map((s) => `
      <div class="addon-card ${u.nameShine === s.id ? 'active' : ''}">
        <div class="${s.id !== 'none' ? `shine-${s.id}` : ''}" style="font-weight:800;font-size:15px;">${escapeHtml(u.name || 'نموذج')}</div>
        <span class="muted">${escapeHtml(s.label)}</span>
        <button type="button" class="btn-primary btn-xs pick-shine-btn" data-shine-id="${s.id}" ${!canAddons && s.id !== 'none' ? 'disabled' : ''}>
          ${u.nameShine === s.id ? 'مفعل' : 'تفعيل'}
        </button>
      </div>
    `).join('');

    $('custShineGrid').querySelectorAll('.pick-shine-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'shine', itemId: btn.dataset.shineId } });
          state.user = res.user;
          renderCustomizeAddonsGrids(canAddons);
          updateCustomizePreview();
          renderUserIdentity();
          showToast('تم تحديث لمعة الاسم.');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    $('custFramesGrid').innerHTML = (state.shopItems.frames || []).filter((f) => f.id !== 'none').map((f) => `
      <div class="addon-card ${u.avatarFrame === f.id ? 'active' : ''}">
        <span class="avatar-wrap sm frame-${f.id}">ع</span>
        <strong style="font-size:12px;">${escapeHtml(f.label)}</strong>
        <div class="addon-card-actions">
          <button type="button" class="btn-primary btn-xs equip-frame-btn" data-frame-id="${f.id}" ${!canAddons ? 'disabled' : ''}>
            ${u.avatarFrame === f.id ? 'مفعل' : 'تفعيل'}
          </button>
          ${u.avatarFrame === f.id ? '<button type="button" class="btn-danger btn-xs remove-frame-btn">إزالة</button>' : ''}
        </div>
      </div>
    `).join('');

    $('custFramesGrid').querySelectorAll('.equip-frame-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'frame', itemId: btn.dataset.frameId } });
          state.user = res.user;
          renderCustomizeAddonsGrids(canAddons);
          updateCustomizePreview();
          renderUserIdentity();
          showToast('تم تفعيل الإطار بنجاح!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    $('custFramesGrid').querySelectorAll('.remove-frame-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'frame', itemId: 'none' } });
        state.user = res.user;
        renderCustomizeAddonsGrids(canAddons);
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تمت إزالة الإطار.');
      });
    });

    $('custNameplatesGrid').innerHTML = (state.shopItems.nameplates || []).map((np) => `
      <div class="addon-card ${u.nameplateStyle === np.id ? 'active' : ''}">
        <span class="sender-name-btn ${np.id !== 'default' ? `nameplate-${np.id}` : ''}" style="color:#0f172a;">${escapeHtml(u.name || 'الاسم')}</span>
        <span class="muted">${escapeHtml(np.label)}</span>
        <button type="button" class="btn-secondary btn-xs pick-np-btn" data-np-id="${np.id}" ${!canAddons && np.id !== 'default' ? 'disabled' : ''}>
          ${u.nameplateStyle === np.id ? 'مفعل' : 'تطبيق'}
        </button>
      </div>
    `).join('');

    $('custNameplatesGrid').querySelectorAll('.pick-np-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'nameplate', itemId: btn.dataset.npId } });
          state.user = res.user;
          renderCustomizeAddonsGrids(canAddons);
          updateCustomizePreview();
          renderUserIdentity();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  function updateCustomizePreview() {
    const u = state.user;
    if (!u) return;
    const previewObj = {
      ...u,
      name: $('custDisplayName').value.trim() || u.name,
      nameColor: $('custNameColor').value,
      nameBgColor: $('custNameBgColor').dataset.cleared === '1' ? '' : $('custNameBgColor').value,
      neonColor: $('custNeonColor').dataset.cleared === '1' ? '' : $('custNeonColor').value,
      fontFamily: $('custFontFamily').value,
      fontStyle: $('custFontStyle').value,
      fontSize: $('custFontSize') ? Number($('custFontSize').value) : (u.fontSize || 14),
      vipWings: $('custVipWingsToggle').checked
    };
    if ($('custFontSizeVal') && $('custFontSize')) {
      $('custFontSizeVal').textContent = $('custFontSize').value;
    }
    const wrap = $('custPreviewAvatarWrap');
    if (wrap) wrap.className = `avatar-wrap xl frame-${u.avatarFrame || 'none'}`;
    if (u.avatarUrl) {
      $('custPreviewAvatarImg').src = u.avatarUrl;
      $('custPreviewAvatarImg').classList.remove('hidden');
      $('custPreviewAvatarLetter').classList.add('hidden');
    } else {
      $('custPreviewAvatarImg').classList.add('hidden');
      $('custPreviewAvatarLetter').classList.remove('hidden');
      $('custPreviewAvatarLetter').textContent = (previewObj.name || 'ع').slice(0, 1);
    }

    if ($('custCoverImg') && $('custCoverHero')) {
      if (u.coverUrl) {
        $('custCoverImg').src = u.coverUrl;
        $('custCoverImg').classList.remove('hidden');
        $('custCoverHero').style.backgroundImage = `url('${u.coverUrl}')`;
      } else {
        $('custCoverImg').classList.add('hidden');
        $('custCoverHero').style.backgroundImage = '';
      }
    }

    const isOwner = u.role === 'site_owner';
    const card = document.querySelector('#customizeModal .profile-luxury-card');
    if (card) {
      card.className = 'modal-card modal-card-md profile-luxury-card';
      if (isOwner) card.classList.add('owner-black-gold-theme');
      if (u.profileBgEffect && u.profileBgEffect !== 'none') {
        card.classList.add(`bg-effect-${u.profileBgEffect}`);
      }
    }
    const bgLayer = $('custBgEffectLayer');
    if (bgLayer) {
      bgLayer.className = isOwner ? 'owner-falling-stars-layer' : 'profile-bg-effect-layer';
    }

    $('custPreviewNameRow').innerHTML = `${roleBadgeHTML(u.role, true)} ${formatNameHTML(previewObj)}`;
    $('custPreviewBio').textContent = $('custBioInput').value || u.bio || '';
  }

  function switchCustomizeTab(tab) {
    state.activeCustomizeTab = tab;
    document.querySelectorAll('.cust-tab').forEach((b) => b.classList.toggle('active', b.dataset.custTab === tab));
    ['info', 'friends', 'gifts', 'relations', 'posts', 'more'].forEach((t) => {
      $(`custPane_${t}`)?.classList.toggle('hidden', t !== tab);
    });
  }

  // ==========================================
  // NEWS MODAL & PUBLISHER
  // ==========================================
  async function openNewsModal() {
    try {
      const res = await api('/api/news');
      state.news = res.news || [];
    } catch {
      // fallback
    }
    const canPublish = state.user?.role === 'site_owner' || hasPerm('publish_news');
    $('newsPublishBar').classList.toggle('hidden', !canPublish);
    renderNewsFeed();
    openModal('newsModal');
  }

  function renderNewsFeed() {
    const canDel = state.user?.role === 'site_owner' || hasPerm('publish_news') || hasPerm('access_panel');
    $('newsFeedList').innerHTML = state.news.length
      ? state.news.map((n) => `
          <article class="news-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <strong style="font-size:15px;">📰 ${escapeHtml(n.title)}</strong>
              ${canDel ? `<button type="button" class="btn-danger btn-xs del-news-btn" data-news-id="${n.id}">حذف</button>` : ''}
            </div>
            <div class="muted" style="margin-top:3px;">بقلم: ${escapeHtml(n.author_name)} • ${new Date(n.created_at).toLocaleString('ar-EG')}</div>
            <p style="margin-top:8px;line-height:1.6;">${escapeHtml(n.content)}</p>
            ${n.image_url ? `<img src="${escapeHtml(n.image_url)}" class="news-card-img" alt="" />` : ''}
          </article>
        `).join('')
      : '<div class="muted">لا توجد أخبار منشورة حالياً.</div>';

    $('newsFeedList').querySelectorAll('.del-news-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api(`/api/news/${btn.dataset.newsId}`, { method: 'DELETE' });
          state.news = state.news.filter((x) => x.id !== Number(btn.dataset.newsId));
          renderNewsFeed();
          showToast('تم حذف الخبر.');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  // ==========================================
  // LEADERBOARDS (الأثرياء / تفاعل الأعضاء / تفاعل الغرف / الكبار / العائلات)
  // ==========================================
  async function openLeaderboardsModal(tab = 'rich') {
    state.activeLeaderboardTab = tab;
    document.querySelectorAll('.lb-tab').forEach((b) => b.classList.toggle('active', b.dataset.lbTab === tab));
    $('leaderboardsBody').innerHTML = '<div class="muted">جاري التحميل...</div>';
    openModal('leaderboardsModal');
    try {
      const data = await api('/api/leaderboards');
      state.leaderboardsData = data;
      renderLeaderboardBody(tab);
    } catch (err) {
      $('leaderboardsBody').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderLeaderboardBody(tab) {
    const data = state.leaderboardsData || {};
    const body = $('leaderboardsBody');
    if (tab === 'activeRooms') {
      const rooms = data.activeRooms || [];
      body.innerHTML = rooms.map((r, i) => `
        <div class="admin-list-card">
          <div style="display:flex;align-items:center;gap:10px;">
            <strong>#${i + 1}</strong>
            <img src="${escapeHtml(r.image_url || '/assets/rooms/default.svg')}" style="width:36px;height:36px;border-radius:9px;" alt="" />
            <div>
              <strong>${escapeHtml(r.icon)} ${escapeHtml(r.name)}</strong>
              <div class="muted">👥 ${r.onlineCount || 0} متواجد • 🔥 ${r.activity_points || 0} نقطة تفاعل</div>
            </div>
          </div>
          <button type="button" class="btn-primary btn-xs lb-join-room-btn" data-room-id="${escapeHtml(r.id)}">دخول</button>
        </div>
      `).join('');
      body.querySelectorAll('.lb-join-room-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          closeModal('leaderboardsModal');
          joinRoomWithPrompt(btn.dataset.roomId);
        });
      });
      return;
    }

    if (tab === 'families') {
      const fams = data.families || [];
      body.innerHTML = fams.length
        ? fams.map((f, i) => `
            <div class="admin-list-card">
              <div><strong>#${i + 1} 🏰 ${escapeHtml(f.name)}</strong><div class="muted">${f.members} أعضاء</div></div>
              <div><strong>💰 ${f.totalCoins}</strong> • <span class="muted">🔥 ${f.totalActivity}</span></div>
            </div>
          `).join('')
        : '<div class="muted">لا توجد عائلات مسجلة بعد.</div>';
      return;
    }

    const list = tab === 'rich' ? data.rich : tab === 'activeMembers' ? data.activeMembers : data.vips;
    body.innerHTML = (list || []).map((u, i) => `
      <div class="admin-list-card">
        <div style="display:flex;align-items:center;gap:8px;">
          <strong>#${i + 1}</strong>
          ${formatAvatarHTML(u, 'sm')}
          <div>
            <div>${formatNameHTML(u)} ${u.online ? '🟢' : ''}</div>
            <div>${roleBadgeHTML(u.role)}</div>
          </div>
        </div>
        <div style="text-align:left;font-weight:800;">
          <div>💰 ${u.coins}</div>
          <div class="muted">🔥 ${u.activityPoints || 0} نقطة</div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // SOCIAL MODALS (NOTIFICATIONS, FRIENDS, PM, WALL, REPORTS)
  // ==========================================
  async function openSocialModal(mode, pmTarget = null) {
    $('socialModalBody').innerHTML = '<div class="muted">جاري التحميل...</div>';
    openModal('socialModal');
    try {
      const res = await api('/api/social/state');
      state.social = { ...state.social, ...res };
      updateFriendAndPmBadges();
    } catch {
      // ignore
    }

    if (mode === 'notifications') {
      $('socialModalTitle').textContent = '🔔 الإشعارات';
      await api('/api/notifications/read', { method: 'POST' }).catch(() => {});
      updateNotificationBadge(0);
      const list = state.social.notifications || [];
      $('socialModalBody').innerHTML = list.length
        ? list.map((n) => `
            <div class="admin-list-card" style="flex-direction:column;align-items:flex-start;">
              <strong>${escapeHtml(n.title)}</strong>
              <div>${escapeHtml(n.body)}</div>
              <span class="muted">${new Date(n.created_at).toLocaleString('ar-EG')}</span>
            </div>
          `).join('')
        : '<div class="muted">لا توجد إشعارات جديدة.</div>';
      return;
    }

    if (mode === 'friends') {
      $('socialModalTitle').textContent = '🤝 الأصدقاء والطلبات';
      const friends = state.social.friends || [];
      $('socialModalBody').innerHTML = friends.length
        ? friends.map((f) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(f.friend_name)}</strong><div class="muted">${f.status === 'accepted' ? '✅ صديق' : '⏳ معلق'}</div></div>
              <div style="display:flex;gap:5px;">
                ${f.status === 'pending' && f.requested_by !== state.user.key
                  ? `<button type="button" class="btn-primary btn-xs fr-acc-btn" data-fk="${escapeHtml(f.friend_key)}">قبول</button>
                     <button type="button" class="btn-danger btn-xs fr-dec-btn" data-fk="${escapeHtml(f.friend_key)}">رفض</button>`
                  : ''}
                ${f.status === 'accepted'
                  ? `<button type="button" class="btn-secondary btn-xs fr-pm-btn" data-fk="${escapeHtml(f.friend_key)}" data-fn="${escapeHtml(f.friend_name)}">مراسلة</button>`
                  : ''}
              </div>
            </div>
          `).join('')
        : '<div class="muted">لا توجد طلبات صداقة حالياً.</div>';

      $('socialModalBody').querySelectorAll('.fr-acc-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api('/api/friends/respond', { method: 'POST', body: { friendKey: b.dataset.fk, accept: true } });
          openSocialModal('friends');
        });
      });
      $('socialModalBody').querySelectorAll('.fr-dec-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api('/api/friends/respond', { method: 'POST', body: { friendKey: b.dataset.fk, accept: false } });
          openSocialModal('friends');
        });
      });
      $('socialModalBody').querySelectorAll('.fr-pm-btn').forEach((b) => {
        b.addEventListener('click', () => openSocialModal('pm', { key: b.dataset.fk, name: b.dataset.fn }));
      });
      return;
    }

    if (mode === 'pm') {
      openSlideSheetDrawer('pm', pmTarget);
      closeModal('socialModal');
      return;
    }

    if (mode === 'wall') {
      openSlideSheetDrawer('wall');
      closeModal('socialModal');
      return;
    }

    if (mode === 'report') {
      $('socialModalTitle').textContent = '🚨 إرسال بلاغ للإدارة';
      $('socialModalBody').innerHTML = `
        <input type="text" id="reportTargetInput" placeholder="اسم العضو المخالف..." />
        <textarea id="reportReasonInput" rows="3" placeholder="تفاصيل المخالفة..."></textarea>
        <button type="button" id="submitReportBtn" class="btn-danger">إرسال البلاغ الآن</button>
      `;
      $('submitReportBtn').addEventListener('click', async () => {
        try {
          await api('/api/reports', {
            method: 'POST',
            body: {
              targetName: $('reportTargetInput').value,
              reason: $('reportReasonInput').value,
              roomId: state.currentRoom?.id || ''
            }
          });
          showToast('تم إرسال البلاغ للإدارة.');
          closeModal('socialModal');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }
  }

  // ==========================================
  // SLIDE-OVER DRAWER: WALL (REACTIONS, COMMENTS, GOLD INVITES), ROOMS & PM
  // ==========================================
  function closeSlideSheetDrawer() {
    $('slideSheetDrawer')?.classList.remove('open');
    state.activeSlideDrawer = null;
  }

  async function openSlideSheetDrawer(mode, targetArg = null) {
    state.activeSlideDrawer = mode;
    state.activeSlidePmTarget = mode === 'pm' ? targetArg : null;
    $('usersSidePanel')?.classList.remove('open');
    const drawer = $('slideSheetDrawer');
    const titleEl = $('slideSheetTitle');
    const bodyEl = $('slideSheetBody');
    if (!drawer || !bodyEl) return;

    drawer.classList.add('open');

    if (mode === 'rooms') {
      titleEl.innerHTML = '<i class="fa-solid fa-door-open"></i> قائمة الغرف';
      bodyEl.innerHTML = state.rooms.map((r) => `
        <div class="admin-list-card" style="background:#ffffff;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${escapeHtml(r.image_url || '/assets/rooms/default.svg')}" style="width:42px;height:42px;border-radius:8px;object-fit:cover;" alt="" />
            <div>
              <strong>${escapeHtml(r.icon)} ${escapeHtml(r.name)} ${r.hasPassword ? '🔒' : ''}</strong>
              <div class="muted">${escapeHtml(r.description || '')}</div>
              <div class="muted">👥 ${r.onlineCount || 0} متواجد • 🔥 ${r.activity_points || 0} تفاعل</div>
            </div>
          </div>
          <button type="button" class="btn-primary btn-xs join-rm-drawer-btn" data-room-id="${escapeHtml(r.id)}">
            ${state.currentRoom?.id === r.id ? 'الحالية ✓' : 'دخول'}
          </button>
        </div>
      `).join('') || '<div class="muted">لا توجد غرف متاحة.</div>';

      bodyEl.querySelectorAll('.join-rm-drawer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          closeSlideSheetDrawer();
          joinRoomWithPrompt(btn.dataset.roomId);
        });
      });
      return;
    }

    bodyEl.innerHTML = '<div class="muted">جاري التحميل...</div>';
    try {
      const res = await api('/api/social/state');
      state.social = { ...state.social, ...res };
      updateFriendAndPmBadges();
    } catch {
      // ignore
    }

    if (mode === 'pm') {
      const pms = state.social.privateMessages || [];
      if (targetArg) {
        titleEl.innerHTML = `<i class="fa-solid fa-envelope"></i> محادثة مع ${escapeHtml(targetArg.name)}`;
        state.socket?.emit('mark_pm_read', { partnerKey: targetArg.key });
        const thread = pms
          .filter((m) => (m.from_key === targetArg.key && m.to_key === state.user.key) || (m.to_key === targetArg.key && m.from_key === state.user.key))
          .reverse();
        bodyEl.innerHTML = `
          <button type="button" id="backToPmListBtn" class="btn-secondary btn-xs" style="align-self:flex-start;"><i class="fa-solid fa-arrow-right"></i> جميع المحادثات</button>
          <div style="display:flex;flex-direction:column;gap:6px;flex:1;overflow-y:auto;">
            ${thread.map((m) => `
              <div class="admin-list-card" style="background:${m.from_key === state.user.key ? '#18181b' : '#ffffff'};color:${m.from_key === state.user.key ? '#ffffff' : '#111827'}">
                <div><strong>${escapeHtml(m.from_name)}:</strong> ${escapeHtml(m.content)}</div>
              </div>
            `).join('') || '<div class="muted">ابدأ المحادثة الخاصة الآن...</div>'}
          </div>
          <div class="wall-comment-composer">
            <input type="text" id="pmComposeInput" placeholder="اكتب رسالتك الخاصة..." />
            <button type="button" id="pmComposeSendBtn" class="btn-primary btn-xs">إرسال</button>
          </div>
        `;
        $('backToPmListBtn')?.addEventListener('click', () => openSlideSheetDrawer('pm', null));
        const submitPm = () => {
          const val = $('pmComposeInput')?.value.trim();
          if (!val) return;
          state.socket.emit('send_pm', { toKey: targetArg.key, toName: targetArg.name, content: val }, () => {
            openSlideSheetDrawer('pm', targetArg);
          });
        };
        $('pmComposeSendBtn')?.addEventListener('click', submitPm);
        $('pmComposeInput')?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); submitPm(); }
        });
      } else {
        titleEl.innerHTML = '<i class="fa-solid fa-envelope"></i> الرسائل الخاصة';
        const partners = new Map();
        for (const m of pms) {
          const pKey = m.from_key === state.user.key ? m.to_key : m.from_key;
          const pName = m.from_key === state.user.key ? m.to_name : m.from_name;
          if (!partners.has(pKey)) partners.set(pKey, { key: pKey, name: pName, last: m.content });
        }
        bodyEl.innerHTML = [...partners.values()].length
          ? [...partners.values()].map((p) => `
              <div class="admin-list-card" style="background:#ffffff;">
                <div><strong>${escapeHtml(p.name)}</strong><div class="muted">${escapeHtml(p.last)}</div></div>
                <button type="button" class="btn-primary btn-xs open-pm-thread-btn" data-pk="${escapeHtml(p.key)}" data-pn="${escapeHtml(p.name)}">فتح</button>
              </div>
            `).join('')
          : '<div class="muted">لا توجد رسائل خاصة بعد. اضغط على صورة أي عضو لمراسلته.</div>';
        bodyEl.querySelectorAll('.open-pm-thread-btn').forEach((b) => {
          b.addEventListener('click', () => openSlideSheetDrawer('pm', { key: b.dataset.pk, name: b.dataset.pn }));
        });
      }
      return;
    }

    if (mode === 'wall') {
      titleEl.innerHTML = '<i class="fa-solid fa-signs-post"></i> الحائط والمنشورات';
      renderWallFeedInto(bodyEl);
    }
  }

  function renderWallFeedInto(container) {
    if (!container) return;
    const posts = state.social.wallPosts || [];
    const curRoom = state.currentRoom;
    container.innerHTML = `
      ${!state.user?.isGuest ? `
        <div class="news-composer" style="background:#ffffff;">
          <textarea id="wallPostInput" rows="2" placeholder="شارك منشوراً على الحائط..."></textarea>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
            <label class="switch-label" style="font-size:11.5px;">
              <input type="checkbox" id="wallAttachInviteChk" />
              <span>إرفاق دعوة غرفة (${escapeHtml(curRoom?.name || 'العامة')})</span>
            </label>
            <select id="wallInviteFlagSelect" style="padding:3px 6px;font-size:12px;">
              <option value="🌍">🌍 عام</option>
              <option value="🇸🇦">🇸🇦 السعودية</option>
              <option value="🇪🇬">🇪🇬 مصر</option>
              <option value="🇦🇪">🇦🇪 الإمارات</option>
              <option value="🇮🇶">🇮🇶 العراق</option>
              <option value="🇯🇴">🇯🇴 الأردن</option>
              <option value="🇰🇼">🇰🇼 الكويت</option>
              <option value="🇲🇦">🇲🇦 المغرب</option>
              <option value="🇱🇧">🇱🇧 لبنان</option>
            </select>
          </div>
          <button type="button" id="wallPostSubmitBtn" class="btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i> نشر على الحائط</button>
        </div>` : ''}
      <div class="news-feed-list">
        ${posts.map((p) => {
          const rx = p.reactions || { like: p.likes_count || 0, heart: 0, laugh: 0 };
          const cmts = Array.isArray(p.comments) ? p.comments : [];
          const canDel = (state.user && p.author_key === state.user.key) || state.user?.role === 'site_owner' || hasPerm('access_panel');
          const authorObj = {
            key: p.author_key,
            name: p.author_name,
            role: p.author_role,
            avatarUrl: p.avatar_url,
            avatarFrame: p.avatar_frame,
            nameplateStyle: p.nameplate_style,
            nameColor: p.name_color,
            nameBgColor: p.name_bg_color,
            neonColor: p.neon_color
          };
          return `
            <div class="wall-post-card" data-wall-post-id="${p.id}">
              <div class="wall-post-header">
                <div class="wall-post-author">
                  <span class="wall-author-avatar" style="cursor:pointer">${formatAvatarHTML(authorObj, '')}</span>
                  <div>
                    <div>${roleBadgeHTML(p.author_role, true)} ${formatNameHTML(authorObj)}</div>
                    <div class="wall-post-time">${escapeHtml(formatTimeAgo(p.created_at))}</div>
                  </div>
                </div>
                <div class="wall-post-menu-wrap">
                  <button type="button" class="msg-dots-btn wall-dots-btn"><i class="fa-solid fa-ellipsis"></i></button>
                  <div class="msg-dots-menu hidden">
                    <button type="button" data-wall-act="profile"><i class="fa-solid fa-id-card"></i> بطاقة العضو</button>
                    <button type="button" data-wall-act="report"><i class="fa-solid fa-triangle-exclamation"></i> إبلاغ</button>
                    ${canDel ? '<button type="button" class="danger" data-wall-act="delete"><i class="fa-solid fa-trash"></i> حذف المنشور</button>' : ''}
                  </div>
                </div>
              </div>
              ${p.content ? `<div class="wall-post-content">${escapeHtml(p.content)}</div>` : ''}
              ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" class="news-card-img" alt="" />` : ''}
              ${p.invite_room_id ? `
                <div class="wall-room-invite-card">
                  <div class="wall-invite-meta">
                    <div class="wall-invite-title"><span>${escapeHtml(p.invite_country_flag || '🌍')}</span> <span>${escapeHtml(p.invite_room_name || 'دعوة غرفة')}</span></div>
                    <div class="wall-invite-sub">👥 ${Number(p.invite_online_count) || 0} متواجد الآن</div>
                  </div>
                  <button type="button" class="wall-invite-join-btn" data-join-room-id="${escapeHtml(p.invite_room_id)}">دخول</button>
                </div>` : ''}
              <div class="wall-reactions-bar">
                <button type="button" class="wall-react-pill like wall-react-btn" data-pid="${p.id}" data-rtype="like">👍 إعجاب <strong>${rx.like || 0}</strong></button>
                <button type="button" class="wall-react-pill heart wall-react-btn" data-pid="${p.id}" data-rtype="heart">❤️ قلب <strong>${rx.heart || 0}</strong></button>
                <button type="button" class="wall-react-pill laugh wall-react-btn" data-pid="${p.id}" data-rtype="laugh">😂 ضحك <strong>${rx.laugh || 0}</strong></button>
                <span class="wall-react-pill">💬 تعليقات <strong>${cmts.length}</strong></span>
              </div>
              ${cmts.length ? `
                <div class="wall-comments-list">
                  ${cmts.slice(-5).map((c) => `
                    <div class="wall-comment-item"><strong>${escapeHtml(c.author_name)}:</strong> ${escapeHtml(c.content)}</div>
                  `).join('')}
                </div>` : ''}
              <div class="wall-comment-composer">
                <input type="text" class="wall-comment-input" data-pid="${p.id}" placeholder="اكتب تعليقك..." maxlength="300" />
                <button type="button" class="btn-primary btn-xs wall-comment-send-btn" data-pid="${p.id}">إرسال</button>
              </div>
            </div>
          `;
        }).join('') || '<div class="muted">لا توجد منشورات بعد.</div>'}
      </div>
    `;

    container.querySelector('#wallPostSubmitBtn')?.addEventListener('click', async () => {
      const content = container.querySelector('#wallPostInput')?.value.trim() || '';
      const attachInvite = Boolean(container.querySelector('#wallAttachInviteChk')?.checked);
      const countryFlag = container.querySelector('#wallInviteFlagSelect')?.value || '🌍';
      if (!content && !attachInvite) return;
      try {
        await api('/api/wall', {
          method: 'POST',
          body: {
            content: content || (attachInvite ? `دعوة للانضمام إلى ${state.currentRoom?.name || 'الغرفة'}` : ''),
            inviteRoomId: attachInvite ? (state.currentRoom?.id || 'general') : '',
            countryFlag
          }
        });
        openSlideSheetDrawer('wall');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    container.querySelectorAll('.wall-react-btn').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          const res = await api(`/api/wall/${b.dataset.pid}/react`, { method: 'POST', body: { type: b.dataset.rtype } });
          if (res?.post) {
            state.social.wallPosts = (state.social.wallPosts || []).map((x) => (x.id === res.post.id ? res.post : x));
            renderWallFeedInto(container);
          }
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    container.querySelectorAll('.wall-comment-send-btn').forEach((btn) => {
      const sendCmt = async () => {
        const pid = btn.dataset.pid;
        const inp = container.querySelector(`.wall-comment-input[data-pid="${CSS.escape(pid)}"]`);
        const content = inp?.value.trim();
        if (!content) return;
        try {
          const res = await api(`/api/wall/${pid}/comment`, { method: 'POST', body: { content } });
          if (res?.post) {
            state.social.wallPosts = (state.social.wallPosts || []).map((x) => (x.id === res.post.id ? res.post : x));
            renderWallFeedInto(container);
          }
        } catch (err) {
          showToast(err.message, true);
        }
      };
      btn.addEventListener('click', sendCmt);
      const pid = btn.dataset.pid;
      const inp = container.querySelector(`.wall-comment-input[data-pid="${CSS.escape(pid)}"]`);
      inp?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendCmt();
        }
      });
    });

    container.querySelectorAll('.wall-invite-join-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeSlideSheetDrawer();
        joinRoomWithPrompt(btn.dataset.joinRoomId);
      });
    });

    container.querySelectorAll('.wall-post-card').forEach((card) => {
      const pid = Number(card.dataset.wallPostId);
      const p = posts.find((x) => Number(x.id) === pid);
      if (!p) return;
      card.querySelector('.wall-author-avatar')?.addEventListener('click', () => {
        openQuickUserModal({
          key: p.author_key,
          name: p.author_name,
          role: p.author_role,
          avatarUrl: p.avatar_url,
          avatarFrame: p.avatar_frame
        });
      });
      const dotsBtn = card.querySelector('.wall-dots-btn');
      const dotsMenu = card.querySelector('.msg-dots-menu');
      dotsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dotsMenu.classList.toggle('hidden');
      });
      dotsMenu?.querySelectorAll('button[data-wall-act]').forEach((actBtn) => {
        actBtn.addEventListener('click', async () => {
          dotsMenu.classList.add('hidden');
          const act = actBtn.dataset.wallAct;
          if (act === 'profile') {
            openQuickUserModal({ key: p.author_key, name: p.author_name, role: p.author_role, avatarUrl: p.avatar_url });
          } else if (act === 'report') {
            openSocialModal('report');
          } else if (act === 'delete') {
            await api(`/api/wall/${p.id}`, { method: 'DELETE' });
            state.social.wallPosts = (state.social.wallPosts || []).filter((x) => x.id !== p.id);
            renderWallFeedInto(container);
          }
        });
      });
    });
  }

  // ==========================================
  // ROOMS SWITCHER
  // ==========================================
  function joinRoomWithPrompt(roomId) {
    const rm = state.rooms.find((r) => r.id === roomId);
    let password = '';
    if (rm && rm.hasPassword && state.user?.role !== 'site_owner' && !hasPerm('manage_rooms')) {
      password = prompt(`الغرفة "${rm.name}" محمية بكلمة مرور:`) || '';
    }
    state.socket.emit('join_room', { roomId, password }, (res) => {
      if (res?.error) showToast(res.error, true);
      else localStorage.setItem(ROOM_KEY, roomId);
    });
  }

  function openRoomsModal() {
    openSlideSheetDrawer('rooms');
  }

  // ==========================================
  // FULL ADMIN & CMS PANEL (ALL 8 TABS)
  // ==========================================
  async function openAdminPanel(tab = 'stats', preselectRoomId = null) {
    state.activeAdminTab = tab;
    if (preselectRoomId !== undefined && preselectRoomId !== null) {
      state.editingRoomId = preselectRoomId;
    } else if (tab !== 'rooms') {
      state.editingRoomId = null;
    }
    if (tab !== 'ranks') state.editingRankKey = null;

    document.querySelectorAll('.adm-tab').forEach((b) => b.classList.toggle('active', b.dataset.admTab === tab));
    $('adminModalBody').innerHTML = '<div class="muted">جاري تحميل بيانات الإدارة...</div>';
    openModal('adminModal');
    try {
      const promises = [api('/api/admin/overview')];
      if (state.user?.role === 'site_owner') {
        promises.push(api('/api/owner/suite').catch(() => null));
      }
      const [ov, suite] = await Promise.all(promises);
      state.adminOverview = ov;
      if (suite) state.ownerSuite = suite;
      state.ranks = state.adminOverview.ranks || state.ranks;
      renderAdminTab(tab);
    } catch (err) {
      $('adminModalBody').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  }

  function buildAssignableRankOptions(selectedKey) {
    const isOwner = state.user?.role === 'site_owner';
    const ceiling = isOwner ? 100 : (state.adminOverview?.stats?.myMaxAssignablePower ?? 0);
    return state.ranks
      .filter((r) => r.key !== 'guest' && (isOwner || r.power <= ceiling))
      .map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === selectedKey ? 'selected' : ''}>${escapeHtml(r.icon)} ${escapeHtml(r.label)} (قوة ${r.power})</option>`)
      .join('');
  }

  function renderAdminTab(tab) {
    const ov = state.adminOverview;
    if (!ov) return;
    const body = $('adminModalBody');
    const isOwner = state.user?.role === 'site_owner';

    if (tab === 'stats') {
      const s = ov.stats;
      body.innerHTML = `
        <div class="gifts-wallet-summary">
          <div class="stat-mini"><span>🟢 متصلون الآن</span><strong>${s.onlineCount}</strong></div>
          <div class="stat-mini"><span>👥 الأعضاء</span><strong>${s.registeredCount}</strong></div>
          <div class="stat-mini"><span>🏠 الغرف</span><strong>${s.roomsCount}</strong></div>
          <div class="stat-mini"><span>👑 الرتب</span><strong>${s.ranksCount}</strong></div>
        </div>
        <div class="gifts-wallet-summary">
          <div class="stat-mini"><span>📰 الأخبار</span><strong>${s.newsCount}</strong></div>
          <div class="stat-mini"><span>🚫 المحظورون</span><strong>${s.bansCount}</strong></div>
          <div class="stat-mini"><span>🚨 البلاغات</span><strong>${s.reportsCount}</strong></div>
          <div class="stat-mini"><span>🎖️ سقف الترقية</span><strong>${s.myMaxAssignablePower}</strong></div>
        </div>
      `;
      return;
    }

    if (tab === 'users') {
      const canBan = isOwner || hasPerm('ban');
      const canMod = isOwner || hasPerm('mute') || hasPerm('kick');
      body.innerHTML = `
        <div class="news-composer">
          <strong><i class="fa-solid fa-user-plus"></i> إنشاء حساب عضو جديد وتعيين رتبته</strong>
          <div class="form-grid-2">
            <input type="text" id="admNewUsername" placeholder="اسم المستخدم" />
            <input type="text" id="admNewDisplay" placeholder="الاسم المعروض" />
            <input type="email" id="admNewEmail" placeholder="البريد الإلكتروني" />
            <input type="password" id="admNewPass" placeholder="كلمة المرور (5+ أحرف)" />
          </div>
          <div class="inline-row">
            <select id="admNewRole" style="flex:1">${buildAssignableRankOptions('member')}</select>
            <button type="button" id="admCreateUserBtn" class="btn-primary btn-sm">إنشاء الحساب</button>
          </div>
        </div>
        <div class="news-feed-list">
          ${(ov.users || []).map((u) => `
            <div class="admin-list-card">
              <div>
                <strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)}) ${u.isSupremeOwner ? '<i class="fa-solid fa-shield-halved" style="color:#d97706;"></i>' : ''}</strong>
                <div class="muted">${escapeHtml(u.email)} • ${roleBadgeHTML(u.role)} • <i class="fa-solid fa-coins"></i> ${u.coins} ${u.isGhosted ? '• <span style="color:#7c3aed;">شبح</span>' : ''}</div>
              </div>
              <div class="inline-row" style="flex-wrap:wrap;">
                <select class="adm-user-role-sel" data-uid="${u.id}" ${u.isSupremeOwner && !isOwner ? 'disabled' : ''}>
                  ${buildAssignableRankOptions(u.role)}
                </select>
                <button type="button" class="btn-primary btn-xs adm-save-role-btn" data-uid="${u.id}">تطبيق</button>
                ${!u.isSupremeOwner || isOwner ? `<button type="button" class="btn-secondary btn-xs adm-rename-user-btn" data-uid="${u.id}" data-cur="${escapeHtml(u.displayName)}"><i class="fa-solid fa-pen"></i> الاسم</button>` : ''}
                ${isOwner ? `<button type="button" class="btn-secondary btn-xs adm-give-coins-btn" data-uid="${u.id}">+500</button>` : ''}
                ${canMod && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-secondary btn-xs adm-ghost-user-btn" data-uid="${u.id}" data-ghosted="${u.isGhosted ? '1' : '0'}"><i class="fa-solid fa-ghost"></i> ${u.isGhosted ? 'إلغاء شبح' : 'شبح'}</button>` : ''}
                ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-xban-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-shield-virus"></i> إكس باند</button>` : ''}
                ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-ban-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-ban"></i> حظر</button>` : ''}
                ${isOwner && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-del-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-user-slash"></i> حذف نهائي</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      $('admCreateUserBtn').addEventListener('click', async () => {
        try {
          await api('/api/admin/users', {
            method: 'POST',
            body: {
              username: $('admNewUsername').value,
              displayName: $('admNewDisplay').value,
              email: $('admNewEmail').value,
              password: $('admNewPass').value,
              role: $('admNewRole').value
            }
          });
          showToast('تم إنشاء الحساب بنجاح!');
          openAdminPanel('users');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      body.querySelectorAll('.adm-save-role-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const uid = Number(btn.dataset.uid);
          const sel = body.querySelector(`.adm-user-role-sel[data-uid="${uid}"]`);
          try {
            await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { role: sel.value } });
            showToast('تم تحديث الرتبة!');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });

      body.querySelectorAll('.adm-rename-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const uid = Number(btn.dataset.uid);
          const nextName = prompt('أدخل الاسم المعروض الجديد:', btn.dataset.cur || '');
          if (!nextName || !nextName.trim()) return;
          try {
            await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { displayName: nextName.trim() } });
            showToast('تم تحديث الاسم المعروض!');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });

      body.querySelectorAll('.adm-give-coins-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          state.socket.emit('admin_give_coins', { userId: uid, amount: 500 });
          showToast('تم إرسال +500 عملة للعضو.');
          setTimeout(() => openAdminPanel('users'), 350);
        });
      });

      body.querySelectorAll('.adm-ghost-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const uid = Number(btn.dataset.uid);
          const next = btn.dataset.ghosted !== '1';
          try {
            await api('/api/admin/ghost', { method: 'POST', body: { userId: uid, enabled: next } });
            showToast(next ? 'تم تفعيل وضع الشبح.' : 'تم إلغاء وضع الشبح.');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });

      body.querySelectorAll('.adm-xban-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const reason = prompt(`سبب إكس باند "${btn.dataset.uname}":`, 'مخالفة جسيمة');
          if (reason === null) return;
          try {
            await api('/api/admin/ban', {
              method: 'POST',
              body: { targetKey: `user:${btn.dataset.uid}`, reason: reason || 'إكس باند من الإدارة', banType: 'xban' }
            });
            showToast('تم تنفيذ إكس باند وحظر الجهاز نهائياً.');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });

      body.querySelectorAll('.adm-ban-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const reason = prompt(`سبب حظر "${btn.dataset.uname}":`, 'مخالفة القوانين');
          if (reason === null) return;
          try {
            await api('/api/admin/ban', {
              method: 'POST',
              body: { targetKey: `user:${btn.dataset.uid}`, reason: reason || 'حظر من الإدارة', banType: 'ban' }
            });
            showToast('تم حظر العضو نهائياً.');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });

      body.querySelectorAll('.adm-del-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm(`هل أنت متأكد من حذف حساب "${btn.dataset.uname}" نهائياً من قاعدة البيانات؟`)) return;
          try {
            await api(`/api/admin/users/${btn.dataset.uid}`, { method: 'DELETE' });
            showToast('تم حذف الحساب نهائياً.');
            openAdminPanel('users');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      return;
    }

    if (tab === 'ranks') {
      const editRk = state.editingRankKey
        ? (ov.ranks || []).find((r) => r.key === state.editingRankKey)
        : null;
      const ep = editRk?.permissions || {};
      const isEditing = Boolean(editRk);
      const badgeStyles = state.shopItems?.rankBadgeStyles?.length ? state.shopItems.rankBadgeStyles : RANK_BADGE_STYLES;

      body.innerHTML = `
        <div class="news-composer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>${isEditing ? `تعديل الرتبة: ${escapeHtml(editRk.label)}` : 'منشئ الرتب والصلاحيات وسقف الترقية'}</strong>
            ${isEditing ? '<button type="button" id="rkCancelEditBtn" class="btn-secondary btn-xs">إلغاء التعديل</button>' : ''}
          </div>
          <div class="form-grid-2">
            <input type="text" id="rkLabel" placeholder="اسم الرتبة (مثال: كبار الشخصيات)" value="${escapeHtml(editRk?.label || '')}" />
            <input type="number" id="rkPower" min="1" max="${editRk?.key === 'site_owner' ? 100 : 99}" value="${editRk ? editRk.power : 65}" ${editRk?.is_system ? 'disabled' : ''} placeholder="القوة (1 - 99)" />
            <div>
              <label class="muted">لون الخلفية</label>
              <input type="color" id="rkBgColor" value="${escapeHtml(editRk?.bg_color || '#7c3aed')}" style="width:100%" />
            </div>
            <div>
              <label class="muted">لون النص</label>
              <input type="color" id="rkTextColor" value="${escapeHtml(editRk?.text_color || '#ffffff')}" style="width:100%" />
            </div>
          </div>
          <div>
            <label class="muted">شكل شعار/درع الرتبة الملكي:</label>
            <select id="rkBadgeStyle" style="width:100%;">
              ${badgeStyles.map((bs) => `<option value="${escapeHtml(bs.id)}" ${(editRk?.badge_style || 'crown_royal') === bs.id ? 'selected' : ''}>${escapeHtml(bs.label)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="muted">اختر أيقونة من المكتبة أو اكتب إيموجي:</label>
            <div class="inline-row">
              <input type="text" id="rkIconInput" value="${escapeHtml(editRk?.icon || '👑')}" style="width:70px;text-align:center;" />
              <div class="icon-preset-grid" id="rkIconPresets">
                ${RANK_ICON_PRESETS.map((ic) => `<button type="button" class="icon-preset-btn" data-ic="${ic}">${ic}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="inline-row">
            <input type="file" id="rkIconFile" accept="image/*" />
            <input type="text" id="rkImgUrl" value="${escapeHtml(editRk?.image_url || '')}" placeholder="أو رابط صورة أيقونة صغيرة للرتبة" style="flex:1" />
          </div>
          <div>
            <label class="muted">سقف الترقية (أقصى قوة رتبة يستطيع حامل هذه الرتبة منحها للآخرين 0-99):</label>
            <input type="number" id="rkMaxAssign" min="0" max="${editRk?.key === 'site_owner' ? 100 : 99}" value="${editRk ? (editRk.max_assignable_rank || 0) : 0}" ${editRk?.key === 'site_owner' ? 'disabled' : ''} />
          </div>
          <div class="perms-check-grid">
            <label class="switch-label"><input type="checkbox" id="permMute" ${ep.mute ? 'checked' : ''} /><span>الكتم</span></label>
            <label class="switch-label"><input type="checkbox" id="permKick" ${ep.kick ? 'checked' : ''} /><span>الطرد</span></label>
            <label class="switch-label"><input type="checkbox" id="permBan" ${ep.ban ? 'checked' : ''} /><span>الحظر</span></label>
            <label class="switch-label"><input type="checkbox" id="permSetRank" ${ep.set_rank ? 'checked' : ''} /><span>تعديل الرتب</span></label>
            <label class="switch-label"><input type="checkbox" id="permClearRoom" ${ep.clear_room ? 'checked' : ''} /><span>مسح الغرفة</span></label>
            <label class="switch-label"><input type="checkbox" id="permManageRooms" ${ep.manage_rooms ? 'checked' : ''} /><span>إدارة الغرف</span></label>
            <label class="switch-label"><input type="checkbox" id="permAccessPanel" ${ep.access_panel ? 'checked' : ''} /><span>دخول الإدارة</span></label>
            <label class="switch-label"><input type="checkbox" id="permRoomOwner" ${ep.room_owner ? 'checked' : ''} /><span>مالك غرفة</span></label>
            <label class="switch-label"><input type="checkbox" id="permPublishNews" ${ep.publish_news ? 'checked' : ''} /><span>نشر الأخبار</span></label>
            <label class="switch-label"><input type="checkbox" id="permUseAddons" ${!isEditing || ep.use_addons ? 'checked' : ''} /><span>استخدام الإضافات</span></label>
          </div>
          <button type="button" id="rkSaveBtn" class="btn-primary" ${!isOwner ? 'disabled' : ''}>
            ${isEditing ? 'حفظ التعديلات على الرتبة' : 'حفظ وإنشاء الرتبة'}
          </button>
        </div>
        <div class="news-feed-list">
          ${(ov.ranks || []).map((r) => `
            <div class="admin-list-card">
              <div>
                ${roleBadgeHTML(r.key)}
                <span class="muted">قوة ${r.power} • سقف الترقية ${r.max_assignable_rank || 0}</span>
                <div class="muted">
                  ${r.permissions?.room_owner ? 'مالك غرفة • ' : ''}
                  ${r.permissions?.publish_news ? 'نشر أخبار • ' : ''}
                  ${r.permissions?.use_addons ? 'إضافات • ' : ''}
                  ${r.permissions?.set_rank ? 'ترقية' : ''}
                </div>
              </div>
              <div class="inline-row">
                ${isOwner ? `<button type="button" class="btn-secondary btn-xs edit-rk-btn" data-rk="${escapeHtml(r.key)}">تعديل</button>` : ''}
                ${isOwner && !r.is_system ? `<button type="button" class="btn-danger btn-xs del-rk-btn" data-rk="${escapeHtml(r.key)}">حذف</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      $('rkCancelEditBtn')?.addEventListener('click', () => {
        state.editingRankKey = null;
        renderAdminTab('ranks');
      });

      $('rkIconPresets').querySelectorAll('.icon-preset-btn').forEach((b) => {
        b.addEventListener('click', () => {
          $('rkIconInput').value = b.dataset.ic;
        });
      });

      $('rkSaveBtn').addEventListener('click', async () => {
        try {
          let imageUrl = $('rkImgUrl').value.trim();
          const file = $('rkIconFile').files[0];
          if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const up = await api('/api/upload/rank-icon', { method: 'POST', body: fd });
            imageUrl = up.url;
          }
          const payload = {
            label: $('rkLabel').value,
            power: Number($('rkPower').value),
            bgColor: $('rkBgColor').value,
            textColor: $('rkTextColor').value,
            badgeStyle: $('rkBadgeStyle')?.value || 'crown_royal',
            icon: $('rkIconInput').value,
            imageUrl,
            maxAssignableRank: Number($('rkMaxAssign').value) || 0,
            permissions: {
              mute: $('permMute').checked,
              kick: $('permKick').checked,
              ban: $('permBan').checked,
              set_rank: $('permSetRank').checked,
              clear_room: $('permClearRoom').checked,
              manage_rooms: $('permManageRooms').checked,
              access_panel: $('permAccessPanel').checked,
              room_owner: $('permRoomOwner').checked,
              publish_news: $('permPublishNews').checked,
              use_addons: $('permUseAddons').checked
            }
          };
          if (isEditing && editRk) {
            await api(`/api/admin/ranks/${encodeURIComponent(editRk.key)}`, { method: 'PUT', body: payload });
            state.editingRankKey = null;
            showToast('تم حفظ تعديلات الرتبة بنجاح!');
          } else {
            await api('/api/admin/ranks', { method: 'POST', body: payload });
            showToast('تم إنشاء الرتبة وحفظها!');
          }
          openAdminPanel('ranks');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      body.querySelectorAll('.edit-rk-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.editingRankKey = b.dataset.rk;
          renderAdminTab('ranks');
        });
      });

      body.querySelectorAll('.del-rk-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/ranks/${encodeURIComponent(b.dataset.rk)}`, { method: 'DELETE' });
            if (state.editingRankKey === b.dataset.rk) state.editingRankKey = null;
            openAdminPanel('ranks');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      return;
    }

    if (tab === 'rooms') {
      const editRm = state.editingRoomId
        ? (ov.rooms || []).find((r) => r.id === state.editingRoomId)
        : null;
      const isEditingRm = Boolean(editRm);
      const userOpts = (ov.users || [])
        .map((u) => `<option value="${u.id}" ${editRm?.owner_user_id === u.id ? 'selected' : ''}>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`)
        .join('');

      body.innerHTML = `
        <div class="news-composer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>${isEditingRm ? `✏️ تعديل الغرفة: ${escapeHtml(editRm.name)}` : '🏠 إنشاء غرفة جديدة'}</strong>
            ${isEditingRm ? '<button type="button" id="admCancelRoomEditBtn" class="btn-secondary btn-xs">إلغاء التعديل</button>' : ''}
          </div>
          <div class="form-grid-2">
            <input type="text" id="admRoomName" placeholder="اسم الغرفة" value="${escapeHtml(editRm?.name || '')}" />
            <input type="text" id="admRoomDesc" placeholder="وصف الغرفة" value="${escapeHtml(editRm?.description || '')}" />
            <input type="text" id="admRoomIcon" placeholder="أيقونة الغرفة (مثال 💬)" value="${escapeHtml(editRm?.icon || '💬')}" />
            <input type="text" id="admRoomPass" placeholder="${isEditingRm ? 'كلمة مرور جديدة (اتركه فارغاً للإبقاء/بلا قفل)' : 'كلمة مرور (اختياري)'}" />
            <select id="admRoomTheme">
              <option value="warm_peach" ${editRm?.bg_theme === 'warm_peach' ? 'selected' : ''}>خوخ دافئ</option>
              <option value="sunset_rose" ${editRm?.bg_theme === 'sunset_rose' ? 'selected' : ''}>وردي غروب</option>
              <option value="sky_breeze" ${editRm?.bg_theme === 'sky_breeze' ? 'selected' : ''}>سماوي نقي</option>
              <option value="royal_night" ${editRm?.bg_theme === 'royal_night' ? 'selected' : ''}>ليلي ملكي</option>
            </select>
            <select id="admRoomOwner">
              <option value="">— بدون مالك معيّن —</option>
              ${userOpts}
            </select>
          </div>
          <div class="inline-row" style="flex-wrap:wrap;">
            <input type="file" id="admRoomWallpaperFile" accept="image/*" />
            <input type="text" id="admRoomWallpaperUrl" value="${escapeHtml(editRm?.wallpaper_url || '')}" placeholder="رابط صورة خلفية الغرفة (اختياري)" style="flex:1" />
            <label class="switch-label"><input type="checkbox" id="admRoomMicsEnabled" ${!editRm || editRm.mics_enabled !== 0 ? 'checked' : ''} /><span>🎙️ تفعيل المايكات</span></label>
          </div>
          <button type="button" id="admSaveRoomBtn" class="btn-primary btn-sm">
            ${isEditingRm ? '💾 حفظ تعديلات الغرفة' : '➕ إنشاء الغرفة'}
          </button>

          ${isEditingRm ? `
            <hr style="border:none;border-top:1px solid #cbd5e1;" />
            <strong>🗝️ مشرفو هذه الغرفة</strong>
            <div class="inline-row">
              <select id="admRoomStaffUserSel" style="flex:1">${userOpts}</select>
              <input type="text" id="admRoomStaffRoleInput" value="مشرف غرفة" style="width:120px;" />
              <button type="button" id="admAddRoomStaffBtn" class="btn-secondary btn-xs">➕ إضافة مشرف</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${(editRm.staff || []).map((st) => `
                <span class="rank-pill" style="background:#e2e8f0;color:#0f172a;">
                  ${escapeHtml(st.name)} (${escapeHtml(st.staffRole)})
                  <button type="button" class="btn-danger btn-xs del-rm-staff-btn" data-uid="${st.userId}" style="min-height:20px;padding:1px 6px;">✕</button>
                </span>
              `).join('') || '<span class="muted">لا يوجد مشرفون مخصصون لهذه الغرفة.</span>'}
            </div>
          ` : ''}
        </div>
        <div class="news-feed-list">
          ${(ov.rooms || []).map((r) => `
            <div class="admin-list-card">
              <div>
                <strong>${escapeHtml(r.icon)} ${escapeHtml(r.name)} ${r.hasPassword ? '🔒' : ''}</strong>
                <div class="muted">👥 ${r.onlineCount || 0} • 🔥 ${r.activity_points || 0} تفاعل ${r.owner_name ? `• 🗝️ ${escapeHtml(r.owner_name)}` : ''}</div>
              </div>
              <div class="inline-row">
                <button type="button" class="btn-secondary btn-xs edit-room-btn" data-rid="${escapeHtml(r.id)}">✏️ تعديل</button>
                ${r.id !== 'general' ? `<button type="button" class="btn-danger btn-xs del-room-btn" data-rid="${escapeHtml(r.id)}">حذف</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      $('admCancelRoomEditBtn')?.addEventListener('click', () => {
        state.editingRoomId = null;
        renderAdminTab('rooms');
      });

      $('admSaveRoomBtn').addEventListener('click', async () => {
        try {
          let wallpaperUrl = $('admRoomWallpaperUrl').value.trim();
          const wpFile = $('admRoomWallpaperFile').files[0];
          if (wpFile) {
            const fd = new FormData();
            fd.append('file', wpFile);
            const up = await api('/api/upload/wallpaper', { method: 'POST', body: fd });
            wallpaperUrl = up.url;
          }
          const payload = {
            name: $('admRoomName').value,
            description: $('admRoomDesc').value,
            icon: $('admRoomIcon').value.trim() || '💬',
            bgTheme: $('admRoomTheme').value,
            wallpaperUrl,
            ownerUserId: $('admRoomOwner').value ? Number($('admRoomOwner').value) : null,
            micsEnabled: $('admRoomMicsEnabled').checked
          };
          const passVal = $('admRoomPass').value;
          if (!isEditingRm || passVal.length > 0) {
            payload.roomPassword = passVal;
          }

          if (isEditingRm && editRm) {
            await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}`, { method: 'PUT', body: payload });
            state.editingRoomId = null;
            showToast('تم حفظ تعديلات الغرفة!');
          } else {
            await api('/api/admin/rooms', { method: 'POST', body: payload });
            showToast('تمت إضافة الغرفة!');
          }
          openAdminPanel('rooms');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      $('admAddRoomStaffBtn')?.addEventListener('click', async () => {
        if (!editRm) return;
        try {
          await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff`, {
            method: 'POST',
            body: {
              userId: Number($('admRoomStaffUserSel').value),
              staffRole: $('admRoomStaffRoleInput').value.trim() || 'مشرف غرفة'
            }
          });
          showToast('تم تعيين مشرف الغرفة!');
          openAdminPanel('rooms', editRm.id);
        } catch (err) {
          showToast(err.message, true);
        }
      });

      body.querySelectorAll('.del-rm-staff-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          if (!editRm) return;
          await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff/${b.dataset.uid}`, { method: 'DELETE' });
          openAdminPanel('rooms', editRm.id);
        });
      });

      body.querySelectorAll('.edit-room-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.editingRoomId = b.dataset.rid;
          renderAdminTab('rooms');
        });
      });

      body.querySelectorAll('.del-room-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/rooms/${encodeURIComponent(b.dataset.rid)}`, { method: 'DELETE' });
            if (state.editingRoomId === b.dataset.rid) state.editingRoomId = null;
            openAdminPanel('rooms');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      return;
    }

    if (tab === 'news') {
      const canPub = isOwner || hasPerm('publish_news');
      body.innerHTML = `
        <div class="news-composer">
          <strong>📰 نشر خبر جديد من لوحة التحكم</strong>
          <input type="text" id="admNewsTitle" placeholder="عنوان الخبر" />
          <textarea id="admNewsContent" rows="3" placeholder="تفاصيل الخبر..."></textarea>
          <div class="inline-row">
            <input type="file" id="admNewsFile" accept="image/*" />
            <button type="button" id="admNewsPublishBtn" class="btn-primary btn-sm" ${!canPub ? 'disabled' : ''}>🚀 نشر</button>
          </div>
        </div>
        <div class="news-feed-list">
          ${(ov.news || []).map((n) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(n.title)}</strong><div class="muted">${escapeHtml(n.content.slice(0, 90))}</div></div>
              <button type="button" class="btn-danger btn-xs adm-del-news-btn" data-nid="${n.id}">حذف</button>
            </div>
          `).join('') || '<div class="muted">لا توجد أخبار.</div>'}
        </div>
      `;

      $('admNewsPublishBtn').addEventListener('click', async () => {
        try {
          let imageUrl = '';
          const file = $('admNewsFile').files[0];
          if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const up = await api('/api/upload/news', { method: 'POST', body: fd });
            imageUrl = up.url;
          }
          await api('/api/news', {
            method: 'POST',
            body: { title: $('admNewsTitle').value, content: $('admNewsContent').value, imageUrl }
          });
          showToast('تم نشر الخبر!');
          openAdminPanel('news');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      body.querySelectorAll('.adm-del-news-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/news/${b.dataset.nid}`, { method: 'DELETE' });
          openAdminPanel('news');
        });
      });
      return;
    }

    if (tab === 'cms') {
      const s = ov.settings || {};
      body.innerHTML = `
        <div class="news-composer">
          <div class="form-grid-2">
            <div><label>اسم الموقع</label><input type="text" id="cmsSiteName" value="${escapeHtml(s.site_name || '')}" /></div>
            <div><label>وصف الموقع</label><input type="text" id="cmsSiteDesc" value="${escapeHtml(s.site_description || '')}" /></div>
            <div><label>لون الشريط العلوي</label><input type="color" id="cmsTopColor" value="${escapeHtml(s.top_bar_color || '#1a45e5')}" /></div>
            <div><label>لون الشريط السفلي</label><input type="color" id="cmsBotColor" value="${escapeHtml(s.bottom_bar_color || '#1a45e5')}" /></div>
            <div><label>لون الأزرار</label><input type="color" id="cmsBtnColor" value="${escapeHtml(s.button_color || '#f59e0b')}" /></div>
            <div><label>حجم الخط (px)</label><input type="number" id="cmsFontSize" value="${s.font_size || 15}" min="12" max="22" /></div>
          </div>
          <label>CSS مخصص للموقع</label>
          <textarea id="cmsCustomCss" rows="3">${escapeHtml(s.custom_css || '')}</textarea>
          <label>شريط HTML علوي مخصص</label>
          <textarea id="cmsCustomHtml" rows="2">${escapeHtml(s.custom_html || '')}</textarea>
          <button type="button" id="cmsSaveBtn" class="btn-primary">💾 حفظ وتحديث المظهر فوراً</button>
        </div>
      `;
      $('cmsSaveBtn').addEventListener('click', async () => {
        try {
          await api('/api/admin/settings', {
            method: 'PUT',
            body: {
              site_name: $('cmsSiteName').value,
              site_description: $('cmsSiteDesc').value,
              top_bar_color: $('cmsTopColor').value,
              bottom_bar_color: $('cmsBotColor').value,
              button_color: $('cmsBtnColor').value,
              font_size: Number($('cmsFontSize').value),
              custom_css: $('cmsCustomCss').value,
              custom_html: $('cmsCustomHtml').value
            }
          });
          showToast('تم حفظ إعدادات المظهر!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
      return;
    }

    if (tab === 'emojis') {
      body.innerHTML = `
        <div class="news-composer">
          <strong>➕ إضافة إيموجي / ملصق مخصص</strong>
          <div class="inline-row">
            <input type="text" id="admEmojiCode" placeholder="الكود مثال: :وردة:" />
            <input type="file" id="admEmojiFile" accept="image/*" />
            <button type="button" id="admAddEmojiBtn" class="btn-primary btn-sm">رفع وإضافة</button>
          </div>
        </div>
        <div class="received-gifts-grid">
          ${(ov.emojis || []).map((e) => `
            <div class="addon-card">
              <img src="${escapeHtml(e.image_url)}" style="width:38px;height:38px;object-fit:contain;" alt="" />
              <strong>${escapeHtml(e.code)}</strong>
              <button type="button" class="btn-danger btn-xs del-em-btn" data-eid="${e.id}">حذف</button>
            </div>
          `).join('')}
        </div>
      `;
      $('admAddEmojiBtn').addEventListener('click', async () => {
        try {
          const file = $('admEmojiFile').files[0];
          if (!file) return showToast('اختر صورة الملصق أولاً.', true);
          const fd = new FormData();
          fd.append('file', file);
          const up = await api('/api/upload/emoji', { method: 'POST', body: fd });
          await api('/api/admin/emojis', { method: 'POST', body: { code: $('admEmojiCode').value, imageUrl: up.url } });
          showToast('تمت إضافة الملصق!');
          openAdminPanel('emojis');
        } catch (err) {
          showToast(err.message, true);
        }
      });
      body.querySelectorAll('.del-em-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/admin/emojis/${b.dataset.eid}`, { method: 'DELETE' });
          openAdminPanel('emojis');
        });
      });
      return;
    }

    if (tab === 'bans') {
      body.innerHTML = `
        <h4 class="sub-heading">🚫 قائمة المحظورين</h4>
        <div class="news-feed-list">
          ${(ov.bans || []).map((b) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(b.target_name)}</strong><div class="muted">السبب: ${escapeHtml(b.reason)}</div></div>
              <button type="button" class="btn-secondary btn-xs unban-btn" data-bk="${escapeHtml(b.target_key)}">فك الحظر</button>
            </div>
          `).join('') || '<div class="muted">لا يوجد محظورون.</div>'}
        </div>
        <h4 class="sub-heading">🚨 البلاغات الواردة</h4>
        <div class="news-feed-list">
          ${(ov.reports || []).map((r) => `
            <div class="admin-list-card">
              <div><strong>المبلّغ عنه: ${escapeHtml(r.target_name)}</strong><div class="muted">من ${escapeHtml(r.reporter_name)}: ${escapeHtml(r.reason)}</div></div>
            </div>
          `).join('') || '<div class="muted">لا توجد بلاغات.</div>'}
        </div>
      `;
      body.querySelectorAll('.unban-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/admin/ban/${encodeURIComponent(b.dataset.bk)}`, { method: 'DELETE' });
          openAdminPanel('bans');
        });
      });
      return;
    }

    if (tab === 'owner_suite') {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">هذا القسم حصري لصاحب الموقع فقط.</div>';
        return;
      }
      const suite = state.ownerSuite || {};
      const sub = state.activeOwnerSubTab || 'surveillance';
      const prot = suite.protections || {};
      const roomOpts = (ov.rooms || state.rooms || [])
        .map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}${r.is_frozen ? ' ❄️' : ''}</option>`)
        .join('');
      const targetOpts = [
        ...(suite.users || []).filter((u) => !u.isSupremeOwner).map((u) => ({
          key: u.key,
          label: `${u.displayName} (@${u.username})${u.isShadowMuted ? ' [صامت]' : ''}${u.isFrozen ? ' [مجمد]' : ''}`
        })),
        ...(suite.liveSockets || []).filter((s) => s.isGuest).map((s) => ({
          key: s.key,
          label: `زائر: ${s.name}${s.isShadowMuted ? ' [صامت]' : ''}${s.isFrozen ? ' [مجمد]' : ''}`
        }))
      ].map((t) => `<option value="${escapeHtml(t.key)}">${escapeHtml(t.label)}</option>`).join('');

      body.innerHTML = `
        <div class="owner-subtabs-bar">
          <button type="button" class="owner-subtab-btn ${sub === 'surveillance' ? 'active' : ''}" data-owner-sub="surveillance"><i class="fa-solid fa-eye"></i> المراقبة والسجلات</button>
          <button type="button" class="owner-subtab-btn ${sub === 'moderation' ? 'active' : ''}" data-owner-sub="moderation"><i class="fa-solid fa-shield-halved"></i> التحكم والحماية</button>
          <button type="button" class="owner-subtab-btn ${sub === 'engagement' ? 'active' : ''}" data-owner-sub="engagement"><i class="fa-solid fa-bolt"></i> التنشيط والألعاب</button>
        </div>

        <div id="ownerSub_surveillance" class="${sub === 'surveillance' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-user-secret"></i> رادار المتخفين والشبح والكتم الصامت (${(suite.hiddenOnline || []).length})</h4>
            ${(suite.hiddenOnline || []).length ? (suite.hiddenOnline || []).map((h) => `
              <div class="admin-list-card">
                <div>
                  <strong>${escapeHtml(h.name)}</strong>
                  <div class="muted">${escapeHtml(h.roomName || h.roomId)} • ${h.isStealth ? 'تخفي ' : ''}${h.isGhosted ? 'شبح ' : ''}${h.isShadowMuted ? 'كتم صامت' : ''}</div>
                </div>
                <span class="muted">${escapeHtml(h.ipAddress || '')}</span>
              </div>
            `).join('') : '<div class="muted">لا يوجد متخفون حالياً.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-network-wired"></i> فحص المتصلين والـ IP والأجهزة (${(suite.liveSockets || []).length})</h4>
            ${(suite.liveSockets || []).map((s) => `
              <div class="admin-list-card">
                <div style="min-width:0;flex:1;">
                  <strong>${escapeHtml(s.name)} (${escapeHtml(s.role)})</strong>
                  <div class="muted">${escapeHtml(s.roomName || s.roomId)} • IP: ${escapeHtml(s.ipAddress || '—')} • جهاز: ${escapeHtml((s.deviceId || '').slice(0, 14))}</div>
                </div>
                ${s.role !== 'site_owner' ? `<button type="button" class="btn-danger btn-xs owner-ban-ip-btn" data-ip="${escapeHtml(s.ipAddress || '')}" data-dev="${escapeHtml(s.deviceId || '')}" data-tk="${escapeHtml(s.key)}"><i class="fa-solid fa-ban"></i> حظر IP/جهاز</button>` : ''}
              </div>
            `).join('') || '<div class="muted">لا يوجد متصلون.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-users-viewfinder"></i> كاشف الحسابات المتعددة (Multi-Account) (${(suite.multiAccounts || []).length})</h4>
            ${(suite.multiAccounts || []).length ? (suite.multiAccounts || []).map((m) => `
              <div class="admin-list-card">
                <div>
                  <strong>${escapeHtml(m.type)}: ${escapeHtml(m.fingerprint)}</strong>
                  <div class="muted">${(m.accounts || []).map((a) => escapeHtml(a.displayName)).join(' ، ')}</div>
                </div>
              </div>
            `).join('') : '<div class="muted">لا توجد حسابات متعددة متطابقة حالياً.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-clock-rotate-left"></i> سجل تغيير الأسماء للأعضاء</h4>
            ${(suite.users || []).filter((u) => (u.nameHistory || []).length).map((u) => `
              <div class="admin-list-card">
                <div>
                  <strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</strong>
                  <div class="muted">الأسماء السابقة: ${(u.nameHistory || []).map((h) => escapeHtml(h.name)).join(' ← ')}</div>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد تغييرات أسماء مسجلة.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-link"></i> رادار روابط الرسائل الخاصة (${(suite.pmLinkAlerts || []).length})</h4>
            ${(suite.pmLinkAlerts || []).slice(0, 20).map((al) => `
              <div class="admin-list-card">
                <div>
                  <strong>من ${escapeHtml(al.fromName)} ← إلى ${escapeHtml(al.toName)}</strong>
                  <div class="muted">${escapeHtml(al.content)}</div>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد روابط مشبوهة في الخاص.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-clipboard-list"></i> سجل الرقابة الإدارية (Audit Log)</h4>
            ${(suite.adminLogs || []).slice(0, 30).map((lg) => `
              <div class="admin-list-card">
                <div>
                  <strong>${escapeHtml(lg.action)} — بواسطة ${escapeHtml(lg.actor_name)}</strong>
                  <div class="muted">${escapeHtml(lg.target_name || lg.target_key || '')} ${lg.details ? `• ${escapeHtml(lg.details)}` : ''}</div>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد سجلات رقابة بعد.</div>'}
          </div>
        </div>

        <div id="ownerSub_moderation" class="${sub === 'moderation' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-gavel"></i> ردع وتحكم فوري بالأعضاء</h4>
            <select id="ownerModTargetSel">${targetOpts || '<option value="">لا يوجد أعضاء</option>'}</select>
            <div class="inline-row" style="flex-wrap:wrap;">
              <button type="button" id="ownerShadowMuteOnBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-user-ninja"></i> كتم صامت</button>
              <button type="button" id="ownerShadowMuteOffBtn" class="btn-secondary btn-xs">فك الكتم الصامت</button>
              <button type="button" id="ownerFreezeUserOnBtn" class="btn-danger btn-xs"><i class="fa-solid fa-snowflake"></i> تجميد تام</button>
              <button type="button" id="ownerFreezeUserOffBtn" class="btn-secondary btn-xs">فك التجميد</button>
            </div>
            <div class="inline-row" style="flex-wrap:wrap;">
              <select id="ownerMoveDestRoomSel" style="flex:1">${roomOpts}</select>
              <button type="button" id="ownerMoveUserBtn" class="btn-primary btn-xs"><i class="fa-solid fa-right-left"></i> سحب ونقل للغرفة</button>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-door-closed"></i> تحكم فوري بالغرف والمايكات</h4>
            <select id="ownerRoomCtrlSel">${roomOpts}</select>
            <div class="inline-row" style="flex-wrap:wrap;">
              <button type="button" id="ownerFreezeRoomOnBtn" class="btn-danger btn-xs"><i class="fa-solid fa-snowflake"></i> تجميد الغرفة (قراءة فقط)</button>
              <button type="button" id="ownerFreezeRoomOffBtn" class="btn-secondary btn-xs">فك تجميد الغرفة</button>
              <button type="button" id="ownerMuteAllMicsBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-microphone-slash"></i> كتم كل المايكات</button>
              <button type="button" id="ownerClearRoomBtn" class="btn-danger btn-xs"><i class="fa-solid fa-broom"></i> تنظيف الغرفة</button>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-shield"></i> جدار الحماية والكلمات الممنوعة</h4>
            <label class="switch-label"><input type="checkbox" id="ownerLockGuestImgToggle" ${prot.lock_guest_images ? 'checked' : ''} /><span>منع الزوار من إرسال الصور والملفات</span></label>
            <label class="switch-label"><input type="checkbox" id="ownerBlockVpnToggle" ${prot.block_vpn ? 'checked' : ''} /><span>حظر دخول شبكات VPN / Proxy (يُستثنى المالك)</span></label>
            <label class="muted">الكلمات الممنوعة (افصل بفاصلة , أو سطر جديد):</label>
            <textarea id="ownerBannedWordsInput" rows="3">${escapeHtml((prot.banned_words || []).join('، '))}</textarea>
            <button type="button" id="ownerSaveProtBtn" class="btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> حفظ إعدادات الحماية</button>
          </div>
        </div>

        <div id="ownerSub_engagement" class="${sub === 'engagement' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-bullhorn"></i> إعلان إداري عاجل (كل الغرف)</h4>
            <input type="text" id="ownerBroadcastTitle" value="📢 إعلان إداري عاجل" placeholder="عنوان الإعلان" />
            <textarea id="ownerBroadcastMsg" rows="2" placeholder="اكتب نص الإعلان العاجل ليظهر للجميع..."></textarea>
            <button type="button" id="ownerBroadcastBtn" class="btn-primary btn-sm"><i class="fa-solid fa-rocket"></i> بث عاجل للجميع</button>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-masks-theater"></i> الإرسال باسم النظام أو عضو آخر</h4>
            <div class="form-grid-2">
              <select id="ownerSendAsRoom">${roomOpts}</select>
              <select id="ownerSendAsMode">
                <option value="system">🛡️ باسم النظام الرسمي</option>
                <option value="user">🎭 انتحال/نيابة عن عضو</option>
              </select>
            </div>
            <select id="ownerSendAsTarget">${targetOpts || '<option value="">اختر عضواً</option>'}</select>
            <input type="text" id="ownerSendAsText" placeholder="اكتب نص الرسالة..." />
            <button type="button" id="ownerSendAsBtn" class="btn-secondary btn-sm"><i class="fa-solid fa-paper-plane"></i> إرسال الرسالة</button>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-thumbtack"></i> رسالة ملكية مثبتة أعلى الغرفة</h4>
            <select id="ownerPinRoomSel">${roomOpts}</select>
            <input type="text" id="ownerPinText" placeholder="نص الرسالة المثبتة (اتركه فارغاً لإزالة التثبيت)" />
            <button type="button" id="ownerPinBtn" class="btn-primary btn-xs"><i class="fa-solid fa-thumbtack"></i> حفظ التثبيت الملكي</button>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-coins"></i> المطر الذهبي وبوت المسابقات</h4>
            <div class="form-grid-2">
              <select id="ownerRainRoomSel"><option value="all">🌟 جميع الغرف</option>${roomOpts}</select>
              <input type="number" id="ownerRainAmount" value="100" min="10" max="10000" placeholder="عملات لكل عضو" />
            </div>
            <button type="button" id="ownerRainBtn" class="btn-primary btn-sm"><i class="fa-solid fa-cloud-showers-heavy"></i> إطلاق مطر العملات الذهبية</button>
            <hr style="border:none;border-top:1px solid #cbd5e1;" />
            <div class="form-grid-2">
              <select id="ownerQuizRoomSel">${roomOpts}</select>
              <input type="number" id="ownerQuizReward" value="100" min="10" max="2000" placeholder="جائزة السؤال" />
            </div>
            <div class="inline-row">
              <button type="button" id="ownerQuizStartBtn" class="btn-primary btn-xs"><i class="fa-solid fa-play"></i> تشغيل بوت المسابقات</button>
              <button type="button" id="ownerQuizStopBtn" class="btn-danger btn-xs"><i class="fa-solid fa-stop"></i> إيقاف البوت</button>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-box-open"></i> صندوق الحظ اليومي، عداد التواجد، ومكافآت الدعوة</h4>
            <label class="switch-label"><input type="checkbox" id="ownerLuckyEnabled" ${prot.lucky_box_enabled !== 0 ? 'checked' : ''} /><span>تفعيل صندوق الحظ اليومي</span></label>
            <div class="form-grid-2">
              <div><label class="muted">أقل جائزة</label><input type="number" id="ownerLuckyMin" value="${Number(prot.lucky_box_min) || 50}" min="10" /></div>
              <div><label class="muted">أكبر جائزة</label><input type="number" id="ownerLuckyMax" value="${Number(prot.lucky_box_max) || 500}" min="10" /></div>
              <div><label class="muted">تعزيز وهمي لعداد المتواجدين (+)</label><input type="number" id="ownerOnlineBoost" value="${Number(prot.online_boost) || 0}" min="0" max="5000" /></div>
              <div><label class="muted">مكافأة رابط الدعوة</label><input type="number" id="ownerRefBonus" value="${Number(prot.referral_bonus) || 200}" min="0" max="10000" /></div>
            </div>
            <button type="button" id="ownerSaveBoostsBtn" class="btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> حفظ إعدادات التنشيط</button>
          </div>
        </div>
      `;

      body.querySelectorAll('.owner-subtab-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.activeOwnerSubTab = b.dataset.ownerSub;
          renderAdminTab('owner_suite');
        });
      });

      const runOwnerAct = async (payload, okMsg) => {
        try {
          await api('/api/owner/action', { method: 'POST', body: payload });
          showToast(okMsg);
          openAdminPanel('owner_suite');
        } catch (err) {
          showToast(err.message, true);
        }
      };

      body.querySelectorAll('.owner-ban-ip-btn').forEach((b) => {
        b.addEventListener('click', () => {
          if (!confirm('حظر هذا الجهاز وعنوان IP نهائياً؟')) return;
          runOwnerAct({ action: 'ban_ip', ipAddress: b.dataset.ip, deviceId: b.dataset.dev, targetKey: b.dataset.tk }, 'تم حظر IP والجهاز بنجاح.');
        });
      });

      $('ownerShadowMuteOnBtn')?.addEventListener('click', () => runOwnerAct({ action: 'shadow_mute', targetKey: $('ownerModTargetSel').value, enabled: true }, 'تم تطبيق الكتم الصامت.'));
      $('ownerShadowMuteOffBtn')?.addEventListener('click', () => runOwnerAct({ action: 'shadow_mute', targetKey: $('ownerModTargetSel').value, enabled: false }, 'تم إلغاء الكتم الصامت.'));
      $('ownerFreezeUserOnBtn')?.addEventListener('click', () => runOwnerAct({ action: 'freeze_user', targetKey: $('ownerModTargetSel').value, enabled: true }, 'تم تجميد العضو تاماً.'));
      $('ownerFreezeUserOffBtn')?.addEventListener('click', () => runOwnerAct({ action: 'freeze_user', targetKey: $('ownerModTargetSel').value, enabled: false }, 'تم فك تجميد العضو.'));
      $('ownerMoveUserBtn')?.addEventListener('click', () => runOwnerAct({ action: 'move_user', targetKey: $('ownerModTargetSel').value, toRoomId: $('ownerMoveDestRoomSel').value }, 'تم نقل العضو للغرفة المحددة.'));

      $('ownerFreezeRoomOnBtn')?.addEventListener('click', () => runOwnerAct({ action: 'freeze_room', roomId: $('ownerRoomCtrlSel').value, enabled: true }, 'تم تجميد الغرفة.'));
      $('ownerFreezeRoomOffBtn')?.addEventListener('click', () => runOwnerAct({ action: 'freeze_room', roomId: $('ownerRoomCtrlSel').value, enabled: false }, 'تم فك تجميد الغرفة.'));
      $('ownerMuteAllMicsBtn')?.addEventListener('click', () => runOwnerAct({ action: 'mute_all_mics', roomId: $('ownerRoomCtrlSel').value }, 'تم كتم جميع المايكات بالملكية.'));
      $('ownerClearRoomBtn')?.addEventListener('click', () => {
        if (confirm('تنظيف جميع رسائل هذه الغرفة؟')) runOwnerAct({ action: 'clear_room', roomId: $('ownerRoomCtrlSel').value }, 'تم تنظيف الغرفة.');
      });

      $('ownerSaveProtBtn')?.addEventListener('click', () => {
        const words = String($('ownerBannedWordsInput').value || '')
          .split(/[\n,،]+/)
          .map((w) => w.trim())
          .filter(Boolean);
        runOwnerAct({
          action: 'update_protections',
          protections: {
            lock_guest_images: $('ownerLockGuestImgToggle').checked ? 1 : 0,
            block_vpn: $('ownerBlockVpnToggle').checked ? 1 : 0,
            banned_words: words
          }
        }, 'تم حفظ إعدادات الحماية!');
      });

      $('ownerBroadcastBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'global_broadcast',
        title: $('ownerBroadcastTitle').value,
        content: $('ownerBroadcastMsg').value
      }, 'تم إرسال الإعلان العاجل لكل الغرف!'));

      $('ownerSendAsBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'send_as',
        roomId: $('ownerSendAsRoom').value,
        asMode: $('ownerSendAsMode').value,
        targetUserKey: $('ownerSendAsTarget').value,
        content: $('ownerSendAsText').value
      }, 'تم إرسال الرسالة!'));

      $('ownerPinBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'pin_message',
        roomId: $('ownerPinRoomSel').value,
        message: $('ownerPinText').value
      }, 'تم تحديث التثبيت الملكي.'));

      $('ownerRainBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'golden_rain',
        roomId: $('ownerRainRoomSel').value,
        amountPerUser: Number($('ownerRainAmount').value) || 100
      }, 'تم إطلاق المطر الذهبي!'));

      $('ownerQuizStartBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'quiz_bot',
        roomId: $('ownerQuizRoomSel').value,
        enabled: true,
        rewardCoins: Number($('ownerQuizReward').value) || 100
      }, 'تم تشغيل بوت المسابقات!'));

      $('ownerQuizStopBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'quiz_bot',
        roomId: $('ownerQuizRoomSel').value,
        enabled: false
      }, 'تم إيقاف بوت المسابقات.'));

      $('ownerSaveBoostsBtn')?.addEventListener('click', () => runOwnerAct({
        action: 'update_protections',
        protections: {
          lucky_box_enabled: $('ownerLuckyEnabled').checked ? 1 : 0,
          lucky_box_min: Number($('ownerLuckyMin').value) || 50,
          lucky_box_max: Number($('ownerLuckyMax').value) || 500,
          online_boost: Number($('ownerOnlineBoost').value) || 0,
          referral_bonus: Number($('ownerRefBonus').value) || 200
        }
      }, 'تم حفظ إعدادات التنشيط والمكافآت!'));
    }
  }

  function triggerGoldRainAnimation() {
    const overlay = document.createElement('div');
    overlay.className = 'gold-rain-overlay';
    for (let i = 0; i < 28; i += 1) {
      const coin = document.createElement('div');
      coin.className = 'gold-coin-drop';
      coin.textContent = i % 4 === 0 ? '👑' : '🪙';
      coin.style.left = `${Math.random() * 96}%`;
      coin.style.animationDelay = `${(Math.random() * 0.9).toFixed(2)}s`;
      overlay.appendChild(coin);
    }
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3800);
  }

  async function claimDailyLuckyBox() {
    if (!state.user || state.user.isGuest) {
      return showToast('صندوق الحظ اليومي متاح للأعضاء المسجلين فقط.', true);
    }
    try {
      const res = await api('/api/lucky-box/claim', { method: 'POST' });
      if (res?.user) {
        state.user = res.user;
        renderUserIdentity();
      }
      playNotificationChime('gift');
      triggerGoldRainAnimation();
      showToast(`🎁 مبروك! فتحت صندوق الحظ اليومي وحصلت على +${res.prize} عملة ذهبية!`);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ==========================================
  // SOCKET.IO REAL-TIME CONNECTION & 10s HEARTBEAT
  // ==========================================
  function connectSocket() {
    if (state.socket) {
      state.socket.disconnect();
      state.socket = null;
    }
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }

    const savedRoom = localStorage.getItem(ROOM_KEY) || 'general';
    const socket = io({
      auth: { token: state.token, roomId: savedRoom, deviceId: state.deviceId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    state.socket = socket;

    // 10-second continuous heartbeat
    state.heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { ts: Date.now() });
      }
    }, 10000);

    socket.on('connect_error', (err) => {
      if (String(err?.message || '').startsWith('BANNED:') || err?.message === 'AUTH_REQUIRED') {
        showToast(err.message, true);
        logoutUser();
      }
    });

    socket.on('init_state', (data) => {
      state.user = data.user;
      state.ranks = data.ranks || [];
      state.emojis = data.emojis || [];
      state.rooms = data.rooms || [];
      state.onlineUsers = data.onlineUsers || [];
      state.persistentMembers = data.persistentMembers || [];
      state.news = data.news || [];
      state.giftsCatalog = data.giftsCatalog || [];
      applySiteSettings(data.settings);
      updateNotificationBadge(data.unreadNotifCount || 0);
      renderUserIdentity();

      if (!state.deepLinkHandled) {
        state.deepLinkHandled = true;
        const pKey = new URLSearchParams(window.location.search).get('profile');
        if (pKey) {
          const found =
            state.onlineUsers.find((x) => x.key === pKey) ||
            state.persistentMembers.find((x) => x.key === pKey);
          if (found) openQuickUserModal(found);
        }
      }
    });

    socket.on('session_updated', ({ user }) => {
      state.user = user;
      renderUserIdentity();
    });

    socket.on('room_joined', (data) => {
      state.currentRoom = data.room;
      state.isRoomManager = Boolean(data.isRoomManager);
      state.roomKingKey = data.roomKingKey || null;
      state.messages = data.messages || [];
      state.mics = data.mics || [];
      state.roomUsers = data.users || [];
      localStorage.setItem(ROOM_KEY, data.room.id);
      renderRoomBanner();
      renderMics();
      renderAllMessages();
      renderRoomUsers();
      renderUserIdentity();
    });

    socket.on('room_users', ({ roomId, users, roomKingKey }) => {
      if (state.currentRoom?.id === roomId) {
        const kingChanged = roomKingKey !== undefined && roomKingKey !== state.roomKingKey;
        if (roomKingKey !== undefined) state.roomKingKey = roomKingKey;
        state.roomUsers = users || [];
        renderRoomUsers();
        if (kingChanged) renderAllMessages();
      }
    });

    socket.on('rooms_list', (rooms) => {
      state.rooms = rooms || [];
      if (state.currentRoom) {
        const fresh = state.rooms.find((r) => r.id === state.currentRoom.id);
        if (fresh) {
          state.currentRoom = fresh;
          renderRoomBanner();
        }
      }
    });

    socket.on('online_users_global', (list) => {
      state.onlineUsers = list || [];
    });

    socket.on('persistent_members', (list) => {
      state.persistentMembers = list || [];
    });

    socket.on('new_message', (msg) => {
      if (state.currentRoom?.id === msg.room_id) {
        appendOrReconcileMessage(msg);
      }
    });

    socket.on('room_notice', (data) => {
      if (state.currentRoom?.id === data?.roomId) appendRoomNotice(data);
    });

    socket.on('message_deleted', ({ roomId, msgId }) => {
      if (state.currentRoom?.id !== roomId) return;
      state.messages = state.messages.filter((m) => String(m.id) !== String(msgId));
      const el = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(String(msgId))}"]`);
      if (el) el.remove();
    });

    socket.on('room_cleared', ({ roomId, byName }) => {
      if (state.currentRoom?.id === roomId) {
        state.messages = [];
        renderAllMessages();
        appendRoomNotice(`🧹 تم مسح رسائل الغرفة بواسطة ${byName}`);
      }
    });

    socket.on('room_updated', (rm) => {
      if (state.currentRoom?.id === rm.id) {
        state.currentRoom = rm;
        renderRoomBanner();
      }
    });

    socket.on('room_youtube_updated', (yt) => {
      if (state.currentRoom?.id === yt.roomId) {
        state.currentRoom.youtube_video_id = yt.youtubeVideoId || '';
        state.currentRoom.youtube_title = yt.youtubeTitle || '';
        state.currentRoom.youtube_is_playing = yt.youtubeIsPlaying ? 1 : 0;
        renderRoomYoutubeBar();
      }
    });

    socket.on('mic_state', ({ roomId, slots }) => {
      if (state.currentRoom?.id === roomId) {
        state.mics = slots || [];
        renderMics();
      }
    });

    socket.on('mic_force_mute', ({ muted }) => {
      state.isSelfMicMuted = Boolean(muted);
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((t) => {
          t.enabled = !state.isSelfMicMuted;
        });
      }
      renderMics();
      showToast(muted ? 'تم كتم المايك الخاص بك من الإدارة.' : 'تم فتح المايك الخاص بك.', muted);
    });

    socket.on('mic_kicked', ({ byName }) => {
      stopLocalMicStream();
      closeAllMicPeers();
      showToast(`تم إنزالك من المايك بواسطة ${byName}.`, true);
    });

    // WebRTC Signaling Events
    socket.on('mic_webrtc_peer_ready', async ({ fromSocketId, slot }) => {
      if (!fromSocketId || fromSocketId === socket.id) return;
      try {
        const pc = createPeerConnection(fromSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('mic_webrtc_offer', { toSocketId: fromSocketId, sdp: offer, slot });
      } catch {
        // ignore WebRTC error
      }
    });

    socket.on('mic_webrtc_offer', async ({ fromSocketId, sdp }) => {
      if (!fromSocketId || !sdp) return;
      try {
        const pc = createPeerConnection(fromSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('mic_webrtc_answer', { toSocketId: fromSocketId, sdp: answer });
      } catch {
        // ignore
      }
    });

    socket.on('mic_webrtc_answer', async ({ fromSocketId, sdp }) => {
      const pc = state.micPeers.get(fromSocketId);
      if (!pc || !sdp) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch {
        // ignore
      }
    });

    socket.on('mic_webrtc_ice', async ({ fromSocketId, candidate }) => {
      const pc = state.micPeers.get(fromSocketId);
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore
      }
    });

    socket.on('gift_celebration', (tx) => {
      showGiftCelebration(tx);
    });

    socket.on('gift_received', ({ tx, gift }) => {
      showGiftCelebration(tx);
      showToast(`🎁 استلمت هدية ${gift.emoji} ${gift.name} من ${tx.from_name}!`);
    });

    socket.on('new_notification', (notif) => {
      updateNotificationBadge(notif.unreadCount !== undefined ? notif.unreadCount : (state.social.unreadNotifCount + 1));
      playNotificationChime(notif.category === 'gift' ? 'gift' : 'notif');
      showToast(`${notif.title}: ${notif.body}`);
    });

    socket.on('mention_alert', ({ fromName, content }) => {
      playNotificationChime('mention');
      showToast(`🔔 نداء من ${fromName}: ${content}`);
    });

    socket.on('wall_updated', ({ post }) => {
      if (!post) return;
      const list = state.social.wallPosts || [];
      const idx = list.findIndex((x) => Number(x.id) === Number(post.id));
      if (idx >= 0) list[idx] = post;
      else list.unshift(post);
      state.social.wallPosts = list;
      if (state.activeSlideDrawer === 'wall' && $('slideSheetDrawer')?.classList.contains('open')) {
        renderWallFeedInto($('slideSheetBody'));
      }
    });

    socket.on('wall_deleted', ({ id }) => {
      state.social.wallPosts = (state.social.wallPosts || []).filter((x) => Number(x.id) !== Number(id));
      if (state.activeSlideDrawer === 'wall' && $('slideSheetDrawer')?.classList.contains('open')) {
        renderWallFeedInto($('slideSheetBody'));
      }
    });

    socket.on('new_pm', (pm) => {
      state.social.privateMessages = [pm, ...(state.social.privateMessages || [])];
      updateFriendAndPmBadges();
      if (pm.from_key !== state.user?.key) {
        playNotificationChime('notif');
        showToast(`✉️ رسالة خاصة من ${pm.from_name}`);
      }
      if (state.activeSlideDrawer === 'pm' && $('slideSheetDrawer')?.classList.contains('open')) {
        openSlideSheetDrawer('pm', state.activeSlidePmTarget);
      }
    });

    socket.on('news_added', (item) => {
      state.news = [item, ...state.news.filter((x) => x.id !== item.id)];
      if (!$('newsModal').classList.contains('hidden')) renderNewsFeed();
    });

    socket.on('news_deleted', ({ id }) => {
      state.news = state.news.filter((x) => x.id !== id);
      if (!$('newsModal').classList.contains('hidden')) renderNewsFeed();
    });

    socket.on('ranks_updated', (ranks) => {
      state.ranks = ranks || [];
      renderUserIdentity();
      renderRoomUsers();
      renderAllMessages();
    });

    socket.on('emojis_updated', (emojis) => {
      state.emojis = emojis || [];
      renderEmojiPopoverGrid();
    });

    socket.on('site_settings_updated', (settings) => {
      applySiteSettings(settings);
    });

    socket.on('user_typing', ({ roomId, userKey, name, isTyping }) => {
      if (state.currentRoom?.id !== roomId || userKey === state.user?.key) return;
      $('typingIndicator').textContent = isTyping ? `✍️ ${name} يكتب الآن...` : '';
      $('typingIndicator').classList.toggle('hidden', !isTyping);
    });

    socket.on('kicked', ({ reason }) => {
      showToast(reason || 'تم طردك.', true);
      logoutUser();
    });

    socket.on('royal_entrance', ({ name }) => {
      playNotificationChime('gift');
      showToast(`👑 تشريف ملكي: دخل المالك "${name}" إلى الغرفة!`);
    });

    socket.on('global_urgent_broadcast', ({ title, content, byName }) => {
      playNotificationChime('mention');
      const bar = $('urgentBroadcastBar');
      if (bar) {
        bar.classList.remove('hidden');
        bar.innerHTML = `
          <div style="min-width:0;flex:1;"><i class="fa-solid fa-bullhorn"></i> <strong>${escapeHtml(title || 'إعلان عاجل')}:</strong> ${escapeHtml(content || '')} <span style="opacity:0.85;">(${escapeHtml(byName || 'الإدارة')})</span></div>
          <button type="button" id="closeUrgentBroadcastBtn" class="yt-mini-btn"><i class="fa-solid fa-xmark"></i></button>
        `;
        $('closeUrgentBroadcastBtn')?.addEventListener('click', () => bar.classList.add('hidden'));
      }
      showToast(`📢 ${title}: ${content}`);
    });

    socket.on('golden_rain_event', ({ amount, byName }) => {
      playNotificationChime('gift');
      triggerGoldRainAnimation();
      showToast(`🪙 أمطر المالك "${byName}" الغرفة بـ +${amount} عملة ذهبية للجميع!`);
    });

    socket.on('user_frozen_state', ({ isFrozen }) => {
      if (state.user) state.user.isFrozen = Boolean(isFrozen);
      renderUserIdentity();
      showToast(isFrozen ? '❄️ تم تجميد حسابك مؤقتاً (قراءة فقط).' : '🔥 تم فك التجميد عن حسابك.', Boolean(isFrozen));
    });

    socket.on('owner_pm_link_alert', (al) => {
      playNotificationChime('mention');
      showToast(`🔗 رادار الخاص: أرسل ${al.fromName} رابطاً إلى ${al.toName}`);
    });

    socket.on('error_toast', ({ message }) => {
      if (message) showToast(message, true);
    });
  }

  function enterApp(user, token) {
    state.user = user;
    state.token = token;
    localStorage.setItem(TOKEN_KEY, token);
    $('authView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    connectSocket();
  }

  function logoutUser() {
    stopLocalMicStream();
    closeAllMicPeers();
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    if (state.socket) state.socket.disconnect();
    state.socket = null;
    state.user = null;
    state.token = '';
    localStorage.removeItem(TOKEN_KEY);
    $('appView').classList.add('hidden');
    $('authView').classList.remove('hidden');
  }

  function renderEmojiPopoverGrid() {
    const grid = $('emojiPopoverGrid');
    if (!grid) return;
    const tab = state.activeEmojiTab || 'faces';

    if (tab === 'arabic_stickers') {
      grid.innerHTML = (EMOJI_CATEGORIES.arabic_stickers || []).map((st) => `
        <button type="button" class="sticker-arabic-chip" data-ins="${escapeHtml(st)}">${escapeHtml(st)}</button>
      `).join('');
      grid.querySelectorAll('.sticker-arabic-chip').forEach((b) => {
        b.addEventListener('click', () => {
          $('messageInput').value += `${b.dataset.ins} `;
          $('messageInput').focus();
          $('emojiPopover').classList.add('hidden');
        });
      });
      return;
    }

    if (tab === 'animated') {
      grid.innerHTML = ANIMATED_STICKERS.map((st) => `
        <button type="button" class="emoji-pick-btn sticker-pick-btn" data-sticker-id="${escapeHtml(st.id)}" data-sticker-glyph="${escapeHtml(st.glyph)}" data-sticker-label="${escapeHtml(st.label)}" title="${escapeHtml(st.label)}">
          <span class="sticker-anim-float">${st.glyph}</span>
        </button>
      `).join('');
      grid.querySelectorAll('.sticker-pick-btn').forEach((b) => {
        b.addEventListener('click', () => {
          if (!state.socket || !state.currentRoom) return;
          const payloadStr = `${b.dataset.stickerGlyph} ${b.dataset.stickerLabel}`;
          const clientMsgId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          state.socket.emit('send_message', { msgType: 'sticker', content: payloadStr, clientMsgId }, (res) => {
            if (res?.error) showToast(res.error, true);
          });
          $('emojiPopover').classList.add('hidden');
        });
      });
      return;
    }

    if (tab === 'custom') {
      grid.innerHTML = state.emojis.length
        ? state.emojis.map((e) => `<button type="button" class="emoji-pick-btn" data-ins="${escapeHtml(e.code)}"><img src="${escapeHtml(e.image_url)}" alt="" /></button>`).join('')
        : '<div class="muted" style="grid-column:1/-1;text-align:center;">لا توجد ملصقات مخصصة.</div>';
    } else {
      const list = EMOJI_CATEGORIES[tab] || EMOJI_CATEGORIES.faces;
      grid.innerHTML = list.map((em) => `<button type="button" class="emoji-pick-btn" data-ins="${em}">${em}</button>`).join('');
    }

    grid.querySelectorAll('.emoji-pick-btn').forEach((b) => {
      b.addEventListener('click', () => {
        $('messageInput').value += `${b.dataset.ins} `;
        $('messageInput').focus();
      });
    });
  }

  // ==========================================
  // EVENT WIRING
  // ==========================================
  function bindEvents() {
    document.querySelectorAll('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.authTab;
        document.querySelectorAll('.auth-tab').forEach((b) => b.classList.toggle('active', b === btn));
        $('loginForm').classList.toggle('hidden', t !== 'login');
        $('registerForm').classList.toggle('hidden', t !== 'register');
        $('guestForm').classList.toggle('hidden', t !== 'guest');
        $('authError').classList.add('hidden');
      });
    });

    $('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await api('/api/login', {
          method: 'POST',
          body: { identifier: $('loginIdentifier').value, password: $('loginPassword').value }
        });
        enterApp(res.user, res.token);
      } catch (err) {
        $('authError').textContent = err.message;
        $('authError').classList.remove('hidden');
      }
    });

    $('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const invitedBy = localStorage.getItem(REF_KEY) || '';
        const res = await api('/api/register', {
          method: 'POST',
          body: { username: $('regUsername').value, email: $('regEmail').value, password: $('regPassword').value, invitedBy }
        });
        localStorage.removeItem(REF_KEY);
        enterApp(res.user, res.token);
      } catch (err) {
        $('authError').textContent = err.message;
        $('authError').classList.remove('hidden');
      }
    });

    $('guestForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await api('/api/guest', { method: 'POST', body: { name: $('guestName').value } });
        enterApp(res.user, res.token);
      } catch (err) {
        $('authError').textContent = err.message;
        $('authError').classList.remove('hidden');
      }
    });

    // Profile dropdown
    $('profileMenuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('profileDropdown').classList.toggle('hidden');
    });

    $('dropProfileBtn')?.addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('info');
    });

    $('dropCustomizeBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('more');
    });

    $('dropGiftsTabBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('gifts');
    });

    $('dropLuckyBoxBtn')?.addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      claimDailyLuckyBox();
    });

    $('dropOwnerSuiteBtn')?.addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openAdminPanel('owner_suite');
    });

    $('dropStealthBtn').addEventListener('click', async () => {
      $('profileDropdown').classList.add('hidden');
      const next = !state.user?.isStealth;
      try {
        const res = await api('/api/profile/stealth', { method: 'POST', body: { enabled: next } });
        state.user = res.user;
        renderUserIdentity();
        showToast(next ? 'تم تفعيل وضع التخفي بنجاح.' : 'تم إلغاء وضع التخفي.');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('dropAdminBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openAdminPanel('stats');
    });

    $('dropLogoutBtn').addEventListener('click', logoutUser);

    // Top quick icons
    $('topReportBtn')?.addEventListener('click', () => openSocialModal('report'));
    $('topNotifBtn')?.addEventListener('click', () => openSocialModal('notifications'));
    $('topFriendsBtn')?.addEventListener('click', () => openSocialModal('friends'));
    $('topPmBtn')?.addEventListener('click', () => openSlideSheetDrawer('pm'));
    $('goldRichBtn')?.addEventListener('click', () => openLeaderboardsModal('rich'));
    $('goldVipsBtn')?.addEventListener('click', () => openLeaderboardsModal('activeMembers'));

    // Sidebar & Slide-Over Drawers
    $('toggleUsersDrawerBtn')?.addEventListener('click', () => {
      closeSlideSheetDrawer();
      $('usersSidePanel')?.classList.toggle('open');
    });
    $('closeUsersSideBtn')?.addEventListener('click', () => $('usersSidePanel')?.classList.remove('open'));
    $('closeSlideSheetBtn')?.addEventListener('click', closeSlideSheetDrawer);
    $('footerFriendsBtn')?.addEventListener('click', () => openSocialModal('friends'));
    $('footerWallBtn')?.addEventListener('click', () => openSlideSheetDrawer('wall'));
    $('plusWallBtn')?.addEventListener('click', () => {
      $('plusDropdown')?.classList.add('hidden');
      openSlideSheetDrawer('wall');
    });
    $('quickImageUploadBtn')?.addEventListener('click', () => $('chatImageFileInput')?.click());
    $('quickTextStyleBtn')?.addEventListener('click', () => openCustomizeModal('more'));
    $('menuDrawerBtn')?.addEventListener('click', () => {
      closeSlideSheetDrawer();
      $('drawerBackdrop').classList.remove('hidden');
      $('mainDrawer').classList.remove('hidden');
    });
    const closeMainDrawer = () => {
      $('drawerBackdrop').classList.add('hidden');
      $('mainDrawer').classList.add('hidden');
    };
    $('closeMainDrawerBtn')?.addEventListener('click', closeMainDrawer);
    $('drawerBackdrop')?.addEventListener('click', closeMainDrawer);

    document.querySelectorAll('.drawer-item[data-drawer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.drawer;
        if (action === 'online') {
          $('drawerBodyContent').innerHTML = state.onlineUsers.map((u) => `
            <button type="button" class="user-row-card" style="margin-bottom:6px;" data-uk="${escapeHtml(u.key)}">
              ${formatAvatarHTML(u, 'sm')}
              <div class="user-row-info"><div class="user-row-name">${formatNameHTML(u)}</div><div class="muted">${escapeHtml(u.roomName || '')}</div></div>
            </button>
          `).join('') || '<div class="muted">لا يوجد متصلون.</div>';
          $('drawerBodyContent').querySelectorAll('.user-row-card').forEach((c) => {
            c.addEventListener('click', () => {
              const found = state.onlineUsers.find((x) => x.key === c.dataset.uk);
              if (found) { closeMainDrawer(); openQuickUserModal(found); }
            });
          });
          return;
        }
        closeMainDrawer();
        if (action === 'rooms') openRoomsModal();
        else if (action === 'profile') openCustomizeModal('info');
        else if (action === 'room_activity') openLeaderboardsModal('activeRooms');
        else if (action === 'news') openNewsModal();
        else if (action === 'wall') openSocialModal('wall');
        else if (action === 'leaderboards') openLeaderboardsModal('rich');
        else if (action === 'customize') openCustomizeModal('more');
        else if (action === 'report') openSocialModal('report');
        else if (action === 'lucky_box') claimDailyLuckyBox();
        else if (action === 'owner_suite') openAdminPanel('owner_suite');
        else if (action === 'stealth') $('dropStealthBtn').click();
        else if (action === 'admin') openAdminPanel('stats');
        else if (action === 'logout') logoutUser();
      });
    });

    // Mics 1..5 click
    $('micSlotsContainer')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.mic-slot-btn');
      if (!btn) return;
      const slot = Number(btn.dataset.micSlot);
      const cur = (state.mics || []).find((m) => m.slot === slot);
      if (!cur) return;

      if (!cur.holderKey) {
        takeVoiceMic(slot);
      } else if (cur.holderKey === state.user?.key) {
        leaveVoiceMic();
      } else if (state.isRoomManager || hasPerm('mute') || hasPerm('kick')) {
        const act = confirm(`المايك ${slot} مع "${cur.holderName}".\nموافق = إنزال من المايك\nإلغاء = كتم/فتح المايك`);
        if (act) state.socket.emit('mic_kick_slot', { slot });
        else state.socket.emit('mic_admin_mute_slot', { slot, muted: !cur.isAdminMuted });
      } else {
        showToast(`المايك ${slot} مع ${cur.holderName}`);
      }
    });

    $('leaveMicBtn')?.addEventListener('click', leaveVoiceMic);
    $('toggleSelfMicMuteBtn')?.addEventListener('click', () => {
      state.isSelfMicMuted = !state.isSelfMicMuted;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((t) => {
          t.enabled = !state.isSelfMicMuted;
        });
      }
      state.socket.emit('mic_toggle_self_mute', { muted: state.isSelfMicMuted });
      renderMics();
    });

    // Mics collapse divider buttons + Topic close + Footer bar buttons
    $('toggleMicsCollapseBtn')?.addEventListener('click', () => {
      state.micsCollapsed = !state.micsCollapsed;
      $('micsCollapsibleWrap')?.classList.toggle('hidden', state.micsCollapsed);
    });
    $('micsAndYtSettingsBtn')?.addEventListener('click', () => {
      state.ytBarOpen = !state.ytBarOpen;
      $('roomBannerCard')?.classList.toggle('hidden', !state.ytBarOpen);
      renderRoomYoutubeBar();
    });
    $('closeTopicBannerBtn')?.addEventListener('click', () => {
      $('topicBannerBar')?.classList.add('hidden');
    });
    $('footerOptionsBtn')?.addEventListener('click', () => openCustomizeModal('more'));
    $('footerRefreshBtn')?.addEventListener('click', () => {
      if (state.socket && state.currentRoom) {
        state.socket.emit('join_room', { roomId: state.currentRoom.id, silent: true });
      }
      showToast('تم تحديث الغرفة والرسائل.');
    });
    $('footerRadioBtn')?.addEventListener('click', () => {
      if (state.radioPlaying) {
        stopRadioStream();
        showToast('تم إيقاف الراديو.');
      } else {
        startRadioStream(state.selectedRadioId || DEFAULT_RADIO_STATIONS[0].id);
      }
    });
    $('footerRadioSwitchBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      $('radioPopover')?.classList.toggle('hidden');
      renderRadioStationsPopover();
    });
    $('closeRadioPopoverBtn')?.addEventListener('click', () => {
      $('radioPopover')?.classList.add('hidden');
    });

    // Room switch & YouTube (URL + Live Search by Name)
    $('switchRoomsBtn')?.addEventListener('click', openRoomsModal);
    $('roomSettingsBtn')?.addEventListener('click', () => openAdminPanel('rooms', state.currentRoom?.id || null));
    $('toggleYoutubeBarBtn')?.addEventListener('click', () => {
      state.ytBarOpen = !state.ytBarOpen;
      renderRoomYoutubeBar();
    });
    $('plusYoutubeBtn')?.addEventListener('click', () => {
      $('plusDropdown')?.classList.add('hidden');
      state.ytBarOpen = true;
      renderRoomYoutubeBar();
    });
    $('plusReportBtn')?.addEventListener('click', () => {
      $('plusDropdown')?.classList.add('hidden');
      openSocialModal('report');
    });
    $('ytCloseViewBtn')?.addEventListener('click', () => {
      state.ytBarOpen = false;
      $('roomYoutubeBar').classList.add('hidden');
    });
    $('ytMuteLocalBtn')?.addEventListener('click', () => {
      state.ytLocalMuted = !state.ytLocalMuted;
      renderRoomYoutubeBar();
    });
    $('ytSearchBtn')?.addEventListener('click', () => {
      performYouTubeSearch($('ytSearchInput')?.value || '');
    });
    $('ytSearchInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performYouTubeSearch($('ytSearchInput').value);
      }
    });
    $('ytPlayRoomBtn')?.addEventListener('click', () => {
      const url = $('ytUrlInput').value.trim();
      state.socket.emit('room_youtube_set', { roomId: state.currentRoom?.id, url, isPlaying: true }, (res) => {
        if (res?.error) showToast(res.error, true);
        else $('ytUrlInput').value = '';
      });
    });
    $('ytStopBtn')?.addEventListener('click', () => {
      state.socket.emit('room_youtube_set', { roomId: state.currentRoom?.id, url: '', isPlaying: false });
    });

    // Bottom bar & messaging
    $('sendMsgBtn').addEventListener('click', sendTextMessage);
    $('messageInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendTextMessage();
      }
    });
    $('messageInput').addEventListener('input', () => {
      if (!state.socket) return;
      state.socket.emit('typing', { isTyping: true });
      clearTimeout(state.typingTimeout);
      state.typingTimeout = setTimeout(() => state.socket?.emit('typing', { isTyping: false }), 1500);
    });

    $('plusMenuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('plusDropdown').classList.toggle('hidden');
    });
    $('plusUploadImageBtn').addEventListener('click', () => {
      $('plusDropdown').classList.add('hidden');
      $('chatImageFileInput').click();
    });
    $('chatImageFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const up = await api('/api/upload/image', { method: 'POST', body: fd });
        state.socket.emit('send_message', { msgType: 'image', mediaUrl: up.url, clientMsgId: `img_${Date.now()}` });
      } catch (err) {
        showToast(err.message, true);
      }
      e.target.value = '';
    });

    $('plusAdminNoticeBtn').addEventListener('click', () => {
      $('plusDropdown').classList.add('hidden');
      state.adminNoticeMode = true;
      $('adminNoticeModePill').classList.remove('hidden');
      $('messageInput').focus();
    });
    $('adminNoticeModePill').addEventListener('click', () => {
      state.adminNoticeMode = false;
      $('adminNoticeModePill').classList.add('hidden');
    });
    $('plusCustomizeTextBtn').addEventListener('click', () => {
      $('plusDropdown').classList.add('hidden');
      openCustomizeModal('options');
    });
    $('plusClearRoomBtn').addEventListener('click', () => {
      $('plusDropdown').classList.add('hidden');
      if (confirm('مسح جميع رسائل هذه الغرفة؟')) state.socket.emit('admin_clear_room');
    });

    // Emoji Popover
    $('emojiPickerBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('emojiPopover').classList.toggle('hidden');
      renderEmojiPopoverGrid();
    });
    document.querySelectorAll('.ep-tab').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeEmojiTab = b.dataset.epTab;
        document.querySelectorAll('.ep-tab').forEach((x) => x.classList.toggle('active', x === b));
        renderEmojiPopoverGrid();
      });
    });

    // Voice note recorder
    $('voiceRecordBtn').addEventListener('click', async () => {
      if (state.isRecordingAudio && state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.isRecordingAudio = false;
        $('voiceRecordBtn').classList.remove('recording');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.recordedChunks = [];
        const mr = new MediaRecorder(stream);
        state.mediaRecorder = mr;
        mr.ondataavailable = (ev) => {
          if (ev.data.size > 0) state.recordedChunks.push(ev.data);
        };
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(state.recordedChunks, { type: 'audio/webm' });
          const fd = new FormData();
          fd.append('file', blob, 'voice.webm');
          try {
            const up = await api('/api/upload/audio', { method: 'POST', body: fd });
            state.socket.emit('send_message', { msgType: 'audio', mediaUrl: up.url, clientMsgId: `aud_${Date.now()}` });
          } catch (err) {
            showToast(err.message, true);
          }
        };
        mr.start();
        state.isRecordingAudio = true;
        $('voiceRecordBtn').classList.add('recording');
        showToast('🎙️ جاري تسجيل الصوت... اضغط مجدداً للإرسال.');
      } catch {
        showToast('تعذر الوصول للميكروفون.', true);
      }
    });

    // Customize 6-tab modal actions
    document.querySelectorAll('.cust-tab').forEach((b) => {
      b.addEventListener('click', () => switchCustomizeTab(b.dataset.custTab));
    });
    $('custSwitchToMoreBtn')?.addEventListener('click', () => switchCustomizeTab('more'));
    $('nameStyleSubTabs')?.querySelectorAll('.sub-pill-tab').forEach((b) => {
      b.addEventListener('click', () => switchNameStyleTab(b.dataset.namestyleTab));
    });
    ['custDisplayName', 'custBioInput', 'custNameColor', 'custFontFamily', 'custFontStyle', 'custFontSize', 'custVipWingsToggle'].forEach((id) => {
      $(id)?.addEventListener('input', updateCustomizePreview);
      $(id)?.addEventListener('change', updateCustomizePreview);
    });
    $('custNameBgColor').addEventListener('input', () => {
      $('custNameBgColor').dataset.cleared = '0';
      updateCustomizePreview();
    });
    $('custClearNameBgBtn').addEventListener('click', () => {
      $('custNameBgColor').dataset.cleared = '1';
      updateCustomizePreview();
    });
    $('custNeonColor').addEventListener('input', () => {
      $('custNeonColor').dataset.cleared = '0';
      updateCustomizePreview();
    });
    $('custClearNeonBtn').addEventListener('click', () => {
      $('custNeonColor').dataset.cleared = '1';
      updateCustomizePreview();
    });
    $('custUploadAvatarBtn')?.addEventListener('click', () => $('custAvatarFile')?.click());
    $('custAvatarFile')?.addEventListener('change', async () => {
      const file = $('custAvatarFile').files[0];
      if (!file) return;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/avatar', { method: 'POST', body: fd });
        state.user.avatarUrl = res.url;
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم رفع وحفظ الصورة الشخصية (بما فيها GIF المتحركة) بنجاح!');
      } catch (err) {
        showToast(err.message, true);
      } finally {
        $('custAvatarFile').value = '';
      }
    });
    $('custUploadCoverBtn')?.addEventListener('click', () => $('custCoverFile')?.click());
    $('custCoverFile')?.addEventListener('change', async () => {
      const file = $('custCoverFile').files[0];
      if (!file) return;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/cover', { method: 'POST', body: fd });
        state.user.coverUrl = res.url;
        updateCustomizePreview();
        showToast('تم رفع وحفظ غلاف الملف الشخصي بنجاح!');
      } catch (err) {
        showToast(err.message, true);
      } finally {
        $('custCoverFile').value = '';
      }
    });
    $('custCopyLinkBtn')?.addEventListener('click', () => {
      const link = $('custProfileLinkInput')?.value || window.location.href;
      navigator.clipboard?.writeText(link).then(
        () => showToast('تم نسخ رابط حسابك الشخصي.'),
        () => showToast('انسخ الرابط من الحقل.')
      );
    });
    $('custWallSubmitBtn')?.addEventListener('click', async () => {
      const content = $('custWallInput')?.value.trim();
      if (!content) return;
      try {
        await api('/api/wall', { method: 'POST', body: { content } });
        $('custWallInput').value = '';
        showToast('تم نشر منشورك على الحائط!');
        openCustomizeModal('posts');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('custSaveCredsBtn')?.addEventListener('click', async () => {
      try {
        const res = await api('/api/profile/credentials', {
          method: 'POST',
          body: {
            email: $('custCredEmail')?.value || '',
            currentPassword: $('custCredCurrentPass')?.value || '',
            newPassword: $('custCredNewPass')?.value || ''
          }
        });
        if (res?.user) state.user = res.user;
        if ($('custCredCurrentPass')) $('custCredCurrentPass').value = '';
        if ($('custCredNewPass')) $('custCredNewPass').value = '';
        showToast('تم تحديث البريد وكلمة المرور بنجاح!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('custMoreLogoutBtn')?.addEventListener('click', () => {
      closeModal('customizeModal');
      logoutUser();
    });
    $('custStealthToggle')?.addEventListener('change', async () => {
      try {
        const res = await api('/api/profile/stealth', {
          method: 'POST',
          body: { enabled: $('custStealthToggle').checked }
        });
        state.user = res.user;
        renderUserIdentity();
        showToast(res.isStealth ? 'وضع التخفي مفعل.' : 'وضع التخفي متوقف.');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('custMusicPreviewBtn')?.addEventListener('click', () => {
      const ref = $('custMusicCustomUrl').value.trim() || $('custMusicPreset').value;
      if (!ref) {
        stopProfileMusic();
        return showToast('اختر نغمة أو أضف رابط MP3 أولاً.', true);
      }
      const playing = playProfileMusic(ref);
      $('custMusicPreviewBtn').textContent = playing ? 'إيقاف' : 'تجربة';
    });
    $('saveCustomizeBtn').addEventListener('click', async () => {
      try {
        const customUrl = $('custMusicCustomUrl').value.trim();
        const profileMusic = customUrl || $('custMusicPreset').value;
        const res = await api('/api/profile/customize', {
          method: 'POST',
          body: {
            displayName: $('custDisplayName').value,
            vipFamily: $('custVipFamily').value,
            bio: $('custBioInput').value,
            age: $('custAgeInput')?.value ? Number($('custAgeInput').value) : 0,
            gender: $('custGenderSelect')?.value || '',
            country: $('custCountryInput')?.value || '',
            allowCalls: $('custAllowCallsToggle') ? $('custAllowCallsToggle').checked : true,
            allowPm: $('custAllowPmToggle') ? $('custAllowPmToggle').checked : true,
            nameColor: $('custNameColor').value,
            textColor: $('custTextColor').value,
            nameBgColor: $('custNameBgColor').dataset.cleared === '1' ? '' : $('custNameBgColor').value,
            neonColor: $('custNeonColor').dataset.cleared === '1' ? '' : $('custNeonColor').value,
            fontFamily: $('custFontFamily').value,
            fontStyle: $('custFontStyle').value,
            fontSize: $('custFontSize') ? Number($('custFontSize').value) : 14,
            vipWings: $('custVipWingsToggle').checked,
            profileMusic
          }
        });
        state.user = res.user;
        renderUserIdentity();
        showToast('تم حفظ وتطبيق تعديلات ملفك الشخصي!');
        closeModal('customizeModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    // News composer
    $('toggleNewsComposerBtn').addEventListener('click', () => {
      $('newsComposerForm').classList.toggle('hidden');
    });
    $('submitNewsBtn').addEventListener('click', async () => {
      try {
        let imageUrl = $('newsImageUrl').value.trim();
        const file = $('newsImageFile').files[0];
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          const up = await api('/api/upload/news', { method: 'POST', body: fd });
          imageUrl = up.url;
        }
        await api('/api/news', {
          method: 'POST',
          body: { title: $('newsTitleInput').value, content: $('newsContentInput').value, imageUrl }
        });
        $('newsTitleInput').value = '';
        $('newsContentInput').value = '';
        $('newsImageUrl').value = '';
        $('newsComposerForm').classList.add('hidden');
        showToast('تم نشر الخبر للجميع!');
        openNewsModal();
      } catch (err) {
        showToast(err.message, true);
      }
    });

    // Leaderboards & Admin Tabs
    document.querySelectorAll('.lb-tab').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach((x) => x.classList.toggle('active', x === b));
        renderLeaderboardBody(b.dataset.lbTab);
      });
    });
    document.querySelectorAll('.adm-tab').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.adm-tab').forEach((x) => x.classList.toggle('active', x === b));
        renderAdminTab(b.dataset.admTab);
      });
    });

    // Dismiss popovers on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-trigger-wrap')) $('profileDropdown').classList.add('hidden');
      if (!e.target.closest('.plus-menu-wrap')) $('plusDropdown').classList.add('hidden');
      if (!e.target.closest('#emojiPopover') && !e.target.closest('#emojiPickerBtn')) $('emojiPopover').classList.add('hidden');
      if (!e.target.closest('#radioPopover') && !e.target.closest('#footerRadioSwitchBtn')) $('radioPopover')?.classList.add('hidden');
      if (!e.target.closest('.mod-menu-wrap')) document.querySelectorAll('.mod-menu-dropdown').forEach((m) => m.classList.add('hidden'));
      if (!e.target.closest('.msg-actions-wrap')) document.querySelectorAll('.msg-dots-menu').forEach((m) => m.classList.add('hidden'));
    });
  }

  async function bootstrap() {
    const refParam = new URLSearchParams(window.location.search).get('ref');
    if (refParam) localStorage.setItem(REF_KEY, String(refParam).trim());
    bindEvents();
    try {
      const pub = await api('/api/settings/public');
      if (pub?.settings) applySiteSettings(pub.settings);
    } catch {
      // ignore
    }

    if (state.token) {
      try {
        const me = await api('/api/me');
        if (me?.user) {
          enterApp(me.user, state.token);
          return;
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        state.token = '';
      }
    }
  }

  bootstrap();
})();
