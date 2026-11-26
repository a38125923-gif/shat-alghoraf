(function () {
  'use strict';

  const DEFAULT_ICON_PRESETS = [
    '👑', '💎', '⭐', '🏆', '🛡️', '🦅', '⚜️', '🔥',
    '✨', '🎖️', '🔰', '💫', '🐉', '🦁', '🌟', '💍'
  ];

  const DEFAULT_BADGE_STYLES = [
    { id: 'gold_crown', label: 'تاج ذهبي ملكي مرصّع', iconClass: 'fa-solid fa-crown' },
    { id: 'crown_royal', label: 'تاج السيادة الملكي', iconClass: 'fa-solid fa-crown' },
    { id: 'ruby_crown', label: 'تاج الياقوت الأحمر', iconClass: 'fa-solid fa-crown' },
    { id: 'silver_crown', label: 'تاج فضي لامع', iconClass: 'fa-solid fa-crown' },
    { id: 'royal_trophy', label: 'كأس البطولة الذهبي', iconClass: 'fa-solid fa-trophy' },
    { id: 'diamond_trophy', label: 'كأس الماس الملكي', iconClass: 'fa-solid fa-trophy' },
    { id: 'emerald_trophy', label: 'كأس الزمرد المتلألئ', iconClass: 'fa-solid fa-trophy' },
    { id: 'gold_star', label: 'نجمة ذهبية متلألئة', iconClass: 'fa-solid fa-star' },
    { id: 'sapphire_star', label: 'نجمة الياقوت الزرقاء', iconClass: 'fa-solid fa-star' },
    { id: 'royal_shield', label: 'درع ذهبي ملكي', iconClass: 'fa-solid fa-shield-halved' },
    { id: 'silver_shield', label: 'درع الحماية الفضي', iconClass: 'fa-solid fa-shield' },
    { id: 'diamond_gem', label: 'ماسة براقة', iconClass: 'fa-solid fa-gem' },
    { id: 'vip_wings', label: 'أجنحة VIP ملكية', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'silver_wing', label: 'جناح فضي لامع', iconClass: 'fa-solid fa-dove' },
    { id: 'gold_eagle', label: 'نسر ذهبي مجنح', iconClass: 'fa-solid fa-feather-pointed' },
    { id: 'neon_badge', label: 'شارة نيون حديثة', iconClass: 'fa-solid fa-certificate' },
    { id: 'diamond_medal', label: 'وسام ماسي متوهج', iconClass: 'fa-solid fa-gem' }
  ];

  const DEFAULT_RANK_SVGS = {
    gold_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#f59e0b" stroke="#78350f" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.4" fill="#ef4444"/><circle cx="4.5" cy="7.5" r="1.1" fill="#38bdf8"/><circle cx="19.5" cy="7.5" r="1.1" fill="#38bdf8"/></svg>',
    crown_royal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#eab308" stroke="#713f12" stroke-width="1" d="M2.5 18.5h19L20 8l-4.8 4.2L12 4.5 8.8 12.2 4 8l-1.5 10.5zM4 20.5h16v1.8H4z"/><circle cx="12" cy="14" r="1.5" fill="#dc2626"/></svg>',
    ruby_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#e11d48" stroke="#881337" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.4" fill="#fef08a"/><circle cx="12" cy="13.5" r="1.4" fill="#fde047"/></svg>',
    silver_crown: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#e2e8f0" stroke="#334155" stroke-width="1" d="M3 18h18l-1.5-9.5-4.5 4L12 5l-3 7.5-4.5-4L3 18zm1 2h16v1.8H4z"/><circle cx="12" cy="4.2" r="1.3" fill="#38bdf8"/></svg>',
    royal_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#f59e0b" stroke="#78350f" stroke-width="1" d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path fill="none" stroke="#fbbf24" stroke-width="1.5" d="M6 6H3.5a2 2 0 0 0 0 4H6M18 6h2.5a2 2 0 0 1 0 4H18"/><path fill="#d97706" d="M10.5 14h3v4h3v2.5h-9V18h3z"/><circle cx="12" cy="8.2" r="1.5" fill="#fef08a"/></svg>',
    diamond_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#0c4a6e" stroke-width="1" d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path fill="none" stroke="#7dd3fc" stroke-width="1.5" d="M6 6H3.5a2 2 0 0 0 0 4H6M18 6h2.5a2 2 0 0 1 0 4H18"/><path fill="#0284c7" d="M10.5 14h3v4h3v2.5h-9V18h3z"/><polygon points="12,6 14,8.5 12,11 10,8.5" fill="#ffffff"/></svg>',
    emerald_trophy: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#10b981" stroke="#064e3b" stroke-width="1" d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path fill="none" stroke="#34d399" stroke-width="1.5" d="M6 6H3.5a2 2 0 0 0 0 4H6M18 6h2.5a2 2 0 0 1 0 4H18"/><path fill="#059669" d="M10.5 14h3v4h3v2.5h-9V18h3z"/><circle cx="12" cy="8.2" r="1.5" fill="#d1fae5"/></svg>',
    gold_star: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#facc15" stroke="#92400e" stroke-width="1.1" d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
    sapphire_star: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#1e3a8a" stroke-width="1.1" d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z"/><circle cx="12" cy="11.5" r="1.8" fill="#e0f2fe"/></svg>',
    royal_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#1e293b" stroke="#fbbf24" stroke-width="1.8" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="#fbbf24" d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/></svg>',
    silver_shield: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#cbd5e1" stroke="#1e293b" stroke-width="1.3" d="M12 2.5 4.5 5.6v6.2c0 4.9 3.2 8.7 7.5 9.9 4.3-1.2 7.5-5 7.5-9.9V5.6L12 2.5z"/><path fill="#0ea5e9" d="M12 6.5l3 5.5-3 5.5-3-5.5z"/></svg>',
    diamond_gem: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#38bdf8" stroke="#1e40af" stroke-width="1" d="M6.5 3.5h11l4 5.5L12 21 2.5 9l4-5.5z"/><path fill="rgba(255,255,255,0.45)" d="M6.5 3.5 9 9l3-5.5zm5.5 0L9 9h6z"/></svg>',
    diamond_medal: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#a855f7" stroke="#312e81" stroke-width="1" d="M7 3h10l4 5.5L12 21 3 8.5 7 3z"/><path fill="rgba(255,255,255,0.4)" d="M7 3l2.5 5.5L12 3z"/></svg>',
    vip_wings: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#f59e0b" stroke="#7c2d12" stroke-width="0.8" d="M2 7c4 0 6.5 2.5 8 5.5-2.5.8-5.5.2-7-2.2 1.2 2.5 3.8 4 6.5 4.2-2.2 1-4.5.7-6-.8.8 1.8 3.2 2.8 5.5 2.5L12 19l3-2.8c2.3.3 4.7-.7 5.5-2.5-1.5 1.5-3.8 1.8-6 .8 2.7-.2 5.3-1.7 6.5-4.2-1.5 2.4-4.5 3-7 2.2 1.5-3 4-5.5 8-5.5-4.5-.8-8 1-10 4.2C10 8 6.5 6.2 2 7z"/><circle cx="12" cy="11" r="2.2" fill="#facc15" stroke="#7c2d12" stroke-width="0.7"/></svg>',
    silver_wing: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#e2e8f0" stroke="#475569" stroke-width="0.9" d="M3 8c4.5 0 7.5 2.8 9 6-2.5.8-5.5.1-7-2 1.4 2.5 4 3.8 6.5 4-2.2 1-4.6.6-6-.8.9 1.8 3.4 2.7 5.8 2.3L12 19l8.5-7c-3.5-.3-6.5 1-8.5 3.3C10.5 10.5 7 7.7 3 8z"/></svg>',
    gold_eagle: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#fbbf24" stroke="#78350f" stroke-width="0.9" d="M12 4l2.2 3.2 7.3-1.7-3.5 5 2 3-5.2-1.2L12 20.5 9.2 12.3 4 13.5l2-3-3.5-5 7.3 1.7z"/></svg>',
    neon_badge: '<svg viewBox="0 0 24 24" class="rank-svg-ico" aria-hidden="true"><path fill="#ec4899" stroke="#ffffff" stroke-width="0.9" d="M12 2l2.3 2.7 3.5-.5.8 3.4 3.2 1.5-1.3 3.3 1.3 3.3-3.2 1.5-.8 3.4-3.5-.5L12 22l-2.3-2.7-3.5.5-.8-3.4-3.2-1.5 1.3-3.3-1.3-3.3 3.2-1.5.8-3.4 3.5.5z"/><path fill="#ffffff" d="M12 7.5l1.3 2.9 3.1.4-2.2 2.2.5 3.1-2.7-1.5-2.7 1.5.5-3.1-2.2-2.2 3.1-.4z"/></svg>'
  };

  function ensureAdminModalCss() {
    if (document.getElementById('asilAdminDynamicCss')) return;
    const st = document.createElement('style');
    st.id = 'asilAdminDynamicCss';
    st.textContent = `
      .adm-store-gift-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;background:rgba(15,23,42,0.78);border:1px solid rgba(148,163,184,0.2);}
      .adm-ban-badge-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(239,68,68,0.2);border:1px solid rgba(248,113,113,0.45);color:#fca5a5;font-size:11px;font-weight:800;}
      .adm-shell-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(135deg,#090d16,#1e293b);border-bottom:1px solid rgba(245,158,11,0.3);border-radius:16px 16px 0 0;}
      .adm-standalone-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px;background:rgba(15,23,42,0.92);border-bottom:1px solid rgba(148,163,184,0.18);}
      .adm-standalone-body{padding:16px;display:flex;flex-direction:column;gap:12px;}
      .owner-emergency-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:linear-gradient(135deg,rgba(127,29,29,0.28),rgba(15,23,42,0.95));border-bottom:1px solid rgba(248,113,113,0.35);}
      .owner-emergency-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#fecaca;}
      .owner-emergency-actions{display:flex;flex-wrap:wrap;gap:6px;}
      .owner-em-btn{min-height:36px;padding:6px 10px;border-radius:10px;border:1px solid rgba(148,163,184,0.28);background:rgba(30,41,59,0.92);color:#f8fafc;font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
      .owner-em-btn.is-alert{background:rgba(185,28,28,0.85);border-color:rgba(252,165,165,0.55);color:#fff;}
      .owner-em-btn.is-ok{background:rgba(15,118,110,0.45);border-color:rgba(45,212,191,0.45);color:#ccfbf1;}
      .adm-assignable-roles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:6px;margin-top:6px;padding:8px;border-radius:10px;background:rgba(15,23,42,0.65);border:1px solid rgba(148,163,184,0.18);}
      .adm-full-edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px;margin-bottom:8px;}
      .adm-media-ctrl-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px;border-radius:10px;background:rgba(15,23,42,0.62);border:1px solid rgba(148,163,184,0.18);margin-bottom:6px;}
      .adm-media-ctrl-row img{width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid rgba(251,191,36,0.35);}
      .radar-table-wrap{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
      .radar-row-card{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(15,23,42,0.84);border:1px solid rgba(56,189,248,0.22);}
      .radar-meta-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;font-size:11.5px;color:#cbd5e1;}
      .radar-meta-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(30,41,59,0.9);border:1px solid rgba(148,163,184,0.2);}
      .adm-violation-card{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(69,10,10,0.38);border:1px solid rgba(248,113,113,0.35);}
      .adm-violation-word{display:inline-block;padding:2px 8px;border-radius:8px;background:rgba(220,38,38,0.3);color:#fecaca;font-weight:800;font-size:11.5px;margin-top:4px;}
      @media (max-width:640px){
        .adm-standalone-tabs{flex-wrap:nowrap;overflow-x:auto;padding:10px 10px;}
        .adm-standalone-tabs .adm-tab{flex-shrink:0;white-space:nowrap;}
        .adm-standalone-body{padding:10px;}
        .owner-emergency-bar{padding:8px 10px;}
        .owner-em-btn{flex:1 1 calc(50% - 6px);justify-content:center;}
      }
    `;
    document.head.appendChild(st);
  }

  function createStandaloneContext(opts = {}) {
    const tokenKey = 'arabic_chat_token_v3';
    const devKey = 'arabic_chat_device_id_v1';
    let token = String(opts.token || localStorage.getItem(tokenKey) || '');
    const deviceId = String(opts.deviceId || localStorage.getItem(devKey) || `adm_${Math.random().toString(36).slice(2, 10)}`);

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function showToast(msg, isErr = false) {
      if (typeof opts.showToast === 'function') return opts.showToast(msg, isErr);
      let box = document.getElementById('toastContainer');
      if (!box) {
        box = document.createElement('div');
        box.id = 'toastContainer';
        box.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:340px;';
        document.body.appendChild(box);
      }
      const item = document.createElement('div');
      item.style.cssText = `padding:10px 14px;border-radius:12px;font-weight:700;font-size:13px;color:#fff;background:${isErr ? '#b91c1c' : '#0f766e'};box-shadow:0 8px 24px rgba(0,0,0,0.45);`;
      item.textContent = msg;
      box.appendChild(item);
      setTimeout(() => item.remove(), 3200);
    }

    async function api(url, reqOpts = {}) {
      const headers = {
        'X-Device-Id': deviceId,
        'X-Client-Fingerprint': deviceId,
        ...(reqOpts.headers || {})
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      let body = reqOpts.body;
      if (body && !(body instanceof FormData) && typeof body !== 'string') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      const res = await fetch(url, { method: reqOpts.method || 'GET', headers, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    }

    const st = {
      token,
      deviceId,
      fingerprint: deviceId,
      user: opts.user || null,
      ranks: [],
      rooms: [],
      settings: {},
      currentRoom: { id: 'general', name: 'الغرفة العامة' },
      activeAdminTab: 'ranks_matrix',
      activeAdminSubTab: {},
      editingRankKey: null,
      editingRoomId: null,
      editingQuizQuestionId: null,
      editingCustomDrawerId: null,
      welcomeBotDraft: null,
      giftsDraft: null,
      adminOverview: null,
      ownerSuite: null,
      shopItems: { frames: [], rankBadgeStyles: DEFAULT_BADGE_STYLES }
    };

    const getRank = (rk) => st.ranks.find((r) => r.key === rk) || (
      rk === 'guest'
        ? {
            key: 'guest',
            label: 'زائر',
            icon: '👤',
            bg_color: '#475569',
            text_color: '#f8fafc',
            power: 1,
            permissions: {}
          }
        : {
            key: rk || 'member',
            label: rk === 'site_owner' ? 'مالك الموقع' : 'عضو',
            icon: rk === 'site_owner' ? '👑' : '⭐',
            bg_color: '#334155',
            text_color: '#ffffff',
            power: rk === 'site_owner' ? 15 : 5,
            permissions: {}
          }
    );

    const hasPerm = (p) => {
      if (st.user?.role === 'site_owner' || st.user?.isSupremeOwner) return true;
      return Boolean(getRank(st.user?.role)?.permissions?.[p]);
    };

    const roleBadgeHTML = (rk) => {
      const r = getRank(rk);
      return `<span class="rank-pill" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;background:${escapeHtml(r.bg_color || '#334155')};color:${escapeHtml(r.text_color || '#fff')};">${r.image_url ? `<img src="${escapeHtml(r.image_url)}" style="width:16px;height:16px;object-fit:contain;border-radius:4px;" alt="" />` : escapeHtml(r.icon || '⭐')} ${escapeHtml(r.label || rk)}</span>`;
    };

    const formatRemainingMmSs = (ms) => {
      const sec = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return {
      isStandalone: true,
      state: st,
      api,
      escapeHtml,
      showToast,
      getRank,
      hasPerm,
      roleBadgeHTML,
      formatRemainingMmSs,
      applySiteSettings: (settings) => {
        if (settings) st.settings = { ...st.settings, ...settings };
      },
      renderUserIdentity: () => {},
      showCinematicEntrance: () => {},
      syncLocalMirror: () => {},
      RANK_ICON_PRESETS: DEFAULT_ICON_PRESETS,
      RANK_BADGE_STYLES: DEFAULT_BADGE_STYLES,
      BUILT_IN_RANK_SVGS: DEFAULT_RANK_SVGS
    };
  }

  function normalizeAdminTabTarget(rawTab, subOverride = null) {
    const t = String(rawTab || 'ranks_matrix');
    if (['ranks_matrix', 'protection', 'store_gifts', 'members_control', 'quiz_bot', 'welcome_bot', 'ads_manager', 'bans_mutes', 'audit_log', 'owner_tools'].includes(t)) {
      return { tab: t, sub: subOverride || null };
    }
    if (t === 'ads') return { tab: 'ads_manager', sub: null };
    if (t === 'ranks') return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
    if (t === 'master_matrix') return { tab: 'ranks_matrix', sub: subOverride || 'matrix' };
    if (t === 'store_mgr') return { tab: 'store_gifts', sub: subOverride || 'frames' };
    if (t === 'stats') return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
    if (t === 'rooms') return { tab: 'protection', sub: subOverride || 'rooms' };
    if (t === 'bans') return { tab: 'protection', sub: subOverride || 'bans' };
    if (t === 'bank') return { tab: 'members_control', sub: subOverride || 'bank' };
    if (t === 'cms' || t === 'news' || t === 'emojis') return { tab: 'members_control', sub: subOverride || 'appearance' };
    if (t === 'users' || t === 'owner_suite') return { tab: 'members_control', sub: subOverride || 'detector' };
    return { tab: 'ranks_matrix', sub: subOverride || 'creator' };
  }

  function ensureModalElement(ctx) {
    let modal = document.getElementById('adminModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-card wide-modal dark-admin-modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-crown" style="color:#F59E0B"></i> مركز القيادة والإدارة الموحّد</h3>
          <button type="button" class="icon-btn" id="closeAdminModalBtn" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="admin-tabs" id="adminModalTabsBar">
          <button type="button" class="adm-tab active" data-adm-tab="ranks_matrix"><i class="fa-solid fa-crown"></i> الرتب والصلاحيات</button>
          <button type="button" class="adm-tab" data-adm-tab="protection"><i class="fa-solid fa-shield-halved"></i> الغرف والحماية</button>
          <button type="button" class="adm-tab" data-adm-tab="members_control"><i class="fa-solid fa-users-gear"></i> الأعضاء والمظهر</button>
          <button type="button" class="adm-tab" data-adm-tab="bans_mutes"><i class="fa-solid fa-ban"></i> الحظر والكتم</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="store_gifts"><i class="fa-solid fa-store"></i> المتجر والهدايا</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="quiz_bot"><i class="fa-solid fa-robot"></i> المسابقات</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="welcome_bot"><i class="fa-solid fa-wand-magic-sparkles"></i> البوت الترحيبي</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="ads_manager"><i class="fa-solid fa-rectangle-ad"></i> إدارة الإعلانات</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="audit_log"><i class="fa-solid fa-clipboard-list"></i> السجل والرادار</button>
          <button type="button" class="adm-tab v-owner hidden" data-adm-tab="owner_tools"><i class="fa-solid fa-database"></i> النسخ والأدوات</button>
        </div>
        <div id="ownerEmergencyBar" class="owner-emergency-bar hidden"></div>
        <div id="adminModalBody" class="modal-body-scroll"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeAdminModalBtn')?.addEventListener('click', () => {
      if (typeof ctx.closeModal === 'function') ctx.closeModal('adminModal');
      else modal.classList.add('hidden');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (typeof ctx.closeModal === 'function') ctx.closeModal('adminModal');
        else modal.classList.add('hidden');
      }
    });
    modal.querySelectorAll('.adm-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx.renderTab(btn.dataset.admTab);
      });
    });
    return modal;
  }

  function createRenderer(rawCtx) {
    ensureAdminModalCss();
    const state = rawCtx.state;
    const api = rawCtx.api;
    const showToast = rawCtx.showToast;
    const escapeHtml = rawCtx.escapeHtml;
    const getRank = rawCtx.getRank;
    const hasPerm = rawCtx.hasPerm;
    const roleBadgeHTML = rawCtx.roleBadgeHTML;
    const formatRemainingMmSs = rawCtx.formatRemainingMmSs;
    const RANK_ICON_PRESETS = rawCtx.RANK_ICON_PRESETS || DEFAULT_ICON_PRESETS;
    const RANK_BADGE_STYLES = rawCtx.RANK_BADGE_STYLES || DEFAULT_BADGE_STYLES;
    const BUILT_IN_RANK_SVGS = rawCtx.BUILT_IN_RANK_SVGS || DEFAULT_RANK_SVGS;
    const $ = (id) => document.getElementById(id);

    let activeBodyEl = null;
    let activeTabsContainer = null;

    function isSafeHttpsOrLocalUrlClient(rawUrl, allowDataImage = true) {
      const val = String(rawUrl || '').trim();
      if (!val) return true;
      if (val.startsWith('/')) return !val.startsWith('//');
      if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(val)) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }

    function countryFlagEmoji(rawCountry) {
      const c = String(rawCountry || '').trim();
      if (!c) return '🌐';
      if (/^[A-Za-z]{2}$/.test(c)) {
        const code = c.toUpperCase();
        return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1));
      }
      const map = [
        [/السعودية|saudi|\bsa\b/i, '🇸🇦'],
        [/مصر|egypt|\beg\b/i, '🇪🇬'],
        [/الإمارات|الامارات|uae|\bae\b/i, '🇦🇪'],
        [/الكويت|kuwait|\bkw\b/i, '🇰🇼'],
        [/قطر|qatar|\bqa\b/i, '🇶🇦'],
        [/البحرين|bahrain|\bbh\b/i, '🇧🇭'],
        [/عمان|oman|\bom\b/i, '🇴🇲'],
        [/الأردن|الاردن|jordan|\bjo\b/i, '🇯🇴'],
        [/العراق|iraq|\biq\b/i, '🇮🇶'],
        [/سوريا|syria|\bsy\b/i, '🇸🇾'],
        [/لبنان|lebanon|\blb\b/i, '🇱🇧'],
        [/فلسطين|palestine|\bps\b/i, '🇵🇸'],
        [/اليمن|yemen|\bye\b/i, '🇾🇪'],
        [/المغرب|morocco|\bma\b/i, '🇲🇦'],
        [/الجزائر|algeria|\bdz\b/i, '🇩🇿'],
        [/تونس|tunisia|\btn\b/i, '🇹🇳'],
        [/ليبيا|libya|\bly\b/i, '🇱🇾'],
        [/السودان|sudan|\bsd\b/i, '🇸🇩'],
        [/تركيا|turkey|\btr\b/i, '🇹🇷'],
        [/أمريكا|usa|united states|\bus\b/i, '🇺🇸'],
        [/بريطانيا|uk|britain|\bgb\b/i, '🇬🇧'],
        [/ألمانيا|germany|\bde\b/i, '🇩🇪'],
        [/فرنسا|france|\bfr\b/i, '🇫🇷']
      ];
      for (const [rx, flag] of map) {
        if (rx.test(c)) return flag;
      }
      return '🌍';
    }

    function parseUaDeviceAndBrowser(uaRaw) {
      const ua = String(uaRaw || '');
      let device = '💻 كمبيوتر';
      if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) device = '📱 تابلت';
      else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) device = '📱 موبايل';
      let browser = 'متصفح آخر';
      if (/edg\//i.test(ua)) browser = 'Edge';
      else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
      else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Browser';
      else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
      else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
      else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
      return { device, browser };
    }

    function canAccessAdminTab(tab, isOwner) {
      if (isOwner) return true;
      const myPower = Number(getRank(state.user?.role)?.power || 0);
      const canBank = state.user?.role === 'co_owner' || myPower >= 14;
      switch (tab) {
        case 'ranks_matrix':
          return false;
        case 'protection':
          return hasPerm('manage_rooms') || hasPerm('ban') || hasPerm('mute');
        case 'members_control':
          return hasPerm('set_rank') || hasPerm('give_coins') || hasPerm('ban') || hasPerm('mute') || hasPerm('kick') || hasPerm('publish_news') || hasPerm('access_panel') || canBank;
        case 'bans_mutes':
          return hasPerm('ban') || hasPerm('mute');
        case 'store_gifts':
        case 'quiz_bot':
        case 'welcome_bot':
        case 'ads_manager':
        case 'audit_log':
        case 'owner_tools':
          return false;
        default:
          return false;
      }
    }

    function resolveAllowedAdminTab(wantedTab, isOwner) {
      if (canAccessAdminTab(wantedTab, isOwner)) return wantedTab;
      const order = ['members_control', 'protection', 'bans_mutes', 'ranks_matrix', 'store_gifts', 'quiz_bot', 'welcome_bot', 'ads_manager', 'audit_log', 'owner_tools'];
      return order.find((t) => canAccessAdminTab(t, isOwner)) || 'members_control';
    }

    function buildAssignableRankOptions(selectedKey) {
      const isOwner = state.user?.role === 'site_owner' || Boolean(state.user?.isSupremeOwner);
      const myRank = getRank(state.user?.role);
      const explicitList = Array.isArray(myRank?.assignable_roles) ? myRank.assignable_roles : [];
      const ceiling = isOwner ? 15 : (state.adminOverview?.stats?.myMaxAssignablePower ?? Number(myRank?.max_assignable_rank || 0));
      return (state.ranks || [])
        .filter((r) => r.key !== 'guest' && (isOwner || r.key === selectedKey || (r.key !== 'site_owner' && (r.power <= ceiling || explicitList.includes(r.key)))))
        .map((r) => `<option value="${escapeHtml(r.key)}" ${r.key === selectedKey ? 'selected' : ''}>${r.icon && r.icon !== '⭐' ? `${escapeHtml(r.icon)} ` : ''}${escapeHtml(r.label)} (قوة ${r.power})</option>`)
        .join('');
    }

    function renderOwnerEmergencyBar(isOwner, ov, suite) {
      const barEl = rawCtx.isStandalone ? $('standaloneOwnerEmergencyBar') : $('ownerEmergencyBar');
      if (!barEl) return;
      if (!isOwner) {
        barEl.innerHTML = '';
        barEl.classList.add('hidden');
        return;
      }
      const prot = suite?.protections || ov?.settings || state.settings || {};
      const guestsOpen = Number(prot.allow_guests ?? 1) !== 0;
      const registerOpen = Number(prot.allow_register ?? 1) !== 0;
      const globalMuteOn = Number(prot.global_chat_mute ?? 0) === 1;
      barEl.classList.remove('hidden');
      barEl.innerHTML = `
        <div class="owner-emergency-title"><i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i> طوارئ المالك الفورية</div>
        <div class="owner-emergency-actions">
          <button type="button" id="emToggleGuestsBtn" class="owner-em-btn ${guestsOpen ? 'is-ok' : 'is-alert'}" data-next="${guestsOpen ? '0' : '1'}">
            <i class="fa-solid ${guestsOpen ? 'fa-door-open' : 'fa-lock'}"></i> ${guestsOpen ? 'قفل دخول الزوار' : 'فتح دخول الزوار (مقفل)'}
          </button>
          <button type="button" id="emToggleRegisterBtn" class="owner-em-btn ${registerOpen ? 'is-ok' : 'is-alert'}" data-next="${registerOpen ? '0' : '1'}">
            <i class="fa-solid ${registerOpen ? 'fa-user-plus' : 'fa-user-lock'}"></i> ${registerOpen ? 'قفل تسجيل الحسابات' : 'فتح تسجيل الحسابات (مقفل)'}
          </button>
          <button type="button" id="emToggleGlobalMuteBtn" class="owner-em-btn ${globalMuteOn ? 'is-alert' : 'is-ok'}" data-next="${globalMuteOn ? '0' : '1'}">
            <i class="fa-solid ${globalMuteOn ? 'fa-volume-xmark' : 'fa-volume-high'}"></i> ${globalMuteOn ? 'إلغاء الكتم الشامل (مفعّل)' : 'الكتم الشامل للدردشة'}
          </button>
          <button type="button" id="emClearAllRoomsBtn" class="owner-em-btn is-alert">
            <i class="fa-solid fa-broom"></i> تنظيف جميع الغرف دفعة واحدة
          </button>
        </div>
      `;
      $('emToggleGuestsBtn')?.addEventListener('click', () => {
        const nextVal = $('emToggleGuestsBtn')?.dataset.next === '1';
        runOwnerCmdAction({ action: 'toggle_emergency', field: 'allow_guests', enabled: nextVal }, nextVal ? 'تم فتح دخول الزوار.' : 'تم قفل دخول الزوار مؤقتاً.');
      });
      $('emToggleRegisterBtn')?.addEventListener('click', () => {
        const nextVal = $('emToggleRegisterBtn')?.dataset.next === '1';
        runOwnerCmdAction({ action: 'toggle_emergency', field: 'allow_register', enabled: nextVal }, nextVal ? 'تم فتح تسجيل الحسابات الجديدة.' : 'تم قفل تسجيل الحسابات الجديدة.');
      });
      $('emToggleGlobalMuteBtn')?.addEventListener('click', () => {
        const nextVal = $('emToggleGlobalMuteBtn')?.dataset.next === '1';
        runOwnerCmdAction({ action: 'toggle_emergency', field: 'global_chat_mute', enabled: nextVal }, nextVal ? 'تم تفعيل الكتم الشامل للدردشة العامة!' : 'تم رفع الكتم الشامل عن الدردشة.');
      });
      $('emClearAllRoomsBtn')?.addEventListener('click', () => {
        if (!confirm('تنظيف وحذف رسائل جميع الغرف دفعة واحدة الآن؟')) return;
        runOwnerCmdAction({ action: 'clear_all_rooms' }, 'تم تنظيف جميع الغرف دفعة واحدة!');
      });
    }

    async function refreshPanel(tab, preselectRoomId = null, subOverride = null) {
      const isOwner = state.user?.role === 'site_owner' || Boolean(state.user?.isSupremeOwner);
      const { tab: rawNormTab, sub } = normalizeAdminTabTarget(tab || state.activeAdminTab, subOverride);
      const normTab = resolveAllowedAdminTab(rawNormTab, isOwner);
      state.activeAdminTab = normTab;
      if (sub) state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), [normTab]: sub };
      if (preselectRoomId !== undefined && preselectRoomId !== null) state.editingRoomId = preselectRoomId;
      else if (sub !== 'rooms') state.editingRoomId = null;
      if (normTab !== 'ranks_matrix') state.editingRankKey = null;
      state.welcomeBotDraft = null;
      state.giftsDraft = null;

      if (activeBodyEl) activeBodyEl.innerHTML = '<div class="muted" style="padding:18px;text-align:center;">جاري تحميل بيانات لوحة القيادة...</div>';
      try {
        const promises = [api('/api/admin/overview')];
        if (isOwner) promises.push(api('/api/owner/suite').catch(() => null));
        const [ov, suite] = await Promise.all(promises);
        state.adminOverview = ov;
        if (suite) state.ownerSuite = suite;
        if (ov?.ranks) state.ranks = ov.ranks;
        if (ov?.rooms) state.rooms = ov.rooms;
        if (ov?.settings && typeof rawCtx.applySiteSettings === 'function') rawCtx.applySiteSettings(ov.settings);
        syncOwnerTabVisibility();
        renderOwnerEmergencyBar(isOwner, ov, suite || state.ownerSuite);
        renderTab(normTab);
      } catch (err) {
        if (activeBodyEl) activeBodyEl.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
      }
    }

    function syncOwnerTabVisibility() {
      const isOwner = state.user?.role === 'site_owner' || Boolean(state.user?.isSupremeOwner);
      const container = activeTabsContainer || document;
      container.querySelectorAll('.adm-tab').forEach((b) => {
        const allowed = canAccessAdminTab(b.dataset.admTab, isOwner);
        b.classList.toggle('hidden', !allowed);
      });
    }

    async function runOwnerCmdAction(payload, okMsg, refreshTab = state.activeAdminTab, refreshSub = null) {
      try {
        const res = await api('/api/owner/action', { method: 'POST', body: payload });
        if (okMsg) showToast(okMsg);
        if (res?.settings && typeof rawCtx.applySiteSettings === 'function') rawCtx.applySiteSettings(res.settings);
        if (res?.ranks) state.ranks = res.ranks;
        await refreshPanel(refreshTab, state.editingRoomId || null, refreshSub);
        return res;
      } catch (err) {
        showToast(err.message, true);
        return null;
      }
    }

    function renderTab(rawTab) {
      const ov = state.adminOverview;
      const body = activeBodyEl;
      if (!ov || !body) return;
      const isOwner = state.user?.role === 'site_owner' || Boolean(state.user?.isSupremeOwner);
      const suite = state.ownerSuite || {};
      const { tab: rawNormTab, sub } = normalizeAdminTabTarget(rawTab);
      const tab = resolveAllowedAdminTab(rawNormTab, isOwner);
      state.activeAdminTab = tab;
      if (sub && !state.activeAdminSubTab?.[tab]) {
        state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), [tab]: sub };
      }
      const tabsWrap = activeTabsContainer || document;
      tabsWrap.querySelectorAll('.adm-tab').forEach((b) => b.classList.toggle('active', b.dataset.admTab === tab));

      if (tab === 'ranks_matrix') return renderRanksMatrixTab(body, ov, suite, isOwner);
      if (tab === 'protection') return renderProtectionTab(body, ov, suite, isOwner);
      if (tab === 'store_gifts') return renderStoreGiftsTab(body, ov, suite, isOwner);
      if (tab === 'quiz_bot') return renderQuizBotTab(body, ov, suite, isOwner);
      if (tab === 'welcome_bot') return renderWelcomeBotTab(body, ov, suite, isOwner);
      if (tab === 'ads_manager') return renderAdsManagerTab(body, ov, suite, isOwner);
      if (tab === 'members_control') return renderMembersControlTab(body, ov, suite, isOwner);
      if (tab === 'bans_mutes') return renderBansMutesTab(body, ov, suite, isOwner);
      if (tab === 'audit_log') return renderAuditLogTab(body, ov, suite, isOwner);
      if (tab === 'owner_tools') return renderOwnerToolsTab(body, ov, suite, isOwner);
    }

    function renderRanksMatrixTab(body, ov, suite, isOwner) {
      const s = ov.stats || {};
      const sub = state.activeAdminSubTab?.ranks_matrix || 'creator';
      const editRk = state.editingRankKey ? (ov.ranks || []).find((r) => r.key === state.editingRankKey) : null;
      const ep = editRk?.permissions || {};
      const isEditing = Boolean(editRk);
      const badgeStyles = state.shopItems?.rankBadgeStyles?.length ? state.shopItems.rankBadgeStyles : RANK_BADGE_STYLES;
      const rankPermDefs = [
        { key: 'pm', label: 'الرسائل الخاصة' },
        { key: 'chat_media', label: 'الصور والملصقات والصوت' },
        { key: 'mic', label: 'صعود المايك' },
        { key: 'youtube', label: 'يوتيوب الغرفة' },
        { key: 'wall', label: 'الحائط والمنشورات' },
        { key: 'gifts', label: 'إرسال الهدايا' },
        { key: 'use_addons', label: 'إضافات الملف والخط' },
        { key: 'immune', label: 'الحصانة ضد الكتم والطرد' },
        { key: 'delete_msg', label: 'حذف الرسائل' },
        { key: 'mute', label: 'الكتم' },
        { key: 'kick', label: 'الطرد' },
        { key: 'ban', label: 'الحظر' },
        { key: 'manage_rooms', label: 'إدارة الغرف' },
        { key: 'set_rank', label: 'تغيير الرتب' },
        { key: 'stealth', label: 'وضع التخفي' },
        { key: 'give_coins', label: 'منح روبي' },
        { key: 'clear_room', label: 'مسح الغرفة' },
        { key: 'access_panel', label: 'دخول لوحة التحكم' },
        { key: 'room_owner', label: 'إدارة الغرف كـ مالك غرفة' },
        { key: 'publish_news', label: 'نشر الأخبار' },
        { key: 'send_links', label: 'إرسال الروابط' },
        { key: 'change_name', label: 'تغيير الاسم المستعار' },
        { key: 'profile_music', label: 'رفع أغنية البروفايل 40 ثانية' }
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
        { id: 'room_owner', label: 'مالك غرفة' }, { id: 'publish_news', label: 'نشر أخبار' }, { id: 'send_links', label: 'الروابط' },
        { id: 'change_name', label: 'تغيير الاسم' }, { id: 'profile_music', label: 'أغنية البروفايل' }
      ];
      const framesCat = (suite.framesCatalog || ov.framesCatalog || state.shopItems?.frames || []).filter((f) => f.id !== 'none' && !f.ownerOnly);

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
            <div class="rk-icon-40-preview-wrap" style="flex-wrap:wrap;">
              <div class="rk-icon-40-preview" title="معاينة 40×40">
                ${editRk?.image_url
                  ? `<img id="rkIconPreviewImg" src="${escapeHtml(editRk.image_url)}" alt="" />`
                  : '<img id="rkIconPreviewImg" class="hidden" alt="" /><span id="rkIconPreviewPlaceholder" class="muted" style="font-size:10px;">40×40</span>'}
              </div>
              <label for="rkIconFile" class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-mobile-screen-button"></i> رفع أيقونة رتبة من الجوال (PNG / SVG / GIF)</label>
              <input type="file" id="rkIconFile" accept="image/png,image/svg+xml,image/gif,image/webp,image/jpeg,image/*" style="display:none;" />
              <input type="text" id="rkImgUrl" value="${escapeHtml(editRk?.image_url || '')}" placeholder="أو رابط صورة أيقونة (PNG/SVG/GIF)" style="flex:1;min-width:160px;" />
            </div>
            <div>
              <label class="muted">سقف الترقية (0-${editRk?.key === 'site_owner' ? 15 : 14}):</label>
              <input type="number" id="rkMaxAssign" min="0" max="${editRk?.key === 'site_owner' ? 15 : 14}" value="${editRk ? (editRk.max_assignable_rank || 0) : 0}" ${editRk?.key === 'site_owner' ? 'disabled' : ''} />
            </div>
            <div>
              <label class="muted">الرتب المحددة المسموح لهذه الرتبة بترقيتها (تعيين مرن):</label>
              <div class="adm-assignable-roles-grid">
                ${allRanksSorted.filter((rk) => rk.key !== 'guest' && rk.key !== 'site_owner').map((rk) => {
                  const isAssigned = Array.isArray(editRk?.assignable_roles) && editRk.assignable_roles.includes(rk.key);
                  return `<label class="switch-label"><input type="checkbox" class="rk-assign-role-chk" data-rkey="${escapeHtml(rk.key)}" ${isAssigned ? 'checked' : ''} ${editRk?.key === 'site_owner' ? 'disabled' : ''} /><span>${escapeHtml(rk.icon || '⭐')} ${escapeHtml(rk.label)}</span></label>`;
                }).join('')}
              </div>
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
          renderRanksMatrixTab(body, ov, suite, isOwner);
        });
      });
      $('rkCancelEditBtn')?.addEventListener('click', () => {
        state.editingRankKey = null;
        renderRanksMatrixTab(body, ov, suite, isOwner);
      });
      $('rkIconPresets')?.querySelectorAll('.icon-preset-btn').forEach((b) => {
        b.addEventListener('click', () => { if ($('rkIconInput')) $('rkIconInput').value = b.dataset.ic; });
      });
      const syncBadgeStyleSelection = (val) => {
        if ($('rkBadgeStyle')) $('rkBadgeStyle').value = val;
        $('rkSvgPickerGrid')?.querySelectorAll('.rank-svg-pick-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.bstyle === val));
      };
      $('rkSvgPickerGrid')?.querySelectorAll('.rank-svg-pick-btn').forEach((btn) => {
        btn.addEventListener('click', () => syncBadgeStyleSelection(btn.dataset.bstyle));
      });
      $('rkBadgeStyle')?.addEventListener('change', (e) => syncBadgeStyleSelection(e.target.value));
      const updateRkPreview = (src) => {
        const img = $('rkIconPreviewImg');
        const ph = $('rkIconPreviewPlaceholder');
        if (!img) return;
        if (src) { img.src = src; img.classList.remove('hidden'); if (ph) ph.classList.add('hidden'); }
        else { img.src = ''; img.classList.add('hidden'); if (ph) ph.classList.remove('hidden'); }
      };
      $('rkImgUrl')?.addEventListener('input', (e) => updateRkPreview(e.target.value.trim()));
      $('rkIconFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const fd = new FormData();
          fd.append('file', file);
          const up = await api('/api/upload/rank-icon', { method: 'POST', body: fd });
          if (up?.url) {
            if ($('rkImgUrl')) $('rkImgUrl').value = up.url;
            updateRkPreview(up.url);
            showToast('تم رفع أيقونة الرتبة بنجاح! اضغط حفظ لتطبيقها.');
          }
        } catch (err) {
          showToast(err.message || 'تعذر رفع أيقونة الرتبة.', true);
        }
      });
      $('rkSaveBtn')?.addEventListener('click', async () => {
        try {
          const permissions = {};
          body.querySelectorAll('.rk-perm-chk').forEach((chk) => { permissions[chk.dataset.perm] = Boolean(chk.checked); });
          const assignableRoles = [];
          body.querySelectorAll('.rk-assign-role-chk:checked').forEach((chk) => {
            if (chk.dataset.rkey) assignableRoles.push(chk.dataset.rkey);
          });
          const payload = {
            label: $('rkLabel').value,
            power: Number($('rkPower').value),
            bgColor: $('rkBgColor').value,
            textColor: $('rkTextColor').value,
            badgeStyle: $('rkBadgeStyle')?.value || 'crown_royal',
            icon: $('rkIconInput').value,
            imageUrl: $('rkImgUrl').value.trim(),
            maxAssignableRank: Number($('rkMaxAssign').value) || 0,
            assignableRoles,
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
          refreshPanel('ranks_matrix', null, 'creator');
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.edit-rk-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.editingRankKey = b.dataset.rk;
          renderRanksMatrixTab(body, ov, suite, isOwner);
        });
      });
      body.querySelectorAll('.del-rk-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/ranks/${encodeURIComponent(b.dataset.rk)}`, { method: 'DELETE' });
            if (state.editingRankKey === b.dataset.rk) state.editingRankKey = null;
            refreshPanel('ranks_matrix', null, 'creator');
          } catch (err) { showToast(err.message, true); }
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

    function renderProtectionTab(body, ov, suite, isOwner) {
      const canRooms = isOwner || hasPerm('manage_rooms');
      const canBans = isOwner || hasPerm('ban') || hasPerm('mute');
      let sub = state.activeAdminSubTab?.protection || (isOwner ? 'rules' : (canRooms ? 'rooms' : 'bans'));
      if (sub === 'rules' && !isOwner) sub = canRooms ? 'rooms' : 'bans';
      if (sub === 'rooms' && !canRooms) sub = canBans ? 'bans' : (isOwner ? 'rules' : 'rooms');
      if (sub === 'bans' && !canBans) sub = canRooms ? 'rooms' : (isOwner ? 'rules' : 'bans');

      const prot = suite.protections || ov.settings || {};
      const editRm = state.editingRoomId ? (ov.rooms || []).find((r) => r.id === state.editingRoomId) : null;
      const isEditingRm = Boolean(editRm);
      const userOpts = (ov.users || []).map((u) => `<option value="${u.id}" ${editRm?.owner_user_id === u.id ? 'selected' : ''}>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`).join('');
      const roomOpts = (ov.rooms || state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}${r.is_frozen ? ' ❄️' : ''}</option>`).join('');
      const editOwnerPerms = editRm?.owner_perms || { style_bg: true, kick: true, room_ban: true, assign_roles: false };
      const editOwnerAllowedRoles = Array.isArray(editRm?.owner_allowed_roles) ? editRm.owner_allowed_roles : [];
      const assignableRanksList = [...(ov.ranks || state.ranks || [])].filter((rk) => rk.key !== 'guest' && rk.key !== 'site_owner').sort((a, b) => (Number(b.power) || 0) - (Number(a.power) || 0));
      const roomBansList = Array.isArray(suite.roomBans) ? suite.roomBans : (Array.isArray(ov.roomBans) ? ov.roomBans : []);

      body.innerHTML = `
        <div class="cmd-subpills">
          ${isOwner ? `<button type="button" class="cmd-subpill ${sub === 'rules' ? 'active' : ''}" data-sub="rules"><i class="fa-solid fa-shield"></i> الحماية والكلمات</button>` : ''}
          ${canRooms ? `<button type="button" class="cmd-subpill ${sub === 'rooms' ? 'active' : ''}" data-sub="rooms"><i class="fa-solid fa-door-open"></i> إدارة الغرف</button>` : ''}
          ${canBans ? `<button type="button" class="cmd-subpill ${sub === 'bans' ? 'active' : ''}" data-sub="bans"><i class="fa-solid fa-ban"></i> البلاغات والحظر (${(ov.reports || []).length})</button>` : ''}
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
        ${canRooms ? `
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
                  <option value="classic_light" ${!editRm?.bg_theme || editRm?.bg_theme === 'classic_light' ? 'selected' : ''}>كلاسيكي فاتح (#f8fafc)</option>
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
              <div style="margin-top:6px;">
                <label class="muted">صلاحيات مالك الغرفة المعيّن:</label>
                <div class="perms-check-grid" style="margin-top:4px;">
                  <label class="switch-label"><input type="checkbox" id="admRoomOwnerPermStyle" ${editOwnerPerms.style_bg !== false ? 'checked' : ''} /><span>تنسيق وخلفية الغرفة</span></label>
                  <label class="switch-label"><input type="checkbox" id="admRoomOwnerPermKick" ${editOwnerPerms.kick !== false ? 'checked' : ''} /><span>الطرد من الغرفة</span></label>
                  <label class="switch-label"><input type="checkbox" id="admRoomOwnerPermBan" ${editOwnerPerms.room_ban !== false ? 'checked' : ''} /><span>الحظر من الغرفة</span></label>
                  <label class="switch-label"><input type="checkbox" id="admRoomOwnerPermAssign" ${editOwnerPerms.assign_roles ? 'checked' : ''} /><span>تغيير الرتب داخل الغرفة</span></label>
                </div>
              </div>
              <div style="margin-top:6px;">
                <label class="muted">الرتب المسموح لمالك الغرفة منحها (عند تفعيل تغيير الرتب):</label>
                <div class="adm-assignable-roles-grid">
                  ${assignableRanksList.map((rk) => `
                    <label class="switch-label"><input type="checkbox" class="rm-owner-role-chk" data-rkey="${escapeHtml(rk.key)}" ${editOwnerAllowedRoles.includes(rk.key) ? 'checked' : ''} /><span>${escapeHtml(rk.icon || '⭐')} ${escapeHtml(rk.label)}</span></label>
                  `).join('')}
                </div>
              </div>
              <button type="button" id="admSaveRoomBtn" class="btn-primary btn-sm" style="margin-top:8px;">${isEditingRm ? '💾 حفظ تعديلات الغرفة' : '➕ إنشاء الغرفة'}</button>
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
        ` : ''}
        ${canBans ? `
          <div id="cmdProt_bans" class="${sub === 'bans' ? '' : 'hidden'}">
            <h4 class="sub-heading">🚫 المحظورين حالياً (${(ov.bans || []).length})</h4>
            <div class="news-feed-list">
              ${(ov.bans || []).map((b) => `
                <div class="admin-list-card">
                  <div>
                    <strong>${escapeHtml(b.target_name || b.target_key)} ${b.ban_type === 'xban' ? '<span class="lvl-pill-mini" style="background:#991b1b;color:#fff;">إكس باند</span>' : ''}</strong>
                    <div class="muted">بواسطة: ${escapeHtml(b.banned_by || 'الإدارة')} • السبب: ${escapeHtml(b.reason || 'بدون سبب')}</div>
                  </div>
                  <button type="button" class="btn-secondary btn-xs unban-btn" data-bk="${escapeHtml(b.target_key)}"><i class="fa-solid fa-unlock"></i> فك الحظر</button>
                </div>
              `).join('') || '<div class="muted">لا يوجد محظورون حالياً.</div>'}
            </div>
            <h4 class="sub-heading" style="margin-top:12px;">🚪 محظورو الغرف المحددة (${roomBansList.length})</h4>
            <div class="news-feed-list">
              ${roomBansList.map((rb) => `
                <div class="admin-list-card">
                  <div>
                    <strong>${escapeHtml(rb.target_name || rb.target_key)}</strong>
                    <div class="muted">الغرفة: ${escapeHtml((ov.rooms || []).find((x) => x.id === rb.room_id)?.name || rb.room_id)} • بواسطة: ${escapeHtml(rb.banned_by || 'إدارة الغرفة')} • السبب: ${escapeHtml(rb.reason || '—')}</div>
                  </div>
                  <button type="button" class="btn-secondary btn-xs unban-room-btn" data-rid="${escapeHtml(rb.room_id)}" data-tk="${escapeHtml(rb.target_key)}"><i class="fa-solid fa-door-open"></i> فك حظر الغرفة</button>
                </div>
              `).join('') || '<div class="muted">لا يوجد محظورون على مستوى الغرف.</div>'}
            </div>
            <h4 class="sub-heading" style="margin-top:12px;">🔇 المكتومين حالياً (${(ov.mutes || []).length})</h4>
            <div class="news-feed-list">
              ${(ov.mutes || []).map((m) => `
                <div class="admin-list-card">
                  <div>
                    <strong>${escapeHtml(m.target_name || m.target_key)}</strong>
                    <div class="muted">
                      بواسطة: ${escapeHtml(m.muted_by || 'الإدارة')} • السبب: ${escapeHtml(m.reason || 'بدون سبب')}
                      ${m.violating_word ? ` • <span style="color:#f87171;font-weight:700;">الكلمة: ${escapeHtml(m.violating_word)}</span>` : ''}
                      • المتبقي: ${formatRemainingMmSs(m.remaining_ms ?? m.remainingMs ?? Math.max(0, Number(m.expires_at || m.expires_at_ms || 0) - Date.now()))}
                    </div>
                  </div>
                  <button type="button" class="btn-primary btn-xs unmute-admin-btn" data-mk="${escapeHtml(m.target_key)}"><i class="fa-solid fa-volume-high"></i> فك الكتم</button>
                </div>
              `).join('') || '<div class="muted">لا يوجد مكتومون حالياً.</div>'}
            </div>
            <h4 class="sub-heading" style="margin-top:12px;">🚨 البلاغات الواردة (${(ov.reports || []).length})</h4>
            <div class="news-feed-list">
              ${(ov.reports || []).map((r) => `
                <div class="admin-list-card">
                  <div><strong>المبلّغ عنه: ${escapeHtml(r.target_name)}</strong><div class="muted">من ${escapeHtml(r.reporter_name)}: ${escapeHtml(r.reason)}</div></div>
                  <div class="inline-row">
                    <button type="button" class="btn-primary btn-xs adm-resolve-report-btn" data-rep-id="${escapeHtml(r.id)}">تمت المعالجة</button>
                    <button type="button" class="btn-danger btn-xs adm-del-report-btn" data-rep-id="${escapeHtml(r.id)}">حذف</button>
                  </div>
                </div>
              `).join('') || '<div class="muted">لا توجد بلاغات.</div>'}
            </div>
          </div>
        ` : ''}
      `;

      body.querySelectorAll('.cmd-subpill').forEach((b) => {
        b.addEventListener('click', () => {
          state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), protection: b.dataset.sub };
          renderProtectionTab(body, ov, suite, isOwner);
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
        renderProtectionTab(body, ov, suite, isOwner);
      });
      $('admSaveRoomBtn')?.addEventListener('click', async () => {
        try {
          let wallpaperUrl = $('admRoomWallpaperUrl').value.trim();
          if (wallpaperUrl && !isSafeHttpsOrLocalUrlClient(wallpaperUrl, true)) {
            return showToast('رابط خلفية الغرفة يجب أن يبدأ بـ https:// أو يكون رابطاً محلياً.', true);
          }
          const wpFile = $('admRoomWallpaperFile').files[0];
          if (wpFile) {
            const fd = new FormData();
            fd.append('file', wpFile);
            const up = await api('/api/upload/wallpaper', { method: 'POST', body: fd });
            wallpaperUrl = up.url;
          }
          const ownerPerms = {
            style_bg: Boolean($('admRoomOwnerPermStyle')?.checked),
            kick: Boolean($('admRoomOwnerPermKick')?.checked),
            room_ban: Boolean($('admRoomOwnerPermBan')?.checked),
            assign_roles: Boolean($('admRoomOwnerPermAssign')?.checked)
          };
          const ownerAllowedRoles = [];
          body.querySelectorAll('.rm-owner-role-chk:checked').forEach((chk) => {
            if (chk.dataset.rkey) ownerAllowedRoles.push(chk.dataset.rkey);
          });
          const payload = {
            name: $('admRoomName').value,
            description: $('admRoomDesc').value,
            icon: $('admRoomIcon').value.trim() || '💬',
            bgTheme: $('admRoomTheme').value,
            wallpaperUrl,
            ownerUserId: $('admRoomOwner').value ? Number($('admRoomOwner').value) : null,
            ownerPerms,
            ownerAllowedRoles,
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
          refreshPanel('protection', null, 'rooms');
        } catch (err) { showToast(err.message, true); }
      });
      $('admAddRoomStaffBtn')?.addEventListener('click', async () => {
        if (!editRm) return;
        try {
          await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff`, {
            method: 'POST',
            body: { userId: Number($('admRoomStaffUserSel').value), staffRole: $('admRoomStaffRoleInput').value.trim() || 'مشرف غرفة' }
          });
          showToast('تم تعيين مشرف الغرفة!');
          refreshPanel('protection', editRm.id, 'rooms');
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.del-rm-staff-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          if (!editRm) return;
          await api(`/api/admin/rooms/${encodeURIComponent(editRm.id)}/staff/${b.dataset.uid}`, { method: 'DELETE' });
          refreshPanel('protection', editRm.id, 'rooms');
        });
      });
      body.querySelectorAll('.edit-room-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.editingRoomId = b.dataset.rid;
          renderProtectionTab(body, ov, suite, isOwner);
        });
      });
      body.querySelectorAll('.del-room-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/rooms/${encodeURIComponent(b.dataset.rid)}`, { method: 'DELETE' });
            if (state.editingRoomId === b.dataset.rid) state.editingRoomId = null;
            refreshPanel('protection', null, 'rooms');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.unban-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/ban/${encodeURIComponent(b.dataset.bk)}`, { method: 'DELETE' });
            showToast('تم فك الحظر بنجاح.');
            refreshPanel('protection', null, 'bans');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.unban-room-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api('/api/mod/room-ban', { method: 'POST', body: { roomId: b.dataset.rid, targetKey: b.dataset.tk, unban: true } });
            showToast('تم فك حظر الغرفة بنجاح.');
            refreshPanel('protection', null, 'bans');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.unmute-admin-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api('/api/admin/unmute', { method: 'POST', body: { targetKey: b.dataset.mk } });
            showToast('تم فك الكتم بنجاح.');
            refreshPanel('protection', null, 'bans');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-resolve-report-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/reports/${encodeURIComponent(b.dataset.repId)}/resolve`, { method: 'POST' });
            showToast('تمت معالجة البلاغ.');
            refreshPanel('protection', null, 'bans');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-del-report-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          try {
            await api(`/api/admin/reports/${encodeURIComponent(b.dataset.repId)}`, { method: 'DELETE' });
            showToast('تم حذف البلاغ.');
            refreshPanel('protection', null, 'bans');
          } catch (err) { showToast(err.message, true); }
        });
      });
    }

    function renderStoreGiftsTab(body, ov, suite, isOwner) {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">إدارة المتجر والإطارات والهدايا متاحة للمالك فقط.</div>';
        return;
      }
      const sub = state.activeAdminSubTab?.store_gifts || 'gifts';
      if (!Array.isArray(state.giftsDraft)) {
        state.giftsDraft = (ov.giftsCatalog || []).map((g) => ({ ...g }));
      }
      const gifts = state.giftsDraft;
      const customFrames = Array.isArray(ov.customFrames) ? ov.customFrames : [];
      const allFrames = Array.isArray(ov.framesCatalog) ? ov.framesCatalog.filter((f) => f.id !== 'none') : [];
      const userOpts = (ov.users || []).map((u) => `<option value="${u.id}">${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`).join('');

      body.innerHTML = `
        <div class="cmd-subpills">
          <button type="button" class="cmd-subpill ${sub === 'gifts' ? 'active' : ''}" data-sub="gifts"><i class="fa-solid fa-gift"></i> كتالوج الهدايا (${gifts.length})</button>
          <button type="button" class="cmd-subpill ${sub === 'frames' ? 'active' : ''}" data-sub="frames"><i class="fa-solid fa-circle-dot"></i> إطارات المتجر (${customFrames.length})</button>
        </div>

        <div class="${sub === 'gifts' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="news-composer">
            <strong><i class="fa-solid fa-plus" style="color:#F59E0B;"></i> إضافة هدية جديدة إلى المتجر والهدايا</strong>
            <div class="form-grid-2">
              <input type="text" id="sgGiftName" placeholder="اسم الهدية (مثال: تاج ماسي)" />
              <input type="text" id="sgGiftIcon" placeholder="الإيموجي أو الرمز (مثال: 💎)" value="🎁" />
              <input type="number" id="sgGiftPrice" min="1" value="150" placeholder="السعر بالروبي" />
              <input type="text" id="sgGiftCategory" value="vip" placeholder="الفئة (roses / vip / royal)" />
            </div>
            <div class="inline-row">
              <input type="text" id="sgGiftImg" placeholder="رابط صورة الهدية (اختياري)" style="flex:1" />
              <button type="button" id="sgAddGiftBtn" class="btn-primary btn-sm"><i class="fa-solid fa-plus"></i> إضافة هدية</button>
            </div>
          </div>
          <div class="news-feed-list">
            ${gifts.map((g, idx) => `
              <div class="adm-store-gift-row">
                <div style="display:flex;align-items:center;gap:8px;min-width:140px;">
                  <span style="font-size:20px;">${escapeHtml(g.icon || '🎁')}</span>
                  <div>
                    <strong>${escapeHtml(g.name)}</strong>
                    <div class="muted" style="font-size:11px;">${escapeHtml(g.category || 'general')} • ${escapeHtml(g.id)}</div>
                  </div>
                </div>
                <div class="inline-row" style="flex-wrap:wrap;">
                  <input type="text" class="sg-row-name" data-idx="${idx}" value="${escapeHtml(g.name)}" style="width:120px;" />
                  <input type="number" class="sg-row-price" data-idx="${idx}" value="${Number(g.price || 50)}" min="1" style="width:90px;" />
                  <button type="button" class="btn-danger btn-xs sg-del-gift-btn" data-idx="${idx}">حذف</button>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد هدايا حالياً.</div>'}
          </div>
          <button type="button" id="sgSaveGiftsCatalogBtn" class="btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> حفظ كتالوج الهدايا للجميع</button>
        </div>

        <div class="${sub === 'frames' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
          <div class="news-composer">
            <strong><i class="fa-solid fa-wand-sparkles" style="color:#F59E0B;"></i> إضافة إطار صورة ملكي مخصص للمتجر والملفات</strong>
            <div class="form-grid-2">
              <input type="text" id="sfLabel" placeholder="اسم الإطار" />
              <select id="sfFrameMode">
                <option value="paid">مدفوع بالروبي</option>
                <option value="free">مجاني للأعضاء</option>
              </select>
              <input type="number" id="sfPrice" min="0" value="300" placeholder="السعر بالروبي" />
              <select id="sfDuration">
                <option value="permanent">دائم</option>
                <option value="monthly">شهري (30 يوماً)</option>
              </select>
              <input type="text" id="sfImgUrl" placeholder="رابط صورة الإطار (PNG / SVG / GIF) أو ارفع من الجوال" style="grid-column:1 / -1;" />
            </div>
            <div class="inline-row" style="flex-wrap:wrap;gap:8px;align-items:center;">
              <img id="sfFramePreviewImg" class="hidden" style="width:42px;height:42px;object-fit:contain;border-radius:50%;border:1px solid rgba(251,191,36,0.45);background:rgba(15,23,42,0.8);" alt="" />
              <label for="sfImgFile" class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-mobile-screen-button"></i> رفع إطار من الجوال (PNG / SVG / GIF)</label>
              <input type="file" id="sfImgFile" accept="image/png,image/svg+xml,image/gif,image/webp,image/*" style="display:none;" />
              <span id="sfFileNameLbl" class="muted" style="font-size:11px;"></span>
              <button type="button" id="sfAddFrameBtn" class="btn-primary btn-sm"><i class="fa-solid fa-plus"></i> إضافة الإطار</button>
            </div>
          </div>

          <div class="news-composer">
            <strong><i class="fa-solid fa-gift"></i> منح إطار لعضو مجاناً من المالك</strong>
            <div class="inline-row" style="flex-wrap:wrap;">
              <select id="sfGrantUserSel" style="flex:1;min-width:150px;">${userOpts}</select>
              <select id="sfGrantFrameSel" style="flex:1;min-width:150px;">${allFrames.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.label)} (${f.isFree || Number(f.price || 0) === 0 ? 'مجاني' : `${Number(f.price || 0)} 💎`})</option>`).join('')}</select>
              <select id="sfGrantDurationSel"><option value="permanent">دائم</option><option value="monthly">شهري</option></select>
              <button type="button" id="sfGrantBtn" class="btn-primary btn-xs">منح الإطار</button>
            </div>
          </div>

          <div class="news-feed-list">
            ${customFrames.map((f) => `
              <div class="admin-list-card">
                <div style="display:flex;align-items:center;gap:8px;">
                  ${f.imageUrl ? `<img src="${escapeHtml(f.imageUrl)}" style="width:36px;height:36px;object-fit:contain;border-radius:8px;" alt="" />` : ''}
                  <div><strong>${escapeHtml(f.label)}</strong><div class="muted">${f.isFree || Number(f.price || 0) === 0 ? '✨ مجاني للأعضاء' : `💎 ${Number(f.price || 0)} روبي`} • ${f.durationType === 'monthly' ? 'شهري' : 'دائم'}</div></div>
                </div>
                <button type="button" class="btn-danger btn-xs sf-del-frame-btn" data-fid="${escapeHtml(f.id)}">حذف</button>
              </div>
            `).join('') || '<div class="muted">لم تتم إضافة إطارات مخصصة بعد.</div>'}
          </div>
        </div>
      `;

      body.querySelectorAll('.cmd-subpill').forEach((b) => {
        b.addEventListener('click', () => {
          state.activeAdminSubTab = { ...(state.activeAdminSubTab || {}), store_gifts: b.dataset.sub };
          renderStoreGiftsTab(body, ov, suite, isOwner);
        });
      });

      const syncGiftsRows = () => {
        body.querySelectorAll('.sg-row-name').forEach((inp) => {
          const i = Number(inp.dataset.idx);
          if (gifts[i]) gifts[i].name = inp.value.trim() || gifts[i].name;
        });
        body.querySelectorAll('.sg-row-price').forEach((inp) => {
          const i = Number(inp.dataset.idx);
          if (gifts[i]) gifts[i].price = Math.max(1, Number(inp.value) || 50);
        });
      };

      $('sgAddGiftBtn')?.addEventListener('click', () => {
        syncGiftsRows();
        const name = ($('sgGiftName')?.value || '').trim();
        if (!name) return showToast('أدخل اسم الهدية أولاً.', true);
        gifts.push({
          id: `gift_${Date.now().toString(36)}`,
          name,
          icon: ($('sgGiftIcon')?.value || '🎁').trim(),
          price: Math.max(1, Number($('sgGiftPrice')?.value) || 100),
          category: ($('sgGiftCategory')?.value || 'vip').trim(),
          imageUrl: ($('sgGiftImg')?.value || '').trim(),
          animation: 'sparkle'
        });
        renderStoreGiftsTab(body, ov, suite, isOwner);
      });

      body.querySelectorAll('.sg-del-gift-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          syncGiftsRows();
          const idx = Number(btn.dataset.idx);
          if (gifts.length <= 1) return showToast('يجب بقاء هدية واحدة على الأقل.', true);
          gifts.splice(idx, 1);
          renderStoreGiftsTab(body, ov, suite, isOwner);
        });
      });

      $('sgSaveGiftsCatalogBtn')?.addEventListener('click', async () => {
        syncGiftsRows();
        try {
          await api('/api/admin/gifts', { method: 'PUT', body: { gifts } });
          showToast('تم حفظ وتحديث كتالوج الهدايا بنجاح!');
          state.giftsDraft = null;
          refreshPanel('store_gifts', null, 'gifts');
        } catch (err) { showToast(err.message, true); }
      });

      $('sfFrameMode')?.addEventListener('change', () => {
        const isFree = $('sfFrameMode')?.value === 'free';
        if ($('sfPrice')) {
          $('sfPrice').classList.toggle('hidden', isFree);
          if (isFree) $('sfPrice').value = '0';
          else if (Number($('sfPrice').value) === 0) $('sfPrice').value = '300';
        }
      });

      $('sfImgFile')?.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        const prev = $('sfFramePreviewImg');
        const lbl = $('sfFileNameLbl');
        if (lbl) lbl.textContent = f ? f.name : '';
        if (prev && f) {
          prev.src = URL.createObjectURL(f);
          prev.classList.remove('hidden');
        }
      });

      $('sfAddFrameBtn')?.addEventListener('click', async () => {
        try {
          let imageUrl = ($('sfImgUrl')?.value || '').trim();
          const file = $('sfImgFile')?.files?.[0];
          if (file) {
            const fd = new FormData();
            fd.append('file', file);
            const up = await api('/api/upload/frame', { method: 'POST', body: fd });
            imageUrl = up.url;
          }
          const isFree = $('sfFrameMode')?.value === 'free';
          await api('/api/admin/store/frames', {
            method: 'POST',
            body: {
              label: $('sfLabel').value,
              isFree,
              price: isFree ? 0 : (Number($('sfPrice').value) || 0),
              durationType: $('sfDuration').value,
              imageUrl
            }
          });
          showToast('تمت إضافة الإطار وحفظه بنجاح!');
          refreshPanel('store_gifts', null, 'frames');
        } catch (err) { showToast(err.message, true); }
      });

      body.querySelectorAll('.sf-del-frame-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/api/admin/store/frames/${encodeURIComponent(btn.dataset.fid)}`, { method: 'DELETE' });
            showToast('تم حذف الإطار.');
            refreshPanel('store_gifts', null, 'frames');
          } catch (err) { showToast(err.message, true); }
        });
      });

      $('sfGrantBtn')?.addEventListener('click', async () => {
        try {
          await api('/api/admin/store/grant', {
            method: 'POST',
            body: {
              userId: Number($('sfGrantUserSel').value),
              frameId: $('sfGrantFrameSel').value,
              durationType: $('sfGrantDurationSel').value
            }
          });
          showToast('تم منح الإطار للعضو بنجاح!');
          refreshPanel('store_gifts', null, 'frames');
        } catch (err) { showToast(err.message, true); }
      });
    }

    function renderQuizBotTab(body, ov, suite, isOwner) {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">إدارة بوت المسابقات وبنك الأسئلة متاحة للمالك فقط.</div>';
        return;
      }
      const qs = suite.quizSettings || {};
      const customQuestions = Array.isArray(qs.quiz_custom_questions) ? qs.quiz_custom_questions : [];
      const editQ = state.editingQuizQuestionId ? customQuestions.find((x) => x.id === state.editingQuizQuestionId) : null;
      const roomOpts = (ov.rooms || state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${r.id === 'competitions' ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('');

      body.innerHTML = `
        <div class="owner-suite-section">
          <h4><i class="fa-solid fa-robot" style="color:#F59E0B;"></i> إعدادات بوت المسابقات الذكي (${qs.builtinCount || 32} سؤال مدمج + ${customQuestions.length} سؤال مخصص)</h4>
          <label class="switch-label"><input type="checkbox" id="qbEnabledChk" ${qs.quiz_bot_enabled !== 0 ? 'checked' : ''} /><span>تفعيل بوت المسابقات تلقائياً عند توفر أعضاء</span></label>
          <div class="form-grid-2">
            <div><label class="muted">الفاصل بين الأسئلة (ثوانٍ: 10–300)</label><input type="number" id="qbIntervalSec" min="10" max="300" value="${Number(qs.quiz_interval_sec) || 26}" /></div>
            <div><label class="muted">زمن التلميح التلقائي (ثوانٍ: 5–60)</label><input type="number" id="qbHintSec" min="5" max="60" value="${Number(qs.quiz_hint_sec) || 12}" /></div>
            <div><label class="muted">جائزة الروبي الأساسية (💎)</label><input type="number" id="qbRewardCoins" min="10" max="5000" value="${Number(qs.quiz_reward_coins) || 100}" /></div>
            <div>
              <label class="muted">لون رسالة البوت (5 خيارات ألوان)</label>
              <select id="qbMsgStyle">
                <option value="royal_gold" ${(!qs.quiz_msg_style || qs.quiz_msg_style === 'royal_gold' || qs.quiz_msg_style === 'royal') ? 'selected' : ''}>1. ذهبي ملكي فاخر</option>
                <option value="cyber_blue" ${qs.quiz_msg_style === 'cyber_blue' ? 'selected' : ''}>2. أزرق سايبر متوهج</option>
                <option value="emerald_neon" ${qs.quiz_msg_style === 'emerald_neon' ? 'selected' : ''}>3. أخضر زمردي نيون</option>
                <option value="crimson_fire" ${qs.quiz_msg_style === 'crimson_fire' ? 'selected' : ''}>4. أحمر قرمزي ناري</option>
                <option value="glass_modern" ${(qs.quiz_msg_style === 'glass_modern' || qs.quiz_msg_style === 'glass' || qs.quiz_msg_style === 'classic' || qs.quiz_msg_style === 'classic_compact') ? 'selected' : ''}>5. سماوي زجاجي حديث</option>
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
          <input type="text" id="qbQText" value="${escapeHtml(editQ?.q || '')}" placeholder="نص السؤال" />
          <input type="text" id="qbQAnswers" value="${escapeHtml((editQ?.a || []).join('، '))}" placeholder="الإجابات المقبولة مفصولة بفاصلة" />
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
          `).join('') : '<div class="muted">لم تتم إضافة أسئلة مخصصة بعد.</div>'}
        </div>
      `;

      $('qbSaveSettingsBtn')?.addEventListener('click', () => runOwnerCmdAction({
        action: 'quiz_save_settings',
        enabled: $('qbEnabledChk')?.checked,
        intervalSec: Number($('qbIntervalSec')?.value) || 26,
        hintSec: Number($('qbHintSec')?.value) || 12,
        rewardCoins: Number($('qbRewardCoins')?.value) || 100,
        msgStyle: $('qbMsgStyle')?.value || 'royal_gold'
      }, 'تم حفظ إعدادات بوت المسابقات!', 'quiz_bot'));

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
        renderQuizBotTab(body, ov, suite, isOwner);
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
          renderQuizBotTab(body, ov, suite, isOwner);
        });
      });
      body.querySelectorAll('.qb-del-q-btn').forEach((b) => {
        b.addEventListener('click', () => {
          if (state.editingQuizQuestionId === b.dataset.qid) state.editingQuizQuestionId = null;
          runOwnerCmdAction({ action: 'quiz_delete_question', questionId: b.dataset.qid }, 'تم حذف السؤال.', 'quiz_bot');
        });
      });
    }

    function renderWelcomeBotTab(body, ov, suite, isOwner) {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">إدارة البوت الترحيبي الذكي والأعضاء الافتراضيين متاحة للمالك فقط.</div>';
        return;
      }
      const wb = suite.welcomeBotSettings || ov.settings || {};
      const draft = state.welcomeBotDraft && state.welcomeBotDraft._hydrated
        ? state.welcomeBotDraft
        : {
            _hydrated: true,
            enabled: wb.welcome_bot_enabled !== 0,
            mode: wb.welcome_bot_mode === 'virtual_members' ? 'virtual_members' : 'assistant',
            name: String(wb.welcome_bot_name || 'مساعد الأصيل'),
            avatar: String(wb.welcome_bot_avatar || ''),
            greeting: String(wb.welcome_bot_greeting || 'أهلاً وسهلاً بك يا [الاسم] في [الغرفة]! نورتنا ويسعدنا تواجدك معنا 🌹'),
            geminiKey: String(wb.welcome_bot_gemini_key || ''),
            color: String(wb.welcome_bot_color || 'royal_gold'),
            virtualMembers: Array.isArray(wb.virtual_members_list) ? wb.virtual_members_list.map((v) => ({
              id: String(v.id || `vm_${Math.random().toString(36).slice(2, 7)}`),
              name: String(v.name || '').trim(),
              avatarUrl: String(v.avatarUrl || ''),
              role: String(v.role || 'member')
            })) : []
          };
      state.welcomeBotDraft = draft;

      const colorOptions = [
        { key: 'royal_gold', label: 'ذهبي ملكي', swatch: '#f59e0b' },
        { key: 'sky_blue', label: 'أزرق سماوي', swatch: '#38bdf8' },
        { key: 'emerald_green', label: 'أخضر زمردي', swatch: '#10b981' },
        { key: 'ruby_red', label: 'أحمر ياقوتي', swatch: '#f43f5e' },
        { key: 'royal_purple', label: 'بنفسجي', swatch: '#a855f7' }
      ];
      const vmRoleOptions = [
        { key: 'member', label: 'عضو' },
        { key: 'bronze_member', label: 'عضو برونزي' },
        { key: 'silver_member', label: 'عضو فضي' },
        { key: 'gold_member', label: 'عضو ذهبي' },
        { key: 'royal_member', label: 'عضو ملكي' },
        { key: 'vip', label: 'VIP' }
      ];

      body.innerHTML = `
        <div class="owner-suite-section">
          <h4><i class="fa-solid fa-wand-magic-sparkles" style="color:#F59E0B;"></i> إعدادات البوت الترحيبي الذكي (الذكاء الاصطناعي المتدرج Gemini)</h4>
          <label class="switch-label"><input type="checkbox" id="wbEnabledChk" ${draft.enabled ? 'checked' : ''} /><span>تفعيل البوت الترحيبي والرد الذكي في الغرف</span></label>
          <div class="form-grid-2" style="margin-top:8px;">
            <div>
              <label class="muted">وضع التشغيل</label>
              <select id="wbModeSelect">
                <option value="assistant" ${draft.mode === 'assistant' ? 'selected' : ''}>بوت مساعد ذكي (يرحب ويجيب عند المنشن)</option>
                <option value="virtual_members" ${draft.mode === 'virtual_members' ? 'selected' : ''}>أعضاء افتراضيين متفاعلين (في قائمة المتواجدين)</option>
              </select>
            </div>
            <div>
              <label class="muted">اسم البوت الرئيسي</label>
              <input type="text" id="wbNameInput" value="${escapeHtml(draft.name)}" placeholder="مساعد الأصيل" maxlength="40" />
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="muted">صورة البوت الرئيسي</label>
            <div class="inline-row" style="gap:8px;align-items:center;flex-wrap:wrap;">
              <img id="wbMainAvatarPreview" src="${escapeHtml(draft.avatar || '')}" alt="صورة البوت" class="wbot-avatar-preview ${draft.avatar ? '' : 'hidden'}" />
              <input type="text" id="wbAvatarInput" value="${escapeHtml(draft.avatar)}" placeholder="رابط الصورة..." style="flex:1;min-width:160px;" />
              <label class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-upload"></i> رفع صورة<input type="file" id="wbAvatarFile" accept="image/*" style="display:none;" /></label>
              ${draft.avatar ? '<button type="button" id="wbClearAvatarBtn" class="btn-danger btn-xs">إزالة</button>' : ''}
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="muted">رسالة الترحيب المخصصة ([الاسم] و [الغرفة])</label>
            <textarea id="wbGreetingInput" rows="2" maxlength="300">${escapeHtml(draft.greeting)}</textarea>
          </div>
          <div style="margin-top:10px;">
            <label class="muted">مفتاح Gemini API (محفوظ في الخادم فقط — الذكاء الاصطناعي المتدرج Gemini بدون أخطاء في الغرفة)</label>
            <div class="inline-row" style="gap:6px;">
              <input type="password" id="wbGeminiKeyInput" value="${escapeHtml(draft.geminiKey)}" placeholder="AIzaSy..." autocomplete="off" style="flex:1;" />
              <button type="button" id="wbToggleKeyVisBtn" class="btn-secondary btn-xs"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>
          <div style="margin-top:12px;">
            <label class="muted">لون رسائل البوت:</label>
            <div class="wbot-color-grid" id="wbColorGrid">
              ${colorOptions.map((c) => `
                <button type="button" class="wbot-color-pill ${draft.color === c.key ? 'active' : ''}" data-wb-color="${c.key}">
                  <span class="wbot-swatch" style="background:${c.swatch};"></span>
                  <span>${c.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="owner-suite-section" style="margin-top:12px;">
          <h4><i class="fa-solid fa-users" style="color:#38bdf8;"></i> الأعضاء الافتراضيين المتفاعلين (${draft.virtualMembers.length}/25)</h4>
          <div class="form-grid-2">
            <div><label class="muted">اسم العضو الافتراضي</label><input type="text" id="wbNewVmName" placeholder="مثال: سارة، فهد..." maxlength="36" /></div>
            <div><label class="muted">الرتبة</label><select id="wbNewVmRole">${vmRoleOptions.map((r) => `<option value="${r.key}">${r.label}</option>`).join('')}</select></div>
          </div>
          <div class="inline-row" style="gap:8px;margin-top:6px;flex-wrap:wrap;">
            <input type="text" id="wbNewVmAvatar" placeholder="رابط الصورة الشخصية" style="flex:1;min-width:150px;" />
            <label class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-camera"></i> رفع صورة<input type="file" id="wbNewVmFile" accept="image/*" style="display:none;" /></label>
            <button type="button" id="wbAddVmBtn" class="btn-primary btn-xs"><i class="fa-solid fa-plus"></i> إضافة عضو افتراضي</button>
          </div>
          <div class="news-feed-list" style="margin-top:10px;">
            ${draft.virtualMembers.length ? draft.virtualMembers.map((vm, idx) => `
              <div class="admin-list-card" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
                  ${vm.avatarUrl ? `<img src="${escapeHtml(vm.avatarUrl)}" alt="${escapeHtml(vm.name)}" class="wbot-avatar-preview" />` : `<span class="wbot-avatar-fallback">${escapeHtml((vm.name || 'ع').slice(0, 1))}</span>`}
                  <div style="min-width:0;"><strong>${escapeHtml(vm.name)}</strong><div class="muted" style="font-size:11.5px;">${escapeHtml(vmRoleOptions.find((x) => x.key === vm.role)?.label || vm.role)}</div></div>
                </div>
                <button type="button" class="btn-danger btn-xs wb-del-vm-btn" data-vm-idx="${idx}"><i class="fa-solid fa-trash"></i> حذف</button>
              </div>
            `).join('') : '<div class="muted">لا يوجد أعضاء افتراضيين حالياً.</div>'}
          </div>
        </div>
        <div style="margin-top:14px;display:flex;justify-content:flex-end;">
          <button type="button" id="wbSaveAllBtn" class="btn-primary"><i class="fa-solid fa-floppy-disk"></i> حفظ وتطبيق إعدادات البوت الترحيبي</button>
        </div>
      `;

      const syncInputsIntoDraft = () => {
        draft.enabled = Boolean($('wbEnabledChk')?.checked);
        draft.mode = $('wbModeSelect')?.value === 'virtual_members' ? 'virtual_members' : 'assistant';
        draft.name = String($('wbNameInput')?.value || '').trim();
        draft.avatar = String($('wbAvatarInput')?.value || '').trim();
        draft.greeting = String($('wbGreetingInput')?.value || '').trim();
        draft.geminiKey = String($('wbGeminiKeyInput')?.value || '').trim();
      };
      const uploadBotAvatarFile = async (file) => {
        if (!file) return null;
        const form = new FormData();
        form.append('file', file);
        const up = await api('/api/upload/bot-avatar', { method: 'POST', body: form });
        return up.url || null;
      };
      $('wbToggleKeyVisBtn')?.addEventListener('click', () => {
        const inp = $('wbGeminiKeyInput');
        if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
      });
      $('wbAvatarFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          syncInputsIntoDraft();
          const url = await uploadBotAvatarFile(file);
          if (url) { draft.avatar = url; renderWelcomeBotTab(body, ov, suite, isOwner); showToast('تم رفع صورة البوت!'); }
        } catch (err) { showToast(err.message, true); }
      });
      $('wbClearAvatarBtn')?.addEventListener('click', () => {
        syncInputsIntoDraft();
        draft.avatar = '';
        renderWelcomeBotTab(body, ov, suite, isOwner);
      });
      $('wbNewVmFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const url = await uploadBotAvatarFile(file);
          if (url && $('wbNewVmAvatar')) { $('wbNewVmAvatar').value = url; showToast('تم رفع الصورة!'); }
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.wbot-color-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          syncInputsIntoDraft();
          draft.color = btn.dataset.wbColor || 'royal_gold';
          body.querySelectorAll('.wbot-color-pill').forEach((x) => x.classList.toggle('active', x === btn));
        });
      });
      $('wbAddVmBtn')?.addEventListener('click', () => {
        syncInputsIntoDraft();
        const vmName = String($('wbNewVmName')?.value || '').trim();
        if (!vmName) return showToast('يرجى كتابة اسم العضو الافتراضي.', true);
        if (draft.virtualMembers.length >= 25) return showToast('الحد الأقصى للأعضاء الافتراضيين 25 عضواً.', true);
        draft.virtualMembers.push({
          id: `vm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          name: vmName,
          avatarUrl: String($('wbNewVmAvatar')?.value || '').trim(),
          role: String($('wbNewVmRole')?.value || 'member')
        });
        renderWelcomeBotTab(body, ov, suite, isOwner);
      });
      body.querySelectorAll('.wb-del-vm-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          syncInputsIntoDraft();
          const idx = Number(btn.dataset.vmIdx);
          if (Number.isInteger(idx) && idx >= 0 && idx < draft.virtualMembers.length) {
            draft.virtualMembers.splice(idx, 1);
            renderWelcomeBotTab(body, ov, suite, isOwner);
          }
        });
      });
      $('wbSaveAllBtn')?.addEventListener('click', () => {
        syncInputsIntoDraft();
        state.welcomeBotDraft = null;
        runOwnerCmdAction({
          action: 'welcome_bot_save',
          welcome_bot_enabled: draft.enabled,
          welcome_bot_mode: draft.mode,
          welcome_bot_name: draft.name || 'مساعد الأصيل',
          welcome_bot_avatar: draft.avatar,
          welcome_bot_greeting: draft.greeting,
          welcome_bot_gemini_key: draft.geminiKey,
          welcome_bot_color: draft.color,
          virtual_members_list: draft.virtualMembers
        }, 'تم حفظ وتطبيق إعدادات البوت الترحيبي بنجاح!', 'welcome_bot');
      });
    }

    function renderMembersControlTab(body, ov, suite, isOwner) {
      const canBank = isOwner || state.user?.role === 'co_owner' || Number(getRank(state.user?.role)?.power || 0) >= 14;
      const canPub = isOwner || hasPerm('publish_news');
      const canBan = isOwner || hasPerm('ban');
      const canMod = isOwner || hasPerm('mute') || hasPerm('kick');
      const canSetRank = isOwner || hasPerm('set_rank');
      const canGiveCoins = isOwner || hasPerm('give_coins');
      const canEditFull = isOwner || hasPerm('access_panel');
      const canAppearanceSub = canEditFull || canPub;
      const canDetectorSub = isOwner || canSetRank || canGiveCoins || canBan || canMod || canEditFull;

      let sub = state.activeAdminSubTab?.members_control || (canDetectorSub ? 'detector' : (canBank ? 'bank' : 'appearance'));
      if (sub === 'detector' && !canDetectorSub) sub = canBank ? 'bank' : 'appearance';
      if (sub === 'bank' && !canBank) sub = canDetectorSub ? 'detector' : 'appearance';
      if (sub === 'appearance' && !canAppearanceSub) sub = canDetectorSub ? 'detector' : 'bank';
      if (sub === 'engagement' && !isOwner) sub = canDetectorSub ? 'detector' : 'appearance';

      const prot = suite.protections || ov.settings || {};
      const s = ov.settings || {};
      const roomOpts = (ov.rooms || state.rooms || []).map((r) => `<option value="${escapeHtml(r.id)}" ${state.currentRoom?.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}${r.is_frozen ? ' ❄️' : ''}</option>`).join('');
      const targetOpts = [
        ...(suite.users || ov.users || []).filter((u) => !u.isSupremeOwner).map((u) => ({
          key: u.key || `user:${u.id}`,
          label: `${u.displayName} (@${u.username})${u.isShadowMuted ? ' [صامت]' : ''}${u.isFrozen ? ' [مجمد]' : ''}`
        })),
        ...(suite.liveSockets || []).filter((sk) => sk.isGuest).map((sk) => ({
          key: sk.key,
          label: `زائر: ${sk.name}${sk.isShadowMuted ? ' [صامت]' : ''}${sk.isFrozen ? ' [مجمد]' : ''}`
        }))
      ].map((t) => `<option value="${escapeHtml(t.key)}">${escapeHtml(t.label)}</option>`).join('');

      body.innerHTML = `
        <div class="cmd-subpills">
          ${canDetectorSub ? `<button type="button" class="cmd-subpill ${sub === 'detector' ? 'active' : ''}" data-sub="detector"><i class="fa-solid fa-fingerprint"></i> كاشف الهوية والأعضاء</button>` : ''}
          ${canBank ? `<button type="button" class="cmd-subpill ${sub === 'bank' ? 'active' : ''}" data-sub="bank"><i class="fa-solid fa-vault"></i> بنك الروبي</button>` : ''}
          ${canAppearanceSub ? `<button type="button" class="cmd-subpill ${sub === 'appearance' ? 'active' : ''}" data-sub="appearance"><i class="fa-solid fa-wand-magic-sparkles"></i> المظهر والأخبار</button>` : ''}
          ${isOwner ? `<button type="button" class="cmd-subpill ${sub === 'engagement' ? 'active' : ''}" data-sub="engagement"><i class="fa-solid fa-bullhorn"></i> البث والتنشيط</button>` : ''}
        </div>

        ${canDetectorSub ? `
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
                    </div>
                    ${sk.role !== 'site_owner' ? `<button type="button" class="btn-danger btn-xs owner-ban-ip-btn" data-ip="${escapeHtml(sk.ipAddress || '')}" data-dev="${escapeHtml(sk.deviceId || '')}" data-tk="${escapeHtml(sk.key)}"><i class="fa-solid fa-shield-virus"></i> إكس باند</button>` : ''}
                  </div>
                `).join('') || '<div class="muted">لا يوجد متصلون حالياً.</div>'}
              </div>
              <div class="owner-suite-section">
                <h4><i class="fa-solid fa-users-viewfinder" style="color:#F59E0B;"></i> كاشف الحسابات المتعددة (${(suite.multiAccounts || []).length})</h4>
                ${(suite.multiAccounts || []).length ? (suite.multiAccounts || []).map((m) => `
                  <div class="admin-list-card">
                    <div><strong>${escapeHtml(m.type)}: ${escapeHtml(String(m.fingerprint || '').slice(0, 22))}</strong><div class="muted">${(m.accounts || []).map((a) => escapeHtml(a.displayName)).join(' ، ')}</div></div>
                  </div>
                `).join('') : '<div class="muted">لا توجد حسابات متعددة متطابقة حالياً.</div>'}
              </div>
            ` : ''}

            ${canSetRank ? `
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
            ` : ''}

            <div class="news-feed-list">
              ${(ov.users || []).map((u) => `
                <div class="admin-list-card" style="flex-direction:column;align-items:stretch;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${u.avatarUrl ? `<img src="${escapeHtml(u.avatarUrl)}" style="width:36px;height:36px;border-radius:10px;object-fit:cover;border:1px solid rgba(251,191,36,0.35);" alt="" />` : ''}
                      <div>
                        <strong>${escapeHtml(u.displayName)} (@${escapeHtml(u.username)}) ${u.isSupremeOwner ? '<i class="fa-solid fa-shield-halved" style="color:#F59E0B;"></i>' : ''}</strong>
                        <div class="muted">${escapeHtml(u.email)} • ${roleBadgeHTML(u.role)} • 💎 ${u.coins} ${u.isBanned ? '<span class="adm-ban-badge-pill">محظور isBanned</span>' : ''} ${u.isGhosted ? '• <span style="color:#a78bfa;">شبح</span>' : ''}</div>
                      </div>
                    </div>
                    <div class="inline-row" style="flex-wrap:wrap;">
                      ${canSetRank ? `
                        <select class="adm-user-role-sel" data-uid="${u.id}" ${u.isSupremeOwner && !isOwner ? 'disabled' : ''}>${buildAssignableRankOptions(u.role)}</select>
                        <button type="button" class="btn-primary btn-xs adm-save-role-btn" data-uid="${u.id}" ${u.isSupremeOwner && !isOwner ? 'disabled' : ''}>تطبيق</button>
                      ` : ''}
                      ${canEditFull && (!u.isSupremeOwner || isOwner) ? `<button type="button" class="btn-secondary btn-xs adm-edit-full-btn" data-uid="${u.id}"><i class="fa-solid fa-user-pen"></i> تعديل شامل والصور</button>` : ''}
                      ${!u.isSupremeOwner || isOwner ? `<button type="button" class="btn-secondary btn-xs adm-rename-user-btn" data-uid="${u.id}" data-cur="${escapeHtml(u.displayName)}"><i class="fa-solid fa-pen"></i> الاسم</button>` : ''}
                      ${canGiveCoins ? `<button type="button" class="btn-secondary btn-xs adm-give-coins-btn" data-uid="${u.id}">+500</button>` : ''}
                      ${canBan && !u.isSupremeOwner && u.id !== state.user?.userId ? `<button type="button" class="${u.isBanned ? 'btn-primary' : 'btn-danger'} btn-xs adm-toggle-isbanned-btn" data-uid="${u.id}" data-banned="${u.isBanned ? '1' : '0'}">${u.isBanned ? 'فك isBanned' : 'تفعيل isBanned'}</button>` : ''}
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
          </div>
        ` : ''}

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

        ${canAppearanceSub ? `
          <div id="cmdMem_appearance" class="${sub === 'appearance' ? '' : 'hidden'}" style="display:flex;flex-direction:column;gap:10px;">
            ${canEditFull ? `
              <div class="news-composer">
                <strong>🎨 هوية الموقع والمظهر الكلاسيكي الافتراضي</strong>
                <div class="form-grid-2">
                  <div><label>اسم الموقع</label><input type="text" id="cmsSiteName" value="${escapeHtml(s.site_name || '')}" /></div>
                  <div><label>وصف الموقع</label><input type="text" id="cmsSiteDesc" value="${escapeHtml(s.site_description || '')}" /></div>
                  <div><label>لون الشريط العلوي</label><input type="color" id="cmsTopColor" value="${escapeHtml(s.top_bar_color || '#0f2342')}" /></div>
                  <div><label>لون الشريط السفلي</label><input type="color" id="cmsBotColor" value="${escapeHtml(s.bottom_bar_color || '#0f2342')}" /></div>
                  <div><label>لون الأزرار</label><input type="color" id="cmsBtnColor" value="${escapeHtml(s.button_color || '#1d4ed8')}" /></div>
                  <div><label>حجم الخط (px)</label><input type="number" id="cmsFontSize" value="${s.font_size || 14}" min="12" max="22" /></div>
                </div>
                <label>CSS مخصص للموقع</label><textarea id="cmsCustomCss" rows="2">${escapeHtml(s.custom_css || '')}</textarea>
                <label>شريط HTML علوي مخصص</label><textarea id="cmsCustomHtml" rows="2">${escapeHtml(s.custom_html || '')}</textarea>
                ${isOwner ? `<label>رسالة دخول المالك المخصصة</label><input type="text" id="cmsOwnerJoinMsg" value="${escapeHtml(s.owner_join_message || 'انضم إلى الغرفه مؤسس ومالك الشات [الاسم] • أهلاً بك')}" />` : ''}
                <button type="button" id="cmsSaveBtn" class="btn-primary btn-sm">💾 حفظ وتحديث المظهر فوراً</button>
              </div>
            ` : ''}
            ${isOwner ? `
              <div class="owner-suite-section luxury-fx-panel">
                <h4><i class="fa-solid fa-wand-magic-sparkles" style="color:#F59E0B;"></i> المؤثرات البصرية الحصرية</h4>
                <div class="luxury-fx-grid">
                  <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxGalaxyToggle" ${Number(prot.fx_owner_galaxy_identity ?? s.fx_owner_galaxy_identity ?? 1) !== 0 ? 'checked' : ''} /><strong>هوية المالك الحصرية للملف</strong></div></label>
                  <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxGlassToggle" ${Number(prot.fx_glass_bubbles ?? s.fx_glass_bubbles ?? 1) !== 0 ? 'checked' : ''} /><strong>فقاعات الدردشة الزجاجية</strong></div></label>
                  <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxMicWavesToggle" ${Number(prot.fx_mic_waves ?? s.fx_mic_waves ?? 1) !== 0 ? 'checked' : ''} /><strong>موجات الصوت حول المايكات</strong></div></label>
                  <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxEntranceToggle" ${Number(prot.fx_cinematic_entrance ?? s.fx_cinematic_entrance ?? 1) !== 0 ? 'checked' : ''} /><strong>بطاقة الدخول السينمائية</strong></div></label>
                  <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="ownerFxTypingToggle" ${Number(prot.fx_typing_avatars ?? s.fx_typing_avatars ?? 1) !== 0 ? 'checked' : ''} /><strong>مؤشر الكتابة بالصور</strong></div></label>
                  <div class="luxury-fx-card">
                    <div class="luxury-fx-head"><strong>السهرة الليلية</strong></div>
                    <select id="ownerFxNightSelect">
                      <option value="off" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere ?? 'off') === 'off' ? 'selected' : ''}>☀️ متوقفة (الوضع الفاتح افتراضي)</option>
                      <option value="auto" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere ?? 'off') === 'auto' ? 'selected' : ''}>🌗 تلقائي ليلاً</option>
                      <option value="always_on" ${String(prot.fx_night_atmosphere ?? s.fx_night_atmosphere ?? 'off') === 'always_on' ? 'selected' : ''}>🌙 مفعّلة دائماً</option>
                    </select>
                  </div>
                </div>
                <div class="inline-row" style="flex-wrap:wrap;margin-top:6px;">
                  <button type="button" id="ownerSaveLuxuryFxBtn" class="btn-primary btn-sm">💾 حفظ المؤثرات للجميع</button>
                </div>
              </div>
            ` : ''}
            ${canPub ? `
              <div class="news-composer">
                <strong>📰 نشر خبر جديد</strong>
                <input type="text" id="admNewsTitle" placeholder="عنوان الخبر" />
                <textarea id="admNewsContent" rows="2" placeholder="تفاصيل الخبر..."></textarea>
                <div class="inline-row">
                  <input type="file" id="admNewsFile" accept="image/gif,image/webp,image/png,image/jpeg,image/*" />
                  <button type="button" id="admNewsPublishBtn" class="btn-primary btn-sm">🚀 نشر</button>
                </div>
                <div class="news-feed-list" style="margin-top:6px;">
                  ${(ov.news || []).map((n) => `
                    <div class="admin-list-card"><div><strong>${escapeHtml(n.title)}</strong><div class="muted">${escapeHtml((n.content || '').slice(0, 80))}</div></div><button type="button" class="btn-danger btn-xs adm-del-news-btn" data-nid="${n.id}">حذف</button></div>
                  `).join('') || '<div class="muted">لا توجد أخبار.</div>'}
                </div>
              </div>
            ` : ''}
            ${canEditFull ? `
              <div class="news-composer">
                <strong>➕ رفع إيموجي / حزم فيسات متحركة (GIF / PNG / SVG)</strong>
                <div class="inline-row" style="flex-wrap:wrap;gap:8px;align-items:center;">
                  <input type="text" id="admEmojiCode" placeholder="الكود مثال: :وردة: (اختياري للحزم)" style="flex:1;min-width:150px;" />
                  <label for="admEmojiFile" class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-mobile-screen-button"></i> رفع فيسات / GIF من الجوال</label>
                  <input type="file" id="admEmojiFile" multiple accept="image/gif,image/webp,image/png,image/jpeg,image/svg+xml,image/*" style="display:none;" />
                  <span id="admEmojiFilesLbl" class="muted" style="font-size:11px;"></span>
                  <button type="button" id="admAddEmojiBtn" class="btn-primary btn-sm">إضافة / رفع</button>
                </div>
                <div class="received-gifts-grid" style="margin-top:6px;">
                  ${(ov.emojis || []).map((e) => `
                    <div class="addon-card"><img src="${escapeHtml(e.image_url)}" style="width:34px;height:34px;object-fit:contain;" alt="" /><strong>${escapeHtml(e.code)}</strong><button type="button" class="btn-danger btn-xs del-em-btn" data-eid="${e.id}">حذف</button></div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

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
          renderMembersControlTab(body, ov, suite, isOwner);
        });
      });
      body.querySelectorAll('.owner-ban-ip-btn').forEach((b) => {
        b.addEventListener('click', () => runOwnerCmdAction({ action: 'ban_ip', ipAddress: b.dataset.ip, deviceId: b.dataset.dev, targetKey: b.dataset.tk }, 'تم حظر IP والجهاز نهائياً!', 'members_control', 'detector'));
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
          refreshPanel('members_control', null, 'detector');
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.adm-save-role-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const uid = Number(btn.dataset.uid);
          const sel = body.querySelector(`.adm-user-role-sel[data-uid="${uid}"]`);
          try {
            await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { role: sel.value } });
            showToast('تم تحديث الرتبة!');
            refreshPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-edit-full-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          const targetUser = (ov.users || []).find((x) => Number(x.id) === uid);
          if (!targetUser) return;
          const htmlBody = `
            <div class="adm-full-edit-grid">
              <div><label class="muted">الاسم المعروض</label><input type="text" class="adm-fe-display" value="${escapeHtml(targetUser.displayName || '')}" maxlength="28" /></div>
              <div><label class="muted">اسم المستخدم</label><input type="text" class="adm-fe-username" value="${escapeHtml(targetUser.username || '')}" maxlength="24" /></div>
              <div><label class="muted">البريد الإلكتروني</label><input type="email" class="adm-fe-email" value="${escapeHtml(targetUser.email || '')}" /></div>
              <div><label class="muted">كلمة مرور جديدة (اختياري)</label><input type="password" class="adm-fe-pass" placeholder="اتركه فارغاً دون تغيير" /></div>
              ${canGiveCoins ? `<div><label class="muted">رصيد الروبي</label><input type="number" class="adm-fe-coins" min="0" value="${Number(targetUser.coins || 0)}" /></div>` : ''}
              ${canSetRank ? `<div><label class="muted">الرتبة</label><select class="adm-fe-role" ${targetUser.isSupremeOwner && !isOwner ? 'disabled' : ''}>${buildAssignableRankOptions(targetUser.role)}</select></div>` : ''}
            </div>
            <div class="adm-media-ctrl-row">
              ${targetUser.avatarUrl ? `<img src="${escapeHtml(targetUser.avatarUrl)}" alt="avatar" />` : '<span class="muted">بدون صورة</span>'}
              <input type="text" class="adm-fe-avatar-url" value="${escapeHtml(targetUser.avatarUrl || '')}" placeholder="رابط الصورة الشخصية (https://...)" style="flex:1;min-width:150px;" />
              <label class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-upload"></i> رفع صورة<input type="file" class="adm-fe-avatar-file" accept="image/*" style="display:none;" /></label>
              <button type="button" class="btn-primary btn-xs adm-fe-save-media-btn" data-kind="avatar">حفظ الرابط</button>
              <button type="button" class="btn-danger btn-xs adm-fe-del-media-btn" data-kind="avatar">حذف الصورة</button>
            </div>
            <div class="adm-media-ctrl-row">
              ${targetUser.coverUrl ? `<img src="${escapeHtml(targetUser.coverUrl)}" alt="cover" />` : '<span class="muted">بدون غلاف</span>'}
              <input type="text" class="adm-fe-cover-url" value="${escapeHtml(targetUser.coverUrl || '')}" placeholder="رابط صورة الغلاف (https://...)" style="flex:1;min-width:150px;" />
              <label class="btn-secondary btn-xs" style="cursor:pointer;"><i class="fa-solid fa-upload"></i> رفع غلاف<input type="file" class="adm-fe-cover-file" accept="image/*" style="display:none;" /></label>
              <button type="button" class="btn-primary btn-xs adm-fe-save-media-btn" data-kind="cover">حفظ الغلاف</button>
              <button type="button" class="btn-danger btn-xs adm-fe-del-media-btn" data-kind="cover">حذف الغلاف</button>
            </div>
          `;
          openInlineUserBox(uid, `تعديل شامل وإدارة صور "${escapeHtml(targetUser.displayName)}"`, htmlBody, 'حفظ البيانات', false, async (box) => {
            const avatarUrlVal = (box.querySelector('.adm-fe-avatar-url')?.value || '').trim();
            const coverUrlVal = (box.querySelector('.adm-fe-cover-url')?.value || '').trim();
            if (avatarUrlVal && !isSafeHttpsOrLocalUrlClient(avatarUrlVal, true)) {
              return showToast('رابط الصورة الشخصية غير صالح (يجب أن يكون https:// أو مساراً محلياً).', true);
            }
            if (coverUrlVal && !isSafeHttpsOrLocalUrlClient(coverUrlVal, true)) {
              return showToast('رابط الغلاف غير صالح (يجب أن يكون https:// أو مساراً محلياً).', true);
            }
            const payload = {
              displayName: (box.querySelector('.adm-fe-display')?.value || '').trim(),
              username: (box.querySelector('.adm-fe-username')?.value || '').trim(),
              email: (box.querySelector('.adm-fe-email')?.value || '').trim(),
              avatarUrl: avatarUrlVal,
              coverUrl: coverUrlVal
            };
            const passVal = box.querySelector('.adm-fe-pass')?.value || '';
            if (passVal) {
              if (passVal.length < 5) return showToast('كلمة المرور يجب أن تكون 5 أحرف على الأقل.', true);
              payload.password = passVal;
            }
            const coinsInp = box.querySelector('.adm-fe-coins');
            if (coinsInp) payload.coins = Math.max(0, Number(coinsInp.value) || 0);
            const roleSel = box.querySelector('.adm-fe-role');
            if (roleSel && roleSel.value) payload.role = roleSel.value;
            try {
              await api(`/api/admin/users/${uid}`, { method: 'PUT', body: payload });
              showToast('تم حفظ جميع بيانات العضو بنجاح!');
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
          const box = body.querySelector(`.adm-user-inline-box[data-uid="${uid}"]`);
          if (!box) return;
          box.querySelector('.adm-fe-avatar-file')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const fd = new FormData();
              fd.append('kind', 'avatar');
              fd.append('file', file);
              await api(`/api/admin/users/${uid}/media`, { method: 'POST', body: fd });
              showToast('تم رفع وتحديث الصورة الشخصية للعضو.');
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
          box.querySelector('.adm-fe-cover-file')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const fd = new FormData();
              fd.append('kind', 'cover');
              fd.append('file', file);
              await api(`/api/admin/users/${uid}/media`, { method: 'POST', body: fd });
              showToast('تم رفع وتحديث صورة الغلاف للعضو.');
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
          box.querySelectorAll('.adm-fe-save-media-btn').forEach((mbtn) => {
            mbtn.addEventListener('click', async () => {
              const kind = mbtn.dataset.kind;
              const urlVal = (box.querySelector(kind === 'cover' ? '.adm-fe-cover-url' : '.adm-fe-avatar-url')?.value || '').trim();
              if (!isSafeHttpsOrLocalUrlClient(urlVal, true)) {
                return showToast('الرابط يجب أن يبدأ بـ https:// أو يكون محلياً.', true);
              }
              try {
                await api(`/api/admin/users/${uid}/media`, { method: 'POST', body: { kind, mode: 'url', url: urlVal } });
                showToast(kind === 'cover' ? 'تم حفظ رابط الغلاف.' : 'تم حفظ رابط الصورة.');
                refreshPanel('members_control', null, 'detector');
              } catch (err) { showToast(err.message, true); }
            });
          });
          box.querySelectorAll('.adm-fe-del-media-btn').forEach((mbtn) => {
            mbtn.addEventListener('click', async () => {
              const kind = mbtn.dataset.kind;
              try {
                await api(`/api/admin/users/${uid}/media`, { method: 'POST', body: { kind, mode: 'delete' } });
                showToast(kind === 'cover' ? 'تم حذف الغلاف.' : 'تم حذف الصورة الشخصية.');
                refreshPanel('members_control', null, 'detector');
              } catch (err) { showToast(err.message, true); }
            });
          });
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
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
        });
      });
      body.querySelectorAll('.adm-give-coins-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/mod/give-coins', { method: 'POST', body: { userId: Number(btn.dataset.uid), amount: 500 } });
            showToast('تم إرسال +500 روبي للعضو.');
            refreshPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-toggle-isbanned-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const uid = Number(btn.dataset.uid);
          const nextBanned = btn.dataset.banned !== '1';
          try {
            await api(`/api/admin/users/${uid}`, { method: 'PUT', body: { isBanned: nextBanned } });
            showToast(nextBanned ? 'تم تفعيل حظر isBanned وطرد العضو فوراً.' : 'تم إلغاء حظر isBanned بنجاح.');
            refreshPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-ghost-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const next = btn.dataset.ghosted !== '1';
          try {
            await api('/api/admin/ghost', { method: 'POST', body: { userId: Number(btn.dataset.uid), enabled: next } });
            showToast(next ? 'تم تفعيل وضع الشبح.' : 'تم إلغاء وضع الشبح.');
            refreshPanel('members_control', null, 'detector');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.adm-xban-user-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          openInlineUserBox(uid, `إكس باند "${escapeHtml(btn.dataset.uname)}"`, `<input type="text" class="adm-inline-ban-reason" placeholder="سبب الإكس باند..." />`, 'تأكيد إكس باند', true, async (box) => {
            const reason = (box.querySelector('.adm-inline-ban-reason')?.value || '').trim();
            if (!isOwner && reason.length < 2) return showToast('يرجى كتابة السبب.', true);
            try {
              await api('/api/admin/ban', { method: 'POST', body: { targetKey: `user:${uid}`, reason, banType: 'xban' } });
              showToast('تم تنفيذ إكس باند بنجاح.');
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
        });
      });
      body.querySelectorAll('.adm-ban-user-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          openInlineUserBox(uid, `حظر نهائي لـ "${escapeHtml(btn.dataset.uname)}"`, `<input type="text" class="adm-inline-ban-reason" placeholder="سبب الحظر..." />`, 'تأكيد الحظر', true, async (box) => {
            const reason = (box.querySelector('.adm-inline-ban-reason')?.value || '').trim();
            if (!isOwner && reason.length < 2) return showToast('يرجى كتابة السبب.', true);
            try {
              await api('/api/admin/ban', { method: 'POST', body: { targetKey: `user:${uid}`, reason, banType: 'ban' } });
              showToast('تم حظر العضو نهائياً.');
              refreshPanel('members_control', null, 'detector');
            } catch (err) { showToast(err.message, true); }
          });
        });
      });
      body.querySelectorAll('.adm-del-user-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          openInlineUserBox(uid, `حذف حساب "${escapeHtml(btn.dataset.uname)}" نهائياً؟`, '<div class="muted">لا يمكن التراجع عن الحذف النهائي.</div>', 'تأكيد الحذف', true, async () => {
            try {
              await api(`/api/admin/users/${uid}`, { method: 'DELETE' });
              showToast('تم حذف الحساب نهائياً.');
              refreshPanel('members_control', null, 'detector');
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
                const reason = (card.querySelector('.bank-note-inp')?.value || '').trim();
                if (!rubyAmt && !actAmt) return showToast('أدخل كمية أكبر من صفر.', true);
                try {
                  const adjRes = await api('/api/owner/bank/adjust', { method: 'POST', body: { targetKey, rubyDelta: dir * rubyAmt, activityDelta: dir * actAmt, reason } });
                  if (adjRes?.user) {
                    if (card.querySelector('.bank-cur-coins')) card.querySelector('.bank-cur-coins').textContent = String(adjRes.user.coins || 0);
                    if (card.querySelector('.bank-cur-act')) card.querySelector('.bank-cur-act').textContent = String(adjRes.user.activityPoints || 0);
                    if (state.user && state.user.key === adjRes.user.key) {
                      state.user.coins = adjRes.user.coins;
                      if (typeof rawCtx.renderUserIdentity === 'function') rawCtx.renderUserIdentity();
                    }
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
          const cmsBody = {
            site_name: $('cmsSiteName').value,
            site_description: $('cmsSiteDesc').value,
            top_bar_color: $('cmsTopColor').value,
            bottom_bar_color: $('cmsBotColor').value,
            button_color: $('cmsBtnColor').value,
            font_size: Number($('cmsFontSize').value),
            custom_css: $('cmsCustomCss').value,
            custom_html: $('cmsCustomHtml').value
          };
          if (isOwner && $('cmsOwnerJoinMsg')) cmsBody.owner_join_message = $('cmsOwnerJoinMsg').value;
          const res = await api('/api/admin/settings', { method: 'PUT', body: cmsBody });
          if (res?.settings && typeof rawCtx.applySiteSettings === 'function') rawCtx.applySiteSettings(res.settings);
          showToast('تم حفظ إعدادات المظهر!');
        } catch (err) { showToast(err.message, true); }
      });
      $('ownerSaveLuxuryFxBtn')?.addEventListener('click', () => runOwnerCmdAction({
        action: 'update_protections',
        protections: {
          fx_owner_galaxy_identity: $('ownerFxGalaxyToggle')?.checked ? 1 : 0,
          fx_glass_bubbles: $('ownerFxGlassToggle')?.checked ? 1 : 0,
          fx_mic_waves: $('ownerFxMicWavesToggle')?.checked ? 1 : 0,
          fx_cinematic_entrance: $('ownerFxEntranceToggle')?.checked ? 1 : 0,
          fx_typing_avatars: $('ownerFxTypingToggle')?.checked ? 1 : 0,
          fx_night_atmosphere: $('ownerFxNightSelect')?.value || 'off'
        }
      }, 'تم حفظ وتطبيق المؤثرات للجميع!', 'members_control', 'appearance'));

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
          refreshPanel('members_control', null, 'appearance');
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.adm-del-news-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/news/${b.dataset.nid}`, { method: 'DELETE' });
          refreshPanel('members_control', null, 'appearance');
        });
      });
      $('admEmojiFile')?.addEventListener('change', (e) => {
        const count = e.target.files?.length || 0;
        if ($('admEmojiFilesLbl')) $('admEmojiFilesLbl').textContent = count ? `تم اختيار ${count} ملف` : '';
      });
      $('admAddEmojiBtn')?.addEventListener('click', async () => {
        try {
          const files = Array.from($('admEmojiFile')?.files || []);
          if (!files.length) return showToast('اختر صورة أو ملف GIF للملصق أولاً.', true);
          const customCode = ($('admEmojiCode')?.value || '').trim();
          let uploadedCount = 0;
          for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            const fd = new FormData();
            fd.append('file', file);
            const up = await api('/api/upload/emoji', { method: 'POST', body: fd });
            const baseName = String(file.name || `sticker_${Date.now()}_${i + 1}`)
              .replace(/\.[^.]+$/, '')
              .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '_')
              .slice(0, 18) || `stk_${i + 1}`;
            const codeVal = (files.length === 1 && customCode)
              ? customCode
              : `:${customCode ? `${customCode.replace(/^:+|:+$/g, '')}_${i + 1}` : baseName}:`;
            await api('/api/admin/emojis', { method: 'POST', body: { code: codeVal, imageUrl: up.url } });
            uploadedCount += 1;
          }
          showToast(uploadedCount > 1 ? `تم رفع وإضافة ${uploadedCount} فيسات/ملصقات بنجاح!` : 'تمت إضافة الملصق بنجاح!');
          refreshPanel('members_control', null, 'appearance');
        } catch (err) { showToast(err.message, true); }
      });
      body.querySelectorAll('.del-em-btn').forEach((b) => {
        b.addEventListener('click', async () => {
          await api(`/api/admin/emojis/${b.dataset.eid}`, { method: 'DELETE' });
          refreshPanel('members_control', null, 'appearance');
        });
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

    function renderBansMutesTab(body, ov, suite, isOwner) {
      const bans = Array.isArray(suite.bans) ? suite.bans : (Array.isArray(ov.bans) ? ov.bans : []);
      const mutes = Array.isArray(suite.mutes) ? suite.mutes : (Array.isArray(ov.mutes) ? ov.mutes : []);
      const reports = Array.isArray(ov.reports) ? ov.reports : [];
      body.innerHTML = `
        <div class="owner-suite-section">
          <h4><i class="fa-solid fa-ban" style="color:#f87171;"></i> قائمة المحظورين نهائياً (${bans.length})</h4>
          <div class="news-feed-list">
            ${bans.length ? bans.map((b) => `
              <div class="admin-list-card">
                <div style="min-width:0;flex:1;">
                  <div>
                    <strong>${escapeHtml(b.target_name || b.target_key)}</strong>
                    ${b.ban_type === 'xban'
                      ? '<span class="lvl-pill-mini" style="background:#991b1b;color:#fff;margin-right:6px;">X-Ban</span>'
                      : '<span class="lvl-pill-mini" style="background:rgba(239,68,68,0.22);color:#fca5a5;margin-right:6px;">حظر نهائي</span>'}
                  </div>
                  <div class="muted" style="margin-top:4px;"><strong>المنفّذ:</strong> ${escapeHtml(b.banned_by || 'الإدارة')} • <strong>السبب:</strong> ${escapeHtml(b.reason || 'بدون سبب')}</div>
                </div>
                <button type="button" class="btn-secondary btn-xs owner-unban-tab-btn" data-bk="${escapeHtml(b.target_key)}"><i class="fa-solid fa-unlock"></i> فك الحظر</button>
              </div>
            `).join('') : '<div class="muted">لا يوجد محظورون حالياً.</div>'}
          </div>
        </div>
        <div class="owner-suite-section" style="margin-top:12px;">
          <h4><i class="fa-solid fa-volume-xmark" style="color:#fbbf24;"></i> قائمة المكتومين مؤقتاً (${mutes.length})</h4>
          <div class="news-feed-list">
            ${mutes.length ? mutes.map((m) => `
              <div class="admin-list-card">
                <div style="min-width:0;flex:1;">
                  <div><strong>${escapeHtml(m.target_name || m.target_key)}</strong></div>
                  <div class="muted" style="margin-top:4px;"><strong>المنفّذ:</strong> ${escapeHtml(m.muted_by || 'الإدارة')} • <strong>السبب:</strong> ${escapeHtml(m.reason || 'بدون سبب')} • المتبقي: ${formatRemainingMmSs(m.remaining_ms ?? m.remainingMs ?? Math.max(0, Number(m.expires_at || m.expires_at_ms || 0) - Date.now()))}</div>
                </div>
                <button type="button" class="btn-primary btn-xs owner-unmute-tab-btn" data-mk="${escapeHtml(m.target_key)}"><i class="fa-solid fa-volume-high"></i> فك الكتم</button>
              </div>
            `).join('') : '<div class="muted">لا يوجد مكتومون حالياً.</div>'}
          </div>
        </div>
        <div class="owner-suite-section" style="margin-top:12px;">
          <h4><i class="fa-solid fa-flag" style="color:#f87171;"></i> البلاغات الواردة (${reports.length})</h4>
          <div class="news-feed-list">
            ${reports.length ? reports.map((r) => `
              <div class="admin-list-card">
                <div style="min-width:0;flex:1;"><strong>${escapeHtml(r.target_name)}</strong><div class="muted">من ${escapeHtml(r.reporter_name)}: ${escapeHtml(r.reason)}</div></div>
                <div class="inline-row">
                  <button type="button" class="btn-primary btn-xs bm-resolve-report-btn" data-rep-id="${escapeHtml(r.id)}">معالجة</button>
                  <button type="button" class="btn-danger btn-xs bm-del-report-btn" data-rep-id="${escapeHtml(r.id)}">حذف</button>
                </div>
              </div>
            `).join('') : '<div class="muted">لا توجد بلاغات حالياً.</div>'}
          </div>
        </div>
      `;

      body.querySelectorAll('.owner-unban-tab-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/api/admin/ban/${encodeURIComponent(btn.dataset.bk)}`, { method: 'DELETE' });
            showToast('تم فك الحظر بنجاح!');
            refreshPanel('bans_mutes');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.owner-unmute-tab-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/admin/unmute', { method: 'POST', body: { targetKey: btn.dataset.mk } });
            showToast('تم فك الكتم بنجاح!');
            refreshPanel('bans_mutes');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.bm-resolve-report-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/api/admin/reports/${encodeURIComponent(btn.dataset.repId)}/resolve`, { method: 'POST' });
            showToast('تمت معالجة البلاغ.');
            refreshPanel('bans_mutes');
          } catch (err) { showToast(err.message, true); }
        });
      });
      body.querySelectorAll('.bm-del-report-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/api/admin/reports/${encodeURIComponent(btn.dataset.repId)}`, { method: 'DELETE' });
            showToast('تم حذف البلاغ.');
            refreshPanel('bans_mutes');
          } catch (err) { showToast(err.message, true); }
        });
      });
    }

    function renderAuditLogTab(body, ov, suite, isOwner) {
      const logs = Array.isArray(suite.adminLogs) ? suite.adminLogs : (Array.isArray(ov.adminLogs) ? ov.adminLogs : []);
      const pmAlerts = Array.isArray(suite.pmLinkAlerts) ? suite.pmLinkAlerts : [];
      const violationLogs = Array.isArray(suite.violationLogs) ? suite.violationLogs : (Array.isArray(ov.violationLogs) ? ov.violationLogs : []);
      const liveSockets = Array.isArray(suite.liveSockets) ? suite.liveSockets : [];
      body.innerHTML = `
        ${!isOwner ? '<div class="form-error">السجل الرقابي ورادار المتواجدين مخصصان لحساب المالك فقط.</div>' : `
          <div class="owner-suite-section">
            <h4><i class="fa-solid fa-radar fa-satellite-dish" style="color:#38bdf8;"></i> رادار المتواجدين المباشر (${liveSockets.length})</h4>
            <div class="radar-table-wrap">
              ${liveSockets.length ? liveSockets.map((sk) => {
                const parsed = parseUaDeviceAndBrowser(sk.userAgent);
                const flag = countryFlagEmoji(sk.country);
                return `
                  <div class="radar-row-card">
                    <div style="min-width:0;flex:1;">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <strong>${escapeHtml(sk.name)}</strong>
                        <span class="radar-meta-pill">${sk.isGuest ? 'زائر' : 'عضو'}</span>
                        ${roleBadgeHTML(sk.role)}
                        ${sk.isStealth ? '<span class="adm-ban-badge-pill" style="background:rgba(245,158,11,0.2);color:#fde68a;border-color:rgba(245,158,11,0.4);">متخفي</span>' : ''}
                      </div>
                      <div class="radar-meta-pills">
                        <span class="radar-meta-pill">${flag} ${escapeHtml(sk.country || 'غير محدد')}</span>
                        <span class="radar-meta-pill">${parsed.device} • ${escapeHtml(parsed.browser)}</span>
                        <span class="radar-meta-pill"><i class="fa-solid fa-globe"></i> ${escapeHtml(sk.ipAddress || '—')}</span>
                        <span class="radar-meta-pill"><i class="fa-solid fa-door-open"></i> ${escapeHtml(sk.roomName || sk.roomId || '—')}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('') : '<div class="muted">لا يوجد متواجدون متصلون حالياً.</div>'}
            </div>
          </div>

          <div class="owner-suite-section" style="margin-top:12px;">
            <h4><i class="fa-solid fa-user-secret" style="color:#f87171;"></i> السجل السري للمخالفات والكلمات المحظورة (${violationLogs.length})</h4>
            <div class="news-feed-list">
              ${violationLogs.length ? violationLogs.map((v) => `
                <div class="adm-violation-card">
                  <div style="min-width:0;flex:1;">
                    <div><strong>${escapeHtml(v.offender_name || v.offender_key || 'مخالف')}</strong> <span class="muted">• ${escapeHtml(v.penalty_type || 'كتم تلقائي')}</span></div>
                    <div class="muted" style="margin-top:3px;">السبب: ${escapeHtml(v.reason || 'مخالفة')} ${v.room_id ? `• الغرفة: ${escapeHtml(v.room_id)}` : ''}</div>
                    ${v.violating_detail ? `<div class="adm-violation-word">التفاصيل / الكلمة المخالفة: ${escapeHtml(v.violating_detail)}</div>` : ''}
                  </div>
                  <span class="muted" style="font-size:10.5px;">${v.created_at ? new Date(v.created_at).toLocaleString('ar-EG') : ''}</span>
                </div>
              `).join('') : '<div class="muted">لا توجد مخالفات مسجلة حالياً.</div>'}
            </div>
          </div>

          <div class="owner-suite-section" style="margin-top:12px;">
            <h4><i class="fa-solid fa-clipboard-list" style="color:#F59E0B;"></i> السجل الرقابي والتنبيهات (${logs.length} إجراء • ${pmAlerts.length} رادار روابط)</h4>
            <div class="inline-row" style="flex-wrap:wrap;margin-bottom:8px;">
              <input type="text" id="auditSearchInput" placeholder="تصفية السجل (اسم، إجراء، هدف)..." style="flex:1;min-width:180px;" />
              <select id="auditTypeFilter">
                <option value="all">الكل</option>
                <option value="logs">الإجراءات الإدارية</option>
                <option value="pm">رادار الروابط</option>
              </select>
            </div>
            <div id="auditListContainer" class="news-feed-list"></div>
          </div>
        `}
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
            ts: lg.created_at || '',
            title: `${lg.action} — بواسطة ${lg.actor_name}`,
            sub: `${lg.target_name || lg.target_key || ''}${lg.details ? ` • ${lg.details}` : ''}`
          }));
        }
        if (kind !== 'logs') {
          pmAlerts.forEach((al) => items.push({
            ts: al.created_at || '',
            title: `🔗 رادار الخاص: ${al.fromName} ← ${al.toName}`,
            sub: al.content || ''
          }));
        }
        const filtered = q ? items.filter((it) => `${it.title} ${it.sub}`.toLowerCase().includes(q)) : items;
        box.innerHTML = filtered.slice(0, 80).map((it) => `
          <div class="admin-list-card">
            <div style="min-width:0;flex:1;"><strong>${escapeHtml(it.title)}</strong><div class="muted">${escapeHtml(it.sub)}</div></div>
            <span class="muted" style="font-size:10.5px;">${it.ts ? new Date(it.ts).toLocaleTimeString('ar-EG') : ''}</span>
          </div>
        `).join('') || '<div class="muted">لا توجد سجلات مطابقة.</div>';
      };
      $('auditSearchInput')?.addEventListener('input', renderFiltered);
      $('auditTypeFilter')?.addEventListener('change', renderFiltered);
      renderFiltered();
    }

    function renderOwnerToolsTab(body, ov, suite, isOwner) {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">هذه الأدوات حصرية للمالك فقط.</div>';
        return;
      }
      const s = ov.settings || state.settings || {};
      const storage = suite.storageStatus || {};
      const counts = storage.counts || {};
      let drawerSections = Array.isArray(s.custom_drawer_sections) ? JSON.parse(JSON.stringify(s.custom_drawer_sections)) : [];
      const profileFields = Array.isArray(s.custom_profile_fields) ? JSON.parse(JSON.stringify(s.custom_profile_fields)) : [];
      const editingDrawerId = state.editingCustomDrawerId || null;
      const editingDrawerSec = editingDrawerId ? drawerSections.find((x) => x.id === editingDrawerId) : null;
      const lastJsonText = storage.lastJsonSavedAt ? new Date(storage.lastJsonSavedAt).toLocaleString('ar-EG') : 'محدّث الآن';

      body.innerHTML = `
        <div class="owner-suite-section">
          <h4><i class="fa-solid fa-database" style="color:#F59E0B;"></i> الحفظ الدائم (JSON المنظم) والنسخ الاحتياطي والاستعادة</h4>
          <div class="owner-json-status-chips">
            <span><i class="fa-solid fa-users"></i> الحسابات: ${Number(counts.users || 0)}</span>
            <span><i class="fa-solid fa-crown"></i> الرتب: ${Number(counts.ranks || 0)}</span>
            <span><i class="fa-solid fa-door-open"></i> الغرف: ${Number(counts.rooms || 0)}</span>
            <span><i class="fa-solid fa-comments"></i> الرسائل: ${Number(counts.messages || 0)}</span>
            <span><i class="fa-regular fa-clock"></i> آخر مزامنة: ${escapeHtml(lastJsonText)}</span>
          </div>
          <div class="owner-backup-actions-row">
            <button type="button" id="ownerExportBackupBtn" class="btn-primary btn-sm"><i class="fa-solid fa-download"></i> نسخ احتياطي للبيانات</button>
            <div class="owner-restore-upload-box">
              <input type="file" id="ownerRestoreBackupFile" accept=".json,application/json" />
              <button type="button" id="ownerRestoreBackupBtn" class="btn-secondary btn-sm"><i class="fa-solid fa-upload"></i> استعادة البيانات</button>
            </div>
          </div>
        </div>

        <div class="owner-suite-section" style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h4><i class="fa-solid fa-bars-staggered" style="color:#38bdf8;"></i> منشئ أقسام القائمة الجانبية (${drawerSections.length})</h4>
            ${editingDrawerSec ? '<button type="button" id="ownerCancelDrawerSecBtn" class="btn-secondary btn-xs">إلغاء</button>' : ''}
          </div>
          <div class="form-grid-2">
            <div><label class="muted">عنوان القسم</label><input type="text" id="ownerDrawerSecTitle" value="${escapeHtml(editingDrawerSec?.title || '')}" /></div>
            <div><label class="muted">الأيقونة</label><input type="text" id="ownerDrawerSecIcon" value="${escapeHtml(editingDrawerSec?.icon || 'fa-solid fa-star')}" /></div>
          </div>
          <select id="ownerDrawerSecType">
            <option value="text" ${(!editingDrawerSec || editingDrawerSec.type === 'text') ? 'selected' : ''}>صفحة محتوى نصي</option>
            <option value="rules" ${editingDrawerSec?.type === 'rules' ? 'selected' : ''}>قسم القوانين والإرشادات</option>
            <option value="leaderboards" ${editingDrawerSec?.type === 'leaderboards' ? 'selected' : ''}>تصدر الكبار والأثرياء</option>
            <option value="quiz_points" ${editingDrawerSec?.type === 'quiz_points' ? 'selected' : ''}>نقاط المسابقات المباشرة</option>
          </select>
          <div id="ownerDrawerSecContentWrap">
            <textarea id="ownerDrawerSecContent" rows="3" placeholder="محتوى القسم...">${escapeHtml(editingDrawerSec?.content || '')}</textarea>
          </div>
          <button type="button" id="ownerSaveDrawerSecBtn" class="btn-primary btn-sm">${editingDrawerSec ? 'تحديث القسم' : 'إضافة قسم للقائمة الجانبية'}</button>
          <div class="news-feed-list" style="margin-top:8px;">
            ${drawerSections.map((sec, idx) => `
              <div class="admin-list-card">
                <div><strong><i class="${escapeHtml(sec.icon || 'fa-solid fa-star')}" style="color:#F59E0B;"></i> ${escapeHtml(sec.title)}</strong></div>
                <div class="inline-row">
                  <button type="button" class="btn-secondary btn-xs drw-move-btn" data-idx="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>▲</button>
                  <button type="button" class="btn-secondary btn-xs drw-move-btn" data-idx="${idx}" data-dir="1" ${idx === drawerSections.length - 1 ? 'disabled' : ''}>▼</button>
                  <button type="button" class="btn-secondary btn-xs drw-edit-btn" data-sid="${escapeHtml(sec.id)}">تعديل</button>
                  <button type="button" class="btn-danger btn-xs drw-del-btn" data-sid="${escapeHtml(sec.id)}">حذف</button>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد أقسام مخصصة.</div>'}
          </div>
        </div>

        <div class="owner-suite-section" style="margin-top:10px;">
          <h4><i class="fa-solid fa-id-card-clip" style="color:#a78bfa;"></i> حقول البروفايل الديناميكية والميزات التفاعلية</h4>
          <div class="luxury-fx-grid">
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatLikes" ${Number(s.feat_profile_likes ?? 1) !== 0 ? 'checked' : ''} /><strong>الإعجابات</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatRating" ${Number(s.feat_profile_rating ?? 1) !== 0 ? 'checked' : ''} /><strong>التقييم</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatMusic" ${Number(s.feat_profile_music ?? 1) !== 0 ? 'checked' : ''} /><strong>أغنية البروفايل</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatFriends" ${Number(s.feat_profile_friends ?? 1) !== 0 ? 'checked' : ''} /><strong>الأصدقاء</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatGifts" ${Number(s.feat_profile_gifts ?? 1) !== 0 ? 'checked' : ''} /><strong>الهدايا</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatRelations" ${Number(s.feat_profile_relations ?? 1) !== 0 ? 'checked' : ''} /><strong>العلاقات</strong></div></label>
            <label class="luxury-fx-card"><div class="luxury-fx-head"><input type="checkbox" id="profFeatWall" ${Number(s.feat_profile_wall ?? 1) !== 0 ? 'checked' : ''} /><strong>الحائط</strong></div></label>
          </div>
          <div class="form-grid-2" style="margin-top:6px;">
            <input type="text" id="ownerProfFieldLabel" placeholder="اسم الحقل" />
            <input type="text" id="ownerProfFieldPlaceholder" placeholder="نص توضيحي" />
          </div>
          <button type="button" id="ownerAddProfFieldBtn" class="btn-secondary btn-xs" style="margin-top:4px;"><i class="fa-solid fa-plus"></i> إضافة حقل</button>
          <div class="news-feed-list" style="margin-top:8px;">
            ${profileFields.map((fld, idx) => `
              <div class="admin-list-card">
                <div><strong>${escapeHtml(fld.label)}</strong><div class="muted">${escapeHtml(fld.placeholder || '')}</div></div>
                <div class="inline-row">
                  <label class="switch-label" style="margin:0;"><input type="checkbox" class="prof-dyn-enable-chk" data-idx="${idx}" ${fld.enabled !== false ? 'checked' : ''} /><span>مفعّل</span></label>
                  <button type="button" class="btn-danger btn-xs prof-dyn-del-btn" data-idx="${idx}">حذف</button>
                </div>
              </div>
            `).join('') || '<div class="muted">لا توجد حقول إضافية.</div>'}
          </div>
          <button type="button" id="ownerSaveProfileBuilderBtn" class="btn-primary btn-sm" style="margin-top:8px;"><i class="fa-solid fa-floppy-disk"></i> حفظ حقول البروفايل</button>
        </div>
      `;

      const syncContentWrap = () => {
        const tp = $('ownerDrawerSecType')?.value || 'text';
        $('ownerDrawerSecContentWrap')?.classList.toggle('hidden', tp === 'leaderboards' || tp === 'quiz_points');
      };
      syncContentWrap();
      $('ownerDrawerSecType')?.addEventListener('change', syncContentWrap);

      $('ownerExportBackupBtn')?.addEventListener('click', async () => {
        const btn = $('ownerExportBackupBtn');
        try {
          if (btn) btn.disabled = true;
          const headers = { 'X-Device-Id': state.deviceId, 'X-Client-Fingerprint': state.fingerprint };
          if (state.token) headers.Authorization = `Bearer ${state.token}`;
          const res = await fetch('/api/owner/backup', { headers });
          if (!res.ok) throw new Error('تعذر إنشاء النسخة الاحتياطية.');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `asil-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          showToast('تم تحميل النسخة الاحتياطية الكاملة بنجاح!');
        } catch (err) { showToast(err.message, true); }
        finally { if (btn) btn.disabled = false; }
      });

      $('ownerRestoreBackupBtn')?.addEventListener('click', async () => {
        const file = $('ownerRestoreBackupFile')?.files?.[0];
        if (!file) return showToast('اختر ملف النسخة الاحتياطية (.json) أولاً.', true);
        if (!confirm('سيتم استعادة البيانات من هذا الملف مع بقاء جلسات الدخول نشطة. متابعة؟')) return;
        const btn = $('ownerRestoreBackupBtn');
        try {
          if (btn) btn.disabled = true;
          const parsed = JSON.parse(await file.text());
          const res = await api('/api/owner/restore', { method: 'POST', body: { backup: parsed } });
          if (res?.settings && typeof rawCtx.applySiteSettings === 'function') rawCtx.applySiteSettings(res.settings);
          if (res?.ranks) state.ranks = res.ranks;
          if (typeof rawCtx.syncLocalMirror === 'function') rawCtx.syncLocalMirror(true);
          showToast('تمت استعادة البيانات بنجاح!');
          await refreshPanel('owner_tools');
        } catch (err) { showToast(err.message || 'ملف النسخة الاحتياطية غير صالح.', true); }
        finally { if (btn) btn.disabled = false; }
      });

      $('ownerCancelDrawerSecBtn')?.addEventListener('click', () => {
        state.editingCustomDrawerId = null;
        renderOwnerToolsTab(body, ov, suite, isOwner);
      });
      $('ownerSaveDrawerSecBtn')?.addEventListener('click', () => {
        const title = ($('ownerDrawerSecTitle')?.value || '').trim();
        if (!title) return showToast('اكتب عنوان القسم أولاً.', true);
        const icon = ($('ownerDrawerSecIcon')?.value || 'fa-solid fa-star').trim();
        const type = $('ownerDrawerSecType')?.value || 'text';
        const content = ($('ownerDrawerSecContent')?.value || '').trim();
        if (editingDrawerSec) {
          drawerSections = drawerSections.map((sec) => (sec.id === editingDrawerSec.id ? { ...sec, title, icon, type, content } : sec));
          state.editingCustomDrawerId = null;
        } else {
          drawerSections.push({ id: `sec_${Date.now().toString(36)}`, title, icon, type, content });
        }
        runOwnerCmdAction({ action: 'save_custom_drawer_sections', sections: drawerSections }, 'تم حفظ أقسام القائمة الجانبية!', 'owner_tools');
      });
      body.querySelectorAll('.drw-move-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = Number(b.dataset.idx);
          const target = idx + Number(b.dataset.dir);
          if (target < 0 || target >= drawerSections.length) return;
          const copy = [...drawerSections];
          const [item] = copy.splice(idx, 1);
          copy.splice(target, 0, item);
          runOwnerCmdAction({ action: 'save_custom_drawer_sections', sections: copy }, 'تم تعديل الترتيب.', 'owner_tools');
        });
      });
      body.querySelectorAll('.drw-edit-btn').forEach((b) => {
        b.addEventListener('click', () => {
          state.editingCustomDrawerId = b.dataset.sid;
          renderOwnerToolsTab(body, ov, suite, isOwner);
        });
      });
      body.querySelectorAll('.drw-del-btn').forEach((b) => {
        b.addEventListener('click', () => {
          if (state.editingCustomDrawerId === b.dataset.sid) state.editingCustomDrawerId = null;
          runOwnerCmdAction({ action: 'save_custom_drawer_sections', sections: drawerSections.filter((sec) => sec.id !== b.dataset.sid) }, 'تم حذف القسم.', 'owner_tools');
        });
      });

      const collectBuilderPayload = () => ({
        action: 'save_profile_builder',
        toggles: {
          feat_profile_likes: $('profFeatLikes')?.checked ? 1 : 0,
          feat_profile_rating: $('profFeatRating')?.checked ? 1 : 0,
          feat_profile_music: $('profFeatMusic')?.checked ? 1 : 0,
          feat_profile_friends: $('profFeatFriends')?.checked ? 1 : 0,
          feat_profile_gifts: $('profFeatGifts')?.checked ? 1 : 0,
          feat_profile_relations: $('profFeatRelations')?.checked ? 1 : 0,
          feat_profile_wall: $('profFeatWall')?.checked ? 1 : 0
        },
        fields: profileFields.map((fld, idx) => {
          const chk = body.querySelector(`.prof-dyn-enable-chk[data-idx="${idx}"]`);
          return { ...fld, enabled: chk ? chk.checked : fld.enabled !== false };
        })
      });

      $('ownerAddProfFieldBtn')?.addEventListener('click', () => {
        const label = ($('ownerProfFieldLabel')?.value || '').trim();
        const placeholder = ($('ownerProfFieldPlaceholder')?.value || '').trim();
        if (!label) return showToast('اكتب اسم الحقل أولاً.', true);
        const payload = collectBuilderPayload();
        payload.fields.push({ id: `fld_${Date.now().toString(36)}`, label, placeholder, enabled: true });
        runOwnerCmdAction(payload, 'تمت إضافة الحقل الجديد للبروفايل!', 'owner_tools');
      });
      body.querySelectorAll('.prof-dyn-del-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = Number(b.dataset.idx);
          const payload = collectBuilderPayload();
          payload.fields = payload.fields.filter((_, i) => i !== idx);
          runOwnerCmdAction(payload, 'تم حذف الحقل من البروفايل.', 'owner_tools');
        });
      });
      $('ownerSaveProfileBuilderBtn')?.addEventListener('click', () => {
        runOwnerCmdAction(collectBuilderPayload(), 'تم حفظ إعدادات وحقول الملف الشخصي للجميع!', 'owner_tools');
      });
    }

    function renderAdsManagerTab(body, ov, suite, isOwner) {
      if (!isOwner) {
        body.innerHTML = '<div class="form-error">إدارة الإعلانات متاحة للمالك فقط.</div>';
        return;
      }
      const existingAds = Array.isArray(suite?.adUnits)
        ? suite.adUnits
        : (Array.isArray(ov?.settings?.ad_units) ? ov.settings.ad_units : (state.settings?.ad_units || []));
      if (!Array.isArray(state.adUnitsDraft)) {
        state.adUnitsDraft = existingAds.map((ad) => ({ ...ad }));
      }
      const list = state.adUnitsDraft;
      const editAd = state.editingAdId ? list.find((a) => a.id === state.editingAdId) : null;
      const placeLabels = {
        both: 'صفحة الدخول + القائمة الجانبية',
        auth: 'أسفل صفحة الدخول فقط',
        drawer: 'أسفل القائمة الجانبية فقط'
      };

      const persistAds = async (nextList, okMsg) => {
        try {
          const res = await api('/api/owner/ads', { method: 'PUT', body: { adUnits: nextList } });
          const savedList = Array.isArray(res?.adUnits) ? res.adUnits : nextList;
          state.adUnitsDraft = savedList.map((a) => ({ ...a }));
          if (state.ownerSuite) state.ownerSuite.adUnits = savedList;
          if (state.adminOverview?.settings) state.adminOverview.settings.ad_units = savedList;
          if (res?.settings && typeof rawCtx.applySiteSettings === 'function') {
            rawCtx.applySiteSettings(res.settings);
          }
          showToast(okMsg);
          renderAdsManagerTab(body, ov, suite, isOwner);
        } catch (err) {
          showToast(err.message || 'تعذر حفظ الإعلانات.', true);
        }
      };

      body.innerHTML = `
        <div class="owner-suite-section">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <h4><i class="fa-solid fa-rectangle-ad" style="color:#F59E0B;"></i> إدارة الإعلانات والأكواد المخصصة (HTML / Script)</h4>
            <span class="muted">يدعم أكواد Google AdSense ووسوم &lt;script&gt; لأكواد المالك فقط</span>
          </div>

          <div class="news-composer" style="margin-top:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong>${editAd ? `✏️ تعديل الإعلان: ${escapeHtml(editAd.title)}` : '➕ إضافة كود إعلان جديد'}</strong>
              ${editAd ? '<button type="button" id="adCancelEditBtn" class="btn-secondary btn-xs">إلغاء التعديل</button>' : ''}
            </div>
            <div class="form-grid-2">
              <div>
                <label class="muted">عنوان الإعلان</label>
                <input type="text" id="adTitleInput" placeholder="مثال: بانر Google AdSense السفلي" value="${escapeHtml(editAd?.title || '')}" maxlength="80" />
              </div>
              <div>
                <label class="muted">مكان الظهور</label>
                <select id="adPlacementSel">
                  <option value="both" ${(!editAd || editAd.placement === 'both') ? 'selected' : ''}>صفحة الدخول + أسفل القائمة الجانبية</option>
                  <option value="auth" ${editAd?.placement === 'auth' ? 'selected' : ''}>أسفل صفحة الدخول فقط</option>
                  <option value="drawer" ${editAd?.placement === 'drawer' ? 'selected' : ''}>أسفل القائمة الجانبية فقط</option>
                </select>
              </div>
            </div>
            <div>
              <label class="muted">كود الإعلان (HTML أو &lt;script&gt;)</label>
              <textarea id="adCodeInput" rows="4" dir="ltr" style="font-family:monospace;font-size:12px;" placeholder="<script async src=...></script> أو كود HTML">${escapeHtml(editAd?.code || '')}</textarea>
            </div>
            <div class="inline-row" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <label class="switch-label">
                <input type="checkbox" id="adEnabledChk" ${(!editAd || editAd.enabled !== false) ? 'checked' : ''} />
                <span>تشغيل الإعلان فوراً بعد الحفظ</span>
              </label>
              <button type="button" id="adSaveUnitBtn" class="btn-primary btn-sm">
                <i class="fa-solid ${editAd ? 'fa-floppy-disk' : 'fa-plus'}"></i> ${editAd ? 'حفظ تعديلات الإعلان' : '+ إضافة كود إعلان'}
              </button>
            </div>
          </div>

          <div class="news-feed-list" style="margin-top:10px;">
            ${list.length ? list.map((ad) => `
              <div class="admin-list-card" style="flex-direction:column;align-items:stretch;gap:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <strong>${escapeHtml(ad.title || 'إعلان')}</strong>
                    <span class="radar-meta-pill">${escapeHtml(placeLabels[ad.placement] || placeLabels.both)}</span>
                    <span class="radar-meta-pill" style="background:${ad.enabled !== false ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.2)'};color:${ad.enabled !== false ? '#6ee7b7' : '#fca5a5'};border-color:${ad.enabled !== false ? 'rgba(52,211,153,0.45)' : 'rgba(248,113,113,0.4)'};">
                      ${ad.enabled !== false ? '● قيد التشغيل' : '○ متوقف'}
                    </span>
                  </div>
                  <div class="inline-row" style="gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn-xs ad-toggle-btn ${ad.enabled !== false ? 'btn-secondary' : 'btn-primary'}" data-ad-id="${escapeHtml(ad.id)}">
                      <i class="fa-solid ${ad.enabled !== false ? 'fa-pause' : 'fa-play'}"></i> ${ad.enabled !== false ? 'إيقاف' : 'تشغيل'}
                    </button>
                    <button type="button" class="btn-secondary btn-xs ad-edit-btn" data-ad-id="${escapeHtml(ad.id)}"><i class="fa-solid fa-pen"></i> تعديل</button>
                    <button type="button" class="btn-danger btn-xs ad-del-btn" data-ad-id="${escapeHtml(ad.id)}"><i class="fa-solid fa-trash"></i> حذف</button>
                  </div>
                </div>
                <pre dir="ltr" style="margin:0;padding:8px;border-radius:8px;background:rgba(2,6,23,0.65);border:1px solid rgba(148,163,184,0.18);color:#cbd5e1;font-size:11px;overflow:auto;max-height:80px;">${escapeHtml(String(ad.code || '').slice(0, 360))}</pre>
              </div>
            `).join('') : '<div class="muted" style="text-align:center;padding:14px;">لا توجد أكواد إعلانية مضافة حالياً. أضف أول كود إعلان من النموذج أعلاه.</div>'}
          </div>
        </div>
      `;

      $('adCancelEditBtn')?.addEventListener('click', () => {
        state.editingAdId = null;
        renderAdsManagerTab(body, ov, suite, isOwner);
      });

      $('adSaveUnitBtn')?.addEventListener('click', async () => {
        const title = ($('adTitleInput')?.value || '').trim() || `إعلان ${list.length + 1}`;
        const placement = $('adPlacementSel')?.value || 'both';
        const code = ($('adCodeInput')?.value || '').trim();
        const enabled = Boolean($('adEnabledChk')?.checked);
        if (!code) return showToast('أدخل كود HTML أو Script للإعلان أولاً.', true);

        const nextList = list.map((a) => ({ ...a }));
        if (editAd) {
          const idx = nextList.findIndex((a) => a.id === editAd.id);
          if (idx >= 0) {
            nextList[idx] = { ...nextList[idx], title, placement, code, enabled, updatedAt: new Date().toISOString() };
          }
          state.editingAdId = null;
          await persistAds(nextList, 'تم تحديث وحفظ كود الإعلان بنجاح!');
        } else {
          nextList.push({
            id: `ad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            placement,
            code,
            enabled,
            updatedAt: new Date().toISOString()
          });
          await persistAds(nextList, 'تمت إضافة كود الإعلان وحفظه بنجاح!');
        }
      });

      body.querySelectorAll('.ad-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.adId;
          const nextList = list.map((a) => (a.id === id ? { ...a, enabled: a.enabled === false } : { ...a }));
          const toggled = nextList.find((a) => a.id === id);
          await persistAds(nextList, toggled?.enabled ? 'تم تشغيل الإعلان.' : 'تم إيقاف الإعلان.');
        });
      });

      body.querySelectorAll('.ad-edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.editingAdId = btn.dataset.adId;
          renderAdsManagerTab(body, ov, suite, isOwner);
        });
      });

      body.querySelectorAll('.ad-del-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.adId;
          if (!confirm('حذف كود الإعلان نهائياً؟')) return;
          if (state.editingAdId === id) state.editingAdId = null;
          const nextList = list.filter((a) => a.id !== id);
          await persistAds(nextList, 'تم حذف الإعلان بنجاح.');
        });
      });
    }

    return {
      setTargets(bodyEl, tabsEl) {
        activeBodyEl = bodyEl;
        activeTabsContainer = tabsEl;
      },
      refreshPanel,
      renderTab,
      syncOwnerTabVisibility
    };
  }

  window.AsilAdminPanel = {
    openModal(ctx, rawTab = 'ranks_matrix', preselectRoomId = null, subOverride = null) {
      ensureAdminModalCss();
      const renderer = createRenderer(ctx);
      ctx.renderTab = renderer.renderTab;
      const modal = ensureModalElement(ctx);
      const bodyEl = document.getElementById('adminModalBody');
      const tabsEl = document.getElementById('adminModalTabsBar');
      renderer.setTargets(bodyEl, tabsEl);
      renderer.syncOwnerTabVisibility();
      if (typeof ctx.openModal === 'function') ctx.openModal('adminModal');
      else modal.classList.remove('hidden');
      return renderer.refreshPanel(rawTab, preselectRoomId, subOverride);
    },
    mountStandalone(rootEl, opts = {}) {
      ensureAdminModalCss();
      const ctx = createStandaloneContext(opts);
      const renderer = createRenderer(ctx);
      const isOwner = ctx.state.user?.role === 'site_owner' || Boolean(ctx.state.user?.isSupremeOwner);

      rootEl.innerHTML = `
        <div class="adm-shell-bar">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:20px;">👑</span>
            <div>
              <h2 style="margin:0;font-size:17px;color:#fef3c7;">لوحة التحكم والقيادة الشاملة — شات الاصيل</h2>
              <div class="muted" style="font-size:12px;">${ctx.escapeHtml(ctx.state.user?.name || ctx.state.user?.displayName || 'الإدارة')} • ${ctx.escapeHtml(ctx.state.user?.email || '')}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <a href="/" class="btn-secondary btn-xs" style="text-decoration:none;"><i class="fa-solid fa-arrow-right"></i> العودة للدردشة</a>
            <button type="button" id="standaloneAdmLogoutBtn" class="btn-danger btn-xs"><i class="fa-solid fa-right-from-bracket"></i> خروج</button>
          </div>
        </div>
        <div class="adm-standalone-tabs" id="standaloneAdminTabsBar">
          <button type="button" class="adm-tab active" data-adm-tab="ranks_matrix"><i class="fa-solid fa-crown"></i> الرتب والصلاحيات</button>
          <button type="button" class="adm-tab" data-adm-tab="protection"><i class="fa-solid fa-shield-halved"></i> الغرف والحماية</button>
          <button type="button" class="adm-tab" data-adm-tab="members_control"><i class="fa-solid fa-users-gear"></i> الأعضاء والمظهر</button>
          <button type="button" class="adm-tab" data-adm-tab="bans_mutes"><i class="fa-solid fa-ban"></i> الحظر والكتم</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="store_gifts"><i class="fa-solid fa-store"></i> المتجر والهدايا</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="quiz_bot"><i class="fa-solid fa-robot"></i> بوت المسابقات</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="welcome_bot"><i class="fa-solid fa-wand-magic-sparkles"></i> البوت الترحيبي</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="ads_manager"><i class="fa-solid fa-rectangle-ad"></i> إدارة الإعلانات</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="audit_log"><i class="fa-solid fa-clipboard-list"></i> السجل والرادار</button>
          <button type="button" class="adm-tab v-owner ${isOwner ? '' : 'hidden'}" data-adm-tab="owner_tools"><i class="fa-solid fa-database"></i> النسخ والأدوات</button>
        </div>
        <div id="standaloneOwnerEmergencyBar" class="owner-emergency-bar hidden"></div>
        <div id="standaloneAdminBody" class="adm-standalone-body"></div>
      `;

      const tabsEl = document.getElementById('standaloneAdminTabsBar');
      const bodyEl = document.getElementById('standaloneAdminBody');
      renderer.setTargets(bodyEl, tabsEl);
      renderer.syncOwnerTabVisibility();

      tabsEl?.querySelectorAll('.adm-tab').forEach((btn) => {
        btn.addEventListener('click', () => renderer.renderTab(btn.dataset.admTab));
      });
      document.getElementById('standaloneAdmLogoutBtn')?.addEventListener('click', () => {
        if (typeof opts.onLogout === 'function') opts.onLogout();
        else {
          localStorage.removeItem('arabic_chat_token_v3');
          window.location.href = '/';
        }
      });

      return renderer.refreshPanel(opts.initialTab || (isOwner ? 'ranks_matrix' : 'members_control'));
    }
  };
})();
