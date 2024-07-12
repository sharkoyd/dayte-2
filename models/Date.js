const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dateSchema = new Schema({
  likingUser: { type: Schema.Types.ObjectId, ref: "User" },
  likedUser: { type: Schema.Types.ObjectId, ref: "User" },
  matched: { type: Boolean, default: false },
  // a list of week days and a time slot for each day
  likingUserProposedTime: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      time: { type: String, required: true },
    },
  ],
  // a list of week days and a time slot for each day
  likedUserProposedTime: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      time: { type: String, required: true },
    },
  ],
  finalTime: { type: Date },
  canceled: { type: Boolean, default: false },

});
// populate user
dateSchema.pre(["find", "findOne"], function () {
  this.populate("likingUser").populate("likedUser");
});



module.exports = mongoose.model("Date", dateSchema);
