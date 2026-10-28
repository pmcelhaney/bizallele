/** @jest-environment node */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');

const workflow = YAML.parse(
    fs.readFileSync(
        path.join(__dirname, '../.github/workflows/manual-acceptance-tests.yaml'),
        'utf8'
    )
);
const steps = workflow.jobs['manual-acceptance-tests'].steps;
const decide = steps.find(function (step) {
    return step.id === 'decide';
});
const validate = steps.find(function (step) {
    return step.name === 'Validate PR body';
});

function runAcceptance(branch, body, labels = []) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bizallele-acceptance-'));
    const output = path.join(directory, 'output');
    const env = {
        ...process.env,
        PR_BRANCH: branch,
        PR_BODY: body,
        PR_LABELS: JSON.stringify(labels),
        GITHUB_OUTPUT: output,
    };
    try {
        const decision = spawnSync('bash', ['-e', '-c', decide.run], { env, encoding: 'utf8' });
        if (decision.error) throw decision.error;
        expect(decision.status).toBe(0);
        if (fs.readFileSync(output, 'utf8').trim() === 'enforce=false') return 'skipped';
        const validation = spawnSync('bash', ['-e', '-c', validate.run], { env, encoding: 'utf8' });
        if (validation.error) throw validation.error;
        if (validation.status !== 0 && validation.status !== 1) {
            throw new Error(validation.stderr || validation.stdout);
        }
        return validation.status === 0 ? 'passed' : 'failed';
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

const complete = '## Manual acceptance tests\n\n- [x] Observable result confirmed.\n';
const pending = '## Manual acceptance tests\n\n- [ ] Observable result pending.\n';

test.each([
    ['Codex branch requires a section', 'codex/example', '', [], 'failed'],
    ['Copilot branch requires a section', 'copilot/example', '', [], 'failed'],
    ['human PR can omit a section', 'fix/example', '', [], 'skipped'],
    ['human PR opts in with a section', 'fix/example', pending, [], 'failed'],
    ['Codex PR awaits acceptance', 'codex/example', pending, [], 'failed'],
    ['completed acceptance passes', 'codex/example', complete, [], 'passed'],
    ['mixed completion fails', 'codex/example', complete + '- [ ] Still pending.\n', [], 'failed'],
    ['empty checklist fails', 'codex/example', '## Manual acceptance tests\n', [], 'failed'],
    ['design label exempts a PR', 'codex/example', pending, ['design'], 'skipped'],
    [
        'reviewer opt-out exempts a PR',
        'codex/example',
        pending,
        ['skip-manual-acceptance-tests'],
        'skipped',
    ],
    ['unrelated label does not exempt a PR', 'codex/example', pending, ['bug'], 'failed'],
    [
        'later sections do not count as acceptance',
        'codex/example',
        '## Manual acceptance tests\n\n## Validation\n- [x] Automated checks pass.\n',
        [],
        'failed',
    ],
    [
        'unchecked tasks outside acceptance do not block',
        'codex/example',
        complete + '\n## Follow-up\n- [ ] Future work.\n',
        [],
        'passed',
    ],
    [
        'heading and checked markers are case insensitive',
        'fix/example',
        '## MANUAL ACCEPTANCE TESTS\n- [X] Confirmed.\n',
        [],
        'passed',
    ],
    [
        'PR text is treated as data',
        'codex/example',
        complete + '- [x] $(exit 42) `exit 42` "quoted"\n',
        [],
        'passed',
    ],
])('%s', function (_name, branch, body, labels, expected) {
    expect(runAcceptance(branch, body, labels)).toBe(expected);
});

test('PR body and label changes rerun validation, with merge queue support', function () {
    expect(workflow.on.pull_request.types).toEqual(
        expect.arrayContaining([
            'opened',
            'edited',
            'synchronize',
            'reopened',
            'labeled',
            'unlabeled',
        ])
    );
    expect(workflow.on.merge_group.types).toContain('checks_requested');
    expect(decide.if).toBe("github.event_name == 'pull_request'");
    expect(validate.if).toBe(
        "github.event_name == 'pull_request' && steps.decide.outputs.enforce == 'true'"
    );
    expect(steps[0].if).toBe("github.event_name == 'merge_group'");
});
