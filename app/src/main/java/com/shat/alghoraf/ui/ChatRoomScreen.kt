package com.shat.alghoraf.ui

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.media.ToneGenerator
import android.os.Build
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.credentials.CredentialManager
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.shat.alghoraf.auth.GoogleAuthManager
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.PublicProfile
import com.shat.alghoraf.data.UiState
import com.shat.alghoraf.ui.theme.CodyHeaderNavy
import com.shat.alghoraf.ui.theme.CrimsonOwner
import com.shat.alghoraf.ui.theme.FeedLightBg
import com.shat.alghoraf.ui.theme.GreenAccent
import com.shat.alghoraf.ui.theme.RoyalBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SendSkyBlue
import com.shat.alghoraf.ui.theme.TopicGreenBg
import com.shat.alghoraf.ui.theme.TopicGreenText
import kotlinx.coroutines.launch
import java.io.File

@Composable
fun ChatRoomScreen(
    viewModel: MainChatViewModel
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val snackbarHostState = remember { SnackbarHostState() }
    val credentialManager = remember { CredentialManager.create(context) }

    val activeRoomId by viewModel.activeRoomId.collectAsStateWithLifecycle()
    val myPrivateState by viewModel.myPrivateUser.collectAsStateWithLifecycle()
    val myProfileState by viewModel.myProfile.collectAsStateWithLifecycle()
    val profilesState by viewModel.publicProfiles.collectAsStateWithLifecycle()
    val roomsState by viewModel.rooms.collectAsStateWithLifecycle()
    val ranksState by viewModel.ranks.collectAsStateWithLifecycle()
    val messagesState by viewModel.roomMessages.collectAsStateWithLifecycle()
    val micsState by viewModel.roomMics.collectAsStateWithLifecycle()
    val settings by viewModel.siteSettings.collectAsStateWithLifecycle()
    val newsState by viewModel.newsPosts.collectAsStateWithLifecycle()
    val wallState by viewModel.wallPosts.collectAsStateWithLifecycle()
    val pmsState by viewModel.privateMessages.collectAsStateWithLifecycle()
    val friendsState by viewModel.friendships.collectAsStateWithLifecycle()
    val notifsState by viewModel.notifications.collectAsStateWithLifecycle()
    val reportsState by viewModel.reports.collectAsStateWithLifecycle()
    val bansState by viewModel.bans.collectAsStateWithLifecycle()
    val toastMsg by viewModel.toastMessage.collectAsStateWithLifecycle()
    val giftCelebration by viewModel.giftCelebration.collectAsStateWithLifecycle()
    val liveMicLevel by viewModel.liveMicLevel.collectAsStateWithLifecycle()

    val isSupremeOwner = DefaultCatalogs.isSupremeOwnerEmail(viewModel.currentUserEmail)
    val myProfile = (myProfileState as? UiState.Success)?.data ?: PublicProfile(
        userId = viewModel.currentUserId,
        username = "عضو",
        displayName = "عضو"
    )
    val myPrivate = (myPrivateState as? UiState.Success)?.data
    val allProfiles = (profilesState as? UiState.Success)?.data.orEmpty()
    val visibleProfiles = allProfiles.filter { !it.isStealth || it.userId == viewModel.currentUserId || isSupremeOwner }
    val allRooms = (roomsState as? UiState.Success)?.data ?: DefaultCatalogs.defaultRooms
    val activeRoom = allRooms.firstOrNull { it.id == activeRoomId } ?: allRooms.firstOrNull() ?: DefaultCatalogs.defaultRooms.first()
    val ranks = (ranksState as? UiState.Success)?.data ?: DefaultCatalogs.defaultRanks
    val myRank = DefaultCatalogs.rankFor(myProfile.role, ranks)
    val isRoomOwnerForActive = isSupremeOwner || (myRank.permRoomOwner && activeRoom.ownerUserId == viewModel.currentUserId)
    val canPublishNews = isSupremeOwner || myRank.permPublishNews || myRank.permAccessPanel
    val messages = (messagesState as? UiState.Success)?.data.orEmpty()
    val mics = (micsState as? UiState.Success)?.data ?: (1..5).map {
        com.shat.alghoraf.data.RoomMicSlot(id = it.toString(), roomId = activeRoomId, slotNumber = it.toLong())
    }
    val notifications = (notifsState as? UiState.Success)?.data.orEmpty()
    val unreadNotifCount = notifications.count { !it.isRead }
    val bans = (bansState as? UiState.Success)?.data.orEmpty()
    val isBanned = myPrivate?.isBanned == true || bans.any { it.targetUserId == viewModel.currentUserId && it.isActive }

    // UI Modal States
    var showProfileDialog by remember { mutableStateOf(false) }
    var showAdminDialog by remember { mutableStateOf(false) }
    var showRoomOwnerDialog by remember { mutableStateOf(false) }
    var showLeaderboardTab by remember { mutableStateOf<Int?>(null) }
    var showSocialTab by remember { mutableStateOf<Int?>(null) }
    var showReportDialog by remember { mutableStateOf(false) }
    var showYoutubeDialog by remember { mutableStateOf(false) }
    var youtubeMutedLocally by remember { mutableStateOf(false) }
    var selectedUserForCard by remember { mutableStateOf<PublicProfile?>(null) }
    var selectedUserForGift by remember { mutableStateOf<PublicProfile?>(null) }

    var micsExpanded by remember { mutableStateOf(true) }
    var showTopicBanner by remember { mutableStateOf(true) }
    var radioPlaying by remember { mutableStateOf(false) }
    var showEmojiBar by remember { mutableStateOf(false) }
    var showPlusMenu by remember { mutableStateOf(false) }
    var asAdminNotice by remember { mutableStateOf(false) }
    var draftMessage by remember { mutableStateOf("") }
    var previousUnreadCount by remember { mutableIntStateOf(0) }

    var hasAudioPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }
    var pendingMicSlot by remember { mutableStateOf<Int?>(null) }
    var pendingVoiceRecord by remember { mutableStateOf(false) }
    var isRecordingAudio by remember { mutableStateOf(false) }
    var activeRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var recordedFilePath by remember { mutableStateOf<String?>(null) }

    val audioPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasAudioPermission = granted
        if (granted) {
            pendingMicSlot?.let { slot ->
                viewModel.toggleMicSlot(slot)
                pendingMicSlot = null
            }
            if (pendingVoiceRecord) {
                pendingVoiceRecord = false
                viewModel.showNotice("تم منح صلاحية المايك! اضغط الآن للتسجيل الصوتي.")
            }
        } else {
            pendingMicSlot = null
            pendingVoiceRecord = false
            viewModel.showNotice("يرجى السماح بصلاحية المايكروفون لاستخدام المايكات والتسجيل.")
        }
    }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            val b64 = encodeUriToSmallBase64(context, uri, 512)
            if (b64 != null) {
                viewModel.sendMessage(text = "📷 صورة مرسلة", msgType = "image", mediaUrl = b64)
            } else {
                viewModel.showNotice("تعذر ضغط الصورة")
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            try {
                activeRecorder?.stop()
                activeRecorder?.release()
            } catch (_: Exception) { }
        }
    }

    LaunchedEffect(mics, hasAudioPermission) {
        if (hasAudioPermission) {
            viewModel.syncMyMicAudioState(mics)
        }
    }

    LaunchedEffect(unreadNotifCount) {
        if (unreadNotifCount > previousUnreadCount && settings.soundEffectsEnabled) {
            try {
                ToneGenerator(AudioManager.STREAM_NOTIFICATION, 75)
                    .startTone(ToneGenerator.TONE_PROP_BEEP2, 220)
            } catch (_: Exception) { }
        }
        previousUnreadCount = unreadNotifCount
    }

    LaunchedEffect(toastMsg) {
        val m = toastMsg
        if (!m.isNullOrBlank()) {
            snackbarHostState.showSnackbar(m)
            viewModel.clearToast()
        }
    }

    val listState = rememberLazyListState()
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    if (isBanned && !isSupremeOwner) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0xFFFEF2F2)).padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("🚫 تم حظر حسابك", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = CrimsonOwner)
                    Text("السبب: ${myPrivate?.banReason?.ifBlank { "مخالفة القوانين" } ?: "مخالفة القوانين"}")
                    androidx.compose.material3.Button(onClick = {
                        GoogleAuthManager.signOut(credentialManager, scope)
                    }) { Text("تسجيل الخروج") }
                }
            }
        }
        return
    }

    val isDarkTheme = false

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(modifier = Modifier.width(300.dp)) {
                Column(modifier = Modifier.fillMaxHeight().padding(14.dp)) {
                    Text("🏠 غرف الشات (${allRooms.size})", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = RoyalBlue)
                    Spacer(Modifier.height(8.dp))
                    allRooms.forEach { rm ->
                        NavigationDrawerItem(
                            selected = rm.id == activeRoomId,
                            onClick = {
                                if (myRank.power >= rm.minRankPower || isSupremeOwner) {
                                    viewModel.switchRoom(rm.id)
                                    scope.launch { drawerState.close() }
                                } else {
                                    viewModel.showNotice("تتطلب هذه الغرفة رتبة بقوة ${rm.minRankPower}+")
                                }
                            },
                            label = {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    Text("${rm.icon} ${rm.name}", fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("${rm.activityPoints}⭐", fontSize = 11.sp, color = RoyalGold)
                                }
                            },
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))
                    Text("🟢 المتصلون الآن (${visibleProfiles.count { it.isOnline }})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = RoyalBlue)
                    Spacer(Modifier.height(6.dp))
                    LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(visibleProfiles) { u ->
                            val uRank = DefaultCatalogs.rankFor(u.role, ranks)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .clickable {
                                        selectedUserForCard = u
                                        scope.launch { drawerState.close() }
                                    }
                                    .padding(6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AvatarWithFrame(u.avatarUrl, u.shownName, u.avatarFrame, size = 36.dp, showOnlineDot = true, isOnline = u.isOnline)
                                Column(modifier = Modifier.weight(1f)) {
                                    StyledChatName(u.shownName, u.nameColor, u.nameplateStyle, u.nameShine, u.fontFamily, u.vipWings, u.nameBgColor, u.neonColor)
                                    StyledRankBadge(uRank)
                                }
                            }
                        }
                    }
                    if (isSupremeOwner) {
                        Surface(
                            color = Color(0xFFFFFBEB),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .border(1.dp, RoyalGold, RoundedCornerShape(12.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("👻 وضع التخفي للمالك", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF92400E))
                                androidx.compose.material3.Switch(
                                    checked = myProfile.isStealth,
                                    onCheckedChange = { viewModel.toggleStealth(it) },
                                    modifier = Modifier.testTag("drawer_stealth_switch")
                                )
                            }
                        }
                    }
                    if (isRoomOwnerForActive) {
                        NavigationDrawerItem(
                            selected = false,
                            onClick = {
                                scope.launch { drawerState.close() }
                                showRoomOwnerDialog = true
                            },
                            icon = { Icon(Icons.Default.Settings, contentDescription = null, tint = RoyalGold) },
                            label = { Text("👑 إدارة الغرفة الحالية", fontWeight = FontWeight.Bold) }
                        )
                    }
                    NavigationDrawerItem(
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            showSocialTab = 4
                        },
                        icon = { Icon(Icons.Default.Newspaper, contentDescription = null, tint = RoyalBlue) },
                        label = { Text("📰 الأخبار والإعلانات", fontWeight = FontWeight.SemiBold) }
                    )
                    NavigationDrawerItem(
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            showReportDialog = true
                        },
                        icon = { Icon(Icons.Default.Report, contentDescription = null, tint = CrimsonOwner) },
                        label = { Text("🚨 إبلاغ الإدارة", fontWeight = FontWeight.SemiBold) }
                    )
                    if (myRank.permAccessPanel || isSupremeOwner) {
                        NavigationDrawerItem(
                            selected = false,
                            onClick = {
                                scope.launch { drawerState.close() }
                                showAdminDialog = true
                            },
                            icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = CrimsonOwner) },
                            label = { Text("لوحة تحكم الإدارة", fontWeight = FontWeight.Bold, color = CrimsonOwner) }
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            containerColor = FeedLightBg,
            topBar = {
                // CodyChat Compact Dark Navy Header (48dp - #0B2239)
                Surface(
                    color = CodyHeaderNavy,
                    shadowElevation = 3.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .height(48.dp)
                            .padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Profile Avatar with Gold Ring & Green Online Dot
                        Box(modifier = Modifier.testTag("top_profile_avatar")) {
                            AvatarWithFrame(
                                avatarUrl = myProfile.avatarUrl,
                                name = myProfile.shownName,
                                frameId = if (myProfile.avatarFrame == "none") "gold_royal" else myProfile.avatarFrame,
                                size = 34.dp,
                                showOnlineDot = true,
                                isOnline = true,
                                onClick = { showProfileDialog = true }
                            )
                        }

                        Spacer(Modifier.width(6.dp))

                        // Quick Action Icons with Small White Labels (اشعار، طلب، رسالة)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TopQuickAction(
                                icon = Icons.Default.Notifications,
                                label = "اشعار",
                                badgeCount = unreadNotifCount,
                                onClick = { showSocialTab = 0 },
                                tag = "top_notif_btn"
                            )
                            TopQuickAction(Icons.Default.PersonAdd, "طلب", onClick = { showSocialTab = 1 }, tag = "top_friends_btn")
                            TopQuickAction(Icons.Default.Mail, "رسالة", onClick = { showSocialTab = 2 }, tag = "top_pm_btn")
                        }

                        Spacer(Modifier.weight(1f))

                        // Gold Crown (الاثرياء) & Orange Diamond (الكبار)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HeaderRankAction(label = "الاثرياء", emoji = "👑", tintBg = Color(0x33F59E0B)) { showLeaderboardTab = 0 }
                            HeaderRankAction(label = "الكبار", emoji = "🔶", tintBg = Color(0x33F97316)) { showLeaderboardTab = 1 }
                        }

                        Spacer(Modifier.width(6.dp))

                        // Green Sidebar Menu Button (☰)
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(GreenAccent)
                                .clickable { scope.launch { drawerState.open() } }
                                .testTag("drawer_menu_button"),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Menu, contentDescription = "القائمة الجانبية", tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            },
            bottomBar = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .imePadding()
                ) {
                    // 1. Calm Light-Green Topic Banner (#D8F3DC)
                    AnimatedVisibility(visible = showTopicBanner) {
                        Surface(
                            color = TopicGreenBg,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Color(0xFFEAB308),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "الموضوع:",
                                    color = TopicGreenText,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = activeRoom.welcomeMessage.ifBlank { settings.marqueeText },
                                    color = TopicGreenText,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "إغلاق الموضوع",
                                    tint = TopicGreenText,
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clickable { showTopicBanner = false }
                                )
                            }
                        }
                    }

                    // Expandable Plus Menu & Emoji Bar
                    AnimatedVisibility(visible = showPlusMenu) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CodyHeaderNavy)
                                .padding(horizontal = 8.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            PlusMenuAction(Icons.Default.Image, "صورة") {
                                showPlusMenu = false
                                imagePickerLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                            }
                            PlusMenuAction(Icons.Default.PlayArrow, "يوتيوب") {
                                showPlusMenu = false
                                showYoutubeDialog = true
                            }
                            PlusMenuAction(Icons.Default.Newspaper, "الأخبار") {
                                showPlusMenu = false
                                showSocialTab = 4
                            }
                            PlusMenuAction(Icons.Default.Forum, "الحائط") {
                                showPlusMenu = false
                                showSocialTab = 3
                            }
                            PlusMenuAction(Icons.Default.Report, "إبلاغ") {
                                showPlusMenu = false
                                showReportDialog = true
                            }
                            if (myRank.permAccessPanel || isSupremeOwner) {
                                PlusMenuAction(Icons.Default.Campaign, if (asAdminNotice) "إلغاء تنبيه" else "إشعار") {
                                    asAdminNotice = !asAdminNotice
                                    showPlusMenu = false
                                }
                            }
                        }
                    }

                    AnimatedVisibility(visible = showEmojiBar) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White)
                                .horizontalScroll(rememberScrollState())
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            DefaultCatalogs.quickEmojis.forEach { emoji ->
                                Text(
                                    text = emoji,
                                    fontSize = 22.sp,
                                    modifier = Modifier.clickable { draftMessage += emoji }
                                )
                            }
                        }
                    }

                    // 2. White Input Bar (Send Circle -> Oval Pill with Yellow Emoji -> Voice Mic & Plus)
                    Surface(
                        color = Color.White,
                        shadowElevation = 2.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Right: Sky-Blue Circular Send Button
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(SendSkyBlue)
                                    .clickable {
                                        val txt = draftMessage.trim()
                                        if (txt.isNotEmpty()) {
                                            viewModel.sendMessage(txt, asAdminNotice = asAdminNotice)
                                            draftMessage = ""
                                            asAdminNotice = false
                                            if (settings.soundEffectsEnabled) {
                                                try {
                                                    ToneGenerator(AudioManager.STREAM_NOTIFICATION, 45)
                                                        .startTone(ToneGenerator.TONE_PROP_BEEP, 80)
                                                } catch (_: Exception) { }
                                            }
                                        }
                                    }
                                    .testTag("send_message_button"),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "إرسال", tint = Color.White, modifier = Modifier.size(18.dp))
                            }

                            // Center: Oval Input Pill with Yellow Emoji Inside
                            Row(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(38.dp)
                                    .clip(RoundedCornerShape(50))
                                    .background(FeedLightBg)
                                    .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(50))
                                    .padding(horizontal = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                                    if (draftMessage.isEmpty()) {
                                        Text(
                                            text = if (asAdminNotice) "اكتب إشعار الإدارة..." else "اكتب هنا...",
                                            fontSize = 13.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                    BasicTextField(
                                        value = draftMessage,
                                        onValueChange = { draftMessage = it },
                                        singleLine = true,
                                        textStyle = TextStyle(color = Color(0xFF0F172A), fontSize = 13.5.sp),
                                        cursorBrush = SolidColor(SendSkyBlue),
                                        modifier = Modifier.fillMaxWidth().testTag("message_input")
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.EmojiEmotions,
                                    contentDescription = "الإيموجيات",
                                    tint = Color(0xFFEAB308),
                                    modifier = Modifier
                                        .size(22.dp)
                                        .clickable { showEmojiBar = !showEmojiBar }
                                )
                            }

                            // Left: Voice Mic Button & Plus (+)
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(if (isRecordingAudio) Color(0xFFEF4444) else FeedLightBg)
                                    .border(1.dp, Color(0xFFE2E8F0), CircleShape)
                                    .clickable {
                                        if (!hasAudioPermission) {
                                            pendingVoiceRecord = true
                                            audioPermLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                        } else if (!isRecordingAudio) {
                                            try {
                                                val file = File(context.cacheDir, "voice_${System.currentTimeMillis()}.m4a")
                                                val rec = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                                    MediaRecorder(context)
                                                } else {
                                                    @Suppress("DEPRECATION")
                                                    MediaRecorder()
                                                }
                                                rec.setAudioSource(MediaRecorder.AudioSource.MIC)
                                                rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                                                rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                                                rec.setOutputFile(file.absolutePath)
                                                rec.prepare()
                                                rec.start()
                                                activeRecorder = rec
                                                recordedFilePath = file.absolutePath
                                                isRecordingAudio = true
                                                viewModel.showNotice("🎙️ جاري تسجيل الصوت... اضغط مجدداً للإرسال")
                                            } catch (_: Exception) {
                                                viewModel.showNotice("تعذر بدء التسجيل الصوتي")
                                            }
                                        } else {
                                            try {
                                                activeRecorder?.stop()
                                                activeRecorder?.release()
                                                activeRecorder = null
                                                isRecordingAudio = false
                                                val file = recordedFilePath?.let { File(it) }
                                                if (file != null && file.exists()) {
                                                    val bytes = file.readBytes()
                                                    if (bytes.size <= 450_000) {
                                                        val b64 = "data:audio/mp4;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
                                                        viewModel.sendMessage("🎤 رسالة صوتية", msgType = "audio", mediaUrl = b64)
                                                    } else {
                                                        viewModel.showNotice("المقطع الصوتي طويل جداً")
                                                    }
                                                    file.delete()
                                                }
                                            } catch (_: Exception) {
                                                isRecordingAudio = false
                                            }
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isRecordingAudio) Icons.Default.Stop else Icons.Default.Mic,
                                    contentDescription = "رسالة صوتية",
                                    tint = if (isRecordingAudio) Color.White else CodyHeaderNavy,
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(FeedLightBg)
                                    .border(1.dp, Color(0xFFE2E8F0), CircleShape)
                                    .clickable { showPlusMenu = !showPlusMenu }
                                    .testTag("plus_menu_button"),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "المرفقات والإضافات", tint = CodyHeaderNavy, modifier = Modifier.size(19.dp))
                            }
                        }
                    }

                    // 3. Fixed Dark Navy Footer Bar (#0B2239)
                    Surface(
                        color = CodyHeaderNavy,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .navigationBarsPadding()
                                .height(48.dp)
                                .padding(horizontal = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                FooterNavAction(Icons.Default.Settings, "الخيارات") {
                                    showProfileDialog = true
                                }
                                FooterNavAction(Icons.Default.Groups, "متواجدين (${visibleProfiles.count { it.isOnline }})") {
                                    scope.launch { drawerState.open() }
                                }
                                FooterNavAction(Icons.Default.Home, "الغرف") {
                                    scope.launch { drawerState.open() }
                                }
                            }

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                FooterNavAction(Icons.Default.Refresh, "تحديث") {
                                    viewModel.refreshActiveRoom()
                                }
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(GreenAccent)
                                        .border(1.5.dp, Color(0xFF86EFAC), CircleShape)
                                        .clickable {
                                            radioPlaying = !radioPlaying
                                            val track = myProfile.profileMusic.ifBlank { "preset:calm_lofi" }
                                            viewModel.previewProfileMusic(if (radioPlaying) track else "")
                                            viewModel.showNotice(if (radioPlaying) "📻 تم تشغيل الراديو" else "⏹️ تم إيقاف الراديو")
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (radioPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                        contentDescription = "الراديو",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(FeedLightBg)
            ) {
                // 1. White Strip with 5 Royal Blue Mics (#1A237E) & Blue Divider Buttons
                if (activeRoom.micsEnabled) {
                    VoiceMicStrip(
                        mics = mics,
                        currentUid = viewModel.currentUserId,
                        isAdminUser = myRank.permMute || isSupremeOwner || isRoomOwnerForActive,
                        hasAudioPermission = hasAudioPermission,
                        liveMicLevel = liveMicLevel,
                        isExpanded = micsExpanded,
                        onToggleExpand = { micsExpanded = !micsExpanded },
                        onMicClick = { slot ->
                            if (!hasAudioPermission) {
                                pendingMicSlot = slot.slotNumber.toInt()
                                audioPermLauncher.launch(Manifest.permission.RECORD_AUDIO)
                            } else {
                                viewModel.toggleMicSlot(slot.slotNumber.toInt())
                            }
                        },
                        onLeaveMic = { slot -> viewModel.leaveMicSlot(slot) },
                        onAdminMuteMic = { slot, mute -> viewModel.adminMuteMic(slot, mute) },
                        onOpenMicSettings = {
                            if (isSupremeOwner || myRank.permAccessPanel || isRoomOwnerForActive) {
                                showYoutubeDialog = true
                            } else if (!hasAudioPermission) {
                                audioPermLauncher.launch(Manifest.permission.RECORD_AUDIO)
                            } else {
                                viewModel.showNotice("إعدادات المايك: التقاط الصوت مفعل والمزامنة نشطة ✅")
                            }
                        }
                    )
                }

                if (activeRoom.youtubeIsPlaying && activeRoom.youtubeVideoId.isNotBlank()) {
                    InRoomYoutubePlayer(
                        videoId = activeRoom.youtubeVideoId,
                        title = activeRoom.youtubeTitle,
                        isMutedLocally = youtubeMutedLocally,
                        canControlRoomPlayer = isSupremeOwner || myRank.permAccessPanel || myRank.permMute || isRoomOwnerForActive,
                        onToggleMute = { youtubeMutedLocally = !youtubeMutedLocally },
                        onStopForRoom = { viewModel.updateRoomYoutube("", "", false) }
                    )
                }

                // 2. Clean Light Messages Feed (#F8F9FA)
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    when (val state = messagesState) {
                        is UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = RoyalBlue)
                        }
                        is UiState.Error -> Box(Modifier.fillMaxSize().padding(20.dp), contentAlignment = Alignment.Center) {
                            Text(state.message, color = if (isDarkTheme) Color.White else CrimsonOwner)
                        }
                        is UiState.Success -> {
                            val msgs = state.data
                            if (msgs.isEmpty()) {
                                Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                                    Text(
                                        "لا توجد رسائل في ${activeRoom.name} بعد — كن أول من يرحب بالجميع!",
                                        color = Color(0xFF64748B),
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            } else {
                                LazyColumn(
                                    state = listState,
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.spacedBy(2.dp)
                                ) {
                                    items(msgs, key = { it.id.ifBlank { "${it.senderId}_${it.createdAt}" } }) { msg ->
                                        val senderProfile = allProfiles.firstOrNull { it.userId == msg.senderId }
                                        val senderRank = DefaultCatalogs.rankFor(senderProfile?.role ?: msg.senderRole, ranks)
                                        val cardProfile = senderProfile ?: PublicProfile(
                                            userId = msg.senderId,
                                            username = msg.senderName,
                                            displayName = msg.senderName,
                                            role = msg.senderRole,
                                            avatarUrl = msg.avatarUrl,
                                            avatarFrame = msg.avatarFrame,
                                            nameColor = msg.nameColor,
                                            nameplateStyle = msg.nameplateStyle,
                                            nameShine = msg.nameShine,
                                            vipWings = msg.vipWings
                                        )
                                        ChatMessageRow(
                                            message = msg,
                                            rank = senderRank,
                                            canModerate = isSupremeOwner || myRank.permClearRoom || myRank.permBan || myRank.permMute,
                                            isMyMessage = msg.senderId == viewModel.currentUserId,
                                            onSenderClick = { selectedUserForCard = cardProfile },
                                            onDeleteClick = { if (msg.id.isNotBlank()) viewModel.deleteMessage(msg.id) },
                                            onMentionClick = { draftMessage += "@${msg.senderName} " },
                                            onPmClick = { selectedUserForCard = cardProfile },
                                            onMuteClick = { viewModel.muteUser(cardProfile, "كتم من الإدارة") },
                                            onPlayAudio = { dataUrl ->
                                                try {
                                                    val b64 = dataUrl.substringAfter("base64,", "")
                                                    val bytes = Base64.decode(b64, Base64.DEFAULT)
                                                    val tmp = File(context.cacheDir, "play_msg.m4a")
                                                    tmp.writeBytes(bytes)
                                                    MediaPlayer().apply {
                                                        setDataSource(tmp.absolutePath)
                                                        prepare()
                                                        setOnCompletionListener { release() }
                                                        start()
                                                    }
                                                } catch (_: Exception) {
                                                    viewModel.showNotice("تعذر تشغيل المقطع الصوتي")
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Gift Celebration Banner
                    giftCelebration?.let { banner ->
                        Surface(
                            color = RoyalGold,
                            shape = RoundedCornerShape(18.dp),
                            shadowElevation = 8.dp,
                            modifier = Modifier
                                .align(Alignment.TopCenter)
                                .padding(14.dp)
                                .clickable { viewModel.clearGiftCelebration() }
                        ) {
                            Text(
                                text = banner,
                                color = Color.Black,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
                            )
                        }
                    }
                }
            }
        }
    }

    // --- Modal Dialogs ---
    if (showProfileDialog) {
        ProfileCustomizerDialog(
            profile = myProfile,
            isSupremeOwner = isSupremeOwner,
            ranks = ranks,
            onDismiss = { showProfileDialog = false },
            onSave = { dName, bio, av, nc, tc, nbg, neon, ff, fs, frame, plate, shine, wings, music, fam ->
                viewModel.saveCustomizations(dName, bio, av, nc, tc, nbg, neon, ff, fs, frame, plate, shine, wings, music, fam)
            },
            onToggleStealth = { viewModel.toggleStealth(it) },
            onOpenAdminPanel = { showAdminDialog = true },
            onPreviewMusic = { viewModel.previewProfileMusic(it) },
            onSignOut = {
                showProfileDialog = false
                scope.launch {
                    viewModel.goOfflineBeforeSignOut()
                    GoogleAuthManager.signOut(credentialManager, scope)
                }
            }
        )
    }

    selectedUserForCard?.let { target ->
        QuickUserCardDialog(
            target = target,
            myProfile = myProfile,
            ranks = ranks,
            isSupremeOwner = isSupremeOwner,
            onDismiss = { selectedUserForCard = null },
            onOpenSendGift = { selectedUserForGift = target },
            onSendPrivateMsg = { txt -> viewModel.sendPrivateMessage(target, txt) },
            onAddFriend = { viewModel.sendFriendRequest(target) },
            onReport = { reason -> viewModel.submitReport(target.userId, target.shownName, reason) },
            onAssignRank = { rkKey, grantAdmin -> viewModel.assignRank(target.userId, rkKey, grantAdmin) },
            onMute = { reason -> viewModel.muteUser(target, reason) },
            onBan = { reason -> viewModel.banUser(target, reason) },
            onPreviewMusic = { viewModel.previewProfileMusic(it) }
        )
    }

    selectedUserForGift?.let { recipient ->
        SendGiftDialog(
            recipient = recipient,
            myCoins = myProfile.coins,
            onDismiss = { selectedUserForGift = null },
            onSendGift = { gift -> viewModel.sendGift(recipient, gift) }
        )
    }

    showLeaderboardTab?.let { initial ->
        LeaderboardsDialog(
            profiles = visibleProfiles,
            rooms = allRooms,
            ranks = ranks,
            initialTab = initial,
            onDismiss = { showLeaderboardTab = null },
            onUserClick = { selectedUserForCard = it }
        )
    }

    showSocialTab?.let { initial ->
        SocialHubDialog(
            initialTab = initial,
            myUid = viewModel.currentUserId,
            canPublishNews = canPublishNews,
            notifications = notifications,
            friendships = (friendsState as? UiState.Success)?.data.orEmpty(),
            privateMessages = (pmsState as? UiState.Success)?.data.orEmpty(),
            wallPosts = (wallState as? UiState.Success)?.data.orEmpty(),
            newsPosts = (newsState as? UiState.Success)?.data.orEmpty(),
            profiles = visibleProfiles,
            onDismiss = { showSocialTab = null },
            onMarkNotifRead = { viewModel.markNotificationRead(it) },
            onAcceptFriend = { viewModel.acceptFriend(it) },
            onRemoveFriend = { viewModel.removeFriend(it) },
            onSendPm = { partner, msg -> viewModel.sendPrivateMessage(partner, msg) },
            onCreateWallPost = { viewModel.createWallPost(it) },
            onLikeWallPost = { viewModel.likeWallPost(it) },
            onPublishNews = { title, content, imageUrl -> viewModel.publishNews(title, content, imageUrl) }
        )
    }

    if (showAdminDialog) {
        AdminPanelDialog(
            isSupremeOwner = isSupremeOwner,
            profiles = allProfiles,
            rooms = allRooms,
            ranks = ranks,
            news = (newsState as? UiState.Success)?.data.orEmpty(),
            bans = bans,
            reports = (reportsState as? UiState.Success)?.data.orEmpty(),
            siteSettings = settings,
            messageCount = messages.size,
            onDismiss = { showAdminDialog = false },
            onAssignRank = { uid, rkKey, grantAdmin -> viewModel.assignRank(uid, rkKey, grantAdmin) },
            onSaveRank = { viewModel.saveRank(it) },
            onSaveRoom = { id, name, desc, icon, theme, welcome, power, micsEnabled, ownerUid, ownerName ->
                viewModel.saveRoom(id, name, desc, icon, theme, welcome, power, micsEnabled, ownerUid, ownerName)
            },
            onPublishNews = { title, content, imageUrl -> viewModel.publishNews(title, content, imageUrl) },
            onSaveSiteSettings = { sName, wBanner, mText, sound ->
                viewModel.saveSiteSettings(sName, wBanner, mText, sound)
            },
            onBanUser = { target, reason -> viewModel.banUser(target, reason) },
            onUnbanUser = { viewModel.unbanUser(it) }
        )
    }

    if (showRoomOwnerDialog) {
        RoomOwnerEditDialog(
            room = activeRoom,
            onDismiss = { showRoomOwnerDialog = false },
            onSave = { name, welcome, theme, micsEnabled ->
                viewModel.saveRoom(
                    roomId = activeRoom.id,
                    name = name,
                    desc = activeRoom.description,
                    icon = activeRoom.icon,
                    bgTheme = theme,
                    welcome = welcome,
                    minPower = activeRoom.minRankPower,
                    micsEnabled = micsEnabled,
                    ownerUserId = activeRoom.ownerUserId,
                    ownerName = activeRoom.ownerName
                )
            }
        )
    }

    if (showReportDialog) {
        ReportDialog(
            onDismiss = { showReportDialog = false },
            onSubmit = { reason -> viewModel.submitReport("room_${activeRoom.id}", activeRoom.name, reason) }
        )
    }

    if (showYoutubeDialog) {
        YoutubeRoomDialog(
            currentTitle = activeRoom.youtubeTitle,
            currentVideoId = activeRoom.youtubeVideoId,
            onDismiss = { showYoutubeDialog = false },
            onApply = { vid, title, playing -> viewModel.updateRoomYoutube(vid, title, playing) }
        )
    }
}

@Composable
private fun TopQuickAction(
    icon: ImageVector,
    label: String,
    badgeCount: Int = 0,
    onClick: () -> Unit,
    tag: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 4.dp, vertical = 2.dp)
            .testTag(tag)
    ) {
        if (badgeCount > 0) {
            BadgedBox(badge = { Badge(containerColor = Color(0xFFEF4444)) { Text(badgeCount.toString(), color = Color.White, fontSize = 9.sp) } }) {
                Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(17.dp))
            }
        } else {
            Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(17.dp))
        }
        Text(label, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun HeaderRankAction(
    label: String,
    emoji: String,
    tintBg: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(tintBg)
            .clickable { onClick() }
            .padding(horizontal = 5.dp, vertical = 2.dp)
    ) {
        Text(emoji, fontSize = 13.sp)
        Text(label, color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FooterNavAction(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(18.dp))
        Text(label, color = Color.White, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, maxLines = 1)
    }
}

@Composable
private fun PlusMenuAction(icon: ImageVector, label: String, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Icon(icon, contentDescription = label, tint = RoyalGold, modifier = Modifier.size(22.dp))
        Text(label, color = Color.White, fontSize = 11.sp)
    }
}
