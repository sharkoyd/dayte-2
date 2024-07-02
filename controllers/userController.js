const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const VerificationCode = require("../models/VerificationCode");
const User = require("../models/User");

const UserImage = require("../models/UserImage");
const { log } = require("console");
const appError = require("../utils/appError");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

const UserController = {
  // step 1: this gets phone number password and password 2 verify them and save the user , and authenticate the user
  register: catchAsync(async (req, res, next) => {
    const { phone_number, password, password2 } = req.body;
    if (password !== password2) {
      return next(new appError("Passwords do not match", 400));
    }
    const existingUser = await User.findOne({ phone_number });
    if (existingUser) {
      return next(new appError("User with the same phone number already exists", 400));
    }

    const user = new User({ phone_number, password });
    await user.save();
    const token = await user.generateAuthToken();
    // redirect to the next step which is validating the phone number
    res.status(201).send({ token });
  }),

  // step 2: this sends a code to the phone number
  sendVerificationCode: catchAsync(async (req, res, next) => {
    const user = req.user;

    const existingVerificationCode = await VerificationCode.findOne({
      user: user._id,
    });
    if (existingVerificationCode) {
      if (!existingVerificationCode.isExpired()) {
        return next(new appError(`Verification code already sent`, 400));
      }
      await VerificationCode.deleteMany({ user: user._id });
    }

    const verificationCode = new VerificationCode({ user: user._id });
    await verificationCode.save();
    res.status(200).send({ message: "Verification code sent" });
  }),

  // step 3: this gets the code sent to the phone number and verifies the phone number
  verifyPhoneNumber: catchAsync(async (req, res, next) => {
    const user = req.user;
    const { code } = req.body;
    const verificationCode = await VerificationCode.findOne({
      user: user._id,
      code,
    });
    if (!verificationCode) {
      return next(new appError("Invalid verification code", 400));
    }
    if (verificationCode.isExpired()) {
      return next(new appError("Verification code has expired", 400));
    }
    await VerificationCode.deleteMany({ user: user._id });
    user.verified = true;
    await user.save();
    res.status(200).send({ message: "Phone number verified" });
  }),

  finishProfile: [
    upload.array("images", 12),
    catchAsync(async (req, res, next) => {
      const { images, location, ...userWithoutImages } = req.body;
      if (location) {
        try {
          userWithoutImages.location = JSON.parse(location);
        } catch (error) {
          return next(new appError("Invalid location format", 400));
        }
      }
      let user = await User.findOne({ _id: req.user._id });
      if (user.getEmptyFields().length === 0) {
        return next(new appError("User profile already completed", 400));
      }

      user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { ...userWithoutImages },
        { new: true }
      );

      await user.save();

      if (req.files) {
        // Process the images and create UserImage documents for them
        const imageIds = await Promise.all(
          req.files.map(async (file, index) => {
            const userImage = new UserImage({
              user_id: user._id,
              image: file.path,
              position: index,
            });
            await userImage.save();
            return userImage._id;
          })
        );

        // Update the user with the ids of the UserImage documents
        user.images = imageIds;
        await user.save();
      }

      res.status(200).send({ message: "Profile completed" });
    }),
  ],

  login: catchAsync(async (req, res, next) => {
    console.log(req.body);
    console.log("--------------------------------------");
    const user = await User.findByCredentials(
      req.body.phone_number,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ token });
  }),

  getProfile: catchAsync(async (req, res, next) => {
    res.send(req.user);
  }),
};

module.exports = UserController;
