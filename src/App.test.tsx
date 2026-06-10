import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useProfessionalStore } from "./store/professionalStore";

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe("application routing", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("lets a visitor enter the prototype and choose a persona", async () => {
    const user = userEvent.setup();
    renderAppAt("/");

    await user.click(
      screen.getByRole("link", { name: "Explore the workspace" })
    );

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Admin" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Lead" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as Professional" })
    ).toBeInTheDocument();
  });

  it("shows Services as a first-class Admin destination", () => {
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/today");

    expect(
      screen.getByRole("link", { name: "Services" })
    ).toBeInTheDocument();
  });

  it("keeps Lead users inside the Professional workspace", () => {
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/professional/today");

    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Training" })).toBeInTheDocument();
  });

  it("does not expose Lead destinations to a regular Professional", () => {
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/today");

    expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Reviews" })
    ).not.toBeInTheDocument();
  });

  it("recovers from a persisted session whose user no longer exists", () => {
    useProfessionalStore.setState({
      session: { persona: "lead", userId: "missing-user" }
    });

    renderAppAt("/professional/today");

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" })
    ).toBeInTheDocument();
  });
});
