import "fake-indexeddb/auto"; // Polyfill for IndexedDB
import { test, expect } from "bun:test";
import { Database, STORES } from "../../infra/database";
import { TwitterProfileRepository } from "./tweeter-profile-repository";
import type { XProfile } from "../models/social-profile";

const mockProfile: XProfile = {
  username: "testuser",
  name: "Test User",
  bio: "Test bio",
  location: "Test Location",
  website: "https://test.com",
  joinDate: "2020-01-01",
  following: 100,
  followers: 200,
  recentTweets: [],
};

const updatedProfile: XProfile = {
  username: "testuser", // same username
  name: "Updated User",
  bio: "Updated bio",
  // location and website are undefined
  joinDate: "2020-01-01",
  following: 150,
  followers: 250,
  recentTweets: [],
};

test("should store and retrieve profile", async () => {
  const db = new Database();
  await db.init();
  const repository = new TwitterProfileRepository(db);

  await repository.upsert(mockProfile);
  const storedProfile = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    mockProfile.username
  );

  expect(storedProfile).toEqual(mockProfile);
});

test("should update existing profile while preserving undefined fields", async () => {
  const db = new Database();
  await db.init();
  const repository = new TwitterProfileRepository(db);

  // First insert the original profile
  await repository.upsert(mockProfile);

  // Then update with new profile
  await repository.upsert(updatedProfile);

  // Retrieve the final profile
  const finalProfile = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    mockProfile.username
  );

  // Check that undefined fields from updatedProfile didn't overwrite existing values
  expect(finalProfile).toEqual({
    ...mockProfile,
    name: updatedProfile.name,
    bio: updatedProfile.bio,
    following: updatedProfile.following,
    followers: updatedProfile.followers,
    recentTweets: updatedProfile.recentTweets,
    totalSavedTweets: updatedProfile.totalSavedTweets,
  });
});

test("should handle multiple profiles", async () => {
  const db = new Database();
  await db.init();
  const repository = new TwitterProfileRepository(db);

  const profile2: XProfile = {
    ...mockProfile,
    username: "testuser2",
    name: "Test User 2",
  };

  await repository.upsert(mockProfile);
  await repository.upsert(profile2);

  const storedProfile1 = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    mockProfile.username
  );
  const storedProfile2 = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    profile2.username
  );

  expect(storedProfile1).toEqual(mockProfile);
  expect(storedProfile2).toEqual(profile2);
});

test("should handle profile with minimal data", async () => {
  const db = new Database();
  await db.init();
  const repository = new TwitterProfileRepository(db);

  const minimalProfile: XProfile = {
    username: "minimaluser",
    name: "Minimal User",
  };

  await repository.upsert(minimalProfile);
  const storedProfile = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    minimalProfile.username
  );

  expect(storedProfile).toEqual(minimalProfile);
});
