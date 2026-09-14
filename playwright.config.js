import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "node examples/demo/server.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }]
});
