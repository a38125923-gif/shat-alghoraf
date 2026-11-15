package com.shat.alghoraf.data.model

import androidx.compose.ui.graphics.Color

enum class ChatRank(
    val id: String,
    val arabicLabel: String,
    val icon: String,
    val power: Int,
    val badgeBg: Color,
    val badgeText: Color
) {
    SITE_OWNER("site_owner", "صاحب الموقع", "👑", 100, Color(0xFFB91C1C), Color(0xFFFEF08A)),
    SUPER_OWNER("super_owner", "سوبر أونر", "💎", 90, Color(0xFFD97706), Color.White),
    OWNER("owner", "أونر", "⭐", 80, Color(0xFFF59E0B), Color(0xFF1F2937)),
    SUPER_ADMIN("super_admin", "سوبر أدمن", "🛡️", 70, Color(0xFF7C3AED), Color.White),
    ADMIN("admin", "أدمن", "🔰", 60, Color(0xFF2563EB), Color.White),
    GENERAL_MODERATOR("general_mod", "إداري عام", "🎖️", 50, Color(0xFF059669), Color.White),
    ROYAL_VIP("royal_vip", "ملكي", "⚜️", 40, Color(0xFFEA580C), Color.White),
    SILVER_VIP("silver_vip", "فضي", "🥈", 30, Color(0xFF64748B), Color.White),
    MEMBER("member", "عضو", "👤", 10, Color(0xFF475569), Color.White),
    GUEST("guest", "زائر", "🧭", 0, Color(0xFF334155), Color(0xFFE2E8F0));

    val isStaff: Boolean get() = power >= GENERAL_MODERATOR.power
    val isPrivilegedAdmin: Boolean get() = power >= ADMIN.power

    companion object {
        fun fromId(id: String?): ChatRank = entries.firstOrNull { it.id == id } ?: MEMBER
    }
}

enum class AvatarFrame(val id: String, val arabicName: String, val cost: Int, val borderColors: List<Color>) {
    NONE("none", "بدون إطار", 0, listOf(Color(0xFFCBD5E1), Color(0xFF94A3B8))),
    GOLD_ROYAL("gold_royal", "الإطار الملكي الذهبي", 0, listOf(Color(0xFFF59E0B), Color(0xFFFDE047), Color(0xFFB45309))),
    FIRE_GOLD("fire_gold", "إطار اللهب الذهبي", 350, listOf(Color(0xFFEF4444), Color(0xFFF97316), Color(0xFFFACC15))),
    DIAMOND_RING("diamond_ring", "الإطار الماسي المتوهج", 600, listOf(Color(0xFF38BDF8), Color(0xFFE0F2FE), Color(0xFF2563EB))),
    EMERALD_CROWN("emerald_crown", "إطار الزمرد الفاخر", 450, listOf(Color(0xFF10B981), Color(0xFFA7F3D0), Color(0xFF047857)));

    companion object {
        fun fromId(id: String?): AvatarFrame = entries.firstOrNull { it.id == id } ?: NONE
    }
}

enum class NameplateStyle(
    val id: String,
    val arabicName: String,
    val cost: Int,
    val bgColor: Color,
    val textColor: Color
) {
    DEFAULT("default", "افتراضي شفاف", 0, Color.Transparent, Color(0xFF0F172A)),
    GOLD_BAR("gold_bar", "شريط ذهبي ملكي", 250, Color(0xFFFEF3C7), Color(0xFF92400E)),
    CRIMSON_ROYAL("crimson_royal", "شريط أحمر ملكي", 0, Color(0xFF991B1B), Color(0xFFFEF08A)),
    OBSIDIAN_GOLD("obsidian_gold", "أسود مذهب فاخر", 400, Color(0xFF111827), Color(0xFFFACC15)),
    EMERALD_SILK("emerald_silk", "زمردي لامع", 300, Color(0xFFD1FAE5), Color(0xFF065F46)),
    VIOLET_GLOW("violet_glow", "بنفسجي متوهج", 300, Color(0xFFEDE9FE), Color(0xFF5B21B6));

    companion object {
        fun fromId(id: String?): NameplateStyle = entries.firstOrNull { it.id == id } ?: DEFAULT
    }
}

enum class ChatThemeOption(val id: String, val label: String, val isDark: Boolean) {
    WARM_PEACH("warm_peach", "خوخي دافئ", false),
    SUNSET_ROSE("sunset_rose", "غروب وردي", false),
    EMERALD_MIST("emerald_mist", "زمردي هادئ", false),
    SKY_BREEZE("sky_breeze", "نسيم السماء", false),
    ROYAL_NIGHT("royal_night", "ليل ملكي داكن", true);

    companion object {
        fun fromId(id: String?): ChatThemeOption = entries.firstOrNull { it.id == id } ?: WARM_PEACH
    }
}

enum class BottomNavTab(val label: String) {
    CHAT("الدردشة"),
    ROOMS("الغرف"),
    ONLINE("المتواجدين"),
    SHOP("المتجر"),
    PRIVATE("الخاص"),
    CONTROL("لوحة المالك")
}

data class ChatUser(
    val userKey: String,
    val username: String,
    val displayName: String,
    val email: String = "",
    val gender: String = "ذكر",
    val rank: ChatRank = ChatRank.MEMBER,
    val bio: String = "أهلاً بكم في شات الغرف",
    val avatarUri: String = "",
    val avatarEmoji: String = "😎",
    val avatarFrame: AvatarFrame = AvatarFrame.NONE,
    val nameplateStyle: NameplateStyle = NameplateStyle.DEFAULT,
    val nameColorHex: Long = 0xFF0F172A,
    val coins: Int = 1500,
    val vipFamily: String = "",
    val isMuted: Boolean = false,
    val muteReason: String = "",
    val isBanned: Boolean = false,
    val banReason: String = "",
    val isOnline: Boolean = true,
    val joinDateMillis: Long = System.currentTimeMillis()
)

data class ChatRoom(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val iconEmoji: String,
    val micsEnabled: Boolean = true,
    val onlineCount: Int = 1,
    val createdBy: String = "system"
)

data class ChatMessage(
    val id: String,
    val roomId: String,
    val senderKey: String,
    val senderName: String,
    val senderRank: ChatRank,
    val senderAvatarUri: String = "",
    val senderAvatarEmoji: String = "💬",
    val senderFrame: AvatarFrame = AvatarFrame.NONE,
    val senderNameplate: NameplateStyle = NameplateStyle.DEFAULT,
    val content: String,
    val imageUri: String = "",
    val voiceDurationSec: Int = 0,
    val isAnnouncement: Boolean = false,
    val createdAtMillis: Long = System.currentTimeMillis()
)

data class PrivateMessage(
    val id: String,
    val fromKey: String,
    val fromName: String,
    val fromEmoji: String,
    val toKey: String,
    val toName: String,
    val content: String,
    val createdAtMillis: Long = System.currentTimeMillis()
)

data class VoiceMicSlot(
    val slotNumber: Int,
    val occupantKey: String? = null,
    val occupantName: String? = null,
    val occupantEmoji: String? = null,
    val occupantRank: ChatRank? = null,
    val isMuted: Boolean = false
)

data class WallPost(
    val id: String,
    val authorKey: String,
    val authorName: String,
    val authorRank: ChatRank,
    val authorEmoji: String,
    val content: String,
    val likes: Int = 0,
    val createdAtMillis: Long = System.currentTimeMillis()
)

data class ChatNotification(
    val id: String,
    val title: String,
    val body: String,
    val isRead: Boolean = false,
    val createdAtMillis: Long = System.currentTimeMillis()
)

data class UserReport(
    val id: String,
    val reporterName: String,
    val targetName: String,
    val reason: String,
    val status: String = "قيد المراجعة",
    val createdAtMillis: Long = System.currentTimeMillis()
)
