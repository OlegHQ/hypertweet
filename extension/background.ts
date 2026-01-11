import * as api from './api';
import type { ChatRequest } from './api';

// Expose all api functions to content scripts via message passing
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'API_PROXY') return;

  const { fn, args } = msg as { type: string; fn: string; args: unknown[] };
  console.log('[BG] API_PROXY call:', fn, args);
  const func = (api as Record<string, unknown>)[fn];

  if (typeof func !== 'function') {
    console.error('[BG] Unknown function:', fn);
    sendResponse({ error: `Unknown API function: ${fn}` });
    return;
  }
  void Promise.resolve()
    .then(() => func(...args))
    .then(data => {
      console.log('[BG] Success:', fn, data);
      sendResponse({ data });
    })
    .catch(e => {
      console.error('[BG] Error:', fn, e);
      sendResponse({ error: e.message, status: e.status, field: e.field });
    });

  return true; // Keep channel open
});

// Handle streaming chat via port connection
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'chat-stream') return;

  port.onMessage.addListener((request: ChatRequest) => {
    void (async () => {
      try {
        await api.streamChat(request, event => {
          port.postMessage({ event });
        });
        port.postMessage({ done: true });
      } catch (e) {
        port.postMessage({ error: (e as Error).message });
      }
    })();
  });
});
