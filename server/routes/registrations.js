const express = require("express");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { protect } = require("../middleware/auth");

const router = express.Router();

// POST /api/registrations — logged-in user registers for an event
router.post("/", protect, async (req, res, next) => {
  try {
    const eventId = String(req.body.eventId || "");
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const already = await Registration.findOne({ user: req.user._id, event: event._id });
    if (already) return res.status(400).json({ success: false, message: "Already registered for this event" });

    // Take one seat only if a seat is still free (atomic update)
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, seats: { $gt: 0 } },
      { $inc: { seats: -1 } },
      { new: true }
    );
    if (!updated) return res.status(400).json({ success: false, message: "No seats left" });

    const registration = await Registration.create({ user: req.user._id, event: event._id });
    res.status(201).json({ success: true, message: `Registered for ${event.name}`, data: registration });
  } catch (err) {
    next(err);
  }
});

// GET /api/registrations/my — the user's registrations
router.get("/my", protect, async (req, res, next) => {
  try {
    const regs = await Registration.find({ user: req.user._id }).populate("event").sort({ createdAt: -1 });
    res.json({ success: true, count: regs.length, data: regs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
