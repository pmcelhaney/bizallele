import { record } from './record-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-address';
export function recordView() {
    return html` <fdl-field .record=${record} field="address"></fdl-field> `;
}
