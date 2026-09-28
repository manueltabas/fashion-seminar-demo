import test from "node:test";
import assert from "node:assert/strict";
import { extractProductCard, safeWebUrl, stockCaptureDisagreement } from "../src/seminar/product";
const url = "https://fashion.example/products/jacket";
const product = { "@type": "Product", url, name: "Rain jacket", image: "https://fashion.example/jacket.jpg", offers: { "@type": "Offer", price: 129, priceCurrency: "EUR", availability: "https://schema.org/InStock" } };

test("product card extracts numeric prices and explicit availability", () => {
 const card = extractProductCard([product], url, "Fallback");
 assert.equal(card.title, "Rain jacket"); assert.equal(card.price, "EUR 129.00"); assert.equal(card.availability, "In stock"); assert.equal(card.multipleOffers, false);
});
test("unrelated recommendation offers do not contaminate the product card", () => {
 const recommendation = { ...product, name: "Other", url: "https://fashion.example/products/other", offers: { ...product.offers, price: 1 } };
 assert.equal(extractProductCard([recommendation, product], url, "Fallback").price, "EUR 129.00");
 assert.equal(extractProductCard([recommendation], url, "Fallback").price, null);
});
test("ambiguous products do not produce a guessed price", () => {
 assert.equal(extractProductCard([{ ...product, url: undefined }, { ...product, url: undefined, name: "Other" }], url, "Fallback").price, null);
});
test("group variants show a range and incomplete stock instead of claiming availability", () => {
 const group = { "@type": "ProductGroup", url, name: "Jacket", hasVariant: [product, { ...product, offers: { ...product.offers, price: 149, availability: undefined } }] };
 const result = extractProductCard([group], url, "Fallback");
 assert.equal(result.price, "EUR 129.00–149.00"); assert.equal(result.multipleOffers, true); assert.equal(result.availability, "Varies or is incomplete across offers");
});
test("missing and invalid offers remain unknown", () => {
 assert.equal(extractProductCard([], url, "Fallback").price, null);
 for (const price of [null, "", "not a price", -12]) assert.equal(extractProductCard([{ ...product, offers: { ...product.offers, price } }], url, "Fallback").price, null);
 assert.equal(extractProductCard([{ ...product, offers: { ...product.offers, priceCurrency: undefined } }], url, "Fallback").price, null);
});
test("JSON-LD graph references resolve linked offers", () => {
 const card = extractProductCard([{ "@graph": [{ ...product, offers: { "@id": "#offer" } }, { ...product.offers, "@id": "#offer" }] }], url, "Fallback");
 assert.equal(card.price, "EUR 129.00");
});
test("unsafe image schemes are rejected and relative media resolves against the product", () => {
 assert.equal(safeWebUrl("javascript:alert(1)", url), null);
 assert.equal(safeWebUrl("data:image/svg+xml,x", url), null);
 assert.equal(safeWebUrl("/jacket.jpg", url), "https://fashion.example/jacket.jpg");
});

test("regional redirect capture URLs match the exact product group", () => {
 const regional = "https://fashion.example/en-se/products/jacket";
 const group = { "@type": "ProductGroup", url: regional, name: "Jacket", hasVariant: [{ ...product, url: undefined }] };
 assert.equal(extractProductCard([group], regional, "Fallback").price, "EUR 129.00");
 assert.equal(extractProductCard([group], url, "Fallback").price, null);
});

test("conflicting capture signals are highlighted without deciding which is current", () => {
 assert.match(stockCaptureDisagreement("In stock", "Out Of Stock Online") ?? "", /Stock signals disagree/);
 assert.equal(stockCaptureDisagreement("In stock", "Available now"), null);
 assert.equal(stockCaptureDisagreement(null, "Sold out"), null);
});
