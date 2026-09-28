import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_MODEL_PROFILES,
  parseExtraProfiles,
} from "../src/models/catalog";

test("default catalog contains a valid Google profile", () => {
  assert.ok(DEFAULT_MODEL_PROFILES.length > 0);
  const google = DEFAULT_MODEL_PROFILES[0];
  assert.equal(google.provider, "google");
  assert.equal(google.credentialRef, "GEMINI_API_KEY");
});

test("parseExtraProfiles returns [] for empty or invalid input", () => {
  assert.deepEqual(parseExtraProfiles(undefined), []);
  assert.deepEqual(parseExtraProfiles(""), []);
  assert.deepEqual(parseExtraProfiles("not json"), []);
  assert.deepEqual(parseExtraProfiles('{"key":"x"}'), []);
});

test("parseExtraProfiles keeps only valid entries", () => {
  const value = JSON.stringify([
    {
      key: "openai-gpt",
      provider: "openai",
      model: "gpt-x",
      label: "GPT X",
      credentialRef: "OPENAI_API_KEY",
      sortOrder: 5,
    },
    { key: "bad", provider: "not-a-provider", model: "m", label: "L", credentialRef: "X" },
    { key: "missing-model", provider: "anthropic", label: "L", credentialRef: "X" },
  ]);
  const parsed = parseExtraProfiles(value);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].key, "openai-gpt");
  assert.equal(parsed[0].sortOrder, 5);
});
