const express = require("express");
const Feedback = require("../models/Feedback");

const router = express.Router();

// GET /api/feedback — latest 20 messages
router.get("/", async (req, res, next) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback — anyone can leave feedback
router.post("/", async (req, res, next) => {
  try {
    const { name, message } = req.body;
    const item = await Feedback.create({ name, message });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
