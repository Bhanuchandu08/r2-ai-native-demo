import { describe, expect, it } from "vitest";
import {
  evaluateContribution,
  evaluateContributionBatch,
} from "../src/domain/eligibility.js";
import type { ContributionInput } from "../src/domain/types.js";

const base: ContributionInput = {
  contributionId: "c-1",
  amount: 250,
  contributorType: "individual",
  electionCycle: "2025",
  contributorId: "person-1",
  committeeId: "cmte-1",
  contributionDate: "2025-06-01T12:00:00.000Z",
};

const options = { activeElectionCycle: "2025" };

describe("evaluateContribution (SPEC R1–R7)", () => {
  it("AC1: eligible when all hard rules pass", () => {
    const result = evaluateContribution(base, options);
    expect(result.decision).toBe("eligible");
    expect(result.reasons).toEqual([]);
    expect(result.ruleIdsApplied).toEqual(
      expect.arrayContaining(["R1", "R2", "R3", "R4", "R5", "R6", "R7"]),
    );
    expect(result.contributionId).toBe("c-1");
  });

  it("AC2: ineligible for non-individual", () => {
    const result = evaluateContribution(
      { ...base, contributorType: "corporation" },
      options,
    );
    expect(result.decision).toBe("ineligible");
    expect(result.reasons.some((r) => r.startsWith("R2"))).toBe(true);
  });

  it("AC3: needs_review when ids missing", () => {
    const result = evaluateContribution(
      { ...base, contributorId: undefined, committeeId: undefined },
      options,
    );
    expect(result.decision).toBe("needs_review");
    expect(result.reasons.some((r) => r.startsWith("R5"))).toBe(true);
  });

  it("AC4: needs_review on duplicate fingerprint", () => {
    const result = evaluateContribution(base, {
      ...options,
      priorFingerprints: [
        {
          contributorId: "person-1",
          committeeId: "cmte-1",
          amount: 250,
          contributionDate: "2025-06-01T18:00:00.000Z",
        },
      ],
    });
    expect(result.decision).toBe("needs_review");
    expect(result.reasons.some((r) => r.startsWith("R4"))).toBe(true);
  });

  it("R1: zero/negative amount → ineligible", () => {
    expect(evaluateContribution({ ...base, amount: 0 }, options).decision).toBe(
      "ineligible",
    );
    expect(
      evaluateContribution({ ...base, amount: -10 }, options).decision,
    ).toBe("ineligible");
  });

  it("R3: wrong election cycle → ineligible", () => {
    const result = evaluateContribution(
      { ...base, electionCycle: "2023" },
      options,
    );
    expect(result.decision).toBe("ineligible");
    expect(result.reasons.some((r) => r.startsWith("R3"))).toBe(true);
  });

  it("R6: over cap → needs_review", () => {
    const result = evaluateContribution({ ...base, amount: 1500 }, options);
    expect(result.decision).toBe("needs_review");
    expect(result.reasons.some((r) => r.startsWith("R6"))).toBe(true);
  });
});

describe("evaluateContributionBatch (AC5)", () => {
  it("evaluates each row independently and never throws", () => {
    const results = evaluateContributionBatch(
      [
        base,
        { ...base, contributionId: "c-2", amount: -5 },
        {
          ...base,
          contributionId: "c-3",
          contributorType: "pac",
        },
      ],
      options,
    );

    expect(results).toHaveLength(3);
    expect(results[0].decision).toBe("eligible");
    expect(results[1].decision).toBe("ineligible");
    expect(results[1].reasons.some((r) => r.startsWith("R1"))).toBe(true);
    expect(results[2].decision).toBe("ineligible");
    expect(results[2].reasons.some((r) => r.startsWith("R2"))).toBe(true);
  });
});
