import { rowCountView as renderExample } from './rowCount-view.js';
import { ExampleModel } from './rowCount-example-state.js';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import 'bizallele/lit/fdl-field';
import '../../fdl-record-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<fdl-field
                .record=${this.probes}
                field="textareaRows"
            ></fdl-field
            >${keyed(this.record.field('comments'), renderExample())}`;
    }
    render() {
        return html`<div class="focused" data-modifier="rowCount"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-record-inspector
                .record=${this.record}
                .fields=${['comments']}
            ></fdl-record-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-rowcount', ExampleView);
