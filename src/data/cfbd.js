// Simplified version without external dependency
export async function getGames(year, week) {
  try {
    const response = await fetch(`https://api.collegefootballdata.com/games?year=${year}&week=${week}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CFBD_API_KEY}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

export async function getTeamStats(year, team) {
  try {
    const response = await fetch(`https://api.collegefootballdata.com/stats/team?year=${year}&team=${team}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CFBD_API_KEY}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return [];
  }
}

export async function getRankings(year, week) {
  try {
    const response = await fetch(`https://api.collegefootballdata.com/rankings?year=${year}&week=${week}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CFBD_API_KEY}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
}