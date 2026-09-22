import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");

describe("production invitation configuration", () => {
  it("sends invitation links back to the Blithob sign-in page", () => {
    const config = readFileSync(resolve(projectRoot, "supabase/config.toml"), "utf8");
    const inviteFunction = readFileSync(
      resolve(projectRoot, "supabase/functions/invite-professional/index.ts"),
      "utf8"
    );
    const loginPage = readFileSync(resolve(projectRoot, "src/pages/LoginPage.tsx"), "utf8");

    expect(config).toContain('site_url = "https://blithob.com"');
    expect(config).toContain('additional_redirect_urls = ["https://blithob.com/login?mode=invite"]');
    expect(inviteFunction).toContain('redirectTo: "https://blithob.com/login?mode=invite"');
    expect(loginPage).toContain('searchParams.get("mode") === "invite"');
    expect(loginPage).toContain('Create your password');
  });
});
