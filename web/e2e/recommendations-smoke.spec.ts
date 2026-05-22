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

test.describe("RecommendationsTab v2 smoke (prod)", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_EMAIL / E2E_PASSWORD not set in web/.env.local");

  test.beforeAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test.afterAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test("9-point checklist: blocked → active → re-block → unblock → skip → revisit", async ({ page }) => {
    const expectPutOk = async (action: () => Promise<void>) => {
      const respPromise = page.waitForResponse(
        (r) => r.url().includes("/api/user_state") && r.request().method() === "PUT",
        { timeout: 15_000 },
      );
      await action();
      const resp = await respPromise;
      expect(resp.status(), `PUT /api/user_state should be 200 (got ${resp.status()})`).toBe(200);
    };

    // ── Sign in ──────────────────────────────────────────────────────────────
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(E2E_EMAIL!);
    await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30_000 }),
      page.getByRole("button", { name: /log in/i }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

    // ── STEP 1: Recommendations is default tab, BlockedView with 2 blockers ─
    await expect(
      page.getByRole("tab", { name: /Recommendations/i }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: /Set up your budget to start/i }),
    ).toBeVisible();
    await expect(page.getByText(/Add your paycheck/i)).toBeVisible();
    await expect(page.getByText(/Add at least your essential monthly expenses/i)).toBeVisible();
    await expect(page.getByText(/Mark which cash asset/i)).toHaveCount(0);

    // ── STEP 2: Header pill reads "Setup: 2 left" ───────────────────────────
    await expect(
      page.locator('a[href="#tab-recommendations"]', { hasText: /Setup: 2 left/ }),
    ).toBeVisible();

    // ── STEP 3: "Go to Paycheck →" flips the main tab bar ───────────────────
    await page.getByRole("button", { name: /Go to Paycheck/i }).click();
    await expect(
      page.getByRole("tab", { name: "Paycheck" }),
    ).toHaveAttribute("aria-selected", "true");

    // ── STEP 4: Fill paycheck → no_income blocker clears, "Setup: 1 left" ──
    await expectPutOk(async () => {
      await page.locator("#paycheck-gross").fill("3000");
    });
    await expectPutOk(async () => {
      await page.locator("#paycheck-net").fill("2300");
    });
    await expectPutOk(async () => {
      await page.locator("#paycheck-frequency").selectOption("biweekly");
    });
    await page.getByRole("tab", { name: /Recommendations/i }).click();
    await expect(page.getByText(/Add your paycheck/i)).toHaveCount(0);
    await expect(page.getByText(/Add at least your essential monthly expenses/i)).toBeVisible();
    await expect(
      page.locator('a[href="#tab-recommendations"]', { hasText: /Setup: 1 left/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Set up your budget to start/i }),
    ).toBeVisible();

    // ── STEP 5: Add expense → flips to ActiveView on the cream priority surface
    await page.getByRole("tab", { name: "Expenses" }).click();
    await page.getByRole("button", { name: /Add expense/i }).click();
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
    await page.getByRole("tab", { name: /Recommendations/i }).click();
    await expect(page.getByText(/Your next step/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
    await expect(
      page.locator('a[href="#tab-recommendations"]', { hasText: /Setup:/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Set up your budget to start/i }),
    ).toHaveCount(0);

    // ── STEP 6: Add cash asset (no EF tick) → re-blocks on no_ef_designation
    await page.getByRole("tab", { name: "Assets" }).click();
    await page.getByRole("button", { name: /Add asset/i }).click();
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
    await page.getByRole("tab", { name: /Recommendations/i }).click();
    await expect(page.getByText(/Mark which cash asset is your emergency fund/i)).toBeVisible();
    await expect(
      page.locator('a[href="#tab-recommendations"]', { hasText: /Setup: 1 left/ }),
    ).toBeVisible();

    // ── STEP 7: Tick isEmergencyFund → unblocks; active milestone returns ──
    await page.getByRole("tab", { name: "Assets" }).click();
    await expectPutOk(async () => {
      await assetRow.getByRole("checkbox", { name: /part of my emergency fund/i }).click();
    });
    await page.getByRole("tab", { name: /Recommendations/i }).click();
    await expect(page.getByText(/Your next step/i)).toBeVisible();
    await expect(page.getByText(/Mark which cash asset/i)).toHaveCount(0);

    // ── STEP 8: Skip current priority → Revisit ─────────────────────────────
    const prioritySection = page.locator("section").filter({ hasText: "Your next step" });
    const originalTitle = (await prioritySection.locator("h2").first().textContent())?.trim();
    if (!originalTitle) throw new Error("Could not capture current-priority title");

    await expectPutOk(async () => {
      page.once("dialog", (d) => d.accept());
      await prioritySection.getByRole("button", { name: "Skip" }).click();
    });

    // Skipped row in Roadmap should now carry the ⤼ glyph + Revisit button.
    const roadmapSection = page.locator("section").filter({ hasText: "Roadmap" });
    const skippedRow = roadmapSection.locator("li", { hasText: originalTitle });
    await expect(skippedRow.locator('[aria-label="skipped"]')).toBeVisible();
    await expect(skippedRow.getByRole("button", { name: "Revisit" })).toBeVisible();

    // Click Revisit → the milestone returns as the current priority.
    await expectPutOk(async () => {
      await skippedRow.getByRole("button", { name: "Revisit" }).click();
    });
    await expect(
      page.locator("section").filter({ hasText: "Your next step" }).locator("h2").first(),
    ).toHaveText(originalTitle);
  });
});
