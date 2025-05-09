import type { ReplyType } from "../database";
import { Database } from "../database";

export class ReplyTypeRepository {
  constructor(private db: Database) {}

  async add(replyType: Omit<ReplyType, "id">): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.put("replyTypes", { ...replyType, id });
    return id;
  }

  async update(
    profileId: string,
    id: string,
    replyType: Partial<ReplyType>
  ): Promise<void> {
    const existing = await this.get(profileId, id);
    if (!existing) {
      throw new Error("Reply type not found");
    }
    await this.db.put("replyTypes", {
      ...existing,
      ...replyType,
      id,
      profileId,
    });
  }

  async get(profileId: string, id: string): Promise<ReplyType | null> {
    return this.db.get<ReplyType>("replyTypes", [profileId, id]);
  }

  async getAllByProfileId(profileId: string): Promise<ReplyType[]> {
    return this.db.getAllByIndex<ReplyType>(
      "replyTypes",
      "profileId",
      profileId
    );
  }

  async delete(profileId: string, id: string): Promise<void> {
    await this.db.delete("replyTypes", [profileId, id]);
  }
}
