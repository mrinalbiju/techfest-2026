const express = require("express");
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/events — all events (optional ?category=)
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.category === "string" && req.query.category) filter.category = req.query.category;
    const events = await Event.find(filter).sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id — one event
router.get("/:id", async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — add (admin)
router.post("/", protect, adminOnly, async (req, res, next) => {
  try {
    const { name, category, description, fee, seats, date, venue } = req.body;
    const event = await Event.create({ name, category, description, fee, seats, date, venue });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id — edit (admin)
router.put("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    // Copy only the allowed fields that were actually sent
    const fields = ["name", "category", "description", "fee", "seats", "date", "venue"];
    const update = {};
    fields.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id — remove (admin)
router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
