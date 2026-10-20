import { createExampleLoader } from '../examples/fdl-input/example-module-loader';
import { field, Record as BizalleleRecord } from '../src';

it('runs saved TypeScript model and view files against the same fresh model', () => {
    const original = {
        './model.ts': `import { field, Record } from 'bizallele';
            export const person = new Record({ name: field.label('Original') }, { name: 'Ada' });`,
        './view.ts': `import { person } from './model';
            export function label(): string { return person.field('name').label; }`,
    };
    const external = { bizallele: { field, Record: BizalleleRecord } };
    const first = createExampleLoader(original, external);
    expect(first('./view.ts').label()).toBe('Original');
    const edited = createExampleLoader(
        { ...original, './model.ts': original['./model.ts'].replace('Original', 'Edited') },
        external
    );
    expect(edited('./view.ts').label()).toBe('Edited');
    expect(edited('./model.ts').person).not.toBe(first('./model.ts').person);
    edited('./model.ts').person.addField('name', field.label('Shared'));
    expect(edited('./view.ts').label()).toBe('Shared');
});

it('supports relative dependencies and raw stylesheet imports', () => {
    const load = createExampleLoader(
        {
            './view.ts': `import css from './example.css?raw'; import { value } from './nested/state.js'; export const result = css + value;`,
            './example.css': 'color: red;',
            './nested/state.js': `import { value as initial } from '../data'; export const value = initial + 1;`,
            './data.ts': 'export const value: number = 2;',
        },
        {}
    );
    expect(load('./view.ts').result).toBe('color: red;3');
});

it('reports syntax, runtime and missing-import errors with the filename', () => {
    expect(() =>
        createExampleLoader({ './model.ts': 'export const value = ;' }, {})('./model.ts')
    ).toThrow('./model.ts:1:');
    expect(() =>
        createExampleLoader({ './view.ts': 'throw new Error("Fix me");' }, {})('./view.ts')
    ).toThrow('./view.ts: Fix me');
    expect(() =>
        createExampleLoader({ './view.ts': 'import "./missing";' }, {})('./view.ts')
    ).toThrow('Cannot find ./missing imported by ./view.ts');
});
