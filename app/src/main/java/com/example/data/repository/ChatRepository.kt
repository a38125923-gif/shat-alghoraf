package com.example.data.repository

import android.content.Context
import com.example.R
import com.example.data.model.BanRecord
import com.example.data.model.ChatMessage
import com.example.data.model.Room
import com.example.data.model.UserProfile
import com.example.data.model.UserRole
import com.example.data.util.OperationType
import com.example.data.util.handleFirestoreError
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class ChatRepository(private val db: FirebaseFirestore) {

  constructor(context: Context) : this(
    FirebaseFirestore.getInstance(
      context.applicationContext.getString(R.string.firestore_database_id)
    )
  )

  private val auth = Firebase.auth
  var activeGuestSession: UserProfile? = null

  private fun requireUserId(): String {
    return auth.currentUser?.uid ?: activeGuestSession?.userId
      ?: throw IllegalStateException("يجب تسجيل الدخول أولاً")
  }

  // --- User Profiles ---
  fun observeUserProfile(userId: String): Flow<UserProfile?> = flow {
    val path = "users/$userId"
    val docRef = db.collection("users").document(userId)
    emitAll(
      docRef.snapshots()
        .map { snapshot -> snapshot.toObject(UserProfile::class.java) }
        .catch { error ->
          val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
          if (firestoreError == null && error is CancellationException) throw error
          val exceptionToLog = firestoreError ?: (error as? Exception)
          if (exceptionToLog != null) {
            handleFirestoreError(exceptionToLog, OperationType.GET, path)
          }
          throw error
        }
    )
  }

  suspend fun saveUserProfile(profile: UserProfile): Result<Unit> {
    val uid = requireUserId()
    val docRef = db.collection("users").document(uid)
    return try {
      val existingDoc = docRef.get().await()
      if (!existingDoc.exists()) {
        val isGlobalOwner = auth.currentUser?.email == "a38125923@gmail.com" || profile.email == "a38125923@gmail.com" || profile.globalRole == "owner"
        val payload = mutableMapOf<String, Any>(
          "userId" to uid,
          "displayName" to profile.displayName.ifBlank { "مستخدم ${uid.take(4)}" },
          "email" to (auth.currentUser?.email ?: profile.email),
          "globalRole" to (if (isGlobalOwner) "owner" else "member"),
          "status" to "online",
          "createdAt" to FieldValue.serverTimestamp(),
          "updatedAt" to FieldValue.serverTimestamp()
        )
        profile.photoUrl?.let { payload["photoUrl"] = it }
        profile.bio?.let { payload["bio"] = it }
        docRef.set(payload).await()
      } else {
        val payload = mutableMapOf<String, Any>(
          "displayName" to profile.displayName.ifBlank { "مستخدم ${uid.take(4)}" },
          "status" to profile.status,
          "updatedAt" to FieldValue.serverTimestamp()
        )
        profile.bio?.let { payload["bio"] = it }
        profile.photoUrl?.let { payload["photoUrl"] = it }
        docRef.update(payload).await()
      }
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.WRITE, docRef.path)
      Result.failure(e)
    }
  }

  // --- Rooms ---
  fun observeRooms(): Flow<List<Room>> = flow {
    val path = "rooms"
    emitAll(
      db.collection(path)
        .orderBy("updatedAt", Query.Direction.DESCENDING)
        .snapshots()
        .map { snapshot -> snapshot.toObjects(Room::class.java) }
        .catch { error ->
          val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
          if (firestoreError == null && error is CancellationException) throw error
          val exceptionToLog = firestoreError ?: (error as? Exception)
          if (exceptionToLog != null) {
            handleFirestoreError(exceptionToLog, OperationType.LIST, path)
          }
          throw error
        }
    )
  }

  fun observeRoom(roomId: String): Flow<Room?> = flow {
    val path = "rooms/$roomId"
    emitAll(
      db.collection("rooms").document(roomId)
        .snapshots()
        .map { snapshot -> snapshot.toObject(Room::class.java) }
        .catch { error ->
          val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
          if (firestoreError == null && error is CancellationException) throw error
          val exceptionToLog = firestoreError ?: (error as? Exception)
          if (exceptionToLog != null) {
            handleFirestoreError(exceptionToLog, OperationType.GET, path)
          }
          throw error
        }
    )
  }

  suspend fun createRoom(
    name: String,
    description: String,
    category: String,
    ownerName: String,
    permissionLevel: String = "PUBLIC"
  ): Result<String> {
    val uid = requireUserId()
    val docRef = db.collection("rooms").document()
    val payload = mutableMapOf<String, Any>(
      "name" to name.trim(),
      "description" to description.trim(),
      "ownerId" to uid,
      "ownerName" to ownerName.ifBlank { "المالك" },
      "category" to category.ifBlank { "عام" },
      "permissionLevel" to permissionLevel,
      "isLocked" to (permissionLevel == "PRIVATE"),
      "admins" to emptyList<String>(),
      "moderators" to emptyList<String>(),
      "mutedUsers" to emptyList<String>(),
      "bannedUsers" to emptyList<String>(),
      "memberCount" to 1L,
      "createdAt" to FieldValue.serverTimestamp(),
      "updatedAt" to FieldValue.serverTimestamp()
    )
    return try {
      docRef.set(payload).await()
      Result.success(docRef.id)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.CREATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun updateRoomDetails(
    roomId: String,
    name: String,
    description: String,
    category: String,
    permissionLevel: String = "PUBLIC"
  ): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId)
    return try {
      docRef.update(
        mapOf(
          "name" to name.trim(),
          "description" to description.trim(),
          "category" to category.trim(),
          "permissionLevel" to permissionLevel,
          "isLocked" to (permissionLevel == "PRIVATE"),
          "updatedAt" to FieldValue.serverTimestamp()
        )
      ).await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.UPDATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun toggleRoomLock(roomId: String, isLocked: Boolean): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId)
    return try {
      docRef.update(
        mapOf(
          "isLocked" to isLocked,
          "updatedAt" to FieldValue.serverTimestamp()
        )
      ).await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.UPDATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun setPinnedAnnouncement(roomId: String, message: String?, senderName: String?): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId)
    return try {
      val updates = mutableMapOf<String, Any?>(
        "pinnedMessage" to message?.trim(),
        "pinnedMessageSender" to senderName?.trim(),
        "updatedAt" to FieldValue.serverTimestamp()
      )
      docRef.update(updates).await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.UPDATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun manageUserRole(
    roomId: String,
    targetUid: String,
    role: UserRole,
    enable: Boolean
  ): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId)
    return try {
      val operation = if (enable) FieldValue.arrayUnion(targetUid) else FieldValue.arrayRemove(targetUid)
      val fieldName = when (role) {
        UserRole.ADMIN -> "admins"
        UserRole.MODERATOR -> "moderators"
        UserRole.MUTED -> "mutedUsers"
        UserRole.BANNED -> "bannedUsers"
        else -> return Result.failure(IllegalArgumentException("رتبة غير قابلة للتعديل كقائمة"))
      }

      val updates = mutableMapOf<String, Any>(
        fieldName to operation,
        "updatedAt" to FieldValue.serverTimestamp()
      )

      // If promoting to Admin, remove from Moderators, Muted, and Banned for consistency
      if (enable && role == UserRole.ADMIN) {
        updates["moderators"] = FieldValue.arrayRemove(targetUid)
        updates["mutedUsers"] = FieldValue.arrayRemove(targetUid)
        updates["bannedUsers"] = FieldValue.arrayRemove(targetUid)
      } else if (enable && role == UserRole.MODERATOR) {
        updates["admins"] = FieldValue.arrayRemove(targetUid)
        updates["mutedUsers"] = FieldValue.arrayRemove(targetUid)
        updates["bannedUsers"] = FieldValue.arrayRemove(targetUid)
      } else if (enable && role == UserRole.BANNED) {
        updates["admins"] = FieldValue.arrayRemove(targetUid)
        updates["moderators"] = FieldValue.arrayRemove(targetUid)
        updates["mutedUsers"] = FieldValue.arrayRemove(targetUid)
      }

      docRef.update(updates).await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.UPDATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun deleteRoom(roomId: String): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId)
    return try {
      docRef.delete().await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.DELETE, docRef.path)
      Result.failure(e)
    }
  }

  // --- Messages ---
  fun observeMessages(roomId: String): Flow<List<ChatMessage>> = flow {
    val path = "rooms/$roomId/messages"
    emitAll(
      db.collection("rooms").document(roomId).collection("messages")
        .orderBy("createdAt", Query.Direction.ASCENDING)
        .limitToLast(150)
        .snapshots()
        .map { snapshot -> snapshot.toObjects(ChatMessage::class.java) }
        .catch { error ->
          val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
          if (firestoreError == null && error is CancellationException) throw error
          val exceptionToLog = firestoreError ?: (error as? Exception)
          if (exceptionToLog != null) {
            handleFirestoreError(exceptionToLog, OperationType.LIST, path)
          }
          throw error
        }
    )
  }

  suspend fun sendMessage(
    roomId: String,
    content: String,
    senderName: String,
    senderRole: UserRole,
    isAnnouncement: Boolean = false
  ): Result<String> {
    val uid = requireUserId()
    val docRef = db.collection("rooms").document(roomId).collection("messages").document()
    val payload = mutableMapOf<String, Any>(
      "roomId" to roomId,
      "senderId" to uid,
      "senderName" to senderName.ifBlank { "مستخدم" },
      "senderRole" to senderRole.name.lowercase(),
      "content" to content.trim(),
      "isAnnouncement" to isAnnouncement,
      "createdAt" to FieldValue.serverTimestamp()
    )
    return try {
      docRef.set(payload).await()
      // update room updatedAt
      try {
        db.collection("rooms").document(roomId).update("updatedAt", FieldValue.serverTimestamp()).await()
      } catch (_: Exception) {}
      Result.success(docRef.id)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.CREATE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun deleteMessage(roomId: String, messageId: String): Result<Unit> {
    requireUserId()
    val docRef = db.collection("rooms").document(roomId).collection("messages").document(messageId)
    return try {
      docRef.delete().await()
      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.DELETE, docRef.path)
      Result.failure(e)
    }
  }

  // --- Ban & Moderation Management ---
  suspend fun banUser(
    roomId: String?,
    roomName: String?,
    targetUid: String,
    targetName: String,
    reason: String,
    isPermanent: Boolean,
    durationMinutes: Int,
    isGlobal: Boolean
  ): Result<Unit> {
    val uid = requireUserId()
    val banId = if (isGlobal) "global_$targetUid" else "${roomId}_$targetUid"
    val docRef = db.collection("bans").document(banId)
    val expiresAtMillis = if (isPermanent) 0L else System.currentTimeMillis() + (durationMinutes * 60 * 1000L)

    val payload = mutableMapOf<String, Any>(
      "targetUid" to targetUid,
      "targetName" to targetName.ifBlank { "مستخدم" },
      "reason" to reason.trim().ifBlank { "مخالفة الشروط والآداب العامة" },
      "isPermanent" to isPermanent,
      "expiresAtMillis" to expiresAtMillis,
      "bannedByUid" to uid,
      "bannedByName" to (auth.currentUser?.displayName ?: "الإدارة"),
      "isGlobal" to isGlobal,
      "createdAt" to FieldValue.serverTimestamp()
    )
    roomId?.let { payload["roomId"] = it }
    roomName?.let { payload["roomName"] = it }

    return try {
      docRef.set(payload).await()

      // If room ban, add targetUid to room's bannedUsers array
      if (!isGlobal && !roomId.isNullOrBlank()) {
        manageUserRole(roomId, targetUid, UserRole.BANNED, true)
      }

      // If global ban, update target user's profile
      if (isGlobal) {
        try {
          db.collection("users").document(targetUid).update(
            mapOf(
              "isBannedGlobally" to true,
              "banReason" to reason,
              "banExpiresAtMillis" to expiresAtMillis,
              "updatedAt" to FieldValue.serverTimestamp()
            )
          ).await()
        } catch (_: Exception) {}
      }

      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.WRITE, docRef.path)
      Result.failure(e)
    }
  }

  suspend fun unbanUser(
    roomId: String?,
    targetUid: String,
    banId: String? = null,
    isGlobal: Boolean = false
  ): Result<Unit> {
    requireUserId()
    val actualBanId = banId ?: if (isGlobal) "global_$targetUid" else "${roomId}_$targetUid"
    val docRef = db.collection("bans").document(actualBanId)

    return try {
      try {
        docRef.delete().await()
      } catch (_: Exception) {}

      // If room ban, remove targetUid from room's bannedUsers array
      if (!isGlobal && !roomId.isNullOrBlank()) {
        manageUserRole(roomId, targetUid, UserRole.BANNED, false)
      }

      // If global ban, reset profile flag
      if (isGlobal) {
        try {
          db.collection("users").document(targetUid).update(
            mapOf(
              "isBannedGlobally" to false,
              "banExpiresAtMillis" to 0L,
              "updatedAt" to FieldValue.serverTimestamp()
            )
          ).await()
        } catch (_: Exception) {}
      }

      Result.success(Unit)
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      handleFirestoreError(e, OperationType.DELETE, docRef.path)
      Result.failure(e)
    }
  }

  fun observeBans(roomId: String? = null): Flow<List<BanRecord>> = flow {
    val collection = db.collection("bans")
    val query = if (roomId != null) {
      collection.whereEqualTo("roomId", roomId)
    } else {
      collection.whereEqualTo("isGlobal", true)
    }
    emitAll(
      query.snapshots()
        .map { snapshot -> snapshot.toObjects(BanRecord::class.java) }
        .catch { emit(emptyList()) }
    )
  }

  fun observeActiveGlobalBan(userId: String): Flow<BanRecord?> = flow {
    val docRef = db.collection("bans").document("global_$userId")
    emitAll(
      docRef.snapshots()
        .map { snap ->
          val ban = snap.toObject(BanRecord::class.java)
          if (ban != null && ban.isActive()) ban else null
        }
        .catch { emit(null) }
    )
  }

  fun observeAllUsers(): Flow<List<UserProfile>> = flow {
    emitAll(
      db.collection("users")
        .limit(50)
        .snapshots()
        .map { it.toObjects(UserProfile::class.java) }
        .catch { emit(emptyList()) }
    )
  }
}
