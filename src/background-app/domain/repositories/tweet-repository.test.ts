import "fake-indexeddb/auto"; // Polyfill for IndexedDB
import { test, expect } from "bun:test";
import { Database } from "../../infra/database";
import { TweetRepository } from "./tweet-repository";
import type { Tweet } from "../models/social-profile";

const mockTweet: Tweet = {
  id: "123",
  from: "testuser",
  text: "Test tweet",
  time: "2024-03-20T12:00:00Z",
  url: "https://twitter.com/testuser/status/123",
  likes: 10,
  retweets: 5,
  replies: 2,
  bookmarks: 1,
  impressions: 100,
  impressionsNeg: -100,
};

const mockTweet2: Tweet = {
  id: "456",
  from: "testuser",
  text: "Another test tweet",
  time: "2024-03-20T13:00:00Z",
  url: "https://twitter.com/testuser/status/456",
  likes: 20,
  retweets: 10,
  replies: 5,
  bookmarks: 2,
  impressions: 200,
  impressionsNeg: -200,
};

const mockTweet3: Tweet = {
  id: "789",
  from: "otheruser",
  text: "Tweet from another user",
  time: "2024-03-20T14:00:00Z",
  url: "https://twitter.com/otheruser/status/789",
  likes: 15,
  retweets: 7,
  replies: 3,
  bookmarks: 1,
  impressions: 150,
  impressionsNeg: -150,
};

test("should add and retrieve tweets", async () => {
  const db = new Database();
  await db.init();
  const repository = new TweetRepository(db);

  await repository.add(mockTweet);
  const tweets = await repository.getByUsername(mockTweet.from);

  expect(tweets).toHaveLength(1);
  expect(tweets[0]).toEqual(mockTweet);
});

test("should get correct tweet count by username", async () => {
  const db = new Database();
  await db.init();
  const repository = new TweetRepository(db);

  await repository.add(mockTweet);
  await repository.add(mockTweet2);
  await repository.add(mockTweet3);

  const count = await repository.getCountByUsername("testuser");
  expect(count).toBe(2);
});

test("should get all tweets by username", async () => {
  const db = new Database();
  await db.init();
  const repository = new TweetRepository(db);

  await repository.add(mockTweet);
  await repository.add(mockTweet2);
  await repository.add(mockTweet3);

  const tweets = await repository.getByUsername("testuser");
  expect(tweets).toHaveLength(2);
  expect(tweets).toEqual(expect.arrayContaining([mockTweet, mockTweet2]));
  expect(tweets).not.toContainEqual(mockTweet3);
});

test("should return empty array for non-existent username", async () => {
  const db = new Database();
  await db.init();
  const repository = new TweetRepository(db);

  const tweets = await repository.getByUsername("nonexistentuser");
  expect(tweets).toHaveLength(0);
});

test("should return 0 count for non-existent username", async () => {
  const db = new Database();
  await db.init();
  const repository = new TweetRepository(db);

  const count = await repository.getCountByUsername("nonexistentuser");
  expect(count).toBe(0);
});
