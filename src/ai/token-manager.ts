import OpenAI from "openai";

interface CachedClient {
  client: OpenAI;
  lastUsed: number;
}

class TokenManager {
  private static instance: TokenManager;
  private clients: Map<string, CachedClient> = new Map();
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private hashApiKey(apiKey: string): string {
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private cleanupExpiredClients() {
    const now = Date.now();
    for (const [hash, client] of this.clients.entries()) {
      if (now - client.lastUsed > this.CACHE_EXPIRY) {
        this.clients.delete(hash);
      }
    }
  }

  getClient(apiKey: string): OpenAI {
    this.cleanupExpiredClients();

    const hash = this.hashApiKey(apiKey);
    const cached = this.clients.get(hash);

    if (cached) {
      cached.lastUsed = Date.now();
      return cached.client;
    }

    const client = new OpenAI({
      apiKey: apiKey,
    });

    this.clients.set(hash, {
      client,
      lastUsed: Date.now(),
    });

    return client;
  }
}

export const tokenManager = TokenManager.getInstance();
