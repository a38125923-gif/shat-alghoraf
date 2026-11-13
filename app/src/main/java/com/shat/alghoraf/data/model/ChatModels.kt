package com.shat.alghoraf.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp

const val OWNER_ADMIN_EMAIL = "a38125923@gmail.com"

enum class UserRole(val key: String, val arabicLabel: String, val badgeEmoji: String) {
    OWNER("owner", "المالك العام", "👑"),
    ADMIN("admin", "أدمن", "🛡️"),
    MODERATOR("moderator", "مشرف", "⚔️"),
    MEMBER("member", "عضو ماسي", "💎");

    companion object {
        fun fromKey(key: String?): UserRole =
            entries.firstOrNull { it.key == key } ?: MEMBER
    }
}

enum class RoomPermissionLevel(val key: String, val arabicLabel: String) {
    PUBLIC("PUBLIC", "عامة للجميع"),
    APPROVAL_ONLY("APPROVAL_ONLY", "أعضاء مسجلين"),
    PRIVATE("PRIVATE", "خاصة بالإدارة");

    companion object {
        fun fromKey(key: String?): RoomPermissionLevel =
            entries.firstOrNull { it.key == key } ?: PUBLIC
    }
}

@IgnoreExtraProperties
data class PublicProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val avatarEmoji: String? = null,
    val photoUrl: String? = null,
    val bio: String? = null,
    val globalRole: String = UserRole.MEMBER.key,
    val status: String = "online",
    @get:PropertyName("isActive") @set:PropertyName("isActive")
    var isActive: Boolean = true,
    @ServerTimestamp val lastSeenAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    val roleEnum: UserRole
        get() = UserRole.fromKey(globalRole)

    val isOwner: Boolean
        get() = globalRole == UserRole.OWNER.key
}

@IgnoreExtraProperties
data class ChatRoom(
    @DocumentId val id: String = "",
    val name: String = "",
    val description: String? = null,
    val ownerId: String = "",
    val ownerName: String = "",
    val category: String = "عام",
    val icon: String = "💬",
    val permissionLevel: String = RoomPermissionLevel.PUBLIC.key,
    @get:PropertyName("isLocked") @set:PropertyName("isLocked")
    var isLocked: Boolean = false,
    @get:PropertyName("isActive") @set:PropertyName("isActive")
    var isActive: Boolean = true,
    val admins: List<String> = emptyList(),
    val moderators: List<String> = emptyList(),
    val mutedUsers: List<String> = emptyList(),
    val bannedUsers: List<String> = emptyList(),
    val pinnedMessage: String? = null,
    val pinnedMessageSender: String? = null,
    val lastMessageText: String? = null,
    val lastMessageSender: String? = null,
    @ServerTimestamp val lastMessageAt: Timestamp? = null,
    val memberCount: Long = 1L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    val permissionEnum: RoomPermissionLevel
        get() = RoomPermissionLevel.fromKey(permissionLevel)
}

@IgnoreExtraProperties
data class ChatMessage(
    @DocumentId val id: String = "",
    val roomId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderRole: String = UserRole.MEMBER.key,
    val senderAvatar: String? = null,
    val content: String = "",
    @get:PropertyName("isAnnouncement") @set:PropertyName("isAnnouncement")
    var isAnnouncement: Boolean = false,
    val replyToMessageId: String? = null,
    val replyToSenderName: String? = null,
    val replyToContent: String? = null,
    val reactions: List<String> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null
) {
    val roleEnum: UserRole
        get() = UserRole.fromKey(senderRole)
}

@IgnoreExtraProperties
data class TypingStatus(
    @DocumentId val id: String = "",
    val roomId: String = "",
    val userId: String = "",
    val displayName: String = "",
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@IgnoreExtraProperties
data class DirectChat(
    @DocumentId val id: String = "",
    val participantIds: List<String> = emptyList(),
    val participantNames: Map<String, String> = emptyMap(),
    val participantAvatars: Map<String, String> = emptyMap(),
    val lastMessageText: String? = null,
    val lastMessageSenderId: String? = null,
    @ServerTimestamp val lastMessageAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@IgnoreExtraProperties
data class DirectMessage(
    @DocumentId val id: String = "",
    val chatId: String = "",
    val participantIds: List<String> = emptyList(),
    val senderId: String = "",
    val senderName: String = "",
    val senderAvatar: String? = null,
    val content: String = "",
    val replyToMessageId: String? = null,
    val replyToSenderName: String? = null,
    val replyToContent: String? = null,
    @ServerTimestamp val createdAt: Timestamp? = null
)

@IgnoreExtraProperties
data class BanRecord(
    @DocumentId val id: String = "",
    val targetUid: String = "",
    val targetName: String = "",
    val reason: String = "",
    @get:PropertyName("isPermanent") @set:PropertyName("isPermanent")
    var isPermanent: Boolean = false,
    val expiresAtMillis: Long = 0L,
    val bannedByUid: String = "",
    val bannedByName: String = "",
    val roomId: String? = null,
    val roomName: String? = null,
    @get:PropertyName("isGlobal") @set:PropertyName("isGlobal")
    var isGlobal: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null
)

data class ReplyTarget(
    val messageId: String,
    val senderName: String,
    val content: String
)

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
