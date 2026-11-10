package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

enum class RoomPermission(val key: String, val titleAr: String, val descAr: String) {
  PUBLIC("PUBLIC", "عامة 🌐", "مفتوحة للجميع للدخول والكتابة بحرية"),
  PRIVATE("PRIVATE", "خاصة 🔒", "مقفلة، الكتابة مقتصرة على المالك والمشرفين"),
  APPROVAL_ONLY("APPROVAL_ONLY", "بموافقة فقط 🛡️", "دخول ومشاركة تتطلب موافقة أو رتبة معتمدة من الإدارة");

  companion object {
    fun fromKey(key: String?): RoomPermission {
      return when (key?.uppercase()) {
        "PRIVATE" -> PRIVATE
        "APPROVAL_ONLY" -> APPROVAL_ONLY
        else -> PUBLIC
      }
    }
  }
}

enum class UserRole(val labelAr: String, val badge: String, val level: Int) {
  OWNER("مالك", "👑", 4),
  ADMIN("أدمن", "🛡️", 3),
  MODERATOR("مشرف", "⚔️", 2),
  MEMBER("مستخدم", "👤", 1),
  MUTED("مكتوم", "🔇", 0),
  BANNED("محظور", "🚫", -1);

  companion object {
    fun fromString(role: String?): UserRole {
      return when (role?.lowercase()) {
        "owner" -> OWNER
        "admin" -> ADMIN
        "moderator" -> MODERATOR
        "muted" -> MUTED
        "banned" -> BANNED
        else -> MEMBER
      }
    }
  }
}

enum class ModeratorPermissionFlag(val key: String, val titleAr: String, val descAr: String) {
  DELETE_MESSAGES("delete_messages", "حذف الرسائل غير اللائقة", "صلاحية حذف أي رسالة مسيئة في الغرفة"),
  BAN_USERS("ban_users", "حظر وطرد المستخدمين", "صلاحية حظر المستخدمين مؤقتاً أو دائماً"),
  MUTE_USERS("mute_users", "كتم صوت المستخدمين", "منع المستخدم المخالف من الكتابة والإرسال"),
  PIN_ANNOUNCEMENT("pin_announcement", "تثبيت الإعلانات والتنبيهات", "تثبيت وبث رسائل إدارية هامة"),
  LOCK_ROOM("lock_room", "قفل الغرفة للكتابة", "إغلاق الشات وجعله للمشرفين والمالك فقط");

  companion object {
    val defaultModeratorFlags = listOf(
      DELETE_MESSAGES.key,
      BAN_USERS.key,
      MUTE_USERS.key,
      PIN_ANNOUNCEMENT.key
    )
  }
}

@IgnoreExtraProperties
data class BanRecord(
  @DocumentId val id: String = "",
  val targetUid: String = "",
  val targetName: String = "",
  val roomId: String? = null,
  val roomName: String? = null,
  val isGlobal: Boolean = false,
  val reason: String = "",
  val isPermanent: Boolean = false,
  val expiresAtMillis: Long = 0L,
  val bannedByUid: String = "",
  val bannedByName: String = "",
  @ServerTimestamp val createdAt: Timestamp? = null
) {
  fun isActive(): Boolean {
    if (isPermanent) return true
    if (expiresAtMillis <= 0L) return true
    return System.currentTimeMillis() < expiresAtMillis
  }

  fun getRemainingTimeAr(): String {
    if (isPermanent) return "دائم (مدى الحياة)"
    val diff = expiresAtMillis - System.currentTimeMillis()
    if (diff <= 0) return "منتهي الصلاحية"
    val minutes = diff / (1000 * 60)
    val hours = minutes / 60
    val days = hours / 24
    return when {
      days > 0 -> "$days يوم متبقي"
      hours > 0 -> "$hours ساعة متبقية"
      else -> "$minutes دقيقة متبقية"
    }
  }
}

@IgnoreExtraProperties
data class UserProfile(
  @DocumentId val id: String = "",
  val userId: String = "",
  val displayName: String = "",
  val email: String = "",
  val photoUrl: String? = null,
  val bio: String? = null,
  val globalRole: String = "member",
  val status: String = "online",
  val isBannedGlobally: Boolean = false,
  val banReason: String? = null,
  val banExpiresAtMillis: Long = 0L,
  @ServerTimestamp val createdAt: Timestamp? = null,
  @ServerTimestamp val updatedAt: Timestamp? = null
) {
  fun isGlobalBanActive(): Boolean {
    if (!isBannedGlobally) return false
    if (banExpiresAtMillis <= 0L) return true
    return System.currentTimeMillis() < banExpiresAtMillis
  }
}

@IgnoreExtraProperties
data class Room(
  @DocumentId val id: String = "",
  val name: String = "",
  val description: String = "",
  val ownerId: String = "",
  val ownerName: String = "",
  val category: String = "عام",
  val permissionLevel: String = "PUBLIC",
  val isLocked: Boolean = false,
  val admins: List<String> = emptyList(),
  val moderators: List<String> = emptyList(),
  val mutedUsers: List<String> = emptyList(),
  val bannedUsers: List<String> = emptyList(),
  val pinnedMessage: String? = null,
  val pinnedMessageSender: String? = null,
  val memberCount: Long = 1L,
  @ServerTimestamp val createdAt: Timestamp? = null,
  @ServerTimestamp val updatedAt: Timestamp? = null
) {
  fun getPermission(): RoomPermission = RoomPermission.fromKey(permissionLevel)

  fun isOwner(uid: String?): Boolean = uid != null && uid == ownerId

  fun isModerator(uid: String?): Boolean = uid != null && (moderators.contains(uid) || admins.contains(uid))

  fun getUserRole(uid: String?): UserRole {
    if (uid == null) return UserRole.MEMBER
    if (ownerId == uid) return UserRole.OWNER
    if (bannedUsers.contains(uid)) return UserRole.BANNED
    if (admins.contains(uid)) return UserRole.ADMIN
    if (moderators.contains(uid)) return UserRole.MODERATOR
    if (mutedUsers.contains(uid)) return UserRole.MUTED
    return UserRole.MEMBER
  }

  fun canManageRoles(uid: String?): Boolean {
    return isOwner(uid)
  }

  fun canModerate(uid: String?): Boolean {
    val role = getUserRole(uid)
    return role == UserRole.OWNER || role == UserRole.ADMIN || role == UserRole.MODERATOR
  }

  fun canDeleteMessage(uid: String?, messageSenderId: String): Boolean {
    if (uid == null) return false
    if (uid == messageSenderId) return true
    return canModerate(uid)
  }

  fun canPostMessages(uid: String?): Boolean {
    val role = getUserRole(uid)
    if (role == UserRole.BANNED || role == UserRole.MUTED) return false
    if (isLocked || getPermission() == RoomPermission.PRIVATE) {
      return role == UserRole.OWNER || role == UserRole.ADMIN || role == UserRole.MODERATOR
    }
    if (getPermission() == RoomPermission.APPROVAL_ONLY) {
      return role == UserRole.OWNER || role == UserRole.ADMIN || role == UserRole.MODERATOR || role == UserRole.MEMBER
    }
    return true
  }
}

@IgnoreExtraProperties
data class ChatMessage(
  @DocumentId val id: String = "",
  val roomId: String = "",
  val senderId: String = "",
  val senderName: String = "",
  val senderRole: String = "member",
  val content: String = "",
  val isAnnouncement: Boolean = false,
  @ServerTimestamp val createdAt: Timestamp? = null
)
