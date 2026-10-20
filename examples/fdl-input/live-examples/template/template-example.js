import { templateView as renderExample } from './template-view.js';
import { ExampleModel } from './template-example-state.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html` ${renderExample()}`;
    }
    render() {
        return html`<div class="focused full-width" data-modifier="template"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.templateRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-template', ExampleView);
