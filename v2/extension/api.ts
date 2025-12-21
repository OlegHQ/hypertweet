const BASE_URL = 'http://olegs-macbook-air:5001';
const TOKEN_KEY = 'hypertweet.token';

let token: string | null = null;

void chrome.storage.local.get(TOKEN_KEY).then(r => {
	token = (r[TOKEN_KEY] as string) || null;
});
chrome.storage.local.onChanged.addListener(c => {
	if (TOKEN_KEY in c) token = (c[TOKEN_KEY]?.newValue as string) || null;
});

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
		if (auth && token) headers['Authorization'] = `Bearer ${token}`;

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
export const refresh = make<{ RefreshToken: string }, { token: string }>('POST', '/auth/refresh');

// Tones (protected)
interface Tone { id: string; title: string; instruction: string; isDefault: boolean }
interface ToneReq { Title: string; Instruction: string }

export const listTones = make<undefined, Tone[]>('GET', '/tones', true);
export const createTone = make<ToneReq, { id: string }>('POST', '/tones', true);
export const updateTone = (id: string) => make<ToneReq, { message: string }>('PUT', `/tones/${id}`, true);
export const deleteTone = (id: string) => make<undefined, { message: string }>('DELETE', `/tones/${id}`, true);
export const toggleTone = (id: string, enable: boolean) =>
	make<undefined, { message: string }>('POST', `/tones/${id}/toggle${enable ? '?enable' : ''}`, true);

