import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";
import { SummaryBand } from "./SummaryBand";

describe("design system", () => {
  it("uses contextual language for submitted work", () => {
    render(<StatusBadge status="submitted" />);

    expect(screen.getByText("Waiting for review")).toBeInTheDocument();
  });

  it("uses contextual language for payout records", () => {
    render(<StatusBadge status="pending" />);

    expect(screen.getByText("Payment due")).toBeInTheDocument();
  });

  it("groups summary metrics in one labelled region", () => {
    render(
      <SummaryBand
        items={[
          {
            label: "Jobs awaiting review",
            value: 2,
            note: "Needs a decision"
          }
        ]}
      />
    );

    expect(
      screen.getByRole("region", { name: "Workspace summary" })
    ).toBeInTheDocument();
    expect(screen.getByText("Jobs awaiting review")).toBeInTheDocument();
  });
});
