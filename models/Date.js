const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dateSchema = new Schema({
  likingUser: { type: Schema.Types.ObjectId, ref: 'User' },
  likedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  matched: { type: Boolean, default: false },
  likingUserProposedTime: { type: Date },
  likedUserProposedTime: { type: Date },
  finalTime: { type: Date }
});

module.exports = mongoose.model('Date', dateSchema);