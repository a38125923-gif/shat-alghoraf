package com.example

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.ChatRoomScreen
import com.example.ui.screens.RoomsScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.ChatViewModel
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background
        ) {
          ChatAppRoot()
        }
      }
    }
  }
}

@Composable
fun ChatAppRoot() {
  val auth = Firebase.auth
  var currentUser by remember { mutableStateOf(auth.currentUser) }
  var customSessionUser by remember { mutableStateOf<com.example.data.model.UserProfile?>(null) }
  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()
  val credentialManager = remember { CredentialManager.create(context) }

  DisposableEffect(Unit) {
    val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
      currentUser = firebaseAuth.currentUser
    }
    auth.addAuthStateListener(listener)
    onDispose {
      auth.removeAuthStateListener(listener)
    }
  }

  if (currentUser == null && customSessionUser == null) {
    AuthScreen(
      onAuthSuccess = {
        currentUser = Firebase.auth.currentUser
      },
      onCustomAuthSuccess = { user ->
        customSessionUser = user
      }
    )
  } else {
    val uid = currentUser?.uid ?: customSessionUser?.userId ?: "session_user"
    androidx.compose.runtime.key(uid) {
      val chatViewModel: ChatViewModel = viewModel(key = uid)

      androidx.compose.runtime.LaunchedEffect(customSessionUser) {
        customSessionUser?.let { chatViewModel.setCustomSession(it) }
      }

      val selectedRoomId by chatViewModel.selectedRoomId.collectAsState()
      val activeGlobalBan by chatViewModel.activeGlobalBan.collectAsState()
      val profile by chatViewModel.userProfile.collectAsState()

      val isUserBanned = activeGlobalBan != null || profile?.isGlobalBanActive() == true

      if (isUserBanned) {
        val banInfo = activeGlobalBan ?: com.example.data.model.BanRecord(
          reason = profile?.banReason ?: "مخالفة القوانين والآداب العامة",
          isPermanent = (profile?.banExpiresAtMillis ?: 0L) <= 0L,
          expiresAtMillis = profile?.banExpiresAtMillis ?: 0L
        )
        com.example.ui.screens.GlobalBanScreen(
          banRecord = banInfo,
          onSignOut = {
            signOutUser(
              credentialManager = credentialManager,
              scope = coroutineScope,
              onSignOutComplete = {
                currentUser = null
                customSessionUser = null
              }
            )
          }
        )
      } else if (selectedRoomId == null) {
        RoomsScreen(
          viewModel = chatViewModel,
          onSignOut = {
            signOutUser(
              credentialManager = credentialManager,
              scope = coroutineScope,
              onSignOutComplete = {
                currentUser = null
                customSessionUser = null
              }
            )
          },
          onRoomSelected = { roomId ->
            chatViewModel.selectRoom(roomId)
          }
        )
      } else {
        ChatRoomScreen(
          viewModel = chatViewModel,
          onNavigateBack = {
            chatViewModel.selectRoom(null)
          }
        )
      }
    }
  }
}

private fun signOutUser(
  credentialManager: CredentialManager,
  scope: CoroutineScope,
  onSignOutComplete: () -> Unit
) {
  scope.launch {
    withContext(NonCancellable) {
      try {
        credentialManager.clearCredentialState(ClearCredentialStateRequest())
      } catch (e: Exception) {
        Log.w("Auth", "Failed to clear credential state: ${e.message}")
      } finally {
        Firebase.auth.signOut()
        onSignOutComplete()
      }
    }
  }
}
