#!/usr/bin/env node
import fs from "node:fs/promises";

/** @param {string} name */
function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const [, , command, target] = process.argv;
  if (command === "audit") {
    const { loadConfig } = await import("./config.js");
    const { runBrowserAudit } = await import("./browser-audit.js");
    const config = await loadConfig(target || "webgame-qa.config.mjs");
    const report = await runBrowserAudit(config, { output: option("--output") });
    console.log(`Browser audit: ${report.pass ? "PASS" : "FAIL"} (${report.passed}/${report.total})`);
    process.exitCode = report.pass ? 0 : 1;
    return;
  }
  if (command === "secrets") {
    const { scanSecrets } = await import("./secret-scan.js");
    const report = await scanSecrets(target || ".", { output: option("--output") });
    console.log(`Secret scan: ${report.pass ? "PASS" : "FAIL"}; files=${report.filesScanned}; findings=${report.findings.length}`);
    process.exitCode = report.pass ? 0 : 1;
    return;
  }
  if (command === "save") {
    const raw = JSON.parse(await fs.readFile(target || "save.json", "utf8"));
    const { validateSave } = await import("./save-integrity.js");
    const report = validateSave(raw, { version: Number(option("--version") || 1) });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.pass ? 0 : 1;
    return;
  }
  console.error("Usage: webgame-qa <audit CONFIG|secrets DIRECTORY|save FILE> [--output FILE] [--version N]");
  process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
