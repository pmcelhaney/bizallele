import { field, Record } from 'bizallele';
export function createReducerType() {
    return field.reducer('sum');
}
export const record = new Record(
    {
        firstAmount: field.label('First amount').type('number').parser(Number),
        secondAmount: field
            .label('Second amount')
            .type('number')
            .parser(Number),
        thirdAmount: field.label('Third amount').type('number').parser(Number),
    },
    { firstAmount: 1200, secondAmount: 800, thirdAmount: 500 }
);
