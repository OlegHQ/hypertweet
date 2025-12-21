const BASE_URL = 'http://olegs-macbook-air:5000';
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

function api<Req, Res>(method: string, path: string, auth = false) {
	return async (body?: Req): Promise<Res> => {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		if (auth && token) headers['Authorization'] = `Bearer ${token}`;

		const res = await fetch(BASE_URL + path, {
			method,
			headers,
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		const json = (await res.json()) as Res & { error?: string; field?: string };
		if (!res.ok)
			throw new ApiError(json.error ?? 'Request failed', res.status, json.field);
		return json;
	};
}

// Auth (public)
interface AuthReq {
	Email: string;
	Password: string;
}
interface TokenRes {
	AccessToken: string;
	RefreshToken: string;
	ExpiresIn: number;
}

export const apiLogin = api<AuthReq, TokenRes>('POST', '/auth/login');
export const apiRegister = api<AuthReq, { message: string }>('POST', '/auth/register');
export const apiRefresh = api<{ RefreshToken: string }, { token: string }>('POST', '/auth/refresh');

// Tones (protected)
interface Tone {
	id: string;
	title: string;
	instruction: string;
	isDefault: boolean;
}
interface ToneReq {
	Title: string;
	Instruction: string;
}

export const apiListTones = api<undefined, Tone[]>('GET', '/tones', true);
export const apiCreateTone = api<ToneReq, { id: string }>('POST', '/tones', true);
export const apiUpdateTone = (id: string) => api<ToneReq, { message: string }>('PUT', `/tones/${id}`, true);
export const apiDeleteTone = (id: string) => api<undefined, { message: string }>('DELETE', `/tones/${id}`, true);
export const apiToggleTone = (id: string, enable: boolean) =>
	api<undefined, { message: string }>('POST', `/tones/${id}/toggle${enable ? '?enable' : ''}`, true);

