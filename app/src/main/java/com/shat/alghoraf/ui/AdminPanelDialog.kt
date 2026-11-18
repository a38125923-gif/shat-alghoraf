package com.shat.alghoraf.ui

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shat.alghoraf.data.BanRecord
import com.shat.alghoraf.data.ChatRoom
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.NewsPost
import com.shat.alghoraf.data.PublicProfile
import com.shat.alghoraf.data.RankConfig
import com.shat.alghoraf.data.SiteSettings
import com.shat.alghoraf.data.UserReport
import com.shat.alghoraf.ui.theme.CrimsonOwner
import com.shat.alghoraf.ui.theme.RoyalBlue
import com.shat.alghoraf.ui.theme.RoyalGold

@OptIn(ExperimentalLayoutApi::class, androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun AdminPanelDialog(
    isSupremeOwner: Boolean,
    profiles: List<PublicProfile>,
    rooms: List<ChatRoom>,
    ranks: List<RankConfig>,
    news: List<NewsPost>,
    bans: List<BanRecord>,
    reports: List<UserReport>,
    siteSettings: SiteSettings,
    messageCount: Int,
    onDismiss: () -> Unit,
    onAssignRank: (uid: String, rankKey: String, grantAdmin: Boolean) -> Unit,
    onSaveRank: (RankConfig) -> Unit,
    onSaveRoom: (roomId: String, name: String, desc: String, icon: String, bgTheme: String, welcome: String, minPower: Long, micsEnabled: Boolean, ownerUserId: String, ownerName: String) -> Unit,
    onPublishNews: (title: String, content: String, imageUrl: String) -> Unit,
    onSaveSiteSettings: (siteName: String, welcomeBanner: String, marqueeText: String, soundEnabled: Boolean) -> Unit,
    onBanUser: (PublicProfile, String) -> Unit,
    onXBanUser: (PublicProfile, String) -> Unit,
    onSetUserGhosted: (PublicProfile, Boolean) -> Unit,
    onDeleteUserPermanently: (PublicProfile) -> Unit,
    onUnbanUser: (String) -> Unit
) {
    val context = LocalContext.current
    var tab by remember { mutableIntStateOf(0) }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = Color.White,
            modifier = Modifier.fillMaxWidth(0.95f).heightIn(max = 650.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().background(CrimsonOwner).padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = Color.White)
                        Text("لوحة تحكم الإدارة والمالك", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White) }
                }

                val tabs = listOf("الإحصائيات", "الأعضاء", "الرتب", "الغرف", "الأخبار والموقع", "الحظر والبلاغات")
                PrimaryScrollableTabRow(selectedTabIndex = tab) {
                    tabs.forEachIndexed { idx, label ->
                        Tab(selected = tab == idx, onClick = { tab = idx }, text = { Text(label, fontWeight = FontWeight.Bold) })
                    }
                }

                Column(modifier = Modifier.weight(1f).padding(14.dp)) {
                    when (tab) {
                        0 -> Column(
                            modifier = Modifier.verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("ملخص الحالة السحابية (Firestore Live)", fontWeight = FontWeight.Bold, color = RoyalBlue)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                AdminStatBox("الأعضاء", profiles.size.toString(), Modifier.weight(1f))
                                AdminStatBox("المتصلون", profiles.count { it.isOnline }.toString(), Modifier.weight(1f))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                AdminStatBox("الغرف", rooms.size.toString(), Modifier.weight(1f))
                                AdminStatBox("الرسائل", messageCount.toString(), Modifier.weight(1f))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                AdminStatBox("الأخبار", news.size.toString(), Modifier.weight(1f))
                                AdminStatBox("المحظورين", bans.size.toString(), Modifier.weight(1f))
                            }
                            Surface(color = Color(0xFFFFFBEB), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = if (isSupremeOwner) "أنت المالك الأعلى الموثق (${DefaultCatalogs.SUPREME_OWNER_EMAIL}) — لديك 100% من صلاحيات النظام والحماية الدائمة."
                                    else "صلاحيات الإدارة مفعلة وفق رتبتك في النظام.",
                                    modifier = Modifier.padding(12.dp),
                                    color = Color(0xFF92400E),
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp
                                )
                            }
                        }

                        1 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(profiles) { u ->
                                val rk = DefaultCatalogs.rankFor(u.role, ranks)
                                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("${u.shownName} • ${u.coins} كوينز", fontWeight = FontWeight.Bold)
                                            StyledRankBadge(rk)
                                        }
                                        if (u.role != "site_owner") {
                                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                ranks.filter { it.key != "site_owner" }.forEach { opt ->
                                                    FilterChip(
                                                        selected = u.role == opt.key,
                                                        onClick = { onAssignRank(u.userId, opt.key, opt.permAccessPanel || opt.permPublishNews || opt.permManageRooms) },
                                                        label = { Text(opt.label, fontSize = 10.sp) }
                                                    )
                                                }
                                            }
                                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                OutlinedButton(
                                                    onClick = { onSetUserGhosted(u, !u.isGhosted) }
                                                ) {
                                                    Icon(Icons.Default.VisibilityOff, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Spacer(Modifier.size(4.dp))
                                                    Text(if (u.isGhosted) "إلغاء الشبح" else "تجميد شبح", fontSize = 11.sp)
                                                }
                                                OutlinedButton(
                                                    onClick = { onBanUser(u, "حظر إداري من لوحة التحكم") }
                                                ) { Text("حظر", color = CrimsonOwner, fontSize = 11.sp) }
                                                OutlinedButton(
                                                    onClick = { onXBanUser(u, "إكس باند جهاز من لوحة التحكم") }
                                                ) { Text("X-Ban", color = CrimsonOwner, fontSize = 11.sp) }
                                                if (isSupremeOwner) {
                                                    OutlinedButton(
                                                        onClick = { onDeleteUserPermanently(u) }
                                                    ) {
                                                        Icon(Icons.Default.DeleteForever, contentDescription = null, tint = CrimsonOwner, modifier = Modifier.size(14.dp))
                                                        Spacer(Modifier.size(3.dp))
                                                        Text("حذف نهائي", color = CrimsonOwner, fontSize = 11.sp)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        2 -> {
                            var rKey by remember { mutableStateOf("") }
                            var rLabel by remember { mutableStateOf("") }
                            var rIcon by remember { mutableStateOf("👑") }
                            var rBadgeStyle by remember { mutableStateOf("crown_royal") }
                            var rIconImg by remember { mutableStateOf("") }
                            var rPower by remember { mutableStateOf("35") }
                            var rMaxAssign by remember { mutableStateOf("20") }
                            var rBg by remember { mutableStateOf("#0284C7") }
                            var permMute by remember { mutableStateOf(true) }
                            var permKick by remember { mutableStateOf(false) }
                            var permBan by remember { mutableStateOf(false) }
                            var permSetRank by remember { mutableStateOf(false) }
                            var permClearRoom by remember { mutableStateOf(false) }
                            var permManageRooms by remember { mutableStateOf(false) }
                            var permPanel by remember { mutableStateOf(false) }
                            var permRoomOwner by remember { mutableStateOf(false) }
                            var permPublishNews by remember { mutableStateOf(false) }
                            var permUseAddons by remember { mutableStateOf(true) }

                            val rankIconPicker = rememberLauncherForActivityResult(
                                contract = ActivityResultContracts.PickVisualMedia()
                            ) { uri ->
                                if (uri != null) {
                                    encodeUriToSmallBase64(context, uri, 96)?.let { rIconImg = it }
                                }
                            }

                            Column(
                                modifier = Modifier.verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("إنشاء أو تعديل رتبة وصلاحياتها", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    OutlinedTextField(value = rKey, onValueChange = { rKey = it }, label = { Text("المفتاح (vip_plus)") }, modifier = Modifier.weight(1f), singleLine = true)
                                    OutlinedTextField(value = rLabel, onValueChange = { rLabel = it }, label = { Text("الاسم بالعربية") }, modifier = Modifier.weight(1f), singleLine = true)
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    OutlinedTextField(value = rPower, onValueChange = { rPower = it }, label = { Text("القوة 0-100") }, modifier = Modifier.weight(1f), singleLine = true)
                                    OutlinedTextField(value = rMaxAssign, onValueChange = { rMaxAssign = it }, label = { Text("سقف الترقية") }, modifier = Modifier.weight(1f), singleLine = true)
                                    OutlinedTextField(value = rBg, onValueChange = { rBg = it }, label = { Text("اللون Hex") }, modifier = Modifier.weight(1f), singleLine = true)
                                }

                                Text("شكل أيقونة الرتبة الملكية:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    DefaultCatalogs.rankBadgeStyles.forEach { st ->
                                        FilterChip(
                                            selected = rBadgeStyle == st.id && rIconImg.isBlank(),
                                            onClick = { rBadgeStyle = st.id; rIcon = st.badge; rIconImg = "" },
                                            label = { Text(st.label, fontSize = 11.sp) }
                                        )
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(onClick = {
                                        rankIconPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                    }) {
                                        Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.size(4.dp))
                                        Text("رفع صورة أيقونة خاصة", fontSize = 11.sp)
                                    }
                                    if (rIconImg.isNotBlank()) {
                                        OutlinedButton(onClick = { rIconImg = "" }) {
                                            Text("إزالة الصورة", fontSize = 11.sp, color = CrimsonOwner)
                                        }
                                    }
                                    StyledRankBadge(
                                        RankConfig(
                                            key = rKey.ifBlank { "preview" },
                                            label = rLabel.ifBlank { "معاينة" },
                                            icon = rIcon,
                                            iconImageUrl = rIconImg,
                                            badgeStyle = rBadgeStyle,
                                            bgColor = rBg
                                        )
                                    )
                                }

                                Text("مصفوفة الصلاحيات:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    PermissionCheck("كتم", permMute) { permMute = it }
                                    PermissionCheck("طرد", permKick) { permKick = it }
                                    PermissionCheck("حظر", permBan) { permBan = it }
                                    PermissionCheck("تغيير الرتب", permSetRank) { permSetRank = it }
                                    PermissionCheck("حذف رسائل", permClearRoom) { permClearRoom = it }
                                    PermissionCheck("إدارة الغرف", permManageRooms) { permManageRooms = it }
                                    PermissionCheck("لوحة التحكم", permPanel) { permPanel = it }
                                    PermissionCheck("مالك غرفة", permRoomOwner) { permRoomOwner = it }
                                    PermissionCheck("نشر الأخبار", permPublishNews) { permPublishNews = it }
                                    PermissionCheck("استخدام الإضافات", permUseAddons) { permUseAddons = it }
                                }

                                Button(
                                    onClick = {
                                        if (rKey.isNotBlank() && rLabel.isNotBlank()) {
                                            val p = (rPower.toLongOrNull() ?: 10L).coerceIn(0L, 100L)
                                            val maxA = (rMaxAssign.toLongOrNull() ?: 0L).coerceIn(0L, 100L)
                                            onSaveRank(
                                                RankConfig(
                                                    key = rKey,
                                                    label = rLabel,
                                                    icon = rIcon,
                                                    iconImageUrl = rIconImg,
                                                    badgeStyle = rBadgeStyle,
                                                    bgColor = rBg,
                                                    textColor = "#FFFFFF",
                                                    power = p,
                                                    isSystem = rKey == "site_owner" || rKey == "member",
                                                    permMute = permMute,
                                                    permKick = permKick,
                                                    permBan = permBan,
                                                    permSetRank = permSetRank,
                                                    permClearRoom = permClearRoom,
                                                    permManageRooms = permManageRooms,
                                                    permAccessPanel = permPanel,
                                                    permRoomOwner = permRoomOwner,
                                                    permPublishNews = permPublishNews,
                                                    permUseAddons = permUseAddons,
                                                    maxAssignableRank = maxA
                                                )
                                            )
                                            rKey = ""; rLabel = ""; rIconImg = ""
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) { Text("حفظ الرتبة وصلاحياتها") }

                                HorizontalDivider()
                                Text("اضغط على أي رتبة لتعديلها:", fontSize = 11.sp, color = Color.Gray)
                                ranks.forEach { rk ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                rKey = rk.key
                                                rLabel = rk.label
                                                rIcon = rk.icon
                                                rBadgeStyle = rk.badgeStyle.ifBlank { "crown_royal" }
                                                rIconImg = rk.iconImageUrl
                                                rPower = rk.power.toString()
                                                rMaxAssign = rk.maxAssignableRank.toString()
                                                rBg = rk.bgColor
                                                permMute = rk.permMute
                                                permKick = rk.permKick
                                                permBan = rk.permBan
                                                permSetRank = rk.permSetRank
                                                permClearRoom = rk.permClearRoom
                                                permManageRooms = rk.permManageRooms
                                                permPanel = rk.permAccessPanel
                                                permRoomOwner = rk.permRoomOwner
                                                permPublishNews = rk.permPublishNews
                                                permUseAddons = rk.permUseAddons
                                            }
                                            .padding(vertical = 5.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        StyledRankBadge(rk)
                                        Text(
                                            text = "قوة: ${rk.power} • سقف: ${rk.maxAssignableRank}",
                                            fontSize = 11.sp,
                                            color = Color.Gray
                                        )
                                    }
                                }
                            }
                        }

                        3 -> {
                            var rmId by remember { mutableStateOf("") }
                            var rmName by remember { mutableStateOf("") }
                            var rmIcon by remember { mutableStateOf("💬") }
                            var rmWelcome by remember { mutableStateOf("") }
                            var rmTheme by remember { mutableStateOf("warm_peach") }
                            var rmMics by remember { mutableStateOf(true) }
                            var rmOwnerUid by remember { mutableStateOf("") }
                            var rmOwnerName by remember { mutableStateOf("") }

                            Column(
                                modifier = Modifier.verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("إضافة / تحديث غرفة وتعيين مالك غرفة", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    OutlinedTextField(value = rmId, onValueChange = { rmId = it }, label = { Text("معرف الغرفة (room1)") }, modifier = Modifier.weight(1f), singleLine = true)
                                    OutlinedTextField(value = rmIcon, onValueChange = { rmIcon = it }, label = { Text("أيقونة") }, modifier = Modifier.weight(0.5f), singleLine = true)
                                }
                                OutlinedTextField(value = rmName, onValueChange = { rmName = it }, label = { Text("اسم الغرفة") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                                OutlinedTextField(value = rmWelcome, onValueChange = { rmWelcome = it }, label = { Text("رسالة الترحيب") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                                Text("خلفية وستايل الغرفة:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    DefaultCatalogs.roomThemes.forEach { th ->
                                        FilterChip(selected = rmTheme == th.id, onClick = { rmTheme = th.id }, label = { Text(th.label, fontSize = 11.sp) })
                                    }
                                }
                                Text("تعيين مالك الغرفة (صلاحية مالك غرفة):", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    profiles.take(8).forEach { candidate ->
                                        FilterChip(
                                            selected = rmOwnerUid == candidate.userId,
                                            onClick = { rmOwnerUid = candidate.userId; rmOwnerName = candidate.shownName },
                                            label = { Text(candidate.shownName, fontSize = 11.sp) }
                                        )
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    Text("تفعيل المايكات في الغرفة")
                                    Switch(checked = rmMics, onCheckedChange = { rmMics = it })
                                }
                                Button(
                                    onClick = {
                                        if (rmName.isNotBlank()) {
                                            onSaveRoom(rmId.ifBlank { "room_${System.currentTimeMillis()}" }, rmName, "", rmIcon, rmTheme, rmWelcome, 0L, rmMics, rmOwnerUid, rmOwnerName)
                                            rmId = ""; rmName = ""; rmWelcome = ""
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) { Text("حفظ الغرفة") }

                                HorizontalDivider()
                                rooms.forEach { existingRoom ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                rmId = existingRoom.id
                                                rmName = existingRoom.name
                                                rmIcon = existingRoom.icon
                                                rmWelcome = existingRoom.welcomeMessage
                                                rmTheme = existingRoom.bgTheme
                                                rmMics = existingRoom.micsEnabled
                                                rmOwnerUid = existingRoom.ownerUserId
                                                rmOwnerName = existingRoom.ownerName
                                            }
                                            .padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("${existingRoom.icon} ${existingRoom.name}", fontWeight = FontWeight.SemiBold)
                                        Text("المالك: ${existingRoom.ownerName.ifBlank { "الإدارة" }}", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }
                        }

                        4 -> {
                            var newsTitle by remember { mutableStateOf("") }
                            var newsBody by remember { mutableStateOf("") }
                            var newsImg by remember { mutableStateOf("") }
                            var sName by remember(siteSettings) { mutableStateOf(siteSettings.siteName) }
                            var sBanner by remember(siteSettings) { mutableStateOf(siteSettings.welcomeBanner) }
                            var sMarquee by remember(siteSettings) { mutableStateOf(siteSettings.marqueeText) }
                            var sSound by remember(siteSettings) { mutableStateOf(siteSettings.soundEffectsEnabled) }

                            val newsImgPicker = rememberLauncherForActivityResult(
                                contract = ActivityResultContracts.PickVisualMedia()
                            ) { uri ->
                                if (uri != null) {
                                    encodeUriToSmallBase64(context, uri, 360)?.let { newsImg = it }
                                }
                            }

                            Column(
                                modifier = Modifier.verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("📰 نشر خبر جديد", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                OutlinedTextField(value = newsTitle, onValueChange = { newsTitle = it }, label = { Text("عنوان الخبر") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                                OutlinedTextField(value = newsBody, onValueChange = { newsBody = it }, label = { Text("نص الخبر") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(onClick = {
                                        newsImgPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                    }) {
                                        Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.size(4.dp))
                                        Text(if (newsImg.isBlank()) "إرفاق صورة للخبر" else "تم إرفاق صورة ✅", fontSize = 12.sp)
                                    }
                                    if (newsImg.isNotBlank()) {
                                        OutlinedButton(onClick = { newsImg = "" }) { Text("إزالة", color = CrimsonOwner, fontSize = 12.sp) }
                                    }
                                }
                                Button(
                                    onClick = {
                                        if (newsTitle.isNotBlank() && newsBody.isNotBlank()) {
                                            onPublishNews(newsTitle, newsBody, newsImg)
                                            newsTitle = ""; newsBody = ""; newsImg = ""
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) { Text("نشر الخبر الآن وإشعار الجميع") }

                                HorizontalDivider()
                                Text("⚙️ إعدادات الموقع CMS", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                OutlinedTextField(value = sName, onValueChange = { sName = it }, label = { Text("اسم الموقع") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                                OutlinedTextField(value = sBanner, onValueChange = { sBanner = it }, label = { Text("شريط الإعلان الترحيبي") }, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(value = sMarquee, onValueChange = { sMarquee = it }, label = { Text("الشريط المتحرك") }, modifier = Modifier.fillMaxWidth())
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    Text("تفعيل تنبيهات الصوت")
                                    Switch(checked = sSound, onCheckedChange = { sSound = it })
                                }
                                Button(
                                    onClick = { onSaveSiteSettings(sName, sBanner, sMarquee, sSound) },
                                    colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                    modifier = Modifier.fillMaxWidth()
                                ) { Text("حفظ إعدادات الموقع", color = Color.Black, fontWeight = FontWeight.Bold) }
                            }
                        }

                        else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            item { Text("🚫 الحسابات المحظورة (${bans.size})", fontWeight = FontWeight.Bold, color = CrimsonOwner) }
                            items(bans) { b ->
                                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(b.targetName, fontWeight = FontWeight.Bold)
                                            Text("السبب: ${b.reason}", fontSize = 12.sp, color = Color.Gray)
                                        }
                                        Button(onClick = { onUnbanUser(b.targetUserId) }) { Text("فك الحظر") }
                                    }
                                }
                            }
                            item { Spacer(Modifier.height(6.dp)); Text("🚩 البلاغات الواردة (${reports.size})", fontWeight = FontWeight.Bold, color = RoyalBlue) }
                            items(reports) { rep ->
                                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                    Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                                        Text("${rep.reporterName} ⬅️ ${rep.targetName}", fontWeight = FontWeight.Bold)
                                        Text(rep.reason, fontSize = 13.sp)
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

@Composable
private fun PermissionCheck(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange)
        Text(label, fontSize = 11.sp)
    }
}

@Composable
private fun AdminStatBox(label: String, count: String, modifier: Modifier = Modifier) {
    Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(14.dp), modifier = modifier) {
        Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 12.sp, color = Color(0xFF64748B))
            Text(count, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = RoyalBlue)
        }
    }
}
