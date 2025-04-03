import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function scrapeFeedspotDomains() {
  try {
    console.log('🔍 Scraping football blog domains from Feedspot...');
    
    const response = await fetch('https://bloggers.feedspot.com/ncaa_football_blogs/');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const domains = new Set();

    // Extract blog URLs from the feed items
    $('.feed-item').each((i, element) => {
      try {
        const link = $(element).find('.tlink').attr('href');
        if (link) {
          // Extract domain from URL
          const url = new URL(link);
          const domain = url.hostname.replace('www.', '');
          domains.add(domain);
        }
      } catch (error) {
        // Skip invalid URLs
        console.warn('Invalid URL found:', error.message);
      }
    });

    // Convert to array and sort
    const sortedDomains = Array.from(domains).sort();

    console.log(`✅ Found ${sortedDomains.length} unique football blog domains`);
    return sortedDomains;
  } catch (error) {
    console.error('Error scraping Feedspot:', error);
    return [];
  }
}

// Helper function to validate domains
export function validateDomain(domain) {
  // Basic domain validation regex
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

// Helper function to filter and clean domains
export function cleanDomains(domains) {
  return domains.filter(domain => {
    // Remove any protocols
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www.
    domain = domain.replace(/^www\./, '');
    // Validate domain format
    return validateDomain(domain);
  });
}