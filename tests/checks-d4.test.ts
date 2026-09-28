import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runD4Findings } from "../src/checks/d4";
import type { CheckContext, Finding } from "../src/checks/types";

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf-8");
}

function statusMap(findings: Finding[]): Record<string, string> {
  return Object.fromEntries(
    findings.map((finding) => [finding.checkId, finding.status]),
  );
}

const OK_CONTEXT: Partial<CheckContext> = {
  fetch: { statusCode: 200, blocked: false },
  robots: { present: true, allowed: true, blockedBots: [] },
};

test("D4 good fixture passes every check", () => {
  const findings = runD4Findings({
    jsonLd: [],
    html: loadFixture("d4-good.html"),
    ...OK_CONTEXT,
  });
  assert.equal(findings.length, 10);
  for (const [checkId, status] of Object.entries(statusMap(findings))) {
    assert.equal(status, "pass", `${checkId} should pass`);
  }
});

test("D4 flags a gated and blocked page", () => {
  const statuses = statusMap(
    runD4Findings({
      jsonLd: [],
      html: loadFixture("d4-bad.html"),
      fetch: { statusCode: 403, blocked: true },
      robots: { present: true, allowed: false, blockedBots: ["GPTBot"] },
    }),
  );
  assert.equal(statuses["D4.price_displayed"], "fail");
  assert.equal(statuses["D4.price_not_login"], "fail");
  assert.equal(statuses["D4.add_to_cart"], "fail");
  assert.equal(statuses["D4.payment_methods"], "fail");
  assert.equal(statuses["D4.robots_allows_agents"], "fail");
  assert.equal(statuses["D4.fetch_not_blocked"], "fail");
  assert.equal(statuses["D4.no_agent_friction"], "fail");
});

test("D4 robots check is partial when robots.txt was not checked", () => {
  const statuses = statusMap(
    runD4Findings({
      jsonLd: [],
      html: loadFixture("d4-good.html"),
      fetch: { statusCode: 200, blocked: false },
    }),
  );
  assert.equal(statuses["D4.robots_allows_agents"], "partial");
});

test("D4 accepts price/stock from structured data when the page renders them with JS", () => {
  const statuses = statusMap(
    runD4Findings({
      html: "<html><body><h1>Product</h1><p>Checking availability...</p></body></html>",
      jsonLd: [
        {
          "@type": "Offer",
          price: "24.99",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      ],
      fetch: { statusCode: 200, blocked: false },
      robots: { present: true, allowed: true, blockedBots: [] },
    }),
  );
  assert.equal(statuses["D4.price_displayed"], "pass");
  assert.equal(statuses["D4.currency_locale"], "pass");
  assert.equal(statuses["D4.stock_signal"], "pass");
  assert.equal(statuses["D4.add_to_cart"], "pass");
});

test("D4 findings carry type, dimension, weight, and evidence", () => {
  const findings = runD4Findings({
    jsonLd: [],
    html: loadFixture("d4-good.html"),
    ...OK_CONTEXT,
  });
  for (const finding of findings) {
    assert.equal(finding.dimension, "d4");
    assert.equal(finding.type, "deterministic");
    assert.ok(finding.weight > 0);
    assert.ok(finding.evidence.trim().length > 0);
  }
});
