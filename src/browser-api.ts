import type { Browser } from "webextension-polyfill";

declare global {
  var browser: Browser;
}

export const browserApi = typeof browser !== "undefined" ? browser : chrome;
export const isChrome = typeof chrome !== "undefined";
