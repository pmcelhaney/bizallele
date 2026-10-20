import { record } from './readOnly-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function readOnlyView() {
    return html`
        <fdl-field .record=${record} field="fixedOwner"></fdl-field>
        <fdl-field .record=${record} field="phase"></fdl-field>
        <fdl-field .record=${record} field="conditionalOwner"></fdl-field>
    `;
}
