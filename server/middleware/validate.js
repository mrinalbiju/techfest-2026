const { body, validationResult } = require("express-validator");

// Sends 400 with the first error message if any validator failed
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
}

// isString() rejects objects such as {"$ne": null} before they reach MongoDB
const rules = {
  register: [
    body("name", "Name must be 3-40 characters").isString().trim().isLength({ min: 3, max: 40 }),
    body("email", "Valid email required").isString().trim().isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body("password", "Password must be 8+ characters with a letter and a number")
      .isString()
      .isLength({ min: 8, max: 72 })
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/),
  ],
  login: [
    body("email", "Valid email required").isString().trim().isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body("password", "Password required").isString().notEmpty(),
  ],
  feedback: [
    body("name", "Name is required (max 60)").isString().trim().isLength({ min: 1, max: 60 }),
    body("message", "Message is required (max 500)").isString().trim().isLength({ min: 1, max: 500 }),
  ],
  registration: [body("eventId", "Invalid event id").isMongoId()],
};

module.exports = { validate, rules };
