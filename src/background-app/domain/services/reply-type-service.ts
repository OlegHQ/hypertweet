import { defaultReplyTypes } from "../../ai/default-reply-types";
import { ConfigTypeKey } from "../models/config-type-key";
import type { ReplyType } from "../models/reply-type";
import type { ConfigRepository } from "../repositories/config-repository";
import type { ReplyTypeRepository } from "../repositories/reply-type-repository";

export class ReplyTypeService {
  constructor(
    private readonly config: ConfigRepository,
    private readonly replyTypeRepository: ReplyTypeRepository
  ) {}

  async add(replyType: Omit<ReplyType, "id">) {
    return this.replyTypeRepository.add(replyType);
  }

  async update(profileId: string, id: string, replyType: Partial<ReplyType>) {
    return this.replyTypeRepository.update(profileId, id, replyType);
  }

  async delete(profileId: string, id: string) {
    return this.replyTypeRepository.delete(profileId, id);
  }

  async getAll(profileId: string) {
    const allItems =
      await this.replyTypeRepository.getAllByProfileId(profileId);
    const hiddenSystemReplies =
      (await this.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];

    return [...allItems, ...defaultReplyTypes(profileId)].map((x) => ({
      ...x,
      isHidden: hiddenSystemReplies?.includes(x.id),
    }));
  }

  async getReplyType(profileId: string, id: string) {
    let item =
      defaultReplyTypes(profileId).find((replyType) => replyType.id === id) ??
      null;
    if (!item) {
      item = await this.replyTypeRepository.get(profileId, id);
      if (!item) {
        return null;
      }
    }
    const hiddenReplyTypes =
      (await this.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];
    return hiddenReplyTypes?.includes(item.id)
      ? {
          ...item,
          isHidden: true,
        }
      : item;
  }

  async setOneHidden(profileId: string, id: string, option: boolean) {
    let replyTypes =
      (await this.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];

    if (option) {
      replyTypes.push(id);
    } else {
      replyTypes = replyTypes.filter((r) => r !== id);
    }

    replyTypes = Array.from(new Set(replyTypes));

    await this.config.set(
      profileId,
      ConfigTypeKey.HIDDEN_REPLY_TYPES,
      replyTypes
    );
  }
}
