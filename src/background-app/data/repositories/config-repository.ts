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

  async getCredential(
    profileId: string | null,
    key: string
  ): Promise<string | null> {
    const encoded = await this.get<string>(profileId, key);
    if (!encoded) {
      return null;
    }
    try {
      return atob(encoded);
    } catch (error) {
      console.error("Failed to decode credential:", error);
      return null;
    }
  }

  async setCredential(
    profileId: string | null,
    key: string,
    value: string
  ): Promise<void> {
    try {
      const encoded = btoa(value);
      await this.set(profileId, key, encoded);
    } catch (error) {
      console.error("Failed to encode credential:", error);
      throw new Error("Failed to encode credential");
    }
  }

  private makeKey(profileId: string | null, key: string): string {
    if (!profileId) {
      return key;
    }
    return `${profileId}:${key}`;
  }
}
