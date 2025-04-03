// Twitter Basic Plan Limits
export const TWITTER_LIMITS = {
  TWEETS_PER_HOUR: 50,
  TWEETS_PER_DAY: 200,
  TWEET_READS_PER_MONTH: 50000,
  SEARCH_REQUESTS_PER_MONTH: 60000,
  MIN_TWEET_INTERVAL: 300000 // 5 minutes
};

// Conservative usage targets (staying well under limits)
export const USAGE_TARGETS = {
  TWEETS_PER_HOUR: 15,      // 30% of limit
  TWEETS_PER_DAY: 100,      // 50% of limit
  READS_PER_DAY: 1500,      // ~45k per month
  SEARCHES_PER_HOUR: 150    // Safe rate for search API
};

// Content type allocations
export const CONTENT_ALLOCATION = {
  BREAKING_NEWS: 0.4,    // 40% of tweets
  GAME_UPDATES: 0.3,     // 30% of tweets
  SCHEDULED: 0.2,        // 20% of tweets
  ENGAGEMENT: 0.1        // 10% of tweets
};