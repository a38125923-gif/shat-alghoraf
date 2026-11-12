package com.example.ui.screens

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.example.R
import com.example.data.model.UserProfile
import com.example.data.model.UserRole
import com.example.ui.theme.GoldenBadgeBg
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleOwnerGold
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.Companion.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
import com.google.firebase.Firebase
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// Specific theme colors requested
val VibrantGreen = Color(0xFF76B82A)
val DarkCharcoal = Color(0xFF222222)
val GoldenOrange = Color(0xFFF5A623)
val CrimsonRed = Color(0xFFB80000)

@Composable
fun AuthScreen(
  onAuthSuccess: () -> Unit,
  onCustomAuthSuccess: (UserProfile) -> Unit = {}
) {
  val context = LocalContext.current
  val coroutineScope = rememberCoroutineScope()
  val credentialManager = remember { CredentialManager.create(context) }

  var isLoading by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  // Dialog States
  var showLoginDialog by remember { mutableStateOf(false) }
  var showGuestDialog by remember { mutableStateOf(false) }
  var showRegisterDialog by remember { mutableStateOf(false) }
  var showMagazineDialog by remember { mutableStateOf(false) }

  // Auto-attempt silent sign-in
  LaunchedEffect(Unit) {
    attemptAutoSignIn(
      context = context,
      credentialManager = credentialManager,
      onAuthSuccess = onAuthSuccess,
      onUnauthenticated = {},
      scope = coroutineScope
    )
  }

  Surface(
    modifier = Modifier.fillMaxSize(),
    color = Color(0xFF0A0F1D)
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
    ) {
      // -------------------------------------------------------------------------------------------
      // 1. Dark Hero Section with Blurred luxury background & Stacked Pill Buttons
      // -------------------------------------------------------------------------------------------
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .background(
            Brush.verticalGradient(
              colors = listOf(
                Color(0xFF060B17),
                Color(0xFF0F172A),
                Color(0xFF1E293B)
              )
            )
          )
          .padding(horizontal = 20.dp, vertical = 28.dp),
        contentAlignment = Alignment.Center
      ) {
        Column(
          modifier = Modifier.fillMaxWidth(),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          // Logo Emblem with Golden Ring
          Box(
            modifier = Modifier
              .size(96.dp)
              .clip(CircleShape)
              .border(2.5.dp, GoldenCrown, CircleShape)
              .background(Color(0xFF0F172A))
              .padding(3.dp),
            contentAlignment = Alignment.Center
          ) {
            Image(
              painter = painterResource(id = R.drawable.chat_rooms_icon_1794340500133),
              contentDescription = "شعار شات الغرف",
              modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
            )
          }

          Spacer(modifier = Modifier.height(14.dp))

          Text(
            text = "شات الغرف",
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
            color = GoldenCrown,
            letterSpacing = 1.sp
          )

          Spacer(modifier = Modifier.height(4.dp))

          Text(
            text = "أكبر تجمع دردشة كتابية وصوتية عربية — أهلاً وسهلاً بكم",
            fontSize = 13.sp,
            color = Color(0xFF94A3B8),
            textAlign = TextAlign.Center
          )

          Spacer(modifier = Modifier.height(26.dp))

          // ---------------------------------------------------------------------------------------
          // 4 Stacked Pill Buttons (Centered, Rounded-Full, Wide with icons)
          // ---------------------------------------------------------------------------------------

          // Button 1: Vibrant Green (#76b82a) - "دخول" with paper-plane send icon
          Button(
            onClick = { showLoginDialog = true },
            modifier = Modifier
              .fillMaxWidth(0.88f)
              .height(52.dp)
              .testTag("login_pill_button"),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = VibrantGreen),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center
            ) {
              Icon(
                imageVector = Icons.AutoMirrored.Filled.Send,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
              )
              Spacer(modifier = Modifier.width(10.dp))
              Text(
                text = "دخول",
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          Spacer(modifier = Modifier.height(12.dp))

          // Button 2: Dark Charcoal (#222222) - "دخول الزوار" with guest icon
          Button(
            onClick = { showGuestDialog = true },
            modifier = Modifier
              .fillMaxWidth(0.88f)
              .height(52.dp)
              .testTag("guest_pill_button"),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkCharcoal),
            border = androidx.compose.foundation.BorderStroke(1.2.dp, Color(0xFF475569)),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center
            ) {
              Icon(
                imageVector = Icons.Default.Group,
                contentDescription = null,
                tint = Color(0xFFE2E8F0),
                modifier = Modifier.size(20.dp)
              )
              Spacer(modifier = Modifier.width(10.dp))
              Text(
                text = "دخول الزوار",
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          Spacer(modifier = Modifier.height(12.dp))

          // Button 3: Golden Orange (#f5a623) - "تسجيل عضوية مجانية +" with user-plus icon
          Button(
            onClick = { showRegisterDialog = true },
            modifier = Modifier
              .fillMaxWidth(0.88f)
              .height(52.dp)
              .testTag("register_pill_button"),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = GoldenOrange),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center
            ) {
              Icon(
                imageVector = Icons.Default.PersonAdd,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
              )
              Spacer(modifier = Modifier.width(10.dp))
              Text(
                text = "تسجيل عضوية مجانية +",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          Spacer(modifier = Modifier.height(12.dp))

          // Button 4: Crimson Red (#b80000) - "مجلة شات الغرف" with download/info icon
          Button(
            onClick = { showMagazineDialog = true },
            modifier = Modifier
              .fillMaxWidth(0.88f)
              .height(52.dp)
              .testTag("magazine_pill_button"),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center
            ) {
              Icon(
                imageVector = Icons.Default.MenuBook,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
              )
              Spacer(modifier = Modifier.width(10.dp))
              Text(
                text = "مجلة شات الغرف",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
              )
            }
          }

          Spacer(modifier = Modifier.height(18.dp))

          // Bottom Link: "جديد هنا ؟ سجل الآن"
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.testTag("new_here_link_row")
          ) {
            Text(
              text = "جديد هنا ؟",
              color = Color(0xFFCBD5E1),
              fontSize = 13.sp
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
              text = "سجل الآن",
              color = Color.White,
              fontWeight = FontWeight.Bold,
              fontSize = 15.sp,
              textDecoration = TextDecoration.Underline,
              modifier = Modifier
                .clickable { showRegisterDialog = true }
                .padding(4.dp)
                .testTag("register_now_text_link")
            )
          }

          if (errorMessage != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
              text = errorMessage!!,
              color = Color(0xFFF87171),
              fontSize = 12.sp,
              textAlign = TextAlign.Center
            )
          }
        }
      }

      // -------------------------------------------------------------------------------------------
      // 2. Lower Section: Clean White Card titled "قصص نجاح وأخبار شات الغرف" in dark red bold
      // -------------------------------------------------------------------------------------------
      Card(
        modifier = Modifier
          .fillMaxWidth()
          .testTag("news_and_stories_card"),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
        ) {
          Text(
            text = "قصص نجاح وأخبار شات الغرف",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = CrimsonRed
          )

          Text(
            text = "مجتمع عربي راقي يجمع الآلاف يومياً في حوارات هادفة وصداقات حقيقية",
            fontSize = 12.sp,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
          )

          HorizontalDivider(color = Color(0xFFF1F5F9))

          Spacer(modifier = Modifier.height(14.dp))

          // Story Item 1
          StoryNewsItem(
            icon = Icons.Default.Star,
            iconColor = RoleOwnerGold,
            title = "مسابقة الأثرياء والكبار الأسبوعية 💎",
            body = "تتويج المالك والمشرفين الأكثر تفاعلاً في منصة المايكات الصوتية، وتقديم شارات التميز الملكية وتيجان الحضور الذهبي للأعضاء المتألقين."
          )

          Spacer(modifier = Modifier.height(14.dp))

          // Story Item 2
          StoryNewsItem(
            icon = Icons.Default.Group,
            iconColor = Color(0xFF0284C7),
            title = "أكثر من 20 غرفة دردشة متخصصة 🌐",
            body = "تنوع كبير بين الغرفة العامة، وغرفة اليمن أصل العرب، وغرفة السعودية والخليج، وغرفة المعلمين والثقافة، لتلبي كافة الاهتمامات برقي واحترام."
          )

          Spacer(modifier = Modifier.height(14.dp))

          // Story Item 3
          StoryNewsItem(
            icon = Icons.Default.Security,
            iconColor = VibrantGreen,
            title = "أمان وإشراف مباشر على مدار الساعة 🛡️",
            body = "فريق إشراف وإدارة متكامل يضمن سلامة الحوار ومنع أي إساءات أو مضايقات، مع تحكم فوري للمالك بحذف الرسائل وكتم وحظر المخالفين."
          )

          Spacer(modifier = Modifier.height(18.dp))

          // Owner Note Card
          Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = GoldenBadgeBg),
            border = androidx.compose.foundation.BorderStroke(1.dp, GoldenBorder),
            modifier = Modifier.fillMaxWidth()
          ) {
            Row(
              modifier = Modifier.padding(12.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Icon(Icons.Default.Star, contentDescription = null, tint = GoldenCrown, modifier = Modifier.size(20.dp))
              Spacer(modifier = Modifier.width(10.dp))
              Column {
                Text(
                  text = "إشراف المالك العام: a38125923@gmail.com 👑",
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFFB45309)
                )
                Text(
                  text = "صلاحيات مالك كاملة لإدارة الغرف، تعيين المشرفين، ورعاية مجتمع الدردشة.",
                  fontSize = 11.sp,
                  color = Color(0xFF78350F)
                )
              }
            }
          }
        }
      }
    }
  }

  // ===============================================================================================
  // Dialog 1: "دخول" Login Form (Email/Username & Password + Google Sign-In + Owner PIN)
  // ===============================================================================================
  if (showLoginDialog) {
    var loginIdentifier by remember { mutableStateOf("a38125923@gmail.com") }
    var loginPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    Dialog(
      onDismissRequest = { showLoginDialog = false },
      properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
      Card(
        modifier = Modifier
          .fillMaxWidth(0.92f)
          .padding(vertical = 20.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, tint = VibrantGreen)
              Spacer(modifier = Modifier.width(8.dp))
              Text("تسجيل الدخول", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            IconButton(onClick = { showLoginDialog = false }) {
              Icon(Icons.Default.Close, contentDescription = "إغلاق")
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          // Quick Google Sign-In Button
          Button(
            onClick = {
              isLoading = true
              errorMessage = null
              onGoogleSignInClicked(
                context = context,
                credentialManager = credentialManager,
                onAuthSuccess = {
                  isLoading = false
                  showLoginDialog = false
                  onAuthSuccess()
                },
                onAuthError = { msg ->
                  isLoading = false
                  errorMessage = msg
                },
                scope = coroutineScope,
                onAuthCancelled = { isLoading = false }
              )
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4285F4))
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.Group, contentDescription = null, modifier = Modifier.size(18.dp))
              Spacer(modifier = Modifier.width(8.dp))
              Text("الدخول السريع عبر Google", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
          ) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text("  أو ببيانات العضوية والمالك  ", fontSize = 11.sp, color = Color.Gray)
            HorizontalDivider(modifier = Modifier.weight(1f))
          }

          Spacer(modifier = Modifier.height(14.dp))

          // Username or Email
          OutlinedTextField(
            value = loginIdentifier,
            onValueChange = { loginIdentifier = it },
            label = { Text("البريد الإلكتروني أو اسم المستخدم") },
            placeholder = { Text("مثال: a38125923@gmail.com") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = VibrantGreen) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(10.dp))

          // Password or Owner PIN
          OutlinedTextField(
            value = loginPassword,
            onValueChange = { loginPassword = it },
            label = { Text("كلمة المرور أو الرمز السري للمالك") },
            placeholder = { Text("الرمز السري للمالك: 2026") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = VibrantGreen) },
            trailingIcon = {
              IconButton(onClick = { passwordVisible = !passwordVisible }) {
                Icon(
                  imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                  contentDescription = null
                )
              }
            },
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(16.dp))

          Button(
            onClick = {
              val isOwner = loginIdentifier.contains("a38125923@gmail.com") || loginPassword == "2026"
              val profile = UserProfile(
                userId = if (isOwner) "owner_a38125923" else "user_${System.currentTimeMillis()}",
                displayName = if (isOwner) "المالك 👑" else loginIdentifier.substringBefore("@"),
                email = if (isOwner) "a38125923@gmail.com" else loginIdentifier,
                photoUrl = if (isOwner) "👑" else "👤",
                globalRole = if (isOwner) "owner" else "member",
                status = "online"
              )
              showLoginDialog = false
              onCustomAuthSuccess(profile)
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = VibrantGreen)
          ) {
            Text("تسجيل الدخول الآن 🚀", fontWeight = FontWeight.Bold, fontSize = 15.sp)
          }
        }
      }
    }
  }

  // ===============================================================================================
  // Dialog 2: "دخول الزوار" Guest Login Popup (Nickname & Gender)
  // ===============================================================================================
  if (showGuestDialog) {
    var guestNickname by remember { mutableStateOf("") }
    var guestGender by remember { mutableStateOf("ذكر") } // "ذكر" or "أنثى"

    Dialog(
      onDismissRequest = { showGuestDialog = false },
      properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
      Card(
        modifier = Modifier
          .fillMaxWidth(0.9f)
          .padding(vertical = 20.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp)
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.Group, contentDescription = null, tint = Color(0xFF0284C7))
              Spacer(modifier = Modifier.width(8.dp))
              Text("دخول الزوار السريع", fontWeight = FontWeight.Bold, fontSize = 17.sp)
            }
            IconButton(onClick = { showGuestDialog = false }) {
              Icon(Icons.Default.Close, contentDescription = "إغلاق")
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          Text("أدخل اسمك المستعار للدخول مباشرة بدون تسجيل:", fontSize = 13.sp, color = Color(0xFF64748B))

          Spacer(modifier = Modifier.height(10.dp))

          OutlinedTextField(
            value = guestNickname,
            onValueChange = { guestNickname = it },
            label = { Text("الاسم المستعار (اللقب في الشات)") },
            placeholder = { Text("مثال: زائر لطيف، النورس...") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(12.dp))

          Text("الجنس:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
          Spacer(modifier = Modifier.height(6.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            FilterChip(
              selected = guestGender == "ذكر",
              onClick = { guestGender = "ذكر" },
              label = { Text("ذكر 👦", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
              modifier = Modifier.weight(1f)
            )
            FilterChip(
              selected = guestGender == "أنثى",
              onClick = { guestGender = "أنثى" },
              label = { Text("أنثى 👧", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
              modifier = Modifier.weight(1f)
            )
          }

          Spacer(modifier = Modifier.height(18.dp))

          Button(
            onClick = {
              val name = guestNickname.trim().ifBlank { "زائر ${System.currentTimeMillis() % 1000}" }
              val profile = UserProfile(
                userId = "guest_${System.currentTimeMillis()}",
                displayName = name,
                email = "guest@chat.local",
                photoUrl = if (guestGender == "أنثى") "👧" else "👦",
                globalRole = "member",
                status = "online"
              )
              showGuestDialog = false
              onCustomAuthSuccess(profile)
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkCharcoal)
          ) {
            Text("دخول الشات كزائر فوراً 🏃‍♂️", fontWeight = FontWeight.Bold, fontSize = 15.sp)
          }
        }
      }
    }
  }

  // ===============================================================================================
  // Dialog 3: "تسجيل عضوية مجانية +" Registration Form
  // ===============================================================================================
  if (showRegisterDialog) {
    var regUsername by remember { mutableStateOf("") }
    var regEmail by remember { mutableStateOf("") }
    var regPassword by remember { mutableStateOf("") }
    var regGender by remember { mutableStateOf("ذكر") }

    Dialog(
      onDismissRequest = { showRegisterDialog = false },
      properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
      Card(
        modifier = Modifier
          .fillMaxWidth(0.92f)
          .padding(vertical = 20.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.PersonAdd, contentDescription = null, tint = GoldenOrange)
              Spacer(modifier = Modifier.width(8.dp))
              Text("تسجيل عضوية مجانية", fontWeight = FontWeight.Bold, fontSize = 17.sp)
            }
            IconButton(onClick = { showRegisterDialog = false }) {
              Icon(Icons.Default.Close, contentDescription = "إغلاق")
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          OutlinedTextField(
            value = regUsername,
            onValueChange = { regUsername = it },
            label = { Text("اسم المستخدم") },
            placeholder = { Text("مثال: الفارس الذهبي") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(10.dp))

          OutlinedTextField(
            value = regEmail,
            onValueChange = { regEmail = it },
            label = { Text("البريد الإلكتروني") },
            placeholder = { Text("email@example.com") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(10.dp))

          OutlinedTextField(
            value = regPassword,
            onValueChange = { regPassword = it },
            label = { Text("كلمة المرور") },
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )

          Spacer(modifier = Modifier.height(12.dp))

          Text("الجنس:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
          Spacer(modifier = Modifier.height(6.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            FilterChip(
              selected = regGender == "ذكر",
              onClick = { regGender = "ذكر" },
              label = { Text("ذكر 👦", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
              modifier = Modifier.weight(1f)
            )
            FilterChip(
              selected = regGender == "أنثى",
              onClick = { regGender = "أنثى" },
              label = { Text("أنثى 👧", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
              modifier = Modifier.weight(1f)
            )
          }

          Spacer(modifier = Modifier.height(18.dp))

          Button(
            onClick = {
              val name = regUsername.trim().ifBlank { "عضو جديد" }
              val isOwner = regEmail.contains("a38125923@gmail.com")
              val profile = UserProfile(
                userId = "user_${System.currentTimeMillis()}",
                displayName = name,
                email = regEmail.ifBlank { "member@chat.local" },
                photoUrl = if (isOwner) "👑" else if (regGender == "أنثى") "🌹" else "💎",
                globalRole = if (isOwner) "owner" else "member",
                status = "online"
              )
              showRegisterDialog = false
              onCustomAuthSuccess(profile)
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = GoldenOrange)
          ) {
            Text("إنشاء العضوية والانضمام للشات 🎉", fontWeight = FontWeight.Bold, fontSize = 15.sp)
          }
        }
      }
    }
  }

  // ===============================================================================================
  // Dialog 4: "مجلة شات الغرف" Magazine & Rules Popup
  // ===============================================================================================
  if (showMagazineDialog) {
    Dialog(
      onDismissRequest = { showMagazineDialog = false },
      properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
      Card(
        modifier = Modifier
          .fillMaxWidth(0.92f)
          .padding(vertical = 20.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
      ) {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
              Icon(Icons.Default.MenuBook, contentDescription = null, tint = CrimsonRed)
              Spacer(modifier = Modifier.width(8.dp))
              Text("مجلة وقوانين شات الغرف", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = CrimsonRed)
            }
            IconButton(onClick = { showMagazineDialog = false }) {
              Icon(Icons.Default.Close, contentDescription = "إغلاق")
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          Text(
            text = "📜 ميثاق الأخلاق والقوانين الرسمية:",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
          )
          Spacer(modifier = Modifier.height(8.dp))

          listOf(
            "1. الالتزام بالأخلاق والآداب العامة واحترام جميع الأعضاء والزوار.",
            "2. يمنع منعاً باتاً نشر الروابط الخارجية أو الإعلانات المزعجة (سبام).",
            "3. منصة المايكات الصوتية مخصصة للمشاركات الهادفة والترحيبية والقصائد.",
            "4. يحق للمالك والمشرفين كتم أو حظر أي عضو يتجاوز اللباقة فورياً.",
            "5. الخصوصية خط أحمر، ولا يسمح بمشاركة أرقام أو بيانات شخصية."
          ).forEach { rule ->
            Text(rule, fontSize = 12.sp, color = Color(0xFF334155), modifier = Modifier.padding(vertical = 2.dp))
          }

          Spacer(modifier = Modifier.height(14.dp))
          HorizontalDivider()
          Spacer(modifier = Modifier.height(14.dp))

          Text(
            text = "👑 رتب الشات والترقيات:",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
          )
          Spacer(modifier = Modifier.height(6.dp))
          Text(
            text = "• المالك 👑: صاحب الغرفة والتحكم الشامل.\n• الأدمن 🛡️ والمشرفين ⚔️: حماية الروم وتطبيق النظام.\n• الكبار والأثرياء 💎: شارات ذهبية للأعضاء الأكثر نشاطاً.",
            fontSize = 12.sp,
            color = Color(0xFF475569),
            lineHeight = 18.sp
          )

          Spacer(modifier = Modifier.height(18.dp))

          Button(
            onClick = { showMagazineDialog = false },
            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
          ) {
            Text("فهمت وموافق على الشروط", fontWeight = FontWeight.Bold)
          }
        }
      }
    }
  }
}

@Composable
private fun StoryNewsItem(
  icon: ImageVector,
  iconColor: Color,
  title: String,
  body: String
) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    verticalAlignment = Alignment.Top
  ) {
    Box(
      modifier = Modifier
        .size(38.dp)
        .clip(CircleShape)
        .background(iconColor.copy(alpha = 0.15f)),
      contentAlignment = Alignment.Center
    ) {
      Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
    }
    Spacer(modifier = Modifier.width(12.dp))
    Column(modifier = Modifier.weight(1f)) {
      Text(text = title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF0F172A))
      Spacer(modifier = Modifier.height(3.dp))
      Text(text = body, fontSize = 12.sp, color = Color(0xFF475569), lineHeight = 17.sp)
    }
  }
}

fun attemptAutoSignIn(
  context: Context,
  credentialManager: CredentialManager,
  onAuthSuccess: () -> Unit,
  onUnauthenticated: () -> Unit,
  scope: CoroutineScope
) {
  if (Firebase.auth.currentUser != null) {
    onAuthSuccess()
    return
  }
  val clientId = try {
    context.getString(R.string.default_web_client_id)
  } catch (e: Exception) {
    onUnauthenticated()
    return
  }

  val googleIdOption = GetGoogleIdOption.Builder()
    .setFilterByAuthorizedAccounts(true)
    .setServerClientId(clientId)
    .setAutoSelectEnabled(true)
    .build()

  val request = GetCredentialRequest.Builder().addCredentialOption(googleIdOption).build()

  scope.launch {
    try {
      val result = credentialManager.getCredential(context, request)
      val credential = result.credential
      if (credential is CustomCredential && credential.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
        val googleIdToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
        val authCredential = GoogleAuthProvider.getCredential(googleIdToken, null)
        Firebase.auth.signInWithCredential(authCredential).await()
        onAuthSuccess()
      } else {
        onUnauthenticated()
      }
    } catch (_: Exception) {
      onUnauthenticated()
    }
  }
}

fun onGoogleSignInClicked(
  context: Context,
  credentialManager: CredentialManager,
  onAuthSuccess: () -> Unit,
  onAuthError: (String) -> Unit,
  scope: CoroutineScope,
  onAuthCancelled: () -> Unit = {}
) {
  val clientId = try {
    context.getString(R.string.default_web_client_id)
  } catch (e: Exception) {
    onAuthError("إعدادات Google Sign-In غير متوفرة")
    return
  }

  val signInOption = GetSignInWithGoogleOption.Builder(serverClientId = clientId).build()
  val request = GetCredentialRequest.Builder().addCredentialOption(signInOption).build()

  scope.launch {
    try {
      val result = credentialManager.getCredential(context as Activity, request)
      val credential = result.credential
      if (credential is CustomCredential && credential.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
        val googleIdToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
        val authCredential = GoogleAuthProvider.getCredential(googleIdToken, null)
        Firebase.auth.signInWithCredential(authCredential).await()
        onAuthSuccess()
      } else {
        onAuthError("نوع بيانات الاعتماد غير متوقع")
      }
    } catch (e: GetCredentialCancellationException) {
      Log.w("Auth", "Google Sign-In flow cancelled: ${e.message}", e)
      onAuthCancelled()
    } catch (e: Exception) {
      Log.e("Auth", "Google Sign-In failed", e)
      onAuthError(e.localizedMessage ?: "فشل تسجيل الدخول")
    }
  }
}
