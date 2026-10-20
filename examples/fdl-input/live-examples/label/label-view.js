import { record } from './label-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';

export function labelView() {
    return html`
        <fdl-field .record=${record} field="expenseType"></fdl-field>
        <fdl-field .record=${record} field="dynamicAmount"></fdl-field>
    `;
}
