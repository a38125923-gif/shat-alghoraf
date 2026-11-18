package com.shat.alghoraf.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.FirebaseFirestoreException
import com.shat.alghoraf.data.BanRecord
import com.shat.alghoraf.data.ChatMessage
import com.shat.alghoraf.data.ChatRepository
import com.shat.alghoraf.data.ChatRoom
import com.shat.alghoraf.data.DefaultCatalogs
import com.shat.alghoraf.data.Friendship
import com.shat.alghoraf.data.GiftCatalogItem
import com.shat.alghoraf.data.GiftTransaction
import com.shat.alghoraf.data.NewsPost
import com.shat.alghoraf.data.NotificationItem
import com.shat.alghoraf.data.PrivateMessage
import com.shat.alghoraf.data.PublicProfile
import com.shat.alghoraf.data.RankConfig
import com.shat.alghoraf.data.RoomMicSlot
import com.shat.alghoraf.data.SiteSettings
import com.shat.alghoraf.data.UiState
import com.shat.alghoraf.data.UserPrivate
import com.shat.alghoraf.data.UserReport
import com.shat.alghoraf.data.WallPost
import com.shat.alghoraf.data.toFirestoreMessage
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.coroutines.cancellation.CancellationException

@OptIn(ExperimentalCoroutinesApi::class)
class MainChatViewModel(
    private val repository: ChatRepository,
    val currentUserId: String,
    val currentUserEmail: String?
) : ViewModel() {

    private val isSupremeOwnerAccount = DefaultCatalogs.isSupremeOwnerEmail(currentUserEmail)

    private val _activeRoomId = MutableStateFlow("general")
    val activeRoomId: StateFlow<String> = _activeRoomId.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    private val _giftCelebration = MutableStateFlow<String?>(null)
    val giftCelebration: StateFlow<String?> = _giftCelebration.asStateFlow()

    private fun <T> Flow<T>.toUiStateFlow(initial: UiState<T> = UiState.Loading, label: String): StateFlow<UiState<T>> =
        this.map<T, UiState<T>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val rootError = firestoreError ?: error
                Log.w(TAG, "Error observing $label", rootError)
                emit(UiState.Error(rootError.localizedMessage ?: "تعذر تحميل $label"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = initial
            )

    val myPrivateUser: StateFlow<UiState<UserPrivate?>> =
        repository.observeMyPrivateUser(currentUserId).toUiStateFlow(label = "بيانات الحساب")

    val myProfile: StateFlow<UiState<PublicProfile?>> =
        repository.observeMyProfile(currentUserId).toUiStateFlow(label = "الملف الشخصي")

    val publicProfiles: StateFlow<UiState<List<PublicProfile>>> =
        repository.observePublicProfiles().toUiStateFlow(label = "الأعضاء")

    val rooms: StateFlow<UiState<List<ChatRoom>>> =
        repository.observeRooms().toUiStateFlow(label = "الغرف")

    val ranks: StateFlow<UiState<List<RankConfig>>> =
        repository.observeRanks().toUiStateFlow(label = "الرتب")

    val siteSettings: StateFlow<SiteSettings> =
        repository.observeSiteSettings()
            .catch { error ->
                val fsErr = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>().firstOrNull()
                if (fsErr == null && error is CancellationException) throw error
                emit(SiteSettings())
            }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), SiteSettings())

    val roomMessages: StateFlow<UiState<List<ChatMessage>>> =
        _activeRoomId.flatMapLatest { roomId ->
            repository.observeRoomMessages(roomId)
        }.toUiStateFlow(label = "الرسائل")

    val roomMics: StateFlow<UiState<List<RoomMicSlot>>> =
        _activeRoomId.flatMapLatest { roomId ->
            repository.observeRoomMics(roomId)
        }.toUiStateFlow(label = "المايكات")

    val newsPosts: StateFlow<UiState<List<NewsPost>>> =
        repository.observeNews().toUiStateFlow(label = "الأخبار")

    val wallPosts: StateFlow<UiState<List<WallPost>>> =
        repository.observeWallPosts().toUiStateFlow(label = "الحائط")

    val privateMessages: StateFlow<UiState<List<PrivateMessage>>> =
        repository.observePrivateMessages(currentUserId).toUiStateFlow(label = "الرسائل الخاصة")

    val friendships: StateFlow<UiState<List<Friendship>>> =
        repository.observeFriendships(currentUserId).toUiStateFlow(label = "الأصدقاء")

    val notifications: StateFlow<UiState<List<NotificationItem>>> =
        repository.observeNotifications(currentUserId).toUiStateFlow(label = "الإشعارات")

    val giftTransactions: StateFlow<UiState<List<GiftTransaction>>> =
        repository.observeGiftTransactions().toUiStateFlow(label = "الهدايا")

    val reports: StateFlow<UiState<List<UserReport>>> =
        repository.observeReports(currentUserId, isSupremeOwnerAccount).toUiStateFlow(label = "البلاغات")

    val bans: StateFlow<UiState<List<BanRecord>>> =
        repository.observeBans(currentUserId, isSupremeOwnerAccount).toUiStateFlow(label = "المحظورين")

    init {
        viewModelScope.launch {
            repository.ensureUserProvisioned().onFailure { err ->
                _toastMessage.value = err.toFirestoreMessage("تعذر تهيئة بيانات الحساب")
            }
            while (isActive) {
                repository.sendHeartbeat(_activeRoomId.value, true)
                delay(15_000L)
            }
        }
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    fun clearGiftCelebration() {
        _giftCelebration.value = null
    }

    fun showNotice(message: String) {
        _toastMessage.value = message
    }

    fun switchRoom(roomId: String) {
        if (roomId.isBlank() || roomId == _activeRoomId.value) return
        _activeRoomId.value = roomId
        viewModelScope.launch {
            repository.sendHeartbeat(roomId, true)
        }
    }

    fun sendMessage(text: String, msgType: String = "text", mediaUrl: String = "", asAdminNotice: Boolean = false) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            val res = repository.sendRoomMessage(
                roomId = _activeRoomId.value,
                sender = me,
                content = text,
                msgType = if (asAdminNotice) "admin_notice" else msgType,
                mediaUrl = mediaUrl,
                isAdminNotice = asAdminNotice
            )
            res.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر إرسال الرسالة")
            }
        }
    }

    fun deleteMessage(messageId: String) {
        viewModelScope.launch {
            repository.deleteMessage(messageId).onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر حذف الرسالة")
            }
        }
    }

    fun toggleMicSlot(slotNumber: Int) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.claimOrToggleMic(_activeRoomId.value, slotNumber, me).onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر استخدام المايك")
            }
        }
    }

    fun leaveMicSlot(slotNumber: Int) {
        viewModelScope.launch {
            repository.leaveMic(_activeRoomId.value, slotNumber).onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر مغادرة المايك")
            }
        }
    }

    fun adminMuteMic(slotNumber: Int, mute: Boolean) {
        viewModelScope.launch {
            repository.adminMuteMic(_activeRoomId.value, slotNumber, mute).onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر التحكم في المايك")
            }
        }
    }

    fun toggleStealth(enabled: Boolean) {
        viewModelScope.launch {
            repository.toggleStealth(enabled).onSuccess {
                _toastMessage.value = if (enabled) "تم تفعيل وضع التخفي الملكي 👻" else "تم إلغاء وضع التخفي"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر تغيير وضع التخفي")
            }
        }
    }

    fun saveCustomizations(
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
    ) {
        viewModelScope.launch {
            repository.updateMyCustomizations(
                displayName = displayName,
                bio = bio,
                avatarUrl = avatarUrl,
                nameColor = nameColor,
                textColor = textColor,
                nameBgColor = nameBgColor,
                neonColor = neonColor,
                fontFamily = fontFamily,
                fontStyle = fontStyle,
                avatarFrame = avatarFrame,
                nameplateStyle = nameplateStyle,
                nameShine = nameShine,
                vipWings = vipWings,
                profileMusic = profileMusic,
                vipFamily = vipFamily
            ).onSuccess {
                _toastMessage.value = "تم حفظ التعديلات سحابياً بنجاح ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر حفظ التعديلات")
            }
        }
    }

    fun sendGift(recipient: PublicProfile, gift: GiftCatalogItem) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.sendGift(me, recipient, gift, _activeRoomId.value).onSuccess {
                _giftCelebration.value = "${gift.emoji} أرسلت ${gift.name} إلى ${recipient.shownName}!"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر إرسال الهدية")
            }
        }
    }

    fun markNotificationRead(id: String) {
        viewModelScope.launch {
            repository.markNotificationRead(id)
        }
    }

    fun sendPrivateMessage(recipient: PublicProfile, content: String) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.sendPrivateMessage(me, recipient, content).onSuccess {
                _toastMessage.value = "تم إرسال الرسالة الخاصة إلى ${recipient.shownName}"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر إرسال الرسالة الخاصة")
            }
        }
    }

    fun sendFriendRequest(target: PublicProfile) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.sendFriendRequest(me, target).onSuccess {
                _toastMessage.value = "تم إرسال طلب الصداقة إلى ${target.shownName}"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر إرسال طلب الصداقة")
            }
        }
    }

    fun acceptFriend(friendshipId: String) {
        viewModelScope.launch {
            repository.acceptFriendRequest(friendshipId).onSuccess {
                _toastMessage.value = "تم قبول الصداقة ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر قبول الطلب")
            }
        }
    }

    fun removeFriend(friendshipId: String) {
        viewModelScope.launch {
            repository.removeFriendship(friendshipId)
        }
    }

    fun createWallPost(content: String) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.createWallPost(me, content).onSuccess {
                _toastMessage.value = "تم النشر على الحائط"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر النشر على الحائط")
            }
        }
    }

    fun likeWallPost(postId: String) {
        viewModelScope.launch {
            repository.likeWallPost(postId)
        }
    }

    fun submitReport(targetId: String, targetName: String, reason: String) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.submitReport(me, targetId, targetName, _activeRoomId.value, reason).onSuccess {
                _toastMessage.value = "تم إرسال البلاغ للإدارة ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر إرسال البلاغ")
            }
        }
    }

    fun updateRoomYoutube(videoIdOrUrl: String, title: String, playing: Boolean) {
        val cleanId = extractYoutubeId(videoIdOrUrl)
        viewModelScope.launch {
            repository.updateRoomYoutube(_activeRoomId.value, cleanId, title, playing).onSuccess {
                _toastMessage.value = if (playing && cleanId.isNotBlank()) "تم تشغيل الفيديو في الغرفة" else "تم تحديث مشغل الغرفة"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر تحديث اليوتيوب")
            }
        }
    }

    fun publishNews(title: String, content: String) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.publishNews(me, title, content).onSuccess {
                _toastMessage.value = "تم نشر الخبر في الموقع ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر نشر الخبر")
            }
        }
    }

    fun saveRoom(roomId: String, name: String, desc: String, icon: String, bgTheme: String, welcome: String, minPower: Long, micsEnabled: Boolean) {
        viewModelScope.launch {
            repository.saveRoom(roomId, name, desc, icon, bgTheme, welcome, minPower, micsEnabled).onSuccess {
                _toastMessage.value = "تم حفظ الغرفة سحابياً ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر حفظ الغرفة")
            }
        }
    }

    fun saveRank(rank: RankConfig) {
        viewModelScope.launch {
            repository.saveRank(rank).onSuccess {
                _toastMessage.value = "تم حفظ الرتبة وصلاحياتها ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر حفظ الرتبة")
            }
        }
    }

    fun assignRank(targetUid: String, rankKey: String, grantAdmin: Boolean) {
        viewModelScope.launch {
            repository.assignUserRank(targetUid, rankKey, grantAdmin).onSuccess {
                _toastMessage.value = "تم تحديث رتبة العضو بنجاح ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر تعديل الرتبة")
            }
        }
    }

    fun banUser(target: PublicProfile, reason: String) {
        val me = (myProfile.value as? UiState.Success)?.data ?: return
        viewModelScope.launch {
            repository.banUser(me, target, reason).onSuccess {
                _toastMessage.value = "تم حظر ${target.shownName}"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر تنفيذ الحظر")
            }
        }
    }

    fun unbanUser(targetUserId: String) {
        viewModelScope.launch {
            repository.unbanUser(targetUserId).onSuccess {
                _toastMessage.value = "تم فك الحظر ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر فك الحظر")
            }
        }
    }

    fun muteUser(target: PublicProfile, reason: String) {
        viewModelScope.launch {
            repository.muteUserInRoom(_activeRoomId.value, target, reason).onSuccess {
                _toastMessage.value = "تم كتم ${target.shownName} في الغرفة"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر كتم العضو")
            }
        }
    }

    fun saveSiteSettings(siteName: String, welcomeBanner: String, marqueeText: String, soundEnabled: Boolean) {
        viewModelScope.launch {
            repository.updateSiteSettings(siteName, welcomeBanner, marqueeText, soundEnabled).onSuccess {
                _toastMessage.value = "تم حفظ إعدادات الموقع ✅"
            }.onFailure {
                _toastMessage.value = it.toFirestoreMessage("تعذر حفظ الإعدادات")
            }
        }
    }

    suspend fun goOfflineBeforeSignOut() {
        repository.sendHeartbeat(_activeRoomId.value, false)
    }

    private fun extractYoutubeId(input: String): String {
        val trimmed = input.trim()
        val regex = Regex("(?:v=|youtu\\.be/|shorts/|embed/)([a-zA-Z0-9_-]{6,15})")
        return regex.find(trimmed)?.groupValues?.getOrNull(1) ?: trimmed.take(30)
    }

    private companion object {
        const val TAG = "MainChatVM"
    }
}
