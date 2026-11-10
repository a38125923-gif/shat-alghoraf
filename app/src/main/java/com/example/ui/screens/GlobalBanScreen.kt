package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.BanRecord
import com.example.ui.theme.RoleBannedRed

@Composable
fun GlobalBanScreen(
  banRecord: BanRecord,
  onSignOut: () -> Unit
) {
  Surface(
    modifier = Modifier
      .fillMaxSize()
      .testTag("global_ban_screen"),
    color = Color(0xFF0F172A)
  ) {
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(24.dp),
      contentAlignment = Alignment.Center
    ) {
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
          containerColor = Color(0xFF1E293B)
        ),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, RoleBannedRed)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          // Warning Icon
          Box(
            modifier = Modifier
              .size(72.dp)
              .clip(CircleShape)
              .background(RoleBannedRed.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              imageVector = Icons.Default.Block,
              contentDescription = null,
              tint = RoleBannedRed,
              modifier = Modifier.size(44.dp)
            )
          }

          Spacer(modifier = Modifier.height(16.dp))

          Text(
            text = "تم حظر حسابك من التطبيق 🚫",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            textAlign = TextAlign.Center
          )

          Spacer(modifier = Modifier.height(8.dp))

          Text(
            text = "تم اتخاذ إجراء إداري بحق حسابك نظراً لانتهاك قوانين وسياسات الاستخدام والآداب العامة.",
            fontSize = 13.sp,
            color = Color(0xFF94A3B8),
            textAlign = TextAlign.Center,
            lineHeight = 18.sp
          )

          Spacer(modifier = Modifier.height(20.dp))

          // Ban Details Card
          Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
          ) {
            Column(
              modifier = Modifier.padding(16.dp)
            ) {
              // Reason
              Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                  imageVector = Icons.Default.Info,
                  contentDescription = null,
                  tint = RoleBannedRed,
                  modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                  text = "سبب الحظر:",
                  fontWeight = FontWeight.Bold,
                  fontSize = 12.sp,
                  color = Color(0xFFE2E8F0)
                )
              }
              Spacer(modifier = Modifier.height(4.dp))
              Text(
                text = banRecord.reason.ifBlank { "مخالفة الشروط والآداب العامة" },
                fontSize = 13.sp,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
              )

              Spacer(modifier = Modifier.height(12.dp))

              // Duration
              Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                  imageVector = Icons.Default.Timer,
                  contentDescription = null,
                  tint = Color(0xFFF59E0B),
                  modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                  text = "مدة الحظر:",
                  fontWeight = FontWeight.Bold,
                  fontSize = 12.sp,
                  color = Color(0xFFE2E8F0)
                )
              }
              Spacer(modifier = Modifier.height(4.dp))
              Text(
                text = banRecord.getRemainingTimeAr(),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = if (banRecord.isPermanent) RoleBannedRed else Color(0xFFF59E0B)
              )

              if (banRecord.bannedByName.isNotBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                  text = "المسؤول عن الإجراء: ${banRecord.bannedByName}",
                  fontSize = 11.sp,
                  color = Color(0xFF64748B)
                )
              }
            }
          }

          Spacer(modifier = Modifier.height(24.dp))

          Button(
            onClick = onSignOut,
            colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
            modifier = Modifier
              .fillMaxWidth()
              .testTag("banned_sign_out_button"),
            shape = RoundedCornerShape(12.dp)
          ) {
            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("تسجيل الخروج", fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }
}
