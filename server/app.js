// Express application (exported separately from server.js so tests can import it)
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Render (and Vercel's /api proxy) sit in front of the app, so trust their
// X-Forwarded-* headers to get the real client IP and HTTPS status.
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

// 1. Security headers: CSP, X-Content-Type-Options, X-Frame-Options, HSTS, ...
app.use(helmet());

// 2. CORS: only our own frontend may call the API with cookies
const allowed = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
    credentials: true,
  })
);

// 3. Body parsing with a size limit, cookies, gzip compression
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(compression());

// 4. NoSQL-injection protection: strips keys that start with $ or contain .
app.use(mongoSanitize());

app.use(logger);

// 5. Brute-force protection on login/sign-up
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again in 15 minutes" },
});

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/feedback", require("./routes/feedback"));

app.use(notFound); // after all routes
app.use(errorHandler); // always last

module.exports = app;
