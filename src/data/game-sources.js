import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// ESPN scoreboard URL
const ESPN_URL = 'https://www.espn.com/college-football/scoreboard';
const ESPN_GAME_URL = 'https://www.espn.com/college-football/game/_/gameId/';

// Sports stats APIs
const STATS_API = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

export async function getGameStats(gameId) {
  try {
    const response = await fetch(`${STATS_API}/summary?event=${gameId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return null;
  }
}

export async function getPlayByPlay(gameId) {
  try {
    const response = await fetch(`${STATS_API}/playbyplay?event=${gameId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching play by play:', error);
    return null;
  }
}

export async function scrapeGameUpdates() {
  try {
    const response = await fetch(ESPN_URL);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const updates = [];
    
    // Extract game scores and updates
    $('.scoreboard').each((i, elem) => {
      const score = {
        homeTeam: $(elem).find('.home-team').text(),
        homeScore: $(elem).find('.home-score').text(),
        awayTeam: $(elem).find('.away-team').text(),
        awayScore: $(elem).find('.away-score').text(),
        quarter: $(elem).find('.game-status').text()
      };
      updates.push(score);
    });
    
    return updates;
  } catch (error) {
    console.error('Error scraping game updates:', error);
    return [];
  }
}