const catchAsync = require("../utils/catchAsync");
const Date = require("../models/date");
const User = require("../models/User");
const mongoose = require("mongoose");

const appError = require("../utils/appError");

const dateController = {
  like: catchAsync(async (req, res, next) => {
    const { likedUserId } = req.body;

    if (!likedUserId) {
      return next(new appError("likedUserId is required", 400));
    }

    if (likedUserId === req.user._id) {
      return next(new appError("You can't like yourself", 400));
    }


    // checks if the liked user exists
    if (
      !mongoose.Types.ObjectId.isValid(likedUserId) ||
      !(await User.findById(likedUserId))
    ) {
      return next(new appError("User not found", 404));
    }
    const likingUserId = req.user._id;

    let date = await Date.findOne({
      likingUser: likedUserId,
      likedUser: likingUserId,
    });

    if (!date) {
      date = await Date.create({
        likingUser: likingUserId,
        likedUser: likedUserId,
      });
      return res.status(201).json({ date });
    }

    date.matched = true;
    await date.save();
    res.status(200).json({ date });
  }),
};

module.exports = dateController;
