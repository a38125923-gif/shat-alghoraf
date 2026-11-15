package com.shat.alghoraf.ui.components

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Chat
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Diamond
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Flag
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.MeetingRoom
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MicOff
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.PersonAdd
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.data.model.AvatarFrame
import com.shat.alghoraf.data.model.BottomNavTab
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.NameplateStyle
import com.shat.alghoraf.data.model.VoiceMicSlot
import com.shat.alghoraf.ui.theme.CodyColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun rememberUriImageBitmap(uriString: String): ImageBitmap? {
    val context = LocalContext.current
    val bitmap by produceState<ImageBitmap?>(initialValue = null, key1 = uriString) {
        if (uriString.isBlank()) {
            value = null
            return@produceState
        }
        value = withContext(Dispatchers.IO) {
            runCatching {
                if (uriString.startsWith("http://") || uriString.startsWith("https://")) {
                    java.net.URL(uriString).openStream().use { stream ->
                        val bytes = stream.readBytes()
                        val optsBounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, optsBounds)
                        var sample = 1
                        val maxDim = maxOf(optsBounds.outWidth, optsBounds.outHeight)
                        while (maxDim / sample > 512) {
                            sample *= 2
                        }
                        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
                        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, opts)?.asImageBitmap()
                    }
                } else {
                    val uri = Uri.parse(uriString)
                    val optsBounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    context.contentResolver.openInputStream(uri)?.use {
                        BitmapFactory.decodeStream(it, null, optsBounds)
                    }
                    var sample = 1
                    val maxDim = maxOf(optsBounds.outWidth, optsBounds.outHeight)
                    while (maxDim / sample > 512) {
                        sample *= 2
                    }
                    val opts = BitmapFactory.Options().apply { inSampleSize = sample }
                    context.contentResolver.openInputStream(uri)?.use {
                        BitmapFactory.decodeStream(it, null, opts)?.asImageBitmap()
                    }
                }
            }.getOrNull()
        }
    }
    return bitmap
}

@Composable
fun UserAvatarBadge(
    avatarUri: String,
    emoji: String,
    frame: AvatarFrame,
    size: Dp = 44.dp,
    showOnlineDot: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    val bitmap = rememberUriImageBitmap(avatarUri)
    val frameBrush = Brush.linearGradient(frame.borderColors)

    Box(
        modifier = Modifier
            .size(size)
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .border(
                    width = if (frame == AvatarFrame.NONE) 1.5.dp else 2.8.dp,
                    brush = frameBrush,
                    shape = CircleShape
                )
                .padding(3.dp)
                .clip(CircleShape)
                .background(Color(0xFFE0E7FF)),
            contentAlignment = Alignment.Center
        ) {
            if (bitmap != null) {
                Image(
                    bitmap = bitmap,
                    contentDescription = "صورة المستخدم",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    text = emoji.ifBlank { "😎" },
                    fontSize = (size.value * 0.44f).sp
                )
            }
        }
        if (showOnlineDot) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .align(Alignment.BottomEnd)
                    .offset(x = (-1).dp, y = (-1).dp)
                    .clip(CircleShape)
                    .background(CodyColors.OnlineGreen)
                    .border(2.dp, Color.White, CircleShape)
            )
        }
    }
}

@Composable
fun RankPillBadge(rank: ChatRank) {
    Surface(
        shape = RoundedCornerShape(50),
        color = rank.badgeBg
    ) {
        Text(
            text = "${rank.icon} ${rank.arabicLabel}",
            color = rank.badgeText,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun DecoratedNameplate(name: String, style: NameplateStyle) {
    if (style == NameplateStyle.DEFAULT) {
        Text(
            text = name,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = CodyColors.TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    } else {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = style.bgColor
        ) {
            Text(
                text = name,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.ExtraBold,
                color = style.textColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
            )
        }
    }
}

@Composable
fun CodyTopBar(
    currentUser: ChatUser,
    unreadNotifications: Int,
    onOpenDrawer: () -> Unit,
    onOpenUpgradeGuest: () -> Unit,
    onOpenProfileEdit: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenWallet: () -> Unit,
    onOpenRoomOptions: () -> Unit,
    onOpenControlPanel: () -> Unit,
    onLeaveRoom: () -> Unit,
    onLogout: () -> Unit,
    onOpenReport: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenRequests: () -> Unit,
    onOpenPrivateMessages: () -> Unit,
    onOpenRichLeaderboard: () -> Unit,
    onOpenKibarLeaderboard: () -> Unit
) {
    var profileMenuExpanded by remember { mutableStateOf(false) }

    Surface(
        color = CodyColors.RoyalBlue,
        shadowElevation = 6.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.statusBars)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Right (start in RTL): Profile Avatar + White Dropdown
                Box {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("profile_menu_trigger"),
                        contentAlignment = Alignment.Center
                    ) {
                        UserAvatarBadge(
                            avatarUri = currentUser.avatarUri,
                            emoji = currentUser.avatarEmoji,
                            frame = currentUser.avatarFrame,
                            size = 42.dp,
                            showOnlineDot = true,
                            onClick = { profileMenuExpanded = true }
                        )
                    }

                    DropdownMenu(
                        expanded = profileMenuExpanded,
                        onDismissRequest = { profileMenuExpanded = false },
                        modifier = Modifier.width(240.dp).background(Color.White)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            UserAvatarBadge(
                                avatarUri = currentUser.avatarUri,
                                emoji = currentUser.avatarEmoji,
                                frame = currentUser.avatarFrame,
                                size = 54.dp,
                                showOnlineDot = true
                            )
                            Spacer(Modifier.height(6.dp))
                            RankPillBadge(currentUser.rank)
                            Spacer(Modifier.height(4.dp))
                            DecoratedNameplate(currentUser.displayName, currentUser.nameplateStyle)
                            Text(
                                text = "🪙 ${currentUser.coins} نقطة",
                                style = MaterialTheme.typography.labelMedium,
                                color = Color(0xFFB45309)
                            )
                        }
                        HorizontalDivider()
                        if (currentUser.rank == ChatRank.GUEST) {
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        "👤+ تسجيل عضوية",
                                        color = Color(0xFF92400E),
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                },
                                onClick = { profileMenuExpanded = false; onOpenUpgradeGuest() },
                                modifier = Modifier.background(Color(0xFFFEF3C7)).testTag("drop_upgrade_guest_btn")
                            )
                        }
                        DropdownMenuItem(
                            text = { Text("✏️ تحرير الملف الشخصي") },
                            onClick = { profileMenuExpanded = false; onOpenProfileEdit() }
                        )
                        DropdownMenuItem(
                            text = { Text("🎨 إعدادات الدردشة") },
                            onClick = { profileMenuExpanded = false; onOpenSettings() }
                        )
                        DropdownMenuItem(
                            text = { Text("💰 محفظة") },
                            onClick = { profileMenuExpanded = false; onOpenWallet() }
                        )
                        DropdownMenuItem(
                            text = { Text("🏠 خيارات الغرفة") },
                            onClick = { profileMenuExpanded = false; onOpenRoomOptions() }
                        )
                        if (currentUser.rank.isStaff) {
                            DropdownMenuItem(
                                text = { Text("⚙️ لوحة التحكم", color = CodyColors.RoyalBlue, fontWeight = FontWeight.Bold) },
                                onClick = { profileMenuExpanded = false; onOpenControlPanel() }
                            )
                        }
                        HorizontalDivider()
                        DropdownMenuItem(
                            text = { Text("🚪 غادر الغرفة") },
                            onClick = { profileMenuExpanded = false; onLeaveRoom() }
                        )
                        DropdownMenuItem(
                            text = { Text("⏻ خروج", color = CodyColors.AuthRed, fontWeight = FontWeight.Bold) },
                            onClick = { profileMenuExpanded = false; onLogout() }
                        )
                    }
                }

                // Quick white icons: إبلاغ، إشعار، طلب، رسالة
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    TopQuickAction(Icons.Rounded.Flag, "إبلاغ", onOpenReport)
                    TopQuickAction(
                        icon = Icons.Rounded.Notifications,
                        label = "إشعار",
                        badgeCount = unreadNotifications,
                        onClick = onOpenNotifications
                    )
                    TopQuickAction(Icons.Rounded.PersonAdd, "طلب", onOpenRequests)
                    TopQuickAction(Icons.Rounded.Email, "رسالة", onOpenPrivateMessages)
                }

                // Two Gold Circular Buttons: الأثرياء & الكبار
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    GoldCircleButton(
                        icon = Icons.Rounded.Diamond,
                        label = "الأثرياء",
                        onClick = onOpenRichLeaderboard
                    )
                    GoldCircleButton(
                        icon = Icons.Rounded.WorkspacePremium,
                        label = "الكبار",
                        onClick = onOpenKibarLeaderboard
                    )
                }

                // Leftmost Drawer Menu Button (☰)
                IconButton(
                    onClick = onOpenDrawer,
                    modifier = Modifier.size(48.dp).testTag("drawer_menu_button")
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Menu,
                        contentDescription = "القائمة الجانبية",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }

            if (currentUser.rank == ChatRank.GUEST) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1538BA))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "أنت تتصفح كزائر — سجل عضويتك دون الخروج",
                        color = Color.White.copy(alpha = 0.92f),
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = CodyColors.RoyalGold,
                        modifier = Modifier
                            .clickable { onOpenUpgradeGuest() }
                            .testTag("top_upgrade_guest_btn")
                    ) {
                        Text(
                            text = "👤+ تسجيل عضوية",
                            color = Color(0xFF422006),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TopQuickAction(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    badgeCount: Int = 0
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 6.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (badgeCount > 0) {
            BadgedBox(badge = { Badge { Text(badgeCount.toString()) } }) {
                Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(19.dp))
            }
        } else {
            Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(19.dp))
        }
        Text(
            text = label,
            color = Color.White,
            style = MaterialTheme.typography.labelSmall,
            fontSize = 9.5.sp
        )
    }
}

@Composable
private fun GoldCircleButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 3.dp, vertical = 2.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(listOf(Color(0xFFFDE047), CodyColors.RoyalGold))
                )
                .border(1.5.dp, Color.White, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = label, tint = Color(0xFF422006), modifier = Modifier.size(17.dp))
        }
        Text(
            text = label,
            color = Color(0xFFFEF08A),
            style = MaterialTheme.typography.labelSmall,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun CodyVoiceMicsBar(
    slots: List<VoiceMicSlot>,
    micsEnabled: Boolean,
    myUserKey: String,
    onSlotClick: (Int) -> Unit,
    onToggleSelfMute: () -> Unit
) {
    Surface(
        color = Color(0xFFEFF4FF),
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            slots.forEach { slot ->
                val occupied = slot.occupantKey != null
                val isMe = slot.occupantKey == myUserKey
                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .clickable { onSlotClick(slot.slotNumber) }
                        .padding(horizontal = 4.dp, vertical = 2.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(
                                when {
                                    !micsEnabled -> Color(0xFFE2E8F0)
                                    isMe -> CodyColors.RoyalGoldLight
                                    occupied -> Color(0xFFDBEAFE)
                                    else -> Color.White
                                }
                            )
                            .border(
                                width = 2.dp,
                                color = when {
                                    isMe -> CodyColors.RoyalGold
                                    occupied -> CodyColors.RoyalBlue
                                    else -> Color(0xFFCBD5E1)
                                },
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (occupied) {
                            Text(slot.occupantEmoji ?: "🎙️", fontSize = 20.sp)
                        } else {
                            Icon(
                                imageVector = if (micsEnabled) Icons.Rounded.Mic else Icons.Rounded.MicOff,
                                contentDescription = "مايك ${slot.slotNumber}",
                                tint = if (micsEnabled) CodyColors.RoyalBlue else Color.Gray,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = if (occupied) (slot.occupantName ?: "") else "مايك ${slot.slotNumber}",
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.width(56.dp),
                        color = if (occupied) CodyColors.RoyalBlueDark else CodyColors.TextSecondary
                    )
                }
            }

            if (slots.any { it.occupantKey == myUserKey }) {
                val meMuted = slots.firstOrNull { it.occupantKey == myUserKey }?.isMuted == true
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (meMuted) CodyColors.AuthRed else CodyColors.OnlineGreen,
                    modifier = Modifier.clickable { onToggleSelfMute() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (meMuted) Icons.Rounded.MicOff else Icons.Rounded.Mic,
                            contentDescription = "كتم المايك",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (meMuted) "مكتوم" else "صوت مفتوح",
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CodyChatMessageCard(
    msg: ChatMessage,
    onSenderClick: (String) -> Unit
) {
    val timeText = remember(msg.createdAtMillis) {
        SimpleDateFormat("hh:mm a", Locale("ar")).format(Date(msg.createdAtMillis))
    }
    val attachedBitmap = rememberUriImageBitmap(msg.imageUri)

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (msg.isAnnouncement) Color(0xFFFEF3C7) else Color.White.copy(alpha = 0.94f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (msg.isAnnouncement) 3.dp else 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.Top
        ) {
            UserAvatarBadge(
                avatarUri = msg.senderAvatarUri,
                emoji = msg.senderAvatarEmoji,
                frame = msg.senderFrame,
                size = 42.dp,
                onClick = { onSenderClick(msg.senderKey) }
            )
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    RankPillBadge(msg.senderRank)
                    Box(modifier = Modifier.weight(1f).clickable { onSenderClick(msg.senderKey) }) {
                        DecoratedNameplate(msg.senderName, msg.senderNameplate)
                    }
                    Text(
                        text = timeText,
                        style = MaterialTheme.typography.labelSmall,
                        color = CodyColors.TextSecondary
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = msg.content,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (msg.isAnnouncement) Color(0xFF78350F) else CodyColors.TextPrimary
                )
                if (attachedBitmap != null) {
                    Spacer(Modifier.height(8.dp))
                    Image(
                        bitmap = attachedBitmap,
                        contentDescription = "صورة مرفقة في الدردشة",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(RoundedCornerShape(14.dp))
                    )
                }
            }
        }
    }
}

@Composable
fun CodyBottomNavBar(
    selectedTab: BottomNavTab,
    isStaff: Boolean,
    onSelectTab: (BottomNavTab) -> Unit
) {
    val tabs = remember(isStaff) {
        if (isStaff) {
            listOf(
                BottomNavTab.CHAT,
                BottomNavTab.ROOMS,
                BottomNavTab.ONLINE,
                BottomNavTab.SHOP,
                BottomNavTab.PRIVATE,
                BottomNavTab.CONTROL
            )
        } else {
            listOf(
                BottomNavTab.CHAT,
                BottomNavTab.ROOMS,
                BottomNavTab.ONLINE,
                BottomNavTab.SHOP,
                BottomNavTab.PRIVATE
            )
        }
    }

    Surface(
        color = CodyColors.RoyalBlue,
        shadowElevation = 10.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(vertical = 6.dp, horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            tabs.forEach { tab ->
                val isSelected = selectedTab == tab
                val icon = when (tab) {
                    BottomNavTab.CHAT -> Icons.AutoMirrored.Rounded.Chat
                    BottomNavTab.ROOMS -> Icons.Rounded.MeetingRoom
                    BottomNavTab.ONLINE -> Icons.Rounded.Group
                    BottomNavTab.SHOP -> Icons.Rounded.Storefront
                    BottomNavTab.PRIVATE -> Icons.Rounded.Email
                    BottomNavTab.CONTROL -> Icons.Rounded.AdminPanelSettings
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) Color.White.copy(alpha = 0.2f) else Color.Transparent)
                        .clickable { onSelectTab(tab) }
                        .padding(vertical = 6.dp)
                        .testTag("nav_tab_${tab.name.lowercase()}"),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = tab.label,
                        tint = if (isSelected) Color(0xFFFDE047) else Color.White,
                        modifier = Modifier.size(21.dp)
                    )
                    Text(
                        text = tab.label,
                        color = if (isSelected) Color(0xFFFDE047) else Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        maxLines = 1
                    )
                }
            }
        }
    }
}
