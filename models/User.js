const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const appError = require("../utils/appError");
const DateModel = require("./Date");

const jwt = require("jsonwebtoken");

// schema defines the structure of the documents that you can store in the collection
const Schema = mongoose.Schema;

const userSchema = new Schema({
  phone_number: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  date_of_birth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  // each user has an array of interests
  interests: [
    {
      type: Schema.Types.ObjectId,
      ref: "Interest",
    },
  ],
  // each user has an array of strings(prompts)
  prompts: [
    {
      type: String,
    },
  ],
  description: [{
    type: String,
  }],
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: "UserImage",
    },
  ],
  location: {
    type: {
      type: String, // Required for GeoJSON objects
      enum: ["Point"], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number], // Array of numbers for longitude and latitude
    },
  },
  plan: {
    type: String,
    default: "free",
    enum: ["free", "premium", "basic"],
  },
  end_of_plan: {
    type: Date,
  },
});

// Virtual field for age
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});


userSchema.methods.checkIfLikedBy = async function (currentUserId) {
  const DateModel = mongoose.model('Date'); // Assuming DateModel is already defined
  const likeStatus = await DateModel.findOne({
    likingUser: currentUserId,
    likedUser: this._id,
  });
  return !!likeStatus;
};





// Ensure virtual fields are included in toJSON and toObject
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.pre(["find", "findOne"], function () {
  this
    .populate({
      path: "images",
      options: { sort: { position: -1 } }, // Sort by position in ascending order
    })
    .populate("interests");
});

// 🔏 hashing the password before saving a new user
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.methods.getEmptyFields = function () {
  const user = this;
  const emptyFields = [];

  if (!user.name) {
    emptyFields.push("name");
  }

  if (!user.date_of_birth) {
    emptyFields.push("date_of_birth");
  }

  if (!user.gender) {
    emptyFields.push("gender");
  }

  if (user.interests.length === 0) {
    emptyFields.push("interests");
  }

  if (user.prompts.length === 0) {
    emptyFields.push("prompts");
  }

  if (!user.description) {
    emptyFields.push("description");
  }

  if (user.images.length === 0) {
    emptyFields.push("images");
  }

  if (!user.location) {
    emptyFields.push("location");
  }

  return emptyFields;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.TOKEN_SECRET
  );
  return token;
};

userSchema.statics.findByCredentials = async (phone_number, password) => {
  const user = await User.findOne({ phone_number });
  if (!user) {
    throw new Error("Wrong phone number or password");
  }
  console.log(user);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(isMatch);
  if (!isMatch) {
    throw new Error("Wrong phone number or password");
  }
  return user;
};

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

module.exports = User;
