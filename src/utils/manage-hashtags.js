import { BLOCKED_HASHTAGS } from '../config/blocked-hashtags.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../config/blocked-hashtags.js');

async function updateBlockedHashtags(hashtags) {
  const content = `export const BLOCKED_HASHTAGS = new Set(${JSON.stringify([...hashtags])});\n`;
  await fs.promises.writeFile(configPath, content);
}

async function blockHashtag(hashtag) {
  const cleanHashtag = hashtag.replace('#', '').toLowerCase();
  BLOCKED_HASHTAGS.add(cleanHashtag);
  await updateBlockedHashtags(BLOCKED_HASHTAGS);
  console.log(`Blocked hashtag: #${cleanHashtag}`);
}

async function unblockHashtag(hashtag) {
  const cleanHashtag = hashtag.replace('#', '').toLowerCase();
  BLOCKED_HASHTAGS.delete(cleanHashtag);
  await updateBlockedHashtags(BLOCKED_HASHTAGS);
  console.log(`Unblocked hashtag: #${cleanHashtag}`);
}

async function listBlockedHashtags() {
  console.log('\nCurrently blocked hashtags:');
  if (BLOCKED_HASHTAGS.size === 0) {
    console.log('No hashtags are currently blocked');
  } else {
    [...BLOCKED_HASHTAGS].forEach(tag => console.log(`#${tag}`));
  }
}

// Handle command line usage
const command = process.argv[2]?.toLowerCase();
const hashtag = process.argv[3];

async function main() {
  try {
    switch (command) {
      case 'block':
        if (!hashtag) {
          console.log('Usage: node manage-hashtags.js block <hashtag>');
          process.exit(1);
        }
        await blockHashtag(hashtag);
        break;
      
      case 'unblock':
        if (!hashtag) {
          console.log('Usage: node manage-hashtags.js unblock <hashtag>');
          process.exit(1);
        }
        await unblockHashtag(hashtag);
        break;
      
      case 'list':
        await listBlockedHashtags();
        break;
      
      default:
        console.log('Usage: node manage-hashtags.js [block|unblock|list] [hashtag]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1].endsWith('manage-hashtags.js')) {
  main();
}

export { blockHashtag, unblockHashtag, listBlockedHashtags };