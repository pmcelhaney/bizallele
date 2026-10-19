import FieldTypeBuilder from '../src/field-type-builder';
import FormElement from '../src/form-element';
import Record from '../src/record.js';

const testTag = 'test-accessible-form-element';

if (!customElements.get(testTag)) {
    customElements.define(testTag, class extends FormElement {});
}

type TestFormElement = FormElement & {
    updateComplete: Promise<boolean>;
};

async function renderField(record: Record, field: string, showValidationErrors = false) {
    const element = document.createElement(testTag) as TestFormElement;
    element.field = field;
    element.record = record;
    element.showValidationErrors = showValidationErrors;
    document.body.append(element);

    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    return element;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('FormElement accessibility', () => {
    it('gives each instance a stable unique control id and associates its label', async () => {
        const fieldType = new FieldTypeBuilder().label('Full name');
        const first = await renderField(new Record({ name: fieldType }, { name: 'Ada' }), 'name');
        const second = await renderField(
            new Record({ name: fieldType }, { name: 'Grace' }),
            'name'
        );

        const firstInput = first.shadowRoot?.querySelector('input') as HTMLInputElement;
        const secondInput = second.shadowRoot?.querySelector('input') as HTMLInputElement;
        const firstLabel = first.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const secondLabel = second.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const originalFirstId = firstInput.id;

        expect(firstInput.id).toMatch(/^form-element-control-\d+$/);
        expect(secondInput.id).toMatch(/^form-element-control-\d+$/);
        expect(firstInput.id).not.toBe(secondInput.id);
        expect(firstLabel.htmlFor).toBe(firstInput.id);
        expect(secondLabel.htmlFor).toBe(secondInput.id);
        expect(first.shadowRoot?.querySelectorAll(`#${firstInput.id}`)).toHaveLength(1);
        expect(second.shadowRoot?.querySelectorAll(`#${secondInput.id}`)).toHaveLength(1);

        first.record?.parseAndSetField('name', 'Augusta Ada');
        await first.updateComplete;
        expect(firstInput.id).toBe(originalFirstId);
    });

    it('renders a labeled semantic output for a read-only field', async () => {
        const record = new Record(
            { status: new FieldTypeBuilder().label('Status').readOnly() },
            { status: 'Approved' }
        );
        const element = await renderField(record, 'status');

        const label = element.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const output = element.shadowRoot?.querySelector('output') as HTMLOutputElement;

        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        expect(output.value).toBe('Approved');
        expect(label.htmlFor).toBe(output.id);
        expect(output.getAttribute('aria-labelledby')).toBe(label.id);
    });

    it('lets the adapter control when synchronous model errors are exposed', async () => {
        const record = new Record(
            { name: new FieldTypeBuilder().label('Full name').required() },
            { name: '' }
        );
        const element = await renderField(record, 'name');
        const input = element.shadowRoot?.querySelector('input') as HTMLInputElement;

        expect(record.isValid('name')).toBe(false);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.hasAttribute('aria-describedby')).toBe(false);
        expect(element.shadowRoot?.querySelector('.validation-error')).toBeNull();

        input.setAttribute('aria-describedby', 'field-help');
        element.showValidationErrors = true;
        await element.updateComplete;

        const error = element.shadowRoot?.querySelector('.validation-error') as HTMLElement;
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
            'field-help',
            error.id,
        ]);
        expect(error.isConnected).toBe(true);
        expect(error.textContent).toContain('Full name is required');

        record.parseAndSetField('name', 'Ada');
        await element.updateComplete;

        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(element.shadowRoot?.querySelector('.validation-error')).toBeNull();
    });
});

it('resolves field settings from the current value and record as dependencies change', async () => {
    const label = jest.fn(
        (record: Record<any>) => `${record.getField('prefix')}:${record.getField('text')}`
    );
    const required = jest.fn((record: Record<any>) => record.getField('locked'));
    const text = new FieldTypeBuilder<string>()
        .label(label)
        .placeholder(record => `${record.getField('prefix')}:${record.getField('text')}`)
        .type(record => (record.getField('locked') ? 'password' : 'text'))
        .required(required)
        .disabled(record => record.getField('locked'))
        .minLength(record => record.getField('minimum'))
        .maxLength(record => record.getField('maximum'));
    const record = new Record(
        {
            text,
            prefix: new FieldTypeBuilder(),
            locked: new FieldTypeBuilder(),
            minimum: new FieldTypeBuilder(),
            maximum: new FieldTypeBuilder(),
        },
        { text: 'Ada', prefix: 'Name', locked: false, minimum: 2, maximum: 10 }
    );
    const element = await renderField(record, 'text');
    const input = element.shadowRoot!.querySelector('input')!;
    expect(input.placeholder).toBe('Name:Ada');
    expect(element.shadowRoot!.querySelector('label')!.textContent).toContain('Name:Ada');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(10);
    expect(input.required).toBe(false);
    expect(input.disabled).toBe(false);
    record.setFields({ prefix: 'Person', locked: true, minimum: 4, maximum: 8 });
    await element.updateComplete;
    expect(input.placeholder).toBe('Person:Ada');
    expect(input.type).toBe('password');
    expect(input.minLength).toBe(4);
    expect(input.maxLength).toBe(8);
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(record.isValid('text')).toBe(false);
    expect(label).toHaveBeenCalledWith(record);
    expect(required).toHaveBeenCalledWith(record);
});

it('shows a spinner, busy state, and disabled select while options load, and ignores stale results', async () => {
    let resolveFirst!: (options: { text: string; value: string }[]) => void;
    let resolveSecond!: (options: { text: string; value: string }[]) => void;
    const first = new Promise<{ text: string; value: string }[]>(resolve => {
        resolveFirst = resolve;
    });
    const second = new Promise<{ text: string; value: string }[]>(resolve => {
        resolveSecond = resolve;
    });
    const fetch = jest.fn((record: Record<any>) =>
        record.getField('zip') === '28202' ? first : second
    );
    const record = new Record(
        {
            zip: new FieldTypeBuilder(),
            store: new FieldTypeBuilder().label('Pickup store').options({ fields: ['zip'], fetch }),
        },
        { zip: '28202', store: '' }
    );
    const element = await renderField(record, 'store');
    const select = element.shadowRoot!.querySelector('select')!;
    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(element.shadowRoot!.querySelector('.options-spinner')).not.toBeNull();
    expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
        'Loading choices'
    );
    // Changes during the initial request must be observed immediately.
    record.setField('zip', '10001');
    await element.updateComplete;
    resolveSecond([{ text: 'Chelsea store', value: 'chelsea' }]);
    await record.field('store').options();
    await element.updateComplete;
    expect(select.disabled).toBe(false);
    expect(select.hasAttribute('aria-busy')).toBe(false);
    expect(element.shadowRoot!.querySelector('.options-spinner')).toBeNull();
    expect([...select.options].map(option => option.value)).toEqual(['chelsea']);
    resolveFirst([{ text: 'Uptown store', value: 'uptown' }]);
    await first;
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    expect([...select.options].map(option => option.value)).toEqual(['chelsea']);
    record.setField('store', 'chelsea');
    await element.updateComplete;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(select.disabled).toBe(false);
    expect(select.value).toBe('chelsea');
});

it('renders a control-owned prompt and defers options for a disabled dropdown', async () => {
    const fetch = jest.fn(() => [{ text: 'Uptown store', value: 'uptown' }]);
    const record = new Record(
        {
            ready: new FieldTypeBuilder(),
            store: new FieldTypeBuilder()
                .disabled(record => !record.getField('ready'))
                .options({ fetch }),
        },
        { ready: false, store: '' }
    );
    const element = await renderField(record, 'store');
    element.selectPrompt = 'Select a store';
    await element.updateComplete;
    const select = element.shadowRoot!.querySelector('select')!;
    expect(select.disabled).toBe(true);
    expect(select.options[0].textContent).toBe('Select a store');
    expect(fetch).not.toHaveBeenCalled();
    expect(element.shadowRoot!.querySelector('.options-spinner')).toBeNull();
    record.setField('ready', true);
    await record.whenOptionsReady();
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    expect(select.disabled).toBe(false);
    expect([...select.options].map(option => option.value)).toEqual(['', 'uptown']);
    expect(await record.optionsForField('store')).toEqual([
        { text: 'Uptown store', value: 'uptown' },
    ]);
});

describe('automatic validation display', () => {
    function inputOf(element: FormElement) {
        return element.shadowRoot!.querySelector('input, select, textarea') as HTMLInputElement;
    }

    function blur(element: FormElement) {
        inputOf(element).focus();
        inputOf(element).blur();
    }

    function errorOf(element: FormElement) {
        return element.shadowRoot!.querySelector('.validation-error');
    }

    it('waits for blur, then updates errors as the user edits', async () => {
        const record = new Record(
            { name: new FieldTypeBuilder().label('Name').required() },
            { name: '' }
        );
        const element = await renderField(record, 'name');
        expect(errorOf(element)).toBeNull();
        const input = inputOf(element);
        blur(element);
        await element.updateComplete;
        expect(errorOf(element)?.textContent).toContain('Name is required');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe(errorOf(element)!.id);
        input.value = 'Ada';
        input.dispatchEvent(new Event('input'));
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        input.value = '';
        input.dispatchEvent(new Event('input'));
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
    });

    it('reveals a previously valid existing value on a dependency blur, but leaves a newly required empty field quiet', async () => {
        const record = new Record(
            {
                minimum: new FieldTypeBuilder().type('number'),
                amount: new FieldTypeBuilder().type('number').validator({
                    name: 'must meet the minimum',
                    validate: (value: number, _view: unknown, owner: Record<any>) =>
                        value >= owner.getField('minimum'),
                }),
                notes: new FieldTypeBuilder()
                    .label('Notes')
                    .required((owner: Record<any>) => owner.getField('minimum') > 5),
            },
            { minimum: 1, amount: 5, notes: '' }
        );
        const minimum = await renderField(record, 'minimum');
        const amount = await renderField(record, 'amount');
        const notes = await renderField(record, 'notes');
        record.setField('minimum', 10);
        await Promise.all([minimum.updateComplete, amount.updateComplete, notes.updateComplete]);
        expect(errorOf(amount)).toBeNull();
        expect(errorOf(notes)).toBeNull();
        blur(minimum);
        await Promise.all([amount.updateComplete, notes.updateComplete]);
        expect(errorOf(amount)?.textContent).toContain('must meet the minimum');
        expect(inputOf(notes).required).toBe(true);
        expect(errorOf(notes)).toBeNull();
        blur(notes);
        await notes.updateComplete;
        expect(errorOf(notes)?.textContent).toContain('Notes is required');
        record.setField('minimum', 1);
        await Promise.all([amount.updateComplete, notes.updateComplete]);
        expect(errorOf(amount)).toBeNull();
        expect(errorOf(notes)).toBeNull();
    });

    it('handles select blur and ignores focus moving within a compound control', async () => {
        const record = new Record(
            { choice: new FieldTypeBuilder().label('Choice').required().options(['A', 'B']) },
            { choice: '' }
        );
        const element = await renderField(record, 'choice');
        const sibling = document.createElement('button');
        element.shadowRoot!.append(sibling);
        inputOf(element).dispatchEvent(
            new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget: sibling })
        );
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
        blur(element);
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
    });

    it('shows untouched errors on form submit and clears display state on reset', async () => {
        const form = document.createElement('form');
        document.body.append(form);
        const record = new Record(
            { name: new FieldTypeBuilder().label('Name').required() },
            { name: '' }
        );
        const element = await renderField(record, 'name');
        form.append(element);
        await element.updateComplete;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
        form.dispatchEvent(new Event('reset', { cancelable: true }));
        await Promise.resolve();
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
        expect(record.isValid('name')).toBe(false);
        blur(element);
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
        element.resetValidation();
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
    });

    it('does not reveal a newly visible untouched field on another field blur', async () => {
        const record = new Record(
            {
                reveal: new FieldTypeBuilder(),
                name: new FieldTypeBuilder()
                    .required()
                    .visible((owner: Record<any>) => owner.getField('reveal')),
            },
            { reveal: false, name: '' }
        );
        const reveal = await renderField(record, 'reveal');
        const name = await renderField(record, 'name');
        record.setField('reveal', true);
        blur(reveal);
        await name.updateComplete;
        expect(errorOf(name)).toBeNull();
    });
    it('isolates submit attempts to the containing form, including nested shadow roots', async () => {
        const firstForm = document.createElement('form');
        const otherForm = document.createElement('form');
        const host = document.createElement('div');
        const root = host.attachShadow({ mode: 'open' });
        firstForm.append(host);
        document.body.append(firstForm, otherForm);
        const record = new Record({ name: new FieldTypeBuilder().required() }, { name: '' });
        const first = await renderField(record, 'name');
        const other = await renderField(record, 'name');
        root.append(first);
        otherForm.append(other);
        await Promise.all([first.updateComplete, other.updateComplete]);
        firstForm.dispatchEvent(new Event('submit', { cancelable: true }));
        await Promise.all([first.updateComplete, other.updateComplete]);
        expect(errorOf(first)).not.toBeNull();
        expect(errorOf(other)).toBeNull();
        firstForm.addEventListener('reset', event => event.preventDefault());
        firstForm.dispatchEvent(new Event('reset', { cancelable: true }));
        await Promise.resolve();
        await first.updateComplete;
        expect(errorOf(first)).not.toBeNull();
    });

    it('starts fresh when rebound and removes subscriptions to the old record', async () => {
        const definitions = { name: new FieldTypeBuilder().required() };
        const oldRecord = new Record(definitions, { name: '' });
        const nextRecord = new Record(definitions, { name: '' });
        const element = await renderField(oldRecord, 'name');
        blur(element);
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
        element.record = nextRecord;
        await element.updateComplete;
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
        oldRecord.announceBlur('name');
        await element.updateComplete;
        expect(errorOf(element)).toBeNull();
        nextRecord.announceBlur('name');
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
        element.remove();
        const update = jest.spyOn(element, 'requestUpdate');
        nextRecord.setField('name', 'Ada');
        nextRecord.announceBlur('name');
        expect(update).not.toHaveBeenCalled();
        document.body.append(element);
        await element.updateComplete;
        const input = inputOf(element);
        input.value = '';
        input.dispatchEvent(new Event('input'));
        expect(nextRecord.getField('name')).toBe('');
        blur(element);
        await element.updateComplete;
        expect(errorOf(element)).not.toBeNull();
    });
});
