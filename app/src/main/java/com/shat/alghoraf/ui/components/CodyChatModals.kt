package com.shat.alghoraf.ui.components

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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Gavel
import androidx.compose.material.icons.rounded.MicOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import com.shat.alghoraf.data.model.ChatNotification
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.ChatThemeOption
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.UserReport
import com.shat.alghoraf.data.model.WallPost
import com.shat.alghoraf.ui.theme.CodyColors
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun EditProfileDialog(
    user: ChatUser,
    pendingPickedAvatarUri: String?,
    onPickAvatarPhoto: () -> Unit,
    onDismiss: () -> Unit,
    onSave: (displayName: String, bio: String, avatarUri: String, vipFamily: String) -> Unit
) {
    var displayName by remember(user.userKey) { mutableStateOf(user.displayName) }
    var bio by remember(user.userKey) { mutableStateOf(user.bio) }
    var vipFamily by remember(user.userKey) { mutableStateOf(user.vipFamily) }
    val currentAvatarUri = pendingPickedAvatarUri ?: user.avatarUri
    val joinDateStr = remember(user.joinDateMillis) {
        SimpleDateFormat("yyyy/MM/dd", Locale("ar")).format(Date(user.joinDateMillis))
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("الملف الشخصي والرتبة", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                UserAvatarBadge(
                    avatarUri = currentAvatarUri,
                    emoji = user.avatarEmoji,
                    frame = user.avatarFrame,
                    size = 76.dp,
                    showOnlineDot = true,
                    onClick = onPickAvatarPhoto
                )
                OutlinedButton(
                    onClick = onPickAvatarPhoto,
                    modifier = Modifier.testTag("pick_profile_avatar_btn")
                ) {
                    Icon(Icons.Rounded.CameraAlt, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text("رفع صورة شخصية")
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RankPillBadge(user.rank)
                    Text("تاريخ الانضمام: $joinDateStr", style = MaterialTheme.typography.labelMedium)
                }
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("الاسم المعروض") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = bio,
                    onValueChange = { bio = it },
                    label = { Text("نبذة عنك") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = vipFamily,
                    onValueChange = { vipFamily = it },
                    label = { Text("اسم عائلة VIP (اختياري)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(displayName, bio, currentAvatarUri, vipFamily)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue),
                modifier = Modifier.testTag("save_profile_btn")
            ) {
                Text("حفظ التغييرات")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun UserActionDialog(
    viewer: ChatUser,
    target: ChatUser,
    onDismiss: () -> Unit,
    onStartDm: (ChatUser) -> Unit,
    onChangeRank: (ChatUser, ChatRank) -> Unit,
    onToggleMute: (ChatUser) -> Unit,
    onKick: (ChatUser) -> Unit,
    onToggleBan: (ChatUser) -> Unit,
    onReport: (String, String) -> Unit
) {
    var reportReason by remember { mutableStateOf("") }
    var showReportBox by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                UserAvatarBadge(target.avatarUri, target.avatarEmoji, target.avatarFrame, size = 46.dp)
                Column {
                    DecoratedNameplate(target.displayName, target.nameplateStyle)
                    RankPillBadge(target.rank)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (target.bio.isNotBlank()) {
                    Text(target.bio, style = MaterialTheme.typography.bodyMedium, color = CodyColors.TextSecondary)
                }
                Text("🪙 الرصيد: ${target.coins} نقطة", style = MaterialTheme.typography.labelMedium)

                if (target.userKey != viewer.userKey) {
                    Button(
                        onClick = { onStartDm(target); onDismiss() },
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("💬 إرسال رسالة خاصة")
                    }
                    OutlinedButton(
                        onClick = { showReportBox = !showReportBox },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("🚩 إبلاغ الإدارة عن هذا العضو")
                    }
                }

                if (showReportBox) {
                    OutlinedTextField(
                        value = reportReason,
                        onValueChange = { reportReason = it },
                        label = { Text("سبب البلاغ") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            if (reportReason.isNotBlank()) {
                                onReport(target.displayName, reportReason)
                                onDismiss()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthRed)
                    ) { Text("إرسال البلاغ") }
                }

                if (viewer.rank.isStaff && target.userKey != viewer.userKey &&
                    (viewer.rank == ChatRank.SITE_OWNER || viewer.rank.power > target.rank.power)
                ) {
                    HorizontalDivider()
                    Text("صلاحيات الإدارة والمالك:", fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { onToggleMute(target); onDismiss() },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(if (target.isMuted) "فك الكتم" else "🔇 كتم")
                        }
                        OutlinedButton(
                            onClick = { onKick(target); onDismiss() },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("👢 طرد")
                        }
                    }
                    if (viewer.rank.isPrivilegedAdmin) {
                        Button(
                            onClick = { onToggleBan(target); onDismiss() },
                            colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthRed),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (target.isBanned) "✅ فك الحظر النهائي" else "⛔ حظر نهائي")
                        }
                        Text("تعيين رتبة العضو (الرتب الثمانية):", style = MaterialTheme.typography.labelMedium)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            ChatRank.entries.filter {
                                it != ChatRank.GUEST && (viewer.rank == ChatRank.SITE_OWNER || it.power < viewer.rank.power)
                            }.forEach { rank ->
                                FilterChip(
                                    selected = target.rank == rank,
                                    onClick = { onChangeRank(target, rank); onDismiss() },
                                    label = { Text("${rank.icon} ${rank.arabicLabel}") }
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@Composable
fun LeaderboardsDialog(
    title: String,
    users: List<ChatUser>,
    byCoins: Boolean,
    onDismiss: () -> Unit
) {
    val ranked = remember(users, byCoins) {
        if (byCoins) users.sortedByDescending { it.coins }.take(12)
        else users.sortedByDescending { it.rank.power }.take(12)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(
                modifier = Modifier.height(340.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(ranked) { u ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CodyColors.SurfaceMuted),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            UserAvatarBadge(u.avatarUri, u.avatarEmoji, u.avatarFrame, size = 38.dp)
                            Column(modifier = Modifier.weight(1f)) {
                                DecoratedNameplate(u.displayName, u.nameplateStyle)
                                RankPillBadge(u.rank)
                            }
                            Text(
                                text = if (byCoins) "🪙 ${u.coins}" else "${u.rank.icon}",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB45309)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@Composable
fun WallPostsDialog(
    posts: List<WallPost>,
    onPublish: (String) -> Unit,
    onLike: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var draft by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("📰 حائط الأصدقاء والأخبار", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(
                        value = draft,
                        onValueChange = { draft = it },
                        placeholder = { Text("اكتب منشوراً للأصدقاء...") },
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            if (draft.isNotBlank()) {
                                onPublish(draft)
                                draft = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue)
                    ) { Text("نشر") }
                }
                LazyColumn(
                    modifier = Modifier.height(280.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(posts, key = { it.id }) { post ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CodyColors.SurfaceMuted),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(post.authorEmoji)
                                    Text(post.authorName, fontWeight = FontWeight.Bold)
                                    RankPillBadge(post.authorRank)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(post.content, style = MaterialTheme.typography.bodyMedium)
                                TextButton(onClick = { onLike(post.id) }) {
                                    Icon(Icons.Rounded.Favorite, contentDescription = null, tint = CodyColors.AuthRed, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("إعجاب (${post.likes})")
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@Composable
fun NotificationsDialog(
    notifications: List<ChatNotification>,
    onMarkAllRead: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("🔔 الإشعارات والتنبيهات", fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(
                modifier = Modifier.height(280.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(notifications, key = { it.id }) { n ->
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (n.isRead) CodyColors.SurfaceMuted else Color(0xFFDBEAFE)
                        )
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                            Text(n.title, fontWeight = FontWeight.Bold)
                            Text(n.body, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onMarkAllRead(); onDismiss() },
                colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue)
            ) { Text("تحديد الكل كمقروء") }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RoomOptionsAndThemeDialog(
    room: ChatRoom?,
    selectedTheme: ChatThemeOption,
    isStaff: Boolean,
    onSelectTheme: (ChatThemeOption) -> Unit,
    onToggleMics: () -> Unit,
    onClearMessages: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("🎨 إعدادات الدردشة وخيارات الغرفة", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("اختر لون وخلفية الدردشة:", fontWeight = FontWeight.SemiBold)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ChatThemeOption.entries.forEach { opt ->
                        FilterChip(
                            selected = selectedTheme == opt,
                            onClick = { onSelectTheme(opt) },
                            label = { Text(opt.label) }
                        )
                    }
                }
                if (isStaff && room != null) {
                    HorizontalDivider()
                    Text("إدارة الغرفة (${room.name}):", fontWeight = FontWeight.SemiBold)
                    Button(
                        onClick = onToggleMics,
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Rounded.MicOff, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text(if (room.micsEnabled) "قفل المايكات مؤقتاً" else "فتح المايكات للغرفة")
                    }
                    Button(
                        onClick = { onClearMessages(); onDismiss() },
                        colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthRed),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Rounded.DeleteSweep, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("مسح رسائل الغرفة الحالية")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        }
    )
}

@Composable
fun OwnerControlPanelView(
    currentUser: ChatUser,
    rooms: List<ChatRoom>,
    allUsers: List<ChatUser>,
    reports: List<UserReport>,
    onCreateRoom: (String, String, String) -> Unit,
    onDeleteRoom: (String) -> Unit,
    onClearRoom: () -> Unit,
    onBroadcastAnnouncement: (String) -> Unit,
    onInspectUser: (ChatUser) -> Unit,
    onResolveReport: (String) -> Unit
) {
    var newRoomName by remember { mutableStateOf("") }
    var newRoomDesc by remember { mutableStateOf("") }
    var announcementText by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CodyColors.RoyalBlue),
                shape = RoundedCornerShape(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(Icons.Rounded.Gavel, contentDescription = null, tint = Color(0xFFFDE047), modifier = Modifier.size(30.dp))
                    Column {
                        Text("لوحة تحكم المالك والإدارة", color = Color.White, style = MaterialTheme.typography.titleMedium)
                        Text(
                            "رتبتك الحالية: ${currentUser.rank.icon} ${currentUser.rank.arabicLabel}",
                            color = Color(0xFFFEF08A),
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
            }
        }

        // Broadcast Announcement & Clear Chat
        item {
            Card(shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("📢 إعلان إداري وتنظيف الغرفة", fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = announcementText,
                        onValueChange = { announcementText = it },
                        label = { Text("نص الإعلان للغرفة الحالية") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = {
                                if (announcementText.isNotBlank()) {
                                    onBroadcastAnnouncement(announcementText)
                                    announcementText = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue),
                            modifier = Modifier.weight(1f)
                        ) { Text("نشر إعلان") }
                        Button(
                            onClick = onClearRoom,
                            colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthRed),
                            modifier = Modifier.weight(1f).testTag("panel_clear_room_btn")
                        ) { Text("مسح الرسائل") }
                    }
                }
            }
        }

        // Create / Manage Rooms (Admin+)
        if (currentUser.rank.isPrivilegedAdmin) {
            item {
                Card(shape = RoundedCornerShape(16.dp)) {
                    Column(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("🏠 إنشاء غرفة دردشة جديدة", fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = newRoomName,
                            onValueChange = { newRoomName = it },
                            label = { Text("اسم الغرفة") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("new_room_name_input")
                        )
                        OutlinedTextField(
                            value = newRoomDesc,
                            onValueChange = { newRoomDesc = it },
                            label = { Text("وصف الغرفة") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = {
                                if (newRoomName.isNotBlank()) {
                                    onCreateRoom(newRoomName, newRoomDesc, "🌟")
                                    newRoomName = ""
                                    newRoomDesc = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CodyColors.AuthGreen),
                            modifier = Modifier.fillMaxWidth().testTag("create_room_submit_btn")
                        ) { Text("إنشاء الغرفة الآن") }

                        HorizontalDivider()
                        rooms.filter { it.id != "general" }.forEach { r ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("${r.iconEmoji} ${r.name}")
                                TextButton(onClick = { onDeleteRoom(r.id) }) {
                                    Text("حذف", color = CodyColors.AuthRed)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Member Rank & Moderation Manager
        item {
            Text("👑 إدارة الأعضاء والرتب الثمانية (${allUsers.size})", fontWeight = FontWeight.Bold)
        }
        items(allUsers, key = { it.userKey }) { member ->
            Card(
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().clickable { onInspectUser(member) }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    UserAvatarBadge(member.avatarUri, member.avatarEmoji, member.avatarFrame, size = 40.dp, showOnlineDot = member.isOnline)
                    Column(modifier = Modifier.weight(1f)) {
                        DecoratedNameplate(member.displayName, member.nameplateStyle)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            RankPillBadge(member.rank)
                            if (member.isMuted) Text("🔇 مكتوم", color = CodyColors.AuthOrange, style = MaterialTheme.typography.labelSmall)
                            if (member.isBanned) Text("⛔ محظور", color = CodyColors.AuthRed, style = MaterialTheme.typography.labelSmall)
                        }
                    }
                    Text("تعديل ⚙️", color = CodyColors.RoyalBlue, style = MaterialTheme.typography.labelMedium)
                }
            }
        }

        // Reports Queue
        if (reports.isNotEmpty()) {
            item { Text("🚩 البلاغات الواردة (${reports.size})", fontWeight = FontWeight.Bold) }
            items(reports, key = { it.id }) { rep ->
                Card(shape = RoundedCornerShape(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ضد: ${rep.targetName} (من ${rep.reporterName})", fontWeight = FontWeight.Bold)
                            Text(rep.reason, style = MaterialTheme.typography.bodyMedium)
                            Text("الحالة: ${rep.status}", style = MaterialTheme.typography.labelSmall, color = CodyColors.RoyalBlue)
                        }
                        if (rep.status == "قيد المراجعة") {
                            TextButton(onClick = { onResolveReport(rep.id) }) { Text("إغلاق ✅") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UpgradeGuestDialog(
    currentNickname: String,
    onDismiss: () -> Unit,
    onUpgrade: (username: String, email: String, password: String) -> String?
) {
    var username by remember(currentNickname) { mutableStateOf(currentNickname) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("👤+ تسجيل عضوية وترقية الحساب", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    "قم بترقية حسابك إلى عضو مسجل مع الاحتفاظ باسمك المستعار الحالي دون الخروج من غرفة الدردشة.",
                    style = MaterialTheme.typography.bodySmall,
                    color = CodyColors.TextSecondary
                )
                errorMsg?.let { err ->
                    Surface(
                        color = Color(0xFFFEE2E2),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = err,
                            color = CodyColors.AuthRed,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it; errorMsg = null },
                    label = { Text("الاسم المستعار / اسم المستخدم") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("upgrade_username_input")
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; errorMsg = null },
                    label = { Text("البريد الإلكتروني") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("upgrade_email_input")
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; errorMsg = null },
                    label = { Text("كلمة المرور (4 أحرف على الأقل)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("upgrade_password_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val err = onUpgrade(username, email, password)
                    if (err == null) {
                        onDismiss()
                    } else {
                        errorMsg = err
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalGold),
                modifier = Modifier.testTag("upgrade_submit_btn")
            ) {
                Text("ترقية الحساب الآن", color = Color(0xFF422006), fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إلغاء") }
        }
    )
}

