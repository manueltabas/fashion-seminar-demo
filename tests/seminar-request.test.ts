import test from "node:test";
import assert from "node:assert/strict";
import { parseShopperRequest } from "../src/seminar/request";

test("shopper requests preserve legacy empty input and normalize text", () => {
  assert.deepEqual(parseShopperRequest(undefined), { ok: true, value: null });
  assert.deepEqual(parseShopperRequest("  "), { ok: true, value: null });
  assert.deepEqual(parseShopperRequest("  Shoes under €120  "), { ok: true, value: "Shoes under €120" });
});
test("invalid shopper input is rejected rather than silently dropped", () => {
  for (const value of [null, 123, {}, ["shoes"], "x".repeat(1001)]) assert.equal(parseShopperRequest(value).ok, false);
  assert.equal(parseShopperRequest("x".repeat(1000)).ok, true);
});
