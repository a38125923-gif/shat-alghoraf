(function (globalScope) {
  'use strict';

  const FIREBASE_PROJECT_ID = 'gen-lang-client-0018513004';
  const FIRESTORE_DATABASE_ID = 'ai-studio-android-34a0c37b-d80d-4f0d-80fc-e6a16720a8bb';

  let sdkState = {
    configuredKey: '',
    loadingPromise: null,
    app: null,
    auth: null,
    db: null,
    mods: null
  };

  let session = {
    active: false,
    token: '',
    user: null,
    roomId: 'general',
    apiFetch: null,
    callbacks: {},
    firestoreActive: false,
    unsubs: [],
    roomUnsubs: [],
    heartbeatTimer: null,
    socialTimer: null,
    typingInRoom: '',
    lastMsgId: 0,
    lastKnownUserState: {},
    seenWebRtcIds: new Set(),
    lastGoldRainAt: 0,
    lastForcedMoveAt: 0,
    lastWarningAt: 0,
    lastKickedAt: 0,
    lastForcedNameAt: 0,
    lastAvatarClearedAt: 0
  };

  function safeFirestoreDocId(raw) {
    return String(raw || '').replace(/[^a-zA-Z0-9:_-]/g, '_');
  }

  async function ensureFirebaseWebSdk(firebaseWebConfig) {
    const cfg = firebaseWebConfig && typeof firebaseWebConfig === 'object' ? firebaseWebConfig : {};
    const apiKey = String(cfg.apiKey || '').trim();
    if (!apiKey) return null;

    const projectId = String(cfg.projectId || FIREBASE_PROJECT_ID);
    const databaseId = String(cfg.firestoreDatabaseId || FIRESTORE_DATABASE_ID);
    const sig = `${apiKey}|${projectId}|${databaseId}`;
    if (sdkState.configuredKey === sig && sdkState.db && sdkState.auth) {
      return sdkState;
    }
    if (sdkState.loadingPromise) return sdkState.loadingPromise;

    sdkState.loadingPromise = (async () => {
      try {
        const [appMod, authMod, fsMod] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
          import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
        ]);

        const appConfig = {
          apiKey,
          authDomain: cfg.authDomain || `${projectId}.firebaseapp.com`,
          projectId,
          ...(cfg.appId ? { appId: cfg.appId } : {})
        };
        const existingApps = typeof appMod.getApps === 'function' ? appMod.getApps() : [];
        const app = existingApps.length ? existingApps[0] : appMod.initializeApp(appConfig);
        const auth = authMod.getAuth(app);
        let fsDb = null;
        try {
          fsDb = fsMod.initializeFirestore(app, {}, databaseId);
        } catch {
          fsDb = fsMod.getFirestore(app, databaseId);
        }

        sdkState.app = app;
        sdkState.auth = auth;
        sdkState.db = fsDb;
        sdkState.mods = { appMod, authMod, fsMod };
        sdkState.configuredKey = sig;
        return sdkState;
      } catch (err) {
        console.warn('[Firebase Web SDK] Unavailable, using server-synced Firestore REST:', err?.message || err);
        return null;
      } finally {
        sdkState.loadingPromise = null;
      }
    })();

    return sdkState.loadingPromise;
  }

  async function signInWithGoogle(firebaseWebConfig) {
    const sdk = await ensureFirebaseWebSdk(firebaseWebConfig);
    if (!sdk || !sdk.auth || !sdk.mods?.authMod) {
      return { error: 'تسجيل دخول جوجل المباشر يتطلب ضبط FIREBASE_WEB_API_KEY في إعدادات الموقع، أو يمكنك الدخول بالبريد وكلمة المرور.' };
    }
    try {
      const { GoogleAuthProvider, signInWithPopup } = sdk.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(sdk.auth, provider);
      const idToken = await cred.user.getIdToken();
      return {
        idToken,
        firebaseUid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
        photoURL: cred.user.photoURL || ''
      };
    } catch (err) {
      return { error: err?.message || 'تم إلغاء تسجيل الدخول عبر جوجل.' };
    }
  }

  function clearUnsubs(list) {
    while (list.length) {
      const fn = list.pop();
      try {
        if (typeof fn === 'function') fn();
      } catch {
        // ignore
      }
    }
  }

  function handleUserStateSnapshot(st) {
    if (!st || typeof st !== 'object') return;
    const cb = session.callbacks || {};
    session.lastKnownUserState = st;

    if (st.isBanned === true && typeof cb.onBanned === 'function') {
      cb.onBanned({ reason: 'تم حظرك من الشات' });
      return;
    }

    if (Number(st.kickedAt) > session.lastKickedAt && session.lastKickedAt > 0) {
      session.lastKickedAt = Number(st.kickedAt);
      if (typeof cb.onKicked === 'function') {
        cb.onKicked({
          reason: st.kickedReason || 'تم طردك من الغرفة',
          banned: Boolean(st.isBanned)
        });
      }
      return;
    }
    if (Number(st.kickedAt) > 0 && session.lastKickedAt === 0) {
      session.lastKickedAt = Number(st.kickedAt);
    }

    if (Number(st.lastWarningAt) > session.lastWarningAt && st.lastWarning) {
      session.lastWarningAt = Number(st.lastWarningAt);
      if (typeof cb.onWarning === 'function') cb.onWarning(st.lastWarning);
    }

    if (Number(st.goldRainAt) > session.lastGoldRainAt) {
      const firstInit = session.lastGoldRainAt === 0;
      session.lastGoldRainAt = Number(st.goldRainAt);
      if (!firstInit && typeof cb.onGoldRain === 'function') cb.onGoldRain();
    }

    if (Number(st.forcedMoveAt) > session.lastForcedMoveAt && st.forcedRoomId && st.forcedRoomId !== session.roomId) {
      session.lastForcedMoveAt = Number(st.forcedMoveAt);
      if (typeof cb.onForcedRoomMove === 'function') cb.onForcedRoomMove(st.forcedRoomId);
    }

    if (Number(st.forcedNameAt) > session.lastForcedNameAt && st.name) {
      session.lastForcedNameAt = Number(st.forcedNameAt);
      if (typeof cb.onSessionPatch === 'function') {
        cb.onSessionPatch({ name: st.name, displayName: st.displayName || st.name });
      }
    }

    if (Number(st.avatarClearedAt) > session.lastAvatarClearedAt) {
      session.lastAvatarClearedAt = Number(st.avatarClearedAt);
      if (typeof cb.onSessionPatch === 'function') cb.onSessionPatch({ avatarUrl: '' });
    }

    if (typeof cb.onUserState === 'function') cb.onUserState(st);
  }

  function attachFirestoreGlobalListeners() {
    if (!sdkState.db || !sdkState.mods?.fsMod) return;
    const fsDb = sdkState.db;
    const { collection, doc, onSnapshot, query, where } = sdkState.mods.fsMod;
    const cb = session.callbacks || {};

    try {
      session.unsubs.push(
        onSnapshot(collection(fsDb, 'rooms'), () => {
          refreshRoomsAndUsersViaHttp();
        })
      );
      session.unsubs.push(
        onSnapshot(collection(fsDb, 'ranks'), (snap) => {
          const ranks = snap.docs
            .map((d) => d.data())
            .sort((a, b) => (Number(b.power) || 0) - (Number(a.power) || 0));
          if (ranks.length && typeof cb.onRanks === 'function') cb.onRanks(ranks);
        })
      );
      session.unsubs.push(
        onSnapshot(doc(fsDb, 'settings', 'site'), (snap) => {
          if (!snap.exists()) return;
          const raw = { ...(snap.data() || {}) };
          delete raw.welcome_bot_gemini_key;
          if (typeof cb.onSettings === 'function') cb.onSettings(raw);
        })
      );
      session.unsubs.push(
        onSnapshot(collection(fsDb, 'online_presence'), (snap) => {
          const all = snap.docs
            .map((d) => d.data())
            .filter((u) => u && u.key && !u.isStealth);
          if (typeof cb.onPresenceSnapshot === 'function') {
            cb.onPresenceSnapshot(all);
          }
        })
      );
      if (session.user?.key) {
        const safeKey = safeFirestoreDocId(session.user.key);
        session.unsubs.push(
          onSnapshot(doc(fsDb, 'user_states', safeKey), (snap) => {
            if (snap.exists()) handleUserStateSnapshot(snap.data());
          })
        );
        session.unsubs.push(
          onSnapshot(
            query(collection(fsDb, 'webrtc_signals'), where('toKey', '==', session.user.key)),
            (snap) => {
              snap.docs.forEach((d) => {
                const data = d.data();
                if (!data || session.seenWebRtcIds.has(d.id)) return;
                session.seenWebRtcIds.add(d.id);
                if (typeof cb.onWebRtcSignal === 'function') cb.onWebRtcSignal(data);
              });
            }
          )
        );
        session.unsubs.push(
          onSnapshot(
            query(collection(fsDb, 'private_messages'), where('to_key', '==', session.user.key)),
            () => {
              syncSocialState();
            }
          )
        );
        session.unsubs.push(
          onSnapshot(
            query(collection(fsDb, 'notifications'), where('target_key', '==', session.user.key)),
            () => {
              syncSocialState();
            }
          )
        );
      }
      session.firestoreActive = true;
    } catch (err) {
      console.warn('[Firestore Global Listeners] Falling back to HTTP delta sync:', err?.message || err);
      session.firestoreActive = false;
    }
  }

  function attachFirestoreRoomListeners(roomId) {
    clearUnsubs(session.roomUnsubs);
    if (!session.firestoreActive || !sdkState.db || !sdkState.mods?.fsMod) return;
    const fsDb = sdkState.db;
    const { collection, doc, limit, onSnapshot, orderBy, query, where } = sdkState.mods.fsMod;
    const cb = session.callbacks || {};

    try {
      session.roomUnsubs.push(
        onSnapshot(
          query(
            collection(fsDb, 'messages'),
            where('room_id', '==', roomId),
            orderBy('id', 'desc'),
            limit(120)
          ),
          (snap) => {
            const msgs = snap.docs
              .map((d) => d.data())
              .filter((m) => m && m.id)
              .sort((a, b) => Number(a.id) - Number(b.id));
            if (msgs.length) {
              session.lastMsgId = Math.max(session.lastMsgId, Number(msgs[msgs.length - 1].id) || 0);
            }
            if (typeof cb.onMessages === 'function') cb.onMessages(msgs, { roomId, fromSnapshot: true });
          }
        )
      );
      session.roomUnsubs.push(
        onSnapshot(doc(fsDb, 'room_mics', safeFirestoreDocId(roomId)), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (Array.isArray(data?.slots) && typeof cb.onRoomMics === 'function') {
            cb.onRoomMics(roomId, data.slots);
          }
        })
      );
    } catch (err) {
      console.warn('[Firestore Room Listeners] Fallback active:', err?.message || err);
    }
  }

  async function refreshRoomsAndUsersViaHttp() {
    if (!session.active || !session.apiFetch) return;
    try {
      const data = await session.apiFetch('/api/chat/heartbeat', {
        method: 'POST',
        body: {
          roomId: session.roomId,
          includeMessages: false,
          lastMsgId: session.lastMsgId,
          typingInRoom: session.typingInRoom
        }
      });
      applyHeartbeatPayload(data);
    } catch {
      // silent retry on next tick
    }
  }

  function applyHeartbeatPayload(data) {
    if (!data || !session.active) return;
    const cb = session.callbacks || {};
    if (data.user && typeof cb.onSessionPatch === 'function') cb.onSessionPatch(data.user);
    if ((typeof data.isRoomManager === 'boolean' || typeof data.canStyleRoom === 'boolean') && typeof cb.onRoomPermissions === 'function') {
      cb.onRoomPermissions({ isRoomManager: Boolean(data.isRoomManager), canStyleRoom: Boolean(data.canStyleRoom) });
    }
    if (data.userState) handleUserStateSnapshot(data.userState);
    if (Array.isArray(data.rooms) && typeof cb.onRooms === 'function') cb.onRooms(data.rooms);
    if (Array.isArray(data.roomUsers) && typeof cb.onRoomUsers === 'function') cb.onRoomUsers(data.roomUsers, data.roomKingKey || null);
    if (Array.isArray(data.globalOnlineUsers) && typeof cb.onGlobalOnlineUsers === 'function') cb.onGlobalOnlineUsers(data.globalOnlineUsers);
    if (Array.isArray(data.persistentMembers) && typeof cb.onPersistentMembers === 'function') cb.onPersistentMembers(data.persistentMembers);
    if (Array.isArray(data.mics) && typeof cb.onRoomMics === 'function') cb.onRoomMics(data.roomId || session.roomId, data.mics);
    if (Array.isArray(data.typingUsers) && typeof cb.onTypingUsers === 'function') cb.onTypingUsers(data.typingUsers);
    if (Array.isArray(data.ranks) && typeof cb.onRanks === 'function') cb.onRanks(data.ranks);
    if (data.settings && typeof cb.onSettings === 'function') cb.onSettings(data.settings);
    if (Array.isArray(data.messages) && data.messages.length && typeof cb.onDeltaMessages === 'function') {
      const maxId = Number(data.messages[data.messages.length - 1]?.id) || 0;
      if (maxId > session.lastMsgId) session.lastMsgId = maxId;
      cb.onDeltaMessages(data.messages, data.roomId || session.roomId);
    }
    if (Array.isArray(data.webrtcSignals) && data.webrtcSignals.length && typeof cb.onWebRtcSignal === 'function') {
      const ackIds = [];
      for (const sig of data.webrtcSignals) {
        if (!sig || !sig.id || session.seenWebRtcIds.has(sig.id)) continue;
        session.seenWebRtcIds.add(sig.id);
        ackIds.push(sig.id);
        cb.onWebRtcSignal(sig);
      }
      if (ackIds.length && session.apiFetch) {
        session.apiFetch('/api/chat/webrtc/signal/ack', { method: 'POST', body: { ids: ackIds } }).catch(() => {});
      }
    }
    if (typeof data.unreadPmCount === 'number' && typeof cb.onUnreadPmCount === 'function') {
      cb.onUnreadPmCount(data.unreadPmCount);
    }
    if (typeof data.unreadNotifCount === 'number' && typeof cb.onUnreadNotifCount === 'function') {
      cb.onUnreadNotifCount(data.unreadNotifCount);
    }
  }

  async function syncBootstrap(roomId) {
    if (!session.active || !session.apiFetch) return null;
    const targetRoom = roomId || session.roomId || 'general';
    const data = await session.apiFetch(`/api/chat/bootstrap?roomId=${encodeURIComponent(targetRoom)}`);
    if (data && data.room?.id) {
      session.roomId = data.room.id;
    }
    if (Array.isArray(data?.messages) && data.messages.length) {
      session.lastMsgId = Number(data.messages[data.messages.length - 1]?.id) || 0;
    } else {
      session.lastMsgId = 0;
    }
    if (typeof session.callbacks.onBootstrap === 'function') {
      session.callbacks.onBootstrap(data);
    }
    return data;
  }

  async function syncSocialState() {
    if (!session.active || !session.apiFetch) return null;
    try {
      const res = await session.apiFetch('/api/social/state');
      if (typeof session.callbacks.onSocialState === 'function') {
        session.callbacks.onSocialState(res);
      }
      return res;
    } catch {
      return null;
    }
  }

  function scheduleLoops() {
    if (session.heartbeatTimer) clearInterval(session.heartbeatTimer);
    if (session.socialTimer) clearInterval(session.socialTimer);

    const hbMs = session.firestoreActive ? 9000 : 3500;
    session.heartbeatTimer = setInterval(async () => {
      if (!session.active || !session.apiFetch) return;
      try {
        const res = await session.apiFetch('/api/chat/heartbeat', {
          method: 'POST',
          body: {
            roomId: session.roomId,
            includeMessages: true,
            lastMsgId: session.lastMsgId,
            typingInRoom: session.typingInRoom
          }
        });
        applyHeartbeatPayload(res);
      } catch {
        // silent background retry; never display disconnect banner
      }
    }, hbMs);

    const socialMs = session.firestoreActive ? 14000 : 6000;
    session.socialTimer = setInterval(() => {
      syncSocialState();
    }, socialMs);
  }

  async function start({ token, user, roomId = 'general', firebaseWebConfig = null, apiFetch, callbacks = {} }) {
    stop({ keepServerPresence: true });
    session.active = true;
    session.token = token || '';
    session.user = user || null;
    session.roomId = roomId || 'general';
    session.apiFetch = apiFetch;
    session.callbacks = callbacks || {};
    session.lastMsgId = 0;
    session.typingInRoom = '';
    session.seenWebRtcIds.clear();
    session.lastGoldRainAt = 0;
    session.lastForcedMoveAt = 0;
    session.lastWarningAt = 0;
    session.lastKickedAt = 0;
    session.lastForcedNameAt = 0;
    session.lastAvatarClearedAt = 0;

    if (firebaseWebConfig?.apiKey) {
      await ensureFirebaseWebSdk(firebaseWebConfig);
      attachFirestoreGlobalListeners();
    }

    const boot = await syncBootstrap(session.roomId);
    attachFirestoreRoomListeners(session.roomId);
    scheduleLoops();
    if (typeof session.callbacks.onConnected === 'function') {
      session.callbacks.onConnected(boot);
    }
    return boot;
  }

  async function switchRoom(roomId, password = '') {
    if (!session.active || !session.apiFetch) return { error: 'الجلسة غير نشطة' };
    const res = await session.apiFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/join`, {
      method: 'POST',
      body: { password }
    });
    if (res && !res.error) {
      session.roomId = res.room?.id || roomId;
      session.lastMsgId = Array.isArray(res.messages) && res.messages.length
        ? Number(res.messages[res.messages.length - 1]?.id) || 0
        : 0;
      attachFirestoreRoomListeners(session.roomId);
    }
    return res;
  }

  async function triggerHeartbeatNow(includeMessages = true) {
    if (!session.active || !session.apiFetch) return null;
    const res = await session.apiFetch('/api/chat/heartbeat', {
      method: 'POST',
      body: {
        roomId: session.roomId,
        includeMessages,
        lastMsgId: session.lastMsgId,
        typingInRoom: session.typingInRoom
      }
    });
    applyHeartbeatPayload(res);
    return res;
  }

  function setTyping(isTyping) {
    if (!session.active || !session.apiFetch) return;
    const nextRoom = isTyping ? session.roomId : '';
    if (session.typingInRoom === nextRoom) return;
    session.typingInRoom = nextRoom;
    session.apiFetch('/api/chat/typing', {
      method: 'POST',
      body: { roomId: session.roomId, isTyping: Boolean(isTyping) }
    }).catch(() => {});
  }

  function updateUser(nextUser) {
    session.user = nextUser || session.user;
  }

  function stop({ keepServerPresence = false } = {}) {
    if (!keepServerPresence && session.active && session.apiFetch && session.token) {
      session.apiFetch('/api/chat/logout', { method: 'POST', body: {} }).catch(() => {});
    }
    session.active = false;
    clearUnsubs(session.roomUnsubs);
    clearUnsubs(session.unsubs);
    session.firestoreActive = false;
    if (session.heartbeatTimer) {
      clearInterval(session.heartbeatTimer);
      session.heartbeatTimer = null;
    }
    if (session.socialTimer) {
      clearInterval(session.socialTimer);
      session.socialTimer = null;
    }
  }

  globalScope.AsilRealtime = {
    FIREBASE_PROJECT_ID,
    FIRESTORE_DATABASE_ID,
    ensureFirebaseWebSdk,
    signInWithGoogle,
    start,
    switchRoom,
    syncBootstrap,
    syncSocialState,
    triggerHeartbeatNow,
    setTyping,
    updateUser,
    stop,
    isFirestoreSdkActive: () => session.firestoreActive
  };
})(window);
