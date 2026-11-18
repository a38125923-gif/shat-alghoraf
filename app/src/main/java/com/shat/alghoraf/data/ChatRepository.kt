package com.shat.alghoraf.data

import android.content.Context
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.snapshots
import com.shat.alghoraf.R
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import kotlin.coroutines.cancellation.CancellationException

class ChatRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw IllegalStateException("يجب تسجيل الدخول بحساب Google أولاً.")
    }

    private fun isCurrentSupremeOwner(): Boolean {
        val u = auth.currentUser ?: return false
        return DefaultCatalogs.isSupremeOwnerEmail(u.email) && u.isEmailVerified
    }

    private fun <T> Flow<T>.guardFirestore(op: OperationType, path: String, expectedUid: String): Flow<T> =
        this.catch { error ->
            val fsError = generateSequence(error) { it.cause }
                .filterIsInstance<FirebaseFirestoreException>()
                .firstOrNull()
            if (fsError == null && error is CancellationException) throw error
            val toLog = fsError ?: (error as? Exception)
            if (toLog != null && auth.currentUser?.uid == expectedUid) {
                handleFirestoreError(toLog, op, path)
            }
            throw error
        }

    // --- Real-Time Streams ---

    fun observeMyPrivateUser(uid: String): Flow<UserPrivate?> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("users").document(uid)
                .snapshots()
                .map { it.toObject(UserPrivate::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE) }
                .guardFirestore(OperationType.GET, "users/$uid", currentUid)
        )
    }

    fun observeMyProfile(uid: String): Flow<PublicProfile?> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("public_profiles").document(uid)
                .snapshots()
                .map { it.toObject(PublicProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE) }
                .guardFirestore(OperationType.GET, "public_profiles/$uid", currentUid)
        )
    }

    fun observePublicProfiles(): Flow<List<PublicProfile>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("public_profiles")
                .whereEqualTo("isPublic", true)
                .snapshots()
                .map { snap ->
                    snap.toObjects(PublicProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.activityPoints }
                }
                .guardFirestore(OperationType.LIST, "public_profiles", currentUid)
        )
    }

    fun observeRooms(): Flow<List<ChatRoom>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("rooms")
                .whereEqualTo("isActive", true)
                .snapshots()
                .map { snap ->
                    val list = snap.toObjects(ChatRoom::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    if (list.isEmpty()) DefaultCatalogs.defaultRooms
                    else list.sortedWith(compareBy<ChatRoom> { it.id != "general" }.thenByDescending { it.activityPoints })
                }
                .guardFirestore(OperationType.LIST, "rooms", currentUid)
        )
    }

    fun observeRoomMics(roomId: String): Flow<List<RoomMicSlot>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("rooms").document(roomId).collection("mics")
                .whereEqualTo("roomId", roomId)
                .snapshots()
                .map { snap ->
                    val bySlot = snap.toObjects(RoomMicSlot::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .associateBy { it.slotNumber.toInt() }
                    (1..5).map { slot ->
                        bySlot[slot] ?: RoomMicSlot(
                            id = slot.toString(),
                            roomId = roomId,
                            slotNumber = slot.toLong()
                        )
                    }
                }
                .guardFirestore(OperationType.LIST, "rooms/$roomId/mics", currentUid)
        )
    }

    fun observeRoomMessages(roomId: String): Flow<List<ChatMessage>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("messages")
                .whereEqualTo("roomId", roomId)
                .snapshots()
                .map { snap ->
                    snap.toObjects(ChatMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedBy { it.createdAt ?: Timestamp(0, 0) }
                        .takeLast(120)
                }
                .guardFirestore(OperationType.LIST, "messages", currentUid)
        )
    }

    fun observeRanks(): Flow<List<RankConfig>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("ranks")
                .whereEqualTo("isActive", true)
                .snapshots()
                .map { snap ->
                    val list = snap.toObjects(RankConfig::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    if (list.isEmpty()) DefaultCatalogs.defaultRanks
                    else list.sortedByDescending { it.power }
                }
                .guardFirestore(OperationType.LIST, "ranks", currentUid)
        )
    }

    fun observeSiteSettings(): Flow<SiteSettings> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("site_settings").document("site")
                .snapshots()
                .map { snap ->
                    snap.toObject(SiteSettings::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        ?: SiteSettings()
                }
                .guardFirestore(OperationType.GET, "site_settings/site", currentUid)
        )
    }

    fun observeNews(): Flow<List<NewsPost>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("news")
                .whereEqualTo("isPublished", true)
                .snapshots()
                .map { snap ->
                    snap.toObjects(NewsPost::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "news", currentUid)
        )
    }

    fun observeWallPosts(): Flow<List<WallPost>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("wall_posts")
                .whereEqualTo("isPublic", true)
                .snapshots()
                .map { snap ->
                    snap.toObjects(WallPost::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "wall_posts", currentUid)
        )
    }

    fun observePrivateMessages(uid: String): Flow<List<PrivateMessage>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("private_messages")
                .whereArrayContains("participants", uid)
                .snapshots()
                .map { snap ->
                    snap.toObjects(PrivateMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedBy { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "private_messages", currentUid)
        )
    }

    fun observeFriendships(uid: String): Flow<List<Friendship>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("friendships")
                .whereArrayContains("participants", uid)
                .snapshots()
                .map { snap ->
                    snap.toObjects(Friendship::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.updatedAt ?: it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "friendships", currentUid)
        )
    }

    fun observeNotifications(uid: String): Flow<List<NotificationItem>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("notifications")
                .whereEqualTo("recipientId", uid)
                .snapshots()
                .map { snap ->
                    snap.toObjects(NotificationItem::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "notifications", currentUid)
        )
    }

    fun observeGiftTransactions(): Flow<List<GiftTransaction>> = flow {
        val currentUid = requireUserId()
        emitAll(
            db.collection("gifts")
                .whereEqualTo("isPublic", true)
                .snapshots()
                .map { snap ->
                    snap.toObjects(GiftTransaction::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                        .take(50)
                }
                .guardFirestore(OperationType.LIST, "gifts", currentUid)
        )
    }

    fun observeReports(uid: String, supremeOwner: Boolean): Flow<List<UserReport>> = flow {
        val currentUid = requireUserId()
        val query = if (supremeOwner) {
            db.collection("reports")
        } else {
            db.collection("reports").whereEqualTo("reporterId", uid)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(UserReport::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "reports", currentUid)
        )
    }

    fun observeBans(uid: String, supremeOwner: Boolean): Flow<List<BanRecord>> = flow {
        val currentUid = requireUserId()
        val query = if (supremeOwner) {
            db.collection("bans")
        } else {
            db.collection("bans").whereEqualTo("targetUserId", uid)
        }
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(BanRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .guardFirestore(OperationType.LIST, "bans", currentUid)
        )
    }

    // --- Account Bootstrap & Supreme Owner Promotion ---

    suspend fun ensureUserProvisioned(): Result<Unit> {
        var currentPath = "users"
        return try {
            val firebaseUser = auth.currentUser ?: throw IllegalStateException("المستخدم غير مسجل الدخول")
            val uid = firebaseUser.uid
            val email = firebaseUser.email?.trim()?.lowercase().orEmpty().ifBlank { "$uid@google.local" }
            val rawName = firebaseUser.displayName?.trim().orEmpty()
                .ifBlank { email.substringBefore("@").ifBlank { "عضو" } }
                .take(36)
                .let { if (it.length < 2) "عضو_$it" else it }
            val photoUrl = firebaseUser.photoUrl?.toString().orEmpty().take(400)
            val isSupreme = DefaultCatalogs.isSupremeOwnerEmail(email) && firebaseUser.isEmailVerified

            currentPath = "users/$uid"
            val userRef = db.collection("users").document(uid)
            val publicRef = db.collection("public_profiles").document(uid)

            val userSnap = userRef.get().await()
            val publicSnap = publicRef.get().await()

            if (!userSnap.exists()) {
                val initRole = if (isSupreme) "site_owner" else "member"
                val initCoins = if (isSupreme) 99999L else 1500L
                val privateMap = mapOf(
                    "userId" to uid,
                    "email" to email,
                    "username" to rawName,
                    "role" to initRole,
                    "coins" to initCoins,
                    "isStealth" to false,
                    "isBanned" to false,
                    "banReason" to "",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                userRef.set(privateMap).await()
            } else if (isSupreme) {
                val role = userSnap.getString("role") ?: "member"
                val coins = userSnap.getLong("coins") ?: 0L
                val banned = userSnap.getBoolean("isBanned") ?: false
                if (role != "site_owner" || coins < 99999L || banned) {
                    userRef.update(
                        mapOf(
                            "role" to "site_owner",
                            "coins" to maxOf(coins, 99999L),
                            "isBanned" to false,
                            "banReason" to "",
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
            }

            currentPath = "public_profiles/$uid"
            if (!publicSnap.exists()) {
                val initRole = if (isSupreme) "site_owner" else "member"
                val initCoins = if (isSupreme) 99999L else 1500L
                val publicMap = mapOf(
                    "userId" to uid,
                    "username" to rawName,
                    "displayName" to rawName,
                    "role" to initRole,
                    "bio" to if (isSupreme) "صاحب الموقع والمؤسس الأعلى" else "مرحباً بالجميع في شات الغرف",
                    "avatarUrl" to photoUrl,
                    "nameColor" to if (isSupreme) "#B91C1C" else "#1A45E5",
                    "textColor" to "#1E293B",
                    "nameBgColor" to "",
                    "neonColor" to if (isSupreme) "#F59E0B" else "",
                    "fontFamily" to "Cairo",
                    "fontStyle" to if (isSupreme) "Bold" else "Normal",
                    "avatarFrame" to if (isSupreme) "gold_royal" else "none",
                    "nameplateStyle" to if (isSupreme) "crimson_royal" else "default",
                    "nameShine" to if (isSupreme) "gold_shimmer" else "none",
                    "vipWings" to isSupreme,
                    "profileMusic" to "",
                    "vipFamily" to "",
                    "coins" to initCoins,
                    "activityPoints" to 0L,
                    "giftsReceived" to 0L,
                    "giftsSent" to 0L,
                    "isStealth" to false,
                    "isOnline" to true,
                    "isPublic" to true,
                    "currentRoomId" to "general",
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                publicRef.set(publicMap).await()
            } else {
                val updates = mutableMapOf<String, Any>(
                    "isOnline" to true,
                    "lastSeenAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (isSupreme) {
                    updates["role"] = "site_owner"
                    val coins = publicSnap.getLong("coins") ?: 0L
                    if (coins < 99999L) updates["coins"] = 99999L
                }
                publicRef.update(updates).await()
            }

            if (isSupreme) {
                currentPath = "admins/$uid"
                val adminRef = db.collection("admins").document(uid)
                val adminSnap = adminRef.get().await()
                if (!adminSnap.exists()) {
                    adminRef.set(
                        mapOf(
                            "userId" to uid,
                            "role" to "site_owner",
                            "grantedBy" to uid,
                            "createdAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
                seedDefaultsIfMissing(uid)
            }

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, currentPath)
            Result.failure(e)
        }
    }

    private suspend fun seedDefaultsIfMissing(uid: String) {
        try {
            val roomsSnap = db.collection("rooms").whereEqualTo("isActive", true).limit(1).get().await()
            if (roomsSnap.isEmpty) {
                for (room in DefaultCatalogs.defaultRooms) {
                    db.collection("rooms").document(room.id).set(
                        mapOf(
                            "name" to room.name,
                            "description" to room.description,
                            "icon" to room.icon,
                            "imageUrl" to room.imageUrl,
                            "bgTheme" to room.bgTheme,
                            "wallpaperUrl" to room.wallpaperUrl,
                            "welcomeMessage" to room.welcomeMessage,
                            "minRankPower" to room.minRankPower,
                            "micsEnabled" to room.micsEnabled,
                            "ownerUserId" to uid,
                            "ownerName" to room.ownerName,
                            "activityPoints" to room.activityPoints,
                            "youtubeVideoId" to "",
                            "youtubeTitle" to "",
                            "youtubeIsPlaying" to false,
                            "isActive" to true,
                            "createdBy" to uid,
                            "createdAt" to FieldValue.serverTimestamp(),
                            "updatedAt" to FieldValue.serverTimestamp()
                        ),
                        SetOptions.merge()
                    ).await()
                }
            }

            val ranksSnap = db.collection("ranks").whereEqualTo("isActive", true).limit(1).get().await()
            if (ranksSnap.isEmpty) {
                for (rank in DefaultCatalogs.defaultRanks) {
                    db.collection("ranks").document(rank.key).set(
                        mapOf(
                            "key" to rank.key,
                            "label" to rank.label,
                            "icon" to rank.icon,
                            "bgColor" to rank.bgColor,
                            "textColor" to rank.textColor,
                            "power" to rank.power,
                            "tierOrder" to rank.tierOrder,
                            "isSystem" to rank.isSystem,
                            "permMute" to rank.permMute,
                            "permKick" to rank.permKick,
                            "permBan" to rank.permBan,
                            "permSetRank" to rank.permSetRank,
                            "permClearRoom" to rank.permClearRoom,
                            "permManageRooms" to rank.permManageRooms,
                            "permAccessPanel" to rank.permAccessPanel,
                            "permRoomOwner" to rank.permRoomOwner,
                            "permPublishNews" to rank.permPublishNews,
                            "permUseAddons" to rank.permUseAddons,
                            "maxAssignableRank" to rank.maxAssignableRank,
                            "isActive" to true,
                            "createdAt" to FieldValue.serverTimestamp(),
                            "updatedAt" to FieldValue.serverTimestamp()
                        ),
                        SetOptions.merge()
                    ).await()
                }
            }

            val settingsRef = db.collection("site_settings").document("site")
            val settingsSnap = settingsRef.get().await()
            if (!settingsSnap.exists()) {
                val d = SiteSettings()
                settingsRef.set(
                    mapOf(
                        "siteName" to d.siteName,
                        "siteDescription" to d.siteDescription,
                        "welcomeBanner" to d.welcomeBanner,
                        "marqueeText" to d.marqueeText,
                        "defaultRoomId" to d.defaultRoomId,
                        "allowGuestMics" to d.allowGuestMics,
                        "soundEffectsEnabled" to d.soundEffectsEnabled,
                        "isPublic" to true,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "seed_defaults")
        }
    }

    // --- Presence & Heartbeat ---

    suspend fun sendHeartbeat(roomId: String, online: Boolean, incrementActivity: Boolean = false): Result<Unit> {
        val path = "public_profiles/${auth.currentUser?.uid ?: "none"}"
        return try {
            val uid = requireUserId()
            val updates = mutableMapOf<String, Any>(
                "isOnline" to online,
                "currentRoomId" to roomId.take(64).ifBlank { "general" },
                "lastSeenAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (online && incrementActivity) {
                updates["activityPoints"] = FieldValue.increment(1L)
            }
            db.collection("public_profiles").document(uid).update(updates).await()
            if (online && incrementActivity) {
                val roomRef = db.collection("rooms").document(roomId.take(64).ifBlank { "general" })
                val roomSnap = roomRef.get().await()
                if (roomSnap.exists()) {
                    roomRef.update(
                        mapOf(
                            "activityPoints" to FieldValue.increment(1L),
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun toggleStealth(enabled: Boolean): Result<Unit> {
        val path = "public_profiles/${auth.currentUser?.uid ?: "none"}"
        return try {
            val uid = requireUserId()
            if (!isCurrentSupremeOwner()) {
                return Result.failure(IllegalStateException("وضع التخفي متاح لصاحب الموقع فقط."))
            }
            db.collection("users").document(uid).update(
                mapOf(
                    "isStealth" to enabled,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            db.collection("public_profiles").document(uid).update(
                mapOf(
                    "isStealth" to enabled,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    // --- Chat Messaging & Media ---

    suspend fun sendRoomMessage(
        roomId: String,
        sender: PublicProfile,
        content: String,
        msgType: String = "text",
        mediaUrl: String = "",
        isAdminNotice: Boolean = false,
        roomProfiles: List<PublicProfile> = emptyList()
    ): Result<Unit> {
        val path = "messages"
        return try {
            val uid = requireUserId()
            require(sender.userId == uid)
            val safeContent = content.trim().take(2000)
            val safeMedia = mediaUrl.take(640000)
            require(safeContent.isNotEmpty() || safeMedia.isNotEmpty()) { "الرسالة فارغة" }

            val docRef = db.collection("messages").document()
            val payload = mapOf(
                "roomId" to roomId.take(64),
                "senderId" to uid,
                "senderName" to sender.shownName.take(60),
                "senderRole" to sender.role.take(40),
                "nameColor" to sender.nameColor.take(30),
                "textColor" to sender.textColor.take(30),
                "nameBgColor" to sender.nameBgColor.take(30),
                "neonColor" to sender.neonColor.take(30),
                "fontFamily" to sender.fontFamily.take(40),
                "fontStyle" to sender.fontStyle.take(40),
                "avatarUrl" to sender.avatarUrl.take(340000),
                "avatarFrame" to sender.avatarFrame.take(40),
                "nameplateStyle" to sender.nameplateStyle.take(40),
                "nameShine" to sender.nameShine.take(40),
                "vipWings" to sender.vipWings,
                "isAdminNotice" to isAdminNotice,
                "isGift" to false,
                "msgType" to msgType,
                "content" to safeContent,
                "mediaUrl" to safeMedia,
                "createdAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()

            // Increment user & room activity points safely
            db.collection("public_profiles").document(uid).update(
                mapOf(
                    "activityPoints" to FieldValue.increment(1L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            val roomDoc = db.collection("rooms").document(roomId).get().await()
            if (roomDoc.exists()) {
                db.collection("rooms").document(roomId).update(
                    mapOf(
                        "activityPoints" to FieldValue.increment(1L),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }

            // Detect @mentions or exact displayName mentions and create real Firestore notification
            if (safeContent.isNotBlank() && roomProfiles.isNotEmpty()) {
                val lower = safeContent.lowercase()
                roomProfiles.filter { it.userId != uid }.take(30).forEach { target ->
                    val shown = target.shownName.trim().lowercase()
                    val uname = target.username.trim().lowercase()
                    val matched = (shown.length >= 2 && (lower.contains("@$shown") || lower.contains(shown))) ||
                        (uname.length >= 2 && lower.contains("@$uname"))
                    if (matched) {
                        sendNotification(
                            recipientId = target.userId,
                            sender = sender,
                            type = "mention",
                            title = "📣 منشن من ${sender.shownName}",
                            body = safeContent.take(180)
                        )
                    }
                }
            }

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteMessage(messageId: String): Result<Unit> {
        val path = "messages/$messageId"
        return try {
            requireUserId()
            db.collection("messages").document(messageId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- Room Microphones (Slots 1..5) ---

    suspend fun claimOrToggleMic(roomId: String, slotNumber: Int, user: PublicProfile): Result<Unit> {
        val path = "rooms/$roomId/mics/$slotNumber"
        return try {
            val uid = requireUserId()
            require(slotNumber in 1..5)
            val ref = db.collection("rooms").document(roomId).collection("mics").document(slotNumber.toString())
            val snap = ref.get().await()
            if (!snap.exists()) {
                ref.set(
                    mapOf(
                        "roomId" to roomId,
                        "slotNumber" to slotNumber.toLong(),
                        "holderUid" to uid,
                        "holderName" to user.shownName.take(60),
                        "holderAvatar" to user.avatarUrl.take(340000),
                        "holderRole" to user.role.take(40),
                        "isMutedByUser" to false,
                        "isMutedByAdmin" to false,
                        "isTalking" to true,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                val holder = snap.getString("holderUid").orEmpty()
                if (holder.isBlank()) {
                    ref.update(
                        mapOf(
                            "holderUid" to uid,
                            "holderName" to user.shownName.take(60),
                            "holderAvatar" to user.avatarUrl.take(340000),
                            "holderRole" to user.role.take(40),
                            "isMutedByUser" to false,
                            "isMutedByAdmin" to false,
                            "isTalking" to true,
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                } else if (holder == uid) {
                    val wasMuted = snap.getBoolean("isMutedByUser") ?: false
                    ref.update(
                        mapOf(
                            "isMutedByUser" to !wasMuted,
                            "isTalking" to wasMuted,
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun leaveMic(roomId: String, slotNumber: Int): Result<Unit> {
        val path = "rooms/$roomId/mics/$slotNumber"
        return try {
            requireUserId()
            val ref = db.collection("rooms").document(roomId).collection("mics").document(slotNumber.toString())
            ref.update(
                mapOf(
                    "holderUid" to "",
                    "holderName" to "",
                    "holderAvatar" to "",
                    "holderRole" to "member",
                    "isMutedByUser" to false,
                    "isMutedByAdmin" to false,
                    "isTalking" to false,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun adminMuteMic(roomId: String, slotNumber: Int, mute: Boolean): Result<Unit> {
        val path = "rooms/$roomId/mics/$slotNumber"
        return try {
            requireUserId()
            db.collection("rooms").document(roomId).collection("mics").document(slotNumber.toString())
                .update(
                    mapOf(
                        "isMutedByAdmin" to mute,
                        "isTalking" to !mute,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateMicTalking(roomId: String, slotNumber: Int, talking: Boolean): Result<Unit> {
        val path = "rooms/$roomId/mics/$slotNumber"
        return try {
            val uid = requireUserId()
            val ref = db.collection("rooms").document(roomId).collection("mics").document(slotNumber.toString())
            val snap = ref.get().await()
            if (snap.exists() && snap.getString("holderUid") == uid) {
                ref.update(
                    mapOf(
                        "isTalking" to talking,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- Profile & 4-Tab Customizations ---

    suspend fun updateMyCustomizations(
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
    ): Result<Unit> {
        val path = "public_profiles/${auth.currentUser?.uid ?: "none"}"
        return try {
            val uid = requireUserId()
            val safeName = displayName.trim().take(48).ifBlank { "عضو" }
            db.collection("public_profiles").document(uid).update(
                mapOf(
                    "displayName" to safeName,
                    "bio" to bio.trim().take(240),
                    "avatarUrl" to avatarUrl.take(400000),
                    "nameColor" to nameColor.take(30),
                    "textColor" to textColor.take(30),
                    "nameBgColor" to nameBgColor.take(30),
                    "neonColor" to neonColor.take(30),
                    "fontFamily" to fontFamily.take(40),
                    "fontStyle" to fontStyle.take(40),
                    "avatarFrame" to avatarFrame.take(40),
                    "nameplateStyle" to nameplateStyle.take(40),
                    "nameShine" to nameShine.take(40),
                    "vipWings" to vipWings,
                    "profileMusic" to profileMusic.take(80),
                    "vipFamily" to vipFamily.trim().take(60),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    // --- Gifts System ---

    suspend fun sendGift(
        sender: PublicProfile,
        recipient: PublicProfile,
        gift: GiftCatalogItem,
        roomId: String
    ): Result<Unit> {
        val path = "gifts"
        return try {
            val uid = requireUserId()
            require(sender.userId == uid)
            require(recipient.userId != uid) { "لا يمكنك إرسال هدية لنفسك." }
            require(sender.coins >= gift.cost) { "رصيد الكوينز غير كافٍ (${sender.coins} < ${gift.cost})." }

            // 1. Deduct sender coins & increment giftsSent
            db.collection("public_profiles").document(uid).update(
                mapOf(
                    "coins" to (sender.coins - gift.cost),
                    "giftsSent" to FieldValue.increment(1L),
                    "activityPoints" to FieldValue.increment(5L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // 2. Credit recipient coins & giftsReceived
            db.collection("public_profiles").document(recipient.userId).update(
                mapOf(
                    "coins" to FieldValue.increment(gift.reward),
                    "giftsReceived" to FieldValue.increment(1L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // 3. Log gift transaction
            db.collection("gifts").document().set(
                mapOf(
                    "senderId" to uid,
                    "senderName" to sender.shownName.take(60),
                    "recipientId" to recipient.userId,
                    "recipientName" to recipient.shownName.take(60),
                    "giftId" to gift.id,
                    "giftName" to gift.name,
                    "giftEmoji" to gift.emoji,
                    "cost" to gift.cost,
                    "reward" to gift.reward,
                    "roomId" to roomId.take(64),
                    "isPublic" to true,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // 4. Broadcast celebration message in room
            db.collection("messages").document().set(
                mapOf(
                    "roomId" to roomId.take(64),
                    "senderId" to uid,
                    "senderName" to sender.shownName.take(60),
                    "senderRole" to sender.role.take(40),
                    "nameColor" to sender.nameColor.take(30),
                    "textColor" to sender.textColor.take(30),
                    "avatarUrl" to sender.avatarUrl.take(340000),
                    "avatarFrame" to sender.avatarFrame.take(40),
                    "nameplateStyle" to sender.nameplateStyle.take(40),
                    "nameShine" to sender.nameShine.take(40),
                    "vipWings" to sender.vipWings,
                    "isAdminNotice" to false,
                    "isGift" to true,
                    "giftName" to gift.name,
                    "giftEmoji" to gift.emoji,
                    "giftRecipientName" to recipient.shownName.take(60),
                    "msgType" to "gift",
                    "content" to "أهدى ${sender.shownName} هدية ${gift.emoji} ${gift.name} إلى ${recipient.shownName}!",
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // 5. Notify recipient
            sendNotification(
                recipientId = recipient.userId,
                sender = sender,
                type = "gift",
                title = "هدية جديدة ${gift.emoji}",
                body = "أرسل لك ${sender.shownName} هدية ${gift.name} (+${gift.reward} كوينز)"
            )

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    // --- Social: Notifications, PM, Friends, Wall, Reports ---

    suspend fun sendNotification(
        recipientId: String,
        sender: PublicProfile,
        type: String,
        title: String,
        body: String
    ): Result<Unit> {
        return try {
            val uid = requireUserId()
            db.collection("notifications").document().set(
                mapOf(
                    "recipientId" to recipientId,
                    "senderId" to uid,
                    "senderName" to sender.shownName.take(60),
                    "type" to type.take(40),
                    "title" to title.take(120),
                    "body" to body.take(400),
                    "isRead" to false,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "notifications")
            Result.failure(e)
        }
    }

    suspend fun markNotificationRead(notifId: String): Result<Unit> {
        return try {
            requireUserId()
            db.collection("notifications").document(notifId)
                .update("isRead", true).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, "notifications/$notifId")
            Result.failure(e)
        }
    }

    suspend fun sendPrivateMessage(sender: PublicProfile, recipient: PublicProfile, content: String): Result<Unit> {
        return try {
            val uid = requireUserId()
            val text = content.trim().take(1500)
            require(text.isNotEmpty())
            db.collection("private_messages").document().set(
                mapOf(
                    "senderId" to uid,
                    "senderName" to sender.shownName.take(60),
                    "senderAvatar" to sender.avatarUrl.take(340000),
                    "receiverId" to recipient.userId,
                    "receiverName" to recipient.shownName.take(60),
                    "content" to text,
                    "participants" to listOf(uid, recipient.userId),
                    "isRead" to false,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()
            sendNotification(
                recipientId = recipient.userId,
                sender = sender,
                type = "pm",
                title = "رسالة خاصة من ${sender.shownName}",
                body = text.take(120)
            )
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "private_messages")
            Result.failure(e)
        }
    }

    suspend fun sendFriendRequest(sender: PublicProfile, target: PublicProfile): Result<Unit> {
        return try {
            val uid = requireUserId()
            require(target.userId != uid)
            val pairId = listOf(uid, target.userId).sorted().joinToString("_")
            val friendshipRef = db.collection("friendships").document(pairId)
            val existingSnap = friendshipRef.get().await()
            if (existingSnap.exists()) {
                friendshipRef.update(
                    mapOf(
                        "requesterId" to uid,
                        "requesterName" to sender.shownName.take(60),
                        "requesterAvatar" to sender.avatarUrl.take(340000),
                        "targetId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "targetAvatar" to target.avatarUrl.take(340000),
                        "participants" to listOf(uid, target.userId),
                        "status" to "pending",
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                friendshipRef.set(
                    mapOf(
                        "requesterId" to uid,
                        "requesterName" to sender.shownName.take(60),
                        "requesterAvatar" to sender.avatarUrl.take(340000),
                        "targetId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "targetAvatar" to target.avatarUrl.take(340000),
                        "participants" to listOf(uid, target.userId),
                        "status" to "pending",
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            sendNotification(
                recipientId = target.userId,
                sender = sender,
                type = "friend_request",
                title = "طلب صداقة جديد",
                body = "أرسل لك ${sender.shownName} طلب صداقة."
            )
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "friendships")
            Result.failure(e)
        }
    }

    suspend fun acceptFriendRequest(friendshipId: String): Result<Unit> {
        return try {
            requireUserId()
            db.collection("friendships").document(friendshipId).update(
                mapOf(
                    "status" to "accepted",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, "friendships/$friendshipId")
            Result.failure(e)
        }
    }

    suspend fun removeFriendship(friendshipId: String): Result<Unit> {
        return try {
            requireUserId()
            db.collection("friendships").document(friendshipId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, "friendships/$friendshipId")
            Result.failure(e)
        }
    }

    suspend fun createWallPost(author: PublicProfile, content: String, imageUrl: String = ""): Result<Unit> {
        return try {
            val uid = requireUserId()
            val text = content.trim().take(1000)
            require(text.isNotEmpty())
            val payload = mapOf(
                "authorId" to uid,
                "authorName" to author.shownName.take(60),
                "authorAvatar" to author.avatarUrl.take(340000),
                "authorRole" to author.role.take(40),
                "content" to text,
                "imageUrl" to imageUrl.take(400000),
                "likesCount" to 0L,
                "isPublic" to true,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            db.collection("wall_posts").document().set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "wall_posts")
            Result.failure(e)
        }
    }

    suspend fun likeWallPost(postId: String): Result<Unit> {
        return try {
            requireUserId()
            db.collection("wall_posts").document(postId).update(
                mapOf(
                    "likesCount" to FieldValue.increment(1L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, "wall_posts/$postId")
            Result.failure(e)
        }
    }

    suspend fun submitReport(reporter: PublicProfile, targetId: String, targetName: String, roomId: String, reason: String): Result<Unit> {
        return try {
            val uid = requireUserId()
            val cleanReason = reason.trim().take(400)
            require(cleanReason.length >= 2) { "يرجى كتابة سبب البلاغ" }
            db.collection("reports").document().set(
                mapOf(
                    "reporterId" to uid,
                    "reporterName" to reporter.shownName.take(60),
                    "targetId" to targetId.ifBlank { "room_general" },
                    "targetName" to targetName.ifBlank { "إبلاغ عام" }.take(60),
                    "roomId" to roomId.take(64),
                    "reason" to cleanReason,
                    "status" to "open",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "reports")
            Result.failure(e)
        }
    }

    // --- YouTube Room Player Sync ---

    suspend fun updateRoomYoutube(roomId: String, videoId: String, title: String, playing: Boolean): Result<Unit> {
        return try {
            requireUserId()
            db.collection("rooms").document(roomId).update(
                mapOf(
                    "youtubeVideoId" to videoId.trim().take(120),
                    "youtubeTitle" to title.trim().take(120),
                    "youtubeIsPlaying" to playing,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, "rooms/$roomId")
            Result.failure(e)
        }
    }

    // --- Admin & Owner CMS Operations ---

    suspend fun publishNews(
        author: PublicProfile,
        title: String,
        content: String,
        imageUrl: String = "",
        announceInRoomId: String = "general"
    ): Result<Unit> {
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim().take(120)
            val cleanBody = content.trim().take(2000)
            db.collection("news").document().set(
                mapOf(
                    "authorId" to uid,
                    "authorName" to author.shownName.take(60),
                    "authorAvatar" to author.avatarUrl.take(340000),
                    "authorRole" to author.role.take(40),
                    "title" to cleanTitle,
                    "content" to cleanBody,
                    "imageUrl" to imageUrl.take(400000),
                    "isPublished" to true,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            // Announce news in the active room as an admin notice
            db.collection("messages").document().set(
                mapOf(
                    "roomId" to announceInRoomId.take(64).ifBlank { "general" },
                    "senderId" to uid,
                    "senderName" to author.shownName.take(60),
                    "senderRole" to author.role.take(40),
                    "nameColor" to author.nameColor.take(30),
                    "textColor" to "#7F1D1D",
                    "avatarUrl" to author.avatarUrl.take(340000),
                    "avatarFrame" to author.avatarFrame.take(40),
                    "nameplateStyle" to author.nameplateStyle.take(40),
                    "nameShine" to author.nameShine.take(40),
                    "vipWings" to author.vipWings,
                    "isAdminNotice" to true,
                    "isGift" to false,
                    "msgType" to "admin_notice",
                    "content" to "📰 خبر جديد: $cleanTitle — ${cleanBody.take(180)}",
                    "mediaUrl" to imageUrl.take(400000),
                    "createdAt" to FieldValue.serverTimestamp()
                )
            ).await()

            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "news")
            Result.failure(e)
        }
    }

    suspend fun saveRoom(
        roomId: String,
        name: String,
        description: String,
        icon: String,
        bgTheme: String,
        welcomeMessage: String,
        minRankPower: Long,
        micsEnabled: Boolean,
        ownerUserId: String = "",
        ownerName: String = ""
    ): Result<Unit> {
        return try {
            val uid = requireUserId()
            val cleanId = roomId.trim().lowercase().replace(Regex("[^a-z0-9_\\-]"), "_").ifBlank { "room_${System.currentTimeMillis()}" }
            val ref = db.collection("rooms").document(cleanId)
            val snap = ref.get().await()
            if (snap.exists()) {
                val updates = mutableMapOf<String, Any>(
                    "name" to name.trim().take(80),
                    "description" to description.trim().take(300),
                    "icon" to icon.trim().take(16).ifBlank { "💬" },
                    "bgTheme" to bgTheme.take(40),
                    "welcomeMessage" to welcomeMessage.trim().take(300),
                    "minRankPower" to minRankPower.coerceIn(0L, 100L),
                    "micsEnabled" to micsEnabled,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (ownerUserId.isNotBlank()) {
                    updates["ownerUserId"] = ownerUserId.take(128)
                    updates["ownerName"] = ownerName.ifBlank { "مالك الغرفة" }.take(60)
                }
                ref.update(updates).await()
            } else {
                ref.set(
                    mapOf(
                        "name" to name.trim().take(80),
                        "description" to description.trim().take(300),
                        "icon" to icon.trim().take(16).ifBlank { "💬" },
                        "imageUrl" to "",
                        "bgTheme" to bgTheme.take(40),
                        "wallpaperUrl" to "",
                        "welcomeMessage" to welcomeMessage.trim().take(300),
                        "minRankPower" to minRankPower.coerceIn(0L, 100L),
                        "micsEnabled" to micsEnabled,
                        "ownerUserId" to ownerUserId.ifBlank { uid }.take(128),
                        "ownerName" to ownerName.ifBlank { "صاحب الموقع" }.take(60),
                        "activityPoints" to 0L,
                        "youtubeVideoId" to "",
                        "youtubeTitle" to "",
                        "youtubeIsPlaying" to false,
                        "isActive" to true,
                        "createdBy" to uid,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "rooms/$roomId")
            Result.failure(e)
        }
    }

    suspend fun saveRank(rank: RankConfig): Result<Unit> {
        return try {
            requireUserId()
            val cleanKey = rank.key.trim().lowercase().replace(Regex("[^a-z0-9_\\-]"), "_")
            require(cleanKey.isNotBlank())
            val ref = db.collection("ranks").document(cleanKey)
            val snap = ref.get().await()
            val payload = mutableMapOf<String, Any>(
                "key" to cleanKey,
                "label" to rank.label.trim().take(60),
                "icon" to rank.icon.trim().take(16),
                "iconImageUrl" to rank.iconImageUrl.take(220000),
                "bgColor" to rank.bgColor.take(24),
                "textColor" to rank.textColor.take(24),
                "power" to rank.power.coerceIn(0L, 100L),
                "tierOrder" to rank.tierOrder,
                "isSystem" to rank.isSystem,
                "permMute" to rank.permMute,
                "permKick" to rank.permKick,
                "permBan" to rank.permBan,
                "permSetRank" to rank.permSetRank,
                "permClearRoom" to rank.permClearRoom,
                "permManageRooms" to rank.permManageRooms,
                "permAccessPanel" to rank.permAccessPanel,
                "permRoomOwner" to rank.permRoomOwner,
                "permPublishNews" to rank.permPublishNews,
                "permUseAddons" to rank.permUseAddons,
                "maxAssignableRank" to rank.maxAssignableRank.coerceIn(0L, 100L),
                "isActive" to true,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (snap.exists()) {
                ref.update(payload).await()
            } else {
                payload["createdAt"] = FieldValue.serverTimestamp()
                ref.set(payload).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "ranks/${rank.key}")
            Result.failure(e)
        }
    }

    suspend fun assignUserRank(targetUid: String, rankKey: String, grantAdminAccess: Boolean): Result<Unit> {
        return try {
            val uid = requireUserId()
            require(rankKey != "site_owner" || isCurrentSupremeOwner()) {
                "لا يمكن منح رتبة صاحب الموقع لغير المالك الأعلى"
            }
            db.collection("public_profiles").document(targetUid).update(
                mapOf(
                    "role" to rankKey,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            val userDoc = db.collection("users").document(targetUid).get().await()
            if (userDoc.exists()) {
                db.collection("users").document(targetUid).update(
                    mapOf(
                        "role" to rankKey,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            if (isCurrentSupremeOwner()) {
                if (grantAdminAccess) {
                    db.collection("admins").document(targetUid).set(
                        mapOf(
                            "userId" to targetUid,
                            "role" to rankKey,
                            "grantedBy" to uid,
                            "createdAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                } else if (targetUid != uid) {
                    db.collection("admins").document(targetUid).delete().await()
                }
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, "public_profiles/$targetUid")
            Result.failure(e)
        }
    }

    suspend fun banUser(actor: PublicProfile, target: PublicProfile, reason: String): Result<Unit> {
        return try {
            val uid = requireUserId()
            require(target.userId != uid)
            require(target.role != "site_owner") { "لا يمكن حظر صاحب الموقع!" }
            val banRef = db.collection("bans").document(target.userId)
            val banSnap = banRef.get().await()
            val cleanReason = reason.trim().take(300).ifBlank { "مخالفة القوانين" }
            if (banSnap.exists()) {
                banRef.update(
                    mapOf(
                        "targetUserId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "bannedById" to uid,
                        "bannedByName" to actor.shownName.take(60),
                        "reason" to cleanReason,
                        "isActive" to true,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                banRef.set(
                    mapOf(
                        "targetUserId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "bannedById" to uid,
                        "bannedByName" to actor.shownName.take(60),
                        "reason" to cleanReason,
                        "isActive" to true,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "bans/${target.userId}")
            Result.failure(e)
        }
    }

    suspend fun unbanUser(targetUserId: String): Result<Unit> {
        return try {
            requireUserId()
            db.collection("bans").document(targetUserId).delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, "bans/$targetUserId")
            Result.failure(e)
        }
    }

    suspend fun muteUserInRoom(roomId: String, target: PublicProfile, reason: String): Result<Unit> {
        return try {
            val uid = requireUserId()
            require(target.role != "site_owner") { "لا يمكن كتم صاحب الموقع!" }
            val docId = "${roomId}_${target.userId}"
            val muteRef = db.collection("mutes").document(docId)
            val muteSnap = muteRef.get().await()
            if (muteSnap.exists()) {
                muteRef.update(
                    mapOf(
                        "roomId" to roomId,
                        "targetUserId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "mutedById" to uid,
                        "reason" to reason.trim().take(300),
                        "isActive" to true,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                muteRef.set(
                    mapOf(
                        "roomId" to roomId,
                        "targetUserId" to target.userId,
                        "targetName" to target.shownName.take(60),
                        "mutedById" to uid,
                        "reason" to reason.trim().take(300),
                        "isActive" to true,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "mutes/${roomId}_${target.userId}")
            Result.failure(e)
        }
    }

    suspend fun updateSiteSettings(siteName: String, welcomeBanner: String, marqueeText: String, soundEnabled: Boolean): Result<Unit> {
        return try {
            requireUserId()
            val ref = db.collection("site_settings").document("site")
            val snap = ref.get().await()
            if (snap.exists()) {
                ref.update(
                    mapOf(
                        "siteName" to siteName.trim().take(80),
                        "welcomeBanner" to welcomeBanner.trim().take(300),
                        "marqueeText" to marqueeText.trim().take(400),
                        "soundEffectsEnabled" to soundEnabled,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                ref.set(
                    mapOf(
                        "siteName" to siteName.trim().take(80),
                        "siteDescription" to "أرقى منصة شات عربي مباشر",
                        "welcomeBanner" to welcomeBanner.trim().take(300),
                        "marqueeText" to marqueeText.trim().take(400),
                        "defaultRoomId" to "general",
                        "allowGuestMics" to true,
                        "soundEffectsEnabled" to soundEnabled,
                        "isPublic" to true,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "site_settings/site")
            Result.failure(e)
        }
    }
}
