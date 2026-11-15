package com.shat.alghoraf.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.shat.alghoraf.data.model.AvatarFrame
import com.shat.alghoraf.data.model.ChatMessage
import com.shat.alghoraf.data.model.ChatNotification
import com.shat.alghoraf.data.model.ChatRank
import com.shat.alghoraf.data.model.ChatRoom
import com.shat.alghoraf.data.model.ChatUser
import com.shat.alghoraf.data.model.NameplateStyle
import com.shat.alghoraf.data.model.PrivateMessage
import com.shat.alghoraf.data.model.UserReport
import com.shat.alghoraf.data.model.WallPost
import java.security.MessageDigest
import java.util.UUID

class ChatDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        ensureSchema(db)
        seedIfEmpty(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        ensureSchema(db)
        seedIfEmpty(db)
    }

    override fun onOpen(db: SQLiteDatabase) {
        super.onOpen(db)
        if (!db.isReadOnly) {
            ensureSchema(db)
            seedIfEmpty(db)
        }
    }

    fun ensureSchema(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_key TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                email TEXT DEFAULT '',
                password_hash TEXT DEFAULT '',
                gender TEXT DEFAULT 'ذكر',
                rank_id TEXT NOT NULL DEFAULT 'member',
                bio TEXT DEFAULT '',
                avatar_uri TEXT DEFAULT '',
                avatar_emoji TEXT DEFAULT '😎',
                avatar_frame TEXT DEFAULT 'none',
                nameplate_style TEXT DEFAULT 'default',
                coins INTEGER DEFAULT 1500,
                vip_family TEXT DEFAULT '',
                is_muted INTEGER DEFAULT 0,
                mute_reason TEXT DEFAULT '',
                is_banned INTEGER DEFAULT 0,
                ban_reason TEXT DEFAULT '',
                is_online INTEGER DEFAULT 1,
                join_date INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'عام',
                icon_emoji TEXT DEFAULT '💬',
                mics_enabled INTEGER DEFAULT 1,
                created_by TEXT DEFAULT 'system',
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                sender_key TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                sender_rank TEXT NOT NULL DEFAULT 'member',
                sender_avatar_uri TEXT DEFAULT '',
                sender_avatar_emoji TEXT DEFAULT '💬',
                sender_frame TEXT DEFAULT 'none',
                sender_nameplate TEXT DEFAULT 'default',
                content TEXT NOT NULL,
                image_uri TEXT DEFAULT '',
                voice_sec INTEGER DEFAULT 0,
                is_announcement INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS private_messages (
                id TEXT PRIMARY KEY,
                from_key TEXT NOT NULL,
                from_name TEXT NOT NULL,
                from_emoji TEXT DEFAULT '',
                to_key TEXT NOT NULL,
                to_name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS wall_posts (
                id TEXT PRIMARY KEY,
                author_key TEXT NOT NULL,
                author_name TEXT NOT NULL,
                author_rank TEXT NOT NULL DEFAULT 'member',
                author_emoji TEXT DEFAULT '😎',
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                reporter_name TEXT NOT NULL,
                target_name TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'قيد المراجعة',
                created_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )

        // Automatically add any missing columns on legacy SQLite tables
        ensureColumn(db, "users", "user_key", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "username", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "display_name", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "email", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "password_hash", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "gender", "TEXT DEFAULT 'ذكر'")
        ensureColumn(db, "users", "rank_id", "TEXT DEFAULT 'member'")
        ensureColumn(db, "users", "bio", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "avatar_uri", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "avatar_emoji", "TEXT DEFAULT '😎'")
        ensureColumn(db, "users", "avatar_frame", "TEXT DEFAULT 'none'")
        ensureColumn(db, "users", "nameplate_style", "TEXT DEFAULT 'default'")
        ensureColumn(db, "users", "coins", "INTEGER DEFAULT 1500")
        ensureColumn(db, "users", "vip_family", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "is_muted", "INTEGER DEFAULT 0")
        ensureColumn(db, "users", "mute_reason", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "is_banned", "INTEGER DEFAULT 0")
        ensureColumn(db, "users", "ban_reason", "TEXT DEFAULT ''")
        ensureColumn(db, "users", "is_online", "INTEGER DEFAULT 1")
        ensureColumn(db, "users", "join_date", "INTEGER DEFAULT 0")

        // Backfill user_key if legacy table lacked it
        db.execSQL("UPDATE users SET user_key = 'user:' || rowid WHERE user_key IS NULL OR user_key = ''")
        db.execSQL("UPDATE users SET rank_id = 'member' WHERE rank_id IS NULL OR rank_id = ''")
        db.execSQL("UPDATE users SET join_date = ? WHERE join_date IS NULL OR join_date = 0", arrayOf(System.currentTimeMillis()))

        ensureColumn(db, "rooms", "description", "TEXT DEFAULT ''")
        ensureColumn(db, "rooms", "category", "TEXT DEFAULT 'عام'")
        ensureColumn(db, "rooms", "icon_emoji", "TEXT DEFAULT '💬'")
        ensureColumn(db, "rooms", "mics_enabled", "INTEGER DEFAULT 1")
        ensureColumn(db, "rooms", "created_by", "TEXT DEFAULT 'system'")
        ensureColumn(db, "rooms", "created_at", "INTEGER DEFAULT 0")

        ensureColumn(db, "messages", "sender_rank", "TEXT DEFAULT 'member'")
        ensureColumn(db, "messages", "sender_avatar_uri", "TEXT DEFAULT ''")
        ensureColumn(db, "messages", "sender_avatar_emoji", "TEXT DEFAULT '💬'")
        ensureColumn(db, "messages", "sender_frame", "TEXT DEFAULT 'none'")
        ensureColumn(db, "messages", "sender_nameplate", "TEXT DEFAULT 'default'")
        ensureColumn(db, "messages", "image_uri", "TEXT DEFAULT ''")
        ensureColumn(db, "messages", "voice_sec", "INTEGER DEFAULT 0")
        ensureColumn(db, "messages", "is_announcement", "INTEGER DEFAULT 0")
    }

    private fun ensureColumn(db: SQLiteDatabase, table: String, column: String, columnDef: String) {
        val existing = mutableSetOf<String>()
        db.rawQuery("PRAGMA table_info($table)", null).use { c ->
            val nameIdx = c.getColumnIndex("name")
            while (c.moveToNext()) {
                if (nameIdx >= 0) existing.add(c.getString(nameIdx).lowercase())
            }
        }
        if (!existing.contains(column.lowercase())) {
            db.execSQL("ALTER TABLE $table ADD COLUMN $column $columnDef")
        }
    }

    private fun seedIfEmpty(db: SQLiteDatabase) {
        val usersEmpty = db.rawQuery("SELECT COUNT(*) FROM users", null).use { c ->
            c.moveToFirst() && c.getInt(0) == 0
        }
        val now = System.currentTimeMillis()
        if (usersEmpty) {
            val ownerCv = ContentValues().apply {
                put("user_key", "user:owner_main")
                put("username", "مالك الشات")
                put("display_name", "👑 مالك شات الغرف")
                put("email", OWNER_EMAIL)
                put("password_hash", hashPassword(OWNER_PIN))
                put("gender", "ذكر")
                put("rank_id", ChatRank.SITE_OWNER.id)
                put("bio", "صاحب ومؤسس شات الغرف المباشر")
                put("avatar_uri", "")
                put("avatar_emoji", "👑")
                put("avatar_frame", AvatarFrame.GOLD_ROYAL.id)
                put("nameplate_style", NameplateStyle.CRIMSON_ROYAL.id)
                put("coins", 99999)
                put("vip_family", "ملوك الموقع")
                put("is_online", 1)
                put("join_date", now - 86_400_000L * 30)
            }
            db.insert("users", null, ownerCv)

            val seedMembers = listOf(
                Triple("user:super_owner_1", "سلطان_الذهب", ChatRank.SUPER_OWNER) to Pair("💎", 45800),
                Triple("user:owner_2", "البرنس_ماجد", ChatRank.OWNER) to Pair("⭐", 28500),
                Triple("user:super_admin_1", "حارس_القمة", ChatRank.SUPER_ADMIN) to Pair("🛡️", 18400),
                Triple("user:admin_1", "نور_العرب", ChatRank.ADMIN) to Pair("🔰", 12200),
                Triple("user:mod_1", "أبو_فهد", ChatRank.GENERAL_MODERATOR) to Pair("🎖️", 7600),
                Triple("user:vip_1", "أميرة_الليل", ChatRank.ROYAL_VIP) to Pair("⚜️", 15900),
                Triple("user:silver_1", "فارس_الصحراء", ChatRank.SILVER_VIP) to Pair("🥈", 4300)
            )
            seedMembers.forEachIndexed { idx, (triple, extras) ->
                val (key, uname, rank) = triple
                val (emoji, coins) = extras
                val cv = ContentValues().apply {
                    put("user_key", key)
                    put("username", uname)
                    put("display_name", uname.replace("_", " "))
                    put("email", "$key@shat.local")
                    put("password_hash", hashPassword("123456"))
                    put("gender", if (idx == 5) "أنثى" else "ذكر")
                    put("rank_id", rank.id)
                    put("bio", "عضو مميز برتبة ${rank.arabicLabel}")
                    put("avatar_uri", "")
                    put("avatar_emoji", emoji)
                    put("avatar_frame", if (rank.power >= 70) AvatarFrame.GOLD_ROYAL.id else AvatarFrame.EMERALD_CROWN.id)
                    put("nameplate_style", if (rank.power >= 80) NameplateStyle.GOLD_BAR.id else NameplateStyle.DEFAULT.id)
                    put("coins", coins)
                    put("vip_family", if (rank.power >= 80) "عائلة الملوك" else "عائلة النخبة")
                    put("is_online", 1)
                    put("join_date", now - 86_400_000L * (20 - idx))
                }
                db.insert("users", null, cv)
            }
        }

        val roomsEmpty = db.rawQuery("SELECT COUNT(*) FROM rooms", null).use { c ->
            c.moveToFirst() && c.getInt(0) == 0
        }
        if (roomsEmpty) {
            val rooms = listOf(
                Triple("general", "الغرفة العامة", "التجمع الرئيسي للدردشة والتعارف اليومي") to Pair("💬", "عام"),
                Triple("competitions", "غرفة المسابقات", "تحديات يومية، فوازير، وجوائز نقاط VIP") to Pair("🏆", "مسابقات"),
                Triple("tech", "التقنية والألعاب", "نقاشات البرمجة، التطبيقات، والألعاب الجماعية") to Pair("🎮", "تقنية")
            )
            rooms.forEach { (t, extra) ->
                val cv = ContentValues().apply {
                    put("id", t.first)
                    put("name", t.second)
                    put("description", t.third)
                    put("icon_emoji", extra.first)
                    put("category", extra.second)
                    put("mics_enabled", 1)
                    put("created_by", "user:owner_main")
                    put("created_at", now)
                }
                db.insert("rooms", null, cv)
            }
        }

        val messagesEmpty = db.rawQuery("SELECT COUNT(*) FROM messages", null).use { c ->
            c.moveToFirst() && c.getInt(0) == 0
        }
        if (messagesEmpty) {
            val welcomeMessages = listOf(
                Triple("msg_1", "general", "مرحباً بالجميع في شات الغرف المباشر 👑 التزموا بالاحترام المتبادل واستمتعوا بالمايكات الصوتية والرتب الملكية!") to true,
                Triple("msg_2", "general", "أهلاً وسهلاً بالأعضاء والزوار الكرام 🌟 الغرفة منورة بوجودكم") to false,
                Triple("msg_3", "competitions", "مسابقة الليلة تبدأ بعد قليل على 500 نقطة ذهبية 🏆") to true,
                Triple("msg_4", "tech", "شاركنا أفضل لعبة أو تطبيق تستخدمه هذا الأسبوع 🎮") to false
            )
            welcomeMessages.forEachIndexed { idx, (pair, isAnn) ->
                val (id, roomId, text) = pair
                val cv = ContentValues().apply {
                    put("id", id)
                    put("room_id", roomId)
                    put("sender_key", if (idx % 2 == 0) "user:owner_main" else "user:super_owner_1")
                    put("sender_name", if (idx % 2 == 0) "👑 مالك شات الغرف" else "سلطان الذهب")
                    put("sender_rank", if (idx % 2 == 0) ChatRank.SITE_OWNER.id else ChatRank.SUPER_OWNER.id)
                    put("sender_avatar_uri", "")
                    put("sender_avatar_emoji", if (idx % 2 == 0) "👑" else "💎")
                    put("sender_frame", AvatarFrame.GOLD_ROYAL.id)
                    put("sender_nameplate", if (idx % 2 == 0) NameplateStyle.CRIMSON_ROYAL.id else NameplateStyle.GOLD_BAR.id)
                    put("content", text)
                    put("image_uri", "")
                    put("voice_sec", 0)
                    put("is_announcement", if (isAnn) 1 else 0)
                    put("created_at", now - (4 - idx) * 60_000L)
                }
                db.insert("messages", null, cv)
            }
        }

        val wallEmpty = db.rawQuery("SELECT COUNT(*) FROM wall_posts", null).use { c ->
            c.moveToFirst() && c.getInt(0) == 0
        }
        if (wallEmpty) {
            val wallCv = ContentValues().apply {
                put("id", "wall_1")
                put("author_key", "user:owner_main")
                put("author_name", "👑 مالك شات الغرف")
                put("author_rank", ChatRank.SITE_OWNER.id)
                put("author_emoji", "👑")
                put("content", "تم تفعيل نظام الرتب الثمانية والإطارات الملكية الجديدة! تفاعلوا في الغرف لكسب النقاط 💎")
                put("likes", 14)
                put("created_at", now - 300_000L)
            }
            db.insert("wall_posts", null, wallCv)
        }

        val notifEmpty = db.rawQuery("SELECT COUNT(*) FROM notifications", null).use { c ->
            c.moveToFirst() && c.getInt(0) == 0
        }
        if (notifEmpty) {
            val notifCv = ContentValues().apply {
                put("id", "notif_1")
                put("title", "أهلاً بك في شات الغرف")
                put("body", "حصلت على 1500 نقطة ترحيبية يمكنك استخدامها في متجر الإطارات والزخارف!")
                put("is_read", 0)
                put("created_at", now)
            }
            db.insert("notifications", null, notifCv)
        }
    }

    fun getAllUsers(): List<ChatUser> {
        val list = mutableListOf<ChatUser>()
        readableDatabase.rawQuery("SELECT * FROM users ORDER BY join_date ASC", null).use { c ->
            while (c.moveToNext()) {
                list.add(readUser(c))
            }
        }
        return list.sortedByDescending { it.rank.power }
    }

    fun getUserByKey(userKey: String): ChatUser? {
        readableDatabase.rawQuery("SELECT * FROM users WHERE user_key = ? LIMIT 1", arrayOf(userKey)).use { c ->
            return if (c.moveToFirst()) readUser(c) else null
        }
    }

    fun authenticateMember(identifier: String, password: String): Result<ChatUser> {
        val cleanId = identifier.trim()
        if (cleanId == OWNER_PIN || (cleanId.equals(OWNER_EMAIL, ignoreCase = true) && password == OWNER_PIN)) {
            val owner = getUserByKey("user:owner_main")
            if (owner != null) return Result.success(owner)
        }
        return runCatching {
            val db = writableDatabase
            ensureSchema(db)
            db.rawQuery(
                "SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1",
                arrayOf(cleanId, cleanId)
            ).use { c ->
                if (!c.moveToFirst()) {
                    throw IllegalArgumentException("اسم المستخدم أو البريد الإلكتروني غير مسجل")
                }
                val user = readUser(c)
                if (user.isBanned) {
                    val reason = user.banReason.ifBlank { "مخالفة قوانين الدردشة" }
                    throw IllegalStateException("تم حظر هذا الحساب نهائياً: $reason")
                }
                val hashIdx = c.getColumnIndex("password_hash")
                val storedHash = if (hashIdx >= 0) c.getString(hashIdx).orEmpty() else ""
                val matches = storedHash == hashPassword(password) ||
                    (user.email.equals(OWNER_EMAIL, ignoreCase = true) && password == OWNER_PIN)
                if (!matches) {
                    throw IllegalArgumentException("كلمة المرور غير صحيحة")
                }
                setOnline(user.userKey, true)
                user.copy(isOnline = true)
            }
        }
    }

    fun registerMember(username: String, email: String, password: String): Result<ChatUser> {
        val cleanName = username.trim()
        val cleanEmail = email.trim().lowercase()
        if (cleanName.length < 2) return Result.failure(IllegalArgumentException("اسم المستخدم قصير جداً"))
        if (!cleanEmail.contains("@")) return Result.failure(IllegalArgumentException("يرجى إدخال بريد إلكتروني صحيح"))
        if (password.length < 4) return Result.failure(IllegalArgumentException("كلمة المرور يجب أن تكون 4 أحرف على الأقل"))

        return runCatching {
            val db = writableDatabase
            ensureSchema(db)

            db.rawQuery(
                "SELECT user_key FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1",
                arrayOf(cleanName, cleanEmail)
            ).use { c ->
                if (c.moveToFirst()) {
                    throw IllegalArgumentException("اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل")
                }
            }

            val isOwnerEmail = cleanEmail == OWNER_EMAIL
            val hasOwner = hasAnyOwner(db)
            val assignedRank = if (isOwnerEmail || !hasOwner) ChatRank.SITE_OWNER else ChatRank.MEMBER
            val now = System.currentTimeMillis()
            val userKey = "user:${UUID.randomUUID().toString().take(8)}"

            val cv = ContentValues().apply {
                put("user_key", userKey)
                put("username", cleanName)
                put("display_name", cleanName)
                put("email", cleanEmail)
                put("password_hash", hashPassword(password))
                put("gender", "ذكر")
                put("rank_id", assignedRank.id)
                put("bio", "عضو جديد في شات الغرف")
                put("avatar_uri", "")
                put("avatar_emoji", if (assignedRank == ChatRank.SITE_OWNER) "👑" else "😎")
                put("avatar_frame", if (assignedRank == ChatRank.SITE_OWNER) AvatarFrame.GOLD_ROYAL.id else AvatarFrame.NONE.id)
                put("nameplate_style", if (assignedRank == ChatRank.SITE_OWNER) NameplateStyle.CRIMSON_ROYAL.id else NameplateStyle.DEFAULT.id)
                put("coins", if (assignedRank == ChatRank.SITE_OWNER) 50000 else 1500)
                put("vip_family", "")
                put("is_online", 1)
                put("join_date", now)
            }
            val rowId = db.insertOrThrow("users", null, cv)
            if (rowId < 0) {
                throw IllegalStateException("تعذر حفظ الحساب في قاعدة البيانات")
            }
            getUserByKey(userKey) ?: throw IllegalStateException("تعذر قراءة بيانات الحساب بعد التسجيل")
        }
    }

    fun enterAsGuest(nickname: String, gender: String): Result<ChatUser> {
        val cleanName = nickname.trim()
        if (cleanName.length < 2) return Result.failure(IllegalArgumentException("يرجى كتابة اسم مستعار لا يقل عن حرفين"))

        return runCatching {
            val db = writableDatabase
            ensureSchema(db)

            db.rawQuery(
                "SELECT ban_reason FROM users WHERE LOWER(display_name) = LOWER(?) AND is_banned = 1 LIMIT 1",
                arrayOf(cleanName)
            ).use { c ->
                if (c.moveToFirst()) {
                    val reason = c.getString(0).orEmpty().ifBlank { "مخالفة قوانين الشات" }
                    throw IllegalStateException("أنت محظور من الدخول: $reason")
                }
            }

            val guestKey = "guest:${cleanName.lowercase().replace(" ", "_")}"
            val existing = getUserByKey(guestKey)
            if (existing != null) {
                if (existing.isBanned) {
                    throw IllegalStateException("هذا الحساب محظور: ${existing.banReason}")
                }
                setOnline(guestKey, true)
                return@runCatching existing.copy(isOnline = true, gender = gender)
            }

            val cv = ContentValues().apply {
                put("user_key", guestKey)
                put("username", cleanName)
                put("display_name", cleanName)
                put("email", "")
                put("password_hash", "")
                put("gender", gender)
                put("rank_id", ChatRank.GUEST.id)
                put("bio", "زائر جديد في شات الغرف")
                put("avatar_uri", "")
                put("avatar_emoji", if (gender == "أنثى") "🌸" else "🧭")
                put("avatar_frame", AvatarFrame.NONE.id)
                put("nameplate_style", NameplateStyle.DEFAULT.id)
                put("coins", 500)
                put("vip_family", "")
                put("is_online", 1)
                put("join_date", System.currentTimeMillis())
            }
            db.insertOrThrow("users", null, cv)
            getUserByKey(guestKey)!!
        }
    }

    fun updateUserProfile(
        userKey: String,
        displayName: String,
        bio: String,
        avatarUri: String,
        vipFamily: String
    ): ChatUser? {
        val cv = ContentValues().apply {
            put("display_name", displayName.trim())
            put("bio", bio.trim())
            put("avatar_uri", avatarUri)
            put("vip_family", vipFamily.trim())
        }
        writableDatabase.update("users", cv, "user_key = ?", arrayOf(userKey))
        return getUserByKey(userKey)
    }

    fun updateUserAppearance(userKey: String, frame: AvatarFrame, nameplate: NameplateStyle, newCoins: Int): ChatUser? {
        val cv = ContentValues().apply {
            put("avatar_frame", frame.id)
            put("nameplate_style", nameplate.id)
            put("coins", newCoins)
        }
        writableDatabase.update("users", cv, "user_key = ?", arrayOf(userKey))
        return getUserByKey(userKey)
    }

    fun upgradeGuestToMember(
        guestKey: String,
        username: String,
        email: String,
        password: String
    ): Result<ChatUser> {
        val cleanName = username.trim()
        val cleanEmail = email.trim().lowercase()
        if (cleanName.length < 2) return Result.failure(IllegalArgumentException("يجب أن يكون الاسم حرفين على الأقل"))
        if (!cleanEmail.contains("@")) return Result.failure(IllegalArgumentException("يرجى إدخال بريد إلكتروني صحيح"))
        if (password.length < 4) return Result.failure(IllegalArgumentException("كلمة المرور يجب أن تكون 4 أحرف على الأقل"))

        return runCatching {
            val db = writableDatabase
            ensureSchema(db)

            val existingGuest = getUserByKey(guestKey)
                ?: throw IllegalStateException("حساب الزائر غير موجود")
            if (existingGuest.rank != ChatRank.GUEST) {
                throw IllegalStateException("حسابك مسجل مسبقاً كعضو")
            }

            db.rawQuery(
                "SELECT user_key FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND user_key != ? LIMIT 1",
                arrayOf(cleanName, cleanEmail, guestKey)
            ).use { c ->
                if (c.moveToFirst()) {
                    throw IllegalArgumentException("اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً")
                }
            }

            val isOwnerEmail = cleanEmail == OWNER_EMAIL
            val assignedRank = if (isOwnerEmail || !hasAnyOwner(db)) ChatRank.SITE_OWNER else ChatRank.MEMBER
            val newUserKey = "user:${UUID.randomUUID().toString().take(8)}"

            db.beginTransaction()
            try {
                val cv = ContentValues().apply {
                    put("user_key", newUserKey)
                    put("username", cleanName)
                    put("display_name", cleanName)
                    put("email", cleanEmail)
                    put("password_hash", hashPassword(password))
                    put("rank_id", assignedRank.id)
                    put("coins", maxOf(existingGuest.coins, 1500))
                    if (assignedRank == ChatRank.SITE_OWNER) {
                        put("avatar_frame", AvatarFrame.GOLD_ROYAL.id)
                        put("nameplate_style", NameplateStyle.CRIMSON_ROYAL.id)
                    }
                }
                db.update("users", cv, "user_key = ?", arrayOf(guestKey))

                val msgCv = ContentValues().apply {
                    put("sender_key", newUserKey)
                    put("sender_name", cleanName)
                    put("sender_rank", assignedRank.id)
                }
                db.update("messages", msgCv, "sender_key = ?", arrayOf(guestKey))

                val pmFromCv = ContentValues().apply {
                    put("from_key", newUserKey)
                    put("from_name", cleanName)
                }
                db.update("private_messages", pmFromCv, "from_key = ?", arrayOf(guestKey))

                val pmToCv = ContentValues().apply {
                    put("to_key", newUserKey)
                    put("to_name", cleanName)
                }
                db.update("private_messages", pmToCv, "to_key = ?", arrayOf(guestKey))

                val wallCv = ContentValues().apply {
                    put("author_key", newUserKey)
                    put("author_name", cleanName)
                    put("author_rank", assignedRank.id)
                }
                db.update("wall_posts", wallCv, "author_key = ?", arrayOf(guestKey))

                db.setTransactionSuccessful()
            } finally {
                db.endTransaction()
            }

            getUserByKey(newUserKey) ?: throw IllegalStateException("تعذر تحديث بيانات العضو")
        }
    }

    fun setUserRank(targetKey: String, newRank: ChatRank) {
        val db = writableDatabase
        val cv = ContentValues().apply { put("rank_id", newRank.id) }
        db.update("users", cv, "user_key = ?", arrayOf(targetKey))

        val msgCv = ContentValues().apply { put("sender_rank", newRank.id) }
        db.update("messages", msgCv, "sender_key = ?", arrayOf(targetKey))

        val wallCv = ContentValues().apply { put("author_rank", newRank.id) }
        db.update("wall_posts", wallCv, "author_key = ?", arrayOf(targetKey))
    }

    fun setUserMuted(targetKey: String, muted: Boolean, reason: String = "") {
        val cv = ContentValues().apply {
            put("is_muted", if (muted) 1 else 0)
            put("mute_reason", if (muted) reason else "")
        }
        writableDatabase.update("users", cv, "user_key = ?", arrayOf(targetKey))
    }

    fun setUserBanned(targetKey: String, banned: Boolean, reason: String = "") {
        val cv = ContentValues().apply {
            put("is_banned", if (banned) 1 else 0)
            put("ban_reason", if (banned) reason else "")
            if (banned) put("is_online", 0)
        }
        writableDatabase.update("users", cv, "user_key = ?", arrayOf(targetKey))
    }

    fun setOnline(userKey: String, online: Boolean) {
        val cv = ContentValues().apply { put("is_online", if (online) 1 else 0) }
        writableDatabase.update("users", cv, "user_key = ?", arrayOf(userKey))
    }

    fun getRooms(): List<ChatRoom> {
        val list = mutableListOf<ChatRoom>()
        val onlineTotal = getAllUsers().count { it.isOnline && !it.isBanned }
        readableDatabase.rawQuery("SELECT * FROM rooms ORDER BY created_at ASC", null).use { c ->
            var idx = 0
            while (c.moveToNext()) {
                list.add(
                    ChatRoom(
                        id = c.getStr("id"),
                        name = c.getStr("name"),
                        description = c.getStr("description"),
                        category = c.getStr("category"),
                        iconEmoji = c.getStr("icon_emoji").ifBlank { "💬" },
                        micsEnabled = c.getIntSafe("mics_enabled", 1) == 1,
                        onlineCount = if (idx == 0) onlineTotal else (onlineTotal / (idx + 1)).coerceAtLeast(1),
                        createdBy = c.getStr("created_by")
                    )
                )
                idx++
            }
        }
        return list
    }

    fun createRoom(name: String, description: String, iconEmoji: String, createdBy: String): ChatRoom {
        val id = "room_${UUID.randomUUID().toString().take(8)}"
        val now = System.currentTimeMillis()
        val cv = ContentValues().apply {
            put("id", id)
            put("name", name.trim())
            put("description", description.trim().ifBlank { "غرفة دردشة جديدة" })
            put("category", "مخصصة")
            put("icon_emoji", iconEmoji.ifBlank { "💬" })
            put("mics_enabled", 1)
            put("created_by", createdBy)
            put("created_at", now)
        }
        writableDatabase.insert("rooms", null, cv)
        return ChatRoom(id, name.trim(), description.trim(), "مخصصة", iconEmoji.ifBlank { "💬" }, true, 1, createdBy)
    }

    fun deleteRoom(roomId: String) {
        if (roomId == "general") return
        writableDatabase.delete("messages", "room_id = ?", arrayOf(roomId))
        writableDatabase.delete("rooms", "id = ?", arrayOf(roomId))
    }

    fun toggleRoomMics(roomId: String, enabled: Boolean) {
        val cv = ContentValues().apply { put("mics_enabled", if (enabled) 1 else 0) }
        writableDatabase.update("rooms", cv, "id = ?", arrayOf(roomId))
    }

    fun getMessages(roomId: String): List<ChatMessage> {
        val list = mutableListOf<ChatMessage>()
        readableDatabase.rawQuery(
            "SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC LIMIT 200",
            arrayOf(roomId)
        ).use { c ->
            while (c.moveToNext()) {
                list.add(
                    ChatMessage(
                        id = c.getStr("id"),
                        roomId = c.getStr("room_id"),
                        senderKey = c.getStr("sender_key"),
                        senderName = c.getStr("sender_name"),
                        senderRank = ChatRank.fromId(c.getStr("sender_rank")),
                        senderAvatarUri = c.getStr("sender_avatar_uri"),
                        senderAvatarEmoji = c.getStr("sender_avatar_emoji"),
                        senderFrame = AvatarFrame.fromId(c.getStr("sender_frame")),
                        senderNameplate = NameplateStyle.fromId(c.getStr("sender_nameplate")),
                        content = c.getStr("content"),
                        imageUri = c.getStr("image_uri"),
                        voiceDurationSec = c.getIntSafe("voice_sec"),
                        isAnnouncement = c.getIntSafe("is_announcement") == 1,
                        createdAtMillis = c.getLongSafe("created_at")
                    )
                )
            }
        }
        return list
    }

    fun insertMessage(msg: ChatMessage) {
        val cv = ContentValues().apply {
            put("id", msg.id)
            put("room_id", msg.roomId)
            put("sender_key", msg.senderKey)
            put("sender_name", msg.senderName)
            put("sender_rank", msg.senderRank.id)
            put("sender_avatar_uri", msg.senderAvatarUri)
            put("sender_avatar_emoji", msg.senderAvatarEmoji)
            put("sender_frame", msg.senderFrame.id)
            put("sender_nameplate", msg.senderNameplate.id)
            put("content", msg.content)
            put("image_uri", msg.imageUri)
            put("voice_sec", msg.voiceDurationSec)
            put("is_announcement", if (msg.isAnnouncement) 1 else 0)
            put("created_at", msg.createdAtMillis)
        }
        writableDatabase.insert("messages", null, cv)
    }

    fun clearRoomMessages(roomId: String) {
        writableDatabase.delete("messages", "room_id = ?", arrayOf(roomId))
    }

    fun getPrivateMessages(userKey: String): List<PrivateMessage> {
        val list = mutableListOf<PrivateMessage>()
        readableDatabase.rawQuery(
            "SELECT * FROM private_messages WHERE from_key = ? OR to_key = ? ORDER BY created_at ASC",
            arrayOf(userKey, userKey)
        ).use { c ->
            while (c.moveToNext()) {
                list.add(
                    PrivateMessage(
                        id = c.getStr("id"),
                        fromKey = c.getStr("from_key"),
                        fromName = c.getStr("from_name"),
                        fromEmoji = c.getStr("from_emoji"),
                        toKey = c.getStr("to_key"),
                        toName = c.getStr("to_name"),
                        content = c.getStr("content"),
                        createdAtMillis = c.getLongSafe("created_at")
                    )
                )
            }
        }
        return list
    }

    fun insertPrivateMessage(pm: PrivateMessage) {
        val cv = ContentValues().apply {
            put("id", pm.id)
            put("from_key", pm.fromKey)
            put("from_name", pm.fromName)
            put("from_emoji", pm.fromEmoji)
            put("to_key", pm.toKey)
            put("to_name", pm.toName)
            put("content", pm.content)
            put("created_at", pm.createdAtMillis)
        }
        writableDatabase.insert("private_messages", null, cv)
    }

    fun getWallPosts(): List<WallPost> {
        val list = mutableListOf<WallPost>()
        readableDatabase.rawQuery("SELECT * FROM wall_posts ORDER BY created_at DESC LIMIT 60", null).use { c ->
            while (c.moveToNext()) {
                list.add(
                    WallPost(
                        id = c.getStr("id"),
                        authorKey = c.getStr("author_key"),
                        authorName = c.getStr("author_name"),
                        authorRank = ChatRank.fromId(c.getStr("author_rank")),
                        authorEmoji = c.getStr("author_emoji"),
                        content = c.getStr("content"),
                        likes = c.getIntSafe("likes"),
                        createdAtMillis = c.getLongSafe("created_at")
                    )
                )
            }
        }
        return list
    }

    fun addWallPost(post: WallPost) {
        val cv = ContentValues().apply {
            put("id", post.id)
            put("author_key", post.authorKey)
            put("author_name", post.authorName)
            put("author_rank", post.authorRank.id)
            put("author_emoji", post.authorEmoji)
            put("content", post.content)
            put("likes", post.likes)
            put("created_at", post.createdAtMillis)
        }
        writableDatabase.insert("wall_posts", null, cv)
    }

    fun likeWallPost(postId: String) {
        writableDatabase.execSQL("UPDATE wall_posts SET likes = likes + 1 WHERE id = ?", arrayOf(postId))
    }

    fun getNotifications(): List<ChatNotification> {
        val list = mutableListOf<ChatNotification>()
        readableDatabase.rawQuery("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 40", null).use { c ->
            while (c.moveToNext()) {
                list.add(
                    ChatNotification(
                        id = c.getStr("id"),
                        title = c.getStr("title"),
                        body = c.getStr("body"),
                        isRead = c.getIntSafe("is_read") == 1,
                        createdAtMillis = c.getLongSafe("created_at")
                    )
                )
            }
        }
        return list
    }

    fun addNotification(title: String, body: String) {
        val cv = ContentValues().apply {
            put("id", "notif_${UUID.randomUUID().toString().take(8)}")
            put("title", title)
            put("body", body)
            put("is_read", 0)
            put("created_at", System.currentTimeMillis())
        }
        writableDatabase.insert("notifications", null, cv)
    }

    fun markAllNotificationsRead() {
        writableDatabase.execSQL("UPDATE notifications SET is_read = 1")
    }

    fun getReports(): List<UserReport> {
        val list = mutableListOf<UserReport>()
        readableDatabase.rawQuery("SELECT * FROM reports ORDER BY created_at DESC LIMIT 50", null).use { c ->
            while (c.moveToNext()) {
                list.add(
                    UserReport(
                        id = c.getStr("id"),
                        reporterName = c.getStr("reporter_name"),
                        targetName = c.getStr("target_name"),
                        reason = c.getStr("reason"),
                        status = c.getStr("status"),
                        createdAtMillis = c.getLongSafe("created_at")
                    )
                )
            }
        }
        return list
    }

    fun addReport(reporterName: String, targetName: String, reason: String) {
        val cv = ContentValues().apply {
            put("id", "rep_${UUID.randomUUID().toString().take(8)}")
            put("reporter_name", reporterName)
            put("target_name", targetName)
            put("reason", reason)
            put("status", "قيد المراجعة")
            put("created_at", System.currentTimeMillis())
        }
        writableDatabase.insert("reports", null, cv)
    }

    fun resolveReport(reportId: String) {
        val cv = ContentValues().apply { put("status", "تمت المعالجة") }
        writableDatabase.update("reports", cv, "id = ?", arrayOf(reportId))
    }

    private fun hasAnyOwner(db: SQLiteDatabase): Boolean {
        db.rawQuery(
            "SELECT user_key FROM users WHERE rank_id = ? LIMIT 1",
            arrayOf(ChatRank.SITE_OWNER.id)
        ).use { c -> return c.moveToFirst() }
    }

    private fun readUser(c: Cursor): ChatUser {
        val uname = c.getStr("username")
        return ChatUser(
            userKey = c.getStr("user_key"),
            username = uname,
            displayName = c.getStr("display_name").ifBlank { uname },
            email = c.getStr("email"),
            gender = c.getStr("gender").ifBlank { "ذكر" },
            rank = ChatRank.fromId(c.getStr("rank_id")),
            bio = c.getStr("bio"),
            avatarUri = c.getStr("avatar_uri"),
            avatarEmoji = c.getStr("avatar_emoji").ifBlank { "😎" },
            avatarFrame = AvatarFrame.fromId(c.getStr("avatar_frame")),
            nameplateStyle = NameplateStyle.fromId(c.getStr("nameplate_style")),
            coins = c.getIntSafe("coins", 1500),
            vipFamily = c.getStr("vip_family"),
            isMuted = c.getIntSafe("is_muted") == 1,
            muteReason = c.getStr("mute_reason"),
            isBanned = c.getIntSafe("is_banned") == 1,
            banReason = c.getStr("ban_reason"),
            isOnline = c.getIntSafe("is_online", 1) == 1,
            joinDateMillis = c.getLongSafe("join_date", System.currentTimeMillis())
        )
    }

    private fun Cursor.getStr(col: String): String {
        val idx = getColumnIndex(col)
        return if (idx >= 0 && !isNull(idx)) getString(idx).orEmpty() else ""
    }

    private fun Cursor.getIntSafe(col: String, default: Int = 0): Int {
        val idx = getColumnIndex(col)
        return if (idx >= 0 && !isNull(idx)) getInt(idx) else default
    }

    private fun Cursor.getLongSafe(col: String, default: Long = 0L): Long {
        val idx = getColumnIndex(col)
        return if (idx >= 0 && !isNull(idx)) getLong(idx) else default
    }

    private fun hashPassword(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest("shat_salt_$raw".toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    companion object {
        private const val DB_NAME = "shat_alghoraf.db"
        private const val DB_VERSION = 2
        const val OWNER_EMAIL = "a38125923@gmail.com"
        const val OWNER_PIN = "2026"
    }
}
