export interface Settings {
  id: string;
  profileId: string;
  openAiKey?: string;
  [key: string]: any; // Allow for other settings
} 