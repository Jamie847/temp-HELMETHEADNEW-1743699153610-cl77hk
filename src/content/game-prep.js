
import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';
import { getVerifiedGames } from '../data/game-verification.js';
import { ImageTweetGenerator } from '../twitter/image-tweet.js';

export class GamePrepGuide {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.imageGenerator = new ImageTweetGenerator(twitterClient, openaiClient);
  }
  
  async generateWeeklyPreviews() {
    // Run on Thursdays for weekend games
    const today = new Date();
    if (today.getDay() === 4) { // Thursday
      await this.previewTopGames();
    }
  }
  
  async previewTopGames() {
    // Get upcoming games
    const games = await getVerifiedGames();
    
    // Sort by importance (would be more sophisticated in real implementation)
    const rankedGames = this.rankGamesByImportance(games);
    
    // Preview top 3 games
    for (const game of rankedGames.slice(0, 3)) {
      await this.createGamePreview(game);
      
      // Space out posts by 2 hours
      await new Promise(resolve => setTimeout(resolve, 7200000));
    }
  }
  
  rankGamesByImportance(games) {
    // This would use a more sophisticated algorithm considering:
    // - Rankings of teams
    // - Conference implications
    // - Rivalries
    // - Playoff implications
    // For now, just sort by combined rankings if available
    return games.sort((a, b) => {
      const aRank = (a.homeTeam.rank || 50) + (a.awayTeam.rank || 50);
      const bRank = (b.homeTeam.rank || 50) + (b.awayTeam.rank || 50);
      return aRank - bRank;
    });
  }
  
  async createGamePreview(game) {
    // Generate comprehensive preview
    const preview = await this.generatePreview(game);
    
    // Generate key player to watch analysis
    const keyPlayers = await this.generateKeyPlayers(game);
    
    // Generate viewing guide
    const viewingGuide = await this.generateViewingGuide(game);
    
    // Generate preview image
    const imagePrompt = `Create a game preview image for ${game.homeTeam.name} vs ${game.awayTeam.name}. Include both team logos, team colors, game time, and TV network.`;
    
    // Post thread with all components
    await this.twitter.v2.tweetThread([
      `🏈 GAME PREP: #${game.homeTeam.name} vs #${game.awayTeam.name}\n\nKickoff: ${new Date(game.startTime).toLocaleString()}\nTV: ${game.network || 'TBD'}\n\nHelmet Head's COMPLETE fan guide 🧵👇`,
      preview.substring(0, 280),
      keyPlayers,
      viewingGuide
    ]);
    
    // Post image separately to avoid thread issue with media
    await this.imageGenerator.generateImageTweet(imagePrompt);
  }
  
  async generatePreview(game) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Create a comprehensive game preview for ${game.homeTeam.name} vs ${game.awayTeam.name}.
        
        Include:
        1. Current team situations and storylines
        2. Key matchups to watch (specific position battles)
        3. Scheme analysis and what each team needs to do to win
        4. Statistical trends and what they indicate
        5. Prediction with score and reasoning`
      }]
    });
    
    return completion.choices[0].message.content;
  }
  
  async generateKeyPlayers(game) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Identify 3 key players to watch in the ${game.homeTeam.name} vs ${game.awayTeam.name} game.
        
        For each player, provide:
        1. Name and position
        2. Season stats and impact
        3. Why they're crucial in this specific matchup
        4. What to watch for from them in this game
        
        Keep the entire response under 280 characters.`
      }]
    });
    
    return completion.choices[0].message.content;
  }
  
  async generateViewingGuide(game) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Create a viewing guide for the ${game.homeTeam.name} vs ${game.awayTeam.name} game.
        
        Include:
        1. Pre-game shows or content fans should check out
        2. What to look for in the first quarter
        3. Specific formations or plays to watch for
        4. Indicators of how the game is going (beyond the score)
        
        Keep the entire response under 280 characters.`
      }]
    });
    
    return completion.choices[0].message.content;
  }
}
