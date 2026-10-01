const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const { chromium } = require(
  root + "/logs/browser-tools/node_modules/playwright",
);
const fixtures = JSON.parse(
  fs.readFileSync(
    path.join(process.env.TEMP, "consolidation-fixtures.json"),
    "utf8",
  ),
);
const ids = JSON.parse(
  fs.readFileSync(
    path.join(process.env.TEMP, "consolidation-ids.json"),
    "utf8",
  ),
);
const result = {
  checks: [],
  routes: [],
  responsive: [],
  errors: [],
  moduleResponses: [],
};
const output = root + "/docs/dashboard-navigation";
fs.mkdirSync(output + "/screenshots", { recursive: true });
const unwrap = (body) => body.data ?? body;
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => result.errors.push(e.message));
    async function login(p, fixture) {
      if (fixture.tenantId)
        await p.addInitScript(
          (id) => localStorage.setItem("techzone_active_tenant", id),
          fixture.tenantId,
        );
      await p.goto("http://localhost:3000/login");
      await p.locator("#identifier").fill(fixture.username);
      await p.locator("#password").fill(fixture.password);
      await p.locator("button[type=submit]").click();
      await p.waitForURL("**/dashboard");
    }
    await login(page, fixtures[0]);
    await page.getByTestId("platform-dashboard").waitFor();
    await page.waitForFunction(
      () => !document.querySelector("main [role=status]"),
    );
    const get = async (ctx, url) => {
      const r = await ctx.request.get("http://localhost:3000/api" + url);
      assert.equal(r.status(), 200, url);
      return unwrap(await r.json());
    };
    const dataA = await get(context, "/platform/dashboard"),
      appsA = await get(context, "/business-manager/applications"),
      packsA = await get(context, "/pack-manager/packs");
    assert.equal(dataA.widgets.applications.data, appsA.length);
    assert.equal(
      dataA.widgets.packs.data,
      packsA.filter((p) => !p.archivedAt).length,
    );
    assert.equal(dataA.widgets.connectors.state, "UNAVAILABLE");
    assert.equal(dataA.widgets.dataSources.state, "UNAVAILABLE");
    assert.ok(dataA.widgets.recentPacks.data.length);
    assert.equal(dataA.widgets.activity.state, "LOADED");
    result.checks.push("REAL_KPI_AND_ACTIVITY");
    await page.keyboard.press("Control+k");
    const searchInput = page.getByRole("searchbox", { name: "Recherche globale" });
    assert.equal(await searchInput.evaluate(n => n === document.activeElement), true);
    await searchInput.fill(dataA.widgets.recentPacks.data[0].name);
    const searchResults = page.locator('[id="' + await searchInput.getAttribute('aria-controls') + '"]');
    await searchResults.locator('a[href*="' + dataA.widgets.recentPacks.data[0].id + '"]').waitFor();
    await page.keyboard.press("Escape");
    result.checks.push("GLOBAL_SEARCH_REAL_RESULTS_KEYBOARD");
    await page.screenshot({
      path: output + "/screenshots/dashboard-desktop.png",
      fullPage: true,
    });
    // A separate real session has a different tenant and no access to A resources.
    const contextB = await browser.newContext(),
      pageB = await contextB.newPage();
    await login(pageB, fixtures[1]);
    const dataB = await get(contextB, "/platform/dashboard"),
      appsB = await get(contextB, "/business-manager/applications");
    assert.notEqual(dataB.tenantId, dataA.tenantId);
    assert.equal(dataB.widgets.applications.data, appsB.length);
    for (const row of dataA.widgets.recentPacks.data)
      assert.ok(!JSON.stringify(dataB).includes(row.id));
    assert.equal(dataB.widgets.recentPacks.state, "EMPTY");
    result.checks.push("TENANT_A_B_ISOLATION_EMPTY");
    const searchB = await get(
      contextB,
      "/platform/search?q=" + encodeURIComponent(dataA.widgets.recentPacks.data[0].name),
    );
    assert.equal(searchB.groups.packs.data.length, 0);
    result.checks.push("SEARCH_TENANT_ISOLATION");
    const meA = await get(context, "/iam/auth/me");
    assert.ok(meA.user.permissions.includes("pack.read"));
    // Add membership only between dedicated QA fixtures to exercise a real tenant switch.
    const member = await context.request.post(
      "http://localhost:3000/api/iam/admin/tenants/" +
        dataB.tenantId +
        "/memberships",
      { data: { userId: meA.user.id, status: "ACTIVE" } },
    );
    assert.ok([201, 200, 409].includes(member.status()));
    await page.reload();
    await page.getByTestId("platform-dashboard").waitFor();
    await page
      .getByLabel("Tenant actif", { exact: true })
      .selectOption(dataB.tenantId);
    await page
      .getByText("Aucun pack pour le moment.", { exact: true })
      .waitFor();
    assert.equal(
      (await get(context, "/platform/dashboard")).tenantId,
      dataB.tenantId,
    );
    await page
      .getByLabel("Tenant actif", { exact: true })
      .selectOption(dataA.tenantId);
    await page
      .locator("main [data-widget=packs]")
      .getByText(String(dataA.widgets.packs.data), { exact: true })
      .waitFor();
    result.checks.push("REAL_TENANT_SWITCH_NO_STALE_WIDGETS");
    // Accordion parent does not navigate; route and child remain authoritative.
    const sidebar = page.locator("#main-sidebar");
    await sidebar
      .getByRole("button", { name: "Pack Manager", exact: true })
      .click();
    assert.equal(new URL(page.url()).pathname, "/dashboard");
    await sidebar
      .locator("[data-navigation-group=packs]")
      .getByRole("link", { name: "Packs", exact: true })
      .click();
    await page.waitForURL("**/packs/packs");
    await sidebar
      .locator("[data-navigation-group=packs] [aria-current=page]")
      .filter({ hasText: "Packs" })
      .waitFor();
    result.checks.push("ACCORDION_AND_ACTIVE_CHILD");
    await page.goto(
      "http://localhost:3000/business-manager/applications/" +
        ids.app.id +
        "/versions/" +
        ids.version.id +
        "/validation",
    );
    await page.locator("main h1").waitFor();
    await sidebar
      .locator("[data-navigation-group=bm] [aria-current=page]")
      .filter({ hasText: "Validation" })
      .waitFor();
    result.checks.push("DIRECT_DEEP_LINK");
    await page.goto("http://localhost:3000/dashboard");
    await page.getByTestId("platform-dashboard").waitFor();
    await page.getByRole("button", { name: "Réduire le menu" }).click();
    await sidebar
      .getByRole("button", { name: "Pack Manager", exact: true })
      .focus();
    await page
      .getByRole("tooltip")
      .getByText("Pack Manager", { exact: true })
      .waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Agrandir le menu" }).waitFor();
    result.checks.push("COLLAPSED_PERSISTENCE_AND_FOCUS_TOOLTIP");
    await page.getByRole("button", { name: "Agrandir le menu" }).click();
    const routes = [
      "/business-manager",
      "/ui/pages",
      "/automation",
      "/packs",
      "/runtime",
      "/data-runtime",
      "/erp",
      "/registry",
      "/dashboard",
    ];
    page.on("response", (r) => {
      if (r.status() >= 400 && new URL(r.url()).pathname.startsWith("/api/"))
        result.moduleResponses.push({
          path: new URL(r.url()).pathname,
          status: r.status(),
        });
    });
    for (const route of routes) {
      await page.goto("http://localhost:3000" + route);
      if (route === "/erp")
        await page
          .locator("main")
          .getByText(/indisponible|unavailable|ERP/i)
          .first()
          .waitFor();
      else await page.locator("main h1").waitFor();
      assert.equal(new URL(page.url()).pathname, route);
      result.routes.push(route);
    }
    await page.getByRole("link", { name: "Nouveau pack", exact: true }).click();
    await page
      .getByRole("button", { name: "Enregistrer", exact: true })
      .waitFor();
    result.checks.push("QUICK_CREATE_PACK_EDITOR");
    await page.goto("http://localhost:3000/dashboard");
    await page.getByTestId("platform-dashboard").waitFor();
    for (const width of [1920, 1440, 1280, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(250);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      result.responsive.push(width);
      if (width === 390)
        await page.screenshot({
          path: output + "/screenshots/dashboard-mobile.png",
          fullPage: true,
        });
    }
    const hamburger = page.getByRole("button", {
      name: "Ouvrir le menu",
      exact: true,
    });
    await hamburger.click();
    await page.getByRole("dialog", { name: "Navigation principale" }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.getElementById("workspace-content").inert,
      ),
      true,
    );
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await page.evaluate(() =>
        document
          .getElementById("main-sidebar")
          .contains(document.activeElement),
      ),
      true,
    );
    await page.screenshot({
      path: output + "/screenshots/sidebar-mobile.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    assert.equal(
      await hamburger.evaluate((n) => n === document.activeElement),
      true,
    );
    await hamburger.click();
    await sidebar
      .getByRole("link", { name: "Tableau de bord", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    result.checks.push("MOBILE_DRAWER_FOCUS_ESCAPE_NAVIGATION");
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Inject a transport failure, not substitute successful business data.
    await page.route("**/api/platform/dashboard*", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unavailable" }),
      }),
    );
    await page.getByRole("button", { name: "Actualiser", exact: true }).click();
    await page
      .getByText("Impossible de charger le tableau de bord.", { exact: false })
      .waitFor();
    await page.getByRole("heading", { name: "Vos modules" }).waitFor();
    await page.unroute("**/api/platform/dashboard*");
    await page.getByRole("button", { name: "Actualiser", exact: true }).click();
    await page
      .locator("main [data-widget=applications]")
      .getByText(String(appsA.length), { exact: true })
      .waitFor();
    result.checks.push("ERROR_RECOVERY_MODULE_NAVIGATION_REMAINS");
    // Delay a real response and fail just one projection to verify independent widgets.
    await page.route("**/api/platform/dashboard*", async route => {
      const response = await route.fetch();
      const payload = await response.json();
      unwrap(payload).widgets.packs = { state: "ERROR", data: null, code: "SOURCE_UNAVAILABLE" };
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.fulfill({ response, json: payload });
    });
    await page.getByRole("button", { name: "Actualiser", exact: true }).click();
    await page.locator('main [data-widget=packs] [role=status]').waitFor();
    await page.locator('main [data-widget=packs]').getByRole('button', { name: 'Réessayer' }).waitFor();
    await page.locator('main [data-widget=applications]').getByText(String(appsA.length), { exact: true }).waitFor();
    await page.unroute("**/api/platform/dashboard*");
    await page.locator('main [data-widget=packs]').getByRole('button', { name: 'Réessayer' }).click();
    await page.locator('main [data-widget=packs]').getByText(String(dataA.widgets.packs.data), { exact: true }).waitFor();
    result.checks.push("SKELETON_PARTIAL_FAILURE_SELECTIVE_RETRY");
    const ordinary = JSON.parse(
      fs.readFileSync(
        path.join(
          process.env.LOCALAPPDATA,
          "TechzoneRecipe",
          "test-login.json",
        ),
        "utf8",
      ),
    );
    const userContext = await browser.newContext(),
      userPage = await userContext.newPage();
    await login(userPage, ordinary);
    await userPage.getByTestId("platform-dashboard").waitFor();
    assert.equal(
      await userPage.locator("[data-navigation-group=packs]").count(),
      0,
    );
    const userData = await get(userContext, "/platform/dashboard");
    assert.equal(userData.widgets.packs.state, "FORBIDDEN");
    await userPage.goto("http://localhost:3000/packs");
    await userPage.getByRole("heading", { name: "Accès interdit" }).waitFor();
    result.checks.push("ORDINARY_USER_HIDDEN_AND_DIRECT_403");
    assert.deepEqual(result.errors, []);
    result.pass = true;
  } catch (e) {
    result.pass = false;
    result.failure = e.message;
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      output + "/browser-acceptance.json",
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
    await browser.close();
  }
})();
