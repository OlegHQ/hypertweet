import * as browser from "webextension-polyfill";
export const browserApi = browser;

function getChrome(): typeof chrome | null {
  try {
    if (typeof chrome.runtime.sendMessage === "function") {
      return chrome;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function sendMessage<T = any>(data: unknown): Promise<T> {
  const chrome = getChrome();
  if (chrome) {
    const result = await chrome.runtime.sendMessage(data);
    return result as T;
  } else {
    const result = await browserApi.runtime.sendMessage(data);
    return result as T;
  }
}

export function onMessage<T>(callback: (message: any) => Promise<T>) {
  const chrome = getChrome();
  if (chrome) {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      callback(message).then((result) => {
        sendResponse(result);
      });
      return true;
    });
  } else {
    browserApi.runtime.onMessage.addListener(async (message) => {
      return await callback(message);
    });
  }
}
