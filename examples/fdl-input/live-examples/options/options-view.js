import { record } from './options-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function optionsView() {
    return html`
        <fdl-field .record=${record} field="department"></fdl-field>
        <fdl-field .record=${record} field="assignee"></fdl-field>
        <fdl-field .record=${record} field="asyncAssignee"></fdl-field>
    `;
}
