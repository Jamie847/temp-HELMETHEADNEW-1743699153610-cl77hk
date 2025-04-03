import { Page, ListView, Label, Button, ObservableArray } from '@nativescript/core';
import { initializeAgent } from '../../agent';

export class StatsView extends Page {
  private stats = new ObservableArray([]);
  private agent: any;

  constructor() {
    super();
    this.initializeAI();
    this.createUI();
  }

  async initializeAI() {
    this.agent = await initializeAgent();
  }

  async getPlayerStats(player: string) {
    const response = await this.agent.generateResponse(`Get stats for ${player}`);
    this.stats.push({ text: response });
  }

  async getTeamComparison(team1: string, team2: string) {
    const response = await this.agent.generateResponse(`Compare ${team1} vs ${team2}`);
    this.stats.push({ text: response });
  }

  createUI() {
    const layout = new ListView();
    layout.items = this.stats;
    layout.itemTemplate = '{text}';

    const searchBar = new SearchBar();
    searchBar.hint = "Search players or teams...";
    
    const compareBtn = new Button();
    compareBtn.text = "Compare Teams";
    
    this.content = layout;
  }
}