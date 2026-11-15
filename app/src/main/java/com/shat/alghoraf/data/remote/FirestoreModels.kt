package com.shat.alghoraf.data.remote

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp
import com.shat.alghoraf.data.model.AvatarFrame
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatNotification
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.NameplateStyle
import com.shat.alghoraf.data.model.PrivateMessage
import com.shat.alghoraf.data.model.UserReport
import com.shat.alghoraf.data.model.WallPost

@IgnoreExtraProperties
data class FsUserProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val photoUrl: String? = null,
    val globalRole: String = "member",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "userId" to userId,
        "displayName" to displayName.take(50).ifBlank { "عضو جديد" },
        "email" to email.take(100),
        "photoUrl" to photoUrl?.take(500),
        "globalRole" to globalRole,
        "createdAt" to (createdAt ?: FieldValue.serverTimestamp()),
        "updatedAt" to FieldValue.serverTimestamp()
    ).filterValues { it != null } as Map<String, Any>
}

@IgnoreExtraProperties
data class FsPublicProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val username: String? = null,
    val avatarEmoji: String? = "😎",
    val photoUrl: String? = null,
    val bio: String? = "أهلاً بكم في شات الغرف",
    val gender: String? = "ذكر",
    val globalRole: String = "member",
    val chatRank: String = "member",
    val avatarFrame: String = AvatarFrame.NONE.id,
    val nameplateStyle: String = NameplateStyle.DEFAULT.id,
    val vipFamily: String? = "",
    val coins: Long = 1500L,
    val isMuted: Boolean = false,
    val muteReason: String? = null,
    val isBanned: Boolean = false,
    val banReason: String? = null,
    val status: String = "online",
    val isActive: Boolean = true,
    @ServerTimestamp val lastSeenAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toChatUser(): ChatUser {
        val resolvedRank = when {
            chatRank.isNotBlank() -> ChatRank.fromId(chatRank)
            globalRole == "owner" -> ChatRank.SITE_OWNER
            globalRole == "admin" -> ChatRank.ADMIN
            globalRole == "moderator" -> ChatRank.GENERAL_MODERATOR
            globalRole == "visitor" -> ChatRank.GUEST
            else -> ChatRank.MEMBER
        }
        return ChatUser(
            userKey = userId.ifBlank { id },
            username = username ?: displayName,
            displayName = displayName.ifBlank { "عضو" },
            email = "",
            gender = gender ?: "ذكر",
            rank = resolvedRank,
            bio = bio ?: "أهلاً بكم في شات الغرف",
            avatarUri = photoUrl ?: "",
            avatarEmoji = avatarEmoji ?: "😎",
            avatarFrame = AvatarFrame.fromId(avatarFrame),
            nameplateStyle = NameplateStyle.fromId(nameplateStyle),
            coins = coins.toInt(),
            vipFamily = vipFamily ?: "",
            isMuted = isMuted,
            muteReason = muteReason ?: "",
            isBanned = isBanned,
            banReason = banReason ?: "",
            isOnline = status == "online",
            joinDateMillis = (createdAt ?: Timestamp.now()).toDate().time
        )
    }
}

@IgnoreExtraProperties
data class FsRoom(
    @DocumentId val id: String = "",
    val name: String = "",
    val description: String? = null,
    val ownerId: String = "",
    val ownerName: String = "",
    val category: String? = "عام",
    val icon: String? = "💬",
    val permissionLevel: String = "PUBLIC",
    val isLocked: Boolean = false,
    val micsEnabled: Boolean = true,
    val isActive: Boolean = true,
    val admins: List<String> = emptyList(),
    val moderators: List<String> = emptyList(),
    val mutedUsers: List<String> = emptyList(),
    val bannedUsers: List<String> = emptyList(),
    val pinnedMessage: String? = null,
    val pinnedMessageSender: String? = null,
    val lastMessageText: String? = null,
    val lastMessageSender: String? = null,
    val lastMessageAt: Timestamp? = null,
    val memberCount: Long = 1L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toChatRoom(onlineUsersCount: Int = 1): ChatRoom = ChatRoom(
        id = id,
        name = name,
        description = description ?: "",
        category = category ?: "عام",
        iconEmoji = icon ?: "💬",
        micsEnabled = micsEnabled,
        onlineCount = maxOf(memberCount.toInt(), onlineUsersCount),
        createdBy = ownerId
    )
}

@IgnoreExtraProperties
data class FsMessage(
    @DocumentId val id: String = "",
    val roomId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderRole: String = "member",
    val senderRank: String = "member",
    val senderAvatar: String? = "💬",
    val senderAvatarUri: String? = null,
    val senderFrame: String = AvatarFrame.NONE.id,
    val senderNameplate: String = NameplateStyle.DEFAULT.id,
    val content: String = "",
    val imageUri: String? = null,
    val voiceDurationSec: Long = 0L,
    val isAnnouncement: Boolean = false,
    val reactions: List<String> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null
) {
    fun toChatMessage(): ChatMessage = ChatMessage(
        id = id,
        roomId = roomId,
        senderKey = senderId,
        senderName = senderName,
        senderRank = ChatRank.fromId(senderRank),
        senderAvatarUri = senderAvatarUri ?: "",
        senderAvatarEmoji = senderAvatar ?: "💬",
        senderFrame = AvatarFrame.fromId(senderFrame),
        senderNameplate = NameplateStyle.fromId(senderNameplate),
        content = content,
        imageUri = imageUri ?: "",
        voiceDurationSec = voiceDurationSec.toInt(),
        isAnnouncement = isAnnouncement,
        createdAtMillis = (createdAt ?: Timestamp.now()).toDate().time
    )
}

@IgnoreExtraProperties
data class FsWallPost(
    @DocumentId val id: String = "",
    val authorId: String = "",
    val authorName: String = "",
    val authorRank: String = ChatRank.MEMBER.id,
    val authorEmoji: String? = "😎",
    val content: String = "",
    val likes: Long = 0L,
    val likedBy: List<String> = emptyList(),
    val isActive: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toWallPost(): WallPost = WallPost(
        id = id,
        authorKey = authorId,
        authorName = authorName,
        authorRank = ChatRank.fromId(authorRank),
        authorEmoji = authorEmoji ?: "😎",
        content = content,
        likes = likes.toInt(),
        createdAtMillis = (createdAt ?: Timestamp.now()).toDate().time
    )
}

@IgnoreExtraProperties
data class FsChatNotification(
    @DocumentId val id: String = "",
    val audience: String = "all",
    val createdByUid: String = "",
    val title: String = "",
    val body: String = "",
    val readBy: List<String> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toChatNotification(currentUid: String): ChatNotification = ChatNotification(
        id = id,
        title = title,
        body = body,
        isRead = currentUid in readBy,
        createdAtMillis = (createdAt ?: Timestamp.now()).toDate().time
    )
}

@IgnoreExtraProperties
data class FsUserReport(
    @DocumentId val id: String = "",
    val reporterUid: String = "",
    val reporterName: String = "",
    val targetName: String = "",
    val reason: String = "",
    val status: String = "pending",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toUserReport(): UserReport = UserReport(
        id = id,
        reporterName = reporterName,
        targetName = targetName,
        reason = reason,
        status = if (status == "resolved") "تمت المعالجة" else "قيد المراجعة",
        createdAtMillis = (createdAt ?: Timestamp.now()).toDate().time
    )
}

@IgnoreExtraProperties
data class FsDirectChat(
    @DocumentId val id: String = "",
    val participantIds: List<String> = emptyList(),
    val participantNames: Map<String, String> = emptyMap(),
    val participantAvatars: Map<String, String> = emptyMap(),
    val lastMessageText: String? = null,
    val lastMessageSenderId: String? = null,
    val lastMessageAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@IgnoreExtraProperties
data class FsDirectMessage(
    @DocumentId val id: String = "",
    val chatId: String = "",
    val participantIds: List<String> = emptyList(),
    val senderId: String = "",
    val senderName: String = "",
    val senderAvatar: String? = "💬",
    val content: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
) {
    fun toPrivateMessage(recipientUid: String, recipientName: String): PrivateMessage = PrivateMessage(
        id = id,
        fromKey = senderId,
        fromName = senderName,
        fromEmoji = senderAvatar ?: "💬",
        toKey = recipientUid,
        toName = recipientName,
        content = content,
        createdAtMillis = (createdAt ?: Timestamp.now()).toDate().time
    )
}

fun ChatRank.toGlobalRole(): String = when (this) {
    ChatRank.SITE_OWNER, ChatRank.SUPER_OWNER, ChatRank.OWNER -> "owner"
    ChatRank.SUPER_ADMIN, ChatRank.ADMIN -> "admin"
    ChatRank.GENERAL_MODERATOR -> "moderator"
    ChatRank.GUEST -> "visitor"
    else -> "member"
}
