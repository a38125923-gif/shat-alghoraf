package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.UserProfile
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.HeaderNavy
import com.example.ui.theme.HeaderNavyDark
import com.example.ui.theme.MicActiveBlue
import com.example.ui.theme.NavItemSelected
import com.example.ui.theme.NavItemUnselected

@Composable
fun ArabicChatHeader(
  userProfile: UserProfile?,
  onMenuClick: () -> Unit,
  onVipClick: () -> Unit,
  onTopUsersClick: () -> Unit,
  onMessagesClick: () -> Unit,
  onRequestClick: () -> Unit,
  onNotificationClick: () -> Unit,
  onProfileClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  Surface(
    modifier = modifier
      .fillMaxWidth()
      .testTag("arabic_chat_header"),
    color = HeaderNavy,
    shadowElevation = 6.dp
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 8.dp, vertical = 6.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      // Menu Icon ☰
      HeaderActionItem(
        icon = Icons.Default.Menu,
        label = "القائمة",
        tint = Color(0xFF10B981),
        onClick = onMenuClick,
        testTag = "header_menu_button"
      )

      // الكبار 💎
      HeaderActionItem(
        icon = Icons.Default.Star,
        label = "الكبار",
        tint = Color(0xFFF97316),
        onClick = onVipClick,
        testTag = "header_vips_button"
      )

      // الاثرياء 👑
      HeaderActionItem(
        icon = Icons.Default.Star,
        label = "الاثرياء",
        tint = GoldenCrown,
        onClick = onTopUsersClick,
        testTag = "header_wealthy_button"
      )

      // رسالة ✉️
      HeaderActionItem(
        icon = Icons.Default.Email,
        label = "رسالة",
        tint = Color(0xFF60A5FA),
        onClick = onMessagesClick,
        testTag = "header_messages_button"
      )

      // طلب 👤+
      HeaderActionItem(
        icon = Icons.Default.PersonAdd,
        label = "طلب",
        tint = Color(0xFF38BDF8),
        onClick = onRequestClick,
        testTag = "header_requests_button"
      )

      // اشعار 🔔
      HeaderActionItem(
        icon = Icons.Default.Notifications,
        label = "اشعار",
        tint = GoldenCrown,
        onClick = onNotificationClick,
        testTag = "header_notifications_button"
      )

      // User Profile Avatar with green checkmark
      Box(
        modifier = Modifier
          .clickable(onClick = onProfileClick)
          .padding(4.dp)
          .testTag("header_user_avatar")
      ) {
        val name = userProfile?.displayName ?: "مستخدم"
        Box(
          modifier = Modifier
            .size(38.dp)
            .clip(CircleShape)
            .border(2.dp, GoldenCrown, CircleShape)
            .background(Color(0xFF1E293B)),
          contentAlignment = Alignment.Center
        ) {
          Text(
            text = name.take(1).uppercase(),
            color = GoldenCrown,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp
          )
        }

        // Green verified checkmark badge
        Icon(
          imageVector = Icons.Default.CheckCircle,
          contentDescription = "متصل",
          tint = Color(0xFF22C55E),
          modifier = Modifier
            .size(14.dp)
            .align(Alignment.BottomEnd)
            .background(Color.White, CircleShape)
        )
      }
    }
  }
}

@Composable
private fun HeaderActionItem(
  icon: ImageVector,
  label: String,
  tint: Color,
  onClick: () -> Unit,
  testTag: String
) {
  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = Modifier
      .clickable(onClick = onClick)
      .padding(horizontal = 4.dp, vertical = 2.dp)
      .testTag(testTag)
  ) {
    Icon(
      imageVector = icon,
      contentDescription = label,
      tint = tint,
      modifier = Modifier.size(20.dp)
    )
    Spacer(modifier = Modifier.height(2.dp))
    Text(
      text = label,
      color = Color.White,
      fontSize = 10.sp,
      fontWeight = FontWeight.Medium
    )
  }
}

@Composable
fun MicsStageBar(
  activeSpeakers: List<String> = emptyList(),
  onMicSeatClick: (Int) -> Unit,
  modifier: Modifier = Modifier
) {
  var isExpanded by remember { mutableStateOf(true) }

  Column(
    modifier = modifier
      .fillMaxWidth()
      .padding(horizontal = 8.dp, vertical = 4.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    AnimatedVisibility(visible = isExpanded) {
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(24.dp))
          .background(
            Brush.verticalGradient(
              listOf(Color(0xFF1E3A8A).copy(alpha = 0.9f), Color(0xFF0F172A).copy(alpha = 0.95f))
            )
          )
          .border(1.5.dp, Color(0xFF3B82F6), RoundedCornerShape(24.dp))
          .padding(vertical = 8.dp, horizontal = 12.dp)
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceEvenly,
          verticalAlignment = Alignment.CenterVertically
        ) {
          for (slot in 1..5) {
            val isOccupied = activeSpeakers.size >= slot
            MicSeatItem(
              slotNumber = slot,
              isOccupied = isOccupied,
              speakerName = if (isOccupied) activeSpeakers[slot - 1] else null,
              onClick = { onMicSeatClick(slot) }
            )
          }
        }
      }
    }

    // Toggle expand pill
    Box(
      modifier = Modifier
        .clip(RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp))
        .background(MicActiveBlue)
        .clickable { isExpanded = !isExpanded }
        .padding(horizontal = 14.dp, vertical = 2.dp)
    ) {
      Icon(
        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
        contentDescription = "المايكات",
        tint = Color.White,
        modifier = Modifier.size(16.dp)
      )
    }
  }
}

@Composable
private fun MicSeatItem(
  slotNumber: Int,
  isOccupied: Boolean,
  speakerName: String?,
  onClick: () -> Unit
) {
  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = Modifier
      .clickable(onClick = onClick)
      .testTag("mic_seat_$slotNumber")
  ) {
    Box(
      modifier = Modifier
        .size(46.dp)
        .clip(CircleShape)
        .background(if (isOccupied) Color(0xFF10B981) else MicActiveBlue)
        .border(2.dp, if (isOccupied) GoldenCrown else Color(0xFF93C5FD), CircleShape),
      contentAlignment = Alignment.Center
    ) {
      Icon(
        imageVector = Icons.Default.Mic,
        contentDescription = "مايك $slotNumber",
        tint = Color.White,
        modifier = Modifier.size(22.dp)
      )
    }
    Spacer(modifier = Modifier.height(2.dp))
    Text(
      text = speakerName?.take(6) ?: "$slotNumber",
      color = Color.White,
      fontSize = 11.sp,
      fontWeight = FontWeight.Bold
    )
  }
}

@Composable
fun ArabicChatBottomBar(
  currentTab: String,
  onTabSelected: (String) -> Unit,
  isRadioPlaying: Boolean,
  onToggleRadio: () -> Unit,
  onRefresh: () -> Unit,
  modifier: Modifier = Modifier
) {
  Surface(
    modifier = modifier
      .fillMaxWidth()
      .testTag("arabic_chat_bottom_bar"),
    color = HeaderNavy,
    shadowElevation = 10.dp
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 12.dp, vertical = 6.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      // 1. Radio (▶ الراديو)
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
          .clickable(onClick = onToggleRadio)
          .padding(horizontal = 6.dp)
          .testTag("nav_radio_button")
      ) {
        Box(
          modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .background(if (isRadioPlaying) Color(0xFF22C55E) else Color(0xFF1E293B)),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = if (isRadioPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
            contentDescription = "الراديو",
            tint = if (isRadioPlaying) Color.White else Color(0xFF22C55E),
            modifier = Modifier.size(20.dp)
          )
        }
        Text(
          text = if (isRadioPlaying) "يعمل" else "الراديو",
          fontSize = 10.sp,
          color = Color.White
        )
      }

      // 2. Refresh (🔄 تحديث)
      BottomNavItem(
        icon = Icons.Default.Refresh,
        label = "تحديث",
        isSelected = false,
        onClick = onRefresh,
        testTag = "nav_refresh_button"
      )

      // 3. Rooms (🏠 الغرف)
      BottomNavItem(
        icon = Icons.Default.Home,
        label = "الغرف",
        isSelected = currentTab == "rooms",
        onClick = { onTabSelected("rooms") },
        testTag = "nav_rooms_button"
      )

      // 4. Online (👥 متواجدين)
      BottomNavItem(
        icon = Icons.Default.Group,
        label = "متواجدين",
        isSelected = currentTab == "online",
        onClick = { onTabSelected("online") },
        testTag = "nav_online_button"
      )

      // 5. Settings / Control (⚙️ الخيارات)
      BottomNavItem(
        icon = Icons.Default.Settings,
        label = "الخيارات",
        isSelected = currentTab == "options",
        onClick = { onTabSelected("options") },
        testTag = "nav_options_button"
      )
    }
  }
}

@Composable
private fun BottomNavItem(
  icon: ImageVector,
  label: String,
  isSelected: Boolean,
  onClick: () -> Unit,
  testTag: String
) {
  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = Modifier
      .clickable(onClick = onClick)
      .padding(horizontal = 8.dp, vertical = 2.dp)
      .testTag(testTag)
  ) {
    Icon(
      imageVector = icon,
      contentDescription = label,
      tint = if (isSelected) NavItemSelected else NavItemUnselected,
      modifier = Modifier.size(24.dp)
    )
    Spacer(modifier = Modifier.height(2.dp))
    Text(
      text = label,
      color = if (isSelected) NavItemSelected else NavItemUnselected,
      fontSize = 11.sp,
      fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
    )
  }
}
