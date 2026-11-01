// Sample events + optional admin account, shared by seed.js and server start-up
const bcrypt = require("bcrypt");
const Event = require("./models/Event");
const User = require("./models/User");

const events = [
  { name: "CodeSprint", category: "technical", fee: 100, seats: 60, date: "2026-12-10T09:30:00+05:30", venue: "CS Lab 1", description: "3-hour competitive programming contest." },
  { name: "HackNight 24h", category: "technical", fee: 300, seats: 40, date: "2026-12-10T18:00:00+05:30", venue: "Seminar Hall", description: "Overnight hackathon on campus problems." },
  { name: "RoboWars", category: "technical", fee: 250, seats: 24, date: "2026-12-11T10:00:00+05:30", venue: "Open Arena", description: "Bot-vs-bot combat in the arena." },
  { name: "Web Dev Bootcamp", category: "workshop", fee: 150, seats: 50, date: "2026-12-11T14:00:00+05:30", venue: "CS Lab 2", description: "Build and deploy a MERN app in one afternoon." },
  { name: "AI with TinyML", category: "workshop", fee: 200, seats: 30, date: "2026-12-12T09:30:00+05:30", venue: "IoT Lab", description: "Run neural networks on microcontrollers." },
  { name: "Tech Quiz", category: "non-technical", fee: 50, seats: 80, date: "2026-12-12T11:00:00+05:30", venue: "Auditorium", description: "Three rounds of tech trivia." },
  { name: "Photography Walk", category: "non-technical", fee: 0, seats: 2, date: "2026-12-12T16:00:00+05:30", venue: "Campus", description: "Capture TechFest in frames." },
];

// Creates/updates the admin from ADMIN_EMAIL + ADMIN_PASSWORD (if both are set)
async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing && existing.role === "admin" && (await bcrypt.compare(ADMIN_PASSWORD, existing.password))) return true;
  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.findOneAndUpdate({ email }, { name: "TechFest Admin", email, password, role: "admin" }, { upsert: true });
  return true;
}

// Used on server start: only inserts events when the collection is empty
async function seedIfEmpty() {
  if ((await Event.estimatedDocumentCount()) === 0) {
    await Event.insertMany(events);
    console.log(`Seeded ${events.length} events`);
  }
  if (await ensureAdmin()) console.log("Admin account ready");
}

module.exports = { events, ensureAdmin, seedIfEmpty };
