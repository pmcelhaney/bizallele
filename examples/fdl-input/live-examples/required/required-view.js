import { person } from './required-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';

export function requiredView() {
    return html`
        <fdl-field .record=${person} field="name"></fdl-field>
        <fdl-field .record=${person} field="followUp"></fdl-field>
        <fdl-field .record=${person} field="followUpNotes"></fdl-field>
    `;
}
