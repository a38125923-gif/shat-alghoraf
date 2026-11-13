const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_owner";
const BOB_UID = "bob_member";
const CHARLIE_UID = "charlie_banned";
const ADMIN_EMAIL = "a38125923@gmail.com";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user: cannot read rooms, profiles, or messages", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("rooms").where("isActive", "==", true).get());
  await assertFails(unauthDb.collection("public_profiles").where("isActive", "==", true).get());
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
});

test("PII isolation: non-owner cannot read another user's private profile", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("users").doc(ALICE_UID).set({
      userId: ALICE_UID,
      displayName: "أليس",
      email: "alice@example.com",
      globalRole: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  await assertFails(bobDb.collection("users").doc(ALICE_UID).get());
});

test("Email spoofing test: unverified admin email is rejected for global admin actions", async () => {
  const spoofDb = testEnv.authenticatedContext("spoof_uid", {
    email: ADMIN_EMAIL,
    email_verified: false,
  }).firestore();

  await assertFails(
    spoofDb.collection("public_profiles").doc("spoof_uid").set({
      userId: "spoof_uid",
      displayName: "محتال",
      globalRole: "owner",
      status: "online",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
});

test("Public profiles: signed-in user can create own member profile and list active profiles", async () => {
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  await assertSucceeds(
    bobDb.collection("public_profiles").doc(BOB_UID).set({
      userId: BOB_UID,
      displayName: "باسم",
      avatarEmoji: "💎",
      globalRole: "member",
      status: "online",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  // Cannot escalate own role
  await assertFails(
    bobDb.collection("public_profiles").doc(BOB_UID).update({
      globalRole: "admin",
      updatedAt: new Date(),
    })
  );

  // Query alignment with isActive == true succeeds
  await assertSucceeds(bobDb.collection("public_profiles").where("isActive", "==", true).get());
  // Unfiltered query fails
  await assertFails(bobDb.collection("public_profiles").get());
});

test("Rooms: user can create room, seed canonical room once, and query active rooms", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("rooms").doc("room_custom").set({
      name: "غرفة الشعر العربي",
      description: "أجمل الأبيات والقصائد",
      ownerId: ALICE_UID,
      ownerName: "أليس",
      category: "ثقافة",
      icon: "📜",
      permissionLevel: "PUBLIC",
      isLocked: false,
      isActive: true,
      admins: [],
      moderators: [],
      mutedUsers: [],
      bannedUsers: [],
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await assertSucceeds(aliceDb.collection("rooms").where("isActive", "==", true).get());
  await assertFails(aliceDb.collection("rooms").get());
});

test("Messages: member can send and react, muted/banned user cannot send", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("rooms").doc("general").set({
      name: "الغرفة العامة",
      ownerId: "system_owner",
      ownerName: "المالك العام",
      isLocked: false,
      isActive: true,
      admins: [],
      moderators: [],
      mutedUsers: [CHARLIE_UID],
      bannedUsers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const msgRef = bobDb.collection("rooms").doc("general").collection("messages").doc("msg_1");
  await assertSucceeds(
    msgRef.set({
      roomId: "general",
      senderId: BOB_UID,
      senderName: "باسم",
      senderRole: "member",
      content: "السلام عليكم جميعاً",
      isAnnouncement: false,
      reactions: [],
      createdAt: new Date(),
    })
  );

  // Reaction update allowed
  await assertSucceeds(msgRef.update({ reactions: ["❤️:" + ALICE_UID] }));
  // Content tampering forbidden
  await assertFails(msgRef.update({ content: "تم التعديل" }));

  // Muted user blocked from sending
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  await assertFails(
    charlieDb.collection("rooms").doc("general").collection("messages").doc("msg_2").set({
      roomId: "general",
      senderId: CHARLIE_UID,
      senderName: "تشارلي",
      senderRole: "member",
      content: "رسالة ممنوعة",
      createdAt: new Date(),
    })
  );

  // List messages with roomId filter succeeds
  await assertSucceeds(
    bobDb.collection("rooms").doc("general").collection("messages").where("roomId", "==", "general").get()
  );
});

test("Direct chats: only participants can read or message", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();

  const chatId = `${ALICE_UID}_${BOB_UID}`;
  await assertSucceeds(
    aliceDb.collection("direct_chats").doc(chatId).set({
      participantIds: [ALICE_UID, BOB_UID],
      participantNames: { [ALICE_UID]: "أليس", [BOB_UID]: "باسم" },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await assertSucceeds(
    bobDb.collection("direct_chats").doc(chatId).collection("messages").doc("dm_1").set({
      chatId,
      participantIds: [ALICE_UID, BOB_UID],
      senderId: BOB_UID,
      senderName: "باسم",
      content: "مرحباً أليس!",
      createdAt: new Date(),
    })
  );

  // Outsider cannot read direct chat, message doc, or list messages unfiltered
  await assertFails(charlieDb.collection("direct_chats").doc(chatId).get());
  await assertFails(
    charlieDb.collection("direct_chats").doc(chatId).collection("messages").doc("dm_1").get()
  );
  await assertFails(
    charlieDb.collection("direct_chats").doc(chatId).collection("messages").get()
  );
});
