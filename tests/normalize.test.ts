import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { normalizeHtml } from "../src/capture/normalize";

const fixture = readFileSync(
  join(import.meta.dirname, "fixtures", "sample-pdp.html"),
  "utf-8",
);

test("normalization keeps CTA, price, and availability as text", () => {
  const result = normalizeHtml(fixture);
  assert.match(result.content, /Add to Cart/);
  assert.match(result.content, /\$65\.00/);
  assert.match(result.content, /Out Of Stock Online/);

  assert.ok(result.signals.ctaTexts.some((t) => /Add to Cart/.test(t)));
  assert.ok(result.signals.priceTexts.some((t) => /\$65\.00/.test(t)));
  assert.ok(
    result.signals.availabilityTexts.some((t) => /Out Of Stock/.test(t)),
  );
});

test("normalization extracts JSON-LD separately and ignores invalid blocks", () => {
  const result = normalizeHtml(fixture);
  assert.equal(result.jsonLd.length, 1);
  const product = result.jsonLd[0] as { "@type"?: string; name?: string };
  assert.equal(product["@type"], "Product");
  assert.equal(product.name, "The Kids Clog");
});

test("normalization drops nav and footer boilerplate", () => {
  const result = normalizeHtml(fixture);
  assert.doesNotMatch(result.content, /Shop All/);
  assert.doesNotMatch(result.content, /All Rights Reserved/);
  assert.doesNotMatch(result.content, /Free shipping on orders over \$100/);
});

test("normalization is deterministic for the same input", () => {
  const first = normalizeHtml(fixture);
  const second = normalizeHtml(fixture);
  assert.deepEqual(first, second);
});

test("normalization flags truncation when the limit is small", () => {
  const result = normalizeHtml(fixture, { maxContentChars: 20 });
  assert.equal(result.stats.truncated, true);
  assert.ok(result.content.length <= 20);
});
