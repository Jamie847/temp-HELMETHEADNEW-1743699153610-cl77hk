import { Page, ScrollView, StackLayout, Label, Button, ListView, ObservableArray } from '@nativescript/core';
import { TokenDistributor } from '../../rewards/token-distributor';

export class PlayoffChallengeView extends Page {
  private selectedTeams = new ObservableArray([]);
  private champion = null;
  private tokenDistributor = new TokenDistributor();
  private lockDate = new Date('2023-12-01T23:59:59');

  constructor() {
    super();
    this.createUI();
  }

  createUI() {
    const layout = new ScrollView();
    const content = new StackLayout();
    content.className = "playoff-challenge";

    // Header with Helmet Head logo
    const headerLayout = new StackLayout();
    headerLayout.className = "challenge-header";
    
    const logo = new Image();
    logo.src = "~/assets/helmet-head-logo.png";
    logo.className = "header-logo";
    
    const title = new Label();
    title.text = "Road To Jansanity";
    title.className = "challenge-title";
    
    const subtitle = new Label();
    subtitle.text = "College Football Playoff Challenge";
    subtitle.className = "challenge-subtitle";

    headerLayout.addChild(logo);
    headerLayout.addChild(title);
    headerLayout.addChild(subtitle);

    // Time-weighted bonus info
    const bonusInfo = new Label();
    bonusInfo.text = "🕒 Early Bird Bonus: Submit early for extra points!";
    bonusInfo.className = "bonus-info";

    // Selected teams list
    const selectedList = new ListView();
    selectedList.className = "selected-teams";
    selectedList.items = this.selectedTeams;
    selectedList.itemTemplate = this.createTeamTemplate();

    // Team selection button
    const selectButton = new Button();
    selectButton.text = "Select Teams";
    selectButton.className = "primary-button";
    selectButton.on('tap', () => this.showTeamSelector());

    // Champion selection
    const championSection = new StackLayout();
    championSection.className = "champion-section";
    
    const championLabel = new Label();
    championLabel.text = "Select Your Champion";
    championLabel.className = "section-title";
    
    const championButton = new Button();
    championButton.text = this.champion || "Pick Champion";
    championButton.className = "secondary-button";
    championButton.on('tap', () => this.selectChampion());

    championSection.addChild(championLabel);
    championSection.addChild(championButton);

    // Submit button
    const submitButton = new Button();
    submitButton.text = "Submit Picks";
    submitButton.className = "submit-button";
    submitButton.on('tap', () => this.submitPicks());

    // Add all components
    content.addChild(headerLayout);
    content.addChild(bonusInfo);
    content.addChild(selectedList);
    content.addChild(selectButton);
    content.addChild(championSection);
    content.addChild(submitButton);

    layout.content = content;
    this.content = layout;
  }

  createTeamTemplate() {
    return `
      <GridLayout columns="*, auto" class="team-item">
        <Label text="{{ name }}" col="0" class="team-name" />
        <Button text="❌" col="1" tap="removeTeam" class="remove-button" />
      </GridLayout>
    `;
  }

  async showTeamSelector() {
    // Show modal with available teams
    const teams = await this.getAvailableTeams();
    // ... show team selection modal
  }

  selectChampion() {
    if (this.selectedTeams.length === 0) {
      alert("Please select teams first");
      return;
    }
    // Show champion selection dialog from selected teams
  }

  async submitPicks() {
    if (this.selectedTeams.length !== 12) {
      alert("Please select exactly 12 teams");
      return;
    }

    if (!this.champion) {
      alert("Please select your champion");
      return;
    }

    try {
      // Calculate bonus points based on submission date
      const now = new Date();
      const daysUntilLock = (this.lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const bonusPoints = Math.floor(daysUntilLock * 10); // 10 points per day early

      const submission = {
        teams: this.selectedTeams.map(team => team.name),
        champion: this.champion,
        submissionDate: now.toISOString(),
        bonusPoints
      };

      // Submit picks to backend
      const response = await fetch(`${API_CONFIG.baseUrl}/api/playoff-challenge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (response.ok) {
        alert("Picks submitted successfully!");
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert("Error submitting picks. Please try again.");
    }
  }

  async getAvailableTeams() {
    // Return list of eligible teams
    return [
      "Alabama", "Georgia", "Michigan", "Ohio State", "Texas",
      "Florida State", "Oregon", "Washington", "LSU", "Penn State",
      "Ole Miss", "Missouri", "Louisville", "Oklahoma", "Notre Dame",
      "Oregon State", "Tennessee", "Utah", "Kansas State", "Clemson"
      // Add more teams as needed
    ];
  }
}