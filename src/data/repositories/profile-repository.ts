import type { Profile } from "../models/profile";
import { Database } from "../database";

export class ProfileRepository {
  constructor(private db: Database) {}

  async add(profile: Omit<Profile, "id">): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.put("profiles", { ...profile, id });
    return id;
  }

  async update(id: string, profile: Partial<Profile>): Promise<void> {
    const existing = await this.db.get<Profile>("profiles", id);
    await this.db.put("profiles", { ...existing, ...profile, id });
  }

  async get(id: string): Promise<Profile | undefined> {
    return this.db.get<Profile>("profiles", id);
  }

  async getByLinkedInUrl(url: string): Promise<Profile | undefined> {
    return this.db.getByIndex<Profile>("profiles", "linkedInUrl", url);
  }

  async getAll(): Promise<Profile[]> {
    return this.db.getAll<Profile>("profiles");
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("profiles", id);
  }
}
