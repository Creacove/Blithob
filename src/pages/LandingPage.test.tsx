import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  afterEach(() => cleanup());

  it("presents Blithob Pro as a multi-service company", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Practical support for people and businesses on the move."
      })
    ).toBeInTheDocument();

    for (const service of [
      "Travel",
      "Visa Services",
      "Recruitment",
      "Remote Jobs"
    ]) {
      expect(
        screen.getByRole("heading", { name: service })
      ).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/login");
  });
});
