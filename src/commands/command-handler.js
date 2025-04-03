import { EventEmitter } from 'events';

export class BotCommandHandler extends EventEmitter {
  constructor() {
    super();
    this.blockedTopics = new Set();
    this.monitoredAccounts = new Set();
    this.isActive = true;
    this.commandHistory = [];
    this.maxHistorySize = 100;
    this.startTime = new Date();
    this.lastCommandTime = null;
    this.tweetFrequency = 15; // tweets per hour
  }

  handleCommand(command) {
    try {
      const [action, ...args] = command.toLowerCase().split(' ');
      this.lastCommandTime = new Date();
      this.addToHistory(command);

      switch (action) {
        // Existing commands remain the same...
        case 'block':
        case 'unblock':
        case 'pause':
        case 'resume':
        case 'status':
        case 'list':
        case 'history':
        case 'clear':
        case 'help':
          return super.handleCommand(command);

        // New monitoring commands
        case 'monitor':
          if (!args.length) return 'Error: Account required for monitor command';
          this.monitoredAccounts.add(args[0]);
          return `Now monitoring: @${args[0]}`;

        case 'unmonitor':
          if (!args.length) return 'Error: Account required for unmonitor command';
          if (this.monitoredAccounts.delete(args[0])) {
            return `Stopped monitoring: @${args[0]}`;
          }
          return 'Account was not being monitored';

        case 'listmonitors':
          return this.getMonitoredAccounts();

        // Frequency control
        case 'setfrequency':
          if (!args.length || isNaN(args[0])) {
            return 'Error: Requires number of tweets per hour';
          }
          const frequency = parseInt(args[0]);
          if (frequency < 1 || frequency > 50) {
            return 'Error: Frequency must be between 1 and 50 tweets per hour';
          }
          this.tweetFrequency = frequency;
          return `Tweet frequency set to ${frequency} per hour`;

        // Topic focus
        case 'focus':
          if (!args.length) return 'Error: Topic required for focus command';
          this.emit('focusChange', args.join(' '));
          return `Focus set to: ${args.join(' ')}`;

        // Engagement controls
        case 'engagement':
          if (!args.length) return 'Error: Requires on/off';
          const setting = args[0].toLowerCase();
          if (setting !== 'on' && setting !== 'off') {
            return 'Error: Use "engagement on" or "engagement off"';
          }
          this.emit('engagementChange', setting === 'on');
          return `Engagement ${setting}`;

        // Stats and metrics
        case 'stats':
          return this.getStats();

        // Emergency commands
        case 'emergency':
          this.handleEmergency();
          return 'Emergency mode activated - all activities paused';

        // Reset command
        case 'reset':
          this.resetBot();
          return 'Bot reset to default settings';

        default:
          return 'Unknown command. Type "help" for available commands';
      }
    } catch (error) {
      console.error('Command handler error:', error);
      return 'Error processing command';
    }
  }

  getMonitoredAccounts() {
    if (this.monitoredAccounts.size === 0) {
      return 'No accounts currently monitored';
    }
    return Array.from(this.monitoredAccounts)
      .map((account, index) => `${index + 1}. @${account}`)
      .join('\n');
  }

  getStats() {
    return {
      ...this.getFormattedStatus(),
      tweetFrequency: `${this.tweetFrequency}/hour`,
      monitoredAccounts: this.monitoredAccounts.size,
      focusTopics: Array.from(this.blockedTopics),
      engagementStatus: this.isActive ? 'enabled' : 'disabled'
    };
  }

  handleEmergency() {
    this.isActive = false;
    this.emit('emergency');
    this.blockedTopics.clear();
    this.monitoredAccounts.clear();
  }

  resetBot() {
    this.blockedTopics.clear();
    this.monitoredAccounts.clear();
    this.isActive = true;
    this.tweetFrequency = 15;
    this.emit('reset');
  }

  getHelpText() {
    return `
Available Commands:
  Basic Controls:
    block <topic>     - Block tweets about a specific topic
    unblock <topic>   - Unblock a previously blocked topic
    pause             - Pause all bot activities
    resume            - Resume bot activities
    status           - Show current bot status
    list             - List all blocked topics
    history          - Show command history
    clear blocks     - Clear all blocked topics
    clear history    - Clear command history

  Monitoring:
    monitor <account>   - Add account to monitoring list
    unmonitor <account> - Remove account from monitoring
    listmonitors       - Show all monitored accounts
    
  Configuration:
    setfrequency <n>   - Set tweets per hour (1-50)
    focus <topic>      - Set primary topic focus
    engagement on|off  - Enable/disable engagement
    
  Analysis:
    stats             - Show detailed bot statistics
    
  Emergency:
    emergency         - Pause all activities immediately
    reset            - Reset bot to default settings
    
  Help:
    help             - Show this help message
    `.trim();
  }
}