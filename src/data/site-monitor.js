import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { scrapeFeedspotDomains, cleanDomains } from '../utils/feedspot-scraper.js';

let sites = {
  // College Football Sites
  espn: {
    url: 'https://www.espn.com/college-football',
    selector: '#main-container',
    lastContent: ''
  },
  twofortyseven: {
    url: 'https://247sports.com',
    selector: '.main-content',
    lastContent: ''
  },
  saturdaydownsouth: {
    url: 'https://www.saturdaydownsouth.com',
    selector: '.article-content',
    lastContent: ''
  },
  elevenwarriors: {
    url: 'https://www.elevenwarriors.com',
    selector: '.article-content',
    lastContent: ''
  },
  
  // NFL Sites
  nfl: {
    url: 'https://www.nfl.com/news',
    selector: '.d3-l-grid--outer',
    lastContent: ''
  },
  espnNfl: {
    url: 'https://www.espn.com/nfl',
    selector: '#main-container',
    lastContent: ''
  },
  profootballnetwork: {
    url: 'https://www.profootballnetwork.com',
    selector: '.main-content',
    lastContent: ''
  },
  pfref: {
    url: 'https://www.pro-football-reference.com',
    selector: '#content',
    lastContent: ''
  },
  
  // Editorial and Fan Sites
  sbnationNfl: {
    url: 'https://www.sbnation.com/nfl-news',
    selector: '.c-entry-content',
    lastContent: ''
  },
  steelersdepot: {
    url: 'https://steelersdepot.com',
    selector: '.entry-content',
    lastContent: ''
  },
  prideofdetroit: {
    url: 'https://www.prideofdetroit.com',
    selector: '.c-entry-content',
    lastContent: ''
  }
};

// Function to update monitored sites
export async function updateMonitoredSites() {
  try {
    console.log('Updating monitored sites list...');
    
    // Get domains from Feedspot
    const newDomains = await scrapeFeedspotDomains();
    const validDomains = cleanDomains(newDomains);
    
    // Add new domains to monitoring list
    validDomains.forEach(domain => {
      if (!sites[domain]) {
        sites[domain] = {
          url: `https://${domain}`,
          selector: '.article-content, .entry-content, .post-content, .main-content',
          lastContent: ''
        };
      }
    });
    
    console.log(`Now monitoring ${Object.keys(sites).length} sites`);
    return Object.keys(sites);
  } catch (error) {
    console.error('Error updating monitored sites:', error);
    return Object.keys(sites);
  }
}

async function fetchSite(url) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    const html = await response.text();
    console.log(`Successfully fetched ${url}`);
    return html;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

export async function monitorSites() {
  const updates = [];
  console.log('Starting site monitoring...');

  for (const [site, config] of Object.entries(sites)) {
    console.log(`Checking ${site}...`);
    const html = await fetchSite(config.url);
    if (!html) {
      console.log(`Skipping ${site} due to fetch error`);
      continue;
    }

    try {
      const $ = cheerio.load(html);
      const content = $(config.selector).text().replace(/\s+/g, ' ').trim();
      
      if (!content) {
        console.log(`No content found for ${site} using selector: ${config.selector}`);
        continue;
      }

      if (content !== config.lastContent) {
        console.log(`Found new content on ${site}`);
        updates.push({
          site,
          hasChanged: true,
          newContent: content,
          oldContent: config.lastContent
        });
        config.lastContent = content;
      } else {
        console.log(`No changes detected on ${site}`);
      }
    } catch (error) {
      console.error(`Error processing ${site}:`, error);
    }
    
    // Add a small delay between site checks to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`Found ${updates.length} updates across all sites`);
  return updates;
}