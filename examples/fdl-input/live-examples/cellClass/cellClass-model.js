import { field, Record, Recordset } from 'bizallele';
import {
    weeklyExpenses,
    expenseHighlightThreshold,
} from '../../weekly-expenses';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
export const probes = new Record(
    {
        classThreshold: field
            .label('Daily Expense Limit')
            .type('number')
            .parser(Number),
    },
    { classThreshold: expenseHighlightThreshold }
);
export const recordset = new Recordset(
    {
        day: field.label('Day').sortable(false),
        amount: field
            .label('Expenses')
            .textAlign('right')
            .formatter(value => currency.format(Number(value)))
            .cellClass('amount-cell')
            .cellClass(value =>
                value > probes.getField('classThreshold')
                    ? ['high-value', 'over-limit']
                    : []
            ),
    },
    Array.from({ length: 5 }, (_, week) =>
        weeklyExpenses.map(expense => ({
            ...expense,
            day: `Week ${week + 1}, ${expense.day}`,
        }))
    ).flat()
);
