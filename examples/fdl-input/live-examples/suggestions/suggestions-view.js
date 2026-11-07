import { record } from './suggestions-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';

export function suggestionsView() {
    return html`<fdl-field .record=${record} field="city"></fdl-field>`;
}
