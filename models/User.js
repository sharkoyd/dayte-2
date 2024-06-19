const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');


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
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  date_of_birth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
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
  description: {
    type: String,
  },
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: "UserImage",
    },
  ],
  location: {
    type: {
      type: String,
      enum: ["Point"], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
    },
  },
  plan: {
    type: String,
    default: "free",
  },
});



// on seelecting a user we don't want to return the password and we return the actual images in their table and the actual interests in their table


userSchema.pre(['find', 'findOne'], function() {
  this
      .populate('images')
      .populate('interests');
});


// 🔏 hashing the password before saving a new user
userSchema.pre('save', async function(next) {
  const user = this;
  if(user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.TOKEN_SECRET);
  return token;
};

userSchema.statics.findByCredentials = async (phone_number, password) => {
  const user = await User.findOne({ phone_number });
  if (!user) {
    throw new Error('Phone number not found');
  }
  console.log(user);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(isMatch);
  if (!isMatch) {
    throw new Error('Wrong phone number or password');
  }
  return user;
};

userSchema.index({ location: "2dsphere" });




const User = mongoose.model("User", userSchema);

module.exports = User;
