package com.shat.alghoraf.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

private val ShatDarkColorScheme = darkColorScheme(
    primary = RoyalGold,
    onPrimary = MidnightVoid,
    primaryContainer = GoldContainer,
    onPrimaryContainer = SoftGold,
    secondary = EmeraldSend,
    onSecondary = TextPrimary,
    secondaryContainer = CardSlate,
    onSecondaryContainer = TextPrimary,
    tertiary = SkyAccent,
    onTertiary = MidnightVoid,
    background = MidnightVoid,
    onBackground = TextPrimary,
    surface = DeepSlate,
    onSurface = TextPrimary,
    surfaceVariant = CardSlate,
    onSurfaceVariant = TextSecondary,
    surfaceContainerLow = SurfaceSlate,
    surfaceContainer = CardSlate,
    surfaceContainerHigh = ElevatedSlate,
    outline = BorderSlate,
    error = CrimsonAlert,
    onError = TextPrimary,
    errorContainer = CrimsonContainer,
    onErrorContainer = TextPrimary
)

private val ShatShapes = Shapes(
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun ShatAlghorafTheme(
    content: @Composable () -> Unit
) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = ShatDarkColorScheme,
            typography = ShatTypography,
            shapes = ShatShapes,
            content = content
        )
    }
}
