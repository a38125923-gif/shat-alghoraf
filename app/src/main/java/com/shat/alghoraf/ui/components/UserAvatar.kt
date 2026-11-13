package com.shat.alghoraf.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.ui.theme.AdminPurple
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.ModeratorBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.TextMuted
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun UserAvatar(
    avatarOrUrl: String?,
    fallbackEmoji: String = "💎",
    size: Dp = 42.dp,
    showOnlineDot: Boolean = false,
    isOnline: Boolean = false,
    borderColor: Color = RoyalGold.copy(alpha = 0.45f),
    modifier: Modifier = Modifier
) {
    val isUrl = !avatarOrUrl.isNullOrBlank() &&
        (avatarOrUrl.startsWith("http://") || avatarOrUrl.startsWith("https://"))

    Box(modifier = modifier.size(size)) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(CardSlate)
                .border(1.5.dp, borderColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (isUrl) {
                AsyncImage(
                    model = avatarOrUrl,
                    contentDescription = "صورة العضو",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                val emoji = avatarOrUrl?.takeIf { it.isNotBlank() } ?: fallbackEmoji
                Text(
                    text = emoji,
                    fontSize = (size.value * 0.46f).sp
                )
            }
        }

        if (showOnlineDot) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size((size.value * 0.28f).coerceAtLeast(10f).dp)
                    .clip(CircleShape)
                    .background(if (isOnline) EmeraldOnline else TextMuted)
                    .border(2.dp, DeepSlate, CircleShape)
            )
        }
    }
}

@Composable
fun RoleBadge(role: UserRole) {
    val (bgColor, textColor, borderColor) = when (role) {
        UserRole.OWNER -> Triple(RoyalGold.copy(alpha = 0.18f), BrightGold, RoyalGold.copy(alpha = 0.5f))
        UserRole.ADMIN -> Triple(AdminPurple.copy(alpha = 0.18f), AdminPurple, AdminPurple.copy(alpha = 0.5f))
        UserRole.MODERATOR -> Triple(ModeratorBlue.copy(alpha = 0.18f), ModeratorBlue, ModeratorBlue.copy(alpha = 0.5f))
        UserRole.MEMBER -> Triple(EmeraldOnline.copy(alpha = 0.15f), EmeraldOnline, EmeraldOnline.copy(alpha = 0.45f))
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(50),
        border = BorderStroke(1.dp, borderColor)
    ) {
        Text(
            text = "${role.badgeEmoji} ${role.arabicLabel}",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
        )
    }
}

fun formatArabicTime(timestamp: Timestamp?): String {
    val date = timestamp?.toDate() ?: return "الآن"
    return try {
        val fmt = SimpleDateFormat("hh:mm a", Locale("ar"))
        fmt.format(date)
    } catch (_: Exception) {
        "الآن"
    }
}
