export class SharedCache<K extends string, V> {
  constructor(private readonly prefix: string) {}

  async get(key: K): Promise<V | undefined> {
    try {
      const storageKey = `${this.prefix}:${key}`;
      const result = await chrome.storage.session.get(storageKey);
      return result[storageKey];
    } catch (error) {
      console.warn(`SharedCache.get failed for ${key}:`, error);
      return undefined;
    }
  }

  async set(key: K, value: V): Promise<void> {
    try {
      const storageKey = `${this.prefix}:${key}`;
      await chrome.storage.session.set({ [storageKey]: value });
    } catch (error) {
      console.warn(`SharedCache.set failed for ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const result = await chrome.storage.session.get();
      const keysToRemove = Object.keys(result).filter((key) =>
        key.startsWith(`${this.prefix}:`),
      );
      if (keysToRemove.length > 0) {
        await chrome.storage.session.remove(keysToRemove);
      }
    } catch (error) {
      console.warn('SharedCache.clear failed:', error);
    }
  }
}
