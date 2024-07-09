const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  recommendedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
});


recommendationSchema.pre(/^find/, function (next) {
  this.populate('recommendedUsers');
  next();
});
// method to check if the user already has recommendations with less than 24 hours

recommendationSchema.statics.checkShuffleEligibility = async function (userId) {
  
  const lastRecommendation = await this.findOne({ user: userId }).sort({ date: -1 });
  if (!lastRecommendation) return true;
  const lastRecommendationDate = lastRecommendation.date;
  const currentDate = new Date();
  const difference = currentDate - lastRecommendationDate;
  const hours = difference / (1000 * 60 * 60);
  if (hours <= 24) return false;
  return true;
}



module.exports = mongoose.model('Recommendation', recommendationSchema);