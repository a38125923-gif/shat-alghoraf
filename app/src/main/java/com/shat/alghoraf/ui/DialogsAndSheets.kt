package com.shat.alghoraf.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.PrimaryTabRow
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shat.alghoraf.data.ChatRoom
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.Friendship
import com.shat.alghoraf.data.GiftCatalogItem
import com.shat.alghoraf.data.NewsPost
import com.shat.alghoraf.data.NotificationItem
import com.shat.alghoraf.data.PrivateMessage
import com.shat.alghoraf.data.PublicProfile
import com.shat.alghoraf.data.RankConfig
import com.shat.alghoraf.data.WallPost
import com.shat.alghoraf.ui.theme.CrimsonOwner
import com.shat.alghoraf.ui.theme.RoyalBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.parseHexColor
import java.io.ByteArrayOutputStream

fun encodeUriToSmallBase64(context: android.content.Context, uri: Uri, maxDim: Int = 256): String? {
    return try {
        val stream = context.contentResolver.openInputStream(uri) ?: return null
        val bmp = BitmapFactory.decodeStream(stream)
        stream.close()
        if (bmp == null) return null
        val scale = minOf(maxDim.toFloat() / bmp.width, maxDim.toFloat() / bmp.height, 1f)
        val w = (bmp.width * scale).toInt().coerceAtLeast(1)
        val h = (bmp.height * scale).toInt().coerceAtLeast(1)
        val resized = Bitmap.createScaledBitmap(bmp, w, h, true)
        val out = ByteArrayOutputStream()
        resized.compress(Bitmap.CompressFormat.JPEG, 72, out)
        val b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        "data:image/jpeg;base64,$b64"
    } catch (_: Exception) {
        null
    }
}

@OptIn(ExperimentalLayoutApi::class, androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun ProfileCustomizerDialog(
    profile: PublicProfile,
    isSupremeOwner: Boolean,
    ranks: List<RankConfig>,
    onDismiss: () -> Unit,
    onSave: (
        displayName: String,
        bio: String,
        avatarUrl: String,
        nameColor: String,
        textColor: String,
        nameBgColor: String,
        neonColor: String,
        fontFamily: String,
        fontStyle: String,
        avatarFrame: String,
        nameplateStyle: String,
        nameShine: String,
        vipWings: Boolean,
        profileMusic: String,
        vipFamily: String
    ) -> Unit,
    onToggleStealth: (Boolean) -> Unit,
    onOpenAdminPanel: () -> Unit,
    onPreviewMusic: (String) -> Unit,
    onSignOut: () -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var displayName by remember { mutableStateOf(profile.shownName) }
    var bio by remember { mutableStateOf(profile.bio) }
    var avatarUrl by remember { mutableStateOf(profile.avatarUrl) }
    var nameColor by remember { mutableStateOf(profile.nameColor) }
    var textColor by remember { mutableStateOf(profile.textColor) }
    var nameBgColor by remember { mutableStateOf(profile.nameBgColor) }
    var neonColor by remember { mutableStateOf(profile.neonColor) }
    var fontFamily by remember { mutableStateOf(profile.fontFamily) }
    var avatarFrame by remember { mutableStateOf(profile.avatarFrame) }
    var nameplateStyle by remember { mutableStateOf(profile.nameplateStyle) }
    var nameShine by remember { mutableStateOf(profile.nameShine) }
    var vipWings by remember { mutableStateOf(profile.vipWings) }
    var profileMusic by remember { mutableStateOf(profile.profileMusic) }
    var vipFamily by remember { mutableStateOf(profile.vipFamily) }

    val avatarPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            encodeUriToSmallBase64(context, uri, 220)?.let { avatarUrl = it }
        }
    }

    val myRank = DefaultCatalogs.rankFor(profile.role, ranks)
    val canUseAddons = isSupremeOwner || myRank.permUseAddons

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .heightIn(max = 640.dp),
            shape = RoundedCornerShape(22.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(RoyalBlue)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AvatarWithFrame(avatarUrl, displayName, avatarFrame, size = 44.dp, showOnlineDot = true)
                        Column {
                            Text("ملفي وتخصيص الإضافات", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            StyledRankBadge(myRank)
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White)
                    }
                }

                val tabs = listOf("حساب", "الهدايا", "الخيارات", "الإضافات")
                PrimaryTabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { idx, title ->
                        Tab(
                            selected = selectedTab == idx,
                            onClick = { selectedTab = idx },
                            text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    when (selectedTab) {
                        0 -> {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                AvatarWithFrame(avatarUrl, displayName, avatarFrame, size = 64.dp)
                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Button(
                                        onClick = {
                                            avatarPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                        },
                                        modifier = Modifier.testTag("pick_avatar_button")
                                    ) {
                                        Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text("تغيير الصورة الشخصية")
                                    }
                                    Text("🪙 رصيدك: ${profile.coins} كوينز • ⭐ التفاعل: ${profile.activityPoints}", fontSize = 12.sp, color = Color(0xFF475569))
                                }
                            }
                            OutlinedTextField(
                                value = if (avatarUrl.startsWith("http")) avatarUrl else "",
                                onValueChange = { if (it.isBlank() || it.startsWith("http")) avatarUrl = it },
                                label = { Text("أو رابط صورة متحركة GIF / URL") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = displayName,
                                onValueChange = { displayName = it },
                                label = { Text("الاسم المستعار في الشات") },
                                modifier = Modifier.fillMaxWidth().testTag("profile_name_input"),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = bio,
                                onValueChange = { bio = it },
                                label = { Text("الحالة / النبذة الشخصية") },
                                modifier = Modifier.fillMaxWidth(),
                                maxLines = 2
                            )
                            OutlinedTextField(
                                value = vipFamily,
                                onValueChange = { vipFamily = it },
                                label = { Text("اسم العائلة / الشلة") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            if (myRank.permAccessPanel || isSupremeOwner) {
                                Button(
                                    onClick = {
                                        onDismiss()
                                        onOpenAdminPanel()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonOwner),
                                    modifier = Modifier.fillMaxWidth().testTag("open_admin_panel_button")
                                ) {
                                    Text("⚙️ فتح لوحة تحكم الإدارة والمالك", fontWeight = FontWeight.Bold)
                                }
                            }
                            if (isSupremeOwner) {
                                Surface(
                                    color = Color(0xFFFEF3C7),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Icon(Icons.Default.VisibilityOff, contentDescription = null, tint = Color(0xFF92400E))
                                            Text("وضع التخفي الملكي (Ghost Mode)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        }
                                        Switch(
                                            checked = profile.isStealth,
                                            onCheckedChange = { onToggleStealth(it) },
                                            modifier = Modifier.testTag("stealth_mode_switch")
                                        )
                                    }
                                }
                            }
                            OutlinedButton(
                                onClick = onSignOut,
                                modifier = Modifier.fillMaxWidth().testTag("sign_out_button")
                            ) {
                                Text("تسجيل الخروج من الحساب", color = CrimsonOwner)
                            }
                        }

                        1 -> {
                            Text("إحصائيات الهدايا الخاصة بك", fontWeight = FontWeight.Bold)
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                                StatPillCard("🎁 مستلمة", profile.giftsReceived.toString(), Modifier.weight(1f))
                                StatPillCard("💝 مرسلة", profile.giftsSent.toString(), Modifier.weight(1f))
                                StatPillCard("🪙 كوينز", profile.coins.toString(), Modifier.weight(1f))
                            }
                            Text("كتالوج الهدايا المتاح في الغرف:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            DefaultCatalogs.giftCatalog.forEach { gift ->
                                Surface(
                                    color = Color(0xFFF8FAFC),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("${gift.emoji} ${gift.name} (${gift.tier})", fontWeight = FontWeight.SemiBold)
                                        Text("${gift.cost} كوينز", color = RoyalGold, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        2 -> {
                            Text("لون الاسم داخل الغرفة", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                DefaultCatalogs.colorPalette.forEach { hex ->
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(hex, RoyalBlue))
                                            .border(
                                                width = if (nameColor == hex) 3.dp else 1.dp,
                                                color = if (nameColor == hex) Color.Black else Color.LightGray,
                                                shape = CircleShape
                                            )
                                            .clickable { nameColor = hex }
                                    )
                                }
                            }
                            Text("خلفية الاسم (Name Background)", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                FilterChip(selected = nameBgColor.isBlank(), onClick = { nameBgColor = "" }, label = { Text("شفاف") })
                                DefaultCatalogs.colorPalette.take(8).forEach { hex ->
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(hex, RoyalBlue))
                                            .border(
                                                width = if (nameBgColor == hex) 3.dp else 1.dp,
                                                color = if (nameBgColor == hex) Color.Black else Color.LightGray,
                                                shape = CircleShape
                                            )
                                            .clickable { nameBgColor = hex }
                                    )
                                }
                            }
                            Text("توهج النيون حول الاسم (Neon Glow)", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                FilterChip(selected = neonColor.isBlank(), onClick = { neonColor = "" }, label = { Text("بدون") })
                                DefaultCatalogs.colorPalette.take(8).forEach { hex ->
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(hex, RoyalGold))
                                            .border(
                                                width = if (neonColor == hex) 3.dp else 1.dp,
                                                color = if (neonColor == hex) Color.Black else Color.LightGray,
                                                shape = CircleShape
                                            )
                                            .clickable { neonColor = hex }
                                    )
                                }
                            }
                            Text("لون النص في الرسائل", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                DefaultCatalogs.colorPalette.forEach { hex ->
                                    Box(
                                        modifier = Modifier
                                            .size(30.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(hex, Color.Black))
                                            .border(
                                                width = if (textColor == hex) 3.dp else 1.dp,
                                                color = if (textColor == hex) RoyalGold else Color.LightGray,
                                                shape = CircleShape
                                            )
                                            .clickable { textColor = hex }
                                    )
                                }
                            }
                            Text("نوع الخط", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                DefaultCatalogs.fontFamilies.forEach { ff ->
                                    FilterChip(
                                        selected = fontFamily == ff,
                                        onClick = { fontFamily = ff },
                                        label = { Text(ff) }
                                    )
                                }
                            }
                        }

                        3 -> {
                            // Live Preview Banner
                            Surface(
                                color = Color(0xFFF8FAFC),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth().border(1.dp, RoyalGold.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    AvatarWithFrame(avatarUrl, displayName, avatarFrame, size = 48.dp, showOnlineDot = true)
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text("معاينة حية لشكلك في الغرفة:", fontSize = 10.sp, color = Color.Gray)
                                        StyledChatName(
                                            name = displayName.ifBlank { "عضو" },
                                            nameColorHex = nameColor,
                                            nameplateStyle = nameplateStyle,
                                            nameShine = nameShine,
                                            fontFamilyName = fontFamily,
                                            vipWings = vipWings,
                                            nameBgColorHex = nameBgColor,
                                            neonColorHex = neonColor
                                        )
                                    }
                                }
                            }

                            if (!canUseAddons) {
                                Surface(color = Color(0xFFFEF2F2), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                    Text(
                                        "ملاحظة: بعض الإضافات الملكية تتطلب رتبة أعلى بصلاحية استخدام الإضافات.",
                                        fontSize = 11.sp,
                                        color = CrimsonOwner,
                                        modifier = Modifier.padding(8.dp)
                                    )
                                }
                            }

                            Text("معرض إطارات الصور المتحركة", fontWeight = FontWeight.Bold)
                            DefaultCatalogs.avatarFrames.filter { it.id != "none" }.forEach { opt ->
                                val isActiveFrame = avatarFrame == opt.id
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = if (isActiveFrame) Color(0xFFFFFBEB) else Color(0xFFF8FAFC)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            AvatarWithFrame(avatarUrl, displayName, opt.id, size = 42.dp)
                                            Column {
                                                Text("${opt.badge} ${opt.label}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                                Text(if (isActiveFrame) "مفعل حالياً ✅" else "إطار متحرك", fontSize = 11.sp, color = Color.Gray)
                                            }
                                        }
                                        if (isActiveFrame) {
                                            OutlinedButton(onClick = { avatarFrame = "none" }) {
                                                Text("Delete / إزالة", fontSize = 11.sp, color = CrimsonOwner)
                                            }
                                        } else {
                                            Button(
                                                enabled = canUseAddons,
                                                onClick = { avatarFrame = opt.id },
                                                colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                                            ) {
                                                Text("USE NOW", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }

                            Text("لوحة الاسم الملكية (Nameplate)", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.nameplateStyles.forEach { opt ->
                                    FilterChip(
                                        selected = nameplateStyle == opt.id,
                                        enabled = canUseAddons || opt.id == "default",
                                        onClick = { nameplateStyle = opt.id },
                                        label = { Text(opt.label) }
                                    )
                                }
                            }

                            Text("شبكة لمعة الاسم (معاينة حية)", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                DefaultCatalogs.nameShineOptions.forEach { opt ->
                                    Surface(
                                        color = if (nameShine == opt.id) Color(0xFFDBEAFE) else Color(0xFFF8FAFC),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .border(
                                                width = if (nameShine == opt.id) 2.dp else 1.dp,
                                                color = if (nameShine == opt.id) RoyalBlue else Color(0xFFE2E8F0),
                                                shape = RoundedCornerShape(10.dp)
                                            )
                                            .clickable(enabled = canUseAddons || opt.id == "none") { nameShine = opt.id }
                                    ) {
                                        Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                            StyledChatName(
                                                name = displayName.take(10).ifBlank { "معاينة" },
                                                nameColorHex = nameColor,
                                                nameplateStyle = "default",
                                                nameShine = opt.id,
                                                fontFamilyName = fontFamily,
                                                vipWings = false
                                            )
                                            Text(opt.label, fontSize = 10.sp, color = Color.Gray)
                                        }
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("أجنحة VIP الملكية بجانب الاسم 🕊️", fontWeight = FontWeight.Bold)
                                Switch(checked = vipWings, enabled = canUseAddons, onCheckedChange = { vipWings = it })
                            }
                            Text("موسيقى البروفايل", fontWeight = FontWeight.Bold)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.profileMusicPresets.forEach { opt ->
                                    FilterChip(
                                        selected = profileMusic == opt.id,
                                        onClick = {
                                            profileMusic = opt.id
                                            if (opt.id.isNotBlank()) onPreviewMusic(opt.id)
                                        },
                                        label = { Text("${opt.badge} ${opt.label}") },
                                        leadingIcon = { Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(16.dp)) }
                                    )
                                }
                            }
                        }
                    }
                }

                HorizontalDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("إلغاء")
                    }
                    Button(
                        onClick = {
                            onSave(
                                displayName, bio, avatarUrl, nameColor, textColor,
                                nameBgColor, neonColor, fontFamily, "Normal",
                                avatarFrame, nameplateStyle, nameShine,
                                vipWings, profileMusic, vipFamily
                            )
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f).testTag("save_profile_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                    ) {
                        Text("حفظ التعديلات", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatPillCard(title: String, value: String, modifier: Modifier = Modifier) {
    Surface(color = Color(0xFFF1F5F9), shape = RoundedCornerShape(12.dp), modifier = modifier) {
        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(title, fontSize = 11.sp, color = Color(0xFF64748B))
            Text(value, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = RoyalBlue)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun QuickUserCardDialog(
    target: PublicProfile,
    myProfile: PublicProfile,
    ranks: List<RankConfig>,
    isSupremeOwner: Boolean,
    onDismiss: () -> Unit,
    onOpenSendGift: () -> Unit,
    onSendPrivateMsg: (String) -> Unit,
    onAddFriend: () -> Unit,
    onReport: (String) -> Unit,
    onAssignRank: (String, Boolean) -> Unit,
    onMute: (String) -> Unit,
    onBan: (String) -> Unit,
    onPreviewMusic: (String) -> Unit
) {
    val targetRank = DefaultCatalogs.rankFor(target.role, ranks)
    val myRank = DefaultCatalogs.rankFor(myProfile.role, ranks)
    val isSelf = target.userId == myProfile.userId
    val canMod = !isSelf && (isSupremeOwner || (myRank.power > targetRank.power && target.role != "site_owner"))

    var pmInput by remember { mutableStateOf("") }
    var modReason by remember { mutableStateOf("مخالفة قوانين الغرفة") }

    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(20.dp), color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AvatarWithFrame(target.avatarUrl, target.shownName, target.avatarFrame, size = 76.dp, showOnlineDot = true, isOnline = target.isOnline)
                StyledChatName(
                    name = target.shownName,
                    nameColorHex = target.nameColor,
                    nameplateStyle = target.nameplateStyle,
                    nameShine = target.nameShine,
                    fontFamilyName = target.fontFamily,
                    vipWings = target.vipWings,
                    nameBgColorHex = target.nameBgColor,
                    neonColorHex = target.neonColor
                )
                StyledRankBadge(targetRank)
                if (target.bio.isNotBlank()) {
                    Text(target.bio, fontSize = 12.sp, color = Color(0xFF64748B))
                }
                if (target.profileMusic.isNotBlank()) {
                    OutlinedButton(onClick = { onPreviewMusic(target.profileMusic) }) {
                        Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("🎵 تشغيل موسيقى البروفايل", fontSize = 11.sp)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    StatPillCard("🪙 كوينز", target.coins.toString(), Modifier.weight(1f))
                    StatPillCard("🎁 هدايا", target.giftsReceived.toString(), Modifier.weight(1f))
                    StatPillCard("🔥 تفاعل", target.activityPoints.toString(), Modifier.weight(1f))
                }

                if (!isSelf) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = {
                                onDismiss()
                                onOpenSendGift()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                            modifier = Modifier.weight(1f).testTag("quick_send_gift_button")
                        ) {
                            Icon(Icons.Default.CardGiftcard, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Black)
                            Spacer(Modifier.width(4.dp))
                            Text("إرسال هدية", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = { onAddFriend(); onDismiss() },
                            modifier = Modifier.weight(1f).testTag("quick_add_friend_button")
                        ) {
                            Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("إضافة صديق", fontSize = 12.sp)
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedTextField(
                            value = pmInput,
                            onValueChange = { pmInput = it },
                            placeholder = { Text("رسالة خاصة سريعة...") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        IconButton(
                            onClick = {
                                if (pmInput.isNotBlank()) {
                                    onSendPrivateMsg(pmInput)
                                    pmInput = ""
                                    onDismiss()
                                }
                            },
                            modifier = Modifier.clip(CircleShape).background(RoyalBlue)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "إرسال خاص", tint = Color.White)
                        }
                    }

                    if (canMod && (myRank.permSetRank || myRank.permMute || myRank.permBan || isSupremeOwner)) {
                        HorizontalDivider()
                        Text("صلاحيات الإشراف والمالك", fontWeight = FontWeight.Bold, color = CrimsonOwner, fontSize = 13.sp)
                        if (isSupremeOwner || myRank.permSetRank) {
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                ranks.filter {
                                    isSupremeOwner || (it.power <= myRank.maxAssignableRank && it.key != "site_owner")
                                }.forEach { rk ->
                                    FilterChip(
                                        selected = target.role == rk.key,
                                        onClick = { onAssignRank(rk.key, rk.permAccessPanel || rk.permPublishNews || rk.permManageRooms) },
                                        label = { Text("${rk.icon} ${rk.label}", fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                        OutlinedTextField(
                            value = modReason,
                            onValueChange = { modReason = it },
                            label = { Text("سبب الإجراء") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            if (isSupremeOwner || myRank.permMute) {
                                OutlinedButton(onClick = { onMute(modReason); onDismiss() }, modifier = Modifier.weight(1f)) {
                                    Text("كتم في الغرفة")
                                }
                            }
                            if (isSupremeOwner || myRank.permBan) {
                                Button(
                                    onClick = { onBan(modReason); onDismiss() },
                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonOwner),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Block, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("حظر الحساب")
                                }
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = { onReport("إبلاغ على العضو ${target.shownName}"); onDismiss() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Report, contentDescription = null, tint = Color(0xFFEA580C), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("إبلاغ الإدارة", color = Color(0xFFEA580C))
                    }
                }
            }
        }
    }
}

@Composable
fun SendGiftDialog(
    recipient: PublicProfile,
    myCoins: Long,
    onDismiss: () -> Unit,
    onSendGift: (GiftCatalogItem) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(20.dp), color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🎁 إهداء ${recipient.shownName}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("🪙 $myCoins", color = RoyalGold, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(10.dp))
                LazyColumn(
                    modifier = Modifier.heightIn(max = 380.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(DefaultCatalogs.giftCatalog) { gift ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(enabled = myCoins >= gift.cost) {
                                    onSendGift(gift)
                                    onDismiss()
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(gift.emoji, fontSize = 26.sp)
                                    Column {
                                        Text(gift.name, fontWeight = FontWeight.Bold)
                                        Text("الفئة: ${gift.tier} • مكافأة: +${gift.reward}", fontSize = 11.sp, color = Color(0xFF64748B))
                                    }
                                }
                                Button(
                                    onClick = { onSendGift(gift); onDismiss() },
                                    enabled = myCoins >= gift.cost,
                                    colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                                ) {
                                    Text("${gift.cost} 🪙", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun LeaderboardsDialog(
    profiles: List<PublicProfile>,
    rooms: List<ChatRoom>,
    ranks: List<RankConfig>,
    initialTab: Int = 0,
    onDismiss: () -> Unit,
    onUserClick: (PublicProfile) -> Unit
) {
    var tab by remember { mutableIntStateOf(initialTab) }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = Color.White,
            modifier = Modifier.fillMaxWidth(0.94f).heightIn(max = 600.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().background(RoyalBlue).padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🏆 قوائم الصدارة والتميز", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White) }
                }
                val titles = listOf("الأثرياء 🪙", "الكبار 🎁", "تفاعل الأعضاء 🔥", "تفاعل الغرف 💬")
                PrimaryScrollableTabRow(selectedTabIndex = tab) {
                    titles.forEachIndexed { idx, t ->
                        Tab(selected = tab == idx, onClick = { tab = idx }, text = { Text(t, fontWeight = FontWeight.Bold) })
                    }
                }
                LazyColumn(
                    modifier = Modifier.weight(1f).padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (tab < 3) {
                        val sorted = when (tab) {
                            0 -> profiles.sortedByDescending { it.coins }
                            1 -> profiles.sortedByDescending { it.giftsReceived }
                            else -> profiles.sortedByDescending { it.activityPoints }
                        }.take(25)
                        items(sorted) { u ->
                            val rk = DefaultCatalogs.rankFor(u.role, ranks)
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                modifier = Modifier.fillMaxWidth().clickable { onDismiss(); onUserClick(u) }
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    AvatarWithFrame(u.avatarUrl, u.shownName, u.avatarFrame, size = 40.dp)
                                    Column(modifier = Modifier.weight(1f)) {
                                        StyledChatName(u.shownName, u.nameColor, u.nameplateStyle, u.nameShine, u.fontFamily, u.vipWings)
                                        StyledRankBadge(rk)
                                    }
                                    Text(
                                        text = when (tab) {
                                            0 -> "${u.coins} 🪙"
                                            1 -> "${u.giftsReceived} 🎁"
                                            else -> "${u.activityPoints} 🔥"
                                        },
                                        fontWeight = FontWeight.Bold,
                                        color = RoyalBlue
                                    )
                                }
                            }
                        }
                    } else {
                        items(rooms.sortedByDescending { it.activityPoints }) { rm ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("${rm.icon} ${rm.name}", fontWeight = FontWeight.Bold)
                                    Text("${rm.activityPoints} نقطة", color = RoyalGold, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun SocialHubDialog(
    initialTab: Int,
    myUid: String,
    canPublishNews: Boolean,
    notifications: List<NotificationItem>,
    friendships: List<Friendship>,
    privateMessages: List<PrivateMessage>,
    wallPosts: List<WallPost>,
    newsPosts: List<NewsPost>,
    profiles: List<PublicProfile>,
    onDismiss: () -> Unit,
    onMarkNotifRead: (String) -> Unit,
    onAcceptFriend: (String) -> Unit,
    onRemoveFriend: (String) -> Unit,
    onSendPm: (PublicProfile, String) -> Unit,
    onCreateWallPost: (String) -> Unit,
    onLikeWallPost: (String) -> Unit,
    onPublishNews: (title: String, content: String, imageUrl: String) -> Unit
) {
    val context = LocalContext.current
    var tab by remember { mutableIntStateOf(initialTab) }
    var wallInput by remember { mutableStateOf("") }
    var pmPartner by remember { mutableStateOf(profiles.firstOrNull { it.userId != myUid }) }
    var pmDraft by remember { mutableStateOf("") }
    var showNewsComposer by remember { mutableStateOf(false) }
    var newsTitle by remember { mutableStateOf("") }
    var newsBody by remember { mutableStateOf("") }
    var newsImage by remember { mutableStateOf("") }
    val newsImgPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            encodeUriToSmallBase64(context, uri, 360)?.let { newsImage = it }
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = Color.White,
            modifier = Modifier.fillMaxWidth(0.95f).heightIn(max = 620.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().background(RoyalBlue).padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🌐 التفاعل والإشعارات والرسائل", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White) }
                }
                val titles = listOf("الإشعارات", "الأصدقاء", "الخاص", "الحائط", "الأخبار")
                PrimaryScrollableTabRow(selectedTabIndex = tab) {
                    titles.forEachIndexed { i, t -> Tab(selected = tab == i, onClick = { tab = i }, text = { Text(t, fontWeight = FontWeight.Bold) }) }
                }

                Column(modifier = Modifier.weight(1f).padding(12.dp)) {
                    when (tab) {
                        0 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (notifications.isEmpty()) item { Text("لا توجد إشعارات حالياً.", color = Color.Gray) }
                            items(notifications) { n ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = if (n.isRead) Color(0xFFF8FAFC) else Color(0xFFDBEAFE)),
                                    modifier = Modifier.fillMaxWidth().clickable { onMarkNotifRead(n.id) }
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(n.title, fontWeight = FontWeight.Bold, color = RoyalBlue)
                                        Text(n.body, fontSize = 13.sp)
                                    }
                                }
                            }
                        }

                        1 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (friendships.isEmpty()) item { Text("لا يوجد أصدقاء أو طلبات معلقة.", color = Color.Gray) }
                            items(friendships) { f ->
                                val otherName = if (f.requesterId == myUid) f.targetName else f.requesterName
                                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text(otherName, fontWeight = FontWeight.Bold)
                                            Text(if (f.status == "accepted") "صديق مقبول ✅" else "طلب صداقة معلق ⏳", fontSize = 11.sp, color = Color.Gray)
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            if (f.status == "pending" && f.targetId == myUid) {
                                                Button(onClick = { onAcceptFriend(f.id) }) { Text("قبول") }
                                            }
                                            OutlinedButton(onClick = { onRemoveFriend(f.id) }) { Text("إزالة") }
                                        }
                                    }
                                }
                            }
                        }

                        2 -> Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            val candidates = profiles.filter { it.userId != myUid }
                            if (candidates.isEmpty()) {
                                Text("لا يوجد أعضاء آخرون متصلون للمراسلة.", color = Color.Gray)
                            } else {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    candidates.take(4).forEach { c ->
                                        FilterChip(
                                            selected = pmPartner?.userId == c.userId,
                                            onClick = { pmPartner = c },
                                            label = { Text(c.shownName, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                                        )
                                    }
                                }
                                LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    val filtered = privateMessages.filter {
                                        val pid = pmPartner?.userId
                                        pid != null && (it.senderId == pid || it.receiverId == pid)
                                    }
                                    items(filtered) { pm ->
                                        Surface(
                                            color = if (pm.senderId == myUid) Color(0xFFDBEAFE) else Color(0xFFF1F5F9),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                Text(pm.senderName, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = RoyalBlue)
                                                Text(pm.content, fontSize = 13.sp)
                                            }
                                        }
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    OutlinedTextField(
                                        value = pmDraft,
                                        onValueChange = { pmDraft = it },
                                        placeholder = { Text("اكتب رسالة خاصة...") },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    IconButton(
                                        onClick = {
                                            val partner = pmPartner
                                            if (partner != null && pmDraft.isNotBlank()) {
                                                onSendPm(partner, pmDraft)
                                                pmDraft = ""
                                            }
                                        },
                                        modifier = Modifier.clip(CircleShape).background(RoyalBlue)
                                    ) {
                                        Icon(Icons.Default.Mail, contentDescription = "إرسال", tint = Color.White)
                                    }
                                }
                            }
                        }

                        3 -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                OutlinedTextField(
                                    value = wallInput,
                                    onValueChange = { wallInput = it },
                                    placeholder = { Text("شارك منشوراً على حائط الأعضاء...") },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true
                                )
                                Button(onClick = {
                                    if (wallInput.isNotBlank()) {
                                        onCreateWallPost(wallInput)
                                        wallInput = ""
                                    }
                                }) { Text("نشر") }
                            }
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(wallPosts) { p ->
                                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(p.authorName, fontWeight = FontWeight.Bold, color = RoyalBlue)
                                            Text(p.content)
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                IconButton(onClick = { onLikeWallPost(p.id) }) {
                                                    Icon(Icons.Default.Favorite, contentDescription = "إعجاب", tint = Color(0xFFE11D48))
                                                }
                                                Text("${p.likesCount}", fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        else -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (canPublishNews) {
                                Button(
                                    onClick = { showNewsComposer = !showNewsComposer },
                                    colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue),
                                    modifier = Modifier.fillMaxWidth().testTag("open_publish_news_button")
                                ) {
                                    Text("➕ نشر خبر جديد", fontWeight = FontWeight.Bold)
                                }
                                if (showNewsComposer) {
                                    Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                            OutlinedTextField(value = newsTitle, onValueChange = { newsTitle = it }, label = { Text("عنوان الخبر") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                                            OutlinedTextField(value = newsBody, onValueChange = { newsBody = it }, label = { Text("تفاصيل الخبر") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                OutlinedButton(onClick = {
                                                    newsImgPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                                }, modifier = Modifier.weight(1f)) {
                                                    Text(if (newsImage.isBlank()) "📷 إرفاق صورة" else "صورة مرفقة ✅", fontSize = 11.sp)
                                                }
                                                Button(
                                                    onClick = {
                                                        if (newsTitle.isNotBlank() && newsBody.isNotBlank()) {
                                                            onPublishNews(newsTitle, newsBody, newsImage)
                                                            newsTitle = ""; newsBody = ""; newsImage = ""; showNewsComposer = false
                                                        }
                                                    },
                                                    modifier = Modifier.weight(1f)
                                                ) { Text("نشر الآن") }
                                            }
                                        }
                                    }
                                }
                            }
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (newsPosts.isEmpty()) item { Text("لا توجد أخبار منشورة بعد.", color = Color.Gray) }
                                items(newsPosts) { news ->
                                    val decodedNewsImg = remember(news.imageUrl) {
                                        if (news.imageUrl.startsWith("data:image")) {
                                            try {
                                                val b64 = news.imageUrl.substringAfter("base64,", "")
                                                val bytes = Base64.decode(b64, Base64.DEFAULT)
                                                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
                                            } catch (_: Exception) {
                                                null
                                            }
                                        } else null
                                    }
                                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB))) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("📰 ${news.title}", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                            Spacer(Modifier.height(4.dp))
                                            Text(news.content)
                                            if (decodedNewsImg != null) {
                                                Spacer(Modifier.height(6.dp))
                                                Image(
                                                    bitmap = decodedNewsImg,
                                                    contentDescription = news.title,
                                                    contentScale = ContentScale.Crop,
                                                    modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(10.dp))
                                                )
                                            }
                                            Spacer(Modifier.height(4.dp))
                                            Text("بواسطة: ${news.authorName}", fontSize = 11.sp, color = Color.Gray)
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RoomOwnerEditDialog(
    room: ChatRoom,
    onDismiss: () -> Unit,
    onSave: (name: String, welcome: String, bgTheme: String, micsEnabled: Boolean) -> Unit
) {
    var name by remember { mutableStateOf(room.name) }
    var welcome by remember { mutableStateOf(room.welcomeMessage) }
    var theme by remember { mutableStateOf(room.bgTheme) }
    var mics by remember { mutableStateOf(room.micsEnabled) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(18.dp), color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("👑 إدارة وتعديل الغرفة (مالك الغرفة)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = RoyalBlue)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("اسم الغرفة") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(value = welcome, onValueChange = { welcome = it }, label = { Text("رسالة الترحيب") }, modifier = Modifier.fillMaxWidth())
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    DefaultCatalogs.roomThemes.forEach { th ->
                        FilterChip(selected = theme == th.id, onClick = { theme = th.id }, label = { Text(th.label, fontSize = 11.sp) })
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("تفعيل المايكات الصوتية")
                    Switch(checked = mics, onCheckedChange = { mics = it })
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("إلغاء") }
                    Button(
                        onClick = { onSave(name, welcome, theme, mics); onDismiss() },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                    ) { Text("حفظ الغرفة") }
                }
            }
        }
    }
}

@Composable
fun ReportDialog(
    onDismiss: () -> Unit,
    onSubmit: (String) -> Unit
) {
    var reason by remember { mutableStateOf("") }
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(18.dp), color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("🚩 إرسال إبلاغ للإدارة", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("اكتب تفاصيل البلاغ") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("إلغاء") }
                    Button(
                        onClick = {
                            if (reason.trim().length >= 2) {
                                onSubmit(reason)
                                onDismiss()
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = CrimsonOwner)
                    ) { Text("إرسال البلاغ") }
                }
            }
        }
    }
}

@Composable
fun YoutubeRoomDialog(
    currentTitle: String,
    currentVideoId: String,
    onDismiss: () -> Unit,
    onApply: (videoIdOrUrl: String, title: String, playing: Boolean) -> Unit
) {
    var urlOrId by remember { mutableStateOf(currentVideoId) }
    var title by remember { mutableStateOf(currentTitle) }
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(18.dp), color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("▶️ مشغل يوتيوب الغرفة المشترك", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                OutlinedTextField(
                    value = urlOrId,
                    onValueChange = { urlOrId = it },
                    label = { Text("رابط أو معرف فيديو YouTube") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("عنوان المقطع") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { onApply("", "", false); onDismiss() },
                        modifier = Modifier.weight(1f)
                    ) { Text("إيقاف") }
                    Button(
                        onClick = {
                            onApply(urlOrId, title.ifBlank { "مقطع فيديو الغرفة" }, true)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                    ) { Text("تشغيل للغرفة") }
                }
            }
        }
    }
}
