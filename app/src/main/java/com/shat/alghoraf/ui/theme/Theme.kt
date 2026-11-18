package com.shat.alghoraf.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.R

val RoyalBlue = Color(0xFF1A45E5)
val RoyalBlueDark = Color(0xFF102CA3)
val RoyalGold = Color(0xFFF59E0B)
val GoldLight = Color(0xFFFEF3C7)
val WarmPeach = Color(0xFFFFF5EB)
val WarmBeige = Color(0xFFFCEBD5)
val MicPurple = Color(0xFF7C3AED)
val CrimsonOwner = Color(0xFFB91C1C)
val OnlineGreen = Color(0xFF22C55E)
val SurfaceWhite = Color(0xFFFFFFFF)
val TextDark = Color(0xFF0F172A)
val TextMuted = Color(0xFF64748B)

val CairoFontFamily = FontFamily(Font(R.font.cairo, FontWeight.Normal))
val TajawalFontFamily = FontFamily(Font(R.font.tajawal, FontWeight.Normal))

private val LightChatColors = lightColorScheme(
    primary = RoyalBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDBE4FF),
    onPrimaryContainer = RoyalBlueDark,
    secondary = RoyalGold,
    onSecondary = Color(0xFF1E1B18),
    secondaryContainer = GoldLight,
    onSecondaryContainer = Color(0xFF78350F),
    tertiary = MicPurple,
    onTertiary = Color.White,
    background = WarmPeach,
    onBackground = TextDark,
    surface = SurfaceWhite,
    onSurface = TextDark,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = TextMuted,
    error = Color(0xFFDC2626),
    onError = Color.White
)

val ShatTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 30.sp
    ),
    titleLarge = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 26.sp
    ),
    titleMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = TajawalFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = TajawalFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp
    ),
    labelMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp
    )
)

val ShatShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp)
)

@Composable
fun ShatAlghorafTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightChatColors,
        typography = ShatTypography,
        shapes = ShatShapes,
        content = content
    )
}

fun parseHexColor(hex: String?, fallback: Color): Color {
    if (hex.isNullOrBlank()) return fallback
    return try {
        val cleaned = hex.trim().removePrefix("#")
        val parsed = cleaned.toLong(16)
        when (cleaned.length) {
            6 -> Color(0xFF000000L or parsed)
            8 -> Color(parsed)
            else -> fallback
        }
    } catch (_: Exception) {
        fallback
    }
}

fun resolveRoomBackground(themeKey: String): Pair<Color, Color> = when (themeKey) {
    "royal_cream" -> Color(0xFFFFFBEB) to Color(0xFFFEF3C7)
    "sky_breeze" -> Color(0xFFF0F9FF) to Color(0xFFE0F2FE)
    "night_obsidian" -> Color(0xFF0F172A) to Color(0xFF1E293B)
    "emerald_mist" -> Color(0xFFECFDF5) to Color(0xFFD1FAE5)
    else -> WarmPeach to Color(0xFFFFEDD5)
}
