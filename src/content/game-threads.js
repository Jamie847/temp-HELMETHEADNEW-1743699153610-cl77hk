import { TwitterApi } from 'twitter-api-v2';
import { verifyGameData } from '../data/game-verification.js';

export class GameThreadManager {
  constructor(client) {
    this.twitter = client;
    this.activeThreads = new Map();
  }

  async startGameThread(gameId) {
    const gameData = await verifyGameData(gameId);
    
    // Create thread starter
    const starter = await this.twitter.v2.tweet(
      `🏈 LIVE GAME THREAD\n${gameData.homeTeam} vs ${gameData.awayTeam}\n\nFollow this thread for live updates, stats, and analysis!\n\n#CFB #JANSANITY`
    );
    
    this.activeThreads.set(gameId, {
      threadId: starter.data.id,
      lastUpdate: Date.now(),
      score: gameData.score,
      quarter: gameData.quarter
    });
    
    return starter.data.id;
  }

  async updateGameThread(gameId) {
    const thread = this.activeThreads.get(gameId);
    const gameData = await verifyGameData(gameId);
    
    if (this.shouldUpdate(gameData, thread)) {
      await this.twitter.v2.reply(
        this.generateUpdate(gameData),
        thread.threadId
      );
      
      this.activeThreads.set(gameId, {
        ...thread,
        lastUpdate: Date.now(),
        score: gameData.score,
        quarter: gameData.quarter
      });
    }
  }

  shouldUpdate(gameData, thread) {
    return (
      Date.now() - thread.lastUpdate >= 300000 || // 5 minutes passed
      gameData.score !== thread.score ||
      gameData.quarter !== thread.quarter
    );
  }
}