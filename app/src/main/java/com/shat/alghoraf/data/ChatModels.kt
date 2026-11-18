package com.shat.alghoraf.data

import androidx.annotation.Keep
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp

@Keep
@IgnoreExtraProperties
data class UserPrivate(
    @DocumentId val id: String = "",
    val userId: String = "",
    val email: String = "",
    val username: String = "",
    val role: String = "member",
    val coins: Long = 1500L,
    @get:PropertyName("isStealth") @PropertyName("isStealth") val isStealth: Boolean = false,
    @get:PropertyName("isBanned") @PropertyName("isBanned") val isBanned: Boolean = false,
    val banReason: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class PublicProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val username: String = "",
    val displayName: String = "",
    val role: String = "member",
    val bio: String = "",
    val avatarUrl: String = "",
    val nameColor: String = "#1A45E5",
    val textColor: String = "#1E293B",
    val nameBgColor: String = "",
    val neonColor: String = "",
    val fontFamily: String = "Cairo",
    val fontStyle: String = "Normal",
    val avatarFrame: String = "none",
    val nameplateStyle: String = "default",
    val nameShine: String = "none",
    val vipWings: Boolean = false,
    val profileMusic: String = "",
    val vipFamily: String = "",
    val coins: Long = 1500L,
    val activityPoints: Long = 0L,
    val giftsReceived: Long = 0L,
    val giftsSent: Long = 0L,
    @get:PropertyName("isStealth") @PropertyName("isStealth") val isStealth: Boolean = false,
    @get:PropertyName("isOnline") @PropertyName("isOnline") val isOnline: Boolean = true,
    @get:PropertyName("isPublic") @PropertyName("isPublic") val isPublic: Boolean = true,
    val currentRoomId: String = "general",
    @ServerTimestamp val lastSeenAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    val shownName: String get() = displayName.ifBlank { username.ifBlank { "عضو" } }
}

@Keep
@IgnoreExtraProperties
data class ChatRoom(
    @DocumentId val id: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "💬",
    val imageUrl: String = "",
    val bgTheme: String = "warm_peach",
    val wallpaperUrl: String = "",
    val welcomeMessage: String = "",
    val minRankPower: Long = 0L,
    val micsEnabled: Boolean = true,
    val ownerUserId: String = "",
    val ownerName: String = "",
    val activityPoints: Long = 0L,
    val youtubeVideoId: String = "",
    val youtubeTitle: String = "",
    val youtubeIsPlaying: Boolean = false,
    @get:PropertyName("isActive") @PropertyName("isActive") val isActive: Boolean = true,
    val createdBy: String = "system",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class RoomMicSlot(
    @DocumentId val id: String = "",
    val roomId: String = "",
    val slotNumber: Long = 1L,
    val holderUid: String = "",
    val holderName: String = "",
    val holderAvatar: String = "",
    val holderRole: String = "member",
    @get:PropertyName("isMutedByUser") @PropertyName("isMutedByUser") val isMutedByUser: Boolean = false,
    @get:PropertyName("isMutedByAdmin") @PropertyName("isMutedByAdmin") val isMutedByAdmin: Boolean = false,
    @get:PropertyName("isTalking") @PropertyName("isTalking") val isTalking: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ChatMessage(
    @DocumentId val id: String = "",
    val roomId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderRole: String = "member",
    val nameColor: String = "#1A45E5",
    val textColor: String = "#1E293B",
    val nameBgColor: String = "",
    val neonColor: String = "",
    val fontFamily: String = "Cairo",
    val fontStyle: String = "Normal",
    val avatarUrl: String = "",
    val avatarFrame: String = "none",
    val nameplateStyle: String = "default",
    val nameShine: String = "none",
    val vipWings: Boolean = false,
    @get:PropertyName("isAdminNotice") @PropertyName("isAdminNotice") val isAdminNotice: Boolean = false,
    @get:PropertyName("isGift") @PropertyName("isGift") val isGift: Boolean = false,
    val giftName: String = "",
    val giftEmoji: String = "",
    val giftRecipientName: String = "",
    val msgType: String = "text",
    val content: String = "",
    val mediaUrl: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class RankConfig(
    @DocumentId val id: String = "",
    val key: String = "member",
    val label: String = "عضو",
    val icon: String = "👤",
    val bgColor: String = "#334155",
    val textColor: String = "#FFFFFF",
    val power: Long = 1L,
    val tierOrder: Long = 1L,
    @get:PropertyName("isSystem") @PropertyName("isSystem") val isSystem: Boolean = true,
    val permMute: Boolean = false,
    val permKick: Boolean = false,
    val permBan: Boolean = false,
    val permSetRank: Boolean = false,
    val permClearRoom: Boolean = false,
    val permManageRooms: Boolean = false,
    val permAccessPanel: Boolean = false,
    val permRoomOwner: Boolean = false,
    val permPublishNews: Boolean = false,
    val permUseAddons: Boolean = false,
    val maxAssignableRank: Long = 0L,
    @get:PropertyName("isActive") @PropertyName("isActive") val isActive: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class SiteSettings(
    @DocumentId val id: String = "",
    val siteName: String = "شات الغرف المباشر",
    val siteDescription: String = "أرقى منصة شات عربي مباشر بتصميم احترافي",
    val welcomeBanner: String = "أهلاً وسهلاً بكم في شات الغرف المباشر — نتمنى لكم أجمل الأوقات",
    val marqueeText: String = "مرحباً بكم في الشات العربي الاحترافي | احترم قوانين الغرف | تفاعل واجمع النقاط والهدايا",
    val defaultRoomId: String = "general",
    val allowGuestMics: Boolean = true,
    val soundEffectsEnabled: Boolean = true,
    @get:PropertyName("isPublic") @PropertyName("isPublic") val isPublic: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class NewsPost(
    @DocumentId val id: String = "",
    val authorId: String = "",
    val authorName: String = "",
    val authorAvatar: String = "",
    val authorRole: String = "site_owner",
    val title: String = "",
    val content: String = "",
    val imageUrl: String = "",
    @get:PropertyName("isPublished") @PropertyName("isPublished") val isPublished: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class WallPost(
    @DocumentId val id: String = "",
    val authorId: String = "",
    val authorName: String = "",
    val authorAvatar: String = "",
    val authorRole: String = "member",
    val content: String = "",
    val imageUrl: String = "",
    val likesCount: Long = 0L,
    @get:PropertyName("isPublic") @PropertyName("isPublic") val isPublic: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class PrivateMessage(
    @DocumentId val id: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderAvatar: String = "",
    val receiverId: String = "",
    val receiverName: String = "",
    val content: String = "",
    val participants: List<String> = emptyList(),
    @get:PropertyName("isRead") @PropertyName("isRead") val isRead: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class Friendship(
    @DocumentId val id: String = "",
    val requesterId: String = "",
    val requesterName: String = "",
    val requesterAvatar: String = "",
    val targetId: String = "",
    val targetName: String = "",
    val targetAvatar: String = "",
    val participants: List<String> = emptyList(),
    val status: String = "pending",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class NotificationItem(
    @DocumentId val id: String = "",
    val recipientId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val type: String = "info",
    val title: String = "",
    val body: String = "",
    @get:PropertyName("isRead") @PropertyName("isRead") val isRead: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class GiftTransaction(
    @DocumentId val id: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val recipientId: String = "",
    val recipientName: String = "",
    val giftId: String = "",
    val giftName: String = "",
    val giftEmoji: String = "",
    val cost: Long = 0L,
    val reward: Long = 0L,
    val roomId: String = "general",
    @get:PropertyName("isPublic") @PropertyName("isPublic") val isPublic: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class UserReport(
    @DocumentId val id: String = "",
    val reporterId: String = "",
    val reporterName: String = "",
    val targetId: String = "",
    val targetName: String = "",
    val roomId: String = "general",
    val reason: String = "",
    val status: String = "open",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class BanRecord(
    @DocumentId val id: String = "",
    val targetUserId: String = "",
    val targetName: String = "",
    val bannedById: String = "",
    val bannedByName: String = "",
    val reason: String = "",
    @get:PropertyName("isActive") @PropertyName("isActive") val isActive: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class GiftCatalogItem(
    val id: String,
    val name: String,
    val emoji: String,
    val cost: Long,
    val reward: Long,
    val tier: String,
    val accentHex: String
)

data class StyleOption(
    val id: String,
    val label: String,
    val badge: String = ""
)
