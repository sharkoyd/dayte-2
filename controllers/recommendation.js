const catchAsync = require('../utils/catchAsync');
const Recommendation = require('../models/recommendation');
const generateRecommendations = require('../utils/recommendations');

const recommendationController = {
  createRecommendation: catchAsync(async (req, res, next) => {
    // generate recommendations for the logged in user
    const recommendation = await generateRecommendations(req.user._id);
    res.send(recommendation);
  }),

  getRecommendations: catchAsync(async (req, res, next) => {
    // get recommendations for the logged in user
    const recommendations = await Recommendation.find({ user: req.user._id }).populate('recommendedUsers');
    res.send(recommendations);
  }),
};





module.exports = recommendationController;