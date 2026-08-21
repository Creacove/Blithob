import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { ToastProvider } from "./components/ToastProvider";
import { useProfessionalStore } from "./store/professionalStore";

function renderAppAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ToastProvider>
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

    await user.click(screen.getByRole("link", { name: "Sign in" }));

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

  it.each([
    ["admin", "/admin/today"],
    ["lead", "/professional/today"],
    ["professional", "/professional/today"]
  ] as const)(
    "keeps desktop account actions available for %s users",
    async (persona, path) => {
      const user = userEvent.setup();
      useProfessionalStore.getState().signIn(persona);
      renderAppAt(path);

      await user.click(
        screen.getByRole("button", { name: "Open desktop user menu" })
      );

      expect(
        screen.getByRole("button", { name: "Reset demo data" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign out" })
      ).toBeInTheDocument();
    }
  );

  it("keeps Admin phone navigation to four destinations plus More", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/today");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Admin mobile navigation"
    });
    expect(
      within(mobileNavigation).getAllByRole("link")
    ).toHaveLength(4);
    expect(
      within(mobileNavigation).getByRole("button", { name: "More" })
    ).toBeInTheDocument();
  });

  it("keeps Professional phone navigation to four destinations plus More", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/today");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Professional mobile navigation"
    });
    expect(
      within(mobileNavigation).getAllByRole("link")
    ).toHaveLength(4);
    expect(
      within(mobileNavigation).getByRole("button", { name: "More" })
    ).toBeInTheDocument();
  });

  it("keeps Lead phone navigation to four destinations plus More", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/professional/today");

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Professional mobile navigation"
    });
    expect(
      within(mobileNavigation).getAllByRole("link")
    ).toHaveLength(4);
    expect(
      within(mobileNavigation).getByRole("button", { name: "More" })
    ).toBeInTheDocument();
  });

  it("opens the mobile More sheet and exposes account actions", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/today");

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset demo data" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" })
    ).toBeInTheDocument();
  });

  it("keeps compatibility redirects for the old prototype URLs", () => {
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/worker/jobs");

    expect(screen.getByRole("heading", { name: "Work" })).toBeInTheDocument();
  });

  it("keeps compatibility redirects for trainer URLs", () => {
    useProfessionalStore.getState().signIn("lead");
    renderAppAt("/trainer/trainees");

    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
  });
});

// Keep one interaction-level test outside routing so a regression in a page interaction
// is visible without coupling it to every route assertion above.
describe("core workspace interactions", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("lets an Admin create a service", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("admin");
    renderAppAt("/admin/services");

    await user.click(screen.getByRole("button", { name: "New service" }));
    await user.type(screen.getByLabelText("Service name"), "UX Intensive");
    await user.type(
      screen.getByLabelText("Summary"),
      "A focused two-week design training programme."
    );
    await user.click(screen.getByRole("button", { name: "Create service" }));

    expect(screen.getByText("UX Intensive")).toBeInTheDocument();
  });

  it("lets a Professional update profile availability", async () => {
    const user = userEvent.setup();
    useProfessionalStore.getState().signIn("professional");
    renderAppAt("/professional/profile");

    await user.click(screen.getByRole("button", { name: "Edit availability" }));
    fireEvent.change(screen.getByLabelText("Availability"), {
      target: { value: "15 hours / week" }
    });
    await user.click(screen.getByRole("button", { name: "Save availability" }));

    expect(screen.getByText("15 hours / week")).toBeInTheDocument();
  });
});
