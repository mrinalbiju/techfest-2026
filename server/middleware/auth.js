const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Reads the JWT from the httpOnly cookie (browser) or the Authorization header (Postman)
function getToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Allows the request only if a valid JWT is present
async function protect(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ success: false, message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: "User no longer exists" });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// Allows only admins (use after protect)
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admins only" });
  }
  next();
}

module.exports = { protect, adminOnly };
