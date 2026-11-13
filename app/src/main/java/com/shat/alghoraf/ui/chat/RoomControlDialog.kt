package com.shat.alghoraf.ui.chat

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
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.theme.AdminPurple
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.ModeratorBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SkyAccent
import com.shat.alghoraf.ui.theme.TextSecondary

@Composable
fun RoomControlDialog(
    room: ChatRoom,
    profiles: List<PublicProfile>,
    currentUserId: String,
    isAdminOrOwner: Boolean,
    isRoomOwnerOrGlobalOwner: Boolean,
    onUpdateRoom: (
        name: String?,
        description: String?,
        category: String?,
        icon: String?,
        permissionLevel: RoomPermissionLevel?,
        isLocked: Boolean?,
        pinnedMessage: String?,
        clearPinnedMessage: Boolean
    ) -> Unit,
    onClearMessages: () -> Unit,
    onDeleteRoom: () -> Unit,
    onToggleMute: (PublicProfile) -> Unit,
    onBanFromRoom: (PublicProfile, String, Boolean, Int) -> Unit,
    onUnbanFromRoom: (PublicProfile) -> Unit,
    onToggleRoomAdmin: (PublicProfile) -> Unit,
    onToggleRoomModerator: (PublicProfile) -> Unit,
    onStartDirectChat: (PublicProfile) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    var editName by remember(room.id) { mutableStateOf(room.name) }
    var editDesc by remember(room.id) { mutableStateOf(room.description.orEmpty()) }
    var editIcon by remember(room.id) { mutableStateOf(room.icon) }
    var editCategory by remember(room.id) { mutableStateOf(room.category) }
    var editPerm by remember(room.id) { mutableStateOf(room.permissionEnum) }
    var editLocked by remember(room.id) { mutableStateOf(room.isLocked) }
    var editPinned by remember(room.id) { mutableStateOf(room.pinnedMessage.orEmpty()) }

    var confirmClear by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var memberSearch by remember { mutableStateOf("") }
    var banTarget by remember { mutableStateOf<PublicProfile?>(null) }
    var banReason by remember { mutableStateOf("مخالفة قوانين الغرفة") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            color = DeepSlate,
            shape = MaterialTheme.shapes.large,
            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.45f)),
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .heightIn(max = 700.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${room.icon} التحكم الكامل بالغرفة",
                        style = MaterialTheme.typography.titleMedium,
                        color = BrightGold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق")
                    }
                }

                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = CardSlate,
                    contentColor = BrightGold
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("الإعدادات والأمان") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("الأعضاء (${profiles.size})") }
                    )
                }

                when (selectedTab) {
                    0 -> {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f, fill = false)
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Quick Lock Switch
                            item {
                                Surface(
                                    color = CardSlate,
                                    shape = MaterialTheme.shapes.medium,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 14.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(
                                                imageVector = if (editLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                                                contentDescription = null,
                                                tint = if (editLocked) CrimsonAlert else EmeraldOnline
                                            )
                                            Column {
                                                Text(
                                                    text = if (editLocked) "الغرفة مغلقة حالياً" else "الغرفة مفتوحة للجميع",
                                                    style = MaterialTheme.typography.titleSmall
                                                )
                                                Text(
                                                    text = "عند القفل يمنع دخول أو كتابة الأعضاء غير الإداريين",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = TextSecondary
                                                )
                                            }
                                        }
                                        Switch(
                                            checked = editLocked,
                                            enabled = isAdminOrOwner,
                                            onCheckedChange = { next ->
                                                editLocked = next
                                                onUpdateRoom(null, null, null, null, null, next, null, false)
                                            }
                                        )
                                    }
                                }
                            }

                            // Pinned message control
                            item {
                                Surface(
                                    color = CardSlate,
                                    shape = MaterialTheme.shapes.medium,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.PushPin,
                                                contentDescription = null,
                                                tint = BrightGold,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.size(6.dp))
                                            Text(
                                                text = "الرسالة المثبتة في أعلى الغرفة",
                                                style = MaterialTheme.typography.titleSmall,
                                                color = BrightGold
                                            )
                                        }
                                        OutlinedTextField(
                                            value = editPinned,
                                            onValueChange = { editPinned = it.take(400) },
                                            label = { Text("اكتب إعلاناً أو ترحيباً...") },
                                            minLines = 2,
                                            maxLines = 3,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = {
                                                    if (editPinned.isNotBlank()) {
                                                        onUpdateRoom(null, null, null, null, null, null, editPinned, false)
                                                    }
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("تثبيت الرسالة", color = MidnightVoid, fontWeight = FontWeight.Bold)
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    editPinned = ""
                                                    onUpdateRoom(null, null, null, null, null, null, null, true)
                                                },
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("إزالة المثبتة")
                                            }
                                        }
                                    }
                                }
                            }

                            // Full room metadata edit (Admin / Owner)
                            if (isAdminOrOwner) {
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
                                                text = "تعديل بيانات وصلاحيات الغرفة",
                                                style = MaterialTheme.typography.titleSmall,
                                                color = SkyAccent
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                OutlinedTextField(
                                                    value = editName,
                                                    onValueChange = { editName = it.take(60) },
                                                    label = { Text("اسم الغرفة") },
                                                    singleLine = true,
                                                    modifier = Modifier.weight(2f)
                                                )
                                                OutlinedTextField(
                                                    value = editIcon,
                                                    onValueChange = { editIcon = it.take(6) },
                                                    label = { Text("أيقونة") },
                                                    singleLine = true,
                                                    modifier = Modifier.weight(0.8f)
                                                )
                                            }
                                            OutlinedTextField(
                                                value = editDesc,
                                                onValueChange = { editDesc = it.take(250) },
                                                label = { Text("وصف الغرفة") },
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                listOf("عام", "تعارف", "ثقافة", "تعليم", "إدارة").forEach { cat ->
                                                    Surface(
                                                        onClick = { editCategory = cat },
                                                        color = if (editCategory == cat) RoyalGold else DeepSlate,
                                                        shape = RoundedCornerShape(50)
                                                    ) {
                                                        Text(
                                                            text = cat,
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = if (editCategory == cat) MidnightVoid else TextSecondary,
                                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                                        )
                                                    }
                                                }
                                            }
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                RoomPermissionLevel.entries.forEach { perm ->
                                                    val selected = editPerm == perm
                                                    Surface(
                                                        onClick = { editPerm = perm },
                                                        color = if (selected) SkyAccent.copy(alpha = 0.2f) else DeepSlate,
                                                        border = BorderStroke(1.dp, if (selected) SkyAccent else BorderSlate),
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
                                                    if (editName.trim().length >= 2) {
                                                        onUpdateRoom(
                                                            editName,
                                                            editDesc,
                                                            editCategory,
                                                            editIcon,
                                                            editPerm,
                                                            editLocked,
                                                            null,
                                                            false
                                                        )
                                                    }
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldSend),
                                                shape = RoundedCornerShape(12.dp),
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(48.dp)
                                                    .testTag("save_room_settings_button")
                                            ) {
                                                Icon(Icons.Default.Check, contentDescription = null)
                                                Spacer(modifier = Modifier.size(6.dp))
                                                Text("حفظ إعدادات الغرفة", fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }

                            // Danger zone: clear messages & delete room
                            item {
                                Surface(
                                    color = CrimsonAlert.copy(alpha = 0.08f),
                                    border = BorderStroke(1.dp, CrimsonAlert.copy(alpha = 0.35f)),
                                    shape = MaterialTheme.shapes.medium,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Text(
                                            text = "إجراءات التنظيف والحذف",
                                            style = MaterialTheme.typography.titleSmall,
                                            color = CrimsonAlert
                                        )
                                        if (!confirmClear) {
                                            OutlinedButton(
                                                onClick = { confirmClear = true },
                                                border = BorderStroke(1.dp, SkyAccent),
                                                modifier = Modifier.fillMaxWidth().height(48.dp)
                                            ) {
                                                Icon(Icons.Default.CleaningServices, contentDescription = null, tint = SkyAccent)
                                                Spacer(modifier = Modifier.size(8.dp))
                                                Text("مسح جميع رسائل الغرفة", color = SkyAccent)
                                            }
                                        } else {
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Button(
                                                    onClick = {
                                                        confirmClear = false
                                                        onClearMessages()
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("تأكيد المسح")
                                                }
                                                OutlinedButton(
                                                    onClick = { confirmClear = false },
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("إلغاء")
                                                }
                                            }
                                        }

                                        if (isRoomOwnerOrGlobalOwner) {
                                            HorizontalDivider(color = BorderSlate)
                                            if (!confirmDelete) {
                                                Button(
                                                    onClick = { confirmDelete = true },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert),
                                                    modifier = Modifier.fillMaxWidth().height(48.dp)
                                                ) {
                                                    Icon(Icons.Default.Delete, contentDescription = null)
                                                    Spacer(modifier = Modifier.size(8.dp))
                                                    Text("حذف الغرفة نهائياً")
                                                }
                                            } else {
                                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                    Button(
                                                        onClick = {
                                                            confirmDelete = false
                                                            onDeleteRoom()
                                                            onDismiss()
                                                        },
                                                        colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert),
                                                        modifier = Modifier.weight(1f)
                                                    ) {
                                                        Text("نعم، احذف الغرفة")
                                                    }
                                                    OutlinedButton(
                                                        onClick = { confirmDelete = false },
                                                        modifier = Modifier.weight(1f)
                                                    ) {
                                                        Text("تراجع")
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    1 -> {
                        val filteredUsers = remember(profiles, memberSearch) {
                            val q = memberSearch.trim()
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
                                    value = memberSearch,
                                    onValueChange = { memberSearch = it.take(40) },
                                    placeholder = { Text("ابحث عن عضو...") },
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
                                            Text(
                                                text = "حظر (${target.displayName}) من غرفة ${room.name}",
                                                color = CrimsonAlert,
                                                style = MaterialTheme.typography.titleSmall
                                            )
                                            OutlinedTextField(
                                                value = banReason,
                                                onValueChange = { banReason = it.take(150) },
                                                label = { Text("سبب الحظر") },
                                                singleLine = true,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Button(
                                                    onClick = {
                                                        onBanFromRoom(target, banReason, false, 15)
                                                        banTarget = null
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert.copy(alpha = 0.85f)),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("15 د", style = MaterialTheme.typography.labelSmall)
                                                }
                                                Button(
                                                    onClick = {
                                                        onBanFromRoom(target, banReason, false, 60)
                                                        banTarget = null
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert.copy(alpha = 0.9f)),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("ساعة", style = MaterialTheme.typography.labelSmall)
                                                }
                                                Button(
                                                    onClick = {
                                                        onBanFromRoom(target, banReason, true, 0)
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

                            items(filteredUsers, key = { it.userId }) { user ->
                                val isMuted = room.mutedUsers.contains(user.userId)
                                val isBanned = room.bannedUsers.contains(user.userId)
                                val isRoomAdmin = room.admins.contains(user.userId)
                                val isRoomMod = room.moderators.contains(user.userId)
                                val isSelf = user.userId == currentUserId

                                Surface(
                                    color = CardSlate,
                                    shape = MaterialTheme.shapes.small,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(10.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                UserAvatar(
                                                    avatarOrUrl = user.photoUrl ?: user.avatarEmoji,
                                                    fallbackEmoji = user.roleEnum.badgeEmoji,
                                                    size = 38.dp,
                                                    showOnlineDot = true,
                                                    isOnline = user.status == "online"
                                                )
                                                Column {
                                                    Text(
                                                        text = "${user.displayName} ${user.roleEnum.badgeEmoji}",
                                                        style = MaterialTheme.typography.titleSmall,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                    val tagText = buildString {
                                                        append(user.roleEnum.arabicLabel)
                                                        if (isRoomAdmin) append(" • أدمن الغرفة")
                                                        else if (isRoomMod) append(" • مشرف الغرفة")
                                                        if (isMuted) append(" • مكتوم 🔇")
                                                        if (isBanned) append(" • محظور 🚫")
                                                    }
                                                    Text(
                                                        text = tagText,
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = if (isBanned || isMuted) CrimsonAlert else SkyAccent
                                                    )
                                                }
                                            }

                                            if (!isSelf) {
                                                IconButton(onClick = { onStartDirectChat(user) }) {
                                                    Icon(
                                                        Icons.AutoMirrored.Filled.Chat,
                                                        contentDescription = "رسالة خاصة",
                                                        tint = EmeraldOnline
                                                    )
                                                }
                                            }
                                        }

                                        if (!isSelf && !user.isOwner) {
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                TextButton(onClick = { onToggleMute(user) }) {
                                                    Icon(
                                                        imageVector = if (isMuted) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                                                        contentDescription = null,
                                                        tint = if (isMuted) EmeraldOnline else BrightGold,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.size(4.dp))
                                                    Text(
                                                        text = if (isMuted) "فك الكتم" else "كتم",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = if (isMuted) EmeraldOnline else BrightGold
                                                    )
                                                }

                                                if (isBanned) {
                                                    TextButton(onClick = { onUnbanFromRoom(user) }) {
                                                        Text(
                                                            text = "فك الحظر ✅",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = EmeraldOnline
                                                        )
                                                    }
                                                } else {
                                                    TextButton(onClick = { banTarget = user }) {
                                                        Icon(
                                                            Icons.Default.Block,
                                                            contentDescription = null,
                                                            tint = CrimsonAlert,
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                        Spacer(modifier = Modifier.size(4.dp))
                                                        Text(
                                                            text = "حظر",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = CrimsonAlert
                                                        )
                                                    }
                                                }

                                                if (isAdminOrOwner) {
                                                    TextButton(onClick = { onToggleRoomModerator(user) }) {
                                                        Icon(
                                                            Icons.Default.Shield,
                                                            contentDescription = null,
                                                            tint = ModeratorBlue,
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                        Spacer(modifier = Modifier.size(4.dp))
                                                        Text(
                                                            text = if (isRoomMod) "إزالة مشرف" else "مشرف",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = ModeratorBlue
                                                        )
                                                    }
                                                }

                                                if (isRoomOwnerOrGlobalOwner) {
                                                    TextButton(onClick = { onToggleRoomAdmin(user) }) {
                                                        Icon(
                                                            Icons.Default.AdminPanelSettings,
                                                            contentDescription = null,
                                                            tint = AdminPurple,
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                        Spacer(modifier = Modifier.size(4.dp))
                                                        Text(
                                                            text = if (isRoomAdmin) "إزالة أدمن" else "أدمن",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = AdminPurple
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
