import type { Settings } from '../models/settings';
import { Database } from '../database';

export class SettingsRepository {
  constructor(private db: Database) {}

  async setOpenAiKey(key: string): Promise<void> {
    await this.db.put('settings', { id: 'openAiKey', openAiKey: key });
  }

  async getOpenAiKey(): Promise<string | undefined> {
    const settings = await this.db.get<Settings>('settings', 'openAiKey');
    return settings?.openAiKey;
  }
} 