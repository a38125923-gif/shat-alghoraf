package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.UserRole
import com.example.ui.theme.RoleAdminBg
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleMemberBg
import com.example.ui.theme.RoleMemberGreen
import com.example.ui.theme.RoleModeratorBg
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.theme.RoleOwnerBg
import com.example.ui.theme.RoleOwnerGold

@Composable
fun RoleBadge(
  role: UserRole,
  modifier: Modifier = Modifier,
  showLabel: Boolean = true
) {
  val (bgColor, fgColor, icon, label) = when (role) {
    UserRole.OWNER -> Quad(RoleOwnerBg, RoleOwnerGold, Icons.Default.Star, "مالك 👑")
    UserRole.ADMIN -> Quad(RoleAdminBg, RoleAdminPurple, Icons.Default.Shield, "أدمن 🛡️")
    UserRole.MODERATOR -> Quad(RoleModeratorBg, RoleModeratorBlue, Icons.Default.Security, "مشرف ⚔️")
    UserRole.MEMBER -> Quad(RoleMemberBg, RoleMemberGreen, Icons.Default.Person, "عضو")
    UserRole.MUTED -> Quad(Color(0xFF332000), RoleMutedAmber, Icons.Default.MicOff, "مكتوم 🔇")
    UserRole.BANNED -> Quad(Color(0xFF3B0000), RoleBannedRed, Icons.Default.Block, "محظور 🚫")
  }

  Surface(
    modifier = modifier.testTag("role_badge_${role.name.lowercase()}"),
    shape = RoundedCornerShape(12.dp),
    color = bgColor,
    border = androidx.compose.foundation.BorderStroke(1.dp, fgColor.copy(alpha = 0.5f))
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      Icon(
        imageVector = icon,
        contentDescription = label,
        tint = fgColor,
        modifier = Modifier.size(14.dp)
      )
      if (showLabel) {
        Spacer(modifier = Modifier.width(4.dp))
        Text(
          text = label,
          color = fgColor,
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold
        )
      }
    }
  }
}

private data class Quad(val bg: Color, val fg: Color, val icon: ImageVector, val label: String)

@Composable
fun UserAvatar(
  name: String,
  modifier: Modifier = Modifier,
  size: Dp = 40.dp,
  role: UserRole? = null,
  photoUrl: String? = null
) {
  val displayText = if (!photoUrl.isNullOrBlank()) photoUrl else name.trim().take(1).uppercase().ifBlank { "م" }
  val avatarBg = when (role) {
    UserRole.OWNER -> RoleOwnerGold
    UserRole.ADMIN -> RoleAdminPurple
    UserRole.MODERATOR -> RoleModeratorBlue
    else -> MaterialTheme.colorScheme.primary
  }

  Box(
    modifier = modifier
      .size(size)
      .clip(CircleShape)
      .background(avatarBg),
    contentAlignment = Alignment.Center
  ) {
    Text(
      text = displayText,
      color = Color.White,
      fontSize = (size.value * 0.45).sp,
      fontWeight = FontWeight.Bold
    )
  }
}

@Composable
fun StatusDot(
  status: String,
  modifier: Modifier = Modifier
) {
  val color = when (status) {
    "online" -> Color(0xFF22C55E)
    "away" -> Color(0xFFF59E0B)
    else -> Color(0xFF94A3B8)
  }
  Box(
    modifier = modifier
      .size(10.dp)
      .clip(CircleShape)
      .background(color)
      .border(1.5.dp, MaterialTheme.colorScheme.surface, CircleShape)
  )
}

@Composable
fun CategoryFilterChip(
  category: String,
  selected: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  FilterChip(
    selected = selected,
    onClick = onClick,
    label = {
      Text(
        text = category,
        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
      )
    },
    modifier = modifier.testTag("filter_chip_$category"),
    colors = FilterChipDefaults.filterChipColors(
      selectedContainerColor = MaterialTheme.colorScheme.primary,
      selectedLabelColor = MaterialTheme.colorScheme.onPrimary
    )
  )
}
