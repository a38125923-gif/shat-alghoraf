package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.BanRecord
import com.example.data.model.Room
import com.example.data.model.UserProfile
import com.example.data.model.UserRole
import com.example.ui.components.RoleBadge
import com.example.ui.theme.GoldenBadgeBg
import com.example.ui.theme.GoldenBorder
import com.example.ui.theme.GoldenCrown
import com.example.ui.theme.RoleAdminPurple
import com.example.ui.theme.RoleBannedRed
import com.example.ui.theme.RoleModeratorBlue
import com.example.ui.theme.RoleMutedAmber
import com.example.ui.theme.RoleOwnerGold
import com.example.ui.viewmodel.ChatViewModel

@Composable
fun OwnerMasterControlDialog(
  viewModel: ChatViewModel,
  onDismiss: () -> Unit,
  onEditRoom: (Room) -> Unit
) {
  val rooms by viewModel.rooms.collectAsState()
  val allUsers by viewModel.allUsers.collectAsState()
  val globalBans by viewModel.globalBans.collectAsState()
  val roomBans by viewModel.roomBans.collectAsState()

  var selectedTabIndex by remember { mutableIntStateOf(0) }
  var broadcastText by remember { mutableStateOf("") }
  var userSearchQuery by remember { mutableStateOf("") }

  Dialog(
    onDismissRequest = onDismiss,
    properties = DialogProperties(usePlatformDefaultWidth = false)
  ) {
    Card(
      modifier = Modifier
        .fillMaxWidth(0.95f)
        .padding(vertical = 16.dp)
        .testTag("owner_master_control_dialog"),
      shape = RoundedCornerShape(24.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(18.dp)
      ) {
        // Master Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .border(2.dp, GoldenCrown, CircleShape)
                .background(Color(0xFF0F172A)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = GoldenCrown,
                modifier = Modifier.size(24.dp)
              )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
              Text(
                text = "لوحة تحكم المالك الرئيسية 👑",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFB45309)
              )
              Text(
                text = "تحكم شامل وكامل في جميع الغرف والمستخدمين والرتب",
                fontSize = 11.sp,
                color = Color(0xFF64748B)
              )
            }
          }

          IconButton(onClick = onDismiss) {
            Icon(Icons.Default.Close, contentDescription = "إغلاق")
          }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Tabs: الغرف | المستخدمين | المحظورين | الإذاعة
        TabRow(
          selectedTabIndex = selectedTabIndex,
          containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
          contentColor = MaterialTheme.colorScheme.primary
        ) {
          Tab(
            selected = selectedTabIndex == 0,
            onClick = { selectedTabIndex = 0 },
            text = { Text("الغرف (${rooms.size})", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
          Tab(
            selected = selectedTabIndex == 1,
            onClick = { selectedTabIndex = 1 },
            text = { Text("المستخدمين والرتب", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
          Tab(
            selected = selectedTabIndex == 2,
            onClick = { selectedTabIndex = 2 },
            text = { Text("المحظورين", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
          Tab(
            selected = selectedTabIndex == 3,
            onClick = { selectedTabIndex = 3 },
            text = { Text("بث إداري 📢", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
          )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Box(
          modifier = Modifier
            .fillMaxWidth()
            .weight(1f, fill = false)
            .verticalScroll(rememberScrollState())
        ) {
          when (selectedTabIndex) {
            0 -> {
              // Manage All Rooms
              Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                  text = "إدارة غرف الدردشة بالكامل (قفل، تعديل، حذف)",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                rooms.forEach { room ->
                  Card(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                  ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                      Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                      ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                          Text(
                            text = room.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                          )
                          Spacer(modifier = Modifier.width(6.dp))
                          if (room.isLocked) {
                            Text("🔒 مقفلة", fontSize = 11.sp, color = RoleMutedAmber)
                          }
                        }
                        Text(
                          text = "المالك: ${room.ownerName}",
                          fontSize = 11.sp,
                          color = Color(0xFF64748B)
                        )
                      }

                      Spacer(modifier = Modifier.height(8.dp))

                      Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                      ) {
                        // Toggle Lock
                        OutlinedButton(
                          onClick = { viewModel.toggleRoomLock(room.id, !room.isLocked) },
                          modifier = Modifier.weight(1f)
                        ) {
                          Icon(
                            imageVector = if (room.isLocked) Icons.Default.LockOpen else Icons.Default.Lock,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                          )
                          Spacer(modifier = Modifier.width(4.dp))
                          Text(if (room.isLocked) "فتح" else "قفل", fontSize = 11.sp)
                        }

                        // Edit
                        OutlinedButton(
                          onClick = {
                            onDismiss()
                            onEditRoom(room)
                          },
                          modifier = Modifier.weight(1f)
                        ) {
                          Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                          Spacer(modifier = Modifier.width(4.dp))
                          Text("تعديل", fontSize = 11.sp)
                        }

                        // Delete
                        Button(
                          onClick = { viewModel.deleteRoom(room.id) {} },
                          colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
                          modifier = Modifier.weight(1f)
                        ) {
                          Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                          Spacer(modifier = Modifier.width(4.dp))
                          Text("حذف", fontSize = 11.sp)
                        }
                      }
                    }
                  }
                }
              }
            }

            1 -> {
              // Users and Roles Directory
              Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                  text = "دليل الأعضاء وترقية الرتب (أدمن 🛡️ / مشرف ⚔️)",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                  value = userSearchQuery,
                  onValueChange = { userSearchQuery = it },
                  label = { Text("بحث باسم المستخدم أو المعرف") },
                  modifier = Modifier.fillMaxWidth(),
                  singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                val filteredUsers = remember(allUsers, userSearchQuery) {
                  if (userSearchQuery.isBlank()) allUsers
                  else allUsers.filter { it.displayName.contains(userSearchQuery, ignoreCase = true) || it.userId.contains(userSearchQuery) }
                }

                if (filteredUsers.isEmpty()) {
                  Text("لا توجد نتائج مطابقة للبحث", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                } else {
                  filteredUsers.forEach { user ->
                    Card(
                      modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                      shape = RoundedCornerShape(10.dp),
                      colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9))
                    ) {
                      Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                          modifier = Modifier.fillMaxWidth(),
                          verticalAlignment = Alignment.CenterVertically,
                          horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                          Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                              modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0F172A)),
                              contentAlignment = Alignment.Center
                            ) {
                              Text(user.displayName.take(1), color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                              Text(user.displayName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                              Text(user.email, fontSize = 10.sp, color = Color.Gray)
                            }
                          }
                          RoleBadge(role = if (user.globalRole == "owner") UserRole.OWNER else UserRole.MEMBER, showLabel = true)
                        }

                        if (user.globalRole != "owner" && rooms.isNotEmpty()) {
                          Spacer(modifier = Modifier.height(8.dp))
                          val firstRoom = rooms.first()
                          Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                          ) {
                            Button(
                              onClick = { viewModel.promoteToModerator(firstRoom.id, user.userId, user.displayName) },
                              colors = ButtonDefaults.buttonColors(containerColor = RoleModeratorBlue),
                              modifier = Modifier.weight(1f)
                            ) {
                              Text("ترقية مشرف ⚔️", fontSize = 10.sp)
                            }
                            Button(
                              onClick = { viewModel.manageUserRole(firstRoom.id, user.userId, UserRole.ADMIN, true) },
                              colors = ButtonDefaults.buttonColors(containerColor = RoleAdminPurple),
                              modifier = Modifier.weight(1f)
                            ) {
                              Text("ترقية أدمن 🛡️", fontSize = 10.sp)
                            }
                            Button(
                              onClick = {
                                viewModel.banUser(
                                  roomId = null,
                                  roomName = null,
                                  targetUid = user.userId,
                                  targetName = user.displayName,
                                  reason = "قرار إداري من المالك",
                                  isPermanent = true,
                                  durationMinutes = 0,
                                  isGlobal = true
                                )
                              },
                              colors = ButtonDefaults.buttonColors(containerColor = RoleBannedRed),
                              modifier = Modifier.weight(1f)
                            ) {
                              Text("حظر عام 🚫", fontSize = 10.sp)
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            2 -> {
              // All Active Bans & Unban
              Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                  text = "سجل المحظورين وإلغاء الحظر الفوري",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold,
                  color = RoleBannedRed
                )
                Spacer(modifier = Modifier.height(8.dp))

                val allBansList = (globalBans + roomBans).distinctBy { it.id }

                if (allBansList.isEmpty()) {
                  Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
                  ) {
                    Text(
                      text = "لا توجد أي سجلات حظر نشطة في التطبيق حالياً.",
                      fontSize = 12.sp,
                      color = Color.Gray,
                      modifier = Modifier.padding(16.dp)
                    )
                  }
                } else {
                  allBansList.forEach { ban ->
                    Card(
                      modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                      shape = RoundedCornerShape(10.dp),
                      colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                      border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA))
                    ) {
                      Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                          modifier = Modifier.fillMaxWidth(),
                          verticalAlignment = Alignment.CenterVertically,
                          horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                          Text(
                            text = ban.targetName.ifBlank { "مستخدم (${ban.targetUid.take(6)})" },
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color(0xFF991B1B)
                          )
                          Text(
                            text = if (ban.isGlobal) "حظر عام 🌐" else "حظر غرفة 🏠",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = RoleBannedRed
                          )
                        }
                        Text(
                          text = "السبب: ${ban.reason}",
                          fontSize = 11.sp,
                          color = Color(0xFF7F1D1D)
                        )
                        Text(
                          text = "المدة: ${ban.getRemainingTimeAr()}",
                          fontSize = 10.sp,
                          color = Color(0xFFD97706)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Button(
                          onClick = {
                            viewModel.unbanUser(
                              roomId = ban.roomId,
                              targetUid = ban.targetUid,
                              targetName = ban.targetName,
                              banId = ban.id,
                              isGlobal = ban.isGlobal
                            )
                          },
                          colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                          modifier = Modifier.fillMaxWidth()
                        ) {
                          Text("فك الحظر فوراً 🔓", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                      }
                    }
                  }
                }
              }
            }

            else -> {
              // Global Broadcast Announcement
              Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                  text = "بث إعلان إداري عام لجميع الغرف 📢",
                  fontSize = 13.sp,
                  fontWeight = FontWeight.Bold,
                  color = Color(0xFFB45309)
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                  value = broadcastText,
                  onValueChange = { broadcastText = it },
                  label = { Text("نص الإعلان الرسمي للمالك") },
                  placeholder = { Text("مثال: تنبيه هام من إدارة شات الغرف لكافة الأعضاء...") },
                  modifier = Modifier.fillMaxWidth(),
                  maxLines = 4
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                  onClick = {
                    if (broadcastText.isNotBlank()) {
                      rooms.forEach { r ->
                        viewModel.setPinnedAnnouncement(r.id, broadcastText.trim())
                      }
                      broadcastText = ""
                      onDismiss()
                    }
                  },
                  colors = ButtonDefaults.buttonColors(containerColor = GoldenCrown),
                  modifier = Modifier.fillMaxWidth()
                ) {
                  Icon(Icons.Default.Campaign, contentDescription = null, tint = Color.Black)
                  Spacer(modifier = Modifier.width(6.dp))
                  Text("بث وتثبيت الإعلان في كافة الغرف 📢", color = Color.Black, fontWeight = FontWeight.Bold)
                }
              }
            }
          }
        }
      }
    }
  }
}
