const catchAsync = require('../utils/catchAsync');
const Recommendation = require('../models/recommendation');
const generateRecommendations = require('../utils/recommendations');
const appError = require('../utils/appError');

const recommendationController = {
  getRecommendations: catchAsync(async (req, res, next) => {
    // generate recommendations for the logged in user
    const recommendation = await generateRecommendations(req.user._id);
    res.send(recommendation);
  }),
  shuffleRecommendations: catchAsync(async (req, res, next) => {
    // CHECK IF THE USER ALREADY HAS RECOMMENDATIONS WITH LESS than 24 hours using the checkShuffleEligibility method
    const shuffleEligibility = await Recommendation.checkShuffleEligibility(req.user._id);
    if (!shuffleEligibility) {
      return next(new appError('You are not eligible to shuffle recommendations yet', 400));
    }
    // generate recommendations for the logged in user
    const recommendation = await generateRecommendations(req.user._id);
    
    // just return 200 without sending any data
    res.status(200).send();
  }),
};





module.exports = recommendationController;