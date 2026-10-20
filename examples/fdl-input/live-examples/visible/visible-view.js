import { record } from './visible-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function visibleView() {
    return html`
        <fdl-field .record=${record} field="fulfillment"></fdl-field>
        <fdl-field .record=${record} field="address"></fdl-field>
    `;
}
