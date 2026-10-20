import { render } from 'lit';
import type { FdlExample } from '../examples/fdl-input/fdl-example';
import ts from 'typescript';
import { field, Record, Recordset } from '../src/index';
import { renderChangeRule } from '../examples/fdl-input/change-rule-page';
import { renderEditableRecordset } from '../examples/fdl-input/editable-recordset-page';

it('runs the displayed shipment setup and aggregation snippets together', async () => {
    const container = document.createElement('div');
    try {
        render(renderEditableRecordset(), container);
        const code = Array.from(container.querySelectorAll('pre code'))
            .map(block => block.textContent)
            .join('\n')
            .replace("import { field, Recordset } from 'bizallele';", '');
        const run = new Function(
            'field',
            'Recordset',
            `return (async () => {${code}\nreturn {allTotal, visibleTotal, visibleUnits};})();`
        );
        await expect(run(field, Recordset)).resolves.toEqual({
            allTotal: 130,
            visibleTotal: 30,
            visibleUnits: 3,
        });
    } finally {
        render(null, container);
        container.remove();
    }
});

it('runs the displayed tax-ID tests against the displayed model exports', async () => {
    const container = document.createElement('div');
    try {
        document.body.append(container);
        render(renderChangeRule(), container);
        const blocks = Array.from(container.querySelectorAll('pre code')).map(
            block => block.textContent!
        );
        const compile = (source: string) =>
            ts.transpileModule(source, {
                compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
            }).outputText;
        const frame = container.querySelector('fdl-example') as FdlExample;
        await frame.updateComplete;
        const modelSource = frame.shadowRoot!.querySelector('pre code')!.textContent!;
        const model: { [name: string]: any } = {};
        new Function('require', 'exports', compile(modelSource))((name: string) => {
            if (name === 'bizallele') return { field, Record };
            throw new Error(`Unexpected model dependency: ${name}`);
        }, model);
        const cases: (() => void)[] = [];
        const collect = Object.assign((_name: string, test: () => void) => cases.push(test), {
            each: (rows: any[][]) => (_name: string, test: (...args: any[]) => void) =>
                rows.forEach(row => cases.push(() => test(...row))),
        });
        new Function('require', 'exports', 'it', 'expect', compile(blocks[1]))(
            (name: string) => {
                if (name === '../examples/fdl-input/conditional-validation-model') return model;
                throw new Error(`Unexpected test dependency: ${name}`);
            },
            {},
            collect,
            expect
        );
        expect(cases).toHaveLength(6);
        cases.forEach(test => test());
    } finally {
        render(null, container);
        container.remove();
    }
});
