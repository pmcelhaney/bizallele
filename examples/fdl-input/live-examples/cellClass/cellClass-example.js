import { cellClassView as renderExample } from './cellClass-view.js';
import { ExampleModel } from './cellClass-example-state.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<fdl-field
                .record=${this.probes}
                field="classThreshold"
            ></fdl-field
            >${renderExample()}`;
    }
    render() {
        return html`<div class="focused full-width" data-modifier="cellClass"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.cellClassRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-cellclass', ExampleView);
