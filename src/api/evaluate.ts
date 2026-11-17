import {
  evaluateContribution,
  evaluateContributionBatch,
} from "../domain/eligibility.js";
import type {
  ContributionInput,
  DecisionResult,
  EvaluateOptions,
} from "../domain/types.js";

export interface EvaluateRequest {
  contribution?: ContributionInput;
  contributions?: ContributionInput[];
  options: EvaluateOptions;
}

export interface EvaluateResponse {
  results: DecisionResult[];
}

/**
 * Thin request adapter — keeps HTTP/CLI concerns out of domain logic.
 */
export function handleEvaluate(request: EvaluateRequest): EvaluateResponse {
  if (!request.options?.activeElectionCycle) {
    throw new Error("options.activeElectionCycle is required");
  }

  if (request.contributions) {
    return {
      results: evaluateContributionBatch(
        request.contributions,
        request.options,
      ),
    };
  }

  if (request.contribution) {
    return {
      results: [evaluateContribution(request.contribution, request.options)],
    };
  }

  throw new Error("Provide contribution or contributions");
}
