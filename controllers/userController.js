const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const VerificationCode = require("../models/VerificationCode");
const User = require("../models/User");
const mongoose = require("mongoose");
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
      return next(
        new appError("User with the same phone number already exists", 400)
      );
    }

    const user = new User({ phone_number, password });
    await user.save();
    const token = await user.generateAuthToken();
    // redirect to the next step which is validating the phone number

    const verificationCode = new VerificationCode({ user: user._id });
    await verificationCode.save();

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
    res.status(200).send({ message: "Verification code sent successfully" });
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
      return next(new appError("Verification code has expired, resend", 400));
    }
    await VerificationCode.deleteMany({ user: user._id });
    user.verified = true;
    await user.save();
    res
      .status(200)
      .send({ message: "Phone number has been verified successfully" });
  }),

  finishProfile: [
    upload.array("images", 12),
    catchAsync(async (req, res, next) => {
      const {
        images,
        location,
        plan,
        prompts,
        description,
        interests,
        ...userWithoutImages
      } = req.body;

      if (interests) {
        try {
          console.log("this is the interests :  " + interests);
          userWithoutImages.interests = JSON.parse(interests).map(
            (id) => new mongoose.Types.ObjectId(id)
          );
        } catch (error) {
          console.log(error);
          return next(new appError("Invalid interests format", 400));
        }
      }
      console.log("interests after parsing :  " + userWithoutImages.interests);

      // Parsing prompts
      if (prompts) {
        try {
          console.log("this is the prompts :  " + prompts);
          userWithoutImages.prompts = JSON.parse(prompts);
        } catch (error) {
          console.log(error);
          return next(new appError("Invalid prompts format", 400));
        }
      }
      console.log("prompts after parsing :  " + userWithoutImages.prompts);

      // parsing description
      if (description) {
        try {
          console.log("this is the description :  " + description);
          userWithoutImages.description = JSON.parse(description);
        } catch (error) {
          console.log(error);
          return next(new appError("Invalid description format", 400));
        }
      }
      console.log(
        "description after parsing :  " + userWithoutImages.description
      );

      if (location) {
        console.log("this is the location :  " + location);
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

      if (plan) {
        if (!["free", "premium", "basic"].includes(plan)) {
          return next(new appError("Invalid plan", 400));
        }
        if (plan === "free") {
          // if the plan is free end of plan is now plus 7 days
          user.end_of_plan = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        if (plan === "premium" || plan === "basic") {
          // if the plan is premium end of plan is now plus 30 days
          user.end_of_plan = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
      }

      user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { ...userWithoutImages, plan },
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
    console.log(req.body.phone_number);

    try {
      const user = await User.findByCredentials(
        req.body.phone_number,
        req.body.password
      );
      const token = await user.generateAuthToken();
      res.send({ token, user });
    } catch (error) {
      return next(new appError("Invalid phone number or password", 400));
    }
  }),

  getProfile: catchAsync(async (req, res, next) => {
    res.send(req.user);
  }),

  updateLocation: catchAsync(async (req, res, next) => {
    const { location } = req.body;
    if (!location) {
      return next(new appError("Location is required", 400));
    }
    try {
      console.log(location);
      const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { location: location },
        { new: true }
      );
      res.send(user);
    } catch (error) {
      return next(new appError("Invalid location format", 400));
    }
  }),

  updatePassword: catchAsync(async (req, res, next) => {
    const { oldPassword, newPassword, newPassword2 } = req.body;
    if (newPassword !== newPassword2) {
      return next(new appError("Passwords do not match", 400));
    }
    try {
      const user = await User.findByCredentials(
        req.user.phone_number,
        oldPassword
      );
      user.password = newPassword;
      await user.save();
      res.send({ message: "Password updated successfully" });
    } catch (error) {
      return next(new appError("double check your old password", 400));
    }
  }),

  // forgot password ------------------

  forgotPassword: catchAsync(async (req, res, next) => {
    const { phone_number } = req.body;
    const user = await User.findOne({ phone_number });
    if (!user) {
      return next(new appError("User not found", 400));
    }
    const verificationCode = new VerificationCode({ user: user._id });
    await verificationCode.save();
    res.send({ message: "Verification code sent successfully" });
  }),

  // reset password ------------------
  resetPassword: catchAsync(async (req, res, next) => {
    const { phone_number, password, password2 } = req.body;
    if (password !== password2) {
      return next(new appError("Passwords do not match", 400));
    }
    const user = await User.findOne({ phone_number });
    if (!user) {
      return next(new appError("User not found", 400));
    }
    user.password = password;
    await user.save();
    res.send({ message: "Password reset successfully" });
  }),

  updateProfile: [
    upload.array("new_pics", 12),
    catchAsync(async (req, res, next) => {
      const { name, date_of_birth, gender, old_pics } = req.body;
      const user = await User.findOne({ _id: req.user._id });
  
      if (!user) {
        return next(new appError("User not found", 400));
      }
  
      if (name) {
        user.name = name;
      }
  
      if (date_of_birth) {
        user.date_of_birth = date_of_birth;
      }
  
      if (gender) {
        user.gender = gender;
      }
  
      // Handle old_pics
      if (old_pics) {
        let parsed_old_pics = old_pics;
  
        if (typeof old_pics === "string") {
          parsed_old_pics = old_pics.replace(/\\/g, "\\\\");
          parsed_old_pics = JSON.parse(parsed_old_pics);
        }
  
        parsed_old_pics = parsed_old_pics.map((old_pic) =>
          old_pic.replace(/\\\\/g, "\\")
        );
  
        if (!Array.isArray(parsed_old_pics)) {
          throw new TypeError("old_pics is not an array");
        }
  
        const oldImages_in_profile = await UserImage.find({ user_id: user._id });
        const missingImages = oldImages_in_profile
          .map((image) => image.image)
          .filter((image) => !parsed_old_pics.includes(image));
  
        for (const missingImage of missingImages) {
          const image = await UserImage.findOne({ image: missingImage });
          if (image) {
            try {
              fs.unlinkSync(image.image);
              console.log("File deleted successfully");
            } catch (err) {
              console.error("Error deleting file:", err);
            }
            await UserImage.deleteOne({ image: missingImage });
          }
        }
  
        user.images = await UserImage.find({ user_id: user._id });
      }
  
      // Handle new_pics
      if (req.files && req.files.length > 0) {
        const imageIds = await Promise.all(
          req.files.map(async (file, index) => {
            const userImages = await UserImage.find({ user_id: user._id });
            let position = 0;
            for (let i = 0; i < 6; i++) {
              if (!userImages.some((image) => image.position === i)) {
                position = i;
                break;
              }
            }
  
            const userImage = new UserImage({
              user_id: user._id,
              image: file.path,
              position: position,
            });
            await userImage.save();
            return userImage._id;
          })
        );
  
        user.images = user.images.concat(imageIds);
      }
  
      await user.save();
  
      res.status(200).send({ user: user });
    }),
  ],
  
};

module.exports = UserController;
