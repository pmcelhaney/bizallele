import { html } from 'lit';
import { Record } from '@pmcelhaney/bizallele';

export const describeValue = (value: unknown): string => {
    if (typeof value === 'number' && !Number.isFinite(value))
        return `${String(value)} (number)`;
    if (value === '') return '(empty string)';
    if (value === undefined) return '(undefined)';
    return `${JSON.stringify(value)} (${Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value})`;
};
export function recordSummary(
    record: Record<any>,
    fields = Object.keys(record.values)
) {
    return html`<dl class="state-summary"
        >${fields.map(field => {
            const fieldView = record.field(field);
            return html`<dt>${fieldView.label || field}</dt
                ><dd
                    >${describeValue(record.getField(field))}<small
                        >${fieldView.visible ? 'Visible' : 'Hidden'} ·
                        ${fieldView.required ? 'Required' : 'Optional'} ·
                        ${fieldView.disabled ? 'Disabled' : fieldView.readOnly ? 'Read-only' : 'Editable'}
                        · ${record.isValid(field) ? 'Valid' : 'Invalid'}</small
                    ></dd
                >`;
        })}</dl
    >`;
}
