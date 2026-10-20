import { record } from './defaultValue-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function defaultValueView() {
    return html`
        <fdl-field .record=${record} field="documentTitle"></fdl-field>
    `;
}
