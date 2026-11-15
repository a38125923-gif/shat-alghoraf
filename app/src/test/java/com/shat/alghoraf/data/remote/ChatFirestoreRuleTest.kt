package com.shat.alghoraf.data.remote

import com.google.common.truth.Truth.assertThat
import com.google.firebase.firestore.FirebaseFirestoreException
import com.shat.alghoraf.base.FirestoreEmulatorTestBase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeout
import org.junit.Test
import java.util.UUID

class ChatFirestoreRuleTest : FirestoreEmulatorTestBase() {

    @Test
    fun authenticatedMember_profileRoomsMessagesAndWall_roundTripSucceeds() = runBlocking {
        val uid = signInTestUser("alice_${UUID.randomUUID().toString().take(6)}@test.com")
        val repo = FirestoreChatRepository(firestore)

        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.seedDefaultRoomsIfNeeded()
        }
        val user = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.ensureUserProfiles(
                uid = uid,
                email = auth.currentUser?.email ?: "",
                displayName = "أليس العربية",
                photoUrl = null,
                emailVerified = false
            ).getOrThrow()
        }
        assertThat(user.userKey).isEqualTo(uid)

        val rooms = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeActiveRooms().first { it.any { room -> room.id == "general" } }
        }
        assertThat(rooms.map { it.id }).contains("general")

        val uniqueText = "رسالة اختبار ${UUID.randomUUID().toString().take(6)}"
        val msgId = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.sendRoomMessage("general", user, uniqueText).getOrThrow()
        }
        val messages = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeRoomMessages("general").first { list -> list.any { it.id == msgId } }
        }
        assertThat(messages.first { it.id == msgId }.content).isEqualTo(uniqueText)

        val postId = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.publishWallPost(user, "منشور حائط تجريبي").getOrThrow()
        }
        val posts = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeWallPosts().first { list -> list.any { it.id == postId } }
        }
        assertThat(posts.map { it.id }).contains(postId)
    }

    @Test
    fun crossUserIsolation_privateUserDocAndReportsAndDirectChats_rejectedWithPermissionDenied() = runBlocking {
        val aliceUid = signInTestUser("alice_priv_${UUID.randomUUID().toString().take(6)}@test.com")
        val aliceEmail = auth.currentUser?.email ?: ""
        val aliceRepo = FirestoreChatRepository(firestore)

        val alice = withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.ensureUserProfiles(aliceUid, aliceEmail, "أليس", null, false).getOrThrow()
        }
        val reportId = withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.submitReport(aliceUid, "أليس", "مخالف", "إزعاج متكرر").getOrThrow()
        }

        val bobUid = signInTestUser("bob_priv_${UUID.randomUUID().toString().take(6)}@test.com")
        val bobEmail = auth.currentUser?.email ?: ""
        val bobRepo = FirestoreChatRepository(firestore)
        val bob = withTimeout(DEFAULT_TIMEOUT_MS) {
            bobRepo.ensureUserProfiles(bobUid, bobEmail, "باسم", null, false).getOrThrow()
        }
        withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo // keep reference unused cleanly
            bobRepo.sendDirectMessage(bob, alice, "رسالة خاصة سرية").getOrThrow()
        }

        val charlieUid = signInTestUser("charlie_out_${UUID.randomUUID().toString().take(6)}@test.com")
        withTimeout(DEFAULT_TIMEOUT_MS) {
            bobRepo.ensureUserProfiles(charlieUid, auth.currentUser?.email ?: "", "تشارلي", null, false).getOrThrow()
        }

        // Charlie cannot read Alice's private PII doc
        val piiEx = runCatching {
            withTimeout(DEFAULT_TIMEOUT_MS) {
                firestore.collection("users").document(aliceUid).get().await()
            }
        }.exceptionOrNull()?.unwrapFirestoreException()
        assertThat(piiEx?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)

        // Charlie cannot read Alice's report
        val reportEx = runCatching {
            withTimeout(DEFAULT_TIMEOUT_MS) {
                firestore.collection("reports").document(reportId).get().await()
            }
        }.exceptionOrNull()?.unwrapFirestoreException()
        assertThat(reportEx?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)

        // Charlie cannot read Alice-Bob direct chat
        val dmId = FirestoreChatRepository.directChatId(aliceUid, bobUid)
        val dmEx = runCatching {
            withTimeout(DEFAULT_TIMEOUT_MS) {
                firestore.collection("direct_chats").document(dmId).get().await()
            }
        }.exceptionOrNull()?.unwrapFirestoreException()
        assertThat(dmEx?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)
    }

    @Test
    fun unauthenticatedUser_observeStreams_failWithPermissionDenied() = runBlocking {
        auth.signOut()
        val repo = FirestoreChatRepository(firestore)

        val err = runCatching {
            withTimeout(FLOW_TIMEOUT_MS) { repo.observeActiveRooms().first() }
        }.exceptionOrNull()
        val fsErr = checkNotNull(err?.unwrapFirestoreException()) {
            "Expected FirebaseFirestoreException for unauthenticated stream, got $err"
        }
        assertThat(fsErr.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)
    }

    private companion object {
        const val DEFAULT_TIMEOUT_MS = 5000L
        const val FLOW_TIMEOUT_MS = 3500L
    }
}
