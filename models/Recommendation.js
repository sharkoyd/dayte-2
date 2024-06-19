const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  recommendedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  date: { type: Date, default: Date.now }
});


recommendationSchema.pre(/^find/, function (next) {
  this.populate('recommendedUsers');
  next();
});
module.exports = mongoose.model('Recommendation', recommendationSchema);