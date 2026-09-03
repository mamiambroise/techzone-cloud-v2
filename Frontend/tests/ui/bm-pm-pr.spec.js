import { expect, test } from "@playwright/test";

async function login(page) {
  await page.goto("/business-manager");
  await page.getByRole("button", { name: "Ouvrir la session" }).click();
  await expect(page.getByRole("heading", { name: "Définition métier" })).toBeVisible();
}

async function navigate(page, path) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("chaîne UX BM → PM → PR et contrôle visuel", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await login(page);

  const checkpoints = [
    ["/business-manager", "Définition métier", "bm-overview"],
    ["/business-manager/validation", "Validation & Quality", "bm-validation"],
    ["/pack-manager", "Préparation du pack", "pm-overview"],
    ["/pack-manager/validation", "Versions", "pm-validation"],
    ["/pack-manager/manifest", "Versions", "pm-manifest"],
    ["/pack-runtime", "État effectif Runtime", "pr-overview"],
    ["/pack-runtime/effective-manifest", "Effective Manifest", "pr-manifest"],
    ["/pack-runtime/cache", "Cache & résilience", "pr-cache"],
    ["/pack-runtime/diagnostics", "Diagnostics", "pr-diagnostics"],
  ];

  for (const [path, heading, name] of checkpoints) {
    await navigate(page, path);
    await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (["bm-overview", "pm-overview", "pr-overview"].includes(name)) {
      await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
    }
  }

  expect(pageErrors).toEqual([]);
});

test("une action sans API affiche le contrat manquant sans succès simulé", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mot de passe oublié" }).click();
  await expect(page.getByRole("dialog")).toContainText("API pas encore implémentée");
  await expect(page.getByRole("dialog")).toContainText("réinitialiser le mot de passe");
  await expect(page.getByRole("dialog")).not.toContainText("succès");
});
