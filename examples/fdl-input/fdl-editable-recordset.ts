import {
    editableRecordsetView,
    shipmentDetailView,
} from './editable-recordset-view';
import './fdl-code-snippet';
import { LitElement, html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import {
    createShipments,
    applyShipmentView,
    shipmentTotals,
} from './editable-recordset-model';
import type { Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import './fdl-recordset-inspector';

export class FdlEditableRecordset extends LitElement {
    readonly shipments = createShipments();
    private selected?: Record<any>;
    private status = '';
    private descending = false;
    private ready = false;
    private refresh = () => this.requestUpdate();
    connectedCallback() {
        super.connectedCallback();
        this.shipments.addEventListener('updated', this.refresh);
        this.shipments.addEventListener('page-changed', this.refresh);
        if (!this.ready) void this.load();
    }
    disconnectedCallback() {
        this.shipments.removeEventListener('updated', this.refresh);
        this.shipments.removeEventListener('page-changed', this.refresh);
        super.disconnectedCallback();
    }
    private async load() {
        await this.shipments.requestRefresh();
        this.selected = this.shipments.allRecords[0];
        this.ready = true;
        this.requestUpdate();
    }
    render() {
        if (!this.ready) return html`<p role="status">Loading shipments…</p>`;
        const all = shipmentTotals(this.shipments.allRecords);
        const visible = shipmentTotals(this.shipments.currentPage);
        return html`<p
                >Edit cells or select a shipment’s detail editor. Both editors
                use the same Record object. Set Status to <code>hold</code> to
                require a reason.</p
            >
            <div class="view-controls"
                ><label
                    >Show status
                    <select
                        @change=${(e: Event) => {
                            this.status = (e.target as HTMLSelectElement).value;
                        }}
                        ><option value="">All</option
                        ><option>ready</option
                        ><option>hold</option></select
                    ></label
                >
                <label
                    ><input
                        type="checkbox"
                        @change=${(e: Event) => {
                            this.descending = (
                                e.target as HTMLInputElement
                            ).checked;
                        }}
                    />
                    Highest quantity first</label
                >
                <button
                    @click=${() => applyShipmentView(this.shipments, this.status, this.descending)}
                    >Apply view</button
                ></div
            >
            <p
                >Edits update values, errors, and totals immediately. Rows keep
                their current position and membership until Apply view; an
                edited row may then move or leave the filtered view. Its Record
                and unsaved data remain in All records and in the selected
                detail editor.</p
            >
            <div class="table-scroll"
                >${editableRecordsetView(this.shipments, this.selected, row => {
                    this.selected = row;
                    this.requestUpdate();
                })}</div
            >
            <p role="status"
                >All records: ${all.quantity} units / $${all.charge.toFixed(2)}.
                Visible records: ${visible.quantity} units /
                $${visible.charge.toFixed(2)}.</p
            >
            <h2>Selected shipment: ${this.selected?.getField('id')}</h2>
            ${this.selected ? keyed(this.selected, shipmentDetailView(this.selected)) : ''}
            <fdl-recordset-inspector
                .recordset=${this.shipments}
            ></fdl-recordset-inspector>
            <details
                ><summary>All records, including filtered-out edits</summary
                ><fdl-code-snippet>
                    <pre>
${JSON.stringify(
                            this.shipments.allRecords.map(row => row.values),
                            null,
                            2
                        )}</pre>
                </fdl-code-snippet>
            </details>`;
    }
    static styles = css`
        :host {
            display: block;
        }
        .table-scroll {
            overflow: auto;
        }
        fdl-table {
            min-width: 1400px;
        }
        fdl-field {
            min-width: 140px;
            --field-control-width: 100%;
            --field-label-width: auto;
        }
        .view-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
        }
        button,
        select {
            font: inherit;
            padding: 8px;
        }
        button:focus-visible,
        select:focus-visible,
        input:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 3px;
        }
        p {
            line-height: 1.65;
        }
        pre {
            white-space: pre-wrap;
        }
    `;
}
customElements.define('fdl-editable-recordset', FdlEditableRecordset);
