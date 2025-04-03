import { processedTweets } from '../twitter/interactions.js';
import { processedItems } from '../platforms/reddit/bot.js';

export class CacheManager {
  constructor() {
    this.caches = new Map();
    this.maxCacheAge = 3600000; // 1 hour
    this.maxCacheSize = 1000;
  }

  clearCache(cacheName) {
    if (cacheName === 'tweets') {
      processedTweets.clear();
    } else if (cacheName === 'reddit') {
      processedItems.clear();
    } else if (this.caches.has(cacheName)) {
      this.caches.get(cacheName).clear();
    }
    console.log(`Cleared ${cacheName} cache`);
  }

  clearAllCaches() {
    processedTweets.clear();
    processedItems.clear();
    this.caches.forEach(cache => cache.clear());
    console.log('All caches cleared');
  }

  pruneCache(cacheName) {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > this.maxCacheAge) {
        cache.delete(key);
      }
    }
  }

  pruneAllCaches() {
    this.caches.forEach((_, name) => this.pruneCache(name));
    console.log('All caches pruned');
  }
}