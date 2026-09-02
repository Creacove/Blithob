import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useProfessionalStore } from "../../store/professionalStore";
import { PublicFooter, PublicHeader } from "./PublicLayout";

function renderLayout() {
  return render(
    <MemoryRouter>
      <PublicHeader />
      <PublicFooter />
    </MemoryRouter>
  );
}

describe("PublicLayout account navigation", () => {
  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
    useProfessionalStore.setState({ backendMode: "demo", isBootstrapping: false });
  });

  afterEach(() => cleanup());

  it("updates header and footer actions when a professional signs in", () => {
    renderLayout();

    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);

    act(() => {
      useProfessionalStore.getState().signIn("professional");
    });

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create profile" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open workspace" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "My applications" }).length).toBeGreaterThan(0);
  });

  it("routes an admin to the admin workspace without showing candidate actions", () => {
    renderLayout();

    act(() => {
      useProfessionalStore.getState().signIn("admin");
    });

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open workspace" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "My applications" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open workspace" })[0]).toHaveAttribute("href", "/admin/today");
  });
});
