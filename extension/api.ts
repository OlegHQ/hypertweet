import type { Page } from './models';

const PROD_URL = 'https://hypertweet.microapps.space';
const BETA_URL = 'https://hypertweet-beta.microapps.space';
const TOKEN_KEY = 'hypertweet.token';
const REFRESH_KEY = 'hypertweet.refresh';
const EXPIRES_KEY = 'hypertweet.expires';
const BETA_KEY = 'hypertweet.beta';

async function getBaseUrl(): Promise<string> {
  const stored = await chrome.storage.local.get([BETA_KEY]);
  const useBeta = (stored[BETA_KEY] as boolean) || false;
  return useBeta ? BETA_URL : PROD_URL;
}

export async function getBetaMode(): Promise<boolean> {
  const stored = await chrome.storage.local.get([BETA_KEY]);
  return (stored[BETA_KEY] as boolean) || false;
}

export async function setBetaMode(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [BETA_KEY]: enabled });
}

async function getValidToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get([
    TOKEN_KEY,
    REFRESH_KEY,
    EXPIRES_KEY,
  ]);
  const accessToken = (stored[TOKEN_KEY] as string) || null;
  const refreshToken = (stored[REFRESH_KEY] as string) || null;
  const expiresAt = (stored[EXPIRES_KEY] as number) || null;

  if (!accessToken || !refreshToken || !expiresAt) return null;
  // Refresh 60s before expiry
  if (Date.now() < expiresAt - 60000) return accessToken;

  const baseUrl = await getBaseUrl();
  const res = await fetch(baseUrl + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ RefreshToken: refreshToken }),
  });
  if (!res.ok) {
    await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
    return null;
  }
  const data = (await res.json()) as {
    AccessToken: string;
    RefreshToken: string;
    ExpiresIn: number;
  };
  await chrome.storage.local.set({
    [TOKEN_KEY]: data.AccessToken,
    [REFRESH_KEY]: data.RefreshToken,
    [EXPIRES_KEY]: Date.now() + data.ExpiresIn * 1000,
  });
  return data.AccessToken;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string
  ) {
    super(message);
  }
}

function make<Req, Res>(method: string, path: string, auth = false) {
  return async (body?: Req): Promise<Res> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      const token = await getValidToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = await getBaseUrl();
    const res = await fetch(baseUrl + path, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const json = (await res.json()) as Res & { error?: string; field?: string };
    if (!res.ok)
      throw new ApiError(
        json.error ?? 'Request failed',
        res.status,
        json.field
      );
    return json;
  };
}

// Auth (public)
export interface AuthReq {
  Email: string;
  Password: string;
}
export interface TokenRes {
  AccessToken: string;
  RefreshToken: string;
  ExpiresIn: number;
}

export const login = make<AuthReq, TokenRes>('POST', '/auth/login');
export const register = make<AuthReq, { message: string }>(
  'POST',
  '/auth/register'
);

export async function saveTokens(res: TokenRes): Promise<void> {
  await chrome.storage.local.set({
    [TOKEN_KEY]: res.AccessToken,
    [REFRESH_KEY]: res.RefreshToken,
    [EXPIRES_KEY]: Date.now() + res.ExpiresIn * 1000,
  });
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
}

// Tones (protected)
export interface Tone {
  Id: string;
  Title: string;
  Instruction: string;
  IsDefault: boolean;
  Enabled?: boolean;
}
interface ToneReq {
  Title: string;
  Instruction: string;
}

export const listTones = make<undefined, Tone[]>('GET', '/tones', true);
export const createTone = make<ToneReq, { id: string }>('POST', '/tones', true);
export async function updateTone(
  id: string,
  data: ToneReq
): Promise<{ message: string }> {
  return make<ToneReq, { message: string }>('PUT', `/tones/${id}`, true)(data);
}

export async function deleteTone(id: string): Promise<{ message: string }> {
  return make<undefined, { message: string }>('DELETE', `/tones/${id}`, true)();
}

export async function toggleTone(
  id: string,
  enable: boolean
): Promise<{ message: string }> {
  return make<undefined, { message: string }>(
    'POST',
    `/tones/${id}/toggle?enable=${enable}`,
    true
  )();
}

// Profile (protected)
interface UpdateProfileReq {
  UserBio?: string;
  CustomReplyGuidance?: string;
  PostProcessReply?: boolean;
  ReplyPromptOptions?: string[];
  ModelName?: string;
  ChatBotPersona?: string;
}
interface UpdatePasswordReq {
  NewPassword: string;
}
export interface ProfileRes {
  Id: string;
  ModelName: string;
  UserBio?: string;
  CustomReplyGuidance?: string;
  PostProcessReply?: boolean;
  ReplyPromptOptions?: string[];
  ChatBotPersona?: string;
}
export interface ModelDef {
  ModelName: string;
}
export interface AvailableModelsRes {
  DefaultModel: string;
  AllModels: ModelDef[];
}

export const getProfile = make<undefined, ProfileRes>('GET', '/profile', true);
export const updateProfile = make<UpdateProfileReq, { Message: string }>(
  'POST',
  '/profile/update',
  true
);
export const updatePassword = make<UpdatePasswordReq, { Message: string }>(
  'POST',
  '/profile/password',
  true
);
export const deleteAccount = make<undefined, { Message: string }>(
  'DELETE',
  '/users',
  true
);
export const getAvailableModels = make<undefined, AvailableModelsRes>(
  'GET',
  '/profile/available-models',
  true
);

// AI Reply (protected)
export interface ReplyRequest {
  ToneId: string;
  Page: Page;
}
export interface ReplyResult {
  Reply: string;
}

export const generateReply = make<ReplyRequest, ReplyResult>(
  'POST',
  '/ai/reply',
  true
);

// AI Refine (protected)
export interface RefineRequest {
  Platform: string;
  OriginalPost: string;
  DraftReply: string;
  RefineInstruction: string;
}

export const refineReply = make<RefineRequest, ReplyResult>(
  'POST',
  '/ai/refine',
  true
);

// Chat types
export interface ChatMessageReq {
  Role: 'user' | 'assistant';
  Content: string;
}

export interface ChatRequest {
  Messages: ChatMessageReq[];
  PageContext: Page;
}

export interface ChatStreamEvent {
  chatId?: string;
  token?: string;
}

// SSE streaming chat - called from background script
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  const token = await getValidToken();
  if (!token) throw new ApiError('Not authenticated', 401);

  const baseUrl = await getBaseUrl();
  const response = await fetch(baseUrl + '/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const json = (await response.json()) as { error?: string };
    throw new ApiError(json.error ?? 'Chat failed', response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new ApiError('No response body', 500);

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data !== '[DONE]') {
          try {
            onEvent(JSON.parse(data) as ChatStreamEvent);
          } catch {
            // skip malformed events
          }
        }
      }
    }
  }
}
