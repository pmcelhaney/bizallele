import { columnClassView as renderExample } from './columnClass-view.js';
import { ExampleModel } from './columnClass-example-state.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<p class="try"
                >The Expenses column shares its classes across the column,
                heading, and cells. Only the value above 100 adds the
                cell-specific high-value class.</p
            >${renderExample()}`;
    }
    render() {
        return html`<div class="focused full-width" data-modifier="columnClass"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.columnClassRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-columnclass', ExampleView);
