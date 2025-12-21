import * as api from './api';

// Expose all api functions to content scripts via message passing
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg.type !== 'API_PROXY') return;
	console.log("Getting", msg, _sender)

	const { fn, args } = msg as { type: string; fn: string; args: unknown[] };
	const func = (api as Record<string, unknown>)[fn];

	if (typeof func !== 'function') {
		sendResponse({ error: `Unknown API function: ${fn}` });
		return;
	}
	void Promise.resolve()
		.then(() =>
			func(...args)
		)
		.then(data => sendResponse({ data }))
		.catch(e => sendResponse({ error: e.message, status: e.status, field: e.field }));

	return true; // Keep channel open
});

