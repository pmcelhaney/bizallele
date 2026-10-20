import { html } from 'lit';
import type { Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

export function conditionalValidationView(record: Record<any>) {
    return html`<fdl-record .record=${record}>
        <fdl-field field="country"></fdl-field>
        <fdl-field field="taxId"></fdl-field>
    </fdl-record>`;
}
