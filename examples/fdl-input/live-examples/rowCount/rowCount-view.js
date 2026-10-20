import { record } from './rowCount-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function rowCountView() {
    return html` <fdl-field .record=${record} field="comments"></fdl-field> `;
}
