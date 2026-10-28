---
name: bizallele-pr-creation
description: Create Bizallele pull requests with agent-authored manual acceptance tests and repository-learning notes. Use when creating or opening a PR, not when reviewing another author's PR.
---

# Bizallele PR creation

## Author responsibilities

Every agent-created PR must include a section titled exactly
`## Manual acceptance tests` with 3–6 initially unchecked checklist items.
Describe observable outcomes and give enough setup, actions, and expected
results for a human to perform each check. Cover the main success path, an
edge case, and a regression check where applicable. For documentation or
workflow changes, describe observable documentation or workflow behavior.

- Agents write the checklist; humans perform acceptance and check the boxes.
  Never check manual acceptance boxes yourself, even after running tests or
  exercising the behavior.
- Preserve human-checked boxes when editing an existing PR description.
  Do not infer human acceptance from automated or agent-run verification.
- Report automated checks and agent-run verification in a separate section.
- A failing `Validate manual acceptance tests` check is expected while human
  acceptance is pending. Report it as awaiting human acceptance; do not check
  boxes or apply exemption labels to make the check pass.
- Humans may use `design` for design-only PRs or
  `skip-manual-acceptance-tests` for an explicit reviewer opt-out.
  These exemptions do not remove the agent author's checklist responsibility.
- Reviewing agents must not look for missing acceptance or repository-learning
  sections or treat their absence as a review deficiency. They are author duties.

## Repository learning

For nontrivial work, follow `.agents/skills/repository-learning/SKILL.md` and
include its `## Repository learning check` in the PR description. Update
canonical guidance only when supported durable learning warrants it. No
learning and no guidance change is a valid result.

## Author self-review

Follow `.agents/skills/prepare-code-self-review/SKILL.md` when preparing and
opening the PR. Keep author self-review, automated verification, and human
manual acceptance distinct.

## Workflow contract

The GitHub Action applies to branches beginning with `codex/` or `copilot`,
and to other PRs whose bodies include `## Manual acceptance tests`. It requires
at least one checked item and no unchecked items in that section. The author
instruction to supply 3–6 items is intentionally more specific than the
mechanical check, matching Counterfact's workflow.

Body edits, new commits, reopening, and label changes rerun the check.
Merge-group runs skip body validation because acceptance must pass before
queue admission. Repository rules must require `Validate manual acceptance tests`
for this check to block merging; adding the workflow alone does not configure
branch protection. See `docs/manual-acceptance-tests.md` for reviewer instructions.
