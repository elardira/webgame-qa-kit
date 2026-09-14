import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8" };
const server = http.createServer(async (request, response) => {
  const requested = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  const candidate = path.resolve(root, `.${requested === "/" ? "/index.html" : requested}`);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) { response.writeHead(403); response.end("Forbidden"); return; }
  try {
    const body = await fs.readFile(candidate);
    response.writeHead(200, { "content-type": types[path.extname(candidate)] || "application/octet-stream", "x-content-type-options": "nosniff" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Demo: http://127.0.0.1:${port}`));
