import { record } from './emptyWhen-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function emptyWhenView() {
    return html`
        <fdl-field .record=${record} field="emptyCode"></fdl-field>
        <fdl-field .record=${record} field="optionalEmptyCode"></fdl-field>
    `;
}
