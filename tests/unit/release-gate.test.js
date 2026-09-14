import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReleaseGate } from "../../src/release-gate.js";

test("passes only when every check passes", () => {
  assert.equal(evaluateReleaseGate([{ id: "unit", pass: true }, { id: "browser", pass: true }]).pass, true);
  const failed = evaluateReleaseGate([{ id: "unit", pass: true }, { id: "browser", pass: false }]);
  assert.equal(failed.pass, false);
  assert.equal(failed.failed, 1);
});

test("requires at least one check", () => assert.throws(() => evaluateReleaseGate([]), /at least one/));
