const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UserImage = require('../models/UserImage');
const { log } = require('console');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

const UserController = {
  register: [
    upload.array('images', 12),
    catchAsync(async (req, res, next) => {
      // Save the user without the images field
      const { images, ...userWithoutImages } = req.body;
      console.log(req.body);
      const user = new User(userWithoutImages);
      await user.save();

      if (req.files) {
        // Process the images and create UserImage documents for them
        const imageIds = await Promise.all(req.files.map(async (file, index) => {
          const userImage = new UserImage({
            user_id: user._id,
            image: file.path,
            position: index
          });
          await userImage.save();
          return userImage._id;
        }));

        // Update the user with the ids of the UserImage documents
        user.images = imageIds;
        await user.save();
      }

      const token = await user.generateAuthToken();
      res.status(201).send({token });
    })
  ],
  login: catchAsync(async (req, res, next) => {
    console.log(req.body);
    console.log("--------------------------------------");
    const user = await User.findByCredentials(req.body.phone_number, req.body.password);
    const token = await user.generateAuthToken();
    res.send({token });
  }),

  getProfile: catchAsync(async (req, res, next) => {
    res.send(req.user);
  }),
};

module.exports = UserController;