import { field, Record, Recordset } from 'bizallele';
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
export function learningFields(step = 0) {
    let charge = field.label('Delivery charge').textAlign('right');
    if (step >= 1)
        charge = charge
            .parser(value =>
                String(value).trim() === ''
                    ? undefined
                    : Number(String(value).replace(/[$,]/g, ''))
            )
            .formatter((value: unknown, _record?: unknown, context?: string) =>
                value == null
                    ? ''
                    : context === 'input-focus'
                      ? String(value)
                      : currency.format(Number(value))
            );
    if (step >= 2) {
        charge = charge.validator({
            name: 'must be a finite, non-negative number',
            validate: value =>
                value == null ||
                (typeof value === 'number' &&
                    Number.isFinite(value) &&
                    value >= 0),
        });
        charge =
            step >= 3
                ? charge.required(
                      record => record.getField('method') === 'ship'
                  )
                : charge.required();
    }
    if (step >= 3)
        charge = charge.visible(record => record.getField('method') === 'ship');
    return {
        method: field.label('Delivery method').options([
            { text: 'Ship', value: 'ship' },
            { text: 'Pickup', value: 'pickup' },
        ]),
        charge,
    };
}
export function createLearningRecord(
    step = 0,
    values = { method: 'ship', charge: '$25.00' as any }
) {
    return new Record(learningFields(step), values);
}
export function createLearningTable(step = 4) {
    return new Recordset<{ method: string; charge: any }>(
        learningFields(step),
        []
    );
}
