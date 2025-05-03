import { Database, STORES } from "../database";

export class ConfigRepository {
  constructor(private db: Database) {}

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.db.get<T>(STORES.SETTINGS, key);
    return (result as { value: T }).value;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.db.put(STORES.SETTINGS, { id: key, value });
  }

  async delete(key: string): Promise<void> {
    await this.db.delete(STORES.SETTINGS, key);
  }
}
