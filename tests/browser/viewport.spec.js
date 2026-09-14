import { test, expect } from "@playwright/test";

for (const viewport of [{ name: "mobile", width: 360, height: 640 }, { name: "tablet", width: 768, height: 900 }, { name: "desktop", width: 1440, height: 900 }]) {
  test(`${viewport.name} has no horizontal overflow or clipped cards`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#dashboard");
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      cards: [...document.querySelectorAll("[data-qa-card]")].map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      })
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    for (const card of layout.cards) {
      expect(card.left).toBeGreaterThanOrEqual(-1);
      expect(card.right).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
}
