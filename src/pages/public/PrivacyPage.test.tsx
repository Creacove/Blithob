import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrivacyPage } from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("describes private candidate data without claiming certification", () => {
    render(<MemoryRouter><PrivacyPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /How Blithob uses your information/i })).toBeInTheDocument();
    expect(screen.getByText(/CVs and supporting documents are stored privately/i)).toBeInTheDocument();
    expect(screen.getByText(/not a legal certification/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse jobs/i })).toHaveAttribute("href", "/jobs");
  });
});
