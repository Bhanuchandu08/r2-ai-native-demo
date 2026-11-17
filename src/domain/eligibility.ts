import type {
  ContributionInput,
  DecisionResult,
  EvaluateOptions,
  PriorContributionFingerprint,
} from "./types.js";

const DEFAULT_CAP_USD = 1000;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function isFinitePositive(amount: number): boolean {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0;
}

function withinDuplicateWindow(
  candidateDate: string,
  priorDate: string,
): boolean {
  const a = Date.parse(candidateDate);
  const b = Date.parse(priorDate);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= DUPLICATE_WINDOW_MS;
}

function matchesFingerprint(
  input: ContributionInput,
  prior: PriorContributionFingerprint,
): boolean {
  if (!input.contributorId || !input.committeeId) return false;
  return (
    prior.contributorId === input.contributorId &&
    prior.committeeId === input.committeeId &&
    prior.amount === input.amount &&
    withinDuplicateWindow(input.contributionDate, prior.contributionDate)
  );
}

/**
 * Deterministic eligibility evaluation (SPEC.md R1–R7).
 * Hard failures short-circuit to ineligible. Soft flags → needs_review.
 */
export function evaluateContribution(
  input: ContributionInput,
  options: EvaluateOptions,
): DecisionResult {
  const ruleIdsApplied: string[] = [];
  const reasons: string[] = [];
  const cap = options.matchableCapUsd ?? DEFAULT_CAP_USD;

  // R1 — amount
  ruleIdsApplied.push("R1");
  if (!isFinitePositive(input.amount)) {
    return {
      decision: "ineligible",
      reasons: ["R1: amount must be a finite number greater than 0"],
      ruleIdsApplied,
      contributionId: input.contributionId,
    };
  }

  // R2 — contributor type
  ruleIdsApplied.push("R2");
  if (input.contributorType !== "individual") {
    return {
      decision: "ineligible",
      reasons: [
        `R2: contributorType must be individual (got ${input.contributorType})`,
      ],
      ruleIdsApplied,
      contributionId: input.contributionId,
    };
  }

  // R3 — election cycle
  ruleIdsApplied.push("R3");
  if (input.electionCycle !== options.activeElectionCycle) {
    return {
      decision: "ineligible",
      reasons: [
        `R3: electionCycle must be ${options.activeElectionCycle} (got ${input.electionCycle})`,
      ],
      ruleIdsApplied,
      contributionId: input.contributionId,
    };
  }

  // Soft rules accumulate
  ruleIdsApplied.push("R5");
  if (!input.contributorId || !input.committeeId) {
    reasons.push("R5: contributorId and committeeId are required");
  }

  ruleIdsApplied.push("R4");
  const priors = options.priorFingerprints ?? [];
  if (priors.some((p) => matchesFingerprint(input, p))) {
    reasons.push(
      "R4: possible duplicate contribution within 24 hours (same contributor, committee, amount)",
    );
  }

  ruleIdsApplied.push("R6");
  if (input.amount > cap) {
    reasons.push(
      `R6: amount ${input.amount} exceeds matchable cap ${cap}; needs review for partial match`,
    );
  }

  ruleIdsApplied.push("R7");
  if (reasons.length > 0) {
    return {
      decision: "needs_review",
      reasons,
      ruleIdsApplied,
      contributionId: input.contributionId,
    };
  }

  return {
    decision: "eligible",
    reasons: [],
    ruleIdsApplied,
    contributionId: input.contributionId,
  };
}

/**
 * Batch evaluation: never throws; each row is independent (AC5).
 */
export function evaluateContributionBatch(
  inputs: ContributionInput[],
  options: EvaluateOptions,
): DecisionResult[] {
  return inputs.map((row) => {
    try {
      return evaluateContribution(row, options);
    } catch (err) {
      return {
        decision: "needs_review",
        reasons: [
          `unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        ],
        ruleIdsApplied: [],
        contributionId: row.contributionId,
      };
    }
  });
}
