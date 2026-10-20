import { record } from './hashFunction-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function hashFunctionView() {
    return html`
        <fdl-field .record=${record} field="firstId"></fdl-field>
        <fdl-field .record=${record} field="secondId"></fdl-field>
    `;
}
