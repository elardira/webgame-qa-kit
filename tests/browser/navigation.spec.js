import { test, expect } from "@playwright/test";

test("primary navigation exposes each demo view", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-view='dashboard']")).toBeVisible();
  await page.locator("[data-nav='inventory']").click();
  await expect(page).toHaveURL(/#inventory$/);
  await expect(page.locator("[data-view='inventory']")).toBeVisible();
  await page.locator("[data-nav='settings']").click();
  await expect(page).toHaveURL(/#settings$/);
  await expect(page.locator("[data-view='settings']")).toBeVisible();
});

test("save survives reload and malformed local state recovers", async ({ page }) => {
  await page.goto("/#inventory");
  await page.locator("[data-add-item]").click();
  await expect(page.getByText("Ceramic Sample")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Ceramic Sample")).toBeVisible();
  await page.evaluate(() => localStorage.setItem("webgame-qa-kit.demo.save", "{broken"));
  await page.reload();
  await expect(page.getByText("Amber Sample")).toBeVisible();
});
