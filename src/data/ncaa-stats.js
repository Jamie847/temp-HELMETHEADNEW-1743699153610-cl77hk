import fetch from 'node-fetch';

const NCAA_BASE_URL = 'https://data.ncaa.com/casablanca/v1/sports/football/fbs';

export async function getGameStats(gameId) {
  try {
    const response = await fetch(`${NCAA_BASE_URL}/games/${gameId}/boxscore`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching NCAA game stats:', error);
    return null;
  }
}

export async function getLiveScores() {
  try {
    const response = await fetch(`${NCAA_BASE_URL}/scoreboard`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching NCAA live scores:', error);
    return null;
  }
}

export async function getGamePlayByPlay(gameId) {
  try {
    const response = await fetch(`${NCAA_BASE_URL}/games/${gameId}/pbp`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching NCAA play by play:', error);
    return null;
  }
}