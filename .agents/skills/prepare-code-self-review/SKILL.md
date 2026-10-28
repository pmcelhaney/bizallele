---
name: prepare-code-self-review
description: Prepare evidence-backed author self-review and publish actual PR review comments automatically as part of authorized pull-request creation or opening, before handing changes to a human reviewer. Prepare drafts when only PR preparation is authorized. Also use when asked for a code self-review, author review notes, decision/tradeoff annotations, or places needing reviewer feedback. Explain material choices, assumptions, verification gaps, and specific human decisions from the actual change. Complement acceptance demos and independent review.
---

# Prepare Code Self-Review

Make the change easier to review by exposing the few decisions, uncertainties, and risks that matter. Ground every note in the user's request, inspected code, or recorded evidence. Do not reconstruct private reasoning, invent the author's intent, narrate every line, or claim independent approval of your own work.

Installing or invoking this skill grants no blanket permission to post comments, push code, merge changes, or share private information. Obtain authority from the user's task for each destination and action. Keep secrets and unrelated private context out of all published notes.

## Workflow

1. **Establish the review scope.** Read applicable repository instructions, the user request and acceptance criteria, and any existing PR template. Identify the base and head or working-tree diff. For an existing PR, verify its repository, number, current head revision, and existing review comments before drafting or publishing. Inspect the full relevant change and nearby contracts, callers, and tests. Distinguish changes you made during this task from inherited or independently authored changes. If provenance or scope is uncertain, state it; do not take credit or assign intent.

2. **Review before writing notes.** Check the implementation against requirements and likely failure paths. Address concrete defects when the existing task authorizes fixes; then recheck the final diff. Otherwise surface the defect and its consequence prominently. Do not turn a known defect into a vague question, bury blockers in routine notes, or expand the implementation scope merely to manufacture annotations.

3. **Select substantive annotation candidates.** Consider:
   - Material choices and tradeoffs: what the change does, why supported requirements or constraints favor it, and a meaningful downside or alternative when evidenced.
   - Assumptions and unverified facts: the dependency or contract being relied on, what supports it, and what happens if it is wrong.
   - Risk and verification gaps: consequential behavior, edge cases, compatibility, migrations, concurrency, security, performance, or operability that relevant evidence does not cover.
   - Human feedback: a specific unresolved domain, product, or design decision, why it matters, and the question a reviewer can answer.

   Treat these as lenses, not required sections or a quota. Prefer a few high-value notes to exhaustive commentary. Omit obvious restatements and generic requests such as "please review this carefully." Do not claim an alternative was evaluated, a fact confirmed, or a tradeoff consciously chosen without evidence. Describe observable consequences separately from inferred rationale.

4. **Verify honestly.** Follow the task's testing requirements and run relevant checks when authorized and feasible. Record commands or concrete evidence, scope, and the final revision tested. Distinguish passed, failed, and not run; for not-run checks, give the reason and resulting gap. Existing tests and newly added tests are different evidence. A focused pass is not a full-suite pass, a demo is not comprehensive test coverage, and code inspection is not execution. Recheck affected behavior after later edits. Preserve any requested acceptance demo and link or refer to it without duplicating it.

5. **Write concise, actionable notes.** Attach each note to an exact current path and line range, symbol, or changed behavior. Verify line numbers against the final diff; use verified permalinks when available, never fabricated URLs. State the decision or uncertainty, the supporting evidence or limitation, its consequence, and the specific feedback needed where applicable. Keep each note to a short paragraph. Use factual authorship language: "This change..." for inherited code; "I changed..." only for work you actually performed. Include a compact verification summary even when there are no material decision notes. If nothing needs annotation, say so briefly rather than inventing a concern.

6. **Publish actual review comments before handoff.** As part of an authorized PR-creation workflow, prepare the self-review, create the PR, and post the routine author comments to that PR automatically. For an existing PR, publish when the user has authorized self-review comments on that destination. Merely adding a self-review section to the PR body does not complete this workflow.
   - Post each material, line-specific note as an inline review comment on the current diff. Verify the head commit, file path, diff side, and line or range immediately before submission; refresh all affected anchors after changes. Do not force a cross-cutting note onto an unrelated line.
   - Put cross-cutting context, verification results and gaps, and unresolved overall blockers in a concise review-summary comment. When supported, submit the inline notes and summary together as a comment-only review. If review submission is unavailable, use a normal PR conversation comment for the summary and any notes that cannot be anchored, clearly identifying their paths or symbols. Never approve your own PR or represent the self-review as independent approval.
   - Read existing self-review comments first. Do not repost unchanged notes or duplicate material across inline comments and the summary. On a later revision, publish only material new or changed information; update your own notes or reply in their existing threads when appropriate. Do not overwrite another author's comments or resolve others' threads without authorization.
   - Keep the PR description focused on its summary, testing, and required template content. Add a verified link to the posted self-review if useful and body editing is within scope; do not replace comments with body text or remove legitimate template sections. Keep source-code comments for durable explanations, not review annotations.

   Respect the user's publication scope. If only preparation or drafting is authorized, return draft comments with their intended anchors and summary, without posting them. If authority to publish is missing, ask for the specific action and PR destination. Skill invocation alone grants no permission to create or edit a PR, request reviews, merge, deploy, change permissions, or publish outside the authorized workflow.

7. **Verify delivery and finish.** Read back the published review and comments on the intended PR; ensure they are submitted rather than merely pending, attached to the intended current revision, and contain the intended text. Capture their verified permalinks for handoff. If publication has an uncertain outcome, check existing comments before retrying to avoid duplicates. If posting fails or is blocked, preserve the drafts, report what was and was not published, and do not claim completion or silently substitute a PR-body edit.

## Compact output shape

Use this shape for review comments or their drafts, adapting to the platform and omitting empty categories. Keep line-specific reviewer-focus notes inline and cross-cutting verification in the review summary.

- **Reviewer focus:** `path:lines` — Choice, assumption, or risk; supporting evidence and consequence. Add a precise question only when human judgment is needed.
- **Verification:** Passed — command/check and scope. Failed — command/check and observed failure. Not run — check, reason, and material gap.
- **Open blocker or decision:** State any unresolved issue that changes readiness, with its next step.

Avoid repeating the same caveat across sections. Keep acceptance evidence, self-review annotations, and independent reviewer approval distinct. A self-review documents the author's evidence and requests for scrutiny; it does not certify the change as correct or ready to merge.
