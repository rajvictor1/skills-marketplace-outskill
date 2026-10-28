import { expect, test } from "@playwright/test";

test("mobile navigation, theme toggle, and join CTA remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const join = page.getByRole("link", { name: "Join", exact: true });
  await expect(join).toBeVisible();
  await expect(join).toHaveAttribute("href", "/auth/sign-up");

  const themeToggle = page.getByRole("button", { name: /Switch to (light|dark) mode/ });
  await expect(themeToggle).toBeVisible();
  await expect(themeToggle).toBeEnabled({ timeout: 15_000 });
  await themeToggle.click();
  await expect(page.getByRole("button", { name: /Switch to (light|dark) mode/ })).toBeVisible();

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
});
