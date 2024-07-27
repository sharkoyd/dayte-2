const User = require("../models/User"); // Adjust the path as needed
const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");


module.exports = catchAsync(async function (req, res, next) {
  const user = await User.findById(req.user._id);
  const plan = user.plan;
  if (plan == "free") {
    if (user.end_of_plan < Date.now()) {
      return next(new appError("Your Free Trial has expired, please Subscribe to a plan", 405));
    }
  }

  if (plan == "premium" || plan == "basic") {
    if (user.end_of_plan < Date.now()) {
      return next(new appError("Your Plan has expired, please renew", 405));
    }
  }
  next();
});