(() => {
  const TOKEN_KEY = 'arabic_chat_token_v3';
  const ROOM_KEY = 'arabic_chat_room_v3';
  const DEVICE_ID_KEY = 'arabic_chat_device_id_v1';
  const REF_KEY = 'arabic_chat_ref_v1';
  const GUEST_PROFILE_KEY = 'arabic_chat_guest_profile_v1';
  const SOUND_MUTE_KEY = 'arabic_chat_sound_muted';
  const FINGERPRINT_KEY = 'arabic_chat_fp_v1';
  const USER_CACHE_KEY = 'arabic_chat_user_cache_v1';

  const NAME_ANIM_OPTIONS = [
    { id: 'none', label: 'ثابت (بدون حركة)' },
    { id: 'pulse', label: 'نبض ملكي' },
    { id: 'color_wave', label: 'تموج ألوان الطيف' },
    { id: 'gradient_glow', label: 'تدرج ذهبي' },
    { id: 'gentle_shake', label: 'اهتزاز خفيف' },
    { id: 'float_bounce', label: 'طفو ناعم' },
    { id: 'neon_flicker', label: 'وميض النيون' }
  ];

  function getOrCreateDeviceId() {
    let did = localStorage.getItem(DEVICE_ID_KEY);
    if (!did) {
      did = `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, did);
    }
    return did;
  }

  function getClientFingerprint() {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (fp) return fp;
    try {
      const raw = [
        navigator.userAgent || '',
        navigator.language || '',
        `${screen.width || 0}x${screen.height || 0}x${screen.colorDepth || 24}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        String(navigator.hardwareConcurrency || 0),
        String(navigator.maxTouchPoints || 0)
      ].join('|');
      let hash = 2166136261;
      for (let i = 0; i < raw.length; i += 1) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      fp = `fp_${(hash >>> 0).toString(36)}_${raw.length.toString(36)}`;
    } catch {
      fp = `fp_${Math.random().toString(36).slice(2, 10)}`;
    }
    localStorage.setItem(FINGERPRINT_KEY, fp);
    return fp;
  }

  function parseHexRgb(hex) {
    const clean = String(hex || '').trim().replace('#', '');
    if (/^[0-9a-f]{3}$/i.test(clean)) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16)
      ];
    }
    if (/^[0-9a-f]{6}$/i.test(clean)) {
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
      ];
    }
    return null;
  }

  function isReadableOnDarkBg(hex) {
    const rgb = parseHexRgb(hex);
    if (!rgb) return true;
    const toLin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = 0.2126 * toLin(rgb[0]) + 0.7152 * toLin(rgb[1]) + 0.0722 * toLin(rgb[2]);
    return lum >= 0.12;
  }

  function refreshLucideIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch {
      // ignore
    }
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
    '#f8fafc', '#e2e8f0', '#cbd5e1', '#fbbf24', '#f59e0b', '#fb7185',
    '#f43f5e', '#ef4444', '#fb923c', '#facc15', '#4ade80', '#2dd4bf',
    '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#f472b6'
  ];

  const RANK_ICON_PRESETS = [
    '👑', '💎', '⭐', '🏆', '🛡️', '🦅', '⚜️', '🔥',
    '✨', '🎖️', '🔰', '💫', '🐉', '🦁', '🌟', '💍'
  ];

  const RANK_BADGE_STYLES = [
    { id: 'gold_crown', label: 'تاج ذهبي ملكي', iconClass: 'fa-solid fa-crown' },
    { id: 'silver_crown', label: 'تاج فضي', iconClass: 'fa-solid fa-crown' },
    { id: 'royal_shield', label: 'درع ملكي', iconClass: 'fa-solid fa-shield-halved' },
    { id: 'silver_shield', label: 'درع فضي محصّن', iconClass: 'fa-solid fa-shield' },
    { id: 'gold_star', label: 'نجمة ذهبية متلألئة', iconClass: 'fa-solid fa-star' },
    { id: 'diamond_gem', label: 'ماسة زرقاء براقة', iconClass: 'fa-solid fa-gem' },
    { id: 'vip_wings', label: 'أجنحة VIP ملكية', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'silver_wing', label: 'جناح فضي', iconClass: 'fa-solid fa-dove' },
    { id: 'gold_eagle', label: 'نسر ذهبي', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'neon_badge', label: 'شارة نيون متوهجة', iconClass: 'fa-solid fa-certificate' },
    { id: 'crown_royal', label: 'تاج السيادة', iconClass: 'fa-solid fa-crown' },
    { id: 'diamond_medal', label: 'وسام ماسي', iconClass: 'fa-solid fa-gem' }
  ];

  const BUILT_IN_RANK_SVGS = {
    gold_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="gCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><path fill="url(#gCrown)" stroke="#78350f" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/><circle cx="12" cy="4.2" r="1.4" fill="#ef4444"/><circle cx="4.4" cy="7.5" r="1.1" fill="#38bdf8"/><circle cx="19.6" cy="7.5" r="1.1" fill="#38bdf8"/></svg>',
    crown_royal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="gCrownR" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#a16207"/></linearGradient></defs><path fill="url(#gCrownR)" stroke="#713f12" stroke-width="1" d="M2.5 18.5h19L20 8l-4.8 4.2L12 4.5 8.8 12.2 4 8l-1.5 10.5zM4 20.5h16v1.8H4z"/><circle cx="12" cy="14" r="1.5" fill="#dc2626"/></svg>',
    silver_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="sCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="55%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs><path fill="url(#sCrown)" stroke="#334155" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.3" fill="#38bdf8"/></svg>',
    royal_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="rShield" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><path fill="#1e293b" stroke="url(#rShield)" stroke-width="1.8" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="url(#rShield)" d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/></svg>',
    silver_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="sShield" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="60%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/></linearGradient></defs><path fill="url(#sShield)" stroke="#1e293b" stroke-width="1.3" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="#0ea5e9" d="M12 6.5l3 5.5-3 5.5-3-5.5z"/></svg>',
    gold_star: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="gStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef9c3"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><path fill="url(#gStar)" stroke="#92400e" stroke-width="1.1" d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    diamond_gem: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="dGem" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="45%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><path fill="url(#dGem)" stroke="#1e40af" stroke-width="1" d="M6.5 3.5h11l4 5.5L12 21 2.5 9l4-5.5z"/><path fill="rgba(255,255,255,0.45)" d="M6.5 3.5 9 9l3-5.5zm5.5 0L9 9h6z"/></svg>',
    diamond_medal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="dMed" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fae8ff"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><path fill="url(#dMed)" stroke="#312e81" stroke-width="1" d="M7 3h10l4 5.5L12 21 3 8.5 7 3z"/></svg>',
    vip_wings: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="vWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><path fill="url(#vWing)" stroke="#7c2d12" stroke-width="0.8" d="M2 7c4 0 6.5 2.5 8 5.5-2.5.8-5.5.2-7-2.2 1.2 2.5 3.8 4 6.5 4.2-2.2 1-4.5.7-6-.8.8 1.8 3.2 2.8 5.5 2.5L12 19l3-2.8c2.3.3 4.7-.7 5.5-2.5-1.5 1.5-3.8 1.8-6 .8 2.7-.2 5.3-1.7 6.5-4.2-1.5 2.4-4.5 3-7 2.2 1.5-3 4-5.5 8-5.5-4.5-.8-8 1-10 4.2C10 8 6.5 6.2 2 7z"/><circle cx="12" cy="11" r="2.2" fill="#facc15" stroke="#7c2d12" stroke-width="0.7"/></svg>',
    silver_wing: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#e2e8f0" stroke="#475569" stroke-width="0.9" d="M3 8c4.5 0 7.5 2.8 9 6-2.5.8-5.5.1-7-2 1.4 2.5 4 3.8 6.5 4-2.2 1-4.6.6-6-.8.9 1.8 3.4 2.7 5.8 2.3L12 19l8.5-7c-3.5-.3-6.5 1-8.5 3.3C10.5 10.5 7 7.7 3 8z"/></svg>',
    gold_eagle: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="0.9" d="M12 4l2.2 3.2 7.3-1.7-3.5 5 2 3-5.2-1.2L12 20.5 9.2 12.3 4 13.5l2-3-3.5-5 7.3 1.7z"/></svg>',
    neon_badge: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><defs><linearGradient id="nBad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#22d3ee"/><stop offset="50%" stop-color="#ec4899"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><path fill="url(#nBad)" stroke="#ffffff" stroke-width="0.9" d="M12 2l2.3 2.7 3.5-.5.8 3.4 3.2 1.5-1.3 3.3 1.3 3.3-3.2 1.5-.8 3.4-3.5-.5L12 22l-2.3-2.7-3.5.5-.8-3.4-3.2-1.5 1.3-3.3-1.3-3.3 3.2-1.5.8-3.4 3.5.5z"/><path fill="#ffffff" d="M12 7.5l1.3 2.9 3.1.4-2.2 2.2.5 3.1-2.7-1.5-2.7 1.5.5-3.1-2.2-2.2 3.1-.4z"/></svg>'
  };

  const FRAME_ORNAMENT_SVGS = {
    kings_crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="1" d="M3 18h18l-1.5-9-4.5 4L12 5l-3 8-4.5-4L3 18z"/><circle cx="12" cy="4.3" r="1.4" fill="#ef4444"/></svg>',
    fire_gold: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fb923c" stroke="#fef08a" stroke-width="1" d="M12.5 2c1.5 3.5-.5 5.5 1.5 8 .8-1.4 1.5-2.3 1.7-3.6 2.8 2 4.3 4.8 4.3 7.8a8 8 0 1 1-16 0c0-3.8 2.6-7.6 8.5-12.2z"/></svg>',
    neon_rainbow: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#ec4899" stroke-width="2.2" stroke-dasharray="6 3"/><path fill="#22d3ee" d="M12 4l1.5 3.5L17 9l-3.5 1.5L12 14l-1.5-3.5L7 9l3.5-1.5z"/></svg>',
    lightning_bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#38bdf8" stroke="#ffffff" stroke-width="1.2" d="M13 2L4.5 13.5H11L9.5 22 19.5 10.5H13z"/></svg>',
    royal_wings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="0.9" d="M2 8c4 0 6.5 2.5 8 5.5-2.5.8-5.5.2-7-2.2 1.2 2.5 3.8 4 6.5 4.2L12 19l2.5-3.5c2.7-.2 5.3-1.7 6.5-4.2-1.5 2.4-4.5 3-7 2.2C15.5 10.5 18 8 22 8c-4.5-.8-8 1-10 4.2C10 9 6.5 7.2 2 8z"/></svg>',
    hearts_roses: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f43f5e" stroke="#ffe4e6" stroke-width="1.1" d="M12 20.5s-7-4.4-9-8.8C1.5 8.4 3.7 4.8 7.3 4.8c2 0 3.7 1.1 4.7 2.7 1-1.6 2.7-2.7 4.7-2.7 3.6 0 5.8 3.6 4.3 6.9-2 4.4-9 8.8-9 8.8z"/></svg>',
    royal_flowers: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#f472b6" stroke="#fdf2f8" stroke-width="0.8"><circle cx="12" cy="6.5" r="3.2"/><circle cx="17.2" cy="10.2" r="3.2"/><circle cx="15.2" cy="16.2" r="3.2"/><circle cx="8.8" cy="16.2" r="3.2"/><circle cx="6.8" cy="10.2" r="3.2"/></g><circle cx="12" cy="11.8" r="2.6" fill="#fde047"/></svg>',
    diamond_ring: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.1" d="M6.5 3.5h11l4 5.5L12 21 2.5 9l4-5.5z"/><path fill="rgba(255,255,255,0.55)" d="M6.5 3.5 9 9l3-5.5zm5.5 0L9 9h6z"/></svg>',
    fire_dragon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#ef4444" stroke="#fef08a" stroke-width="1" d="M12 2c2.5 2.5 5 5 5 8.5 0 1.4-.4 2.6-1 3.6 1.5-.8 2.5-2.3 2.7-4 1.6 1.7 2.3 3.9 2.3 6.1A9 9 0 1 1 5.6 9.8c.5 1.8 1.8 3 3.2 3.8C7.6 10.6 8.8 6 12 2z"/><path fill="#fbbf24" d="M12 10.5c1.8 2 2.5 3.5 2.5 5.2a2.5 2.5 0 0 1-5 0c0-1.7.7-3.2 2.5-5.2z"/></svg>',
    celestial_halo: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="8" rx="8" ry="3" fill="none" stroke="#fde047" stroke-width="2"/><path fill="#a855f7" stroke="#e0e7ff" stroke-width="0.9" d="M12 11l1.6 3.5L17 16l-3.4 1.5L12 21l-1.6-3.5L7 16l3.4-1.5z"/></svg>'
  };

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
    fingerprint: getClientFingerprint(),
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
    ytSearchTimer: null,
    ytForceVideo: false,
    quizBotState: { active: false, hintSent: false, enabledSetting: true },
    activeCustomizeTab: 'info',
    activeNameStyleTab: 'color',
    activeLeaderboardTab: 'rich',
    activeAdminTab: 'ranks_matrix',
    activeAdminSubTab: {},
    activeEmojiTab: 'faces',
    giftTarget: null,
    adminOverview: null,
    editingRankKey: null,
    editingRoomId: null,
    editingQuizQuestionId: null,
    lastRoomMsgTs: 0,
    wasDisconnected: false,
    soundMuted: localStorage.getItem(SOUND_MUTE_KEY) === '1',
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
    ownerSuite: null,
    deferredInstallPrompt: null,
    activeStoreTab: 'store',
    rankPickerTarget: null,
    typingUsers: new Map(),
    typingPruneTimer: null,
    micLevelBySlot: new Map(),
    micAnalysers: new Map(),
    micWaveRaf: null,
    micLastEmitTs: 0,
    userNightPref: localStorage.getItem('chat_night_atmos_pref') || 'follow',
    cinematicTimer: null
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
    setTimeout(() => {
      el.classList.add('toast-leaving');
      setTimeout(() => el.remove(), 220);
    }, 3000);
  }

  function dispatchWebPush(title, body) {
    try {
      if (!document.hidden) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      new Notification(String(title || 'شات عربي الاصيل'), {
        body: String(body || '').slice(0, 140),
        icon: '/assets/rooms/general.svg',
        tag: 'arabic-chat-alert'
      });
    } catch {
      // ignore notification error
    }
  }

  async function requestWebPushPermission() {
    if (typeof Notification === 'undefined') {
      showToast('متصفحك لا يدعم إشعارات الدفع (Web Push).', true);
      return false;
    }
    if (Notification.permission === 'granted') {
      showToast('إشعارات المتصفح مفعّلة بالفعل!');
      return true;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showToast('تم تفعيل إشعارات المتصفح عند الخلفية بنجاح!');
        return true;
      }
      showToast('لم يتم منح إذن الإشعارات من المتصفح.', true);
      return false;
    } catch {
      showToast('تعذر طلب إذن الإشعارات.', true);
      return false;
    }
  }

  function playNotificationChime(kind = 'notif') {
    if (state.soundMuted || localStorage.getItem(SOUND_MUTE_KEY) === '1') return;
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
    if (previewBtn) previewBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    const custMiniBtn = $('custMiniMusicPlayBtn');
    if (custMiniBtn) custMiniBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    const quBtn = $('quMusicToggleBtn');
    if (quBtn) quBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
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
    const headers = {
      ...(opts.headers || {}),
      'X-Device-Id': state.deviceId,
      'X-Client-Fingerprint': state.fingerprint
    };
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
    if (!res.ok) {
      const err = new Error(data.error || 'حدث خطأ في الاتصال بالخادم.');
      err.status = res.status;
      throw err;
    }
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

  function passesSettingRankThreshold(settingKey, userObj = state.user) {
    if (!userObj) return false;
    if (userObj.role === 'site_owner' || userObj.isSupremeOwner) return true;
    const reqRoleKey = String(state.settings?.[settingKey] || 'member');
    const reqPower = Number(getRank(reqRoleKey)?.power || 0);
    const myPower = Number(getRank(userObj.role || 'guest')?.power || 0);
    return myPower >= reqPower;
  }

  function isFeatureEnabled(settingKey) {
    return Number(state.settings?.[settingKey] ?? 1) !== 0;
  }

  function getRankTierMeta(roleKey) {
    const rk = getRank(roleKey || 'member');
    const key = String(rk?.key || roleKey || 'member').toLowerCase();
    const power = Number(rk?.power || 0);
    if (key === 'site_owner' || power >= 15) {
      return { tierClass: 'tier-owner', msgClass: 'rank-tier-owner', glowColor: 'rgba(251, 191, 36, 0.65)', rank: rk };
    }
    if (key === 'co_owner' || key === 'general_admin' || key === 'senior_admin' || (power >= 13 && power < 15)) {
      return { tierClass: 'tier-senior-admin', msgClass: 'rank-tier-admin', glowColor: 'rgba(220, 38, 38, 0.52)', rank: rk };
    }
    if (
      key === 'super_owner' || key === 'owner' || key === 'super_admin' || key === 'admin' ||
      key === 'supervisor' || key === 'moderator' || (power >= 9 && power < 13)
    ) {
      return { tierClass: 'tier-supervisor', msgClass: 'rank-tier-admin', glowColor: 'rgba(37, 99, 235, 0.52)', rank: rk };
    }
    if (key === 'royal_vip' || key === 'vip' || power === 7) {
      return { tierClass: 'tier-vip', msgClass: 'rank-tier-vip', glowColor: 'rgba(234, 179, 8, 0.6)', rank: rk };
    }
    if (key === 'premium' || key === 'royal_member' || power === 8 || power === 6) {
      return { tierClass: 'tier-premium', msgClass: 'rank-tier-vip', glowColor: 'rgba(124, 58, 237, 0.52)', rank: rk };
    }
    if (key === 'guest' || power <= 1) {
      return { tierClass: 'tier-guest', msgClass: 'rank-tier-member', glowColor: 'rgba(148, 163, 184, 0.24)', rank: rk };
    }
    return { tierClass: 'tier-member', msgClass: 'rank-tier-member', glowColor: 'rgba(15, 118, 110, 0.36)', rank: rk };
  }

  function rankStyleIconHtml(r) {
    if (r.image_url) {
      return `<img src="${escapeHtml(r.image_url)}" class="rank-badge-img" alt="" />`;
    }
    if (r.badge_style && BUILT_IN_RANK_SVGS[r.badge_style]) {
      return BUILT_IN_RANK_SVGS[r.badge_style];
    }
    const styleObj = RANK_BADGE_STYLES.find((s) => s.id === r.badge_style);
    if (styleObj) {
      return `<i class="${escapeHtml(styleObj.iconClass)}"></i>`;
    }
    return `<span>${escapeHtml(r.icon || '⭐')}</span>`;
  }

  function roleBadgeHTML(roleKey, compact = false) {
    const r = getRank(roleKey);
    const meta = getRankTierMeta(roleKey);
    const styleClass = r.badge_style ? `rank-badge-style-${escapeHtml(r.badge_style)}` : '';
    const iconHtml = rankStyleIconHtml(r);
    if (compact) {
      return `<span class="rank-icon-mini ${meta.tierClass} ${styleClass}" title="${escapeHtml(r.label)}" style="background:${escapeHtml(r.bg_color)};color:${escapeHtml(r.text_color)}">${iconHtml}</span>`;
    }
    return `<span class="rank-badge rank-capsule ${meta.tierClass} ${styleClass}" style="background:${escapeHtml(r.bg_color)};color:${escapeHtml(r.text_color)}">${iconHtml}<span>${escapeHtml(r.label)}</span></span>`;
  }

  function resolveFontFamilyCss(ff) {
    const clean = String(ff || '').trim();
    const allowed = ['Cairo', 'Tajawal', 'Amiri', 'Reem Kufi', 'Aref Ruqaa', 'Almarai'];
    if (!clean || clean === 'Normal' || !allowed.includes(clean)) return "'Cairo', 'Tajawal', sans-serif";
    return `'${escapeHtml(clean)}', 'Cairo', sans-serif`;
  }

  function canManageTargetUser(target) {
    if (!state.user || !target) return false;
    if (target.key && target.key === state.user.key) return false;
    if (
      target.isSupremeOwner ||
      target.role === 'site_owner' ||
      String(target.email || '').toLowerCase() === 'a38125923@gmail.com'
    ) {
      return false;
    }
    if (state.user.role === 'site_owner') return true;
    const myPower = Number(getRank(state.user.role)?.power) || 0;
    const targetPower = Number(getRank(target.role)?.power) || 0;
    return myPower > targetPower;
  }

  function getAssignableRanksForActor() {
    if (!state.user) return [];
    const isOwner = state.user.role === 'site_owner';
    const myRank = getRank(state.user.role);
    const ceiling = isOwner ? 15 : (Number(myRank?.max_assignable_rank) || 0);
    return (state.ranks || [])
      .filter((r) => r.key !== 'guest' && r.key !== 'site_owner' && (isOwner || Number(r.power) <= ceiling))
      .sort((a, b) => (Number(b.power) || 0) - (Number(a.power) || 0));
  }

  function isExclusiveOwnerObj(userObj) {
    if (!userObj) return false;
    const uKey = String(userObj.sender_key || userObj.key || '');
    if (uKey === 'system:quizbot' || uKey === 'system:official') return false;
    const role = userObj.sender_role || userObj.role || '';
    const email = String(userObj.email || '').toLowerCase();
    return role === 'site_owner' || Boolean(userObj.isSupremeOwner) || email === 'a38125923@gmail.com';
  }

  function isOwnerGalaxyVisualEnabled() {
    return Number(state.settings?.fx_owner_galaxy_identity ?? 1) !== 0;
  }

  function formatNameHTML(userObj) {
    const uKey = userObj.sender_key || userObj.key || '';
    const name = escapeHtml(userObj.sender_name || userObj.name || 'عضو');
    const role = userObj.sender_role || userObj.role || 'member';
    const isExclusiveOwner = isExclusiveOwnerObj(userObj) && isOwnerGalaxyVisualEnabled();
    const shine = userObj.name_shine || userObj.nameShine || 'none';
    const nameAnim = userObj.name_anim || userObj.nameAnim || 'none';
    const nameAnimSpeed = userObj.name_anim_speed || userObj.nameAnimSpeed || 'normal';
    const wings = Boolean(userObj.vip_wings || userObj.vipWings);
    const nameplate = userObj.nameplate_style || userObj.nameplateStyle || 'default';
    const nameColor = userObj.name_color || userObj.nameColor || '#f8fafc';
    const nameBg = userObj.name_bg_color || userObj.nameBgColor || '';
    const neon = userObj.neon_color || userObj.neonColor || '';
    const ff = userObj.font_family || userObj.fontFamily || 'Cairo';
    const fs = userObj.font_style || userObj.fontStyle || 'Normal';
    const nameFontSize = Math.max(13, Math.min(18, Number(userObj.name_font_size || userObj.nameFontSize) || 14));
    const nameStyleMode = ['solid', 'gradient', 'glow'].includes(String(userObj.name_style_mode || userObj.nameStyleMode || ''))
      ? String(userObj.name_style_mode || userObj.nameStyleMode)
      : 'solid';
    const nameGradient = String(userObj.name_gradient || userObj.nameGradient || 'gold_royal');

    const classes = ['sender-name-btn'];
    if (isExclusiveOwner) classes.push('owner-hologram-name');
    if (!isExclusiveOwner && nameplate && nameplate !== 'default') classes.push(`nameplate-${nameplate}`);
    if (!isExclusiveOwner && shine && shine !== 'none') classes.push(`shine-${shine}`);
    if (!isExclusiveOwner && nameStyleMode === 'gradient') classes.push(`name-grad-${escapeHtml(nameGradient)}`);
    if (!isExclusiveOwner && (nameStyleMode === 'glow' || neon)) classes.push('name-glow-mode');
    if (nameAnim && nameAnim !== 'none') {
      classes.push(`name-anim-${nameAnim}`);
      classes.push(`name-anim-speed-${nameAnimSpeed}`);
    }

    const styles = [];
    if (!isExclusiveOwner && shine === 'none' && nameStyleMode !== 'gradient') {
      const safeNameCol = (!nameBg && !isReadableOnDarkBg(nameColor)) ? '#f8fafc' : nameColor;
      styles.push(`color:${escapeHtml(safeNameCol)}`);
    }
    if (nameBg) {
      styles.push(`background-color:${escapeHtml(nameBg)}`);
    }
    if ((neon || nameStyleMode === 'glow') && !isExclusiveOwner) {
      const glowHex = neon || (isReadableOnDarkBg(nameColor) ? nameColor : '#38bdf8');
      styles.push(`text-shadow:0 0 8px ${escapeHtml(glowHex)}, 0 0 16px ${escapeHtml(glowHex)}`);
    }
    styles.push(`font-family:${resolveFontFamilyCss(ff)}`);
    if (fs === 'Bold') styles.push('font-weight:800');
    if (fs === 'Italic') styles.push('font-style:italic');
    styles.push(`font-size:${nameFontSize}px`);

    const leftWing = wings ? '<span class="vip-wing">🪽</span>' : isExclusiveOwner ? '<span class="vip-wing">👑</span>' : '';
    const rightWing = wings ? '<span class="vip-wing">🪽</span>' : '';

    const verifiedHtml = isExclusiveOwner
      ? '<i class="fa-solid fa-circle-check owner-verified-badge" title="سيد المجرة والزمن — المالك الموثق"></i>'
      : '';
    const kingHtml = uKey && state.roomKingKey && uKey === state.roomKingKey && role !== 'site_owner'
      ? '<span class="room-king-badge" title="الأكثر تفاعلاً في الغرفة"><i class="fa-solid fa-crown"></i> ملك الغرفة</span>'
      : '';

    const textClass = isExclusiveOwner ? 'name-anim-text owner-hologram-text' : 'name-anim-text';
    return `<span class="${classes.join(' ')}" style="${styles.join(';')}">${leftWing}<span class="${textClass}">${name}</span>${rightWing}</span>${verifiedHtml}${kingHtml}`;
  }

  function frameOrnamentHtml(frame, isOwnerUser = false) {
    const svg = FRAME_ORNAMENT_SVGS[frame] || '';
    const overlayHtml = frame && frame !== 'none'
      ? `<span class="avatar-frame-overlay frame-overlay-${escapeHtml(frame)}" aria-hidden="true">${svg}</span>`
      : '';
    if (frame === 'owner_sovereign' && isOwnerUser) {
      return `${overlayHtml}<span class="royal-eclipse-orbits" aria-hidden="true"><span class="eclipse-crystal ec-1"></span><span class="eclipse-crystal ec-2"></span><span class="eclipse-crystal ec-3"></span></span>`;
    }
    const cornerHtml = svg ? `<span class="frame-svg-ornament" aria-hidden="true">${svg}</span>` : '';
    return `${overlayHtml}${cornerHtml}`;
  }

  function syncFrameOrnament(wrapEl, frame, isOwnerUser = false) {
    if (!wrapEl) return;
    wrapEl.querySelectorAll('.frame-svg-ornament, .royal-eclipse-orbits, .avatar-frame-overlay').forEach((n) => n.remove());
    if (frame && frame !== 'none') {
      const ov = document.createElement('span');
      ov.className = `avatar-frame-overlay frame-overlay-${frame}`;
      ov.setAttribute('aria-hidden', 'true');
      ov.innerHTML = FRAME_ORNAMENT_SVGS[frame] || '';
      wrapEl.appendChild(ov);
    }
    if (frame === 'owner_sovereign' && isOwnerUser) {
      const orbits = document.createElement('span');
      orbits.className = 'royal-eclipse-orbits';
      orbits.setAttribute('aria-hidden', 'true');
      orbits.innerHTML = '<span class="eclipse-crystal ec-1"></span><span class="eclipse-crystal ec-2"></span><span class="eclipse-crystal ec-3"></span>';
      wrapEl.appendChild(orbits);
      return;
    }
    const svg = FRAME_ORNAMENT_SVGS[frame];
    if (svg) {
      const sp = document.createElement('span');
      sp.className = 'frame-svg-ornament';
      sp.setAttribute('aria-hidden', 'true');
      sp.innerHTML = svg;
      wrapEl.appendChild(sp);
    }
  }

  function formatAvatarHTML(userObj, sizeClass = '') {
    const name = String(userObj.sender_name || userObj.name || 'ع').trim();
    const avatarUrl = userObj.avatar_url || userObj.avatarUrl || '';
    const isActualOwner = isExclusiveOwnerObj(userObj);
    const isOwnerGalaxy = isActualOwner && isOwnerGalaxyVisualEnabled();
    let frame = userObj.avatar_frame || userObj.avatarFrame || 'none';
    if (isOwnerGalaxy && (!frame || frame === 'none' || frame === 'gold_royal')) {
      frame = 'owner_sovereign';
    } else if (!isOwnerGalaxy && frame === 'owner_sovereign') {
      frame = isActualOwner ? 'gold_royal' : 'none';
    }
    const letter = escapeHtml(name.slice(0, 1) || 'ع');
    const inner = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" />`
      : `<span class="avatar-letter">${letter}</span>`;
    return `<span class="avatar-wrap ${sizeClass} frame-${escapeHtml(frame)}"><span class="avatar-core-circle">${inner}</span>${frameOrnamentHtml(frame, isOwnerGalaxy)}</span>`;
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
    input.value = `${input.value}${prefix}${clean} `;
    input.focus();
  }

  function findKnownUserByMention(mentionText) {
    const target = String(mentionText || '').trim().toLowerCase();
    if (!target) return null;
    const pools = [state.roomUsers, state.onlineUsers, state.persistentMembers, state.user ? [state.user] : []];
    for (const pool of pools) {
      for (const u of pool || []) {
        const n1 = String(u.name || u.displayName || '').trim().toLowerCase();
        const n2 = String(u.username || '').trim().toLowerCase();
        if ((n1 && n1 === target) || (n2 && n2 === target)) return u;
      }
    }
    return null;
  }

  function doesTextContainName(rawText, candidateName) {
    const text = String(rawText || '').trim().toLowerCase();
    const clean = String(candidateName || '').trim().toLowerCase();
    if (!text || clean.length < 2) return false;
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[\\s،,.!?:"'()\\-])${escaped}(?=$|[\\s،,.!?:"'()\\-])`, 'i');
    return re.test(text);
  }

  function collectKnownUsersForMentions() {
    const knownNames = [];
    const seen = new Set();
    const pools = [state.roomUsers, state.onlineUsers, state.persistentMembers, state.user ? [state.user] : []];
    for (const pool of pools) {
      for (const u of pool || []) {
        for (const nm of [u.name, u.displayName, u.username]) {
          const clean = String(nm || '').trim();
          if (clean.length >= 2 && !seen.has(clean.toLowerCase())) {
            seen.add(clean.toLowerCase());
            knownNames.push({ name: clean, user: u });
          }
        }
      }
    }
    knownNames.sort((a, b) => b.name.length - a.name.length);
    return knownNames;
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
    const knownNames = collectKnownUsersForMentions();
    const tokens = [];

    for (const item of knownNames) {
      const esc = escapeHtml(item.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const bg = item.user.nameBgColor || item.user.name_bg_color || '#18181b';
      const fg = (item.user.nameBgColor || item.user.name_bg_color)
        ? (item.user.nameColor || item.user.name_color || '#ffffff')
        : '#ffffff';
      const re = new RegExp(`(^|\\s|>)@?${esc}(?=$|\\s|<|[،,.!?:"'()\\-])`, 'gi');
      html = html.replace(re, (match, lead) => {
        if (/<[^>]*$/.test(html.slice(0, html.indexOf(match)))) return match;
        const idx = tokens.length;
        tokens.push(
          `<span class="mention-inline-badge" data-mention-name="${escapeHtml(item.name)}" style="background:${escapeHtml(bg)};color:${escapeHtml(fg)};">${escapeHtml(item.name)}</span>`
        );
        return `${lead}\u0000MTOK${idx}\u0000`;
      });
    }

    // Legacy @token fallback (clean display)
    html = html.replace(
      /(^|\s)@([^\s<>"'&\u0000]{2,30})/g,
      '$1<span class="mention-inline-badge" data-mention-name="$2" style="background:#18181b;color:#facc15;">$2</span>'
    );

    html = html.replace(/\u0000MTOK(\d+)\u0000/g, (_m, i) => tokens[Number(i)] || '');
    return { html, hasMention: tokens.length > 0 || html.includes('mention-inline-badge') };
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
    const glassOn = Number(s.fx_glass_bubbles ?? 1) !== 0;
    const micWavesOn = Number(s.fx_mic_waves ?? 1) !== 0;
    document.body.classList.toggle('fx-glass-bubbles-on', glassOn);
    document.body.classList.toggle('fx-mic-waves-on', micWavesOn);

    // Enforce global feature & permission visibility strictly (hide unavailable tools)
    const micsEnabled = Number(s.feat_mics ?? 1) !== 0;
    const ytEnabled = Number(s.feat_youtube ?? 1) !== 0;
    const wallEnabled = Number(s.feat_wall ?? 1) !== 0;
    const pmEnabled = Number(s.feat_pm ?? 1) !== 0;
    const storeEnabled = Number(s.feat_store ?? 1) !== 0;
    const isOwnerSelf = state.user?.role === 'site_owner';
    const canPmUi = !state.user || isOwnerSelf || (pmEnabled && passesSettingRankThreshold('min_rank_pm') && hasPerm('pm'));
    const canMediaUi = !state.user || isOwnerSelf || (passesSettingRankThreshold('min_rank_chat_media') && hasPerm('chat_media'));
    const canYtUi = !state.user || isOwnerSelf || (ytEnabled && hasPerm('youtube'));
    const canWallUi = !state.user || isOwnerSelf || (wallEnabled && hasPerm('wall'));
    const canStoreUi = !state.user || isOwnerSelf || storeEnabled;

    $('micsCollapsibleWrap')?.classList.toggle('hidden', !micsEnabled || state.micsCollapsed);
    $('toggleYoutubeBarBtn')?.classList.toggle('hidden', !canYtUi);
    $('plusYoutubeBtn')?.classList.toggle('hidden', !canYtUi);
    $('footerWallBtn')?.classList.toggle('hidden', !canWallUi);
    $('plusWallBtn')?.classList.toggle('hidden', !canWallUi);
    document.querySelector('.drawer-item[data-drawer="wall"]')?.classList.toggle('hidden', !canWallUi);
    $('topPmBtn')?.classList.toggle('hidden', !canPmUi);
    $('quickImageUploadBtn')?.classList.toggle('hidden', !canMediaUi);
    $('plusUploadImageBtn')?.classList.toggle('hidden', !canMediaUi);
    $('voiceRecordBtn')?.classList.toggle('hidden', !canMediaUi);
    document.querySelector('.drawer-item[data-drawer="store"]')?.classList.toggle('hidden', !canStoreUi);
    const msgInputEl = $('messageInput');
    if (msgInputEl && state.user) {
      const guestBlocked = state.user.isGuest && Number(s.guest_can_chat ?? 1) === 0;
      msgInputEl.placeholder = guestBlocked
        ? 'الكتابة للزوار مقيدة حالياً من المالك...'
        : 'اكتب هنا...';
    }
    if (!$('inlineMsgStyleBar')?.classList.contains('hidden')) {
      renderInlineMsgStyleBar();
    }

    if (state.currentRoom) {
      renderRoomBanner();
      renderAllMessages();
      renderMics();
      renderUserIdentity();
      renderRoomUsers();
      renderTypingAvatarsBar();
    }
  }

  function isNightAtmosphereActive() {
    const globalMode = String(state.settings?.fx_night_atmosphere || 'always_on');
    if (globalMode === 'off') return false;
    if (state.userNightPref === 'on') return true;
    if (state.userNightPref === 'off') return false;
    if (globalMode === 'always_on') return true;
    const hr = new Date().getHours();
    return hr >= 18 || hr < 6;
  }

  function showCinematicEntrance(userObj) {
    if (!userObj || Number(state.settings?.fx_cinematic_entrance ?? 1) === 0) return;
    const host = $('cinematicEntranceHost');
    if (!host) return;
    const isOwnerTarget = isExclusiveOwnerObj(userObj);
    const rk = getRank(userObj.role || 'member');
    const isVipOrHigh = isOwnerTarget || Number(rk?.power || 0) >= 7 || String(rk?.key || '').toLowerCase().includes('vip');
    if (!isVipOrHigh) return;

    if (state.cinematicTimer) {
      clearTimeout(state.cinematicTimer);
      state.cinematicTimer = null;
    }
    host.innerHTML = '';

    const card = document.createElement('div');
    card.className = `cinematic-entrance-card ${isOwnerTarget ? 'is-owner' : 'is-vip'}`;
    const titleLabel = isOwnerTarget ? 'سيد المجرة والزمن • دخول أسطوري' : `${rk?.label || 'كبار الشخصيات'} • تشريف خاص`;
    card.innerHTML = `
      <span class="cinematic-gold-dust" aria-hidden="true"></span>
      <div class="cinematic-avatar-box">${formatAvatarHTML(userObj, 'lg')}</div>
      <div class="cinematic-meta">
        <div class="cinematic-kicker"><i class="fa-solid ${isOwnerTarget ? 'fa-meteor' : 'fa-crown'}"></i> ${escapeHtml(titleLabel)}</div>
        <div class="cinematic-name-line">${roleBadgeHTML(userObj.role, true)} ${formatNameHTML(userObj)}</div>
      </div>
    `;
    host.appendChild(card);

    state.cinematicTimer = setTimeout(() => {
      card.classList.add('is-leaving');
      setTimeout(() => {
        if (card.parentNode === host) card.remove();
      }, 320);
    }, 1700);
  }

  function renderTypingAvatarsBar() {
    const bar = $('typingIndicator');
    if (!bar) return;
    const now = Date.now();
    for (const [k, v] of [...state.typingUsers.entries()]) {
      if (!v || now > v.expiresAt) state.typingUsers.delete(k);
    }
    const active = Array.from(state.typingUsers.values());
    if (!active.length) {
      bar.innerHTML = '';
      bar.classList.add('hidden');
      return;
    }

    const useAvatars = Number(state.settings?.fx_typing_avatars ?? 1) !== 0;
    if (!useAvatars) {
      const names = active.slice(0, 2).map((x) => x.name).join('، ');
      bar.textContent = `✍️ ${names}${active.length > 2 ? ` و${active.length - 2} آخرون` : ''} يكتب الآن...`;
      bar.className = 'typing-indicator';
      return;
    }

    const avatarsHtml = active.slice(0, 5).map((t) => {
      const known =
        state.roomUsers.find((u) => u.key === t.key) ||
        state.persistentMembers.find((u) => u.key === t.key) ||
        t;
      const av = known.avatarUrl || t.avatarUrl || '';
      const letter = escapeHtml(String(t.name || 'ع').slice(0, 1));
      const inner = av
        ? `<img src="${escapeHtml(av)}" alt="${escapeHtml(t.name)}" />`
        : `<span>${letter}</span>`;
      return `<span class="typing-avatar-chip" title="${escapeHtml(t.name)} يكتب الآن">${inner}</span>`;
    }).join('');

    const label = active.length === 1
      ? `${escapeHtml(active[0].name)} يكتب...`
      : `${active.length} أعضاء يكتبون...`;

    bar.className = 'typing-indicator typing-avatars-bar';
    bar.innerHTML = `
      <div class="typing-avatars-stack">${avatarsHtml}</div>
      <span class="typing-avatars-lbl">${label}</span>
      <span class="typing-wave-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    `;
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
    const isOwner = isExclusiveOwnerObj(u);
    const isOwnerGalaxy = isOwner && isOwnerGalaxyVisualEnabled();
    let effectiveFrame = u.avatarFrame || 'none';
    if (isOwnerGalaxy && (!effectiveFrame || effectiveFrame === 'none' || effectiveFrame === 'gold_royal')) {
      effectiveFrame = 'owner_sovereign';
    } else if (!isOwnerGalaxy && effectiveFrame === 'owner_sovereign') {
      effectiveFrame = isOwner ? 'gold_royal' : 'none';
    }
    const wrap = $('topAvatarWrap');
    wrap.className = `avatar-wrap frame-${effectiveFrame}`;
    syncFrameOrnament(wrap, effectiveFrame, isOwnerGalaxy);
    if (u.avatarUrl) {
      $('topAvatarImg').src = u.avatarUrl;
      $('topAvatarImg').classList.remove('hidden');
      $('topAvatarLetter').classList.add('hidden');
    } else {
      $('topAvatarImg').classList.add('hidden');
      $('topAvatarLetter').classList.remove('hidden');
      $('topAvatarLetter').textContent = (u.name || 'ع').slice(0, 1);
    }

    const canStealth = isOwner || hasPerm('stealth');
    const isStealth = canStealth && Boolean(u.isStealth);
    $('topStealthBadge')?.classList.toggle('hidden', !isStealth);
    $('dropStealthBtn')?.classList.toggle('hidden', !canStealth);
    $('dropOwnerSuiteBtn')?.classList.toggle('hidden', !isOwner);
    $('drawerOwnerSuiteBtn')?.classList.toggle('hidden', !isOwner);
    const canBank = isOwner || u.role === 'co_owner' || Number(getRank(u.role)?.power || 0) >= 14;
    const myLvl = Math.max(1, Number(u.level) || Number(getRank(u.role)?.power) || 1);

    $('dropUserName').innerHTML = isOwnerGalaxy ? formatNameHTML(u) : escapeHtml(u.name || '');
    $('dropUserRole').innerHTML = isOwnerGalaxy
      ? `${roleBadgeHTML(u.role)} <span class="owner-galaxy-title-pill"><i class="fa-solid fa-meteor"></i> سيد المجرة والزمن</span>`
      : `${roleBadgeHTML(u.role)} <span class="lvl-pill-mini">المستوى ${myLvl}</span>`;
    $('dropUserCoins').innerHTML = `<i class="fa-solid fa-gem" style="color:#f43f5e;"></i> ${u.coins || 0} روبي • <i class="fa-solid fa-fire" style="color:#fb923c;"></i> ${u.activityPoints || 0} تفاعل`;

    if ($('dropStealthBtn')) {
      $('dropStealthBtn').innerHTML = isStealth
        ? '<i class="fa-solid fa-eye"></i> إلغاء وضع التخفي'
        : '<i class="fa-solid fa-user-secret"></i> تفعيل وضع التخفي';
    }

    const isFrozen = Boolean(u.isFrozen && !isOwner);
    const fBanner = $('frozenUserBanner');
    if (fBanner) {
      fBanner.classList.toggle('hidden', !isFrozen);
      if (isFrozen) {
        fBanner.innerHTML = '<i class="fa-solid fa-snowflake"></i> حسابك مجمد حالياً من الإدارة (وضع القراءة فقط — لا يمكنك الإرسال أو التنقل).';
      }
    }

    const canPanel = isOwner || hasPerm('access_panel') || canBank;
    $('dropAdminBtn')?.classList.toggle('hidden', !canPanel);
    $('drawerAdminBtn')?.classList.toggle('hidden', !canPanel);
    $('plusAdminNoticeBtn')?.classList.toggle('hidden', !(isOwner || hasPerm('access_panel')));
    $('plusClearRoomBtn')?.classList.toggle('hidden', !(isOwner || hasPerm('clear_room') || state.isRoomManager));

    const s = state.settings || {};
    const pmOn = Number(s.feat_pm ?? 1) !== 0 && (isOwner || (passesSettingRankThreshold('min_rank_pm') && hasPerm('pm')));
    const mediaOn = isOwner || (passesSettingRankThreshold('min_rank_chat_media') && hasPerm('chat_media'));
    const ytOn = Number(s.feat_youtube ?? 1) !== 0 && (isOwner || hasPerm('youtube'));
    const wallOn = Number(s.feat_wall ?? 1) !== 0 && (isOwner || hasPerm('wall'));
    $('topPmBtn')?.classList.toggle('hidden', !pmOn);
    $('quickImageUploadBtn')?.classList.toggle('hidden', !mediaOn);
    $('plusUploadImageBtn')?.classList.toggle('hidden', !mediaOn);
    $('voiceRecordBtn')?.classList.toggle('hidden', !mediaOn);
    $('toggleYoutubeBarBtn')?.classList.toggle('hidden', !ytOn);
    $('plusYoutubeBtn')?.classList.toggle('hidden', !ytOn);
    $('footerWallBtn')?.classList.toggle('hidden', !wallOn);
    $('plusWallBtn')?.classList.toggle('hidden', !wallOn);
    document.querySelector('.drawer-item[data-drawer="wall"]')?.classList.toggle('hidden', !wallOn);
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
    const nightOn = isNightAtmosphereActive() && !r.wallpaper_url && !r.bg_custom;
    stage.className = `chat-stage theme-${r.bg_theme || 'warm_peach'}${nightOn ? ' night-atmosphere-active' : ''}`;
    if (r.wallpaper_url) {
      stage.style.backgroundImage = `url("${r.wallpaper_url}")`;
    } else if (r.bg_custom) {
      stage.style.background = r.bg_custom;
    } else {
      stage.style.backgroundImage = '';
      stage.style.background = '';
    }
    $('nightStarsLayer')?.classList.toggle('hidden', !nightOn);
    const nightBtn = $('toggleNightAtmosBtn');
    if (nightBtn) {
      const globalOff = String(state.settings?.fx_night_atmosphere || 'always_on') === 'off';
      nightBtn.classList.toggle('hidden', globalOff);
      nightBtn.classList.toggle('active-night', nightOn);
      nightBtn.title = nightOn ? 'إيقاف أجواء السهرة الليلية مؤقتاً' : 'تفعيل أجواء السهرة الليلية';
    }

    renderRoomYoutubeBar();
    renderQuizBotRoomBar();
  }

  function renderQuizBotRoomBar() {
    const bar = $('quizBotRoomBar');
    if (!bar) return;
    const r = state.currentRoom;
    const isQuizRoom = Boolean(r && (r.id === 'competitions' || state.quizBotState?.active));
    bar.classList.toggle('hidden', !isQuizRoom);
    if (!isQuizRoom) return;

    const isActive = Boolean(state.quizBotState?.active);
    const statusTxt = $('quizBotStatusText');
    if (statusTxt) {
      statusTxt.textContent = isActive
        ? 'بوت المسابقات نشط • 100 / 50 / 25 نقطة (تلميح بعد 12ث)'
        : 'بوت المسابقات متوقف حالياً في هذه الغرفة';
    }
    const toggleBtn = $('roomQuizToggleBtn');
    const toggleLbl = $('roomQuizToggleLbl');
    const isOwner = state.user?.role === 'site_owner';
    if (toggleBtn) {
      toggleBtn.classList.toggle('hidden', !isOwner);
      toggleBtn.classList.toggle('stopped', !isActive);
      if (toggleLbl) toggleLbl.textContent = isActive ? 'إيقاف البوت' : 'تشغيل البوت';
    }
  }

  function renderRoomYoutubeBar() {
    const r = state.currentRoom;
    if (!r) return;
    const hasVideo = Boolean(r.youtube_video_id && r.youtube_is_playing);
    const canSearchYt = Boolean(state.user && !(state.user.isFrozen && state.user.role !== 'site_owner'));
    const isOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
    const canStopYt = Boolean(state.isRoomManager || (r.youtube_by_key && r.youtube_by_key === state.user?.key) || isOnMic);

    $('ytManagerForm')?.classList.toggle('hidden', !canSearchYt);
    $('ytStopBtn')?.classList.toggle('hidden', !(canStopYt && hasVideo));
    $('toggleYoutubeBarBtn')?.classList.toggle('active', hasVideo || state.ytBarOpen);

    const miniBar = $('micMiniYoutubeBar');
    const ytPlayer = $('ytPlayerContainer');
    const ytIframe = $('ytIframe');
    const showMiniBar = hasVideo && Boolean(r.youtube_mini_mode) && !state.ytForceVideo;

    if (hasVideo) {
      const displayTitle = r.youtube_title || r.youtube_video_id;
      const bySuffix = r.youtube_by_name ? ` • ${r.youtube_by_name}` : '';
      $('ytNowPlayingLabel').innerHTML = `<i class="fa-brands fa-youtube" style="color:#ef4444"></i> ${escapeHtml(displayTitle)}${escapeHtml(bySuffix)}`;

      if (miniBar) {
        miniBar.classList.toggle('hidden', !showMiniBar);
        if ($('micMiniYtTitle')) $('micMiniYtTitle').textContent = displayTitle;
        if ($('micMiniYtBy')) {
          $('micMiniYtBy').textContent = r.youtube_by_name || '';
          $('micMiniYtBy').classList.toggle('hidden', !r.youtube_by_name);
        }
        if ($('micMiniYtMuteBtn')) {
          $('micMiniYtMuteBtn').innerHTML = state.ytLocalMuted
            ? '<i class="fa-solid fa-volume-xmark"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
        }
        if ($('micMiniYtExpandBtn')) {
          $('micMiniYtExpandBtn').innerHTML = state.ytForceVideo
            ? '<i class="fa-solid fa-compress"></i>'
            : '<i class="fa-solid fa-tv"></i>';
        }
        $('micMiniYtStopBtn')?.classList.toggle('hidden', !canStopYt);
      }

      $('ytSwitchMiniBtn')?.classList.toggle('hidden', showMiniBar);
      $('roomYoutubeBar')?.classList.toggle('hidden', !(state.ytBarOpen || !showMiniBar));

      if (ytPlayer) {
        ytPlayer.classList.remove('hidden');
        ytPlayer.classList.toggle('yt-audio-only-frame', showMiniBar);
      }

      const targetSrc = `https://www.youtube.com/embed/${encodeURIComponent(r.youtube_video_id)}?autoplay=1&enablejsapi=1${state.ytLocalMuted ? '&mute=1' : ''}`;
      if (ytIframe && (ytIframe.dataset.videoId !== r.youtube_video_id || ytIframe.dataset.muted !== String(state.ytLocalMuted))) {
        ytIframe.src = targetSrc;
        ytIframe.dataset.videoId = r.youtube_video_id;
        ytIframe.dataset.muted = String(state.ytLocalMuted);
      }
    } else {
      miniBar?.classList.add('hidden');
      $('ytSwitchMiniBtn')?.classList.add('hidden');
      if (ytPlayer) {
        ytPlayer.classList.add('hidden');
        ytPlayer.classList.remove('yt-audio-only-frame');
      }
      if (ytIframe && ytIframe.src) {
        ytIframe.src = '';
        delete ytIframe.dataset.videoId;
      }
      $('ytNowPlayingLabel').innerHTML = '<i class="fa-brands fa-youtube" style="color:#ef4444"></i> بحث وتشغيل يوتيوب الغرفة';
      $('roomYoutubeBar')?.classList.toggle('hidden', !state.ytBarOpen);
    }
    if ($('ytMuteLocalBtn')) {
      $('ytMuteLocalBtn').innerHTML = state.ytLocalMuted
        ? '<i class="fa-solid fa-volume-xmark"></i> صامت'
        : '<i class="fa-solid fa-volume-high"></i> صوت';
    }
  }

  async function performYouTubeSearch(queryOverride) {
    const q = (typeof queryOverride === 'string' ? queryOverride : ($('ytSearchInput')?.value || '')).trim();
    const resBox = $('ytSearchResults');
    if (!q) {
      if (resBox) resBox.classList.add('hidden');
      return showToast('أدخل اسم الأغنية أو الفيديو للبحث في يوتيوب.', true);
    }
    resBox.classList.remove('hidden');
    resBox.innerHTML = '<div class="muted" style="color:#cbd5e1;padding:6px;">جاري البحث المباشر في يوتيوب...</div>';
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
          const iAmOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
          state.socket.emit('room_youtube_set', {
            roomId: state.currentRoom?.id,
            url: videoId,
            title,
            isPlaying: true,
            miniMode: iAmOnMic
          }, (res) => {
            if (res?.error) showToast(res.error, true);
            else {
              state.ytForceVideo = false;
              if (iAmOnMic) state.ytBarOpen = false;
              showToast(iAmOnMic ? `تم تشغيل الصوت تحت المايك: ${title}` : `تم تشغيل في الغرفة: ${title}`);
              resBox.classList.add('hidden');
              renderRoomYoutubeBar();
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
  function cleanupMicAnalyser(key) {
    const rec = state.micAnalysers.get(key);
    if (!rec) return;
    try {
      rec.source?.disconnect();
      if (rec.ctx && rec.ctx.state !== 'closed') rec.ctx.close().catch(() => {});
    } catch {
      // ignore
    }
    state.micAnalysers.delete(key);
  }

  function setupMicAnalyser(key, stream, isLocal = false) {
    cleanupMicAnalyser(key);
    if (!stream || Number(state.settings?.fx_mic_waves ?? 1) === 0) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      state.micAnalysers.set(key, { ctx, source, analyser, dataArray, isLocal, smoothed: 0 });
      startMicWaveformLoop();
    } catch {
      // ignore AudioContext restriction
    }
  }

  function startMicWaveformLoop() {
    if (state.micWaveRaf) return;
    const tick = () => {
      const wavesEnabled = Number(state.settings?.fx_mic_waves ?? 1) !== 0;
      const hasOccupied = (state.mics || []).some((m) => Boolean(m.holderKey));
      if (!wavesEnabled || !hasOccupied) {
        state.micWaveRaf = null;
        return;
      }

      const now = Date.now();
      for (const m of state.mics || []) {
        const slot = Number(m.slot);
        let level = 0;
        const isMuted = Boolean(m.isSelfMuted || m.isAdminMuted);
        if (m.holderKey && !isMuted) {
          if (m.holderKey === state.user?.key) {
            const locRec = state.micAnalysers.get('local');
            if (locRec && !state.isSelfMicMuted) {
              locRec.analyser.getByteFrequencyData(locRec.dataArray);
              let sum = 0;
              for (let i = 0; i < locRec.dataArray.length; i += 1) sum += locRec.dataArray[i];
              const raw = Math.min(1, (sum / (locRec.dataArray.length * 110)));
              locRec.smoothed = locRec.smoothed * 0.65 + raw * 0.35;
              level = locRec.smoothed;
              if (state.socket && now - state.micLastEmitTs >= 110) {
                state.micLastEmitTs = now;
                state.socket.emit('mic_speaking_level', { slot, level: Number(level.toFixed(2)) });
              }
            }
          } else {
            const remRec = m.holderSocketId ? state.micAnalysers.get(`remote:${m.holderSocketId}`) : null;
            if (remRec) {
              remRec.analyser.getByteFrequencyData(remRec.dataArray);
              let sum = 0;
              for (let i = 0; i < remRec.dataArray.length; i += 1) sum += remRec.dataArray[i];
              const raw = Math.min(1, (sum / (remRec.dataArray.length * 110)));
              remRec.smoothed = remRec.smoothed * 0.65 + raw * 0.35;
              level = remRec.smoothed;
            }
            const sockLvl = state.micLevelBySlot.get(slot);
            if (sockLvl && now - sockLvl.ts < 650) {
              level = Math.max(level, sockLvl.level);
            }
          }
        }
        const btn = $('micSlotsContainer')?.querySelector(`.mic-slot-btn[data-mic-slot="${slot}"]`);
        if (btn) {
          btn.style.setProperty('--mic-level', level.toFixed(2));
          btn.classList.toggle('is-speaking-live', level > 0.08);
        }
      }

      state.micWaveRaf = requestAnimationFrame(tick);
    };
    state.micWaveRaf = requestAnimationFrame(tick);
  }

  function closeAllMicPeers() {
    for (const pc of state.micPeers.values()) {
      try {
        pc.close();
      } catch {
        // ignore
      }
    }
    state.micPeers.clear();
    for (const key of [...state.micAnalysers.keys()]) {
      if (key.startsWith('remote:')) cleanupMicAnalyser(key);
    }
    $('webrtcAudioContainer').innerHTML = '';
  }

  function stopLocalMicStream() {
    cleanupMicAnalyser('local');
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
    setupMicAnalyser(`remote:${remoteSocketId}`, stream, false);
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
        cleanupMicAnalyser(`remote:${remoteSocketId}`);
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
      if (state.localStream) setupMicAnalyser('local', state.localStream, true);
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
      startMicWaveformLoop();
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
    const wavesOn = Number(state.settings?.fx_mic_waves ?? 1) !== 0;
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
      const waveRingsHtml = isOccupied && !isMuted && wavesOn
        ? '<span class="mic-wave-ring r1" aria-hidden="true"></span><span class="mic-wave-ring r2" aria-hidden="true"></span>'
        : '';
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
            ${waveRingsHtml}
            ${avatarContent}
          </button>
          <span class="mic-slot-num-lbl">${escapeHtml(underLabel)}</span>
        </div>
      `;
    }).join('');

    if (wavesOn && (state.mics || []).some((m) => m.holderKey && !m.isSelfMuted && !m.isAdminMuted)) {
      startMicWaveformLoop();
    }

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
    const myName = String(state.user?.name || '').trim();
    const myUser = String(state.user?.username || '').trim();
    const mentionsMe =
      msg.msg_type === 'text' &&
      msg.sender_key !== state.user?.key &&
      (doesTextContainName(rawContent, myName) || doesTextContainName(rawContent, myUser));

    const timeStr = formatTimeAgo(msg.created_at_ms || msg.created_at);
    const msgFontSize = Math.max(13, Math.min(17, Number(msg.font_size || msg.fontSize) || 14));

    let inlineTextHtml = '';
    let mediaBelowHtml = '';
    let hasMention = false;
    if (msg.msg_type === 'image' && msg.media_url) {
      mediaBelowHtml = `<img src="${escapeHtml(msg.media_url)}" class="msg-media-img" alt="صورة" onclick="window.open(this.src,'_blank')" />`;
    } else if (msg.msg_type === 'audio' && msg.media_url) {
      mediaBelowHtml = `<audio controls src="${escapeHtml(msg.media_url)}" class="msg-audio-player"></audio>`;
    } else if (msg.msg_type === 'sticker') {
      inlineTextHtml = `<span class="msg-sticker-pill">${escapeHtml(msg.content || '✨')}</span>`;
    } else {
      const rendered = renderMessageTextWithMentions(msg.content);
      hasMention = rendered.hasMention;
      const prefix = isAdminNotice ? '<span class="admin-notice-prefix">إشعار الإدارة</span>' : '';
      const rawTxtColor = String(msg.text_color || '').trim();
      const readableColor = isAdminNotice
        ? '#fecaca'
        : (!rawTxtColor || !isReadableOnDarkBg(rawTxtColor) ? '#e2e8f0' : escapeHtml(rawTxtColor));
      const ff = `font-family:${resolveFontFamilyCss(msg.font_family || 'Cairo')};`;
      const fw = msg.font_style === 'Bold' ? 'font-weight:800;' : '';
      const fi = msg.font_style === 'Italic' ? 'font-style:italic;' : '';
      inlineTextHtml = `<span class="msg-text-inline" style="color:${readableColor};font-size:${msgFontSize}px;${ff}${fw}${fi}">${prefix}${rendered.html}</span>`;
    }

    const useOwnerPortal = isOwnerSender && !isAdminNotice && isOwnerGalaxyVisualEnabled();
    const useGlassBubbles = Number(state.settings?.fx_glass_bubbles ?? 1) !== 0;
    const tierMeta = getRankTierMeta(msg.sender_role || 'member');
    const rankTierClass = isOwnerSender ? 'rank-tier-owner' : tierMeta.msgClass;
    const rankGlowColor = isOwnerSender ? 'rgba(251, 191, 36, 0.62)' : tierMeta.glowColor;

    row.className = `cody-msg-row ${tierMeta.tierClass}${useGlassBubbles ? ` glass-bubble-msg ${rankTierClass}` : ''}${isAdminNotice ? ' admin-notice-row' : ''}${isGift ? ' gift-msg-row' : ''}${mentionsMe ? ' mention-for-me' : ''}${useOwnerPortal ? ' owner-royal-msg-row owner-portal-card' : (isOwnerSender && !isAdminNotice ? ' owner-gold-glass-fallback' : '')}`;
    if (useGlassBubbles && !useOwnerPortal) {
      row.style.setProperty('--msg-rank-glow', rankGlowColor);
    }
    if (msg.client_msg_id) row.dataset.clientMsgId = msg.client_msg_id;
    if (msg.id) row.dataset.msgId = String(msg.id);

    const isMe = state.user && msg.sender_key === state.user.key;
    const isOwner = state.user?.role === 'site_owner';
    const targetObj = {
      key: msg.sender_key,
      name: msg.sender_name,
      role: msg.sender_role,
      avatarUrl: msg.avatar_url,
      avatarFrame: msg.avatar_frame,
      nameplateStyle: msg.nameplate_style,
      nameShine: msg.name_shine,
      nameAnim: msg.name_anim || 'none',
      nameAnimSpeed: msg.name_anim_speed || 'normal',
      vipWings: msg.vip_wings,
      nameColor: msg.name_color,
      nameBgColor: msg.name_bg_color,
      neonColor: msg.neon_color,
      nameFontSize: msg.name_font_size || 14,
      nameStyleMode: msg.name_style_mode || 'solid',
      nameGradient: msg.name_gradient || 'gold_royal'
    };
    const canActOnTarget = !isMe && canManageTargetUser(targetObj);
    const canClearRoom = isOwner || state.isRoomManager || hasPerm('clear_room');
    const canDelete = (isMe && Boolean(msg.id)) || (Boolean(msg.id) && canActOnTarget && (isOwner || state.isRoomManager || hasPerm('delete_msg') || hasPerm('clear_room')));
    const canWarn = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('mute') || hasPerm('kick') || hasPerm('ban'));
    const canMute = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('mute'));
    const canKick = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('kick'));
    const canBan = canActOnTarget && (isOwner || hasPerm('ban'));
    const canRank = canActOnTarget && String(msg.sender_key || '').startsWith('user:') && (isOwner || hasPerm('set_rank'));

    row.innerHTML = `
      ${useOwnerPortal ? '<span class="owner-portal-edge-dots" aria-hidden="true"></span>' : ''}
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
              <button type="button" class="msg-dots-btn" title="خيارات الرسالة والعضو"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              <div class="msg-dots-menu hidden">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:12.5px;">
                  <span>خيارات: ${escapeHtml(msg.sender_name || 'العضو')}</span>
                  <button type="button" class="btn-secondary btn-xs msg-dots-close-btn" style="padding:2px 8px;min-height:24px;">✕</button>
                </div>
                <button type="button" data-msg-act="mention"><i class="fa-solid fa-bullhorn"></i> نداء العضو</button>
                ${!isMe ? '<button type="button" data-msg-act="pm"><i class="fa-solid fa-envelope"></i> رسالة خاصة</button>' : ''}
                <button type="button" data-msg-act="profile"><i class="fa-solid fa-id-card"></i> بطاقة العضو</button>
                ${isOwner && msg.msg_type === 'text' ? '<button type="button" data-msg-act="pin"><i class="fa-solid fa-thumbtack"></i> تثبيت في الغرفة</button>' : ''}
                ${canDelete ? '<button type="button" class="danger" data-msg-act="delete"><i class="fa-solid fa-trash"></i> حذف الرسالة</button>' : ''}
                ${canClearRoom ? '<button type="button" class="danger" data-msg-act="clear_room"><i class="fa-solid fa-broom"></i> مسح الغرفة</button>' : ''}
                ${canWarn ? '<button type="button" data-msg-act="warn"><i class="fa-solid fa-triangle-exclamation"></i> تحذير العضو</button>' : ''}
                ${canMute ? '<button type="button" data-msg-act="mute"><i class="fa-solid fa-volume-xmark"></i> كتم مؤقت</button>' : ''}
                ${canKick ? '<button type="button" data-msg-act="kick"><i class="fa-solid fa-door-open"></i> طرد من الغرفة</button>' : ''}
                ${canRank ? '<button type="button" data-msg-act="rank"><i class="fa-solid fa-award"></i> رفع / تنزيل الرتبة</button>' : ''}
                ${canBan ? '<button type="button" class="danger" data-msg-act="ban"><i class="fa-solid fa-ban"></i> حظر نهائي</button>' : ''}
              </div>
            </div>
          </div>
        </div>
        ${mediaBelowHtml}
      </div>
    `;

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
    dotsMenu.querySelector('.msg-dots-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dotsMenu.classList.add('hidden');
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
        } else if (act === 'delete' && msg.id) {
          state.socket?.emit('delete_message', { msgId: msg.id });
        } else if (act === 'clear_room') {
          if (confirm('مسح جميع رسائل هذه الغرفة؟')) state.socket?.emit('admin_clear_room');
        } else if (act === 'warn') {
          openQuickUserModal(targetObj, { initialTab: 'admin', initialAction: 'warn' });
        } else if (act === 'mute') {
          openQuickUserModal(targetObj, { initialTab: 'admin', initialAction: 'mute' });
        } else if (act === 'kick') {
          openQuickUserModal(targetObj, { initialTab: 'admin', initialAction: 'kick' });
        } else if (act === 'rank') {
          openQuickUserModal(targetObj, { initialTab: 'admin' });
        } else if (act === 'ban') {
          openQuickUserModal(targetObj, { initialTab: 'admin', initialAction: 'ban' });
        }
      });
    });

    return row;
  }

  function renderAllMessages() {
    const feed = $('chatFeed');
    feed.innerHTML = '';
    for (const m of state.messages) {
      const ts = Number(m.created_at_ms) || 0;
      if (ts > (state.lastRoomMsgTs || 0)) state.lastRoomMsgTs = ts;
      feed.appendChild(createMessageRowElement(m));
    }
    feed.scrollTop = feed.scrollHeight;
  }

  function appendOrReconcileMessage(msg) {
    const feed = $('chatFeed');
    const msgTs = Number(msg.created_at_ms) || 0;
    if (msg.id && msgTs > (state.lastRoomMsgTs || 0)) state.lastRoomMsgTs = msgTs;
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
      const isRoyal = (payload.kind === 'royal_join' || isExclusiveOwnerObj(u)) && isOwnerGalaxyVisualEnabled();
      const row = document.createElement('div');
      row.className = `cody-msg-row cody-join-row${isRoyal ? ' owner-royal-msg-row owner-portal-card' : ''}`;
      row.innerHTML = `
        ${isRoyal ? '<span class="owner-portal-edge-dots" aria-hidden="true"></span>' : ''}
        <div class="msg-avatar-trigger" style="cursor:pointer" title="بطاقة العضو">${formatAvatarHTML(u, '')}</div>
        <div class="msg-body-col">
          <div class="msg-head-line">
            <div class="msg-inline-main">
              ${roleBadgeHTML(u.role, true)}
              <span class="msg-name-trigger" style="cursor:pointer" title="اضغط لنداء العضو">${formatNameHTML(u)}</span>
              <span class="${isRoyal ? 'join-royal-bar' : 'join-maroon-bar'}"><i class="fa-solid ${isRoyal ? 'fa-meteor' : 'fa-check'}"></i> ${isRoyal ? 'تشريف أسطوري: دخل سيد المجرة والزمن' : 'انضم إلى الغرفة الآن'}</span>
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
    if (!list) return;

    const mergedMap = new Map();
    for (const m of state.persistentMembers || []) {
      if (!m || !m.key) continue;
      mergedMap.set(m.key, { ...m, online: Boolean(m.online), inCurrentRoom: false });
    }
    for (const ou of state.onlineUsers || []) {
      if (!ou || !ou.key) continue;
      const prev = mergedMap.get(ou.key) || {};
      mergedMap.set(ou.key, { ...prev, ...ou, online: true });
    }
    for (const ru of state.roomUsers || []) {
      if (!ru || !ru.key) continue;
      const prev = mergedMap.get(ru.key) || {};
      mergedMap.set(ru.key, { ...prev, ...ru, online: true, inCurrentRoom: true });
    }

    const tierWeight = (roleKey) => {
      const p = Number(getRank(roleKey)?.power);
      if (Number.isFinite(p) && p > 0) return p;
      const fallbackMap = {
        site_owner: 15,
        co_owner: 14,
        general_admin: 13,
        super_owner: 12,
        owner: 11,
        super_admin: 10,
        admin: 9,
        premium: 8,
        royal_vip: 7,
        royal_member: 6,
        gold_member: 5,
        silver_member: 4,
        bronze_member: 3,
        member: 2,
        guest: 1
      };
      return fallbackMap[String(roleKey || '').toLowerCase()] || 1;
    };

    const mergedUsers = Array.from(mergedMap.values()).sort((a, b) => {
      const aOn = a.online ? 1 : 0;
      const bOn = b.online ? 1 : 0;
      if (bOn !== aOn) return bOn - aOn;
      const aRm = a.inCurrentRoom ? 1 : 0;
      const bRm = b.inCurrentRoom ? 1 : 0;
      if (bRm !== aRm) return bRm - aRm;
      const pDiff = tierWeight(b.role) - tierWeight(a.role);
      if (pDiff !== 0) return pDiff;
      return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
    });

    const onlineCount = mergedUsers.filter((u) => u.online).length;
    const roomOnlineCount = state.roomUsers.length;
    const boosted = Math.max(roomOnlineCount, Number(state.currentRoom?.onlineCount || 0));
    if ($('roomOnlineCounter')) $('roomOnlineCounter').textContent = String(boosted);
    if ($('sideOnlineCount')) $('sideOnlineCount').textContent = String(onlineCount);
    if ($('sideTotalCount')) $('sideTotalCount').textContent = String(mergedUsers.length);

    list.innerHTML = mergedUsers.map((u) => {
      const meta = getRankTierMeta(u.role);
      return `
      <div class="user-row-card ${meta.tierClass} ${u.online ? 'is-online' : 'is-offline'}" data-user-key="${escapeHtml(u.key)}">
        <div class="user-row-avatar-btn" style="cursor:pointer" title="بطاقة العضو">
          ${formatAvatarHTML(u, 'sm')}
          <span class="member-presence-dot ${u.online ? 'online' : 'offline'}" title="${u.online ? 'متصل الآن' : 'غير متصل'}"></span>
        </div>
        <div class="user-row-info">
          <div class="user-row-name user-row-name-btn" style="cursor:pointer" title="اضغط لنداء العضو">${formatNameHTML(u)}</div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:2px;">
            ${roleBadgeHTML(u.role)}
            <span class="user-status-chip ${u.online ? 'online' : 'offline'}">${u.online ? '🟢 متصل' : '⚪ غير متصل'}</span>
            <span class="muted">🔥${u.activityPoints || 0}</span>
          </div>
        </div>
        <div class="user-row-actions">
          <button type="button" class="user-mini-ping-btn" title="نداء العضو"><i class="fa-solid fa-bullhorn"></i></button>
        </div>
      </div>
    `;
    }).join('');

    list.querySelectorAll('.user-row-card').forEach((card) => {
      const u = mergedUsers.find((x) => x.key === card.dataset.userKey);
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
      name_font_size: u.nameFontSize || 14,
      name_style_mode: u.nameStyleMode || 'solid',
      name_gradient: u.nameGradient || 'gold_royal',
      avatar_url: u.avatarUrl,
      avatar_frame: u.avatarFrame,
      nameplate_style: u.nameplateStyle,
      name_shine: u.nameShine,
      name_anim: u.nameAnim || 'none',
      name_anim_speed: u.nameAnimSpeed || 'normal',
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
    refreshLucideIcons();
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

  // ==========================================
  // LUXURY MEMBER PROFILE CARD + INLINE ADMIN TAB
  // ==========================================
  async function openQuickUserModal(rawUser, opts = {}) {
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
    if (!u.nameAnim && liveMatch?.nameAnim) u.nameAnim = liveMatch.nameAnim;
    if (!u.nameAnimSpeed && liveMatch?.nameAnimSpeed) u.nameAnimSpeed = liveMatch.nameAnimSpeed;

    const isMe = state.user && u.key === state.user.key;
    if (isMe && !state.user?.isGuest) {
      openCustomizeModal('info');
      return;
    }

    const isReg = u.key && String(u.key).startsWith('user:');
    const targetUserId = isReg ? Number(String(u.key).replace('user:', '')) : null;
    const isOwner = state.user?.role === 'site_owner';
    const isTargetOwner =
      u.role === 'site_owner' ||
      u.isSupremeOwner ||
      String(u.email || '').toLowerCase() === 'a38125923@gmail.com';
    const isTargetOwnerGalaxy = isTargetOwner && isOwnerGalaxyVisualEnabled();
    const allowedByImmunity = !isMe && !isTargetOwner && canManageTargetUser(u);
    const canMod = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('mute') || hasPerm('kick') || hasPerm('clear_room') || hasPerm('set_rank') || hasPerm('access_panel'));
    const canBan = allowedByImmunity && (isOwner || hasPerm('ban'));
    const canKick = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('kick'));
    const canClearRoom = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('clear_room'));
    const canRank = Boolean(targetUserId) && allowedByImmunity && (isOwner || hasPerm('set_rank'));
    const canGiveCoins = Boolean(targetUserId) && (isOwner || (allowedByImmunity && hasPerm('give_coins')));
    const showAdminTab = Boolean(allowedByImmunity && (canMod || canBan || canKick || canClearRoom || canRank || canGiveCoins || isOwner));
    const canGift = !isMe && !state.user?.isGuest && isFeatureEnabled('feat_gifts') && (isOwner || hasPerm('gifts'));
    const canPmTarget = !isMe && u.allowPm !== false && isFeatureEnabled('feat_pm') && (isOwner || (passesSettingRankThreshold('min_rank_pm') && hasPerm('pm')));
    const hasMusic = Boolean(u.profileMusic && String(u.profileMusic).trim());
    const musicLabelMap = {
      'preset:calm_lofi': 'أنغام هادئة',
      'preset:royal_oud': 'نغمة ملكية',
      'preset:ambient_stars': 'أوتار ليلية'
    };
    const musicLabel = hasMusic ? (musicLabelMap[u.profileMusic] || 'موسيقى بروفايل مخصصة') : '';
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

    const assignableRanks = canRank ? getAssignableRanksForActor() : [];
    const currentRoleObj = getRank(u.role);
    const rankSelectOptionsHtml = canRank
      ? [
          ...(assignableRanks.some((r) => r.key === u.role) ? [] : [currentRoleObj]),
          ...assignableRanks
        ].map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === u.role ? 'selected' : ''}>${escapeHtml(r.icon || '⭐')} ${escapeHtml(r.label)}</option>`).join('')
      : '';

    $('quickUserBody').innerHTML = `
      <div class="profile-luxury-card ${escapeHtml(bgEffectClass)}${isTargetOwnerGalaxy ? ' owner-black-gold-theme owner-galaxy-theme' : ''}">
        <div class="${isTargetOwnerGalaxy ? 'owner-cosmic-bg-layer' : 'profile-bg-effect-layer'}"></div>
        <div class="profile-cover-hero" id="quCoverHero" style="${u.coverUrl ? `background-image:url('${escapeHtml(u.coverUrl)}')` : ''}">
          ${isTargetOwnerGalaxy ? '<div class="owner-cosmic-cover-vortex" aria-hidden="true"></div>' : ''}
          ${u.coverUrl ? `<img src="${escapeHtml(u.coverUrl)}" class="profile-cover-img" alt="" />` : ''}
          <div class="profile-cover-overlay"></div>
          ${isTargetOwnerGalaxy ? '<span class="owner-galaxy-corner-seal"><i class="fa-solid fa-meteor"></i> سيد المجرة والزمن</span>' : ''}
          <div class="profile-cover-top-actions cover-actions-left">
            <button type="button" class="rtl-back-pill cover-close-x-btn" id="quHeroCloseBtn" title="رجوع"><i class="fa-solid fa-arrow-right"></i> <span>رجوع</span></button>
            <button type="button" class="hero-circle-glass-btn" id="quCoverPreviewToggleBtn" title="معاينة صورة الغلاف"><i class="fa-solid fa-eye"></i></button>
          </div>
          <div class="profile-cover-stats-bar">
            <button type="button" class="hero-stat-pill" id="quLikeBtn" title="إعجاب"><i class="fa-solid fa-thumbs-up" style="color:#38bdf8;"></i> <i class="fa-solid fa-heart" style="color:#fb7185;"></i> <span id="quLikesCount">${Number(u.likesCount || 0)}</span></button>
            <div class="hero-stat-pill" title="النجوم والتقييم"><i class="fa-solid fa-star" style="color:#fbbf24;"></i> <span id="quRatingAvg">${avgRating}</span></div>
            <div class="hero-stat-pill" title="الروبي"><i class="fa-solid fa-gem" style="color:#f43f5e;"></i> <span id="quHeroCoinsVal">${Number(u.coins || 0)}</span></div>
          </div>
        </div>

        <div class="profile-centered-identity">
          <div class="profile-avatar-85-stage${isTargetOwnerGalaxy ? ' owner-cosmic-avatar-stage' : ''}">
            ${isTargetOwnerGalaxy ? '<span class="owner-avatar-cosmic-halo" aria-hidden="true"></span>' : ''}
            ${formatAvatarHTML(u, 'profile-avatar-85')}
          </div>
          <div class="profile-name-row-center" id="quHeaderNameRow">
            ${roleBadgeHTML(u.role, true)}
            ${formatNameHTML(u)}
          </div>
          <div class="profile-role-subtitle" id="quHeaderRoleSub">${isTargetOwnerGalaxy ? '<span class="owner-galaxy-title-pill"><i class="fa-solid fa-meteor"></i> سيد المجرة والزمن</span> ' : ''}${escapeHtml(getRank(u.role).label)} • المستوى ${Math.max(1, Number(u.level) || Number(getRank(u.role).power) || 1)} ${u.vipFamily ? `• <i class="fa-solid fa-crown"></i> ${escapeHtml(u.vipFamily)}` : ''}</div>
          ${u.bio ? `<p class="profile-bio-line">${escapeHtml(u.bio)}</p>` : ''}
          ${hasMusic ? `
            <div class="profile-mini-music-bar">
              <button type="button" class="mini-music-play-btn" id="quMusicToggleBtn" title="تشغيل/إيقاف موسيقى البروفايل"><i class="fa-solid fa-play"></i></button>
              <span class="mini-music-eq" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="mini-music-label">${escapeHtml(musicLabel)}</span>
            </div>` : ''}
          <div class="qu-star-rating-row" id="quStarRatingRow" title="قيّم هذا العضو">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-rate-btn" data-star="${n}"><i class="fa-solid fa-star"></i></button>`).join('')}
          </div>
          <div class="qu-quick-action-strip">
            <button type="button" class="btn-secondary btn-xs" id="quMentionBtn"><i class="fa-solid fa-bullhorn"></i> نداء</button>
            ${canPmTarget ? '<button type="button" class="btn-primary btn-xs" id="quPmBtn"><i class="fa-solid fa-envelope"></i> رسالة</button>' : ''}
            ${!isMe && !state.user?.isGuest && isReg ? '<button type="button" class="btn-secondary btn-xs" id="quFriendBtn"><i class="fa-solid fa-user-plus"></i> صداقة</button>' : ''}
            ${canGift ? '<button type="button" class="btn-primary btn-xs" style="background:#db2777" id="quGiftBtn"><i class="fa-solid fa-gift"></i> هدية</button>' : ''}
          </div>
        </div>

        <div class="profile-lower-dark-stage">
          <div class="profile-6tabs-bar" id="quTabsBar">
            <button type="button" class="qu-tab active" data-qu-tab="info"><i class="fa-solid fa-circle-info"></i><span>المعلومات</span></button>
            <button type="button" class="qu-tab" data-qu-tab="friends"><i class="fa-solid fa-user-group"></i><span>الأصدقاء</span></button>
            <button type="button" class="qu-tab" data-qu-tab="gifts"><i class="fa-solid fa-gift"></i><span>الهدايا</span></button>
            <button type="button" class="qu-tab" data-qu-tab="relations"><i class="fa-solid fa-heart-pulse"></i><span>العلاقات</span></button>
            <button type="button" class="qu-tab" data-qu-tab="posts"><i class="fa-solid fa-newspaper"></i><span>المنشورات</span></button>
            ${showAdminTab
              ? '<button type="button" class="qu-tab admin-tab-pill" data-qu-tab="admin"><i class="fa-solid fa-shield-halved"></i><span>الإدارة</span></button>'
              : '<button type="button" class="qu-tab" data-qu-tab="more"><i class="fa-solid fa-ellipsis"></i><span>المزيد</span></button>'}
          </div>

          <div class="profile-tab-content">
            <div id="quPane_info" class="qu-pane">
              <div class="rank-duo-grid">
                <div class="rank-duo-card rich rich-green">
                  <span class="rd-label"><i class="fa-solid fa-gem"></i> ترتيب الأثرياء</span>
                  <strong>${richRank > 0 ? `#${richRank}` : '—'}</strong>
                </div>
                <div class="rank-duo-card interaction interaction-blue">
                  <span class="rd-label"><i class="fa-solid fa-fire"></i> ترتيب التفاعل</span>
                  <strong>${interactionRank > 0 ? `#${interactionRank}` : '—'}</strong>
                </div>
              </div>
              <div class="info-kv-list">
                <div class="info-kv-row"><span><i class="fa-solid fa-ranking-star"></i> المستوى</span><strong>المستوى ${Math.max(1, Number(u.level) || Number(getRank(u.role).power) || 1)}</strong></div>
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

            ${showAdminTab ? `
              <div id="quPane_admin" class="qu-pane hidden">
                <div class="qu-inline-admin-wrap">
                  ${canRank ? `
                    <div class="qu-inline-admin-rank-box">
                      <select id="quInlineRankSelect">${rankSelectOptionsHtml}</select>
                      <button type="button" id="quInlineRankSaveBtn" class="btn-primary btn-xs"><i class="fa-solid fa-check"></i> حفظ الرتبة</button>
                    </div>
                  ` : ''}

                  <div class="qu-admin-actions-grid">
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn warning" id="quWarnBtn"><i class="fa-solid fa-triangle-exclamation"></i><span>تحذير</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn warning" id="quMuteBtn"><i class="fa-solid fa-volume-xmark"></i><span>كتم مؤقت</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn info" id="quUnmuteBtn"><i class="fa-solid fa-volume-high"></i><span>فك الكتم</span></button>' : ''}
                    ${canKick ? '<button type="button" class="qu-admin-grid-btn danger" id="quKickBtn"><i class="fa-solid fa-door-open"></i><span>طرد</span></button>' : ''}
                    ${canBan ? '<button type="button" class="qu-admin-grid-btn danger" id="quBanBtn"><i class="fa-solid fa-ban"></i><span>حظر</span></button>' : ''}
                    ${canBan ? '<button type="button" class="qu-admin-grid-btn danger" id="quXBanBtn"><i class="fa-solid fa-shield-virus"></i><span>إكس باند</span></button>' : ''}
                    ${isOwner ? `<button type="button" class="qu-admin-grid-btn info" id="quFreezeUserBtn"><i class="fa-solid fa-snowflake"></i><span>${u.isFrozen ? 'فك التجميد' : 'تجميد'}</span></button>` : ''}
                    ${isOwner ? '<button type="button" class="qu-admin-grid-btn info" id="quMoveRoomBtn"><i class="fa-solid fa-right-left"></i><span>سحب للغرفة</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn" id="quRenameUserBtn"><i class="fa-solid fa-pen"></i><span>تغيير الاسم</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn warning" id="quClearAvatarBtn"><i class="fa-solid fa-user-xmark"></i><span>مسح الصورة</span></button>' : ''}
                    ${canGiveCoins ? '<button type="button" class="qu-admin-grid-btn ruby" id="quCoinsBtn"><i class="fa-solid fa-gem"></i><span>منح روبي</span></button>' : ''}
                    ${isOwner ? `<button type="button" class="qu-admin-grid-btn" id="quShadowMuteBtn"><i class="fa-solid fa-user-ninja"></i><span>${u.isShadowMuted ? 'فك كتم صامت' : 'كتم صامت'}</span></button>` : ''}
                    ${canMod && targetUserId ? `<button type="button" class="qu-admin-grid-btn" id="quGhostBtn"><i class="fa-solid fa-ghost"></i><span>${u.isGhosted ? 'إلغاء شبح' : 'وضع الشبح'}</span></button>` : ''}
                    ${canClearRoom ? '<button type="button" class="qu-admin-grid-btn danger" id="quClearRoomBtn"><i class="fa-solid fa-broom"></i><span>مسح الغرفة</span></button>' : ''}
                    ${isOwner && targetUserId ? '<button type="button" class="qu-admin-grid-btn danger" id="quDeleteAccountBtn"><i class="fa-solid fa-user-slash"></i><span>حذف الحساب</span></button>' : ''}
                  </div>

                  <div id="quAdminInlineActionBox" class="qu-inline-action-box hidden"></div>
                </div>
              </div>
            ` : ''}

            <div id="quPane_more" class="qu-pane hidden">
              <div class="info-kv-list">
                <div class="info-kv-row"><span><i class="fa-solid fa-phone"></i> استقبال المكالمات</span><strong>${u.allowCalls !== false ? 'مسموح' : 'مغلق'}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-message"></i> الرسائل الخاصة</span><strong>${u.allowPm !== false ? 'مفتوحة' : 'مغلقة'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('quHeroCloseBtn')?.addEventListener('click', () => closeModal('quickUserModal'));
    $('quCoverPreviewToggleBtn')?.addEventListener('click', () => {
      $('quCoverHero')?.classList.toggle('cover-preview-clean');
      $('quCoverPreviewToggleBtn')?.classList.toggle('active');
    });

    const allQuPanes = showAdminTab
      ? ['info', 'friends', 'gifts', 'relations', 'posts', 'admin', 'more']
      : ['info', 'friends', 'gifts', 'relations', 'posts', 'more'];

    $('quTabsBar')?.querySelectorAll('.qu-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.quTab;
        $('quTabsBar').querySelectorAll('.qu-tab').forEach((b) => b.classList.toggle('active', b === btn));
        allQuPanes.forEach((pane) => {
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
        $('quMusicToggleBtn').innerHTML = playing ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      }
    });

    $('quMentionBtn')?.addEventListener('click', () => {
      insertMention(u.name);
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

    // Inline Admin Tab Actions (inside #quPane_admin without popups)
    const inlineBox = $('quAdminInlineActionBox');
    const closeInlineBox = () => {
      if (inlineBox) {
        inlineBox.innerHTML = '';
        inlineBox.classList.add('hidden');
      }
    };
    const showInlinePrompt = ({ title, htmlBody, confirmText = 'تنفيذ', danger = false, onConfirm }) => {
      if (!inlineBox) return;
      inlineBox.classList.remove('hidden');
      inlineBox.innerHTML = `
        <div class="qu-inline-action-box-head">
          <span>${title}</span>
          <button type="button" id="quInlineBoxCloseBtn" class="btn-secondary btn-xs" style="min-height:24px;padding:2px 7px;">✕</button>
        </div>
        ${htmlBody}
        <div class="inline-row" style="justify-content:flex-end;">
          <button type="button" id="quInlineBoxCancelBtn" class="btn-secondary btn-xs">إلغاء</button>
          <button type="button" id="quInlineBoxConfirmBtn" class="${danger ? 'btn-danger' : 'btn-primary'} btn-xs">${escapeHtml(confirmText)}</button>
        </div>
      `;
      $('quInlineBoxCloseBtn')?.addEventListener('click', closeInlineBox);
      $('quInlineBoxCancelBtn')?.addEventListener('click', closeInlineBox);
      $('quInlineBoxConfirmBtn')?.addEventListener('click', () => onConfirm(inlineBox, closeInlineBox));
    };

    $('quInlineRankSaveBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      const newRole = $('quInlineRankSelect')?.value;
      if (!newRole) return;
      state.socket.emit('admin_set_role', { userId: targetUserId, newRole }, (res) => {
        if (res?.error) return showToast(res.error, true);
        u.role = newRole;
        const rk = getRank(newRole);
        if ($('quHeaderNameRow')) $('quHeaderNameRow').innerHTML = `${roleBadgeHTML(newRole, true)} ${formatNameHTML(u)}`;
        if ($('quHeaderRoleSub')) {
          $('quHeaderRoleSub').innerHTML = `${escapeHtml(rk.label)} ${u.vipFamily ? `• <i class="fa-solid fa-crown"></i> ${escapeHtml(u.vipFamily)}` : ''}`;
        }
        showToast(`تم حفظ رتبة "${u.name}" إلى ${rk.label}`);
      });
    });

    $('quWarnBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-triangle-exclamation" style="color:#d97706;"></i> توجيه تحذير إلى ${escapeHtml(u.name)}`,
        htmlBody: `<input type="text" id="quInlineWarnInput" placeholder="اكتب سبب التحذير (إلزامي)..." />`,
        confirmText: 'إرسال التحذير',
        onConfirm: (_box, done) => {
          const reason = ($('quInlineWarnInput')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة سبب التحذير (حرفين على الأقل).', true);
          state.socket.emit('admin_warn', { targetKey: u.key, reason }, (res) => {
            if (res?.error) return showToast(res.error, true);
            showToast(`تم إرسال التحذير إلى ${u.name}.`);
            done();
          });
        }
      });
    });

    $('quMuteBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-volume-xmark" style="color:#d97706;"></i> كتم مؤقت لـ "${escapeHtml(u.name)}"`,
        htmlBody: `
          <div class="form-grid-2">
            <div><label class="muted">المدة بالدقائق</label><input type="number" id="quInlineMuteMins" value="15" min="1" max="1440" /></div>
            <div><label class="muted">سبب الكتم (إلزامي)</label><input type="text" id="quInlineMuteReason" placeholder="اكتب سبب الكتم..." /></div>
          </div>
        `,
        confirmText: 'تأكيد الكتم',
        danger: true,
        onConfirm: (_box, done) => {
          const minutes = Number($('quInlineMuteMins')?.value);
          const reason = ($('quInlineMuteReason')?.value || '').trim();
          if (!Number.isFinite(minutes) || minutes < 1) {
            return showToast('يرجى تحديد مدة الكتم بالدقائق (1 فأكثر).', true);
          }
          if (reason.length < 2) {
            return showToast('يرجى كتابة سبب الكتم (حرفين على الأقل).', true);
          }
          state.socket.emit('admin_mute', { targetKey: u.key, minutes, reason }, (res) => {
            if (res?.error) return showToast(res.error, true);
            showToast(`تم كتم ${u.name} لمدة ${Math.round(minutes)} دقيقة.`);
            done();
          });
        }
      });
    });

    $('quUnmuteBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_mute', { targetKey: u.key, unmute: true }, (res) => {
        if (res?.error) return showToast(res.error, true);
        showToast(`تم فك الكتم عن ${u.name}.`);
      });
    });

    $('quKickBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-door-open" style="color:#dc2626;"></i> طرد "${escapeHtml(u.name)}" من الغرفة`,
        htmlBody: `<input type="text" id="quInlineKickReason" placeholder="اكتب سبب الطرد (إلزامي)..." />`,
        confirmText: 'تأكيد الطرد',
        danger: true,
        onConfirm: (_box, done) => {
          const reason = ($('quInlineKickReason')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة سبب الطرد (حرفين على الأقل).', true);
          state.socket.emit('admin_kick', { targetKey: u.key, reason }, (res) => {
            if (res?.error) return showToast(res.error, true);
            showToast(`تم طرد ${u.name} من الغرفة.`);
            done();
            closeModal('quickUserModal');
          });
        }
      });
    });

    $('quClearRoomBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: '<i class="fa-solid fa-broom" style="color:#dc2626;"></i> مسح جميع رسائل الغرفة؟',
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم حذف سجل الرسائل في هذه الغرفة للجميع.</div>',
        confirmText: 'تأكيد المسح',
        danger: true,
        onConfirm: (_box, done) => {
          state.socket.emit('admin_clear_room');
          showToast('تم مسح رسائل الغرفة.');
          done();
        }
      });
    });

    $('quGhostBtn')?.addEventListener('click', () => {
      const next = !u.isGhosted;
      state.socket.emit('admin_ghost', { targetKey: u.key, enabled: next }, (res) => {
        if (res?.error) return showToast(res.error, true);
        u.isGhosted = next;
        const lbl = $('quGhostBtn')?.querySelector('span');
        if (lbl) lbl.textContent = next ? 'إلغاء شبح' : 'وضع الشبح';
        showToast(next ? 'تم تفعيل وضع الشبح.' : 'تم إلغاء وضع الشبح.');
      });
    });

    $('quShadowMuteBtn')?.addEventListener('click', async () => {
      const next = !u.isShadowMuted;
      try {
        await api('/api/owner/action', { method: 'POST', body: { action: 'shadow_mute', targetKey: u.key, enabled: next } });
        u.isShadowMuted = next;
        const lbl = $('quShadowMuteBtn')?.querySelector('span');
        if (lbl) lbl.textContent = next ? 'فك كتم صامت' : 'كتم صامت';
        showToast(next ? 'تم تطبيق الكتم الصامت على العضو.' : 'تم إلغاء الكتم الصامت.');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quFreezeUserBtn')?.addEventListener('click', async () => {
      const next = !u.isFrozen;
      try {
        await api('/api/owner/action', { method: 'POST', body: { action: 'freeze_user', targetKey: u.key, enabled: next } });
        u.isFrozen = next;
        const lbl = $('quFreezeUserBtn')?.querySelector('span');
        if (lbl) lbl.textContent = next ? 'فك التجميد' : 'تجميد';
        showToast(next ? 'تم تجميد العضو (قراءة فقط).' : 'تم فك تجميد العضو.');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quMoveRoomBtn')?.addEventListener('click', () => {
      const opts = (state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('');
      showInlinePrompt({
        title: `<i class="fa-solid fa-right-left" style="color:#1d4ed8;"></i> سحب "${escapeHtml(u.name)}" إلى غرفة:`,
        htmlBody: `<select id="quInlineMoveRoomSel">${opts}</select>`,
        confirmText: 'سحب للغرفة',
        onConfirm: async (_box, done) => {
          const toRoomId = $('quInlineMoveRoomSel')?.value;
          if (!toRoomId) return;
          try {
            await api('/api/owner/action', { method: 'POST', body: { action: 'move_user', targetKey: u.key, toRoomId } });
            showToast('تم سحب ونقل العضو للغرفة المحددة.');
            done();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    $('quRenameUserBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-pen"></i> تغيير اسم "${escapeHtml(u.name)}"`,
        htmlBody: `<input type="text" id="quInlineRenameInput" value="${escapeHtml(u.name || '')}" maxlength="28" placeholder="الاسم الجديد..." />`,
        confirmText: 'حفظ الاسم',
        onConfirm: (_box, done) => {
          const newDisplayName = ($('quInlineRenameInput')?.value || '').trim();
          if (newDisplayName.length < 2) return showToast('أدخل اسماً من حرفين على الأقل.', true);
          state.socket.emit('admin_force_name', { userId: targetUserId, targetKey: u.key, newDisplayName }, (res) => {
            if (res?.error) return showToast(res.error, true);
            u.name = newDisplayName;
            u.displayName = newDisplayName;
            if ($('quHeaderNameRow')) $('quHeaderNameRow').innerHTML = `${roleBadgeHTML(u.role, true)} ${formatNameHTML(u)}`;
            showToast(`تم تغيير الاسم إلى "${newDisplayName}".`);
            done();
          });
        }
      });
    });

    $('quClearAvatarBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-user-xmark" style="color:#d97706;"></i> مسح الصورة الرمزية لـ "${escapeHtml(u.name)}"؟`,
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم إزالة الصورة الشخصية والعودة للحرف الافتراضي.</div>',
        confirmText: 'مسح الصورة',
        danger: true,
        onConfirm: (_box, done) => {
          state.socket.emit('admin_clear_avatar', { userId: targetUserId, targetKey: u.key }, (res) => {
            if (res?.error) return showToast(res.error, true);
            u.avatarUrl = '';
            const stage = $('quickUserBody')?.querySelector('.profile-avatar-85-stage');
            if (stage) stage.innerHTML = formatAvatarHTML(u, 'profile-avatar-85');
            showToast('تم مسح صورة العضو بنجاح.');
            done();
          });
        }
      });
    });

    $('quCoinsBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      showInlinePrompt({
        title: `<i class="fa-solid fa-gem" style="color:#be123c;"></i> منح عملات / روبي لـ "${escapeHtml(u.name)}"`,
        htmlBody: `<input type="number" id="quInlineRubyAmount" value="100" min="-100000" max="100000" placeholder="الكمية (+ لإضافة أو - للخصم)" />`,
        confirmText: 'تطبيق الرصيد',
        onConfirm: (_box, done) => {
          const amount = Number($('quInlineRubyAmount')?.value) || 0;
          if (!amount) return showToast('أدخل كمية صحيحة.', true);
          state.socket.emit('admin_give_coins', { userId: targetUserId, amount }, (res) => {
            if (res?.error) return showToast(res.error, true);
            u.coins = res?.coins ?? (Number(u.coins || 0) + amount);
            if ($('quHeroCoinsVal')) $('quHeroCoinsVal').textContent = `${u.coins} روبي`;
            showToast(`تم تحديث رصيد ${u.name} (${amount >= 0 ? `+${amount}` : amount} روبي).`);
            done();
          });
        }
      });
    });

    $('quXBanBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-shield-virus" style="color:#dc2626;"></i> إكس باند (حظر الجهاز) لـ "${escapeHtml(u.name)}"`,
        htmlBody: `<input type="text" id="quInlineXBanReason" placeholder="اكتب سبب الإكس باند (إلزامي)..." />`,
        confirmText: 'تأكيد إكس باند',
        danger: true,
        onConfirm: (_box, done) => {
          const reason = ($('quInlineXBanReason')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة سبب الإكس باند (حرفين على الأقل).', true);
          state.socket.emit('admin_ban', { targetKey: u.key, reason, banType: 'xban' }, (res) => {
            if (res?.error) return showToast(res.error, true);
            showToast('تم تنفيذ إكس باند وحظر الجهاز نهائياً.');
            done();
            closeModal('quickUserModal');
          });
        }
      });
    });

    $('quBanBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-ban" style="color:#dc2626;"></i> حظر نهائي لـ "${escapeHtml(u.name)}"`,
        htmlBody: `<input type="text" id="quInlineBanReason" placeholder="اكتب سبب الحظر (إلزامي)..." />`,
        confirmText: 'تأكيد الحظر',
        danger: true,
        onConfirm: (_box, done) => {
          const reason = ($('quInlineBanReason')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة سبب الحظر (حرفين على الأقل).', true);
          state.socket.emit('admin_ban', { targetKey: u.key, reason, banType: 'ban' }, (res) => {
            if (res?.error) return showToast(res.error, true);
            showToast('تم حظر العضو نهائياً.');
            done();
            closeModal('quickUserModal');
          });
        }
      });
    });

    $('quDeleteAccountBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      showInlinePrompt({
        title: `<i class="fa-solid fa-user-slash" style="color:#dc2626;"></i> حذف حساب "${escapeHtml(u.name)}" نهائياً؟`,
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم مسح الحساب بالكامل من قاعدة البيانات ولا يمكن التراجع.</div>',
        confirmText: 'نعم، احذف الحساب',
        danger: true,
        onConfirm: (_box, done) => {
          state.socket.emit('admin_delete_account', { userId: targetUserId }, (res) => {
            if (res?.error) showToast(res.error, true);
            else {
              showToast('تم حذف حساب العضو نهائياً.');
              done();
              closeModal('quickUserModal');
            }
          });
        }
      });
    });

    openModal('quickUserModal');

    if (opts?.initialTab === 'admin' && showAdminTab) {
      $('quTabsBar')?.querySelector('.qu-tab[data-qu-tab="admin"]')?.click();
      const actionMap = {
        warn: 'quWarnBtn',
        mute: 'quMuteBtn',
        kick: 'quKickBtn',
        ban: 'quBanBtn',
        clear_room: 'quClearRoomBtn'
      };
      const targetBtnId = opts?.initialAction ? actionMap[opts.initialAction] : '';
      if (targetBtnId) $(targetBtnId)?.click();
    }
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
    ['color', 'gradient', 'neon', 'bg'].forEach((t) => {
      $(`nameStylePane_${t}`)?.classList.toggle('hidden', t !== tab);
    });
    $('nameColorSwatches')?.classList.toggle('hidden', tab === 'gradient');
    if ($('custNameStyleMode')) {
      if (tab === 'color') $('custNameStyleMode').value = 'solid';
      else if (tab === 'gradient') $('custNameStyleMode').value = 'gradient';
      else if (tab === 'neon') $('custNameStyleMode').value = 'glow';
    }
    renderNameColorSwatches();
    updateCustomizePreview();
  }

  function renderNameColorSwatches() {
    const box = $('nameColorSwatches');
    if (!box) return;
    let activeHex = '';
    if (state.activeNameStyleTab === 'color' && $('custNameColor')) {
      activeHex = ($('custNameColor').value || '').toLowerCase();
    } else if (state.activeNameStyleTab === 'neon' && $('custNeonColor')) {
      activeHex = $('custNeonColor').dataset.cleared === '1' ? '' : ($('custNeonColor').value || '').toLowerCase();
    } else if (state.activeNameStyleTab === 'bg' && $('custNameBgColor')) {
      activeHex = $('custNameBgColor').dataset.cleared === '1' ? '' : ($('custNameBgColor').value || '').toLowerCase();
    }
    box.innerHTML = NAME_COLOR_SWATCHES.map((hex) => {
      const isActive = activeHex && activeHex === hex.toLowerCase();
      const whiteCheckFix = isActive && hex.toLowerCase() === '#ffffff'
        ? 'color:#0f172a;text-shadow:none;'
        : '';
      return `<button type="button" class="swatch-dot${isActive ? ' active' : ''}" data-swatch="${hex}" style="background:${hex};${whiteCheckFix}" title="${hex}">${isActive ? '<i class="fa-solid fa-check"></i>' : ''}</button>`;
    }).join('');
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
    $('custCoverHero')?.classList.remove('cover-preview-clean');
    $('custCoverPreviewToggleBtn')?.classList.remove('active');
    $('custDisplayName').value = u.displayName || u.name || '';
    $('custVipFamily').value = u.vipFamily || '';
    $('custBioInput').value = u.bio || '';
    if ($('custAgeInput')) $('custAgeInput').value = u.age ? String(u.age) : '';
    if ($('custGenderSelect')) $('custGenderSelect').value = u.gender || '';
    if ($('custCountryInput')) $('custCountryInput').value = u.country || '';

    $('custNameColor').value = /^#[0-9a-f]{6}$/i.test(u.nameColor || '') ? u.nameColor : '#f8fafc';
    $('custTextColor').value = /^#[0-9a-f]{6}$/i.test(u.textColor || '') ? u.textColor : '#e2e8f0';
    $('custNameBgColor').value = /^#[0-9a-f]{6}$/i.test(u.nameBgColor || '') ? u.nameBgColor : '#1e293b';
    $('custNameBgColor').dataset.cleared = u.nameBgColor ? '0' : '1';
    $('custNeonColor').value = /^#[0-9a-f]{6}$/i.test(u.neonColor || '') ? u.neonColor : '#38bdf8';
    $('custNeonColor').dataset.cleared = u.neonColor ? '0' : '1';
    const fontSelect = $('custFontFamily');
    if (fontSelect) {
      const wanted = u.fontFamily || 'Cairo';
      const hasOption = Array.from(fontSelect.options).some((opt) => opt.value === wanted);
      fontSelect.value = hasOption ? wanted : 'Cairo';
    }
    $('custFontStyle').value = u.fontStyle || 'Normal';
    if ($('custNameFontSize')) {
      const nfsz = Math.max(13, Math.min(18, Number(u.nameFontSize) || 14));
      $('custNameFontSize').value = String(nfsz);
      if ($('custNameFontSizeVal')) $('custNameFontSizeVal').textContent = String(nfsz);
    }
    if ($('custFontSize')) {
      const fsz = Math.max(13, Math.min(17, Number(u.fontSize) || 14));
      $('custFontSize').value = String(fsz);
      if ($('custFontSizeVal')) $('custFontSizeVal').textContent = String(fsz);
    }
    if ($('custNameStyleMode')) {
      $('custNameStyleMode').value = ['solid', 'gradient', 'glow'].includes(u.nameStyleMode) ? u.nameStyleMode : 'solid';
    }
    if ($('custNameGradient')) {
      $('custNameGradient').value = u.nameGradient || 'gold_royal';
    }
    if ($('custMuteSoundsToggle')) {
      $('custMuteSoundsToggle').checked = Boolean(state.soundMuted);
    }
    if ($('custEnableWebPushBtn') && 'Notification' in window) {
      $('custEnableWebPushBtn').textContent = Notification.permission === 'granted' ? 'الإشعارات مفعّلة ✓' : 'تفعيل الإشعارات';
    }
    if ($('custNameAnim')) $('custNameAnim').value = u.nameAnim || 'none';
    if ($('custNameAnimSpeed')) $('custNameAnimSpeed').value = u.nameAnimSpeed || 'normal';
    renderCustNameAnimPills();
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
    const canStealth = isOwner || hasPerm('stealth');
    $('custStealthCard')?.classList.toggle('hidden', !canStealth);
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

    // More / Addons & Rank Threshold Gating
    const canAddons = isOwner || hasPerm('use_addons');
    const canAvatar = isOwner || passesSettingRankThreshold('min_rank_avatar', 'member');
    const canCover = isOwner || passesSettingRankThreshold('min_rank_cover', 'member');
    const canBgEff = canAddons && passesSettingRankThreshold('min_rank_bg_effect', 'member');
    const canMusic = isOwner || passesSettingRankThreshold('min_rank_music', 'member');
    const canNameStyle = isOwner || passesSettingRankThreshold('min_rank_name_style', 'member');
    const canMsgStyle = isOwner || passesSettingRankThreshold('min_rank_msg_style', 'member');

    $('custAddonsLockNotice').classList.toggle('hidden', canAddons);
    $('custVipWingsToggle').disabled = !canAddons;
    if ($('custUploadAvatarBtn')) $('custUploadAvatarBtn').disabled = !canAvatar;
    if ($('custUploadCoverBtn')) $('custUploadCoverBtn').disabled = !canCover;
    if ($('custMusicPreset')) $('custMusicPreset').disabled = !canMusic;
    if ($('custMusicCustomUrl')) $('custMusicCustomUrl').disabled = !canMusic;
    if ($('custNameColor')) $('custNameColor').disabled = !canNameStyle;
    if ($('custNameGradient')) $('custNameGradient').disabled = !canNameStyle;
    if ($('custNameStyleMode')) $('custNameStyleMode').disabled = !canNameStyle;
    if ($('custNeonColor')) $('custNeonColor').disabled = !canNameStyle;
    if ($('custNameBgColor')) $('custNameBgColor').disabled = !canNameStyle;
    if ($('custNameFontSize')) $('custNameFontSize').disabled = !canNameStyle;
    if ($('custTextColor')) $('custTextColor').disabled = !canMsgStyle;
    if ($('custFontFamily')) $('custFontFamily').disabled = !canMsgStyle;
    if ($('custFontStyle')) $('custFontStyle').disabled = !canMsgStyle;
    if ($('custFontSize')) $('custFontSize').disabled = !canMsgStyle;

    renderCustomizeAddonsGrids(canAddons, canBgEff);
    const initialModeTab = u.nameStyleMode === 'gradient' ? 'gradient' : (u.nameStyleMode === 'glow' ? 'neon' : (state.activeNameStyleTab || 'color'));
    switchNameStyleTab(initialModeTab);
    const resolvedTab = initialTab === 'account' ? 'info' : (initialTab === 'options' || initialTab === 'addons' ? 'more' : initialTab);
    switchCustomizeTab(resolvedTab);
    updateCustomizePreview();
    openModal('customizeModal');
    if (initialTab === 'options') {
      setTimeout(() => {
        $('custNameStyleSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  function renderCustomizeAddonsGrids(canAddons, canBgEff = canAddons) {
    const u = state.user;

    const bgHtml = (state.shopItems.profileBackgrounds || []).map((bg) => `
      <div class="addon-card ${(u.profileBgEffect || 'none') === bg.id ? 'active' : ''}">
        <div class="bg-swatch-mini ${bg.id !== 'none' ? `bg-effect-${bg.id}` : ''}"></div>
        <strong style="font-size:12px;">${escapeHtml(bg.label)}</strong>
        <button type="button" class="btn-primary btn-xs pick-bg-effect-btn" data-bg-id="${bg.id}" ${!canBgEff && bg.id !== 'none' ? 'disabled' : ''}>
          ${(u.profileBgEffect || 'none') === bg.id ? 'مفعل' : 'تطبيق'}
        </button>
      </div>
    `).join('');

    [$('custBgEffectsGrid'), $('custMyBgEffectsGrid')].forEach((grid) => {
      if (!grid) return;
      grid.innerHTML = bgHtml;
      grid.querySelectorAll('.pick-bg-effect-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'bg_effect', itemId: btn.dataset.bgId } });
            state.user = res.user;
            renderCustomizeAddonsGrids(canAddons, canBgEff);
            updateCustomizePreview();
            renderUserIdentity();
            showToast('تم تحديث خلفية البطاقة الملكية.');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
    });

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
          renderCustomizeAddonsGrids(canAddons, canBgEff);
          updateCustomizePreview();
          renderUserIdentity();
          showToast('تم تحديث لمعة الاسم.');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    const ownedFramesList = Array.isArray(u.ownedFrames) ? u.ownedFrames : [];
    const isOwnerSelf = u.role === 'site_owner';
    const allFrames = (state.shopItems.frames || []).filter((f) => f.id !== 'none' && (!f.ownerOnly || isOwnerSelf));
    const renderFramesCardList = (list) => list.map((f) => {
      const price = Number(f.price || 0);
      const owned = isOwnerSelf || price <= 0 || ownedFramesList.includes(f.id) || u.avatarFrame === f.id;
      return `
        <div class="addon-card store-frame-card ${u.avatarFrame === f.id ? 'active' : ''}">
          <div class="store-avatar-stage">${formatAvatarHTML({ ...u, avatarFrame: f.id }, 'lg')}</div>
          <strong style="font-size:12px;">${escapeHtml(f.label)}</strong>
          ${owned
            ? '<span class="store-owned-badge"><i class="fa-solid fa-check"></i> مملوك</span>'
            : `<span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${price} روبي</span>`}
          <div class="addon-card-actions">
            ${u.avatarFrame === f.id
              ? '<button type="button" class="btn-danger btn-xs remove-frame-btn">إزالة</button>'
              : owned
                ? `<button type="button" class="btn-primary btn-xs equip-frame-btn" data-frame-id="${escapeHtml(f.id)}">تفعيل</button>`
                : `<button type="button" class="btn-primary btn-xs buy-frame-btn" style="background:#be123c;" data-frame-id="${escapeHtml(f.id)}" data-price="${price}">شراء بالروبي</button>`}
          </div>
        </div>
      `;
    }).join('');

    const myOwnedFrames = allFrames.filter((f) => {
      const price = Number(f.price || 0);
      return isOwnerSelf || price <= 0 || ownedFramesList.includes(f.id) || u.avatarFrame === f.id;
    });

    const bindFrameGridActions = (gridEl) => {
      if (!gridEl) return;
      gridEl.querySelectorAll('.equip-frame-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'frame', itemId: btn.dataset.frameId } });
            state.user = res.user;
            renderCustomizeAddonsGrids(canAddons, canBgEff);
            updateCustomizePreview();
            renderUserIdentity();
            showToast('تم تفعيل الإطار بنجاح!');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      gridEl.querySelectorAll('.buy-frame-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await api('/api/shop/buy', { method: 'POST', body: { type: 'frame', itemId: btn.dataset.frameId } });
            if (res?.user) state.user = res.user;
            if ($('custTopCoinsVal')) $('custTopCoinsVal').textContent = String(state.user?.coins || 0);
            if ($('custCoinsBalance')) $('custCoinsBalance').textContent = String(state.user?.coins || 0);
            renderCustomizeAddonsGrids(canAddons, canBgEff);
            updateCustomizePreview();
            renderUserIdentity();
            showToast('تم شراء وتفعيل الإطار بالروبي بنجاح!');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      gridEl.querySelectorAll('.remove-frame-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await api('/api/shop/equip', { method: 'POST', body: { type: 'frame', itemId: 'none' } });
            state.user = res.user;
            renderCustomizeAddonsGrids(canAddons, canBgEff);
            updateCustomizePreview();
            renderUserIdentity();
            showToast('تمت إزالة الإطار.');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
    };

    if ($('custMyFramesGrid')) {
      $('custMyFramesGrid').innerHTML = myOwnedFrames.length
        ? renderFramesCardList(myOwnedFrames)
        : '<div class="muted" style="grid-column:1/-1;text-align:center;">لا تملك إطارات بعد — افتح المتجر لشراء إطار.</div>';
      bindFrameGridActions($('custMyFramesGrid'));
    }

    if ($('custFramesGrid')) {
      $('custFramesGrid').innerHTML = renderFramesCardList(allFrames);
      bindFrameGridActions($('custFramesGrid'));
    }

    $('custNameplatesGrid').innerHTML = (state.shopItems.nameplates || []).map((np) => `
      <div class="addon-card ${u.nameplateStyle === np.id ? 'active' : ''}">
        <span class="sender-name-btn ${np.id !== 'default' ? `nameplate-${np.id}` : ''}" style="color:#f8fafc;">${escapeHtml(u.name || 'الاسم')}</span>
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
          renderCustomizeAddonsGrids(canAddons, canBgEff);
          updateCustomizePreview();
          renderUserIdentity();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  function renderCustNameAnimPills() {
    const box = $('custNameAnimPills');
    if (!box) return;
    const current = $('custNameAnim')?.value || 'none';
    box.innerHTML = NAME_ANIM_OPTIONS.map((opt) => `
      <button type="button" class="name-anim-pill-btn${current === opt.id ? ' active' : ''}" data-anim-id="${opt.id}">
        ${escapeHtml(opt.label)}
      </button>
    `).join('');
    box.querySelectorAll('.name-anim-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if ($('custNameAnim')) $('custNameAnim').value = btn.dataset.animId;
        updateCustomizePreview();
      });
    });
  }

  function updateCustomizePreview() {
    const u = state.user;
    if (!u) return;
    const selectedAnim = $('custNameAnim') ? $('custNameAnim').value : (u.nameAnim || 'none');
    const selectedSpeed = $('custNameAnimSpeed') ? $('custNameAnimSpeed').value : (u.nameAnimSpeed || 'normal');
    const previewObj = {
      ...u,
      name: $('custDisplayName').value.trim() || u.name,
      nameColor: $('custNameColor').value,
      nameBgColor: $('custNameBgColor').dataset.cleared === '1' ? '' : $('custNameBgColor').value,
      neonColor: $('custNeonColor').dataset.cleared === '1' ? '' : $('custNeonColor').value,
      fontFamily: $('custFontFamily').value,
      fontStyle: $('custFontStyle').value,
      fontSize: $('custFontSize') ? Number($('custFontSize').value) : (u.fontSize || 14),
      nameFontSize: $('custNameFontSize') ? Number($('custNameFontSize').value) : (u.nameFontSize || 14),
      nameStyleMode: $('custNameStyleMode') ? $('custNameStyleMode').value : (u.nameStyleMode || 'solid'),
      nameGradient: $('custNameGradient') ? $('custNameGradient').value : (u.nameGradient || 'gold_royal'),
      nameAnim: selectedAnim,
      nameAnimSpeed: selectedSpeed,
      vipWings: $('custVipWingsToggle').checked
    };
    if ($('custFontSizeVal') && $('custFontSize')) {
      $('custFontSizeVal').textContent = $('custFontSize').value;
    }
    if ($('custNameFontSizeVal') && $('custNameFontSize')) {
      $('custNameFontSizeVal').textContent = $('custNameFontSize').value;
    }
    const hintEl = $('custContrastHint');
    if (hintEl) {
      const txtVal = $('custTextColor')?.value || '#e2e8f0';
      if (!isReadableOnDarkBg(txtVal)) {
        hintEl.textContent = 'اللون داكن جداً ولا يظهر بوضوح على الخلفية الليلية؛ اختر لوناً أفتح أو اضغط «افتراضي».';
        hintEl.classList.remove('hidden');
      } else {
        hintEl.classList.add('hidden');
      }
    }
    const isOwner = isExclusiveOwnerObj(u);
    const isOwnerGalaxy = isOwner && isOwnerGalaxyVisualEnabled();
    let effectiveFrame = u.avatarFrame || 'none';
    if (isOwnerGalaxy && (!effectiveFrame || effectiveFrame === 'none' || effectiveFrame === 'gold_royal')) {
      effectiveFrame = 'owner_sovereign';
    } else if (!isOwnerGalaxy && effectiveFrame === 'owner_sovereign') {
      effectiveFrame = isOwner ? 'gold_royal' : 'none';
    }
    const wrap = $('custPreviewAvatarWrap');
    if (wrap) {
      wrap.className = `avatar-wrap profile-avatar-85 frame-${effectiveFrame}`;
      syncFrameOrnament(wrap, effectiveFrame, isOwnerGalaxy);
    }
    const custAvatarStage = wrap?.closest('.profile-avatar-85-stage');
    if (custAvatarStage) {
      custAvatarStage.classList.toggle('owner-cosmic-avatar-stage', isOwnerGalaxy);
      custAvatarStage.querySelectorAll('.owner-avatar-cosmic-halo').forEach((n) => n.remove());
      if (isOwnerGalaxy) {
        const halo = document.createElement('span');
        halo.className = 'owner-avatar-cosmic-halo';
        halo.setAttribute('aria-hidden', 'true');
        custAvatarStage.insertBefore(halo, custAvatarStage.firstChild);
      }
    }
    if (u.avatarUrl) {
      $('custPreviewAvatarImg').src = u.avatarUrl;
      $('custPreviewAvatarImg').classList.remove('hidden');
      $('custPreviewAvatarLetter').classList.add('hidden');
    } else {
      $('custPreviewAvatarImg').classList.add('hidden');
      $('custPreviewAvatarLetter').classList.remove('hidden');
      $('custPreviewAvatarLetter').textContent = (previewObj.name || 'ع').slice(0, 1);
    }
    if ($('custDeleteAvatarBtn')) {
      $('custDeleteAvatarBtn').classList.toggle('hidden', !u.avatarUrl);
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
      const coverHero = $('custCoverHero');
      coverHero.querySelectorAll('.owner-cosmic-cover-vortex, .owner-galaxy-corner-seal').forEach((n) => n.remove());
      if (isOwnerGalaxy) {
        const vortex = document.createElement('div');
        vortex.className = 'owner-cosmic-cover-vortex';
        vortex.setAttribute('aria-hidden', 'true');
        coverHero.insertBefore(vortex, coverHero.firstChild);
        const seal = document.createElement('span');
        seal.className = 'owner-galaxy-corner-seal';
        seal.innerHTML = '<i class="fa-solid fa-meteor"></i> سيد المجرة والزمن';
        coverHero.appendChild(seal);
      }
    }
    if ($('custDeleteCoverBtn')) {
      $('custDeleteCoverBtn').classList.toggle('hidden', !u.coverUrl);
    }

    const card = document.querySelector('#customizeModal .profile-luxury-card');
    if (card) {
      card.className = 'modal-card modal-card-md profile-luxury-card';
      if (isOwnerGalaxy) card.classList.add('owner-black-gold-theme', 'owner-galaxy-theme');
      if (u.profileBgEffect && u.profileBgEffect !== 'none') {
        card.classList.add(`bg-effect-${u.profileBgEffect}`);
      }
    }
    const bgLayer = $('custBgEffectLayer');
    if (bgLayer) {
      bgLayer.className = isOwnerGalaxy ? 'owner-cosmic-bg-layer' : 'profile-bg-effect-layer';
    }

    const lvlNum = Math.max(1, Number(u.level) || Number(getRank(u.role)?.power) || 1);
    $('custPreviewNameRow').innerHTML = `${roleBadgeHTML(u.role, true)} ${formatNameHTML(previewObj)}`;
    if ($('custPreviewRoleLine')) {
      $('custPreviewRoleLine').innerHTML = isOwnerGalaxy
        ? `<span class="owner-galaxy-title-pill"><i class="fa-solid fa-meteor"></i> سيد المجرة والزمن</span> ${escapeHtml(getRank(u.role).label)} • المستوى ${lvlNum}`
        : `${escapeHtml(getRank(u.role).label)} • المستوى ${lvlNum}`;
    }
    $('custPreviewBio').textContent = $('custBioInput').value || u.bio || '';

    const liveBox = $('custNameStyleLivePreview');
    if (liveBox) {
      const fontCss = resolveFontFamilyCss(previewObj.fontFamily);
      const rawTxtCol = $('custTextColor')?.value || u.textColor || '#e2e8f0';
      const txtCol = escapeHtml(isReadableOnDarkBg(rawTxtCol) ? rawTxtCol : '#e2e8f0');
      const fWeight = previewObj.fontStyle === 'Bold' ? '800' : '600';
      const fStyle = previewObj.fontStyle === 'Italic' ? 'italic' : 'normal';
      const fSz = Math.max(13, Math.min(17, Number(previewObj.fontSize) || 14));
      liveBox.innerHTML = `
        <div class="namestyle-live-row">
          ${roleBadgeHTML(u.role, true)}
          ${formatNameHTML(previewObj)}
          <span class="namestyle-live-sample" style="color:${txtCol};font-family:${fontCss};font-weight:${fWeight};font-style:${fStyle};font-size:${fSz}px;">معاينة شكل ولون وحجم الخط مباشرة</span>
        </div>
      `;
    }
    $('custNameAnimPills')?.querySelectorAll('.name-anim-pill-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.animId === selectedAnim);
    });
    const activeMusicRef = ($('custMusicCustomUrl')?.value.trim() || $('custMusicPreset')?.value || u.profileMusic || '').trim();
    const musicLabels = {
      'preset:calm_lofi': 'أنغام هادئة',
      'preset:royal_oud': 'نغمة ملكية',
      'preset:ambient_stars': 'أوتار ليلية'
    };
    if ($('custMiniMusicLabel')) {
      $('custMiniMusicLabel').textContent = activeMusicRef
        ? (musicLabels[activeMusicRef] || 'أغنية بروفايل مخصصة')
        : 'أغنية البروفايل: بدون أغنية';
    }
    if ($('custMiniMusicPlayBtn')) {
      const playingThis = Boolean(activeMusicRef && state.activeMusicRef === activeMusicRef);
      $('custMiniMusicPlayBtn').innerHTML = playingThis ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      $('custMiniMusicPlayBtn').disabled = !activeMusicRef;
    }
    if ($('custTopCoinsVal')) $('custTopCoinsVal').textContent = String(u.coins || 0);
    if ($('custCoinsBalance')) $('custCoinsBalance').textContent = String(u.coins || 0);
    renderNameColorSwatches();
  }

  function switchCustomizeTab(tab) {
    state.activeCustomizeTab = tab;
    document.querySelectorAll('.cust-tab').forEach((b) => b.classList.toggle('active', b.dataset.custTab === tab));
    ['info', 'my_frames', 'friends', 'gifts', 'relations', 'posts', 'more'].forEach((t) => {
      $(`custPane_${t}`)?.classList.toggle('hidden', t !== tab);
    });
  }

  async function saveCustomizeProfile(closeAfter = true) {
    try {
      const textColVal = $('custTextColor').value;
      if (!isReadableOnDarkBg(textColVal)) {
        return showToast('لون نص الرسائل داكن جداً ولا يناسب الخلفية الليلية؛ اختر لوناً أوضح.', true);
      }
      const customUrl = $('custMusicCustomUrl')?.value.trim() || '';
      const profileMusic = customUrl || ($('custMusicPreset')?.value || '');
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
          textColor: textColVal,
          nameBgColor: $('custNameBgColor').dataset.cleared === '1' ? '' : $('custNameBgColor').value,
          neonColor: $('custNeonColor').dataset.cleared === '1' ? '' : $('custNeonColor').value,
          fontFamily: $('custFontFamily').value,
          fontStyle: $('custFontStyle').value,
          fontSize: $('custFontSize') ? Number($('custFontSize').value) : 14,
          nameFontSize: $('custNameFontSize') ? Number($('custNameFontSize').value) : 14,
          nameStyleMode: $('custNameStyleMode') ? $('custNameStyleMode').value : 'solid',
          nameGradient: $('custNameGradient') ? $('custNameGradient').value : 'gold_royal',
          nameAnim: $('custNameAnim')?.value || 'none',
          nameAnimSpeed: $('custNameAnimSpeed')?.value || 'normal',
          vipWings: $('custVipWingsToggle').checked,
          profileMusic
        }
      });
      state.user = res.user;
      renderUserIdentity();
      updateCustomizePreview();
      showToast('تم حفظ وتطبيق تعديلات ملفك الشخصي!');
      if (closeAfter) closeModal('customizeModal');
    } catch (err) {
      showToast(err.message, true);
    }
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

    if (tab === 'adminActivity') {
      const admins = data.adminActivity || [];
      body.innerHTML = admins.length
        ? admins.map((u, i) => `
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
                <div>🛡️ ${u.adminActionsCount || 0} إجراء</div>
                <div class="muted">🔥 ${u.activityPoints || 0} نقطة</div>
              </div>
            </div>
          `).join('')
        : '<div class="muted">لا يوجد نشاط إداري مسجل بعد.</div>';
      return;
    }

    if (tab === 'quizLeaders') {
      const qList = data.quizLeaders || [];
      body.innerHTML = qList.length
        ? qList.map((u, i) => `
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
                <div>🏆 ${u.quizPoints || 0} نقطة مسابقة</div>
                <div class="muted">💎 ${u.coins || 0} روبي</div>
              </div>
            </div>
          `).join('')
        : '<div class="muted">لا توجد نقاط مسابقات مسجلة بعد.</div>';
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
          <div>💎 ${u.coins} روبي</div>
          <div class="muted">🔥 ${u.activityPoints || 0} نقطة تفاعل</div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // STORE MODAL (المتجر) & DOWNLOAD APP & QUICK RANK PICKER
  // ==========================================
  async function openStoreModal(tab = 'store') {
    const resolvedTab = tab === 'frames' ? 'store' : tab;
    state.activeStoreTab = resolvedTab;
    document.querySelectorAll('.store-tab').forEach((b) => b.classList.toggle('active', b.dataset.storeTab === resolvedTab));
    $('storeModalBody').innerHTML = '<div class="muted">جاري تحميل المتجر...</div>';
    openModal('storeModal');
    try {
      const res = await api('/api/shop/items');
      state.shopItems = { ...state.shopItems, ...res };
    } catch {
      // keep cached shopItems
    }
    renderStoreTab(resolvedTab);
  }

  function renderStoreTab(tab = 'store') {
    const activeTab = tab === 'frames' ? 'store' : tab;
    state.activeStoreTab = activeTab;
    document.querySelectorAll('.store-tab').forEach((b) => b.classList.toggle('active', b.dataset.storeTab === activeTab));
    const body = $('storeModalBody');
    const u = state.user;
    if ($('storeHeroRubyCount')) $('storeHeroRubyCount').textContent = String(u?.coins || 0);
    if (!body) return;
    if (!u || u.isGuest) {
      body.innerHTML = '<div class="lock-notice"><i class="fa-solid fa-lock"></i> المتجر والإضافات متاحة للأعضاء المسجلين فقط.</div>';
      return;
    }
    const isOwner = u.role === 'site_owner';
    if ((state.shopItems.storeEnabled === false || !isFeatureEnabled('feat_store')) && !isOwner) {
      body.innerHTML = '<div class="lock-notice"><i class="fa-solid fa-store-slash"></i> المتجر متوقف مؤقتاً من قبل مالك الموقع.</div>';
      return;
    }
    const canAddons = isOwner || hasPerm('use_addons');
    const lockHtml = !canAddons && activeTab !== 'store' && activeTab !== 'my_frames' && activeTab !== 'ranks'
      ? '<div class="lock-notice" style="margin-bottom:10px;"><i class="fa-solid fa-lock"></i> تفعيل بعض الإضافات غير مفعل لرتبتك، بينما شراء وتفعيل الإطارات والرتب بالروبي متاح للجميع.</div>'
      : '';
    const ownedFramesList = Array.isArray(u.ownedFrames) ? u.ownedFrames : [];

    const renderFrameCards = (framesList) => `<div class="frames-addon-grid">${framesList.map((f) => {
      const price = Number(f.price || 0);
      const isCurrent = u.avatarFrame === f.id;
      const owned = isOwner || f.id === 'none' || price <= 0 || ownedFramesList.includes(f.id) || isCurrent;
      return `
        <div class="addon-card store-frame-card ${isCurrent ? 'active' : ''}">
          <div class="store-avatar-stage">
            ${formatAvatarHTML({ ...u, avatarFrame: f.id }, 'lg')}
          </div>
          <strong style="font-size:12px;">${escapeHtml(f.label)}</strong>
          ${f.id === 'none'
            ? '<span class="muted" style="font-size:11px;">افتراضي مجاني</span>'
            : owned
              ? '<span class="store-owned-badge"><i class="fa-solid fa-check"></i> مملوك</span>'
              : `<span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${price} روبي</span>`}
          ${isCurrent
            ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">مفعل حالياً</button>'
            : owned
              ? `<button type="button" class="btn-primary btn-xs store-equip-btn" style="width:100%;" data-equip-type="frame" data-item-id="${escapeHtml(f.id)}">${f.id === 'none' ? 'إزالة الإطار' : 'تفعيل'}</button>`
              : `<button type="button" class="btn-primary btn-xs store-buy-frame-btn" style="width:100%;background:#be123c;" data-item-id="${escapeHtml(f.id)}" data-price="${price}"><i class="fa-solid fa-gem"></i> شراء بالروبي (${price})</button>`}
        </div>
      `;
    }).join('')}</div>`;

    let itemsHtml = '';
    if (activeTab === 'store') {
      const visibleFrames = (state.shopItems.frames || []).filter((f) => !f.ownerOnly || isOwner);
      itemsHtml = renderFrameCards(visibleFrames);
    } else if (activeTab === 'my_frames') {
      const ownedOnly = (state.shopItems.frames || []).filter((f) => {
        if (f.ownerOnly && !isOwner) return false;
        const price = Number(f.price || 0);
        return isOwner || f.id === 'none' || price <= 0 || ownedFramesList.includes(f.id) || u.avatarFrame === f.id;
      });
      itemsHtml = ownedOnly.length
        ? renderFrameCards(ownedOnly)
        : '<div class="muted" style="text-align:center;padding:14px;">لا تملك إطارات إضافية بعد. تسوق من تبويب المتجر!</div>';
    } else if (activeTab === 'ranks') {
      const ranksList = Array.isArray(state.shopItems.ranks) ? state.shopItems.ranks : [];
      itemsHtml = ranksList.length
        ? `<div class="store-ranks-grid">${ranksList.map((r) => {
            const isCurrent = u.role === r.key;
            const myPower = getRank(u.role)?.power || 0;
            const targetPower = Number(r.power) || 0;
            const alreadyHigher = myPower > targetPower;
            return `
              <div class="addon-card store-rank-card ${isCurrent ? 'active' : ''}">
                <div class="store-rank-badge-preview">
                  ${roleBadgeHTML(r.key, true)}
                  <span class="store-mult-pill">💎 ×${escapeHtml(String(r.rubyMultiplier || 1))} روبي</span>
                </div>
                <strong style="font-size:13.5px;">${escapeHtml(r.label)}</strong>
                <div class="muted" style="font-size:11.5px;">${escapeHtml(r.benefits || 'صلاحيات VIP متكاملة ومضاعفة ربح الروبي')}</div>
                <span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${Number(r.price || 0)} روبي</span>
                ${isCurrent
                  ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">رتبتك الحالية</button>'
                  : alreadyHigher
                    ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">لديك رتبة أعلى</button>'
                    : `<button type="button" class="btn-primary btn-xs store-buy-rank-btn" style="width:100%;background:#7c3aed;" data-rank-key="${escapeHtml(r.key)}" data-price="${Number(r.price || 0)}"><i class="fa-solid fa-crown"></i> ترقية الآن بالروبي (${Number(r.price || 0)})</button>`}
              </div>
            `;
          }).join('')}</div>`
        : '<div class="muted" style="text-align:center;padding:12px;">لا توجد رتب متاحة للشراء حالياً.</div>';
    } else if (activeTab === 'shines') {
      itemsHtml = `<div class="shine-grid">${(state.shopItems.shines || []).map((s) => `
        <div class="addon-card ${u.nameShine === s.id ? 'active' : ''}">
          <div class="${s.id !== 'none' ? `shine-${s.id}` : ''}" style="font-weight:800;font-size:15px;">${escapeHtml(u.name || 'نموذج')}</div>
          <span class="muted">${escapeHtml(s.label)}</span>
          <button type="button" class="btn-primary btn-xs store-equip-btn" data-equip-type="shine" data-item-id="${escapeHtml(s.id)}" ${!canAddons && s.id !== 'none' ? 'disabled' : ''}>
            ${u.nameShine === s.id ? 'مفعل' : 'تفعيل'}
          </button>
        </div>
      `).join('')}</div>`;
    } else if (activeTab === 'nameplates') {
      itemsHtml = `<div class="nameplates-grid">${(state.shopItems.nameplates || []).map((np) => `
        <div class="addon-card ${u.nameplateStyle === np.id ? 'active' : ''}">
          <span class="sender-name-btn ${np.id !== 'default' ? `nameplate-${np.id}` : ''}" style="color:#f8fafc;">${escapeHtml(u.name || 'الاسم')}</span>
          <span class="muted">${escapeHtml(np.label)}</span>
          <button type="button" class="btn-secondary btn-xs store-equip-btn" data-equip-type="nameplate" data-item-id="${escapeHtml(np.id)}" ${!canAddons && np.id !== 'default' ? 'disabled' : ''}>
            ${u.nameplateStyle === np.id ? 'مفعل' : 'تطبيق'}
          </button>
        </div>
      `).join('')}</div>`;
    } else if (activeTab === 'badges') {
      const badgeList = (state.shopItems.rankBadgeStyles && state.shopItems.rankBadgeStyles.length)
        ? state.shopItems.rankBadgeStyles
        : RANK_BADGE_STYLES;
      itemsHtml = `
        <div class="addon-card ${u.vipWings ? 'active' : ''}" style="margin-bottom:10px;flex-direction:row;justify-content:space-between;align-items:center;padding:10px 12px;">
          <div style="text-align:right;">
            <strong style="font-size:13px;">🪽 أجنحة VIP الملكية بجانب الاسم</strong>
            <div class="muted">إضافة أجنحة مذهبة تطير بجانب اسمك داخل الغرفة وفي الملف الشخصي</div>
          </div>
          <button type="button" class="btn-primary btn-xs store-equip-btn" data-equip-type="wings" data-item-id="${u.vipWings ? '0' : '1'}" ${!canAddons && u.vipWings !== 1 ? 'disabled' : ''}>
            ${u.vipWings ? 'إزالة الأجنحة' : 'تفعيل الأجنحة'}
          </button>
        </div>
        <div class="muted" style="margin-bottom:6px;font-weight:700;">مكتبة أيقونات الرتب المدمجة (متاحة مجاناً في لوحة التحكم ومنشئ الرتب):</div>
        <div class="rank-svg-picker-grid">
          ${badgeList.map((bs) => `
            <div class="rank-svg-pick-btn" style="cursor:default;">
              <span class="rank-svg-pick-preview">${BUILT_IN_RANK_SVGS[bs.id] || `<i class="${escapeHtml(bs.iconClass || 'fa-solid fa-crown')}" style="color:#fbbf24"></i>`}</span>
              <span>${escapeHtml(bs.label)}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      itemsHtml = `<div class="shine-grid">${(state.shopItems.profileBackgrounds || []).map((bg) => `
        <div class="addon-card ${(u.profileBgEffect || 'none') === bg.id ? 'active' : ''}">
          <div class="bg-swatch-mini ${bg.id !== 'none' ? `bg-effect-${bg.id}` : ''}"></div>
          <strong style="font-size:12px;">${escapeHtml(bg.label)}</strong>
          <button type="button" class="btn-primary btn-xs store-equip-btn" data-equip-type="bg_effect" data-item-id="${escapeHtml(bg.id)}" ${!canAddons && bg.id !== 'none' ? 'disabled' : ''}>
            ${(u.profileBgEffect || 'none') === bg.id ? 'مفعل' : 'تطبيق'}
          </button>
        </div>
      `).join('')}</div>`;
    }

    body.innerHTML = `
      <div class="store-ruby-bar">
        <div>
          <span><i class="fa-solid fa-gem" style="color:#e11d48;"></i> رصيدك الحالي: <strong>${u.coins || 0}</strong> روبي</span>
          <div class="muted" style="font-size:11px;">تربح +2 نقطة تفاعل وروبي مضاعف حسب رتبتك مع التفاعل الحقيقي في المحادثات!</div>
        </div>
        <button type="button" id="storeOpenCustBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-palette"></i> ألوان وخط الاسم</button>
      </div>
      ${lockHtml}
      ${itemsHtml}
    `;

    $('storeOpenCustBtn')?.addEventListener('click', () => {
      closeModal('storeModal');
      openCustomizeModal('options');
    });

    body.querySelectorAll('.store-buy-rank-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/buy', {
            method: 'POST',
            body: { type: 'rank', itemId: btn.dataset.rankKey }
          });
          if (res?.user) state.user = res.user;
          renderUserIdentity();
          renderStoreTab('ranks');
          showToast('تم شراء وتفعيل الرتبة بنجاح! مبروك الترقية!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    body.querySelectorAll('.store-buy-frame-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/buy', {
            method: 'POST',
            body: { type: 'frame', itemId: btn.dataset.itemId }
          });
          if (res?.user) state.user = res.user;
          renderUserIdentity();
          renderStoreTab(tab);
          showToast('تم شراء وتفعيل الإطار بالروبي بنجاح!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    body.querySelectorAll('.store-equip-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api('/api/shop/equip', {
            method: 'POST',
            body: { type: btn.dataset.equipType, itemId: btn.dataset.itemId }
          });
          if (res?.user) state.user = res.user;
          renderUserIdentity();
          renderStoreTab(tab);
          showToast('تم تفعيل الإضافة على حسابك بنجاح!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  function openDownloadAppModal() {
    const body = $('downloadAppBody');
    if (!body) return;
    const siteName = state.settings?.site_name || 'شات الغرف';
    const hasPrompt = Boolean(state.deferredInstallPrompt);
    body.innerHTML = `
      <div class="download-app-box">
        <div class="download-app-hero">
          <i class="fa-solid fa-mobile-screen-button"></i>
          <strong>تثبيت تطبيق ${escapeHtml(siteName)}</strong>
          <p class="muted">افتح الشات كتطبيق مستقل سريع مع إشعارات فورية بلمسة واحدة.</p>
        </div>
        ${hasPrompt
          ? `<button type="button" id="installPwaTriggerBtn" class="btn-primary btn-full"><i class="fa-solid fa-download"></i> تثبيت التطبيق الآن</button>`
          : ''}
        <div class="admin-list-card" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <strong><i class="fa-brands fa-android" style="color:#16a34a;"></i> أجهزة أندرويد (Chrome):</strong>
          <span class="muted">اضغط على القائمة (⋮) في أعلى المتصفح ثم اختر <b>"الإضافة إلى الشاشة الرئيسية"</b> أو <b>"تثبيت التطبيق"</b>.</span>
        </div>
        <div class="admin-list-card" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <strong><i class="fa-brands fa-apple" style="color:#f8fafc;"></i> أجهزة آيفون (Safari):</strong>
          <span class="muted">اضغط على زر المشاركة (⬆️) في الأسفل ثم اختر <b>"إضافة إلى الصفحة الرئيسية"</b>.</span>
        </div>
        <button type="button" id="copyAppDownloadLinkBtn" class="btn-secondary btn-full"><i class="fa-solid fa-copy"></i> نسخ رابط الموقع</button>
      </div>
    `;
    $('installPwaTriggerBtn')?.addEventListener('click', async () => {
      const promptEv = state.deferredInstallPrompt;
      if (!promptEv) return;
      promptEv.prompt();
      const choice = await promptEv.userChoice.catch(() => ({ outcome: 'dismissed' }));
      state.deferredInstallPrompt = null;
      if (choice?.outcome === 'accepted') {
        showToast('تم تثبيت التطبيق بنجاح!');
        closeModal('downloadAppModal');
      } else {
        openDownloadAppModal();
      }
    });
    $('copyAppDownloadLinkBtn')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.origin).then(
        () => showToast('تم نسخ رابط الموقع!'),
        () => showToast(window.location.origin)
      );
    });
    openModal('downloadAppModal');
  }

  function openQuickRankPickerModal(targetUser) {
    if (!targetUser) return;
    if (!canManageTargetUser(targetUser)) {
      showToast('لا يمكنك تعديل رتبة هذا العضو (حصانة الرتب).', true);
      return;
    }
    const targetUserId = targetUser.userId || targetUser.id;
    if (!targetUserId) {
      showToast('لا يمكن تغيير رتبة الزوار، للأعضاء المسجلين فقط.', true);
      return;
    }
    state.rankPickerTarget = targetUser;
    if ($('rankPickerTargetName')) $('rankPickerTargetName').textContent = targetUser.name || 'العضو';
    const ranks = getAssignableRanksForActor();
    const body = $('rankPickerBody');
    if (!body) return;
    body.innerHTML = ranks.length
      ? `<div class="rank-picker-list">${ranks.map((r) => `
          <button type="button" class="rank-picker-item${targetUser.role === r.key ? ' active' : ''}" data-pick-role="${escapeHtml(r.key)}">
            <span>${roleBadgeHTML(r.key)}</span>
            <span class="muted">قوة ${Number(r.power) || 0}${targetUser.role === r.key ? ' • الحالية' : ''}</span>
          </button>
        `).join('')}</div>`
      : '<div class="muted" style="text-align:center;padding:12px;">لا توجد رتب متاحة للرفع أو التنزيل ضمن صلاحياتك.</div>';

    body.querySelectorAll('.rank-picker-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newRole = btn.dataset.pickRole;
        state.socket.emit('admin_set_role', { userId: targetUserId, newRole }, (res) => {
          if (res?.error) showToast(res.error, true);
          else {
            showToast(`تم تحديث رتبة "${targetUser.name}" إلى ${getRank(newRole).label}`);
            closeModal('rankPickerModal');
          }
        });
      });
    });
    openModal('rankPickerModal');
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
        <div class="admin-list-card" data-drawer-room-id="${escapeHtml(r.id)}">
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
          const rid = btn.dataset.roomId;
          const rm = state.rooms.find((r) => r.id === rid);
          if (rm && rm.hasPassword && state.user?.role !== 'site_owner' && !hasPerm('manage_rooms')) {
            const card = btn.closest('.admin-list-card');
            if (!card) return;
            card.querySelector('.inline-room-pass-box')?.remove();
            const box = document.createElement('div');
            box.className = 'inline-room-pass-box inline-row';
            box.style.cssText = 'width:100%;margin-top:8px;';
            box.innerHTML = `
              <input type="password" class="inline-room-pass-inp" placeholder="أدخل كلمة مرور الغرفة..." style="flex:1;" />
              <button type="button" class="btn-primary btn-xs inline-room-pass-go">دخول</button>
            `;
            card.style.flexWrap = 'wrap';
            card.appendChild(box);
            const inp = box.querySelector('.inline-room-pass-inp');
            inp?.focus();
            const submit = () => joinRoomWithPrompt(rid, inp?.value || '');
            box.querySelector('.inline-room-pass-go')?.addEventListener('click', submit);
            inp?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } });
            return;
          }
          closeSlideSheetDrawer();
          joinRoomWithPrompt(rid);
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
              <div class="admin-list-card" style="background:${m.from_key === state.user.key ? 'rgba(245,158,11,0.16)' : 'rgba(30,41,59,0.85)'};border-color:${m.from_key === state.user.key ? 'rgba(245,158,11,0.38)' : 'rgba(148,163,184,0.2)'};color:#f8fafc;">
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
              <div class="admin-list-card">
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
        <div class="news-composer">
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
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:12.5px;">
                      <span>خيارات المنشور</span>
                      <button type="button" class="btn-secondary btn-xs msg-dots-close-btn" style="padding:2px 8px;min-height:24px;">✕</button>
                    </div>
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
        const willOpen = dotsMenu.classList.contains('hidden');
        document.querySelectorAll('.msg-dots-menu').forEach((m) => m.classList.add('hidden'));
        if (willOpen) dotsMenu.classList.remove('hidden');
      });
      dotsMenu?.querySelector('.msg-dots-close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        dotsMenu.classList.add('hidden');
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
  function joinRoomWithPrompt(roomId, explicitPassword = '') {
    const rm = state.rooms.find((r) => r.id === roomId);
    const password = String(explicitPassword || '');
    if (rm && rm.hasPassword && !password && state.user?.role !== 'site_owner' && !hasPerm('manage_rooms')) {
      openSlideSheetDrawer('rooms');
      showToast(`الغرفة "${rm.name}" محمية — أدخل كلمة المرور بجانبها للدخول.`, true);
      return;
    }
    state.socket.emit('join_room', { roomId, password }, (res) => {
      if (res?.error) showToast(res.error, true);
      else {
        localStorage.setItem(ROOM_KEY, roomId);
        closeSlideSheetDrawer();
      }
    });
  }

  function openRoomsModal() {
    openSlideSheetDrawer('rooms');
  }

  // ==========================================
  // UNIFIED 5-TAB OWNER COMMAND CENTER
  // ==========================================
  function normalizeAdminTabTarget(rawTab, subOverride = null) {
    const t = String(rawTab || 'ranks_matrix');
    if (t === 'ranks_matrix') return { tab: 'ranks_matrix', sub: subOverride || null };
    if (t === 'protection') return { tab: 'protection', sub: subOverride || null };
    if (t === 'quiz_bot') return { tab: 'quiz_bot', sub: subOverride || null };
    if (t === 'members_control') return { tab: 'members_control', sub: subOverride || null };
    if (t === 'audit_log') return { tab: 'audit_log', sub: subOverride || null };
    if (t === 'ranks') return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
    if (t === 'master_matrix' || t === 'store_mgr') return { tab: 'ranks_matrix', sub: subOverride || 'matrix' };
    if (t === 'stats') return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
    if (t === 'rooms') return { tab: 'protection', sub: subOverride || 'rooms' };
    if (t === 'bans') return { tab: 'protection', sub: subOverride || 'bans' };
    if (t === 'bank') return { tab: 'members_control', sub: subOverride || 'bank' };
    if (t === 'cms' || t === 'news' || t === 'emojis') return { tab: 'members_control', sub: subOverride || 'appearance' };
    if (t === 'users' || t === 'owner_suite') return { tab: 'members_control', sub: subOverride || 'detector' };
    return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
  }

  async function openAdminPanel(rawTab = 'ranks_matrix', preselectRoomId = null, subOverride = null) {
    const { tab, sub } = normalizeAdminTabTarget(rawTab, subOverride);
    state.activeAdminTab = tab;
    if (sub) {
      state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), [tab]: sub };
    }
    if (preselectRoomId !== undefined && preselectRoomId !== null) {
      state.editingRoomId = preselectRoomId;
    } else if (sub !== 'rooms') {
      state.editingRoomId = null;
    }
    if (tab !== 'ranks_matrix') state.editingRankKey = null;

    document.querySelectorAll('.adm-tab').forEach((b) => b.classList.toggle('active', b.dataset.admTab === tab));
    $('adminModalBody').innerHTML = '<div class="muted">جاري تحميل بيانات لوحة القيادة...</div>';
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
    const ceiling = isOwner ? 15 : (state.adminOverview?.stats?.myMaxAssignablePower ?? 0);
    return state.ranks
      .filter((r) => r.key !== 'guest' && (isOwner || r.power <= ceiling))
      .map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === selectedKey ? 'selected' : ''}>${escapeHtml(r.icon)} ${escapeHtml(r.label)} (قوة ${r.power})</option>`)
      .join('');
  }

  async function runOwnerCmdAction(payload, okMsg, refreshTab = state.activeAdminTab, refreshSub = null) {
    try {
      const res = await api('/api/owner/action', { method: 'POST', body: payload });
      if (okMsg) showToast(okMsg);
      if (res?.settings) applySiteSettings(res.settings);
      if (res?.ranks) state.ranks = res.ranks;
      await openAdminPanel(refreshTab, state.editingRoomId || null, refreshSub);
      return res;
    } catch (err) {
      showToast(err.message, true);
      return null;
    }
  }

  function renderAdminTab(rawTab) {
    const ov = state.adminOverview;
    if (!ov) return;
    const body = $('adminModalBody');
    if (!body) return;
    const isOwner = state.user?.role === 'site_owner';
    const suite = state.ownerSuite || {};
    const { tab, sub } = normalizeAdminTabTarget(rawTab);
    state.activeAdminTab = tab;
    if (sub && !state.activeAdminSubTab?.[tab]) {
      state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), [tab]: sub };
    }
    document.querySelectorAll('.adm-tab').forEach((b) => b.classList.toggle('active', b.dataset.admTab === tab));

    if (tab === 'ranks_matrix') return renderAdminRanksMatrixTab(body, ov, suite, isOwner);
    if (tab === 'protection') return renderAdminProtectionTab(body, ov, suite, isOwner);
    if (tab === 'quiz_bot') return renderAdminQuizBotTab(body, ov, suite, isOwner);
    if (tab === 'members_control') return renderAdminMembersControlTab(body, ov, suite, isOwner);
    if (tab === 'audit_log') return renderAdminAuditLogTab(body, ov, suite, isOwner);
  }

  function renderAdminRanksMatrixTab(body, ov, suite, isOwner) {
    const s = ov.stats || {};
    const sub = state.activeAdminSubTab?.ranks_matrix || 'creator';
    const editRk = state.editingRankKey ? (ov.ranks || []).find((r) => r.key === state.editingRankKey) : null;
    const ep = editRk?.permissions || {};
    const isEditing = Boolean(editRk);
    const badgeStyles = state.shopItems?.rankBadgeStyles?.length ? state.shopItems.rankBadgeStyles : RANK_BADGE_STYLES;
    const rankPermDefs = [
      { id: 'pm', key: 'pm', label: 'الرسائل الخاصة' },
      { id: 'chat_media', key: 'chat_media', label: 'الصور والملصقات والصوت' },
      { id: 'mic', key: 'mic', label: 'صعود المايك' },
      { id: 'youtube', key: 'youtube', label: 'يوتيوب الغرفة' },
      { id: 'wall', key: 'wall', label: 'الحائط والمنشورات' },
      { id: 'gifts', key: 'gifts', label: 'إرسال الهدايا' },
      { id: 'use_addons', key: 'use_addons', label: 'إضافات الملف والخط' },
      { id: 'immune', key: 'immune', label: 'الحصانة ضد الكتم والطرد' },
      { id: 'delete_msg', key: 'delete_msg', label: 'حذف الرسائل' },
      { id: 'mute', key: 'mute', label: 'الكتم' },
      { id: 'kick', key: 'kick', label: 'الطرد' },
      { id: 'ban', key: 'ban', label: 'الحظر' },
      { id: 'manage_rooms', key: 'manage_rooms', label: 'إدارة الغرف' },
      { id: 'set_rank', key: 'set_rank', label: 'تغيير الرتب' },
      { id: 'stealth', key: 'stealth', label: 'وضع التخفي' },
      { id: 'give_coins', key: 'give_coins', label: 'منح روبي' },
      { id: 'clear_room', key: 'clear_room', label: 'مسح الغرفة' },
      { id: 'access_panel', key: 'access_panel', label: 'دخول لوحة التحكم' },
      { id: 'room_owner', key: 'room_owner', label: 'إدارة الغرف كـ مالك غرفة' },
      { id: 'publish_news', key: 'publish_news', label: 'نشر الأخبار' },
      { id: 'send_links', key: 'send_links', label: 'إرسال الروابط' }
    ];
    const prot = suite.protections || ov.settings || {};
    const allRanksSorted = [...(suite.ranks || ov.ranks || state.ranks || [])].sort((a, b) => (Number(a.power) || 0) - (Number(b.power) || 0));
    const minRankSelect = (id, curVal, includeGuest = true) => {
      const list = includeGuest ? allRanksSorted : allRanksSorted.filter((r) => r.key !== 'guest');
      return `<select id="${id}" class="master-rank-select">${list.map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === curVal ? 'selected' : ''}>${escapeHtml(r.icon || '⭐')} ${escapeHtml(r.label)}</option>`).join('')}</select>`;
    };
    const staffRoles = [...(suite.ranks || ov.ranks || state.ranks || [])]
      .filter((r) => Number(r.power) >= 2 && Number(r.power) <= 14 && r.key !== 'site_owner' && r.key !== 'guest')
      .sort((a, b) => (Number(b.power) || 0) - (Number(a.power) || 0));
    const permCols = [
      { id: 'pm', label: 'الخاص' }, { id: 'chat_media', label: 'الميديا' }, { id: 'mic', label: 'المايك' },
      { id: 'youtube', label: 'يوتيوب' }, { id: 'wall', label: 'الحائط' }, { id: 'gifts', label: 'الهدايا' },
      { id: 'use_addons', label: 'الإضافات' }, { id: 'immune', label: 'الحصانة' }, { id: 'delete_msg', label: 'حذف رسالة' },
      { id: 'mute', label: 'كتم' }, { id: 'kick', label: 'طرد' }, { id: 'ban', label: 'حظر' },
      { id: 'manage_rooms', label: 'إدارة الغرف' }, { id: 'set_rank', label: 'تغيير الرتب' }, { id: 'stealth', label: 'تخفي' },
      { id: 'give_coins', label: 'منح روبي' }, { id: 'clear_room', label: 'مسح الغرفة' }, { id: 'access_panel', label: 'دخول اللوحة' },
      { id: 'room_owner', label: 'مالك غرفة' }, { id: 'publish_news', label: 'نشر أخبار' }, { id: 'send_links', label: 'الروابط' }
    ];
    const framesCat = (suite.framesCatalog || state.shopItems?.frames || []).filter((f) => f.id !== 'none' && !f.ownerOnly);

    body.innerHTML = `
      <div class="gifts-wallet-summary">
        <div class="stat-mini"><span>🟢 متصلون</span><strong>${s.onlineCount || 0}</strong></div>
        <div class="stat-mini"><span>👥 الأعضاء</span><strong>${s.registeredCount || 0}</strong></div>
        <div class="stat-mini"><span>🏠 الغرف</span><strong>${s.roomsCount || 0}</strong></div>
        <div class="stat-mini"><span>👑 الرتب</span><strong>${s.ranksCount || 0}</strong></div>
      </div>

      <div class="cmd-subpills">
        <button type="button" class="cmd-subpill ${sub === 'creator' ? 'active' : ''}" data-sub="creator"><i class="fa-solid fa-crown"></i> منشئ الرتب والـ 40×40</button>
        ${isOwner ? `<button type="button" class="cmd-subpill ${sub === 'matrix' ? 'active' : ''}" data-sub="matrix"><i class="fa-solid fa-sliders"></i> مصفوفة الصلاحيات والأسعار</button>` : ''}
      </div>

      <div id="cmdPane_creator" class="${sub === 'creator' ? '' : 'hidden'}">
        <div class="news-composer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>${isEditing ? `تعديل الرتبة: ${escapeHtml(editRk.label)}` : 'منشئ الرتب والصلاحيات (المستوى 1 إلى 14)'}</strong>
            ${isEditing ? '<button type="button" id="rkCancelEditBtn" class="btn-secondary btn-xs">إلغاء التعديل</button>' : ''}
          </div>
          <div class="form-grid-2">
            <input type="text" id="rkLabel" placeholder="اسم الرتبة" value="${escapeHtml(editRk?.label || '')}" />
            <input type="number" id="rkPower" min="1" max="${editRk?.key === 'site_owner' ? 15 : 14}" value="${editRk ? editRk.power : 8}" ${editRk?.is_system ? 'disabled' : ''} placeholder="المستوى (1 - 14)" />
            <div><label class="muted">لون الخلفية</label><input type="color" id="rkBgColor" value="${escapeHtml(editRk?.bg_color || '#7c3aed')}" style="width:100%" /></div>
            <div><label class="muted">لون النص</label><input type="color" id="rkTextColor" value="${escapeHtml(editRk?.text_color || '#ffffff')}" style="width:100%" /></div>
          </div>
          <div>
            <label class="muted">مكتبة أيقونات الرتب المدمجة (SVG متحركة):</label>
            <select id="rkBadgeStyle" style="width:100%;">
              ${badgeStyles.map((bs) => `<option value="${escapeHtml(bs.id)}" ${(editRk?.badge_style || 'gold_crown') === bs.id ? 'selected' : ''}>${escapeHtml(bs.label)}</option>`).join('')}
            </select>
            <div class="rank-svg-picker-grid" id="rkSvgPickerGrid">
              ${badgeStyles.map((bs) => `
                <button type="button" class="rank-svg-pick-btn ${(editRk?.badge_style || 'gold_crown') === bs.id ? 'active' : ''}" data-bstyle="${escapeHtml(bs.id)}">
                  <span class="rank-svg-pick-preview">${BUILT_IN_RANK_SVGS[bs.id] || `<i class="${escapeHtml(bs.iconClass || 'fa-solid fa-crown')}" style="color:#fbbf24"></i>`}</span>
                  <span>${escapeHtml(bs.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="inline-row" style="flex-wrap:wrap;">
            <input type="text" id="rkIconInput" value="${escapeHtml(editRk?.icon || '👑')}" style="width:70px;text-align:center;" />
            <div class="icon-preset-grid" id="rkIconPresets">
              ${RANK_ICON_PRESETS.map((ic) => `<button type="button" class="icon-preset-btn" data-ic="${ic}">${ic}</button>`).join('')}
            </div>
          </div>
          <div class="rk-icon-40-preview-wrap">
            <div class="rk-icon-40-preview" title="معاينة 40×40">
              ${editRk?.image_url
                ? `<img id="rkIconPreviewImg" src="${escapeHtml(editRk.image_url)}" alt="" />`
                : '<img id="rkIconPreviewImg" class="hidden" alt="" /><span id="rkIconPreviewPlaceholder" class="muted" style="font-size:10px;">40×40</span>'}
            </div>
            <input type="file" id="rkIconFile" accept="image/png,image/jpeg,image/webp,image/gif,image/*" />
            <input type="text" id="rkImgUrl" value="${escapeHtml(editRk?.image_url || '')}" placeholder="أو رابط صورة أيقونة (40×40)" style="flex:1;min-width:160px;" />
          </div>
          <div>
            <label class="muted">سقف الترقية (0-${editRk?.key === 'site_owner' ? 15 : 14}):</label>
            <input type="number" id="rkMaxAssign" min="0" max="${editRk?.key === 'site_owner' ? 15 : 14}" value="${editRk ? (editRk.max_assignable_rank || 0) : 0}" ${editRk?.key === 'site_owner' ? 'disabled' : ''} />
          </div>
          <div class="perms-check-grid">
            ${rankPermDefs.map((p) => {
              const checked = isEditing ? Boolean(ep[p.key]) : ['pm', 'chat_media', 'mic', 'youtube', 'wall', 'gifts', 'use_addons'].includes(p.key);
              return `<label class="switch-label"><input type="checkbox" class="rk-perm-chk" data-perm="${p.key}" ${checked ? 'checked' : ''} /><span>${p.label}</span></label>`;
            }).join('')}
          </div>
          <button type="button" id="rkSaveBtn" class="btn-primary" ${!isOwner ? 'disabled' : ''}>
            ${isEditing ? 'حفظ التعديلات على الرتبة' : 'حفظ وإنشاء الرتبة'}
          </button>
        </div>
        <div class="news-feed-list" style="margin-top:10px;">
          ${(ov.ranks || []).map((r) => `
            <div class="admin-list-card">
              <div>
                ${roleBadgeHTML(r.key)}
                <span class="muted">المستوى ${r.power} • سقف الترقية ${r.max_assignable_rank || 0}</span>
              </div>
              <div class="inline-row">
                ${isOwner ? `<button type="button" class="btn-secondary btn-xs edit-rk-btn" data-rk="${escapeHtml(r.key)}">تعديل</button>` : ''}
                ${isOwner && !r.is_system ? `<button type="button" class="btn-danger btn-xs del-rk-btn" data-rk="${escapeHtml(r.key)}">حذف</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${isOwner ? `
        <div id="cmdPane_matrix" class="${sub === 'matrix' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-comments"></i> قيود الزوار والكتابة والمحادثة</h4>
            <label class="switch-label"><input type="checkbox" id="mmGuestCanChat" ${prot.guest_can_chat !== 0 ? 'checked' : ''} /><span>السماح للزائر بالكتابة في الغرفة العامة</span></label>
            <div class="master-matrix-grid">
              <div class="master-field"><label>أقل رتبة لفتح الخاص:</label>${minRankSelect('mmMinRankPm', prot.min_rank_pm || 'member', true)}</div>
              <div class="master-field"><label>أقل رتبة لإرسال صور/ملصقات:</label>${minRankSelect('mmMinRankChatMedia', prot.min_rank_chat_media || 'member', true)}</div>
              <div class="master-field"><label>أقل رتبة للجلوس بالمايك:</label>${minRankSelect('mmMinRankMic', prot.min_rank_mic || 'guest', true)}</div>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-user-pen"></i> صلاحيات التخصيص والميديا بالملف الشخصي</h4>
            <div class="master-matrix-grid">
              <div class="master-field"><label>تغيير الصورة الشخصية:</label>${minRankSelect('mmMinRankAvatar', prot.min_rank_avatar || 'member', false)}</div>
              <div class="master-field"><label>تغيير صورة الغلاف:</label>${minRankSelect('mmMinRankCover', prot.min_rank_cover || 'member', false)}</div>
              <div class="master-field"><label>خلفيات الملف المتحركة:</label>${minRankSelect('mmMinRankBgEffect', prot.min_rank_bg_effect || 'member', false)}</div>
              <div class="master-field"><label>إضافة أغنية البروفايل:</label>${minRankSelect('mmMinRankMusic', prot.min_rank_music || 'member', false)}</div>
              <div class="master-field"><label>تلوين الاسم والنيون:</label>${minRankSelect('mmMinRankNameStyle', prot.min_rank_name_style || 'member', false)}</div>
              <div class="master-field"><label>تلوين وتكبير خط الرسائل:</label>${minRankSelect('mmMinRankMsgStyle', prot.min_rank_msg_style || 'member', false)}</div>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-shield-halved"></i> مصفوفة الصلاحيات الشاملة للرتب (المستوى 14 إلى 2)</h4>
            <div class="master-perm-cards">
              ${staffRoles.map((sr) => `
                <div class="master-staff-role-card" data-staff-role="${escapeHtml(sr.key)}">
                  <div class="master-staff-role-head">
                    <span>${roleBadgeHTML(sr.key, true)} <strong>${escapeHtml(sr.label)}</strong></span>
                    <span class="muted">المستوى: ${sr.power}</span>
                  </div>
                  <div class="master-staff-checks">
                    ${permCols.map((pc) => `
                      <label class="master-perm-chip">
                        <input type="checkbox" class="mm-role-perm-chk" data-role="${escapeHtml(sr.key)}" data-perm="${pc.id}" ${sr.permissions?.[pc.id] ? 'checked' : ''} />
                        <span>${pc.label}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-toggle-on"></i> مفاتيح الميزات، أسعار الرتب والإطارات، ومضاعف الروبي</h4>
            <div class="master-feature-switches">
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatMics" ${prot.feat_mics !== 0 ? 'checked' : ''} /><span>🎙️ المايكات</span></label>
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatPm" ${prot.feat_pm !== 0 ? 'checked' : ''} /><span>✉️ الخاص</span></label>
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatStore" ${prot.feat_store !== 0 ? 'checked' : ''} /><span>🛒 المتجر</span></label>
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatGifts" ${prot.feat_gifts !== 0 ? 'checked' : ''} /><span>🎁 الهدايا</span></label>
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatYoutube" ${prot.feat_youtube !== 0 ? 'checked' : ''} /><span>▶️ يوتيوب</span></label>
              <label class="master-perm-chip"><input type="checkbox" id="mmFeatWall" ${prot.feat_wall !== 0 ? 'checked' : ''} /><span>🧱 الحائط</span></label>
            </div>
            <div class="form-grid-2" style="margin-top:6px;">
              <div><label class="muted">مضاعف روبي عضو ملكي (×)</label><input type="number" id="mmRoyalMemberMult" step="0.1" min="1" max="10" value="${Number(prot.royal_member_ruby_multiplier ?? 1.25)}" /></div>
              <div><label class="muted">سعر رتبة عضو ملكي (💎)</label><input type="number" id="mmRankPriceRoyalMember" min="0" value="${Number(prot.rank_price_royal_member ?? 250)}" /></div>
              <div><label class="muted">مضاعف روبي VIP (×)</label><input type="number" id="mmVipMult" step="0.1" min="1" max="10" value="${Number(prot.vip_ruby_multiplier ?? 2)}" /></div>
              <div><label class="muted">سعر رتبة VIP (💎)</label><input type="number" id="mmRankPriceVip" min="0" value="${Number(prot.rank_price_royal_vip ?? 1200)}" /></div>
              <div><label class="muted">مضاعف روبي البريميوم (×)</label><input type="number" id="mmPremMult" step="0.1" min="1" max="10" value="${Number(prot.premium_ruby_multiplier ?? 1.5)}" /></div>
              <div><label class="muted">سعر رتبة بريميوم (💎)</label><input type="number" id="mmRankPricePrem" min="0" value="${Number(prot.rank_price_premium ?? 500)}" /></div>
            </div>
            <div style="margin-top:6px;">
              <strong style="font-size:12px;">أسعار الإطارات المتحركة (بالروبي):</strong>
              <div class="master-frames-prices-grid">
                ${framesCat.map((f) => `
                  <div class="master-frame-price-item">
                    <span>${escapeHtml(f.label)}</span>
                    <input type="number" class="mm-frame-price-input" data-frame-id="${escapeHtml(f.id)}" min="0" value="${Number(f.price || 0)}" />
                  </div>
                `).join('')}
              </div>
            </div>
            <button type="button" id="ownerSaveMasterMatrixBtn" class="btn-primary btn-sm btn-full" style="margin-top:8px;">
              <i class="fa-solid fa-floppy-disk"></i> حفظ مصفوفة الصلاحيات الشاملة وتطبيقها فوراً
            </button>
          </div>
        </div>
      ` : ''}
    `;

    body.querySelectorAll('.cmd-subpill').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), ranks_matrix: b.dataset.sub };
        renderAdminRanksMatrixTab(body, ov, suite, isOwner);
      });
    });

    $('rkCancelEditBtn')?.addEventListener('click', () => {
      state.editingRankKey = null;
      renderAdminRanksMatrixTab(body, ov, suite, isOwner);
    });
    $('rkIconPresets')?.querySelectorAll('.icon-preset-btn').forEach((b) => {
      b.addEventListener('click', () => { $('rkIconInput').value = b.dataset.ic; });
    });
    const syncBadgeStyleSelection = (val) => {
      if ($('rkBadgeStyle')) $('rkBadgeStyle').value = val;
      $('rkSvgPickerGrid')?.querySelectorAll('.rank-svg-pick-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.bstyle === val);
      });
    };
    $('rkSvgPickerGrid')?.querySelectorAll('.rank-svg-pick-btn').forEach((btn) => {
      btn.addEventListener('click', () => syncBadgeStyleSelection(btn.dataset.bstyle));
    });
    $('rkBadgeStyle')?.addEventListener('change', (e) => syncBadgeStyleSelection(e.target.value));
    const updateRkPreview = (src) => {
      const img = $('rkIconPreviewImg');
      const ph = $('rkIconPreviewPlaceholder');
      if (!img) return;
      if (src) {
        img.src = src;
        img.classList.remove('hidden');
        if (ph) ph.classList.add('hidden');
      } else {
        img.src = '';
        img.classList.add('hidden');
        if (ph) ph.classList.remove('hidden');
      }
    };
    $('rkImgUrl')?.addEventListener('input', (e) => updateRkPreview(e.target.value.trim()));
    $('rkIconFile')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 40;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, 40, 40);
          ctx.drawImage(img, 0, 0, 40, 40);
          const dataUrl = canvas.toDataURL('image/png');
          if ($('rkImgUrl')) $('rkImgUrl').value = dataUrl;
          updateRkPreview(dataUrl);
          showToast('تم تحويل الأيقونة إلى مقاس 40×40 جاهزة للحفظ.');
        };
        img.onerror = () => showToast('تعذر قراءة ملف الصورة.', true);
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
    $('rkSaveBtn')?.addEventListener('click', async () => {
      try {
        const permissions = {};
        body.querySelectorAll('.rk-perm-chk').forEach((chk) => { permissions[chk.dataset.perm] = Boolean(chk.checked); });
        const payload = {
          label: $('rkLabel').value,
          power: Number($('rkPower').value),
          bgColor: $('rkBgColor').value,
          textColor: $('rkTextColor').value,
          badgeStyle: $('rkBadgeStyle')?.value || 'crown_royal',
          icon: $('rkIconInput').value,
          imageUrl: $('rkImgUrl').value.trim(),
          maxAssignableRank: Number($('rkMaxAssign').value) || 0,
          permissions
        };
        if (isEditing && editRk) {
          await api(`/api/admin/ranks/${encodeURIComponent(editRk.key)}`, { method: 'PUT', body: payload });
          state.editingRankKey = null;
          showToast('تم حفظ تعديلات الرتبة بنجاح!');
        } else {
          await api('/api/admin/ranks', { method: 'POST', body: payload });
          showToast('تم إنشاء الرتبة وحفظها!');
        }
        openAdminPanel('ranks_matrix', null, 'creator');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    body.querySelectorAll('.edit-rk-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.editingRankKey = b.dataset.rk;
        renderAdminRanksMatrixTab(body, ov, suite, isOwner);
      });
    });
    body.querySelectorAll('.del-rk-btn').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          await api(`/api/admin/ranks/${encodeURIComponent(b.dataset.rk)}`, { method: 'DELETE' });
          if (state.editingRankKey === b.dataset.rk) state.editingRankKey = null;
          openAdminPanel('ranks_matrix', null, 'creator');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    $('ownerSaveMasterMatrixBtn')?.addEventListener('click', () => {
      const frameOverrides = {};
      body.querySelectorAll('.mm-frame-price-input').forEach((inp) => {
        frameOverrides[inp.dataset.frameId] = Math.max(0, Number(inp.value) || 0);
      });
      const protections = {
        guest_can_chat: $('mmGuestCanChat')?.checked ? 1 : 0,
        min_rank_pm: $('mmMinRankPm')?.value || 'member',
        min_rank_chat_media: $('mmMinRankChatMedia')?.value || 'member',
        min_rank_mic: $('mmMinRankMic')?.value || 'guest',
        min_rank_avatar: $('mmMinRankAvatar')?.value || 'member',
        min_rank_cover: $('mmMinRankCover')?.value || 'member',
        min_rank_bg_effect: $('mmMinRankBgEffect')?.value || 'member',
        min_rank_music: $('mmMinRankMusic')?.value || 'member',
        min_rank_name_style: $('mmMinRankNameStyle')?.value || 'member',
        min_rank_msg_style: $('mmMinRankMsgStyle')?.value || 'member',
        feat_mics: $('mmFeatMics')?.checked ? 1 : 0,
        feat_pm: $('mmFeatPm')?.checked ? 1 : 0,
        feat_store: $('mmFeatStore')?.checked ? 1 : 0,
        feat_gifts: $('mmFeatGifts')?.checked ? 1 : 0,
        feat_youtube: $('mmFeatYoutube')?.checked ? 1 : 0,
        feat_wall: $('mmFeatWall')?.checked ? 1 : 0,
        royal_member_ruby_multiplier: Math.max(1, Number($('mmRoyalMemberMult')?.value) || 1.25),
        rank_price_royal_member: Math.max(0, Number($('mmRankPriceRoyalMember')?.value) || 0),
        premium_ruby_multiplier: Math.max(1, Number($('mmPremMult')?.value) || 1.5),
        vip_ruby_multiplier: Math.max(1, Number($('mmVipMult')?.value) || 2),
        rank_price_premium: Math.max(0, Number($('mmRankPricePrem')?.value) || 0),
        rank_price_royal_vip: Math.max(0, Number($('mmRankPriceVip')?.value) || 0),
        frame_price_overrides: frameOverrides
      };
      const rolePermissions = {};
      body.querySelectorAll('.master-staff-role-card[data-staff-role]').forEach((cardEl) => {
        const rKey = cardEl.dataset.staffRole;
        if (!rKey) return;
        const existingRank = (suite.ranks || state.ranks || []).find((r) => r.key === rKey);
        const mergedPerms = { ...(existingRank?.permissions || {}) };
        cardEl.querySelectorAll('.mm-role-perm-chk').forEach((chk) => { mergedPerms[chk.dataset.perm] = Boolean(chk.checked); });
        rolePermissions[rKey] = mergedPerms;
      });
      runOwnerCmdAction({ action: 'update_master_matrix', protections, rolePermissions }, 'تم حفظ مصفوفة الصلاحيات الشاملة وتطبيقها فوراً!', 'ranks_matrix', 'matrix');
    });
  }

  function renderAdminProtectionTab(body, ov, suite, isOwner) {
    const sub = state.activeAdminSubTab?.protection || (isOwner ? 'rules' : 'rooms');
    const prot = suite.protections || ov.settings || {};
    const editRm = state.editingRoomId ? (ov.rooms || []).find((r) => r.id === state.editingRoomId) : null;
    const isEditingRm = Boolean(editRm);
    const userOpts = (ov.users || []).map((u) => `<option value="${u.id}" ${editRm?.owner_user_id === u.id ? 'selected' : ''}>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`).join('');
    const roomOpts = (ov.rooms || state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}${r.is_frozen ? ' ❄️' : ''}</option>`).join('');

    body.innerHTML = `
      <div class="cmd-subpills">
        ${isOwner ? `<button type="button" class="cmd-subpill ${sub === 'rules' ? 'active' : ''}" data-sub="rules"><i class="fa-solid fa-shield"></i> الحماية والكلمات</button>` : ''}
        <button type="button" class="cmd-subpill ${sub === 'rooms' ? 'active' : ''}" data-sub="rooms"><i class="fa-solid fa-door-open"></i> إدارة الغرف</button>
        <button type="button" class="cmd-subpill ${sub === 'bans' ? 'active' : ''}" data-sub="bans"><i class="fa-solid fa-ban"></i> الحظر والبلاغات</button>
      </div>

      ${isOwner ? `
        <div id="cmdProt_rules" class="${sub === 'rules' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-shield"></i> جدار الحماية ومكافحة التكرار (Anti-Flood) والكلمات الممنوعة</h4>
            <label class="switch-label"><input type="checkbox" id="ownerLockGuestImgToggle" ${prot.lock_guest_images ? 'checked' : ''} /><span>منع الزوار من إرسال الصور والملفات</span></label>
            <label class="switch-label"><input type="checkbox" id="ownerBlockVpnToggle" ${prot.block_vpn ? 'checked' : ''} /><span>حظر دخول شبكات VPN / Proxy (يُستثنى المالك)</span></label>
            <label class="switch-label"><input type="checkbox" id="ownerAntifloodEnabled" ${prot.antiflood_enabled !== 0 ? 'checked' : ''} /><span>تفعيل الحماية التلقائية ضد التكرار (Anti-Flood)</span></label>
            <div class="form-grid-2">
              <div><label class="muted">أقصى عدد رسائل في النافذة</label><input type="number" id="ownerAntifloodMaxMsgs" min="2" max="20" value="${Number(prot.antiflood_max_msgs) || 5}" /></div>
              <div><label class="muted">مدة النافذة (ثوانٍ)</label><input type="number" id="ownerAntifloodWindowSec" min="2" max="60" value="${Number(prot.antiflood_window_sec) || 5}" /></div>
              <div><label class="muted">مدة كتم التكرار (دقائق)</label><input type="number" id="ownerAntifloodMuteMins" min="1" max="1440" value="${Number(prot.antiflood_mute_mins) || 5}" /></div>
              <div><label class="muted">مدة كتم الكلمات الممنوعة (دقائق)</label><input type="number" id="ownerBanWordMuteMins" min="1" max="1440" value="${Number(prot.banned_word_mute_mins) || 10}" /></div>
            </div>
            <label class="muted">الكلمات الممنوعة (تُحجب بـ *** ويُكتم المرسل مع تسجيل المخالفة):</label>
            <textarea id="ownerBannedWordsInput" rows="3">${escapeHtml((prot.banned_words || []).join('، '))}</textarea>
            <button type="button" id="ownerSaveProtBtn" class="btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> حفظ إعدادات الحماية</button>
          </div>
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-door-closed"></i> تحكم فوري بالغرف والمايكات</h4>
            <select id="ownerRoomCtrlSel">${roomOpts}</select>
            <div class="inline-row" style="flex-wrap:wrap;">
              <button type="button" id="ownerFreezeRoomOnBtn" class="btn-danger btn-xs"><i class="fa-solid fa-snowflake"></i> تجميد الغرفة</button>
              <button type="button" id="ownerFreezeRoomOffBtn" class="btn-secondary btn-xs">فك التجميد</button>
              <button type="button" id="ownerMuteAllMicsBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-microphone-slash"></i> كتم كل المايكات</button>
              <button type="button" id="ownerClearRoomBtn" class="btn-danger btn-xs"><i class="fa-solid fa-broom"></i> تنظيف الغرفة</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div id="cmdProt_rooms" class="${sub === 'rooms' ? '' : 'hidden'}">
        <div class="news-composer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>${isEditingRm ? `✏️ تعديل الغرفة: ${escapeHtml(editRm.name)}` : '🏠 إنشاء غرفة جديدة'}</strong>
            ${isEditingRm ? '<button type="button" id="admCancelRoomEditBtn" class="btn-secondary btn-xs">إلغاء التعديل</button>' : ''}
          </div>
          <div class="form-grid-2">
            <input type="text" id="admRoomName" placeholder="اسم الغرفة" value="${escapeHtml(editRm?.name || '')}" />
            <input type="text" id="admRoomDesc" placeholder="وصف الغرفة" value="${escapeHtml(editRm?.description || '')}" />
            <input type="text" id="admRoomIcon" placeholder="أيقونة الغرفة" value="${escapeHtml(editRm?.icon || '💬')}" />
            <input type="text" id="admRoomPass" placeholder="${isEditingRm ? 'كلمة مرور جديدة (اختياري)' : 'كلمة مرور (اختياري)'}" />
            <select id="admRoomTheme">
              <option value="warm_peach" ${editRm?.bg_theme === 'warm_peach' ? 'selected' : ''}>خوخ دافئ</option>
              <option value="sunset_rose" ${editRm?.bg_theme === 'sunset_rose' ? 'selected' : ''}>وردي غروب</option>
              <option value="sky_breeze" ${editRm?.bg_theme === 'sky_breeze' ? 'selected' : ''}>سماوي نقي</option>
              <option value="royal_night" ${editRm?.bg_theme === 'royal_night' ? 'selected' : ''}>ليلي ملكي</option>
            </select>
            <select id="admRoomOwner"><option value="">— بدون مالك معيّن —</option>${userOpts}</select>
          </div>
          <div class="inline-row" style="flex-wrap:wrap;">
            <input type="file" id="admRoomWallpaperFile" accept="image/gif,image/webp,image/png,image/jpeg,image/*" />
            <input type="text" id="admRoomWallpaperUrl" value="${escapeHtml(editRm?.wallpaper_url || '')}" placeholder="رابط صورة خلفية الغرفة" style="flex:1" />
            <label class="switch-label"><input type="checkbox" id="admRoomMicsEnabled" ${!editRm || editRm.mics_enabled !== 0 ? 'checked' : ''} /><span>🎙️ المايكات</span></label>
          </div>
          <button type="button" id="admSaveRoomBtn" class="btn-primary btn-sm">${isEditingRm ? '💾 حفظ تعديلات الغرفة' : '➕ إنشاء الغرفة'}</button>
          ${isEditingRm ? `
            <hr style="border:none;border-top:1px solid rgba(148,163,184,0.22);" />
            <strong>🗝️ مشرفو هذه الغرفة</strong>
            <div class="inline-row">
              <select id="admRoomStaffUserSel" style="flex:1">${userOpts}</select>
              <input type="text" id="admRoomStaffRoleInput" value="مشرف غرفة" style="width:120px;" />
              <button type="button" id="admAddRoomStaffBtn" class="btn-secondary btn-xs">➕ إضافة</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${(editRm.staff || []).map((st) => `
                <span class="rank-pill" style="background:rgba(148,163,184,0.18);color:#f8fafc;">
                  ${escapeHtml(st.name)} (${escapeHtml(st.staffRole)})
                  <button type="button" class="btn-danger btn-xs del-rm-staff-btn" data-uid="${st.userId}" style="min-height:20px;padding:1px 6px;">✕</button>
                </span>
              `).join('') || '<span class="muted">لا يوجد مشرفون مخصصون.</span>'}
            </div>
          ` : ''}
        </div>
        <div class="news-feed-list" style="margin-top:10px;">
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
      </div>

      <div id="cmdProt_bans" class="${sub === 'bans' ? '' : 'hidden'}">
        <h4 class="sub-heading">🚫 قائمة المحظورين (${(ov.bans || []).length})</h4>
        <div class="news-feed-list">
          ${(ov.bans || []).map((b) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(b.target_name)}</strong><div class="muted">السبب: ${escapeHtml(b.reason)}</div></div>
              <button type="button" class="btn-secondary btn-xs unban-btn" data-bk="${escapeHtml(b.target_key)}">فك الحظر</button>
            </div>
          `).join('') || '<div class="muted">لا يوجد محظورون.</div>'}
        </div>
        <h4 class="sub-heading">🚨 البلاغات الواردة (${(ov.reports || []).length})</h4>
        <div class="news-feed-list">
          ${(ov.reports || []).map((r) => `
            <div class="admin-list-card">
              <div><strong>المبلّغ عنه: ${escapeHtml(r.target_name)}</strong><div class="muted">من ${escapeHtml(r.reporter_name)}: ${escapeHtml(r.reason)}</div></div>
            </div>
          `).join('') || '<div class="muted">لا توجد بلاغات.</div>'}
        </div>
      </div>
    `;

    body.querySelectorAll('.cmd-subpill').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), protection: b.dataset.sub };
        renderAdminProtectionTab(body, ov, suite, isOwner);
      });
    });

    $('ownerSaveProtBtn')?.addEventListener('click', () => {
      const words = String($('ownerBannedWordsInput').value || '').split(/[\n,،]+/).map((w) => w.trim()).filter(Boolean);
      runOwnerCmdAction({
        action: 'update_protections',
        protections: {
          lock_guest_images: $('ownerLockGuestImgToggle').checked ? 1 : 0,
          block_vpn: $('ownerBlockVpnToggle').checked ? 1 : 0,
          antiflood_enabled: $('ownerAntifloodEnabled')?.checked ? 1 : 0,
          antiflood_max_msgs: Math.max(2, Number($('ownerAntifloodMaxMsgs')?.value) || 5),
          antiflood_window_sec: Math.max(2, Number($('ownerAntifloodWindowSec')?.value) || 5),
          antiflood_mute_mins: Math.max(1, Number($('ownerAntifloodMuteMins')?.value) || 5),
          banned_word_mute_mins: Math.max(1, Number($('ownerBanWordMuteMins')?.value) || 10),
          banned_words: words
        }
      }, 'تم حفظ إعدادات الحماية ومكافحة التكرار!', 'protection', 'rules');
    });
    $('ownerFreezeRoomOnBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'freeze_room', roomId: $('ownerRoomCtrlSel').value, enabled: true }, 'تم تجميد الغرفة.', 'protection', 'rules'));
    $('ownerFreezeRoomOffBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'freeze_room', roomId: $('ownerRoomCtrlSel').value, enabled: false }, 'تم فك تجميد الغرفة.', 'protection', 'rules'));
    $('ownerMuteAllMicsBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'mute_all_mics', roomId: $('ownerRoomCtrlSel').value }, 'تم كتم جميع المايكات.', 'protection', 'rules'));
    $('ownerClearRoomBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'clear_room', roomId: $('ownerRoomCtrlSel').value }, 'تم تنظيف رسائل الغرفة.', 'protection', 'rules'));

    $('admCancelRoomEditBtn')?.addEventListener('click', () => {
      state.editingRoomId = null;
      renderAdminProtectionTab(body, ov, suite, isOwner);
    });
    $('admSaveRoomBtn')?.addEventListener('click', async () => {
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
        if (!isEditingRm || passVal.length > 0) payload.roomPassword = passVal;
        if (isEditingRm && editRm) {
          await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}`, { method: 'PUT', body: payload });
          state.editingRoomId = null;
          showToast('تم حفظ تعديلات الغرفة!');
        } else {
          await api('/api/admin/rooms', { method: 'POST', body: payload });
          showToast('تمت إضافة الغرفة!');
        }
        openAdminPanel('protection', null, 'rooms');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('admAddRoomStaffBtn')?.addEventListener('click', async () => {
      if (!editRm) return;
      try {
        await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff`, {
          method: 'POST',
          body: { userId: Number($('admRoomStaffUserSel').value), staffRole: $('admRoomStaffRoleInput').value.trim() || 'مشرف غرفة' }
        });
        showToast('تم تعيين مشرف الغرفة!');
        openAdminPanel('protection', editRm.id, 'rooms');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    body.querySelectorAll('.del-rm-staff-btn').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!editRm) return;
        await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff/${b.dataset.uid}`, { method: 'DELETE' });
        openAdminPanel('protection', editRm.id, 'rooms');
      });
    });
    body.querySelectorAll('.edit-room-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.editingRoomId = b.dataset.rid;
        renderAdminProtectionTab(body, ov, suite, isOwner);
      });
    });
    body.querySelectorAll('.del-room-btn').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          await api(`/api/admin/rooms/${encodeURIComponent(b.dataset.rid)}`, { method: 'DELETE' });
          if (state.editingRoomId === b.dataset.rid) state.editingRoomId = null;
          openAdminPanel('protection', null, 'rooms');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
    body.querySelectorAll('.unban-btn').forEach((b) => {
      b.addEventListener('click', async () => {
        await api(`/api/admin/ban/${encodeURIComponent(b.dataset.bk)}`, { method: 'DELETE' });
        openAdminPanel('protection', null, 'bans');
      });
    });
  }

  function renderAdminQuizBotTab(body, ov, suite, isOwner) {
    if (!isOwner) {
      body.innerHTML = '<div class="form-error">إدارة بوت المسابقات وبنك الأسئلة متاحة للمالك فقط.</div>';
      return;
    }
    const qs = suite.quizSettings || {};
    const customQuestions = Array.isArray(qs.quiz_custom_questions) ? qs.quiz_custom_questions : [];
    const editQ = state.editingQuizQuestionId
      ? customQuestions.find((x) => x.id === state.editingQuizQuestionId)
      : null;
    const roomOpts = (ov.rooms || state.rooms || [])
      .map((r) => `<option value="${escapeHtml(r.id)}" ${r.id === 'competitions' ? 'selected' : ''}>${escapeHtml(r.name)}</option>`)
      .join('');

    body.innerHTML = `
      <div class="owner-suite-section">
        <h4><i class="fa-solid fa-robot" style="color:#F59E0B;"></i> إعدادات بوت المسابقات الذكي (${qs.builtinCount || 32} سؤال مدمج + ${customQuestions.length} سؤال مخصص)</h4>
        <label class="switch-label">
          <input type="checkbox" id="qbEnabledChk" ${qs.quiz_bot_enabled !== 0 ? 'checked' : ''} />
          <span>تفعيل بوت المسابقات تلقائياً عند توفر أعضاء</span>
        </label>
        <div class="form-grid-2">
          <div><label class="muted">الفاصل بين الأسئلة (ثوانٍ: 10–300)</label><input type="number" id="qbIntervalSec" min="10" max="300" value="${Number(qs.quiz_interval_sec) || 26}" /></div>
          <div><label class="muted">زمن التلميح التلقائي (ثوانٍ: 5–60)</label><input type="number" id="qbHintSec" min="5" max="60" value="${Number(qs.quiz_hint_sec) || 12}" /></div>
          <div><label class="muted">جائزة الروبي الأساسية (💎)</label><input type="number" id="qbRewardCoins" min="10" max="5000" value="${Number(qs.quiz_reward_coins) || 100}" /></div>
          <div>
            <label class="muted">نمط رسالة السؤال</label>
            <select id="qbMsgStyle">
              <option value="royal" ${qs.quiz_msg_style === 'royal' ? 'selected' : ''}>ملكي ذهبي</option>
              <option value="glass" ${qs.quiz_msg_style === 'glass' ? 'selected' : ''}>زجاجي عصري</option>
              <option value="classic" ${qs.quiz_msg_style === 'classic' ? 'selected' : ''}>كلاسيكي سريع</option>
            </select>
          </div>
        </div>
        <button type="button" id="qbSaveSettingsBtn" class="btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> حفظ إعدادات البوت</button>
      </div>

      <div class="owner-suite-section" style="margin-top:10px;">
        <h4><i class="fa-solid fa-power-off"></i> تشغيل / إيقاف البوت في الغرف</h4>
        <div class="inline-row" style="flex-wrap:wrap;">
          <select id="ownerQuizRoomSel" style="flex:1">${roomOpts}</select>
          <button type="button" id="ownerQuizStartBtn" class="btn-primary btn-xs"><i class="fa-solid fa-play"></i> تشغيل في الغرفة</button>
          <button type="button" id="ownerQuizStopBtn" class="btn-danger btn-xs"><i class="fa-solid fa-stop"></i> إيقاف</button>
        </div>
      </div>

      <div class="owner-suite-section" style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4><i class="fa-solid fa-circle-question"></i> ${editQ ? 'تعديل سؤال مخصص' : 'إضافة سؤال جديد إلى بنك الأسئلة'}</h4>
          ${editQ ? '<button type="button" id="qbCancelEditBtn" class="btn-secondary btn-xs">إلغاء</button>' : ''}
        </div>
        <div class="form-grid-2">
          <div><label class="muted">التصنيف</label><input type="text" id="qbQCategory" value="${escapeHtml(editQ?.category || 'عام')}" placeholder="مثال: جغرافيا، تاريخ، ألغاز" /></div>
          <div><label class="muted">الإجابة الظاهرة</label><input type="text" id="qbQDisplayAns" value="${escapeHtml(editQ?.displayAnswer || '')}" placeholder="الإجابة الرسمية" /></div>
        </div>
        <input type="text" id="qbQText" value="${escapeHtml(editQ?.q || '')}" placeholder="نص السؤال (مثال: ما هي عاصمة المملكة العربية السعودية؟)" />
        <input type="text" id="qbQAnswers" value="${escapeHtml((editQ?.a || []).join('، '))}" placeholder="الإجابات المقبولة مفصولة بفاصلة (مثال: الرياض، مدينة الرياض)" />
        <button type="button" id="qbSaveQuestionBtn" class="btn-primary btn-sm">
          <i class="fa-solid ${editQ ? 'fa-check' : 'fa-plus'}"></i> ${editQ ? 'حفظ تعديل السؤال' : 'إضافة السؤال للبنك'}
        </button>
      </div>

      <div class="news-feed-list" style="margin-top:10px;">
        <h4 class="sub-heading">الأسئلة المخصصة المضافة (${customQuestions.length})</h4>
        ${customQuestions.length ? customQuestions.map((cq) => `
          <div class="quiz-q-card admin-list-card">
            <div style="min-width:0;flex:1;">
              <div><span class="lvl-pill-mini">${escapeHtml(cq.category || 'عام')}</span> <strong>${escapeHtml(cq.q)}</strong></div>
              <div class="muted">الإجابة: ${escapeHtml(cq.displayAnswer)} (${escapeHtml((cq.a || []).join(' • '))})</div>
            </div>
            <div class="inline-row">
              <button type="button" class="btn-secondary btn-xs qb-edit-q-btn" data-qid="${escapeHtml(cq.id)}">تعديل</button>
              <button type="button" class="btn-danger btn-xs qb-del-q-btn" data-qid="${escapeHtml(cq.id)}">حذف</button>
            </div>
          </div>
        `).join('') : '<div class="muted">لم تتم إضافة أسئلة مخصصة بعد — البوت يستخدم البنك المدمج حالياً.</div>'}
      </div>
    `;

    $('qbSaveSettingsBtn')?.addEventListener('click', () => {
      runOwnerCmdAction({
        action: 'quiz_save_settings',
        enabled: $('qbEnabledChk')?.checked,
        intervalSec: Number($('qbIntervalSec')?.value) || 26,
        hintSec: Number($('qbHintSec')?.value) || 12,
        rewardCoins: Number($('qbRewardCoins')?.value) || 100,
        msgStyle: $('qbMsgStyle')?.value || 'royal'
      }, 'تم حفظ إعدادات بوت المسابقات!', 'quiz_bot');
    });

    $('ownerQuizStartBtn')?.addEventListener('click', () => runOwnerCmdAction({
      action: 'quiz_bot',
      roomId: $('ownerQuizRoomSel').value,
      enabled: true,
      rewardCoins: Number($('qbRewardCoins')?.value) || 100
    }, 'تم تشغيل بوت المسابقات في الغرفة!', 'quiz_bot'));

    $('ownerQuizStopBtn')?.addEventListener('click', () => runOwnerCmdAction({
      action: 'quiz_bot',
      roomId: $('ownerQuizRoomSel').value,
      enabled: false
    }, 'تم إيقاف بوت المسابقات في الغرفة.', 'quiz_bot'));

    $('qbCancelEditBtn')?.addEventListener('click', () => {
      state.editingQuizQuestionId = null;
      renderAdminQuizBotTab(body, ov, suite, isOwner);
    });

    $('qbSaveQuestionBtn')?.addEventListener('click', () => {
      const q = ($('qbQText')?.value || '').trim();
      const displayAnswer = ($('qbQDisplayAns')?.value || '').trim();
      const category = ($('qbQCategory')?.value || 'عام').trim();
      const rawAns = ($('qbQAnswers')?.value || '').split(/[\n,،]+/).map((s) => s.trim()).filter(Boolean);
      const answers = rawAns.length ? rawAns : (displayAnswer ? [displayAnswer] : []);
      if (editQ) {
        state.editingQuizQuestionId = null;
        runOwnerCmdAction({ action: 'quiz_update_question', questionId: editQ.id, category, q, answers, displayAnswer }, 'تم تحديث السؤال بنجاح!', 'quiz_bot');
      } else {
        runOwnerCmdAction({ action: 'quiz_add_question', category, q, answers, displayAnswer }, 'تمت إضافة السؤال إلى بنك المسابقات!', 'quiz_bot');
      }
    });

    body.querySelectorAll('.qb-edit-q-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.editingQuizQuestionId = b.dataset.qid;
        renderAdminQuizBotTab(body, ov, suite, isOwner);
      });
    });
    body.querySelectorAll('.qb-del-q-btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (state.editingQuizQuestionId === b.dataset.qid) state.editingQuizQuestionId = null;
        runOwnerCmdAction({ action: 'quiz_delete_question', questionId: b.dataset.qid }, 'تم حذف السؤال.', 'quiz_bot');
      });
    });
  }

  function renderAdminMembersControlTab(body, ov, suite, isOwner) {
    const canBank = isOwner || state.user?.role === 'co_owner' || Number(getRank(state.user?.role)?.power || 0) >= 14;
    const canPub = isOwner || hasPerm('publish_news');
    const canBan = isOwner || hasPerm('ban');
    const canMod = isOwner || hasPerm('mute') || hasPerm('kick');
    const sub = state.activeAdminSubTab?.members_control || 'detector';
    const prot = suite.protections || ov.settings || {};
    const s = ov.settings || {};
    const roomOpts = (ov.rooms || state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}${r.is_frozen ? ' ❄️' : ''}</option>`).join('');
    const targetOpts = [
      ...(suite.users || ov.users || []).filter((u) => !u.isSupremeOwner).map((u) => ({
        key: u.key,
        label: `${u.displayName} (@${u.username})${u.isShadowMuted ? ' [صامت]' : ''}${u.isFrozen ? ' [مجمد]' : ''}`
      })),
      ...(suite.liveSockets || []).filter((sk) => sk.isGuest).map((sk) => ({
        key: sk.key,
        label: `زائر: ${sk.name}${sk.isShadowMuted ? ' [صامت]' : ''}${sk.isFrozen ? ' [مجمد]' : ''}`
      }))
    ].map((t) => `<option value="${escapeHtml(t.key)}">${escapeHtml(t.label)}</option>`).join('');

    body.innerHTML = `
      <div class="cmd-subpills">
        <button type="button" class="cmd-subpill ${sub === 'detector' ? 'active' : ''}" data-sub="detector"><i class="fa-solid fa-fingerprint"></i> كاشف الهوية والأعضاء</button>
        ${canBank ? `<button type="button" class="cmd-subpill ${sub === 'bank' ? 'active' : ''}" data-sub="bank"><i class="fa-solid fa-vault"></i> بنك الروبي</button>` : ''}
        <button type="button" class="cmd-subpill ${sub === 'appearance' ? 'active' : ''}" data-sub="appearance"><i class="fa-solid fa-wand-magic-sparkles"></i> المظهر والأخبار</button>
        ${isOwner ? `<button type="button" class="cmd-subpill ${sub === 'engagement' ? 'active' : ''}" data-sub="engagement"><i class="fa-solid fa-bullhorn"></i> البث والتنشيط</button>` : ''}
      </div>

      <div id="cmdMem_detector" class="${sub === 'detector' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
        ${isOwner ? `
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-satellite-dish" style="color:#38bdf8;"></i> كاشف الهوية الحقيقية للمتصلين (${(suite.liveSockets || []).length})</h4>
            ${(suite.liveSockets || []).map((sk) => `
              <div class="identity-detector-card admin-list-card">
                <div style="min-width:0;flex:1;">
                  <strong>${escapeHtml(sk.name)} (${escapeHtml(getRank(sk.role).label)}) ${sk.isStealth ? '• <span style="color:#F59E0B;">متخفي</span>' : ''}</strong>
                  <div class="identity-meta-grid">
                    <span><i class="fa-solid fa-door-open"></i> ${escapeHtml(sk.roomName || sk.roomId || '—')}</span>
                    <span><i class="fa-solid fa-globe"></i> IP: ${escapeHtml(sk.ipAddress || '—')}</span>
                    <span><i class="fa-solid fa-earth-asia"></i> الدولة: ${escapeHtml(sk.country || 'غير محدد')}</span>
                    <span><i class="fa-solid fa-microchip"></i> البصمة: ${escapeHtml((sk.fingerprint || sk.deviceId || '—').slice(0, 16))}</span>
                  </div>
                  <div class="muted" style="font-size:10.5px;word-break:break-all;margin-top:2px;">الجهاز/المتصفح: ${escapeHtml((sk.userAgent || 'غير معروف').slice(0, 110))}</div>
                </div>
                ${sk.role !== 'site_owner' ? `<button type="button" class="btn-danger btn-xs owner-ban-ip-btn" data-ip="${escapeHtml(sk.ipAddress || '')}" data-dev="${escapeHtml(sk.deviceId || '')}" data-tk="${escapeHtml(sk.key)}"><i class="fa-solid fa-shield-virus"></i> إكس باند</button>` : ''}
              </div>
            `).join('') || '<div class="muted">لا يوجد متصلون حالياً.</div>'}
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-users-viewfinder" style="color:#F59E0B;"></i> كاشف الحسابات المتعددة (${(suite.multiAccounts || []).length})</h4>
            ${(suite.multiAccounts || []).length ? (suite.multiAccounts || []).map((m) => `
              <div class="admin-list-card">
                <div>
                  <strong>${escapeHtml(m.type)}: ${escapeHtml(String(m.fingerprint || '').slice(0, 22))}</strong>
                  <div class="muted">${(m.accounts || []).map((a) => escapeHtml(a.displayName)).join(' ، ')}</div>
                </div>
              </div>
            `).join('') : '<div class="muted">لا توجد حسابات متعددة متطابقة حالياً.</div>'}
          </div>
        ` : ''}

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
            <div class="admin-list-card" style="flex-direction:column;align-items:stretch;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                <div>
                  <strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)}) ${u.isSupremeOwner ? '<i class="fa-solid fa-shield-halved" style="color:#F59E0B;"></i>' : ''}</strong>
                  <div class="muted">${escapeHtml(u.email)} • ${roleBadgeHTML(u.role)} • 💎 ${u.coins} ${u.isGhosted ? '• <span style="color:#a78bfa;">شبح</span>' : ''}</div>
                </div>
                <div class="inline-row" style="flex-wrap:wrap;">
                  <select class="adm-user-role-sel" data-uid="${u.id}" ${u.isSupremeOwner && !isOwner ? 'disabled' : ''}>${buildAssignableRankOptions(u.role)}</select>
                  <button type="button" class="btn-primary btn-xs adm-save-role-btn" data-uid="${u.id}">تطبيق</button>
                  ${!u.isSupremeOwner || isOwner ? `<button type="button" class="btn-secondary btn-xs adm-rename-user-btn" data-uid="${u.id}" data-cur="${escapeHtml(u.displayName)}"><i class="fa-solid fa-pen"></i> الاسم</button>` : ''}
                  ${isOwner ? `<button type="button" class="btn-secondary btn-xs adm-give-coins-btn" data-uid="${u.id}">+500</button>` : ''}
                  ${canMod && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-secondary btn-xs adm-ghost-user-btn" data-uid="${u.id}" data-ghosted="${u.isGhosted ? '1' : '0'}"><i class="fa-solid fa-ghost"></i> ${u.isGhosted ? 'إلغاء شبح' : 'شبح'}</button>` : ''}
                  ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-xban-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-shield-virus"></i> إكس باند</button>` : ''}
                  ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-ban-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-ban"></i> حظر</button>` : ''}
                  ${isOwner && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-del-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}"><i class="fa-solid fa-user-slash"></i> حذف</button>` : ''}
                </div>
              </div>
              <div class="adm-user-inline-box hidden" data-uid="${u.id}"></div>
            </div>
          `).join('')}
        </div>

        ${isOwner ? `
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-clock-rotate-left"></i> سجل تغيير الأسماء</h4>
            ${(suite.users || []).filter((u) => (u.nameHistory || []).length).map((u) => `
              <div class="admin-list-card">
                <div><strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</strong><div class="muted">الأسماء السابقة: ${(u.nameHistory || []).map((h) => escapeHtml(h.name)).join(' ← ')}</div></div>
              </div>
            `).join('') || '<div class="muted">لا توجد تغييرات أسماء مسجلة.</div>'}
          </div>
        ` : ''}
      </div>

      ${canBank ? `
        <div id="cmdMem_bank" class="${sub === 'bank' ? '' : 'hidden'}">
          <div class="bank-panel-header">
            <h4><i class="fa-solid fa-vault"></i> بنك المالك لإدارة الروبي ونقاط التفاعل</h4>
            <div class="muted">ابحث عن أي عضو مسجل لإضافة أو خصم الروبي ونقاط التفاعل مع الترقية التلقائية.</div>
          </div>
          <div class="bank-search-bar" style="margin-top:8px;">
            <input type="text" id="bankSearchInput" placeholder="ابحث باسم العضو أو اسم المستخدم أو البريد..." />
            <button type="button" id="bankSearchBtn" class="btn-primary btn-sm"><i class="fa-solid fa-magnifying-glass"></i> بحث</button>
          </div>
          <div id="bankResultsList" class="news-feed-list" style="margin-top:8px;"></div>
        </div>
      ` : ''}

      <div id="cmdMem_appearance" class="${sub === 'appearance' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
        <div class="news-composer">
          <strong>🎨 هوية الموقع والمظهر العام (Dark Glassmorphism)</strong>
          <div class="form-grid-2">
            <div><label>اسم الموقع</label><input type="text" id="cmsSiteName" value="${escapeHtml(s.site_name || '')}" /></div>
            <div><label>وصف الموقع</label><input type="text" id="cmsSiteDesc" value="${escapeHtml(s.site_description || '')}" /></div>
            <div><label>لون الشريط العلوي</label><input type="color" id="cmsTopColor" value="${escapeHtml(s.top_bar_color || '#0F172A')}" /></div>
            <div><label>لون الشريط السفلي</label><input type="color" id="cmsBotColor" value="${escapeHtml(s.bottom_bar_color || '#0F172A')}" /></div>
            <div><label>لون الأزرار</label><input type="color" id="cmsBtnColor" value="${escapeHtml(s.button_color || '#F59E0B')}" /></div>
            <div><label>حجم الخط (px)</label><input type="number" id="cmsFontSize" value="${s.font_size || 15}" min="12" max="22" /></div>
          </div>
          <label>CSS مخصص للموقع</label><textarea id="cmsCustomCss" rows="2">${escapeHtml(s.custom_css || '')}</textarea>
          <label>شريط HTML علوي مخصص</label><textarea id="cmsCustomHtml" rows="2">${escapeHtml(s.custom_html || '')}</textarea>
          <button type="button" id="cmsSaveBtn" class="btn-primary btn-sm">💾 حفظ وتحديث المظهر فوراً</button>
        </div>

        ${isOwner ? `
          <div class="owner-suite-section luxury-fx-panel">
            <h4><i class="fa-solid fa-wand-magic-sparkles" style="color:#F59E0B;"></i> المؤثرات البصرية الحصرية</h4>
            <div class="luxury-fx-grid">
              <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxGalaxyToggle" ${Number(prot.fx_owner_galaxy_identity ?? s.fx_owner_galaxy_identity ?? 1) !== 0 ? 'checked' : ''} /><strong>هوية «سيد المجرة والزمن»</strong></div></label>
              <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxGlassToggle" ${Number(prot.fx_glass_bubbles ?? s.fx_glass_bubbles ?? 1) !== 0 ? 'checked' : ''} /><strong>فقاعات الدردشة الزجاجية</strong></div></label>
              <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxMicWavesToggle" ${Number(prot.fx_mic_waves ?? s.fx_mic_waves ?? 1) !== 0 ? 'checked' : ''} /><strong>موجات الصوت حول المايكات</strong></div></label>
              <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxEntranceToggle" ${Number(prot.fx_cinematic_entrance ?? s.fx_cinematic_entrance ?? 1) !== 0 ? 'checked' : ''} /><strong>بطاقة الدخول السينمائية</strong></div></label>
              <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxTypingToggle" ${Number(prot.fx_typing_avatars ?? s.fx_typing_avatars ?? 1) !== 0 ? 'checked' : ''} /><strong>مؤشر الكتابة بالصور</strong></div></label>
              <div class="luxury-fx-card">
                <div class="luxury-fx-head"><strong>السهرة الليلية</strong></div>
                <select id="ownerFxNightSelect">
                  <option value="always_on" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere ?? 'always_on') === 'always_on' ? 'selected' : ''}>🌙 مفعّلة دائماً</option>
                  <option value="auto" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere) === 'auto' ? 'selected' : ''}>🌗 تلقائي ليلاً</option>
                  <option value="off" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere) === 'off' ? 'selected' : ''}>☀️ متوقفة</option>
                </select>
              </div>
            </div>
            <div class="inline-row" style="flex-wrap:wrap;margin-top:6px;">
              <button type="button" id="ownerSaveLuxuryFxBtn" class="btn-primary btn-sm">💾 حفظ المؤثرات للجميع</button>
              <button type="button" id="ownerPreviewEntranceBtn" class="btn-secondary btn-sm">✨ معاينة الدخول السينمائي</button>
            </div>
          </div>
        ` : ''}

        <div class="news-composer">
          <strong>📰 نشر خبر جديد</strong>
          <input type="text" id="admNewsTitle" placeholder="عنوان الخبر" />
          <textarea id="admNewsContent" rows="2" placeholder="تفاصيل الخبر..."></textarea>
          <div class="inline-row">
            <input type="file" id="admNewsFile" accept="image/gif,image/webp,image/png,image/jpeg,image/*" />
            <button type="button" id="admNewsPublishBtn" class="btn-primary btn-sm" ${!canPub ? 'disabled' : ''}>🚀 نشر</button>
          </div>
          <div class="news-feed-list" style="margin-top:6px;">
            ${(ov.news || []).map((n) => `
              <div class="admin-list-card"><div><strong>${escapeHtml(n.title)}</strong><div class="muted">${escapeHtml(n.content.slice(0, 80))}</div></div><button type="button" class="btn-danger btn-xs adm-del-news-btn" data-nid="${n.id}">حذف</button></div>
            `).join('') || '<div class="muted">لا توجد أخبار.</div>'}
          </div>
        </div>

        <div class="news-composer">
          <strong>➕ إضافة إيموجي / ملصق مخصص</strong>
          <div class="inline-row">
            <input type="text" id="admEmojiCode" placeholder="الكود مثال: :وردة:" />
            <input type="file" id="admEmojiFile" accept="image/gif,image/webp,image/png,image/jpeg,image/*" />
            <button type="button" id="admAddEmojiBtn" class="btn-primary btn-sm">إضافة</button>
          </div>
          <div class="received-gifts-grid" style="margin-top:6px;">
            ${(ov.emojis || []).map((e) => `
              <div class="addon-card"><img src="${escapeHtml(e.image_url)}" style="width:34px;height:34px;object-fit:contain;" alt="" /><strong>${escapeHtml(e.code)}</strong><button type="button" class="btn-danger btn-xs del-em-btn" data-eid="${e.id}">حذف</button></div>
            `).join('')}
          </div>
        </div>
      </div>

      ${isOwner ? `
        <div id="cmdMem_engagement" class="${sub === 'engagement' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-gavel"></i> ردع وتحكم فوري بالأعضاء</h4>
            <select id="ownerModTargetSel">${targetOpts || '<option value="">لا يوجد أعضاء</option>'}</select>
            <div class="inline-row" style="flex-wrap:wrap;">
              <button type="button" id="ownerShadowMuteOnBtn" class="btn-secondary btn-xs">كتم صامت</button>
              <button type="button" id="ownerShadowMuteOffBtn" class="btn-secondary btn-xs">فك الكتم الصامت</button>
              <button type="button" id="ownerFreezeUserOnBtn" class="btn-danger btn-xs">تجميد تام</button>
              <button type="button" id="ownerFreezeUserOffBtn" class="btn-secondary btn-xs">فك التجميد</button>
            </div>
            <div class="inline-row" style="flex-wrap:wrap;">
              <select id="ownerMoveDestRoomSel" style="flex:1">${roomOpts}</select>
              <button type="button" id="ownerMoveUserBtn" class="btn-primary btn-xs">سحب ونقل للغرفة</button>
            </div>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-bullhorn"></i> إعلان إداري عاجل وتثبيت ملكي</h4>
            <input type="text" id="ownerBroadcastTitle" value="📢 إعلان إداري عاجل" placeholder="عنوان الإعلان" />
            <textarea id="ownerBroadcastMsg" rows="2" placeholder="اكتب نص الإعلان العاجل..."></textarea>
            <button type="button" id="ownerBroadcastBtn" class="btn-primary btn-sm"><i class="fa-solid fa-rocket"></i> بث عاجل للجميع</button>
            <hr style="border:none;border-top:1px solid rgba(148,163,184,0.22);" />
            <select id="ownerPinRoomSel">${roomOpts}</select>
            <input type="text" id="ownerPinText" placeholder="نص الرسالة المثبتة أعلى الغرفة (فارغ للإزالة)" />
            <button type="button" id="ownerPinBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-thumbtack"></i> حفظ التثبيت الملكي</button>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-masks-theater"></i> الإرسال باسم النظام أو عضو آخر</h4>
            <div class="form-grid-2">
              <select id="ownerSendAsRoom">${roomOpts}</select>
              <select id="ownerSendAsMode"><option value="system">🛡️ باسم النظام الرسمي</option><option value="user">🎭 نيابة عن عضو</option></select>
            </div>
            <select id="ownerSendAsTarget">${targetOpts || '<option value="">اختر عضواً</option>'}</select>
            <input type="text" id="ownerSendAsText" placeholder="اكتب نص الرسالة..." />
            <button type="button" id="ownerSendAsBtn" class="btn-secondary btn-sm">إرسال الرسالة</button>
          </div>

          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-coins"></i> المطر الذهبي، صندوق الحظ، والتعزيز</h4>
            <div class="form-grid-2">
              <select id="ownerRainRoomSel"><option value="all">🌟 جميع الغرف</option>${roomOpts}</select>
              <input type="number" id="ownerRainAmount" value="100" min="10" max="10000" />
            </div>
            <button type="button" id="ownerRainBtn" class="btn-primary btn-sm"><i class="fa-solid fa-cloud-showers-heavy"></i> إطلاق المطر الذهبي</button>
            <label class="switch-label"><input type="checkbox" id="ownerLuckyEnabled" ${prot.lucky_box_enabled !== 0 ? 'checked' : ''} /><span>تفعيل صندوق الحظ اليومي</span></label>
            <div class="form-grid-2">
              <div><label class="muted">أقل جائزة</label><input type="number" id="ownerLuckyMin" value="${Number(prot.lucky_box_min) || 50}" min="10" /></div>
              <div><label class="muted">أكبر جائزة</label><input type="number" id="ownerLuckyMax" value="${Number(prot.lucky_box_max) || 500}" min="10" /></div>
              <div><label class="muted">تعزيز المتواجدين (+)</label><input type="number" id="ownerOnlineBoost" value="${Number(prot.online_boost) || 0}" min="0" max="5000" /></div>
              <div><label class="muted">مكافأة الدعوة</label><input type="number" id="ownerRefBonus" value="${Number(prot.referral_bonus) || 200}" min="0" max="10000" /></div>
            </div>
            <button type="button" id="ownerSaveBoostsBtn" class="btn-primary btn-sm">حفظ إعدادات التنشيط</button>
          </div>
        </div>
      ` : ''}
    `;

    body.querySelectorAll('.cmd-subpill').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), members_control: b.dataset.sub };
        renderAdminMembersControlTab(body, ov, suite, isOwner);
      });
    });

    body.querySelectorAll('.owner-ban-ip-btn').forEach((b) => {
      b.addEventListener('click', () => {
        runOwnerCmdAction({ action: 'ban_ip', ipAddress: b.dataset.ip, deviceId: b.dataset.dev, targetKey: b.dataset.tk }, 'تم حظر IP والجهاز نهائياً!', 'members_control', 'detector');
      });
    });

    const openInlineUserBox = (uid, title, bodyHtml, confirmText, danger, onConfirm) => {
      body.querySelectorAll('.adm-user-inline-box').forEach((b) => { b.innerHTML = ''; b.classList.add('hidden'); });
      const box = body.querySelector(`.adm-user-inline-box[data-uid="${uid}"]`);
      if (!box) return;
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="adm-user-inline-head"><span>${title}</span><button type="button" class="btn-secondary btn-xs adm-inline-cancel-btn" style="padding:2px 7px;min-height:24px;">✕</button></div>
        ${bodyHtml}
        <div class="inline-row" style="justify-content:flex-end;">
          <button type="button" class="btn-secondary btn-xs adm-inline-cancel-btn">إلغاء</button>
          <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'} btn-xs adm-inline-confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      `;
      box.querySelectorAll('.adm-inline-cancel-btn').forEach((c) => c.addEventListener('click', () => { box.innerHTML = ''; box.classList.add('hidden'); }));
      box.querySelector('.adm-inline-confirm-btn')?.addEventListener('click', () => onConfirm(box));
    };

    $('admCreateUserBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/admin/users', {
          method: 'POST',
          body: { username: $('admNewUsername').value, displayName: $('admNewDisplay').value, email: $('admNewEmail').value, password: $('admNewPass').value, role: $('admNewRole').value }
        });
        showToast('تم إنشاء الحساب بنجاح!');
        openAdminPanel('members_control', null, 'detector');
      } catch (err) { showToast(err.message, true); }
    });
    body.querySelectorAll('.adm-save-role-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = Number(btn.dataset.uid);
        const sel = body.querySelector(`.adm-user-role-sel[data-uid="${uid}"]`);
        try {
          await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { role: sel.value } });
          showToast('تم تحديث الرتبة!');
          openAdminPanel('members_control', null, 'detector');
        } catch (err) { showToast(err.message, true); }
      });
    });
    body.querySelectorAll('.adm-rename-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        openInlineUserBox(uid, 'تغيير الاسم المعروض', `<input type="text" class="adm-inline-rename-inp" value="${escapeHtml(btn.dataset.cur || '')}" maxlength="28" />`, 'حفظ', false, async (box) => {
          const nextName = (box.querySelector('.adm-inline-rename-inp')?.value || '').trim();
          if (nextName.length < 2) return showToast('أدخل اسماً من حرفين على الأقل.', true);
          try {
            await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { displayName: nextName } });
            showToast('تم تحديث الاسم المعروض!');
            openAdminPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
    });
    body.querySelectorAll('.adm-give-coins-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.socket.emit('admin_give_coins', { userId: Number(btn.dataset.uid), amount: 500 }, (res) => {
          if (res?.error) return showToast(res.error, true);
          showToast('تم إرسال +500 روبي للعضو.');
          setTimeout(() => openAdminPanel('members_control', null, 'detector'), 350);
        });
      });
    });
    body.querySelectorAll('.adm-ghost-user-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const next = btn.dataset.ghosted !== '1';
        try {
          await api('/api/admin/ghost', { method: 'POST', body: { userId: Number(btn.dataset.uid), enabled: next } });
          showToast(next ? 'تم تفعيل وضع الشبح.' : 'تم إلغاء وضع الشبح.');
          openAdminPanel('members_control', null, 'detector');
        } catch (err) { showToast(err.message, true); }
      });
    });
    body.querySelectorAll('.adm-xban-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        openInlineUserBox(uid, `إكس باند "${escapeHtml(btn.dataset.uname)}"`, `<input type="text" class="adm-inline-ban-reason" placeholder="سبب الإكس باند..." />`, 'تأكيد إكس باند', true, async (box) => {
          const reason = (box.querySelector('.adm-inline-ban-reason')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة السبب (حرفين على الأقل).', true);
          try {
            await api('/api/admin/ban', { method: 'POST', body: { targetKey: `user:${uid}`, reason, banType: 'xban' } });
            showToast('تم تنفيذ إكس باند بنجاح.');
            openAdminPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
    });
    body.querySelectorAll('.adm-ban-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        openInlineUserBox(uid, `حظر نهائي لـ "${escapeHtml(btn.dataset.uname)}"`, `<input type="text" class="adm-inline-ban-reason" placeholder="سبب الحظر..." />`, 'تأكيد الحظر', true, async (box) => {
          const reason = (box.querySelector('.adm-inline-ban-reason')?.value || '').trim();
          if (reason.length < 2) return showToast('يرجى كتابة السبب (حرفين على الأقل).', true);
          try {
            await api('/api/admin/ban', { method: 'POST', body: { targetKey: `user:${uid}`, reason, banType: 'ban' } });
            showToast('تم حظر العضو نهائياً.');
            openAdminPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
    });
    body.querySelectorAll('.adm-del-user-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        openInlineUserBox(uid, `حذف حساب "${escapeHtml(btn.dataset.uname)}" نهائياً؟`, `<div class="muted">لا يمكن التراجع عن الحذف النهائي.</div>`, 'تأكيد الحذف', true, async () => {
          try {
            await api(`/api/admin/users/${uid}`, { method: 'DELETE' });
            showToast('تم حذف الحساب نهائياً.');
            openAdminPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
    });

    if (canBank && sub === 'bank') {
      const loadBankUsers = async (query = '') => {
        const listEl = $('bankResultsList');
        if (!listEl) return;
        listEl.innerHTML = '<div class="muted" style="text-align:center;padding:12px;">جاري البحث...</div>';
        try {
          const res = await api(`/api/owner/bank/search?q=${encodeURIComponent(query)}`);
          const usersList = res?.users || [];
          listEl.innerHTML = usersList.length ? usersList.map((bu) => `
            <div class="bank-user-card" data-bank-uk="${escapeHtml(bu.key)}">
              <div class="bank-user-top">
                <div><strong>${escapeHtml(bu.displayName)} (@${escapeHtml(bu.username)})</strong><div style="margin-top:2px;">${roleBadgeHTML(bu.role)}</div></div>
                <div class="bank-balance-pills">
                  <span class="bank-balance-pill"><i class="fa-solid fa-gem" style="color:#f43f5e;"></i> <span class="bank-cur-coins">${Number(bu.coins || 0)}</span> روبي</span>
                  <span class="bank-balance-pill"><i class="fa-solid fa-fire" style="color:#fb923c;"></i> <span class="bank-cur-act">${Number(bu.activityPoints || 0)}</span> تفاعل</span>
                </div>
              </div>
              <div class="bank-adjust-controls">
                <div><label class="muted">كمية الروبي</label><input type="number" class="bank-ruby-inp" value="100" min="0" max="1000000" /></div>
                <div><label class="muted">نقاط التفاعل</label><input type="number" class="bank-act-inp" value="0" min="0" max="1000000" /></div>
                <div><label class="muted">ملاحظة</label><input type="text" class="bank-note-inp" placeholder="سبب التعديل..." /></div>
              </div>
              <div class="bank-adjust-actions">
                <button type="button" class="btn-primary btn-xs bank-apply-btn" data-dir="1"><i class="fa-solid fa-plus"></i> إضافة</button>
                <button type="button" class="btn-danger btn-xs bank-apply-btn" data-dir="-1"><i class="fa-solid fa-minus"></i> خصم</button>
              </div>
            </div>
          `).join('') : '<div class="muted" style="text-align:center;padding:12px;">لا توجد نتائج مطابقة.</div>';
          listEl.querySelectorAll('.bank-apply-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const card = btn.closest('.bank-user-card');
              const targetKey = card?.dataset.bankUk;
              if (!targetKey) return;
              const dir = Number(btn.dataset.dir) || 1;
              const rubyAmt = Math.abs(Number(card.querySelector('.bank-ruby-inp')?.value) || 0);
              const actAmt = Math.abs(Number(card.querySelector('.bank-act-inp')?.value) || 0);
              const note = (card.querySelector('.bank-note-inp')?.value || '').trim();
              if (!rubyAmt && !actAmt) return showToast('أدخل كمية أكبر من صفر.', true);
              try {
                const adjRes = await api('/api/owner/bank/adjust', { method: 'POST', body: { targetKey, rubyDelta: dir * rubyAmt, activityDelta: dir * actAmt, note } });
                if (adjRes?.user) {
                  if (card.querySelector('.bank-cur-coins')) card.querySelector('.bank-cur-coins').textContent = String(adjRes.user.coins || 0);
                  if (card.querySelector('.bank-cur-act')) card.querySelector('.bank-cur-act').textContent = String(adjRes.user.activityPoints || 0);
                  if (state.user && state.user.key === adjRes.user.key) { state.user = adjRes.user; renderUserIdentity(); }
                }
                showToast(dir > 0 ? 'تمت إضافة الرصيد بنجاح!' : 'تم خصم الرصيد بنجاح!');
              } catch (err) { showToast(err.message, true); }
            });
          });
        } catch (err) { listEl.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`; }
      };
      $('bankSearchBtn')?.addEventListener('click', () => loadBankUsers($('bankSearchInput')?.value || ''));
      $('bankSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); loadBankUsers($('bankSearchInput')?.value || ''); } });
      loadBankUsers('');
    }

    $('cmsSaveBtn')?.addEventListener('click', async () => {
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
      } catch (err) { showToast(err.message, true); }
    });
    $('ownerPreviewEntranceBtn')?.addEventListener('click', () => { if (state.user) showCinematicEntrance(state.user); });
    $('ownerSaveLuxuryFxBtn')?.addEventListener('click', () => {
      state.userNightPref = 'follow';
      localStorage.setItem('chat_night_atmos_pref', 'follow');
      runOwnerCmdAction({
        action: 'update_protections',
        protections: {
          fx_owner_galaxy_identity: $('ownerFxGalaxyToggle')?.checked ? 1 : 0,
          fx_glass_bubbles: $('ownerFxGlassToggle')?.checked ? 1 : 0,
          fx_mic_waves: $('ownerFxMicWavesToggle')?.checked ? 1 : 0,
          fx_cinematic_entrance: $('ownerFxEntranceToggle')?.checked ? 1 : 0,
          fx_typing_avatars: $('ownerFxTypingToggle')?.checked ? 1 : 0,
          fx_night_atmosphere: $('ownerFxNightSelect')?.value || 'always_on'
        }
      }, 'تم حفظ وتطبيق المؤثرات للجميع!', 'members_control', 'appearance');
    });
    $('admNewsPublishBtn')?.addEventListener('click', async () => {
      try {
        let imageUrl = '';
        const file = $('admNewsFile')?.files[0];
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          const up = await api('/api/upload/news', { method: 'POST', body: fd });
          imageUrl = up.url;
        }
        await api('/api/news', { method: 'POST', body: { title: $('admNewsTitle').value, content: $('admNewsContent').value, imageUrl } });
        showToast('تم نشر الخبر!');
        openAdminPanel('members_control', null, 'appearance');
      } catch (err) { showToast(err.message, true); }
    });
    body.querySelectorAll('.adm-del-news-btn').forEach((b) => {
      b.addEventListener('click', async () => { await api(`/api/news/${b.dataset.nid}`, { method: 'DELETE' }); openAdminPanel('members_control', null, 'appearance'); });
    });
    $('admAddEmojiBtn')?.addEventListener('click', async () => {
      try {
        const file = $('admEmojiFile')?.files[0];
        if (!file) return showToast('اختر صورة الملصق أولاً.', true);
        const fd = new FormData();
        fd.append('file', file);
        const up = await api('/api/upload/emoji', { method: 'POST', body: fd });
        await api('/api/admin/emojis', { method: 'POST', body: { code: $('admEmojiCode').value, imageUrl: up.url } });
        showToast('تمت إضافة الملصق!');
        openAdminPanel('members_control', null, 'appearance');
      } catch (err) { showToast(err.message, true); }
    });
    body.querySelectorAll('.del-em-btn').forEach((b) => {
      b.addEventListener('click', async () => { await api(`/api/admin/emojis/${b.dataset.eid}`, { method: 'DELETE' }); openAdminPanel('members_control', null, 'appearance'); });
    });

    $('ownerShadowMuteOnBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'shadow_mute', targetKey: $('ownerModTargetSel').value, enabled: true }, 'تم تطبيق الكتم الصامت.', 'members_control', 'engagement'));
    $('ownerShadowMuteOffBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'shadow_mute', targetKey: $('ownerModTargetSel').value, enabled: false }, 'تم إلغاء الكتم الصامت.', 'members_control', 'engagement'));
    $('ownerFreezeUserOnBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'freeze_user', targetKey: $('ownerModTargetSel').value, enabled: true }, 'تم تجميد العضو.', 'members_control', 'engagement'));
    $('ownerFreezeUserOffBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'freeze_user', targetKey: $('ownerModTargetSel').value, enabled: false }, 'تم فك تجميد العضو.', 'members_control', 'engagement'));
    $('ownerMoveUserBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'move_user', targetKey: $('ownerModTargetSel').value, toRoomId: $('ownerMoveDestRoomSel').value }, 'تم نقل العضو للغرفة المحددة.', 'members_control', 'engagement'));
    $('ownerBroadcastBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'global_broadcast', title: $('ownerBroadcastTitle').value, content: $('ownerBroadcastMsg').value }, 'تم إرسال الإعلان العاجل لكل الغرف!', 'members_control', 'engagement'));
    $('ownerPinBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'pin_message', roomId: $('ownerPinRoomSel').value, message: $('ownerPinText').value }, 'تم تحديث التثبيت الملكي.', 'members_control', 'engagement'));
    $('ownerSendAsBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'send_as', roomId: $('ownerSendAsRoom').value, asMode: $('ownerSendAsMode').value, targetUserKey: $('ownerSendAsTarget').value, content: $('ownerSendAsText').value }, 'تم إرسال الرسالة!', 'members_control', 'engagement'));
    $('ownerRainBtn')?.addEventListener('click', () => runOwnerCmdAction({ action: 'golden_rain', roomId: $('ownerRainRoomSel').value, amountPerUser: Number($('ownerRainAmount').value) || 100 }, 'تم إطلاق المطر الذهبي!', 'members_control', 'engagement'));
    $('ownerSaveBoostsBtn')?.addEventListener('click', () => runOwnerCmdAction({
      action: 'update_protections',
      protections: {
        lucky_box_enabled: $('ownerLuckyEnabled').checked ? 1 : 0,
        lucky_box_min: Number($('ownerLuckyMin').value) || 50,
        lucky_box_max: Number($('ownerLuckyMax').value) || 500,
        online_boost: Number($('ownerOnlineBoost').value) || 0,
        referral_bonus: Number($('ownerRefBonus').value) || 200
      }
    }, 'تم حفظ إعدادات التنشيط!', 'members_control', 'engagement'));
  }

  function renderAdminAuditLogTab(body, _ov, suite, isOwner) {
    const logs = Array.isArray(suite.adminLogs) ? suite.adminLogs : [];
    const pmAlerts = Array.isArray(suite.pmLinkAlerts) ? suite.pmLinkAlerts : [];
    body.innerHTML = `
      <div class="owner-suite-section">
        <h4><i class="fa-solid fa-clipboard-list" style="color:#F59E0B;"></i> السجل الرقابي والتنبيهات (${logs.length} إجراء • ${pmAlerts.length} رادار روابط)</h4>
        ${!isOwner ? '<div class="muted">السجل الرقابي الكامل مخصص لحساب المالك.</div>' : `
          <div class="inline-row" style="flex-wrap:wrap;margin-bottom:8px;">
            <input type="text" id="auditSearchInput" placeholder="تصفية السجل (اسم، إجراء، هدف)..." style="flex:1;min-width:180px;" />
            <select id="auditTypeFilter">
              <option value="all">الكل</option>
              <option value="logs">الإجراءات الإدارية</option>
              <option value="pm">رادار الروابط</option>
            </select>
          </div>
          <div id="auditListContainer" class="news-feed-list"></div>
        `}
      </div>
    `;
    if (!isOwner) return;
    const renderFiltered = () => {
      const q = ($('auditSearchInput')?.value || '').trim().toLowerCase();
      const kind = $('auditTypeFilter')?.value || 'all';
      const box = $('auditListContainer');
      if (!box) return;
      const items = [];
      if (kind !== 'pm') {
        logs.forEach((lg) => items.push({
          kind: 'log',
          ts: lg.created_at || '',
          title: `${lg.action} — بواسطة ${lg.actor_name}`,
          sub: `${lg.target_name || lg.target_key || ''}${lg.details ? ` • ${lg.details}` : ''}`
        }));
      }
      if (kind !== 'logs') {
        pmAlerts.forEach((al) => items.push({
          kind: 'pm',
          ts: al.created_at || '',
          title: `🔗 رادار الخاص: ${al.fromName} ← ${al.toName}`,
          sub: al.content || ''
        }));
      }
      const filtered = q ? items.filter((it) => `${it.title} ${it.sub}`.toLowerCase().includes(q)) : items;
      box.innerHTML = filtered.slice(0, 60).map((it) => `
        <div class="admin-list-card">
          <div style="min-width:0;flex:1;">
            <strong>${escapeHtml(it.title)}</strong>
            <div class="muted">${escapeHtml(it.sub)}</div>
          </div>
          <span class="muted" style="font-size:10.5px;">${it.ts ? new Date(it.ts).toLocaleTimeString('ar-EG') : ''}</span>
        </div>
      `).join('') || '<div class="muted">لا توجد سجلات مطابقة.</div>';
    };
    $('auditSearchInput')?.addEventListener('input', renderFiltered);
    $('auditTypeFilter')?.addEventListener('change', renderFiltered);
    renderFiltered();
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
  async function fetchMissedRoomMessages() {
    const roomId = state.currentRoom?.id;
    if (!roomId || !state.token) return;
    try {
      const afterTs = Math.max(0, Number(state.lastRoomMsgTs) || 0);
      const res = await api(`/api/rooms/${encodeURIComponent(roomId)}/messages?after=${afterTs}&limit=100`);
      const list = Array.isArray(res?.messages) ? res.messages : [];
      for (const m of list) {
        appendOrReconcileMessage(m);
      }
    } catch {
      // ignore transient catch-up error
    }
  }

  function setReconnectBannerVisible(visible) {
    const banner = $('reconnectBanner');
    if (!banner) return;
    banner.classList.toggle('hidden', !visible);
  }

  function connectSocket() {
    if (state.socket) {
      state.socket.disconnect();
      state.socket = null;
    }
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }

    const savedRoom = state.currentRoom?.id || localStorage.getItem(ROOM_KEY) || 'general';
    const socket = io({
      auth: {
        token: state.token,
        roomId: savedRoom,
        deviceId: state.deviceId,
        fingerprint: state.fingerprint
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 6000,
      timeout: 20000
    });
    state.socket = socket;

    socket.on('connect', () => {
      setReconnectBannerVisible(false);
      socket.emit('heartbeat', { ts: Date.now() });
      if (state.wasDisconnected) {
        state.wasDisconnected = false;
        fetchMissedRoomMessages();
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        state.wasDisconnected = true;
        setReconnectBannerVisible(true);
      }
    });

    socket.io.on('reconnect_attempt', () => {
      setReconnectBannerVisible(true);
      socket.auth = {
        token: state.token,
        roomId: state.currentRoom?.id || localStorage.getItem(ROOM_KEY) || 'general',
        deviceId: state.deviceId,
        fingerprint: state.fingerprint
      };
    });

    if (!state.reconnectBound) {
      state.reconnectBound = true;
      const recoverConnection = () => {
        if (state.token && state.user && state.socket && !state.socket.connected) {
          state.socket.auth = {
            token: state.token,
            roomId: state.currentRoom?.id || localStorage.getItem(ROOM_KEY) || 'general',
            deviceId: state.deviceId,
            fingerprint: state.fingerprint
          };
          state.socket.connect();
        }
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') recoverConnection();
      });
      window.addEventListener('online', () => {
        recoverConnection();
      });
      window.addEventListener('offline', () => {
        if (state.token && state.user) {
          state.wasDisconnected = true;
          setReconnectBannerVisible(true);
        }
      });
    }

    // 10-second continuous heartbeat
    state.heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { ts: Date.now() });
      }
    }, 10000);

    socket.on('connect_error', (err) => {
      const msg = String(err?.message || '');
      if (msg.startsWith('BANNED:') || msg === 'AUTH_REQUIRED') {
        showToast(msg, true);
        logoutUser();
        return;
      }
      state.wasDisconnected = true;
      setReconnectBannerVisible(true);
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
      renderRoomUsers();

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
      state.ytForceVideo = false;
      state.quizBotState = data.quizBot || { active: false };
      state.typingUsers.clear();
      renderTypingAvatarsBar();
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
      renderRoomUsers();
    });

    socket.on('persistent_members', (list) => {
      state.persistentMembers = list || [];
      renderRoomUsers();
    });

    socket.on('new_message', (msg) => {
      if (state.currentRoom?.id === msg.room_id) {
        appendOrReconcileMessage(msg);
      }
    });

    socket.on('room_notice', (data) => {
      if (state.currentRoom?.id === data?.roomId) {
        appendRoomNotice(data);
        if (data?.user && (data.kind === 'royal_join' || data.kind === 'join') && data.user.key !== state.user?.key) {
          showCinematicEntrance(data.user);
        }
      }
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
        const changedVid = state.currentRoom.youtube_video_id !== (yt.youtubeVideoId || '');
        state.currentRoom.youtube_video_id = yt.youtubeVideoId || '';
        state.currentRoom.youtube_title = yt.youtubeTitle || '';
        state.currentRoom.youtube_is_playing = yt.youtubeIsPlaying ? 1 : 0;
        state.currentRoom.youtube_mini_mode = yt.youtubeMiniMode ? 1 : 0;
        state.currentRoom.youtube_by_key = yt.youtubeByKey || '';
        state.currentRoom.youtube_by_name = yt.youtubeByName || '';
        if (changedVid || !yt.youtubeIsPlaying) state.ytForceVideo = false;
        renderRoomYoutubeBar();
      }
    });

    socket.on('quiz_bot_state', (qb) => {
      if (qb && qb.roomId === state.currentRoom?.id) {
        state.quizBotState = qb;
        renderQuizBotRoomBar();
      }
    });

    socket.on('mic_state', ({ roomId, slots }) => {
      if (state.currentRoom?.id === roomId) {
        state.mics = slots || [];
        renderMics();
      }
    });

    socket.on('mic_speaking_level', ({ roomId, slot, level }) => {
      if (state.currentRoom?.id !== roomId) return;
      state.micLevelBySlot.set(Number(slot), { level: Number(level) || 0, ts: Date.now() });
      startMicWaveformLoop();
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
      const giftMsg = `🎁 استلمت هدية ${gift.emoji} ${gift.name} من ${tx.from_name}!`;
      showToast(giftMsg);
      dispatchWebPush('هدية جديدة', giftMsg);
    });

    socket.on('new_notification', (notif) => {
      updateNotificationBadge(notif.unreadCount !== undefined ? notif.unreadCount : (state.social.unreadNotifCount + 1));
      if (notif.category !== 'mention' && notif.category !== 'warning') {
        playNotificationChime(notif.category === 'gift' ? 'gift' : 'notif');
      }
      showToast(`${notif.title}: ${notif.body}`);
      dispatchWebPush(notif.title || 'إشعار جديد', notif.body || '');
    });

    socket.on('mention_alert', ({ fromName, content }) => {
      playNotificationChime('mention');
      showToast(`🔔 نداء من ${fromName}: ${content}`);
      dispatchWebPush(`🔔 نداء من ${fromName}`, content);
    });

    socket.on('admin_warning', ({ byName, reason }) => {
      playNotificationChime('mention');
      showToast(`⚠️ تحذير إداري من ${byName || 'الإدارة'}: ${reason || 'يرجى الالتزام بقوانين الغرفة'}`, true);
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
        dispatchWebPush(`✉️ رسالة خاصة من ${pm.from_name}`, pm.content || '');
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

    socket.on('user_typing', ({ roomId, userKey, name, role, avatarUrl, avatarFrame, isTyping }) => {
      if (state.currentRoom?.id !== roomId || userKey === state.user?.key) return;
      if (isTyping) {
        state.typingUsers.set(userKey, {
          key: userKey,
          name: name || 'عضو',
          role: role || 'member',
          avatarUrl: avatarUrl || '',
          avatarFrame: avatarFrame || 'none',
          expiresAt: Date.now() + 4500
        });
        if (!state.typingPruneTimer) {
          state.typingPruneTimer = setInterval(() => {
            renderTypingAvatarsBar();
            if (state.typingUsers.size === 0 && state.typingPruneTimer) {
              clearInterval(state.typingPruneTimer);
              state.typingPruneTimer = null;
            }
          }, 1200);
        }
      } else {
        state.typingUsers.delete(userKey);
      }
      renderTypingAvatarsBar();
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
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch {
      // ignore storage quota
    }
    if (user?.isGuest && user?.key) {
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify({ key: user.key, name: user.name || '' }));
    }
    $('authView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    setReconnectBannerVisible(false);
    connectSocket();
  }

  function logoutUser() {
    stopLocalMicStream();
    closeAllMicPeers();
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    if (state.socket) {
      try {
        state.socket.emit('explicit_logout');
      } catch {
        // ignore
      }
      state.socket.disconnect();
    }
    state.socket = null;
    state.user = null;
    state.token = '';
    state.wasDisconnected = false;
    setReconnectBannerVisible(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
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
        let savedGuestKey = '';
        try {
          const saved = JSON.parse(localStorage.getItem(GUEST_PROFILE_KEY) || 'null');
          if (saved && saved.key) savedGuestKey = String(saved.key);
        } catch {
          // ignore
        }
        const res = await api('/api/guest', {
          method: 'POST',
          body: { name: $('guestName').value, guestKey: savedGuestKey }
        });
        if (res?.user?.key) {
          localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify({ key: res.user.key, name: res.user.name }));
        }
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
    $('quickTextStyleBtn')?.addEventListener('click', () => {
      const bar = $('inlineMsgStyleBar');
      if (!bar) return;
      const willOpen = bar.classList.contains('hidden');
      bar.classList.toggle('hidden', !willOpen);
      if (willOpen) renderInlineMsgStyleBar();
    });
    $('inlineMsgCloseBtn')?.addEventListener('click', () => {
      $('inlineMsgStyleBar')?.classList.add('hidden');
    });
    $('inlineMsgNameCustBtn')?.addEventListener('click', () => {
      $('inlineMsgStyleBar')?.classList.add('hidden');
      openCustomizeModal('options');
    });
    $('inlineMsgColorPicker')?.addEventListener('change', (e) => {
      saveInlineMsgStyle({ textColor: e.target.value });
    });
    document.querySelectorAll('#inlineMsgStyleBar [data-msg-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveInlineMsgStyle({ fontSize: Number(btn.dataset.msgSize) || 14 });
      });
    });
    document.querySelectorAll('#inlineMsgStyleBar [data-msg-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveInlineMsgStyle({ fontStyle: btn.dataset.msgStyle || 'Normal' });
      });
    });
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

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
    });

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
        else if (action === 'room_activity') openLeaderboardsModal('activeRooms');
        else if (action === 'member_activity') openLeaderboardsModal('activeMembers');
        else if (action === 'news') openNewsModal();
        else if (action === 'wall') openSocialModal('wall');
        else if (action === 'leaderboards') openLeaderboardsModal('rich');
        else if (action === 'admin_activity') openLeaderboardsModal('adminActivity');
        else if (action === 'report') openSocialModal('report');
        else if (action === 'quiz_points') openLeaderboardsModal('quizLeaders');
        else if (action === 'store') openStoreModal('store');
        else if (action === 'download_app') openDownloadAppModal();
        else if (action === 'owner_suite') openAdminPanel('owner_suite');
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

    // Room switch, Night Atmosphere toggle & YouTube (URL + Live Search by Name)
    $('switchRoomsBtn')?.addEventListener('click', openRoomsModal);
    $('roomSettingsBtn')?.addEventListener('click', () => openAdminPanel('rooms', state.currentRoom?.id || null));
    $('toggleNightAtmosBtn')?.addEventListener('click', () => {
      const globalMode = String(state.settings?.fx_night_atmosphere || 'always_on');
      if (globalMode === 'off') {
        return showToast('أجواء السهرة الليلية معطلة حالياً من المالك.', true);
      }
      const currentlyOn = isNightAtmosphereActive();
      state.userNightPref = currentlyOn ? 'off' : 'on';
      localStorage.setItem('chat_night_atmos_pref', state.userNightPref);
      renderRoomBanner();
      showToast(state.userNightPref === 'on' ? '🌙 تم تفعيل أجواء السهرة الليلية.' : '☀️ تم التبديل إلى الوضع النهاري.');
    });
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
      $('roomYoutubeBar')?.classList.add('hidden');
      renderRoomYoutubeBar();
    });
    $('ytMuteLocalBtn')?.addEventListener('click', () => {
      state.ytLocalMuted = !state.ytLocalMuted;
      renderRoomYoutubeBar();
    });
    $('micMiniYtMuteBtn')?.addEventListener('click', () => {
      state.ytLocalMuted = !state.ytLocalMuted;
      renderRoomYoutubeBar();
    });
    $('micMiniYtExpandBtn')?.addEventListener('click', () => {
      state.ytForceVideo = !state.ytForceVideo;
      state.ytBarOpen = state.ytForceVideo;
      renderRoomYoutubeBar();
    });
    $('ytSwitchMiniBtn')?.addEventListener('click', () => {
      state.ytForceVideo = false;
      state.ytBarOpen = false;
      if (state.currentRoom) state.currentRoom.youtube_mini_mode = 1;
      renderRoomYoutubeBar();
    });
    $('micMiniYtStopBtn')?.addEventListener('click', () => {
      state.socket?.emit('room_youtube_set', { roomId: state.currentRoom?.id, url: '', isPlaying: false });
    });
    $('roomQuizToggleBtn')?.addEventListener('click', () => {
      if (!state.socket || !state.currentRoom) return;
      state.socket.emit('quiz_bot_toggle', {
        roomId: state.currentRoom.id,
        enabled: !state.quizBotState?.active
      }, (res) => {
        if (res?.error) showToast(res.error, true);
      });
    });
    $('ytSearchBtn')?.addEventListener('click', () => {
      performYouTubeSearch($('ytSearchInput')?.value || '');
    });
    $('ytSearchInput')?.addEventListener('input', () => {
      clearTimeout(state.ytSearchTimer);
      const q = ($('ytSearchInput')?.value || '').trim();
      if (!q) {
        $('ytSearchResults')?.classList.add('hidden');
        return;
      }
      if (q.length >= 2) {
        state.ytSearchTimer = setTimeout(() => performYouTubeSearch(q), 380);
      }
    });
    $('ytSearchInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(state.ytSearchTimer);
        performYouTubeSearch($('ytSearchInput').value);
      }
    });
    $('ytPlayRoomBtn')?.addEventListener('click', () => {
      const url = $('ytUrlInput').value.trim();
      const iAmOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
      state.socket.emit('room_youtube_set', { roomId: state.currentRoom?.id, url, isPlaying: true, miniMode: iAmOnMic }, (res) => {
        if (res?.error) showToast(res.error, true);
        else {
          $('ytUrlInput').value = '';
          state.ytForceVideo = false;
          if (iAmOnMic) state.ytBarOpen = false;
        }
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
    $('custSwitchToMoreBtn')?.addEventListener('click', () => {
      switchCustomizeTab('more');
      setTimeout(() => $('custNameStyleSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    $('custOpenStoreFromFramesBtn')?.addEventListener('click', () => {
      closeModal('customizeModal');
      openStoreModal('store');
    });
    $('storeHeroCustShortcutBtn')?.addEventListener('click', () => {
      closeModal('storeModal');
      openCustomizeModal('options');
    });
    $('custMiniMusicPlayBtn')?.addEventListener('click', () => {
      const ref = ($('custMusicCustomUrl')?.value.trim() || $('custMusicPreset')?.value || state.user?.profileMusic || '').trim();
      if (!ref) {
        stopProfileMusic();
        return showToast('اختر نغمة أو أضف رابط MP3 من التخصيص أولاً.', true);
      }
      const playing = playProfileMusic(ref);
      if ($('custMiniMusicPlayBtn')) {
        $('custMiniMusicPlayBtn').innerHTML = playing ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      }
    });
    $('custMiniMusicEditBtn')?.addEventListener('click', () => {
      switchCustomizeTab('more');
      setTimeout(() => $('custMusicPreset')?.focus(), 80);
    });
    $('custCoverPreviewToggleBtn')?.addEventListener('click', () => {
      const hero = $('custCoverHero');
      if (!hero) return;
      const clean = hero.classList.toggle('cover-preview-clean');
      $('custCoverPreviewToggleBtn')?.classList.toggle('active', clean);
    });
    $('nameStyleSubTabs')?.querySelectorAll('.sub-pill-tab').forEach((b) => {
      b.addEventListener('click', () => switchNameStyleTab(b.dataset.namestyleTab));
    });
    [
      'custDisplayName', 'custBioInput', 'custNameColor', 'custTextColor',
      'custFontFamily', 'custFontStyle', 'custFontSize', 'custNameFontSize',
      'custNameStyleMode', 'custNameGradient', 'custNameAnim', 'custNameAnimSpeed', 'custVipWingsToggle'
    ].forEach((id) => {
      $(id)?.addEventListener('input', updateCustomizePreview);
      $(id)?.addEventListener('change', updateCustomizePreview);
    });
    $('custNameStyleMode')?.addEventListener('change', (e) => {
      const mode = e.target.value;
      const targetTab = mode === 'gradient' ? 'gradient' : (mode === 'glow' ? 'neon' : 'color');
      switchNameStyleTab(targetTab);
    });
    $('custResetTextColorBtn')?.addEventListener('click', () => {
      if ($('custTextColor')) $('custTextColor').value = '#e2e8f0';
      updateCustomizePreview();
      showToast('تمت استعادة لون النص الافتراضي المتباين.');
    });
    $('custMuteSoundsToggle')?.addEventListener('change', (e) => {
      state.soundMuted = Boolean(e.target.checked);
      localStorage.setItem(SOUND_MUTE_KEY, state.soundMuted ? '1' : '0');
      showToast(state.soundMuted ? 'تم كتم أصوات التنبيهات.' : 'تم تفعيل أصوات التنبيهات.');
    });
    $('custEnableWebPushBtn')?.addEventListener('click', async () => {
      const ok = await requestWebPushPermission();
      if (ok && $('custEnableWebPushBtn')) {
        $('custEnableWebPushBtn').textContent = 'الإشعارات مفعّلة ✓';
      }
    });
    $('custNameAnimOffBtn')?.addEventListener('click', () => {
      if ($('custNameAnim')) $('custNameAnim').value = 'none';
      updateCustomizePreview();
      showToast('تم اختيار وضع الاسم الثابت (اضغط حفظ لتثبيت التعديل).');
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
    $('custDeleteAvatarBtn')?.addEventListener('click', async () => {
      if (!confirm('حذف صورتك الشخصية الحالية؟')) return;
      try {
        const res = await api('/api/profile/avatar', { method: 'DELETE' });
        if (res?.user) state.user = res.user;
        else state.user.avatarUrl = '';
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم حذف الصورة الشخصية.');
      } catch (err) {
        showToast(err.message, true);
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
    $('custDeleteCoverBtn')?.addEventListener('click', async () => {
      if (!confirm('حذف صورة الغلاف الحالية؟')) return;
      try {
        const res = await api('/api/profile/cover', { method: 'DELETE' });
        if (res?.user) state.user = res.user;
        else state.user.coverUrl = '';
        updateCustomizePreview();
        showToast('تم حذف صورة الغلاف.');
      } catch (err) {
        showToast(err.message, true);
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
      $('custMusicPreviewBtn').innerHTML = playing ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      if ($('custMiniMusicPlayBtn')) {
        $('custMiniMusicPlayBtn').innerHTML = playing ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      }
    });
    $('saveNameStyleQuickBtn')?.addEventListener('click', () => saveCustomizeProfile(false));
    $('saveCustomizeBtn').addEventListener('click', () => saveCustomizeProfile(true));

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

    // Leaderboards, Store & Admin Tabs
    document.querySelectorAll('.lb-tab:not(.store-tab)').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab:not(.store-tab)').forEach((x) => x.classList.toggle('active', x === b));
        renderLeaderboardBody(b.dataset.lbTab);
      });
    });
    document.querySelectorAll('.store-tab').forEach((b) => {
      b.addEventListener('click', () => {
        renderStoreTab(b.dataset.storeTab);
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
      if (!e.target.closest('.msg-actions-wrap') && !e.target.closest('.wall-post-menu-wrap')) {
        document.querySelectorAll('.msg-dots-menu').forEach((m) => m.classList.add('hidden'));
      }
    });
  }

  function renderInlineMsgStyleBar() {
    const bar = $('inlineMsgStyleBar');
    if (!bar) return;
    const u = state.user || {};
    const isGuest = !u || u.isGuest;
    const isOwner = u.role === 'site_owner';
    const canMsgStyle = !isGuest && (isOwner || passesSettingRankThreshold('min_rank_msg_style', 'member'));

    const lockNote = $('inlineMsgLockNote');
    if (lockNote) {
      if (isGuest) {
        lockNote.textContent = 'تلوين وتنسيق خط الرسائل متاح للأعضاء المسجلين فقط.';
        lockNote.classList.remove('hidden');
      } else if (!canMsgStyle) {
        lockNote.textContent = 'تخصيص لون وحجم خط الرسائل مقيّد حالياً لرتبة أعلى من رتبتك.';
        lockNote.classList.remove('hidden');
      } else {
        lockNote.classList.add('hidden');
      }
    }

    const activeColor = (u.textColor || '#e2e8f0').toLowerCase();
    if ($('inlineMsgColorPicker')) {
      $('inlineMsgColorPicker').value = /^#[0-9a-f]{6}$/i.test(activeColor) ? activeColor : '#e2e8f0';
      $('inlineMsgColorPicker').disabled = !canMsgStyle;
    }

    const swatchesEl = $('inlineMsgColorSwatches');
    if (swatchesEl) {
      swatchesEl.innerHTML = NAME_COLOR_SWATCHES.slice(0, 12).map((hex) => {
        const isAct = activeColor === hex.toLowerCase();
        return `<button type="button" class="inline-swatch-btn${isAct ? ' active' : ''}" data-msg-color="${hex}" style="background:${hex};" title="${hex}" ${!canMsgStyle ? 'disabled' : ''}>${isAct ? '✓' : ''}</button>`;
      }).join('');
      swatchesEl.querySelectorAll('.inline-swatch-btn').forEach((b) => {
        b.addEventListener('click', () => saveInlineMsgStyle({ textColor: b.dataset.msgColor }));
      });
    }

    const curSize = Math.max(12, Math.min(20, Number(u.fontSize) || 14));
    bar.querySelectorAll('[data-msg-size]').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.msgSize) === curSize);
      b.disabled = !canMsgStyle;
    });
    const curStyle = u.fontStyle || 'Normal';
    bar.querySelectorAll('[data-msg-style]').forEach((b) => {
      b.classList.toggle('active', b.dataset.msgStyle === curStyle);
      b.disabled = !canMsgStyle;
    });
  }

  async function saveInlineMsgStyle(patch) {
    if (!state.user || state.user.isGuest) {
      return showToast('تنسيق خط الرسائل متاح للأعضاء المسجلين فقط.', true);
    }
    try {
      const res = await api('/api/profile/customize', { method: 'POST', body: patch });
      if (res?.user) state.user = res.user;
      renderInlineMsgStyleBar();
      renderUserIdentity();
      showToast('تم تطبيق تنسيق خط رسائلك فوراً!');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function bootstrap() {
    const refParam = new URLSearchParams(window.location.search).get('ref');
    if (refParam) localStorage.setItem(REF_KEY, String(refParam).trim());
    try {
      const savedGuest = JSON.parse(localStorage.getItem(GUEST_PROFILE_KEY) || 'null');
      if (savedGuest?.name && $('guestName') && !$('guestName').value) {
        $('guestName').value = savedGuest.name;
      }
    } catch {
      // ignore
    }
    bindEvents();
    refreshLucideIcons();
    try {
      const pub = await api('/api/settings/public');
      if (pub?.settings) applySiteSettings(pub.settings);
    } catch {
      // ignore
    }

    const restoreSessionWithRetry = async () => {
      if (!state.token) return false;
      try {
        const me = await api('/api/me');
        if (me?.user) {
          enterApp(me.user, state.token);
          return true;
        }
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_CACHE_KEY);
          state.token = '';
          setReconnectBannerVisible(false);
          if (err?.status === 403 && err?.message) showToast(err.message, true);
          return false;
        }
        // Network or 5xx error: preserve token (Zero-Logout) & keep retry banner visible
        try {
          const cachedUser = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null');
          if (cachedUser && cachedUser.key) {
            enterApp(cachedUser, state.token);
            setReconnectBannerVisible(true);
          }
        } catch {
          // ignore
        }
        setTimeout(() => {
          if (state.token && !state.socket?.connected) restoreSessionWithRetry();
        }, 4500);
      }
      return false;
    };

    if (state.token) {
      await restoreSessionWithRetry();
    }
    setInterval(() => {
      if (state.currentRoom && state.settings?.fx_night_atmosphere === 'auto' && state.userNightPref === 'follow') {
        renderRoomBanner();
      }
    }, 60000);
  }

  bootstrap();
})();
