import test from "node:test";
import assert from "node:assert/strict";
import { compareSnapshots } from "../../src/regression.js";

test("reports stable nested state", () => {
  assert.equal(compareSnapshots({ player: { level: 2 }, inventory: ["a"] }, { player: { level: 2 }, inventory: ["a"] }).pass, true);
});

test("identifies changed paths and honors ignore entries", () => {
  const result = compareSnapshots({ score: 1, clock: 10 }, { score: 2, clock: 11 }, { ignore: ["clock"] });
  assert.deepEqual(result.changes, [{ path: "score", before: 1, after: 2 }]);
});
