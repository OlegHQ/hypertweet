// Auto-proxy for api.ts - calls go through background script to avoid mixed content

import type { ChatRequest, ChatStreamEvent } from './api';

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
            {
              type: 'API_PROXY',
              fn: prop,
              args: finalArg !== undefined ? [...args, finalArg] : args,
            },
            (res: {
              data?: unknown;
              error?: string;
              status?: number;
              field?: string;
            }) => {
              if (res.error)
                reject(new ApiError(res.error, res.status ?? 0, res.field));
              else resolve(res.data);
            }
          );
        });
      return call();
    };
  },
});

// Streaming chat via port connection
export function streamChatProxy(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  onError: (error: Error) => void,
  onDone: () => void
): () => void {
  const port = chrome.runtime.connect({ name: 'chat-stream' });

  port.onMessage.addListener(
    (msg: { event?: ChatStreamEvent; error?: string; done?: boolean }) => {
      if (msg.error) {
        onError(new Error(msg.error));
      } else if (msg.done) {
        onDone();
      } else if (msg.event) {
        onEvent(msg.event);
      }
    }
  );

  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      onError(new Error(chrome.runtime.lastError.message));
    }
  });

  port.postMessage(request);

  // Return cleanup function
  return () => port.disconnect();
}
