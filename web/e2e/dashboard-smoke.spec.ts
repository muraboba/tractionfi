import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

function wipeUserState(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), "tractionfi-wipe-"));
    const sqlPath = join(dir, "wipe.sql");
    const sql = `DELETE FROM user_state WHERE user_id IN (SELECT id FROM user WHERE email='${email.replace(/'/g, "''")}');\n`;
    writeFileSync(sqlPath, sql, "utf8");
    const cp = spawn(
      "npx",
      ["wrangler", "d1", "execute", "tractionfi", "--remote", "--file", sqlPath, "-y"],
      { stdio: "inherit", shell: true },
    );
    cp.on("exit", (code) => {
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
      code === 0 ? resolve() : reject(new Error(`wrangler exit ${code}`));
    });
    cp.on("error", reject);
  });
}

test.describe("dashboard smoke (prod)", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_EMAIL / E2E_PASSWORD not set in web/.env.local");

  test.beforeAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test.afterAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(E2E_EMAIL!);
    await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30_000 }),
      page.getByRole("button", { name: /log in/i }).click(),
    ]);
    // Wait for the engine state hook to finish loading (the "Loading…" state)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
  });

  test("walks all 5 tabs, autosaves, clears EF blocker, resolves 409", async ({ page }) => {
    // Helper: assert next PUT /api/user_state is a 200.
    const expectPutOk = async (action: () => Promise<void>) => {
      const respPromise = page.waitForResponse(
        (r) =>
          r.url().includes("/api/user_state") &&
          r.request().method() === "PUT",
        { timeout: 15_000 },
      );
      await action();
      const resp = await respPromise;
      expect(resp.status(), `PUT /api/user_state should be 200 (got ${resp.status()})`).toBe(200);
    };

    // ─── PAYCHECK TAB ─────────────────────────────────────────────────────
    await page.getByRole("tab", { name: "Paycheck" }).click();

    await expectPutOk(async () => {
      await page.locator("#paycheck-gross").fill("3000");
    });
    await expectPutOk(async () => {
      await page.locator("#paycheck-net").fill("2300");
    });
    await expectPutOk(async () => {
      await page.locator("#paycheck-frequency").selectOption("biweekly");
    });
    await expectPutOk(async () => {
      await page
        .getByRole("checkbox", { name: /employer offers a 401\(k\) match/i })
        .click();
    });
    await expect(page.locator("#paycheck-match-pct")).toBeVisible();
    await expectPutOk(async () => {
      await page.locator("#paycheck-match-pct").fill("5");
    });

    // Summary sidebar: 3000 gross * 26 biweekly = $78,000 annual.
    await expect(page.getByText("Annual gross", { exact: true }).locator("..")).toContainText("$78,000");

    // ─── INCOMES TAB ──────────────────────────────────────────────────────
    await page.getByRole("tab", { name: "Incomes" }).click();
    await page.getByRole("button", { name: /add income source/i }).click();
    const incomeRow = page.locator('li:has(input[id^="income-name-"])').first();
    await expectPutOk(async () => {
      await incomeRow.locator('input[id^="income-name-"]').fill("Freelance");
    });
    await expectPutOk(async () => {
      await incomeRow.locator('input[id^="income-amount-"]').fill("500");
    });
    await expectPutOk(async () => {
      await incomeRow.locator('select[id^="income-freq-"]').selectOption("monthly");
    });

    // ─── EXPENSES TAB ─────────────────────────────────────────────────────
    await page.getByRole("tab", { name: "Expenses" }).click();
    await page.getByRole("button", { name: /add expense/i }).click();
    const expenseRow = page.locator('li:has(input[id^="expense-name-"])').first();
    await expectPutOk(async () => {
      await expenseRow.locator('input[id^="expense-name-"]').fill("Rent");
    });
    await expectPutOk(async () => {
      await expenseRow.locator('input[id^="expense-amount-"]').fill("1800");
    });
    await expectPutOk(async () => {
      await expenseRow.locator('select[id^="expense-freq-"]').selectOption("monthly");
    });
    await expectPutOk(async () => {
      await expenseRow.locator('select[id^="expense-cat-"]').selectOption("essential");
    });
    await expect(page.getByText("Monthly expenses", { exact: true }).locator("..")).toContainText("$1,800");

    // ─── ASSETS TAB ───────────────────────────────────────────────────────
    await page.getByRole("tab", { name: "Assets" }).click();
    await page.getByRole("button", { name: /add asset/i }).click();
    const assetRow = page.locator('li:has(input[id^="asset-name-"])').first();
    await expectPutOk(async () => {
      await assetRow.locator('input[id^="asset-name-"]').fill("Chase savings");
    });
    await expectPutOk(async () => {
      await assetRow.locator('input[id^="asset-value-"]').fill("5000");
    });
    await expectPutOk(async () => {
      await assetRow.locator('select[id^="asset-cat-"]').selectOption("cash");
    });

    // Adding a cash asset without marking EF should trigger `no_ef_designation` blocker.
    const setupBadge = page.locator('a[href="#tab-recommendations"]', { hasText: /Setup:/ });
    await expect(setupBadge).toBeVisible({ timeout: 5_000 });
    const beforeText = await setupBadge.textContent();
    expect(beforeText, "Setup badge should show blocker count").toMatch(/Setup: \d+ left/);

    // Verify the EF blocker specifically is listed on the Recommendations tab.
    await page.getByRole("tab", { name: /Recommendations/ }).click();
    await expect(page.getByText(/Mark which cash asset is your emergency fund/i)).toBeVisible();

    // Back to assets, tick the isEmergencyFund checkbox.
    await page.getByRole("tab", { name: "Assets" }).click();
    await expectPutOk(async () => {
      await assetRow
        .getByRole("checkbox", { name: /part of my emergency fund/i })
        .click();
    });

    // Blocker should clear: the specific message goes away on Recommendations tab.
    await page.getByRole("tab", { name: /Recommendations/ }).click();
    await expect(page.getByText(/Mark which cash asset is your emergency fund/i)).toHaveCount(0);

    // Emergency fund balance in sidebar should now reflect the $5,000.
    await expect(page.getByText("Emergency fund", { exact: true }).locator("..")).toContainText("$5,000");

    // ─── DEBTS TAB ────────────────────────────────────────────────────────
    await page.getByRole("tab", { name: "Debts" }).click();
    await page.getByRole("button", { name: /add debt/i }).click();
    const debtRow = page.locator('li:has(input[id^="debt-name-"])').first();
    await expectPutOk(async () => {
      await debtRow.locator('input[id^="debt-name-"]').fill("Chase Sapphire");
    });
    await expectPutOk(async () => {
      await debtRow.locator('input[id^="debt-balance-"]').fill("2500");
    });
    await expectPutOk(async () => {
      await debtRow.locator('input[id^="debt-apr-"]').fill("22");
    });
    await expectPutOk(async () => {
      await debtRow.locator('input[id^="debt-min-"]').fill("50");
    });
    await expectPutOk(async () => {
      await debtRow.locator('select[id^="debt-cat-"]').selectOption("credit-card");
    });

    // ─── 409 CONFLICT (mocked via route interception) ─────────────────────
    // Intercept the NEXT PUT /api/user_state and return a synthetic 409.
    // We mock TWO PUTs:
    //   1st PUT → 409 with synthetic { current.version = sentVersion + 7 }.
    //   2nd PUT (from "Keep mine", carrying the synthetic version) → 200 with
    //      version = synthetic + 1. After that the route falls through to real
    //      server. (Real server still holds an old version, so we leave the
    //      route in place — no further PUTs fire after this in the test.)
    let putCount = 0;
    await page.route("**/api/user_state", async (route) => {
      const req = route.request();
      if (req.method() !== "PUT") {
        await route.fallback();
        return;
      }
      putCount++;
      const body = JSON.parse(req.postData() ?? "{}") as { blob: unknown; version: number };
      if (putCount === 1) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "conflict",
            current: { blob: body.blob, version: (body.version ?? 0) + 7 },
          }),
        });
        return;
      }
      // 2nd+ PUT: pretend the save succeeded so the ConflictBanner clears.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: (body.version ?? 0) + 1 }),
      });
    });

    // Trigger any edit to fire a PUT that we will intercept as 409.
    await page.getByRole("tab", { name: "Paycheck" }).click();
    await page.locator("#paycheck-gross").fill("3100");

    // ConflictBanner should appear.
    const conflictBanner = page.getByRole("alert").filter({ hasText: /updated in another tab/i });
    await expect(conflictBanner).toBeVisible({ timeout: 10_000 });

    // Click "Keep mine" — this re-PUTs at the conflict version; route mock returns 200.
    await expectPutOk(async () => {
      await conflictBanner.getByRole("button", { name: /keep mine/i }).click();
    });

    // Banner should disappear.
    await expect(conflictBanner).toHaveCount(0, { timeout: 5_000 });

    await page.unroute("**/api/user_state");
  });
});
