const calculateFounderScore = (user, activityStats = {}) => {
  let score = 0;
  const tips = [];

  // 1. Profile Completeness (Max 50)
  if (user.profileImage) score += 10;
  else tips.push("Add a profile picture (+10)");

  if (user.bio && user.bio.length > 20) score += 10;
  else tips.push("Expand your bio (+10)");

  if (user.experience && user.experience.length > 0) score += 10;
  else tips.push("Add experience (+10)");

  if (user.skills && user.skills.length > 0) score += 5;
  else tips.push("Add skills (+5)");
  
  if (user.socialLinks && Object.keys(user.socialLinks).length > 0) score += 5;
  else tips.push("Add social links (+5)");

  if (user.isVerified) score += 10;
  // else tips.push("Get verified (+10)"); // Maybe too hard to push?

  // 2. Activity (Max 30)
  // Assuming activityStats passed in { postsCount, commentsCount }
  const postsScore = Math.min((activityStats.postsCount || 0) * 2, 20); // 2 points per post, max 20
  if (postsScore < 20) tips.push("Post more updates to increase visibility");
  score += postsScore;

  const commentsScore = Math.min((activityStats.commentsCount || 0) * 1, 10); // 1 point per comment, max 10
  if (commentsScore < 10) tips.push("Engage with other founders");
  score += commentsScore;

  // 3. Responses/Engagement (Max 20)
  // Assuming activityStats has responseRate (0-100)
  if (activityStats.responseRate) {
    const responseScore = Math.floor(activityStats.responseRate / 5); // Max 20 points for 100%
    score += responseScore;
    if (activityStats.responseRate < 80) tips.push("Improve your response rate to messages/questions");
  }

  return { score, tips };
};

module.exports = calculateFounderScore;
