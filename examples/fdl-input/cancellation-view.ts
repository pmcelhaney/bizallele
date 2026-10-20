import { html } from 'lit';
import type { Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

export function cancellationView(record: Record<any>) {
    return html`<fdl-record .record=${record}>
        <fdl-field field="status"></fdl-field>
        <fdl-field field="reason"></fdl-field>
    </fdl-record>`;
}
