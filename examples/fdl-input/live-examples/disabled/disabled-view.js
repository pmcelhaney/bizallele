import { record } from './disabled-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function disabledView() {
    return html`
        <fdl-field .record=${record} field="lockedId"></fdl-field>
        <fdl-field .record=${record} field="approvalStatus"></fdl-field>
        <fdl-field .record=${record} field="budget"></fdl-field>
    `;
}
