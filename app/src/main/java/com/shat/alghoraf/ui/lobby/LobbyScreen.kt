package com.shat.alghoraf.ui.lobby

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.shat.alghoraf.data.model.BanRecord
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.DirectChat
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.data.model.UiState
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.ui.components.RoleBadge
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.components.formatArabicTime
import com.shat.alghoraf.ui.owner.OwnerControlDialog
import com.shat.alghoraf.ui.profile.ProfileEditDialog
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.ElevatedSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SkyAccent
import com.shat.alghoraf.ui.theme.SurfaceSlate
import com.shat.alghoraf.ui.theme.TextMuted
import com.shat.alghoraf.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LobbyScreen(
    currentProfile: PublicProfile,
    currentUserId: String,
    isGlobalOwner: Boolean,
    roomsState: UiState<List<ChatRoom>>,
    profilesState: UiState<List<PublicProfile>>,
    directChatsState: UiState<List<DirectChat>>,
    bans: List<BanRecord>,
    onEnterRoom: (ChatRoom) -> Unit,
    onEnterDirectChat: (String) -> Unit,
    onStartDirectChat: (PublicProfile) -> Unit,
    onCreateRoom: (String, String, String, String, RoomPermissionLevel, Boolean) -> Unit,
    onToggleRoomLock: (ChatRoom) -> Unit,
    onClearRoomMessages: (String) -> Unit,
    onDeleteRoom: (String) -> Unit,
    onSetUserRole: (String, UserRole) -> Unit,
    onBanUserGlobal: (PublicProfile, String, Boolean, Int) -> Unit,
    onUnban: (BanRecord) -> Unit,
    onBroadcast: (String) -> Unit,
    onUpdateProfile: (String, String, String, String) -> Unit,
    onSignOut: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("الكل") }
    var showProfileDialog by remember { mutableStateOf(false) }
    var showControlDialog by remember { mutableStateOf(false) }

    val rooms = (roomsState as? UiState.Success)?.data.orEmpty()
    val profiles = (profilesState as? UiState.Success)?.data.orEmpty()
    val directChats = (directChatsState as? UiState.Success)?.data.orEmpty()

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 640.dp

        Scaffold(
            containerColor = MidnightVoid,
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = DeepSlate,
                        titleContentColor = BrightGold
                    ),
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { showProfileDialog = true }
                                .padding(vertical = 4.dp, horizontal = 4.dp)
                        ) {
                            UserAvatar(
                                avatarOrUrl = currentProfile.photoUrl ?: currentProfile.avatarEmoji,
                                fallbackEmoji = currentProfile.roleEnum.badgeEmoji,
                                size = 38.dp,
                                showOnlineDot = true,
                                isOnline = currentProfile.status == "online"
                            )
                            Column {
                                Text(
                                    text = currentProfile.displayName,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = BrightGold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${currentProfile.roleEnum.badgeEmoji} ${currentProfile.roleEnum.arabicLabel}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = SkyAccent
                                )
                            }
                        }
                    },
                    actions = {
                        IconButton(
                            onClick = { showControlDialog = true },
                            modifier = Modifier.testTag("owner_control_button")
                        ) {
                            Icon(
                                imageVector = if (isGlobalOwner) Icons.Default.AdminPanelSettings else Icons.Default.Tune,
                                contentDescription = if (isGlobalOwner) stringResource(R.string.owner_panel) else stringResource(R.string.create_room),
                                tint = BrightGold
                            )
                        }
                        IconButton(
                            onClick = onSignOut,
                            modifier = Modifier.testTag("lobby_sign_out_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                                contentDescription = stringResource(R.string.sign_out),
                                tint = CrimsonAlert
                            )
                        }
                    }
                )
            },
            bottomBar = {
                if (!useRail) {
                    NavigationBar(containerColor = DeepSlate) {
                        LobbyBottomNavItems(
                            selectedTab = selectedTab,
                            roomsCount = rooms.size,
                            chatsCount = directChats.size,
                            onlineCount = profiles.count { it.status == "online" },
                            onSelect = { selectedTab = it }
                        )
                    }
                }
            },
            floatingActionButton = {
                if (selectedTab == 0) {
                    FloatingActionButton(
                        onClick = { showControlDialog = true },
                        containerColor = RoyalGold,
                        contentColor = MidnightVoid,
                        modifier = Modifier.testTag("fab_create_room")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = stringResource(R.string.create_room))
                    }
                }
            }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (useRail) {
                    NavigationRail(
                        containerColor = DeepSlate,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        LobbyRailNavItems(
                            selectedTab = selectedTab,
                            roomsCount = rooms.size,
                            chatsCount = directChats.size,
                            onlineCount = profiles.count { it.status == "online" },
                            onSelect = { selectedTab = it }
                        )
                    }
                }

                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.TopCenter
                ) {
                    Column(
                        modifier = Modifier
                            .widthIn(max = 720.dp)
                            .fillMaxSize()
                    ) {
                        when (selectedTab) {
                            0 -> RoomsTabContent(
                                roomsState = roomsState,
                                searchQuery = searchQuery,
                                onSearchChange = { searchQuery = it },
                                selectedCategory = selectedCategory,
                                onSelectCategory = { selectedCategory = it },
                                onEnterRoom = onEnterRoom
                            )

                            1 -> DirectChatsTabContent(
                                directChatsState = directChatsState,
                                currentUserId = currentUserId,
                                onOpenChat = onEnterDirectChat
                            )

                            2 -> OnlineMembersTabContent(
                                profilesState = profilesState,
                                currentUserId = currentUserId,
                                onStartChat = onStartDirectChat
                            )

                            3 -> ProfileTabContent(
                                profile = currentProfile,
                                isGlobalOwner = isGlobalOwner,
                                onEditProfile = { showProfileDialog = true },
                                onOpenControlPanel = { showControlDialog = true },
                                onSignOut = onSignOut
                            )
                        }
                    }
                }
            }
        }
    }

    if (showProfileDialog) {
        ProfileEditDialog(
            profile = currentProfile,
            onSave = onUpdateProfile,
            onDismiss = { showProfileDialog = false }
        )
    }

    if (showControlDialog) {
        OwnerControlDialog(
            rooms = rooms,
            profiles = profiles,
            bans = bans,
            isGlobalOwner = isGlobalOwner,
            onCreateRoom = onCreateRoom,
            onToggleRoomLock = { room ->
                onToggleRoomLock(room)
            },
            onClearRoomMessages = onClearRoomMessages,
            onDeleteRoom = onDeleteRoom,
            onSetUserRole = onSetUserRole,
            onBanUserGlobal = onBanUserGlobal,
            onUnban = onUnban,
            onBroadcast = onBroadcast,
            onDismiss = { showControlDialog = false }
        )
    }
}

@Composable
private fun RowScope.LobbyBottomNavItems(
    selectedTab: Int,
    roomsCount: Int,
    chatsCount: Int,
    onlineCount: Int,
    onSelect: (Int) -> Unit
) {
    val items = listOf(
        Triple(0, "${stringResource(R.string.tab_rooms)} ($roomsCount)", Icons.Default.Forum),
        Triple(1, "${stringResource(R.string.tab_direct_chats)} ($chatsCount)", Icons.AutoMirrored.Filled.Chat),
        Triple(2, "${stringResource(R.string.tab_online_users)} ($onlineCount)", Icons.Default.People),
        Triple(3, stringResource(R.string.tab_profile), Icons.Default.Person)
    )

    items.forEach { (idx, label, icon) ->
        NavigationBarItem(
            selected = selectedTab == idx,
            onClick = { onSelect(idx) },
            icon = { Icon(icon, contentDescription = label) },
            label = {
                Text(
                    text = label,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.labelSmall
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BrightGold,
                selectedTextColor = BrightGold,
                indicatorColor = RoyalGold.copy(alpha = 0.16f)
            )
        )
    }
}

@Composable
private fun LobbyRailNavItems(
    selectedTab: Int,
    roomsCount: Int,
    chatsCount: Int,
    onlineCount: Int,
    onSelect: (Int) -> Unit
) {
    val items = listOf(
        Triple(0, "${stringResource(R.string.tab_rooms)} ($roomsCount)", Icons.Default.Forum),
        Triple(1, "${stringResource(R.string.tab_direct_chats)} ($chatsCount)", Icons.AutoMirrored.Filled.Chat),
        Triple(2, "${stringResource(R.string.tab_online_users)} ($onlineCount)", Icons.Default.People),
        Triple(3, stringResource(R.string.tab_profile), Icons.Default.Person)
    )

    items.forEach { (idx, label, icon) ->
        NavigationRailItem(
            selected = selectedTab == idx,
            onClick = { onSelect(idx) },
            icon = { Icon(icon, contentDescription = label) },
            label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            colors = NavigationRailItemDefaults.colors(
                selectedIconColor = BrightGold,
                selectedTextColor = BrightGold,
                indicatorColor = RoyalGold.copy(alpha = 0.16f)
            )
        )
    }
}

@Composable
private fun RoomsTabContent(
    roomsState: UiState<List<ChatRoom>>,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    selectedCategory: String,
    onSelectCategory: (String) -> Unit,
    onEnterRoom: (ChatRoom) -> Unit
) {
    val categories = listOf("الكل", "عام", "تعارف", "ثقافة", "تعليم", "إدارة")

    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text(stringResource(R.string.search_rooms_hint)) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = BrightGold) },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = SurfaceSlate,
                unfocusedContainerColor = SurfaceSlate,
                focusedBorderColor = RoyalGold,
                unfocusedBorderColor = BorderSlate
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .testTag("search_rooms_input")
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 10.dp)
        ) {
            items(categories) { category ->
                val active = selectedCategory == category
                Surface(
                    onClick = { onSelectCategory(category) },
                    color = if (active) RoyalGold else CardSlate,
                    border = BorderStroke(1.dp, if (active) BrightGold else BorderSlate),
                    shape = RoundedCornerShape(50),
                    modifier = Modifier.height(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 14.dp)) {
                        Text(
                            text = category,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (active) MidnightVoid else TextSecondary,
                            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }

        when (roomsState) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrightGold)
                }
            }

            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text(text = roomsState.message, color = CrimsonAlert)
                }
            }

            is UiState.Success -> {
                val filtered = remember(roomsState.data, searchQuery, selectedCategory) {
                    val q = searchQuery.trim()
                    roomsState.data.filter { room ->
                        val catMatch = selectedCategory == "الكل" || room.category == selectedCategory
                        val queryMatch = q.isEmpty() ||
                            room.name.contains(q, ignoreCase = true) ||
                            (room.description?.contains(q, ignoreCase = true) == true)
                        catMatch && queryMatch
                    }
                }

                if (filtered.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "لا توجد غرف مطابقة لبحثك حالياً.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(filtered, key = { it.id }) { room ->
                            RoomCard(room = room, onClick = { onEnterRoom(room) })
                        }
                        item { Spacer(modifier = Modifier.height(72.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun RoomCard(room: ChatRoom, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = CardSlate),
        border = BorderStroke(
            width = 1.dp,
            color = if (room.id == "general") RoyalGold.copy(alpha = 0.5f) else BorderSlate
        ),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier
            .fillMaxWidth()
            .testTag("room_card_${room.id}")
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ElevatedSlate),
                contentAlignment = Alignment.Center
            ) {
                Text(text = room.icon, fontSize = 26.sp)
            }

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = room.name,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (room.isLocked) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "غرفة مغلقة",
                                tint = CrimsonAlert,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Surface(
                        color = ElevatedSlate,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = room.category,
                            style = MaterialTheme.typography.labelSmall,
                            color = BrightGold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }

                val preview = if (!room.lastMessageText.isNullOrBlank()) {
                    "${room.lastMessageSender.orEmpty()}: ${room.lastMessageText}"
                } else {
                    room.description.orEmpty().ifBlank { "غرفة دردشة عربية نشطة" }
                }

                Text(
                    text = preview,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = room.permissionEnum.arabicLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = SkyAccent
                    )
                    Text(
                        text = formatArabicTime(room.lastMessageAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted
                    )
                }
            }
        }
    }
}

@Composable
private fun DirectChatsTabContent(
    directChatsState: UiState<List<DirectChat>>,
    currentUserId: String,
    onOpenChat: (String) -> Unit
) {
    when (directChatsState) {
        is UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = BrightGold)
        }
        is UiState.Error -> Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Text(directChatsState.message, color = CrimsonAlert)
        }
        is UiState.Success -> {
            val chats = directChatsState.data
            if (chats.isEmpty()) {
                Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = "لا توجد محادثات خاصة بعد.\nافتح تبويب (المتواجدون) لمراسلة أي عضو بشكل خاص 💌",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(chats, key = { it.id }) { chat ->
                        val partnerId = chat.participantIds.firstOrNull { it != currentUserId } ?: currentUserId
                        val partnerName = chat.participantNames[partnerId] ?: "عضو الشات"
                        val partnerAvatar = chat.participantAvatars[partnerId]
                        Card(
                            onClick = { onOpenChat(chat.id) },
                            colors = CardDefaults.cardColors(containerColor = CardSlate),
                            border = BorderStroke(1.dp, BorderSlate),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                UserAvatar(
                                    avatarOrUrl = partnerAvatar,
                                    fallbackEmoji = "💎",
                                    size = 46.dp
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = partnerName,
                                            style = MaterialTheme.typography.titleSmall,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = formatArabicTime(chat.lastMessageAt),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TextMuted
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = chat.lastMessageText ?: "ابدأ المحادثة الخاصة الآن...",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OnlineMembersTabContent(
    profilesState: UiState<List<PublicProfile>>,
    currentUserId: String,
    onStartChat: (PublicProfile) -> Unit
) {
    when (profilesState) {
        is UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = BrightGold)
        }
        is UiState.Error -> Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Text(profilesState.message, color = CrimsonAlert)
        }
        is UiState.Success -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(profilesState.data, key = { it.userId }) { member ->
                    val isSelf = member.userId == currentUserId
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardSlate),
                        border = BorderStroke(1.dp, if (member.isOwner) RoyalGold.copy(alpha = 0.4f) else BorderSlate),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                UserAvatar(
                                    avatarOrUrl = member.photoUrl ?: member.avatarEmoji,
                                    fallbackEmoji = member.roleEnum.badgeEmoji,
                                    size = 46.dp,
                                    showOnlineDot = true,
                                    isOnline = member.status == "online"
                                )
                                Column {
                                    Text(
                                        text = member.displayName + if (isSelf) " (أنت)" else "",
                                        style = MaterialTheme.typography.titleSmall,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    RoleBadge(member.roleEnum)
                                    if (!member.bio.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Text(
                                            text = member.bio,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                            if (!isSelf) {
                                IconButton(
                                    onClick = { onStartChat(member) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.Chat,
                                        contentDescription = "مراسلة خاصة",
                                        tint = EmeraldOnline
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileTabContent(
    profile: PublicProfile,
    isGlobalOwner: Boolean,
    onEditProfile: () -> Unit,
    onOpenControlPanel: () -> Unit,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        UserAvatar(
            avatarOrUrl = profile.photoUrl ?: profile.avatarEmoji,
            fallbackEmoji = profile.roleEnum.badgeEmoji,
            size = 92.dp,
            showOnlineDot = true,
            isOnline = profile.status == "online"
        )
        Text(
            text = profile.displayName,
            style = MaterialTheme.typography.headlineSmall,
            color = BrightGold
        )
        RoleBadge(profile.roleEnum)
        Text(
            text = profile.bio.orEmpty().ifBlank { "عضو في شات الغرف ✨" },
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onEditProfile,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Icon(Icons.Default.Edit, contentDescription = null, tint = MidnightVoid)
            Spacer(modifier = Modifier.size(8.dp))
            Text("تعديل الاسم والصورة والحالة", color = MidnightVoid, fontWeight = FontWeight.Bold)
        }

        Button(
            onClick = onOpenControlPanel,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSend),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Icon(Icons.Default.AdminPanelSettings, contentDescription = null)
            Spacer(modifier = Modifier.size(8.dp))
            Text(
                text = if (isGlobalOwner) "لوحة تحكم المالك العام 👑" else "إنشاء غرفة جديدة",
                fontWeight = FontWeight.Bold
            )
        }

        Button(
            onClick = onSignOut,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = ElevatedSlate),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = CrimsonAlert)
            Spacer(modifier = Modifier.size(8.dp))
            Text(text = stringResource(R.string.sign_out), color = CrimsonAlert, fontWeight = FontWeight.Bold)
        }
    }
}
