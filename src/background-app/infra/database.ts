const DB_NAME = "hypertweet";
const DB_VERSION = 8;

export const STORES = {
  PROFILES: "profiles",
  SETTINGS: "settings",
  REPLY_TYPES: "replyTypes",
  SAVED_PROFILES: "savedProfiles",
  TWEETS: "tweets",
  TWITTER_PROFILES: "xProfiles",
} as const;

export class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create profiles store
        if (!db.objectStoreNames.contains(STORES.PROFILES)) {
          const profilesStore = db.createObjectStore(STORES.PROFILES, {
            keyPath: "id",
          });
          profilesStore.createIndex("linkedInUrl", "linkedInUrl", {
            unique: true,
          });
        }

        if (!db.objectStoreNames.contains(STORES.TWEETS)) {
          const tweetsStore = db.createObjectStore(STORES.TWEETS, {
            keyPath: "id",
          });
          tweetsStore.createIndex("username", "from");
        }

        if (!db.objectStoreNames.contains(STORES.TWITTER_PROFILES)) {
          db.createObjectStore(STORES.TWITTER_PROFILES, {
            keyPath: "username",
          });
        }

        // Create profiles store
        if (!db.objectStoreNames.contains(STORES.SAVED_PROFILES)) {
          db.createObjectStore(STORES.SAVED_PROFILES, {
            keyPath: "id",
          });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "id" });
        }

        // Create replyTypes store
        if (!db.objectStoreNames.contains(STORES.REPLY_TYPES)) {
          const replyTypesStore = db.createObjectStore(STORES.REPLY_TYPES, {
            keyPath: ["profileId", "id"],
          });
          replyTypesStore.createIndex("profileId", "profileId");
        }
      };
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(
    storeName: string,
    key: string | [string, string]
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    key: string
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    key: string
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);

      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(
    storeName: string,
    key: string | [string, string]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
