import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyPage, type DetectionInput } from "../src/capture/classify";

const EMPTY_SIGNALS = {
  priceTexts: [],
  availabilityTexts: [],
  ctaTexts: [],
};

function input(overrides: Partial<DetectionInput>): DetectionInput {
  return {
    url: "https://example.com/x",
    statusCode: 200,
    content: "",
    jsonLd: [],
    signals: EMPTY_SIGNALS,
    ...overrides,
  };
}

test("a homepage fixture is flagged as non-PDP", () => {
  const result = classifyPage(
    input({
      url: "https://example.com/",
      title: "Example Store",
      content: "Welcome to Example Store",
      signals: {
        priceTexts: ["$10", "$20", "$30", "$40", "$50"],
        availabilityTexts: [],
        ctaTexts: [],
      },
    }),
  );
  assert.equal(result.classification, "homepage");
  assert.equal(result.isPdp, false);
});

test("a valid PDP fixture is accepted", () => {
  const result = classifyPage(
    input({
      url: "https://example.com/products/kids-clog",
      title: "The Kids Clog",
      content: "The Kids Clog",
      jsonLd: [{ "@type": "Product", name: "The Kids Clog" }],
      signals: {
        priceTexts: ["$65.00"],
        availabilityTexts: ["In stock"],
        ctaTexts: ["Add to Cart"],
      },
    }),
  );
  assert.equal(result.classification, "product");
  assert.equal(result.isPdp, true);
  assert.equal(result.confidence, "high");
});

test("a 404 fixture is rejected with a reason", () => {
  const result = classifyPage(input({ statusCode: 404 }));
  assert.equal(result.classification, "error");
  assert.equal(result.isPdp, false);
  assert.ok(result.reasons.includes("http_404"));
});

test("a blocked page is rejected", () => {
  const result = classifyPage(input({ statusCode: 403, blocked: true }));
  assert.equal(result.classification, "error");
  assert.ok(result.reasons.includes("blocked"));
});

test("a product page with a single price and title is accepted", () => {
  const result = classifyPage(
    input({
      url: "https://shop.example.com/catalogue/a-light-in-the-attic/index.html",
      title: "A Light in the Attic",
      content: "A Light in the Attic £51.77",
      signals: {
        priceTexts: ["£51.77"],
        availabilityTexts: ["In stock"],
        ctaTexts: [],
      },
    }),
  );
  assert.equal(result.classification, "product");
  assert.equal(result.isPdp, true);
});

test("a category page with many prices is not a PDP", () => {
  const result = classifyPage(
    input({
      url: "https://example.com/collections/shoes",
      content: "Shoes",
      signals: {
        priceTexts: ["$100", "$110", "$120", "$130"],
        availabilityTexts: [],
        ctaTexts: [],
      },
    }),
  );
  assert.equal(result.classification, "category");
  assert.equal(result.isPdp, false);
});
