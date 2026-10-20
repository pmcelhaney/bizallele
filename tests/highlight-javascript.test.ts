import { render } from 'lit';
import {
    highlightJavaScript,
    highlightSourceCode,
    highlightModifier,
    modifierLineRange,
    highlightMarkup,
} from '../examples/fdl-input/highlight-javascript';
import { modifierDescriptions } from '../examples/fdl-input/modifier-descriptions';
import { modifierSignatures } from '../examples/fdl-input/modifier-signatures';

it('provides generic help for every supported modifier in actual source', () => {
    expect(Object.keys(modifierDescriptions).sort()).toEqual(
        Object.keys(modifierSignatures).sort()
    );
    const code = `import { field } from 'bizallele';
const address = field.label('Shipping address')
    .visible(whenShipping)
    .required(whenShipping)
    .validator(postalZipValidator);`;
    const container = document.createElement('div');
    render(highlightSourceCode(code), container);
    expect(container.textContent).toBe(code);
    for (const name of ['label', 'visible', 'required', 'validator']) {
        const link = container.querySelector(`a[href="#${name}"]`)!;
        expect(link.getAttribute('title')).toBe(modifierDescriptions[name]);
        expect(link.getAttribute('aria-label')).toBe(
            `${name} modifier. ${modifierDescriptions[name]}`
        );
        expect(link.getAttribute('title')).not.toContain('Shipping address');
    }
});

it('parses spaced modifier calls without linking comments, strings, or non-calls', () => {
    const code = `// field.required()
const note = 'field.visible(whenShipping)';
const definition = field . /* label */ label ('<img src=x>')
    . required /* named condition */ (whenShipping);
const method = definition.validator;
const unrelated = object.constructor();`;
    const container = document.createElement('div');
    render(highlightSourceCode(code), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual([
        '#label',
        '#required',
    ]);
    expect(container.querySelector('img')).toBeNull();
});

it('highlights JavaScript without changing source text or interpreting it as HTML', () => {
    const code =
        "// example\nconst definition = field.label('<img src=x onerror=alert(1)>').validator({ name: 'code', validate: value => /^PRJ-\\d{4}$/.test(value) });";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.syntax-comment')!.textContent).toBe('// example');
    expect(container.querySelector('.syntax-keyword')!.textContent).toBe('const');
    expect(container.querySelector('.syntax-builtin')!.textContent).toBe('field');
    expect(container.querySelector('.syntax-function')!.textContent).toBe('label');
    expect(container.querySelector('.syntax-regex')!.textContent).toBe('/^PRJ-\\d{4}$/');
});

it('links modifier calls to their documentation without changing syntax color', () => {
    const code = "const definition = field.label('Name').required();";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    const link = container.querySelector<HTMLAnchorElement>('a[href="#required"]')!;
    expect(link.textContent).toBe('required');
    expect(link.getAttribute('style')).toContain('color:inherit');
    expect(link.getAttribute('style')).toContain('text-decoration:underline');
    expect(link.getAttribute('title')).toBe(
        'Requires a value for “Name”; leaving it empty fails validation.'
    );
    expect(link.getAttribute('aria-label')).toBe(
        'required modifier. Requires a value for “Name”; leaving it empty fails validation.'
    );
    expect(link.querySelector('.syntax-function')!.textContent).toBe('required');
});

it('explains a validator rule rather than repeating its source', () => {
    const code =
        "const definition = field.label('Name').validator({ name: 'must not be empty', validate: value => value.length > 0 });";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    const link = container.querySelector<HTMLAnchorElement>('a[href="#validator"]')!;
    expect(link.getAttribute('title')).toBe(
        'Checks that “Name” must not be empty; a failing value makes the field invalid.'
    );
});

it('emphasizes the complete formatter call without including unrelated setup', () => {
    const code =
        "const amount = field\n  .label('Amount')\n  .formatter((value) =>\n    String(value)\n  );";
    expect(modifierLineRange(code, 'formatter')).toEqual([2, 4]);
    const container = document.createElement('div');
    render(highlightModifier(code, 'formatter'), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('.focused-line')].map(line => line.textContent)).toEqual([
        '  .formatter((value) =>',
        '    String(value)',
        '  );',
    ]);
});

it('shows HTML bindings as highlighted source without creating controls', () => {
    const code = '<fdl-field .record=${money} field="amount"></fdl-field>';
    const container = document.createElement('div');
    render(highlightMarkup(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('fdl-field')).toBeNull();
    expect(container.querySelector('.syntax-string')!.textContent).toBe('"amount"');
});

it('highlights every modifier call while ignoring lookalikes in comments and strings', () => {
    const code = `// .compareFunction(ignored)
const note = '.compareFunction(ignored)';
first.compareFunction((a, b) => a.localeCompare(b));
second.compareFunction(
  compareShirtSizes
);
third.label('Unrelated');`;
    const container = document.createElement('div');
    render(highlightModifier(code, 'compareFunction'), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('.focused-line')].map(line => line.textContent)).toEqual([
        'first.compareFunction((a, b) => a.localeCompare(b));',
        'second.compareFunction(',
        '  compareShirtSizes',
        ');',
    ]);
});

it('explains the named shipping predicate in terms of delivery behavior', () => {
    const code = `const address = field.label('Shipping address')
      .visible(whenDeliveryMethodRequiresAddress)
      .required(whenDeliveryMethodRequiresAddress);`;
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('a[href="#visible"]')!.getAttribute('title')).toBe(
        'Shows “Shipping address” when the selected delivery method requires an address, otherwise hides it.'
    );
    expect(container.querySelector('a[href="#required"]')!.getAttribute('title')).toBe(
        'Requires a value for “Shipping address” when the selected delivery method requires an address; otherwise it is optional.'
    );
});

it('keeps multi-line calls and repeated modifiers tied to their own fields', () => {
    const code = `const person = new Record({
      name: field.label('Legal name').required(),
      notes: field.label('Follow-up notes').required(
        record => record.getField('followUp') === 'yes'
      ),
    }, {});`;
    const container = document.createElement('div');
    render(highlightModifier(code, 'required'), container);
    expect(container.textContent).toBe(code);
    const links = [...container.querySelectorAll('a[href="#required"]')];
    expect(links.map(link => link.getAttribute('title'))).toEqual([
        'Requires a value for “Legal name”; leaving it empty fails validation.',
        'Requires a value for “Follow-up notes” when follow-up is needed; otherwise it is optional.',
    ]);
    expect(links[1].getAttribute('aria-label')).toContain(links[1].getAttribute('title'));
});

it('uses current values in descriptions as an example changes', () => {
    const container = document.createElement('div');
    for (const minimum of [3, 7]) {
        render(highlightJavaScript(`field.label('Access code').minLength(${minimum})`), container);
        expect(container.querySelector('a[href="#minLength"]')!.getAttribute('title')).toBe(
            `Requires “Access code” to contain at least ${minimum} characters when a value is provided.`
        );
    }
});

it('does not create modifier links from comments or string contents', () => {
    const container = document.createElement('div');
    const code = `// field.required()
const note = "field.visible(isInternational)";
const tax = field.label('Tax ID').visible(isInternational);`;
    render(highlightJavaScript(code), container);
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expect(container.querySelector('a[href="#visible"]')!.getAttribute('title')).toBe(
        'Shows “Tax ID” when the country is outside the US, otherwise hides it.'
    );
});

it('keeps field context when labels and comments contain the word field', () => {
    const container = document.createElement('div');
    render(
        highlightJavaScript(`field.label('Custom field')
      // This field needs a value.
      .required()`),
        container
    );
    expect(container.querySelector('a[href="#required"]')!.getAttribute('title')).toBe(
        'Requires a value for “Custom field”; leaving it empty fails validation.'
    );
});
