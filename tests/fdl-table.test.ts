import FieldTypeBuilder from '../src/field-type-builder';
import Recordset from '../src/recordset.js';
import Record from '../src/record.js';
import { resizeColumnWidths } from 'bizallele/lit/fdl-table';

type TestTable = HTMLElement & {
    recordset: Recordset<any>;
    updateComplete: Promise<boolean>;
    requestUpdate(): void;
};

const rows = (table: TestTable) =>
    [...(table.shadowRoot?.querySelectorAll('tbody tr') ?? [])].map(row =>
        [...row.querySelectorAll('td')].map(cell => cell.textContent?.trim())
    );

const settle = async (table: TestTable) => {
    await Promise.resolve();
    await Promise.resolve();
    await table.updateComplete;
};

describe('<fdl-table>', () => {
    it.each(['cellClass', 'rowClass'] as const)(
        '%s evaluates classes with each row record and updates them when another field changes',
        async modifier => {
            const classForAmount = jest.fn((value: number, record: Record<any>) =>
                value > record.getField('limit') ? ['warning', 'over-limit'] : []
            );
            const recordset = new Recordset(
                {
                    amount:
                        modifier === 'cellClass'
                            ? new FieldTypeBuilder<number>()
                                  .cellClass('amount')
                                  .cellClass(['numeric'])
                                  .cellClass(classForAmount)
                            : new FieldTypeBuilder<number>()
                                  .rowClass('amount')
                                  .rowClass(['numeric'])
                                  .rowClass(record =>
                                      classForAmount(record.getField('amount'), record)
                                  ),
                    limit: new FieldTypeBuilder<number>(),
                },
                [
                    { amount: 150, limit: 100 },
                    { amount: 150, limit: 200 },
                ]
            );
            const table = document.createElement('fdl-table') as TestTable;
            table.recordset = recordset;
            table.innerHTML = '<fdl-column field="amount"></fdl-column>';
            document.body.append(table);
            await settle(table);

            const targets = () => [
                ...table.shadowRoot!.querySelectorAll(
                    modifier === 'cellClass' ? 'tbody td' : 'tbody tr'
                ),
            ];
            expect(targets().map(target => target.className)).toEqual([
                'amount numeric warning over-limit',
                'amount numeric',
            ]);
            expect(classForAmount).toHaveBeenCalledWith(150, recordset.currentPage[0]);
            expect(classForAmount).toHaveBeenCalledWith(150, recordset.currentPage[1]);

            recordset.currentPage[0].setField('limit', 200);
            await settle(table);
            expect(targets().map(target => target.className)).toEqual([
                'amount numeric',
                'amount numeric',
            ]);
            table.remove();
        }
    );

    it('resizes the left column and distributes the difference to columns on its right', () => {
        expect(
            resizeColumnWidths([150, 100, 100], [{ min: 50 }, { min: 80 }, { min: 50 }], 0, 40)
        ).toEqual([190, 80, 80]);
    });

    it('stops a resize at the configured column limits', () => {
        expect(
            resizeColumnWidths(
                [150, 100],
                [
                    { min: 100, max: 160 },
                    { min: 90, max: 110 },
                ],
                0,
                30
            )
        ).toEqual([160, 90]);
        expect(
            resizeColumnWidths(
                [150, 100],
                [
                    { min: 100, max: 160 },
                    { min: 90, max: 110 },
                ],
                0,
                -30
            )
        ).toEqual([140, 110]);
    });

    it('explains measured widths, preferences, limits and redistributed space', async () => {
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = new Recordset(
            {
                left: new FieldTypeBuilder()
                    .minColumnWidth(110)
                    .targetColumnWidth(160)
                    .maxColumnWidth(260),
                right: new FieldTypeBuilder().minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        table.setAttribute('show-width-diagnostics', '');
        table.innerHTML =
            '<fdl-column field="left"></fdl-column><fdl-column field="right"></fdl-column>';
        document.body.append(table);
        await settle(table);
        const headers = table.shadowRoot!.querySelectorAll('th');
        headers[0].getBoundingClientRect = () => ({ width: 350 }) as DOMRect;
        headers[1].getBoundingClientRect = () => ({ width: 300 }) as DOMRect;
        table.requestUpdate();
        await table.updateComplete;
        await table.updateComplete;
        const explanation = () =>
            table.shadowRoot!.querySelector('.width-explanation')!.textContent!;
        expect(explanation()).toContain('100px above the preferred width; at the maximum');
        expect(explanation()).toContain('Other columns use 300px');
        expect(table.shadowRoot!.querySelector('.width-allocation')!.textContent).toContain(
            '560px'
        );

        table
            .shadowRoot!.querySelector('.resize-handle')!
            .dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
            );
        await table.updateComplete;
        expect(explanation()).toContain('50px below the preferred width; at the minimum');
        expect(explanation()).toContain('Other columns use 450px');
        expect(table.shadowRoot!.querySelector('.width-allocation')!.textContent).toContain(
            '560px'
        );
        table.remove();
    });

    it('exposes column width constraints and supports keyboard resizing', async () => {
        const recordset = new Recordset(
            {
                left: new FieldTypeBuilder()
                    .label('Amount')
                    .minColumnWidth(100)
                    .maxColumnWidth(180),
                right: new FieldTypeBuilder().minColumnWidth(80).maxColumnWidth(120),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.setAttribute('show-width-diagnostics', '');
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const headers = table.shadowRoot?.querySelectorAll<HTMLTableCellElement>('th');
        headers![0].getBoundingClientRect = () => ({ width: 150 }) as DOMRect;
        headers![1].getBoundingClientRect = () => ({ width: 100 }) as DOMRect;

        const press = async (key: string, shiftKey = false) => {
            const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
            const event = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key,
                shiftKey,
            });
            handle?.dispatchEvent(event);
            await table.updateComplete;
            return event;
        };

        expect(await press('ArrowRight')).toHaveProperty('defaultPrevented', true);
        let handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.tabIndex).toBe(0);
        expect(handle?.getAttribute('role')).toBe('separator');
        expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
        expect(handle?.getAttribute('aria-label')).toBe('Resize Amount column');
        expect(handle?.getAttribute('aria-valuemin')).toBe('130');
        expect(handle?.getAttribute('aria-valuemax')).toBe('170');
        expect(handle?.getAttribute('aria-valuenow')).toBe('151');

        await press('ArrowRight', true);
        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:161px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:89px'
        );

        await press('End');
        handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.getAttribute('aria-valuenow')).toBe('170');
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        expect(table.shadowRoot!.querySelector('.width-diagnostics')!.textContent).toContain(
            '170px'
        );
        expect(
            table.shadowRoot!.querySelector('.width-diagnostics [role=status]')!.textContent
        ).toContain('neighboring column');
        await press('Home');
        handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.getAttribute('aria-valuenow')).toBe('130');
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:120px'
        );

        await press('ArrowLeft');
        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:130px'
        );

        table.remove();
    });

    it('continues tracking a drag after rendering replaces the resize handle', async () => {
        const recordset = new Recordset(
            {
                left: new FieldTypeBuilder().minColumnWidth(100),
                right: new FieldTypeBuilder().minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        expect(columns).toHaveLength(2);
        columns![0].getBoundingClientRect = () => ({ width: 150 }) as DOMRect;
        columns![1].getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('pointermove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('pointerup'));
        table.remove();
    });

    it('supports mouse dragging when pointer events are unavailable', async () => {
        const recordset = new Recordset(
            {
                left: new FieldTypeBuilder().minColumnWidth(100),
                right: new FieldTypeBuilder().minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        columns![0].getBoundingClientRect = () => ({ width: 150 }) as DOMRect;
        columns![1].getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('mouseup'));
        table.remove();
    });

    it('measures rendered header cells when col elements have no layout boxes', async () => {
        const recordset = new Recordset(
            {
                left: new FieldTypeBuilder().minColumnWidth(100),
                right: new FieldTypeBuilder().minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        columns![0].getBoundingClientRect = () => ({ width: 0 }) as DOMRect;
        columns![1].getBoundingClientRect = () => ({ width: 0 }) as DOMRect;
        const headers = table.shadowRoot?.querySelectorAll<HTMLTableCellElement>('th');
        headers![0].getBoundingClientRect = () => ({ width: 150 }) as DOMRect;
        headers![1].getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('mouseup'));
        table.remove();
    });

    it('renders recordset fields through declarative columns', async () => {
        const recordset = new Recordset(
            {
                firstName: new FieldTypeBuilder().label('First name'),
                lastName: new FieldTypeBuilder().label('Last name'),
            },
            [
                { firstName: 'Ada', lastName: 'Lovelace' },
                { firstName: 'Grace', lastName: 'Hopper' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="firstName"></fdl-column>
            <fdl-column field="lastName"></fdl-column>
        `;
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        expect(
            [...(table.shadowRoot?.querySelectorAll('th') ?? [])].map(header =>
                header.textContent?.trim()
            )
        ).toEqual(['First name', 'Last name']);
        expect(rows(table)).toEqual([
            ['Ada', 'Lovelace'],
            ['Grace', 'Hopper'],
        ]);

        table.remove();
    });

    it('promotes the newest sort while retaining earlier sorts as tie-breakers', async () => {
        const compare = (left: string, right: string) => left.localeCompare(right) as -1 | 0 | 1;
        const recordset = new Recordset(
            {
                firstName: new FieldTypeBuilder<string>().compareFunction(compare),
                lastName: new FieldTypeBuilder<string>().compareFunction(compare),
            },
            [
                { firstName: 'Ada', lastName: 'Zulu' },
                { firstName: 'Grace', lastName: 'Alpha' },
                { firstName: 'Ada', lastName: 'Mike' },
                { firstName: 'Grace', lastName: 'Beta' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="firstName"></fdl-column>
            <fdl-column field="lastName"></fdl-column>
        `;
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        const headers = table.shadowRoot?.querySelectorAll<HTMLButtonElement>('th button');
        headers?.[1].click();
        await settle(table);
        headers?.[0].click();
        await settle(table);

        expect(recordset.sortColumns).toEqual([
            { field: 'firstName', sort: 'ascending' },
            { field: 'lastName', sort: 'ascending' },
        ]);
        expect(rows(table)).toEqual([
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
        ]);
        expect(headers?.[0].title).toContain('sort priority 1');
        expect(headers?.[1].title).toContain('sort priority 2');

        headers?.[0].click();
        await settle(table);
        expect(rows(table)).toEqual([
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
        ]);

        // An existing secondary sort toggles and becomes the primary sort.
        headers?.[1].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            { field: 'lastName', sort: 'descending' },
            { field: 'firstName', sort: 'descending' },
        ]);
        expect(rows(table)).toEqual([
            ['Ada', 'Zulu'],
            ['Ada', 'Mike'],
            ['Grace', 'Beta'],
            ['Grace', 'Alpha'],
        ]);
        expect(headers?.[1].title).toContain('sort priority 1');
        expect(headers?.[0].title).toContain('sort priority 2');
        expect(headers?.[1].closest('th')!.getAttribute('aria-sort')).toBe('descending');
        expect(headers?.[0].closest('th')!.hasAttribute('aria-sort')).toBe(false);

        // Further clicks alternate directions without removing either sort.
        headers?.[1].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            { field: 'lastName', sort: 'ascending' },
            { field: 'firstName', sort: 'descending' },
        ]);
        expect(rows(table)).toEqual([
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
        ]);
        headers?.[0].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            { field: 'firstName', sort: 'ascending' },
            { field: 'lastName', sort: 'ascending' },
        ]);
        expect(rows(table)).toEqual([
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
        ]);
        table.remove();
    });

    it('does not sort fields configured with sortable(false)', async () => {
        const recordset = new Recordset({ name: new FieldTypeBuilder().sortable(false) }, [
            { name: 'Zulu' },
            { name: 'Alpha' },
        ]);
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = '<fdl-column field="name"></fdl-column>';
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        expect(table.shadowRoot?.querySelector('th button')).toBeNull();
        expect(recordset.sortColumns).toEqual([]);

        table.remove();
    });

    it('filters a column from an accessible header control', async () => {
        const recordset = new Recordset(
            {
                name: new FieldTypeBuilder().label('Name').filter(),
                team: new FieldTypeBuilder().label('Team'),
            },
            [
                { name: 'Ada', team: 'Research' },
                { name: 'Grace', team: 'Platform' },
                { name: 'Margaret', team: 'Research' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="name"></fdl-column>
            <fdl-column field="team"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        expect(table.shadowRoot?.querySelector('[aria-label="Filter Team"]')).toBeNull();
        const filterButton = table.shadowRoot?.querySelector<HTMLButtonElement>(
            '[aria-label="Filter Name"]'
        );
        filterButton?.click();
        await table.updateComplete;

        expect(filterButton?.getAttribute('aria-expanded')).toBe('true');
        const input = table.shadowRoot?.querySelector<HTMLInputElement>(
            '[data-filter-input="name"]'
        );
        expect(table.shadowRoot?.activeElement).toBe(input);
        input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
        await table.updateComplete;
        expect(table.shadowRoot?.querySelector('[role="dialog"]')).toBeNull();
        expect(table.shadowRoot?.activeElement).toBe(filterButton);

        filterButton?.click();
        await table.updateComplete;
        const reopenedInput = table.shadowRoot?.querySelector<HTMLInputElement>(
            '[data-filter-input="name"]'
        );
        reopenedInput!.value = 'gr';
        reopenedInput?.dispatchEvent(new InputEvent('input', { bubbles: true }));
        await recordset.requestImmediateUpdate();
        await settle(table);

        expect(rows(table)).toEqual([['Grace', 'Platform']]);
        expect(table.shadowRoot?.querySelector('.filter-chip')?.textContent).toContain(
            'Name: “gr”'
        );
        expect(filterButton?.classList.contains('filtered')).toBe(true);

        table.shadowRoot?.querySelector<HTMLButtonElement>('.filter-chip')?.click();
        await recordset.requestImmediateUpdate();
        await settle(table);
        expect(rows(table)).toEqual([
            ['Ada', 'Research'],
            ['Grace', 'Platform'],
            ['Margaret', 'Research'],
        ]);

        table.remove();
    });

    it('combines column filters with an application-owned Recordset filter', async () => {
        const recordset = new Recordset(
            {
                name: new FieldTypeBuilder<string>().filter((text, value) =>
                    value.toLowerCase().startsWith(text.toLowerCase())
                ),
                team: new FieldTypeBuilder().filter(),
            },
            [
                { name: 'Ada', team: 'Research' },
                { name: 'Grace', team: 'Research' },
                { name: 'Margaret', team: 'Platform' },
            ]
        );
        const applicationFilter = (record: any) => record.getField('team') === 'Research';
        recordset.filter = applicationFilter;
        await recordset.requestImmediateUpdate();

        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="name"></fdl-column>
            <fdl-column field="team"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const setColumnFilter = async (field: string, value: string) => {
            table.shadowRoot
                ?.querySelector<HTMLButtonElement>(
                    `[aria-label="Filter ${field[0].toUpperCase()}${field.slice(1)}"]`
                )
                ?.click();
            await table.updateComplete;
            const input = table.shadowRoot?.querySelector<HTMLInputElement>(
                `[data-filter-input="${field}"]`
            );
            input!.value = value;
            input?.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await recordset.requestImmediateUpdate();
            await settle(table);
        };

        await setColumnFilter('name', 'gr');
        expect(rows(table)).toEqual([['Grace', 'Research']]);

        await setColumnFilter('team', 'search');
        expect(rows(table)).toEqual([['Grace', 'Research']]);
        expect(table.shadowRoot?.querySelectorAll('.filter-chip')).toHaveLength(2);

        table.shadowRoot?.querySelector<HTMLButtonElement>('.clear-all')?.click();
        await recordset.requestImmediateUpdate();
        await settle(table);
        expect(recordset.filter).toBe(applicationFilter);
        expect(rows(table)).toEqual([
            ['Ada', 'Research'],
            ['Grace', 'Research'],
        ]);

        table.remove();
    });
});

it.each([true, false])('aligns table headings and cells for sortable=%s', async sortable => {
    const recordset = new Recordset(
        Object.fromEntries(
            (['left', 'center', 'right'] as const).map(alignment => [
                alignment,
                new FieldTypeBuilder().label(alignment).textAlign(alignment).sortable(sortable),
            ])
        ),
        [{ left: 'Ada', center: 'Ada', right: 'Ada' }]
    );
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML =
        '<fdl-column field="left"></fdl-column><fdl-column field="center"></fdl-column><fdl-column field="right"></fdl-column>';
    document.body.append(table);
    await table.updateComplete;
    await recordset.requestImmediateUpdate();
    await settle(table);
    expect(
        [...table.shadowRoot!.querySelectorAll('th')].map(header => header.style.textAlign)
    ).toEqual(['left', 'center', 'right']);
    expect(
        [...table.shadowRoot!.querySelectorAll('tbody td')].map(
            cell => (cell as HTMLElement).style.textAlign
        )
    ).toEqual(['left', 'center', 'right']);
    expect(table.shadowRoot!.querySelectorAll('.sort-button')).toHaveLength(sortable ? 3 : 0);
    table.remove();
});

it('resolves column settings without a row and field settings with header and cell contexts', async () => {
    const width = jest.fn(() => 120);
    const sortable = jest.fn(() => true);
    const label = jest.fn((record: Record<any>) => `Amount:${record.getField('amount')}`);
    const amount = new FieldTypeBuilder<number>()
        .label(label)
        .minColumnWidth(width)
        .maxColumnWidth(200)
        .targetColumnWidth(150)
        .sortable(sortable)
        .textAlign((_value, _record, context) => (context === 'table' ? 'right' : 'center'));
    const recordset = new Recordset({ amount }, [{ amount: 150 }]);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="amount"></fdl-column>';
    document.body.append(table);
    await settle(table);
    expect(width).toHaveBeenCalledWith();
    expect(sortable).toHaveBeenCalledWith();
    expect(label).toHaveBeenCalledWith(recordset.currentPage[0]);
    expect(table.shadowRoot!.querySelector('col')!.style.minWidth).toBe('120px');
    expect((table.shadowRoot!.querySelector('th') as HTMLElement).style.textAlign).toBe('center');
    expect((table.shadowRoot!.querySelector('td') as HTMLElement).style.textAlign).toBe('right');
    table.remove();
});

it('renders an empty table without invoking per-record header settings', async () => {
    const callback = jest.fn(() => {
        throw new Error('no record');
    });
    const amount = new FieldTypeBuilder<number>().label(callback).textAlign(callback);
    const recordset = new Recordset<{ amount: number }>({ amount }, []);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="amount"></fdl-column>';
    document.body.append(table);
    await settle(table);
    expect(table.shadowRoot!.textContent).toContain('No rows to display.');
    expect(callback).not.toHaveBeenCalled();
    table.remove();
});

function paginationButton(table: TestTable, text: string) {
    return [...table.shadowRoot!.querySelectorAll<HTMLButtonElement>('.pagination button')].find(
        button => button.textContent === text
    )!;
}

async function paginatedTable(count = 23, pageSize = 10) {
    const recordset = new Recordset(
        { name: new FieldTypeBuilder<string>().label('Name').filter() },
        Array.from({ length: count }, (_, index) => ({ name: `Row ${index + 1}` }))
    );
    recordset.setInitialPageSize(pageSize);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="name"></fdl-column>';
    document.body.append(table);
    await settle(table);
    return table;
}

it('navigates every page boundary and changes page size through the recordset', async () => {
    const table = await paginatedTable();
    const summary = () =>
        table.shadowRoot!.querySelector('.page-summary')!.textContent!.replace(/\s+/g, ' ').trim();
    expect(rows(table)).toHaveLength(10);
    expect(table.shadowRoot!.querySelector<HTMLSelectElement>('select')!.value).toBe('10');
    expect(summary()).toBe('1–10 of 23 rows · Page 1 of 3');
    expect(paginationButton(table, 'First').disabled).toBe(true);
    expect(paginationButton(table, 'Previous').disabled).toBe(true);

    paginationButton(table, 'Next').click();
    await table.recordset.updating;
    await settle(table);
    expect(rows(table)[0]).toEqual(['Row 11']);
    paginationButton(table, 'Last').click();
    await table.recordset.updating;
    await settle(table);
    expect(rows(table)).toEqual([['Row 21'], ['Row 22'], ['Row 23']]);
    expect(summary()).toBe('21–23 of 23 rows · Page 3 of 3');
    expect(paginationButton(table, 'Next').disabled).toBe(true);
    expect(paginationButton(table, 'Last').disabled).toBe(true);

    paginationButton(table, 'Previous').click();
    await table.recordset.updating;
    await settle(table);
    expect(table.recordset.pageNumber).toBe(2);
    paginationButton(table, 'First').click();
    await table.recordset.updating;
    await settle(table);
    expect(table.recordset.pageNumber).toBe(1);

    table.recordset.pageNumber = 3;
    await table.recordset.updating;
    await settle(table);
    const select = table.shadowRoot!.querySelector<HTMLSelectElement>('.page-size select')!;
    select.value = '25';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await table.recordset.updating;
    await settle(table);
    expect(table.recordset.pageSize).toBe(25);
    expect(table.recordset.pageNumber).toBe(1);
    expect(rows(table)).toHaveLength(23);
    expect(select.value).toBe('25');
    table.remove();
});

it('reflects custom page sizes, filter and sort resets, and an empty result', async () => {
    const table = await paginatedTable(23, 7);
    const select = table.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
    expect(select.value).toBe('7');
    table.recordset.pageNumber = 3;
    await table.recordset.updating;
    await settle(table);
    table.shadowRoot!.querySelector<HTMLButtonElement>('.sort-button')!.click();
    await table.recordset.updating;
    await settle(table);
    expect(table.recordset.pageNumber).toBe(1);
    table.recordset.pageNumber = 3;
    await table.recordset.updating;
    await settle(table);
    table.shadowRoot!.querySelector<HTMLButtonElement>('.filter-button')!.click();
    await settle(table);
    const input = table.shadowRoot!.querySelector<HTMLInputElement>('[data-filter-input]')!;
    input.value = 'Row 23';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await table.recordset.updating;
    await settle(table);
    expect(rows(table)).toEqual([['Row 23']]);
    expect(table.shadowRoot!.querySelector('.page-summary')!.textContent).toContain('Page 1 of 1');
    input.value = 'missing';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await table.recordset.updating;
    await settle(table);
    expect(table.shadowRoot!.querySelector('.page-summary')!.textContent).toContain('0–0');
    expect(table.shadowRoot!.querySelector('.page-summary')!.textContent).toContain('Page 0 of 0');
    expect(
        [...table.shadowRoot!.querySelectorAll<HTMLButtonElement>('.pagination button')].every(
            button => button.disabled
        )
    ).toBe(true);
    table.remove();
});

it('returns to the last available page when rows are deleted', async () => {
    const table = await paginatedTable(11);
    paginationButton(table, 'Last').click();
    await table.recordset.updating;
    await settle(table);
    table.recordset.deleteRecord(table.recordset.currentPage[0]);
    await table.recordset.updating;
    await settle(table);
    expect(table.recordset.pageNumber).toBe(1);
    expect(rows(table)).toHaveLength(10);
    table.remove();
});

it('requests server pages and disables controls until the response arrives', async () => {
    let finishPage: (() => void) | undefined;
    const fetch = jest.fn(({ startIndex, pageSize }) => {
        const result = {
            data: Array.from({ length: Math.min(pageSize, 23 - startIndex) }, (_, index) => ({
                name: `Row ${startIndex + index + 1}`,
            })),
            totalCount: 23,
        };
        if (startIndex === 0) return result;
        return new Promise<typeof result>(resolve => {
            finishPage = () => resolve(result);
        });
    });
    const recordset = new Recordset({ name: new FieldTypeBuilder() }, fetch);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="name"></fdl-column>';
    document.body.append(table);
    await settle(table);
    paginationButton(table, 'Next').click();
    await settle(table);
    expect(
        [
            ...table.shadowRoot!.querySelectorAll<HTMLButtonElement | HTMLSelectElement>(
                '.pagination button, .pagination select'
            ),
        ].every(control => control.disabled)
    ).toBe(true);
    const updated = recordset.updating;
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, startIndex: 10, pageSize: 10 })
    );
    finishPage!();
    await updated;
    await settle(table);
    expect(rows(table)[0]).toEqual(['Row 11']);
    expect(paginationButton(table, 'Next').disabled).toBe(false);
    table.remove();
});

class TestFieldCell extends HTMLElement {
    private boundField?: import('../src/index').Field;
    connectedField?: import('../src/index').Field;
    private refresh = () => {
        this.textContent = String(this.boundField?.rawValue);
    };
    get field() {
        return this.boundField!;
    }
    set field(field: import('../src/index').Field) {
        this.boundField?.record.removeEventListener('change', this.refresh);
        this.boundField = field;
        if (this.isConnected) field.record.addEventListener('change', this.refresh);
        this.refresh();
    }
    connectedCallback() {
        this.connectedField = this.field;
        this.boundField?.record.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.boundField?.record.removeEventListener('change', this.refresh);
    }
}
customElements.define('test-field-cell', TestFieldCell);

it('binds distinct child instances before connection and preserves them through edits and sorting', async () => {
    const recordset = new Recordset({ amount: new FieldTypeBuilder<number>() }, [
        { amount: 2 },
        { amount: 1 },
    ]);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML =
        '<fdl-column field="amount"><test-field-cell title="Amount"></test-field-cell></fdl-column>';
    document.body.append(table);
    try {
        await settle(table);
        const cells = () =>
            Array.from(table.shadowRoot!.querySelectorAll<TestFieldCell>('tbody test-field-cell'));
        const [first, second] = cells();
        expect(first).not.toBe(second);
        expect(first).not.toBe(table.querySelector('test-field-cell'));
        expect(first.field).toBe(recordset.currentPage[0].field('amount'));
        expect(first.connectedField).toBe(first.field);
        expect(first.title).toBe('Amount');
        first.field.rawValue = 3;
        await settle(table);
        expect(cells()[0]).toBe(first);
        expect(first.textContent).toBe('3');
        await recordset.sort({ field: 'amount', sort: 'ascending' });
        await recordset.requestImmediateUpdate();
        await settle(table);
        expect(cells()).toEqual([second, first]);
        expect(first.field.rawValue).toBe(3);
        expect(table.querySelector<TestFieldCell>('test-field-cell')!.field).toBeUndefined();
    } finally {
        table.remove();
    }
});

it('updates child prototypes, switches fields and recordsets, and restores formatted templates', async () => {
    const table = document.createElement('fdl-table') as TestTable;
    const definition = {
        amount: new FieldTypeBuilder<number>().template(value => `Amount: ${value}`),
        other: new FieldTypeBuilder<string>(),
    };
    table.recordset = new Recordset(definition, [{ amount: 2, other: 'Other' }]);
    table.innerHTML =
        '<fdl-column field="amount"><test-field-cell title="Original"></test-field-cell></fdl-column>';
    document.body.append(table);
    try {
        await settle(table);
        const column = table.querySelector('fdl-column')!;
        const child = () =>
            table.shadowRoot!.querySelector<TestFieldCell>('tbody test-field-cell')!;
        const original = child();
        column.firstElementChild!.setAttribute('title', 'Changed');
        await settle(table);
        expect(child()).not.toBe(original);
        expect(child().title).toBe('Changed');
        column.setAttribute('field', 'other');
        await settle(table);
        expect(child().field).toBe(table.recordset.currentPage[0].field('other'));
        expect(child().textContent).toBe('Other');
        table.recordset = new Recordset(definition, [{ amount: 9, other: 'Replacement' }]);
        await settle(table);
        expect(child().textContent).toBe('Replacement');
        column.setAttribute('field', 'amount');
        column.replaceChildren();
        await settle(table);
        expect(child()).toBeNull();
        expect(rows(table)).toEqual([['Amount: 9']]);
    } finally {
        table.remove();
    }
});
