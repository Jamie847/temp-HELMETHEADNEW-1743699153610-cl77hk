import fetch from 'node-fetch';

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

export async function getGameSummary(gameId) {
  try {
    const response = await fetch(`${ESPN_API_BASE}/summary?event=${gameId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching ESPN game summary:', error);
    return null;
  }
}

export async function getTeamStats(teamId) {
  try {
    const response = await fetch(`${ESPN_API_BASE}/teams/${teamId}/statistics`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching ESPN team stats:', error);
    return null;
  }
}

export async function getScoreboard() {
  try {
    const response = await fetch(`${ESPN_API_BASE}/scoreboard`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return null;
  }
}

export async function getGameNews(gameId) {
  try {
    const response = await fetch(`${ESPN_API_BASE}/news?event=${gameId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching ESPN game news:', error);
    return null;
  }
}