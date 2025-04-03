import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { NewsAggregator } from '../data/news-aggregator.js';
import { ImageTweetGenerator } from './image-tweet.js';
import { PERSONALITY_TRAITS } from '../config/personality.js';
import { EventEmitter } from 'events';

export class BreakingNewsMonitor extends EventEmitter {
  constructor(twitterClient, openaiClient, commandHandler) {
    super();
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.commandHandler = commandHandler;
    this.newsAggregator = new NewsAggregator();
    this.imageTweetGenerator = new ImageTweetGenerator(twitterClient, openaiClient);
    this.lastTweetTime = Date.now();
    this.tweetCount = 0;
    this.MAX_TWEETS_PER_HOUR = 15;
    this.processedItems = new Set();
  }

  async startMonitoring() {
    console.log('Starting breaking news monitoring...');

    // Start news aggregator
    this.newsAggregator.onUpdate(updates => this.handleUpdates(updates));
    await this.newsAggregator.startMonitoring();
  }

  async handleUpdates(updates) {
    try {
      // Process scores first
      for (const score of updates.scores) {
        if (this.shouldTweetScore(score)) {
          await this.tweetScore(score);
          
          // Generate image for final scores (on 20% of occasions to keep variety)
          if (score.status === 'FINAL' && Math.random() < 0.2) {
            await this.generateImageForScore(score);
          }
        }
      }

      // Then process news
      for (const news of updates.news) {
        if (this.shouldTweetNews(news)) {
          await this.tweetNews(news);
          
          // Generate image for major news (on 15% of occasions)
          if (this.isMajorNews(news) && Math.random() < 0.15) {
            await this.generateImageForNews(news);
          }
        }
      }
    } catch (error) {
      console.error('Error handling updates:', error);
    }
  }

  shouldTweetScore(score) {
    if (this.processedItems.has(score.id)) return false;
    if (!this.canTweet()) return false;

    // Only tweet final scores or significant changes
    return score.status === 'FINAL' || this.isSignificantScoreChange(score);
  }

  shouldTweetNews(news) {
    if (this.processedItems.has(news.link)) return false;
    if (!this.canTweet()) return false;

    // Check if news is recent (within last hour)
    const newsAge = Date.now() - news.date.getTime();
    return newsAge < 3600000;
  }

  isMajorNews(news) {
    // Check if news contains keywords that indicate major news
    const majorKeywords = ['breaking', 'upset', 'championship', 'transfer', 'fired', 'hired', 'injury'];
    return majorKeywords.some(keyword => 
      news.title.toLowerCase().includes(keyword)
    );
  }

  async tweetScore(score) {
    try {
      const text = await this.generateScoreTweet(score);
      const tweet = await this.twitter.v2.tweet(text);
      this.updateTweetTracking();
      this.processedItems.add(score.id);
      this.emit('tweet', tweet);
    } catch (error) {
      console.error('Error tweeting score:', error);
    }
  }

  async tweetNews(news) {
    try {
      const text = await this.generateNewsTweet(news);
      const tweet = await this.twitter.v2.tweet(text);
      this.updateTweetTracking();
      this.processedItems.add(news.link);
      this.emit('tweet', tweet);
    } catch (error) {
      console.error('Error tweeting news:', error);
    }
  }

  async generateImageForScore(score) {
    try {
      const scoreText = `FINAL: ${score.awayTeam.team.name} ${score.awayTeam.score}, ${score.homeTeam.team.name} ${score.homeTeam.score}`;
      await this.imageTweetGenerator.generateImageTweet(scoreText);
    } catch (error) {
      console.error('Error generating image for score:', error);
    }
  }

  async generateImageForNews(news) {
    try {
      await this.imageTweetGenerator.generateImageTweet(news.title);
    } catch (error) {
      console.error('Error generating image for news:', error);
    }
  }

  async generateScoreTweet(score) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [{
        role: "system",
        content: `Create a tweet about this football score:
          Game: ${score.name}
          Status: ${score.status}
          Home: ${score.homeTeam.team.name} ${score.homeTeam.score}
          Away: ${score.awayTeam.team.name} ${score.awayTeam.score}
          
          Guidelines:
          - Be concise and engaging
          - Use proper football terminology
          - Stay under 240 characters
          - Do not add any default hashtags`
      }]
    });

    return completion.choices[0].message.content;
  }

  async generateNewsTweet(news) {
    try {
      // Add exponential backoff for retries
      let retries = 3;
      let delay = 1000; // Start with 1 second delay

      while (retries > 0) {
        try {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            temperature: 0.7,
            messages: [{
              role: "system",
              content: `Create a tweet about this football news:
                Title: ${news.title}
                Source: ${news.source}
                
                Guidelines:
                - Summarize the news concisely
                - Add brief analysis if relevant
                - Include link to full article
                - Stay under 240 characters
                - Do not add any default hashtags`
            }]
          });

          return `${completion.choices[0].message.content}\n${news.link}`;
        } catch (error) {
          if (error.status === 429) { // Rate limit error
            retries--;
            if (retries > 0) {
              console.log(`Rate limit hit, waiting ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Double the delay for next retry
              continue;
            }
          }
          throw error; // Re-throw non-rate-limit errors
        }
      }
    } catch (error) {
      console.error('Error generating news tweet:', error);
      // Fallback to a simple format when OpenAI is unavailable
      return `${news.title}\n\nRead more: ${news.link}`;
    }
  }

  isSignificantScoreChange(score) {
    const cached = this.newsAggregator.cache.get(score.id);
    if (!cached) return true;

    const scoreDiff = Math.abs(
      (score.homeTeam.score - score.awayTeam.score) -
      (cached.homeTeam.score - cached.awayTeam.score)
    );

    return scoreDiff >= 7; // Significant if score difference changes by 7+ points
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