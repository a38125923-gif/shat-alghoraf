(() => {
  const TOKEN_KEY = 'arabic_chat_token_v3';
  const ROOM_KEY = 'arabic_chat_room_v3';
  const DEVICE_ID_KEY = 'arabic_chat_device_id_v1';
  const REF_KEY = 'arabic_chat_ref_v1';
  const GUEST_PROFILE_KEY = 'arabic_chat_guest_profile_v1';
  const SOUND_MUTE_KEY = 'arabic_chat_sound_muted';
  const FINGERPRINT_KEY = 'arabic_chat_fp_v1';
  const USER_CACHE_KEY = 'arabic_chat_user_cache_v1';
  const MIRROR_CACHE_KEY = 'arabic_chat_mirror_v1';

  const NAME_ANIM_OPTIONS = [
    { id: 'none', label: 'ثابت (بدون حركة)' },
    { id: 'pulse', label: 'نبض ملكي' },
    { id: 'color_wave', label: 'تموج ألوان الطيف' },
    { id: 'gradient_glow', label: 'تدرج ذهبي' },
    { id: 'gentle_shake', label: 'اهتزاز خفيف' },
    { id: 'float_bounce', label: 'طفو ناعم' },
    { id: 'neon_flicker', label: 'وميض النيون' }
  ];

  const DEFAULT_AVATAR_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><circle cx="50" cy="38" r="17" fill="#93c5fd"/><path d="M22 86c4-17 17-25 28-25s24 8 28 25" fill="#93c5fd"/></svg>'
  );
  const DEFAULT_LOGO_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f2342"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#lg)"/><path d="M60 22l12 24 26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4z" fill="#fbbf24"/></svg>'
  );
  const DEFAULT_ROOM_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f2342"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#rg)"/><path d="M24 34h52v32a6 6 0 0 1-6 6H42l-14 10V66h-4a6 6 0 0 1-6-6V40a6 6 0 0 1 6-6z" fill="#f8fafc" opacity="0.92"/><circle cx="39" cy="50" r="4" fill="#1d4ed8"/><circle cx="50" cy="50" r="4" fill="#1d4ed8"/><circle cx="61" cy="50" r="4" fill="#1d4ed8"/></svg>'
  );

  const MSG_REACTION_META = [
    { key: 'heart', emoji: '❤️', label: 'أحببته' },
    { key: 'ok', emoji: '👍', label: 'أعجبني' },
    { key: 'broken', emoji: '💔', label: 'حزين' },
    { key: 'laugh', emoji: '😂', label: 'أضحكني' },
    { key: 'fire', emoji: '🔥', label: 'ناري' }
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

  const SESSION_COOKIE_NAME = 'ac_session_token';
  const IDB_NAME = 'arabic_chat_persistence_v1';
  const IDB_STORE = 'session';
  const IDB_KEY = 'active_session';

  function readSessionCookie() {
    try {
      const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      return m ? decodeURIComponent(m[1]) : '';
    } catch {
      return '';
    }
  }

  function writeSessionCookie(token) {
    try {
      if (!token) return;
      document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }

  function clearSessionCookie() {
    try {
      document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      // ignore
    }
  }

  function openSessionIdb() {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve(null);
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function readSessionFromIdb() {
    const db = await openSessionIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function writeSessionToIdb(payload) {
    const db = await openSessionIdb();
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(payload, IDB_KEY);
    } catch {
      // ignore
    }
  }

  async function clearSessionFromIdb() {
    const db = await openSessionIdb();
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
    } catch {
      // ignore
    }
  }

  function persistSessionState(user, token) {
    const tok = String(token || state?.token || '').trim();
    if (tok) {
      try {
        localStorage.setItem(TOKEN_KEY, tok);
      } catch {
        // ignore
      }
      writeSessionCookie(tok);
    }
    if (user && typeof user === 'object') {
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
      if (user.isGuest && user.key) {
        try {
          localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify({ key: user.key, name: user.name || '' }));
        } catch {
          // ignore
        }
      }
    }
    if (tok) {
      writeSessionToIdb({ token: tok, user: user || null, savedAt: Date.now() });
    }
  }

  function clearPersistedSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // ignore
    }
    clearSessionCookie();
    clearSessionFromIdb();
  }

  let _mirrorSaveTimer = null;
  function syncLocalMirror(immediate = false) {
    const commit = () => {
      try {
        const snapshot = {
          v: 1,
          savedAt: Date.now(),
          roomId: state?.currentRoom?.id || localStorage.getItem(ROOM_KEY) || 'general',
          settings: state?.settings || {},
          ranks: Array.isArray(state?.ranks) ? state.ranks : [],
          rooms: Array.isArray(state?.rooms) ? state.rooms : [],
          emojis: Array.isArray(state?.emojis) ? state.emojis.slice(0, 120) : [],
          persistentMembers: Array.isArray(state?.persistentMembers) ? state.persistentMembers.slice(0, 80) : [],
          messages: Array.isArray(state?.messages) ? state.messages.slice(-60) : []
        };
        localStorage.setItem(MIRROR_CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // ignore storage quota errors gracefully
      }
    };
    if (immediate) {
      if (_mirrorSaveTimer) {
        clearTimeout(_mirrorSaveTimer);
        _mirrorSaveTimer = null;
      }
      commit();
      return;
    }
    if (_mirrorSaveTimer) clearTimeout(_mirrorSaveTimer);
    _mirrorSaveTimer = setTimeout(() => {
      _mirrorSaveTimer = null;
      commit();
    }, 250);
  }

  function hydrateLocalMirrorOnBoot() {
    try {
      const raw = JSON.parse(localStorage.getItem(MIRROR_CACHE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return false;
      if (Array.isArray(raw.ranks) && raw.ranks.length && !state.ranks.length) {
        state.ranks = raw.ranks;
      }
      if (Array.isArray(raw.rooms) && raw.rooms.length && !state.rooms.length) {
        state.rooms = raw.rooms;
      }
      if (Array.isArray(raw.emojis) && raw.emojis.length && !state.emojis.length) {
        state.emojis = raw.emojis;
      }
      if (Array.isArray(raw.persistentMembers) && raw.persistentMembers.length && !state.persistentMembers.length) {
        state.persistentMembers = raw.persistentMembers;
      }
      if (raw.settings && typeof raw.settings === 'object' && Object.keys(raw.settings).length) {
        applySiteSettings(raw.settings, true);
      }
      return true;
    } catch {
      return false;
    }
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

  function isReadableOnLightBg(hex) {
    const rgb = parseHexRgb(hex);
    if (!rgb) return true;
    const toLin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = 0.2126 * toLin(rgb[0]) + 0.7152 * toLin(rgb[1]) + 0.0722 * toLin(rgb[2]);
    return lum <= 0.58;
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
    {
      id: 'crown_king',
      glyph: '👑',
      label: 'تاج ملكي',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><defs><linearGradient id="stkCr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><path fill="url(#stkCr)" stroke="#78350f" stroke-width="1.4" d="M5 27h26l-2.5-14-6.5 6L18 8l-4 11-6.5-6L5 27zm2 3h22v2.4H7z"/><circle cx="18" cy="6.8" r="2.2" fill="#e11d48"/><circle cx="6.8" cy="11.5" r="1.8" fill="#0ea5e9"/><circle cx="29.2" cy="11.5" r="1.8" fill="#0ea5e9"/></svg>'
    },
    {
      id: 'heart_fire',
      glyph: '❤️‍🔥',
      label: 'قلب متوهج',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><defs><linearGradient id="stkHr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="60%" stop-color="#e11d48"/><stop offset="100%" stop-color="#9f1239"/></linearGradient></defs><path fill="url(#stkHr)" stroke="#881337" stroke-width="1.2" d="M18 31.5S5.5 23.8 4 14.4C2.9 8.2 7.5 4.2 12.6 4.6c2.6.2 4.4 1.8 5.4 3.6 1-1.8 2.8-3.4 5.4-3.6 5.1-.4 9.7 3.6 8.6 9.8-1.5 9.4-14 17.1-14 17.1z"/><path fill="#fde047" opacity="0.88" d="M18 11c1.8 2.6 2.8 4.4 2.4 6.6 1.4-.6 2.4-2 2.4-3.8 2 1.8 2.5 4.8.8 7-1.4 2-4.2 2.8-6.4 2-2.6-.9-3.9-4-2.5-6.6 1-1.8 2.2-3 3.3-5.2z"/></svg>'
    },
    {
      id: 'diamond_vip',
      glyph: '💎',
      label: 'ألماس VIP',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><defs><linearGradient id="stkDm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="45%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><path fill="url(#stkDm)" stroke="#1e3a8a" stroke-width="1.3" d="M9.5 6h17l6 8.5L18 31.5 3.5 14.5 9.5 6z"/><path fill="rgba(255,255,255,0.55)" d="M9.5 6 13 14.5 18 6zm8.5 0-5 8.5h10z"/></svg>'
    },
    {
      id: 'trophy_win',
      glyph: '🏆',
      label: 'كأس الفوز',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><defs><linearGradient id="stkTr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><path fill="url(#stkTr)" stroke="#78350f" stroke-width="1.3" d="M10 6h16v9c0 4.4-3.6 8-8 8s-8-3.6-8-8V6zm-5 2h5v5c-2.8 0-5-2.2-5-5zm26 0h-5v5c2.8 0 5-2.2 5-5zm-15 15h4v4.5h5.5V31h-15v-3.5H16V23z"/></svg>'
    },
    {
      id: 'rose_gift',
      glyph: '🌹',
      label: 'وردة فاخرة',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#16a34a" d="M17 18h2v13h-2z"/><path fill="#22c55e" d="M18 24c3-2 6.5-1.5 7.5 1-3 .8-6 0-7.5-1zm0 3c-3-2-6.5-1.5-7.5 1 3 .8 6 0 7.5-1z"/><circle cx="18" cy="13" r="6.8" fill="#e11d48" stroke="#9f1239" stroke-width="1.2"/><path fill="#fb7185" d="M14 11c1.8-2 6-2 7.8 0-1.4 1.6-6.2 1.6-7.8 0z"/></svg>'
    },
    {
      id: 'rocket_boom',
      glyph: '🚀',
      label: 'انطلاق',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#ef4444" d="M18 4c4.5 4.2 6.5 9.8 6.2 16l-6.2 3-6.2-3C11.5 13.8 13.5 8.2 18 4z"/><path fill="#f8fafc" stroke="#1e293b" stroke-width="1.2" d="M18 5c3.5 4 5 8.8 4.8 14H13.2C13 13.8 14.5 9 18 5z"/><circle cx="18" cy="13" r="2.6" fill="#38bdf8"/><path fill="#f59e0b" d="M14.5 22h7l-3.5 9z"/></svg>'
    },
    {
      id: 'fire_hot',
      glyph: '🔥',
      label: 'حماس',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#ef4444" d="M19 4c2.8 5.2-.5 8.2 2.4 11.8 1.2-1.8 2.2-3.4 2.4-5.4 4.2 3 6.2 7.4 6.2 11.8a12 12 0 1 1-24 0c0-5.6 4-11.2 13-18.2z"/><path fill="#fde047" d="M18.2 16c2.6 2.8 3.8 5 3.8 7.8a4.2 4.2 0 1 1-8.4 0c0-2.6 1.4-5 4.6-7.8z"/></svg>'
    },
    {
      id: 'sparkle_star',
      glyph: '✨',
      label: 'نجمة لامعة',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#facc15" stroke="#b45309" stroke-width="1.2" d="M18 3.5l4.2 8.8 9.7 1.4-7 6.8 1.7 9.6-8.6-4.6-8.6 4.6 1.7-9.6-7-6.8 9.7-1.4z"/></svg>'
    },
    {
      id: 'party_pop',
      glyph: '🥳',
      label: 'احتفال',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#f59e0b" stroke="#92400e" stroke-width="1.2" d="M7 29l7-18 11 11z"/><circle cx="24" cy="9" r="2.2" fill="#ec4899"/><circle cx="29" cy="14" r="2" fill="#38bdf8"/><circle cx="18" cy="6" r="2" fill="#22c55e"/><circle cx="28" cy="23" r="2" fill="#a855f7"/></svg>'
    },
    {
      id: 'clap_bravo',
      glyph: '👏',
      label: 'تصفيق حار',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><circle cx="18" cy="18" r="13.5" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/><path fill="#d97706" d="M12.5 22.5l5-9 3.5 2-4.5 9.2c-1.4 1.2-3.4.4-4-.2zm5.5 2l5.2-9.5 3.2 1.8-4.8 9.4c-1.2 1-3 .5-3.6-.7z"/></svg>'
    },
    {
      id: 'kiss_love',
      glyph: '😘',
      label: 'محبة وتقدير',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><circle cx="18" cy="18" r="13" fill="#fde047" stroke="#ca8a04" stroke-width="1.2"/><circle cx="13.5" cy="14.5" r="1.8" fill="#1e293b"/><path fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" d="M20 14.5c1.2-1 2.8-1 4 0"/><path fill="#e11d48" d="M26 20c1.4-1.8 4.4-1 4.4 1.3 0 2.2-4.4 4.7-4.4 4.7s-4.4-2.5-4.4-4.7c0-2.3 3-3.1 4.4-1.3z"/></svg>'
    },
    {
      id: 'butterfly',
      glyph: '🦋',
      label: 'فراشة ملونة',
      svg: '<svg viewBox="0 0 36 36" class="stk-svg-art"><path fill="#38bdf8" stroke="#0284c7" stroke-width="1.1" d="M17 17C12 9 5 8 5 14c0 4 4 7 12 6zm2 0c5-8 12-9 12-3 0 4-4 7-12 6z"/><path fill="#a855f7" stroke="#6b21a8" stroke-width="1.1" d="M17 20c-6 1-10 5-7 9 2.5 3 6 .5 7-9zm2 0c6 1 10 5 7 9-2.5 3-6 .5-7-9z"/><rect x="17" y="10" width="2" height="17" rx="1" fill="#0f172a"/></svg>'
    }
  ];

  const NAME_COLOR_SWATCHES = [
    '#0f172a', '#1e293b', '#f8fafc', '#e2e8f0', '#fbbf24', '#f59e0b', '#fb7185',
    '#f43f5e', '#ef4444', '#fb923c', '#facc15', '#16a34a', '#2dd4bf',
    '#0284c7', '#38bdf8', '#60a5fa', '#7c3aed', '#c084fc'
  ];

  const RANK_ICON_PRESETS = [
    '👑', '💎', '⭐', '🏆', '🛡️', '🦅', '⚜️', '🌟',
    '✨', '🎖️', '💠', '💫', '🔱', '🏅', '🪄', '💍'
  ];

  const RANK_BADGE_STYLES = [
    { id: 'gold_crown', label: 'تاج ذهبي ملكي', iconClass: 'fa-solid fa-crown' },
    { id: 'crown_royal', label: 'تاج السيادة المرصع', iconClass: 'fa-solid fa-crown' },
    { id: 'ruby_crown', label: 'تاج الياقوت الأحمر', iconClass: 'fa-solid fa-crown' },
    { id: 'silver_crown', label: 'تاج فضي ملكي', iconClass: 'fa-solid fa-crown' },
    { id: 'royal_trophy', label: 'كأس البطولة الذهبي', iconClass: 'fa-solid fa-trophy' },
    { id: 'diamond_trophy', label: 'كأس الماس السماوي', iconClass: 'fa-solid fa-trophy' },
    { id: 'emerald_trophy', label: 'كأس الزمرد الفاخر', iconClass: 'fa-solid fa-trophy' },
    { id: 'gold_star', label: 'نجمة ذهبية متلألئة', iconClass: 'fa-solid fa-star' },
    { id: 'sapphire_star', label: 'نجمة الياقوت الأزرق', iconClass: 'fa-solid fa-star' },
    { id: 'royal_shield', label: 'درع ملكي', iconClass: 'fa-solid fa-shield-halved' },
    { id: 'silver_shield', label: 'درع فضي محصّن', iconClass: 'fa-solid fa-shield' },
    { id: 'diamond_gem', label: 'ماسة زرقاء براقة', iconClass: 'fa-solid fa-gem' },
    { id: 'vip_wings', label: 'أجنحة VIP ملكية', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'silver_wing', label: 'جناح فضي', iconClass: 'fa-solid fa-dove' },
    { id: 'gold_eagle', label: 'نسر ذهبي', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'neon_badge', label: 'شارة نيون متوهجة', iconClass: 'fa-solid fa-certificate' },
    { id: 'diamond_medal', label: 'وسام ماسي', iconClass: 'fa-solid fa-gem' }
  ];

  const BUILT_IN_RANK_SVGS = {
    gold_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/><circle cx="12" cy="4.2" r="1.5" fill="#e11d48"/><circle cx="4.4" cy="7.5" r="1.2" fill="#0ea5e9"/><circle cx="19.6" cy="7.5" r="1.2" fill="#0ea5e9"/></svg>',
    crown_royal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#eab308" stroke="#713f12" stroke-width="1" d="M2.5 18.5h19L20 8l-4.8 4.2L12 4.5 8.8 12.2 4 8l-1.5 10.5zM4 20.5h16v1.8H4z"/><circle cx="12" cy="14" r="1.6" fill="#dc2626"/><circle cx="8" cy="14.5" r="1.1" fill="#38bdf8"/><circle cx="16" cy="14.5" r="1.1" fill="#38bdf8"/></svg>',
    ruby_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#f43f5e" stroke="#881337" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.5" fill="#fde047"/><circle cx="12" cy="14" r="1.6" fill="#fef08a"/></svg>',
    silver_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#cbd5e1" stroke="#334155" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.4" fill="#38bdf8"/></svg>',
    royal_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#92400e" stroke-width="1" d="M7 4h10v6a5 5 0 0 1-10 0V4zm-3 1.5h3v3.5A3 3 0 0 1 4 6V5.5zm16 0h-3v3.5A3 3 0 0 0 20 6V5.5zM10.5 15h3v3h3.5v2H7v-2h3.5v-3z"/><circle cx="12" cy="8.2" r="1.5" fill="#dc2626"/></svg>',
    diamond_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#1e3a8a" stroke-width="1" d="M7 4h10v6a5 5 0 0 1-10 0V4zm-3 1.5h3v3.5A3 3 0 0 1 4 6V5.5zm16 0h-3v3.5A3 3 0 0 0 20 6V5.5zM10.5 15h3v3h3.5v2H7v-2h3.5v-3z"/><circle cx="12" cy="8.2" r="1.5" fill="#fef08a"/></svg>',
    emerald_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#10b981" stroke="#064e3b" stroke-width="1" d="M7 4h10v6a5 5 0 0 1-10 0V4zm-3 1.5h3v3.5A3 3 0 0 1 4 6V5.5zm16 0h-3v3.5A3 3 0 0 0 20 6V5.5zM10.5 15h3v3h3.5v2H7v-2h3.5v-3z"/><circle cx="12" cy="8.2" r="1.5" fill="#fde047"/></svg>',
    gold_star: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#facc15" stroke="#92400e" stroke-width="1.1" d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    sapphire_star: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#1e40af" stroke-width="1.1" d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    royal_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#1e293b" stroke="#fbbf24" stroke-width="1.8" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="#fbbf24" d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/></svg>',
    silver_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#94a3b8" stroke="#1e293b" stroke-width="1.3" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="#0ea5e9" d="M12 6.5l3 5.5-3 5.5-3-5.5z"/></svg>',
    diamond_gem: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#1e40af" stroke-width="1" d="M6.5 3.5h11l4 5.5L12 21 2.5 9l4-5.5z"/><path fill="rgba(255,255,255,0.45)" d="M6.5 3.5 9 9l3-5.5zm5.5 0L9 9h6z"/></svg>',
    diamond_medal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#a855f7" stroke="#312e81" stroke-width="1" d="M7 3h10l4 5.5L12 21 3 8.5 7 3z"/><path fill="rgba(255,255,255,0.35)" d="M7 3l3 5.5 2-5.5z"/></svg>',
    vip_wings: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#7c2d12" stroke-width="0.8" d="M2 7c4 0 6.5 2.5 8 5.5-2.5.8-5.5.2-7-2.2 1.2 2.5 3.8 4 6.5 4.2-2.2 1-4.5.7-6-.8.8 1.8 3.2 2.8 5.5 2.5L12 19l3-2.8c2.3.3 4.7-.7 5.5-2.5-1.5 1.5-3.8 1.8-6 .8 2.7-.2 5.3-1.7 6.5-4.2-1.5 2.4-4.5 3-7 2.2 1.5-3 4-5.5 8-5.5-4.5-.8-8 1-10 4.2C10 8 6.5 6.2 2 7z"/><circle cx="12" cy="11" r="2.2" fill="#facc15" stroke="#7c2d12" stroke-width="0.7"/></svg>',
    silver_wing: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#e2e8f0" stroke="#475569" stroke-width="0.9" d="M3 8c4.5 0 7.5 2.8 9 6-2.5.8-5.5.1-7-2 1.4 2.5 4 3.8 6.5 4-2.2 1-4.6.6-6-.8.9 1.8 3.4 2.7 5.8 2.3L12 19l8.5-7c-3.5-.3-6.5 1-8.5 3.3C10.5 10.5 7 7.7 3 8z"/></svg>',
    gold_eagle: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="0.9" d="M12 4l2.2 3.2 7.3-1.7-3.5 5 2 3-5.2-1.2L12 20.5 9.2 12.3 4 13.5l2-3-3.5-5 7.3 1.7z"/></svg>',
    neon_badge: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#ec4899" stroke="#ffffff" stroke-width="0.9" d="M12 2l2.3 2.7 3.5-.5.8 3.4 3.2 1.5-1.3 3.3 1.3 3.3-3.2 1.5-.8 3.4-3.5-.5L12 22l-2.3-2.7-3.5.5-.8-3.4-3.2-1.5 1.3-3.3-1.3-3.3 3.2-1.5.8-3.4 3.5.5z"/><path fill="#ffffff" d="M12 7.5l1.3 2.9 3.1.4-2.2 2.2.5 3.1-2.7-1.5-2.7 1.5.5-3.1-2.2-2.2 3.1-.4z"/></svg>'
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
    token: localStorage.getItem(TOKEN_KEY) || readSessionCookie() || '',
    user: null,
    settings: {},
    ranks: [],
    emojis: [],
    rooms: [],
    currentRoom: null,
    isRoomManager: false,
    canStyleRoom: false,
    messages: [],
    mics: [],
    roomUsers: [],
    onlineUsers: [],
    persistentMembers: [],
    news: [],
    giftsCatalog: [],
    shopItems: { frames: [], nameplates: [], shines: [], profileBackgrounds: [], rankBadgeStyles: [], musicPresets: [], radioStations: DEFAULT_RADIO_STATIONS },
    social: { friends: [], privateMessages: [], wallPosts: [], notifications: [], unreadNotifCount: 0, myGifts: { received: [], sent: [] } },
    firebaseWebConfig: null,
    adminScriptLoadedToken: '',
    realtimeActive: false,
    adminNoticeMode: false,
    mentionedUserId: null,
    mentionedUserName: '',
    ytLocalMuted: false,
    ytBarOpen: false,
    ytSearchTimer: null,
    ytForceVideo: false,
    ytMicPaused: false,
    ytLocalClosedVideoId: '',
    lastMicWaveTickTs: 0,
    lastRoyalEntranceShownAt: 0,
    quizBotState: { active: false, hintSent: false, enabledSetting: true },
    activeCustomizeTab: 'info',
    nameStyleMode: 'solid',
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
    cinematicTimer: null,
    activeMute: null,
    muteTimer: null,
    ownerModAlertTimer: null,
    guestRegisterReturnToChat: false,
    replyTo: null
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
        icon: DEFAULT_ROOM_SVG,
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

  function syncMusicButtonIcons(playingRef = '') {
    const isPlaying = Boolean(playingRef);
    const html = isPlaying ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
    const previewBtn = $('custMusicPreviewBtn');
    if (previewBtn) previewBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-stop"></i> إيقاف' : '<i class="fa-solid fa-play"></i> تشغيل';
    const custMiniBtn = $('custMiniMusicPlayBtn');
    if (custMiniBtn) custMiniBtn.innerHTML = html;
    const quBtn = $('quMusicToggleBtn');
    if (quBtn) quBtn.innerHTML = html;
  }

  function stopProfileMusic() {
    if (state.profileAudioEl) {
      try {
        state.profileAudioEl.pause();
        state.profileAudioEl.removeAttribute('src');
        state.profileAudioEl.load();
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
    syncMusicButtonIcons('');
  }

  function playProfileMusic(musicRef, opts = {}) {
    const ref = String(musicRef || '').trim();
    const silentAutoplayError = Boolean(opts?.silentAutoplayError);
    if (!ref) {
      stopProfileMusic();
      return false;
    }
    if (state.activeMusicRef === ref && !opts?.forceRestart) {
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
        if (!silentAutoplayError) showToast('المتصفح لا يدعم تشغيل النغمات.', true);
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
      syncMusicButtonIcons(ref);
      return true;
    }

    try {
      const audio = new Audio(ref);
      audio.loop = true;
      audio.volume = 0.45;
      audio.onended = () => stopProfileMusic();
      state.profileAudioEl = audio;
      syncMusicButtonIcons(ref);
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          stopProfileMusic();
          if (!silentAutoplayError) {
            showToast('تعذر تشغيل مقطع الصوت مباشرة، اضغط تشغيل مجدداً.', true);
          }
        });
      }
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
      err.banned = Boolean(data.banned);
      err.bannedBy = data.bannedBy || '';
      err.banReason = data.reason || '';
      if (err.banned) {
        showBanBlockedScreen();
      }
      throw err;
    }
    return data;
  }

  function showBanBlockedScreen() {
    stopProfileMusic();
    stopRadioStream();
    stopLocalMicStream();
    closeAllMicPeers();
    const overlay = $('bannedOverlay');
    const txtEl = $('bannedOverlayReasonText');
    if (txtEl) {
      txtEl.textContent = 'تم حظرك من الشات';
    }
    overlay?.classList.remove('hidden');
  }

  function hideBanBlockedScreen() {
    $('bannedOverlay')?.classList.add('hidden');
  }

  function formatRemainingMmSs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function updateMutedStateUI(muteObj) {
    if (state.muteTimer) {
      clearInterval(state.muteTimer);
      state.muteTimer = null;
    }
    const expiresAtMs = Number(muteObj?.expiresAtMs || 0);
    if (!muteObj || !muteObj.muted || expiresAtMs <= Date.now()) {
      state.activeMute = null;
      $('mutedAlertBanner')?.classList.add('hidden');
      if ($('mutedAlertBanner')) $('mutedAlertBanner').innerHTML = '';
      syncChatComposerLockState();
      return;
    }
    state.activeMute = { ...muteObj, muted: true, expiresAtMs };
    const renderMuteBanner = () => {
      const rem = (state.activeMute?.expiresAtMs || 0) - Date.now();
      if (rem <= 0) {
        updateMutedStateUI(null);
        showToast('انتهت مدة الكتم ويمكنك الكتابة الآن.');
        return;
      }
      const banner = $('mutedAlertBanner');
      if (banner) {
        banner.classList.remove('hidden');
        banner.innerHTML = `
          <div class="muted-alert-main">
            <i class="fa-solid fa-volume-xmark"></i>
            <span>تم كتمك مؤقتاً — لا يمكنك الإرسال حتى انتهاء المدة</span>
          </div>
          <span class="muted-countdown-pill"><i class="fa-regular fa-clock"></i> ${formatRemainingMmSs(rem)}</span>
        `;
      }
      syncChatComposerLockState();
    };
    renderMuteBanner();
    state.muteTimer = setInterval(renderMuteBanner, 1000);
  }

  function syncChatComposerLockState() {
    const isMuted = Boolean(state.activeMute && state.activeMute.expiresAtMs > Date.now());
    const isFrozen = Boolean(state.user?.isFrozen && state.user?.role !== 'site_owner');
    const isGlobalMuted = Number(state.settings?.global_chat_mute) === 1 && state.user?.role !== 'site_owner';
    const guestBlocked = Boolean(state.user?.isGuest && Number(state.settings?.guest_can_chat ?? 1) === 0);
    const locked = isMuted || isFrozen || isGlobalMuted;
    const input = $('messageInput');
    const sendBtn = $('sendMsgBtn');
    if (input) {
      input.disabled = locked;
      if (isMuted) input.placeholder = 'أنت مكتوم مؤقتاً — لا يمكنك الإرسال حتى انتهاء العداد...';
      else if (isGlobalMuted) input.placeholder = 'الدردشة العامة مكتومة مؤقتاً من قبل المالك...';
      else if (isFrozen) input.placeholder = 'حسابك مجمد حالياً (للقراءة فقط)...';
      else if (guestBlocked) input.placeholder = 'الكتابة للزوار مقيدة حالياً من المالك...';
      else input.placeholder = 'اكتب هنا...';
    }
    if (sendBtn) sendBtn.disabled = locked;
    const pmInput = $('pmComposeInput');
    const pmBtn = $('pmComposeSendBtn');
    if (pmInput) {
      pmInput.disabled = isMuted || isFrozen;
      pmInput.placeholder = isMuted ? 'أنت مكتوم مؤقتاً — لا يمكنك الإرسال...' : 'اكتب رسالتك الخاصة...';
    }
    if (pmBtn) pmBtn.disabled = isMuted || isFrozen;
  }

  function showOwnerModAlert(payload) {
    if (!payload) return;
    playNotificationChime('mention');
    const banner = $('ownerModAlertBanner');
    const wordHtml = payload.violatingWord
      ? ` <span class="owner-alert-word-pill">الكلمة المخالفة: ${escapeHtml(payload.violatingWord)}</span>`
      : '';
    if (banner) {
      banner.classList.remove('hidden');
      banner.innerHTML = `
        <div class="owner-mod-alert-content">
          <i class="fa-solid fa-shield-halved"></i>
          <div>
            <strong>${escapeHtml(payload.title || 'تنبيه رقابي للمالك')}</strong>
            <div class="owner-mod-alert-body">${escapeHtml(payload.body || '')}${wordHtml}</div>
          </div>
        </div>
        <button type="button" id="closeOwnerModAlertBtn" class="yt-mini-btn" title="إغلاق"><i class="fa-solid fa-xmark"></i></button>
      `;
      $('closeOwnerModAlertBtn')?.addEventListener('click', () => banner.classList.add('hidden'));
      if (state.ownerModAlertTimer) clearTimeout(state.ownerModAlertTimer);
      state.ownerModAlertTimer = setTimeout(() => banner.classList.add('hidden'), 15000);
    }
    showToast(`🚨 ${payload.title || 'تنبيه'}: ${payload.body || ''}${payload.violatingWord ? ` [${payload.violatingWord}]` : ''}`, true);
    dispatchWebPush(payload.title || 'تنبيه رقابي للمالك', payload.body || '');
  }

  function openAuthRegisterForGuest() {
    state.guestRegisterReturnToChat = Boolean(state.token && state.user?.isGuest);
    $('profileDropdown')?.classList.add('hidden');
    closeModal('customizeModal');
    closeModal('quickUserModal');
    $('appView')?.classList.add('hidden');
    $('authView')?.classList.remove('hidden');
    document.querySelectorAll('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.authTab === 'register'));
    $('loginForm')?.classList.add('hidden');
    $('registerForm')?.classList.remove('hidden');
    $('guestForm')?.classList.add('hidden');
    $('authError')?.classList.add('hidden');
    $('authBackToChatBtn')?.classList.toggle('hidden', !state.guestRegisterReturnToChat);
  }

  function teardownAdminUi() {
    [
      'adminModal',
      'dropStealthBtn',
      'dropOwnerSuiteBtn',
      'dropAdminBtn',
      'topStealthBadge',
      'plusAdminNoticeBtn',
      'plusClearRoomBtn',
      'drawerOwnerSuiteBtn',
      'drawerAdminBtn',
      'custStealthCard'
    ].forEach((id) => $(id)?.remove());
  }

  function ensureAdminUiMounted() {
    const u = state.user;
    if (!u || u.isGuest) {
      teardownAdminUi();
      return;
    }
    const isOwner = u.role === 'site_owner' || Boolean(u.isSupremeOwner);
    const canStealth = isOwner || hasPerm('stealth');
    const canBank = isOwner || u.role === 'co_owner' || Number(getRank(u.role)?.power || 0) >= 14;
    const canPanel = isOwner || hasPerm('access_panel') || canBank;
    const canNotice = isOwner || hasPerm('access_panel');
    const canClearRoom = isOwner || hasPerm('clear_room') || state.isRoomManager;

    if (!canPanel && !canStealth && !canClearRoom) {
      teardownAdminUi();
      return;
    }

    // 1) Top Stealth Badge
    if (canStealth) {
      if (!$('topStealthBadge')) {
        const topbarRight = document.querySelector('#topBar .topbar-right');
        const goldRichBtn = $('goldRichBtn');
        if (topbarRight) {
          const badge = document.createElement('span');
          badge.id = 'topStealthBadge';
          badge.className = 'stealth-pill hidden';
          badge.title = 'وضع التخفي مفعل';
          badge.innerHTML = '<i class="fa-solid fa-user-secret"></i>';
          if (goldRichBtn && goldRichBtn.parentNode === topbarRight) topbarRight.insertBefore(badge, goldRichBtn);
          else topbarRight.appendChild(badge);
        }
      }
      $('topStealthBadge')?.classList.toggle('hidden', !Boolean(u.isStealth));
    } else {
      $('topStealthBadge')?.remove();
    }

    // 2) Profile Dropdown Admin/Owner Items
    const profDrop = $('profileDropdown');
    const dropLogout = $('dropLogoutBtn');
    if (profDrop && dropLogout) {
      if (canStealth) {
        if (!$('dropStealthBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'dropStealthBtn';
          btn.className = 'drop-item';
          btn.addEventListener('click', async () => {
            $('profileDropdown')?.classList.add('hidden');
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
          profDrop.insertBefore(btn, dropLogout);
        }
        $('dropStealthBtn').innerHTML = u.isStealth
          ? '<i class="fa-solid fa-eye"></i> إلغاء وضع التخفي'
          : '<i class="fa-solid fa-user-secret"></i> تفعيل وضع التخفي';
      } else {
        $('dropStealthBtn')?.remove();
      }

      if (isOwner) {
        if (!$('dropOwnerSuiteBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'dropOwnerSuiteBtn';
          btn.className = 'drop-item';
          btn.innerHTML = '<i class="fa-solid fa-crown" style="color:#d97706"></i> جناح المالك الحصري';
          btn.addEventListener('click', () => {
            $('profileDropdown')?.classList.add('hidden');
            openAdminPanel('owner_suite');
          });
          profDrop.insertBefore(btn, dropLogout);
        }
      } else {
        $('dropOwnerSuiteBtn')?.remove();
      }

      if (canPanel) {
        if (!$('dropAdminBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'dropAdminBtn';
          btn.className = 'drop-item';
          btn.innerHTML = '<i class="fa-solid fa-sliders"></i> لوحة التحكم';
          btn.addEventListener('click', () => {
            $('profileDropdown')?.classList.add('hidden');
            openAdminPanel('stats');
          });
          profDrop.insertBefore(btn, dropLogout);
        }
      } else {
        $('dropAdminBtn')?.remove();
      }
    }

    // 3) Plus Dropdown Admin Items
    const plusDrop = $('plusDropdown');
    if (plusDrop) {
      const custTextBtn = $('plusCustomizeTextBtn');
      if (canNotice) {
        if (!$('plusAdminNoticeBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'plusAdminNoticeBtn';
          btn.className = 'drop-item';
          btn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> إرسال كإشعار إدارة';
          btn.addEventListener('click', () => {
            $('plusDropdown')?.classList.add('hidden');
            state.adminNoticeMode = true;
            $('adminNoticeModePill')?.classList.remove('hidden');
            $('messageInput')?.focus();
          });
          if (custTextBtn && custTextBtn.parentNode === plusDrop) plusDrop.insertBefore(btn, custTextBtn);
          else plusDrop.appendChild(btn);
        }
      } else {
        $('plusAdminNoticeBtn')?.remove();
      }

      if (canClearRoom) {
        if (!$('plusClearRoomBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'plusClearRoomBtn';
          btn.className = 'drop-item danger';
          btn.innerHTML = '<i class="fa-solid fa-broom"></i> مسح رسائل الغرفة';
          btn.addEventListener('click', async () => {
            $('plusDropdown')?.classList.add('hidden');
            if (!confirm('مسح جميع رسائل هذه الغرفة؟')) return;
            try {
              await api('/api/mod/clear-room', { method: 'POST', body: { roomId: state.currentRoom?.id } });
              state.messages = [];
              renderAllMessages();
            } catch (err) {
              showToast(err.message, true);
            }
          });
          plusDrop.appendChild(btn);
        }
      } else {
        $('plusClearRoomBtn')?.remove();
      }
    }

    // 4) Slide Main Drawer Admin Items
    const drawerNav = document.querySelector('#mainDrawer .drawer-nav');
    const drawerLogout = drawerNav?.querySelector('.drawer-item[data-drawer="logout"]');
    const closeMainDrawerLocal = () => {
      $('drawerBackdrop')?.classList.add('hidden');
      $('mainDrawer')?.classList.add('hidden');
    };
    if (drawerNav && drawerLogout) {
      if (isOwner) {
        if (!$('drawerOwnerSuiteBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'drawerOwnerSuiteBtn';
          btn.className = 'drawer-item';
          btn.innerHTML = '<i class="fa-solid fa-crown" style="color:#d97706"></i> جناح المالك الحصري';
          btn.addEventListener('click', () => {
            closeMainDrawerLocal();
            openAdminPanel('owner_suite');
          });
          drawerNav.insertBefore(btn, drawerLogout);
        }
      } else {
        $('drawerOwnerSuiteBtn')?.remove();
      }

      if (canPanel) {
        if (!$('drawerAdminBtn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.id = 'drawerAdminBtn';
          btn.className = 'drawer-item';
          btn.innerHTML = '<i class="fa-solid fa-sliders"></i> لوحة التحكم';
          btn.addEventListener('click', () => {
            closeMainDrawerLocal();
            openAdminPanel('stats');
          });
          drawerNav.insertBefore(btn, drawerLogout);
        }
      } else {
        $('drawerAdminBtn')?.remove();
      }
    }

    // 5) Stealth Box inside Profile Customizer
    const logoutWrap = $('custMoreLogoutWrap');
    if (canStealth && logoutWrap?.parentNode) {
      if (!$('custStealthCard')) {
        const card = document.createElement('div');
        card.id = 'custStealthCard';
        card.className = 'stealth-box';
        card.style.marginTop = '8px';
        card.innerHTML = `
          <div>
            <strong><i class="fa-solid fa-user-secret"></i> وضع التخفي للإدارة والمالك</strong>
            <p>إخفاء دخولك ومغادرتك واسمك من قوائم المتواجدين بالكامل.</p>
          </div>
          <label class="switch-label">
            <input type="checkbox" id="custStealthToggle" />
            <span>تفعيل التخفي</span>
          </label>
        `;
        logoutWrap.parentNode.insertBefore(card, logoutWrap);
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
      }
      if ($('custStealthToggle')) $('custStealthToggle').checked = Boolean(u.isStealth);
    } else {
      $('custStealthCard')?.remove();
    }

    // 6) Admin Panel access lives in external authorized bundle (/admin-panel.js) or dedicated /admin dashboard.
    if (!canPanel) {
      $('adminModal')?.remove();
    }
  }

  function getRank(roleKey) {
    const cleanKey = String(roleKey || 'member').trim() || 'member';
    const found = state.ranks.find((r) => r.key === cleanKey);
    if (found) return found;
    if (cleanKey === 'guest') {
      return {
        key: 'guest',
        label: 'زائر',
        icon: '👤',
        badge_style: 'royal_shield',
        image_url: '',
        bg_color: '#475569',
        text_color: '#f8fafc',
        power: 1,
        permissions: {}
      };
    }
    return {
      key: cleanKey,
      label: 'عضو',
      icon: cleanKey === 'member' ? '' : '👤',
      badge_style: 'royal_shield',
      image_url: '',
      bg_color: '#334155',
      text_color: '#ffffff',
      power: 5,
      permissions: {}
    };
  }

  function isSafeHttpsOrLocalUrlClient(rawUrl, allowDataImage = false) {
    const val = String(rawUrl || '').trim();
    if (!val) return true;
    if (val.startsWith('/') && !val.startsWith('//')) return true;
    if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(val)) return true;
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
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

  function canUploadAnimatedGif(userObj = state.user) {
    if (!userObj) return false;
    if (userObj.role === 'site_owner' || userObj.isSupremeOwner) return true;
    if (userObj.isGuest || userObj.role === 'guest') return false;
    const ranks = Array.isArray(state.ranks) ? state.ranks : [];
    const topNonOwnerRanks = ranks
      .filter((r) => r && r.key !== 'site_owner' && r.key !== 'guest')
      .sort((a, b) => Number(b.power || 0) - Number(a.power || 0))
      .slice(0, 2);
    if (topNonOwnerRanks.length >= 2) {
      if (topNonOwnerRanks.some((r) => r.key === userObj.role)) return true;
      const minTopPower = Number(topNonOwnerRanks[1].power || 13);
      return Number(getRank(userObj.role)?.power || 0) >= minTopPower;
    }
    return (
      userObj.role === 'co_owner' ||
      userObj.role === 'general_admin' ||
      Number(getRank(userObj.role)?.power || 0) >= 13
    );
  }

  function syncProfileUploadControlsForRole(userObj = state.user) {
    const gifAllowed = canUploadAnimatedGif(userObj);
    if ($('custCoverFile')) $('custCoverFile').setAttribute('accept', 'image/*');
    if ($('custAvatarFile')) $('custAvatarFile').setAttribute('accept', 'image/*');
    if ($('custUploadCoverBtn')) {
      $('custUploadCoverBtn').title = gifAllowed
        ? 'رفع غلاف (يدعم GIF المتحركة و PNG و JPG)'
        : 'رفع غلاف (صور ثابتة مضغوطة — GIF للمالك وأعلى رتبتين فقط)';
    }
    if ($('custUploadAvatarBtn')) {
      $('custUploadAvatarBtn').title = gifAllowed
        ? 'تغيير الصورة الشخصية (يدعم GIF المتحركة)'
        : 'تغيير الصورة الشخصية (صور ثابتة مضغوطة — GIF للمالك وأعلى رتبتين فقط)';
    }
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
    if (r.key === 'member') {
      return r.icon && r.icon !== '⭐' ? `<span>${escapeHtml(r.icon)}</span>` : '<i class="fa-solid fa-user"></i>';
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
    const allowed = [
      'Cairo', 'Tajawal', 'Amiri', 'Lemonada', 'Aref Ruqaa',
      'Reem Kufi', 'Lalezar', 'Changa', 'Marhey', 'Rakkas', 'Almarai'
    ];
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
    const allRanks = (state.ranks || []).filter((r) => r.key !== 'guest' && r.key !== 'site_owner');
    if (isOwner) {
      return [...allRanks].sort((a, b) => (Number(b.power) || 0) - (Number(a.power) || 0));
    }
    const myRank = getRank(state.user.role);
    const allowedSet = new Set();
    if (Array.isArray(myRank?.assignable_roles) && myRank.assignable_roles.length > 0) {
      myRank.assignable_roles.forEach((k) => {
        if (k) allowedSet.add(String(k));
      });
    } else {
      const ceiling = Number(myRank?.max_assignable_rank) || 0;
      allRanks.forEach((r) => {
        if (Number(r.power) <= ceiling) allowedSet.add(r.key);
      });
    }
    const isRoomOwner = Boolean(
      state.currentRoom?.owner_user_id &&
      state.user?.userId &&
      Number(state.currentRoom.owner_user_id) === Number(state.user.userId)
    );
    if (isRoomOwner && state.currentRoom?.owner_perms?.assign_roles && Array.isArray(state.currentRoom.owner_allowed_roles)) {
      state.currentRoom.owner_allowed_roles.forEach((k) => {
        if (k) allowedSet.add(String(k));
      });
    }
    return allRanks
      .filter((r) => allowedSet.has(r.key))
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
    const fs = userObj.name_font_style || userObj.nameFontStyle || userObj.font_style || userObj.fontStyle || 'Normal';
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
      const stageIsDark = isCurrentStageDark();
      let safeNameCol = nameColor;
      if (!nameBg) {
        if (stageIsDark && !isReadableOnDarkBg(nameColor)) safeNameCol = '#f8fafc';
        else if (!stageIsDark && !isReadableOnLightBg(nameColor)) safeNameCol = '#0f172a';
      }
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
    if (fs === 'Bold' || fs === 'BoldItalic') styles.push('font-weight:800');
    if (fs === 'Italic' || fs === 'BoldItalic') styles.push('font-style:italic');
    styles.push(`font-size:${nameFontSize}px`);

    const leftWing = wings ? '<span class="vip-wing">🪽</span>' : isExclusiveOwner ? '<span class="vip-wing">👑</span>' : '';
    const rightWing = wings ? '<span class="vip-wing">🪽</span>' : '';

    const verifiedHtml = isExclusiveOwner
      ? '<i class="fa-solid fa-circle-check owner-verified-badge" title="مؤسس ومالك الشات الموثق"></i>'
      : '';
    const kingHtml = uKey && state.roomKingKey && uKey === state.roomKingKey && role !== 'site_owner'
      ? '<span class="room-king-badge" title="الأكثر تفاعلاً في الغرفة"><i class="fa-solid fa-crown"></i> ملك الغرفة</span>'
      : '';

    const textClass = isExclusiveOwner ? 'name-anim-text owner-hologram-text' : 'name-anim-text';
    return `<span class="${classes.join(' ')}" style="${styles.join(';')}">${leftWing}<span class="${textClass}">${name}</span>${rightWing}</span>${verifiedHtml}${kingHtml}`;
  }

  function findFrameCatalogEntry(frameId) {
    if (!frameId || frameId === 'none') return null;
    return (state.shopItems?.frames || []).find((f) => f.id === frameId) || null;
  }

  function frameOrnamentHtml(frame, isOwnerUser = false) {
    if (!frame || frame === 'none') return '';
    const frameObj = findFrameCatalogEntry(frame);
    if (frameObj && frameObj.imageUrl) {
      return `<img src="${escapeHtml(frameObj.imageUrl)}" class="avatar-frame-img-overlay" alt="" />`;
    }
    const svg = FRAME_ORNAMENT_SVGS[frame] || '';
    const innerOrnament = svg ? `<span class="avatar-frame-svg-overlay">${svg}</span>` : '';
    const overlayHtml = `<span class="avatar-frame-overlay frame-overlay-${escapeHtml(frame)}" aria-hidden="true">${innerOrnament}</span>`;
    if (frame === 'owner_sovereign' && isOwnerUser) {
      return `${overlayHtml}<span class="royal-eclipse-orbits" aria-hidden="true"><span class="eclipse-crystal ec-1"></span><span class="eclipse-crystal ec-2"></span><span class="eclipse-crystal ec-3"></span></span>`;
    }
    return overlayHtml;
  }

  function syncFrameOrnament(wrapEl, frame, isOwnerUser = false) {
    if (!wrapEl) return;
    wrapEl.querySelectorAll('.frame-svg-ornament, .royal-eclipse-orbits, .avatar-frame-overlay, .avatar-frame-img-overlay').forEach((n) => n.remove());
    if (!frame || frame === 'none') return;
    const frameObj = findFrameCatalogEntry(frame);
    if (frameObj && frameObj.imageUrl) {
      const img = document.createElement('img');
      img.src = frameObj.imageUrl;
      img.className = 'avatar-frame-img-overlay';
      img.alt = '';
      wrapEl.appendChild(img);
      return;
    }
    const ov = document.createElement('span');
    ov.className = `avatar-frame-overlay frame-overlay-${frame}`;
    ov.setAttribute('aria-hidden', 'true');
    const svg = FRAME_ORNAMENT_SVGS[frame] || '';
    ov.innerHTML = svg ? `<span class="avatar-frame-svg-overlay">${svg}</span>` : '';
    wrapEl.appendChild(ov);
    if (frame === 'owner_sovereign' && isOwnerUser) {
      const orbits = document.createElement('span');
      orbits.className = 'royal-eclipse-orbits';
      orbits.setAttribute('aria-hidden', 'true');
      orbits.innerHTML = '<span class="eclipse-crystal ec-1"></span><span class="eclipse-crystal ec-2"></span><span class="eclipse-crystal ec-3"></span>';
      wrapEl.appendChild(orbits);
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

  function normalizeCleanMentionText(str) {
    return String(str || '')
      .replace(/[\u200e\u200f\u200b\u200c\u200d]/g, '')
      .replace(/^@+/, '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function doesInputContainCleanName(inputValue, cleanName) {
    const val = normalizeCleanMentionText(inputValue);
    const target = normalizeCleanMentionText(cleanName);
    if (!val || !target) return false;
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[\\s،,.!?؟؛:"'()\\-])${escaped}(?=$|[\\s،,.!?؟؛:"'()\\-])`, 'i');
    return re.test(val);
  }

  function insertMention(name, userId = null) {
    const clean = String(name || '')
      .replace(/[\u200e\u200f\u200b\u200c\u200d]/g, '')
      .replace(/^@+/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const input = $('messageInput');
    if (!clean || !input) return;

    let resolvedId = userId ? String(userId).trim() : '';
    if (!resolvedId) {
      const botName = String(state.settings?.welcome_bot_name || 'مساعد الأصيل').trim();
      if (botName && normalizeCleanMentionText(clean) === normalizeCleanMentionText(botName)) {
        resolvedId = 'system:welcomebot';
      } else {
        const matched = findKnownUserByMention(clean);
        if (matched?.key) resolvedId = String(matched.key);
      }
    }

    const currentVal = String(input.value || '');
    const prefix = currentVal && !/\s$/.test(currentVal) ? ' ' : '';
    input.value = `${currentVal}${prefix}${clean} `;
    state.mentionedUserId = resolvedId || null;
    state.mentionedUserName = resolvedId ? clean : '';
    input.focus();
    try {
      const endPos = input.value.length;
      input.setSelectionRange(endPos, endPos);
    } catch {
      // ignore non-selectable input
    }
  }

  function findKnownUserByMention(mentionText) {
    const target = normalizeCleanMentionText(mentionText);
    if (!target) return null;
    const pools = [state.roomUsers, state.onlineUsers, state.persistentMembers, state.user ? [state.user] : []];
    for (const pool of pools) {
      for (const u of pool || []) {
        const n1 = normalizeCleanMentionText(u.name || u.displayName || '');
        const n2 = normalizeCleanMentionText(u.username || '');
        if ((n1 && n1 === target) || (n2 && n2 === target)) return u;
      }
    }
    return null;
  }

  function doesTextContainName(rawText, candidateName) {
    const text = normalizeCleanMentionText(rawText);
    const clean = normalizeCleanMentionText(candidateName);
    if (!text || clean.length < 2) return false;
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[\\s،,.!?؟؛:"'()\\-])${escaped}(?=$|[\\s،,.!?؟؛:"'()\\-])`, 'i');
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
    const mainBotName = String(state.settings?.welcome_bot_name || 'مساعد الأصيل').trim();
    if (mainBotName.length >= 2 && !seen.has(mainBotName.toLowerCase())) {
      seen.add(mainBotName.toLowerCase());
      knownNames.push({
        name: mainBotName,
        user: { key: 'system:welcomebot', name: mainBotName, nameBgColor: '#1e293b', nameColor: '#fbbf24' }
      });
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

  function renderMessageTextWithMentions(rawText, msg = null) {
    let html = renderContentWithEmojis(rawText);
    const knownNames = collectKnownUsersForMentions();
    const explicitId = msg?.mentioned_user_id ? String(msg.mentioned_user_id).trim() : '';
    const explicitName = msg?.mentioned_user_name ? String(msg.mentioned_user_name).replace(/^@+/, '').trim() : '';
    if (explicitId && explicitName && !knownNames.some((x) => x.name.toLowerCase() === explicitName.toLowerCase())) {
      knownNames.unshift({
        name: explicitName,
        user: { key: explicitId, name: explicitName }
      });
    }
    const tokens = [];

    for (const item of knownNames) {
      const esc = escapeHtml(item.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const itemKey = String(item.user?.key || explicitId || '');
      const isMeMention = Boolean(
        state.user?.key &&
        msg?.sender_key !== state.user.key &&
        ((explicitId && explicitId === state.user.key && (!explicitName || normalizeCleanMentionText(item.name) === normalizeCleanMentionText(explicitName))) ||
          (!explicitId && itemKey && itemKey === state.user.key))
      );
      const isMeRecipient = Boolean(
        isMeMention &&
        state.user?.key &&
        msg?.sender_key !== state.user.key
      );
      const re = new RegExp(`(^|\\s|>)@?${esc}(?=$|\\s|<|[،,.!?:"'()\\-])`, 'gi');
      html = html.replace(re, (match, lead) => {
        if (/<[^>]*$/.test(html.slice(0, html.indexOf(match)))) return match;
        const idx = tokens.length;
        if (isMeRecipient) {
          tokens.push(
            `<span class="mention-inline-badge mention-is-me" data-mention-name="${escapeHtml(item.name)}" data-mention-key="${escapeHtml(itemKey)}">${escapeHtml(item.name)}</span>`
          );
        } else {
          tokens.push(
            `<span class="mention-plain-name" data-mention-name="${escapeHtml(item.name)}" data-mention-key="${escapeHtml(itemKey)}">${escapeHtml(item.name)}</span>`
          );
        }
        return `${lead}\u0000MTOK${idx}\u0000`;
      });
    }

    // Legacy @token fallback (clean display without @, highlighted only for recipient)
    html = html.replace(
      /(^|\s)@([^\s<>"'&\u0000]{2,30})/g,
      (_m, lead, tok) => {
        const isMeTok = Boolean(
          state.user?.key &&
          msg?.sender_key !== state.user.key &&
          normalizeCleanMentionText(tok) === normalizeCleanMentionText(state.user?.name || state.user?.username || '')
        );
        return isMeTok
          ? `${lead}<span class="mention-inline-badge mention-is-me" data-mention-name="${tok}">${tok}</span>`
          : `${lead}<span class="mention-plain-name" data-mention-name="${tok}">${tok}</span>`;
      }
    );

    html = html.replace(/\u0000MTOK(\d+)\u0000/g, (_m, i) => tokens[Number(i)] || '');
    return { html, hasMention: html.includes('mention-is-me') };
  }

  function openCustomDrawerSectionModal(section) {
    if (!section) return;
    let modal = $('customSectionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customSectionModal';
      modal.className = 'modal-backdrop modal-slideover hidden';
      modal.innerHTML = `
        <div class="modal-card modal-card-md">
          <div class="modal-header">
            <h3 id="customSectionModalTitle"><i class="fa-solid fa-bookmark"></i> قسم مخصص</h3>
            <button type="button" class="modal-close rtl-back-btn" id="customSectionModalCloseBtn"><i class="fa-solid fa-arrow-right"></i> <span>رجوع</span></button>
          </div>
          <div id="customSectionModalBody" class="modal-body"></div>
        </div>
      `;
      document.body.appendChild(modal);
      $('customSectionModalCloseBtn')?.addEventListener('click', () => closeModal('customSectionModal'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('customSectionModal');
      });
    }
    const iconCls = section.icon && /^fa-[a-z0-9-\s]+$/i.test(String(section.icon).trim())
      ? String(section.icon).trim()
      : 'fa-solid fa-star';
    if ($('customSectionModalTitle')) {
      $('customSectionModalTitle').innerHTML = `<i class="${escapeHtml(iconCls)}" style="color:#F59E0B;"></i> ${escapeHtml(section.title || 'قسم')}`;
    }
    if ($('customSectionModalBody')) {
      const content = String(section.content || '').trim();
      $('customSectionModalBody').innerHTML = `
        <div class="custom-drawer-section-card">
          ${content
            ? content.split(/\n+/).map((line) => `<p>${escapeHtml(line)}</p>`).join('')
            : '<div class="muted">لا يوجد محتوى مضاف لهذا القسم بعد.</div>'}
        </div>
      `;
    }
    openModal('customSectionModal');
  }

  function renderDynamicDrawerSections(s = state.settings) {
    const drawerNav = document.querySelector('#mainDrawer .drawer-nav');
    if (!drawerNav) return;
    drawerNav.querySelectorAll('.drawer-item-custom').forEach((el) => el.remove());
    const sections = Array.isArray(s?.custom_drawer_sections) ? s.custom_drawer_sections : [];
    if (!sections.length) return;
    const anchor =
      $('drawerOwnerSuiteBtn') ||
      $('drawerAdminBtn') ||
      drawerNav.querySelector('.drawer-item[data-drawer="logout"]') ||
      null;
    sections.forEach((sec) => {
      if (!sec || !sec.title) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drawer-item drawer-item-custom';
      btn.dataset.customSectionId = String(sec.id || '');
      const iconCls = sec.icon && /^fa-[a-z0-9-\s]+$/i.test(String(sec.icon).trim())
        ? String(sec.icon).trim()
        : 'fa-solid fa-star';
      btn.innerHTML = `<i class="${escapeHtml(iconCls)}" style="color:#F59E0B;"></i> ${escapeHtml(sec.title)}`;
      btn.addEventListener('click', () => {
        $('drawerBackdrop')?.classList.add('hidden');
        $('mainDrawer')?.classList.add('hidden');
        if (sec.type === 'quiz_points') {
          openLeaderboardsModal('quizLeaders');
        } else if (sec.type === 'leaderboards') {
          openLeaderboardsModal('rich');
        } else {
          openCustomDrawerSectionModal(sec);
        }
      });
      if (anchor && anchor.parentNode === drawerNav) {
        drawerNav.insertBefore(btn, anchor);
      } else {
        drawerNav.appendChild(btn);
      }
    });
  }

  function renderAdSlotHtml(slotEl, adsList) {
    if (!slotEl) return;
    const active = (Array.isArray(adsList) ? adsList : []).filter(
      (a) => a && a.enabled !== false && String(a.code || '').trim()
    );
    const sig = active.map((a) => `${a.id}:${a.placement}:${a.code}`).join('||');
    if (slotEl.dataset.adsSig === sig) {
      slotEl.classList.toggle('hidden', active.length === 0);
      return;
    }
    slotEl.dataset.adsSig = sig;
    slotEl.innerHTML = '';
    if (!active.length) {
      slotEl.classList.add('hidden');
      return;
    }
    slotEl.classList.remove('hidden');
    for (const ad of active) {
      const box = document.createElement('div');
      box.className = 'ad-unit-box';
      const tpl = document.createElement('template');
      tpl.innerHTML = String(ad.code || '').trim();
      const frag = tpl.content;
      const scripts = [...frag.querySelectorAll('script')];
      scripts.forEach((sc) => sc.remove());
      box.appendChild(frag);
      for (const oldSc of scripts) {
        const ns = document.createElement('script');
        for (const attr of oldSc.attributes) ns.setAttribute(attr.name, attr.value);
        if (oldSc.textContent) ns.textContent = oldSc.textContent;
        box.appendChild(ns);
      }
      slotEl.appendChild(box);
    }
  }

  function mountAdSlots(s = state.settings) {
    const units = Array.isArray(s?.ad_units) ? s.ad_units : [];
    const authAds = units.filter((a) => a && a.enabled !== false && (!a.placement || a.placement === 'both' || a.placement === 'auth'));
    const drawerAds = units.filter((a) => a && a.enabled !== false && (!a.placement || a.placement === 'both' || a.placement === 'drawer'));
    renderAdSlotHtml($('authAdsSlot'), authAds);
    renderAdSlotHtml($('drawerAdsSlot'), drawerAds);
  }

  function applySiteSettings(s, skipMirror = false) {
    if (!s) return;
    state.settings = s;
    document.title = s.site_name || 'شات الغرف المباشر';
    if ($('authSiteName')) $('authSiteName').textContent = s.site_name || 'شات الغرف المباشر';
    if ($('authSiteDesc')) $('authSiteDesc').textContent = s.site_description || '';
    if ($('authWelcomeMsg')) {
      const wMsg = String(s.welcome_message || '').trim();
      $('authWelcomeMsg').textContent = wMsg;
      $('authWelcomeMsg').classList.toggle('hidden', !wMsg);
    }
    if ($('drawerSiteTitle')) $('drawerSiteTitle').textContent = s.site_name || 'القائمة الرئيسية';
    if (s.site_logo && $('authSiteLogo')) {
      $('authSiteLogo').src = s.site_logo;
      $('authSiteLogo').classList.remove('hidden');
    } else if ($('authSiteLogo')) {
      $('authSiteLogo').src = DEFAULT_LOGO_SVG;
      $('authSiteLogo').classList.add('hidden');
    }
    if (Array.isArray(s.radio_stations) && s.radio_stations.length) {
      state.shopItems.radioStations = s.radio_stations;
      renderRadioStationsPopover();
    }
    const root = document.documentElement.style;
    const normBarColor = (c, fb = '#0f2342') => (!c || c === '#1a45e5' || c === '#0b2239' || c === '#18181b' ? fb : c);
    root.setProperty('--top-bar-bg', normBarColor(s.top_bar_color, '#0f2342'));
    root.setProperty('--bottom-bar-bg', normBarColor(s.bottom_bar_color, '#0f2342'));
    root.setProperty('--accent-btn', normBarColor(s.button_color, '#1d4ed8'));
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
    mountAdSlots(s);
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
    const canMsgStyleUi = Boolean(state.user && !state.user.isGuest && (isOwnerSelf || passesSettingRankThreshold('min_rank_msg_style', 'member')));

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
    $('quickTextStyleBtn')?.classList.toggle('hidden', !canMsgStyleUi);
    if (!canMsgStyleUi) $('inlineMsgStyleBar')?.classList.add('hidden');
    document.querySelector('.drawer-item[data-drawer="store"]')?.classList.toggle('hidden', !canStoreUi);
    renderDynamicDrawerSections(s);
    const allowReg = Number(s.allow_register ?? 1) !== 0;
    const allowGuest = Number(s.allow_guests ?? 1) !== 0;
    const regTabBtn = document.querySelector('.auth-tab[data-auth-tab="register"]');
    const guestTabBtn = document.querySelector('.auth-tab[data-auth-tab="guest"]');
    if (regTabBtn) {
      regTabBtn.classList.toggle('is-locked-tab', !allowReg);
      regTabBtn.title = allowReg ? '' : 'التسجيل الجديد مغلق مؤقتاً من المالك';
    }
    if (guestTabBtn) {
      guestTabBtn.classList.toggle('is-locked-tab', !allowGuest);
      guestTabBtn.title = allowGuest ? '' : 'دخول الزوار مغلق مؤقتاً من المالك';
    }
    const regSubmit = $('registerForm')?.querySelector('button[type="submit"]');
    if (regSubmit) {
      regSubmit.disabled = !allowReg;
      regSubmit.innerHTML = allowReg
        ? '<i class="fa-solid fa-user-plus"></i> إنشاء حساب ودخول'
        : '<i class="fa-solid fa-lock"></i> التسجيل مغلق مؤقتاً من المالك';
    }
    const guestSubmit = $('guestForm')?.querySelector('button[type="submit"]');
    if (guestSubmit) {
      guestSubmit.disabled = !allowGuest;
      guestSubmit.innerHTML = allowGuest
        ? '<i class="fa-solid fa-bolt"></i> دخول فوري كزائر'
        : '<i class="fa-solid fa-lock"></i> دخول الزوار مغلق مؤقتاً من المالك';
    }

    syncChatComposerLockState();
    if (!$('inlineMsgStyleBar')?.classList.contains('hidden')) {
      renderInlineMsgStyleBar();
    }
    if (!skipMirror) syncLocalMirror();
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
    const globalMode = String(state.settings?.fx_night_atmosphere || 'off');
    if (globalMode === 'off') return false;
    if (state.userNightPref === 'on') return true;
    if (state.userNightPref === 'off') return false;
    if (globalMode === 'always_on') return true;
    const hr = new Date().getHours();
    return hr >= 18 || hr < 6;
  }

  function isCurrentStageDark() {
    const r = state.currentRoom || {};
    const nightOn = isNightAtmosphereActive() && !r.wallpaper_url && !r.bg_custom;
    return Boolean(nightOn || r.bg_theme === 'royal_night' || r.wallpaper_url || r.bg_custom);
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
    const titleLabel = isOwnerTarget ? 'مؤسس ومالك الشات • دخول ملكي' : `${rk?.label || 'كبار الشخصيات'} • تشريف خاص`;
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
    if (state.token) persistSessionState(u, state.token);
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
      $('topAvatarImg').src = DEFAULT_AVATAR_SVG;
      $('topAvatarImg').classList.add('hidden');
      $('topAvatarLetter').classList.remove('hidden');
      $('topAvatarLetter').textContent = (u.name || 'ع').slice(0, 1);
    }

    ensureAdminUiMounted();
    const myLvl = Math.max(1, Number(u.level) || Number(getRank(u.role)?.power) || 1);

    $('dropUserName').innerHTML = isOwnerGalaxy ? formatNameHTML(u) : escapeHtml(u.name || '');
    $('dropUserRole').innerHTML = isOwnerGalaxy
      ? `${roleBadgeHTML(u.role)} <span class="owner-galaxy-title-pill"><i class="fa-solid fa-crown"></i> مؤسس ومالك الشات</span>`
      : `${roleBadgeHTML(u.role)} <span class="lvl-pill-mini">المستوى ${myLvl}</span>`;
    $('dropUserCoins').innerHTML = `<i class="fa-solid fa-gem" style="color:#f43f5e;"></i> ${u.coins || 0} روبي • <i class="fa-solid fa-fire" style="color:#fb923c;"></i> ${u.activityPoints || 0} تفاعل`;

    const isFrozen = Boolean(u.isFrozen && !isOwner);
    const fBanner = $('frozenUserBanner');
    if (fBanner) {
      fBanner.classList.toggle('hidden', !isFrozen);
      if (isFrozen) {
        fBanner.innerHTML = '<i class="fa-solid fa-snowflake"></i> حسابك مجمد حالياً من الإدارة (وضع القراءة فقط — لا يمكنك الإرسال أو التنقل).';
      }
    }
    syncChatComposerLockState();

    const isGuestUser = Boolean(u.isGuest);
    $('guestRegisterBottomBtn')?.classList.toggle('hidden', !isGuestUser);
    $('dropGuestRegisterBtn')?.classList.toggle('hidden', !isGuestUser);
    $('custGuestUpgradeCard')?.classList.toggle('hidden', !isGuestUser);

    const s = state.settings || {};
    const pmOn = Number(s.feat_pm ?? 1) !== 0 && (isOwner || (passesSettingRankThreshold('min_rank_pm') && hasPerm('pm')));
    const mediaOn = isOwner || (passesSettingRankThreshold('min_rank_chat_media') && hasPerm('chat_media'));
    const ytOn = Number(s.feat_youtube ?? 1) !== 0 && (isOwner || hasPerm('youtube'));
    const wallOn = Number(s.feat_wall ?? 1) !== 0 && (isOwner || hasPerm('wall'));
    const canMsgStyleOn = !isGuestUser && (isOwner || passesSettingRankThreshold('min_rank_msg_style', 'member'));
    $('topPmBtn')?.classList.toggle('hidden', !pmOn);
    $('quickImageUploadBtn')?.classList.toggle('hidden', !mediaOn);
    $('plusUploadImageBtn')?.classList.toggle('hidden', !mediaOn);
    $('voiceRecordBtn')?.classList.toggle('hidden', !mediaOn);
    $('quickTextStyleBtn')?.classList.toggle('hidden', !canMsgStyleOn);
    if (!canMsgStyleOn) $('inlineMsgStyleBar')?.classList.add('hidden');
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
    $('roomBannerImg').src = r.image_url || DEFAULT_ROOM_SVG;
    $('roomActivityBadge').innerHTML = `<i class="fa-solid fa-fire"></i> ${r.activity_points || 0} تفاعل`;
    $('roomSettingsBtn')?.classList.toggle('hidden', !(state.isRoomManager || state.canStyleRoom));

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

    const baseTopic = r.welcome_message || r.description || state.settings?.welcome_message || state.settings?.marquee_text || 'أهلاً بكم في شات الغرف المباشر!';
    const topicTxt = r.is_frozen ? `❄️ الغرفة مجمدة حالياً (للقراءة فقط) • ${baseTopic}` : baseTopic;
    if ($('topicBannerText')) $('topicBannerText').textContent = topicTxt;

    const boosted = Math.max(state.roomUsers.length, Number(r.onlineCount || 0));
    if ($('roomOnlineCounter')) $('roomOnlineCounter').textContent = String(boosted);

    const stage = $('chatStage');
    const rawTheme = r.bg_theme || 'classic_light';
    const nightOn = isNightAtmosphereActive() && !r.wallpaper_url && !r.bg_custom;
    const isDarkStage = Boolean(nightOn || rawTheme === 'royal_night' || r.wallpaper_url || r.bg_custom);
    stage.className = `chat-stage theme-${rawTheme} ${isDarkStage ? 'is-dark-stage' : 'is-light-stage'}${nightOn ? ' night-atmosphere-active' : ''}`;
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
      const globalOff = String(state.settings?.fx_night_atmosphere || 'off') === 'off';
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
    const rawHasVideo = Boolean(r.youtube_video_id && r.youtube_is_playing);
    const closedLocally = Boolean(rawHasVideo && state.ytLocalClosedVideoId && state.ytLocalClosedVideoId === r.youtube_video_id && !r.youtube_mini_mode);
    const hasVideo = rawHasVideo && !closedLocally;
    const canSearchYt = Boolean(state.user && !(state.user.isFrozen && state.user.role !== 'site_owner'));
    const isOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
    const canStopYt = Boolean(state.isRoomManager || (r.youtube_by_key && r.youtube_by_key === state.user?.key) || isOnMic);

    $('ytManagerForm')?.classList.toggle('hidden', !canSearchYt);
    $('ytStopBtn')?.classList.toggle('hidden', !(canStopYt && rawHasVideo));
    $('toggleYoutubeBarBtn')?.classList.toggle('active', hasVideo || state.ytBarOpen);

    const miniBar = $('micMiniYoutubeBar');
    const ytPlayer = $('ytPlayerContainer');
    const ytIframe = $('ytIframe');
    const compactCloseBtn = $('ytCompactCloseBtn');
    const showMiniBar = hasVideo && Boolean(r.youtube_mini_mode);

    if (hasVideo) {
      const displayTitle = r.youtube_title || r.youtube_video_id;
      const bySuffix = r.youtube_by_name ? ` • ${r.youtube_by_name}` : '';
      if ($('ytNowPlayingLabel')) {
        $('ytNowPlayingLabel').innerHTML = `<i class="fa-brands fa-youtube" style="color:#ef4444"></i> ${escapeHtml(displayTitle)}${escapeHtml(bySuffix)}`;
      }

      if (miniBar) {
        miniBar.classList.toggle('hidden', !showMiniBar);
        miniBar.classList.toggle('is-paused', Boolean(state.ytMicPaused));
        if ($('micMiniYtTitle')) $('micMiniYtTitle').textContent = displayTitle;
        if ($('micMiniYtPlayPauseBtn')) {
          $('micMiniYtPlayPauseBtn').innerHTML = state.ytMicPaused
            ? '<i class="fa-solid fa-play"></i>'
            : '<i class="fa-solid fa-pause"></i>';
        }
        $('micMiniYtStopBtn')?.classList.toggle('hidden', !canStopYt);
      }

      // Keep search bar hidden unless user explicitly opened it
      $('roomYoutubeBar')?.classList.toggle('hidden', !state.ytBarOpen);

      if (ytPlayer) {
        ytPlayer.classList.remove('hidden');
        ytPlayer.classList.toggle('yt-audio-only-frame', showMiniBar);
      }
      if (compactCloseBtn) {
        compactCloseBtn.classList.toggle('hidden', showMiniBar);
      }

      const wantAutoplay = showMiniBar ? '1' : '0';
      const targetSrc = `https://www.youtube.com/embed/${encodeURIComponent(r.youtube_video_id)}?autoplay=${wantAutoplay}&enablejsapi=1${state.ytLocalMuted ? '&mute=1' : ''}`;
      if (
        ytIframe &&
        (ytIframe.dataset.videoId !== r.youtube_video_id ||
          ytIframe.dataset.muted !== String(state.ytLocalMuted) ||
          ytIframe.dataset.autoplay !== wantAutoplay)
      ) {
        state.ytMicPaused = false;
        ytIframe.src = targetSrc;
        ytIframe.dataset.videoId = r.youtube_video_id;
        ytIframe.dataset.muted = String(state.ytLocalMuted);
        ytIframe.dataset.autoplay = wantAutoplay;
      }
    } else {
      miniBar?.classList.add('hidden');
      compactCloseBtn?.classList.add('hidden');
      if (ytPlayer) {
        ytPlayer.classList.add('hidden');
        ytPlayer.classList.remove('yt-audio-only-frame');
      }
      if (ytIframe && ytIframe.getAttribute('src') && ytIframe.getAttribute('src') !== 'about:blank') {
        ytIframe.src = 'about:blank';
        delete ytIframe.dataset.videoId;
        delete ytIframe.dataset.autoplay;
      }
      if ($('ytNowPlayingLabel')) {
        $('ytNowPlayingLabel').innerHTML = '<i class="fa-brands fa-youtube" style="color:#ef4444"></i> بحث وتشغيل يوتيوب الغرفة';
      }
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
          <img src="${escapeHtml(v.thumbnail)}" class="yt-result-thumb" loading="lazy" decoding="async" alt="" />
          <div class="yt-result-meta">
            <div class="yt-result-title">${escapeHtml(v.title)}</div>
            <div class="yt-result-sub">${escapeHtml(v.author)} • ${escapeHtml(v.duration)}</div>
          </div>
          <i class="fa-solid fa-circle-play" style="color:#38bdf8;font-size:18px;"></i>
        </button>
      `).join('');

      resBox.querySelectorAll('.yt-result-card').forEach((card) => {
        card.addEventListener('click', async () => {
          const videoId = card.dataset.vid;
          const title = card.dataset.title;
          const iAmOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
          try {
            const res = await api('/api/chat/youtube', {
              method: 'POST',
              body: {
                roomId: state.currentRoom?.id,
                url: videoId,
                title,
                isPlaying: true,
                miniMode: iAmOnMic
              }
            });
            if (res?.room) state.currentRoom = { ...state.currentRoom, ...res.room };
            state.ytForceVideo = false;
            state.ytLocalClosedVideoId = '';
            state.ytMicPaused = false;
            state.ytBarOpen = false;
            if ($('ytSearchInput')) $('ytSearchInput').value = '';
            resBox.classList.add('hidden');
            $('roomYoutubeBar')?.classList.add('hidden');
            renderRoomYoutubeBar();
            showToast(iAmOnMic ? `تم تشغيل الصوت أعلى المايكات: ${title}` : `تم تنزيل الفيديو في الغرفة: ${title}`);
          } catch (err) {
            showToast(err.message, true);
          }
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
        state.radioAudioEl.removeAttribute('src');
        state.radioAudioEl.load();
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
      const hasOccupied = (state.mics || []).some((m) => Boolean(m.holderKey) && !m.isSelfMuted && !m.isAdminMuted);
      if (!wavesEnabled || !hasOccupied || state.micsCollapsed) {
        state.micWaveRaf = null;
        return;
      }

      const now = Date.now();
      if (now - (state.lastMicWaveTickTs || 0) < 65) {
        state.micWaveRaf = requestAnimationFrame(tick);
        return;
      }
      state.lastMicWaveTickTs = now;

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
              if (state.realtimeActive && now - state.micLastEmitTs >= 320) {
                state.micLastEmitTs = now;
                api('/api/chat/mics/speaking-level', {
                  method: 'POST',
                  body: { roomId: state.currentRoom?.id, slot, level: Number(level.toFixed(2)) }
                }).catch(() => {});
              }
            }
          } else {
            const remKey = m.holderKey || m.holderSocketId;
            const remRec = remKey ? state.micAnalysers.get(`remote:${remKey}`) : null;
            if (remRec) {
              remRec.analyser.getByteFrequencyData(remRec.dataArray);
              let sum = 0;
              for (let i = 0; i < remRec.dataArray.length; i += 1) sum += remRec.dataArray[i];
              const raw = Math.min(1, (sum / (remRec.dataArray.length * 110)));
              remRec.smoothed = remRec.smoothed * 0.65 + raw * 0.35;
              level = remRec.smoothed;
            }
            const sockLvl = state.micLevelBySlot.get(slot);
            if (sockLvl && now - sockLvl.ts < 850) {
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

  function attachRemoteAudioStream(remoteKey, stream) {
    const safeId = String(remoteKey || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    let audio = document.getElementById(`webrtc_audio_${safeId}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `webrtc_audio_${safeId}`;
      audio.autoplay = true;
      audio.playsInline = true;
      $('webrtcAudioContainer').appendChild(audio);
    }
    audio.srcObject = stream;
    audio.play().catch(() => {});
    setupMicAnalyser(`remote:${remoteKey}`, stream, false);
  }

  function createPeerConnection(remoteKey) {
    if (state.micPeers.has(remoteKey)) return state.micPeers.get(remoteKey);
    const pc = new RTCPeerConnection(ICE_CONFIG);
    state.micPeers.set(remoteKey, pc);

    if (state.localStream) {
      for (const track of state.localStream.getTracks()) {
        pc.addTrack(track, state.localStream);
      }
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && state.realtimeActive) {
        api('/api/chat/webrtc/signal', {
          method: 'POST',
          body: { roomId: state.currentRoom?.id, toKey: remoteKey, type: 'ice', candidate: ev.candidate }
        }).catch(() => {});
      }
    };

    pc.ontrack = (ev) => {
      if (ev.streams && ev.streams[0]) {
        attachRemoteAudioStream(remoteKey, ev.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        state.micPeers.delete(remoteKey);
        cleanupMicAnalyser(`remote:${remoteKey}`);
        const safeId = String(remoteKey || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const el = document.getElementById(`webrtc_audio_${safeId}`);
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

    try {
      const res = await api('/api/chat/mics/take', {
        method: 'POST',
        body: { roomId: state.currentRoom?.id, slot: slotNum }
      });
      if (Array.isArray(res?.slots)) {
        state.mics = res.slots;
        renderMics();
      }
      state.isSelfMicMuted = false;
      api('/api/chat/webrtc/signal', {
        method: 'POST',
        body: { roomId: state.currentRoom?.id, type: 'ready', slot: slotNum }
      }).catch(() => {});
      startMicWaveformLoop();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function leaveVoiceMic() {
    stopLocalMicStream();
    closeAllMicPeers();
    try {
      const res = await api('/api/chat/mics/leave', {
        method: 'POST',
        body: { roomId: state.currentRoom?.id }
      });
      if (Array.isArray(res?.slots)) {
        state.mics = res.slots;
        renderMics();
      }
    } catch {
      // ignore
    }
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
  function setReplyTarget(msg) {
    if (!msg) return;
    const rawSnippet = msg.msg_type === 'image'
      ? '🖼️ صورة'
      : msg.msg_type === 'audio'
        ? '🎙️ رسالة صوتية'
        : String(msg.content || '').trim();
    state.replyTo = {
      id: msg.id ? String(msg.id) : null,
      senderName: String(msg.sender_name || 'عضو').slice(0, 60),
      senderKey: String(msg.sender_key || '').slice(0, 80),
      content: rawSnippet.slice(0, 140)
    };
    const bar = $('chatReplyBar');
    if (bar) {
      if ($('chatReplySender')) $('chatReplySender').textContent = state.replyTo.senderName;
      if ($('chatReplySnippet')) $('chatReplySnippet').textContent = state.replyTo.content || '...';
      bar.classList.remove('hidden');
    }
    $('messageInput')?.focus();
  }

  function clearReplyTarget() {
    state.replyTo = null;
    $('chatReplyBar')?.classList.add('hidden');
  }

  async function reactToMessage(msgId, reactionKey) {
    if (!msgId || !reactionKey || !state.token) return;
    const feed = $('chatFeed');
    const preRow = feed?.querySelector(`[data-msg-id="${CSS.escape(String(msgId))}"]`);
    if (preRow) {
      preRow.querySelector('.msg-click-action-bar')?.classList.add('hidden');
      preRow.querySelector('.msg-dots-menu')?.classList.add('hidden');
    }
    try {
      const res = await api(`/api/chat/messages/${encodeURIComponent(String(msgId))}/react`, {
        method: 'POST',
        body: { reaction: reactionKey }
      });
      if (res?.message) {
        const idx = state.messages.findIndex((m) => String(m.id) === String(msgId));
        if (idx !== -1) state.messages[idx] = { ...state.messages[idx], ...res.message };
        const existingRow = feed?.querySelector(`[data-msg-id="${CSS.escape(String(msgId))}"]`);
        if (existingRow) {
          const fresh = createMessageRowElement(res.message);
          existingRow.replaceWith(fresh);
        }
      }
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function renderMessageReactionsHtml(msg) {
    if (!msg?.id) return '';
    const reactions = (msg.reactions && typeof msg.reactions === 'object') ? msg.reactions : {};
    const myKey = String(state.user?.key || '');
    const pills = MSG_REACTION_META.map((meta) => {
      const arr = Array.isArray(reactions[meta.key]) ? reactions[meta.key] : [];
      if (!arr.length) return '';
      const reacted = myKey && arr.includes(myKey);
      return `<button type="button" class="msg-reaction-pill${reacted ? ' reacted' : ''}" data-react-key="${meta.key}" title="${meta.label}">${meta.emoji} <span>${arr.length}</span></button>`;
    }).filter(Boolean);
    if (!pills.length) return '';
    return `<div class="msg-reactions-bar">${pills.join('')}</div>`;
  }

  function createMessageRowElement(msg) {
    const row = document.createElement('div');
    const isQuizBotMsg = msg.sender_key === 'system:quizbot';
    const isVirtualSender = String(msg.sender_key || '').startsWith('virtual:');
    const isWelcomeBotMsg = Boolean(msg.is_welcome_bot) || msg.sender_key === 'system:welcomebot' || isVirtualSender;
    const isAdminNotice = Boolean(msg.is_admin_notice) && !isQuizBotMsg && !isWelcomeBotMsg;
    const isGift = Boolean(msg.is_gift);
    const isOwnerSender = msg.sender_role === 'site_owner' && !isQuizBotMsg && !isWelcomeBotMsg && msg.sender_key !== 'system:official';
    const rawContent = String(msg.content || '');
    const myName = String(state.user?.name || '').trim();
    const myUser = String(state.user?.username || '').trim();
    const mentionsMe =
      msg.msg_type === 'text' &&
      msg.sender_key !== state.user?.key &&
      ((msg.mentioned_user_id && state.user?.key && msg.mentioned_user_id === state.user.key) ||
        doesTextContainName(rawContent, myName) ||
        doesTextContainName(rawContent, myUser));

    const timeStr = formatTimeAgo(msg.created_at_ms || msg.created_at);
    const msgFontSize = Math.max(13, Math.min(17, Number(msg.font_size || msg.fontSize) || 14));

    const legacyQuizMap = { royal: 'royal_gold', glass: 'glass_modern', classic: 'classic_compact' };
    const rawQuizStyle = String(msg.quiz_style || state.settings?.quiz_msg_style || 'royal_gold');
    const quizStyleKey = legacyQuizMap[rawQuizStyle] || rawQuizStyle;
    const allowedWbotColors = new Set(['royal_gold', 'sky_blue', 'emerald_green', 'ruby_red', 'royal_purple']);
    const rawWbotColor = String(state.settings?.welcome_bot_color || msg.bot_color || 'royal_gold');
    const wbotColorKey = allowedWbotColors.has(rawWbotColor) ? rawWbotColor : 'royal_gold';

    let inlineTextHtml = '';
    let mediaBelowHtml = '';
    let hasMention = false;
    if (msg.msg_type === 'image' && msg.media_url) {
      mediaBelowHtml = `<img src="${escapeHtml(msg.media_url)}" class="msg-media-img" alt="صورة" onclick="window.open(this.src,'_blank')" />`;
    } else if (msg.msg_type === 'audio' && msg.media_url) {
      mediaBelowHtml = `<audio controls src="${escapeHtml(msg.media_url)}" class="msg-audio-player"></audio>`;
    } else if (msg.msg_type === 'sticker') {
      const rawStk = String(msg.content || '✨').trim();
      const matchedStk = ANIMATED_STICKERS.find((s) => rawStk.startsWith(s.glyph) || rawStk.includes(s.label));
      if (matchedStk?.svg) {
        inlineTextHtml = `<span class="msg-sticker-pill msg-sticker-svg-pill"><span class="sticker-anim-float stk-svg-inline">${matchedStk.svg}</span><span>${escapeHtml(matchedStk.label)}</span></span>`;
      } else {
        inlineTextHtml = `<span class="msg-sticker-pill">${escapeHtml(rawStk)}</span>`;
      }
    } else {
      const rendered = renderMessageTextWithMentions(msg.content, msg);
      hasMention = rendered.hasMention;
      const prefix = isQuizBotMsg
        ? '<span class="quiz-bot-badge">مسابقة</span>'
        : isWelcomeBotMsg
          ? `<span class="welcome-bot-badge">${isVirtualSender ? 'تفاعل ذكي' : 'مساعد ذكي'}</span>`
          : isAdminNotice
            ? '<span class="admin-notice-prefix">إشعار الإدارة</span>'
            : '';
      const rawTxtColor = String(msg.text_color || '').trim();
      const stageIsDark = isCurrentStageDark();
      let readableColor = '';
      if (isAdminNotice) {
        readableColor = stageIsDark ? '#fecaca' : '#991b1b';
      } else if (!isWelcomeBotMsg) {
        if (rawTxtColor) {
          if (stageIsDark) {
            readableColor = isReadableOnDarkBg(rawTxtColor) ? escapeHtml(rawTxtColor) : '#e2e8f0';
          } else {
            readableColor = isReadableOnLightBg(rawTxtColor) ? escapeHtml(rawTxtColor) : '#0f172a';
          }
        }
      }
      const ff = `font-family:${resolveFontFamilyCss(msg.font_family || 'Cairo')};`;
      const mfs = String(msg.font_style || 'Normal');
      const fw = (mfs === 'Bold' || mfs === 'BoldItalic') ? 'font-weight:800;' : '';
      const fi = (mfs === 'Italic' || mfs === 'BoldItalic') ? 'font-style:italic;' : '';
      const colorCss = readableColor ? `color:${readableColor};` : '';
      inlineTextHtml = `<span class="msg-text-inline ${readableColor ? '' : 'msg-auto-color'}" style="${colorCss}font-size:${msgFontSize}px;${ff}${fw}${fi}">${prefix}${rendered.html}</span>`;
    }

    const useOwnerPortal = isOwnerSender && !isAdminNotice && isOwnerGalaxyVisualEnabled();
    const useGlassBubbles = Number(state.settings?.fx_glass_bubbles ?? 1) !== 0;
    const tierMeta = getRankTierMeta(msg.sender_role || 'member');
    const rankTierClass = isOwnerSender ? 'rank-tier-owner' : tierMeta.msgClass;
    const rankGlowColor = isOwnerSender ? 'rgba(251, 191, 36, 0.62)' : tierMeta.glowColor;

    row.className = `cody-msg-row ${tierMeta.tierClass}${useGlassBubbles ? ` glass-bubble-msg ${rankTierClass}` : ''}${isQuizBotMsg ? ` quiz-bot-msg-card quiz-style-${escapeHtml(quizStyleKey)}` : ''}${isWelcomeBotMsg ? ` welcome-bot-msg-card wbot-color-${escapeHtml(wbotColorKey)}` : ''}${isAdminNotice ? ' admin-notice-row' : ''}${isGift ? ' gift-msg-row' : ''}${mentionsMe ? ' mention-for-me' : ''}${useOwnerPortal ? ' owner-royal-msg-row owner-portal-card' : (isOwnerSender && !isAdminNotice ? ' owner-gold-glass-fallback' : '')}`;
    if (useGlassBubbles && !useOwnerPortal) {
      row.style.setProperty('--msg-rank-glow', rankGlowColor);
    }
    if (msg.client_msg_id) row.dataset.clientMsgId = msg.client_msg_id;
    if (msg.id) row.dataset.msgId = String(msg.id);

    const isMe = state.user && msg.sender_key === state.user.key;
    const isOwner = state.user?.role === 'site_owner';
    const isSupremeOwner = Boolean(isOwner || String(state.user?.email || '').toLowerCase() === 'a38125923@gmail.com');
    const targetObj = {
      key: msg.sender_key,
      name: msg.sender_name,
      role: msg.sender_role,
      isVirtual: isVirtualSender,
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
      nameFontStyle: msg.name_font_style || msg.font_style || 'Normal',
      nameStyleMode: msg.name_style_mode || 'solid',
      nameGradient: msg.name_gradient || 'gold_royal'
    };
    const isBotTarget = isQuizBotMsg || isWelcomeBotMsg;
    const canActOnTarget = !isMe && !isBotTarget && canManageTargetUser(targetObj);
    const canClearRoom = isOwner || state.isRoomManager || hasPerm('clear_room');
    const canDelete = Boolean(msg.id) && (isSupremeOwner || isMe || (canActOnTarget && (state.isRoomManager || hasPerm('delete_msg') || hasPerm('clear_room'))));
    const canWarn = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('mute') || hasPerm('kick') || hasPerm('ban'));
    const canMute = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('mute'));
    const canKick = canActOnTarget && (isOwner || state.isRoomManager || hasPerm('kick'));
    const canBan = canActOnTarget && (isOwner || hasPerm('ban'));
    const canRank = canActOnTarget && String(msg.sender_key || '').startsWith('user:') && (isOwner || hasPerm('set_rank'));

    const replyQuoteHtml = msg.reply_to && (msg.reply_to.senderName || msg.reply_to.content)
      ? `<div class="msg-reply-quote"><span class="msg-reply-quote-sender"><i class="fa-solid fa-reply"></i> ${escapeHtml(msg.reply_to.senderName || 'عضو')}</span><span class="msg-reply-quote-text">${escapeHtml(msg.reply_to.content || '')}</span></div>`
      : '';
    const reactionsBarHtml = renderMessageReactionsHtml(msg);
    const clickBarHtml = `
      <div class="msg-click-action-bar hidden">
        ${msg.id ? MSG_REACTION_META.map((m) => `<button type="button" class="msg-act-emoji-btn" data-react-key="${m.key}" title="${m.label}">${m.emoji}</button>`).join('') : ''}
        <button type="button" class="msg-act-pill-btn" data-bar-act="reply"><i class="fa-solid fa-reply"></i> رد</button>
        ${msg.msg_type === 'text' ? '<button type="button" class="msg-act-pill-btn" data-bar-act="copy"><i class="fa-solid fa-copy"></i> نسخ</button>' : ''}
        ${!isMe && !isBotTarget ? '<button type="button" class="msg-act-pill-btn" data-bar-act="report"><i class="fa-solid fa-flag"></i> إبلاغ</button>' : ''}
        ${isSupremeOwner && msg.id ? '<button type="button" class="msg-act-pill-btn danger" data-bar-act="delete"><i class="fa-solid fa-trash"></i> حذف</button>' : ''}
      </div>
    `;

    row.innerHTML = `
      ${useOwnerPortal ? '<span class="owner-portal-edge-dots" aria-hidden="true"></span>' : ''}
      <div class="msg-avatar-trigger" style="cursor:pointer" title="عرض البطاقة">${formatAvatarHTML(msg, '')}</div>
      <div class="msg-body-col">
        ${replyQuoteHtml}
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
                <button type="button" data-msg-act="reply"><i class="fa-solid fa-reply"></i> رد / اقتباس</button>
                ${!isMe && !isBotTarget ? '<button type="button" data-msg-act="pm"><i class="fa-solid fa-envelope"></i> رسالة خاصة</button>' : ''}
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
        ${reactionsBarHtml}
        ${clickBarHtml}
      </div>
    `;

    const openTarget = () => openQuickUserModal(targetObj);
    row.querySelector('.msg-avatar-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      openTarget();
    });
    row.querySelector('.msg-name-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      insertMention(msg.sender_name, msg.sender_key);
    });
    row.querySelector('.msg-dismiss-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      row.remove();
    });
    row.querySelectorAll('.mention-inline-badge, .mention-plain-name').forEach((badge) => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const found = findKnownUserByMention(badge.dataset.mentionName);
        if (found) openQuickUserModal(found);
        else insertMention(badge.dataset.mentionName, badge.dataset.mentionKey || null);
      });
    });

    row.querySelectorAll('[data-react-key]').forEach((rBtn) => {
      rBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        row.querySelector('.msg-click-action-bar')?.classList.add('hidden');
        row.querySelector('.msg-dots-menu')?.classList.add('hidden');
        reactToMessage(msg.id, rBtn.dataset.reactKey);
      });
    });

    const clickBar = row.querySelector('.msg-click-action-bar');
    row.addEventListener('click', (e) => {
      if (e.target.closest('button, a, img, audio, .msg-avatar-trigger, .msg-name-trigger, .mention-inline-badge, .mention-plain-name, .msg-actions-wrap, .msg-click-action-bar, .msg-reactions-bar')) {
        return;
      }
      if (!clickBar) return;
      const willShow = clickBar.classList.contains('hidden');
      $('chatFeed')?.querySelectorAll('.msg-click-action-bar').forEach((b) => b.classList.add('hidden'));
      if (willShow) clickBar.classList.remove('hidden');
    });

    // WhatsApp-style mobile touch swipe-to-reply
    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastDx = 0;
    let touchSwiping = false;
    row.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      if (e.target.closest('button, a, audio, .msg-actions-wrap, .msg-click-action-bar, .msg-reactions-bar')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchLastDx = 0;
      touchSwiping = false;
      row.classList.remove('swipe-snap-back');
    }, { passive: true });
    row.addEventListener('touchmove', (e) => {
      if (!touchStartX || !e.touches || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!touchSwiping) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          touchStartX = 0;
          return;
        }
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          touchSwiping = true;
          row.classList.add('is-swiping-reply');
        }
      }
      if (touchSwiping) {
        touchLastDx = dx;
        const clamped = Math.max(-72, Math.min(72, dx));
        row.style.transform = `translateX(${clamped}px)`;
      }
    }, { passive: true });
    const endSwipeReply = () => {
      if (!touchSwiping) {
        touchStartX = 0;
        return;
      }
      const triggered = Math.abs(touchLastDx) >= 48;
      touchSwiping = false;
      touchStartX = 0;
      touchLastDx = 0;
      row.classList.remove('is-swiping-reply');
      row.classList.add('swipe-snap-back');
      row.style.transform = '';
      if (triggered) {
        setReplyTarget(msg);
      }
    };
    row.addEventListener('touchend', endSwipeReply, { passive: true });
    row.addEventListener('touchcancel', endSwipeReply, { passive: true });

    const runDeleteMessage = async () => {
      if (!msg.id) return;
      try {
        await api(`/api/chat/messages/${encodeURIComponent(String(msg.id))}?roomId=${encodeURIComponent(String(state.currentRoom?.id || ''))}`, { method: 'DELETE' });
        state.messages = state.messages.filter((m) => String(m.id) !== String(msg.id));
        const el = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(String(msg.id))}"]`);
        if (el) el.remove();
        showToast('تم حذف الرسالة للجميع.');
      } catch (err) {
        showToast(err.message, true);
      }
    };

    clickBar?.querySelectorAll('[data-bar-act]').forEach((barBtn) => {
      barBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const act = barBtn.dataset.barAct;
        clickBar.classList.add('hidden');
        if (act === 'reply') {
          setReplyTarget(msg);
        } else if (act === 'copy') {
          try {
            await navigator.clipboard.writeText(String(msg.content || ''));
            showToast('تم نسخ نص الرسالة.');
          } catch {
            showToast('تعذر النسخ التلقائي.', true);
          }
        } else if (act === 'report') {
          try {
            await api('/api/reports', {
              method: 'POST',
              body: {
                targetName: String(msg.sender_name || 'عضو'),
                reason: `بلاغ على رسالة: ${String(msg.content || '').slice(0, 180)}`,
                roomId: state.currentRoom?.id || ''
              }
            });
            showToast('تم إرسال البلاغ للإدارة بنجاح.');
          } catch (err) {
            showToast(err.message, true);
          }
        } else if (act === 'delete') {
          await runDeleteMessage();
        }
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
          insertMention(msg.sender_name, msg.sender_key);
        } else if (act === 'reply') {
          setReplyTarget(msg);
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
          await runDeleteMessage();
        } else if (act === 'clear_room') {
          if (confirm('مسح جميع رسائل هذه الغرفة؟')) {
            try {
              await api('/api/mod/clear-room', { method: 'POST', body: { roomId: state.currentRoom?.id } });
              state.messages = [];
              renderAllMessages();
            } catch (err) {
              showToast(err.message, true);
            }
          }
        } else if (act === 'warn') {
          try {
            await api('/api/mod/warn', { method: 'POST', body: { targetKey: targetObj.key, roomId: state.currentRoom?.id } });
            showToast(`تم إرسال تحذير إلى ${targetObj.name}.`);
          } catch (err) {
            showToast(err.message, true);
          }
        } else if (act === 'mute') {
          try {
            await api('/api/mod/mute', { method: 'POST', body: { targetKey: targetObj.key, minutes: 15, roomId: state.currentRoom?.id } });
            showToast(`تم كتم ${targetObj.name} مؤقتاً (15 دقيقة).`);
          } catch (err) {
            showToast(err.message, true);
          }
        } else if (act === 'kick') {
          try {
            await api('/api/mod/kick', { method: 'POST', body: { targetKey: targetObj.key, roomId: state.currentRoom?.id } });
            showToast(`تم طرد ${targetObj.name} من الغرفة.`);
          } catch (err) {
            showToast(err.message, true);
          }
        } else if (act === 'rank') {
          openQuickUserModal(targetObj, { initialTab: 'admin' });
        } else if (act === 'ban') {
          try {
            await api('/api/mod/ban', { method: 'POST', body: { targetKey: targetObj.key, banType: 'ban' } });
            showToast(`تم حظر ${targetObj.name} نهائياً.`);
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    return row;
  }

  function renderAllMessages() {
    const feed = $('chatFeed');
    if (!feed) return;
    const maxDom = window.innerWidth <= 900 ? 90 : 150;
    const list = (state.messages || []).slice(-maxDom);
    const frag = document.createDocumentFragment();
    for (const m of list) {
      const ts = Number(m.created_at_ms) || 0;
      if (ts > (state.lastRoomMsgTs || 0)) state.lastRoomMsgTs = ts;
      frag.appendChild(createMessageRowElement(m));
    }
    feed.replaceChildren(frag);
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
      const customJoinTxt = String(payload.joinMessage || payload.text || '').trim();
      const defaultRoyalJoin = `انضم إلى الغرفه مؤسس ومالك الشات ${escapeHtml(u.name || '')} • أهلاً بك`;
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
              <span class="${isRoyal ? 'join-royal-bar' : 'join-maroon-bar'}"><i class="fa-solid ${isRoyal ? 'fa-crown' : 'fa-check'}"></i> ${isRoyal ? escapeHtml(customJoinTxt || defaultRoyalJoin) : 'انضم إلى الغرفة الآن'}</span>
            </div>
            <span class="msg-time">${formatTimeAgo(Date.now())}</span>
          </div>
        </div>
      `;
      row.querySelector('.msg-avatar-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickUserModal(u);
      });
      row.querySelector('.msg-name-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        insertMention(u.name, u.key);
      });
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
        insertMention(u.name, u.key);
      });
      card.querySelector('.user-mini-ping-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        $('usersSidePanel')?.classList.remove('open');
        insertMention(u.name, u.key);
      });
    });
  }

  // ==========================================
  // SEND MESSAGES (INSTANT OPTIMISTIC RENDERING)
  // ==========================================
  async function sendTextMessage() {
    if (state.activeMute && state.activeMute.expiresAtMs > Date.now()) {
      showToast('أنت مكتوم مؤقتاً — انتظر انتهاء العد التنازلي.', true);
      return;
    }
    if (Number(state.settings?.global_chat_mute) === 1 && state.user?.role !== 'site_owner') {
      showToast('الدردشة العامة مكتومة مؤقتاً من قبل المالك.', true);
      return;
    }
    const input = $('messageInput');
    const text = input.value.trim();
    if (!text || !state.token || !state.currentRoom) return;

    const u = state.user;
    const clientMsgId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const isAdminNotice = state.adminNoticeMode && (u.role === 'site_owner' || hasPerm('access_panel'));

    const hasValidMention = Boolean(
      state.mentionedUserId &&
      state.mentionedUserName &&
      doesInputContainCleanName(text, state.mentionedUserName)
    );
    const mentionedUserId = hasValidMention ? state.mentionedUserId : null;
    const mentionedUserName = hasValidMention ? state.mentionedUserName : '';

    // Reset mention ID & reply quote immediately on send
    state.mentionedUserId = null;
    state.mentionedUserName = '';
    const replyPayload = state.replyTo ? { ...state.replyTo } : null;
    clearReplyTarget();

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
      name_font_style: u.nameFontStyle || u.fontStyle || 'Normal',
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
      reply_to: replyPayload,
      mentioned_user_id: mentionedUserId,
      mentioned_user_name: mentionedUserName,
      created_at: new Date().toISOString(),
      created_at_ms: Date.now()
    };

    appendOrReconcileMessage(optimistic);
    input.value = '';
    if (state.adminNoticeMode) {
      state.adminNoticeMode = false;
      $('adminNoticeModePill').classList.add('hidden');
    }
    window.AsilRealtime?.setTyping(false);

    try {
      const msgPayload = {
        roomId: state.currentRoom.id,
        msgType: 'text',
        content: text,
        clientMsgId,
        isAdminNotice,
        mentionedUserId,
        mentionedUserName,
        replyTo: replyPayload
      };
      const res = typeof window.AsilRealtime?.sendMessage === 'function'
        ? await window.AsilRealtime.sendMessage(msgPayload)
        : await api('/api/chat/messages', { method: 'POST', body: msgPayload });
      const savedMsg = res?.message || res?.msg;
      if (savedMsg) appendOrReconcileMessage(savedMsg);
      if (res?.user && state.user) {
        state.user = { ...state.user, ...res.user };
        if (state.token) persistSessionState(state.user, state.token);
      }
      const rewardDelta = Number(res?.rubyReward?.delta ?? res?.rubyReward?.awarded ?? 0);
      if (rewardDelta > 0) {
        const nextCoins = res?.rubyReward?.coins ?? res?.rubyReward?.newCoins;
        if (state.user && nextCoins !== undefined) state.user.coins = Number(nextCoins) || 0;
        renderUserIdentity();
        showToast(`💎 مبروك! ربحت +${rewardDelta} روبي لتفاعلك النشط!`);
      }
    } catch (err) {
      showToast(err.message, true);
      const el = $('chatFeed').querySelector(`[data-client-msg-id="${CSS.escape(clientMsgId)}"]`);
      if (el) el.remove();
    }
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
    if (!u.statusText && liveMatch?.statusText) u.statusText = liveMatch.statusText;
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
    const isSupremeOwnerActor = Boolean(
      state.user &&
      state.user.role === 'site_owner' &&
      (state.user.isSupremeOwner || String(state.user.email || '').toLowerCase() === 'a38125923@gmail.com')
    );
    const isTargetOwner =
      u.role === 'site_owner' ||
      u.isSupremeOwner ||
      String(u.email || '').toLowerCase() === 'a38125923@gmail.com';
    const canSupremeManageMedia = Boolean(isSupremeOwnerActor && !isTargetOwner && targetUserId);
    const isTargetOwnerGalaxy = isTargetOwner && isOwnerGalaxyVisualEnabled();
    const isBotTarget =
      Boolean(u.isVirtual) ||
      u.key === 'system:welcomebot' ||
      u.key === 'system:quizbot' ||
      String(u.key || '').startsWith('virtual:');
    const isRoomOwnerSelf = Boolean(
      state.currentRoom?.owner_user_id &&
      state.user?.userId &&
      Number(state.currentRoom.owner_user_id) === Number(state.user.userId)
    );
    const roomOwnerPerms = state.currentRoom?.owner_perms || { style_bg: true, kick: true, room_ban: true, assign_roles: false };
    const allowedByImmunity = !isMe && !isBotTarget && !isTargetOwner && canManageTargetUser(u);
    const canMod = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('mute') || hasPerm('kick') || hasPerm('clear_room') || hasPerm('set_rank') || hasPerm('access_panel'));
    const canBan = allowedByImmunity && (isOwner || hasPerm('ban'));
    const canKick = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('kick') || (isRoomOwnerSelf && roomOwnerPerms.kick !== false));
    const canRoomBan = allowedByImmunity && (isOwner || hasPerm('ban') || (isRoomOwnerSelf && roomOwnerPerms.room_ban !== false));
    const canClearRoom = allowedByImmunity && (isOwner || state.isRoomManager || hasPerm('clear_room'));
    const canRank = Boolean(targetUserId) && allowedByImmunity && (isOwner || hasPerm('set_rank') || (isRoomOwnerSelf && Boolean(roomOwnerPerms.assign_roles)));
    const canGiveCoins = Boolean(targetUserId) && (isOwner || (allowedByImmunity && hasPerm('give_coins')));
    const showAdminTab = Boolean(allowedByImmunity && (canMod || canBan || canKick || canRoomBan || canClearRoom || canRank || canGiveCoins || isOwner));
    const canGift = !isMe && !isBotTarget && !state.user?.isGuest && isFeatureEnabled('feat_gifts') && isFeatureEnabled('feat_profile_gifts') && (isOwner || hasPerm('gifts'));
    const canPmTarget = !isMe && !isBotTarget && u.allowPm !== false && isFeatureEnabled('feat_pm') && (isOwner || (passesSettingRankThreshold('min_rank_pm') && hasPerm('pm')));
    const allowProfLikes = isFeatureEnabled('feat_profile_likes');
    const allowProfRating = isFeatureEnabled('feat_profile_rating');
    const allowProfMusic = isFeatureEnabled('feat_profile_music');
    const allowProfFriends = isFeatureEnabled('feat_profile_friends');
    const allowProfGifts = isFeatureEnabled('feat_profile_gifts');
    const allowProfRelations = isFeatureEnabled('feat_profile_relations');
    const allowProfWall = isFeatureEnabled('feat_profile_wall');
    const hasMusic = allowProfMusic && Boolean(u.profileMusic && String(u.profileMusic).trim());
    const musicLabelMap = {
      'preset:calm_lofi': 'أنغام هادئة',
      'preset:royal_oud': 'نغمة ملكية',
      'preset:ambient_stars': 'أوتار ليلية'
    };
    const musicLabel = hasMusic ? (musicLabelMap[u.profileMusic] || 'أغنية البروفايل (MP3)') : '';
    const { richRank, interactionRank } = computeUserRanks(u.key);
    const avgRating = !isReg ? '-' : (u.ratingCount > 0 ? (Number(u.ratingSum || 0) / Number(u.ratingCount)).toFixed(1) : '5.0');
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
    const dynFields = (state.settings?.custom_profile_fields || []).filter((f) => f && f.enabled !== false && f.label);
    const uCustomFields = (u.customFields && typeof u.customFields === 'object') ? u.customFields : {};
    const dynFieldsHtml = dynFields.map((fld) => {
      const val = String(uCustomFields[fld.id] || '').trim();
      return `<div class="info-kv-row"><span><i class="fa-solid fa-tag"></i> ${escapeHtml(fld.label)}</span><strong>${escapeHtml(val || 'غير محدد')}</strong></div>`;
    }).join('');

    const assignableRanks = canRank ? getAssignableRanksForActor() : [];
    const currentRoleObj = getRank(u.role);
    const rankSelectOptionsHtml = canRank
      ? [
          ...(assignableRanks.some((r) => r.key === u.role) ? [] : [currentRoleObj]),
          ...assignableRanks
        ].map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === u.role ? 'selected' : ''}>${r.icon && r.icon !== '⭐' ? `${escapeHtml(r.icon)} ` : ''}${escapeHtml(r.label)}</option>`).join('')
      : '';

    $('quickUserBody').innerHTML = `
      <div class="profile-luxury-card ${escapeHtml(bgEffectClass)}${isTargetOwnerGalaxy ? ' owner-black-gold-theme owner-galaxy-theme' : ''}">
        <div class="${isTargetOwnerGalaxy ? 'owner-cosmic-bg-layer' : 'profile-bg-effect-layer'}"></div>
        <div class="profile-cover-hero${u.coverUrl ? ' has-cover-img' : ''}" id="quCoverHero" style="${u.coverUrl ? `background-image:url('${escapeHtml(u.coverUrl)}');background-size:cover;background-position:center;width:100%;` : ''}">
          ${isTargetOwnerGalaxy ? '<div class="owner-cosmic-cover-vortex" aria-hidden="true"></div>' : ''}
          ${u.coverUrl ? `<img src="${escapeHtml(u.coverUrl)}" class="profile-cover-img" alt="" />` : ''}
          <div class="profile-cover-overlay"></div>
          <div class="profile-cover-top-actions cover-actions-left">
            <button type="button" class="hero-circle-glass-btn cover-close-x-btn" id="quHeroCloseBtn" title="إغلاق">✕</button>
            <button type="button" class="hero-circle-glass-btn" id="quCoverPreviewToggleBtn" title="معاينة الغلاف والبطاقة"><i class="fa-solid fa-eye"></i></button>
          </div>
          ${canSupremeManageMedia ? `
            <div class="profile-cover-top-right">
              <label for="quOwnerCoverFile" id="quOwnerUploadCoverBtn" class="hero-circle-glass-btn cover-cam-icon-btn" title="تغيير غلاف العضو" style="cursor:pointer;">
                <i class="fa-solid fa-camera"></i>
              </label>
              <button type="button" id="quOwnerCoverDelBtn" class="hero-circle-glass-btn cover-del-x-btn${u.coverUrl ? '' : ' hidden'}" title="حذف غلاف العضو">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <input type="file" id="quOwnerCoverFile" accept="image/*" class="sr-file-input" />
          ` : ''}
          <div class="profile-cover-stats-bar">
            <span class="hero-stat-pill" title="عدد زوار الملف"><i class="fa-solid fa-eye" style="color:#38bdf8;"></i> <strong id="quVisitorsCountVal">${Number(u.visitorsCount || 0)}</strong> <small>الزوار</small></span>
            ${allowProfRating && isReg ? `<span class="hero-stat-pill" title="النجوم والتقييم"><i class="fa-solid fa-star" style="color:#fbbf24;"></i> <strong id="quRatingAvg">${avgRating}</strong> <small>التقييم</small></span>` : ''}
            ${allowProfLikes && isReg ? `<button type="button" class="hero-stat-pill qu-thumbs-like-btn" id="quLikeBtn" title="إعجاب بالملف"><i class="fa-solid fa-thumbs-up" style="color:#38bdf8;"></i> <strong id="quLikesCount">${Number(u.likesCount || 0)}</strong> <small>إعجاب</small></button>` : ''}
          </div>
        </div>

        <div class="profile-centered-identity">
          <div class="profile-avatar-85-stage${isTargetOwnerGalaxy ? ' owner-cosmic-avatar-stage' : ''}">
            ${isTargetOwnerGalaxy ? '<span class="owner-avatar-cosmic-halo" aria-hidden="true"></span>' : ''}
            <span id="quAvatarRenderSlot">${formatAvatarHTML(u, 'profile-avatar-85')}</span>
            ${canSupremeManageMedia ? `
              <div class="avatar-inner-actions">
                <label for="quOwnerAvatarFile" id="quOwnerUploadAvatarBtn" class="avatar-cam-pill-btn" role="button" tabindex="0" title="تغيير صورة العضو">
                  <i class="fa-solid fa-camera"></i>
                </label>
                <button type="button" id="quOwnerAvatarDelBtn" class="avatar-inner-circle-btn danger${u.avatarUrl ? '' : ' hidden'}" title="حذف صورة العضو">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              <input type="file" id="quOwnerAvatarFile" accept="image/*" class="sr-file-input" />
            ` : ''}
          </div>
          <div class="profile-name-row-center" id="quHeaderNameRow">
            ${roleBadgeHTML(u.role, true)}
            ${formatNameHTML(u)}
          </div>
          <div class="profile-role-subtitle" id="quHeaderRoleSub">${isTargetOwnerGalaxy ? '<span class="owner-galaxy-title-pill"><i class="fa-solid fa-crown"></i> مؤسس ومالك الشات</span> ' : ''}${escapeHtml(getRank(u.role).label)} • المستوى ${Math.max(1, Number(u.level) || Number(getRank(u.role).power) || 1)} ${u.vipFamily ? `• <i class="fa-solid fa-crown"></i> ${escapeHtml(u.vipFamily)}` : ''}</div>
          ${u.statusText ? `<div class="profile-status-pill"><i class="fa-solid fa-circle-dot"></i> ${escapeHtml(u.statusText)}</div>` : ''}
          ${u.bio ? `<p class="profile-bio-line">${escapeHtml(u.bio)}</p>` : ''}
          ${hasMusic ? `
            <div class="profile-mini-music-bar">
              <button type="button" class="mini-music-play-btn" id="quMusicToggleBtn" title="تشغيل/إيقاف موسيقى البروفايل"><i class="fa-solid fa-play"></i></button>
              <span class="mini-music-eq" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="mini-music-label">${escapeHtml(musicLabel)}</span>
            </div>` : ''}
          ${allowProfRating && isReg ? `
            <div class="qu-star-rating-row" id="quStarRatingRow" title="قيّم هذا العضو">
              ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-rate-btn" data-star="${n}"><i class="fa-solid fa-star"></i></button>`).join('')}
            </div>` : ''}
          <div class="qu-quick-action-strip">
            <button type="button" class="btn-secondary btn-xs" id="quMentionBtn"><i class="fa-solid fa-bullhorn"></i> نداء</button>
            ${canPmTarget ? '<button type="button" class="btn-primary btn-xs" id="quPmBtn"><i class="fa-solid fa-envelope"></i> رسالة</button>' : ''}
            ${allowProfFriends && !isMe && !state.user?.isGuest && isReg ? '<button type="button" class="btn-secondary btn-xs" id="quFriendBtn"><i class="fa-solid fa-user-plus"></i> صداقة</button>' : ''}
            ${canGift ? '<button type="button" class="btn-primary btn-xs" style="background:#db2777" id="quGiftBtn"><i class="fa-solid fa-gift"></i> هدية</button>' : ''}
          </div>
        </div>

        <div class="profile-lower-dark-stage">
          <div class="profile-6tabs-bar" id="quTabsBar">
            <button type="button" class="qu-tab active" data-qu-tab="info"><i class="fa-solid fa-circle-info"></i><span>المعلومات</span></button>
            ${allowProfFriends && isReg ? '<button type="button" class="qu-tab" data-qu-tab="friends"><i class="fa-solid fa-user-group"></i><span>الأصدقاء</span></button>' : ''}
            ${allowProfGifts && isReg ? '<button type="button" class="qu-tab" data-qu-tab="gifts"><i class="fa-solid fa-gift"></i><span>الهدايا</span></button>' : ''}
            ${allowProfRelations && isReg ? '<button type="button" class="qu-tab" data-qu-tab="relations"><i class="fa-solid fa-heart-pulse"></i><span>العلاقات</span></button>' : ''}
            ${allowProfWall && isReg ? '<button type="button" class="qu-tab" data-qu-tab="posts"><i class="fa-solid fa-newspaper"></i><span>المنشورات</span></button>' : ''}
            ${showAdminTab
              ? '<button type="button" class="qu-tab admin-tab-pill" data-qu-tab="admin"><i class="fa-solid fa-shield-halved"></i><span>الإدارة</span></button>'
              : (isReg ? '<button type="button" class="qu-tab" data-qu-tab="more"><i class="fa-solid fa-ellipsis"></i><span>المزيد</span></button>' : '')}
          </div>

          <div class="profile-tab-content">
            <div id="quPane_info" class="qu-pane">
              <div class="rank-duo-grid">
                <div class="rank-duo-card rich rich-green">
                  <span class="rd-label"><i class="fa-solid fa-gem"></i> ترتيب الأثرياء</span>
                  <strong>${!isReg ? '-' : (richRank > 0 ? `#${richRank}` : '-')}</strong>
                </div>
                <div class="rank-duo-card interaction interaction-blue">
                  <span class="rd-label"><i class="fa-solid fa-fire"></i> ترتيب التفاعل</span>
                  <strong>${!isReg ? '-' : (interactionRank > 0 ? `#${interactionRank}` : '-')}</strong>
                </div>
              </div>
              ${u.bio ? `<div class="profile-about-card"><strong><i class="fa-solid fa-message"></i> رسالة معلوماتي</strong><p>${escapeHtml(u.bio)}</p></div>` : ''}
              <div class="info-kv-list">
                <div class="info-kv-row"><span><i class="fa-solid fa-ranking-star"></i> المستوى</span><strong>المستوى ${Math.max(1, Number(u.level) || Number(getRank(u.role).power) || 1)}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-circle-dot"></i> الحالة</span><strong>${escapeHtml(u.statusText || 'متصل')}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-cake-candles"></i> العمر</span><strong>${u.age ? escapeHtml(String(u.age)) : 'غير محدد'}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-venus-mars"></i> الجنس</span><strong>${escapeHtml(u.gender || 'غير محدد')}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-earth-asia"></i> البلد</span><strong>${escapeHtml(u.country || 'غير محدد')}</strong></div>
                <div class="info-kv-row"><span><i class="fa-solid fa-bolt"></i> نقاط التفاعل</span><strong>${Number(u.activityPoints || 0)}</strong></div>
                ${dynFieldsHtml}
              </div>
              ${isReg ? `
              <div class="copy-link-box">
                <input type="text" readonly value="${escapeHtml(profileLink)}" id="quProfileLinkInput" />
                <button type="button" class="btn-secondary btn-xs" id="quCopyLinkBtn"><i class="fa-solid fa-copy"></i> نسخ</button>
              </div>` : ''}
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
                    ${canRoomBan ? '<button type="button" class="qu-admin-grid-btn danger" id="quRoomBanBtn"><i class="fa-solid fa-door-closed"></i><span>حظر من الغرفة</span></button>' : ''}
                    ${canBan ? '<button type="button" class="qu-admin-grid-btn danger" id="quBanBtn"><i class="fa-solid fa-ban"></i><span>حظر</span></button>' : ''}
                    ${canBan ? '<button type="button" class="qu-admin-grid-btn danger" id="quXBanBtn"><i class="fa-solid fa-shield-virus"></i><span>إكس باند</span></button>' : ''}
                    ${isOwner ? `<button type="button" class="qu-admin-grid-btn info" id="quFreezeUserBtn"><i class="fa-solid fa-snowflake"></i><span>${u.isFrozen ? 'فك التجميد' : 'تجميد'}</span></button>` : ''}
                    ${isOwner ? '<button type="button" class="qu-admin-grid-btn info" id="quMoveRoomBtn"><i class="fa-solid fa-right-left"></i><span>سحب للغرفة</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn" id="quRenameUserBtn"><i class="fa-solid fa-pen"></i><span>تغيير الاسم</span></button>' : ''}
                    ${canMod ? '<button type="button" class="qu-admin-grid-btn warning" id="quClearAvatarBtn"><i class="fa-solid fa-user-xmark"></i><span>مسح الصورة</span></button>' : ''}
                    ${canGiveCoins ? '<button type="button" class="qu-admin-grid-btn ruby" id="quCoinsBtn"><i class="fa-solid fa-gem"></i><span>منح روبي</span></button>' : ''}
                    ${isOwner ? `<button type="button" class="qu-admin-grid-btn" id="quShadowMuteBtn"><i class="fa-solid fa-user-ninja"></i><span>${u.isShadowMuted ? 'فك كتم صامت' : 'كتم صامت'}</span></button>` : ''}
                    ${canMod && targetUserId ? `<button type="button" class="qu-admin-grid-btn" id="quGhostBtn"><i class="fa-solid fa-ghost"></i><span>${u.isGhosted ? 'إلغاء شبح' : 'وضع الشبح'}</span></button>` : ''}
                    ${canSupremeManageMedia ? '<button type="button" class="qu-admin-grid-btn info" id="quOwnerEmailBtn"><i class="fa-solid fa-envelope"></i><span>تغيير البريد الإلكتروني</span></button>' : ''}
                    ${canSupremeManageMedia ? '<button type="button" class="qu-admin-grid-btn warning" id="quOwnerPassBtn"><i class="fa-solid fa-key"></i><span>تغيير كلمة المرور</span></button>' : ''}
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

    if (isReg && !isMe) {
      api('/api/profile/interact', {
        method: 'POST',
        body: { targetKey: u.key, visit: true }
      }).then((visitRes) => {
        const upd = visitRes?.user || visitRes?.target;
        if (!upd) return;
        u.visitorsCount = upd.visitorsCount;
        u.likesCount = upd.likesCount;
        u.ratingSum = upd.ratingSum;
        u.ratingCount = upd.ratingCount;
        if ($('quVisitorsCountVal')) $('quVisitorsCountVal').textContent = String(upd.visitorsCount || 0);
        if ($('quLikesCount')) $('quLikesCount').textContent = String(upd.likesCount || 0);
        if ($('quRatingAvg')) {
          $('quRatingAvg').textContent = upd.ratingCount > 0 ? (Number(upd.ratingSum || 0) / Number(upd.ratingCount)).toFixed(1) : '5.0';
        }
      }).catch(() => {});
    }

    $('quHeroCloseBtn')?.addEventListener('click', () => closeModal('quickUserModal'));
    $('quCoverPreviewToggleBtn')?.addEventListener('click', () => {
      const hero = $('quCoverHero');
      const card = document.querySelector('#quickUserModal .profile-luxury-card');
      if (!hero) return;
      const clean = hero.classList.toggle('cover-preview-clean');
      card?.classList.toggle('profile-card-preview-mode', clean);
      const btn = $('quCoverPreviewToggleBtn');
      if (btn) {
        btn.classList.toggle('active', clean);
        btn.innerHTML = clean ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      }
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
      try {
        const res = await api('/api/profile/interact', { method: 'POST', body: { targetKey: u.key, like: true } });
        const upd = res?.user || res?.target;
        if (upd) {
          u.likesCount = upd.likesCount;
          if ($('quLikesCount')) $('quLikesCount').textContent = String(upd.likesCount || 0);
          [state.roomUsers, state.onlineUsers, state.persistentMembers].forEach((arr) => {
            const match = Array.isArray(arr) ? arr.find((x) => x.key === u.key) : null;
            if (match) match.likesCount = upd.likesCount;
          });
        }
        showToast('👍 تم تسجيل إعجابك بالملف!');
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
          const upd = res?.user || res?.target;
          if (upd) {
            u.ratingSum = upd.ratingSum;
            u.ratingCount = upd.ratingCount;
            const nextAvg = u.ratingCount > 0 ? (u.ratingSum / u.ratingCount).toFixed(1) : '5.0';
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
      insertMention(u.name, u.key);
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

    $('quInlineRankSaveBtn')?.addEventListener('click', async () => {
      if (!targetUserId) return;
      const newRole = $('quInlineRankSelect')?.value;
      if (!newRole) return;
      try {
        await api('/api/mod/set-role', { method: 'POST', body: { userId: targetUserId, newRole, roomId: state.currentRoom?.id } });
        u.role = newRole;
        const rk = getRank(newRole);
        if ($('quHeaderNameRow')) $('quHeaderNameRow').innerHTML = `${roleBadgeHTML(newRole, true)} ${formatNameHTML(u)}`;
        if ($('quHeaderRoleSub')) {
          $('quHeaderRoleSub').innerHTML = `${escapeHtml(rk.label)} ${u.vipFamily ? `• <i class="fa-solid fa-crown"></i> ${escapeHtml(u.vipFamily)}` : ''}`;
        }
        showToast(`تم حفظ رتبة "${u.name}" إلى ${rk.label}`);
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quWarnBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/warn', { method: 'POST', body: { targetKey: u.key, roomId: state.currentRoom?.id } });
        showToast(`تم إرسال التحذير إلى ${u.name}.`);
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quMuteBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/mute', { method: 'POST', body: { targetKey: u.key, minutes: 15, roomId: state.currentRoom?.id } });
        showToast(`تم كتم ${u.name} مؤقتاً (15 دقيقة).`);
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quUnmuteBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/mute', { method: 'POST', body: { targetKey: u.key, unmute: true, roomId: state.currentRoom?.id } });
        showToast(`تم فك الكتم عن ${u.name}.`);
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quKickBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/kick', { method: 'POST', body: { targetKey: u.key, roomId: state.currentRoom?.id } });
        showToast(`تم طرد ${u.name} من الغرفة.`);
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quRoomBanBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/room-ban', { method: 'POST', body: { roomId: state.currentRoom?.id, targetKey: u.key } });
        showToast(`تم حظر ${u.name} من الغرفة بنجاح.`);
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quClearRoomBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: '<i class="fa-solid fa-broom" style="color:#dc2626;"></i> مسح جميع رسائل الغرفة؟',
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم حذف سجل الرسائل في هذه الغرفة للجميع.</div>',
        confirmText: 'تأكيد المسح',
        danger: true,
        onConfirm: async (_box, done) => {
          try {
            await api('/api/mod/clear-room', { method: 'POST', body: { roomId: state.currentRoom?.id } });
            state.messages = [];
            renderAllMessages();
            showToast('تم مسح رسائل الغرفة.');
            done();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    $('quGhostBtn')?.addEventListener('click', async () => {
      const next = !u.isGhosted;
      try {
        await api('/api/mod/ghost', { method: 'POST', body: { targetKey: u.key, enabled: next } });
        u.isGhosted = next;
        const lbl = $('quGhostBtn')?.querySelector('span');
        if (lbl) lbl.textContent = next ? 'إلغاء شبح' : 'وضع الشبح';
        showToast(next ? 'تم تفعيل وضع الشبح.' : 'تم إلغاء وضع الشبح.');
      } catch (err) {
        showToast(err.message, true);
      }
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
        onConfirm: async (_box, done) => {
          const newDisplayName = ($('quInlineRenameInput')?.value || '').trim();
          if (newDisplayName.length < 2) return showToast('أدخل اسماً من حرفين على الأقل.', true);
          try {
            await api('/api/mod/force-name', { method: 'POST', body: { userId: targetUserId, targetKey: u.key, newDisplayName } });
            u.name = newDisplayName;
            u.displayName = newDisplayName;
            if ($('quHeaderNameRow')) $('quHeaderNameRow').innerHTML = `${roleBadgeHTML(u.role, true)} ${formatNameHTML(u)}`;
            showToast(`تم تغيير الاسم إلى "${newDisplayName}".`);
            done();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    $('quClearAvatarBtn')?.addEventListener('click', () => {
      showInlinePrompt({
        title: `<i class="fa-solid fa-user-xmark" style="color:#d97706;"></i> مسح الصورة الرمزية لـ "${escapeHtml(u.name)}"؟`,
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم إزالة الصورة الشخصية والعودة للحرف الافتراضي.</div>',
        confirmText: 'مسح الصورة',
        danger: true,
        onConfirm: async (_box, done) => {
          try {
            await api('/api/mod/clear-avatar', { method: 'POST', body: { userId: targetUserId, targetKey: u.key } });
            u.avatarUrl = '';
            const slot = $('quAvatarRenderSlot');
            if (slot) slot.innerHTML = formatAvatarHTML(u, 'profile-avatar-85');
            $('quOwnerAvatarDelBtn')?.classList.add('hidden');
            showToast('تم مسح صورة العضو بنجاح.');
            done();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    $('quCoinsBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      showInlinePrompt({
        title: `<i class="fa-solid fa-gem" style="color:#be123c;"></i> منح عملات / روبي لـ "${escapeHtml(u.name)}"`,
        htmlBody: `<input type="number" id="quInlineRubyAmount" value="100" min="-100000" max="100000" placeholder="الكمية (+ لإضافة أو - للخصم)" />`,
        confirmText: 'تطبيق الرصيد',
        onConfirm: async (_box, done) => {
          const amount = Number($('quInlineRubyAmount')?.value) || 0;
          if (!amount) return showToast('أدخل كمية صحيحة.', true);
          try {
            const res = await api('/api/mod/give-coins', { method: 'POST', body: { userId: targetUserId, amount } });
            u.coins = res?.coins ?? (Number(u.coins || 0) + amount);
            if ($('quHeroCoinsVal')) $('quHeroCoinsVal').textContent = `${u.coins} روبي`;
            showToast(`تم تحديث رصيد ${u.name} (${amount >= 0 ? `+${amount}` : amount} روبي).`);
            done();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    $('quXBanBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/ban', { method: 'POST', body: { targetKey: u.key, banType: 'xban' } });
        showToast('تم تنفيذ إكس باند وحظر الجهاز نهائياً.');
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quBanBtn')?.addEventListener('click', async () => {
      try {
        await api('/api/mod/ban', { method: 'POST', body: { targetKey: u.key, banType: 'ban' } });
        showToast('تم حظر العضو نهائياً.');
        closeModal('quickUserModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('quDeleteAccountBtn')?.addEventListener('click', () => {
      if (!targetUserId) return;
      showInlinePrompt({
        title: `<i class="fa-solid fa-user-slash" style="color:#dc2626;"></i> حذف حساب "${escapeHtml(u.name)}" نهائياً؟`,
        htmlBody: '<div class="muted" style="font-size:11.5px;">سيتم مسح الحساب بالكامل من قاعدة البيانات ولا يمكن التراجع.</div>',
        confirmText: 'نعم، احذف الحساب',
        danger: true,
        onConfirm: async (_box, done) => {
          try {
            await api('/api/mod/delete-account', { method: 'POST', body: { userId: targetUserId } });
            showToast('تم حذف حساب العضو نهائياً.');
            done();
            closeModal('quickUserModal');
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    if (canSupremeManageMedia) {
      const applyTargetUserMediaUpdate = (updatedUser) => {
        if (!updatedUser) return;
        u.avatarUrl = updatedUser.avatarUrl || '';
        u.coverUrl = updatedUser.coverUrl || '';
        const slot = $('quAvatarRenderSlot');
        if (slot) slot.innerHTML = formatAvatarHTML(u, 'profile-avatar-85');
        $('quOwnerAvatarDelBtn')?.classList.toggle('hidden', !u.avatarUrl);
        $('quOwnerCoverDelBtn')?.classList.toggle('hidden', !u.coverUrl);

        const coverHero = $('quCoverHero');
        if (coverHero) {
          coverHero.classList.toggle('has-cover-img', Boolean(u.coverUrl));
          coverHero.style.backgroundImage = u.coverUrl ? `url('${u.coverUrl}')` : '';
          let cImg = coverHero.querySelector('.profile-cover-img');
          if (u.coverUrl) {
            if (!cImg) {
              cImg = document.createElement('img');
              cImg.className = 'profile-cover-img';
              cImg.alt = '';
              coverHero.insertBefore(cImg, coverHero.firstChild);
            }
            cImg.src = u.coverUrl;
          } else if (cImg) {
            cImg.remove();
          }
        }
        [state.roomUsers, state.onlineUsers, state.persistentMembers].forEach((arr) => {
          const match = Array.isArray(arr) ? arr.find((x) => x.key === u.key) : null;
          if (match) {
            match.avatarUrl = u.avatarUrl;
            match.coverUrl = u.coverUrl;
          }
        });
      };

      const sendOwnerMediaUpload = async (kind, file) => {
        if (!file) return;
        try {
          const fd = new FormData();
          fd.append('kind', kind);
          fd.append('file', file);
          const res = await api(`/api/admin/users/${targetUserId}/media`, { method: 'POST', body: fd });
          applyTargetUserMediaUpdate(res?.user);
          showToast(kind === 'cover' ? 'تم تحديث صورة الغلاف للعضو.' : 'تم تحديث الصورة الشخصية للعضو.');
        } catch (err) {
          showToast(err.message, true);
        }
      };

      $('quOwnerAvatarFile')?.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (f) sendOwnerMediaUpload('avatar', f);
        e.target.value = '';
      });
      $('quOwnerCoverFile')?.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (f) sendOwnerMediaUpload('cover', f);
        e.target.value = '';
      });

      $('quOwnerAvatarDelBtn')?.addEventListener('click', async () => {
        try {
          const res = await api(`/api/admin/users/${targetUserId}/media`, {
            method: 'POST',
            body: { kind: 'avatar', mode: 'delete' }
          });
          applyTargetUserMediaUpdate(res?.user);
          showToast('تم حذف الصورة الشخصية للعضو.');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      $('quOwnerCoverDelBtn')?.addEventListener('click', async () => {
        try {
          const res = await api(`/api/admin/users/${targetUserId}/media`, {
            method: 'POST',
            body: { kind: 'cover', mode: 'delete' }
          });
          applyTargetUserMediaUpdate(res?.user);
          showToast('تم حذف غلاف العضو.');
        } catch (err) {
          showToast(err.message, true);
        }
      });

      const openSmallOwnerCredPrompt = ({ mode }) => {
        document.getElementById('quOwnerSmallCredBackdrop')?.remove();
        const isEmail = mode === 'email';
        const wrap = document.createElement('div');
        wrap.id = 'quOwnerSmallCredBackdrop';
        wrap.className = 'qu-small-prompt-backdrop';
        wrap.innerHTML = `
          <div class="qu-small-prompt-card" role="dialog" aria-modal="true">
            <div class="qu-small-prompt-head">
              <strong><i class="fa-solid ${isEmail ? 'fa-envelope' : 'fa-key'}" style="color:#fbbf24;"></i> ${isEmail ? 'تغيير البريد الإلكتروني للعضو' : 'تغيير كلمة مرور العضو'}</strong>
              <button type="button" class="btn-secondary btn-xs" id="quSmallCredCloseBtn" style="min-height:26px;padding:2px 8px;">✕</button>
            </div>
            <div class="muted" style="font-size:11.5px;">العضو: <strong>${escapeHtml(u.name || '')}</strong></div>
            <input
              type="${isEmail ? 'email' : 'password'}"
              id="quSmallCredInput"
              value="${isEmail ? escapeHtml(u.email || '') : ''}"
              placeholder="${isEmail ? 'أدخل البريد الإلكتروني الجديد...' : 'كلمة المرور الجديدة (5 أحرف فأكثر)...'}"
              autocomplete="off"
            />
            <div class="inline-row" style="justify-content:flex-end;gap:8px;">
              <button type="button" id="quSmallCredCancelBtn" class="btn-secondary btn-xs">إلغاء</button>
              <button type="button" id="quSmallCredSaveBtn" class="btn-primary btn-xs"><i class="fa-solid fa-check"></i> حفظ في Firebase</button>
            </div>
          </div>
        `;
        document.body.appendChild(wrap);
        const inp = $('quSmallCredInput');
        setTimeout(() => inp?.focus(), 40);
        const closePrompt = () => wrap.remove();
        wrap.addEventListener('click', (ev) => {
          if (ev.target === wrap) closePrompt();
        });
        $('quSmallCredCloseBtn')?.addEventListener('click', closePrompt);
        $('quSmallCredCancelBtn')?.addEventListener('click', closePrompt);
        $('quSmallCredSaveBtn')?.addEventListener('click', async () => {
          const val = (inp?.value || '').trim();
          if (isEmail) {
            if (!val || !val.includes('@')) return showToast('أدخل بريداً إلكترونياً صحيحاً.', true);
          } else if (val.length < 5) {
            return showToast('كلمة المرور يجب أن تكون 5 أحرف على الأقل.', true);
          }
          const saveBtn = $('quSmallCredSaveBtn');
          try {
            if (saveBtn) saveBtn.disabled = true;
            const payload = isEmail ? { email: val } : { password: val };
            const res = await api(`/api/admin/users/${targetUserId}`, { method: 'PUT', body: payload });
            if (isEmail && res?.user?.email) u.email = res.user.email;
            showToast(isEmail ? 'تم تحديث البريد الإلكتروني وحفظه في Firebase!' : 'تم تحديث كلمة المرور وحفظها في Firebase!');
            closePrompt();
          } catch (err) {
            showToast(err.message, true);
          } finally {
            if (saveBtn) saveBtn.disabled = false;
          }
        });
      };

      $('quOwnerEmailBtn')?.addEventListener('click', () => openSmallOwnerCredPrompt({ mode: 'email' }));
      $('quOwnerPassBtn')?.addEventListener('click', () => openSmallOwnerCredPrompt({ mode: 'password' }));
    }

    openModal('quickUserModal');
    if (hasMusic) {
      playProfileMusic(u.profileMusic, { silentAutoplayError: true, forceRestart: true });
    }

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
    if (tab === 'color') state.nameStyleMode = 'solid';
    else if (tab === 'gradient') state.nameStyleMode = 'gradient';
    else if (tab === 'neon') state.nameStyleMode = 'glow';
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
    if (!state.user) return;
    const isGuestUser = Boolean(state.user.isGuest || state.user.role === 'guest');

    try {
      const promises = [api('/api/shop/items')];
      if (!isGuestUser) promises.push(api('/api/social/state'));
      const [shopRes, socialRes] = await Promise.all(promises);
      if (shopRes) state.shopItems = { ...state.shopItems, ...shopRes };
      if (socialRes) state.social = { ...state.social, ...socialRes };
    } catch {
      // ignore fallback
    }

    const u = state.user;
    syncProfileUploadControlsForRole(u);
    $('custCoverHero')?.classList.remove('cover-preview-clean');
    document.querySelector('#customizeModal .profile-luxury-card')?.classList.remove('profile-card-preview-mode');
    if ($('custCoverPreviewToggleBtn')) {
      $('custCoverPreviewToggleBtn').classList.remove('active');
      $('custCoverPreviewToggleBtn').innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
    $('custGuestUpgradeCard')?.classList.toggle('hidden', !isGuestUser);
    $('custProfileLinkWrap')?.classList.toggle('hidden', isGuestUser);
    $('custInfoIdentityGrid')?.classList.toggle('hidden', isGuestUser);
    $('custInfoLocationGrid')?.classList.toggle('hidden', isGuestUser);
    $('custBioWrap')?.classList.toggle('hidden', isGuestUser);
    $('custBelowCoverActionsBar')?.classList.toggle('hidden', isGuestUser);
    $('custWallComposerBox')?.classList.toggle('hidden', isGuestUser);
    $('custModalFooter')?.classList.toggle('hidden', isGuestUser);

    if ($('custDisplayName')) $('custDisplayName').value = u.displayName || u.name || '';
    if ($('custVipFamily')) $('custVipFamily').value = u.vipFamily || '';
    if ($('custStatusInput')) $('custStatusInput').value = u.statusText || '';
    if ($('custBioInput')) $('custBioInput').value = u.bio || '';
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
    if ($('custNameFontStyle')) {
      $('custNameFontStyle').value = u.nameFontStyle || u.fontStyle || 'Normal';
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
    state.nameStyleMode = ['solid', 'gradient', 'glow'].includes(u.nameStyleMode) ? u.nameStyleMode : 'solid';
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

    const pmusic = String(u.profileMusic || '').trim();
    if ($('custDeleteMusicBtn')) $('custDeleteMusicBtn').classList.toggle('hidden', !pmusic);
    if ($('custMusicPreviewBtn')) $('custMusicPreviewBtn').classList.toggle('hidden', !pmusic);
    if ($('custMusicFileLabel')) {
      $('custMusicFileLabel').textContent = pmusic
        ? 'تم رفع أغنية البروفايل بنجاح (جاهزة للتشغيل تلقائياً لزوار ملفك).'
        : 'لا توجد أغنية مرفوعة حالياً (الحد الأقصى: MP3 حتى 40 ثانية و 2MB).';
    }

    const isOwner = u.role === 'site_owner';
    const canStealth = !isGuestUser && (isOwner || hasPerm('stealth'));
    $('custStealthCard')?.classList.toggle('hidden', !canStealth);
    if ($('custStealthToggle')) $('custStealthToggle').checked = Boolean(u.isStealth);

    // Cover hero & live rank cards (الزوار | التقييم | الإعجابات)
    if ($('custVisitorsCountVal')) $('custVisitorsCountVal').textContent = String(u.visitorsCount || 0);
    if ($('custLikesCountVal')) $('custLikesCountVal').textContent = String(u.likesCount || 0);
    const avg = u.ratingCount > 0 ? (Number(u.ratingSum || 0) / Number(u.ratingCount)).toFixed(1) : '5.0';
    if ($('custRatingAvgVal')) $('custRatingAvgVal').textContent = isGuestUser ? '-' : avg;

    const { interactionRank, richRank } = computeUserRanks(u.key);
    if ($('custInteractionRankNum')) $('custInteractionRankNum').textContent = isGuestUser ? '-' : (interactionRank > 0 ? `#${interactionRank}` : '-');
    if ($('custRichRankNum')) $('custRichRankNum').textContent = isGuestUser ? '-' : (richRank > 0 ? `#${richRank}` : '-');
    if ($('custProfileLinkInput')) $('custProfileLinkInput').value = isGuestUser ? '' : `${window.location.origin}/?profile=${encodeURIComponent(u.key)}`;

    const refBox = $('custReferralBox');
    if (refBox) {
      if (!isGuestUser && u.userId) {
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

    // Friends & Gifts tab
    const friends = isGuestUser ? [] : (state.social.friends || []);
    if ($('custFriendsList')) {
      $('custFriendsList').innerHTML = friends.length
        ? friends.map((f) => `
            <div class="admin-list-card">
              <div><strong>${escapeHtml(f.friend_name)}</strong><div class="muted">${f.status === 'accepted' ? 'صديق' : 'طلب معلق'}</div></div>
              <button type="button" class="btn-secondary btn-xs cust-fr-pm" data-fk="${escapeHtml(f.friend_key)}" data-fn="${escapeHtml(f.friend_name)}">مراسلة</button>
            </div>
          `).join('')
        : `<div class="muted" style="text-align:center;padding:12px;">${isGuestUser ? 'سجّل عضوية دائمة لإضافة الأصدقاء.' : 'لا يوجد أصدقاء مضافون بعد.'}</div>`;
      $('custFriendsList').querySelectorAll('.cust-fr-pm').forEach((b) => {
        b.addEventListener('click', () => {
          closeModal('customizeModal');
          openSocialModal('pm', { key: b.dataset.fk, name: b.dataset.fn });
        });
      });
    }

    $('custCoinsBalance').textContent = String(u.coins || 0);
    $('custGiftsReceivedCount').textContent = String(u.giftsReceived || 0);
    $('custGiftsSentCount').textContent = String(u.giftsSent || 0);
    $('custActivityPoints').textContent = String(u.activityPoints || 0);
    const recList = isGuestUser ? [] : (state.social.myGifts?.received || []);
    $('custReceivedGiftsList').innerHTML = recList.length
      ? recList.map((g) => `
          <div class="gift-card">
            <div class="gift-emoji-big">${escapeHtml(g.gift_emoji || '🎁')}</div>
            <strong>${escapeHtml(g.gift_name)}</strong>
            <span class="muted">من: ${escapeHtml(g.from_name)}</span>
          </div>
        `).join('')
      : '<div class="muted">لم تستلم هدايا بعد.</div>';

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
      const myPosts = isGuestUser ? [] : (state.social.wallPosts || []).filter((p) => p.author_key === u.key);
      $('custUserPostsList').innerHTML = myPosts.length
        ? myPosts.map((p) => `
            <div class="news-card">
              <div><strong>${escapeHtml(p.author_name)}</strong></div>
              <p style="margin-top:4px;">${escapeHtml(p.content)}</p>
              <span class="muted"><i class="fa-solid fa-heart"></i> ${p.likes_count || 0}</span>
            </div>
          `).join('')
        : `<div class="muted" style="text-align:center;padding:10px;">${isGuestUser ? 'النشر على الجدار متاح للأعضاء المسجلين فقط.' : 'لم تنشر منشورات على حائطك بعد.'}</div>`;
    }

    // Global Profile Feature Toggles + Total UI Concealment Gating
    const featLikes = isFeatureEnabled('feat_profile_likes');
    const featRating = isFeatureEnabled('feat_profile_rating') && !isGuestUser;
    const featMusic = isFeatureEnabled('feat_profile_music');
    const featFriends = isFeatureEnabled('feat_profile_friends') && !isGuestUser;
    const featGifts = isFeatureEnabled('feat_profile_gifts') && !isGuestUser;
    const featRelations = isFeatureEnabled('feat_profile_relations') && !isGuestUser;
    const featWall = isFeatureEnabled('feat_profile_wall') && !isGuestUser;

    const canChangeName = !isGuestUser && (isOwner || hasPerm('change_name'));
    const canAddons = !isGuestUser && (isOwner || hasPerm('use_addons'));
    const canAvatar = !isGuestUser && (isOwner || passesSettingRankThreshold('min_rank_avatar', 'member'));
    const canCover = !isGuestUser && (isOwner || passesSettingRankThreshold('min_rank_cover', 'member'));
    const canBgEff = canAddons && passesSettingRankThreshold('min_rank_bg_effect', 'member');
    const canMusic = !isGuestUser && featMusic && (isOwner || (hasPerm('profile_music') && passesSettingRankThreshold('min_rank_music', 'member')));
    const canNameStyle = !isGuestUser && (isOwner || passesSettingRankThreshold('min_rank_name_style', 'member'));
    const canMsgStyle = !isGuestUser && (isOwner || passesSettingRankThreshold('min_rank_msg_style', 'member'));

    // Total concealment: hide unavailable fields, buttons, and tabs instead of disabling
    $('custDisplayNameWrap')?.classList.toggle('hidden', !canChangeName);
    $('custUploadAvatarBtn')?.classList.toggle('hidden', !canAvatar);
    $('custDeleteAvatarBtn')?.classList.toggle('hidden', !canAvatar || !u.avatarUrl);
    $('custUploadCoverBtn')?.classList.toggle('hidden', !canCover);
    $('custDeleteCoverBtn')?.classList.toggle('hidden', !canCover || !u.coverUrl);

    $('custProfileMusicSection')?.classList.toggle('hidden', !canMusic);
    $('custMiniMusicPlayer')?.classList.toggle('hidden', !canMusic);

    $('nameStyleSubTabs')?.classList.toggle('hidden', !canNameStyle);
    $('nameColorSwatches')?.classList.toggle('hidden', !canNameStyle);
    ['color', 'gradient', 'neon', 'bg'].forEach((t) => {
      if (!canNameStyle) $(`nameStylePane_${t}`)?.classList.add('hidden');
    });
    $('custNameFontStyleWrap')?.classList.toggle('hidden', !canNameStyle);
    $('custNameFontSizeWrap')?.classList.toggle('hidden', !canNameStyle);
    $('custNameAnimSection')?.classList.toggle('hidden', !canNameStyle);

    $('custTextColorWrap')?.classList.toggle('hidden', !canMsgStyle);
    $('custFontFamilyWrap')?.classList.toggle('hidden', !canMsgStyle);
    $('custMsgFontStyleWrap')?.classList.toggle('hidden', !canMsgStyle);
    $('custFontSizeWrap')?.classList.toggle('hidden', !canMsgStyle);
    $('custFontColorsGrid')?.classList.toggle('hidden', !canMsgStyle);
    $('custFontStylesGrid')?.classList.toggle('hidden', !canNameStyle && !canMsgStyle);
    $('custFontSizesGrid')?.classList.toggle('hidden', !canNameStyle && !canMsgStyle);
    $('custNameStyleSection')?.classList.toggle('hidden', !canNameStyle && !canMsgStyle);

    $('custAddonsLockNotice')?.classList.add('hidden');
    $('custVipWingsToggle')?.closest('label')?.classList.toggle('hidden', !canAddons);
    const bgSubhead = $('custBgEffectsGrid')?.previousElementSibling;
    if (bgSubhead?.classList?.contains('unified-section-subhead')) {
      bgSubhead.classList.toggle('hidden', !canBgEff);
    }
    $('custBgEffectsGrid')?.classList.toggle('hidden', !canBgEff);
    const shineSubhead = $('custShineGrid')?.previousElementSibling;
    if (shineSubhead?.classList?.contains('unified-section-subhead')) {
      shineSubhead.classList.toggle('hidden', !canAddons);
    }
    $('custShineGrid')?.classList.toggle('hidden', !canAddons);
    $('custNameplatesGrid')?.classList.toggle('hidden', !canAddons);

    const showAppearanceTab = !isGuestUser && (canNameStyle || canMsgStyle || canMusic);
    const showFramesTab = !isGuestUser;
    $('custLikesStatPill')?.classList.toggle('hidden', !featLikes);
    $('custRatingStatPill')?.classList.toggle('hidden', !featRating);
    document.querySelector('#customizeModal .cust-tab[data-cust-tab="appearance"]')?.classList.toggle('hidden', !showAppearanceTab);
    document.querySelector('#customizeModal .cust-tab[data-cust-tab="frames_bg"]')?.classList.toggle('hidden', !showFramesTab);
    document.querySelector('#customizeModal .cust-tab[data-cust-tab="friends_gifts"]')?.classList.toggle('hidden', !(featFriends || featGifts || featRelations));
    document.querySelector('#customizeModal .cust-tab[data-cust-tab="posts"]')?.classList.toggle('hidden', !featWall);
    document.querySelector('#customizeModal .cust-tab[data-cust-tab="account_privacy"]')?.classList.toggle('hidden', isGuestUser);

    if ($('saveCustomizeBtn')) {
      $('saveCustomizeBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ جميع التغييرات';
    }

    const dynWrap = $('custDynamicProfileFieldsWrap');
    if (dynWrap) {
      const enabledDynFields = isGuestUser
        ? []
        : (state.settings?.custom_profile_fields || []).filter((f) => f && f.enabled !== false && f.label);
      const uCustom = (u.customFields && typeof u.customFields === 'object') ? u.customFields : {};
      if (enabledDynFields.length) {
        dynWrap.classList.remove('hidden');
        dynWrap.innerHTML = enabledDynFields.map((fld) => `
          <div>
            <label class="muted">${escapeHtml(fld.label)}</label>
            <input type="text" class="cust-dynamic-field-inp" data-field-id="${escapeHtml(fld.id)}" value="${escapeHtml(uCustom[fld.id] || '')}" placeholder="${escapeHtml(fld.placeholder || fld.label)}" maxlength="120" />
          </div>
        `).join('');
      } else {
        dynWrap.innerHTML = '';
        dynWrap.classList.add('hidden');
      }
    }

    renderCustomizeAddonsGrids(canAddons, canBgEff);
    const initialModeTab = state.nameStyleMode === 'gradient' ? 'gradient' : (state.nameStyleMode === 'glow' ? 'neon' : (state.activeNameStyleTab || 'color'));
    if (canNameStyle) switchNameStyleTab(initialModeTab);

    let resolvedTab = normalizeCustomizeTabKey(initialTab);
    if (
      (resolvedTab === 'appearance' && !showAppearanceTab) ||
      (resolvedTab === 'frames_bg' && !showFramesTab) ||
      (resolvedTab === 'friends_gifts' && !(featFriends || featGifts || featRelations)) ||
      (resolvedTab === 'posts' && !featWall) ||
      (resolvedTab === 'account_privacy' && isGuestUser)
    ) {
      resolvedTab = 'info';
    }
    switchCustomizeTab(resolvedTab);
    updateCustomizePreview();
    openModal('customizeModal');
    if ((initialTab === 'options' || initialTab === 'appearance') && showAppearanceTab) {
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

    if ($('custBgEffectsGrid')) {
      $('custBgEffectsGrid').innerHTML = bgHtml;
      $('custBgEffectsGrid').querySelectorAll('.pick-bg-effect-btn').forEach((btn) => {
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
      const isFreeFrame = !f.ownerOnly && (Boolean(f.isFree) || price === 0);
      const owned = isOwnerSelf || isFreeFrame || ownedFramesList.includes(f.id);
      const canAfford = (Number(u.coins) || 0) >= price;
      return `
        <div class="addon-card store-frame-card ${u.avatarFrame === f.id ? 'active' : ''}">
          <div class="store-avatar-stage">${formatAvatarHTML({ ...u, avatarFrame: f.id }, 'lg')}</div>
          <strong style="font-size:12px;">${escapeHtml(f.label)}</strong>
          ${isFreeFrame
            ? '<span class="store-free-badge"><i class="fa-solid fa-sparkles"></i> مجاني للأعضاء</span>'
            : owned
              ? '<span class="store-owned-badge"><i class="fa-solid fa-check"></i> مملوك</span>'
              : `<span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${price} روبي</span>`}
          <div class="addon-card-actions">
            ${u.avatarFrame === f.id
              ? '<button type="button" class="btn-danger btn-xs remove-frame-btn">إزالة</button>'
              : owned
                ? `<button type="button" class="btn-primary btn-xs equip-frame-btn" data-frame-id="${escapeHtml(f.id)}">تفعيل</button>`
                : `<button type="button" class="btn-primary btn-xs buy-frame-btn" style="background:${canAfford ? '#be123c' : '#475569'};" data-frame-id="${escapeHtml(f.id)}" data-price="${price}" ${canAfford ? '' : 'disabled'}>${canAfford ? 'شراء بالروبي' : 'روبي غير كافٍ'}</button>`}
          </div>
        </div>
      `;
    }).join('');

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
          const price = Number(btn.dataset.price || 0);
          if ((Number(state.user?.coins) || 0) < price) {
            return showToast('رصيد الروبي غير كافٍ للشراء.', true);
          }
          try {
            const res = await api('/api/shop/buy', { method: 'POST', body: { type: 'frame', itemId: btn.dataset.frameId } });
            if (res?.user) state.user = res.user;
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
      nameFontStyle: $('custNameFontStyle') ? $('custNameFontStyle').value : (u.nameFontStyle || $('custFontStyle').value || 'Normal'),
      fontSize: $('custFontSize') ? Number($('custFontSize').value) : (u.fontSize || 14),
      nameFontSize: $('custNameFontSize') ? Number($('custNameFontSize').value) : (u.nameFontSize || 14),
      nameStyleMode: state.nameStyleMode || u.nameStyleMode || 'solid',
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
      hintEl.classList.add('hidden');
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
      $('custPreviewAvatarImg').src = DEFAULT_AVATAR_SVG;
      $('custPreviewAvatarImg').classList.add('hidden');
      $('custPreviewAvatarLetter').classList.remove('hidden');
      $('custPreviewAvatarLetter').textContent = (previewObj.name || 'ع').slice(0, 1);
    }
    const canAv = !u.isGuest && (isOwner || passesSettingRankThreshold('min_rank_avatar', 'member'));
    if ($('custDeleteAvatarBtn')) {
      $('custDeleteAvatarBtn').classList.toggle('hidden', !canAv || !u.avatarUrl);
    }

    if ($('custCoverImg') && $('custCoverHero')) {
      const hero = $('custCoverHero');
      if (u.coverUrl) {
        $('custCoverImg').src = u.coverUrl;
        $('custCoverImg').classList.remove('hidden');
        hero.classList.add('has-cover-img');
        hero.style.backgroundImage = `url('${u.coverUrl}')`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
        hero.style.width = '100%';
      } else {
        $('custCoverImg').src = DEFAULT_ROOM_SVG;
        $('custCoverImg').classList.add('hidden');
        hero.classList.remove('has-cover-img');
        hero.style.backgroundImage = '';
      }
      hero.querySelectorAll('.owner-cosmic-cover-vortex, .owner-galaxy-corner-seal').forEach((n) => n.remove());
      if (isOwnerGalaxy) {
        const vortex = document.createElement('div');
        vortex.className = 'owner-cosmic-cover-vortex';
        vortex.setAttribute('aria-hidden', 'true');
        hero.insertBefore(vortex, hero.firstChild);
      }
    }
    const canCov = !u.isGuest && (isOwner || passesSettingRankThreshold('min_rank_cover', 'member'));
    if ($('custDeleteCoverBtn')) {
      $('custDeleteCoverBtn').classList.toggle('hidden', !canCov || !u.coverUrl);
    }

    const card = document.querySelector('#customizeModal .profile-luxury-card');
    if (card) {
      const wasPreviewMode = card.classList.contains('profile-card-preview-mode');
      card.className = 'modal-card modal-card-md profile-luxury-card';
      if (isOwnerGalaxy) card.classList.add('owner-black-gold-theme', 'owner-galaxy-theme');
      if (u.profileBgEffect && u.profileBgEffect !== 'none') {
        card.classList.add(`bg-effect-${u.profileBgEffect}`);
      }
      if (wasPreviewMode) card.classList.add('profile-card-preview-mode');
    }
    const bgLayer = $('custBgEffectLayer');
    if (bgLayer) {
      bgLayer.className = isOwnerGalaxy ? 'owner-cosmic-bg-layer' : 'profile-bg-effect-layer';
    }

    const lvlNum = Math.max(1, Number(u.level) || Number(getRank(u.role)?.power) || 1);
    $('custPreviewNameRow').innerHTML = `${roleBadgeHTML(u.role, true)} ${formatNameHTML(previewObj)}`;
    if ($('custPreviewRoleLine')) {
      $('custPreviewRoleLine').innerHTML = isOwnerGalaxy
        ? `<span class="owner-galaxy-title-pill"><i class="fa-solid fa-crown"></i> مؤسس ومالك الشات</span> ${escapeHtml(getRank(u.role).label)} • المستوى ${lvlNum}`
        : `${escapeHtml(getRank(u.role).label)} • المستوى ${lvlNum}`;
    }
    const curStatusVal = ($('custStatusInput')?.value ?? u.statusText ?? '').trim();
    if ($('custPreviewStatus')) {
      $('custPreviewStatus').textContent = curStatusVal;
      $('custPreviewStatus').classList.toggle('hidden', !curStatusVal);
    }
    $('custPreviewBio').textContent = $('custBioInput').value || u.bio || '';

    const liveBox = $('custNameStyleLivePreview');
    if (liveBox) {
      const fontCss = resolveFontFamilyCss(previewObj.fontFamily);
      const rawTxtCol = $('custTextColor')?.value || u.textColor || '#e2e8f0';
      const txtCol = escapeHtml(isReadableOnDarkBg(rawTxtCol) ? rawTxtCol : '#e2e8f0');
      const mfs = String(previewObj.fontStyle || 'Normal');
      const fWeight = (mfs === 'Bold' || mfs === 'BoldItalic') ? '800' : '600';
      const fStyle = (mfs === 'Italic' || mfs === 'BoldItalic') ? 'italic' : 'normal';
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
    const activeMusicRef = String(u.profileMusic || '').trim();
    const musicLabels = {
      'preset:calm_lofi': 'أنغام هادئة',
      'preset:royal_oud': 'نغمة ملكية',
      'preset:ambient_stars': 'أوتار ليلية'
    };
    if ($('custMiniMusicLabel')) {
      $('custMiniMusicLabel').textContent = activeMusicRef
        ? (musicLabels[activeMusicRef] || 'أغنية البروفايل (MP3)')
        : 'أغنية البروفايل: بدون أغنية';
    }
    if ($('custMusicFileLabel')) {
      $('custMusicFileLabel').textContent = activeMusicRef
        ? 'تم رفع أغنية البروفايل بنجاح (جاهزة للتشغيل تلقائياً لزوار ملفك).'
        : 'لا توجد أغنية مرفوعة حالياً (الحد الأقصى: MP3 حتى 40 ثانية و 2MB).';
    }
    if ($('custDeleteMusicBtn')) $('custDeleteMusicBtn').classList.toggle('hidden', !activeMusicRef);
    if ($('custMusicPreviewBtn')) $('custMusicPreviewBtn').classList.toggle('hidden', !activeMusicRef);
    if ($('custMiniMusicPlayBtn')) {
      const playingThis = Boolean(activeMusicRef && state.activeMusicRef === activeMusicRef);
      $('custMiniMusicPlayBtn').innerHTML = playingThis ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
      $('custMiniMusicPlayBtn').disabled = !activeMusicRef;
    }
    if ($('custCoinsBalance')) $('custCoinsBalance').textContent = String(u.coins || 0);
    renderNameColorSwatches();
  }

  function normalizeCustomizeTabKey(rawTab) {
    const t = String(rawTab || 'info').trim();
    if (t === 'my_frames') return 'frames_bg';
    if (t === 'friends' || t === 'gifts' || t === 'relations') return 'friends_gifts';
    if (t === 'account') return 'info';
    if (t === 'options' || t === 'addons' || t === 'more') return 'appearance';
    if (t === 'privacy') return 'account_privacy';
    const valid = ['info', 'appearance', 'frames_bg', 'friends_gifts', 'posts', 'account_privacy'];
    return valid.includes(t) ? t : 'info';
  }

  function switchCustomizeTab(tab) {
    const resolved = normalizeCustomizeTabKey(tab);
    state.activeCustomizeTab = resolved;
    document.querySelectorAll('.cust-tab').forEach((b) => b.classList.toggle('active', b.dataset.custTab === resolved));
    ['info', 'appearance', 'frames_bg', 'friends_gifts', 'posts', 'account_privacy'].forEach((t) => {
      $(`custPane_${t}`)?.classList.toggle('hidden', t !== resolved);
    });
  }

  async function saveCustomizeProfile(closeAfter = true) {
    if (!state.user || state.user.isGuest) {
      return showToast('حفظ وتعديل الملف الشخصي متاح للأعضاء المسجلين فقط.', true);
    }
    try {
      const textColVal = $('custTextColor').value || '#0f172a';
      const customFields = { ...((state.user?.customFields && typeof state.user.customFields === 'object') ? state.user.customFields : {}) };
      document.querySelectorAll('#custDynamicProfileFieldsWrap .cust-dynamic-field-inp').forEach((inp) => {
        const fid = String(inp.dataset.fieldId || '').trim();
        if (fid) customFields[fid] = inp.value.trim();
      });
      const bodyPayload = {
        vipFamily: $('custVipFamily').value,
        statusText: $('custStatusInput')?.value || '',
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
        nameFontStyle: $('custNameFontStyle') ? $('custNameFontStyle').value : ($('custFontStyle').value || 'Normal'),
        fontSize: $('custFontSize') ? Number($('custFontSize').value) : 14,
        nameFontSize: $('custNameFontSize') ? Number($('custNameFontSize').value) : 14,
        nameStyleMode: state.nameStyleMode || 'solid',
        nameGradient: $('custNameGradient') ? $('custNameGradient').value : 'gold_royal',
        nameAnim: $('custNameAnim')?.value || 'none',
        nameAnimSpeed: $('custNameAnimSpeed')?.value || 'normal',
        vipWings: $('custVipWingsToggle').checked,
        customFields
      };
      if (!$('custDisplayNameWrap')?.classList.contains('hidden') && $('custDisplayName')) {
        bodyPayload.displayName = $('custDisplayName').value;
      }
      const res = await api('/api/profile/customize', {
        method: 'POST',
        body: bodyPayload
      });
      state.user = res.user;
      persistSessionState(state.user, state.token);
      syncLocalMirror();
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
            <img src="${escapeHtml(r.image_url || DEFAULT_ROOM_SVG)}" style="width:36px;height:36px;border-radius:9px;" alt="" />
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
      const isFreeFrame = !f.ownerOnly && f.id !== 'none' && (Boolean(f.isFree) || price === 0);
      const owned = isOwner || f.id === 'none' || isFreeFrame || ownedFramesList.includes(f.id);
      const canAfford = (Number(u.coins) || 0) >= price;
      return `
        <div class="addon-card store-frame-card ${isCurrent ? 'active' : ''}">
          <div class="store-avatar-stage">
            ${formatAvatarHTML({ ...u, avatarFrame: f.id }, 'lg')}
          </div>
          <strong style="font-size:12px;">${escapeHtml(f.label)}</strong>
          ${f.id === 'none'
            ? '<span class="muted" style="font-size:11px;">افتراضي مجاني</span>'
            : isFreeFrame
              ? '<span class="store-free-badge"><i class="fa-solid fa-sparkles"></i> مجاني للأعضاء</span>'
              : owned
                ? '<span class="store-owned-badge"><i class="fa-solid fa-check"></i> مملوك</span>'
                : `<span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${price} روبي</span>`}
          ${isCurrent
            ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">مفعل حالياً</button>'
            : owned
              ? `<button type="button" class="btn-primary btn-xs store-equip-btn" style="width:100%;" data-equip-type="frame" data-item-id="${escapeHtml(f.id)}">${f.id === 'none' ? 'إزالة الإطار' : 'تفعيل'}</button>`
              : `<button type="button" class="btn-primary btn-xs store-buy-frame-btn" style="width:100%;background:${canAfford ? '#be123c' : '#475569'};" data-item-id="${escapeHtml(f.id)}" data-price="${price}" ${canAfford ? '' : 'disabled'}>${canAfford ? `<i class="fa-solid fa-gem"></i> شراء بالروبي (${price})` : `<i class="fa-solid fa-lock"></i> روبي غير كافٍ (${price})`}</button>`}
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
        const isFreeFrame = !f.ownerOnly && (Boolean(f.isFree) || Number(f.price || 0) === 0);
        return isOwner || f.id === 'none' || isFreeFrame || ownedFramesList.includes(f.id);
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
            const price = Number(r.price || 0);
            const canAfford = (Number(u.coins) || 0) >= price;
            return `
              <div class="addon-card store-rank-card ${isCurrent ? 'active' : ''}">
                <div class="store-rank-badge-preview">
                  ${roleBadgeHTML(r.key, true)}
                  <span class="store-mult-pill">💎 ×${escapeHtml(String(r.rubyMultiplier || 1))} روبي</span>
                </div>
                <strong style="font-size:13.5px;">${escapeHtml(r.label)}</strong>
                <div class="muted" style="font-size:11.5px;">${escapeHtml(r.benefits || 'صلاحيات VIP متكاملة ومضاعفة ربح الروبي')}</div>
                <span class="store-price-pill"><i class="fa-solid fa-gem"></i> ${price} روبي</span>
                ${isCurrent
                  ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">رتبتك الحالية</button>'
                  : alreadyHigher
                    ? '<button type="button" class="btn-secondary btn-xs" disabled style="width:100%;">لديك رتبة أعلى</button>'
                    : `<button type="button" class="btn-primary btn-xs store-buy-rank-btn" style="width:100%;background:${canAfford ? '#7c3aed' : '#475569'};" data-rank-key="${escapeHtml(r.key)}" data-price="${price}" ${canAfford ? '' : 'disabled'}>${canAfford ? `<i class="fa-solid fa-crown"></i> ترقية الآن بالروبي (${price})` : `<i class="fa-solid fa-lock"></i> روبي غير كافٍ (${price})`}</button>`}
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

    body.innerHTML = `${lockHtml}${itemsHtml}`;

    body.querySelectorAll('.store-buy-rank-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const price = Number(btn.dataset.price || 0);
        if ((Number(state.user?.coins) || 0) < price) {
          return showToast('رصيد الروبي غير كافٍ للترقية.', true);
        }
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
        const price = Number(btn.dataset.price || 0);
        if ((Number(state.user?.coins) || 0) < price) {
          return showToast('رصيد الروبي غير كافٍ لشراء الإطار.', true);
        }
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
    body.innerHTML = `
      <div class="download-app-box">
        <button type="button" id="installPwaTriggerBtn" class="btn-primary btn-full">
          <i class="fa-solid fa-download"></i> تثبيت التطبيق الآن
        </button>
      </div>
    `;
    $('installPwaTriggerBtn')?.addEventListener('click', async () => {
      const promptEv = state.deferredInstallPrompt;
      if (promptEv) {
        promptEv.prompt();
        const choice = await promptEv.userChoice.catch(() => ({ outcome: 'dismissed' }));
        state.deferredInstallPrompt = null;
        if (choice?.outcome === 'accepted') {
          showToast('تم تثبيت التطبيق بنجاح!');
          closeModal('downloadAppModal');
        }
        return;
      }
      const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
      if (isStandalone) {
        showToast('التطبيق مثبّت ومفتوح بالفعل.');
        closeModal('downloadAppModal');
        return;
      }
      showToast('لتثبيت التطبيق من متصفحك الحالي اختر "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح.');
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
      btn.addEventListener('click', async () => {
        const newRole = btn.dataset.pickRole;
        try {
          await api('/api/mod/set-role', { method: 'POST', body: { userId: targetUserId, newRole, roomId: state.currentRoom?.id } });
          showToast(`تم تحديث رتبة "${targetUser.name}" إلى ${getRank(newRole).label}`);
          closeModal('rankPickerModal');
        } catch (err) {
          showToast(err.message, true);
        }
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
            <img src="${escapeHtml(r.image_url || DEFAULT_ROOM_SVG)}" style="width:42px;height:42px;border-radius:8px;object-fit:cover;" alt="" />
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
        api('/api/pm/read', { method: 'POST', body: { partnerKey: targetArg.key } })
          .then(() => {
            (state.social.privateMessages || []).forEach((m) => {
              if (m.from_key === targetArg.key && m.to_key === state.user?.key) m.is_read = 1;
            });
            updateFriendAndPmBadges();
          })
          .catch(() => {});
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
        const submitPm = async () => {
          const val = $('pmComposeInput')?.value.trim();
          if (!val) return;
          try {
            const res = await api('/api/pm/send', {
              method: 'POST',
              body: { toKey: targetArg.key, toName: targetArg.name, content: val }
            });
            if (res?.pm) {
              state.social.privateMessages = [res.pm, ...(state.social.privateMessages || [])];
            }
            openSlideSheetDrawer('pm', targetArg);
          } catch (err) {
            showToast(err.message, true);
          }
        };
        $('pmComposeSendBtn')?.addEventListener('click', submitPm);
        $('pmComposeInput')?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); submitPm(); }
        });
        syncChatComposerLockState();
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
  async function joinRoomWithPrompt(roomId, explicitPassword = '') {
    const rm = state.rooms.find((r) => r.id === roomId);
    const password = String(explicitPassword || '');
    if (rm && rm.hasPassword && !password && state.user?.role !== 'site_owner' && !hasPerm('manage_rooms')) {
      openSlideSheetDrawer('rooms');
      showToast(`الغرفة "${rm.name}" محمية — أدخل كلمة المرور بجانبها للدخول.`, true);
      return;
    }
    try {
      const res = await window.AsilRealtime?.switchRoom(roomId, password);
      if (res?.error) {
        showToast(res.error, true);
        return;
      }
      if (res) applyRoomJoinPayload(res);
      localStorage.setItem(ROOM_KEY, roomId);
      closeSlideSheetDrawer();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function openRoomsModal() {
    openSlideSheetDrawer('rooms');
  }

  // ==========================================
  // PROTECTED ADMIN / OWNER SCRIPT LOADER
  // ==========================================
  function ensureAdminPanelScriptLoaded() {
    if (window.AsilAdminPanel) return Promise.resolve(window.AsilAdminPanel);
    if (!state.token || !state.user || state.user.isGuest) {
      return Promise.reject(new Error('لوحة التحكم متاحة للمصرح لهم فقط.'));
    }
    const isOwner = state.user.role === 'site_owner' || Boolean(state.user.isSupremeOwner);
    const canPanel = isOwner || hasPerm('access_panel') || state.user.role === 'co_owner' || Number(getRank(state.user.role)?.power || 0) >= 14;
    if (!canPanel) {
      return Promise.reject(new Error('لوحة التحكم غير متاحة لرتبتك.'));
    }
    return new Promise((resolve, reject) => {
      const existing = document.getElementById('asilAdminPanelScript');
      if (existing) existing.remove();
      const s = document.createElement('script');
      s.id = 'asilAdminPanelScript';
      s.src = `/admin-panel.js?token=${encodeURIComponent(state.token)}`;
      s.async = false;
      s.onload = () => {
        state.adminScriptLoadedToken = state.token;
        if (window.AsilAdminPanel) resolve(window.AsilAdminPanel);
        else reject(new Error('تعذر تهيئة لوحة التحكم.'));
      };
      s.onerror = () => reject(new Error('غير مصرح بالوصول إلى لوحة التحكم.'));
      document.body.appendChild(s);
    });
  }

  async function openAdminPanel(rawTab = 'ranks_matrix', preselectRoomId = null, subOverride = null) {
    ensureAdminUiMounted();
    if (!state.user || state.user.isGuest) {
      return showToast('لوحة التحكم غير متاحة لرتبتك.', true);
    }
    try {
      const panel = await ensureAdminPanelScriptLoaded();
      const ctx = {
        state,
        api,
        showToast,
        escapeHtml,
        roleBadgeHTML,
        getRank,
        hasPerm,
        formatRemainingMmSs,
        openModal,
        closeModal,
        applySiteSettings,
        renderUserIdentity,
        showCinematicEntrance,
        syncLocalMirror,
        RANK_ICON_PRESETS,
        RANK_BADGE_STYLES,
        BUILT_IN_RANK_SVGS,
        openAdminPanel
      };
      return await panel.openModal(ctx, rawTab, preselectRoomId, subOverride);
    } catch (err) {
      showToast(err.message || 'لوحة التحكم غير متاحة.', true);
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
  // FIREBASE REAL-TIME SYNC (onSnapshot + REST)
  // ==========================================
  function applyRoomJoinPayload(data) {
    if (!data || !data.room) return;
    state.currentRoom = data.room;
    state.isRoomManager = Boolean(data.isRoomManager);
    state.canStyleRoom = Boolean(data.canStyleRoom || data.isRoomManager);
    state.roomKingKey = data.roomKingKey || null;
    if (Array.isArray(data.rooms)) state.rooms = data.rooms;
    if (Array.isArray(data.onlineUsers)) state.onlineUsers = data.onlineUsers;
    state.messages = Array.isArray(data.messages) ? data.messages : [];
    state.mics = Array.isArray(data.mics) ? data.mics : [];
    state.roomUsers = Array.isArray(data.users) ? data.users : [];
    state.ytForceVideo = false;
    state.ytLocalClosedVideoId = '';
    state.quizBotState = data.quizBot || { active: Boolean(data.room.quiz_bot_active) };
    state.typingUsers.clear();
    if (data.activeMute !== undefined) updateMutedStateUI(data.activeMute || null);
    renderTypingAvatarsBar();
    localStorage.setItem(ROOM_KEY, data.room.id);
    renderRoomBanner();
    renderMics();
    renderAllMessages();
    renderRoomUsers();
    renderUserIdentity();
    syncChatComposerLockState();
    if (data.royalEntrance && Date.now() - (state.lastRoyalEntranceShownAt || 0) > 10000) {
      state.lastRoyalEntranceShownAt = Date.now();
      showCinematicEntrance(data.royalEntrance);
    }
    syncLocalMirror();
  }

  async function handleWebRtcSignal(sig) {
    if (!sig || sig.fromKey === state.user?.key) return;
    if (sig.toKey && sig.toKey !== state.user?.key) return;
    const remoteKey = sig.fromKey;
    if (!remoteKey) return;
    try {
      if (sig.type === 'ready') {
        const pc = createPeerConnection(remoteKey);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        api('/api/chat/webrtc/signal', {
          method: 'POST',
          body: { roomId: state.currentRoom?.id, toKey: remoteKey, type: 'offer', sdp: offer, slot: sig.slot }
        }).catch(() => {});
      } else if (sig.type === 'offer' && sig.sdp) {
        const pc = createPeerConnection(remoteKey);
        await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        api('/api/chat/webrtc/signal', {
          method: 'POST',
          body: { roomId: state.currentRoom?.id, toKey: remoteKey, type: 'answer', sdp: answer }
        }).catch(() => {});
      } else if (sig.type === 'answer' && sig.sdp) {
        const pc = state.micPeers.get(remoteKey);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
      } else if (sig.type === 'ice' && sig.candidate) {
        const pc = state.micPeers.get(remoteKey);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
      }
    } catch {
      // ignore transient WebRTC errors
    }
  }

  function handleIncomingRoomMessageEffects(m, announceNew) {
    if (!m || !announceNew) return;
    if (m.is_gift) {
      showGiftCelebration({
        from_name: m.sender_name,
        to_name: m.mentioned_name || '',
        gift_name: m.content || ''
      });
      playNotificationChime('gift');
    }
    const cid = String(m.client_msg_id || '');
    if (cid.startsWith('royal_join:') && m.sender_key !== state.user?.key) {
      playNotificationChime('gift');
      showCinematicEntrance({
        key: m.sender_key,
        name: m.sender_name,
        role: m.sender_role,
        avatarUrl: m.avatar_url,
        avatarFrame: m.avatar_frame
      });
    }
    if (m.mentioned_user_id && m.mentioned_user_id === state.user?.key && m.sender_key !== state.user?.key) {
      playNotificationChime('mention');
    }
  }

  let lastSeenPmIds = new Set();
  let lastSeenNotifCount = 0;
  let lastMicForceMuteHandledAt = 0;
  let lastMicKickHandledAt = 0;

  function connectRealtime() {
    const savedRoom = state.currentRoom?.id || localStorage.getItem(ROOM_KEY) || 'general';
    state.realtimeActive = true;
    lastSeenPmIds = new Set((state.social?.privateMessages || []).map((x) => x.id));
    lastSeenNotifCount = Number(state.social?.unreadNotifCount || 0);

    window.AsilRealtime?.start({
      token: state.token,
      user: state.user,
      roomId: savedRoom,
      firebaseWebConfig: state.firebaseWebConfig,
      apiFetch: api,
      callbacks: {
        onBootstrap(data) {
          if (!data) return;
          if (data.user) {
            state.user = data.user;
            if (state.user && state.token) persistSessionState(state.user, state.token);
          }
          if (Array.isArray(data.ranks)) state.ranks = data.ranks;
          if (Array.isArray(data.emojis)) state.emojis = data.emojis;
          if (Array.isArray(data.rooms)) state.rooms = data.rooms;
          if (Array.isArray(data.onlineUsers)) state.onlineUsers = data.onlineUsers;
          if (Array.isArray(data.persistentMembers)) state.persistentMembers = data.persistentMembers;
          if (Array.isArray(data.news)) state.news = data.news;
          if (Array.isArray(data.giftsCatalog)) state.giftsCatalog = data.giftsCatalog;
          if (Array.isArray(data.framesCatalog)) state.shopItems.frames = data.framesCatalog;
          if (data.settings) applySiteSettings(data.settings, true);
          updateNotificationBadge(data.unreadNotifCount || 0);
          lastSeenNotifCount = Number(data.unreadNotifCount || 0);
          const pBadge = $('pmBadge');
          if (pBadge && typeof data.unreadPmCount === 'number') {
            pBadge.textContent = String(data.unreadPmCount);
            pBadge.classList.toggle('hidden', data.unreadPmCount === 0);
          }
          if (data.activeMute !== undefined) updateMutedStateUI(data.activeMute || null);
          applyRoomJoinPayload(data);
          syncLocalMirror(true);

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
        },
        onRoomJoined(data) {
          if (!data || !data.room) return;
          applyRoomJoinPayload(data);
        },
        onSessionPatch(patch) {
          if (!patch) return;
          state.user = state.user ? { ...state.user, ...patch } : patch;
          window.AsilRealtime?.updateUser(state.user);
          if (state.user && state.token) persistSessionState(state.user, state.token);
          renderUserIdentity();
        },
        onRoomPermissions(perms) {
          if (!perms) return;
          state.isRoomManager = Boolean(perms.isRoomManager);
          state.canStyleRoom = Boolean(perms.canStyleRoom || perms.isRoomManager);
          $('roomSettingsBtn')?.classList.toggle('hidden', !(state.isRoomManager || state.canStyleRoom));
        },
        onMessages(msgs, meta) {
          if (!meta || meta.roomId !== state.currentRoom?.id || !Array.isArray(msgs)) return;
          const prevIds = new Set((state.messages || []).map((m) => String(m.id)));
          const clearedMsg = msgs.find((m) => String(m.client_msg_id || '').startsWith('room_cleared:') && !prevIds.has(String(m.id)));
          if (clearedMsg) {
            state.messages = [clearedMsg];
            renderAllMessages();
            return;
          }
          let changed = false;
          if (meta.fromSnapshot) {
            const snapMap = new Map(msgs.map((m) => [String(m.id), m]));
            const numericIds = msgs.map((m) => Number(m.id)).filter((n) => Number.isFinite(n) && n > 0);
            const minSnapId = numericIds.length ? Math.min(...numericIds) : 0;
            const keep = [];
            for (const oldMsg of state.messages || []) {
              const sid = String(oldMsg.id || '');
              const numId = Number(sid);
              const inWindow = !msgs.length || msgs.length < 40 || (Number.isFinite(numId) && numId >= minSnapId);
              if (sid && inWindow && !snapMap.has(sid)) {
                const domEl = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(sid)}"]`);
                if (domEl) domEl.remove();
                changed = true;
                continue;
              }
              const fresh = snapMap.get(sid);
              if (fresh && JSON.stringify(oldMsg.reactions || {}) !== JSON.stringify(fresh.reactions || {})) {
                const updated = { ...oldMsg, ...fresh };
                keep.push(updated);
                const domEl = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(sid)}"]`);
                if (domEl) {
                  const wasOpen = !domEl.querySelector('.msg-click-action-bar')?.classList.contains('hidden');
                  const newRow = createMessageRowElement(updated);
                  if (wasOpen) newRow.querySelector('.msg-click-action-bar')?.classList.remove('hidden');
                  domEl.replaceWith(newRow);
                }
                changed = true;
              } else {
                keep.push(oldMsg);
              }
            }
            if (changed) state.messages = keep;
          }
          const incomingNew = msgs.filter((m) => !prevIds.has(String(m.id)));
          for (const m of incomingNew) {
            appendOrReconcileMessage(m);
            handleIncomingRoomMessageEffects(m, prevIds.size > 0);
          }
          if (incomingNew.length || changed) syncLocalMirror();
        },
        onNewMessage(m) {
          if (!m || (m.room_id && m.room_id !== state.currentRoom?.id)) return;
          if (String(m.client_msg_id || '').startsWith('room_cleared:')) {
            state.messages = [m];
            renderAllMessages();
            syncLocalMirror();
            return;
          }
          const exists = (state.messages || []).some((old) => String(old.id) === String(m.id));
          appendOrReconcileMessage(m);
          if (!exists) handleIncomingRoomMessageEffects(m, true);
          syncLocalMirror();
        },
        onRoomCleared(roomId) {
          if (roomId && roomId !== state.currentRoom?.id) return;
          state.messages = [];
          renderAllMessages();
          syncLocalMirror();
        },
        onDeltaMessages(msgs, roomId) {
          if (roomId !== state.currentRoom?.id || !Array.isArray(msgs)) return;
          const prevIds = new Set((state.messages || []).map((m) => String(m.id)));
          const clearedMsg = msgs.find((m) => String(m.client_msg_id || '').startsWith('room_cleared:') && !prevIds.has(String(m.id)));
          if (clearedMsg) {
            state.messages = [clearedMsg];
            renderAllMessages();
            return;
          }
          for (const m of msgs) {
            const isNew = !prevIds.has(String(m.id));
            appendOrReconcileMessage(m);
            if (isNew) handleIncomingRoomMessageEffects(m, true);
          }
          syncLocalMirror();
        },
        onDeletedMessages(ids, roomId) {
          if ((roomId && roomId !== state.currentRoom?.id) || !Array.isArray(ids) || !ids.length) return;
          const delSet = new Set(ids.map((x) => String(x)));
          state.messages = (state.messages || []).filter((m) => !delSet.has(String(m.id)));
          delSet.forEach((id) => {
            const el = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(id)}"]`);
            if (el) el.remove();
          });
          syncLocalMirror();
        },
        onUpdatedMessages(msgs, roomId) {
          if ((roomId && roomId !== state.currentRoom?.id) || !Array.isArray(msgs) || !msgs.length) return;
          let updatedAny = false;
          for (const upd of msgs) {
            const idStr = String(upd?.id || '');
            if (!idStr) continue;
            const idx = (state.messages || []).findIndex((m) => String(m.id) === idStr);
            if (idx !== -1) {
              state.messages[idx] = { ...state.messages[idx], ...upd };
              updatedAny = true;
            }
            const domEl = $('chatFeed')?.querySelector(`[data-msg-id="${CSS.escape(idStr)}"]`);
            if (domEl) {
              const wasOpen = !domEl.querySelector('.msg-click-action-bar')?.classList.contains('hidden');
              const fresh = createMessageRowElement(upd);
              if (wasOpen) fresh.querySelector('.msg-click-action-bar')?.classList.remove('hidden');
              domEl.replaceWith(fresh);
            }
          }
          if (updatedAny) syncLocalMirror();
        },
        onRoomUsers(users, roomKingKey) {
          const kingChanged = roomKingKey !== undefined && roomKingKey !== state.roomKingKey;
          if (roomKingKey !== undefined) state.roomKingKey = roomKingKey;
          state.roomUsers = users || [];
          renderRoomUsers();
          if (kingChanged) renderAllMessages();
        },
        onRooms(rooms) {
          state.rooms = rooms || [];
          if (state.currentRoom) {
            const fresh = state.rooms.find((r) => r.id === state.currentRoom.id);
            if (fresh) {
              state.currentRoom = fresh;
              state.quizBotState = { active: Boolean(fresh.quiz_bot_active) };
              renderRoomBanner();
              renderQuizBotRoomBar();
              renderRoomYoutubeBar();
            }
          }
          syncLocalMirror();
        },
        onRoomUpdated(fresh) {
          if (!fresh || !fresh.id) return;
          const idx = (state.rooms || []).findIndex((r) => r.id === fresh.id);
          if (idx !== -1) state.rooms[idx] = { ...state.rooms[idx], ...fresh };
          else state.rooms.push(fresh);
          if (state.currentRoom?.id === fresh.id) {
            state.currentRoom = { ...state.currentRoom, ...fresh };
            state.quizBotState = { active: Boolean(state.currentRoom.quiz_bot_active) };
            renderRoomBanner();
            renderQuizBotRoomBar();
            renderRoomYoutubeBar();
          }
          syncLocalMirror();
        },
        onGlobalOnlineUsers(list) {
          state.onlineUsers = list || [];
          renderRoomUsers();
        },
        onPresenceSnapshot(all) {
          if (!Array.isArray(all)) return;
          state.onlineUsers = all;
          const rid = state.currentRoom?.id;
          if (rid) state.roomUsers = all.filter((u) => u.roomId === rid);
          renderRoomUsers();
        },
        onPersistentMembers(list) {
          state.persistentMembers = list || [];
          renderRoomUsers();
          syncLocalMirror();
        },
        onRoomMics(roomId, slots) {
          if (state.currentRoom?.id === roomId) {
            state.mics = slots || [];
            renderMics();
          }
        },
        onTypingUsers(list, roomId) {
          if (roomId && roomId !== state.currentRoom?.id) return;
          const myKey = state.user?.key;
          state.typingUsers.clear();
          for (const t of list || []) {
            if (!t || !t.key || t.key === myKey) continue;
            state.typingUsers.set(t.key, {
              ...t,
              expiresAt: Date.now() + 4500
            });
          }
          renderTypingAvatarsBar();
        },
        onRanks(ranks) {
          state.ranks = ranks || [];
          syncLocalMirror();
          renderUserIdentity();
          renderRoomUsers();
          renderAllMessages();
        },
        onSettings(settings) {
          applySiteSettings(settings);
        },
        onEmojis(emojis) {
          state.emojis = Array.isArray(emojis) ? emojis : [];
          syncLocalMirror();
          if (!$('emojiPopover')?.classList.contains('hidden')) {
            renderEmojiPopoverGrid();
          }
        },
        onFramesCatalog(catalog) {
          if (!Array.isArray(catalog)) return;
          state.shopItems.frames = catalog;
          if (!$('storeModal')?.classList.contains('hidden')) {
            renderStoreTab(state.activeStoreTab || 'store');
          }
          if (!$('customizeModal')?.classList.contains('hidden')) {
            const isGuestUser = !state.user || state.user.isGuest;
            const isOwnerSelf = state.user?.role === 'site_owner';
            const canAddons = !isGuestUser && (isOwnerSelf || hasPerm('use_addons'));
            const canBgEff = canAddons && passesSettingRankThreshold('min_rank_bg_effect', 'member');
            renderCustomizeAddonsGrids(canAddons, canBgEff);
          }
        },
        onNotification(notif) {
          if (!notif) return;
          playNotificationChime('notif');
          const cur = Array.isArray(state.social?.notifications) ? state.social.notifications : [];
          if (!cur.some((n) => n.id && n.id === notif.id)) {
            state.social.notifications = [notif, ...cur];
          }
          lastSeenNotifCount += 1;
          updateNotificationBadge(lastSeenNotifCount);
          if (notif.body) showToast(notif.body);
          else if (notif.title) showToast(notif.title);
        },
        onSocialState(res) {
          if (!res) return;
          const pms = Array.isArray(res.privateMessages) ? res.privateMessages : [];
          const friends = Array.isArray(res.friends) ? res.friends : state.social.friends;
          const notifs = Array.isArray(res.notifications) ? res.notifications : state.social.notifications;
          for (const pm of pms) {
            if (pm && pm.id && !lastSeenPmIds.has(pm.id)) {
              lastSeenPmIds.add(pm.id);
              if (pm.from_key !== state.user?.key && Number(pm.is_read) === 0) {
                playNotificationChime('notif');
                showToast(`✉️ رسالة خاصة من ${pm.from_name}`);
                dispatchWebPush(`✉️ رسالة خاصة من ${pm.from_name}`, pm.content || '');
              }
            }
          }
          state.social.friends = friends;
          state.social.privateMessages = pms;
          state.social.notifications = notifs;
          updateFriendAndPmBadges();
          const unreadNotif = Number(res.unreadNotifCount || 0);
          if (unreadNotif > lastSeenNotifCount) {
            playNotificationChime('notif');
          }
          lastSeenNotifCount = unreadNotif;
          updateNotificationBadge(unreadNotif);
          if (state.activeSlideDrawer === 'pm' && $('slideSheetDrawer')?.classList.contains('open')) {
            openSlideSheetDrawer('pm', state.activeSlidePmTarget);
          }
        },
        onUnreadPmCount(count) {
          const pBadge = $('pmBadge');
          if (pBadge) {
            pBadge.textContent = String(count || 0);
            pBadge.classList.toggle('hidden', !count);
          }
        },
        onUnreadNotifCount(count) {
          updateNotificationBadge(count);
        },
        onUserState(st) {
          if (!st) return;
          if (st.activeMute) updateMutedStateUI(st.activeMute);
          else if (state.activeMute) updateMutedStateUI(null);
          if (state.user && typeof st.isFrozen === 'boolean' && state.user.isFrozen !== st.isFrozen) {
            state.user.isFrozen = st.isFrozen;
            syncChatComposerLockState();
            showToast(st.isFrozen ? '❄️ تم تجميد حسابك مؤقتاً (قراءة فقط).' : '🔥 تم فك التجميد عن حسابك.', st.isFrozen);
          }
          if (Number(st.micForceMuteAt) > lastMicForceMuteHandledAt) {
            const firstRun = lastMicForceMuteHandledAt === 0;
            lastMicForceMuteHandledAt = Number(st.micForceMuteAt);
            if (!firstRun) {
              state.isSelfMicMuted = Boolean(st.micForceMuted);
              if (state.localStream) {
                state.localStream.getAudioTracks().forEach((t) => {
                  t.enabled = !state.isSelfMicMuted;
                });
              }
              renderMics();
              showToast(st.micForceMuted ? 'تم كتم المايك الخاص بك من الإدارة.' : 'تم فتح المايك الخاص بك.', Boolean(st.micForceMuted));
            }
          }
          if (Number(st.micKickedAt) > lastMicKickHandledAt) {
            const firstRun = lastMicKickHandledAt === 0;
            lastMicKickHandledAt = Number(st.micKickedAt);
            if (!firstRun) {
              stopLocalMicStream();
              closeAllMicPeers();
              showToast(`تم إنزالك من المايك بواسطة ${st.micKickedBy || 'الإدارة'}.`, true);
            }
          }
        },
        onWebRtcSignal(sig) {
          handleWebRtcSignal(sig);
        },
        onBanned() {
          showBanBlockedScreen();
          logoutUser({ keepBanOverlay: true });
        },
        onKicked({ reason, banned }) {
          if (banned) {
            showBanBlockedScreen();
            logoutUser({ keepBanOverlay: true });
            return;
          }
          showToast(reason || 'تم طردك.', true);
          logoutUser();
        },
        onWarning(w) {
          playNotificationChime('mention');
          showToast(`⚠️ تحذير إداري من ${w.byName || 'الإدارة'}: ${w.reason || 'يرجى الالتزام بقوانين الغرفة'}`, true);
        },
        onGoldRain() {
          playNotificationChime('gift');
          triggerGoldRainAnimation();
        },
        onForcedRoomMove(rid) {
          if (rid && rid !== state.currentRoom?.id) joinRoomWithPrompt(rid);
        }
      }
    }).catch((err) => {
      if (err?.status === 403 && err?.banned) {
        showBanBlockedScreen();
        logoutUser({ keepBanOverlay: true });
      }
    });
  }

  function enterApp(user, token) {
    hideBanBlockedScreen();
    updateMutedStateUI(null);
    window.AsilRealtime?.stop({ keepServerPresence: true });
    state.realtimeActive = false;
    state.guestRegisterReturnToChat = false;
    state.mentionedUserId = null;
    state.mentionedUserName = '';
    $('authBackToChatBtn')?.classList.add('hidden');
    state.user = user;
    state.token = token;
    persistSessionState(user, token);
    $('authView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    connectRealtime();
  }

  function logoutUser(opts = {}) {
    const prevToken = state.token;
    if (opts?.explicit && prevToken) {
      try {
        fetch('/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${prevToken}` },
          keepalive: true
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
    stopLocalMicStream();
    closeAllMicPeers();
    updateMutedStateUI(null);
    teardownAdminUi();
    window.AsilRealtime?.stop({ keepServerPresence: false });
    state.realtimeActive = false;
    state.adminScriptLoadedToken = '';
    state.user = null;
    state.token = '';
    state.guestRegisterReturnToChat = false;
    $('authBackToChatBtn')?.classList.add('hidden');
    if (!opts?.keepBanOverlay) hideBanBlockedScreen();
    clearPersistedSession();
    $('appView').classList.add('hidden');
    $('authView').classList.remove('hidden');
  }

  function positionEmojiPopover() {
    const pop = $('emojiPopover');
    const bar = $('bottomBar') || document.querySelector('.cody-input-bar');
    if (!pop || !bar) return;
    const rect = bar.getBoundingClientRect();
    const bottomPx = Math.max(58, Math.ceil(window.innerHeight - rect.top) + 8);
    pop.style.bottom = `${bottomPx}px`;
  }

  function renderEmojiPopoverGrid() {
    const grid = $('emojiPopoverGrid');
    if (!grid) return;
    positionEmojiPopover();
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
      const isAnimEmoji = (e) => {
        const u = String(e?.image_url || '');
        return Boolean(e?.is_animated) || /\.(gif|webp|svg)(\?|$)/i.test(u) || /^data:image\/(gif|webp|svg\+xml)/i.test(u);
      };
      const animatedCustom = (state.emojis || []).filter((e) => e.image_url && isAnimEmoji(e));
      const builtinHtml = ANIMATED_STICKERS.map((st) => `
        <button type="button" class="emoji-pick-btn sticker-pick-btn" data-sticker-id="${escapeHtml(st.id)}" data-sticker-glyph="${escapeHtml(st.glyph)}" data-sticker-label="${escapeHtml(st.label)}" title="${escapeHtml(st.label)}">
          <span class="sticker-anim-float">${st.svg || st.glyph}</span>
        </button>
      `).join('');
      const customGifHtml = animatedCustom.map((e) => `
        <button type="button" class="emoji-pick-btn sticker-gif-pick-btn" data-ins="${escapeHtml(e.code)}" title="${escapeHtml(e.code)}">
          <img src="${escapeHtml(e.image_url)}" loading="lazy" decoding="async" alt="${escapeHtml(e.code)}" />
        </button>
      `).join('');
      grid.innerHTML = builtinHtml + customGifHtml;
      grid.querySelectorAll('.sticker-pick-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          if (!state.currentRoom) return;
          const payloadStr = `${b.dataset.stickerGlyph} ${b.dataset.stickerLabel}`;
          const clientMsgId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          $('emojiPopover').classList.add('hidden');
          try {
            const stkPayload = { roomId: state.currentRoom.id, msgType: 'sticker', content: payloadStr, clientMsgId };
            const res = typeof window.AsilRealtime?.sendMessage === 'function'
              ? await window.AsilRealtime.sendMessage(stkPayload)
              : await api('/api/chat/messages', { method: 'POST', body: stkPayload });
            const savedStk = res?.message || res?.msg;
            if (savedStk) appendOrReconcileMessage(savedStk);
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
      grid.querySelectorAll('.sticker-gif-pick-btn').forEach((b) => {
        b.addEventListener('click', () => {
          $('messageInput').value += `${b.dataset.ins} `;
          $('messageInput').focus();
          $('emojiPopover').classList.add('hidden');
        });
      });
      return;
    }

    if (tab === 'custom') {
      grid.innerHTML = state.emojis.length
        ? state.emojis.map((e) => `<button type="button" class="emoji-pick-btn" data-ins="${escapeHtml(e.code)}"><img src="${escapeHtml(e.image_url)}" loading="lazy" decoding="async" alt="" /></button>`).join('')
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
      openCustomizeModal('appearance');
    });

    $('dropGiftsTabBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('friends_gifts');
    });

    $('authBackToChatBtn')?.addEventListener('click', () => {
      if (state.token && state.user) {
        $('authView')?.classList.add('hidden');
        $('appView')?.classList.remove('hidden');
        state.guestRegisterReturnToChat = false;
      }
    });
    $('guestRegisterBottomBtn')?.addEventListener('click', openAuthRegisterForGuest);
    $('dropGuestRegisterBtn')?.addEventListener('click', openAuthRegisterForGuest);
    $('custGuestRegisterBtn')?.addEventListener('click', openAuthRegisterForGuest);

    $('dropLuckyBoxBtn')?.addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      claimDailyLuckyBox();
    });

    $('dropLogoutBtn').addEventListener('click', () => logoutUser({ explicit: true }));

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
      openCustomizeModal('appearance');
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
            <div class="user-row-card" style="margin-bottom:6px;cursor:pointer;" data-uk="${escapeHtml(u.key)}">
              <div class="user-row-avatar-btn" title="بطاقة العضو">${formatAvatarHTML(u, 'sm')}</div>
              <div class="user-row-info">
                <div class="user-row-name user-row-name-btn" title="اضغط لنداء العضو">${formatNameHTML(u)}</div>
                <div class="muted">${escapeHtml(u.roomName || '')}</div>
              </div>
              <button type="button" class="user-mini-ping-btn" title="نداء العضو"><i class="fa-solid fa-bullhorn"></i></button>
            </div>
          `).join('') || '<div class="muted">لا يوجد متصلون.</div>';
          $('drawerBodyContent').querySelectorAll('.user-row-card').forEach((c) => {
            const found = state.onlineUsers.find((x) => x.key === c.dataset.uk);
            if (!found) return;
            c.querySelector('.user-row-name-btn')?.addEventListener('click', (e) => {
              e.stopPropagation();
              closeMainDrawer();
              insertMention(found.name, found.key);
            });
            c.querySelector('.user-mini-ping-btn')?.addEventListener('click', (e) => {
              e.stopPropagation();
              closeMainDrawer();
              insertMention(found.name, found.key);
            });
            c.addEventListener('click', () => {
              closeMainDrawer();
              openQuickUserModal(found);
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
        else if (action === 'logout') logoutUser({ explicit: true });
      });
    });

    // Mics 1..5 click
    $('micSlotsContainer')?.addEventListener('click', async (e) => {
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
        try {
          if (act) {
            await api('/api/chat/mics/kick', { method: 'POST', body: { roomId: state.currentRoom?.id, slot } });
          } else {
            await api('/api/chat/mics/admin-mute', { method: 'POST', body: { roomId: state.currentRoom?.id, slot, muted: !cur.isAdminMuted } });
          }
        } catch (err) {
          showToast(err.message, true);
        }
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
      api('/api/chat/mics/self-mute', { method: 'POST', body: { roomId: state.currentRoom?.id, muted: state.isSelfMicMuted } }).catch(() => {});
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
    $('footerOptionsBtn')?.addEventListener('click', () => openCustomizeModal('appearance'));
    $('footerRefreshBtn')?.addEventListener('click', async () => {
      if (state.currentRoom) {
        await window.AsilRealtime?.triggerHeartbeatNow(true).catch(() => {});
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

    // Room switch, Dedicated Room Settings Modal (Full Admin + Delegated Room Owners), Night Atmosphere toggle & YouTube
    $('switchRoomsBtn')?.addEventListener('click', openRoomsModal);

    function syncRoomWpPreview(url) {
      const clean = String(url || '').trim();
      if ($('rmSettingsWpUrl')) $('rmSettingsWpUrl').value = clean;
      if ($('rmSettingsWpPreviewImg')) {
        $('rmSettingsWpPreviewImg').src = clean || DEFAULT_ROOM_SVG;
        $('rmSettingsWpPreviewImg').classList.toggle('hidden', !clean);
      }
      if ($('rmSettingsWpPlaceholder')) {
        $('rmSettingsWpPlaceholder').classList.toggle('hidden', Boolean(clean));
      }
    }

    function openRoomSettingsModal() {
      const r = state.currentRoom;
      if (!r) return;
      const isFullAdmin = state.user?.role === 'site_owner' || hasPerm('manage_rooms');
      if (!isFullAdmin && !state.canStyleRoom) {
        return showToast('ليست لديك صلاحية لتعديل نمط هذه الغرفة.', true);
      }
      if ($('rmSettingsName')) $('rmSettingsName').value = r.name || '';
      if ($('rmSettingsDesc')) $('rmSettingsDesc').value = r.description || '';
      if ($('rmSettingsTheme')) $('rmSettingsTheme').value = r.bg_theme || 'classic_light';
      if ($('rmSettingsWelcome')) $('rmSettingsWelcome').value = r.welcome_message || '';
      if ($('rmSettingsPass')) $('rmSettingsPass').value = '';
      if ($('rmSettingsMicsEnabled')) $('rmSettingsMicsEnabled').checked = r.mics_enabled !== false;
      syncRoomWpPreview(r.wallpaper_url || '');

      $('rmSettingsNameWrap')?.classList.toggle('hidden', !isFullAdmin);
      $('rmSettingsDescWrap')?.classList.toggle('hidden', !isFullAdmin);
      $('rmSettingsPassGroup')?.classList.toggle('hidden', !isFullAdmin);
      $('rmSettingsMicsWrap')?.classList.toggle('hidden', !isFullAdmin);
      $('rmSettingsAdvancedBtn')?.classList.toggle('hidden', !isFullAdmin);
      openModal('roomSettingsModal');
    }

    $('roomSettingsBtn')?.addEventListener('click', openRoomSettingsModal);
    $('rmSettingsAdvancedBtn')?.addEventListener('click', () => {
      closeModal('roomSettingsModal');
      openAdminPanel('rooms', state.currentRoom?.id || null);
    });
    $('rmSettingsWpUploadBtn')?.addEventListener('click', () => $('rmSettingsWpFile')?.click());
    $('rmSettingsWpClearBtn')?.addEventListener('click', () => syncRoomWpPreview(''));
    $('rmSettingsWpFile')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file || !state.currentRoom) return;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const up = await api(`/api/upload/wallpaper?roomId=${encodeURIComponent(state.currentRoom.id)}`, {
          method: 'POST',
          body: fd
        });
        syncRoomWpPreview(up?.url || '');
        showToast('تم رفع الخلفية؛ اضغط «حفظ إعدادات الغرفة» لتطبيقها.');
      } catch (err) {
        showToast(err.message, true);
      }
      e.target.value = '';
    });
    $('rmSettingsSaveBtn')?.addEventListener('click', async () => {
      const r = state.currentRoom;
      if (!r) return;
      const isFullAdmin = state.user?.role === 'site_owner' || hasPerm('manage_rooms');
      const bgTheme = $('rmSettingsTheme')?.value || 'classic_light';
      const welcomeMessage = $('rmSettingsWelcome')?.value?.trim() || '';
      const wallpaperUrl = $('rmSettingsWpUrl')?.value?.trim() || '';
      try {
        let res = null;
        if (isFullAdmin) {
          res = await api(`/api/admin/rooms/${encodeURIComponent(r.id)}`, {
            method: 'PUT',
            body: {
              name: $('rmSettingsName')?.value?.trim() || r.name,
              description: $('rmSettingsDesc')?.value?.trim() || '',
              bgTheme,
              welcomeMessage,
              wallpaperUrl,
              password: $('rmSettingsPass')?.value || '',
              micsEnabled: $('rmSettingsMicsEnabled')?.checked !== false
            }
          });
        } else {
          res = await api(`/api/rooms/${encodeURIComponent(r.id)}/style`, {
            method: 'PUT',
            body: {
              bgTheme,
              welcomeMessage,
              wallpaperUrl
            }
          });
        }
        if (res?.room) {
          state.currentRoom = { ...state.currentRoom, ...res.room };
          const idx = (state.rooms || []).findIndex((x) => x.id === state.currentRoom.id);
          if (idx >= 0) state.rooms[idx] = { ...state.rooms[idx], ...res.room };
          renderRoomBanner();
          renderAllMessages();
          syncLocalMirror();
        }
        closeModal('roomSettingsModal');
        showToast('تم حفظ نمط وخلفية الغرفة وتطبيقها بنجاح.');
      } catch (err) {
        showToast(err.message, true);
      }
    });

    $('toggleNightAtmosBtn')?.addEventListener('click', () => {
      const globalMode = String(state.settings?.fx_night_atmosphere || 'off');
      if (globalMode === 'off') {
        return showToast('أجواء السهرة الليلية معطلة حالياً من المالك.', true);
      }
      const currentlyOn = isNightAtmosphereActive();
      state.userNightPref = currentlyOn ? 'off' : 'on';
      localStorage.setItem('chat_night_atmos_pref', state.userNightPref);
      renderRoomBanner();
      renderAllMessages();
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
    $('micMiniYtPlayPauseBtn')?.addEventListener('click', () => {
      state.ytMicPaused = !state.ytMicPaused;
      const iframe = $('ytIframe');
      try {
        iframe?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: state.ytMicPaused ? 'pauseVideo' : 'playVideo', args: '' }),
          '*'
        );
      } catch {
        // ignore cross-origin postMessage
      }
      renderRoomYoutubeBar();
    });
    $('micMiniYtStopBtn')?.addEventListener('click', async () => {
      try {
        const res = await api('/api/chat/youtube', { method: 'POST', body: { roomId: state.currentRoom?.id, url: '', isPlaying: false } });
        if (res?.room && state.currentRoom) {
          state.currentRoom = res.room;
          renderRoomYoutubeBar();
        }
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('ytCompactCloseBtn')?.addEventListener('click', async () => {
      const r = state.currentRoom;
      if (!r) return;
      const isOnMic = (state.mics || []).some((m) => m.holderKey === state.user?.key);
      const canStopYt = Boolean(state.isRoomManager || (r.youtube_by_key && r.youtube_by_key === state.user?.key) || isOnMic);
      if (canStopYt) {
        try {
          const res = await api('/api/chat/youtube', { method: 'POST', body: { roomId: r.id, url: '', isPlaying: false } });
          if (res?.room) {
            state.currentRoom = res.room;
            renderRoomYoutubeBar();
            return;
          }
        } catch {
          // fallback to local close
        }
      }
      state.ytLocalClosedVideoId = r.youtube_video_id || '';
      renderRoomYoutubeBar();
    });
    $('roomQuizToggleBtn')?.addEventListener('click', async () => {
      if (!state.currentRoom) return;
      try {
        const res = await api('/api/chat/quiz/toggle', {
          method: 'POST',
          body: { roomId: state.currentRoom.id, enabled: !state.quizBotState?.active }
        });
        state.quizBotState = { active: Boolean(res?.active) };
        renderQuizBotRoomBar();
      } catch (err) {
        showToast(err.message, true);
      }
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
    $('ytStopBtn')?.addEventListener('click', async () => {
      try {
        const res = await api('/api/chat/youtube', { method: 'POST', body: { roomId: state.currentRoom?.id, url: '', isPlaying: false } });
        if (res?.room) {
          state.currentRoom = res.room;
          renderRoomYoutubeBar();
        }
      } catch (err) {
        showToast(err.message, true);
      }
    });

    // Global broken-image SVG fallback protection
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG' || img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      if (img.classList.contains('avatar-frame-img-overlay')) {
        img.classList.add('hidden');
        return;
      }
      if (img.id === 'roomBannerImg' || img.closest('[data-drawer-room-id]') || img.src.includes('/assets/rooms/')) {
        img.src = DEFAULT_ROOM_SVG;
        return;
      }
      if (img.id === 'authSiteLogo') {
        img.src = DEFAULT_LOGO_SVG;
        return;
      }
      img.src = DEFAULT_AVATAR_SVG;
    }, true);

    // Bottom bar & messaging
    $('cancelReplyBtn')?.addEventListener('click', clearReplyTarget);
    $('sendMsgBtn').addEventListener('click', sendTextMessage);
    $('messageInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendTextMessage();
      }
    });
    $('messageInput').addEventListener('input', () => {
      if (state.mentionedUserId && state.mentionedUserName) {
        if (!doesInputContainCleanName($('messageInput').value, state.mentionedUserName)) {
          state.mentionedUserId = null;
          state.mentionedUserName = '';
        }
      }
      window.AsilRealtime?.setTyping(true);
      clearTimeout(state.typingTimeout);
      state.typingTimeout = setTimeout(() => window.AsilRealtime?.setTyping(false), 1500);
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
        const imgPayload = { roomId: state.currentRoom?.id, msgType: 'image', mediaUrl: up.url, clientMsgId: `img_${Date.now()}` };
        const res = typeof window.AsilRealtime?.sendMessage === 'function'
          ? await window.AsilRealtime.sendMessage(imgPayload)
          : await api('/api/chat/messages', { method: 'POST', body: imgPayload });
        const savedImg = res?.message || res?.msg;
        if (savedImg) appendOrReconcileMessage(savedImg);
      } catch (err) {
        showToast(err.message, true);
      }
      e.target.value = '';
    });

    $('adminNoticeModePill').addEventListener('click', () => {
      state.adminNoticeMode = false;
      $('adminNoticeModePill').classList.add('hidden');
    });
    $('plusCustomizeTextBtn').addEventListener('click', () => {
      $('plusDropdown').classList.add('hidden');
      openCustomizeModal('appearance');
    });

    // Emoji Popover (positioned directly above bottomBar)
    $('emojiPickerBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      const pop = $('emojiPopover');
      if (!pop) return;
      const willOpen = pop.classList.contains('hidden');
      pop.classList.toggle('hidden', !willOpen);
      if (willOpen) {
        positionEmojiPopover();
        renderEmojiPopoverGrid();
      }
    });
    window.addEventListener('resize', () => {
      if (!$('emojiPopover')?.classList.contains('hidden')) positionEmojiPopover();
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
            const audPayload = { roomId: state.currentRoom?.id, msgType: 'audio', mediaUrl: up.url, clientMsgId: `aud_${Date.now()}` };
            const res = typeof window.AsilRealtime?.sendMessage === 'function'
              ? await window.AsilRealtime.sendMessage(audPayload)
              : await api('/api/chat/messages', { method: 'POST', body: audPayload });
            const savedAud = res?.message || res?.msg;
            if (savedAud) appendOrReconcileMessage(savedAud);
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
      switchCustomizeTab('appearance');
      setTimeout(() => $('custNameStyleSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    $('custQuickBgEffectsBtn')?.addEventListener('click', () => {
      switchCustomizeTab('frames_bg');
    });
    $('custOpenStoreFromFramesBtn')?.addEventListener('click', () => {
      closeModal('customizeModal');
      openStoreModal('store');
    });
    $('storeHeroCustShortcutBtn')?.addEventListener('click', () => {
      closeModal('storeModal');
      openCustomizeModal('appearance');
    });
    $('custMiniMusicPlayBtn')?.addEventListener('click', () => {
      const ref = String(state.user?.profileMusic || '').trim();
      if (!ref) {
        stopProfileMusic();
        return showToast('ارفع مقطع MP3 من التخصيص أولاً.', true);
      }
      playProfileMusic(ref);
    });
    $('custMiniMusicEditBtn')?.addEventListener('click', () => {
      switchCustomizeTab('appearance');
      setTimeout(() => $('custProfileMusicSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    });
    $('custCoverPreviewToggleBtn')?.addEventListener('click', () => {
      const hero = $('custCoverHero');
      const card = document.querySelector('#customizeModal .profile-luxury-card');
      if (!hero) return;
      const clean = hero.classList.toggle('cover-preview-clean');
      card?.classList.toggle('profile-card-preview-mode', clean);
      const btn = $('custCoverPreviewToggleBtn');
      if (btn) {
        btn.classList.toggle('active', clean);
        btn.innerHTML = clean ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      }
      showToast(clean ? 'وضع المعاينة الكاملة للغلاف والبطاقة مفعّل' : 'تمت العودة لوضع تعديل الملف الشخصي');
    });
    $('nameStyleSubTabs')?.querySelectorAll('.sub-pill-tab').forEach((b) => {
      b.addEventListener('click', () => switchNameStyleTab(b.dataset.namestyleTab));
    });
    [
      'custDisplayName', 'custStatusInput', 'custBioInput', 'custNameColor', 'custTextColor',
      'custFontFamily', 'custNameFontStyle', 'custFontStyle', 'custFontSize', 'custNameFontSize',
      'custNameGradient', 'custNameAnim', 'custNameAnimSpeed', 'custVipWingsToggle'
    ].forEach((id) => {
      $(id)?.addEventListener('input', updateCustomizePreview);
      $(id)?.addEventListener('change', updateCustomizePreview);
    });
    $('custResetTextColorBtn')?.addEventListener('click', () => {
      if ($('custTextColor')) $('custTextColor').value = isCurrentStageDark() ? '#e2e8f0' : '#0f172a';
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
    async function isGifUploadFile(file) {
      if (!file) return false;
      if (String(file.type || '').toLowerCase() === 'image/gif' || /\.gif$/i.test(file.name || '')) {
        return true;
      }
      try {
        const headerBytes = new Uint8Array(await file.slice(0, 6).arrayBuffer());
        const sig = String.fromCharCode(...headerBytes);
        return sig === 'GIF87a' || sig === 'GIF89a';
      } catch {
        return false;
      }
    }

    async function prepareProfileImageForFirebase(file, kind) {
      if (!file) return file;
      const isGif = await isGifUploadFile(file);
      if (isGif) {
        if (!canUploadAnimatedGif(state.user)) {
          throw new Error('رفع صور GIF المتحركة متاح للمالك وأعلى رتبتين فقط.');
        }
        return file;
      }
      const maxDim = kind === 'cover' ? 1200 : 400;
      const quality = kind === 'cover' ? 0.82 : 0.84;
      return new Promise((resolve) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          try {
            let w = img.naturalWidth || img.width;
            let h = img.naturalHeight || img.height;
            if (!w || !h) {
              URL.revokeObjectURL(objUrl);
              return resolve(file);
            }
            const needsResize = w > maxDim || h > maxDim;
            if (needsResize) {
              const scale = maxDim / Math.max(w, h);
              w = Math.max(1, Math.round(w * scale));
              h = Math.max(1, Math.round(h * scale));
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(objUrl);
              return resolve(file);
            }
            ctx.drawImage(img, 0, 0, w, h);
            const finalizeBlob = (blob, mimeType, ext) => {
              URL.revokeObjectURL(objUrl);
              if (!blob) return resolve(file);
              if (!needsResize && file.type === mimeType && blob.size >= file.size) {
                return resolve(file);
              }
              const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
              resolve(new File([blob], `${baseName}.${ext}`, { type: mimeType }));
            };
            canvas.toBlob((webpBlob) => {
              if (webpBlob && webpBlob.type === 'image/webp') {
                return finalizeBlob(webpBlob, 'image/webp', 'webp');
              }
              canvas.toBlob((jpegBlob) => {
                finalizeBlob(jpegBlob, 'image/jpeg', 'jpg');
              }, 'image/jpeg', quality);
            }, 'image/webp', quality);
          } catch {
            URL.revokeObjectURL(objUrl);
            resolve(file);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          resolve(file);
        };
        img.src = objUrl;
      });
    }

    $('custUploadAvatarBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if ($('custAvatarFile')?.disabled) {
        e.preventDefault();
        showToast('تغيير الصورة الشخصية مقيّد حالياً لرتبة أعلى من رتبتك.', true);
      }
    });
    $('custUploadAvatarBtn')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if ($('custAvatarFile')?.disabled) {
          showToast('تغيير الصورة الشخصية مقيّد حالياً لرتبة أعلى من رتبتك.', true);
          return;
        }
        $('custAvatarFile')?.click();
      }
    });
    $('custAvatarFile')?.addEventListener('change', async () => {
      const rawFile = $('custAvatarFile').files[0];
      if (!rawFile) return;
      try {
        const file = await prepareProfileImageForFirebase(rawFile, 'avatar');
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/avatar', { method: 'POST', body: fd });
        if (res?.user) state.user = res.user;
        else if (state.user) state.user.avatarUrl = res.url;
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(state.user));
        } catch {
          // ignore
        }
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم رفع وحفظ الصورة الشخصية في قاعدة البيانات بنجاح!');
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
    $('custUploadCoverBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      $('custCoverFile')?.click();
    });
    $('custCoverFile')?.addEventListener('change', async () => {
      const rawFile = $('custCoverFile').files[0];
      if (!rawFile) return;
      try {
        const file = await prepareProfileImageForFirebase(rawFile, 'cover');
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/cover', { method: 'POST', body: fd });
        if (res?.user) state.user = res.user;
        else if (state.user) state.user.coverUrl = res.url;
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(state.user));
        } catch {
          // ignore
        }
        updateCustomizePreview();
        showToast('تم رفع وحفظ صورة الغلاف في قاعدة البيانات بنجاح!');
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
      logoutUser({ explicit: true });
    });
    $('custMusicFile')?.addEventListener('change', async () => {
      const file = $('custMusicFile').files?.[0];
      if (!file) return;
      try {
        const isAudio = String(file.type || '').startsWith('audio/') || /\.(mp3|m4a|aac|ogg|wav)$/i.test(file.name || '');
        if (!isAudio) {
          throw new Error('يرجى اختيار ملف صوتي MP3 صالح من الجوال.');
        }
        if (file.size > 2 * 1024 * 1024) {
          throw new Error('حجم المقطع يتجاوز الحد الأقصى المسموح (2MB).');
        }
        const duration = await new Promise((resolve, reject) => {
          const objUrl = URL.createObjectURL(file);
          const probe = new Audio();
          probe.preload = 'metadata';
          probe.onloadedmetadata = () => {
            const d = Number(probe.duration);
            URL.revokeObjectURL(objUrl);
            resolve(d);
          };
          probe.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error('تعذر قراءة مدة الملف الصوتي.'));
          };
          probe.src = objUrl;
        });
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('ملف صوتي غير صالح.');
        }
        if (duration > 40) {
          throw new Error(`مدة المقطع (${Math.ceil(duration)} ثانية) تتجاوز الحد الأقصى المسموح (40 ثانية).`);
        }
        if ($('custMusicFileLabel')) $('custMusicFileLabel').textContent = 'جاري رفع وحفظ الأغنية...';
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/profile-music', { method: 'POST', body: fd });
        if (res?.user) state.user = res.user;
        else if (state.user && res?.url) state.user.profileMusic = res.url;
        persistSessionState(state.user, state.token);
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم رفع وحفظ أغنية البروفايل بنجاح!');
      } catch (err) {
        updateCustomizePreview();
        showToast(err.message || 'فشل رفع الأغنية.', true);
      } finally {
        $('custMusicFile').value = '';
      }
    });
    $('custDeleteMusicBtn')?.addEventListener('click', async () => {
      if (!confirm('حذف أغنية البروفايل الحالية؟')) return;
      try {
        stopProfileMusic();
        const res = await api('/api/profile/music', { method: 'DELETE' });
        if (res?.user) state.user = res.user;
        else if (state.user) state.user.profileMusic = '';
        persistSessionState(state.user, state.token);
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم حذف أغنية البروفايل.');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('custMusicPreviewBtn')?.addEventListener('click', () => {
      const ref = String(state.user?.profileMusic || '').trim();
      if (!ref) {
        stopProfileMusic();
        return showToast('ارفع مقطع MP3 أولاً.', true);
      }
      playProfileMusic(ref);
    });
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

    // Leaderboards & Store Tabs
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
    const canNameStyle = !isGuest && (isOwner || passesSettingRankThreshold('min_rank_name_style', 'member'));
    if (!canMsgStyle) {
      bar.classList.add('hidden');
      return;
    }
    $('inlineMsgNameCustBtn')?.classList.toggle('hidden', !canNameStyle);

    const lockNote = $('inlineMsgLockNote');
    if (lockNote) lockNote.classList.add('hidden');

    const activeColor = (u.textColor || '#e2e8f0').toLowerCase();
    if ($('inlineMsgColorPicker')) {
      $('inlineMsgColorPicker').value = /^#[0-9a-f]{6}$/i.test(activeColor) ? activeColor : '#e2e8f0';
      $('inlineMsgColorPicker').disabled = false;
    }

    const swatchesEl = $('inlineMsgColorSwatches');
    if (swatchesEl) {
      swatchesEl.innerHTML = NAME_COLOR_SWATCHES.slice(0, 12).map((hex) => {
        const isAct = activeColor === hex.toLowerCase();
        return `<button type="button" class="inline-swatch-btn${isAct ? ' active' : ''}" data-msg-color="${hex}" style="background:${hex};" title="${hex}">${isAct ? '✓' : ''}</button>`;
      }).join('');
      swatchesEl.querySelectorAll('.inline-swatch-btn').forEach((b) => {
        b.addEventListener('click', () => saveInlineMsgStyle({ textColor: b.dataset.msgColor }));
      });
    }

    const curSize = Math.max(12, Math.min(20, Number(u.fontSize) || 14));
    bar.querySelectorAll('[data-msg-size]').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.msgSize) === curSize);
      b.disabled = false;
    });
    const curStyle = u.fontStyle || 'Normal';
    bar.querySelectorAll('[data-msg-style]').forEach((b) => {
      b.classList.toggle('active', b.dataset.msgStyle === curStyle);
      b.disabled = false;
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
    if (state.token) {
      $('authView')?.classList.add('hidden');
    }
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
    hydrateLocalMirrorOnBoot();
    refreshLucideIcons();

    const idbSess = await readSessionFromIdb();
    if (!state.token && idbSess?.token) {
      state.token = idbSess.token;
      persistSessionState(idbSess.user || null, state.token);
    }

    let cachedUser = null;
    try {
      cachedUser = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null') || idbSess?.user || null;
    } catch {
      cachedUser = idbSess?.user || null;
    }

    // Prevent login screen flash on refresh when an active persistent session exists
    if (state.token) {
      $('authView')?.classList.add('hidden');
      if (cachedUser && cachedUser.key) {
        state.user = cachedUser;
        $('appView')?.classList.remove('hidden');
        renderUserIdentity();
      }
    }
    try {
      const pub = await api('/api/settings/public');
      if (pub?.settings) applySiteSettings(pub.settings);
      if (pub?.firebaseWebConfig) state.firebaseWebConfig = pub.firebaseWebConfig;
    } catch {
      // ignore
    }

    const restoreSessionWithRetry = async () => {
      if (!state.token) return false;
      try {
        const me = await api('/api/me');
        if (me?.user) {
          const effectiveToken = me.token || state.token;
          enterApp(me.user, effectiveToken);
          return true;
        }
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          clearPersistedSession();
          state.token = '';
          state.user = null;
          $('appView')?.classList.add('hidden');
          if (err?.banned) {
            showBanBlockedScreen();
          } else if (err?.status === 403 && err?.message) {
            showToast(err.message, true);
            $('authView')?.classList.remove('hidden');
          } else {
            $('authView')?.classList.remove('hidden');
          }
          return false;
        }
        // Transient error: keep session active & silently retry without showing disconnect banner
        if (cachedUser && cachedUser.key) {
          enterApp(cachedUser, state.token);
        }
        setTimeout(() => {
          if (state.token && !state.realtimeActive) restoreSessionWithRetry();
        }, 4500);
      }
      return false;
    };

    if (state.token) {
      await restoreSessionWithRetry();
    } else {
      $('authView')?.classList.remove('hidden');
    }
    setInterval(() => {
      if (state.currentRoom && state.settings?.fx_night_atmosphere === 'auto' && state.userNightPref === 'follow') {
        renderRoomBanner();
      }
    }, 60000);
  }

  bootstrap();
})();
