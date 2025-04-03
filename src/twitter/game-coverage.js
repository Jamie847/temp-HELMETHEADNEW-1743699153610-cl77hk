import { verifyGameData, getVerifiedGames } from '../data/game-verification.js';
import { sleep } from '../utils.js';
import { PERSONALITY_TRAITS } from '../config/personality.js';

export class GameCoverage {
  constructor(client, agent) {
    this.client = client;
    this.agent = agent;
    this.gameUpdates = new Map();
    this.tweetCount = 0;
    this.MAX_TWEETS_PER_HOUR = 15;
  }

  async startCoverage() {
    console.log('Starting verified game coverage...');
    
    while (true) {
      try {
        const games = await getVerifiedGames();
        
        for (const game of games) {
          if (game.verified) {
            const gameData = await verifyGameData(game.id);
            
            if (gameData?.verified) {
              const lastUpdate = this.gameUpdates.get(game.id);
              
              if (this.shouldPostUpdate(gameData, lastUpdate)) {
                if (this.tweetCount < this.MAX_TWEETS_PER_HOUR) {
                  const tweet = await this.generateGameUpdate(gameData);
                  await this.client.v2.tweet(tweet);
                  this.tweetCount++;
                  
                  setTimeout(() => this.tweetCount--, 3600000);
                  
                  this.gameUpdates.set(game.id, {
                    score: `${gameData.homeScore}-${gameData.awayScore}`,
                    quarter: gameData.quarter,
                    lastPlay: gameData.lastPlay?.id
                  });
                  
                  await sleep(300000);
                }
              }
            }
          }
        }
        
        await sleep(30000);
      } catch (error) {
        console.error('Error in game coverage:', error);
        await sleep(30000);
      }
    }
  }

  shouldPostUpdate(gameData, lastUpdate) {
    if (!lastUpdate) return true;
    
    return (
      gameData.score !== lastUpdate.score ||
      gameData.quarter !== lastUpdate.quarter ||
      gameData.lastPlay?.id !== lastUpdate.lastPlay
    );
  }

  async generateGameUpdate(gameData) {
    return await this.agent.generateResponse(
      `Game Update: ${gameData.homeTeam} ${gameData.homeScore}, ${gameData.awayTeam} ${gameData.awayScore} - Q${gameData.quarter}`
    );
  }
}