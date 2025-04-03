import { bettingClient } from './api-client.js';

export class SpreadAnalyzer {
  constructor() {
    this.spreadHistory = new Map();
    this.marketMovement = new Map();
  }

  async trackSpreadMovement(gameId, currentSpread) {
    const history = this.spreadHistory.get(gameId) || [];
    history.push({
      spread: currentSpread,
      timestamp: Date.now()
    });
    this.spreadHistory.set(gameId, history);

    // Analyze movement
    if (history.length > 1) {
      const movement = this.calculateMovement(history);
      this.marketMovement.set(gameId, movement);
    }
  }

  calculateMovement(history) {
    const initial = history[0].spread;
    const current = history[history.length - 1].spread;
    const timespan = history[history.length - 1].timestamp - history[0].timestamp;

    return {
      totalChange: current - initial,
      hourlyRate: (current - initial) / (timespan / 3600000),
      direction: current > initial ? 'up' : 'down',
      volatility: this.calculateVolatility(history)
    };
  }

  calculateVolatility(history) {
    const changes = history.slice(1).map((point, i) => 
      Math.abs(point.spread - history[i].spread)
    );
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  async findSpreadDiscrepancies() {
    try {
      // Get odds from multiple sources
      const [oddsApi, rundown] = await Promise.all([
        bettingClient.getOdds(),
        bettingClient.getRundownGames()
      ]);

      if (!oddsApi || !rundown) return [];

      const discrepancies = [];
      
      // Compare spreads across sources
      for (const game of oddsApi) {
        const rundownGame = this.findMatchingGame(game, rundown);
        if (rundownGame) {
          const diff = this.compareSpreadLines(game, rundownGame);
          if (Math.abs(diff) >= 1) { // Significant discrepancy threshold
            discrepancies.push({
              gameId: game.id,
              teams: {
                home: game.home_team,
                away: game.away_team
              },
              discrepancy: diff,
              confidence: this.calculateDiscrepancyConfidence(diff)
            });
          }
        }
      }

      return discrepancies;
    } catch (error) {
      console.error('Error finding spread discrepancies:', error);
      return [];
    }
  }

  findMatchingGame(oddsGame, rundownGames) {
    return rundownGames.find(rg => 
      this.normalizeTeamName(rg.home_team) === this.normalizeTeamName(oddsGame.home_team) &&
      this.normalizeTeamName(rg.away_team) === this.normalizeTeamName(oddsGame.away_team)
    );
  }

  normalizeTeamName(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace('university', '')
      .replace('college', '')
      .trim();
  }

  compareSpreadLines(game1, game2) {
    return game1.spread - game2.spread;
  }

  calculateDiscrepancyConfidence(diff) {
    // Higher confidence for larger discrepancies
    const baseConfidence = Math.min(Math.abs(diff) / 3, 1);
    
    // Adjust based on market movement
    const movement = this.marketMovement.get(game1.id);
    if (movement) {
      const movementFactor = 1 - Math.min(movement.volatility, 1);
      return baseConfidence * movementFactor;
    }
    
    return baseConfidence;
  }
}