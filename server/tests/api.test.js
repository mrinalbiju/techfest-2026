// Integration tests: run against a real MongoDB (local, or the CI service container)
//   MONGO_URI=mongodb://127.0.0.1:27017/techfest_test npm test
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = require("../app");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techfest_test";
const student = { name: "Test Student", email: "student@test.com", password: "Student123" };
let event;

// Logs in and returns the Set-Cookie header (the httpOnly JWT cookie)
async function loginCookie(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.headers["set-cookie"];
}

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Registration.deleteMany({}), Feedback.deleteMany({})]);
  await User.create({ name: "Admin", email: "admin@test.com", password: await bcrypt.hash("Admin12345", 10), role: "admin" });
  event = await Event.create({ name: "CodeSprint", category: "technical", fee: 100, seats: 1, date: "2026-12-10" });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Health and security headers", () => {
  test("GET /api/health returns ok with helmet headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });

  test("unknown route returns 404 JSON", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("Authentication", () => {
  test("sign-up stores only a bcrypt hash", async () => {
    const res = await request(app).post("/api/auth/register").send(student);
    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
    const saved = await User.findOne({ email: student.email });
    expect(saved.password).not.toBe(student.password);
    expect(saved.password).toMatch(/^\$2[aby]\$10\$/);
  });

  test("weak password is rejected", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Weak One", email: "weak@test.com", password: "abc" });
    expect(res.status).toBe(400);
  });

  test("login sets an httpOnly, SameSite=Strict cookie (token not in body)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: student.email, password: student.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    const cookie = res.headers["set-cookie"][0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  test("wrong password returns 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: student.email, password: "Wrong1234" });
    expect(res.status).toBe(401);
  });

  test("NoSQL injection in login is blocked", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $regex: ".*" }, password: "Admin12345" });
    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("Protected routes", () => {
  test("adding an event without logging in returns 401", async () => {
    const res = await request(app).post("/api/events").send({ name: "X", category: "technical", fee: 0, seats: 1, date: "2026-12-12" });
    expect(res.status).toBe(401);
  });

  test("a student cannot add events (403)", async () => {
    const cookie = await loginCookie(student.email, student.password);
    const res = await request(app).post("/api/events").set("Cookie", cookie).send({ name: "X", category: "technical", fee: 0, seats: 1, date: "2026-12-12" });
    expect(res.status).toBe(403);
  });

  test("an admin can add events (201)", async () => {
    const cookie = await loginCookie("admin@test.com", "Admin12345");
    const res = await request(app).post("/api/events").set("Cookie", cookie).send({ name: "RoboWars", category: "technical", fee: 250, seats: 10, date: "2026-12-11" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("RoboWars");
  });
});

describe("Event registration", () => {
  test("student registers, seat count drops, then SOLD OUT", async () => {
    const cookie = await loginCookie(student.email, student.password);
    const res = await request(app).post("/api/registrations").set("Cookie", cookie).send({ eventId: event._id.toString() });
    expect(res.status).toBe(201);
    expect((await Event.findById(event._id)).seats).toBe(0);

    const again = await request(app).post("/api/registrations").set("Cookie", cookie).send({ eventId: event._id.toString() });
    expect(again.status).toBe(400);

    const mine = await request(app).get("/api/registrations/my").set("Cookie", cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data[0].event.name).toBe("CodeSprint");
  });

  test("invalid event id is rejected", async () => {
    const cookie = await loginCookie(student.email, student.password);
    const res = await request(app).post("/api/registrations").set("Cookie", cookie).send({ eventId: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe("Feedback", () => {
  test("HTML in feedback is stored as plain text, not executed by the API", async () => {
    const payload = "<script>alert('hi')</script>";
    const res = await request(app).post("/api/feedback").send({ name: "Tester", message: payload });
    expect(res.status).toBe(201);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.data.message).toBe(payload);
  });

  test("feedback over 500 characters is rejected", async () => {
    const res = await request(app).post("/api/feedback").send({ name: "Tester", message: "a".repeat(501) });
    expect(res.status).toBe(400);
  });
});
