import readline from 'readline';
import { BotCommandHandler } from './command-handler.js';

export function initializeShellCommands() {
  const commandHandler = new BotCommandHandler();
  
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'bot> '
    });

    rl.prompt();

    rl.on('line', (line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const response = commandHandler.handleCommand(trimmedLine);
        console.log(response);
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Command interface closed');
      // Don't exit process here
    });
  }

  return commandHandler;
}