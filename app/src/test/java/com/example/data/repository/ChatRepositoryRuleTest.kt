package com.example.data.repository

import com.example.base.FirestoreEmulatorTestBase
import com.example.data.model.UserRole
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class ChatRepositoryRuleTest : FirestoreEmulatorTestBase() {

  @Test
  fun createRoom_authenticatedUser_createsDocumentAndReturnsId(): Unit = runBlocking {
    signInTestUser(ALICE_EMAIL)
    val repository = ChatRepository(firestore)

    val result = withTimeout(DEFAULT_TIMEOUT_MS) {
      repository.createRoom("غرفة اختبار", "وصف تجريبي", "عام", "Alice")
    }
    assertTrue("Room creation should succeed", result.isSuccess)
    val roomId = result.getOrThrow()
    assertTrue("Room ID should not be empty", roomId.isNotEmpty())
  }

  @Test
  fun sendMessage_authenticatedMember_successfullyCreatesMessage(): Unit = runBlocking {
    signInTestUser(ALICE_EMAIL)
    val repository = ChatRepository(firestore)
    val roomId = withTimeout(DEFAULT_TIMEOUT_MS) {
      repository.createRoom("غرفة عامة", "وصف", "عام", "Alice").getOrThrow()
    }

    val msgResult = withTimeout(DEFAULT_TIMEOUT_MS) {
      repository.sendMessage(roomId, "مرحباً بكم في شات الغرف", "Alice", UserRole.OWNER)
    }
    assertTrue("Sending message should succeed", msgResult.isSuccess)
    val msgId = msgResult.getOrThrow()
    assertTrue("Message ID should not be empty", msgId.isNotEmpty())
  }

  @Test
  fun observeRooms_unauthenticatedUser_failsWithPermissionDenied(): Unit = runBlocking {
    auth.signOut()
    val repository = ChatRepository(firestore)

    var caughtException: Exception? = null
    try {
      withTimeout(FLOW_TIMEOUT_MS) {
        repository.observeRooms().first()
      }
      fail("Expected exception when unauthenticated")
    } catch (e: Exception) {
      caughtException = e
    }

    assertNotNull("Should catch exception", caughtException)
    val firestoreException = caughtException?.unwrapFirestoreException()
    assertNotNull("Expected nested FirebaseFirestoreException", firestoreException)
    assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, firestoreException?.code)
  }

  private companion object {
    const val ALICE_EMAIL = "alice@example.com"
    const val BOB_EMAIL = "bob@example.com"
    const val DEFAULT_TIMEOUT_MS = 5000L
    const val FLOW_TIMEOUT_MS = 3000L
  }
}
