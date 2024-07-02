// Desc: Middleware to check if user profile is finished

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/User");

module.exports = catchAsync(async function (req, res, next) {
    const user = await User.findById(req.user._id);
    const emptyFields = user.getEmptyFields();
    if (emptyFields.length > 0) {
        // return app error with the right status code and the empty fields
        return next(new AppError(emptyFields, 400));
    }
    next();
}
);