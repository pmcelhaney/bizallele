import { Record, string } from '../src/index';
import type { Suggestion, SuggestionsApi, SuggestionsFetchFn } from '../src/index';

it('exposes optional query behavior and never fetches on record creation or changes', async () => {
    const fetch = jest.fn(() => [{ text: 'Other', value: 'other' }]);
    const record = new Record(
        { name: string.suggestions(fetch), plain: string },
        {
            name: 'selected',
            plain: '',
        }
    );
    await record.whenOptionsReady();
    expect(fetch).not.toHaveBeenCalled();
    expect(record.field('name').hasSuggestions).toBe(true);
    expect(record.field('name').hasOptions).toBe(false);
    expect(record.field('plain').hasSuggestions).toBe(false);
    await expect(record.field('plain').suggestions('x')).resolves.toEqual([]);
    await expect(record.field('name').suggestions('other')).resolves.toEqual([
        { text: 'Other', value: 'other' },
    ]);
    expect(record.getField('name')).toBe('selected');
    record.setField('plain', 'changed');
    await record.whenOptionsReady();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(record.getField('name')).toBe('selected');
});

it('forwards query, owning record, and signal and maps keys or callbacks without mutating results', async () => {
    const data = [{ id: 'a', label: 'Alpha', extra: 3 }];
    const fetch = jest.fn(() => data);
    const definition = string.suggestions({ fetch, text: 'label', value: 'id' });
    const record = new Record({ name: definition }, { name: 'saved' });
    const controller = new AbortController();
    await expect(record.field('name').suggestions('Al', controller.signal)).resolves.toEqual([
        { ...data[0], text: 'Alpha', value: 'a' },
    ]);
    expect(fetch).toHaveBeenCalledWith('Al', record, controller.signal);
    expect(data).toEqual([{ id: 'a', label: 'Alpha', extra: 3 }]);
    const mapped = string.suggestions({
        fetch,
        text: item => item.label.toUpperCase(),
        value: item => item.id,
    });
    await expect(mapped.valueOf().suggestions('a', record)).resolves.toEqual([
        { ...data[0], text: 'ALPHA', value: 'a' },
    ]);
});

it('preserves immutable specialization and replaces providers on reapplication', async () => {
    const first = string.suggestions(() => [{ text: 'First', value: 'first' }]);
    const second = first.suggestions(() => [{ text: 'Second', value: 'second' }]);
    const record = new Record(
        { first, second, plain: string },
        { first: '', second: '', plain: '' }
    );
    expect(string.valueOf().hasSuggestions()).toBe(false);
    await expect(record.field('first').suggestions('')).resolves.toEqual([
        { text: 'First', value: 'first' },
    ]);
    await expect(record.field('second').suggestions('')).resolves.toEqual([
        { text: 'Second', value: 'second' },
    ]);
    expect(first.valueOf().properties.suggestions).not.toBe(first.valueOf().properties.suggestions);
});

it('does not reconcile scalar or multi-value selections against partial or empty matches', async () => {
    const definition = string.suggestions(() => []);
    const record = new Record(
        { scalar: definition, multiple: definition.multipleValues() },
        {
            scalar: 'kept',
            multiple: ['one', 'two'],
        }
    );
    await record.field('scalar').suggestions('missing');
    await record.field('multiple').suggestions('missing');
    await record.refreshOptions();
    expect(record.values).toEqual({ scalar: 'kept', multiple: ['one', 'two'] });
    expect(record.hasChanged).toBe(false);
});

it('keeps queries and records independent and leaves response races to the consumer', async () => {
    const resolvers: Array<(results: Suggestion<string>[]) => void> = [];
    const fetch = jest.fn(
        () => new Promise<Suggestion<string>[]>(resolve => resolvers.push(resolve))
    );
    const runtime = string.suggestions(fetch).valueOf();
    const first = new Record({ name: runtime }, { name: 'one' });
    const second = new Record({ name: runtime }, { name: 'two' });
    const old = first.field('name').suggestions('same');
    const recent = first.field('name').suggestions('same');
    const other = second.field('name').suggestions('same');
    expect(fetch).toHaveBeenCalledTimes(3);
    resolvers[1]([{ text: 'New', value: 'new' }]);
    resolvers[2]([]);
    resolvers[0]([{ text: 'Old', value: 'old' }]);
    await expect(recent).resolves.toEqual([{ text: 'New', value: 'new' }]);
    await expect(old).resolves.toEqual([{ text: 'Old', value: 'old' }]);
    await expect(other).resolves.toEqual([]);
    expect(runtime.resultsText).toEqual({});
    expect(first.getField('name')).toBe('one');
    expect(second.getField('name')).toBe('two');
});

it('does not contaminate complete-option results or labels', async () => {
    const options = jest.fn(() => [{ text: 'Complete label', value: 'kept' }]);
    const runtime = string
        .options({ fetch: options })
        .suggestions(() => [{ text: 'Query label', value: 'kept' }])
        .valueOf();
    const record = new Record({ name: runtime }, { name: 'kept' });
    await record.whenOptionsReady();
    const cached = (runtime.properties.options as any).cache;
    const loaded = runtime.loaded;
    await record.field('name').suggestions('kept');
    expect((runtime.properties.options as any).cache).toBe(cached);
    expect(runtime.loaded).toBe(loaded);
    expect(runtime.resultsText).toEqual({ [JSON.stringify('kept')]: 'Complete label' });
    await expect(record.field('name').options()).resolves.toEqual([
        { text: 'Complete label', value: 'kept' },
    ]);
    expect(options).toHaveBeenCalledTimes(1);
});

it('returns rejections for synchronous, asynchronous, and abort failures without clearing values', async () => {
    const error = new Error('Unavailable');
    const record = new Record(
        {
            sync: string.suggestions(() => {
                throw error;
            }),
            async: string.suggestions(() => Promise.reject(error)),
            abort: string.suggestions((_query, _record, signal) => {
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                return [];
            }),
        },
        { sync: 'one', async: 'two', abort: 'three' }
    );
    await expect(record.field('sync').suggestions('')).rejects.toBe(error);
    await expect(record.field('async').suggestions('')).rejects.toBe(error);
    const controller = new AbortController();
    controller.abort();
    await expect(record.field('abort').suggestions('', controller.signal)).rejects.toMatchObject({
        name: 'AbortError',
    });
    expect(record.values).toEqual({ sync: 'one', async: 'two', abort: 'three' });
});

it('does not invoke a provider on a disabled field', async () => {
    const fetch = jest.fn(() => []);
    const record = new Record(
        { name: string.suggestions(fetch).disabled(true) },
        { name: 'saved' }
    );
    await expect(record.field('name').suggestions('')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
});

it('exports typed callbacks and normalized results', async () => {
    type Item = { id: string; name: string };
    const fetch: SuggestionsFetchFn<Item, Record<{ country: string }>> = (
        query,
        record,
        signal
    ) => {
        const country: string = record.values.country;
        const aborted: boolean | undefined = signal?.aborted;
        return aborted ? [] : [{ id: country, name: query }];
    };
    const config: SuggestionsApi<Item, Record<{ country: string }>, string> = {
        fetch,
        text: item => item.name,
        value: item => item.id,
    };
    const definition = string.suggestions(config);
    const record = new Record({ country: string }, { country: 'US' });
    const results: Suggestion<string>[] = await definition.valueOf().suggestions('United', record);
    expect(results[0].value).toBe('US');
});

it('maps primitive results without spreading string characters into suggestions', async () => {
    const definition = string.suggestions({
        async fetch() {
            return ['London'];
        },
        text: item => item,
        value: item => item,
    });
    const record = new Record({ city: definition }, { city: '' });
    await expect(record.field('city').suggestions('Lon')).resolves.toEqual([
        { text: 'London', value: 'London' },
    ]);
});
