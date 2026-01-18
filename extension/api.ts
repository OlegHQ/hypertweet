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
    body: JSON.stringify({ refreshToken: refreshToken }),
  });
  if (!res.ok) {
    await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
    return null;
  }
  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  await chrome.storage.local.set({
    [TOKEN_KEY]: data.accessToken,
    [REFRESH_KEY]: data.refreshToken,
    [EXPIRES_KEY]: Date.now() + data.expiresIn * 1000,
  });
  return data.accessToken;
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
  email: string;
  password: string;
}
export interface TokenRes {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const login = make<AuthReq, TokenRes>('POST', '/auth/login');
export const register = make<AuthReq, { message: string }>(
  'POST',
  '/auth/register'
);

export async function saveTokens(res: TokenRes): Promise<void> {
  console.log('[API] saveTokens called with:', res);
  console.log('[API] Saving token:', res.accessToken?.substring(0, 20) + '...');
  await chrome.storage.local.set({
    [TOKEN_KEY]: res.accessToken,
    [REFRESH_KEY]: res.refreshToken,
    [EXPIRES_KEY]: Date.now() + res.expiresIn * 1000,
  });
  console.log('[API] Tokens saved to storage');
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
}

// Tones (protected)
export interface Tone {
  id: string;
  title: string;
  instruction: string;
  isDefault: boolean;
  enabled?: boolean;
}
interface ToneReq {
  title: string;
  instruction: string;
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
  userBio?: string;
  customReplyGuidance?: string;
  postProcessReply?: boolean;
  replyPromptOptions?: string[];
  modelName?: string;
  chatModel?: string;
  chatBotPersona?: string;
}
interface UpdatePasswordReq {
  newPassword: string;
}
export interface ProfileRes {
  id: string;
  modelName: string;
  chatModel?: string;
  userBio?: string;
  customReplyGuidance?: string;
  postProcessReply?: boolean;
  replyPromptOptions?: string[];
  chatBotPersona?: string;
}
export interface ModelDef {
  modelName: string;
}
export interface AvailableModelsRes {
  defaultModel: string;
  allModels: ModelDef[];
}

export const getProfile = make<undefined, ProfileRes>('GET', '/profile', true);
export const updateProfile = make<UpdateProfileReq, { message: string }>(
  'POST',
  '/profile/update',
  true
);
export const updatePassword = make<UpdatePasswordReq, { message: string }>(
  'POST',
  '/profile/password',
  true
);
export const deleteAccount = make<undefined, { message: string }>(
  'DELETE',
  '/users',
  true
);
export const getAvailableModels = make<undefined, AvailableModelsRes>(
  'GET',
  '/profile/available-models',
  true
);

// API Tokens (protected)
export interface ApiToken {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface CreateApiTokenReq {
  name: string;
}

export interface CreateApiTokenRes {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface ListApiTokensRes {
  tokens: ApiToken[];
}

export const listApiTokens = make<undefined, ListApiTokensRes>(
  'GET',
  '/api-tokens',
  true
);

export const createApiToken = make<CreateApiTokenReq, CreateApiTokenRes>(
  'POST',
  '/api-tokens',
  true
);

export async function revokeApiToken(id: string): Promise<{ message: string }> {
  return make<undefined, { message: string }>(
    'POST',
    `/api-tokens/${id}/revoke`,
    true
  )();
}

// AI Reply (protected)
export interface ReplyRequest {
  toneId: string;
  page: Page;
}
export interface ReplyResult {
  reply: string;
}

export const generateReply = make<ReplyRequest, ReplyResult>(
  'POST',
  '/ai/reply',
  true
);

// AI Refine (protected)
export interface RefineRequest {
  platform: string;
  originalPost: string;
  draftReply: string;
  refineInstruction: string;
}

export const refineReply = make<RefineRequest, ReplyResult>(
  'POST',
  '/ai/refine',
  true
);

// Chat types
export interface ChatMessageReq {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessageReq[];
  pageContext: Page;
}

export interface ChatStreamEvent {
  chatId?: string;
  token?: string;
}

// SSE streaming chat - called from background script
export interface InboxSaveResponse {
  id: string;
  status: 'unreplied' | 'finished';
  key: string;
}

export interface InboxItemSummary {
  id: string;
  key: string;
  status: 'unreplied' | 'finished';
  site: string;
  url: string;
  textPreview: string;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboxListResponse {
  items: InboxItemSummary[];
}

export interface InboxReplyVariant {
  id: string;
  text: string;
  source: 'manual' | 'generated';
  createdAt: string;
}

export interface InboxItem {
  id: string;
  userId: string;
  key: string;
  status: 'unreplied' | 'finished';
  page: Page;
  replyVariants: InboxReplyVariant[];
  createdAt: string;
  updatedAt: string;
}

export const inboxSave = make<{ page: Page }, InboxSaveResponse>(
  'POST',
  '/inbox/save',
  true
);

export async function inboxListWithStatus(
  status: 'unreplied' | 'finished'
): Promise<InboxListResponse> {
  return make<undefined, InboxListResponse>(
    'GET',
    `/inbox/items?status=${status}`,
    true
  )();
}

export async function inboxGet(id: string): Promise<InboxItem> {
  return make<undefined, InboxItem>('GET', `/inbox/items/${id}`, true)();
}

export async function inboxAddVariants(
  id: string,
  variants: string[]
): Promise<InboxItem> {
  return make<{ variants: { text: string }[] }, InboxItem>(
    'POST',
    `/inbox/items/${id}/variants`,
    true
  )({ variants: variants.map(t => ({ text: t })) });
}

export async function inboxMarkDone(id: string): Promise<InboxItem> {
  return make<undefined, InboxItem>(
    'POST',
    `/inbox/items/${id}/mark-done`,
    true
  )();
}

export async function inboxGenerateVariants(id: string): Promise<{
  variants: { text: string }[];
}> {
  return make<{ count: number }, { variants: { text: string }[] }>(
    'POST',
    `/inbox/items/${id}/generate-variants`,
    true
  )({ count: 3 });
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
