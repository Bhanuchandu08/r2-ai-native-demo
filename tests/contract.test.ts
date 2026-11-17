import { describe, expect, it } from "vitest";
import { handleEvaluate } from "../src/api/evaluate.js";
import type { DecisionResult } from "../src/domain/types.js";

function assertContract(result: DecisionResult) {
  expect(["eligible", "ineligible", "needs_review"]).toContain(result.decision);
  expect(Array.isArray(result.reasons)).toBe(true);
  expect(Array.isArray(result.ruleIdsApplied)).toBe(true);
  expect(result.reasons.every((r) => typeof r === "string")).toBe(true);
  expect(result.ruleIdsApplied.every((r) => typeof r === "string")).toBe(true);
}

describe("DecisionResult contract (AC6)", () => {
  it("single and batch responses match the contract", () => {
    const single = handleEvaluate({
      contribution: {
        contributionId: "c-1",
        amount: 100,
        contributorType: "individual",
        electionCycle: "2025",
        contributorId: "p1",
        committeeId: "m1",
        contributionDate: "2025-01-01T00:00:00.000Z",
      },
      options: { activeElectionCycle: "2025" },
    });

    expect(single.results).toHaveLength(1);
    assertContract(single.results[0]);

    const batch = handleEvaluate({
      contributions: [
        {
          amount: 50,
          contributorType: "individual",
          electionCycle: "2025",
          contributionDate: "2025-01-01T00:00:00.000Z",
        },
        {
          amount: -1,
          contributorType: "pac",
          electionCycle: "2025",
          contributionDate: "2025-01-01T00:00:00.000Z",
        },
      ],
      options: { activeElectionCycle: "2025" },
    });

    expect(batch.results).toHaveLength(2);
    batch.results.forEach(assertContract);
  });

  it("rejects missing activeElectionCycle", () => {
    expect(() =>
      handleEvaluate({
        contribution: {
          amount: 10,
          contributorType: "individual",
          electionCycle: "2025",
          contributionDate: "2025-01-01T00:00:00.000Z",
        },
        // @ts-expect-error intentional invalid fixture
        options: {},
      }),
    ).toThrow(/activeElectionCycle/);
  });
});
