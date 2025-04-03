export class RateLimiter {
  constructor() {
    this.hourlyTweets = 0;
    this.dailyTweets = 0;
    this.searchCount = 0;
    this.readCount = 0;
    
    // Reset counters
    setInterval(() => this.hourlyTweets = 0, 3600000);
    setInterval(() => this.dailyTweets = 0, 86400000);
    setInterval(() => this.searchCount = 0, 900000);
    
    this.lastTweetTime = new Map();
  }

  canTweet(type) {
    const now = Date.now();
    const lastTweet = this.lastTweetTime.get(type) || 0;
    
    return (
      this.hourlyTweets < USAGE_TARGETS.TWEETS_PER_HOUR &&
      this.dailyTweets < USAGE_TARGETS.TWEETS_PER_DAY &&
      now - lastTweet >= TWITTER_LIMITS.MIN_TWEET_INTERVAL
    );
  }

  recordTweet(type) {
    this.hourlyTweets++;
    this.dailyTweets++;
    this.lastTweetTime.set(type, Date.now());
  }

  canSearch() {
    return this.searchCount < USAGE_TARGETS.SEARCHES_PER_HOUR;
  }

  recordSearch() {
    this.searchCount++;
  }
}