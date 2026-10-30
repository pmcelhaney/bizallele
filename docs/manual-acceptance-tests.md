# Manual acceptance tests

Bizallele uses Counterfact's manual acceptance workflow to give reviewers a
concrete list of observable outcomes to verify before merging a pull request.
Automated checks and agent-run verification provide separate evidence.

## Author a pull request

Agent authors add `## Manual acceptance tests` to the PR description with 3–6
unchecked checklist items. Each item explains the setup, action, and expected
observable result. Include the main success path, an edge case, and a regression
check where applicable. Documentation and workflow changes can be accepted by
observing their documentation or workflow behavior.

```markdown
## Manual acceptance tests

- [ ] Open the local form example, clear a required field, and confirm its validation message appears.
- [ ] Enter a valid value and confirm the validation message clears.
- [ ] Open the table example and confirm numeric totals remain right-aligned.
```

Choose checks appropriate to the change; the example is not a universal checklist.
Agents leave every acceptance box unchecked, even after exercising the behavior.

## Complete human acceptance

1. Read the PR's setup and expected outcomes, then perform each check.
2. Check each box in the PR description only after confirming its outcome.
3. If a check fails, leave it unchecked and describe the failure for the author.
4. Save the description. The action reruns on body edits and passes once the
   section contains at least one checked item and no unchecked items.

An author updating the PR preserves boxes already checked by a human. Passing
unit tests or agent-run checks does not establish human acceptance.

## When the action applies

The `Manual acceptance tests` workflow runs on PR open, edit, synchronize,
reopen, label, and unlabel events. Its `Validate manual acceptance tests` job
validates branches beginning with `codex/` or `copilot`, plus other PRs whose
bodies include the acceptance heading. Other human-authored PRs can omit it.

A human may apply `design` to a design-only PR or
`skip-manual-acceptance-tests` for an explicit reviewer opt-out. Either label
skips validation. Removing the label restores the normal check. Agents must
not apply these labels to bypass acceptance. Merge-group runs pass without
body validation because PR acceptance must be completed before queue admission.

The action checks checklist completion, not who edited the boxes or whether
they actually performed the checks. Human ownership is a contributor rule.

## Require the check before merging

After the workflow is available in GitHub, a repository administrator can add
`Validate manual acceptance tests` as a required status check in the rule or
branch protection applying to `main`. Without that setting, the action reports
acceptance status but does not itself prevent merging. Require the check before
using a merge queue, whose workflow run assumes PR acceptance already passed.

This workflow does not change repository rules or merge any PR. While human
acceptance is pending, its failing check is expected.

See [the contributor guide](../AGENTS.md) for the agent's PR-author responsibilities.
