import fs from "node:fs/promises";
import path from "node:path";

const required = ["README.md", "LICENSE", "NOTICE", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "package.json"];
for (const file of required) await fs.access(file);
await fs.rm("dist", { recursive: true, force: true });
await fs.cp("src", path.join("dist", "src"), { recursive: true });
const sourceFiles = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else sourceFiles.push(file.replaceAll("\\", "/"));
  }
}
await walk("src");
await fs.writeFile(path.join("dist", "build-manifest.json"), `${JSON.stringify({ package: "webgame-qa-kit", sourceFiles: sourceFiles.sort() }, null, 2)}\n`, "utf8");
console.log(`Build: PASS (${sourceFiles.length} source files)`);
