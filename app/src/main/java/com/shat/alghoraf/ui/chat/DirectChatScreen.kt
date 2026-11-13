package com.shat.alghoraf.ui.chat

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shat.alghoraf.R
import com.shat.alghoraf.data.model.DirectChat
import com.shat.alghoraf.data.model.DirectMessage
import com.shat.alghoraf.data.model.ReplyTarget
import com.shat.alghoraf.data.model.UiState
import com.shat.alghoraf.ui.components.UserAvatar
import com.shat.alghoraf.ui.components.formatArabicTime
import com.shat.alghoraf.ui.theme.BorderSlate
import com.shat.alghoraf.ui.theme.BrightGold
import com.shat.alghoraf.ui.theme.CardSlate
import com.shat.alghoraf.ui.theme.CrimsonAlert
import com.shat.alghoraf.ui.theme.DeepSlate
import com.shat.alghoraf.ui.theme.ElevatedSlate
import com.shat.alghoraf.ui.theme.EmeraldSend
import com.shat.alghoraf.ui.theme.MidnightVoid
import com.shat.alghoraf.ui.theme.RoyalGold
import com.shat.alghoraf.ui.theme.SkyAccent
import com.shat.alghoraf.ui.theme.SurfaceSlate
import com.shat.alghoraf.ui.theme.TextMuted
import com.shat.alghoraf.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun DirectChatScreen(
    chat: DirectChat?,
    messagesState: UiState<List<DirectMessage>>,
    currentUserId: String,
    onBack: () -> Unit,
    onSendMessage: (content: String, replyTo: ReplyTarget?) -> Unit
) {
    BackHandler { onBack() }

    val partnerId = chat?.participantIds?.firstOrNull { it != currentUserId } ?: currentUserId
    val partnerName = chat?.participantNames?.get(partnerId) ?: "محادثة خاصة"
    val partnerAvatar = chat?.participantAvatars?.get(partnerId)

    var inputText by remember { mutableStateOf("") }
    var replyTarget by remember { mutableStateOf<ReplyTarget?>(null) }
    var showEmojiStrip by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val messages = (messagesState as? UiState.Success)?.data.orEmpty()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    val quickEmojis = listOf("😊", "😂", "❤️", "🌹", "🔥", "👍", "✨", "🤝", "💎")

    Scaffold(
        containerColor = MidnightVoid,
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeepSlate,
                    titleContentColor = BrightGold
                ),
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("dm_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "عودة")
                    }
                },
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        UserAvatar(
                            avatarOrUrl = partnerAvatar,
                            fallbackEmoji = "💎",
                            size = 38.dp
                        )
                        Column {
                            Text(
                                text = partnerName,
                                style = MaterialTheme.typography.titleMedium,
                                color = BrightGold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "محادثة خاصة آمنة 🔒",
                                style = MaterialTheme.typography.labelSmall,
                                color = SkyAccent
                            )
                        }
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .navigationBarsPadding()
                .imePadding(),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = 760.dp)
                    .fillMaxSize()
            ) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    when (messagesState) {
                        is UiState.Loading -> CircularProgressIndicator(
                            color = BrightGold,
                            modifier = Modifier.align(Alignment.Center)
                        )
                        is UiState.Error -> Text(
                            text = messagesState.message,
                            color = CrimsonAlert,
                            modifier = Modifier.align(Alignment.Center).padding(24.dp)
                        )
                        is UiState.Success -> {
                            if (messages.isEmpty()) {
                                Text(
                                    text = stringResource(R.string.no_messages_yet),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary,
                                    modifier = Modifier.align(Alignment.Center).padding(24.dp)
                                )
                            } else {
                                LazyColumn(
                                    state = listState,
                                    contentPadding = PaddingValues(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    items(messages, key = { it.id }) { msg ->
                                        val isMine = msg.senderId == currentUserId
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
                                        ) {
                                            Surface(
                                                color = if (isMine) EmeraldSend.copy(alpha = 0.18f) else CardSlate,
                                                border = BorderStroke(
                                                    1.dp,
                                                    if (isMine) EmeraldSend.copy(alpha = 0.45f) else BorderSlate
                                                ),
                                                shape = RoundedCornerShape(
                                                    topStart = 18.dp,
                                                    topEnd = 18.dp,
                                                    bottomStart = if (isMine) 18.dp else 4.dp,
                                                    bottomEnd = if (isMine) 4.dp else 18.dp
                                                ),
                                                modifier = Modifier
                                                    .widthIn(max = 310.dp)
                                                    .combinedClickable(
                                                        onClick = {},
                                                        onLongClick = {
                                                            replyTarget = ReplyTarget(msg.id, msg.senderName, msg.content)
                                                        }
                                                    )
                                            ) {
                                                Column(
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    if (!msg.replyToContent.isNullOrBlank()) {
                                                        Surface(
                                                            color = MidnightVoid.copy(alpha = 0.5f),
                                                            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.3f)),
                                                            shape = RoundedCornerShape(8.dp),
                                                            modifier = Modifier.fillMaxWidth()
                                                        ) {
                                                            Column(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) {
                                                                Text(
                                                                    text = "رد على ${msg.replyToSenderName.orEmpty()}",
                                                                    style = MaterialTheme.typography.labelSmall,
                                                                    color = BrightGold
                                                                )
                                                                Text(
                                                                    text = msg.replyToContent,
                                                                    style = MaterialTheme.typography.bodySmall,
                                                                    color = TextSecondary,
                                                                    maxLines = 1,
                                                                    overflow = TextOverflow.Ellipsis
                                                                )
                                                            }
                                                        }
                                                    }
                                                    Text(
                                                        text = msg.content,
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Text(
                                                        text = formatArabicTime(msg.createdAt),
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = TextMuted
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                AnimatedVisibility(visible = replyTarget != null) {
                    replyTarget?.let { target ->
                        Surface(
                            color = ElevatedSlate,
                            border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "الرد على ${target.senderName}:",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = BrightGold
                                    )
                                    Text(
                                        text = target.content,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                IconButton(onClick = { replyTarget = null }) {
                                    Icon(Icons.Default.Close, contentDescription = "إلغاء الرد")
                                }
                            }
                        }
                    }
                }

                AnimatedVisibility(visible = showEmojiStrip) {
                    Surface(color = SurfaceSlate, modifier = Modifier.fillMaxWidth()) {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(quickEmojis) { emoji ->
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(CardSlate)
                                        .clickable { inputText += emoji },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(text = emoji, fontSize = 20.sp)
                                }
                            }
                        }
                    }
                }

                Surface(
                    color = DeepSlate,
                    border = BorderStroke(1.dp, BorderSlate),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        IconButton(
                            onClick = { showEmojiStrip = !showEmojiStrip },
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                Icons.Default.EmojiEmotions,
                                contentDescription = "الرموز التعبيرية",
                                tint = if (showEmojiStrip) BrightGold else TextSecondary
                            )
                        }

                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it.take(1000) },
                            placeholder = { Text(stringResource(R.string.type_message_hint)) },
                            maxLines = 4,
                            shape = RoundedCornerShape(22.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = SurfaceSlate,
                                unfocusedContainerColor = SurfaceSlate,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = BorderSlate
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("dm_message_input")
                        )

                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank()) {
                                    onSendMessage(inputText, replyTarget)
                                    inputText = ""
                                    replyTarget = null
                                }
                            },
                            enabled = inputText.isNotBlank(),
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (inputText.isNotBlank()) EmeraldSend else ElevatedSlate)
                                .testTag("dm_send_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = stringResource(R.string.send_message),
                                tint = MaterialTheme.colorScheme.onSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}
