import assert from "node:assert/strict";
import { test } from "node:test";
import {
  brandNameFromDomain,
  detectBrand,
  normalizeHost,
  registrableDomain,
} from "../src/brands/detect";

test("normalizeHost strips www prefixes", () => {
  assert.equal(normalizeHost("https://www.rothys.com/products/x"), "rothys.com");
  assert.equal(normalizeHost("https://www2.hm.com/sv_se/productpage.html"), "hm.com");
});

test("registrableDomain keeps the last two labels", () => {
  assert.equal(registrableDomain("shop.rothys.com"), "rothys.com");
  assert.equal(registrableDomain("rothys.com"), "rothys.com");
});

test("brandNameFromDomain title-cases the second-level label", () => {
  assert.equal(brandNameFromDomain("rothys.com"), "Rothys");
});

test("detectBrand prefers explicit name, then structured data, then domain", () => {
  const explicit = detectBrand({
    url: "https://www.rothys.com/p/x",
    brandName: "Rothy's",
    structuredData: { brand: { name: "Ignored" } },
  });
  assert.equal(explicit.name, "Rothy's");
  assert.equal(explicit.source, "explicit");

  const structured = detectBrand({
    url: "https://shop.example.com/p/x",
    structuredData: { brand: { name: "Example Co" } },
  });
  assert.equal(structured.name, "Example Co");
  assert.equal(structured.source, "structured_data");
  assert.equal(structured.domain, "example.com");

  const domain = detectBrand({ url: "https://www.example.com/p/x" });
  assert.equal(domain.name, "Example");
  assert.equal(domain.source, "domain");
});

test("detectBrand reads a string brand from structured data", () => {
  const detected = detectBrand({
    url: "https://www.example.com/p/x",
    structuredData: { brand: "Example Brand" },
  });
  assert.equal(detected.name, "Example Brand");
});
