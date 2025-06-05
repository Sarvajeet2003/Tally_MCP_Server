import NodeCache from 'node-cache';

export class CacheManager {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 3600) {
    this.cache = new NodeCache({ 
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false 
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}
