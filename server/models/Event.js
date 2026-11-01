const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Event name is required"], trim: true },
    category: {
      type: String,
      enum: ["technical", "non-technical", "workshop"],
      required: true,
    },
    description: { type: String, default: "" },
    fee: { type: Number, required: true, min: 0 },
    seats: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    venue: { type: String, default: "MBCET Main Block" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
