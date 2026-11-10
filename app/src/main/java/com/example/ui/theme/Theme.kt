package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
  primary = PrimaryIndigoLight,
  onPrimary = Color.White,
  primaryContainer = SurfaceDarkCard,
  onPrimaryContainer = Color.White,
  secondary = SecondaryCyan,
  onSecondary = Color.Black,
  background = BackgroundDark,
  surface = SurfaceDark,
  onBackground = Color(0xFFF1F5F9),
  onSurface = Color(0xFFF1F5F9),
  surfaceVariant = SurfaceDarkCard,
  onSurfaceVariant = Color(0xFFCBD5E1)
)

private val LightColorScheme = lightColorScheme(
  primary = PrimaryIndigo,
  onPrimary = Color.White,
  primaryContainer = Color(0xFFE0E7FF),
  onPrimaryContainer = PrimaryIndigo,
  secondary = SecondaryCyan,
  onSecondary = Color.White,
  background = Color(0xFFF8FAFC),
  surface = Color.White,
  onBackground = Color(0xFF0F172A),
  onSurface = Color(0xFF0F172A),
  surfaceVariant = Color(0xFFF1F5F9),
  onSurfaceVariant = Color(0xFF475569)
)

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false, // Use our rich theme palette by default
  content: @Composable () -> Unit,
) {
  val colorScheme = when {
    dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
      val context = LocalContext.current
      if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    }
    darkTheme -> DarkColorScheme
    else -> LightColorScheme
  }

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content
  )
}
