import { record } from './formatter-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function formatterView() {
    return html` <fdl-field .record=${record} field="amount"></fdl-field> `;
}
