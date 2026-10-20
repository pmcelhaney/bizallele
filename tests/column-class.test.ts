import FieldTypeBuilder from '../src/field-type-builder';
import Record from '../src/record.js';
import Recordset from '../src/recordset.js';
import 'bizallele/lit/fdl-table';

type TestTable = HTMLElement & {
    recordset: Recordset<any>;
    updateComplete: Promise<boolean>;
    requestUpdate(): void;
};

const settle = async (table: TestTable) => {
    await table.recordset.requestImmediateUpdate();
    await table.updateComplete;
};
afterEach(() => {
    document.body.innerHTML = '';
});

it('accumulates immutable column classes and resolves callbacks without arguments', () => {
    const classes = ['amount'];
    let compact = false;
    const callback = jest.fn(() => (compact ? ['compact', 'numeric'] : 'numeric'));
    const base = new FieldTypeBuilder<number>().columnClass(classes);
    const specialized = base.columnClass(callback).columnClass(['currency']);
    classes.push('outside');
    expect(new FieldTypeBuilder().valueOf().columnClasses()).toEqual([]);
    expect(base.valueOf().columnClasses()).toEqual(['amount']);
    expect(specialized.valueOf().columnClasses()).toEqual(['amount', 'numeric', 'currency']);
    expect(callback).toHaveBeenLastCalledWith();
    specialized.valueOf().columnClasses().push('result-only');
    compact = true;
    expect(specialized.valueOf().columnClasses()).toEqual([
        'amount',
        'compact',
        'numeric',
        'currency',
    ]);
    expect(base.valueOf().columnClasses()).toEqual(['amount']);
});

it.each([true, false])(
    'applies column classes to col, th, and every td with sortable=%s',
    async sortable => {
        let sharedClass = 'currency';
        const columnCallback = jest.fn(() => sharedClass);
        const cellCallback = jest.fn((value: number, record: Record<any>) =>
            value > record.getField('limit') ? 'over-limit' : []
        );
        const recordset = new Recordset(
            {
                amount: new FieldTypeBuilder<number>()
                    .columnClass('amount-column')
                    .columnClass(['numeric'])
                    .columnClass(columnCallback)
                    .cellClass('amount-cell')
                    .cellClass(cellCallback)
                    .sortable(sortable),
                limit: new FieldTypeBuilder<number>(),
            },
            [
                { amount: 150, limit: 100 },
                { amount: 50, limit: 100 },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML =
            '<fdl-column field="amount"></fdl-column><fdl-column field="limit"></fdl-column>';
        document.body.append(table);
        await settle(table);
        const root = table.shadowRoot!;
        const amountCells = () => [...root.querySelectorAll('tbody tr td:first-child')];
        expect(root.querySelector('col')!.className).toBe('amount-column numeric currency');
        expect(root.querySelector('th')!.className).toBe('amount-column numeric currency');
        expect(amountCells().map(cell => cell.className)).toEqual([
            'amount-column numeric currency amount-cell over-limit',
            'amount-column numeric currency amount-cell',
        ]);
        expect(root.querySelector('col:nth-child(2)')!.className).toBe('');
        expect(root.querySelector('th:nth-child(2)')!.className).toBe('');
        expect(
            [...root.querySelectorAll('tbody tr td:nth-child(2)')].map(cell => cell.className)
        ).toEqual(['', '']);
        expect(columnCallback.mock.calls.every(args => args.length === 0)).toBe(true);
        expect(cellCallback).toHaveBeenCalledWith(150, recordset.currentPage[0]);
        expect(cellCallback).toHaveBeenCalledWith(50, recordset.currentPage[1]);
        sharedClass = 'updated';
        recordset.currentPage[0].setField('limit', 200);
        await settle(table);
        expect(root.querySelector('col')!.className).toBe('amount-column numeric updated');
        expect(root.querySelector('th')!.className).toBe('amount-column numeric updated');
        expect(amountCells().map(cell => cell.className)).toEqual([
            'amount-column numeric updated amount-cell',
            'amount-column numeric updated amount-cell',
        ]);
    }
);

it('styles columns and headings without evaluating a cell callback on an empty table', async () => {
    const callback = jest.fn(() => 'amount-column');
    const cellCallback = jest.fn(() => {
        throw new Error('no cell');
    });
    const recordset = new Recordset<{ amount: number }>(
        {
            amount: new FieldTypeBuilder<number>().columnClass(callback).cellClass(cellCallback),
        },
        []
    );
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="amount"></fdl-column>';
    document.body.append(table);
    await settle(table);
    expect(table.shadowRoot!.querySelector('col')!.className).toBe('amount-column');
    expect(table.shadowRoot!.querySelector('th')!.className).toBe('amount-column');
    expect(table.shadowRoot!.querySelector('td')!.className).toBe('empty-state');
    expect(callback).toHaveBeenCalledWith();
    expect(cellCallback).not.toHaveBeenCalled();
});
