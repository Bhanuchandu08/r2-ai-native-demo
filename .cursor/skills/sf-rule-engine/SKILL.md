---
name: sf-rule-engine
description: >-
  Add or change contribution eligibility rules using spec-driven TDD. Use when
  the user asks to add a matching-funds rule, change R1–Rn outcomes, extend
  DecisionResult, or map rules to Salesforce custom metadata.
---

# Salesforce-Adjacent Rule Engine Skill

## Purpose

Keep eligibility logic **agent-executable**: every rule has a stable ID, a
SPEC entry, a failing test first, then a pure-function implementation.

## When to use

- New campaign-finance / matching-funds rule
- Changing hard-fail vs needs_review semantics
- Adding fields to `ContributionInput` or `DecisionResult`
- Preparing a Salesforce Custom Metadata mapping for rule codes

## Procedure

1. **Update SPEC.md**
   - Add a row to the domain rules table with a new ID (`R8`, …).
   - Add acceptance criteria and a test-plan row.
   - State fail-closed behavior explicitly.

2. **Write the failing test**
   - File: `tests/eligibility.test.ts` (behavior) and/or `tests/contract.test.ts` (shape).
   - Assert `decision`, `reasons` prefix (`Rn:`), and `ruleIdsApplied` contains `Rn`.

3. **Implement the minimal change**
   - Prefer `src/domain/eligibility.ts`.
   - Hard rules short-circuit to `ineligible`.
   - Soft rules append to `reasons` and resolve to `needs_review` via R7.

4. **Run the harness**
   ```bash
   npm run ci
   ```

5. **Salesforce mapping note** (if asked)
   - Document Custom Metadata Type fields in `docs/salesforce-bridge.md`:
     `Rule_Code__c`, `Severity__c` (`Hard`/`Soft`), `Message_Template__c`.

## Good vs bad specs (point of view)

| Good | Bad |
| --- | --- |
| "R2: non-individual → ineligible; reason starts with R2" | "Handle bad contributor types somehow" |
| Named outcomes: eligible / ineligible / needs_review | Boolean `isOk` with unclear false meaning |
| Batch: per-row results, never throw | "Validate the file" with one global error |
| Cap behavior stated (review vs reject) | Silent truncation of amount |

## Anti-patterns (hooks should catch these)

- Implementing without a SPEC row
- Returning `eligible` when required IDs are missing
- Mutating shared prior-fingerprint arrays
- Putting SOQL / Apex inside unit-tested domain code
