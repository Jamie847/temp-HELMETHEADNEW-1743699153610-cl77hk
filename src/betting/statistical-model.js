import { HistoricalAnalyzer } from './historical-data.js';
import { SpreadAnalyzer } from './spread-analyzer.js';

export class StatisticalModel {
  constructor() {
    this.historicalAnalyzer = new HistoricalAnalyzer();
    this.spreadAnalyzer = new SpreadAnalyzer();
    this.weights = {
      historical: 0.3,
      recent: 0.3,
      situational: 0.2,
      market: 0.2
    };
  }

  async generatePrediction(game) {
    try {
      // Gather all relevant data
      const [
        historicalData,
        spreadDiscrepancies,
        powerRankings,
        injuries
      ] = await Promise.all([
        this.historicalAnalyzer.getHistoricalMatchups(game.home_team, game.away_team),
        this.spreadAnalyzer.findSpreadDiscrepancies(),
        this.getPowerRankings(game),
        this.getInjuryImpact(game)
      ]);

      // Calculate component scores
      const historicalScore = this.calculateHistoricalScore(historicalData);
      const recentScore = this.calculateRecentScore(historicalData);
      const situationalScore = this.calculateSituationalScore(game, injuries);
      const marketScore = this.calculateMarketScore(spreadDiscrepancies, game.id);

      // Weighted final score
      const finalScore = (
        historicalScore * this.weights.historical +
        recentScore * this.weights.recent +
        situationalScore * this.weights.situational +
        marketScore * this.weights.market
      );

      // Generate prediction details
      return {
        prediction: this.generatePredictionText(game, finalScore),
        confidence: this.calculateConfidence(finalScore),
        analysis: this.generateAnalysis({
          game,
          historicalData,
          spreadDiscrepancies,
          powerRankings,
          injuries,
          finalScore
        }),
        estimatedValue: this.calculateEstimatedValue(finalScore, game.spread)
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      return null;
    }
  }

  calculateHistoricalScore(data) {
    if (!data) return 0.5;

    const metrics = this.historicalAnalyzer.calculateHistoricalMetrics(data);
    if (!metrics) return 0.5;

    return (
      metrics.avgSpreadCover * 0.4 +
      (metrics.h2hRecord.home / (metrics.h2hRecord.home + metrics.h2hRecord.away)) * 0.4 +
      (metrics.situationalSpots.homeFieldAdvantage) * 0.2
    );
  }

  calculateRecentScore(data) {
    if (!data) return 0.5;
    
    const recentGames = data.slice(-5);
    const momentum = this.historicalAnalyzer.calculateMomentum(recentGames);
    
    // Normalize momentum to 0-1 scale
    return Math.max(0, Math.min(1, (momentum + 10) / 20));
  }

  calculateSituationalScore(game, injuries) {
    let score = 0.5;

    // Rest advantage
    if (game.homeTeamRestDays > game.awayTeamRestDays) {
      score += 0.1;
    }

    // Home field
    score += 0.05;

    // Injury impact
    if (injuries) {
      score += this.calculateInjuryImpact(injuries);
    }

    return Math.max(0, Math.min(1, score));
  }

  calculateMarketScore(discrepancies, gameId) {
    const gameDiscrepancy = discrepancies.find(d => d.gameId === gameId);
    if (!gameDiscrepancy) return 0.5;

    return Math.max(0, Math.min(1, 0.5 + (gameDiscrepancy.discrepancy / 10)));
  }

  calculateConfidence(finalScore) {
    // Convert score to confidence level
    const baseConfidence = Math.abs(finalScore - 0.5) * 2;
    
    // Apply diminishing returns
    return Math.min(0.95, Math.pow(baseConfidence, 1.5));
  }

  calculateEstimatedValue(finalScore, spread) {
    // Calculate expected value based on model confidence
    const winProbability = finalScore;
    const breakEvenProbability = this.calculateBreakEvenProbability(spread);
    
    return ((winProbability * 100) - breakEvenProbability) / 100;
  }

  calculateBreakEvenProbability(spread) {
    // Convert spread to implied probability
    const decimal = this.americanToDecimal(spread);
    return (1 / decimal) * 100;
  }

  americanToDecimal(american) {
    if (american > 0) {
      return (american / 100) + 1;
    }
    return (100 / Math.abs(american)) + 1;
  }

  generatePredictionText(game, finalScore) {
    const favorite = finalScore > 0.5 ? game.home_team : game.away_team;
    const underdog = finalScore > 0.5 ? game.away_team : game.home_team;
    const confidence = this.calculateConfidence(finalScore);

    return `${favorite} to cover ${Math.abs(game.spread)} against ${underdog} (${(confidence * 100).toFixed(1)}% confidence)`;
  }

  generateAnalysis(data) {
    const {
      game,
      historicalData,
      spreadDiscrepancies,
      powerRankings,
      injuries,
      finalScore
    } = data;

    let analysis = [];

    // Historical trends
    if (historicalData) {
      const metrics = this.historicalAnalyzer.calculateHistoricalMetrics(historicalData);
      analysis.push(`Historical ATS: ${(metrics.avgSpreadCover * 100).toFixed(1)}%`);
    }

    // Power rankings
    if (powerRankings) {
      analysis.push(`Power Rating Edge: ${powerRankings.edge.toFixed(1)} points`);
    }

    // Injuries
    if (injuries?.length > 0) {
      analysis.push(`Key Injuries: ${injuries.length}`);
    }

    // Market analysis
    const gameDiscrepancy = spreadDiscrepancies.find(d => d.gameId === game.id);
    if (gameDiscrepancy) {
      analysis.push(`Line Value: ${gameDiscrepancy.discrepancy.toFixed(1)} points`);
    }

    return analysis.join(' | ');
  }

  async getPowerRankings(game) {
    // This would integrate with your power ratings data source
    return {
      edge: 0 // Placeholder
    };
  }

  async getInjuryImpact(game) {
    // This would integrate with your injury data source
    return [];
  }

  calculateInjuryImpact(injuries) {
    // Placeholder for injury impact calculation
    return 0;
  }
}