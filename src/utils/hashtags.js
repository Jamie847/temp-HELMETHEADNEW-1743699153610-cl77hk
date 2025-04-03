// Utility function to determine appropriate hashtags based on date and content
export function getSeasonalHashtags(contentType) {
  const now = new Date();
  const month = now.getMonth(); // 0-11 where 0 is January
  const date = now.getDate();

  // Only add seasonal hashtags for college football content
  if (contentType !== 'college') {
    return '';
  }

  // January - Use #JANSANITY
  if (month === 0) {
    return '#JANSANITY';
  }

  // November 15 - December 31 - Use #RoadToJansanity
  if ((month === 10 && date >= 15) || month === 11) {
    return '#RoadToJansanity';
  }

  return '';
}