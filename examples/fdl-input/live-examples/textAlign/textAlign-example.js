import { textAlignView as renderExample } from './textAlign-view.js';
import { ExampleModel } from './textAlign-example-state.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<p class="try"
                >The columns demonstrate left, center, and right alignment.</p
            >${renderExample()}`;
    }
    render() {
        return html`<div class="focused full-width" data-modifier="textAlign"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.alignRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-textalign', ExampleView);
