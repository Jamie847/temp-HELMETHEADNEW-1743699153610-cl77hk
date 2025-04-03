
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { getWeekStats } from '../data/ncaa-enhanced.js';
import { ImageTweetGenerator } from '../twitter/image-tweet.js';

export class WeeklyAwardsGenerator {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.imageGenerator = new ImageTweetGenerator(twitterClient, openaiClient);
  }
  
  async generateWeeklyAwards(week) {
    const categories = [
      'Offensive Player of the Week',
      'Defensive Player of the Week',
      'Special Teams Player of the Week',
      'Coaching Decision of the Week',
      'Upset of the Week',
      'Breakthrough Performance'
    ];
    
    const weekStats = await getWeekStats(week);
    
    for (const category of categories) {
      // Generate award winner with reasoning
      const award = await this.generateAward(category, weekStats);
      
      // Post tweet with award
      await this.postAward(category, award);
      
      // Wait to space out posts
      await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 hour
    }
  }
  
  async generateAward(category, stats) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Select a winner for the "${category}" award based on this week's stats and games.
          
          Week Stats: ${JSON.stringify(stats)}
          
          Your response should include:
          1. The winner (player or team name)
          2. Detailed reasoning with specific stats/plays
          3. Honorable mentions (1-2 others)
          4. Why this performance stands out historically`
      }]
    });
    
    return completion.choices[0].message.content;
  }
  
  async postAward(category, award) {
    // Create announcement tweet
    const tweet = `🏆 HELMET HEAD WEEKLY AWARD 🏆\n\n${category}:\n\n${award.substring(0, 180)}...`;
    
    // Generate image for the award
    const image = await this.imageGenerator.generateImageTweet(`${category} award for college football this week featuring ${award.substring(0, 50)}`);
    
    return image || await this.twitter.v2.tweet(tweet);
  }
  
  async scheduleSunday() {
    // Check if it's Sunday and run the weekly awards
    const now = new Date();
    if (now.getDay() === 0) { // Sunday
      const currentWeek = this.getCurrentWeek();
      await this.generateWeeklyAwards(currentWeek);
    }
  }
  
  getCurrentWeek() {
    // Calculate current CFB week based on date
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 7, 26); // August 26th
    const diffTime = Math.abs(now - seasonStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }
}
