# SPEC: Contribution Eligibility Decision Engine

> **How this was built:** Spec → failing tests → agent implementation loops → CI gate.  
> Agent artifacts that constrained the work live in `CLAUDE.md`, `.cursor/skills/`, and `.cursor/hooks/`.

## Problem

Campaign-finance staff need a deterministic engine that decides whether an individual contribution is **eligible**, **ineligible**, or **needs_review** for public matching funds — before data lands in Salesforce.

This mirrors a real client pattern: rule clarity first, platform persistence second.

## Goals

1. Encode eligibility rules as pure, testable domain logic (no Salesforce runtime required for unit verification).
2. Return a machine-readable decision with reasons suitable for audit and UI display.
3. Support batch evaluation for CSV import workflows.
4. Fail closed: ambiguous or incomplete inputs → `needs_review`, never silent pass.

## Non-goals

- Full Salesforce Apex / LWC UI (out of scope for this demo; architecture notes in `docs/salesforce-bridge.md`).
- ML-based contributor matching.
- Payment disbursement.

## Actors

| Actor | Need |
| --- | --- |
| Compliance staff | Trustable yes/no/review with explicit reasons |
| Integration job | Batch API that never throws on bad rows |
| Agent / engineer | Spec + tests as the only acceptance surface |

## Domain rules (v1)

A contribution is evaluated against these rules **in order**. First hard fail wins for `ineligible`. Soft issues accumulate as `needs_review`.

| ID | Rule | Outcome if violated |
| --- | --- | --- |
| R1 | `amount` must be a finite number > 0 | `ineligible` |
| R2 | `contributorType` must be `individual` (not PAC, corp, union, other) | `ineligible` |
| R3 | `electionCycle` must match the active cycle string (e.g. `2025`) | `ineligible` |
| R4 | Same contributor + same committee + same `amount` + same `contributionDate` within 24h → possible duplicate | `needs_review` |
| R5 | Missing `contributorId` or `committeeId` | `needs_review` |
| R6 | `amount` > matchable cap (`1000` USD per contribution in v1) | `needs_review` (cap excess; still may be partially matchable later) |
| R7 | If all hard rules pass and no soft flags → `eligible` |

## Acceptance criteria

### AC1 — Happy path

Given a complete individual contribution under the cap with no duplicate signal,  
when `evaluateContribution` is called,  
then result is `{ decision: "eligible", reasons: [], ruleIdsApplied: [...] }`.

### AC2 — Corporate / PAC rejected

Given `contributorType` ≠ `individual`,  
then decision is `ineligible` and reasons include `R2`.

### AC3 — Incomplete identity

Given missing `contributorId` or `committeeId`,  
then decision is `needs_review` and reasons include `R5`.

### AC4 — Duplicate signal

Given a prior contribution fingerprint matching within 24 hours,  
then decision is `needs_review` and reasons include `R4`.

### AC5 — Batch resilience

Given a batch of 3 rows where row 2 is invalid amount,  
then the batch returns 3 results; row 2 is `ineligible` (`R1`); others evaluate independently; no throw.

### AC6 — Contract shape

Every result MUST include:

```ts
{
  decision: "eligible" | "ineligible" | "needs_review";
  reasons: string[];       // human-readable
  ruleIdsApplied: string[]; // e.g. ["R1","R2",...]
  contributionId?: string;
}
```

## Test plan (agent must keep green)

| Test | Spec link |
| --- | --- |
| `eligible when all hard rules pass` | AC1 |
| `ineligible for non-individual` | AC2 |
| `needs_review when ids missing` | AC3 |
| `needs_review on duplicate fingerprint` | AC4 |
| `batch evaluates each row independently` | AC5 |
| `result matches DecisionResult contract` | AC6 |
| `zero/negative amount → ineligible R1` | R1 |
| `wrong election cycle → ineligible R3` | R3 |
| `over cap → needs_review R6` | R6 |

## Definition of done

- [x] Spec checked into repo before implementation.
- [x] Failing tests written from acceptance criteria.
- [x] Implementation produced against tests (no untested branches for R1–R7).
- [x] `npm run ci` passes (typecheck + tests).
- [x] Agent skill + CLAUDE.md + hook encode the conventions used.
- [x] README explains the agent loop, not just the code.

## Open questions (intentionally deferred)

1. Partial matching math for amounts over cap (R6 currently flags review only).
2. Address / residency residency checks for matchability.
3. Mapping of `reasons` codes to Salesforce custom metadata picklists.
