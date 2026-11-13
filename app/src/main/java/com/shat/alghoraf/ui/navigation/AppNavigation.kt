package com.shat.alghoraf.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.shat.alghoraf.R
import com.shat.alghoraf.data.model.UiState
import com.shat.alghoraf.data.repository.ChatRepository
import com.shat.alghoraf.ui.auth.AuthScreen
import com.shat.alghoraf.ui.auth.authStateFlow
import com.shat.alghoraf.ui.auth.performSignOut
import com.shat.alghoraf.ui.ban.GlobalBanScreen
import com.shat.alghoraf.ui.chat.DirectChatScreen
import com.shat.alghoraf.ui.chat.RoomChatScreen
import com.shat.alghoraf.ui.lobby.LobbyScreen
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.TextPrimary
import com.shat.alghoraf.ui.viewmodel.ChatViewModel
import kotlinx.serialization.Serializable

@Serializable
data object LobbyRoute

@Serializable
data class RoomChatRoute(val roomId: String)

@Serializable
data class DirectChatRoute(val chatId: String)

@Composable
fun AppNavigation() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val credentialManager = remember { CredentialManager.create(context) }

    val authUser by Firebase.auth.authStateFlow().collectAsStateWithLifecycle(
        initialValue = Firebase.auth.currentUser
    )

    val currentUser = authUser
    if (currentUser == null) {
        AuthScreen(onAuthSuccess = {})
        return
    }

    key(currentUser.uid) {
        val chatViewModel: ChatViewModel = viewModel(
            key = currentUser.uid,
            factory = viewModelFactory {
                initializer {
                    val app = checkNotNull(this[APPLICATION_KEY])
                    val databaseId = app.getString(R.string.firestore_database_id)
                    val repo = ChatRepository(
                        db = FirebaseFirestore.getInstance(databaseId),
                        auth = Firebase.auth
                    )
                    ChatViewModel(
                        repository = repo,
                        currentUserId = currentUser.uid,
                        currentUserEmail = currentUser.email,
                        isEmailVerified = currentUser.isEmailVerified,
                        initialDisplayName = currentUser.displayName,
                        initialPhotoUrl = currentUser.photoUrl?.toString()
                    )
                }
            }
        )

        val snackbarHostState = remember { SnackbarHostState() }
        val navController = rememberNavController()

        LaunchedEffect(currentUser.uid) {
            chatViewModel.bootstrapSession(currentUser)
        }

        LaunchedEffect(chatViewModel) {
            chatViewModel.feedbackMessages.collect { msg ->
                snackbarHostState.showSnackbar(msg)
            }
        }

        val currentProfile by chatViewModel.currentProfile.collectAsStateWithLifecycle()
        val roomsState by chatViewModel.roomsState.collectAsStateWithLifecycle()
        val profilesState by chatViewModel.publicProfilesState.collectAsStateWithLifecycle()
        val directChatsState by chatViewModel.directChatsState.collectAsStateWithLifecycle()
        val bans by chatViewModel.bansState.collectAsStateWithLifecycle()
        val activeGlobalBan by chatViewModel.activeGlobalBan.collectAsStateWithLifecycle()

        val activeRoom by chatViewModel.activeRoom.collectAsStateWithLifecycle()
        val roomMessagesState by chatViewModel.roomMessagesState.collectAsStateWithLifecycle()
        val typingUsers by chatViewModel.typingUsers.collectAsStateWithLifecycle()

        val activeDirectChat by chatViewModel.activeDirectChat.collectAsStateWithLifecycle()
        val directMessagesState by chatViewModel.directMessagesState.collectAsStateWithLifecycle()

        val handleSignOut: () -> Unit = {
            chatViewModel.setPresenceOffline()
            performSignOut(
                credentialManager = credentialManager,
                scope = coroutineScope
            )
        }

        Box(modifier = Modifier.fillMaxSize()) {
            val ban = activeGlobalBan
            if (ban != null) {
                GlobalBanScreen(
                    ban = ban,
                    onSignOut = handleSignOut
                )
            } else {
                val allProfiles = (profilesState as? UiState.Success)?.data.orEmpty()

                NavHost(
                    navController = navController,
                    startDestination = LobbyRoute
                ) {
                    composable<LobbyRoute> {
                        LobbyScreen(
                            currentProfile = currentProfile,
                            currentUserId = chatViewModel.currentUserId,
                            isGlobalOwner = chatViewModel.isGlobalOwner,
                            roomsState = roomsState,
                            profilesState = profilesState,
                            directChatsState = directChatsState,
                            bans = bans,
                            onEnterRoom = { room ->
                                val blockReason = chatViewModel.checkRoomEntry(room)
                                if (blockReason != null) {
                                    // Trigger snackbar feedback via coroutine or state
                                    // Using feedback channel from LaunchedEffect wouldn't be direct, so emit via ViewModel
                                    chatViewModel.reportFeedback(blockReason)
                                } else {
                                    chatViewModel.enterRoom(room.id)
                                    navController.navigate(RoomChatRoute(room.id))
                                }
                            },
                            onEnterDirectChat = { chatId ->
                                chatViewModel.enterDirectChat(chatId)
                                navController.navigate(DirectChatRoute(chatId))
                            },
                            onStartDirectChat = { other ->
                                chatViewModel.startDirectChatWith(other) { chatId ->
                                    navController.navigate(DirectChatRoute(chatId))
                                }
                            },
                            onCreateRoom = { name, desc, category, icon, perm, locked ->
                                chatViewModel.createRoom(name, desc, category, icon, perm, locked)
                            },
                            onToggleRoomLock = { room ->
                                chatViewModel.updateRoom(roomId = room.id, isLocked = !room.isLocked)
                            },
                            onClearRoomMessages = { roomId ->
                                chatViewModel.clearRoomMessages(roomId)
                            },
                            onDeleteRoom = { roomId ->
                                chatViewModel.deleteRoom(roomId)
                            },
                            onSetUserRole = { uid, role ->
                                chatViewModel.setUserGlobalRole(uid, role)
                            },
                            onBanUserGlobal = { target, reason, perm, mins ->
                                chatViewModel.banUser(
                                    targetUid = target.userId,
                                    targetName = target.displayName,
                                    reason = reason,
                                    isPermanent = perm,
                                    minutes = mins,
                                    isGlobal = true,
                                    room = null
                                )
                            },
                            onUnban = { banRecord ->
                                chatViewModel.unbanUser(banRecord)
                            },
                            onBroadcast = { text ->
                                chatViewModel.broadcastAnnouncement(text)
                            },
                            onUpdateProfile = { name, bio, emoji, status ->
                                chatViewModel.updateProfile(name, bio, emoji, status)
                            },
                            onSignOut = handleSignOut
                        )
                    }

                    composable<RoomChatRoute> { backStackEntry ->
                        val route = backStackEntry.toRoute<RoomChatRoute>()
                        LaunchedEffect(route.roomId) {
                            chatViewModel.enterRoom(route.roomId)
                        }

                        val room = activeRoom
                        RoomChatScreen(
                            room = room,
                            messagesState = roomMessagesState,
                            typingUsers = typingUsers,
                            profiles = allProfiles,
                            currentUserId = chatViewModel.currentUserId,
                            isGlobalOwner = chatViewModel.isGlobalOwner,
                            canManageRoom = room != null && chatViewModel.canManageRoom(room),
                            isRoomAdminOrOwner = room != null && chatViewModel.isRoomAdminOrOwner(room),
                            isRoomOwnerOrGlobalOwner = room != null && chatViewModel.isRoomOwnerOrGlobalOwner(room),
                            onBack = {
                                chatViewModel.leaveRoom()
                                navController.popBackStack()
                            },
                            onInputChanged = { text ->
                                chatViewModel.onRoomInputChanged(route.roomId, text)
                            },
                            onSendMessage = { content, isAnnouncement, replyTo ->
                                room?.let {
                                    chatViewModel.sendRoomMessage(it, content, isAnnouncement, replyTo)
                                }
                            },
                            onToggleReaction = { message, emoji ->
                                chatViewModel.toggleReaction(route.roomId, message, emoji)
                            },
                            onDeleteMessage = { messageId ->
                                chatViewModel.deleteMessage(route.roomId, messageId)
                            },
                            onClearMessages = {
                                chatViewModel.clearRoomMessages(route.roomId)
                            },
                            onDeleteRoom = {
                                chatViewModel.deleteRoom(route.roomId)
                                chatViewModel.leaveRoom()
                                navController.popBackStack()
                            },
                            onUpdateRoom = { name, desc, category, icon, perm, locked, pinned, clearPinned ->
                                chatViewModel.updateRoom(
                                    roomId = route.roomId,
                                    name = name,
                                    description = desc,
                                    category = category,
                                    icon = icon,
                                    permissionLevel = perm,
                                    isLocked = locked,
                                    pinnedMessage = pinned,
                                    clearPinnedMessage = clearPinned
                                )
                            },
                            onToggleMuteUser = { uid, name ->
                                room?.let { chatViewModel.toggleMuteUser(it, uid, name) }
                            },
                            onBanUser = { uid, name, reason, perm, mins, isGlobal ->
                                chatViewModel.banUser(
                                    targetUid = uid,
                                    targetName = name,
                                    reason = reason,
                                    isPermanent = perm,
                                    minutes = mins,
                                    isGlobal = isGlobal,
                                    room = if (isGlobal) null else room
                                )
                            },
                            onUnbanFromRoom = { uid, name ->
                                room?.let { chatViewModel.unbanFromRoom(it, uid, name) }
                            },
                            onToggleRoomAdmin = { uid, name ->
                                room?.let { chatViewModel.toggleRoomAdmin(it, uid, name) }
                            },
                            onToggleRoomModerator = { uid, name ->
                                room?.let { chatViewModel.toggleRoomModerator(it, uid, name) }
                            },
                            onStartDirectChat = { other ->
                                chatViewModel.startDirectChatWith(other) { chatId ->
                                    navController.navigate(DirectChatRoute(chatId))
                                }
                            }
                        )
                    }

                    composable<DirectChatRoute> { backStackEntry ->
                        val route = backStackEntry.toRoute<DirectChatRoute>()
                        LaunchedEffect(route.chatId) {
                            chatViewModel.enterDirectChat(route.chatId)
                        }

                        DirectChatScreen(
                            chat = activeDirectChat,
                            messagesState = directMessagesState,
                            currentUserId = chatViewModel.currentUserId,
                            onBack = {
                                chatViewModel.leaveDirectChat()
                                navController.popBackStack()
                            },
                            onSendMessage = { content, replyTo ->
                                activeDirectChat?.let {
                                    chatViewModel.sendDirectMessage(it, content, replyTo)
                                }
                            }
                        )
                    }
                }
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(16.dp)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = CardSlate,
                    contentColor = TextPrimary,
                    actionColor = BrightGold
                )
            }
        }
    }
}
