require("dotenv").config({ quiet: true });
const app = require("./app");
const connectDB = require("./config/db");
const { seedIfEmpty } = require("./seedData");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    // Fills an empty database (e.g. a new Atlas cluster) with the sample events
    if (process.env.SEED_ON_START !== "false") await seedIfEmpty();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB error:", err.message);
    process.exit(1);
  });
