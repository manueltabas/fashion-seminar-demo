import assert from "node:assert/strict";
import { test } from "node:test";
import { RECOMMENDATION_CATALOG } from "../src/recommendations/catalog";
import {
  checkTitle,
  humanizeEvidence,
  describeCheckType,
} from "../src/evaluation/finding-copy";
import { displayTitle } from "../src/evaluation/copy";

const JARGON = [
  "offer",
  "json-ld",
  "hasmerchantreturnpolicy",
  "shippingdetails",
  "pricevaliduntil",
  "pricecurrency",
  "aggregaterating",
  "gtin",
  "mpn",
];

test("recommendation copy avoids schema.org jargon", () => {
  for (const [id, template] of Object.entries(RECOMMENDATION_CATALOG)) {
    const text = `${template.action} ${template.why}`.toLowerCase();
    for (const token of JARGON) {
      assert.ok(
        !text.includes(token),
        `recommendation ${id} contains "${token}"`,
      );
    }
  }
});

test("finding copy uses plain language", () => {
  assert.equal(
    humanizeEvidence("No Offer.hasMerchantReturnPolicy"),
    "The return policy is not included in the product data.",
  );
  assert.equal(
    humanizeEvidence("No Offer.priceValidUntil found"),
    "The product data does not say how long the price is valid.",
  );
  assert.equal(
    checkTitle("D1.merchant_return_policy"),
    "Return policy in the product data",
  );
  assert.equal(describeCheckType("deterministic"), "Automatic check");
  assert.equal(describeCheckType("model"), "AI review");
});

test("displayTitle falls back to a readable name from the URL", () => {
  assert.equal(displayTitle("The Kids Clog", "https://x.com/p/1"), "The Kids Clog");
  assert.equal(
    displayTitle(null, "https://rothys.com/products/kids-clog-burst"),
    "Kids Clog Burst",
  );
  assert.equal(displayTitle(undefined, "not-a-url"), "Product page");
});
