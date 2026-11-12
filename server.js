const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// State in memory
const users = new Map();
const rooms = [
  { id: 'general', name: 'الغرفة العامة', description: 'غرفة الدردشة الرئيسية لجميع الأعضاء والزوار', category: 'عام', ownerName: 'المالك العام 👑', isLocked: false, membersCount: 106, icon: '👑' },
  { id: 'yemen', name: 'اليمن اصل العرب', description: 'ملتقى أهل اليمن والخليج والعرب جميعاً', category: 'تعارف', ownerName: 'أبو يمن 🇾🇪', isLocked: false, membersCount: 42, icon: '🇾🇪' },
  { id: 'saudi', name: 'غرفة السعودية', description: 'مجلس الأخوة والنشامى والمحبة في المملكة', category: 'ثقافة', ownerName: 'الصقر 🇸🇦', isLocked: false, membersCount: 38, icon: '🇸🇦' },
  { id: 'teachers', name: 'غرفة المعلمين', description: 'حوارات تعليمية وثقافية ونقاشات هادفة', category: 'تعليم', ownerName: 'أستاذ أحمد 📚', isLocked: false, membersCount: 19, icon: '📚' },
  { id: 'admin_council', name: 'مجلس الإدارة', description: 'غرفة مغلقة خاصة بالمالك والمشرفين والأدمن', category: 'إدارة', ownerName: 'الإدارة العليا 🛡️', isLocked: true, membersCount: 5, icon: '🛡️' }
];

const messages = {
  general: [
    { id: 'm1', senderName: 'المالك العام', senderRole: 'owner', roleIcon: '👑', text: 'أهلاً وسهلاً بجميع الأعضاء والزوار في شات الغرف الرسمي! 🎉', time: '10:00', isAnnouncement: true },
    { id: 'm2', senderName: 'الصقر', senderRole: 'admin', roleIcon: '🛡️', text: 'يسعد مسا الجميع، نورتوا الروم يا أخوان', time: '10:05' },
    { id: 'm3', senderName: 'ريم البوادي', senderRole: 'moderator', roleIcon: '⚔️', text: 'السلام عليكم ورحمة الله وبركاته 🌹', time: '10:08' },
    { id: 'm4', senderName: 'عاشق القهوة', senderRole: 'member', roleIcon: '💎', text: 'وعليكم السلام ورحمة الله، أسعد الله أوقاتكم بكل خير', time: '10:12' }
  ],
  yemen: [
    { id: 'my1', senderName: 'أبو يمن', senderRole: 'admin', roleIcon: '🛡️', text: 'حيا الله كل من زار شات اليمن أصل العرب ❤️🇾🇪', time: '09:30' }
  ],
  saudi: [
    { id: 'ms1', senderName: 'الصقر', senderRole: 'admin', roleIcon: '🛡️', text: 'مرحباً بكم في مجلس المملكة 🇸🇦', time: '09:45' }
  ],
  teachers: [
    { id: 'mt1', senderName: 'أستاذ أحمد', senderRole: 'moderator', roleIcon: '⚔️', text: 'مرحباً بزملائنا الكرام ونقاشاتنا التربوية المثمرة', time: '08:15' }
  ],
  admin_council: [
    { id: 'ma1', senderName: 'المالك العام', senderRole: 'owner', roleIcon: '👑', text: 'تنبيه للإدارة: يرجى متابعة بلاغات الغرفة العامة والالتزام بالضوابط.', time: '07:00', isAnnouncement: true }
  ]
};

const sseClients = new Set();

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Generate HTML with complete RTL arabic interface matching requested pill buttons and theme
const htmlPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شات الغرف - الدردشة العربية المباشرة</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-green: #76b82a;
      --charcoal-dark: #222222;
      --golden-orange: #f5a623;
      --crimson-red: #b80000;
      --gold-crown: #ffd700;
      --gold-dark: #d4af37;
      --bg-dark-top: #060b17;
      --bg-dark-bottom: #1e293b;
      --role-owner: #ffb703;
      --role-admin: #8b5cf6;
      --role-mod: #3b82f6;
      --role-member: #10b981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: #0b0f19;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .app-container {
      width: 100%;
      max-width: 480px;
      min-height: 100vh;
      background: #0f172a;
      box-shadow: 0 0 40px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Hero section */
    .hero-section {
      background: linear-gradient(180deg, var(--bg-dark-top) 0%, #0f172a 60%, var(--bg-dark-bottom) 100%);
      padding: 28px 20px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-bottom: 1px solid rgba(255,215,0,0.15);
      position: relative;
    }

    .emblem-wrapper {
      position: relative;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, #ffd700, #b8860b, #ffd700);
      box-shadow: 0 0 25px rgba(255,215,0,0.4);
      margin-bottom: 12px;
    }

    .emblem-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #0b1120;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }

    .app-title {
      font-size: 28px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 2px 10px rgba(255,215,0,0.3);
      margin-bottom: 4px;
    }

    .app-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 22px;
      line-height: 1.4;
    }

    /* Stacked Pill Buttons */
    .pill-buttons-group {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      margin-bottom: 18px;
    }

    .pill-btn {
      width: 90%;
      height: 52px;
      border-radius: 26px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s;
      text-decoration: none;
    }

    .pill-btn:active {
      transform: scale(0.97);
    }

    .pill-btn:hover {
      filter: brightness(1.08);
      box-shadow: 0 6px 18px rgba(0,0,0,0.5);
    }

    .btn-green {
      background: var(--primary-green);
    }

    .btn-charcoal {
      background: var(--charcoal-dark);
      border: 1.5px solid #475569;
    }

    .btn-orange {
      background: var(--golden-orange);
    }

    .btn-crimson {
      background: var(--crimson-red);
    }

    .btn-icon {
      font-size: 19px;
    }

    .new-here-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: #cbd5e1;
      margin-top: 4px;
    }

    .new-here-link {
      color: #ffffff;
      font-weight: 800;
      text-decoration: underline;
      cursor: pointer;
      font-size: 15px;
    }

    /* APK Download Banner */
    .apk-banner {
      width: 90%;
      margin: 16px auto 4px;
      background: linear-gradient(135deg, rgba(30,58,138,0.7), rgba(88,28,135,0.7));
      border: 1px solid rgba(147,197,253,0.3);
      border-radius: 16px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .apk-info {
      text-align: right;
    }
    .apk-title {
      font-size: 13px;
      font-weight: 800;
      color: #93c5fd;
    }
    .apk-sub {
      font-size: 11px;
      color: #cbd5e1;
    }

    .apk-dl-btn {
      background: #3b82f6;
      color: white;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(59,130,246,0.4);
      flex-shrink: 0;
    }

    /* White Stories & News Card */
    .news-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 28px 28px 0 0;
      padding: 24px 20px;
      margin-top: 14px;
      flex: 1;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.25);
    }

    .news-header {
      font-size: 18px;
      font-weight: 800;
      color: var(--crimson-red);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      border-bottom: 2px solid #fee2e2;
      padding-bottom: 10px;
    }

    .news-item {
      background: #f8fafc;
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 12px;
      border-right: 4px solid var(--golden-orange);
    }

    .news-item-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .news-item-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    /* Lobby View */
    .lobby-header {
      background: #0f172a;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,215,0,0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-pill-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1e293b;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #334155;
    }

    .owner-badge-btn {
      background: linear-gradient(135deg, #ffd700, #b45309);
      color: #000;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 20px;
      border: none;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rooms-list {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      overflow-y: auto;
    }

    .room-card {
      background: #1e293b;
      border-radius: 16px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #334155;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .room-card:hover {
      border-color: #ffd700;
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }

    .room-info-side {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .room-icon-box {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      border: 1.5px solid #ffd700;
    }

    .room-name {
      font-size: 15px;
      font-weight: 800;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .room-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .room-users-count {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #0f172a;
      padding: 4px 10px;
      border-radius: 12px;
      color: #38bdf8;
      font-size: 12px;
      font-weight: 700;
    }

    /* Chat View */
    .chat-view {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0b0f19;
    }

    .chat-header {
      background: #0f172a;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }

    .back-btn {
      background: none;
      border: none;
      color: #f1f5f9;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
    }

    .chat-messages {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .msg-item {
      background: #1e293b;
      padding: 10px 14px;
      border-radius: 14px;
      max-width: 88%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border-right: 3px solid #38bdf8;
    }

    .msg-item.owner-msg {
      border-right-color: #ffd700;
      background: linear-gradient(135deg, #1e293b 0%, #2a2414 100%);
    }

    .msg-item.admin-msg {
      border-right-color: #8b5cf6;
    }

    .msg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .msg-sender {
      font-weight: 800;
      color: #ffd700;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .msg-time {
      font-size: 10px;
      color: #64748b;
    }

    .msg-text {
      font-size: 14px;
      color: #f1f5f9;
      line-height: 1.4;
      word-break: break-word;
    }

    .chat-input-bar {
      padding: 12px 14px;
      background: #0f172a;
      border-top: 1px solid #334155;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chat-input {
      flex: 1;
      height: 44px;
      background: #1e293b;
      border: 1px solid #475569;
      border-radius: 22px;
      padding: 0 16px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
    }

    .chat-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-green);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Modal Dialogs */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 999;
    }

    .modal-content {
      background: #1e293b;
      border-radius: 24px;
      padding: 24px;
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(255,215,0,0.3);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      position: relative;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffd700;
      margin-bottom: 16px;
      text-align: center;
    }

    .input-field {
      width: 100%;
      height: 46px;
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: 12px;
      padding: 0 14px;
      color: #fff;
      font-size: 14px;
      margin-bottom: 12px;
      outline: none;
    }

    .gender-select {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .gender-btn {
      flex: 1;
      height: 42px;
      border-radius: 10px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .gender-btn.active {
      border-color: #ffd700;
      background: #252836;
      color: #ffd700;
    }

    .modal-action-btn {
      width: 100%;
      height: 46px;
      border-radius: 12px;
      border: none;
      background: var(--primary-green);
      color: white;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 4px;
    }

    .modal-close-btn {
      position: absolute;
      top: 16px;
      left: 16px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="app-container" id="app">
    
    <!-- AUTH VIEW -->
    <div id="authView">
      <div class="hero-section">
        <div class="emblem-wrapper">
          <div class="emblem-inner">👑</div>
        </div>
        <h1 class="app-title">شات الغرف</h1>
        <p class="app-subtitle">أكبر تجمع دردشة كتابية وصوتية عربية — أهلاً وسهلاً بكم</p>

        <!-- 4 Stacked Pill Buttons -->
        <div class="pill-buttons-group">
          <!-- Button 1: Green #76b82a "دخول" -->
          <button class="pill-btn btn-green" onclick="openModal('loginModal')">
            <span class="btn-icon">🚀</span>
            <span>دخول</span>
          </button>

          <!-- Button 2: Dark Charcoal #222222 "دخول الزوار" -->
          <button class="pill-btn btn-charcoal" onclick="openModal('guestModal')">
            <span class="btn-icon">👥</span>
            <span>دخول الزوار</span>
          </button>

          <!-- Button 3: Golden Orange #f5a623 "تسجيل عضوية مجانية +" -->
          <button class="pill-btn btn-orange" onclick="openModal('registerModal')">
            <span class="btn-icon">👤+</span>
            <span>تسجيل عضوية مجانية +</span>
          </button>

          <!-- Button 4: Crimson Red #b80000 "مجلة شات الغرف" -->
          <button class="pill-btn btn-crimson" onclick="openModal('rulesModal')">
            <span class="btn-icon">📖</span>
            <span>مجلة شات الغرف</span>
          </button>
        </div>

        <!-- New Here Link -->
        <div class="new-here-row">
          <span>جديد هنا ؟</span>
          <span class="new-here-link" onclick="openModal('registerModal')">سجل الآن</span>
        </div>

        <!-- APK Download Direct Link -->
        <div class="apk-banner">
          <div class="apk-info">
            <div class="apk-title">📲 تطبيق الأندرويد متوفر الآن!</div>
            <div class="apk-sub">قم بتحميل ملف APK وتثبيته على هاتفك مباشرة</div>
          </div>
          <a href="/app-debug.apk" download class="apk-dl-btn">
            <span>تحميل</span>
            <span>⬇️</span>
          </a>
        </div>
      </div>

      <!-- White Stories & News Section -->
      <div class="news-card">
        <div class="news-header">
          <span>📰</span>
          <span>قصص نجاح وأخبار شات الغرف</span>
        </div>

        <div class="news-item">
          <div class="news-item-title">👑 رسالة من مالك الشات (a38125923@gmail.com)</div>
          <div class="news-item-desc">نرحب بجميع الإخوة والأخوات الكرام في النسخة المطورة من شات الغرف. تمت إضافة لوحة تحكم متكاملة للمالك، ونظام متقدم للإشراف وحماية الأعضاء.</div>
        </div>

        <div class="news-item">
          <div class="news-item-title">🏆 افتتاح الغرفة العامة وغرفة اليمن والسعودية</div>
          <div class="news-item-desc">تشهد غرف الشات نشاطاً يومياً مميزاً وتبادلاً للأشعار والنقاشات الهادفة بين مختلف الأقطار العربية في جو من الاحترام المتبادل.</div>
        </div>

        <div class="news-item">
          <div class="news-item-title">🛡️ ميزات الإشراف والرتب الملكية</div>
          <div class="news-item-desc">تم تفعيل رتب المالك، الأدمن، المشرف، والعضو الماسي، مع إمكانية طرد أو حظر المخالفين فوراً لحفظ النظام.</div>
        </div>
      </div>
    </div>

    <!-- LOBBY VIEW -->
    <div id="lobbyView" class="hidden" style="display: flex; flex-direction: column; min-height: 100vh;">
      <div class="lobby-header">
        <div class="user-pill-badge">
          <span id="currentRoleBadge">👑</span>
          <span id="currentUserName" style="font-weight: 700; font-size: 14px;">المستخدم</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="ownerPanelBtn" class="owner-badge-btn hidden" onclick="openModal('ownerModal')">
            <span>لوحة تحكم المالك 👑</span>
          </button>
          <button onclick="logout()" style="background:#334155; border:none; color:white; padding:6px 12px; border-radius:14px; font-size:12px; cursor:pointer;">خروج</button>
        </div>
      </div>

      <div style="padding: 16px 16px 0; display:flex; justify-content:space-between; align-items:center;">
        <h2 style="font-size: 18px; color: #ffd700; font-weight:800;">الغرف المتاحة</h2>
        <span style="font-size: 12px; color: #94a3b8;">اختر غرفة للدخول</span>
      </div>

      <div class="rooms-list" id="roomsList">
        <!-- Rendered by JS -->
      </div>
    </div>

    <!-- CHAT ROOM VIEW -->
    <div id="chatView" class="hidden chat-view">
      <div class="chat-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="back-btn" onclick="backToLobby()">⬅️</button>
          <div>
            <div id="roomTitle" style="font-size:15px; font-weight:800; color:#ffd700;">الغرفة العامة</div>
            <div id="roomDesc" style="font-size:11px; color:#94a3b8;">106 متواجد الآن</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button onclick="clearRoomMessages()" id="clearChatBtn" class="hidden" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:8px; font-size:11px; cursor:pointer;">مسح الشات</button>
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <!-- Rendered by JS -->
      </div>

      <div class="chat-input-bar">
        <input type="text" id="msgInput" class="chat-input" placeholder="اكتب رسالتك هنا..." onkeydown="if(event.key==='Enter') sendMessage()">
        <button class="chat-send-btn" onclick="sendMessage()">🚀</button>
      </div>
    </div>

  </div>

  <!-- MODALS -->
  <!-- 1. Login Modal -->
  <div id="loginModal" class="modal-overlay hidden">
    <div class="modal-content">
      <button class="modal-close-btn" onclick="closeModal('loginModal')">✕</button>
      <div class="modal-title">تسجيل الدخول</div>
      <input type="text" id="loginEmail" class="input-field" placeholder="البريد الإلكتروني أو اسم المستخدم (مثال: a38125923@gmail.com)">
      <input type="password" id="loginPass" class="input-field" placeholder="كلمة المرور أو رمز PIN المالك (2026)">
      <button class="modal-action-btn" onclick="handleLogin()">دخول 🚀</button>
      <div style="text-align:center; margin-top:12px; font-size:12px; color:#94a3b8;">
        💡 ملاحظة: للدخول كمالك التطبيق، استخدم البريد <b style="color:#ffd700">a38125923@gmail.com</b> أو رمز المرور <b style="color:#ffd700">2026</b>
      </div>
    </div>
  </div>

  <!-- 2. Guest Modal -->
  <div id="guestModal" class="modal-overlay hidden">
    <div class="modal-content">
      <button class="modal-close-btn" onclick="closeModal('guestModal')">✕</button>
      <div class="modal-title">دخول الزوار السريع</div>
      <input type="text" id="guestName" class="input-field" placeholder="الاسم المستعار (مثال: زائر_شات)">
      <div class="gender-select">
        <button type="button" class="gender-btn active" id="genderMale" onclick="selectGender('male')">ذكر 👨</button>
        <button type="button" class="gender-btn" id="genderFemale" onclick="selectGender('female')">أنثى 👩</button>
      </div>
      <button class="modal-action-btn" onclick="handleGuestLogin()">دخول الشات فوراً 👥</button>
    </div>
  </div>

  <!-- 3. Register Modal -->
  <div id="registerModal" class="modal-overlay hidden">
    <div class="modal-content">
      <button class="modal-close-btn" onclick="closeModal('registerModal')">✕</button>
      <div class="modal-title">تسجيل عضوية جديدة</div>
      <input type="text" id="regName" class="input-field" placeholder="اسم المستخدم المطلوب">
      <input type="email" id="regEmail" class="input-field" placeholder="البريد الإلكتروني">
      <input type="password" id="regPass" class="input-field" placeholder="كلمة المرور">
      <button class="modal-action-btn" onclick="handleRegister()">إنشاء العضوية +</button>
    </div>
  </div>

  <!-- 4. Rules & Announcements Modal -->
  <div id="rulesModal" class="modal-overlay hidden">
    <div class="modal-content">
      <button class="modal-close-btn" onclick="closeModal('rulesModal')">✕</button>
      <div class="modal-title">قوانين ومجلة شات الغرف</div>
      <div style="font-size:13px; line-height:1.6; color:#cbd5e1; max-height:300px; overflow-y:auto; padding-right:6px;">
        <p><b>1. الاحترام المتبادل:</b> يمنع الإساءة للأعضاء أو استخدام ألفاظ غير لائقة.</p>
        <p><b>2. منع الإعلانات:</b> يمنع نشر روابط خارجية أو أرقام هواتف دون إذن الإدارة.</p>
        <p><b>3. اختصاص الغرف:</b> يرجى الالتزام بمواضيع الغرف المحددة للحفاظ على النظام.</p>
        <p><b>4. الإشراف العام:</b> للمالك والمشرفين كامل الصلاحية بحظر أي مخالف فورياً.</p>
        <div style="margin-top:12px; padding:10px; background:#0f172a; border-radius:10px; border:1px solid #ffd700;">
          👑 <b>إدارة الشات:</b> نسعى دائماً لتقديم أفضل تجربة تواصل آمنة وممتعة للجميع.
        </div>
      </div>
    </div>
  </div>

  <!-- 5. Owner Master Control Modal -->
  <div id="ownerModal" class="modal-overlay hidden">
    <div class="modal-content" style="max-width:440px;">
      <button class="modal-close-btn" onclick="closeModal('ownerModal')">✕</button>
      <div class="modal-title">لوحة تحكم المالك 👑</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button onclick="broadcastAdminNotice()" class="pill-btn btn-green" style="height:44px; font-size:14px; width:100%;">📢 بث إعلان إداري لجميع الغرف</button>
        <button onclick="clearAllChatRooms()" class="pill-btn btn-crimson" style="height:44px; font-size:14px; width:100%;">🗑️ مسح رسائل كافة الغرف</button>
        <button onclick="addNewRoomPrompt()" class="pill-btn btn-orange" style="height:44px; font-size:14px; width:100%;">➕ إنشاء غرفة دردشة جديدة</button>
        <div style="padding:10px; background:#0f172a; border-radius:12px; font-size:12px; color:#cbd5e1;">
          <b>صلاحيات المالك:</b> أنت المالك الإداري العام (a38125923@gmail.com). يمكنك مراقبة كافة الغرف، ترقية الأعضاء، وحظر المخالفين بشكل دائم أو مؤقت.
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentUser = null;
    let currentRoomId = null;
    let selectedGender = 'male';

    function openModal(id) {
      document.getElementById(id).classList.remove('hidden');
    }
    function closeModal(id) {
      document.getElementById(id).classList.add('hidden');
    }

    function selectGender(g) {
      selectedGender = g;
      document.getElementById('genderMale').classList.toggle('active', g === 'male');
      document.getElementById('genderFemale').classList.toggle('active', g === 'female');
    }

    function handleLogin() {
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      
      const isOwner = email.toLowerCase() === 'a38125923@gmail.com' || pass === '2026' || email === 'المالك';

      currentUser = {
        name: isOwner ? 'المالك العام 👑' : (email || 'عضو الشات'),
        role: isOwner ? 'owner' : 'member',
        roleBadge: isOwner ? '👑' : '💎',
        isOwner: isOwner
      };

      closeModal('loginModal');
      showLobby();
    }

    function handleGuestLogin() {
      const name = document.getElementById('guestName').value.trim() || 'زائر_شات';
      currentUser = {
        name: name,
        role: 'guest',
        roleBadge: selectedGender === 'male' ? '👨' : '👩',
        isOwner: false
      };
      closeModal('guestModal');
      showLobby();
    }

    function handleRegister() {
      const name = document.getElementById('regName').value.trim() || 'عضو جديد';
      currentUser = {
        name: name,
        role: 'member',
        roleBadge: '💎',
        isOwner: false
      };
      closeModal('registerModal');
      showLobby();
    }

    function showLobby() {
      document.getElementById('authView').classList.add('hidden');
      document.getElementById('chatView').classList.add('hidden');
      document.getElementById('lobbyView').classList.remove('hidden');

      document.getElementById('currentUserName').innerText = currentUser.name;
      document.getElementById('currentRoleBadge').innerText = currentUser.roleBadge;

      const ownerBtn = document.getElementById('ownerPanelBtn');
      if (currentUser.isOwner) {
        ownerBtn.classList.remove('hidden');
      } else {
        ownerBtn.classList.add('hidden');
      }

      renderRooms();
    }

    function logout() {
      currentUser = null;
      document.getElementById('lobbyView').classList.add('hidden');
      document.getElementById('chatView').classList.add('hidden');
      document.getElementById('authView').classList.remove('hidden');
    }

    function renderRooms() {
      const list = document.getElementById('roomsList');
      list.innerHTML = '';

      fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
          data.forEach(r => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.onclick = () => enterRoom(r.id, r.name, r.description);
            card.innerHTML = \`
              <div class="room-info-side">
                <div class="room-icon-box">\${r.icon || '💬'}</div>
                <div>
                  <div class="room-name">
                    \${r.name}
                    \${r.isLocked ? '<span style="font-size:12px;">🔒</span>' : ''}
                  </div>
                  <div class="room-sub">\${r.description}</div>
                </div>
              </div>
              <div class="room-users-count">
                <span>👥</span>
                <span>\${r.membersCount}</span>
              </div>
            \`;
            list.appendChild(card);
          });
        });
    }

    function enterRoom(roomId, name, desc) {
      currentRoomId = roomId;
      document.getElementById('lobbyView').classList.add('hidden');
      document.getElementById('chatView').classList.remove('hidden');
      document.getElementById('roomTitle').innerText = name;
      document.getElementById('roomDesc').innerText = desc;

      const clearBtn = document.getElementById('clearChatBtn');
      if (currentUser && currentUser.isOwner) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }

      loadMessages();
    }

    function backToLobby() {
      currentRoomId = null;
      document.getElementById('chatView').classList.add('hidden');
      document.getElementById('lobbyView').classList.remove('hidden');
    }

    function loadMessages() {
      if (!currentRoomId) return;
      fetch(\`/api/rooms/\${currentRoomId}/messages\`)
        .then(res => res.json())
        .then(msgs => {
          const container = document.getElementById('chatMessages');
          container.innerHTML = '';
          msgs.forEach(m => {
            const div = document.createElement('div');
            div.className = 'msg-item ' + (m.senderRole === 'owner' ? 'owner-msg' : (m.senderRole === 'admin' ? 'admin-msg' : ''));
            div.innerHTML = \`
              <div class="msg-header">
                <span class="msg-sender">\${m.roleIcon || '👤'} \${m.senderName}</span>
                <span class="msg-time">\${m.time || ''}</span>
              </div>
              <div class="msg-text">\${escapeHtml(m.text)}</div>
            \`;
            container.appendChild(div);
          });
          container.scrollTop = container.scrollHeight;
        });
    }

    function sendMessage() {
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text || !currentRoomId) return;

      const newMsg = {
        senderName: currentUser.name,
        senderRole: currentUser.role,
        roleIcon: currentUser.roleBadge,
        text: text,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      fetch(\`/api/rooms/\${currentRoomId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      }).then(() => {
        input.value = '';
        loadMessages();
      });
    }

    function clearRoomMessages() {
      if (!confirm('هل أنت متأكد من رغبتك في مسح رسائل هذه الغرفة؟')) return;
      fetch(\`/api/rooms/\${currentRoomId}/clear\`, { method: 'POST' })
        .then(() => loadMessages());
    }

    function broadcastAdminNotice() {
      const notice = prompt('أدخل نص الإعلان الإداري لجميع الغرف:');
      if (!notice) return;
      fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notice })
      }).then(() => {
        alert('تم بث الإعلان بنجاح!');
        closeModal('ownerModal');
      });
    }

    function clearAllChatRooms() {
      if (!confirm('تحذير: هل أنت متأكد من مسح كافة الرسائل في جميع الغرف؟')) return;
      fetch('/api/admin/clear-all', { method: 'POST' })
        .then(() => {
          alert('تم مسح الرسائل بنجاح!');
          closeModal('ownerModal');
        });
    }

    function addNewRoomPrompt() {
      const roomName = prompt('أدخل اسم الغرفة الجديدة:');
      if (!roomName) return;
      const desc = prompt('أدخل وصف الغرفة:');
      fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName, description: desc || 'غرفة جديدة' })
      }).then(() => {
        alert('تم إنشاء الغرفة بنجاح!');
        closeModal('ownerModal');
        renderRooms();
      });
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Auto-refresh messages when inside room
    setInterval(() => {
      if (currentRoomId) loadMessages();
    }, 3000);
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health checks
  if (pathname === '/health' || pathname === '/__health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Direct Android APK download
  if (pathname === '/app-debug.apk' || pathname === '/chat-rooms.apk') {
    const possibleApkPaths = [
      path.join(__dirname, '.build-outputs', 'app-debug.apk'),
      path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
    ];

    let apkPath = null;
    for (const p of possibleApkPaths) {
      if (fs.existsSync(p)) {
        apkPath = p;
        break;
      }
    }

    if (apkPath) {
      const stat = fs.statSync(apkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="chat-rooms.apk"'
      });
      fs.createReadStream(apkPath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ملف APK قيد البناء، يرجى المحاولة بعد لحظات.');
      return;
    }
  }

  // API: Get Rooms
  if (pathname === '/api/rooms' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rooms));
    return;
  }

  // API: Create Room
  if (pathname === '/api/rooms' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const newRoom = {
          id: 'room_' + Date.now(),
          name: data.name || 'غرفة جديدة',
          description: data.description || '',
          category: 'عام',
          ownerName: 'المالك 👑',
          isLocked: false,
          membersCount: 1,
          icon: '✨'
        };
        rooms.push(newRoom);
        messages[newRoom.id] = [];
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(newRoom));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Room Messages
  const msgMatch = pathname.match(/^\/api\/rooms\/([^\/]+)\/messages$/);
  if (msgMatch && req.method === 'GET') {
    const roomId = msgMatch[1];
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(messages[roomId] || []));
    return;
  }

  if (msgMatch && req.method === 'POST') {
    const roomId = msgMatch[1];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (!messages[roomId]) messages[roomId] = [];
        const msg = {
          id: 'msg_' + Date.now(),
          senderName: data.senderName || 'عضو',
          senderRole: data.senderRole || 'member',
          roleIcon: data.roleIcon || '👤',
          text: data.text || '',
          time: data.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isAnnouncement: !!data.isAnnouncement
        };
        messages[roomId].push(msg);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(msg));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Clear Room
  const clearMatch = pathname.match(/^\/api\/rooms\/([^\/]+)\/clear$/);
  if (clearMatch && req.method === 'POST') {
    const roomId = clearMatch[1];
    messages[roomId] = [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // API: Admin broadcast
  if (pathname === '/api/admin/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const announcement = {
          id: 'bcast_' + Date.now(),
          senderName: 'المالك العام',
          senderRole: 'owner',
          roleIcon: '👑',
          text: '📢 إعلان إداري عام: ' + (data.text || ''),
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isAnnouncement: true
        };
        for (const r of rooms) {
          if (!messages[r.id]) messages[r.id] = [];
          messages[r.id].push(announcement);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Clear all
  if (pathname === '/api/admin/clear-all' && req.method === 'POST') {
    for (const r of rooms) {
      messages[r.id] = [];
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Default: Serve complete HTML web application
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlPage);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
