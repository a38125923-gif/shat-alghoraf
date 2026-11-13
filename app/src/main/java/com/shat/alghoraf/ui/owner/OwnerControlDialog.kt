package com.shat.alghoraf.ui.owner

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shat.alghoraf.data.model.BanRecord
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SkyAccent
import com.shat.alghoraf.ui.theme.TextSecondary

@Composable
fun OwnerControlDialog(
    rooms: List<ChatRoom>,
    profiles: List<PublicProfile>,
    bans: List<BanRecord>,
    isGlobalOwner: Boolean,
    onCreateRoom: (name: String, desc: String, category: String, icon: String, perm: RoomPermissionLevel, isLocked: Boolean) -> Unit,
    onToggleRoomLock: (ChatRoom) -> Unit,
    onClearRoomMessages: (String) -> Unit,
    onDeleteRoom: (String) -> Unit,
    onSetUserRole: (String, UserRole) -> Unit,
    onBanUserGlobal: (PublicProfile, String, Boolean, Int) -> Unit,
    onUnban: (BanRecord) -> Unit,
    onBroadcast: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    // Create room states
    var roomName by remember { mutableStateOf("") }
    var roomDesc by remember { mutableStateOf("") }
    var roomIcon by remember { mutableStateOf("💬") }
    var roomCategory by remember { mutableStateOf("عام") }
    var roomPerm by remember { mutableStateOf(RoomPermissionLevel.PUBLIC) }
    var roomLocked by remember { mutableStateOf(false) }

    // Member filter & ban target
    var memberQuery by remember { mutableStateOf("") }
    var banTarget by remember { mutableStateOf<PublicProfile?>(null) }
    var banReason by remember { mutableStateOf("مخالفة قوانين الشات") }
    var broadcastText by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            color = DeepSlate,
            shape = MaterialTheme.shapes.large,
            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.4f)),
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .heightIn(max = 680.dp)
        ) {
            Column {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isGlobalOwner) "👑 لوحة تحكم المالك العام" else "إنشاء وإدارة الغرف",
                        style = MaterialTheme.typography.titleMedium,
                        color = BrightGold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق")
                    }
                }

                if (isGlobalOwner) {
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = CardSlate,
                        contentColor = BrightGold
                    ) {
                        Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("الغرف") })
                        Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("الأعضاء") })
                        Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }, text = { Text("الحظر") })
                        Tab(selected = selectedTab == 3, onClick = { selectedTab = 3 }, text = { Text("بث 📢") })
                    }
                }

                when (selectedTab) {
                    0 -> {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f, fill = false)
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            item {
                                Surface(
                                    color = CardSlate,
                                    shape = MaterialTheme.shapes.medium,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Text(
                                            text = "إنشاء غرفة دردشة جديدة",
                                            style = MaterialTheme.typography.titleSmall,
                                            color = BrightGold
                                        )
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            OutlinedTextField(
                                                value = roomName,
                                                onValueChange = { roomName = it.take(50) },
                                                label = { Text("اسم الغرفة") },
                                                singleLine = true,
                                                modifier = Modifier
                                                    .weight(2f)
                                                    .testTag("create_room_name_input")
                                            )
                                            OutlinedTextField(
                                                value = roomIcon,
                                                onValueChange = { roomIcon = it.take(4) },
                                                label = { Text("أيقونة") },
                                                singleLine = true,
                                                modifier = Modifier.weight(0.8f)
                                            )
                                        }
                                        OutlinedTextField(
                                            value = roomDesc,
                                            onValueChange = { roomDesc = it.take(150) },
                                            label = { Text("وصف الغرفة") },
                                            singleLine = true,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            listOf("عام", "تعارف", "ثقافة", "تعليم", "إدارة").forEach { cat ->
                                                Surface(
                                                    onClick = { roomCategory = cat },
                                                    color = if (roomCategory == cat) RoyalGold else DeepSlate,
                                                    shape = RoundedCornerShape(50),
                                                    modifier = Modifier.height(34.dp)
                                                ) {
                                                    Text(
                                                        text = cat,
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = if (roomCategory == cat) MidnightVoid else TextSecondary,
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp)
                                                    )
                                                }
                                            }
                                        }
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            RoomPermissionLevel.entries.forEach { perm ->
                                                val selected = roomPerm == perm
                                                Surface(
                                                    onClick = {
                                                        roomPerm = perm
                                                        if (perm == RoomPermissionLevel.PRIVATE) {
                                                            roomLocked = true
                                                        }
                                                    },
                                                    color = if (selected) SkyAccent.copy(alpha = 0.2f) else DeepSlate,
                                                    border = BorderStroke(
                                                        1.dp,
                                                        if (selected) SkyAccent else BorderSlate
                                                    ),
                                                    shape = RoundedCornerShape(10.dp),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text(
                                                        text = perm.arabicLabel,
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = if (selected) SkyAccent else TextSecondary,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis,
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 8.dp)
                                                    )
                                                }
                                            }
                                        }
                                        Button(
                                            onClick = {
                                                if (roomName.trim().length >= 2) {
                                                    onCreateRoom(
                                                        roomName,
                                                        roomDesc,
                                                        roomCategory,
                                                        roomIcon,
                                                        roomPerm,
                                                        roomLocked
                                                    )
                                                    roomName = ""
                                                    roomDesc = ""
                                                    roomLocked = false
                                                }
                                            },
                                            shape = RoundedCornerShape(12.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSend),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(48.dp)
                                                .testTag("confirm_create_room_button")
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null)
                                            Spacer(modifier = Modifier.size(6.dp))
                                            Text("إنشاء الغرفة الآن", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }

                            if (isGlobalOwner) {
                                items(rooms, key = { it.id }) { room ->
                                    Surface(
                                        color = CardSlate,
                                        shape = MaterialTheme.shapes.small,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                modifier = Modifier.weight(1f),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                                            ) {
                                                Text(text = room.icon, style = MaterialTheme.typography.titleLarge)
                                                Column {
                                                    Text(
                                                        text = room.name,
                                                        style = MaterialTheme.typography.titleSmall,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                    Text(
                                                        text = if (room.isLocked) "مغلقة 🔒 • ${room.permissionEnum.arabicLabel}" else "مفتوحة • ${room.category}",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = TextSecondary
                                                    )
                                                }
                                            }
                                            Row {
                                                IconButton(onClick = { onToggleRoomLock(room) }) {
                                                    Icon(
                                                        imageVector = if (room.isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                                                        contentDescription = "قفل أو فتح الغرفة",
                                                        tint = BrightGold
                                                    )
                                                }
                                                IconButton(onClick = { onClearRoomMessages(room.id) }) {
                                                    Icon(
                                                        imageVector = Icons.Default.CleaningServices,
                                                        contentDescription = "تنظيف رسائل الغرفة",
                                                        tint = SkyAccent
                                                    )
                                                }
                                                IconButton(onClick = { onDeleteRoom(room.id) }) {
                                                    Icon(
                                                        imageVector = Icons.Default.Delete,
                                                        contentDescription = "حذف الغرفة",
                                                        tint = CrimsonAlert
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    1 -> {
                        val filteredProfiles = remember(profiles, memberQuery) {
                            val q = memberQuery.trim()
                            if (q.isEmpty()) profiles
                            else profiles.filter { it.displayName.contains(q, ignoreCase = true) }
                        }
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f, fill = false)
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            item {
                                OutlinedTextField(
                                    value = memberQuery,
                                    onValueChange = { memberQuery = it.take(40) },
                                    placeholder = { Text("ابحث عن عضو بالاسم...") },
                                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                            banTarget?.let { target ->
                                item {
                                    Surface(
                                        color = CrimsonAlert.copy(alpha = 0.14f),
                                        border = BorderStroke(1.dp, CrimsonAlert.copy(alpha = 0.5f)),
                                        shape = MaterialTheme.shapes.medium,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(12.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text("حظر شامل للمستخدم: ${target.displayName}", color = CrimsonAlert)
                                            OutlinedTextField(
                                                value = banReason,
                                                onValueChange = { banReason = it.take(150) },
                                                label = { Text("السبب") },
                                                singleLine = true,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Button(
                                                    onClick = {
                                                        onBanUserGlobal(target, banReason, false, 15)
                                                        banTarget = null
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert.copy(alpha = 0.85f)),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("15 د", style = MaterialTheme.typography.labelSmall)
                                                }
                                                Button(
                                                    onClick = {
                                                        onBanUserGlobal(target, banReason, false, 60)
                                                        banTarget = null
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert.copy(alpha = 0.9f)),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("ساعة", style = MaterialTheme.typography.labelSmall)
                                                }
                                                Button(
                                                    onClick = {
                                                        onBanUserGlobal(target, banReason, true, 0)
                                                        banTarget = null
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("دائم", style = MaterialTheme.typography.labelSmall)
                                                }
                                                OutlinedButton(
                                                    onClick = { banTarget = null },
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("إلغاء", style = MaterialTheme.typography.labelSmall)
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            items(filteredProfiles, key = { it.userId }) { user ->
                                var menuOpen by remember { mutableStateOf(false) }
                                Surface(
                                    color = CardSlate,
                                    shape = MaterialTheme.shapes.small,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            modifier = Modifier.weight(1f),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            UserAvatar(
                                                avatarOrUrl = user.photoUrl ?: user.avatarEmoji,
                                                fallbackEmoji = user.roleEnum.badgeEmoji,
                                                size = 38.dp
                                            )
                                            Column {
                                                Text(
                                                    text = "${user.displayName} ${user.roleEnum.badgeEmoji}",
                                                    style = MaterialTheme.typography.titleSmall,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Text(
                                                    text = user.roleEnum.arabicLabel,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = SkyAccent
                                                )
                                            }
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            TextButton(onClick = { menuOpen = true }) {
                                                Text("تغيير الرتبة", color = BrightGold)
                                            }
                                            DropdownMenu(
                                                expanded = menuOpen,
                                                onDismissRequest = { menuOpen = false }
                                            ) {
                                                UserRole.entries.forEach { role ->
                                                    DropdownMenuItem(
                                                        text = { Text("${role.badgeEmoji} ${role.arabicLabel}") },
                                                        onClick = {
                                                            menuOpen = false
                                                            onSetUserRole(user.userId, role)
                                                        }
                                                    )
                                                }
                                            }
                                            if (!user.isOwner) {
                                                IconButton(onClick = { banTarget = user }) {
                                                    Icon(
                                                        Icons.Default.Block,
                                                        contentDescription = "حظر",
                                                        tint = CrimsonAlert
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    2 -> {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f, fill = false)
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (bans.isEmpty()) {
                                item {
                                    Text(
                                        text = "لا توجد حالات حظر نشطة ✨",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextSecondary,
                                        modifier = Modifier.padding(16.dp)
                                    )
                                }
                            } else {
                                items(bans, key = { it.id }) { ban ->
                                    Surface(
                                        color = CardSlate,
                                        shape = MaterialTheme.shapes.small,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "${ban.targetName} (${if (ban.isGlobal) "شامل" else ban.roomName ?: "غرفة"})",
                                                    style = MaterialTheme.typography.titleSmall,
                                                    color = CrimsonAlert
                                                )
                                                Text(
                                                    text = "السبب: ${ban.reason}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = TextSecondary
                                                )
                                            }
                                            TextButton(onClick = { onUnban(ban) }) {
                                                Text("فك الحظر", color = EmeraldOnline)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    3 -> {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "بث إعلان إداري فوري في جميع الغرف 📢",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                            OutlinedTextField(
                                value = broadcastText,
                                onValueChange = { broadcastText = it.take(400) },
                                label = { Text("نص الإعلان العام...") },
                                minLines = 3,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = RoyalGold,
                                    unfocusedBorderColor = BorderSlate
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Button(
                                onClick = {
                                    if (broadcastText.isNotBlank()) {
                                        onBroadcast(broadcastText)
                                        broadcastText = ""
                                    }
                                },
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Icon(Icons.Default.Campaign, contentDescription = null, tint = MidnightVoid)
                                Spacer(modifier = Modifier.size(8.dp))
                                Text("إرسال البث الآن", color = MidnightVoid, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
