package com.shat.alghoraf.ui.chat

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.Reply
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.R
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.ReplyTarget
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.data.model.TypingStatus
import com.shat.alghoraf.data.model.UiState
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.ui.components.RoleBadge
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.components.formatArabicTime
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.ElevatedSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.GoldContainer
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SkyAccent
import com.shat.alghoraf.ui.theme.SoftGold
import com.shat.alghoraf.ui.theme.SurfaceSlate
import com.shat.alghoraf.ui.theme.TextMuted
import com.shat.alghoraf.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomChatScreen(
    room: ChatRoom?,
    messagesState: UiState<List<ChatMessage>>,
    typingUsers: List<TypingStatus>,
    profiles: List<PublicProfile>,
    currentUserId: String,
    isGlobalOwner: Boolean,
    canManageRoom: Boolean,
    isRoomAdminOrOwner: Boolean,
    isRoomOwnerOrGlobalOwner: Boolean,
    onBack: () -> Unit,
    onInputChanged: (String) -> Unit,
    onSendMessage: (content: String, isAnnouncement: Boolean, replyTo: ReplyTarget?) -> Unit,
    onToggleReaction: (ChatMessage, String) -> Unit,
    onDeleteMessage: (String) -> Unit,
    onClearMessages: () -> Unit,
    onDeleteRoom: () -> Unit,
    onUpdateRoom: (
        name: String?,
        description: String?,
        category: String?,
        icon: String?,
        permissionLevel: RoomPermissionLevel?,
        isLocked: Boolean?,
        pinnedMessage: String?,
        clearPinnedMessage: Boolean
    ) -> Unit,
    onToggleMuteUser: (String, String) -> Unit,
    onBanUser: (uid: String, name: String, reason: String, isPermanent: Boolean, minutes: Int, isGlobal: Boolean) -> Unit,
    onUnbanFromRoom: (String, String) -> Unit,
    onToggleRoomAdmin: (String, String) -> Unit,
    onToggleRoomModerator: (String, String) -> Unit,
    onStartDirectChat: (PublicProfile) -> Unit
) {
    BackHandler { onBack() }

    var inputText by remember { mutableStateOf("") }
    var replyTarget by remember { mutableStateOf<ReplyTarget?>(null) }
    var isAnnouncementMode by remember { mutableStateOf(false) }
    var showEmojiStrip by remember { mutableStateOf(false) }
    var showRoomControl by remember { mutableStateOf(false) }
    var showMembersSheet by remember { mutableStateOf(false) }
    var selectedMessage by remember { mutableStateOf<ChatMessage?>(null) }

    val listState = rememberLazyListState()
    val messages = (messagesState as? UiState.Success)?.data.orEmpty()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    val quickEmojis = listOf("😊", "😂", "❤️", "🌹", "🔥", "👍", "👑", "✨", "🤝", "🤲", "🎉", "💎")
    val reactionOptions = listOf("❤️", "😂", "👍", "🔥", "🌹")

    val isMuted = room != null && !isGlobalOwner && room.mutedUsers.contains(currentUserId)
    val isLockedForMe = room != null && room.isLocked && !canManageRoom

    Scaffold(
        containerColor = MidnightVoid,
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeepSlate,
                    titleContentColor = BrightGold
                ),
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("room_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "العودة للغرف")
                    }
                },
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = room?.icon ?: "💬", fontSize = 22.sp)
                        Column {
                            Text(
                                text = room?.name ?: "غرفة الدردشة",
                                style = MaterialTheme.typography.titleMedium,
                                color = BrightGold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            val sub = buildString {
                                append(room?.category ?: "عام")
                                if (room?.isLocked == true) append(" • مغلقة 🔒")
                            }
                            Text(
                                text = sub,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (room?.isLocked == true) CrimsonAlert else SkyAccent
                            )
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = { showMembersSheet = true },
                        modifier = Modifier.testTag("room_members_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.People,
                            contentDescription = "أعضاء الغرفة",
                            tint = SkyAccent
                        )
                    }
                    if (room != null && canManageRoom) {
                        IconButton(
                            onClick = {
                                onUpdateRoom(null, null, null, null, null, !room.isLocked, null, false)
                            },
                            modifier = Modifier.testTag("room_quick_lock_button")
                        ) {
                            Icon(
                                imageVector = if (room.isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                                contentDescription = "قفل أو فتح الغرفة",
                                tint = if (room.isLocked) CrimsonAlert else EmeraldOnline
                            )
                        }
                        IconButton(
                            onClick = { showRoomControl = true },
                            modifier = Modifier.testTag("room_control_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = "التحكم الكامل بالغرفة",
                                tint = BrightGold
                            )
                        }
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .navigationBarsPadding()
                .imePadding(),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = 760.dp)
                    .fillMaxSize()
            ) {
                // Pinned Banner
                if (!room?.pinnedMessage.isNullOrBlank()) {
                    Surface(
                        color = GoldContainer.copy(alpha = 0.75f),
                        border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = null,
                                tint = BrightGold,
                                modifier = Modifier.size(16.dp)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = room!!.pinnedMessage!!,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = SoftGold,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            if (canManageRoom) {
                                IconButton(
                                    onClick = {
                                        onUpdateRoom(null, null, null, null, null, null, null, true)
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "إزالة التثبيت",
                                        tint = SoftGold,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Messages Area
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    when (messagesState) {
                        is UiState.Loading -> {
                            CircularProgressIndicator(
                                color = BrightGold,
                                modifier = Modifier.align(Alignment.Center)
                            )
                        }

                        is UiState.Error -> {
                            Text(
                                text = messagesState.message,
                                color = CrimsonAlert,
                                modifier = Modifier
                                    .align(Alignment.Center)
                                    .padding(24.dp)
                            )
                        }

                        is UiState.Success -> {
                            if (messages.isEmpty()) {
                                Text(
                                    text = stringResource(R.string.no_messages_yet),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary,
                                    modifier = Modifier
                                        .align(Alignment.Center)
                                        .padding(24.dp)
                                )
                            } else {
                                LazyColumn(
                                    state = listState,
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 12.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    items(messages, key = { it.id }) { msg ->
                                        MessageBubble(
                                            message = msg,
                                            currentUserId = currentUserId,
                                            reactionOptions = reactionOptions,
                                            onClick = { selectedMessage = msg },
                                            onToggleReaction = { emoji -> onToggleReaction(msg, emoji) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Live typing indicator
                AnimatedVisibility(visible = typingUsers.isNotEmpty()) {
                    val names = typingUsers.joinToString("، ") { it.displayName }
                    Text(
                        text = "$names يكتب الآن...",
                        style = MaterialTheme.typography.labelSmall,
                        color = EmeraldOnline,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }

                // Status warning if muted or locked
                if (isMuted || isLockedForMe) {
                    Surface(
                        color = CrimsonAlert.copy(alpha = 0.14f),
                        border = BorderStroke(1.dp, CrimsonAlert.copy(alpha = 0.45f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (isMuted) {
                                "أنت مكتوم في هذه الغرفة حالياً ولا يمكنك الإرسال 🔇"
                            } else {
                                "هذه الغرفة مغلقة للكتابة حالياً من قبل الإدارة 🔒"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = CrimsonAlert,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
                        )
                    }
                }

                // Reply Quote Strip
                AnimatedVisibility(visible = replyTarget != null) {
                    replyTarget?.let { target ->
                        Surface(
                            color = ElevatedSlate,
                            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "الرد على ${target.senderName}:",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = BrightGold
                                    )
                                    Text(
                                        text = target.content,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                IconButton(onClick = { replyTarget = null }) {
                                    Icon(Icons.Default.Close, contentDescription = "إلغاء الرد")
                                }
                            }
                        }
                    }
                }

                // Quick Emoji Strip
                AnimatedVisibility(visible = showEmojiStrip) {
                    Surface(color = SurfaceSlate, modifier = Modifier.fillMaxWidth()) {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(quickEmojis) { emoji ->
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(CardSlate)
                                        .clickable {
                                            val updated = inputText + emoji
                                            inputText = updated
                                            onInputChanged(updated)
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(text = emoji, fontSize = 20.sp)
                                }
                            }
                        }
                    }
                }

                // Input Composer Bar
                Surface(
                    color = DeepSlate,
                    border = BorderStroke(1.dp, BorderSlate),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        IconButton(
                            onClick = { showEmojiStrip = !showEmojiStrip },
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                Icons.Default.EmojiEmotions,
                                contentDescription = "الرموز التعبيرية",
                                tint = if (showEmojiStrip) BrightGold else TextSecondary
                            )
                        }

                        if (canManageRoom) {
                            IconButton(
                                onClick = { isAnnouncementMode = !isAnnouncementMode },
                                modifier = Modifier.size(48.dp)
                            ) {
                                Icon(
                                    Icons.Default.Campaign,
                                    contentDescription = "إرسال كإعلان",
                                    tint = if (isAnnouncementMode) BrightGold else TextMuted
                                )
                            }
                        }

                        OutlinedTextField(
                            value = inputText,
                            onValueChange = {
                                inputText = it.take(1000)
                                onInputChanged(inputText)
                            },
                            enabled = !isMuted && !isLockedForMe,
                            placeholder = {
                                Text(
                                    text = if (isAnnouncementMode) "اكتب نص الإعلان المميز..." else stringResource(R.string.type_message_hint),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            },
                            maxLines = 4,
                            shape = RoundedCornerShape(22.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = SurfaceSlate,
                                unfocusedContainerColor = SurfaceSlate,
                                focusedBorderColor = if (isAnnouncementMode) BrightGold else RoyalGold,
                                unfocusedBorderColor = BorderSlate
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("room_message_input")
                        )

                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank() && !isMuted && !isLockedForMe) {
                                    onSendMessage(inputText, isAnnouncementMode, replyTarget)
                                    inputText = ""
                                    replyTarget = null
                                    isAnnouncementMode = false
                                }
                            },
                            enabled = inputText.isNotBlank() && !isMuted && !isLockedForMe,
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(
                                    if (inputText.isNotBlank() && !isMuted && !isLockedForMe) EmeraldSend else ElevatedSlate
                                )
                                .testTag("send_message_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = stringResource(R.string.send_message),
                                tint = MaterialTheme.colorScheme.onSecondary
                            )
                        }
                    }
                }
            }
        }
    }

    // Message Action Sheet
    if (selectedMessage != null && room != null) {
        val msg = selectedMessage!!
        val isMine = msg.senderId == currentUserId
        val targetIsOwner = profiles.firstOrNull { it.userId == msg.senderId }?.isOwner == true

        ModalBottomSheet(
            onDismissRequest = { selectedMessage = null },
            containerColor = DeepSlate
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "رسالة من ${msg.senderName}",
                    style = MaterialTheme.typography.titleSmall,
                    color = BrightGold
                )

                // Quick Reaction Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    reactionOptions.forEach { emoji ->
                        Surface(
                            onClick = {
                                onToggleReaction(msg, emoji)
                                selectedMessage = null
                            },
                            color = CardSlate,
                            shape = CircleShape,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(text = emoji, fontSize = 22.sp)
                            }
                        }
                    }
                }

                HorizontalDivider(color = BorderSlate)

                ActionSheetRow(
                    icon = Icons.AutoMirrored.Filled.Reply,
                    label = "رد مع اقتباس",
                    tint = SkyAccent,
                    onClick = {
                        replyTarget = ReplyTarget(msg.id, msg.senderName, msg.content)
                        selectedMessage = null
                    }
                )

                if (!isMine) {
                    profiles.firstOrNull { it.userId == msg.senderId }?.let { senderProfile ->
                        ActionSheetRow(
                            icon = Icons.AutoMirrored.Filled.Chat,
                            label = "بدء محادثة خاصة مع ${msg.senderName}",
                            tint = EmeraldOnline,
                            onClick = {
                                selectedMessage = null
                                onStartDirectChat(senderProfile)
                            }
                        )
                    }
                }

                if (canManageRoom) {
                    ActionSheetRow(
                        icon = Icons.Default.PushPin,
                        label = "تثبيت كإعلان في أعلى الغرفة 📌",
                        tint = BrightGold,
                        onClick = {
                            onUpdateRoom(null, null, null, null, null, null, msg.content, false)
                            selectedMessage = null
                        }
                    )
                }

                if (isMine || canManageRoom) {
                    ActionSheetRow(
                        icon = Icons.Default.Delete,
                        label = "حذف الرسالة",
                        tint = CrimsonAlert,
                        onClick = {
                            onDeleteMessage(msg.id)
                            selectedMessage = null
                        }
                    )
                }

                if (canManageRoom && !isMine && !targetIsOwner) {
                    val alreadyMuted = room.mutedUsers.contains(msg.senderId)
                    ActionSheetRow(
                        icon = Icons.Default.VolumeOff,
                        label = if (alreadyMuted) "فك الكتم عن ${msg.senderName}" else "كتم ${msg.senderName} في الغرفة 🔇",
                        tint = BrightGold,
                        onClick = {
                            onToggleMuteUser(msg.senderId, msg.senderName)
                            selectedMessage = null
                        }
                    )
                    ActionSheetRow(
                        icon = Icons.Default.Block,
                        label = "حظر ${msg.senderName} من الغرفة (ساعة)",
                        tint = CrimsonAlert,
                        onClick = {
                            onBanUser(msg.senderId, msg.senderName, "مخالفة قوانين الغرفة", false, 60, false)
                            selectedMessage = null
                        }
                    )
                    if (isGlobalOwner) {
                        ActionSheetRow(
                            icon = Icons.Default.Block,
                            label = "حظر شامل من التطبيق بالكامل 🚫",
                            tint = CrimsonAlert,
                            onClick = {
                                onBanUser(msg.senderId, msg.senderName, "حظر إداري شامل", true, 0, true)
                                selectedMessage = null
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // Room Members Sheet
    if (showMembersSheet) {
        ModalBottomSheet(
            onDismissRequest = { showMembersSheet = false },
            containerColor = DeepSlate
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "الأعضاء المتصلون والنشطون (${profiles.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = BrightGold,
                    modifier = Modifier.padding(bottom = 10.dp)
                )
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.height(360.dp)
                ) {
                    items(profiles, key = { it.userId }) { member ->
                        val isSelf = member.userId == currentUserId
                        Surface(
                            color = CardSlate,
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    UserAvatar(
                                        avatarOrUrl = member.photoUrl ?: member.avatarEmoji,
                                        fallbackEmoji = member.roleEnum.badgeEmoji,
                                        size = 40.dp,
                                        showOnlineDot = true,
                                        isOnline = member.status == "online"
                                    )
                                    Column {
                                        Text(
                                            text = member.displayName + if (isSelf) " (أنت)" else "",
                                            style = MaterialTheme.typography.titleSmall
                                        )
                                        RoleBadge(member.roleEnum)
                                    }
                                }
                                if (!isSelf) {
                                    IconButton(onClick = {
                                        showMembersSheet = false
                                        onStartDirectChat(member)
                                    }) {
                                        Icon(
                                            Icons.AutoMirrored.Filled.Chat,
                                            contentDescription = "رسالة خاصة",
                                            tint = EmeraldOnline
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }

    // Full Room Control Dialog
    if (showRoomControl && room != null) {
        RoomControlDialog(
            room = room,
            profiles = profiles,
            currentUserId = currentUserId,
            isAdminOrOwner = isRoomAdminOrOwner,
            isRoomOwnerOrGlobalOwner = isRoomOwnerOrGlobalOwner,
            onUpdateRoom = onUpdateRoom,
            onClearMessages = onClearMessages,
            onDeleteRoom = onDeleteRoom,
            onToggleMute = { user -> onToggleMuteUser(user.userId, user.displayName) },
            onBanFromRoom = { user, reason, perm, mins ->
                onBanUser(user.userId, user.displayName, reason, perm, mins, false)
            },
            onUnbanFromRoom = { user -> onUnbanFromRoom(user.userId, user.displayName) },
            onToggleRoomAdmin = { user -> onToggleRoomAdmin(user.userId, user.displayName) },
            onToggleRoomModerator = { user -> onToggleRoomModerator(user.userId, user.displayName) },
            onStartDirectChat = { user ->
                showRoomControl = false
                onStartDirectChat(user)
            },
            onDismiss = { showRoomControl = false }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalLayoutApi::class)
@Composable
private fun MessageBubble(
    message: ChatMessage,
    currentUserId: String,
    reactionOptions: List<String>,
    onClick: () -> Unit,
    onToggleReaction: (String) -> Unit
) {
    val isMine = message.senderId == currentUserId

    if (message.isAnnouncement) {
        Surface(
            color = GoldContainer.copy(alpha = 0.65f),
            border = BorderStroke(1.dp, BrightGold),
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(onClick = onClick, onLongClick = onClick)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📢 إعلان إداري • ${message.senderName}",
                        style = MaterialTheme.typography.labelMedium,
                        color = BrightGold,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = formatArabicTime(message.createdAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = SoftGold.copy(alpha = 0.7f)
                    )
                }
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = SoftGold
                )
            }
        }
        return
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        if (!isMine) {
            UserAvatar(
                avatarOrUrl = message.senderAvatar,
                fallbackEmoji = message.roleEnum.badgeEmoji,
                size = 36.dp,
                modifier = Modifier.padding(top = 4.dp, end = 8.dp)
            )
        }

        Surface(
            color = if (isMine) EmeraldSend.copy(alpha = 0.16f) else CardSlate,
            border = BorderStroke(
                width = 1.dp,
                color = when {
                    isMine -> EmeraldSend.copy(alpha = 0.45f)
                    message.roleEnum == UserRole.OWNER -> RoyalGold.copy(alpha = 0.55f)
                    else -> BorderSlate
                }
            ),
            shape = RoundedCornerShape(
                topStart = 18.dp,
                topEnd = 18.dp,
                bottomStart = if (isMine) 18.dp else 4.dp,
                bottomEnd = if (isMine) 4.dp else 18.dp
            ),
            modifier = Modifier
                .widthIn(max = 310.dp)
                .combinedClickable(onClick = onClick, onLongClick = onClick)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = message.senderName,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (message.roleEnum == UserRole.OWNER) BrightGold else SkyAccent
                    )
                    Text(
                        text = message.roleEnum.badgeEmoji,
                        fontSize = 12.sp
                    )
                    Text(
                        text = formatArabicTime(message.createdAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted
                    )
                }

                if (!message.replyToContent.isNullOrBlank()) {
                    Surface(
                        color = MidnightVoid.copy(alpha = 0.5f),
                        border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Text(
                                text = "رد على ${message.replyToSenderName.orEmpty()}",
                                style = MaterialTheme.typography.labelSmall,
                                color = BrightGold
                            )
                            Text(
                                text = message.replyToContent,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )

                val reactionCounts = remember(message.reactions) {
                    reactionOptions.mapNotNull { emoji ->
                        val matching = message.reactions.filter { it.startsWith("$emoji:") }
                        if (matching.isEmpty()) null
                        else Triple(emoji, matching.size, matching.any { it == "$emoji:$currentUserId" })
                    }
                }

                if (reactionCounts.isNotEmpty()) {
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        reactionCounts.forEach { (emoji, count, isSelected) ->
                            Surface(
                                onClick = { onToggleReaction(emoji) },
                                color = if (isSelected) RoyalGold.copy(alpha = 0.2f) else ElevatedSlate,
                                border = BorderStroke(1.dp, if (isSelected) BrightGold else BorderSlate),
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = "$emoji $count",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isSelected) BrightGold else TextSecondary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionSheetRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    tint: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    TextButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(icon, contentDescription = null, tint = tint)
            Text(text = label, style = MaterialTheme.typography.bodyMedium, color = tint)
        }
    }
}
