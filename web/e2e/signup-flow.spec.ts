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
});
