package com.shat.alghoraf.ui

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.util.Base64
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.shat.alghoraf.data.ChatMessage
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.RankConfig
import com.shat.alghoraf.data.RoomMicSlot
import com.shat.alghoraf.ui.theme.CairoFontFamily
import com.shat.alghoraf.ui.theme.CrimsonOwner
import com.shat.alghoraf.ui.theme.MicPurple
import com.shat.alghoraf.ui.theme.OnlineGreen
import com.shat.alghoraf.ui.theme.RoyalBlue
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.TajawalFontFamily
import com.shat.alghoraf.ui.theme.parseHexColor
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun AvatarWithFrame(
    avatarUrl: String,
    name: String,
    frameId: String,
    size: Dp = 44.dp,
    showOnlineDot: Boolean = false,
    isOnline: Boolean = true,
    onClick: (() -> Unit)? = null
) {
    val infinite = rememberInfiniteTransition(label = "frame_anim")
    val phase by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2400, easing = LinearEasing), RepeatMode.Restart),
        label = "frame_phase"
    )

    val frameBrush: Brush? = when (frameId) {
        "gold_royal" -> Brush.linearGradient(
            listOf(Color(0xFFF59E0B), Color(0xFFFEF08A), Color(0xFFD97706))
        )
        "neon_cyan" -> Brush.linearGradient(
            listOf(Color(0xFF06B6D4), Color(0xFF3B82F6), Color(0xFF22D3EE))
        )
        "flame_red" -> Brush.linearGradient(
            listOf(Color(0xFFEF4444), Color(0xFFF97316), Color(0xFFFACC15))
        )
        "emerald_vip" -> Brush.linearGradient(
            listOf(Color(0xFF10B981), Color(0xFF34D399), Color(0xFF059669))
        )
        "rose_aura" -> Brush.linearGradient(
            listOf(Color(0xFFEC4899), Color(0xFFF472B6), Color(0xFFA855F7))
        )
        "violet_crown" -> Brush.linearGradient(
            listOf(Color(0xFF7C3AED), Color(0xFFC026D3), Color(0xFFF59E0B))
        )
        else -> null
    }

    val decodedBitmap = remember(avatarUrl) {
        if (avatarUrl.startsWith("data:image")) {
            try {
                val b64 = avatarUrl.substringAfter("base64,", "")
                val bytes = Base64.decode(b64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            } catch (_: Exception) {
                null
            }
        } else null
    }

    Box(
        modifier = Modifier
            .size(size)
            .let { mod -> if (onClick != null) mod.clickable { onClick() } else mod },
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .then(
                    if (frameBrush != null) {
                        Modifier.border(
                            width = (2.5f + phase * 0.8f).dp,
                            brush = frameBrush,
                            shape = CircleShape
                        )
                    } else {
                        Modifier.border(1.5.dp, Color(0xFFE2E8F0), CircleShape)
                    }
                )
                .padding(3.dp)
                .clip(CircleShape)
                .background(RoyalBlue.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center
        ) {
            if (decodedBitmap != null) {
                Image(
                    bitmap = decodedBitmap,
                    contentDescription = name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else if (avatarUrl.startsWith("http")) {
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    text = name.trim().take(1).ifBlank { "ع" },
                    color = RoyalBlue,
                    fontWeight = FontWeight.Bold,
                    fontSize = (size.value * 0.4f).sp
                )
            }
        }

        if (showOnlineDot) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(Color.White)
                    .padding(2.dp)
                    .clip(CircleShape)
                    .background(if (isOnline) OnlineGreen else Color(0xFF94A3B8))
            )
        }
    }
}

@Composable
fun StyledRankBadge(rank: RankConfig) {
    val bg = parseHexColor(rank.bgColor, Color(0xFF334155))
    val fg = parseHexColor(rank.textColor, Color.White)
    val customIconBitmap = remember(rank.iconImageUrl) {
        if (rank.iconImageUrl.startsWith("data:image")) {
            try {
                val b64 = rank.iconImageUrl.substringAfter("base64,", "")
                val bytes = Base64.decode(b64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            } catch (_: Exception) {
                null
            }
        } else null
    }
    Surface(
        color = bg,
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            if (customIconBitmap != null) {
                Image(
                    bitmap = customIconBitmap,
                    contentDescription = rank.label,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(13.dp).clip(CircleShape)
                )
            } else if (rank.iconImageUrl.startsWith("http")) {
                AsyncImage(
                    model = rank.iconImageUrl,
                    contentDescription = rank.label,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(13.dp).clip(CircleShape)
                )
            } else if (rank.icon.isNotBlank()) {
                Text(text = rank.icon, fontSize = 10.sp)
            }
            Text(
                text = rank.label,
                color = fg,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun StyledChatName(
    name: String,
    nameColorHex: String,
    nameplateStyle: String,
    nameShine: String,
    fontFamilyName: String,
    vipWings: Boolean,
    nameBgColorHex: String = "",
    neonColorHex: String = ""
) {
    val infinite = rememberInfiniteTransition(label = "shine")
    val shimmerOffset by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 300f,
        animationSpec = infiniteRepeatable(tween(2200, easing = LinearEasing), RepeatMode.Restart),
        label = "shimmer_offset"
    )

    val plateBrush: Brush? = when (nameplateStyle) {
        "crimson_royal" -> Brush.horizontalGradient(listOf(Color(0xFF991B1B), Color(0xFFDC2626)))
        "gold_vip" -> Brush.horizontalGradient(listOf(Color(0xFFB45309), Color(0xFFF59E0B)))
        "ocean_blue" -> Brush.horizontalGradient(listOf(Color(0xFF1D4ED8), Color(0xFF0284C7)))
        "emerald_dark" -> Brush.horizontalGradient(listOf(Color(0xFF065F46), Color(0xFF059669)))
        "violet_neon" -> Brush.horizontalGradient(listOf(Color(0xFF6D28D9), Color(0xFFA855F7)))
        else -> null
    }

    val chosenFont = when (fontFamilyName) {
        "Tajawal" -> TajawalFontFamily
        "Serif" -> FontFamily.Serif
        "Monospace" -> FontFamily.Monospace
        "SansSerif" -> FontFamily.SansSerif
        else -> CairoFontFamily
    }

    val customBgColor = if (nameBgColorHex.isNotBlank()) parseHexColor(nameBgColorHex, Color.Transparent) else Color.Transparent
    val neonGlowColor = if (neonColorHex.isNotBlank()) parseHexColor(neonColorHex, Color.Transparent) else Color.Transparent
    val hasPlateOrBg = plateBrush != null || customBgColor != Color.Transparent
    val baseColor = if (plateBrush != null) Color.White else parseHexColor(nameColorHex, RoyalBlue)
    val shadow = if (neonGlowColor != Color.Transparent) {
        Shadow(color = neonGlowColor, offset = Offset(0f, 0f), blurRadius = 14f)
    } else null

    val textBrush: Brush? = when (nameShine) {
        "gold_shimmer" -> Brush.linearGradient(
            colors = listOf(Color(0xFFB45309), Color(0xFFFDE047), Color(0xFFF59E0B)),
            start = Offset(shimmerOffset - 120f, 0f),
            end = Offset(shimmerOffset, 30f)
        )
        "rainbow" -> Brush.linearGradient(
            colors = listOf(Color(0xFFEC4899), Color(0xFF8B5CF6), Color(0xFF06B6D4), Color(0xFF10B981)),
            start = Offset(shimmerOffset - 150f, 0f),
            end = Offset(shimmerOffset, 30f)
        )
        "neon_pulse" -> Brush.linearGradient(
            colors = listOf(Color(0xFF22D3EE), Color(0xFF818CF8), Color(0xFF38BDF8)),
            start = Offset(shimmerOffset - 120f, 0f),
            end = Offset(shimmerOffset, 30f)
        )
        "ice_glow" -> Brush.linearGradient(
            colors = listOf(Color(0xFF0284C7), Color(0xFFBAE6FD), Color(0xFF0369A1)),
            start = Offset(shimmerOffset - 120f, 0f),
            end = Offset(shimmerOffset, 30f)
        )
        else -> null
    }

    val showRoyalOrnaments = vipWings || nameplateStyle != "default" || nameShine != "none"

    Box(
        modifier = Modifier
            .then(
                when {
                    plateBrush != null -> Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(plateBrush)
                        .then(
                            if (neonGlowColor != Color.Transparent) Modifier.border(1.dp, neonGlowColor, RoundedCornerShape(8.dp))
                            else Modifier
                        )
                        .padding(horizontal = 7.dp, vertical = 2.dp)
                    customBgColor != Color.Transparent -> Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(customBgColor.copy(alpha = 0.22f))
                        .border(1.dp, if (neonGlowColor != Color.Transparent) neonGlowColor else customBgColor, RoundedCornerShape(8.dp))
                        .padding(horizontal = 7.dp, vertical = 2.dp)
                    neonGlowColor != Color.Transparent -> Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, neonGlowColor.copy(alpha = 0.65f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 6.dp, vertical = 1.dp)
                    else -> Modifier
                }
            )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            if (vipWings) {
                Text(text = "🕊️", fontSize = 11.sp)
            } else if (showRoyalOrnaments) {
                Text(text = "꧁", color = if (hasPlateOrBg && plateBrush != null) GoldLightCompat else RoyalGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Text(
                text = name,
                style = if (textBrush != null && plateBrush == null) {
                    TextStyle(
                        brush = textBrush,
                        fontFamily = chosenFont,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        shadow = shadow
                    )
                } else {
                    TextStyle(
                        color = baseColor,
                        fontFamily = chosenFont,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        shadow = shadow
                    )
                },
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (vipWings) {
                Text(text = "🕊️", fontSize = 11.sp)
            } else if (showRoyalOrnaments) {
                Text(text = "꧂", color = if (hasPlateOrBg && plateBrush != null) GoldLightCompat else RoyalGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun VoiceMicStrip(
    mics: List<RoomMicSlot>,
    currentUid: String,
    isAdminUser: Boolean,
    hasAudioPermission: Boolean,
    liveMicLevel: Float,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onMicClick: (RoomMicSlot) -> Unit,
    onLeaveMic: (Int) -> Unit,
    onAdminMuteMic: (Int, Boolean) -> Unit,
    onOpenMicSettings: () -> Unit
) {
    Surface(
        color = Color(0xFFF3E8FF),
        tonalElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    IconButton(
                        onClick = onOpenMicSettings,
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                            .testTag("mic_settings_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "إعدادات المايك",
                            tint = MicPurple,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(
                        onClick = onToggleExpand,
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                            .testTag("mic_collapse_button")
                    ) {
                        Icon(
                            imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = "طي أو توسيع المايكات",
                            tint = MicPurple,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                AnimatedVisibility(visible = isExpanded) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        mics.forEach { slot ->
                            val occupied = slot.holderUid.isNotBlank()
                            val isMine = slot.holderUid == currentUid
                            val muted = slot.isMutedByUser || slot.isMutedByAdmin
                            val activeSpeaking = occupied && !muted && (slot.isTalking || (isMine && liveMicLevel > 0.08f))
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(50.dp)
                                    .testTag("mic_slot_${slot.slotNumber}")
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when {
                                                occupied && !muted -> MicPurple
                                                occupied && muted -> Color(0xFF94A3B8)
                                                else -> MicPurple.copy(alpha = 0.85f)
                                            }
                                        )
                                        .border(
                                            width = when {
                                                activeSpeaking -> 3.dp
                                                isMine -> 2.5.dp
                                                else -> 1.5.dp
                                            },
                                            color = when {
                                                activeSpeaking -> OnlineGreen
                                                isMine -> RoyalGold
                                                else -> Color.White
                                            },
                                            shape = CircleShape
                                        )
                                        .clickable { onMicClick(slot) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (!occupied) {
                                        Text(
                                            text = slot.slotNumber.toString(),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                    } else {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(
                                                imageVector = if (muted) Icons.Default.MicOff else Icons.Default.Mic,
                                                contentDescription = slot.holderName,
                                                tint = Color.White,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Text(
                                                text = slot.slotNumber.toString(),
                                                color = GoldLightCompat,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                                if (occupied) {
                                    Text(
                                        text = slot.holderName,
                                        fontSize = 9.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        color = Color(0xFF4C1D95),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (isMine || isAdminUser) {
                                        Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                            if (isMine) {
                                                Text(
                                                    text = if (slot.isMutedByUser) "🎙️" else "🔇",
                                                    fontSize = 10.sp,
                                                    modifier = Modifier.clickable { onMicClick(slot) }
                                                )
                                            }
                                            if (isAdminUser && !isMine) {
                                                Text(
                                                    text = if (slot.isMutedByAdmin) "🔊" else "🔇",
                                                    fontSize = 10.sp,
                                                    modifier = Modifier.clickable {
                                                        onAdminMuteMic(slot.slotNumber.toInt(), !slot.isMutedByAdmin)
                                                    }
                                                )
                                            }
                                            Text(
                                                text = "❌",
                                                fontSize = 9.sp,
                                                modifier = Modifier.clickable {
                                                    onLeaveMic(slot.slotNumber.toInt())
                                                }
                                            )
                                        }
                                    }
                                } else {
                                    Text(
                                        text = if (hasAudioPermission) "مايك ${slot.slotNumber}" else "صوت ${slot.slotNumber}",
                                        fontSize = 9.sp,
                                        color = Color(0xFF6B21A8)
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

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun InRoomYoutubePlayer(
    videoId: String,
    title: String,
    isMutedLocally: Boolean,
    canControlRoomPlayer: Boolean,
    onToggleMute: () -> Unit,
    onStopForRoom: () -> Unit
) {
    Surface(
        color = Color(0xFF0F172A),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .border(1.dp, RoyalGold.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "🎵 يوتيوب الغرفة: ${title.ifBlank { videoId }}",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (isMutedLocally) "🔇 مكتوم لك" else "🔊 صوت مفعل",
                        color = GoldLightCompat,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { onToggleMute() }
                    )
                    if (canControlRoomPlayer) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "إيقاف المشغل للغرفة",
                            tint = Color(0xFFF87171),
                            modifier = Modifier
                                .size(18.dp)
                                .clickable { onStopForRoom() }
                        )
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.mediaPlaybackRequiresUserGesture = false
                        settings.cacheMode = WebSettings.LOAD_DEFAULT
                        webChromeClient = WebChromeClient()
                        webViewClient = WebViewClient()
                    }
                },
                update = { webView ->
                    val muteFlag = if (isMutedLocally) 1 else 0
                    val embedUrl = "https://www.youtube.com/embed/$videoId?autoplay=1&playsinline=1&mute=$muteFlag"
                    if (webView.tag != embedUrl) {
                        webView.tag = embedUrl
                        webView.loadUrl(embedUrl)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(8.dp))
            )
        }
    }
}

private val GoldLightCompat = Color(0xFFFEF3C7)

@Composable
fun ChatMessageRow(
    message: ChatMessage,
    rank: RankConfig,
    canModerate: Boolean,
    isMyMessage: Boolean,
    onSenderClick: () -> Unit,
    onDeleteClick: () -> Unit,
    onPlayAudio: (String) -> Unit
) {
    val timeLabel = remember(message.createdAt) {
        val ts = message.createdAt ?: Timestamp.now()
        SimpleDateFormat("HH:mm", Locale.getDefault()).format(ts.toDate())
    }

    if (message.isGift || message.msgType == "gift") {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 3.dp)
                .border(1.dp, RoyalGold, RoundedCornerShape(14.dp))
        ) {
            Row(
                modifier = Modifier.padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.CardGiftcard, contentDescription = null, tint = RoyalGold)
                Text(
                    text = message.content,
                    color = Color(0xFF92400E),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f)
                )
            }
        }
        return
    }

    if (message.isAdminNotice || message.msgType == "admin_notice") {
        val decodedNoticeImg = remember(message.mediaUrl) {
            if (message.mediaUrl.startsWith("data:image")) {
                try {
                    val b64 = message.mediaUrl.substringAfter("base64,", "")
                    val bytes = Base64.decode(b64, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
                } catch (_: Exception) {
                    null
                }
            } else null
        }
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 4.dp)
                .border(2.dp, CrimsonOwner, RoundedCornerShape(14.dp))
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Campaign, contentDescription = null, tint = CrimsonOwner, modifier = Modifier.size(20.dp))
                    Text(
                        text = "إشعار من الإدارة:",
                        color = CrimsonOwner,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = message.senderName,
                        color = Color(0xFF991B1B),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.content,
                    color = Color(0xFF7F1D1D),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyLarge
                )
                if (decodedNoticeImg != null) {
                    Spacer(Modifier.height(6.dp))
                    Image(
                        bitmap = decodedNoticeImg,
                        contentDescription = "صورة الإشعار",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(10.dp))
                    )
                }
            }
        }
        return
    }

    val decodedMedia = remember(message.mediaUrl) {
        if (message.mediaUrl.startsWith("data:image")) {
            try {
                val b64 = message.mediaUrl.substringAfter("base64,", "")
                val bytes = Base64.decode(b64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            } catch (_: Exception) {
                null
            }
        } else null
    }

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isMyMessage) Color(0xFFF8FAFF) else Color.White
        ),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 3.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            AvatarWithFrame(
                avatarUrl = message.avatarUrl,
                name = message.senderName,
                frameId = message.avatarFrame,
                size = 42.dp,
                onClick = onSenderClick
            )

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(modifier = Modifier.clickable { onSenderClick() }) {
                        StyledChatName(
                            name = message.senderName,
                            nameColorHex = message.nameColor,
                            nameplateStyle = message.nameplateStyle,
                            nameShine = message.nameShine,
                            fontFamilyName = message.fontFamily,
                            vipWings = message.vipWings,
                            nameBgColorHex = message.nameBgColor,
                            neonColorHex = message.neonColor
                        )
                    }
                    StyledRankBadge(rank = rank)
                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = timeLabel,
                        fontSize = 10.sp,
                        color = Color(0xFF94A3B8)
                    )
                    if (canModerate || isMyMessage) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "حذف الرسالة",
                            tint = Color(0xFFCBD5E1),
                            modifier = Modifier
                                .size(16.dp)
                                .clickable { onDeleteClick() }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                if (message.msgType == "audio" && message.mediaUrl.isNotBlank()) {
                    Surface(
                        color = RoyalBlue.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .clickable { onPlayAudio(message.mediaUrl) }
                            .padding(vertical = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.GraphicEq, contentDescription = null, tint = RoyalBlue)
                            Text(
                                text = message.content.ifBlank { "رسالة صوتية — اضغط للاستماع" },
                                color = RoyalBlue,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        }
                    }
                } else {
                    if (message.content.isNotBlank()) {
                        Text(
                            text = message.content,
                            color = parseHexColor(message.textColor, Color(0xFF1E293B)),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                    if (decodedMedia != null) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Image(
                            bitmap = decodedMedia,
                            contentDescription = "صورة مرفقة",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .widthIn(max = 260.dp)
                                .height(160.dp)
                                .clip(RoundedCornerShape(12.dp))
                        )
                    } else if (message.mediaUrl.startsWith("http")) {
                        Spacer(modifier = Modifier.height(6.dp))
                        AsyncImage(
                            model = message.mediaUrl,
                            contentDescription = "صورة مرفقة",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .widthIn(max = 260.dp)
                                .height(160.dp)
                                .clip(RoundedCornerShape(12.dp))
                        )
                    }
                }
            }
        }
    }
}
