import { field, Record } from 'bizallele';

export type CompositionRules = {
    visibility: 'all' | 'shipping';
    requiredness: 'never' | 'shipping' | 'always';
    validation: 'off' | 'on';
};
export const defaultCompositionRules: CompositionRules = {
    visibility: 'shipping',
    requiredness: 'shipping',
    validation: 'on',
};
export const hasStreetNumber = (value: string) =>
    /^\d+\s+\S/.test(value.trim());

export function compositionFields(rules: CompositionRules) {
    let address = field.label('Shipping address');
    if (rules.visibility === 'shipping')
        address = address.visible(
            record => record.getField('fulfillment') === 'ship'
        );
    if (rules.requiredness === 'always') address = address.required();
    if (rules.requiredness === 'shipping')
        address = address.required(
            record => record.getField('fulfillment') === 'ship'
        );
    if (rules.validation === 'on')
        address = address.validator({
            name: 'must start with a street number and a street name',
            validate: value => value === '' || hasStreetNumber(value),
        });
    return {
        fulfillment: field.label('Delivery method').options([
            { text: 'Ship to address', value: 'ship' },
            { text: 'Pick up in person', value: 'pickup' },
        ]),
        address,
    };
}
export function compositionRecord(
    rules: CompositionRules,
    fulfillment: string,
    address: string
) {
    return new Record(compositionFields(rules), { fulfillment, address });
}
