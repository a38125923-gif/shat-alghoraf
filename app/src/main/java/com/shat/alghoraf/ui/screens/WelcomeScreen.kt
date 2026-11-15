package com.shat.alghoraf.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Campaign
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.shat.alghoraf.R
import com.shat.alghoraf.data.remote.GoogleSignInButton
import com.shat.alghoraf.ui.theme.CodyColors

@Composable
fun WelcomeScreen(
    isSigningIn: Boolean,
    authError: String?,
    onClearError: () -> Unit,
    onGoogleSignInClicked: () -> Unit
) {
    var showRulesDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF0F2685), CodyColors.RoyalBlue, Color(0xFFF8FAFC))
                )
            )
            .windowInsetsPadding(WindowInsets.safeDrawing),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 520.dp)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .size(104.dp)
                    .clip(CircleShape)
                    .border(3.dp, CodyColors.RoyalGold, CircleShape)
                    .background(Color.White)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_shat_logo),
                    contentDescription = stringResource(R.string.app_name),
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "👑 ${stringResource(R.string.app_name)} المباشر",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "دردشة سحابية فورية عبر Firebase • مايكات تفاعلية • 8 رتب ملكية",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.9f),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.97f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "تسجيل الدخول الآمن",
                        style = MaterialTheme.typography.titleMedium,
                        color = CodyColors.TextPrimary,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )

                    Text(
                        text = "سجّل دخولك بحساب Google للمزامنة اللحظية لغرف الدردشة والرتب والرسائل الخاصة عبر السحابة.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF475569),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (!authError.isNullOrBlank()) {
                        Surface(
                            color = Color(0xFFFEE2E2),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = authError,
                                color = Color(0xFFB91C1C),
                                style = MaterialTheme.typography.bodySmall,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }

                    GoogleSignInButton(
                        isLoading = isSigningIn,
                        onClick = {
                            onClearError()
                            onGoogleSignInClicked()
                        }
                    )

                    Button(
                        onClick = {
                            onClearError()
                            showRulesDialog = true
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = CodyColors.AuthRed,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("btn_rules_announcements")
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Campaign,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "قوانين وإعلانات الشات",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White.copy(alpha = 0.16f)
            ) {
                Text(
                    text = "يحصل حساب المالك (a38125923@gmail.com) تلقائياً على رتبة صاحب الموقع 👑",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                )
            }
        }
    }

    if (showRulesDialog) {
        AlertDialog(
            onDismissRequest = { showRulesDialog = false },
            title = { Text("📜 قوانين وإعلانات شات الغرف", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("1. الاحترام المتبادل بين جميع الأعضاء ومنع الإساءة أو الألفاظ غير اللائقة.")
                    Text("2. يمنع نشر الروابط الإعلانية أو الترويجية داخل الغرف العامة.")
                    Text("3. الالتزام بتعليمات المراقبين والأدمن والمالك؛ المخالفة تعرضك للكتم أو الطرد أو الحظر النهائي.")
                    Text("4. 📢 إعلان: تم ربط التطبيق بقاعدة بيانات Firebase Firestore الفورية لحفظ جميع الغرف والرسائل والرتب سحابياً!")
                }
            },
            confirmButton = {
                Button(
                    onClick = { showRulesDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = CodyColors.RoyalBlue)
                ) {
                    Text("فهمت، إغلاق")
                }
            }
        )
    }
}
