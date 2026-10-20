import { recordset } from './rowClass-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function rowClassView() {
    return html`<fdl-table .recordset=${recordset}
        ><fdl-column field="status"></fdl-column
        ><fdl-column field="owner"></fdl-column
    ></fdl-table>`;
}
