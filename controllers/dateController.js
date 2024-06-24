const catchAsync = require("../utils/catchAsync");
const Date = require("../models/date");
const User = require("../models/User");
const mongoose = require("mongoose");

const findCommonTime = require("../utils/date");

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

  
  getUserMatches: catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const dates = await Date.find({
      $or: [{ likingUser: userId }, { likedUser: userId }],
      matched: true,
    }).populate("likingUser likedUser");

    res.status(200).json({ dates });
  }),

  
  setProposedDate: catchAsync(async (req, res, next) => {
    const { dateId, proposedTime } = req.body;

    if (!dateId || !proposedTime) {
      return next(new appError("dateId and proposedTime are required", 400));
    }

    const date = await Date.findById(dateId);

    if (!date) {
      return next(new appError("Date not found", 404));
    }



    if (
      date.likingUser.toString() !== req.user._id.toString() &&
      date.likedUser.toString() !== req.user._id.toString()
    ) {
      return next(new appError("You are not part of this date", 403));
    }

    if (!date.matched) {
      return next(new appError("Date is not matched, can't set proposed time until the liked user likes back", 400));
    }

    if (date.likingUser.toString() === req.user._id) {
      date.likingUserProposedTime = proposedTime;
    } else {
      date.likedUserProposedTime = proposedTime;
    }

  

    if (date.likingUserProposedTime.length && date.likedUserProposedTime.length) {
      // find a common time and set it to finalTime
      const finalTime = findCommonTime(date.likingUserProposedTime, date.likedUserProposedTime);
      date.finalTime = finalTime;
    }
    await date.save();
    res.status(200).json({ date });
  }

  ),
};

module.exports = dateController;
