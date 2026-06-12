import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, persona: "Admin" | "Professional") {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: `Continue as ${persona}` }).click();
}

test("mobile archetype visual baselines", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await expect(page).toHaveScreenshot("mobile-public.png", {
    animations: "disabled",
    fullPage: true,
    timeout: 20_000
  });

  await signIn(page, "Admin");
  for (const [name, path] of [
    ["mobile-dashboard.png", "/admin/today"],
    ["mobile-directory.png", "/admin/jobs"],
    ["mobile-detail.png", "/admin/jobs/job-open-social"],
    ["mobile-long-form.png", "/admin/jobs/new"],
    ["mobile-queue.png", "/admin/reviews"]
  ] as const) {
    await page.goto(path);
    await expect(page).toHaveScreenshot(name, {
      animations: "disabled",
      fullPage: true,
      timeout: 20_000
    });
  }

  await page.goto("/admin/payments");
  await page
    .getByRole("button", { name: "Record payment for payment-due-cash" })
    .click();
  const paymentSheet = page.getByRole("dialog", { name: "Record payment" });
  await expect(paymentSheet).toHaveScreenshot("mobile-task-sheet.png", {
    animations: "disabled",
    timeout: 20_000,
    maxDiffPixelRatio: 0.04
  });

  await signIn(page, "Professional");
  await page.goto("/professional/profile");
  await expect(page).toHaveScreenshot("mobile-profile.png", {
    animations: "disabled",
    fullPage: true,
    timeout: 20_000
  });

  await page.goto("/professional/notifications");
  await expect(page).toHaveScreenshot("mobile-empty-state.png", {
    animations: "disabled",
    fullPage: true,
    timeout: 20_000
  });
});
