const Recommendation = require("../models/recommendation");
const User = require("../models/User");
const DateModel = require("../models/Date");
// import from aws.js
const { fetchLandmarks } = require("../utils/aws");

function findCommonTime(
  likingUserProposedTime,
  likedUserProposedTime
) {
  const commonTimes = [];
  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let likingUserTime of likingUserProposedTime) {
    for (let likedUserTime of likedUserProposedTime) {
      if (
        likingUserTime.day === likedUserTime.day &&
        likingUserTime.time === likedUserTime.time
      ) {
        // Convert the day and time to a Date object
        const date = new Date();
        date.setHours(Number(likingUserTime.time.split(":")[0]));
        date.setMinutes(Number(likingUserTime.time.split(":")[1]));
        date.setSeconds(0);
        date.setMilliseconds(0);
        date.setDate(
          date.getDate() +
            ((7 + days.indexOf(likingUserTime.day) - date.getDay()) %
              7)
        );

        // Ensure the date is in the future
        if (date < now) {
          date.setDate(date.getDate() + 7);
        }

        commonTimes.push(date);
      }
    }
  }

  // Sort the common times by how close they are to the current time
  commonTimes.sort((a, b) => Math.abs(now - a) - Math.abs(now - b));

  // If there are no common times, find the closest time that could be common
  if (commonTimes.length === 0) {
    let minDiff = Infinity;
    let closestTime = null;
    for (let likingUserTime of likingUserProposedTime) {
      for (let likedUserTime of likedUserProposedTime) {
        const likingUserDate = new Date();
        likingUserDate.setHours(
          Number(likingUserTime.time.split(":")[0])
        );
        likingUserDate.setMinutes(
          Number(likingUserTime.time.split(":")[1])
        );
        likingUserDate.setSeconds(0);
        likingUserDate.setMilliseconds(0);
        likingUserDate.setDate(
          likingUserDate.getDate() +
            ((7 +
              days.indexOf(likingUserTime.day) -
              likingUserDate.getDay()) %
              7)
        );

        const likedUserDate = new Date();
        likedUserDate.setHours(
          Number(likedUserTime.time.split(":")[0])
        );
        likedUserDate.setMinutes(
          Number(likedUserTime.time.split(":")[1])
        );
        likedUserDate.setSeconds(0);
        likedUserDate.setMilliseconds(0);
        likedUserDate.setDate(
          likedUserDate.getDate() +
            ((7 +
              days.indexOf(likedUserTime.day) -
              likedUserDate.getDay()) %
              7)
        );

        // Ensure the dates are in the future
        if (likingUserDate < now) {
          likingUserDate.setDate(likingUserDate.getDate() + 7);
        }
        if (likedUserDate < now) {
          likedUserDate.setDate(likedUserDate.getDate() + 7);
        }

        const diff = Math.abs(likingUserDate - likedUserDate);
        if (diff < minDiff) {
          minDiff = diff;
          closestTime =
            likingUserDate < likedUserDate
              ? likingUserDate
              : likedUserDate;
        }
      }
    }
    return closestTime; // Return the closest time if no common times are found
  }

  return commonTimes[0];
}

async function checkLikeEligibilityLikesCountAndPlan(likingUser) {
  console.log("Checking like eligibility");
  const likingUserId = likingUser.toString();
  const user = await User.findById(likingUserId);
  const rec = await Recommendation.findOne({ user: likingUserId });
  const likes = rec.likes;

  if (user.plan === "free") {
    if (likes >= 3) {
      return false;
    }
    return true;
  }

  if (user.plan === "basic") {
    if (likes >= 6) {
      return false;
    }
    return true;
  }

  if (user.plan === "premium") {
    if (likes >= 12) {
      return false;
    }
    return true;
  }
}

async function assignDateLocation(dateId) {
  console.log("Assigning date location"); 
  console.log(dateId);
  const date = await DateModel.findById(dateId);
  // get the coordinates of the liking and liked users
  // location: {
  //   type: {
  //     type: String, // Required for GeoJSON objects
  //     enum: ["Point"], // 'location.type' must be 'Point'
  //   },
  //   coordinates: {
  //     type: [Number], // Array of numbers for longitude and latitude
  //   },

  console.log(date.likingUser);

  const liking = await User.findById(date.likingUser);
  const liked = await User.findById(date.likedUser);

  const likingCoordinates = liking.location.coordinates;
  const likedCoordinates = liked.location.coordinates;

  // get the midpoint between the two coordinates
  const midpoint = [
    (likingCoordinates[0] + likedCoordinates[0]) / 2,
    (likingCoordinates[1] + likedCoordinates[1]) / 2,
  ];

  // fetch the landmarks around the midpoint
  const data = await fetchLandmarks(midpoint);
  const bodyfield = data.body

  // convert bodyfield to JSON
  const landmarks = JSON.parse(bodyfield);
  



  // Set the first landmark's location to the date's location field
  if (landmarks.landmarks && landmarks.landmarks.length > 0) {
    const randomIndex = Math.floor(Math.random() * landmarks.landmarks.length);
    const randomLandmark = landmarks.landmarks[randomIndex];
    date.location = {
      type: "Point",
      coordinates: randomLandmark.Place.Geometry.Point,
      address: randomLandmark.Place.Label 
    };

    // Save the updated date object
    await date.save();
  } else {
    console.log("No landmarks found");
  }
}
module.exports = {
  findCommonTime,
  checkLikeEligibilityLikesCountAndPlan,
  assignDateLocation
};
