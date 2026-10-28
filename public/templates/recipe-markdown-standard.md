# [Recipe name]

<!-- Use the manager's Skill Port Recipe Standard v1. Replace every bracketed value. Use TBD or UNVERIFIED for unknowns and explain why. Use Not applicable with a reason when relevant. -->

## A. Identity and ownership
- Recipe ID:
- Name:
- Version:
- Status:
- Owner or publisher:
- Category and tags:
- Summary:
- Changelog:
- Dependencies and compatibility:
- Evidence status:

## B. Capability register and callable objects
<!-- For each package, capability, operation/tool, object/resource, variant, and binding, record applicable fields. Separate registry-confirmed items from proposed or unverified items. -->
- Inventory of declared objects and their details:

## C. Intent and applicability
<!-- Explain the applicable intent, preconditions and ambiguity policy. -->
- User problem and desired outcome:
- Trigger or entry conditions:
- Applicable and out-of-scope situations:
- Required inputs, prerequisites and capabilities:
- Unsupported or missing capabilities:
- Verified facts versus assumptions:
- Ambiguity policy: ask, safe default, or stop:

## D. Inputs and outputs
<!-- Describe each input/output contract. -->
- Inputs:
- Outputs:
- Fictional valid input and output examples:

## E. Constraints and budgets
<!-- Unknown limits should be marked TBD, not assumed unlimited. -->
- Hard constraints and soft preferences:
- Resource, tenant and data-source boundaries:
- External transfers permitted:
- Time, cost/token, maximum-step, retry/correction, rate and concurrency budgets:
- Retention/logging limits, prohibited actions and stop conditions:

## F. CRUD and side effects
<!-- Mark each action allowed, not allowed, or approval required. -->
| Operation | Resource or fields | Preconditions and limits | Approval | Verification |
| --- | --- | --- | --- | --- |
| Create | | | | |
| Read | | | | |
| Update | | | | |
| Delete | | | | |
| External side effect | | | | |
- Idempotency/duplicate prevention, expected side effects, compensation/rollback, irreversible effects, ambiguous-outcome reconciliation:

## G. Autonomy and approval policy
<!-- State exactly what may happen autonomously and when a human must approve. -->
- Default autonomy (A0–A3) and planning/execution/verification/recovery levels:
- Exact approval checkpoints and scope:
- Allowed actions and actions never permitted:
- Clarification/escalation triggers:
- Safe state after stop, cancellation or escalation:

## H. Execution plan
<!-- For each ordered step, give stable ID/name, objective, verified capability/tool, input mapping, dependencies, preconditions, side effects, approvals, timeout/retry, idempotency, postconditions, verification, failure route, and evidence. -->
- Ordered steps:

## I. Continuous verification
<!-- For each check, state assertion, evidence source, pass/fail rule and failure response. -->
- Checks and evidence:

## J. Self-correction and recovery
<!-- Recovery must not weaken constraints or conceal failed checks. -->
- Failure classes:
- Permitted and forbidden corrections:
- Maximum correction cycles and required re-verification:
- Stop conditions and recovery/compensation:
- What must be reported to the user:

## K. Independent challenge
<!-- Challenge critical assumptions and seek contradictory evidence. -->
- Assumptions to challenge and alternative approaches:
- Contradictory evidence to seek:
- Incompleteness/misleading-output risks:
- Critical assertions needing independent verification:
- Findings that require rework, disclosure or escalation:

## L. Human escalation
<!-- Escalate when authorization, ambiguity, risk or recovery boundaries require human judgment. -->
- Trigger and why the agent cannot decide safely:
- Evidence and exact decision requested:
- Options and consequences:
- Safe behavior while waiting; decline/timeout behavior:
- Resume conditions and re-authorization:

## M. Completion conditions
<!-- Define testable conditions and distinct completion outcomes. -->
- Mandatory, testable completion conditions:
- Required side-effect/evidence/challenge disclosures:
- Define distinct outcomes: completed, partially_completed, blocked, failed, cancelled:

## N. Final output contract
<!-- Define the exact deliverable and data that must not be disclosed. -->
- Exact deliverable and required sections:
- Run/recipe/version/status and step results, where supported:
- Outputs, verification, evidence, approvals, side effects, corrections and unresolved challenges:
- Limitations, remaining work and escalation state:
- Sensitive information to exclude:

## O. Learning and revision
<!-- Any proposed revision requires evidence, tests and promotion approval. -->
- Outcome metrics and evidence allowed to be retained:
- Data minimization and retention:
- Lesson format and review owner:
- Tests and approval required before promoting a revision:

## P. Testing and publication readiness
<!-- For each test record expected behavior, actual result/status and evidence. Explain any not-applicable test. -->
- Test cases, outcomes and evidence:
- Publication/release blockers and review status:

## Q. Open questions and known limitations
<!-- Keep unresolved design decisions, unverified capabilities, environmental assumptions and risks visible. -->
- Unresolved design decisions, unverified capabilities, environmental assumptions and known risks:
- Owner and next action for each open item:
