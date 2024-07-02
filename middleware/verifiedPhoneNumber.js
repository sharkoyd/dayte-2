// Desc: Middleware to check if user phone number is verified

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/User");

module.exports = catchAsync(async function (req, res, next) {
    const user = await User.findById(req.user._id);
    if (!user.verified) {
        return next(new AppError("User phone number not verified", 400));
    }
    next();
}
);