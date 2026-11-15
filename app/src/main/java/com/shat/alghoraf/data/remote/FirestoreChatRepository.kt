package com.shat.alghoraf.data.remote

import android.content.Context
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.snapshots
import com.shat.alghoraf.R
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
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.util.UUID

class FirestoreChatRepository(private val db: FirebaseFirestore) {

    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    companion object {
        const val OWNER_EMAIL = "a38125923@gmail.com"
        private val ESTIMATE = DocumentSnapshot.ServerTimestampBehavior.ESTIMATE

        fun directChatId(uidA: String, uidB: String): String =
            listOf(uidA, uidB).sorted().joinToString("_")
    }

    // --- Real-time Streams ---

    fun observeActiveRooms(): Flow<List<ChatRoom>> =
        db.collection("rooms")
            .whereEqualTo("isActive", true)
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsRoom::class.java, ESTIMATE)
                    .map { it.toChatRoom() }
                    .sortedBy { roomSortWeight(it.id) }
            }

    fun observePublicProfiles(): Flow<List<ChatUser>> =
        db.collection("public_profiles")
            .whereEqualTo("isActive", true)
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsPublicProfile::class.java, ESTIMATE)
                    .map { it.toChatUser() }
                    .sortedWith(compareByDescending<ChatUser> { it.isOnline }.thenByDescending { it.rank.power })
            }

    fun observeCurrentUserProfile(uid: String): Flow<ChatUser?> =
        db.collection("public_profiles")
            .document(uid)
            .snapshots()
            .map { snapshot ->
                if (snapshot.exists()) {
                    snapshot.toObject(FsPublicProfile::class.java, ESTIMATE)?.toChatUser()
                } else {
                    null
                }
            }

    fun observeRoomMessages(roomId: String): Flow<List<ChatMessage>> =
        db.collection("rooms").document(roomId)
            .collection("messages")
            .whereEqualTo("roomId", roomId)
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsMessage::class.java, ESTIMATE)
                    .sortedBy { it.createdAt ?: Timestamp(0, 0) }
                    .map { it.toChatMessage() }
            }

    fun observeWallPosts(): Flow<List<WallPost>> =
        db.collection("wall_posts")
            .whereEqualTo("isActive", true)
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsWallPost::class.java, ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                    .map { it.toWallPost() }
            }

    fun observeNotifications(uid: String): Flow<List<ChatNotification>> =
        db.collection("notifications")
            .whereIn("audience", listOf("all", uid))
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsChatNotification::class.java, ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                    .map { it.toChatNotification(uid) }
            }

    fun observeReports(uid: String, isOwnerAdmin: Boolean): Flow<List<UserReport>> {
        val query = if (isOwnerAdmin) {
            db.collection("reports")
        } else {
            db.collection("reports").whereEqualTo("reporterUid", uid)
        }
        return query.snapshots().map { snapshot ->
            snapshot.toObjects(FsUserReport::class.java, ESTIMATE)
                .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                .map { it.toUserReport() }
        }
    }

    fun observeDirectMessages(chatId: String, uid: String, partnerName: String): Flow<List<PrivateMessage>> =
        db.collection("direct_chats").document(chatId)
            .collection("messages")
            .whereArrayContains("participantIds", uid)
            .snapshots()
            .map { snapshot ->
                snapshot.toObjects(FsDirectMessage::class.java, ESTIMATE)
                    .sortedBy { it.createdAt ?: Timestamp(0, 0) }
                    .map { msg ->
                        val recipient = msg.participantIds.firstOrNull { it != msg.senderId } ?: ""
                        msg.toPrivateMessage(recipientUid = recipient, recipientName = partnerName)
                    }
            }

    // --- Initialization & Auth Profile Sync ---

    suspend fun ensureUserProfiles(
        uid: String,
        email: String,
        displayName: String,
        photoUrl: String?,
        emailVerified: Boolean
    ): Result<ChatUser> = runCatching {
        val isOwnerEmail = email.equals(OWNER_EMAIL, ignoreCase = true) && emailVerified
        val cleanName = displayName.trim().ifBlank { email.substringBefore("@").ifBlank { "عضو" } }.take(50)

        val userRef = db.collection("users").document(uid)
        val publicRef = db.collection("public_profiles").document(uid)

        val existingPublicSnap = try {
            publicRef.get().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, publicRef.path)
            throw e
        }

        val existingUserSnap = try {
            userRef.get().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, userRef.path)
            throw e
        }

        val defaultRole = if (isOwnerEmail) "owner" else "member"
        val defaultRank = if (isOwnerEmail) ChatRank.SITE_OWNER.id else ChatRank.MEMBER.id

        if (!existingUserSnap.exists()) {
            val privatePayload = mapOf(
                "userId" to uid,
                "displayName" to cleanName,
                "email" to email.take(100),
                "photoUrl" to photoUrl?.take(500),
                "globalRole" to defaultRole,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null } as Map<String, Any>
            try {
                userRef.set(privatePayload).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.CREATE, userRef.path)
                throw e
            }
        } else {
            val updatePrivate = mapOf(
                "displayName" to (existingUserSnap.getString("displayName") ?: cleanName),
                "photoUrl" to photoUrl?.take(500),
                "globalRole" to if (isOwnerEmail) "owner" else (existingUserSnap.getString("globalRole") ?: "member"),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null } as Map<String, Any>
            try {
                userRef.update(updatePrivate).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.UPDATE, userRef.path)
                throw e
            }
        }

        if (!existingPublicSnap.exists()) {
            val publicPayload = mapOf(
                "userId" to uid,
                "displayName" to cleanName,
                "username" to email.substringBefore("@").take(40),
                "avatarEmoji" to if (isOwnerEmail) "👑" else "😎",
                "photoUrl" to photoUrl?.take(500),
                "bio" to if (isOwnerEmail) "المالك الرسمي ومؤسس شات الغرف" else "أهلاً بكم في شات الغرف",
                "gender" to "ذكر",
                "globalRole" to defaultRole,
                "chatRank" to defaultRank,
                "avatarFrame" to if (isOwnerEmail) AvatarFrame.GOLD_ROYAL.id else AvatarFrame.NONE.id,
                "nameplateStyle" to if (isOwnerEmail) NameplateStyle.CRIMSON_ROYAL.id else NameplateStyle.DEFAULT.id,
                "vipFamily" to if (isOwnerEmail) "عائلة الملوك" else "",
                "coins" to if (isOwnerEmail) 50000L else 1500L,
                "isMuted" to false,
                "isBanned" to false,
                "status" to "online",
                "isActive" to true,
                "lastSeenAt" to FieldValue.serverTimestamp(),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null } as Map<String, Any>
            try {
                publicRef.set(publicPayload).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.CREATE, publicRef.path)
                throw e
            }
        } else {
            val statusUpdate = mutableMapOf<String, Any>(
                "status" to "online",
                "isActive" to true,
                "lastSeenAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (isOwnerEmail) {
                statusUpdate["globalRole"] = "owner"
                statusUpdate["chatRank"] = ChatRank.SITE_OWNER.id
            }
            if (!photoUrl.isNullOrBlank()) {
                statusUpdate["photoUrl"] = photoUrl.take(500)
            }
            try {
                publicRef.update(statusUpdate).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
                throw e
            }
        }

        val finalSnap = try {
            publicRef.get().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, publicRef.path)
            throw e
        }
        finalSnap.toObject(FsPublicProfile::class.java, ESTIMATE)?.toChatUser()
            ?: error("تعذر تحميل الملف الشخصي من السحابة")
    }

    suspend fun seedDefaultRoomsIfNeeded() {
        val canonicalRooms = listOf(
            Triple("general", "الغرفة العامة", Triple("ترحيب وتعارف جميع الأعضاء العرب", "💬", "عام")),
            Triple("yemen", "ديوانية اليمن", Triple("أصالة وكرم الضيافة اليمنية", "🇾🇪", "دول")),
            Triple("saudi", "مجلس المملكة", Triple("سوالف وقهوة عربية على مدار الساعة", "🇸🇦", "دول")),
            Triple("teachers", "ملتقى المثقفين", Triple("نقاشات أدبية وعلمية هادفة", "📚", "ثقافة")),
            Triple("admin_council", "مجلس الإدارة", Triple("اجتماعات كبار الشخصيات والمشرفين", "👑", "إدارة"))
        )
        for ((roomId, title, meta) in canonicalRooms) {
            val (desc, icon, category) = meta
            val roomRef = db.collection("rooms").document(roomId)
            try {
                val existing = roomRef.get().await()
                if (!existing.exists()) {
                    val payload = mapOf(
                        "name" to title,
                        "description" to desc,
                        "ownerId" to "system_owner",
                        "ownerName" to "المالك العام",
                        "category" to category,
                        "icon" to icon,
                        "permissionLevel" to "PUBLIC",
                        "isLocked" to false,
                        "micsEnabled" to true,
                        "isActive" to true,
                        "admins" to emptyList<String>(),
                        "moderators" to emptyList<String>(),
                        "mutedUsers" to emptyList<String>(),
                        "bannedUsers" to emptyList<String>(),
                        "memberCount" to 1L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                    roomRef.set(payload).await()
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.CREATE, roomRef.path)
            }
        }
    }

    suspend fun updatePresence(uid: String, status: String) {
        val docRef = db.collection("public_profiles").document(uid)
        try {
            docRef.update(
                mapOf(
                    "status" to status,
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docRef.path)
        }
    }

    // --- Messaging ---

    suspend fun sendRoomMessage(
        roomId: String,
        sender: ChatUser,
        content: String,
        imageUri: String = "",
        voiceDurationSec: Int = 0,
        isAnnouncement: Boolean = false
    ): Result<String> = runCatching {
        val msgId = "msg_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val msgRef = db.collection("rooms").document(roomId).collection("messages").document(msgId)
        val payload = mapOf(
            "roomId" to roomId,
            "senderId" to sender.userKey,
            "senderName" to sender.displayName.take(50),
            "senderRole" to sender.rank.toGlobalRole(),
            "senderRank" to sender.rank.id,
            "senderAvatar" to sender.avatarEmoji.take(16),
            "senderAvatarUri" to sender.avatarUri.ifBlank { null }?.take(500),
            "senderFrame" to sender.avatarFrame.id,
            "senderNameplate" to sender.nameplateStyle.id,
            "content" to content.take(1000),
            "imageUri" to imageUri.ifBlank { null }?.take(500),
            "voiceDurationSec" to voiceDurationSec.coerceIn(0, 600).toLong(),
            "isAnnouncement" to isAnnouncement,
            "reactions" to emptyList<String>(),
            "createdAt" to FieldValue.serverTimestamp()
        ).filterValues { it != null } as Map<String, Any>

        try {
            msgRef.set(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, msgRef.path)
            throw e
        }

        // Reward coins on own profile
        val profileRef = db.collection("public_profiles").document(sender.userKey)
        runCatching {
            profileRef.update(
                mapOf(
                    "coins" to FieldValue.increment(5L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        }

        msgId
    }

    suspend fun createRoom(
        name: String,
        description: String,
        iconEmoji: String,
        owner: ChatUser
    ): Result<String> = runCatching {
        val roomId = "room_${UUID.randomUUID().toString().replace("-", "").take(10)}"
        val roomRef = db.collection("rooms").document(roomId)
        val payload = mapOf(
            "name" to name.trim().take(60),
            "description" to description.trim().take(300),
            "ownerId" to owner.userKey,
            "ownerName" to owner.displayName.take(50),
            "category" to "عام",
            "icon" to iconEmoji.ifBlank { "💬" }.take(16),
            "permissionLevel" to "PUBLIC",
            "isLocked" to false,
            "micsEnabled" to true,
            "isActive" to true,
            "admins" to emptyList<String>(),
            "moderators" to emptyList<String>(),
            "mutedUsers" to emptyList<String>(),
            "bannedUsers" to emptyList<String>(),
            "memberCount" to 1L,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            roomRef.set(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, roomRef.path)
            throw e
        }
        roomId
    }

    suspend fun deleteRoom(roomId: String): Result<Unit> = runCatching {
        val roomRef = db.collection("rooms").document(roomId)
        try {
            roomRef.delete().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, roomRef.path)
            throw e
        }
    }

    suspend fun toggleRoomMics(roomId: String, enabled: Boolean): Result<Unit> = runCatching {
        val roomRef = db.collection("rooms").document(roomId)
        try {
            roomRef.update(
                mapOf(
                    "micsEnabled" to enabled,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path)
            throw e
        }
    }

    suspend fun clearRoomMessages(roomId: String): Result<Unit> = runCatching {
        val messagesCol = db.collection("rooms").document(roomId).collection("messages")
        try {
            val snap = messagesCol.whereEqualTo("roomId", roomId).get().await()
            val batch = db.batch()
            snap.documents.forEach { batch.delete(it.reference) }
            batch.commit().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, messagesCol.path)
            throw e
        }
    }

    // --- User Profile & Cosmetics ---

    suspend fun updateProfile(
        uid: String,
        displayName: String,
        bio: String,
        photoUrl: String?,
        vipFamily: String
    ): Result<Unit> = runCatching {
        val publicRef = db.collection("public_profiles").document(uid)
        val payload = mapOf(
            "displayName" to displayName.trim().take(50),
            "bio" to bio.trim().take(200),
            "photoUrl" to photoUrl?.ifBlank { null }?.take(500),
            "vipFamily" to vipFamily.trim().take(40),
            "updatedAt" to FieldValue.serverTimestamp()
        ).filterValues { it != null } as Map<String, Any>
        try {
            publicRef.update(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
            throw e
        }
    }

    suspend fun updateAppearance(
        uid: String,
        frame: AvatarFrame,
        nameplate: NameplateStyle,
        newCoins: Int
    ): Result<Unit> = runCatching {
        val publicRef = db.collection("public_profiles").document(uid)
        try {
            publicRef.update(
                mapOf(
                    "avatarFrame" to frame.id,
                    "nameplateStyle" to nameplate.id,
                    "coins" to newCoins.coerceAtLeast(0).toLong(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
            throw e
        }
    }

    // --- Moderation & Ranks ---

    suspend fun updateUserRank(targetUid: String, newRank: ChatRank): Result<Unit> = runCatching {
        val publicRef = db.collection("public_profiles").document(targetUid)
        try {
            publicRef.update(
                mapOf(
                    "chatRank" to newRank.id,
                    "globalRole" to newRank.toGlobalRole(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
            throw e
        }
    }

    suspend fun setUserMuted(targetUid: String, muted: Boolean, reason: String): Result<Unit> = runCatching {
        val publicRef = db.collection("public_profiles").document(targetUid)
        val payload = mapOf(
            "isMuted" to muted,
            "muteReason" to if (muted) reason.take(200) else "",
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            publicRef.update(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
            throw e
        }
    }

    suspend fun setUserBanned(targetUid: String, banned: Boolean, reason: String): Result<Unit> = runCatching {
        val publicRef = db.collection("public_profiles").document(targetUid)
        val payload = mapOf(
            "isBanned" to banned,
            "banReason" to if (banned) reason.take(200) else "",
            "status" to if (banned) "offline" else "online",
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            publicRef.update(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path)
            throw e
        }
    }

    // --- Direct 1-on-1 Messages ---

    suspend fun sendDirectMessage(sender: ChatUser, recipient: ChatUser, content: String): Result<String> = runCatching {
        val chatId = directChatId(sender.userKey, recipient.userKey)
        val participants = listOf(sender.userKey, recipient.userKey).sorted()
        val chatRef = db.collection("direct_chats").document(chatId)
        val msgId = "dm_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val msgRef = chatRef.collection("messages").document(msgId)

        val chatSnap = try {
            chatRef.get().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, chatRef.path)
            throw e
        }

        if (!chatSnap.exists()) {
            val chatPayload = mapOf(
                "participantIds" to participants,
                "participantNames" to mapOf(
                    sender.userKey to sender.displayName.take(50),
                    recipient.userKey to recipient.displayName.take(50)
                ),
                "participantAvatars" to mapOf(
                    sender.userKey to sender.avatarEmoji.take(16),
                    recipient.userKey to recipient.avatarEmoji.take(16)
                ),
                "lastMessageText" to content.take(160),
                "lastMessageSenderId" to sender.userKey,
                "lastMessageAt" to FieldValue.serverTimestamp(),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            try {
                chatRef.set(chatPayload).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.CREATE, chatRef.path)
                throw e
            }
        } else {
            try {
                chatRef.update(
                    mapOf(
                        "lastMessageText" to content.take(160),
                        "lastMessageSenderId" to sender.userKey,
                        "lastMessageAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.UPDATE, chatRef.path)
                throw e
            }
        }

        val msgPayload = mapOf(
            "chatId" to chatId,
            "participantIds" to participants,
            "senderId" to sender.userKey,
            "senderName" to sender.displayName.take(50),
            "senderAvatar" to sender.avatarEmoji.take(16),
            "content" to content.take(1000),
            "createdAt" to FieldValue.serverTimestamp()
        )
        try {
            msgRef.set(msgPayload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, msgRef.path)
            throw e
        }

        msgId
    }

    // --- Wall Posts, Notifications, Reports ---

    suspend fun publishWallPost(author: ChatUser, content: String): Result<String> = runCatching {
        val postId = "wall_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val postRef = db.collection("wall_posts").document(postId)
        val payload = mapOf(
            "authorId" to author.userKey,
            "authorName" to author.displayName.take(50),
            "authorRank" to author.rank.id,
            "authorEmoji" to author.avatarEmoji.take(16),
            "content" to content.trim().take(500),
            "likes" to 0L,
            "likedBy" to emptyList<String>(),
            "isActive" to true,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            postRef.set(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, postRef.path)
            throw e
        }
        postId
    }

    suspend fun likeWallPost(postId: String, uid: String): Result<Unit> = runCatching {
        val postRef = db.collection("wall_posts").document(postId)
        try {
            postRef.update(
                mapOf(
                    "likes" to FieldValue.increment(1L),
                    "likedBy" to FieldValue.arrayUnion(uid),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, postRef.path)
            throw e
        }
    }

    suspend fun addNotification(
        createdByUid: String,
        title: String,
        body: String,
        audience: String = "all"
    ): Result<String> = runCatching {
        val notifId = "notif_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val notifRef = db.collection("notifications").document(notifId)
        val payload = mapOf(
            "audience" to audience,
            "createdByUid" to createdByUid,
            "title" to title.take(100),
            "body" to body.take(400),
            "readBy" to emptyList<String>(),
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            notifRef.set(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, notifRef.path)
            throw e
        }
        notifId
    }

    suspend fun markNotificationRead(notifId: String, uid: String): Result<Unit> = runCatching {
        val notifRef = db.collection("notifications").document(notifId)
        try {
            notifRef.update(
                mapOf(
                    "readBy" to FieldValue.arrayUnion(uid),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, notifRef.path)
            throw e
        }
    }

    suspend fun submitReport(
        reporterUid: String,
        reporterName: String,
        targetName: String,
        reason: String
    ): Result<String> = runCatching {
        val reportId = "rep_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val reportRef = db.collection("reports").document(reportId)
        val payload = mapOf(
            "reporterUid" to reporterUid,
            "reporterName" to reporterName.take(50),
            "targetName" to targetName.trim().take(60),
            "reason" to reason.trim().take(300),
            "status" to "pending",
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        try {
            reportRef.set(payload).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, reportRef.path)
            throw e
        }
        reportId
    }

    suspend fun resolveReport(reportId: String): Result<Unit> = runCatching {
        val reportRef = db.collection("reports").document(reportId)
        try {
            reportRef.update(
                mapOf(
                    "status" to "resolved",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, reportRef.path)
            throw e
        }
    }

    private fun roomSortWeight(id: String): Int = when (id) {
        "general" -> 0
        "yemen" -> 1
        "saudi" -> 2
        "teachers" -> 3
        "admin_council" -> 4
        else -> 10
    }
}
