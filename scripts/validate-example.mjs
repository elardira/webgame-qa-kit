import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import config from "../examples/demo/qa.config.mjs";
import { runBrowserAudit } from "../src/browser-audit.js";

const server = spawn(process.execPath, ["examples/demo/server.mjs"], { stdio: "ignore" });
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(config.baseUrl);
      if (response.ok) { ready = true; break; }
    } catch { /* server is starting */ }
    await wait(100);
  }
  if (!ready) throw new Error("demo server did not become ready");
  const report = await runBrowserAudit(config, { output: ".qa-output/example-validation.json" });
  console.log(`Example validation: ${report.pass ? "PASS" : "FAIL"} (${report.passed}/${report.total})`);
  if (!report.pass) process.exitCode = 1;
} finally {
  server.kill();
}
