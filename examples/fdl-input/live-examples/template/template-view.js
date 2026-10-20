import { recordset } from './template-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function templateView() {
    return html`<fdl-table .recordset=${recordset}
        ><fdl-column field="invoice"></fdl-column
        ><fdl-column field="balance"></fdl-column
    ></fdl-table>`;
}
