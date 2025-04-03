import { API_KEYS } from '../config/api-keys.js';
import { sleep } from '../utils.js';

// Rate limiting configuration for free tiers
const RATE_LIMITS = {
  ODDS_API: {
    REQUESTS_PER_MONTH: 500,
    MIN_DELAY: 60000 // 1 minute between requests
  },
  RUNDOWN: {
    REQUESTS_PER_MINUTE: 1,
    MIN_DELAY: 60000 // 1 minute between requests
  },
  BALLDONTLIE: {
    REQUESTS_PER_MINUTE: 1,
    MIN_DELAY: 60000 // 1 minute between requests
  }
};

class BettingAPIClient {
  constructor() {
    this.lastRequestTime = {
      odds: 0,
      rundown: 0,
      balldontlie: 0
    };
    this.monthlyRequestCount = {
      odds: 0,
      rundown: 0,
      balldontlie: 0
    };
    
    // Reset monthly counters
    setInterval(() => {
      this.monthlyRequestCount = {
        odds: 0,
        rundown: 0,
        balldontlie: 0
      };
    }, 2592000000); // 30 days
  }

  async getOdds(sport = 'americanfootball_ncaaf') {
    if (!this.canMakeRequest('odds')) {
      console.log('Rate limit reached for Odds API');
      return null;
    }

    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEYS.ODDS_API}&regions=us&markets=h2h,spreads&oddsFormat=american`
      );
      
      this.updateRequestCount('odds');
      return await response.json();
    } catch (error) {
      console.error('Error fetching odds:', error);
      return null;
    }
  }

  async getRundownGames(sport = 'ncaaf') {
    if (!this.canMakeRequest('rundown')) {
      console.log('Rate limit reached for Rundown API');
      return null;
    }

    try {
      const response = await fetch(
        `https://therundown-therundown-v1.p.rapidapi.com/sports/${sport}/events`,
        {
          headers: {
            'X-RapidAPI-Key': API_KEYS.RUNDOWN,
            'X-RapidAPI-Host': 'therundown-therundown-v1.p.rapidapi.com'
          }
        }
      );
      
      this.updateRequestCount('rundown');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Rundown data:', error);
      return null;
    }
  }

  canMakeRequest(api) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime[api];
    
    switch (api) {
      case 'odds':
        return (
          timeSinceLastRequest >= RATE_LIMITS.ODDS_API.MIN_DELAY &&
          this.monthlyRequestCount.odds < RATE_LIMITS.ODDS_API.REQUESTS_PER_MONTH
        );
      case 'rundown':
        return timeSinceLastRequest >= RATE_LIMITS.RUNDOWN.MIN_DELAY;
      case 'balldontlie':
        return timeSinceLastRequest >= RATE_LIMITS.BALLDONTLIE.MIN_DELAY;
      default:
        return false;
    }
  }

  updateRequestCount(api) {
    this.lastRequestTime[api] = Date.now();
    this.monthlyRequestCount[api]++;
  }
}

export const bettingClient = new BettingAPIClient();