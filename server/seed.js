// Seeds the TechFest events and (optionally) an admin account.
// Usage: npm run seed   (reads MONGO_URI, and ADMIN_EMAIL / ADMIN_PASSWORD if set)
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
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

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Event.deleteMany({});
  await Event.insertMany(events);
  console.log(`Inserted ${events.length} events`);

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL.toLowerCase() },
      { name: "TechFest Admin", email: process.env.ADMIN_EMAIL.toLowerCase(), password: hash, role: "admin" },
      { upsert: true }
    );
    console.log("Admin account ready:", process.env.ADMIN_EMAIL);
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
