import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runD2Findings } from "../src/checks/d2";
import type { Finding } from "../src/checks/types";

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf-8");
}

function statusMap(findings: Finding[]): Record<string, string> {
  return Object.fromEntries(
    findings.map((finding) => [finding.checkId, finding.status]),
  );
}

test("D2 good fixture passes every check", () => {
  const findings = runD2Findings({ jsonLd: [], html: loadFixture("d2-good.html") });
  assert.equal(findings.length, 8);
  for (const [checkId, status] of Object.entries(statusMap(findings))) {
    assert.equal(status, "pass", `${checkId} should pass`);
  }
});

test("D2 flags a JS-only page", () => {
  const statuses = statusMap(
    runD2Findings({ jsonLd: [], html: loadFixture("d2-js-only.html") }),
  );
  assert.equal(statuses["D2.main_content_in_html"], "fail");
  assert.equal(statuses["D2.heading_hierarchy"], "fail");
  assert.equal(statuses["D2.attributes_text"], "fail");
  assert.equal(statuses["D2.specs_parseable"], "fail");
  assert.equal(statuses["D2.description_substantive"], "fail");
  assert.equal(statuses["D2.locale_coherent"], "fail");
});

test("D2 flags content hidden behind JS tabs as partial", () => {
  const statuses = statusMap(
    runD2Findings({ jsonLd: [], html: loadFixture("d2-hidden.html") }),
  );
  assert.equal(statuses["D2.content_not_hidden_js"], "partial");
  assert.equal(statuses["D2.main_content_in_html"], "pass");
});

test("D2 findings carry type, dimension, weight, and evidence", () => {
  const findings = runD2Findings({ jsonLd: [], html: loadFixture("d2-good.html") });
  for (const finding of findings) {
    assert.equal(finding.dimension, "d2");
    assert.equal(finding.type, "deterministic");
    assert.ok(finding.weight > 0);
    assert.ok(finding.evidence.trim().length > 0);
  }
});
