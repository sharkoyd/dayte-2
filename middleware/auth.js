const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports = catchAsync(async function (req, res, next) {

    if (!req.header('Authorization')) return next(new AppError('Access Denied', 401));
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return next(new AppError('Access Denied', 401));

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = await User.findById(verified._id);
        next();
    } catch (err) {
        next(new AppError('Invalid Token', 400));
    }
});
