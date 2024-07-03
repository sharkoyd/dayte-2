const express = require("express");
const AppError = require("./utils/appError");
const path = require('path');
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const globalErrorHandler = require("./controllers/errorController");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const app = express();
const bodyParser = require("body-parser");

// Middleware
app.use(express.json()); // for parsing application/json
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(xss());
app.use(mongoSanitize());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


// Routes
const interestRoutes = require('./routes/interestRoutes');
const authRoutes = require('./routes/authRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const dateRoutes = require('./routes/dateRoutes');

// 3) ROUTES
app.use("/interests", interestRoutes);
app.use("/user", authRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/date", dateRoutes);

// Error handling for undefined routes
app.all("*", (req, res, next) => {
    next(new AppError("Can't find ${req.originalUrl} on this server!", 404));
});

app.use(globalErrorHandler);

module.exports = app;