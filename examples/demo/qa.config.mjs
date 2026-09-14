export default {
  baseUrl: "http://127.0.0.1:4173",
  viewports: [
    { name: "small-mobile", width: 360, height: 640 },
    { name: "tablet", width: 768, height: 900 },
    { name: "desktop", width: 1440, height: 900 }
  ],
  routes: [
    { name: "dashboard", path: "/#dashboard", readySelector: "[data-view='dashboard']" },
    { name: "inventory", path: "/#inventory", readySelector: "[data-view='inventory']" },
    { name: "settings", path: "/#settings", readySelector: "[data-view='settings']" }
  ],
  navigation: [
    { name: "inventory-link", selector: "[data-nav='inventory']", expectedPath: "/#inventory", readySelector: "[data-view='inventory']" },
    { name: "settings-link", selector: "[data-nav='settings']", expectedPath: "/#settings", readySelector: "[data-view='settings']" }
  ],
  cardSelector: "[data-qa-card]",
  outputDir: ".qa-output"
};
