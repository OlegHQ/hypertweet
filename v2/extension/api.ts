const BASE_URL = 'http://olegs-mac-mini:5001';
const TOKEN_KEY = 'hypertweet.token';
const REFRESH_KEY = 'hypertweet.refresh';
const EXPIRES_KEY = 'hypertweet.expires';

async function getValidToken(): Promise<string | null> {
	const stored = await chrome.storage.local.get([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
	const accessToken = (stored[TOKEN_KEY] as string) || null;
	const refreshToken = (stored[REFRESH_KEY] as string) || null;
	const expiresAt = (stored[EXPIRES_KEY] as number) || null;

	if (!accessToken || !refreshToken || !expiresAt) return null;
	// Refresh 60s before expiry
	if (Date.now() < expiresAt - 60000) return accessToken;

	const res = await fetch(BASE_URL + '/auth/refresh', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ RefreshToken: refreshToken }),
	});
	if (!res.ok) {
		await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY]);
		return null;
	}
	const data = (await res.json()) as { AccessToken: string; RefreshToken: string; ExpiresIn: number };
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
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (auth) {
			const token = await getValidToken();
			if (token) headers['Authorization'] = `Bearer ${token}`;
		}

		const res = await fetch(BASE_URL + path, {
			method,
			headers,
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		const json = (await res.json()) as Res & { error?: string; field?: string };
		if (!res.ok) throw new ApiError(json.error ?? 'Request failed', res.status, json.field);
		return json;
	};
}

// Auth (public)
interface AuthReq { Email: string; Password: string }
interface TokenRes { AccessToken: string; RefreshToken: string; ExpiresIn: number }

export const login = make<AuthReq, TokenRes>('POST', '/auth/login');
export const register = make<AuthReq, { message: string }>('POST', '/auth/register');

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
interface Tone { Id: string; Title: string; Instruction: string; IsDefault: boolean }
interface ToneReq { Title: string; Instruction: string }

export const listTones = make<undefined, Tone[]>('GET', '/tones', true);
export const createTone = make<ToneReq, { id: string }>('POST', '/tones', true);
export const updateTone = (id: string) => make<ToneReq, { message: string }>('PUT', `/tones/${id}`, true);
export const deleteTone = (id: string) => make<undefined, { message: string }>('DELETE', `/tones/${id}`, true);
export const toggleTone = (id: string, enable: boolean) =>
	make<undefined, { message: string }>('POST', `/tones/${id}/toggle${enable ? '?enable' : ''}`, true);

