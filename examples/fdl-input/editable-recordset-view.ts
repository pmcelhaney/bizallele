import { html } from 'lit';
import type { Record } from 'bizallele';
import { createShipments } from './editable-recordset-model';
import './editable-recordset-cells';
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
        @shipment-select=${(event: CustomEvent<Record<any>>) => onSelect(event.detail)}
        ><fdl-column field="id">
            <shipment-select
                selected-id=${selected?.getField('id') ?? ''}
            ></shipment-select>
        </fdl-column>
        <fdl-column field="quantity"
            ><shipment-editor></shipment-editor
        ></fdl-column>
        <fdl-column field="unitPrice"
            ><shipment-editor></shipment-editor
        ></fdl-column>
        <fdl-column field="status"
            ><shipment-editor></shipment-editor
        ></fdl-column>
        <fdl-column field="reason"
            ><shipment-editor></shipment-editor
        ></fdl-column>
        <fdl-column field="quantity" label="Charge"
            ><shipment-charge></shipment-charge
        ></fdl-column>
        <fdl-column field="id" label="Validation"
            ><shipment-validation></shipment-validation
        ></fdl-column>
    </fdl-table>`;
}

export function shipmentDetailView(record: Record<any>) {
    return html`<fdl-record .record=${record}
        ><fdl-field field="quantity"></fdl-field
        ><fdl-field field="reason"></fdl-field
    ></fdl-record>`;
}
