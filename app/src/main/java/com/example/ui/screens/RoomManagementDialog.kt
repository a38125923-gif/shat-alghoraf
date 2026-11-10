package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MeetingRoom
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.Room
import com.example.data.model.RoomPermission
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleOwnerGold
import com.example.ui.viewmodel.ChatViewModel

/**
 * الواجهة الرسومية المتكاملة لإنشاء وإدارة غرف الدردشة
 * تتيح إدخال الاسم، الوصف، تحديد مستويات الأذونات (عامة، خاصة، بموافقة فقط)،
 * وحفظ وتعديل وحذف الغرف من قبل المالك.
 */
@Composable
fun RoomManagementDialog(
  roomToEdit: Room? = null,
  viewModel: ChatViewModel,
  onDismiss: () -> Unit,
  onRoomCreated: (String) -> Unit = {},
  onRoomDeleted: () -> Unit = {}
) {
  val isEditMode = roomToEdit != null
  val currentUid = viewModel.currentUserId
  val isOwner = roomToEdit == null || roomToEdit.ownerId == currentUid

  var name by remember(roomToEdit) { mutableStateOf(roomToEdit?.name ?: "") }
  var description by remember(roomToEdit) { mutableStateOf(roomToEdit?.description ?: "") }
  var category by remember(roomToEdit) { mutableStateOf(roomToEdit?.category ?: "عام") }
  var catExpanded by remember { mutableStateOf(false) }

  var selectedPermission by remember(roomToEdit) {
    mutableStateOf(roomToEdit?.getPermission() ?: RoomPermission.PUBLIC)
  }

  var pinnedAnnouncement by remember(roomToEdit) {
    mutableStateOf(roomToEdit?.pinnedMessage ?: "")
  }

  var showDeleteConfirmation by remember { mutableStateOf(false) }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .padding(vertical = 16.dp)
        .testTag("room_management_dialog"),
      shape = RoundedCornerShape(20.dp),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface
      ),
      elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp)
          .verticalScroll(rememberScrollState())
      ) {
        // 1. Header (الترويسة)
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(if (isEditMode) RoleOwnerGold.copy(alpha = 0.2f) else MaterialTheme.colorScheme.primaryContainer),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = if (isEditMode) Icons.Default.Edit else Icons.Default.Add,
                contentDescription = null,
                tint = if (isEditMode) RoleOwnerGold else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
              )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
              Text(
                text = if (isEditMode) "إدارة وتعديل الغرفة" else "إنشاء غرفة دردشة جديدة",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
              )
              Text(
                text = if (isEditMode) "لوحة تحكم المالك في الإعدادات والأذونات" else "تحديد الخصائص ومستويات الأذونات",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
              )
            }
          }

          IconButton(
            onClick = onDismiss,
            modifier = Modifier.testTag("close_room_management_button")
          ) {
            Icon(Icons.Default.Close, contentDescription = "إغلاق")
          }
        }

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(16.dp))

        // 2. Room Name (اسم الغرفة)
        Text(
          text = "اسم الغرفة *",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
          value = name,
          onValueChange = { name = it },
          label = { Text("أدخل اسم الغرفة") },
          placeholder = { Text("مثال: ديوانية الأصدقاء، ملتقى التقنية...") },
          modifier = Modifier
            .fillMaxWidth()
            .testTag("room_name_input_field"),
          singleLine = true,
          shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        // 3. Room Description (وصف الغرفة)
        Text(
          text = "وصف الغرفة وموضوع النقاش",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
          value = description,
          onValueChange = { description = it },
          label = { Text("وصف مختصر لموضوع الغرفة") },
          placeholder = { Text("مثال: غرفة مفتوحة للأحاديث الودية والمسابقات...") },
          modifier = Modifier
            .fillMaxWidth()
            .testTag("room_description_input_field"),
          maxLines = 3,
          shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        // 4. Category Selector (القسم والتصنيف)
        Text(
          text = "القسم والتصنيف",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(6.dp))
        Box {
          OutlinedTextField(
            value = category,
            onValueChange = {},
            readOnly = true,
            label = { Text("اختر القسم المناسب") },
            modifier = Modifier
              .fillMaxWidth()
              .clickable { catExpanded = true }
              .testTag("room_category_picker_field"),
            shape = RoundedCornerShape(12.dp)
          )
          DropdownMenu(
            expanded = catExpanded,
            onDismissRequest = { catExpanded = false }
          ) {
            listOf("عام", "ألعاب", "تقنية", "تعارف", "ثقافة", "خواطر").forEach { cat ->
              DropdownMenuItem(
                text = { Text(cat) },
                onClick = {
                  category = cat
                  catExpanded = false
                }
              )
            }
          }
        }

        Spacer(modifier = Modifier.height(20.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(16.dp))

        // 5. Permission Level Selection (خيارات تحديد مستويات الأذونات)
        Text(
          text = "مستوى الأذونات وصلاحيات الدخول 🛡️",
          fontSize = 15.sp,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
          text = "حدد من يمكنه دخول الغرفة وإرسال الرسائل والمشاركة:",
          fontSize = 12.sp,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Option 1: PUBLIC
        PermissionOptionCard(
          title = "عامة (Public) 🌐",
          description = "مفتوحة لجميع الأعضاء والزوار للدخول والكتابة بحرية كاملة دون أي قيود.",
          icon = Icons.Default.Public,
          iconColor = Color(0xFF10B981),
          isSelected = selectedPermission == RoomPermission.PUBLIC,
          onSelect = { selectedPermission = RoomPermission.PUBLIC },
          testTag = "permission_option_public"
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Option 2: PRIVATE
        PermissionOptionCard(
          title = "خاصة (Private) 🔒",
          description = "مقفلة للكتابة؛ المشاركة مقتصرة فقط على المالك، والأدمن، والمشرفين المعينين.",
          icon = Icons.Default.Lock,
          iconColor = RoleOwnerGold,
          isSelected = selectedPermission == RoomPermission.PRIVATE,
          onSelect = { selectedPermission = RoomPermission.PRIVATE },
          testTag = "permission_option_private"
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Option 3: APPROVAL_ONLY
        PermissionOptionCard(
          title = "بموافقة فقط (Approval Only) 🛡️",
          description = "تتطلب عضوية معتمدة من الإدارة لمنع الحسابات العشوائية والمكتومة من الإرسال.",
          icon = Icons.Default.Security,
          iconColor = RoleAdminPurple,
          isSelected = selectedPermission == RoomPermission.APPROVAL_ONLY,
          onSelect = { selectedPermission = RoomPermission.APPROVAL_ONLY },
          testTag = "permission_option_approval"
        )

        if (isEditMode) {
          Spacer(modifier = Modifier.height(16.dp))
          HorizontalDivider()
          Spacer(modifier = Modifier.height(14.dp))

          // 6. Pinned Announcement in Edit Mode
          Text(
            text = "الإعلان المثبت أعلى الغرفة 📢",
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
          )
          Spacer(modifier = Modifier.height(6.dp))
          OutlinedTextField(
            value = pinnedAnnouncement,
            onValueChange = { pinnedAnnouncement = it },
            placeholder = { Text("أدخل نص إعلان أو تنبيه إداري يظهر لجميع الحاضرين...") },
            modifier = Modifier
              .fillMaxWidth()
              .testTag("edit_pinned_announcement_input"),
            maxLines = 2,
            shape = RoundedCornerShape(12.dp)
          )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 7. Save / Create Button
        Button(
          onClick = {
            if (name.isNotBlank()) {
              if (isEditMode && roomToEdit != null) {
                viewModel.updateRoomDetails(
                  roomId = roomToEdit.id,
                  name = name.trim(),
                  description = description.trim(),
                  category = category,
                  permissionLevel = selectedPermission.key
                )
                if (pinnedAnnouncement.isNotBlank()) {
                  viewModel.setPinnedAnnouncement(roomToEdit.id, pinnedAnnouncement.trim())
                }
                onDismiss()
              } else {
                viewModel.createRoom(
                  name = name.trim(),
                  description = description.trim(),
                  category = category,
                  permissionLevel = selectedPermission.key
                ) { newId ->
                  onRoomCreated(newId)
                  onDismiss()
                }
              }
            }
          },
          enabled = name.isNotBlank(),
          modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .testTag("save_room_management_button"),
          shape = RoundedCornerShape(12.dp),
          colors = ButtonDefaults.buttonColors(
            containerColor = if (isEditMode) RoleOwnerGold else MaterialTheme.colorScheme.primary
          )
        ) {
          Text(
            text = if (isEditMode) "حفظ التعديلات والتحديث 💾" else "إنشاء الغرفة وحفظها 🚀",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = if (isEditMode) Color.Black else Color.White
          )
        }

        // 8. Delete Button (Owner Only in Edit Mode)
        if (isEditMode && isOwner && roomToEdit != null) {
          Spacer(modifier = Modifier.height(12.dp))
          OutlinedButton(
            onClick = { showDeleteConfirmation = true },
            modifier = Modifier
              .fillMaxWidth()
              .height(48.dp)
              .testTag("delete_room_dialog_button"),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = RoleBannedRed)
          ) {
            Icon(Icons.Default.DeleteForever, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("حذف هذه الغرفة نهائياً 🗑️", fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }

  // Delete Room Confirmation
  if (showDeleteConfirmation && roomToEdit != null) {
    AlertDialog(
      onDismissRequest = { showDeleteConfirmation = false },
      title = {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(Icons.Default.DeleteForever, contentDescription = null, tint = RoleBannedRed)
          Spacer(modifier = Modifier.width(8.dp))
          Text("تأكيد حذف الغرفة", fontWeight = FontWeight.Bold)
        }
      },
      text = {
        Text("هل أنت متأكد من رغبتك في حذف الغرفة \"${roomToEdit.name}\"؟ سيتم مسح الغرفة وسجل الرسائل بالكامل ولن تتمكن من استعادتها.")
      },
      confirmButton = {
        Button(
          onClick = {
            showDeleteConfirmation = false
            viewModel.deleteRoom(roomToEdit.id) {
              onRoomDeleted()
              onDismiss()
            }
          },
          colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
          modifier = Modifier.testTag("confirm_delete_room_final_button")
        ) {
          Text("نعم، احذف الغرفة")
        }
      },
      dismissButton = {
        TextButton(onClick = { showDeleteConfirmation = false }) {
          Text("إلغاء")
        }
      }
    )
  }
}

@Composable
private fun PermissionOptionCard(
  title: String,
  description: String,
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  iconColor: Color,
  isSelected: Boolean,
  onSelect: () -> Unit,
  testTag: String
) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = onSelect)
      .testTag(testTag),
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(
      containerColor = if (isSelected) iconColor.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
    ),
    border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, iconColor) else null
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(12.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      RadioButton(
        selected = isSelected,
        onClick = onSelect,
        colors = RadioButtonDefaults.colors(selectedColor = iconColor)
      )

      Spacer(modifier = Modifier.width(8.dp))

      Box(
        modifier = Modifier
          .size(36.dp)
          .clip(CircleShape)
          .background(iconColor.copy(alpha = 0.2f)),
        contentAlignment = Alignment.Center
      ) {
        Icon(
          imageVector = icon,
          contentDescription = null,
          tint = iconColor,
          modifier = Modifier.size(20.dp)
        )
      }

      Spacer(modifier = Modifier.width(12.dp))

      Column(modifier = Modifier.weight(1f)) {
        Text(
          text = title,
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurface
        )
        Text(
          text = description,
          fontSize = 11.sp,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
    }
  }
}
