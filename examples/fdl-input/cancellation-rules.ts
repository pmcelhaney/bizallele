import { field } from 'bizallele';
export type CancellationRules = {
    visibility: 'always' | 'cancelled';
    requiredness: 'always' | 'cancelled' | 'never';
};
export function cancellationFields(rules: CancellationRules) {
    let reason = field.label('Cancellation reason').rowCount(2);
    if (rules.visibility === 'cancelled')
        reason = reason.visible(
            record => record.getField('status') === 'cancelled'
        );
    if (rules.requiredness === 'always') reason = reason.required();
    if (rules.requiredness === 'cancelled')
        reason = reason.required(
            record => record.getField('status') === 'cancelled'
        );
    return {
        status: field.label('Request status').options([
            { text: 'Active', value: 'active' },
            { text: 'Cancelled', value: 'cancelled' },
        ]),
        reason,
    };
}
