const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VerificationCodeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiringMinutes: {
    type: Number,
    default: 5,
    required: true,
  },
});

VerificationCodeSchema.pre("save", function (next) {
  const code = Math.floor(100000 + Math.random() * 900000);
  this.code = code;
  next();
});

VerificationCodeSchema.post("save", function (doc, next) {
  console.log("Verification code created and saved");
  console.log(this.code);
  next();
});

VerificationCodeSchema.methods.isExpired = function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const diffMinutes = Math.floor(diff / 60000);
  return diffMinutes > this.expiringMinutes;
};

module.exports = mongoose.model("VerificationCode", VerificationCodeSchema);