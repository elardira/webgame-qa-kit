import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { normalizeConfig } from "./config.js";
import { evaluateReleaseGate } from "./release-gate.js";

/** @param {import("playwright").Page} page @param {string} cardSelector */
async function inspectPage(page, cardSelector) {
  return page.evaluate((/** @type {string} */ selector) => {
    const root = document.documentElement;
    const horizontalOverflow = root.scrollWidth > root.clientWidth + 1;
    const cardIssues = [...document.querySelectorAll(selector)].flatMap((element, index) => {
      const rect = element.getBoundingClientRect();
      const outside = rect.left < -1 || rect.right > window.innerWidth + 1;
      return outside ? [{ index, left: Math.round(rect.left), right: Math.round(rect.right), viewportWidth: window.innerWidth }] : [];
    });
    return { horizontalOverflow, cardIssues, title: document.title };
  }, cardSelector);
}

/**
 * Run navigation, console, response, and responsive layout checks.
 * @param {import("./config.js").QaConfig | unknown} input
 * @param {{output?:string}} [options]
 */
export async function runBrowserAudit(input, options = {}) {
  const config = normalizeConfig(input);
  const browser = await chromium.launch(config.browser);
  const checks = [];
  const details = [];
  try {
    for (const viewport of config.viewports) {
      const context = await browser.newContext({ viewport });
      for (const route of config.routes) {
        const page = await context.newPage();
        /** @type {string[]} */
        const pageErrors = [];
        /** @type {{status:number,path:string}[]} */
        const failedResponses = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("response", (response) => {
          const url = new URL(response.url());
          if (url.origin === new URL(config.baseUrl).origin && response.status() >= 400) {
            failedResponses.push({ status: response.status(), path: `${url.pathname}${url.search}` });
          }
        });
        /** @type {{horizontalOverflow:boolean,cardIssues:{index:number,left:number,right:number,viewportWidth:number}[],title:string}} */
        let inspection = { horizontalOverflow: false, cardIssues: [], title: "" };
        let navigationError = "";
        try {
          await page.goto(`${config.baseUrl}${route.path}`, { waitUntil: "networkidle" });
          if (route.readySelector) await page.locator(route.readySelector).waitFor({ state: "visible" });
          inspection = await inspectPage(page, config.cardSelector);
        } catch (error) {
          navigationError = error instanceof Error ? error.message : String(error);
        }
        const pass = !navigationError && pageErrors.length === 0 && failedResponses.length === 0 && !inspection.horizontalOverflow && inspection.cardIssues.length === 0;
        checks.push({ id: `route:${viewport.name}:${route.name}`, pass });
        details.push({ viewport, route, pass, navigationError, pageErrors, failedResponses, ...inspection });
        await page.close();
      }
      for (const navigation of config.navigation) {
        const page = await context.newPage();
        let error = "";
        let actualPath = "";
        try {
          await page.goto(`${config.baseUrl}${navigation.from || "/"}`, { waitUntil: "networkidle" });
          await page.locator(navigation.selector).click();
          if (navigation.readySelector) await page.locator(navigation.readySelector).waitFor({ state: "visible" });
          actualPath = `${new URL(page.url()).pathname}${new URL(page.url()).hash}`;
        } catch (caught) {
          error = caught instanceof Error ? caught.message : String(caught);
        }
        const pass = !error && actualPath === navigation.expectedPath;
        checks.push({ id: `navigation:${viewport.name}:${navigation.name}`, pass });
        details.push({ viewport, navigation, pass, actualPath, error });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const gate = evaluateReleaseGate(checks);
  const report = { generatedAt: new Date().toISOString(), baseUrl: config.baseUrl, ...gate, details };
  const output = options.output || path.join(config.outputDir, "browser-audit.json");
  await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}
