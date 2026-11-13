package com.shat.alghoraf.ui.ban

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.shat.alghoraf.R
import com.shat.alghoraf.data.model.BanRecord
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.CrimsonContainer
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.ElevatedSlate
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.TextSecondary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun GlobalBanScreen(
    ban: BanRecord,
    onSignOut: () -> Unit
) {
    val expiryLabel = if (ban.isPermanent) {
        "حظر شامل دائم"
    } else {
        val fmt = SimpleDateFormat("hh:mm a - yyyy/MM/dd", Locale("ar"))
        "ينتهي في: ${fmt.format(Date(ban.expiresAtMillis))}"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MidnightVoid)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = DeepSlate),
            border = BorderStroke(1.dp, CrimsonAlert.copy(alpha = 0.5f)),
            shape = MaterialTheme.shapes.large,
            modifier = Modifier.widthIn(max = 440.dp).fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(CircleShape)
                        .background(CrimsonContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Block,
                        contentDescription = null,
                        tint = CrimsonAlert,
                        modifier = Modifier.size(38.dp)
                    )
                }

                Text(
                    text = "تم تقييد حسابك في الشات",
                    style = MaterialTheme.typography.titleLarge,
                    color = CrimsonAlert,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "تم حظر حساب (${ban.targetName}) من دخول غرف الدردشة بواسطة الإدارة.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )

                Surface(
                    color = CardSlate,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        BanInfoRow("النوع", expiryLabel)
                        BanInfoRow("السبب", ban.reason)
                        BanInfoRow("بواسطة", ban.bannedByName)
                    }
                }

                Surface(
                    color = ElevatedSlate,
                    shape = MaterialTheme.shapes.small,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = BrightGold,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "للمراجعة يمكنك التواصل مع إدارة شات الغرف.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = onSignOut,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElevatedSlate),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("ban_sign_out_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                    Spacer(modifier = Modifier.size(8.dp))
                    Text(text = stringResource(R.string.sign_out), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun BanInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, color = TextSecondary)
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = BrightGold
        )
    }
}
