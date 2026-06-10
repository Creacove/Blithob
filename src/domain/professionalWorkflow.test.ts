import { describe, expect, it } from "vitest";
import { createDemoState } from "./professionalWorkflow";

describe("normalized demo state", () => {
  it("contains no orphan Assignment relationships", () => {
    const state = createDemoState();
    for (const assignment of state.assignments) {
      expect(state.jobs.some((item) => item.id === assignment.jobId)).toBe(true);
      expect(
        state.professionals.some(
          (item) => item.id === assignment.professionalId
        )
      ).toBe(true);
    }
  });
});
