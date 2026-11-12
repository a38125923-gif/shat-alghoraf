package com.example.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MeetingRoom
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.example.data.model.Room
import com.example.data.model.RoomPermission
import com.example.data.model.UserRole
import com.example.ui.components.CategoryFilterChip
import com.example.ui.components.RoleBadge
import com.example.ui.components.StatusDot
import com.example.ui.components.UserAvatar
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.theme.RoleOwnerGold
import com.example.ui.viewmodel.ChatViewModel

val CATEGORIES = listOf("الكل", "عام", "ألعاب", "تقنية", "تعارف", "ثقافة", "خواطر")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomsScreen(
  viewModel: ChatViewModel,
  onSignOut: () -> Unit,
  onRoomSelected: (String) -> Unit
) {
  val rooms by viewModel.rooms.collectAsState()
  val userProfile by viewModel.userProfile.collectAsState()
  val selectedCat by viewModel.selectedCategory.collectAsState()
  val errorMessage by viewModel.errorMessage.collectAsState()
  val successMessage by viewModel.successMessage.collectAsState()
  val snackbarHostState = remember { SnackbarHostState() }

  // Room Management GUI dialog state (Create or Edit)
  var showManagementDialog by remember { mutableStateOf(false) }
  var roomToManage by remember { mutableStateOf<Room?>(null) }

  var showProfileDialog by remember { mutableStateOf(false) }
  var showOwnerMasterPanel by remember { mutableStateOf(false) }
  var showSignOutConfirm by remember { mutableStateOf(false) }

  LaunchedEffect(errorMessage) {
    errorMessage?.let {
      snackbarHostState.showSnackbar(it)
      viewModel.clearError()
    }
  }

  LaunchedEffect(successMessage) {
    successMessage?.let {
      snackbarHostState.showSnackbar(it)
      viewModel.clearSuccess()
    }
  }

  val filteredRooms = remember(rooms, selectedCat) {
    if (selectedCat == "الكل") rooms
    else rooms.filter { it.category == selectedCat }
  }

  Scaffold(
    snackbarHost = { SnackbarHost(snackbarHostState) },
    topBar = {
      TopAppBar(
        title = {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
              imageVector = Icons.Default.MeetingRoom,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
              Text(
                text = "شات الغرف",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
              )
              Text(
                text = "${rooms.size} غرفة متاحة",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
              )
            }
          }
        },
        actions = {
          // Owner Master Control Panel Button
          if (userProfile?.globalRole == "owner" || userProfile?.email == "a38125923@gmail.com") {
            Button(
              onClick = { showOwnerMasterPanel = true },
              colors = ButtonDefaults.buttonColors(containerColor = RoleOwnerGold),
              shape = RoundedCornerShape(12.dp),
              contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
              modifier = Modifier.testTag("owner_control_panel_top_button")
            ) {
              Icon(Icons.Default.Star, contentDescription = null, tint = Color.Black, modifier = Modifier.size(14.dp))
              Spacer(modifier = Modifier.width(4.dp))
              Text("لوحة تحكم المالك 👑", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
            Spacer(modifier = Modifier.width(6.dp))
          }

          // User profile chip
          userProfile?.let { prof ->
            Row(
              verticalAlignment = Alignment.CenterVertically,
              modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                .clickable { showProfileDialog = true }
                .padding(horizontal = 8.dp, vertical = 4.dp)
                .testTag("user_profile_chip")
            ) {
              Box {
                UserAvatar(
                  name = prof.displayName,
                  size = 32.dp,
                  role = if (prof.globalRole == "owner") UserRole.OWNER else UserRole.MEMBER,
                  photoUrl = prof.photoUrl
                )
                StatusDot(
                  status = prof.status,
                  modifier = Modifier.align(Alignment.BottomEnd)
                )
              }
              Spacer(modifier = Modifier.width(6.dp))
              Column {
                Text(
                  text = prof.displayName.take(12),
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                  maxLines = 1,
                  overflow = TextOverflow.Ellipsis
                )
                if (prof.globalRole == "owner") {
                  Text(text = "مالك عام 👑", fontSize = 9.sp, color = RoleOwnerGold)
                }
              }
            }
          }

          IconButton(
            onClick = { showSignOutConfirm = true },
            modifier = Modifier.testTag("sign_out_button")
          ) {
            Icon(Icons.Default.ExitToApp, contentDescription = "تسجيل الخروج")
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = MaterialTheme.colorScheme.surface
        )
      )
    },
    floatingActionButton = {
      ExtendedFloatingActionButton(
        onClick = {
          roomToManage = null
          showManagementDialog = true
        },
        icon = { Icon(Icons.Default.Add, contentDescription = null) },
        text = { Text("إنشاء غرفة جديدة 👑", fontWeight = FontWeight.Bold) },
        modifier = Modifier.testTag("create_room_fab"),
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary
      )
    }
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
    ) {
      // Category Chips
      LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        items(CATEGORIES) { cat ->
          CategoryFilterChip(
            category = cat,
            selected = selectedCat == cat,
            onClick = { viewModel.selectedCategory.value = cat }
          )
        }
      }

      // Rooms List
      if (filteredRooms.isEmpty()) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
          contentAlignment = Alignment.Center
        ) {
          Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
              imageVector = Icons.Default.MeetingRoom,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
              modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
              text = if (rooms.isEmpty()) "لا توجد غرف حتى الآن" else "لا توجد غرف في هذا القسم",
              fontSize = 16.sp,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
              text = "اضغط على زر (إنشاء غرفة جديدة) لإنشاء أول غرفة!",
              fontSize = 13.sp,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      } else {
        LazyColumn(
          contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 88.dp, top = 8.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          items(filteredRooms, key = { it.id }) { room ->
            RoomCard(
              room = room,
              currentUid = viewModel.currentUserId,
              isGlobalOwner = userProfile?.globalRole == "owner",
              onJoin = { onRoomSelected(room.id) },
              onManage = {
                roomToManage = room
                showManagementDialog = true
              }
            )
          }
        }
      }
    }
  }

  // Complete GUI for Room Management & Creation
  if (showManagementDialog) {
    RoomManagementDialog(
      roomToEdit = roomToManage,
      viewModel = viewModel,
      onDismiss = {
        showManagementDialog = false
        roomToManage = null
      },
      onRoomCreated = { newRoomId ->
        onRoomSelected(newRoomId)
      },
      onRoomDeleted = {
        roomToManage = null
      }
    )
  }

  // Edit Profile Dialog
  if (showProfileDialog && userProfile != null) {
    UserProfileDialog(
      profile = userProfile!!,
      onDismiss = { showProfileDialog = false },
      onSave = { name, bio, status, photoUrl ->
        viewModel.updateUserProfile(name, bio, status, photoUrl)
        showProfileDialog = false
      }
    )
  }

  // Owner Master Control Panel
  if (showOwnerMasterPanel) {
    OwnerMasterControlDialog(
      viewModel = viewModel,
      onDismiss = { showOwnerMasterPanel = false },
      onEditRoom = { room ->
        roomToManage = room
        showManagementDialog = true
      }
    )
  }

  // Confirm Sign Out Dialog
  if (showSignOutConfirm) {
    AlertDialog(
      onDismissRequest = { showSignOutConfirm = false },
      title = { Text("تسجيل الخروج") },
      text = { Text("هل ترغب في تسجيل الخروج من التطبيق؟") },
      confirmButton = {
        Button(
          onClick = {
            showSignOutConfirm = false
            onSignOut()
          },
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
          modifier = Modifier.testTag("confirm_sign_out_button")
        ) {
          Text("تسجيل الخروج")
        }
      },
      dismissButton = {
        TextButton(onClick = { showSignOutConfirm = false }) {
          Text("إلغاء")
        }
      }
    )
  }
}

@Composable
private fun RoomCard(
  room: Room,
  currentUid: String,
  isGlobalOwner: Boolean,
  onJoin: () -> Unit,
  onManage: () -> Unit
) {
  val userRole = room.getUserRole(currentUid)
  val isOwner = room.ownerId == currentUid || isGlobalOwner
  val permission = room.getPermission()

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = onJoin)
      .testTag("room_card_${room.id}"),
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(
      containerColor = MaterialTheme.colorScheme.surface
    ),
    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
  ) {
    Column(modifier = Modifier.padding(16.dp)) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          // Category Badge
          Surface(
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.primaryContainer
          ) {
            Text(
              text = room.category,
              color = MaterialTheme.colorScheme.onPrimaryContainer,
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold,
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
            )
          }

          Spacer(modifier = Modifier.width(6.dp))

          // Permission Level Badge (عامة / خاصة / بموافقة فقط)
          Surface(
            shape = RoundedCornerShape(8.dp),
            color = when (permission) {
              RoomPermission.PUBLIC -> Color(0xFF10B981).copy(alpha = 0.15f)
              RoomPermission.PRIVATE -> RoleOwnerGold.copy(alpha = 0.15f)
              RoomPermission.APPROVAL_ONLY -> RoleAdminPurple.copy(alpha = 0.15f)
            }
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
              Icon(
                imageVector = when (permission) {
                  RoomPermission.PUBLIC -> Icons.Default.Public
                  RoomPermission.PRIVATE -> Icons.Default.Lock
                  RoomPermission.APPROVAL_ONLY -> Icons.Default.Security
                },
                contentDescription = null,
                tint = when (permission) {
                  RoomPermission.PUBLIC -> Color(0xFF10B981)
                  RoomPermission.PRIVATE -> RoleOwnerGold
                  RoomPermission.APPROVAL_ONLY -> RoleAdminPurple
                },
                modifier = Modifier.size(12.dp)
              )
              Spacer(modifier = Modifier.width(3.dp))
              Text(
                text = permission.titleAr,
                fontSize = 10.sp,
                color = when (permission) {
                  RoomPermission.PUBLIC -> Color(0xFF047857)
                  RoomPermission.PRIVATE -> Color(0xFFB45309)
                  RoomPermission.APPROVAL_ONLY -> RoleAdminPurple
                },
                fontWeight = FontWeight.Bold
              )
            }
          }
        }

        // Current user badge in this room
        if (isOwner) {
          RoleBadge(role = UserRole.OWNER, showLabel = true)
        } else if (userRole != UserRole.MEMBER) {
          RoleBadge(role = userRole, showLabel = true)
        }
      }

      Spacer(modifier = Modifier.height(8.dp))

      Text(
        text = room.name,
        fontSize = 16.sp,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurface
      )

      if (room.description.isNotBlank()) {
        Spacer(modifier = Modifier.height(4.dp))
        Text(
          text = room.description,
          fontSize = 13.sp,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          maxLines = 2,
          overflow = TextOverflow.Ellipsis
        )
      }

      // Pinned announcement banner snippet
      if (!room.pinnedMessage.isNullOrBlank()) {
        Spacer(modifier = Modifier.height(8.dp))
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(RoleOwnerGold.copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 4.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Icon(
            imageVector = Icons.Default.Campaign,
            contentDescription = null,
            tint = RoleOwnerGold,
            modifier = Modifier.size(14.dp)
          )
          Spacer(modifier = Modifier.width(6.dp))
          Text(
            text = room.pinnedMessage,
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
        }
      }

      Spacer(modifier = Modifier.height(12.dp))

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(
            imageVector = Icons.Default.Star,
            contentDescription = null,
            tint = RoleOwnerGold,
            modifier = Modifier.size(16.dp)
          )
          Spacer(modifier = Modifier.width(4.dp))
          Text(
            text = "المالك: ${room.ownerName}",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          // If Owner: Direct access to Room Management GUI
          if (isOwner) {
            OutlinedButton(
              onClick = onManage,
              shape = RoundedCornerShape(10.dp),
              modifier = Modifier.testTag("manage_room_button_${room.id}")
            ) {
              Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(14.dp))
              Spacer(modifier = Modifier.width(4.dp))
              Text("إدارة الغرفة", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
          }

          Button(
            onClick = onJoin,
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(
              containerColor = MaterialTheme.colorScheme.primaryContainer,
              contentColor = MaterialTheme.colorScheme.onPrimaryContainer
            ),
            modifier = Modifier.testTag("join_room_button_${room.id}")
          ) {
            Text("دخول الغرفة", fontSize = 12.sp, fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }
}
