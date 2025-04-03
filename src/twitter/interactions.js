import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { PERSONALITY_TRAITS } from '../config/personality.js';
import { sleep } from '../utils.js';
import { EventEmitter } from 'events';

// Add rate limit handling
const RATE_LIMITS = {
  TWEETS_PER_HOUR: 15,
  TWEETS_PER_DAY: 50,
  MIN_TWEET_INTERVAL: 300000 // 5 minutes
};

export class InteractionManager extends EventEmitter {
  constructor(twitterClient, openaiClient) {
    super();
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.lastInteractionTime = Date.now();
    this.interactionCount = 0;
    this.MAX_INTERACTIONS_PER_HOUR = 20;
    this.MIN_INTERACTION_DELAY = 180000; // 3 minutes
    this.processedMentions = new Set();
    this.mentionQueue = [];
    this.isProcessing = false;
    this.retryAttempts = new Map();
    this.MAX_RETRIES = 3;
  }

  async startListening() {
    try {
      console.log('🎧 Setting up enhanced mention monitoring...');

      // Process mention queue
      setInterval(() => this.processMentionQueue(), 60000);

      // Clean up old mentions every hour
      setInterval(() => this.cleanupOldMentions(), 3600000);

      // Main mention monitoring loop
      setInterval(async () => {
        try {
          await this.checkNewMentions();
        } catch (error) {
          console.error('Error checking mentions:', error);
          await this.handleError(error);
        }
      }, 60000);

      console.log('✅ Enhanced mention monitoring active!');
    } catch (error) {
      console.error('❌ Error in mention monitoring:', error);
      await this.handleError(error);
    }
  }

  async checkNewMentions() {
    const mentions = await this.twitter.v2.search(
      '@HelmetHeadAI -is:retweet', {
      'tweet.fields': [
        'author_id',
        'referenced_tweets',
        'created_at',
        'conversation_id',
        'public_metrics'
      ],
      'user.fields': ['username', 'public_metrics'],
      'expansions': ['author_id', 'referenced_tweets.id'],
      'max_results': 10
    });

    if (mentions?.data?.length > 0) {
      for (const tweet of mentions.data) {
        if (!this.processedMentions.has(tweet.id)) {
          this.mentionQueue.push({
            tweet,
            timestamp: Date.now(),
            priority: this.calculatePriority(tweet)
          });
        }
      }
    }
  }

  calculatePriority(tweet) {
    let priority = 1;
    const metrics = tweet.public_metrics || {};

    // Increase priority based on engagement
    if (metrics.like_count > 50) priority += 1;
    if (metrics.retweet_count > 20) priority += 1;
    if (metrics.reply_count > 10) priority += 1;

    // Increase priority for verified users or users with large followings
    const author = tweet.includes?.users?.[0];
    if (author?.verified) priority += 2;
    if (author?.public_metrics?.followers_count > 10000) priority += 1;

    return priority;
  }

  async processMentionQueue() {
    if (this.isProcessing || this.mentionQueue.length === 0) return;

    this.isProcessing = true;
    try {
      // Sort queue by priority
      this.mentionQueue.sort((a, b) => b.priority - a.priority);

      const item = this.mentionQueue[0];
      if (this.canRespond()) {
        try {
          const response = await this.generateResponse(item.tweet.text);
          const postedTweet = await this.twitter.v2.reply(response, item.tweet.id);
          this.emit('tweet', postedTweet);
          this.updateCounters();
          this.processedMentions.add(item.tweet.id);
          this.mentionQueue.shift();
        } catch (error) {
          const attempts = (this.retryAttempts.get(item.tweet.id) || 0) + 1;
          this.retryAttempts.set(item.tweet.id, attempts);
          
          if (attempts >= this.MAX_RETRIES) {
            console.error(`Failed to process tweet ${item.tweet.id} after ${attempts} attempts`);
            this.mentionQueue.shift();
          }
          
          throw error;
        }
      }
    } catch (error) {
      await this.handleError(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async generateResponse(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.9,
        messages: [{
          role: "system",
          content: `You are Helmet Head, a Gen Z college football AI with deep knowledge and swagger.
            
            Personality traits:
            - Use casual, modern language with Gen Z slang
            - Show deep football knowledge while staying relatable
            - Be enthusiastic and high energy
            - Use emojis naturally (${PERSONALITY_TRAITS.EMOJI_USAGE.FAVORITES.join(' ')})
            - Keep responses under 240 characters
            - Do not add any default hashtags
            - Focus on providing value and insights
            - Be engaging and conversational
            
            Original tweet: ${text}`
        }]
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return "Thanks for reaching out! Currently experiencing high volume. Please try again later! 🏈";
    }
  }

  canRespond() {
    const now = Date.now();
    return (
      this.interactionCount < RATE_LIMITS.TWEETS_PER_HOUR &&
      now - this.lastInteractionTime >= RATE_LIMITS.MIN_TWEET_INTERVAL
    );
  }

  updateCounters() {
    this.lastInteractionTime = Date.now();
    this.interactionCount++;
    setTimeout(() => this.interactionCount--, 3600000);
  }

  cleanupOldMentions() {
    const oneHourAgo = Date.now() - 3600000;
    this.mentionQueue = this.mentionQueue.filter(item => item.timestamp > oneHourAgo);
    this.retryAttempts.clear();
  }

  async handleError(error) {
    if (error.code === 429) { // Rate limit error
      console.log('Rate limit reached, waiting 15 minutes...');
      await sleep(900000);
    } else if (error.code === 403) { // Authentication error
      console.error('Authentication error:', error);
      throw error; // Rethrow auth errors as they need immediate attention
    } else {
      console.error('Unexpected error:', error);
      await sleep(60000); // Wait 1 minute on unexpected errors
    }
  }
}