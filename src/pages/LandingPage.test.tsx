import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  afterEach(() => cleanup());

  it("presents Blithob Pro as a candidate-first job platform", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Your next opportunity is closer than you think"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Jobs worth checking out" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Whatever you’re good at, start there."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Getting hired shouldn’t be complicated."
      })
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: "Sign in" })[0]
    ).toHaveAttribute("href", "/login");
  });
});
