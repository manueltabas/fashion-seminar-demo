import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runD3Findings } from "../src/checks/d3";
import type { Finding } from "../src/checks/types";

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf-8");
}

function statusMap(findings: Finding[]): Record<string, string> {
  return Object.fromEntries(
    findings.map((finding) => [finding.checkId, finding.status]),
  );
}

test("D3 good fixture passes every check", () => {
  const findings = runD3Findings({
    jsonLd: [],
    html: loadFixture("d3-good.html"),
  });
  assert.equal(findings.length, 11);
  for (const [checkId, status] of Object.entries(statusMap(findings))) {
    assert.equal(status, "pass", `${checkId} should pass`);
  }
});

test("D3 empty fixture fails the trust signals", () => {
  const statuses = statusMap(
    runD3Findings({ jsonLd: [], html: loadFixture("d3-empty.html") }),
  );
  assert.equal(statuses["D3.shipping_info"], "fail");
  assert.equal(statuses["D3.returns_policy"], "fail");
  assert.equal(statuses["D3.warranty"], "fail");
  assert.equal(statuses["D3.reviews"], "fail");
  assert.equal(statuses["D3.contact"], "fail");
  assert.equal(statuses["D3.privacy_policy"], "fail");
});

test("D3 uses JSON-LD rating data for the reviews check", () => {
  const statuses = statusMap(
    runD3Findings({
      jsonLd: [{ "@type": "AggregateRating", ratingValue: "4.7" }],
    }),
  );
  assert.equal(statuses["D3.reviews"], "pass");
});

test("D3 findings carry type, dimension, weight, and evidence", () => {
  const findings = runD3Findings({
    jsonLd: [],
    html: loadFixture("d3-good.html"),
  });
  for (const finding of findings) {
    assert.equal(finding.dimension, "d3");
    assert.equal(finding.type, "deterministic");
    assert.ok(finding.weight > 0);
    assert.ok(finding.evidence.trim().length > 0);
  }
});
