import FieldTypeBuilder from '../src/field-type-builder';
import Record from '../src/record.js';
import 'bizallele/lit/fdl-field';

type TestElement = HTMLElement & { updateComplete: Promise<boolean> };

const settle = async (element: TestElement) => {
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
};

describe('<fdl-field>', () => {
    it('creates and initializes the native input from the record field type', async () => {
        const record = new Record(
            {
                name: new FieldTypeBuilder()
                    .label('Full name')
                    .placeholder('Ada Lovelace')
                    .required(),
            },
            { name: 'Ada' }
        );

        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'name';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const input = element.shadowRoot?.querySelector('input');
        expect(input?.value).toBe('Ada');
        expect(input?.placeholder).toBe('Ada Lovelace');
        expect(input?.required).toBe(true);
        expect(element.shadowRoot?.querySelector('label')?.textContent).toContain('Full name');

        element.remove();
    });

    it('adds the multiple attribute to a native select for multipleValues()', async () => {
        const record = new Record(
            {
                colors: new FieldTypeBuilder().multipleValues().options([
                    { text: 'Blue', value: 'blue' },
                    { text: 'Green', value: 'green' },
                ]),
            },
            { colors: 'blue' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'colors';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const select = element.shadowRoot?.querySelector('select');
        expect(select?.hasAttribute('multiple')).toBe(true);
        expect((select as HTMLSelectElement)?.multiple).toBe(true);
        element.remove();
    });

    it('round-trips checkbox dropdown selections, model edits, and clearing', async () => {
        const record = new Record(
            {
                colors: new FieldTypeBuilder()
                    .label('Colors')
                    .multipleValues()
                    .options([
                        { text: 'Blue', value: 'blue' },
                        { text: 'Green', value: 'green' },
                    ]),
            },
            { colors: ['blue', 'green'] }
        );
        const element = document.createElement('fdl-field') as TestElement & {
            record: Record;
            field: string;
        };
        element.record = record;
        element.field = 'colors';
        document.body.append(element);
        await settle(element);
        const root = element.shadowRoot!;
        const menu = root.querySelector('details')!;
        const summary = root.querySelector('summary')!;
        const checkboxes = () => [
            ...root.querySelectorAll<HTMLInputElement>('input[type=checkbox]'),
        ];
        expect(root.querySelector('select')!.hidden).toBe(true);
        expect(summary.textContent).toContain('2 selected');
        expect(checkboxes().map(input => input.checked)).toEqual([true, true]);
        menu.open = true;
        checkboxes()[0].click();
        await settle(element);
        expect(record.values.colors).toEqual(['green']);
        expect(summary.textContent).toContain('Green');
        expect(menu.open).toBe(true);
        record.setField('colors', ['blue', 'green']);
        await settle(element);
        expect(checkboxes().map(input => input.checked)).toEqual([true, true]);
        root.querySelector<HTMLButtonElement>('.multiple-actions button')!.click();
        await settle(element);
        expect(record.values.colors).toEqual([]);
        expect(summary.textContent).toContain('Select…');
        root.querySelector<HTMLButtonElement>('.multiple-actions button:last-child')!.click();
        expect(menu.open).toBe(false);
        expect(root.activeElement).toBe(summary);
        menu.open = true;
        checkboxes()[0].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );
        expect(menu.open).toBe(false);
        expect(root.activeElement).toBe(summary);
        menu.open = true;
        document.body.click();
        expect(menu.open).toBe(false);
        element.remove();
    });

    it('exposes required, invalid, and disabled states on the multiple-selection trigger', async () => {
        const record = new Record(
            {
                colors: new FieldTypeBuilder()
                    .label('Colors')
                    .multipleValues()
                    .options([{ text: 'Blue', value: 'blue' }])
                    .required()
                    .validator({
                        name: 'select at least one color',
                        validate: value => Array.isArray(value) && value.length > 0,
                    })
                    .disabled(record => record.getField('locked')),
                locked: new FieldTypeBuilder(),
            },
            { colors: [] as string[], locked: false }
        );
        const element = document.createElement('fdl-field') as TestElement & {
            record: Record;
            field: string;
            showValidationErrors: boolean;
        };
        element.record = record;
        element.field = 'colors';
        element.showValidationErrors = true;
        document.body.append(element);
        await settle(element);
        const root = element.shadowRoot!;
        const summary = root.querySelector('summary')!;
        expect(summary.getAttribute('aria-required')).toBe('true');
        expect(summary.getAttribute('aria-invalid')).toBe('true');
        expect(
            root.getElementById(summary.getAttribute('aria-describedby')!)!.textContent
        ).toContain('select at least one color');
        record.setField('colors', ['blue']);
        await settle(element);
        expect(summary.hasAttribute('aria-invalid')).toBe(false);
        record.setField('locked', true);
        await settle(element);
        expect(summary.getAttribute('aria-disabled')).toBe('true');
        expect(summary.tabIndex).toBe(-1);
        const click = new MouseEvent('click', { cancelable: true });
        summary.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
        expect(root.querySelector('fieldset')!.disabled).toBe(true);
        element.remove();
    });

    it('creates a textarea without assigning an unsupported input type', async () => {
        const record = new Record({ notes: new FieldTypeBuilder().rowCount(3) }, { notes: '' });
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'notes';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(element.shadowRoot?.querySelector('textarea')?.rows).toBe(3);
        element.remove();
    });

    it('creates a native select from the field metadata and loads its options', async () => {
        const record = new Record(
            {
                status: new FieldTypeBuilder().options([
                    { text: 'Draft', value: 'draft' },
                    { text: 'Approved', value: 'approved' },
                ]),
            },
            { status: 'approved' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'status';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const select = element.shadowRoot?.querySelector('select');
        expect(select?.value).toBe('approved');
        expect([...(select?.options ?? [])].map(option => option.textContent)).toEqual([
            'Draft',
            'Approved',
        ]);
        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        element.remove();
    });

    it('does not render a field when visible() returns false', async () => {
        const record = new Record(
            { address: new FieldTypeBuilder().label('Address').visible(() => false) },
            { address: '' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'address';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(element.shadowRoot?.querySelector('label')).toBeNull();
        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        element.remove();
    });
});

describe('native input masks', () => {
    async function maskedField(control: string = 'input') {
        const definition = new FieldTypeBuilder<string>().inputMask(/[0-9.]/);
        const record = new Record(
            { value: control === 'textarea' ? definition.rowCount(2) : definition },
            { value: '12.3' }
        );
        const element = document.createElement('fdl-field') as TestElement & {
            record: Record;
            field: string;
        };
        element.record = record;
        element.field = 'value';
        document.body.append(element);
        await settle(element);
        const input = element.shadowRoot!.querySelector('input, textarea') as
            HTMLInputElement | HTMLTextAreaElement;
        return { record, element, input };
    }

    it('ignores rejected typing without replacing the selected text', async () => {
        const { record, element, input } = await maskedField();
        input.setSelectionRange(1, 3);
        const rejected = new InputEvent('beforeinput', {
            data: 'x',
            inputType: 'insertText',
            cancelable: true,
        });
        input.dispatchEvent(rejected);
        expect(rejected.defaultPrevented).toBe(true);
        expect(input.value).toBe('12.3');
        expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3]);
        expect(record.getField('value')).toBe('12.3');
        const accepted = new InputEvent('beforeinput', {
            data: '4',
            inputType: 'insertText',
            cancelable: true,
        });
        input.dispatchEvent(accepted);
        expect(accepted.defaultPrevented).toBe(false);
        element.remove();
    });

    it.each(['input', 'textarea'])(
        'filters mixed pasted text in a native %s and preserves the caret',
        async control => {
            const { record, element, input } = await maskedField(control);
            input.value = '1a😀4.2b3';
            input.setSelectionRange(8, 8);
            input.dispatchEvent(new InputEvent('input', { inputType: 'insertFromPaste' }));
            await settle(element);
            expect(input.value).toBe('14.23');
            expect(record.getField('value')).toBe('14.23');
            expect(input.selectionStart).toBe(4);
            // Deletion and clearing remain ordinary editing operations.
            input.value = '';
            input.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
            expect(record.getField('value')).toBe('');
            element.remove();
        }
    );

    it('waits for composition to finish before filtering and storing input', async () => {
        const { record, element, input } = await maskedField();
        input.dispatchEvent(new Event('compositionstart'));
        input.value = '12あ4';
        input.dispatchEvent(new InputEvent('input', { isComposing: true }));
        expect(input.value).toBe('12あ4');
        expect(record.getField('value')).toBe('12.3');
        input.dispatchEvent(new Event('compositionend'));
        await settle(element);
        expect(input.value).toBe('124');
        expect(record.getField('value')).toBe('124');
        element.remove();
    });

    it('filters before parsing while leaving programmatic model values untouched', async () => {
        const record = new Record(
            { value: new FieldTypeBuilder<number>().inputMask(/[0-9]/).parser(Number) },
            { value: 12 }
        );
        const element = document.createElement('fdl-field') as TestElement & {
            record: Record;
            field: string;
        };
        element.record = record;
        element.field = 'value';
        document.body.append(element);
        await settle(element);
        const input = element.shadowRoot!.querySelector('input')!;
        input.value = '3a4';
        input.dispatchEvent(new Event('input'));
        expect(record.getField('value')).toBe(34);
        record.setField('value', -9);
        await settle(element);
        expect(input.value).toBe('-9');
        element.remove();
    });
});

it('preserves currency editing text and caret while parsing, then formats on blur', async () => {
    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const record = new Record(
        {
            money: new FieldTypeBuilder<number>()
                .formatter(value => currency.format(value))
                .parser(value => Number(String(value).replace(/[$,]/g, ''))),
        },
        { money: 1000 }
    );
    const element = document.createElement('fdl-field') as TestElement & {
        record: Record;
        field: string;
    };
    element.record = record;
    element.field = 'money';
    document.body.append(element);
    await settle(element);
    const input = element.shadowRoot!.querySelector('input')!;
    input.focus();
    for (const [text, value] of [
        ['', 0],
        ['1', 1],
        ['12', 12],
        ['12.', 12],
        ['12.3', 12.3],
        ['12.30', 12.3],
    ] as const) {
        input.value = text;
        input.setSelectionRange(text.length, text.length);
        input.dispatchEvent(new Event('input'));
        await settle(element);
        expect(input.value).toBe(text);
        expect(input.selectionStart).toBe(text.length);
        expect(record.getField('money')).toBe(value);
    }
    input.value = '192.30';
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event('input'));
    await settle(element);
    expect(input.value).toBe('192.30');
    expect(input.selectionStart).toBe(2);
    expect(record.getField('money')).toBe(192.3);
    input.blur();
    expect(input.value).toBe('$192.30');
    record.setField('money', 45.6);
    await settle(element);
    expect(input.value).toBe('$45.60');
    element.remove();
});

it.each(['checkbox', 'radio'] as const)(
    'synchronizes native %s checked state as a Boolean',
    async type => {
        const record = new Record({ value: new FieldTypeBuilder().type(type) }, { value: false });
        const element = document.createElement('fdl-field') as TestElement & {
            record: Record;
            field: string;
        };
        element.record = record;
        element.field = 'value';
        document.body.append(element);
        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;
        const input = element.shadowRoot!.querySelector('input')!;
        expect(input.checked).toBe(false);
        input.click();
        await element.updateComplete;
        expect(record.getField('value')).toBe(true);
        record.setField('value', false);
        await element.updateComplete;
        expect(input.checked).toBe(false);
        input.dispatchEvent(new Event('blur'));
        expect(record.getField('value')).toBe(false);
        element.remove();
    }
);

it('does not try to assign a nonempty model value to a native file picker', async () => {
    const record = new Record(
        { value: new FieldTypeBuilder().type('file') },
        { value: 'C:\\fakepath\\notes.txt' }
    );
    const element = document.createElement('fdl-field') as TestElement & {
        record: Record;
        field: string;
    };
    element.record = record;
    element.field = 'value';
    document.body.append(element);
    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    const input = element.shadowRoot!.querySelector('input')!;
    expect(input.type).toBe('file');
    expect(input.value).toBe('');
    expect(() => input.dispatchEvent(new Event('blur'))).not.toThrow();
    record.setField('value', 'another-file.txt');
    await element.updateComplete;
    expect(input.value).toBe('');
    record.setField('value', '');
    await element.updateComplete;
    expect(input.value).toBe('');
    element.remove();
});
