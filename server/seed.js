// Resets the events collection to the sample data (and creates the admin if
// ADMIN_EMAIL / ADMIN_PASSWORD are set).   Usage: npm run seed
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const Event = require("./models/Event");
const { events, ensureAdmin } = require("./seedData");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Event.deleteMany({});
  await Event.insertMany(events);
  console.log(`Inserted ${events.length} events`);
  if (await ensureAdmin()) console.log("Admin account ready:", process.env.ADMIN_EMAIL);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
