const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { validate, rules } = require("../middleware/validate");

const router = express.Router();
const isProd = process.env.NODE_ENV === "production";

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

// Cookie options:
//  httpOnly — JavaScript (and therefore an XSS payload) cannot read the token
//  secure   — sent only over HTTPS in production
//  sameSite — "strict" means another site cannot make the browser send it (CSRF)
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

// POST /api/auth/register — sign up (password is hashed with bcrypt)
router.post("/register", rules.register, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ success: true, message: "Account created. Please log in.", user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — sets the JWT in an httpOnly cookie
router.post("/login", rules.login, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body; // both are guaranteed strings by the validators
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    res.cookie("token", signToken(user), cookieOptions);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — clears the cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me — current user, or null when not logged in (used by React on page load).
// Returns 200 either way so a visitor who is not logged in does not get a console error.
router.get("/me", (req, res, next) => {
  if (!req.cookies?.token && !req.headers.authorization) return res.json({ success: true, user: null });
  return protect(req, res, () => res.json({ success: true, user: req.user }));
});

module.exports = router;
