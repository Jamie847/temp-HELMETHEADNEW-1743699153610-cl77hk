import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

let lastContent = '';

export async function monitorCFPWebsite() {
  try {
    const response = await fetch('https://collegefootballplayoff.com/');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract main content, removing whitespace and scripts
    const content = $('main').text().replace(/\s+/g, ' ').trim();
    
    // Check if content has changed
    if (content !== lastContent) {
      const changes = {
        hasChanged: true,
        newContent: content,
        oldContent: lastContent
      };
      lastContent = content;
      return changes;
    }
    
    return { hasChanged: false };
  } catch (error) {
    console.error('Error monitoring CFP website:', error);
    return { hasChanged: false, error };
  }
}