import { sortableView as renderExample } from './sortable-view.js';
import { ExampleModel } from './sortable-example-state.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<p class="try"
                >First name and Last name can sort. T-shirt size has
                .sortable(false), so its header has no sort action.</p
            >${renderExample()}`;
    }
    render() {
        return html`<div class="focused full-width" data-modifier="sortable"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.sortableRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-sortable', ExampleView);
