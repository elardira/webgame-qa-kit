import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_VIEWPORTS, normalizeConfig } from "../../src/config.js";

test("normalizes a minimal configuration", () => {
  const config = normalizeConfig({ baseUrl: "https://example.invalid/", routes: [{ name: "home", path: "/" }] });
  assert.equal(config.baseUrl, "https://example.invalid");
  assert.deepEqual(config.viewports, DEFAULT_VIEWPORTS);
  assert.equal(config.cardSelector, "[data-qa-card]");
});

test("rejects unsafe protocols and incomplete routes", () => {
  assert.throws(() => normalizeConfig({ baseUrl: "file:///tmp/demo", routes: [{ path: "/" }] }), /http or https/);
  assert.throws(() => normalizeConfig({ baseUrl: "https://example.invalid", routes: [] }), /at least one/);
  assert.throws(() => normalizeConfig({ baseUrl: "https://example.invalid", routes: [{ path: "home" }] }), /start with/);
});
