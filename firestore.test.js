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

test("Unauthenticated user: cannot read rooms or users", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("rooms").get());
  await assertFails(unauthDb.collection("users").doc("any_user").get());
});

test("Authenticated user: can create a room as owner", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const roomData = {
    name: "غرفة الدردشة العامة",
    description: "أهلاً وسهلاً بالجميع",
    ownerId: ALICE_UID,
    ownerName: "Alice Owner",
    category: "عام",
    isLocked: false,
    admins: [],
    moderators: [],
    mutedUsers: [],
    bannedUsers: [],
    memberCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await assertSucceeds(aliceDb.collection("rooms").doc("room_1").set(roomData));
});

test("Non-owner: cannot delete room", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("rooms").doc("room_1").set({
      name: "غرفة خاصة",
      ownerId: ALICE_UID,
      ownerName: "Alice Owner",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  await assertFails(bobDb.collection("rooms").doc("room_1").delete());
});

test("Owner: can delete room", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("rooms").doc("room_1").set({
      name: "غرفة خاصة",
      ownerId: ALICE_UID,
      ownerName: "Alice Owner",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(aliceDb.collection("rooms").doc("room_1").delete());
});

test("Muted user: cannot send messages in room", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("rooms").doc("room_1").set({
      name: "غرفة عامة",
      ownerId: ALICE_UID,
      ownerName: "Alice Owner",
      mutedUsers: [BOB_UID],
      bannedUsers: [],
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const msgData = {
    roomId: "room_1",
    senderId: BOB_UID,
    senderName: "Bob Member",
    senderRole: "member",
    content: "مرحبا بكم",
    createdAt: new Date()
  };
  await assertFails(bobDb.collection("rooms").doc("room_1").collection("messages").doc("msg_1").set(msgData));
});

test("Regular member: can send message if not muted or banned", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("rooms").doc("room_1").set({
      name: "غرفة عامة",
      ownerId: ALICE_UID,
      ownerName: "Alice Owner",
      mutedUsers: [],
      bannedUsers: [],
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const msgData = {
    roomId: "room_1",
    senderId: BOB_UID,
    senderName: "Bob Member",
    senderRole: "member",
    content: "السلام عليكم ورحمة الله",
    createdAt: new Date()
  };
  await assertSucceeds(bobDb.collection("rooms").doc("room_1").collection("messages").doc("msg_1").set(msgData));
});

test("Banned user: cannot read room or messages", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("rooms").doc("room_1").set({
      name: "غرفة عامة",
      ownerId: ALICE_UID,
      ownerName: "Alice Owner",
      mutedUsers: [],
      bannedUsers: [CHARLIE_UID],
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  await assertFails(charlieDb.collection("rooms").doc("room_1").get());
  await assertFails(charlieDb.collection("rooms").doc("room_1").collection("messages").get());
});
