import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "scripts", "tests", "examples"];
const files = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) files.push(file);
  }
}
for (const root of roots) await walk(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax check: PASS (${files.length} files)`);
