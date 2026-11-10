package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SentimentSatisfiedAlt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.ChatMessage
import com.example.data.model.Room
import com.example.data.model.UserRole
import com.example.ui.components.ArabicChatBottomBar
import com.example.ui.components.ArabicChatHeader
import com.example.ui.components.MicsStageBar
import com.example.ui.components.RoleBadge
import com.example.ui.components.UserAvatar
import com.example.ui.theme.ChatBackgroundLight
import com.example.ui.theme.DiamondCyan
import com.example.ui.theme.GoldenBadgeBg
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.HeaderNavy
import com.example.ui.theme.MicActiveBlue
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.theme.RoleOwnerGold
import com.example.ui.theme.SystemJoinBg
import com.example.ui.viewmodel.ChatViewModel
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatRoomScreen(
  viewModel: ChatViewModel,
  onNavigateBack: () -> Unit
) {
  val room by viewModel.currentRoom.collectAsState()
  val rooms by viewModel.rooms.collectAsState()
  val messages by viewModel.messages.collectAsState()
  val userProfile by viewModel.userProfile.collectAsState()
  val currentUid = viewModel.currentUserId
  val listState = rememberLazyListState()
  val snackbarHostState = remember { SnackbarHostState() }

  var messageInput by remember { mutableStateOf("") }
  var isRadioPlaying by remember { mutableStateOf(false) }
  var showControlPanel by remember { mutableStateOf(false) }
  var showRoomsDrawer by remember { mutableStateOf(false) }
  var showOnlineDrawer by remember { mutableStateOf(false) }
  var showVipsDialog by remember { mutableStateOf(false) }
  var showQuickActionsSheet by remember { mutableStateOf(false) }
  var messageToDelete by remember { mutableStateOf<ChatMessage?>(null) }
  var messageOptionsTarget by remember { mutableStateOf<ChatMessage?>(null) }
  var moderationTargetUser by remember { mutableStateOf<Triple<String, String, UserRole>?>(null) }
  var showEmojiPicker by remember { mutableStateOf(false) }

  // Virtual mic speakers
  val activeSpeakers = remember { mutableStateListOf("المالك 👑", "الصقر 💎") }

  // Handle hardware & gesture back button
  BackHandler {
    viewModel.selectRoom(null)
    onNavigateBack()
  }

  // Auto-scroll to bottom when messages change
  LaunchedEffect(messages.size) {
    if (messages.isNotEmpty()) {
      listState.animateScrollToItem(messages.size - 1)
    }
  }

  if (room == null) {
    Box(
      modifier = Modifier.fillMaxSize(),
      contentAlignment = Alignment.Center
    ) {
      Text("جاري تحميل الغرفة...")
    }
    return
  }

  val currentRoom = room!!
  val userRole = currentRoom.getUserRole(currentUid)
  val canModerate = currentRoom.canModerate(currentUid)
  val canPost = currentRoom.canPostMessages(currentUid)
  val isOwner = currentRoom.ownerId == currentUid

  Scaffold(
    snackbarHost = { SnackbarHost(snackbarHostState) },
    topBar = {
      ArabicChatHeader(
        userProfile = userProfile,
        onMenuClick = { showRoomsDrawer = true },
        onVipClick = { showVipsDialog = true },
        onTopUsersClick = { showVipsDialog = true },
        onMessagesClick = {
          // Open private whisper notice
          snackbarHostState.currentSnackbarData?.dismiss()
        },
        onRequestClick = {
          // Open request notice
        },
        onNotificationClick = {
          currentRoom.pinnedMessage?.let {
            // Show alert
          }
        },
        onProfileClick = {
          showControlPanel = canModerate
        }
      )
    },
    bottomBar = {
      ArabicChatBottomBar(
        currentTab = "rooms",
        onTabSelected = { tab ->
          when (tab) {
            "rooms" -> showRoomsDrawer = true
            "online" -> showOnlineDrawer = true
            "options" -> {
              if (canModerate) showControlPanel = true
              else showOnlineDrawer = true
            }
          }
        },
        isRadioPlaying = isRadioPlaying,
        onToggleRadio = {
          isRadioPlaying = !isRadioPlaying
        },
        onRefresh = {
          // Refresh trigger
        }
      )
    }
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .background(ChatBackgroundLight)
    ) {
      // 1. Mics Stage Bar (منصة المايكات الخمسة في أعلى الشات)
      MicsStageBar(
        activeSpeakers = activeSpeakers,
        onMicSeatClick = { slot ->
          val myName = userProfile?.displayName ?: "أنا"
          if (activeSpeakers.contains(myName)) {
            activeSpeakers.remove(myName)
          } else if (activeSpeakers.size < 5) {
            activeSpeakers.add(myName)
          }
        }
      )

      // Pinned Announcement Banner (if any)
      if (!currentRoom.pinnedMessage.isNullOrBlank()) {
        Card(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 2.dp)
            .testTag("pinned_announcement_banner"),
          shape = RoundedCornerShape(10.dp),
          colors = CardDefaults.cardColors(
            containerColor = GoldenBadgeBg
          ),
          border = androidx.compose.foundation.BorderStroke(1.dp, GoldenBorder)
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(
              imageVector = Icons.Default.PushPin,
              contentDescription = null,
              tint = GoldenCrown,
              modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = currentRoom.pinnedMessage!!,
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF78350F),
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              modifier = Modifier.weight(1f)
            )
          }
        }
      }

      // 2. Chat Feed (Messages Stream)
      LazyColumn(
        state = listState,
        modifier = Modifier
          .weight(1f)
          .fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        items(messages, key = { it.id }) { msg ->
          ArabicChatMessageRow(
            message = msg,
            canModerate = canModerate,
            currentUid = currentUid,
            onOptionsClick = {
              messageOptionsTarget = msg
            }
          )
        }
      }

      // Emoji Quick Bar
      AnimatedVisibility(visible = showEmojiPicker) {
        Surface(
          modifier = Modifier.fillMaxWidth(),
          color = Color.White,
          shadowElevation = 4.dp
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
          ) {
            listOf("❤️", "🌹", "👑", "💎", "🔥", "😂", "🤐", "👍", "👏", "✨").forEach { emoji ->
              Text(
                text = emoji,
                fontSize = 24.sp,
                modifier = Modifier
                  .clickable {
                    messageInput += emoji
                    showEmojiPicker = false
                  }
                  .padding(4.dp)
              )
            }
          }
        }
      }

      // 3. Bottom Chat Input Bar (كما في الصورة)
      Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 8.dp
      ) {
        if (!canPost) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(
              imageVector = if (userRole == UserRole.MUTED) Icons.Default.MicOff else Icons.Default.Lock,
              contentDescription = null,
              tint = RoleMutedAmber
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = if (userRole == UserRole.MUTED) "أنت مكتوم في هذه الغرفة ولا يمكنك الإرسال 🔇"
              else "الغرفة مقفلة للكتابة مؤقتاً 🔒",
              fontWeight = FontWeight.Bold,
              color = RoleMutedAmber,
              fontSize = 13.sp
            )
          }
        } else {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            // Blue Plus Button (+)
            Box(
              modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .clickable { showQuickActionsSheet = true }
                .background(Color(0xFFEFF6FF)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "خيارات إضافية",
                tint = MicActiveBlue,
                modifier = Modifier.size(22.dp)
              )
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Mic Icon Button
            Box(
              modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .clickable {
                  val myName = userProfile?.displayName ?: "أنا"
                  if (!activeSpeakers.contains(myName) && activeSpeakers.size < 5) {
                    activeSpeakers.add(myName)
                  }
                }
                .background(Color(0xFFEFF6FF)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.Mic,
                contentDescription = "طلب مايك",
                tint = MicActiveBlue,
                modifier = Modifier.size(20.dp)
              )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Rounded Input Pill: "اكتب هنا..." with yellow emoji face
            OutlinedTextField(
              value = messageInput,
              onValueChange = { messageInput = it },
              placeholder = { Text("اكتب هنا...", fontSize = 13.sp, color = Color.Gray) },
              modifier = Modifier
                .weight(1f)
                .testTag("chat_message_input"),
              shape = RoundedCornerShape(24.dp),
              trailingIcon = {
                IconButton(onClick = { showEmojiPicker = !showEmojiPicker }) {
                  Icon(
                    imageVector = Icons.Default.SentimentSatisfiedAlt,
                    contentDescription = "ملصقات",
                    tint = GoldenCrown
                  )
                }
              },
              singleLine = true,
              colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Color(0xFFF8FAFC),
                unfocusedContainerColor = Color(0xFFF8FAFC),
                focusedBorderColor = MicActiveBlue,
                unfocusedBorderColor = Color(0xFFE2E8F0)
              )
            )

            Spacer(modifier = Modifier.width(8.dp))

            // Blue Circle Send Button (➤)
            Box(
              modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .clickable(enabled = messageInput.isNotBlank()) {
                  if (messageInput.isNotBlank()) {
                    viewModel.sendMessage(messageInput.trim(), false)
                    messageInput = ""
                    showEmojiPicker = false
                  }
                }
                .background(
                  if (messageInput.isNotBlank()) MicActiveBlue
                  else Color(0xFF93C5FD)
                )
                .testTag("send_message_button"),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.AutoMirrored.Filled.Send,
                contentDescription = "إرسال",
                tint = Color.White,
                modifier = Modifier.size(20.dp)
              )
            }
          }
        }
      }
    }
  }

  // 4. Slide-in Rooms Drawer (Screenshot 1: قائمة الغرف)
  if (showRoomsDrawer) {
    ModalBottomSheet(
      onDismissRequest = { showRoomsDrawer = false },
      sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
      RoomsDrawerContent(
        rooms = rooms,
        currentRoomId = currentRoom.id,
        onSelectRoom = { selectedId ->
          viewModel.selectRoom(selectedId)
          showRoomsDrawer = false
        },
        onDismiss = { showRoomsDrawer = false }
      )
    }
  }

  // 5. Online Members Drawer (المتواجدين)
  if (showOnlineDrawer) {
    ModalBottomSheet(
      onDismissRequest = { showOnlineDrawer = false }
    ) {
      OnlineMembersDrawerContent(
        room = currentRoom,
        currentUid = currentUid,
        canModerate = canModerate,
        onManageUser = { targetUid, role, enable ->
          viewModel.manageUserRole(currentRoom.id, targetUid, role, enable)
        },
        onOpenModeration = { targetUid, targetName, targetRole ->
          showOnlineDrawer = false
          moderationTargetUser = Triple(targetUid, targetName, targetRole)
        },
        onDismiss = { showOnlineDrawer = false }
      )
    }
  }

  // 6. VIPs Dialog (الكبار والاثرياء)
  if (showVipsDialog) {
    VipsRankingDialog(
      room = currentRoom,
      onDismiss = { showVipsDialog = false }
    )
  }

  // 7. Quick Actions Sheet (+)
  if (showQuickActionsSheet) {
    QuickActionsBottomSheet(
      canModerate = canModerate,
      onSendAnnouncement = { text ->
        viewModel.sendMessage(text, true)
        showQuickActionsSheet = false
      },
      onOpenControlPanel = {
        showQuickActionsSheet = false
        showControlPanel = true
      },
      onDismiss = { showQuickActionsSheet = false }
    )
  }

  // 8. Owner & Admin Full Control Panel
  if (showControlPanel) {
    RoomControlPanelDialog(
      room = currentRoom,
      viewModel = viewModel,
      onDismiss = { showControlPanel = false },
      onRoomDeleted = {
        showControlPanel = false
        onNavigateBack()
      }
    )
  }

  // 9. User Moderation Dialog (من الرسائل أو قائمة الأعضاء)
  messageOptionsTarget?.let { targetMsg ->
    UserModerationDialog(
      targetUid = targetMsg.senderId,
      targetName = targetMsg.senderName,
      targetRole = UserRole.fromString(targetMsg.senderRole),
      room = currentRoom,
      message = targetMsg,
      viewModel = viewModel,
      onDismiss = { messageOptionsTarget = null }
    )
  }

  moderationTargetUser?.let { (uid, name, role) ->
    UserModerationDialog(
      targetUid = uid,
      targetName = name,
      targetRole = role,
      room = currentRoom,
      message = null,
      viewModel = viewModel,
      onDismiss = { moderationTargetUser = null }
    )
  }
}

// -------------------------------------------------------------------------------------------------
// Arab Chat Message Row (As in Screenshot 2)
// -------------------------------------------------------------------------------------------------

@Composable
private fun ArabicChatMessageRow(
  message: ChatMessage,
  canModerate: Boolean,
  currentUid: String,
  onOptionsClick: () -> Unit
) {
  val senderRole = UserRole.fromString(message.senderRole)
  val isAnnouncement = message.isAnnouncement
  val isSelf = message.senderId == currentUid

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 4.dp, vertical = 2.dp)
      .testTag("message_row_${message.id}"),
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(
      containerColor = Color.White
    ),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(8.dp),
      verticalAlignment = Alignment.Top
    ) {
      // 1. Left: Three Dots Menu Button (...)
      IconButton(
        onClick = onOptionsClick,
        modifier = Modifier
          .size(28.dp)
          .align(Alignment.CenterVertically)
          .testTag("message_options_${message.id}")
      ) {
        Icon(
          imageVector = Icons.Default.MoreHoriz,
          contentDescription = "خيارات",
          tint = Color.Gray,
          modifier = Modifier.size(18.dp)
        )
      }

      Spacer(modifier = Modifier.width(4.dp))

      // 2. Middle: Content & Badges
      Column(
        modifier = Modifier.weight(1f),
        horizontalAlignment = Alignment.End
      ) {
        // Name Tag with luxury badge (Screenshot 2: الصقر 💎 / مـلـكـة 👑)
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.End
        ) {
          Surface(
            shape = RoundedCornerShape(8.dp),
            color = when (senderRole) {
              UserRole.OWNER -> GoldenBadgeBg
              UserRole.ADMIN -> Color(0xFFF3E8FF)
              UserRole.MODERATOR -> Color(0xFFE0F2FE)
              else -> Color(0xFFF1F5F9)
            },
            border = androidx.compose.foundation.BorderStroke(
              1.dp,
              when (senderRole) {
                UserRole.OWNER -> GoldenBorder
                UserRole.ADMIN -> RoleAdminPurple
                UserRole.MODERATOR -> RoleModeratorBlue
                else -> Color(0xFFCBD5E1)
              }
            )
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(
                text = message.senderName,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = when (senderRole) {
                  UserRole.OWNER -> Color(0xFFB45309)
                  UserRole.ADMIN -> RoleAdminPurple
                  UserRole.MODERATOR -> RoleModeratorBlue
                  else -> Color(0xFF334155)
                }
              )
              Spacer(modifier = Modifier.width(4.dp))
              Text(
                text = when (senderRole) {
                  UserRole.OWNER -> "💎 👑"
                  UserRole.ADMIN -> "🛡️"
                  UserRole.MODERATOR -> "⚔️"
                  else -> "👤"
                },
                fontSize = 10.sp
              )
            }
          }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Message text or system announcement
        if (isAnnouncement) {
          Surface(
            shape = RoundedCornerShape(12.dp),
            color = SystemJoinBg
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF4ADE80), modifier = Modifier.size(14.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = message.content,
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }
        } else {
          Text(
            text = message.content,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF0F172A)
          )
        }
      }

      Spacer(modifier = Modifier.width(10.dp))

      // 3. Right: Ornate Avatar with Crown/Frame (Screenshot 2)
      Box(
        modifier = Modifier
          .size(44.dp)
          .clip(CircleShape)
          .border(2.dp, GoldenCrown, CircleShape)
          .background(Color(0xFF1E293B)),
        contentAlignment = Alignment.Center
      ) {
        Text(
          text = message.senderName.take(1).uppercase(),
          color = GoldenCrown,
          fontWeight = FontWeight.Bold,
          fontSize = 18.sp
        )
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Rooms Drawer Content (Screenshot 1: قائمة الغرف بالكامل)
// -------------------------------------------------------------------------------------------------

@Composable
private fun RoomsDrawerContent(
  rooms: List<Room>,
  currentRoomId: String,
  onSelectRoom: (String) -> Unit,
  onDismiss: () -> Unit
) {
  var searchQuery by remember { mutableStateOf("") }

  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(16.dp)
      .testTag("rooms_drawer_content")
  ) {
    // Header & Search (Screenshot 1)
    Row(
      modifier = Modifier.fillMaxWidth(),
      verticalAlignment = Alignment.CenterVertically
    ) {
      IconButton(onClick = onDismiss) {
        Icon(Icons.Default.Close, contentDescription = "إغلاق")
      }
      OutlinedTextField(
        value = searchQuery,
        onValueChange = { searchQuery = it },
        placeholder = { Text("البحث عن غرف أو اشخاص", fontSize = 13.sp) },
        leadingIcon = {
          Icon(Icons.Default.Search, contentDescription = null, tint = MicActiveBlue)
        },
        modifier = Modifier
          .weight(1f)
          .testTag("drawer_search_input"),
        singleLine = true,
        shape = RoundedCornerShape(20.dp)
      )
    }

    Spacer(modifier = Modifier.height(16.dp))

    val filtered = remember(rooms, searchQuery) {
      if (searchQuery.isBlank()) rooms
      else rooms.filter { it.name.contains(searchQuery, ignoreCase = true) }
    }

    LazyColumn(
      modifier = Modifier
        .fillMaxWidth()
        .height(420.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      items(filtered, key = { it.id }) { r ->
        DrawerRoomRowItem(
          room = r,
          isSelected = r.id == currentRoomId,
          onClick = { onSelectRoom(r.id) }
        )
      }
    }
  }
}

@Composable
private fun DrawerRoomRowItem(
  room: Room,
  isSelected: Boolean,
  onClick: () -> Unit
) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = onClick)
      .testTag("drawer_room_${room.id}"),
    shape = RoundedCornerShape(10.dp),
    colors = CardDefaults.cardColors(
      containerColor = if (isSelected) Color(0xFFEFF6FF) else Color.White
    ),
    border = if (isSelected) androidx.compose.foundation.BorderStroke(1.5.dp, MicActiveBlue) else null
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 12.dp, vertical = 10.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      // Left: Badges (Member count in cyan + lock/pin)
      Row(verticalAlignment = Alignment.CenterVertically) {
        if (room.isLocked) {
          Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = "مقفلة",
            tint = GoldenCrown,
            modifier = Modifier.size(16.dp)
          )
          Spacer(modifier = Modifier.width(6.dp))
        }

        // Pin icon for main room
        if (room.name.contains("العامة") || room.category == "عام") {
          Icon(
            imageVector = Icons.Default.PushPin,
            contentDescription = null,
            tint = Color(0xFF10B981),
            modifier = Modifier.size(16.dp)
          )
          Spacer(modifier = Modifier.width(6.dp))
        }

        // Member count (cyan blue: 👥 106)
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(
            imageVector = Icons.Default.Group,
            contentDescription = null,
            tint = Color(0xFF0284C7),
            modifier = Modifier.size(16.dp)
          )
          Spacer(modifier = Modifier.width(4.dp))
          Text(
            text = "${room.memberCount}",
            color = Color(0xFF0284C7),
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp
          )
        }
      }

      // Middle & Right: Room Name + Ornate Emblem
      Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
          text = room.name,
          fontWeight = FontWeight.Bold,
          fontSize = 14.sp,
          color = Color(0xFF0F172A)
        )
        Spacer(modifier = Modifier.width(10.dp))

        // Ornate Room Emblem (Screenshot 1)
        Box(
          modifier = Modifier
            .size(38.dp)
            .clip(RoundedCornerShape(8.dp))
            .border(1.5.dp, GoldenCrown, RoundedCornerShape(8.dp))
            .background(Color(0xFF1E293B)),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.Star,
            contentDescription = null,
            tint = GoldenCrown,
            modifier = Modifier.size(20.dp)
          )
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Online Members Drawer (المتواجدين)
// -------------------------------------------------------------------------------------------------

@Composable
private fun OnlineMembersDrawerContent(
  room: Room,
  currentUid: String,
  canModerate: Boolean,
  onManageUser: (targetUid: String, role: UserRole, enable: Boolean) -> Unit,
  onOpenModeration: (targetUid: String, targetName: String, role: UserRole) -> Unit,
  onDismiss: () -> Unit
) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(16.dp)
      .testTag("online_members_drawer")
  ) {
    Text(
      text = "المتواجدون في الغرفة (${room.memberCount})",
      fontWeight = FontWeight.Bold,
      fontSize = 16.sp
    )
    Spacer(modifier = Modifier.height(12.dp))

    // Owner Item
    OnlineUserItem(
      name = room.ownerName,
      uid = room.ownerId,
      role = UserRole.OWNER,
      canModerate = false,
      onAction = {},
      onModerate = {}
    )

    Spacer(modifier = Modifier.height(8.dp))

    // Admins
    room.admins.forEach { adminUid ->
      OnlineUserItem(
        name = "أدمن ($adminUid)",
        uid = adminUid,
        role = UserRole.ADMIN,
        canModerate = canModerate,
        onAction = { onManageUser(adminUid, UserRole.ADMIN, false) },
        onModerate = { onOpenModeration(adminUid, "أدمن ($adminUid)", UserRole.ADMIN) }
      )
      Spacer(modifier = Modifier.height(6.dp))
    }

    // Moderators
    room.moderators.forEach { modUid ->
      OnlineUserItem(
        name = "مشرف ($modUid)",
        uid = modUid,
        role = UserRole.MODERATOR,
        canModerate = canModerate,
        onAction = { onManageUser(modUid, UserRole.MODERATOR, false) },
        onModerate = { onOpenModeration(modUid, "مشرف ($modUid)", UserRole.MODERATOR) }
      )
      Spacer(modifier = Modifier.height(6.dp))
    }

    // Generic member placeholder if room is busy
    OnlineUserItem(
      name = "عضو زائر",
      uid = "guest_user",
      role = UserRole.MEMBER,
      canModerate = canModerate,
      onAction = {},
      onModerate = { onOpenModeration("guest_user", "عضو زائر", UserRole.MEMBER) }
    )

    Spacer(modifier = Modifier.height(16.dp))
  }
}

@Composable
private fun OnlineUserItem(
  name: String,
  uid: String,
  role: UserRole,
  canModerate: Boolean,
  onAction: () -> Unit,
  onModerate: () -> Unit
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(10.dp))
      .background(Color(0xFFF8FAFC))
      .clickable(enabled = canModerate && role != UserRole.OWNER, onClick = onModerate)
      .padding(10.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.SpaceBetween
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      Box(
        modifier = Modifier
          .size(34.dp)
          .clip(CircleShape)
          .background(Color(0xFF0F172A)),
        contentAlignment = Alignment.Center
      ) {
        Icon(Icons.Default.Person, contentDescription = null, tint = GoldenCrown, modifier = Modifier.size(18.dp))
      }
      Spacer(modifier = Modifier.width(8.dp))
      Column {
        Text(name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        RoleBadge(role = role, showLabel = true)
      }
    }

    if (canModerate && role != UserRole.OWNER) {
      Button(
        onClick = onModerate,
        colors = ButtonDefaults.buttonColors(containerColor = RoleModeratorBlue),
        shape = RoundedCornerShape(8.dp)
      ) {
        Text("إدارة العضو 🛡️", fontSize = 11.sp, fontWeight = FontWeight.Bold)
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// VIPs Ranking Dialog (الكبار والاثرياء)
// -------------------------------------------------------------------------------------------------

@Composable
private fun VipsRankingDialog(
  room: Room,
  onDismiss: () -> Unit
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = {
      Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.Star, contentDescription = null, tint = GoldenCrown)
        Spacer(modifier = Modifier.width(8.dp))
        Text("قائمة الكبار والأثرياء 💎", fontWeight = FontWeight.Bold)
      }
    },
    text = {
      Column {
        Text("مالك الغرفة: ${room.ownerName} (المرتبة الذهبية 👑)")
        Spacer(modifier = Modifier.height(8.dp))
        Text("عدد المشرفين المعتمدين: ${room.moderators.size}")
        Spacer(modifier = Modifier.height(8.dp))
        Text("عدد الأدمن الرسميين: ${room.admins.size}")
      }
    },
    confirmButton = {
      Button(onClick = onDismiss) {
        Text("حسناً")
      }
    }
  )
}

// -------------------------------------------------------------------------------------------------
// Quick Actions Bottom Sheet (+)
// -------------------------------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuickActionsBottomSheet(
  canModerate: Boolean,
  onSendAnnouncement: (String) -> Unit,
  onOpenControlPanel: () -> Unit,
  onDismiss: () -> Unit
) {
  var announcementText by remember { mutableStateOf("") }

  ModalBottomSheet(onDismissRequest = onDismiss) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp)
    ) {
      Text("إجراءات سريعة ⚡", fontWeight = FontWeight.Bold, fontSize = 16.sp)
      Spacer(modifier = Modifier.height(12.dp))

      if (canModerate) {
        Text("إرسال تنبيه إداري بارز (للمشرفين والمالك):", fontSize = 13.sp)
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
          value = announcementText,
          onValueChange = { announcementText = it },
          label = { Text("نص التنبيه الإداري") },
          modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Button(
          onClick = {
            if (announcementText.isNotBlank()) {
              onSendAnnouncement(announcementText)
            }
          },
          modifier = Modifier.fillMaxWidth(),
          colors = ButtonDefaults.buttonColors(containerColor = GoldenCrown)
        ) {
          Text("بث التنبيه في الشات 📢", color = Color.Black, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
          onClick = onOpenControlPanel,
          modifier = Modifier.fillMaxWidth()
        ) {
          Text("فتح لوحة تحكم الغرفة الكاملة ⚙️")
        }
      } else {
        Text("لا تملك صلاحيات إدارية في هذه الغرفة.")
      }
    }
  }
}
