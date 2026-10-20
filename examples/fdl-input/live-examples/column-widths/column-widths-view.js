import { recordset } from './column-widths-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function columnWidthsView() {
    return html`<fdl-table .recordset=${recordset} show-width-diagnostics
        ><fdl-column field="constrained"></fdl-column
        ><fdl-column field="flexible"></fdl-column
    ></fdl-table>`;
}
