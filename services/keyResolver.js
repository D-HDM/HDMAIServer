// ====================================================================================================
// HDM AI Server — Key Resolver
// Looks up AI provider keys from DB, caches in memory
// ====================================================================================================

const AiProviderKey = require('../models/AiProviderKey');

let cache = {};
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

const keyResolver = {
  async refresh() {
    try {
      const keys = await AiProviderKey.find({ isActive: true });
      cache = {};
      for (const k of keys) {
        cache[`${k.module}_${k.provider}`] = {
          key: k.getDecryptedKey(),
          model: k.model,
        };
      }
      lastFetch = Date.now();
      console.log(`KeyResolver: ${keys.length} keys loaded`);
    } catch (err) {
      console.warn('KeyResolver: refresh failed —', err.message);
    }
  },

  async resolve(module, provider) {
    if (Date.now() - lastFetch > CACHE_TTL) await this.refresh();
    const entry = cache[`${module}_${provider}`];
    if (!entry) return null;
    return { apiKey: entry.key, model: entry.model || null };
  },

  getCache() {
    return { keys: Object.keys(cache).length, lastFetch: new Date(lastFetch).toISOString() };
  },
};

module.exports = keyResolver;