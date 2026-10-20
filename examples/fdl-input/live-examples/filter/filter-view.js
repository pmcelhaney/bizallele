import { recordset } from './filter-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
export function filterView(filters = {}, onFiltersChanged = () => {}) {
    return html`<fdl-table
        .recordset=${recordset}
        .filters=${filters}
        @filters-changed=${onFiltersChanged}
        ><fdl-column field="name"></fdl-column
        ><fdl-column field="team"></fdl-column
    ></fdl-table>`;
}
