import { KnowledgeBase } from '../data/knowledge/index.js';

export class TweetGenerator {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.knowledgeBase = new KnowledgeBase();
    this.lastTweetTime = Date.now();
    this.tweetCount = 0;
    this.MAX_TWEETS_PER_HOUR = 15;
  }

  async generateTweet(context, type) {
    try {
      // Query knowledge base for relevant information
      const tweet = await this.knowledgeBase.query(type, context);
      return tweet;
    } catch (error) {
      console.error('Error generating tweet:', error);
      return `${context} #CFB #JANSANITY`;
    }
  }

  // ... rest of the existing code ...
}