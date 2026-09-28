import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkAgentAccess,
  evaluateRobots,
  isPathAllowed,
  parseRobots,
} from "../src/capture/robots";

const GPTBOT_BLOCK = `User-agent: GPTBot
Disallow: /
`;

const PERMISSIVE = `User-agent: *
Disallow:
`;

const WILDCARD_BLOCK = `User-agent: *
Disallow: /
`;

const SPECIFIC_ALLOW = `User-agent: *
Disallow: /
User-agent: GPTBot
Allow: /
`;

test("GPTBot disallow is flagged", () => {
  const result = evaluateRobots(GPTBOT_BLOCK);
  assert.equal(result.allowed, false);
  assert.ok(result.blockedBots.includes("GPTBot"));
  assert.equal(
    result.bots.find((bot) => bot.name === "GPTBot")?.source,
    "specific",
  );
});

test("a permissive robots.txt reports allowed", () => {
  const result = evaluateRobots(PERMISSIVE);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.blockedBots, []);
});

test("a wildcard disallow blocks all crawlers", () => {
  const result = evaluateRobots(WILDCARD_BLOCK);
  assert.equal(result.allowed, false);
  assert.ok(result.blockedBots.length > 5);
});

test("a specific allow overrides the wildcard disallow", () => {
  const result = evaluateRobots(SPECIFIC_ALLOW);
  const gptbot = result.bots.find((bot) => bot.name === "GPTBot");
  assert.equal(gptbot?.allowed, true);
  assert.ok(result.blockedBots.includes("CCBot"));
});

test("isPathAllowed uses the longest matching rule", () => {
  const rules = parseRobots(`User-agent: X
Disallow: /private
Allow: /private/public
`);
  const agentRules = rules.get("x") ?? [];
  assert.equal(isPathAllowed(agentRules, "/private/secret"), false);
  assert.equal(isPathAllowed(agentRules, "/private/public/page"), true);
  assert.equal(isPathAllowed(agentRules, "/other"), true);
});

test("checkAgentAccess treats a missing robots.txt as allowed", async () => {
  const fetchImpl = (async () =>
    new Response("not found", { status: 404 })) as typeof fetch;
  const result = await checkAgentAccess("https://example.com/p/1", {
    fetchImpl,
  });
  assert.equal(result.present, false);
  assert.equal(result.allowed, true);
});

test("checkAgentAccess flags a GPTBot block from a live robots.txt", async () => {
  const fetchImpl = (async () =>
    new Response(GPTBOT_BLOCK, {
      status: 200,
      headers: { "content-type": "text/plain" },
    })) as typeof fetch;
  const result = await checkAgentAccess("https://example.com/p/1", {
    fetchImpl,
  });
  assert.equal(result.robotsUrl, "https://example.com/robots.txt");
  assert.equal(result.present, true);
  assert.equal(result.allowed, false);
  assert.ok(result.blockedBots.includes("GPTBot"));
});
