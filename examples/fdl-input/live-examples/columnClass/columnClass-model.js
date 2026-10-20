import { field, Recordset } from 'bizallele';
export const recordset = new Recordset(
    {
        day: field.label('Day'),
        amount: field
            .label('Expenses')
            .textAlign('right')
            .columnClass('expense-column')
            .columnClass(['numeric-column'])
            .cellClass(value => (Number(value) > 100 ? 'high-value' : [])),
    },
    [
        { day: 'Monday', amount: 85.5 },
        { day: 'Tuesday', amount: 142.75 },
    ]
);
