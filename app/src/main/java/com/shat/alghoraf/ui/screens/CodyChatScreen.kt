package com.shat.alghoraf.ui.screens

import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.AddPhotoAlternate
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CleaningServices
import androidx.compose.material.icons.rounded.EmojiEmotions
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.material3.FilterChip
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.data.model.AvatarFrame
import com.shat.alghoraf.data.model.BottomNavTab
import com.shat.alghoraf.data.model.ChatThemeOption
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.NameplateStyle
import com.shat.alghoraf.ui.components.CodyBottomNavBar
import com.shat.alghoraf.ui.components.CodyChatMessageCard
import com.shat.alghoraf.ui.components.CodyTopBar
import com.shat.alghoraf.ui.components.CodyVoiceMicsBar
import com.shat.alghoraf.ui.components.DecoratedNameplate
import com.shat.alghoraf.ui.components.EditProfileDialog
import com.shat.alghoraf.ui.components.LeaderboardsDialog
import com.shat.alghoraf.ui.components.NotificationsDialog
import com.shat.alghoraf.ui.components.OwnerControlPanelView
import com.shat.alghoraf.ui.components.RankPillBadge
import com.shat.alghoraf.ui.components.RoomOptionsAndThemeDialog
import com.shat.alghoraf.ui.components.UpgradeGuestDialog
import com.shat.alghoraf.ui.components.UserActionDialog
import com.shat.alghoraf.ui.components.UserAvatarBadge
import com.shat.alghoraf.ui.components.WallPostsDialog
import com.shat.alghoraf.ui.theme.CodyColors
import com.shat.alghoraf.ui.viewmodel.AiUiState
import com.shat.alghoraf.ui.viewmodel.ChatUiState
import com.shat.alghoraf.ui.viewmodel.ChatViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private enum class ActiveModal {
    NONE, UPGRADE_GUEST, PROFILE_EDIT, ROOM_OPTIONS, NOTIFICATIONS, WALL, RICH_BOARD, KIBAR_BOARD, REPORT, AI_ASSISTANT
}

@Composable
fun CodyChatScreen(
    state: ChatUiState,
    viewModel: ChatViewModel,
    pickedProfileAvatarUri: String?,
    onClearPickedProfileAvatar: () -> Unit,
    onRequestProfileAvatarPick: () -> Unit,
    onRequestChatImagePick: () -> Unit,
    onEnsureAudioPermission: (onGranted: () -> Unit) -> Unit
) {
    val me = state.currentUser ?: return
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var activeModal by remember { mutableStateOf(ActiveModal.NONE) }
    var inspectedUser by remember { mutableStateOf<ChatUser?>(null) }

    LaunchedEffect(state.toastMessage) {
        val msg = state.toastMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            viewModel.consumeToast()
        }
    }

    BackHandler(enabled = drawerState.isOpen || state.selectedTab != BottomNavTab.CHAT) {
        if (drawerState.isOpen) {
            scope.launch { drawerState.close() }
        } else {
            viewModel.selectTab(BottomNavTab.CHAT)
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.White,
                modifier = Modifier.width(290.dp)
            ) {
                val room = state.activeRoom
                Surface(
                    color = CodyColors.RoyalBlue,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "${room?.iconEmoji ?: "💬"} الغرفة الحالية:",
                            color = Color.White.copy(alpha = 0.85f),
                            style = MaterialTheme.typography.labelMedium
                        )
                        Text(
                            text = room?.name ?: "الغرفة العامة",
                            color = Color.White,
                            style = MaterialTheme.typography.headlineSmall
                        )
                        Text(
                            text = "متصلون الآن: ${state.allUsers.count { it.isOnline && !it.isBanned }}",
                            color = Color(0xFFFEF08A),
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                NavigationDrawerItem(
                    label = { Text("🧱 حائط الأصدقاء") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() }; activeModal = ActiveModal.WALL }
                )
                NavigationDrawerItem(
                    label = { Text("📰 الأخبار والإعلانات") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() }; activeModal = ActiveModal.WALL }
                )
                NavigationDrawerItem(
                    label = { Text("✨ المساعد الذكي (Gemini)") },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        viewModel.resetAiState()
                        activeModal = ActiveModal.AI_ASSISTANT
                    }
                )
                NavigationDrawerItem(
                    label = { Text("🎙️ تفاعل المايكات") },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        viewModel.selectTab(BottomNavTab.CHAT)
                    }
                )
                NavigationDrawerItem(
                    label = { Text("⚜️ عائلات VIP والمحفظة") },
                    selected = state.selectedTab == BottomNavTab.SHOP,
                    onClick = {
                        scope.launch { drawerState.close() }
                        viewModel.selectTab(BottomNavTab.SHOP)
                    }
                )
                NavigationDrawerItem(
                    label = { Text("👑 قائمة الكبار") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() }; activeModal = ActiveModal.KIBAR_BOARD }
                )
                NavigationDrawerItem(
                    label = { Text("💎 قائمة الأثرياء") },
                    selected = false,
                    onClick = { scope.launch { drawerState.close() }; activeModal = ActiveModal.RICH_BOARD }
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                Text(
                    "الغرف المتاحة:",
                    style = MaterialTheme.typography.labelMedium,
                    color = CodyColors.TextSecondary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
                state.rooms.forEach { r ->
                    NavigationDrawerItem(
                        label = { Text("${r.iconEmoji} ${r.name}") },
                        selected = r.id == state.activeRoomId,
                        onClick = {
                            scope.launch { drawerState.close() }
                            viewModel.switchRoom(r.id)
                        }
                    )
                }
            }
        }
    ) {
        Scaffold(
            contentWindowInsets = WindowInsets(0, 0, 0, 0),
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                CodyTopBar(
                    currentUser = me,
                    unreadNotifications = state.unreadNotificationsCount,
                    onOpenDrawer = { scope.launch { drawerState.open() } },
                    onOpenUpgradeGuest = { activeModal = ActiveModal.UPGRADE_GUEST },
                    onOpenProfileEdit = {
                        onClearPickedProfileAvatar()
                        activeModal = ActiveModal.PROFILE_EDIT
                    },
                    onOpenSettings = { activeModal = ActiveModal.ROOM_OPTIONS },
                    onOpenWallet = { viewModel.selectTab(BottomNavTab.SHOP) },
                    onOpenRoomOptions = { activeModal = ActiveModal.ROOM_OPTIONS },
                    onOpenControlPanel = { viewModel.selectTab(BottomNavTab.CONTROL) },
                    onLeaveRoom = { viewModel.selectTab(BottomNavTab.ROOMS) },
                    onLogout = { viewModel.logout() },
                    onOpenReport = { activeModal = ActiveModal.REPORT },
                    onOpenNotifications = { activeModal = ActiveModal.NOTIFICATIONS },
                    onOpenRequests = { activeModal = ActiveModal.WALL },
                    onOpenPrivateMessages = { viewModel.selectTab(BottomNavTab.PRIVATE) },
                    onOpenRichLeaderboard = { activeModal = ActiveModal.RICH_BOARD },
                    onOpenKibarLeaderboard = { activeModal = ActiveModal.KIBAR_BOARD }
                )
            },
            bottomBar = {
                CodyBottomNavBar(
                    selectedTab = state.selectedTab,
                    isStaff = me.rank.isStaff,
                    onSelectTab = { viewModel.selectTab(it) }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                when (state.selectedTab) {
                    BottomNavTab.CHAT -> ChatRoomTabContent(
                        state = state,
                        me = me,
                        viewModel = viewModel,
                        onInspectSender = { key ->
                            inspectedUser = state.allUsers.firstOrNull { it.userKey == key }
                        },
                        onPickChatImage = onRequestChatImagePick,
                        onOpenAiAssistant = {
                            viewModel.resetAiState()
                            activeModal = ActiveModal.AI_ASSISTANT
                        },
                        onEnsureAudioPermission = onEnsureAudioPermission
                    )
                    BottomNavTab.ROOMS -> RoomsTabContent(
                        state = state,
                        onSearchChange = viewModel::updateRoomSearch,
                        onSelectRoom = viewModel::switchRoom
                    )
                    BottomNavTab.ONLINE -> OnlineUsersTabContent(
                        users = state.allUsers,
                        onUserClick = { inspectedUser = it }
                    )
                    BottomNavTab.SHOP -> ShopAndWalletTabContent(
                        me = me,
                        onEquipFrame = viewModel::equipFrame,
                        onEquipNameplate = viewModel::equipNameplate
                    )
                    BottomNavTab.PRIVATE -> PrivateMessagesTabContent(
                        me = me,
                        state = state,
                        onSelectPartner = viewModel::openPrivateChatWith,
                        onSendDm = viewModel::sendPrivateMessage
                    )
                    BottomNavTab.CONTROL -> OwnerControlPanelView(
                        currentUser = me,
                        rooms = state.rooms,
                        allUsers = state.allUsers,
                        reports = state.reports,
                        onCreateRoom = viewModel::createRoom,
                        onDeleteRoom = viewModel::deleteRoom,
                        onClearRoom = viewModel::clearCurrentRoomMessages,
                        onBroadcastAnnouncement = viewModel::broadcastAnnouncement,
                        onInspectUser = { inspectedUser = it },
                        onResolveReport = viewModel::resolveReport
                    )
                }
            }
        }
    }

    inspectedUser?.let { target ->
        UserActionDialog(
            viewer = me,
            target = target,
            onDismiss = { inspectedUser = null },
            onStartDm = { viewModel.openPrivateChatWith(it) },
            onChangeRank = viewModel::changeUserRank,
            onToggleMute = { viewModel.toggleMuteUser(it) },
            onKick = viewModel::kickUser,
            onToggleBan = { viewModel.toggleBanUser(it) },
            onReport = viewModel::submitReport
        )
    }

    when (activeModal) {
        ActiveModal.UPGRADE_GUEST -> UpgradeGuestDialog(
            currentNickname = me.displayName,
            onDismiss = { activeModal = ActiveModal.NONE },
            onUpgrade = viewModel::upgradeGuestToMember
        )
        ActiveModal.PROFILE_EDIT -> EditProfileDialog(
            user = me,
            pendingPickedAvatarUri = pickedProfileAvatarUri,
            onPickAvatarPhoto = onRequestProfileAvatarPick,
            onDismiss = { activeModal = ActiveModal.NONE },
            onSave = viewModel::updateProfile
        )
        ActiveModal.ROOM_OPTIONS -> RoomOptionsAndThemeDialog(
            room = state.activeRoom,
            selectedTheme = state.selectedTheme,
            isStaff = me.rank.isStaff,
            onSelectTheme = viewModel::setTheme,
            onToggleMics = viewModel::toggleCurrentRoomMics,
            onClearMessages = viewModel::clearCurrentRoomMessages,
            onDismiss = { activeModal = ActiveModal.NONE }
        )
        ActiveModal.NOTIFICATIONS -> NotificationsDialog(
            notifications = state.notifications,
            onMarkAllRead = viewModel::markNotificationsRead,
            onDismiss = { activeModal = ActiveModal.NONE }
        )
        ActiveModal.WALL -> WallPostsDialog(
            posts = state.wallPosts,
            onPublish = viewModel::publishWallPost,
            onLike = viewModel::likeWallPost,
            onDismiss = { activeModal = ActiveModal.NONE }
        )
        ActiveModal.RICH_BOARD -> LeaderboardsDialog(
            title = "💎 قائمة الأثرياء (الأكثر نقاطاً)",
            users = state.allUsers,
            byCoins = true,
            onDismiss = { activeModal = ActiveModal.NONE }
        )
        ActiveModal.KIBAR_BOARD -> LeaderboardsDialog(
            title = "👑 قائمة الكبار (أعلى الرتب)",
            users = state.allUsers,
            byCoins = false,
            onDismiss = { activeModal = ActiveModal.NONE }
        )
        ActiveModal.REPORT -> {
            var targetName by remember { mutableStateOf("") }
            var reason by remember { mutableStateOf("") }
            AlertDialog(
                onDismissRequest = { activeModal = ActiveModal.NONE },
                title = { Text("🚩 تقديم بلاغ للإدارة") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = targetName,
                            onValueChange = { targetName = it },
                            label = { Text("اسم العضو المبلغ عنه") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = reason,
                            onValueChange = { reason = it },
                            label = { Text("تفاصيل المخالفة") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (targetName.isNotBlank() && reason.isNotBlank()) {
                                viewModel.submitReport(targetName, reason)
                                activeModal = ActiveModal.NONE
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthRed)
                    ) { Text("إرسال البلاغ") }
                },
                dismissButton = {
                    TextButton(onClick = { activeModal = ActiveModal.NONE }) { Text("إلغاء") }
                }
            )
        }
        ActiveModal.AI_ASSISTANT -> GeminiAssistantDialog(
            aiState = state.aiState,
            roomName = state.activeRoom?.name ?: "الغرفة العامة",
            onSummarizeRoom = viewModel::summarizeActiveRoomWithGemini,
            onAskPrompt = viewModel::askGeminiAssistant,
            onSendToRoom = { text ->
                viewModel.sendTextMessage(text)
                activeModal = ActiveModal.NONE
            },
            onDismiss = {
                viewModel.resetAiState()
                activeModal = ActiveModal.NONE
            }
        )
        ActiveModal.NONE -> Unit
    }
}

@Composable
private fun GeminiAssistantDialog(
    aiState: AiUiState,
    roomName: String,
    onSummarizeRoom: () -> Unit,
    onAskPrompt: (String) -> Unit,
    onSendToRoom: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var customPrompt by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("✨ المساعد الذكي — $roomName") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = false,
                        onClick = onSummarizeRoom,
                        label = { Text("📝 تلخيص الغرفة") }
                    )
                    FilterChip(
                        selected = false,
                        onClick = { onAskPrompt("اكتب ترحيباً عربياً دافئاً وودوداً لأعضاء غرفة \"$roomName\" في سطرين.") },
                        label = { Text("👋 ترحيب مميز") }
                    )
                    FilterChip(
                        selected = false,
                        onClick = { onAskPrompt("اقترح سؤالاً ثقافياً ممتعاً ومختصراً لمسابقة في الشات مع الجواب.") },
                        label = { Text("🎯 سؤال مسابقة") }
                    )
                }

                OutlinedTextField(
                    value = customPrompt,
                    onValueChange = { customPrompt = it },
                    label = { Text("اسأل المساعد الذكي أي شيء...") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth().testTag("gemini_prompt_input")
                )

                when (aiState) {
                    AiUiState.Idle -> {
                        Text(
                            text = "اختر إجراءً سريعاً أو اكتب سؤالك وسيقوم المساعد الذكي بالرد فوراً.",
                            style = MaterialTheme.typography.bodySmall,
                            color = CodyColors.TextSecondary
                        )
                    }
                    AiUiState.Loading -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                            Text("جاري التفكير والكتابة...")
                        }
                    }
                    is AiUiState.Streaming -> {
                        Surface(
                            color = Color(0xFFF1F5F9),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = aiState.text,
                                modifier = Modifier.padding(10.dp),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                    is AiUiState.Success -> {
                        Surface(
                            color = Color(0xFFEFF6FF),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(text = aiState.text, style = MaterialTheme.typography.bodyMedium)
                                TextButton(onClick = { onSendToRoom(aiState.text) }) {
                                    Text("إرسال الرد إلى الغرفة")
                                }
                            }
                        }
                    }
                    is AiUiState.Error -> {
                        Surface(
                            color = Color(0xFFFEE2E2),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "⚠️ ${aiState.message}",
                                color = CodyColors.AuthRed,
                                modifier = Modifier.padding(10.dp),
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (customPrompt.isNotBlank()) {
                        onAskPrompt(customPrompt)
                    }
                },
                enabled = customPrompt.isNotBlank() && aiState !is AiUiState.Loading,
                colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue),
                modifier = Modifier.testTag("gemini_ask_button")
            ) {
                Text("إرسال للمساعد")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@Composable
private fun ChatRoomTabContent(
    state: ChatUiState,
    me: ChatUser,
    viewModel: ChatViewModel,
    onInspectSender: (String) -> Unit,
    onPickChatImage: () -> Unit,
    onOpenAiAssistant: () -> Unit,
    onEnsureAudioPermission: (onGranted: () -> Unit) -> Unit
) {
    val activeRoom = state.activeRoom
    var draft by remember { mutableStateOf("") }
    var showEmojis by remember { mutableStateOf(false) }
    var isRecordingVoice by remember { mutableStateOf(false) }
    var recordSec by remember { mutableIntStateOf(0) }
    val listState = rememberLazyListState()

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.lastIndex)
        }
    }

    LaunchedEffect(isRecordingVoice) {
        if (isRecordingVoice) {
            recordSec = 0
            while (isRecordingVoice) {
                delay(1000)
                recordSec++
            }
        }
    }

    val bgBrush = when (state.selectedTheme) {
        ChatThemeOption.WARM_PEACH -> CodyColors.WarmPeachBrush
        ChatThemeOption.SUNSET_ROSE -> CodyColors.SunsetRoseBrush
        ChatThemeOption.ROYAL_NIGHT -> CodyColors.RoyalNightBrush
        ChatThemeOption.EMERALD_MIST -> CodyColors.EmeraldMistBrush
        ChatThemeOption.SKY_BREEZE -> CodyColors.SkyBreezeBrush
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(bgBrush)
            .imePadding()
    ) {
        // 5 Floating Voice Mics Bar
        CodyVoiceMicsBar(
            slots = state.micSlots,
            micsEnabled = activeRoom?.micsEnabled ?: true,
            myUserKey = me.userKey,
            onSlotClick = viewModel::toggleMicSlot,
            onToggleSelfMute = viewModel::toggleMyMicMute
        )

        // Beige/Gold Room Info Header Card
        Surface(
            color = CodyColors.RoomBannerBg,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 6.dp)
                .border(1.dp, CodyColors.RoomBannerBorder, RoundedCornerShape(14.dp))
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${activeRoom?.iconEmoji ?: "💬"} ${activeRoom?.name ?: "الغرفة العامة"}",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF78350F)
                    )
                    Text(
                        text = activeRoom?.description ?: "",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color(0xFF92400E)
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onOpenAiAssistant,
                        modifier = Modifier.testTag("gemini_assistant_button")
                    ) {
                        Icon(
                            Icons.Rounded.AutoAwesome,
                            contentDescription = "المساعد الذكي",
                            tint = CodyColors.RoyalBlue
                        )
                    }
                    if (me.rank.isStaff) {
                        IconButton(onClick = viewModel::clearCurrentRoomMessages) {
                            Icon(
                                Icons.Rounded.CleaningServices,
                                contentDescription = "تنظيف الغرفة",
                                tint = CodyColors.AuthRed
                            )
                        }
                    }
                }
            }
        }

        // Messages Stream
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(state.messages, key = { it.id }) { msg ->
                CodyChatMessageCard(msg = msg, onSenderClick = onInspectSender)
            }
            item { Spacer(Modifier.height(6.dp)) }
        }

        // Mute Warning Banner
        if (me.isMuted) {
            Surface(
                color = CodyColors.AuthRed,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "🔇 أنت مكتوم حالياً ولا يمكنك إرسال الرسائل (${me.muteReason.ifBlank { "بأمر الإدارة" }})",
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }

        // Quick Emoji Strip
        AnimatedVisibility(visible = showEmojis) {
            Surface(color = Color.White) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    listOf("❤️", "👑", "😂", "🔥", "🌹", "💎", "🎉", "👏", "🌟", "😎").forEach { emoji ->
                        Text(
                            text = emoji,
                            fontSize = 22.sp,
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable { draft += emoji }
                                .padding(4.dp)
                        )
                    }
                }
            }
        }

        // Input Bar (White surface + Gold Send Button)
        Surface(
            color = Color.White,
            shadowElevation = 6.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(onClick = { showEmojis = !showEmojis }) {
                    Icon(Icons.Rounded.EmojiEmotions, contentDescription = "إيموجي", tint = CodyColors.RoyalGold)
                }
                IconButton(onClick = onPickChatImage) {
                    Icon(Icons.Rounded.AddPhotoAlternate, contentDescription = "إرسال صورة", tint = CodyColors.RoyalBlue)
                }
                IconButton(
                    onClick = {
                        if (isRecordingVoice) {
                            val sec = recordSec.coerceAtLeast(1)
                            isRecordingVoice = false
                            viewModel.sendTextMessage("", voiceDurationSec = sec)
                        } else {
                            onEnsureAudioPermission {
                                isRecordingVoice = true
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = if (isRecordingVoice) Icons.Rounded.Stop else Icons.Rounded.Mic,
                        contentDescription = "رسالة صوتية",
                        tint = if (isRecordingVoice) CodyColors.AuthRed else CodyColors.RoyalBlue
                    )
                }
                OutlinedTextField(
                    value = if (isRecordingVoice) "جاري التسجيل الصوتي... ${recordSec}ث (اضغط إيقاف للإرسال)" else draft,
                    onValueChange = { if (!isRecordingVoice) draft = it },
                    enabled = !me.isMuted && !isRecordingVoice,
                    placeholder = { Text("اكتب رسالتك هنا...") },
                    singleLine = true,
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CodyColors.RoyalBlue,
                        unfocusedBorderColor = CodyColors.DividerColor
                    ),
                    modifier = Modifier.weight(1f).testTag("chat_message_input")
                )
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(Color(0xFFFDE047), CodyColors.RoyalGold))
                        )
                        .clickable(enabled = !me.isMuted) {
                            if (draft.isNotBlank()) {
                                viewModel.sendTextMessage(draft)
                                draft = ""
                            }
                        }
                        .testTag("chat_send_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.Send,
                        contentDescription = "إرسال",
                        tint = Color(0xFF422006)
                    )
                }
            }
        }
    }
}

@Composable
private fun RoomsTabContent(
    state: ChatUiState,
    onSearchChange: (String) -> Unit,
    onSelectRoom: (String) -> Unit
) {
    val filtered = remember(state.rooms, state.searchRoomQuery) {
        val q = state.searchRoomQuery.trim()
        if (q.isEmpty()) state.rooms else state.rooms.filter {
            it.name.contains(q, ignoreCase = true) || it.description.contains(q, ignoreCase = true)
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedTextField(
            value = state.searchRoomQuery,
            onValueChange = onSearchChange,
            label = { Text("ابحث عن غرفة...") },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        )
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(filtered, key = { it.id }) { room ->
                val isCurrent = room.id == state.activeRoomId
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isCurrent) Color(0xFFE0E7FF) else Color.White
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onSelectRoom(room.id) }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(room.iconEmoji, fontSize = 30.sp)
                        Column(modifier = Modifier.weight(1f)) {
                            Text(room.name, style = MaterialTheme.typography.titleMedium)
                            Text(room.description, style = MaterialTheme.typography.bodyMedium, color = CodyColors.TextSecondary)
                        }
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = if (isCurrent) CodyColors.RoyalBlue else CodyColors.RoyalGoldLight
                        ) {
                            Text(
                                text = if (isCurrent) "متصل الآن" else "${room.onlineCount} متصل",
                                color = if (isCurrent) Color.White else Color(0xFF78350F),
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OnlineUsersTabContent(
    users: List<ChatUser>,
    onUserClick: (ChatUser) -> Unit
) {
    val active = remember(users) { users.filter { !it.isBanned }.sortedByDescending { it.rank.power } }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(
                "المتواجدون في الشات (${active.size})",
                style = MaterialTheme.typography.titleMedium
            )
        }
        items(active, key = { it.userKey }) { user ->
            Card(
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth().clickable { onUserClick(user) }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    UserAvatarBadge(user.avatarUri, user.avatarEmoji, user.avatarFrame, size = 44.dp, showOnlineDot = user.isOnline)
                    Column(modifier = Modifier.weight(1f)) {
                        DecoratedNameplate(user.displayName, user.nameplateStyle)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            RankPillBadge(user.rank)
                            if (user.vipFamily.isNotBlank()) {
                                Text("⚜️ ${user.vipFamily}", style = MaterialTheme.typography.labelSmall, color = Color(0xFFB45309))
                            }
                        }
                    }
                    if (user.isMuted) {
                        Text("🔇", fontSize = 18.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun ShopAndWalletTabContent(
    me: ChatUser,
    onEquipFrame: (AvatarFrame) -> Unit,
    onEquipNameplate: (NameplateStyle) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CodyColors.RoyalBlue),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("محفظة النقاط والمتجر الملكي", color = Color.White, style = MaterialTheme.typography.titleMedium)
                        Text("اكسب +5 نقاط مع كل رسالة داخل الغرف", color = Color.White.copy(alpha = 0.85f), style = MaterialTheme.typography.labelMedium)
                    }
                    Surface(shape = RoundedCornerShape(50), color = CodyColors.RoyalGold) {
                        Text(
                            "🪙 ${me.coins}",
                            color = Color(0xFF422006),
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }
        item { Text("إطارات الصورة الشخصية:", style = MaterialTheme.typography.titleMedium) }
        items(AvatarFrame.entries) { frame ->
            val equipped = me.avatarFrame == frame
            Card(shape = RoundedCornerShape(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        UserAvatarBadge(me.avatarUri, me.avatarEmoji, frame, size = 44.dp)
                        Column {
                            Text(frame.arabicName, fontWeight = FontWeight.Bold)
                            Text(if (frame.cost == 0) "مجاني" else "${frame.cost} نقطة", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    Button(
                        onClick = { onEquipFrame(frame) },
                        enabled = !equipped,
                        colors = ButtonDefaults.buttonColors(containerColor = if (equipped) CodyColors.OnlineGreen else CodyColors.RoyalBlue)
                    ) {
                        Text(if (equipped) "مفعّل ✓" else "تفعيل")
                    }
                }
            }
        }
        item { Text("زخارف وشرائط الأسماء:", style = MaterialTheme.typography.titleMedium) }
        items(NameplateStyle.entries) { style ->
            val equipped = me.nameplateStyle == style
            Card(shape = RoundedCornerShape(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        DecoratedNameplate(me.displayName, style)
                        Text("${style.arabicName} • ${if (style.cost == 0) "مجاني" else "${style.cost} نقطة"}", style = MaterialTheme.typography.labelSmall)
                    }
                    Button(
                        onClick = { onEquipNameplate(style) },
                        enabled = !equipped,
                        colors = ButtonDefaults.buttonColors(containerColor = if (equipped) CodyColors.OnlineGreen else CodyColors.RoyalGold)
                    ) {
                        Text(if (equipped) "مفعّل ✓" else "تفعيل")
                    }
                }
            }
        }
    }
}

@Composable
private fun PrivateMessagesTabContent(
    me: ChatUser,
    state: ChatUiState,
    onSelectPartner: (ChatUser) -> Unit,
    onSendDm: (ChatUser, String) -> Unit
) {
    val partner = state.activeDmPartner ?: state.allUsers.firstOrNull { it.userKey != me.userKey && !it.isBanned }
    var dmDraft by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp).imePadding()) {
        Text("الرسائل الخاصة (1-on-1):", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            state.allUsers.filter { it.userKey != me.userKey && !it.isBanned }.forEach { u ->
                FilterChip(
                    selected = partner?.userKey == u.userKey,
                    onClick = { onSelectPartner(u) },
                    label = { Text("${u.avatarEmoji} ${u.displayName}") }
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        if (partner == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("لا يوجد أعضاء متاحون للمراسلة الخاصة حالياً")
            }
        } else {
            val thread = remember(state.privateMessages, partner.userKey) {
                state.privateMessages.filter {
                    (it.fromKey == me.userKey && it.toKey == partner.userKey) ||
                        (it.fromKey == partner.userKey && it.toKey == me.userKey)
                }
            }
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (thread.isEmpty()) {
                    item {
                        Text(
                            "ابدأ محادثة خاصة مع ${partner.displayName}",
                            color = CodyColors.TextSecondary,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                items(thread, key = { it.id }) { pm ->
                    val isMine = pm.fromKey == me.userKey
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isMine) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isMine) CodyColors.RoyalBlue else Color.White,
                            shadowElevation = 1.dp
                        ) {
                            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                                Text(
                                    pm.fromName,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isMine) Color(0xFFFEF08A) else CodyColors.RoyalBlue
                                )
                                Text(
                                    pm.content,
                                    color = if (isMine) Color.White else CodyColors.TextPrimary
                                )
                            }
                        }
                    }
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = dmDraft,
                    onValueChange = { dmDraft = it },
                    placeholder = { Text("رسالة خاصة إلى ${partner.displayName}...") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Button(
                    onClick = {
                        if (dmDraft.isNotBlank()) {
                            onSendDm(partner, dmDraft)
                            dmDraft = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue)
                ) { Text("إرسال") }
            }
        }
    }
}
