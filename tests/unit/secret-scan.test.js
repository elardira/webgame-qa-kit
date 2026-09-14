import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scanSecrets } from "../../src/secret-scan.js";

test("passes a directory with ordinary configuration", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "webgame-qa-safe-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, "config.js"), "export const url = 'https://example.invalid';\n");
  assert.equal((await scanSecrets(root)).pass, true);
});

test("reports only location and detector for a credential pattern", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "webgame-qa-detect-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const synthetic = ["ghp", "TEST_ONLY_SYNTHETIC_12345678901234567890"].join("_");
  await fs.writeFile(path.join(root, "fixture.txt"), `${synthetic}\n`);
  const report = await scanSecrets(root, { allowMarkedFixtures: false });
  assert.equal(report.pass, false);
  assert.deepEqual(report.findings[0], { path: "fixture.txt", line: 1, detector: "github-token", message: "SECRET DETECTED — REDACTED" });
  assert.equal(JSON.stringify(report).includes(synthetic), false);
});

test("scans dot-env files and redacts named secret assignments", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "webgame-qa-dot-env-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const synthetic = ["CLOUDFLARE", "API", "TOKEN"].join("_") + "=" + "TEST_ONLY_SYNTHETIC_1234567890";
  await fs.writeFile(path.join(root, ".env"), `${synthetic}\n`);
  const report = await scanSecrets(root, { allowMarkedFixtures: false });
  assert.equal(report.pass, false);
  assert.equal(report.findings[0].path, ".env");
  assert.equal(report.findings[0].message, "SECRET DETECTED — REDACTED");
  assert.equal(JSON.stringify(report).includes(synthetic), false);
});
