const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const { finishProfile } = require("../controllers/userController");


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
  first_name: {
    type: String,
  },
  last_name: {
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


userSchema.methods.getEmptyFields = function() {
  const user = this;
  const emptyFields = [];
  
  if (!user.first_name) {
    emptyFields.push('first_name');
  }
  
  if (!user.last_name) {
    emptyFields.push('last_name');
  }
  
  if (!user.date_of_birth) {
    emptyFields.push('date_of_birth');
  }
  
  if (!user.gender) {
    emptyFields.push('gender');
  }
  
  if (user.interests.length === 0) {
    emptyFields.push('interests');
  }
  
  if (user.prompts.length === 0) {
    emptyFields.push('prompts');
  }
  
  if (!user.description) {
    emptyFields.push('description');
  }
  
  if (user.images.length === 0) {
    emptyFields.push('images');
  }

  if (!user.location) {
    emptyFields.push('location');
  }
  
  return emptyFields;
};




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
