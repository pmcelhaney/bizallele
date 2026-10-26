import './fdl-code-snippet';
import './fdl-example';
import modelSource from './editable-recordset-model.ts?raw';
import viewSource from './editable-recordset-view.ts?raw';
import cellsSource from './editable-recordset-cells.ts?raw';
import { html } from 'lit';
import { highlightJavaScript } from './highlight-javascript';
import './fdl-editable-recordset';
export function renderEditableRecordset() {
    return html`<article class="site-page"
        ><h1 tabindex="-1">Edit a recordset</h1
        ><p class="description"
            >Keep actual row Records shared between a table and a detail editor
            while changing the view.</p
        >
        <fdl-example
            heading="Edit a recordset"
            .filenames=${['editable-recordset-model.ts', 'editable-recordset-view.ts', 'editable-recordset-cells.ts']}
            .sources=${{ 'editable-recordset-model.ts': modelSource, 'editable-recordset-view.ts': viewSource, 'editable-recordset-cells.ts': cellsSource }}
            ><fdl-editable-recordset></fdl-editable-recordset
        ></fdl-example>
        <h2>Declare child elements for custom cells</h2>
        <p
            >Each column contains a custom element used as a prototype. The
            table creates one instance per row and assigns its
            <code>.field</code> property. The Cells source tab includes the
            child components and their subscription cleanup. Select a shipment,
            edit its quantity, and watch its calculated charge and validation
            update.</p
        >
        <h2>Load once, edit the loaded Records</h2>
        <fdl-code-snippet>
            <pre
                class="code"
            ><code>${highlightJavaScript(`import { field, Recordset } from 'bizallele';
const shipmentFields = {
    id: field.label('Shipment').readOnly(),
    quantity: field
        .label('Quantity')
        .type('number')
        .parser(Number)
        .textAlign('right')
        .required()
        .validator({
            name: 'must be a positive whole number',
            validate: value => Number.isInteger(value) && value > 0,
        }),
    unitPrice: field
        .label('Unit price')
        .type('number')
        .parser(Number)
        .textAlign('right')
        .validator({
            name: 'must be a non-negative number',
            validate: value => Number.isFinite(value) && value >= 0,
        }),
    status: field.label('Status'),
    reason: field
        .label('Hold reason')
        .required(record => record.getField('status') === 'hold'),
};
const shipments = new Recordset(shipmentFields, [
    { id: 'S-101', quantity: 2, unitPrice: 10, status: 'ready', reason: '' },
    {
        id: 'S-102',
        quantity: 5,
        unitPrice: 20,
        status: 'hold',
        reason: 'Awaiting allocation',
    },
]);
await shipments.requestRefresh(); // construction does not load rows
const selected = shipments.allRecords[0];
selected.parseAndSetField('quantity', '3');
// Bind this same selected Record in the cell and detail editors.
// Listen to 'updated' for row edits and 'page-changed' for view changes.
shipments.filter = row => row.getField('status') === 'ready';
await shipments.sort({ field: 'quantity', sort: 'ascending' });
await shipments.requestImmediateUpdate();
// selected still references the same edited Record.`)}</code></pre>
        </fdl-code-snippet>
        <h2>Choose the update policy and aggregate scope</h2>
        <p
            >This example stages sort/filter controls until Apply view. Record
            edits notify consumers but do not automatically reapply the view.
            Calling <code>requestImmediateUpdate()</code> recomputes the view
            from the loaded Records. A hard update refetches and creates Records
            again, so do not use it to re-sort unsaved edits. A client-side
            parameter change alone does not invalidate cached rows.</p
        >
        <p
            >The charge is derived from current quantity × unit price; it is not
            a second stored value to synchronize. Totals intentionally include
            invalid rows so edits remain visible; applications must decide
            whether invalid data contributes to business totals. This example
            has three rows on one page, so “visible” means the current page, not
            all matching pages.</p
        >
        <fdl-code-snippet>
            <pre class="code"><code>${highlightJavaScript(`const total = rows =>
    rows.reduce(
        (sum, row) =>
            sum + row.getField('quantity') * row.getField('unitPrice'),
        0
    );
const allTotal = total(shipments.allRecords);
const visibleTotal = total(shipments.currentPage);
// A reducer modifier also accepts explicit values:
const sumColumn = new Recordset({ amount: field.reducer('sum') }, []).column(
    'amount'
);
const visibleUnits = sumColumn.aggregate(
    shipments.currentPage.map(row => row.getField('quantity'))
);`)}</code></pre>
        </fdl-code-snippet>
        <p
            >Bizallele supplies row state and view operations. The shared
            <code>fdl-table</code> owns table markup, column sizing, and
            pagination; child elements inside <code>fdl-column</code> receive a
            bound <code>Field</code> and supply selection buttons,
            <code>fdl-field</code> editors, calculated charges, and validation.
            Use Tab to move between controls. It supplies no spreadsheet
            arrow-key navigation, persistence, permissions, or conflict
            resolution.</p
        >
        <p
            >Complete implementation:
            <code>examples/fdl-input/editable-recordset-model.ts</code> and
            <code>fdl-editable-recordset.ts</code>. Read
            <a href="#integration">Record and Recordset contracts</a> and
            <a href="#quickstart">adapter setup</a> before adapting the
            bindings.</p
        >
    </article>`;
}
