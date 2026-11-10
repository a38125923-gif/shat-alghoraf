package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.BanRecord
import com.example.data.model.ChatMessage
import com.example.data.model.Room
import com.example.data.model.UserProfile
import com.example.data.model.UserRole
import com.example.data.repository.ChatRepository
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModel(application: Application) : AndroidViewModel(application) {

  private val repository = ChatRepository(application)
  val auth = Firebase.auth

  val currentUser: FirebaseUser?
    get() = auth.currentUser

  val currentUserId: String
    get() = auth.currentUser?.uid ?: ""

  private val _errorMessage = MutableStateFlow<String?>(null)
  val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

  private val _successMessage = MutableStateFlow<String?>(null)
  val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

  private val _isLoading = MutableStateFlow(false)
  val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

  // Selected Category filter
  val selectedCategory = MutableStateFlow("الكل")

  // User Profile
  val userProfile: StateFlow<UserProfile?> = if (currentUserId.isNotBlank()) {
    repository.observeUserProfile(currentUserId)
      .catch { emit(null) }
      .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
  } else {
    MutableStateFlow(null)
  }

  // All Rooms
  val rooms: StateFlow<List<Room>> = repository.observeRooms()
    .catch { e ->
      _errorMessage.value = "تعذر تحميل الغرف: ${e.localizedMessage}"
      emit(emptyList())
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  // Active Room ID
  val selectedRoomId = MutableStateFlow<String?>(null)

  // Current active room flow
  val currentRoom: StateFlow<Room?> = selectedRoomId.flatMapLatest { id ->
    if (id.isNullOrBlank()) flowOf(null)
    else repository.observeRoom(id).catch { emit(null) }
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

  // Messages of the active room
  val messages: StateFlow<List<ChatMessage>> = selectedRoomId.flatMapLatest { id ->
    if (id.isNullOrBlank()) flowOf(emptyList())
    else repository.observeMessages(id).catch { e ->
      _errorMessage.value = "تعذر تحميل الرسائل: ${e.localizedMessage}"
      emit(emptyList())
    }
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  // Active Global Ban check for current user
  val activeGlobalBan: StateFlow<BanRecord?> = if (currentUserId.isNotBlank()) {
    repository.observeActiveGlobalBan(currentUserId)
      .catch { emit(null) }
      .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
  } else {
    MutableStateFlow(null)
  }

  // All Users in the app directory (for owner/admin management)
  val allUsers: StateFlow<List<UserProfile>> = repository.observeAllUsers()
    .catch { emit(emptyList()) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  // Bans in active room
  val roomBans: StateFlow<List<BanRecord>> = selectedRoomId.flatMapLatest { id ->
    if (id.isNullOrBlank()) flowOf(emptyList())
    else repository.observeBans(id).catch { emit(emptyList()) }
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  // Global bans
  val globalBans: StateFlow<List<BanRecord>> = repository.observeBans(null)
    .catch { emit(emptyList()) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  init {
    ensureProfileExists()
    seedDefaultRoomsIfEmpty()
  }

  private fun seedDefaultRoomsIfEmpty() {
    viewModelScope.launch {
      rooms.collect { list ->
        if (list.isEmpty() && auth.currentUser != null) {
          val ownerName = userProfile.value?.displayName ?: "المالك 👑"
          val defaults = listOf(
            Triple("الغرفة العامة", "مرحباً بكم في الشات العام لجميع الأعضاء والزوار", "عام"),
            Triple("اليمن اصل العرب", "ملتقى الأشقاء وأهل الكرم والوفاء", "تعارف"),
            Triple("غرفة السعودية", "حياكم الله جميعاً في غرفة المملكة", "عام"),
            Triple("غرفة المعلمين", "غرفة نقاش وتبادل الفائدة والثقافة", "ثقافة"),
            Triple("الاداره", "غرفة مغلقة خاصة بالمالك والأدمن فقط", "عام")
          )
          for ((name, desc, cat) in defaults) {
            val res = repository.createRoom(name, desc, cat, ownerName)
            if (name == "الاداره" && res.isSuccess) {
              repository.toggleRoomLock(res.getOrThrow(), true)
            }
          }
        }
      }
    }
  }

  fun ensureProfileExists() {
    val user = auth.currentUser ?: return
    viewModelScope.launch {
      val initialName = user.displayName ?: user.email?.substringBefore("@") ?: "مستخدم"
      val profile = UserProfile(
        userId = user.uid,
        displayName = initialName,
        email = user.email ?: "",
        photoUrl = user.photoUrl?.toString(),
        globalRole = if (user.email == "a38125923@gmail.com") "owner" else "member",
        status = "online"
      )
      repository.saveUserProfile(profile)
    }
  }

  fun selectRoom(roomId: String?) {
    selectedRoomId.value = roomId
  }

  fun createRoom(
    name: String,
    description: String,
    category: String,
    permissionLevel: String = "PUBLIC",
    onSuccess: (String) -> Unit
  ) {
    if (name.isBlank()) {
      _errorMessage.value = "يرجى كتابة اسم الغرفة"
      return
    }
    val ownerName = userProfile.value?.displayName ?: auth.currentUser?.displayName ?: "المالك"
    viewModelScope.launch {
      _isLoading.value = true
      val result = repository.createRoom(name, description, category, ownerName, permissionLevel)
      _isLoading.value = false
      result.fold(
        onSuccess = { id ->
          _successMessage.value = "تم إنشاء الغرفة بنجاح!"
          selectRoom(id)
          onSuccess(id)
        },
        onFailure = { e ->
          _errorMessage.value = "فشل إنشاء الغرفة: ${e.localizedMessage}"
        }
      )
    }
  }

  fun updateRoomDetails(
    roomId: String,
    name: String,
    description: String,
    category: String,
    permissionLevel: String = "PUBLIC"
  ) {
    if (name.isBlank()) {
      _errorMessage.value = "اسم الغرفة لا يمكن أن يكون فارغاً"
      return
    }
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.updateRoomDetails(roomId, name, description, category, permissionLevel)
      _isLoading.value = false
      res.fold(
        onSuccess = { _successMessage.value = "تم تحديث بيانات الغرفة بنجاح" },
        onFailure = { _errorMessage.value = "تعذر تحديث الغرفة: ${it.localizedMessage}" }
      )
    }
  }

  fun toggleRoomLock(roomId: String, isLocked: Boolean) {
    viewModelScope.launch {
      val res = repository.toggleRoomLock(roomId, isLocked)
      res.fold(
        onSuccess = {
          _successMessage.value = if (isLocked) "تم قفل الغرفة للكتابة 🔒" else "تم فتح الغرفة للكتابة 🔓"
        },
        onFailure = { _errorMessage.value = "فشل تغيير حالة القفل: ${it.localizedMessage}" }
      )
    }
  }

  fun setPinnedAnnouncement(roomId: String, message: String?) {
    val sender = userProfile.value?.displayName ?: "الإدارة"
    viewModelScope.launch {
      val res = repository.setPinnedAnnouncement(roomId, message, if (message.isNullOrBlank()) null else sender)
      res.fold(
        onSuccess = {
          _successMessage.value = if (message.isNullOrBlank()) "تم إزالة الإعلان المثبت" else "تم تثبيت الإعلان بنجاح 📢"
        },
        onFailure = { _errorMessage.value = "فشل تعديل الإعلان: ${it.localizedMessage}" }
      )
    }
  }

  fun manageUserRole(roomId: String, targetUid: String, role: UserRole, enable: Boolean) {
    if (targetUid.isBlank()) {
      _errorMessage.value = "معرف المستخدم غير صالح"
      return
    }
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.manageUserRole(roomId, targetUid, role, enable)
      _isLoading.value = false
      res.fold(
        onSuccess = {
          val actionAr = if (enable) "تعيين" else "إلغاء"
          _successMessage.value = "تم $actionAr ${role.labelAr} للعضو"
        },
        onFailure = { _errorMessage.value = "تعذر تعديل الرتبة: ${it.localizedMessage}" }
      )
    }
  }

  fun deleteRoom(roomId: String, onDeleted: () -> Unit) {
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.deleteRoom(roomId)
      _isLoading.value = false
      res.fold(
        onSuccess = {
          _successMessage.value = "تم حذف الغرفة"
          if (selectedRoomId.value == roomId) {
            selectedRoomId.value = null
          }
          onDeleted()
        },
        onFailure = { _errorMessage.value = "فشل حذف الغرفة: ${it.localizedMessage}" }
      )
    }
  }

  fun sendMessage(content: String, isAnnouncement: Boolean = false) {
    val roomId = selectedRoomId.value ?: return
    val room = currentRoom.value ?: return
    val uid = currentUserId
    if (!room.canPostMessages(uid)) {
      _errorMessage.value = "لا تملك صلاحية الإرسال في هذه الغرفة"
      return
    }
    if (content.isBlank()) return

    val role = room.getUserRole(uid)
    val senderName = userProfile.value?.displayName ?: auth.currentUser?.displayName ?: "مستخدم"

    viewModelScope.launch {
      val res = repository.sendMessage(roomId, content, senderName, role, isAnnouncement)
      res.onFailure {
        _errorMessage.value = "فشل إرسال الرسالة: ${it.localizedMessage}"
      }
    }
  }

  fun deleteMessage(messageId: String) {
    val roomId = selectedRoomId.value ?: return
    viewModelScope.launch {
      val res = repository.deleteMessage(roomId, messageId)
      res.onFailure {
        _errorMessage.value = "فشل حذف الرسالة: ${it.localizedMessage}"
      }
    }
  }

  fun updateUserProfile(displayName: String, bio: String?, status: String) {
    val current = userProfile.value ?: return
    val updated = current.copy(
      displayName = displayName.trim().ifBlank { current.displayName },
      bio = bio?.trim(),
      status = status
    )
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.saveUserProfile(updated)
      _isLoading.value = false
      res.fold(
        onSuccess = { _successMessage.value = "تم تحديث الملف الشخصي" },
        onFailure = { _errorMessage.value = "تعذر حفظ البيانات: ${it.localizedMessage}" }
      )
    }
  }

  fun banUser(
    roomId: String?,
    roomName: String?,
    targetUid: String,
    targetName: String,
    reason: String,
    isPermanent: Boolean,
    durationMinutes: Int,
    isGlobal: Boolean
  ) {
    if (targetUid.isBlank()) {
      _errorMessage.value = "معرف المستخدم غير صالح"
      return
    }
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.banUser(
        roomId = roomId,
        roomName = roomName,
        targetUid = targetUid,
        targetName = targetName,
        reason = reason,
        isPermanent = isPermanent,
        durationMinutes = durationMinutes,
        isGlobal = isGlobal
      )
      _isLoading.value = false
      res.fold(
        onSuccess = {
          val scopeText = if (isGlobal) "عام من التطبيق" else "من الغرفة"
          val durText = if (isPermanent) "دائم" else "مؤقت"
          _successMessage.value = "تم تطبيق حظر $durText ($scopeText) على $targetName 🚫"
        },
        onFailure = { _errorMessage.value = "فشل تطبيق الحظر: ${it.localizedMessage}" }
      )
    }
  }

  fun unbanUser(
    roomId: String?,
    targetUid: String,
    targetName: String = "",
    banId: String? = null,
    isGlobal: Boolean = false
  ) {
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.unbanUser(roomId, targetUid, banId, isGlobal)
      _isLoading.value = false
      res.fold(
        onSuccess = {
          _successMessage.value = "تم رفع الحظر بنجاح عن $targetName 🔓"
        },
        onFailure = { _errorMessage.value = "فشل رفع الحظر: ${it.localizedMessage}" }
      )
    }
  }

  fun promoteToModerator(roomId: String, targetUid: String, targetName: String = "") {
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.manageUserRole(roomId, targetUid, UserRole.MODERATOR, true)
      _isLoading.value = false
      res.fold(
        onSuccess = { _successMessage.value = "تمت ترقية $targetName إلى مشرف ⚔️ بنجاح" },
        onFailure = { _errorMessage.value = "فشلت الترقية: ${it.localizedMessage}" }
      )
    }
  }

  fun demoteModerator(roomId: String, targetUid: String, targetName: String = "") {
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.manageUserRole(roomId, targetUid, UserRole.MODERATOR, false)
      _isLoading.value = false
      res.fold(
        onSuccess = { _successMessage.value = "تم سحب رتبة الإشراف من $targetName وإعادته كمستخدم عادي" },
        onFailure = { _errorMessage.value = "فشل سحب الإشراف: ${it.localizedMessage}" }
      )
    }
  }

  fun muteUser(roomId: String, targetUid: String, targetName: String = "", mute: Boolean) {
    viewModelScope.launch {
      _isLoading.value = true
      val res = repository.manageUserRole(roomId, targetUid, UserRole.MUTED, mute)
      _isLoading.value = false
      res.fold(
        onSuccess = {
          _successMessage.value = if (mute) "تم كتم المستخدم $targetName 🔇" else "تم إلغاء كتم $targetName 🔊"
        },
        onFailure = { _errorMessage.value = "فشل تعديل حالة الكتم: ${it.localizedMessage}" }
      )
    }
  }

  fun clearError() {
    _errorMessage.value = null
  }

  fun clearSuccess() {
    _successMessage.value = null
  }
}
