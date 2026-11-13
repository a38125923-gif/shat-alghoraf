package com.shat.alghoraf.ui.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
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
import com.shat.alghoraf.data.model.UiState
import com.shat.alghoraf.data.model.UserRole
import com.shat.alghoraf.data.remote.unwrapFirestoreException
import com.shat.alghoraf.data.repository.ChatRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModel(
    private val repository: ChatRepository,
    val currentUserId: String,
    private val currentUserEmail: String?,
    private val isEmailVerified: Boolean,
    private val initialDisplayName: String?,
    private val initialPhotoUrl: String?
) : ViewModel() {

    val isGlobalOwner: Boolean =
        currentUserEmail.equals(OWNER_ADMIN_EMAIL, ignoreCase = true) && isEmailVerified

    private val _selectedRoomId = MutableStateFlow<String?>(null)
    val selectedRoomId: StateFlow<String?> = _selectedRoomId.asStateFlow()

    private val _selectedDirectChatId = MutableStateFlow<String?>(null)
    val selectedDirectChatId: StateFlow<String?> = _selectedDirectChatId.asStateFlow()

    private val _feedbackMessages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val feedbackMessages = _feedbackMessages.asSharedFlow()

    private var typingResetJob: Job? = null
    private var lastTypingSentAt: Long = 0L

    val roomsState: StateFlow<UiState<List<ChatRoom>>> =
        repository.observeRooms()
            .map<List<ChatRoom>, UiState<List<ChatRoom>>> { UiState.Success(it) }
            .catch { error ->
                val fsErr = unwrapFirestoreException(error)
                if (fsErr == null && error is CancellationException) throw error
                val root = fsErr ?: error
                Log.w(TAG, "Error observing rooms", root)
                emit(UiState.Error(root.localizedMessage ?: "تعذر تحميل غرف الدردشة"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )

    val publicProfilesState: StateFlow<UiState<List<PublicProfile>>> =
        repository.observePublicProfiles()
            .map<List<PublicProfile>, UiState<List<PublicProfile>>> { UiState.Success(it) }
            .catch { error ->
                val fsErr = unwrapFirestoreException(error)
                if (fsErr == null && error is CancellationException) throw error
                val root = fsErr ?: error
                Log.w(TAG, "Error observing public profiles", root)
                emit(UiState.Error(root.localizedMessage ?: "تعذر تحميل قائمة الأعضاء"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )

    val currentProfile: StateFlow<PublicProfile> =
        publicProfilesState
            .map { state ->
                val list = (state as? UiState.Success)?.data.orEmpty()
                list.firstOrNull { it.userId == currentUserId } ?: fallbackProfile()
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = fallbackProfile()
            )

    val bansState: StateFlow<List<BanRecord>> =
        repository.observeBans(currentUserId, isGlobalOwner)
            .catch { error ->
                val fsErr = unwrapFirestoreException(error)
                if (fsErr == null && error is CancellationException) throw error
                Log.w(TAG, "Error observing bans", fsErr ?: error)
                emit(emptyList())
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = emptyList()
            )

    val activeGlobalBan: StateFlow<BanRecord?> =
        bansState
            .map { bans ->
                if (isGlobalOwner) return@map null
                val now = System.currentTimeMillis()
                bans.firstOrNull {
                    it.isGlobal &&
                        it.targetUid == currentUserId &&
                        (it.isPermanent || it.expiresAtMillis > now)
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = null
            )

    val activeRoom: StateFlow<ChatRoom?> =
        combine(roomsState, _selectedRoomId) { state, roomId ->
            if (roomId == null) null
            else (state as? UiState.Success)?.data?.firstOrNull { it.id == roomId }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = null
        )

    val roomMessagesState: StateFlow<UiState<List<ChatMessage>>> =
        _selectedRoomId
            .flatMapLatest { roomId ->
                if (roomId == null) {
                    flowOf(UiState.Success(emptyList()))
                } else {
                    repository.observeRoomMessages(roomId)
                        .map<List<ChatMessage>, UiState<List<ChatMessage>>> { UiState.Success(it) }
                        .catch { error ->
                            val fsErr = unwrapFirestoreException(error)
                            if (fsErr == null && error is CancellationException) throw error
                            val root = fsErr ?: error
                            Log.w(TAG, "Error observing room messages", root)
                            emit(UiState.Error(root.localizedMessage ?: "تعذر تحميل رسائل الغرفة"))
                        }
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )

    val typingUsers: StateFlow<List<TypingStatus>> =
        _selectedRoomId
            .flatMapLatest { roomId ->
                if (roomId == null) flowOf(emptyList())
                else repository.observeTypingUsers(roomId).catch { emit(emptyList()) }
            }
            .map { list ->
                val cutoff = System.currentTimeMillis() - 7_000L
                list.filter {
                    it.userId != currentUserId &&
                        (it.updatedAt?.toDate()?.time ?: System.currentTimeMillis()) >= cutoff
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = emptyList()
            )

    val directChatsState: StateFlow<UiState<List<DirectChat>>> =
        repository.observeDirectChats(currentUserId)
            .map<List<DirectChat>, UiState<List<DirectChat>>> { UiState.Success(it) }
            .catch { error ->
                val fsErr = unwrapFirestoreException(error)
                if (fsErr == null && error is CancellationException) throw error
                val root = fsErr ?: error
                Log.w(TAG, "Error observing direct chats", root)
                emit(UiState.Error(root.localizedMessage ?: "تعذر تحميل المحادثات الخاصة"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )

    val activeDirectChat: StateFlow<DirectChat?> =
        combine(directChatsState, _selectedDirectChatId) { state, chatId ->
            if (chatId == null) null
            else (state as? UiState.Success)?.data?.firstOrNull { it.id == chatId }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = null
        )

    val directMessagesState: StateFlow<UiState<List<DirectMessage>>> =
        _selectedDirectChatId
            .flatMapLatest { chatId ->
                if (chatId == null) {
                    flowOf(UiState.Success(emptyList()))
                } else {
                    repository.observeDirectMessages(chatId, currentUserId)
                        .map<List<DirectMessage>, UiState<List<DirectMessage>>> { UiState.Success(it) }
                        .catch { error ->
                            val fsErr = unwrapFirestoreException(error)
                            if (fsErr == null && error is CancellationException) throw error
                            val root = fsErr ?: error
                            Log.w(TAG, "Error observing direct messages", root)
                            emit(UiState.Error(root.localizedMessage ?: "تعذر تحميل الرسائل الخاصة"))
                        }
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )

    fun reportFeedback(message: String) {
        _feedbackMessages.tryEmit(message)
    }

    fun bootstrapSession(firebaseUser: FirebaseUser) {
        viewModelScope.launch {
            try {
                repository.syncCurrentUserProfile(firebaseUser)
                repository.seedDefaultRoomsIfMissing()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.w(TAG, "Bootstrap warning", e)
                _feedbackMessages.tryEmit("تعذر مزامنة البيانات الأولية: ${e.localizedMessage ?: ""}")
            }
        }
    }

    fun checkRoomEntry(room: ChatRoom): String? {
        if (isGlobalOwner || room.ownerId == currentUserId) return null

        val now = System.currentTimeMillis()
        val roomBan = bansState.value.firstOrNull {
            !it.isGlobal &&
                it.roomId == room.id &&
                it.targetUid == currentUserId &&
                (it.isPermanent || it.expiresAtMillis > now)
        }
        if (roomBan != null || room.bannedUsers.contains(currentUserId)) {
            return if (roomBan != null) {
                "أنت محظور من دخول هذه الغرفة — السبب: ${roomBan.reason}"
            } else {
                "أنت محظور من دخول هذه الغرفة."
            }
        }

        val myRole = currentProfile.value.roleEnum
        val isStaff = myRole == UserRole.OWNER ||
            myRole == UserRole.ADMIN ||
            myRole == UserRole.MODERATOR ||
            room.admins.contains(currentUserId) ||
            room.moderators.contains(currentUserId)

        if ((room.isLocked || room.permissionEnum == RoomPermissionLevel.PRIVATE) && !isStaff) {
            return "هذه الغرفة مغلقة ومخصصة للإدارة والمشرفين فقط 🔒"
        }
        return null
    }

    fun canManageRoom(room: ChatRoom): Boolean {
        val myRole = currentProfile.value.roleEnum
        return isGlobalOwner ||
            room.ownerId == currentUserId ||
            myRole == UserRole.OWNER ||
            myRole == UserRole.ADMIN ||
            myRole == UserRole.MODERATOR ||
            room.admins.contains(currentUserId) ||
            room.moderators.contains(currentUserId)
    }

    fun isRoomAdminOrOwner(room: ChatRoom): Boolean {
        val myRole = currentProfile.value.roleEnum
        return isGlobalOwner ||
            room.ownerId == currentUserId ||
            myRole == UserRole.OWNER ||
            myRole == UserRole.ADMIN ||
            room.admins.contains(currentUserId)
    }

    fun isRoomOwnerOrGlobalOwner(room: ChatRoom): Boolean =
        isGlobalOwner || room.ownerId == currentUserId

    fun enterRoom(roomId: String) {
        _selectedRoomId.value = roomId
    }

    fun leaveRoom() {
        val prevRoom = _selectedRoomId.value
        _selectedRoomId.value = null
        typingResetJob?.cancel()
        if (prevRoom != null) {
            viewModelScope.launch {
                repository.setTypingStatus(prevRoom, currentProfile.value.displayName, false)
            }
        }
    }

    fun enterDirectChat(chatId: String) {
        _selectedDirectChatId.value = chatId
    }

    fun leaveDirectChat() {
        _selectedDirectChatId.value = null
    }

    fun startDirectChatWith(otherProfile: PublicProfile, onReady: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val chatId = repository.openOrCreateDirectChat(currentProfile.value, otherProfile)
                _selectedDirectChatId.value = chatId
                onReady(chatId)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر فتح المحادثة الخاصة")
            }
        }
    }

    fun onRoomInputChanged(roomId: String, text: String) {
        val now = System.currentTimeMillis()
        if (text.isBlank()) {
            typingResetJob?.cancel()
            lastTypingSentAt = 0L
            viewModelScope.launch {
                repository.setTypingStatus(roomId, currentProfile.value.displayName, false)
            }
            return
        }

        if (now - lastTypingSentAt > 2500L) {
            lastTypingSentAt = now
            viewModelScope.launch {
                repository.setTypingStatus(roomId, currentProfile.value.displayName, true)
            }
        }

        typingResetJob?.cancel()
        typingResetJob = viewModelScope.launch {
            delay(4500L)
            repository.setTypingStatus(roomId, currentProfile.value.displayName, false)
        }
    }

    fun sendRoomMessage(
        room: ChatRoom,
        content: String,
        isAnnouncement: Boolean = false,
        replyTo: ReplyTarget? = null
    ) {
        val trimmed = content.trim()
        if (trimmed.isEmpty()) return
        if (!isGlobalOwner && room.mutedUsers.contains(currentUserId)) {
            _feedbackMessages.tryEmit("أنت مكتوم في هذه الغرفة من قبل الإدارة 🔇")
            return
        }
        if (room.isLocked && !canManageRoom(room)) {
            _feedbackMessages.tryEmit("هذه الغرفة مغلقة للكتابة حالياً من قبل الإدارة 🔒")
            return
        }
        typingResetJob?.cancel()
        lastTypingSentAt = 0L
        viewModelScope.launch {
            try {
                repository.setTypingStatus(room.id, currentProfile.value.displayName, false)
                repository.sendRoomMessage(
                    roomId = room.id,
                    senderProfile = currentProfile.value,
                    content = trimmed,
                    isAnnouncement = isAnnouncement,
                    replyTo = replyTo
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر إرسال الرسالة: ${e.localizedMessage ?: "تحقق من الصلاحيات"}")
            }
        }
    }

    fun sendDirectMessage(
        chat: DirectChat,
        content: String,
        replyTo: ReplyTarget? = null
    ) {
        val trimmed = content.trim()
        if (trimmed.isEmpty()) return
        viewModelScope.launch {
            try {
                repository.sendDirectMessage(
                    chatId = chat.id,
                    participantIds = chat.participantIds,
                    senderProfile = currentProfile.value,
                    content = trimmed,
                    replyTo = replyTo
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر إرسال الرسالة الخاصة")
            }
        }
    }

    fun toggleReaction(roomId: String, message: ChatMessage, emoji: String) {
        viewModelScope.launch {
            try {
                repository.toggleMessageReaction(roomId, message, emoji)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر إضافة التفاعل")
            }
        }
    }

    fun deleteMessage(roomId: String, messageId: String) {
        viewModelScope.launch {
            try {
                repository.deleteRoomMessage(roomId, messageId)
                _feedbackMessages.tryEmit("تم حذف الرسالة")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("لا تملك صلاحية حذف هذه الرسالة")
            }
        }
    }

    fun clearRoomMessages(roomId: String) {
        viewModelScope.launch {
            try {
                repository.clearRoomMessages(roomId)
                _feedbackMessages.tryEmit("تم مسح رسائل الغرفة")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر مسح رسائل الغرفة")
            }
        }
    }

    fun createRoom(
        name: String,
        description: String,
        category: String,
        icon: String,
        permissionLevel: RoomPermissionLevel,
        isLocked: Boolean
    ) {
        viewModelScope.launch {
            try {
                repository.createRoom(
                    name = name,
                    description = description,
                    category = category,
                    icon = icon,
                    permissionLevel = permissionLevel,
                    isLocked = isLocked,
                    creatorName = currentProfile.value.displayName
                )
                _feedbackMessages.tryEmit("تم إنشاء الغرفة بنجاح ✨")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر إنشاء الغرفة")
            }
        }
    }

    fun updateRoom(
        roomId: String,
        name: String? = null,
        description: String? = null,
        category: String? = null,
        icon: String? = null,
        permissionLevel: RoomPermissionLevel? = null,
        isLocked: Boolean? = null,
        pinnedMessage: String? = null,
        clearPinnedMessage: Boolean = false
    ) {
        viewModelScope.launch {
            try {
                repository.updateRoomSettings(
                    roomId = roomId,
                    name = name,
                    description = description,
                    category = category,
                    icon = icon,
                    permissionLevel = permissionLevel,
                    isLocked = isLocked,
                    pinnedMessage = pinnedMessage,
                    pinnedMessageSender = if (pinnedMessage != null) currentProfile.value.displayName else null,
                    clearPinnedMessage = clearPinnedMessage
                )
                _feedbackMessages.tryEmit("تم تحديث إعدادات الغرفة ✅")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر تحديث الغرفة: ${e.localizedMessage ?: ""}")
            }
        }
    }

    fun toggleRoomAdmin(room: ChatRoom, targetUid: String, targetName: String) {
        viewModelScope.launch {
            try {
                val added = repository.toggleRoomAdmin(room, targetUid)
                _feedbackMessages.tryEmit(
                    if (added) "تم تعيين $targetName أدمن في الغرفة 🛡️" else "تم سحب صلاحية الأدمن من $targetName"
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("لا تملك صلاحية تعديل أدمن الغرفة")
            }
        }
    }

    fun toggleRoomModerator(room: ChatRoom, targetUid: String, targetName: String) {
        viewModelScope.launch {
            try {
                val added = repository.toggleRoomModerator(room, targetUid)
                _feedbackMessages.tryEmit(
                    if (added) "تم تعيين $targetName مشرفاً في الغرفة ⚔️" else "تم سحب الإشراف من $targetName"
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("لا تملك صلاحية تعديل مشرفي الغرفة")
            }
        }
    }

    fun unbanFromRoom(room: ChatRoom, targetUid: String, targetName: String) {
        viewModelScope.launch {
            try {
                repository.unbanUserFromRoom(room, targetUid)
                val matchingBan = bansState.value.firstOrNull {
                    !it.isGlobal && it.roomId == room.id && it.targetUid == targetUid
                }
                if (matchingBan != null) {
                    repository.unbanUser(matchingBan, room)
                }
                _feedbackMessages.tryEmit("تم فك حظر $targetName من الغرفة ✅")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر فك الحظر عن العضو")
            }
        }
    }

    fun deleteRoom(roomId: String) {
        viewModelScope.launch {
            try {
                repository.deleteRoom(roomId)
                if (_selectedRoomId.value == roomId) _selectedRoomId.value = null
                _feedbackMessages.tryEmit("تم حذف الغرفة")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر حذف الغرفة")
            }
        }
    }

    fun toggleMuteUser(room: ChatRoom, targetUid: String, targetName: String) {
        viewModelScope.launch {
            try {
                val nowMuted = repository.toggleMuteUser(room, targetUid)
                _feedbackMessages.tryEmit(
                    if (nowMuted) "تم كتم $targetName في الغرفة 🔇" else "تم فك كتم $targetName"
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر تغيير حالة الكتم")
            }
        }
    }

    fun setUserGlobalRole(targetUid: String, newRole: UserRole) {
        viewModelScope.launch {
            try {
                repository.setUserGlobalRole(targetUid, newRole)
                _feedbackMessages.tryEmit("تم تحديث الرتبة إلى ${newRole.arabicLabel} ${newRole.badgeEmoji}")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر تعديل الرتبة")
            }
        }
    }

    fun banUser(
        targetUid: String,
        targetName: String,
        reason: String,
        isPermanent: Boolean,
        minutes: Int,
        isGlobal: Boolean,
        room: ChatRoom?
    ) {
        viewModelScope.launch {
            try {
                repository.banUser(
                    targetUid = targetUid,
                    targetName = targetName,
                    reason = reason,
                    isPermanent = isPermanent,
                    minutes = minutes,
                    isGlobal = isGlobal,
                    room = room,
                    bannedByName = currentProfile.value.displayName
                )
                _feedbackMessages.tryEmit("تم تنفيذ الحظر على $targetName")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر تنفيذ الحظر")
            }
        }
    }

    fun unbanUser(ban: BanRecord) {
        val rooms = (roomsState.value as? UiState.Success)?.data.orEmpty()
        val room = ban.roomId?.let { id -> rooms.firstOrNull { it.id == id } }
        viewModelScope.launch {
            try {
                repository.unbanUser(ban, room)
                _feedbackMessages.tryEmit("تم فك الحظر عن ${ban.targetName}")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر فك الحظر")
            }
        }
    }

    fun broadcastAnnouncement(text: String) {
        val rooms = (roomsState.value as? UiState.Success)?.data.orEmpty()
        viewModelScope.launch {
            try {
                repository.broadcastGlobalAnnouncement(rooms, currentProfile.value, text)
                _feedbackMessages.tryEmit("تم بث الإعلان لجميع الغرف 📢")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit("تعذر إرسال البث العام")
            }
        }
    }

    fun updateProfile(displayName: String, bio: String, avatarEmoji: String, status: String) {
        viewModelScope.launch {
            try {
                repository.updateMyProfile(displayName, bio, avatarEmoji, status)
                _feedbackMessages.tryEmit("تم حفظ تعديلات الملف الشخصي ✨")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _feedbackMessages.tryEmit(e.localizedMessage ?: "تعذر حفظ الملف الشخصي")
            }
        }
    }

    fun setPresenceOffline() {
        viewModelScope.launch {
            repository.updatePresenceStatus("offline")
        }
    }

    private fun fallbackProfile(): PublicProfile = PublicProfile(
        id = currentUserId,
        userId = currentUserId,
        displayName = initialDisplayName?.takeIf { it.length >= 2 }
            ?: if (isGlobalOwner) "المالك العام" else "عضو الشات",
        avatarEmoji = if (isGlobalOwner) UserRole.OWNER.badgeEmoji else UserRole.MEMBER.badgeEmoji,
        photoUrl = initialPhotoUrl,
        bio = if (isGlobalOwner) "مالك ومؤسس شات الغرف الرسمي" else "عضو في شات الغرف ✨",
        globalRole = if (isGlobalOwner) UserRole.OWNER.key else UserRole.MEMBER.key,
        status = "online",
        isActive = true
    )

    private companion object {
        const val TAG = "ChatViewModel"
        const val STOP_TIMEOUT_MILLIS = 5000L
    }
}
