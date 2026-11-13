package com.shat.alghoraf.ui.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.shat.alghoraf.data.model.PublicProfile
import com.shat.alghoraf.ui.components.RoleBadge
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.EmeraldOnline
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.TextSecondary

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileEditDialog(
    profile: PublicProfile,
    onSave: (displayName: String, bio: String, avatarEmoji: String, status: String) -> Unit,
    onDismiss: () -> Unit
) {
    var displayName by remember(profile) { mutableStateOf(profile.displayName) }
    var bio by remember(profile) { mutableStateOf(profile.bio.orEmpty()) }
    var selectedEmoji by remember(profile) {
        mutableStateOf(profile.avatarEmoji ?: profile.roleEnum.badgeEmoji)
    }
    var selectedStatus by remember(profile) { mutableStateOf(profile.status) }
    var nameError by remember { mutableStateOf<String?>(null) }

    val royalEmojis = listOf("👑", "🦅", "🦁", "🐺", "💎", "⚡", "🌟", "🌹", "🛡️", "🕊️", "🔥", "🌸")

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            color = DeepSlate,
            shape = MaterialTheme.shapes.large,
            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.35f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "تعديل الملف الشخصي",
                        style = MaterialTheme.typography.titleMedium,
                        color = BrightGold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق")
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    UserAvatar(
                        avatarOrUrl = profile.photoUrl ?: selectedEmoji,
                        fallbackEmoji = selectedEmoji,
                        size = 76.dp,
                        showOnlineDot = true,
                        isOnline = selectedStatus == "online"
                    )
                    RoleBadge(profile.roleEnum)
                }

                OutlinedTextField(
                    value = displayName,
                    onValueChange = {
                        displayName = it.take(40)
                        nameError = null
                    },
                    label = { Text("الاسم المستعار في الشات") },
                    singleLine = true,
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it) } },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RoyalGold,
                        unfocusedBorderColor = BorderSlate
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_name_input")
                )

                OutlinedTextField(
                    value = bio,
                    onValueChange = { bio = it.take(160) },
                    label = { Text("الحالة / النبذة الشخصية") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RoyalGold,
                        unfocusedBorderColor = BorderSlate
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_bio_input")
                )

                Text(
                    text = "الحالة:",
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatusChoiceChip(
                        label = "متاح الآن 🟢",
                        selected = selectedStatus == "online",
                        onClick = { selectedStatus = "online" },
                        modifier = Modifier.weight(1f)
                    )
                    StatusChoiceChip(
                        label = "مشغول 🟡",
                        selected = selectedStatus == "away",
                        onClick = { selectedStatus = "away" },
                        modifier = Modifier.weight(1f)
                    )
                }

                Text(
                    text = "الرمز الملكي:",
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    royalEmojis.forEach { emoji ->
                        val isSelected = selectedEmoji == emoji
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) RoyalGold.copy(alpha = 0.2f) else CardSlate)
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) BrightGold else BorderSlate,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable { selectedEmoji = emoji },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = emoji, fontSize = 22.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        if (displayName.trim().length < 2) {
                            nameError = "يجب أن يكون الاسم حرفين على الأقل"
                        } else {
                            onSave(displayName, bio, selectedEmoji, selectedStatus)
                            onDismiss()
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldSend),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("save_profile_button")
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.size(6.dp))
                    Text("حفظ التعديلات", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun StatusChoiceChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        color = if (selected) EmeraldOnline.copy(alpha = 0.16f) else CardSlate,
        border = BorderStroke(1.dp, if (selected) EmeraldOnline else BorderSlate),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.height(48.dp)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = if (selected) EmeraldOnline else TextSecondary
            )
        }
    }
}
