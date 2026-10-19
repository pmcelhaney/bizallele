import { field } from '../src/index';
import Recordset from '../src/recordset.js';
import '../examples/fdl-input/fdl-recordset-inspector';

function data() {
    return new Recordset(
        {
            name: field.label('Name').required(),
            amount: field
                .type('number')
                .textAlign('right')
                .formatter(value => `$${value}`),
            enabled: field,
            missing: field,
        },
        [
            { name: 'Zulu', amount: 0, enabled: false },
            { name: 'Alpha', amount: 12, enabled: true },
            { name: '', amount: 3, enabled: false },
        ]
    );
}

async function inspect(recordset?: Recordset<any>) {
    if (recordset) await recordset.requestImmediateUpdate();
    const inspector = document.createElement('fdl-recordset-inspector');
    inspector.recordset = recordset;
    document.body.append(inspector);
    await inspector.updateComplete;
    return inspector;
}

afterEach(() => document.body.replaceChildren());

it('drills into a live record from a cell and returns with display settings and focus intact', async () => {
    const recordset = data();
    recordset.filter = function enabledOnly(record) {
        return record.getField('enabled') === true;
    };
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    root.querySelector<HTMLInputElement>('.row-toggle input')!.click();
    await inspector.updateComplete;
    inspector.fields = ['amount'];
    await inspector.updateComplete;
    root.querySelector<HTMLElement>('[data-field="amount"]')!.click();
    await inspector.updateComplete;
    const detail = root.querySelector('fdl-record-inspector')!;
    await detail.updateComplete;
    expect(detail.record).toBe(recordset.allRecords[0]);
    expect(root.querySelector('section')).toBeNull();
    expect(detail.shadowRoot!.querySelector('h3')!.textContent).toBe('Record 1');
    expect(detail.shadowRoot!.querySelector('[data-field="name"]')).toBeTruthy();
    expect(detail.shadowRoot!.querySelector('.legend')).toBeNull();
    expect(detail.shadowRoot!.querySelector('[aria-label="Status icon legend"]')).toBeNull();
    for (const icon of detail.shadowRoot!.querySelectorAll('.status-icon'))
        expect(icon.getAttribute('title')).toBe(icon.getAttribute('aria-label'));
    const back = detail.shadowRoot!.querySelector<HTMLButtonElement>('.back-button')!;
    expect(back.getAttribute('aria-label')).toBe('Back to recordset');
    expect(detail.shadowRoot!.activeElement).toBe(back);
    recordset.allRecords[0].setField('name', 'Live edit');
    await detail.updateComplete;
    expect(detail.shadowRoot!.textContent).toContain('Live edit');
    back.click();
    await inspector.updateComplete;
    expect(root.querySelector('fdl-record-inspector')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('.row-toggle input')!.checked).toBe(true);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(root.activeElement).toBe(root.querySelector('.inspect-row'));
    expect(recordset.currentPage).toHaveLength(1);
});

it('uses the displayed row number and supports nested navigation before returning to the set', async () => {
    const recordset = new Recordset<any>({ name: field, child: field.record({ city: field }) }, [
        { name: 'First' },
        { name: 'Second', child: { city: 'Paris' } },
    ]);
    recordset.pageSize = 1;
    recordset.pageNumber = 2;
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    const button = root.querySelector<HTMLButtonElement>('.inspect-row')!;
    expect(button.getAttribute('aria-label')).toBe('Inspect record 2');
    button.click();
    await inspector.updateComplete;
    const detail = root.querySelector('fdl-record-inspector')!;
    await detail.updateComplete;
    expect(detail.record).toBe(recordset.allRecords[1]);
    expect(detail.heading).toBe('Record 2');
    detail.shadowRoot!.querySelector<HTMLButtonElement>('.nested-inspect')!.click();
    await detail.updateComplete;
    expect(detail.shadowRoot!.textContent).toContain('Paris');
    detail.shadowRoot!.querySelector<HTMLButtonElement>('.back-button')!.click();
    await detail.updateComplete;
    expect(detail.shadowRoot!.querySelector('h3')!.textContent).toBe('Record 2');
    expect(root.querySelector('fdl-record-inspector')).toBe(detail);
    detail.shadowRoot!.querySelector<HTMLButtonElement>('.back-button')!.click();
    await inspector.updateComplete;
    expect(root.querySelector('.inspect-row')!.textContent).toBe('2');
});

it('leaves record detail when the record is deleted or the recordset is replaced', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    root.querySelector<HTMLButtonElement>('.inspect-row')!.click();
    await inspector.updateComplete;
    recordset.deleteRecord(recordset.allRecords[0]);
    await inspector.updateComplete;
    expect(root.querySelector('fdl-record-inspector')).toBeNull();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    root.querySelector<HTMLButtonElement>('.inspect-row')!.click();
    await inspector.updateComplete;
    const replacement = data();
    await replacement.requestImmediateUpdate();
    inspector.recordset = replacement;
    await inspector.updateComplete;
    expect(root.querySelector('fdl-record-inspector')).toBeNull();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
});

it('shows raw values, row validity and counts, with selectable field order', async () => {
    const inspector = await inspect(data());
    const root = inspector.shadowRoot!;
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        '3 of 3 records match'
    );
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(root.querySelector('[data-field="amount"]')!.textContent!.trim()).toBe('0');
    expect(root.querySelector('[data-field="amount"]')!.getAttribute('data-align')).toBe('right');
    expect(root.querySelector('[data-field="name"]')!.getAttribute('data-align')).toBe('left');
    expect(root.querySelector('[data-field="enabled"]')!.textContent!.trim()).toBe('false');
    expect(root.querySelector('[data-field="missing"]')!.textContent!.trim()).toBe('(undefined)');
    expect(
        root.querySelector('tbody tr:last-child .row-status [aria-label="Invalid"]')
    ).toBeTruthy();
    inspector.fields = ['amount', 'name'];
    await inspector.updateComplete;
    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual([
        '',
        'Row',
        'amount',
        'name',
    ]);
});

it('tracks sorting, filtering, paging and edits without a parent update', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    await recordset.sort({ field: 'name', sort: 'ascending' });
    recordset.pageSize = 1;
    await recordset.requestImmediateUpdate();
    await inspector.updateComplete;
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        'Sorted by name ↑'
    );
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    recordset.pageNumber = 2;
    await recordset.requestImmediateUpdate();
    await inspector.updateComplete;
    expect(root.querySelector('tbody th')!.textContent!.trim()).toBe('2');
    expect(root.querySelector('[data-field="name"]')!.textContent!.trim()).toBe('Alpha');
    recordset.currentPage[0].setField('amount', 42);
    await inspector.updateComplete;
    expect(root.querySelector('[data-field="amount"]')!.textContent!.trim()).toBe('42');
    recordset.filter = function noMatches() {
        return false;
    };
    await recordset.requestImmediateUpdate();
    await inspector.updateComplete;
    expect(root.textContent).toContain('No records on this page.');
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        '0 of 3 records match'
    );
    expect(recordset.allRecords).toHaveLength(3);
});

it('collapses accessibly and reopens with current data', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const button = inspector.shadowRoot!.querySelector('button')!;
    expect(inspector.shadowRoot!.querySelectorAll('header button')).toHaveLength(1);
    expect(button.classList.contains('inspector-icon')).toBe(true);
    expect(button.querySelector('svg circle')).toBeTruthy();
    expect(button.getAttribute('aria-controls')).toBe('recordset-details');
    expect(button.getAttribute('aria-label')).toBe('Collapse recordset inspector');
    button.click();
    await inspector.updateComplete;
    expect(inspector.hasAttribute('collapsed')).toBe(true);
    const heading = inspector.shadowRoot!.querySelector('h3')!;
    expect(heading.textContent).toBe('Recordset Inspector');
    expect(heading.parentElement!.hasAttribute('hidden')).toBe(true);
    expect(inspector.shadowRoot!.querySelector('section')!.getAttribute('aria-label')).toBe(
        'Recordset Inspector'
    );
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Inspect recordset');
    expect(inspector.shadowRoot!.getElementById('recordset-details')!.hidden).toBe(true);
    expect(inspector.shadowRoot!.querySelector('.record-validity')!.hasAttribute('hidden')).toBe(
        true
    );
    expect(button.hasAttribute('hidden')).toBe(false);
    recordset.allRecords[0].setField('name', 'Updated');
    button.click();
    await inspector.updateComplete;
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.querySelector('svg circle')).toBeTruthy();
    expect(inspector.shadowRoot!.querySelector('.record-validity')!.hasAttribute('hidden')).toBe(
        false
    );
    expect(inspector.shadowRoot!.querySelector('[data-field="name"]')!.textContent!.trim()).toBe(
        'Updated'
    );
});

it('shows header invalidity for all loaded records, including hidden rows and fields', async () => {
    const recordset = data();
    recordset.filter = function enabledOnly(record) {
        return record.getField('enabled') === true;
    };
    const inspector = await inspect(recordset);
    inspector.fields = ['amount'];
    await inspector.updateComplete;
    const root = inspector.shadowRoot!;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    const marker = root.querySelector('header .record-validity')!;
    expect(marker.getAttribute('aria-label')).toBe('Invalid recordset');
    expect(marker.getAttribute('title')).toBe('Invalid recordset');
    expect(marker.querySelector('[aria-label="Invalid"]')).toBeTruthy();
    recordset.allRecords[2].setField('name', 'Valid now');
    await inspector.updateComplete;
    expect(root.querySelector('header .record-validity')).toBeNull();
    recordset.allRecords[0].setField('name', '');
    await inspector.updateComplete;
    expect(root.querySelector('header .record-validity')).toBeTruthy();
});

it('releases subscriptions on replacement and disconnect, and reconnects', async () => {
    const first = data();
    const second = data();
    await second.requestImmediateUpdate();
    const inspector = await inspect(first);
    const removeSet = jest.spyOn(first, 'removeEventListener');
    const removeRow = jest.spyOn(first.allRecords[0], 'removeEventListener');
    inspector.recordset = second;
    await inspector.updateComplete;
    expect(removeSet).toHaveBeenCalledWith('page-changed', expect.any(Function));
    expect(removeRow).toHaveBeenCalledWith('change', expect.any(Function));
    const removeSecond = jest.spyOn(second, 'removeEventListener');
    inspector.remove();
    expect(removeSecond).toHaveBeenCalledWith('updated', expect.any(Function));
    second.allRecords[0].setField('name', 'Reconnected');
    document.body.append(inspector);
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.textContent).toContain('Reconnected');
});

it('supports an unbound inspector and an empty recordset assigned later', async () => {
    const inspector = await inspect();
    expect(inspector.shadowRoot!.textContent).toContain('No recordset selected.');
    expect(inspector.shadowRoot!.querySelector('header .record-validity')).toBeNull();
    const empty = new Recordset<any>({ name: field }, []);
    await empty.requestImmediateUpdate();
    inspector.recordset = empty;
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.textContent).toContain('No records on this page.');
    expect(inspector.shadowRoot!.querySelector('header .record-validity')).toBeNull();
    expect(inspector.shadowRoot!.textContent!.replace(/\s+/g, ' ')).toContain(
        '0 of 0 records match'
    );
});

it('distinguishes server totals from loaded rows', async () => {
    const recordset = new Recordset<any>({ name: field }, function fetchPage() {
        return { data: [{ name: 'Loaded row' }], totalCount: 100 };
    });
    await recordset.requestRefresh();
    const inspector = await inspect(recordset);
    const counts = inspector
        .shadowRoot!.querySelector('.counts')!
        .textContent!.replace(/\s+/g, ' ');
    expect(counts).toContain('100 of 100 records match');
    expect(counts).toContain('1 shown on this page');
    expect(counts).toContain('1 records loaded');
    const state = JSON.parse(inspector.shadowRoot!.querySelector('pre')!.textContent!);
    expect(state.totalRecords).toBe(100);
    expect(state.loadedRecords).toBe(1);
});

it('uses tooltips on field and row state icons without an icon legend', async () => {
    const recordset = new Recordset<any>(
        {
            name: field
                .required()
                .disabled()
                .readOnly()
                .visible(() => false),
        },
        [{ name: '' }]
    );
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    expect(
        [...root.querySelectorAll('[data-field="name"] [role="img"]')].map(icon =>
            icon.getAttribute('aria-label')
        )
    ).toEqual(['Hidden', 'Disabled', 'Read-only', 'Required', 'Invalid']);
    expect(root.querySelector('tbody .row-status [aria-label="Invalid"]')).toBeTruthy();
    expect(root.querySelector('.legend')).toBeNull();
    for (const icon of root.querySelectorAll('.status-icon'))
        expect(icon.getAttribute('title')).toBe(icon.getAttribute('aria-label'));
    recordset.allRecords[0].setField('name', 'Ada');
    await inspector.updateComplete;
    expect(root.querySelector('[data-field="name"] [aria-label="Invalid"]')).toBeNull();
    expect(root.querySelector('tbody .row-status [aria-label="Invalid"]')).toBeNull();
});

it('observes inserted rows and releases removed rows', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const added = recordset.createRecord({ name: 'Added', amount: 7, enabled: true });
    recordset.insertRecord(added);
    await inspector.updateComplete;
    added.setField('name', 'Edited insertion');
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.querySelector('tbody')!.textContent).toContain('Edited insertion');
    const remove = jest.spyOn(added, 'removeEventListener');
    recordset.deleteRecord(added);
    await inspector.updateComplete;
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
    expect(inspector.shadowRoot!.querySelector('tbody')!.textContent).not.toContain(
        'Edited insertion'
    );
});

it('shows only applicable icons on the left without a validation column or valid labels', async () => {
    const inspector = await inspect(data());
    const root = inspector.shadowRoot!;
    const headers = [...root.querySelectorAll('thead th')].map(cell => cell.textContent);
    expect(headers[0]).toBe('');
    expect(headers).not.toContain('Validation');
    expect(root.querySelector('[aria-label="Valid"]')).toBeNull();
    expect(root.querySelector('tbody tr:first-child .row-status')!.textContent!.trim()).toBe('');
    expect(
        root.querySelector('tbody tr:last-child td:first-child [aria-label="Invalid"]')
    ).toBeTruthy();
    const name = root.querySelector('[data-field="name"] .stored-cell')!;
    expect(name.firstElementChild!.classList.contains('field-status')).toBe(true);
    expect(name.lastElementChild!.textContent).toBe('Zulu');
});

it('numbers unique CSS classes across columns, rows and cells and keeps their scopes distinct', async () => {
    const recordset = new Recordset<any>(
        {
            name: field.columnClass('shared heading').rowClass('row shared'),
            amount: field
                .cellClass('shared cell')
                .cellClass(value => (value > 10 ? ['high', 'cell'] : [])),
        },
        [
            { name: 'Ada', amount: 12 },
            { name: 'Grace', amount: 3 },
        ]
    );
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    const toggle = root.querySelector<HTMLInputElement>('.class-toggle input')!;
    expect(toggle.checked).toBe(false);
    expect(root.querySelector('.class-legend')).toBeNull();
    expect(root.querySelector('.class-number')).toBeNull();
    toggle.click();
    await inspector.updateComplete;
    expect([...root.querySelectorAll('.class-entry code')].map(entry => entry.textContent)).toEqual(
        ['shared', 'heading', 'row', 'cell', 'high']
    );
    expect(root.querySelector('.legend')).toBeNull();
    function numbers(selector: string) {
        return [...root.querySelectorAll(`${selector} .class-number`)].map(marker =>
            marker.textContent!.trim()
        );
    }
    expect(numbers('thead th:nth-child(3)')).toEqual(['1', '2']);
    expect(numbers('thead th:nth-child(4)')).toEqual([]);
    expect(numbers('tbody tr:first-child .row-status')).toEqual(['3', '1']);
    expect(numbers('tbody tr:first-child [data-field="amount"]')).toEqual(['1', '4', '5']);
    expect(numbers('tbody tr:last-child [data-field="amount"]')).toEqual(['1', '4']);
    expect(numbers('[data-field="name"]')).toEqual([]);
    expect(
        root
            .querySelector('[data-field="amount"] [title="CSS class 5: high"]')!
            .getAttribute('aria-label')
    ).toBe('CSS class 5: high');
    expect(
        root.querySelector('[data-field="amount"] .stored-cell > span:nth-child(2)')!.textContent
    ).toBe('12');
    toggle.click();
    await inspector.updateComplete;
    expect(root.querySelector('.class-legend')).toBeNull();
    expect(root.querySelector('.class-number')).toBeNull();
    toggle.click();
    await inspector.updateComplete;
    expect(numbers('tbody tr:first-child [data-field="amount"]')).toEqual(['1', '4', '5']);
    recordset.allRecords[0].setField('amount', 2);
    await inspector.updateComplete;
    expect(root.querySelector('[title="CSS class 5: high"]')).toBeNull();
    expect(root.querySelector('.class-legend')!.textContent).not.toContain('high');
    recordset.allRecords[0].setField('amount', 20);
    await inspector.updateComplete;
    expect(numbers('tbody tr:first-child [data-field="amount"]')).toEqual(['1', '4', '5']);
    inspector.fields = ['amount'];
    await inspector.updateComplete;
    expect(root.querySelector('[title="CSS class 2: heading"]')).toBeNull();
    expect(numbers('tbody tr:first-child .row-status')).toEqual([]);
    expect(numbers('tbody tr:first-child [data-field="amount"]')).toEqual(['1', '4', '5']);
    inspector.fields = undefined;
    const replacement = new Recordset<any>({ name: field.columnClass('replacement') }, []);
    await replacement.requestImmediateUpdate();
    inspector.recordset = replacement;
    await inspector.updateComplete;
    expect(root.querySelector('.class-number')!.getAttribute('title')).toBe(
        'CSS class 1: replacement'
    );
});

it('omits the CSS legend and markers when no classes apply', async () => {
    const inspector = await inspect(data());
    expect(inspector.shadowRoot!.querySelector('.class-legend')).toBeNull();
    expect(inspector.shadowRoot!.querySelector('.class-number')).toBeNull();
});

it('defaults to visible rows and toggles all loaded rows without changing the view', async () => {
    const recordset = data();
    recordset.filter = function enabledOnly(record) {
        return record.getField('enabled') === true;
    };
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    const toggle = root.querySelector<HTMLInputElement>('.row-toggle input')!;
    expect(toggle.checked).toBe(false);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('[data-field="name"]')!.textContent!.trim()).toBe('Alpha');
    toggle.click();
    await inspector.updateComplete;
    expect(root.querySelector('table')!.getAttribute('aria-label')).toBe('All loaded rows');
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect([...root.querySelectorAll('tbody th')].map(cell => cell.textContent!.trim())).toEqual([
        '1',
        '2',
        '3',
    ]);
    expect(recordset.currentPage).toHaveLength(1);
    expect(JSON.parse(root.querySelector('pre')!.textContent!).allRows).toHaveLength(3);
    recordset.allRecords[0].setField('name', 'Updated hidden row');
    await inspector.updateComplete;
    expect(root.querySelector('tbody')!.textContent).toContain('Updated hidden row');
    toggle.click();
    await inspector.updateComplete;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('table')!.getAttribute('aria-label')).toBe('Visible rows');
    expect(JSON.parse(root.querySelector('pre')!.textContent!).allRows).toBeUndefined();

    recordset.filter = function allRecords() {
        return true;
    };
    recordset.pageSize = 1;
    recordset.pageNumber = 2;
    await recordset.requestImmediateUpdate();
    await inspector.updateComplete;
    expect(root.querySelector('tbody th')!.textContent!.trim()).toBe('2');
    toggle.click();
    await inspector.updateComplete;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(recordset.pageNumber).toBe(2);
    toggle.click();
    await inspector.updateComplete;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('tbody th')!.textContent!.trim()).toBe('2');
});
