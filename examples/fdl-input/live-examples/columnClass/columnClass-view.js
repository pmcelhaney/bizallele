import { recordset } from './columnClass-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function columnClassView() {
    return html`<fdl-table .recordset=${recordset}
        ><fdl-column field="day"></fdl-column
        ><fdl-column field="amount"></fdl-column
    ></fdl-table>`;
}
