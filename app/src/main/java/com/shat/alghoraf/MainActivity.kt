package com.shat.alghoraf

import android.annotation.SuppressLint
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.shat.alghoraf.auth.authStateFlow
import com.shat.alghoraf.data.ChatRepository
import com.shat.alghoraf.ui.AuthScreen
import com.shat.alghoraf.ui.ChatRoomScreen
import com.shat.alghoraf.ui.MainChatViewModel
import com.shat.alghoraf.ui.theme.ShatAlghorafTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                ShatAlghorafTheme {
                    AppNavigation()
                }
            }
        }
    }
}

@SuppressLint("HardwareIds")
@Composable
fun AppNavigation(auth: FirebaseAuth = Firebase.auth) {
    val currentUser by auth.authStateFlow().collectAsStateWithLifecycle(initialValue = auth.currentUser)
    val user = currentUser
    if (user == null) {
        AuthScreen(onAuthSuccess = {})
    } else {
        val uid = user.uid
        val email = user.email
        key(uid) {
            val chatViewModel: MainChatViewModel = viewModel(
                key = uid,
                factory = viewModelFactory {
                    initializer {
                        val app = checkNotNull(this[APPLICATION_KEY]) {
                            "APPLICATION_KEY missing from CreationExtras"
                        }
                        val databaseId = app.getString(R.string.firestore_database_id)
                        val db = FirebaseFirestore.getInstance(databaseId)
                        val deviceId = try {
                            Settings.Secure.getString(app.contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
                        } catch (_: Exception) {
                            ""
                        }
                        MainChatViewModel(
                            repository = ChatRepository(db, auth),
                            currentUserId = uid,
                            currentUserEmail = email,
                            deviceId = deviceId
                        )
                    }
                }
            )
            ChatRoomScreen(viewModel = chatViewModel)
        }
    }
}
