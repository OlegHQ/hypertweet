export interface ReplyType {
  id: string;
  name: string;
  prompt: string;
  createdAt: Date;
  profileId: string;
  updatedAt: Date;
  isSystem: boolean;
  isHidden?: boolean;
}
