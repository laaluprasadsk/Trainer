import sharp from "sharp";
import EmbeddedPostgres from "embedded-postgres";
import { PrismaClient } from "@prisma/client";
import { chromium } from "@playwright/test";
import { mkdtempSync, writeFileSync, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, scryptSync, createHmac, createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = mkdtempSync(join(tmpdir(), "trainer-e2e-"));
const password = randomBytes(18).toString("hex");
const webhookSecret = randomBytes(32).toString("hex");
const pg = new EmbeddedPostgres({
  databaseDir: join(dir, "db"),
  user: "postgres",
  password,
  port: 55437,
  persistent: true,
  onLog: () => {},
  onError: () => {},
});
let app, db, browser;
const origin = "http://localhost:3107";
let checks = 0;
function check(ok, label) {
  assert.ok(ok, label);
  checks++;
  console.log(`PASS ${label}`);
}
async function api(
  path,
  { cookie = "", method = "GET", data, headers = {} } = {},
) {
  const r = await fetch(origin + path, {
    method,
    headers: {
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    redirect: "manual",
  });
  const json = await r.json().catch(() => ({}));
  return {
    status: r.status,
    json,
    cookie: r.headers.get("set-cookie")?.split(";")[0] || "",
  };
}
async function register(role, index) {
  const r = await api("/api/auth/register", {
    method: "POST",
    data: {
      email: `${role}${index}@example.test`,
      phone: `+91999999${String(index).padStart(4, "0")}`,
      password,
      confirmPassword: password,
      firstName: role,
      lastName: `Test${index}`,
      role,
    },
  });
  check(r.status === 200, `${role} registration ${index}`);
  return r;
}
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("trainer_test");
  const url = `postgresql://postgres:${password}@localhost:55437/trainer_test`;
  const env = {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    APP_URL: origin,
    RESEND_API_KEY: "re_test_isolated",
    EMAIL_FROM: "Trainrr Test <test@example.test>",
    SUPPORT_EMAIL: "support@example.test",
    MSG91_AUTH_KEY: "msg91_test_isolated",
    MSG91_OTP_TEMPLATE_ID: "otp_test_template",
    MSG91_SENDER_ID: "TRAINR",
    STORAGE_PROVIDER: "database",
    ALLOW_DATABASE_UPLOADS_FOR_TESTS: "true",
    CRON_SECRET: webhookSecret,
    RAZORPAY_KEY_ID: "rzp_test_isolated",
    RAZORPAY_KEY_SECRET: randomBytes(24).toString("hex"),
    RAZORPAY_WEBHOOK_SECRET: webhookSecret,
    NODE_OPTIONS: `--require ${resolve("tests/provider-stub.cjs")}`,
  };
  execFileSync(
    "node",
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env, stdio: "pipe" },
  );
  check(true, "all migrations apply to an empty PostgreSQL database");
  db = new PrismaClient({ datasources: { db: { url } } });
  app = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "--port", "3107"],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  const log = createWriteStream(join(dir, "server.log"));
  app.stdout.pipe(log);
  app.stderr.pipe(log);
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin + "/api/auth/me")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const c1 = await register("CLIENT", 1),
    c2 = await register("CLIENT", 2),
    t1 = await register("TRAINER", 3),
    t2 = await register("TRAINER", 4);
  const salt = randomBytes(16).toString("hex");
  const admin = await db.user.create({
    data: {
      email: "admin@example.test",
      phoneNumber: "+919999999999",
      passwordHash: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  const a = await api("/api/auth/login", {
    method: "POST",
    data: { email: admin.email, password },
  });
  check(a.status === 200, "admin password login");
  const duplicateRegistration = await api("/api/auth/register", {
    method: "POST",
    data: {
      email: "CLIENT1@EXAMPLE.TEST",
      phone: "+918888880001",
      password,
      confirmPassword: password,
      firstName: "Duplicate",
      lastName: "Client",
      role: "CLIENT",
    },
  });
  check(
    duplicateRegistration.status === 409 &&
      duplicateRegistration.json.error ===
        "An account already exists with this email. Sign in or reset your password.",
    "existing registration returns the customer account-recovery message",
  );
  check(
    (
      await api("/api/auth/register", {
        method: "POST",
        data: {
          email: "mismatch@example.test",
          phone: "+918888880002",
          password,
          confirmPassword: `${password}x`,
          firstName: "Mismatch",
          lastName: "Client",
          role: "CLIENT",
        },
      })
    ).status === 400,
    "registration rejects mismatched password confirmation",
  );
  check(
    (
      await api("/api/account/verification", {
        cookie: c1.cookie,
        method: "POST",
        data: { action: "SEND_EMAIL" },
      })
    ).status === 200,
    "verification email uses mocked delivery",
  );
  const verifyToken = randomBytes(32).toString("hex");
  await db.authToken.create({
    data: {
      id: createHash("sha256").update(verifyToken).digest("hex"),
      userId: c1.json.user.id,
      kind: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  check(
    (
      await api("/api/account/verification", {
        cookie: c1.cookie,
        method: "POST",
        data: { action: "VERIFY_EMAIL", token: verifyToken },
      })
    ).status === 200,
    "email verification consumes a valid test token",
  );
  check(
    (
      await api("/api/account/verification", {
        cookie: c1.cookie,
        method: "POST",
        data: { action: "VERIFY_EMAIL", token: verifyToken },
      })
    ).status === 400,
    "email verification token cannot be replayed",
  );
  check(
    (
      await api("/api/account/verification", {
        cookie: c1.cookie,
        method: "POST",
        data: { action: "SEND_PHONE" },
      })
    ).status === 200 &&
      (
        await api("/api/account/verification", {
          cookie: c1.cookie,
          method: "POST",
          data: { action: "VERIFY_PHONE", otp: "123456" },
        })
      ).status === 200,
    "phone OTP send and verification use mocked delivery",
  );
  const changedPhone = "+917777770001";
  check(
    (
      await api("/api/client/profile", {
        cookie: c1.cookie,
        method: "POST",
        data: {
          firstName: "Client",
          lastName: "Test1",
          phone: changedPhone,
          defaultLocationName: "Indiranagar",
          fitnessGoals: ["Strength"],
        },
      })
    ).json.profile.phone === changedPhone &&
      (await api("/api/client/profile", { cookie: c1.cookie })).json.profile
        .phone === changedPhone,
    "client phone persists from the canonical account record",
  );
  check(
    (
      await api("/api/account/verification", {
        cookie: c1.cookie,
        method: "POST",
        data: { action: "SEND_PHONE" },
      })
    ).status === 200 &&
      (
        await api("/api/account/verification", {
          cookie: c1.cookie,
          method: "POST",
          data: { action: "VERIFY_PHONE", otp: "123456" },
        })
      ).status === 200,
    "changed client phone requires and accepts fresh verification",
  );
  await db.user.update({
    where: { id: c2.json.user.id },
    data: { emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() },
  });
  const forgotExisting = await api("/api/auth/forgot", {
    method: "POST",
    data: { email: "client1@example.test" },
  });
  const forgotMissing = await api("/api/auth/forgot", {
    method: "POST",
    data: { email: "missing@example.test" },
  });
  check(
    forgotExisting.status === 200 &&
      forgotMissing.status === 200 &&
      forgotExisting.json.message === forgotMissing.json.message,
    "password reset request is neutral and uses mocked email delivery",
  );
  check(
    (
      await api("/api/contact", {
        method: "POST",
        data: {
          email: "client1@example.test",
          message: "Please help with a test booking reference.",
        },
      })
    ).status === 200,
    "contact request persists and uses mocked email delivery",
  );
  check(
    (
      await api("/api/auth/register", {
        method: "POST",
        data: { email: "bad@example.test", password, role: "ADMIN" },
      })
    ).status === 400,
    "public registration cannot create admins",
  );
  check(
    (
      await api("/api/auth/login", {
        method: "POST",
        data: { email: "admin@example.test", password: "wrong" },
      })
    ).status === 401,
    "invalid password rejected",
  );
  check(
    (await api("/api/trainers/slots", { headers: { "x-trainer-id": "spoof" } }))
      .status === 401,
    "spoofed trainer headers cannot authenticate",
  );
  check(
    (await api("/api/admin", { cookie: c1.cookie })).status === 403,
    "client cannot access admin API",
  );
  check(
    (await api("/api/admin", { cookie: t1.cookie })).status === 403,
    "trainer cannot access admin API",
  );
  check(
    (await api("/api/trainers/slots", { cookie: c1.cookie })).status === 403,
    "client cannot access trainer API",
  );
  check(
    (await api("/api/client/profile", { cookie: t1.cookie })).status === 403,
    "trainer cannot access client API",
  );
  check(
    (
      await api("/api/auth/logout", {
        cookie: c1.cookie,
        method: "POST",
        headers: { Origin: "https://evil.test" },
      })
    ).status === 403,
    "cross-origin mutations rejected",
  );
  check(
    (await api("/api/trainers/search")).json.trainers.length === 0,
    "pending trainers are hidden",
  );
  const fd = new FormData();
  fd.set(
    "file",
    new Blob(["%PDF-1.7\nTest credential"], { type: "application/pdf" }),
    "cert.pdf",
  );
  const uploaded = await fetch(origin + "/api/uploads", {
    method: "POST",
    headers: { Cookie: t1.cookie, Origin: origin },
    body: fd,
  });
  const upload = await uploaded.json();
  check(uploaded.ok, "credential upload stored");
  check(
    (await fetch(origin + upload.url, { headers: { Cookie: t2.cookie } }))
      .status === 404,
    "another trainer cannot download private credential",
  );
  const profile = await api("/api/trainer/profile", {
    cookie: t1.cookie,
    method: "PATCH",
    data: {
      homeLocationName: "Bengaluru",
      bio: "Strength coach",
      hourlyRate: 1000,
      acceptedSessionModes: ["ONLINE"],
      specializations: ["Yoga"],
      certification: {
        title: "Personal trainer",
        issuingOrganization: "Test institute",
        documentUrl: upload.url,
      },
      verificationStatus: "APPROVED",
    },
  });
  check(
    profile.status === 200 &&
      profile.json.data.verificationStatus === "PENDING",
    "trainer profile persists without self-verification",
  );
  check(
    (
      await api("/api/admin", {
        cookie: a.cookie,
        method: "POST",
        data: {
          id: t1.json.user.id,
          action: "APPROVE",
          note: "Credential reviewed",
        },
      })
    ).status === 200,
    "admin approves submitted trainer",
  );
  const trainer = await db.trainerProfile.findUniqueOrThrow({
    where: { userId: t1.json.user.id },
  });
  check(
    (await api("/api/trainers/search")).json.trainers.length === 1,
    "approved trainer publicly discoverable",
  );
  const secondTrainer = await db.trainerProfile.findUniqueOrThrow({
    where: { userId: t2.json.user.id },
  });
  const secondDocument = await db.upload.create({
    data: {
      userId: t2.json.user.id,
      mime: "application/pdf",
      data: Buffer.from("%PDF-1.7\nSecond test credential"),
    },
  });
  await db.trainerProfile.update({
    where: { id: secondTrainer.id },
    data: {
      homeLocationName: "Whitefield, Bengaluru",
      bio: "Yoga and mobility coach",
      hourlyRate: 750,
      yearsExperience: 7,
      acceptedSessionModes: ["ONLINE", "PUBLIC_PARK"],
      specializations: ["Yoga", "Post-Rehab"],
    },
  });
  await db.certification.create({
    data: {
      trainerId: secondTrainer.id,
      title: "Yoga instructor",
      issuingOrganization: "Test institute",
      documentUrl: `/api/uploads/${secondDocument.id}`,
    },
  });
  check(
    (
      await api("/api/admin", {
        cookie: a.cookie,
        method: "POST",
        data: {
          id: t2.json.user.id,
          action: "APPROVE",
          note: "Second test credential reviewed",
        },
      })
    ).status === 200,
    "admin publishes second approved trainer",
  );
  check(
    (await api("/api/trainers/search")).json.trainers.length === 2,
    "public discovery returns two approved published trainers",
  );
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t1.cookie,
        method: "POST",
        data: {
          slots: [
            { slotDate: date, startTime: "09:00", endTime: "10:00" },
            { slotDate: date, startTime: "10:00", endTime: "11:00" },
          ],
        },
      })
    ).status === 200,
    "trainer publishes adjacent future slots",
  );
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t2.cookie,
        method: "POST",
        data: {
          slots: [{ slotDate: date, startTime: "12:00", endTime: "13:00" }],
        },
      })
    ).status === 200,
    "second trainer publishes different future availability",
  );
  const combined = await api(
    `/api/trainers/search?location=whitefield&specialization=Yoga&maxPrice=800&experience=5&date=${date}&time=12:30&sort=price-asc`,
  );
  check(
    combined.status === 200 &&
      combined.json.trainers.length === 1 &&
      combined.json.trainers[0].id === secondTrainer.id,
    "combined trainer filters return the relevant published trainer",
  );
  check(
    (await api("/api/trainers/search?date=2020-01-01")).status === 400,
    "trainer search rejects past availability dates",
  );
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t1.cookie,
        method: "POST",
        data: {
          slots: [{ slotDate: date, startTime: "09:30", endTime: "10:30" }],
        },
      })
    ).status === 409,
    "overlapping availability rejected",
  );
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t1.cookie,
        method: "POST",
        data: {
          slots: [
            { slotDate: "2020-01-01", startTime: "09:00", endTime: "10:00" },
          ],
        },
      })
    ).status === 400,
    "past slots rejected",
  );
  const slots = await db.availabilitySlot.findMany({
    where: { trainerId: trainer.id },
    orderBy: { startTime: "asc" },
  });
  const attempts = await Promise.all(
    [c1, c2].map((c) =>
      api("/api/bookings/checkout", {
        cookie: c.cookie,
        method: "POST",
        data: { slotId: slots[0].id, locationType: "ONLINE", totalAmount: 1 },
      }),
    ),
  );
  check(
    attempts.filter((r) => r.status === 200).length === 1 &&
      attempts.filter((r) => r.status === 409).length === 1,
    `concurrent checkout: exactly one client wins (${attempts.map((r) => `${r.status}:${r.json.error || "ok"}`).join("/")})`,
  );
  const winner = attempts[0].status === 200 ? c1 : c2,
    loser = winner === c1 ? c2 : c1;
  const order = attempts.find((r) => r.status === 200).json;
  check(order.amount === 100000, "server ignores client price tampering");
  check(
    (
      await api("/api/bookings", {
        cookie: loser.cookie,
        method: "PATCH",
        data: { id: order.bookingId, action: "CANCEL" },
      })
    ).status === 404,
    "other client cannot cancel booking",
  );
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t1.cookie,
        method: "PATCH",
        data: { id: slots[0].id },
      })
    ).status === 409,
    "trainer cannot block reserved slot",
  );
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t2.cookie,
        method: "PATCH",
        data: { id: slots[0].id },
      })
    ).status === 404,
    "trainer cannot modify another schedule",
  );
  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_isolated_1",
          order_id: order.orderId,
          amount: order.amount,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };
  check(
    (
      await api("/api/webhooks/payment", {
        method: "POST",
        data: payload,
        headers: { "x-razorpay-signature": "0".repeat(64) },
      })
    ).status === 400,
    "forged payment webhook rejected",
  );
  const failedPayload = {
    event: "payment.failed",
    payload: { payment: { entity: { order_id: order.orderId } } },
  };
  const failedSig = createHmac("sha256", webhookSecret)
    .update(JSON.stringify(failedPayload))
    .digest("hex");
  check(
    (
      await api("/api/webhooks/payment", {
        method: "POST",
        data: failedPayload,
        headers: { "x-razorpay-signature": failedSig },
      })
    ).status === 200,
    "signed payment failure recorded",
  );
  check(
    (await db.payment.findUnique({ where: { bookingId: order.bookingId } }))
      .status === "FAILED",
    "failed attempt has truthful payment status",
  );
  const signature = createHmac("sha256", webhookSecret)
    .update(JSON.stringify(payload))
    .digest("hex");
  for (let i = 0; i < 2; i++)
    check(
      (
        await api("/api/webhooks/payment", {
          method: "POST",
          data: payload,
          headers: { "x-razorpay-signature": signature },
        })
      ).status === 200,
      `verified webhook delivery ${i + 1}`,
    );
  check(
    (await db.booking.findUnique({ where: { id: order.bookingId } })).status ===
      "CONFIRMED",
    "verified capture confirms booking",
  );
  check(
    (await db.notification.count({
      where: { message: { contains: "Payment received." } },
    })) === 2,
    "duplicate webhook creates no duplicate notifications",
  );
  check(
    (await api("/api/trainers/search")).json.trainers[0].availableSlotsCount ===
      1,
    "booked slot removed from public availability",
  );
  check(
    (await api("/api/bookings", { cookie: t1.cookie })).json.bookings.length ===
      1,
    "booking visible to trainer",
  );
  check(
    (await api("/api/bookings", { cookie: winner.cookie })).json.bookings
      .length === 1,
    "booking visible to client",
  );
  check(
    (
      await api("/api/bookings", {
        cookie: t1.cookie,
        method: "PATCH",
        data: { id: order.bookingId, action: "COMPLETE" },
      })
    ).status === 409,
    "future session cannot be completed",
  );
  check(
    (
      await api("/api/reviews", {
        cookie: winner.cookie,
        method: "POST",
        data: { bookingId: order.bookingId, rating: 5 },
      })
    ).status === 409,
    "uncompleted session cannot be reviewed",
  );
  await db.availabilitySlot.update({
    where: { id: slots[0].id },
    data: { slotDate: new Date("2025-01-01") },
  });
  check(
    (
      await api("/api/bookings", {
        cookie: t1.cookie,
        method: "PATCH",
        data: { id: order.bookingId, action: "COMPLETE" },
      })
    ).status === 200,
    "ended confirmed session can be completed",
  );
  check(
    (
      await api("/api/reviews", {
        cookie: winner.cookie,
        method: "POST",
        data: {
          bookingId: order.bookingId,
          rating: 5,
          comment: "Helpful session",
        },
      })
    ).status === 200,
    "completed booking review accepted",
  );
  check(
    (
      await api("/api/reviews", {
        cookie: winner.cookie,
        method: "POST",
        data: { bookingId: order.bookingId, rating: 4 },
      })
    ).status === 409,
    "duplicate booking review rejected",
  );
  const earnings = await api("/api/trainers/payouts", { cookie: t1.cookie });
  check(
    earnings.json.summary.net === 850 && earnings.json.summary.paid === 0,
    "earnings derive from captured payment; completion does not fake payout",
  );
  const second = await api("/api/bookings/checkout", {
    cookie: c1.cookie,
    method: "POST",
    data: { slotId: slots[1].id, locationType: "ONLINE" },
  });
  check(second.status === 200, "another available slot can be booked");
  await db.booking.update({
    where: { id: second.json.bookingId },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  const replacement = await api("/api/bookings/checkout", {
    cookie: c2.cookie,
    method: "POST",
    data: { slotId: slots[1].id, locationType: "ONLINE" },
  });
  check(
    replacement.status === 200,
    "expired hold releases slot without deleting history",
  );
  const late = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_late",
          order_id: second.json.orderId,
          amount: second.json.amount,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };
  check(
    (
      await api("/api/webhooks/payment", {
        method: "POST",
        data: late,
        headers: {
          "x-razorpay-signature": createHmac("sha256", webhookSecret)
            .update(JSON.stringify(late))
            .digest("hex"),
        },
      })
    ).status === 200,
    "late payment handled without overwriting new reservation",
  );
  check(
    (
      await db.payment.findUnique({
        where: { bookingId: second.json.bookingId },
      })
    ).status === "REFUND_PENDING",
    "late capture queued for refund review",
  );
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    origin +
      `/trainers?location=whitefield&specialization=Yoga&maxPrice=800&sort=price-asc`,
  );
  check(
    (await page.getByLabel("Location").inputValue()) === "whitefield" &&
      (await page.getByLabel("Specialization").inputValue()) === "Yoga" &&
      (await page.getByLabel("Maximum hourly price (₹)").inputValue()) ===
        "800" &&
      (await page.getByLabel("Sort results").inputValue()) === "price-asc",
    "trainer directory hydrates controls from URL filters",
  );
  await page.getByLabel("Location").fill("");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL((url) =>
    url.searchParams.get("specialization") === "Yoga" &&
    !url.searchParams.has("location"),
  );
  check(
    !new URL(page.url()).searchParams.has("location"),
    "trainer filter submissions synchronize browser URL",
  );
  await page.goBack();
  check(
    (await page.getByLabel("Location").inputValue()) === "whitefield",
    "browser back restores trainer filters",
  );
  // Exercise the actual forms and checkout widget as well as the API paths above.
  await page
    .context()
    .addCookies([
      { name: "trainer_session", value: t1.cookie.split("=")[1], url: origin },
    ]);
  await page.goto(origin + "/schedule");
  const uiDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("First date").fill(uiDate);
  await page.getByLabel("From", { exact: true }).fill("12:00");
  await page.getByLabel("Until", { exact: true }).fill("13:00");
  await page.getByRole("button", { name: "Publish slots" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "1 slots published" })
    .waitFor();
  check(true, "availability form publishes a real database slot");
  check(
    (
      await api("/api/trainers/slots", {
        cookie: t1.cookie,
        method: "POST",
        data: {
          slots: [{ slotDate: uiDate, startTime: "13:00", endTime: "14:00" }],
        },
      })
    ).status === 200,
    "trainer publishes a same-duration reschedule option",
  );
  await page.goto(origin + "/dashboard/profile");
  const png = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#008060" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Upload a photo", { exact: true })
    .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: png });
  await page.getByAltText("Your profile photo").waitFor();
  check(
    (
      await db.trainerProfile.findUnique({ where: { id: trainer.id } })
    ).avatarUrl?.startsWith("/api/avatars/"),
    "photo upload form persists normalized image",
  );
  await page.context().clearCookies();
  await page.goto(origin + "/register");
  await page.getByLabel("First name", { exact: true }).fill("Browser");
  await page.getByLabel("Last name", { exact: true }).fill("Client");
  await page.getByLabel("Phone with country code").fill("+918888888885");
  await page.getByLabel("Email", { exact: true }).fill("browser@example.test");
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.waitForURL("**/verify-account");
  check(true, "browser signup establishes a session and opens verification");
  const browserUser = await db.user.findUniqueOrThrow({
    where: { email: "browser@example.test" },
    include: { clientProfile: true },
  });
  const browserVerifyToken = randomBytes(32).toString("hex");
  await db.authToken.create({
    data: {
      id: createHash("sha256").update(browserVerifyToken).digest("hex"),
      userId: browserUser.id,
      kind: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  await page.goto(
    `${origin}/verify-account?token=${encodeURIComponent(browserVerifyToken)}`,
  );
  await page.getByText("Email verified.", { exact: true }).waitFor();
  const browserPhoneStatuses = await page.evaluate(async () => {
    const action = (body) =>
      fetch("/api/account/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    const sent = await action({ action: "SEND_PHONE" });
    const verified = await action({ action: "VERIFY_PHONE", otp: "123456" });
    return [sent.status, verified.status];
  });
  check(
    browserPhoneStatuses.every((status) => status === 200),
    "browser journey verifies email and phone through mocked delivery",
  );
  await page.exposeFunction("testPay", (options) => {
    const id = `pay_${options.order_id}`;
    return {
      razorpay_order_id: options.order_id,
      razorpay_payment_id: id,
      razorpay_signature: createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${options.order_id}|${id}`)
        .digest("hex"),
    };
  });
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.Razorpay=class{constructor(o){this.o=o;this.handlers={}}on(e,h){this.handlers[e]=h}async open(){const r=await window.testPay(this.o);this.o.handler(r)}}",
    }),
  );
  await page.goto(origin + `/trainers/${trainer.slug}`);
  const bookingMain = page.getByRole("main").last();
  await bookingMain.getByLabel("Choose a date").selectOption(uiDate);
  await bookingMain
    .getByRole("button", { name: "12:00–13:00", exact: true })
    .click();
  await bookingMain
    .getByRole("button", { name: "Review & pay securely" })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Your session is confirmed" })
    .waitFor({ timeout: 15000 });
  check(
    true,
    "browser slot selection → checkout → server payment fetch → confirmation",
  );
  const browserBooking = await db.booking.findFirstOrThrow({
    where: { clientId: browserUser.clientProfile.id },
    include: { payment: true },
  });
  await page.goto(origin + "/bookings");
  await page.getByRole("button", { name: "Mark all read" }).click();
  await page
    .getByRole("button", { name: "Mark all read" })
    .waitFor({ state: "visible" });
  check(
    await page.getByRole("button", { name: "Mark all read" }).isDisabled(),
    "notification read state updates immediately in the client dashboard",
  );
  await page.reload();
  check(
    await page.getByRole("button", { name: "Mark all read" }).isDisabled(),
    "notification read state persists after refresh",
  );
  const browserCookie =
    "trainer_session=" +
    (await page.context().cookies()).find((c) => c.name === "trainer_session")
      .value;
  const replacementSlot = await db.availabilitySlot.findFirstOrThrow({
    where: {
      trainerId: trainer.id,
      slotDate: new Date(uiDate),
      startTime: "13:00",
    },
  });
  check(
    (
      await api("/api/bookings", {
        cookie: browserCookie,
        method: "PATCH",
        data: {
          id: browserBooking.id,
          action: "RESCHEDULE",
          slotId: replacementSlot.id,
        },
      })
    ).status === 200 &&
      (await db.booking.findUnique({ where: { id: browserBooking.id } }))
        .slotId === replacementSlot.id,
    "client reschedule atomically moves a confirmed booking",
  );
  check(
    (
      await api("/api/bookings", {
        cookie: browserCookie,
        method: "PATCH",
        data: { id: browserBooking.id, action: "CANCEL" },
      })
    ).status === 200,
    "confirmed booking cancels with 24-hour notice",
  );
  await page.goto(`${origin}/bookings/${browserBooking.id}?confirmed=1`);
  check(
    (await page.getByText("Your session is confirmed.").count()) === 0,
    "confirmation query cannot misrepresent a cancelled booking",
  );
  check(
    (await db.payment.findUnique({ where: { bookingId: browserBooking.id } }))
      .status === "REFUND_PENDING",
    "cancellation records refund pending",
  );
  const refund = {
    event: "refund.processed",
    payload: {
      refund: {
        entity: {
          payment_id: browserBooking.payment.gatewayPaymentId,
          amount: 100000,
        },
      },
    },
  };
  check(
    (
      await api("/api/webhooks/payment", {
        method: "POST",
        data: refund,
        headers: {
          "x-razorpay-signature": createHmac("sha256", webhookSecret)
            .update(JSON.stringify(refund))
            .digest("hex"),
        },
      })
    ).status === 200,
    "verified full refund webhook processed",
  );
  check(
    (await db.payment.findUnique({ where: { bookingId: browserBooking.id } }))
      .status === "REFUNDED",
    "refunded payment state persists",
  );
  const token = randomBytes(32).toString("hex");
  await db.authToken.create({
    data: {
      id: createHash("sha256").update(token).digest("hex"),
      userId: t2.json.user.id,
      kind: "RESET",
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  check(
    (
      await api("/api/auth/reset", {
        method: "POST",
        data: {
          token,
          password: password + "new",
          confirmPassword: password + "new",
        },
      })
    ).status === 200,
    "password reset consumes valid token",
  );
  check(
    (
      await api("/api/auth/reset", {
        method: "POST",
        data: {
          token,
          password: password + "new",
          confirmPassword: password + "new",
        },
      })
    ).status === 400,
    "password reset token cannot be replayed",
  );
  check(
    (await api("/api/trainers/slots", { cookie: t2.cookie })).status === 401,
    "password reset revokes prior sessions",
  );
  check(
    (await api("/api/jobs/reminders", { method: "POST" })).status === 401,
    "reminder job requires bearer authentication",
  );
  check(
    (
      await api("/api/jobs/reminders", {
        method: "POST",
        headers: { Authorization: `Bearer ${webhookSecret}` },
      })
    ).status === 200,
    "authenticated reminder cleanup job runs",
  );
  await page.context().clearCookies();
  for (const width of [390, 768, 1280]) {
    const responsivePage = await browserContext.newPage();
    await responsivePage.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/trainers",
      `/trainers/${trainer.slug}`,
      "/login",
      "/register",
      "/contact",
      "/terms",
      "/privacy",
      "/cancellation-refunds",
    ]) {
      const response = await responsivePage.goto(origin + route, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await responsivePage
        .locator("body")
        .waitFor({ state: "visible" });
      check(response?.ok(), `${route} loads at ${width}px`);
      check(
        await responsivePage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} fits ${width}px`,
      );
      if (width === 390)
        await responsivePage.screenshot({
          path: join(dir, route.replaceAll("/", "_") + "_mobile.png"),
          fullPage: true,
        });
    }
    await responsivePage.close();
  }
  for (const [path, cookie] of [
    ["/admin", c1.cookie],
    ["/admin", t1.cookie],
    ["/dashboard", c1.cookie],
    ["/profile", t1.cookie],
  ]) {
    await page.context().clearCookies();
    await page
      .context()
      .addCookies([
        { name: "trainer_session", value: cookie.split("=")[1], url: origin },
      ]);
    await page.goto(origin + path);
    await page.waitForURL(origin + "/");
    check(
      new URL(page.url()).pathname === "/",
      `wrong-role page redirects: ${path}`,
    );
  }
  const accounts = [
    ["/bookings", winner.cookie],
    ["/dashboard", t1.cookie],
    ["/schedule", t1.cookie],
    ["/dashboard/profile", t1.cookie],
    ["/dashboard/requests", t1.cookie],
    ["/dashboard/payouts", t1.cookie],
    ["/admin", a.cookie],
  ];
  for (const [route, cookie] of accounts) {
    await page.context().clearCookies();
    await page
      .context()
      .addCookies([
        { name: "trainer_session", value: cookie.split("=")[1], url: origin },
      ]);
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(origin + route, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.locator("body").waitFor({ state: "visible" });
      check(response?.ok(), `${route} loads at ${width}px`);
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} fits ${width}px`,
      );
      if (width === 390)
        await page.screenshot({
          path: join(dir, route.replaceAll("/", "_") + "_mobile.png"),
          fullPage: true,
        });
    }
    await page.screenshot({
      path: join(dir, route.replaceAll("/", "_") + ".png"),
      fullPage: true,
    });
  }
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "trainer_session",
      value: winner.cookie.split("=")[1],
      url: origin,
    },
  ]);
  const secondTab = await browserContext.newPage();
  await Promise.all([
    page.goto(origin + "/bookings"),
    secondTab.goto(origin + "/bookings"),
  ]);
  await page.getByRole("button", { name: "Log out" }).click();
  await secondTab.waitForURL((url) => url.pathname === "/login", {
    timeout: 15000,
  });
  check(true, "logout invalidates protected access in another browser tab");
  await secondTab.close();
  check(
    errors.length === 0,
    `no browser runtime errors (${errors.join("; ")})`,
  );
  check(
    (
      await api("/api/admin", {
        cookie: a.cookie,
        method: "POST",
        data: { id: t1.json.user.id, action: "SUSPEND" },
      })
    ).status === 200,
    "admin can suspend trainer",
  );
  check(
    (await api("/api/trainers/slots", { cookie: t1.cookie })).status === 401,
    "suspension invalidates active sessions",
  );
  check(
    (await api("/api/auth/logout", { cookie: c1.cookie, method: "POST" }))
      .status === 200,
    "logout succeeds",
  );
  check(
    (await api("/api/bookings", { cookie: c1.cookie })).status === 401,
    "logged-out session cannot access bookings",
  );
  console.log(`\n${checks} checks passed. Artifacts: ${dir}`);
  writeFileSync(
    "docs/test-results.json",
    JSON.stringify(
      {
        checks,
        passed: true,
        artifacts: dir,
        date: new Date().toISOString(),
        payment:
          "Isolated Razorpay SDK stub and real signature verification; no external charges.",
      },
      null,
      2,
    ),
  );
} finally {
  if (browser) await browser.close();
  if (app) app.kill("SIGTERM");
  if (db) await db.$disconnect();
  await pg.stop().catch(() => {});
}
