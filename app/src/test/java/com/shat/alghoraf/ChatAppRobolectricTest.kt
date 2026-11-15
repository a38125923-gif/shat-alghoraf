package com.shat.alghoraf

import android.app.Application
import android.database.sqlite.SQLiteDatabase
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import com.shat.alghoraf.data.local.ChatDatabaseHelper
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.remote.toGlobalRole
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class ChatAppRobolectricTest {

    @Test
    fun `legacy users table missing email column auto migrates and registers new user`() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val dbFile = app.getDatabasePath("shat_alghoraf.db")
        dbFile.parentFile?.mkdirs()
        SQLiteDatabase.openOrCreateDatabase(dbFile, null).use { legacyDb ->
            legacyDb.execSQL("DROP TABLE IF EXISTS users")
            legacyDb.execSQL("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL)")
            legacyDb.execSQL("INSERT INTO users (username) VALUES ('legacy_user')")
            legacyDb.version = 1
        }

        val helper = ChatDatabaseHelper(app)
        val regResult = helper.registerMember("سالم_الجديد", "salem@example.com", "pass1234")
        assertThat(regResult.isSuccess).isTrue()
        val registered = regResult.getOrThrow()
        assertThat(registered.email).isEqualTo("salem@example.com")

        val loginResult = helper.authenticateMember("salem@example.com", "pass1234")
        assertThat(loginResult.isSuccess).isTrue()
        assertThat(loginResult.getOrThrow().username).isEqualTo("سالم_الجديد")
    }

    @Test
    fun `chat ranks map consistently to firestore global roles`() {
        assertThat(ChatRank.SITE_OWNER.toGlobalRole()).isEqualTo("owner")
        assertThat(ChatRank.SUPER_OWNER.toGlobalRole()).isEqualTo("owner")
        assertThat(ChatRank.ADMIN.toGlobalRole()).isEqualTo("admin")
        assertThat(ChatRank.GENERAL_MODERATOR.toGlobalRole()).isEqualTo("moderator")
        assertThat(ChatRank.MEMBER.toGlobalRole()).isEqualTo("member")
        assertThat(ChatRank.GUEST.toGlobalRole()).isEqualTo("visitor")
    }
}
