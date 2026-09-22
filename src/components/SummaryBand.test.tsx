import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SummaryBand, type SummaryItem } from "./SummaryBand";

describe("SummaryBand", () => {
  it("turns linked metrics into accessible navigation", () => {
    const item = {
      label: "Applications",
      value: 2,
      to: "/admin/applications"
    } as SummaryItem & { to: string };

    render(
      <MemoryRouter>
        <SummaryBand items={[item]} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Applications/ })).toHaveAttribute(
      "href",
      "/admin/applications"
    );
  });
});
