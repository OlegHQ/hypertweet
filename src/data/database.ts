import { browserApi } from "../browser-api";

interface Profile {
  id: string;
  name: string;
  lastName: string;
  linkedInUrl: string;
  linkedInData?: {
    headline?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      field: string;
    }>;
    skills?: string[];
  };
}

interface Settings {
  openAiKey: string;
}

const DB_NAME = "hypertweet";
const DB_VERSION = 1;

export const STORES = {
  PROFILES: "profiles",
  SETTINGS: "settings",
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

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "id" });
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

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    key: string
  ): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Profile methods
  async addProfile(profile: Omit<Profile, "id">): Promise<string> {
    const id = crypto.randomUUID();
    await this.put(STORES.PROFILES, { ...profile, id });
    return id;
  }

  async updateProfile(id: string, profile: Partial<Profile>): Promise<void> {
    const existing = await this.get<Profile>(STORES.PROFILES, id);
    await this.put(STORES.PROFILES, { ...existing, ...profile, id });
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return this.get<Profile>(STORES.PROFILES, id);
  }

  async getProfileByLinkedInUrl(url: string): Promise<Profile | undefined> {
    return this.getByIndex(STORES.PROFILES, "linkedInUrl", url);
  }

  async getAllProfiles(): Promise<Profile[]> {
    return this.getAll<Profile>(STORES.PROFILES);
  }

  async deleteProfile(id: string): Promise<void> {
    await this.delete(STORES.PROFILES, id);
  }

  // Settings methods
  async setOpenAiKey(key: string): Promise<void> {
    await this.put(STORES.SETTINGS, { id: "openAiKey", openAiKey: key });
  }

  async getOpenAiKey(): Promise<string | undefined> {
    const settings = await this.get<Settings>(STORES.SETTINGS, "openAiKey");
    return settings?.openAiKey;
  }
}

export const db = new Database();
export type { Profile, Settings };
