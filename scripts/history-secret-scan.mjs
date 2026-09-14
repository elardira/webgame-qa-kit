import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const patterns = [
  ["private-key", "BEGIN [A-Z ]*PRIVATE KEY"],
  ["supabase-secret", "sb_secret_[A-Za-z0-9_-]{20,}"],
  ["json-web-token", "eyJ[A-Za-z0-9_-]{12,}\\.eyJ[A-Za-z0-9_-]{12,}\\.[A-Za-z0-9_-]{12,}"],
  ["provider-token", "(sk-(proj-)?|ghp_|github_pat_|sntrys_|re_)[A-Za-z0-9_-]{20,}"]
];
const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
const findings = [];
let checkedCommits = 0;
if (inside.status === 0) {
  const revisionResult = spawnSync("git", ["rev-list", "--all"], { encoding: "utf8" });
  const commits = revisionResult.status === 0 ? revisionResult.stdout.trim().split(/\r?\n/).filter(Boolean) : [];
  checkedCommits = commits.length;
  for (const commit of commits) {
    for (const [detector, pattern] of patterns) {
      const result = spawnSync("git", ["grep", "-I", "-l", "-E", pattern, commit, "--", ".", ":(exclude)package-lock.json"], { encoding: "utf8" });
      if (result.status === 0) {
        for (const match of result.stdout.trim().split(/\r?\n/).filter(Boolean)) {
          const separator = match.indexOf(":");
          findings.push({ commit: commit.slice(0, 12), path: separator >= 0 ? match.slice(separator + 1) : match, detector, message: "SECRET DETECTED — REDACTED" });
        }
      }
    }
  }
}
const report = { generatedAt: new Date().toISOString(), pass: findings.length === 0, historyAvailable: inside.status === 0, checkedCommits, findings };
await fs.mkdir(".qa-output", { recursive: true });
await fs.writeFile(".qa-output/history-secret-scan.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`History secret scan: ${report.pass ? "PASS" : "FAIL"}; commits=${checkedCommits}; findings=${findings.length}`);
if (!report.pass) process.exitCode = 1;
