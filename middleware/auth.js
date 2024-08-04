const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

module.exports = catchAsync(async function (req, res, next) {
  if (!req.header("Authorization"))
    return next(new AppError("you have to login first", 410));
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token)
    return next(new AppError("You have to login first", 410));

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = await User.findById(verified._id);
    let plan = req.user.plan;

    if (plan == "free") {
      if (req.user.end_of_plan < Date.now()) {
        return next(
          new AppError(
            "Your Free Trial has expired, please Subscribe to a plan",
            405
          )
        );
      }
    }

    if (plan == "premium" || plan == "basic") {
      if (req.user.end_of_plan < Date.now()) {
        return next(
          new AppError("Your Plan has expired, please renew", 405)
        );
      }
    }
    next();
  } catch (err) {
    next(new AppError("You have to login firszzzzzzt", 410));
  }
});
