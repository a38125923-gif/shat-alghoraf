package com.shat.alghoraf.ui.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.firestore.FirebaseFirestoreException
import com.shat.alghoraf.data.model.AvatarFrame
import com.shat.alghoraf.data.model.BottomNavTab
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatNotification
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.ChatThemeOption
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.NameplateStyle
import com.shat.alghoraf.data.model.PrivateMessage
import com.shat.alghoraf.data.model.UserReport
import com.shat.alghoraf.data.model.VoiceMicSlot
import com.shat.alghoraf.data.model.WallPost
import com.shat.alghoraf.data.remote.FirestoreChatRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

sealed interface AiUiState {
    data object Idle : AiUiState
    data object Loading : AiUiState
    data class Streaming(val text: String) : AiUiState
    data class Success(val text: String) : AiUiState
    data class Error(val message: String) : AiUiState
}

data class ChatUiState(
    val currentUser: ChatUser? = null,
    val rooms: List<ChatRoom> = emptyList(),
    val activeRoomId: String = "general",
    val messages: List<ChatMessage> = emptyList(),
    val allUsers: List<ChatUser> = emptyList(),
    val privateMessages: List<PrivateMessage> = emptyList(),
    val activeDmPartner: ChatUser? = null,
    val micSlots: List<VoiceMicSlot> = List(5) { idx -> VoiceMicSlot(slotNumber = idx + 1) },
    val wallPosts: List<WallPost> = emptyList(),
    val notifications: List<ChatNotification> = emptyList(),
    val reports: List<UserReport> = emptyList(),
    val selectedTab: BottomNavTab = BottomNavTab.CHAT,
    val selectedTheme: ChatThemeOption = ChatThemeOption.WARM_PEACH,
    val authError: String? = null,
    val toastMessage: String? = null,
    val searchRoomQuery: String = "",
    val isLoadingProfile: Boolean = true,
    val aiState: AiUiState = AiUiState.Idle
) {
    val activeRoom: ChatRoom?
        get() = rooms.firstOrNull { it.id == activeRoomId } ?: rooms.firstOrNull()

    val unreadNotificationsCount: Int
        get() = notifications.count { !it.isRead }
}

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModel(
    private val repository: FirestoreChatRepository,
    private val currentUserId: String,
    private val currentUserEmail: String,
    private val currentUserDisplayName: String,
    private val currentUserPhotoUrl: String?,
    private val currentUserEmailVerified: Boolean,
    initialRoomId: String = "general",
    initialTheme: ChatThemeOption = ChatThemeOption.WARM_PEACH,
    private val onSaveRoomId: (String) -> Unit = {},
    private val onSaveTheme: (ChatThemeOption) -> Unit = {},
    private val onSignOutRequested: () -> Unit = {}
) : ViewModel() {

    private companion object {
        const val TAG = "ChatViewModel"
    }

    private val _uiState = MutableStateFlow(
        ChatUiState(
            activeRoomId = initialRoomId,
            selectedTheme = initialTheme,
            isLoadingProfile = true
        )
    )
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private val geminiModel by lazy {
        Firebase.ai.generativeModel("gemini-3.8-flash")
    }

    private val isOwnerEmail: Boolean =
        currentUserEmail.equals(FirestoreChatRepository.OWNER_EMAIL, ignoreCase = true) && currentUserEmailVerified

    init {
        bootstrapSession()
        observeCloudData()
    }

    private fun bootstrapSession() {
        viewModelScope.launch {
            repository.seedDefaultRoomsIfNeeded()
            val profileResult = repository.ensureUserProfiles(
                uid = currentUserId,
                email = currentUserEmail,
                displayName = currentUserDisplayName,
                photoUrl = currentUserPhotoUrl,
                emailVerified = currentUserEmailVerified
            )
            profileResult.fold(
                onSuccess = { user ->
                    _uiState.update {
                        it.copy(
                            currentUser = user,
                            isLoadingProfile = false,
                            authError = null,
                            toastMessage = if (user.rank == ChatRank.SITE_OWNER) {
                                "أهلاً بك يا صاحب الموقع ${user.displayName} 👑"
                            } else {
                                "أهلاً بك في شات الغرف ${user.displayName} ${user.rank.icon}"
                            }
                        )
                    }
                },
                onFailure = { error ->
                    val root = unwrapFirestoreError(error)
                    Log.w(TAG, "Failed to initialize user profile", root)
                    _uiState.update {
                        it.copy(
                            isLoadingProfile = false,
                            authError = root.localizedMessage ?: "تعذر تحميل الحساب من السحابة"
                        )
                    }
                }
            )
        }
    }

    private fun observeCloudData() {
        repository.observeCurrentUserProfile(currentUserId)
            .catch { error -> handleStreamError("profile", error) }
            .onEach { user ->
                if (user != null) {
                    _uiState.update { it.copy(currentUser = user, isLoadingProfile = false) }
                }
            }
            .launchIn(viewModelScope)

        repository.observeActiveRooms()
            .catch { error -> handleStreamError("rooms", error) }
            .onEach { rooms ->
                _uiState.update { state ->
                    val validRoomId = if (rooms.any { it.id == state.activeRoomId }) {
                        state.activeRoomId
                    } else {
                        rooms.firstOrNull()?.id ?: state.activeRoomId
                    }
                    state.copy(rooms = rooms, activeRoomId = validRoomId)
                }
            }
            .launchIn(viewModelScope)

        repository.observePublicProfiles()
            .catch { error -> handleStreamError("public_profiles", error) }
            .onEach { users ->
                _uiState.update { it.copy(allUsers = users) }
            }
            .launchIn(viewModelScope)

        _uiState
            .map { it.activeRoomId }
            .distinctUntilChanged()
            .flatMapLatest { roomId ->
                repository.observeRoomMessages(roomId)
            }
            .catch { error -> handleStreamError("messages", error) }
            .onEach { msgs ->
                _uiState.update { it.copy(messages = msgs) }
            }
            .launchIn(viewModelScope)

        repository.observeWallPosts()
            .catch { error -> handleStreamError("wall_posts", error) }
            .onEach { posts ->
                _uiState.update { it.copy(wallPosts = posts) }
            }
            .launchIn(viewModelScope)

        repository.observeNotifications(currentUserId)
            .catch { error -> handleStreamError("notifications", error) }
            .onEach { notifs ->
                _uiState.update { it.copy(notifications = notifs) }
            }
            .launchIn(viewModelScope)

        repository.observeReports(currentUserId, isOwnerEmail)
            .catch { error -> handleStreamError("reports", error) }
            .onEach { reports ->
                _uiState.update { it.copy(reports = reports) }
            }
            .launchIn(viewModelScope)

        _uiState
            .map { it.activeDmPartner }
            .distinctUntilChanged()
            .flatMapLatest { partner ->
                if (partner == null) {
                    flowOf(emptyList())
                } else {
                    val chatId = FirestoreChatRepository.directChatId(currentUserId, partner.userKey)
                    repository.observeDirectMessages(chatId, currentUserId, partner.displayName)
                }
            }
            .catch { error -> handleStreamError("direct_messages", error) }
            .onEach { dms ->
                _uiState.update { it.copy(privateMessages = dms) }
            }
            .launchIn(viewModelScope)
    }

    private fun unwrapFirestoreError(error: Throwable): Throwable {
        val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
        if (firestoreError == null && error is CancellationException) throw error
        return firestoreError ?: error
    }

    private fun handleStreamError(streamName: String, error: Throwable) {
        val rootError = unwrapFirestoreError(error)
        Log.w(TAG, "Error observing $streamName", rootError)
        _uiState.update {
            it.copy(toastMessage = rootError.localizedMessage ?: "حدث خطأ في المزامنة ($streamName)")
        }
    }

    fun clearAuthError() {
        _uiState.update { it.copy(authError = null) }
    }

    fun consumeToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }

    fun showToast(message: String) {
        _uiState.update { it.copy(toastMessage = message) }
    }

    fun logout() {
        viewModelScope.launch {
            repository.updatePresence(currentUserId, "offline")
            _uiState.update { state ->
                state.copy(
                    micSlots = state.micSlots.map {
                        if (it.occupantKey == currentUserId) VoiceMicSlot(it.slotNumber) else it
                    },
                    selectedTab = BottomNavTab.CHAT,
                    activeDmPartner = null
                )
            }
            onSignOutRequested()
        }
    }

    fun selectTab(tab: BottomNavTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun updateRoomSearch(query: String) {
        _uiState.update { it.copy(searchRoomQuery = query) }
    }

    fun switchRoom(roomId: String) {
        onSaveRoomId(roomId)
        _uiState.update {
            it.copy(
                activeRoomId = roomId,
                selectedTab = BottomNavTab.CHAT
            )
        }
    }

    fun setTheme(theme: ChatThemeOption) {
        onSaveTheme(theme)
        _uiState.update {
            it.copy(selectedTheme = theme, toastMessage = "تم تغيير خلفية الدردشة إلى ${theme.label}")
        }
    }

    fun sendTextMessage(text: String, imageUri: String = "", voiceDurationSec: Int = 0) {
        val me = _uiState.value.currentUser ?: return
        if (me.isBanned) {
            showToast("حسابك محظور حالياً")
            return
        }
        if (me.isMuted) {
            val reason = me.muteReason.ifBlank { "مخالف للقوانين" }
            showToast("أنت مكتوم حالياً ولا يمكنك الإرسال ($reason)")
            return
        }
        val cleanText = text.trim()
        if (cleanText.isEmpty() && imageUri.isEmpty() && voiceDurationSec <= 0) return

        val finalContent = cleanText.ifEmpty {
            if (voiceDurationSec > 0) "🎤 رسالة صوتية (${voiceDurationSec} ثانية)" else "🖼️ صورة مرفقة"
        }
        val roomId = _uiState.value.activeRoomId
        viewModelScope.launch {
            repository.sendRoomMessage(
                roomId = roomId,
                sender = me,
                content = finalContent,
                imageUri = imageUri,
                voiceDurationSec = voiceDurationSec
            ).onFailure { err ->
                showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر إرسال الرسالة")
            }
        }
    }

    fun toggleMicSlot(slotNumber: Int) {
        val me = _uiState.value.currentUser ?: return
        val room = _uiState.value.activeRoom
        if (room?.micsEnabled == false) {
            showToast("المايكات معطلة في هذه الغرفة حالياً")
            return
        }
        if (me.isMuted) {
            showToast("لا يمكنك الصعود للمايك أثناء الكتم")
            return
        }
        val currentSlots = _uiState.value.micSlots
        val target = currentSlots.firstOrNull { it.slotNumber == slotNumber } ?: return

        val updatedSlots = when {
            target.occupantKey == me.userKey -> {
                showToast("نزلت من المايك رقم $slotNumber")
                currentSlots.map {
                    if (it.slotNumber == slotNumber) VoiceMicSlot(slotNumber) else it
                }
            }
            target.occupantKey == null -> {
                showToast("صعدت على المايك رقم $slotNumber 🎙️")
                currentSlots.map { slot ->
                    when {
                        slot.occupantKey == me.userKey -> VoiceMicSlot(slot.slotNumber)
                        slot.slotNumber == slotNumber -> VoiceMicSlot(
                            slotNumber = slotNumber,
                            occupantKey = me.userKey,
                            occupantName = me.displayName,
                            occupantEmoji = me.avatarEmoji,
                            occupantRank = me.rank,
                            isMuted = false
                        )
                        else -> slot
                    }
                }
            }
            me.rank.isStaff -> {
                showToast("تم إنزال ${target.occupantName} من المايك")
                currentSlots.map {
                    if (it.slotNumber == slotNumber) VoiceMicSlot(slotNumber) else it
                }
            }
            else -> {
                showToast("هذا المايك مشغول بواسطة ${target.occupantName}")
                currentSlots
            }
        }
        _uiState.update { it.copy(micSlots = updatedSlots) }
    }

    fun toggleMyMicMute() {
        val me = _uiState.value.currentUser ?: return
        val onMic = _uiState.value.micSlots.any { it.occupantKey == me.userKey }
        if (!onMic) {
            showToast("اصعد على أحد المايكات أولاً")
            return
        }
        _uiState.update { state ->
            state.copy(
                micSlots = state.micSlots.map {
                    if (it.occupantKey == me.userKey) it.copy(isMuted = !it.isMuted) else it
                }
            )
        }
    }

    fun updateProfile(displayName: String, bio: String, avatarUri: String, vipFamily: String) {
        val me = _uiState.value.currentUser ?: return
        if (displayName.trim().length < 2) {
            showToast("الاسم يجب أن لا يقل عن حرفين")
            return
        }
        viewModelScope.launch {
            repository.updateProfile(me.userKey, displayName, bio, avatarUri, vipFamily).fold(
                onSuccess = { showToast("تم حفظ تعديلات الملف الشخصي ✅") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر حفظ الملف الشخصي") }
            )
        }
    }

    fun equipFrame(frame: AvatarFrame) {
        val me = _uiState.value.currentUser ?: return
        if (me.coins < frame.cost && me.avatarFrame != frame) {
            showToast("رصيدك غير كافٍ (${frame.cost} نقطة)")
            return
        }
        val newCoins = if (me.avatarFrame == frame) me.coins else (me.coins - frame.cost)
        viewModelScope.launch {
            repository.updateAppearance(me.userKey, frame, me.nameplateStyle, newCoins).fold(
                onSuccess = { showToast("تم تفعيل ${frame.arabicName} ✨") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر التفعيل") }
            )
        }
    }

    fun equipNameplate(style: NameplateStyle) {
        val me = _uiState.value.currentUser ?: return
        if (me.coins < style.cost && me.nameplateStyle != style) {
            showToast("رصيدك غير كافٍ (${style.cost} نقطة)")
            return
        }
        val newCoins = if (me.nameplateStyle == style) me.coins else (me.coins - style.cost)
        viewModelScope.launch {
            repository.updateAppearance(me.userKey, me.avatarFrame, style, newCoins).fold(
                onSuccess = { showToast("تم تفعيل ${style.arabicName} 💎") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر التفعيل") }
            )
        }
    }

    fun openPrivateChatWith(target: ChatUser) {
        _uiState.update { it.copy(activeDmPartner = target, selectedTab = BottomNavTab.PRIVATE) }
    }

    fun sendPrivateMessage(target: ChatUser, text: String) {
        val me = _uiState.value.currentUser ?: return
        if (me.isMuted) {
            showToast("أنت مكتوم حالياً")
            return
        }
        val clean = text.trim()
        if (clean.isEmpty()) return
        viewModelScope.launch {
            repository.sendDirectMessage(me, target, clean).onFailure { err ->
                showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر إرسال الرسالة الخاصة")
            }
        }
    }

    fun publishWallPost(content: String) {
        val me = _uiState.value.currentUser ?: return
        val clean = content.trim()
        if (clean.isEmpty()) return
        viewModelScope.launch {
            repository.publishWallPost(me, clean).fold(
                onSuccess = { showToast("تم النشر على حائط الأصدقاء 📝") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر النشر") }
            )
        }
    }

    fun likeWallPost(postId: String) {
        viewModelScope.launch {
            repository.likeWallPost(postId, currentUserId)
        }
    }

    fun submitReport(targetName: String, reason: String) {
        val me = _uiState.value.currentUser ?: return
        if (targetName.isBlank() || reason.isBlank()) return
        viewModelScope.launch {
            repository.submitReport(me.userKey, me.displayName, targetName, reason).fold(
                onSuccess = {
                    repository.addNotification(
                        createdByUid = me.userKey,
                        title = "بلاغ جديد",
                        body = "تم استلام بلاغ من ${me.displayName} ضد $targetName"
                    )
                    showToast("تم إرسال البلاغ للإدارة بنجاح 🛡️")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر إرسال البلاغ")
                }
            )
        }
    }

    fun markNotificationsRead() {
        val unreadIds = _uiState.value.notifications.filter { !it.isRead }.map { it.id }
        if (unreadIds.isEmpty()) return
        viewModelScope.launch {
            unreadIds.forEach { id ->
                repository.markNotificationRead(id, currentUserId)
            }
        }
    }

    fun upgradeGuestToMember(username: String, email: String, password: String): String? = null

    // --- OWNER & STAFF MODERATION ---

    fun createRoom(name: String, description: String, iconEmoji: String) {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isPrivilegedAdmin) {
            showToast("تحتاج إلى رتبة أدمن فأعلى لإنشاء غرفة")
            return
        }
        if (name.trim().length < 2) {
            showToast("أدخل اسم غرفة صحيح")
            return
        }
        viewModelScope.launch {
            repository.createRoom(name, description, iconEmoji, me).fold(
                onSuccess = { showToast("تم إنشاء غرفة \"${name.trim()}\" بنجاح 🏠") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر إنشاء الغرفة") }
            )
        }
    }

    fun deleteRoom(roomId: String) {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isPrivilegedAdmin) return
        if (roomId == "general") {
            showToast("لا يمكن حذف الغرفة العامة")
            return
        }
        viewModelScope.launch {
            repository.deleteRoom(roomId).fold(
                onSuccess = {
                    if (_uiState.value.activeRoomId == roomId) {
                        onSaveRoomId("general")
                        _uiState.update { it.copy(activeRoomId = "general") }
                    }
                    showToast("تم حذف الغرفة")
                },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر حذف الغرفة") }
            )
        }
    }

    fun toggleCurrentRoomMics() {
        val me = _uiState.value.currentUser ?: return
        val room = _uiState.value.activeRoom ?: return
        if (!me.rank.isStaff) {
            showToast("صلاحية إدارة الغرفة متاحة للإدارة والمالك فقط")
            return
        }
        val nextEnabled = !room.micsEnabled
        viewModelScope.launch {
            repository.toggleRoomMics(room.id, nextEnabled).fold(
                onSuccess = {
                    showToast(if (nextEnabled) "تم تفعيل المايكات في الغرفة 🎙️" else "تم قفل المايكات في الغرفة 🔇")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر تغيير حالة المايكات")
                }
            )
        }
    }

    fun clearCurrentRoomMessages() {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isStaff) {
            showToast("صلاحية مسح الرسائل للإدارة والمالك فقط")
            return
        }
        val roomId = _uiState.value.activeRoomId
        viewModelScope.launch {
            repository.clearRoomMessages(roomId).fold(
                onSuccess = {
                    repository.sendRoomMessage(
                        roomId = roomId,
                        sender = me,
                        content = "🧹 تم مسح رسائل الغرفة بواسطة ${me.displayName}",
                        isAnnouncement = true
                    )
                    showToast("تم تنظيف الغرفة 🧹")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر تنظيف الغرفة")
                }
            )
        }
    }

    fun broadcastAnnouncement(text: String) {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isStaff) return
        val clean = text.trim()
        if (clean.isEmpty()) return
        val roomId = _uiState.value.activeRoomId
        viewModelScope.launch {
            repository.sendRoomMessage(
                roomId = roomId,
                sender = me,
                content = "📢 إعلان إداري: $clean",
                isAnnouncement = true
            ).fold(
                onSuccess = {
                    repository.addNotification(
                        createdByUid = me.userKey,
                        title = "إعلان من ${me.displayName}",
                        body = clean
                    )
                    showToast("تم نشر الإعلان للغرفة 📢")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر نشر الإعلان")
                }
            )
        }
    }

    fun changeUserRank(target: ChatUser, newRank: ChatRank) {
        val me = _uiState.value.currentUser ?: return
        if (me.rank.power <= target.rank.power && me.userKey != target.userKey && me.rank != ChatRank.SITE_OWNER) {
            showToast("لا يمكنك تعديل رتبة عضو أعلى أو مساوٍ لرتبتك")
            return
        }
        if (newRank.power >= me.rank.power && me.rank != ChatRank.SITE_OWNER) {
            showToast("لا يمكنك منح رتبة أعلى أو مساوية لرتبتك")
            return
        }
        viewModelScope.launch {
            repository.updateUserRank(target.userKey, newRank).fold(
                onSuccess = {
                    repository.addNotification(
                        createdByUid = me.userKey,
                        title = "تحديث رتبة",
                        body = "تم ترقية/تعديل رتبة ${target.displayName} إلى ${newRank.arabicLabel} ${newRank.icon}"
                    )
                    showToast("تم تحديث رتبة ${target.displayName} إلى ${newRank.arabicLabel} ${newRank.icon}")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر تعديل الرتبة")
                }
            )
        }
    }

    fun toggleMuteUser(target: ChatUser, reason: String = "مخالفة آداب الدردشة") {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isStaff || me.rank.power <= target.rank.power) {
            showToast("ليس لديك صلاحية لكتم هذا العضو")
            return
        }
        val newMuted = !target.isMuted
        viewModelScope.launch {
            repository.setUserMuted(target.userKey, newMuted, reason).fold(
                onSuccess = {
                    if (newMuted) {
                        _uiState.update { state ->
                            state.copy(
                                micSlots = state.micSlots.map {
                                    if (it.occupantKey == target.userKey) VoiceMicSlot(it.slotNumber) else it
                                }
                            )
                        }
                    }
                    val actionLabel = if (newMuted) "كتم" else "فك كتم"
                    showToast("تم $actionLabel ${target.displayName}")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر تحديث حالة الكتم")
                }
            )
        }
    }

    fun kickUser(target: ChatUser) {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isStaff || me.rank.power <= target.rank.power) {
            showToast("ليس لديك صلاحية لطرد هذا العضو")
            return
        }
        viewModelScope.launch {
            repository.updatePresence(target.userKey, "offline")
            repository.sendRoomMessage(
                roomId = _uiState.value.activeRoomId,
                sender = me,
                content = "👢 تم طرد ${target.displayName} من الغرفة بواسطة ${me.displayName}",
                isAnnouncement = true
            )
            showToast("تم طرد ${target.displayName} من الغرفة")
        }
    }

    fun toggleBanUser(target: ChatUser, reason: String = "مخالفة قوانين الموقع") {
        val me = _uiState.value.currentUser ?: return
        if (!me.rank.isPrivilegedAdmin || me.rank.power <= target.rank.power) {
            showToast("الحظر متاح للأدمن والمالك فقط على الرتب الأدنى")
            return
        }
        val newBanned = !target.isBanned
        viewModelScope.launch {
            repository.setUserBanned(target.userKey, newBanned, reason).fold(
                onSuccess = {
                    if (newBanned) {
                        repository.sendRoomMessage(
                            roomId = _uiState.value.activeRoomId,
                            sender = me,
                            content = "⛔ تم حظر ${target.displayName} نهائياً بواسطة ${me.displayName}",
                            isAnnouncement = true
                        )
                    }
                    showToast(if (newBanned) "تم حظر ${target.displayName} نهائياً" else "تم فك الحظر عن ${target.displayName}")
                },
                onFailure = { err ->
                    showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر تنفيذ الحظر")
                }
            )
        }
    }

    fun resolveReport(reportId: String) {
        viewModelScope.launch {
            repository.resolveReport(reportId).fold(
                onSuccess = { showToast("تم إغلاق البلاغ ✅") },
                onFailure = { err -> showToast(unwrapFirestoreError(err).localizedMessage ?: "تعذر إغلاق البلاغ") }
            )
        }
    }

    // --- FIREBASE AI LOGIC (GEMINI ASSISTANT) ---

    fun resetAiState() {
        _uiState.update { it.copy(aiState = AiUiState.Idle) }
    }

    fun summarizeActiveRoomWithGemini() {
        val roomName = _uiState.value.activeRoom?.name ?: "الغرفة العامة"
        val recent = _uiState.value.messages
            .takeLast(20)
            .joinToString("\n") { "${it.senderName}: ${it.content}" }
        val prompt = if (recent.isBlank()) {
            "أنت مساعد عربي ودود في تطبيق شات الغرف. لا توجد رسائل بعد في غرفة \"$roomName\". اكتب ترحيباً قصيراً وجذاباً يشجع الأعضاء على بدء الدردشة."
        } else {
            "أنت مساعد ذكي باللغة العربية داخل تطبيق شات الغرف. لخص المحادثة الأخيرة في غرفة \"$roomName\" في نقاط موجزة وواضحة بالعربية:\n\n$recent"
        }
        askGeminiAssistant(prompt)
    }

    fun askGeminiAssistant(prompt: String) {
        val cleanPrompt = prompt.trim()
        if (cleanPrompt.isEmpty()) return

        viewModelScope.launch {
            _uiState.update { it.copy(aiState = AiUiState.Loading) }
            val accumulatedText = StringBuilder()
            try {
                withTimeout(60_000L) {
                    geminiModel.generateContentStream(cleanPrompt).collect { chunk ->
                        val chunkText = chunk.text.orEmpty()
                        if (chunkText.isNotEmpty()) {
                            accumulatedText.append(chunkText)
                            _uiState.update {
                                it.copy(aiState = AiUiState.Streaming(accumulatedText.toString()))
                            }
                        }
                    }
                }
                if (accumulatedText.isNotBlank()) {
                    _uiState.update { it.copy(aiState = AiUiState.Success(accumulatedText.toString())) }
                } else {
                    _uiState.update { it.copy(aiState = AiUiState.Error("لم يُرجع المساعد الذكي أي رد. حاول صياغة الطلب بشكل مختلف.")) }
                }
            } catch (e: TimeoutCancellationException) {
                Log.e(TAG, "Gemini AI generation timed out", e)
                _uiState.update {
                    it.copy(aiState = AiUiState.Error("انتهت مهلة الاتصال بالمساعد الذكي (60 ثانية). يرجى المحاولة مجدداً."))
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Firebase AI generation failed", e)
                _uiState.update {
                    it.copy(aiState = AiUiState.Error(e.localizedMessage ?: "تعذر الاتصال بخدمة Gemini AI."))
                }
            }
        }
    }
}
