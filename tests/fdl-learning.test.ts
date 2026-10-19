import '../examples/fdl-input/fdl-delivery-experiment';
import type { FdlRecordInspector } from '../examples/fdl-input/fdl-record-inspector';
import type { DeliveryForm } from '../examples/fdl-input/delivery-form';
import type { FdlExample } from '../examples/fdl-input/fdl-example';
import type { FdlDeliveryExperiment } from '../examples/fdl-input/fdl-delivery-experiment';

afterEach(() => document.body.replaceChildren());

async function inspectorRoot(demo: DeliveryForm) {
    const inspector = demo.shadowRoot!.querySelector('fdl-record-inspector') as FdlRecordInspector;
    await inspector.updateComplete;
    return inspector.shadowRoot!;
}

async function addressRoot(demo: DeliveryForm) {
    const field = demo.shadowRoot!.querySelector('fdl-field[field="address"]') as any;
    await field.updateComplete;
    const address = field.shadowRoot.querySelector('fdl-address');
    await address.updateComplete;
    return address.shadowRoot as ShadowRoot;
}

it('groups the address and propagates child edits and validation to the parent', async () => {
    const demo = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(demo);
    await demo.updateComplete;
    const inspection = await inspectorRoot(demo);
    expect(
        Array.from(inspection.querySelectorAll('tbody tr')).map(
            row => row.querySelector('.field-label')!.textContent
        )
    ).toEqual(['Delivery method', 'Shipping address', 'Pickup ZIP code', 'Pickup store']);
    const address = await addressRoot(demo);
    expect(address.querySelector('legend')!.textContent).toBe('Shipping address');
    const record = (demo.shadowRoot!.querySelector('fdl-field') as any).record;
    inspection.querySelector<HTMLButtonElement>('.nested-inspect')!.click();
    await (demo.shadowRoot!.querySelector('fdl-record-inspector') as any).updateComplete;
    await editField(address, 'street', '');
    await demo.updateComplete;
    expect(record.getField('address').street).toBe('');
    expect(record.isValid('address')).toBe(false);
    expect(record.isValid()).toBe(false);
    expect(
        (await inspectorRoot(demo)).querySelector(
            '[data-nested-field="street"] [aria-label="Invalid"]'
        )
    ).not.toBeNull();
    await editField(demo.shadowRoot!, 'fulfillment', 'pickup');
    await editField(demo.shadowRoot!, 'store', 'uptown');
    expect(record.isValid()).toBe(true);
    await editField(demo.shadowRoot!, 'fulfillment', 'ship');
    expect(record.isValid()).toBe(false);
    await editField(await addressRoot(demo), 'street', '42 Orchard Street');
    expect(record.isValid()).toBe(true);
});

it('updates the summary from address edits and reconciled pickup selections', async () => {
    const demo = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(demo);
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    function summary() {
        return root.querySelector('.delivery-summary [role="status"]')!.textContent!.trim();
    }
    expect(summary()).toBe('Ship to 42 Orchard Street, Charlotte, NC 28202.');
    await editField(await addressRoot(demo), 'street', '12 Main Street');
    await demo.updateComplete;
    expect(summary()).toBe('Ship to 12 Main Street, Charlotte, NC 28202.');
    await editField(await addressRoot(demo), 'city', '');
    await demo.updateComplete;
    expect(summary()).toBe('Complete the shipping address.');
    await editField(await addressRoot(demo), 'city', 'Charlotte');
    await editField(root, 'fulfillment', 'pickup');
    await demo.updateComplete;
    expect(summary()).toBe('Choose a pickup store.');
    await editField(root, 'store', 'uptown');
    await demo.updateComplete;
    expect(summary()).toBe('Pick up at Uptown store.');
    await editField(root, 'pickupZip', '10001');
    await demo.updateComplete;
    expect(summary()).toBe('Choose a pickup store.');
    await editField(root, 'store', 'chelsea');
    await demo.updateComplete;
    expect(summary()).toBe('Pick up at Chelsea store.');
    await editField(root, 'fulfillment', 'ship');
    await demo.updateComplete;
    expect(summary()).toBe('Ship to 12 Main Street, Charlotte, NC 28202.');
}, 15000);

// Three sequential store lookups each simulate two seconds of latency.
it('keeps pickup stores visible, disables invalid ZIPs, and clears unavailable selections', async () => {
    const demo = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(demo);
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const storeField = root.querySelector('fdl-field[field="store"]') as any;
    const record = storeField.record;
    function storeVisible() {
        return record.field('store').visible;
    }
    async function expectStoreDisabled(disabled: boolean) {
        await storeField.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(record.field('store').disabled).toBe(disabled);
        expect(storeField.shadowRoot.querySelector('select').disabled).toBe(disabled);
        const status = (await inspectorRoot(demo)).querySelector(
            'tr[data-field="store"] .field-status'
        )!;
        expect(status.querySelector('[aria-label="Disabled"]') !== null).toBe(disabled);
    }
    expect(storeVisible()).toBe(false);
    await editField(root, 'fulfillment', 'pickup');
    await editField(root, 'pickupZip', '');
    await demo.updateComplete;
    expect(record.isValid()).toBe(false);
    expect(storeVisible()).toBe(true);
    await expectStoreDisabled(true);
    await editField(root, 'pickupZip', '2820');
    await demo.updateComplete;
    expect(storeVisible()).toBe(true);
    await expectStoreDisabled(true);
    expect(record.isValid()).toBe(false);
    await editField(root, 'pickupZip', 'abcde');
    await demo.updateComplete;
    expect(storeVisible()).toBe(true);
    await expectStoreDisabled(true);
    await editField(root, 'pickupZip', '28202');
    await demo.updateComplete;
    await editField(root, 'store', 'uptown');
    await demo.updateComplete;
    expect(storeVisible()).toBe(true);
    await expectStoreDisabled(false);
    expect(record.isValid()).toBe(true);
    expect((await inspectorRoot(demo)).textContent!.replace(/\s+/g, ' ').trim()).toContain(
        'uptown'
    );
    await editField(root, 'pickupZip', '10001');
    await demo.updateComplete;
    expect(record.getField('store')).toBe('uptown');
    await record.whenOptionsReady();
    await demo.updateComplete;
    expect(record.getField('store')).toBeUndefined();
    expect(record.isValid()).toBe(false);
    await editField(root, 'store', 'chelsea');
    await demo.updateComplete;
    expect(record.isValid()).toBe(true);
    await editField(root, 'pickupZip', '01234');
    await record.whenOptionsReady();
    await demo.updateComplete;
    expect(record.getField('pickupZip')).toBe('01234');
    expect(record.isValid()).toBe(false);
    await editField(root, 'pickupZip', '');
    await demo.updateComplete;
    expect(storeVisible()).toBe(true);
    await expectStoreDisabled(true);
    expect(record.isValid()).toBe(false);
    await editField(root, 'fulfillment', 'ship');
    await demo.updateComplete;
    expect(record.isValid()).toBe(true);
    expect(record.getField('address').street).toBe('42 Orchard Street');
    expect(record.getField('store')).toBeUndefined();
}, 20000);

it('retains the shipping address independently of the pickup search ZIP', async () => {
    const demo = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(demo);
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const record = (root.querySelector('fdl-field') as any).record;
    const original = { street: '42 Orchard Street', city: 'Charlotte', state: 'NC', zip: '28202' };
    expect(record.getField('address')).toEqual(original);
    expect(record.isValid()).toBe(true);
    await editField(await addressRoot(demo), 'city', '');
    expect(record.isValid()).toBe(false);
    await editField(await addressRoot(demo), 'city', 'Charlotte');
    await editField(await addressRoot(demo), 'zip', 'bad');
    expect(record.isValid()).toBe(false);
    await editField(await addressRoot(demo), 'zip', '28202');
    await editField(root, 'fulfillment', 'pickup');
    await demo.updateComplete;
    expect(record.field('address').visible).toBe(false);
    expect((await addressRoot(demo)).querySelector('fieldset')).toBeNull();
    await editField(root, 'pickupZip', '10001');
    await editField(root, 'store', 'chelsea');
    expect(record.isValid()).toBe(true);
    expect(record.getField('address')).toEqual(original);
    await editField(root, 'fulfillment', 'ship');
    await demo.updateComplete;
    expect(record.isValid()).toBe(true);
    expect(record.getField('pickupZip')).toBe('10001');
    expect((await addressRoot(demo)).querySelector('fieldset')).not.toBeNull();
});

it('simulates two seconds of store lookup latency with a spinner', async () => {
    const demo = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(demo);
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    await editField(root, 'fulfillment', 'pickup');
    await editField(root, 'pickupZip', '');
    const store = root.querySelector('fdl-field[field="store"]') as any;
    jest.useFakeTimers();
    try {
        store.record.setField('pickupZip', '10001');
        await store.updateComplete;
        const request = store.record.field('store').options();
        expect(store.shadowRoot.querySelector('.options-spinner')).not.toBeNull();
        expect(store.shadowRoot.querySelector('select').disabled).toBe(true);
        jest.advanceTimersByTime(1999);
        await store.updateComplete;
        expect(store.shadowRoot.querySelector('.options-spinner')).not.toBeNull();
        jest.advanceTimersByTime(1);
        await request;
        await store.updateComplete;
        expect(store.shadowRoot.querySelector('.options-spinner')).toBeNull();
        expect(store.shadowRoot.querySelector('select').disabled).toBe(false);
        expect(store.shadowRoot.querySelector('select').textContent).toContain('Chelsea store');
    } finally {
        jest.useRealTimers();
    }
});

it('reveals the actual source files alongside the slotted delivery form', async () => {
    const demo = document.createElement('fdl-delivery-experiment') as FdlDeliveryExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    const frame = demo.shadowRoot!.querySelector('fdl-example') as FdlExample;
    await frame.updateComplete;
    const root = frame.shadowRoot!;
    expect(root.querySelector('details')!.open).toBe(true);
    expect(root.querySelector('h2')!.textContent).toBe('Live example');
    const form = frame.querySelector('delivery-form') as DeliveryForm;
    await form.updateComplete;
    expect(form.shadowRoot!.querySelector('fdl-record-inspector')).not.toBeNull();
    expect([...root.querySelectorAll('[role="tab"]')].map(tab => tab.textContent!.trim())).toEqual([
        'Interactive example',
        'delivery-model.ts',
        'delivery-view.ts',
        'delivery-data.ts',
    ]);
    for (let index = 0; index < frame.filenames.length; index++) {
        const tab = root.querySelector<HTMLButtonElement>(`#example-tab-${index + 1}`)!;
        tab.click();
        await frame.updateComplete;
        expect(tab.getAttribute('aria-selected')).toBe('true');
        const panel = root.getElementById(tab.getAttribute('aria-controls')!)!;
        expect(panel.hasAttribute('hidden')).toBe(false);
        expect(panel.querySelector('code')!.textContent).toBe(
            frame.sources[frame.filenames[index]]
        );
        expect(root.querySelectorAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1);
    }
    expect(frame.sources['delivery-view.ts']).toContain('<fdl-field');
    expect(frame.sources['delivery-model.ts']).toContain(
        '.required(whenDeliveryMethodRequiresAddress)'
    );
    const requiredLink = root.querySelector('#example-panel-1 a[href="#required"]')!;
    expect(requiredLink.getAttribute('title')).toBe(
        'Requires a nonempty value, optionally depending on other values in the record.'
    );
    // Switching tabs keeps the same live form and its state.
    root.querySelector<HTMLButtonElement>('#example-tab-0')!.click();
    await frame.updateComplete;
    expect(frame.querySelector('delivery-form')).toBe(form);
});

it('supports other slotted content, filenames, keyboard navigation, and changed file lists', async () => {
    const frame = document.createElement('fdl-example') as FdlExample;
    frame.heading = 'Another example';
    frame.filenames = ['other.ts'];
    frame.sources = { 'other.ts': 'const value = 42;' };
    const content = document.createElement('input');
    content.value = 'keep this';
    frame.append(content);
    document.body.append(frame);
    await frame.updateComplete;
    const root = frame.shadowRoot!;
    root.querySelector<HTMLButtonElement>('#example-tab-0')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    await frame.updateComplete;
    expect(root.querySelector('#example-tab-1')!.getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('code')!.textContent).toBe('const value = 42;');
    frame.filenames = [];
    await frame.updateComplete;
    expect(root.querySelector('#example-panel-0')!.hasAttribute('hidden')).toBe(false);
    expect(content.value).toBe('keep this');
});

it('gives each delivery form its own record', async () => {
    const first = document.createElement('delivery-form') as DeliveryForm;
    const second = document.createElement('delivery-form') as DeliveryForm;
    document.body.append(first, second);
    await Promise.all([first.updateComplete, second.updateComplete]);
    await editField(await addressRoot(first), 'street', 'A different address');
    const secondField = second.shadowRoot!.querySelector('fdl-field[field="address"]') as any;
    expect(secondField.record.getField('address').street).toBe('42 Orchard Street');
});

import '../examples/fdl-input/fdl-modifier-explorer';
import type { FdlModifierExplorer } from '../examples/fdl-input/fdl-modifier-explorer';
import type { FdlModifierCatalog } from '../examples/fdl-input/fdl-modifier-catalog';

beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
});
const openExplorer = async (hash: string) => {
    window.location.hash = hash;
    const page = document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);
    await page.updateComplete;
    return page;
};
const editField = async (root: ShadowRoot, name: string, value: string) => {
    const field = root.querySelector(`fdl-field[field="${name}"]`) as any;
    if (name === 'store') {
        await field.record.field('store').options();
    }
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = field.shadowRoot.querySelector('input,select,textarea') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
};
it('shows retained values and conditional state in the inspector', async () => {
    const page = await openExplorer('#visible');
    await editField(page.shadowRoot!, 'fulfillment', 'pickup');
    await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.dependency-trace')).toBeNull();
    const inspector = page.shadowRoot!.querySelector('fdl-record-inspector')!;
    await inspector.updateComplete;
    const address = inspector.shadowRoot!.querySelector('[data-field="address"]')!;
    expect(address.textContent).toContain('42 Orchard Street');
    expect(address.querySelector('[aria-label="Hidden"]')).not.toBeNull();
});
it('shows conditional requiredness in the inspector as the dependency changes', async () => {
    const page = await openExplorer('#required');
    const inspector = page.shadowRoot!.querySelector('fdl-record-inspector')!;
    for (const [value, required] of [
        ['yes', true],
        ['no', false],
    ] as const) {
        await editField(page.shadowRoot!, 'followUp', value);
        await page.updateComplete;
        await inspector.updateComplete;
        const notes = inspector.shadowRoot!.querySelector('[data-field="followUpNotes"]')!;
        expect(!!notes.querySelector('[aria-label="Required"]')).toBe(required);
    }
    expect(page.shadowRoot!.querySelector('.dependency-trace')).toBeNull();
});

it('removes requiredness without adding the documentation toggle to the displayed view', async () => {
    const page = await openExplorer('#required');
    const root = page.shadowRoot!;
    root.querySelector<HTMLButtonElement>('.primary')!.click();
    await page.updateComplete;
    expect(root.querySelector('.result')!.textContent).toContain('required');
    root.querySelector<HTMLInputElement>('.rule-control input')!.click();
    await page.updateComplete;
    expect(root.querySelector('.result')!.textContent).toContain('record is valid');
    expect((root.querySelector('fdl-example') as FdlExample).sources['required-view.js']).toContain(
        '.record=${person}'
    );
});
it('changes length rules while preserving the value and matching the selected minimum', async () => {
    const page = await openExplorer('#minLength');
    const demo = page.shadowRoot!.querySelector('fdl-text-length') as any;
    await demo.updateComplete;
    await editField(demo.shadowRoot, 'code', 'ABC');
    demo.shadowRoot.querySelector('button').click();
    await demo.updateComplete;
    expect(demo.shadowRoot.querySelector('.result').textContent).toContain('minimum length is 4');
    const setting = demo.shadowRoot.querySelector('fdl-field[field="minimum"]') as any;
    await setting.updateComplete;
    const select = setting.shadowRoot.querySelector('select');
    expect(select.value).toBe('4');
    select.value = '2';
    select.dispatchEvent(new Event('input'));
    await demo.updateComplete;
    expect(demo.shadowRoot.querySelector('.result').textContent).toContain('Valid');
    const code = demo.shadowRoot.querySelector('fdl-field[field="code"]') as any;
    expect(code.record.getField('code')).toBe('ABC');
    const frame = demo.shadowRoot.querySelector('fdl-example') as any;
    await frame.updateComplete;
    expect(frame.sources['text-length-model.js']).toContain('.minLength(minimum)');
});

it('shows semantic state with the shared inspector icons', async () => {
    const page = await openExplorer('#visible');
    await editField(page.shadowRoot!, 'fulfillment', 'pickup');
    await page.updateComplete;
    const inspector = page.shadowRoot!.querySelector('fdl-record-inspector')!;
    await inspector.updateComplete;
    const address = inspector.shadowRoot!.querySelector('[data-field="address"]')!;
    expect(address.querySelector('[aria-label="Hidden"]')).toBeTruthy();
    expect(address.querySelector('[aria-label="Required"]')).toBeNull();
    expect(inspector.collapsed).toBe(false);
});
it('explains actual sort precedence without requiring a JSON read', async () => {
    const page = await openExplorer('#compareFunction');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestImmediateUpdate();
    table.shadowRoot.querySelector('button[title="Sort by Last name"]').click();
    await table.recordset.requestImmediateUpdate();
    await catalog.updateComplete;
    const inspector = catalog.shadowRoot!.querySelector('fdl-recordset-inspector')!;
    await inspector.updateComplete;
    const counts = inspector
        .shadowRoot!.querySelector('.counts')!
        .textContent!.replace(/\s+/g, ' ');
    expect(counts).toContain('Sorted by lastName ↑');
    expect(counts).toContain('6 of 6');
    const jsonDisclosure = Array.from(inspector.shadowRoot!.querySelectorAll('details')).find(
        details => details.querySelector('summary')?.textContent === 'Inspect full JSON'
    )!;
    expect(jsonDisclosure).toBeDefined();
    expect(jsonDisclosure.open).toBe(false);
});

it('automatically clears an assignee removed from the available choices', async () => {
    const page = await openExplorer('#options');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'assignee', 'grace');
    await editField(catalog.shadowRoot!, 'department', 'finance');
    const assignee = catalog.shadowRoot!.querySelector('fdl-field[field="assignee"]') as any;
    await assignee.record.whenOptionsReady();
    await new Promise(resolve => setTimeout(resolve, 0));
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.selection-explanation')).toBeNull();
    await assignee.updateComplete;
    expect(assignee.shadowRoot.textContent).toContain('Katherine Johnson');
    const inspector = catalog.shadowRoot!.querySelector('fdl-record-inspector')!;
    await inspector.updateComplete;
    expect(inspector.record!.getField('assignee')).toBeUndefined();
    expect(inspector.shadowRoot!.querySelector('[data-field="assignee"]')!.textContent).toContain(
        '(undefined)'
    );
});

it('offers email, quantity, and username validator examples', async () => {
    const page = await openExplorer('#validator');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const sections = [...catalog.shadowRoot!.querySelectorAll('.validator-example')];
    expect(sections.map(section => section.querySelector('h3')!.textContent)).toEqual([
        'Email address',
        'Order quantity',
        'Username',
    ]);
    for (const section of sections) {
        section.querySelector<HTMLButtonElement>('button')!.click();
    }
    await catalog.updateComplete;
    const fields = [...catalog.shadowRoot!.querySelectorAll('fdl-field')] as any[];
    await Promise.all(fields.map(field => field.updateComplete));
    expect(fields[0].shadowRoot.textContent).toContain('must be a valid email address');
    expect(fields[1].shadowRoot.textContent).toContain('must be a whole number');
    expect(fields[2].shadowRoot.textContent).toContain('must start with a letter');
    expect(fields[2].shadowRoot.textContent).toContain(
        'must contain only letters, numbers, or underscores'
    );
});
it('compares prefix and substring matching and updates the executable rule', async () => {
    const page = await openExplorer('#filter');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.case-comparison')).toBeNull();
    const initialTable = catalog.shadowRoot!.querySelector('fdl-table') as any;
    expect(initialTable.recordset.column('name').match('ar', 'Margaret')).toBe(false);
    await editField(catalog.shadowRoot!, 'matchRule', 'contains');
    await catalog.updateComplete;
    await page.updateComplete;
    expect(
        page.shadowRoot!.querySelector('fdl-example')!.shadowRoot!.querySelector('.code')!
            .textContent
    ).toContain('substringFilter');
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    expect(table.recordset.column('name').match('ar', 'Margaret')).toBe(true);
});

it('shows parsed currency values in the inspector without an explanatory panel', async () => {
    const page = await openExplorer('#parser');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const field = catalog.shadowRoot!.querySelector('fdl-field[field="money"]') as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
    const inspector = catalog.shadowRoot!.querySelector('fdl-record-inspector')!;
    for (const [entered, stored] of [
        ['$2345.670', '2345.67'],
        ['bad money', 'NaN'],
    ]) {
        input.value = entered;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await catalog.updateComplete;
        await inspector.updateComplete;
        expect(inspector.shadowRoot!.querySelector('[data-field="money"]')!.textContent).toContain(
            stored
        );
    }
    expect(catalog.shadowRoot!.querySelector('.value-pipeline')).toBeNull();
});

import type { FdlSpecializationExperiment } from '../examples/fdl-input/fdl-specialization-experiment';
it('keeps the base and sibling unchanged while specializing a shared definition', async () => {
    const page = await openExplorer('#how-it-works');
    const demo = page.shadowRoot!.querySelector(
        'fdl-specialization-experiment'
    ) as FdlSpecializationExperiment;
    await demo.updateComplete;
    const states = () =>
        [...demo.shadowRoot!.querySelectorAll('.variant-state')].map(node =>
            node.textContent!.replace(/\s+/g, ' ').trim()
        );
    expect(states()).toEqual(['Optional · Valid', 'Required · Invalid', 'Optional · Valid']);
    demo.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    await demo.updateComplete;
    expect(states()).toEqual(['Optional · Valid', 'Optional · Valid', 'Optional · Valid']);
    await editField(demo.shadowRoot!, 'base', 'A');
    await demo.updateComplete;
    expect(states()).toEqual(['Optional · Valid', 'Optional · Valid', 'Optional · Invalid']);
    const fields = [...demo.shadowRoot!.querySelectorAll('fdl-field')] as any[];
    expect(fields.map(item => item.record.getField(item.field))).toEqual(['A', 'A', 'A']);
    expect(fields[1].record.isValid('required')).toBe(true);
    expect(fields[2].record.isValid('sibling')).toBe(false);
});

import type { FdlLearningPath } from '../examples/fdl-input/fdl-learning-path';
it('builds a single example through parsing, validation, dependencies, and a collection', async () => {
    const page = await openExplorer('#learn');
    const demo = page.shadowRoot!.querySelector('fdl-learning-path') as FdlLearningPath;
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const next = async () => {
        root.querySelector<HTMLButtonElement>('.next-lesson')!.click();
        await demo.updateComplete;
    };
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        '$25.00'
    );
    await next();
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        '25 (number)'
    );
    await next();
    await editField(root, 'charge', '-1');
    await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        'Invalid'
    );
    await editField(root, 'charge', '');
    await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        'Required'
    );
    await next();
    await editField(root, 'method', 'pickup');
    await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        'Hidden · Optional'
    );
    await next();
    const table = root.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestImmediateUpdate();
    expect(table.recordset.allRecords).toHaveLength(3);
    expect(table.recordset.allRecords[0].isValid()).toBe(true);
    expect(root.querySelector('details ol')!.children).toHaveLength(5);
    expect(root.querySelector<HTMLButtonElement>('.next-lesson')!.disabled).toBe(true);
});

it('shares filter text between the comparison and the table header', async () => {
    const page = await openExplorer('#filter');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'filterProbe', 'gr');
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestImmediateUpdate();
    await table.updateComplete;
    expect(table.shadowRoot.textContent).toContain('Grace');
    expect(table.shadowRoot.textContent).not.toContain('Margaret');
    table.shadowRoot.querySelector('[data-filter-button="name"]').click();
    await table.updateComplete;
    const search = table.shadowRoot.querySelector('[data-filter-input="name"]');
    expect(search.value).toBe('gr');
    search.value = 'ad';
    search.dispatchEvent(new Event('input'));
    await catalog.updateComplete;
    const probe = catalog.shadowRoot!.querySelector('fdl-field[field="filterProbe"]') as any;
    await probe.updateComplete;
    expect(probe.shadowRoot.querySelector('input').value).toBe('ad');
});

it('resets the active learning question without losing its rules', async () => {
    const page = await openExplorer('#learn');
    const demo = page.shadowRoot!.querySelector('fdl-learning-path') as FdlLearningPath;
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const choice = root.querySelector<HTMLSelectElement>('select')!;
    choice.value = '2';
    choice.dispatchEvent(new Event('change'));
    await demo.updateComplete;
    await editField(root, 'charge', '-1');
    await demo.updateComplete;
    root.querySelector<HTMLButtonElement>('.reset-lesson')!.click();
    await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        '25 (number)'
    );
    expect(root.querySelector('.lesson-state')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
        'Required'
    );
});

it('highlights paginated weekday expenses above the adjustable threshold and formats dollars', async () => {
    const page = await openExplorer('#cellClass');
    const catalog = page.shadowRoot!.querySelector(
        'fdl-modifier-catalog[modifier="cellClass"]'
    ) as FdlModifierCatalog;
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('fdl-field[field="classAmount"]')).toBeNull();
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    async function rows() {
        await table.recordset.requestImmediateUpdate();
        await table.updateComplete;
        return Array.from(
            table.shadowRoot.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>
        );
    }
    let rendered = await rows();
    expect(table.recordset.allRecords).toHaveLength(25);
    expect(rendered).toHaveLength(10);
    expect(rendered.map(row => row.querySelector('td')!.textContent!.trim())).toEqual([
        'Week 1, Monday',
        'Week 1, Tuesday',
        'Week 1, Wednesday',
        'Week 1, Thursday',
        'Week 1, Friday',
        'Week 2, Monday',
        'Week 2, Tuesday',
        'Week 2, Wednesday',
        'Week 2, Thursday',
        'Week 2, Friday',
    ]);
    expect(rendered.map(row => row.querySelectorAll('td')[1].textContent!.trim())).toEqual([
        '$85.50',
        '$142.75',
        '$60.00',
        '$100.00',
        '$125.25',
        '$85.50',
        '$142.75',
        '$60.00',
        '$100.00',
        '$125.25',
    ]);
    const highlighted = () =>
        [...table.shadowRoot.querySelectorAll('td.high-value')].map((cell: any) =>
            cell.textContent.trim()
        );
    expect(highlighted()).toEqual(['$142.75', '$125.25', '$142.75', '$125.25']);
    expect(table.shadowRoot.querySelectorAll('td.amount-cell')).toHaveLength(10);
    await editField(catalog.shadowRoot!, 'classThreshold', '125.25');
    await catalog.updateComplete;
    await page.updateComplete;
    rendered = await rows();
    expect(highlighted()).toEqual(['$142.75', '$142.75']);
    expect(rendered.map(row => row.querySelectorAll('td')[1].textContent!.trim())).toEqual([
        '$85.50',
        '$142.75',
        '$60.00',
        '$100.00',
        '$125.25',
        '$85.50',
        '$142.75',
        '$60.00',
        '$100.00',
        '$125.25',
    ]);
    expect(
        page
            .shadowRoot!.getElementById('cellClass')!
            .querySelector('fdl-example')!
            .shadowRoot!.querySelector('.code')!.textContent
    ).toContain("probes.getField('classThreshold')");
});

it('sorts the live T-shirt size column in size order and highlights all comparator calls', async () => {
    const page = await openExplorer('#compareFunction');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestImmediateUpdate();
    table.shadowRoot.querySelector('button[title="Sort by T-shirt size"]').click();
    await table.recordset.requestImmediateUpdate();
    await table.updateComplete;
    expect(
        [...table.shadowRoot.querySelectorAll('tbody tr')].map((row: any) =>
            row.querySelectorAll('td')[2].textContent.trim()
        )
    ).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    const focused = page
        .shadowRoot!.querySelector('fdl-example')!
        .shadowRoot!.querySelectorAll('.code .focused-line');
    expect(
        [...focused].filter(line => line.textContent!.includes('.compareFunction('))
    ).toHaveLength(3);
    expect(catalog.shadowRoot!.querySelector('.case-comparison')!.textContent).toContain(
        'XS → S → M → L → XL → XXL'
    );
});

it('keeps a shared selection in both function and async-function options after the department changes', async () => {
    const page = await openExplorer('#options');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const fields = ['assignee', 'asyncAssignee'].map(
        name => catalog.shadowRoot!.querySelector(`fdl-field[field="${name}"]`) as any
    );
    for (const department of ['engineering', 'finance', 'engineering']) {
        if (
            department !== 'engineering' ||
            fields[0].record.getField('department') !== department
        ) {
            await editField(catalog.shadowRoot!, 'department', department);
        }
        await Promise.all(fields.map(field => field.record.field(field.field).options()));
        await Promise.all(fields.map(field => field.updateComplete));
        await catalog.updateComplete;
        for (const field of fields) {
            const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
            expect(select.value).toBe('margaret');
            expect(select.selectedOptions[0].textContent).toBe('Margaret Hamilton');
            expect(field.record.getField(field.field)).toBe('margaret');
        }
    }
    expect(
        page.shadowRoot!.querySelector('fdl-example')!.shadowRoot!.querySelector('.code')!
            .textContent
    ).toContain('.options(async record =>');
    expect(
        page.shadowRoot!.querySelector('fdl-example')!.shadowRoot!.querySelector('.code')!
            .textContent
    ).toContain("assigneeDirectory[record.getField('department')]");
});
