import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useProfessionalStore } from "../../store/professionalStore";
import { OnboardingPage } from "./OnboardingPage";

describe("OnboardingPage", () => {
  afterEach(() => {
    cleanup();
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("keeps document upload on the application step until the profile exists", () => {
    useProfessionalStore.getState().signIn("admin");

    render(
      <MemoryRouter initialEntries={["/onboarding?next=%2Fjobs%2Frole%2Fapply"]}>
        <OnboardingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /tell us about yourself/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /candidate documents/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to application/i })).toBeInTheDocument();
  });
});
