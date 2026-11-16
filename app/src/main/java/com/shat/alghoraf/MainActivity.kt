package com.shat.alghoraf

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.shat.alghoraf.data.model.ChatThemeOption
import com.shat.alghoraf.data.remote.FirestoreChatRepository
import com.shat.alghoraf.data.remote.GoogleAuthHelper
import com.shat.alghoraf.data.remote.GoogleSignInOutcome
import com.shat.alghoraf.data.remote.authStateFlow
import com.shat.alghoraf.data.remote.configureAppCheck
import com.shat.alghoraf.ui.screens.CodyChatScreen
import com.shat.alghoraf.ui.screens.WelcomeScreen
import com.shat.alghoraf.ui.theme.CodyColors
import com.shat.alghoraf.ui.theme.ShatAlGhorafTheme
import com.shat.alghoraf.ui.viewmodel.ChatViewModel
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureAppCheck(this, intent)
        enableEdgeToEdge()
        setContent {
            ShatAlGhorafTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    val context = LocalContext.current
                    val scope = rememberCoroutineScope()
                    val firebaseAuth = remember { Firebase.auth }
                    val currentFirebaseUser by firebaseAuth.authStateFlow()
                        .collectAsStateWithLifecycle(initialValue = firebaseAuth.currentUser)

                    var isSigningIn by remember { mutableStateOf(false) }
                    var authError by remember { mutableStateOf<String?>(null) }

                    // Attempt silent Google Auto-Sign-In on cold launch when signed out
                    LaunchedEffect(Unit) {
                        if (firebaseAuth.currentUser == null) {
                            when (val outcome = GoogleAuthHelper.attemptAutoSignIn(context)) {
                                is GoogleSignInOutcome.Error -> authError = outcome.message
                                else -> Unit
                            }
                        }
                    }

                    Surface(modifier = Modifier.fillMaxSize()) {
                        val user = currentFirebaseUser
                        if (user == null) {
                            WelcomeScreen(
                                isSigningIn = isSigningIn,
                                authError = authError,
                                onClearError = { authError = null },
                                onGoogleSignInClicked = {
                                    scope.launch {
                                        isSigningIn = true
                                        authError = null
                                        when (val outcome = GoogleAuthHelper.onGoogleSignInClicked(context)) {
                                            is GoogleSignInOutcome.Error -> authError = outcome.message
                                            GoogleSignInOutcome.Cancelled,
                                            GoogleSignInOutcome.NoSavedCredential,
                                            is GoogleSignInOutcome.Success -> Unit
                                        }
                                        isSigningIn = false
                                    }
                                }
                            )
                        } else {
                            AuthenticatedChatShell(
                                firebaseUser = user,
                                onSignOut = {
                                    scope.launch {
                                        GoogleAuthHelper.signOut(context)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthenticatedChatShell(
    firebaseUser: FirebaseUser,
    onSignOut: () -> Unit
) {
    val context = LocalContext.current
    val viewModel: ChatViewModel = viewModel(
        key = firebaseUser.uid,
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY]) {
                    "APPLICATION_KEY missing from CreationExtras"
                }
                val prefs = app.getSharedPreferences("shat_prefs", Context.MODE_PRIVATE)
                val databaseId = app.getString(R.string.firestore_database_id)
                val db = FirebaseFirestore.getInstance(databaseId)
                val repository = FirestoreChatRepository(db)
                ChatViewModel(
                    repository = repository,
                    currentUserId = firebaseUser.uid,
                    currentUserEmail = firebaseUser.email ?: "",
                    currentUserDisplayName = firebaseUser.displayName ?: "عضو جديد",
                    currentUserPhotoUrl = firebaseUser.photoUrl?.toString(),
                    currentUserEmailVerified = firebaseUser.isEmailVerified,
                    initialRoomId = prefs.getString("active_room_id", "general") ?: "general",
                    initialTheme = ChatThemeOption.fromId(
                        prefs.getString("chat_theme", ChatThemeOption.WARM_PEACH.id)
                    ),
                    onSaveRoomId = { roomId ->
                        prefs.edit().putString("active_room_id", roomId).apply()
                    },
                    onSaveTheme = { theme ->
                        prefs.edit().putString("chat_theme", theme.id).apply()
                    },
                    onSignOutRequested = onSignOut
                )
            }
        }
    )

    val state by viewModel.uiState.collectAsStateWithLifecycle()

    var pickedProfileAvatarUri by remember { mutableStateOf<String?>(null) }
    var pendingAudioAction by remember { mutableStateOf<(() -> Unit)?>(null) }

    val profilePhotoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
            pickedProfileAvatarUri = uri.toString()
        }
    }

    val chatPhotoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
            viewModel.sendTextMessage("", imageUri = uri.toString())
        }
    }

    val audioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        val action = pendingAudioAction
        pendingAudioAction = null
        if (granted) {
            action?.invoke()
        } else {
            viewModel.showToast("يرجى السماح بصلاحية الميكروفون لتسجيل الرسائل الصوتية")
        }
    }

    when {
        state.isLoadingProfile && state.currentUser == null -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(color = CodyColors.RoyalBlue)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "جاري مزامنة حسابك وغرف الدردشة عبر Firebase...",
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center
                )
            }
        }

        state.currentUser == null -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = state.authError ?: "تعذر تحميل بيانات الحساب",
                    style = MaterialTheme.typography.titleMedium,
                    color = CodyColors.AuthRed,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onSignOut) {
                    Text("العودة لشاشة الدخول")
                }
            }
        }

        state.currentUser?.isBanned == true -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "⛔ تم حظر هذا الحساب من دخول شات الغرف",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = CodyColors.AuthRed,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = state.currentUser?.banReason?.ifBlank { "مخالفة قوانين الموقع" } ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onSignOut) {
                    Text("تسجيل الخروج")
                }
            }
        }

        else -> {
            CodyChatScreen(
                state = state,
                viewModel = viewModel,
                pickedProfileAvatarUri = pickedProfileAvatarUri,
                onClearPickedProfileAvatar = { pickedProfileAvatarUri = null },
                onRequestProfileAvatarPick = {
                    profilePhotoPicker.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                },
                onRequestChatImagePick = {
                    chatPhotoPicker.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                },
                onEnsureAudioPermission = { onGranted ->
                    val hasPerm = ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                    if (hasPerm) {
                        onGranted()
                    } else {
                        pendingAudioAction = onGranted
                        audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }
            )
        }
    }
}
