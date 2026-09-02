import { cleanup, render, screen, within } from "@testing-library/react";
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

    const nav = screen.getByRole("navigation", { name: "Marketing navigation" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
    expect(screen.queryByText("For Employers")).not.toBeInTheDocument();
    expect(screen.queryByText("Open Opportunities")).not.toBeInTheDocument();
  });

  it("integrates the hero artwork and shows the community proof portraits", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("img", {
        name: "Blithob Pro workspace with a laptop showing an opportunity"
      })
    ).toHaveClass("lp-hero-media-image");

    const heroHeading = screen.getByRole("heading", {
      name: "Your next opportunity is closer than you think"
    });
    const heroEmphasis = heroHeading.querySelectorAll(".lp-hero-emphasis");
    expect(heroEmphasis).toHaveLength(2);
    expect(heroEmphasis[0]).toHaveTextContent("opportunity");
    expect(heroEmphasis[1]).toHaveTextContent("closer");
    expect(
      screen.getAllByRole("img", { name: /Blithob Pro job seeker/ })
    ).toHaveLength(4);
  });

  it("renders the jobs section as live overlays on responsive blank clips", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("region", { name: "Featured job opportunities" })
    ).toHaveClass("lp-job-board-live");
    expect(
      screen.getByRole("img", { name: "Blank job clips on a workspace board" })
    ).toHaveAttribute("src", "/landing/jobs-board-desktop.webp");
    expect(
      screen.getByRole("button", { name: "View Frontend Developer job" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Build accessible, responsive product experiences/)
    ).toHaveClass("lp-job-overlay-description");
    expect(screen.getByText("₦450K – ₦650K")).toBeInTheDocument();
    expect(screen.queryByText(/[$£]/)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /^View .+ job$/ })
    ).toHaveLength(4);
    expect(
      screen.getAllByLabelText(/^View .+ job$/, { selector: "button" })
    ).toHaveLength(5);
  });

  it("renders five live category folders", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const categorySection = screen.getByRole("region", { name: "Job categories" });
    expect(within(categorySection).getAllByRole("article")).toHaveLength(5);

    for (const label of ["TECH", "DESIGN", "MARKETING", "OPERATIONS", "SUPPORT"]) {
      expect(within(categorySection).getByText(label)).toBeInTheDocument();
    }
  });

  it("uses the supplied WebP portrait in success stories", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("img", { name: "Professional working at a laptop" })).toHaveAttribute(
      "src",
      "/landing/success-story.webp"
    );
  });

  it("renders the Why Blithob Pro reference as a live editorial section", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.queryByAltText(/Why Blithob Pro: clear requirements/)).not.toBeInTheDocument();
    const why = screen.getByRole("region", { name: "Why Blithob Pro" });
    expect(within(why).getByRole("heading", { name: "Good jobs. Clear details. No bullshit." })).toBeInTheDocument();
    expect(within(why).getAllByRole("article")).toHaveLength(4);
    expect(within(why).getByText("Verified details")).toBeInTheDocument();
    expect(within(why).getByText("Clear timing")).toBeInTheDocument();
    expect(within(why).getByText("Human support")).toBeInTheDocument();
    expect(screen.queryByText(/intentionally honest/)).not.toBeInTheDocument();
    expect(screen.queryByText("Verified Employers")).not.toBeInTheDocument();
    expect(screen.queryByText("Smart Matches")).not.toBeInTheDocument();
    expect(screen.queryByText("Applications Made Easy")).not.toBeInTheDocument();
  });

  it("renders the process reference as live text on responsive notebook artwork", () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const process = screen.getByRole("region", { name: "How Blithob Pro works" });
    expect(process.querySelector(".lp-process-brand")).not.toBeInTheDocument();
    expect(within(process).getByRole("heading", { name: "Getting hired shouldn’t be complicated." })).toHaveClass("lp-display");
    expect(within(process).getByText(/Blithob Pro makes it simple/)).toHaveClass("lp-section-copy");
    expect(within(process).getByAltText("Blank notebook on a warm desk")).toHaveAttribute(
      "src",
      "/landing/process-desktop.webp"
    );
    expect(container.querySelector('.lp-process-picture source')).toHaveAttribute(
      "srcset",
      "/landing/process-mobile.webp"
    );
    expect(process.querySelector(".lp-process-note-blue")).toHaveTextContent("Progressoverperfection♡");
    expect(within(process).getByText("Discover curated job opportunities that match your skills, goals, and what matters most to you.")).toBeInTheDocument();
    expect(within(process).getByText("Apply in minutes with a smarter, streamlined process that helps you stand out.")).toBeInTheDocument();
    expect(within(process).getByText("Track your applications, get real-time updates, and take the next step with clarity and confidence.")).toBeInTheDocument();
    expect(screen.queryByAltText(/Three-step Blithob Pro hiring journey/)).not.toBeInTheDocument();
  });
});
