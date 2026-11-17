# AI-Native Demo — Contribution Eligibility Engine

Portfolio artifact for **R2 Solutions AI — AI-Native Full-Stack Engineer**.

This repo is intentionally small. What matters for the role is not the feature size — it is the **agent loop**:

```text
SPEC.md  →  failing tests  →  agent implementation  →  review/harden  →  CI harness
```

## What to look at first (in this order)

1. [`SPEC.md`](./SPEC.md) — executable requirements, acceptance criteria, test plan  
2. [`CLAUDE.md`](./CLAUDE.md) — agent operating contract  
3. [`.cursor/skills/sf-rule-engine/SKILL.md`](./.cursor/skills/sf-rule-engine/SKILL.md) — reusable agent skill  
4. [`.cursor/hooks.json`](./.cursor/hooks.json) + [`.cursor/hooks/pre-impl-check.sh`](./.cursor/hooks/pre-impl-check.sh) — stop-hook gate  
5. [`tests/`](./tests/) then [`src/domain/eligibility.ts`](./src/domain/eligibility.ts)  
6. [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — pipeline as harness  

## Domain

Deterministic evaluator for public-matching-funds style contributions:

- `eligible` / `ineligible` / `needs_review`
- Hard rules short-circuit; soft flags accumulate
- Batch path never throws (per-row decisions)

Inspired by real campaign-finance / eligibility workflows (Salesforce-adjacent), with a platform bridge note in [`docs/salesforce-bridge.md`](./docs/salesforce-bridge.md).

## Run locally

```bash
npm install
npm run ci
```

## Point of view: what makes a good agent-readable spec

| Principle | How this repo does it |
| --- | --- |
| Stable rule IDs | R1–R7 appear in SPEC, code, and reason strings |
| Explicit outcomes | Three decisions, fail-closed on incomplete data |
| Tests as the to-do list | Each AC maps to a named test |
| Harness over heroics | `npm run ci` is the definition of done |
| Skills over repeated prompts | Rule changes go through `sf-rule-engine` skill |

## Author

**Bhanuchandu Ammadipelli** — Senior Salesforce Developer & Technical Lead; Ph.D. student in Artificial Intelligence.  
Daily driver: Cursor + Claude-style agent loops for design, implementation, and review.
