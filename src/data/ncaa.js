import fetch from 'node-fetch';

const NCAA_API_BASE = 'https://data.ncaa.com/casablanca/v1/sports/football/fbs';

export async function getLiveScores() {
  const response = await fetch(`${NCAA_API_BASE}/scoreboard`);
  return response.json();
}

export async function getGameStats(gameId) {
  const response = await fetch(`${NCAA_API_BASE}/games/${gameId}/boxscore`);
  return response.json();
}

export async function getStandings() {
  const response = await fetch(`${NCAA_API_BASE}/standings`);
  return response.json();
}