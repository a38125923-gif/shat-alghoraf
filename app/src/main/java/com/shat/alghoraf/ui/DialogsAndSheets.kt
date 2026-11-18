package com.shat.alghoraf.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
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
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.shat.alghoraf.data.ChatRoom
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.Friendship
import com.shat.alghoraf.data.GiftCatalogItem
import com.shat.alghoraf.data.GiftTransaction
import com.shat.alghoraf.data.NewsPost
import com.shat.alghoraf.data.NotificationItem
import com.shat.alghoraf.data.PrivateMessage
import com.shat.alghoraf.data.PublicProfile
import com.shat.alghoraf.data.RankConfig
import com.shat.alghoraf.data.WallPost
import com.shat.alghoraf.data.YoutubeSearchResult
import com.shat.alghoraf.ui.theme.CodyHeaderNavy
import com.shat.alghoraf.ui.theme.CrimsonOwner
import com.shat.alghoraf.ui.theme.GreenAccent
import com.shat.alghoraf.ui.theme.RoyalBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.parseHexColor
import java.io.ByteArrayOutputStream
import java.util.Locale

/**
 * Preserves animated GIF frames natively when mime type is image/gif (<= 420KB),
 * and scales/compresses static images cleanly to stay within Firestore document bounds.
 */
fun encodeUriToSmallBase64(context: Context, uri: Uri, maxDim: Int = 256): String? {
    return try {
        val mime = context.contentResolver.getType(uri).orEmpty().lowercase(Locale.US)
        if (mime == "image/gif" || uri.toString().lowercase(Locale.US).endsWith(".gif")) {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            if (bytes != null && bytes.size <= 420_000) {
                val b64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                return "data:image/gif;base64,$b64"
            }
        }
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

private fun computeRankPositions(targetUid: String, allProfiles: List<PublicProfile>): Pair<Int, Int> {
    val byActivity = allProfiles.sortedByDescending { it.activityPoints }
    val byWealth = allProfiles.sortedByDescending { it.coins }
    val actPos = (byActivity.indexOfFirst { it.userId == targetUid }.takeIf { it >= 0 } ?: 0) + 1
    val wealthPos = (byWealth.indexOfFirst { it.userId == targetUid }.takeIf { it >= 0 } ?: 0) + 1
    return actPos to wealthPos
}

@OptIn(ExperimentalLayoutApi::class, androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun ProfileCustomizerDialog(
    profile: PublicProfile,
    allProfiles: List<PublicProfile>,
    friendships: List<Friendship>,
    giftTransactions: List<GiftTransaction>,
    wallPosts: List<WallPost>,
    isSupremeOwner: Boolean,
    ranks: List<RankConfig>,
    onDismiss: () -> Unit,
    onSave: (
        displayName: String,
        bio: String,
        avatarUrl: String,
        coverUrl: String,
        profileBgEffect: String,
        age: Long,
        gender: String,
        country: String,
        allowCalls: Boolean,
        allowPm: Boolean,
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
    onNotify: (String) -> Unit,
    onSignOut: () -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var styleSubTab by remember { mutableIntStateOf(0) }

    var displayName by remember { mutableStateOf(profile.shownName) }
    var bio by remember { mutableStateOf(profile.bio) }
    var avatarUrl by remember { mutableStateOf(profile.avatarUrl) }
    var coverUrl by remember { mutableStateOf(profile.coverUrl) }
    var profileBgEffect by remember { mutableStateOf(profile.profileBgEffect.ifBlank { "none" }) }
    var ageText by remember { mutableStateOf(if (profile.age > 0) profile.age.toString() else "") }
    var gender by remember { mutableStateOf(profile.gender) }
    var country by remember { mutableStateOf(profile.country) }
    var allowCalls by remember { mutableStateOf(profile.allowCalls) }
    var allowPm by remember { mutableStateOf(profile.allowPm) }

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

    fun triggerSave(av: String = avatarUrl, cov: String = coverUrl) {
        onSave(
            displayName, bio, av, cov, profileBgEffect,
            ageText.toLongOrNull()?.coerceIn(0L, 120L) ?: 0L,
            gender, country, allowCalls, allowPm,
            nameColor, textColor, nameBgColor, neonColor,
            fontFamily, "Normal", avatarFrame, nameplateStyle, nameShine,
            vipWings, profileMusic, vipFamily
        )
    }

    val avatarPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            encodeUriToSmallBase64(context, uri, 220)?.let { newUrl ->
                avatarUrl = newUrl
                triggerSave(av = newUrl)
            }
        }
    }

    val coverPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            encodeUriToSmallBase64(context, uri, 480)?.let { newCov ->
                coverUrl = newCov
                triggerSave(cov = newCov)
            }
        }
    }

    val myRank = DefaultCatalogs.rankFor(profile.role, ranks)
    val canUseAddons = isSupremeOwner || myRank.permUseAddons
    val (actRank, wealthRank) = remember(allProfiles, profile.userId) { computeRankPositions(profile.userId, allProfiles) }
    val avgRating = if (profile.ratingCount > 0) String.format(Locale.US, "%.1f", profile.ratingSum.toDouble() / profile.ratingCount) else "5.0"

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .heightIn(max = 660.dp),
            shape = RoundedCornerShape(22.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Luxury Social Cover Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(175.dp)
                ) {
                    AnimatedProfileBackground(
                        effectId = profileBgEffect,
                        modifier = Modifier.fillMaxSize()
                    )
                    if (coverUrl.startsWith("data:image") || coverUrl.startsWith("http")) {
                        DecodedOrGifImage(
                            modelUrl = coverUrl,
                            contentDescription = "صورة الغلاف",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0x55000000), Color(0xBB0B2239))
                                )
                            )
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Color(0x66000000),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.clickable {
                                coverPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Default.PhotoCamera, contentDescription = "تغيير الغلاف", tint = Color.White, modifier = Modifier.size(15.dp))
                                Text("غلاف GIF / صورة", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier.size(34.dp).clip(CircleShape).background(Color(0x66000000))
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }

                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box {
                            AvatarWithFrame(avatarUrl, displayName, avatarFrame, size = 74.dp, showOnlineDot = true)
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .size(26.dp)
                                    .clip(CircleShape)
                                    .background(RoyalGold)
                                    .border(1.5.dp, Color.White, CircleShape)
                                    .clickable {
                                        avatarPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                    }
                                    .testTag("pick_avatar_button"),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.PhotoCamera, contentDescription = "تغيير الصورة", tint = Color.Black, modifier = Modifier.size(14.dp))
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(displayName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            StyledRankBadge(myRank)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFFB7185), modifier = Modifier.size(13.dp))
                                Text("${profile.likesCount}", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                Icon(Icons.Default.Star, contentDescription = null, tint = RoyalGold, modifier = Modifier.size(13.dp))
                                Text("$avgRating (${profile.ratingCount})", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // 6 Authentic CodyChat Tabs
                val tabs = listOf("المعلومات", "الأصدقاء", "الهدايا", "العلاقات", "المنشورات", "المزيد")
                PrimaryScrollableTabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { idx, title ->
                        Tab(
                            selected = selectedTab == idx,
                            onClick = { selectedTab = idx },
                            text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.5.sp) }
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    when (selectedTab) {
                        // Tab 0: المعلومات
                        0 -> {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                StatPillCard("ترتيب التفاعل", "#$actRank", Modifier.weight(1f))
                                StatPillCard("ترتيب الأثرياء", "#$wealthRank", Modifier.weight(1f))
                                StatPillCard("الكوينز", "${profile.coins}", Modifier.weight(1f))
                            }

                            Surface(
                                color = Color(0xFFF8FAFC),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                                    .clickable {
                                        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        cm.setPrimaryClip(ClipData.newPlainText("profile_link", "https://shat-alghoraf.app/u/${profile.username}"))
                                        onNotify("تم نسخ رابط الملف الشخصي ✅")
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("رابط الحساب: shat-alghoraf.app/u/${profile.username}", fontSize = 11.5.sp, color = RoyalBlue, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                                    Icon(Icons.Default.ContentCopy, contentDescription = "نسخ الرابط", tint = RoyalBlue, modifier = Modifier.size(16.dp))
                                }
                            }

                            OutlinedTextField(
                                value = displayName,
                                onValueChange = { displayName = it },
                                label = { Text("الاسم المستعار") },
                                modifier = Modifier.fillMaxWidth().testTag("profile_name_input"),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = bio,
                                onValueChange = { bio = it },
                                label = { Text("النبذة / الحالة الشخصية") },
                                modifier = Modifier.fillMaxWidth(),
                                maxLines = 2
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = ageText,
                                    onValueChange = { if (it.all { ch -> ch.isDigit() } && it.length <= 3) ageText = it },
                                    label = { Text("العمر") },
                                    modifier = Modifier.weight(0.8f),
                                    singleLine = true
                                )
                                OutlinedTextField(
                                    value = gender,
                                    onValueChange = { gender = it },
                                    label = { Text("الجنس") },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true
                                )
                                OutlinedTextField(
                                    value = country,
                                    onValueChange = { country = it },
                                    label = { Text("البلد") },
                                    modifier = Modifier.weight(1.2f),
                                    singleLine = true
                                )
                            }
                            OutlinedTextField(
                                value = vipFamily,
                                onValueChange = { vipFamily = it },
                                label = { Text("العائلة / الشلة VIP") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = if (avatarUrl.startsWith("http")) avatarUrl else "",
                                onValueChange = { if (it.isBlank() || it.startsWith("http")) avatarUrl = it },
                                label = { Text("رابط صورة شخصية GIF / URL") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = if (coverUrl.startsWith("http")) coverUrl else "",
                                onValueChange = { if (it.isBlank() || it.startsWith("http")) coverUrl = it },
                                label = { Text("رابط صورة غلاف GIF / URL") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                        }

                        // Tab 1: الأصدقاء
                        1 -> {
                            val accepted = friendships.filter { it.status == "accepted" }
                            Text("قائمة الأصدقاء (${accepted.size})", fontWeight = FontWeight.Bold, color = RoyalBlue)
                            if (accepted.isEmpty()) {
                                Text("لا يوجد أصدقاء مقبولون بعد.", color = Color.Gray, fontSize = 13.sp)
                            } else {
                                accepted.forEach { f ->
                                    val otherName = if (f.requesterId == profile.userId) f.targetName else f.requesterName
                                    val otherAvatar = if (f.requesterId == profile.userId) f.targetAvatar else f.requesterAvatar
                                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                        Row(modifier = Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            AvatarWithFrame(otherAvatar, otherName, "none", size = 38.dp)
                                            Text(otherName, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        // Tab 2: الهدايا
                        2 -> {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                StatPillCard("المستلمة", profile.giftsReceived.toString(), Modifier.weight(1f))
                                StatPillCard("المرسلة", profile.giftsSent.toString(), Modifier.weight(1f))
                                StatPillCard("الكوينز", profile.coins.toString(), Modifier.weight(1f))
                            }
                            val myReceived = giftTransactions.filter { it.recipientId == profile.userId }
                            Text("آخر الهدايا المستلمة (${myReceived.size}):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            if (myReceived.isEmpty()) {
                                DefaultCatalogs.giftCatalog.take(6).forEach { gift ->
                                    Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                        Row(modifier = Modifier.padding(10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("${gift.emoji} ${gift.name} (${gift.tier})", fontWeight = FontWeight.SemiBold)
                                            Text("${gift.cost} كوينز", color = RoyalGold, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            } else {
                                myReceived.take(15).forEach { tx ->
                                    Surface(color = Color(0xFFFFFBEB), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                        Row(modifier = Modifier.padding(10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("${tx.giftEmoji} ${tx.giftName} من ${tx.senderName}", fontWeight = FontWeight.SemiBold)
                                            Text("+${tx.reward} كوينز", color = RoyalGold, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        // Tab 3: العلاقات
                        3 -> {
                            val acceptedCount = friendships.count { it.status == "accepted" }
                            val pendingCount = friendships.count { it.status == "pending" }
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                Column(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("روابط العائلة والعضوية", fontWeight = FontWeight.Bold, color = RoyalBlue)
                                    Text("العائلة / الشلة: ${vipFamily.ifBlank { "غير محددة" }}", fontSize = 13.sp)
                                    Text("الأصدقاء المقربون: $acceptedCount", fontSize = 13.sp)
                                    Text("طلبات معلقة: $pendingCount", fontSize = 13.sp)
                                    Text("نقاط التفاعل الاجتماعي: ${profile.activityPoints}", fontSize = 13.sp, color = RoyalGold, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // Tab 4: المنشورات
                        4 -> {
                            val myPosts = wallPosts.filter { it.authorId == profile.userId }
                            Text("منشورات الحائط (${myPosts.size})", fontWeight = FontWeight.Bold, color = RoyalBlue)
                            if (myPosts.isEmpty()) {
                                Text("لم تقم بنشر أي منشورات على الحائط بعد.", color = Color.Gray, fontSize = 13.sp)
                            } else {
                                myPosts.forEach { p ->
                                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                        Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                                            Text(p.content, fontSize = 13.sp)
                                            Text("${p.likesCount} إعجاب", fontSize = 11.sp, color = CrimsonOwner)
                                        }
                                    }
                                }
                            }
                        }

                        // Tab 5: المزيد (إدارة الاسم، الخط، الخلفيات المتحركة، الأمان، الخصوصية، المالك)
                        else -> {
                            // Live Name Preview
                            Surface(
                                color = Color(0xFFF8FAFC),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth().border(1.dp, RoyalGold.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            ) {
                                Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    AvatarWithFrame(avatarUrl, displayName, avatarFrame, size = 44.dp, showOnlineDot = true)
                                    Column {
                                        Text("معاينة فورية داخل الغرفة:", fontSize = 10.sp, color = Color.Gray)
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

                            // 3 Sub-Tabs for Name Styling: لون | نيون | خلفية
                            Text("تخصيص لون الاسم:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                listOf("لون", "نيون", "خلفية").forEachIndexed { i, title ->
                                    FilterChip(selected = styleSubTab == i, onClick = { styleSubTab = i }, label = { Text(title) })
                                }
                            }
                            when (styleSubTab) {
                                0 -> FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    DefaultCatalogs.colorPalette.forEach { hex ->
                                        Box(
                                            modifier = Modifier
                                                .size(30.dp)
                                                .clip(CircleShape)
                                                .background(parseHexColor(hex, RoyalBlue))
                                                .border(if (nameColor == hex) 3.dp else 1.dp, if (nameColor == hex) Color.Black else Color.LightGray, CircleShape)
                                                .clickable { nameColor = hex }
                                        )
                                    }
                                }
                                1 -> FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    FilterChip(selected = neonColor.isBlank(), onClick = { neonColor = "" }, label = { Text("بدون") })
                                    DefaultCatalogs.colorPalette.take(9).forEach { hex ->
                                        Box(
                                            modifier = Modifier
                                                .size(28.dp)
                                                .clip(CircleShape)
                                                .background(parseHexColor(hex, RoyalGold))
                                                .border(if (neonColor == hex) 3.dp else 1.dp, if (neonColor == hex) Color.Black else Color.LightGray, CircleShape)
                                                .clickable { neonColor = hex }
                                        )
                                    }
                                }
                                else -> FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    FilterChip(selected = nameBgColor.isBlank(), onClick = { nameBgColor = "" }, label = { Text("شفاف") })
                                    DefaultCatalogs.colorPalette.take(9).forEach { hex ->
                                        Box(
                                            modifier = Modifier
                                                .size(28.dp)
                                                .clip(CircleShape)
                                                .background(parseHexColor(hex, RoyalBlue))
                                                .border(if (nameBgColor == hex) 3.dp else 1.dp, if (nameBgColor == hex) Color.Black else Color.LightGray, CircleShape)
                                                .clickable { nameBgColor = hex }
                                        )
                                    }
                                }
                            }

                            Text("لون النص والخط:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                DefaultCatalogs.colorPalette.take(10).forEach { hex ->
                                    Box(
                                        modifier = Modifier
                                            .size(26.dp)
                                            .clip(CircleShape)
                                            .background(parseHexColor(hex, Color.Black))
                                            .border(if (textColor == hex) 3.dp else 1.dp, if (textColor == hex) RoyalGold else Color.LightGray, CircleShape)
                                            .clickable { textColor = hex }
                                    )
                                }
                            }
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.fontFamilies.forEach { ff ->
                                    FilterChip(selected = fontFamily == ff, onClick = { fontFamily = ff }, label = { Text(ff, fontSize = 11.sp) })
                                }
                            }

                            HorizontalDivider()
                            Text("خلفيات البطاقة المتحركة (Canvas Effects):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.profileBackgroundEffects.forEach { fx ->
                                    FilterChip(
                                        selected = profileBgEffect == fx.id,
                                        enabled = canUseAddons || fx.id == "none",
                                        onClick = { profileBgEffect = fx.id },
                                        label = { Text(fx.label, fontSize = 11.sp) }
                                    )
                                }
                            }

                            Text("إطار الصورة الملكي (يظهر في الغرفة والملف):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.avatarFrames.forEach { opt ->
                                    FilterChip(
                                        selected = avatarFrame == opt.id,
                                        enabled = canUseAddons || opt.id == "none",
                                        onClick = { avatarFrame = opt.id },
                                        label = { Text(opt.label, fontSize = 11.sp) }
                                    )
                                }
                            }

                            Text("لوحة الاسم ولمعة الاسم:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.nameplateStyles.forEach { opt ->
                                    FilterChip(
                                        selected = nameplateStyle == opt.id,
                                        enabled = canUseAddons || opt.id == "default",
                                        onClick = { nameplateStyle = opt.id },
                                        label = { Text(opt.label, fontSize = 11.sp) }
                                    )
                                }
                            }
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.nameShineOptions.forEach { opt ->
                                    FilterChip(
                                        selected = nameShine == opt.id,
                                        enabled = canUseAddons || opt.id == "none",
                                        onClick = { nameShine = opt.id },
                                        label = { Text(opt.label, fontSize = 11.sp) }
                                    )
                                }
                            }

                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("أجنحة VIP بجانب الاسم", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Switch(checked = vipWings, enabled = canUseAddons, onCheckedChange = { vipWings = it })
                            }

                            Text("موسيقى البروفايل:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                DefaultCatalogs.profileMusicPresets.forEach { opt ->
                                    FilterChip(
                                        selected = profileMusic == opt.id,
                                        onClick = {
                                            profileMusic = opt.id
                                            if (opt.id.isNotBlank()) onPreviewMusic(opt.id)
                                        },
                                        label = { Text(opt.label, fontSize = 11.sp) },
                                        leadingIcon = { Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(14.dp)) }
                                    )
                                }
                            }

                            HorizontalDivider()
                            Text("الخصوصية والأمان:", fontWeight = FontWeight.Bold, color = RoyalBlue, fontSize = 13.sp)
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("السماح بالرسائل الخاصة", fontSize = 13.sp)
                                Switch(checked = allowPm, onCheckedChange = { allowPm = it })
                            }
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("السماح بطلبات المايك والمكالمات", fontSize = 13.sp)
                                Switch(checked = allowCalls, onCheckedChange = { allowCalls = it })
                            }
                            Surface(color = Color(0xFFF1F5F9), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.Security, contentDescription = null, tint = RoyalBlue, modifier = Modifier.size(18.dp))
                                    Text("الحساب مؤمّن ومرتبط بتسجيل الدخول عبر Google (Credential Manager).", fontSize = 11.5.sp, color = Color(0xFF475569))
                                }
                            }

                            if (myRank.permAccessPanel || isSupremeOwner) {
                                Button(
                                    onClick = {
                                        onDismiss()
                                        onOpenAdminPanel()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonOwner),
                                    modifier = Modifier.fillMaxWidth().testTag("open_admin_panel_button")
                                ) {
                                    Icon(Icons.Default.AdminPanelSettings, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("فتح لوحة تحكم الإدارة والمالك", fontWeight = FontWeight.Bold)
                                }
                            }

                            if (isSupremeOwner) {
                                Surface(color = Color(0xFFFEF3C7), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Icon(Icons.Default.VisibilityOff, contentDescription = null, tint = Color(0xFF92400E))
                                            Text("وضع التخفي للمالك الأعلى", fontWeight = FontWeight.Bold, fontSize = 13.sp)
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
                                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = CrimsonOwner, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("تسجيل الخروج من الحساب", color = CrimsonOwner)
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
                            triggerSave()
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

@OptIn(ExperimentalLayoutApi::class, androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun QuickUserCardDialog(
    target: PublicProfile,
    myProfile: PublicProfile,
    allProfiles: List<PublicProfile>,
    friendships: List<Friendship>,
    giftTransactions: List<GiftTransaction>,
    wallPosts: List<WallPost>,
    ranks: List<RankConfig>,
    isSupremeOwner: Boolean,
    onDismiss: () -> Unit,
    onOpenSendGift: () -> Unit,
    onSendPrivateMsg: (String) -> Unit,
    onAddFriend: () -> Unit,
    onInteractProfile: (addLike: Boolean, stars: Int) -> Unit,
    onReport: (String) -> Unit,
    onAssignRank: (String, Boolean) -> Unit,
    onKickUser: () -> Unit,
    onMute: (String) -> Unit,
    onSetGhosted: (Boolean) -> Unit,
    onBan: (String) -> Unit,
    onXBan: (String) -> Unit,
    onGiveCoins: (Long) -> Unit,
    onDeletePermanently: () -> Unit,
    onPreviewMusic: (String) -> Unit
) {
    val context = LocalContext.current
    val targetRank = DefaultCatalogs.rankFor(target.role, ranks)
    val myRank = DefaultCatalogs.rankFor(myProfile.role, ranks)
    val isSelf = target.userId == myProfile.userId
    val canMod = !isSelf && (isSupremeOwner || (myRank.power > targetRank.power && target.role != "site_owner"))

    var selectedTab by remember { mutableIntStateOf(0) }
    var modMenuExpanded by remember { mutableStateOf(false) }
    var pmInput by remember { mutableStateOf("") }
    var modReason by remember { mutableStateOf("مخالفة قوانين الغرفة") }
    val (actRank, wealthRank) = remember(allProfiles, target.userId) { computeRankPositions(target.userId, allProfiles) }
    val avgRating = if (target.ratingCount > 0) String.format(Locale.US, "%.1f", target.ratingSum.toDouble() / target.ratingCount) else "5.0"

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = Color.White,
            modifier = Modifier.fillMaxWidth(0.95f).heightIn(max = 660.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Luxury Cover Header
                Box(modifier = Modifier.fillMaxWidth().height(175.dp)) {
                    AnimatedProfileBackground(
                        effectId = target.profileBgEffect.ifBlank { "none" },
                        modifier = Modifier.fillMaxSize()
                    )
                    if (target.coverUrl.startsWith("data:image") || target.coverUrl.startsWith("http")) {
                        DecodedOrGifImage(
                            modelUrl = target.coverUrl,
                            contentDescription = "صورة غلاف ${target.shownName}",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0x44000000), Color(0xBB0B2239)))))

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (canMod) {
                            Box {
                                Surface(
                                    color = CrimsonOwner,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.clickable { modMenuExpanded = true }.testTag("member_moderation_menu")
                                ) {
                                    Row(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Icon(Icons.Default.Menu, contentDescription = "إجراءات الإدارة", tint = Color.White, modifier = Modifier.size(16.dp))
                                        Text("إدارة العضو", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                DropdownMenu(expanded = modMenuExpanded, onDismissRequest = { modMenuExpanded = false }) {
                                    if (isSupremeOwner || myRank.permKick) {
                                        DropdownMenuItem(
                                            leadingIcon = { Icon(Icons.Default.Gavel, contentDescription = null) },
                                            text = { Text("طرد من الغرفة") },
                                            onClick = { modMenuExpanded = false; onKickUser(); onDismiss() }
                                        )
                                    }
                                    if (isSupremeOwner || myRank.permMute) {
                                        DropdownMenuItem(
                                            leadingIcon = { Icon(Icons.Default.VolumeOff, contentDescription = null) },
                                            text = { Text("كتم في الغرفة") },
                                            onClick = { modMenuExpanded = false; onMute(modReason); onDismiss() }
                                        )
                                    }
                                    DropdownMenuItem(
                                        leadingIcon = { Icon(Icons.Default.VisibilityOff, contentDescription = null) },
                                        text = { Text(if (target.isGhosted) "إلغاء وضع الشبح" else "تجميد / وضع الشبح") },
                                        onClick = { modMenuExpanded = false; onSetGhosted(!target.isGhosted); onDismiss() }
                                    )
                                    if (isSupremeOwner || myRank.permBan) {
                                        DropdownMenuItem(
                                            leadingIcon = { Icon(Icons.Default.Block, contentDescription = null, tint = CrimsonOwner) },
                                            text = { Text("إكس باند (حظر جهاز X-Ban)", color = CrimsonOwner) },
                                            onClick = { modMenuExpanded = false; onXBan(modReason); onDismiss() }
                                        )
                                        DropdownMenuItem(
                                            leadingIcon = { Icon(Icons.Default.Block, contentDescription = null, tint = CrimsonOwner) },
                                            text = { Text("حظر الحساب نهائياً", color = CrimsonOwner) },
                                            onClick = { modMenuExpanded = false; onBan(modReason); onDismiss() }
                                        )
                                    }
                                    if (isSupremeOwner) {
                                        DropdownMenuItem(
                                            leadingIcon = { Icon(Icons.Default.MonetizationOn, contentDescription = null, tint = RoyalGold) },
                                            text = { Text("منح +500 كوينز") },
                                            onClick = { modMenuExpanded = false; onGiveCoins(500L) }
                                        )
                                        if (target.role != "site_owner") {
                                            DropdownMenuItem(
                                                leadingIcon = { Icon(Icons.Default.DeleteForever, contentDescription = null, tint = CrimsonOwner) },
                                                text = { Text("حذف حساب العضو نهائياً", color = CrimsonOwner, fontWeight = FontWeight.Bold) },
                                                onClick = { modMenuExpanded = false; onDeletePermanently(); onDismiss() }
                                            )
                                        }
                                    }
                                }
                            }
                        } else {
                            Spacer(Modifier.width(10.dp))
                        }

                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier.size(34.dp).clip(CircleShape).background(Color(0x66000000))
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }

                    Column(
                        modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AvatarWithFrame(target.avatarUrl, target.shownName, target.avatarFrame, size = 72.dp, showOnlineDot = true, isOnline = target.isOnline)
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(target.shownName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            StyledRankBadge(targetRank)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = Color(0x55E11D48),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.clickable(enabled = !isSelf) { onInteractProfile(true, 0) }
                            ) {
                                Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Icon(Icons.Default.Favorite, contentDescription = "إعجاب", tint = Color(0xFFFB7185), modifier = Modifier.size(13.dp))
                                    Text("${target.likesCount}", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                (1..5).forEach { s ->
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = "تقييم $s نجوم",
                                        tint = RoyalGold,
                                        modifier = Modifier.size(15.dp).clickable(enabled = !isSelf) { onInteractProfile(false, s) }
                                    )
                                }
                                Spacer(Modifier.width(3.dp))
                                Text(avgRating, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // 6 Tabs matching CodyChat profile standard
                val tabs = listOf("المعلومات", "الأصدقاء", "الهدايا", "العلاقات", "المنشورات", "المزيد")
                PrimaryScrollableTabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { idx, title ->
                        Tab(selected = selectedTab == idx, onClick = { selectedTab = idx }, text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.5.sp) })
                    }
                }

                Column(
                    modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    when (selectedTab) {
                        0 -> {
                            if (target.bio.isNotBlank()) {
                                Text(target.bio, fontSize = 13.sp, color = Color(0xFF475569))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                StatPillCard("ترتيب التفاعل", "#$actRank", Modifier.weight(1f))
                                StatPillCard("ترتيب الأثرياء", "#$wealthRank", Modifier.weight(1f))
                                StatPillCard("الكوينز", target.coins.toString(), Modifier.weight(1f))
                            }
                            Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("العمر: ${if (target.age > 0) target.age else "غير محدد"} • الجنس: ${target.gender.ifBlank { "غير محدد" }}", fontSize = 12.5.sp)
                                    Text("البلد: ${target.country.ifBlank { "غير محدد" }} • العائلة: ${target.vipFamily.ifBlank { "—" }}", fontSize = 12.5.sp)
                                }
                            }
                            if (target.profileMusic.isNotBlank()) {
                                OutlinedButton(onClick = { onPreviewMusic(target.profileMusic) }, modifier = Modifier.fillMaxWidth()) {
                                    Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("تشغيل موسيقى البروفايل", fontSize = 12.sp)
                                }
                            }
                            if (!isSelf) {
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    Button(
                                        onClick = { onDismiss(); onOpenSendGift() },
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
                                if (target.allowPm || isSupremeOwner) {
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
                                }
                                if (canMod && (isSupremeOwner || myRank.permSetRank)) {
                                    HorizontalDivider()
                                    Text("تغيير الرتبة السريع:", fontWeight = FontWeight.Bold, color = RoyalBlue, fontSize = 12.sp)
                                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        ranks.filter {
                                            isSupremeOwner || (it.power <= myRank.maxAssignableRank && it.key != "site_owner")
                                        }.forEach { rk ->
                                            FilterChip(
                                                selected = target.role == rk.key,
                                                onClick = { onAssignRank(rk.key, rk.permAccessPanel || rk.permPublishNews || rk.permManageRooms) },
                                                label = { Text(rk.label, fontSize = 11.sp) }
                                            )
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
                        1 -> {
                            val mutual = friendships.filter { it.status == "accepted" && target.userId in it.participants }
                            Text("الأصدقاء (${mutual.size})", fontWeight = FontWeight.Bold, color = RoyalBlue)
                            if (mutual.isEmpty()) Text("لا توجد صداقات ظاهرة.", color = Color.Gray, fontSize = 13.sp)
                            mutual.forEach { f ->
                                val other = if (f.requesterId == target.userId) f.targetName else f.requesterName
                                Text("• $other", fontWeight = FontWeight.SemiBold)
                            }
                        }
                        2 -> {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                StatPillCard("المستلمة", target.giftsReceived.toString(), Modifier.weight(1f))
                                StatPillCard("المرسلة", target.giftsSent.toString(), Modifier.weight(1f))
                            }
                            val rec = giftTransactions.filter { it.recipientId == target.userId }
                            if (rec.isEmpty()) Text("لا توجد هدايا مسجلة بعد.", color = Color.Gray, fontSize = 13.sp)
                            rec.take(12).forEach { tx ->
                                Text("${tx.giftEmoji} ${tx.giftName} — من ${tx.senderName}", fontSize = 13.sp)
                            }
                        }
                        3 -> {
                            Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("العائلة / الشلة: ${target.vipFamily.ifBlank { "بدون عائلة" }}", fontWeight = FontWeight.Bold)
                                    Text("نقاط التفاعل: ${target.activityPoints}")
                                    Text("عدد الإعجابات: ${target.likesCount}")
                                }
                            }
                        }
                        4 -> {
                            val posts = wallPosts.filter { it.authorId == target.userId }
                            if (posts.isEmpty()) Text("لا توجد منشورات لهذا العضو.", color = Color.Gray, fontSize = 13.sp)
                            posts.forEach { p ->
                                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                                    Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                                        Text(p.content, fontSize = 13.sp)
                                        Text("${p.likesCount} إعجاب", fontSize = 11.sp, color = CrimsonOwner)
                                    }
                                }
                            }
                        }
                        else -> {
                            Surface(color = Color(0xFFF8FAFC), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("المعرف: ${target.username}", fontWeight = FontWeight.Bold)
                                    Text("استقبال الخاص: ${if (target.allowPm) "متاح" else "مغلق"}")
                                    Text("استقبال المكالمات: ${if (target.allowCalls) "متاح" else "مغلق"}")
                                    if (canMod) {
                                        OutlinedTextField(
                                            value = modReason,
                                            onValueChange = { modReason = it },
                                            label = { Text("سبب الإجراء الإداري (للطرد/الكتم/الحظر)") },
                                            modifier = Modifier.fillMaxWidth(),
                                            singleLine = true
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
                    Text("إهداء ${recipient.shownName}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("$myCoins كوينز", color = RoyalGold, fontWeight = FontWeight.Bold)
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
                                    Text("${gift.cost}", fontSize = 12.sp)
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
                    Text("قوائم الصدارة والتميز", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White) }
                }
                val titles = listOf("الأثرياء", "الكبار", "تفاعل الأعضاء", "تفاعل الغرف")
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
                                            0 -> "${u.coins} كوينز"
                                            1 -> "${u.giftsReceived} هدية"
                                            else -> "${u.activityPoints} نقطة"
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
                                    Text(rm.name, fontWeight = FontWeight.Bold)
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
                    Text("التفاعل والإشعارات والرسائل", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
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
                                            Text(if (f.status == "accepted") "صديق مقبول" else "طلب صداقة معلق", fontSize = 11.sp, color = Color.Gray)
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
                                    Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("نشر خبر جديد", fontWeight = FontWeight.Bold)
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
                                                    Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                                                    Spacer(Modifier.width(4.dp))
                                                    Text(if (newsImage.isBlank()) "إرفاق صورة" else "صورة مرفقة", fontSize = 11.sp)
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
                                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB))) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Icon(Icons.Default.Newspaper, contentDescription = null, tint = RoyalBlue, modifier = Modifier.size(18.dp))
                                                Text(news.title, fontWeight = FontWeight.Bold, color = RoyalBlue)
                                            }
                                            Spacer(Modifier.height(4.dp))
                                            Text(news.content)
                                            if (news.imageUrl.startsWith("data:image") || news.imageUrl.startsWith("http")) {
                                                Spacer(Modifier.height(6.dp))
                                                DecodedOrGifImage(
                                                    modelUrl = news.imageUrl,
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
                Text("إدارة وتعديل الغرفة (مالك الغرفة)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = RoyalBlue)
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
                Text("إرسال إبلاغ للإدارة", fontWeight = FontWeight.Bold, fontSize = 16.sp)
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
    searchResults: List<YoutubeSearchResult>,
    isSearching: Boolean,
    onSearch: (String) -> Unit,
    onDismiss: () -> Unit,
    onApply: (videoIdOrUrl: String, title: String, playing: Boolean) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var urlOrId by remember { mutableStateOf(currentVideoId) }
    var title by remember { mutableStateOf(currentTitle) }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(shape = RoundedCornerShape(18.dp), color = Color.White, modifier = Modifier.fillMaxWidth(0.94f).heightIn(max = 600.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("مشغل يوتيوب الغرفة المباشر", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = RoyalBlue)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "إغلاق") }
                }

                // Live YouTube Search by Song / Video Name
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        label = { Text("ابحث باسم الأغنية أو الفيديو...") },
                        modifier = Modifier.weight(1f).testTag("youtube_search_input"),
                        singleLine = true
                    )
                    Button(
                        onClick = { onSearch(searchQuery) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                        modifier = Modifier.testTag("youtube_search_button")
                    ) {
                        Icon(Icons.Default.Search, contentDescription = "بحث", tint = Color.White)
                    }
                }

                if (isSearching) {
                    Box(modifier = Modifier.fillMaxWidth().padding(10.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFFDC2626), modifier = Modifier.size(28.dp))
                    }
                } else if (searchResults.isNotEmpty()) {
                    Text("نتائج البحث (اضغط للتشغيل الفوري بالغرفة):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = RoyalBlue)
                    LazyColumn(modifier = Modifier.heightIn(max = 210.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(searchResults) { item ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        onApply(item.videoId, item.title, true)
                                        onDismiss()
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    AsyncImage(
                                        model = item.thumbnailUrl,
                                        contentDescription = item.title,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.size(64.dp, 44.dp).clip(RoundedCornerShape(6.dp))
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                        Text(item.channel, fontSize = 10.sp, color = Color.Gray)
                                    }
                                    Icon(Icons.Default.PlayArrow, contentDescription = "تشغيل", tint = Color(0xFFDC2626))
                                }
                            }
                        }
                    }
                }

                HorizontalDivider()
                OutlinedTextField(
                    value = urlOrId,
                    onValueChange = { urlOrId = it },
                    label = { Text("أو أدخل رابط / معرف YouTube يدوياً") },
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
                    ) { Text("إيقاف للغرفة") }
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
