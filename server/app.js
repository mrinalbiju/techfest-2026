// Express application (exported separately from server.js so tests can import it)
const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/feedback", require("./routes/feedback"));

app.use(notFound); // after all routes
app.use(errorHandler); // always last

module.exports = app;
