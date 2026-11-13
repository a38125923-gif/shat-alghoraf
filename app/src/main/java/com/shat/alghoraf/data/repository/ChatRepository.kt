package com.shat.alghoraf.data.repository

import android.content.Context
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.snapshots
import com.shat.alghoraf.R
import com.shat.alghoraf.data.model.BanRecord
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.DirectChat
import com.shat.alghoraf.data.model.DirectMessage
import com.shat.alghoraf.data.model.OWNER_ADMIN_EMAIL
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.ReplyTarget
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.data.model.TypingStatus
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.data.remote.OperationType
import com.shat.alghoraf.data.remote.handleFirestoreError
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.util.UUID

class ChatRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    constructor(context: Context) : this(
        db = FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        ),
        auth = Firebase.auth
    )

    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("يجب تسجيل الدخول بحساب Google للمتابعة.")

    private fun isVerifiedGlobalOwner(user: FirebaseUser?): Boolean {
        if (user == null) return false
        return user.email.equals(OWNER_ADMIN_EMAIL, ignoreCase = true) && user.isEmailVerified
    }

    fun observeRooms(): Flow<List<ChatRoom>> =
        db.collection("rooms")
            .whereEqualTo("isActive", true)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(ChatRoom::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }.sortedWith(
                    compareByDescending<ChatRoom> { it.id == "general" }
                        .thenByDescending { it.lastMessageAt?.toDate()?.time ?: 0L }
                        .thenBy { it.name }
                )
            }

    fun observePublicProfiles(): Flow<List<PublicProfile>> =
        db.collection("public_profiles")
            .whereEqualTo("isActive", true)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(PublicProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }.sortedWith(
                    compareByDescending<PublicProfile> { it.status == "online" }
                        .thenByDescending { it.isOwner }
                        .thenBy { it.displayName }
                )
            }

    fun observeRoomMessages(roomId: String): Flow<List<ChatMessage>> =
        db.collection("rooms")
            .document(roomId)
            .collection("messages")
            .whereEqualTo("roomId", roomId)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(ChatMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }.sortedBy { it.createdAt ?: Timestamp(0, 0) }
            }

    fun observeTypingUsers(roomId: String): Flow<List<TypingStatus>> =
        db.collection("rooms")
            .document(roomId)
            .collection("typing")
            .whereEqualTo("roomId", roomId)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(TypingStatus::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }
            }

    fun observeDirectChats(userId: String): Flow<List<DirectChat>> =
        db.collection("direct_chats")
            .whereArrayContains("participantIds", userId)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(DirectChat::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }.sortedByDescending { it.lastMessageAt ?: it.updatedAt ?: Timestamp(0, 0) }
            }

    fun observeDirectMessages(chatId: String, userId: String): Flow<List<DirectMessage>> =
        db.collection("direct_chats")
            .document(chatId)
            .collection("messages")
            .whereArrayContains("participantIds", userId)
            .snapshots()
            .map { snapshot ->
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(DirectMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }.sortedBy { it.createdAt ?: Timestamp(0, 0) }
            }

    fun observeBans(userId: String, isGlobalAdmin: Boolean): Flow<List<BanRecord>> {
        val query = if (isGlobalAdmin) {
            db.collection("bans")
        } else {
            db.collection("bans").whereEqualTo("targetUid", userId)
        }
        return query.snapshots().map { snapshot ->
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(BanRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
            }.sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
        }
    }

    suspend fun syncCurrentUserProfile(user: FirebaseUser) {
        val uid = user.uid
        val isOwner = isVerifiedGlobalOwner(user)
        val rawName = user.displayName?.trim().orEmpty()
        val safeName = when {
            isOwner && rawName.length < 2 -> "المالك العام"
            rawName.length >= 2 -> rawName.take(50)
            else -> "عضو الشات"
        }
        val email = (user.email ?: "").take(100)
        val photoUrl = user.photoUrl?.toString()?.takeIf { it.length <= 500 }

        val privateRef = db.collection("users").document(uid)
        val publicRef = db.collection("public_profiles").document(uid)

        try {
            val existingPrivate = privateRef.get().await()
            val resolvedRole = when {
                isOwner -> UserRole.OWNER.key
                existingPrivate.exists() -> existingPrivate.getString("globalRole") ?: UserRole.MEMBER.key
                else -> UserRole.MEMBER.key
            }

            if (!existingPrivate.exists()) {
                val privatePayload = mutableMapOf<String, Any>(
                    "userId" to uid,
                    "displayName" to safeName,
                    "email" to email,
                    "globalRole" to resolvedRole,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (photoUrl != null) privatePayload["photoUrl"] = photoUrl
                privateRef.set(privatePayload).await()
            } else {
                val privateUpdate = mutableMapOf<String, Any>(
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (isOwner && existingPrivate.getString("globalRole") != UserRole.OWNER.key) {
                    privateUpdate["globalRole"] = UserRole.OWNER.key
                }
                privateRef.update(privateUpdate).await()
            }

            val existingPublic = publicRef.get().await()
            if (!existingPublic.exists()) {
                val defaultEmoji = if (isOwner) UserRole.OWNER.badgeEmoji else UserRole.MEMBER.badgeEmoji
                val defaultBio = if (isOwner) "مالك ومؤسس شات الغرف الرسمي" else "عضو في شات الغرف ✨"
                val publicPayload = mutableMapOf<String, Any>(
                    "userId" to uid,
                    "displayName" to safeName,
                    "avatarEmoji" to defaultEmoji,
                    "bio" to defaultBio,
                    "globalRole" to resolvedRole,
                    "status" to "online",
                    "isActive" to true,
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (photoUrl != null) publicPayload["photoUrl"] = photoUrl
                publicRef.set(publicPayload).await()
            } else {
                val publicUpdate = mutableMapOf<String, Any>(
                    "status" to "online",
                    "isActive" to true,
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (isOwner && existingPublic.getString("globalRole") != UserRole.OWNER.key) {
                    publicUpdate["globalRole"] = UserRole.OWNER.key
                }
                publicRef.update(publicUpdate).await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, publicRef.path, auth)
            throw e
        }
    }

    suspend fun updatePresenceStatus(status: String) {
        val uid = auth.currentUser?.uid ?: return
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
            handleFirestoreError(e, OperationType.UPDATE, docRef.path, auth)
        }
    }

    suspend fun updateMyProfile(
        displayName: String,
        bio: String,
        avatarEmoji: String,
        status: String
    ) {
        val uid = requireUserId()
        val cleanName = displayName.trim().take(50)
        require(cleanName.length >= 2) { "يجب أن يكون الاسم المستعار حرفين على الأقل" }
        val cleanBio = bio.trim().take(200)
        val cleanEmoji = avatarEmoji.trim().take(16).ifEmpty { "💎" }

        val publicRef = db.collection("public_profiles").document(uid)
        val privateRef = db.collection("users").document(uid)

        try {
            publicRef.update(
                mapOf(
                    "displayName" to cleanName,
                    "bio" to cleanBio,
                    "avatarEmoji" to cleanEmoji,
                    "status" to status,
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            privateRef.update(
                mapOf(
                    "displayName" to cleanName,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path, auth)
            throw e
        }
    }

    suspend fun seedDefaultRoomsIfMissing() {
        requireUserId()
        val defaultRooms = listOf(
            mapOf(
                "id" to "general",
                "name" to "الغرفة العامة",
                "description" to "غرفة الدردشة الكتابية الرئيسية لجميع الأعضاء العرب",
                "category" to "عام",
                "icon" to "👑",
                "permissionLevel" to RoomPermissionLevel.PUBLIC.key,
                "isLocked" to false,
                "pinnedMessage" to "أهلاً بكم في الغرفة العامة — يرجى الالتزام بقوانين الشات والاحترام المتبادل 🌹"
            ),
            mapOf(
                "id" to "yemen",
                "name" to "اليمن أصل العرب",
                "description" to "ملتقى أهل اليمن والخليج والعرب جميعاً ❤️🇾🇪",
                "category" to "تعارف",
                "icon" to "🇾🇪",
                "permissionLevel" to RoomPermissionLevel.PUBLIC.key,
                "isLocked" to false,
                "pinnedMessage" to null
            ),
            mapOf(
                "id" to "saudi",
                "name" to "غرفة السعودية",
                "description" to "مجلس الأخوة والنشامى والمحبة في المملكة 🇸🇦",
                "category" to "ثقافة",
                "icon" to "🇸🇦",
                "permissionLevel" to RoomPermissionLevel.PUBLIC.key,
                "isLocked" to false,
                "pinnedMessage" to null
            ),
            mapOf(
                "id" to "teachers",
                "name" to "غرفة الثقافة والمعلمين",
                "description" to "حوارات ثقافية وأدبية وتعليمية هادفة 📚",
                "category" to "تعليم",
                "icon" to "📚",
                "permissionLevel" to RoomPermissionLevel.PUBLIC.key,
                "isLocked" to false,
                "pinnedMessage" to null
            ),
            mapOf(
                "id" to "admin_council",
                "name" to "مجلس الإدارة",
                "description" to "غرفة مغلقة خاصة بالمالك والمشرفين والأدمن 🛡️",
                "category" to "إدارة",
                "icon" to "🛡️",
                "permissionLevel" to RoomPermissionLevel.PRIVATE.key,
                "isLocked" to true,
                "pinnedMessage" to "مجلس التنسيق الإداري والمراقبة"
            )
        )

        for (roomMeta in defaultRooms) {
            val roomId = roomMeta["id"] as String
            val docRef = db.collection("rooms").document(roomId)
            try {
                val snap = docRef.get().await()
                if (!snap.exists()) {
                    val payload = mutableMapOf<String, Any>(
                        "name" to (roomMeta["name"] as String),
                        "description" to (roomMeta["description"] as String),
                        "ownerId" to "system_owner",
                        "ownerName" to "المالك العام 👑",
                        "category" to (roomMeta["category"] as String),
                        "icon" to (roomMeta["icon"] as String),
                        "permissionLevel" to (roomMeta["permissionLevel"] as String),
                        "isLocked" to (roomMeta["isLocked"] as Boolean),
                        "isActive" to true,
                        "admins" to emptyList<String>(),
                        "moderators" to emptyList<String>(),
                        "mutedUsers" to emptyList<String>(),
                        "bannedUsers" to emptyList<String>(),
                        "memberCount" to 1L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                    val pinned = roomMeta["pinnedMessage"] as? String
                    if (pinned != null) {
                        payload["pinnedMessage"] = pinned
                        payload["pinnedMessageSender"] = "المالك العام"
                    }
                    docRef.set(payload).await()
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                handleFirestoreError(e, OperationType.CREATE, docRef.path, auth)
            }
        }
    }

    suspend fun sendRoomMessage(
        roomId: String,
        senderProfile: PublicProfile,
        content: String,
        isAnnouncement: Boolean = false,
        replyTo: ReplyTarget? = null
    ) {
        val uid = requireUserId()
        val trimmed = content.trim().take(1000)
        require(trimmed.isNotEmpty()) { "الرسالة فارغة" }

        val msgId = "msg_${UUID.randomUUID().toString().replace("-", "").take(16)}"
        val msgRef = db.collection("rooms").document(roomId).collection("messages").document(msgId)
        val roomRef = db.collection("rooms").document(roomId)

        val avatar = senderProfile.photoUrl?.takeIf { it.isNotBlank() }
            ?: senderProfile.avatarEmoji?.takeIf { it.isNotBlank() }
            ?: senderProfile.roleEnum.badgeEmoji

        val payload = mutableMapOf<String, Any>(
            "roomId" to roomId,
            "senderId" to uid,
            "senderName" to senderProfile.displayName.take(50).ifEmpty { "عضو" },
            "senderRole" to senderProfile.globalRole,
            "senderAvatar" to avatar.take(500),
            "content" to trimmed,
            "isAnnouncement" to isAnnouncement,
            "reactions" to emptyList<String>(),
            "createdAt" to FieldValue.serverTimestamp()
        )
        if (replyTo != null) {
            payload["replyToMessageId"] = replyTo.messageId.take(128)
            payload["replyToSenderName"] = replyTo.senderName.take(50)
            payload["replyToContent"] = replyTo.content.take(200)
        }

        try {
            msgRef.set(payload).await()
            roomRef.update(
                mapOf(
                    "lastMessageText" to trimmed.take(140),
                    "lastMessageSender" to senderProfile.displayName.take(50),
                    "lastMessageAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, msgRef.path, auth)
            throw e
        }
    }

    suspend fun toggleMessageReaction(roomId: String, message: ChatMessage, emoji: String) {
        val uid = requireUserId()
        val token = "$emoji:$uid"
        val updated = if (message.reactions.contains(token)) {
            message.reactions.filterNot { it == token }
        } else {
            (message.reactions + token).take(100)
        }
        val msgRef = db.collection("rooms").document(roomId).collection("messages").document(message.id)
        try {
            msgRef.update(mapOf("reactions" to updated)).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, msgRef.path, auth)
            throw e
        }
    }

    suspend fun deleteRoomMessage(roomId: String, messageId: String) {
        requireUserId()
        val msgRef = db.collection("rooms").document(roomId).collection("messages").document(messageId)
        try {
            msgRef.delete().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, msgRef.path, auth)
            throw e
        }
    }

    suspend fun setTypingStatus(roomId: String, displayName: String, isTyping: Boolean) {
        val uid = auth.currentUser?.uid ?: return
        val docRef = db.collection("rooms").document(roomId).collection("typing").document(uid)
        try {
            if (isTyping) {
                docRef.set(
                    mapOf(
                        "roomId" to roomId,
                        "userId" to uid,
                        "displayName" to displayName.take(50).ifEmpty { "عضو" },
                        "updatedAt" to FieldValue.serverTimestamp()
                    ),
                    SetOptions.merge()
                ).await()
            } else {
                docRef.delete().await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // Non-critical ephemeral typing indicator
        }
    }

    suspend fun createRoom(
        name: String,
        description: String,
        category: String,
        icon: String,
        permissionLevel: RoomPermissionLevel,
        isLocked: Boolean,
        creatorName: String
    ) {
        val uid = requireUserId()
        val cleanName = name.trim().take(60)
        require(cleanName.length >= 2) { "اسم الغرفة يجب أن يكون حرفين على الأقل" }

        val roomId = "room_${UUID.randomUUID().toString().replace("-", "").take(12)}"
        val roomRef = db.collection("rooms").document(roomId)

        val payload = mapOf(
            "name" to cleanName,
            "description" to description.trim().take(300),
            "ownerId" to uid,
            "ownerName" to creatorName.take(50).ifEmpty { "عضو" },
            "category" to category.take(30).ifEmpty { "عام" },
            "icon" to icon.trim().take(16).ifEmpty { "💬" },
            "permissionLevel" to permissionLevel.key,
            "isLocked" to (isLocked || permissionLevel == RoomPermissionLevel.PRIVATE),
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
            handleFirestoreError(e, OperationType.CREATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun updateRoomSettings(
        roomId: String,
        name: String? = null,
        description: String? = null,
        category: String? = null,
        icon: String? = null,
        permissionLevel: RoomPermissionLevel? = null,
        isLocked: Boolean? = null,
        pinnedMessage: String? = null,
        pinnedMessageSender: String? = null,
        clearPinnedMessage: Boolean = false
    ) {
        requireUserId()
        val roomRef = db.collection("rooms").document(roomId)
        val updates = mutableMapOf<String, Any?>("updatedAt" to FieldValue.serverTimestamp())
        if (name != null) {
            val clean = name.trim().take(60)
            require(clean.length >= 2) { "اسم الغرفة يجب أن يكون حرفين على الأقل" }
            updates["name"] = clean
        }
        if (description != null) updates["description"] = description.trim().take(300)
        if (category != null) updates["category"] = category.take(30)
        if (icon != null) updates["icon"] = icon.trim().take(16).ifEmpty { "💬" }
        if (permissionLevel != null) updates["permissionLevel"] = permissionLevel.key
        if (isLocked != null) updates["isLocked"] = isLocked
        if (clearPinnedMessage) {
            updates["pinnedMessage"] = null
            updates["pinnedMessageSender"] = null
        } else if (pinnedMessage != null) {
            updates["pinnedMessage"] = pinnedMessage.trim().take(500)
            if (pinnedMessageSender != null) {
                updates["pinnedMessageSender"] = pinnedMessageSender.take(50)
            }
        }

        try {
            roomRef.update(updates).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun toggleRoomAdmin(room: ChatRoom, targetUid: String): Boolean {
        requireUserId()
        val isAdmin = room.admins.contains(targetUid)
        val nextAdmins = if (isAdmin) {
            room.admins.filterNot { it == targetUid }
        } else {
            (room.admins + targetUid).take(20)
        }
        val roomRef = db.collection("rooms").document(room.id)
        try {
            roomRef.update(
                mapOf(
                    "admins" to nextAdmins,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            return !isAdmin
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun toggleRoomModerator(room: ChatRoom, targetUid: String): Boolean {
        requireUserId()
        val isMod = room.moderators.contains(targetUid)
        val nextMods = if (isMod) {
            room.moderators.filterNot { it == targetUid }
        } else {
            (room.moderators + targetUid).take(50)
        }
        val roomRef = db.collection("rooms").document(room.id)
        try {
            roomRef.update(
                mapOf(
                    "moderators" to nextMods,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            return !isMod
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun unbanUserFromRoom(room: ChatRoom, targetUid: String) {
        requireUserId()
        val roomRef = db.collection("rooms").document(room.id)
        try {
            roomRef.update(
                mapOf(
                    "bannedUsers" to room.bannedUsers.filterNot { it == targetUid },
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun deleteRoom(roomId: String) {
        requireUserId()
        val roomRef = db.collection("rooms").document(roomId)
        try {
            roomRef.delete().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun clearRoomMessages(roomId: String) {
        requireUserId()
        val colRef = db.collection("rooms").document(roomId).collection("messages")
        try {
            val docs = colRef.whereEqualTo("roomId", roomId).get().await()
            val batch = db.batch()
            for (doc in docs.documents) {
                batch.delete(doc.reference)
            }
            batch.commit().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, colRef.path, auth)
            throw e
        }
    }

    suspend fun toggleMuteUser(room: ChatRoom, targetUid: String): Boolean {
        requireUserId()
        val isMuted = room.mutedUsers.contains(targetUid)
        val nextMuted = if (isMuted) {
            room.mutedUsers.filterNot { it == targetUid }
        } else {
            (room.mutedUsers + targetUid).take(100)
        }
        val roomRef = db.collection("rooms").document(room.id)
        try {
            roomRef.update(
                mapOf(
                    "mutedUsers" to nextMuted,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            return !isMuted
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, roomRef.path, auth)
            throw e
        }
    }

    suspend fun setUserGlobalRole(targetUid: String, newRole: UserRole) {
        requireUserId()
        val publicRef = db.collection("public_profiles").document(targetUid)
        val privateRef = db.collection("users").document(targetUid)
        try {
            publicRef.update(
                mapOf(
                    "globalRole" to newRole.key,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            privateRef.update(
                mapOf(
                    "globalRole" to newRole.key,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, publicRef.path, auth)
            throw e
        }
    }

    suspend fun banUser(
        targetUid: String,
        targetName: String,
        reason: String,
        isPermanent: Boolean,
        minutes: Int,
        isGlobal: Boolean,
        room: ChatRoom?,
        bannedByName: String
    ) {
        val uid = requireUserId()
        val banId = "ban_${UUID.randomUUID().toString().replace("-", "").take(14)}"
        val expiresAtMillis = if (isPermanent) Long.MAX_VALUE else System.currentTimeMillis() + minutes * 60_000L

        val banRef = db.collection("bans").document(banId)
        val payload = mutableMapOf<String, Any>(
            "targetUid" to targetUid,
            "targetName" to targetName.take(60).ifEmpty { "مستخدم" },
            "reason" to reason.trim().take(300).ifEmpty { "مخالفة قوانين الشات" },
            "isPermanent" to isPermanent,
            "expiresAtMillis" to expiresAtMillis,
            "bannedByUid" to uid,
            "bannedByName" to bannedByName.take(60).ifEmpty { "الإدارة" },
            "isGlobal" to isGlobal,
            "createdAt" to FieldValue.serverTimestamp()
        )
        if (!isGlobal && room != null) {
            payload["roomId"] = room.id
            payload["roomName"] = room.name.take(60)
        }

        try {
            banRef.set(payload).await()
            if (!isGlobal && room != null && !room.bannedUsers.contains(targetUid)) {
                db.collection("rooms").document(room.id).update(
                    mapOf(
                        "bannedUsers" to (room.bannedUsers + targetUid).take(100),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, banRef.path, auth)
            throw e
        }
    }

    suspend fun unbanUser(ban: BanRecord, room: ChatRoom?) {
        requireUserId()
        val banRef = db.collection("bans").document(ban.id)
        try {
            banRef.delete().await()
            if (!ban.isGlobal && ban.roomId != null && room != null) {
                db.collection("rooms").document(ban.roomId).update(
                    mapOf(
                        "bannedUsers" to room.bannedUsers.filterNot { it == ban.targetUid },
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, banRef.path, auth)
            throw e
        }
    }

    suspend fun broadcastGlobalAnnouncement(
        rooms: List<ChatRoom>,
        senderProfile: PublicProfile,
        text: String
    ) {
        requireUserId()
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        for (room in rooms) {
            sendRoomMessage(
                roomId = room.id,
                senderProfile = senderProfile,
                content = "📢 إعلان إداري عام: $trimmed",
                isAnnouncement = true
            )
        }
    }

    suspend fun openOrCreateDirectChat(
        myProfile: PublicProfile,
        otherProfile: PublicProfile
    ): String {
        val uid = requireUserId()
        val sortedIds = listOf(uid, otherProfile.userId).sorted()
        val chatId = "${sortedIds[0]}_${sortedIds[1]}"
        val chatRef = db.collection("direct_chats").document(chatId)

        val namesMap = mapOf(
            uid to myProfile.displayName.take(50),
            otherProfile.userId to otherProfile.displayName.take(50)
        )
        val avatarsMap = mapOf(
            uid to (myProfile.photoUrl ?: myProfile.avatarEmoji ?: myProfile.roleEnum.badgeEmoji),
            otherProfile.userId to (otherProfile.photoUrl ?: otherProfile.avatarEmoji ?: otherProfile.roleEnum.badgeEmoji)
        )

        try {
            val snap = chatRef.get().await()
            if (!snap.exists()) {
                chatRef.set(
                    mapOf(
                        "participantIds" to sortedIds,
                        "participantNames" to namesMap,
                        "participantAvatars" to avatarsMap,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                chatRef.update(
                    mapOf(
                        "participantNames" to namesMap,
                        "participantAvatars" to avatarsMap,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            return chatId
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, chatRef.path, auth)
            throw e
        }
    }

    suspend fun sendDirectMessage(
        chatId: String,
        participantIds: List<String>,
        senderProfile: PublicProfile,
        content: String,
        replyTo: ReplyTarget? = null
    ) {
        val uid = requireUserId()
        val trimmed = content.trim().take(1000)
        require(trimmed.isNotEmpty()) { "الرسالة فارغة" }

        val msgId = "dm_${UUID.randomUUID().toString().replace("-", "").take(16)}"
        val msgRef = db.collection("direct_chats").document(chatId).collection("messages").document(msgId)
        val chatRef = db.collection("direct_chats").document(chatId)

        val avatar = senderProfile.photoUrl?.takeIf { it.isNotBlank() }
            ?: senderProfile.avatarEmoji?.takeIf { it.isNotBlank() }
            ?: senderProfile.roleEnum.badgeEmoji

        val payload = mutableMapOf<String, Any>(
            "chatId" to chatId,
            "participantIds" to participantIds,
            "senderId" to uid,
            "senderName" to senderProfile.displayName.take(50).ifEmpty { "عضو" },
            "senderAvatar" to avatar.take(500),
            "content" to trimmed,
            "createdAt" to FieldValue.serverTimestamp()
        )
        if (replyTo != null) {
            payload["replyToMessageId"] = replyTo.messageId.take(128)
            payload["replyToSenderName"] = replyTo.senderName.take(50)
            payload["replyToContent"] = replyTo.content.take(200)
        }

        try {
            msgRef.set(payload).await()
            chatRef.update(
                mapOf(
                    "lastMessageText" to trimmed.take(140),
                    "lastMessageSenderId" to uid,
                    "lastMessageAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, msgRef.path, auth)
            throw e
        }
    }
}
