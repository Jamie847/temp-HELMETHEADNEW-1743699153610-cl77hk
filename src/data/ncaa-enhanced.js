import fetch from 'node-fetch';

const NCAA_BASE_URL = 'https://data.ncaa.com/casablanca/v1/sports/football/fbs';

export class NCAADataClient {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = new Map();
    this.UPDATE_INTERVAL = 30000; // 30 seconds
  }

  async getGameData(gameId) {
    try {
      // Check cache first
      if (this.shouldUseCache(gameId)) {
        return this.cache.get(gameId);
      }

      // Fetch all game data in parallel
      const [boxscore, playByPlay, scoreboard] = await Promise.all([
        this.fetchBoxscore(gameId),
        this.fetchPlayByPlay(gameId),
        this.fetchScoreboard()
      ]);

      if (!boxscore || !playByPlay) {
        throw new Error('Failed to fetch game data');
      }

      // Combine and validate data
      const gameData = this.processGameData(boxscore, playByPlay, scoreboard);
      
      // Update cache
      this.cache.set(gameId, gameData);
      this.lastUpdate.set(gameId, Date.now());

      return gameData;
    } catch (error) {
      console.error('NCAA data fetch error:', error);
      return null;
    }
  }

  async fetchScoreboard() {
    try {
      const response = await fetch(`${NCAA_BASE_URL}/scoreboard`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      return this.processScoreboardData(data);
    } catch (error) {
      console.error('Scoreboard fetch error:', error);
      return null;
    }
  }

  processScoreboardData(data) {
    if (!data.games) return null;

    return data.games.map(gameData => {
      const game = gameData.game;
      return {
        gameId: game.gameID,
        status: {
          state: game.gameState,
          period: game.currentPeriod,
          clock: game.contestClock,
          final: game.gameState === 'final'
        },
        teams: {
          home: {
            name: game.home.names.full,
            shortName: game.home.names.short,
            score: parseInt(game.home.score) || 0,
            rank: game.home.rank,
            record: game.home.description,
            winner: game.home.winner,
            conferences: game.home.conferences.map(conf => conf.conferenceName)
          },
          away: {
            name: game.away.names.full,
            shortName: game.away.names.short,
            score: parseInt(game.away.score) || 0,
            rank: game.away.rank,
            record: game.away.description,
            winner: game.away.winner,
            conferences: game.away.conferences.map(conf => conf.conferenceName)
          }
        },
        startTime: game.startTime,
        startTimeEpoch: parseInt(game.startTimeEpoch),
        network: game.network,
        venue: game.contestName
      };
    });
  }

  // Existing methods remain the same
  async fetchBoxscore(gameId) {
    try {
      const url = `${NCAA_BASE_URL}/games/${gameId}/boxscore`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Boxscore fetch error:', error);
      return null;
    }
  }

  async fetchPlayByPlay(gameId) {
    try {
      const url = `${NCAA_BASE_URL}/games/${gameId}/pbp`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Play-by-play fetch error:', error);
      return null;
    }
  }

  processGameData(boxscore, playByPlay, scoreboard) {
    if (!boxscore?.teams || !playByPlay?.plays) {
      throw new Error('Invalid game data format');
    }

    // Find the game in scoreboard data for additional details
    const scoreboardGame = scoreboard?.find(game => 
      game.gameId === boxscore.gameId
    );

    return {
      gameId: boxscore.gameId,
      status: scoreboardGame?.status || {
        period: boxscore.currentPeriod,
        clock: boxscore.gameClock,
        final: boxscore.final
      },
      teams: {
        home: {
          ...scoreboardGame?.teams.home,
          stats: this.processTeamStats(boxscore.teams.find(team => team.homeTeam))
        },
        away: {
          ...scoreboardGame?.teams.away,
          stats: this.processTeamStats(boxscore.teams.find(team => !team.homeTeam))
        }
      },
      latestPlay: playByPlay.plays[playByPlay.plays.length - 1] ? {
        text: playByPlay.plays[playByPlay.plays.length - 1].text,
        clock: playByPlay.plays[playByPlay.plays.length - 1].clock,
        quarter: playByPlay.plays[playByPlay.plays.length - 1].period,
        scoringPlay: playByPlay.plays[playByPlay.plays.length - 1].scoring || false,
        yards: playByPlay.plays[playByPlay.plays.length - 1].yards || 0,
        playType: playByPlay.plays[playByPlay.plays.length - 1].type
      } : null,
      startTime: scoreboardGame?.startTime,
      startTimeEpoch: scoreboardGame?.startTimeEpoch,
      network: scoreboardGame?.network,
      venue: scoreboardGame?.venue
    };
  }

  processTeamStats(team) {
    return {
      firstDowns: parseInt(team.stats?.firstDowns) || 0,
      rushingYards: parseInt(team.stats?.rushingYards) || 0,
      passingYards: parseInt(team.stats?.passingYards) || 0,
      totalYards: parseInt(team.stats?.totalYards) || 0,
      turnovers: parseInt(team.stats?.turnovers) || 0
    };
  }

  shouldUseCache(gameId) {
    const lastUpdateTime = this.lastUpdate.get(gameId);
    return lastUpdateTime && (Date.now() - lastUpdateTime < this.UPDATE_INTERVAL);
  }

  clearCache(gameId) {
    if (gameId) {
      this.cache.delete(gameId);
      this.lastUpdate.delete(gameId);
    } else {
      this.cache.clear();
      this.lastUpdate.clear();
    }
  }
}