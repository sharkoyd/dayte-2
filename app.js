const express = require("express");
const AppError = require("./utils/appError");
const path = require("path");
const morgan = require("morgan");
const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(morgan("dev"));
// Routes
const interestRoutes = require("./routes/interestRoutes");
const authRoutes = require("./routes/authRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dateRoutes = require("./routes/dateRoutes");

// 3) ROUTES
app.use("/api/v1/interests", interestRoutes);
app.use("/api/v1/user", authRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/date", dateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    // If the error is an instance of AppError, send a formatted JSON response
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Optionally include stack trace in development mode
    });
  } else {
    // For other types of errors, you might want to send a generic response or handle them differently
    console.error("Error 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
});

// Error handling for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
