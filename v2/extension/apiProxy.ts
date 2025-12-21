// Auto-proxy for api.ts - calls go through background script to avoid mixed content

type ApiModule = typeof import('./api');

class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public field?: string
	) {
		super(message);
	}
}

// Single proxy object - use as api.login(), api.listTones(), etc.
export const api = new Proxy({} as ApiModule, {
	get(_, prop: string) {
		return (...args: unknown[]) => {
			const call = (finalArg?: unknown) =>
				new Promise((resolve, reject) => {
					chrome.runtime.sendMessage(
						{ type: 'API_PROXY', fn: prop, args: finalArg !== undefined ? [...args, finalArg] : args },
						(res: { data?: unknown; error?: string; status?: number; field?: string }) => {
							if (res.error) reject(new ApiError(res.error, res.status ?? 0, res.field));
							else resolve(res.data);
						}
					);
				});
			return call();
		};
	},
});
