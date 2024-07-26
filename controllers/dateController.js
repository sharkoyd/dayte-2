const catchAsync = require("../utils/catchAsync");
const DateModel = require("../models/Date");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
  checkLikeEligibilityLikesCountAndPlan,
  findCommonTime,
} = require("../utils/date");

const Recommendation = require("../models/recommendation");
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

    let date = await DateModel.findOne({
      likingUser: likingUserId,
      likedUser: likedUserId,
    });

    // checks if the liking user has already liked the liked user
    if (date) {
      return next(
        new appError("You have already liked this user", 400)
      );
    }

    // checks if the liking user has liked more than the limit based on the plan
    const elligible = await checkLikeEligibilityLikesCountAndPlan(
      likingUserId
    );
    if (!elligible) {
      return next(
        new appError("You can't like more users try again later", 400)
      );
    }

    // increment the likes count of the recommendation
    const recommendation = await Recommendation.findOne({
      user: likingUserId,
    });
    recommendation.likes += 1;
    await recommendation.save();

    if (!date) {
      reverseDate = await DateModel.findOne({
        likingUser: likedUserId,
        likedUser: likingUserId,
      });

      if (!reverseDate) {
        date = await DateModel.create({
          likingUser: likingUserId,
          likedUser: likedUserId,
        });
      } else {
        reverseDate.matched = true;
        date = reverseDate;
      }

      await date.save();
      return res.status(206).json({ date });
    }

    await date.save();
    res.status(200).json({ date });
  }),

  getUserMatches: catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const dates = await DateModel.find({
      $or: [{ likingUser: userId }, { likedUser: userId }],
      matched: true,
    }).populate("likingUser likedUser");

    if (dates.length === 0) {
      return next(new appError("You don't have any matches", 400));
    }
    res.status(200).json({ dates });
  }),

  setProposedDate: catchAsync(async (req, res, next) => {
    const { dateId, proposedTime } = req.body;

    if (!dateId || !proposedTime) {
      return next(
        new appError("dateId and proposedTime are required", 400)
      );
    }

    const date = await DateModel.findById(dateId);

    if (!date) {
      return next(new appError("Date not found", 404));
    }

    if (
      date.likingUser.id.toString() !== req.user._id.toString() &&
      date.likedUser.id.toString() !== req.user._id.toString()
    ) {
      return next(new appError("You are not part of this date", 403));
    }

    if (!date.matched) {
      return next(
        new appError(
          "Date is not matched, can't set proposed time until the liked user likes back",
          400
        )
      );
    }

    if (date.likingUser.id.toString() === req.user._id.toString()) {
      date.likingUserProposedTime = proposedTime;
    } else {
      date.likedUserProposedTime = proposedTime;
    }

    if (
      date.likingUserProposedTime.length &&
      date.likedUserProposedTime.length
    ) {
      // find a common time and set it to finalTime
      const finalTime = findCommonTime(
        date.likingUserProposedTime,
        date.likedUserProposedTime
      );
      console.log(finalTime);
      date.finalTime = finalTime;
    }
    await date.save();
    res.status(200).json({ date });
  }),
  cancelDate: catchAsync(async (req, res, next) => {
    const { id } = req.body;

    if (!id) {
      return next(new appError("dateId is required", 400));
    }
    const date = await DateModel.findById(id);
    if (!date) {
      return next(new appError("Date not found", 404));
    }
    likedUserId = date.likedUser.id.toString();
    likingUserId = date.likingUser.id.toString();

    if (
      likingUserId !== req.user._id.toString() &&
      likedUserId !== req.user._id.toString()
    ) {
      return next(new appError("You are not part of this date", 403));
    }
    // delete the date
    await DateModel.deleteOne({ _id: id });
    res.status(200).json({ date });
  }),
};

module.exports = dateController;
