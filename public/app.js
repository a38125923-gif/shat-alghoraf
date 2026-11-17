(() => {
  const TOKEN_KEY = 'arabic_chat_token_v3';
  const ROOM_KEY = 'arabic_chat_room_v3';

  const STD_EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😭', '😡', '🤔', '👏', '🙏',
    '❤️', '💖', '🔥', '✨', '👑', '💎', '🌹', '🎉', '🏆', '☕', '🎵', '🕊️',
    '🦅', '🛡️', '💯', '👌', '👍', '🤝'
  ];

  const RANK_ICON_PRESETS = [
    '👑', '💎', '⭐', '🏆', '🛡️', '🦅', '⚜️', '🔥',
    '✨', '🎖️', '🔰', '💫', '🐉', '🦁', '🌟', '💍'
  ];

  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const state = {
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
    shopItems: { frames: [], nameplates: [], shines: [], musicPresets: [] },
    social: { friends: [], privateMessages: [], wallPosts: [], notifications: [], unreadNotifCount: 0, myGifts: { received: [], sent: [] } },
    socket: null,
    heartbeatTimer: null,
    adminNoticeMode: false,
    ytLocalMuted: false,
    ytBarOpen: false,
    activeCustomizeTab: 'account',
    activeLeaderboardTab: 'rich',
    activeAdminTab: 'stats',
    activeEmojiTab: 'std',
    giftTarget: null,
    adminOverview: null,
    editingRankKey: null,
    editingRoomId: null,
    profileAudioEl: null,
    profileSynthTimer: null,
    activeMusicRef: '',
    // WebRTC Voice Mics
    localStream: null,
    isSelfMicMuted: false,
    micPeers: new Map(), // remoteSocketId -> RTCPeerConnection
    mediaRecorder: null,
    recordedChunks: [],
    isRecordingAudio: false,
    typingTimeout: null
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
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
      }
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
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
    const headers = { ...(opts.headers || {}) };
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

  function roleBadgeHTML(roleKey) {
    const r = getRank(roleKey);
    const imgHtml = r.image_url
      ? `<img src="${escapeHtml(r.image_url)}" class="rank-badge-img" alt="" />`
      : `<span>${escapeHtml(r.icon || '⭐')}</span>`;
    return `<span class="rank-badge" style="background:${escapeHtml(r.bg_color)};color:${escapeHtml(r.text_color)}">${imgHtml}<span>${escapeHtml(r.label)}</span></span>`;
  }

  function formatNameHTML(userObj) {
    const name = escapeHtml(userObj.sender_name || userObj.name || 'عضو');
    const role = userObj.sender_role || userObj.role || 'member';
    const shine = userObj.name_shine || userObj.nameShine || 'none';
    const wings = Boolean(userObj.vip_wings || userObj.vipWings);
    const nameplate = userObj.nameplate_style || userObj.nameplateStyle || 'default';
    const nameColor = userObj.name_color || userObj.nameColor || '#ffffff';
    const nameBg = userObj.name_bg_color || userObj.nameBgColor || '';
    const neon = userObj.neon_color || userObj.neonColor || '';
    const ff = userObj.font_family || userObj.fontFamily || 'Normal';
    const fs = userObj.font_style || userObj.fontStyle || 'Normal';

    const classes = ['sender-name-btn'];
    if (nameplate && nameplate !== 'default') classes.push(`nameplate-${nameplate}`);
    if (shine && shine !== 'none') classes.push(`shine-${shine}`);

    const styles = [];
    if (shine === 'none') styles.push(`color:${escapeHtml(nameColor)}`);
    if (nameBg) styles.push(`background-color:${escapeHtml(nameBg)}`);
    if (neon) styles.push(`text-shadow:0 0 8px ${escapeHtml(neon)}, 0 0 14px ${escapeHtml(neon)}`);
    if (ff && ff !== 'Normal') styles.push(`font-family:'${escapeHtml(ff)}', sans-serif`);
    if (fs === 'Bold') styles.push('font-weight:900');
    if (fs === 'Italic') styles.push('font-style:italic');

    const leftWing = wings ? '<span class="vip-wing">🪽</span>' : role === 'site_owner' ? '<span class="vip-wing">👑</span>' : '';
    const rightWing = wings ? '<span class="vip-wing">🪽</span>' : '';

    return `<span class="${classes.join(' ')}" style="${styles.join(';')}">${leftWing}<span>${name}</span>${rightWing}</span>`;
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
    if (s.top_bar_color) root.setProperty('--top-bar-bg', s.top_bar_color);
    if (s.bottom_bar_color) root.setProperty('--bottom-bar-bg', s.bottom_bar_color);
    if (s.button_color) root.setProperty('--accent-btn', s.button_color);
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
    $('dropStealthBtn').textContent = isStealth ? '👁️ إلغاء وضع التخفي' : '👻 تفعيل وضع التخفي';
    $('drawerStealthBtn').textContent = isStealth ? '👁️ إلغاء التخفي' : '👻 وضع التخفي';

    const rk = getRank(u.role);
    $('dropUserName').textContent = u.name;
    $('dropUserRole').textContent = `${rk.icon} ${rk.label}`;
    $('dropUserCoins').textContent = `💰 ${u.coins || 0} عملة • 🔥 ${u.activityPoints || 0} تفاعل`;

    const canPanel = isOwner || hasPerm('access_panel');
    $('dropAdminBtn').classList.toggle('hidden', !canPanel);
    $('drawerAdminBtn').classList.toggle('hidden', !canPanel);
    $('plusAdminNoticeBtn').classList.toggle('hidden', !canPanel);
    $('plusClearRoomBtn').classList.toggle('hidden', !(isOwner || hasPerm('clear_room') || state.isRoomManager));
  }

  function renderRoomBanner() {
    const r = state.currentRoom;
    if (!r) return;
    $('roomBannerName').textContent = `${r.icon || '💬'} ${r.name}`;
    $('roomBannerDesc').textContent = r.description || '';
    $('roomBannerImg').src = r.image_url || '/assets/rooms/default.svg';
    $('roomActivityBadge').textContent = `🔥 ${r.activity_points || 0} تفاعل`;
    $('roomSettingsBtn').classList.toggle('hidden', !state.isRoomManager);

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
      $('ytNowPlayingLabel').textContent = `🎬 يوتيوب الغرفة: ${r.youtube_title || r.youtube_video_id}`;
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
      $('ytNowPlayingLabel').textContent = '🎬 مشغل يوتيوب الغرفة';
      $('roomYoutubeBar').classList.toggle('hidden', !state.ytBarOpen);
    }
    $('ytMuteLocalBtn').textContent = state.ytLocalMuted ? '🔇 صامت' : '🔊 صوت';
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
      const avatarContent = isOccupied && m.holderAvatar
        ? `<img src="${escapeHtml(m.holderAvatar)}" alt="${escapeHtml(m.holderName)}" />`
        : isOccupied
          ? `<span>${escapeHtml((m.holderName || 'م').slice(0, 1))}</span>`
          : '🎙️';
      const title = isOccupied
        ? `${m.holderName}${isMuted ? ' (مكتوم)' : ' (يتحدث)'}`
        : `صعود على المايك ${m.slot}`;

      return `
        <button
          type="button"
          class="mic-slot-btn ${isOccupied ? 'occupied' : ''} ${isMuted ? 'muted-slot' : ''}"
          data-mic-slot="${m.slot}"
          title="${escapeHtml(title)}"
        >
          ${avatarContent}
          <span class="mic-num-badge">${isMuted ? '🔇' : m.slot}</span>
        </button>
      `;
    }).join('');

    $('leaveMicBtn').classList.toggle('hidden', !iHoldMic);
    $('toggleSelfMicMuteBtn').classList.toggle('hidden', !iHoldMic);
    $('toggleSelfMicMuteBtn').textContent = state.isSelfMicMuted || iAmMuted ? '🔇' : '🎙️';
    $('toggleSelfMicMuteBtn').classList.toggle('danger', state.isSelfMicMuted || iAmMuted);
  }

  // ==========================================
  // CHAT FEED RENDERING (OPTIMISTIC + REALTIME)
  // ==========================================
  function createMessageRowElement(msg) {
    const row = document.createElement('div');
    const isAdminNotice = Boolean(msg.is_admin_notice);
    const isGift = Boolean(msg.is_gift);
    row.className = `cody-msg-row${isAdminNotice ? ' admin-notice-row' : ''}${isGift ? ' gift-msg-row' : ''}`;
    if (msg.client_msg_id) row.dataset.clientMsgId = msg.client_msg_id;
    if (msg.id) row.dataset.msgId = String(msg.id);

    const timeStr = msg.created_at
      ? new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      : '';

    let bodyHtml = '';
    if (msg.msg_type === 'image' && msg.media_url) {
      bodyHtml = `<img src="${escapeHtml(msg.media_url)}" class="msg-media-img" alt="صورة" onclick="window.open(this.src,'_blank')" />`;
    } else if (msg.msg_type === 'audio' && msg.media_url) {
      bodyHtml = `<audio controls src="${escapeHtml(msg.media_url)}" class="msg-audio-player"></audio>`;
    } else {
      const prefix = isAdminNotice ? '<span class="admin-notice-prefix">إشعار من الإدارة:</span>' : '';
      const textColor = isAdminNotice ? '#ffffff' : escapeHtml(msg.text_color || '#ffffff');
      const ff = msg.font_family && msg.font_family !== 'Normal' ? `font-family:'${escapeHtml(msg.font_family)}',sans-serif;` : '';
      const fw = msg.font_style === 'Bold' ? 'font-weight:800;' : '';
      const fi = msg.font_style === 'Italic' ? 'font-style:italic;' : '';
      bodyHtml = `<div class="msg-content" style="color:${textColor};${ff}${fw}${fi}">${prefix}${renderContentWithEmojis(msg.content)}</div>`;
    }

    row.innerHTML = `
      <div class="msg-avatar-trigger" style="cursor:pointer">${formatAvatarHTML(msg, 'sm')}</div>
      <div class="msg-body-col">
        <div class="msg-meta-row">
          ${roleBadgeHTML(msg.sender_role)}
          <span class="msg-name-trigger" style="cursor:pointer">${formatNameHTML(msg)}</span>
          <span class="msg-time">${escapeHtml(timeStr)}</span>
        </div>
        ${bodyHtml}
      </div>
    `;

    const openTarget = () => openQuickUserModal({
      key: msg.sender_key,
      name: msg.sender_name,
      role: msg.sender_role,
      avatarUrl: msg.avatar_url,
      avatarFrame: msg.avatar_frame,
      nameplateStyle: msg.nameplate_style,
      nameShine: msg.name_shine,
      vipWings: msg.vip_wings,
      nameColor: msg.name_color
    });
    row.querySelector('.msg-avatar-trigger').addEventListener('click', openTarget);
    row.querySelector('.msg-name-trigger').addEventListener('click', openTarget);
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

  function appendRoomNotice(text) {
    const feed = $('chatFeed');
    const div = document.createElement('div');
    div.className = 'room-notice-row';
    div.textContent = text;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  }

  function renderRoomUsers() {
    const list = $('roomUsersList');
    const count = state.roomUsers.length;
    $('roomOnlineCounter').textContent = String(count);
    $('sideOnlineCount').textContent = String(count);

    list.innerHTML = state.roomUsers.map((u) => `
      <button type="button" class="user-row-card" data-user-key="${escapeHtml(u.key)}">
        ${formatAvatarHTML(u, 'sm')}
        <div class="user-row-info">
          <div class="user-row-name">${formatNameHTML(u)}</div>
          <div>${roleBadgeHTML(u.role)} <span class="muted">🔥${u.activityPoints || 0}</span></div>
        </div>
      </button>
    `).join('');

    list.querySelectorAll('.user-row-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const u = state.roomUsers.find((x) => x.key === btn.dataset.userKey);
        if (u) openQuickUserModal(u);
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
      avatar_url: u.avatarUrl,
      avatar_frame: u.avatarFrame,
      nameplate_style: u.nameplateStyle,
      name_shine: u.nameShine,
      vip_wings: u.vipWings,
      is_admin_notice: isAdminNotice,
      msg_type: 'text',
      content: text,
      created_at: new Date().toISOString()
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

  // ==========================================
  // QUICK USER CARD + GIFT SEND + MODERATION
  // ==========================================
  function openQuickUserModal(rawUser) {
    const liveMatch =
      state.roomUsers.find((x) => x.key === rawUser.key) ||
      state.onlineUsers.find((x) => x.key === rawUser.key) ||
      state.persistentMembers.find((x) => x.key === rawUser.key);
    const u = { ...(liveMatch || {}), ...rawUser };
    if (!u.profileMusic && liveMatch?.profileMusic) u.profileMusic = liveMatch.profileMusic;
    if (!u.bio && liveMatch?.bio) u.bio = liveMatch.bio;
    if (!u.vipFamily && liveMatch?.vipFamily) u.vipFamily = liveMatch.vipFamily;

    const isMe = state.user && u.key === state.user.key;
    const isReg = u.key && String(u.key).startsWith('user:');
    const targetUserId = isReg ? Number(String(u.key).replace('user:', '')) : null;
    const canMod = !isMe && (state.user?.role === 'site_owner' || state.isRoomManager || hasPerm('mute') || hasPerm('kick'));
    const canBan = !isMe && (state.user?.role === 'site_owner' || hasPerm('ban'));
    const canGift = !isMe && !state.user?.isGuest;
    const hasMusic = Boolean(u.profileMusic && String(u.profileMusic).trim());

    $('quickUserBody').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        ${formatAvatarHTML(u, 'lg')}
        <div>
          <div style="font-size:17px;font-weight:800;">${formatNameHTML(u)}</div>
          <div style="margin-top:4px;">${roleBadgeHTML(u.role)}</div>
          ${u.vipFamily ? `<div class="muted" style="margin-top:3px;">🏰 عائلة: ${escapeHtml(u.vipFamily)}</div>` : ''}
          ${u.bio ? `<div class="muted" style="margin-top:3px;">💬 ${escapeHtml(u.bio)}</div>` : ''}
        </div>
      </div>

      ${hasMusic ? `
        <div style="margin-top:6px;">
          <button type="button" class="btn-secondary btn-sm" id="quMusicToggleBtn">🎵 تشغيل موسيقى البروفايل</button>
        </div>
      ` : ''}

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        <button type="button" class="btn-secondary btn-sm" id="quMentionBtn">@ منشن</button>
        ${!isMe ? '<button type="button" class="btn-primary btn-sm" id="quPmBtn">✉️ رسالة خاصة</button>' : ''}
        ${!isMe && !state.user?.isGuest && isReg ? '<button type="button" class="btn-secondary btn-sm" id="quFriendBtn">🤝 طلب صداقة</button>' : ''}
        ${canGift ? '<button type="button" class="btn-primary btn-sm" style="background:#db2777" id="quGiftBtn">🎁 إرسال هدية</button>' : ''}
      </div>

      ${canMod ? `
        <hr style="border:none;border-top:1px solid #e2e8f0;" />
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button type="button" class="btn-secondary btn-xs" id="quMuteBtn">🔇 كتم 15د</button>
          <button type="button" class="btn-secondary btn-xs" id="quUnmuteBtn">🔊 فك كتم</button>
          <button type="button" class="btn-danger btn-xs" id="quKickBtn">🚪 طرد من الغرفة</button>
          ${canBan ? '<button type="button" class="btn-danger btn-xs" id="quBanBtn">⛔ حظر نهائي</button>' : ''}
          ${state.user?.role === 'site_owner' && targetUserId ? '<button type="button" class="btn-primary btn-xs" id="quCoinsBtn">💰 +500 عملة</button>' : ''}
        </div>
      ` : ''}
    `;

    $('quMusicToggleBtn')?.addEventListener('click', () => {
      const playing = playProfileMusic(u.profileMusic);
      if ($('quMusicToggleBtn')) {
        $('quMusicToggleBtn').textContent = playing ? '⏹️ إيقاف الموسيقى' : '🎵 تشغيل موسيقى البروفايل';
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

    $('quGiftBtn')?.addEventListener('click', () => {
      closeModal('quickUserModal');
      openGiftModal(u);
    });

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

    $('quBanBtn')?.addEventListener('click', () => {
      const reason = prompt('سبب الحظر:', 'مخالفة القوانين') || 'حظر من الإدارة';
      state.socket.emit('admin_ban', { targetKey: u.key, reason });
      closeModal('quickUserModal');
    });

    $('quCoinsBtn')?.addEventListener('click', () => {
      state.socket.emit('admin_give_coins', { userId: targetUserId, amount: 500 });
      showToast('تم منح 500 عملة للعضو.');
      closeModal('quickUserModal');
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
  // 4-TAB PROFILE CUSTOMIZER & ADDONS
  // ==========================================
  async function openCustomizeModal(initialTab = 'account') {
    if (!state.user || state.user.isGuest) {
      showToast('تخصيص الملف والإضافات متاح للأعضاء المسجلين فقط.', true);
      return;
    }

    try {
      const [shopRes, socialRes] = await Promise.all([
        api('/api/shop/items'),
        api('/api/social/state')
      ]);
      state.shopItems = shopRes;
      state.social = { ...state.social, ...socialRes };
    } catch {
      // ignore fallback
    }

    const u = state.user;
    $('custDisplayName').value = u.displayName || u.name || '';
    $('custVipFamily').value = u.vipFamily || '';
    $('custBioInput').value = u.bio || '';
    $('custNameColor').value = /^#[0-9a-f]{6}$/i.test(u.nameColor || '') ? u.nameColor : '#ffffff';
    $('custTextColor').value = /^#[0-9a-f]{6}$/i.test(u.textColor || '') ? u.textColor : '#ffffff';
    $('custNameBgColor').value = /^#[0-9a-f]{6}$/i.test(u.nameBgColor || '') ? u.nameBgColor : '#1e293b';
    $('custNameBgColor').dataset.cleared = u.nameBgColor ? '0' : '1';
    $('custNeonColor').value = /^#[0-9a-f]{6}$/i.test(u.neonColor || '') ? u.neonColor : '#38bdf8';
    $('custNeonColor').dataset.cleared = u.neonColor ? '0' : '1';
    $('custFontFamily').value = u.fontFamily || 'Normal';
    $('custFontStyle').value = u.fontStyle || 'Normal';
    $('custVipWingsToggle').checked = Boolean(u.vipWings);

    const pmusic = u.profileMusic || '';
    if (pmusic.startsWith('preset:') || pmusic === '') {
      $('custMusicPreset').value = pmusic;
      $('custMusicCustomUrl').value = '';
    } else {
      $('custMusicPreset').value = '';
      $('custMusicCustomUrl').value = pmusic;
    }

    const isOwner = u.role === 'site_owner';
    $('custStealthCard').classList.toggle('hidden', !isOwner);
    $('custStealthToggle').checked = Boolean(u.isStealth);

    // Tab 2: Gifts
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

    // Tab 4: Addons
    const canAddons = isOwner || hasPerm('use_addons');
    $('custAddonsLockNotice').classList.toggle('hidden', canAddons);
    $('custVipWingsToggle').disabled = !canAddons;

    renderCustomizeAddonsGrids(canAddons);
    switchCustomizeTab(initialTab);
    updateCustomizePreview();
    openModal('customizeModal');
  }

  function renderCustomizeAddonsGrids(canAddons) {
    const u = state.user;
    $('custShineGrid').innerHTML = (state.shopItems.shines || []).map((s) => `
      <div class="addon-card ${u.nameShine === s.id ? 'active' : ''}">
        <div class="${s.id !== 'none' ? `shine-${s.id}` : ''}" style="font-weight:800;font-size:15px;">${escapeHtml(u.name || 'نموذج')}</div>
        <span class="muted">${escapeHtml(s.label)}</span>
        <button type="button" class="btn-primary btn-xs pick-shine-btn" data-shine-id="${s.id}" ${!canAddons && s.id !== 'none' ? 'disabled' : ''}>
          ${u.nameShine === s.id ? '✓ مفعل' : 'تفعيل'}
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
            ${u.avatarFrame === f.id ? '✓ مفعل' : 'تفعيل الآن'}
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
          ${u.nameplateStyle === np.id ? '✓ مفعل' : 'تطبيق'}
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
      vipWings: $('custVipWingsToggle').checked
    };
    const wrap = $('custPreviewAvatarWrap');
    wrap.className = `avatar-wrap frame-${u.avatarFrame || 'none'}`;
    if (u.avatarUrl) {
      $('custPreviewAvatarImg').src = u.avatarUrl;
      $('custPreviewAvatarImg').classList.remove('hidden');
      $('custPreviewAvatarLetter').classList.add('hidden');
    } else {
      $('custPreviewAvatarImg').classList.add('hidden');
      $('custPreviewAvatarLetter').classList.remove('hidden');
      $('custPreviewAvatarLetter').textContent = (previewObj.name || 'ع').slice(0, 1);
    }
    $('custPreviewNameRow').innerHTML = `${roleBadgeHTML(u.role)} ${formatNameHTML(previewObj)}`;
    $('custPreviewBio').textContent = $('custBioInput').value || u.bio || '';
  }

  function switchCustomizeTab(tab) {
    state.activeCustomizeTab = tab;
    document.querySelectorAll('.cust-tab').forEach((b) => b.classList.toggle('active', b.dataset.custTab === tab));
    ['account', 'gifts', 'options', 'addons'].forEach((t) => {
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
      $('socialModalTitle').textContent = pmTarget ? `✉️ محادثة مع ${pmTarget.name}` : '✉️ الرسائل الخاصة';
      const pms = state.social.privateMessages || [];
      if (pmTarget) {
        state.socket.emit('mark_pm_read', { partnerKey: pmTarget.key });
        const thread = pms
          .filter((m) => (m.from_key === pmTarget.key && m.to_key === state.user.key) || (m.to_key === pmTarget.key && m.from_key === state.user.key))
          .reverse();
        $('socialModalBody').innerHTML = `
          <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;">
            ${thread.map((m) => `
              <div class="admin-list-card" style="background:${m.from_key === state.user.key ? '#dbeafe' : '#f1f5f9'}">
                <div><strong>${escapeHtml(m.from_name)}:</strong> ${escapeHtml(m.content)}</div>
              </div>
            `).join('') || '<div class="muted">ابدأ المحادثة الخاصة الآن...</div>'}
          </div>
          <div class="inline-row">
            <input type="text" id="pmComposeInput" style="flex:1" placeholder="اكتب رسالتك الخاصة..." />
            <button type="button" id="pmComposeSendBtn" class="btn-primary btn-sm">إرسال</button>
          </div>
        `;
        $('pmComposeSendBtn').addEventListener('click', () => {
          const val = $('pmComposeInput').value.trim();
          if (!val) return;
          state.socket.emit('send_pm', { toKey: pmTarget.key, toName: pmTarget.name, content: val }, () => {
            openSocialModal('pm', pmTarget);
          });
        });
      } else {
        const partners = new Map();
        for (const m of pms) {
          const pKey = m.from_key === state.user.key ? m.to_key : m.from_key;
          const pName = m.from_key === state.user.key ? m.to_name : m.from_name;
          if (!partners.has(pKey)) partners.set(pKey, { key: pKey, name: pName, last: m.content });
        }
        $('socialModalBody').innerHTML = [...partners.values()].length
          ? [...partners.values()].map((p) => `
              <div class="admin-list-card">
                <div><strong>${escapeHtml(p.name)}</strong><div class="muted">${escapeHtml(p.last)}</div></div>
                <button type="button" class="btn-primary btn-xs open-pm-thread-btn" data-pk="${escapeHtml(p.key)}" data-pn="${escapeHtml(p.name)}">فتح</button>
              </div>
            `).join('')
          : '<div class="muted">لا توجد رسائل خاصة بعد. اضغط على اسم أي عضو لمراسلته.</div>';
        $('socialModalBody').querySelectorAll('.open-pm-thread-btn').forEach((b) => {
          b.addEventListener('click', () => openSocialModal('pm', { key: b.dataset.pk, name: b.dataset.pn }));
        });
      }
      return;
    }

    if (mode === 'wall') {
      $('socialModalTitle').textContent = '🧱 جدار المنشورات';
      const posts = state.social.wallPosts || [];
      $('socialModalBody').innerHTML = `
        ${!state.user?.isGuest ? `
          <div class="news-composer">
            <textarea id="wallPostInput" rows="2" placeholder="شارك منشوراً على الجدار..."></textarea>
            <button type="button" id="wallPostSubmitBtn" class="btn-primary btn-sm">نشر على الجدار</button>
          </div>` : ''}
        <div class="news-feed-list">
          ${posts.map((p) => `
            <div class="news-card">
              <div><strong>${escapeHtml(p.author_name)}</strong> ${roleBadgeHTML(p.author_role)}</div>
              <p style="margin-top:6px;">${escapeHtml(p.content)}</p>
              <button type="button" class="btn-secondary btn-xs like-wall-btn" data-pid="${p.id}" style="margin-top:6px;">❤️ إعجاب (${p.likes_count || 0})</button>
            </div>
          `).join('') || '<div class="muted">لا توجد منشورات بعد.</div>'}
        </div>
      `;
      $('wallPostSubmitBtn')?.addEventListener('click', async () => {
        const content = $('wallPostInput').value.trim();
        if (!content) return;
        await api('/api/wall', { method: 'POST', body: { content } });
        openSocialModal('wall');
      });
      $('socialModalBody').querySelectorAll('.like-wall-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/wall/${b.dataset.pid}/like`, { method: 'POST' });
          openSocialModal('wall');
        });
      });
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
    $('roomsModalBody').innerHTML = state.rooms.map((r) => `
      <div class="admin-list-card">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${escapeHtml(r.image_url || '/assets/rooms/default.svg')}" style="width:42px;height:42px;border-radius:10px;" alt="" />
          <div>
            <strong>${escapeHtml(r.icon)} ${escapeHtml(r.name)} ${r.hasPassword ? '🔒' : ''}</strong>
            <div class="muted">${escapeHtml(r.description || '')}</div>
            <div class="muted">👥 ${r.onlineCount || 0} متواجد • 🔥 ${r.activity_points || 0} تفاعل</div>
          </div>
        </div>
        <button type="button" class="btn-primary btn-sm join-rm-modal-btn" data-room-id="${escapeHtml(r.id)}">
          ${state.currentRoom?.id === r.id ? 'الحالية ✓' : 'دخول'}
        </button>
      </div>
    `).join('');

    $('roomsModalBody').querySelectorAll('.join-rm-modal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal('roomsModal');
        joinRoomWithPrompt(btn.dataset.roomId);
      });
    });
    openModal('roomsModal');
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
      state.adminOverview = await api('/api/admin/overview');
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
      body.innerHTML = `
        <div class="news-composer">
          <strong>➕ إنشاء حساب عضو جديد وتعيين رتبته</strong>
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
                <strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)}) ${u.isSupremeOwner ? '🔒 محمي' : ''}</strong>
                <div class="muted">${escapeHtml(u.email)} • ${roleBadgeHTML(u.role)} • 💰 ${u.coins}</div>
              </div>
              <div class="inline-row" style="flex-wrap:wrap;">
                <select class="adm-user-role-sel" data-uid="${u.id}" ${u.isSupremeOwner && !isOwner ? 'disabled' : ''}>
                  ${buildAssignableRankOptions(u.role)}
                </select>
                <button type="button" class="btn-primary btn-xs adm-save-role-btn" data-uid="${u.id}">تطبيق</button>
                ${!u.isSupremeOwner || isOwner ? `<button type="button" class="btn-secondary btn-xs adm-rename-user-btn" data-uid="${u.id}" data-cur="${escapeHtml(u.displayName)}">✏️ الاسم</button>` : ''}
                ${isOwner ? `<button type="button" class="btn-secondary btn-xs adm-give-coins-btn" data-uid="${u.id}">💰 +500</button>` : ''}
                ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="btn-danger btn-xs adm-ban-user-btn" data-uid="${u.id}" data-uname="${escapeHtml(u.displayName)}">⛔ حظر</button>` : ''}
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

      body.querySelectorAll('.adm-ban-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const reason = prompt(`سبب حظر "${btn.dataset.uname}":`, 'مخالفة القوانين');
          if (reason === null) return;
          try {
            await api('/api/admin/ban', {
              method: 'POST',
              body: { targetKey: `user:${btn.dataset.uid}`, reason: reason || 'حظر من الإدارة' }
            });
            showToast('تم حظر العضو نهائياً.');
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

      body.innerHTML = `
        <div class="news-composer">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>${isEditing ? `✏️ تعديل الرتبة: ${escapeHtml(editRk.label)}` : '👑 منشئ الرتب والصلاحيات وسقف الترقية'}</strong>
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
            <label class="switch-label"><input type="checkbox" id="permMute" ${ep.mute ? 'checked' : ''} /><span>🔇 الكتم</span></label>
            <label class="switch-label"><input type="checkbox" id="permKick" ${ep.kick ? 'checked' : ''} /><span>🚪 الطرد</span></label>
            <label class="switch-label"><input type="checkbox" id="permBan" ${ep.ban ? 'checked' : ''} /><span>⛔ الحظر</span></label>
            <label class="switch-label"><input type="checkbox" id="permSetRank" ${ep.set_rank ? 'checked' : ''} /><span>🎖️ تعديل الرتب</span></label>
            <label class="switch-label"><input type="checkbox" id="permClearRoom" ${ep.clear_room ? 'checked' : ''} /><span>🧹 مسح الغرفة</span></label>
            <label class="switch-label"><input type="checkbox" id="permManageRooms" ${ep.manage_rooms ? 'checked' : ''} /><span>🏠 إدارة الغرف</span></label>
            <label class="switch-label"><input type="checkbox" id="permAccessPanel" ${ep.access_panel ? 'checked' : ''} /><span>⚙️ دخول الإدارة</span></label>
            <label class="switch-label"><input type="checkbox" id="permRoomOwner" ${ep.room_owner ? 'checked' : ''} /><span>🗝️ مالك غرفة</span></label>
            <label class="switch-label"><input type="checkbox" id="permPublishNews" ${ep.publish_news ? 'checked' : ''} /><span>📰 نشر الأخبار</span></label>
            <label class="switch-label"><input type="checkbox" id="permUseAddons" ${!isEditing || ep.use_addons ? 'checked' : ''} /><span>✨ استخدام الإضافات</span></label>
          </div>
          <button type="button" id="rkSaveBtn" class="btn-primary" ${!isOwner ? 'disabled' : ''}>
            ${isEditing ? '💾 حفظ التعديلات على الرتبة' : '➕ حفظ وإنشاء الرتبة'}
          </button>
        </div>
        <div class="news-feed-list">
          ${(ov.ranks || []).map((r) => `
            <div class="admin-list-card">
              <div>
                ${roleBadgeHTML(r.key)}
                <span class="muted">قوة ${r.power} • سقف الترقية ${r.max_assignable_rank || 0}</span>
                <div class="muted">
                  ${r.permissions?.room_owner ? '🗝️مالك غرفة ' : ''}
                  ${r.permissions?.publish_news ? '📰نشر أخبار ' : ''}
                  ${r.permissions?.use_addons ? '✨إضافات ' : ''}
                  ${r.permissions?.set_rank ? '🎖️ترقية ' : ''}
                </div>
              </div>
              <div class="inline-row">
                ${isOwner ? `<button type="button" class="btn-secondary btn-xs edit-rk-btn" data-rk="${escapeHtml(r.key)}">✏️ تعديل</button>` : ''}
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
      auth: { token: state.token, roomId: savedRoom },
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
    });

    socket.on('session_updated', ({ user }) => {
      state.user = user;
      renderUserIdentity();
    });

    socket.on('room_joined', (data) => {
      state.currentRoom = data.room;
      state.isRoomManager = Boolean(data.isRoomManager);
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

    socket.on('room_users', ({ roomId, users }) => {
      if (state.currentRoom?.id === roomId) {
        state.roomUsers = users || [];
        renderRoomUsers();
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

    socket.on('room_notice', ({ roomId, text }) => {
      if (state.currentRoom?.id === roomId) appendRoomNotice(text);
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
      playNotificationChime('notif');
      showToast(`🔔 ذكرك ${fromName}: ${content}`);
    });

    socket.on('new_pm', (pm) => {
      state.social.privateMessages = [pm, ...(state.social.privateMessages || [])];
      updateFriendAndPmBadges();
      if (pm.from_key !== state.user?.key) {
        playNotificationChime('notif');
        showToast(`✉️ رسالة خاصة من ${pm.from_name}`);
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
    if (state.activeEmojiTab === 'std') {
      grid.innerHTML = STD_EMOJIS.map((em) => `<button type="button" class="emoji-pick-btn" data-ins="${em}">${em}</button>`).join('');
    } else {
      grid.innerHTML = state.emojis.length
        ? state.emojis.map((e) => `<button type="button" class="emoji-pick-btn" data-ins="${escapeHtml(e.code)}"><img src="${escapeHtml(e.image_url)}" alt="" /></button>`).join('')
        : '<div class="muted" style="grid-column:1/-1;text-align:center;">لا توجد ملصقات مخصصة.</div>';
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
        const res = await api('/api/register', {
          method: 'POST',
          body: { username: $('regUsername').value, email: $('regEmail').value, password: $('regPassword').value }
        });
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

    $('dropCustomizeBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('account');
    });

    $('dropGiftsTabBtn').addEventListener('click', () => {
      $('profileDropdown').classList.add('hidden');
      openCustomizeModal('gifts');
    });

    $('dropStealthBtn').addEventListener('click', async () => {
      $('profileDropdown').classList.add('hidden');
      const next = !state.user?.isStealth;
      try {
        const res = await api('/api/profile/stealth', { method: 'POST', body: { enabled: next } });
        state.user = res.user;
        renderUserIdentity();
        showToast(next ? '👻 تم تفعيل وضع التخفي بنجاح.' : '👁️ تم إلغاء وضع التخفي.');
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
    $('topReportBtn').addEventListener('click', () => openSocialModal('report'));
    $('topNotifBtn').addEventListener('click', () => openSocialModal('notifications'));
    $('topFriendsBtn').addEventListener('click', () => openSocialModal('friends'));
    $('topPmBtn').addEventListener('click', () => openSocialModal('pm'));
    $('goldRichBtn').addEventListener('click', () => openLeaderboardsModal('rich'));
    $('goldVipsBtn').addEventListener('click', () => openLeaderboardsModal('activeMembers'));

    // Sidebar & Main Drawer
    $('toggleUsersDrawerBtn').addEventListener('click', () => $('usersSidePanel').classList.toggle('open'));
    $('closeUsersSideBtn').addEventListener('click', () => $('usersSidePanel').classList.remove('open'));
    $('menuDrawerBtn').addEventListener('click', () => {
      $('drawerBackdrop').classList.remove('hidden');
      $('mainDrawer').classList.remove('hidden');
    });
    const closeMainDrawer = () => {
      $('drawerBackdrop').classList.add('hidden');
      $('mainDrawer').classList.add('hidden');
    };
    $('closeMainDrawerBtn').addEventListener('click', closeMainDrawer);
    $('drawerBackdrop').addEventListener('click', closeMainDrawer);

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
        else if (action === 'news') openNewsModal();
        else if (action === 'wall') openSocialModal('wall');
        else if (action === 'leaderboards') openLeaderboardsModal('rich');
        else if (action === 'customize') openCustomizeModal('account');
        else if (action === 'stealth') $('dropStealthBtn').click();
        else if (action === 'admin') openAdminPanel('stats');
        else if (action === 'logout') logoutUser();
      });
    });

    // Mics 1..5 click
    $('micSlotsContainer').addEventListener('click', (e) => {
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

    $('leaveMicBtn').addEventListener('click', leaveVoiceMic);
    $('toggleSelfMicMuteBtn').addEventListener('click', () => {
      state.isSelfMicMuted = !state.isSelfMicMuted;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((t) => {
          t.enabled = !state.isSelfMicMuted;
        });
      }
      state.socket.emit('mic_toggle_self_mute', { muted: state.isSelfMicMuted });
      renderMics();
    });

    // Room switch & YouTube
    $('switchRoomsBtn').addEventListener('click', openRoomsModal);
    $('roomSettingsBtn').addEventListener('click', () => openAdminPanel('rooms', state.currentRoom?.id || null));
    $('toggleYoutubeBarBtn').addEventListener('click', () => {
      state.ytBarOpen = !state.ytBarOpen;
      renderRoomYoutubeBar();
    });
    $('ytCloseViewBtn').addEventListener('click', () => {
      state.ytBarOpen = false;
      $('roomYoutubeBar').classList.add('hidden');
    });
    $('ytMuteLocalBtn').addEventListener('click', () => {
      state.ytLocalMuted = !state.ytLocalMuted;
      renderRoomYoutubeBar();
    });
    $('ytPlayRoomBtn').addEventListener('click', () => {
      const url = $('ytUrlInput').value.trim();
      state.socket.emit('room_youtube_set', { roomId: state.currentRoom?.id, url, isPlaying: true }, (res) => {
        if (res?.error) showToast(res.error, true);
        else $('ytUrlInput').value = '';
      });
    });
    $('ytStopBtn').addEventListener('click', () => {
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

    // Customize modal tabs & actions
    document.querySelectorAll('.cust-tab').forEach((b) => {
      b.addEventListener('click', () => switchCustomizeTab(b.dataset.custTab));
    });
    ['custDisplayName', 'custBioInput', 'custNameColor', 'custFontFamily', 'custFontStyle', 'custVipWingsToggle'].forEach((id) => {
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
    $('custUploadAvatarBtn').addEventListener('click', async () => {
      const file = $('custAvatarFile').files[0];
      if (!file) return showToast('اختر صورة أولاً.', true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api('/api/upload/avatar', { method: 'POST', body: fd });
        state.user.avatarUrl = res.url;
        updateCustomizePreview();
        renderUserIdentity();
        showToast('تم رفع الصورة الشخصية بنجاح!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    $('custStealthToggle').addEventListener('change', async () => {
      try {
        const res = await api('/api/profile/stealth', {
          method: 'POST',
          body: { enabled: $('custStealthToggle').checked }
        });
        state.user = res.user;
        renderUserIdentity();
        showToast(res.isStealth ? '👻 وضع التخفي مفعل.' : '👁️ وضع التخفي متوقف.');
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
      $('custMusicPreviewBtn').textContent = playing ? '⏹️ إيقاف' : '▶️ تجربة';
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
            nameColor: $('custNameColor').value,
            textColor: $('custTextColor').value,
            nameBgColor: $('custNameBgColor').dataset.cleared === '1' ? '' : $('custNameBgColor').value,
            neonColor: $('custNeonColor').dataset.cleared === '1' ? '' : $('custNeonColor').value,
            fontFamily: $('custFontFamily').value,
            fontStyle: $('custFontStyle').value,
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
    });
  }

  async function bootstrap() {
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
