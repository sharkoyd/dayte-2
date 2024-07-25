const Recommendation = require("../models/recommendation");
const User = require("../models/User");

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

async function checkLikeEligibilityLikesCountAndPlan(likingUserId) {
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

module.exports = {
  findCommonTime,
  checkLikeEligibilityLikesCountAndPlan,
};
