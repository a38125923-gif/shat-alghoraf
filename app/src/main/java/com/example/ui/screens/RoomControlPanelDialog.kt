package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.BanRecord
import com.example.data.model.Room
import com.example.data.model.UserRole
import com.example.ui.components.RoleBadge
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.theme.RoleOwnerGold
import com.example.ui.viewmodel.ChatViewModel

@Composable
fun RoomControlPanelDialog(
  room: Room,
  viewModel: ChatViewModel,
  onDismiss: () -> Unit,
  onRoomDeleted: () -> Unit
) {
  val currentUid = viewModel.currentUserId
  val isOwner = room.canManageRoles(currentUid)
  val isModerator = room.canModerate(currentUid)
  val roomBans by viewModel.roomBans.collectAsState()
  val allUsers by viewModel.allUsers.collectAsState()

  var selectedTabIndex by remember { mutableIntStateOf(0) }
  var showDeleteConfirm by remember { mutableStateOf(false) }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .padding(vertical = 20.dp)
        .testTag("room_control_panel_dialog"),
      shape = RoundedCornerShape(20.dp),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface
      )
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(18.dp)
      ) {
        // Top Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(RoleOwnerGold.copy(alpha = 0.2f)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = RoleOwnerGold,
                modifier = Modifier.size(24.dp)
              )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
              Text(
                text = "لوحة التحكم وإدارة الغرفة",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
              )
              Text(
                text = if (isOwner) "تحكم كامل للمالك 👑 (${room.ownerName})" else "صلاحيات المشرف ⚔️",
                fontSize = 11.sp,
                color = RoleOwnerGold
              )
            }
          }

          IconButton(
            onClick = onDismiss,
            modifier = Modifier.testTag("close_control_panel")
          ) {
            Icon(Icons.Default.Close, contentDescription = "إغلاق")
          }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 3 Tabs: المشرفين والرتب | المحظورين وفك الحظر | إعدادات الغرفة
        TabRow(
          selectedTabIndex = selectedTabIndex,
          containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
          contentColor = MaterialTheme.colorScheme.primary
        ) {
          Tab(
            selected = selectedTabIndex == 0,
            onClick = { selectedTabIndex = 0 },
            text = { Text("المشرفين ⚔️", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
          Tab(
            selected = selectedTabIndex == 1,
            onClick = { selectedTabIndex = 1 },
            text = { Text("المحظورين 🚫", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
          Tab(
            selected = selectedTabIndex == 2,
            onClick = { selectedTabIndex = 2 },
            text = { Text("الإعدادات ⚙️", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Box(
          modifier = Modifier
            .fillMaxWidth()
            .weight(1f, fill = false)
            .verticalScroll(rememberScrollState())
        ) {
          when (selectedTabIndex) {
            0 -> {
              ModeratorsManagementSection(
                room = room,
                viewModel = viewModel,
                isOwner = isOwner
              )
            }
            1 -> {
              BannedUsersSection(
                room = room,
                bans = roomBans,
                viewModel = viewModel,
                canModerate = isOwner || isModerator
              )
            }
            else -> {
              RoomSettingsSection(
                room = room,
                viewModel = viewModel,
                isOwner = isOwner,
                onRequestDelete = { showDeleteConfirm = true }
              )
            }
          }
        }
      }
    }
  }

  if (showDeleteConfirm) {
    AlertDialog(
      onDismissRequest = { showDeleteConfirm = false },
      title = { Text("تأكيد حذف الغرفة نهائياً") },
      text = { Text("هل أنت متأكد من رغبتك في حذف الغرفة؟ سيتم مسح كافة الرسائل والإعدادات.") },
      confirmButton = {
        Button(
          onClick = {
            showDeleteConfirm = false
            viewModel.deleteRoom(room.id) {
              onRoomDeleted()
              onDismiss()
            }
          },
          colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
          modifier = Modifier.testTag("confirm_delete_room_button")
        ) {
          Text("نعم، احذف الغرفة")
        }
      },
      dismissButton = {
        TextButton(onClick = { showDeleteConfirm = false }) {
          Text("إلغاء")
        }
      }
    )
  }
}

// -------------------------------------------------------------------------------------------------
// Tab 0: المشرفين والرتب وإدارتهم من قبل المالك
// -------------------------------------------------------------------------------------------------
@Composable
private fun ModeratorsManagementSection(
  room: Room,
  viewModel: ChatViewModel,
  isOwner: Boolean
) {
  var targetUidInput by remember { mutableStateOf("") }

  Column(modifier = Modifier.fillMaxWidth()) {
    Text(
      text = "ترقية وتعيين المشرفين بواسطة المعرف (UID)",
      fontSize = 13.sp,
      fontWeight = FontWeight.Bold,
      color = MaterialTheme.colorScheme.onSurface
    )
    Spacer(modifier = Modifier.height(6.dp))

    OutlinedTextField(
      value = targetUidInput,
      onValueChange = { targetUidInput = it },
      label = { Text("معرف المستخدم (UID)") },
      placeholder = { Text("ألصق معرف المستخدم لترقيته") },
      modifier = Modifier
        .fillMaxWidth()
        .testTag("target_uid_input"),
      singleLine = true
    )

    Spacer(modifier = Modifier.height(8.dp))

    if (isOwner) {
      Button(
        onClick = {
          if (targetUidInput.isNotBlank()) {
            viewModel.promoteToModerator(room.id, targetUidInput.trim(), "المستخدم")
            targetUidInput = ""
          }
        },
        modifier = Modifier
          .fillMaxWidth()
          .testTag("promote_moderator_button"),
        colors = ButtonDefaults.buttonColors(containerColor = RoleModeratorBlue)
      ) {
        Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text("ترقية إلى رتبة مشرف الغرفة ⚔️", fontSize = 12.sp, fontWeight = FontWeight.Bold)
      }
    }

    Spacer(modifier = Modifier.height(16.dp))
    HorizontalDivider()
    Spacer(modifier = Modifier.height(14.dp))

    // List of Current Roles
    Text(
      text = "هيكل الرتب الحالي في الغرفة",
      fontSize = 14.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(8.dp))

    // Owner Card
    Card(
      modifier = Modifier.fillMaxWidth(),
      colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
      shape = RoundedCornerShape(10.dp)
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(Icons.Default.Star, contentDescription = null, tint = RoleOwnerGold)
          Spacer(modifier = Modifier.width(8.dp))
          Column {
            Text(room.ownerName, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF92400E))
            Text("المالك (تحكم كامل في جميع الجوانب)", fontSize = 11.sp, color = Color(0xFFB45309))
          }
        }
        RoleBadge(role = UserRole.OWNER, showLabel = true)
      }
    }

    Spacer(modifier = Modifier.height(10.dp))

    // Moderators List
    Text(
      text = "المشرفين المعتمدين (${room.moderators.size})",
      fontSize = 13.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    if (room.moderators.isEmpty()) {
      Text(
        text = "لا يوجد مشرفين معينين في هذه الغرفة حالياً. يمكن للمالك ترقية أي مستخدم.",
        fontSize = 12.sp,
        color = Color.Gray,
        modifier = Modifier.padding(vertical = 4.dp)
      )
    } else {
      room.moderators.forEach { modUid ->
        Card(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
          colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F9FF)),
          shape = RoundedCornerShape(10.dp)
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.Security, contentDescription = null, tint = RoleModeratorBlue, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(8.dp))
              Column {
                Text("مشرف: $modUid", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF0369A1))
                Text("صلاحيات: حذف الرسائل، حظر، كتم", fontSize = 10.sp, color = Color(0xFF0284C7))
              }
            }

            if (isOwner) {
              OutlinedButton(
                onClick = { viewModel.demoteModerator(room.id, modUid, "المشرف") },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = RoleBannedRed)
              ) {
                Text("سحب الإشراف", fontSize = 11.sp)
              }
            }
          }
        }
      }
    }

    Spacer(modifier = Modifier.height(14.dp))

    // Muted Users List
    Text(
      text = "المستخدمون المكتومون (${room.mutedUsers.size})",
      fontSize = 13.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    if (room.mutedUsers.isEmpty()) {
      Text(
        text = "لا يوجد مستخدمون مكتومون في هذه الغرفة.",
        fontSize = 12.sp,
        color = Color.Gray
      )
    } else {
      room.mutedUsers.forEach { mutedUid ->
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Text(text = "مكتوم: $mutedUid", fontSize = 12.sp)
          OutlinedButton(
            onClick = { viewModel.muteUser(room.id, mutedUid, "المستخدم", false) }
          ) {
            Text("فك الكتم", fontSize = 11.sp)
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Tab 1: المحظورين وفك الحظر وإدارتهم
// -------------------------------------------------------------------------------------------------
@Composable
private fun BannedUsersSection(
  room: Room,
  bans: List<BanRecord>,
  viewModel: ChatViewModel,
  canModerate: Boolean
) {
  Column(modifier = Modifier.fillMaxWidth()) {
    Text(
      text = "قائمة المحظورين من الغرفة (${room.bannedUsers.size})",
      fontSize = 14.sp,
      fontWeight = FontWeight.Bold,
      color = RoleBannedRed
    )
    Spacer(modifier = Modifier.height(6.dp))
    Text(
      text = "يمكن للمشرفين والمالك مراجعة أسباب الحظر ورفع الحظر في أي وقت.",
      fontSize = 11.sp,
      color = Color.Gray
    )

    Spacer(modifier = Modifier.height(12.dp))

    if (room.bannedUsers.isEmpty() && bans.isEmpty()) {
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          Icon(Icons.Default.Block, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(32.dp))
          Spacer(modifier = Modifier.height(8.dp))
          Text("لا يوجد مستخدمين محظورين في هذه الغرفة حالياً", fontSize = 12.sp, color = Color.Gray)
        }
      }
    } else {
      // Show ban records if found
      bans.forEach { ban ->
        Card(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
          shape = RoundedCornerShape(10.dp),
          colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
          border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA))
        ) {
          Column(modifier = Modifier.padding(12.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Text(
                text = ban.targetName.ifBlank { "مستخدم (${ban.targetUid.take(6)})" },
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color(0xFF991B1B)
              )
              Text(
                text = ban.getRemainingTimeAr(),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = if (ban.isPermanent) RoleBannedRed else Color(0xFFD97706)
              )
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
              text = "السبب: ${ban.reason}",
              fontSize = 12.sp,
              color = Color(0xFF7F1D1D)
            )

            if (ban.bannedByName.isNotBlank()) {
              Spacer(modifier = Modifier.height(2.dp))
              Text(
                text = "بواسطة: ${ban.bannedByName}",
                fontSize = 10.sp,
                color = Color(0xFFB91C1C)
              )
            }

            if (canModerate) {
              Spacer(modifier = Modifier.height(8.dp))
              Button(
                onClick = {
                  viewModel.unbanUser(
                    roomId = room.id,
                    targetUid = ban.targetUid,
                    targetName = ban.targetName,
                    banId = ban.id,
                    isGlobal = ban.isGlobal
                  )
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                modifier = Modifier
                  .fillMaxWidth()
                  .testTag("unban_button_${ban.targetUid}")
              ) {
                Text("رفع الحظر والسماح بالدخول 🔓", fontSize = 11.sp, fontWeight = FontWeight.Bold)
              }
            }
          }
        }
      }

      // Also cover bannedUsers UIDs that might not have a formal BanRecord
      val unrecordedUids = room.bannedUsers.filter { uid -> bans.none { it.targetUid == uid } }
      unrecordedUids.forEach { rawUid ->
        Card(
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
          shape = RoundedCornerShape(10.dp),
          colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Column {
              Text("معرف: $rawUid", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = RoleBannedRed)
              Text("محظور من الغرفة", fontSize = 10.sp, color = Color.Gray)
            }

            if (canModerate) {
              Button(
                onClick = {
                  viewModel.unbanUser(roomId = room.id, targetUid = rawUid, targetName = "المستخدم")
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
              ) {
                Text("فك الحظر 🔓", fontSize = 11.sp)
              }
            }
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Tab 2: إعدادات الغرفة والمالك
// -------------------------------------------------------------------------------------------------
@Composable
private fun RoomSettingsSection(
  room: Room,
  viewModel: ChatViewModel,
  isOwner: Boolean,
  onRequestDelete: () -> Unit
) {
  var roomName by remember(room.name) { mutableStateOf(room.name) }
  var roomDesc by remember(room.description) { mutableStateOf(room.description) }
  var announcementInput by remember(room.pinnedMessage) { mutableStateOf(room.pinnedMessage ?: "") }
  var isLocked by remember(room.isLocked) { mutableStateOf(room.isLocked) }
  var selectedPerm by remember(room.permissionLevel) { mutableStateOf(room.getPermission()) }

  Column(modifier = Modifier.fillMaxWidth()) {
    // Lock Toggle
    Card(
      modifier = Modifier.fillMaxWidth(),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
      ),
      shape = RoundedCornerShape(12.dp)
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(
            imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
            contentDescription = null,
            tint = if (isLocked) RoleMutedAmber else MaterialTheme.colorScheme.primary
          )
          Spacer(modifier = Modifier.width(10.dp))
          Column {
            Text(
              text = "قفل الغرفة للكتابة",
              fontSize = 14.sp,
              fontWeight = FontWeight.Bold
            )
            Text(
              text = if (isLocked) "الغرفة مقفلة (للمشرفين والمالك فقط)" else "الغرفة مفتوحة للجميع للكتابة",
              fontSize = 11.sp,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }

        Switch(
          checked = isLocked,
          onCheckedChange = {
            isLocked = it
            viewModel.toggleRoomLock(room.id, it)
          },
          modifier = Modifier.testTag("toggle_room_lock_switch"),
          colors = SwitchDefaults.colors(checkedThumbColor = RoleMutedAmber)
        )
      }
    }

    Spacer(modifier = Modifier.height(16.dp))

    // Pinned Announcement
    Text(
      text = "الإعلان المثبت (رسالة التنبيه الإداري)",
      fontSize = 14.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    OutlinedTextField(
      value = announcementInput,
      onValueChange = { announcementInput = it },
      label = { Text("نص الإعلان المثبت أعلى الغرفة") },
      placeholder = { Text("مثال: مرحباً بكم، يرجى الالتزام بالاحترام...") },
      modifier = Modifier
        .fillMaxWidth()
        .testTag("announcement_input"),
      maxLines = 3
    )

    Spacer(modifier = Modifier.height(8.dp))

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      Button(
        onClick = {
          viewModel.setPinnedAnnouncement(room.id, announcementInput.trim().ifBlank { null })
        },
        modifier = Modifier
          .weight(1f)
          .testTag("save_announcement_button"),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
      ) {
        Icon(Icons.Default.Campaign, contentDescription = null, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text("تثبيت الإعلان", fontSize = 12.sp)
      }

      if (room.pinnedMessage != null) {
        OutlinedButton(
          onClick = {
            announcementInput = ""
            viewModel.setPinnedAnnouncement(room.id, null)
          },
          modifier = Modifier.testTag("clear_announcement_button")
        ) {
          Text("إزالة الإعلان", fontSize = 12.sp)
        }
      }
    }

    Spacer(modifier = Modifier.height(18.dp))
    HorizontalDivider()
    Spacer(modifier = Modifier.height(14.dp))

    // Edit Room Details
    Text(
      text = "تعديل تفاصيل الغرفة",
      fontSize = 14.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    OutlinedTextField(
      value = roomName,
      onValueChange = { roomName = it },
      label = { Text("اسم الغرفة") },
      modifier = Modifier
        .fillMaxWidth()
        .testTag("edit_room_name_input"),
      singleLine = true
    )

    Spacer(modifier = Modifier.height(8.dp))

    OutlinedTextField(
      value = roomDesc,
      onValueChange = { roomDesc = it },
      label = { Text("وصف الغرفة أو موضوع النقاش") },
      modifier = Modifier
        .fillMaxWidth()
        .testTag("edit_room_desc_input"),
      maxLines = 2
    )

    Spacer(modifier = Modifier.height(12.dp))

    // Permission Level Selection
    Text(
      text = "مستوى الأذونات وصلاحيات الدخول:",
      fontSize = 13.sp,
      fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      listOf(
        com.example.data.model.RoomPermission.PUBLIC,
        com.example.data.model.RoomPermission.PRIVATE,
        com.example.data.model.RoomPermission.APPROVAL_ONLY
      ).forEach { perm ->
        Button(
          onClick = { selectedPerm = perm },
          modifier = Modifier.weight(1f),
          colors = ButtonDefaults.buttonColors(
            containerColor = if (selectedPerm == perm) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            contentColor = if (selectedPerm == perm) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
          ),
          shape = RoundedCornerShape(8.dp)
        ) {
          Text(perm.titleAr, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
      }
    }

    Spacer(modifier = Modifier.height(14.dp))

    Button(
      onClick = {
        viewModel.updateRoomDetails(room.id, roomName, roomDesc, room.category, selectedPerm.key)
      },
      modifier = Modifier
        .fillMaxWidth()
        .testTag("save_room_details_button")
    ) {
      Text("حفظ بيانات الغرفة وتعديل الأذونات 💾")
    }

    if (isOwner) {
      Spacer(modifier = Modifier.height(20.dp))
      HorizontalDivider()
      Spacer(modifier = Modifier.height(14.dp))

      Text(
        text = "منطقة الخطر (إدارة المالك)",
        fontSize = 13.sp,
        fontWeight = FontWeight.Bold,
        color = RoleBannedRed
      )
      Spacer(modifier = Modifier.height(6.dp))

      Button(
        onClick = onRequestDelete,
        colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
        modifier = Modifier
          .fillMaxWidth()
          .testTag("delete_room_button")
      ) {
        Icon(Icons.Default.DeleteForever, contentDescription = null)
        Spacer(modifier = Modifier.width(8.dp))
        Text("حذف الغرفة نهائياً", fontWeight = FontWeight.Bold)
      }
    }
  }
}
