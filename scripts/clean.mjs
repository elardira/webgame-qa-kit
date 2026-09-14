import fs from "node:fs/promises";

await Promise.all(["dist", ".qa-output", "playwright-report", "test-results"].map((directory) => fs.rm(directory, { recursive: true, force: true })));
