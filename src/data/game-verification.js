import { getGameStats, getGamePlayByPlay, getLiveScores } from './ncaa-stats.js';
import { getGameSummary, getScoreboard } from './espn-enhanced.js';
import { scrapeGameUpdates } from './game-sources.js';

// Cache verified game data to reduce API calls
const gameCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export async function verifyGameData(gameId) {
  try {
    // Check cache first
    const cachedData = gameCache.get(gameId);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    // Fetch data from multiple sources
    const [ncaaStats, ncaaPlayByPlay, espnSummary, espnBoard, scrapedData] = await Promise.all([
      getGameStats(gameId),
      getGamePlayByPlay(gameId),
      getGameSummary(gameId),
      getScoreboard(),
      scrapeGameUpdates()
    ]);

    // Verify game status and score consistency
    const gameData = {
      verified: false,
      status: null,
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      quarter: null,
      timeRemaining: null,
      lastPlay: null,
      drives: [],
      stats: null
    };

    // Cross-reference ESPN and NCAA data
    if (espnSummary?.header?.competitions?.[0]) {
      const espnGame = espnSummary.header.competitions[0];
      gameData.homeTeam = espnGame.competitors.find(team => team.homeAway === 'home')?.team?.name;
      gameData.awayTeam = espnGame.competitors.find(team => team.homeAway === 'away')?.team?.name;
      gameData.status = espnGame.status?.type?.state;
      gameData.quarter = espnGame.status?.period;
      gameData.timeRemaining = espnGame.status?.displayClock;
    }

    // Verify scores match across sources
    const scores = {
      espn: espnSummary?.header?.competitions?.[0]?.competitors?.map(team => ({
        team: team.team.name,
        score: parseInt(team.score)
      })),
      ncaa: ncaaStats?.teams?.map(team => ({
        team: team.name,
        score: parseInt(team.score)
      })),
      scraped: scrapedData.find(game => game.homeTeam === gameData.homeTeam)
    };

    // Only set scores if they match across at least 2 sources
    if (scores.espn && scores.ncaa) {
      const espnHome = scores.espn.find(team => team.team === gameData.homeTeam);
      const ncaaHome = scores.ncaa.find(team => team.team === gameData.homeTeam);
      
      if (espnHome?.score === ncaaHome?.score) {
        gameData.homeScore = espnHome.score;
        gameData.awayScore = scores.espn.find(team => team.team === gameData.awayTeam).score;
        gameData.verified = true;
      }
    }

    // Get latest play information
    if (ncaaPlayByPlay?.plays?.length > 0) {
      gameData.lastPlay = ncaaPlayByPlay.plays[ncaaPlayByPlay.plays.length - 1];
    }

    // Cache the verified data
    gameCache.set(gameId, {
      timestamp: Date.now(),
      data: gameData
    });

    return gameData;
  } catch (error) {
    console.error('Error verifying game data:', error);
    return null;
  }
}

export async function getVerifiedGames() {
  try {
    // Get all active games from both sources
    const [ncaaScores, espnBoard] = await Promise.all([
      getLiveScores(),
      getScoreboard()
    ]);

    const games = new Map();

    // Process ESPN games
    if (espnBoard?.events) {
      for (const event of espnBoard.events) {
        games.set(event.id, {
          id: event.id,
          name: event.name,
          startTime: event.date,
          venue: event.competitions[0]?.venue?.fullName,
          status: event.status?.type?.state
        });
      }
    }

    // Cross-reference with NCAA data
    if (ncaaScores?.games) {
      for (const game of ncaaScores.games) {
        if (games.has(game.id)) {
          const existingGame = games.get(game.id);
          existingGame.verified = true;
          games.set(game.id, existingGame);
        }
      }
    }

    return Array.from(games.values());
  } catch (error) {
    console.error('Error getting verified games:', error);
    return [];
  }
}