package com.shat.alghoraf.data.remote

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth
import com.shat.alghoraf.R
import com.shat.alghoraf.ui.theme.CodyColors
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

fun FirebaseAuth.authStateFlow(): Flow<FirebaseUser?> = callbackFlow {
    val listener = FirebaseAuth.AuthStateListener { auth ->
        trySend(auth.currentUser)
    }
    addAuthStateListener(listener)
    awaitClose { removeAuthStateListener(listener) }
}

sealed interface GoogleSignInOutcome {
    data class Success(val user: FirebaseUser) : GoogleSignInOutcome
    data object Cancelled : GoogleSignInOutcome
    data object NoSavedCredential : GoogleSignInOutcome
    data class Error(val message: String) : GoogleSignInOutcome
}

object GoogleAuthHelper {
    private const val TAG = "GoogleAuthHelper"

    suspend fun attemptAutoSignIn(context: Context): GoogleSignInOutcome {
        if (Firebase.auth.currentUser != null) {
            return GoogleSignInOutcome.Success(Firebase.auth.currentUser!!)
        }
        return try {
            val webClientId = context.getString(R.string.default_web_client_id)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(true)
                .setServerClientId(webClientId)
                .setAutoSelectEnabled(true)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val credentialManager = CredentialManager.create(context)
            val result = credentialManager.getCredential(context = context, request = request)
            val credential = result.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val firebaseCred = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                val authResult = Firebase.auth.signInWithCredential(firebaseCred).await()
                val user = authResult.user
                    ?: return GoogleSignInOutcome.Error("تعذر إتمام المصادقة مع Firebase")
                GoogleSignInOutcome.Success(user)
            } else {
                GoogleSignInOutcome.NoSavedCredential
            }
        } catch (e: CancellationException) {
            throw e
        } catch (unused: NoCredentialException) {
            GoogleSignInOutcome.NoSavedCredential
        } catch (unused: GetCredentialCancellationException) {
            GoogleSignInOutcome.Cancelled
        } catch (e: Exception) {
            Log.d(TAG, "Silent auto sign-in skipped: ${e.message}")
            GoogleSignInOutcome.NoSavedCredential
        }
    }

    suspend fun onGoogleSignInClicked(context: Context): GoogleSignInOutcome {
        return try {
            val webClientId = context.getString(R.string.default_web_client_id)
            val signInOption = GetSignInWithGoogleOption.Builder(webClientId).build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInOption)
                .build()

            val credentialManager = CredentialManager.create(context)
            val result = credentialManager.getCredential(context = context, request = request)
            val credential = result.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val firebaseCred = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                val authResult = Firebase.auth.signInWithCredential(firebaseCred).await()
                val user = authResult.user
                    ?: return GoogleSignInOutcome.Error("فشل تسجيل الدخول عبر Firebase")
                GoogleSignInOutcome.Success(user)
            } else {
                GoogleSignInOutcome.Error("نوع بيانات الاعتماد غير مدعوم")
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: GetCredentialCancellationException) {
            Log.w(TAG, "Interactive Google sign-in cancelled or credential unavailable", e)
            GoogleSignInOutcome.Cancelled
        } catch (e: Exception) {
            Log.e(TAG, "Google sign-in error", e)
            GoogleSignInOutcome.Error(
                e.localizedMessage ?: "تعذر تسجيل الدخول بحساب Google. تأكد من الاتصال بالإنترنت وإعدادات الحساب."
            )
        }
    }

    suspend fun signOut(context: Context) {
        Firebase.auth.signOut()
        runCatching {
            CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
        }
    }
}

@Composable
fun GoogleSignInButton(
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        enabled = !isLoading,
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(
            containerColor = CodyColors.RoyalBlue,
            contentColor = Color.White,
            disabledContainerColor = CodyColors.RoyalBlue.copy(alpha = 0.6f),
            disabledContentColor = Color.White
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .testTag("btn_google_sign_in")
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                strokeWidth = 2.5.dp,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = stringResource(R.string.signing_in),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        } else {
            Icon(
                imageVector = Icons.Rounded.AccountCircle,
                contentDescription = stringResource(R.string.sign_in_with_google),
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = stringResource(R.string.sign_in_with_google),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
