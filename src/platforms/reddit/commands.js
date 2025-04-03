import { generateResponse } from '../../config/personality.js';
import { COMMANDS, COMMAND_HELP } from './config.js';

export async function handleCommand(command, args, openai) {
  const cmd = command.toLowerCase();

  switch (cmd) {
    case COMMANDS.HELP:
      return generateHelpMessage();

    case COMMANDS.ANALYZE:
      if (!args.length) return 'Please specify what to analyze (e.g., !analyze Alabama)';
      return generateResponse(openai, `Analyze ${args.join(' ')}`);

    case COMMANDS.PREDICT:
      if (!args.length) return 'Please specify the matchup (e.g., !predict Michigan vs Ohio State)';
      return generateResponse(openai, `Predict ${args.join(' ')}`);

    case COMMANDS.STATS:
      if (!args.length) return 'Please specify team/player for stats (e.g., !stats Georgia)';
      return generateResponse(openai, `Stats for ${args.join(' ')}`);

    case COMMANDS.COMPARE:
      if (args.length < 3) return 'Please specify two teams/players to compare (e.g., !compare LSU vs Alabama)';
      return generateResponse(openai, `Compare ${args.join(' ')}`);

    case COMMANDS.RANKINGS:
      return generateResponse(openai, 'Current college football rankings');

    default:
      return null;
  }
}

function generateHelpMessage() {
  let help = 'Available Commands:\n\n';
  for (const [command, description] of Object.entries(COMMAND_HELP)) {
    help += `${command} - ${description}\n`;
  }
  return help;
}