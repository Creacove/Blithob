import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  afterEach(() => cleanup());

  it("renders the butterfly mark as the home link", () => {
    render(
      <MemoryRouter>
        <BrandMark />
      </MemoryRouter>
    );

    const logo = screen.getByRole("img", { name: "Blithob Pro" });

    expect(logo).toHaveAttribute(
      "src",
      "/brand/blithob-mark.png"
    );
    expect(
      screen.getByRole("link", { name: "Blithob Professionals home" })
    ).toHaveAttribute("href", "/");
  });

  it("also uses the butterfly mark in compact mode", () => {
    render(
      <MemoryRouter>
        <BrandMark compact />
      </MemoryRouter>
    );

    expect(screen.getByRole("img", { name: "Blithob Pro" })).toHaveAttribute(
      "src",
      "/brand/blithob-mark.png"
    );
  });
});
