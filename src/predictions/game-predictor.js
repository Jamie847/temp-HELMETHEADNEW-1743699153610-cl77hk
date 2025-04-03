// Keep all existing imports and class definition...

// Add the missing getUpcomingGames method
async getUpcomingGames() {
  try {
    // Get upcoming games from multiple sources
    const [verifiedGames, espnGames] = await Promise.all([
      verifyGameData(),
      this.getESPNGames()
    ]);

    // Combine and deduplicate games
    const allGames = [...verifiedGames, ...espnGames];
    const uniqueGames = new Map();

    allGames.forEach(game => {
      if (!uniqueGames.has(game.id)) {
        uniqueGames.set(game.id, game);
      }
    });

    // Filter for games in the next 24 hours
    return Array.from(uniqueGames.values()).filter(game => {
      const gameTime = new Date(game.startTime);
      const now = new Date();
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
      return hoursUntilGame <= 24 && hoursUntilGame >= 2;
    });
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return [];
  }
}

// Add helper method for ESPN games
async getESPNGames() {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');
    const data = await response.json();
    return data.events?.map(event => ({
      id: event.id,
      startTime: event.date,
      homeTeam: {
        name: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.name
      },
      awayTeam: {
        name: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.name
      }
    })) || [];
  } catch (error) {
    console.error('Error fetching ESPN games:', error);
    return [];
  }
}