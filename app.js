const express = require("express");
const mongoose = require("mongoose");
const AppError = require("./utils/appError");
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

//  connecting to the database
const uri =
  "mongodb+srv://hbechir52:f9lGeVA5Kq5SdWr9@dayte.fhrecju.mongodb.net/?retryWrites=true&w=majority&appName=dayte";
mongoose
  .connect(uri)
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });




// 🔀 Routing ----------------------------------------------------------

  // static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const interestRoutes = require('./routes/interestRoutes');
const authRoutes = require('./routes/authRoutes');
app.use(express.json()); // for parsing application/json
app.use('/interests', interestRoutes);
app.use('/user', authRoutes);
app.use('/recommendations', require('./routes/recommendationRoutes'));
app.use('/date', require('./routes/dateRoutes'));
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

