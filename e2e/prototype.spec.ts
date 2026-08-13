import { expect, test, type Page } from "@playwright/test";

type Persona = "Admin" | "Lead" | "Professional";

async function signIn(page: Page, persona: Persona) {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: `Continue as ${persona}` }).click();
  await expect(page).toHaveURL(
    persona === "Admin" ? /\/admin\/today$/ : /\/professional\/today$/
  );
}

test("Admin records a cash payment from the task sheet", async ({ page }) => {
  await signIn(page, "Admin");
  await page.goto("/admin/payments");

  await page
    .getByRole("button", { name: "Record payment for payment-due-cash" })
    .click();
  const sheet = page.getByRole("dialog", { name: "Record payment" });
  await sheet.getByLabel("Payment date").fill("2026-06-16T10:00");
  await sheet.getByRole("button", { name: "Save payment" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByText("Payment record saved")).toBeVisible();
});

test("Admin cannot create duplicate jobs from a double submit", async ({
  page
}) => {
  await signIn(page, "Admin");
  await page.goto("/admin/jobs/new");

  const title = "Double-submit QA job";
  await page.getByLabel("Job title").fill(title);
  await page.getByRole("button", { name: "Save draft" }).dblclick();

  await expect(page).toHaveURL(/\/admin\/jobs\/[^/]+$/);
  await page.goto("/admin/jobs");
  await expect(page.getByText(title, { exact: true })).toHaveCount(1);
});

test("Professional submits independent work with evidence", async ({ page }) => {
  await signIn(page, "Professional");
  await page.goto("/professional/work/assignment-amara-campaign");

  await page.getByRole("button", { name: "Submit work" }).click();
  const sheet = page.getByRole("dialog", { name: "Submit work" });
  await sheet
    .getByLabel("Submission notes")
    .fill("Campaign plan, captions, and publishing calendar are ready.");
  await sheet
    .getByLabel("Submission link")
    .fill("https://example.com/final-campaign");
  await sheet.getByRole("button", { name: "Submit work" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByText("Waiting for Lead").first()).toBeVisible();
});

test("Lead certifies only work routed to their review queue", async ({
  page
}) => {
  await signIn(page, "Lead");
  await page.goto("/professional/reviews");

  await expect(page.getByText("Campaign Refresh").first()).toBeVisible();
  await expect(page.getByText("Lead Newsletter Draft")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Review assignment assignment-waiting-lead"
    })
    .click();
  const sheet = page.getByRole("dialog", { name: "Campaign Refresh" });
  await sheet
    .getByLabel("Lead feedback")
    .fill("The submission meets the brief and evidence standard.");
  await sheet.getByRole("button", { name: "Certify for Admin" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByText("Waiting for Admin").first()).toBeVisible();
});

test("role guard keeps Professionals out of Admin routes", async ({ page }) => {
  await signIn(page, "Professional");
  await page.goto("/admin/today");
  await expect(page).toHaveURL(/\/professional\/today$/);
});

test("Professional can sign out from mobile Profile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "Professional");
  await page.goto("/professional/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
});
