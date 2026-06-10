import { expect, test } from "@playwright/test";

async function openWorkspaceLink(page: import("@playwright/test").Page, name: string) {
  const link = page.getByRole("link", { name, exact: true });
  if (!(await link.isVisible())) {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
  }
  await link.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("admin can complete accepted work and record its payout", async ({
  page
}) => {
  await page.getByRole("link", { name: "Explore the workspace" }).click();
  await page.getByRole("button", { name: "Continue as Admin" }).click();
  await expect(
    page.getByRole("heading", { name: "Today" })
  ).toBeVisible();

  await openWorkspaceLink(page, "Reviews");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("article")
    .filter({ hasText: "Customer inbox reset" })
    .getByRole("button", { name: "Complete work" })
    .click();

  await openWorkspaceLink(page, "Payments");
  const payoutRow = page
    .getByRole("article")
    .filter({ hasText: "Customer inbox reset" });
  await expect(payoutRow.getByText("Payment due")).toBeVisible();
  await payoutRow.getByRole("button", { name: "Record payment" }).click();
  await page
    .getByLabel("Payment reference")
    .fill("TRF-E2E-001");
  await page.getByRole("button", { name: "Confirm paid" }).click();
  await expect(payoutRow.getByText("Paid")).toBeVisible();
  await expect(payoutRow.getByText("TRF-E2E-001")).toBeVisible();
});

test("worker can start and submit assigned work on mobile", async ({ page }) => {
  await page.getByRole("link", { name: "Explore the workspace" }).click();
  await page.getByRole("button", { name: "Continue as Worker" }).click();
  await expect(page.getByRole("heading", { name: "Hello, Amara" })).toBeVisible();

  await page.getByRole("link", { name: "Work" }).last().click();
  const assignment = page
    .getByRole("article")
    .filter({ hasText: "Founder launch campaign" });
  await assignment.getByRole("button", { name: "Submit work" }).click();
  await page.getByLabel("Submission notes").fill(
    "Campaign plan, captions, and publishing calendar are ready."
  );
  await page.getByLabel("Work link").fill("https://example.com/final-campaign");
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(assignment.getByText("Waiting for review")).toBeVisible();
});

test("role guard redirects worker away from admin routes", async ({ page }) => {
  await page.getByRole("link", { name: "Explore the workspace" }).click();
  await page.getByRole("button", { name: "Continue as Worker" }).click();
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/worker\/dashboard$/);
});
