import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useAppStore } from "./store/appStore";

describe("application routing", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useAppStore.getState().signOut();
  });

  it("lets a visitor enter the prototype and choose a role", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole("link", { name: /explore the workspace/i })
    );

    expect(
      screen.getByRole("heading", { name: /choose a workspace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue as admin/i })
    ).toBeInTheDocument();
  });

  it("signs in as admin and opens the task-first workspace", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole("button", { name: /continue as admin/i })
    );

    expect(
      screen.getByRole("heading", { name: /^today$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^people$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^jobs$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^reviews$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^payments$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review and resolve/i })
    ).toBeInTheDocument();
  });
});
