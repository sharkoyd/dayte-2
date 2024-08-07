const catchAsync = require("./catchAsync");
const User = require("../models/User");
const Recommendation = require("../models/recommendation");

const generateRecommendations = async (userId) => {
  // Get the user's date of birth and interests
  const user = await User.findById(userId).populate("interests");
  if (!user) {
    throw new Error("User not found");
  }

  // check if the user has a generated recommendation in the past 24 hr
  const existingRecommendation = await Recommendation.findOne({
    user: userId,
    date: { $gte: new Date(new Date() - 24 * 60 * 60 * 1000) },
  });

  if (existingRecommendation) {
    return existingRecommendation;
  }

  // Calculate the user's age
  const age = Math.floor(
    (new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
  );

  // Calculate the date of birth range for users within 5 years of age
  const dobStart = new Date(
    new Date().setFullYear(new Date().getFullYear() - age - 20)
  );
  const dobEnd = new Date(
    new Date().setFullYear(new Date().getFullYear() - -age + 20)
  );

  // Find 12 random users with the ones that have more shared interests first and exclude the current user
  // let recommendedUsers = await User.aggregate([
  //   { $match: { _id: { $ne: userId } } },
  //   { $sample: { size: 12 } },
  //   {
  //     $addFields: {
  //       sharedInterests: {
  //         $size: {
  //           $setIntersection: ["$interests", user.interests],
  //         },
  //       },
  //     },
  //   },
  //   { $sort: { sharedInterests: -1 } },
  // ]);

  // 👆🏻👆🏻👆🏻 still not tested yet ... if you face error comment it and uncomment the one bellow 👇🏻👇🏻👇🏻

  let recommendedUsers = await User.find({
    _id: { $ne: userId }, // Exclude the current user
    date_of_birth: { $gte: dobStart, $lte: dobEnd }, // Users within 20 years of age
    interests: { $in: user.interests.map((interest) => interest._id) }, // Users with at least one shared interest
  });

  // Check if the user's plan is free and limit the recommended users to 6
  if (user.plan === "free" || user.plan === "basic"){
    recommendedUsers = recommendedUsers.slice(0, 9);
  }


  if (user.plan === "premium"){
    recommendedUsers = recommendedUsers.slice(0, 12);

  }

  // Create a new recommendation
  const recommendation = new Recommendation({
    user: userId,
    recommendedUsers: recommendedUsers,
    date: new Date(),
  });

  await recommendation.save();

  console.log("Recommendation generated successfully");
  return recommendation;
};

module.exports = generateRecommendations;
