import { Database, STORES } from "../database";

export class ConfigRepository {
  constructor(private db: Database) {}

  async get<T>(profileId: string | null, key: string): Promise<T | null> {
    const result = await this.db.get<T>(
      STORES.SETTINGS,
      this.makeKey(profileId, key)
    );
    if (!result) {
      return null;
    }
    return (result as unknown as { value: T }).value;
  }

  async set<T>(profileId: string | null, key: string, value: T): Promise<void> {
    await this.db.put(STORES.SETTINGS, {
      id: this.makeKey(profileId, key),
      value,
    });
  }

  async delete(profileId: string | null, key: string): Promise<void> {
    await this.db.delete(STORES.SETTINGS, this.makeKey(profileId, key));
  }

  private makeKey(profileId: string | null, key: string): string {
    if (!profileId) {
      return key;
    }
    return `${profileId}:${key}`;
  }
}
