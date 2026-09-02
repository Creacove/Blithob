import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const artifactDir = "artifacts/landing";

test.setTimeout(60_000);

async function ready(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

test.beforeAll(() => {
  mkdirSync(artifactDir, { recursive: true });
});

test("captures the approved landing experience", async ({ page }, testInfo) => {
  await ready(page);

  await expect(
    page.getByRole("heading", {
      name: "Your next opportunity is closer than you think"
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Jobs worth checking out" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Whatever you’re good at, start there."
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Getting hired shouldn’t be complicated."
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Good jobs. Clear details. No bullshit."
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "People finding their next move."
    })
  ).toBeVisible();

  const heroImage = page.getByRole("img", {
    name: "Blithob Pro workspace with a laptop showing an opportunity"
  });
  await expect(heroImage).toBeVisible();
  await expect.poll(async () => heroImage.evaluate((image) => {
    const element = image as HTMLImageElement;
    return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0;
  })).toBe(true);

  const images = page.locator("img");
  const imageCount = await images.count();
  expect(imageCount).toBeGreaterThan(0);
  for (let index = 0; index < imageCount; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(async () => image.evaluate((element) => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    }), { message: `image ${index + 1} should decode successfully` }).toBe(true);
  }

  const suffix = testInfo.project.name;
  await page.screenshot({
    path: `${artifactDir}/full-${suffix}.png`,
    fullPage: true
  });

  const sections = page.locator("main > section");
  const names = ["hero", "jobs", "categories", "process", "why", "proof", "final"];

  await expect(sections).toHaveCount(names.length);
  for (let index = 0; index < names.length; index += 1) {
    await sections.nth(index).screenshot({
      path: `${artifactDir}/${String(index + 1).padStart(2, "0")}-${names[index]}-${suffix}.png`
    });
  }
});
