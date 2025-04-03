import { bettingClient } from './api-client.js';
import { sleep } from '../utils.js';

export class HistoricalAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  async getHistoricalMatchups(team1, team2) {
    const cacheKey = `${team1}-${team2}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await bettingClient.getHistoricalGames(team1, team2);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching historical matchups:', error);
      return null;
    }
  }

  calculateHistoricalMetrics(games) {
    if (!games?.length) return null;

    return {
      avgPointDiff: this.calculateAveragePointDiff(games),
      avgSpreadCover: this.calculateSpreadCoverage(games),
      h2hRecord: this.getHeadToHeadRecord(games),
      momentum: this.calculateMomentum(games),
      situationalSpots: this.analyzeSituationalSpots(games)
    };
  }

  calculateAveragePointDiff(games) {
    return games.reduce((acc, game) => acc + (game.homeScore - game.awayScore), 0) / games.length;
  }

  calculateSpreadCoverage(games) {
    const covers = games.filter(game => 
      (game.homeScore - game.awayScore) > game.spread
    ).length;
    return covers / games.length;
  }

  getHeadToHeadRecord(games) {
    return games.reduce((record, game) => {
      if (game.homeScore > game.awayScore) record.home++;
      else if (game.awayScore > game.homeScore) record.away++;
      else record.ties++;
      return record;
    }, { home: 0, away: 0, ties: 0 });
  }

  calculateMomentum(games) {
    // Focus on last 5 games
    const recentGames = games.slice(-5);
    return recentGames.reduce((momentum, game, index) => {
      const weight = (index + 1) / recentGames.length; // More recent games weighted higher
      const pointDiff = game.homeScore - game.awayScore;
      return momentum + (pointDiff * weight);
    }, 0);
  }

  analyzeSituationalSpots(games) {
    return {
      homeFieldAdvantage: this.calculateHomeFieldAdvantage(games),
      restAdvantage: this.calculateRestAdvantage(games),
      weatherImpact: this.analyzeWeatherImpact(games)
    };
  }

  calculateHomeFieldAdvantage(games) {
    const homeWins = games.filter(g => g.homeScore > g.awayScore).length;
    return homeWins / games.length;
  }

  calculateRestAdvantage(games) {
    return games.reduce((acc, game) => {
      const restDiff = game.homeTeamRestDays - game.awayTeamRestDays;
      const winner = game.homeScore > game.awayScore ? 'home' : 'away';
      return {
        ...acc,
        [restDiff]: {
          total: (acc[restDiff]?.total || 0) + 1,
          wins: (acc[restDiff]?.wins || 0) + (winner === 'home' ? 1 : 0)
        }
      };
    }, {});
  }

  analyzeWeatherImpact(games) {
    return games.reduce((acc, game) => {
      if (!game.weather) return acc;
      const condition = game.weather.condition;
      const totalPoints = game.homeScore + game.awayScore;
      return {
        ...acc,
        [condition]: {
          games: (acc[condition]?.games || 0) + 1,
          avgPoints: ((acc[condition]?.avgPoints || 0) * (acc[condition]?.games || 0) + totalPoints) / 
            ((acc[condition]?.games || 0) + 1)
        }
      };
    }, {});
  }
}