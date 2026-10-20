import { recordset } from './sortable-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function sortableView() {
    return html`<fdl-table .recordset=${recordset}
        ><fdl-column field="firstName"></fdl-column
        ><fdl-column field="lastName"></fdl-column
        ><fdl-column field="shirtSize"></fdl-column
    ></fdl-table>`;
}
