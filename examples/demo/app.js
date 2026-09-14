const STORAGE_KEY = "webgame-qa-kit.demo.save";
const defaultSave = Object.freeze({
  version: 2,
  player: { name: "Demo Pilot" },
  resources: { energy: 12, credits: 240 },
  inventory: [{ id: "sample-amber", name: "Amber Sample", quantity: 1 }]
});

function validSave(value) {
  return Boolean(value) && typeof value === "object" && value.version === 2 && value.resources && Number.isFinite(value.resources.energy) && Number.isFinite(value.resources.credits) && Array.isArray(value.inventory);
}

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return validSave(parsed) ? parsed : structuredClone(defaultSave);
  } catch {
    return structuredClone(defaultSave);
  }
}

let save = loadSave();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }
function route() {
  const requested = location.hash.slice(1);
  return ["dashboard", "inventory", "settings"].includes(requested) ? requested : "dashboard";
}

function render() {
  const view = route();
  const main = document.querySelector("#app");
  const template = document.querySelector(`#${view}-template`);
  main.replaceChildren(template.content.cloneNode(true));
  document.querySelectorAll("[data-nav]").forEach((link) => link.setAttribute("aria-current", link.dataset.nav === view ? "page" : "false"));
  if (view === "dashboard") {
    document.querySelector("[data-energy]").textContent = String(save.resources.energy);
    document.querySelector("[data-credits]").textContent = String(save.resources.credits);
    document.querySelector("[data-artifacts]").textContent = String(save.inventory.reduce((sum, item) => sum + item.quantity, 0));
  }
  if (view === "inventory") {
    const inventory = document.querySelector("[data-inventory]");
    for (const item of save.inventory) {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.qaCard = "";
      card.innerHTML = `<span>Sample</span><strong></strong><p></p>`;
      card.querySelector("strong").textContent = item.name;
      card.querySelector("p").textContent = `Quantity: ${item.quantity}`;
      inventory.append(card);
    }
    document.querySelector("[data-add-item]").addEventListener("click", () => {
      const existing = save.inventory.find((item) => item.id === "sample-ceramic");
      if (existing) existing.quantity += 1;
      else save.inventory.push({ id: "sample-ceramic", name: "Ceramic Sample", quantity: 1 });
      persist();
      render();
    });
  }
  if (view === "settings") {
    document.querySelector("[data-reset-save]").addEventListener("click", () => {
      save = structuredClone(defaultSave);
      persist();
      document.querySelector("[data-save-status]").textContent = "Synthetic save reset.";
    });
  }
  main.focus();
}

window.addEventListener("hashchange", render);
if (!location.hash) history.replaceState(null, "", "#dashboard");
persist();
render();
