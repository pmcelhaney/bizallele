import { html } from 'lit';
import type { Record } from 'bizallele';
import { createShipments, shipmentCharge } from './editable-recordset-model';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';
import 'bizallele/lit/fdl-table';
export function editableRecordsetView(
    shipments: ReturnType<typeof createShipments>,
    selected: Record<any> | undefined,
    onSelect: (row: Record<any>) => void
) {
    return html`<fdl-table
        .recordset=${shipments}
        aria-label="Editable shipments"
        ><fdl-column
            field="id"
            .renderCell=${(row: Record<any>) =>
                html`<button
                    type="button"
                    @click=${() => onSelect(row)}
                    aria-pressed=${selected === row}
                    >${row.getField('id')}</button
                >`}
        ></fdl-column
        ><fdl-column
            field="quantity"
            .renderCell=${(row: Record<any>) => html`<fdl-field .record=${row} field="quantity" style="min-width: 140px; --field-control-width: 100%;"></fdl-field>`}
        ></fdl-column
        ><fdl-column
            field="unitPrice"
            .renderCell=${(row: Record<any>) => html`<fdl-field .record=${row} field="unitPrice" style="min-width: 140px; --field-control-width: 100%;"></fdl-field>`}
        ></fdl-column
        ><fdl-column
            field="status"
            .renderCell=${(row: Record<any>) => html`<fdl-field .record=${row} field="status" style="min-width: 140px; --field-control-width: 100%;"></fdl-field>`}
        ></fdl-column
        ><fdl-column
            field="reason"
            .renderCell=${(row: Record<any>) => html`<fdl-field .record=${row} field="reason" style="min-width: 140px; --field-control-width: 100%;"></fdl-field>`}
        ></fdl-column
        ><fdl-column
            field="quantity"
            label="Charge"
            .renderCell=${(row: Record<any>) => shipmentCharge(row).toFixed(2)}
        ></fdl-column
        ><fdl-column
            field="id"
            label="Validation"
            .renderCell=${(row: Record<any>) => (row.isValid() ? 'Valid' : row.readableRecordErrors().join('. '))}
        ></fdl-column
    ></fdl-table>`;
}
export function shipmentDetailView(record: Record<any>) {
    return html`<fdl-record .record=${record}
        ><fdl-field field="quantity"></fdl-field
        ><fdl-field field="reason"></fdl-field
    ></fdl-record>`;
}
