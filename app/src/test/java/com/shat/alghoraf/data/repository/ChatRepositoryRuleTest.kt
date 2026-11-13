package com.shat.alghoraf.data.repository

import com.google.common.truth.Truth.assertThat
import com.google.firebase.firestore.FirebaseFirestoreException
import com.shat.alghoraf.base.FirestoreEmulatorTestBase
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.data.model.RoomPermissionLevel
import com.shat.alghoraf.data.model.UserRole
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.fail
import org.junit.Test

class ChatRepositoryRuleTest : FirestoreEmulatorTestBase() {

    @Test
    fun syncProfileAndSeedRooms_authenticatedUser_createsProfileAndRooms() = runBlocking {
        signInTestUser(ALICE_EMAIL)
        val user = checkNotNull(auth.currentUser)
        val repo = ChatRepository(firestore, auth)

        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.syncCurrentUserProfile(user)
            repo.seedDefaultRoomsIfMissing()
        }

        val rooms = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeRooms().first { it.any { r -> r.id == "general" } }
        }
        assertThat(rooms.map { it.id }).contains("general")

        val profiles = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observePublicProfiles().first { list -> list.any { it.userId == user.uid } }
        }
        assertThat(profiles.first { it.userId == user.uid }.globalRole).isEqualTo(UserRole.MEMBER.key)
    }

    @Test
    fun createRoomAndSendMessageAndReaction_authenticatedOwner_succeeds() = runBlocking {
        val aliceUid = signInTestUser(ALICE_EMAIL)
        val user = checkNotNull(auth.currentUser)
        val repo = ChatRepository(firestore, auth)

        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.syncCurrentUserProfile(user)
            repo.createRoom(
                name = "غرفة الاختبار",
                description = "وصف غرفة الاختبار",
                category = "عام",
                icon = "🌟",
                permissionLevel = RoomPermissionLevel.PUBLIC,
                isLocked = false,
                creatorName = "أليس"
            )
        }

        val rooms = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeRooms().first { list -> list.any { it.ownerId == aliceUid && it.name == "غرفة الاختبار" } }
        }
        val room = rooms.first { it.ownerId == aliceUid && it.name == "غرفة الاختبار" }

        val aliceProfile = PublicProfile(
            id = aliceUid,
            userId = aliceUid,
            displayName = "أليس",
            globalRole = UserRole.MEMBER.key
        )

        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.sendRoomMessage(
                roomId = room.id,
                senderProfile = aliceProfile,
                content = "أهلاً بكم جميعاً في الغرفة!"
            )
        }

        val messages = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeRoomMessages(room.id).first { it.isNotEmpty() }
        }
        assertThat(messages).hasSize(1)
        val sentMsg = messages.first()
        assertThat(sentMsg.content).isEqualTo("أهلاً بكم جميعاً في الغرفة!")

        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.toggleMessageReaction(room.id, sentMsg, "❤️")
        }

        val reacted = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeRoomMessages(room.id).first { list ->
                list.any { it.id == sentMsg.id && it.reactions.contains("❤️:$aliceUid") }
            }
        }
        assertThat(reacted.first { it.id == sentMsg.id }.reactions).contains("❤️:$aliceUid")
    }

    @Test
    fun directChat_authenticatedParticipants_exchangeMessages() = runBlocking {
        val bobUid = signInTestUser(BOB_EMAIL)
        val bobUser = checkNotNull(auth.currentUser)
        val bobRepo = ChatRepository(firestore, auth)
        withTimeout(DEFAULT_TIMEOUT_MS) { bobRepo.syncCurrentUserProfile(bobUser) }

        val aliceUid = signInTestUser(ALICE_EMAIL)
        val aliceUser = checkNotNull(auth.currentUser)
        val aliceRepo = ChatRepository(firestore, auth)
        withTimeout(DEFAULT_TIMEOUT_MS) { aliceRepo.syncCurrentUserProfile(aliceUser) }

        val aliceProfile = PublicProfile(id = aliceUid, userId = aliceUid, displayName = "أليس")
        val bobProfile = PublicProfile(id = bobUid, userId = bobUid, displayName = "بوب")

        val chatId = withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.openOrCreateDirectChat(aliceProfile, bobProfile)
        }

        withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.sendDirectMessage(
                chatId = chatId,
                participantIds = listOf(aliceUid, bobUid).sorted(),
                senderProfile = aliceProfile,
                content = "مرحباً بوب!"
            )
        }

        val dms = withTimeout(FLOW_TIMEOUT_MS) {
            aliceRepo.observeDirectMessages(chatId, aliceUid).first { it.isNotEmpty() }
        }
        assertThat(dms.first().content).isEqualTo("مرحباً بوب!")
    }

    @Test
    fun observeRooms_unauthenticatedUser_failsWithPermissionDenied() = runBlocking {
        auth.signOut()
        val repo = ChatRepository(firestore, auth)

        try {
            withTimeout(FLOW_TIMEOUT_MS) {
                repo.observeRooms().first()
            }
            fail("Expected PERMISSION_DENIED for unauthenticated user")
        } catch (e: Exception) {
            val fsException = e.unwrapFirestoreException()
            assertThat(fsException).isNotNull()
            assertThat(fsException?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)
        }
    }

    @Test
    fun setUserGlobalRole_nonGlobalAdmin_failsWithPermissionDenied() = runBlocking {
        val bobUid = signInTestUser(BOB_EMAIL)
        val bobUser = checkNotNull(auth.currentUser)
        val bobRepo = ChatRepository(firestore, auth)
        withTimeout(DEFAULT_TIMEOUT_MS) { bobRepo.syncCurrentUserProfile(bobUser) }

        signInTestUser(ALICE_EMAIL)
        val aliceUser = checkNotNull(auth.currentUser)
        val aliceRepo = ChatRepository(firestore, auth)
        withTimeout(DEFAULT_TIMEOUT_MS) { aliceRepo.syncCurrentUserProfile(aliceUser) }

        try {
            withTimeout(DEFAULT_TIMEOUT_MS) {
                aliceRepo.setUserGlobalRole(bobUid, UserRole.ADMIN)
            }
            fail("Expected PERMISSION_DENIED when non-owner tries to escalate role")
        } catch (e: Exception) {
            val fsException = e.unwrapFirestoreException()
            assertThat(fsException).isNotNull()
            assertThat(fsException?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)
        }
    }

    @Test
    fun sendRoomMessage_mutedUser_failsWithPermissionDenied() = runBlocking {
        val bobUid = signInTestUser(BOB_EMAIL)
        val aliceUid = signInTestUser(ALICE_EMAIL)
        val aliceUser = checkNotNull(auth.currentUser)
        val aliceRepo = ChatRepository(firestore, auth)

        withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.syncCurrentUserProfile(aliceUser)
            aliceRepo.createRoom(
                name = "غرفة الكتم",
                description = "اختبار الكتم",
                category = "عام",
                icon = "🔇",
                permissionLevel = RoomPermissionLevel.PUBLIC,
                isLocked = false,
                creatorName = "أليس"
            )
        }

        val room = withTimeout(FLOW_TIMEOUT_MS) {
            aliceRepo.observeRooms().first { list -> list.any { it.ownerId == aliceUid && it.name == "غرفة الكتم" } }
        }.first { it.ownerId == aliceUid && it.name == "غرفة الكتم" }

        withTimeout(DEFAULT_TIMEOUT_MS) {
            val muted = aliceRepo.toggleMuteUser(room, bobUid)
            assertThat(muted).isTrue()
        }

        signInTestUser(BOB_EMAIL)
        val bobRepo = ChatRepository(firestore, auth)
        val bobProfile = PublicProfile(id = bobUid, userId = bobUid, displayName = "بوب")

        try {
            withTimeout(DEFAULT_TIMEOUT_MS) {
                bobRepo.sendRoomMessage(room.id, bobProfile, "محاولة إرسال وأنا مكتوم")
            }
            fail("Expected PERMISSION_DENIED when muted user sends message")
        } catch (e: Exception) {
            val fsException = e.unwrapFirestoreException()
            assertThat(fsException).isNotNull()
            assertThat(fsException?.code).isEqualTo(FirebaseFirestoreException.Code.PERMISSION_DENIED)
        }
    }

    private companion object {
        const val ALICE_EMAIL = "alice_rule_test@example.com"
        const val BOB_EMAIL = "bob_rule_test@example.com"
        const val DEFAULT_TIMEOUT_MS = 10_000L
        const val FLOW_TIMEOUT_MS = 10_000L
    }
}
