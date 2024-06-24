const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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
    const user = new User({ phone_number, password });
    await user.save();  
    const token = await user.generateAuthToken();
    res.status(201).send({ token });
  }),



  finishProfile: [ 
    upload.array("images", 12),
    catchAsync(async (req, res, next) => {
      const { images, ...userWithoutImages } = req.body;

      let user = await User.findOne({ _id: req.user._id });
      if (user.getEmptyFields().length === 0) {
        return next(new appError("User profile already completed", 400));
      }


      if (typeof req.body.location === 'string') {
        req.body.location = JSON.parse(req.body.location);
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

      const token = await user.generateAuthToken();
      res.status(201).send({ token });
    }),
  ],

  // get unfinished profile fields
  getEmptyFields: catchAsync(async (req, res, next) => {
    const user = await User.findOne({ _id: req.user._id });
    const emptyFields = user.getEmptyFields();
    res.send({ emptyFields });
  }),

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
