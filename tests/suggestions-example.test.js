import { record } from '../examples/fdl-input/live-examples/suggestions/suggestions-model';
import '../examples/fdl-input/live-examples/suggestions/suggestions-example';

beforeEach(() => record.reset());
afterEach(() => document.body.replaceChildren());

it('keeps the committed destination through partial and empty directory results', async () => {
    const field = record.field('city');
    expect(field.rawValue).toBe('Paris');
    const matches = await field.suggestions('lo');
    expect(matches).toEqual([{ text: 'London', value: 'London' }]);
    expect(field.rawValue).toBe('Paris');
    expect(await field.suggestions('zzzz')).toEqual([]);
    expect(field.rawValue).toBe('Paris');
    field.value = matches[0].value;
    expect(field.rawValue).toBe('London');
    expect(await field.suggestions('zzzz')).toEqual([]);
    expect(field.rawValue).toBe('London');
});

it('renders the working field and observable committed value from the example model', async () => {
    const demo = document.createElement('fdl-live-suggestions');
    document.body.append(demo);
    await demo.updateComplete;
    expect(demo.querySelector('fdl-field').record).toBe(record);
    expect(demo.querySelector('strong').textContent).toBe('Paris');
    record.setField('city', 'London');
    await demo.updateComplete;
    expect(demo.querySelector('strong').textContent).toBe('London');
});
