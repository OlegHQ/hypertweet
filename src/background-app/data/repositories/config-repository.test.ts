import "fake-indexeddb/auto"; // Polyfill for IndexedDB
import { test, expect } from "bun:test";
import { Database } from "../database";
import { ConfigRepository } from "./config-repository";
import { ConfigTypeKey } from "../models/config-type-key";

test("should store and retrieve item", async () => {
  const testValue = "x";
  const db = new Database();
  await db.init();
  const configRepository = new ConfigRepository(db);
  await configRepository.setCredential(
    "test",
    ConfigTypeKey.OPENAI_API_KEY,
    testValue
  );
  const item = await configRepository.get("test", ConfigTypeKey.OPENAI_API_KEY);
  expect(item).not.toBe(testValue);
  const item2 = await configRepository.getCredential(
    "test",
    ConfigTypeKey.OPENAI_API_KEY
  );
  expect(item2).toBe(testValue);
});
