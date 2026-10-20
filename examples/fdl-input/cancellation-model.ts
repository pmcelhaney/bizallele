import {
    cancellationFields,
    type CancellationRules,
} from './cancellation-rules';
export {
    cancellationFields,
    type CancellationRules,
} from './cancellation-rules';
import { Record } from 'bizallele';
export const cancellationCases = [
    {
        status: 'active',
        reason: '',
        visible: false,
        required: false,
        valid: true,
    },
    {
        status: 'active',
        reason: 'Changed plans',
        visible: false,
        required: false,
        valid: true,
    },
    {
        status: 'cancelled',
        reason: '',
        visible: true,
        required: true,
        valid: false,
    },
    {
        status: 'cancelled',
        reason: 'Changed plans',
        visible: true,
        required: true,
        valid: true,
    },
];
export function checkCancellation(rules: CancellationRules) {
    return cancellationCases.map(sample => {
        const record = new Record(cancellationFields(rules), {
                status: sample.status,
                reason: sample.reason,
            }),
            field = record.field('reason');
        const actual = {
            visible: field.visible,
            required: field.required,
            valid: record.isValid(),
        };
        return {
            sample,
            actual,
            passes:
                actual.visible === sample.visible &&
                actual.required === sample.required &&
                actual.valid === sample.valid,
        };
    });
}
export function checkCancellationTransition(rules: CancellationRules) {
    const reason = 'Changed plans';
    const record = new Record(cancellationFields(rules), {
        status: 'cancelled',
        reason,
    });
    record.setField('status', 'active');
    const activeReason = record.getField('reason');
    const hidden = !record.field('reason').visible;
    record.setField('status', 'cancelled');
    const returnedReason = record.getField('reason');
    return {
        activeReason,
        returnedReason,
        passes:
            hidden &&
            activeReason === reason &&
            returnedReason === reason &&
            record.field('reason').visible &&
            record.isValid(),
    };
}
