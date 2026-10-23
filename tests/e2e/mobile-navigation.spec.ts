import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:3100";

test("mobile navigation and account menus dismiss and remain usable", async ({ browser }) => {
  const context = await browser.newContext();
  const suffix = randomUUID().replaceAll("-", "");

  try {
    const signUp = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
      data: {
        name: "Mobile Menu Test",
        email: `mobile-menu-${suffix}@example.test`,
        password: `test-${randomUUID()}`,
      },
      headers: { origin: baseURL },
    });
    expect(signUp.status()).toBe(200);

    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/skills");

    const accountToggle = page.getByRole("button", { name: "Open account menu" });
    await expect(accountToggle).toBeVisible();
    await accountToggle.click();
    await expect(page.getByText("My recipes", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("My recipes", { exact: true })).toHaveCount(0);

    await accountToggle.click();
    await page.locator("main").click({ position: { x: 8, y: 8 } });
    await expect(page.getByText("My recipes", { exact: true })).toHaveCount(0);

    const navigationToggle = page.getByRole("button", { name: "Open navigation menu" });
    await navigationToggle.click();
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(navigation).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toHaveCount(0);

    await navigationToggle.click();
    await navigation.getByRole("link", { name: "Publish", exact: true }).click();
    await expect(page).toHaveURL(/\/publish$/);
    await expect(navigation).toHaveCount(0);

    const anonymous = await browser.newContext();
    try {
      const publicPage = await anonymous.newPage();
      await publicPage.setViewportSize({ width: 390, height: 844 });
      await publicPage.goto("/publish");
      await expect(publicPage.getByRole("heading", { name: "Create an account or sign in" })).toBeVisible();
      await expect(publicPage.locator('input[type="file"]')).toHaveCount(0);
    } finally {
      await anonymous.close();
    }
  } finally {
    await context.close();
  }
});
