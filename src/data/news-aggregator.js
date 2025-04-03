import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { sleep } from '../utils.js';
import { EventEmitter } from 'events';

// Rate limiting configuration
const RATE_LIMITS = {
  SITE_CHECK_INTERVAL: 300000,    // 5 minutes between site checks
  RSS_CHECK_INTERVAL: 900000,     // 15 minutes between RSS checks
  BATCH_SIZE: 5,                  // Check 5 sites at a time
  BATCH_DELAY: 10000,            // 10 second delay between batches
  MIN_SITE_DELAY: 2000,          // 2 second minimum delay between individual sites
  ERROR_RETRY_DELAY: 60000       // 1 minute delay on error
};

// Updated RSS feeds list with only working feeds
const RSS_FEEDS = [
  'https://www.espn.com/espn/rss/ncf/news',
  'https://www.espn.com/espn/rss/nfl/news',
  'https://www.cbssports.com/rss/headlines/college-football',
  'https://www.cbssports.com/rss/headlines/nfl',
  'https://api.foxsports.com/v1/rss?tag=college-football',
  'https://api.foxsports.com/v1/rss?tag=nfl',
  'https://profootballtalk.nbcsports.com/feed/',
  'https://www.profootballfocus.com/feed'
];

const SITES_TO_MONITOR = [
  // Major Sports Networks
  {
    url: 'https://www.espn.com/college-football',
    selector: '.contentItem__content',
    name: 'ESPN College Football'
  },
  {
    url: 'https://www.espn.com/nfl',
    selector: '.contentItem__content',
    name: 'ESPN NFL'
  },
  {
    url: 'https://www.cbssports.com/college-football',
    selector: '.article-list-pack-item',
    name: 'CBS Sports College Football'
  },
  {
    url: 'https://www.cbssports.com/nfl',
    selector: '.article-list-pack-item',
    name: 'CBS Sports NFL'
  },
  {
    url: 'https://www.foxsports.com/college-football',
    selector: '.article-card',
    name: 'FOX Sports College Football'
  },
  {
    url: 'https://www.foxsports.com/nfl',
    selector: '.article-card',
    name: 'FOX Sports NFL'
  }
];

export class NewsAggregator extends EventEmitter {
  constructor() {
    super();
    this.parser = new Parser();
    this.cache = new Map();
    this.lastCheck = new Map();
    this.updateCallback = null;
    this.isRunning = false;
  }

  onUpdate(callback) {
    this.updateCallback = callback;
  }

  async startMonitoring() {
    console.log('Starting football news aggregation...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const updates = await this.gatherAllUpdates();
        
        if (updates.news.length > 0 || updates.scores.length > 0) {
          if (this.updateCallback) {
            this.updateCallback(updates);
          }
          this.emit('updates', updates);
        }

        await sleep(RATE_LIMITS.SITE_CHECK_INTERVAL);
      } catch (error) {
        console.error('Error in news monitoring:', error);
        await sleep(RATE_LIMITS.ERROR_RETRY_DELAY);
      }
    }
  }

  async gatherAllUpdates() {
    const [rssUpdates, scrapedUpdates] = await Promise.all([
      this.checkRSSFeeds(),
      this.scrapeWebsites()
    ]);

    return {
      news: [...rssUpdates, ...scrapedUpdates],
      scores: await this.getScoreUpdates()
    };
  }

  async checkRSSFeeds() {
    const updates = [];

    // Process RSS feeds in batches
    for (let i = 0; i < RSS_FEEDS.length; i += RATE_LIMITS.BATCH_SIZE) {
      const batch = RSS_FEEDS.slice(i, i + RATE_LIMITS.BATCH_SIZE);
      
      for (const feed of batch) {
        try {
          const lastCheck = this.lastCheck.get(feed) || 0;
          
          // Skip if checked recently
          if (Date.now() - lastCheck < RATE_LIMITS.RSS_CHECK_INTERVAL) continue;

          const feedContent = await this.parser.parseURL(feed);
          this.lastCheck.set(feed, Date.now());

          for (const item of feedContent.items) {
            const itemDate = new Date(item.pubDate || item.isoDate);
            
            // Only include items from last hour
            if (Date.now() - itemDate.getTime() > 3600000) continue;

            // Skip if already cached
            if (this.cache.has(item.link)) continue;

            updates.push({
              title: item.title,
              link: item.link,
              date: itemDate,
              source: feedContent.title || 'RSS Feed'
            });

            this.cache.set(item.link, item);
          }

          // Respect rate limits
          await sleep(RATE_LIMITS.MIN_SITE_DELAY);
        } catch (error) {
          console.error(`Error fetching RSS feed ${feed}:`, error);
        }
      }

      // Delay between batches
      if (i + RATE_LIMITS.BATCH_SIZE < RSS_FEEDS.length) {
        await sleep(RATE_LIMITS.BATCH_DELAY);
      }
    }

    return updates;
  }

  async scrapeWebsites() {
    const updates = [];

    // Process sites in batches
    for (let i = 0; i < SITES_TO_MONITOR.length; i += RATE_LIMITS.BATCH_SIZE) {
      const batch = SITES_TO_MONITOR.slice(i, i + RATE_LIMITS.BATCH_SIZE);
      
      for (const site of batch) {
        try {
          const lastCheck = this.lastCheck.get(site.url) || 0;
          
          // Skip if checked recently
          if (Date.now() - lastCheck < RATE_LIMITS.SITE_CHECK_INTERVAL) continue;

          const response = await fetch(site.url);
          const html = await response.text();
          const $ = cheerio.load(html);
          this.lastCheck.set(site.url, Date.now());

          $(site.selector).each((i, element) => {
            const $element = $(element);
            const link = $element.find('a').attr('href');
            const title = $element.find('a').text().trim();

            if (link && title && !this.cache.has(link)) {
              updates.push({
                title,
                link: this.normalizeUrl(link, site.url),
                date: new Date(),
                source: site.name
              });

              this.cache.set(link, { title, link });
            }
          });

          // Respect rate limits
          await sleep(RATE_LIMITS.MIN_SITE_DELAY);
        } catch (error) {
          console.error(`Error scraping ${site.name}:`, error);
        }
      }

      // Delay between batches
      if (i + RATE_LIMITS.BATCH_SIZE < SITES_TO_MONITOR.length) {
        await sleep(RATE_LIMITS.BATCH_DELAY);
      }
    }

    return updates;
  }

  async getScoreUpdates() {
    // This would integrate with a sports data API
    // For now, return empty array
    return [];
  }

  normalizeUrl(url, baseUrl) {
    try {
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return base.origin + url;
      }
      return new URL(url, baseUrl).href;
    } catch (error) {
      console.error('Error normalizing URL:', error);
      return url;
    }
  }

  stop() {
    this.isRunning = false;
  }
}