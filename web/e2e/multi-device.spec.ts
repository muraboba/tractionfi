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

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 30_000 }),
    page.getByRole("button", { name: /log in/i }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });
}

test.describe("Multi-device persistence (prod)", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_EMAIL / E2E_PASSWORD not set in web/.env.local");

  test.beforeAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test.afterAll(async () => {
    await wipeUserState(E2E_EMAIL!);
  });

  test("log out, log in from a fresh context, see same data", async ({ browser }) => {
    // ── Device A: sign in, seed paycheck data, then log out ─────────────────
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signIn(pageA);

    const expectPutOk = async (action: () => Promise<void>) => {
      const respPromise = pageA.waitForResponse(
        (r) => r.url().includes("/api/user_state") && r.request().method() === "PUT",
        { timeout: 15_000 },
      );
      await action();
      const resp = await respPromise;
      expect(resp.status(), `PUT /api/user_state should be 200 (got ${resp.status()})`).toBe(200);
    };

    await pageA.getByRole("tab", { name: "Paycheck" }).click();
    await expectPutOk(async () => {
      await pageA.locator("#paycheck-gross").fill("4200");
    });
    await expectPutOk(async () => {
      await pageA.locator("#paycheck-net").fill("3100");
    });
    await expectPutOk(async () => {
      await pageA.locator("#paycheck-frequency").selectOption("biweekly");
    });

    // Sidebar should reflect 4200 gross × 26 = $109,200 annual.
    await expect(
      pageA.getByText("Annual gross", { exact: true }).locator("xpath=following-sibling::p[1]"),
    ).toHaveText("$109,200");

    // Log out — clears the auth cookie for this context.
    await pageA.getByRole("button", { name: /log out/i }).click();
    await pageA.waitForURL("**/login", { timeout: 15_000 });
    await ctxA.close();

    // ── Device B: brand-new context (no cookies), sign in, see same data ───
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signIn(pageB);

    await pageB.getByRole("tab", { name: "Paycheck" }).click();
    await expect(pageB.locator("#paycheck-gross")).toHaveValue("4200");
    await expect(pageB.locator("#paycheck-net")).toHaveValue("3100");
    await expect(pageB.locator("#paycheck-frequency")).toHaveValue("biweekly");
    await expect(
      pageB.getByText("Annual gross", { exact: true }).locator("xpath=following-sibling::p[1]"),
    ).toHaveText("$109,200");

    await ctxB.close();
  });
});
