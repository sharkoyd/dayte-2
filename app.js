const express = require("express");
const AppError = require("./utils/appError");
const path = require('path');

const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const interestRoutes = require('./routes/interestRoutes');
const authRoutes = require('./routes/authRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const dateRoutes = require('./routes/dateRoutes');

// 3) ROUTES
app.use("/api/v1/interests", interestRoutes);
app.use("/api/v1/user", authRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/date", dateRoutes);

// Error handling for undefined routes
app.all("*", (req, res, next) => {
    next(new AppError("Can't find ${req.originalUrl} on this server!", 404));
});

module.exports = app;