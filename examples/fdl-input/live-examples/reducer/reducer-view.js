import { record } from './reducer-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function reducerView() {
    return html`
        <fdl-field .record=${record} field="firstAmount"></fdl-field>
        <fdl-field .record=${record} field="secondAmount"></fdl-field>
        <fdl-field .record=${record} field="thirdAmount"></fdl-field>
    `;
}
