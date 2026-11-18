package com.shat.alghoraf.data

object DefaultCatalogs {
    const val SUPREME_OWNER_EMAIL = "a38125923@gmail.com"

    fun isSupremeOwnerEmail(email: String?): Boolean =
        email?.trim()?.equals(SUPREME_OWNER_EMAIL, ignoreCase = true) == true

    val giftCatalog = listOf(
        GiftCatalogItem("rose", "وردة حمراء", "🌹", 50, 25, "كلاسيك", "#E11D48"),
        GiftCatalogItem("coffee", "فنجان قهوة", "☕", 75, 40, "كلاسيك", "#B45309"),
        GiftCatalogItem("heart", "قلب متوهج", "💖", 120, 60, "دافئ", "#EC4899"),
        GiftCatalogItem("bouquet", "باقة زهور", "💐", 200, 100, "دافئ", "#DB2777"),
        GiftCatalogItem("perfume", "عطر فاخر", "✨", 320, 160, "VIP", "#8B5CF6"),
        GiftCatalogItem("ring", "خاتم ألماس", "💍", 500, 250, "VIP", "#0284C7"),
        GiftCatalogItem("crown", "تاج ملكي", "👑", 750, 375, "ملكي", "#D97706"),
        GiftCatalogItem("diamond", "جوهرة نادرة", "💎", 1000, 500, "ملكي", "#0EA5E9"),
        GiftCatalogItem("car", "سيارة رياضية", "🏎️", 1800, 900, "أسطوري", "#DC2626"),
        GiftCatalogItem("castle", "قصر الأحلام", "🏰", 3000, 1500, "أسطوري", "#7C3AED")
    )

    val avatarFrames = listOf(
        StyleOption("none", "بدون إطار", "⭕"),
        StyleOption("kings_crown", "تاج الملوك KINGS", "👑"),
        StyleOption("gold_royal", "إطار ملكي ذهبي", "👑"),
        StyleOption("neon_cyan", "إطار نيون سماوي", "💠"),
        StyleOption("flame_red", "إطار نار مشتعلة", "🔥"),
        StyleOption("emerald_vip", "إطار زمرد VIP", "💎"),
        StyleOption("rose_aura", "إطار هالة وردية", "🌸"),
        StyleOption("violet_crown", "إطار بنفسجي فاخر", "⚜️")
    )

    val profileBackgroundEffects = listOf(
        StyleOption("none", "بدون تأثير خلفي", "⬜"),
        StyleOption("animated_flames", "لهب ملكي متحرك", "🔥"),
        StyleOption("falling_stars", "نجوم متساقطة", "✨"),
        StyleOption("royal_waves", "أمواج بحرية فاخرة", "🌊"),
        StyleOption("aurora_glow", "أضواء الشفق الساحرة", "🌌")
    )

    val rankBadgeStyles = listOf(
        StyleOption("crown_royal", "تاج ملكي ذهبي", "👑"),
        StyleOption("gold_eagle", "صقر ذهبي ملكي", "🦅"),
        StyleOption("silver_wing", "أجنحة فضية", "🕊️"),
        StyleOption("diamond_medal", "وسام ماسي", "💎"),
        StyleOption("royal_shield", "درع ملكي", "🛡️"),
        StyleOption("neon_badge", "شارة نيون", "⚡")
    )

    val nameplateStyles = listOf(
        StyleOption("default", "كلاسيكي شفاف"),
        StyleOption("crimson_royal", "ملكي قرمزي"),
        StyleOption("gold_vip", "ذهبي VIP"),
        StyleOption("ocean_blue", "أزرق محيطي"),
        StyleOption("emerald_dark", "زمردي داكن"),
        StyleOption("violet_neon", "نيون بنفسجي")
    )

    val nameShineOptions = listOf(
        StyleOption("none", "بدون لمعة"),
        StyleOption("gold_shimmer", "لمعة ذهبية"),
        StyleOption("rainbow", "طيف قوس قزح"),
        StyleOption("neon_pulse", "نبض نيون"),
        StyleOption("ice_glow", "توهج جليدي")
    )

    val fontFamilies = listOf("Cairo", "Tajawal", "SansSerif", "Serif", "Monospace")

    val profileMusicPresets = listOf(
        StyleOption("", "بدون موسيقى بروفايل", "🔇"),
        StyleOption("royal_oud", "تقاسيم عود هادئة", "🪕"),
        StyleOption("lofi_chill", "لوفاي ليلي رايق", "🎧"),
        StyleOption("piano_soft", "بيانو كلاسيكي ناعم", "🎹"),
        StyleOption("arabian_nights", "نغمات ليالي العرب", "🌙")
    )

    val roomThemes = listOf(
        StyleOption("warm_peach", "خوخي دافئ (افتراضي)"),
        StyleOption("royal_cream", "كريمي ملكي"),
        StyleOption("sky_breeze", "نسيم سماوي"),
        StyleOption("night_obsidian", "ليلي فاخر"),
        StyleOption("emerald_mist", "زمردي هادئ")
    )

    val rankIconLibrary = listOf(
        StyleOption("👑", "تاج ذهبي"),
        StyleOption("🏆", "كأس ملكي"),
        StyleOption("🛡️", "درع حارس"),
        StyleOption("🕊️", "أجنحة VIP"),
        StyleOption("🎖️", "وسام شرف"),
        StyleOption("🌟", "نجمة متألقة"),
        StyleOption("⚔️", "سيوف ملكية"),
        StyleOption("💎", "جوهرة زرقاء"),
        StyleOption("⚜️", "صولجان ملكي"),
        StyleOption("🔰", "شارة إشراف"),
        StyleOption("🔥", "لهب التميز"),
        StyleOption("🏛️", "إدارة عليا")
    )

    val colorPalette = listOf(
        "#1A45E5", "#B91C1C", "#D97706", "#059669",
        "#7C3AED", "#DB2777", "#0284C7", "#1E293B",
        "#EA580C", "#0D9488", "#9333EA", "#FFFFFF"
    )

    val quickEmojis = listOf(
        "😀", "😂", "😍", "🥰", "😎", "👑", "🔥", "💖",
        "🌹", "🎉", "👏", "🙏", "☕", "💎", "🎶", "✨",
        "🤝", "💯", "🥳", "😅", "🫡", "🤍", "❤️", "🌙"
    )

    val emojiCategories: Map<String, List<String>> = mapOf(
        "وجوه" to listOf("😀", "😂", "🤣", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😇", "😉", "😋", "🤔", "😴", "😅", "🫡", "🤗", "🤭", "😌", "😢", "😤", "🤯", "🥺", "🫶"),
        "قلوب" to listOf("❤️", "💖", "💘", "💝", "💗", "💓", "💞", "💕", "🤍", "🖤", "💜", "💙", "💚", "💛", "🧡", "❣️", "❤️‍🔥", "💋"),
        "رموز" to listOf("👑", "💎", "🔥", "⭐", "🌟", "✨", "⚡", "🛡️", "⚜️", "🏆", "🎖️", "🏅", "🦅", "🕊️", "🦋", "🌙", "☀️", "💯", "✅", "🧿"),
        "احتفالات" to listOf("🎉", "🎊", "🎈", "🎁", "🌹", "💐", "☕", "🍵", "🎶", "🎵", "🎧", "🎤", "👏", "🙏", "🤝", "✌️", "🥂", "🍰")
    )

    val animatedStickers = listOf(
        StickerOption("crown_king", "👑", "تاج الملك", "bounce"),
        StickerOption("love_burst", "💖", "نبض الحب", "pulse"),
        StickerOption("royal_fire", "🔥", "حماس ناري", "shake"),
        StickerOption("diamond_vip", "💎", "ألماس VIP", "spin"),
        StickerOption("rose_love", "🌹", "وردة فاخرة", "bounce"),
        StickerOption("party_popper", "🎉", "احتفال", "shake"),
        StickerOption("sparkle_magic", "✨", "تألق", "pulse"),
        StickerOption("clap_vip", "👏", "تصفيق حار", "bounce"),
        StickerOption("coffee_time", "☕", "قهوة رايقة", "bounce"),
        StickerOption("music_vibe", "🎶", "طرب وموسيقى", "pulse"),
        StickerOption("kiss_heart", "😘", "قبلة حب", "pulse"),
        StickerOption("salute_boss", "🫡", "تحية ملكية", "bounce")
    )

    val radioStations = listOf(
        RadioStationItem("arab_hits", "إذاعة الأغاني العربية", "طرب عربي", "https://stream.zeno.fm/0r0xa792kwzuv"),
        RadioStationItem("quran", "إذاعة القرآن الكريم", "تلاوات مباشرة", "https://stream.radiojar.com/8s5u5tpdtwzuv"),
        RadioStationItem("lofi", "راديو موسيقى لوفاي", "Lo-Fi استرخاء", "https://ice1.somafm.com/groovesalad-128-mp3"),
        RadioStationItem("night_vibes", "سهرة الطرب الليلية", "موسيقى ليلية", "https://ice1.somafm.com/lush-128-mp3")
    )

    val defaultRooms = listOf(
        ChatRoom(
            id = "general",
            name = "الغرفة العامة",
            description = "ملتقى جميع الأعضاء للترحيب والدردشة الراقية",
            icon = "💬",
            bgTheme = "warm_peach",
            welcomeMessage = "أهلاً بكم في الغرفة العامة — التزام الاحترام يصنع أجمل الأوقات",
            minRankPower = 0L,
            micsEnabled = true,
            ownerName = "صاحب الموقع",
            activityPoints = 120L,
            isActive = true,
            createdBy = "system"
        ),
        ChatRoom(
            id = "poetry",
            name = "غرفة الشعر والخواطر",
            description = "مساحة هادئة للشعر العربي والأدب والخواطر",
            icon = "📜",
            bgTheme = "royal_cream",
            welcomeMessage = "مرحباً بعشاق الكلمة الراقية والشعر الأصيل",
            minRankPower = 0L,
            micsEnabled = true,
            ownerName = "الإدارة",
            activityPoints = 85L,
            isActive = true,
            createdBy = "system"
        ),
        ChatRoom(
            id = "vip",
            name = "مجلس كبار الشخصيات VIP",
            description = "مجلس خاص لأصحاب الرتب المميزة والهدايا الملكية",
            icon = "👑",
            bgTheme = "night_obsidian",
            welcomeMessage = "أهلاً بكبار الشخصيات في المجلس الملكي",
            minRankPower = 10L,
            micsEnabled = true,
            ownerName = "صاحب الموقع",
            activityPoints = 210L,
            isActive = true,
            createdBy = "system"
        ),
        ChatRoom(
            id = "gaming",
            name = "غرفة المسابقات والألعاب",
            description = "تحديات يومية ومسابقات ثقافية وجوائز كوينز",
            icon = "🎮",
            bgTheme = "sky_breeze",
            welcomeMessage = "استعد للتحدي واربح الكوينز والهدايا!",
            minRankPower = 0L,
            micsEnabled = true,
            ownerName = "الإدارة",
            activityPoints = 95L,
            isActive = true,
            createdBy = "system"
        )
    )

    val defaultRanks: List<RankConfig> = listOf(
        RankConfig(
            id = "site_owner", key = "site_owner", label = "صاحب الموقع", icon = "👑",
            bgColor = "#B91C1C", textColor = "#FEF3C7", power = 100, tierOrder = 10,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = true, permPublishNews = true,
            permUseAddons = true, maxAssignableRank = 100
        ),
        RankConfig(
            id = "super_owner", key = "super_owner", label = "سوبر أونر", icon = "💎",
            bgColor = "#D97706", textColor = "#FFFBEB", power = 99, tierOrder = 9,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = true, permPublishNews = true,
            permUseAddons = true, maxAssignableRank = 98
        ),
        RankConfig(
            id = "vip_owner", key = "vip_owner", label = "في آي بي أونر", icon = "🌟",
            bgColor = "#EA580C", textColor = "#FFFBEB", power = 98, tierOrder = 8,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = true, permPublishNews = true,
            permUseAddons = true, maxAssignableRank = 97
        ),
        RankConfig(
            id = "master_owner", key = "master_owner", label = "ماستر أونر", icon = "⚜️",
            bgColor = "#C026D3", textColor = "#FFFFFF", power = 96, tierOrder = 7,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = true, permPublishNews = true,
            permUseAddons = true, maxAssignableRank = 95
        ),
        RankConfig(
            id = "director", key = "director", label = "مدير عام", icon = "🏛️",
            bgColor = "#4F46E5", textColor = "#FFFFFF", power = 92, tierOrder = 6,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = true, permPublishNews = true,
            permUseAddons = true, maxAssignableRank = 90
        ),
        RankConfig(
            id = "super_admin", key = "super_admin", label = "سوبر أدمن", icon = "🛡️",
            bgColor = "#1D4ED8", textColor = "#FFFFFF", power = 85, tierOrder = 5,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = true,
            permAccessPanel = true, permRoomOwner = false, permPublishNews = false,
            permUseAddons = true, maxAssignableRank = 80
        ),
        RankConfig(
            id = "admin", key = "admin", label = "أدمن إداري", icon = "⚔️",
            bgColor = "#0284C7", textColor = "#FFFFFF", power = 75, tierOrder = 4,
            isSystem = true, permMute = true, permKick = true, permBan = true,
            permSetRank = true, permClearRoom = true, permManageRooms = false,
            permAccessPanel = true, permRoomOwner = false, permPublishNews = false,
            permUseAddons = true, maxAssignableRank = 65
        ),
        RankConfig(
            id = "moderator", key = "moderator", label = "مشرف غرفة", icon = "🔰",
            bgColor = "#059669", textColor = "#FFFFFF", power = 60, tierOrder = 3,
            isSystem = true, permMute = true, permKick = true, permBan = false,
            permSetRank = false, permClearRoom = true, permManageRooms = false,
            permAccessPanel = false, permRoomOwner = false, permPublishNews = false,
            permUseAddons = true, maxAssignableRank = 0
        ),
        RankConfig(
            id = "vip_royal", key = "vip_royal", label = "كبار الشخصيات الملكي", icon = "💠",
            bgColor = "#7C3AED", textColor = "#FFFFFF", power = 40, tierOrder = 2,
            isSystem = true, permUseAddons = true
        ),
        RankConfig(
            id = "vip", key = "vip", label = "عضو VIP", icon = "⭐",
            bgColor = "#D97706", textColor = "#FFFFFF", power = 20, tierOrder = 2,
            isSystem = true, permUseAddons = true
        ),
        RankConfig(
            id = "active_member", key = "active_member", label = "عضو متفاعل", icon = "🔥",
            bgColor = "#0D9488", textColor = "#FFFFFF", power = 10, tierOrder = 1,
            isSystem = true, permUseAddons = true
        ),
        RankConfig(
            id = "member", key = "member", label = "عضو", icon = "👤",
            bgColor = "#475569", textColor = "#FFFFFF", power = 1, tierOrder = 1,
            isSystem = true
        )
    )

    fun rankFor(key: String, dynamicRanks: List<RankConfig>): RankConfig =
        dynamicRanks.firstOrNull { it.key == key }
            ?: defaultRanks.firstOrNull { it.key == key }
            ?: defaultRanks.last()
}
