import { field, Record } from 'bizallele';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
export const record = new Record(
    {
        money: field
            .label('Money')
            .formatter(value => currency.format(Number(value)))
            .parser(value => Number(String(value).replace(/[$,]/g, ''))),
    },
    { money: 1000 }
);
