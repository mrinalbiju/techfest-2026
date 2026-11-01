const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

// POST /api/auth/register  — sign up (password is hashed with bcrypt)
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ success: true, message: "Account created. Please log in.", user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  — returns a JWT
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // The request body is passed straight into the query
    const user = await User.findOne({ email: email });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    res.json({ success: true, token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — current user
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
