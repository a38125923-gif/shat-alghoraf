const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";
const OWNER_UID = "owner_supreme";
const OWNER_EMAIL = "a38125923@gmail.com";

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

function validPrivateUserPayload(uid, email = "alice@example.com", role = "member", coins = 1500) {
  const past = new Date(Date.now() - 1000);
  return {
    userId: uid,
    email,
    username: "أليس",
    role,
    coins,
    isStealth: false,
    isBanned: false,
    banReason: "",
    createdAt: past,
    updatedAt: past,
  };
}

function validPublicProfilePayload(uid, role = "member", coins = 1500) {
  const past = new Date(Date.now() - 1000);
  return {
    userId: uid,
    username: "أليس",
    displayName: "أليس",
    role,
    bio: "مرحباً",
    avatarUrl: "",
    nameColor: "#1A45E5",
    textColor: "#1E293B",
    nameBgColor: "",
    neonColor: "",
    fontFamily: "Cairo",
    fontStyle: "Normal",
    avatarFrame: "none",
    nameplateStyle: "default",
    nameShine: "none",
    vipWings: false,
    profileMusic: "",
    vipFamily: "",
    coins,
    activityPoints: 0,
    giftsReceived: 0,
    giftsSent: 0,
    isStealth: false,
    isOnline: true,
    isPublic: true,
    currentRoomId: "general",
    lastSeenAt: past,
    createdAt: past,
    updatedAt: past,
  };
}

test("Unauthenticated user: denied across all collections", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
  await assertFails(unauthDb.collection("public_profiles").where("isPublic", "==", true).get());
  await assertFails(unauthDb.collection("messages").where("roomId", "==", "general").get());
  await assertFails(unauthDb.collection("rooms").where("isActive", "==", true).get());
});

test("User PII isolation & role escalation guards on /users and /public_profiles", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();

  // Normal user creates own member account (matches Kotlin ensureUserProvisioned)
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).set(validPrivateUserPayload(ALICE_UID)));
  await assertSucceeds(aliceDb.collection("public_profiles").doc(ALICE_UID).set(validPublicProfilePayload(ALICE_UID)));

  // Reject self-promotion to site_owner or admin
  await assertFails(
    bobDb.collection("users").doc(BOB_UID).set(validPrivateUserPayload(BOB_UID, "bob@example.com", "site_owner", 99999))
  );
  await assertFails(
    bobDb.collection("public_profiles").doc(BOB_UID).set(validPublicProfilePayload(BOB_UID, "site_owner", 99999))
  );

  // Cross-user PII read on /users is denied
  await assertFails(bobDb.collection("users").doc(ALICE_UID).get());
  await assertFails(bobDb.collection("users").get());

  // Scoped Kotlin query on /public_profiles succeeds; unfiltered fails
  await assertSucceeds(bobDb.collection("public_profiles").where("isPublic", "==", true).get());
  await assertFails(bobDb.collection("public_profiles").get());

  // Shadow update & role mutation rejected on own profile
  await assertFails(
    aliceDb.collection("public_profiles").doc(ALICE_UID).update({
      role: "site_owner",
      updatedAt: new Date(Date.now() - 500),
    })
  );
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      isStealth: true,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Legitimate customization update succeeds
  await assertSucceeds(
    aliceDb.collection("public_profiles").doc(ALICE_UID).update({
      displayName: "أليس المتألقة",
      avatarFrame: "gold_royal",
      nameShine: "gold_shimmer",
      updatedAt: new Date(Date.now() - 500),
    })
  );
});

test("Supreme Owner verified email check & email spoofing test", async () => {
  // Unverified spoof attempt MUST FAIL
  const spoofDb = testEnv.authenticatedContext(BOB_UID, { email: OWNER_EMAIL, email_verified: false }).firestore();
  await assertFails(
    spoofDb.collection("users").doc(BOB_UID).set(validPrivateUserPayload(BOB_UID, OWNER_EMAIL, "site_owner", 99999))
  );
  await assertFails(
    spoofDb.collection("admins").doc(BOB_UID).set({
      userId: BOB_UID,
      role: "site_owner",
      grantedBy: BOB_UID,
      createdAt: new Date(Date.now() - 1000),
    })
  );

  // Verified Supreme Owner succeeds
  const ownerDb = testEnv.authenticatedContext(OWNER_UID, { email: OWNER_EMAIL, email_verified: true }).firestore();
  await assertSucceeds(
    ownerDb.collection("users").doc(OWNER_UID).set(validPrivateUserPayload(OWNER_UID, OWNER_EMAIL, "site_owner", 99999))
  );
  await assertSucceeds(
    ownerDb.collection("admins").doc(OWNER_UID).set({
      userId: OWNER_UID,
      role: "site_owner",
      grantedBy: OWNER_UID,
      createdAt: new Date(Date.now() - 1000),
    })
  );
  await assertSucceeds(
    ownerDb.collection("rooms").doc("general").set({
      name: "الغرفة العامة",
      description: "ملتقى الجميع",
      icon: "💬",
      imageUrl: "",
      bgTheme: "warm_peach",
      wallpaperUrl: "",
      welcomeMessage: "أهلاً بكم",
      minRankPower: 0,
      micsEnabled: true,
      ownerUserId: OWNER_UID,
      ownerName: "صاحب الموقع",
      activityPoints: 100,
      youtubeVideoId: "",
      youtubeTitle: "",
      youtubeIsPlaying: false,
      isActive: true,
      createdBy: OWNER_UID,
      createdAt: new Date(Date.now() - 1000),
      updatedAt: new Date(Date.now() - 1000),
    })
  );
});

test("Messages, Mics, Private Messages, Notifications & Tampered Future Timestamps", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: "alice@example.com", email_verified: true }).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID, { email: "bob@example.com", email_verified: true }).firestore();
  const past = new Date(Date.now() - 1000);

  // Send valid chat message
  await assertSucceeds(
    aliceDb.collection("messages").doc("msg_1").set({
      roomId: "general",
      senderId: ALICE_UID,
      senderName: "أليس",
      senderRole: "member",
      msgType: "text",
      content: "السلام عليكم",
      isAdminNotice: false,
      isGift: false,
      createdAt: past,
    })
  );

  // Non-admin cannot forge admin_notice or impersonate another senderId
  await assertFails(
    aliceDb.collection("messages").doc("msg_2").set({
      roomId: "general",
      senderId: ALICE_UID,
      senderName: "أليس",
      senderRole: "member",
      msgType: "admin_notice",
      content: "تنبيه مزور",
      isAdminNotice: true,
      isGift: false,
      createdAt: past,
    })
  );
  await assertFails(
    aliceDb.collection("messages").doc("msg_3").set({
      roomId: "general",
      senderId: BOB_UID,
      senderName: "بوب",
      senderRole: "member",
      msgType: "text",
      content: "انتحال",
      isAdminNotice: false,
      isGift: false,
      createdAt: past,
    })
  );

  // Future timestamp tampered payload MUST FAIL
  await assertFails(
    aliceDb.collection("messages").doc("msg_future").set({
      roomId: "general",
      senderId: ALICE_UID,
      senderName: "أليس",
      senderRole: "member",
      msgType: "text",
      content: "زمن مزور",
      isAdminNotice: false,
      isGift: false,
      createdAt: new Date(Date.now() + 120000),
    })
  );

  // Scoped room message query succeeds; unfiltered fails
  await assertSucceeds(bobDb.collection("messages").where("roomId", "==", "general").get());
  await assertFails(bobDb.collection("messages").get());

  // Mic slot claim & isolation
  await assertSucceeds(
    aliceDb.collection("rooms").doc("general").collection("mics").doc("1").set({
      roomId: "general",
      slotNumber: 1,
      holderUid: ALICE_UID,
      holderName: "أليس",
      holderAvatar: "",
      holderRole: "member",
      isMutedByUser: false,
      isMutedByAdmin: false,
      isTalking: true,
      createdAt: past,
      updatedAt: past,
    })
  );
  // Bob cannot hijack Alice's occupied mic
  await assertFails(
    bobDb.collection("rooms").doc("general").collection("mics").doc("1").update({
      holderUid: BOB_UID,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Private messages scoped to participants
  await assertSucceeds(
    aliceDb.collection("private_messages").doc("pm_1").set({
      senderId: ALICE_UID,
      senderName: "أليس",
      senderAvatar: "",
      receiverId: BOB_UID,
      receiverName: "بوب",
      content: "مرحباً بوب",
      participants: [ALICE_UID, BOB_UID],
      isRead: false,
      createdAt: past,
    })
  );
  await assertSucceeds(bobDb.collection("private_messages").where("participants", "array-contains", BOB_UID).get());
  await assertFails(bobDb.collection("private_messages").get());

  // Notifications scoped to recipientId
  await assertSucceeds(
    aliceDb.collection("notifications").doc("n_1").set({
      recipientId: BOB_UID,
      senderId: ALICE_UID,
      senderName: "أليس",
      type: "info",
      title: "تنبيه",
      body: "أهلاً بك",
      isRead: false,
      createdAt: past,
    })
  );
  await assertSucceeds(bobDb.collection("notifications").where("recipientId", "==", BOB_UID).get());
  await assertFails(aliceDb.collection("notifications").where("recipientId", "==", BOB_UID).get());
});
