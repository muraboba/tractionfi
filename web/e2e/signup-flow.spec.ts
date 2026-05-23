import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Generates a unique throwaway email per test run. Uses example.com (RFC 2606
// reserved) so the Resend verification email bounces rather than landing
// somewhere real.
const ts = Date.now();
const SIGNUP_EMAIL = `tractionfi-e2e-signup-${ts}@example.com`;
const SIGNUP_PASSWORD = "TestPassword12345";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

function execD1(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), "tractionfi-cleanup-"));
    const sqlPath = join(dir, "cleanup.sql");
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

function cleanupSignup(email: string): Promise<void> {
  const e = email.replace(/'/g, "''");
  return execD1(
    `DELETE FROM verification WHERE identifier='${e}';\n` +
    `DELETE FROM user WHERE email='${e}';\n`,
  );
}

test.describe("Signup flow smoke (prod)", () => {
  test.afterAll(async () => {
    await cleanupSignup(SIGNUP_EMAIL);
  });

  test("signup with fresh email → /verify-pending", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();

    await page.locator('input[type="email"]').fill(SIGNUP_EMAIL);
    await page.locator('input[type="password"]').fill(SIGNUP_PASSWORD);

    await Promise.all([
      page.waitForURL(/\/verify-pending/, { timeout: 30_000 }),
      page.getByRole("button", { name: /^sign up$/i }).click(),
    ]);

    expect(page.url()).toContain(`/verify-pending`);
    expect(page.url()).toContain(`email=${encodeURIComponent(SIGNUP_EMAIL)}`);
  });

  // Regression: previously, "Already verified?" on /verify-pending trusted any
  // existing session blindly. A user signed in as one (verified) account who
  // arrived at /verify-pending?email=<other-account> could click the button and
  // be bounced into the verified account's /dashboard, bypassing the
  // unverified-account gate. The check must now require the session email to
  // match the ?email param.
  test("Already verified? does not bypass gate when session belongs to a different email", async ({
    browser,
  }) => {
    test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_EMAIL / E2E_PASSWORD not set in web/.env.local");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Sign in as the verified E2E user → session cookie is now for E2E_EMAIL.
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(E2E_EMAIL!);
    await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30_000 }),
      page.getByRole("button", { name: /log in/i }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 30_000 });

    // Now visit /verify-pending pretending to be checking on a different,
    // unverified account. The carried-over session is for E2E_EMAIL.
    const otherEmail = `tractionfi-e2e-other-${Date.now()}@example.com`;
    await page.goto(`/verify-pending?email=${encodeURIComponent(otherEmail)}`);
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();

    await page.getByRole("button", { name: /already verified\?/i }).click();

    // Expect the "Not verified yet" dialog, NOT a redirect to /dashboard.
    await expect(page.getByRole("heading", { name: /not verified yet/i })).toBeVisible({
      timeout: 5_000,
    });
    expect(page.url()).toContain("/verify-pending");

    await ctx.close();
  });
});
