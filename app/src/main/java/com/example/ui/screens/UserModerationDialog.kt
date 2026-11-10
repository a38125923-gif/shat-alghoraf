package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.example.data.model.ChatMessage
import com.example.data.model.ModeratorPermissionFlag
import com.example.data.model.Room
import com.example.data.model.UserRole
import com.example.ui.components.RoleBadge
import com.example.ui.theme.GoldenBadgeBg
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.HeaderNavy
import com.example.ui.theme.MicActiveBlue
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.viewmodel.ChatViewModel

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun UserModerationDialog(
  targetUid: String,
  targetName: String,
  targetRole: UserRole,
  room: Room,
  message: ChatMessage? = null,
  viewModel: ChatViewModel,
  onDismiss: () -> Unit
) {
  val currentUid = viewModel.currentUserId
  val isOwner = room.isOwner(currentUid)
  val isModerator = room.isModerator(currentUid)
  val isTargetOwner = targetUid == room.ownerId
  val isTargetModerator = targetRole == UserRole.MODERATOR

  // Ban Form State
  var banScopeGlobal by remember { mutableStateOf(false) } // false = room ban, true = global app ban
  var selectedDurationMinutes by remember { mutableIntStateOf(60) } // Default 1 hour
  var isPermanent by remember { mutableStateOf(false) }
  var banReason by remember { mutableStateOf("مخالفة قوانين الدردشة والآداب العامة") }

  val durations = listOf(
    Pair("15 دقيقة", 15),
    Pair("ساعة واحدة", 60),
    Pair("24 ساعة", 1440),
    Pair("7 أيام", 10080)
  )

  val quickReasons = listOf(
    "ألفاظ غير لائقة ومسيئة",
    "سبام وإعلانات مزعجة",
    "مضايقة واستفزاز الأعضاء",
    "مخالفة تعليمات الإدارة"
  )

  AlertDialog(
    onDismissRequest = onDismiss,
    modifier = Modifier
      .fillMaxWidth()
      .testTag("user_moderation_dialog"),
    title = {
      Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(
            imageVector = Icons.Default.Shield,
            contentDescription = null,
            tint = RoleModeratorBlue,
            modifier = Modifier.size(24.dp)
          )
          Spacer(modifier = Modifier.width(8.dp))
          Text(
            text = "إدارة المستخدم والإشراف 🛡️",
            fontWeight = FontWeight.Bold,
            fontSize = 17.sp
          )
        }
        IconButton(onClick = onDismiss) {
          Icon(Icons.Default.Close, contentDescription = "إغلاق")
        }
      }
    },
    text = {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .verticalScroll(rememberScrollState())
      ) {
        // 1. Target User Card
        Card(
          shape = RoundedCornerShape(12.dp),
          colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
          modifier = Modifier.fillMaxWidth()
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            Box(
              modifier = Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(
                  when (targetRole) {
                    UserRole.OWNER -> GoldenCrown
                    UserRole.MODERATOR -> RoleModeratorBlue
                    else -> HeaderNavy
                  }
                ),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = targetName.take(1).uppercase(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
              )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
              Text(
                text = targetName,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Color(0xFF0F172A)
              )
              Spacer(modifier = Modifier.height(4.dp))
              RoleBadge(role = targetRole, showLabel = true)
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // 2. Message Actions (If invoked from a chat message)
        if (message != null) {
          Card(
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
            modifier = Modifier.fillMaxWidth()
          ) {
            Column(modifier = Modifier.padding(10.dp)) {
              Text(
                text = "الرسالة المحددة:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = RoleBannedRed
              )
              Spacer(modifier = Modifier.height(2.dp))
              Text(
                text = "\"${message.content}\"",
                fontSize = 13.sp,
                color = Color(0xFF7F1D1D)
              )
              Spacer(modifier = Modifier.height(8.dp))
              Button(
                onClick = {
                  viewModel.deleteMessage(message.id)
                  onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
                modifier = Modifier
                  .fillMaxWidth()
                  .testTag("moderation_delete_message_button")
              ) {
                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("حذف هذه الرسالة غير اللائقة 🗑️", fontSize = 12.sp, fontWeight = FontWeight.Bold)
              }
            }
          }
          Spacer(modifier = Modifier.height(12.dp))
        }

        // 3. Owner Master Control: Promote or Demote Moderator
        if (isOwner && !isTargetOwner) {
          Text(
            text = "صلاحيات المالك: ترقية وتعيين المشرفين 👑",
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            color = Color(0xFFB45309)
          )
          Spacer(modifier = Modifier.height(6.dp))

          if (isTargetModerator) {
            OutlinedButton(
              onClick = {
                viewModel.demoteModerator(room.id, targetUid, targetName)
                onDismiss()
              },
              modifier = Modifier
                .fillMaxWidth()
                .testTag("demote_moderator_button")
            ) {
              Text("سحب رتبة المشرف وإعادته كمستخدم عادي ⬇️", color = RoleBannedRed, fontSize = 12.sp)
            }
          } else {
            Button(
              onClick = {
                viewModel.promoteToModerator(room.id, targetUid, targetName)
                onDismiss()
              },
              colors = ButtonDefaults.buttonColors(containerColor = RoleModeratorBlue),
              modifier = Modifier
                .fillMaxWidth()
                .testTag("promote_moderator_button")
            ) {
              Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(16.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text("ترقية المستخدم إلى مشرف الغرفة ⚔️", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
          }

          Spacer(modifier = Modifier.height(12.dp))
        }

        // 4. Mute Action (كتم صوت المستخدم)
        if ((isOwner || isModerator) && !isTargetOwner) {
          val isMuted = room.mutedUsers.contains(targetUid)
          Button(
            onClick = {
              viewModel.muteUser(room.id, targetUid, targetName, !isMuted)
              onDismiss()
            },
            colors = ButtonDefaults.buttonColors(
              containerColor = if (isMuted) Color(0xFF10B981) else RoleMutedAmber
            ),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("moderation_mute_button")
          ) {
            Icon(Icons.Default.MicOff, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
              text = if (isMuted) "إلغاء كتم الصوت 🔊" else "كتم المستخدم في هذه الغرفة 🔇",
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
              color = if (isMuted) Color.White else Color.Black
            )
          }

          Spacer(modifier = Modifier.height(12.dp))
        }

        // 5. Ban Action Section (حظر المستخدم مؤقت أو دائم)
        if ((isOwner || isModerator) && !isTargetOwner) {
          HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

          Text(
            text = "حظر المستخدم (مؤقت أو دائم) 🚫",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = RoleBannedRed
          )
          Spacer(modifier = Modifier.height(8.dp))

          // Scope: Room vs Global (Global is for Owner or Admin)
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            FilterChip(
              selected = !banScopeGlobal,
              onClick = { banScopeGlobal = false },
              label = { Text("حظر من الغرفة 🏠", fontSize = 11.sp) },
              modifier = Modifier.weight(1f)
            )
            FilterChip(
              selected = banScopeGlobal,
              onClick = { banScopeGlobal = true },
              label = { Text("حظر عام من التطبيق 🌐", fontSize = 11.sp) },
              modifier = Modifier.weight(1f)
            )
          }

          Spacer(modifier = Modifier.height(8.dp))

          // Duration: Temporary vs Permanent
          Text("مدة الحظر:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
          Spacer(modifier = Modifier.height(4.dp))

          FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            durations.forEach { (label, mins) ->
              FilterChip(
                selected = !isPermanent && selectedDurationMinutes == mins,
                onClick = {
                  isPermanent = false
                  selectedDurationMinutes = mins
                },
                label = { Text(label, fontSize = 11.sp) }
              )
            }
            FilterChip(
              selected = isPermanent,
              onClick = { isPermanent = true },
              label = { Text("دائم (مدى الحياة) ♾️", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
              colors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = RoleBannedRed,
                selectedLabelColor = Color.White
              )
            )
          }

          Spacer(modifier = Modifier.height(8.dp))

          // Reason selector
          Text("سبب الحظر:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
          Spacer(modifier = Modifier.height(4.dp))

          FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
          ) {
            quickReasons.forEach { reasonItem ->
              FilterChip(
                selected = banReason == reasonItem,
                onClick = { banReason = reasonItem },
                label = { Text(reasonItem, fontSize = 10.sp) }
              )
            }
          }

          Spacer(modifier = Modifier.height(6.dp))

          OutlinedTextField(
            value = banReason,
            onValueChange = { banReason = it },
            label = { Text("أو اكتب سبب الحظر بالتفصيل", fontSize = 11.sp) },
            singleLine = true,
            modifier = Modifier
              .fillMaxWidth()
              .testTag("ban_reason_input"),
            colors = OutlinedTextFieldDefaults.colors(
              focusedBorderColor = RoleBannedRed
            )
          )

          Spacer(modifier = Modifier.height(10.dp))

          // Confirm Ban Button
          Button(
            onClick = {
              viewModel.banUser(
                roomId = if (banScopeGlobal) null else room.id,
                roomName = if (banScopeGlobal) null else room.name,
                targetUid = targetUid,
                targetName = targetName,
                reason = banReason,
                isPermanent = isPermanent,
                durationMinutes = selectedDurationMinutes,
                isGlobal = banScopeGlobal
              )
              onDismiss()
            },
            colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("confirm_ban_button")
          ) {
            Icon(Icons.Default.Block, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            val scopeAr = if (banScopeGlobal) "العام من التطبيق" else "من الغرفة"
            val durAr = if (isPermanent) "الدائم" else "المؤقت"
            Text(
              text = "تأكيد الحظر $durAr ($scopeAr) 🚫",
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold
            )
          }
        }
      }
    },
    confirmButton = {},
    dismissButton = {
      TextButton(onClick = onDismiss) {
        Text("إلغاء")
      }
    }
  )
}
