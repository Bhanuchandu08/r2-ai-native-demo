# CLAUDE.md — Agent operating contract for this repo

You are implementing against **SPEC.md**, not against chat improvisation.

## Workflow (mandatory)

1. Read `SPEC.md` acceptance criteria and rule table (R1–R7).
2. Run `npm test`. If tests fail, treat failures as the to-do list.
3. Change only what the failing tests / open AC items require.
4. Do not mark done until `npm run ci` is green.
5. Prefer pure domain functions in `src/domain/`. Keep adapters thin (`src/api/`).

## Spec quality bar

A good change has:

- Explicit acceptance criteria (Given / When / Then or equivalent).
- Named rules with stable IDs (R1, R2, …) referenced in tests and reasons.
- Fail-closed behavior for incomplete inputs (`needs_review` or `ineligible`, never silent pass).
- Contract tests for public shapes.

## Testing

- TDD gate: add or extend a failing test before production code for new rules.
- Cover unit (domain), batch resilience, and contract layers.
- Never delete a failing test to make CI green — fix the code or update SPEC intentionally.

## Security & hardening (agent review checklist)

When reviewing generated code, check:

- No `any` escaping the domain boundary without justification.
- No swallowed errors in batch paths (log reason onto the result).
- Deterministic dates/math (no `Date.now()` in pure evaluators unless injected).
- Reasons strings include rule IDs for auditability.

## Salesforce bridge

Platform persistence and LWC UX are documented in `docs/salesforce-bridge.md`. Do not invent Apex in this repo unless SPEC expands.

## Skills

Use `.cursor/skills/sf-rule-engine/SKILL.md` when adding or changing eligibility rules.
