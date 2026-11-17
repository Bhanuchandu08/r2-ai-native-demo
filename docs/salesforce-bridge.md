# Salesforce bridge (architecture note)

This demo keeps eligibility as **pure TypeScript** so agents and CI can verify rules without an org. On a client engagement, the same SPEC maps to Salesforce as follows.

## Suggested mapping

| Spec concept | Salesforce artifact |
| --- | --- |
| Rule IDs R1–Rn | Custom Metadata Type `Eligibility_Rule__mdt` |
| `DecisionResult.decision` | Picklist on `Contribution_Review__c` |
| `reasons[]` | Long Text Area + structured child `Review_Flag__c` |
| Batch CSV import | LWC + Queueable / Batch Apex calling the same rule codes |
| Contract tests | Apex tests + Jest LWC tests mirroring AC1–AC6 |

## Why domain-first

1. Agents iterate faster against Vitest than against org scratch spins.
2. Rules stay portable across Experience Cloud, Flow, and external ETL.
3. The SPEC remains the source of truth; Apex becomes an adapter.

## Agentforce / LLM features (future)

- Tool calling into `evaluateContribution` for staff copilots.
- Evaluation harness: golden contribution fixtures + expected decisions.
- Cost control: deterministic rules first; LLM only for narrative “why” text.
