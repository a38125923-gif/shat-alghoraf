package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.UserProfile
import com.example.data.model.UserRole
import com.example.ui.components.RoleBadge
import com.example.ui.theme.GoldenBadgeBg
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.HeaderNavy
import com.example.ui.theme.MicActiveBlue
import com.example.ui.theme.RoleOwnerGold

val AVATAR_OPTIONS = listOf(
  Pair("👑", "تاج المالك"),
  Pair("🦅", "الصقر"),
  Pair("🦁", "الأسد"),
  Pair("🐺", "الذئب"),
  Pair("💎", "الماس"),
  Pair("⚡", "البرق"),
  Pair("🌟", "النجم"),
  Pair("🌹", "الوردة"),
  Pair("🛡️", "الفارس"),
  Pair("🎮", "اللاعب"),
  Pair("🕊️", "السلام"),
  Pair("🔥", "الشعلة")
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun UserProfileDialog(
  profile: UserProfile,
  onDismiss: () -> Unit,
  onSave: (displayName: String, bio: String?, status: String, photoUrl: String?) -> Unit
) {
  val context = LocalContext.current
  var displayName by remember(profile.displayName) { mutableStateOf(profile.displayName) }
  var bio by remember(profile.bio) { mutableStateOf(profile.bio ?: "") }
  var status by remember(profile.status) { mutableStateOf(profile.status) }
  var selectedAvatar by remember(profile.photoUrl) { mutableStateOf(profile.photoUrl ?: "👑") }

  val isOwner = profile.globalRole == "owner"

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      modifier = Modifier
        .fillMaxWidth(0.92f)
        .padding(vertical = 20.dp)
        .testTag("user_profile_dialog"),
      shape = RoundedCornerShape(24.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp)
          .verticalScroll(rememberScrollState())
      ) {
        // Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
              imageVector = Icons.Default.Person,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = "الملف الشخصي والحساب",
              fontSize = 18.sp,
              fontWeight = FontWeight.Bold
            )
          }

          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "إغلاق")
          }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Avatar & Info Showcase Card
        Card(
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = if (isOwner) GoldenBadgeBg else Color(0xFFF1F5F9)),
          border = if (isOwner) androidx.compose.foundation.BorderStroke(1.5.dp, GoldenBorder) else null,
          modifier = Modifier.fillMaxWidth()
        ) {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
          ) {
            // Selected Avatar Display
            Box(
              modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .border(2.5.dp, if (isOwner) GoldenCrown else MicActiveBlue, CircleShape)
                .background(Color(0xFF0F172A)),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = selectedAvatar,
                fontSize = 34.sp
              )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
              text = displayName.ifBlank { "مستخدم جديد" },
              fontSize = 17.sp,
              fontWeight = FontWeight.Bold,
              color = Color(0xFF0F172A)
            )

            Spacer(modifier = Modifier.height(4.dp))

            RoleBadge(
              role = if (isOwner) UserRole.OWNER else UserRole.MEMBER,
              showLabel = true
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Email Display
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.Email, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = profile.email.ifBlank { "حساب غير محدد" },
                fontSize = 12.sp,
                color = Color(0xFF475569)
              )
            }

            // UID Copy Option
            Spacer(modifier = Modifier.height(4.dp))
            Row(
              verticalAlignment = Alignment.CenterVertically,
              modifier = Modifier.clickable {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                clipboard.setPrimaryClip(ClipData.newPlainText("UID", profile.userId))
                Toast.makeText(context, "تم نسخ المعرف (UID)", Toast.LENGTH_SHORT).show()
              }
            ) {
              Text(
                text = "معرف الحساب: ${profile.userId.take(8)}...",
                fontSize = 11.sp,
                color = Color(0xFF64748B)
              )
              Spacer(modifier = Modifier.width(4.dp))
              Icon(Icons.Default.ContentCopy, contentDescription = "نسخ", tint = Color(0xFF64748B), modifier = Modifier.size(12.dp))
            }
          }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 1. Choose Avatar (الصورة الرمزية)
        Text(
          text = "اختر صورتك الرمزية (الأفاتار) 🎭",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))

        FlowRow(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          AVATAR_OPTIONS.forEach { (emoji, label) ->
            val isSelected = selectedAvatar == emoji
            Box(
              modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(if (isSelected) MicActiveBlue.copy(alpha = 0.2f) else Color(0xFFF8FAFC))
                .border(
                  width = if (isSelected) 2.dp else 1.dp,
                  color = if (isSelected) MicActiveBlue else Color(0xFFE2E8F0),
                  shape = CircleShape
                )
                .clickable { selectedAvatar = emoji }
                .testTag("avatar_option_$emoji"),
              contentAlignment = Alignment.Center
            ) {
              Text(text = emoji, fontSize = 22.sp)
            }
          }
        }

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(14.dp))

        // 2. Display Name (اسم المستخدم)
        Text(
          text = "اسم المستخدم في الدردشة ✏️",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(6.dp))

        OutlinedTextField(
          value = displayName,
          onValueChange = { displayName = it },
          label = { Text("اسم العرض (مثل: الصقر 💎، الملك 👑)") },
          singleLine = true,
          modifier = Modifier
            .fillMaxWidth()
            .testTag("edit_display_name_input"),
          colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MicActiveBlue
          )
        )

        Spacer(modifier = Modifier.height(14.dp))

        // 3. Bio (الحالة أو النبذة)
        Text(
          text = "النبذة الشخصية أو الحالة 💬",
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(6.dp))

        OutlinedTextField(
          value = bio,
          onValueChange = { bio = it },
          label = { Text("اكتب نبذة أو حكمة أو اهتماماتك...") },
          maxLines = 2,
          modifier = Modifier
            .fillMaxWidth()
            .testTag("edit_bio_input")
        )

        Spacer(modifier = Modifier.height(14.dp))

        // 4. Status (الحالة الحالية)
        Text(
          text = "حالة التواجد:",
          fontSize = 13.sp,
          fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(6.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          listOf(
            Triple("online", "متصل 🟢", Color(0xFF10B981)),
            Triple("away", "بالخارج 🟡", Color(0xFFF59E0B)),
            Triple("offline", "مشغول 🔴", Color(0xFFEF4444))
          ).forEach { (key, label, color) ->
            FilterChip(
              selected = status == key,
              onClick = { status = key },
              label = { Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
              modifier = Modifier.weight(1f),
              colors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = color.copy(alpha = 0.2f),
                selectedLabelColor = color
              )
            )
          }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Action Buttons
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Button(
            onClick = {
              onSave(displayName.trim(), bio.trim().ifBlank { null }, status, selectedAvatar)
              onDismiss()
            },
            enabled = displayName.isNotBlank(),
            modifier = Modifier
              .weight(1f)
              .testTag("save_profile_button"),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
          ) {
            Text("حفظ التعديلات في الحساب 💾", fontWeight = FontWeight.Bold, fontSize = 13.sp)
          }

          TextButton(onClick = onDismiss) {
            Text("إلغاء")
          }
        }
      }
    }
  }
}
