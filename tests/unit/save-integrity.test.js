import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { migrateSave, roundTripSave, validateSave } from "../../src/save-integrity.js";

async function fixture(name) {
  return JSON.parse(await fs.readFile(new URL(`../../examples/demo/fixtures/${name}`, import.meta.url), "utf8"));
}

test("validates and round trips a current save", async () => {
  const save = await fixture("save-v2.json");
  assert.deepEqual(validateSave(save, { version: 2, requiredPaths: ["player.name", "resources.energy", "inventory"] }).issues, []);
  assert.equal(roundTripSave(save).stable, true);
});

test("rejects malformed state", async () => {
  const save = await fixture("malformed-save.json");
  const result = validateSave(save, { version: 2, requiredPaths: ["player.name", "resources.credits"] });
  assert.equal(result.pass, false);
  assert.match(result.issues.join(" "), /version|missing required path/);
});

test("applies explicit migrations in order", async () => {
  const save = await fixture("save-v1.json");
  const result = migrateSave(save, 2, { 2: (value) => ({ ...value, resources: { energy: 10, credits: value.credits }, credits: undefined }) });
  assert.deepEqual(result.applied, [2]);
  assert.equal(result.save.version, 2);
  assert.deepEqual(result.save.resources, { energy: 10, credits: 100 });
});
