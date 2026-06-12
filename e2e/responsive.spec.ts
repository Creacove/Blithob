import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 912, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 }
];

const adminRoutes = [
  "/admin/today",
  "/admin/people",
  "/admin/people/professional-amara",
  "/admin/services",
  "/admin/services/service-social",
  "/admin/jobs",
  "/admin/jobs/new",
  "/admin/jobs/job-open-social/edit",
  "/admin/jobs/job-open-social",
  "/admin/assignments/assignment-approved",
  "/admin/reviews",
  "/admin/payments",
  "/admin/payments/payment-due-cash",
  "/admin/notifications"
];

const professionalRoutes = [
  "/professional/today",
  "/professional/work",
  "/professional/work/assignment-amara-campaign",
  "/professional/training",
  "/professional/training/enrolment-amara-social-approved",
  "/professional/payments",
  "/professional/payments/payment-paid-amara",
  "/professional/profile",
  "/professional/notifications"
];

const leadRoutes = [
  "/professional/team",
  "/professional/team/enrolment-zainab-social",
  "/professional/reviews"
];

async function signIn(page: Page, persona: "Admin" | "Lead" | "Professional") {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: `Continue as ${persona}` }).click();
}

async function assertResponsivePage(page: Page, path: string, width: number) {
  await page.goto(path);
  await page.locator("main").first().waitFor();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);

  if (width < 768 && path !== "/" && path !== "/login") {
    const layout = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>(".mobile-bottom-nav");
      const main = document.querySelector<HTMLElement>("main");
      window.scrollTo(0, document.documentElement.scrollHeight);
      if (!nav || !main) return null;
      return {
        navOverflow: nav.scrollWidth - nav.clientWidth,
        navPosition: getComputedStyle(nav).position,
        navLeft: nav.getBoundingClientRect().left,
        navRight: nav.getBoundingClientRect().right,
        navBottom: nav.getBoundingClientRect().bottom,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: window.innerHeight,
        mainBottom: main.getBoundingClientRect().bottom,
        navTop: nav.getBoundingClientRect().top
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.navOverflow).toBeLessThanOrEqual(1);
    expect(layout!.navPosition).toBe("fixed");
    expect(Math.abs(layout!.navLeft)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(layout!.navRight - layout!.viewportWidth)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(layout!.navBottom - layout!.viewportHeight)
    ).toBeLessThanOrEqual(1);
    expect(layout!.mainBottom).toBeLessThanOrEqual(layout!.navTop + 1);
  }
}

test("all 28 active routes remain usable across the viewport matrix", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  test.setTimeout(300_000);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/login"]) {
      await assertResponsivePage(page, route, viewport.width);
    }

    await signIn(page, "Admin");
    for (const route of adminRoutes) {
      await assertResponsivePage(page, route, viewport.width);
    }

    await signIn(page, "Professional");
    for (const route of professionalRoutes) {
      await assertResponsivePage(page, route, viewport.width);
    }

    await signIn(page, "Lead");
    for (const route of leadRoutes) {
      await assertResponsivePage(page, route, viewport.width);
    }
  }
});
