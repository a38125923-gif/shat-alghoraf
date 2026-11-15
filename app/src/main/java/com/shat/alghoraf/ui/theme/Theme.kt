package com.shat.alghoraf.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.R

val CairoFontFamily = FontFamily(
    Font(R.font.cairo, FontWeight.Normal),
    Font(R.font.cairo, FontWeight.Medium),
    Font(R.font.cairo, FontWeight.SemiBold),
    Font(R.font.cairo, FontWeight.Bold),
    Font(R.font.cairo, FontWeight.ExtraBold)
)

object CodyColors {
    val RoyalBlue = Color(0xFF1A45E5)
    val RoyalBlueDark = Color(0xFF1232AD)
    val RoyalGold = Color(0xFFF59E0B)
    val RoyalGoldLight = Color(0xFFFDE68A)
    val OnlineGreen = Color(0xFF22C55E)
    val AuthGreen = Color(0xFF16A34A)
    val AuthBlack = Color(0xFF111827)
    val AuthOrange = Color(0xFFEA580C)
    val AuthRed = Color(0xFFDC2626)

    val RoomBannerBg = Color(0xFFFFF8E7)
    val RoomBannerBorder = Color(0xFFF3D184)
    val PeachTop = Color(0xFFFFF4E6)
    val PeachBottom = Color(0xFFFFE4C4)
    val SurfaceCard = Color(0xFFFFFFFF)
    val SurfaceMuted = Color(0xFFF1F5F9)
    val TextPrimary = Color(0xFF0F172A)
    val TextSecondary = Color(0xFF475569)
    val DividerColor = Color(0xFFE2E8F0)

    val WarmPeachBrush = Brush.verticalGradient(listOf(Color(0xFFFFF6EB), Color(0xFFFDE6CC)))
    val SunsetRoseBrush = Brush.verticalGradient(listOf(Color(0xFFFFF1F2), Color(0xFFFECDD3)))
    val RoyalNightBrush = Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B)))
    val EmeraldMistBrush = Brush.verticalGradient(listOf(Color(0xFFECFDF5), Color(0xFFD1FAE5)))
    val SkyBreezeBrush = Brush.verticalGradient(listOf(Color(0xFFF0F9FF), Color(0xFFE0F2FE)))
}

private val CodyLightColorScheme = lightColorScheme(
    primary = CodyColors.RoyalBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0E7FF),
    onPrimaryContainer = CodyColors.RoyalBlueDark,
    secondary = CodyColors.RoyalGold,
    onSecondary = Color(0xFF1E1B0C),
    secondaryContainer = Color(0xFFFEF3C7),
    onSecondaryContainer = Color(0xFF78350F),
    background = Color(0xFFF8FAFC),
    onBackground = CodyColors.TextPrimary,
    surface = Color.White,
    onSurface = CodyColors.TextPrimary,
    surfaceVariant = CodyColors.SurfaceMuted,
    onSurfaceVariant = CodyColors.TextSecondary,
    outline = CodyColors.DividerColor,
    error = CodyColors.AuthRed,
    onError = Color.White
)

val ShatTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 26.sp,
        lineHeight = 34.sp
    ),
    headlineSmall = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 28.sp
    ),
    titleMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    titleSmall = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.5.sp,
        lineHeight = 20.sp
    ),
    labelMedium = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 11.5.sp,
        lineHeight = 16.sp
    ),
    labelSmall = TextStyle(
        fontFamily = CairoFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 10.sp,
        lineHeight = 14.sp
    )
)

@Composable
fun ShatAlGhorafTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CodyLightColorScheme,
        typography = ShatTypography,
        content = content
    )
}
