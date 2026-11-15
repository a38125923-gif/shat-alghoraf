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
const CHARLIE_UID = "charlie_muted";
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

test("Unauthenticated user: cannot read any collection", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("rooms").where("isActive", "==", true).get());
  await assertFails(unauthDb.collection("public_profiles").where("isActive", "==", true).get());
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
  await assertFails(unauthDb.collection("wall_posts").where("isActive", "==", true).get());
  await assertFails(unauthDb.collection("notifications").where("audience", "==", "all").get());
  await assertFails(unauthDb.collection("reports").where("reporterUid", "==", ALICE_UID).get());
});

test("PII isolation & Shadow Update test on users/{userId}", async () => {
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

  // Shadow update with ghost field rejected
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      displayName: "أليس المعدلة",
      ghostField: true,
      updatedAt: new Date(),
    })
  );
});

test("Email spoofing test: unverified admin email cannot claim owner rank", async () => {
  const spoofDb = testEnv.authenticatedContext("spoof_uid", {
    email: ADMIN_EMAIL,
    email_verified: false,
  }).firestore();

  await assertFails(
    spoofDb.collection("public_profiles").doc("spoof_uid").set({
      userId: "spoof_uid",
      displayName: "محتال",
      globalRole: "owner",
      chatRank: "site_owner",
      status: "online",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
});

test("Public profiles: member cannot self-escalate rank or unmute self; admin can promote", async () => {
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  await assertSucceeds(
    bobDb.collection("public_profiles").doc(BOB_UID).set({
      userId: BOB_UID,
      displayName: "باسم",
      avatarEmoji: "💎",
      globalRole: "member",
      chatRank: "member",
      avatarFrame: "none",
      nameplateStyle: "default",
      coins: 1500,
      isMuted: false,
      isBanned: false,
      status: "online",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  // Self escalation rejected
  await assertFails(
    bobDb.collection("public_profiles").doc(BOB_UID).update({
      chatRank: "site_owner",
      updatedAt: new Date(),
    })
  );

  // Verified global admin can promote bob to royal_vip
  const adminDb = testEnv.authenticatedContext(ALICE_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  await assertSucceeds(
    adminDb.collection("public_profiles").doc(BOB_UID).update({
      chatRank: "royal_vip",
      globalRole: "member",
      updatedAt: new Date(),
    })
  );

  await assertSucceeds(bobDb.collection("public_profiles").where("isActive", "==", true).get());
  await assertFails(bobDb.collection("public_profiles").get());
});

test("Rooms & Messages: member sends message, globally/room muted user blocked", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("rooms").doc("general").set({
      name: "الغرفة العامة",
      ownerId: "system_owner",
      ownerName: "المالك العام",
      isLocked: false,
      micsEnabled: true,
      isActive: true,
      admins: [],
      moderators: [],
      mutedUsers: [CHARLIE_UID],
      bannedUsers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const msgRef = bobDb.collection("rooms").doc("general").collection("messages").doc("msg_1");
  await assertSucceeds(
    msgRef.set({
      roomId: "general",
      senderId: BOB_UID,
      senderName: "باسم",
      senderRole: "member",
      senderRank: "member",
      content: "السلام عليكم جميعاً",
      voiceDurationSec: 0,
      isAnnouncement: false,
      reactions: [],
      createdAt: new Date(),
    })
  );

  // Muted user blocked
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

  await assertSucceeds(
    bobDb.collection("rooms").doc("general").collection("messages").where("roomId", "==", "general").get()
  );
});

test("Wall posts, notifications, direct chats, and reports follow least-privilege isolation", async () => {
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID, { email: "charlie@example.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ALICE_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();

  // Wall post create + like
  const postRef = bobDb.collection("wall_posts").doc("post_1");
  await assertSucceeds(
    postRef.set({
      authorId: BOB_UID,
      authorName: "باسم",
      authorRank: "member",
      authorEmoji: "😎",
      content: "مساء الخير للجميع",
      likes: 0,
      likedBy: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  await assertSucceeds(postRef.update({ likes: 1, likedBy: [CHARLIE_UID], updatedAt: new Date() }));
  // Cannot tamper content
  await assertFails(postRef.update({ content: "محذوف", updatedAt: new Date() }));

  // Report: Bob creates, Charlie cannot read Bob's report, Admin can read & resolve
  const repRef = bobDb.collection("reports").doc("rep_1");
  await assertSucceeds(
    repRef.set({
      reporterUid: BOB_UID,
      reporterName: "باسم",
      targetName: "تشارلي",
      reason: "إزعاج",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  await assertFails(charlieDb.collection("reports").doc("rep_1").get());
  await assertSucceeds(bobDb.collection("reports").where("reporterUid", "==", BOB_UID).get());
  await assertSucceeds(adminDb.collection("reports").doc("rep_1").update({ status: "resolved", updatedAt: new Date() }));

  // Notifications query alignment
  await assertSucceeds(
    bobDb.collection("notifications").doc("notif_1").set({
      audience: "all",
      createdByUid: BOB_UID,
      title: "ترحيب",
      body: "أهلاً بالجميع",
      readBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  await assertSucceeds(bobDb.collection("notifications").where("audience", "in", ["all", BOB_UID]).get());
  await assertFails(bobDb.collection("notifications").get());
});
