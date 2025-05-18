import "fake-indexeddb/auto"; // Polyfill for IndexedDB
import { test, expect, beforeEach } from "bun:test";
import { Database, STORES } from "../../infra/database";
import { TwitterProfileRepository } from "./tweeter-profile-repository";
import type { XProfile } from "../models/social-profile";

// Use a fixed timestamp for testing
const TEST_TIMESTAMP = 1747596676293;

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
  updatedAtNegative: -TEST_TIMESTAMP,
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
  updatedAtNegative: -TEST_TIMESTAMP,
};

let db: Database;
let repository: TwitterProfileRepository;

beforeEach(async () => {
  db = new Database();
  await db.init();
  repository = new TwitterProfileRepository(db);
  // Clear the database before each test
  await db.clearStore(STORES.TWITTER_PROFILES);
});

test("should store and retrieve profile", async () => {
  await repository.upsert(mockProfile);
  const storedProfile = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    mockProfile.username
  );

  expect(storedProfile).toEqual(mockProfile);
});

test("should update existing profile while preserving undefined fields", async () => {
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
  const minimalProfile: XProfile = {
    username: "minimaluser",
    name: "Minimal User",
    updatedAtNegative: -TEST_TIMESTAMP,
  };

  await repository.upsert(minimalProfile);
  const storedProfile = await db.get<XProfile>(
    STORES.TWITTER_PROFILES,
    minimalProfile.username
  );

  expect(storedProfile).toEqual(minimalProfile);
});

test("should get recent profiles sorted by update time", async () => {
  // Create profiles with different timestamps
  const profile1: XProfile = {
    username: "user1",
    name: "User 1",
    updatedAtNegative: -(TEST_TIMESTAMP - 2000), // 2 seconds ago
  };
  const profile2: XProfile = {
    username: "user2",
    name: "User 2",
    updatedAtNegative: -(TEST_TIMESTAMP - 1000), // 1 second ago
  };
  const profile3: XProfile = {
    username: "user3",
    name: "User 3",
    updatedAtNegative: -TEST_TIMESTAMP, // now
  };

  // Insert in random order
  await repository.upsert(profile1);
  await repository.upsert(profile3);
  await repository.upsert(profile2);

  // Get recent profiles
  const recentProfiles = await repository.getRecentProfiles();

  // Should be sorted by updatedAt in descending order
  expect(recentProfiles).toHaveLength(3);
  expect(recentProfiles[0]!.username).toBe("user3");
  expect(recentProfiles[1]!.username).toBe("user2");
  expect(recentProfiles[2]!.username).toBe("user1");
});

test("should respect limit when getting recent profiles", async () => {
  // Create 5 profiles
  for (let i = 0; i < 5; i++) {
    const profile: XProfile = {
      username: `user${i}`,
      name: `User ${i}`,
      updatedAtNegative: -(TEST_TIMESTAMP - i * 1000), // Each profile 1 second older than the previous
    };
    await repository.upsert(profile);
  }

  // Get only 3 most recent profiles
  const recentProfiles = await repository.getRecentProfiles(3);

  // Should only return 3 profiles, sorted by updatedAt
  expect(recentProfiles).toHaveLength(3);
  expect(recentProfiles[0]!.username).toBe("user0");
  expect(recentProfiles[1]!.username).toBe("user1");
  expect(recentProfiles[2]!.username).toBe("user2");
});

test("should handle empty database when getting recent profiles", async () => {
  const recentProfiles = await repository.getRecentProfiles();
  expect(recentProfiles).toHaveLength(0);
});
