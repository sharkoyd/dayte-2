const catchAsync = require("../utils/catchAsync");
const Recommendation = require("../models/recommendation");
const generateRecommendations = require("../utils/recommendations");
const appError = require("../utils/appError");
const DateModel = require("../models/Date");

const recommendationController = {
  getRecommendations: catchAsync(async (req, res) => {
      // generate recommendations for the logged in user
      let recommendation = await generateRecommendations(req.user._id);
      // Assuming obj is your object
      rec = JSON.parse(JSON.stringify(recommendation));
      rec.recommendedUsers = await checkLikedUsers(rec.recommendedUsers, req.user._id);
      res.send(rec);
    }),
  shuffleRecommendations: catchAsync(async (req, res, next) => {
    // CHECK IF THE USER ALREADY HAS RECOMMENDATIONS WITH LESS than 24 hours using the checkShuffleEligibility method
    const shuffleEligibility = await Recommendation.checkShuffleEligibility(
      req.user._id
    );
    if (!shuffleEligibility) {
      return next(
        new appError("You are not eligible to shuffle recommendations yet", 400)
      );
    }
    // generate recommendations for the logged in user
    const recommendation = await generateRecommendations(req.user._id);

    // just return 200 without sending any data
    res.status(200).send(recommendation);
  }),
};


async function checkLikedUsers(recommendedUsers, userId) {
  // check if the user is liked by the current user in the Date model
  for (let i = 0; i < recommendedUsers.length; i++) {
    let liked = await DateModel.findOne({
      likingUser: userId,
      likedUser: recommendedUsers[i]._id,
    });
    recommendedUsers[i].isLiked = !!liked;
  }
  return recommendedUsers;
}



module.exports = recommendationController;
