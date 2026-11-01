// 404 for unknown addresses
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Not found: ${req.originalUrl}` });
}

// Central error handler so the server never crashes on a bad request
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ success: false, message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: "Duplicate entry" });
  }
  if (process.env.NODE_ENV !== "test") console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error" });
}

module.exports = { notFound, errorHandler };
