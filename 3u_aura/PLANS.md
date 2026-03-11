# PLANS.md — 3U AURA Execution Plan Template for Codex

This file defines how Codex should write task-specific `plan.md` files for this repository.

OpenAI recommends using a separate planning document for longer or more complex work, instead of trying to encode all planning detail directly inside `AGENTS.md`. This file is the repository-specific template for those execution plans. citeturn256092search1turn256092search10

## When a plan is required
Codex must create or update a task-specific `plan.md` before implementation when the task is:

- Major
- Critical
- multi-file
- architecture-affecting
- schema-affecting
- contract-affecting
- payment / reward / claim / settlement related
- tree-logic related
- unclear enough that assumptions need to be written down

## Where plans live
Each task gets its own directory:

- `docs/plan-excution/<task-name>/plan.md`
- `docs/plan-excution/<task-name>/execution.md`

Optional milestone files may live under:

- `docs/plan-excution/<task-name>/milestones/`

## Planning principles
1. Plans must be hierarchical, not flat.
2. Plans must be concrete enough that a new engineer can execute them from the plan alone.
3. Plans must separate scope from assumptions.
4. Plans must call out risk explicitly.
5. Plans must define milestone-level verification, not just one final verification block.
6. Milestones should be small enough to implement and validate in one iteration.

## Required `plan.md` structure

Every `plan.md` should follow this structure:

```md
# <Task Title>

## 1. Objective
What is being changed and why?

## 2. Scope
What is included in this task?

## 3. Out of Scope
What is explicitly not included?

## 4. Assumptions
What assumptions are being made?
What must be confirmed before implementation?

## 5. Current State
Relevant current architecture, modules, constraints, or known gaps.

## 6. Target State
Describe the desired end state.

## 7. Architecture Impact
List impacted apps/packages/modules and how responsibility changes.

## 8. Risks
List the main technical and product risks.

## 9. Milestones

### Milestone 1 — <name>
**Goal**
- ...

**Affected files/modules**
- ...

**Implementation notes**
- ...

**Risks**
- ...

**Verification**
- commands:
  - ...
- expected result:
  - ...

**Approval checkpoint**
- yes / no

### Milestone 2 — <name>
...

## 10. Rollback / Recovery Notes
How to back out or recover if implementation fails partway?

## 11. Final Verification Checklist
- [ ] ...
- [ ] ...
- [ ] ...

## 12. Approval Request
Explicitly request user approval before implementation.
```

## Milestone requirements
Each milestone must contain:

- a clearly scoped goal
- affected modules/files
- concrete implementation notes
- risks
- verification commands
- expected outputs
- whether it requires an approval checkpoint

## `execution.md` expectations
During execution, Codex should append:

- timestamped progress notes
- files changed
- commands actually run
- summarized outputs
- failed attempts and resolution
- test and verification results
- deviations from plan
- remaining follow-ups

## Extra requirements for Critical tasks
Critical tasks must also include in `plan.md`:

### Risk classification
- funds / rewards / claims / settlement
- schema / migration
- access control / permissions
- replay / idempotency
- cross-app contract drift
- tree consistency

### Safety checklist
- transaction boundary defined
- idempotency strategy defined
- auditability preserved
- rollback strategy noted
- verification commands listed
- manual review checkpoints listed

## Example task names
- `checkin-ledger-transaction-boundary`
- `founder-nft-signature-mint`
- `weekly-lottery-settlement-v1`
- `claim-page-reward-unification`

## Final rule
Codex must not start implementation for Major or Critical work until the user approves the task-specific `plan.md`.
