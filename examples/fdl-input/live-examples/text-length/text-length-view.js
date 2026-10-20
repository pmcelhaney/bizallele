import { record } from './text-length-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
export function textLengthView() {
    return html`<fdl-field .record=${record} field="code"></fdl-field>`;
}
