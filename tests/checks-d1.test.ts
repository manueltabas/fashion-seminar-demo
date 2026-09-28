import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runD1 } from "../src/checks/d1";
import type { Finding } from "../src/checks/types";

function loadFixture(name: string): unknown[] {
  const raw = readFileSync(join(import.meta.dirname, "fixtures", name), "utf-8");
  return JSON.parse(raw) as unknown[];
}

function statusMap(findings: Finding[]): Record<string, string> {
  return Object.fromEntries(
    findings.map((finding) => [finding.checkId, finding.status]),
  );
}

test("D1 complete fixture passes every check", () => {
  const findings = runD1({ jsonLd: loadFixture("d1-complete.json") });
  const statuses = statusMap(findings);
  assert.equal(findings.length, 12);
  for (const [checkId, status] of Object.entries(statuses)) {
    assert.equal(status, "pass", `${checkId} should pass`);
  }
});

test("D1 empty fixture fails the product checks", () => {
  const findings = runD1({ jsonLd: loadFixture("d1-empty.json") });
  const statuses = statusMap(findings);
  assert.equal(statuses["D1.jsonld_product"], "fail");
  assert.equal(statuses["D1.offer_price"], "fail");
  assert.equal(statuses["D1.price_currency"], "fail");
  assert.equal(statuses["D1.availability"], "fail");
  assert.equal(statuses["D1.brand"], "fail");
  // No declared variants is not a failure.
  assert.equal(statuses["D1.variant_identifiers"], "pass");
});

test("D1 partial fixture yields the expected mixed outcomes", () => {
  const findings = runD1({ jsonLd: loadFixture("d1-partial.json") });
  const statuses = statusMap(findings);
  assert.equal(statuses["D1.jsonld_product"], "pass");
  assert.equal(statuses["D1.offer_price"], "pass");
  assert.equal(statuses["D1.price_currency"], "partial");
  assert.equal(statuses["D1.availability"], "fail");
  assert.equal(statuses["D1.product_identifier"], "fail");
  assert.equal(statuses["D1.brand"], "fail");
  assert.equal(statuses["D1.merchant_return_policy"], "fail");
});

test("D1 findings carry type, dimension, weight, and evidence", () => {
  const findings = runD1({ jsonLd: loadFixture("d1-complete.json") });
  for (const finding of findings) {
    assert.equal(finding.dimension, "d1");
    assert.equal(finding.type, "deterministic");
    assert.ok(finding.weight > 0);
    assert.ok(finding.evidence.trim().length > 0);
  }
});
