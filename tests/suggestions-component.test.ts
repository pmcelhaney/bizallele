import FieldTypeBuilder from '../src/field-type-builder';
import Record from '../src/record.js';
import { number, string } from '../src/primitives.js';
import '../src/lit/fdl-field';
import type { FdlField } from '../src/lit/fdl-field';

type Item = { text: string; value: unknown };
const choices: Item[] = [
    { text: 'Ada Lovelace', value: 42 },
    { text: 'Grace Hopper', value: 73 },
];

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

async function settle(element: FdlField) {
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
}

async function render(record: Record, field = 'person') {
    const element = document.createElement('fdl-field') as FdlField;
    element.record = record;
    element.field = field;
    document.body.append(element);
    await settle(element);
    const input = element.shadowRoot!.querySelector('input')!;
    return { element, input };
}

function model(fetch = jest.fn((): Item[] | Promise<Item[]> => choices)) {
    return new Record(
        { person: new FieldTypeBuilder().label('Person').suggestions({ fetch }) },
        { person: 10 }
    );
}

function type(input: HTMLInputElement, query: string) {
    input.value = query;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
}

function key(input: HTMLInputElement, key: string, isComposing = false) {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        isComposing,
    });
    input.dispatchEvent(event);
    return event;
}

function options(element: FdlField) {
    return [...element.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')];
}

afterEach(() => document.body.replaceChildren());

describe('suggestions in <fdl-field>', () => {
    it('labels a unique combobox and exposes loading, listbox, active option and result status', async () => {
        const request = deferred<Item[]>();
        const fetch = jest.fn(() => request.promise);
        const { element, input } = await render(model(fetch));
        const second = await render(model());
        expect(input.id).not.toBe(second.input.id);
        expect(element.shadowRoot!.querySelector('label')!.htmlFor).toBe(input.id);
        expect(input.getAttribute('role')).toBe('combobox');
        expect(input.getAttribute('aria-autocomplete')).toBe('list');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(fetch).not.toHaveBeenCalled();
        input.focus();
        await settle(element);
        expect(input.getAttribute('aria-busy')).toBe('true');
        expect(input.disabled).toBe(false);
        expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
            'Loading'
        );
        request.resolve(choices);
        await settle(element);
        expect(input.getAttribute('aria-busy')).toBe('false');
        const list = element.shadowRoot!.querySelector('[role="listbox"]')!;
        expect(input.getAttribute('aria-controls')).toBe(list.id);
        expect(options(element).map(option => option.textContent)).toEqual(
            choices.map(item => item.text)
        );
        expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
            '2 suggestions'
        );
        expect(key(input, 'ArrowDown').defaultPrevented).toBe(true);
        await settle(element);
        expect(input.getAttribute('aria-activedescendant')).toBe(options(element)[0].id);
        expect(options(element)[0].getAttribute('aria-selected')).toBe('true');
    });

    it('keeps query text separate and commits the original typed value once on Enter', async () => {
        const record = model();
        const { element, input } = await render(record);
        const update = jest.fn();
        input.addEventListener('update', update);
        type(input, 'Ada');
        await settle(element);
        expect(record.field('person').rawValue).toBe(10);
        expect(key(input, 'Enter').defaultPrevented).toBe(true);
        expect(record.field('person').rawValue).toBe(10);
        key(input, 'ArrowDown');
        key(input, 'Enter');
        await settle(element);
        expect(record.field('person').rawValue).toBe(42);
        expect(typeof record.field('person').rawValue).toBe('number');
        expect(input.value).toBe('Ada Lovelace');
        expect(update).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0][0].detail.value).toBe(42);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(input.hasAttribute('aria-activedescendant')).toBe(false);
        expect(key(input, 'Enter').defaultPrevented).toBe(false);
        record.field('person').rawValue = 73;
        await settle(element);
        expect(input.value).toBe('73');
    });

    it('wraps ArrowUp and ArrowDown and starts a new search from a closed popup', async () => {
        const fetch = jest.fn(() => choices);
        const { element, input } = await render(model(fetch));
        key(input, 'ArrowDown');
        await settle(element);
        key(input, 'ArrowUp');
        await settle(element);
        expect(input.getAttribute('aria-activedescendant')).toBe(options(element)[1].id);
        key(input, 'ArrowDown');
        await settle(element);
        expect(input.getAttribute('aria-activedescendant')).toBe(options(element)[0].id);
        key(input, 'ArrowUp');
        key(input, 'Enter');
        await settle(element);
        expect(input.value).toBe('Grace Hopper');
        key(input, 'ArrowUp');
        await settle(element);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it.each(['Escape', 'Tab'])(
        'dismisses uncommitted query on %s without selecting it',
        async action => {
            const record = model();
            const { element, input } = await render(record);
            input.focus();
            type(input, 'uncommitted');
            await settle(element);
            key(input, 'ArrowDown');
            const event = key(input, action);
            if (action === 'Tab') {
                expect(event.defaultPrevented).toBe(false);
                input.blur(); // jsdom does not perform the browser default Tab focus movement.
            } else expect(event.defaultPrevented).toBe(true);
            await settle(element);
            expect(input.value).toBe('10');
            expect(record.field('person').rawValue).toBe(10);
            expect(input.getAttribute('aria-expanded')).toBe('false');
            expect(key(input, 'Escape').defaultPrevented).toBe(false);
        }
    );

    it('selects by click without moving focus away from the input', async () => {
        const record = model();
        const { element, input } = await render(record);
        input.focus();
        await settle(element);
        const option = options(element)[1];
        const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        option.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        option.click();
        await settle(element);
        expect(element.shadowRoot!.activeElement).toBe(input);
        expect(record.field('person').rawValue).toBe(73);
        expect(input.value).toBe('Grace Hopper');
    });

    it.each(['success', 'failure'])(
        'ignores stale %s and aborts the superseded query',
        async outcome => {
            const old = deferred<Item[]>();
            const current = deferred<Item[]>();
            const fetch = jest
                .fn()
                .mockReturnValueOnce(old.promise)
                .mockReturnValueOnce(current.promise);
            const record = model(fetch);
            const { element, input } = await render(record);
            type(input, 'a');
            const signal = fetch.mock.calls[0][2] as AbortSignal;
            type(input, 'gr');
            expect(signal.aborted).toBe(true);
            expect(fetch.mock.calls[1][0]).toBe('gr');
            expect(fetch.mock.calls[1][1]).toBe(record);
            current.resolve([choices[1]]);
            await settle(element);
            if (outcome === 'success') old.resolve([choices[0]]);
            else old.reject(new Error('stale failure'));
            await settle(element);
            expect(options(element).map(option => option.textContent)).toEqual(['Grace Hopper']);
            expect(element.shadowRoot!.textContent).not.toContain('could not be loaded');
            expect(record.field('person').rawValue).toBe(10);
        }
    );

    it('reports failure and retries, and empty/partial responses never clear a committed value', async () => {
        const fetch = jest
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(choices);
        const record = model(fetch);
        const { element, input } = await render(record);
        type(input, 'bad');
        await settle(element);
        expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
            'Type to retry'
        );
        expect(input.getAttribute('aria-busy')).toBe('false');
        type(input, 'missing');
        await settle(element);
        expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toBe(
            'No suggestions found.'
        );
        key(input, 'ArrowDown');
        expect(input.hasAttribute('aria-activedescendant')).toBe(false);
        type(input, 'again');
        await settle(element);
        expect(options(element)).toHaveLength(2);
        expect(record.field('person').rawValue).toBe(10);
    });

    it.each(['disabled', 'readOnly', 'hidden'])(
        'invalidates pending work when the field becomes %s',
        async state => {
            const pending = deferred<Item[]>();
            const fetch = jest.fn(() => pending.promise);
            let builder = new FieldTypeBuilder().suggestions({ fetch });
            if (state === 'disabled')
                builder = builder.disabled(record => record.getField('locked'));
            if (state === 'readOnly')
                builder = builder.readOnly(record => record.getField('locked'));
            if (state === 'hidden') builder = builder.visible(record => !record.getField('locked'));
            const record = new Record(
                { person: builder, locked: new FieldTypeBuilder() },
                { person: 10, locked: false }
            );
            const { element, input } = await render(record);
            type(input, 'a');
            record.field('locked').rawValue = true;
            await settle(element);
            pending.resolve(choices);
            await settle(element);
            expect(input.getAttribute('aria-expanded')).toBe('false');
            expect(options(element)).toHaveLength(0);
            expect(record.field('person').rawValue).toBe(10);
            type(input, 'blocked');
            await settle(element);
            expect(fetch).toHaveBeenCalledTimes(1);
        }
    );

    it.each(['record', 'field'])('ignores an old request after %s rebinding', async binding => {
        const pending = deferred<Item[]>();
        const oldFetch = jest.fn(() => pending.promise);
        const newFetch = jest.fn(() => [choices[1]]);
        const record = new Record(
            {
                person: new FieldTypeBuilder().suggestions({ fetch: oldFetch }),
                other: new FieldTypeBuilder().suggestions({ fetch: newFetch }),
            },
            { person: 10, other: 99 }
        );
        const { element, input } = await render(record);
        type(input, 'old');
        if (binding === 'record')
            element.record = new Record(
                { person: new FieldTypeBuilder().suggestions({ fetch: newFetch }) },
                { person: 99 }
            );
        else element.field = 'other';
        await settle(element);
        pending.resolve(choices);
        await settle(element);
        const rebound = element.shadowRoot!.querySelector('input')!;
        expect(rebound.value).toBe('99');
        expect(rebound.getAttribute('aria-expanded')).toBe('false');
        type(rebound, 'new');
        await settle(element);
        expect(options(element).map(option => option.textContent)).toEqual(['Grace Hopper']);
        expect(newFetch).toHaveBeenCalledTimes(1);
    });

    it('cancels pending work and removes handlers on disconnect, then reconnects once', async () => {
        const pending = deferred<Item[]>();
        const fetch = jest.fn().mockReturnValueOnce(pending.promise).mockReturnValue(choices);
        const { element, input } = await render(model(fetch));
        type(input, 'old');
        const signal = fetch.mock.calls[0][2] as AbortSignal;
        element.remove();
        expect(signal.aborted).toBe(true);
        expect(input.hasAttribute('role')).toBe(false);
        type(input, 'detached');
        expect(fetch).toHaveBeenCalledTimes(1);
        pending.resolve(choices);
        await settle(element);
        document.body.append(element);
        await settle(element);
        type(input, 'new');
        await settle(element);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(input.getAttribute('role')).toBe('combobox');
        expect(options(element)).toHaveLength(2);
    });

    it('preserves object identity and bypasses text parsers when choosing a suggestion', async () => {
        const person = { id: 42, name: 'Ada' };
        const parse = jest.fn(() => 'parsed');
        const record = new Record(
            {
                person: new FieldTypeBuilder().parser(parse).suggestions({
                    fetch: () => [person],
                    text: item => item.name,
                    value: item => item,
                }),
            },
            {}
        );
        const { element, input } = await render(record);
        expect(input.value).toBe('');
        parse.mockClear();
        type(input, 'Ada');
        await settle(element);
        options(element)[0].click();
        await settle(element);
        expect(record.field('person').rawValue).toBe(person);
        expect(input.value).toBe('Ada');
        expect(parse).not.toHaveBeenCalled();
        input.dispatchEvent(new FocusEvent('blur'));
        await settle(element);
        expect(input.value).toBe('Ada');
    });

    it('rejects a click on an obsolete option after the field becomes disabled', async () => {
        const record = new Record(
            {
                person: new FieldTypeBuilder()
                    .disabled(record => record.getField('locked'))
                    .suggestions({ fetch: () => choices }),
                locked: new FieldTypeBuilder(),
            },
            { person: 10, locked: false }
        );
        const { element, input } = await render(record);
        type(input, 'Ada');
        await settle(element);
        const obsoleteOption = options(element)[0];
        record.field('locked').rawValue = true;
        obsoleteOption.click();
        await settle(element);
        expect(record.field('person').rawValue).toBe(10);
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('allows label queries for numeric IDs without applying numeric input filtering', async () => {
        const fetch = jest.fn(() => choices);
        const record = new Record(
            { person: number.required().suggestions({ fetch }) },
            { person: 42 }
        );
        const { element, input } = await render(record);
        const before = new InputEvent('beforeinput', {
            data: 'A',
            inputType: 'insertText',
            bubbles: true,
            cancelable: true,
        });
        input.dispatchEvent(before);
        expect(before.defaultPrevented).toBe(false);
        type(input, 'Ada');
        await settle(element);
        expect(input.type).toBe('text');
        expect(input.value).toBe('Ada');
        expect(fetch).toHaveBeenLastCalledWith('Ada', record, expect.any(AbortSignal));
        expect(record.field('person').rawValue).toBe(42);
        type(input, '');
        await settle(element);
        expect(input.required).toBe(false);
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(input.checkValidity()).toBe(true);
        expect(record.isValid('person')).toBe(true);
    });

    it('does not constrain query text with committed string value length or pattern rules', async () => {
        const record = new Record(
            {
                person: string
                    .maxLength(2)
                    .minLength(2)
                    .pattern(/[A-Z]{2}/)
                    .suggestions({ fetch: () => [{ text: 'United States', value: 'US' }] }),
            },
            { person: 'US' }
        );
        const { element, input } = await render(record);
        for (const attribute of ['maxlength', 'minlength', 'pattern'])
            expect(input.hasAttribute(attribute)).toBe(false);
        type(input, 'United States');
        await settle(element);
        expect(input.value).toBe('United States');
        expect(input.checkValidity()).toBe(true);
        expect(record.field('person').rawValue).toBe('US');
        expect(record.isValid('person')).toBe(true);
    });

    it('does not recreate a controller when reconnection is immediately followed by removal', async () => {
        const fetch = jest.fn(() => choices);
        const { element, input } = await render(model(fetch));
        element.remove();
        document.body.append(element);
        element.remove();
        await settle(element);
        type(input, 'detached');
        input.dispatchEvent(new FocusEvent('focus'));
        await settle(element);
        expect(fetch).not.toHaveBeenCalled();
        expect(input.hasAttribute('role')).toBe(false);
    });

    it('scrolls the active keyboard option into view for long result lists', async () => {
        const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
        const scroll = jest.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scroll,
        });
        try {
            const { element, input } = await render(model());
            type(input, 'Ada');
            await settle(element);
            key(input, 'ArrowDown');
            await settle(element);
            expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
            expect(scroll.mock.contexts[scroll.mock.contexts.length - 1]).toBe(options(element)[0]);
        } finally {
            if (original) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', original);
            else delete (HTMLElement.prototype as any).scrollIntoView;
        }
    });

    it('defers searches and selection throughout IME composition', async () => {
        const fetch = jest.fn(() => choices);
        const record = model(fetch);
        const { element, input } = await render(record);
        input.focus();
        await settle(element);
        input.dispatchEvent(new CompositionEvent('compositionstart'));
        type(input, 'あ');
        key(input, 'ArrowDown');
        key(input, 'Enter');
        await settle(element);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(record.field('person').rawValue).toBe(10);
        input.dispatchEvent(new CompositionEvent('compositionend'));
        await settle(element);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenLastCalledWith('あ', record, expect.any(AbortSignal));
        input.dispatchEvent(new InputEvent('input', { isComposing: true }));
        expect(key(input, 'Enter', true).defaultPrevented).toBe(false);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
