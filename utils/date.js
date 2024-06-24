function findCommonTime(likingUserProposedTime, likedUserProposedTime) {
  const commonTimes = [];
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let likingUserTime of likingUserProposedTime) {
    for (let likedUserTime of likedUserProposedTime) {
      if (likingUserTime.day === likedUserTime.day && likingUserTime.time === likedUserTime.time) {
        // Convert the day and time to a Date object
        const date = new Date();
        date.setHours(Number(likingUserTime.time.split(':')[0]));
        date.setMinutes(Number(likingUserTime.time.split(':')[1]));
        date.setDate(date.getDate() + ((7 + days.indexOf(likingUserTime.day) - date.getDay()) % 7));

        commonTimes.push(date);
      }
    }
  }

  // Sort the common times by how close they are to the current time
  commonTimes.sort((a, b) => Math.abs(now - a) - Math.abs(now - b));

  // If there are no common times, find the closest time that could be common
  if (commonTimes.length === 0) {
    // find the most convenable for both users time, which is the the closest day and time between the two users days and times 
    let minDiff = Infinity;
    let closestTime = null;
    for (let likingUserTime of likingUserProposedTime) {
      for (let likedUserTime of likedUserProposedTime) {
        const likingUserDate = new Date();
        likingUserDate.setHours(Number(likingUserTime.time.split(':')[0]));
        likingUserDate.setMinutes(Number(likingUserTime.time.split(':')[1]));
        likingUserDate.setDate(likingUserDate.getDate() + ((7 + days.indexOf(likingUserTime.day) - likingUserDate.getDay()) % 7));

        const likedUserDate = new Date();
        likedUserDate.setHours(Number(likedUserTime.time.split(':')[0]));
        likedUserDate.setMinutes(Number(likedUserTime.time.split(':')[1]));
        likedUserDate.setDate(likedUserDate.getDate() + ((7 + days.indexOf(likedUserTime.day) - likedUserDate.getDay()) % 7));

        const diff = Math.abs(likingUserDate - likedUserDate);
        if (diff < minDiff) {
          minDiff = diff;
          closestTime = likingUserDate < likedUserDate ? likingUserDate : likedUserDate;
        }
      }
    }
  }

  return commonTimes[0];
}