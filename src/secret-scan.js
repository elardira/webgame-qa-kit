import fs from "node:fs/promises";
import path from "node:path";

const SKIP_DIRECTORIES = new Set([".git", "node_modules", "dist", ".qa-output", "playwright-report", "test-results"]);
const TEXT_EXTENSIONS = new Set([".cjs", ".css", ".env", ".example", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".toml", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
/** @type {[string, RegExp][]} */
const DETECTORS = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["supabase-secret", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g],
  ["json-web-token", /\beyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g],
  ["openai-key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["github-token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ["sentry-auth-token", /\bsntrys_[A-Za-z0-9_-]{20,}\b/g],
  ["resend-key", /\bre_[A-Za-z0-9_-]{20,}\b/g],
  ["named-secret-assignment", /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|SENTRY_AUTH_TOKEN|RESEND_API_KEY|OPENAI_API_KEY|GITHUB_TOKEN)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/gi]
];

/** @param {string} root @param {string} [current] @param {string[]} [output] @returns {Promise<string[]>} */
async function collectFiles(root, current = root, output = []) {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) await collectFiles(root, absolute, output);
    else if (entry.isFile() && (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) || entry.name === ".env" || entry.name.startsWith(".env.") || entry.name === "LICENSE" || entry.name === "NOTICE")) output.push(absolute);
  }
  return output;
}

/** @param {string} line */
function isExplicitFixture(line) {
  return /TEST_ONLY_SYNTHETIC|EXAMPLE_ONLY_PLACEHOLDER/.test(line);
}

/** @param {string} root @param {{output?:string,allowMarkedFixtures?:boolean}} [options] */
export async function scanSecrets(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const files = await collectFiles(absoluteRoot);
  /** @type {{path:string,line:number,detector:string,message:string}[]} */
  const findings = [];
  for (const file of files) {
    const contents = await fs.readFile(file, "utf8");
    const lines = contents.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (options.allowMarkedFixtures !== false && isExplicitFixture(line)) return;
      for (const [detector, pattern] of DETECTORS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) findings.push({ path: path.relative(absoluteRoot, file).replaceAll("\\", "/"), line: index + 1, detector, message: "SECRET DETECTED — REDACTED" });
      }
    });
  }
  const report = { generatedAt: new Date().toISOString(), pass: findings.length === 0, filesScanned: files.length, findings };
  if (options.output) {
    const output = path.resolve(options.output);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  return report;
}
