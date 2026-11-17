export type ContributorType =
  | "individual"
  | "pac"
  | "corporation"
  | "union"
  | "other";

export type Decision = "eligible" | "ineligible" | "needs_review";

export interface ContributionInput {
  contributionId?: string;
  amount: number;
  contributorType: ContributorType;
  electionCycle: string;
  contributorId?: string;
  committeeId?: string;
  contributionDate: string; // ISO-8601
}

export interface PriorContributionFingerprint {
  contributorId: string;
  committeeId: string;
  amount: number;
  contributionDate: string; // ISO-8601
}

export interface DecisionResult {
  decision: Decision;
  reasons: string[];
  ruleIdsApplied: string[];
  contributionId?: string;
}

export interface EvaluateOptions {
  activeElectionCycle: string;
  matchableCapUsd?: number;
  priorFingerprints?: PriorContributionFingerprint[];
}
