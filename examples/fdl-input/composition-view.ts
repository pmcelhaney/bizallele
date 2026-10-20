import { html } from 'lit';
import type { Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

export function compositionView(record: Record<any>) {
    return html`<fdl-record .record=${record}>
        <fdl-field field="fulfillment"></fdl-field>
        <fdl-field field="address"></fdl-field>
    </fdl-record>`;
}
