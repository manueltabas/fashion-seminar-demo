import assert from "node:assert/strict";
import { test } from "node:test";
import { detectJsRendered } from "../src/capture/js-detect";

test("detects JS-only content when scripts hold terms missing from the text", () => {
  const html =
    '<html><body><h1>Jacket</h1><script>{"return policy":"x","shipping":"free","warranty":"2y"}</script></body></html>';
  assert.equal(
    detectJsRendered({ html, content: "Jacket" }),
    true,
  );
});

test("does not flag a page whose text already contains the terms", () => {
  const html =
    '<html><body><p>Free shipping and returns</p><script>{"shipping":"x","returns":"y"}</script></body></html>';
  assert.equal(
    detectJsRendered({ html, content: "Free shipping and returns" }),
    false,
  );
});

test("does not flag a small static page without scripts", () => {
  assert.equal(
    detectJsRendered({
      html: "<html><body><h1>Product</h1></body></html>",
      content: "Product",
    }),
    false,
  );
});
