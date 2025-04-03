import WebSocket from 'ws';
import fetch from 'node-fetch';
import { API_KEYS } from '../config/api-keys.js';

const SPORTRADAR_BASE = 'https://api.sportradar.us/ncaafb/production/v7/en';
const SPORTRADAR_WS = 'wss://live.sportradar.com/ncaafb/production/v7/stream';

export class SportradarClient {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
  }

  async connectLiveStream(gameId) {
    this.ws = new WebSocket(SPORTRADAR_WS + '?api_key=' + API_KEYS.SPORTRADAR);
    
    this.ws.on('open', () => {
      console.log('Connected to Sportradar live feed');
      this.subscribe(gameId);
    });

    this.ws.on('message', (data) => {
      const update = JSON.parse(data);
      this.subscribers.forEach(callback => callback(update));
    });

    this.ws.on('error', (error) => {
      console.error('Sportradar WebSocket error:', error);
    });
  }

  subscribe(gameId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        cmd: 'subscribe',
        game_id: gameId
      }));
    }
  }

  onUpdate(callback) {
    this.subscribers.add(callback);
  }

  async getGameDetails(gameId) {
    const response = await fetch(
      SPORTRADAR_BASE + '/games/' + gameId + '/summary.json?api_key=' + API_KEYS.SPORTRADAR
    );
    
    if (!response.ok) {
      throw new Error('Sportradar API error: ' + response.status);
    }

    return await response.json();
  }

  async getPlayByPlay(gameId) {
    const response = await fetch(
      SPORTRADAR_BASE + '/games/' + gameId + '/pbp.json?api_key=' + API_KEYS.SPORTRADAR
    );

    if (!response.ok) {
      throw new Error('Sportradar API error: ' + response.status);
    }

    return await response.json();
  }

  async getTeamStats(gameId) {
    const response = await fetch(
      SPORTRADAR_BASE + '/games/' + gameId + '/statistics.json?api_key=' + API_KEYS.SPORTRADAR
    );

    if (!response.ok) {
      throw new Error('Sportradar API error: ' + response.status);
    }

    return await response.json();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}