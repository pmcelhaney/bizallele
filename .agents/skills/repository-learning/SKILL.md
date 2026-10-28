---
name: repository-learning
description: Capture durable lessons from nontrivial agent-authored work in the same PR, updating the right repository skill or AGENTS.md only when evidence warrants it. Use when completing implementation work or preparing its PR, or when explicitly asked to capture repository learning. Do not impose these author duties when reviewing unrelated PRs.
---

# Repository Learning

Help future contributors avoid repeating a discovered mistake or rediscovering a repository constraint. Record a reusable lesson in the repository's canonical guidance, alongside the work that established it. No learning and no guidance edit is a valid result.

## Workflow

1. **Establish scope and canonical guidance.** Read the user's task, applicable `AGENTS.md`, relevant skills, and the PR template. Inspect the actual change and its evidence. This is an author workflow for nontrivial work, not a retrospective requirement for someone else's PR. When only reviewing an unrelated PR, do not flag a missing learning section or demand guidance edits solely because this skill exists.

2. **Decide whether a durable lesson exists.** Consider reusable rules, patterns, validation steps, compatibility concerns, testing strategies, architectural constraints, and repository conventions discovered through the work. Ground each candidate in inspected code, tests, a reproduced failure, or an explicit repository contract. Distinguish executed checks from inspection and unverified assumptions. Do not invent a lesson, generalize a single observation beyond its evidence, or treat a hypothesis as established guidance.

   Exclude one-off implementation details, temporary workarounds, PR-specific decisions, historical commentary, and task summaries. If no durable learning was discovered, record `Learning found: No` and do not create or modify guidance merely to satisfy the check.

3. **Route the lesson to its owner.** Put domain-specific guidance in the relevant existing `SKILL.md`: for example, runtime and architecture lessons in their domain skill, generator or specification lessons in their domain skill, and build, testing, release, dependency, or contributor-workflow lessons in the maintenance skill. Put conventions that apply throughout the repository in `AGENTS.md`. Use the repository's actual skill names and canonical locations; do not transplant these examples as a mandatory taxonomy.

   Read the destination before editing. If the lesson is already covered, cite that guidance and avoid duplication. Preserve one canonical source and existing conventions. Do not create a parallel instruction tree or silently override contradictory guidance. If the destination or intended rule is materially uncertain, propose the minimal change and identify the unresolved decision.

4. **Make a minimal, supported edit in the same PR.** When the implementation task authorizes repository guidance edits, add only the durable rule and the condition or validation step future contributors need. Keep task narration in the PR. Do not escalate into unrelated instruction changes, alter permissions or approval rules, or rewrite other skills under the pretext of learning. A newly needed skill or a broad policy change requires scope from the user's task; otherwise return a proposal.

   Installing or invoking this skill grants no blanket authority to edit instructions, post, push, create PRs, merge, or share private information. Follow the user's allowed actions and destinations. When only drafting is authorized, return proposed guidance and PR text without changing or publishing it. Do not copy secrets, private transcripts, customer data, or unrelated private context into guidance or PR notes; generalize the lesson without exposing its sensitive source.

5. **Verify and report.** Re-read the final diff and destination guidance. Check that the new rule is supported, correctly scoped, consistent with surrounding instructions, and not duplicated elsewhere. Run relevant documentation or skill checks when available; do not claim behavioral validation from a format check. Include this compact check in the PR description for nontrivial agent-created PRs, adapting only when the repository requires another format:

   ```markdown
   ## Repository learning check

   - Learning found: Yes/No
   - Guidance updated: Yes/No
   - Updated file(s): N/A or list files
   - Rationale: one sentence explaining why repository guidance did or did not need to change
   ```

   If a lesson exists but canonical guidance already covers it, or edits are outside scope, report `Learning found: Yes`, `Guidance updated: No`, and the concrete reason. Identify any proposed edit as a draft. If edits are authorized and needed, include them in the same PR rather than leaving an unrecorded promise. Keep existing template sections and other authors' content intact.

The check records what was learned; it is not independent approval, proof of correctness, or permission to expand the task.
