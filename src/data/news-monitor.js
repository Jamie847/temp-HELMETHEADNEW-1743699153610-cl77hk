import { NewsAggregator } from './news-aggregator.js';
import { generateResponse } from '../config/personality.js';
import { EventEmitter } from 'events';
import OpenAI from 'openai';

export class NewsMonitor extends EventEmitter {
  constructor(twitterClient, openaiClient) {
    super();
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.newsAggregator = new NewsAggregator();
    this.processedNews = new Set();
    this.lastTweetTime = Date.now();
    this.tweetCount = 0;
    this.MAX_TWEETS_PER_HOUR = 10;
  }

  async startMonitoring() {
    console.log('Starting enhanced news monitoring...');

    // Monitor news sources
    this.newsAggregator.onUpdate(async (updates) => {
      for (const update of updates.news) {
        if (!this.processedNews.has(update.link)) {
          await this.processNewsUpdate(update);
          this.processedNews.add(update.link);
        }
      }
    });

    await this.newsAggregator.startMonitoring();
  }

  async processNewsUpdate(news) {
    try {
      if (!this.canTweet()) return;

      // Generate AI analysis of the news
      const analysis = await this.generateNewsAnalysis(news);
      
      // Post tweet with analysis
      const tweet = await this.twitter.v2.tweet(analysis);
      this.emit('tweet', tweet);
      
      this.updateTweetTracking();
      
      console.log('Posted news analysis:', news.title);
    } catch (error) {
      console.error('Error processing news update:', error);
    }
  }

  async generateNewsAnalysis(news) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `Analyze this football news and create an engaging tweet:
            Title: ${news.title}
            Source: ${news.source}
            
            Guidelines:
            - Provide unique insights or analysis
            - Use football terminology appropriately
            - Keep it under 240 characters
            - Include link to full article
            - Do not add any default hashtags`
        }]
      });

      return `${completion.choices[0].message.content}\n${news.link}`;
    } catch (error) {
      console.error('Error generating analysis:', error);
      return `Breaking: ${news.title}\n\nRead more: ${news.link}`;
    }
  }

  canTweet() {
    return (
      Date.now() - this.lastTweetTime >= 300000 && // 5 minute minimum
      this.tweetCount < this.MAX_TWEETS_PER_HOUR
    );
  }

  updateTweetTracking() {
    this.tweetCount++;
    this.lastTweetTime = Date.now();
    setTimeout(() => this.tweetCount--, 3600000);
  }
}